/* detect.js — membaca PNG desain: menemukan jendela foto dan, jika jendelanya masih
   kotak abu-abu (#D9D9D9) dari Figma, mengubahnya jadi transparan dengan tepi halus.
   Dipakai oleh tool.html dan admin.html. */

// komponen terhubung dari piksel yang lolos tes isWin → kotak pembatas tiap komponen
function findBoxes(W, H, isWin) {
  const lab = new Int32Array(W * H), stack = new Int32Array(W * H), boxes = [];
  let id = 0;
  for (let i = 0; i < W * H; i++) {
    if (lab[i] || !isWin(i)) continue;
    id++; let sp = 0, minx = W, miny = H, maxx = 0, maxy = 0, n = 0;
    stack[sp++] = i; lab[i] = id;
    while (sp) {
      const p = stack[--sp], px = p % W, py = (p - px) / W; n++;
      if (px < minx) minx = px; if (px > maxx) maxx = px; if (py < miny) miny = py; if (py > maxy) maxy = py;
      for (const q of [px > 0 && p - 1, px < W - 1 && p + 1, py > 0 && p - W, py < H - 1 && p + W]) {
        if (q !== false && !lab[q] && isWin(q)) { lab[q] = id; stack[sp++] = q; }
      }
    }
    boxes[id] = { id, minx, miny, maxx, maxy, n };
  }
  return { lab, boxes };
}

// jadikan piksel abu-abu jendela transparan; piksel tepi (campuran abu-abu + latar) diberi alpha sebagian
function makeTransparent(d, W, H, lab, keep) {
  const ids = new Set(keep.map(b => b.id)), G = 217, R = 3, snap = new Uint8ClampedArray(d);
  const inWin = i => ids.has(lab[i]);
  keep.forEach(b => {
    const x0 = b.minx, y0 = b.miny, x1 = b.maxx, y1 = b.maxy, r = Math.min(x1 - x0, y1 - y0) * .07;
    for (let y = Math.max(0, y0 - R); y <= Math.min(H - 1, y1 + R); y++) {
      for (let x = Math.max(0, x0 - R); x <= Math.min(W - 1, x1 + R); x++) {
        const i = y * W + x;
        if (inWin(i)) { d[i * 4 + 3] = 0; continue; }
        let near = false; // ada piksel jendela dalam radius R?
        for (let dy = -R; dy <= R && !near; dy++) for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && inWin(yy * W + xx)) { near = true; break; }
        }
        if (!near) continue;
        // perkirakan warna latar: piksel sedikit di luar tepi, searah normal dari kotak yang dikecilkan
        const qx = Math.min(Math.max(x, x0 + r), x1 - r), qy = Math.min(Math.max(y, y0 + r), y1 - r);
        const nx = x - qx, ny = y - qy, len = Math.hypot(nx, ny); if (len < 1) continue;
        const bx = Math.round(x + nx / len * (R + 3)), by = Math.round(y + ny / len * (R + 3));
        if (bx < 0 || by < 0 || bx >= W || by >= H) continue;
        const bi = (by * W + bx) * 4, B = [snap[bi], snap[bi + 1], snap[bi + 2]], P = [snap[i * 4], snap[i * 4 + 1], snap[i * 4 + 2]];
        const dd = [G - B[0], G - B[1], G - B[2]], den = dd[0] * dd[0] + dd[1] * dd[1] + dd[2] * dd[2];
        if (den < 900) continue;
        const t = Math.min(1, Math.max(0, ((P[0] - B[0]) * dd[0] + (P[1] - B[1]) * dd[1] + (P[2] - B[2]) * dd[2]) / den));
        if (t > .02) { d[i * 4] = B[0]; d[i * 4 + 1] = B[1]; d[i * 4 + 2] = B[2]; d[i * 4 + 3] = Math.round(255 * (1 - t)); }
      }
    }
  });
}

// img → { W, H, wins:[[x,y,w,h]...], mode:'transparan'|'abu-abu', canvas (sudah transparan), bg:'#rrggbb' }
function analyzeFrame(img) {
  const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const im = x.getImageData(0, 0, W, H), d = im.data, MIN = 1500;
  const big = res => res.boxes.filter(b => b && b.n >= MIN);
  let mode = 'transparan', res = findBoxes(W, H, i => d[i * 4 + 3] < 128), keep = big(res);
  if (!keep.length) { // tidak ada jendela transparan → cari kotak abu-abu #D9D9D9
    mode = 'abu-abu';
    res = findBoxes(W, H, i => d[i * 4 + 3] >= 250 && Math.abs(d[i * 4] - 217) <= 6 && Math.abs(d[i * 4 + 1] - 217) <= 6 && Math.abs(d[i * 4 + 2] - 217) <= 6);
    keep = big(res);
    if (keep.length) makeTransparent(d, W, H, res.lab, keep);
  }
  x.putImageData(im, 0, 0);
  const wins = keep.map(b => { // diperbesar 1 piksel agar tidak ada celah di tepi
    const x0 = Math.max(0, b.minx - 1), y0 = Math.max(0, b.miny - 1);
    return [x0, y0, Math.min(W, b.maxx + 2) - x0, Math.min(H, b.maxy + 2) - y0];
  }).sort((a, b) => (Math.abs(a[1] - b[1]) < 20 ? a[0] - b[0] : a[1] - b[1])); // atas→bawah, kiri→kanan
  const bg = '#' + [0, 1, 2].map(k => d[(5 * W + 5) * 4 + k].toString(16).padStart(2, '0')).join('');
  return { W, H, wins, mode, canvas: c, bg };
}
