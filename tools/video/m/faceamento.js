/* Vídeo: macro de faceamento O1611 — cenas. Textos em m/faceamento.<idioma>.js, números em m/facts_faceamento.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args, V = RAW.vars;
const CUTS = RAW.segs.filter(s => s[0] === 'f' && s[2] === s[4] && s[1] !== s[3]);
const Z1 = CUTS[0][6];
const YS = CUTS.filter(s => s[6] === Z1).map(s => s[2]);
const nm = v => num(v);
Object.assign(FX, {
  X: A.X, Y: A.Y, W: A.W, Z: A.Z, K: A.K, T: A.T, Q: A.Q, A: A.A, R: A.R, F: A.F,
  hx: A.X / 2, hy: A.Y / 2, r: V[100], xo: V[101], ylast: V[102], z1: Z1, n: YS.length,
  next: YS[YS.length - 2] + A.Q, safe: A.W + A.R, zEx: A.Z - A.K,
  ylist: YS.slice(0, -1).slice(0, -1).map(nm).join(', ') + ' ' + (STR.and || 'e') + ' ' + nm(YS[YS.length - 2]),
  g65a: RAW.g65.split(' ').slice(0, 7).join(' '), g65b: RAW.g65.split(' ').slice(7).join(' ')
});
const MAC = ['O1611 ;', '#100 = #20 / 2 ;', '#101 = #24 / 2 + #100 + #1 ;', '#102 = #25 / 2 - #100 ;', 'IF [#102 LT 0] THEN #102 = 0 ;',
  'IF [#26 GE #23] THEN #3000 = 101 ;', 'IF [#6 LE 0] THEN #3000 = 102 ;', 'IF [#17 LE 0] THEN #3000 = 103 ;', 'IF [#17 GT #20] THEN #3000 = 104 ;',
  '#104 = #23 ;', 'N10 #103 = #104 - #6 ;', 'IF [#103 LT #26] THEN #103 = #26 ;', '#106 = -#101 ;', '#105 = -#102 ;', 'G0 X#106 Y#105 ;',
  'G0 Z[#104 + #18] ;', 'G1 Z#103 F#9 ;', 'N20 G1 X[-#106] F#9 ;', '#106 = -#106 ;', 'IF [#105 GE #102] GOTO 30 ;', '#105 = #105 + #17 ;',
  'IF [#105 GT #102] THEN #105 = #102 ;', 'G1 Y#105 ;', 'GOTO 20 ;', 'N30 G0 Z[#103 + #18] ;', '#104 = #103 ;', 'IF [#103 GT #26] GOTO 10 ;', 'M99 ;'];
const MAIN = ['%', 'O0001 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T10 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S1200 M3 ;', 'G43 H10 Z120. ;', 'M8 ;',
  FX.g65a, '    ' + FX.g65b + ' ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];
const gc = n => (Math.round(n * 1000) / 1000).toString();   // número em formato de código (sempre ponto)
const HX = FX.hx, XO = FX.xo, YL = FX.ylast, RT = FX.r;

/* trajetória do laço (da simulação) */
const PATH = (() => { const p = []; CUTS.filter(s => s[6] === Z1).forEach((s, i, arr) => { p.push({ k: 'cut', x1: s[1], x2: s[3], y: s[2], n: i + 1 }); if (i < arr.length - 1) p.push({ k: 'y', x: s[3], y1: s[2], y2: arr[i + 1][2], n: i + 1 }); }); return p; })();
const PLEN = PATH.map(s => s.k === 'cut' ? Math.abs(s.x2 - s.x1) : Math.abs(s.y2 - s.y1) * 2.2 + 40);
const PTOT = PLEN.reduce((a, b) => a + b, 0);
function walk(p) { let acc = 0, pos = { x: PATH[0].x1, y: PATH[0].y }, seg = PATH[0];
  for (let i = 0; i < PATH.length; i++) { const s = PATH[i], L = PLEN[i], f = clamp((p - acc) / L, 0, 1);
    if (s.k === 'cut') { const xx = lerp(s.x1, s.x2, f); if (f > 0) { swath(s.x1, xx, s.y); pos = { x: xx, y: s.y }; seg = s; } }
    else if (f > 0) { pos = { x: s.x, y: lerp(s.y1, s.y2, f) }; seg = s; }
    acc += L; }
  return { pos, seg }; }
function partBox() { g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(tx(-HX), ty(FX.hy), A.X * TV.s, A.Y * TV.s); }

let this_hl = [14];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

sc('c1', { draw(t, T) {
  const a = ease(t / 1.2);
  part(.9);
  const w = walk((t / T) * PTOT * .9); tool(w.pos.x, w.pos.y);
  g.globalAlpha = a; card(90, 1010, 900, 380, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 1110, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1210, tr('c1.k2').length > 11 ? 88 : 104, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1611', 540, 1310, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });
sc('c2', { code: () => ({ lines: MAIN, hl: [10, 11], title: tr('mainTitle'), n: 9 }),
  draw(t, T, at) {
    card(70, 270, 390, 300, 'rgba(102,184,255,.6)'); text(tr('c2.main'), 265, 340, 40, C.txt, { a: 'center', w: 800 }); text('O0001', 265, 400, 46, C.cyan, { a: 'center', w: 700, mono: true });
    text(tr('c2.m1'), 265, 470, 30, C.mut, { a: 'center' }); text(tr('c2.m2'), 265, 510, 30, C.mut, { a: 'center' });
    card(620, 270, 390, 300, 'rgba(245,165,36,.6)'); text('MACRO', 815, 340, 40, C.txt, { a: 'center', w: 800 }); text('O1611', 815, 400, 46, C.tool, { a: 'center', w: 700, mono: true });
    text(tr('c2.s1'), 815, 470, 30, C.mut, { a: 'center' }); text(tr('c2.s2'), 815, 510, 30, C.mut, { a: 'center' });
    const a1 = ease((t - at(0) - .3) / .8), a2 = ease((t - at(1) - .3) / .8);
    if (a1 > 0) { arrow(462, 360, lerp(462, 614, a1), 360, C.tool, 6); text('G65 P1611', 540, 335, 25, C.tool, { a: 'center', w: 800, mono: true, alpha: a1 }); }
    if (a2 > 0) { arrow(618, 490, lerp(618, 466, a2), 490, C.ok, 6, [14, 10]); text('M99', 540, 470, 32, C.ok, { a: 'center', w: 800, mono: true, alpha: a2 }); }
    const a3 = ease((t - at(2)) / .8);
    if (a3 > 0) { card(110, 650, 860, 360, 'rgba(60,207,142,.55)');
      text(tr('c2.you'), 160, 730, 38, C.ok, { w: 800, alpha: a3 });
      text('X Y W Z K T Q A R F', 160, 800, 50, C.txt, { w: 700, mono: true, alpha: a3 });
      text(tr('c2.not'), 160, 890, 38, C.err, { w: 800, alpha: a3 });
      text(tr('c2.code'), 160, 955, 44, C.txt, { w: 600, alpha: a3 }); }
  } });
const LETV = [['X', '#24', 'X'], ['Y', '#25', 'Y'], ['W', '#23', 'W'], ['Z', '#26', 'Z'], ['K', '#6', 'K'], ['T', '#20', 'T'], ['Q', '#17', 'Q'], ['A', '#1', 'A'], ['R', '#18', 'R'], ['F', '#9', 'F']];
sc('c3', { draw(t, T, at) {
  text(FX.g65a, 540, 300, 40, C.tool, { a: 'center', w: 700, mono: true });
  text(FX.g65b, 540, 356, 40, C.tool, { a: 'center', w: 700, mono: true });
  const names = tr('c3.names');
  LETV.forEach((l, i) => {
    const grp = 1 + Math.floor(i / 2), a = ease((t - at(grp)) / .6); if (a <= 0) return;
    const col = i % 2, row = Math.floor(i / 2), x = 70 + col * 480, y = 420 + row * 220 + (1 - a) * 30;
    g.globalAlpha = a; card(x, y, 460, 196, 'rgba(102,184,255,.45)'); g.globalAlpha = 1;
    text(l[0], x + 34, y + 104, 96, C.tool, { w: 900, mono: true, alpha: a });
    text('→ ' + l[1], x + 130, y + 76, 44, C.cyan, { w: 700, mono: true, alpha: a });
    text(names[i], x + 132, y + 124, names[i].length > 17 ? 26 : 30, C.txt, { alpha: a });
    text('= ' + gc(A[l[2]]), x + 132, y + 168, 34, C.ok, { w: 700, mono: true, alpha: a });
  });
} });
sc('c4', { code: () => ({ lines: MAC, hl: [1] }),
  draw(t, T, at) {
    const R = 230, cx = 540, cy = 640;
    g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = 'rgba(245,165,36,.16)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 6; g.stroke();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + t * .8; g.beginPath(); g.arc(cx + (R - 30) * Math.cos(a), cy + (R - 30) * Math.sin(a), 14, 0, 7); g.fillStyle = '#d9a441'; g.fill(); }
    dim(cx - R, cy + R + 60, cx + R, cy + R + 60, 'T = Ø' + gc(A.T), C.txt, [0, 52], 40);
    line(cx - R, cy + R + 20, cx - R, cy + R + 80, C.mut, 2); line(cx + R, cy + R + 20, cx + R, cy + R + 80, C.mut, 2);
    const a = ease((t - at(1)) / .8);
    if (a > 0) { line(cx, cy, cx + R * a, cy, C.ok, 6); g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fillStyle = C.ok; g.fill(); text(nm(RT), cx + R / 2, cy - 22, 46, C.ok, { a: 'center', w: 800, alpha: a }); chip(540, 380, '#100', gc(RT), C.ok, a); }
  } });
sc('c5', { code: () => ({ lines: MAC, hl: [2] }),
  draw(t, T, at) {
    part();
    const a1 = ease((t - at(1)) / .7), a2 = ease((t - at(1) - 1.2) / .7), a3 = ease((t - at(1) - 2.4) / .7), a4 = ease((t - at(2)) / .7);
    const yd = ty(0);
    if (a1 > 0) dim(tx(0), yd, tx(-HX * a1), yd, nm(HX), C.txt, [0, -16], 34);
    if (a2 > 0) dim(tx(-HX), yd + 80, tx(-HX - RT * a2), yd + 80, nm(RT), C.tool, [0, -14], 30);
    if (a3 > 0) dim(tx(-HX - RT), yd + 150, tx(-HX - RT - A.A * a3), yd + 150, nm(A.A), C.ok, [-2, -14], 30);
    tool(-XO, 0, ease((t - at(1) - 1.2) / .7));
    if (a4 > 0) { line(tx(-XO), ty(-120), tx(-XO), ty(125), C.cyan, 3, [10, 8]); chip(540, 930, '#101', gc(XO), C.cyan, a4);
      text('X-' + gc(XO), tx(-XO), ty(130), 30, C.cyan, { a: 'center', w: 800, mono: true, alpha: a4 }); }
  } });
sc('c6', { code: () => ({ lines: MAC, hl: [3, 4] }),
  draw(t, T, at) {
    part();
    const a1 = ease((t - at(0) - .3) / .8), a2 = ease((t - at(1)) / .8);
    tool(0, YL, a1);
    if (a1 > 0) dim(tx(60), ty(0), tx(60), ty(YL * a1), nm(YL), C.cyan, [60, 10], 34);
    if (a2 > 0) { dim(tx(-60), ty(YL), tx(-60), ty(FX.hy), nm(RT), C.tool, [-44, 12], 30); line(tx(-130), ty(FX.hy), tx(130), ty(FX.hy), C.ok, 4); chip(540, 930, '#102', gc(YL), C.cyan, a2); }
  } });
const ALC = [['IF [#26 GE #23]', '101'], ['IF [#6 LE 0]', '102'], ['IF [#17 LE 0]', '103'], ['IF [#17 GT #20]', '104']];
sc('c7', { code: () => ({ lines: MAC, hl: [5, 6, 7, 8] }),
  draw(t, T, at) {
    const q = tr('c7.q');
    ALC.forEach((r, i) => {
      const a = ease((t - at(1) - i * .7) / .5); if (a <= 0) return;
      const y = 270 + i * 165;
      g.globalAlpha = a; card(70, y, 940, 145, 'rgba(255,107,107,.45)'); g.globalAlpha = 1;
      text(q[i], 110, y + 60, 40, C.txt, { w: 700, alpha: a }); text(r[0], 110, y + 112, 32, C.mut, { mono: true, alpha: a });
      rr(800, y + 30, 180, 86, 20); g.fillStyle = 'rgba(255,107,107,' + (.2 * a) + ')'; g.fill();
      text(r[1], 890, y + 90, 50, C.err, { a: 'center', w: 900, mono: true, alpha: a });
    });
    const a5 = ease((t - at(2)) / .6);
    if (a5 > 0) text(tr('c7.ok'), 540, 1000, 46, C.ok, { a: 'center', w: 800, alpha: a5 });
  } });
/* vista lateral (camadas) */
const SV = { x0: 250, x1: 900, top: 560, zs: 60 };
const sz = z => SV.top - z * SV.zs;
function sidePart(cut1, cut2) {
  g.fillStyle = C.part; g.fillRect(SV.x0, sz(0), SV.x1 - SV.x0, 480); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(SV.x0, sz(0), SV.x1 - SV.x0, 480);
  if (cut1 > 0) { g.fillStyle = '#03070f'; g.fillRect(SV.x0 - 2, sz(0) - 2, (SV.x1 - SV.x0 + 4) * cut1, A.K * SV.zs + 2); }
  if (cut2 > 0) { g.fillStyle = '#03070f'; g.fillRect(SV.x0 - 2, sz(-A.K) - 2, (SV.x1 - SV.x0 + 4) * cut2, A.K * SV.zs + 2); }
}
function sideTool(x, z) { const w = A.T * 2.6; g.fillStyle = 'rgba(245,165,36,.85)'; g.fillRect(x - w / 2, sz(z) - 160, w, 160); g.fillStyle = '#7d8ea8'; g.fillRect(x - 30, sz(z) - 300, 60, 140); }
sc('c8', { code: () => ({ lines: MAC, hl: [9, 10, 11] }),
  draw(t, T, at) {
    sidePart(0, 0);
    text(tr('side'), 540, 300, 30, C.mut, { a: 'center' });
    line(SV.x0 - 30, sz(0), SV.x1 + 40, sz(0), C.cyan, 3); text('W' + gc(A.W), SV.x0 - 40, sz(0) + 12, 34, C.cyan, { a: 'right', w: 800, mono: true });
    const a1 = ease((t - at(1)) / .9);
    if (a1 > 0) { line(SV.x0 - 30, sz(Z1), SV.x1 + 40, sz(Z1), C.tool, 4, [16, 10]); text('Z' + gc(Z1), SV.x0 - 40, sz(Z1) + 12, 34, C.tool, { a: 'right', w: 800, mono: true, alpha: a1 });
      arrow(SV.x1 - 40, sz(0), SV.x1 - 40, sz(Z1 * a1), C.tool, 5); text('K' + gc(A.K), SV.x1 - 60, sz(Z1 / 2) + 12, 34, C.tool, { a: 'right', w: 800, mono: true, alpha: a1 }); }
    const a2 = ease((t - at(2)) / .8);
    if (a2 > 0) { line(SV.x0 - 30, sz(A.Z) + 10, SV.x1 + 40, sz(A.Z) + 10, C.ok, 3); text(tr('c8.lim'), 540, sz(A.Z) + 90, 34, C.ok, { a: 'center', w: 700, alpha: a2 }); }
    chip(330, 420, '#104', gc(A.W), C.cyan, ease((t - at(0) - .3) / .6));
    chip(750, 420, '#103', gc(Z1), C.tool, a1);
  } });
sc('c9', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [16] : (t > at(1) ? [15] : [12, 13, 14]);
    part();
    const p0 = PATH[0], a = ease((t - at(0) - .4) / 1.6), z1 = ease((t - at(1) - .3) / 1.2), z2 = ease((t - at(2) - .3) / 1.6);
    const x = lerp(0, p0.x1, a), y = lerp(0, p0.y, a), z = z2 > 0 ? lerp(FX.safe, Z1, z2) : lerp(100, FX.safe, z1);
    if (a > 0) line(tx(0), ty(0), tx(x), ty(y), C.err, 3, [12, 10]);
    tool(x, y);
    text(tr('c9.leg'), 540, 300, 28, C.mut, { a: 'center' });
    dro(70, 860, x, y, z);
    card(540, 860, 470, 230, 'rgba(245,165,36,.45)');
    text(z2 > 0 ? 'G1 Z#103' : (z1 > 0 ? 'G0 Z[#104+#18]' : 'G0 X#106 Y#105'), 775, 940, 32, C.tool, { a: 'center', w: 800, mono: true });
    text(z2 > 0 ? tr('c9.feed') : tr('c9.rapid'), 775, 1000, 34, C.txt, { a: 'center' });
    text(z2 > 0 ? 'Z = ' + gc(Z1) : (z1 > 0 ? 'Z = ' + gc(A.W) + ' + ' + gc(A.R) : '#106 = ' + gc(p0.x1)), 775, 1055, 32, C.mut, { a: 'center', mono: true });
  } });
sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 15 }),
  draw(t, T, at) {
    part();
    const w = walk(clamp((t - .4) / (T - 1.4), 0, 1) * PTOT), pos = w.pos, seg = w.seg;
    partBox();
    YS.forEach(y => { const done = pos.y >= y - .01; text(gc(y), tx(-HX) - 120, ty(y) + 10, 26, done ? C.cyan : '#3a4c66', { mono: true, w: 700 }); });
    tool(pos.x, pos.y);
    this_hl = seg.k === 'cut' ? [17] : [20, 21, 22];
    dro(70, 860, pos.x, pos.y, Z1);
    card(540, 860, 470, 230, 'rgba(102,184,255,.45)');
    text(tr('c10.line', { a: seg.n, b: YS.length }), 775, 925, 40, C.txt, { a: 'center', w: 800 });
    text('#105 = ' + gc(seg.k === 'cut' ? seg.y : pos.y >= seg.y2 - .01 ? seg.y2 : seg.y1), 775, 990, 34, C.cyan, { a: 'center', w: 700, mono: true });
    text('#106 = ' + gc(seg.k === 'cut' ? seg.x1 : seg.x), 775, 1050, 34, C.tool, { a: 'center', w: 700, mono: true });
  } });
sc('c11', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    const c2 = ease((t - at(2) - .3) / 2.4);
    sidePart(1, c2);
    text(tr('side'), 540, 300, 30, C.mut, { a: 'center' });
    line(SV.x0 - 30, sz(0), SV.x0, sz(0), C.cyan, 3); text('W' + gc(A.W), SV.x0 - 40, sz(0) + 12, 34, C.cyan, { a: 'right', w: 800, mono: true });
    text('Z' + gc(Z1), SV.x0 - 40, sz(Z1) + 12, 34, C.tool, { a: 'right', w: 800, mono: true });
    if (t > at(2)) text('Z' + gc(FX.zEx), SV.x0 - 40, sz(FX.zEx) + 12, 34, C.ok, { a: 'right', w: 800, mono: true, alpha: ease((t - at(2)) / .6) });
    const up = ease((t - at(0) - .3) / 1.2);
    let zt = c2 > 0 ? FX.zEx : lerp(Z1, 0.8, up), xt = c2 > 0 ? lerp(SV.x0 - 70, SV.x1 + 40, c2) : SV.x1 + 40;
    if (t > at(3)) zt = lerp(FX.zEx, 0.8, ease((t - at(3)) / 1));
    sideTool(xt, zt);
    if (t > at(2)) chip(540, 380, tr('layer'), c2 >= 1 ? tr('of', { a: 2, b: 2 }) : '2', C.ok, ease((t - at(2)) / .6));
    else chip(540, 380, tr('layer'), tr('of', { a: 1, b: 1 }), C.tool, 1);
    this_hl = t > at(3) ? [27] : (t > at(1) ? [25, 26] : [24]);
  } });
sc('c12', { draw(t, T, at) {
  tr('c12.res').forEach((r, i) => { const a = ease((t - .3 - i * .45) / .4); if (a <= 0) return;
    const y = 270 + i * 112; g.globalAlpha = a; card(70, y, 940, 96, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text('✓', 120, y + 64, 46, C.ok, { w: 900, alpha: a }); text(r, 190, y + 63, 40, C.txt, { w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 960, 940, 230, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c12.first'), 110, 1030, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1611 ... W50. Z49. ...', 110, 1095, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c12.air'), 110, 1155, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1230, 940, 200, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c12.sim'), 540, 1310, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c12.path'), 540, 1380, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
