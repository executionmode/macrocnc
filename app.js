/* Macro CNC — interface (v2: biblioteca do operador) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var VER = (window.APP_CONFIG && window.APP_CONFIG.version) || '2.0.0';
  var PROGRAMS = window.PROGRAMS || [], RULES = window.RULES || [];
  var STATUS_TXT = { aprovado: 'Aprovado na máquina', revisado: 'Revisado, sem teste', 'nao-testado': 'Não testado', problema: 'Com problema', testado: 'Testado na máquina', novo: 'Novo, não testado' };

  /* ---------- armazenamento ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('mcnc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('mcnc.' + k, JSON.stringify(v)); return true; } catch (e) { toast('Não foi possível salvar neste aparelho.'); return false; } }
  };
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad4(n) { return ('0000' + Math.round(n)).slice(-4); }

  /* ---------- UI utilitária ---------- */
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  function confirmBox(text) {
    return new Promise(function (resolve) {
      $('#modalText').textContent = text; $('#modal').classList.remove('hidden');
      function done(v) { $('#modal').classList.add('hidden'); $('#modalYes').onclick = $('#modalNo').onclick = null; resolve(v); }
      $('#modalYes').onclick = function () { done(true); };
      $('#modalNo').onclick = function () { done(false); };
    });
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copiado.'); }
    catch (e) {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copiado.'); } catch (e2) { toast('Não foi possível copiar.'); }
      ta.remove();
    }
  }
  function progName(text, fallback) {
    var m = String(text).match(/^\s*O(\d{1,4})/m);
    return m ? 'O' + pad4(m[1]) : (fallback || 'programa');
  }
  var RT = { downloads: null };
  function rt(name) {
    try { if (window.claude && typeof window.claude.use === 'function') return window.claude.use(name); } catch (e) {}
    return Promise.resolve(null);
  }
  function download(filename, text) {
    if (RT.downloads) {
      RT.downloads.save({ filename: filename, data: text.replace(/\r?\n/g, '\r\n') }).then(function () { toast('Arquivo salvo.'); })
        .catch(function () { toast('Download cancelado ou bloqueado. Use Copiar.'); });
      return;
    }
    if (window.self !== window.top) { copyText(text); toast('Aqui não dá para baixar: o programa foi copiado. Cole onde quiser.'); return; }
    var blob = new Blob([text.replace(/\r?\n/g, '\r\n')], { type: 'text/plain' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  async function share(filename, text) {
    try {
      var file = new File([text.replace(/\r?\n/g, '\r\n')], filename, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
      if (navigator.share) { await navigator.share({ title: filename, text: text }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    download(filename, text);
  }

  /* ---------- navegação ---------- */
  var VIEWS = ['home', 'programas', 'exemplos', 'paramintro', 'treinamento', 'capitulo', 'prog', 'pedir', 'editor', 'meus', 'favoritos', 'perfil', 'config', 'sim', 'desenho'];
  var TAB_OF = { home: 'home', programas: 'home', exemplos: 'home', paramintro: 'home', treinamento: 'home', capitulo: 'home', prog: 'home', pedir: 'home', editor: 'home',
    meus: 'meus', favoritos: 'favoritos', perfil: 'perfil', config: 'perfil', sim: null, desenho: 'desenho' };
  var curView = 'home';
  function show(v, noHash) {
    if (v === 'regras') v = 'treinamento';
    if (VIEWS.indexOf(v) < 0) v = 'home';
    if (v === 'capitulo' && capIdx < 0) v = 'treinamento';
    if (v === 'prog' && !cur.p) v = 'programas';
    if (v === 'sim' && !(simView && simView.sim)) v = 'home';
    document.body.classList.toggle('simfull', v === 'sim');
    document.body.classList.toggle('cadmode', v === 'desenho');
    if (v !== 'sim' && simView) simView.stop();
    $$('.view').forEach(function (el) { el.classList.toggle('active', el.id === 'view-' + v); });
    var tab = TAB_OF[v];
    $$('.tabbar button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === tab); });
    if (!noHash && location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
    if (v !== 'prog' && v !== 'sim') lastListView = v;
    curView = v;
    if (v === 'programas') renderList();
    if (v === 'exemplos') renderExemplos();
    if (v === 'treinamento') renderTraining();
    if (v === 'meus') renderLib();
    if (v === 'favoritos') renderFavs();
    if (v === 'pedir') { checkChatSetup(); scrollChat(); }
    if (v === 'editor') updateGutter();
    if (v === 'desenho' && window.Cad) Cad.show();
    window.scrollTo(0, 0);
  }
  var lastListView = 'home';
  $$('.tabbar button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });
  $('#btnConfig').addEventListener('click', function () { show('config'); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (g) { if (g.dataset.cat) { cat = g.dataset.cat; store.set('cat', cat); } show(g.dataset.go); return; }
    var bk = e.target.closest('[data-back]');
    if (bk) show(bk.dataset.back);
  });
  window.addEventListener('hashchange', function () { show(location.hash.slice(1), true); });

  /* ---------- arte, ícones, abertura ---------- */
  function paintArt(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) { if (!el.dataset.done) { el.innerHTML = Art.icon(el.dataset.icon); el.dataset.done = 1; } });
    (root || document).querySelectorAll('[data-art]').forEach(function (el) { if (!el.dataset.done) { el.insertAdjacentHTML('afterbegin', Art.hero(el.dataset.art)); el.dataset.done = 1; } });
    (root || document).querySelectorAll('[data-logo]').forEach(function (el) { if (!el.dataset.done) { el.innerHTML = Art.logo(+el.dataset.logo || 200); el.dataset.done = 1; } });
  }
  paintArt();
  (function splash() {
    var sp = $('#splash'); if (!sp) return;
    var bar = sp.querySelector('.splash-bar div'), t0 = performance.now(), dur = 1300;
    (function tick(t) {
      var k = Math.min(1, ((t || performance.now()) - t0) / dur); bar.style.width = (k * 100).toFixed(0) + '%';
      if (k < 1) requestAnimationFrame(tick); else { sp.classList.add('out'); setTimeout(function () { sp.remove(); }, 450); }
    })();
  })();

  /* ---------- planilha (sheet) ---------- */
  function openSheet(title, html) {
    $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; paintArt($('#sheetBody'));
    $('#sheet').classList.remove('hidden');
  }
  function closeSheet() { $('#sheet').classList.add('hidden'); if (planCur && planCur.hl) { planCur.hl = null; requestAnimationFrame(draw3D); } }
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') closeSheet(); });

  /* ---------- favoritos ---------- */
  function favs() { return store.get('favs', []); }
  function isFav(k) { return favs().indexOf(k) >= 0; }
  function toggleFav(k) {
    var f = favs(), i = f.indexOf(k);
    if (i >= 0) f.splice(i, 1); else f.unshift(k);
    store.set('favs', f); toast(i >= 0 ? 'Tirado dos favoritos.' : 'Adicionado aos favoritos.');
    return i < 0;
  }

  /* ---------- desenho XY ---------- */
  function drawPlot(canvas, sim, upto, toolR, view) {
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || 800, H = Math.round(W * 5 / 8);
    canvas.width = W * dpr; canvas.height = H * dpr;
    var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0b1015'; c.fillRect(0, 0, W, H);
    var segs = sim.segs, holes = sim.holes;
    if (!segs.length && !holes.length) { c.fillStyle = '#94a3b3'; c.font = '14px system-ui'; c.fillText(T('Nada para desenhar.'), 16, 28); return; }
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    segs.forEach(function (s) { minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2); minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2); });
    holes.forEach(function (h) { minX = Math.min(minX, h.x); maxX = Math.max(maxX, h.x); minY = Math.min(minY, h.y); maxY = Math.max(maxY, h.y); });
    var spanX = Math.max(maxX - minX, 1), spanY = Math.max(maxY - minY, 1), pad = 26;
    var sc = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY), vz = (view && view.zoom) || 1;
    var ox = pad + ((W - 2 * pad) - spanX * sc) / 2 - minX * sc;
    var oy = H - pad - ((H - 2 * pad) - spanY * sc) / 2 + minY * sc;
    if (vz !== 1 || (view && (view.panX || view.panY))) {
      ox = W / 2 + (ox - W / 2) * vz + ((view && view.panX) || 0); oy = H / 2 + (oy - H / 2) * vz + ((view && view.panY) || 0); sc *= vz;
    }
    function X(x) { return ox + x * sc; } function Y(y) { return oy - y * sc; }
    c.strokeStyle = '#2c3a47'; c.lineWidth = 1; c.setLineDash([]);
    c.beginPath(); c.moveTo(X(minX) - 10, Y(0)); c.lineTo(X(maxX) + 10, Y(0)); c.moveTo(X(0), Y(minY) + 10); c.lineTo(X(0), Y(maxY) - 10); c.stroke();
    // cor por profundidade
    var zmin = sim.zMin == null ? 0 : sim.zMin, zmax = 0;
    function zcol(z) {
      var t = zmax - zmin > 1e-6 ? Math.min(1, Math.max(0, (zmax - z) / (zmax - zmin))) : 0;
      var r = Math.round(63 + t * (245 - 63)), g = Math.round(182 + t * (165 - 182)), b = Math.round(255 + t * (36 - 255));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    var n = upto == null ? segs.length : Math.min(upto, segs.length);
    var step = n > 60000 ? Math.ceil(n / 60000) : 1;
    for (var i = 0; i < n; i += 1) {
      var s = segs[i];
      if (s.t === 'h' || (s.x1 === s.x2 && s.y1 === s.y2)) continue;
      if (s.t === 'f' && step > 1 && i % step) continue;
      c.beginPath();
      if (s.t === 'r') { c.setLineDash([5, 5]); c.strokeStyle = '#5b6b7b'; c.lineWidth = 1; }
      else { c.setLineDash([]); c.strokeStyle = zcol(s.z || 0); c.lineWidth = 1.6; }
      c.moveTo(X(s.x1), Y(s.y1)); c.lineTo(X(s.x2), Y(s.y2)); c.stroke();
    }
    c.setLineDash([]);
    var holesShown = holes;
    if (upto != null) { holesShown = []; for (var q = 0; q < n; q++) if (segs[q].t === 'h') holesShown.push({ x: segs[q].x2, y: segs[q].y2 }); }
    holesShown.forEach(function (h, k) {
      c.strokeStyle = '#ff6b6b'; c.lineWidth = 2; c.beginPath(); c.arc(X(h.x), Y(h.y), 6, 0, 7); c.stroke();
      c.fillStyle = '#e6edf3'; c.font = '11px system-ui'; c.fillText(String(k + 1), X(h.x) + 8, Y(h.y) - 8);
    });
    c.fillStyle = '#f5a524'; c.beginPath(); c.arc(X(0), Y(0), 4, 0, 7); c.fill();
    c.font = '11px system-ui'; c.fillText('X0 Y0', X(0) + 6, Y(0) - 6);
    if (upto != null && n > 0) {
      var ls = segs[n - 1], rr = Math.max(4, (toolR || 5) * sc);
      c.fillStyle = 'rgba(245,165,36,0.35)'; c.strokeStyle = '#f5a524'; c.lineWidth = 2;
      c.beginPath(); c.arc(X(ls.x2), Y(ls.y2), rr, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#e6edf3'; c.fillText('Z' + (Math.round(ls.z * 100) / 100) + '  ' + T('linha {n}', { n: ls.ln }), 10, 16);
    }
    c.fillStyle = '#94a3b3'; c.fillText(T('azul = raso · laranja = fundo · tracejado = rápido'), 10, H - 8);
  }
  function fmtTime(t) { return t < 1 ? Math.round(t * 60) + ' s' : (Math.floor(t) + ' min ' + Math.round((t % 1) * 60) + ' s'); }
  function statsHtml(sim) {
    var h = '';
    if (sim.holes.length) h += '<span>Furos: <b>' + sim.holes.length + '</b></span>';
    if (sim.zMin != null) h += '<span>Z mais fundo: <b>' + (Math.round(sim.zMin * 1000) / 1000) + '</b></span>';
    h += '<span>Corte: <b>' + sim.feedDist.toFixed(0) + ' mm</b></span>';
    h += '<span>Tempo de corte: <b>' + fmtTime(sim.timeMin) + '</b></span>';
    h += '<span>Blocos executados: <b>' + sim.blocks + '</b></span>';
    if (sim.calls && sim.calls.length) {
      var u = sim.calls.filter(function (v, i, a) { return a.indexOf(v) === i; });
      h += '<span>Chamou: <b>' + u.map(function (n) { return 'O' + pad4(n); }).join(', ') + '</b></span>';
    }
    return h;
  }
  function simMsgsHtml(sim) {
    var h = '';
    if (sim.alarm) h += '<div class="issue"><span class="tag erro">alarme</span><span>A macro parou com #3000 = ' + esc(sim.alarm.n) + (sim.alarm.msg ? ' (' + esc(sim.alarm.msg) + ')' : '') + '. Confira as letras/valores.</span></div>';
    sim.errors.forEach(function (e) { h += '<div class="issue"><span class="tag erro">erro</span><span>' + esc(e) + '</span></div>'; });
    sim.warnings.forEach(function (e) { h += '<div class="issue"><span class="tag aviso">aviso</span><span>' + esc(e) + '</span></div>'; });
    if (!h && sim.finished) h = '<div class="issue"><span class="tag ok">ok</span><span>Rodou até o M30 sem erro na simulação. Isso não substitui o teste na máquina.</span></div>';
    return '<div class="msgs">' + h + '</div>';
  }
  function librarySub(num) {
    for (var i = 0; i < PROGRAMS.length; i++) {
      var subs = PROGRAMS[i].subs || [];
      for (var j = 0; j < subs.length; j++) if (subs[j].num === num) return subs[j];
    }
    return null;
  }
  function runSim(text) {
    var sim = MacroSim.run(text), added = [], guard = 0, m;
    while (guard++ < 6 && sim.errors.length && (m = sim.errors[0].match(/Subprograma O(\d+) não encontrado/))) {
      var sub = librarySub(+m[1]); if (!sub) break;
      text += '\n' + sub.code; added.push('O' + sub.num + (sub.label ? ' (' + sub.label.toLowerCase() + ')' : ''));
      sim = MacroSim.run(text);
    }
    if (added.length) sim.warnings.unshift('Para simular, usei o sub da biblioteca: ' + added.join(', ') + '.');
    sim.text = text;
    return sim;
  }
  function guessTool(text, p) {
    if (p && p.toolDia) return p.toolDia;
    var c = String(text).match(/\((?:FRESA|BROCA) D(\d+\.?\d*)\)/);
    if (c) return +c[1];
    var g = String(text).match(/G65\s*P\d+[^\n]*?\sT(\d*\.?\d+)/);
    if (g) return +g[1];
    var v = String(text).match(/#\d+\s*=\s*(\d*\.?\d+)\s*\((?:DIAMETRO DA FERRAMENTA|DIAMETRO DA FRESA)/);
    if (v) return +v[1];
    return 10;
  }

  /* Visualização da simulação: 3D com remoção de material + caminho XY */
  function SimView(el) {
    var self = this;
    el.innerHTML =
      '<div class="simmain">' +
      '<div class="simleft">' +
      '<div class="seg simtabs"><button type="button" data-v="3d" class="on">3D (relevo)</button><button type="button" data-v="xy">Caminho XY</button></div>' +
      '<div class="canvwrap"><canvas class="plot3d"></canvas><canvas class="plot hidden"></canvas></div>' +
      '<div class="progress"><div></div></div>' +
      '<div class="row wrap simbar">' +
      '<button type="button" class="btn primary" data-a="anim">▶ Animar</button>' +
      '<button type="button" class="btn" data-a="pause" disabled>⏸ Pausar</button>' +
      '<button type="button" class="btn" data-a="stopsim">⏹ Parar</button>' +
      '<button type="button" class="btn" data-a="rewind">⏮ Voltar ao início</button>' +
      '<button type="button" class="btn" data-a="step">⏯ Bloco a bloco</button>' +
      '<button type="button" class="btn" data-a="end">⏭ Fim</button>' +
      '<label class="field speed"><span>Velocidade</span><select class="input" data-k="speed">' +
      '<option value="0.25">0,25x</option><option value="0.5">0,5x</option><option value="1" selected>1x</option><option value="2">2x</option><option value="4">4x</option><option value="10">10x</option><option value="30">30x</option></select></label>' +
      '</div>' +
      '<div class="row wrap simbar">' +
      '<button type="button" class="btn" data-a="zin">＋</button><button type="button" class="btn" data-a="zout">－</button><button type="button" class="btn" data-a="zreset">Enquadrar</button>' +
      '<button type="button" class="btn" data-a="top">Cima</button><button type="button" class="btn" data-a="iso">3D</button>' +
      '<button type="button" class="btn" data-a="detail">Mais detalhe</button>' +
      '<button type="button" class="btn" data-a="stockbtn">Bruto</button>' +
      '<button type="button" class="btn" data-a="msgbtn">Mensagens <span class="msgcount"></span></button>' +
      '</div>' +
      '</div>' +
      '<div class="simright">' +
      '<div class="abspanel"><div class="ph">ABSOLUTA</div>' +
      '<div class="axis"><b>X</b><span data-p="x">0.000</span></div><div class="axis"><b>Y</b><span data-p="y">0.000</span></div>' +
      '<div class="axis"><b>Z</b><span data-p="z">0.000</span></div><div class="axis"><b>A</b><span data-p="a">0.000</span></div>' +
      '<div class="g52 hint" data-p="g52"></div></div>' +
      '<div class="modpanel">' +
      '<div><small>PROGRAMA</small><b data-p="prog">—</b></div><div><small>LINHA</small><b data-p="ln">—</b></div>' +
      '<div><small>MODO</small><b data-p="g">—</b></div><div><small>AVANÇO F</small><b data-p="f">—</b></div>' +
      '<div><small>ROTAÇÃO S</small><b data-p="s">—</b></div><div><small>FERRAMENTA T</small><b data-p="t">—</b></div>' +
      '<div><small>TEMPO</small><b data-p="time">—</b></div><div><small>PROGRESSO</small><b data-p="pct">—</b></div>' +
      '</div>' +
      '<div class="listing"><div class="ph" data-p="lsthead">PROGRAMA</div><div class="lst"></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="simpanel stockpanel">' +
      '<h2>Bruto e ferramenta <span class="hint">(edite e toque em Aplicar bruto)</span></h2><div class="grid2">' +
      '<label class="field"><span>Diâmetro da fresa</span><input class="input" data-k="d" inputmode="decimal"></label>' +
      '<label class="field"><span>Tipo de fresa</span><select class="input" data-k="tshape"><option value="flat">Topo reto</option><option value="v90">Cônica 90°</option></select></label>' +
      '<label class="field" data-only-t="v90"><span>Ponta plana da fresa Ø (0 = viva)</span><input class="input" data-k="tip" inputmode="decimal"></label>' +
      '<label class="field"><span>Formato do bruto</span><select class="input" data-k="shape"><option value="rect">Retangular</option><option value="round">Redondo</option></select></label>' +
      '<label class="field" data-only="round"><span>Diâmetro do bruto</span><input class="input" data-k="sd" inputmode="decimal"></label>' +
      '<label class="field" data-only="rect"><span>Comprimento em X</span><input class="input" data-k="lx" inputmode="decimal"></label>' +
      '<label class="field" data-only="rect"><span>Largura em Y</span><input class="input" data-k="ly" inputmode="decimal"></label>' +
      '<label class="field"><span>Centro do bruto X</span><input class="input" data-k="cx" inputmode="decimal"></label>' +
      '<label class="field"><span>Centro do bruto Y</span><input class="input" data-k="cy" inputmode="decimal"></label>' +
      '<label class="field"><span>Topo do bruto Z</span><input class="input" data-k="top" inputmode="decimal"></label>' +
      '<label class="field"><span>Fundo do bruto Z</span><input class="input" data-k="bot" inputmode="decimal"></label>' +
      '<label class="field"><span>Furo pronto no centro Ø (0 = não)</span><input class="input" data-k="hd" inputmode="decimal"></label>' +
      '<label class="field"><span>Furo pronto até Z</span><input class="input" data-k="hz" inputmode="decimal"></label>' +
      '</div><div class="row wrap"><button type="button" class="btn primary" data-a="upd">Aplicar bruto</button><button type="button" class="btn" data-a="auto">Bruto automático</button></div>' +
      '<p class="hint stockmode"></p></div>' +
      '<div class="simpanel msgpanel hidden"><h2>Mensagens da simulação</h2><div class="stats"></div><div class="simmsgs"></div></div>';
    this.P = {};
    el.querySelectorAll('[data-p]').forEach(function (n) { self.P[n.dataset.p] = n; });
    this.lst = el.querySelector('.lst');
    this.el = el; this.c3 = el.querySelector('.plot3d'); this.cxy = el.querySelector('.plot');
    this.bar = el.querySelector('.progress > div'); this.stats = el.querySelector('.stats'); this.msgs = el.querySelector('.simmsgs');
    this.f = {};
    el.querySelectorAll('[data-k]').forEach(function (i) { self.f[i.dataset.k] = i; });
    this.view = { az: -35, el: 38, zoom: 1, panX: 0, panY: 0 }; this.mode = '3d'; this.anim = 0; this.manual = null; this.hiRes = false;
    el.querySelectorAll('.simtabs button').forEach(function (b) {
      b.addEventListener('click', function () { self.setMode(b.dataset.v); });
    });
    this.f.tshape.addEventListener('change', function () {
      el.querySelectorAll('[data-only-t]').forEach(function (l) { l.classList.toggle('hidden', self.f.tshape.value !== 'v90'); });
    });
    this.f.shape.addEventListener('change', function () {
      self.showShapeFields();
      if (self.f.shape.value === 'round' && !(+self.f.sd.value > 0)) self.f.sd.value = Math.max(+self.f.lx.value || 0, +self.f.ly.value || 0) || 100;
      if (self.f.shape.value === 'rect' && !(+self.f.lx.value > 0)) { self.f.lx.value = self.f.sd.value || 100; self.f.ly.value = self.f.sd.value || 100; }
    });
    el.querySelector('[data-a=anim]').addEventListener('click', function () { self.animate(); });
    el.querySelector('[data-a=upd]').addEventListener('click', function () { self.manual = self.readStock(); self.saveStock(); self.rebuild(); toast('Bruto aplicado.'); });
    el.querySelector('[data-a=auto]').addEventListener('click', function () { self.manual = null; self.saveStock(); self.rebuild(true); });
    el.querySelector('[data-a=top]').addEventListener('click', function () { self.setMode('3d'); self.view.el = 89; self.view.az = 0; self.draw(); });
    el.querySelector('[data-a=iso]').addEventListener('click', function () { self.setMode('3d'); self.view.el = 38; self.view.az = -35; self.draw(); });
    // gestos: 1 dedo gira (3D) ou move (XY); 2 dedos = zoom e mover
    var pts = {}, g0 = null, raf = 0;
    function redraw() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (!self.anim || self.paused) self.draw(self.paused); }); }
    function gestureStart() {
      var ids = Object.keys(pts), v = self.view;
      if (ids.length === 1) { var p = pts[ids[0]]; g0 = { n: 1, x: p.x, y: p.y, az: v.az, el: v.el, px: v.panX, py: v.panY }; }
      else if (ids.length >= 2) {
        var a1 = pts[ids[0]], b1 = pts[ids[1]];
        g0 = { n: 2, d: Math.hypot(a1.x - b1.x, a1.y - b1.y) || 1, mx: (a1.x + b1.x) / 2, my: (a1.y + b1.y) / 2, z: v.zoom, px: v.panX, py: v.panY };
      }
    }
    [this.c3, this.cxy].forEach(function (cv) {
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', function (e) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} gestureStart(); });
      cv.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId] || !g0) return;
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pts), v = self.view;
        if (g0.n === 1 && ids.length === 1) {
          var dx = e.clientX - g0.x, dy = e.clientY - g0.y;
          if (cv === self.c3 && !self.panMode && !e.shiftKey) { v.az = g0.az + dx * 0.5; v.el = Math.max(10, Math.min(89, g0.el + dy * 0.3)); }
          else { v.panX = g0.px + dx; v.panY = g0.py + dy; }
        } else if (g0.n === 2 && ids.length >= 2) {
          var a1 = pts[ids[0]], b1 = pts[ids[1]], d = Math.hypot(a1.x - b1.x, a1.y - b1.y) || 1;
          var mx = (a1.x + b1.x) / 2, my = (a1.y + b1.y) / 2;
          v.zoom = Math.max(0.5, Math.min(40, g0.z * d / g0.d));
          v.panX = g0.px + (mx - g0.mx); v.panY = g0.py + (my - g0.my);
        }
        redraw();
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { cv.addEventListener(ev, function (e) { delete pts[e.pointerId]; gestureStart(); }); });
      cv.addEventListener('wheel', function (e) { e.preventDefault(); self.zoomBy(e.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
      cv.addEventListener('dblclick', function () { self.zoomBy(2); });
    });
    el.querySelector('[data-a=zin]').addEventListener('click', function () { self.zoomBy(1.6); });
    el.querySelector('[data-a=zout]').addEventListener('click', function () { self.zoomBy(1 / 1.6); });
    el.querySelector('[data-a=zreset]').addEventListener('click', function () { self.view.zoom = 1; self.view.panX = 0; self.view.panY = 0; self.draw(self.paused); });
    el.querySelector('[data-a=pause]').addEventListener('click', function () { self.togglePause(); });
    el.querySelector('[data-a=end]').addEventListener('click', function () { self.finish(); });
    el.querySelector('[data-a=detail]').addEventListener('click', function (e) {
      self.hiRes = !self.hiRes; e.target.textContent = self.hiRes ? 'Detalhe normal' : 'Mais detalhe';
      toast(self.hiRes ? 'Calculando com mais detalhe…' : 'Detalhe normal.');
      setTimeout(function () { self.rebuild(false); }, 30);
    });
    this.f.speed.addEventListener('change', function () { self.speed = parseFloat(self.f.speed.value) || 1; });
    this.speed = 1;
    el.querySelector('[data-a=step]').addEventListener('click', function () { self.step(); });
    el.querySelector('[data-a=stopsim]').addEventListener('click', function () { self.halt(); });
    el.querySelector('[data-a=rewind]').addEventListener('click', function () { self.rewind(); });
    el.querySelector('[data-a=stockbtn]').addEventListener('click', function () { el.querySelector('.stockpanel').classList.toggle('hidden'); el.querySelector('.msgpanel').classList.add('hidden'); });
    el.querySelector('[data-a=msgbtn]').addEventListener('click', function () { el.querySelector('.msgpanel').classList.toggle('hidden'); el.querySelector('.stockpanel').classList.add('hidden'); });
  }
  function f3(v) { return (v == null || !isFinite(v)) ? '—' : (Math.round(v * 1000) / 1000).toFixed(3); }
  var GNAME = { 0: 'G00 rápido', 1: 'G01 linear', 2: 'G02 arco hor.', 3: 'G03 arco anti', 81: 'G81 furação', 83: 'G83 pica-pau', 73: 'G73 pica-pau', 84: 'G84 rosca' };
  SimView.prototype.renderListing = function () {
    var lines = String(this.sim.text || this.text).replace(/\r/g, '').split('\n');
    if (lines.length > 6000) lines = lines.slice(0, 6000);
    this.lst.innerHTML = lines.map(function (l, i) { return '<div class="ll" data-n="' + (i + 1) + '"><i>' + (i + 1) + '</i>' + esc(l || ' ') + '</div>'; }).join('');
    this.lines = lines; this.curLn = null;
    // nome de cada programa por linha
    this.progOfLine = []; var curName = '';
    for (var i = 0; i < lines.length; i++) { var m = lines[i].match(/^\s*(O\d{1,5}.*?)\s*;?\s*$/); if (m) curName = m[1]; this.progOfLine[i + 1] = curName; }
  };
  SimView.prototype.updatePanel = function (idx) {
    var segs = this.sim.segs, P = this.P;
    var s = segs[Math.max(0, Math.min(segs.length, idx) - 1)];
    if (!s) return;
    P.x.textContent = f3(s.x2 - (s.ox || 0)); P.y.textContent = f3(s.y2 - (s.oy || 0)); P.z.textContent = f3(s.z); P.a.textContent = f3(s.a || 0);
    P.g52.textContent = (s.ox || s.oy) ? 'G52 ativo: X' + f3(s.ox) + ' Y' + f3(s.oy) + ' (G54: X' + f3(s.x2) + ' Y' + f3(s.y2) + ')' : '';
    P.prog.textContent = 'O' + pad4(s.prog || 0); P.ln.textContent = s.ln;
    P.g.textContent = GNAME[s.g] || ('G' + s.g); P.f.textContent = s.f ? Math.round(s.f) : '—'; P.s.textContent = s.s ? Math.round(s.s) : '—'; P.t.textContent = s.tool ? 'T' + s.tool : '—';
    // tempo até aqui
    if (!this.tcum || this.tcum.length !== segs.length) {
      this.tcum = new Float32Array(segs.length); var acc = 0;
      for (var i = 0; i < segs.length; i++) { var q = segs[i]; if (q.t === 'f' && q.f > 0) acc += Math.sqrt(Math.pow(q.x2 - q.x1, 2) + Math.pow(q.y2 - q.y1, 2) + Math.pow(q.z - q.z1, 2)) / q.f; else if (q.t === 'h' && q.f > 0) acc += Math.abs(q.z1 - q.z) / q.f; this.tcum[i] = acc; }
    }
    P.time.textContent = fmtTime(this.tcum[Math.max(0, Math.min(segs.length, idx) - 1)] || 0);
    P.pct.textContent = Math.round(100 * Math.min(segs.length, idx) / Math.max(1, segs.length)) + '%';
    if (this.curLn !== s.ln) {
      var prev = this.lst.querySelector('.ll.cur'); if (prev) prev.classList.remove('cur');
      var el = this.lst.children[s.ln - 1];
      if (el) { el.classList.add('cur'); var box = this.lst; box.scrollTop = el.offsetTop - box.clientHeight / 3; }
      P.lsthead.textContent = this.progOfLine[s.ln] || 'PROGRAMA';
      this.curLn = s.ln;
    }
  };
  SimView.prototype.step = function () {
    if (!this.sim) return;
    var segs = this.sim.segs, total = segs.length;
    if (!this.animRunning) {
      // começa do início, parado
      this.stop(); this.total = total; this.acc = 0;
      if (this.mode === 'xy') this.xyIdx = 0; else { this.st = Stock3D.build(this.sim, this.opts()); this.xyIdx = null; }
      this.animRunning = true;
      var pb = this.el.querySelector('[data-a=pause]'); pb.disabled = false;
    }
    this.paused = true; this.stop();
    this.el.querySelector('[data-a=pause]').textContent = '▶ Continuar';
    var idx = this.mode === 'xy' ? (this.xyIdx || 0) : this.st.idx;
    if (idx >= total) { this.endAnim(); return; }
    var ln = segs[idx].ln, n = 0;
    while (idx + n < total && segs[idx + n].ln === ln) n++;
    if (this.mode === 'xy') { this.xyIdx = idx + n; drawPlot(this.cxy, this.sim, this.xyIdx, this.st ? this.st.r : 5, this.view); idx = this.xyIdx; }
    else { Stock3D.advance(this.st, n); Stock3D.render(this.c3, this.st, this.view, true); idx = this.st.idx; }
    this.bar.style.width = (100 * idx / Math.max(1, total)).toFixed(1) + '%';
    this.updatePanel(idx);
  };
  SimView.prototype.zoomBy = function (k) {
    var v = this.view, nz = Math.max(0.5, Math.min(40, v.zoom * k)), r = nz / v.zoom;
    v.panX *= r; v.panY *= r; v.zoom = nz;
    this.draw(this.paused);
  };
  SimView.prototype.togglePause = function () {
    if (!this.animRunning) return;
    this.paused = !this.paused;
    this.el.querySelector('[data-a=pause]').textContent = this.paused ? '▶ Continuar' : '⏸ Pausar';
    if (!this.paused) this.loop();
  };
  // ⏹ para onde está (Animar começa de novo do início)
  SimView.prototype.halt = function () {
    if (!this.sim) return;
    this.stop(); this.animRunning = false; this.paused = false;
    var pb = this.el.querySelector('[data-a=pause]'); pb.disabled = true; pb.textContent = '⏸ Pausar';
    this.draw(true);
    toast('Simulação parada.');
  };
  // ⏮ volta para o bruto, no começo do programa
  SimView.prototype.rewind = function () {
    if (!this.sim) return;
    this.stop(); this.animRunning = false; this.paused = false;
    var pb = this.el.querySelector('[data-a=pause]'); pb.disabled = true; pb.textContent = '⏸ Pausar';
    this.st = Stock3D.build(this.sim, this.opts());
    var s0 = this.sim.segs[0]; if (s0) this.st.tool = { x: s0.x2, y: s0.y2, z: s0.z };
    this.xyIdx = 0;
    this.bar.style.width = '0%';
    this.draw(true); this.updatePanel(0);
  };
  SimView.prototype.finish = function () {
    if (!this.sim) return;
    this.stop();
    Stock3D.advance(this.st);
    this.endAnim();
  };
  SimView.prototype.endAnim = function () {
    this.animRunning = false; this.paused = false; this.xyIdx = null;
    if (this.st && this.st.idx < this.sim.segs.length) Stock3D.advance(this.st);
    var pb = this.el.querySelector('[data-a=pause]'); pb.disabled = true; pb.textContent = '⏸ Pausar';
    this.bar.style.width = '100%';
    this.info(); this.draw();
    this.updatePanel(this.sim.segs.length);
  };
  SimView.prototype.setMode = function (m) {
    var self = this;
    this.stop(); this.animRunning = false; this.paused = false;
    var pb0 = this.el.querySelector('[data-a=pause]'); if (pb0) { pb0.disabled = true; pb0.textContent = '⏸ Pausar'; }
    this.mode = m;
    this.el.querySelectorAll('.simtabs button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === m); });
    this.c3.classList.toggle('hidden', m !== '3d'); this.cxy.classList.toggle('hidden', m === '3d');
    // mantém o ponto da usinagem ao trocar de vista
    var total = this.sim.segs.length, idx;
    if (m === 'xy') { idx = this.st ? this.st.idx : 0; this.xyIdx = idx >= total ? null : idx; }
    else {
      idx = this.xyIdx == null ? total : this.xyIdx;
      if (this.st && this.st.idx > idx) { this.st = Stock3D.build(this.sim, this.opts()); }
      if (this.st) Stock3D.advance(this.st, idx - this.st.idx);
    }
    this.bar.style.width = (100 * idx / Math.max(1, total)).toFixed(1) + '%';
    self.draw(idx < total);
    this.updatePanel(idx);
  };
  SimView.prototype.showShapeFields = function () {
    var sh = this.f.shape.value;
    this.el.querySelectorAll('[data-only]').forEach(function (l) { l.classList.toggle('hidden', l.dataset.only !== sh); });
  };
  function numv(i) { var v = parseFloat(String(i.value).replace(',', '.')); return isFinite(v) ? v : NaN; }
  SimView.prototype.readStock = function () {
    var f = this.f;
    var o = { tshape: f.tshape.value, tip: numv(f.tip), shape: f.shape.value, d: numv(f.sd), lx: numv(f.lx), ly: numv(f.ly), cx: numv(f.cx), cy: numv(f.cy), top: numv(f.top), bottom: numv(f.bot), toolDia: numv(f.d), holeD: numv(f.hd), holeZ: numv(f.hz) };
    // mantém os degraus do bruto automático (ex.: dois sextavados) enquanto o formato continuar redondo
    if (this.autoStock && this.autoStock.layers && o.shape === 'round') {
      var k = o.d / (this.autoStock.d || o.d);
      o.layers = this.autoStock.layers.map(function (l, i, arr) { return { d: l.d * k, top: i === 0 ? o.top : l.top }; });
    }
    return o;
  };
  SimView.prototype.stockKey = function () { return 'stock2.' + (this.p ? this.p.id : progName(this.text, 'editor')); };
  SimView.prototype.saveStock = function () { store.set(this.stockKey(), this.manual); };
  SimView.prototype.load = function (text, p) {
    this.stop();
    this.text = text; this.p = p || null;
    this.manual = store.get(this.stockKey(), null);
    this.sim = runSim(text);
    this.tcum = null;
    this.renderListing();
    this.rebuild(true);
  };
  // bruto pelas medidas da macro (letras do G65) ou do paramétrico (variáveis #)
  function programStock(p, text) {
    if (!p || !p.stockExpr) return null;
    try {
      var L = {}, V = {}, G = { x: 0, y: 0 };
      var g = String(text).match(/^G65\s*P\d+(.*)$/m);
      if (g) { var re = /([A-Z])(-?\d*\.?\d+)/g, m; while ((m = re.exec(g[1]))) L[m[1]] = parseFloat(m[2]); }
      var lines = String(text).split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (/^T/.test(lines[i])) break;
        var mv = lines[i].match(/^#(\d+)\s*=\s*(-?\d*\.?\d+)\s*(\(|;|$)/); if (mv && V[+mv[1]] === undefined) V[+mv[1]] = parseFloat(mv[2]);
      }
      var g52 = String(text).match(/G52\s*X(-?[\d.]+)(?:\s*Y(-?[\d.]+))?/); if (g52) { G.x = parseFloat(g52[1]) || 0; G.y = parseFloat(g52[2]) || 0; }
      var CANTO = /ORIGEM X0 Y0 NO CANTO|ORIGIN X0 Y0 AT (THE )?CORNER|ORIGINE X0 Y0 AU COIN/.test(text);
      var o = (new Function('L', 'V', 'G', 'CANTO', 'return ' + p.stockExpr))(L, V, G, CANTO);
      ['d', 'lx', 'ly', 'cx', 'cy', 'top', 'bottom', 'tool'].forEach(function (k) { if (o[k] !== undefined && !isFinite(o[k])) delete o[k]; });
      if (o.shape === 'round' && !(o.d > 0)) return null;
      if (o.shape === 'rect' && !(o.lx > 0 && o.ly > 0)) return null;
      ['d', 'lx', 'ly', 'cx', 'cy', 'top', 'bottom', 'holeD', 'holeZ'].forEach(function (k) { if (isFinite(o[k])) o[k] = Math.round(o[k] * 100) / 100; });
      return o;
    } catch (e) { return null; }
  }
  // Z do topo do bruto pelo programa: letra W do G65 (padrão: W = Z inicial), variável # de "Z INICIAL",
  // ou o Z mais alto em que a fresa corta
  function programTop(text, sim) {
    var g = String(text).match(/^G65\s*P\d+[^\n]*?\sW(-?\d*\.?\d+)/m);
    if (g) return parseFloat(g[1]);
    var v = String(text).match(/^#\d+\s*=\s*(-?\d*\.?\d+)\s*\((?:Z INICIAL|Z DO TOPO|TOPO|Z DA FACE|Z DO INICIO)[^)]*\)/m);
    if (v) return parseFloat(v[1]);
    var hi = -Infinity;
    (sim && sim.segs || []).forEach(function (s) { if (s.t === 'f' && s.z < 50) hi = Math.max(hi, s.z); });
    if (isFinite(hi) && hi < -0.5) return Math.ceil(hi * 2) / 2;
    return 0;
  }
  function programToolShape(p, text) {
    var ts = null;
    if (p && p.toolShapeExpr) {
      try {
        var L = {}, g = String(text).match(/^G65\s*P\d+(.*)$/m);
        if (g) { var re = /([A-Z])(-?\d*\.?\d+)/g, m; while ((m = re.exec(g[1]))) L[m[1]] = parseFloat(m[2]); }
        ts = (new Function('L', 'return ' + p.toolShapeExpr))(L);
      } catch (e) { ts = null; }
    } else if (/FRESA 90|FRESA CONICA|CHANFRADOR/.test(text)) ts = { type: 'v', angle: 90, tipD: 0 };
    return ts;
  }
  SimView.prototype.opts = function () {
    var o0 = this.optsBase();
    var m = this.manual, ts;
    if (m && m.tshape) ts = m.tshape === 'v90' ? { type: 'v', angle: 90, tipD: isFinite(m.tip) ? m.tip : 0 } : null;
    else ts = programToolShape(this.p, this.text);
    o0.toolShape = ts;
    return o0;
  };
  // bruto escrito no cabeçalho pelo plano do desenho: (BRUTO CILINDRO D210. ALTURA 41. TOPO Z1. CENTRO X0 Y0)
  function commentStock(text) {
    var m = String(text).match(/\(BRUTO (CILINDRO D(-?[\d.]+)|BLOCO (-?[\d.]+) X (-?[\d.]+)) ALTURA (-?[\d.]+) TOPO Z(-?[\d.]+) CENTRO X(-?[\d.]+) Y(-?[\d.]+)\)/);
    if (!m) return null;
    var top = parseFloat(m[6]), o = { shape: m[2] ? 'round' : 'rect', top: top, bottom: top - parseFloat(m[5]), cx: parseFloat(m[7]), cy: parseFloat(m[8]) };
    if (m[2]) o.d = parseFloat(m[2]); else { o.lx = parseFloat(m[3]); o.ly = parseFloat(m[4]); }
    return o;
  }
  SimView.prototype.optsBase = function () {
    var p = this.p, m = this.manual, cs = m ? null : commentStock(this.text);
    if (cs) return { res: this.hiRes ? 480 : 220, toolDia: guessTool(this.text, p), top: cs.top, shape: cs.shape, stock: { shape: cs.shape, d: cs.d, lx: cs.lx, ly: cs.ly, cx: cs.cx, cy: cs.cy, bottom: cs.bottom } };
    this.autoStock = m ? this.autoStock : programStock(p, this.text);
    if (!m && this.autoStock) {
      var a = this.autoStock;
      return { res: this.hiRes ? 480 : 220, toolDia: a.tool > 0 ? a.tool : guessTool(this.text, p), top: isFinite(a.top) ? a.top : programTop(this.text, this.sim), shape: a.shape,
        stock: { shape: a.shape, d: a.d, lx: a.lx, ly: a.ly, cx: a.cx || 0, cy: a.cy || 0, bottom: a.bottom, layers: a.layers, holeD: a.holeD, holeZ: a.holeZ } };
    }
    var tool = m && m.toolDia > 0 ? m.toolDia : guessTool(this.text, p);
    var o = { res: this.hiRes ? 480 : 220, toolDia: tool, top: m && isFinite(m.top) ? m.top : ((p && p.top !== undefined) ? p.top : programTop(this.text, this.sim)), shape: m ? m.shape : ((p && p.stock) || 'rect') };
    if (m) o.stock = m;
    else {
      if (p && p.stockLayers && o.shape === 'round') o.layers = p.stockLayers;
      if (!p || p.stockMargin !== false) o.margin = !!(p ? p.stockMargin : true);
    }
    return o;
  };
  SimView.prototype.fillFields = function () {
    var s = this.st.stockInfo, f = this.f;
    f.d.value = Math.round(this.st.D * 1000) / 1000;
    var tsh = this.st.toolShape; f.tshape.value = tsh && tsh.type === 'v' ? 'v90' : 'flat'; f.tip.value = tsh ? (tsh.tipD || 0) : 0;
    this.el.querySelectorAll('[data-only-t]').forEach(function (l) { l.classList.toggle('hidden', f.tshape.value !== 'v90'); });
    f.shape.value = s.shape;
    f.sd.value = s.d || Math.max(s.lx, s.ly);
    f.lx.value = s.lx; f.ly.value = s.ly; f.cx.value = s.cx; f.cy.value = s.cy; f.top.value = s.top; f.bot.value = s.bottom;
    var hs = this.manual || this.autoStock || {};
    f.hd.value = hs.holeD > 0 ? hs.holeD : 0; f.hz.value = isFinite(hs.holeZ) ? hs.holeZ : s.bottom;
    this.showShapeFields();
    this.el.querySelector('.stockmode').textContent = this.manual ? 'Usando o bruto que você digitou (fica salvo para este programa).'
      : (this.autoStock ? 'Bruto calculado pelas medidas do programa (letras do G65 / variáveis #). Mude os valores e toque em Aplicar bruto.' : 'Bruto calculado pelo caminho da ferramenta. Mude os valores e toque em Aplicar bruto.');
  };
  SimView.prototype.rebuild = function (fill) {
    this.stop(); this.animRunning = false; this.paused = false;
    var pbr = this.el.querySelector('[data-a=pause]'); if (pbr) { pbr.disabled = true; pbr.textContent = '⏸ Pausar'; }
    var o = this.opts();
    // peça ainda bruta na tela; a usinagem só aparece em Animar / Bloco a bloco / Fim
    this.st = Stock3D.build(this.sim, o);
    var s0 = this.sim.segs[0]; if (s0) this.st.tool = { x: s0.x2, y: s0.y2, z: s0.z };
    this.xyIdx = 0;
    // passada completa escondida, só para as mensagens (colisões)
    this.stFull = Stock3D.build(this.sim, o); Stock3D.advance(this.stFull);
    this.bar.style.width = '0%';
    if (fill || !this.manual) this.fillFields();
    else this.el.querySelector('.stockmode').textContent = 'Usando o bruto que você digitou (fica salvo para este programa).';
    this.info();
    this.draw(true);
    this.updatePanel(0);
  };
  SimView.prototype.draw = function (showTool) {
    if (!this.sim) return;
    if (this.mode === '3d') Stock3D.render(this.c3, this.st, this.view, showTool);
    else if (this.xyIdx != null) drawPlot(this.cxy, this.sim, this.xyIdx, this.st ? this.st.r : 5, this.view);
    else drawPlot(this.cxy, this.sim, null, null, this.view);
  };
  SimView.prototype.info = function () {
    var sim = this.sim, st = this.stFull || this.st;
    this.stats.innerHTML = statsHtml(sim);
    var extra = '';
    if (st && st.collisions.length) {
      var lns = st.collisions.map(function (c) { return c.ln; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 6);
      extra = '<div class="issue"><span class="tag erro">colisão</span><span>Movimento rápido (G0) passando dentro do material na(s) linha(s) ' + lns.join(', ') + '. Confira a aproximação e o tamanho do bruto (ponto vermelho no 3D).</span></div>';
    }
    this.msgs.innerHTML = '<div class="msgs">' + extra + simMsgsHtml(sim).replace(/^<div class="msgs">|<\/div>$/g, '') + '</div>';
    var nerr = sim.errors.length + (sim.alarm ? 1 : 0) + (st && st.collisions.length ? 1 : 0);
    var mc = this.el.querySelector('.msgcount'); mc.textContent = nerr ? '(' + nerr + ' erro)' : (sim.warnings.length ? '(' + sim.warnings.length + ')' : '✓');
    mc.style.color = nerr ? 'var(--err)' : '';
    if (nerr) this.el.querySelector('.msgpanel').classList.remove('hidden');
  };
  SimView.prototype.stop = function () { if (this.anim) cancelAnimationFrame(this.anim); this.anim = 0; };
  SimView.prototype.animate = function () {
    if (!this.sim) return;
    this.stop();
    this.total = this.sim.segs.length; this.acc = 0;
    if (this.mode === 'xy') this.xyIdx = 0;
    else { this.st = Stock3D.build(this.sim, this.opts()); this.xyIdx = null; }
    this.animRunning = true; this.paused = false;
    var pb = this.el.querySelector('[data-a=pause]'); pb.disabled = false; pb.textContent = '⏸ Pausar';
    this.loop();
  };
  SimView.prototype.loop = function () {
    var self = this;
    // 1x = programa inteiro em uns 8 s; a velocidade multiplica
    (function frame() {
      if (self.paused || !self.animRunning) return;
      var per = Math.max(self.total / 480, 0.08) * (self.speed || 1);
      self.acc += per; var n = Math.floor(self.acc); self.acc -= n;
      var done, idx;
      if (self.mode === 'xy') {
        self.xyIdx = Math.min(self.total, (self.xyIdx || 0) + n); idx = self.xyIdx; done = idx >= self.total;
        drawPlot(self.cxy, self.sim, idx, self.st ? self.st.r : 5, self.view);
      } else {
        done = Stock3D.advance(self.st, n); idx = self.st.idx;
        Stock3D.render(self.c3, self.st, self.view, !done);
      }
      self.bar.style.width = (100 * idx / Math.max(1, self.total)).toFixed(1) + '%';
      self.updatePanel(idx);
      if (!done) self.anim = requestAnimationFrame(frame); else { self.anim = 0; self.endAnim(); }
    })();
  };
  SimView.prototype.resize = function () { this.draw(); };

  /* ---------- PROGRAMAS (lista) ---------- */
  var cat = store.get('cat', 'macro'); if (['macro', 'param', 'teste'].indexOf(cat) < 0) cat = 'macro';
  function nums(p) {
    var m = progName(p.main), s = (p.subs || []).map(function (x) { return 'O' + x.num; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    return m + (s.length ? ' + ' + s.join(' / ') : '');
  }
  var STATUS_DOT = { aprovado: 'ok', revisado: 'rev', 'nao-testado': 'warn', problema: 'err' };
  function thumbHtml(p) {
    var src = thumbs[p.id];
    return '<span class="thumb" data-thumb="' + p.id + '">' + (src ? '<img alt="" src="' + src + '">' : '<span class="thumb-ph" data-icon="sim"></span>') + '</span>';
  }
  function progCard(p, simple) {
    var sub = p.cat === 'macro' ? '(G65)' : '(Parametrizado)';
    return '<button type="button" class="prow" data-id="' + p.id + '">' + thumbHtml(p) +
      '<span class="prow-t"><b>' + esc(p.title) + '</b><small>' + (simple ? '' : sub + ' · ') + '<i class="dot ' + STATUS_DOT[p.status] + '"></i>' + STATUS_TXT[p.status] + '</small></span>' +
      '<span class="mi-chev" data-icon="chev"></span></button>';
  }
  function bindRows(root) {
    paintArt(root);
    root.querySelectorAll('.prow').forEach(function (b) { b.addEventListener('click', function () { openProg(b.dataset.id); }); });
    queueThumbs();
  }
  function renderList() {
    $$('#catSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.cat === cat); });
    var q = ($('#progSearch').value || '').trim().toLowerCase();
    var order = { aprovado: 0, revisado: 1, 'nao-testado': 2, problema: 3 };
    var list = PROGRAMS.filter(function (p) {
      if (cat === 'teste') { if (p.status === 'aprovado') return false; }
      else if (p.cat !== cat) return false;
      return !q || (p.title + ' ' + p.desc + ' ' + nums(p)).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return order[a.status] - order[b.status]; });
    $('#progList').innerHTML = list.length ? list.map(function (p) { return progCard(p); }).join('') : '<div class="empty">Nenhum programa encontrado.</div>';
    bindRows($('#progList'));
  }
  $$('#catSeg button').forEach(function (b) { b.addEventListener('click', function () { cat = b.dataset.cat; store.set('cat', cat); renderList(); }); });
  $('#btnProgSearch').addEventListener('click', function () { var i = $('#progSearch'); i.classList.toggle('hidden'); if (!i.classList.contains('hidden')) i.focus(); else { i.value = ''; renderList(); } });
  $('#progSearch').addEventListener('input', renderList);
  function renderExemplos() {
    var list = PROGRAMS.filter(function (p) { return p.status === 'aprovado'; });
    $('#exList').innerHTML = list.map(function (p) { return progCard(p, true); }).join('');
    bindRows($('#exList'));
  }
  function rulesHtml() {
    return RULES.map(function (r) {
      return '<div class="card rule"><h2>' + esc(r.t) + '</h2><ul>' + r.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
  }

  /* ---------- treinamento ---------- */
  var TR = window.TRAINING || { chapters: [], intro: '' };
  var capIdx = -1;
  // vídeo do capítulo: um link só, ou um por idioma { pt: ..., en: ..., 'fr-CA': ... } (sem o idioma, usa o português)
  function videoFor(v) { if (!v || typeof v === 'string') return v || ''; var l = (window.I18N && I18N.lang) || 'pt'; return v[l] || ''; }
  function trRead() { return store.get('tr.read', []) || []; }
  function trMark(i) { var r = trRead(); if (r.indexOf(i) < 0) { r.push(i); store.set('tr.read', r); } }
  function trSplit(t) { var m = /^(\d+)\.\s*(.*)$/.exec(t); return m ? { n: m[1], t: m[2] } : { n: '★', t: t }; }
  function renderTraining() {
    var read = trRead(), n = TR.chapters.length;
    $('#trBar').style.width = Math.round(100 * read.length / Math.max(1, n)) + '%';
    $('#trPct').textContent = read.length + ' de ' + n + ' lidos';
    var next = 0; while (next < n && read.indexOf(next) >= 0) next++;
    if (next >= n) next = 0;
    var bt = $('#trContinue');
    bt.textContent = read.length ? (read.length >= n ? 'Rever do início' : 'Continuar: ' + trSplit(TR.chapters[next].t).t) : 'Começar o treinamento';
    bt.onclick = function () { openCap(next); };
    $('#trIntro').innerHTML = read.length ? '' : TR.intro;
    var vids = (window.APP_CONFIG || {}).videos || {};
    function hasVid(i) { return !!videoFor(vids[trSplit(TR.chapters[i].t).n]); }
    function rng(a, b) { var r = []; for (var i = a; i < Math.min(b, n); i++) r.push(i); return r; }
    var tab = store.get('trTab') === 'vid' ? 'vid' : 'cap', withVid = rng(0, n).filter(hasVid);
    var h = '<div class="seg tr-tabs"><button type="button" data-trtab="cap" class="' + (tab === 'cap' ? 'on' : '') + '">' + esc(T('Capítulos')) + '</button><button type="button" data-trtab="vid" class="' + (tab === 'vid' ? 'on' : '') + '">▶ ' + esc(T('Vídeos')) + ' (' + (courseList().length || withVid.length) + ')</button></div>';
    if (tab === 'vid') {
      var crs = courseList();
      if (crs.length) {
        var cur = Math.min(store.get('crs.cur', 0) || 0, crs.length - 1), done = store.get('crs.done', []) || [], lastM = '';
        h += '<div class="tr-course"><div class="tr-course-h"><span data-icon="play"></span><b>' + esc(T('Curso em vídeo')) + '</b><small>' + done.filter(function (k) { return k < crs.length; }).length + ' / ' + crs.length + '</small></div>' +
          '<video id="crsVid" controls playsinline preload="metadata"></video><div class="tr-course-now" id="crsNow"></div><div class="tr-course-list">';
        crs.forEach(function (c, k) {
          if (c.m !== lastM) { lastM = c.m; h += '<div class="tr-group">' + esc(T(c.m)) + '</div>'; }
          h += '<button type="button" class="tr-item tr-crs' + (done.indexOf(k) >= 0 ? ' done' : '') + (k === cur ? ' on' : '') + '" data-crs="' + k + '"><span class="tr-num">' + (done.indexOf(k) >= 0 ? '✓' : (k + 1)) + '</span><span class="tr-t">' + esc(T(c.t)) + '</span></button>';
        });
        h += '</div></div><div class="tr-group">' + esc(T('Vídeos por capítulo')) + '</div>';
      }
      h += '<div class="tr-vids">' + (withVid.length ? withVid.map(function (i) {
        var sp = trSplit(TR.chapters[i].t), url = videoFor(vids[sp.n]);
        return '<div class="tr-vcard"><div class="tr-vcard-h"><span class="tr-num">' + esc(sp.n) + '</span><b>' + esc(sp.t) + '</b></div>' +
          (/\.mp4$/i.test(url) ? '<video src="' + esc(url) + '" poster="' + esc(url.replace(/\.mp4$/i, '.jpg')) + '" controls playsinline preload="none"></video>' : '<a class="tr-video" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(T('Assistir vídeo')) + '</a>') +
          '<button type="button" class="ui-btn ghost" data-cap="' + i + '">' + esc(T('Abrir o capítulo')) + '</button></div>';
      }).join('') : '<p class="hint">' + esc(T('Ainda não há vídeos neste idioma.')) + '</p>') + '</div>';
      $('#trList').innerHTML = h;
      bindTrList(); if (crs.length) bindCourse(crs, cur); return;
    }
    var groups = [['Comece aqui', rng(0, 1)], ['Base: a linguagem', rng(1, 7)], ['As macros, uma por uma', rng(7, 16)], ['Na máquina', rng(16, 18)], ['Pratique', rng(18, 21)], ['Consulta', rng(21, n)]];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      h += '<div class="tr-group">' + esc(T(g[0])) + '</div><div class="tr-list">';
      g[1].forEach(function (i) {
        var c = TR.chapters[i], sp = trSplit(c.t), done = read.indexOf(i) >= 0;
        h += '<button type="button" class="tr-item' + (done ? ' done' : '') + '" data-cap="' + i + '"><span class="tr-num">' + (done ? '✓' : esc(sp.n)) + '</span><span class="tr-t">' + esc(sp.t) +
          (videoFor(((window.APP_CONFIG || {}).videos || {})[sp.n]) ? '<small class="tr-hasvid">▶ com vídeo</small>' : '') + (c.sims && c.sims.length ? '<small>' + c.sims.length + ' programa' + (c.sims.length > 1 ? 's' : '') + ' para simular</small>' : '') + '</span><span class="mi-chev" data-icon="chev"></span></button>';
      });
      h += '</div>';
    });
    $('#trList').innerHTML = h;
    bindTrList();
  }
  // curso em vídeo: lista plana dos vídeos que existem no idioma atual
  function courseList() {
    var cfg = window.APP_CONFIG || {}, out = [];
    (cfg.course || []).forEach(function (m) { (m.items || []).forEach(function (it) {
      var url = it.v ? videoFor(it.v) : videoFor((cfg.videos || {})[it.cap]);
      if (url && /\.mp4$/i.test(url)) out.push({ m: m.m, t: it.t, url: url });
    }); });
    return out;
  }
  function bindCourse(crs, cur) {
    var v = $('#crsVid'); if (!v) return;
    function load(k, play) {
      cur = k; store.set('crs.cur', k);
      v.src = crs[k].url; v.poster = crs[k].url.replace(/\.mp4$/i, '.jpg');
      $('#crsNow').textContent = (k + 1) + ' / ' + crs.length + ' · ' + T(crs[k].t);
      $$('#trList [data-crs]').forEach(function (b) { b.classList.toggle('on', +b.dataset.crs === k); });
      if (play) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    }
    function mark(k) { var d = store.get('crs.done', []) || []; if (d.indexOf(k) < 0) { d.push(k); store.set('crs.done', d); }
      var b = $('#trList [data-crs="' + k + '"]'); if (b) { b.classList.add('done'); b.querySelector('.tr-num').textContent = '✓'; } }
    v.addEventListener('ended', function () { mark(cur); if (cur + 1 < crs.length) load(cur + 1, true); });
    $$('#trList [data-crs]').forEach(function (b) { b.addEventListener('click', function () { load(+b.dataset.crs, true); v.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
    load(cur, false);
  }
  function bindTrList() {
    $$('#trList [data-cap]').forEach(function (b) { b.addEventListener('click', function () { openCap(+b.dataset.cap); }); });
    $$('#trList [data-trtab]').forEach(function (b) { b.addEventListener('click', function () { store.set('trTab', b.dataset.trtab); renderTraining(); }); });
    paintArt($('#view-treinamento'));
  }
  function openCap(i) {
    var c = TR.chapters[i]; if (!c) return;
    capIdx = i;
    var sp = trSplit(c.t);
    $('#capTitle').textContent = sp.n === '★' ? 'Treinamento' : 'Capítulo ' + sp.n;
    $('#capH').textContent = sp.t;
    var h = '';
    if (c.resumo && c.resumo.length) h += '<div class="tr-key"><b>' + T('Ponto-chave') + '</b><ul>' + c.resumo.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
    var vids = (window.APP_CONFIG && window.APP_CONFIG.videos) || {}, vurl = videoFor(vids[sp.n]);
    if (vurl && /\.mp4$/i.test(vurl)) h += '<div class="tr-vid"><div class="tr-vid-h"><span data-icon="play"></span><b>' + T('Vídeo: passo a passo com animação') + '</b></div><video src="' + esc(vurl) + '" poster="' + esc(vurl.replace(/\.mp4$/i, '.jpg')) + '" controls playsinline preload="none"></video></div>';
    else if (vurl) h += '<a class="tr-video" href="' + esc(vurl) + '" target="_blank" rel="noopener"><span data-icon="play"></span><span><b>' + T('Assistir vídeo') + '</b><small>' + T('Explicação passo a passo, com animação') + '</small></span><span class="mi-chev" data-icon="chev"></span></a>';
    h += c.html || '';
    if (c.rules) h += rulesHtml();
    if (c.quiz) h += c.quiz.map(function (q, k) {
      return '<div class="quiz" data-a="' + q.a + '"><p><b>' + (k + 1) + '.</b> ' + esc(q.q) + '</p>' + q.o.map(function (o, j) { return '<button type="button" class="qopt" data-j="' + j + '">' + esc(o) + '</button>'; }).join('') + '<div class="qres"></div></div>';
    }).join('') + '<div class="qscore" id="qScore"></div>';
    if (c.sims && c.sims.length) {
      h += '<div class="tr-sims"><b>' + T('Pratique no app') + '</b><small>' + T('Abra, mude as letras e simule em 3D.') + '</small>';
      c.sims.forEach(function (id) {
        var p = PROGRAMS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
        h += '<button type="button" class="tr-sim" data-prog="' + esc(id) + '"><span data-icon="play"></span><span><b>' + esc(p.title) + '</b><small class="mono">' + esc(nums(p)) + '</small></span><span class="mi-chev" data-icon="chev"></span></button>';
      });
      h += '</div>';
    }
    $('#capBody').innerHTML = h;
    $$('#capBody [data-prog]').forEach(function (b) { b.addEventListener('click', function () { openProg(b.dataset.prog); }); });
    $$('#capBody .quiz').forEach(function (qz) {
      qz.querySelectorAll('.qopt').forEach(function (b) {
        b.addEventListener('click', function () {
          if (qz.dataset.done) return; qz.dataset.done = 1;
          var ok = +b.dataset.j === +qz.dataset.a;
          b.classList.add(ok ? 'ok' : 'bad');
          qz.querySelectorAll('.qopt')[+qz.dataset.a].classList.add('ok');
          qz.querySelector('.qres').textContent = ok ? T('Certo!') : T('Não foi dessa vez.');
          var all = $$('#capBody .quiz'), done = all.filter(function (x) { return x.dataset.done; });
          if (done.length === all.length) {
            var pts = all.filter(function (x) { return x.querySelector('.qopt.bad') === null; }).length;
            $('#qScore').textContent = T('Você acertou {a} de {b}.', { a: pts, b: all.length });
          }
        });
      });
    });
    $('#capPrev').disabled = i === 0;
    $('#capNext').textContent = i >= TR.chapters.length - 1 ? 'Concluir ✓' : 'Próximo ›';
    $('#capPrev').onclick = function () { trMark(capIdx); openCap(capIdx - 1); };
    $('#capNext').onclick = function () { trMark(capIdx); if (capIdx >= TR.chapters.length - 1) show('treinamento'); else openCap(capIdx + 1); };
    show('capitulo');
    paintArt($('#view-capitulo'));
  }

  /* miniaturas: a peça pronta desenhada pelo próprio simulador */
  var thumbs = {}, THUMB_V = 'thumb10.';
  // cone externo trocado pela versão nova (O1630 em passadas): limpa valores antigos guardados
  if (!store.get('mig.chf2', false)) { store.set('vals.m-chanfro-furo', null); store.set('stock2.m-chanfro-furo', null); store.set('mig.chf2', true); }
  if (!store.get('mig.cone3', false)) { store.set('vals.m-cone', null); store.set('stock2.m-cone', null); store.set('mig.cone3', true); }
  PROGRAMS.forEach(function (p) { var t = store.get(THUMB_V + p.id, null); if (t) thumbs[p.id] = t; });
  var thumbQueue = [], thumbBusy = false;
  function queueThumbs() {
    PROGRAMS.forEach(function (p) { if (!thumbs[p.id] && thumbQueue.indexOf(p.id) < 0) thumbQueue.push(p.id); });
    if (!thumbBusy) setTimeout(nextThumb, 120);
  }
  function nextThumb() {
    var id = thumbQueue.shift(); if (!id) { thumbBusy = false; return; }
    thumbBusy = true;
    try {
      var p = PROGRAMS.filter(function (x) { return x.id === id; })[0];
      var text = [p.main].concat((p.subs || []).filter(function (s, i) { return !p.subChoice || i === 0; }).map(function (s) { return s.code; })).join('\n');
      var sim = runSim(text);
      var fake = Object.create(SimView.prototype); fake.p = p; fake.text = text; fake.sim = sim; fake.manual = null; fake.hiRes = false;
      var o = SimView.prototype.opts.call(fake); o.res = 110;
      var st = Stock3D.build(sim, o); Stock3D.advance(st);
      var stage = $('#thumbStage'); stage.innerHTML = '<canvas style="width:200px"></canvas>';
      var cv = stage.firstChild;
      Stock3D.render(cv, st, { az: -35, el: 38, zoom: 1.08, panX: 0, panY: 0 }, false);
      // corta a legenda de baixo
      var out = document.createElement('canvas'); out.width = 200; out.height = 140;
      out.getContext('2d').drawImage(cv, 0, 0, cv.width, cv.height * 0.93, 0, 0, 200, 140);
      var url = out.toDataURL('image/jpeg', 0.82);
      thumbs[id] = url; store.set(THUMB_V + id, url);
      $$('[data-thumb="' + id + '"]').forEach(function (el) { el.innerHTML = '<img alt="" src="' + url + '">'; });
      stage.innerHTML = '';
    } catch (e) { /* sem miniatura */ }
    setTimeout(nextThumb, 60);
  }

  /* ---------- PROGRAMA (detalhe) ---------- */
  var cur = { p: null, sub: null, call: null, out: null };
  function g65Line(main) { var m = main.match(/^G65 P(\d+)(.*?)\s*;?\s*$/m); return m ? { p: +m[1], args: m[2].trim() } : null; }
  function parseArgs(s) { var out = [], re = /([A-Z])(-?\d*\.?\d*)/g, m; while ((m = re.exec(s))) out.push({ l: m[1], v: m[2] }); return out; }
  function letterLabels(sub) {
    var lines = sub.split('\n'), on = false, labels = [], seen = {};
    lines.forEach(function (l) {
      if (/^\((LETRAS DO G65|G65 P\d+ LETTERS|LETTRES DU G65)/.test(l)) { on = true; return; }
      if (!on) return;
      if (/^\((EXEMPLO|EXAMPLE|EXEMPLE|VARIAVEIS|VARIABLES)/.test(l)) { on = false; return; }
      var m = l.match(/^\(([A-Z](?: [A-Z])*) = (.*)\)\s*;?$/);
      if (m) m[1].split(' ').forEach(function (L) { if (!seen[L]) { seen[L] = 1; labels.push({ l: L, t: m[2] }); } });
    });
    return labels;
  }
  function headerFields(main) {
    var f = {};
    var o = main.match(/^O(\d{4})/m); if (o) f.O = o[1];
    var t = main.match(/^T(\d+)\s*;?\s*$/m); if (t) f.T = t[1];
    var s = main.match(/^S(\d+) M3/m); if (s) f.S = s[1];
    var g = main.match(/^G(5[4-9])\s*;?\s*$/m); if (g) f.G = g[1];
    return f;
  }
  function paramVars(main) {
    var lines = main.split('\n'), vars = [];
    for (var i = 0; i < lines.length; i++) {
      if (/^T/.test(lines[i])) break;
      var m = lines[i].match(/^#(\d+) = (-?[\d.]+)\s*(\(([^)]*)\))?\s*;?\s*$/);
      if (m) vars.push({ n: +m[1], v: m[2], c: m[4] || '' });
      else { var m2 = lines[i].match(/^#(\d+) = (.+?)\s*(\(([^)]*)\))?\s*;?\s*$/); if (m2) vars.push({ n: +m2[1], expr: m2[2], c: m2[4] || '' }); }
    }
    return vars;
  }
  // subprogramas da macro: sempre visíveis na página do programa
  function renderSubs(p) {
    var box = $('#progSubs');
    if (!p.subs || !p.subs.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="card"><h2>Subprogramas desta macro</h2><p class="hint">O sub fica gravado na máquina uma vez só. Depois, cada peça usa só o programa principal com o G65.</p>' +
      p.subs.map(function (s, i) {
        var lines = s.code.split('\n').length;
        return '<details class="subbox"><summary><b>O' + s.num + '</b>' + (s.label ? ' · ' + esc(s.label) : '') + ' <span class="hint">(' + lines + ' linhas)</span></summary>' +
          '<pre class="code">' + esc(s.code) + '</pre><div class="row wrap">' +
          '<button type="button" class="ui-btn primary" data-sa="dl" data-i="' + i + '"><span data-icon="download"></span> Baixar O' + s.num + '.txt</button>' +
          '<button type="button" class="ui-btn" data-sa="cp" data-i="' + i + '"><span data-icon="copy"></span> Copiar</button>' +
          '<button type="button" class="ui-btn" data-sa="ed" data-i="' + i + '"><span data-icon="edit"></span> Editor</button></div></details>';
      }).join('') + '</div>';
    paintArt(box);
    box.querySelectorAll('[data-sa]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = p.subs[+b.dataset.i];
        if (b.dataset.sa === 'dl') download('O' + s.num + '.txt', s.code);
        else if (b.dataset.sa === 'cp') copyText(s.code);
        else { setEditor(s.code, 'O' + s.num); show('editor'); }
      });
    });
  }
  function savedVals(id) { return store.get('vals.' + id, null); }

  function progVideoHtml(p) {
    var cfg = window.APP_CONFIG || {}, cap = (cfg.progVideos || {})[p.id], url = cap ? videoFor((cfg.videos || {})[cap]) : '';
    if (!url) return '';
    if (/\.mp4$/i.test(url)) return '<div class="tr-vid" style="margin-top:12px"><div class="tr-vid-h"><span data-icon="play"></span><b>' + T('Vídeo: passo a passo com animação') + '</b></div><video src="' + esc(url) + '" poster="' + esc(url.replace(/\.mp4$/i, '.jpg')) + '" controls playsinline preload="none"></video></div>';
    return '<a class="tr-video" href="' + esc(url) + '" target="_blank" rel="noopener"><span data-icon="play"></span><span><b>' + T('Assistir vídeo') + '</b></span></a>';
  }
  function openProg(id) {
    var p = PROGRAMS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    cur = { p: p, sub: p.subs ? p.subs[0].key : null, out: null };
    var sv = savedVals(id); if (sv && sv.sub) cur.sub = sv.sub;
    var head = '<div class="card"><div class="filehead"><h1 style="margin:0">' + esc(p.title) + '</h1><span class="badge ' + p.status + '">' + STATUS_TXT[p.status] + '</span></div>' +
      '<div class="nums mono" style="color:var(--accent2);font-size:13px;margin-top:4px">' + esc(nums(p)) + '</div><p class="hint">' + esc(p.desc) + '</p>' +
      (p.notes || []).map(function (n) { return '<div class="note">' + esc(n) + '</div>'; }).join('') + progVideoHtml(p) + '</div>';
    $('#progHead').innerHTML = head;
    $('#progOut').classList.add('hidden'); $('#progErr').innerHTML = '';
    renderProgForm(sv);
    renderSubs(p);
    progFrom = curView === 'prog' ? progFrom : curView;
    show('prog'); paintFavProg(); paintArt($('#view-prog'));
  }
  function fieldHtml(name, label, value, extra) {
    return '<label class="field' + (extra || '') + '"><span>' + label + '</span><input class="input" name="' + name + '" value="' + esc(value == null ? '' : value) + '" inputmode="decimal"></label>';
  }
  function renderProgForm(sv, overrideCall) {
    var p = cur.p, h = headerFields(p.main), html = '', presets = '';
    var vals = (sv && sv.vals) || {};
    function V(k, d) { return vals[k] !== undefined ? vals[k] : d; }
    html += '<div class="fgroup"><div class="gtitle">Programa</div><div class="grid2">' +
      fieldHtml('O', 'Número do programa (O)', V('O', h.O)) +
      (h.T ? fieldHtml('T', p.cat === 'macro' ? 'Ferramenta T e corretor H' : 'Ferramenta T', V('T', h.T)) : '') +
      (h.S ? fieldHtml('S', 'Rotação S (rpm)', V('S', h.S)) : '') +
      (h.G ? fieldHtml('G', 'Zero-peça G54–G59', V('G', h.G)) : '') + '</div></div>';
    if (p.cat === 'macro') {
      if (p.subChoice) {
        html += '<div class="fgroup"><div class="gtitle">Sub</div><div class="seg" id="subSeg">' + p.subs.map(function (s) {
          return '<button type="button" data-k="' + s.key + '" class="' + (s.key === cur.sub ? 'on' : '') + '">' + esc(s.label) + '</button>';
        }).join('') + '</div></div>';
      }
      var g = g65Line(p.main), callArgs = parseArgs(overrideCall || g.args);
      var subMain = p.subs.filter(function (s) { return s.num === g.p && (!p.subChoice || s.key === cur.sub); })[0] || p.subs[0];
      var labels = letterLabels(subMain.code), present = {};
      callArgs.forEach(function (a) { present[a.l] = a.v; });
      cur.example = present;
      callArgs.forEach(function (a) { if (!labels.some(function (x) { return x.l === a.l; })) labels.push({ l: a.l, t: '' }); });
      // ordem de saída = ordem da chamada aprovada; letras extras vão no fim
      cur.letters = callArgs.map(function (a) { return a.l; });
      labels.forEach(function (x) { if (cur.letters.indexOf(x.l) < 0) cur.letters.push(x.l); });
      if (p.presets) presets = '<div class="presets">' + p.presets.map(function (pr, i) { return '<button type="button" class="chip" data-pr="' + i + '">' + esc(pr.label) + '</button>'; }).join('') + '</div>';
      html += '<div class="fgroup"><div class="gtitle">Letras do G65 P' + g.p + ' (vazio = não envia)</div><div class="grid2">' + labels.map(function (x) {
        var v = overrideCall ? present[x.l] : V('L_' + x.l, present[x.l]);
        return fieldHtml('L_' + x.l, '<b>' + x.l + '</b>' + esc(x.t.toLowerCase()), v, ' letter');
      }).join('') + '</div></div>';
    } else {
      var vars = paramVars(p.main), edit = p.edit || [];
      var ed = vars.filter(function (v) { return v.v !== undefined && edit.indexOf(v.n) >= 0; });
      var ro = vars.filter(function (v) { return !(v.v !== undefined && edit.indexOf(v.n) >= 0); });
      html += '<div class="fgroup"><div class="gtitle">Variáveis que você altera</div><div class="grid2">' + ed.map(function (v) {
        var lab = (p.labels && p.labels[v.n]) || v.c.toLowerCase() || '';
        return fieldHtml('V_' + v.n, '<b>#' + v.n + '</b> ' + esc(lab), V('V_' + v.n, v.v), ' letter');
      }).join('') + '</div></div>';
      if (ro.length) html += '<details class="fgroup"><summary class="hint">Variáveis calculadas pelo programa (' + ro.length + ')</summary>' + ro.map(function (v) {
        var lab = (p.labels && p.labels[v.n]) || v.c.toLowerCase();
        return '<div class="field"><span>#' + v.n + ' ' + esc(lab) + '</span><div class="ro">#' + v.n + ' = ' + esc(v.expr || v.v) + '</div></div>';
      }).join('') + '</details>';
    }
    $('#progPresets').innerHTML = presets;
    $('#progForm').innerHTML = html;
    $$('#subSeg button').forEach(function (b) { b.addEventListener('click', function () { cur.sub = b.dataset.k; $$('#subSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
    $$('#progPresets .chip').forEach(function (b) { b.addEventListener('click', function () { var pr = cur.p.presets[+b.dataset.pr]; var keep = readForm(); renderProgForm({ vals: keep, sub: cur.sub }, pr.call.replace(/^G65 P\d+\s*/, '')); toast('Exemplo carregado: ' + pr.label); }); });
  }
  function readForm() { var o = {}; $$('#progForm input').forEach(function (i) { o[i.name] = i.value.trim().replace(',', '.'); }); return o; }
  function isNum(s) { return /^-?(\d+\.?\d*|\.\d+)$/.test(s); }

  function buildProg() {
    var p = cur.p, f = readForm(), errs = [];
    var main = p.main;
    if (f.O !== undefined) {
      if (!/^\d{1,4}$/.test(f.O) || +f.O < 1) errs.push('Número do programa: use de 1 a 9999.');
      else main = main.replace(/^O\d{4}/m, 'O' + pad4(f.O));
    }
    if (f.T !== undefined) {
      if (!/^\d{1,3}$/.test(f.T)) errs.push('Ferramenta: número inteiro.');
      else if (p.cat === 'macro') { main = main.replace(/^T\d+(\s*;?\s*)$/m, 'T' + f.T + '$1').replace(/G43 H\d+/, 'G43 H' + f.T); }
      else main = main.replace(/^T\d+(\s*;?\s*)$/m, 'T' + f.T + '$1').replace(/G43 H\d+/, 'G43 H' + f.T);
    }
    if (f.S !== undefined) { if (!/^\d{1,5}$/.test(f.S)) errs.push('Rotação: número inteiro.'); else main = main.replace(/^S\d+ M3/m, 'S' + f.S + ' M3'); }
    if (f.G !== undefined) { if (!/^5[4-9]$/.test(f.G)) errs.push('Zero-peça: 54 a 59.'); else main = main.replace(/^G5[4-9](\s*;?\s*)$/m, 'G' + f.G + '$1'); }
    var files = [];
    if (p.cat === 'macro') {
      var g = g65Line(p.main), args = [];
      cur.letters.forEach(function (L) {
        var v = f['L_' + L];
        if (v === undefined || v === '') return;
        if (!isNum(v)) { errs.push('Letra ' + L + ': valor inválido "' + v + '".'); return; }
        var ex = cur.example[L];
        if (ex !== undefined && ex.indexOf('.') >= 0 && v.indexOf('.') < 0) v += '.';
        if (v.indexOf('.') >= 0 && v.split('.').length > 2) errs.push('Letra ' + L + ': dois pontos decimais.');
        args.push(L + v);
      });
      main = main.replace(/^G65 P\d+.*$/m, 'G65 P' + g.p + ' ' + args.join(' ') + ' ;');
      files.push({ name: progName(main), title: 'Programa principal', text: main });
      var subs = p.subs.filter(function (s) { return !p.subChoice || s.key === cur.sub; });
      var needs = MacroSim.run(main + '\n' + subs.map(function (s) { return s.code; }).join('\n')).calls;
      subs.forEach(function (s) {
        if (s.num === g.p || needs.indexOf(s.num) >= 0) files.push({ name: 'O' + s.num, title: 'Sub O' + s.num + (s.label ? ' - ' + s.label.toLowerCase() : '') + ' (fica gravado na máquina)', text: s.code });
      });
    } else {
      var lines = main.split('\n'), done = {};
      for (var i = 0; i < lines.length; i++) {
        if (/^T/.test(lines[i])) break;
        var m = lines[i].match(/^#(\d+) = (-?[\d.]+)(.*)$/);
        if (m && f['V_' + m[1]] !== undefined && !done[m[1]]) {
          var nv = f['V_' + m[1]];
          if (!isNum(nv)) { errs.push('#' + m[1] + ': valor inválido "' + nv + '".'); continue; }
          lines[i] = '#' + m[1] + ' = ' + nv + m[3]; done[m[1]] = 1;
        }
      }
      main = lines.join('\n');
      files.push({ name: progName(main), title: 'Programa', text: main });
    }
    return { errs: errs, files: files, vals: f };
  }

  var simView = null, simFrom = 'programas';
  function openSim(text, p, name) {
    simFrom = VIEWS.filter(function (v) { return $('#view-' + v).classList.contains('active'); })[0] || 'programas';
    if (simFrom === 'sim') simFrom = 'programas';
    if (!simView) simView = new SimView($('#simScreen'));
    simView.sim = simView.sim || { segs: [] };
    $('#simName').textContent = name || progName(text);
    show('sim');
    requestAnimationFrame(function () { simView.load(text, p); });
  }
  $('#btnSimBack').addEventListener('click', function () { show(simFrom); });
  $('#btnOpenSim').addEventListener('click', function () { if (cur.simText) openSim(cur.simText, cur.p, cur.p.title); });
  window.addEventListener('resize', function () { if (simView && $('#view-sim').classList.contains('active') && !simView.anim) simView.draw(simView.paused); });
  $('#btnBack').addEventListener('click', function () { show(progFrom || 'programas'); });
  var progFrom = 'programas';
  function paintFavProg() { $('#btnFavProg').classList.toggle('faved', !!(cur.p && isFav('p:' + cur.p.id))); }
  $('#btnFavProg').addEventListener('click', function () { if (cur.p) { toggleFav('p:' + cur.p.id); paintFavProg(); } });
  $('#btnProgReset').addEventListener('click', function () { store.set('vals.' + cur.p.id, null); renderProgForm(null); $('#progOut').classList.add('hidden'); });
  $('#btnProgGen').addEventListener('click', function () {
    var r = buildProg();
    if (r.errs.length) { $('#progErr').innerHTML = '<div class="errors"><b>Corrija:</b><ul>' + r.errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>'; return; }
    $('#progErr').innerHTML = '';
    store.set('vals.' + cur.p.id, { vals: r.vals, sub: cur.sub });
    cur.out = r.files;
    $('#progOut').classList.remove('hidden');
    var all = r.files.map(function (f) { return f.text; }).join('\n');
    cur.simText = all;
    var quick = runSim(all);
    $('#progSimSum').innerHTML = '<div class="stats">' + statsHtml(quick) + '</div>' + simMsgsHtml(quick);
    $('#progFiles').innerHTML = r.files.map(function (f, i) {
      return '<div class="card"><div class="filehead"><h2 style="margin:0">' + esc(f.title) + '</h2><span class="mono" style="color:var(--accent2)">' + esc(f.name) + '.txt</span></div>' +
        '<pre class="code">' + esc(f.text) + '</pre><div class="row wrap">' +
        '<button type="button" class="btn primary" data-a="dl" data-i="' + i + '">Baixar</button>' +
        '<button type="button" class="btn" data-a="cp" data-i="' + i + '">Copiar</button>' +
        '<button type="button" class="btn" data-a="sh" data-i="' + i + '">Compartilhar</button>' +
        '<button type="button" class="btn" data-a="ed" data-i="' + i + '">Editor</button>' +
        '<button type="button" class="btn" data-a="sv" data-i="' + i + '">Salvar em Meus</button></div></div>';
    }).join('');
    $$('#progFiles button').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = cur.out[+b.dataset.i], a = b.dataset.a;
        if (a === 'dl') download(f.name + '.txt', f.text);
        else if (a === 'cp') copyText(f.text);
        else if (a === 'sh') share(f.name + '.txt', f.text);
        else if (a === 'ed') { setEditor(cur.out.map(function (x) { return x.text; }).join('\n'), cur.p.title); show('editor'); }
        else if (a === 'sv') saveProgram(cur.p.title + ' - ' + f.name, f.text, cur.p.status === 'aprovado' ? 'testado' : 'novo');
      });
    });
    // abre direto a tela de simulação (igual ao Editor); os arquivos ficam nesta página ao voltar
    openSim(all, cur.p, cur.p.title);
  });

  /* ---------- EDITOR ---------- */
  var ed = $('#edText'), edName = $('#edName');
  var draft = store.get('draft', { name: '', text: '' });
  ed.value = draft.text; edName.value = draft.name;
  var draftT;
  function saveDraft() { clearTimeout(draftT); draftT = setTimeout(function () { store.set('draft', { name: edName.value, text: ed.value }); }, 400); }
  ed.addEventListener('input', saveDraft); edName.addEventListener('input', saveDraft);
  function setEditor(text, name) {
    ed.value = text; if (name !== undefined) edName.value = name;
    updateGutter();
    store.set('draft', { name: edName.value, text: ed.value });
    $('#valCard').classList.add('hidden');
  }
  function gotoLine(n) {
    var lines = ed.value.split('\n'); var pos = 0;
    for (var i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1;
    ed.focus(); ed.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
    var lh = parseFloat(getComputedStyle(ed).lineHeight) || 20; ed.scrollTop = Math.max(0, (n - 4) * lh);
  }
  $('#btnValidate').addEventListener('click', function () {
    var issues = GCode.validate(ed.value);
    $('#valCard').classList.remove('hidden');
    var errs = issues.filter(function (i) { return i.level === 'erro'; }).length;
    var head = errs ? '<p><b style="color:var(--err)">' + errs + ' erro(s)</b> e ' + (issues.length - errs) + ' aviso(s).</p>'
      : (issues.length ? '<p>Nenhum erro, ' + issues.length + ' aviso(s).</p>' : '');
    $('#valOut').innerHTML = head + (issues.length ? issues.map(function (i) {
      return '<div class="issue"><span class="tag ' + i.level + '">' + i.level + '</span>' +
        (i.line ? '<span class="ln" data-ln="' + i.line + '">L' + i.line + '</span>' : '') + '<span>' + esc(i.msg) + '</span></div>';
    }).join('') : '<div class="issue"><span class="tag ok">ok</span><span>Nenhum problema nas verificações automáticas.</span></div>');
    $$('#valOut .ln').forEach(function (s) { s.addEventListener('click', function () { gotoLine(+s.dataset.ln); }); });
    $('#valCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#btnSimulate').addEventListener('click', function () {
    if (!ed.value.trim()) return toast('Editor vazio.');
    openSim(ed.value, libraryMatch(ed.value), edName.value || progName(ed.value));
  });
  function libraryMatch(text) {
    var o = progName(text);
    for (var i = 0; i < PROGRAMS.length; i++) if (progName(PROGRAMS[i].main) === o && PROGRAMS[i].main.split('\n')[1] === String(text).replace(/\r/g, '').split('\n')[1]) return PROGRAMS[i];
    return null;
  }
  $('#btnEdSave').addEventListener('click', function () { if (!ed.value.trim()) return toast('Editor vazio.'); saveProgram(edName.value || progName(ed.value), ed.value, 'novo'); });
  $('#btnEdCopy').addEventListener('click', function () { copyText(ed.value); });
  $('#btnEdDownload').addEventListener('click', function () { if (ed.value.trim()) download(progName(ed.value, edName.value || 'programa') + '.txt', ed.value); });
  $('#btnEdShare').addEventListener('click', function () { if (ed.value.trim()) share(progName(ed.value, 'programa') + '.txt', ed.value); });
  $('#btnEdOpen').addEventListener('click', function () { $('#edFile').click(); });
  $('#btnEdClear').addEventListener('click', async function () { if (!ed.value || await confirmBox('Limpar o editor?')) setEditor('', ''); });
  function openPaste() { $('#pasteText').value = ''; $('#pasteModal').classList.remove('hidden'); setTimeout(function () { $('#pasteText').focus(); }, 50); }
  $('#pasteNo').addEventListener('click', function () { $('#pasteModal').classList.add('hidden'); });
  $('#pasteYes').addEventListener('click', function () {
    var t = $('#pasteText').value; $('#pasteModal').classList.add('hidden');
    if (t.trim()) { setEditor(t.toUpperCase(), edName.value); toast('Programa colado.'); }
  });
  $('#btnEdPaste').addEventListener('click', async function () {
    try {
      var t = await navigator.clipboard.readText();
      if (t && t.trim()) { setEditor(t.toUpperCase(), edName.value); toast('Programa colado.'); return; }
    } catch (e) {}
    openPaste();
  });
  $('#edFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast('Arquivo grande demais (máx. 2 MB).'); return; }
    var rd = new FileReader();
    rd.onload = function () { setEditor(String(rd.result), f.name.replace(/\.[^.]+$/, '')); toast('Arquivo aberto.'); };
    rd.readAsText(f); e.target.value = '';
  });
  $('#btnEdAsk').addEventListener('click', function () {
    if (!ed.value.trim()) return toast('Editor vazio.');
    $('#chatCtx').checked = true;
    if (!$('#chatText').value.trim()) $('#chatText').value = 'Confira este programa no meu padrão: erros, riscos e o que mudar.';
    show('pedir'); $('#chatText').focus();
  });

  /* numeração das linhas do editor */
  var gut = $('#edGutter');
  function updateGutter() {
    var n = Math.max(1, ed.value.split('\n').length), s = '';
    for (var i = 1; i <= n; i++) s += i + '\n';
    gut.textContent = s; gut.scrollTop = ed.scrollTop;
  }
  ed.addEventListener('input', updateGutter);
  ed.addEventListener('scroll', function () { gut.scrollTop = ed.scrollTop; });
  updateGutter();
  function insertAtCursor(txt, caretBack) {
    var s = ed.selectionStart || 0, e = ed.selectionEnd || 0, v = ed.value;
    ed.value = v.slice(0, s) + txt + v.slice(e);
    var pos = s + txt.length - (caretBack || 0);
    ed.focus(); ed.setSelectionRange(pos, pos); saveDraft(); updateGutter();
  }
  $('#btnBrackets').addEventListener('click', function () {
    var s = ed.selectionStart, e = ed.selectionEnd;
    if (e > s) { var sel = ed.value.slice(s, e); insertAtCursor('[' + sel + ']'); }
    else insertAtCursor('[]', 1);
  });
  var FUNCS = [
    ['SIN[]', 'Seno (graus)'], ['COS[]', 'Cosseno (graus)'], ['TAN[]', 'Tangente (graus)'], ['ATAN[]/[]', 'Ângulo de a / b (0 a 360)'],
    ['SQRT[]', 'Raiz quadrada'], ['ABS[]', 'Valor absoluto'], ['ROUND[]', 'Arredonda'], ['FIX[]', 'Tira as casas (para baixo)'], ['FUP[]', 'Arredonda para cima'],
    ['IF [] GOTO ', 'Desvio se a condição for verdadeira'], ['IF [] THEN ', 'Executa uma conta se for verdadeira'], ['GOTO ', 'Vai para a sequência N'],
    ['WHILE [] DO1', 'Laço enquanto for verdadeira'], ['END1', 'Fim do laço DO1'],
    [' EQ ', 'Igual'], [' NE ', 'Diferente'], [' GT ', 'Maior que'], [' GE ', 'Maior ou igual'], [' LT ', 'Menor que'], [' LE ', 'Menor ou igual'],
    ['#3000 = 1 (MENSAGEM) ;', 'Alarme da macro com mensagem'], ['G65 P', 'Chama uma macro'], ['M99 ;', 'Fim do subprograma']
  ];
  $('#btnFuncs').addEventListener('click', function () {
    openSheet('Funções', '<p class="hint">Toque para inserir no cursor do editor.</p><div class="fn-grid">' + FUNCS.map(function (f, i) {
      return '<button type="button" class="fn" data-fn="' + i + '"><code>' + esc(f[0].trim()) + '</code><small>' + esc(f[1]) + '</small></button>';
    }).join('') + '</div>');
    $$('#sheetBody .fn').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = FUNCS[+b.dataset.fn][0], back = 0;
        var k = f.indexOf('[]'); if (k >= 0) back = f.length - k - 1;
        closeSheet(); insertAtCursor(f, back);
      });
    });
  });
  $('#btnCalc').addEventListener('click', function () {
    openSheet('Calculadora',
      '<p class="hint">Digite a conta como no comando: SIN[30] * 10, [100 - 16] / 2, SQRT[2]. Ângulos em graus.</p>' +
      '<input id="calcIn" class="ui-input mono" placeholder="[100 - 16] / 2" autocomplete="off" autocapitalize="characters">' +
      '<div class="calc-keys">' + ['[', ']', '+', '-', '*', '/', 'SIN[', 'COS[', 'TAN[', 'ATAN[', 'SQRT[', 'ABS['].map(function (k) { return '<button type="button" class="ck" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="calc-out" id="calcOut">=</div>' +
      '<div class="sheet-acts"><button type="button" class="ui-btn primary" id="calcIns">Inserir resultado no editor</button><button type="button" class="ui-btn" id="calcInsExpr">Inserir a conta</button></div>');
    var inp = $('#calcIn'), out = $('#calcOut'), val = null;
    function calc() {
      var t = inp.value.trim(); if (!t) { out.textContent = '='; val = null; return; }
      try { var v = MacroSim.evalExpr(t); val = Math.round(v * 10000) / 10000; out.textContent = '= ' + val; out.classList.remove('bad'); }
      catch (e) { val = null; out.textContent = 'conta incompleta'; out.classList.add('bad'); }
    }
    inp.addEventListener('input', calc);
    $$('#sheetBody .ck').forEach(function (b) { b.addEventListener('click', function () { inp.value += b.dataset.k; inp.focus(); calc(); }); });
    $('#calcIns').addEventListener('click', function () { if (val === null) return toast('Conta incompleta.'); closeSheet(); insertAtCursor(String(val).indexOf('.') < 0 ? val + '.' : String(val)); });
    $('#calcInsExpr').addEventListener('click', function () { if (!inp.value.trim()) return; closeSheet(); insertAtCursor(inp.value.trim().toUpperCase()); });
    setTimeout(function () { inp.focus(); }, 60);
  });

  /* ---------- PERFIL ---------- */
  var SHEETS = {
    sobre: ['Sobre o App', function () {
      return '<p><b>Macro CNC</b> é uma biblioteca de macros G65 e programas parametrizados para fresadoras FANUC, com simulação 3D e um assistente que monta programas no padrão do operador.</p>' +
        '<p class="hint">Versão ' + esc(VER) + '. Os programas da biblioteca marcados como <b>Aprovado na máquina</b> rodaram numa Romi D1250 V6. Os gerados pelo app ou pelo assistente são ponto de partida: confira, simule no comando e faça a primeira peça em Single Block com avanço reduzido.</p>' +
        '<p class="hint">Seus programas, favoritos e configurações ficam só neste aparelho.</p>';
    }],
    ajuda: ['Ajuda e Suporte', function () {
      return '<ul class="help">' +
        '<li><b>Programas:</b> escolha uma macro ou um parametrizado, mude as letras ou as variáveis e toque em <b>Gerar e simular</b>. Os arquivos .txt do principal e do sub ficam na página do programa.</li>' +
        '<li><b>Simulação:</b> abre com o bruto. <b>Animar</b>, <b>Bloco a bloco</b> e <b>Fim</b> mostram a usinagem. O bruto pode ser editado em <b>Bruto e ferramenta</b>.</li>' +
        '<li><b>Editor:</b> cole ou abra um programa. <b>Executar Programa</b> simula; <b>Conferir</b> procura erros. Para macro, deixe o principal e o sub no mesmo texto.</li>' +
        '<li><b>Pedir Programa:</b> descreva a peça, as medidas e a ferramenta. O assistente usa as regras e os programas aprovados.</li>' +
        '<li><b>Meus Programas:</b> toque num programa para simular, abrir, marcar como testado ou apagar. Testados viram exemplo para o assistente.</li>' +
        '<li><b>Enviar para a máquina:</b> pendrive FAT32 na USB do painel. Em EDIT: PROG, (OPRT), READ, número e EXEC.</li></ul>';
    }],
    idioma: ['Idioma', function () {
      var L = window.I18N || { lang: 'pt', langs: { pt: 'Português' } };
      return '<p class="hint">' + T('O app, o treinamento e os vídeos aparecem no idioma escolhido. Os programas G-code são iguais em qualquer idioma.') + '</p><div class="langs notr">' +
        Object.keys(L.langs).map(function (k) { var ok = !L.ready || L.ready[k]; return '<button type="button" class="ui-btn' + (k === L.lang ? ' primary' : '') + '"' + (ok ? ' data-lang="' + k + '"' : ' disabled') + '>' + esc(L.langs[k]) + (k === L.lang ? ' ✓' : '') + (ok ? '' : ' · ' + T('em breve')) + '</button>'; }).join('') + '</div>';
    }],
    avaliar: ['Avaliar o App', function () {
      return '<p>Obrigado por usar o Macro CNC! A avaliação na loja fica disponível quando o app for publicado na Play Store ou na App Store.</p><p class="hint">Enquanto isso, mande sugestões e problemas para quem te passou o app.</p>';
    }]
  };
  document.addEventListener('click', function (e) {
    var lg = e.target.closest('[data-lang]');
    if (lg && window.I18N) { if (lg.dataset.lang !== I18N.lang) I18N.setLang(lg.dataset.lang); else closeSheet(); return; }
    var s = e.target.closest('[data-sheet]'); if (!s) return;
    var d = SHEETS[s.dataset.sheet]; if (d) openSheet(d[0], d[1]());
  });
  if ($('#langName') && window.I18N) $('#langName').textContent = I18N.langs[I18N.lang];
  if (window.I18N) $$('.lang-code').forEach(function (b) { b.textContent = { pt: 'PT', en: 'EN', 'fr-CA': 'FR' }[I18N.lang] || 'PT'; });
  $('#btnShareApp').addEventListener('click', async function () {
    var url = location.href.split('#')[0];
    try { if (navigator.share) { await navigator.share({ title: 'Macro CNC', text: 'Macros e programas parametrizados FANUC com simulação 3D', url: url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    copyText(url); toast('Link do app copiado.');
  });

  /* ---------- MEUS PROGRAMAS ---------- */
  function getLib() { return store.get('lib', []); }
  function saveProgram(name, text, status) {
    var lib = getLib();
    var ex = lib.filter(function (p) { return p.name === name; })[0];
    if (ex) { ex.text = text; ex.updated = Date.now(); }
    else lib.unshift({ id: uid(), name: name, text: text, status: status || 'novo', created: Date.now(), updated: Date.now() });
    if (store.set('lib', lib)) toast(ex ? 'Atualizado em Meus programas.' : 'Salvo em Meus programas.');
  }
  var libTab = 'todos';
  function kb(t) { var n = new Blob([t]).size; return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }
  function when(ts) {
    var d = new Date(ts), now = new Date(), day = 864e5;
    var d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (ts >= d0) return 'Hoje'; if (ts >= d0 - day) return 'Ontem';
    return d.toLocaleDateString('pt-BR');
  }
  function libRow(p) {
    var fav = isFav('u:' + p.id), st = p.status === 'testado';
    return '<div class="frow' + (st ? ' tested' : '') + '" data-id="' + p.id + '"><span class="fico" data-icon="doc"></span>' +
      '<span class="frow-t"><b>' + esc(p.name) + '</b><small>' + (p.draw ? '📐 ' + esc(p.drawName || '') + ' • ' : '') + when(p.updated) + ' • ' + kb(p.text) + (st ? ' • testado' : '') + '</small></span>' +
      '<button type="button" class="fstar' + (fav ? ' on' : '') + '" data-star="' + p.id + '" aria-label="Favorito"><span data-icon="star"></span></button>' +
      '<span class="mi-chev" data-icon="chev"></span></div>';
  }
  function libActions(p) {
    var st = p.status === 'testado';
    openSheet(p.name,
      '<p class="hint">' + esc(progName(p.text, '—')) + ' · ' + p.text.split('\n').length + ' linhas · ' + kb(p.text) + (st ? ' · testado na máquina' : ' · novo, não testado') + '</p>' +
      '<div class="sheet-acts">' +
      '<button type="button" class="ui-btn primary" data-la="sim"><span data-icon="play"></span> Simular</button>' +
      '<button type="button" class="ui-btn" data-la="open"><span data-icon="edit"></span> Abrir no editor</button>' +
      '<button type="button" class="ui-btn" data-la="tog"><span data-icon="check"></span> ' + (st ? 'Desmarcar testado' : 'Marcar testado na máquina') + '</button>' +
      '<button type="button" class="ui-btn" data-la="dl"><span data-icon="download"></span> Baixar .txt</button>' +
      '<button type="button" class="ui-btn danger" data-la="del"><span data-icon="trash"></span> Apagar</button></div>');
    $$('#sheetBody [data-la]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var lib2 = getLib(), q = lib2.filter(function (x) { return x.id === p.id; })[0]; if (!q) return closeSheet();
        var a = b.dataset.la;
        if (a === 'open') { closeSheet(); setEditor(q.text, q.name); show('editor'); }
        else if (a === 'sim') { closeSheet(); setEditor(q.text, q.name); openSim(q.text, libraryMatch(q.text), q.name); }
        else if (a === 'tog') { q.status = q.status === 'testado' ? 'novo' : 'testado'; store.set('lib', lib2); closeSheet(); renderLib(); toast(q.status === 'testado' ? 'Marcado: o assistente vai usar como exemplo.' : 'Desmarcado.'); }
        else if (a === 'dl') download(progName(q.text, q.name) + '.txt', q.text);
        else if (a === 'del') { closeSheet(); if (await confirmBox('Apagar "' + q.name + '"?')) { store.set('lib', lib2.filter(function (x) { return x !== q; })); renderLib(); } }
      });
    });
  }
  function bindLibRows(root) {
    paintArt(root);
    root.querySelectorAll('.frow').forEach(function (r) {
      r.addEventListener('click', function (e) {
        if (e.target.closest('.fstar')) return;
        var p = getLib().filter(function (x) { return x.id === r.dataset.id; })[0]; if (p) libActions(p);
      });
    });
    root.querySelectorAll('.fstar').forEach(function (s) {
      s.addEventListener('click', function () { var on = toggleFav('u:' + s.dataset.star); s.classList.toggle('on', on); if (curView === 'favoritos') renderFavs(); });
    });
  }
  /* desenhos salvos dentro de Meus Programas */
  var libDrawId = null;   // filtro: só os programas de um desenho
  function drawRows(q) {
    if (!cadReady()) return '';
    var L = Cad.savedList().filter(function (d) { return !q || d.name.toLowerCase().indexOf(q) >= 0; }), lib = getLib();
    return L.map(function (d) {
      var n = lib.filter(function (p) { return p.draw === d.id; }).length, im = drawThumb(d.id, 96, 72);
      return '<div class="frow drw" data-draw="' + d.id + '">' + (im ? '<img class="dthumb" src="' + im + '" alt="">' : '<span class="fico" data-icon="draw"></span>') +
        '<span class="frow-t"><b class="notr">' + esc(d.name) + '</b><small>' + T('Desenho') + (d.folder ? ' • 📁 ' + esc(d.folder) : '') + ' • ' + when(d.savedAt) + (n ? ' • ' + n + ' ' + T('programas') : '') + '</small></span><span class="mi-chev" data-icon="chev"></span></div>';
    }).join('');
  }
  function drawActions(id) {
    var d = Cad.savedList().filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var n = getLib().filter(function (p) { return p.draw === id; }).length, im = drawThumb(id, 320, 240);
    openSheet(d.name, (im ? '<img class="dsheet-img" src="' + im + '" alt="">' : '') +
      '<div class="sheet-acts">' +
      '<button type="button" class="ui-btn primary" data-da="gen"><span data-icon="spark"></span> ' + T('Gerar programas deste desenho') + '</button>' +
      (n ? '<button type="button" class="ui-btn" data-da="progs"><span data-icon="doc"></span> ' + T('Ver os programas') + ' (' + n + ')</button>' : '') +
      '<button type="button" class="ui-btn" data-da="open"><span data-icon="edit"></span> ' + T('Abrir no Desenho') + '</button></div>');
    $$('#sheetBody [data-da]').forEach(function (b) {
      b.onclick = function () {
        closeSheet();
        if (b.dataset.da === 'gen') { show('pedir'); loadPlan(id); window.scrollTo(0, 0); }
        else if (b.dataset.da === 'progs') { libDrawId = id; libTab = 'todos'; renderLib(); }
        else { show('desenho'); setTimeout(function () { Cad.openDoc(id); }, 150); }
      };
    });
  }
  function renderLib() {
    $$('#libTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === libTab); });
    var q = $('#libSearch').value.trim().toLowerCase();
    if (libTab === 'des') {
      var dr = drawRows(q);
      $('#libList').innerHTML = dr ? '<div class="flist">' + dr + '</div>' : '<div class="empty">' + T('Nenhum desenho salvo ainda. Faça o desenho na aba Desenho e toque no disquete para salvar.') + '</div>';
      paintArt($('#libList'));
      $$('#libList [data-draw]').forEach(function (r) { r.onclick = function () { drawActions(r.dataset.draw); }; });
      return;
    }
    var lib = getLib().filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) >= 0 || p.text.toLowerCase().indexOf(q) >= 0; });
    if (libTab === 'fav') lib = lib.filter(function (p) { return isFav('u:' + p.id); });
    if (libTab === 'rec') lib = lib.filter(function (p) { return p.updated > Date.now() - 30 * 864e5; }).sort(function (a, b) { return b.updated - a.updated; });
    if (libTab === 'todos') lib = lib.slice().sort(function (a, b) { return b.updated - a.updated; });
    var head = '';
    if (libDrawId) {
      var dn = (Cad.savedList().filter(function (x) { return x.id === libDrawId; })[0] || {}).name || '';
      lib = lib.filter(function (p) { return p.draw === libDrawId; }).sort(function (a, b) { return (a.opN || 0) - (b.opN || 0); });
      head = '<div class="libfilter">📐 <b class="notr">' + esc(dn) + '</b><button type="button" class="ui-chip" id="libUnf">' + T('Ver todos') + '</button></div>';
    }
    var dr = libTab === 'todos' && !libDrawId ? drawRows(q) : '';
    $('#libList').innerHTML = head + (dr ? '<h3 class="sec">' + T('Desenhos') + '</h3>' + dr + (lib.length ? '<h3 class="sec">' + T('Programas') + '</h3>' : '') : '') + (lib.length ? lib.map(libRow).join('') : dr ? '' :
      '<div class="empty">' + (libTab === 'fav' ? 'Nenhum favorito ainda. Toque na estrela de um programa.' : 'Nada salvo ainda. Gere um programa ou peça um novo ao assistente e toque em "Salvar em Meus".') + '</div>');
    bindLibRows($('#libList'));
    $$('#libList [data-draw]').forEach(function (r) { r.onclick = function () { drawActions(r.dataset.draw); }; });
    var uf = $('#libUnf'); if (uf) uf.onclick = function () { libDrawId = null; renderLib(); };
  }
  $$('#libTabs button').forEach(function (b) { b.addEventListener('click', function () { libTab = b.dataset.t; libDrawId = null; renderLib(); }); });
  $('#btnCadFiles').addEventListener('click', function () { show('desenho'); setTimeout(function () { if (window.Cad && Cad.openFiles) Cad.openFiles(); }, 150); });
  $('#btnLibSearch').addEventListener('click', function () { var i = $('#libSearch'); i.classList.toggle('hidden'); if (!i.classList.contains('hidden')) i.focus(); else { i.value = ''; renderLib(); } });
  $('#btnBackup').addEventListener('click', function () {
    openSheet('Backup dos programas',
      '<p class="hint">Salve uma cópia de Meus Programas num arquivo (para guardar no Drive, WhatsApp ou e-mail) e traga de volta em outro aparelho.</p>' +
      '<div class="sheet-acts"><button type="button" class="ui-btn primary" id="bkExport"><span data-icon="download"></span> Exportar backup</button>' +
      '<button type="button" class="ui-btn" id="bkImport"><span data-icon="open"></span> Importar backup</button></div>');
    $('#bkExport').addEventListener('click', function () { $('#btnLibExport').click(); });
    $('#bkImport').addEventListener('click', function () { $('#libImport').click(); closeSheet(); });
  });

  /* ---------- FAVORITOS ---------- */
  function renderFavs() {
    var f = favs(), lib = getLib();
    var progs = f.filter(function (k) { return k.indexOf('p:') === 0; }).map(function (k) { return PROGRAMS.filter(function (p) { return 'p:' + p.id === k; })[0]; }).filter(Boolean);
    var mine = f.filter(function (k) { return k.indexOf('u:') === 0; }).map(function (k) { return lib.filter(function (p) { return 'u:' + p.id === k; })[0]; }).filter(Boolean);
    var h = '';
    if (progs.length) h += '<h3 class="sec">Da biblioteca</h3><div class="plist">' + progs.map(function (p) { return progCard(p); }).join('') + '</div>';
    if (mine.length) h += '<h3 class="sec">Meus programas</h3><div class="flist">' + mine.map(libRow).join('') + '</div>';
    $('#favList').innerHTML = h || '<div class="empty">Nenhum favorito ainda.<br>Toque na estrela ☆ de um programa para ele aparecer aqui.</div>';
    bindRows($('#favList')); bindLibRows($('#favList'));
  }

  $('#libSearch').addEventListener('input', renderLib);
  $('#btnLibExport').addEventListener('click', function () {
    var data = { app: 'macro-cnc', version: VER, exported: new Date().toISOString(), lib: getLib() };
    download('macro-cnc-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data, null, 2));
  });
  $('#libImport').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result); if (d.app !== 'macro-cnc') throw new Error();
        var lib = getLib(), ids = {}; lib.forEach(function (p) { ids[p.id] = 1; });
        (d.lib || []).forEach(function (p) { if (p && p.id && p.text != null && !ids[p.id]) lib.push(p); });
        store.set('lib', lib); renderLib(); toast('Backup importado.');
      } catch (err) { toast('Arquivo de backup inválido.'); }
    };
    rd.readAsText(f); e.target.value = '';
  });

  /* ---------- PEDIR PROGRAMA (assistente) ---------- */
  var chat = store.get('chat', []);
  var busy = null;
  function mdInline(s) {
    return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/_\(([^)]+)\)_/g, '<i>($1)</i>');
  }
  function mdText(t) {
    var out = [], list = null;
    t.split('\n').forEach(function (line) {
      var ul = line.match(/^\s*[-*•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/), hd = line.match(/^#{1,4}\s+(.*)/);
      if (ul || ol) {
        var type = ul ? 'ul' : 'ol';
        if (!list || list.type !== type) { if (list) out.push('</' + list.type + '>'); list = { type: type }; out.push('<' + type + '>'); }
        out.push('<li>' + mdInline((ul || ol)[1]) + '</li>'); return;
      }
      if (list) { out.push('</' + list.type + '>'); list = null; }
      if (hd) out.push('<p><b>' + mdInline(hd[1]) + '</b></p>');
      else if (line.trim()) out.push('<p>' + mdInline(line) + '</p>');
    });
    if (list) out.push('</' + list.type + '>');
    return out.join('');
  }
  function renderMd(text) {
    var parts = text.split(/```[a-zA-Z0-9]*\n?/), html = '';
    parts.forEach(function (p, i) {
      if (i % 2 === 1) html += '<div class="cblock"><pre class="code">' + esc(p.replace(/\n$/, '')) + '</pre><div class="row wrap">' +
        '<button class="btn" data-a="sim">Simular</button><button class="btn" data-a="ed">Editor</button><button class="btn" data-a="sv">Salvar em Meus</button><button class="btn" data-a="cp">Copiar</button></div></div>';
      else html += mdText(p);
    });
    return html;
  }
  function bindCode(el) {
    var blocks = el.querySelectorAll('.cblock');
    var allCode = Array.prototype.map.call(blocks, function (cb) { return cb.querySelector('pre').textContent; }).join('\n');
    blocks.forEach(function (cb) {
      var code = cb.querySelector('pre').textContent;
      cb.querySelector('[data-a=ed]').onclick = function () { setEditor(code, ''); show('editor'); toast('Código no editor.'); };
      cb.querySelector('[data-a=sim]').onclick = function () {
        // simula com todos os blocos da resposta (principal + sub)
        var txt = /G65\s*P/i.test(code) || blocks.length > 1 ? allCode : code;
        setEditor(txt, progName(code)); show('editor'); $('#btnSimulate').click();
      };
      cb.querySelector('[data-a=sv]').onclick = function () { saveProgram(progName(code) + ' (assistente)', code, 'novo'); };
      cb.querySelector('[data-a=cp]').onclick = function () { copyText(code); };
    });
  }
  function msgEl(m) {
    var d = document.createElement('div');
    d.className = 'msg ' + (m.role === 'user' ? 'user' : 'bot');
    if (m.role === 'user') d.textContent = m.display || m.content;
    else { d.innerHTML = renderMd(m.content); bindCode(d); }
    return d;
  }
  function renderChat() {
    var log = $('#chatLog'); log.innerHTML = '';
    chat.forEach(function (m) { log.appendChild(msgEl(m)); });
  }
  function scrollChat() { setTimeout(function () { window.scrollTo(0, document.body.scrollHeight); }, 30); }
  function checkChatSetup() { $('#chatSetup').classList.toggle('hidden', Assistant.isReady()); }
  $('#btnGoConfig').addEventListener('click', function () { show('config'); });
  $('#btnNewChat').addEventListener('click', async function () {
    if (busy) busy.abort();
    if (chat.length && !(await confirmBox('Começar uma nova conversa? A atual será apagada.'))) return;
    chat = []; store.set('chat', chat); renderChat();
  });
  var ta = $('#chatText');
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendChat(); } });
  $('#btnSend').addEventListener('click', function () { if (busy) busy.abort(); else sendChat(); });

  async function sendChat() {
    var text = ta.value.trim();
    if (!text) { if (planCur) { if (selOps().length) openAdjust(); else toast(T('Toque na peça para escolher o que usinar.')); } else toast(T('Escreva o pedido.')); ta.focus(); return; }
    if (!Assistant.isReady()) {
      openSheet(T('Assistente desligado'), '<p class="hint">' + esc(T('Para mandar pedidos escritos, o assistente precisa da sua chave da API (com crédito). Os programas do desenho importado não precisam: use Ajustar e gerar.')) + '</p><div class="sheet-acts"><button type="button" class="ui-btn primary" id="asCfg">' + esc(T('Abrir configurações')) + '</button></div>');
      $('#asCfg').onclick = function () { closeSheet(); show('config'); }; return;
    }
    $('#chatLog').classList.remove('hidden');
    var kind = $('#chatKind').value, prefix = kind === 'param' ? '[Tipo pedido: parametrizado simples, sem G65]\n' : kind === 'macro' ? '[Tipo pedido: macro G65, principal O00xx + sub O16xx]\n' : '';
    var content = prefix + text, display = text;
    if ($('#chatCtx').checked && ed.value.trim()) {
      content += '\n\nPrograma do editor' + (edName.value ? ' ("' + edName.value + '")' : '') + ':\n```gcode\n' + ed.value.slice(0, 30000) + '\n```';
      display = text + '\n' + T('📎 programa do editor anexado');
      $('#chatCtx').checked = false;
    }
    chat.push({ role: 'user', content: content, display: display });
    ta.value = ''; ta.style.height = 'auto';
    renderChat();
    var bot = document.createElement('div'); bot.className = 'msg bot typing'; $('#chatLog').appendChild(bot); scrollChat();
    busy = new AbortController();
    $('#btnSend').textContent = 'Parar';
    var history = chat.slice(-16).map(function (m) { return { role: m.role, content: m.content }; });
    while (history.length && history[0].role !== 'user') history.shift();
    var approved = getLib().filter(function (p) { return p.status === 'testado'; }).map(function (p) { return { name: p.name, text: p.text }; });
    var lastText = '', raf = 0;
    try {
      var full = await Assistant.send(history, function (t) {
        lastText = t;
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; bot.innerHTML = renderMd(lastText); scrollChat(); });
      }, busy.signal, approved);
      chat.push({ role: 'assistant', content: full || '(sem resposta)' });
    } catch (e) {
      if (e.name === 'AbortError') { if (lastText) chat.push({ role: 'assistant', content: lastText + '\n\n_(interrompido)_' }); else chat.pop(); }
      else {
        chat.pop(); ta.value = text;
        var er = document.createElement('div'); er.className = 'msg err'; er.textContent = e.message;
        store.set('chat', chat); renderChat(); $('#chatLog').appendChild(er); scrollChat();
        busy = null; $('#btnSend').textContent = 'Enviar'; return;
      }
    }
    cancelAnimationFrame(raf);
    busy = null; $('#btnSend').textContent = 'Enviar';
    store.set('chat', chat.slice(-40)); renderChat(); scrollChat();
  }
  renderChat();

  /* ---------- DESENHO -> PROGRAMAS: vista 3D, toque na linha a usinar ---------- */
  var planCur = null;   // { id, pl, st, view, out }
  var PLAN_F = { T: 'Ø fresa/broca', N: 'T nº', S: 'S rpm', F: 'F mm/min', W: 'W (Z inicial)', Z: 'Z final', K: 'K desce/volta', Q: 'Q passo lateral', A: 'A entrada', R: 'R seg.', H: 'H graus/volta' };
  var PLAN_KEYS = { face: ['T', 'N', 'S', 'F', 'W', 'Z', 'K', 'Q'], ret: ['T', 'N', 'S', 'F', 'W', 'Z', 'K', 'A'], poli: ['T', 'N', 'S', 'F', 'W', 'Z', 'K', 'A'], circ: ['T', 'N', 'S', 'F', 'W', 'Z', 'K', 'A'],
    hel: ['T', 'N', 'S', 'F', 'W', 'Z', 'K'], boss: ['T', 'N', 'S', 'F', 'W', 'K', 'Q'], fillet: ['T', 'N', 'S', 'F', 'H'], reb: ['T', 'N', 'S', 'F', 'W', 'Z', 'K'], pcd: ['T', 'N', 'S', 'F', 'W', 'Z', 'Q'], g83: ['T', 'N', 'S', 'F', 'W', 'Z', 'Q'] };
  var PLAN_F2 = { T: 'Ø ferramenta', N: 'T nº', S: 'Rotação S', F: 'Avanço F', W: 'Z inicial', Z: 'Z final (profundidade)', K: 'Desce por passada', Q: 'Passo lateral / bicada', A: 'Entrada', H: 'Graus por volta' };
  function cadReady() { return window.Cad && Cad.ensure && Cad.ensure(); }
  function drawThumb(id, w, h) { try { return Cad.thumb(id, w || 120, h || 90); } catch (e) { return null; } }
  function pickDrawing(cb, title) {
    if (!cadReady()) return toast('Abra a aba Desenho uma vez e tente de novo.');
    var L = Cad.savedList();
    if (!L.length) { openSheet(title || 'Importar desenho', '<p class="hint">Nenhum desenho salvo ainda. Faça o desenho na aba Desenho e toque no disquete para salvar.</p><div class="sheet-acts"><button type="button" class="ui-btn primary" id="pdGo"><span data-icon="edit"></span> Ir para o Desenho</button></div>'); $('#pdGo').onclick = function () { closeSheet(); show('desenho'); }; return; }
    openSheet(title || 'Importar desenho', '<div class="dlist">' + L.map(function (d) {
      var im = drawThumb(d.id, 120, 90);
      return '<button type="button" class="drow" data-id="' + d.id + '">' + (im ? '<img src="' + im + '" alt="">' : '<span class="dph" data-icon="folder"></span>') +
        '<span class="frow-t"><b class="notr">' + esc(d.name) + '</b><small>' + (d.folder ? '📁 ' + esc(d.folder) + ' · ' : '') + when(d.savedAt) + '</small></span></button>';
    }).join('') + '</div>');
    $$('#sheetBody .drow').forEach(function (b) { b.onclick = function () { closeSheet(); cb(b.dataset.id); }; });
  }
  function planOv(id) { return store.get('planp.' + id, {}); }
  function setPlanOv(id, ov) { store.set('planp.' + id, ov); }
  // só a vista de cima não diz as alturas: pergunta uma vez e grava no desenho
  function askHeights(id, done) {
    var fe = Cad.features(id); if (!fe) return;
    var K = [['pas', 'Passante'], ['prof', 'Rebaixo'], ['ress', 'Ressalto'], ['cham', 'Chanfro']], U = { prof: 'prof.', ress: 'altura', cham: '°' };
    function row(f) {
      var opts = f.t === 'holes' ? K.slice(0, 2) : K;
      return '<div class="hq" data-eid="' + f.eid + '"><b class="notr">' + esc(f.name) + '</b><div class="hq-k">' + opts.map(function (o) { return '<button type="button" data-k="' + o[0] + '" class="' + (o[0] === f.kind ? 'on' : '') + '">' + esc(T(o[1])) + '</button>'; }).join('') + '</div>' +
        '<div class="hq-v' + (f.kind === 'pas' ? ' hidden' : '') + '"><label><span>' + esc(T(U[f.kind] || 'prof.')) + '</span><input class="input" data-v value="' + String(f.val).replace('.', ',') + '" inputmode="decimal"></label>' +
        '<label class="' + (f.kind === 'ress' ? '' : 'hidden') + '"><span>' + esc(T('raio na base')) + ' R</span><input class="input" data-r value="' + String(f.rb).replace('.', ',') + '" inputmode="decimal" placeholder="0"></label></div></div>';
    }
    openSheet(T('Alturas da peça'), '<label class="hq-esp"><span>' + esc(T('Altura total')) + '</span><input class="input" id="hqEsp" value="' + String(fe.esp).replace('.', ',') + '" inputmode="decimal"> mm</label>' +
      fe.list.map(row).join('') + '<div class="sheet-acts"><button type="button" class="ui-btn primary" id="hqOk">' + esc(T('Salvar alturas')) + '</button></div>');
    $$('#sheetBody .hq').forEach(function (r) {
      r.querySelectorAll('[data-k]').forEach(function (b) {
        b.onclick = function () {
          r.querySelectorAll('[data-k]').forEach(function (x) { x.classList.toggle('on', x === b); });
          var k = b.dataset.k, v = r.querySelector('.hq-v');
          v.classList.toggle('hidden', k === 'pas'); v.querySelector('label span').textContent = T(U[k] || 'prof.');
          v.querySelector('[data-r]').parentNode.classList.toggle('hidden', k !== 'ress');
          var iv = v.querySelector('[data-v]'); if (k !== r.dataset.was) iv.value = ''; r.dataset.was = k; if (k !== 'pas') iv.focus();
        };
      });
      r.dataset.was = (r.querySelector('[data-k].on') || {}).dataset ? r.querySelector('[data-k].on').dataset.k : 'pas';
    });
    $('#hqOk').onclick = function () {
      var esp = parseFloat(String($('#hqEsp').value).replace(',', '.'));
      if (esp > 0) Cad.setEsp(id, esp);
      $$('#sheetBody .hq').forEach(function (r) {
        var on = r.querySelector('[data-k].on'), k = on ? on.dataset.k : 'pas';
        Cad.setFeature(id, r.dataset.eid, k, String(r.querySelector('[data-v]').value).replace(',', '.'), String(r.querySelector('[data-r]').value).replace(',', '.'));
      });
      Cad.setMeta(id, { hconf: fe.list.length + 1 }); closeSheet(); if (done) done();   // guarda quantos elementos foram conferidos
    };
  }
  function loadPlan(id, noAsk) {
    if (!cadReady()) return;
    var A = Cad.analyze(id); if (!A) { toast('Esse desenho está vazio.'); return; }
    var feN = (Cad.features(id) || { list: [] }).list.length + 1;
    if (A.hconf !== feN && !noAsk) { askHeights(id, function () { loadPlan(id, true); }); }   // nunca conferido, ou o desenho mudou
    var ov = planOv(id), geo = JSON.stringify([A.esp, A.base || 0]);
    if (ov._geo !== geo) {   // alturas mudaram: Z inicial/final voltam a vir do desenho
      Object.keys(ov).forEach(function (k) { if (k.charAt(0) !== '_' && ov[k] && ov[k].p) { delete ov[k].p.W; delete ov[k].p.Z; } });
      ov._geo = geo; setPlanOv(id, ov);
    }
    var pl = Plan.plan(A, ov._sob);
    pl.ops.forEach(function (op) { op.def = JSON.parse(JSON.stringify(op.p)); var o = ov[op.key]; if (o && o.p) Object.keys(o.p).forEach(function (k) { if (op.p[k] !== undefined) op.p[k] = o.p[k]; }); });
    var keep = planCur && planCur.id === id ? planCur.view : null;
    var st3 = Cad.st3d(id); if (st3) st3.label = '';
    planCur = { id: id, pl: pl, st: st3, edges: Plan.edges(pl), seg: ov._seg || [], sel: [], view: keep || { az: -35, el: 32, zoom: 0.92, panX: 0, panY: 0 }, out: null };
    syncSel();
    store.set('plan.cur', id);
    renderPlan();
  }
  function saveSel() { var ov = planOv(planCur.id); ov._seg = planCur.seg; setPlanOv(planCur.id, ov); }
  // trechos do perfil escolhidos (verdes) -> operações
  function segsNow() { return Plan.segments(planCur.pl, planCur.view.az); }
  function syncSel() {
    var S = segsNow(), keys = {};
    planCur.seg = planCur.seg.filter(function (k) { return S.some(function (sg) { return sg.key === k; }); });
    S.forEach(function (sg) { if (planCur.seg.indexOf(sg.key) >= 0) sg.ops.forEach(function (k) { keys[k] = 1; }); });
    planCur.sel = Object.keys(keys);
  }
  function selOps() { return planCur.pl.ops.filter(function (op) { return planCur.sel.indexOf(op.key) >= 0; }); }   // na ordem de usinagem
  function draw3D() {
    var cv = $('#dpCv'); if (!cv || !planCur || !planCur.st) return;
    var W = cv.clientWidth, H = cv.clientHeight, v = planCur.view; v.W = W; v.H = H;
    Stock3D.render(cv, planCur.st, v, false);
    var c = cv.getContext('2d'), S = Stock3D.projector(planCur.st, v, W, H);
    planCur.proj = segsNow().map(function (sg) { return { e: sg, lines: sg.lines.map(function (L) { return L.map(function (p) { return S(p[0], p[1], p[2]); }); }) }; });
    planCur.proj.forEach(function (pe) {   // tracejado azul em todo o perfil; verde = escolhido
      var on = planCur.seg.indexOf(pe.e.key) >= 0;
      c.strokeStyle = on ? '#22c55e' : 'rgba(110,190,255,.9)'; c.lineWidth = on ? 4.5 : 2; c.setLineDash(on ? [] : [7, 5]); c.lineCap = 'round';
      pe.lines.forEach(function (L) { c.beginPath(); L.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); });
    });
    c.setLineDash([]);
  }
  // ponto 3D visível? anda na direção da câmera e vê se a peça tapa
  function visible3D(p) {
    var v = planCur.view, az = v.az * Math.PI / 180, el = v.el * Math.PI / 180, sa = Math.sin(az), ca = Math.cos(az), se = Math.sin(el), ce = Math.cos(el), st = planCur.st;
    var dx = -ce * sa, dy = -ce * ca, dz = se, step = Math.max(0.5, st.cell);
    for (var t = step * 1.5; t < 2000; t += step) {
      var x = p[0] + dx * t, y = p[1] + dy * t, z = p[2] + dz * t;
      if (z > st.top + 0.5) return true;
      var h = st.hAt(x, y); if (h != null && h > z + 0.3) return false;
    }
    return true;
  }
  function hitEdge(x, y) {
    var cands = [];
    (planCur.proj || []).forEach(function (pe) {
      if (pe.e.face) return;
      pe.lines.forEach(function (L, li) {
        for (var i = 1; i < L.length; i++) {
          var a = L[i - 1], b = L[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
          var d = Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
          if (d < 24) { var A3 = pe.e.lines[li][i - 1], B3 = pe.e.lines[li][i]; cands.push({ d: d, e: pe.e, p: [A3[0] + (B3[0] - A3[0]) * t, A3[1] + (B3[1] - A3[1]) * t, A3[2] + (B3[2] - A3[2]) * t] }); }
        }
      });
    });
    cands.sort(function (a, b) { return a.d - b.d; });
    var seen = {}, out = [], hidden = [];
    for (var k = 0; k < cands.length; k++) { var c = cands[k]; if (seen[c.e.key]) continue; seen[c.e.key] = 1; (visible3D(c.p) ? out : hidden).push(c.e); }   // primeiro as linhas que dá para ver
    var best = null;
    (planCur.proj || []).forEach(function (pe) {   // tocou dentro da face de cima = faceamento
      if (!pe.e.face || best) return;
      var P = pe.lines[0], ins = false;
      for (var i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) ins = !ins;
      if (ins) best = pe.e;
    });
    if (best) out.push(best);
    return out.length ? out : hidden;
  }
  // tocou: pergunta o que usinar ali (só a operação escolhida entra)
  function pickOp(list) {
    openSheet(T('O que usinar aqui?'), '<div class="pk-list">' + list.map(function (e) {
      var on = planCur.sel.indexOf(e.key) >= 0;
      return '<button type="button" class="pk' + (on ? ' on' : '') + '" data-k="' + e.key + '"><span class="pk-c">' + (on ? '✓' : '+') + '</span>' + esc(e.label) + '</button>';
    }).join('') + '</div>');
    $$('#sheetBody .pk').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k, i = planCur.sel.indexOf(k);
        if (i >= 0) planCur.sel.splice(i, 1); else planCur.sel.push(k);
        planCur.hl = null; saveSel(); planCur.out = null; closeSheet(); renderPlan();
      };
    });
    planCur.hl = list.map(function (e) { return e.key; }); requestAnimationFrame(draw3D);   // as linhas tocadas piscam em branco
  }
  function renderPlan() {
    var host = $('#drawPlan'); $('#chatSetup').classList.toggle('hidden', !!planCur || Assistant.isReady());
    $('#chatLog').classList.toggle('hidden', !!planCur && !chat.length);   // sem o texto de exemplos embaixo do desenho
    $('#view-pedir').classList.toggle('plan-open', !!planCur);   // com desenho aberto: some a caixa de texto, a tela inteira fica para o desenho
    if (!planCur) { host.innerHTML = ''; return; }
    var pl = planCur.pl, ops = selOps(), st = Plan.stockOf(pl.A, pl.sob, (pl.ops.filter(function (o) { return o.kind === 'face'; })[0] || { p: { W: 0 } }).p.W);
    var stTxt = (st.shape === 'round' ? 'Ø' + Plan.gv(st.d).replace(/\.$/, '') : Plan.gv(st.lx).replace(/\.$/, '') + '×' + Plan.gv(st.ly).replace(/\.$/, '')) + '×' + Plan.gv(st.top - st.bottom).replace(/\.$/, '');
    var h = '<div class="card dp3"><div class="dp3-h"><b class="notr">' + esc(pl.name) + '</b><button type="button" class="ui-chip" id="dpHq">✎ ' + esc(T('Alturas')) + '</button><button type="button" class="ui-ico" id="dpClose" aria-label="Fechar">✕</button></div>' +
      '<div class="dp3-cv"><canvas id="dpCv"></canvas><span class="dp3-tip">' + esc(T('Toque nas linhas · arraste para girar')) + '</span></div>' +
      '<div class="dp3-sel">' + segsNow().filter(function (sg) { return planCur.seg.indexOf(sg.key) >= 0; }).map(function (sg) { return '<span class="dp3-seg" data-s="' + sg.key + '">' + esc(sg.label) + ' ✕</span>'; }).join('') + '</div>' +
      '<div class="dp3-act"><button type="button" class="ui-chip" id="dpStock">' + esc(T('Bruto')) + ' ' + esc(stTxt) + '</button>' +
      (planCur.seg.length ? '<button type="button" class="ui-btn primary" id="dpGen"><span data-icon="check"></span> ' + esc(T('Selecionar perfil')) + '</button>' : '<span class="dp3-wait">' + esc(T('Toque nas linhas do perfil a usinar')) + '</span>') + '</div>';
    if (planCur.out) h += '<div class="dp3-res">' + planCur.out.map(function (f, i) {
      return '<div class="dp-res"><b>' + esc(f.O) + '</b> <span class="notr">' + esc(f.title) + '</span><span class="row"><button type="button" class="btn" data-r="sim" data-i="' + i + '">' + esc(T('Simular')) + '</button><button type="button" class="btn" data-r="ed" data-i="' + i + '">' + esc(T('Editor')) + '</button></span></div>';
    }).join('') + '</div>';
    h += '</div>';
    host.innerHTML = h; paintArt(host);
    requestAnimationFrame(draw3D);
    $('#dpClose').onclick = function () { planCur = null; store.set('plan.cur', null); renderPlan(); };
    $('#dpHq').onclick = function () { var id = planCur.id; askHeights(id, function () { loadPlan(id, true); }); };
    $('#dpStock').onclick = function () {
      openSheet(T('Bruto'), '<label class="hq-esp"><span>' + esc(T('Sobremetal em volta')) + '</span><input class="input" id="sbV" value="' + String(pl.sob).replace('.', ',') + '" inputmode="decimal"> mm</label><div class="sheet-acts"><button type="button" class="ui-btn primary" id="sbOk">OK</button></div>');
      $('#sbOk').onclick = function () { var v = parseFloat(String($('#sbV').value).replace(',', '.')); if (v >= 0) { var ov = planOv(planCur.id); ov._sob = v; setPlanOv(planCur.id, ov); } closeSheet(); loadPlan(planCur.id, true); };
    };
    if ($('#dpGen')) $('#dpGen').onclick = openAdjust;
    host.querySelectorAll('.dp3-seg').forEach(function (r) { r.onclick = function () { planCur.seg = planCur.seg.filter(function (k) { return k !== r.dataset.s; }); syncSel(); saveSel(); planCur.out = null; renderPlan(); }; });
    host.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () {
        var f = planCur.out[+b.dataset.i];
        if (b.dataset.r === 'sim') { setEditor(f.text, f.name); openSim(f.text, libraryMatch(f.text), f.name); }
        else { setEditor(f.text, f.name); show('editor'); }
      };
    });
    // girar com o dedo; toque curto = escolher a linha
    var cv = $('#dpCv'), d0 = null, raf = 0;
    cv.addEventListener('pointerdown', function (e) { d0 = { x: e.clientX, y: e.clientY, az: planCur.view.az, el: planCur.view.el, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!d0) return; var dx = e.clientX - d0.x, dy = e.clientY - d0.y;
      if (!d0.moved && Math.hypot(dx, dy) < 7) return; d0.moved = true;
      planCur.view.az = d0.az - dx * 0.5; planCur.view.el = Math.max(5, Math.min(89, d0.el + dy * 0.4));
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw3D(); });
    });
    cv.addEventListener('pointerup', function (e) {
      if (!d0) return; var tap = !d0.moved; d0 = null; if (!tap) return;
      var r = cv.getBoundingClientRect(), u = e.clientX - r.left, vv = e.clientY - r.top, hit = null;
      var lh = hitEdge(u, vv); if (lh.length) hit = lh[0];   // em cima da linha tracejada
      if (!hit) {   // ou na superfície: o trecho do perfil mais perto do ponto tocado
        var pk = Stock3D.picker(planCur.st, planCur.view, cv.clientWidth, cv.clientHeight)(u, vv);
        if (pk) { var o = planCur.pl.A.origin || { x: 0, y: 0 }, q = [pk[0] - o.x, pk[1] - o.y, pk[2]], bd = Infinity;
          segsNow().forEach(function (sg) { var d = sg.dist(q); if (d < bd) { bd = d; hit = sg; } }); if (bd > 8) hit = null; }
      }
      if (!hit) return toast(T('Toque numa linha tracejada da peça.'));
      var i = planCur.seg.indexOf(hit.key);
      if (i >= 0) planCur.seg.splice(i, 1); else planCur.seg.push(hit.key);
      syncSel(); saveSel(); planCur.out = null; renderPlan();
    });
  }
  // tela de ajustes: ferramenta, profundidade, externo/interno de cada operação; depois gerar ou gerar e simular
  // informações e escolhas próprias de cada operação (altura do ressalto, altura do raio, tipo de fresa, jeito de usinar)
  function seg2(attr, opts, cur) { return '<div class="seg2' + (opts.length > 2 ? ' seg3' : '') + '" ' + attr + '>' + opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '" class="' + (String(o[0]) === String(cur) ? 'on' : '') + '">' + esc(T(o[1])) + '</button>'; }).join('') + '</div>'; }
  function adjExtra(op) {
    var A = planCur.pl.A, g = op.g, h = '', f = function (v) { return Plan.gv(v).replace(/\.$/, ''); };
    if (op.kind === 'boss') {
      h += '<div class="adj-info"><label><span>' + esc(T('Altura do ressalto')) + '</span><input class="input" data-geo="ress" value="' + f(g.ress) + '" inputmode="decimal"></label>' +
        '<label><span>' + esc(T('Raio na base R')) + '</span><input class="input" data-geo="rb" value="' + f(g.rb || 0) + '" inputmode="decimal"></label>' +
        '<div class="adj-note">' + esc(T('Face de baixo em Z')) + f(A.base) + (g.rb ? ' · ' + esc(T('o raio vai de Z')) + f(A.base + g.rb) + ' ' + esc(T('até Z')) + f(A.base) : '') + '</div></div>';
      h += '<div class="adj-lab">' + esc(T('Jeito de usinar')) + '</div>' + seg2('data-p="M"', [[0, 'Circular (Z fixo)'], [1, 'Helicoidal (rampa)']], op.p.M);
    } else if (op.kind === 'fillet') {
      h += '<div class="adj-info"><div class="adj-note">' + esc(T('Raio')) + ' R' + f(g.rb) + ' · ' + esc(T('altura do raio')) + ' ' + f(g.rb) + ' mm (' + 'Z' + f(op.base + g.rb) + ' → Z' + f(op.base) + ') · ' + esc(T('do')) + ' Ø' + f(g.d) + ' ' + esc(T('até')) + ' Ø' + f(g.d + 2 * g.rb) + '</div></div>';
      var tt = !(op.p.C > 0) ? 0 : op.p.C >= op.p.T / 2 ? 1 : 2;
      h += '<div class="adj-lab">' + esc(T('Ferramenta do raio')) + '</div>' + seg2('data-tool', [[0, 'Topo reto'], [1, 'Esférica'], [2, 'Raio de canto']], tt) +
        '<label class="adj-rc' + (tt === 2 ? '' : ' hidden') + '"><span>' + esc(T('Raio de canto da fresa')) + '</span><input class="input" data-k="C" value="' + f(op.p.C || 0) + '" inputmode="decimal"></label>';
    } else if (op.kind === 'circ' || op.kind === 'ret' || op.kind === 'poli') {
      if (op.kind === 'circ') h += '<div class="adj-lab">' + esc(T('Jeito de usinar')) + '</div>' + seg2('data-p="M"', [[0, 'Circular (Z fixo)'], [1, 'Helicoidal (rampa)']], op.p.M);
    }
    return h;
  }
  function openAdjust() {
    var ops = selOps(); if (!ops.length) return;
    var h = ops.map(function (op, i) {
      var lado = op.kind === 'circ' || op.kind === 'hel';
      return '<div class="adj" data-k="' + op.key + '"><div class="adj-h"><span class="n">' + (i + 1) + '</span><b>' + esc(op.title) + '</b></div><div class="hint">' + esc(op.what.split(' — ')[0]) + '</div>' +
        adjExtra(op) +
        (lado ? '<div class="seg2" data-lado><button type="button" data-l="0" class="' + (op.p.L === 0 ? 'on' : '') + '">' + esc(T('Contorno externo')) + '</button><button type="button" data-l="1" class="' + (op.p.L === 1 ? 'on' : '') + '">' + esc(T('Interno (furo)')) + '</button></div>' : '') +
        (op.warn || []).map(function (w) { return '<div class="note">' + esc(w) + '</div>'; }).join('') +
        '<div class="dp-grid">' + (PLAN_KEYS[op.kind] || []).map(function (k) { return '<label><span>' + esc(T(PLAN_F2[k] || PLAN_F[k])) + '</span><input class="input" data-k="' + k + '" value="' + String(op.p[k]).replace('.', ',') + '" inputmode="decimal"></label>'; }).join('') + '</div></div>';
    }).join('');
    openSheet(T('Ajustes da usinagem'), h + '<div class="sheet-acts adj-acts"><button type="button" class="ui-btn" id="adGen"><span data-icon="save"></span> ' + esc(T('Gerar programas')) + '</button><button type="button" class="ui-btn primary" id="adSim"><span data-icon="play"></span> ' + esc(T('Gerar e simular')) + '</button></div>');
    $$('#sheetBody [data-lado] button, #sheetBody [data-p] button, #sheetBody [data-tool] button').forEach(function (b) {
      b.onclick = function () {
        b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (b.parentNode.hasAttribute('data-tool')) { var box = b.closest('.adj'), rc = box.querySelector('.adj-rc'); rc.classList.toggle('hidden', b.dataset.v !== '2'); }
      };
    });
    function apply() {
      var ov = planOv(planCur.id), geoCh = null;
      $$('#sheetBody .adj').forEach(function (box) {
        var key = box.dataset.k, op = planCur.pl.ops.filter(function (o) { return o.key === key; })[0]; if (!op) return;
        var pk = (ov[key] && ov[key].p) || {};
        box.querySelectorAll('input[data-k]').forEach(function (i) { var v = parseFloat(String(i.value).replace(',', '.')); if (isFinite(v)) { op.p[i.dataset.k] = v; if (v !== op.def[i.dataset.k]) pk[i.dataset.k] = v; else delete pk[i.dataset.k]; } });
        var l = box.querySelector('[data-lado] .on'); if (l) { op.p.L = +l.dataset.l; if (op.p.L !== op.def.L) pk.L = op.p.L; else delete pk.L; }
        var m = box.querySelector('[data-p="M"] .on'); if (m) { op.p.M = +m.dataset.v; if (op.p.M !== op.def.M) pk.M = op.p.M; else delete pk.M; }
        var tl = box.querySelector('[data-tool] .on'); if (tl) { var tv = +tl.dataset.v; op.p.C = tv === 0 ? 0 : tv === 1 ? op.p.T / 2 : Math.max(0, op.p.C || 0); if (op.p.C !== op.def.C) pk.C = op.p.C; else delete pk.C; }
        var gr = box.querySelector('[data-geo="ress"]'), gb = box.querySelector('[data-geo="rb"]');
        if (gr && op.g && op.g.eid) { var nr = parseFloat(String(gr.value).replace(',', '.')), nb = parseFloat(String(gb.value).replace(',', '.')) || 0; if (nr > 0 && (nr !== op.g.ress || nb !== (op.g.rb || 0))) geoCh = { eid: op.g.eid, ress: nr, rb: nb }; }
        ov[key] = { p: pk };
      });
      setPlanOv(planCur.id, ov);
      if (geoCh) {   // mudou a altura do ressalto ou o raio: grava no desenho e refaz o plano (mantendo o perfil escolhido)
        Cad.setFeature(planCur.id, geoCh.eid, 'ress', geoCh.ress, geoCh.rb);
        var id = planCur.id, seg = planCur.seg.slice(); loadPlan(id, true); planCur.seg = seg; syncSel();
      }
    }
    $('#adGen').onclick = function () { apply(); closeSheet(); genPlan(); };
    $('#adSim').onclick = function () { apply(); closeSheet(); genPlan(); var f = planCur.out && planCur.out[0]; if (f) { setEditor(f.text, f.name); openSim(f.text, libraryMatch(f.text), f.name); } };
  }
  function editOp(key) {
    var op = planCur.pl.ops.filter(function (o) { return o.key === key; })[0]; if (!op) return;
    openSheet(op.title, '<p class="hint">' + esc(op.what) + '</p>' + (op.warn || []).map(function (w) { return '<div class="note">' + esc(w) + '</div>'; }).join('') +
      '<div class="dp-grid">' + (PLAN_KEYS[op.kind] || []).map(function (k) { return '<label><span>' + esc(T(PLAN_F[k])) + '</span><input class="input" data-k="' + k + '" value="' + String(op.p[k]).replace('.', ',') + '" inputmode="decimal"></label>'; }).join('') + '</div>' +
      '<div class="sheet-acts"><button type="button" class="ui-btn primary" id="eoOk">OK</button></div>');
    $('#eoOk').onclick = function () {
      var ov = planOv(planCur.id), pk = (ov[key] && ov[key].p) || {};
      $$('#sheetBody input[data-k]').forEach(function (i) { var v = parseFloat(String(i.value).replace(',', '.')); if (isFinite(v)) { op.p[i.dataset.k] = v; if (v !== op.def[i.dataset.k]) pk[i.dataset.k] = v; else delete pk[i.dataset.k]; } });
      ov[key] = { p: pk }; setPlanOv(planCur.id, ov); closeSheet(); planCur.out = null; renderPlan();
    };
  }
  function genPlan() {
    var pl = planCur.pl, on = selOps();
    if (!on.length) return;
    // números dos programas: cada desenho ganha uma dezena só dele (O0101..O0109, O0111..O0119, ...)
    var nums = store.get('plan.num', {}), lib = getLib();
    if (!nums[planCur.id]) { var used = Object.keys(nums).map(function (k) { return nums[k]; }); var b0 = 100; while (used.indexOf(b0) >= 0) b0 += 10; nums[planCur.id] = b0; store.set('plan.num', nums); }
    var base = nums[planCur.id], now = Date.now(), out = [];
    pl.ops.forEach(function (op) { op.on = on.indexOf(op) >= 0; });
    on.forEach(function (op, i) {
      op.idx = i + 1;
      var r = Plan.build(pl, op, base + i + 1), name = pl.name + ' · Op ' + (i + 1) + ' ' + op.title + ' (' + r.O + ')';
      var ex = lib.filter(function (p) { return p.draw === planCur.id && p.opKey === op.key; })[0];
      if (ex) { ex.text = r.text; ex.name = name; ex.updated = now - i; ex.opN = i + 1; ex.drawName = pl.name; }
      else lib.unshift({ id: uid(), name: name, text: r.text, status: 'novo', created: now, updated: now - i, draw: planCur.id, drawName: pl.name, opKey: op.key, opN: i + 1 });
      out.push({ O: r.O, title: 'Op ' + (i + 1) + ' · ' + op.title, name: name, text: r.text });
    });
    if (store.set('lib', lib)) toast(out.length + ' ' + T('programas salvos em Meus Programas.'));
    planCur.out = out; renderPlan();
  }
  $('#btnImpDraw').addEventListener('click', function () { pickDrawing(function (id) { loadPlan(id); }); });
  window.addEventListener('resize', function () { if (planCur) requestAnimationFrame(draw3D); });
  setTimeout(function () { var pid = store.get('plan.cur', null); if (pid && window.Cad && window.Plan) { try { if (Cad.ensure() && Cad.savedList().some(function (d) { return d.id === pid; })) loadPlan(pid, true); } catch (e) {} } }, 0);

  /* ---------- CONFIG ---------- */
  function loadCfgUi() {
    var c = Assistant.loadCfg();
    $('#cfgMode').value = c.mode; $('#cfgProxy').value = c.proxyUrl || ''; $('#cfgKey').value = c.apiKey || ''; $('#cfgModel').value = c.model;
    toggleCfg();
  }
  function toggleCfg() { var k = $('#cfgMode').value === 'key'; $('#cfgKeyWrap').classList.toggle('hidden', !k); $('#cfgProxyWrap').classList.toggle('hidden', k); }
  $('#cfgMode').addEventListener('change', toggleCfg);
  function saveCfgUi() {
    var url = $('#cfgProxy').value.trim();
    if (url && !/^https:\/\//i.test(url)) { $('#cfgMsg').textContent = 'O endereço do proxy precisa começar com https://'; return false; }
    Assistant.saveCfg({ mode: $('#cfgMode').value, proxyUrl: url, apiKey: $('#cfgKey').value.trim(), model: $('#cfgModel').value });
    $('#cfgMsg').textContent = 'Configurações salvas.'; checkChatSetup(); return true;
  }
  $('#btnCfgSave').addEventListener('click', saveCfgUi);
  $('#btnCfgTest').addEventListener('click', async function () {
    if (!saveCfgUi()) return;
    $('#cfgMsg').textContent = 'Testando…';
    try { var r = await Assistant.send([{ role: 'user', content: 'Responda só: OK' }], function () {}); $('#cfgMsg').textContent = 'Conexão funcionando ✓ (' + r.trim().slice(0, 40) + ')'; }
    catch (e) { $('#cfgMsg').textContent = e.message; }
  });
  $('#btnWipe').addEventListener('click', async function () {
    if (!(await confirmBox('Apagar Meus programas, conversa e configurações deste aparelho? Faça um backup antes.'))) return;
    try { Object.keys(localStorage).filter(function (k) { return k.indexOf('mcnc.') === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    location.reload();
  });
  $('#appVer').textContent = VER;
  loadCfgUi();

  /* ---------- PWA ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; $('#btnInstall').classList.remove('hidden'); });
  $('#btnInstall').addEventListener('click', async function () {
    if (!deferredPrompt) return; deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null; $('#btnInstall').classList.add('hidden');
  });
  window.addEventListener('appinstalled', function () { $('#btnInstall').classList.add('hidden'); toast('App instalado.'); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    var swReloaded = false, hadCtrl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (swReloaded || !hadCtrl) return; swReloaded = true; location.reload(); });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      reg.update().catch(function () {});
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
  }

  /* ---------- recursos da página publicada no Claude (versão de teste) ---------- */
  setTimeout(function () {
    rt('downloads').then(function (d) { RT.downloads = d; }).catch(function () {});
    rt('sample').then(function (s) { if (s) { Assistant.setSample(s); checkChatSetup(); var n = $('#cfgSampleNote'); if (n) n.classList.remove('hidden'); } }).catch(function () {});
  }, 0);

  /* ---------- início ---------- */
  renderList();
  show(location.hash.slice(1) || 'home', true);

  /* ponte com a aba Desenho */
  window.App = {
    openProgCall: function (id, call) {
      var p = PROGRAMS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      openProg(id); renderProgForm(savedVals(id), call.replace(/^G65 P\d+\s*/, '')); window.scrollTo(0, 0);
      toast(T('Chamada montada pelo desenho. Confira T, Z, K, R e F antes de gerar.'));
    },
    openEditor: function (text, name) { setEditor(text, name); show('editor'); },
    // salvar arquivo pela página do Claude (quando o app roda como artefato); null = não disponível aqui
    saveFile: function (filename, data) { return RT.downloads ? RT.downloads.save({ filename: filename, data: data }) : null; }
  };
})();
