/* Vídeo: macro de furos em círculo PCD O1612 — cenas. Textos em m/pcd.<idioma>.js, números em m/facts_pcd.js (simulação real). */
const RAW = window.FACTS_RAW, A = RAW.args;
const HOLES = RAW.segs.filter(s => s[0] === 'h').map(s => ({ x: s[1], y: s[2] }));
const RAD = A.J / 2, STEP = 360 / A.B;
const ang = n => A.A + (n - 1) * STEP;
const gc = n => (Math.round(n * 1000) / 1000).toString();
const g3 = n => (Math.round(n * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
Object.assign(FX, {
  X: A.X, Y: A.Y, J: A.J, B: A.B, A: A.A, H: A.H, W: A.W, Z: A.Z, R: A.R, Q: A.Q, F: A.F,
  r: RAD, step: STEP, a2: ang(2), a3: ang(3), alast: ang(A.B), safe: A.W + A.R,
  x1: g3(HOLES[0].x), y1: g3(HOLES[0].y), n: HOLES.length,
  g65a: RAW.g65.split(' ').slice(0, 6).join(' '), g65b: RAW.g65.split(' ').slice(6).join(' ')
});
const MAC = ['O1612 ;', 'IF [#2 LT 1] THEN #3000 = 111 ;', '#27 = #5 / 2 ;', '#28 = 360 / #2 ;', '#29 = 1 ;',
  'N10 #30 = #1 + [#29 - 1] * #28 ;', '#31 = #24 + #27 * COS[#30] ;', '#32 = #25 + #27 * SIN[#30] ;',
  'IF [#11 GE 2] GOTO 30 ;', 'IF [#11 GE 1] GOTO 20 ;', 'IF [#17 GT 0] GOTO 15 ;',
  'G99 G81 X#31 Y#32 Z#26 R[#23 + #18] F#9 ;', 'GOTO 40 ;', 'N15 G99 G83 X#31 Y#32 Z#26 R[#23 + #18] Q#17 F#9 ;', 'GOTO 40 ;',
  'N20 G65 P1613 X#31 Y#32 D#7 T#20 W#23 Z#26 K#6 R#18 F#9 ;', 'GOTO 40 ;',
  'N30 G65 P1619 X#31 Y#32 D#7 I#4 T#20 W#23 Z#26 R#18 F#9 Q#17 E#8 ;',
  'N40 IF [#29 GE #2] GOTO 50 ;', '#29 = #29 + 1 ;', 'GOTO 10 ;', 'N50 G80 ;', 'G98 ;', 'M99 ;'];

/* vista de cima do círculo */
const PV = { cx: 540, cy: 645, s: 1.7 };
const px = x => PV.cx + x * PV.s, py = y => PV.cy - y * PV.s;
function plate(a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(PV.cx, PV.cy, (RAD + 25) * PV.s, 0, 7); g.fillStyle = C.part; g.fill(); g.strokeStyle = C.edge; g.lineWidth = 3; g.stroke();
  g.globalAlpha = 1;
  line(px(-12), py(0), px(12), py(0), C.mut, 2); line(px(0), py(-12), px(0), py(12), C.mut, 2);
}
function pcdCircle(a) { g.globalAlpha = a == null ? 1 : a; g.beginPath(); g.arc(PV.cx, PV.cy, RAD * PV.s, 0, 7); g.strokeStyle = C.cyan; g.lineWidth = 2.5; g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
function hole(i, st) { // st: 0 marcado, 1 furado
  const h = HOLES[i]; g.beginPath(); g.arc(px(h.x), py(h.y), 17, 0, 7);
  if (st >= 1) { g.fillStyle = '#03070f'; g.fill(); g.strokeStyle = C.ok; g.lineWidth = 3; g.stroke(); }
  else { g.strokeStyle = 'rgba(143,163,189,.55)'; g.lineWidth = 2.5; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]); }
}
function holeNum(i, a, col) { const h = HOLES[i], k = 1.16; text(String(i + 1), px(h.x * k), py(h.y * k) + 12, 30, col || C.mut, { a: 'center', w: 800, alpha: a }); }
function drill(x, y, a) {
  g.globalAlpha = a == null ? 1 : a;
  g.beginPath(); g.arc(px(x), py(y), 22, 0, 7); g.fillStyle = 'rgba(245,165,36,.25)'; g.fill(); g.strokeStyle = C.tool; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.arc(px(x), py(y), 5, 0, 7); g.fillStyle = C.tool; g.fill(); g.globalAlpha = 1;
}
function angArc(a0, a1, r, color, label) { // arco do ângulo a partir de X+
  g.beginPath(); g.arc(PV.cx, PV.cy, r, -a0 * Math.PI / 180, -a1 * Math.PI / 180, true); g.strokeStyle = color; g.lineWidth = 5; g.stroke();
  if (label) { const m = (a0 + a1) / 2 * Math.PI / 180; text(label, PV.cx + (r + 50) * Math.cos(m), PV.cy - (r + 50) * Math.sin(m) + 12, 34, color, { a: 'center', w: 800 }); }
}
const toXY = d => ({ x: RAD * Math.cos(d * Math.PI / 180), y: RAD * Math.sin(d * Math.PI / 180) });

let this_hl = [5];
const S = [];
const sc = (k, o) => { o.title = tr(k + '.t'); o.subs = tr(k + '.s'); o.voice = STR[k + '.v'] ? tr(k + '.v') : o.subs; S.push(o); };

sc('c1', { draw(t, T) {
  plate(.9); pcdCircle(ease(t / 1));
  const n = Math.floor(clamp((t - .6) / (T * .7), 0, 1) * HOLES.length);
  HOLES.forEach((h, i) => hole(i, i < n ? 1 : 0));
  if (n < HOLES.length) drill(HOLES[n].x, HOLES[n].y);
  const a = ease(t / 1.2);
  g.globalAlpha = a; card(90, 1100, 900, 380, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
  text(tr('c1.k1'), 540, 1200, 40, C.cyan, { a: 'center', w: 800, alpha: a });
  text(tr('c1.k2'), 540, 1300, tr('c1.k2').length > 14 ? 76 : 92, C.txt, { a: 'center', w: 900, alpha: a });
  text('G65 P1612', 540, 1400, 58, C.tool, { a: 'center', w: 700, mono: true, alpha: a });
} });

const LETV = [['X Y', '#24 #25', [A.X, A.Y]], ['J', '#5', [A.J]], ['B', '#2', [A.B]], ['A', '#1', [A.A]], ['H', '#11', [A.H]],
  ['W', '#23', [A.W]], ['Z', '#26', [A.Z]], ['R', '#18', [A.R]], ['Q', '#17', [A.Q]], ['F', '#9', [A.F]]];
const LGRP = [1, 1, 2, 2, 3, 4, 4, 4, 5, 5];
sc('c2', { draw(t, T, at) {
  text(FX.g65a, 540, 290, 40, C.tool, { a: 'center', w: 700, mono: true });
  text(FX.g65b, 540, 346, 40, C.tool, { a: 'center', w: 700, mono: true });
  const names = tr('c2.names');
  LETV.forEach((l, i) => {
    const a = ease((t - at(LGRP[i]) - (i % 2) * .25) / .6); if (a <= 0) return;
    const col = i % 2, row = Math.floor(i / 2), x = 70 + col * 480, y = 400 + row * 212 + (1 - a) * 30;
    g.globalAlpha = a; card(x, y, 460, 190, 'rgba(102,184,255,.45)'); g.globalAlpha = 1;
    text(l[0], x + 30 + (l[0].length > 1 ? 0 : 6), y + 104, l[0].length > 1 ? 48 : 96, C.tool, { w: 900, mono: true, alpha: a });
    const xo = l[0].length > 1 ? 160 : 130;
    text('→ ' + l[1], x + xo, y + 72, l[1].length > 4 ? 36 : 44, C.cyan, { w: 700, mono: true, alpha: a });
    text(names[i], x + xo + 2, y + 120, names[i].length > 16 ? 26 : 30, C.txt, { alpha: a });
    text('= ' + l[2].map(gc).join(' '), x + xo + 2, y + 164, 34, C.ok, { w: 700, mono: true, alpha: a });
  });
} });

sc('c3', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [2] : [1];
    plate(); pcdCircle();
    const a0 = ease((t - at(0) - .3) / .6);
    if (t < at(1)) { g.globalAlpha = a0; card(140, 380, 800, 200, 'rgba(255,107,107,.55)'); g.globalAlpha = 1;
      text('B < 1 ?', 540, 460, 54, C.txt, { a: 'center', w: 800, mono: true, alpha: a0 });
      text(tr('c3.alm'), 540, 530, 38, C.err, { a: 'center', w: 800, alpha: a0 }); return; }
    const a1 = ease((t - at(1) - .2) / .8), a2 = ease((t - at(1) - 1.4) / .8);
    dim(px(-RAD), py(0) + 0, px(RAD), py(0), 'J = Ø' + gc(A.J), C.txt, [0, -18], 40);
    if (a2 > 0) { line(PV.cx, PV.cy - 70, PV.cx + RAD * PV.s * a2, PV.cy - 70, C.ok, 6); text(num(RAD), PV.cx + RAD * PV.s / 2, PV.cy - 92, 46, C.ok, { a: 'center', w: 800, alpha: a2 }); }
    chip(540, 1045, '#27', gc(RAD), C.ok, a2);
    const a3 = ease((t - at(2)) / .6);
    if (a3 > 0) { text(tr('c3.warn'), 540, 330, 38, C.tool, { a: 'center', w: 800, alpha: a3 }); }
  } });

sc('c4', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [4] : [3];
    plate(); pcdCircle();
    HOLES.forEach((h, i) => hole(i, 0));
    const a1 = ease((t - at(1)) / .8);
    if (a1 > 0) { [0, 1].forEach(i => { const h = HOLES[i]; line(PV.cx, PV.cy, px(h.x), py(h.y), C.cyan, 3); });
      angArc(ang(1), ang(1) + STEP * a1, 150, C.tool, num(STEP) + '°'); }
    chip(330, 1045, '#28', gc(STEP), C.tool, a1);
    const a2 = ease((t - at(2)) / .6);
    if (a2 > 0) { hole(0, 0); holeNum(0, a2, C.ok); chip(760, 1045, '#29', '1', C.ok, a2); }
  } });

sc('c5', { code: () => ({ lines: MAC, hl: [5] }),
  draw(t, T, at) {
    plate(); pcdCircle();
    HOLES.forEach((h, i) => hole(i, 0));
    line(PV.cx, PV.cy, PV.cx + (RAD + 40) * PV.s, PV.cy, C.mut, 2, [10, 8]); text('X+', PV.cx + (RAD + 40) * PV.s - 10, PV.cy - 16, 28, C.mut, { a: 'right', w: 800 });
    const steps = [at(2), at(2) + 1.6, at(2) + 3.2];
    let k = -1; steps.forEach((s, j) => { if (t >= s) k = j; });
    const kk = Math.max(k, 0), d = ang(kk + 1), a = ease((t - (k < 0 ? at(1) : steps[kk])) / .8);
    const p = toXY(d);
    line(PV.cx, PV.cy, px(p.x), py(p.y), C.cyan, 4);
    angArc(0, d * (k < 0 ? ease((t - at(0) - .5) / 1) : 1), 120 + kk * 30, C.tool, num(d) + '°');
    for (let j = 0; j <= kk; j++) holeNum(j, 1, C.cyan);
    chip(540, 1045, '#30', gc(d), C.tool, Math.max(a, k >= 0 ? 1 : 0));
    const a4 = ease((t - at(3)) / .6);
    if (a4 > 0) { g.beginPath(); g.arc(PV.cx, PV.cy, 230, -.15, -1.3, true); g.strokeStyle = C.ok; g.lineWidth = 5; g.stroke(); arrowHead(PV.cx + 230 * Math.cos(-1.2), PV.cy + 230 * Math.sin(-1.2), PV.cx + 230 * Math.cos(-1.3), PV.cy + 230 * Math.sin(-1.3), C.ok, 22);
      text(tr('c5.ccw'), 540, 330, 36, C.ok, { a: 'center', w: 800, alpha: a4 }); }
  } });

sc('c6', { code: () => ({ lines: MAC, hl: this_hl }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [7] : (t > at(1) ? [6] : [5]);
    plate(.6); pcdCircle(.6);
    const h = HOLES[0], ax = px(h.x), ay = py(h.y);
    line(PV.cx, PV.cy, ax, ay, C.cyan, 5); hole(0, 0);
    angArc(0, A.A, 120, C.tool, ''); text(num(A.A) + '°', PV.cx + 175, PV.cy - 8, 32, C.tool, { a: 'center', w: 800 });
    text('R ' + num(RAD), (PV.cx + ax) / 2 - 30, (PV.cy + ay) / 2 - 40, 34, C.cyan, { a: 'center', w: 800 });
    const a1 = ease((t - at(1)) / .8), a2 = ease((t - at(2)) / .8);
    if (a1 > 0) { line(PV.cx, PV.cy + 4, PV.cx + (ax - PV.cx) * a1, PV.cy + 4, C.ok, 7); text('X = R·COS', PV.cx + (ax - PV.cx) / 2, PV.cy + 60, 34, C.ok, { a: 'center', w: 800, mono: true, alpha: a1 }); }
    if (a2 > 0) { line(ax, PV.cy, ax, PV.cy + (ay - PV.cy) * a2, C.tool, 7); text('Y = R·SIN', ax + 24, (PV.cy + ay) / 2 + 12, 34, C.tool, { a: 'left', w: 800, mono: true, alpha: a2 }); }
    chip(330, 1045, '#31', FX.x1, C.ok, ease((t - at(3)) / .6));
    chip(760, 1045, '#32', FX.y1, C.tool, ease((t - at(3)) / .6));
  } });

const OPS = [['H0', 'G81 / G83', 'c7.o0', C.ok], ['H1', 'G65 P1613', 'c7.o1', C.cyan], ['H2', 'G65 P1619', 'c7.o2', C.tool]];
sc('c7', { code: () => ({ lines: MAC, hl: this_hl, first: 7 }),
  draw(t, T, at) {
    this_hl = t > at(2) ? [8, 17] : (t > at(1) ? [9, 15] : [8, 9, 10]);
    text('IF [#11 ...]', 540, 320, 48, C.txt, { a: 'center', w: 800, mono: true });
    OPS.forEach((o, i) => {
      const a = ease((t - (i === 0 ? at(0) + .6 : at(i === 2 ? 2 : 1) + (i === 1 ? .2 : 0)) - .2) / .6); if (a <= 0) return;
      const y = 400 + i * 200;
      g.globalAlpha = a; card(70, y, 940, 175, o[3]); g.globalAlpha = 1;
      text(o[0], 120, y + 108, 80, o[3], { w: 900, mono: true, alpha: a });
      text(tr(o[2]), 300, y + 72, 40, C.txt, { w: 700, alpha: a });
      text(o[1], 300, y + 130, 38, C.mut, { mono: true, w: 700, alpha: a });
    });
    const a3 = ease((t - at(2) - 1.6) / .6);
    if (a3 > 0) text(tr('c7.nest'), 540, 1040, 40, C.tool, { a: 'center', w: 800, alpha: a3 });
  } });

/* vista de lado da bicada (G83) */
const SV = { x: 540, top: 620, zs: 11 };
const sz = z => SV.top - z * SV.zs;
const RP = A.W + A.R;
const PECKS = (() => { const p = []; let z = RP; while (z > A.Z + 1e-9) { z = Math.max(z - A.Q, A.Z); p.push(z); } return p; })();
function sideDrill(z) { g.fillStyle = 'rgba(245,165,36,.9)'; g.beginPath(); g.moveTo(SV.x - 22, sz(z) - 170); g.lineTo(SV.x + 22, sz(z) - 170); g.lineTo(SV.x + 22, sz(z) - 22); g.lineTo(SV.x, sz(z)); g.lineTo(SV.x - 22, sz(z) - 22); g.closePath(); g.fill(); g.fillStyle = '#7d8ea8'; g.fillRect(SV.x - 34, sz(z) - 250, 68, 80); }
sc('c8', { code: () => ({ lines: MAC, hl: this_hl, first: 9 }),
  draw(t, T, at) {
    this_hl = t > at(1) + 2.2 ? [13] : (t > at(1) ? [11, 13] : [10]);
    const p0 = at(2), p1 = at(3) - .2, f = clamp((t - p0) / (p1 - p0), 0, 1);
    // ciclo: para cada bicada desce até z, sobe até R
    const n = PECKS.length, seg = f * n, k = Math.min(Math.floor(seg), n - 1), u = seg - k;
    let zt, deep;
    if (f <= 0) { zt = RP; deep = A.W; }
    else if (f >= 1) { zt = RP; deep = A.Z; }
    else if (u < .6) { zt = lerp(k > 0 ? PECKS[k - 1] + 1 : RP, PECKS[k], ease(u / .6)); deep = Math.min(k > 0 ? PECKS[k - 1] : A.W, zt); }
    else { zt = lerp(PECKS[k], RP, ease((u - .6) / .4)); deep = PECKS[k]; }
    g.fillStyle = C.part; g.fillRect(200, sz(A.W), 680, sz(A.Z - 5) - sz(A.W)); g.strokeStyle = C.edge; g.lineWidth = 3; g.strokeRect(200, sz(A.W), 680, sz(A.Z - 5) - sz(A.W));
    if (deep < A.W) { g.fillStyle = '#03070f'; g.fillRect(SV.x - 22, sz(A.W) - 2, 44, sz(deep) - sz(A.W) + 2); }
    text(tr('side'), 1010, 300, 30, C.mut, { a: 'right' });
    line(150, sz(RP), 930, sz(RP), C.cyan, 3, [14, 10]); text('R' + gc(RP), 140, sz(RP) + 12, 32, C.cyan, { a: 'right', w: 800, mono: true });
    text('W' + gc(A.W), 140, sz(A.W) + 40, 32, C.txt, { a: 'right', w: 800, mono: true });
    line(150, sz(A.Z), 930, sz(A.Z), C.ok, 3); text('Z' + gc(A.Z), 140, sz(A.Z) + 12, 32, C.ok, { a: 'right', w: 800, mono: true });
    if (t > at(2)) PECKS.forEach((z, i) => { if ((i <= k || f >= 1) && z > A.Z) { line(600, sz(z), 680, sz(z), C.tool, 3); text(gc(z), 700, sz(z) + 12, 28, C.tool, { w: 700, mono: true }); } });
    sideDrill(zt);
    const a1 = ease((t - at(1)) / .6);
    if (a1 > 0 && t < at(2)) { g.globalAlpha = a1; card(120, 820, 840, 200, 'rgba(102,184,255,.5)'); g.globalAlpha = 1;
      text('Q = 0  →  G81', 540, 895, 44, C.txt, { a: 'center', w: 800, mono: true, alpha: a1 });
      text('Q > 0  →  G83', 540, 970, 44, C.tool, { a: 'center', w: 800, mono: true, alpha: a1 }); }
    chip(220, 300, 'Q', gc(A.Q), C.tool, ease((t - at(0) - .3) / .6));
    if (t > at(3)) chip(800, 420, 'G99', tr('c8.back', { g: 0 }), C.cyan, ease((t - at(3)) / .6));
  } });

sc('c9', { code: () => ({ lines: MAC, hl: this_hl, first: 14 }),
  draw(t, T, at) {
    plate(); pcdCircle();
    const f = clamp((t - .4) / (at(3) - .6), 0, 1), nf = f * HOLES.length, k = Math.min(Math.floor(nf), HOLES.length - 1), u = nf - k;
    HOLES.forEach((h, i) => { hole(i, i < k || (i === k && u > .5) || f >= 1 ? 1 : 0); });
    HOLES.forEach((h, i) => { if (i <= k) holeNum(i, 1, i === k ? C.tool : C.mut); });
    let pos = HOLES[k]; if (u < .35 && k > 0) { const a = HOLES[k - 1], b = HOLES[k], e = ease(u / .35); pos = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) }; }
    if (f < 1) drill(pos.x, pos.y);
    this_hl = f >= 1 ? [18] : (u < .35 ? [19, 20] : [18]);
    chip(330, 1045, '#29', String(k + 1), C.ok, 1);
    chip(760, 1045, '#30', gc(ang(k + 1)) + '°', C.tool, 1);
    const a4 = ease((t - at(3)) / .6);
    if (a4 > 0) { angArc(ang(HOLES.length), ang(1) + 360, 140, C.ok, num(STEP) + '°'); }
  } });

sc('c10', { code: () => ({ lines: MAC, hl: this_hl, first: 15 }),
  draw(t, T, at) {
    this_hl = t > at(1) ? [22, 23] : [21];
    const rows = [['G80', tr('c10.g80'), C.err], ['G98', tr('c10.g98'), C.cyan], ['M99', tr('c10.m99'), C.ok]];
    rows.forEach((r, i) => { const a = ease((t - (i === 0 ? at(0) + .3 : at(1) + (i - 1) * 1.2)) / .6); if (a <= 0) return;
      const y = 300 + i * 230; g.globalAlpha = a; card(70, y, 940, 200, r[2]); g.globalAlpha = 1;
      text(r[0], 120, y + 125, 84, r[2], { w: 900, mono: true, alpha: a });
      const ls = r[1].split('\n'); ls.forEach((l, j) => text(l, 360, y + 90 + j * 52, 38, C.txt, { w: 600, alpha: a })); });
  } });

sc('c11', { draw(t, T, at) {
  tr('c11.res').forEach((r, i) => { const a = ease((t - .3 - i * .45) / .4); if (a <= 0) return;
    const y = 270 + i * 112; g.globalAlpha = a; card(70, y, 940, 96, 'rgba(60,207,142,.4)'); g.globalAlpha = 1;
    text('✓', 120, y + 64, 46, C.ok, { w: 900, alpha: a }); text(r, 190, y + 63, 40, C.txt, { w: 600, alpha: a }); });
  const a2 = ease((t - at(1)) / .6);
  if (a2 > 0) { g.globalAlpha = a2; card(70, 960, 940, 230, 'rgba(245,165,36,.6)'); g.globalAlpha = 1;
    text(tr('c11.first'), 110, 1030, 40, C.tool, { w: 800, alpha: a2 });
    text('G65 P1612 ... W50. Z49. ...', 110, 1095, 36, C.txt, { mono: true, w: 700, alpha: a2 });
    text(tr('c11.air'), 110, 1155, 32, C.mut, { alpha: a2 }); }
  const a3 = ease((t - at(2)) / .6);
  if (a3 > 0) { g.globalAlpha = a3; card(70, 1230, 940, 200, 'rgba(102,184,255,.6)'); g.globalAlpha = 1;
    text(tr('c11.sim'), 540, 1310, 44, C.cyan, { a: 'center', w: 800, alpha: a3 });
    text(tr('c11.path'), 540, 1380, 32, C.txt, { a: 'center', alpha: a3 }); }
} });
