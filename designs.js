/* =====================================================================
   designs.js — DAFTAR KOLEKSI & DESAIN KOTAK STUDIO
   Cara menambah desain baru: baca TAMBAH-DESAIN.md (atau buka tool.html,
   unggah PNG-mu, lalu salin kode yang dihasilkan ke sini).

   COLLECTIONS = "folder" di halaman Layout. Isinya daftar kunci desain.
   DESIGNS     = desain berbasis gambar PNG (jendela foto transparan).
     n     nama desain          w,h   ukuran PNG (piksel)
     wins  jendela foto [x, y, lebar, tinggi]  → dibuat otomatis oleh tool.html
     text  true = aplikasi menulis "Kotak Studio" + tanggal di bawah foto
     vi    varian yang dipilih lebih dulu (0 = pertama)
     vars  varian warna: { n:nama, src:file PNG, bg:warna latar, ink:warna tulisan, c:warna titik pilihan }
   ===================================================================== */

const COLLECTIONS = [
  { id: 'klasik', n: 'Klasik',       desc: 'layout dasar & roll film', designs: ['s4', 's3', 'g4', 'p1', 'fr'] },
  { id: 'rc',     n: 'Reality Club', desc: 'desain Reality Club',      designs: ['rc', 'tn', 'dq'] },
  { id: 'lany',   n: 'Lany',         desc: 'desain bertema Lany',      designs: ['ly', 'ilysb'] },
  { id: 'hw',     n: 'Halloween',    desc: 'spesial Halloween 🎃',     designs: ['hw', 'hd'] },
  { id: 're',     n: 'Resident Evil', desc: 'desain Resident Evil',    designs: ['re6'] },
  { id: 'toy',    n: 'Toy Story',     desc: 'desain Toy Story',        designs: ['toy'] },
  { id: 'so7',    n: 'Sheila on 7',   desc: 'desain Sheila on 7',      designs: ['so7'] },
  { id: 'laufey', n: 'Laufey',       desc: 'desain Laufey',            designs: ['promise'] },
];

const DESIGNS = {
  rc: {
    n: 'Enough For You', w: 862, h: 2518, text: true, vi: 1, desc: '3 foto, gaya editorial hitam dengan pita gradasi.',
    wins: [[62, 551, 738, 554], [62, 1160, 738, 554], [62, 1768, 738, 554]],
    vars: [
      { n: 'Merah', src: 'frames/reality-club.png',      bg: '#070101', ink: '#f5f5f5', c: '#ff0000' },
      { n: 'Biru',  src: 'frames/reality-club-biru.png', bg: '#070101', ink: '#f5f5f5', c: '#0066ff' },
    ],
  },
  tn: {
    n: 'Telenovia', w: 580, h: 1373, text: false, desc: '1 foto besar dengan kutipan dan logo Reality Club.',
    wins: [[49, 383, 482, 662]],
    vars: [
      { n: 'Merah', src: 'frames/telenovia.png',      bg: '#070101', ink: '#f5f5f5', c: '#a00a0a' },
      { n: 'Biru',  src: 'frames/telenovia-biru.png', bg: '#010107', ink: '#f5f5f5', c: '#0a3fa0' },
    ],
  },
  ly: {
    n: 'XXL · a beautiful blur', w: 579, h: 1373, text: false, desc: '3 foto, tema biru dengan piringan hitam dan bintang.',
    wins: [[52, 286, 474, 294], [52, 616, 474, 294], [52, 946, 474, 294]],
    vars: [
      { n: 'Biru', src: 'frames/lany-1.png', bg: '#0736a0', ink: '#ffffff', c: '#0736a0' },
    ],
  },
  fr: {
    n: 'Film Roll', w: 720, h: 2102, notitle: true, nodate: false, desc: 'Roll film analog dengan lubang sprocket, 4 pose.',
    wins: [[79, 119, 562, 422], [79, 583, 562, 422], [79, 1047, 562, 422], [79, 1511, 562, 422]],
    vars: [
      { n: 'Amber', src: 'frames/film-roll.png',      bg: '#14100d', ink: '#f2a516', c: '#f2a516' },
      { n: 'Biru',  src: 'frames/film-roll-biru.png', bg: '#0a1020', ink: '#6aa7ff', c: '#6aa7ff' },
    ],
  },
  promise: {
    n: 'Promise', w: 580, h: 1373, text: false, desc: '1 foto.',
    wins: [[49, 383, 482, 662]],
    vars: [
      { n: 'Asli', src: 'frames/Promise.png', bg: '#ebd4d3', ink: '#ffffff', c: '#ebd4d3' },
    ],
  },
  ilysb: {
    n: 'ILYSB', w: 580, h: 1373, text: false, desc: '3 foto, mawar merah dan gitar.',
    wins: [[53, 286, 474, 294], [53, 616, 474, 294], [53, 946, 474, 294]],
    vars: [
      { n: 'Merah', src: 'frames/ilysb.png', bg: '#984b45', ink: '#ffffff', c: '#984b45' },
    ],
  },
  re6: {
    n: 'RE 6', w: 580, h: 1373, text: false, desc: '3 foto, payung Umbrella dan Raccoon City.',
    wins: [[53, 286, 474, 294], [53, 616, 474, 294], [53, 946, 474, 294]],
    vars: [
      { n: 'Asli', src: 'frames/re6.png', bg: '#38191a', ink: '#ffffff', c: '#38191a' },
    ],
  },
  toy: {
    n: 'Toy Story', w: 580, h: 1373, text: false, desc: '3 foto, langit biru dengan Woody, Buzz dan bola Pixar.',
    wins: [[53, 272, 474, 294], [53, 602, 474, 294], [53, 932, 474, 294]],
    vars: [
      { n: 'Biru', src: 'frames/toy-story.png', bg: '#1a4798', ink: '#ffffff', c: '#1a4798' },
    ],
  },
  so7: {
    n: 'Sheila on 7', w: 580, h: 1373, text: false, desc: '3 foto, nuansa zaitun dengan stiker Sheila on 7.',
    wins: [[53, 272, 474, 294], [53, 602, 474, 294], [53, 932, 474, 294]],
    vars: [
      { n: 'Zaitun', src: 'frames/so7.png', bg: '#858562', ink: '#ffffff', c: '#858562' },
    ],
  },
};