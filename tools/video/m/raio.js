/* Vídeo: raio convexo e côncavo na aresta O1618 — cenas (foco nas contas da macro).
 * Textos em m/raio.<idioma>.js, números em m/facts_raio.js (simulação real do convexo). */
const RAW = window.FACTS_RAW, A = RAW.args;
const CC = { X: -165, I: 165, Y: 0, W: 0, C: 15, T: 20, A: 15, H: 1 };   // exemplo côncavo (O0023)
const gc = n => (Math.round(n * 1000) / 1000).toString();
const r3 = v => Math.round(v * 1000) / 1000;
const SIN = d => Math.sin(d * Math.PI / 180), COS = d => Math.cos(d * Math.PI / 180);
const cvx = th => ({ d: A.C - A.C * SIN(th), z: A.W - A.C + A.C * COS(th) });
const ccv = th => ({ d: CC.C * COS(th), z: CC.W - CC.C * SIN(th) });
const NP = RAW.segs.filter(s => s[0] === 'f' && s[7] === 92).length;
Object.assign(FX, {
  X: A.X, I: A.I, Y: A.Y, W: A.W, C: A.C, U: A.U, V: A.V, H: A.H, T: A.T, A: A.A, R: A.R, F: A.F,
  x1: A.X - A.T / 2 - A.A, x2: A.X + A.I + A.T / 2 + A.A, t2: A.T / 2, n: NP,
  d30: r3(cvx(30).d), z30: r3(cvx(30).z), d60: r3(cvx(60).d), z60: r3(cvx(60).z), y30: r3(A.Y + cvx(30).d - A.T / 2),
  cC: CC.C, cT: CC.T, cd30: r3(ccv(30).d), cz30: r3(ccv(30).z), cy30: r3(CC.Y + ccv(30).d - CC.T / 2),
  g65a: RAW.g65.split(' ').slice(0, 8).join(' '), g65b: RAW.g65.split(' ').slice(8).join(' ')
});
const MAC = ['O1618 ;', 'IF [#3 LE 0] THEN #3000 = 171 ;', 'IF [#11 LE 0] THEN #3000 = 172 ;', 'IF [#11 GE 90] THEN #3000 = 173 ;', 'IF [#20 LE 0] THEN #3000 = 174 ;',
  'IF [#4 LE 0] THEN #3000 = 175 ;', 'IF [#21 GT 1] THEN #3000 = 176 ;', 'IF [#21 LT 0] THEN #3000 = 176 ;', 'IF [#17 EQ 0] THEN #17 = #9 ;',
  '#100 = 1 ;', 'IF [#22 GT 0] THEN #100 = -1 ;', '#101 = #24 - #20 / 2 - #1 ;', '#102 = #24 + #4 + #20 / 2 + #1 ;', '#103 = #11 ;',
  '#107 = #101 ;', '#108 = #102 ;', 'G0 X#107 Y[#25 - #100 * #20 / 2] ;', 'G0 Z[#23 + #18] ;',
  'N10 IF [#21 GT 0] GOTO 20 ;', '#104 = #3 - #3 * SIN[#103] ;', '#106 = #23 - #3 + #3 * COS[#103] ;', 'GOTO 30 ;',
  'N20 #104 = #3 * COS[#103] ;', '#106 = #23 - #3 * SIN[#103] ;', 'N30 #105 = #25 + #100 * [#104 - #20 / 2] ;', 'G1 Y#105 Z#106 F#17 ;', 'G1 X#108 F#9 ;',
  '#109 = #107 ;', '#107 = #108 ;', '#108 = #109 ;', '#103 = #103 + #11 ;', 'IF [#103 LT 90] GOTO 10 ;', 'G0 Z[#23 + #18] ;', 'M99 ;'];
const MAIN = ['%', 'O0018 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T8 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S1600 M3 ;', 'G43 H8 Z120. ;', 'M8 ;',
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

/* ---------- corte (Y na horizontal, Z na vertical) ---------- */
const SV0 = { y0: -55, x0: 120, z0: 470, s: 14 };
let SV = Object.assign({}, SV0);
const qx = y => SV.x0 + (y - SV.y0) * SV.s, qz = z => SV.z0 - z * SV.s;
function section(kind, upTo) { // peça com o perfil (convexo/côncavo) cortado até o ângulo upTo
  const p = kind === 'c' ? CC : A, yf = p.Y, w = p.W, c = p.C, ymax = SV.y0 + 900 / SV.s, zb = w - c - 9;
  g.beginPath();
  g.moveTo(qx(ymax), qz(zb)); g.lineTo(qx(yf), qz(zb));
  if (kind === 'v') { // convexo: face até W - C, arco até W, topo
    const full = upTo == null ? 90 : upTo;
    g.lineTo(qx(yf), qz(w - c));
    // material ainda não cortado: do ângulo full até 0 fica a quina
    for (let th = 90; th >= 0; th -= 2) { const tt = th > full ? th : full; const q = cvx(tt); g.lineTo(qx(yf + q.d), qz(q.z)); }
    if (full < 90) { g.lineTo(qx(yf), qz(cvx(full).z)); }
    g.lineTo(qx(yf), qz(w)); g.lineTo(qx(yf + c), qz(w));
  } else { // côncavo: face até W - C, cava até W
    const full = upTo == null ? 90 : upTo;
    g.lineTo(qx(yf), qz(w - c));
    for (let th = 90; th >= 0; th -= 2) { const q = ccv(th <= full ? th : full); const q2 = th <= full ? q : { d: ccv(full).d * (th / full || 0), z: ccv(full).z }; g.lineTo(qx(yf + (th <= full ? q.d : 0)), qz(th <= full ? q.z : w - c + (w - c - (w - c)) )); }
    g.lineTo(qx(yf + c), qz(w));
  }
  g.lineTo(qx(ymax), qz(w)); g.closePath();
  g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
}
function sectionCave(upTo) { // côncavo desenhado de forma simples: bloco menos o quarto de círculo cortado até upTo
  const yf = CC.Y, w = CC.W, c = CC.C, ymax = SV.y0 + 900 / SV.s, zb = w - c - 9;
  g.beginPath(); g.moveTo(qx(yf), qz(w)); g.lineTo(qx(ymax), qz(w)); g.lineTo(qx(ymax), qz(zb)); g.lineTo(qx(yf), qz(zb)); g.closePath();
  g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
  const full = upTo == null ? 90 : upTo;
  // região cortada: setor de 0 até full + tudo acima da linha Z do último passe
  g.beginPath(); g.moveTo(qx(yf), qz(w));
  for (let th = 0; th <= full; th += 1) { const q = ccv(th); g.lineTo(qx(yf + q.d), qz(q.z)); }
  g.lineTo(qx(yf), qz(ccv(full).z)); g.closePath(); g.fillStyle = '#071021'; g.fill();
  g.beginPath(); for (let th = 0; th <= full; th += 1) { const q = ccv(th); th ? g.lineTo(qx(yf + q.d), qz(q.z)) : g.moveTo(qx(yf + q.d), qz(q.z)); } g.strokeStyle = C.ok; g.lineWidth = 4; g.stroke();
}
function sideTool(yc, z, T, a) { // fresa em corte: canto do lado da peça em yc
  g.globalAlpha = a == null ? 1 : a;
  const x0 = qx(yc - T), x1 = qx(yc), yb = qz(z);
  g.fillStyle = 'rgba(245,165,36,.30)'; g.fillRect(x0, yb - 200, x1 - x0, 200); g.strokeStyle = C.tool; g.lineWidth = 4; g.strokeRect(x0, yb - 200, x1 - x0, 200);
  line((x0 + x1) / 2, yb - 220, (x0 + x1) / 2, yb + 10, C.tool, 2, [8, 8]);
  g.beginPath(); g.arc(x1, yb, 9, 0, 7); g.fillStyle = C.err; g.fill();
  g.globalAlpha = 1;
}
function arcGuide(kind, a) {
  g.globalAlpha = a; const p = kind === 'c' ? CC : A;
  g.beginPath(); for (let th = 0; th <= 90; th += 2) { const q = kind === 'c' ? ccv(th) : cvx(th); th ? g.lineTo(qx(p.Y + q.d), qz(q.z)) : g.moveTo(qx(p.Y + q.d), qz(q.z)); }
  g.strokeStyle = C.ok; g.lineWidth = 4; g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
}
function convexPart(upTo) {
  const yf = A.Y, w = A.W, c = A.C, ymax = SV.y0 + 900 / SV.s, zb = w - c - 9, full = upTo == null ? 90 : upTo;
  g.beginPath(); g.moveTo(qx(yf), qz(zb)); g.lineTo(qx(yf), qz(w)); g.lineTo(qx(ymax), qz(w)); g.lineTo(qx(ymax), qz(zb)); g.closePath();
  g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
  // material já tirado: entre a quina e o arco, acima do Z do passe
  g.beginPath(); g.moveTo(qx(yf), qz(w));
  for (let th = 0; th <= full; th += 1) { const q = cvx(th); g.lineTo(qx(yf + q.d), qz(q.z)); }
  g.lineTo(qx(yf), qz(cvx(full).z)); g.closePath(); g.fillStyle = '#071021'; g.fill();
  g.beginPath(); for (let th = 0; th <= full; th += 1) { const q = cvx(th); th ? g.lineTo(qx(yf + q.d), qz(q.z)) : g.moveTo(qx(yf + q.d), qz(q.z)); } g.strokeStyle = C.ok; g.lineWidth = 4; g.stroke();
}
function zTag(z, label, col) { line(qx(SV.y0), qz(z), qx(SV.y0 + 880 / SV.s), qz(z), col, 2, [10, 8]); text(label, qx(SV.y0) + 4, qz(z) - 10, 26, col, { w: 800, mono: true }); }

let this_hl = [11];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

/* 1. abertura */
sc('c1', { draw(t, T) {
  const th = clamp((t - .4) / (T - 1.4), 0, 1) * 89 + 1, q = cvx(th);
  convexPart(th); sideTool(A.Y + q.d, q.z, A.T, 1);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 860, 900, 360, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 950, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1050, 72, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1618', 540, 1150, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

/* 2. letras */
const LETV = [['X', '#24', A.X, 1], ['I', '#4', A.I, 1], ['Y', '#25', A.Y, 1], ['W', '#23', A.W, 1], ['C', '#3', A.C, 2], ['U', '#21', A.U, 2],
  ['V', '#22', A.V, 2], ['H', '#11', A.H, 3], ['T', '#20', A.T, 3], ['A', '#1', A.A, 3], ['R', '#18', A.R, 3], ['F', '#9', A.F, 3]];
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
      const hot = key && ['C', 'U', 'V', 'H', 'T'].indexOf(l[0]) >= 0;
      g.globalAlpha = a; card(x, y, 316, 146, hot ? 'rgba(60,207,142,.9)' : 'rgba(102,184,255,.4)'); g.globalAlpha = 1;
      text(l[0], x + 26, y + 92, 74, C.tool, { w: 900, mono: true, alpha: a });
      text(tr('c2.n' + l[0]), x + 104, y + 52, 25, C.txt, { alpha: a });
      text('= ' + gc(l[2]), x + 104, y + 96, 34, C.ok, { w: 700, mono: true, alpha: a });
      if (key) text('→ ' + l[1], x + 104, y + 132, 28, hot ? C.ok : C.cyan, { w: 800, mono: true, alpha: ease((t - at(4)) / .5) });
    });
  } });

/* 3. conferências e o lado */
sc('c3', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [9, 10] : t > at(1) ? [3] : [1, 2, 3, 4, 5, 6, 7];
    const rows = [['C ≤ 0', '171'], ['H ≤ 0', '172'], ['H ≥ 90', '173'], ['T ≤ 0', '174'], ['I ≤ 0', '175'], ['U ≠ 0 / 1', '176']];
    if (t < at(2)) rows.forEach((r, i) => { const a = ease((t - at(0) - .4 - i * .3) / .4); if (a <= 0) return; const y = 270 + i * 88, hot = t > at(1) && i === 2;
      g.globalAlpha = a; card(200, y, 680, 76, hot ? C.err : 'rgba(102,184,255,.35)'); g.globalAlpha = 1;
      text(r[0], 240, y + 50, 38, hot ? C.err : C.txt, { mono: true, w: 800, alpha: a }); text(tr('alarm') + ' ' + r[1], 840, y + 50, 34, C.err, { a: 'right', w: 800, alpha: a }); });
    else { const a = ease((t - at(2)) / .6); SV = { y0: -55, x0: 120, z0: 520, s: 12 }; convexPart(0); sideTool(A.Y + A.C, A.W + 6, A.T, a);
      arrow(qx(A.Y) - 10, qz(-14), qx(A.Y) + 200, qz(-14), C.ok, 5); text(tr('c3.mat'), qx(A.Y) + 220, qz(-14) + 10, 30, C.ok, { w: 800, alpha: a });
      text('V0 → #100 = 1', 540, 820, 40, C.cyan, { a: 'center', w: 800, mono: true, alpha: a }); SV = Object.assign({}, SV0); }
    if (t > at(1) && t < at(2)) formula(t, [[at(1) + .5, 'IF [' + gc(A.H) + ' GE 90] ? ' + tr('no'), C.ok]], 860, 120);
  } });

/* 4. pontas em X (vista de cima) */
const TP = { cx: 600, cy: 560, s: 2.4 };
const tpx = x => TP.cx + x * TP.s, tpy = y => TP.cy - y * TP.s;
function topView(a) {
  g.globalAlpha = a == null ? 1 : a;
  g.fillStyle = C.part; g.fillRect(tpx(A.X), tpy(A.Y + 60), A.I * TP.s, 60 * TP.s); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(tpx(A.X), tpy(A.Y + 60), A.I * TP.s, 60 * TP.s);
  line(tpx(A.X), tpy(A.Y), tpx(A.X + A.I), tpy(A.Y), C.ok, 6);
  g.globalAlpha = 1;
}
function topTool(x, y, col) { g.beginPath(); g.arc(tpx(x), tpy(y), A.T / 2 * TP.s, 0, 7); g.fillStyle = 'rgba(245,165,36,.22)'; g.fill(); g.strokeStyle = col || C.tool; g.lineWidth = 4; g.stroke(); g.beginPath(); g.arc(tpx(x), tpy(y), 5, 0, 7); g.fillStyle = col || C.tool; g.fill(); }
sc('c4', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [12] : [11];
    topView(1); text(tr('c4.edge'), tpx(A.X + A.I / 2), tpy(A.Y) + 44, 30, C.ok, { a: 'center', w: 800 });
    const a1 = ease((t - at(1)) / .6), a2 = ease((t - at(2)) / .6), yt = A.Y - A.T / 2;
    if (a1 > 0) { g.globalAlpha = a1; topTool(FX.x1, yt); dim(tpx(FX.x1), tpy(yt) + 90, tpx(A.X), tpy(yt) + 90, num(A.T / 2 + A.A), C.tool, [0, 44], 30); text('X' + gc(FX.x1), tpx(FX.x1), tpy(yt) - 80, 32, C.tool, { a: 'center', w: 800, mono: true }); g.globalAlpha = 1; }
    if (a2 > 0) { g.globalAlpha = a2; topTool(FX.x2, yt); dim(tpx(A.X + A.I), tpy(yt) + 90, tpx(FX.x2), tpy(yt) + 90, num(A.T / 2 + A.A), C.tool, [0, 44], 30); text('X' + gc(FX.x2), tpx(FX.x2), tpy(yt) - 80, 32, C.tool, { a: 'center', w: 800, mono: true }); g.globalAlpha = 1; }
    formula(t, [[at(1) + .2, '#101 = ' + gc(A.X) + ' - ' + gc(A.T / 2) + ' - ' + gc(A.A) + ' = ' + gc(FX.x1), C.tool], [at(2) + .2, '#102 = ' + gc(A.X) + ' + ' + gc(A.I) + ' + ' + gc(A.T / 2) + ' + ' + gc(A.A) + ' = ' + gc(FX.x2), C.ok]], 860, 170);
  } });

/* 5. a ideia: a quina segue a curva, θ avança H */
sc('c5', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [13] : [18];
    convexPart(0); arcGuide('v', 1);
    const cx = qx(A.Y + A.C), cz = qz(A.W - A.C);
    g.beginPath(); g.arc(cx, cz, 7, 0, 7); g.fillStyle = C.cyan; g.fill(); text(tr('c5.ctr'), cx + 14, cz + 34, 26, C.cyan, { w: 700 });
    const th = t > at(1) ? clamp((t - at(1)) / 4, 0, 1) * 60 : 0, q = cvx(th);
    if (t > at(1)) { line(cx, cz, qx(A.Y + q.d), qz(q.z), C.cyan, 3); g.beginPath(); g.arc(cx, cz, 60, -Math.PI / 2, -Math.PI / 2 - th * Math.PI / 180, true); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
      text('θ = ' + num(Math.round(th)) + '°', cx - 20, cz - 80, 32, C.tool, { a: 'right', w: 800 }); sideTool(A.Y + q.d, q.z, A.T, .8); }
    formula(t, [[at(2) + .2, '#103 = #11 = ' + gc(A.H) + '°', C.tool], [at(3) + .2, gc(A.H) + '°, ' + gc(2 * A.H) + '°, ' + gc(3 * A.H) + '° ... ' + tr('c5.lt90'), C.ok]], 800, 170);
  } });

/* 6. convexo: as duas contas */
sc('c6', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [20] : [19];
    const th = t > at(3) ? 60 : 30, q = cvx(th);
    convexPart(th); arcGuide('v', .5); sideTool(A.Y + q.d, q.z, A.T, 1);
    const a1 = ease((t - at(1)) / .6);
    if (a1 > 0) { g.globalAlpha = a1; dim(qx(A.Y), qz(A.W) - 30, qx(A.Y + q.d), qz(A.W) - 30, '#104 = ' + num(r3(q.d)), C.cyan, [0, -14], 30);
      if (t > at(2)) dim(qx(A.Y + A.C) + 40, qz(A.W), qx(A.Y + A.C) + 40, qz(q.z), '#106 = ' + num(r3(q.z)), C.tool, [130, 10], 30); g.globalAlpha = 1; }
    formula(t, [[at(0) + .3, '#104 = #3 - #3 * SIN[#103]'], [at(1) + .3, '#104 = ' + gc(A.C) + ' - ' + gc(A.C) + ' * SIN[30] = ' + gc(FX.d30), C.tool],
      [at(2) + .3, '#106 = ' + gc(A.W) + ' - ' + gc(A.C) + ' + ' + gc(A.C) + ' * COS[30] = ' + gc(FX.z30), C.tool], [at(3) + .3, 'θ = 60° → #104 = ' + gc(FX.d60) + '   #106 = ' + gc(FX.z60), C.ok]], 790, 300);
  } });

/* 7. o Y do centro da fresa e a linha */
sc('c7', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [25] : [24];
    const q = cvx(30); convexPart(30); arcGuide('v', .4); sideTool(A.Y + q.d, q.z, A.T, 1);
    const yc = A.Y + q.d - A.T / 2, a1 = ease((t - at(1)) / .6);
    if (a1 > 0) { g.globalAlpha = a1; dim(qx(yc), qz(q.z) + 50, qx(A.Y + q.d), qz(q.z) + 50, 'T/2 = ' + num(A.T / 2), C.tool, [0, 44], 30);
      g.beginPath(); g.arc(qx(yc), qz(q.z), 8, 0, 7); g.fillStyle = C.cyan; g.fill(); text('Y' + gc(yc), qx(yc), qz(q.z) + 140, 34, C.cyan, { a: 'center', w: 800, mono: true }); g.globalAlpha = 1; }
    formula(t, [[at(0) + .3, '#105 = #25 + #100 * [#104 - #20 / 2]'], [at(1) + .3, '#105 = ' + gc(A.Y) + ' + 1 * [' + gc(FX.d30) + ' - ' + gc(A.T / 2) + '] = ' + gc(FX.y30), C.tool],
      [at(2) + .3, 'G1 Y' + gc(FX.y30) + ' Z' + gc(FX.z30), C.ok]], 800, 230);
  } });

/* 8. vai e volta em X */
sc('c8', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [27, 28, 29] : [26];
    topView(1);
    const k = Math.floor(clamp((t - .5) / (T - 1), 0, .999) * 6), u = ((t - .5) / (T - 1) * 6) % 1, yt = A.Y - A.T / 2 - 4 + k * .8;
    for (let j = 0; j < k; j++) line(tpx(FX.x1), tpy(A.Y - A.T / 2 - 4 + j * .8), tpx(FX.x2), tpy(A.Y - A.T / 2 - 4 + j * .8), 'rgba(245,165,36,.35)', 3);
    const from = k % 2 ? FX.x2 : FX.x1, to = k % 2 ? FX.x1 : FX.x2, x = lerp(from, to, ease(clamp(u, 0, 1)));
    topTool(x, yt);
    chip(290, 860, '#107', gc(from), C.cyan, 1); chip(790, 860, '#108', gc(to), C.ok, 1);
    formula(t, [[at(1) + .3, '#109 = #107   #107 = #108   #108 = #109', C.tool]], 940, 120);
  } });

/* 9. côncavo */
sc('c9', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [22, 23] : [18];
    SV = { y0: -35, x0: 120, z0: 470, s: 13 };
    const th = t > at(2) ? 30 : 0, q = ccv(th);
    sectionCave(th); arcGuide('c', .6);
    g.beginPath(); g.arc(qx(CC.Y), qz(CC.W), 7, 0, 7); g.fillStyle = C.cyan; g.fill(); text(tr('c9.ctr'), qx(CC.Y) - 12, qz(CC.W) - 18, 26, C.cyan, { a: 'right', w: 700 });
    if (t > at(1)) sideTool(CC.Y + q.d, q.z, CC.T, 1);
    const a3 = ease((t - at(3)) / .6);
    if (a3 > 0) { g.globalAlpha = a3; dim(qx(CC.Y), qz(CC.W) - 30, qx(CC.Y + q.d), qz(CC.W) - 30, num(FX.cd30), C.cyan, [0, -14], 30); g.globalAlpha = 1; }
    SV = Object.assign({}, SV0);
    formula(t, [[at(1) + .3, 'U1 → N20', C.tool], [at(2) + .3, '#104 = #3 * COS[#103]   #106 = #23 - #3 * SIN[#103]'],
      [at(3) + .3, 'C' + gc(CC.C) + ', 30° → #104 = ' + gc(FX.cd30) + '   #106 = ' + gc(FX.cz30), C.ok]], 800, 230);
  } });

/* 10. o laço */
sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 23 }),
  draw(t, T, at) {
    const f = clamp((t - at(0)) / (at(2) - at(0)), 0, 1), th = Math.max(1, Math.min(89, Math.round(f * 89))), q = cvx(th);
    this_hl = t > at(2) ? [31, 32, 33] : [30, 31];
    convexPart(th); arcGuide('v', .3); sideTool(A.Y + q.d, q.z, A.T, 1);
    chip(290, 790, '#103', th + '°', C.ok, 1); chip(790, 790, tr('c10.pass'), th + ' / ' + FX.n, C.cyan, 1);
    const last = th >= 89 && t > at(2) - .5;
    text('IF [' + (th + 1) + ' LT 90] → ' + (last ? tr('no') + ' → G0 Z' + gc(A.W + A.R) : tr('yes') + ' → N10'), 540, 900, 36, last ? C.ok : C.txt, { a: 'center', w: 800, mono: true });
    const a3 = ease((t - at(3)) / .6);
    if (a3 > 0) { g.globalAlpha = a3; card(140, 940, 800, 120, 'rgba(245,165,36,.6)'); g.globalAlpha = 1; text(tr('c10.step'), 540, 1012, 34, C.tool, { a: 'center', w: 800, alpha: a3 }); }
  } });

/* 11. resumo */
sc('c11', { draw(t, T, at) {
  const res = [['#101 / #102', tr('c11.r1')], ['#103 + H', tr('c11.r2')], ['C - C·SIN θ', tr('c11.r3')], ['C·COS θ', tr('c11.r4')], ['#105', tr('c11.r5')], ['#107 ↔ #108', tr('c11.r6')]];
  res.forEach((r, i) => { const a = ease((t - .3 - i * .5) / .4); if (a <= 0) return;
    const y = 260 + i * 108; g.globalAlpha = a; card(70, y, 940, 94, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text(r[0], 100, y + 58, 32, C.tool, { mono: true, w: 700, alpha: a }); text(r[1], 980, y + 58, 32, C.txt, { a: 'right', w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 930, 940, 220, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c11.first'), 110, 1000, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1618 ... W50. ...', 110, 1065, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c11.air'), 110, 1120, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1190, 940, 190, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c11.sim'), 540, 1265, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c11.path'), 540, 1335, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
