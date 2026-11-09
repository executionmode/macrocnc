/* Vídeo: contorno externo de polígono O1617 — cenas (foco nas contas da macro).
 * Textos em m/poli.<idioma>.js, números em m/facts_poli.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args;
const gc = n => (Math.round(n * 1000) / 1000).toString();
const r3 = v => Math.round(v * 1000) / 1000;
const SIN = d => Math.sin(d * Math.PI / 180), COS = d => Math.cos(d * Math.PI / 180);
const RC = A.D / 2, RT = A.T / 2, ST = 360 / A.B, NRM0 = A.A - ST / 2;
const EX = A.X + RC * COS(A.A) + RT * COS(NRM0), EY = A.Y + RC * SIN(A.A) + RT * SIN(NRM0);
const corner = a => ({ x: A.X + RC * COS(a), y: A.Y + RC * SIN(a) });
const c2 = corner(A.A - ST), P1 = { x: c2.x + RT * COS(NRM0), y: c2.y + RT * SIN(NRM0) }, P2 = { x: c2.x + RT * COS(NRM0 - ST), y: c2.y + RT * SIN(NRM0 - ST) };
// voltas: Z de cada volta (com a volta plana no fim)
const LAPS = (() => { const L = []; let z0 = A.W; while (true) { let z = Math.max(z0 - A.K, A.Z); const d = (z0 - z) / A.B; L.push({ a: z0, b: z, d }); if (d <= 0) break; z0 = z; } return L; })();
// trajetória do centro (segmentos reais da simulação, só os de corte)
const PATH = RAW.segs.filter(s => s[0] === 'f' && s[7] >= 89);
Object.assign(FX, {
  B: A.B, D: A.D, A: A.A, E: A.E, T: A.T, W: A.W, Z: A.Z, K: A.K, R: A.R, F: A.F,
  rc: r3(RC), rt: RT, st: ST, nrm: NRM0, flats: Math.round(A.D * COS(180 / A.B) * 100) / 100, cos30: r3(COS(30)),
  ex: r3(EX), ey: r3(EY), ox: r3(EX + A.E * COS(NRM0)), oy: r3(EY + A.E * SIN(NRM0)),
  c2x: r3(c2.x), c2y: r3(c2.y), p1x: r3(P1.x), p1y: r3(P1.y), p2x: r3(P2.x), p2y: r3(P2.y),
  dz: r3(A.K / A.B), nl: LAPS.length, z2: A.W - A.K, safeEnd: A.Z + A.R,
  ii: r3(-RT * COS(NRM0)), jj: r3(-RT * SIN(NRM0)),
  g65a: RAW.g65.split(' ').slice(0, 8).join(' '), g65b: RAW.g65.split(' ').slice(8).join(' ')
});
const MAC = ['O1617 ;', '#100 = #7 / 2 ;', '#101 = #20 / 2 ;', '#102 = 360 / #2 ;', 'IF [#2 LT 3] THEN #3000 = 161 ;', 'IF [#6 LE 0] THEN #3000 = 162 ;', 'IF [#26 GE #23] THEN #3000 = 163 ;',
  '#110 = #24 + #100 * COS[#1] + #101 * COS[#1 - #102 / 2] ;', '#111 = #25 + #100 * SIN[#1] + #101 * SIN[#1 - #102 / 2] ;',
  'G0 X[#110 + #8 * COS[#1 - #102 / 2]] Y[#111 + #8 * SIN[#1 - #102 / 2]] ;', 'G0 Z[#23 + #18] ;', 'G1 Z#23 F#9 ;', 'G1 X#110 Y#111 F#9 ;', '#104 = #23 ;',
  'N10 #103 = #104 - #6 ;', 'IF [#103 LT #26] THEN #103 = #26 ;', '#106 = [#104 - #103] / #2 ;', '#105 = #104 ;', '#107 = 1 ;', '#108 = #1 ;',
  'N20 #109 = #108 - #102 / 2 ;', '#112 = #108 - #102 ;', '#113 = #24 + #100 * COS[#112] ;', '#114 = #25 + #100 * SIN[#112] ;', '#105 = #105 - #106 ;',
  'G1 X[#113 + #101 * COS[#109]] Y[#114 + #101 * SIN[#109]] Z#105 F#9 ;', 'G2 X[#113 + #101 * COS[#109 - #102]] Y[#114 + #101 * SIN[#109 - #102]] I[-#101 * COS[#109]] J[-#101 * SIN[#109]] ;',
  '#108 = #112 ;', '#107 = #107 + 1 ;', 'IF [#107 LE #2] GOTO 20 ;', '#104 = #103 ;', 'IF [#106 GT 0] GOTO 10 ;', 'G0 Z[#103 + #18] ;', 'M99 ;'];
const MAIN = ['%', 'O0017 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T10 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S1200 M3 ;', 'G43 H10 Z120. ;', 'M8 ;',
  FX.g65a, '    ' + FX.g65b + ' ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];

function formula(t, steps, y0, h) {
  h = h || 230; const vis = steps.filter(s => t >= s[0]); if (!vis.length) return;
  card(50, y0, 980, h, 'rgba(245,165,36,.55)');
  const nl = Math.floor((h - 30) / 62), show = vis.slice(-nl);
  show.forEach((s, i) => {
    const last = i === show.length - 1, a = last ? ease((t - s[0]) / .45) : 1, yy = y0 + 64 + i * 62;
    g.font = '700 46px ' + M; const w = g.measureText(s[1]).width, fs = w > 880 ? Math.floor(46 * 880 / w) : 46;
    text((i || vis.length > show.length ? '→ ' : '') + s[1], 90, yy, fs, last ? (s[2] || '#ffffff') : '#6f84a0', { mono: true, w: 700, alpha: a });
  });
}

/* ---------- vista de cima ---------- */
let PV = { cx: 470, cy: 530, s: 7.2 };
const px = x => PV.cx + x * PV.s, py = y => PV.cy - y * PV.s;
function poly(a, stock) {
  g.globalAlpha = a == null ? 1 : a;
  if (stock) { g.beginPath(); g.arc(px(A.X), py(A.Y), (RC + 4) * PV.s, 0, 7); g.fillStyle = 'rgba(93,134,189,.25)'; g.fill(); }
  g.beginPath(); for (let k = 0; k <= A.B; k++) { const c = corner(A.A + k * ST); k ? g.lineTo(px(c.x), py(c.y)) : g.moveTo(px(c.x), py(c.y)); }
  g.fillStyle = C.part; g.fill(); g.strokeStyle = C.ok; g.lineWidth = 3; g.stroke();
  g.globalAlpha = 1;
  line(px(-3), py(0), px(3), py(0), C.mut, 2); line(px(0), py(-3), px(0), py(3), C.mut, 2);
}
function cornerCircle(a) { g.globalAlpha = a; g.beginPath(); g.arc(px(A.X), py(A.Y), RC * PV.s, 0, 7); g.strokeStyle = C.cyan; g.lineWidth = 2.5; g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
function tool(x, y, a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(px(x), py(y), RT * PV.s, 0, 7); g.fillStyle = 'rgba(245,165,36,.22)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(px(x), py(y), 6, 0, 7); g.fillStyle = C.tool; g.fill(); g.globalAlpha = 1;
}
function dot(x, y, col, r) { g.beginPath(); g.arc(px(x), py(y), r || 8, 0, 7); g.fillStyle = col; g.fill(); }
function pathUpTo(f, col) { // desenha a trajetória do centro até a fração f; devolve a posição
  const n = PATH.length, k = Math.floor(f * n);
  g.beginPath(); for (let i = 0; i < Math.min(k, n); i++) { const s = PATH[i]; if (!i) g.moveTo(px(s[1]), py(s[2])); g.lineTo(px(s[3]), py(s[4])); }
  g.strokeStyle = col || 'rgba(245,165,36,.55)'; g.lineWidth = 3; g.stroke();
  const s = PATH[Math.min(k, n - 1)]; return { x: s[3], y: s[4], z: s[6] };
}

let this_hl = [1];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

/* 1. abertura */
sc('c1', { draw(t, T) {
  poly(1, true); const p = pathUpTo(clamp((t - .3) / (T - .8), 0, 1) * .2); tool(p.x, p.y);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 900, 900, 330, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 985, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1085, 70, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1617', 540, 1175, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

/* 2. letras */
const LETV = [['X', '#24', A.X, 1], ['Y', '#25', A.Y, 1], ['B', '#2', A.B, 1], ['D', '#7', A.D, 1], ['A', '#1', A.A, 2], ['E', '#8', A.E, 2],
  ['T', '#20', A.T, 2], ['W', '#23', A.W, 3], ['Z', '#26', A.Z, 3], ['K', '#6', A.K, 3], ['R', '#18', A.R, 3], ['F', '#9', A.F, 3]];
sc('c2', { code: () => ({ lines: MAIN, hl: [10, 11], title: tr('mainTitle'), n: 9 }),
  draw(t, T, at) {
    const a0 = ease((t - .2) / .6);
    g.globalAlpha = a0; card(50, 250, 980, 150, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(FX.g65a, 540, 315, 38, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    text(FX.g65b, 540, 370, 38, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    const key = t > at(4);
    LETV.forEach((l, i) => {
      const a = ease((t - at(l[3]) - (i % 4) * .2) / .5); if (a <= 0) return;
      const col = i % 3, row = Math.floor(i / 3), x = 50 + col * 332, y = 425 + row * 160;
      const hot = key && ['B', 'D', 'A', 'T', 'K'].indexOf(l[0]) >= 0;
      g.globalAlpha = a; card(x, y, 316, 146, hot ? 'rgba(60,207,142,.9)' : 'rgba(102,184,255,.4)'); g.globalAlpha = 1;
      text(l[0], x + 26, y + 92, 74, C.tool, { w: 900, mono: true, alpha: a });
      text(tr('c2.n' + l[0]), x + 104, y + 52, 25, C.txt, { alpha: a });
      text('= ' + gc(l[2]), x + 104, y + 96, 34, C.ok, { w: 700, mono: true, alpha: a });
      if (key) text('→ ' + l[1], x + 104, y + 132, 28, hot ? C.ok : C.cyan, { w: 800, mono: true, alpha: ease((t - at(4)) / .5) });
    });
  } });

/* 3. as três contas iniciais */
sc('c3', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(3) ? [3] : t > at(2) ? [2] : [1];
    poly(1); cornerCircle(1);
    const a1 = ease((t - at(1)) / .6);
    if (a1 > 0) { const c = corner(A.A); line(px(0), py(0), px(c.x), py(c.y), C.cyan, 5); text('#100 = ' + num(FX.rc), px(c.x / 2), py(0) - 18, 30, C.cyan, { a: 'center', w: 800, alpha: a1 }); }
    if (t > at(2)) { tool(36, -24, .8); text('#101 = ' + num(RT), px(36), py(-24) + RT * PV.s + 36, 30, C.tool, { a: 'center', w: 800 }); }
    if (t > at(3)) { const c1 = corner(A.A), c3 = corner(A.A - ST); g.beginPath(); g.arc(px(0), py(0), 70, 0, ST * Math.PI / 180); g.strokeStyle = C.tool; g.lineWidth = 5; g.stroke();
      line(px(0), py(0), px(c3.x), py(c3.y), C.mut, 2, [8, 6]); text(num(ST) + '°', px(0) + 100, py(0) + 60, 32, C.tool, { w: 800 }); }
    const a4 = ease((t - at(4)) / .6);
    if (a4 > 0) { g.globalAlpha = a4; const f1 = corner(A.A + ST / 2 - 0); dim(px(-FX.flats / 2), py(-RC) - 24, px(FX.flats / 2), py(-RC) - 24, num(FX.flats) + ' ' + tr('c3.flats'), C.ok, [0, 60], 30); g.globalAlpha = 1; }
    formula(t, [[at(1) + .3, '#100 = ' + gc(A.D) + ' / 2 = ' + gc(RC), C.cyan], [at(2) + .3, '#101 = ' + gc(A.T) + ' / 2 = ' + gc(RT), C.tool], [at(3) + .3, '#102 = 360 / ' + gc(A.B) + ' = ' + gc(ST), C.ok],
      [at(4) + .3, gc(A.D) + ' × COS[30] = ' + gc(FX.flats), C.ok]], 860, 230);
  } });

/* 4. conferências */
sc('c4', { code: () => ({ lines: MAC, hl: [4, 5, 6] }),
  draw(t, T, at) {
    const rows = [['B < 3', '161', 'c4.r1'], ['K ≤ 0', '162', 'c4.r2'], ['Z ≥ W', '163', 'c4.r3']];
    rows.forEach((r, i) => { const a = ease((t - at(0) - .4 - i * .5) / .4); if (a <= 0) return; const y = 300 + i * 150;
      g.globalAlpha = a; card(120, y, 840, 120, 'rgba(255,107,107,.5)'); g.globalAlpha = 1;
      text(r[0], 160, y + 56, 40, C.err, { mono: true, w: 800, alpha: a }); text(tr('alarm') + ' ' + r[1], 920, y + 56, 34, C.err, { a: 'right', w: 800, alpha: a });
      text(tr(r[2]), 160, y + 100, 28, C.txt, { alpha: a }); });
    const a2 = ease((t - at(1)) / .6);
    if (a2 > 0) text(tr('c4.ok'), 540, 820, 40, C.ok, { a: 'center', w: 800, alpha: a2 });
  } });

/* 5. a entrada */
sc('c5', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(3) ? [9, 10, 11, 12] : [7, 8];
    poly(1, true);
    const c1 = corner(A.A), cB = corner(A.A - ST), a1 = ease((t - at(1)) / .6);
    line(px(c1.x), py(c1.y), px(cB.x), py(cB.y), C.ok, 7); text(tr('c5.side1'), px((c1.x + cB.x) / 2) + 30, py((c1.y + cB.y) / 2) + 6, 28, C.ok, { w: 800 });
    if (a1 > 0) { g.globalAlpha = a1; const m = { x: (c1.x + cB.x) / 2, y: (c1.y + cB.y) / 2 }; arrow(px(m.x), py(m.y), px(m.x + 18 * COS(NRM0)), py(m.y + 18 * SIN(NRM0)), C.cyan, 4);
      text(num(NRM0) + '°', px(m.x + 20 * COS(NRM0)) + 10, py(m.y + 20 * SIN(NRM0)) + 30, 30, C.cyan, { w: 800 }); g.globalAlpha = 1; }
    if (t > at(2)) { dot(c1.x, c1.y, C.cyan); tool(EX, EY, t > at(3) ? 1 : .8); line(px(c1.x), py(c1.y), px(EX), py(EY), C.tool, 3); }
    if (t > at(3)) { const u = ease(clamp((t - at(3) - .5) / 2, 0, 1)); dot(FX.ox, FX.oy, C.err, 7); line(px(FX.ox), py(FX.oy), px(lerp(FX.ox, EX, u)), py(lerp(FX.oy, EY, u)), C.err, 4, [10, 8]); }
    formula(t, [[at(1) + .3, tr('c5.norm') + ' = ' + gc(A.A) + ' - ' + gc(ST) + ' / 2 = ' + gc(NRM0), C.cyan], [at(2) + .3, '#110 = ' + gc(RC) + ' + ' + gc(RT) + ' × ' + gc(FX.cos30) + ' = ' + gc(FX.ex), C.tool],
      [at(2) + 2.5, '#111 = 0 + ' + gc(RT) + ' × SIN[-30] = ' + gc(FX.ey), C.tool], [at(3) + .3, 'G0 X' + gc(FX.ox) + ' Y' + gc(FX.oy) + '  →  G1 X' + gc(FX.ex) + ' Y' + gc(FX.ey), C.ok]], 860, 230);
  } });

/* 6. N10: cada volta, Z em espiral */
const SVZ = { x0: 140, x1: 940, y0: 330, s: 22 };
sc('c6', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [16, 17] : [14, 15];
    // vista "desenrolada": um volta = 6 lados, descendo
    const zy = z => SVZ.y0 + (A.W - z) * SVZ.s * 8;
    text(tr('c6.unrolled'), 540, 290, 28, C.mut, { a: 'center', w: 700 });
    for (let k = 0; k <= A.B; k++) { const x = lerp(SVZ.x0, SVZ.x1, k / A.B); line(x, zy(A.W) - 20, x, zy(A.W - A.K) + 20, 'rgba(143,163,189,.35)', 2, [6, 6]); if (k < A.B) text(tr('c6.side') + ' ' + (k + 1), x + (SVZ.x1 - SVZ.x0) / A.B / 2, zy(A.W - A.K) + 60, 24, C.mut, { a: 'center', w: 700 }); }
    line(SVZ.x0 - 20, zy(A.W), SVZ.x1 + 20, zy(A.W), C.cyan, 2, [10, 8]); text('Z' + gc(A.W), SVZ.x0 - 26, zy(A.W) + 8, 26, C.cyan, { a: 'right', w: 800, mono: true });
    line(SVZ.x0 - 20, zy(A.W - A.K), SVZ.x1 + 20, zy(A.W - A.K), C.ok, 2, [10, 8]); text('Z' + gc(A.W - A.K), SVZ.x0 - 26, zy(A.W - A.K) + 8, 26, C.ok, { a: 'right', w: 800, mono: true });
    const f = clamp((t - at(2)) / (at(3) - at(2) + 1.5), 0, 1);
    if (t > at(2)) { g.beginPath(); g.moveTo(SVZ.x0, zy(A.W)); for (let k = 1; k <= A.B * f; k++) g.lineTo(lerp(SVZ.x0, SVZ.x1, k / A.B), zy(A.W - k * A.K / A.B)); g.strokeStyle = C.tool; g.lineWidth = 6; g.stroke();
      if (f > 1 / A.B) text('−' + num(FX.dz), lerp(SVZ.x0, SVZ.x1, .5 / A.B), zy(A.W - A.K / A.B / 2) - 26, 28, C.tool, { a: 'center', w: 800 }); }
    formula(t, [[at(1) + .3, '#103 = ' + gc(A.W) + ' - ' + gc(A.K) + ' = ' + gc(A.W - A.K), C.ok], [at(2) + .3, '#106 = [' + gc(A.W) + ' - ' + gc(A.W - A.K) + '] / ' + gc(A.B) + ' = ' + gc(FX.dz), C.tool]], 860, 170);
  } });

/* 7. N20: o lado (linha até o canto) */
sc('c7', { code: () => ({ lines: MAC, hl: this_hl, first: 18 }),
  draw(t, T, at) {
    this_hl = t > at(3) ? [24, 25] : t > at(2) ? [21, 22, 23] : [20];
    poly(1, true);
    const c1 = corner(A.A), cn = corner(A.A - ST);
    line(px(c1.x), py(c1.y), px(cn.x), py(cn.y), C.ok, 7);
    if (t > at(1)) { const m = { x: (c1.x + cn.x) / 2, y: (c1.y + cn.y) / 2 }; arrow(px(m.x), py(m.y), px(m.x + 16 * COS(NRM0)), py(m.y + 16 * SIN(NRM0)), C.cyan, 4); text('#109 = ' + num(NRM0) + '°', px(m.x + 18 * COS(NRM0)) + 12, py(m.y + 18 * SIN(NRM0)) + 34, 28, C.cyan, { w: 800 }); }
    if (t > at(2)) { dot(cn.x, cn.y, C.cyan, 10); text('#113 #114', px(cn.x) - 16, py(cn.y) + 8, 26, C.cyan, { a: 'right', w: 800, mono: true }); }
    if (t > at(3)) { const u = ease(clamp((t - at(3) - .3) / 2.5, 0, 1)); line(px(EX), py(EY), px(lerp(EX, P1.x, u)), py(lerp(EY, P1.y, u)), C.tool, 5); tool(lerp(EX, P1.x, u), lerp(EY, P1.y, u)); }
    else tool(EX, EY, .7);
    formula(t, [[at(2) + .3, '#112 = ' + gc(A.A) + ' - ' + gc(ST) + ' = ' + gc(A.A - ST) + '°', C.cyan], [at(2) + 2, '#113 = ' + gc(FX.c2x) + '   #114 = ' + gc(FX.c2y), C.cyan],
      [at(3) + .3, 'G1 X' + gc(FX.p1x) + ' Y' + gc(FX.p1y) + ' Z' + gc(-FX.dz), C.ok]], 860, 230);
  } });

/* 8. o arco em volta do canto */
sc('c8', { code: () => ({ lines: MAC, hl: [26], first: 18 }),
  draw(t, T, at) {
    PV = { cx: 446, cy: 398, s: 9 };
    poly(1, true); const cn = corner(A.A - ST);
    dot(cn.x, cn.y, C.cyan, 9);
    const u = clamp((t - at(1)) / (at(2) - at(1)), 0, 1), a0 = NRM0, a1 = NRM0 - ST, ang = lerp(a0, a1, ease(u));
    g.beginPath(); g.arc(px(cn.x), py(cn.y), RT * PV.s, -a0 * Math.PI / 180, -ang * Math.PI / 180, false); g.strokeStyle = C.tool; g.lineWidth = 5; g.stroke();
    tool(cn.x + RT * COS(ang), cn.y + RT * SIN(ang), .9);
    if (t > at(2)) { line(px(cn.x), py(cn.y), px(P1.x), py(P1.y), C.cyan, 2, [6, 6]); line(px(cn.x), py(cn.y), px(P2.x), py(P2.y), C.cyan, 2, [6, 6]); text(num(ST) + '°', px(cn.x) + 50, py(cn.y) + 70, 30, C.cyan, { w: 800 }); }
    PV = { cx: 470, cy: 530, s: 7.2 };
    formula(t, [[at(1) + .3, 'G2 X' + gc(FX.p2x) + ' Y' + gc(FX.p2y), C.tool], [at(2) + .3, 'I' + gc(FX.ii) + ' J' + gc(FX.jj) + '  → ' + tr('c8.ctr'), C.ok], [at(3) + .3, tr('c8.sharp'), C.ok]], 860, 230);
  } });

/* 9. o próximo lado */
sc('c9', { code: () => ({ lines: MAC, hl: this_hl, first: 22 }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [29] : [27, 28];
    poly(1, true);
    const f = clamp((t - .3) / (T - 1), 0, 1) * (1 / LAPS.length), p = pathUpTo(f); tool(p.x, p.y);
    const side = Math.min(A.B, Math.floor(clamp((t - .3) / (T - 1), 0, .999) * A.B) + 1);
    chip(290, 900, '#107', String(side), C.ok, 1); chip(790, 900, '#108', gc(A.A - (side - 1) * ST) + '°', C.cyan, 1);
    text('IF [' + (side + 1) + ' LE ' + gc(A.B) + '] → ' + (side < A.B ? tr('yes') + ' → N20' : tr('no')), 540, 1000, 36, side < A.B ? C.txt : C.ok, { a: 'center', w: 800, mono: true });
  } });

/* 10. as voltas e o fim */
sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 24 }),
  draw(t, T, at) {
    this_hl = t > at(3) ? [32, 33] : [30, 31];
    const f = clamp((t - .3) / (at(3) - .3), 0, 1), lap = Math.min(LAPS.length, Math.floor(f * LAPS.length) + 1), L = LAPS[lap - 1];
    // vista de lado: altura de cada volta
    const zy = z => 330 + (A.W - z) * 24;
    g.fillStyle = C.part; g.fillRect(260, zy(A.W), 560, zy(A.Z - 3) - zy(A.W)); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(260, zy(A.W), 560, zy(A.Z - 3) - zy(A.W));
    g.fillStyle = '#071021'; g.fillRect(260, zy(A.W), 120, zy(L.b) - zy(A.W)); g.fillRect(700, zy(A.W), 120, zy(L.b) - zy(A.W));
    LAPS.slice(0, lap).forEach((q, i) => { line(250, zy(q.b), 830, zy(q.b), i === lap - 1 ? C.tool : 'rgba(245,165,36,.3)', i === lap - 1 ? 4 : 2); });
    line(240, zy(A.Z), 840, zy(A.Z), C.ok, 3, [10, 8]); text('Z' + gc(A.Z), 230, zy(A.Z) + 10, 28, C.ok, { a: 'right', w: 800, mono: true });
    chip(290, 860, tr('c10.lap'), lap + ' / ' + LAPS.length, C.cyan, 1); chip(790, 860, '#106', gc(r3(L.d)), L.d > 0 ? C.tool : C.ok, 1);
    text('Z ' + gc(L.a) + ' → ' + gc(L.b), 540, 960, 38, C.txt, { a: 'center', w: 800, mono: true });
    if (t > at(3)) text('IF [0 GT 0] → ' + tr('no') + ' → G0 Z' + gc(FX.safeEnd) + ' → M99', 540, 1040, 34, C.ok, { a: 'center', w: 800, mono: true });
  } });

/* 11. resumo */
sc('c11', { draw(t, T, at) {
  const res = [['#100  #101  #102', tr('c11.r1')], ['#110  #111', tr('c11.r2')], ['#103  #106', tr('c11.r3')], ['#112  #113  #114', tr('c11.r4')], ['G1 + G2', tr('c11.r5')], ['#107 / #104', tr('c11.r6')]];
  res.forEach((r, i) => { const a = ease((t - .3 - i * .5) / .4); if (a <= 0) return;
    const y = 260 + i * 108; g.globalAlpha = a; card(70, y, 940, 94, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text(r[0], 100, y + 58, 32, C.tool, { mono: true, w: 700, alpha: a }); text(r[1], 980, y + 58, 32, C.txt, { a: 'right', w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 930, 940, 220, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c11.first'), 110, 1000, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1617 ... W50. Z33. ...', 110, 1065, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c11.air'), 110, 1120, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1190, 940, 190, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c11.sim'), 540, 1265, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c11.path'), 540, 1335, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
