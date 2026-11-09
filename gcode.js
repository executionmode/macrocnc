/* Motor de G-code / Macro B FANUC — Macro CNC
 * Todas as coordenadas saem com ponto decimal (evita leitura em menor incremento).
 */
(function (root) {
  'use strict';

  function fmt(n, dec) {
    dec = dec == null ? 3 : dec;
    if (!isFinite(n)) return 'NaN';
    var s = (Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec);
    s = s.replace(/0+$/, '');
    if (s === '-0.') s = '0.';
    return s;
  }
  function int(n) { return String(Math.round(Number(n))); }
  function pad4(n) { var s = int(n); while (s.length < 4) s = '0' + s; return s; }
  function ascii(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9 .,\-+\/=]/g, '');
  }

  /* ---------- Cabeçalho / rodapé comuns ---------- */
  var COMMON_FIELDS = [
    { key: 'prog', label: 'Número do programa (O)', def: 1000, int: true, group: 'Programa' },
    { key: 'tool', label: 'Ferramenta (T)', def: 1, int: true, group: 'Programa' },
    { key: 'h', label: 'Corretor de altura (H)', def: 1, int: true, group: 'Programa' },
    { key: 'wcs', label: 'Zero-peça (G54–G59)', def: 54, int: true, min: 54, max: 59, group: 'Programa' },
    { key: 'rpm', label: 'Rotação S (rpm)', def: 1000, int: true, min: 1, group: 'Programa' },
    { key: 'feed', label: 'Avanço F (mm/min)', def: 100, min: 0.001, group: 'Programa' },
    { key: 'zs', label: 'Z de segurança', def: 50, group: 'Programa' },
    { key: 'cool', label: 'Refrigeração (1=sim, 0=não)', def: 1, int: true, min: 0, max: 1, group: 'Programa' }
  ];

  function header(p, title, x0, y0) {
    return [
      '%',
      'O' + pad4(p.prog) + ' (' + ascii(title) + ')',
      '(GERADO PELO MACRO CNC - CONFIRA ANTES DE USINAR)',
      'G21 G17 G40 G49 G80 G90',
      'T' + int(p.tool) + ' M06',
      'G' + int(p.wcs) + ' G00 X' + fmt(x0) + ' Y' + fmt(y0),
      'S' + int(p.rpm) + ' M03',
      'G43 H' + int(p.h) + ' Z' + fmt(p.zs) + (p.cool ? ' M08' : '')
    ];
  }
  function footer(p) {
    return [
      'G80 G00 Z' + fmt(p.zs) + (p.cool ? ' M09' : ''),
      'G91 G28 Z0.',
      'G90',
      'M05',
      'M30'
    ];
  }

  function checkCommon(p, errs) {
    if (p.prog < 1 || p.prog > 9999) errs.push('Número do programa deve ser entre 1 e 9999.');
    if (p.wcs < 54 || p.wcs > 59) errs.push('Zero-peça deve ser de 54 a 59.');
    if (p.feed <= 0) errs.push('Avanço F deve ser maior que zero.');
    if (p.rpm <= 0) errs.push('Rotação S deve ser maior que zero.');
  }

  /* ---------- Furação: geometria compartilhada ---------- */
  var DRILL_FIELDS = [
    { key: 'z', label: 'Z fundo do furo', def: -10, group: 'Ciclo' },
    { key: 'r', label: 'Plano R (aproximação)', def: 2, group: 'Ciclo' },
    { key: 'q', label: 'Pica-pau Q (0 = G81 direto)', def: 0, min: 0, group: 'Ciclo' },
    { key: 'macro', label: 'Nº do subprograma macro', def: 9010, int: true, group: 'Macro' }
  ];
  function checkDrill(p, errs) {
    if (p.z >= p.r) errs.push('Z fundo deve ser menor que o plano R.');
    if (p.r >= p.zs) errs.push('Plano R deve ser menor que o Z de segurança.');
    if (p.q < 0) errs.push('Q não pode ser negativo.');
  }
  function drillBlocks(p, pts) {
    var cyc = p.q > 0 ? 'G83' : 'G81';
    var out = [];
    pts.forEach(function (pt, i) {
      if (i === 0) {
        out.push('G98 ' + cyc + ' X' + fmt(pt.x) + ' Y' + fmt(pt.y) + ' Z' + fmt(p.z) +
          ' R' + fmt(p.r) + (p.q > 0 ? ' Q' + fmt(p.q) : '') + ' F' + fmt(p.feed));
      } else {
        out.push('X' + fmt(pt.x) + ' Y' + fmt(pt.y));
      }
    });
    return out;
  }
  function drillArgsTail(p) {
    return ' Z' + fmt(p.z) + ' R' + fmt(p.r) + ' F' + fmt(p.feed) + (p.q > 0 ? ' Q' + fmt(p.q) : '');
  }

  /* ---------- Template 1: Furação circular ---------- */
  var circle = {
    id: 'circular',
    name: 'Furação circular',
    desc: 'Furos igualmente espaçados num diâmetro (flange, tampa).',
    defaults: { prog: 1000, macro: 9010 },
    fields: [
      { key: 'cx', label: 'X centro', def: 0, group: 'Geometria' },
      { key: 'cy', label: 'Y centro', def: 0, group: 'Geometria' },
      { key: 'raio', label: 'Raio do círculo', def: 40, min: 0.001, group: 'Geometria' },
      { key: 'n', label: 'Número de furos', def: 6, int: true, min: 1, group: 'Geometria' },
      { key: 'ang', label: 'Ângulo do 1º furo (graus)', def: 0, group: 'Geometria' }
    ].concat(DRILL_FIELDS),
    check: function (p, errs) {
      checkDrill(p, errs);
      if (p.n < 1) errs.push('Número de furos deve ser pelo menos 1.');
      if (p.raio <= 0) errs.push('Raio deve ser maior que zero.');
    },
    points: function (p) {
      var pts = [];
      for (var i = 0; i < p.n; i++) {
        var a = (p.ang + i * 360 / p.n) * Math.PI / 180;
        pts.push({ x: p.cx + p.raio * Math.cos(a), y: p.cy + p.raio * Math.sin(a) });
      }
      return pts;
    },
    expanded: function (p) {
      var pts = this.points(p);
      return header(p, 'FURACAO CIRCULAR ' + int(p.n) + ' FUROS', pts[0].x, pts[0].y)
        .concat(drillBlocks(p, pts), footer(p), ['%']);
    },
    macro: function (p) {
      var main = header(p, 'FURACAO CIRCULAR - MACRO', p.cx, p.cy).concat([
        'G65 P' + pad4(p.macro) + ' X' + fmt(p.cx) + ' Y' + fmt(p.cy) + ' I' + fmt(p.raio) +
          ' A' + fmt(p.ang) + ' H' + fmt(p.n) + drillArgsTail(p)
      ], footer(p));
      var sub = [
        'O' + pad4(p.macro) + ' (FURACAO CIRCULAR)',
        '(X Y=CENTRO I=RAIO A=ANG INICIAL H=N FUROS)',
        '(Z=FUNDO R=PLANO R F=AVANCO Q=PICA OPCIONAL)',
        'IF[#11LE0]GOTO9001',
        'IF[#9EQ#0]GOTO9002',
        '#30=0',
        'WHILE[#30LT#11]DO1',
        '#31=#1+#30*360/#11',
        '#32=#24+#4*COS[#31]',
        '#33=#25+#4*SIN[#31]',
        'IF[#17EQ#0]GOTO10',
        'G98 G83 X#32 Y#33 Z#26 R#18 Q#17 F#9',
        'GOTO20',
        'N10 G98 G81 X#32 Y#33 Z#26 R#18 F#9',
        'N20 #30=#30+1',
        'END1',
        'G80',
        'M99',
        'N9001 #3000=1(N FUROS INVALIDO)',
        'N9002 #3000=2(FALTA AVANCO F)'
      ];
      return main.concat(sub, ['%']);
    }
  };

  /* ---------- Template 2: Furação em grade ---------- */
  var grid = {
    id: 'grade',
    name: 'Furação em grade / linha',
    desc: 'Matriz de furos (colunas × linhas), percorrida em zigue-zague. Use 1 linha para furação em linha.',
    defaults: { prog: 1001, macro: 9011 },
    fields: [
      { key: 'x0', label: 'X do 1º furo', def: 10, group: 'Geometria' },
      { key: 'y0', label: 'Y do 1º furo', def: 10, group: 'Geometria' },
      { key: 'px', label: 'Passo em X', def: 20, group: 'Geometria' },
      { key: 'py', label: 'Passo em Y', def: 20, group: 'Geometria' },
      { key: 'nc', label: 'Colunas (em X)', def: 4, int: true, min: 1, group: 'Geometria' },
      { key: 'nl', label: 'Linhas (em Y)', def: 3, int: true, min: 1, group: 'Geometria' }
    ].concat(DRILL_FIELDS),
    check: function (p, errs) {
      checkDrill(p, errs);
      if (p.nc < 1 || p.nl < 1) errs.push('Colunas e linhas devem ser pelo menos 1.');
    },
    points: function (p) {
      var pts = [];
      for (var l = 0; l < p.nl; l++) {
        for (var c = 0; c < p.nc; c++) {
          var cc = (l % 2 === 0) ? c : (p.nc - 1 - c);
          pts.push({ x: p.x0 + cc * p.px, y: p.y0 + l * p.py });
        }
      }
      return pts;
    },
    expanded: function (p) {
      var pts = this.points(p);
      return header(p, 'FURACAO GRADE ' + int(p.nc) + 'X' + int(p.nl), pts[0].x, pts[0].y)
        .concat(drillBlocks(p, pts), footer(p), ['%']);
    },
    macro: function (p) {
      var main = header(p, 'FURACAO GRADE - MACRO', p.x0, p.y0).concat([
        'G65 P' + pad4(p.macro) + ' X' + fmt(p.x0) + ' Y' + fmt(p.y0) + ' I' + fmt(p.px) +
          ' J' + fmt(p.py) + ' U' + fmt(p.nc) + ' V' + fmt(p.nl) + drillArgsTail(p)
      ], footer(p));
      var sub = [
        'O' + pad4(p.macro) + ' (FURACAO EM GRADE)',
        '(X Y=1O FURO I J=PASSOS U=COLUNAS V=LINHAS)',
        '(Z=FUNDO R=PLANO R F=AVANCO Q=PICA OPCIONAL)',
        'IF[#21LE0]GOTO9001',
        'IF[#22LE0]GOTO9001',
        'IF[#9EQ#0]GOTO9002',
        '#28=0',
        '#30=0',
        'WHILE[#30LT#22]DO1',
        '#31=0',
        'WHILE[#31LT#21]DO2',
        '#27=#31',
        'IF[#28EQ0]GOTO5',
        '#27=#21-1-#31',
        'N5 #32=#24+#27*#4',
        '#33=#25+#30*#5',
        'IF[#17EQ#0]GOTO10',
        'G98 G83 X#32 Y#33 Z#26 R#18 Q#17 F#9',
        'GOTO20',
        'N10 G98 G81 X#32 Y#33 Z#26 R#18 F#9',
        'N20 #31=#31+1',
        'END2',
        '#28=1-#28',
        '#30=#30+1',
        'END1',
        'G80',
        'M99',
        'N9001 #3000=1(COLUNAS OU LINHAS INVALIDO)',
        'N9002 #3000=2(FALTA AVANCO F)'
      ];
      return main.concat(sub, ['%']);
    }
  };

  /* ---------- Template 3: Faceamento ---------- */
  function facePlan(p) {
    var stepMax = p.d * p.k / 100;
    var n = Math.ceil(p.w / stepMax - 1e-9);
    if (n < 1) n = 1;
    var step = p.w / n;
    var xa = p.x0 - p.d / 2 - 5, xb = p.x0 + p.l + p.d / 2 + 5;
    var layers = [];
    var z = p.ztop;
    var guard = 0;
    while (z > p.zf + 0.001 && guard++ < 500) {
      z = z - p.ap;
      if (z < p.zf) z = p.zf;
      layers.push(z);
    }
    return { n: n, step: step, xa: xa, xb: xb, layers: layers };
  }
  var face = {
    id: 'faceamento',
    name: 'Faceamento',
    desc: 'Zigue-zague em X com passes em Y e desbaste em várias profundidades. Entrada fora da peça.',
    defaults: { prog: 1002, macro: 9012, feed: 800, rpm: 2500 },
    fields: [
      { key: 'x0', label: 'X canto da peça', def: 0, group: 'Geometria' },
      { key: 'y0', label: 'Y canto da peça', def: 0, group: 'Geometria' },
      { key: 'l', label: 'Comprimento em X', def: 100, min: 0.001, group: 'Geometria' },
      { key: 'w', label: 'Largura em Y', def: 60, min: 0.001, group: 'Geometria' },
      { key: 'd', label: 'Diâmetro da fresa', def: 50, min: 0.001, group: 'Ferramenta' },
      { key: 'k', label: 'Passo lateral (% do diâmetro)', def: 70, min: 1, max: 100, group: 'Ferramenta' },
      { key: 'ztop', label: 'Z do topo bruto', def: 1, group: 'Profundidade' },
      { key: 'zf', label: 'Z final', def: 0, group: 'Profundidade' },
      { key: 'ap', label: 'Profundidade por passe', def: 0.5, min: 0.001, group: 'Profundidade' },
      { key: 'macro', label: 'Nº do subprograma macro', def: 9012, int: true, group: 'Macro' }
    ],
    check: function (p, errs) {
      if (p.l <= 0 || p.w <= 0) errs.push('Comprimento e largura devem ser maiores que zero.');
      if (p.d <= 0) errs.push('Diâmetro da fresa deve ser maior que zero.');
      if (p.k <= 0 || p.k > 100) errs.push('Passo lateral deve ser entre 1 e 100%.');
      if (p.ap <= 0) errs.push('Profundidade por passe deve ser maior que zero.');
      if (p.zf >= p.ztop) errs.push('Z final deve ser menor que o Z do topo.');
      if (p.ztop + 5 >= p.zs) errs.push('Z de segurança deve ficar acima de Z topo + 5.');
      if ((p.ztop - p.zf) / p.ap > 200) errs.push('Passes demais (mais de 200). Aumente a profundidade por passe.');
    },
    expanded: function (p) {
      var pl = facePlan(p);
      var out = header(p, 'FACEAMENTO', pl.xa, p.y0);
      pl.layers.forEach(function (z, li) {
        out.push('(PASSE Z' + fmt(z) + ')');
        if (li > 0) out.push('G00 X' + fmt(pl.xa) + ' Y' + fmt(p.y0));
        out.push('G00 Z' + fmt(z + 2));
        out.push('G01 Z' + fmt(z) + ' F' + fmt(p.feed));
        var dir = 1;
        for (var i = 0; i <= pl.n; i++) {
          var y = p.y0 + i * pl.step;
          if (i > 0) out.push('G01 Y' + fmt(y));
          out.push('G01 X' + fmt(dir > 0 ? pl.xb : pl.xa));
          dir = -dir;
        }
        out.push('G00 Z' + fmt(p.ztop + 5));
      });
      return out.concat(footer(p), ['%']);
    },
    macro: function (p) {
      var pl = facePlan(p);
      var main = header(p, 'FACEAMENTO - MACRO', pl.xa, p.y0).concat([
        'G65 P' + pad4(p.macro) + ' X' + fmt(p.x0) + ' Y' + fmt(p.y0) + ' U' + fmt(p.l) +
          ' V' + fmt(p.w) + ' D' + fmt(p.d) + ' K' + fmt(p.k) + ' C' + fmt(p.ztop) +
          ' Z' + fmt(p.zf) + ' W' + fmt(p.ap) + ' F' + fmt(p.feed)
      ], footer(p));
      var sub = [
        'O' + pad4(p.macro) + ' (FACEAMENTO ZIGUE-ZAGUE)',
        '(X Y=CANTO U=COMPR X V=LARG Y D=DIAM FRESA)',
        '(K=PASSO % C=Z TOPO Z=Z FINAL W=PROF PASSE F)',
        'IF[#7LE0]GOTO9001',
        'IF[#6LE0]GOTO9001',
        'IF[#22LE0]GOTO9001',
        'IF[#23LE0]GOTO9002',
        'IF[#9EQ#0]GOTO9003',
        '#1=FUP[#22/[#7*#6/100]]',
        '#2=#22/#1',
        '#4=#24-#7/2-5.',
        '#5=#24+#21+#7/2+5.',
        '#8=#3',
        'WHILE[#8GT[#26+0.001]]DO1',
        '#8=#8-#23',
        'IF[#8GE#26]GOTO5',
        '#8=#26',
        'N5 G00 X#4 Y#25',
        'G00 Z[#8+2.]',
        'G01 Z#8 F#9',
        '#10=0',
        '#13=1',
        'WHILE[#10LE#1]DO2',
        '#12=#25+#10*#2',
        'G01 Y#12',
        '#14=#4',
        'IF[#13LT0]GOTO6',
        '#14=#5',
        'N6 G01 X#14',
        '#13=-#13',
        '#10=#10+1',
        'END2',
        'G00 Z[#3+5.]',
        'END1',
        'M99',
        'N9001 #3000=1(DIMENSAO INVALIDA)',
        'N9002 #3000=2(W PROF POR PASSE INVALIDA)',
        'N9003 #3000=3(FALTA AVANCO F)'
      ];
      return main.concat(sub, ['%']);
    }
  };

  var TEMPLATES = [circle, grid, face];

  function allFields(t) { return COMMON_FIELDS.concat(t.fields); }

  function readParams(t, raw) {
    var p = {}, errs = [];
    allFields(t).forEach(function (f) {
      var v = raw[f.key];
      if (v === undefined || v === '' || v === null) {
        v = (t.defaults && t.defaults[f.key] !== undefined) ? t.defaults[f.key] : f.def;
      }
      var n = Number(String(v).replace(',', '.'));
      if (!isFinite(n)) { errs.push(f.label + ': valor inválido.'); n = 0; }
      if (f.int && Math.round(n) !== n) errs.push(f.label + ': use número inteiro.');
      if (f.min !== undefined && n < f.min) errs.push(f.label + ': mínimo ' + f.min + '.');
      if (f.max !== undefined && n > f.max) errs.push(f.label + ': máximo ' + f.max + '.');
      p[f.key] = n;
    });
    return { p: p, errs: errs };
  }

  function generate(t, raw, mode) {
    var r = readParams(t, raw);
    checkCommon(r.p, r.errs);
    t.check(r.p, r.errs);
    if (r.errs.length) return { ok: false, errors: r.errs };
    var code = (mode === 'macro' ? t.macro(r.p) : t.expanded(r.p)).join('\n');
    var preview = t.expanded(r.p).join('\n');
    return { ok: true, code: code, preview: preview, params: r.p };
  }

  /* ---------- Validador ---------- */
  function stripComments(line) { return line.replace(/\([^)]*\)/g, ''); }

  function validate(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var issues = [];
    function add(level, ln, msg) { issues.push({ level: level, line: ln, msg: msg }); }
    var nonEmpty = lines.map(function (l, i) { return { t: l.trim(), i: i + 1 }; }).filter(function (o) { return o.t; });
    if (!nonEmpty.length) { add('erro', 0, 'Programa vazio.'); return issues; }
    if (nonEmpty[0].t !== '%') add('aviso', nonEmpty[0].i, 'O programa normalmente começa com "%".');
    if (nonEmpty[nonEmpty.length - 1].t !== '%') add('aviso', nonEmpty[nonEmpty.length - 1].i, 'O programa normalmente termina com "%".');
    if (!/^\s*O\d{1,4}/m.test(text) && !/^\s*<[^>]+>/m.test(text)) add('aviso', 0, 'Nenhum número de programa (O####) encontrado.');

    var labels = {}, gotos = [], stack = [];
    var hasEnd = false, hasT = false, hasG43 = false, feedSet = false, inCanned = false;

    lines.forEach(function (raw, idx) {
      var ln = idx + 1;
      var line = raw.trim().toUpperCase();
      if (!line || line === '%') return;
      var open = (line.match(/\(/g) || []).length, close = (line.match(/\)/g) || []).length;
      if (open !== close) add('erro', ln, 'Parênteses de comentário não fecham.');
      var code = stripComments(line);
      var ob = (code.match(/\[/g) || []).length, cb = (code.match(/\]/g) || []).length;
      if (ob !== cb) add('erro', ln, 'Colchetes [ ] desbalanceados.');

      var nm = code.match(/^N(\d+)/);
      if (nm) { if (labels[nm[1]]) add('aviso', ln, 'Sequência N' + nm[1] + ' repetida (GOTO pode ir para a errada).'); labels[nm[1]] = ln; }

      if (/^O\d+/.test(code)) {
        // novo programa no mesmo arquivo: reinicia rótulos e laços
        if (stack.length) add('erro', stack[stack.length - 1].ln, 'WHILE...DO' + stack[stack.length - 1].n + ' sem END antes do próximo programa.');
        stack = []; resolveGotos(); labels = {}; gotos = []; feedSet = false; inCanned = false;
        return;
      }

      var w = code.match(/WHILE\s*\[.*\]\s*DO\s*(\d+)/);
      if (w) {
        var n = +w[1];
        if (n < 1 || n > 3) add('erro', ln, 'Número do DO deve ser 1, 2 ou 3.');
        if (stack.some(function (s) { return s.n === n; })) add('erro', ln, 'DO' + n + ' já está aberto (laço aninhado com o mesmo número).');
        stack.push({ n: n, ln: ln });
      } else if (/WHILE/.test(code)) add('erro', ln, 'WHILE sem "DOn".');
      var e = code.match(/(?:^|[^A-Z])END\s*(\d+)/);
      if (e) {
        var top = stack.pop();
        if (!top) add('erro', ln, 'END' + e[1] + ' sem WHILE correspondente.');
        else if (top.n !== +e[1]) add('erro', ln, 'END' + e[1] + ' fecha o laço DO' + top.n + ' (linha ' + top.ln + ').');
      }
      if (/(^|[^A-Z])IF\s*\[/.test(code) && !/GOTO|THEN/.test(code)) add('erro', ln, 'IF sem GOTO ou THEN.');
      var g = code.match(/GOTO\s*(\d+)/);
      if (g) gotos.push({ n: g[1], ln: ln });

      var wr = code.match(/#(\d+)\s*=/);
      if (wr) {
        var v = +wr[1];
        if (v >= 500 && v <= 999) add('aviso', ln, '#' + v + ' é variável permanente: o valor fica salvo mesmo desligando a máquina.');
        if (v >= 1000 && v !== 3000 && v !== 3006) add('aviso', ln, '#' + v + ' é variável de sistema. Confira no manual antes de escrever nela.');
      }

      if (/M0?6(\D|$)/.test(code)) hasT = true;
      if (/G43/.test(code)) hasG43 = true;
      if (/M30|M99|M0?2(\D|$)/.test(code)) hasEnd = true;
      if (/F[\d.#\[]/.test(code)) feedSet = true;
      if (/G8[1-9]/.test(code)) inCanned = true;
      if (/G80/.test(code)) inCanned = false;
      if (/G0?1(\D|$)|G8[1-9]/.test(code) && !feedSet && !/G65/.test(code)) add('erro', ln, 'Movimento de corte sem avanço F definido antes.');
      if (/G83/.test(code) && !/Q/.test(code)) add('erro', ln, 'G83 sem Q (profundidade do pica-pau).');
      if (/G8[1-9]/.test(code) && !/R/.test(code)) add('aviso', ln, 'Ciclo fixo sem R (usa o R anterior).');

      if (!/G65|#|\[/.test(code)) {
        var re = /([XYZIJKR])(-?\d+)(?![\d.])/g, m;
        while ((m = re.exec(code))) {
          if (/G0?4/.test(code)) break;
          if (Number(m[2]) === 0) continue;
          add('aviso', ln, m[1] + m[2] + ' sem ponto decimal: pode ser lido como ' + (Number(m[2]) / 1000) + ' mm (menor incremento). Escreva "' + m[1] + m[2] + '."');
        }
      }
    });
    if (stack.length) stack.forEach(function (s) { add('erro', s.ln, 'WHILE...DO' + s.n + ' sem END' + s.n + '.'); });
    resolveGotos();
    if (!hasEnd) add('aviso', 0, 'Nenhum M30 / M99 / M02 encontrado.');
    if (hasT && !hasG43) add('aviso', 0, 'Há troca de ferramenta (M06) mas nenhum G43 (compensação de altura).');
    if (inCanned) add('aviso', 0, 'Ciclo fixo não foi cancelado com G80.');

    function resolveGotos() {
      gotos.forEach(function (g) { if (!labels[g.n]) add('erro', g.ln, 'GOTO' + g.n + ': sequência N' + g.n + ' não existe neste programa.'); });
      gotos = [];
    }
    issues.sort(function (a, b) { return a.line - b.line; });
    return issues;
  }

  /* ---------- Simulador (código expandido, G90/G91, G00/G01/G81-G89) ---------- */
  function simulate(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var st = { x: 0, y: 0, z: 0, mode: 0, abs: true, canned: null, f: 0 };
    var segs = [], holes = [], feedDist = 0, rapidDist = 0, timeMin = 0, unsupported = false;
    for (var i = 0; i < lines.length; i++) {
      var code = stripComments(lines[i].toUpperCase()).trim();
      if (!code || code === '%') continue;
      if (/#|\[|WHILE|IF|GOTO|G65|M98/.test(code)) { unsupported = true; continue; }
      if (/^O\d+/.test(code)) continue;
      var words = {}, gs = [], re = /([A-Z])\s*(-?\d*\.?\d*)/g, m;
      while ((m = re.exec(code))) {
        if (m[1] === 'G') gs.push(Number(m[2])); else words[m[1]] = Number(m[2]);
      }
      var skipMove = false;
      gs.forEach(function (g) {
        if (g === 0 || g === 1) { st.mode = g; st.canned = null; }
        else if (g === 2 || g === 3) { st.mode = g; st.canned = null; }
        else if (g === 90) st.abs = true;
        else if (g === 91) st.abs = false;
        else if (g === 80) st.canned = null;
        else if (g >= 81 && g <= 89) st.canned = g;
        else if (g === 28 || g === 53 || g === 4 || g === 10 || g === 92) skipMove = true;
      });
      if (words.F !== undefined) st.f = words.F;
      if (skipMove) continue;
      var nx = st.x, ny = st.y, nz = st.z;
      if (words.X !== undefined) nx = st.abs ? words.X : st.x + words.X;
      if (words.Y !== undefined) ny = st.abs ? words.Y : st.y + words.Y;
      if (words.Z !== undefined && !st.canned) nz = st.abs ? words.Z : st.z + words.Z;
      var moved = (nx !== st.x || ny !== st.y || nz !== st.z);
      if (!st.known && (words.X !== undefined || words.Y !== undefined)) {
        // primeira posição XY: ponto de partida, sem desenhar a vinda da origem
        st.known = true;
        if (st.canned) holes.push({ x: nx, y: ny, ln: i + 1 });
        st.x = nx; st.y = ny; st.z = nz;
        if (st.canned) { if (words.Z !== undefined) st.cz = words.Z; if (words.R !== undefined) st.cr = words.R; }
        continue;
      }
      if (st.canned) {
        if (words.X !== undefined || words.Y !== undefined) {
          var d0 = Math.hypot(nx - st.x, ny - st.y);
          segs.push({ x1: st.x, y1: st.y, x2: nx, y2: ny, t: 'r', ln: i + 1 });
          rapidDist += d0;
          holes.push({ x: nx, y: ny, ln: i + 1 });
          if (words.Z !== undefined) st.cz = words.Z;
          if (words.R !== undefined) st.cr = words.R;
          if (st.f > 0 && st.cz !== undefined && st.cr !== undefined) {
            var dd = Math.abs(st.cr - st.cz); feedDist += dd; timeMin += dd / st.f;
          }
          st.x = nx; st.y = ny;
        }
        continue;
      }
      if (!moved) continue;
      if (st.mode === 2 || st.mode === 3) unsupported = true;
      var d = Math.hypot(nx - st.x, ny - st.y, nz - st.z);
      var t = st.mode === 0 ? 'r' : 'f';
      if (nx !== st.x || ny !== st.y) segs.push({ x1: st.x, y1: st.y, x2: nx, y2: ny, t: t, ln: i + 1, z: nz });
      if (t === 'r') rapidDist += d; else { feedDist += d; if (st.f > 0) timeMin += d / st.f; }
      st.x = nx; st.y = ny; st.z = nz;
    }
    return { segs: segs, holes: holes, feedDist: feedDist, rapidDist: rapidDist, timeMin: timeMin, unsupported: unsupported };
  }

  var api = {
    fmt: fmt, TEMPLATES: TEMPLATES, COMMON_FIELDS: COMMON_FIELDS, allFields: allFields,
    generate: generate, validate: validate, simulate: simulate, ascii: ascii
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GCode = api;
})(this);
