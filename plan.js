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
  /* bruto: mesma forma do contorno de fora (cilindro ou bloco) + sobremetal em volta; altura = peça + sobremetal da face */
  var SOB = 5, SOB_TOP = 1;
  function stockOf(A, sob, top) {
    var o = A.outer, bb = A.bbox;
    if (o.t === 'circle') return { shape: 'round', d: r3(o.d + 2 * sob), cx: o.cx, cy: o.cy, top: top, bottom: -r3(A.esp) };
    if (o.t === 'poly') return { shape: 'round', d: r3(o.dc + 2 * sob), cx: o.cx, cy: o.cy, top: top, bottom: -r3(A.esp) };
    return { shape: 'rect', lx: r3(bb.x1 - bb.x0 + 2 * sob), ly: r3(bb.y1 - bb.y0 + 2 * sob), cx: r3((bb.x0 + bb.x1) / 2), cy: r3((bb.y0 + bb.y1) / 2), top: top, bottom: -r3(A.esp) };
  }
  function stockTxt(st) {
    return '(BRUTO ' + (st.shape === 'round' ? 'CILINDRO D' + gv(st.d) : 'BLOCO ' + gv(st.lx) + ' X ' + gv(st.ly)) + ' ALTURA ' + gv(r3(st.top - st.bottom)) + ' TOPO Z' + gv(st.top) + ' CENTRO X' + gv(st.cx) + ' Y' + gv(st.cy) + ') ;';
  }
  function plan(A, sob) {
    sob = isFinite(sob) && sob >= 0 ? sob : SOB;
    var ops = [], notes = [], esp = A.esp, bb = A.bbox;
    var thru = -r3(esp + 1);   // passa 1 mm abaixo da peça
    var st0 = stockOf(A, sob, SOB_TOP), W = st0.shape === 'round' ? st0.d : st0.lx, H = st0.shape === 'round' ? st0.d : st0.ly, cx = st0.cx, cy = st0.cy;

    // 1) faceamento: a área toda do bruto
    var tf = W <= 40 ? 25 : W <= 80 ? 40 : 50;
    ops.push({ key: 'face', kind: 'face', title: T('Faceamento'), what: T('Face de cima') + ' ' + fmt(W) + ' × ' + fmt(H) + ' (' + T('bruto') + ')',
      p: { T: tf, S: 1200, F: 1150, W: SOB_TOP, Z: 0, K: 1, Q: r3(tf * 0.7), A: 5, R: 25 }, cx: cx, cy: cy, w: W, h: H });

    // 2) ressalto: desbaste em volta (do topo até a face de baixo, respeitando o raio da base) e o raio da base
    var base = A.base || 0, cW = base;   // o contorno de fora começa na face de baixo
    (A.bosses || []).forEach(function (b, i) {
      if (b.t !== 'circle') { notes.push(T('Ressalto que não é redondo: ainda não há programa pronto — peça ao assistente.')); return; }
      var stR = st0.shape === 'round' ? st0.d / 2 + Math.hypot(st0.cx - b.cx, st0.cy - b.cy) : Math.hypot(st0.lx / 2 + Math.abs(st0.cx - b.cx), st0.ly / 2 + Math.abs(st0.cy - b.cy));
      ops.push({ key: 'bos' + i, kind: 'boss', title: T('Desbaste do ressalto'), what: 'Ø' + fmt(b.d) + ' × ' + fmt(b.ress) + (b.rb ? ' ' + T('com raio') + ' R' + fmt(b.rb) + ' ' + T('na base') : '') + ' — ' + T('do topo até Z') + fmt(base),
        p: { T: 50, S: 1000, F: 1000, W: 0, Z: r3(base), K: 2, Q: 30, R: 5, M: 0 }, g: b, rOut: r3(stR) });
      if (b.rb > 0) ops.push({ key: 'rbs' + i, kind: 'fillet', title: T('Raio na base do ressalto'), what: 'R' + fmt(b.rb) + ' ' + T('entre') + ' Ø' + fmt(b.d) + ' ' + T('e a face de baixo') + ' — ' + T('quina da fresa segue o raio'),
        p: { T: 25, S: 1500, F: 1200, H: 2, R: 5, C: 0 }, g: b, base: r3(base) });
    });

    // 3) contorno externo
    var o = A.outer;
    if (o.t === 'rect') ops.push({ key: 'cont', kind: 'ret', title: T('Contorno externo'), what: T('Retângulo') + ' ' + fmt(o.w) + ' × ' + fmt(o.h) + (o.r ? ' R' + fmt(o.r) : ''),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5, L: 0, M: 1 }, g: o });
    else if (o.t === 'poly') ops.push({ key: 'cont', kind: 'poli', title: T('Contorno externo'), what: T('Polígono') + ' ' + o.n + ' ' + T('lados') + ', Ø' + fmt(o.dc) + ' ' + T('entre cantos'),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5, L: 0, M: 1 }, g: o });
    else if (o.t === 'circle') ops.push({ key: 'cont', kind: 'circ', title: T('Contorno externo'), what: T('Diâmetro externo') + ' Ø' + fmt(o.d),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5, L: 0, M: 1 }, g: o });
    else notes.push(T('O contorno de fora não é um retângulo, círculo ou polígono: fica para o assistente ou para o CAM.'));

    // 3) furos/alojamentos redondos de dentro: interpolação helicoidal (O1613)
    A.circles.forEach(function (c, i) {
      var fz = A.faceAt ? A.faceAt(c.cx, c.cy) : 0, t = helixTool(c.d), deep = c.prof ? r3(fz - c.prof) : thru;
      var op = { key: 'hel' + i, kind: 'hel', title: c.prof ? T('Alojamento redondo') : T('Furo central'), what: 'Ø' + fmt(c.d) + ' ' + (c.prof ? T('prof.') + ' ' + fmt(c.prof) : T('passante')) + ' — ' + T('interpolação helicoidal'),
        p: { T: t || Math.max(6, Math.floor(c.d * 0.6)), S: 1200, F: 800, W: fz, Z: deep, K: 1.5, R: 5, A: 10, L: 1 }, g: c, warn: [] };
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
      var hz = A.faceAt ? A.faceAt(pts[0][0], pts[0][1]) : 0;
      if (th) {
        var dd = drillData(th.d);
        ops.push({ key: 'fur' + gi2, kind: pc && n > 1 ? 'pcd' : 'g83', title: T('Furação'), what: (n > 1 ? n + 'x ' : '') + 'Ø' + fmt(th.d) + ' ' + T('passante') + (pc && n > 1 ? ' — PCD ' + fmt(pc.J) : ''),
          p: { T: th.d, S: dd.S, F: dd.F, W: hz, Z: -r3(esp + 0.3 * th.d + 1), Q: dd.Q, R: 5 }, pts: pts, pc: pc, d: th.d });
      }
      cbs.forEach(function (c) {
        var t = helixTool(c.d);
        ops.push({ key: 'reb' + gi2 + '_' + c.d, kind: 'reb', title: T('Rebaixo'), what: (n > 1 ? n + 'x ' : '') + 'Ø' + fmt(c.d) + ' ' + T('prof.') + ' ' + fmt(c.prof) + ' — ' + T('interpolação helicoidal'),
          p: { T: t || Math.max(4, Math.floor(c.d * 0.6)), S: 1500, F: 600, W: hz, Z: r3(hz - c.prof), K: 1, R: 5 }, pts: pts, d: c.d, warn: t ? [] : [T('Confira a fresa do rebaixo (precisa 2·T maior que D).')] });
      });
      gi2++;
    });
    var tn = 1; ops.forEach(function (op) { op.p.N = tn++; op.on = true; });
    return { name: A.name, esp: esp, mat: A.mat, ops: ops, notes: notes, A: A, sob: sob };
  }

  /* ---------- texto da peça (para o assistente e para a tela) ---------- */
  function describe(A) {
    var o = A.outer, L = [];
    L.push(T('Peça') + ': ' + A.name + ' · ' + T('espessura') + ' ' + fmt(A.esp) + ' mm' + (A.mat ? ' · ' + A.mat : ''));
    if (o.t === 'rect') L.push(T('Contorno') + ': ' + T('retângulo') + ' ' + fmt(o.w) + ' × ' + fmt(o.h) + (o.r ? ' ' + T('cantos') + ' R' + fmt(o.r) : '') + ', ' + T('centro em') + ' X' + fmt(o.cx) + ' Y' + fmt(o.cy));
    else if (o.t === 'circle') L.push(T('Contorno') + ': Ø' + fmt(o.d) + ', ' + T('centro em') + ' X' + fmt(o.cx) + ' Y' + fmt(o.cy));
    else if (o.t === 'poly') L.push(T('Contorno') + ': ' + T('polígono') + ' ' + o.n + ' ' + T('lados') + ', Ø' + fmt(o.dc) + ' ' + T('entre cantos'));
    else L.push(T('Contorno') + ': ' + fmt(o.w) + ' × ' + fmt(o.h));
    (A.bosses || []).forEach(function (b) { L.push(T('Ressalto') + ' ' + (b.t === 'circle' ? 'Ø' + fmt(b.d) : b.t === 'rect' ? fmt(b.w) + ' × ' + fmt(b.h) : b.n + ' ' + T('lados')) + ' ' + T('altura') + ' ' + fmt(b.ress) + (b.rb ? ' ' + T('com raio') + ' R' + fmt(b.rb) + ' ' + T('na base') : '') + ' — ' + T('face de baixo em Z') + fmt(A.base)); });
    A.circles.forEach(function (c) { L.push('Ø' + fmt(c.d) + ' ' + (c.prof ? T('prof.') + ' ' + fmt(c.prof) : T('passante')) + ' ' + T('em') + ' X' + fmt(c.cx) + ' Y' + fmt(c.cy)); });
    A.holes.forEach(function (h) { L.push(h.pts.length + 'x Ø' + fmt(h.d) + ' ' + (h.prof ? T('prof.') + ' ' + fmt(h.prof) : T('passante')) + ' ' + T('em') + ' ' + h.pts.slice(0, 12).map(function (q) { return '(' + fmt(q[0]) + '; ' + fmt(q[1]) + ')'; }).join(' ')); });
    A.rects.forEach(function (r) { L.push(T('Retângulo de dentro') + ' ' + fmt(r.w) + ' × ' + fmt(r.h) + (r.prof ? ' ' + T('prof.') + ' ' + fmt(r.prof) : ' ' + T('passante')) + ' ' + T('centro em') + ' X' + fmt(r.cx) + ' Y' + fmt(r.cy)); });
    A.chams.forEach(function (c) { L.push(T('Chanfro') + ' ' + c.cham + '° ' + T('a partir de') + ' Ø' + fmt(c.d)); });
    L.push(T('Origem X0 Y0 do desenho = zero-peça; Z0 = face de cima acabada.'));
    return L.join('\n');
  }

  /* ---------- montagem dos programas ---------- */
  function libProg(id) { return (root.PROGRAMS || []).filter(function (p) { return p.id === id; })[0]; }
  function header(O, title, t, S, firstXY, extra) {
    return ['%', 'O' + pad4(O) + ' (' + title + ') ;'].concat(extra || []).concat(['G21 G40 G90 G94 ;', 'G54 ;', 'T' + t + ' ;', 'M6 ;', 'G0 ' + firstXY + ' ;', 'S' + gi(S) + ' M3 ;', 'G43 H' + t + ' Z120. ;', 'M8 ;']);
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
    var p = op.p, kind = op.kind === 'circ' && p.L === 1 ? 'hel' : op.kind === 'hel' && p.L === 0 ? 'circ' : op.kind, t = gi(p.N), nm = upper(pl.name).slice(0, 18), L, call = [], id = null, key = null;
    var ttl = (nm ? nm + ' - ' : '') + 'OP' + op.idx + ' ' + upper(op.title);
    // bruto e ferramenta no cabeçalho: o operador vê, e a simulação monta o bruto certo (cilindro ou bloco)
    var face = pl.ops.filter(function (x) { return x.kind === 'face' && x.on; })[0];
    var info = [stockTxt(stockOf(pl.A, pl.sob, face ? face.p.W : 0)), '(' + (kind === 'pcd' || kind === 'g83' ? 'BROCA' : 'FRESA') + ' D' + gv(p.T) + ') ;'];
    function hd(O2, title, t2, S2, xy) { return header(O2, title, t2, S2, xy); }   // principal limpo: só o comentário do cabeçalho
    if (kind === 'face') {
      id = 'm-face';
      var centered = Math.abs(op.cx) < 0.01 && Math.abs(op.cy) < 0.01, corner = Math.abs(pl.A.bbox.x0) < 0.01 && Math.abs(pl.A.bbox.y0) < 0.01;
      key = corner && !centered ? '1611-canto' : '1611-centro';
      var g65 = 'G65 P1611 X' + gv(op.w) + ' Y' + gv(op.h) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' T' + gv(p.T) + ' Q' + gv(p.Q) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;';
      if (!centered && !corner) call.push('(ORIGEM DA AREA DESLOCADA COM G52) ;', 'G52 X' + gv(op.cx) + ' Y' + gv(op.cy) + ' ;', g65, 'G52 X0 Y0 ;');
      else call.push(g65);
      L = hd(O, ttl, t, p.S, 'X0 Y0');
    } else if (kind === 'ret') {
      id = 'm-ret'; var g = op.g;
      call.push('G65 P1616 X' + gv(g.cx) + ' Y' + gv(g.cy) + ' I' + gv(g.w) + ' J' + gv(g.h) + ' C' + gv(g.r || 0) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(g.cx) + ' Y' + gv(g.cy));
    } else if (kind === 'poli') {
      id = 'm-poli'; var gp = op.g;
      call.push('G65 P1617 X' + gv(gp.cx) + ' Y' + gv(gp.cy) + ' B' + gp.n + ' D' + gv(gp.dc) + ' A' + gv(gp.ang || 0) + ' E' + gv(p.A) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(gp.cx) + ' Y' + gv(gp.cy));
    } else if (kind === 'circ') {
      // diâmetro externo: sem macro na biblioteca — programa parametrizado com G2 descendo K por volta
      var gc = op.g, rT = r3(gc.d / 2 + p.T / 2), xs = r3(gc.cx + rT);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(xs + p.A)) + ' Y' + gv(gc.cy));
      L.push('#1 = ' + gv(gc.cx) + ' (X CENTRO) ;', '#2 = ' + gv(gc.cy) + ' (Y CENTRO) ;', '#3 = ' + gv(rT) + ' (RAIO DA TRAJETORIA = D/2 + T/2) ;', '#4 = ' + gv(p.W) + ' (Z INICIAL) ;', '#5 = ' + gv(p.Z) + ' (Z FINAL) ;', '#6 = ' + gv(p.K) + ' (DESCIDA POR ' + (p.M === 0 ? 'NIVEL' : 'VOLTA') + ') ;',
        'G0 Z[#4 + ' + gv(p.R) + '] ;', 'G1 Z#4 F' + gv(p.F) + ' ;');
      if (p.M === 0) L.push('(INTERPOLACAO CIRCULAR - DESCE FORA DA PECA E DA A VOLTA EM Z FIXO) ;', 'N10 #4 = #4 - #6 ;', 'IF [#4 LT #5] THEN #4 = #5 ;', 'G1 X[#1 + #3 + ' + gv(p.A) + '] Y#2 ;', 'G1 Z#4 ;', 'G1 X[#1 + #3] ;', 'G2 X[#1 + #3] Y#2 I-#3 J0 ;', 'G1 X[#1 + #3 + ' + gv(p.A) + '] ;', 'IF [#4 GT #5] GOTO 10 ;');
      else L.push('(INTERPOLACAO HELICOIDAL - DESCE #6 A CADA VOLTA) ;', 'G1 X[#1 + #3] Y#2 F' + gv(p.F) + ' ;', 'N10 #4 = #4 - #6 ;', 'IF [#4 LT #5] THEN #4 = #5 ;', 'G2 X[#1 + #3] Y#2 Z#4 I-#3 J0 ;', 'IF [#4 GT #5] GOTO 10 ;', 'G2 X[#1 + #3] Y#2 I-#3 J0 (VOLTA FINAL SEM DESCER) ;', 'G1 X[#1 + #3 + ' + gv(p.A) + '] ;');
    } else if (kind === 'boss') {
      // desbaste em volta de ressalto redondo: voltas G2 de fora para dentro a cada Z; perto da base segue o raio R
      var b = op.g, tr = r3(p.T / 2);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(b.cx + op.rOut + tr + 5)) + ' Y' + gv(b.cy));
      L.push('#1 = ' + gv(b.cx) + ' (X CENTRO DO RESSALTO) ;', '#2 = ' + gv(b.cy) + ' (Y CENTRO DO RESSALTO) ;', '#3 = ' + gv(b.d / 2) + ' (RAIO DO RESSALTO) ;', '#4 = ' + gv(b.rb || 0) + ' (RAIO NA BASE - 0 = CANTO VIVO) ;',
        '#5 = ' + gv(op.rOut) + ' (RAIO DO BRUTO A LIMPAR) ;', '#6 = ' + gv(tr) + ' (RAIO DA FRESA) ;', '#7 = ' + gv(p.Z) + ' (Z DA FACE DE BAIXO) ;', '#8 = ' + gv(p.K) + ' (DESCIDA EM Z) ;', '#9 = ' + gv(p.Q) + ' (PASSO LATERAL) ;', '#10 = ' + gv(p.W) + ' (Z INICIAL - TOPO) ;',
        '#20 = #10 ;', 'G0 Z[#10 + ' + gv(p.R) + '] ;');
      if (p.M === 1) L.push('(INTERPOLACAO HELICOIDAL - CADA ANEL DESCE #8 POR VOLTA ATE O LIMITE DO RAIO) ;',
        '#22 = #5 + #6 - #9 ;', 'IF [#22 LT [#3 + #4 + #6]] THEN #22 = #3 + #4 + #6 (1A VOLTA LIMPA ATE A FACE DE BAIXO) ;',
        'N10 IF [#22 LT [#3 + #6]] THEN #22 = #3 + #6 ;',
        '(Z LIMITE NESTE ANEL - A BORDA DA FRESA NAO PODE ENTRAR NO RAIO) ;', '#24 = #22 - #6 ;', '#21 = #7 ;', '#23 = #3 + #4 - #24 ;',
        'IF [#23 GT 0] THEN #21 = #7 + #4 - SQRT[#4 * #4 - #23 * #23] ;', 'IF [#24 LT #3] THEN #21 = #10 ;',
        'G0 X[#1 + #22] Y#2 ;', 'G1 Z#10 F' + gv(p.F) + ' ;', '#20 = #10 ;',
        'N20 #20 = #20 - #8 ;', 'IF [#20 LT #21] THEN #20 = #21 ;', 'G2 X[#1 + #22] Y#2 Z#20 I-#22 J0 ;', 'IF [#20 GT #21] GOTO 20 ;', 'G2 X[#1 + #22] Y#2 I-#22 J0 ;',
        'G0 Z[#10 + ' + gv(p.R) + '] ;', 'IF [#22 LE [#3 + #6]] GOTO 30 ;', '#22 = #22 - #9 ;', 'GOTO 10 ;', 'N30 G0 Z[#10 + ' + gv(p.R) + '] ;');
      else L.push('(INTERPOLACAO CIRCULAR - DESCE #8 E DA AS VOLTAS EM Z FIXO) ;',
        'N10 #20 = #20 - #8 ;', 'IF [#20 LT #7] THEN #20 = #7 ;',
        '(RAIO LIMITE NESTE Z - PERTO DA BASE SEGUE O RAIO R) ;', '#21 = #3 ;', '#23 = #7 + #4 - #20 ;', 'IF [#23 GT 0] THEN #21 = #3 + #4 - SQRT[#4 * #4 - #23 * #23] ;',
        '#22 = #5 + #6 - #9 ;', 'G0 X[#1 + #5 + #6 + 5] Y#2 ;', 'G1 Z#20 F' + gv(p.F) + ' ;',
        'N20 IF [#22 LT [#21 + #6]] THEN #22 = #21 + #6 ;', 'G1 X[#1 + #22] Y#2 ;', 'G2 X[#1 + #22] Y#2 I-#22 J0 ;', 'IF [#22 LE [#21 + #6]] GOTO 30 ;', '#22 = #22 - #9 ;', 'GOTO 20 ;',
        'N30 G1 X[#1 + #5 + #6 + 5] ;', 'IF [#20 GT #7] GOTO 10 ;', 'G0 Z[#10 + ' + gv(p.R) + '] ;');
    } else if (kind === 'fillet') {
      // raio côncavo na base do ressalto: a quina de baixo da fresa segue o arco, uma volta G2 a cada H graus
      var bf = op.g, tf2 = r3(p.T / 2);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(bf.cx + bf.d / 2 + bf.rb + tf2 + 5)) + ' Y' + gv(bf.cy));
      var rc = Math.max(0, Math.min(p.C || 0, tf2, bf.rb));
      L.push('(' + (rc <= 0 ? 'FRESA DE TOPO RETA COM CANTO VIVO' : rc >= tf2 ? 'FRESA ESFERICA' : 'FRESA COM RAIO DE CANTO R' + gv(rc)) + ' - DESBASTE JA FEITO) ;', '#1 = ' + gv(bf.cx) + ' (X CENTRO) ;', '#2 = ' + gv(bf.cy) + ' (Y CENTRO) ;', '#3 = ' + gv(bf.d / 2) + ' (RAIO DO RESSALTO) ;', '#4 = ' + gv(bf.rb) + ' (RAIO NA BASE - ALTURA DO RAIO) ;',
        '#6 = ' + gv(tf2) + ' (RAIO DA FRESA) ;', '#15 = ' + gv(rc) + ' (RAIO DE CANTO DA FRESA) ;', '#7 = ' + gv(op.base) + ' (Z DA FACE DE BAIXO) ;', '#11 = ' + gv(p.H) + ' (PASSO EM GRAUS) ;', '#12 = 0 ;',
        'G0 Z[#7 + #4 + ' + gv(p.R) + '] ;',
        '(O CENTRO DO CANTO DA FRESA ANDA NUM ARCO DE RAIO R - RAIO DE CANTO) ;',
        'N10 IF [#12 GT 90] THEN #12 = 90 ;', '#13 = #3 + #4 - [#4 - #15] * COS[#12] (RAIO DO CENTRO DO CANTO) ;', '#14 = #7 + #4 - [#4 - #15] * SIN[#12] - #15 (Z DA PONTA DA FRESA) ;',
        'G1 X[#1 + #13 + #6 - #15] Y#2 Z#14 F' + gv(p.F) + ' ;', 'G2 X[#1 + #13 + #6 - #15] Y#2 I-[#13 + #6 - #15] J0 ;', 'IF [#12 GE 90] GOTO 20 ;', '#12 = #12 + #11 ;', 'GOTO 10 ;',
        'N20 G1 X[#1 + #3 + #4 + #6 + 5] ;', 'G0 Z[#7 + #4 + ' + gv(p.R) + '] ;');
    } else if (kind === 'hel') {
      id = 'm-helice'; var gh = op.g;
      call.push('G65 P1613 X' + gv(gh.cx) + ' Y' + gv(gh.cy) + ' D' + gv(gh.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(gh.cx) + ' Y' + gv(gh.cy));
    } else if (kind === 'reb') {
      id = 'm-helice';
      op.pts.forEach(function (q) { call.push('G65 P1613 X' + gv(q[0]) + ' Y' + gv(q[1]) + ' D' + gv(op.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;'); });
      L = hd(O, ttl, t, p.S, 'X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]));
    } else if (kind === 'pcd') {
      id = 'm-pcd'; var c = op.pc;
      call.push('G65 P1612 X' + gv(c.cx) + ' Y' + gv(c.cy) + ' J' + gv(c.J) + ' B' + c.B + ' A' + gv(c.A) + ' H0 W' + gv(p.W) + ' Z' + gv(p.Z) + ' R' + gv(p.R) + ' Q' + gv(p.Q) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(c.cx) + ' Y' + gv(c.cy));
    } else {   // g83: furos soltos, ciclo de furação com bicada
      L = hd(O, ttl, t, p.S, 'X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]));
      L.push('G99 G83 X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]) + ' Z' + gv(p.Z) + ' R' + gv(p.W + p.R) + ' Q' + gv(p.Q) + ' F' + gv(p.F) + ' ;');
      op.pts.slice(1).forEach(function (q) { L.push('X' + gv(q[0]) + ' Y' + gv(q[1]) + ' ;'); });
      L.push('G80 ;', 'G98 ;');
    }
    var main = L.concat(call, FOOT).join('\n');
    var subs = id ? subsFor(id, main, key) : [];
    return { O: 'O' + pad4(O), main: main, subs: subs, text: [main].concat(subs.map(function (s) { return s.code; })).join('\n'), lib: id };
  }

  /* ---------- parametrizados simples no padrão do operador (Regras > Parametrizados simples) ----------
   * variáveis no começo em sequência (#1, #2...), sem .0; ferramenta numa variável, a última, em T#n e G43 H#n;
   * um N e um IF ... GOTO por laço, sem THEN/WHILE/FUP/G65; incremento que fecha exato; G0 20 mm além do início;
   * contorno externo G2; ao terminar sobe Z50.; comentários curtos sem acento. */
  function fv(v) { var r = r3(+v); if (Object.is(r, -0)) r = 0; return String(r); }
  var NICE = [10, 8, 6, 5, 4, 3, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.125, 0.0625];
  function exactInc(dist, want) {   // maior incremento "redondo" <= o pedido que fecha exato a distância
    dist = Math.abs(dist); if (dist < 1e-9) return want || 1;
    var c = [want].concat(NICE).filter(function (k) { return k > 0 && k <= want + 1e-9; });
    for (var i = 0; i < c.length; i++) { var n = dist / c[i]; if (Math.abs(n - Math.round(n)) < 1e-9) return r3(c[i]); }
    return r3(dist / Math.ceil(dist / want));
  }
  function niceStep(want) { for (var i = 0; i < NICE.length; i++) if (NICE[i] <= want + 1e-9) return NICE[i]; return 0.0625; }
  function exactDeg(want) { var c = [want, 10, 9, 6, 5, 4.5, 3, 2.5, 2, 1.5, 1, 0.5]; for (var i = 0; i < c.length; i++) if (c[i] > 0 && c[i] <= want + 1e-9 && Math.abs(90 / c[i] - Math.round(90 / c[i])) < 1e-9) return c[i]; return 1; }
  function paramProg(pl, ops, O) {
    var V = [], n = 0, body = [], op0 = ops[0], g0 = op0.g, cx = g0 ? g0.cx : 0, cy = g0 ? g0.cy : 0, sh = Math.abs(cx) > 1e-6 || Math.abs(cy) > 1e-6;
    var VC = {};
    function sv(val, c) { var k = c + '|' + val; return VC[k] || (VC[k] = v(val, c)); }   // mesma medida fixa = mesma variável
    function v(val, c) { n++; V.push('#' + n + ' = ' + (typeof val === 'number' ? fv(val) : val) + (c ? ' (' + c + ')' : '') + ' ;'); return '#' + n; }
    var nm = upper(pl.name).slice(0, 18), ttl = (nm ? nm + ' - ' : '') + ops.map(function (o) { return 'OP' + o.idx; }).join(' ') + ' ' + ops.map(function (o) { return upper(o.title); }).join(' + ');
    var startX = null, tvar = null;
    ops.forEach(function (op, oi) {
      var p = op.p, g = op.g, F = gi(p.F);
      if (op.kind === 'circ') {   // diâmetro por fora (concordante G2)
        var a = v(g.d, 'DIAMETRO EXTERNO'), b = tvar || (tvar = v(p.T, 'DIAMETRO DA FERRAMENTA')), c = v('[' + a + ' + ' + b + '] / 2', 'RAIO DA TRAJETORIA');
        var inc = exactInc(p.W - p.Z, p.K), z = v(p.W, 'Z INICIAL'), k = v(inc, 'INCREMENTO EM Z' + (p.M === 0 ? ' POR NIVEL' : ' POR VOLTA')), zf = v(p.Z, 'PROFUNDIDADE FINAL');
        var r0 = g.d / 2 + p.T / 2; if (startX == null) startX = r0 + 20;
        body.push('(OP' + op.idx + ' ' + upper(op.title) + ') ;', 'G0 X[' + c + ' + 20] Y0 ;', 'G0 Z[' + z + ' + 2] ;', 'G1 Z' + z + ' F500 ;');
        if (p.M === 0) body.push('N' + (10 + oi * 100) + ' ;', z + ' = ' + z + ' - ' + k + ' ;', 'G1 X[' + c + ' + 20] Y0 F' + F + ' ;', 'G1 Z' + z + ' ;', 'G1 X' + c + ' ;', 'G2 X' + c + ' Y0 I-' + c + ' J0 ;', 'IF [' + z + ' GT ' + zf + '] GOTO ' + (10 + oi * 100) + ' ;');
        else body.push('G1 X' + c + ' Y0 F' + F + ' ;', 'N' + (10 + oi * 100) + ' ;', z + ' = ' + z + ' - ' + k + ' ;', 'G2 X' + c + ' Y0 Z' + z + ' I-' + c + ' J0 ;', 'IF [' + z + ' GT ' + zf + '] GOTO ' + (10 + oi * 100) + ' ;', 'G2 X' + c + ' Y0 I-' + c + ' J0 (VOLTA DE ACABAMENTO) ;');
        body.push('G1 X[' + c + ' + 20] ;', 'G0 Z50. ;');
      } else if (op.kind === 'boss') {   // desbaste em volta do ressalto redondo, respeitando o raio da base
        var R = g.rb || 0, base = op.p.Z, top = p.W, zr = r3(base + R), Q = niceStep(p.Q), rEnd = g.d / 2 + p.T / 2;
        var stockR = op.rOut + p.T / 2 - Q, nr = Math.max(1, Math.ceil((stockR - rEnd) / Q - 1e-9));
        var rStart = r3(rEnd + nr * Q);
        var a2 = sv(g.d, 'DIAMETRO DO RESSALTO'), b2 = tvar || (tvar = v(p.T, 'DIAMETRO DA FERRAMENTA')), c2 = v('[' + a2 + ' + ' + b2 + '] / 2', 'RAIO DA TRAJETORIA NA PAREDE');
        var d2 = R > 0 ? sv(R, 'RAIO NA BASE') : null, z2 = v(top, 'Z INICIAL NA FACE');
        var k1 = v(exactInc(top - zr, p.K), 'INCREMENTO EM Z ATE O RAIO'), g2 = v(zr, R > 0 ? 'Z DO INICIO DO RAIO' : 'Z DA FACE DE BAIXO');
        var h2 = R > 0 ? sv(base, 'Z DA FACE DE BAIXO') : null, k2 = R > 0 ? v(exactInc(R, p.K), 'INCREMENTO EM Z NO RAIO') : null;
        var q2 = v(Q, 'PASSO LATERAL'), j2 = v(rStart, 'RAIO DA PRIMEIRA VOLTA'), kk = v(0, 'RAIO ATUAL'), l2 = R > 0 ? v(0, 'RAIO LIMITE NO RAIO') : null;
        if (startX == null) startX = rStart + 20;
        var N1 = 10 + oi * 100, N2 = N1 + 10, N3 = N1 + 20, N4 = N1 + 30, N5 = N1 + 40, N6 = N1 + 50;
        body.push('(OP' + op.idx + ' ' + upper(op.title) + ') ;', 'G0 X[' + j2 + ' + 20] Y0 ;', 'G0 Z[' + z2 + ' + 2] ;', 'G1 Z' + z2 + ' F500 ;');
        var jStart = j2;
        if (p.M === 1 && R > 0 && rStart > rEnd + R + 1e-9) {   // helicoidal: anéis de fora até o começo do raio descem em rampa até a face de baixo
          var o2 = v('[' + c2 + ' + ' + d2 + ']', 'RAIO DO ULTIMO ANEL EM RAMPA'), zz = v(top, 'Z DA RAMPA'), ka = v(exactInc(top - base, p.K), 'INCREMENTO EM Z POR VOLTA');
          body.push(kk + ' = ' + j2 + ' ;', 'N' + N5 + ' ;', 'G0 Z[' + z2 + ' + 2] ;', 'G0 X' + kk + ' Y0 ;', 'G1 Z' + z2 + ' F500 ;', zz + ' = ' + fv(top) + ' ;',
            'N' + N6 + ' ;', zz + ' = ' + zz + ' - ' + ka + ' ;', 'G2 X' + kk + ' Y0 Z' + zz + ' I-' + kk + ' J0 F' + F + ' ;', 'IF [' + zz + ' GT ' + h2 + '] GOTO ' + N6 + ' ;',
            'G2 X' + kk + ' Y0 I-' + kk + ' J0 ;', kk + ' = ' + kk + ' - ' + q2 + ' ;', 'IF [' + kk + ' GT ' + o2 + '] GOTO ' + N5 + ' ;',
            'G0 Z[' + z2 + ' + 2] ;', 'G0 X[' + o2 + ' + 20] Y0 ;', 'G1 Z' + z2 + ' F500 ;');
          jStart = o2;
        }
        // circular: desce o incremento e dá as voltas de fora para dentro até a parede
        body.push('N' + N1 + ' ;', z2 + ' = ' + z2 + ' - ' + k1 + ' ;', kk + ' = ' + jStart + ' ;', 'G1 X[' + jStart + ' + 20] Y0 F' + F + ' ;', 'G1 Z' + z2 + ' ;',
          'N' + N2 + ' ;', 'G1 X' + kk + ' Y0 ;', 'G2 X' + kk + ' Y0 I-' + kk + ' J0 ;', kk + ' = ' + kk + ' - ' + q2 + ' ;', 'IF [' + kk + ' GT ' + c2 + '] GOTO ' + N2 + ' ;',
          'G1 X' + c2 + ' Y0 ;', 'G2 X' + c2 + ' Y0 I-' + c2 + ' J0 ;', 'IF [' + z2 + ' GT ' + g2 + '] GOTO ' + N1 + ' ;');
        if (R > 0) body.push('(NO RAIO A ULTIMA VOLTA SEGUE O RAIO DA BASE) ;', 'N' + N3 + ' ;', z2 + ' = ' + z2 + ' - ' + k2 + ' ;',
          l2 + ' = ' + c2 + ' + ' + d2 + ' - SQRT[' + d2 + ' * ' + d2 + ' - [' + g2 + ' - ' + z2 + '] * [' + g2 + ' - ' + z2 + ']] ;', kk + ' = ' + jStart + ' ;', 'G1 X[' + jStart + ' + 20] Y0 ;', 'G1 Z' + z2 + ' ;',
          'N' + N4 + ' ;', 'G1 X' + kk + ' Y0 ;', 'G2 X' + kk + ' Y0 I-' + kk + ' J0 ;', kk + ' = ' + kk + ' - ' + q2 + ' ;', 'IF [' + kk + ' GT ' + l2 + '] GOTO ' + N4 + ' ;',
          'G1 X' + l2 + ' Y0 ;', 'G2 X' + l2 + ' Y0 I-' + l2 + ' J0 ;', 'IF [' + z2 + ' GT ' + h2 + '] GOTO ' + N3 + ' ;');
        body.push('G1 X[' + j2 + ' + 20] Y0 ;', 'G0 Z50. ;');
      } else if (op.kind === 'fillet') {   // raio côncavo: a quina da fresa segue o arco, volta plana a cada ângulo
        var Rf = g.rb, rc = Math.max(0, Math.min(p.C || 0, p.T / 2, Rf)), H = exactDeg(p.H);
        var a3 = sv(g.d, 'DIAMETRO DO RESSALTO'), b3 = tvar || (tvar = v(p.T, 'DIAMETRO DA FERRAMENTA')), r3v = sv(Rf, 'RAIO NA BASE'), e3 = v(rc, rc <= 0 ? 'RAIO DE CANTO DA FRESA - TOPO RETO' : rc >= p.T / 2 ? 'RAIO DE CANTO - FRESA ESFERICA' : 'RAIO DE CANTO DA FRESA');
        var f3 = sv(op.base, 'Z DA FACE DE BAIXO'), an = v(0, 'ANGULO ATUAL'), ia = v(H, 'INCREMENTO DO ANGULO'), xr = v(0, 'RAIO ATUAL DA TRAJETORIA'), zz3 = v(0, 'Z ATUAL');
        if (startX == null) startX = g.d / 2 + Rf + p.T / 2 + 20;
        var M1 = 10 + oi * 100;
        body.push('(OP' + op.idx + ' ' + upper(op.title) + ') ;', 'G0 X[' + a3 + ' / 2 + ' + r3v + ' + ' + b3 + ' / 2 + 20] Y0 ;', 'G0 Z[' + f3 + ' + ' + r3v + ' + 2] ;',
          'N' + M1 + ' ;', xr + ' = ' + a3 + ' / 2 + ' + r3v + ' - [' + r3v + ' - ' + e3 + '] * COS[' + an + '] + ' + b3 + ' / 2 - ' + e3 + ' ;',
          zz3 + ' = ' + f3 + ' + ' + r3v + ' - [' + r3v + ' - ' + e3 + '] * SIN[' + an + '] - ' + e3 + ' ;',
          'G1 X' + xr + ' Y0 Z' + zz3 + ' F' + F + ' ;', 'G2 X' + xr + ' Y0 I-' + xr + ' J0 ;', an + ' = ' + an + ' + ' + ia + ' ;', 'IF [' + an + ' LE 90] GOTO ' + M1 + ' ;',
          'G1 X[' + xr + ' + 20] ;', 'G0 Z50. ;');
      }
    });
    var tn = v(op0.p.N, 'NUMERO DA FERRAMENTA');   // a última da lista
    var L = ['%', 'O' + pad4(O) + ' (' + shortT(ttl) + ') ;', 'G21 G40 G90 G94 ;', 'G54 ;'].concat(V, ['T' + tn + ' ;', 'M6 ;', 'S' + gi(op0.p.S) + ' M3 ;', 'G0 G43 H' + tn + ' Z100. ;']);
    if (sh) L.push('G52 X' + gv(cx) + ' Y' + gv(cy) + ' ;');
    L.push('G0 X' + gv(r3(startX || 0)) + ' Y0 ;', 'M8 ;');
    L = L.concat(body, ['G0 Z100. ;']);
    if (sh) L.push('G52 X0 Y0 ;');
    L = L.concat(['M9 ;', 'G53 H0 Z0 ;', 'M30 ;', '%']);
    var main = L.join('\n');
    return { O: 'O' + pad4(O), main: main, subs: [], text: main, lib: null };
  }
  function shortT(t) { if (t.length <= 56) return t; t = t.slice(0, 56); return t.slice(0, t.lastIndexOf(' ')).replace(/[ +-]+$/, ''); }
  function isParam(op) { return op.kind === 'boss' || op.kind === 'fillet' || (op.kind === 'circ' && op.p.L !== 1); }
  // operações seguidas com a mesma ferramenta (Ø e T) e o mesmo centro viram um programa só
  function groups(ops) {
    var G = [];
    ops.forEach(function (op) {
      var last = G[G.length - 1], l = last && last[last.length - 1];
      if (l && isParam(op) && isParam(l) && op.p.T === l.p.T && op.p.N === l.p.N && op.g && l.g && Math.abs(op.g.cx - l.g.cx) < 1e-6 && Math.abs(op.g.cy - l.g.cy) < 1e-6) last.push(op); else G.push([op]);
    });
    return G;
  }
  function meta(pl, ops) {
    var face = pl.ops.filter(function (x) { return x.kind === 'face' && x.on; })[0];
    return { stock: stockOf(pl.A, pl.sob, face ? face.p.W : 0), tool: ops[0].p.T };
  }
  function buildGroup(pl, ops, O) {
    var r = ops.length > 1 || isParam(ops[0]) ? paramProg(pl, ops, O) : build(pl, ops[0], O);
    var m = meta(pl, ops); r.stock = m.stock; r.tool = m.tool; return r;
  }

  /* ---------- linhas tocáveis da vista 3D: cada uma liga a uma operação ---------- */
  function circ(cx, cy, r, z) { var o = []; for (var i = 0; i <= 72; i++) { var a = i / 72 * Math.PI * 2; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); } return o; }
  function rrect(cx, cy, w, h, r, z) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); var o = [], C = [[cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180], [cx + w / 2 - r, cy - h / 2 + r, 270]];
    C.forEach(function (c) { for (var i = 0; i <= 8; i++) { var a = (c[2] + i * 90 / 8) * Math.PI / 180; o.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z]); } }); o.push(o[0]); return o;
  }
  function ngon(cx, cy, n, dc, ang, z) { var o = []; for (var i = 0; i <= n; i++) { var a = ((ang || 0) + i * 360 / n) * Math.PI / 180; o.push([cx + dc / 2 * Math.cos(a), cy + dc / 2 * Math.sin(a), z]); } return o; }
  function outline(g, z) { return g.t === 'rect' ? rrect(g.cx, g.cy, g.w, g.h, g.r, z) : g.t === 'poly' ? ngon(g.cx, g.cy, g.n, g.dc, g.ang, z) : g.t === 'circle' ? circ(g.cx, g.cy, g.d / 2, z) : rrect(g.cx, g.cy, g.w, g.h, 0, z); }
  function edges(pl) {
    var A = pl.A, o = A.origin || { x: 0, y: 0 }, E = [];
    function add(key, label, lines, face) { E.push({ key: key, label: label, lines: lines.map(function (L) { return L.map(function (p) { return [p[0] + o.x, p[1] + o.y, p[2]]; }); }), face: !!face }); }
    pl.ops.forEach(function (op) {
      var p = op.p;
      if (op.kind === 'face') add(op.key, op.title, [A.bosses && A.bosses.length ? outline(A.bosses[0], 0) : outline(A.outer, 0)], true);
      else if (op.kind === 'ret' || op.kind === 'poli' || op.kind === 'circ') {   // parede de fora: linha no meio da altura dela e a aresta de baixo
        var zt = A.base || 0, zm = (zt - A.esp) / 2, hasF = (A.bosses || []).some(function (b) { return b.rb > 0; });
        add(op.key, op.title + ' ' + op.what, [outline(op.g, zm)]);
      }
      else if (op.kind === 'boss') add(op.key, op.title + ' Ø' + fmt(op.g.d), [circ(op.g.cx, op.g.cy, op.g.d / 2, 0)]);
      else if (op.kind === 'fillet') add(op.key, op.title + ' R' + fmt(op.g.rb), [circ(op.g.cx, op.g.cy, op.g.d / 2 + op.g.rb, op.base)]);
      else if (op.kind === 'hel') add(op.key, op.title + ' Ø' + fmt(op.g.d), [circ(op.g.cx, op.g.cy, op.g.d / 2, p.W)]);
      else if (op.kind === 'pcd' || op.kind === 'g83' || op.kind === 'reb') add(op.key, op.title + ' ' + op.what.split(' — ')[0], op.pts.map(function (q) { return circ(q[0], q[1], (op.d || p.T) / 2, p.W); }));
    });
    return E;
  }

  /* ---------- tocou na peça: que operações passam por ali (ponto em relação ao X0 Y0, Z da peça) ---------- */
  function distRect(x, y, g) { var dx = Math.abs(x - g.cx) - g.w / 2, dy = Math.abs(y - g.cy) - g.h / 2; return dx > 0 || dy > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) : -Math.max(dx, dy); }
  function opsAt(pl, q) {
    var A = pl.A, base = A.base || 0, x = q[0], y = q[1], z = q[2], out = [], bb = A.bbox, size = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0), tol = Math.max(2, size * 0.03);
    pl.ops.forEach(function (op) {
      var d = Infinity, g = op.g, r = g ? Math.hypot(x - g.cx, y - g.cy) : 0;
      if (op.kind === 'face') {
        var b0 = (A.bosses || [])[0];
        d = Math.abs(z) + (b0 && b0.t === 'circle' ? Math.max(0, Math.hypot(x - b0.cx, y - b0.cy) - b0.d / 2) : 0);
      } else if (op.kind === 'boss') {
        var rb = g.rb || 0, wall = z >= base + rb - 0.5 && z <= 0.5 ? Math.abs(r - g.d / 2) : Infinity, fl = r >= g.d / 2 + rb - 0.5 ? Math.abs(z - base) : Infinity;
        d = Math.min(wall, fl);
      } else if (op.kind === 'fillet') {
        var R = g.rb, cr = g.d / 2 + R, cz = op.base + R;
        if (r >= g.d / 2 - 1 && r <= cr + 1 && z >= op.base - 1 && z <= cz + 1) d = Math.abs(Math.hypot(r - cr, z - cz) - R);
      } else if (op.kind === 'ret' || op.kind === 'poli' || op.kind === 'circ') {
        var w = op.kind === 'circ' ? Math.abs(r - g.d / 2) : op.kind === 'poli' ? Math.abs(r - g.dc / 2 * Math.cos(Math.PI / g.n)) * 0.8 : Math.abs(distRect(x, y, g));
        d = w + Math.max(0, z - base);
      } else if (op.kind === 'hel') d = Math.abs(r - g.d / 2) + Math.max(0, z - op.p.W);
      else if (op.pts) { d = Infinity; op.pts.forEach(function (pt) { d = Math.min(d, Math.max(0, Math.hypot(x - pt[0], y - pt[1]) - (op.d || op.p.T) / 2 - 0.5) + Math.max(0, z - op.p.W)); }); }
      if (d < Infinity) out.push({ op: op, d: d });
    });
    out.sort(function (a, b) { return a.d - b.d; });
    if (!out.length) return [];
    var best = out[0].d;
    return out.filter(function (o, i) { return i === 0 || (o.d <= best + tol && o.d < tol * 2); }).map(function (o) { return o.op; });
  }

  /* ---------- perfil da peça em trechos tocáveis (parede, raio, face...) — cada trecho liga a operações ---------- */
  function segments(pl, azDeg) {
    var A = pl.A, o = A.origin || { x: 0, y: 0 }, base = A.base || 0, esp = A.esp, S = [], az = (azDeg || 0) * Math.PI / 180;
    var sil = [-az, Math.PI - az];   // ângulos onde a parede redonda aparece de lado (contorno visto)
    function opKey(kind, extra) { var op = pl.ops.filter(function (x) { return x.kind === kind && (!extra || extra(x)); })[0]; return op ? op.key : null; }
    function abs(L) { return L.map(function (p) { return [p[0] + o.x, p[1] + o.y, p[2]]; }); }
    // perfil (r, z) girado nos dois lados visíveis
    function prof(cx, cy, pts) { return sil.map(function (t) { return abs(pts.map(function (q) { return [cx + q[0] * Math.cos(t), cy + q[0] * Math.sin(t), q[1]]; })); }); }
    function ring(cx, cy, r, z) { return abs(circ(cx, cy, r, z)); }
    function add(key, label, ops, lines, dist) { ops = ops.filter(Boolean); if (!ops.length) return; S.push({ key: key, label: label, ops: ops, lines: lines, dist: dist }); }
    var faceK = opKey('face'), contK = opKey('ret') || opKey('poli') || opKey('circ'), O = A.outer;
    var bz = (A.bosses || []).filter(function (b) { return b.t === 'circle'; });
    bz.forEach(function (b, i) {
      var rb = b.d / 2, R = b.rb || 0, bk = 'bos' + A.bosses.indexOf(b), fk = 'rbs' + A.bosses.indexOf(b), zt = base + b.ress, zf = base + R;
      add('s-top' + i, T('Face de cima') + ' Ø' + fmt(b.d), [faceK], [ring(b.cx, b.cy, rb, zt)],
        function (q, r) { return r <= rb + 0.5 ? Math.abs(q[2] - zt) : Infinity; });
      add('s-bw' + i, T('Parede do ressalto') + ' Ø' + fmt(b.d), [bk], prof(b.cx, b.cy, [[rb, zt], [rb, zf]]),
        function (q, r) { return q[2] >= zf - 0.5 && q[2] <= zt + 0.5 ? Math.abs(r - rb) : Infinity; });
      if (R > 0) {
        var arc = []; for (var k = 0; k <= 18; k++) { var th = k * 5 * Math.PI / 180; arc.push([rb + R - R * Math.cos(th), base + R - R * Math.sin(th)]); }
        var m = arc[9];
        add('s-r' + i, T('Raio') + ' R' + fmt(R), [fk], prof(b.cx, b.cy, arc),
          function (q, r) { return r >= rb - 1 && r <= rb + R + 1 && q[2] >= base - 1 && q[2] <= zf + 1 ? Math.abs(Math.hypot(r - rb - R, q[2] - zf) - R) : Infinity; });
      }
      var rOut = O.t === 'circle' ? O.d / 2 - Math.hypot(O.cx - b.cx, O.cy - b.cy) : Math.min(O.w || 1e9, O.h || 1e9) / 2;
      if (rOut > rb + R + 0.5) add('s-bf' + i, T('Face de baixo'), [bk], prof(b.cx, b.cy, [[rb + R, base], [rOut, base]]),
        function (q, r) { return r >= rb + R - 0.5 ? Math.abs(q[2] - base) : Infinity; });
    });
    if (!bz.length && faceK) add('s-top', T('Face de cima'), [faceK], [abs(outline(O.t === 'outro' ? { t: 'rect', cx: O.cx, cy: O.cy, w: O.w, h: O.h } : O, 0))],
      function (q) { return Math.abs(q[2]); });
    if (contK) {
      var L = [];   // só as linhas de lado (perfil), nada por dentro
      if (O.t === 'circle') L = L.concat(prof(O.cx, O.cy, [[O.d / 2, base], [O.d / 2, -esp]]));
      else if (O.t === 'rect') [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(function (s2) { L.push(abs([[O.cx + s2[0] * O.w / 2, O.cy + s2[1] * O.h / 2, base], [O.cx + s2[0] * O.w / 2, O.cy + s2[1] * O.h / 2, -esp]])); });
      add('s-ow', T('Contorno de fora') + (O.t === 'circle' ? ' Ø' + fmt(O.d) : O.t === 'rect' ? ' ' + fmt(O.w) + ' × ' + fmt(O.h) : ''), [contK], L,
        function (q, r) { if (q[2] > base + 0.5) return Infinity; return O.t === 'circle' ? Math.abs(Math.hypot(q[0] - O.cx, q[1] - O.cy) - O.d / 2) : O.t === 'rect' ? Math.abs(distRect(q[0], q[1], O)) : Infinity; });
    }
    pl.ops.forEach(function (op) {   // furos e alojamentos
      if (op.kind === 'hel') { var g = op.g, zf2 = op.p.W, zb2 = Math.max(op.p.Z, -esp);
        add('s-' + op.key, op.title + ' Ø' + fmt(g.d), [op.key], [ring(g.cx, g.cy, g.d / 2, zf2)],
          function (q) { return Math.abs(Math.hypot(q[0] - g.cx, q[1] - g.cy) - g.d / 2); }); }
      else if (op.pts) add('s-' + op.key, op.title + ' ' + op.what.split(' — ')[0], [op.key], op.pts.map(function (pt) { return ring(pt[0], pt[1], (op.d || op.p.T) / 2, op.p.W); }),
        function (q) { var d = Infinity; op.pts.forEach(function (pt) { d = Math.min(d, Math.max(0, Math.hypot(q[0] - pt[0], q[1] - pt[1]) - (op.d || op.p.T) / 2 - 0.5)); }); return d; });
    });
    S.forEach(function (sg) { var d0 = sg.dist; sg.dist = function (q) { var c = bz[0] || O; return d0(q, Math.hypot(q[0] - (c.cx || 0), q[1] - (c.cy || 0))); }; });
    return S;
  }

  root.Plan = { groups: groups, buildGroup: buildGroup, isParam: isParam, segments: segments, opsAt: opsAt, edges: edges, plan: plan, describe: describe, build: build, helixTool: helixTool, fitCircle: fitCircle, gv: gv, stockOf: stockOf, SOB: SOB };
})(this);
