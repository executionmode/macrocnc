/* Vídeo: macro de furos em círculo PCD O1612 — cenas (foco nas contas da macro).
 * Textos em m/pcd.<idioma>.js, números em m/facts_pcd.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args;
const HOLES = RAW.segs.filter(s => s[0] === 'h').map(s => ({ x: s[1], y: s[2] }));
const RAD = A.J / 2, STEP = 360 / A.B, NH = HOLES.length;
const ang = n => A.A + (n - 1) * STEP;
const gc = n => (Math.round(n * 1000) / 1000).toString();          // número em formato de código (ponto)
const r2 = (v, d) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
const COS = d => Math.cos(d * Math.PI / 180), SIN = d => Math.sin(d * Math.PI / 180);
Object.assign(FX, {
  X: A.X, Y: A.Y, J: A.J, B: A.B, A: A.A, H: A.H, W: A.W, Z: A.Z, R: A.R, Q: A.Q, F: A.F,
  r: RAD, step: STEP, a2: ang(2), a3: ang(3), a4: ang(4), alast: ang(A.B), safe: A.W + A.R,
  cos1: r2(COS(ang(1)), 3), sin1: r2(SIN(ang(1)), 3), cos4: r2(COS(ang(4)), 3),
  x1: r2(HOLES[0].x, 2), y1: r2(HOLES[0].y, 2), x1c: gc(HOLES[0].x), y1c: gc(HOLES[0].y), x4: r2(HOLES[3].x, 2), n: NH,
  g65a: RAW.g65.split(' ').slice(0, 7).join(' '), g65b: RAW.g65.split(' ').slice(7).join(' ')
});
const MAC = ['O1612 ;', 'IF [#2 LT 1] THEN #3000 = 111 ;', '#27 = #5 / 2 ;', '#28 = 360 / #2 ;', '#29 = 1 ;',
  'N10 #30 = #1 + [#29 - 1] * #28 ;', '#31 = #24 + #27 * COS[#30] ;', '#32 = #25 + #27 * SIN[#30] ;',
  'IF [#11 GE 2] GOTO 30 ;', 'IF [#11 GE 1] GOTO 20 ;', 'IF [#17 GT 0] GOTO 15 ;',
  'G99 G81 X#31 Y#32 Z#26 R[#23 + #18] F#9 ;', 'GOTO 40 ;', 'N15 G99 G83 X#31 Y#32 Z#26 R[#23 + #18] Q#17 F#9 ;', 'GOTO 40 ;',
  'N20 G65 P1613 X#31 Y#32 D#7 T#20 W#23 Z#26 K#6 R#18 F#9 ;', 'GOTO 40 ;',
  'N30 G65 P1619 X#31 Y#32 D#7 I#4 T#20 W#23 Z#26 R#18 F#9 Q#17 E#8 ;',
  'N40 IF [#29 GE #2] GOTO 50 ;', '#29 = #29 + 1 ;', 'GOTO 10 ;', 'N50 G80 ;', 'G98 ;', 'M99 ;'];
const MAIN = ['%', 'O0012 (' + tr('mainComment') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T11 ;', 'M6 ;', 'G0 X0 Y0 ;', 'S800 M3 ;', 'G43 H11 Z120. ;', 'M8 ;',
  FX.g65a, '    ' + FX.g65b + ' ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];

/* ---------- vista de cima do círculo ---------- */
const PV = { cx: 540, cy: 545, s: 1.3 };
const px = x => PV.cx + x * PV.s, py = y => PV.cy - y * PV.s;
function plate(a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(PV.cx, PV.cy, (RAD + 25) * PV.s, 0, 7); g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
  g.globalAlpha = 1;
  line(px(-10), py(0), px(10), py(0), C.mut, 2); line(px(0), py(-10), px(0), py(10), C.mut, 2);
}
function pcdCircle(a, r) { g.globalAlpha = a == null ? 1 : a; g.beginPath(); g.arc(PV.cx, PV.cy, (r || RAD) * PV.s, 0, 7); g.strokeStyle = C.cyan; g.lineWidth = 2.5; g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
function holeAt(x, y, st, col) {
  g.beginPath(); g.arc(px(x), py(y), 14, 0, 7);
  if (st >= 1) { g.fillStyle = '#03070f'; g.fill(); g.strokeStyle = col || C.ok; g.lineWidth = 3; g.stroke(); }
  else { g.strokeStyle = col || 'rgba(143,163,189,.55)'; g.lineWidth = 2.5; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]); }
}
const hole = (i, st, col) => holeAt(HOLES[i].x, HOLES[i].y, st, col);
function holeNum(i, a, col) { const h = HOLES[i], k = 1.13; text(String(i + 1), px(h.x * k), py(h.y * k) + 11, 28, col || C.mut, { a: 'center', w: 800, alpha: a }); }
function drill(x, y, a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(px(x), py(y), 19, 0, 7); g.fillStyle = 'rgba(245,165,36,.25)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(px(x), py(y), 5, 0, 7); g.fillStyle = C.tool; g.fill(); g.globalAlpha = 1;
}
function angArc(a0, a1, r, color, label, lr) {
  g.beginPath(); g.arc(PV.cx, PV.cy, r, -a0 * Math.PI / 180, -a1 * Math.PI / 180, a1 > a0); g.strokeStyle = color; g.lineWidth = 5; g.stroke();
  if (label) { const m = (a0 + a1) / 2 * Math.PI / 180, rr2 = r + (lr || 46); text(label, PV.cx + rr2 * Math.cos(m), PV.cy - rr2 * Math.sin(m) + 12, 32, color, { a: 'center', w: 800 }); }
}
const toXY = d => ({ x: RAD * COS(d), y: RAD * SIN(d) });
function xAxis() { line(PV.cx, PV.cy, PV.cx + (RAD + 40) * PV.s, PV.cy, C.mut, 2, [10, 8]); text('X+', PV.cx + (RAD + 40) * PV.s, PV.cy - 14, 26, C.mut, { a: 'right', w: 800 }); }

/* ---------- quadro de contas: cada passo aparece no tempo da fala ---------- */
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

let this_hl = [5];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

/* 1. abertura */
sc('c1', { draw(t, T) {
  plate(.9); pcdCircle(ease(t / 1));
  const n = Math.floor(clamp((t - .6) / (T * .75), 0, 1) * NH);
  HOLES.forEach((h, i) => hole(i, i < n ? 1 : 0));
  if (n < NH) drill(HOLES[n].x, HOLES[n].y);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 900, 900, 360, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 990, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1090, tr('c1.k2').length > 14 ? 76 : 92, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1612', 540, 1190, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

/* 2. programa principal: passagem rápida pelas letras */
const LETV = [['X', '#24', A.X, 1], ['Y', '#25', A.Y, 1], ['J', '#5', A.J, 1], ['B', '#2', A.B, 1], ['A', '#1', A.A, 1], ['H', '#11', A.H, 2],
  ['W', '#23', A.W, 2], ['Z', '#26', A.Z, 2], ['R', '#18', A.R, 2], ['Q', '#17', A.Q, 2], ['F', '#9', A.F, 2]];
sc('c2', { code: () => ({ lines: MAIN, hl: [10, 11], title: tr('mainTitle'), n: 9 }),
  draw(t, T, at) {
    const a0 = ease((t - .2) / .6);
    g.globalAlpha = a0; card(50, 250, 980, 150, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(FX.g65a, 540, 315, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    text(FX.g65b, 540, 370, 40, C.tool, { a: 'center', w: 700, mono: true, alpha: a0 });
    const key = t > at(3);
    LETV.forEach((l, i) => {
      const a = ease((t - at(l[3]) - (i % 6) * .18) / .5); if (a <= 0) return;
      const col = i % 3, row = Math.floor(i / 3), x = 50 + col * 332, y = 430 + row * 162;
      const hot = key && ['J', 'B', 'A'].indexOf(l[0]) >= 0;
      g.globalAlpha = a; card(x, y, 316, 146, hot ? 'rgba(60,207,142,.9)' : 'rgba(102,184,255,.4)'); g.globalAlpha = 1;
      text(l[0], x + 26, y + 92, 74, C.tool, { w: 900, mono: true, alpha: a });
      text(tr('c2.n' + l[0]), x + 104, y + 52, 25, C.txt, { alpha: a });
      text('= ' + gc(l[2]), x + 104, y + 96, 34, C.ok, { w: 700, mono: true, alpha: a });
      if (key) text('→ ' + l[1], x + 104, y + 132, 28, hot ? C.ok : C.cyan, { w: 800, mono: true, alpha: ease((t - at(3)) / .5) });
    });
  } });

/* 3. conferência */
sc('c3', { code: () => ({ lines: MAC, hl: [1] }),
  draw(t, T, at) {
    plate(.5); pcdCircle(.5); HOLES.forEach((h, i) => hole(i, 0));
    formula(t, [[at(0) + .3, 'IF [#2 LT 1] THEN #3000 = 111'], [at(1) + .4, 'IF [' + gc(A.B) + ' LT 1] ?', C.tool], [at(2), tr('c3.no'), C.ok]], 850);
    const a1 = ease((t - at(1) - 1) / .6);
    if (a1 > 0 && t < at(2)) { g.globalAlpha = a1; card(240, 470, 600, 150, 'rgba(255,107,107,.7)'); g.globalAlpha = 1;
      text('B < 1 → ' + tr('c3.alm'), 540, 562, 44, C.err, { a: 'center', w: 800, alpha: a1 }); }
  } });

/* 4. raio */
sc('c4', { code: () => ({ lines: MAC, hl: [2] }),
  draw(t, T, at) {
    plate(); pcdCircle(); HOLES.forEach((h, i) => hole(i, 0));
    const a1 = ease((t - at(1)) / .8), a2 = ease((t - at(2)) / .9), a3 = ease((t - at(3)) / .7);
    if (a1 > 0) { g.globalAlpha = a1; dim(px(-RAD), PV.cy + 40, px(RAD), PV.cy + 40, 'J = Ø' + gc(A.J), C.txt, [0, 52], 40); g.globalAlpha = 1; }
    if (a2 > 0) { line(PV.cx, PV.cy - 30, PV.cx + RAD * PV.s * a2, PV.cy - 30, C.ok, 7); text(num(RAD), PV.cx + RAD * PV.s / 2, PV.cy - 50, 44, C.ok, { a: 'center', w: 800, alpha: a2 }); }
    if (a3 > 0) { g.globalAlpha = a3; g.beginPath(); g.arc(PV.cx, PV.cy, RAD / 2 * PV.s, 0, 7); g.strokeStyle = C.err; g.lineWidth = 4; g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      text(tr('c4.warn'), 540, 300, 36, C.err, { a: 'center', w: 800, alpha: a3 }); }
    formula(t, [[at(0) + .4, '#27 = #5 / 2'], [at(1) + .6, '#27 = ' + gc(A.J) + ' / 2', C.tool], [at(2) + .2, '#27 = ' + gc(RAD), C.ok]], 850);
  } });

/* 5. ângulo entre furos */
sc('c5', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(3) ? [4] : [3];
    plate(); pcdCircle();
    const a1 = ease((t - at(1)) / 1.4), a2 = ease((t - at(2)) / 1.2);
    if (a1 > 0) { angArc(0, 360 * a1 - .01, 90, C.cyan, a1 > .9 ? '360°' : '', -150); }
    if (a2 > 0) for (let k = 0; k < NH; k++) { if (k / NH > a2) break; const p = toXY(ang(k + 1)); line(PV.cx, PV.cy, px(p.x), py(p.y), 'rgba(102,184,255,.45)', 2); }
    HOLES.forEach((h, i) => hole(i, 0));
    if (a2 >= 1) angArc(ang(1), ang(2), 170, C.tool, num(STEP) + '°');
    const a3 = ease((t - at(3)) / .6);
    if (a3 > 0) { hole(0, 0, C.ok); holeNum(0, a3, C.ok); }
    formula(t, [[at(1) + .5, '#28 = 360 / #2'], [at(2), '#28 = 360 / ' + gc(A.B), C.tool], [at(2) + 1.6, '#28 = ' + gc(STEP), C.ok], [at(3) + .3, '#29 = 1   (' + tr('c5.cnt') + ')', C.cyan]], 850);
  } });

/* 6. N10: ângulo de cada furo */
sc('c6', { code: () => ({ lines: MAC, hl: [5] }),
  draw(t, T, at) {
    plate(); pcdCircle(); xAxis();
    HOLES.forEach((h, i) => hole(i, 0));
    const k = t > at(4) ? 3 : t > at(3) ? 2 : t > at(2) ? 1 : 0;
    if (k > 0) { const d = ang(k), p = toXY(d), a = ease((t - at(k + 1)) / .8);
      line(PV.cx, PV.cy, px(p.x), py(p.y), C.cyan, 4); angArc(0, d * a, 100 + k * 26, C.tool, a > .8 ? num(d) + '°' : '');
      for (let j = 0; j < k; j++) { hole(j, 0, C.ok); holeNum(j, 1, C.cyan); } }
    if (t > at(4) + 1) { g.beginPath(); g.arc(PV.cx, PV.cy, 230, -.12, -1.0, true); g.strokeStyle = C.ok; g.lineWidth = 5; g.stroke();
      arrowHead(PV.cx + 230 * Math.cos(-.9), PV.cy + 230 * Math.sin(-.9), PV.cx + 230 * Math.cos(-1.0), PV.cy + 230 * Math.sin(-1.0), C.ok, 22); }
    const f = (n) => '#30 = ' + gc(A.A) + ' + [' + n + ' - 1] * ' + gc(STEP);
    formula(t, [[at(0) + .4, '#30 = #1 + [#29 - 1] * #28'], [at(2) + .3, f(1), C.tool], [at(2) + 2.6, '#30 = ' + gc(A.A) + ' + 0 = ' + gc(ang(1)), C.ok],
      [at(3) + .3, f(2), C.tool], [at(3) + 2.4, '#30 = ' + gc(ang(2)), C.ok], [at(4) + .3, f(3) + ' = ' + gc(ang(3)), C.ok]], 850);
  } });

/* 7–8. triângulo: X com cosseno, Y com seno */
const TRI = { ox: 150, oy: 780, k: 4.1 };
function triangle(t, at, showX, showY, labelEnd) {
  const d = ang(1), hx = RAD * COS(d), hy = RAD * SIN(d), ex = TRI.ox + hx * TRI.k, ey = TRI.oy - hy * TRI.k;
  text(tr('tri.c'), TRI.ox, TRI.oy + 50, 28, C.mut, { a: 'center', w: 700 });
  g.beginPath(); g.arc(TRI.ox, TRI.oy, 9, 0, 7); g.fillStyle = C.mut; g.fill();
  line(TRI.ox, TRI.oy, TRI.ox + RAD * TRI.k + 40, TRI.oy, C.mut, 2, [10, 8]); text('X+', TRI.ox + RAD * TRI.k + 40, TRI.oy - 14, 26, C.mut, { a: 'right', w: 800 });
  line(TRI.ox, TRI.oy, ex, ey, C.cyan, 6);
  text(tr('tri.r') + ' ' + num(RAD), (TRI.ox + ex) / 2 - 30, (TRI.oy + ey) / 2 - 30, 36, C.cyan, { a: 'center', w: 800 });
  g.beginPath(); g.arc(TRI.ox, TRI.oy, 190, 0, -d * Math.PI / 180, true); g.strokeStyle = C.tool; g.lineWidth = 5; g.stroke();
  text(num(d) + '°', TRI.ox + 245, TRI.oy - 22, 34, C.tool, { a: 'center', w: 800 });
  g.beginPath(); g.arc(ex, ey, 16, 0, 7); g.fillStyle = '#03070f'; g.fill(); g.strokeStyle = C.ok; g.lineWidth = 3; g.stroke();
  if (showX > 0) { line(TRI.ox, TRI.oy + 6, TRI.ox + hx * TRI.k * showX, TRI.oy + 6, C.ok, 9);
    text('X = ' + num(FX.x1), TRI.ox + hx * TRI.k / 2, TRI.oy + 60, 38, C.ok, { a: 'center', w: 800, alpha: showX }); }
  if (showY > 0) { line(ex, TRI.oy, ex, TRI.oy - hy * TRI.k * showY, C.tool, 9);
    text('Y = ' + num(FX.y1), ex - 20, TRI.oy - hy * TRI.k / 2 + 12, 38, C.tool, { a: 'right', w: 800, alpha: showY }); }
  if (labelEnd > 0) text(tr('tri.h1') + ': X' + FX.x1c + ' Y' + FX.y1c, 540, ey - 60, 38, C.txt, { a: 'center', w: 800, mono: true, alpha: labelEnd });
}
sc('c7', { code: () => ({ lines: MAC, hl: [6] }),
  draw(t, T, at) {
    const a1 = ease((t - at(1) - 1.5) / 1.5);
    triangle(t, at, a1, 0, 0);
    if (t > at(1) && a1 < 1) { text(tr('c7.lay'), 540, 330, 34, C.ok, { a: 'center', w: 800 }); }
    formula(t, [[at(0) + .5, '#31 = #24 + #27 * COS[#30]'], [at(1) + .6, '#31 = ' + gc(A.X) + ' + ' + gc(RAD) + ' * COS[' + gc(ang(1)) + ']', C.tool],
      [at(2) + .4, '#31 = ' + gc(A.X) + ' + ' + gc(RAD) + ' * ' + r2(COS(ang(1)), 5), C.tool], [at(3) + .2, '#31 = ' + FX.x1c, C.ok]], 870);
  } });
sc('c8', { code: () => ({ lines: MAC, hl: [7] }),
  draw(t, T, at) {
    const a1 = ease((t - at(0) - 1.5) / 1.5);
    triangle(t, at, 1, a1, ease((t - at(2) - 1.5) / .6));
    formula(t, [[at(0) + .5, '#32 = #25 + #27 * SIN[#30]'], [at(1) + .2, '#32 = ' + gc(A.Y) + ' + ' + gc(RAD) + ' * ' + r2(SIN(ang(1)), 5), C.tool], [at(2) + .2, '#32 = ' + FX.y1c, C.ok]], 870);
  } });

/* 9. sinal automático (furo 4) */
sc('c9', { code: () => ({ lines: MAC, hl: [6, 7] }),
  draw(t, T, at) {
    plate(); pcdCircle(); xAxis(); line(PV.cx, PV.cy - (RAD + 30) * PV.s, PV.cx, PV.cy + (RAD + 30) * PV.s, C.mut, 2, [10, 8]);
    const qa = ease((t - at(2)) / .6);
    [['X+  Y+', 1, -1], ['X−  Y+', -1, -1], ['X−  Y−', -1, 1], ['X+  Y−', 1, 1]].forEach(q => text(q[0], PV.cx + q[1] * 150, PV.cy + q[2] * 110 + 12, 30, C.cyan, { a: 'center', w: 800, alpha: qa }));
    HOLES.forEach((h, i) => hole(i, 0));
    const h4 = HOLES[3], a1 = ease((t - at(0) - .5) / .8), a2 = ease((t - at(1) - .5) / .9);
    if (a1 > 0) { const p = toXY(ang(4)); line(PV.cx, PV.cy, px(p.x * a1), py(p.y * a1), C.tool, 5); angArc(0, ang(4) * a1, 80, C.tool, a1 > .9 ? num(ang(4)) + '°' : '', 60); hole(3, 0, C.tool); holeNum(3, a1, C.tool); }
    if (a2 > 0) { line(PV.cx, PV.cy + 5, PV.cx + (px(h4.x) - PV.cx) * a2, PV.cy + 5, C.err, 8); text('X = ' + num(FX.x4), (PV.cx + px(h4.x)) / 2, PV.cy + 50, 34, C.err, { a: 'center', w: 800, alpha: a2 }); }
    formula(t, [[at(1) + .3, 'COS[' + gc(ang(4)) + '] = ' + r2(COS(ang(4)), 5), C.tool], [at(1) + 2.2, '#31 = 0 + ' + gc(RAD) + ' * ' + r2(COS(ang(4)), 5) + ' = ' + gc(HOLES[3].x), C.err]], 870, 170);
  } });

/* 10. operação e a linha que a máquina executa */
const OPS = [['H0', 'c10.o0', C.ok], ['H1', 'c10.o1', C.cyan], ['H2', 'c10.o2', C.tool]];
const SV = { x: 540, top: 760, zs: 7 }, RP = A.W + A.R, sz = z => SV.top - z * SV.zs;
const PECKS = (() => { const p = []; let z = RP; while (z > A.Z + 1e-9) { z = Math.max(z - A.Q, A.Z); p.push(z); } return p; })();
sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 7 }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [10, 13] : [8, 9];
    if (t < at(2)) {
      OPS.forEach((o, i) => { const a = ease((t - at(0) - .4 - i * .9) / .5); if (a <= 0) return; const y = 270 + i * 175, on = t > at(1) && i === 0;
        g.globalAlpha = a * (t > at(1) && !on ? .4 : 1); card(70, y, 940, 155, o[2]); g.globalAlpha = 1;
        text(o[0], 120, y + 100, 72, o[2], { w: 900, mono: true, alpha: a }); text(tr(o[1]), 290, y + 92, 38, C.txt, { w: 700, alpha: a }); });
      const a2 = ease((t - at(1)) / .6);
      if (a2 > 0) { g.globalAlpha = a2; card(70, 830, 940, 130, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
        text('Q = ' + gc(A.Q) + ' > 0  →  N15  G83', 540, 912, 44, C.tool, { a: 'center', w: 800, mono: true, alpha: a2 }); }
      return;
    }
    // linha com variáveis -> linha com números
    const a3 = ease((t - at(2) - .2) / .6), a4 = ease((t - at(2) - 2.2) / .8);
    card(50, 250, 980, 250, 'rgba(245,165,36,.6)');
    g.font = '700 40px ' + M; const L1 = 'G99 G83 X#31 Y#32 Z#26 R[#23 + #18] Q#17 F#9', L2 = 'G99 G83 X' + FX.x1c + ' Y' + FX.y1c + ' Z' + gc(A.Z) + ' R' + gc(RP) + ' Q' + gc(A.Q) + ' F' + gc(A.F);
    const fit = s => { g.font = '700 40px ' + M; const w = g.measureText(s).width; return w > 900 ? Math.floor(40 * 900 / w) : 40; };
    text(L1, 90, 320, fit(L1), '#8fa3bd', { mono: true, w: 700, alpha: a3 });
    text('↓', 540, 390, 40, C.tool, { a: 'center', w: 900, alpha: a4 });
    text(L2, 90, 460, fit(L2), '#ffffff', { mono: true, w: 800, alpha: a4 });
    text('R = ' + gc(A.W) + ' + ' + gc(A.R) + ' = ' + gc(RP), 540, 560, 36, C.cyan, { a: 'center', w: 800, mono: true, alpha: a4 });
    // vista de lado: bicadas
    const f = clamp((t - at(3) - .3) / (T - at(3) - 1), 0, 1), n = PECKS.length, seg = f * n, k = Math.min(Math.floor(seg), n - 1), u = seg - k;
    let zt, deep;
    if (f <= 0) { zt = RP; deep = A.W; } else if (f >= 1) { zt = RP; deep = A.Z; }
    else if (u < .6) { zt = lerp(k > 0 ? PECKS[k - 1] + 1 : RP, PECKS[k], ease(u / .6)); deep = Math.min(k > 0 ? PECKS[k - 1] : A.W, zt); }
    else { zt = lerp(PECKS[k], RP, ease((u - .6) / .4)); deep = PECKS[k]; }
    g.fillStyle = C.part; g.fillRect(260, sz(A.W), 560, sz(A.Z - 6) - sz(A.W)); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(260, sz(A.W), 560, sz(A.Z - 6) - sz(A.W));
    if (deep < A.W) { g.fillStyle = '#03070f'; g.fillRect(SV.x - 18, sz(A.W) - 2, 36, sz(deep) - sz(A.W) + 2); }
    line(220, sz(RP), 860, sz(RP), C.cyan, 3, [14, 10]); text('R' + gc(RP), 210, sz(RP) + 10, 28, C.cyan, { a: 'right', w: 800, mono: true });
    line(220, sz(A.Z), 860, sz(A.Z), C.ok, 3); text('Z' + gc(A.Z), 210, sz(A.Z) + 10, 28, C.ok, { a: 'right', w: 800, mono: true });
    g.fillStyle = 'rgba(245,165,36,.9)'; g.beginPath(); g.moveTo(SV.x - 18, sz(zt) - 120); g.lineTo(SV.x + 18, sz(zt) - 120); g.lineTo(SV.x + 18, sz(zt) - 18); g.lineTo(SV.x, sz(zt)); g.lineTo(SV.x - 18, sz(zt) - 18); g.closePath(); g.fill();
    g.fillStyle = '#7d8ea8'; g.fillRect(SV.x - 28, sz(zt) - 170, 56, 50);
    if (f > 0) text('Q' + gc(A.Q) + ' · ' + tr('c10.peck', { a: Math.min(k + 1, n), b: n }), 860, sz(-12), 30, C.tool, { a: 'right', w: 800 });
  } });

/* 11. N40: o laço */
sc('c11', { code: () => ({ lines: MAC, hl: this_hl, first: 15 }),
  draw(t, T, at) {
    plate(); pcdCircle();
    let cur, u = 0;
    if (t < at(1)) cur = 0; else if (t < at(2)) cur = 1; else if (t < at(3)) { const f = clamp((t - at(2)) / (at(3) - at(2) - .3), 0, 1); const nf = 1 + f * (NH - 2); cur = Math.floor(nf); u = nf - cur; } else cur = NH - 1;
    HOLES.forEach((h, i) => hole(i, i < cur || (t > at(3)) ? 1 : 0));
    HOLES.forEach((h, i) => { if (i <= cur) holeNum(i, 1, i === cur ? C.tool : C.mut); });
    let pos = HOLES[cur]; if (u < .3 && cur > 0 && t > at(2) && t < at(3)) { const a = HOLES[cur - 1], b = HOLES[cur], e = ease(u / .3); pos = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) }; }
    drill(pos.x, pos.y);
    this_hl = t > at(3) ? [18] : (t > at(1) && (t < at(2) || u < .3) ? [19, 20] : [18]);
    const c = cur + 1, lastQ = t > at(3);
    chip(290, 880, '#29', String(c), C.ok, 1); chip(790, 880, '#30', gc(ang(c)), C.tool, 1);
    chip(290, 960, 'X', gc(HOLES[cur].x), C.cyan, 1); chip(790, 960, 'Y', gc(HOLES[cur].y), C.cyan, 1);
    const q = 'IF [' + c + ' GE ' + gc(A.B) + '] → ' + (lastQ ? tr('yes') + ' → N50' : tr('no') + ' → #29 = ' + (c + 1));
    text(q, 540, 1050, 38, lastQ ? C.ok : C.txt, { a: 'center', w: 800, mono: true });
  } });

/* 12. fim */
sc('c12', { code: () => ({ lines: MAC, hl: this_hl, first: 15 }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [22, 23] : [21];
    const rows = [['G80', tr('c12.g80'), C.err], ['G98', tr('c12.g98'), C.cyan], ['M99', tr('c12.m99'), C.ok]];
    rows.forEach((r, i) => { const a = ease((t - (i === 0 ? at(0) + .3 : at(1) + (i - 1) * 1.2)) / .6); if (a <= 0) return;
      const y = 300 + i * 230; g.globalAlpha = a; card(70, y, 940, 200, r[2]); g.globalAlpha = 1;
      text(r[0], 120, y + 125, 84, r[2], { w: 900, mono: true, alpha: a });
      r[1].split('\n').forEach((l, j) => text(l, 360, y + 90 + j * 52, 38, C.txt, { w: 600, alpha: a })); });
  } });

/* 13. resumo */
sc('c13', { draw(t, T, at) {
  const res = [['#27 = #5 / 2', tr('c13.r1')], ['#28 = 360 / #2', tr('c13.r2')], ['#30 = #1 + [#29-1] * #28', tr('c13.r3')], ['#31 = #24 + #27 * COS', tr('c13.r4')], ['#32 = #25 + #27 * SIN', tr('c13.r5')], ['N40  #29 + 1', tr('c13.r6')]];
  res.forEach((r, i) => { const a = ease((t - .3 - i * .5) / .4); if (a <= 0) return;
    const y = 260 + i * 108; g.globalAlpha = a; card(70, y, 940, 94, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text(r[0], 100, y + 58, 32, C.tool, { mono: true, w: 700, alpha: a }); text(r[1], 980, y + 58, 32, C.txt, { a: 'right', w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 930, 940, 220, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c13.first'), 110, 1000, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1612 ... W50. Z49. ...', 110, 1065, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c13.air'), 110, 1120, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1190, 940, 190, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c13.sim'), 540, 1265, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c13.path'), 540, 1335, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
