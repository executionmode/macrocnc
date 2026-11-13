/* Simulador de Custom Macro B (FANUC) — Macro CNC
 * Executa programas parametrizados e macros G65 de verdade (variáveis, IF/GOTO, IF/THEN,
 * WHILE/DO/END, G65/M98/M99, G52, G68) e gera o caminho XY da ferramenta.
 * É uma conferência de geometria e lógica: não substitui a simulação do comando.
 */
(function (root) {
  'use strict';

  var FUNCS = ['SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'SQRT', 'ABS', 'ROUND', 'FIX', 'FUP', 'LN', 'EXP', 'POW', 'ADP', 'BIN', 'BCD'];
  var OPS = ['EQ', 'NE', 'GT', 'GE', 'LT', 'LE', 'AND', 'OR', 'XOR', 'MOD'];
  var D2R = Math.PI / 180;

  function MacroError(msg) { this.message = msg; }

  /* ---------- tokenização de expressões ---------- */
  function tokenize(s) {
    var t = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
        if (!m) throw new MacroError('Número inválido em "' + s + '"');
        t.push({ k: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue;
      }
      if ('#[]+-*/,'.indexOf(c) >= 0) { t.push({ k: c }); i++; continue; }
      if (/[A-Z]/.test(c)) {
        var w = null, j;
        for (j = 0; j < FUNCS.length; j++) if (s.substr(i, FUNCS[j].length) === FUNCS[j]) { w = FUNCS[j]; break; }
        if (w && (w === 'ASIN' || w === 'ACOS' || w === 'ATAN')) { /* ok */ }
        else if (s.substr(i, 4) === 'ASIN' || s.substr(i, 4) === 'ACOS' || s.substr(i, 4) === 'ATAN') w = s.substr(i, 4);
        if (w) { t.push({ k: 'f', v: w }); i += w.length; continue; }
        for (j = 0; j < OPS.length; j++) if (s.substr(i, OPS[j].length) === OPS[j]) { w = OPS[j]; break; }
        if (w) { t.push({ k: 'o', v: w }); i += w.length; continue; }
        throw new MacroError('Texto não reconhecido na expressão: "' + s.slice(i, i + 6) + '"');
      }
      throw new MacroError('Caractere inválido "' + c + '"');
    }
    return t;
  }

  /* ---------- avaliação (descida recursiva) ---------- */
  function Evaluator(ctx) { this.ctx = ctx; }
  Evaluator.prototype.run = function (s) {
    this.t = tokenize(s); this.p = 0;
    var v = this.or();
    if (this.p < this.t.length) throw new MacroError('Sobrou texto na expressão "' + s + '"');
    return v;
  };
  Evaluator.prototype.peek = function () { return this.t[this.p]; };
  Evaluator.prototype.eat = function (k, v) {
    var x = this.t[this.p];
    if (x && x.k === k && (v === undefined || x.v === v)) { this.p++; return x; }
    return null;
  };
  Evaluator.prototype.need = function (k) { if (!this.eat(k)) throw new MacroError('Falta "' + k + '" na expressão'); };
  function num(v) { return v === null ? 0 : v; }
  Evaluator.prototype.or = function () {
    var a = this.and(), x;
    while ((x = this.eat('o', 'OR') || this.eat('o', 'XOR'))) {
      var b = this.and();
      a = x.v === 'OR' ? ((num(a) !== 0 || num(b) !== 0) ? 1 : 0) : ((num(a) !== 0) !== (num(b) !== 0) ? 1 : 0);
    }
    return a;
  };
  Evaluator.prototype.and = function () {
    var a = this.cmp();
    while (this.eat('o', 'AND')) { var b = this.cmp(); a = (num(a) !== 0 && num(b) !== 0) ? 1 : 0; }
    return a;
  };
  Evaluator.prototype.cmp = function () {
    var a = this.add(), x = this.peek();
    if (x && x.k === 'o' && ['EQ', 'NE', 'GT', 'GE', 'LT', 'LE'].indexOf(x.v) >= 0) {
      this.p++; var b = this.add();
      if (x.v === 'EQ') return (a === null || b === null) ? (a === b ? 1 : 0) : (Math.abs(a - b) < 1e-9 ? 1 : 0);
      if (x.v === 'NE') return (a === null || b === null) ? (a !== b ? 1 : 0) : (Math.abs(a - b) >= 1e-9 ? 1 : 0);
      a = num(a); b = num(b);
      if (x.v === 'GT') return a > b ? 1 : 0;
      if (x.v === 'GE') return a >= b ? 1 : 0;
      if (x.v === 'LT') return a < b ? 1 : 0;
      return a <= b ? 1 : 0;
    }
    return a;
  };
  Evaluator.prototype.add = function () {
    var a = this.mul(), x;
    while ((x = this.eat('+') || this.eat('-'))) { var b = this.mul(); a = x.k === '+' ? num(a) + num(b) : num(a) - num(b); }
    return a;
  };
  Evaluator.prototype.mul = function () {
    var a = this.unary(), x;
    while ((x = this.eat('*') || this.eat('/') || this.eat('o', 'MOD'))) {
      var b = this.unary();
      if (x.k === '*') a = num(a) * num(b);
      else if (x.k === '/') { if (num(b) === 0) throw new MacroError('Divisão por zero'); a = num(a) / num(b); }
      else { if (num(b) === 0) throw new MacroError('MOD por zero'); a = num(a) % num(b); }
    }
    return a;
  };
  Evaluator.prototype.unary = function () {
    if (this.eat('-')) { var v = this.unary(); return v === null ? null : -v; }
    if (this.eat('+')) return this.unary();
    return this.primary();
  };
  Evaluator.prototype.primary = function () {
    var x = this.peek();
    if (!x) throw new MacroError('Expressão incompleta');
    if (x.k === 'n') { this.p++; return x.v; }
    if (x.k === '#') { this.p++; var idx = this.primary(); return this.ctx.get(Math.round(num(idx))); }
    if (x.k === '[') { this.p++; var v = this.or(); this.need(']'); return v; }
    if (x.k === 'f') {
      this.p++; this.need('['); var a = num(this.or()); this.need(']');
      switch (x.v) {
        case 'SIN': return Math.sin(a * D2R);
        case 'COS': return Math.cos(a * D2R);
        case 'TAN': return Math.tan(a * D2R);
        case 'ASIN': if (a < -1 || a > 1) throw new MacroError('ASIN fora de -1..1 (' + a.toFixed(4) + ')'); return Math.asin(a) / D2R;
        case 'ACOS': if (a < -1 || a > 1) throw new MacroError('ACOS fora de -1..1 (' + a.toFixed(4) + ')'); return Math.acos(a) / D2R;
        case 'ATAN':
          if (this.peek() && this.peek().k === '/' && this.t[this.p + 1] && this.t[this.p + 1].k === '[') {
            this.p += 2; var b = num(this.or()); this.need(']');
            var ang = Math.atan2(a, b) / D2R; if (ang < 0) ang += 360; return ang;
          }
          if (this.eat(',')) { var b2 = num(this.or()); this.need(']'); var an2 = Math.atan2(a, b2) / D2R; return an2 < 0 ? an2 + 360 : an2; }
          return Math.atan(a) / D2R;
        case 'SQRT': if (a < 0) throw new MacroError('SQRT de número negativo'); return Math.sqrt(a);
        case 'ABS': return Math.abs(a);
        case 'ROUND': return Math.round(a);
        case 'FIX': return a < 0 ? Math.ceil(a) : Math.floor(a);
        case 'FUP': return a < 0 ? Math.floor(a) : Math.ceil(a);
        case 'LN': return Math.log(a);
        case 'EXP': return Math.exp(a);
        default: return a;
      }
    }
    throw new MacroError('Expressão inválida');
  };

  /* ---------- utilitários de texto ---------- */
  function clean(raw) {
    var s = String(raw).toUpperCase();
    var comment = (s.match(/\(([^)]*)\)/) || [])[1] || '';
    s = s.replace(/\([^)]*\)/g, '').replace(/;/g, '').replace(/\s+/g, '');
    if (s[0] === '/') s = s.slice(1);
    return { s: s, comment: comment.trim() };
  }
  function matchBracket(s, i) { // s[i] === '['
    var d = 0;
    for (var j = i; j < s.length; j++) { if (s[j] === '[') d++; else if (s[j] === ']') { d--; if (d === 0) return j; } }
    throw new MacroError('Colchete [ sem fechar');
  }

  function parsePrograms(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var progs = {}, order = [], cur = null;
    lines.forEach(function (raw, i) {
      var c = clean(raw), s = c.s;
      if (!s || s === '%') return;
      var m = s.match(/^O(\d{1,5})(.*)$/);
      if (m) {
        cur = { num: +m[1], lines: [], labels: {} }; progs[cur.num] = cur; order.push(cur.num);
        if (m[2]) cur.lines.push({ s: m[2], ln: i + 1, comment: c.comment });
        return;
      }
      if (!cur) { cur = { num: 0, lines: [], labels: {} }; progs[0] = cur; order.push(0); }
      var n = s.match(/^N(\d+)(.*)$/);
      if (n) { cur.labels[+n[1]] = cur.lines.length; s = n[2]; }
      cur.lines.push({ s: s, ln: i + 1, comment: c.comment });
    });
    return { progs: progs, order: order };
  }

  /* ---------- palavras NC ---------- */
  function parseWords(s, ev) {
    var words = {}, gs = [], i = 0;
    while (i < s.length) {
      var L = s[i];
      if (!/[A-Z]/.test(L)) throw new MacroError('Bloco não reconhecido perto de "' + s.slice(i, i + 8) + '"');
      i++;
      var start = i;
      if (s[i] === '-' || s[i] === '+') i++;
      if (s[i] === '#') {
        i++;
        if (s[i] === '[') i = matchBracket(s, i) + 1;
        else while (i < s.length && /[0-9]/.test(s[i])) i++;
      } else if (s[i] === '[') {
        i = matchBracket(s, i) + 1;
      } else {
        while (i < s.length && /[0-9.]/.test(s[i])) i++;
      }
      var vs = s.slice(start, i);
      var v = vs === '' ? 0 : ev.run(vs);
      if (L === 'G') gs.push(Math.round(num(v) * 10) / 10);
      else words[L] = v;
    }
    return { words: words, gs: gs };
  }

  /* ---------- execução ---------- */
  /* G41/G42: desloca o caminho programado pelo raio da ferramenta (lado esquerdo/direito do sentido do avanço).
   * Bloco que liga (G41/G42): começa no ponto programado e termina já deslocado; bloco do G40: sai deslocado e termina no ponto programado. */
  function compensate(segs, r) {
    var i = 0;
    while (i < segs.length) {
      if (!segs[i].cc) { i++; continue; }
      var j = i; while (j < segs.length && segs[j].cc && !(j > i && segs[j].ck === 'on')) j++;
      var ch = segs.slice(i, j), side = ch[0].cc === 41 ? 1 : -1, N = [];
      ch.forEach(function (q) { var dx = q.x2 - q.x1, dy = q.y2 - q.y1, L = Math.hypot(dx, dy); N.push(L > 1e-9 ? [-dy / L * side, dx / L * side] : null); });
      function nAt(k, dir) { for (var m = k; m >= 0 && m < N.length; m += dir) if (N[m]) return N[m]; return null; }
      var P = [];   // ponto deslocado no fim de cada segmento
      for (var k = 0; k < ch.length; k++) {
        var q = ch[k], a = N[k] || nAt(k, -1), b = nAt(k + 1, 1);
        if (q.ck === 'off' && (k === ch.length - 1 || !N[k + 1])) { P.push([q.x2, q.y2]); continue; }
        if (!a && !b) { P.push([q.x2, q.y2]); continue; }
        if (!a) a = b; if (!b || (ch[k + 1] && ch[k + 1].ck === 'off' && false)) b = b || a;
        var nextOff = k + 1 < ch.length && ch[k + 1].ck === 'off';
        if (nextOff) b = a;   // o G40 sai pela normal do último elemento
        var d = a[0] * b[0] + a[1] * b[1], mx, my;
        if (d > -0.95) { var f = r / (1 + d); mx = (a[0] + b[0]) * f; my = (a[1] + b[1]) * f; } else { mx = a[0] * r; my = a[1] * r; }
        P.push([q.x2 + mx, q.y2 + my]);
      }
      for (var k2 = 0; k2 < ch.length; k2++) {
        var s0 = ch[k2], st0 = k2 === 0 ? (s0.ck === 'on' ? [s0.x1, s0.y1] : [s0.x1 + (N[0] || [0, 0])[0] * r, s0.y1 + (N[0] || [0, 0])[1] * r]) : P[k2 - 1];
        s0.x1 = st0[0]; s0.y1 = st0[1]; s0.x2 = P[k2][0]; s0.y2 = P[k2][1];
      }
      // o movimento seguinte (sem compensação) sai de onde a ferramenta ficou
      if (j < segs.length && !segs[j].cc && ch.length) { var last = ch[ch.length - 1]; if (Math.hypot(segs[j].x1 - last.x2, segs[j].y1 - last.y2) < r * 2 + 1e-6) { segs[j].x1 = last.x2; segs[j].y1 = last.y2; } }
      i = j;
    }
  }
  function run(text, opts) {
    opts = opts || {};
    var maxBlocks = opts.maxBlocks || 400000, maxSegs = opts.maxSegs || 250000;
    var parsed = parsePrograms(text);
    var res = { segs: [], holes: [], feedDist: 0, rapidDist: 0, timeMin: 0, blocks: 0, zMin: null, zMax: null,
      errors: [], warnings: [], alarm: null, finished: false, calls: [] };
    if (!parsed.order.length) { res.errors.push('Programa vazio.'); return res; }

    var common = {};                           // #100–#999
    var frame = null, stack = [];
    var st = { x: 0, y: 0, z: 300, known: false, mode: 0, abs: true, canned: null, f: 0, cz: null, cr: null,
      g52x: 0, g52y: 0, rot: 0, rcx: 0, rcy: 0, s: 0, tool: 0, a: 0 };
    var warned = {};
    function warnOnce(k, m) { if (!warned[k]) { warned[k] = 1; res.warnings.push(m); } }

    var ctx = {
      get: function (n) {
        if (n === 0) return null;
        if (n >= 1 && n <= 33) return frame.locals[n] === undefined ? null : frame.locals[n];
        if (n >= 100 && n <= 999) return common[n] === undefined ? null : common[n];
        if (n >= 5001 && n <= 5003) return [st.x, st.y, st.z][n - 5001];
        warnOnce('sys' + n, 'Leitura da variável de sistema #' + n + ' foi simulada como vazia.');
        return null;
      },
      set: function (n, v, raw) {
        if (n >= 1 && n <= 33) { frame.locals[n] = v; return; }
        if (n >= 100 && n <= 999) { common[n] = v; return; }
        if (n === 3000) { res.alarm = { n: v, msg: raw.comment || '' }; throw 'STOP'; }
        if (n === 3006) { res.warnings.push('Parada com mensagem (#3006): ' + (raw.comment || '')); return; }
        if (n === 0) throw new MacroError('Não é possível gravar em #0');
        warnOnce('sysw' + n, 'Gravação na variável de sistema #' + n + ' foi ignorada na simulação.');
      }
    };
    var ev = new Evaluator(ctx);

    function newFrame(num, locals) {
      var p = parsed.progs[num];
      if (!p) throw new MacroError('Subprograma O' + ('0000' + num).slice(-4) + ' não encontrado. Inclua o sub no mesmo arquivo.');
      return { prog: p, pc: 0, locals: locals || [], loops: [] };
    }

    function toWork(px, py) { // coordenada programada -> G54 (aplica G68 e G52)
      var x = px, y = py;
      if (st.rot) {
        var a = st.rot * D2R, dx = x - st.rcx, dy = y - st.rcy;
        x = st.rcx + dx * Math.cos(a) - dy * Math.sin(a); y = st.rcy + dx * Math.sin(a) + dy * Math.cos(a);
      }
      return [x + st.g52x, y + st.g52y];
    }
    function fromWork(wx, wy) {
      var x = wx - st.g52x, y = wy - st.g52y;
      if (st.rot) {
        var a = -st.rot * D2R, dx = x - st.rcx, dy = y - st.rcy;
        x = st.rcx + dx * Math.cos(a) - dy * Math.sin(a); y = st.rcy + dx * Math.sin(a) + dy * Math.cos(a);
      }
      return [x, y];
    }
    function trackZ(z) {
      if (res.zMin === null || z < res.zMin) res.zMin = z;
      if (res.zMax === null || z > res.zMax) res.zMax = z;
    }
    function seg(x1, y1, x2, y2, t, z, ln, z1) {
      if (res.segs.length < maxSegs) res.segs.push({ x1: x1, y1: y1, x2: x2, y2: y2, t: t, z: z, z1: z1 === undefined ? z : z1, ln: ln,
        f: st.f, s: st.s, tool: st.tool, a: st.a, ox: st.g52x, oy: st.g52y, g: t === 'h' ? (st.canned || 81) : st.mode, prog: frame ? frame.prog.num : 0, cc: st.ccOff ? ccPrev : (st.cc || 0), ck: st.ccOn ? 'on' : st.ccOff ? 'off' : '', cb: st.ccBlk });
      else warnOnce('segs', 'Caminho muito longo: o desenho mostra só o começo.');
    }
    function lineMove(nx, ny, nz, t, ln) {
      var d = Math.sqrt((nx - st.x) * (nx - st.x) + (ny - st.y) * (ny - st.y) + (nz - st.z) * (nz - st.z));
      if (!st.known) { st.known = true; }
      else if (nx !== st.x || ny !== st.y || nz !== st.z) seg(st.x, st.y, nx, ny, t, nz, ln, st.z);
      if (t === 'r') res.rapidDist += d; else { res.feedDist += d; if (st.f > 0) res.timeMin += d / st.f; }
      st.x = nx; st.y = ny; st.z = nz; trackZ(nz);
    }
    function arcMove(cw, ex, ey, ez, ci, cj, ln) {
      var cx = st.x + ci, cy = st.y + cj;
      var r0 = Math.hypot(st.x - cx, st.y - cy), r1 = Math.hypot(ex - cx, ey - cy);
      if (r0 < 1e-9) throw new MacroError('Arco com raio zero (I e J zerados).');
      if (Math.abs(r0 - r1) > 0.02) throw new MacroError('Arco com raio diferente no início (' + r0.toFixed(3) + ') e no fim (' + r1.toFixed(3) + '): o FANUC dá alarme.');
      var a0 = Math.atan2(st.y - cy, st.x - cx), a1 = Math.atan2(ey - cy, ex - cx), sweep;
      if (cw) { sweep = a0 - a1; while (sweep <= 1e-9) sweep += 2 * Math.PI; }
      else { sweep = a1 - a0; while (sweep <= 1e-9) sweep += 2 * Math.PI; }
      if (Math.hypot(ex - st.x, ey - st.y) < 1e-6) sweep = 2 * Math.PI;
      var n = Math.max(8, Math.ceil(sweep / (6 * D2R))), z0 = st.z, px = st.x, py = st.y;
      for (var k = 1; k <= n; k++) {
        var a = a0 + (cw ? -1 : 1) * sweep * k / n;
        var qx = k === n ? ex : cx + r0 * Math.cos(a), qy = k === n ? ey : cy + r0 * Math.sin(a);
        seg(px, py, qx, qy, 'f', z0 + (ez - z0) * k / n, ln, z0 + (ez - z0) * (k - 1) / n); px = qx; py = qy;
      }
      var len = Math.sqrt(Math.pow(r0 * sweep, 2) + Math.pow(ez - z0, 2));
      res.feedDist += len; if (st.f > 0) res.timeMin += len / st.f;
      st.x = ex; st.y = ey; st.z = ez; trackZ(ez);
    }

    var ccPrev = 0;
    function nc(line) {
      st.ccBlk = (st.ccBlk || 0) + 1; ccPrev = st.cc || 0; st.ccOn = false; st.ccOff = false;
      var p = parseWords(line.s, ev), w = p.words, gs = p.gs;
      var motion = null, newCanned = false, skip = false, g52 = false, g68 = false, g65 = false;
      gs.forEach(function (g) {
        if (g === 0 || g === 1 || g === 2 || g === 3) { motion = g; st.canned = null; }
        else if (g === 90) st.abs = true;
        else if (g === 91) st.abs = false;
        else if (g === 80) st.canned = null;
        else if ((g >= 81 && g <= 89) || g === 73 || g === 74 || g === 76) { st.canned = g; newCanned = true; }
        else if (g === 52) g52 = true;
        else if (g === 68) g68 = true;
        else if (g === 69) st.rot = 0;
        else if (g === 65) g65 = true;
        else if (g === 28 || g === 30 || g === 53 || g === 4 || g === 10 || g === 92) skip = true;
        else if (g === 41 || g === 42) { if (st.cc !== g) { st.ccOn = true; } st.cc = g; }
        else if (g === 40) { if (st.cc) st.ccOff = true; st.cc = 0; }
        else if (g === 17 || g === 21 || g === 94 || g === 98 || g === 99 || g === 43 || g === 49 || (g >= 54 && g <= 59)) { /* modal sem efeito no desenho */ }
        else if (g === 18 || g === 19) warnOnce('plane', 'G18/G19 (outro plano) não é desenhado.');
        else if (g === 20) warnOnce('inch', 'G20 (polegada) não é tratado.');
      });
      if (w.F !== undefined && w.F !== null) st.f = num(w.F);
      if (g65) {
        if (w.P === undefined) throw new MacroError('G65 sem P.');
        var locals = [], map = { A: 1, B: 2, C: 3, I: 4, J: 5, K: 6, D: 7, E: 8, F: 9, H: 11, M: 13, Q: 17, R: 18, S: 19, T: 20, U: 21, V: 22, W: 23, X: 24, Y: 25, Z: 26 };
        Object.keys(w).forEach(function (k) { if (map[k]) locals[map[k]] = w[k]; });
        var pnum = Math.round(num(w.P));
        res.calls.push(pnum);
        stack.push(frame); frame = newFrame(pnum, locals);
        if (stack.length > 5) throw new MacroError('Chamadas de macro aninhadas demais (máximo 5 níveis no simulador).');
        return;
      }
      if (w.S !== undefined && w.S !== null) st.s = num(w.S);
      if (w.T !== undefined && w.T !== null) st.tool = Math.round(num(w.T));
      if (w.A !== undefined && w.A !== null) st.a = st.abs ? num(w.A) : st.a + num(w.A);
      if (w.M !== undefined && w.M !== null) {
        var mm = Math.round(num(w.M));
        if (mm === 98) { var sp = Math.round(num(w.P)); stack.push(frame); var f2 = newFrame(sp, frame.locals); frame = f2; return; }
        if (mm === 99) { ret(); return; }
        if (mm === 30 || mm === 2) { res.finished = true; throw 'STOP'; }
        if (mm === 0 || mm === 1) warnOnce('m0', 'M00/M01 no programa: a máquina para nesse ponto.');
      }
      if (g52) {
        if (w.X !== undefined) st.g52x = num(w.X);
        if (w.Y !== undefined) st.g52y = num(w.Y);
        return;
      }
      if (g68) {
        st.rcx = w.X !== undefined ? num(w.X) : 0; st.rcy = w.Y !== undefined ? num(w.Y) : 0; st.rot = w.R !== undefined ? num(w.R) : 0;
        warnOnce('g68', 'G68 (rotação) é opcional no comando: confirme se a sua máquina tem.');
        return;
      }
      if (skip) return;
      if (motion !== null) st.mode = motion;

      // destino
      var cur = fromWork(st.x, st.y), px = cur[0], py = cur[1];
      var hasXY = w.X !== undefined || w.Y !== undefined;
      if (w.X !== undefined) px = st.abs ? num(w.X) : px + num(w.X);
      if (w.Y !== undefined) py = st.abs ? num(w.Y) : py + num(w.Y);
      var wk = toWork(px, py), nx = wk[0], ny = wk[1];

      if (st.canned) {
        if (w.Z !== undefined) st.cz = num(w.Z);
        if (w.R !== undefined) st.cr = num(w.R);
        if (hasXY || newCanned) {
          if (hasXY) lineMove(nx, ny, st.z, 'r', line.ln);
          res.holes.push({ x: st.x, y: st.y, ln: line.ln });
          if (st.cz !== null) seg(st.x, st.y, st.x, st.y, 'h', st.cz, line.ln, st.cr !== null ? st.cr : st.z);
          if (st.cz !== null) {
            trackZ(st.cz);
            if (st.cr !== null) { var dd = Math.abs(st.cr - st.cz); res.feedDist += dd; if (st.f > 0) res.timeMin += dd / st.f; }
          }
          if (st.cz === null) throw new MacroError('Ciclo fixo sem Z.');
        }
        return;
      }

      var nz = st.z;
      if (w.Z !== undefined) nz = st.abs ? num(w.Z) : st.z + num(w.Z);
      if (!hasXY && w.Z === undefined) return;
      if (st.mode === 2 || st.mode === 3) {
        if (w.R !== undefined && w.I === undefined && w.J === undefined) {
          // formato R: calcula centro
          var r = num(w.R), dx = nx - st.x, dy = ny - st.y, dl = Math.hypot(dx, dy);
          if (dl < 1e-9) throw new MacroError('Círculo completo com R não é permitido. Use I/J.');
          var h2 = r * r - dl * dl / 4; if (h2 < -1e-6) throw new MacroError('Raio R pequeno demais para esse arco.');
          var h = Math.sqrt(Math.max(0, h2)), mx = (st.x + nx) / 2, my = (st.y + ny) / 2;
          var sgn = ((st.mode === 2) ? 1 : -1) * (r > 0 ? 1 : -1);
          var ccx = mx + sgn * h * dy / dl, ccy = my - sgn * h * dx / dl;
          arcMove(st.mode === 2, nx, ny, nz, ccx - st.x, ccy - st.y, line.ln);
        } else {
          var ii = w.I !== undefined ? num(w.I) : 0, jj = w.J !== undefined ? num(w.J) : 0;
          if (st.rot) { var a = st.rot * D2R, ri = ii * Math.cos(a) - jj * Math.sin(a), rj = ii * Math.sin(a) + jj * Math.cos(a); ii = ri; jj = rj; }
          arcMove(st.mode === 2, nx, ny, nz, ii, jj, line.ln);
        }
      } else {
        lineMove(nx, ny, nz, st.mode === 0 ? 'r' : 'f', line.ln);
      }
    }

    function ret() {
      if (!stack.length) { res.finished = true; throw 'STOP'; }
      frame = stack.pop();
    }
    function jump(n) {
      var idx = frame.prog.labels[Math.round(num(n))];
      if (idx === undefined) throw new MacroError('GOTO' + Math.round(num(n)) + ': sequência N' + Math.round(num(n)) + ' não existe.');
      frame.pc = idx;
    }
    function assign(s, line) {
      var depth = 0, eq = -1;
      for (var i = 0; i < s.length; i++) { if (s[i] === '[') depth++; else if (s[i] === ']') depth--; else if (s[i] === '=' && depth === 0) { eq = i; break; } }
      if (eq < 0) throw new MacroError('Atribuição sem "=".');
      var lhs = s.slice(1, eq), n = Math.round(num(ev.run(lhs.replace(/^\[(.*)\]$/, '$1'))));
      var v = ev.run(s.slice(eq + 1));
      ctx.set(n, v, line);
    }
    function exec(line) {
      var s = line.s;
      if (!s) return;
      if (s.indexOf('IF[') === 0) {
        var e = matchBracket(s, 2), cond = num(ev.run(s.slice(3, e))) !== 0, rest = s.slice(e + 1);
        if (rest.indexOf('GOTO') === 0) { if (cond) jump(ev.run(rest.slice(4))); return; }
        if (rest.indexOf('THEN') === 0) { if (cond) { var r = rest.slice(4); if (r[0] === '#') assign(r, line); else nc({ s: r, ln: line.ln, comment: line.comment }); } return; }
        throw new MacroError('IF sem GOTO ou THEN.');
      }
      if (s.indexOf('WHILE[') === 0) {
        var e2 = matchBracket(s, 5), c2 = num(ev.run(s.slice(6, e2))) !== 0;
        var dm = s.slice(e2 + 1).match(/^DO(\d)$/); if (!dm) throw new MacroError('WHILE sem DOn.');
        if (c2) { frame.loops.push({ n: +dm[1], pc: frame.pc - 1 }); }
        else {
          var depth = 0;
          for (var k = frame.pc; k < frame.prog.lines.length; k++) {
            var ls = frame.prog.lines[k].s;
            if (/^WHILE\[/.test(ls) && new RegExp('DO' + dm[1] + '$').test(ls)) depth++;
            if (ls === 'END' + dm[1]) { if (depth === 0) { frame.pc = k + 1; return; } depth--; }
          }
          throw new MacroError('WHILE DO' + dm[1] + ' sem END' + dm[1] + '.');
        }
        return;
      }
      var em = s.match(/^END(\d)$/);
      if (em) {
        var lp = frame.loops.pop();
        if (!lp || lp.n !== +em[1]) throw new MacroError('END' + em[1] + ' sem WHILE correspondente.');
        frame.pc = lp.pc; return;
      }
      if (s.indexOf('GOTO') === 0) { jump(ev.run(s.slice(4))); return; }
      if (s[0] === '#') { assign(s, line); return; }
      nc(line);
    }

    try {
      frame = newFrame(parsed.order[0]);
      while (true) {
        if (frame.pc >= frame.prog.lines.length) {
          if (stack.length) { res.warnings.push('O' + frame.prog.num + ' terminou sem M99.'); ret(); continue; }
          res.warnings.push('O programa terminou sem M30.'); break;
        }
        var line = frame.prog.lines[frame.pc++];
        if (++res.blocks > maxBlocks) { res.errors.push('Parou depois de ' + maxBlocks + ' blocos: provável laço infinito (confira o IF/GOTO e o incremento).'); break; }
        try { exec(line); }
        catch (e) {
          if (e === 'STOP') throw e;
          var msg = e instanceof MacroError ? e.message : String(e && e.message || e);
          res.errors.push('O' + ('0000' + frame.prog.num).slice(-4) + ' linha ' + line.ln + ': ' + msg);
          break;
        }
      }
    } catch (e) {
      if (e !== 'STOP') res.errors.push(e instanceof MacroError ? e.message : String(e && e.message || e));
    }
    res.vars = { common: common };
    if (opts.toolR > 0) compensate(res.segs, opts.toolR);
    return res;
  }

  // calculadora do editor: avalia uma expressão no formato FANUC (SIN[30] * 10, [100 - 16] / 2 ...)
  function evalExpr(expr, vars) {
    vars = vars || {};
    var ev = new Evaluator({ get: function (n) { return vars[n] === undefined ? null : vars[n]; } });
    var s = String(expr).toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
    return ev.run(s);
  }
  var api = { run: run, parsePrograms: parsePrograms, evalExpr: evalExpr };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MacroSim = api;
})(this);
