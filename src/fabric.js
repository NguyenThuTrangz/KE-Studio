/* Thay vải giữ nếp gấp (không AI): chọn vùng bộ đồ → phủ vải/màu mới → nhân lại sáng tối + làm cong hoạ tiết theo nếp của ảnh gốc.
   Nếp gấp, bóng đổ, chỗ lồi lõm lấy thẳng từ ảnh thật nên khớp từng nếp; dáng bộ đồ (cổ, tay, độ dài, đường smock) giữ như ảnh gốc. */

// ---------- mặt nạ (mask) ở độ phân giải bản xem trước ----------
function lumOf(d, i) { return (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255; }
function toLab(r, g, b) {
  const f = v => { v /= 255; return v > .04045 ? ((v + .055) / 1.055) ** 2.4 : v / 12.92; };
  const R = f(r), G = f(g), B = f(b), X = (R * .4124 + G * .3576 + B * .1805) / .95047, Y = R * .2126 + G * .7152 + B * .0722, Z = (R * .0193 + G * .1192 + B * .9505) / 1.08883;
  const h = v => v > .008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
  return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))];
}
// Đũa thần: lan vùng từ điểm bấm theo màu (bỏ qua độ sáng nhiều hơn màu, để nếp tối/sáng vẫn được chọn)
function magicWand(img, mask, w, h, sx, sy, tol, add) {
  const d = img.data, seed = toLab(d[(sy * w + sx) * 4], d[(sy * w + sx) * 4 + 1], d[(sy * w + sx) * 4 + 2]);
  const seen = new Uint8Array(w * h), stack = [sy * w + sx]; seen[sy * w + sx] = 1;
  if (!img.__lab) { const lab = new Float32Array(w * h * 3); for (let k = 0; k < w * h; k++) { const [a, b, c] = toLab(d[k * 4], d[k * 4 + 1], d[k * 4 + 2]); lab[k * 3] = a; lab[k * 3 + 1] = b; lab[k * 3 + 2] = c; } img.__lab = lab; }
  const lab = img.__lab;
  // điều kiện: gần màu điểm bấm (độ sáng tính nhẹ để nếp tối/sáng vẫn vào) VÀ không vượt qua mép (đổi màu đột ngột với điểm bên cạnh)
  const dist = (i, ref) => { const dl = (lab[i * 3] - ref[0]) * .35, da = lab[i * 3 + 1] - ref[1], db = lab[i * 3 + 2] - ref[2]; return Math.sqrt(dl * dl + da * da + db * db); };
  const edge = Math.max(3, tol * .45);
  while (stack.length) {
    const i = stack.pop(); mask[i] = add ? 255 : 0;
    const x = i % w, y = (i / w) | 0, here = [lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]];
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !seen[j] && dist(j, seed) <= tol && dist(j, here) <= edge) { seen[j] = 1; stack.push(j); }
  }
}
function brushAt(mask, w, h, cx, cy, r, add) { for (let y = Math.max(0, cy - r | 0); y <= Math.min(h - 1, cy + r); y++) for (let x = Math.max(0, cx - r | 0); x <= Math.min(w - 1, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) mask[y * w + x] = add ? 255 : 0; }
// làm mịn mask 1 lần (đóng lỗ nhỏ do hoạ tiết vải cũ), dùng box blur rồi ngưỡng
function tidyMask(mask, w, h, r = 2) { const b = boxBlur(Float32Array.from(mask), w, h, r); for (let i = 0; i < mask.length; i++) mask[i] = b[i] > 110 ? 255 : 0; }
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { tmp[y * w + x] = s / n; s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  return out;
}

/* ---------- phủ vải ----------
   src: canvas ảnh gốc; maskC: canvas mask cùng cỡ (trắng = vùng thay); fabric: canvas vải (null = dùng màu);
   o: { color, scale, rot, offX, offY, shade (0..1.5), warp (0..1), gloss (0..1) } */
function applyFabric(src, maskC, fabric, o) {
  const w = src.width, h = src.height, out = mkCanvas(w, h), x = out.getContext('2d', { willReadFrequently: true });
  x.drawImage(src, 0, 0);
  const im = x.getImageData(0, 0, w, h), d = im.data;
  const m = maskC.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h); let sum = 0, cnt = 0;
  for (let i = 0; i < w * h; i++) { lum[i] = lumOf(d, i * 4); if (m[i * 4] > 127) { sum += lum[i]; cnt++; } }
  if (!cnt) return out;
  const mean = sum / cnt, scaleK = Math.max(w, h) / 1000;
  // vải gốc nhạt (trắng, hồng phấn) có nếp rất nhẹ: tự khuếch đại để nếp vẫn hiện rõ trên vải mới
  let vs = 0; for (let i = 0; i < w * h; i++) if (m[i * 4] > 127) vs += (lum[i] / mean - 1) ** 2;
  const spread = Math.sqrt(vs / cnt), boost = Math.max(1, Math.min(3.5, .11 / Math.max(spread, .01)));
  // nếp lớn để làm cong hoạ tiết: độ dốc của độ sáng đã làm mờ
  const blur = boxBlur(lum, w, h, Math.max(2, Math.round(6 * scaleK)));
  const warpPx = (o.warp ?? .5) * 60 * scaleK * Math.min(2.5, boost);
  // vải
  let fd = null, fw = 1, fh = 1, fc = null;
  if (fabric) { fw = fabric.width; fh = fabric.height; fd = fabric.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, fw, fh).data; }
  else { const n = parseInt((o.color || '#E05080').slice(1), 16); fc = [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const sc = (o.scale || 1) * scaleK / (o.texRatio || 1), cos = Math.cos(o.rot || 0), sin = Math.sin(o.rot || 0), shade = o.shade ?? 1, gloss = o.gloss ?? .4;
  // độ trong mép: mask làm mờ nhẹ để mép vải mới hoà vào ảnh
  const mf = boxBlur(Float32Array.from({ length: w * h }, (_, i) => m[i * 4]), w, h, Math.max(1, Math.round(1.5 * scaleK)));
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = y * w + xx, a = mf[i] / 255; if (a <= 0.004) continue;
    const gx = blur[i + (xx < w - 1 ? 1 : 0)] - blur[i - (xx > 0 ? 1 : 0)], gy = blur[i + (y < h - 1 ? w : 0)] - blur[i - (y > 0 ? w : 0)];
    let r, g, b;
    if (fd) {
      const px = xx + gx * warpPx * 10 - (o.offX || 0) * fw * sc, py = y + gy * warpPx * 10 - (o.offY || 0) * fh * sc;
      let u = (px * cos + py * sin) / sc, v = (-px * sin + py * cos) / sc;
      u = ((u % fw) + fw) % fw | 0; v = ((v % fh) + fh) % fh | 0;
      const k = (v * fw + u) * 4; r = fd[k]; g = fd[k + 1]; b = fd[k + 2];
    } else [r, g, b] = fc;
    // sáng tối: tỉ lệ độ sáng điểm / độ sáng trung bình vùng; giữ bóng loáng ở chỗ sáng
    const ratio = Math.max(0, Math.min(2.2, lum[i] / Math.max(mean, .02))), s = Math.max(.15, 1 + (ratio - 1) * shade * boost);
    const hi = Math.max(0, lum[i] - mean * 1.12) * gloss * 255;
    const j = i * 4;
    d[j] = d[j] * (1 - a) + Math.min(255, r * s + hi) * a; d[j + 1] = d[j + 1] * (1 - a) + Math.min(255, g * s + hi) * a; d[j + 2] = d[j + 2] * (1 - a) + Math.min(255, b * s + hi) * a;
  }
  x.putImageData(im, 0, 0);
  return out;
}
const tileFabric = (img, mode) => { const c = mkCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); return c; };

/* ---------- giao diện: hộp thoại "Thay vải" cho ảnh đang chọn ---------- */
async function fabricEditor(photoIndex, onDone) {
  const p = PS.photos[photoIndex], base = p.original || p, src = base.lo, w = src.width, h = src.height;
  const srcData = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h);
  const mask = new Uint8Array(w * h), maskC = mkCanvas(w, h);
  const st = { tool: 'wand', add: true, tol: 8, brush: Math.round(w / 40), fabric: null, fabricName: '', color: '#243F93', scale: 1, rot: 0, offX: 0, offY: 0, shade: 1, warp: .5, gloss: .4, view: 'result' };
  const cv = el('canvas', { className: 'fxCanvas' }); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
  const syncMask = () => { const md = maskC.getContext('2d'), id = md.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = mask[i]; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; } md.putImageData(id, 0, 0); };
  let tm; const draw = () => { clearTimeout(tm); tm = setTimeout(() => {
    syncMask();
    if (st.view === 'mask') { cx.drawImage(src, 0, 0); const ov = mkCanvas(w, h), ox = ov.getContext('2d'); ox.drawImage(maskC, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = 'rgba(36,63,147,.55)';
      const t2 = mkCanvas(w, h), tx = t2.getContext('2d'), id = tx.createImageData(w, h); for (let i = 0; i < w * h; i++) { id.data[i * 4] = 36; id.data[i * 4 + 1] = 63; id.data[i * 4 + 2] = 147; id.data[i * 4 + 3] = mask[i] ? 140 : 0; } tx.putImageData(id, 0, 0); cx.drawImage(t2, 0, 0); }
    else cx.drawImage(applyFabric(src, maskC, st.fabric, st), 0, 0);
  }, 60); };
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * w), Math.round((e.clientY - r.top) / r.height * h)]; };
  let painting = false, maskPast = [], maskFut = [];
  const pushMask = () => { maskPast.push(mask.slice()); if (maskPast.length > 40) maskPast.shift(); maskFut = []; };
  const swapMask = back => { const from = back ? maskPast : maskFut, to = back ? maskFut : maskPast; if (!from.length) { toast(back ? 'Không còn gì để hoàn tác' : 'Không còn gì để làm lại'); return; } to.push(mask.slice()); mask.set(from.pop()); st.view = 'mask'; viewBtns(); draw(); toast(back ? '↶ Đã hoàn tác vùng chọn' : '↷ Đã làm lại vùng chọn'); };
  cv.onpointerdown = e => { const [x0, y0] = pt(e); if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return;
    if (st.tool === 'wand') { pushMask(); magicWand(srcData, mask, w, h, x0, y0, st.tol, st.add); tidyMask(mask, w, h); st.view = 'mask'; viewBtns(); draw(); }
    else { pushMask(); painting = true; cv.setPointerCapture(e.pointerId); brushAt(mask, w, h, x0, y0, st.brush, st.add); st.view = 'mask'; viewBtns(); draw(); } };
  cv.onpointermove = e => { if (!painting) return; const [x0, y0] = pt(e); brushAt(mask, w, h, x0, y0, st.brush, st.add); draw(); };
  cv.onpointerup = cv.onpointercancel = () => { painting = false; };
  const btn = (t, f, cls = 'btn line') => { const b = el('button', { type: 'button', className: cls, textContent: t }); b.onclick = f; return b; };
  const toolBar = el('div', { className: 'bar' }); const viewBar = el('div', { className: 'bar' });
  const toolBtns = () => toolBar.replaceChildren(...[['wand', '🪄 Đũa thần'], ['brush', '🖌 Cọ']].map(([k, t]) => { const b = btn(t, () => { st.tool = k; toolBtns(); }); b.setAttribute('aria-pressed', st.tool === k); return b; }),
    ...[[true, '+ Thêm vùng'], [false, '− Bớt vùng']].map(([k, t]) => { const b = btn(t, () => { st.add = k; toolBtns(); }); b.setAttribute('aria-pressed', st.add === k); return b; }),
    btn('Xoá chọn', () => { pushMask(); mask.fill(0); draw(); }));
  const viewBtns = () => viewBar.replaceChildren(...[['mask', 'Xem vùng chọn'], ['result', 'Xem kết quả']].map(([k, t]) => { const b = btn(t, () => { st.view = k; viewBtns(); draw(); }); b.setAttribute('aria-pressed', st.view === k); return b; }));
  toolBtns(); viewBtns();
  const fabricIn = el('input', { type: 'file', accept: 'image/*', id: 'fxFabric' });
  const fabricInfo = el('span', { className: 'sub', textContent: 'Chưa chọn vải — đang dùng màu.' });
  const setFabricFile = async f => { const im = await readPhoto(f); st.fabric = tileFabric(fitImage(im, 900)); st.fabricHi = tileFabric(fitImage(im, 2400)); st.fabricName = f.name; fabricInfo.textContent = 'Vải: ' + (f.name || 'ảnh dán'); st.view = 'result'; viewBtns(); draw(); };
  fabricIn.onchange = () => { const f = fabricIn.files[0]; if (f) setFabricFile(f); };
  const fromPhotos = el('div', { className: 'bar' }, ...PS.photos.map((q, k) => k === photoIndex ? '' : btn('Lấy vải từ ảnh ' + (k + 1), () => { st.fabric = q.lo; st.fabricHi = q.hi; fabricInfo.textContent = 'Vải: ảnh ' + (k + 1); st.view = 'result'; viewBtns(); draw(); })));
  const color = el('input', { type: 'color', value: st.color }); color.oninput = () => { st.color = color.value; st.fabric = null; st.fabricHi = null; fabricInfo.textContent = 'Đang dùng màu ' + color.value; st.view = 'result'; viewBtns(); draw(); };
  const body = el('div', { className: 'fxBody' },
    el('div', { className: 'fxLeft' }, cv, viewBar),
    el('div', { className: 'fxRight' },
      el('h3', { textContent: 'Thay vải (giữ nếp gấp)' }),
      el('p', { className: 'sub', textContent: 'Bước 1: chọn vùng bộ đồ. Đũa thần: bấm lên vải cũ (nhiều chỗ nếu cần). Cọ: tô thêm/bớt. Bỏ khỏi vùng chọn những chỗ muốn giữ (cổ smock, nơ, da, ma-nơ-canh).' }),
      toolBar, slider('Độ nhạy đũa thần (thấp = chặt hơn)', 3, 40, st.tol, v => { st.tol = v; }), slider('Cỡ cọ', 2, Math.round(w / 8), st.brush, v => { st.brush = v; }),
      el('p', { className: 'sub', textContent: 'Bước 2: chọn vải mới (ảnh mẫu vải phẳng, chụp thẳng) hoặc một màu.' }),
      el('label', { className: 'drop', htmlFor: 'fxFabric', style: 'padding:12px' }, el('b', { textContent: 'Chọn ảnh vải' }), fabricInfo, fabricIn), fromPhotos,
      el('div', { className: 'field' }, el('label', { textContent: 'Hoặc đổi sang màu' }), color),
      slider('Cỡ hoạ tiết', 20, 400, 100, v => { st.scale = v / 100; draw(); }), slider('Xoay hoạ tiết', -90, 90, 0, v => { st.rot = v * Math.PI / 180; draw(); }),
      slider('Dời ngang', 0, 100, 0, v => { st.offX = v / 100; draw(); }), slider('Dời dọc', 0, 100, 0, v => { st.offY = v / 100; draw(); }),
      el('p', { className: 'sub', textContent: 'Bước 3: chỉnh độ giữ nếp.' }),
      slider('Độ đậm nếp gấp', 0, 150, 100, v => { st.shade = v / 100; draw(); }), slider('Hoạ tiết cong theo nếp', 0, 100, 50, v => { st.warp = v / 100; draw(); }), slider('Độ bóng vải', 0, 100, 40, v => { st.gloss = v / 100; draw(); }),
      el('div', { className: 'bar' }, btn('Áp dụng vào ảnh', apply, 'btn'), btn('Huỷ', close), p.original ? btn('Trả về ảnh gốc', () => { PS.photos[photoIndex] = p.original; close(); onDone(); }) : ''),
      el('p', { className: 'sub', textContent: 'Ảnh đã thay vải chỉ dùng làm ảnh minh hoạ mẫu mới. Kiểm lại trước khi đăng; chi tiết dáng (cổ, đường smock) vẫn là của ảnh gốc.' })));
  const dlg = el('div', { className: 'fxModal', role: 'dialog', 'aria-label': 'Thay vải' }, body);
  function close() { dlg.remove(); document.body.style.overflow = ''; window.FX_KEYS = window.FX_PASTE = null; }
  window.FX_PASTE = f => { setFabricFile(f).then(() => toast('📋 Đã dán ảnh vải')); };
  window.FX_KEYS = (e, mod, k) => {
    if (k === 'escape') { close(); return true; }
    if (mod && k === 'enter') { apply(); return true; }
    if (mod && k === 'z') { swapMask(!e.shiftKey); return true; }
    if (mod && k === 'y') { swapMask(false); return true; }
    if (mod && k === 'a') { pushMask(); mask.fill(255); st.view = 'mask'; viewBtns(); draw(); toast('Đã chọn toàn bộ ảnh'); return true; }
    if (!mod && (k === 'w' || k === 'b')) { st.tool = k === 'w' ? 'wand' : 'brush'; toolBtns(); return true; }
    return false; };
  async function apply() {
    if (!mask.some(v => v)) { alert('Chưa chọn vùng bộ đồ.'); return; }
    syncMask(); const hiSrc = base.hi, mk = mkCanvas(hiSrc.width, hiSrc.height), mx = mk.getContext('2d'); mx.imageSmoothingQuality = 'high'; mx.drawImage(maskC, 0, 0, mk.width, mk.height);
    const fab = st.fabricHi || st.fabric, ratio = fab && st.fabric ? fab.width / st.fabric.width : 1;
    const res = applyFabric(hiSrc, mk, fab, { ...st, texRatio: ratio });
    const np = new Photo(base.name.replace(/\.[^.]+$/, '') + '_vai-moi.jpg', res); np.original = base; PS.photos[photoIndex] = np; close(); onDone();
  }
  document.body.style.overflow = 'hidden'; document.body.append(dlg); draw();
}
