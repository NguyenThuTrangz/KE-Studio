/* Bộ sinh mẫu KE Studio: mỗi mẫu = bố cục × hình cắt ảnh × kiểu chữ × hoạ tiết × bảng màu × font × mùa.
   Mỗi trục đều theo nhận diện KE (BRAND.md): logo cố định, màu sản phẩm, hoạ tiết may thêu (smock, chỉ khâu, vỏ sò, Swiss dot).
   Hàng triệu tổ hợp; cùng một "seed" luôn ra cùng một mẫu. */

const rngOf = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const pickR = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const R_TOP = 170;   // vùng logo phía trên (đơn vị khung 1080)

// ---------- mùa lễ: bảng màu, hoạ tiết, câu chữ (khách làm collection theo dịp lễ — thông tin từ Sale) ----------
const SEASONS = {
  all: { name: 'Hằng ngày', pals: ['ke', 'logo', 'pink', 'sage', 'cream', 'navy', 'butter', 'blue', 'peach', 'green', 'lavender', 'mint'], motifs: ['flower', 'bow', 'heart', 'dot', 'sun'],
    heads: LINES, subs: SUBS, tops: TOPS },
  valentine: { name: 'Valentine', pals: ['valentine', 'pink', 'rose', 'cream', 'ke'], motifs: ['heart', 'bow'],
    heads: ['VALENTINE COLLECTION', 'SMOCKED WITH LOVE', '100% HAND SMOCKING', 'FREE 2D MOCK-UP'], subs: ['Hand smocked with love', 'Plan your Valentine collection early', 'You dream it - We smock it'], tops: ['Valentine’s Day', 'New Collection'] },
  stpatrick: { name: 'St. Patrick', pals: ['mint', 'green', 'ke', 'cream'], motifs: ['shamrock', 'dot'],
    heads: ['ST. PATRICK’S DAY COLLECTION', 'LUCKY LITTLE LOOKS', 'HAND SMOCKING & EMBROIDERY'], subs: ['Hand smocked shamrocks', 'You dream it - We smock it'], tops: ['St. Patrick’s Day', 'New Collection'] },
  easter: { name: 'Easter', pals: ['lavender', 'butter', 'mint', 'pink', 'blue'], motifs: ['egg', 'bunny', 'flower'],
    heads: ['EASTER COLLECTION', 'BUNNIES & BLOOMS', '100% HAND SMOCKING', 'FREE 2D MOCK-UP'], subs: ['Plan your Easter collection early', 'Hand smocked for spring', 'You dream it - We smock it'], tops: ['Easter', 'Spring Collection'] },
  mother: { name: 'Mother’s Day', pals: ['rose', 'pink', 'cream', 'peach', 'sage'], motifs: ['flower', 'heart'],
    heads: ['MOTHER’S DAY COLLECTION', 'MADE WITH LOVE', 'HAND SMOCKING & EMBROIDERY'], subs: ['Stitched by hand, made with love', 'You dream it - We smock it'], tops: ['Mother’s Day', 'New Collection'] },
  summer: { name: 'Mùa hè', pals: ['butter', 'blue', 'peach', 'mint', 'ke'], motifs: ['sun', 'flower', 'dot'],
    heads: ['SUMMER COLLECTION', 'SUNNY SMOCKED STYLES', 'LOW MOQ · 15 PCS/STYLE'], subs: ['Hand smocked for summer', 'You dream it - We smock it'], tops: ['Summer', 'New Collection'] },
  halloween: { name: 'Halloween', pals: ['halloween', 'cream', 'navy'], motifs: ['pumpkin', 'star'],
    heads: ['HALLOWEEN COLLECTION', 'LITTLE PUMPKINS', 'CUSTOM YOUR COLLECTION'], subs: ['Hand smocked pumpkins', 'You dream it - We smock it'], tops: ['Halloween', 'New Collection'] },
  christmas: { name: 'Giáng sinh', pals: ['xmas', 'xmasred', 'cream', 'sage', 'navy'], motifs: ['star', 'snow', 'bow'],
    heads: ['CHRISTMAS COLLECTION', 'SHARE YOUR IDEAS WITH US', 'HOLIDAY SMOCKED STYLES'], subs: ['Plan your holiday collection early', 'You dream it - We smock it'], tops: ['Merry Christmas', 'Holiday Collection'] },
};
// bảng màu thêm cho mùa lễ (nền pastel theo màu vải sản phẩm; chữ vẫn là xanh/navy/xanh lá của KE)
THEMES.push(
  { id: 'butter', name: 'Vàng bơ', paper: '#FFF6D6', ink: '#243F93', accent: '#438D41', font: 'social' },
  { id: 'blue', name: 'Xanh phấn', paper: '#E3EEF8', ink: '#243F93', accent: '#438D41', font: 'social' },
  { id: 'peach', name: 'Đào', paper: '#FCE6D8', ink: '#1B2A4A', accent: '#B98E4C', font: 'lux' },
  { id: 'lavender', name: 'Tím lavender', paper: '#EDE6F6', ink: '#243F93', accent: '#438D41', font: 'social' },
  { id: 'mint', name: 'Bạc hà', paper: '#E3F1E1', ink: '#2F6E2E', accent: '#B98E4C', font: 'social' },
  { id: 'rose', name: 'Hồng đất', paper: '#F6DADF', ink: '#1B2A4A', accent: '#B5485D', font: 'lux' },
  { id: 'valentine', name: 'Valentine', paper: '#FBE3E6', ink: '#C8323C', accent: '#243F93', font: 'social' },
  { id: 'halloween', name: 'Halloween', paper: '#FBF1E4', ink: '#1B2A4A', accent: '#D9772B', font: 'social' },
  { id: 'xmasred', name: 'Đỏ Noel', paper: '#B8383A', ink: '#FFFFFF', accent: '#F4EEE4', font: 'social', dark: true },
);
// cặp font thêm (vẫn chữ hình học / chữ có chân sang như website)
FONTS.editorial = { head: '700 {s}px "Playfair Display", Georgia, serif', sub: 'italic 600 {s}px Montserrat, Arial, sans-serif', upper: true };
FONTS.soft = { head: '700 {s}px Quicksand, Montserrat, Arial, sans-serif', sub: 'italic 500 {s}px "Cormorant Garamond", Georgia, serif', upper: true };
const FONT_IDS = ['social', 'social', 'lux', 'editorial', 'soft'];   // Montserrat (chuẩn KE) hay gặp nhất

// ---------- hoạ tiết vẽ bằng nét (không dùng ảnh ngoài) ----------
const MOTIF = {
  heart(x, s) { x.beginPath(); x.moveTo(0, s * .35); x.bezierCurveTo(-s * 1.1, -s * .25, -s * .5, -s * 1, 0, -s * .45); x.bezierCurveTo(s * .5, -s * 1, s * 1.1, -s * .25, 0, s * .35); x.fill(); },
  dot(x, s) { x.beginPath(); x.arc(0, 0, s * .35, 0, 7); x.fill(); },
  flower(x, s) { for (let i = 0; i < 5; i++) { x.save(); x.rotate(i * Math.PI * 2 / 5); x.beginPath(); x.ellipse(0, -s * .42, s * .26, s * .4, 0, 0, 7); x.fill(); x.restore(); } x.save(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(0, 0, s * .17, 0, 7); x.fill(); x.restore(); },
  bow(x, s) { x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-s * .9, -s * .75, -s * .95, 0); x.quadraticCurveTo(-s * .9, s * .75, 0, 0); x.quadraticCurveTo(s * .9, -s * .75, s * .95, 0); x.quadraticCurveTo(s * .9, s * .75, 0, 0); x.fill();
    x.beginPath(); x.moveTo(-s * .1, s * .05); x.lineTo(-s * .45, s * .85); x.lineTo(-s * .2, s * .8); x.lineTo(0, s * .15); x.lineTo(s * .2, s * .8); x.lineTo(s * .45, s * .85); x.lineTo(s * .1, s * .05); x.fill(); x.beginPath(); x.arc(0, 0, s * .16, 0, 7); x.fill(); },
  shamrock(x, s) { for (let i = 0; i < 3; i++) { x.save(); x.rotate(i * Math.PI * 2 / 3); x.translate(0, -s * .38); x.scale(.62, .62); MOTIF.heart(x, s); x.restore(); } x.save(); x.lineWidth = s * .09; x.strokeStyle = x.fillStyle; x.beginPath(); x.moveTo(0, s * .1); x.quadraticCurveTo(s * .15, s * .6, s * .35, s * .85); x.stroke(); x.restore(); },
  egg(x, s) { x.beginPath(); x.ellipse(0, 0, s * .42, s * .56, 0, 0, 7); x.fill(); x.save(); x.clip(); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(-s, -s * .08, s * 2, s * .13); for (let i = -2; i <= 2; i++) { x.beginPath(); x.arc(i * s * .2, s * .25, s * .05, 0, 7); x.fill(); } x.restore(); },
  bunny(x, s) { x.beginPath(); x.arc(0, s * .2, s * .38, 0, 7); x.fill(); x.beginPath(); x.ellipse(-s * .18, -s * .45, s * .12, s * .36, -.15, 0, 7); x.fill(); x.beginPath(); x.ellipse(s * .18, -s * .45, s * .12, s * .36, .15, 0, 7); x.fill(); },
  sun(x, s) { x.beginPath(); x.arc(0, 0, s * .3, 0, 7); x.fill(); x.save(); x.lineWidth = s * .08; x.lineCap = 'round'; x.strokeStyle = x.fillStyle; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(Math.cos(a) * s * .44, Math.sin(a) * s * .44); x.lineTo(Math.cos(a) * s * .62, Math.sin(a) * s * .62); x.stroke(); } x.restore(); },
  pumpkin(x, s) { for (const dx of [-.22, .22, 0]) { x.beginPath(); x.ellipse(dx * s, s * .05, s * .3, s * .4, 0, 0, 7); x.fill(); } x.save(); x.fillStyle = '#438D41'; x.fillRect(-s * .05, -s * .5, s * .1, s * .18); x.restore(); },
  star(x, s) { x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .22 : s * .5, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); },
  snow(x, s) { x.save(); x.lineWidth = s * .07; x.lineCap = 'round'; x.strokeStyle = x.fillStyle; for (let i = 0; i < 6; i++) { x.save(); x.rotate(i * Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * .5); x.moveTo(0, -s * .3); x.lineTo(-s * .12, -s * .42); x.moveTo(0, -s * .3); x.lineTo(s * .12, -s * .42); x.stroke(); x.restore(); } x.restore(); },
};
const motif = (x, name, cx, cy, s, color, rot = 0) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = color; (MOTIF[name] || MOTIF.dot)(x, s); x.restore(); };

// ---------- hình cắt ảnh ----------
function shapePath(x, shape, a, b, w, h) {
  const r = Math.min(w, h);
  if (shape === 'round') x.roundRect(a, b, w, h, r * .08);
  else if (shape === 'soft') x.roundRect(a, b, w, h, r * .2);
  else if (shape === 'arch') { x.moveTo(a, b + h); x.lineTo(a, b + w / 2); x.arc(a + w / 2, b + w / 2, w / 2, Math.PI, 0); x.lineTo(a + w, b + h); x.closePath(); }
  else if (shape === 'circle') x.ellipse(a + w / 2, b + h / 2, r / 2, r / 2, 0, 0, 7);
  else if (shape === 'oval') x.ellipse(a + w / 2, b + h / 2, w / 2, h / 2, 0, 0, 7);
  else if (shape === 'scallop') scallop(x, a + w / 2, b + h / 2, r / 2, 18);
  else if (shape === 'stamp') { const n = Math.max(8, Math.round(w / 34)), m = Math.max(8, Math.round(h / 34)), rr = Math.min(w / n, h / m) * .32; x.rect(a, b, w, h);
    for (let i = 0; i <= n; i++) { x.moveTo(a + i * w / n + rr, b); x.arc(a + i * w / n, b, rr, 0, 7, true); x.moveTo(a + i * w / n + rr, b + h); x.arc(a + i * w / n, b + h, rr, 0, 7, true); }
    for (let i = 0; i <= m; i++) { x.moveTo(a + rr, b + i * h / m); x.arc(a, b + i * h / m, rr, 0, 7, true); x.moveTo(a + w + rr, b + i * h / m); x.arc(a + w, b + i * h / m, rr, 0, 7, true); } }
  else if (shape === 'heart') { const cx = a + w / 2, s = Math.min(w, h * 1.05) / 2; x.moveTo(cx, b + h * .98); x.bezierCurveTo(cx - s * 1.25, b + h * .55, cx - s * 1.05, b - h * .02, cx, b + h * .26); x.bezierCurveTo(cx + s * 1.05, b - h * .02, cx + s * 1.25, b + h * .55, cx, b + h * .98); }
  else x.rect(a, b, w, h);
}
const SHAPES_BOX = ['rect', 'round', 'soft', 'arch', 'scallop', 'stamp'];
const SHAPES_SQ = ['circle', 'scallop', 'heart', 'round', 'soft', 'stamp'];

// ---------- bố cục (khung 1080 × H). Trả về: ảnh, vùng chữ, ảnh có tràn viền không, nền đầu ảnh là giấy hay ảnh ----------
// khổ dọc (4:5 cao, 9:16): 3 ảnh tròn xếp so le theo chiều dọc, chữ ở trên hoặc dưới
function tallCircles(W, H, shape, textAt) {
  const th = H * .2, y0 = textAt === 'top' ? R_TOP + th + 20 : R_TOP, avail = H - R_TOP - th - 60, d = Math.min(W * .56, avail / 2.3), gap = (avail - d) / 2;
  return { head: true, photos: [0, 1, 2].map(i => ({ x: i % 2 ? W - d - 50 : 50, y: y0 + i * gap, w: d, h: d, shape })),
    text: { x: 60, y: textAt === 'top' ? R_TOP : H - th - 30, w: W - 120, h: th, on: 'paper' } };
}
const SKELETONS = {
  'full-bottom': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H }], text: { x: 60, y: H * .66, w: W - 120, h: H * .28, on: 'photo' }, full: true }),
  'full-middle': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H }], text: { x: 40, y: H * .5 - H * .15, w: W - 80, h: H * .3, on: 'photo' }, full: true }),
  'full-top': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H }], text: { x: 60, y: R_TOP + 10, w: W - 120, h: H * .24, on: 'photo' }, full: true }),
  'full-corner': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H }], text: { x: 50, y: H * .7, w: W * .56, h: H * .25, on: 'photo', align: 'left' }, full: true }),
  'window': (W, H, s) => ({ head: true, photos: [{ x: 70, y: R_TOP, w: W - 140, h: H - R_TOP - H * .25, shape: s }], text: { x: 70, y: H - H * .24, w: W - 140, h: H * .2, on: 'paper' } }),
  'window-wide': (W, H, s) => ({ head: true, photos: [{ x: 36, y: R_TOP, w: W - 72, h: H - R_TOP - H * .2, shape: s === 'arch' ? 'round' : s }], text: { x: 60, y: H - H * .19, w: W - 120, h: H * .16, on: 'paper' } }),
  'side-left': (W, H, s) => ({ head: true, photos: [{ x: W * .42, y: R_TOP, w: W * .58 - 40, h: H - R_TOP - 40, shape: s === 'scallop' ? 'soft' : s }], text: { x: 40, y: R_TOP, w: W * .42 - 70, h: H - R_TOP - 40, on: 'paper' } }),
  'side-right': (W, H, s) => ({ head: true, photos: [{ x: 40, y: R_TOP, w: W * .58 - 40, h: H - R_TOP - 40, shape: s === 'scallop' ? 'soft' : s }], text: { x: W * .58 + 30, y: R_TOP, w: W * .42 - 70, h: H - R_TOP - 40, on: 'paper' } }),
  'top-photo': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H * .7 }], text: { x: 60, y: H * .72, w: W - 120, h: H * .25, on: 'paper' } }),
  'bottom-photo': (W, H, s) => ({ head: true, photos: [{ x: 0, y: H * .42, w: W, h: H * .58, shape: s === 'arch' ? 'arch' : 'rect' }], text: { x: 60, y: R_TOP, w: W - 120, h: H * .42 - R_TOP - 10, on: 'paper' } }),
  'polaroid': (W, H, s, r) => ({ head: true, photos: [{ x: 120, y: R_TOP + 10, w: W - 240, h: H - R_TOP - H * .3, mat: true, rot: (r() - .5) * .1 }], text: { x: 70, y: H - H * .22, w: W - 140, h: H * .18, on: 'paper' } }),
  'polaroid-two': (W, H, s, r) => ({ head: true, photos: [{ x: 70, y: R_TOP + 20, w: W * .5, h: (H - R_TOP) * .55, mat: true, rot: -.06 - r() * .04 }, { x: W * .42, y: R_TOP + (H - R_TOP) * .18, w: W * .5, h: (H - R_TOP) * .55, mat: true, rot: .05 + r() * .04 }], text: { x: 70, y: H - H * .2, w: W - 140, h: H * .17, on: 'paper' } }),
  'duo': (W, H, s) => ({ head: true, photos: [{ x: 50, y: R_TOP, w: (W - 120) / 2, h: H - R_TOP - H * .24, shape: s }, { x: W / 2 + 10, y: R_TOP, w: (W - 120) / 2, h: H - R_TOP - H * .24, shape: s }], text: { x: 60, y: H - H * .22, w: W - 120, h: H * .19, on: 'paper' } }),
  'duo-stack': (W, H, s) => ({ head: true, photos: [{ x: 40, y: R_TOP, w: W * .52, h: (H - R_TOP - 60) / 2, shape: s === 'arch' ? 'round' : s }, { x: 40, y: R_TOP + (H - R_TOP - 60) / 2 + 20, w: W * .52, h: (H - R_TOP - 60) / 2, shape: s === 'arch' ? 'round' : s }], text: { x: W * .52 + 70, y: R_TOP, w: W * .48 - 100, h: H - R_TOP - 40, on: 'paper' } }),
  'trio': (W, H) => ({ head: true, photos: [{ x: 40, y: R_TOP, w: W * .6, h: H - R_TOP - H * .23 }, { x: W * .6 + 56, y: R_TOP, w: W * .4 - 96, h: (H - R_TOP - H * .23 - 16) / 2 }, { x: W * .6 + 56, y: R_TOP + (H - R_TOP - H * .23 + 16) / 2, w: W * .4 - 96, h: (H - R_TOP - H * .23 - 16) / 2 }], text: { x: 60, y: H - H * .21, w: W - 120, h: H * .18, on: 'paper' } }),
  'hero-three': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H * .66 }, ...[0, 1, 2].map(i => ({ x: 30 + i * (W - 60) / 3 + 5, y: H * .66 + 12, w: (W - 60) / 3 - 10, h: H * .34 - 42, shape: 'round' }))], text: { x: 60, y: H * .44, w: W - 120, h: H * .2, on: 'photo' }, full: true }),
  'grid-four': (W, H) => { const gw = (W - 110) / 2, gh = (H - R_TOP - 60) / 2; return { head: true, photos: [0, 1, 2, 3].map(i => ({ x: 45 + (i % 2) * (gw + 20), y: R_TOP + ((i / 2) | 0) * (gh + 20), w: gw, h: gh, shape: 'round' })), text: { x: W * .2, y: R_TOP + gh - H * .09 + 10, w: W * .6, h: H * .18, on: 'photo', center: true } }; },
  'circles-three': (W, H) => { if (H / W > 1.3) return tallCircles(W, H, 'circle', 'top'); const d = (W - 140) / 3; return { head: true, photos: [0, 1, 2].map(i => ({ x: 40 + i * (d + 30), y: H * .52 - d / 2 + (i === 1 ? -40 : 30), w: d, h: d, shape: 'circle' })), text: { x: 60, y: R_TOP, w: W - 120, h: H * .52 - d / 2 - R_TOP - 60, on: 'paper' } }; },
  'circles-scallop': (W, H) => { if (H / W > 1.3) return tallCircles(W, H, 'scallop', 'bottom'); const d = (W - 140) / 3; return { head: true, photos: [0, 1, 2].map(i => ({ x: 40 + i * (d + 30), y: H * .45 - d / 2 + (i === 1 ? 40 : -20), w: d, h: d, shape: 'scallop' })), text: { x: 60, y: H * .45 + d / 2 + 70, w: W - 120, h: H - (H * .45 + d / 2 + 70) - 40, on: 'paper' } }; },
  'arches-two': (W, H) => ({ head: true, photos: [{ x: 70, y: R_TOP + 20, w: (W - 180) / 2, h: H - R_TOP - H * .27, shape: 'arch' }, { x: W / 2 + 20, y: R_TOP + 20, w: (W - 180) / 2, h: H - R_TOP - H * .27, shape: 'arch' }], text: { x: 60, y: H - H * .23, w: W - 120, h: H * .2, on: 'paper' } }),
  'big-circle': (W, H, s) => { const d = Math.min(W - 160, H - R_TOP - H * .26); return { head: true, photos: [{ x: (W - d) / 2, y: R_TOP + 10, w: d, h: d, shape: ['circle', 'scallop', 'heart'].includes(s) ? s : 'circle' }], text: { x: 60, y: R_TOP + d + 30, w: W - 120, h: H - R_TOP - d - 60, on: 'paper' } }; },
  'diagonal': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H, poly: [[0, 0], [W, 0], [W, H * .72], [0, H * .94]] }], text: { x: 60, y: H * .8, w: W - 120, h: H * .17, on: 'paper' } }),
  'filmstrip': (W, H) => { const w = (W - 100) / 3; return { head: true, photos: [0, 1, 2].map(i => ({ x: 30 + i * (w + 20), y: R_TOP, w, h: H - R_TOP - H * .24, shape: 'round' })), text: { x: 60, y: H - H * .22, w: W - 120, h: H * .19, on: 'paper' } }; },
  'stamps': (W, H, s, r) => ({ head: true, photos: [{ x: 60, y: R_TOP + 20, w: W * .55, h: (H - R_TOP) * .5, shape: 'stamp', rot: -.05 - r() * .03 }, { x: W * .45, y: R_TOP + (H - R_TOP) * .26, w: W * .48, h: (H - R_TOP) * .44, shape: 'stamp', rot: .05 + r() * .03 }], text: { x: 60, y: H - H * .22, w: W - 120, h: H * .19, on: 'paper' } }),
  'magazine': (W, H) => ({ photos: [{ x: 0, y: 0, w: W, h: H * .74 }], text: { x: 0, y: H * .74, w: W, h: H * .26, on: 'paper', band: true } }),
  'frame-ring': (W, H, s) => ({ photos: [{ x: 80, y: R_TOP, w: W - 160, h: H - R_TOP - H * .24, shape: s === 'scallop' ? 'scallop' : 'rect' }], head: true, text: { x: 80, y: H - H * .22, w: W - 160, h: H * .19, on: 'paper' } }),
  'hero-square': (W, H, s) => { const d = Math.min(W - 200, H - R_TOP - 240); return { head: true, photos: [{ x: 100, y: Math.max(R_TOP, (H - d) / 2 - 60), w: d, h: d, shape: s }], text: { x: 70, y: Math.max(R_TOP, (H - d) / 2 - 60) + d + 20, w: W - 140, h: H - (Math.max(R_TOP, (H - d) / 2 - 60) + d + 20) - 40, on: 'paper' } }; },
};
const SK_IDS = Object.keys(SKELETONS);
const SK_NAMES = { 'full-bottom': 'Toàn ảnh – chữ dưới', 'full-middle': 'Toàn ảnh – chữ giữa', 'full-top': 'Toàn ảnh – chữ trên', 'full-corner': 'Toàn ảnh – chữ góc', window: 'Cửa sổ', 'window-wide': 'Cửa sổ rộng', 'side-left': 'Chữ trái', 'side-right': 'Chữ phải', 'top-photo': 'Ảnh trên', 'bottom-photo': 'Ảnh dưới', polaroid: 'Polaroid', 'polaroid-two': '2 Polaroid', duo: '2 ảnh', 'duo-stack': '2 ảnh chồng', trio: '3 ảnh', 'hero-three': '1 lớn 3 nhỏ', 'grid-four': '4 ô', 'circles-three': '3 tròn', 'circles-scallop': '3 vỏ sò', 'arches-two': '2 vòm', 'big-circle': 'Tròn lớn', diagonal: 'Chéo', filmstrip: 'Dải phim', stamps: 'Tem thư', magazine: 'Tạp chí', 'frame-ring': 'Khung giấy', 'hero-square': 'Vuông giữa' };

// ---------- kiểu chữ ----------
const TEXT_STYLES = ['stack', 'box', 'ribbon', 'pill', 'label', 'underline', 'badge', 'rule', 'tag', 'script', 'arc', 'bands'];
const TS_NAMES = { stack: 'Xếp tầng', box: 'Khung trắng', ribbon: 'Ruy băng', pill: 'Viên thuốc', label: 'Nhãn chỉ khâu', underline: 'Gạch chân smock', badge: 'Huy hiệu tròn', rule: 'Thanh dọc', tag: 'Thẻ treo', script: 'Chữ nghiêng lớn', arc: 'Chữ vòng cung', bands: 'Hai dải màu' };
// ---------- hoạ tiết ----------
const DECORS = ['none', 'stripes', 'gingham', 'swissdot', 'smock', 'stitch', 'scallop', 'confetti', 'corners', 'ricrac', 'bow', 'lace'];
const DC_NAMES = { none: 'Trơn', stripes: 'Sọc', gingham: 'Kẻ ô', swissdot: 'Chấm Swiss dot', smock: 'Đường smock', stitch: 'Viền chỉ khâu', scallop: 'Viền vỏ sò', confetti: 'Rắc hoạ tiết', corners: 'Hoạ tiết góc', ricrac: 'Viền ric-rac', bow: 'Nơ', lace: 'Ren chấm' };
const PAPER_DECOR = new Set(['stripes', 'gingham', 'swissdot', 'confetti', 'lace']);

function genSpec(seed, season = 'all', format = '1:1', keep = {}) {
  const r = rngOf(seed), S = SEASONS[season] || SEASONS.all;
  const sk = keep.sk || pickR(r, SK_IDS), full = SKELETONS[sk](1080, FORMATS[format][1], 'rect', r).full;
  let decor = keep.decor || pickR(r, DECORS); if (full && PAPER_DECOR.has(decor)) decor = pickR(r, ['stitch', 'scallop', 'corners', 'none', 'bow']);
  return { gen: true, seed, season, sk, shape: keep.shape || pickR(r, sk === 'big-circle' || sk === 'hero-square' ? SHAPES_SQ : SHAPES_BOX), tstyle: keep.tstyle || pickR(r, TEXT_STYLES),
    decor, theme: keep.theme || pickR(r, S.pals), font: keep.font || pickR(r, FONT_IDS), motif: keep.motif || pickR(r, S.motifs),
    a: pickR(r, S.heads), b2: pickR(r, S.subs), top: pickR(r, S.tops) };
}

/* ---------- vẽ một mẫu sinh ---------- */
function drawGen(g, x, spec) {
  const { W, H, t } = g, r = rngOf(spec.seed * 7 + 3), F = FONTS[spec.font] || FONTS[t.font];
  const L = SKELETONS[spec.sk](W, H, spec.shape || 'rect', rngOf(spec.seed));
  const dark = t.dark, soft = dark ? 'rgba(255,255,255,.22)' : hexA(t.ink, .14), accentSoft = hexA(t.accent, .35);
  // 1) nền giấy + hoạ tiết nền (ảnh sẽ phủ lên)
  g.fill(t.paper, 0, 0, W, H);
  if (spec.decor === 'stripes') g.stripes(t.paper, soft, 0, 0, W, H, 22 + Math.round(r() * 12));
  if (spec.decor === 'gingham') { x.save(); x.globalAlpha = .9; g.gingham(dark ? '#FFFFFF' : t.ink, 0, 0, W, H, 28 + Math.round(r() * 14)); x.restore(); if (dark) { x.save(); x.globalAlpha = .7; g.fill(t.paper, 0, 0, W, H); x.restore(); } }
  if (spec.decor === 'swissdot') { const st = 46; x.fillStyle = soft; for (let yy = 0, k = 0; yy < H + st; yy += st, k++) for (let xx = (k % 2) * st / 2; xx < W + st; xx += st) { x.beginPath(); x.arc(xx, yy, 5, 0, 7); x.fill(); } }
  if (spec.decor === 'confetti') { const rects = [...L.photos, L.text].map(p => [p.x - 30, p.y - 30, p.w + 60, p.h + 60]); let n = 0;
    for (let k = 0; k < 400 && n < 26; k++) { const cx = r() * W, cy = R_TOP * .2 + r() * H, s = 22 + r() * 26; if (cy < R_TOP && Math.abs(cx - W / 2) < W * .22) continue; if (rects.some(([a, b, w, h]) => cx > a && cx < a + w && cy > b && cy < b + h)) continue;
      motif(x, spec.motif, cx, cy, s, n % 3 ? accentSoft : hexA(t.ink, dark ? .4 : .22), (r() - .5) * .8); n++; } }
  if (spec.decor === 'lace') { x.fillStyle = soft; for (const yy of [0, H]) for (let xx = 0; xx <= W; xx += 40) { x.beginPath(); x.arc(xx, yy, 18, 0, 7); x.fill(); x.save(); x.fillStyle = t.paper; x.beginPath(); x.arc(xx, yy, 7, 0, 7); x.fill(); x.restore(); } }
  // 2) ảnh
  for (const p of L.photos) {
    x.save();
    if (p.rot) { x.translate(p.x + p.w / 2, p.y + p.h / 2); x.rotate(p.rot); x.translate(-(p.x + p.w / 2), -(p.y + p.h / 2)); }
    if (p.mat) { x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 24; x.shadowOffsetY = 8; g.fill('#FFFFFF', p.x - 18, p.y - 18, p.w + 36, p.h + 90); x.restore(); }
    else if (!L.full && p.shape !== 'stamp' && (p.shape || 'rect') !== 'rect' && r() < .5) { x.save(); x.shadowColor = 'rgba(0,0,0,.14)'; x.shadowBlur = 20; x.shadowOffsetY = 6; x.fillStyle = t.paper; x.beginPath(); shapePath(x, p.shape, p.x, p.y, p.w, p.h); x.fill(); x.restore(); }
    if (p.shape === 'stamp') { x.save(); x.shadowColor = 'rgba(0,0,0,.16)'; x.shadowBlur = 16; x.fillStyle = '#FFFFFF'; x.beginPath(); shapePath(x, 'stamp', p.x - 14, p.y - 14, p.w + 28, p.h + 28); x.fill('evenodd'); x.restore(); }
    g.pic(p.x, p.y, p.w, p.h, p.poly ? xx => { p.poly.forEach((q, i) => i ? xx.lineTo(q[0], q[1]) : xx.moveTo(q[0], q[1])); xx.closePath(); } : xx => shapePath(xx, p.shape || 'rect', p.x, p.y, p.w, p.h));
    x.restore();
  }
  // 3) hoạ tiết nổi
  const T0 = L.text, onPhoto = T0.on === 'photo', patterned = PAPER_DECOR.has(spec.decor) && spec.decor !== 'confetti';
  if (spec.decor === 'stitch') { x.save(); x.strokeStyle = L.full ? '#FFFFFF' : t.accent; x.lineWidth = 4; x.setLineDash([18, 12]); x.strokeRect(26, 26, W - 52, H - 52); x.restore(); }
  if (spec.decor === 'scallop') {   // viền vỏ sò: dải giấy 4 cạnh + hàng nửa hình tròn lấn vào trong
    const rr = 16, inset = 22; x.save(); x.fillStyle = L.full ? '#FFFFFF' : t.paper;
    x.fillRect(0, 0, W, inset); x.fillRect(0, H - inset, W, inset); x.fillRect(0, 0, inset, H); x.fillRect(W - inset, 0, inset, H);
    x.beginPath();
    for (let xx = inset + rr; xx <= W - inset; xx += rr * 2) { x.moveTo(xx + rr, inset); x.arc(xx, inset, rr, 0, 7); x.moveTo(xx + rr, H - inset); x.arc(xx, H - inset, rr, 0, 7); }
    for (let yy = inset + rr; yy <= H - inset; yy += rr * 2) { x.moveTo(inset + rr, yy); x.arc(inset, yy, rr, 0, 7); x.moveTo(W - inset + rr, yy); x.arc(W - inset, yy, rr, 0, 7); }
    x.fill(); x.restore(); }
  if (spec.decor === 'corners') { const s = 46, c = L.full ? 'rgba(255,255,255,.92)' : t.accent; [[70, H - 70], [W - 70, H - 70], [70, R_TOP + 40], [W - 70, R_TOP + 40]].forEach(([cx, cy], i) => motif(x, spec.motif, cx, cy, s, c, (i - 1.5) * .3)); }
  if (spec.decor === 'bow') { const p = L.photos[0]; motif(x, 'bow', p.x + p.w / 2, p.y + 6, 64, L.full ? '#FFFFFF' : t.ink); }
  if (spec.decor === 'smock' || spec.decor === 'ricrac') { const y0 = Math.min(T0.y - 26, H - 40); smockBand(x, 60, y0, W - 120, spec.decor === 'smock' ? [t.accent, t.ink] : [t.accent], spec.decor === 'smock'); }
  // 4) chữ
  drawText(g, x, spec, T0, onPhoto, patterned, F, r);
  g.head = !!L.head;
}
// màu hex + độ trong
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
// dải smock: đường zigzag nhiều màu + chấm (hoạ tiết đặc trưng của hàng smock)
function smockBand(x, a, y, w, colors, dots) {
  const step = 26, amp = 9;
  colors.forEach((c, k) => { x.save(); x.strokeStyle = c; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath();
    for (let i = 0, xx = a; xx <= a + w; i++, xx += step) x.lineTo(xx, y + k * 14 + (i % 2 ? amp : -amp)); x.stroke(); x.restore(); });
  if (dots) { x.save(); x.fillStyle = colors[colors.length - 1]; for (let xx = a + step; xx < a + w; xx += step * 2) { x.beginPath(); x.arc(xx, y + 7, 4, 0, 7); x.fill(); } x.restore(); }
}
function drawText(g, x, spec, R, onPhoto, patterned, F, r) {
  if (!g.showText) return;
  if (R.h < 90) R = { ...R, y: R.y + R.h - 90, h: 90 };   // vùng chữ tối thiểu
  const t = g.t, W = g.W, st = spec.tstyle || 'stack', cx = R.x + R.w / 2, light = '#FFFFFF';
  const boxCol = onPhoto ? 'rgba(255,255,255,.88)' : patterned ? hexA(t.paper, .93) : null;
  const inkOn = onPhoto && !boxCol ? light : t.ink, accOn = onPhoto && !boxCol ? light : t.accent;
  const H3 = (top, head, sub, y0, h, o = {}) => {   // ba dòng: nhỏ nghiêng / IN HOA / nghiêng
    const lines = [top && ['sub', top, .22], ['head', head, .45], sub && ['sub', sub, .3]].filter(Boolean), tot = lines.reduce((n, l) => n + l[2], 0);
    let yy = y0; lines.forEach(([kind, s, k]) => { const hh = h * k / tot; g.text(s, o.align === 'left' ? R.x + 30 : cx, yy + hh / 2, { kind, size: kind === 'head' ? Math.min(86, hh * .62) : Math.min(54, hh * .5), maxW: R.w - 60, lines: kind === 'head' ? 2 : 1, color: kind === 'head' ? (o.ink || t.ink) : (o.acc || t.accent), align: o.align }); yy += hh; });
  };
  const top = r() < .5 ? spec.top : '', head = spec.a, sub = spec.b2;
  if (st === 'box' || ((st === 'stack' || st === 'underline' || st === 'script') && boxCol)) {
    const pad = 20; g.round(boxCol || hexA(t.paper, .92), R.x, R.y, R.w, R.h, st === 'box' ? 0 : 18);
    if (st === 'script') { g.text(sub, cx, R.y + R.h * .38, { kind: 'sub', size: Math.min(76, R.h * .32), maxW: R.w - 60, lines: 2 }); g.text(head, cx, R.y + R.h * .78, { size: Math.min(40, R.h * .16), maxW: R.w - 60, lines: 1 }); return; }
    H3(top, head, sub, R.y + pad, R.h - pad * 2); if (st === 'underline') smockBand(x, cx - R.w * .25, R.y + R.h - 26, R.w * .5, [t.accent], false); return;
  }
  if (st === 'stack') { H3(top, head, sub, R.y, R.h, { ink: inkOn, acc: accOn, align: R.align }); return; }
  if (st === 'script') { g.text(sub, cx, R.y + R.h * .4, { kind: 'sub', size: Math.min(80, R.h * .34), maxW: R.w - 40, lines: 2, color: accOn }); g.text(head, cx, R.y + R.h * .8, { size: Math.min(40, R.h * .16), maxW: R.w - 40, lines: 1, color: inkOn }); return; }
  if (st === 'underline') { H3('', head, sub, R.y, R.h - 30, { ink: inkOn, acc: accOn }); smockBand(x, cx - R.w * .25, R.y + R.h - 18, R.w * .5, [accOn], false); return; }
  if (st === 'ribbon') {
    const h = Math.min(110, R.h * .5), w = Math.min(R.w, g.width(head, h * .45) + 160), y = R.y + (sub ? R.h * .38 : R.h / 2) - h / 2, a = cx - w / 2, notch = h * .35;
    g.poly(dark2(t), [[a - 30, y + 14], [a + 10, y + 14], [a + 10, y + h + 14], [a - 30, y + h + 14], [a - 30 + notch, y + h / 2 + 14]]); g.poly(dark2(t), [[a + w + 30, y + 14], [a + w - 10, y + 14], [a + w - 10, y + h + 14], [a + w + 30, y + h + 14], [a + w + 30 - notch, y + h / 2 + 14]]);
    g.fill(t.dark ? '#FFFFFF' : t.ink, a, y, w, h); g.text(head, cx, y + h / 2, { size: h * .45, maxW: w - 60, lines: 1, color: t.dark ? t.paper : '#FFFFFF' });
    if (sub) { if (boxCol) g.round(boxCol, cx - R.w * .4, y + h + 26, R.w * .8, R.h * .3, 14); g.text(sub, cx, y + h + 26 + R.h * .15, { kind: 'sub', size: Math.min(44, R.h * .18), maxW: R.w * .75, lines: 1, color: boxCol ? t.accent : accOn }); } return;
  }
  if (st === 'pill') { const h = Math.min(R.h * .7, 170), w = Math.min(R.w, Math.max(g.width(head, h * .3) + 140, R.w * .6)); g.pill(t.dark ? '#FFFFFF' : t.paper, cx - w / 2, R.y + (R.h - h) / 2, w, h);
    g.text(head, cx, R.y + R.h / 2 - h * .14, { size: h * .3, maxW: w - 90, lines: 1, color: t.dark ? t.paper : t.ink }); g.text(sub, cx, R.y + R.h / 2 + h * .22, { kind: 'sub', size: h * .19, maxW: w - 110, lines: 1, color: t.dark ? '#438D41' : t.accent }); return; }
  if (st === 'label') { g.round(onPhoto || patterned ? '#FFFFFF' : hexA(t.dark ? '#FFFFFF' : t.ink, .06), R.x, R.y, R.w, R.h, 12); x.save(); x.strokeStyle = t.accent === '#FBF8F3' ? '#438D41' : t.accent; x.lineWidth = 3; x.setLineDash([14, 9]); x.beginPath(); x.roundRect(R.x + 12, R.y + 12, R.w - 24, R.h - 24, 8); x.stroke(); x.restore();
    const o = onPhoto || patterned ? { ink: t.dark ? '#1B2A4A' : t.ink, acc: t.dark ? '#438D41' : t.accent } : {}; H3(top, head, sub, R.y + 24, R.h - 48, o); return; }
  if (st === 'badge') { const d = Math.max(120, Math.min(R.h * 1.05, R.w * .5, 340)), bx = R.align === 'left' ? R.x + d / 2 + 10 : cx, by = R.y + R.h / 2; x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 18; x.fillStyle = t.dark ? '#FFFFFF' : t.ink; x.beginPath(); x.arc(bx, by, d / 2, 0, 7); x.fill(); x.restore();
    x.save(); x.strokeStyle = t.dark ? t.paper : '#FFFFFF'; x.lineWidth = 3; x.setLineDash([10, 8]); x.beginPath(); x.arc(bx, by, d / 2 - 14, 0, 7); x.stroke(); x.restore();
    g.text(head, bx, by - d * .04, { size: d * .13, maxW: d * .7, lines: 3, color: t.dark ? t.paper : '#FFFFFF' }); g.text(top || 'K-Embroidery', bx, by + d * .3, { kind: 'sub', size: d * .075, maxW: d * .55, lines: 1, color: t.dark ? t.paper : '#FFFFFF' }); return; }
  if (st === 'rule') { if (boxCol) g.round(boxCol, R.x, R.y, R.w, R.h, 10); g.fill(t.accent === '#FBF8F3' ? '#438D41' : t.accent, R.x + 24, R.y + R.h * .18, 10, R.h * .64);
    g.text(head, R.x + 58, R.y + R.h * .42, { size: Math.min(70, R.h * .26), maxW: R.w - 90, lines: 2, align: 'left', color: boxCol ? t.ink : inkOn }); g.text(sub, R.x + 58, R.y + R.h * .78, { kind: 'sub', size: Math.min(40, R.h * .15), maxW: R.w - 90, lines: 1, align: 'left', color: boxCol ? t.accent : accOn }); return; }
  if (st === 'tag') { const h = Math.min(R.h * .8, 200), w = Math.min(R.w * .9, Math.max(g.width(head, h * .26) + 170, R.w * .55)), a = cx - w / 2 + 30, y = R.y + (R.h - h) / 2;
    x.save(); x.shadowColor = 'rgba(0,0,0,.15)'; x.shadowBlur = 14; g.poly(t.dark ? '#FFFFFF' : '#FFFFFF', [[a, y], [a + w - 40, y], [a + w - 40, y + h], [a, y + h], [a - 60, y + h / 2]]); x.restore();
    x.save(); x.fillStyle = t.paper; x.beginPath(); x.arc(a - 22, y + h / 2, 10, 0, 7); x.fill(); x.strokeStyle = t.accent === '#FBF8F3' ? '#438D41' : t.accent; x.lineWidth = 3; x.beginPath(); x.moveTo(a - 22, y + h / 2); x.quadraticCurveTo(a - 90, y - 20, a - 140, y - 30); x.stroke(); x.restore();
    g.text(head, a + (w - 40) / 2, y + h * .4, { size: h * .24, maxW: w - 90, lines: 2, color: t.dark ? t.paper : t.ink }); g.text(sub, a + (w - 40) / 2, y + h * .78, { kind: 'sub', size: h * .14, maxW: w - 90, lines: 1, color: t.dark ? '#438D41' : t.accent }); return; }
  if (st === 'arc') { if (boxCol) g.round(boxCol, R.x, R.y, R.w, R.h, 18); const size = Math.min(64, R.h * .26), rad = Math.max(R.w * .55, 420), cy = R.y + R.h * .5 + rad - 10;
    arcText(x, g, (F.upper ? head.toUpperCase() : head), cx, cy, rad, size, boxCol ? t.ink : inkOn); g.text(sub, cx, R.y + R.h * .78, { kind: 'sub', size: Math.min(42, R.h * .16), maxW: R.w - 80, lines: 1, color: boxCol ? t.accent : accOn }); return; }
  if (st === 'bands') { const h1 = R.h * .52, h2 = R.h * .34; g.fill(t.dark ? '#FFFFFF' : t.ink, R.x, R.y, R.w, h1); g.fill(t.accent === '#FBF8F3' ? '#438D41' : t.accent, R.x, R.y + h1, R.w, h2);
    g.text(head, cx, R.y + h1 / 2, { size: Math.min(70, h1 * .44), maxW: R.w - 60, lines: 1, color: t.dark ? t.paper : '#FFFFFF' }); g.text(sub, cx, R.y + h1 + h2 / 2, { kind: 'sub', size: Math.min(40, h2 * .46), maxW: R.w - 60, lines: 1, color: '#FFFFFF' }); return; }
}
const dark2 = t => t.dark ? '#D9D9D9' : hexA(t.ink, .75);
// chữ uốn theo vòng cung (đỉnh cung ở giữa vùng chữ)
function arcText(x, g, text, cx, cy, rad, size, color) {
  let s = size; x.font = g.font('head', s); let w = x.measureText(text).width;
  while (w > rad * 1.7 && s > 18) { s -= 2; x.font = g.font('head', s); w = x.measureText(text).width; }
  let ang = -Math.PI / 2 - w / rad / 2; x.save(); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const ch of text) { const cw = x.measureText(ch).width; ang += cw / rad / 2; x.save(); x.translate(cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)); x.rotate(ang + Math.PI / 2); x.fillText(ch, 0, 0); x.restore(); ang += cw / rad / 2; }
  x.restore();
}
// đếm tổ hợp (để hiện cho người dùng)
const GEN_COUNT = SK_IDS.length * SHAPES_BOX.length * TEXT_STYLES.length * DECORS.length * THEMES.length * FONT_IDS.length;
