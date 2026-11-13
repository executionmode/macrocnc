/* Macro CNC — aba Desenho (CAD 2D simples, com 3D simples e agente).
 * Medidas sempre em mm, em relação à origem que o usuário escolhe.
 * Os elementos ficam guardados em coordenadas absolutas; a origem só muda como as medidas aparecem.
 * Elementos: circle, rect, line, arc, poly, holes, dim (cota).
 */
(function (root) {
  'use strict';
  var KEY = 'mcnc.cad';
  var T = function (s) { return (root.I18N && root.I18N.t) ? root.I18N.t(s) : s; };
  var D2R = Math.PI / 180;

  /* ---------- utilidades ---------- */
  function fmt(v, dec) { if (!isFinite(v)) return ''; var m = Math.pow(10, dec == null ? 3 : dec), r = Math.round(v * m) / m; if (Object.is(r, -0)) r = 0; return String(r); }
  function num(s) {
    if (typeof s === 'number') return s;
    s = String(s == null ? '' : s).replace(/,/g, '.').replace(/\s+/g, '');
    if (!s) return NaN;
    if (!/^[0-9+\-*/().]+$/.test(s)) return NaN;
    try { var v = Function('"use strict";return (' + s + ')')(); return typeof v === 'number' && isFinite(v) ? v : NaN; } catch (e) { return NaN; }
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nang(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function byId(id) { for (var i = 0; i < doc.ents.length; i++) if (doc.ents[i].id === id) return doc.ents[i]; return null; }
  function lineX(ax, ay, bx, by, cx, cy, dx, dy) {   // cruzamento das retas AB e CD (infinitas): [x, y, t em AB, u em CD]
    var r1x = bx - ax, r1y = by - ay, r2x = dx - cx, r2y = dy - cy, den = r1x * r2y - r1y * r2x;
    if (Math.abs(den) < 1e-9) return null;
    var t = ((cx - ax) * r2y - (cy - ay) * r2x) / den;
    return [ax + t * r1x, ay + t * r1y, t, ((cx - ax) * r1y - (cy - ay) * r1x) / den];
  }

  /* ---------- armazenamento ---------- */
  function newDoc(name) { return { name: name, origin: { x: 0, y: 0 }, ents: [], esp: 20, hide: {}, upd: Date.now() }; }
  function loadAll() {
    var s; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!s || !s.docs) s = { cur: null, docs: {} };
    Object.keys(s.docs).forEach(function (k) { var d = s.docs[k]; if (d.saved == null) { d.saved = d.ents.length > 0; if (d.saved) d.savedAt = d.upd; } });
    if (!s.cur || !s.docs[s.cur]) { var id = uid(); s.docs[id] = newDoc(T('Desenho') + ' 1'); s.cur = id; }
    return s;
  }
  var store = null, doc = null;
  function isDirty() { return !doc.saved ? doc.ents.length > 0 : (doc.upd || 0) > (doc.savedAt || 0); }
  function updSaveBtn() { var b = el.host && el.host.querySelector('.cad-save'); if (b) b.classList.toggle('dirty', isDirty()); }
  function save(keepTime) {
    if (!keepTime) doc.upd = Date.now();
    setTimeout(updSaveBtn, 0);
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { toast(T('Sem espaço para salvar no aparelho.') + (doc.bg ? ' ' + T('Tire a foto de fundo para liberar espaço.') : '')); }
  }

  /* ---------- geometria ---------- */
  function holePts(e) {
    var p = [], i, j;
    if (e.mode === 'pcd') { var R = e.pcd / 2; for (i = 0; i < e.n; i++) { var a = (e.a0 + i * 360 / e.n) * D2R; p.push([e.x + R * Math.cos(a), e.y + R * Math.sin(a)]); } }
    else if (e.mode === 'linha') { var c = Math.cos(e.ang * D2R), s = Math.sin(e.ang * D2R); for (i = 0; i < e.n; i++) p.push([e.x + i * e.dist * c, e.y + i * e.dist * s]); }
    else if (e.mode === 'grade') { for (j = 0; j < e.ny; j++) for (i = 0; i < e.nx; i++) p.push([e.x + i * e.dx, e.y + j * e.dy]); }
    else if (e.mode === 'lista') p = e.pts.map(function (q) { return [q[0], q[1]]; });
    else p.push([e.x, e.y]);
    return p;
  }
  function polyR(e) { return e.med === 'cantos' ? e.v / 2 : e.v / 2 / Math.cos(Math.PI / e.n); }
  function polyPts(e) { var R = polyR(e), p = []; for (var i = 0; i < e.n; i++) { var a = (e.ang + i * 360 / e.n) * D2R; p.push([e.x + R * Math.cos(a), e.y + R * Math.sin(a)]); } return p; }
  // primitivas: c = círculo, l = linha, a = arco (graus, anti-horário de a0 até a1)
  function prims(e) {
    var P = [];
    if (e.t === 'circle') P.push({ k: 'c', x: e.x, y: e.y, r: e.d / 2 });
    else if (e.t === 'line') P.push({ k: 'l', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 });
    else if (e.t === 'arc') P.push({ k: 'a', x: e.x, y: e.y, r: e.r, a0: e.a0, a1: e.a1 });
    else if (e.t === 'rect') {
      var x0 = e.x, y0 = e.y, x1 = e.x + e.w, y1 = e.y + e.h, r = Math.min(e.r || 0, e.w / 2, e.h / 2);
      if (r > 0) {
        P.push({ k: 'l', x1: x0 + r, y1: y0, x2: x1 - r, y2: y0 }, { k: 'l', x1: x1, y1: y0 + r, x2: x1, y2: y1 - r },
          { k: 'l', x1: x1 - r, y1: y1, x2: x0 + r, y2: y1 }, { k: 'l', x1: x0, y1: y1 - r, x2: x0, y2: y0 + r },
          { k: 'a', x: x1 - r, y: y0 + r, r: r, a0: 270, a1: 360 }, { k: 'a', x: x1 - r, y: y1 - r, r: r, a0: 0, a1: 90 },
          { k: 'a', x: x0 + r, y: y1 - r, r: r, a0: 90, a1: 180 }, { k: 'a', x: x0 + r, y: y0 + r, r: r, a0: 180, a1: 270 });
      } else P.push({ k: 'l', x1: x0, y1: y0, x2: x1, y2: y0 }, { k: 'l', x1: x1, y1: y0, x2: x1, y2: y1 }, { k: 'l', x1: x1, y1: y1, x2: x0, y2: y1 }, { k: 'l', x1: x0, y1: y1, x2: x0, y2: y0 });
    } else if (e.t === 'poly') {
      var q = polyPts(e); q.forEach(function (a, i) { var b = q[(i + 1) % q.length]; P.push({ k: 'l', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }); });
    } else if (e.t === 'holes') {
      if (e.mode === 'pcd') P.push({ k: 'c', x: e.x, y: e.y, r: e.pcd / 2, cl: 1 });
      holePts(e).forEach(function (q) { P.push({ k: 'c', x: q[0], y: q[1], r: e.d / 2, hole: 1 }); });
    }
    return P;
  }
  function snapPts(e) {
    var S = [];
    if (e.t === 'dim') return S;
    if (e.t === 'rect') {
      var r = Math.min(e.r || 0, e.w / 2, e.h / 2);
      S.push([e.x + e.w / 2, e.y + e.h / 2, 'centro']);
      if (!r) S.push([e.x, e.y, 'canto'], [e.x + e.w, e.y, 'canto'], [e.x + e.w, e.y + e.h, 'canto'], [e.x, e.y + e.h, 'canto']);
      S.push([e.x + e.w / 2, e.y, 'meio'], [e.x + e.w, e.y + e.h / 2, 'meio'], [e.x + e.w / 2, e.y + e.h, 'meio'], [e.x, e.y + e.h / 2, 'meio']);
    }
    if (e.t === 'poly') { S.push([e.x, e.y, 'centro']); polyPts(e).forEach(function (q) { S.push([q[0], q[1], 'canto']); }); }
    prims(e).forEach(function (p) {
      if (p.k === 'c') { S.push([p.x, p.y, 'centro']); if (!p.cl) S.push([p.x + p.r, p.y, 'quadrante'], [p.x - p.r, p.y, 'quadrante'], [p.x, p.y + p.r, 'quadrante'], [p.x, p.y - p.r, 'quadrante']); }
      else if (p.k === 'l') { if (e.t === 'line') S.push([p.x1, p.y1, 'ponta'], [p.x2, p.y2, 'ponta']); if (e.t !== 'rect') S.push([(p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, 'meio']); }
      else if (p.k === 'a') {
        S.push([p.x + p.r * Math.cos(p.a0 * D2R), p.y + p.r * Math.sin(p.a0 * D2R), 'ponta'], [p.x + p.r * Math.cos(p.a1 * D2R), p.y + p.r * Math.sin(p.a1 * D2R), 'ponta']);
        if (e.t === 'arc') { var am = (p.a0 + p.a1) / 2 * D2R; S.push([p.x, p.y, 'centro'], [p.x + p.r * Math.cos(am), p.y + p.r * Math.sin(am), 'meio']); }
      }
    });
    return S;
  }
  function distSeg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t)); var qx = x1 + t * dx - px, qy = y1 + t * dy - py; return Math.sqrt(qx * qx + qy * qy);
  }
  function angIn(a, a0, a1) { return nang(a - a0) <= (a1 - a0) + 1e-9; }
  function distPrim(p, x, y) {
    if (p.k === 'l') return distSeg(x, y, p.x1, p.y1, p.x2, p.y2);
    var d = Math.hypot(x - p.x, y - p.y);
    if (p.k === 'c') return p.hole ? Math.max(0, d - p.r) : Math.abs(d - p.r);
    var a = Math.atan2(y - p.y, x - p.x) / D2R;
    if (angIn(a, p.a0, p.a1)) return Math.abs(d - p.r);
    return Math.min(Math.hypot(x - p.x - p.r * Math.cos(p.a0 * D2R), y - p.y - p.r * Math.sin(p.a0 * D2R)), Math.hypot(x - p.x - p.r * Math.cos(p.a1 * D2R), y - p.y - p.r * Math.sin(p.a1 * D2R)));
  }
  function bounds(list, withDims) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    function add(x, y) { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x > b.x1) b.x1 = x; if (y > b.y1) b.y1 = y; }
    list.forEach(function (e) {
      if (e.t === 'dim') { if (withDims) { var g = dimGeom(e, withDims); g.segs.forEach(function (s) { add(s[0], s[1]); add(s[2], s[3]); }); g.texts.forEach(function (t) { var w = t.s.length * t.h * 0.3; add(t.x - w, t.y - t.h); add(t.x + w, t.y + t.h); }); } return; }
      prims(e).forEach(function (p) {
        if (p.k === 'l') { add(p.x1, p.y1); add(p.x2, p.y2); }
        else if (p.k === 'c') { add(p.x - p.r, p.y - p.r); add(p.x + p.r, p.y + p.r); }
        else { for (var a = p.a0; a <= p.a1 + 0.01; a += Math.max(1, (p.a1 - p.a0) / 24)) add(p.x + p.r * Math.cos(a * D2R), p.y + p.r * Math.sin(a * D2R)); }
      });
    });
    return b;
  }
  function circle3(a, b, c) {
    var d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-9) return null;
    var A = a[0] * a[0] + a[1] * a[1], B = b[0] * b[0] + b[1] * b[1], C = c[0] * c[0] + c[1] * c[1];
    var x = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d, y = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d;
    return { x: x, y: y, r: Math.hypot(a[0] - x, a[1] - y) };
  }
  // retângulo / polígono viram linhas e arcos soltos (na mesma ordem das primitivas)
  function explode(e) {
    return prims(e).map(function (p) {
      var n = p.k === 'l' ? { t: 'line', x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 } : { t: 'arc', x: p.x, y: p.y, r: p.r, a0: p.a0, a1: p.a1 };
      if (e.prof != null) n.prof = e.prof;
      if (e.ls) n.ls = e.ls;
      n.id = uid(); return n;
    });
  }
  /* tipo de linha: cheia (padrão), tracejada, pontilhada, traço-ponto */
  var LS = [['cont', '━━ Cheia'], ['trac', '╍╍ Tracejada'], ['pont', '┈┈ Pontilhada'], ['tp', '─·─ Traço-ponto']];
  var LS_OK = { circle: 1, rect: 1, line: 1, arc: 1, poly: 1 };
  var curLs = 'cont';
  function isRef(e) { return e.ls === 'pont' || e.ls === 'tp'; }   // linhas de referência: não viram peça no 3D
  function noPart(e) { return isRef(e) || e.ign; }   // marcada como "ignorar" (ex.: linha onde o raio encontra a face): fica no desenho, não vira peça
  function lsDash(ls, k) { return ls === 'trac' ? [9 * k, 5 * k] : ls === 'pont' ? [0.1 * k, 4.5 * k] : ls === 'tp' ? [16 * k, 4 * k, 2.5 * k, 4 * k] : []; }
  function layerOf(e) { return e.t === 'dim' ? 'cotas' : e.t === 'holes' ? 'furos' : 'peca'; }
  function vis(e) { return !(doc.hide || {})[layerOf(e)]; }

  /* ---------- cotas ---------- */
  function resPt(p) {
    if (p.ref && p.ref.org) { p.x = doc.origin.x; p.y = doc.origin.y; return [p.x, p.y]; }   // ponto zero da peça
    if (p.ref) { var e = byId(p.ref.id); if (e) { var s = snapPts(e)[p.ref.i]; if (s) { p.x = s[0]; p.y = s[1]; } } }
    return [p.x, p.y];
  }
  function resCirc(c) {   // {ref:{id,pi}, x,y,r}
    if (c.ref) { var e = byId(c.ref.id); if (e) { var p = prims(e)[c.ref.pi]; if (p && (p.k === 'c' || p.k === 'a')) { c.x = p.x; c.y = p.y; c.r = p.r; c.n = e.t === 'holes' && p.hole && e.mode !== 'um' ? holePts(e).length : 1; } } }
    return c;
  }
  function resLine(l) {   // {ref:{id,pi}, x1..y2}
    if (l.ref) { var e = byId(l.ref.id); if (e) { var p = prims(e)[l.ref.pi]; if (p && p.k === 'l') { l.x1 = p.x1; l.y1 = p.y1; l.x2 = p.x2; l.y2 = p.y2; } } }
    return l;
  }
  function angSetup(e) {
    var L1 = resLine(e.l1), L2 = resLine(e.l2), I = lineX(L1.x1, L1.y1, L1.x2, L1.y2, L2.x1, L2.y1, L2.x2, L2.y2);
    if (!I) return null;
    function side(L, t) {
      var dx = L.x2 - L.x1, dy = L.y2 - L.y1, n = Math.hypot(dx, dy); dx /= n; dy /= n;
      var s = (t[0] - I[0]) * dx + (t[1] - I[1]) * dy; return s >= 0 ? [dx, dy] : [-dx, -dy];
    }
    var u1 = side(L1, e.t1), u2 = side(L2, e.t2), a1 = Math.atan2(u1[1], u1[0]) / D2R, a2 = Math.atan2(u2[1], u2[0]) / D2R;
    var sw = nang(a2 - a1), s0 = a1;
    if (sw > 180) { sw = 360 - sw; s0 = a2; }
    return { I: I, a0: s0, a1: s0 + sw, deg: sw };
  }
  function dimValue(e) {
    if (e.k === 'lin') { var a = resPt(e.p1), b = resPt(e.p2); return e.o === 'h' ? Math.abs(b[0] - a[0]) : e.o === 'v' ? Math.abs(b[1] - a[1]) : Math.hypot(b[0] - a[0], b[1] - a[1]); }
    if (e.k === 'dia') return resCirc(e.c).r * 2;
    if (e.k === 'rad') return resCirc(e.c).r;
    if (e.k === 'ang') { var g = angSetup(e); return g ? g.deg : 0; }
    return 0;
  }
  function dimText(e) {
    var v = dimValue(e), s;
    if (e.k === 'lin') s = fmt(v, 2);
    else if (e.k === 'dia') { var n = resCirc(e.c).n || 1; s = (n > 1 ? n + 'x ' : '') + 'Ø' + fmt(v, 2); }
    else if (e.k === 'rad') s = 'R' + fmt(v, 2);
    else if (e.k === 'ang') s = fmt(v, 2) + '°';
    else { var p = resPt(e.p), r = rel(p[0], p[1]); s = 'X' + fmt(r[0], 2) + ' Y' + fmt(r[1], 2); }
    if (e.txt) s = String(e.txt).indexOf('<>') >= 0 ? String(e.txt).split('<>').join(s) : e.txt;
    return s;
  }
  // geometria da cota no mundo; k = mm por "pixel" (tela: 1 / zoom; papel: fixo)
  function dimGeom(e, k) {
    var G = { segs: [], tris: [], arcs: [], texts: [] }, h = 12 * k, aL = 9 * k, aW = 3 * k, gap = 3 * k, over = 5 * k;
    function seg(a, b) { G.segs.push([a[0], a[1], b[0], b[1]]); }
    function arrow(p, d) { var n = [-d[1], d[0]]; G.tris.push([p[0], p[1], p[0] - d[0] * aL + n[0] * aW, p[1] - d[1] * aL + n[1] * aW, p[0] - d[0] * aL - n[0] * aW, p[1] - d[1] * aL - n[1] * aW]); }
    function text(x, y, rot, s) { G.texts.push({ x: x, y: y, h: h, rot: rot, s: s }); }
    function readable(a) { a = nang(a); if (a > 90 && a <= 270) a -= 180; return a; }
    var s = dimText(e), tw = s.length * h * 0.58;
    if (e.k === 'lin') {
      var A = resPt(e.p1), B = resPt(e.p2), Q = [e.q.x, e.q.y], A2, B2;
      if (e.o === 'h') { A2 = [A[0], Q[1]]; B2 = [B[0], Q[1]]; }
      else if (e.o === 'v') { A2 = [Q[0], A[1]]; B2 = [Q[0], B[1]]; }
      else {
        var L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-u[1], u[0]], off = (Q[0] - A[0]) * n[0] + (Q[1] - A[1]) * n[1];
        A2 = [A[0] + n[0] * off, A[1] + n[1] * off]; B2 = [B[0] + n[0] * off, B[1] + n[1] * off];
      }
      [[A, A2], [B, B2]].forEach(function (P) {
        var dx = P[1][0] - P[0][0], dy = P[1][1] - P[0][1], L = Math.hypot(dx, dy); if (L < gap) return;
        dx /= L; dy /= L; seg([P[0][0] + dx * gap, P[0][1] + dy * gap], [P[1][0] + dx * over, P[1][1] + dy * over]);
      });
      var dl = Math.hypot(B2[0] - A2[0], B2[1] - A2[1]);
      if (dl < 1e-9) return G;
      var d = [(B2[0] - A2[0]) / dl, (B2[1] - A2[1]) / dl];
      if (dl > aL * 2.4) { seg(A2, B2); arrow(A2, [-d[0], -d[1]]); arrow(B2, d); }
      else { seg([A2[0] - d[0] * aL * 2, A2[1] - d[1] * aL * 2], [B2[0] + d[0] * aL * 2, B2[1] + d[1] * aL * 2]); arrow(A2, d); arrow(B2, [-d[0], -d[1]]); }
      var rot = readable(Math.atan2(d[1], d[0]) / D2R), nr = [-Math.sin(rot * D2R), Math.cos(rot * D2R)];
      var m = [(A2[0] + B2[0]) / 2 + nr[0] * (h * 0.75), (A2[1] + B2[1]) / 2 + nr[1] * (h * 0.75)];
      if (dl < tw + aL) { var ext = aL * 2 + tw / 2 + 2 * k; m = [B2[0] + d[0] * ext + nr[0] * h * 0.75, B2[1] + d[1] * ext + nr[1] * h * 0.75]; }
      text(m[0], m[1], rot, s);
    } else if (e.k === 'dia' || e.k === 'rad') {
      var c = resCirc(e.c), ua = [Math.cos(e.ang * D2R), Math.sin(e.ang * D2R)], P = [c.x + c.r * ua[0], c.y + c.r * ua[1]];
      var Lp = [P[0] + ua[0] * 22 * k, P[1] + ua[1] * 22 * k], sg = ua[0] >= 0 ? 1 : -1, L2p = [Lp[0] + sg * (tw + 6 * k), Lp[1]];
      if (e.k === 'rad') { seg([c.x, c.y], P); arrow(P, ua); }
      else { seg([c.x - c.r * ua[0], c.y - c.r * ua[1]], P); arrow(P, ua); arrow([c.x - c.r * ua[0], c.y - c.r * ua[1]], [-ua[0], -ua[1]]); }
      seg(P, Lp); seg(Lp, L2p);
      text((Lp[0] + L2p[0]) / 2, Lp[1] + h * 0.7, 0, s);
    } else if (e.k === 'ang') {
      var g = angSetup(e); if (!g) return G;
      var rr = Math.max(e.rr || 20, 4 * k), q0 = [g.I[0] + rr * Math.cos(g.a0 * D2R), g.I[1] + rr * Math.sin(g.a0 * D2R)], q1 = [g.I[0] + rr * Math.cos(g.a1 * D2R), g.I[1] + rr * Math.sin(g.a1 * D2R)];
      G.arcs.push({ x: g.I[0], y: g.I[1], r: rr, a0: g.a0, a1: g.a1 });
      seg(g.I, q0); seg(g.I, q1);
      arrow(q0, [Math.sin(g.a0 * D2R), -Math.cos(g.a0 * D2R)]); arrow(q1, [-Math.sin(g.a1 * D2R), Math.cos(g.a1 * D2R)]);
      var am = (g.a0 + g.a1) / 2 * D2R, tr = rr + h * 0.9;
      text(g.I[0] + tr * Math.cos(am), g.I[1] + tr * Math.sin(am), readable(am / D2R - 90), s);
    } else if (e.k === 'ord') {
      var p = resPt(e.p), L1 = [p[0] + 16 * k, p[1] + 16 * k], L3 = [L1[0] + tw + 6 * k, L1[1]];
      seg(p, L1); seg(L1, L3); G.tris.push([p[0] - 2 * k, p[1] - 2 * k, p[0] + 2 * k, p[1] - 2 * k, p[0], p[1] + 2.5 * k]);
      text((L1[0] + L3[0]) / 2, L1[1] + h * 0.7, 0, s);
    }
    return G;
  }

  /* ---------- descrição para a lista ---------- */
  function rel(x, y) { return [x - doc.origin.x, y - doc.origin.y]; }
  function describe(e) {
    var o;
    if (e.t === 'circle') { o = rel(e.x, e.y); return T('Círculo') + ' Ø' + fmt(e.d) + ' · X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
    if (e.t === 'rect') { o = rel(e.x + e.w / 2, e.y + e.h / 2); return (e.w === e.h ? T('Quadrado') : T('Retângulo')) + ' ' + fmt(e.w) + ' x ' + fmt(e.h) + (e.r ? ' R' + fmt(e.r) : '') + ' · ' + T('centro') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
    if (e.t === 'line') { var a = rel(e.x1, e.y1), b = rel(e.x2, e.y2); return (e.cor ? T('Chanfro') + ' · ' : T('Linha') + ' ') + 'X' + fmt(a[0]) + ' Y' + fmt(a[1]) + ' → X' + fmt(b[0]) + ' Y' + fmt(b[1]) + ' · L' + fmt(Math.hypot(e.x2 - e.x1, e.y2 - e.y1)); }
    if (e.t === 'arc') { o = rel(e.x, e.y); return (e.cor ? T('Raio no canto') : T('Arco')) + ' R' + fmt(e.r) + ' · ' + T('centro') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]) + ' · ' + fmt(nang(e.a0)) + '° → ' + fmt(nang(e.a1)) + '°'; }
    if (e.t === 'poly') { o = rel(e.x, e.y); return T('Polígono') + ' ' + e.n + ' ' + T('lados') + ' · ' + (e.med === 'cantos' ? T('entre cantos') : T('entre faces')) + ' ' + fmt(e.v) + ' · ' + T('centro') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
    if (e.t === 'holes') {
      var n = holePts(e).length;
      if (e.mode === 'pcd') { o = rel(e.x, e.y); return n + ' ' + T('furos') + ' Ø' + fmt(e.d) + ' · PCD Ø' + fmt(e.pcd) + ' · ' + T('centro') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
      return (n === 1 ? T('Furo') : n + ' ' + T('furos')) + ' Ø' + fmt(e.d) + (e.prof ? ' · ' + T('prof.') + ' ' + fmt(e.prof) : '');
    }
    if (e.t === 'dim') return T('Cota') + ' ' + dimText(e);
    return e.t;
  }

  /* ---------- formulários das ferramentas ---------- */
  // campo: [chave, rótulo, padrão, 'o' = opcional | 't' = texto]
  var PROF = ['prof', 'Profundidade (vazio = passante)', '', 'o'];
  var FORMS = {
    circle: { title: 'Círculo', hint: 'Toque na tela para pôr o centro, ou digite.', fields: function () { return [['x', 'X do centro', 0], ['y', 'Y do centro', 0], ['d', 'Diâmetro', 50], PROF]; } },
    rect: {
      title: 'Retângulo', hint: 'Toque na tela para pôr o ponto de referência, ou digite.',
      seg: [['forma', [['ret', 'Retângulo'], ['quad', 'Quadrado']]], ['ref', [['canto', 'Pelo canto'], ['centro', 'Pelo centro']]]],
      fields: function (v) {
        var f = [['x', v.ref === 'centro' ? 'X do centro' : 'X do canto (esquerdo, embaixo)', 0], ['y', v.ref === 'centro' ? 'Y do centro' : 'Y do canto (esquerdo, embaixo)', 0]];
        if (v.forma === 'quad') f.push(['w', 'Lado', 100]); else f.push(['w', 'Largura (X)', 100], ['h', 'Altura (Y)', 60]);
        f.push(['r', 'Raio nos cantos (0 = canto vivo)', 0], PROF);
        return f;
      }
    },
    line: {
      title: 'Linha', hint: 'Toque no ponto inicial e depois no final. A próxima linha continua da ponta.',
      seg: [['modo', [['pts', 'Dois pontos'], ['la', 'Comprimento e ângulo']]]],
      fields: function (v) {
        var f = [['x1', 'X inicial', 0], ['y1', 'Y inicial', 0]];
        if (v.modo === 'la') f.push(['l', 'Comprimento', 100], ['a', 'Ângulo (0 = para a direita, anti-horário)', 0]);
        else f.push(['x2', 'X final', 100], ['y2', 'Y final', 0]);
        return f;
      }
    },
    arc: {
      title: 'Arco', hint: 'Digite o centro, o raio e os ângulos, ou escolha Três pontos e toque no início, num ponto do meio e no fim.',
      seg: [['modo', [['cr', 'Centro e raio'], ['p3', 'Três pontos']]]],
      fields: function (v) {
        if (v.modo === 'p3') return [['x1', 'X do início', 0], ['y1', 'Y do início', 0], ['x2', 'X de um ponto do meio', 0], ['y2', 'Y de um ponto do meio', 0], ['x3', 'X do fim', 0], ['y3', 'Y do fim', 0]];
        return [['x', 'X do centro', 0], ['y', 'Y do centro', 0], ['r', 'Raio', 25], ['a0', 'Ângulo inicial (0 = direita)', 0], ['a1', 'Ângulo final (anti-horário)', 90]];
      }
    },
    poly: {
      title: 'Polígono', hint: 'Sextavado, oitavado, quadrado... Toque na tela para pôr o centro, ou digite.',
      seg: [['med', [['faces', 'Medida entre faces'], ['cantos', 'Medida entre cantos']]]],
      fields: function (v) { return [['x', 'X do centro', 0], ['y', 'Y do centro', 0], ['n', 'Número de lados', 6], ['v', v.med === 'cantos' ? 'Medida entre cantos' : 'Medida entre faces', 36], ['ang', 'Ângulo do 1º canto (0 = direita)', 0], PROF]; }
    },
    holes: {
      title: 'Furos', hint: 'Toque na tela para pôr o furo (ou o centro do PCD), ou digite.',
      seg: [['mode', [['um', 'Um furo'], ['pcd', 'Em círculo (PCD)'], ['linha', 'Em linha'], ['grade', 'Em grade']]]],
      fields: function (v) {
        var f = [['d', 'Diâmetro do furo', 12]];
        if (v.mode === 'pcd') f.push(['x', 'X do centro do PCD', 0], ['y', 'Y do centro do PCD', 0], ['pcd', 'Diâmetro do PCD', 100], ['n', 'Quantidade de furos', 6], ['a0', 'Ângulo do 1º furo (0 = direita)', 0]);
        else if (v.mode === 'linha') f.push(['x', 'X do 1º furo', 0], ['y', 'Y do 1º furo', 0], ['n', 'Quantidade de furos', 4], ['dist', 'Distância entre furos', 25], ['ang', 'Ângulo da linha (0 = direita)', 0]);
        else if (v.mode === 'grade') f.push(['x', 'X do 1º furo (esquerdo, embaixo)', 0], ['y', 'Y do 1º furo (esquerdo, embaixo)', 0], ['nx', 'Colunas (em X)', 3], ['ny', 'Linhas (em Y)', 2], ['dx', 'Distância em X', 25], ['dy', 'Distância em Y', 25]);
        else if (v.mode === 'lista') return [['d', 'Diâmetro do furo', 12], PROF];
        else f.push(['x', 'X do furo', 0], ['y', 'Y do furo', 0]);
        f.push(PROF);
        return f;
      }
    },
    fillet: {
      title: 'Raio / Chanfro', hint: 'Digite o valor, toque na primeira linha e depois na segunda, perto do canto. Funciona em linhas, retângulos e polígonos.',
      seg: [['tipo', [['r', 'Raio'], ['c', 'Chanfro']]]],
      fields: function (v) { return v.tipo === 'c' ? [['v', 'Chanfro na 1ª linha', 2], ['v2', 'Chanfro na 2ª linha (vazio = igual)', '', 'o']] : [['v', 'Raio (0 = canto vivo)', 5]]; }
    },
    rot: {
      title: 'Girar', hint: '',
      seg: [['ralvo', [['tudo', 'Desenho todo'], ['sel', 'Escolher na tela']]], ['rfuro', [['grupo', 'Furos: grupo todo'], ['um', 'Furos: só o tocado']]], ['rcen', [['org', 'Giro em X0 Y0'], ['sel', 'No centro dela'], ['pt', 'Outro ponto']]], ['copia', [['nao', 'Girar o original'], ['sim', 'Fazer cópia']]]],
      fields: function (v) { var f = [['a', 'Ângulo (+ anti-horário, − horário)', 90]]; if (v.rcen === 'pt') f.push(['cx', 'X do centro do giro', 0], ['cy', 'Y do centro do giro', 0]); return f; }
    },
    dim: {
      title: 'Cota', hint: '',
      seg: [['dk', [['zero', 'Do X0 Y0'], ['lin', 'Linear'], ['dia', 'Diâmetro'], ['rad', 'Raio'], ['ang', 'Ângulo'], ['ord', 'Coordenada']]], ['o', [['h', 'Horizontal'], ['v', 'Vertical'], ['a', 'Alinhada']]], ['oz', [['xy', 'X e Y'], ['h', 'Só X'], ['v', 'Só Y']]]],
      fields: function () { return []; }
    },
    dimedit: { title: 'Cota', hint: '', fields: function () { return [['txt', 'Texto (vazio = medida; <> = medida)', '', 't']]; } },
    filedit: { title: 'Raio / Chanfro', hint: '', fields: function (v) { return v.tipo === 'c' ? [['v', 'Chanfro na 1ª linha', 2], ['v2', 'Chanfro na 2ª linha', 2]] : [['v', 'Raio', 5]]; } },
    origin: {
      title: 'Origem (X0 Y0)', hint: 'Toque num ponto do desenho (centro, canto, ponta) para pôr a origem ali. Ou mova a origem digitando quanto.',
      fields: function () { return [['dx', 'Mover a origem em X', 0], ['dy', 'Mover a origem em Y', 0]]; }
    },
    xf: {
      title: 'Mover / Girar / Espelhar', hint: '',
      seg: [['op', [['mov', 'Mover'], ['rot', 'Girar'], ['mir', 'Espelhar']]], ['mirax', [['v', 'Linha vertical'], ['h', 'Linha horizontal']]], ['alvo', [['este', 'Só este'], ['tudo', 'Tudo']]], ['copia', [['nao', 'Mover o original'], ['sim', 'Fazer cópia']]]],
      fields: function (v) {
        if (v.op === 'rot') return [['a', 'Ângulo (anti-horário)', 90], ['cx', 'X do centro do giro', 0], ['cy', 'Y do centro do giro', 0]];
        if (v.op === 'mir') return [['eixo', v.mirax === 'h' ? 'Y da linha do espelho' : 'X da linha do espelho', 0]];
        return [['dx', 'Mover em X', 0], ['dy', 'Mover em Y', 0]];
      }
    }
  };
  var SEG_DEF = { forma: 'ret', ref: 'canto', modo: 'pts', mode: 'um', med: 'faces', tipo: 'r', dk: 'lin', o: 'h', oz: 'xy', op: 'mov', alvo: 'este', copia: 'nao', mirax: 'v', ralvo: 'sel', rfuro: 'grupo', rcen: 'org' };
  var DIM_HINT = {
    lin: 'Toque no 1º ponto, no 2º ponto e depois onde a cota vai ficar.',
    dia: 'Toque num círculo, furo ou arco.', rad: 'Toque num círculo, furo ou arco.',
    ang: 'Toque na 1ª linha, na 2ª linha e depois onde a cota vai ficar.',
    ord: 'Toque num ponto: mostra o X e o Y dele em relação à origem.',
    zero: 'Toque no ponto (início do raio, centro, canto): cota em X e Y a partir do X0 Y0.'
  };

  /* ---------- estado da tela ---------- */
  var el = {}, ctx, W = 0, H = 0, dpr = 1, pxk = 1, printMode = false, touchMode = false;
  var view = { cx: 0, cy: 0, s: 2 };
  var tool = 'select', vals = {}, editing = null, sel = null, hover = null, snapHit = null, picks = [], mode2 = null;
  var undoS = [], redoS = [], built = false, firstFit = true, ghost = null;

  function toS(x, y) { return [W / 2 + (x - view.cx) * view.s, H / 2 - (y - view.cy) * view.s]; }
  function toW(sx, sy) { return [view.cx + (sx - W / 2) / view.s, view.cy - (sy - H / 2) / view.s]; }

  function snap() { return JSON.stringify({ o: doc.origin, e: doc.ents, esp: doc.esp }); }
  function pushUndo() { undoS.push(snap()); if (undoS.length > 120) undoS.shift(); redoS = []; updBtns(); }
  function restore(s) { var o = JSON.parse(s); doc.origin = o.o; doc.ents = o.e; if (o.esp) doc.esp = o.esp; sel = null; editing = null; save(); }
  function undo() { if (!undoS.length) return; redoS.push(snap()); restore(undoS.pop()); setTool('select'); updBtns(); }
  function redo() { if (!redoS.length) return; undoS.push(snap()); restore(redoS.pop()); setTool('select'); updBtns(); }
  function updBtns() { if (!el.undo) return; el.undo.disabled = !undoS.length; el.redo.disabled = !redoS.length; }

  /* ---------- montagem ---------- */
  var TOOLS = [['select', 'Selecionar', 'sel'], ['origin', 'Origem', 'org'], ['circle', 'Círculo', 'cir'], ['rect', 'Retângulo', 'rec'], ['line', 'Linha', 'lin'],
    ['arc', 'Arco', 'arc'], ['poly', 'Polígono', 'pol'], ['holes', 'Furos', 'fur'], ['fillet', 'Raio/Chanfro', 'fil'], ['rot', 'Girar', 'rot'], ['dim', 'Cota', 'dim']];
  var IC = {
    sel: '<path d="M6 3l12 9-5.5 1.2L16 20l-2.6 1.2-3-6.5L6 18.5z"/>',
    org: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>',
    cir: '<circle cx="12" cy="12" r="8"/><path d="M12 10.5v3M10.5 12h3"/>',
    rec: '<rect x="3.5" y="6" width="17" height="12" rx="1"/>',
    lin: '<path d="M4 19 20 5"/><circle cx="4" cy="19" r="1.6"/><circle cx="20" cy="5" r="1.6"/>',
    arc: '<path d="M4 18A10 10 0 0 1 20 8"/><circle cx="4" cy="18" r="1.6"/><circle cx="20" cy="8" r="1.6"/>',
    pol: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/>',
    fur: '<circle cx="12" cy="12" r="8" stroke-dasharray="2.5 2.5"/><circle cx="12" cy="4" r="2"/><circle cx="19" cy="15" r="2"/><circle cx="5" cy="15" r="2"/>',
    rot: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/><path d="M12 12l4-2.5" /><circle cx="12" cy="12" r="1.2"/>',
    fil: '<path d="M4 20V11a7 7 0 0 1 7-7h9"/><path d="M4 7l3-3" stroke-dasharray="2 2"/>',
    dim: '<path d="M3 8v8M21 8v8M3 12h18"/><path d="M6 10l-3 2 3 2M18 10l3 2-3 2"/>',
    undo: '<path d="M9 7H4v5"/><path d="M4.5 11.5A8 8 0 1 1 7 18"/>',
    redo: '<path d="M15 7h5v5"/><path d="M19.5 11.5A8 8 0 1 0 17 18"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3"/><rect x="8" y="13" width="8" height="6"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>'
  };
  function ic(n) { return '<svg class="cad-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>'; }

  function build() {
    var host = document.getElementById('cad'); if (!host) return false;
    host.innerHTML =
      '<div class="cad-top">' +
        '<button type="button" class="cad-name" data-a="fsavebox"><span id="cadName" class="notr"></span></button>' +
        '<button type="button" class="cad-b cad-save" data-a="fsavebox" aria-label="Salvar">' + ic('save') + '</button>' +
        '<button type="button" class="cad-b" data-a="files" aria-label="Desenhos salvos">' + ic('folder') + '</button>' +
        '<button type="button" class="cad-b" data-a="undo" aria-label="Desfazer">' + ic('undo') + '</button>' +
        '<button type="button" class="cad-b" data-a="redo" aria-label="Refazer">' + ic('redo') + '</button>' +
        '<button type="button" class="cad-b" data-a="fit" aria-label="Ver tudo">' + ic('fit') + '</button>' +
        '<button type="button" class="cad-b cad-bot" data-a="agent" aria-label="Agente">' + ic('bot') + '</button>' +
        '<button type="button" class="cad-b" data-a="menu" aria-label="Mais opções">' + ic('more') + '</button>' +
      '</div>' +
      '<div class="cad-stage"><canvas id="cadCv"></canvas><div class="cad-xy notr" id="cadXY"></div><div class="cad-toast" id="cadToast"></div></div>' +
      '<div class="cad-panel hidden" id="cadPanel"></div>' +
      '<div class="cad-tools">' + TOOLS.map(function (t) { return '<button type="button" data-tool="' + t[0] + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>'; }).join('') + '</div>' +
      '<div class="cad-modal hidden" id="cadModal"><div class="cad-mbox"><div class="cad-mhead"><h2 id="cadMTitle"></h2><button type="button" class="cad-b" data-a="mclose" aria-label="Fechar">✕</button></div><div id="cadMBody"></div></div></div>' +
      '<div class="cad-full hidden" id="cadFull"></div><div class="cad-ask hidden" id="cadAsk"></div>' +
      '<input type="file" id="cadImg" accept="image/*" class="cad-file" tabindex="-1"><input type="file" id="cadBgImg" accept="image/*" class="cad-file" tabindex="-1">';
    el.host = host; el.cv = host.querySelector('#cadCv'); ctx = el.cv.getContext('2d');
    el.xy = host.querySelector('#cadXY'); el.panel = host.querySelector('#cadPanel'); el.name = host.querySelector('#cadName');
    el.undo = host.querySelector('[data-a=undo]'); el.redo = host.querySelector('[data-a=redo]');
    el.modal = host.querySelector('#cadModal'); el.mt = host.querySelector('#cadMTitle'); el.mb = host.querySelector('#cadMBody'); el.toast = host.querySelector('#cadToast');
    el.full = host.querySelector('#cadFull'); el.ask = host.querySelector('#cadAsk');
    host.addEventListener('click', onClick);
    host.addEventListener('change', onChange);
    host.addEventListener('input', function (e) { if (e.target.dataset && e.target.dataset.bgop && doc.bg) { doc.bg.op = +e.target.value; draw(); } });
    el.panel.addEventListener('input', onPanelInput);
    el.panel.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    bindPointer();
    if (root.ResizeObserver) new ResizeObserver(resize).observe(host.querySelector('.cad-stage'));
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', function (e) {
      if (!host.offsetParent) return;
      if (/INPUT|TEXTAREA/.test((document.activeElement || {}).nodeName || '')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (e.key === 'Escape') setTool('select');
      else if ((e.key === 'Delete' || e.key === 'Backspace') && editing) { e.preventDefault(); delSel(); }
    });
    built = true; return true;
  }

  function onClick(e) {
    var t = e.target.closest('[data-tool]'); if (t) { setTool(t.dataset.tool); return; }
    var s = e.target.closest('[data-seg]'); if (s) { readPanel(); vals[s.dataset.seg] = s.dataset.v; picks = []; renderPanel(); preview(); return; }
    var a = e.target.closest('[data-a]'); if (!a) return;
    var fn = ACTIONS[a.dataset.a];
    if (fn) fn(a);
  }
  function startXf(e) { vals = { _t: 'xf' }; editing = e; FORMS.xf.seg.forEach(function (s) { vals[s[0]] = SEG_DEF[s[0]]; }); if (!e) vals.alvo = 'tudo'; renderPanel(); }
  var ACTIONS = {
    undo: function () { undo(); }, redo: function () { redo(); }, fit: function () { fit(); },
    files: function () { openFiles(); }, mclose: function () { closeModal(); }, menu: function () { openMenu(); },
    ok: function () { apply(); }, close: function () { if (vals._t === 'xf' && editing) return selectEnt(editing); setTool('select'); },
    del: function () { delSel(); }, dup: function () { dupSel(); },
    xf: function () { readPanel(); startXf(editing); },
    xfall: function () { closeModal(); setTool('select'); startXf(null); },
    g65: function () { g65For(editing); },
    origin0: function () { pushUndo(); doc.origin = { x: 0, y: 0 }; save(); toast(T('Origem voltou para o ponto inicial.')); draw(); },
    autodim: function () { closeModal(); autoDim(); },
    fsavebox: function () { openSave(); },
    rang: function (a) { readPanel(); vals.a = a.dataset.v; renderPanel(); draw(); },
    rclr: function () { rotSel = []; readPanel(); renderPanel(); draw(); },
    rpickc: function () { readPanel(); mode2 = 'rotc'; renderPanel(); toast(T('Toque no ponto que será o centro do giro.')); },
    ls: function (a) {
      var v = a.dataset.v; readPanel();
      if (editing && LS_OK[editing.t]) { pushUndo(); if (v === 'cont') delete editing.ls; else editing.ls = v; save(); toast(T('Tipo de linha') + ': ' + T(LS.filter(function (o) { return o[0] === v; })[0][1]).replace(/^\S+\s/, '')); }
      else curLs = v;
      renderPanel(); preview(); draw();
    },
    fnew: function () { leaveDoc(function () { askText(T('Nome do desenho'), T('Desenho') + ' ' + (Object.keys(store.docs).length + 1), function (nm) { var id = uid(); store.docs[id] = newDoc(nm.trim() || T('Desenho')); switchDoc(id); closeModal(); }); }); },
    fopen: function (a) { var id = a.dataset.id; if (id === store.cur) return closeModal(); leaveDoc(function () { switchDoc(id); closeModal(); }); },
    fsave: function () { doSave(false); },
    fsavecp: function () { doSave(true); },
    fpick: function (a) { saveFolder = a.dataset.f || ''; readSaveName(); openSave(true); },
    fnewdir: function () { readSaveName(); askText(T('Nome da pasta'), '', function (nm) { nm = nm.trim(); if (nm) { store.folders = store.folders || []; if (store.folders.indexOf(nm) < 0) store.folders.push(nm); saveFolder = nm; save(true); syncMeta(); } openSave(true); }); },
    fdirren: function (a) { var old = a.dataset.f; askText(T('Novo nome da pasta'), old, function (nm) { nm = nm.trim(); if (!nm || nm === old) return openFiles(); store.folders = (store.folders || []).map(function (f) { return f === old ? nm : f; }); Object.keys(store.docs).forEach(function (id) { if (store.docs[id].folder === old) { store.docs[id].folder = nm; dbPut(id); } }); if (openDir === old) openDir = nm; save(true); syncMeta(); openFiles(); }); },
    fdirdel: function (a) { var f = a.dataset.f; askOk(T('Apagar a pasta? Os desenhos dela vão para "Sem pasta".'), function () { store.folders = (store.folders || []).filter(function (x) { return x !== f; }); Object.keys(store.docs).forEach(function (id) { if (store.docs[id].folder === f) { delete store.docs[id].folder; dbPut(id); } }); save(true); syncMeta(); openFiles(); }); },
    fdir: function (a) { openDir = openDir === a.dataset.f ? null : a.dataset.f; openFiles(); },
    fdelid: function (a) {
      var id = a.dataset.id, d = store.docs[id]; if (!d) return;
      askOk(T('Apagar este desenho? Não dá para desfazer.') + ' (' + d.name + ')', function () {
        delete store.docs[id]; dbDel(id);
        if (id === store.cur) { var nid = uid(); store.docs[nid] = newDoc(T('Desenho') + ' ' + (Object.keys(store.docs).length + 1)); switchDoc(nid); }
        else save(true);
        openFiles();
      });
    },
    lvsave: function () { closeAsk(); doSave(false, leaveCb); },
    lvdrop: function () { var f = leaveCb; closeAsk(); if (!doc.saved) delete store.docs[store.cur]; else if (doc.snap) { var o = JSON.parse(doc.snap); o.bg = doc.bg; o.snap = doc.snap; store.docs[store.cur] = o; } if (f) f(); },
    lsel: function (a) { var en = byId(a.dataset.id); closeModal(); if (en) { selectEnt(en); fitTo([en]); draw(); } },
    list: function () { openList(); }, layers: function () { openLayers(); },
    lay: function (a) { doc.hide = doc.hide || {}; doc.hide[a.dataset.l] = !doc.hide[a.dataset.l]; save(); openLayers(); draw(); },
    clear: function () { if (!doc.ents.length) return; askOk(T('Apagar tudo do desenho?'), function () { pushUndo(); doc.ents = []; save(); closeModal(); setTool('select'); }); },
    askok: function () { var f = askCb, i = el.ask.querySelector('input'), v = i ? i.value : true; closeAsk(); if (f) f(v); },
    askno: function () { closeAsk(); },
    v3d: function () { closeModal(); open3D(); },
    exp: function () { openExport(); },
    xdxf: function () { exportDXF(); }, xpdf: function () { exportPDF(); }, xpng: function () { exportPNG(); }, xjson: function () { exportJSON(); },
    ijson: function () { closeModal(); pickFile('.json,application/json', importJSON); },
    bg: function () { openBg(); }, bgpick: function () { el.host.querySelector('#cadBgImg').click(); },
    bgcal: function () { closeModal(); setTool('select'); setMode2('calib'); }, bgzero: function () { closeModal(); setTool('select'); setMode2('bgzero'); },
    bgdel: function () { pushUndo(); delete doc.bg; bgImg = null; save(); closeModal(); draw(); },
    bgai: function () { closeModal(); if (doc.bg) agentSendPhoto(doc.bg.src); },
    agent: function () { openAgent(); }, agsend: function () { agentSend(); }, agphoto: function () { el.host.querySelector('#cadImg').click(); },
    agnophoto: function () { attach = null; var a = el.full.querySelector('#cadAtt'); if (a) a.classList.add('hidden'); },
    agstop: function () { if (agentBusy) agentBusy.abort(); },
    agapply: function (a) { applyPending(a.dataset.i); }, agcancel: function (a) { cancelPending(a.dataset.i); },
    agclear: function () { doc.chat = []; save(); renderChat(); },
    full_close: function () { closeFull(); }
  };
  function onChange(e) {
    var pk = e.target.dataset && e.target.dataset.pick;
    if (pk && e.target.files && e.target.files[0]) { var f = e.target.files[0]; e.target.value = ''; if (pk === 'bg') readImage(f, 1600, function (src) { setBg(src); }); else readImage(f, 1568, function (src) { agentAttach(src); }); return; }
    if (e.target.id === 'cadImg' && e.target.files[0]) { readImage(e.target.files[0], 1568, function (src) { agentAttach(src); }); e.target.value = ''; }
    if (e.target.id === 'cadBgImg' && e.target.files[0]) { readImage(e.target.files[0], 1600, function (src) { setBg(src); }); e.target.value = ''; }
    if (e.target.dataset && e.target.dataset.bgop && doc.bg) { doc.bg.op = +e.target.value; save(); draw(); }
    if (e.target.dataset && (e.target.dataset.kind3d != null || e.target.dataset.val3d != null || e.target.dataset.rb3d != null)) {
      var ix = +(e.target.dataset.kind3d != null ? e.target.dataset.kind3d : e.target.dataset.val3d != null ? e.target.dataset.val3d : e.target.dataset.rb3d), en = doc.ents[ix];
      var row = e.target.closest('.cad-dli'), kd = row.querySelector('select').value, pv = num(row.querySelector('input[data-val3d]').value), rbi = row.querySelector('input[data-rb3d]');
      if (en) { setKind(en, kd, pv, rbi ? num(rbi.value) : en.rb); save(); draw(); render3D(true); refreshDepth(); }
    }
    if (e.target.dataset && e.target.dataset.docf) { doc[e.target.dataset.docf] = e.target.value.trim(); save(); }
    if (e.target.dataset && e.target.dataset.sheet) { var au = sheetAuthors(); au[e.target.dataset.sheet] = e.target.value.trim(); try { localStorage.setItem(SHEET_KEY, JSON.stringify(au)); } catch (er) {} }
    if (e.target.dataset && e.target.dataset.esp != null) { var v = num(e.target.value); if (v > 0) { doc.esp = v; save(); render3D(true); } }
  }

  function switchDoc(id) { var pv = store.docs[store.cur]; if (pv && store.cur !== id && !pv.saved && !pv.ents.length) delete store.docs[store.cur]; store.cur = id; doc = store.docs[id]; undoS = []; redoS = []; sel = null; editing = null; bgImg = null; save(); el.name.textContent = doc.name; setTool('select'); updBtns(); fit(); }

  /* ---------- painel ---------- */
  function setTool(t) {
    tool = t; editing = null; sel = null; picks = []; mode2 = null; if (t === 'rot') rotSel = [];
    el.host.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === t); });
    if (t === 'select') { vals = {}; closePanel(true); ghost = null; draw(); return; }
    var keep = vals._t === t ? vals : null;
    vals = keep || { _t: t };
    (FORMS[t].seg || []).forEach(function (s) { if (vals[s[0]] == null) vals[s[0]] = SEG_DEF[s[0]]; });
    if (t === 'origin') { vals.dx = 0; vals.dy = 0; }
    renderPanel(); preview();
  }
  function fieldsOf(t) {
    var f = FORMS[t].fields(vals);
    f.forEach(function (x) { if (vals[x[0]] == null) vals[x[0]] = x[2]; });
    return f;
  }
  function formKey() { return vals._t === 'xf' ? 'xf' : editing ? (editing.t === 'dim' ? 'dimedit' : editing.cor ? 'filedit' : editing.t) : tool; }
  function lsRow(v) { return '<p class="cad-sub">' + esc(T('Tipo de linha')) + '</p><div class="cad-seg cad-ls">' + LS.map(function (o) { return '<button type="button" data-a="ls" data-v="' + o[0] + '" class="' + (v === o[0] ? 'on' : '') + '">' + esc(T(o[1])) + '</button>'; }).join('') + '</div>'; }
  function renderPanel() {
    var t = formKey(), F = FORMS[t], ed = editing && t !== 'xf';
    var h = '<div class="cad-ph"><b>' + esc(T(F.title)) + (ed ? ' · ' + esc(T('editar')) : '') + '</b><button type="button" class="cad-b" data-a="close" aria-label="Fechar">✕</button></div>';
    var hint = t === 'dim' ? DIM_HINT[vals.dk] : F.hint;
    if (!ed && hint) h += '<p class="cad-hint">' + esc(T(hint)) + '</p>';
    if (ed) h += '<p class="cad-hint notr">' + esc(describe(editing)) + '</p>';
    (F.seg || []).forEach(function (s) {
      if (t === 'dim' && s[0] === 'o' && vals.dk !== 'lin') return;
      if (t === 'dim' && s[0] === 'oz' && vals.dk !== 'zero') return;
      if (t === 'xf' && s[0] === 'mirax' && vals.op !== 'mir') return;
      if (t === 'xf' && s[0] === 'alvo' && !editing) return;
      if (t === 'rot' && s[0] === 'rfuro' && vals.ralvo !== 'sel') return;
      if (t === 'rot' && s[0] === 'rcen' && vals.ralvo !== 'sel' && vals.rcen === 'sel') vals.rcen = 'org';
      h += '<div class="cad-seg">' + s[1].map(function (o) { return '<button type="button" data-seg="' + s[0] + '" data-v="' + o[0] + '" class="' + (vals[s[0]] === o[0] ? 'on' : '') + '">' + esc(T(o[1])) + '</button>'; }).join('') + '</div>';
    });
    if (LS_OK[t] && !editing) h += lsRow(curLs);
    if (ORG_TOOLS[t] && !(t === 'holes' && vals.mode === 'lista')) h += orgChooser(t);
    if (t === 'rot') h += rotInfo();
    var ff = fieldsOf(t);
    if (ff.length) {
      h += '<div class="cad-fields">';
      ff.forEach(function (f) {
        var v = vals[f[0]];
        h += '<label class="cad-f' + (f[3] === 't' ? ' wide' : '') + '"><span>' + esc(T(f[1])) + '</span><input type="text"' + (f[3] === 't' ? '' : ' inputmode="decimal"') + ' autocomplete="off" data-k="' + f[0] + '" value="' + esc(typeof v === 'number' ? fmt(v) : v) + '"></label>';
      });
      h += '</div>';
    }
    if (ed && LS_OK[editing.t]) h += lsRow(editing.ls || 'cont');
    h += '<div class="cad-pbtn">';
    if (t === 'origin') h += '<button type="button" class="ui-btn" data-a="origin0">' + esc(T('Voltar ao início')) + '</button><button type="button" class="ui-btn primary" data-a="ok">' + esc(T('Mover origem')) + '</button>';
    else if (t === 'xf') h += '<button type="button" class="ui-btn primary wide" data-a="ok">' + esc(T('Aplicar')) + '</button>';
    else if (ed) {
      h += '<button type="button" class="ui-btn danger" data-a="del">' + esc(T('Apagar')) + '</button>';
      if (editing.t !== 'dim') h += '<button type="button" class="ui-btn" data-a="dup">' + esc(T('Duplicar')) + '</button><button type="button" class="ui-btn" data-a="xf">' + esc(T('Mover/Girar')) + '</button>';
      if (g65Kind(editing)) h += '<button type="button" class="ui-btn" data-a="g65">' + esc(g65Kind(editing) === 'g81' ? T('Programa G81') : 'G65') + '</button>';
      if (ff.length) h += '<button type="button" class="ui-btn primary" data-a="ok">' + esc(T('Salvar')) + '</button>';
    }
    else if (t === 'rot') h += (vals.rcen === 'pt' ? '<button type="button" class="ui-btn" data-a="rpickc">' + esc(T('Tocar no centro')) + '</button>' : '') + (vals.ralvo === 'sel' && rotSel.length ? '<button type="button" class="ui-btn" data-a="rclr">' + esc(T('Limpar escolha')) + '</button>' : '') + '<button type="button" class="ui-btn primary wide" data-a="ok">' + esc(T('Girar')) + '</button>';
    else if (t === 'dim') h += '<button type="button" class="ui-btn wide" data-a="autodim">' + esc(T('Cotar automático')) + '</button>';
    else if (t !== 'fillet') h += '<button type="button" class="ui-btn primary wide" data-a="ok">' + esc(T(t === 'holes' ? 'Adicionar furos' : 'Adicionar')) + '</button>';
    h += '</div>';
    if (t === 'xf' && !editing) h += '<p class="cad-hint">' + esc(T('Sem nada selecionado: vale para o desenho todo.')) + '</p>';
    el.panel.innerHTML = h; el.panel.classList.remove('hidden');
  }
  function closePanel(silent) { el.panel.classList.add('hidden'); el.panel.innerHTML = ''; if (!silent) draw(); }
  function readPanel() { el.panel.querySelectorAll('input[data-k]').forEach(function (i) { vals[i.dataset.k] = i.value; }); }
  function onPanelInput() { readPanel(); preview(); }
  function setField(k, v) { vals[k] = fmt(v); var i = el.panel.querySelector('input[data-k="' + k + '"]'); if (i) i.value = fmt(v); }

  function readVals(t) {
    var V = {}, bad = null;
    fieldsOf(t).forEach(function (f) {
      if (f[3] === 't') { V[f[0]] = String(vals[f[0]] || ''); return; }
      var raw = vals[f[0]];
      if (f[3] === 'o' && (raw == null || String(raw).trim() === '')) { V[f[0]] = null; return; }
      var n = num(raw); if (isNaN(n)) bad = bad || f[1]; V[f[0]] = n;
    });
    return bad ? { err: T('Confira o campo') + ': ' + T(bad) } : { V: V };
  }
  // monta a entidade a partir do painel; devolve {e} ou {err}
  function entFromVals(t) {
    var rv = readVals(t); if (rv.err) return rv;
    var V = rv.V, ox = doc.origin.x, oy = doc.origin.y, e;
    if (t === 'circle') { if (V.d <= 0) return { err: T('O diâmetro tem que ser maior que zero.') }; e = { t: 'circle', x: ox + V.x, y: oy + V.y, d: V.d }; }
    else if (t === 'rect') {
      var w = V.w, h = vals.forma === 'quad' ? V.w : V.h;
      if (w <= 0 || h <= 0) return { err: T('Largura e altura têm que ser maiores que zero.') };
      if (V.r < 0 || V.r > Math.min(w, h) / 2) return { err: T('O raio dos cantos não pode passar da metade do lado menor.') };
      var x = ox + V.x, y = oy + V.y; if (vals.ref === 'centro') { x -= w / 2; y -= h / 2; }
      e = { t: 'rect', x: x, y: y, w: w, h: h, r: V.r, ref: vals.ref };
    } else if (t === 'line') {
      var x1 = ox + V.x1, y1 = oy + V.y1, x2, y2;
      if (vals.modo === 'la') { if (V.l <= 0) return { err: T('O comprimento tem que ser maior que zero.') }; x2 = x1 + V.l * Math.cos(V.a * D2R); y2 = y1 + V.l * Math.sin(V.a * D2R); }
      else { x2 = ox + V.x2; y2 = oy + V.y2; }
      if (Math.hypot(x2 - x1, y2 - y1) < 1e-6) return { err: T('O ponto final é igual ao inicial.') };
      e = { t: 'line', x1: x1, y1: y1, x2: x2, y2: y2 };
    } else if (t === 'arc') {
      if (vals.modo === 'p3') {
        var p1 = [ox + V.x1, oy + V.y1], p2 = [ox + V.x2, oy + V.y2], p3 = [ox + V.x3, oy + V.y3], c = circle3(p1, p2, p3);
        if (!c) return { err: T('Os três pontos estão em linha reta.') };
        var b1 = Math.atan2(p1[1] - c.y, p1[0] - c.x) / D2R, b2 = Math.atan2(p2[1] - c.y, p2[0] - c.x) / D2R, b3 = Math.atan2(p3[1] - c.y, p3[0] - c.x) / D2R;
        var ccw = nang(b2 - b1) < nang(b3 - b1);
        var s0 = ccw ? b1 : b3, sw = ccw ? nang(b3 - b1) : nang(b1 - b3);
        e = { t: 'arc', x: c.x, y: c.y, r: c.r, a0: s0, a1: s0 + sw };
      } else {
        if (V.r <= 0) return { err: T('O raio tem que ser maior que zero.') };
        var sw2 = nang(V.a1 - V.a0); if (sw2 < 1e-9) sw2 = 360;
        e = { t: 'arc', x: ox + V.x, y: oy + V.y, r: V.r, a0: V.a0, a1: V.a0 + sw2 };
      }
    } else if (t === 'poly') {
      if (V.n < 3 || V.n % 1 || V.n > 64) return { err: T('O número de lados tem que ser inteiro, de 3 a 64.') };
      if (V.v <= 0) return { err: T('A medida tem que ser maior que zero.') };
      e = { t: 'poly', x: ox + V.x, y: oy + V.y, n: V.n, med: vals.med, v: V.v, ang: V.ang };
    } else if (t === 'holes') {
      if (V.d <= 0) return { err: T('O diâmetro do furo tem que ser maior que zero.') };
      var md = vals.mode;
      e = { t: 'holes', mode: md, d: V.d };
      if (md === 'lista') { e.pts = clone(editing.pts); e.x = e.pts[0][0]; e.y = e.pts[0][1]; }
      else { e.x = ox + V.x; e.y = oy + V.y; }
      if (md === 'pcd') { if (V.pcd <= 0 || V.n < 1 || V.n % 1) return { err: T('Confira o diâmetro do PCD e a quantidade (número inteiro).') }; e.pcd = V.pcd; e.n = V.n; e.a0 = V.a0; }
      else if (md === 'linha') { if (V.n < 1 || V.n % 1) return { err: T('A quantidade tem que ser um número inteiro.') }; e.n = V.n; e.dist = V.dist; e.ang = V.ang; }
      else if (md === 'grade') { if (V.nx < 1 || V.ny < 1 || V.nx % 1 || V.ny % 1) return { err: T('Colunas e linhas têm que ser números inteiros.') }; e.nx = V.nx; e.ny = V.ny; e.dx = V.dx; e.dy = V.dy; }
      if (holePts(e).length > 2000) return { err: T('Furos demais (máximo 2000).') };
    }
    if (e && V.prof != null) { if (V.prof <= 0) return { err: T('A profundidade tem que ser maior que zero (ou vazia = passante).') }; e.prof = V.prof; }
    return { e: e, V: V };
  }
  function valsFromEnt(e) {
    var o = doc.origin, v = { _t: e.t };
    if (e.t === 'circle') { v.x = e.x - o.x; v.y = e.y - o.y; v.d = e.d; }
    else if (e.t === 'rect') { v.forma = e.w === e.h ? 'quad' : 'ret'; v.ref = e.ref || 'canto'; v.x = e.x - o.x + (v.ref === 'centro' ? e.w / 2 : 0); v.y = e.y - o.y + (v.ref === 'centro' ? e.h / 2 : 0); v.w = e.w; v.h = e.h; v.r = e.r || 0; }
    else if (e.t === 'line') { v.modo = 'pts'; v.x1 = e.x1 - o.x; v.y1 = e.y1 - o.y; v.x2 = e.x2 - o.x; v.y2 = e.y2 - o.y; }
    else if (e.t === 'arc') { v.modo = 'cr'; v.x = e.x - o.x; v.y = e.y - o.y; v.r = e.r; v.a0 = nang(e.a0); v.a1 = nang(e.a1); }
    else if (e.t === 'poly') { v.x = e.x - o.x; v.y = e.y - o.y; v.n = e.n; v.med = e.med; v.v = e.v; v.ang = e.ang; }
    else if (e.t === 'holes') { ['mode', 'd', 'pcd', 'n', 'a0', 'dist', 'ang', 'nx', 'ny', 'dx', 'dy'].forEach(function (k) { if (e[k] != null) v[k] = e[k]; }); v.x = e.x - o.x; v.y = e.y - o.y; }
    else if (e.t === 'dim') v.txt = e.txt || '';
    if (e.cor) { v.tipo = e.cor.k; v.v = e.cor.v; v.v2 = e.cor.v2 != null ? e.cor.v2 : e.cor.v; }
    v.prof = e.prof != null ? e.prof : '';
    Object.keys(v).forEach(function (k) { if (typeof v[k] === 'number') v[k] = fmt(v[k]); });
    return v;
  }
  /* origem escolhida na criação da figura */
  var ORG_TOOLS = { rect: 'grid', circle: 'c', poly: 'c', arc: 'c', holes: 'c' };
  var ORG_NAMES = { bl: 'canto esquerdo embaixo', bc: 'meio embaixo', br: 'canto direito embaixo', ml: 'meio esquerdo', mc: 'centro', mr: 'meio direito', tl: 'canto esquerdo em cima', tc: 'meio em cima', tr: 'canto direito em cima', c: 'centro' };
  function orgChooser(t) {
    var v = vals.org || 'keep', h = '<div class="cad-org"><span>' + esc(T('Origem')) + ':</span>';
    h += '<button type="button" data-seg="org" data-v="keep" class="cad-org-keep' + (v === 'keep' ? ' on' : '') + '">' + esc(T('Não mudar')) + '</button>';
    if (ORG_TOOLS[t] === 'grid') {
      h += '<div class="cad-org-grid">' + ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map(function (k) { return '<button type="button" data-seg="org" data-v="' + k + '" class="' + (v === k ? 'on' : '') + '" aria-label="' + esc(T(ORG_NAMES[k])) + '"><i></i></button>'; }).join('') + '</div>';
    } else h += '<button type="button" data-seg="org" data-v="c" class="cad-org-keep' + (v === 'c' ? ' on' : '') + '">' + esc(T('No centro')) + '</button>';
    if (v !== 'keep') h += '<small>' + esc(T('nova origem')) + ': ' + esc(T(ORG_NAMES[v])) + '</small>';
    return h + '</div>';
  }
  function orgPoint(e, k) {
    if (!e || !k || k === 'keep') return null;
    if (e.t === 'rect') { var col = k[1], row = k[0]; return [e.x + (col === 'l' ? 0 : col === 'c' ? e.w / 2 : e.w), e.y + (row === 'b' ? 0 : row === 'm' ? e.h / 2 : e.h)]; }
    return [e.x, e.y];
  }
  function moveOrigin(e) {
    var k = vals.org, p = orgPoint(e, k); if (!p) return '';
    doc.origin = { x: p[0], y: p[1] }; vals.org = 'keep';
    return T('Origem posta') + ': ' + T(ORG_NAMES[k] || 'centro') + '.';
  }
  function refreshPos(e) {   // campos X/Y passam a mostrar a figura em relação à nova origem
    var o = doc.origin, x = e.x, y = e.y;
    if (e.t === 'rect' && vals.ref === 'centro') { x += e.w / 2; y += e.h / 2; }
    vals.x = fmt(x - o.x); vals.y = fmt(y - o.y);
  }
  function preview() {
    ghost = null;
    var t = formKey();
    if (['circle', 'rect', 'line', 'arc', 'poly', 'holes'].indexOf(t) >= 0 && (t !== 'arc' || vals.modo !== 'p3' || editing)) { var r = entFromVals(t); if (r.e) { ghost = r.e; var gl = editing ? editing.ls : curLs; if (gl && gl !== 'cont' && LS_OK[t]) ghost.ls = gl; } }
    if (t === 'line' && !editing && !picks.length && vals.modo !== 'la') ghost = null;
    draw();
  }
  function apply() {
    readPanel();
    var t = formKey();
    if (t === 'rot') return applyRot();
    if (t === 'origin') {
      var dx = num(vals.dx), dy = num(vals.dy);
      if (isNaN(dx) || isNaN(dy)) return toast(T('Confira os valores.'));
      if (!dx && !dy) return toast(T('Toque num ponto do desenho ou digite quanto mover.'));
      pushUndo(); doc.origin = { x: doc.origin.x + dx, y: doc.origin.y + dy }; save(); setField('dx', 0); setField('dy', 0); toast(T('Origem movida.')); draw(); return;
    }
    if (t === 'xf') return applyXf();
    if (t === 'dimedit') { pushUndo(); editing.txt = String(vals.txt || '').trim(); if (!editing.txt) delete editing.txt; save(); toast(T('Alterado.')); renderPanel(); draw(); return; }
    if (t === 'filedit') {
      var rv = readVals('filedit'); if (rv.err) return toast(rv.err);
      pushUndo(); var res = refillet(editing, rv.V.v, rv.V.v2);
      if (res) { restore(undoS.pop()); updBtns(); return toast(res); }
      save(); toast(T('Alterado.')); var ke = editing; selectEnt(ke); return;
    }
    var r = entFromVals(t); if (r.err) return toast(r.err);
    pushUndo();
    if (editing) {
      r.e.id = editing.id; var i = doc.ents.indexOf(editing); doc.ents[i] = r.e; editing = r.e; sel = r.e;
      var om2 = moveOrigin(r.e); save(); toast(T('Alterado.') + (om2 ? ' ' + om2 : ''));
      if (om2) vals = valsFromEnt(r.e);
      renderPanel(); preview(); return;
    }
    r.e.id = uid(); if (curLs !== 'cont' && LS_OK[r.e.t]) r.e.ls = curLs; doc.ents.push(r.e);
    var om = moveOrigin(r.e); save();
    toast((t === 'holes' ? holePts(r.e).length + ' ' + T('furo(s) adicionado(s).') : T('Adicionado.')) + (om ? ' ' + om : ''));
    if (om) { refreshPos(r.e); renderPanel(); }
    if (t === 'line') { var o = doc.origin; setField('x1', r.e.x2 - o.x); setField('y1', r.e.y2 - o.y); picks = [1]; }
    if (t === 'arc' && vals.modo === 'p3') picks = [];
    preview();
  }
  function selectEnt(e) {
    tool = 'select'; mode2 = null; picks = [];
    el.host.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === 'select'); });
    sel = e; editing = e; vals = valsFromEnt(e); renderPanel(); preview();
  }
  function delSel() {
    if (!editing) return; pushUndo(); doc.ents.splice(doc.ents.indexOf(editing), 1);
    save(); toast(T('Apagado.')); editing = null; sel = null; ghost = null; vals = {}; closePanel();
  }
  function dupSel() {
    if (!editing) return; pushUndo(); var c = clone(editing); c.id = uid(); var dd = 20 / view.s;
    var res = xfEnt(c, function (x, y) { return [x + dd, y - dd]; }, 0, null);
    res.forEach(function (n) { doc.ents.push(n); }); save(); toast(T('Duplicado. Mude a posição e toque em Salvar.')); selectEnt(res[0]);
  }

  /* ---------- mover / girar / espelhar ---------- */
  function mapAng(a, rot, mir) { if (mir === 'v') return 180 - a; if (mir === 'h') return -a; return a + rot; }
  // transforma a entidade no lugar; devolve lista de entidades (retângulo girado vira linhas)
  function xfEnt(e, f, rot, mir) {
    var p, q;
    delete e.cor;
    if (e.t === 'circle' || e.t === 'poly') { p = f(e.x, e.y); e.x = p[0]; e.y = p[1]; if (e.t === 'poly') e.ang = mapAng(e.ang, rot, mir); }
    else if (e.t === 'line') { p = f(e.x1, e.y1); q = f(e.x2, e.y2); e.x1 = p[0]; e.y1 = p[1]; e.x2 = q[0]; e.y2 = q[1]; }
    else if (e.t === 'arc') {
      p = f(e.x, e.y); e.x = p[0]; e.y = p[1];
      var sw = e.a1 - e.a0;
      if (mir) { var na0 = mapAng(e.a1, 0, mir); e.a0 = na0; e.a1 = na0 + sw; } else { e.a0 += rot; e.a1 += rot; }
    } else if (e.t === 'rect') {
      if (Math.abs(nang(rot + 45) % 90 - 45) > 1e-6) { var parts = explode(e); parts.forEach(function (n) { xfEnt(n, f, rot, mir); }); return parts; }
      p = f(e.x, e.y); q = f(e.x + e.w, e.y + e.h);
      e.x = Math.min(p[0], q[0]); e.y = Math.min(p[1], q[1]); e.w = Math.abs(q[0] - p[0]); e.h = Math.abs(q[1] - p[1]);
    } else if (e.t === 'holes') {
      if (e.mode === 'grade' && (rot || mir)) { e.pts = holePts(e); e.mode = 'lista'; ['nx', 'ny', 'dx', 'dy'].forEach(function (k) { delete e[k]; }); }
      if (e.mode === 'lista') { e.pts = e.pts.map(function (a) { return f(a[0], a[1]); }); e.x = e.pts[0][0]; e.y = e.pts[0][1]; }
      else { p = f(e.x, e.y); e.x = p[0]; e.y = p[1]; if (e.mode === 'pcd') e.a0 = mapAng(e.a0, rot, mir); if (e.mode === 'linha') e.ang = mapAng(e.ang, rot, mir); }
    } else if (e.t === 'dim') {
      [e.p1, e.p2, e.p, e.q, e.c].forEach(function (o) { if (!o) return; var r = f(o.x, o.y); o.x = r[0]; o.y = r[1]; });
      [e.l1, e.l2].forEach(function (l) { if (!l) return; var a = f(l.x1, l.y1), b = f(l.x2, l.y2); l.x1 = a[0]; l.y1 = a[1]; l.x2 = b[0]; l.y2 = b[1]; });
      ['t1', 't2'].forEach(function (k) { if (e[k]) e[k] = f(e[k][0], e[k][1]); });
      if (e.ang != null) e.ang = mapAng(e.ang, rot, mir);
      if (e.k === 'lin' && rot && e.o !== 'a') { var r9 = nang(rot); if (Math.abs(r9 - 90) < 1e-6 || Math.abs(r9 - 270) < 1e-6) e.o = e.o === 'h' ? 'v' : 'h'; else if (Math.abs(r9 - 180) > 1e-6) e.o = 'a'; }
    }
    return [e];
  }
  /* ---------- ferramenta Girar: desenho todo, ou elementos/furos escolhidos na tela ---------- */
  var rotSel = [];   // [{id, hi}] hi = índice do furo dentro do grupo (-1 = elemento inteiro)
  function rotInfo() {
    var a = [15, 30, 45, 90, 180, -90];
    var h = '<div class="cad-chips cad-rang">' + a.map(function (v) { return '<button type="button" class="ui-btn' + (num(vals.a) === v ? ' primary' : '') + '" data-a="rang" data-v="' + v + '">' + v + '°</button>'; }).join('') + '</div>';
    if (vals.ralvo === 'sel') h += '<p class="cad-hint">' + esc(rotSel.length ? rotSel.length + ' ' + T('escolhido(s). Toque de novo para tirar.') : T('Toque nos elementos que quer girar: um furo, as linhas do rasgo de chaveta, etc.')) + '</p>';
    if (mode2 === 'rotc') h += '<p class="cad-hint">' + esc(T('Toque no ponto que será o centro do giro.')) + '</p>';
    return h;
  }
  function holeAt(e, w) { var pts = holePts(e), bi = -1, bd = Infinity; pts.forEach(function (q, i) { var d = Math.hypot(q[0] - w[0], q[1] - w[1]); if (d < bd) { bd = d; bi = i; } }); return bi; }
  function rotTap(sx, sy) {
    if (mode2 === 'rotc') { var p = pickPoint(sx, sy); setField('cx', p.x - doc.origin.x); setField('cy', p.y - doc.origin.y); mode2 = null; renderPanel(); draw(); return; }
    if (vals.ralvo !== 'sel') return toast(T('Para girar só uma parte, escolha "Escolher na tela".'));
    var w0 = toW(sx, sy), e = null, tl = 12 / view.s;
    doc.ents.forEach(function (h) { if (e || h.t !== 'holes' || !vis(h)) return; holePts(h).forEach(function (q) { if (Math.hypot(q[0] - w0[0], q[1] - w0[1]) <= h.d / 2 + tl) e = h; }); });   // tocar dentro do furo também vale
    e = e || hitEnt(sx, sy); if (!e) return toast(T('Toque em cima de um elemento.'));
    if (e.t === 'dim') return;
    var hi = e.t === 'holes' && vals.rfuro === 'um' && holePts(e).length > 1 ? holeAt(e, toW(sx, sy)) : -1;
    var k = -1; rotSel.forEach(function (r, i) { if (r.id === e.id && (r.hi === hi || r.hi === -1 || hi === -1)) k = i; });
    if (k >= 0) rotSel.splice(k, 1); else rotSel.push({ id: e.id, hi: hi });
    readPanel(); renderPanel(); draw();
  }
  function rotCenter(V) {
    var o = doc.origin;
    if (vals.rcen === 'pt') return [o.x + V.cx, o.y + V.cy];
    if (vals.rcen === 'sel' && vals.ralvo === 'sel' && rotSel.length) {
      if (rotSel.length === 1) { var e = byId(rotSel[0].id); if (e && e.t === 'holes' && e.mode === 'pcd') return [e.x, e.y]; }
      var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      rotSel.forEach(function (r) { var e = byId(r.id); if (!e) return; var pts = r.hi >= 0 ? [holePts(e)[r.hi]] : null; if (pts) pts.forEach(function (q) { b.x0 = Math.min(b.x0, q[0]); b.x1 = Math.max(b.x1, q[0]); b.y0 = Math.min(b.y0, q[1]); b.y1 = Math.max(b.y1, q[1]); }); else { var bb = bounds([e]); b.x0 = Math.min(b.x0, bb.x0); b.x1 = Math.max(b.x1, bb.x1); b.y0 = Math.min(b.y0, bb.y0); b.y1 = Math.max(b.y1, bb.y1); } });
      if (isFinite(b.x0)) return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
    }
    return [o.x, o.y];
  }
  function rotTargets(cut) {   // devolve entidades a girar; com cut, separa os furos escolhidos do grupo
    if (vals.ralvo !== 'sel') return doc.ents.slice();
    var out = [], byE = {};
    rotSel.forEach(function (r) { (byE[r.id] = byE[r.id] || []).push(r.hi); });
    Object.keys(byE).forEach(function (id) {
      var e = byId(id); if (!e) return;
      var his = byE[id];
      if (his.indexOf(-1) >= 0 || e.t !== 'holes') { out.push(e); return; }
      var pts = holePts(e), pick = pts.filter(function (q, i) { return his.indexOf(i) >= 0; });
      if (pick.length === pts.length) { out.push(e); return; }
      var n = clone(e); ['pcd', 'n', 'a0', 'dist', 'ang', 'nx', 'ny', 'dx', 'dy'].forEach(function (k) { delete n[k]; });
      if (pick.length === 1) { n.mode = 'um'; n.x = pick[0][0]; n.y = pick[0][1]; delete n.pts; } else { n.mode = 'lista'; n.pts = pick; n.x = pick[0][0]; n.y = pick[0][1]; }
      if (cut) {
        n.id = uid();
        var rest = pts.filter(function (q, i) { return his.indexOf(i) < 0; });
        ['pcd', 'n', 'a0', 'dist', 'ang', 'nx', 'ny', 'dx', 'dy'].forEach(function (k) { delete e[k]; });
        if (vals.copia !== 'sim') { if (rest.length === 1) { e.mode = 'um'; e.x = rest[0][0]; e.y = rest[0][1]; delete e.pts; } else { e.mode = 'lista'; e.pts = rest; e.x = rest[0][0]; e.y = rest[0][1]; } }
        else { e.mode = 'lista'; e.pts = pts; e.x = pts[0][0]; e.y = pts[0][1]; }
        doc.ents.push(n); n._new = 1;
      }
      out.push(n);
    });
    return out;
  }
  function rotFn(V) { var c0 = rotCenter(V), c = Math.cos(V.a * D2R), sn = Math.sin(V.a * D2R); return function (x, y) { var dx = x - c0[0], dy = y - c0[1]; return [c0[0] + dx * c - dy * sn, c0[1] + dx * sn + dy * c]; }; }
  function rotGhosts() {
    if (tool !== 'rot') return [];
    var rv = readVals('rot'); if (rv.err || !rv.V.a) return [];
    var f = rotFn(rv.V), out = [];
    rotTargets(false).forEach(function (e) { if (e.t === 'dim') return; xfEnt(clone(e), f, rv.V.a, null).forEach(function (n) { out.push(n); }); });
    return out;
  }
  function applyRot() {
    var rv = readVals('rot'); if (rv.err) return toast(rv.err);
    if (!rv.V.a) return toast(T('Digite o ângulo.'));
    if (vals.ralvo === 'sel' && !rotSel.length) return toast(T('Toque nos elementos que quer girar.'));
    pushUndo();
    var f = rotFn(rv.V), copy = vals.copia === 'sim', tg = rotTargets(true);
    tg.forEach(function (e) {
      var src = copy && !e._new ? clone(e) : e; delete e._new;
      if (src !== e) src.id = uid();
      var res = xfEnt(src, f, rv.V.a, null);
      if (src !== e) res.forEach(function (n) { if (!n.id) n.id = uid(); doc.ents.push(n); });
      else if (!(res.length === 1 && res[0] === e)) { var i = doc.ents.indexOf(e); doc.ents.splice.apply(doc.ents, [i, 1].concat(res)); }
    });
    rotSel = []; save(); toast(T('Girado') + ' ' + fmt(rv.V.a) + '°.'); renderPanel(); draw();
  }
  function applyXf() {
    var rv = readVals('xf'); if (rv.err) return toast(rv.err);
    var V = rv.V, o = doc.origin, f, rot = 0, mir = null;
    if (vals.op === 'mov') { if (!V.dx && !V.dy) return toast(T('Digite quanto mover.')); f = function (x, y) { return [x + V.dx, y + V.dy]; }; }
    else if (vals.op === 'rot') {
      rot = V.a; var cx = o.x + V.cx, cy = o.y + V.cy, c = Math.cos(rot * D2R), s = Math.sin(rot * D2R);
      f = function (x, y) { var dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
    } else {
      mir = vals.mirax; var ax = (mir === 'v' ? o.x : o.y) + V.eixo;
      f = mir === 'v' ? function (x, y) { return [2 * ax - x, y]; } : function (x, y) { return [x, 2 * ax - y]; };
    }
    var targets = editing && vals.alvo !== 'tudo' ? [editing] : doc.ents.slice();
    if (!targets.length) return toast(T('Ainda não há nada no desenho.'));
    pushUndo();
    var copy = vals.copia === 'sim', idMap = {}, newIds = {};
    targets.forEach(function (e) {
      var src = copy ? clone(e) : e;
      if (copy) { idMap[e.id] = uid(); src.id = idMap[e.id]; newIds[src.id] = 1; }
      var res = xfEnt(src, f, rot, mir);
      if (copy) res.forEach(function (n) { if (!n.id) n.id = uid(); newIds[n.id] = 1; doc.ents.push(n); });
      else if (!(res.length === 1 && res[0] === e)) { var i = doc.ents.indexOf(e); doc.ents.splice.apply(doc.ents, [i, 1].concat(res)); }
    });
    // cotas copiadas apontam para os elementos copiados
    if (copy) doc.ents.forEach(function (e) { if (e.t !== 'dim' || !newIds[e.id]) return; [e.p1, e.p2, e.p, e.c, e.l1, e.l2].forEach(function (r) { if (r && r.ref && idMap[r.ref.id]) r.ref.id = idMap[r.ref.id]; }); });
    save(); toast(T('Pronto.'));
    var keep = editing && doc.ents.indexOf(editing) >= 0 ? editing : null;
    if (keep) selectEnt(keep); else setTool('select');
  }

  /* ---------- raio e chanfro no canto ---------- */
  function filletPick(sx, sy) {
    var w = toW(sx, sy), tol = 14 / view.s, best = null, bd = tol;
    doc.ents.forEach(function (e) {
      if (!vis(e) || ['line', 'rect', 'poly'].indexOf(e.t) < 0) return;
      prims(e).forEach(function (p, pi) { if (p.k !== 'l') return; var d = distPrim(p, w[0], w[1]); if (d < bd) { bd = d; best = { e: e, pi: pi, tap: w }; } });
    });
    return best;
  }
  function toLine(pk) {   // garante que a escolha é uma linha solta; retângulo/polígono viram linhas
    if (pk.e.t === 'line') return pk.e;
    var parts = explode(pk.e), i = doc.ents.indexOf(pk.e);
    doc.ents.splice.apply(doc.ents, [i, 1].concat(parts));
    return parts[pk.pi];
  }
  function cornerOf(L1, L2, t1, t2) {
    var I = lineX(L1.x1, L1.y1, L1.x2, L1.y2, L2.x1, L2.y1, L2.x2, L2.y2);
    if (!I) return null;
    function side(L, t) {
      var dx = L.x2 - L.x1, dy = L.y2 - L.y1, n = Math.hypot(dx, dy); dx /= n; dy /= n;
      var st = (t[0] - I[0]) * dx + (t[1] - I[1]) * dy, sg = st >= 0 ? 1 : -1;
      var s1 = ((L.x1 - I[0]) * dx + (L.y1 - I[1]) * dy) * sg, s2 = ((L.x2 - I[0]) * dx + (L.y2 - I[1]) * dy) * sg;
      return { u: [dx * sg, dy * sg], far: s1 >= s2 ? 1 : 2, len: Math.max(s1, s2) };
    }
    return { I: [I[0], I[1]], a: side(L1, t1), b: side(L2, t2) };
  }
  function setNear(L, far, p) { if (far === 1) { L.x2 = p[0]; L.y2 = p[1]; } else { L.x1 = p[0]; L.y1 = p[1]; } }
  function cornerGeom(C, k, v, v2) {
    var u1 = C.a.u, u2 = C.b.u, I = C.I;
    if (k === 'c') { var d1 = v, d2 = v2 == null ? v : v2; return { t1: [I[0] + u1[0] * d1, I[1] + u1[1] * d1], t2: [I[0] + u2[0] * d2, I[1] + u2[1] * d2], d1: d1, d2: d2 }; }
    var cosT = u1[0] * u2[0] + u1[1] * u2[1], th = Math.acos(Math.max(-1, Math.min(1, cosT)));
    if (th < 1e-6 || th > Math.PI - 1e-6) return null;
    var t = v / Math.tan(th / 2), bis = [u1[0] + u2[0], u1[1] + u2[1]], bl = Math.hypot(bis[0], bis[1]);
    bis = [bis[0] / bl, bis[1] / bl];
    var dc = v / Math.sin(th / 2), Cc = [I[0] + bis[0] * dc, I[1] + bis[1] * dc];
    var T1 = [I[0] + u1[0] * t, I[1] + u1[1] * t], T2 = [I[0] + u2[0] * t, I[1] + u2[1] * t];
    var aa = Math.atan2(T1[1] - Cc[1], T1[0] - Cc[0]) / D2R, ab = Math.atan2(T2[1] - Cc[1], T2[0] - Cc[0]) / D2R, sw = nang(ab - aa), a0 = aa;
    if (sw > 180) { sw = 360 - sw; a0 = ab; }
    return { t1: T1, t2: T2, d1: t, d2: t, c: Cc, a0: a0, a1: a0 + sw };
  }
  function doFillet(p1, p2, k, v, v2, quiet) {
    if (p1.e === p2.e && p1.pi === p2.pi) { if (!quiet) toast(T('Escolha duas linhas diferentes.')); return false; }
    if (v < 0 || (v2 != null && v2 < 0)) { if (!quiet) toast(T('O valor não pode ser negativo.')); return false; }
    var before = snap(), fail = function (m) { restore(before); if (!quiet) toast(m); return false; };
    var sameEnt = p1.e === p2.e;
    var L1 = toLine(p1), L2;
    if (sameEnt) L2 = doc.ents[doc.ents.indexOf(L1) - p1.pi + p2.pi]; else L2 = toLine(p2);
    var C = cornerOf(L1, L2, p1.tap, p2.tap);
    if (!C) return fail(T('As linhas são paralelas: não têm canto.'));
    var g = cornerGeom(C, k, v, v2);
    if (!g) return fail(T('Não dá para fazer raio nesse canto.'));
    if (g.d1 > C.a.len + 1e-6 || g.d2 > C.b.len + 1e-6) return fail(T('Valor grande demais para essas linhas.'));
    setNear(L1, C.a.far, g.t1); setNear(L2, C.b.far, g.t2);
    if (v > 0) {
      var meta = { k: k, v: v, v2: k === 'c' ? (v2 == null ? v : v2) : null, I: C.I, u1: C.a.u, u2: C.b.u, l1: L1.id, l2: L2.id };
      var n = k === 'c' ? { t: 'line', x1: g.t1[0], y1: g.t1[1], x2: g.t2[0], y2: g.t2[1] } : { t: 'arc', x: g.c[0], y: g.c[1], r: v, a0: g.a0, a1: g.a1 };
      n.id = uid(); n.cor = meta; doc.ents.push(n);
    }
    return true;
  }
  function filletFromTaps(p1, p2) {
    var rv = readVals('fillet'); if (rv.err) return toast(rv.err);
    var before = snap();
    if (doFillet(p1, p2, vals.tipo, rv.V.v, rv.V.v2)) {
      undoS.push(before); if (undoS.length > 120) undoS.shift(); redoS = []; updBtns(); save();
      toast(vals.tipo === 'c' ? T('Chanfro feito.') : rv.V.v > 0 ? T('Raio feito.') : T('Canto fechado.'));
    }
    picks = []; draw();
  }
  function refillet(e, v, v2) {
    var m = e.cor, L1 = byId(m.l1), L2 = byId(m.l2);
    if (!L1 || !L2) return T('As linhas desse canto foram apagadas.');
    if (!(v > 0)) return T('O valor tem que ser maior que zero.');
    var C = { I: m.I, a: { u: m.u1 }, b: { u: m.u2 } }, g = cornerGeom(C, m.k, v, v2);
    if (!g) return T('Não dá para fazer raio nesse canto.');
    function far(L, u) { var s1 = (L.x1 - m.I[0]) * u[0] + (L.y1 - m.I[1]) * u[1], s2 = (L.x2 - m.I[0]) * u[0] + (L.y2 - m.I[1]) * u[1]; return { far: s1 >= s2 ? 1 : 2, len: Math.max(s1, s2) }; }
    var f1 = far(L1, m.u1), f2 = far(L2, m.u2);
    if (g.d1 > f1.len + 1e-6 || g.d2 > f2.len + 1e-6) return T('Valor grande demais para essas linhas.');
    setNear(L1, f1.far, g.t1); setNear(L2, f2.far, g.t2);
    if (m.k === 'c') { e.x1 = g.t1[0]; e.y1 = g.t1[1]; e.x2 = g.t2[0]; e.y2 = g.t2[1]; m.v = v; m.v2 = v2 == null ? v : v2; }
    else { e.x = g.c[0]; e.y = g.c[1]; e.r = v; e.a0 = g.a0; e.a1 = g.a1; m.v = v; }
    return null;
  }

  /* ---------- cotas: escolha e automático ---------- */
  function circPick(sx, sy) {
    var w = toW(sx, sy), tol = 14 / view.s, best = null, bd = tol;
    doc.ents.forEach(function (e) {
      if (!vis(e) || e.t === 'dim') return;
      prims(e).forEach(function (p, pi) {
        if (p.k === 'l') return;
        var dd = Math.hypot(w[0] - p.x, w[1] - p.y), d = p.k === 'a' ? distPrim(p, w[0], w[1]) : Math.abs(dd - p.r);
        if (p.hole && dd < p.r) d = 0;
        if (d < bd) { bd = d; best = { e: e, pi: pi, p: p }; }
      });
    });
    return best;
  }
  function linePick(sx, sy) {
    var w = toW(sx, sy), tol = 14 / view.s, best = null, bd = tol;
    doc.ents.forEach(function (e) { if (!vis(e) || e.t === 'dim') return; prims(e).forEach(function (p, pi) { if (p.k !== 'l') return; var d = distPrim(p, w[0], w[1]); if (d < bd) { bd = d; best = { e: e, pi: pi, p: p, w: w }; } }); });
    return best;
  }
  /* cotas: furo e círculo sempre pelo centro (nunca pela borda/quadrante) */
  function centerRef(e, cx, cy) {
    var S = snapPts(e);
    for (var i = 0; i < S.length; i++) if (S[i][2] === 'centro' && Math.abs(S[i][0] - cx) < 1e-6 && Math.abs(S[i][1] - cy) < 1e-6) return { x: cx, y: cy, nm: e.t === 'holes' ? 'centro do furo' : 'centro', ref: { id: e.id, i: i }, ent: e };
    return { x: cx, y: cy, nm: 'centro', ref: null, ent: e };
  }
  function dimPick(sx, sy) {
    var w = toW(sx, sy), tol = (touchMode ? 22 : 12) / view.s, best = null, br = Infinity;
    doc.ents.forEach(function (e) {
      if (!vis(e) || e.t === 'dim') return;
      prims(e).forEach(function (p) {
        if (p.k !== 'c' || p.cl) return;
        var d = Math.hypot(w[0] - p.x, w[1] - p.y);
        // dentro do furo/círculo pequeno, ou em cima da borda dele
        if ((d <= p.r + tol && (e.t === 'holes' || p.r * view.s < 60)) || Math.abs(d - p.r) <= tol) { if (p.r < br) { br = p.r; best = { e: e, x: p.x, y: p.y }; } }
      });
    });
    if (best) return centerRef(best.e, best.x, best.y);
    var q = pickPoint(sx, sy);
    if (q.ent && (q.nm === 'quadrante' || q.nm === 'no furo' || q.nm === 'no círculo') && q.prim !== undefined) {
      var c = null; prims(q.ent).forEach(function (pp) { if (pp.k === 'c' && !pp.cl && Math.abs(Math.hypot(q.x - pp.x, q.y - pp.y) - pp.r) < 1e-3) c = pp; });
      if (c) return centerRef(q.ent, c.x, c.y);
    }
    if (q.ent && q.nm === 'quadrante') { var S = snapPts(q.ent), cc = null; S.forEach(function (t) { if (t[2] === 'centro' && Math.abs(Math.hypot(q.x - t[0], q.y - t[1]) - (q.ent.d || 0) / 2) < 1e-3) cc = t; }); if (cc) return centerRef(q.ent, cc[0], cc[1]); }
    return q;
  }
  function ptRef(p) { return { x: p.x, y: p.y, ref: p.ref || null, nm: p.nm || null, ent: p.ent || null, prim: p.prim || null }; }
  function cleanPt(p) { return { x: p.x, y: p.y, ref: p.ref || null }; }
  function addDim(d) { d.t = 'dim'; d.id = uid(); doc.ents.push(d); return d; }
  function autoDimCore() {
    doc.ents = doc.ents.filter(function (e) { return !(e.t === 'dim' && e.auto); });
    var n = 0;
    var body = doc.ents.filter(function (e) { return e.t !== 'dim' && e.t !== 'holes'; }), all = doc.ents.filter(function (e) { return e.t !== 'dim'; });
    var b = bounds(body.length ? body : all);
    if (!isFinite(b.x0)) return 0;
    var big = Math.max(b.x1 - b.x0, b.y1 - b.y0) || 100, off = big * 0.08 + 8;
    if (b.x1 - b.x0 > 1e-6) { addDim({ k: 'lin', o: 'h', p1: { x: b.x0, y: b.y0 }, p2: { x: b.x1, y: b.y0 }, q: { x: (b.x0 + b.x1) / 2, y: b.y0 - off }, auto: 1 }); n++; }
    if (b.y1 - b.y0 > 1e-6) { addDim({ k: 'lin', o: 'v', p1: { x: b.x0, y: b.y0 }, p2: { x: b.x0, y: b.y1 }, q: { x: b.x0 - off, y: (b.y0 + b.y1) / 2 }, auto: 1 }); n++; }
    doc.ents.slice().forEach(function (e) {
      if (e.t === 'circle') { addDim({ k: 'dia', c: { ref: { id: e.id, pi: 0 }, x: e.x, y: e.y, r: e.d / 2 }, ang: 45, auto: 1 }); n++; }
      else if (e.t === 'arc') { addDim({ k: 'rad', c: { ref: { id: e.id, pi: 0 }, x: e.x, y: e.y, r: e.r }, ang: (e.a0 + e.a1) / 2, auto: 1 }); n++; }
      else if (e.t === 'rect') {
        if (e.r) { addDim({ k: 'rad', c: { ref: { id: e.id, pi: 5 }, x: e.x, y: e.y, r: e.r }, ang: 45, auto: 1 }); n++; }
        if (body.length > 1 && (e.w < (b.x1 - b.x0) - 1e-6 || e.h < (b.y1 - b.y0) - 1e-6)) {
          var o2 = big * 0.04 + 4;
          addDim({ k: 'lin', o: 'h', p1: { x: e.x, y: e.y + e.h }, p2: { x: e.x + e.w, y: e.y + e.h }, q: { x: e.x, y: e.y + e.h + o2 }, auto: 1 });
          addDim({ k: 'lin', o: 'v', p1: { x: e.x + e.w, y: e.y }, p2: { x: e.x + e.w, y: e.y + e.h }, q: { x: e.x + e.w + o2, y: e.y }, auto: 1 }); n += 2;
        }
      } else if (e.t === 'poly') {
        var R = polyR(e), af = (e.ang + 180 / e.n) * D2R, ri = R * Math.cos(Math.PI / e.n), qa = af + Math.PI / 2, qd = R + big * 0.05;
        addDim({ k: 'lin', o: 'a', p1: { x: e.x - ri * Math.cos(af), y: e.y - ri * Math.sin(af) }, p2: { x: e.x + ri * Math.cos(af), y: e.y + ri * Math.sin(af) }, q: { x: e.x + qd * Math.cos(qa), y: e.y + qd * Math.sin(qa) }, auto: 1 }); n++;
      } else if (e.t === 'holes') {
        var pts = holePts(e), hp = e.mode === 'pcd' ? 1 : 0;
        addDim({ k: 'dia', c: { ref: { id: e.id, pi: hp }, x: pts[0][0], y: pts[0][1], r: e.d / 2 }, ang: e.mode === 'pcd' ? 45 : 225, auto: 1 }); n++;
        if (e.mode === 'pcd') { addDim({ k: 'dia', c: { ref: { id: e.id, pi: 0 }, x: e.x, y: e.y, r: e.pcd / 2 }, ang: e.a0 + 180 / e.n + 180, auto: 1 }); n++; }
        else if (pts.length <= 16) pts.forEach(function (q, i) { if (Math.hypot(q[0] - doc.origin.x, q[1] - doc.origin.y) < 1e-6) return; addDim({ k: 'ord', p: { x: q[0], y: q[1], ref: { id: e.id, i: i * 5 } }, auto: 1 }); n++; });
      }
    });
    return n;
  }
  function autoDim() { pushUndo(); var n = autoDimCore(); save(); toast(n + ' ' + T('cotas criadas.')); draw(); }

  /* ---------- toque na tela ---------- */
  function findSnap(sx, sy) {
    var R0 = touchMode ? 30 : 16, best = null, bd = R0;
    function chk(x, y, nm, ref, ent) { var s = toS(x, y), d = Math.hypot(s[0] - sx, s[1] - sy) * (nm === 'meio' || nm === 'quadrante' ? 1.6 : 1); if (d < bd - 0.01) { bd = d; best = { x: x, y: y, nm: nm, ref: ref || null, ent: ent || null }; } }
    chk(doc.origin.x, doc.origin.y, 'origem');
    var lines = [], all = [];
    doc.ents.forEach(function (e) {
      if ((editing && e === editing) || !vis(e) || e.t === 'dim') return;
      snapPts(e).forEach(function (p, i) { chk(p[0], p[1], p[2], { id: e.id, i: i }, e); });
      prims(e).forEach(function (p) { if (p.cl) return; if (all.length < 600) all.push({ p: p, e: e }); if (p.k === 'l' && lines.length < 300) lines.push(p); });
    });
    var w = toW(sx, sy), R = R0 / view.s;
    if (!best) {   // cruzamentos de linhas perto do dedo
      var near = lines.filter(function (p) { return distSeg(w[0], w[1], p.x1, p.y1, p.x2, p.y2) < R; });
      for (var i = 0; i < near.length; i++) for (var j = i + 1; j < near.length; j++) {
        var a = near[i], b = near[j], X = lineX(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2);
        if (X && X[2] > -1e-6 && X[2] < 1 + 1e-6 && X[3] > -1e-6 && X[3] < 1 + 1e-6) chk(X[0], X[1], 'cruzamento');
      }
    }
    if (!best) {   // ponto em cima da linha ou do círculo mais perto
      var bp = null, bdd = R;
      all.forEach(function (it) { var d = distPrim(it.p, w[0], w[1]); if (d < bdd) { bdd = d; bp = it; } });
      if (bp) {
        var p = bp.p, q;
        if (p.k === 'l') { var dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((w[0] - p.x1) * dx + (w[1] - p.y1) * dy) / L)) : 0; q = [p.x1 + t * dx, p.y1 + t * dy]; }
        else { var a = Math.atan2(w[1] - p.y, w[0] - p.x); q = [p.x + p.r * Math.cos(a), p.y + p.r * Math.sin(a)]; }
        best = { x: q[0], y: q[1], nm: p.k === 'l' ? 'na linha' : p.hole ? 'no furo' : 'no círculo', ref: null, ent: bp.e, prim: p };
      }
    }
    return best;
  }
  // linhas/círculos que acendem para mostrar de onde saiu o ponto
  function hlPrims(p) {
    if (!p || !p.ent) return [];
    if (p.prim) return [p.prim];
    var ps = prims(p.ent).filter(function (q) { return !q.cl; });
    var on = ps.filter(function (q) { return distPrim(q, p.x, p.y) < 1e-6; });
    if (on.length) return on;
    var cen = ps.filter(function (q) { return q.k !== 'l' && Math.hypot(q.x - p.x, q.y - p.y) < 1e-6; });
    return cen.length ? cen : ps;
  }
  function drawHl(p, label) {
    ctx.save(); ctx.strokeStyle = COL.pick; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.9;
    hlPrims(p).forEach(function (q) {
      ctx.beginPath();
      if (q.k === 'l') { var a = toS(q.x1, q.y1), b = toS(q.x2, q.y2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      else if (q.k === 'c') { var c = toS(q.x, q.y); ctx.arc(c[0], c[1], Math.max(q.r * view.s, 1), 0, 7); }
      else { var ca = toS(q.x, q.y); ctx.arc(ca[0], ca[1], q.r * view.s, -q.a0 * D2R, -q.a1 * D2R, true); }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    var s = toS(p.x, p.y);
    ctx.fillStyle = COL.pick; ctx.beginPath(); ctx.arc(s[0], s[1], 5.5, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    var txt = (label ? label + ' · ' : '') + T(p.nm || 'ponto livre');
    ctx.font = '600 12px system-ui, sans-serif'; var tw = ctx.measureText(txt).width, bx = Math.min(s[0] + 10, W - tw - 14), by = Math.max(s[1] - 38, 4);
    ctx.fillStyle = 'rgba(255,122,69,.95)'; ctx.fillRect(bx, by, tw + 10, 20);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, bx + 5, by + 10);
    ctx.restore();
  }
  var flash = null, flashT = 0;
  function flashPick(p) { flash = p; clearTimeout(flashT); flashT = setTimeout(function () { flash = null; draw(); }, 1600); }
  function gridStep() { var raw = 12 / view.s, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function pickPoint(sx, sy, raw) {
    var w = toW(sx, sy);
    if (raw) return { x: w[0], y: w[1], nm: null };
    var s = findSnap(sx, sy); if (s) return s;
    var g = Math.max(gridStep() / 2, 0.1), o = doc.origin;
    return { x: o.x + Math.round((w[0] - o.x) / g) * g, y: o.y + Math.round((w[1] - o.y) / g) * g, nm: null };
  }
  function hitEnt(sx, sy) {
    var w = toW(sx, sy), tol = 12 / view.s, best = null, bd = tol, k = 1 / view.s;
    for (var i = doc.ents.length - 1; i >= 0; i--) {
      var e = doc.ents[i]; if (!vis(e)) continue;
      if (e.t === 'dim') {
        var g = dimGeom(e, k);
        g.segs.forEach(function (s) { var d = distSeg(w[0], w[1], s[0], s[1], s[2], s[3]); if (d < bd) { bd = d; best = e; } });
        g.texts.forEach(function (t) { var d = Math.hypot(w[0] - t.x, w[1] - t.y) - t.h; if (d < bd) { bd = d; best = e; } });
        continue;
      }
      prims(e).forEach(function (p) { if (p.cl) return; var d = distPrim(p, w[0], w[1]); if (d < bd) { bd = d; best = e; } });
    }
    return best;
  }
  function setMode2(m) {
    mode2 = m; picks = [];
    if (m === 'calib') toast(T('Toque em dois pontos da foto com medida conhecida.'));
    if (m === 'bgzero') toast(T('Toque no ponto da foto que é o zero da peça.'));
    draw();
  }
  function onTap(sx, sy) {
    var o = doc.origin, p;
    if (mode2 === 'calib') {
      p = pickPoint(sx, sy, true); picks.push([p.x, p.y]); draw();
      if (picks.length === 2) {
        var d0 = Math.hypot(picks[1][0] - picks[0][0], picks[1][1] - picks[0][1]), p0 = picks[0];
        setMode2(null);
        askText(T('Distância real entre os dois pontos (mm)'), fmt(d0, 2), function (v) {
          var real = num(v); if (!(real > 0 && d0 > 0)) return toast(T('Confira os valores.'));
          pushUndo(); var k = real / d0, b = doc.bg; b.x = p0[0] + (b.x - p0[0]) * k; b.y = p0[1] + (b.y - p0[1]) * k; b.w *= k; save(); toast(T('Foto calibrada.')); fit();
        }, true);
      }
      return;
    }
    if (mode2 === 'bgzero') { p = pickPoint(sx, sy, true); pushUndo(); doc.bg.x += o.x - p.x; doc.bg.y += o.y - p.y; save(); toast(T('A foto foi movida para a origem.')); setMode2(null); return; }
    var t = editing || vals._t === 'xf' ? 'select' : tool;
    if (t === 'select') { var e = hitEnt(sx, sy); if (e) selectEnt(e); else { sel = null; editing = null; vals = {}; closePanel(); } return; }
    if (t === 'fillet') {
      var fp = filletPick(sx, sy); if (!fp) return toast(T('Toque em cima de uma linha.'));
      picks.push(fp); draw();
      if (picks.length === 2) { readPanel(); filletFromTaps(picks[0], picks[1]); }
      return;
    }
    if (t === 'dim') { dimTap(sx, sy); return; }
    if (t === 'rot') { rotTap(sx, sy); return; }
    p = pickPoint(sx, sy); flashPick(p);
    if (t === 'origin') { pushUndo(); doc.origin = { x: p.x, y: p.y }; save(); toast(T('Origem posta') + (p.nm ? ' (' + T(p.nm) + ')' : '') + '.'); draw(); return; }
    if (t === 'line') {
      if (vals.modo === 'la' || !picks.length) { setField('x1', p.x - o.x); setField('y1', p.y - o.y); picks = vals.modo === 'la' ? [] : [1]; preview(); return; }
      setField('x2', p.x - o.x); setField('y2', p.y - o.y); apply(); return;
    }
    if (t === 'arc' && vals.modo === 'p3') {
      var n = picks.length + 1; setField('x' + n, p.x - o.x); setField('y' + n, p.y - o.y); picks.push([p.x, p.y]);
      if (picks.length === 3) apply(); else draw();
      return;
    }
    setField('x', p.x - o.x); setField('y', p.y - o.y);
    preview();
  }
  function dimTap(sx, sy) {
    var dk = vals.dk, p;
    if (dk === 'lin') {
      if (picks.length < 2) {
        p = dimPick(sx, sy); picks.push(ptRef(p)); draw();
        toast((picks.length === 1 ? T('1º ponto') : T('2º ponto')) + ': ' + T(p.nm || 'ponto livre') + '. ' + T(picks.length === 1 ? 'Toque no 2º ponto.' : 'Toque onde a cota vai ficar.'));
        return;
      }
      var w = toW(sx, sy); pushUndo();
      addDim({ k: 'lin', o: vals.o, p1: cleanPt(picks[0]), p2: cleanPt(picks[1]), q: { x: w[0], y: w[1] } }); picks = []; save(); toast(T('Cota criada.')); draw(); return;
    }
    if (dk === 'dia' || dk === 'rad') {
      var c = circPick(sx, sy); if (!c) return toast(T('Toque em cima de um círculo, furo ou arco.'));
      var w2 = toW(sx, sy), ang = Math.atan2(w2[1] - c.p.y, w2[0] - c.p.x) / D2R;
      if (Math.hypot(w2[0] - c.p.x, w2[1] - c.p.y) < c.p.r * 0.3) ang = 45;
      pushUndo(); addDim({ k: dk, c: { ref: { id: c.e.id, pi: c.pi }, x: c.p.x, y: c.p.y, r: c.p.r }, ang: ang }); save(); toast(T('Cota criada.')); draw(); return;
    }
    if (dk === 'ang') {
      if (picks.length < 2) { var l = linePick(sx, sy); if (!l) return toast(T('Toque em cima de uma linha.')); picks.push(l); draw(); return; }
      var w3 = toW(sx, sy), a = picks[0], b = picks[1];
      var I = lineX(a.p.x1, a.p.y1, a.p.x2, a.p.y2, b.p.x1, b.p.y1, b.p.x2, b.p.y2);
      if (!I) { picks = []; draw(); return toast(T('As linhas são paralelas: não têm canto.')); }
      pushUndo();
      addDim({ k: 'ang', l1: { ref: { id: a.e.id, pi: a.pi }, x1: a.p.x1, y1: a.p.y1, x2: a.p.x2, y2: a.p.y2 }, l2: { ref: { id: b.e.id, pi: b.pi }, x1: b.p.x1, y1: b.p.y1, x2: b.p.x2, y2: b.p.y2 }, t1: a.w, t2: b.w, rr: Math.hypot(w3[0] - I[0], w3[1] - I[1]) });
      picks = []; save(); toast(T('Cota criada.')); draw(); return;
    }
    if (dk === 'zero') {   // cota do zero da peça até o ponto tocado, em X e/ou em Y, empilhadas fora da peça
      p = dimPick(sx, sy); flashPick(p);
      var o = doc.origin, b = bounds(doc.ents.filter(function (e) { return e.t !== 'dim' && vis(e); })), span = isFinite(b.x0) ? Math.max(b.x1 - b.x0, b.y1 - b.y0) : 100, st = Math.max(span * 0.07, 14 / view.s);
      var zs = doc.ents.filter(function (e) { return e.t === 'dim' && e.zero; }), nh = zs.filter(function (e) { return e.o === 'h'; }).length, nv = zs.filter(function (e) { return e.o === 'v'; }).length;
      var org = { x: o.x, y: o.y, ref: { org: 1 } }, made = 0;
      if (!((vals.oz !== 'v' && Math.abs(p.x - o.x) > 1e-6) || (vals.oz !== 'h' && Math.abs(p.y - o.y) > 1e-6))) return toast(T('Esse ponto é o próprio X0 Y0.'));
      pushUndo();
      if (vals.oz !== 'v' && Math.abs(p.x - o.x) > 1e-6) { addDim({ k: 'lin', o: 'h', zero: 1, p1: cleanPt(org), p2: cleanPt(p), q: { x: p.x, y: Math.min(b.y0, o.y) - st * (nh + 1) } }); made++; }
      if (vals.oz !== 'h' && Math.abs(p.y - o.y) > 1e-6) { addDim({ k: 'lin', o: 'v', zero: 1, p1: cleanPt(org), p2: cleanPt(p), q: { x: Math.min(b.x0, o.x) - st * (nv + 1), y: p.y } }); made++; }
      save(); toast(T('Cota criada.') + ' (' + T(p.nm || 'ponto livre') + ')'); draw(); return;
    }
    if (dk === 'ord') { p = dimPick(sx, sy); flashPick(p); pushUndo(); addDim({ k: 'ord', p: cleanPt(p) }); save(); toast(T('Cota criada.') + ' (' + T(p.nm || 'ponto livre') + ')'); draw(); }
  }

  function bindPointer() {
    var cv = el.cv, P = {}, start = null, moved = false, pinch = null;
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) {
      touchMode = e.pointerType !== 'mouse';
      cv.setPointerCapture(e.pointerId); P[e.pointerId] = [e.offsetX, e.offsetY];
      var ids = Object.keys(P);
      if (ids.length === 1) { start = { x: e.offsetX, y: e.offsetY, cx: view.cx, cy: view.cy }; moved = false; pinch = null; }
      else if (ids.length === 2) {
        var a = P[ids[0]], b = P[ids[1]];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s: view.s, w: toW((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
        moved = true;
      }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!P[e.pointerId]) { hoverAt(e.offsetX, e.offsetY); return; }
      P[e.pointerId] = [e.offsetX, e.offsetY];
      var ids = Object.keys(P);
      if (ids.length >= 2 && pinch) {
        var a = P[ids[0]], b = P[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        view.s = clampS(pinch.s * d / pinch.d);
        view.cx = pinch.w[0] - (m[0] - W / 2) / view.s; view.cy = pinch.w[1] + (m[1] - H / 2) / view.s; draw(); return;
      }
      if (!start) return;
      var dx = e.offsetX - start.x, dy = e.offsetY - start.y;
      if (!moved && Math.hypot(dx, dy) > 7) moved = true;
      if (moved) { view.cx = start.cx - dx / view.s; view.cy = start.cy + dy / view.s; draw(); }
      if (e.pointerType !== 'mouse') hoverAt(e.offsetX, e.offsetY);
    });
    function up(e) {
      if (!P[e.pointerId]) return;
      delete P[e.pointerId];
      var left = Object.keys(P).length;
      if (!left) { if (!moved && start) onTap(start.x, start.y); start = null; pinch = null; }
      else if (left === 1) { var id = Object.keys(P)[0]; start = { x: P[id][0], y: P[id][1], cx: view.cx, cy: view.cy }; pinch = null; }
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = null; snapHit = null; draw(); } });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault(); var w = toW(e.offsetX, e.offsetY);
      view.s = clampS(view.s * Math.exp(-e.deltaY * 0.0015));
      view.cx = w[0] - (e.offsetX - W / 2) / view.s; view.cy = w[1] + (e.offsetY - H / 2) / view.s; draw();
    }, { passive: false });
  }
  function clampS(s) { return Math.max(0.005, Math.min(400, s)); }
  function hoverAt(sx, sy) {
    var noSnap = (tool === 'select' && !mode2) || editing || mode2 || tool === 'fillet';
    var p = noSnap ? null : (tool === 'dim' && (vals.dk === 'lin' || vals.dk === 'ord' || vals.dk === 'zero') && !(vals.dk === 'lin' && picks.length >= 2)) ? dimPick(sx, sy) : pickPoint(sx, sy);
    snapHit = p && p.nm ? p : null;
    var w = p ? [p.x, p.y] : toW(sx, sy), r = rel(w[0], w[1]);
    hover = { x: w[0], y: w[1] };
    el.xy.textContent = 'X ' + fmt(r[0], 2) + '   Y ' + fmt(r[1], 2) + (snapHit ? '   · ' + T(snapHit.nm) : '');
    draw();
  }

  /* ---------- desenho ---------- */
  var COL_SCREEN = { bg: '#050b16', g1: 'rgba(120,170,255,.07)', g2: 'rgba(120,170,255,.16)', ax: 'rgba(255,90,90,.55)', ay: 'rgba(90,220,140,.55)',
    ent: '#e8f1ff', hole: '#66b8ff', cl: 'rgba(255,120,120,.75)', sel: '#ff7a45', ghost: '#4aa0ff', snap: '#ffe14a', dim: '#ffd84a', pick: '#ff7a45', org: '#fff' };
  var COL_PRINT = { bg: '#ffffff', ent: '#0d0d0d', hole: '#0d0d0d', cl: '#b3261e', dim: '#12336b', sel: '#111', ghost: '#111', org: '#111' };
  var COL = COL_SCREEN;
  var raf = 0, bgImg = null;
  function draw() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); }); }
  function resize() {
    if (!el.cv) return; var st = el.cv.parentNode, r = st.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (W && H && !firstFit) { view.cx += (r.width - W) / 2 / view.s; view.cy += (H - r.height) / 2 / view.s; }   // mantém o canto de cima parado
    W = r.width; H = r.height;
    el.cv.width = Math.round(W * dpr); el.cv.height = Math.round(H * dpr); el.cv.style.width = W + 'px'; el.cv.style.height = H + 'px';
    if (firstFit) { firstFit = false; fit(); } else draw();
  }
  function fitTo(list, pad) {
    var b = bounds(list);
    if (!isFinite(b.x0)) { view.cx = doc.origin.x; view.cy = doc.origin.y; view.s = Math.min(W, H) / 250 || 2; return; }
    pad = pad || 60;
    for (var it = 0; it < 2; it++) {   // a segunda volta cabe as cotas também (o tamanho delas depende do zoom)
      var bb = it ? bounds(list, pxk / view.s) : b;
      if (!isFinite(bb.x0)) break;
      var w = Math.max(bb.x1 - bb.x0, 1), h = Math.max(bb.y1 - bb.y0, 1);
      view.s = clampS(Math.min((W - pad) / w, (H - pad) / h)); view.cx = (bb.x0 + bb.x1) / 2; view.cy = (bb.y0 + bb.y1) / 2;
    }
  }
  function fit() {
    if (!doc) return;
    var list = doc.ents.filter(vis);
    if (!list.length && doc.bg) { var b = doc.bg, hh = b.w * (b.ih / b.iw); view.cx = b.x; view.cy = b.y; view.s = clampS(Math.min((W - 40) / b.w, (H - 40) / hh)); draw(); return; }
    fitTo(list); if (!list.length) { view.cx = doc.origin.x; view.cy = doc.origin.y; } draw();
  }

  function paint() {
    if (!ctx || !W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    var o = doc.origin, os = toS(o.x, o.y);
    // foto de fundo
    if (doc.bg && !(doc.hide || {}).foto && !printMode) {
      if (!bgImg || bgImg._src !== doc.bg.src) { bgImg = new Image(); bgImg._src = doc.bg.src; bgImg.onload = draw; bgImg.src = doc.bg.src; }
      if (bgImg.complete && bgImg.naturalWidth) {
        var b = doc.bg, hh = b.w * bgImg.naturalHeight / bgImg.naturalWidth, tl = toS(b.x - b.w / 2, b.y + hh / 2);
        ctx.globalAlpha = b.op == null ? 0.5 : b.op; ctx.drawImage(bgImg, tl[0], tl[1], b.w * view.s, hh * view.s); ctx.globalAlpha = 1;
      }
    }
    if (!printMode) {
      // grade (em relação à origem)
      var g = gridStep(), G = g * 10, tlw = toW(0, 0), br = toW(W, H);
      [[g, COL.g1], [G, COL.g2]].forEach(function (L) {
        var st = L[0]; if (st * view.s < 5) return;
        ctx.strokeStyle = L[1]; ctx.lineWidth = 1; ctx.beginPath();
        for (var x = o.x + Math.ceil((tlw[0] - o.x) / st) * st; x <= br[0]; x += st) { var sx = Math.round(toS(x, 0)[0]) + 0.5; ctx.moveTo(sx, 0); ctx.lineTo(sx, H); }
        for (var y = o.y + Math.ceil((br[1] - o.y) / st) * st; y <= tlw[1]; y += st) { var sy = Math.round(toS(0, y)[1]) + 0.5; ctx.moveTo(0, sy); ctx.lineTo(W, sy); }
        ctx.stroke();
      });
      ctx.lineWidth = 1; ctx.strokeStyle = COL.ax; ctx.beginPath(); ctx.moveTo(0, os[1]); ctx.lineTo(W, os[1]); ctx.stroke();
      ctx.strokeStyle = COL.ay; ctx.beginPath(); ctx.moveTo(os[0], 0); ctx.lineTo(os[0], H); ctx.stroke();
    }
    // elementos
    doc.ents.forEach(function (e) { if (!vis(e) || e.t === 'dim') return; if (e === editing && ghost) return; drawEnt(e, e === sel ? COL.sel : null); });
    doc.ents.forEach(function (e) { if (!vis(e) || e.t !== 'dim') return; drawDim(e, e === sel ? COL.sel : COL.dim); });
    if (ghost && !printMode) {
      if (!editing) ctx.setLineDash([6, 4]); drawEnt(ghost, editing ? COL.sel : COL.ghost); ctx.setLineDash([]);
      var op = orgPoint(ghost, vals.org);
      if (op) { var q = toS(op[0], op[1]); ctx.strokeStyle = COL.pick; ctx.fillStyle = COL.pick; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], 8, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.arc(q[0], q[1], 8, -Math.PI / 2, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.arc(q[0], q[1], 8, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill(); ctx.font = '600 11px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(T('nova origem'), q[0] + 11, q[1] - 10); }
    }
    if (!printMode && tool === 'rot') {
      if (vals.ralvo === 'sel') rotSel.forEach(function (r) {
        var e = byId(r.id); if (!e) return;
        if (r.hi >= 0) { var q = holePts(e)[r.hi]; if (q) drawEnt({ t: 'holes', mode: 'um', x: q[0], y: q[1], d: e.d }, COL.sel); }
        else drawEnt(e, COL.sel);
      });
      ctx.save(); ctx.setLineDash([6, 4]); rotGhosts().forEach(function (g) { drawEnt(g, COL.ghost); }); ctx.restore();
      var rr = readVals('rot'); if (!rr.err) { var cc = toS.apply(null, rotCenter(rr.V)); ctx.strokeStyle = COL.pick; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cc[0], cc[1], 6, 0, 7); ctx.moveTo(cc[0] - 10, cc[1]); ctx.lineTo(cc[0] + 10, cc[1]); ctx.moveTo(cc[0], cc[1] - 10); ctx.lineTo(cc[0], cc[1] + 10); ctx.stroke(); }
    }
    if (!printMode) drawPicks();
    // símbolo da origem
    var rO = 7 * pxk;
    ctx.strokeStyle = COL.org; ctx.lineWidth = 1.5 * pxk; ctx.beginPath(); ctx.arc(os[0], os[1], rO, 0, 7); ctx.stroke();
    ctx.fillStyle = COL.org; ctx.beginPath(); ctx.moveTo(os[0], os[1]); ctx.arc(os[0], os[1], rO, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(os[0], os[1]); ctx.arc(os[0], os[1], rO, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
    ctx.font = '600 ' + (11 * pxk) + 'px system-ui, sans-serif'; ctx.fillStyle = COL.org; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('X0 Y0', os[0] + 10 * pxk, os[1] - 9 * pxk);
    if (printMode) return;
    if (flash && !(tool === 'dim' && vals.dk === 'lin')) drawHl(flash);
    if (snapHit) { var sp = toS(snapHit.x, snapHit.y); ctx.strokeStyle = COL.snap; ctx.lineWidth = 2; ctx.strokeRect(sp[0] - 6, sp[1] - 6, 12, 12); }
    else if (hover && (tool !== 'select' || mode2)) { var hp = toS(hover.x, hover.y); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hp[0] - 8, hp[1]); ctx.lineTo(hp[0] + 8, hp[1]); ctx.moveTo(hp[0], hp[1] - 8); ctx.lineTo(hp[0], hp[1] + 8); ctx.stroke(); }
    if (mode2) { ctx.fillStyle = 'rgba(255,122,69,.95)'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(T(mode2 === 'calib' ? 'Calibrar: toque em 2 pontos' : mode2 === 'rotc' ? 'Toque no centro do giro' : 'Toque no zero da peça na foto'), W / 2, H - 14); }
    if (!hover) el.xy.textContent = T('grade') + ' ' + fmt(gridStep()) + ' mm';
  }
  function drawPicks() {
    var o = doc.origin;
    ctx.fillStyle = COL.pick; ctx.strokeStyle = COL.pick;
    function dot(x, y) { var p = toS(x, y); ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, 7); ctx.fill(); }
    if (mode2 === 'calib') picks.forEach(function (p) { dot(p[0], p[1]); });
    if (mode2) return;
    if (tool === 'line' && !editing && picks.length) dot(o.x + num(vals.x1), o.y + num(vals.y1));
    if (tool === 'arc' && vals.modo === 'p3') picks.forEach(function (p) { dot(p[0], p[1]); });
    if (tool === 'fillet' || (tool === 'dim' && vals.dk === 'ang')) picks.forEach(function (pk) { var p = prims(pk.e)[pk.pi]; if (!p) return; ctx.lineWidth = 3; var a = toS(p.x1, p.y1), b = toS(p.x2, p.y2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    if (tool === 'dim' && vals.dk === 'lin') {
      picks.forEach(function (p, i) { drawHl(p, i ? '2º' : '1º'); });
      if (picks.length === 2 && hover) drawDim({ t: 'dim', k: 'lin', o: vals.o, p1: picks[0], p2: picks[1], q: { x: hover.x, y: hover.y } }, COL.ghost);
    }
  }
  function drawEnt(e, col) {
    var showCl = !(doc.hide || {}).centro;
    prims(e).forEach(function (p) {
      ctx.beginPath();
      if (p.cl) { if (!showCl) return; ctx.save(); ctx.setLineDash([10 * pxk, 3 * pxk, 2 * pxk, 3 * pxk]); ctx.strokeStyle = col || COL.cl; ctx.lineWidth = 1 * pxk; var c = toS(p.x, p.y); ctx.arc(c[0], c[1], p.r * view.s, 0, 7); ctx.stroke(); ctx.restore(); return; }
      ctx.strokeStyle = col || (p.hole ? COL.hole : COL.ent); ctx.lineWidth = (printMode ? 2.6 : col === COL.sel ? 2.4 : 1.6) * pxk;
      var dsh = e.ls && e.ls !== 'cont';
      if (dsh) { ctx.save(); ctx.setLineDash(lsDash(e.ls, pxk)); ctx.lineCap = e.ls === 'pont' ? 'round' : 'butt'; if (e.ls === 'pont') ctx.lineWidth *= 1.35; }
      if (p.k === 'l') { var a = toS(p.x1, p.y1), b = toS(p.x2, p.y2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      else if (p.k === 'c') { var cc = toS(p.x, p.y); ctx.arc(cc[0], cc[1], Math.max(p.r * view.s, 0.5), 0, 7); }
      else { var ca = toS(p.x, p.y); ctx.arc(ca[0], ca[1], p.r * view.s, -p.a0 * D2R, -p.a1 * D2R, true); }
      ctx.stroke(); if (dsh) ctx.restore();
      if (p.k === 'c' && showCl) {
        var q = toS(p.x, p.y), L = Math.min(Math.max(p.r * view.s + 4 * pxk, 5 * pxk), 14 * pxk);
        ctx.save(); ctx.strokeStyle = col || COL.cl; ctx.lineWidth = 1 * pxk; ctx.beginPath(); ctx.moveTo(q[0] - L, q[1]); ctx.lineTo(q[0] + L, q[1]); ctx.moveTo(q[0], q[1] - L); ctx.lineTo(q[0], q[1] + L); ctx.stroke(); ctx.restore();
      }
    });
    if ((e.t === 'poly' || e.t === 'arc') && showCl) { var cp = toS(e.x, e.y), Lp = 6 * pxk; ctx.save(); ctx.strokeStyle = col || COL.cl; ctx.lineWidth = 1 * pxk; ctx.beginPath(); ctx.moveTo(cp[0] - Lp, cp[1]); ctx.lineTo(cp[0] + Lp, cp[1]); ctx.moveTo(cp[0], cp[1] - Lp); ctx.lineTo(cp[0], cp[1] + Lp); ctx.stroke(); ctx.restore(); }
  }
  function drawDim(e, col) {
    var g = dimGeom(e, pxk / view.s);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1 * pxk;
    ctx.beginPath(); g.segs.forEach(function (s) { var a = toS(s[0], s[1]), b = toS(s[2], s[3]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }); ctx.stroke();
    g.arcs.forEach(function (a) { var c = toS(a.x, a.y); ctx.beginPath(); ctx.arc(c[0], c[1], a.r * view.s, -a.a0 * D2R, -a.a1 * D2R, true); ctx.stroke(); });
    g.tris.forEach(function (t) { var a = toS(t[0], t[1]), b = toS(t[2], t[3]), c = toS(t[4], t[5]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); });
    g.texts.forEach(function (t) {
      var p = toS(t.x, t.y); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-t.rot * D2R);
      ctx.font = '600 ' + (t.h * view.s) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var tw = ctx.measureText(t.s).width; ctx.fillStyle = printMode ? '#fff' : 'rgba(5,11,22,.75)'; ctx.fillRect(-tw / 2 - 2, -t.h * view.s * 0.55, tw + 4, t.h * view.s * 1.1); ctx.fillStyle = col;
      ctx.fillText(t.s, 0, 0); ctx.restore();
    });
  }

  /* ---------- janelas ---------- */
  function openModal(title, html) { el.mt.textContent = title; el.mb.innerHTML = html; el.modal.classList.remove('hidden'); }
  function closeModal() { el.modal.classList.add('hidden'); }
  /* o input de arquivo fica por cima do botão (toque direto nele): funciona também no app do Claude no Android */
  function pickIn(k) { return '<input type="file" accept="image/*" class="cad-over" data-pick="' + k + '">'; }
  function fileBtn(forId, label, cls) { return '<span class="ui-btn cad-pickw ' + (cls || '') + '">' + esc(T(label)) + pickIn(forId === 'cadBgImg' ? 'bg' : 'ag') + '</span>'; }
  function btn(a, label, cls, extra) { return '<button type="button" class="ui-btn ' + (cls || '') + '" data-a="' + a + '"' + (extra || '') + '>' + esc(T(label)) + '</button>'; }
  function openMenu() {
    openModal(T('Opções'), '<div class="cad-menu">' +
      btn('list', 'Lista de elementos') + btn('layers', 'Camadas') + btn('autodim', 'Cotar automático') + btn('v3d', 'Ver em 3D') +
      btn('xfall', 'Mover / girar / espelhar tudo') + btn('exp', 'Exportar / salvar arquivo') + btn('bg', 'Foto de fundo') + btn('fnew', '+ Novo desenho') + btn('fsavebox', 'Salvar desenho') + btn('files', 'Desenhos salvos') + btn('clear', 'Apagar tudo', 'danger') + '</div>');
  }
  function openList() {
    var h = '';
    var list = doc.ents.filter(function (e) { return e.t !== 'dim'; }), dims = doc.ents.filter(function (e) { return e.t === 'dim'; });
    if (!doc.ents.length) h = '<p class="cad-hint">' + esc(T('Ainda não há nada no desenho.')) + '</p>';
    else {
      h += '<p class="cad-hint">' + esc(T('Medidas em relação à origem X0 Y0. Toque num item para editar.')) + '</p><div class="cad-list">';
      list.forEach(function (e) {
        h += '<button type="button" class="cad-li" data-a="lsel" data-id="' + e.id + '"><b class="notr">' + esc(describe(e)) + '</b>';
        if (e.t === 'holes') {
          var pts = holePts(e);
          h += '<table class="cad-tb notr"><tr><th>#</th><th>X</th><th>Y</th></tr>' + pts.slice(0, 400).map(function (q, i) { var r = rel(q[0], q[1]); return '<tr><td>' + (i + 1) + '</td><td>' + fmt(r[0]) + '</td><td>' + fmt(r[1]) + '</td></tr>'; }).join('') + '</table>';
          if (pts.length > 400) h += '<small>… ' + (pts.length - 400) + '</small>';
        }
        h += '</button>';
      });
      if (dims.length) h += '<div class="cad-li"><b>' + dims.length + ' ' + esc(T('cotas')) + '</b><small>' + esc(T('Toque numa cota na tela para editar ou apagar.')) + '</small></div>';
      h += '</div>';
    }
    openModal(T('Lista de elementos'), h);
  }
  function openLayers() {
    var L = [['peca', 'Peça'], ['furos', 'Furos'], ['cotas', 'Cotas'], ['centro', 'Linhas de centro'], ['foto', 'Foto de fundo']], hd = doc.hide || {};
    openModal(T('Camadas'), '<div class="cad-list">' + L.map(function (l) { return '<button type="button" class="cad-li' + (hd[l[0]] ? '' : ' on') + '" data-a="lay" data-l="' + l[0] + '"><b>' + (hd[l[0]] ? '○ ' : '● ') + esc(T(l[1])) + '</b><small>' + esc(T(hd[l[0]] ? 'Escondida' : 'Visível')) + '</small></button>'; }).join('') + '</div>');
  }
  var openDir = null;
  function folderList() {
    var fs = (store.folders || []).slice();
    Object.keys(store.docs).forEach(function (id) { var f = store.docs[id].folder; if (f && fs.indexOf(f) < 0) fs.push(f); });
    store.folders = fs; return fs.sort(function (a, b) { return a.localeCompare(b); });
  }
  function docRow(id) {
    var d = store.docs[id], dt = new Date(d.savedAt || d.upd);
    return '<div class="cad-drow"><button type="button" class="cad-li' + (id === store.cur ? ' on' : '') + '" data-a="fopen" data-id="' + id + '"><b class="notr">' + esc(d.name) + '</b><small>' + d.ents.length + ' ' + esc(T('elementos')) + ' · ' + dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (id === store.cur ? ' · ' + esc(T('aberto')) : '') + '</small></button>' +
      '<button type="button" class="cad-b cad-ddel" data-a="fdelid" data-id="' + id + '" aria-label="' + esc(T('Apagar')) + '">✕</button></div>';
  }
  function openFiles() {
    var ids = Object.keys(store.docs).filter(function (id) { return store.docs[id].saved; }).sort(function (a, b) { return (store.docs[b].savedAt || 0) - (store.docs[a].savedAt || 0); });
    var fs = folderList(), h = '';
    if (!ids.length && !fs.length) h = '<p class="cad-hint">' + esc(T('Nenhum desenho salvo ainda. Faça o desenho e toque no botão Salvar (disquete) lá em cima.')) + '</p>';
    h += '<div class="cad-list">';
    fs.forEach(function (f) {
      var inF = ids.filter(function (id) { return store.docs[id].folder === f; }), op = openDir === f;
      h += '<div class="cad-dir"><button type="button" class="cad-dirh" data-a="fdir" data-f="' + esc(f) + '">' + (op ? '📂' : '📁') + ' <b class="notr">' + esc(f) + '</b><small>' + inF.length + '</small></button>' +
        (op ? '<div class="cad-dirb">' + (inF.length ? inF.map(docRow).join('') : '<p class="cad-hint">' + esc(T('Pasta vazia. Para guardar aqui, escolha esta pasta ao salvar.')) + '</p>') +
          '<div class="cad-pbtn">' + '<button type="button" class="ui-btn" data-a="fdirren" data-f="' + esc(f) + '">' + esc(T('Renomear pasta')) + '</button><button type="button" class="ui-btn danger" data-a="fdirdel" data-f="' + esc(f) + '">' + esc(T('Apagar pasta')) + '</button></div></div>' : '') + '</div>';
    });
    var loose = ids.filter(function (id) { return !store.docs[id].folder; });
    if (loose.length) h += (fs.length ? '<p class="cad-sub">' + esc(T('Sem pasta')) + '</p>' : '') + loose.map(docRow).join('');
    openModal(T('Desenhos salvos'), h + '</div>');
  }
  /* janela Salvar: nome, pasta, salvar / salvar como cópia */
  var saveFolder = null, saveName = null;
  function readSaveName() { var i = el.mb.querySelector('#cadSvName'); if (i) saveName = i.value; }
  function openSave(keep) {
    if (!keep) { saveFolder = doc.folder || ''; saveName = doc.name; }
    var fs = folderList();
    var h = '<label class="cad-fl"><span>' + esc(T('Nome do desenho')) + '</span><input type="text" id="cadSvName" class="notr" value="' + esc(saveName) + '"></label>' +
      '<p class="cad-sub">' + esc(T('Pasta')) + '</p><div class="cad-chips">' +
      '<button type="button" class="ui-btn' + (!saveFolder ? ' primary' : '') + '" data-a="fpick" data-f="">' + esc(T('Sem pasta')) + '</button>' +
      fs.map(function (f) { return '<button type="button" class="ui-btn' + (saveFolder === f ? ' primary' : '') + '" data-a="fpick" data-f="' + esc(f) + '">📁 ' + esc(f) + '</button>'; }).join('') +
      btn('fnewdir', '+ Nova pasta') + '</div>' +
      '<div class="cad-pbtn cad-svb">' + btn('fsave', 'Salvar', 'primary') + (doc.saved ? btn('fsavecp', 'Salvar como cópia') : '') + '</div>' +
      '<p class="cad-hint">' + esc(doc.saved ? (isDirty() ? T('Tem alterações que ainda não foram salvas.') : T('Tudo salvo.')) : T('Este desenho ainda não foi salvo.')) + '</p>' +
      '<div class="cad-pbtn">' + btn('fnew', '+ Novo desenho') + btn('files', 'Desenhos salvos') + '</div>';
    openModal(T('Salvar desenho'), h);
  }
  function doSave(copy, after) {
    readSaveName();
    var nm = String(saveName == null ? doc.name : saveName).trim() || doc.name, f = saveFolder == null ? (doc.folder || '') : saveFolder;
    if (copy) { var c = clone(doc); c.chat = []; c.snap = null; if (nm === doc.name) nm = nm + ' (' + T('cópia') + ')'; if (doc.snap) { var o = JSON.parse(doc.snap); o.bg = doc.bg; store.docs[store.cur] = o; } var id = uid(); store.docs[id] = c; store.cur = id; doc = c; }
    doc.name = nm; if (f) doc.folder = f; else delete doc.folder;
    doc.saved = true; save(); doc.savedAt = doc.upd; doc.snap = null; var bgk = doc.bg; delete doc.bg; doc.snap = JSON.stringify(doc); if (bgk) doc.bg = bgk; save(true);
    el.name.textContent = doc.name; updSaveBtn(); dbPut(store.cur); syncMeta();
    closeModal(); toast(T('Desenho salvo') + ': ' + doc.name + (f ? ' (📁 ' + f + ')' : ''));
    if (after) after();
  }
  /* antes de trocar de desenho: avisa se há alterações sem salvar */
  var leaveCb = null;
  function leaveDoc(cb) {
    if (!isDirty()) return cb();
    leaveCb = cb;
    el.ask.innerHTML = '<div class="cad-askbox"><b>' + esc(doc.saved ? T('Salvar as alterações em') + ' "' + doc.name + '"?' : T('Este desenho ainda não foi salvo. Salvar agora?')) + '</b><div class="cad-pbtn">' + btn('askno', 'Cancelar') + btn('lvdrop', 'Não salvar', 'danger') + btn('lvsave', 'Salvar', 'primary') + '</div></div>';
    el.ask.classList.remove('hidden');
  }
  /* cópia na nuvem (só dentro do app do Claude: banco privado de cada pessoa) */
  var cloud = null;
  function dbBody(id) { var d = clone(store.docs[id]); delete d.bg; delete d.snap; d.chat = (d.chat || []).slice(-10).map(function (m) { return { r: m.r, t: typeof m.t === 'string' ? m.t.slice(0, 2000) : '' }; }); var j = JSON.stringify(d); if (j.length > 240000) { d.chat = []; } return { v: 1, id: id, doc: JSON.stringify(d) }; }
  var dbQ = Promise.resolve();
  function dbRun(f) { if (!cloud) return; dbQ = dbQ.then(f).catch(function (e) { if (e && e.code === 'quota_exceeded') toast(T('A nuvem do Claude está cheia. O desenho ficou salvo só neste aparelho.')); }); }
  function dbPut(id) { if (!cloud || !store.docs[id] || !store.docs[id].saved) return; var b = dbBody(id); dbRun(function () { return cloud.col.doc('cad-' + id).set(b); }); }
  function dbDel(id) { dbRun(function () { return cloud.col.doc('cad-' + id).delete(); }); }
  function syncMeta() { dbRun(function () { return cloud.col.doc('cadmeta').set({ folders: (store.folders || []).slice() }); }); }
  function cloudInit() {
    if (!root.claude || typeof root.claude.use !== 'function') return;
    Promise.all([root.claude.use('db'), root.claude.use('user')]).then(function (r) {
      var db = r[0], us = r[1]; if (!db || !us) return null;
      return us.id().then(function (uidv) {
        if (!uidv) return;
        cloud = { col: db.collection('data/users/' + uidv) };
        return cloud.col.get().then(function (snap) {
          var ch = false;
          snap.docs.forEach(function (ds) {
            var b = ds.data(); if (!b) return;
            if (ds.id === 'cadmeta') { (b.folders || []).forEach(function (f) { store.folders = store.folders || []; if (store.folders.indexOf(f) < 0) { store.folders.push(f); ch = true; } }); return; }
            if (!b.id || !b.doc) return;
            var d; try { d = JSON.parse(b.doc); } catch (e) { return; }
            var mine = store.docs[b.id];
            if (!mine || (mine.savedAt || 0) < (d.savedAt || 0)) { if (mine && mine.bg) d.bg = mine.bg; d.snap = JSON.stringify(d); store.docs[b.id] = d; ch = true; if (b.id === store.cur) { doc = d; el.name.textContent = doc.name; draw(); } }
          });
          // desenhos salvos só aqui (de antes) vão para a nuvem também
          var have = {}; snap.docs.forEach(function (ds) { have[ds.id] = 1; });
          Object.keys(store.docs).forEach(function (id) { if (store.docs[id].saved && !have['cad-' + id]) dbPut(id); });
          if (ch) { save(true); updSaveBtn(); }
        });
      });
    }).catch(function () {});
  }
  // perguntas dentro do app (a página do Claude não deixa usar prompt/confirm do navegador)
  var askCb = null;
  function askText(title, def, cb, numeric) {
    askCb = cb;
    el.ask.innerHTML = '<div class="cad-askbox"><b>' + esc(title) + '</b><input type="text"' + (numeric ? ' inputmode="decimal"' : '') + ' value="' + esc(def) + '"><div class="cad-pbtn">' + btn('askno', 'Cancelar') + btn('askok', 'OK', 'primary') + '</div></div>';
    el.ask.classList.remove('hidden');
    var i = el.ask.querySelector('input'); i.focus(); i.select();
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ACTIONS.askok(); } else if (e.key === 'Escape') closeAsk(); });
  }
  function askOk(msg, cb) {
    askCb = cb;
    el.ask.innerHTML = '<div class="cad-askbox"><b>' + esc(msg) + '</b><div class="cad-pbtn">' + btn('askno', 'Cancelar') + btn('askok', 'Confirmar', 'danger') + '</div></div>';
    el.ask.classList.remove('hidden');
  }
  function closeAsk() { askCb = null; el.ask.classList.add('hidden'); el.ask.innerHTML = ''; }
  var tt = 0;
  function toast(m) { if (!el.toast) return; el.toast.textContent = m; el.toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { el.toast.classList.remove('show'); }, 2600); }

  /* ---------- foto ---------- */
  function readImage(file, max, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      im.onerror = function () { toast(T('Não consegui abrir essa imagem.')); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function setBg(src) {
    var im = new Image();
    im.onload = function () {
      pushUndo();
      var b = bounds(doc.ents.filter(function (e) { return e.t !== 'dim'; })), w = isFinite(b.x0) ? Math.max(b.x1 - b.x0, b.y1 - b.y0) * 1.2 : Math.max(W, H) / view.s * 0.8;
      doc.bg = { src: src, x: doc.origin.x, y: doc.origin.y, w: w, op: 0.5, iw: im.width, ih: im.height };
      save(); bgImg = null; fit(); openBg();
      toast(T('Foto posta. Calibre com dois pontos de medida conhecida.'));
    };
    im.src = src;
  }
  function openBg() {
    var h;
    if (!doc.bg) h = '<p class="cad-hint">' + esc(T('Ponha a foto de um desenho atrás da tela para copiar por cima, ou mande o agente ler as medidas e desenhar.')) + '</p><div class="cad-menu">' + fileBtn('cadBgImg', 'Escolher ou tirar foto', 'primary') + btn('agent', 'Agente: ler foto e desenhar') + '</div>';
    else h = '<p class="cad-hint">' + esc(T('1) Calibre: toque em 2 pontos da foto e digite a distância real. 2) Toque no ponto da foto que é o zero da peça.')) + '</p><div class="cad-menu">' +
      btn('bgcal', 'Calibrar (2 pontos)', 'primary') + btn('bgzero', 'Pôr o zero da foto na origem') + btn('bgai', 'Agente: ler esta foto e desenhar') + fileBtn('cadBgImg', 'Trocar foto') + btn('bgdel', 'Tirar a foto', 'danger') + '</div>' +
      '<label class="cad-f wide"><span>' + esc(T('Transparência')) + '</span><input type="range" min="0.1" max="1" step="0.05" data-bgop="1" value="' + (doc.bg.op == null ? 0.5 : doc.bg.op) + '"></label>';
    openModal(T('Foto de fundo'), h);
  }

  /* ---------- exportar ---------- */
  // nomes da legenda da folha: o que a pessoa digitou neste aparelho, ou o padrão do app (config.js)
  var SHEET_KEY = 'mcnc.sheet';
  function sheetAuthors() {
    var d = (root.APP_CONFIG && root.APP_CONFIG.sheetAuthor) || '', s = null;
    try { s = JSON.parse(localStorage.getItem(SHEET_KEY) || 'null'); } catch (e) {}
    return { des: s && s.des != null ? s.des : d, apr: s && s.apr != null ? s.apr : d, tol: s && s.tol != null ? s.tol : 'ISO 2768-m' };
  }
  function openExport() {
    var au = sheetAuthors();
    openModal(T('Exportar'), '<p class="cad-hint">' + esc(T('As medidas saem em mm, com a origem X0 Y0 do desenho.')) + '</p>' +
      '<label class="cad-f"><span>' + esc(T('Desenhado por (folha A4)')) + '</span><input type="text" data-sheet="des" value="' + esc(au.des) + '"></label>' +
      '<label class="cad-f"><span>' + esc(T('Aprovado por (folha A4)')) + '</span><input type="text" data-sheet="apr" value="' + esc(au.apr) + '"></label>' +
      '<label class="cad-f"><span>' + esc(T('Material (deste desenho)')) + '</span><input type="text" data-docf="mat" value="' + esc(doc.mat || '') + '" placeholder="' + esc(T('ex.: Aço SAE 1045')) + '"></label>' +
      '<label class="cad-f"><span>' + esc(T('Tolerância geral (folha A4)')) + '</span><input type="text" data-sheet="tol" value="' + esc(au.tol) + '"></label>' +
      '<div class="cad-menu">' +
      btn('xdxf', 'DXF (AutoCAD, SolidWorks)', 'primary') + btn('xpdf', 'PDF (para imprimir)') + btn('xpng', 'Imagem PNG') + btn('xjson', 'Cópia de segurança (.json)') + btn('ijson', 'Abrir cópia de segurança') + '</div>');
  }
  function fileName(ext) { return ((doc.name || 'desenho').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'desenho') + '.' + ext; }
  var shareOrDownload = function (blob, name) {
    var p = root.App && root.App.saveFile ? root.App.saveFile(name, blob) : null;
    if (p) {   // dentro do Claude
      p.then(function () { toast(T('Arquivo salvo.')); }).catch(function (e) {
        var c = e && e.code;
        if (c === 'rejected_extension' || c === 'extension_not_enabled') toast(T('Dentro do Claude este tipo de arquivo não pode ser baixado. Use o app instalado.'));
        else if (c !== 'declined') toast(T('Não foi possível salvar o arquivo aqui.'));
      });
      return;
    }
    try {
      var f = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ files: [f], title: name }).catch(function () {}); return; }
    } catch (e) {}
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  function dxfText() {
    var o = doc.origin, out = [];
    function g(c, v) { out.push(String(c)); out.push(String(v)); }
    function X(x) { return fmt(x - o.x, 4); } function Y(y) { return fmt(y - o.y, 4); }
    var LAY = { peca: 7, furos: 5, cotas: 2, centro: 1 };
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES'); g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 4);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid'); g(72, 65); g(73, 0); g(40, 0);
    g(0, 'LTYPE'); g(2, 'CENTER'); g(70, 0); g(3, 'Center'); g(72, 65); g(73, 4); g(40, 20); g(49, 12); g(49, -3); g(49, 2); g(49, -3);
    g(0, 'LTYPE'); g(2, 'HIDDEN'); g(70, 0); g(3, 'Hidden'); g(72, 65); g(73, 2); g(40, 9); g(49, 6); g(49, -3);
    g(0, 'LTYPE'); g(2, 'DOT'); g(70, 0); g(3, 'Dot'); g(72, 65); g(73, 2); g(40, 3); g(49, 0); g(49, -3);
    g(0, 'ENDTAB'); g(0, 'TABLE'); g(2, 'LAYER'); g(70, 4);
    Object.keys(LAY).forEach(function (n) { g(0, 'LAYER'); g(2, n.toUpperCase()); g(70, 0); g(62, LAY[n]); g(6, n === 'centro' ? 'CENTER' : 'CONTINUOUS'); });
    g(0, 'ENDTAB'); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    var LT = null, LTN = { trac: 'HIDDEN', pont: 'DOT', tp: 'CENTER' };
    function lt() { if (LT) g(6, LT); }
    function line(l, a, b, c, d) { g(0, 'LINE'); g(8, l); lt(); g(10, X(a)); g(20, Y(b)); g(30, 0); g(11, X(c)); g(21, Y(d)); g(31, 0); }
    function circ(l, x, y, r) { g(0, 'CIRCLE'); g(8, l); lt(); g(10, X(x)); g(20, Y(y)); g(30, 0); g(40, fmt(r, 4)); }
    function arc(l, x, y, r, a0, a1) { g(0, 'ARC'); g(8, l); lt(); g(10, X(x)); g(20, Y(y)); g(30, 0); g(40, fmt(r, 4)); g(50, fmt(nang(a0), 4)); g(51, fmt(nang(a1), 4)); }
    var b = bounds(doc.ents.filter(function (e) { return e.t !== 'dim'; })), k = isFinite(b.x0) ? Math.max(0.2, Math.max(b.x1 - b.x0, b.y1 - b.y0) / 1000) : 0.25;
    doc.ents.forEach(function (e) {
      if (e.t === 'dim') {
        var gd = dimGeom(e, k);
        gd.segs.forEach(function (s) { line('COTAS', s[0], s[1], s[2], s[3]); });
        gd.arcs.forEach(function (a) { arc('COTAS', a.x, a.y, a.r, a.a0, a.a1); });
        gd.tris.forEach(function (t) { g(0, 'SOLID'); g(8, 'COTAS'); g(10, X(t[0])); g(20, Y(t[1])); g(30, 0); g(11, X(t[2])); g(21, Y(t[3])); g(31, 0); g(12, X(t[4])); g(22, Y(t[5])); g(32, 0); g(13, X(t[4])); g(23, Y(t[5])); g(33, 0); });
        gd.texts.forEach(function (t) { var s = t.s.replace(/Ø/g, '%%c').replace(/°/g, '%%d'); g(0, 'TEXT'); g(8, 'COTAS'); g(10, X(t.x)); g(20, Y(t.y)); g(30, 0); g(40, fmt(t.h * 0.85, 4)); g(1, s); g(50, fmt(t.rot, 3)); g(72, 1); g(73, 2); g(11, X(t.x)); g(21, Y(t.y)); g(31, 0); });
        return;
      }
      var L = e.t === 'holes' ? 'FUROS' : 'PECA';
      prims(e).forEach(function (p) {
        LT = p.cl ? null : LTN[e.ls] || null;
        if (p.k === 'l') line(L, p.x1, p.y1, p.x2, p.y2);
        else if (p.k === 'c') { circ(p.cl ? 'CENTRO' : L, p.x, p.y, p.r); LT = null; if (!p.cl) { var c = Math.min(p.r * 1.25, p.r + 3); line('CENTRO', p.x - c, p.y, p.x + c, p.y); line('CENTRO', p.x, p.y - c, p.x, p.y + c); } }
        else arc(L, p.x, p.y, p.r, p.a0, p.a1);
        LT = null;
      });
    });
    g(0, 'ENDSEC'); g(0, 'EOF');
    return out.join('\r\n') + '\r\n';
  }
  function exportDXF() { shareOrDownload(new Blob([dxfText()], { type: 'application/dxf' }), fileName('dxf')); }
  // desenha num canvas fora da tela, fundo branco, com moldura e legenda
  function renderSheet(PW, PH) {
    var c = document.createElement('canvas'); c.width = PW; c.height = PH;
    var sv = { ctx: ctx, W: W, H: H, dpr: dpr, view: view, COL: COL, pxk: pxk, sel: sel, ghost: ghost, hover: hover, snapHit: snapHit };
    try {
      ctx = c.getContext('2d'); W = PW; H = PH; dpr = 1; COL = COL_PRINT; printMode = true; pxk = PW / 900; sel = null; ghost = null; hover = null; snapHit = null;
      view = { cx: 0, cy: 0, s: 1 };
      var bandH = PH * 0.09, list = doc.ents.filter(vis);
      H = PH - bandH; fitTo(list, PW * 0.12); H = PH;
      view.cy -= bandH / 2 / view.s;
      paint();
      var m = PW * 0.015; ctx.strokeStyle = '#111'; ctx.lineWidth = 2 * pxk; ctx.strokeRect(m, m, PW - 2 * m, PH - 2 * m);
      ctx.beginPath(); ctx.moveTo(m, PH - m - bandH); ctx.lineTo(PW - m, PH - m - bandH); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '700 ' + (16 * pxk) + 'px system-ui, sans-serif';
      ctx.fillText(doc.name, m + 12 * pxk, PH - m - bandH / 2);
      ctx.font = '500 ' + (11 * pxk) + 'px system-ui, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(T('Medidas em mm') + (doc.esp ? ' · ' + T('espessura') + ' ' + fmt(doc.esp) : '') + ' · ' + new Date().toLocaleDateString() + ' · Macro CNC', PW - m - 12 * pxk, PH - m - bandH / 2);
    } finally {
      ctx = sv.ctx; W = sv.W; H = sv.H; dpr = sv.dpr; view = sv.view; COL = sv.COL; pxk = sv.pxk; sel = sv.sel; ghost = sv.ghost; hover = sv.hover; snapHit = sv.snapHit; printMode = false;
    }
    draw();
    return c;
  }
  /* folha A4 em pé no padrão de desenho técnico: moldura, legenda, vista de cima com cotas,
     cortes A-A e B-B tirados do 3D e a peça em 3D (isométrica) */
  function renderA4(PW, PH) {
    var st = build3D(); if (!st) return null;
    var c = document.createElement('canvas'); c.width = PW; c.height = PH;
    var g = c.getContext('2d'), u = PW / 210;
    function mm(v) { return v * u; }
    var INK = '#0d0d0d', DIM = '#12336b', CLC = '#b3261e', FONT = '"Helvetica Neue", Arial, system-ui, sans-serif';
    function font(sz, w) { g.font = (w || 600) + ' ' + mm(sz) + 'px ' + FONT; }
    g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH);
    var esp = st.top - st.bottom, top3 = st.top, bot3 = st.bottom;
    var bx0 = st.ob[0], by0 = st.ob[1], bx1 = st.ob[2], by1 = st.ob[3];
    var pcx = (bx0 + bx1) / 2, pcy = (by0 + by1) / 2, pw = bx1 - bx0, ph = by1 - by0;
    var ents = doc.ents.filter(function (e) { return vis(e); });

    /* ---------- onde cortar: a linha que passa pelos detalhes mais importantes ---------- */
    var feats = [];   // detalhes de dentro: furos, círculos e contornos internos
    ents.forEach(function (e) {
      if (e.t === 'holes') holePts(e).forEach(function (q) { feats.push({ x: q[0], y: q[1], rx: e.d / 2, ry: e.d / 2, d: e.d, e: e }); });
      else if (['circle', 'rect', 'poly'].indexOf(e.t) >= 0 && !isRef(e)) {
        var b = bounds([e]); if (b.x1 - b.x0 >= pw - 1e-6 && b.y1 - b.y0 >= ph - 1e-6) return;   // o contorno de fora
        feats.push({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, rx: (b.x1 - b.x0) / 2, ry: (b.y1 - b.y0) / 2, d: e.t === 'circle' ? e.d : null, e: e });
      }
    });
    function crossed(axis, v) { return feats.filter(function (f) { return axis === 'h' ? Math.abs(f.y - v) < f.ry * 0.9 : Math.abs(f.x - v) < f.rx * 0.9; }); }
    function bestCut(axis, center, avoid) {
      var cands = [center]; feats.forEach(function (f) { cands.push(axis === 'h' ? f.y : f.x); });
      var best = center, bs = -1;
      cands.forEach(function (v) {
        var cr = crossed(axis, v), sc = 0;
        cr.forEach(function (f) { var w = (axis === 'h' ? f.rx : f.ry) * 2; sc += (avoid && avoid.indexOf(f.e) >= 0 && !(f.e.t === 'holes' && avoid.indexOf(f) < 0 && false)) ? w * 0.15 : w; });
        sc -= Math.abs(v - center) * 0.001;
        if (sc > bs + 1e-9) { bs = sc; best = v; }
      });
      return best;
    }
    var cutA = bestCut('h', pcy, null);
    var aEnts = crossed('h', cutA).map(function (f) { return f.e; });
    var cutB = bestCut('v', pcx, aEnts);
    var lookA = cutA <= pcy + 1e-6 ? 1 : -1;      // A-A olha para +Y (ou -Y): o lado com mais peça
    var lookB = cutB >= pcx - 1e-6 ? -1 : 1;      // B-B olha para -X (ou +X)

    /* ---------- folha: margens (esquerda 20 mm, demais 10 mm) e legenda ---------- */
    var FL = mm(20), FT = mm(10), FR = PW - mm(10), FB = PH - mm(10), TBH = mm(36), tbTop = FB - TBH;
    var area = { x: FL + mm(8), y: FT + mm(9), w: FR - FL - mm(16), h: tbTop - FT - mm(16) };

    /* ---------- escala normalizada que cabe na folha ---------- */
    var PXK = mm(0.27);   // tamanho do texto/linhas da vista de cima (texto da cota ~3,2 mm)
    var LAB = 12, GAP = 9, GAPV = 8, ISO_W = 48, ISO_H = 36, AW = area.w / u, AH = area.h / u;
    function planExt(sc) { var eb = bounds(ents, PXK / (sc * u)); return { x0: Math.min(eb.x0, bx0), y0: Math.min(eb.y0, by0), x1: Math.max(eb.x1, bx1), y1: Math.max(eb.y1, by1) }; }
    // arranjos possíveis: T1 [cima | 3D] / [A-A | B-B]; T2 [cima | B-B em pé] / [A-A | 3D]; T3 [cima | B-B em pé] / [A-A] / [3D]
    function lay(sc, tp) {
      var ex = planExt(sc), L = { sc: sc, ex: ex, tp: tp };
      L.pW = (ex.x1 - ex.x0) * sc + 2 * LAB; L.pH = (ex.y1 - ex.y0) * sc + 2 * LAB + 6;
      L.aW = pw * sc + 2 * LAB; L.aH = esp * sc + 30;
      L.c1 = Math.max(L.pW, L.aW);
      if (tp === 1) { L.c2 = Math.max(ISO_W, ph * sc + 2 * LAB); L.H = L.pH + GAPV + L.aH; L.W = L.c1 + GAP + L.c2; L.iso = [AW - L.c1 - GAP, L.pH]; }
      else if (tp === 4) {   // peça comprida: [cima] / [A-A] / [B-B | 3D]
        L.bW = ph * sc + 2 * LAB; L.c2 = 0; L.W = Math.max(L.c1, L.bW + GAP + ISO_W);
        L.H = L.pH + GAPV + L.aH + GAPV + L.aH; L.iso = [AW - L.bW - GAP, AH - L.pH - L.aH - 2 * GAPV];
      } else {
        L.c2 = esp * sc + 30; L.W = L.c1 + GAP + L.c2;
        if (tp === 2) { L.H = L.pH + GAPV + L.aH; L.iso = [AW - L.c1 - GAP, AH - L.pH - GAPV]; }
        else { L.H = L.pH + GAPV + L.aH + GAPV + ISO_H; L.iso = [AW, AH - L.pH - L.aH - 2 * GAPV]; }
      }
      L.ok = L.W <= AW && L.H <= AH && L.iso[0] >= ISO_W && L.iso[1] >= ISO_H;
      L.isoA = Math.min(L.iso[0], L.iso[1] * 1.5) * Math.min(L.iso[1], L.iso[0] / 1.5);
      return L;
    }
    var SC = [10, 5, 4, 2.5, 2, 1.5, 1, 1 / 1.5, 1 / 2, 1 / 2.5, 1 / 3, 1 / 4, 1 / 5, 1 / 7.5, 1 / 10, 1 / 15, 1 / 20, 1 / 25, 1 / 50, 1 / 100];
    var Lb = null;
    for (var si = 0; si < SC.length && !Lb; si++) [1, 2, 3, 4].forEach(function (tp) { var Lt = lay(SC[si], tp); if (Lt.ok && (!Lb || Lt.isoA > Lb.isoA)) Lb = Lt; });
    if (!Lb) Lb = lay(SC[SC.length - 1], 1);
    var sc = Lb.sc, S = sc * u, ex = Lb.ex, TP = Lb.tp;
    var scaleTxt = sc >= 1 ? fmt(sc) + ':1' : '1:' + fmt(Math.round(1 / sc * 10) / 10);
    var gx0 = area.x + (TP === 1 || TP === 4 ? Math.max(0, (area.w - mm(TP === 4 ? Lb.c1 : Lb.W)) / 2) * (TP === 4 ? 1 : 0) : Math.max(0, (area.w - mm(Lb.W)) / 2)), gy0 = area.y + (TP === 3 || TP === 4 ? 0 : Math.max(0, (area.h - mm(Lb.H)) / 2));
    // vista de cima: a peça fica alinhada com o corte A-A embaixo dela
    var planL = gx0 + mm(LAB) + (Math.max(0, Lb.c1 - Lb.pW) / 2) * u, planT = gy0 + mm(LAB + 6);
    function tx(x) { return planL + (x - ex.x0) * S; }
    function ty(y) { return planT + (ex.y1 - y) * S; }

    /* ---------- vista de cima (mesmo desenho da tela, com linhas grossas para imprimir) ---------- */
    var sv = { ctx: ctx, W: W, H: H, dpr: dpr, view: view, COL: COL, pxk: pxk, sel: sel, ghost: ghost, hover: hover, snapHit: snapHit };
    var pad = mm(30), tc = document.createElement('canvas');
    tc.width = Math.round((ex.x1 - ex.x0) * S + 2 * pad); tc.height = Math.round((ex.y1 - ex.y0) * S + 2 * pad);
    try {
      ctx = tc.getContext('2d'); W = tc.width; H = tc.height; dpr = 1; COL = COL_PRINT; printMode = true; pxk = PXK; sel = null; ghost = null; hover = null; snapHit = null;
      view = { cx: (ex.x0 + ex.x1) / 2, cy: (ex.y0 + ex.y1) / 2, s: S };
      paint();
    } finally {
      ctx = sv.ctx; W = sv.W; H = sv.H; dpr = sv.dpr; view = sv.view; COL = sv.COL; pxk = sv.pxk; sel = sv.sel; ghost = sv.ghost; hover = sv.hover; snapHit = sv.snapHit; printMode = false;
    }
    g.drawImage(tc, tx(ex.x0) - pad, ty(ex.y1) - pad);

    /* ---------- utilidades de desenho ---------- */
    function arrowHead(x1, y1, x2, y2, L, open) {
      var a = Math.atan2(y2 - y1, x2 - x1); L = L || mm(2.6);
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - L * Math.cos(a - 0.3), y2 - L * Math.sin(a - 0.3)); g.lineTo(x2 - L * Math.cos(a + 0.3), y2 - L * Math.sin(a + 0.3)); g.closePath(); g.fill();
    }
    function txtBox(s, x, y, al) {   // texto com fundo branco (as linhas não passam por cima)
      var w = g.measureText(s).width, h = parseFloat(g.font.split(' ')[1]) || mm(3);
      var xl = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
      var f = g.fillStyle; g.fillStyle = '#fff'; g.fillRect(xl - mm(0.8), y - h * 0.62, w + mm(1.6), h * 1.24); g.fillStyle = f;
      g.textAlign = al || 'left'; g.textBaseline = 'middle'; g.fillText(s, x, y);
    }
    var secRot = 0;   // giro do corte em pé (para o texto das cotas não ficar de cabeça para baixo)
    function hdim(xa, xb, y, txt, ya, yb) {   // cota horizontal entre xa e xb na altura y; ya/yb = de onde saem as linhas de chamada
      g.strokeStyle = DIM; g.fillStyle = DIM; g.lineWidth = mm(0.25);
      g.beginPath();
      if (ya != null) { var s1 = y < ya ? -1 : 1; g.moveTo(xa, ya + s1 * mm(1)); g.lineTo(xa, y + s1 * mm(1.8)); }
      if (yb != null) { var s2 = y < yb ? -1 : 1; g.moveTo(xb, yb + s2 * mm(1)); g.lineTo(xb, y + s2 * mm(1.8)); }
      g.moveTo(xa, y); g.lineTo(xb, y); g.stroke();
      arrowHead(xb, y, xa, y); arrowHead(xa, y, xb, y);
      font(3.2, 600);
      if (secRot === 90) { g.save(); g.translate((xa + xb) / 2, y - mm(2.6)); g.rotate(Math.PI); txtBox(txt, 0, 0, 'center'); g.restore(); }   // sempre legível
      else txtBox(txt, (xa + xb) / 2, y - mm(2.6), 'center');
    }
    function vdim(x, za, zb, txt, xr, side, plain) {   // cota vertical; xr = coluna das linhas de chamada; side = lado do texto
      g.strokeStyle = DIM; g.fillStyle = DIM; g.lineWidth = mm(0.25);
      g.beginPath();
      if (xr != null) { var s = x < xr ? -1 : 1; g.moveTo(xr + s * mm(1), za); g.lineTo(x + s * mm(1.8), za); g.moveTo(xr + s * mm(1), zb); g.lineTo(x + s * mm(1.8), zb); }
      g.moveTo(x, za); g.lineTo(x, zb); g.stroke();
      if (Math.abs(zb - za) > mm(7)) { arrowHead(x, zb, x, za); arrowHead(x, za, x, zb); }
      else { arrowHead(x, za - mm(4), x, za); arrowHead(x, zb + mm(4), x, zb); g.beginPath(); g.moveTo(x, za - mm(4)); g.lineTo(x, zb + mm(4)); g.stroke(); }
      font(3.2, 600);
      if (plain && Math.abs(zb - za) < mm(9)) {   // profundidade pequena: texto deitado, logo acima da face de cima
        g.save(); g.translate(x + mm(1.2), Math.min(za, zb) - mm(5)); if (secRot) g.rotate(secRot === 90 ? -Math.PI / 2 : Math.PI / 2);
        txtBox('↧' + txt, 0, 0, secRot ? 'center' : 'left'); g.restore();
        g.beginPath(); g.moveTo(x, Math.min(za, zb) - mm(4)); g.lineTo(x, Math.min(za, zb)); g.stroke();
        return;
      }
      g.save(); g.translate(x + (side || -1) * mm(2.6), (za + zb) / 2); g.rotate(secRot === -90 ? Math.PI / 2 : -Math.PI / 2);
      if (plain) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 0); } else txtBox(txt, 0, 0, 'center');
      g.restore();
    }
    function centerLine(x1, y1, x2, y2) { g.save(); g.strokeStyle = CLC; g.lineWidth = mm(0.25); g.setLineDash([mm(6), mm(1.2), mm(0.8), mm(1.2)]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); }

    /* ---------- linhas de corte na vista de cima: traço-ponto fino, pontas grossas, setas e letras ---------- */
    function cutLine(axis, v, look, L) {
      var p, q, ext = mm(4), ov = mm(3);
      // pontas grossas e setas fora das cotas; o traço-ponto fino só passa por cima da peça
      if (axis === 'h') { p = [tx(ex.x0) - ext, ty(v)]; q = [tx(ex.x1) + ext, ty(v)]; }
      else { p = [tx(v), ty(ex.y1) - ext]; q = [tx(v), ty(ex.y0) + ext]; }
      g.save(); g.strokeStyle = INK; g.lineWidth = mm(0.3); g.setLineDash([mm(8), mm(1.5), mm(1), mm(1.5)]);
      g.beginPath();
      if (axis === 'h') { g.moveTo(tx(bx0) - ov, ty(v)); g.lineTo(tx(bx1) + ov, ty(v)); } else { g.moveTo(tx(v), ty(by1) - ov); g.lineTo(tx(v), ty(by0) + ov); }
      g.stroke(); g.restore();
      var dir = axis === 'h' ? [1, 0] : [0, 1], nrm = axis === 'h' ? [0, -look] : [look, 0];   // nrm = para onde se olha (no papel)
      [[p, -1], [q, 1]].forEach(function (it) {   // ponta grossa para fora, sem passar por cima das cotas
        var o = it[0], s = it[1], a = [o[0], o[1]], b = [o[0] + dir[0] * s * mm(7), o[1] + dir[1] * s * mm(7)];
        g.strokeStyle = INK; g.lineWidth = mm(0.8); g.setLineDash([]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        var ar = [a[0] + dir[0] * s * mm(1.5), a[1] + dir[1] * s * mm(1.5)], tip = [ar[0] + nrm[0] * mm(7), ar[1] + nrm[1] * mm(7)];
        g.lineWidth = mm(0.35); g.beginPath(); g.moveTo(ar[0], ar[1]); g.lineTo(tip[0], tip[1]); g.stroke();
        g.fillStyle = INK; arrowHead(ar[0], ar[1], tip[0], tip[1], mm(3));
        font(5, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(L, tip[0] + nrm[0] * mm(3.6) + dir[0] * s * mm(2.5), tip[1] + nrm[1] * mm(3.6) + dir[1] * s * mm(2.5));
      });
    }
    cutLine('h', cutA, lookA, 'A'); cutLine('v', cutB, lookB, 'B');

    /* ---------- chamadas de fabricação: furos (passante / rebaixo) e chanfro ---------- */
    var hg = [];
    ents.forEach(function (e) {
      if (e.t !== 'holes') return;
      var pts = holePts(e), key = pts.map(function (q) { return q[0].toFixed(2) + ',' + q[1].toFixed(2); }).join(';'), gr = null;
      hg.forEach(function (h) { if (h.key === key) gr = h; });
      if (!gr) { gr = { key: key, pts: pts, list: [] }; hg.push(gr); }
      gr.list.push(e);
    });
    var notes = [];
    hg.forEach(function (gr) {
      var n = gr.pts.length, pre = n > 1 ? n + 'x ' : '', thru = null, cb = [];
      gr.list.forEach(function (e) { if (e.prof > 0 && e.prof < esp) cb.push(e); else thru = e; });
      cb.sort(function (a, b) { return b.d - a.d; });
      var lines = [];
      if (thru) lines.push(pre + 'Ø' + fmt(thru.d) + ' ' + T('passante'));
      cb.forEach(function (e, i) { lines.push((thru || i ? '⌴ ' + T('rebaixo') + ' ' : pre) + 'Ø' + fmt(e.d) + ' ↧ ' + fmt(e.prof)); });
      var big = gr.list.reduce(function (a, e) { return e.d > a.d ? e : a; }, gr.list[0]);
      var p0 = gr.pts.reduce(function (a, q) { return (q[1] - q[0]) > (a[1] - a[0]) ? q : a; }, gr.pts[0]);   // o furo mais em cima/à esquerda
      notes.push({ lines: lines, at: [p0[0] + big.d / 2 * Math.cos(Math.PI * 0.75), p0[1] + big.d / 2 * Math.sin(Math.PI * 0.75)] });
    });
    ents.forEach(function (e) {
      if (e.t !== 'circle' || !(e.cham > 0)) return;
      var hz = ((pw / 2) - e.d / 2) * Math.tan(e.cham * Math.PI / 180);
      notes.push({ lines: [T('Chanfro') + ' ' + fmt(e.cham) + '° ' + T('a partir de') + ' Ø' + fmt(e.d), T('altura') + ' ' + fmt(Math.round(hz * 100) / 100)], at: [e.x + e.d / 2 * Math.cos(Math.PI * 0.8), e.y + e.d / 2 * Math.sin(Math.PI * 0.8)] });
    });
    (function () {   // texto em cima, à esquerda da vista; linha de chamada até o elemento
      var lh = mm(4.6), yy = gy0 + mm(2), xN = gx0;
      notes.forEach(function (nt) {
        font(3.2, 600); g.fillStyle = DIM; g.textAlign = 'left'; g.textBaseline = 'middle';
        var wmax = 0; nt.lines.forEach(function (l, i) { g.fillText(l, xN, yy + i * lh); wmax = Math.max(wmax, g.measureText(l).width); });
        var by = yy + (nt.lines.length - 1) * lh + mm(2.6), ex2 = xN + wmax + mm(2), px = tx(nt.at[0]), py = ty(nt.at[1]);
        g.strokeStyle = DIM; g.lineWidth = mm(0.25); g.beginPath(); g.moveTo(xN, by); g.lineTo(ex2, by); g.lineTo(px, py); g.stroke();
        g.fillStyle = DIM; arrowHead(ex2, by, px, py);
        xN += wmax + mm(10);
      });
    })();

    /* ---------- cortes: material cortado hachurado + o que se vê atrás do plano de corte ---------- */
    var NS = 900;
    function section(axis, v, look, xl, zTop, title, rot) {
      // u = coordenada ao longo do corte; d = profundidade (para onde se olha)
      var a0 = axis === 'h' ? bx0 : by0, a1 = axis === 'h' ? bx1 : by1, len = a1 - a0;
      var flip = axis === 'h' ? look < 0 : look > 0;          // A olhando -Y, ou B olhando +X: o eixo fica invertido no papel
      var d1 = axis === 'h' ? (look > 0 ? by1 : by0) : (look > 0 ? bx1 : bx0);
      function P(uu, dd) { return axis === 'h' ? [uu, dd] : [dd, uu]; }
      function X(uu) { return xl + (flip ? a1 - uu : uu - a0) * S; }
      function Z(z) { return zTop + (top3 - z) * S; }
      var cutH = [], behH = [], du = len / NS, MD = 110;
      for (var i = 0; i <= NS; i++) {
        var uu = a0 + Math.min(len - 1e-6, Math.max(1e-6, i * du)), q = P(uu, v), hc = st.hAt(q[0], q[1]);
        cutH.push(hc);
        var hb = hc;
        for (var j = 1; j <= MD; j++) { var dd = v + (d1 - v) * j / MD, q2 = P(uu, dd), h2 = st.hAt(q2[0], q2[1]); if (h2 != null && (hb == null || h2 > hb)) hb = h2; }
        behH.push(hb);
      }
      function runs(arr) { var R = [], cur = null; arr.forEach(function (h, i) { if (h != null) { if (!cur) { cur = { i0: i, i1: i }; R.push(cur); } cur.i1 = i; } else cur = null; }); return R; }
      function U(i) { return a0 + i * du; }
      function poly(arr, r) {   // contorno de uma faixa: fundo, perfil de cima, fundo
        g.beginPath(); g.moveTo(X(U(r.i0)), Z(bot3));
        for (var i = r.i0; i <= r.i1; i++) g.lineTo(X(U(i)), Z(arr[i]));
        g.lineTo(X(U(r.i1)), Z(bot3)); g.closePath();
      }
      // 1) o que se vê atrás do corte (sem hachura)
      g.setLineDash([]); g.lineJoin = 'miter';
      runs(behH).forEach(function (r) { poly(behH, r); g.strokeStyle = INK; g.lineWidth = mm(0.5); g.stroke(); });
      // 2) material cortado: hachura a 45° e contorno grosso
      var cr = runs(cutH);
      cr.forEach(function (r) {
        poly(cutH, r); g.fillStyle = '#fff'; g.fill();
        g.save(); g.clip(); g.strokeStyle = '#2b2b2b'; g.lineWidth = mm(0.22);
        var x0h = X(U(flip ? r.i1 : r.i0)) - (esp * S + mm(4)), x1h = X(U(flip ? r.i0 : r.i1)) + mm(4), zb = Z(bot3) + mm(2), hh = esp * S + mm(4);
        for (var xh = x0h; xh < x1h; xh += mm(2.2)) { g.beginPath(); g.moveTo(xh, zb); g.lineTo(xh + hh, zb - hh); g.stroke(); }
        g.restore();
        poly(cutH, r); g.strokeStyle = INK; g.lineWidth = mm(0.7); g.stroke();
      });
      // 3) vazios entre as partes cortadas (furo, rasgo, alojamento): linha de centro e cota
      var dimRow = Z(top3) - mm(7), holeDims = [];
      for (var t = 0; t + 1 < cr.length; t++) {
        var ua = U(cr[t].i1), ub = U(cr[t + 1].i0), um = (ua + ub) / 2, wv = ub - ua;
        if (wv < du * 2) continue;
        centerLine(X(um), Z(top3) - mm(3), X(um), Z(bot3) + mm(3));
        var lab = fmt(Math.round(wv * 10) / 10);
        feats.forEach(function (f) { if (f.d && Math.abs((axis === 'h' ? f.x : f.y) - um) < 0.6 && Math.abs((axis === 'h' ? f.y : f.x) - v) < 0.6 && Math.abs(f.d - wv) < Math.max(0.8, du * 3)) lab = 'Ø' + fmt(f.d); });
        holeDims.push([X(ua), X(ub), lab]);
      }
      holeDims.forEach(function (hd) { hdim(Math.min(hd[0], hd[1]), Math.max(hd[0], hd[1]), dimRow, hd[2], Z(top3), Z(top3)); });
      // 4) rebaixos (profundidade) dentro das partes cortadas
      var depDone = {};
      cr.forEach(function (r) {
        var i = r.i0, done = 0;
        while (i <= r.i1 && done < 4) {
          if (cutH[i] < top3 - 0.05) {
            var j = i, hm = cutH[i]; while (j <= r.i1 && cutH[j] < top3 - 0.05) { hm = Math.min(hm, cutH[j]); j++; }
            var flat = 0; for (var q = i; q < j; q++) if (Math.abs(cutH[q] - hm) < 0.05) flat++;
            if (flat > (j - i) * 0.6 && j - i > 3) {   // fundo reto = rebaixo (o chanfro é inclinado)
              var dk = fmt(Math.round((top3 - hm) * 100) / 100);
              if (!depDone[dk]) {   // uma cota por profundidade
                depDone[dk] = 1;
                var xa = X(U(i)), xb = X(U(j - 1)), xe = (xa + xb) / 2;
                var voidAfter = j <= r.i1 ? false : true, sgn = (voidAfter ? 1 : -1) * (xb >= xa ? 1 : -1);   // texto do lado do furo (espaço vazio)
                vdim(xe, Z(top3), Z(hm), dk, null, sgn, true);
                done++;
              }
            }
            i = j;
          } else i++;
        }
      });
      // 5) chanfro: altura e ângulo
      ents.forEach(function (e) {
        if (axis !== 'h' || e.t !== 'circle' || !(e.cham > 0)) return;
        var hz = (pw / 2 - e.d / 2) * Math.tan(e.cham * Math.PI / 180), xr = X(flip ? a0 : a1);
        vdim(xr + mm(6), Z(top3), Z(top3 - hz), fmt(Math.round(hz * 100) / 100), xr, 1);
        g.fillStyle = DIM; font(3.2, 700); g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(fmt(e.cham) + '°', X(flip ? a1 - (pw / 2 - e.d / 2) * 0.35 : a0 + (pw / 2 - e.d / 2) * 0.35) + 0, Z(top3) - mm(1.2));
      });
      // 5b) ressalto redondo cortado no meio: diâmetro, altura e raio da base
      var xL = Math.min(X(a0), X(a1)), xR = Math.max(X(a0), X(a1)), bossRow = 0;
      ents.forEach(function (e) {
        if (e.t !== 'circle' || !(e.ress > 0)) return;
        var cu = axis === 'h' ? e.x : e.y, off = axis === 'h' ? e.y - v : e.x - v;
        if (Math.abs(off) > 0.6) return;
        var hb = Math.min(e.ress, esp - 0.1), zb = top3 - hb, xa = X(cu - e.d / 2), xb = X(cu + e.d / 2), xl2 = Math.min(xa, xb), xr2 = Math.max(xa, xb);
        hdim(xl2, xr2, dimRow - mm(bossRow * 8), 'Ø' + fmt(e.d), Z(top3), Z(top3)); bossRow++;
        vdim(xR + mm(7), Z(top3), Z(zb), fmt(hb), null, 1);
        g.strokeStyle = DIM; g.lineWidth = mm(0.25); g.beginPath(); g.moveTo(xr2 + mm(1), Z(top3)); g.lineTo(xR + mm(8.8), Z(top3)); g.moveTo(xR + mm(1), Z(zb)); g.lineTo(xR + mm(8.8), Z(zb)); g.stroke();
        if (e.rb > 0) {   // R da base: chamada a 45° no meio do arco
          var R = Math.min(e.rb, hb), xc = cu + e.d / 2 + R, zc = zb + R, pu = xc - R * Math.cos(Math.PI / 4), pz = zc - R * Math.sin(Math.PI / 4);
          var px = X(pu), py = Z(pz), sx = X(cu + e.d / 2 + R) > X(cu) ? 1 : -1, tx2 = px + sx * mm(9), ty2 = py - mm(9);
          g.beginPath(); g.moveTo(tx2 + sx * mm(9), ty2); g.lineTo(tx2, ty2); g.lineTo(px, py); g.stroke(); g.fillStyle = DIM; arrowHead(tx2, ty2, px, py);
          font(3.2, 600); g.save(); g.translate(tx2 + sx * mm(5), ty2 - mm(2.6)); if (secRot) g.rotate(-secRot * Math.PI / 180);
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R' + fmt(e.rb), 0, 0); g.restore();
        }
      });
      // 6) cotas gerais: espessura e comprimento
      vdim(xL - mm(7), Z(top3), Z(bot3), fmt(esp), xL, -1);
      hdim(xL, xR, Z(bot3) + mm(8), fmt(len), Z(bot3), Z(bot3));
      // título
      if (title) { g.fillStyle = INK; font(5, 700); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(title, xL, Z(top3) - mm(13)); }
      return xR;
    }
    var secTop = gy0 + mm(Lb.pH + GAPV) + mm(17);
    section('h', cutA, lookA, tx(bx0), secTop, T('CORTE') + ' A-A');
    var colX2 = gx0 + mm(Lb.c1 + GAP), isoR;
    if (TP === 4) {
      var secTopB = secTop + mm(Lb.aH + GAPV);
      section('v', cutB, lookB, area.x + mm(LAB), secTopB, T('CORTE') + ' B-B');
      var ix = area.x + mm(Lb.bW + GAP); isoR = { x: ix, y: secTopB - mm(17), w: FR - mm(6) - ix, h: tbTop - mm(5) - (secTopB - mm(17)) };
    } else if (TP === 1) {
      section('v', cutB, lookB, colX2 + mm(LAB), secTop, T('CORTE') + ' B-B');
      isoR = { x: colX2, y: gy0, w: FR - mm(8) - colX2, h: mm(Lb.pH) };
    } else {
      // B-B em pé, ao lado da vista de cima e alinhado com ela (o topo da peça fica virado para a vista)
      var bx = colX2 + mm(12);
      g.save();
      if (lookB < 0) { g.translate(bx, ty(by0)); g.rotate(-Math.PI / 2); secRot = -90; }     // olhando -X: topo da peça virado para a vista de cima
      else { g.translate(bx + esp * S, ty(by1)); g.rotate(Math.PI / 2); secRot = 90; }      // olhando +X: topo para fora
      section('v', cutB, lookB, 0, 0, null, true);
      g.restore(); secRot = 0;
      g.fillStyle = INK; font(5, 700); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(T('CORTE') + ' B-B', bx - mm(9), ty(by1) - mm(13));
      if (TP === 2) isoR = { x: colX2 - mm(4), y: gy0 + mm(Lb.pH + GAPV), w: FR - mm(6) - colX2, h: tbTop - mm(6) - (gy0 + mm(Lb.pH + GAPV)) };
      else { var iy = secTop + mm(esp * sc + 14); isoR = { x: area.x, y: iy, w: area.w, h: tbTop - mm(5) - iy }; }
    }

    /* ---------- perspectiva isométrica ---------- */
    if (root.Stock3D && isoR.w > 10 && isoR.h > 10) {
      var ic = document.createElement('canvas'); ic.width = Math.round(isoR.w); ic.height = Math.round(isoR.h - mm(4));
      root.Stock3D.render(ic, build3D(), { az: -35, el: 30, zoom: 0.92, panX: 0, panY: 0, print: true, W: ic.width, H: ic.height }, false);
      g.drawImage(ic, isoR.x, isoR.y);
      g.fillStyle = '#555'; font(2.6, 600); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(T('PERSPECTIVA ISOMÉTRICA') + ' (' + T('sem escala') + ')', isoR.x + isoR.w / 2, isoR.y + isoR.h - mm(1));
    }

    /* ---------- moldura e legenda ---------- */
    g.setLineDash([]); g.strokeStyle = INK;
    g.lineWidth = mm(0.7); g.strokeRect(FL, FT, FR - FL, FB - FT);
    // marcas de centro da folha
    g.lineWidth = mm(0.5); g.beginPath();
    g.moveTo((FL + FR) / 2, FT); g.lineTo((FL + FR) / 2, FT - mm(5)); g.moveTo(FL, (FT + FB) / 2); g.lineTo(FL - mm(5), (FT + FB) / 2);
    g.moveTo(FR, (FT + FB) / 2); g.lineTo(FR + mm(5), (FT + FB) / 2); g.moveTo((FL + FR) / 2, FB); g.lineTo((FL + FR) / 2, FB + mm(5)); g.stroke();
    var au = sheetAuthors();
    var tbW = FR - FL, cx0 = FL, rows = [tbTop, tbTop + TBH / 3, tbTop + 2 * TBH / 3, FB];
    function X0(f) { return cx0 + f * tbW / 180; }
    g.lineWidth = mm(0.7); g.beginPath(); g.moveTo(FL, tbTop); g.lineTo(FR, tbTop); g.moveTo(X0(52), tbTop); g.lineTo(X0(52), FB); g.stroke();
    g.lineWidth = mm(0.35); g.beginPath();
    g.moveTo(X0(52), rows[1]); g.lineTo(FR, rows[1]); g.moveTo(X0(52), rows[2]); g.lineTo(FR, rows[2]);
    [[134, 0], [158, 0], [92, 1], [114, 1], [150, 1], [88, 2], [120, 2], [150, 2]].forEach(function (cc) { g.moveTo(X0(cc[0]), rows[cc[1]]); g.lineTo(X0(cc[0]), rows[cc[1] + 1]); });
    g.stroke();
    function cell(f, r, lab, val, big) {
      var x = X0(f) + mm(1.6), y = rows[r];
      g.fillStyle = '#6b6b6b'; font(1.9, 600); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(String(lab).toUpperCase(), x, y + mm(1.3));
      g.fillStyle = INK; font(big ? 4.4 : 3.2, 700); g.textBaseline = 'alphabetic'; g.fillText(val || '', x, rows[r + 1] - mm(2.4));
    }
    cell(52, 0, T('Título'), doc.name, true); cell(134, 0, T('Escala'), scaleTxt); cell(158, 0, T('Folha'), '1/1');
    cell(52, 1, T('Material'), doc.mat || ''); cell(92, 1, T('Espessura'), fmt(esp) + ' mm'); cell(114, 1, T('Tolerância geral'), au.tol); cell(150, 1, T('Formato'), 'A4');
    cell(52, 2, T('Desenho'), au.des); cell(88, 2, T('Conferido'), ''); cell(120, 2, T('Aprovado'), au.apr); cell(150, 2, T('Data'), new Date().toLocaleDateString());
    // bloco da marca + símbolo do 1º diedro
    g.fillStyle = INK; font(5.2, 800); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('MACRO CNC', X0(0) + mm(3), tbTop + mm(9));
    g.fillStyle = '#6b6b6b'; font(2.2, 600); g.fillText(T('Medidas em mm'), X0(0) + mm(3), tbTop + mm(14));
    (function () {   // 1º diedro: tronco de cone à esquerda, círculos à direita
      var sx = X0(0) + mm(4), sy = tbTop + mm(25), hL = mm(6), hS = mm(3.4), Lc = mm(9);
      g.strokeStyle = INK; g.lineWidth = mm(0.35);
      g.beginPath(); g.moveTo(sx, sy - hS / 2); g.lineTo(sx + Lc, sy - hL / 2); g.lineTo(sx + Lc, sy + hL / 2); g.lineTo(sx, sy + hS / 2); g.closePath(); g.stroke();
      var cxs = sx + Lc + mm(7.5); g.beginPath(); g.arc(cxs, sy, hL / 2, 0, 7); g.stroke(); g.beginPath(); g.arc(cxs, sy, hS / 2, 0, 7); g.stroke();
      centerLine(sx - mm(1.5), sy, cxs + hL / 2 + mm(1.5), sy); centerLine(cxs, sy - hL / 2 - mm(1.5), cxs, sy + hL / 2 + mm(1.5));
      g.fillStyle = INK; font(2.4, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(T('1º diedro'), cxs + hL / 2 + mm(3), sy);
    })();
    return c;
  }
  function exportPNG() { var a4 = renderA4(2480, 3508); if (a4) return a4.toBlob(function (b) { shareOrDownload(b, fileName('png')); }, 'image/png'); var c = renderSheet(2400, 1697); c.toBlob(function (b) { shareOrDownload(b, fileName('png')); }, 'image/png'); }
  function pdfBytes() {
    var c = renderA4(2480, 3508), port = !!c; if (!c) c = renderSheet(2480, 1754);
    var jpg = atob(c.toDataURL('image/jpeg', 0.96).split(',')[1]);
    var PWp = port ? 595 : 842, PHp = port ? 842 : 595, parts = [], offs = [], len = 0;
    function add(s) { parts.push(s); len += s.length; }
    function obj(n, body) { offs[n] = len; add(n + ' 0 obj\n' + body + '\nendobj\n'); }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PWp + ' ' + PHp + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    obj(4, '<< /Type /XObject /Subtype /Image /Width ' + c.width + ' /Height ' + c.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n' + jpg + '\nendstream');
    var cs = 'q ' + PWp + ' 0 0 ' + PHp + ' 0 0 cm /Im0 Do Q';
    obj(5, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
    var xref = len, x = 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    add(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var s = parts.join(''), u = new Uint8Array(s.length);
    for (var j = 0; j < s.length; j++) u[j] = s.charCodeAt(j) & 255;
    return u;
  }
  function exportPDF() { shareOrDownload(new Blob([pdfBytes()], { type: 'application/pdf' }), fileName('pdf')); }
  function exportJSON() { var d = clone(doc); delete d.chat; shareOrDownload(new Blob([JSON.stringify({ macrocnc_cad: 1, doc: d })], { type: 'application/json' }), fileName('json')); }
  function pickFile(accept, cb) {
    var i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.onchange = function () { var f = i.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { cb(r.result); }; r.readAsText(f); };
    i.click();
  }
  function importJSON(txt) {
    try {
      var o = JSON.parse(txt), d = o.doc || o;
      if (!d || !Array.isArray(d.ents)) throw 0;
      var id = uid(); d.upd = Date.now(); d.origin = d.origin || { x: 0, y: 0 }; store.docs[id] = d; switchDoc(id); toast(T('Desenho aberto.'));
    } catch (e) { toast(T('Esse arquivo não é uma cópia de desenho do app.')); }
  }

  /* ---------- 3D simples ---------- */
  var v3 = null;
  function loopsOf(list) {   // contornos fechados feitos de linhas e arcos soltos
    var segs = [];
    list.forEach(function (e) {
      if (e.t !== 'line' && e.t !== 'arc') return;
      var p = prims(e)[0], pts;
      if (p.k === 'l') pts = [[p.x1, p.y1], [p.x2, p.y2]];
      else { pts = []; var n = Math.max(4, Math.ceil((p.a1 - p.a0) / 6)); for (var i = 0; i <= n; i++) { var a = (p.a0 + (p.a1 - p.a0) * i / n) * D2R; pts.push([p.x + p.r * Math.cos(a), p.y + p.r * Math.sin(a)]); } }
      segs.push({ pts: pts, e: e, used: false });
    });
    var tol = 0.05, loops = [];
    function same(a, b) { return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol; }
    segs.forEach(function (s0) {
      if (s0.used) return;
      s0.used = true; var poly = s0.pts.slice(), ents = [s0.e], guard = 0;
      while (!same(poly[0], poly[poly.length - 1]) && guard++ < 4000) {
        var end = poly[poly.length - 1], nx = null;
        for (var i = 0; i < segs.length; i++) {
          var s = segs[i]; if (s.used) continue;
          if (same(s.pts[0], end)) nx = s.pts.slice(1); else if (same(s.pts[s.pts.length - 1], end)) nx = s.pts.slice(0, -1).reverse();
          if (nx) { s.used = true; ents.push(s.e); break; }
        }
        if (!nx) break;
        poly = poly.concat(nx);
      }
      if (poly.length > 3 && same(poly[0], poly[poly.length - 1])) loops.push({ pts: poly, ent: ents[0] });
    });
    return loops;
  }
  // contorno fechado feito de arcos/linhas: é um círculo? (todos os pontos à mesma distância do centro)
  function loopInfo(l) {
    var p = l.pts, n = p.length - 1, cx = 0, cy = 0; for (var i = 0; i < n; i++) { cx += p[i][0]; cy += p[i][1]; } cx /= n; cy /= n;
    var r0 = Math.hypot(p[0][0] - cx, p[0][1] - cy), round = p.every(function (q) { return Math.abs(Math.hypot(q[0] - cx, q[1] - cy) - r0) < Math.max(0.05, r0 * 0.002); });
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; p.forEach(function (q) { b.x0 = Math.min(b.x0, q[0]); b.y0 = Math.min(b.y0, q[1]); b.x1 = Math.max(b.x1, q[0]); b.y1 = Math.max(b.y1, q[1]); });
    if (round) { cx = (b.x0 + b.x1) / 2; cy = (b.y0 + b.y1) / 2; }
    return { round: round, cx: cx, cy: cy, d: round ? Math.round(r0 * 2000) / 1000 : 0, b: b, area: polyArea(p) };
  }
  function polyArea(p) { var a = 0; for (var i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); }
  function distPoly(x, y, sh) {   // distância do ponto até a borda do contorno
    var e = sh.ent;
    if (e && e.t === 'circle') return Math.abs(Math.hypot(x - e.x, y - e.y) - e.d / 2);
    var p = sh.pts, best = Infinity;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      var ax = p[j][0], ay = p[j][1], bx = p[i][0], by = p[i][1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
  }
  function inPoly(x, y, p) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; }
  function shapePoly(e) {
    if (e.t === 'circle') { var p = []; for (var i = 0; i < 96; i++) { var a = i / 96 * 2 * Math.PI; p.push([e.x + e.d / 2 * Math.cos(a), e.y + e.d / 2 * Math.sin(a)]); } return p; }
    if (e.t === 'poly') return polyPts(e);
    var r = Math.min(e.r || 0, e.w / 2, e.h / 2); if (!r) return [[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]];
    var out = [], C = [[e.x + e.w - r, e.y + r, 270], [e.x + e.w - r, e.y + e.h - r, 0], [e.x + r, e.y + e.h - r, 90], [e.x + r, e.y + r, 180]];
    C.forEach(function (c) { for (var k = 0; k <= 8; k++) { var a = (c[2] + k * 90 / 8) * D2R; out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } });
    return out;
  }
  function build3D() {
    var top = 0, esp = doc.esp || 20, bottom = -esp, shapes = [];
    var real = doc.ents.filter(function (e) { return !noPart(e); });
    real.forEach(function (e) { if (['circle', 'rect', 'poly'].indexOf(e.t) >= 0) shapes.push({ pts: shapePoly(e), ent: e }); });
    loopsOf(real).forEach(function (l) { shapes.push(l); });
    if (!shapes.length) return null;
    shapes.forEach(function (s) { s.area = polyArea(s.pts); });
    shapes.sort(function (a, b) { return b.area - a.area; });
    var outer = shapes[0];
    var inner = shapes.slice(1).filter(function (s) { var p = s.pts[0], q = s.pts[Math.floor(s.pts.length / 2)]; return inPoly(p[0], p[1], outer.pts) || inPoly((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, outer.pts); });
    // chanfro: a partir deste contorno até a borda da peça, caindo no ângulo dado (medido a partir da face)
    var chams = inner.filter(function (s) { return s.ent && s.ent.cham > 0; }).map(function (s) { s.tg = Math.tan(Math.min(s.ent.cham, 89) * Math.PI / 180); return s; });
    inner = inner.filter(function (s) { return !(s.ent && s.ent.cham > 0); });
    // ressalto: sobe até o topo da peça (Z0); fora dele a face fica mais baixa. rb = raio na base (concordância)
    var bosses = inner.filter(function (s) { return s.ent && s.ent.ress > 0; });
    inner = inner.filter(function (s) { return !(s.ent && s.ent.ress > 0); });
    var hMax = 0; bosses.forEach(function (b) { hMax = Math.max(hMax, Math.min(b.ent.ress, esp - 0.1)); });
    var base = top - hMax;
    var holes = []; doc.ents.forEach(function (e) { if (e.t === 'holes') holePts(e).forEach(function (q) { holes.push([q[0], q[1], e.d / 2, e.prof]); }); });
    var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    outer.pts.forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
    var res = 200, cell = Math.max(bx1 - bx0, by1 - by0) / res, nx = Math.ceil((bx1 - bx0) / cell) + 3, ny = Math.ceil((by1 - by0) / cell) + 3, x0 = bx0 - cell, y0 = by0 - cell;
    // altura da peça no ponto (x, y): null = sem material (fora ou furo passante)
    function hAt(x, y) {
      if (!inPoly(x, y, outer.pts)) return null;
      var hv = base;
      for (var b2 = 0; b2 < bosses.length; b2++) {
        var bs = bosses[b2], bh = base + Math.min(bs.ent.ress, esp - 0.1);
        if (inPoly(x, y, bs.pts)) hv = Math.max(hv, bh);
        else if (bs.ent.rb > 0) { var dd = distPoly(x, y, bs), R = Math.min(bs.ent.rb, bh - base); if (dd < R) hv = Math.max(hv, base + R - Math.sqrt(Math.max(0, R * R - (R - dd) * (R - dd)))); }
      }
      var face = hv;   // face local (topo do ressalto ou face de baixo): rebaixos e furos contam a partir dela
      for (var c2 = 0; c2 < chams.length; c2++) { var ch = chams[c2]; if (!inPoly(x, y, ch.pts)) hv = Math.min(hv, top - distPoly(x, y, ch) * ch.tg); }
      for (var s = 0; s < inner.length; s++) { var sh = inner[s]; if (inPoly(x, y, sh.pts)) { var pf = sh.ent && sh.ent.prof; if (pf > 0 && pf < face - bottom) hv = Math.min(hv, face - pf); else return null; } }
      for (var q = 0; q < holes.length; q++) { var ho = holes[q]; if ((x - ho[0]) * (x - ho[0]) + (y - ho[1]) * (y - ho[1]) <= ho[2] * ho[2]) { if (ho[3] > 0 && ho[3] < face - bottom) hv = Math.min(hv, face - ho[3]); else return null; } }
      return hv;
    }
    var h = new Float32Array(nx * ny), h0 = new Float32Array(nx * ny), ins = new Uint8Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var k = j * nx + i, hv = hAt(x0 + i * cell, y0 + j * cell);
      h[k] = hv == null ? top : hv; h0[k] = h[k]; ins[k] = hv == null ? 0 : 1;
    }
    return { hAt: hAt, ob: [bx0, by0, bx1, by1], exp: null, h0: h0, sim: { zMin: bottom }, D: 0, r: 0, top: top, bottom: bottom, x0: x0, y0: y0, cell: cell, nx: nx, ny: ny, h: h, inside: ins, idx: 0, collisions: [], tool: null, shape: 'rect',
      label: T('1 dedo gira · 2 dedos zoom e move') + ' · ' + T('espessura') + ' ' + fmt(esp) + ' mm' };
  }
  function openFull(html) { el.full.innerHTML = html; el.full.classList.remove('hidden'); }
  function closeFull() { el.full.classList.add('hidden'); el.full.innerHTML = ''; v3 = null; agentOpen = false; }
  function open3D() {
    if (!root.Stock3D) return toast(T('3D não disponível.'));
    var st = build3D();
    if (!st) return toast(T('Desenhe o contorno da peça (círculo, retângulo, polígono ou linhas fechadas) para ver em 3D.'));
    openFull('<div class="cad-fh"><b>' + esc(T('Vista 3D')) + '</b><button type="button" class="cad-b" data-a="full_close" aria-label="Fechar">✕</button></div>' +
      '<div class="cad-3d"><canvas id="cad3d"></canvas></div>' +
      '<div class="cad-3dbar"><label class="cad-f"><span>' + esc(T('Espessura da peça (mm)')) + '</span><input type="text" inputmode="decimal" data-esp="1" value="' + fmt(doc.esp || 20) + '"></label>' +
      depthList() +
      '<p class="cad-hint">' + esc(T('O maior contorno é a peça. Furos e contornos de dentro sem profundidade são passantes; com profundidade viram rebaixo. Para mudar a profundidade, selecione o elemento.')) + '</p></div>');
    v3 = { st: st, view: { az: -35, el: 38, zoom: 1, panX: 0, panY: 0 }, cv: el.full.querySelector('#cad3d') };
    bind3D(); render3D();
  }
  /* lista dos elementos de dentro com a profundidade de cada um (vazio = passante), direto na vista 3D */
  function depthList() {
    var cand = [], big = null, bigA = -1;
    doc.ents.forEach(function (e, i) {
      if (['circle', 'rect', 'poly'].indexOf(e.t) >= 0) { var a = Math.abs(polyArea(shapePoly(e))); if (a > bigA) { bigA = a; big = i; } }
    });
    doc.ents.forEach(function (e, i) { if ((['circle', 'rect', 'poly'].indexOf(e.t) >= 0 && i !== big) || e.t === 'holes') cand.push(i); });
    if (!cand.length) return '';
    return '<div class="cad-dl"><b>' + esc(T('Profundidade de cada elemento (vazio = passante)')) + '</b>' + cand.map(function (i) {
      var e = doc.ents[i], n = e.t === 'holes' ? holePts(e).length : 1;
      var nm = e.t === 'circle' ? T('Círculo') + ' Ø' + fmt(e.d) : e.t === 'holes' ? (n === 1 ? T('Furo') : n + ' ' + T('furos')) + ' Ø' + fmt(e.d) : e.t === 'rect' ? T('Retângulo') + ' ' + fmt(e.w) + ' x ' + fmt(e.h) : T('Polígono') + ' ' + e.n + ' ' + T('lados');
      var kind = e.ign ? 'ign' : e.ress > 0 ? 'ress' : e.cham > 0 ? 'cham' : e.prof > 0 ? 'prof' : 'pas', val = e.ign ? '' : e.ress > 0 ? fmt(e.ress) : e.cham > 0 ? fmt(e.cham) : e.prof > 0 ? fmt(e.prof) : '';
      var opts = [['pas', 'Passante'], ['prof', 'Rebaixo (prof. mm)']];
      if (e.t !== 'holes') opts.push(['ress', 'Ressalto (altura mm)'], ['cham', 'Chanfro até a borda (ângulo °)'], ['ign', 'Ignorar']);
      var info = '';
      if (kind === 'cham') { var w = chamWidth(e, big); if (w > 0) info = '<small>' + esc(T('largura') + ' ' + fmt(w) + ' · ' + T('altura') + ' ' + fmt(w * Math.tan(e.cham * Math.PI / 180))) + ' mm</small>'; }
      return '<div class="cad-dli"><span>' + esc(nm) + info + '</span><select data-kind3d="' + i + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === kind ? ' selected' : '') + '>' + esc(T(o[1])) + '</option>'; }).join('') + '</select>' +
        '<input type="text" inputmode="decimal" data-val3d="' + i + '"' + (kind === 'pas' || kind === 'ign' ? ' disabled' : '') + ' value="' + val + '">' +
        (kind === 'ress' ? '<label class="cad-rb">' + esc(T('raio na base')) + ' R <input type="text" inputmode="decimal" data-rb3d="' + i + '" value="' + (e.rb > 0 ? fmt(e.rb) : '') + '" placeholder="0"></label>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // o que é cada elemento de dentro: passante, rebaixo (prof), ressalto (altura + raio na base) ou chanfro (ângulo)
  function setKind(en, kd, pv, rb) {
    var was = en.ign ? 'ign' : en.ress > 0 ? 'ress' : en.cham > 0 ? 'cham' : en.prof > 0 ? 'prof' : 'pas';
    if (kd !== was) pv = NaN;   // trocou o tipo: valor padrão do tipo novo
    delete en.prof; delete en.cham; delete en.ress; delete en.rb; delete en.ign;
    if (kd === 'ign') en.ign = 1;
    if (kd === 'prof') en.prof = pv > 0 ? pv : 5;
    if (kd === 'cham') en.cham = pv > 0 && pv < 90 ? pv : 30;
    if (kd === 'ress') { en.ress = pv > 0 ? pv : Math.round((doc.esp || 20) / 2); if (rb > 0) en.rb = rb; }
  }
  function chamWidth(e, bigIdx) {   // largura do chanfro: do contorno até a borda da peça (círculos concêntricos)
    var o = doc.ents[bigIdx]; if (!o || e.t !== 'circle') return 0;
    if (o.t === 'circle' && Math.hypot(o.x - e.x, o.y - e.y) < 1e-6) return (o.d - e.d) / 2;
    return 0;
  }
  function refreshDepth() { var d = el.full && el.full.querySelector('.cad-dl'); if (d) { var t = document.createElement('div'); t.innerHTML = depthList(); d.parentNode.replaceChild(t.firstChild, d); } }
  function render3D(rebuild) {
    if (!v3) return;
    if (rebuild) { var st = build3D(); if (st) v3.st = st; }
    root.Stock3D.render(v3.cv, v3.st, v3.view, false);
  }
  function bind3D() {
    var cv = v3.cv, P = {}, last = null, pin = null;
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); P[e.pointerId] = [e.clientX, e.clientY]; last = [e.clientX, e.clientY]; var k = Object.keys(P); if (k.length === 2) { var a = P[k[0]], b = P[k[1]]; pin = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: v3.view.zoom, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], px: v3.view.panX, py: v3.view.panY }; } });
    cv.addEventListener('pointermove', function (e) {
      if (!P[e.pointerId] || !v3) return; P[e.pointerId] = [e.clientX, e.clientY]; var k = Object.keys(P);
      if (k.length >= 2 && pin) { var a = P[k[0]], b = P[k[1]]; v3.view.zoom = Math.max(0.3, Math.min(8, pin.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pin.d || 1))); v3.view.panX = pin.px + (a[0] + b[0]) / 2 - pin.m[0]; v3.view.panY = pin.py + (a[1] + b[1]) / 2 - pin.m[1]; }
      else { v3.view.az += (e.clientX - last[0]) * 0.5; v3.view.el = Math.max(5, Math.min(89, v3.view.el + (e.clientY - last[1]) * 0.35)); last = [e.clientX, e.clientY]; }
      render3D();
    });
    function up(e) { delete P[e.pointerId]; pin = null; var k = Object.keys(P); if (k.length) last = P[k[0]]; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); v3.view.zoom = Math.max(0.3, Math.min(8, v3.view.zoom * Math.exp(-e.deltaY * 0.0015))); render3D(); }, { passive: false });
  }

  /* ---------- G65 ---------- */
  function g65Kind(e) {
    if (!e || e.cor) return null;
    if (e.t === 'holes') return e.mode === 'pcd' ? 'pcd' : e.mode === 'um' ? 'helice' : 'g81';
    if (e.t === 'circle') return 'helice';
    if (e.t === 'rect') return 'ret';
    if (e.t === 'poly') return 'poli';
    return null;
  }
  function gv(v) { var r = Math.round(v * 1000) / 1000; if (Object.is(r, -0)) r = 0; if (r === 0) return '0'; return Number.isInteger(r) ? r + '.' : String(r); }
  function g65Call(e) {
    var k = g65Kind(e); if (!k || k === 'g81') return null;
    var o = doc.origin, z = '-' + gv(e.prof > 0 ? e.prof : (doc.esp || 20)), call, id;
    function XY(x, y) { return 'X' + gv(x - o.x) + ' Y' + gv(y - o.y); }
    if (k === 'pcd') { id = 'm-pcd'; call = 'G65 P1612 ' + XY(e.x, e.y) + ' J' + gv(e.pcd) + ' B' + e.n + ' A' + gv(nang(e.a0)) + ' H0 W0 Z' + z + ' R5. Q0 F150.'; }
    else if (k === 'helice') { id = 'm-helice'; var d = e.d, t = Math.max(4, Math.round(d * 0.6)); call = 'G65 P1613 ' + XY(e.x, e.y) + ' D' + gv(d) + ' T' + gv(t) + ' W0 Z' + z + ' K2. R5. F800.'; }
    else if (k === 'ret') { id = 'm-ret'; call = 'G65 P1616 ' + XY(e.x + e.w / 2, e.y + e.h / 2) + ' I' + gv(e.w) + ' J' + gv(e.h) + ' C' + gv(e.r || 0) + ' T25. W0 Z' + z + ' K2. A20. R5. F800.'; }
    else if (k === 'poli') { id = 'm-poli'; call = 'G65 P1617 ' + XY(e.x, e.y) + ' B' + e.n + ' D' + gv(polyR(e) * 2) + ' A' + gv(nang(e.ang)) + ' E20. T25. W0 Z' + z + ' K2. R5. F800.'; }
    return { id: id, call: call };
  }
  function g81Prog(e) {
    var o = doc.origin, z = '-' + gv(e.prof > 0 ? e.prof : (doc.esp || 20)), pts = holePts(e);
    function XY(x, y) { return 'X' + gv(x - o.x) + ' Y' + gv(y - o.y); }
    var nm = String(doc.name).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 20);
    var L = ['%', 'O0050 (FURACAO G81 - ' + pts.length + ' FUROS D' + gv(e.d).replace(/\.$/, '') + (nm ? ' - ' + nm : '') + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T10 ;', 'M6 ;',
      'G0 ' + XY(pts[0][0], pts[0][1]) + ' ;', 'S1200 M3 ;', 'G43 H10 Z120. ;', 'M8 ;', 'G99 G81 ' + XY(pts[0][0], pts[0][1]) + ' Z' + z + ' R5. F150. ;'];
    pts.slice(1).forEach(function (q) { L.push(XY(q[0], q[1]) + ' ;'); });
    L.push('G80 ;', 'G98 ;', 'G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%');
    return L.join('\n');
  }
  function g65For(e) {
    var k = g65Kind(e); if (!k) return;
    if (k === 'g81') {
      if (root.App && root.App.openEditor) { root.App.openEditor(g81Prog(e), T('Furação') + ' ' + doc.name); toast(T('Programa de furação no Editor. Confira T, S, F e Z antes de rodar.')); }
      return;
    }
    var g = g65Call(e);
    if (root.App && root.App.openProgCall) root.App.openProgCall(g.id, g.call);
  }

  /* ---------- agente ---------- */
  var agentOpen = false, agentBusy = null, attach = null;
  function agentSys() {
    var L = (root.I18N && root.I18N.lang) || 'pt';
    var lang = L === 'en' ? 'Always answer in English (US shop-floor terms).' : L === 'fr-CA' ? 'Réponds toujours en français du Québec.' : 'Responda sempre em português do Brasil.';
    return [
      'Você é o Assistente CNC do app Macro CNC, trabalhando na aba Desenho (um CAD 2D simples). ' + lang + ' Fale curto e direto, como colega de chão de fábrica.',
      'Você pode desenhar e mudar o desenho mandando ações. Responda com um texto curto e, se for mexer no desenho, um único bloco ```json com {"actions":[...]} no fim.',
      'Unidades: mm. Ângulos em graus, 0 = para a direita (+X), anti-horário. TODAS as coordenadas das ações e do estado são em relação à origem X0 Y0 do desenho.',
      'Tipos de elemento (campo "t"):',
      '- circle: x, y (centro), d (diâmetro), prof (opcional: profundidade se for rebaixo; sem prof = passante quando fica dentro da peça), cham (opcional: ângulo em graus de um chanfro que começa neste círculo e vai até a borda da peça; ex.: face chanfrada a 30°).',
      '- rect: x, y (canto esquerdo de baixo), w (largura em X), h (altura em Y), r (raio nos cantos, 0 = vivo), prof (opcional).',
      '- line: x1, y1, x2, y2.',
      '- arc: x, y (centro), r, a0, a1 (de a0 até a1 no sentido anti-horário, a1 > a0).',
      '- poly: x, y (centro), n (lados), med ("faces" ou "cantos"), v (medida entre faces ou entre cantos), ang (ângulo do 1º canto), prof (opcional).',
      '- holes: d (diâmetro do furo), prof (opcional; sem = passante), mode: "um" (x, y) | "pcd" (x, y = centro do PCD, pcd = diâmetro do PCD, n, a0 = ângulo do 1º furo) | "linha" (x, y do 1º, n, dist, ang) | "grade" (x, y do 1º embaixo à esquerda, nx, ny, dx, dy) | "lista" (pts: [[x,y],...]).',
      '- dim (cota): k "lin" (p1:{x,y}, p2:{x,y}, o "h"|"v"|"a", q:{x,y} = ponto por onde passa a linha da cota) | k "dia" ou "rad" (c:{id: id do elemento}, ang = ângulo da seta) | k "ord" (p:{x,y}).',
      'Ações:',
      '- {"op":"add","ent":{...}}',
      '- {"op":"update","id":"...","set":{campos a trocar}}',
      '- {"op":"delete","ids":["..."]}',
      '- {"op":"clear"} (apaga tudo)',
      '- {"op":"origin","x":..,"y":..} (move a origem para esse ponto; as outras coordenadas da mesma resposta continuam em relação à origem antiga)',
      '- {"op":"fillet","l1":"id linha","l2":"id linha","r":5} ou {"op":"fillet","l1":..,"l2":..,"c":[2,2]} (raio ou chanfro no canto entre duas linhas soltas). Para cantos de retângulo use update com "r".',
      '- {"op":"autodim"} (cota tudo automático)',
      '- {"op":"esp","v":20} (espessura da peça para o 3D)',
      'Regras: desenhe a peça vista de cima. Peça redonda: centro na origem. Peça retangular: canto de baixo à esquerda na origem, a não ser que o operador peça outra coisa. Furos sempre como "holes" (com a quantidade certa). Não invente medida: se faltar uma essencial, pergunte; se o operador mandar seguir, use um valor razoável e diga qual. Para apagar ou mudar elemento existente use os ids do estado.',
      'Quando receber FOTO de desenho técnico: use as medidas escritas nas cotas (não a escala da foto), identifique a vista de cima, diga numa lista curta o que leu e o que ficou duvidoso, e desenhe. Some cotas encadeadas com cuidado. Furos com "nx Ø" = quantidade. Se houver PCD, use mode "pcd". No fim mande {"op":"autodim"} se o operador não disse o contrário.',
      'Perguntas de medida (distância, posição, ângulo): calcule a partir do estado e responda, sem ações.',
      'Se o operador pedir programa G65 / G-code, diga que é só tocar no elemento e no botão G65 do painel, ou escreva a chamada no padrão do app (ex.: G65 P1612 X0 Y0 J240. B8 A22.5 H0 W0 Z-20. R5. Q0 F150.).'
    ].join('\n');
  }
  function stateText() {
    var o = doc.origin;
    function r(v, a) { return Math.round((v - a) * 1000) / 1000; }
    var ents = doc.ents.map(function (e) {
      if (e.t === 'dim') return { id: e.id, t: 'dim', k: e.k, texto: dimText(e) };
      var c = clone(e); delete c.cor; delete c.ref;
      ['x', 'x1', 'x2'].forEach(function (k) { if (c[k] != null) c[k] = r(c[k], o.x); });
      ['y', 'y1', 'y2'].forEach(function (k) { if (c[k] != null) c[k] = r(c[k], o.y); });
      if (c.pts) c.pts = c.pts.map(function (p) { return [r(p[0], o.x), r(p[1], o.y)]; });
      ['d', 'w', 'h', 'r', 'a0', 'a1', 'v', 'ang', 'pcd', 'dist', 'dx', 'dy'].forEach(function (k) { if (typeof c[k] === 'number') c[k] = Math.round(c[k] * 1000) / 1000; });
      return c;
    });
    return 'ESTADO ATUAL DO DESENHO (coordenadas em relação à origem; espessura ' + (doc.esp || 20) + ' mm):\n' + JSON.stringify(ents);
  }
  function openAgent() {
    closeModal(); agentOpen = true;
    var ready = root.Assistant && root.Assistant.isReady();
    openFull('<div class="cad-fh"><b>' + esc(T('Agente do desenho')) + '</b><span><button type="button" class="cad-b" data-a="agclear" aria-label="Limpar conversa">' + ic('trash') + '</button><button type="button" class="cad-b" data-a="full_close" aria-label="Fechar">✕</button></span></div>' +
      '<div class="cad-chat" id="cadChat"></div>' +
      (ready ? '' : '<p class="cad-hint cad-warn">' + esc(T('O assistente ainda não está configurado. Configure em Perfil > Configurações (chave da API ou proxy).')) + '</p>') +
      '<div class="cad-att hidden" id="cadAtt"></div>' +
      '<div class="cad-cin"><span class="cad-b cad-cam cad-pickw" aria-label="Foto">📷' + pickIn('ag') + '</span><textarea id="cadMsg" rows="2" placeholder="' + esc(T('Ex.: disco Ø300 com furo central Ø80 e 8 furos Ø12 no PCD 240')) + '"></textarea><button type="button" class="ui-btn primary" data-a="agsend" id="cadSend">' + esc(T('Enviar')) + '</button></div>');
    renderChat();
    var ta = el.full.querySelector('#cadMsg');
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !/Android|iPhone|iPad/i.test(navigator.userAgent)) { e.preventDefault(); agentSend(); } });
    ta.addEventListener('paste', function (e) {   // colar a imagem direto na caixa de mensagem
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { e.preventDefault(); readImage(items[i].getAsFile(), 1568, function (src) { agentAttach(src); }); return; }
    });
    if (attach) showAttach();
  }
  function renderChat() {
    var box = el.full && el.full.querySelector('#cadChat'); if (!box) return;
    var ch = doc.chat || [];
    if (!ch.length) box.innerHTML = '<div class="cad-hint">' + esc(T('Peça para desenhar, mudar, cotar ou medir. Você também pode mandar a foto de um desenho de papel.')) + '</div>';
    else box.innerHTML = ch.map(function (m, i) {
      var h = '<div class="cad-msg ' + m.role + (m.err ? ' err' : '') + '">';
      if (m.img) h += '<img src="' + m.img + '" alt="">';
      h += '<div class="notr">' + esc(m.show != null ? m.show : m.text).replace(/\n/g, '<br>') + '</div>';
      if (m.pending) h += '<div class="cad-pend"><small>' + esc(m.pending.sum) + '</small><div class="cad-pbtn">' + btn('agcancel', 'Cancelar', '', ' data-i="' + i + '"') + btn('agapply', 'Aplicar', 'primary', ' data-i="' + i + '"') + '</div></div>';
      if (m.done) h += '<small class="cad-ok">✓ ' + esc(m.done) + '</small>';
      return h + '</div>';
    }).join('');
    var sb = el.full.querySelector('#cadSend'); if (sb) { sb.textContent = T(agentBusy ? 'Parar' : 'Enviar'); sb.dataset.a = agentBusy ? 'agstop' : 'agsend'; }
    box.scrollTop = box.scrollHeight;
  }
  function showAttach() {
    var a = el.full.querySelector('#cadAtt'); if (!a) return;
    a.innerHTML = '<img src="' + attach + '" alt=""><span>' + esc(T('Foto anexada')) + '</span><span class="cad-b cad-cam cad-pickw" aria-label="Trocar foto">↻' + pickIn('ag') + '</span><button type="button" class="cad-b" data-a="agnophoto" aria-label="Tirar foto">✕</button>';
    a.classList.remove('hidden');
  }
  function agentAttach(src) { attach = src; if (!agentOpen) openAgent(); else showAttach(); }
  function agentSendPhoto(src) { attach = src; openAgent(); var ta = el.full.querySelector('#cadMsg'); if (ta && !ta.value) ta.value = T('Leia este desenho e desenhe a peça com as medidas.'); agentSend(); }
  function apiMessages() {
    var ch = (doc.chat || []).filter(function (m) { return !m.err && (m.text || m.img); }).slice(-12), msgs = [];
    ch.forEach(function (m, i) {
      var last = i === ch.length - 1, txt = m.role === 'assistant' ? m.text : m.text;
      if (last && m.role === 'user') txt = stateText() + '\n\nPEDIDO DO OPERADOR:\n' + txt;
      var content = (m.img && last) ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.img.split(',')[1] } }, { type: 'text', text: txt }] : txt;
      var prev = msgs[msgs.length - 1];
      if (prev && prev.role === m.role) {   // junta mensagens seguidas do mesmo lado
        if (typeof prev.content === 'string' && typeof content === 'string') prev.content += '\n\n' + content;
        else { var a = typeof prev.content === 'string' ? [{ type: 'text', text: prev.content }] : prev.content; prev.content = a.concat(typeof content === 'string' ? [{ type: 'text', text: content }] : content); }
      } else msgs.push({ role: m.role, content: content });
    });
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    return msgs;
  }
  async function agentSend() {
    if (agentBusy) return;
    var ta = el.full.querySelector('#cadMsg'), text = (ta.value || '').trim();
    if (!text && !attach) return;
    if (!root.Assistant || !root.Assistant.isReady() || !root.Assistant.sendRaw) return toast(T('O assistente ainda não está configurado. Configure em Perfil > Configurações (chave da API ou proxy).'));
    if (!text) text = T('Leia este desenho e desenhe a peça com as medidas.');
    doc.chat = (doc.chat || []).filter(function (m) { return !m.err; });
    var um = { role: 'user', text: text }; if (attach) um.img = attach;
    // só a foto mais nova fica guardada (espaço no aparelho)
    doc.chat.forEach(function (m) { if (m.img) { m.img = null; m.text = '[' + T('foto') + '] ' + m.text; } });
    doc.chat.push(um);
    attach = null; ta.value = ''; var at = el.full.querySelector('#cadAtt'); if (at) at.classList.add('hidden');
    var msgs = apiMessages();
    var am = { role: 'assistant', text: '', show: '…' }; doc.chat.push(am);
    agentBusy = new AbortController(); renderChat();
    try {
      var full = await root.Assistant.sendRaw(agentSys(), msgs, function (t) { am.text = t; am.show = stripJson(t) || '…'; renderChat(); }, agentBusy.signal, 6000);
      am.text = full; am.show = stripJson(full) || T('Feito.');
      var acts = parseActions(full);
      if (acts && acts.length) {
        var sm = summarize(acts);
        if (sm.risky) am.pending = { acts: acts, sum: sm.text };
        else am.done = runActions(acts);
      }
    } catch (e) {
      am.err = 1; am.show = e.name === 'AbortError' ? T('(cancelado)') : '⚠ ' + (e.message || T('Erro no assistente.'));
    }
    agentBusy = null;
    doc.chat = doc.chat.slice(-30);
    save(); renderChat();
  }
  function stripJson(t) { return String(t || '').replace(/```json[\s\S]*?(```|$)/g, '').replace(/```[\s\S]*?```/g, '').trim(); }
  function parseActions(t) {
    var m = /```json\s*([\s\S]*?)```/.exec(t || ''); if (!m) return null;
    try { var o = JSON.parse(m[1]); return Array.isArray(o) ? o : o.actions || null; } catch (e) { return null; }
  }
  function summarize(acts) {
    var c = { add: 0, update: 0, del: 0, clear: 0, other: 0 };
    acts.forEach(function (a) { if (a.op === 'add') c.add++; else if (a.op === 'update') c.update++; else if (a.op === 'delete') c.del += (a.ids || []).length; else if (a.op === 'clear') c.clear++; else c.other++; });
    var parts = [];
    if (c.clear) parts.push(T('apagar tudo'));
    if (c.del) parts.push(T('apagar') + ' ' + c.del);
    if (c.update) parts.push(T('alterar') + ' ' + c.update);
    if (c.add) parts.push(T('adicionar') + ' ' + c.add);
    if (c.other) parts.push(T('outros ajustes') + ' ' + c.other);
    var risky = c.clear > 0 || c.del > 0 || c.update > 2 || (c.add > 25 && doc.ents.length > 0);
    return { risky: risky, text: T('O agente quer') + ': ' + parts.join(' · ') };
  }
  function applyPending(i) { var m = doc.chat[+i]; if (!m || !m.pending) return; m.done = runActions(m.pending.acts); delete m.pending; save(); renderChat(); }
  function cancelPending(i) { var m = doc.chat[+i]; if (!m) return; delete m.pending; m.done = T('cancelado'); save(); renderChat(); }
  function absEnt(e, o) {
    var n = clone(e); delete n.id;
    ['x', 'x1', 'x2'].forEach(function (k) { if (n[k] != null) n[k] = +n[k] + o.x; });
    ['y', 'y1', 'y2'].forEach(function (k) { if (n[k] != null) n[k] = +n[k] + o.y; });
    if (n.pts) n.pts = n.pts.map(function (p) { return [+p[0] + o.x, +p[1] + o.y]; });
    ['p1', 'p2', 'p', 'q'].forEach(function (k) { if (n[k]) n[k] = { x: +n[k].x + o.x, y: +n[k].y + o.y }; });
    ['d', 'w', 'h', 'r', 'a0', 'a1', 'v', 'ang', 'pcd', 'dist', 'dx', 'dy', 'n', 'nx', 'ny', 'prof', 'cham'].forEach(function (k) { if (n[k] != null && n[k] !== '') n[k] = +n[k]; });
    return n;
  }
  function relEnt(e) {
    var o = doc.origin, c = clone(e);
    ['x', 'x1', 'x2'].forEach(function (k) { if (c[k] != null) c[k] -= o.x; });
    ['y', 'y1', 'y2'].forEach(function (k) { if (c[k] != null) c[k] -= o.y; });
    if (c.pts) c.pts = c.pts.map(function (p) { return [p[0] - o.x, p[1] - o.y]; });
    ['p1', 'p2', 'p', 'q'].forEach(function (k) { if (c[k]) c[k] = { x: c[k].x - o.x, y: c[k].y - o.y }; });
    return c;
  }
  function validEnt(n) {
    var ok = { circle: n.d > 0, rect: n.w > 0 && n.h > 0, line: isFinite(n.x1) && isFinite(n.y1) && isFinite(n.x2) && isFinite(n.y2), arc: n.r > 0 && isFinite(n.a0) && isFinite(n.a1), poly: n.n >= 3 && n.v > 0, holes: n.d > 0, dim: !!n.k };
    if (!ok[n.t]) return false;
    if (n.t !== 'dim' && n.t !== 'line' && !(n.t === 'holes' && n.mode === 'lista') && !(isFinite(n.x) && isFinite(n.y))) return false;
    if (n.t === 'holes') {
      n.mode = n.mode || 'um';
      if (n.mode === 'lista') { if (!(n.pts && n.pts.length)) return false; n.x = n.pts[0][0]; n.y = n.pts[0][1]; }
      ['n', 'nx', 'ny'].forEach(function (k) { if (n[k] != null) n[k] = Math.max(1, Math.round(n[k])); });
      if (n.mode === 'pcd') { n.a0 = n.a0 || 0; if (!(n.pcd > 0 && n.n >= 1)) return false; }
      if (n.mode === 'linha') { n.ang = n.ang || 0; if (!(n.n >= 1) || !isFinite(n.dist)) return false; }
      if (n.mode === 'grade' && !(n.nx >= 1 && n.ny >= 1 && isFinite(n.dx) && isFinite(n.dy))) return false;
      if (holePts(n).length > 2000) return false;
    }
    if (n.t === 'rect') { n.r = Math.min(Math.max(0, n.r || 0), n.w / 2, n.h / 2); n.ref = n.ref || 'canto'; }
    if (n.t === 'arc') { var sw = nang(n.a1 - n.a0) || 360; n.a1 = n.a0 + sw; }
    if (n.t === 'poly') { n.med = n.med === 'cantos' ? 'cantos' : 'faces'; n.ang = n.ang || 0; n.n = Math.round(n.n); if (n.n > 64) return false; }
    if (n.t === 'dim') {
      if (n.k === 'dia' || n.k === 'rad') { var tg = n.c && byId(n.c.id || (n.c.ref && n.c.ref.id)); if (!tg || tg.t === 'dim') return false; var pi = tg.t === 'holes' && tg.mode === 'pcd' ? 1 : 0, p = prims(tg)[pi]; if (!p || p.k === 'l') return false; n.c = { ref: { id: tg.id, pi: pi }, x: p.x, y: p.y, r: p.r }; n.ang = n.ang == null ? 45 : +n.ang; }
      else if (n.k === 'lin') { if (!n.p1 || !n.p2) return false; n.o = ['h', 'v', 'a'].indexOf(n.o) >= 0 ? n.o : 'h'; if (!n.q) n.q = { x: (n.p1.x + n.p2.x) / 2, y: Math.min(n.p1.y, n.p2.y) - 15 }; }
      else if (n.k === 'ord') { if (!n.p) return false; }
      else return false;
    }
    if (n.prof != null && !(n.prof > 0)) delete n.prof;
    if (n.cham != null && !(n.cham > 0 && n.cham < 90)) delete n.cham;
    return true;
  }
  function runActions(acts) {
    pushUndo();
    var o = { x: doc.origin.x, y: doc.origin.y }, n = 0, bad = 0;
    acts.forEach(function (a) {
      try {
        if (a.op === 'add' && a.ent) { var e = absEnt(a.ent, o); if (validEnt(e)) { e.id = uid(); doc.ents.push(e); n++; } else bad++; }
        else if (a.op === 'update') {
          var t = byId(a.id); if (!t || t.t === 'dim') { bad++; return; }
          var nw = absEnt(Object.assign(relEnt(t), a.set || {}), o); nw.t = t.t;
          if (validEnt(nw)) { nw.id = t.id; delete nw.cor; doc.ents[doc.ents.indexOf(t)] = nw; n++; } else bad++;
        }
        else if (a.op === 'delete') { (a.ids || []).forEach(function (id) { var t2 = byId(id); if (t2) { doc.ents.splice(doc.ents.indexOf(t2), 1); n++; } }); }
        else if (a.op === 'clear') { doc.ents = []; n++; }
        else if (a.op === 'origin') { doc.origin = { x: o.x + (+a.x || 0), y: o.y + (+a.y || 0) }; n++; }
        else if (a.op === 'esp' && a.v > 0) { doc.esp = +a.v; n++; }
        else if (a.op === 'autodim') { autoDimCore(); n++; }
        else if (a.op === 'fillet') {
          var L1 = byId(a.l1), L2 = byId(a.l2); if (!L1 || !L2 || L1.t !== 'line' || L2.t !== 'line') { bad++; return; }
          var mid = function (L) { return [(L.x1 + L.x2) / 2, (L.y1 + L.y2) / 2]; };
          var isC = Array.isArray(a.c), v = isC ? +a.c[0] : +a.r, v2 = isC ? (a.c[1] != null ? +a.c[1] : v) : null;
          if (doFillet({ e: L1, pi: 0, tap: mid(L1) }, { e: L2, pi: 0, tap: mid(L2) }, isC ? 'c' : 'r', v, v2, true)) n++; else bad++;
        } else bad++;
      } catch (err) { bad++; }
    });
    save(); setTool('select'); fit();
    return n + ' ' + T('mudança(s) aplicada(s)') + (bad ? ' · ' + bad + ' ' + T('ignorada(s)') : '') + ' · ' + T('Desfazer volta tudo.');
  }

  /* ---------- entrada ---------- */
  function ensure() {   // prepara o Desenho sem abrir a aba (para Meus Programas e Pedir Programa)
    if (!built && !build()) return false;
    if (!store) { store = loadAll(); doc = store.docs[store.cur]; el.name.textContent = doc.name; updBtns(); el.host.querySelector('[data-tool=select]').classList.add('on'); updSaveBtn(); cloudInit(); }
    return true;
  }
  function withDoc(id, fn) { if (!ensure()) return null; var d = store.docs[id]; if (!d) return null; var keep = doc; doc = d; try { return fn(d); } finally { doc = keep; } }
  function savedList() {
    if (!ensure()) return [];
    return Object.keys(store.docs).filter(function (id) { return store.docs[id].saved; }).map(function (id) { var d = store.docs[id]; return { id: id, name: d.name, folder: d.folder || '', savedAt: d.savedAt || d.upd, n: d.ents.length, esp: d.esp || 20 }; })
      .sort(function (a, b) { return b.savedAt - a.savedAt; });
  }
  /* leitura da peça para montar as operações: tudo em relação à origem X0 Y0 do desenho */
  function analyze(id) {
    return withDoc(id, function (d) {
      var o = d.origin || { x: 0, y: 0 }, R = function (v) { return Math.round(v * 1000) / 1000; };
      var real = d.ents.filter(function (e) { return e.t !== 'dim' && !noPart(e); });
      if (!real.length) return null;
      var bb = bounds(real.filter(function (e) { return e.t !== 'holes'; }).length ? real.filter(function (e) { return e.t !== 'holes'; }) : real);
      var A = { id: id, origin: { x: o.x, y: o.y }, hconf: d.hconf || 0, name: d.name, esp: d.esp || 20, mat: d.mat || '', bbox: { x0: R(bb.x0 - o.x), y0: R(bb.y0 - o.y), x1: R(bb.x1 - o.x), y1: R(bb.y1 - o.y) }, outer: null, circles: [], rects: [], polys: [], holes: [], chams: [], other: 0 };
      var W = bb.x1 - bb.x0, H = bb.y1 - bb.y0;
      function isOuter(e) { var b = bounds([e]); return Math.abs(b.x1 - b.x0 - W) < 0.01 && Math.abs(b.y1 - b.y0 - H) < 0.01; }
      real.forEach(function (e) {
        if (e.t === 'holes') { var pts = holePts(e).map(function (q) { return [R(q[0] - o.x), R(q[1] - o.y)]; }); A.holes.push({ pts: pts, d: e.d, prof: e.prof > 0 && e.prof < (d.esp || 20) ? e.prof : 0, mode: e.mode, pcd: e.pcd, n: e.n, a0: e.a0, cx: e.mode === 'pcd' ? R(e.x - o.x) : null, cy: e.mode === 'pcd' ? R(e.y - o.y) : null }); return; }
        var prof = e.prof > 0 && e.prof < (d.esp || 20) ? e.prof : 0, ress = e.ress > 0 ? Math.min(e.ress, (d.esp || 20) - 0.1) : 0;
        if (e.t === 'circle') {
          var c = { cx: R(e.x - o.x), cy: R(e.y - o.y), d: e.d, prof: prof, ress: ress, rb: ress && e.rb > 0 ? e.rb : 0, eid: e.id };
          if (e.cham > 0) { c.cham = e.cham; A.chams.push(c); }
          else if (!A.outer && isOuter(e)) A.outer = { t: 'circle', cx: c.cx, cy: c.cy, d: e.d };
          else A.circles.push(c);
        } else if (e.t === 'rect') {
          var r = { cx: R(e.x + e.w / 2 - o.x), cy: R(e.y + e.h / 2 - o.y), w: e.w, h: e.h, r: e.r || 0, prof: prof, ress: ress, rb: ress && e.rb > 0 ? e.rb : 0, eid: e.id };
          if (!A.outer && isOuter(e)) { r.t = 'rect'; A.outer = r; } else A.rects.push(r);
        } else if (e.t === 'poly') {
          var pl = { cx: R(e.x - o.x), cy: R(e.y - o.y), n: e.n, dc: R(polyR(e) * 2), ang: e.ang || 0, med: e.med, v: e.v, prof: prof, ress: ress, rb: ress && e.rb > 0 ? e.rb : 0, eid: e.id };
          if (!A.outer && isOuter(e)) { pl.t = 'poly'; A.outer = pl; } else A.polys.push(pl);
        } else A.other++;
      });
      // ressaltos saem das listas de recortes; a face de baixo fica em Z = -(maior altura de ressalto)
      A.bosses = [];
      ['circles', 'rects', 'polys'].forEach(function (k) { A[k] = A[k].filter(function (f) { if (f.ress > 0) { f.t = k === 'circles' ? 'circle' : k === 'rects' ? 'rect' : 'poly'; A.bosses.push(f); return false; } return true; }); });
      A.base = -A.bosses.reduce(function (m, b) { return Math.max(m, b.ress); }, 0);
      A.faceAt = function (x, y) { for (var i = 0; i < A.bosses.length; i++) { var b = A.bosses[i]; if (b.t === 'circle' ? Math.hypot(x - b.cx, y - b.cy) <= b.d / 2 + 1e-6 : b.t === 'rect' ? Math.abs(x - b.cx) <= b.w / 2 && Math.abs(y - b.cy) <= b.h / 2 : Math.hypot(x - b.cx, y - b.cy) <= b.dc / 2) return R(A.base + b.ress); } return A.base; };
      // contornos feitos de arcos/linhas
      loopsOf(real).forEach(function (l) {
        var li = loopInfo(l), e = l.ent, prof = e.prof > 0 && e.prof < (d.esp || 20) ? e.prof : 0, ress = e.ress > 0 ? Math.min(e.ress, (d.esp || 20) - 0.1) : 0;
        var isOut = Math.abs(li.b.x1 - li.b.x0 - W) < 0.01 && Math.abs(li.b.y1 - li.b.y0 - H) < 0.01;
        if (li.round) {
          var c = { cx: R(li.cx - o.x), cy: R(li.cy - o.y), d: li.d, prof: prof, ress: ress, rb: ress && e.rb > 0 ? e.rb : 0, eid: e.id };
          if (isOut && (!A.outer || A.outer.t === 'outro')) A.outer = { t: 'circle', cx: c.cx, cy: c.cy, d: c.d };
          else if (e.cham > 0) { c.cham = e.cham; A.chams.push(c); }
          else if (ress) { c.t = 'circle'; A.bosses.push(c); A.base = Math.min(A.base, -ress); }
          else A.circles.push(c);
        } else if (!isOut) A.other++;
      });
      if (!A.outer) A.outer = { t: 'outro', cx: R((bb.x0 + bb.x1) / 2 - o.x), cy: R((bb.y0 + bb.y1) / 2 - o.y), w: R(W), h: R(H) };
      return A;
    });
  }
  function thumb(id, w, h) {
    return withDoc(id, function (d) {
      var real = d.ents.filter(function (e) { return e.t !== 'dim'; }); if (!real.length) return null;
      var b = bounds(real), tc = document.createElement('canvas'); tc.width = w; tc.height = h;
      var sv = { ctx: ctx, W: W, H: H, dpr: dpr, view: view, COL: COL, pxk: pxk, sel: sel, ghost: ghost, hover: hover, snapHit: snapHit };
      try {
        ctx = tc.getContext('2d'); W = w; H = h; dpr = 1; COL = COL_PRINT; printMode = true; pxk = w / 260; sel = null; ghost = null; hover = null; snapHit = null;
        var sc = Math.min((w - 12) / Math.max(1, b.x1 - b.x0), (h - 12) / Math.max(1, b.y1 - b.y0));
        view = { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, s: sc };
        var hideDims = d.hide, keepE = d.ents; d.ents = real;
        try { paint(); } finally { d.ents = keepE; d.hide = hideDims; }
      } finally { ctx = sv.ctx; W = sv.W; H = sv.H; dpr = sv.dpr; view = sv.view; COL = sv.COL; pxk = sv.pxk; sel = sv.sel; ghost = sv.ghost; hover = sv.hover; snapHit = sv.snapHit; printMode = false; }
      return tc.toDataURL('image/png');
    });
  }
  // elementos de dentro de um desenho salvo, para dizer o que é cada um (usado no Pedir Programa)
  function kindOf(e) { return e.ign ? 'ign' : e.ress > 0 ? 'ress' : e.cham > 0 ? 'cham' : e.prof > 0 ? 'prof' : 'pas'; }
  function valOf(e) { return e.ign ? '' : e.ress > 0 ? e.ress : e.cham > 0 ? e.cham : e.prof > 0 ? e.prof : ''; }
  function geoOf(e) {   // geometria simples para o corte de prévia das alturas
    if (e.t === 'circle') return { round: 1, cx: e.x, cy: e.y, d: e.d };
    if (e.t === 'holes') return { holes: holePts(e), d: e.d };
    var b = bounds([e]); return e.t === 'poly' ? { round: 1, cx: e.x, cy: e.y, d: polyR(e) * 2, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 } : { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 };
  }
  function features(id) {
    return withDoc(id, function (d) {
      var cand = [], big = null, bigA = -1, real = d.ents.filter(function (e) { return !isRef(e); }), loops = loopsOf(real);
      d.ents.forEach(function (e, i) { if (['circle', 'rect', 'poly'].indexOf(e.t) >= 0 && !noPart(e)) { var a = Math.abs(polyArea(shapePoly(e))); if (a > bigA) { bigA = a; big = i; } } });
      var bigLoop = null; loops.forEach(function (l) { var a = polyArea(l.pts); if (a > bigA) { bigA = a; bigLoop = l; big = null; } });
      d.ents.forEach(function (e, i) {
        if (isRef(e) || !((['circle', 'rect', 'poly'].indexOf(e.t) >= 0 && i !== big) || e.t === 'holes')) return;
        var n = e.t === 'holes' ? holePts(e).length : 1;
        cand.push({ eid: e.id, t: e.t, name: e.t === 'circle' ? T('Círculo') + ' Ø' + fmt(e.d) : e.t === 'holes' ? (n === 1 ? T('Furo') : n + ' ' + T('furos')) + ' Ø' + fmt(e.d) : e.t === 'rect' ? T('Retângulo') + ' ' + fmt(e.w) + ' x ' + fmt(e.h) : T('Polígono') + ' ' + e.n + ' ' + T('lados'),
          kind: kindOf(e), val: valOf(e), rb: e.rb || '', g: geoOf(e) });
      });
      loops.forEach(function (l) {   // contornos de arcos/linhas soltos (ex.: círculo feito com o arco R50)
        if (l === bigLoop) return;
        var e = l.ent, li = loopInfo(l);
        cand.push({ eid: e.id, t: 'loop', name: li.round ? T('Círculo') + ' Ø' + fmt(li.d) : T('Contorno fechado') + ' ' + fmt(li.b.x1 - li.b.x0) + ' x ' + fmt(li.b.y1 - li.b.y0),
          kind: kindOf(e), val: valOf(e), rb: e.rb || '', g: li.round ? { round: 1, cx: li.cx, cy: li.cy, d: li.d } : { x0: li.b.x0, y0: li.b.y0, x1: li.b.x1, y1: li.b.y1 } });
      });
      var out = big != null ? geoOf(d.ents[big]) : bigLoop ? (function (li) { return li.round ? { round: 1, cx: li.cx, cy: li.cy, d: li.d } : { x0: li.b.x0, y0: li.b.y0, x1: li.b.x1, y1: li.b.y1 }; })(loopInfo(bigLoop)) : null;
      return { esp: d.esp || 20, list: cand, outer: out };
    });
  }
  function setFeature(id, eid, kd, val, rb) {
    if (!ensure() || !store.docs[id]) return;
    var d = store.docs[id], en = d.ents.filter(function (e) { return e.id === eid; })[0]; if (!en) return;
    var keep = doc; doc = d; try { setKind(en, kd, num(val), num(rb)); } finally { doc = keep; }
    d.upd = Date.now(); if (d.saved) d.savedAt = d.upd;
    save(true); if (d === doc) { draw(); updSaveBtn(); } dbPut(id);
  }
  function setEsp(id, v) { if (!ensure() || !store.docs[id] || !(v > 0)) return; var d = store.docs[id]; d.esp = v; d.upd = Date.now(); if (d.saved) d.savedAt = d.upd; save(true); if (d === doc) draw(); dbPut(id); }
  function st3d(id) { return withDoc(id, function () { return build3D(); }); }
  function setMeta(id, m) { if (!ensure() || !store.docs[id]) return; var d = store.docs[id]; Object.keys(m).forEach(function (k) { d[k] = m[k]; }); d.upd = Date.now(); if (d.saved) d.savedAt = d.upd; save(true); dbPut(id); }
  function openDoc(id) {
    if (!ensure() || !store.docs[id]) return;
    if (id === store.cur) return;
    leaveDoc(function () { switchDoc(id); });
  }
  function show() {
    if (!built && !build()) return;
    if (!store) { store = loadAll(); doc = store.docs[store.cur]; el.name.textContent = doc.name; updBtns(); el.host.querySelector('[data-tool=select]').classList.add('on'); updSaveBtn(); cloudInit(); }
    requestAnimationFrame(resize);
  }
  // API para testes
  root.Cad = {
    show: show, openFiles: function () { openFiles(); }, ensure: ensure, savedList: savedList, analyze: analyze, thumb: thumb, openDoc: openDoc, features: features, setFeature: setFeature, setEsp: setEsp, st3d: st3d, setMeta: setMeta,
    get doc() { return doc; },
    add: function (e) { pushUndo(); e.id = uid(); doc.ents.push(e); save(); draw(); return e; },
    prims: prims, holePts: holePts, describe: describe, num: num, dimText: dimText, runActions: runActions, autoDim: autoDim,
    toS: function (x, y) { return toS(x, y); }, build3D: build3D, loopsOf: loopsOf, dxfText: dxfText, pdfBytes: pdfBytes, renderA4: renderA4, g65Call: g65Call, g81Prog: g81Prog,
    apiMessages: apiMessages, parseActions: parseActions, summarize: summarize, sheet: function () { return renderSheet(1200, 850); }
  };
})(this);
