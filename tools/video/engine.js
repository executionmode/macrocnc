
const W = 1080, H = 1920, c = document.getElementById('c'), g = c.getContext('2d');
const F = 'Inter, system-ui, sans-serif', M = '"DejaVu Sans Mono", monospace';
const C = { bg: '#03070f', blue: '#2f86ff', cyan: '#66b8ff', txt: '#eaf1fb', mut: '#8fa3bd', tool: '#f5a524', ok: '#3ccf8e', err: '#ff6b6b',
  part: '#1b2c45', edge: '#4f74a6', cut: '#5d86bd', card: '#0b1526', line: 'rgba(64,130,255,.35)' };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const fmt = v => (Math.round(v * 1000) / 1000).toFixed(v % 1 === 0 ? 0 : (Math.abs(v * 10 % 1) < 1e-9 ? 1 : 3)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
const f3 = v => (v >= 0 ? ' ' : '') + v.toFixed(3);

/* ---------- desenho básico ---------- */
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function text(s, x, y, size, color, o) {
  o = o || {}; g.font = (o.w || 500) + ' ' + size + 'px ' + (o.mono ? M : F); g.fillStyle = color; g.textAlign = o.a || 'left'; g.textBaseline = o.b || 'alphabetic';
  g.globalAlpha = o.alpha == null ? 1 : o.alpha; g.fillText(s, x, y); g.globalAlpha = 1;
}
function line(x1, y1, x2, y2, color, w, dash) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = color; g.lineWidth = w || 3; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); }
function arrowHead(x1, y1, x2, y2, color, s) { const a = Math.atan2(y2 - y1, x2 - x1); s = s || 18; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - s * Math.cos(a - .45), y2 - s * Math.sin(a - .45)); g.lineTo(x2 - s * Math.cos(a + .45), y2 - s * Math.sin(a + .45)); g.closePath(); g.fillStyle = color; g.fill(); }
function arrow(x1, y1, x2, y2, color, w, dash) { line(x1, y1, x2, y2, color, w, dash); arrowHead(x1, y1, x2, y2, color); }
function dim(x1, y1, x2, y2, label, color, off, size) {
  color = color || C.txt; const both = true;
  line(x1, y1, x2, y2, color, 2.5); arrowHead(x2, y2, x1, y1, color, 14); arrowHead(x1, y1, x2, y2, color, 14);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  text(label, mx + (off ? off[0] : 0), my + (off ? off[1] : -14), size || 34, color, { a: 'center', w: 700 });
}
function chip(x, y, label, value, color, alpha) {
  g.globalAlpha = alpha == null ? 1 : alpha;
  g.font = '700 38px ' + M; const w = g.measureText(label + ' = ' + value).width + 48;
  rr(x - w / 2, y - 36, w, 64, 32); g.fillStyle = 'rgba(10,22,42,.95)'; g.fill(); g.strokeStyle = color || C.cyan; g.lineWidth = 3; g.stroke();
  g.globalAlpha = 1;
  text(label + ' = ', x - w / 2 + 24, y + 9, 38, C.mut, { mono: true, w: 700, alpha: alpha });
  g.font = '700 38px ' + M; const lw = g.measureText(label + ' = ').width;
  text(value, x - w / 2 + 24 + lw, y + 9, 38, color || C.cyan, { mono: true, w: 700, alpha: alpha });
}
function card(x, y, w, h, stroke) { rr(x, y, w, h, 26); g.fillStyle = 'rgba(11,21,38,.92)'; g.fill(); g.strokeStyle = stroke || C.line; g.lineWidth = 2.5; g.stroke(); }

/* ---------- vista de cima ---------- */
const TV = { cx: 540, cy: 600, s: 2.05 };
const tx = x => TV.cx + x * TV.s, ty = y => TV.cy - y * TV.s;
function part(alpha) {
  g.globalAlpha = alpha == null ? 1 : alpha;
  g.fillStyle = C.part; g.fillRect(tx(-107.5), ty(107.5), 215 * TV.s, 215 * TV.s);
  g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(tx(-107.5), ty(107.5), 215 * TV.s, 215 * TV.s);
  g.globalAlpha = 1;
  line(tx(-12), ty(0), tx(12), ty(0), C.mut, 2); line(tx(0), ty(-12), tx(0), ty(12), C.mut, 2);
}
function tool(x, y, a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(tx(x), ty(y), 25 * TV.s, 0, 7); g.fillStyle = 'rgba(245,165,36,.22)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(tx(x), ty(y), 6, 0, 7); g.fillStyle = C.tool; g.fill();
  g.globalAlpha = 1;
}
function swath(x1, x2, y) { // área cortada pela fresa numa linha em X (dentro da peça)
  const a = clamp(Math.min(x1, x2) - 25, -107.5, 107.5), b = clamp(Math.max(x1, x2) + 25, -107.5, 107.5);
  const c1 = clamp(y - 25, -107.5, 107.5), c2 = clamp(y + 25, -107.5, 107.5);
  if (b > a && c2 > c1) { g.fillStyle = C.cut; g.fillRect(tx(a), ty(c2), (b - a) * TV.s, (c2 - c1) * TV.s); }
}
function dro(x, y, X, Y, Z, label) {
  card(x, y, 440, 230, 'rgba(102,184,255,.55)');
  text(label || STR.dro, x + 28, y + 46, 26, C.cyan, { w: 800 });
  [['X', X], ['Y', Y], ['Z', Z]].forEach((r, i) => {
    text(r[0], x + 30, y + 100 + i * 48, 40, C.mut, { mono: true, w: 700 });
    text(f3(r[1]), x + 410, y + 100 + i * 48, 40, C.txt, { mono: true, w: 700, a: 'right' });
  });
}

/* ---------- painel de código ---------- */
function codePanel(lines, hl, y0, nVis, opts) {
  opts = opts || {}; y0 = y0 || 1100; nVis = nVis || 10;
  const lh = 44, x0 = 50, w = 980, h = nVis * lh + 70;
  card(x0, y0, w, h, 'rgba(64,130,255,.4)');
  text(opts.title || STR.codeTitle, x0 + 30, y0 + 44, 26, C.cyan, { w: 800 });
  const hs = hl || [];
  let first = 0;
  if (hs.length) { const mid = (Math.min(...hs) + Math.max(...hs)) / 2; first = Math.round(mid - (nVis - 1) / 2); }
  if (opts.first != null) first = opts.first;
  first = clamp(first, 0, Math.max(0, lines.length - nVis));
  g.save(); rr(x0, y0 + 60, w, h - 66, 20); g.clip();
  for (let i = 0; i < nVis && first + i < lines.length; i++) {
    const k = first + i, yy = y0 + 64 + i * lh, on = hs.indexOf(k) >= 0;
    if (on) { g.fillStyle = 'rgba(47,134,255,.32)'; g.fillRect(x0 + 4, yy, w - 8, lh); g.fillStyle = C.blue; g.fillRect(x0 + 4, yy, 7, lh); }
    text(String(k + 1).padStart(2, ' '), x0 + 26, yy + 31, 24, on ? C.cyan : '#4c5f78', { mono: true });
    text(lines[k], x0 + 80, yy + 31, 31, on ? '#ffffff' : (hs.length ? '#8fa3bd' : '#cfe3ff'), { mono: true, w: on ? 700 : 400 });
  }
  g.restore();
}

/* ---------- legendas ---------- */
function wrap(s, maxW) {
  g.font = '800 66px ' + F; const words = s.split(' '), out = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; });
  if (cur) out.push(cur); return out;
}
function subtitle(s, a) {
  if (!s) return;
  const ls = wrap(s, 980), lh = 82, h = ls.length * lh + 48;
  g.font = '800 66px ' + F; const w = Math.max(...ls.map(l => g.measureText(l).width)) + 64;
  const y = Math.min(1772 - h / 2, 1900 - h);
  g.globalAlpha = a; rr(540 - w / 2, y, w, h, 26); g.fillStyle = 'rgba(0,0,0,.8)'; g.fill(); g.globalAlpha = 1;
  ls.forEach((l, i) => text(l, 540, y + 24 + lh * i + 62, 66, '#ffffff', { a: 'center', w: 800, alpha: a }));
}

/* ---------- cabeçalho ---------- */
function header(sc, idx, total) {
  text('MACRO CNC', 60, 92, 30, C.cyan, { w: 900 });
  text(STR.hdr, 1020, 92, 26, C.mut, { w: 700, a: 'right' });
  for (let i = 0; i < total; i++) { rr(60 + i * (960 / total), 116, 960 / total - 8, 7, 4); g.fillStyle = i <= idx ? C.blue : '#16233a'; g.fill(); }
  text(sc.title, 60, 196, 50, C.txt, { w: 800 });
}
function background() {
  const gr = g.createRadialGradient(540, 0, 50, 540, 300, 1300); gr.addColorStop(0, '#0d2244'); gr.addColorStop(.55, '#050c18'); gr.addColorStop(1, '#03070f');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}


/* ---------- textos por idioma ---------- */
const LANG = window.LANG || 'pt', STR = window.STR || {}, FX = (window.FACTS = window.FACTS || {});
function num(v, d) { // número no formato do idioma (francês: vírgula)
  if (typeof v !== 'number') return String(v);
  let s = (Math.round(v * 1000) / 1000).toString();
  return LANG.indexOf('fr') === 0 ? s.replace('.', ',') : s;
}
function tr(key, vars) { // texto do dicionário com {nome} trocado por valores (números formatados) e {g:nome} sem formatar (código)
  const s = STR[key]; if (s == null) return '[' + key + ']';
  if (Array.isArray(s)) return s.map(x => fill(x, vars));
  return fill(s, vars);
}
function fill(s, vars) {
  return s.replace(/\{(g:)?([\w.]+)\}/g, (m, raw, k) => { const v = (vars && vars[k] !== undefined) ? vars[k] : FX[k]; return v === undefined ? m : (raw ? String(v) : num(v)); });
}
