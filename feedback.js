/* ====== PENGATURAN — isi salah satu supaya feedback sampai ke kamu ======
   1) ENDPOINT: alamat penerima, mis. Formspree → 'https://formspree.io/f/xxxxxxxx'
      (daftar gratis di formspree.io → New Form → salin URL-nya ke sini; feedback masuk ke emailmu)
   2) MAILTO: cadangan — isi emailmu, aplikasi email pengirim akan terbuka berisi feedback-nya
   Kalau keduanya kosong, feedback hanya tersimpan di browser pengirim (dan pengirim diberi tahu). */
const ENDPOINT = 'https://formspree.io/f/mvkkqjjq'; // server.js bawaan (baca di admin.html). Situs statis tanpa server? Ganti dengan URL Formspree.
const MAILTO = '';

const KINDS = ['Saran', 'Bug', 'Fitur Baru', 'Pujian'];
const $ = id => document.getElementById(id);
let rating = 0, kind = KINDS[0];

$('stars').innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" class="star" data-n="${n}" aria-label="${n} bintang">★</button>`).join('');
$('stars').onclick = e => {
  const n = +e.target.dataset.n; if (!n) return;
  rating = n;
  document.querySelectorAll('.star').forEach(s => s.classList.toggle('on', +s.dataset.n <= rating));
};

$('kinds').innerHTML = KINDS.map(k => `<span class="chip ${k === kind ? 'sel' : ''}">${k}</span>`).join('');
$('kinds').onclick = e => {
  if (!e.target.classList.contains('chip')) return;
  kind = e.target.textContent;
  document.querySelectorAll('#kinds .chip').forEach(c => c.classList.toggle('sel', c === e.target));
};

$('msg').oninput = () => { $('cnt').textContent = $('msg').value.length; };

function note(text, cls) {
  const n = $('fbMsg'); n.hidden = !text; n.textContent = text || ''; n.className = 'note ' + (cls || '');
}

$('fbForm').onsubmit = async e => {
  e.preventDefault();
  if ($('hp').value) return; // kolom jebakan: manusia tidak mengisinya
  const message = $('msg').value.trim();
  if (!rating && message.length < 5) return note('Beri bintang atau tulis pesan singkat dulu ya.', 'err');
  if (Date.now() - (+localStorage.getItem('ks_fb_t') || 0) < 15000) return note('Tunggu sebentar sebelum mengirim lagi.', 'err');

  const data = {
    rating, kind, message,
    name: $('nm').value.trim(), contact: $('ct').value.trim(),
    time: new Date().toISOString(), page: location.origin
  };
  $('send').disabled = true; note('Mengirim…');

  try {
    if (ENDPOINT) {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error('server ' + r.status);
    } else if (MAILTO) {
      const subject = `Feedback Kotak Studio — ${kind}${rating ? ' (' + rating + '★)' : ''}`;
      const body = `${message}\n\n— ${data.name || 'Anonim'} ${data.contact}`;
      location.href = `mailto:${MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      // belum ada penerima: simpan di browser ini supaya tidak hilang, dan jujur ke pengirim
      const all = JSON.parse(localStorage.getItem('ks_feedback') || '[]'); all.push(data);
      localStorage.setItem('ks_feedback', JSON.stringify(all));
      note('Feedback belum bisa dikirim karena penerimanya belum disambungkan (lihat feedback.js). Isinya tersimpan di browser ini.', 'err');
      $('send').disabled = false; return;
    }
    localStorage.setItem('ks_fb_t', Date.now());
    $('fbForm').hidden = true; $('done').hidden = false;
  } catch (err) {
    note('Gagal mengirim (' + err.message + '). Coba lagi ya.', 'err');
    $('send').disabled = false;
  }
};