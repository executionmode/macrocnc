/* Vídeo: macro de furo fresado em hélice O1613 — cenas (foco nas contas da macro).
 * Textos em m/helice.<idioma>.js, números em m/facts_helice.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args, V = RAW.vars;
const gc = n => (Math.round(n * 1000) / 1000).toString();
const RP = V[100], OFFW = V[107], SAFE = A.W + A.R;
const ZS = (() => { const z = []; let c = A.W; while (true) { let n = c - A.K; if (n < A.Z) n = A.Z; z.push(n); c = n; if (!(n > A.Z)) break; } return z; })();
const NT = ZS.length;
Object.assign(FX, {
  X: A.X, Y: A.Y, D: A.D, T: A.T, W: A.W, Z: A.Z, K: A.K, R: A.R, F: A.F,
  dt: A.D - A.T, rp: RP, off: OFFW, safe: SAFE, z1: ZS[0], z2: ZS[1], nt: NT, nfull: NT - 1, zl: ZS[NT - 2], znext: ZS[NT - 2] - A.K,
  last: gc(ZS[NT - 2] - ZS[NT - 1]), d2: 2 * A.T, xr: gc(A.X + RP - OFFW), xp: gc(A.X + RP),
  g65a: RAW.g65.split(' ').slice(0, 6).join(' '), g65b: RAW.g65.split(' ').slice(6).join(' ')
});
const MAC = ['O1613 ;', '#100 = [#7 - #20] / 2 ;', '#107 = 0.5 ;', 'IF [#100 LE 0] THEN #3000 = 121 ;', 'IF [#6 LE 0] THEN #3000 = 122 ;',
  'IF [#26 GE #23] THEN #3000 = 123 ;', 'G0 X#24 Y#25 ;', 'G0 Z[#23 + #18] ;', 'G0 X[#24 + #100] ;', 'G1 Z#23 F#9 ;', '#104 = #23 ;',
  'N10 #103 = #104 - #6 ;', 'IF [#103 LT #26] THEN #103 = #26 ;', 'G3 X[#24 + #100] Y#25 Z#103 I[-#100] J0 F#9 ;', '#104 = #103 ;',
  'IF [#103 GT #26] GOTO 10 ;', 'G3 X[#24 + #100] Y#25 I[-#100] J0 F#9 ;', 'G1 X[#24 + #100 - #107] F#9 ;', 'G0 Z[#23 + #18] ;', 'M99 ;'];
const MAIN = ['%', 'O0013 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T10 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S1200 M3 ;', 'G43 H10 Z120. ;', 'M8 ;',
  FX.g65a, '    ' + FX.g65b + ' ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];

/* ---------- vista de cima ---------- */
const HV = { cx: 540, cy: 545, s: 12 };
const hx = x => HV.cx + x * HV.s, hy = y => HV.cy - y * HV.s;
function topPart(a) {
  g.globalAlpha = a == null ? 1 : a;
  g.fillStyle = C.part; g.fillRect(hx(-21), hy(21), 42 * HV.s, 42 * HV.s); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(hx(-21), hy(21), 42 * HV.s, 42 * HV.s);
  g.globalAlpha = 1;
}
function holeTop(fill) { g.beginPath(); g.arc(HV.cx, HV.cy, A.D / 2 * HV.s, 0, 7); if (fill) { g.fillStyle = '#03070f'; g.fill(); } g.strokeStyle = C.ok; g.lineWidth = 4; g.stroke(); }
function toolTop(ang, a, r) {
  r = r == null ? RP : r; const x = HV.cx + r * Math.cos(ang) * HV.s, y = HV.cy - r * Math.sin(ang) * HV.s;
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(x, y, A.T / 2 * HV.s, 0, 7); g.fillStyle = 'rgba(245,165,36,.25)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(x, y, 6, 0, 7); g.fillStyle = C.tool; g.fill(); g.globalAlpha = 1;
  return { x, y };
}
function pathCircle(a) { g.globalAlpha = a == null ? 1 : a; g.beginPath(); g.arc(HV.cx, HV.cy, RP * HV.s, 0, 7); g.strokeStyle = C.cyan; g.lineWidth = 3; g.setLineDash([12, 9]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
function cross() { line(hx(-1.2), hy(0), hx(1.2), hy(0), C.mut, 2); line(hx(0), hy(-1.2), hx(0), hy(1.2), C.mut, 2); }

/* ---------- vista de lado ---------- */
const SV = { cx: 540, top: 440, sx: 13.5, sz: 14 };
const sxp = x => SV.cx + x * SV.sx, szp = z => SV.top - z * SV.sz;
function sidePart(depth) {
  const L = sxp(-21), Rr = sxp(21), bot = szp(-30);
  g.fillStyle = C.part; g.fillRect(L, szp(A.W), Rr - L, bot - szp(A.W)); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(L, szp(A.W), Rr - L, bot - szp(A.W));
  if (depth < A.W) { g.fillStyle = '#03070f'; g.fillRect(sxp(-A.D / 2), szp(A.W) - 2, A.D * SV.sx, szp(depth) - szp(A.W) + 2); }
}
function sideTool(xc, z, a) {
  g.globalAlpha = a == null ? 1 : a;
  g.fillStyle = 'rgba(245,165,36,.85)'; g.fillRect(sxp(xc - A.T / 2), szp(z) - 100, A.T * SV.sx, 100);
  g.fillStyle = '#7d8ea8'; g.fillRect(sxp(xc) - 40, szp(z) - 150, 80, 50); g.globalAlpha = 1;
}
function zTag(z, col, lab, a) { line(sxp(-26), szp(z), sxp(-21), szp(z), col, 3); text(lab || ('Z' + gc(z)), sxp(-27), szp(z) + 10, 28, col, { a: 'right', w: 800, mono: true, alpha: a }); }

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

let this_hl = [1];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

/* 1. abertura */
sc('c1', { draw(t, T) {
  topPart(.9); holeTop(true); cross();
  toolTop(t * 2.2);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 900, 900, 360, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 990, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1090, tr('c1.k2').length > 14 ? 76 : 92, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1613', 540, 1190, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

/* 2. programa principal */
const LETV = [['X', '#24', A.X, 1], ['Y', '#25', A.Y, 1], ['D', '#7', A.D, 1], ['T', '#20', A.T, 1], ['W', '#23', A.W, 2], ['Z', '#26', A.Z, 2],
  ['K', '#6', A.K, 2], ['R', '#18', A.R, 3], ['F', '#9', A.F, 3]];
sc('c2', { code: () => ({ lines: MAIN, hl: [10, 11], title: tr('mainTitle'), n: 9 }),
  draw(t, T, at) {
    const a0 = ease((t - .2) / .6);
    g.globalAlpha = a0; card(50, 250, 980, 150, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(FX.g65a, 540, 315, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    text(FX.g65b, 540, 370, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    const key = t > at(4);
    LETV.forEach((l, i) => {
      const a = ease((t - at(l[3]) - (i % 4) * .2) / .5); if (a <= 0) return;
      const col = i % 3, row = Math.floor(i / 3), x = 50 + col * 332, y = 440 + row * 200;
      const hot = key && ['D', 'T', 'K'].indexOf(l[0]) >= 0;
      g.globalAlpha = a; card(x, y, 316, 180, hot ? 'rgba(60,207,142,.9)' : 'rgba(102,184,255,.4)'); g.globalAlpha = 1;
      text(l[0], x + 26, y + 108, 80, C.tool, { w: 900, mono: true, alpha: a });
      text(tr('c2.n' + l[0]), x + 108, y + 58, 25, C.txt, { alpha: a });
      text('= ' + gc(l[2]), x + 108, y + 106, 36, C.ok, { w: 700, mono: true, alpha: a });
      if (key) text('→ ' + l[1], x + 108, y + 152, 30, hot ? C.ok : C.cyan, { w: 800, mono: true, alpha: ease((t - at(4)) / .5) });
    });
  } });

/* 3. conta 1: raio da trajetória */
sc('c3', { code: () => ({ lines: MAC, hl: [1] }),
  draw(t, T, at) {
    topPart(); holeTop(true); cross();
    const a1 = ease((t - at(1)) / .8), a2 = ease((t - at(2)) / .8), a3 = ease((t - at(3)) / .8);
    dim(hx(-A.D / 2), hy(-A.D / 2) + 40, hx(A.D / 2), hy(-A.D / 2) + 40, 'D = Ø' + gc(A.D), C.ok, [0, 50], 38);
    if (a1 > 0) { const p = toolTop(0, a1); dim(p.x - A.T / 2 * HV.s, hy(A.T / 2) - 30, p.x + A.T / 2 * HV.s, hy(A.T / 2) - 30, 'T = Ø' + gc(A.T), C.tool, [0, -14], 34); }
    if (a2 > 0) { line(HV.cx, HV.cy, HV.cx + RP * HV.s * a2, HV.cy, C.cyan, 7); text(num(RP), HV.cx + RP * HV.s / 2, HV.cy + 50, 42, C.cyan, { a: 'center', w: 800, alpha: a2 }); }
    if (a3 > 0) { pathCircle(a3); toolTop(t * 1.5, a3 * .9); text(tr('c3.path'), 540, 280, 34, C.cyan, { a: 'center', w: 800, alpha: a3 }); }
    formula(t, [[at(0) + .5, '#100 = [#7 - #20] / 2'], [at(1) + .4, '#100 = [' + gc(A.D) + ' - ' + gc(A.T) + '] / 2', C.tool],
      [at(2) - .2, '#100 = ' + gc(A.D - A.T) + ' / 2 = ' + gc(RP), C.ok]], 870);
  } });

/* 4. por que D menor que 2T */
sc('c4', { code: () => ({ lines: MAC, hl: [1] }),
  draw(t, T, at) {
    topPart(); holeTop(true); pathCircle(.8);
    const ang = t * 1.4; toolTop(ang, .35); toolTop(ang + Math.PI, .35);
    const a1 = ease((t - at(1)) / .8);
    if (a1 > 0) { g.globalAlpha = a1; g.beginPath(); g.arc(HV.cx, HV.cy, (RP - A.T / 2 + .01) < 0 ? 0 : 1, 0, 7); g.globalAlpha = 1;
      g.beginPath(); g.arc(HV.cx, HV.cy, 10, 0, 7); g.fillStyle = C.ok; g.globalAlpha = a1; g.fill(); g.globalAlpha = 1;
      text(tr('c4.ok'), 540, 280, 34, C.ok, { a: 'center', w: 800, alpha: a1 }); }
    const a2 = ease((t - at(2)) / .8);
    if (a2 > 0) text(tr('c4.core'), 540, 850, 34, C.err, { a: 'center', w: 800, alpha: a2 });
    formula(t, [[at(0) + .5, 'D < 2 × T ?'], [at(1) + .2, gc(A.D) + ' < ' + gc(2 * A.T) + '  ✓', C.ok]], 885, 170);
  } });

/* 5. conferências */
const ALC = [['#100 LE 0', '121', 'c5.q1'], ['#6 LE 0', '122', 'c5.q2'], ['#26 GE #23', '123', 'c5.q3']];
sc('c5', { code: () => ({ lines: MAC, hl: [2, 3, 4, 5] }),
  draw(t, T, at) {
    const a0 = ease((t - at(0) - .3) / .6);
    if (a0 > 0) { g.globalAlpha = a0; card(70, 260, 940, 120, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
      text('#107 = 0.5', 110, 335, 44, C.cyan, { mono: true, w: 800, alpha: a0 }); text(tr('c5.off'), 980, 335, 32, C.txt, { a: 'right', alpha: a0 }); }
    ALC.forEach((r, i) => { const a = ease((t - at(1) - i * .8) / .5); if (a <= 0) return; const y = 410 + i * 150;
      g.globalAlpha = a; card(70, y, 940, 132, 'rgba(255,107,107,.45)'); g.globalAlpha = 1;
      text(tr(r[2]), 110, y + 56, 36, C.txt, { w: 700, alpha: a }); text('IF [' + r[0] + ']', 110, y + 104, 30, C.mut, { mono: true, alpha: a });
      text(r[1], 900, y + 84, 48, C.err, { a: 'center', w: 900, mono: true, alpha: a }); });
    const a3 = ease((t - at(2)) / .6);
    if (a3 > 0) text(tr('c5.ok'), 540, 900, 44, C.ok, { a: 'center', w: 800, alpha: a3 });
  } });

/* 6. aproximação */
sc('c6', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    const p1 = ease((t - at(0) - .3) / 1), p2 = ease((t - at(1) - .3) / 1), p3 = ease((t - at(2) - .3) / 1.2);
    this_hl = t > at(2) ? [9] : t > at(1) ? [8] : [6, 7];
    let x = 0, z = t > at(0) ? lerp(25, SAFE, p1) : 25;
    if (t > at(1)) x = RP * p2; if (t > at(2)) z = lerp(SAFE, A.W, p3);
    sidePart(A.W + 1); text(tr('side'), 1010, 300, 28, C.mut, { a: 'right' });
    line(sxp(-26), szp(SAFE), sxp(26), szp(SAFE), C.cyan, 3, [14, 10]); text('Z' + gc(SAFE), sxp(-27), szp(SAFE) + 10, 28, C.cyan, { a: 'right', w: 800, mono: true });
    text('W' + gc(A.W), sxp(-27), szp(A.W) + 34, 28, C.txt, { a: 'right', w: 800, mono: true });
    line(sxp(-A.D / 2), szp(A.W), sxp(-A.D / 2), szp(A.W) + 40, C.ok, 3, [6, 6]); line(sxp(A.D / 2), szp(A.W), sxp(A.D / 2), szp(A.W) + 40, C.ok, 3, [6, 6]);
    sideTool(x, z);
    const st = t > at(2) ? ['G1 Z#23', 'G1 Z' + gc(A.W) + '  F' + gc(A.F), C.ok] : t > at(1) ? ['G0 X[#24 + #100]', 'G0 X' + gc(A.X + RP), C.cyan] : ['G0 Z[#23 + #18]', 'G0 Z' + gc(SAFE), C.cyan];
    formula(t, [[at(0) + .3, st[0]], [at(0) + 1.2, st[1], st[2]]], 870, 170);
  } });

/* 7. N10: uma volta da hélice */
function helixSide(t0, prog, showTurns) { // desenha trajeto do centro da fresa na vista de lado
  const n = Math.min(NT, Math.ceil(prog)); g.beginPath(); let first = true;
  for (let k = 0; k < n; k++) { const zs = k ? ZS[k - 1] : A.W, ze = ZS[k], f = Math.min(1, prog - k);
    for (let s = 0; s <= 40 * f; s++) { const u = s / 40, z = lerp(zs, ze, u), x = RP * Math.cos(u * 2 * Math.PI);
      if (first) { g.moveTo(sxp(x), szp(z)); first = false; } else g.lineTo(sxp(x), szp(z)); } }
  g.strokeStyle = C.cyan; g.lineWidth = 3; g.stroke();
}
function helixPos(prog) { const k = Math.min(NT - 1, Math.floor(prog)), u = prog >= NT ? 1 : prog - k, zs = k ? ZS[k - 1] : A.W; return { x: RP * Math.cos(u * 2 * Math.PI), z: lerp(zs, ZS[k], u), k }; }
sc('c7', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [13] : [10, 11, 12];
    const prog = clamp((t - at(2) - .3) / (at(3) - at(2) + 2), 0, 1);
    const p = helixPos(prog), depth = Math.min(A.W, prog > 0 ? p.z : A.W);
    sidePart(depth); text(tr('side'), 1010, 300, 28, C.mut, { a: 'right' });
    zTag(A.W, C.txt, 'W' + gc(A.W)); if (t > at(1)) zTag(ZS[0], C.tool, null, ease((t - at(1)) / .5));
    helixSide(0, prog); sideTool(p.x, p.z);
    const a4 = ease((t - at(3)) / .6);
    formula(t, [[at(0) + .3, '#104 = ' + gc(A.W)], [at(1) + .3, '#103 = #104 - #6 = ' + gc(A.W) + ' - ' + gc(A.K) + ' = ' + gc(ZS[0]), C.tool],
      [at(2) + .3, 'G3 X' + FX.xp + ' Y' + gc(A.Y) + ' Z' + gc(ZS[0]) + ' I-' + gc(RP) + ' J0', C.ok]], 870);
  } });

/* 8. o laço: volta por volta */
sc('c8', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    const prog = t < at(1) ? 1 : clamp(1 + (t - at(1)) / (at(3) - at(1) - .2) * (NT - 1), 1, NT);
    const p = helixPos(prog - 1e-6), k = Math.min(NT, Math.ceil(prog - 1e-6));
    this_hl = t > at(3) ? [11, 12] : [14, 15];
    sidePart(Math.min(A.W, p.z)); text(tr('side'), 1010, 300, 28, C.mut, { a: 'right' });
    zTag(A.W, C.txt, 'W' + gc(A.W)); zTag(A.Z, C.ok);
    helixSide(0, prog); sideTool(p.x, p.z);
    chip(300, 880, tr('turn'), k + ' / ' + NT, C.tool, 1); chip(780, 880, '#103', gc(ZS[k - 1]), C.cyan, 1);
    const q = t > at(3) ? gc(FX.znext) + ' < ' + gc(A.Z) + ' → #103 = ' + gc(A.Z) : 'IF [' + gc(ZS[k - 1]) + ' GT ' + gc(A.Z) + '] → GOTO 10';
    text(q, 540, 990, 40, t > at(3) ? C.ok : C.txt, { a: 'center', w: 800, mono: true });
  } });

/* 9. volta final, afasta e sobe */
sc('c9', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [18, 19] : t > at(1) ? [17] : [16];
    topPart(); holeTop(true); pathCircle(.6); cross();
    if (t < at(1)) { toolTop(ease(clamp((t - at(0) - .3) / (at(1) - at(0) - .5), 0, 1)) * 2 * Math.PI); text(tr('c9.floor'), 540, 280, 34, C.cyan, { a: 'center', w: 800 }); }
    else { const a = ease((t - at(1) - .3) / .8), r = lerp(RP, RP - OFFW * 6, a); toolTop(0, 1, r);
      if (a > 0) text('X' + FX.xp + ' → X' + FX.xr, 540, 280, 36, C.ok, { a: 'center', w: 800, mono: true, alpha: a });
      if (t > at(2)) text(tr('c9.up'), 540, 845, 36, C.cyan, { a: 'center', w: 800, alpha: ease((t - at(2)) / .6) }); }
    formula(t, [[at(1) + .3, 'G1 X[#24 + #100 - #107]'], [at(1) + 1.6, 'G1 X' + gc(A.X) + ' + ' + gc(RP) + ' - ' + gc(OFFW) + ' = X' + FX.xr, C.ok], [at(2) + .3, 'G0 Z' + gc(SAFE) + '   M99', C.cyan]], 870);
  } });

/* 10. resumo */
sc('c10', { draw(t, T, at) {
  const res = [['#100 = [D - T] / 2', tr('c10.r1')], ['D < 2 × T', tr('c10.r2')], ['G0 X#24+#100, G1 Z#23', tr('c10.r3')], ['#103 = #104 - K', tr('c10.r4')], ['G3 ... Z#103 I-#100', tr('c10.r5')], ['G1 X... - #107', tr('c10.r6')]];
  res.forEach((r, i) => { const a = ease((t - .3 - i * .5) / .4); if (a <= 0) return;
    const y = 260 + i * 108; g.globalAlpha = a; card(70, y, 940, 94, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text(r[0], 100, y + 58, 30, C.tool, { mono: true, w: 700, alpha: a }); text(r[1], 980, y + 58, 30, C.txt, { a: 'right', w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 930, 940, 220, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c10.first'), 110, 1000, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1613 ... W50. Z49. ...', 110, 1065, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c10.air'), 110, 1120, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1190, 940, 190, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c10.sim'), 540, 1265, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c10.path'), 540, 1335, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
