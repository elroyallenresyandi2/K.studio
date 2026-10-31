const $ = id => document.getElementById(id);
const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200); };
let res = null;

COLLECTIONS.forEach(c => $('coll').append(new Option(`${c.n}  (${c.id})`, c.id)));
$('coll').append(new Option('➕ Koleksi baru…', '__new'));

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'desain';
const q = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); // aman ditaruh di dalam '...'
const usedKeys = () => new Set([...Object.keys(DESIGNS), ...COLLECTIONS.flatMap(c => c.designs)]);

$('file').onchange = async () => {
  const f = $('file').files[0]; $('out').hidden = true; res = null; if (!f) return;
  const url = URL.createObjectURL(f);
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; }).catch(() => null);
  if (!img) return alert('File tidak bisa dibaca sebagai gambar PNG.');
  res = analyzeFrame(img);

  const pv = $('pv'), { W, H, wins } = res; pv.width = W; pv.height = H;
  const px = pv.getContext('2d'); px.drawImage(res.canvas, 0, 0);
  px.lineWidth = Math.max(3, W / 250); px.strokeStyle = '#ff3b6b'; px.fillStyle = '#ff3b6b';
  px.font = `bold ${Math.round(W / 14)}px sans-serif`; px.textAlign = 'center'; px.textBaseline = 'middle';
  wins.forEach(([wx, wy, ww, wh], i) => { px.strokeRect(wx, wy, ww, wh); px.fillText(i + 1, wx + ww / 2, wy + wh / 2); });

  const ratios = wins.map(w => w[2] / w[3]);
  const mixed = ratios.length > 1 && Math.max(...ratios) / Math.min(...ratios) > 1.03;
  $('info').textContent = wins.length
    ? `Ukuran ${W} × ${H} px · ${wins.length} jendela foto terdeteksi (${res.mode === 'abu-abu' ? 'kotak abu-abu diubah jadi transparan' : 'sudah transparan'})` +
      (mixed ? ' · ⚠️ ukuran jendela berbeda-beda — sebaiknya sama agar foto tidak gepeng' : '')
    : '⚠️ Jendela foto tidak ditemukan. Pastikan area foto berwarna abu-abu #D9D9D9 polos (atau transparan) dan cukup besar.';
  $('nm').value = f.name.replace(/\.png$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 40);
  $('bg').value = res.bg;
  $('out').hidden = !wins.length;
  if (!wins.length) alert($('info').textContent);
  build();
};

function build() {
  if (!res) return;
  const name = $('nm').value.trim() || 'Desain Baru', file = slug(name), used = usedKeys();
  let key = file.replace(/-/g, '').slice(0, 6) || 'dsn', n = 2; const base = key;
  while (used.has(key)) key = base + n++;
  const sel = $('coll').value, newName = $('newcoll').value.trim() || 'Koleksi Baru';
  $('fname').textContent = `Simpan sebagai  frames/${file}.png`;
  const wins = res.wins.map(w => `[${w.join(', ')}]`).join(', ');
  const ink = $('ink').value, bg = $('bg').value;

  $('c1').value =
`  ${key}: {
    n: '${q(name)}', w: ${res.W}, h: ${res.H}, text: ${$('txt').checked}, desc: '${res.wins.length} foto.',
    wins: [${wins}],
    vars: [
      { n: 'Asli', src: 'frames/${file}.png', bg: '${bg}', ink: '${ink}', c: '${bg}' },
    ],
  },`;

  $('c2').value = sel === '__new'
    ? `  { id: '${slug(newName)}', n: '${q(newName)}', desc: 'desain ${q(newName)}', designs: ['${key}'] },\n// ← tempel baris ini di dalam COLLECTIONS = [ … ]`
    : `// Di koleksi "${sel}" (cari baris id: '${sel}' di COLLECTIONS), tambahkan  '${key}'  ke dalam daftar designs:\n//   designs: [ …, '${key}' ]`;

  $('c3').value = `      { n: 'Varian baru', src: 'frames/${file}.png', bg: '${bg}', ink: '${ink}', c: '${bg}' },`;
}
['nm', 'ink', 'bg', 'txt', 'coll', 'newcoll'].forEach(id => $(id).oninput = $(id).onchange = build);

$('dlpng').onclick = () => {
  if (!res) return;
  res.canvas.toBlob(b => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = slug($('nm').value.trim() || 'desain') + '.png'; a.click(); toast('PNG diunduh — simpan ke folder frames ✦');
  }, 'image/png');
};
document.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => {
  const t = $(b.dataset.copy); t.select();
  try { await navigator.clipboard.writeText(t.value); toast('Kode disalin ✦'); } catch { document.execCommand('copy'); toast('Kode disalin ✦'); }
});
