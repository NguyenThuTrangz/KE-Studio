/* KE Studio — tạo ảnh đăng bài theo nhận diện K-Embroidery (BRAND.md).
   Lõi xử lý ảnh dựa trên tab Ảnh của Vietlink-App (photo.js): người dùng tải ảnh của mình lên, chọn mẫu hoặc bấm 🎲,
   chỉnh rồi tự tải về. Mọi xử lý chạy trên máy người dùng: không AI, không gửi ảnh đi đâu. Logo KE luôn có trên ảnh. */

const FORMATS = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920] };
const EXPORT_W = 1920;   // kho content KE dùng ảnh 1920 px

// Màu chỉ lấy từ BRAND.md mục 2. font: 'social' = Montserrat (ảnh kho content), 'lux' = Cormorant + Jost (website)
const THEMES = [
  { id: 'ke', name: 'KE trắng', paper: '#FFFFFF', ink: '#1259A2', accent: '#0A7A12', font: 'social' },
  { id: 'logo', name: 'Màu logo', paper: '#FFFFFF', ink: '#243F93', accent: '#438D41', font: 'social' },
  { id: 'pink', name: 'Hồng phấn', paper: '#FBE9EC', ink: '#243F93', accent: '#438D41', font: 'social' },
  { id: 'sage', name: 'Xanh xám', paper: '#E8EFE6', ink: '#1B2A4A', accent: '#438D41', font: 'social' },
  { id: 'green', name: 'Xanh lá KE', paper: '#438D41', ink: '#FFFFFF', accent: '#FBF8F3', font: 'social', dark: true },
  { id: 'xmas', name: 'Giáng sinh', paper: '#FFFFFF', ink: '#C84840', accent: '#438D41', font: 'social' },
  { id: 'cream', name: 'Kem vàng', paper: '#FBF8F3', ink: '#1B2A4A', accent: '#B98E4C', font: 'lux' },
  { id: 'navy', name: 'Navy sang', paper: '#1B2A4A', ink: '#FFFFFF', accent: '#D9BD86', font: 'lux', dark: true },
];
const FONTS = {
  social: { head: '800 {s}px Montserrat, Arial, sans-serif', sub: 'italic 600 {s}px Montserrat, Arial, sans-serif', upper: true },
  lux: { head: '600 {s}px "Cormorant Garamond", Georgia, serif', sub: 'italic 500 {s}px "Cormorant Garamond", Georgia, serif', upper: false },
};
// Câu chữ chỉ lấy từ BRAND.md mục 5. Câu khác do người dùng tự gõ.
const LINES = ['NEW UPDATE', '100% HAND SMOCKING', 'HAND SMOCKING & EMBROIDERY', 'FREE 2D MOCK-UP', 'LOW MOQ · 15 PCS/STYLE', 'SHARE YOUR IDEAS WITH US', 'DIRECT FROM OUR FACTORY', 'SAMPLE & BULK PRODUCTION', 'CUSTOM YOUR COLLECTION', 'WHOLESALE SMOCKED CLOTHING'];
const SUBS = ['You dream it - We smock it', 'For Smocked Clothing', 'Stitching sustainability into every thread', 'Worldwide shipping via FedEx/UPS', 'k-embroidery.com'];
const TOPS = ['New Update', 'New Collection', 'Made to order'];
const FILTERS = {
  'Gốc': {}, 'Sáng sạch': { gain: 1.08, sat: .96, con: 1.02 }, 'Ấm': { warm: .035, sat: 1.1, con: 1.05 }, 'Mềm': { gain: 1.04, sat: .9, con: .94 },
  'Tương phản': { con: 1.18, sat: 1.05 }, 'Đậm màu': { sat: 1.22, con: 1.05 }, 'Pastel': { sat: .8, con: .95, gain: 1.06 }, 'Mát nhẹ': { warm: -.03, sat: .98 },
  'Nắng': { gain: 1.1, warm: .05, sat: 1.08 }, 'Cổ điển': { warm: .05, sat: .78, con: .95 }, 'Nét vải': { con: 1.1, sat: 1.03, sharpen: .6 }, 'Đen trắng': { sat: 0, con: 1.08 },
};
const SAFE = 150;   // vùng logo phía trên (mẫu có dải trắng đầu ảnh)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const loadImage = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Không đọc được ảnh này. Hãy dùng ảnh JPG hoặc PNG.')); i.src = src; });

function fitImage(img, max) {
  const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const c = mkCanvas((img.naturalWidth || img.width) * k, (img.naturalHeight || img.height) * k), x = c.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
// Độ sáng trung bình + điểm nhiều chi tiết nhất (để cắt ảnh lấy đúng chỗ có váy/đường smock)
function measure(src) {
  const w = 240, h = Math.max(1, Math.round(240 * src.height / src.width)), c = mkCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < g.length; i++) { g[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]; sum += g[i]; }
  const cell = 10, cw = Math.ceil(w / cell), ch = Math.ceil(h / cell), e = new Float32Array(cw * ch);
  for (let y = 1; y < h - 1; y++) for (let a = 1; a < w - 1; a++) { const p = y * w + a; e[((y / cell) | 0) * cw + ((a / cell) | 0)] += Math.abs(4 * g[p] - g[p - 1] - g[p + 1] - g[p - w] - g[p + w]); }
  let tx = 0, ty = 0, t = 0;
  for (let y = 0; y < ch; y++) for (let a = 0; a < cw; a++) { const s = e[y * cw + a] ** 2; tx += s * (a + .5) / cw; ty += s * (y + .5) / ch; t += s; }
  return { mean: sum / g.length, focus: t ? [tx / t, ty / t] : [.5, .5] };
}
function gradeCanvas(c, o) {
  const x = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, im = x.getImageData(0, 0, w, h), d = im.data;
  let total = 0;
  for (let i = 0; i < d.length; i += 16) total += .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2];
  const avg = o.gain * total / (d.length / 16);
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * o.gain, g = d[i + 1] * o.gain, b = d[i + 2] * o.gain;
    const l = .299 * r + .587 * g + .114 * b;
    r = avg + (l + (r - l) * o.sat - avg) * o.con; g = avg + (l + (g - l) * o.sat - avg) * o.con; b = avg + (l + (b - l) * o.sat - avg) * o.con;
    d[i] = r * (1 + o.warm); d[i + 1] = g * (1 + o.warm * .25); d[i + 2] = b * (1 - o.warm);
  }
  if (o.sharpen > 0) {
    const s = new Uint8ClampedArray(d), k = o.sharpen;
    for (let y = 1; y < h - 1; y++) for (let a = 1; a < w - 1; a++) { const p = (y * w + a) * 4;
      for (let n = 0; n < 3; n++) d[p + n] = s[p + n] + k * (4 * s[p + n] - s[p + n - 4] - s[p + n + 4] - s[p + n - w * 4] - s[p + n + w * 4]) * .5; }
  }
  x.putImageData(im, 0, 0);
  return c;
}

/* Một ảnh tải lên: bản nhỏ để xem trước, bản lớn để xuất, và vài bản đã chỉnh trong bộ nhớ đệm. */
class Photo {
  constructor(name, img) { this.name = name; this.lo = fitImage(img, 900); this.hi = fitImage(img, 2400); const m = measure(this.lo); this.mean = m.mean; this.focus = m.focus; this.cache = new Map(); }
  edited(spec, t, hi) {
    const key = [hi ? 'h' : 'l', spec.filter, spec.b, spec.c, spec.s, spec.w, spec.sh, t.rot, t.flip].join('|');
    if (this.cache.has(key)) return this.cache.get(key);
    const src = hi ? this.hi : this.lo, turned = t.rot % 180 !== 0, c = mkCanvas(turned ? src.height : src.width, turned ? src.width : src.height), x = c.getContext('2d', { willReadFrequently: true });
    x.translate(c.width / 2, c.height / 2); x.rotate(t.rot * Math.PI / 180); x.scale(t.flip ? -1 : 1, 1); x.drawImage(src, -src.width / 2, -src.height / 2);
    const f = FILTERS[spec.filter] || {};
    gradeCanvas(c, { gain: clamp(Math.pow(128 / Math.max(this.mean, 1), .4), .88, 1.25) * (f.gain || 1) * (1 + spec.b / 100), con: (f.con || 1) * (1 + spec.c / 100), sat: (f.sat == null ? 1 : f.sat) * (1 + spec.s / 100), warm: (f.warm || 0) + spec.w / 400, sharpen: (f.sharpen || 0) + spec.sh / 100 });
    if (this.cache.size > 5) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, c);
    return c;
  }
}

// Vỏ sò (scallop) — kiểu cắt ảnh trong bài Giáng sinh của CATHIE
const scallop = (x, cx, cy, r, n = 16) => { const step = Math.PI * 2 / n, rr = r * Math.sin(step / 2) * 1.05, R = r - rr * .55;
  for (let i = 0; i <= n; i++) { const a0 = i * step - step / 2, mx = cx + R * Math.cos(i * step), my = cy + R * Math.sin(i * step); x.arc(mx, my, rr, a0 - Math.PI / 2.2, a0 + step + Math.PI / 2.2); } x.closePath(); };

/* Công cụ vẽ cho từng mẫu. Kích thước tính trên khung gốc; ảnh thu nhỏ tự co theo. */
function tools(x, spec, W, H, photos, hi) {
  const t = THEMES.find(v => v.id === spec.theme) || THEMES[0], F = FONTS[spec.font] || FONTS[t.font], showText = spec.showText !== false;
  let slot = 0;
  const up = s => F.upper ? String(s).toUpperCase() : s;
  const g = { W, H, t, a: spec.a, b: spec.b2, c: spec.top, showText, head: false,
    fill(c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); },
    grad(a, b, w, h, c1, c2) { const v = x.createLinearGradient(0, b, 0, b + h); v.addColorStop(0, c1); v.addColorStop(1, c2); x.fillStyle = v; x.fillRect(a, b, w, h); },
    band() { g.fill(t.dark ? t.paper : '#FFFFFF', 0, 0, W, SAFE); g.head = true; },   // dải đầu ảnh chứa logo
    /* Ảnh kế tiếp vào một hình. Ít ảnh hơn số ô thì lặp lại, mỗi lần cắt khác đi. */
    pic(a, b, w, h, shape) {
      const n = slot++, i = (spec.main + n) % photos.length, p = photos[i], tr = spec.trans[i] || { zoom: 1, px: 0, py: 0, rot: 0, flip: false };
      const c = p.edited(spec, tr, hi), z = tr.zoom * (1 + (n >= photos.length ? .22 * ((n % 3) + 1) : 0));
      const k = Math.max(w / c.width, h / c.height) * z, sw = w / k, sh = h / k;
      const f = tr.rot === 0 && !tr.flip ? p.focus : [.5, .5], jog = n >= photos.length ? (n % 2 ? .12 : -.12) : 0;
      const sx = clamp(f[0] * c.width - sw / 2 + tr.px * c.width / 2 + jog * c.width, 0, c.width - sw), sy = clamp(f[1] * c.height - sh / 2 + tr.py * c.height / 2, 0, c.height - sh);
      x.save(); x.beginPath();
      if (shape === 'circle') x.ellipse(a + w / 2, b + h / 2, w / 2, h / 2, 0, 0, 7);
      else if (shape === 'scallop') scallop(x, a + w / 2, b + h / 2, Math.min(w, h) / 2);
      else if (shape === 'arch') { x.moveTo(a, b + h); x.lineTo(a, b + w / 2); x.arc(a + w / 2, b + w / 2, w / 2, Math.PI, 0); x.lineTo(a + w, b + h); x.closePath(); }
      else if (typeof shape === 'number') x.roundRect(a, b, w, h, shape);
      else if (typeof shape === 'function') shape(x);
      else x.rect(a, b, w, h);
      x.clip(); x.imageSmoothingQuality = 'high';
      x.drawImage(c, sx, sy, sw, sh, a, b, w, h); x.restore();
    },
    poly(c, pts) { x.fillStyle = c; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); },
    box(c, a, b, w, h, lw) { x.strokeStyle = c; x.lineWidth = lw; x.strokeRect(a, b, w, h); },
    round(c, a, b, w, h, r) { x.fillStyle = c; x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); },
    pill(c, a, b, w, h) { g.round(c, a, b, w, h, h / 2); },
    // hoạ tiết sọc quanh khung (kiểu nền sọc trong ảnh CATHIE)
    stripes(c1, c2, a, b, w, h, step = 26) { x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip(); g.fill(c1, a, b, w, h); x.fillStyle = c2; for (let k = a; k < a + w; k += step * 2) x.fillRect(k, b, step, h); x.restore(); },
    gingham(c, a, b, w, h, step = 36) { x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip(); g.fill('#FFFFFF', a, b, w, h); x.globalAlpha = .35; x.fillStyle = c;
      for (let k = a; k < a + w; k += step * 2) x.fillRect(k, b, step, h); for (let k = b; k < b + h; k += step * 2) x.fillRect(a, k, w, step); x.restore(); },
    font(kind, size) { return F[kind].replace('{s}', size); },
    width(text, size, kind = 'head') { x.font = g.font(kind, size); return x.measureText(kind === 'head' ? up(text) : text).width; },
    /* Căn giữa theo y; tự xuống dòng và thu nhỏ để nằm trong maxW. kind: 'head' (IN HOA đậm) | 'sub' (nghiêng) */
    text(text, cx, y, o = {}) {
      if (!showText || !text) return;
      const kind = o.kind || 'head', lines = o.lines || 2; text = kind === 'head' ? up(text) : String(text);
      let size = (o.size || 76) * (spec.ts / 100), rows;
      for (;;) {
        rows = []; let row = '';
        for (const word of text.split(/\s+/)) { const next = row ? row + ' ' + word : word; if (g.width(next, size, kind) > o.maxW && row) { rows.push(row); row = word; } else row = next; }
        rows.push(row);
        if ((rows.length <= lines && rows.every(r => g.width(r, size, kind) <= o.maxW)) || size < 16) break;
        size -= 2;
      }
      x.font = g.font(kind, size); x.fillStyle = o.color || (kind === 'head' ? t.ink : t.accent); x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
      if (o.stroke) { x.strokeStyle = o.stroke; x.lineWidth = size * .09; x.lineJoin = 'round'; }
      const lh = size * 1.14;
      rows.forEach((r, i) => { const yy = y + (i - (rows.length - 1) / 2) * lh; if (o.stroke) x.strokeText(r, cx, yy); x.fillText(r, cx, yy); });
    },
    chip(text, a, y, o = {}) { if (!showText) return 0; const size = o.size || 32, w = g.width(text, size, 'sub') + size * 1.4, h = size * 1.9; g.pill(o.bg || t.paper, a, y, w, h); g.text(text, a + w / 2, y + h / 2, { size, kind: 'sub', maxW: w, lines: 1, color: o.color || t.ink }); return w; },
  };
  return g;
}

/* Các mẫu: [id, nhóm, vẽ]. Mỗi mẫu là một bố cục; tông màu và khổ ảnh chọn riêng. */
const T = [];
const add = (id, cat, draw) => T.push({ id, cat, draw });
const KE = 'Kiểu kho KE', FULL = 'Toàn ảnh', BAND = 'Dải chữ', FRAME = 'Khung', SPLIT = 'Chia đôi', SHAPE = 'Hình khối', GRID = 'Ghép ảnh', SPEC = 'Thông tin';
const WHITE_BOX = 'rgba(255,255,255,.86)';
// --- đúng kiểu ảnh trong kho content KE ---
add('ke-banner', KE, g => { g.pic(0, 0, g.W, g.H); const h = g.H * .3, y = g.H * .5 - h / 2; if (g.showText) g.fill(WHITE_BOX, 34, y, g.W - 68, h);
  g.text(g.c, g.W / 2, y + h * .2, { kind: 'sub', size: 66, maxW: g.W - 180, lines: 1 }); g.text(g.a, g.W / 2, y + h * .52, { size: 84, maxW: g.W - 150, lines: 1 }); g.text(g.b, g.W / 2, y + h * .82, { kind: 'sub', size: 42, maxW: g.W - 180, lines: 1 }); });
add('ke-slogan', KE, g => { g.pic(0, 0, g.W, g.H); if (g.showText) g.grad(0, g.H - 200, g.W, 200, 'rgba(255,255,255,0)', 'rgba(255,255,255,.78)'); g.text(g.b, g.W / 2, g.H - 70, { kind: 'sub', size: 46, maxW: g.W - 160, lines: 1 }); });
add('ke-plain', KE, g => g.pic(0, 0, g.W, g.H));
add('ke-stripes', KE, g => { g.stripes(g.t.dark ? g.t.paper : '#FFFFFF', g.t.dark ? 'rgba(255,255,255,.18)' : g.t.ink + '22', 0, 0, g.W, g.H); g.round('#FFFFFF', 70, SAFE + 10, g.W - 140, g.H - SAFE - 230, 10); g.pic(100, SAFE + 40, g.W - 200, g.H - SAFE - 290, 6);
  g.text(g.a, g.W / 2, g.H - 120, { size: 70, maxW: g.W - 160, lines: 1, color: g.t.dark ? '#FFFFFF' : g.t.ink }); g.text(g.b, g.W / 2, g.H - 52, { kind: 'sub', size: 34, maxW: g.W - 160, lines: 1, color: g.t.dark ? g.t.accent : g.t.accent }); });
add('ke-gingham', KE, g => { g.gingham(g.t.dark ? '#438D41' : g.t.ink, 0, 0, g.W, g.H); g.round('#FFFFFF', 60, SAFE, g.W - 120, g.H - SAFE - 60, 18); g.pic(90, SAFE + 30, g.W - 180, g.H - SAFE - 250, 12);
  g.text(g.a, g.W / 2, g.H - 150, { size: 64, maxW: g.W - 200, lines: 1 }); g.text(g.b, g.W / 2, g.H - 92, { kind: 'sub', size: 34, maxW: g.W - 200, lines: 1 }); });
add('ke-scallop', KE, g => { g.fill(g.t.paper, 0, 0, g.W, g.H); const d = Math.min(g.W - 160, g.H - SAFE - 250); g.pic((g.W - d) / 2, SAFE + 20, d, d, 'scallop');
  g.text(g.a, g.W / 2, SAFE + d + 90, { size: 72, maxW: g.W - 140, lines: 1 }); g.text(g.b, g.W / 2, SAFE + d + 160, { kind: 'sub', size: 40, maxW: g.W - 140, lines: 1 }); });
// --- toàn ảnh ---
add('full-bottom', FULL, g => { g.pic(0, 0, g.W, g.H); if (g.showText) g.grad(0, g.H * .6, g.W, g.H * .4, 'rgba(27,42,74,0)', 'rgba(27,42,74,.82)'); g.text(g.a, g.W / 2, g.H - 170, { size: 80, maxW: g.W - 140, color: '#fff' }); g.text(g.b, g.W / 2, g.H - 66, { kind: 'sub', size: 40, maxW: g.W - 140, lines: 1, color: '#fff' }); });
add('full-center', FULL, g => { g.pic(0, 0, g.W, g.H); if (g.showText) g.fill('rgba(27,42,74,.38)', 0, 0, g.W, g.H); g.text(g.a, g.W / 2, g.H / 2, { size: 100, maxW: g.W - 160, lines: 3, color: '#fff' }); g.text(g.b, g.W / 2, g.H / 2 + 170, { kind: 'sub', size: 44, maxW: g.W - 200, lines: 1, color: '#fff' }); });
add('full-tag', FULL, g => { g.pic(0, 0, g.W, g.H); g.chip(g.b, 56, g.H - 130, { size: 34, bg: 'rgba(255,255,255,.9)', color: g.t.accent === '#FBF8F3' ? '#243F93' : g.t.accent }); });
add('full-rule', FULL, g => { g.pic(0, 0, g.W, g.H); if (g.showText) { g.grad(0, g.H * .55, g.W, g.H * .45, 'rgba(0,0,0,0)', 'rgba(0,0,0,.55)'); g.fill('#438D41', 70, g.H - 270, 10, 180); } g.text(g.a, 108, g.H - 205, { size: 60, maxW: g.W - 180, align: 'left', color: '#fff', lines: 2 }); g.text(g.b, 108, g.H - 112, { kind: 'sub', size: 36, maxW: g.W - 180, align: 'left', color: '#fff', lines: 1 }); });
add('full-corner', FULL, g => { g.pic(0, 0, g.W, g.H); if (g.showText) g.poly(g.t.paper, [[g.W, g.H - 380], [g.W, g.H], [g.W - 380, g.H]]); g.text(g.a, g.W - 140, g.H - 92, { size: 32, maxW: 210, lines: 3 }); });
// --- dải chữ ---
add('band-bottom', BAND, g => { const h = 200; g.pic(0, 0, g.W, g.H - h); g.fill(g.t.paper, 0, g.H - h, g.W, h); g.fill(g.t.accent, 0, g.H - h, g.W, 8); g.text(g.a, g.W / 2, g.H - h * .58, { size: 70, maxW: g.W - 140, lines: 1 }); g.text(g.b, g.W / 2, g.H - h * .2, { kind: 'sub', size: 36, maxW: g.W - 140, lines: 1 }); });
add('band-mid', BAND, g => { const h = 180; g.pic(0, 0, g.W, g.H); if (g.showText) g.fill(WHITE_BOX, 0, g.H * .62, g.W, h); g.text(g.a, g.W / 2, g.H * .62 + h * .42, { size: 70, maxW: g.W - 120, lines: 1 }); g.text(g.b, g.W / 2, g.H * .62 + h * .78, { kind: 'sub', size: 34, maxW: g.W - 120, lines: 1 }); });
add('band-pill', BAND, g => { g.pic(0, 0, g.W, g.H); if (g.showText) { const w = Math.min(g.width(g.a, 50) + 130, g.W - 80); g.pill(g.t.paper, (g.W - w) / 2, g.H - 200, w, 110); } g.text(g.a, g.W / 2, g.H - 145, { size: 50, maxW: g.W - 200, lines: 1 }); });
add('band-double', BAND, g => { const h = 120; g.pic(0, 0, g.W, g.H); if (g.showText) { g.fill(g.t.paper, 0, g.H - h * 2 - 50, g.W, h); g.fill(g.t.dark ? '#FFFFFF' : g.t.ink, 0, g.H - h - 50, g.W, h); } g.text(g.a, g.W / 2, g.H - h * 1.5 - 50, { size: 58, maxW: g.W - 120, lines: 1 }); g.text(g.b, g.W / 2, g.H - h / 2 - 50, { kind: 'sub', size: 42, maxW: g.W - 120, lines: 1, color: g.t.dark ? g.t.paper : '#FFFFFF' }); });
add('band-side', BAND, g => { const w = 250; g.band(); g.pic(0, SAFE, g.W - w, g.H - SAFE); g.fill(g.t.paper, g.W - w, SAFE, w, g.H - SAFE); g.fill(g.t.accent, g.W - w, SAFE, 8, g.H - SAFE); g.text(g.a, g.W - w / 2 + 3, (SAFE + g.H) / 2, { size: 44, maxW: w - 40, lines: 6 }); });
// --- khung ---
add('frame-white', FRAME, g => { g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(30, SAFE, g.W - 60, g.H - SAFE - 30); });
add('frame-polaroid', FRAME, g => { g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(70, SAFE + 30, g.W - 140, g.H - SAFE - 280); g.text(g.a, g.W / 2, g.H - 160, { size: 62, maxW: g.W - 160, lines: 1 }); g.text(g.b, g.W / 2, g.H - 82, { kind: 'sub', size: 38, maxW: g.W - 160, lines: 1 }); });
add('frame-line', FRAME, g => { g.pic(0, 0, g.W, g.H); g.box('#fff', 44, SAFE, g.W - 88, g.H - SAFE - 44, 4); g.text(g.a, g.W / 2, g.H - 130, { size: 66, maxW: g.W - 170, color: '#fff', stroke: '#1B2A4A' }); });
add('frame-corners', FRAME, g => { g.pic(0, 0, g.W, g.H); const l = 110, m = 52, c = '#FFFFFF'; [[m, SAFE, 1, 1], [g.W - m, SAFE, -1, 1], [m, g.H - m, 1, -1], [g.W - m, g.H - m, -1, -1]].forEach(([a, b, u, v]) => { g.fill(c, u > 0 ? a : a - l, v > 0 ? b : b - 10, l, 10); g.fill(c, u > 0 ? a : a - 10, v > 0 ? b : b - l, 10, l); }); g.text(g.a, g.W / 2, g.H - 150, { size: 60, maxW: g.W - 240, color: '#fff', stroke: '#1B2A4A' }); });
add('frame-card', FRAME, g => { g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.round(g.t.accent, 110, SAFE + 60, g.W - 160, g.H - SAFE - 290, 24); g.pic(80, SAFE + 30, g.W - 160, g.H - SAFE - 290, 24); g.text(g.a, g.W / 2, g.H - 110, { size: 62, maxW: g.W - 160 }); });
// --- chia đôi ---
add('split-left', SPLIT, g => { const w = g.W * .4; g.band(); g.fill(g.t.paper, 0, SAFE, w, g.H - SAFE); g.pic(w, SAFE, g.W - w, g.H - SAFE); g.text(g.a, w / 2, (SAFE + g.H) / 2 - 40, { size: 58, maxW: w - 60, lines: 5 }); g.text(g.b, w / 2, g.H - 80, { kind: 'sub', size: 28, maxW: w - 40, lines: 2 }); });
add('split-right', SPLIT, g => { const w = g.W * .4; g.band(); g.fill(g.t.paper, g.W - w, SAFE, w, g.H - SAFE); g.pic(0, SAFE, g.W - w, g.H - SAFE); g.text(g.a, g.W - w / 2, (SAFE + g.H) / 2 - 40, { size: 58, maxW: w - 60, lines: 5 }); g.text(g.b, g.W - w / 2, g.H - 80, { kind: 'sub', size: 28, maxW: w - 40, lines: 2 }); });
add('split-panel', SPLIT, g => { const h = g.H * .3; g.pic(0, 0, g.W, g.H - h); g.fill(g.t.paper, 0, g.H - h, g.W, h); g.text(g.a, g.W / 2, g.H - h * .6, { size: 78, maxW: g.W - 140 }); g.text(g.b, g.W / 2, g.H - 62, { kind: 'sub', size: 36, maxW: g.W - 140, lines: 1 }); });
add('split-diag', SPLIT, g => { g.pic(0, 0, g.W, g.H); if (g.showText) g.poly(g.t.paper, [[0, g.H * .52], [g.W * .62, g.H], [0, g.H]]); g.text(g.a, g.W * .2, g.H - 170, { size: 48, maxW: g.W * .32, lines: 4 }); });
// --- hình khối ---
add('shape-circle', SHAPE, g => { const d = Math.min(g.W - 140, g.H - SAFE - 280); g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic((g.W - d) / 2, SAFE + 30, d, d, 'circle'); g.text(g.a, g.W / 2, (SAFE + 30 + d + g.H) / 2, { size: 64, maxW: g.W - 140 }); });
add('shape-arch', SHAPE, g => { const w = g.W - 240; g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(120, SAFE + 30, w, g.H - SAFE - 230, 'arch'); g.text(g.a, g.W / 2, g.H - 120, { size: 62, maxW: g.W - 140, lines: 1 }); g.text(g.b, g.W / 2, g.H - 58, { kind: 'sub', size: 34, maxW: g.W - 140, lines: 1 }); });
add('shape-round', SHAPE, g => { g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(60, SAFE + 20, g.W - 120, g.H - SAFE - 210, 48); g.text(g.a, g.W / 2, g.H - 96, { size: 62, maxW: g.W - 140 }); });
add('shape-scallop2', SHAPE, g => { const d = (g.W - 180) / 2, y = SAFE + 40; g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(60, y, d, d, 'scallop'); g.pic(120 + d, y, d, d, 'scallop'); g.text(g.a, g.W / 2, (y + d + g.H) / 2, { size: 70, maxW: g.W - 140, lines: 3 }); });
// --- ghép ảnh ---
add('grid-2col', GRID, g => { const w = (g.W - 12) / 2; g.fill('#FFFFFF', 0, 0, g.W, g.H); g.pic(0, 0, w, g.H); g.pic(w + 12, 0, w, g.H); });
add('grid-1and2', GRID, g => { const h = g.H * .62, w = (g.W - 10) / 2; g.fill('#FFFFFF', 0, 0, g.W, g.H); g.pic(0, 0, g.W, h); g.pic(0, h + 10, w, g.H - h - 10); g.pic(w + 10, h + 10, w, g.H - h - 10); });
add('grid-4', GRID, g => { const w = (g.W - 10) / 2, h = (g.H - 10) / 2; g.fill('#FFFFFF', 0, 0, g.W, g.H); g.pic(0, 0, w, h); g.pic(w + 10, 0, w, h); g.pic(0, h + 10, w, h); g.pic(w + 10, h + 10, w, h); });
add('grid-hero3', GRID, g => { const h = g.H * .7, w = (g.W - 20) / 3; g.fill('#FFFFFF', 0, 0, g.W, g.H); g.pic(0, 0, g.W, h); [0, 1, 2].forEach(i => g.pic(i * (w + 10), h + 10, w, g.H - h - 10)); });
add('grid-2text', GRID, g => { const h = 200, w = (g.W - 10) / 2; g.fill(g.t.paper, 0, 0, g.W, g.H); g.pic(0, 0, w, g.H - h); g.pic(w + 10, 0, w, g.H - h); g.text(g.a, g.W / 2, g.H - h * .6, { size: 64, maxW: g.W - 130, lines: 1 }); g.text(g.b, g.W / 2, g.H - h * .22, { kind: 'sub', size: 34, maxW: g.W - 130, lines: 1 }); });
add('grid-stagger', GRID, g => { const w = (g.W - 180) / 2; g.band(); g.fill(g.t.paper, 0, SAFE, g.W, g.H - SAFE); g.pic(60, SAFE + 30, w, g.H - SAFE - 260, 16); g.pic(120 + w, SAFE + 190, w, g.H - SAFE - 260, 16); g.text(g.a, 60 + w / 2, g.H - 110, { size: 42, maxW: w, lines: 3 }); });
// --- thông tin (đúng sự thật, BRAND.md mục 5) ---
add('spec-chips', SPEC, g => { const h = 240; g.pic(0, 0, g.W, g.H - h); g.fill(g.t.paper, 0, g.H - h, g.W, h); g.text(g.a, g.W / 2, g.H - 172, { size: 56, maxW: g.W - 120, lines: 1 });
  if (g.showText) { const list = ['Hand smocking', 'Free 2D mock-up', 'MOQ 15 pcs']; let total = list.reduce((n, v) => n + g.width(v, 30, 'sub') + 42 + 12, -12), a = (g.W - total) / 2; list.forEach(v => { a += g.chip(v, a, g.H - 104, { size: 30, bg: g.t.dark ? '#FFFFFF' : g.t.ink, color: g.t.dark ? g.t.paper : '#FFFFFF' }) + 12; }); } });
add('spec-list', SPEC, g => { const w = g.W * .44; g.band(); g.fill(g.t.paper, 0, SAFE, w, g.H - SAFE); g.pic(w, SAFE, g.W - w, g.H - SAFE); g.text(g.a, w / 2, SAFE + 120, { size: 46, maxW: w - 60, lines: 3 });
  ['100% hand smocking', 'Hand embroidery', 'Free 2D mock-up', 'Low MOQ · 15 pcs/style', 'Sample & bulk production', 'Worldwide shipping'].forEach((v, i) => g.text('• ' + v, 40, SAFE + 280 + i * 70, { kind: 'sub', size: 30, maxW: w - 60, lines: 1, align: 'left', color: g.t.dark ? '#FFFFFF' : '#2B2B2B' })); });
add('spec-site', SPEC, g => { const h = 200; g.pic(0, 0, g.W, g.H - h); g.fill(g.t.paper, 0, g.H - h, g.W, h); g.text('k-embroidery.com', g.W / 2, g.H - 128, { kind: 'sub', size: 58, maxW: g.W - 140, lines: 1, color: g.t.ink }); g.text(g.b, g.W / 2, g.H - 58, { kind: 'sub', size: 32, maxW: g.W - 140, lines: 1 }); });
const CATS = [KE, FULL, BAND, FRAME, SPLIT, SHAPE, GRID, SPEC];

/* Logo (luôn có) + WhatsApp (tuỳ chọn) + che mặt bé (tuỳ chọn). Vẽ sau cùng, không tắt được logo. */
function whiteLogo(logo) { const c = mkCanvas(logo.naturalWidth, logo.naturalHeight), x = c.getContext('2d'); x.drawImage(logo, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); return c; }
function drawMarks(x, spec, assets, W, H, hadBand) {
  const t = THEMES.find(v => v.id === spec.theme) || THEMES[0];
  const lw = Math.round(W * (spec.logoSize || 27) / 100), img = spec.logoWhite ? assets.logoWhite : assets.logo, lh = Math.round(lw * img.height / img.width);
  const pad = Math.round(lw * .09), pos = spec.logoPos || 'top';
  let lx = (W - lw) / 2, ly = hadBand ? Math.round((SAFE - lh) / 2) : 26 + pad;
  if (pos === 'tl') { lx = 34 + pad; } else if (pos === 'br') { lx = W - lw - 34 - pad; ly = H - lh - 30 - pad; }
  if (!hadBand && !spec.logoWhite && spec.logoBg !== false) { x.save(); x.fillStyle = 'rgba(255,255,255,.88)'; x.shadowColor = 'rgba(0,0,0,.12)'; x.shadowBlur = 14; x.beginPath(); x.roundRect(lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, (lh + pad * 2) / 2.2); x.fill(); x.restore(); }
  if (hadBand && t.dark && !spec.logoWhite) { /* dải đầu ảnh tối → dùng bản trắng */ x.drawImage(assets.logoWhite, lx, ly, lw, lh); } else x.drawImage(img, lx, ly, lw, lh);
  if (spec.wa && spec.waNumber) {
    const size = 30, text = 'WhatsApp ' + spec.waNumber; x.font = `600 ${size}px Montserrat, Arial, sans-serif`;
    const w = x.measureText(text).width + size * 2.4, h = size * 1.9, a = pos === 'br' ? 34 : W - w - 34, b = H - h - 30;
    x.save(); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.roundRect(a, b, w, h, h / 2); x.fill();
    x.fillStyle = '#25D366'; x.beginPath(); x.arc(a + size * .95, b + h / 2, size * .42, 0, 7); x.fill();
    x.fillStyle = '#243F93'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(text, a + size * 1.7, b + h / 2); x.restore();
  }
}
// Che mặt bé: hình tròn đỏ có trái tim trắng (cách kho content KE che mặt trẻ em)
function drawCover(x, c, W, H) {
  const cx = c.x / 100 * W, cy = c.y / 100 * H, r = c.r / 100 * W;
  x.save(); x.fillStyle = '#E8323C'; x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = r * .15; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore();
  const s = r * .55; x.save(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(cx, cy + s * .75);
  x.bezierCurveTo(cx - s * 1.2, cy - s * .05, cx - s * .6, cy - s * .95, cx, cy - s * .35); x.bezierCurveTo(cx + s * .6, cy - s * .95, cx + s * 1.2, cy - s * .05, cx, cy + s * .75); x.fill(); x.restore();
}
function renderSpec(spec, photos, assets, scale, hi) {
  const [W, H] = FORMATS[spec.format], c = mkCanvas(W * scale, H * scale), x = c.getContext('2d', { willReadFrequently: true });
  x.scale(scale, scale);
  const t = THEMES.find(v => v.id === spec.theme) || THEMES[0];
  x.fillStyle = t.paper; x.fillRect(0, 0, W, H);
  const g = tools(x, spec, W, H, photos, hi);
  if (spec.gen) drawGen(g, x, spec); else T.find(v => v.id === spec.layout).draw(g);
  (spec.covers || []).forEach(cv => drawCover(x, cv, W, H));
  drawMarks(x, spec, assets, W, H, g.head);
  return c;
}

/* ---------------- giao diện ---------------- */
const el = (tag, props = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'style') e.style.cssText = v; else if (k in e) e[k] = v; else e.setAttribute(k, v); } e.append(...kids.filter(k => k !== '' && k != null)); return e; };
const store = { get(k, d) { try { const v = localStorage.getItem('ke-studio:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('ke-studio:' + k, JSON.stringify(v)); } catch (e) {} } };
const PREF = { format: '1:1', theme: 'ke', logoPos: 'top', logoSize: 27, wa: true, waNumber: '', ...store.get('pref', {}) };
const savePref = () => store.set('pref', { format: PS.format, theme: PS.theme, season: PS.season, logoPos: PREF.logoPos, logoSize: PREF.logoSize, wa: PREF.wa, waNumber: PREF.waNumber });
const EXPLORE = '✨ Khám phá';
const PS = { photos: [], assets: null, spec: null, cat: EXPLORE, format: PREF.format, theme: PREF.theme, season: PREF.season || 'all' };
const newSpec = id => ({ layout: id, format: PS.format, theme: PS.theme, filter: 'Gốc', b: 0, c: 0, s: 0, w: 0, sh: 0,
  a: id === 'ke-banner' ? 'SWISS DOT FABRIC' : LINES[T.findIndex(v => v.id === id) % LINES.length], b2: SUBS[0], top: TOPS[0], ts: 100, showText: true, main: 0,
  logoPos: PREF.logoPos, logoSize: PREF.logoSize, logoWhite: false, wa: PREF.wa, waNumber: PREF.waNumber, covers: [],
  trans: PS.photos.map(() => ({ zoom: 1, px: 0, py: 0, rot: 0, flip: false })) });
let view;
// ô nhập số WhatsApp dùng chung cho thư viện mẫu và trình chỉnh: gõ một lần, mọi mẫu (kể cả khi bấm 🎲) đều in số này
function waField(onChange) {
  const num = el('input', { type: 'tel', className: 'txt', value: PREF.waNumber, maxLength: 24, placeholder: 'vd +84 912 345 678', ariaLabel: 'Số WhatsApp của bạn' });
  const on = el('input', { type: 'checkbox', checked: PREF.wa });
  let tmr; const apply = () => { PREF.waNumber = num.value.trim(); PREF.wa = on.checked; savePref(); if (PS.spec) { PS.spec.waNumber = PREF.waNumber; PS.spec.wa = PREF.wa; } clearTimeout(tmr); tmr = setTimeout(onChange, 350); };
  num.oninput = apply; on.onchange = apply;
  return el('div', { className: 'field waBox' }, el('label', { textContent: 'Số WhatsApp của bạn (in lên ảnh)' }), num,
    el('div', { className: 'ticks' }, el('label', {}, on, ' In số này lên ảnh')),
    el('p', { className: 'sub', textContent: 'Mỗi người tự nhập số của mình. App nhớ số trên máy này và giữ nguyên khi đổi mẫu hay bấm 🎲. Để trống thì ảnh không có số.' }));
}
const newSeed = () => (Math.random() * 2 ** 31) >>> 0;
// mẫu sinh: giữ phần người dùng đã chỉnh (ảnh, màu ảnh, logo, che mặt), đổi phần thiết kế
const newGen = (seed, keep = {}, base = null) => { const g = genSpec(seed, PS.season, PS.format, keep); const b = base || newSpec(T[0].id); return { ...b, ...g, layout: 'gen', format: PS.format, wa: PREF.wa, waNumber: PREF.waNumber }; };
const userText = (sp, k) => { const all = Object.values(SEASONS).flatMap(S => [...S.heads, ...S.subs, ...S.tops]); return sp && sp[k] && !all.includes(sp[k]) && sp[k] !== 'SWISS DOT FABRIC'; };

async function loadAssets() {
  if (PS.assets) return PS.assets;
  try { await Promise.all(['800 40px Montserrat', 'italic 600 40px Montserrat', '600 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '700 40px "Playfair Display"', '700 40px Quicksand'].map(f => document.fonts.load(f))); } catch (e) {}
  const logo = await loadImage(KE_LOGO);
  PS.assets = { logo, logoWhite: whiteLogo(logo) };
  return PS.assets;
}
// Ảnh iPhone thường là HEIC: Safari mở được, Chrome/Edge trên PC thì đổi sang JPG ngay trên máy bằng heic2any (tải lần đầu từ CDN).
const isHeic = f => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
let heicLib = null;
const loadHeic = () => heicLib || (heicLib = new Promise((ok, no) => {
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  s.onload = () => window.heic2any ? ok(window.heic2any) : no(new Error('x')); s.onerror = () => no(new Error('x')); document.head.append(s);
}).catch(() => { heicLib = null; throw new Error('Không tải được bộ đọc ảnh HEIC. Kiểm tra mạng rồi thử lại.'); }));
async function readPhoto(f) {
  const open = async blob => { const u = URL.createObjectURL(blob); try { return await loadImage(u); } finally { URL.revokeObjectURL(u); } };
  if (!isHeic(f)) return open(f);
  try { return await open(f); } catch (e) {}
  const conv = await loadHeic(); let out;
  try { out = await conv({ blob: f, toType: 'image/jpeg', quality: 0.92 }); } catch (e) { throw new Error('Không đọc được ảnh HEIC ' + f.name + '. Hãy thử ảnh khác hoặc đổi sang JPG.'); }
  return open(Array.isArray(out) ? out[0] : out);
}
function slider(label, min, max, value, onInput, step = 1) {
  const id = 'r' + Math.random().toString(36).slice(2), r = el('input', { type: 'range', id, min, max, step, value }), v = el('span', { className: 'val', textContent: value });
  r.oninput = () => { v.textContent = r.value; onInput(+r.value); };
  return el('div', { className: 'range' }, el('label', { htmlFor: id, textContent: label }), r, v);
}
function chips(items, current, onPick, label) {
  const bar = el('div', { className: 'bar', role: 'group' }); bar.setAttribute('aria-label', label);
  items.forEach(([v, t, sw]) => { const b = el('button', { type: 'button' }, ...(sw ? [el('i', { className: 'sw', style: `background:${sw}` })] : []), t); b.setAttribute('aria-pressed', v === current); b.onclick = () => onPick(v); bar.append(b); });
  return bar;
}
const groupBox = (title, open, ...kids) => { const d = el('details', { className: 'card', open }); d.append(el('summary', { textContent: title }), ...kids); return d; };
const themeChips = (cur, pick) => chips(THEMES.map(t => [t.id, t.name, t.paper === '#FFFFFF' ? t.ink : t.paper]), cur, pick, 'Tông màu');
const formatChips = (cur, pick) => chips(Object.keys(FORMATS).map(k => [k, k === '4:5' ? '4:5 Dọc' : k === '1:1' ? '1:1 Vuông' : '9:16 Story']), cur, pick, 'Khổ ảnh');

async function photos() {
  histSoon();
  const input = el('input', { type: 'file', id: 'files', multiple: true, accept: 'image/*,.heic,.heif' }), msg = el('div');
  input.onchange = async () => {
    const list = [...input.files]; if (!list.length) return;
    if (PS.photos.length + list.length > 12) { msg.replaceChildren(el('p', { className: 'err', role: 'alert', textContent: 'Tối đa 12 ảnh mỗi lần.' })); return; }
    msg.replaceChildren(el('p', { textContent: 'Đang đọc ảnh...' }));
    try { for (const f of list) { if (isHeic(f)) msg.replaceChildren(el('p', { textContent: 'Đang đổi ảnh HEIC ' + f.name + ' sang JPG...' })); PS.photos.push(new Photo(f.name, await readPhoto(f))); } PS.spec = null; photos(); }
    catch (e) { msg.replaceChildren(el('p', { className: 'err', role: 'alert', textContent: e.message })); }
  };
  const upload = el('label', { className: 'drop', htmlFor: 'files' }, el('b', { textContent: PS.photos.length ? '+ Thêm ảnh' : 'Bước 1: chọn ảnh sản phẩm của bạn' }), el('span', { textContent: 'JPG, PNG hoặc HEIC · tối đa 12 ảnh · ảnh xử lý ngay trên máy, không gửi đi đâu' }), input);
  if (!PS.photos.length) { view.replaceChildren(upload, msg); return; }
  await loadAssets();
  const strip = el('div', { className: 'strip' }, ...PS.photos.map((p, i) => { const d = el('div', { className: 'mini' }), c = mkCanvas(84, 84); const k = Math.max(84 / p.lo.width, 84 / p.lo.height); c.getContext('2d').drawImage(p.lo, (84 - p.lo.width * k) / 2, (84 - p.lo.height * k) / 2, p.lo.width * k, p.lo.height * k);
    const x = el('button', { type: 'button', className: 'x', textContent: '×', ariaLabel: 'Bỏ ảnh ' + p.name }); x.onclick = () => { PS.photos.splice(i, 1); PS.spec = null; photos(); }; d.append(c, x); return d; }));
  view.replaceChildren(upload, msg, strip);
  if (PS.spec) editor(); else gallery();
}
let thumbRun = 0, randomBag = [];
/* Đi qua mọi bố cục × tông màu một lượt, thứ tự ngẫu nhiên, rồi mới lặp. Chỉ đổi bản xem trước, không tự xuất ảnh. */
function nextRandom(current) {
  if (!randomBag.length) { randomBag = T.flatMap(t => THEMES.map(c => [t.id, c.id])); for (let i = randomBag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [randomBag[i], randomBag[j]] = [randomBag[j], randomBag[i]]; } }
  let at = randomBag.findIndex(p => !current || p[0] !== current.layout); if (at < 0) at = 0;
  return randomBag.splice(at, 1)[0];
}
function randomize() {
  if (PS.cat === EXPLORE || PS.spec?.gen) {   // mẫu sinh: vô tận
    const old = PS.spec, g = newGen(newSeed(), {}, old);
    if (old) { for (const k of ['a', 'b2', 'top']) if (userText(old, k)) g[k] = old[k]; }
    PS.spec = g; photos().then(() => { const p = view.querySelector('.previewBox'); if (p) p.scrollIntoView({ block: 'nearest' }); }); return;
  }
  const old = PS.spec, [layout, theme] = nextRandom(old), fresh = newSpec(layout);
  PS.spec = old ? { ...old, wa: PREF.wa, waNumber: PREF.waNumber, layout, theme, a: LINES.includes(old.a) || old.a === 'SWISS DOT FABRIC' ? fresh.a : old.a } : { ...fresh, theme };   // giữ chữ người dùng tự gõ
  photos().then(() => { const p = view.querySelector('.previewBox'); if (p) p.scrollIntoView({ block: 'nearest' }); });
}
const randomButton = label => { const b = el('button', { type: 'button', className: 'btn', textContent: label }); b.onclick = randomize; return b; };
const fmtN = n => n.toLocaleString('vi-VN');
const catChips = () => chips([[EXPLORE, `${EXPLORE} (vô tận)`], ...CATS.map(c => [c, `${c} (${T.filter(t => t.cat === c).length})`])], PS.cat, v => { PS.cat = v; photos(); }, 'Nhóm mẫu');
// Khám phá: mỗi lần cuộn tới cuối lại sinh thêm mẫu mới, không bao giờ hết
function explore() {
  const run = ++thumbRun, grid = el('div', { className: 'tpl' }), more = el('button', { type: 'button', className: 'btn line', style: 'width:100%;margin:14px 0', textContent: 'Xem thêm mẫu' });
  view.append(el('div', {},
    waField(() => photos()),
    el('div', { className: 'bar' }, randomButton('🎲 Ngẫu nhiên')),
    el('h3', { textContent: `Bước 2: chọn mẫu — hơn ${fmtN(GEN_COUNT)} kiểu kết hợp, cuộn mãi không hết` }),
    el('p', { className: 'sub', textContent: `${SK_IDS.length} bố cục × ${SHAPES_BOX.length + 2} hình cắt ảnh × ${TEXT_STYLES.length} kiểu chữ × ${DECORS.length} hoạ tiết × ${THEMES.length} bảng màu × 4 font, theo mùa lễ. Bấm vào mẫu để chỉnh; trong lúc chỉnh có nút đổi riêng từng phần.` }),
    chips(Object.entries(SEASONS).map(([k, v]) => [k, v.name]), PS.season, v => { PS.season = v; savePref(); photos(); }, 'Mùa lễ'),
    formatChips(PS.format, v => { PS.format = v; savePref(); photos(); }),
    catChips(), grid, more));
  const [W] = FORMATS[PS.format], scale = 240 / W, queue = [];
  const batch = () => { for (let i = 0; i < 18; i++) { const sp = newGen(newSeed()), b = el('button', { type: 'button', className: 'tile', ariaLabel: 'Mẫu ' + SK_NAMES[sp.sk] }); b.onclick = () => { PS.spec = sp; photos(); }; grid.append(b); queue.push([sp, b]); } pump(); };
  let busy = false;
  const pump = () => { if (busy) return; busy = true; const step = () => { if (run !== thumbRun || !queue.length) { busy = false; return; } const [sp, b] = queue.shift(); try { b.append(renderSpec(sp, PS.photos, PS.assets, scale, false)); } catch (e) { console.error(sp, e); b.remove(); } setTimeout(step); }; step(); };
  more.onclick = batch;
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (run !== thumbRun) { io.disconnect(); return; } if (es.some(e => e.isIntersecting) && queue.length < 6) batch(); }, { rootMargin: '600px' }); io.observe(more); }
  batch();
}
function gallery() {
  if (PS.cat === EXPLORE) return explore();
  const run = ++thumbRun, grid = el('div', { className: 'tpl' }), ids = T.filter(t => t.cat === PS.cat);
  view.append(el('div', {},
    waField(() => photos()),
    el('div', { className: 'bar' }, randomButton('🎲 Ngẫu nhiên')),
    el('h3', { textContent: `Bước 2: chọn mẫu (${T.length} bố cục × ${THEMES.length} tông màu = ${T.length * THEMES.length} mẫu)` }),
    formatChips(PS.format, v => { PS.format = v; savePref(); photos(); }),
    themeChips(PS.theme, v => { PS.theme = v; savePref(); photos(); }),
    catChips(),
    grid));
  const [W] = FORMATS[PS.format], scale = 240 / W, queue = ids.map(t => { const b = el('button', { type: 'button', className: 'tile', ariaLabel: 'Mẫu ' + t.id }); b.onclick = () => { PS.spec = newSpec(t.id); photos(); }; grid.append(b); return [t, b]; });
  const next = () => { if (run !== thumbRun || !queue.length) return; const [t, b] = queue.shift(); try { b.append(renderSpec(newSpec(t.id), PS.photos, PS.assets, scale, false)); } catch (e) { console.error(t.id, e); } setTimeout(next); };
  next();
}
function editor() {
  thumbRun++;
  const s = PS.spec, preview = el('canvas', { className: 'preview' }), out = el('div');
  const draw = () => { histSoon(); const c = renderSpec(s, PS.photos, PS.assets, .5, false); preview.width = c.width; preview.height = c.height; preview.getContext('2d').drawImage(c, 0, 0); };
  let timer; const redraw = () => { clearTimeout(timer); timer = setTimeout(draw, 40); };
  const tr = () => s.trans[s.main];
  // kéo trên ảnh: dời ảnh, hoặc dời miếng che mặt nếu đang ở chế độ che mặt
  let drag = null;
  preview.onpointerdown = e => { const cv = s.covers[s.covers.length - 1]; drag = coverMode && cv ? ['cover', e.clientX, e.clientY, cv.x, cv.y] : ['pic', e.clientX, e.clientY, tr().px, tr().py]; preview.setPointerCapture(e.pointerId); };
  preview.onpointermove = e => { if (!drag) return; const r = preview.getBoundingClientRect(), dx = (e.clientX - drag[1]) / r.width, dy = (e.clientY - drag[2]) / r.height;
    if (drag[0] === 'cover') { const cv = s.covers[s.covers.length - 1]; cv.x = clamp(drag[3] + dx * 100, 0, 100); cv.y = clamp(drag[4] + dy * 100, 0, 100); }
    else { tr().px = clamp(drag[3] - dx, -1, 1); tr().py = clamp(drag[4] - dy, -1, 1); } redraw(); };
  preview.onpointerup = preview.onpointercancel = () => { drag = null; };
  const main = PS.photos.length > 1 ? el('div', { className: 'field' }, chips(PS.photos.map((_, i) => [i, 'Ảnh ' + (i + 1)]), s.main, v => { s.main = v; photos(); }, 'Ảnh chính')) : '';
  const btn = (t, f, cls = 'btn line') => { const b = el('button', { type: 'button', className: cls, textContent: t }); b.onclick = f; return b; };
  const imgBox = groupBox('Cắt, xoay, lật', true, main, slider('Phóng to', 100, 300, Math.round(tr().zoom * 100), v => { tr().zoom = v / 100; redraw(); }), el('p', { className: 'sub', textContent: 'Kéo trực tiếp trên ảnh để đổi vị trí.' }),
    el('div', { className: 'bar' }, btn('🧵 Thay vải (giữ nếp gấp)', () => fabricEditor(s.main, () => photos()), 'btn'), btn('Xoay 90°', () => { tr().rot = (tr().rot + 90) % 360; redraw(); }), btn('Lật ngang', () => { tr().flip = !tr().flip; redraw(); }), btn('Đặt lại', () => { Object.assign(tr(), { zoom: 1, px: 0, py: 0, rot: 0, flip: false }); photos(); })));
  const filter = el('select', { id: 'filter' }, ...Object.keys(FILTERS).map(f => el('option', { value: f, textContent: f }))); filter.value = s.filter; filter.onchange = () => { s.filter = filter.value; redraw(); };
  const colorBox = groupBox('Màu và ánh sáng', false, el('div', { className: 'field' }, el('label', { htmlFor: 'filter', textContent: 'Bộ lọc' }), filter),
    ...[['Độ sáng', 'b'], ['Tương phản', 'c'], ['Bão hoà', 's'], ['Ấm lạnh', 'w']].map(([t, k]) => slider(t, -50, 50, s[k], v => { s[k] = v; redraw(); })), slider('Độ nét', 0, 100, s.sh, v => { s.sh = v; redraw(); }),
    btn('Đặt lại màu', () => { Object.assign(s, { filter: 'Gốc', b: 0, c: 0, s: 0, w: 0, sh: 0 }); photos(); }));
  const show = el('input', { type: 'checkbox', id: 'showText', checked: s.showText }); show.onchange = () => { s.showText = show.checked; redraw(); };
  const field = (id, label, key, list, max) => { const i = el('input', { type: 'text', id, value: s[key], className: 'txt', maxLength: max }); i.oninput = () => { s[key] = i.value; redraw(); };
    const p = el('select', { ariaLabel: 'Chọn câu có sẵn' }, el('option', { value: '', textContent: 'Chọn câu có sẵn...' }), ...list.map(l => el('option', { value: l, textContent: l }))); p.onchange = () => { if (p.value) { i.value = s[key] = p.value; redraw(); } };
    return el('div', { className: 'field' }, el('label', { htmlFor: id, textContent: label }), i, p); };
  const textBox = groupBox('Chữ', true, el('div', { className: 'ticks' }, el('label', {}, show, ' Hiện chữ')),
    field('lineA', 'Tiêu đề (IN HOA)', 'a', s.gen ? [...new Set([...SEASONS[s.season].heads, ...LINES])] : LINES, 60), field('lineB', 'Dòng nghiêng', 'b2', s.gen ? [...new Set([...SEASONS[s.season].subs, ...SUBS])] : SUBS, 70), s.layout === 'ke-banner' || s.gen ? field('lineC', 'Dòng nhỏ phía trên (một số mẫu)', 'top', s.gen ? SEASONS[s.season].tops : TOPS, 40) : '',
    slider('Cỡ chữ', 60, 140, s.ts, v => { s.ts = v; redraw(); }), el('p', { className: 'sub', textContent: 'Chỉ ghi điều có thật. MOQ là 15 chiếc/mẫu. Không tự thêm giá hay cam kết.' }));
  const look = groupBox('Khổ và tông màu', false, formatChips(s.format, v => { s.format = v; PS.format = v; savePref(); photos(); }), themeChips(s.theme, v => { s.theme = v; PS.theme = v; savePref(); photos(); }));
  const lw = el('input', { type: 'checkbox', checked: s.logoWhite }); lw.onchange = () => { s.logoWhite = lw.checked; redraw(); };
  const logoBox = groupBox('Logo và WhatsApp', false,
    chips([['top', 'Giữa trên (như kho KE)'], ['tl', 'Góc trái trên'], ['br', 'Góc phải dưới']], s.logoPos, v => { s.logoPos = PREF.logoPos = v; savePref(); photos(); }, 'Vị trí logo'),
    slider('Cỡ logo (% bề ngang)', 18, 40, s.logoSize, v => { s.logoSize = PREF.logoSize = v; savePref(); redraw(); }),
    el('div', { className: 'ticks' }, el('label', {}, lw, ' Logo trắng (ảnh tối)')),
    waField(() => redraw()),
    el('p', { className: 'sub', textContent: 'Logo luôn có trên ảnh, không tắt được.' }));
  let coverMode = s.covers.length > 0;
  const coverInfo = el('p', { className: 'sub' });
  const coverSize = slider('Cỡ miếng che', 3, 20, s.covers.at(-1)?.r ?? 8, v => { const cv = s.covers.at(-1); if (cv) { cv.r = v; redraw(); } });
  const coverBox = groupBox('Che mặt bé', s.covers.length > 0, el('p', { className: 'sub', textContent: 'Hình tròn đỏ có trái tim trắng, như kho content KE. Thêm rồi kéo trên ảnh tới đúng mặt bé.' }),
    el('div', { className: 'bar' }, btn('+ Thêm miếng che', () => { s.covers.push({ x: 50, y: 30, r: 8 }); coverMode = true; redraw(); coverInfo.textContent = 'Đang ở chế độ che mặt: kéo trên ảnh để dời miếng che.'; }),
      btn('Bỏ miếng cuối', () => { s.covers.pop(); coverMode = s.covers.length > 0; redraw(); coverInfo.textContent = ''; }),
      btn('Kéo ảnh / kéo miếng che', () => { coverMode = !coverMode && s.covers.length > 0; coverInfo.textContent = coverMode ? 'Kéo trên ảnh để dời miếng che.' : 'Kéo trên ảnh để dời ảnh.'; })),
    coverSize, coverInfo);
  let genBox = '';
  if (s.gen) {
    const FONT_NAMES = { social: 'Montserrat (KE)', lux: 'Cormorant sang', editorial: 'Playfair tạp chí', soft: 'Quicksand mềm' };
    const AX = [['sk', 'Bố cục', SK_IDS, SK_NAMES], ['shape', 'Hình cắt ảnh', [...new Set([...SHAPES_BOX, ...SHAPES_SQ])], { rect: 'Vuông góc', round: 'Bo nhẹ', soft: 'Bo tròn', arch: 'Vòm', scallop: 'Vỏ sò', stamp: 'Tem thư', circle: 'Tròn', heart: 'Trái tim', oval: 'Bầu dục' }],
      ['tstyle', 'Kiểu chữ', TEXT_STYLES, TS_NAMES], ['decor', 'Hoạ tiết', DECORS, DC_NAMES], ['theme', 'Bảng màu', THEMES.map(t => t.id), Object.fromEntries(THEMES.map(t => [t.id, t.name]))],
      ['font', 'Font', ['social', 'lux', 'editorial', 'soft'], FONT_NAMES], ['motif', 'Hình nhỏ', Object.keys(MOTIF), { heart: 'Tim', dot: 'Chấm', flower: 'Hoa', bow: 'Nơ', shamrock: 'Cỏ 3 lá', egg: 'Trứng', bunny: 'Thỏ', sun: 'Mặt trời', pumpkin: 'Bí ngô', star: 'Sao', snow: 'Bông tuyết' }]];
    const rows = AX.map(([k, label, list, names]) => { const b = el('button', { type: 'button', className: 'btn line', textContent: `${label}: ${names[s[k]] || s[k]} ↻` });
      b.onclick = () => { const others = list.filter(v => v !== s[k]); s[k] = others[Math.floor(Math.random() * others.length)];
        if (k === 'sk' && SKELETONS[s.sk](1080, 1080, 'rect', () => .5).full && PAPER_DECOR.has(s.decor)) s.decor = 'stitch';
        b.textContent = `${label}: ${names[s[k]] || s[k]} ↻`; redraw(); }; return b; });
    const season = el('select', { ariaLabel: 'Mùa lễ' }, ...Object.entries(SEASONS).map(([k, v]) => el('option', { value: k, textContent: 'Mùa: ' + v.name }))); season.value = s.season;
    season.onchange = () => { PS.season = s.season = season.value; savePref(); const g = genSpec(s.seed, s.season, s.format, { sk: s.sk, shape: s.shape, tstyle: s.tstyle, decor: s.decor, font: s.font }); Object.assign(s, { theme: g.theme, motif: g.motif }); for (const k of ['a', 'b2', 'top']) if (!userText(s, k)) s[k] = g[k]; photos(); };
    genBox = groupBox('Đổi từng phần của mẫu', true, el('p', { className: 'sub', textContent: 'Mỗi nút đổi riêng một phần, phần khác giữ nguyên. Bấm 🎲 để đổi cả mẫu.' }), season, el('div', { className: 'bar' }, ...rows));
  }
  const save = el('button', { type: 'button', className: 'btn', textContent: 'Tải ảnh này' }); save.onclick = () => exportMany([s], out);
  const all = PS.photos.length > 1 ? btn(`Áp dụng cho cả ${PS.photos.length} ảnh`, () => exportMany(PS.photos.map((_, i) => ({ ...s, main: i, covers: i === s.main ? s.covers : [] })), out)) : '';
  view.append(el('div', { className: 'bar' }, btn('← Chọn mẫu khác', () => { PS.spec = null; photos(); })), el('div', { className: 'previewBox' }, preview),
    el('div', { className: 'bar', style: 'margin-top:12px' }, randomButton('🎲 Mẫu khác'), save, all, btn('⌨ Phím tắt', showKeys)), out, genBox, textBox, imgBox, coverBox, logoBox, colorBox, look);
  draw();
}
async function exportMany(specs, out) {
  out.replaceChildren(el('p', { textContent: 'Đang tạo ảnh...' }));
  const items = [];
  try {
    for (const s of specs) {
      const c = renderSpec(s, PS.photos, PS.assets, EXPORT_W / FORMATS[s.format][0], true);
      const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .93)); c.width = c.height = 0;
      const src = PS.photos[s.main].name, name = `KE_${src.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_')}_${s.layout}_${s.theme}.jpg`, url = URL.createObjectURL(blob);
      items.push(el('div', {}, el('img', { src: url, alt: 'Ảnh đã tạo theo mẫu ' + s.layout }), el('a', { className: 'btn line', style: 'margin-top:6px', href: url, download: name, textContent: 'Tải về' })));
      await new Promise(r => setTimeout(r));
    }
    out.replaceChildren(el('h3', { textContent: `Đã tạo ${items.length} ảnh (${EXPORT_W} px)` }), el('p', { className: 'sub', textContent: 'Bấm Tải về. Điện thoại không tải được thì nhấn giữ ảnh rồi chọn Lưu ảnh.' }), el('div', { className: 'grid' }, ...items));
  } catch (e) { out.replaceChildren(el('p', { className: 'err', role: 'alert', textContent: 'Không tạo được ảnh: ' + e.message })); }
}

window.addEventListener('DOMContentLoaded', () => { view = document.getElementById('view'); photos(); });
