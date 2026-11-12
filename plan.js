/* Plano de usinagem a partir de um desenho salvo (aba Desenho).
 * Lê a peça (Cad.analyze), separa as operações e monta um programa por operação,
 * usando as macros aprovadas da biblioteca (O1611, O1612, O1613, O1616, O1617) ou um ciclo G83.
 * Tudo em mm, coordenadas em relação ao X0 Y0 do desenho. */
(function (root) {
  'use strict';
  var TOOLS = [6, 8, 10, 12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

  function T(s) { return root.T ? root.T(s) : s; }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  // número no formato do comando: 220 -> "220."  -0 -> "0"
  function gv(v) { var r = r3(+v); if (Object.is(r, -0) || r === 0) return '0'; return Number.isInteger(r) ? r + '.' : String(r); }
  function gi(v) { return String(Math.round(+v)); }
  function fmt(v) { var r = Math.round(v * 100) / 100; return String(r).replace('.', ','); }
  function upper(s) { return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 .,-]/g, '').replace(/\s+/g, ' ').trim(); }
  function pad4(n) { return ('0000' + n).slice(-4); }

  /* ---------- ferramenta e dados de corte (valores de partida: o operador confere) ---------- */
  function helixTool(D) {   // fresa que fecha o furo numa hélice: 2T > D (sem núcleo) e sobra folga na parede
    for (var i = 0; i < TOOLS.length; i++) { var t = TOOLS[i]; if (2 * t > D && t <= D - 2) return t; }
    return null;
  }
  function drillData(d) {   // broca HSS em aço: Vc 25 m/min, avanço 0,02·d por volta
    var S = Math.min(3000, Math.round(25000 / (Math.PI * d) / 10) * 10), F = Math.max(20, Math.round(S * 0.02 * d / 5) * 5);
    return { S: S, F: F, Q: r3(Math.max(2, Math.round(d * 0.5 * 2) / 2)) };
  }

  /* ---------- furos em círculo? (para usar o O1612) ---------- */
  function fitCircle(pts) {
    if (pts.length < 2) return null;
    var cx = 0, cy = 0; pts.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    var rr = pts.map(function (p) { return Math.hypot(p[0] - cx, p[1] - cy); }), r = rr[0];
    if (r < 0.5 || rr.some(function (v) { return Math.abs(v - r) > 0.02; })) return null;
    var an = pts.map(function (p) { var a = Math.atan2(p[1] - cy, p[0] - cx) * 180 / Math.PI; return a < 0 ? a + 360 : a; }).sort(function (a, b) { return a - b; });
    var st = 360 / pts.length;
    for (var i = 0; i < an.length; i++) { var nx = i + 1 < an.length ? an[i + 1] : an[0] + 360; if (Math.abs(nx - an[i] - st) > 0.05) return null; }
    return { cx: r3(cx), cy: r3(cy), J: r3(2 * r), B: pts.length, A: r3(an[0]) };
  }

  /* ---------- operações a partir da peça ---------- */
  function plan(A) {
    var ops = [], notes = [], esp = A.esp, bb = A.bbox, W = r3(bb.x1 - bb.x0), H = r3(bb.y1 - bb.y0), cx = r3((bb.x0 + bb.x1) / 2), cy = r3((bb.y0 + bb.y1) / 2);
    var thru = -r3(esp + 1);   // passa 1 mm abaixo da peça

    // 1) faceamento da área toda
    var tf = W <= 40 ? 25 : W <= 80 ? 40 : 50;
    ops.push({ key: 'face', kind: 'face', title: T('Faceamento'), what: T('Face de cima') + ' ' + fmt(W) + ' × ' + fmt(H),
      p: { T: tf, S: 1200, F: 1150, W: 1, Z: 0, K: 1, Q: r3(tf * 0.7), A: 5, R: 25 }, cx: cx, cy: cy, w: W, h: H });

    // 2) contorno externo
    var o = A.outer;
    if (o.t === 'rect') ops.push({ key: 'cont', kind: 'ret', title: T('Contorno externo'), what: T('Retângulo') + ' ' + fmt(o.w) + ' × ' + fmt(o.h) + (o.r ? ' R' + fmt(o.r) : ''),
      p: { T: 25, S: 1200, F: 800, W: 0, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else if (o.t === 'poly') ops.push({ key: 'cont', kind: 'poli', title: T('Contorno externo'), what: T('Polígono') + ' ' + o.n + ' ' + T('lados') + ', Ø' + fmt(o.dc) + ' ' + T('entre cantos'),
      p: { T: 25, S: 1200, F: 800, W: 0, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else if (o.t === 'circle') ops.push({ key: 'cont', kind: 'circ', title: T('Contorno externo'), what: T('Diâmetro externo') + ' Ø' + fmt(o.d),
      p: { T: 25, S: 1200, F: 800, W: 0, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else notes.push(T('O contorno de fora não é um retângulo, círculo ou polígono: fica para o assistente ou para o CAM.'));

    // 3) furos/alojamentos redondos de dentro: interpolação helicoidal (O1613)
    A.circles.forEach(function (c, i) {
      var t = helixTool(c.d), deep = c.prof ? -r3(c.prof) : thru;
      var op = { key: 'hel' + i, kind: 'hel', title: c.prof ? T('Alojamento redondo') : T('Furo central'), what: 'Ø' + fmt(c.d) + ' ' + (c.prof ? T('prof.') + ' ' + fmt(c.prof) : T('passante')) + ' — ' + T('interpolação helicoidal'),
        p: { T: t || Math.max(6, Math.floor(c.d * 0.6)), S: 1200, F: 800, W: 0, Z: deep, K: 1.5, R: 5 }, g: c, warn: [] };
      if (!t) op.warn.push(T('Não achei fresa padrão que feche este furo numa volta só (precisa 2·T maior que D). Confira a fresa.'));
      ops.push(op);
    });
    A.rects.forEach(function () { notes.push(T('Recorte/bolsão retangular de dentro: ainda não há macro na biblioteca — peça ao assistente.')); });
    A.polys.forEach(function () { notes.push(T('Polígono de dentro: ainda não há macro na biblioteca — peça ao assistente.')); });
    A.chams.forEach(function (c) { notes.push(T('Chanfro') + ' ' + c.cham + '° ' + T('a partir de') + ' Ø' + fmt(c.d) + ': ' + T('fica para uma fresa de chanfro / CAM.')); });

    // 4) furação (passantes) e 5) rebaixos
    var groups = {};
    A.holes.forEach(function (h) { var k = h.pts.map(function (q) { return q[0] + ',' + q[1]; }).join(';'); (groups[k] = groups[k] || []).push(h); });
    var gi2 = 0;
    Object.keys(groups).forEach(function (k) {
      var list = groups[k], pts = list[0].pts, n = pts.length;
      var th = list.filter(function (h) { return !h.prof; }).sort(function (a, b) { return a.d - b.d; })[0];
      var cbs = list.filter(function (h) { return h.prof; }).sort(function (a, b) { return b.d - a.d; });
      var pc = list[0].mode === 'pcd' && list[0].pcd ? { cx: list[0].cx, cy: list[0].cy, J: list[0].pcd, B: list[0].n, A: r3(((list[0].a0 || 0) % 360 + 360) % 360) } : fitCircle(pts);
      if (th) {
        var dd = drillData(th.d);
        ops.push({ key: 'fur' + gi2, kind: pc && n > 1 ? 'pcd' : 'g83', title: T('Furação'), what: (n > 1 ? n + 'x ' : '') + 'Ø' + fmt(th.d) + ' ' + T('passante') + (pc && n > 1 ? ' — PCD ' + fmt(pc.J) : ''),
          p: { T: th.d, S: dd.S, F: dd.F, W: 0, Z: -r3(esp + 0.3 * th.d + 1), Q: dd.Q, R: 5 }, pts: pts, pc: pc, d: th.d });
      }
      cbs.forEach(function (c) {
        var t = helixTool(c.d);
        ops.push({ key: 'reb' + gi2 + '_' + c.d, kind: 'reb', title: T('Rebaixo'), what: (n > 1 ? n + 'x ' : '') + 'Ø' + fmt(c.d) + ' ' + T('prof.') + ' ' + fmt(c.prof) + ' — ' + T('interpolação helicoidal'),
          p: { T: t || Math.max(4, Math.floor(c.d * 0.6)), S: 1500, F: 600, W: 0, Z: -r3(c.prof), K: 1, R: 5 }, pts: pts, d: c.d, warn: t ? [] : [T('Confira a fresa do rebaixo (precisa 2·T maior que D).')] });
      });
      gi2++;
    });
    var tn = 1; ops.forEach(function (op) { op.p.N = tn++; op.on = true; });
    return { name: A.name, esp: esp, mat: A.mat, ops: ops, notes: notes, A: A };
  }

  /* ---------- texto da peça (para o assistente e para a tela) ---------- */
  function describe(A) {
    var o = A.outer, L = [];
    L.push(T('Peça') + ': ' + A.name + ' · ' + T('espessura') + ' ' + fmt(A.esp) + ' mm' + (A.mat ? ' · ' + A.mat : ''));
    if (o.t === 'rect') L.push(T('Contorno') + ': ' + T('retângulo') + ' ' + fmt(o.w) + ' × ' + fmt(o.h) + (o.r ? ' ' + T('cantos') + ' R' + fmt(o.r) : '') + ', ' + T('centro em') + ' X' + fmt(o.cx) + ' Y' + fmt(o.cy));
    else if (o.t === 'circle') L.push(T('Contorno') + ': Ø' + fmt(o.d) + ', ' + T('centro em') + ' X' + fmt(o.cx) + ' Y' + fmt(o.cy));
    else if (o.t === 'poly') L.push(T('Contorno') + ': ' + T('polígono') + ' ' + o.n + ' ' + T('lados') + ', Ø' + fmt(o.dc) + ' ' + T('entre cantos'));
    else L.push(T('Contorno') + ': ' + fmt(o.w) + ' × ' + fmt(o.h));
    A.circles.forEach(function (c) { L.push('Ø' + fmt(c.d) + ' ' + (c.prof ? T('prof.') + ' ' + fmt(c.prof) : T('passante')) + ' ' + T('em') + ' X' + fmt(c.cx) + ' Y' + fmt(c.cy)); });
    A.holes.forEach(function (h) { L.push(h.pts.length + 'x Ø' + fmt(h.d) + ' ' + (h.prof ? T('prof.') + ' ' + fmt(h.prof) : T('passante')) + ' ' + T('em') + ' ' + h.pts.slice(0, 12).map(function (q) { return '(' + fmt(q[0]) + '; ' + fmt(q[1]) + ')'; }).join(' ')); });
    A.rects.forEach(function (r) { L.push(T('Retângulo de dentro') + ' ' + fmt(r.w) + ' × ' + fmt(r.h) + (r.prof ? ' ' + T('prof.') + ' ' + fmt(r.prof) : ' ' + T('passante')) + ' ' + T('centro em') + ' X' + fmt(r.cx) + ' Y' + fmt(r.cy)); });
    A.chams.forEach(function (c) { L.push(T('Chanfro') + ' ' + c.cham + '° ' + T('a partir de') + ' Ø' + fmt(c.d)); });
    L.push(T('Origem X0 Y0 do desenho = zero-peça; Z0 = face de cima acabada.'));
    return L.join('\n');
  }

  /* ---------- montagem dos programas ---------- */
  function libProg(id) { return (root.PROGRAMS || []).filter(function (p) { return p.id === id; })[0]; }
  function header(O, title, t, S, firstXY) {
    return ['%', 'O' + pad4(O) + ' (' + title + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;', 'T' + t + ' ;', 'M6 ;', 'G0 ' + firstXY + ' ;', 'S' + gi(S) + ' M3 ;', 'G43 H' + t + ' Z120. ;', 'M8 ;'];
  }
  var FOOT = ['G0 Z100. ;', 'M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%'];
  function subsFor(id, mainText, key) {
    var p = libProg(id); if (!p || !p.subs) return [];
    var subs = p.subs.filter(function (s) { return !p.subChoice || s.key === key; });
    var need = [];
    try { need = root.MacroSim ? root.MacroSim.run(mainText + '\n' + subs.map(function (s) { return s.code; }).join('\n')).calls : []; } catch (e) {}
    var called = (mainText.match(/G65\s*P(\d+)/g) || []).map(function (m) { return +m.replace(/\D/g, ''); });
    var seen = {};
    return subs.filter(function (s) { if (seen[s.num]) return false; var ok = called.indexOf(s.num) >= 0 || need.indexOf(s.num) >= 0; if (ok) seen[s.num] = 1; return ok; });
  }
  function build(pl, op, O) {
    var p = op.p, t = gi(p.N), nm = upper(pl.name).slice(0, 18), L, call = [], id = null, key = null;
    var ttl = (nm ? nm + ' - ' : '') + 'OP' + op.idx + ' ' + upper(op.title);
    if (op.kind === 'face') {
      id = 'm-face';
      var centered = Math.abs(op.cx) < 0.01 && Math.abs(op.cy) < 0.01, corner = Math.abs(pl.A.bbox.x0) < 0.01 && Math.abs(pl.A.bbox.y0) < 0.01;
      key = corner && !centered ? '1611-canto' : '1611-centro';
      var g65 = 'G65 P1611 X' + gv(op.w) + ' Y' + gv(op.h) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' T' + gv(p.T) + ' Q' + gv(p.Q) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;';
      if (!centered && !corner) call.push('(ORIGEM DA AREA DESLOCADA COM G52) ;', 'G52 X' + gv(op.cx) + ' Y' + gv(op.cy) + ' ;', g65, 'G52 X0 Y0 ;');
      else call.push(g65);
      L = header(O, ttl, t, p.S, 'X0 Y0');
    } else if (op.kind === 'ret') {
      id = 'm-ret'; var g = op.g;
      call.push('G65 P1616 X' + gv(g.cx) + ' Y' + gv(g.cy) + ' I' + gv(g.w) + ' J' + gv(g.h) + ' C' + gv(g.r || 0) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = header(O, ttl, t, p.S, 'X' + gv(g.cx) + ' Y' + gv(g.cy));
    } else if (op.kind === 'poli') {
      id = 'm-poli'; var gp = op.g;
      call.push('G65 P1617 X' + gv(gp.cx) + ' Y' + gv(gp.cy) + ' B' + gp.n + ' D' + gv(gp.dc) + ' A' + gv(gp.ang || 0) + ' E' + gv(p.A) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = header(O, ttl, t, p.S, 'X' + gv(gp.cx) + ' Y' + gv(gp.cy));
    } else if (op.kind === 'circ') {
      // diâmetro externo: sem macro na biblioteca — programa parametrizado com G2 descendo K por volta
      var gc = op.g, rT = r3(gc.d / 2 + p.T / 2), xs = r3(gc.cx + rT);
      L = header(O, ttl, t, p.S, 'X' + gv(r3(xs + p.A)) + ' Y' + gv(gc.cy));
      L.push('#1 = ' + gv(gc.cx) + ' (X CENTRO) ;', '#2 = ' + gv(gc.cy) + ' (Y CENTRO) ;', '#3 = ' + gv(rT) + ' (RAIO DA TRAJETORIA = D/2 + T/2) ;', '#4 = ' + gv(p.W) + ' (Z INICIAL) ;', '#5 = ' + gv(p.Z) + ' (Z FINAL) ;', '#6 = ' + gv(p.K) + ' (DESCIDA POR VOLTA) ;',
        'G0 Z[#4 + ' + gv(p.R) + '] ;', 'G1 Z#4 F' + gv(p.F) + ' ;', 'G1 X[#1 + #3] Y#2 F' + gv(p.F) + ' ;', 'N10 #4 = #4 - #6 ;', 'IF [#4 LT #5] THEN #4 = #5 ;', 'G2 X[#1 + #3] Y#2 Z#4 I-#3 J0 ;', 'IF [#4 GT #5] GOTO 10 ;', 'G2 X[#1 + #3] Y#2 I-#3 J0 (VOLTA FINAL SEM DESCER) ;', 'G1 X[#1 + #3 + ' + gv(p.A) + '] ;');
    } else if (op.kind === 'hel') {
      id = 'm-helice'; var gh = op.g;
      call.push('G65 P1613 X' + gv(gh.cx) + ' Y' + gv(gh.cy) + ' D' + gv(gh.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = header(O, ttl, t, p.S, 'X' + gv(gh.cx) + ' Y' + gv(gh.cy));
    } else if (op.kind === 'reb') {
      id = 'm-helice';
      op.pts.forEach(function (q) { call.push('G65 P1613 X' + gv(q[0]) + ' Y' + gv(q[1]) + ' D' + gv(op.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;'); });
      L = header(O, ttl, t, p.S, 'X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]));
    } else if (op.kind === 'pcd') {
      id = 'm-pcd'; var c = op.pc;
      call.push('G65 P1612 X' + gv(c.cx) + ' Y' + gv(c.cy) + ' J' + gv(c.J) + ' B' + c.B + ' A' + gv(c.A) + ' H0 W' + gv(p.W) + ' Z' + gv(p.Z) + ' R' + gv(p.R) + ' Q' + gv(p.Q) + ' F' + gv(p.F) + ' ;');
      L = header(O, ttl, t, p.S, 'X' + gv(c.cx) + ' Y' + gv(c.cy));
    } else {   // g83: furos soltos, ciclo de furação com bicada
      L = header(O, ttl, t, p.S, 'X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]));
      L.push('G99 G83 X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]) + ' Z' + gv(p.Z) + ' R' + gv(p.W + p.R) + ' Q' + gv(p.Q) + ' F' + gv(p.F) + ' ;');
      op.pts.slice(1).forEach(function (q) { L.push('X' + gv(q[0]) + ' Y' + gv(q[1]) + ' ;'); });
      L.push('G80 ;', 'G98 ;');
    }
    var main = L.concat(call, FOOT).join('\n');
    var subs = id ? subsFor(id, main, key) : [];
    return { O: 'O' + pad4(O), main: main, subs: subs, text: [main].concat(subs.map(function (s) { return s.code; })).join('\n'), lib: id };
  }

  root.Plan = { plan: plan, describe: describe, build: build, helixTool: helixTool, fitCircle: fitCircle, gv: gv };
})(this);
