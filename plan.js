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
        p: { T: 50, S: 1000, F: 1000, W: 0, Z: r3(base), K: 2, Q: 30, R: 5 }, g: b, rOut: r3(stR) });
      if (b.rb > 0) ops.push({ key: 'rbs' + i, kind: 'fillet', title: T('Raio na base do ressalto'), what: 'R' + fmt(b.rb) + ' ' + T('entre') + ' Ø' + fmt(b.d) + ' ' + T('e a face de baixo') + ' — ' + T('quina da fresa segue o raio'),
        p: { T: 25, S: 1500, F: 1200, H: 2, R: 5 }, g: b, base: r3(base) });
    });

    // 3) contorno externo
    var o = A.outer;
    if (o.t === 'rect') ops.push({ key: 'cont', kind: 'ret', title: T('Contorno externo'), what: T('Retângulo') + ' ' + fmt(o.w) + ' × ' + fmt(o.h) + (o.r ? ' R' + fmt(o.r) : ''),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else if (o.t === 'poly') ops.push({ key: 'cont', kind: 'poli', title: T('Contorno externo'), what: T('Polígono') + ' ' + o.n + ' ' + T('lados') + ', Ø' + fmt(o.dc) + ' ' + T('entre cantos'),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else if (o.t === 'circle') ops.push({ key: 'cont', kind: 'circ', title: T('Contorno externo'), what: T('Diâmetro externo') + ' Ø' + fmt(o.d),
      p: { T: 25, S: 1200, F: 800, W: cW, Z: -r3(esp), K: 2, A: 20, R: 5 }, g: o });
    else notes.push(T('O contorno de fora não é um retângulo, círculo ou polígono: fica para o assistente ou para o CAM.'));

    // 3) furos/alojamentos redondos de dentro: interpolação helicoidal (O1613)
    A.circles.forEach(function (c, i) {
      var fz = A.faceAt ? A.faceAt(c.cx, c.cy) : 0, t = helixTool(c.d), deep = c.prof ? r3(fz - c.prof) : thru;
      var op = { key: 'hel' + i, kind: 'hel', title: c.prof ? T('Alojamento redondo') : T('Furo central'), what: 'Ø' + fmt(c.d) + ' ' + (c.prof ? T('prof.') + ' ' + fmt(c.prof) : T('passante')) + ' — ' + T('interpolação helicoidal'),
        p: { T: t || Math.max(6, Math.floor(c.d * 0.6)), S: 1200, F: 800, W: fz, Z: deep, K: 1.5, R: 5 }, g: c, warn: [] };
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
    var p = op.p, t = gi(p.N), nm = upper(pl.name).slice(0, 18), L, call = [], id = null, key = null;
    var ttl = (nm ? nm + ' - ' : '') + 'OP' + op.idx + ' ' + upper(op.title);
    // bruto e ferramenta no cabeçalho: o operador vê, e a simulação monta o bruto certo (cilindro ou bloco)
    var face = pl.ops.filter(function (x) { return x.kind === 'face' && x.on; })[0];
    var info = [stockTxt(stockOf(pl.A, pl.sob, face ? face.p.W : 0)), '(' + (op.kind === 'pcd' || op.kind === 'g83' ? 'BROCA' : 'FRESA') + ' D' + gv(p.T) + ') ;'];
    function hd(O2, title, t2, S2, xy) { return header(O2, title, t2, S2, xy, info); }
    if (op.kind === 'face') {
      id = 'm-face';
      var centered = Math.abs(op.cx) < 0.01 && Math.abs(op.cy) < 0.01, corner = Math.abs(pl.A.bbox.x0) < 0.01 && Math.abs(pl.A.bbox.y0) < 0.01;
      key = corner && !centered ? '1611-canto' : '1611-centro';
      var g65 = 'G65 P1611 X' + gv(op.w) + ' Y' + gv(op.h) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' T' + gv(p.T) + ' Q' + gv(p.Q) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;';
      if (!centered && !corner) call.push('(ORIGEM DA AREA DESLOCADA COM G52) ;', 'G52 X' + gv(op.cx) + ' Y' + gv(op.cy) + ' ;', g65, 'G52 X0 Y0 ;');
      else call.push(g65);
      L = hd(O, ttl, t, p.S, 'X0 Y0');
    } else if (op.kind === 'ret') {
      id = 'm-ret'; var g = op.g;
      call.push('G65 P1616 X' + gv(g.cx) + ' Y' + gv(g.cy) + ' I' + gv(g.w) + ' J' + gv(g.h) + ' C' + gv(g.r || 0) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' A' + gv(p.A) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(g.cx) + ' Y' + gv(g.cy));
    } else if (op.kind === 'poli') {
      id = 'm-poli'; var gp = op.g;
      call.push('G65 P1617 X' + gv(gp.cx) + ' Y' + gv(gp.cy) + ' B' + gp.n + ' D' + gv(gp.dc) + ' A' + gv(gp.ang || 0) + ' E' + gv(p.A) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(gp.cx) + ' Y' + gv(gp.cy));
    } else if (op.kind === 'circ') {
      // diâmetro externo: sem macro na biblioteca — programa parametrizado com G2 descendo K por volta
      var gc = op.g, rT = r3(gc.d / 2 + p.T / 2), xs = r3(gc.cx + rT);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(xs + p.A)) + ' Y' + gv(gc.cy));
      L.push('#1 = ' + gv(gc.cx) + ' (X CENTRO) ;', '#2 = ' + gv(gc.cy) + ' (Y CENTRO) ;', '#3 = ' + gv(rT) + ' (RAIO DA TRAJETORIA = D/2 + T/2) ;', '#4 = ' + gv(p.W) + ' (Z INICIAL) ;', '#5 = ' + gv(p.Z) + ' (Z FINAL) ;', '#6 = ' + gv(p.K) + ' (DESCIDA POR VOLTA) ;',
        'G0 Z[#4 + ' + gv(p.R) + '] ;', 'G1 Z#4 F' + gv(p.F) + ' ;', 'G1 X[#1 + #3] Y#2 F' + gv(p.F) + ' ;', 'N10 #4 = #4 - #6 ;', 'IF [#4 LT #5] THEN #4 = #5 ;', 'G2 X[#1 + #3] Y#2 Z#4 I-#3 J0 ;', 'IF [#4 GT #5] GOTO 10 ;', 'G2 X[#1 + #3] Y#2 I-#3 J0 (VOLTA FINAL SEM DESCER) ;', 'G1 X[#1 + #3 + ' + gv(p.A) + '] ;');
    } else if (op.kind === 'boss') {
      // desbaste em volta de ressalto redondo: voltas G2 de fora para dentro a cada Z; perto da base segue o raio R
      var b = op.g, tr = r3(p.T / 2);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(b.cx + op.rOut + tr + 5)) + ' Y' + gv(b.cy));
      L.push('#1 = ' + gv(b.cx) + ' (X CENTRO DO RESSALTO) ;', '#2 = ' + gv(b.cy) + ' (Y CENTRO DO RESSALTO) ;', '#3 = ' + gv(b.d / 2) + ' (RAIO DO RESSALTO) ;', '#4 = ' + gv(b.rb || 0) + ' (RAIO NA BASE - 0 = CANTO VIVO) ;',
        '#5 = ' + gv(op.rOut) + ' (RAIO DO BRUTO A LIMPAR) ;', '#6 = ' + gv(tr) + ' (RAIO DA FRESA) ;', '#7 = ' + gv(p.Z) + ' (Z DA FACE DE BAIXO) ;', '#8 = ' + gv(p.K) + ' (DESCIDA EM Z) ;', '#9 = ' + gv(p.Q) + ' (PASSO LATERAL) ;', '#10 = ' + gv(p.W) + ' (Z INICIAL - TOPO) ;',
        '#20 = #10 ;', 'G0 Z[#10 + ' + gv(p.R) + '] ;',
        'N10 #20 = #20 - #8 ;', 'IF [#20 LT #7] THEN #20 = #7 ;',
        '(RAIO LIMITE NESTE Z - PERTO DA BASE SEGUE O RAIO R) ;', '#21 = #3 ;', '#23 = #7 + #4 - #20 ;', 'IF [#23 GT 0] THEN #21 = #3 + #4 - SQRT[#4 * #4 - #23 * #23] ;',
        '#22 = #5 + #6 - #9 ;', 'G0 X[#1 + #5 + #6 + 5] Y#2 ;', 'G1 Z#20 F' + gv(p.F) + ' ;',
        'N20 IF [#22 LT [#21 + #6]] THEN #22 = #21 + #6 ;', 'G1 X[#1 + #22] Y#2 ;', 'G2 X[#1 + #22] Y#2 I-#22 J0 ;', 'IF [#22 LE [#21 + #6]] GOTO 30 ;', '#22 = #22 - #9 ;', 'GOTO 20 ;',
        'N30 G1 X[#1 + #5 + #6 + 5] ;', 'IF [#20 GT #7] GOTO 10 ;', 'G0 Z[#10 + ' + gv(p.R) + '] ;');
    } else if (op.kind === 'fillet') {
      // raio côncavo na base do ressalto: a quina de baixo da fresa segue o arco, uma volta G2 a cada H graus
      var bf = op.g, tf2 = r3(p.T / 2);
      L = hd(O, ttl, t, p.S, 'X' + gv(r3(bf.cx + bf.d / 2 + bf.rb + tf2 + 5)) + ' Y' + gv(bf.cy));
      L.push('(FRESA DE TOPO RETA COM CANTO VIVO - DESBASTE JA FEITO) ;', '#1 = ' + gv(bf.cx) + ' (X CENTRO) ;', '#2 = ' + gv(bf.cy) + ' (Y CENTRO) ;', '#3 = ' + gv(bf.d / 2) + ' (RAIO DO RESSALTO) ;', '#4 = ' + gv(bf.rb) + ' (RAIO NA BASE) ;',
        '#6 = ' + gv(tf2) + ' (RAIO DA FRESA) ;', '#7 = ' + gv(op.base) + ' (Z DA FACE DE BAIXO) ;', '#11 = ' + gv(p.H) + ' (PASSO EM GRAUS) ;', '#12 = 0 ;',
        'G0 Z[#7 + #4 + ' + gv(p.R) + '] ;',
        'N10 IF [#12 GT 90] THEN #12 = 90 ;', '#13 = #3 + #4 - #4 * COS[#12] (RAIO DO PONTO NO ARCO) ;', '#14 = #7 + #4 - #4 * SIN[#12] (Z DO PONTO NO ARCO) ;',
        'G1 X[#1 + #13 + #6] Y#2 Z#14 F' + gv(p.F) + ' ;', 'G2 X[#1 + #13 + #6] Y#2 I-[#13 + #6] J0 ;', 'IF [#12 GE 90] GOTO 20 ;', '#12 = #12 + #11 ;', 'GOTO 10 ;',
        'N20 G1 X[#1 + #3 + #4 + #6 + 5] ;', 'G0 Z[#7 + #4 + ' + gv(p.R) + '] ;');
    } else if (op.kind === 'hel') {
      id = 'm-helice'; var gh = op.g;
      call.push('G65 P1613 X' + gv(gh.cx) + ' Y' + gv(gh.cy) + ' D' + gv(gh.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;');
      L = hd(O, ttl, t, p.S, 'X' + gv(gh.cx) + ' Y' + gv(gh.cy));
    } else if (op.kind === 'reb') {
      id = 'm-helice';
      op.pts.forEach(function (q) { call.push('G65 P1613 X' + gv(q[0]) + ' Y' + gv(q[1]) + ' D' + gv(op.d) + ' T' + gv(p.T) + ' W' + gv(p.W) + ' Z' + gv(p.Z) + ' K' + gv(p.K) + ' R' + gv(p.R) + ' F' + gv(p.F) + ' ;'); });
      L = hd(O, ttl, t, p.S, 'X' + gv(op.pts[0][0]) + ' Y' + gv(op.pts[0][1]));
    } else if (op.kind === 'pcd') {
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
        add(op.key, op.title + ' ' + op.what, (hasF ? [] : [outline(op.g, zt)]).concat([outline(op.g, zm), outline(op.g, -A.esp)]));
      }
      else if (op.kind === 'boss') add(op.key, op.title + ' Ø' + fmt(op.g.d), [circ(op.g.cx, op.g.cy, op.g.d / 2, 0)]);
      else if (op.kind === 'fillet') add(op.key, op.title + ' R' + fmt(op.g.rb), [circ(op.g.cx, op.g.cy, op.g.d / 2 + op.g.rb, op.base)]);
      else if (op.kind === 'hel') add(op.key, op.title + ' Ø' + fmt(op.g.d), [circ(op.g.cx, op.g.cy, op.g.d / 2, p.W)]);
      else if (op.kind === 'pcd' || op.kind === 'g83' || op.kind === 'reb') add(op.key, op.title + ' ' + op.what.split(' — ')[0], op.pts.map(function (q) { return circ(q[0], q[1], (op.d || p.T) / 2, p.W); }));
    });
    return E;
  }

  root.Plan = { edges: edges, plan: plan, describe: describe, build: build, helixTool: helixTool, fitCircle: fitCircle, gv: gv, stockOf: stockOf, SOB: SOB };
})(this);
