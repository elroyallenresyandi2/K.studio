const $ = id => document.getElementById(id);
const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2400); };

async function api(path, opt = {}) {
  const r = await fetch(path, { credentials: 'same-origin', ...opt, headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) } });
  let data = null; try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error((data && data.error) || 'Error ' + r.status); e.status = r.status; throw e; }
  return data;
}
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/* ---------- login ---------- */
async function boot() {
  try { await api('/api/admin/me'); showDash(); }
  catch { $('login').hidden = false; $('dash').hidden = true; $('logout').hidden = true; }
}
$('lgo').onclick = async () => {
  $('lerr').hidden = true;
  try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('pw').value }) }); $('pw').value = ''; showDash(); }
  catch (e) { $('lerr').textContent = e.message; $('lerr').hidden = false; }
};
$('pw').onkeydown = e => { if (e.key === 'Enter') $('lgo').click(); };
$('logout').onclick = async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); location.reload(); };
function showDash() { $('login').hidden = true; $('dash').hidden = false; $('logout').hidden = false; loadFrames(); loadColls(); loadFeedback(); }

/* ---------- tab ---------- */
document.querySelectorAll('.tabs .chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('.tabs .chip').forEach(x => x.classList.toggle('sel', x === c));
  $('t-frames').hidden = c.dataset.t !== 'frames'; $('t-fb').hidden = c.dataset.t !== 'fb'; $('t-coll').hidden = c.dataset.t !== 'coll';
});

/* ---------- tambah frame: deteksi jendela (transparan atau abu-abu #D9D9D9) ---------- */
let adminColls = []; // koleksi buatan admin
function fillColls(frames) { // pilihan koleksi: bawaan + buatan admin + yang dipakai frame
  const sel = $('coll'), cur = sel.value, names = [];
  const add = n => { if (n && !names.some(x => x.toLowerCase() === n.toLowerCase())) names.push(n); };
  COLLECTIONS.forEach(c => add(c.n)); adminColls.forEach(c => add(c.n)); frames.forEach(f => add(f.coll));
  sel.replaceChildren(new Option('➕ Koleksi baru (tulis namanya di samping)', '__new'));
  names.forEach(n => sel.append(new Option(n, n)));
  sel.value = [...sel.options].some(o => o.value === cur) ? cur : '__new';
  $('cl').replaceChildren(...names.map(n => { const o = document.createElement('option'); o.value = n; return o; }));
  $('newcoll').disabled = sel.value !== '__new';
}
fillColls([]);
$('coll').onchange = () => { $('newcoll').disabled = $('coll').value !== '__new'; };
$('newcoll').oninput = () => { $('newcoll').dataset.edited = 1; };
$('nm').oninput = () => { if ($('coll').value === '__new' && !$('newcoll').dataset.edited) $('newcoll').value = $('nm').value; };
let pending = null; // { dataUrl, wins }
$('file').onchange = async () => {
  const f = $('file').files[0]; $('ed').hidden = true; $('ferr').hidden = true; pending = null;
  if (!f) return;
  if (f.size > 6e6) return alert('PNG terlalu besar (maks. 6 MB).');
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f); }).catch(() => null);
  if (!img) return alert('File tidak bisa dibaca sebagai gambar PNG.');
  const r = analyzeFrame(img), { W, H, wins } = r;

  const pv = $('pv'); pv.width = W; pv.height = H; const px = pv.getContext('2d');
  px.drawImage(r.canvas, 0, 0); px.lineWidth = Math.max(3, W / 250); px.strokeStyle = '#ff3b6b'; px.fillStyle = '#ff3b6b';
  px.font = `bold ${Math.round(W / 14)}px sans-serif`; px.textAlign = 'center'; px.textBaseline = 'middle';
  wins.forEach(([wx, wy, ww, wh], i) => { px.strokeRect(wx, wy, ww, wh); px.fillText(i + 1, wx + ww / 2, wy + wh / 2); });

  const ratios = wins.map(w => w[2] / w[3]);
  const mixed = ratios.length > 1 && Math.max(...ratios) / Math.min(...ratios) > 1.03;
  $('info').textContent = wins.length
    ? `Ukuran ${W} × ${H} px · ${wins.length} jendela foto terdeteksi` + (r.mode === 'abu-abu' ? ' · kotak abu-abu diubah jadi transparan otomatis' : '') +
      (mixed ? ' · ⚠️ ukuran jendela berbeda-beda — sebaiknya sama agar foto tidak gepeng' : '')
    : '⚠️ Jendela foto tidak ditemukan. Pastikan area foto abu-abu #D9D9D9 polos (atau transparan) dan cukup besar.';
  $('save').disabled = !wins.length;
  $('nm').value = f.name.replace(/\.png$/i, '').replace(/[_-]+/g, ' ').slice(0, 40);
  $('bg').value = r.bg;
  delete $('newcoll').dataset.edited; $('newcoll').value = $('nm').value; // bawaan: frame punya koleksi sendiri sesuai namanya
  pending = { dataUrl: r.canvas.toDataURL('image/png'), wins }; $('ed').hidden = false;
};

$('save').onclick = async () => {
  if (!pending) return;
  $('ferr').hidden = true; $('save').disabled = true;
  try {
    await api('/api/admin/frames', { method: 'POST', body: JSON.stringify({
      name: $('nm').value, png: pending.dataUrl, wins: pending.wins, ink: $('ink').value, bg: $('bg').value, text: $('txt').checked,
      coll: $('coll').value === '__new' ? ($('newcoll').value.trim() || $('nm').value.trim()) : $('coll').value
    }) });
    toast('Frame diterbitkan ✦ — langsung muncul di situs'); $('file').value = ''; $('ed').hidden = true; pending = null; loadFrames();
  } catch (e) { $('ferr').textContent = e.message; $('ferr').hidden = false; }
  $('save').disabled = false;
};

/* ---------- daftar frame ---------- */
async function loadFrames() {
  const list = await api('/api/frames'), box = $('flist'); box.replaceChildren(); fillColls(list);
  if (!list.length) { box.append(el('div', 'empty', 'Belum ada frame tambahan.')); return; }
  list.forEach(f => {
    const c = el('div', 'fcard'), img = el('img'); img.src = f.src; img.alt = f.name;
    const nm = el('input'), cl = el('input'), row = el('div', 'row2'), save = el('button', 'btn', 'Simpan'), del = el('button', 'btn', 'Hapus');
    nm.value = f.name; nm.maxLength = 40; nm.placeholder = 'Nama frame';
    cl.value = f.coll || ''; cl.maxLength = 30; cl.placeholder = 'Koleksi (kosong = Lainnya)'; cl.setAttribute('list', 'cl');
    save.onclick = async () => {
      await api('/api/admin/frames/' + f.id, { method: 'PATCH', body: JSON.stringify({ name: nm.value, coll: cl.value }) });
      toast('Tersimpan ✦ — muncul di koleksi itu saat situs di-refresh'); loadFrames();
    };
    del.onclick = async () => {
      if (!confirm(`Hapus frame "${f.name}"? Frame ini akan hilang dari situs.`)) return;
      await api('/api/admin/frames/' + f.id, { method: 'DELETE' }); toast('Frame dihapus'); loadFrames();
    };
    row.append(save, del); c.append(img, nm, cl, el('span', '', `${f.wins.length} foto · ${f.w}×${f.h}`), row); box.append(c);
  });
}

/* ---------- koleksi ---------- */
async function loadColls() {
  adminColls = await api('/api/collections');
  const frames = await api('/api/frames'), box = $('clist'); box.replaceChildren();
  if (!adminColls.length) box.append(el('div', 'empty', 'Belum ada koleksi buatan admin.'));
  adminColls.forEach(c => {
    const n = frames.filter(f => (f.coll || '').toLowerCase() === c.n.toLowerCase()).length;
    const card = el('div', 'fcard'), nm = el('input'), ds = el('input'), row = el('div', 'row2');
    const save = el('button', 'btn', 'Simpan'), del = el('button', 'btn', 'Hapus');
    nm.value = c.n; nm.maxLength = 30; ds.value = c.desc || ''; ds.maxLength = 60; ds.placeholder = 'Deskripsi';
    save.onclick = async () => {
      try { await api('/api/admin/collections/' + c.id, { method: 'PATCH', body: JSON.stringify({ name: nm.value, desc: ds.value }) }); toast('Tersimpan ✦'); loadColls(); loadFrames(); }
      catch (e) { alert(e.message); }
    };
    del.onclick = async () => {
      if (!confirm(`Hapus koleksi "${c.n}"?` + (n ? ` ${n} frame di dalamnya akan pindah ke "Lainnya".` : ''))) return;
      await api('/api/admin/collections/' + c.id, { method: 'DELETE' }); toast('Koleksi dihapus'); loadColls(); loadFrames();
    };
    row.append(save, del); card.append(el('b', '', '📁 ' + c.n), nm, ds, el('span', '', n + ' frame'), row); box.append(card);
  });
  $('blt').textContent = COLLECTIONS.map(c => c.n).join(' · ') + ' — koleksi bawaan diatur lewat designs.js';
  fillColls(frames);
}
$('cmake').onclick = async () => {
  $('cerr').hidden = true; const name = $('cname').value.trim();
  if (COLLECTIONS.some(c => c.n.toLowerCase() === name.toLowerCase())) { $('cerr').textContent = 'Nama itu sudah dipakai koleksi bawaan.'; $('cerr').hidden = false; return; }
  try {
    await api('/api/admin/collections', { method: 'POST', body: JSON.stringify({ name, desc: $('cdesc').value }) });
    $('cname').value = $('cdesc').value = ''; toast('Koleksi dibuat ✦ — sekarang bisa dipilih saat mengunggah frame'); loadColls();
  } catch (e) { $('cerr').textContent = e.message; $('cerr').hidden = false; }
};

/* ---------- feedback (semua teks pakai textContent → aman dari XSS) ---------- */
async function loadFeedback() {
  const list = await api('/api/admin/feedback'), box = $('blist'); box.replaceChildren();
  $('fbn').textContent = list.length ? `(${list.length})` : '';
  if (!list.length) { box.append(el('div', 'empty', 'Belum ada feedback masuk.')); return; }
  list.forEach(f => {
    const it = el('div', 'fb-item'), head = el('div', 'fb-head');
    head.append(el('span', 'fb-stars', f.rating ? '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating) : '—'), el('span', 'chip', f.kind),
      el('span', '', new Date(f.time).toLocaleString('id-ID')), el('span', '', [f.name, f.contact].filter(Boolean).join(' · ')));
    const del = el('button', 'btn', 'Hapus');
    del.onclick = async () => { await api('/api/admin/feedback/' + f.id, { method: 'DELETE' }); loadFeedback(); };
    it.append(head, el('div', 'fb-msg', f.message || '(tanpa pesan)'), del); box.append(it);
  });
}

boot();