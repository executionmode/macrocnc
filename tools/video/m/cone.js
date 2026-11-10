/* Vídeo: cone externo O1630 — cenas (foco nas contas da macro).
 * Textos em m/cone.<idioma>.js, números em m/facts_cone.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args;
const gc = n => (Math.round(n * 1000) / 1000).toString();
const r3 = v => Math.round(v * 1000) / 1000;
const TAN = d => Math.tan(d * Math.PI / 180);
const K = 1 / TAN(A.B), HT = A.W - A.Z, TOPD = A.D - 2 * HT * K, RT = TOPD / 2, RB = A.D / 2;
const ZS = [...new Set(RAW.segs.filter(s => s[8] === 2).map(s => s[6]))];
const cen = z => RT + (A.W - z) * K + A.T / 2;
Object.assign(FX, {
  D: A.D, B: A.B, W: A.W, Z: A.Z, Q: A.Q, T: A.T, R: A.R, F: A.F, h: HT,
  k: r3(K), topd: r3(TOPD), rt: r3(RT), rb: RB, e2: A.T / 2, x1: r3(cen(0)), x10: r3(cen(-10)), xl: r3(cen(A.Z)),
  zq: A.W + A.Q, z2: A.W - A.Q, n: ZS.length, out: RB + A.T / 2 + 2, safe: A.W + A.R, qk: r3(A.Q * K),
  g65a: RAW.g65.split(' ').slice(0, 7).join(' '), g65b: RAW.g65.split(' ').slice(7).join(' ')
});
const MAC = ['O1630 ;', 'IF [#20 LE 0] THEN #3000 = 281 ;', 'IF [#26 GE #23] THEN #3000 = 282 ;', 'IF [#7 LE 0] THEN #3000 = 283 ;',
  'IF [#17 LE 0] THEN #3000 = 287 ;', 'IF [#2 EQ #0] GOTO 4 ;', 'IF [#2 GE 90] THEN #3000 = 289 ;', 'IF [#2 LT 1] THEN #3000 = 289 ;',
  '#104 = 1 / TAN[#2] ;', '#1 = #7 - 2 * [#23 - #26] * #104 ;', 'IF [#1 LT 0] THEN #3000 = 284 ;', 'GOTO 5 ;',
  'N4 IF [#1 LT 0] THEN #3000 = 284 ;', 'IF [#1 GE #7] THEN #3000 = 284 ;', '#104 = [#7 - #1] / 2 / [#23 - #26] ;',
  'N5 IF [#104 * #17 GT #20] THEN #3000 = 290 ;', '#100 = #7 / 2 ;', '#101 = #1 / 2 ;', '#103 = #23 + #17 ;', '#108 = 0 ;',
  'N10 #103 = #103 - #17 ;', 'IF [#103 LT #26] THEN #103 = #26 ;', '#107 = #101 + [#23 - #103] * #104 + #20 / 2 ;',
  'IF [#108 NE 0] GOTO 20 ;', 'G0 X[#24 + #100 + #20 / 2 + 2] Y#25 ;', 'G0 Z[#23 + #18] ;', 'G1 Z#103 F#9 ;', 'G1 X[#24 + #107] F#9 ;',
  '#108 = 1 ;', 'GOTO 30 ;', 'N20 G1 X[#24 + #107] Z#103 F#9 ;', 'N30 G2 X[#24 + #107] Y#25 I[-#107] J0 F#9 ;',
  'IF [#103 GT #26] GOTO 10 ;', 'G1 X[#24 + #100 + #20 / 2 + 2] F#9 ;', 'G0 Z[#23 + #18] ;', 'M99 ;'];
const MAIN = ['%', 'O0031 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T1 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S2500 M3 ;', 'G43 H1 Z120. ;', 'M8 ;',
  FX.g65a, '    ' + FX.g65b + ' ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];

/* ---------- quadro de contas ---------- */
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

/* ---------- vista de lado (meio corte) ---------- */
const SV = { ax: 110, z0: 330, s: 14 };
const sx = r => SV.ax + r * SV.s, sy = z => SV.z0 - z * SV.s;
function sideView(zc, a) { // zc: Z até onde já cortou (null = bruto inteiro)
  g.globalAlpha = a == null ? 1 : a;
  const zb = A.Z - 7;
  // bruto ainda não cortado (abaixo do Z atual)
  if (zc != null && zc > A.Z) { g.fillStyle = 'rgba(93,134,189,.30)'; g.fillRect(sx(0), sy(zc), RB * SV.s, sy(A.Z) - sy(zc)); }
  if (zc == null) { g.fillStyle = 'rgba(93,134,189,.30)'; g.fillRect(sx(0), sy(A.W), RB * SV.s, sy(A.Z) - sy(A.W)); }
  // cone (peça pronta) + base
  g.beginPath(); g.moveTo(sx(0), sy(A.W)); g.lineTo(sx(RT), sy(A.W)); g.lineTo(sx(RB), sy(A.Z)); g.lineTo(sx(RB), sy(zb)); g.lineTo(sx(0), sy(zb)); g.closePath();
  g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
  g.globalAlpha = 1;
  line(sx(0), sy(A.W + 6), sx(0), sy(zb - 2), C.mut, 2, [14, 10]);
  text(tr('axis'), sx(0) + 10, sy(zb) + 36, 24, C.mut, { w: 700 });
}
function coneLine(a) { g.globalAlpha = a; line(sx(RT), sy(A.W), sx(RB), sy(A.Z), C.ok, 6); g.globalAlpha = 1; }
function endMill(rc, z, a) { millSide(sx(rc - A.T / 2), sx(rc + A.T / 2), sy(z), { alpha: a, corner: 'L', axis: true }); }
function zLabel(z, col, label) { line(sx(-3), sy(z), sx(RB + 6), sy(z), col, 2, [10, 8]); text(label, sx(RB + 7), sy(z) + 10, 28, col, { w: 800, mono: true }); }

let this_hl = [9];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

/* 1. abertura */
sc('c1', { draw(t, T) {
  const f = clamp((t - .5) / (T - 1.2), 0, 1), i = Math.min(ZS.length - 1, Math.floor(f * ZS.length)), z = ZS[i];
  sideView(z, 1); endMill(cen(z), z, 1);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 860, 900, 360, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 950, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1050, 84, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1630', 540, 1150, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

/* 2. letras */
const LETV = [['X', '#24', A.X, 1], ['Y', '#25', A.Y, 1], ['D', '#7', A.D, 1], ['B', '#2', A.B, 1], ['W', '#23', A.W, 2], ['Z', '#26', A.Z, 2],
  ['Q', '#17', A.Q, 2], ['T', '#20', A.T, 3], ['R', '#18', A.R, 3], ['F', '#9', A.F, 3]];
sc('c2', { code: () => ({ lines: MAIN, hl: [10, 11], title: tr('mainTitle'), n: 9 }),
  draw(t, T, at) {
    const a0 = ease((t - .2) / .6);
    g.globalAlpha = a0; card(50, 250, 980, 150, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(FX.g65a, 540, 315, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    text(FX.g65b, 540, 370, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    const key = t > at(4);
    LETV.forEach((l, i) => {
      const a = ease((t - at(l[3]) - (i % 4) * .2) / .5); if (a <= 0) return;
      const col = i % 3, row = Math.floor(i / 3), x = 50 + col * 332, y = 430 + row * 162;
      const hot = key && ['D', 'B', 'W', 'Z', 'Q', 'T'].indexOf(l[0]) >= 0;
      g.globalAlpha = a; card(x, y, 316, 146, hot ? 'rgba(60,207,142,.9)' : 'rgba(102,184,255,.4)'); g.globalAlpha = 1;
      text(l[0], x + 26, y + 92, 74, C.tool, { w: 900, mono: true, alpha: a });
      text(tr('c2.n' + l[0]), x + 104, y + 52, 25, C.txt, { alpha: a });
      text('= ' + gc(l[2]), x + 104, y + 96, 34, C.ok, { w: 700, mono: true, alpha: a });
      if (key) text('→ ' + l[1], x + 104, y + 132, 28, hot ? C.ok : C.cyan, { w: 800, mono: true, alpha: ease((t - at(4)) / .5) });
    });
  } });

/* 3. conferências */
sc('c3', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [4] : t > at(1) ? [2] : [1, 2, 3, 4];
    sideView(null, .5);
    const rows = [['T ≤ 0', '281'], ['Z ≥ W', '282'], ['D ≤ 0', '283'], ['Q ≤ 0', '287']];
    rows.forEach((r, i) => { const a = ease((t - at(0) - .4 - i * .35) / .4); if (a <= 0) return; const y = 300 + i * 92, hot = (t > at(1) && t < at(2) && i === 1) || (t > at(2) && i === 3);
      g.globalAlpha = a; card(200, y, 680, 78, hot ? C.err : 'rgba(102,184,255,.35)'); g.globalAlpha = 1;
      text(r[0], 240, y + 52, 38, hot ? C.err : C.txt, { mono: true, w: 800, alpha: a }); text(tr('alarm') + ' ' + r[1], 840, y + 52, 34, C.err, { a: 'right', w: 800, alpha: a }); });
    formula(t, [[at(1) + .5, 'IF [' + gc(A.Z) + ' GE ' + gc(A.W) + '] ?', C.tool], [at(1) + 2, tr('c3.no'), C.ok], [at(2) + .5, 'IF [' + gc(A.Q) + ' LE 0] ? ' + tr('c3.no'), C.ok]], 820, 170);
  } });

/* 4. abertura do cone (#104) */
sc('c4', { code: () => ({ lines: MAC, hl: [8] }),
  draw(t, T, at) {
    sideView(null, 1); coneLine(1);
    const a1 = ease((t - at(1)) / .8), a2 = ease((t - at(2)) / .8);
    // triângulo: desce 1 (ampliado), raio aumenta k
    const zA = -6, rA = RT + (A.W - zA) * K, zB2 = -14, rB2 = RT + (A.W - zB2) * K;
    if (a1 > 0) { g.globalAlpha = a1;
      line(sx(rA), sy(zA), sx(rA), sy(zB2), C.cyan, 5); line(sx(rA), sy(zB2), sx(rB2), sy(zB2), C.tool, 5);
      text(tr('c4.down') + ' 8', sx(rA) - 16, (sy(zA) + sy(zB2)) / 2, 30, C.cyan, { a: 'right', w: 800 });
      text('8 × ' + num(FX.k) + ' = ' + num(r3(8 * K)), (sx(rA) + sx(rB2)) / 2, sy(zB2) + 44, 30, C.tool, { a: 'center', w: 800 });
      g.globalAlpha = 1; }
    // ângulo B na face de cima
    g.beginPath(); g.arc(sx(RT), sy(A.W), 70, 0, Math.atan2(sy(A.Z) - sy(A.W), sx(RB) - sx(RT))); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
    text('B = ' + num(A.B) + '°', sx(RT) + 100, sy(A.W) + 50, 32, C.tool, { w: 800 });
    if (a2 > 0) { g.globalAlpha = a2; card(560, 640, 470, 120, C.ok); g.globalAlpha = 1;
      text(tr('c4.per1'), 795, 690, 28, C.txt, { a: 'center', w: 700, alpha: a2 }); text('→ ' + num(FX.k) + ' mm', 795, 738, 36, C.ok, { a: 'center', w: 800, alpha: a2 }); }
    formula(t, [[at(0) + .4, '#104 = 1 / TAN[#2]'], [at(1) + .3, '#104 = 1 / TAN[' + gc(A.B) + ']', C.tool], [at(1) + 2.4, '#104 = ' + gc(K), C.ok]], 820);
  } });

/* 5. diâmetro do topo (#1) */
sc('c5', { code: () => ({ lines: MAC, hl: [9] }),
  draw(t, T, at) {
    sideView(null, 1); coneLine(.6);
    const a1 = ease((t - at(1)) / .8), a2 = ease((t - at(2)) / .8), a3 = ease((t - at(3)) / .8);
    if (a1 > 0) { g.globalAlpha = a1; dim(sx(RB) + 40, sy(A.W), sx(RB) + 40, sy(A.Z), 'W − Z = ' + num(HT), C.cyan, [110, 10], 30); g.globalAlpha = 1; }
    if (a2 > 0) { g.globalAlpha = a2; dim(sx(RT), sy(A.W) + 30, sx(RB), sy(A.W) + 30, num(r3(HT * K)), C.tool, [0, -16], 30); g.globalAlpha = 1; }
    if (a3 > 0) { g.globalAlpha = a3; dim(sx(0), sy(A.W) - 40, sx(RT), sy(A.W) - 40, 'A/2 = ' + num(FX.rt), C.ok, [0, -16], 30); g.globalAlpha = 1; }
    formula(t, [[at(0) + .4, '#1 = #7 - 2 * [#23 - #26] * #104'], [at(1) + .3, '#1 = ' + gc(A.D) + ' - 2 * ' + gc(HT) + ' * ' + gc(K), C.tool],
      [at(2) + .5, '#1 = ' + gc(A.D) + ' - ' + gc(r3(2 * HT * K)), C.tool], [at(3) + .2, '#1 = ' + gc(TOPD) + '   (Ø ' + tr('c5.top') + ')', C.ok]], 820);
  } });

/* 6. conferência do passe (alarme 290) */
sc('c6', { code: () => ({ lines: MAC, hl: [15] }),
  draw(t, T, at) {
    sideView(null, 1); coneLine(1);
    const z1 = -6, z2 = z1 - 3, a1 = ease((t - at(1)) / .6);
    endMill(cen(z1), z1, .35); if (a1 > 0) endMill(cen(z2), z2, a1);
    if (a1 > 0) { g.globalAlpha = a1; dim(sx(cen(z1) - A.T / 2), sy(z2) + 40, sx(cen(z2) - A.T / 2), sy(z2) + 40, 'Q × #104', C.tool, [0, 44], 28); g.globalAlpha = 1; }
    formula(t, [[at(0) + .3, 'IF [#104 * #17 GT #20] → 290'], [at(1) + .3, gc(K) + ' × ' + gc(A.Q) + ' = ' + gc(r3(A.Q * K)), C.tool], [at(2) + .3, gc(r3(A.Q * K)) + ' < ' + gc(A.T) + '  → ' + tr('c3.no'), C.ok]], 820);
  } });

/* 7. N10: o Z de cada volta */
sc('c7', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [20, 21] : [18, 20];
    sideView(null, 1); coneLine(.5);
    const a1 = ease((t - at(1)) / .6), a2 = ease((t - at(2)) / .6);
    if (a1 > 0) { zLabel(A.W + A.Q * 10, C.mut, 'W + Q'); }
    if (a2 > 0) { [0, -0.3, -0.6].forEach((z, i) => { const zz = A.W - i * 3; line(sx(RT - 2), sy(zz), sx(RB + 4), sy(zz), i ? C.cyan : C.ok, 3); }); text(tr('c7.each'), sx(RB + 6), sy(-3) + 10, 28, C.cyan, { w: 800 }); }
    const a3 = ease((t - at(3)) / .6); if (a3 > 0) zLabel(A.Z, C.err, 'Z' + gc(A.Z));
    formula(t, [[at(1) + .2, '#103 = ' + gc(A.W) + ' + ' + gc(A.Q) + ' = ' + gc(A.W + A.Q), C.tool], [at(2) + .2, 'N10 #103 = ' + gc(A.W + A.Q) + ' - ' + gc(A.Q) + ' = ' + gc(A.W), C.ok],
      [at(2) + 2.4, '#103 = ' + gc(A.W) + ' - ' + gc(A.Q) + ' = ' + gc(A.W - A.Q), C.ok], [at(3) + .3, 'IF [#103 LT ' + gc(A.Z) + '] → #103 = ' + gc(A.Z), C.err]], 820);
  } });

/* 8. #107: raio do centro da fresa */
sc('c8', { code: () => ({ lines: MAC, hl: [22] }),
  draw(t, T, at) {
    const z = t > at(3) ? -10 : 0, rc = cen(z);
    sideView(z, 1); coneLine(.6); endMill(rc, z, ease((t - at(1)) / .6));
    const a1 = ease((t - at(1)) / .6);
    if (a1 > 0) { g.globalAlpha = a1;
      dim(sx(0), sy(z) + 40, sx(rc - A.T / 2), sy(z) + 40, num(r3(rc - A.T / 2)), C.ok, [0, 44], 30);
      dim(sx(rc - A.T / 2), sy(z) + 100, sx(rc), sy(z) + 100, 'T/2 = ' + num(A.T / 2), C.tool, [0, 44], 30);
      line(sx(0), sy(z) + 160, sx(rc), sy(z) + 160, C.cyan, 4); text('#107 = ' + num(r3(rc)), sx(rc) + 12, sy(z) + 170, 32, C.cyan, { w: 800 });
      g.globalAlpha = 1; }
    const s0 = '#107 = ' + gc(RT) + ' + [' + gc(A.W) + ' - ' + gc(z) + '] * ' + gc(K) + ' + ' + gc(A.T / 2);
    formula(t, [[at(0) + .4, '#107 = #101 + [#23 - #103] * #104 + #20 / 2'], [at(1) + .4, '#107 = ' + gc(RT) + ' + 0 + ' + gc(A.T / 2), C.tool], [at(2) + .2, '#107 = ' + gc(cen(0)), C.ok],
      [at(3) + .4, s0, C.tool], [at(4) + .2, '#107 = ' + gc(cen(-10)), C.ok]], 770, 300);
  } });

/* 9. primeira volta: entra por fora e faz o G2 */
const TP = { cx: 540, cy: 560, s: 5.6 };
sc('c9', { code: () => ({ lines: MAC, hl: this_hl, first: 22 }),
  draw(t, T, at) {
    const st = t > at(3) ? 4 : t > at(2) ? 3 : t > at(1) ? 1 : 0;
    this_hl = st >= 4 ? [31] : st >= 3 ? [27] : st >= 1 ? [24, 25, 26] : [23];
    // vista de cima
    g.beginPath(); g.arc(TP.cx, TP.cy, RB * TP.s, 0, 7); g.fillStyle = 'rgba(93,134,189,.3)'; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(TP.cx, TP.cy, RT * TP.s, 0, 7); g.fillStyle = C.part; g.fill(); g.strokeStyle = C.ok; g.lineWidth = 3; g.stroke();
    text(tr('c9.top'), TP.cx, TP.cy - RB * TP.s - 30, 28, C.mut, { a: 'center', w: 700 });
    let x = FX.out, ang = 0;
    if (st >= 3) { const u = ease((t - at(2)) / 1.2); x = lerp(FX.out, cen(0), u); }
    if (st >= 4) { x = cen(0); ang = clamp((t - at(3) - .3) / (T - at(3) - 1.5), 0, 1) * 2 * Math.PI;
      g.beginPath(); g.arc(TP.cx, TP.cy, x * TP.s, 0, -ang, true); g.strokeStyle = C.tool; g.lineWidth = 5; g.stroke(); }
    const px = TP.cx + x * TP.s * Math.cos(-ang), py = TP.cy + x * TP.s * Math.sin(-ang);
    millTop(px, py, A.T / 2 * TP.s);
    formula(t, [[at(1) + .3, 'X = ' + gc(RB) + ' + ' + gc(A.T / 2) + ' + 2 = ' + gc(FX.out), C.tool], [at(2) + .3, 'G1 X' + gc(cen(0)), C.ok], [at(3) + .3, 'G2 X' + gc(cen(0)) + ' Y0 I-' + gc(cen(0)) + ' J0', C.ok]], 840, 230);
  } });

/* 10. o laço */
sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 22 }),
  draw(t, T, at) {
    const f = clamp((t - at(1)) / (at(3) - at(1)), 0, 1), i = Math.min(ZS.length - 1, Math.floor(f * ZS.length)), z = ZS[i];
    this_hl = t > at(3) ? [32] : [30, 31, 32];
    sideView(z, 1); coneLine(.4); endMill(cen(z), z, 1);
    chip(290, 880, '#103', gc(z), C.ok, 1); chip(790, 880, '#107', gc(cen(z)), C.cyan, 1);
    text(tr('c10.turn', { a: i + 1, b: ZS.length }), 540, 975, 38, C.txt, { a: 'center', w: 800 });
    const last = t > at(3);
    text('IF [' + gc(z) + ' GT ' + gc(A.Z) + '] → ' + (last ? tr('no') + ' → ' + tr('c10.end') : tr('yes') + ' → N10'), 540, 1050, 36, last ? C.ok : C.txt, { a: 'center', w: 800, mono: true });
  } });

/* 11. fim */
sc('c11', { code: () => ({ lines: MAC, hl: this_hl, first: 26 }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [34, 35] : [33];
    sideView(A.Z, 1); coneLine(.4);
    const u = ease((t - at(0) - .5) / 1), z = t > at(1) ? lerp(A.Z, A.W + A.R, ease((t - at(1)) / 1)) : A.Z;
    endMill(lerp(cen(A.Z), FX.out, u), z, 1);
    formula(t, [[at(0) + .4, 'G1 X' + gc(FX.out), C.tool], [at(1) + .3, 'G0 Z' + gc(A.W + A.R) + '  →  M99', C.ok]], 860, 170);
  } });

/* 12. resumo */
sc('c12', { draw(t, T, at) {
  const res = [['#104 = 1 / TAN[B]', tr('c12.r1')], ['#1 = D - 2·H·#104', tr('c12.r2')], ['Q × #104 ≤ T', tr('c12.r3')], ['#103 - Q', tr('c12.r4')], ['#107', tr('c12.r5')], ['G2 ... I-#107', tr('c12.r6')]];
  res.forEach((r, i) => { const a = ease((t - .3 - i * .5) / .4); if (a <= 0) return;
    const y = 260 + i * 108; g.globalAlpha = a; card(70, y, 940, 94, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text(r[0], 100, y + 58, 32, C.tool, { mono: true, w: 700, alpha: a }); text(r[1], 980, y + 58, 32, C.txt, { a: 'right', w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 930, 940, 220, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c12.first'), 110, 1000, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1630 ... W50. Z30. ...', 110, 1065, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c12.air'), 110, 1120, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1190, 940, 190, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c12.sim'), 540, 1265, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c12.path'), 540, 1335, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
