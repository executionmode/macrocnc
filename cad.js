/* Macro CNC — aba Desenho (CAD 2D simples).
 * Medidas sempre em mm, em relação à origem que o usuário escolhe.
 * Os elementos ficam guardados em coordenadas absolutas; a origem só muda como as medidas aparecem.
 * Etapa 1: tela, origem, círculo, retângulo/quadrado, linha, furos (um, PCD, linha, grade), seleção, lista, arquivos.
 */
(function (root) {
  'use strict';
  var KEY = 'mcnc.cad';
  var T = function (s) { return (root.I18N && root.I18N.t) ? root.I18N.t(s) : s; };
  var D2R = Math.PI / 180;

  /* ---------- utilidades ---------- */
  function fmt(v) { if (!isFinite(v)) return ''; var r = Math.round(v * 1000) / 1000; if (Object.is(r, -0)) r = 0; return String(r); }
  function num(s) {
    s = String(s == null ? '' : s).replace(/,/g, '.').replace(/\s+/g, '');
    if (!s) return NaN;
    if (!/^[0-9+\-*/().]+$/.test(s)) return NaN;
    try { var v = Function('"use strict";return (' + s + ')')(); return typeof v === 'number' && isFinite(v) ? v : NaN; } catch (e) { return NaN; }
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- armazenamento ---------- */
  function loadAll() {
    var s; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!s || !s.docs) s = { cur: null, docs: {} };
    if (!s.cur || !s.docs[s.cur]) { var id = uid(); s.docs[id] = newDoc(T('Desenho') + ' 1'); s.cur = id; }
    return s;
  }
  function newDoc(name) { return { name: name, origin: { x: 0, y: 0 }, ents: [], upd: Date.now() }; }
  var store = null, doc = null;
  function save() { doc.upd = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { toast(T('Sem espaço para salvar no aparelho.')); } }

  /* ---------- geometria ---------- */
  function holePts(e) {
    var p = [], i, j;
    if (e.mode === 'pcd') { var R = e.pcd / 2; for (i = 0; i < e.n; i++) { var a = (e.a0 + i * 360 / e.n) * D2R; p.push([e.x + R * Math.cos(a), e.y + R * Math.sin(a)]); } }
    else if (e.mode === 'linha') { var c = Math.cos(e.ang * D2R), s = Math.sin(e.ang * D2R); for (i = 0; i < e.n; i++) p.push([e.x + i * e.dist * c, e.y + i * e.dist * s]); }
    else if (e.mode === 'grade') { for (j = 0; j < e.ny; j++) for (i = 0; i < e.nx; i++) p.push([e.x + i * e.dx, e.y + j * e.dy]); }
    else p.push([e.x, e.y]);
    return p;
  }
  // primitivas: c = círculo, l = linha, a = arco (graus, anti-horário de a0 até a1)
  function prims(e) {
    var P = [];
    if (e.t === 'circle') P.push({ k: 'c', x: e.x, y: e.y, r: e.d / 2 });
    else if (e.t === 'line') P.push({ k: 'l', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 });
    else if (e.t === 'rect') {
      var x0 = e.x, y0 = e.y, x1 = e.x + e.w, y1 = e.y + e.h, r = Math.min(e.r || 0, e.w / 2, e.h / 2);
      if (r > 0) {
        P.push({ k: 'l', x1: x0 + r, y1: y0, x2: x1 - r, y2: y0 }, { k: 'l', x1: x1, y1: y0 + r, x2: x1, y2: y1 - r },
          { k: 'l', x1: x1 - r, y1: y1, x2: x0 + r, y2: y1 }, { k: 'l', x1: x0, y1: y1 - r, x2: x0, y2: y0 + r },
          { k: 'a', x: x1 - r, y: y0 + r, r: r, a0: 270, a1: 360 }, { k: 'a', x: x1 - r, y: y1 - r, r: r, a0: 0, a1: 90 },
          { k: 'a', x: x0 + r, y: y1 - r, r: r, a0: 90, a1: 180 }, { k: 'a', x: x0 + r, y: y0 + r, r: r, a0: 180, a1: 270 });
      } else P.push({ k: 'l', x1: x0, y1: y0, x2: x1, y2: y0 }, { k: 'l', x1: x1, y1: y0, x2: x1, y2: y1 }, { k: 'l', x1: x1, y1: y1, x2: x0, y2: y1 }, { k: 'l', x1: x0, y1: y1, x2: x0, y2: y0 });
    } else if (e.t === 'holes') {
      if (e.mode === 'pcd') P.push({ k: 'c', x: e.x, y: e.y, r: e.pcd / 2, cl: 1 });
      holePts(e).forEach(function (q) { P.push({ k: 'c', x: q[0], y: q[1], r: e.d / 2, hole: 1 }); });
    }
    return P;
  }
  function snapPts(e) {
    var S = [];
    if (e.t === 'rect') {
      var r = Math.min(e.r || 0, e.w / 2, e.h / 2);
      S.push([e.x + e.w / 2, e.y + e.h / 2, 'centro']);
      if (!r) S.push([e.x, e.y, 'canto'], [e.x + e.w, e.y, 'canto'], [e.x + e.w, e.y + e.h, 'canto'], [e.x, e.y + e.h, 'canto']);
      S.push([e.x + e.w / 2, e.y, 'meio'], [e.x + e.w, e.y + e.h / 2, 'meio'], [e.x + e.w / 2, e.y + e.h, 'meio'], [e.x, e.y + e.h / 2, 'meio']);
    }
    prims(e).forEach(function (p) {
      if (p.k === 'c') { S.push([p.x, p.y, 'centro']); if (!p.cl) S.push([p.x + p.r, p.y, 'quadrante'], [p.x - p.r, p.y, 'quadrante'], [p.x, p.y + p.r, 'quadrante'], [p.x, p.y - p.r, 'quadrante']); }
      else if (p.k === 'l') { if (e.t !== 'rect') S.push([p.x1, p.y1, 'ponta'], [p.x2, p.y2, 'ponta'], [(p.x1 + p.x2) / 2, (p.y1 + p.y2) / 2, 'meio']); }
      else if (p.k === 'a') S.push([p.x + p.r * Math.cos(p.a0 * D2R), p.y + p.r * Math.sin(p.a0 * D2R), 'ponta'], [p.x + p.r * Math.cos(p.a1 * D2R), p.y + p.r * Math.sin(p.a1 * D2R), 'ponta']);
    });
    return S;
  }
  function distSeg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t)); var qx = x1 + t * dx - px, qy = y1 + t * dy - py; return Math.sqrt(qx * qx + qy * qy);
  }
  function angIn(a, a0, a1) { a = ((a % 360) + 360) % 360; var s = ((a0 % 360) + 360) % 360, e = s + (a1 - a0); return (a >= s && a <= e) || (a + 360 >= s && a + 360 <= e); }
  function distPrim(p, x, y) {
    if (p.k === 'l') return distSeg(x, y, p.x1, p.y1, p.x2, p.y2);
    var d = Math.hypot(x - p.x, y - p.y);
    if (p.k === 'c') return p.hole ? Math.max(0, d - p.r) : Math.abs(d - p.r);
    var a = Math.atan2(y - p.y, x - p.x) / D2R;
    if (angIn(a, p.a0, p.a1)) return Math.abs(d - p.r);
    return Math.min(Math.hypot(x - p.x - p.r * Math.cos(p.a0 * D2R), y - p.y - p.r * Math.sin(p.a0 * D2R)), Math.hypot(x - p.x - p.r * Math.cos(p.a1 * D2R), y - p.y - p.r * Math.sin(p.a1 * D2R)));
  }
  function bounds(list) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    function add(x, y) { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x > b.x1) b.x1 = x; if (y > b.y1) b.y1 = y; }
    list.forEach(function (e) { prims(e).forEach(function (p) { if (p.k === 'l') { add(p.x1, p.y1); add(p.x2, p.y2); } else { add(p.x - p.r, p.y - p.r); add(p.x + p.r, p.y + p.r); } }); });
    return b;
  }

  /* ---------- descrição para a lista ---------- */
  var NAMES = { circle: 'Círculo', rect: 'Retângulo', line: 'Linha', holes: 'Furos' };
  function rel(x, y) { return [x - doc.origin.x, y - doc.origin.y]; }
  function describe(e) {
    var o;
    if (e.t === 'circle') { o = rel(e.x, e.y); return T('Círculo') + ' Ø' + fmt(e.d) + ' · X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
    if (e.t === 'rect') { o = rel(e.x, e.y); return (e.w === e.h ? T('Quadrado') : T('Retângulo')) + ' ' + fmt(e.w) + ' x ' + fmt(e.h) + (e.r ? ' R' + fmt(e.r) : '') + ' · ' + T('canto') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
    if (e.t === 'line') { var a = rel(e.x1, e.y1), b = rel(e.x2, e.y2); return T('Linha') + ' X' + fmt(a[0]) + ' Y' + fmt(a[1]) + ' → X' + fmt(b[0]) + ' Y' + fmt(b[1]) + ' · L' + fmt(Math.hypot(e.x2 - e.x1, e.y2 - e.y1)); }
    if (e.t === 'holes') {
      var n = holePts(e).length;
      if (e.mode === 'pcd') { o = rel(e.x, e.y); return n + ' ' + T('furos') + ' Ø' + fmt(e.d) + ' · PCD Ø' + fmt(e.pcd) + ' · ' + T('centro') + ' X' + fmt(o[0]) + ' Y' + fmt(o[1]); }
      return (n === 1 ? T('Furo') : n + ' ' + T('furos')) + ' Ø' + fmt(e.d);
    }
    return e.t;
  }

  /* ---------- formulários das ferramentas ---------- */
  // cada campo: [chave, rótulo, padrão] ; seg: [chave, [[valor, rótulo]...]]
  var FORMS = {
    circle: { title: 'Círculo', hint: 'Toque na tela para pôr o centro, ou digite.', fields: function () { return [['x', 'X do centro', 0], ['y', 'Y do centro', 0], ['d', 'Diâmetro', 50]]; } },
    rect: {
      title: 'Retângulo', hint: 'Toque na tela para pôr o ponto de referência, ou digite.',
      seg: [['forma', [['ret', 'Retângulo'], ['quad', 'Quadrado']]], ['ref', [['canto', 'Pelo canto'], ['centro', 'Pelo centro']]]],
      fields: function (v) {
        var f = [['x', v.ref === 'centro' ? 'X do centro' : 'X do canto (esquerdo, embaixo)', 0], ['y', v.ref === 'centro' ? 'Y do centro' : 'Y do canto (esquerdo, embaixo)', 0]];
        if (v.forma === 'quad') f.push(['w', 'Lado', 100]); else f.push(['w', 'Largura (X)', 100], ['h', 'Altura (Y)', 60]);
        f.push(['r', 'Raio nos cantos (0 = canto vivo)', 0]);
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
    holes: {
      title: 'Furos', hint: 'Toque na tela para pôr o furo (ou o centro do PCD), ou digite.',
      seg: [['mode', [['um', 'Um furo'], ['pcd', 'Em círculo (PCD)'], ['linha', 'Em linha'], ['grade', 'Em grade']]]],
      fields: function (v) {
        var f = [['d', 'Diâmetro do furo', 12]];
        if (v.mode === 'pcd') f.push(['x', 'X do centro do PCD', 0], ['y', 'Y do centro do PCD', 0], ['pcd', 'Diâmetro do PCD', 100], ['n', 'Quantidade de furos', 6], ['a0', 'Ângulo do 1º furo (0 = direita)', 0]);
        else if (v.mode === 'linha') f.push(['x', 'X do 1º furo', 0], ['y', 'Y do 1º furo', 0], ['n', 'Quantidade de furos', 4], ['dist', 'Distância entre furos', 25], ['ang', 'Ângulo da linha (0 = direita)', 0]);
        else if (v.mode === 'grade') f.push(['x', 'X do 1º furo (esquerdo, embaixo)', 0], ['y', 'Y do 1º furo (esquerdo, embaixo)', 0], ['nx', 'Colunas (em X)', 3], ['ny', 'Linhas (em Y)', 2], ['dx', 'Distância em X', 25], ['dy', 'Distância em Y', 25]);
        else f.push(['x', 'X do furo', 0], ['y', 'Y do furo', 0]);
        return f;
      }
    },
    origin: {
      title: 'Origem (X0 Y0)', hint: 'Toque num ponto do desenho (centro, canto, ponta) para pôr a origem ali. Ou mova a origem digitando quanto.',
      fields: function () { return [['dx', 'Mover a origem em X', 0], ['dy', 'Mover a origem em Y', 0]]; }
    }
  };
  var SEG_DEF = { forma: 'ret', ref: 'canto', modo: 'pts', mode: 'um' };

  /* ---------- estado da tela ---------- */
  var el = {}, ctx, W = 0, H = 0, dpr = 1;
  var view = { cx: 0, cy: 0, s: 2 };
  var tool = 'select', vals = {}, editing = null, sel = null, hover = null, snapHit = null, linePick = 0;
  var undoS = [], redoS = [], built = false, firstFit = true;

  function toS(x, y) { return [W / 2 + (x - view.cx) * view.s, H / 2 - (y - view.cy) * view.s]; }
  function toW(sx, sy) { return [view.cx + (sx - W / 2) / view.s, view.cy - (sy - H / 2) / view.s]; }

  function pushUndo() { undoS.push(JSON.stringify({ o: doc.origin, e: doc.ents })); if (undoS.length > 120) undoS.shift(); redoS = []; updBtns(); }
  function restore(s) { var o = JSON.parse(s); doc.origin = o.o; doc.ents = o.e; sel = null; editing = null; save(); }
  function undo() { if (!undoS.length) return; redoS.push(JSON.stringify({ o: doc.origin, e: doc.ents })); restore(undoS.pop()); closePanel(true); updBtns(); draw(); }
  function redo() { if (!redoS.length) return; undoS.push(JSON.stringify({ o: doc.origin, e: doc.ents })); restore(redoS.pop()); closePanel(true); updBtns(); draw(); }
  function updBtns() { if (!el.undo) return; el.undo.disabled = !undoS.length; el.redo.disabled = !redoS.length; }

  /* ---------- montagem ---------- */
  var TOOLS = [['select', 'Selecionar', 'sel'], ['origin', 'Origem', 'org'], ['circle', 'Círculo', 'cir'], ['rect', 'Retângulo', 'rec'], ['line', 'Linha', 'lin'], ['holes', 'Furos', 'fur']];
  var IC = {
    sel: '<path d="M6 3l12 9-5.5 1.2L16 20l-2.6 1.2-3-6.5L6 18.5z"/>',
    org: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>',
    cir: '<circle cx="12" cy="12" r="8"/><path d="M12 10.5v3M10.5 12h3"/>',
    rec: '<rect x="3.5" y="6" width="17" height="12" rx="1"/>',
    lin: '<path d="M4 19 20 5"/><circle cx="4" cy="19" r="1.6"/><circle cx="20" cy="5" r="1.6"/>',
    fur: '<circle cx="12" cy="12" r="8" stroke-dasharray="2.5 2.5"/><circle cx="12" cy="4" r="2"/><circle cx="19" cy="15" r="2"/><circle cx="5" cy="15" r="2"/>',
    undo: '<path d="M9 7H4v5"/><path d="M4.5 11.5A8 8 0 1 1 7 18"/>',
    redo: '<path d="M15 7h5v5"/><path d="M19.5 11.5A8 8 0 1 0 17 18"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'
  };
  function ic(n) { return '<svg class="cad-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>'; }

  function build() {
    var host = document.getElementById('cad'); if (!host) return false;
    host.innerHTML =
      '<div class="cad-top">' +
        '<button type="button" class="cad-name" data-a="files">' + ic('file') + '<span id="cadName"></span></button>' +
        '<button type="button" class="cad-b" data-a="undo" aria-label="Desfazer">' + ic('undo') + '</button>' +
        '<button type="button" class="cad-b" data-a="redo" aria-label="Refazer">' + ic('redo') + '</button>' +
        '<button type="button" class="cad-b" data-a="fit" aria-label="Ver tudo">' + ic('fit') + '</button>' +
        '<button type="button" class="cad-b" data-a="list" aria-label="Lista de elementos">' + ic('list') + '</button>' +
      '</div>' +
      '<div class="cad-stage"><canvas id="cadCv"></canvas><div class="cad-xy notr" id="cadXY"></div><div class="cad-toast" id="cadToast"></div></div>' +
      '<div class="cad-panel hidden" id="cadPanel"></div>' +
      '<div class="cad-tools">' + TOOLS.map(function (t) { return '<button type="button" data-tool="' + t[0] + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>'; }).join('') + '</div>' +
      '<div class="cad-modal hidden" id="cadModal"><div class="cad-mbox"><div class="cad-mhead"><h2 id="cadMTitle"></h2><button type="button" class="cad-b" data-a="mclose" aria-label="Fechar">✕</button></div><div id="cadMBody"></div></div></div>';
    el.host = host; el.cv = host.querySelector('#cadCv'); ctx = el.cv.getContext('2d');
    el.xy = host.querySelector('#cadXY'); el.panel = host.querySelector('#cadPanel'); el.name = host.querySelector('#cadName');
    el.undo = host.querySelector('[data-a=undo]'); el.redo = host.querySelector('[data-a=redo]');
    el.modal = host.querySelector('#cadModal'); el.mt = host.querySelector('#cadMTitle'); el.mb = host.querySelector('#cadMBody'); el.toast = host.querySelector('#cadToast');
    host.addEventListener('click', onClick);
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
    var s = e.target.closest('[data-seg]'); if (s) { readPanel(); vals[s.dataset.seg] = s.dataset.v; renderPanel(); preview(); return; }
    var a = e.target.closest('[data-a]'); if (!a) return;
    var act = a.dataset.a;
    if (act === 'undo') undo(); else if (act === 'redo') redo(); else if (act === 'fit') fit(true);
    else if (act === 'list') openList(); else if (act === 'files') openFiles(); else if (act === 'mclose') closeModal();
    else if (act === 'ok') apply(); else if (act === 'close') setTool('select'); else if (act === 'del') delSel(); else if (act === 'dup') dupSel();
    else if (act === 'origin0') { pushUndo(); doc.origin = { x: 0, y: 0 }; save(); toast(T('Origem voltou para o ponto inicial.')); draw(); }
    else if (act === 'fnew') { var nm = prompt(T('Nome do desenho'), T('Desenho') + ' ' + (Object.keys(store.docs).length + 1)); if (nm == null) return; var id = uid(); store.docs[id] = newDoc(nm.trim() || T('Desenho')); switchDoc(id); closeModal(); }
    else if (act === 'fopen') { switchDoc(a.dataset.id); closeModal(); }
    else if (act === 'fren') { var n2 = prompt(T('Novo nome'), doc.name); if (n2 == null) return; doc.name = n2.trim() || doc.name; save(); el.name.textContent = doc.name; openFiles(); }
    else if (act === 'fdel') {
      if (!confirm(T('Apagar este desenho? Não dá para desfazer.'))) return;
      delete store.docs[store.cur]; var ks = Object.keys(store.docs);
      if (!ks.length) { var nid = uid(); store.docs[nid] = newDoc(T('Desenho') + ' 1'); ks = [nid]; }
      switchDoc(ks[0]); closeModal();
    }
    else if (act === 'lsel') { var en = doc.ents.find(function (x) { return x.id === a.dataset.id; }); closeModal(); if (en) { selectEnt(en); fitTo([en]); } }
  }

  function switchDoc(id) { store.cur = id; doc = store.docs[id]; undoS = []; redoS = []; sel = null; editing = null; save(); el.name.textContent = doc.name; closePanel(true); updBtns(); fit(); }

  /* ---------- painel ---------- */
  function setTool(t) {
    tool = t; editing = null; sel = null; linePick = 0;
    el.host.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === t); });
    if (t === 'select') { closePanel(true); draw(); return; }
    var keep = vals._t === t ? vals : null;
    vals = keep || { _t: t };
    var F = FORMS[t];
    (F.seg || []).forEach(function (s) { if (vals[s[0]] == null) vals[s[0]] = SEG_DEF[s[0]]; });
    if (t === 'origin') { vals.dx = 0; vals.dy = 0; }
    renderPanel(); preview();
  }
  function fieldsOf(t) {
    var F = FORMS[t], f = F.fields(vals);
    f.forEach(function (x) { if (vals[x[0]] == null || vals[x[0]] === '') vals[x[0]] = x[2]; });
    return f;
  }
  function renderPanel() {
    var t = editing ? editing.t : tool, F = FORMS[t];
    var h = '<div class="cad-ph"><b>' + esc(T(F.title)) + (editing ? ' · ' + esc(T('editar')) : '') + '</b><button type="button" class="cad-b" data-a="close" aria-label="Fechar">✕</button></div>';
    if (!editing) h += '<p class="cad-hint">' + esc(T(F.hint)) + '</p>';
    (F.seg || []).forEach(function (s) {
      h += '<div class="cad-seg">' + s[1].map(function (o) { return '<button type="button" data-seg="' + s[0] + '" data-v="' + o[0] + '" class="' + (vals[s[0]] === o[0] ? 'on' : '') + '">' + esc(T(o[1])) + '</button>'; }).join('') + '</div>';
    });
    h += '<div class="cad-fields">';
    fieldsOf(t).forEach(function (f) {
      var v = vals[f[0]];
      h += '<label class="cad-f"><span>' + esc(T(f[1])) + '</span><input type="text" inputmode="decimal" autocomplete="off" data-k="' + f[0] + '" value="' + esc(typeof v === 'number' ? fmt(v) : v) + '"></label>';
    });
    h += '</div><div class="cad-pbtn">';
    if (t === 'origin') h += '<button type="button" class="ui-btn" data-a="origin0">' + esc(T('Voltar ao início')) + '</button><button type="button" class="ui-btn primary" data-a="ok">' + esc(T('Mover origem')) + '</button>';
    else if (editing) h += '<button type="button" class="ui-btn danger" data-a="del">' + esc(T('Apagar')) + '</button><button type="button" class="ui-btn" data-a="dup">' + esc(T('Duplicar')) + '</button><button type="button" class="ui-btn primary" data-a="ok">' + esc(T('Salvar')) + '</button>';
    else h += '<button type="button" class="ui-btn primary wide" data-a="ok">' + esc(T(t === 'holes' ? 'Adicionar furos' : 'Adicionar')) + '</button>';
    h += '</div>';
    el.panel.innerHTML = h; el.panel.classList.remove('hidden');
  }
  function closePanel(silent) { el.panel.classList.add('hidden'); el.panel.innerHTML = ''; if (!silent) draw(); }
  function readPanel() { el.panel.querySelectorAll('input[data-k]').forEach(function (i) { vals[i.dataset.k] = i.value; }); }
  function onPanelInput() { readPanel(); preview(); }
  function setField(k, v) { vals[k] = fmt(v); var i = el.panel.querySelector('input[data-k="' + k + '"]'); if (i) i.value = fmt(v); }

  // monta a entidade a partir do painel; devolve {e} ou {err}
  function entFromVals(t) {
    var V = {}, bad = null;
    fieldsOf(t).forEach(function (f) { var n = num(vals[f[0]]); if (isNaN(n)) bad = bad || f[1]; V[f[0]] = n; });
    if (bad) return { err: T('Confira o campo') + ': ' + T(bad) };
    var ox = doc.origin.x, oy = doc.origin.y, e;
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
    } else if (t === 'holes') {
      if (V.d <= 0) return { err: T('O diâmetro do furo tem que ser maior que zero.') };
      e = { t: 'holes', mode: vals.mode, d: V.d, x: ox + V.x, y: oy + V.y };
      if (vals.mode === 'pcd') { if (V.pcd <= 0 || V.n < 1 || V.n % 1) return { err: T('Confira o diâmetro do PCD e a quantidade (número inteiro).') }; e.pcd = V.pcd; e.n = V.n; e.a0 = V.a0; }
      else if (vals.mode === 'linha') { if (V.n < 1 || V.n % 1) return { err: T('A quantidade tem que ser um número inteiro.') }; e.n = V.n; e.dist = V.dist; e.ang = V.ang; }
      else if (vals.mode === 'grade') { if (V.nx < 1 || V.ny < 1 || V.nx % 1 || V.ny % 1) return { err: T('Colunas e linhas têm que ser números inteiros.') }; e.nx = V.nx; e.ny = V.ny; e.dx = V.dx; e.dy = V.dy; }
      if (holePts(e).length > 2000) return { err: T('Furos demais (máximo 2000).') };
    }
    return { e: e, V: V };
  }
  function valsFromEnt(e) {
    var o = doc.origin, v = { _t: e.t };
    if (e.t === 'circle') { v.x = e.x - o.x; v.y = e.y - o.y; v.d = e.d; }
    else if (e.t === 'rect') { v.forma = e.w === e.h ? 'quad' : 'ret'; v.ref = e.ref || 'canto'; v.x = e.x - o.x + (v.ref === 'centro' ? e.w / 2 : 0); v.y = e.y - o.y + (v.ref === 'centro' ? e.h / 2 : 0); v.w = e.w; v.h = e.h; v.r = e.r || 0; }
    else if (e.t === 'line') { v.modo = 'pts'; v.x1 = e.x1 - o.x; v.y1 = e.y1 - o.y; v.x2 = e.x2 - o.x; v.y2 = e.y2 - o.y; }
    else if (e.t === 'holes') { ['mode', 'd', 'pcd', 'n', 'a0', 'dist', 'ang', 'nx', 'ny', 'dx', 'dy'].forEach(function (k) { if (e[k] != null) v[k] = e[k]; }); v.x = e.x - o.x; v.y = e.y - o.y; }
    Object.keys(v).forEach(function (k) { if (typeof v[k] === 'number') v[k] = fmt(v[k]); });
    return v;
  }
  var ghost = null;
  function preview() {
    ghost = null;
    var t = editing ? editing.t : tool;
    if (t && t !== 'select' && t !== 'origin') { var r = entFromVals(t); if (r.e) ghost = r.e; }
    draw();
  }
  function apply() {
    readPanel();
    var t = editing ? editing.t : tool;
    if (t === 'origin') {
      var dx = num(vals.dx), dy = num(vals.dy);
      if (isNaN(dx) || isNaN(dy)) return toast(T('Confira os valores.'));
      if (!dx && !dy) return toast(T('Toque num ponto do desenho ou digite quanto mover.'));
      pushUndo(); doc.origin = { x: doc.origin.x + dx, y: doc.origin.y + dy }; save(); setField('dx', 0); setField('dy', 0); toast(T('Origem movida.')); draw(); return;
    }
    var r = entFromVals(t); if (r.err) return toast(r.err);
    pushUndo();
    if (editing) {
      r.e.id = editing.id; var i = doc.ents.indexOf(editing); doc.ents[i] = r.e; editing = r.e; sel = r.e; save(); toast(T('Alterado.')); preview(); return;
    }
    r.e.id = uid(); doc.ents.push(r.e); save();
    toast(t === 'holes' ? holePts(r.e).length + ' ' + T('furo(s) adicionado(s).') : T('Adicionado.'));
    if (t === 'line') {   // continua da ponta
      var o = doc.origin; vals.modo = vals.modo || 'pts';
      setField('x1', r.e.x2 - o.x); setField('y1', r.e.y2 - o.y); linePick = 1;
    }
    preview();
  }
  function selectEnt(e) {
    tool = 'select'; el.host.querySelectorAll('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === 'select'); });
    sel = e; editing = e; vals = valsFromEnt(e); renderPanel(); preview();
  }
  function delSel() { if (!editing) return; pushUndo(); doc.ents.splice(doc.ents.indexOf(editing), 1); save(); toast(T('Apagado.')); editing = null; sel = null; ghost = null; closePanel(); }
  function dupSel() {
    if (!editing) return; pushUndo(); var c = clone(editing); c.id = uid(); var dd = 10 / view.s * 2;
    if (c.t === 'line') { c.x1 += dd; c.x2 += dd; c.y1 -= dd; c.y2 -= dd; } else { c.x += dd; c.y -= dd; }
    doc.ents.push(c); save(); toast(T('Duplicado. Mude a posição e toque em Salvar.')); selectEnt(c);
  }

  /* ---------- toque na tela ---------- */
  function findSnap(sx, sy) {
    var best = null, bd = 16;
    function chk(x, y, nm) { var s = toS(x, y), d = Math.hypot(s[0] - sx, s[1] - sy); if (d < bd) { bd = d; best = { x: x, y: y, nm: nm }; } }
    chk(doc.origin.x, doc.origin.y, 'origem');
    doc.ents.forEach(function (e) { if (editing && e === editing) return; snapPts(e).forEach(function (p) { chk(p[0], p[1], p[2]); }); });
    return best;
  }
  function gridStep() { var raw = 12 / view.s, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function pickPoint(sx, sy) {
    var s = findSnap(sx, sy); if (s) return s;
    var w = toW(sx, sy), g = gridStep() / 2 >= 0.1 ? gridStep() / 2 : 0.1, o = doc.origin;
    // arredonda em relação à origem
    return { x: o.x + Math.round((w[0] - o.x) / g) * g, y: o.y + Math.round((w[1] - o.y) / g) * g, nm: null };
  }
  function hitEnt(sx, sy) {
    var w = toW(sx, sy), tol = 12 / view.s, best = null, bd = tol;
    for (var i = doc.ents.length - 1; i >= 0; i--) {
      var e = doc.ents[i];
      prims(e).forEach(function (p) { if (p.cl) return; var d = distPrim(p, w[0], w[1]); if (d < bd) { bd = d; best = e; } });
    }
    return best;
  }
  function onTap(sx, sy) {
    var t = editing ? 'select' : tool, p, o = doc.origin;
    if (t === 'select') { var e = hitEnt(sx, sy); if (e) selectEnt(e); else { sel = null; editing = null; closePanel(); } return; }
    p = pickPoint(sx, sy);
    if (t === 'origin') { pushUndo(); doc.origin = { x: p.x, y: p.y }; save(); toast(T('Origem posta') + (p.nm ? ' (' + T(p.nm) + ')' : '') + '.'); draw(); return; }
    if (t === 'line') {
      if (vals.modo === 'la' || linePick === 0) { setField('x1', p.x - o.x); setField('y1', p.y - o.y); linePick = vals.modo === 'la' ? 0 : 1; preview(); return; }
      setField('x2', p.x - o.x); setField('y2', p.y - o.y); apply(); return;
    }
    setField('x', p.x - o.x); setField('y', p.y - o.y);
    preview();
  }

  function bindPointer() {
    var cv = el.cv, P = {}, start = null, moved = false, pinch = null;
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId); P[e.pointerId] = [e.offsetX, e.offsetY];
      var ids = Object.keys(P);
      if (ids.length === 1) { start = { x: e.offsetX, y: e.offsetY, cx: view.cx, cy: view.cy }; moved = false; pinch = null; }
      else if (ids.length === 2) {
        var a = P[ids[0]], b = P[ids[1]];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s: view.s, w: toW((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
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
    var p = tool === 'select' && !editing ? null : pickPoint(sx, sy);
    snapHit = p && p.nm ? p : null;
    var w = p ? [p.x, p.y] : toW(sx, sy), r = rel(w[0], w[1]);
    hover = { x: w[0], y: w[1] };
    el.xy.textContent = 'X ' + fmt(r[0]) + '   Y ' + fmt(r[1]) + (snapHit ? '   · ' + T(snapHit.nm) : '');
    draw();
  }

  /* ---------- desenho ---------- */
  var COL = { bg: '#050b16', g1: 'rgba(120,170,255,.07)', g2: 'rgba(120,170,255,.16)', ax: 'rgba(255,90,90,.55)', ay: 'rgba(90,220,140,.55)',
    ent: '#e8f1ff', hole: '#66b8ff', cl: 'rgba(255,120,120,.75)', sel: '#ffb547', ghost: '#4aa0ff', snap: '#ffe14a' };
  var raf = 0;
  function draw() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); }); }
  function resize() {
    if (!el.cv) return; var st = el.cv.parentNode, r = st.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (W && H && !firstFit) { view.cx += (r.width - W) / 2 / view.s; view.cy += (H - r.height) / 2 / view.s; }   // mantém o canto de cima parado
    W = r.width; H = r.height;
    el.cv.width = Math.round(W * dpr); el.cv.height = Math.round(H * dpr); el.cv.style.width = W + 'px'; el.cv.style.height = H + 'px';
    if (firstFit) { firstFit = false; fit(); } else draw();
  }
  function fitTo(list) {
    var b = bounds(list);
    if (!isFinite(b.x0)) { view.cx = doc.origin.x; view.cy = doc.origin.y; view.s = Math.min(W, H) / 250 || 2; return; }
    var w = Math.max(b.x1 - b.x0, 1), h = Math.max(b.y1 - b.y0, 1);
    view.s = clampS(Math.min((W - 60) / w, (H - 60) / h)); view.cx = (b.x0 + b.x1) / 2; view.cy = (b.y0 + b.y1) / 2;
  }
  function fit(anim) { if (!doc) return; fitTo(doc.ents.length ? doc.ents : []); if (!doc.ents.length) { view.cx = doc.origin.x; view.cy = doc.origin.y; } draw(); }

  function paint() {
    if (!ctx || !W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    // grade (em relação à origem)
    var g = gridStep(), G = g * 10, o = doc.origin, tl = toW(0, 0), br = toW(W, H);
    [[g, COL.g1], [G, COL.g2]].forEach(function (L) {
      var st = L[0]; if (st * view.s < 5) return;
      ctx.strokeStyle = L[1]; ctx.lineWidth = 1; ctx.beginPath();
      for (var x = o.x + Math.ceil((tl[0] - o.x) / st) * st; x <= br[0]; x += st) { var sx = Math.round(toS(x, 0)[0]) + 0.5; ctx.moveTo(sx, 0); ctx.lineTo(sx, H); }
      for (var y = o.y + Math.ceil((br[1] - o.y) / st) * st; y <= tl[1]; y += st) { var sy = Math.round(toS(0, y)[1]) + 0.5; ctx.moveTo(0, sy); ctx.lineTo(W, sy); }
      ctx.stroke();
    });
    // eixos da origem
    var os = toS(o.x, o.y);
    ctx.lineWidth = 1; ctx.strokeStyle = COL.ax; ctx.beginPath(); ctx.moveTo(0, os[1]); ctx.lineTo(W, os[1]); ctx.stroke();
    ctx.strokeStyle = COL.ay; ctx.beginPath(); ctx.moveTo(os[0], 0); ctx.lineTo(os[0], H); ctx.stroke();
    // elementos
    doc.ents.forEach(function (e) { if (e === editing && ghost) return; drawEnt(e, e === sel ? COL.sel : null); });
    if (ghost) { if (!editing) ctx.setLineDash([6, 4]); drawEnt(ghost, editing ? COL.sel : COL.ghost); ctx.setLineDash([]); }
    // ponto inicial da linha em andamento
    if (tool === 'line' && !editing && linePick === 1) { var p1 = toS(o.x + num(vals.x1), o.y + num(vals.y1)); ctx.fillStyle = COL.ghost; ctx.beginPath(); ctx.arc(p1[0], p1[1], 4, 0, 7); ctx.fill(); }
    // símbolo da origem
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(os[0], os[1], 7, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(os[0], os[1]); ctx.arc(os[0], os[1], 7, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(os[0], os[1]); ctx.arc(os[0], os[1], 7, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
    ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('X0 Y0', os[0] + 10, os[1] - 9);
    // snap
    if (snapHit) { var sp = toS(snapHit.x, snapHit.y); ctx.strokeStyle = COL.snap; ctx.lineWidth = 2; ctx.strokeRect(sp[0] - 6, sp[1] - 6, 12, 12); }
    else if (hover && tool !== 'select') { var hp = toS(hover.x, hover.y); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hp[0] - 8, hp[1]); ctx.lineTo(hp[0] + 8, hp[1]); ctx.moveTo(hp[0], hp[1] - 8); ctx.lineTo(hp[0], hp[1] + 8); ctx.stroke(); }
    if (!hover) el.xy.textContent = T('grade') + ' ' + fmt(gridStep()) + ' mm';
  }
  function drawEnt(e, col) {
    prims(e).forEach(function (p) {
      ctx.beginPath();
      if (p.cl) { ctx.save(); ctx.setLineDash([10, 3, 2, 3]); ctx.strokeStyle = col || COL.cl; ctx.lineWidth = 1; var c = toS(p.x, p.y); ctx.arc(c[0], c[1], p.r * view.s, 0, 7); ctx.stroke(); ctx.restore(); return; }
      ctx.strokeStyle = col || (p.hole ? COL.hole : COL.ent); ctx.lineWidth = col === COL.sel ? 2.4 : 1.6;
      if (p.k === 'l') { var a = toS(p.x1, p.y1), b = toS(p.x2, p.y2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      else if (p.k === 'c') { var cc = toS(p.x, p.y); ctx.arc(cc[0], cc[1], Math.max(p.r * view.s, 0.5), 0, 7); }
      else { var ca = toS(p.x, p.y); ctx.arc(ca[0], ca[1], p.r * view.s, -p.a0 * D2R, -p.a1 * D2R, true); }
      ctx.stroke();
      // cruz de centro
      if (p.k === 'c') {
        var q = toS(p.x, p.y), L = Math.min(Math.max(p.r * view.s + 4, 5), 14);
        ctx.save(); ctx.strokeStyle = col || COL.cl; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q[0] - L, q[1]); ctx.lineTo(q[0] + L, q[1]); ctx.moveTo(q[0], q[1] - L); ctx.lineTo(q[0], q[1] + L); ctx.stroke(); ctx.restore();
      }
    });
  }

  /* ---------- janelas: lista e arquivos ---------- */
  function openModal(title, html) { el.mt.textContent = title; el.mb.innerHTML = html; el.modal.classList.remove('hidden'); }
  function closeModal() { el.modal.classList.add('hidden'); }
  function openList() {
    var h = '';
    if (!doc.ents.length) h = '<p class="cad-hint">' + esc(T('Ainda não há nada no desenho.')) + '</p>';
    else {
      h += '<p class="cad-hint">' + esc(T('Medidas em relação à origem X0 Y0. Toque num item para editar.')) + '</p><div class="cad-list">';
      doc.ents.forEach(function (e) {
        h += '<button type="button" class="cad-li" data-a="lsel" data-id="' + e.id + '"><b>' + esc(describe(e)) + '</b>';
        if (e.t === 'holes') {
          var pts = holePts(e);
          h += '<table class="cad-tb notr"><tr><th>#</th><th>X</th><th>Y</th></tr>' + pts.slice(0, 400).map(function (q, i) { var r = rel(q[0], q[1]); return '<tr><td>' + (i + 1) + '</td><td>' + fmt(r[0]) + '</td><td>' + fmt(r[1]) + '</td></tr>'; }).join('') + '</table>';
          if (pts.length > 400) h += '<small>… ' + (pts.length - 400) + '</small>';
        }
        h += '</button>';
      });
      h += '</div>';
    }
    openModal(T('Lista de elementos'), h);
  }
  function openFiles() {
    var ids = Object.keys(store.docs).sort(function (a, b) { return store.docs[b].upd - store.docs[a].upd; });
    var h = '<div class="cad-pbtn"><button type="button" class="ui-btn primary" data-a="fnew">+ ' + esc(T('Novo desenho')) + '</button><button type="button" class="ui-btn" data-a="fren">' + esc(T('Renomear')) + '</button><button type="button" class="ui-btn danger" data-a="fdel">' + esc(T('Apagar')) + '</button></div><div class="cad-list">';
    ids.forEach(function (id) {
      var d = store.docs[id], dt = new Date(d.upd);
      h += '<button type="button" class="cad-li' + (id === store.cur ? ' on' : '') + '" data-a="fopen" data-id="' + id + '"><b class="notr">' + esc(d.name) + '</b><small>' + d.ents.length + ' ' + esc(T('elementos')) + ' · ' + dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</small></button>';
    });
    openModal(T('Meus desenhos'), h + '</div>');
  }
  var tt = 0;
  function toast(m) { if (!el.toast) return; el.toast.textContent = m; el.toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { el.toast.classList.remove('show'); }, 2200); }

  /* ---------- entrada ---------- */
  function show() {
    if (!built && !build()) return;
    if (!store) { store = loadAll(); doc = store.docs[store.cur]; el.name.textContent = doc.name; updBtns(); el.host.querySelector('[data-tool=select]').classList.add('on'); }
    requestAnimationFrame(resize);
  }
  // API para o agente (etapa 3) e testes
  root.Cad = {
    show: show,
    get doc() { return doc; },
    add: function (e) { pushUndo(); e.id = uid(); doc.ents.push(e); save(); draw(); return e; },
    prims: prims, holePts: holePts, describe: describe, num: num
  };
})(this);
