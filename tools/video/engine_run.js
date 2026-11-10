/* ---------- tempo ---------- */
const subDur = s => Math.max(2.6, s.split(' ').length * .40 + 1.0);
S.forEach(sc => { let tt = .4; sc.st = sc.subs.map(s => { const a = tt; tt += subDur(s); return a; }); sc.dur = tt + .5; });
if (window.TIMING) S.forEach((sc, i) => { sc.st = window.TIMING[i].st; sc.dur = window.TIMING[i].dur; });
const subEnd = (sc, k) => window.TIMING ? (k + 1 < sc.st.length ? sc.st[k + 1] - 0.05 : sc.dur) : sc.st[k] + subDur(sc.subs[k]);
window.SCENES = S.map(s => ({ title: s.title, voice: s.voice || [], dur: s.dur, subs: s.subs.map((x, i) => ({ text: x, start: s.st[i], end: subEnd(s, i) })) }));

function renderFrame(i, t, withSub) {
  const sc = S[i], T = sc.dur, at = k => sc.st[Math.min(k, sc.st.length - 1)]; window.TNOW = t;
  g.setTransform(1, 0, 0, 1, 0, 0); background(); header(sc, i, S.length);
  sc.draw(t, T, at);
  if (sc.code) { const cd = sc.code(); codePanel(cd.lines, cd.hl, 1100, cd.n || 9, cd); }
  const fin = clamp(t / .35, 0, 1), fout = clamp((T - t) / .25, 0, 1), f = Math.min(fin, fout);
  if (f < 1) { g.fillStyle = 'rgba(3,7,15,' + (1 - f) + ')'; g.fillRect(0, 0, W, H); }
  if (withSub) {
    let k = -1; sc.st.forEach((s, j) => { if (t >= s) k = j; });
    if (k >= 0) { const e = subEnd(sc, k); if (t < e + (k === sc.subs.length - 1 ? 1 : 0)) subtitle(sc.subs[k], clamp((t - sc.st[k]) / .15, 0, 1) * Math.min(1, fout)); }
  }
}
window.frames = function (i, t0, n, fps) {
  const out = [];
  for (let k = 0; k < n; k++) { const t = t0 + k / fps;
    renderFrame(i, t, false); const a = c.toDataURL('image/jpeg', .92);
    renderFrame(i, t, true); const b = c.toDataURL('image/jpeg', .92);
    out.push([a.slice(23), b.slice(23)]); }
  return out;
};
window.ready = document.fonts.load('700 52px Inter').then(() => document.fonts.load('400 30px "DejaVu Sans Mono"')).then(() => true);
