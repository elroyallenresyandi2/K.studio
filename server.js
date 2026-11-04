// server.js — Kotak Studio: situs + feedback + admin frame. Tanpa dependency npm.
// Jalankan:  node server.js   →  buka http://localhost:3000   (admin: /admin.html)
//
// Env (opsional):  PORT, ADMIN_PASSWORD, DATA_DIR (folder penyimpanan; arahkan ke disk permanen saat hosting)

const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const UP = path.join(DATA, 'uploads');
fs.mkdirSync(UP, { recursive: true });

// ---------- penyimpanan JSON sederhana ----------
const FB_FILE = path.join(DATA, 'feedback.json'), FR_FILE = path.join(DATA, 'frames.json'), CO_FILE = path.join(DATA, 'collections.json');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, o) => { fs.writeFileSync(f + '.tmp', JSON.stringify(o)); fs.renameSync(f + '.tmp', f); };
let feedback = readJson(FB_FILE, []), frames = readJson(FR_FILE, []), collections = readJson(CO_FILE, []);

// ---------- rahasia & password admin ----------
function persisted(name, make) {
  const f = path.join(DATA, name);
  try { return fs.readFileSync(f, 'utf8').trim(); }
  catch { const v = make(); fs.writeFileSync(f, v, { mode: 0o600 }); return v; }
}
const SECRET = persisted('secret.txt', () => crypto.randomBytes(32).toString('hex'));
let PASS = process.env.ADMIN_PASSWORD;
if (!PASS) {
  PASS = persisted('admin-password.txt', () => crypto.randomBytes(9).toString('base64url'));
  console.log('Password admin (tersimpan di data/admin-password.txt):', PASS);
}
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const sha = s => crypto.createHash('sha256').update(s).digest();
const mkToken = () => { const exp = Date.now() + 7 * 864e5; return exp + '.' + sign(String(exp)); };
function isAdmin(req) {
  const m = /(?:^|;\s*)ks_admin=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- pembatas laju (anti-spam / tebak password) ----------
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < ms);
  a.push(now); hits.set(key, a); return a.length > max;
}
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

// ---------- util HTTP ----------
const send = (res, code, obj, headers = {}) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(obj));
};
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', d => {
      n += d.length;
      if (n > max) { reject(Object.assign(new Error('Data terlalu besar'), { code: 413 })); req.destroy(); return; }
      chunks.push(d);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { reject(Object.assign(new Error('JSON tidak valid'), { code: 400 })); }
    });
    req.on('error', reject);
  });
}
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp'
};
function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Tidak ditemukan'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}
const color = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff');

// ---------- handler ----------
const server = http.createServer(async (req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(res, 400, { error: 'URL tidak valid' }); }

  try {
    // ===== publik =====
    if (p === '/api/frames' && req.method === 'GET') {
      return send(res, 200, frames.map(f => ({
        id: f.id, name: f.name, src: '/uploads/' + f.id + '.png', w: f.w, h: f.h,
        wins: f.wins, ink: f.ink, bg: f.bg, text: !!f.text, coll: f.coll || ''
      })));
    }
    if (p === '/api/collections' && req.method === 'GET') {
      return send(res, 200, collections.map(c => ({ id: c.id, n: c.n, desc: c.desc || '' })));
    }
    if (p === '/api/feedback' && req.method === 'POST') {
      if (limited('fb' + ipOf(req), 5, 3600e3)) return send(res, 429, { error: 'Terlalu sering mengirim, coba lagi nanti.' });
      const b = await readBody(req, 20e3);
      const message = String(b.message || '').trim().slice(0, 1000);
      const rating = Math.max(0, Math.min(5, Math.round(+b.rating || 0)));
      if (!rating && message.length < 5) return send(res, 400, { error: 'Isi pesan atau beri bintang.' });
      feedback.unshift({
        id: crypto.randomUUID(), rating,
        kind: ['Saran', 'Bug', 'Fitur Baru', 'Pujian'].includes(b.kind) ? b.kind : 'Saran',
        message, name: String(b.name || '').slice(0, 60), contact: String(b.contact || '').slice(0, 80),
        time: new Date().toISOString()
      });
      feedback = feedback.slice(0, 2000);
      writeJson(FB_FILE, feedback);
      return send(res, 201, { ok: true });
    }
    if (/^\/uploads\/[a-f0-9]{10}\.png$/.test(p) && req.method === 'GET') {
      return serveFile(res, path.join(UP, path.basename(p)));
    }

    // ===== admin =====
    if (p === '/api/admin/login' && req.method === 'POST') {
      if (limited('lg' + ipOf(req), 8, 600e3)) return send(res, 429, { error: 'Terlalu banyak percobaan. Tunggu 10 menit.' });
      const b = await readBody(req, 2e3);
      if (!crypto.timingSafeEqual(sha(String(b.password || '')), sha(PASS))) return send(res, 401, { error: 'Password salah' });
      const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
      return send(res, 200, { ok: true }, { 'Set-Cookie': `ks_admin=${mkToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure}` });
    }
    if (p === '/api/admin/logout' && req.method === 'POST') {
      return send(res, 200, { ok: true }, { 'Set-Cookie': 'ks_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (p.startsWith('/api/admin/')) {
      if (!isAdmin(req)) return send(res, 401, { error: 'Belum login' });

      if (p === '/api/admin/me' && req.method === 'GET') return send(res, 200, { ok: true });
      if (p === '/api/admin/feedback' && req.method === 'GET') return send(res, 200, feedback);

      let m = /^\/api\/admin\/feedback\/([\w-]{1,40})$/.exec(p);
      if (m && req.method === 'DELETE') {
        feedback = feedback.filter(f => f.id !== m[1]); writeJson(FB_FILE, feedback);
        return send(res, 200, { ok: true });
      }

      // --- koleksi (folder di halaman Layout) ---
      if (p === '/api/admin/collections' && req.method === 'POST') {
        const b = await readBody(req, 3e3), n = String(b.name || '').trim().slice(0, 30), desc = String(b.desc || '').trim().slice(0, 60);
        if (!n) return send(res, 400, { error: 'Nama koleksi wajib diisi' });
        if (collections.some(c => c.n.toLowerCase() === n.toLowerCase())) return send(res, 409, { error: 'Koleksi dengan nama itu sudah ada' });
        const c = { id: crypto.randomBytes(4).toString('hex'), n, desc, time: new Date().toISOString() };
        collections.push(c); writeJson(CO_FILE, collections);
        return send(res, 201, { ok: true, id: c.id });
      }
      m = /^\/api\/admin\/collections\/([a-f0-9]{8})$/.exec(p);
      if (m && req.method === 'PATCH') {
        const c = collections.find(x => x.id === m[1]);
        if (!c) return send(res, 404, { error: 'Koleksi tidak ditemukan' });
        const b = await readBody(req, 3e3);
        if (typeof b.desc === 'string') c.desc = b.desc.trim().slice(0, 60);
        const n = typeof b.name === 'string' ? b.name.trim().slice(0, 30) : '';
        if (n && n !== c.n) {
          if (collections.some(x => x !== c && x.n.toLowerCase() === n.toLowerCase())) return send(res, 409, { error: 'Koleksi dengan nama itu sudah ada' });
          frames.forEach(f => { if ((f.coll || '').toLowerCase() === c.n.toLowerCase()) f.coll = n; }); // frame ikut pindah nama
          c.n = n; writeJson(FR_FILE, frames);
        }
        writeJson(CO_FILE, collections);
        return send(res, 200, { ok: true });
      }
      if (m && req.method === 'DELETE') {
        const c = collections.find(x => x.id === m[1]);
        if (c) { frames.forEach(f => { if ((f.coll || '').toLowerCase() === c.n.toLowerCase()) f.coll = ''; }); writeJson(FR_FILE, frames); } // frame jadi "Lainnya"
        collections = collections.filter(x => x.id !== m[1]); writeJson(CO_FILE, collections);
        return send(res, 200, { ok: true });
      }

      if (p === '/api/admin/frames' && req.method === 'POST') {
        const b = await readBody(req, 8e6);
        const mm = /^data:image\/png;base64,(.+)$/s.exec(String(b.png || ''));
        if (!mm) return send(res, 400, { error: 'File harus PNG' });
        const buf = Buffer.from(mm[1], 'base64');
        if (buf.length < 100 || buf.readUInt32BE(0) !== 0x89504e47) return send(res, 400, { error: 'PNG tidak valid' });
        const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // ukuran asli dibaca dari header PNG
        if (w < 200 || h < 200 || w > 6000 || h > 9000) return send(res, 400, { error: 'Ukuran PNG harus 200–6000 × 200–9000 px' });
        const wins = (Array.isArray(b.wins) ? b.wins : []).slice(0, 12).map(r => Array.isArray(r) ? r.map(Math.round) : []);
        const bad = !wins.length || wins.some(r => r.length !== 4 || r.some(n => !Number.isFinite(n)) ||
          r[2] < 20 || r[3] < 20 || r[0] < 0 || r[1] < 0 || r[0] + r[2] > w || r[1] + r[3] > h);
        if (bad) return send(res, 400, { error: 'Posisi jendela foto tidak valid' });
        const id = crypto.randomBytes(5).toString('hex');
        fs.writeFileSync(path.join(UP, id + '.png'), buf);
        frames.push({
          id, name: String(b.name || '').trim().slice(0, 40) || 'Frame baru', w, h, wins,
          ink: color(b.ink), bg: color(b.bg), text: !!b.text, coll: String(b.coll || '').trim().slice(0, 30), time: new Date().toISOString()
        });
        writeJson(FR_FILE, frames);
        return send(res, 201, { ok: true, id });
      }
      m = /^\/api\/admin\/frames\/([a-f0-9]{10})$/.exec(p);
      if (m && req.method === 'DELETE') {
        frames = frames.filter(f => f.id !== m[1]); writeJson(FR_FILE, frames);
        fs.rm(path.join(UP, m[1] + '.png'), () => {});
        return send(res, 200, { ok: true });
      }
      if (m && req.method === 'PATCH') { // ubah nama / koleksi frame
        const b = await readBody(req, 5e3), f = frames.find(x => x.id === m[1]);
        if (!f) return send(res, 404, { error: 'Frame tidak ditemukan' });
        if (typeof b.name === 'string' && b.name.trim()) f.name = b.name.trim().slice(0, 40);
        if (typeof b.coll === 'string') f.coll = b.coll.trim().slice(0, 30);
        writeJson(FR_FILE, frames);
        return send(res, 200, { ok: true });
      }
      return send(res, 404, { error: 'Tidak ditemukan' });
    }

    // ===== file statis (situs) =====
    if (req.method === 'GET') {
      const rel = (p === '/' ? 'index.html' : p.replace(/^\/+/, ''));
      const parts = rel.split('/');
      const blocked = parts.some(s => s.startsWith('.') || s === 'data' || s === 'node_modules') ||
        ['server.js', 'package.json', 'package-lock.json'].includes(parts[parts.length - 1]);
      const file = path.join(ROOT, rel);
      if (!blocked && file.startsWith(ROOT + path.sep) && MIME[path.extname(file).toLowerCase()]) return serveFile(res, file);
    }
    return send(res, 404, { error: 'Tidak ditemukan' });
  } catch (err) {
    if (err.code === 413 || err.code === 400) return send(res, err.code, { error: err.message });
    console.error(err);
    return send(res, 500, { error: 'Terjadi kesalahan di server' });
  }
});

server.listen(PORT, () => console.log(`Kotak Studio jalan di http://localhost:${PORT}  (admin: /admin.html)`));