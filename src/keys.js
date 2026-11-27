/* ---------- Phím tắt kiểu Office: hoàn tác, làm lại, cắt, chép, dán, lưu ----------
   Đang gõ trong ô chữ thì Ctrl+Z/Y/X/C/V/A là của ô chữ (trình duyệt tự lo). */
const HIST = { past: [], future: [], last: null, timer: 0, lock: false };
const snap = () => ({ spec: PS.spec ? JSON.stringify(PS.spec) : null, photos: [...PS.photos] });
const sameSnap = (a, b) => a.spec === b.spec && a.photos.length === b.photos.length && a.photos.every((p, i) => p === b.photos[i]);
function histCommit() {
  clearTimeout(HIST.timer); if (HIST.lock) return;
  const s = snap(); if (!HIST.last) { HIST.last = s; return; }
  if (sameSnap(s, HIST.last)) return;
  HIST.past.push(HIST.last); if (HIST.past.length > 100) HIST.past.shift(); HIST.future = []; HIST.last = s;
}
const histSoon = () => { if (HIST.lock) return; clearTimeout(HIST.timer); HIST.timer = setTimeout(histCommit, 350); };
function histGo(back) {
  histCommit();
  const from = back ? HIST.past : HIST.future, to = back ? HIST.future : HIST.past;
  if (!from.length) { toast(back ? 'Không còn gì để hoàn tác' : 'Không còn gì để làm lại'); return; }
  to.push(HIST.last); const s = from.pop(); HIST.last = s; HIST.lock = true;
  PS.spec = s.spec ? JSON.parse(s.spec) : null; PS.photos = [...s.photos];
  photos().finally(() => setTimeout(() => { HIST.lock = false; }, 400));
  toast(back ? '↶ Đã hoàn tác' : '↷ Đã làm lại');
}

let toastTimer;
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = el('div', { id: 'toast', role: 'status' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1600);
}

const inEditor = () => !!(PS.spec && view.querySelector('.previewBox'));
const finalCanvas = () => { const s = PS.spec; return renderSpec(s, PS.photos, PS.assets, EXPORT_W / FORMATS[s.format][0], true); };
const toBlob = (c, type = 'image/png', q) => new Promise(ok => c.toBlob(ok, type, q));
async function copyImage(canvas, msg) {
  if (!navigator.clipboard || !window.ClipboardItem) { toast('Trình duyệt này không cho chép ảnh. Dùng Ctrl+S để tải.'); return false; }
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob(canvas) })]); toast(msg); return true; }
  catch (e) { toast('Không chép được ảnh: ' + e.message); return false; }
}
async function saveNow() {
  if (!inEditor()) { toast('Mở một mẫu rồi mới lưu được ảnh'); return; }
  toast('Đang tạo ảnh...');
  const s = PS.spec, c = finalCanvas(), blob = await toBlob(c, 'image/jpeg', .93); c.width = c.height = 0;
  const src = PS.photos[s.main].name, a = el('a', { href: URL.createObjectURL(blob), download: `KE_${src.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_')}_${s.layout}_${s.theme}.jpg` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('💾 Đã tải ảnh (' + EXPORT_W + ' px)');
}
async function cutPhoto() {
  if (!PS.photos.length) return;
  const i = PS.spec ? PS.spec.main : PS.photos.length - 1, p = PS.photos[i];
  await copyImage(p.hi, '');
  histCommit(); PS.photos.splice(i, 1);
  if (PS.spec) { if (!PS.photos.length) PS.spec = null; else { PS.spec.main = Math.min(i, PS.photos.length - 1); PS.spec.covers = []; } }
  await photos(); histCommit(); toast(`✂ Đã cắt ảnh ${i + 1} (Ctrl+V để dán lại, Ctrl+Z để hoàn tác)`);
}
async function pasteFiles(files) {
  const imgs = files.filter(f => f.type.startsWith('image/') || isHeic(f)); if (!imgs.length) return false;
  if (PS.photos.length + imgs.length > 12) { toast('Tối đa 12 ảnh mỗi lần'); return true; }
  try { for (const f of imgs) PS.photos.push(new Photo(f.name && f.name !== 'image.png' ? f.name : 'anh-dan-' + (PS.photos.length + 1) + '.png', await readPhoto(f))); }
  catch (e) { toast(e.message); return true; }
  await photos(); toast(`📋 Đã dán ${imgs.length} ảnh`); return true;
}
function nudge(dx, dy, dz) {
  const s = PS.spec, t = s.trans[s.main];
  if (dz) t.zoom = clamp(t.zoom + dz, 1, 3); else { t.px = clamp(t.px + dx, -1, 1); t.py = clamp(t.py + dy, -1, 1); }
  photos();
}

const KEY_HELP = [
  ['Ctrl + Z', 'Hoàn tác'], ['Ctrl + Y  /  Ctrl + Shift + Z', 'Làm lại'],
  ['Ctrl + S', 'Tải ảnh đang chỉnh (JPG 1920 px)'], ['Ctrl + C', 'Chép ảnh đang chỉnh để dán vào Zalo, Messenger, Word...'],
  ['Ctrl + X', 'Cắt ảnh gốc đang chọn khỏi danh sách (đã chép sẵn)'], ['Ctrl + V', 'Dán ảnh vừa chép / chụp màn hình vào danh sách'],
  ['Ctrl + O', 'Chọn ảnh từ máy'], ['Delete', 'Bỏ miếng che mặt cuối'], ['Mũi tên', 'Dời ảnh (giữ Shift để dời nhanh)'],
  ['+  /  −', 'Phóng to / thu nhỏ ảnh'], ['R', 'Đổi mẫu ngẫu nhiên 🎲'], ['Esc', 'Đóng hộp thoại / quay lại chọn mẫu'], ['F1 hoặc ?', 'Bảng phím tắt này'],
  ['Trong hộp Thay vải', 'Ctrl+Z / Ctrl+Y: hoàn tác vùng chọn · Ctrl+A: chọn hết · W: đũa thần · B: cọ · Ctrl+V: dán ảnh vải · Ctrl+Enter: áp dụng · Esc: huỷ']];
function showKeys() {
  if (document.getElementById('keyHelp')) return;
  const close = () => dlg.remove();
  const dlg = el('div', { className: 'fxModal', id: 'keyHelp', role: 'dialog', 'aria-label': 'Phím tắt' },
    el('div', { className: 'fxBody', style: 'max-width:560px;display:block' },
      el('h3', { textContent: '⌨ Phím tắt' }),
      el('table', { className: 'keys' }, ...KEY_HELP.map(([k, v]) => el('tr', {}, el('td', {}, el('kbd', { textContent: k })), el('td', { textContent: v })))),
      el('p', { className: 'sub', textContent: 'Trên Mac dùng ⌘ thay cho Ctrl. Đang gõ trong ô chữ thì Ctrl+Z/X/C/V là của ô chữ.' }),
      el('div', { className: 'bar' }, (() => { const b = el('button', { type: 'button', className: 'btn', textContent: 'Đóng' }); b.onclick = close; return b; })())));
  dlg.onclick = e => { if (e.target === dlg) close(); };
  document.body.append(dlg);
}

const typing = () => { const a = document.activeElement; return a && (a.isContentEditable || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && !['button', 'checkbox', 'radio', 'file', 'color'].includes(a.type))); };
const textTyping = () => { const a = document.activeElement; return a && (a.isContentEditable || a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && ['text', 'search', 'tel', 'url', 'email', 'number', ''].includes(a.type))); };

window.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  const help = document.getElementById('keyHelp');
  if (help) { if (k === 'escape') { help.remove(); e.preventDefault(); } return; }
  if (window.FX_KEYS && document.querySelector('.fxModal')) { if (window.FX_KEYS(e, mod, k)) e.preventDefault(); return; }
  if (mod && k === 's') { e.preventDefault(); saveNow(); return; }
  if (mod && k === 'o') { e.preventDefault(); document.getElementById('files')?.click(); return; }
  if (textTyping() && mod && ['z', 'y', 'x', 'c', 'v', 'a'].includes(k)) return;   // để ô chữ tự xử lý
  if (mod && k === 'z') { e.preventDefault(); histGo(!e.shiftKey); return; }
  if (mod && k === 'y') { e.preventDefault(); histGo(false); return; }
  if (mod && k === 'c') { if (getSelection().toString()) return; if (inEditor()) { e.preventDefault(); toast('Đang chép ảnh...'); copyImage(finalCanvas(), '📋 Đã chép ảnh — dán (Ctrl+V) vào Zalo, Messenger, Word...'); } return; }
  if (mod && k === 'x') { if (getSelection().toString()) return; e.preventDefault(); cutPhoto(); return; }
  if (mod || e.altKey || typing()) return;
  if (k === 'f1' || e.key === '?') { e.preventDefault(); showKeys(); return; }
  if (k === 'escape' && PS.spec) { e.preventDefault(); PS.spec = null; photos(); return; }
  if (k === 'r' && PS.photos.length) { e.preventDefault(); randomize(); return; }
  if (!inEditor()) return;
  const st = e.shiftKey ? .1 : .02;
  const map = { arrowleft: [st, 0], arrowright: [-st, 0], arrowup: [0, st], arrowdown: [0, -st] };
  if (map[k]) { e.preventDefault(); nudge(...map[k], 0); return; }
  if (e.key === '+' || e.key === '=') { e.preventDefault(); nudge(0, 0, .1); return; }
  if (e.key === '-' || e.key === '_') { e.preventDefault(); nudge(0, 0, -.1); return; }
  if (k === 'delete' && PS.spec.covers.length) { e.preventDefault(); PS.spec.covers.pop(); photos(); toast('Đã bỏ miếng che cuối'); }
});
// Dán ảnh: lấy từ sự kiện paste (chạy được cả ảnh chụp màn hình, ảnh chép từ web)
window.addEventListener('paste', async e => {
  const files = [...(e.clipboardData?.files || [])];
  if (document.querySelector('.fxModal')) { if (window.FX_PASTE && files.length) { e.preventDefault(); window.FX_PASTE(files[0]); } return; }
  if (textTyping() && !files.length) return;
  if (files.length) { e.preventDefault(); await pasteFiles(files); }
});
