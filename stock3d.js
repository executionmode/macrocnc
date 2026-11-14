/* Simulação em relevo (3D) com remoção de material — Macro CNC
 * Mapa de alturas do bruto: a fresa (topo reto, diâmetro D) desce sobre o bruto e corta
 * tudo o que estiver acima da ponta dela. Mostra a peça como ficaria e avisa
 * quando um movimento rápido (G0) passa por dentro do material.
 */
(function (root) {
  'use strict';

  /* ---------- fixação (morsa, garras com tirante e porca, placa de 3 castanhas, calços) ----------
   * Cada item vira sólidos simples (caixas giradas e cilindros) em coordenadas da máquina.
   * Na grade eles guardam topo, fundo e cor; a fresa que encostar neles para a simulação. */
  var FIXCOL = { 1: [61, 90, 128], 2: [104, 114, 126], 3: [150, 158, 168], 4: [70, 76, 86], 5: [84, 92, 102], 6: [124, 133, 144], 7: [168, 160, 120] };
  function fixSolids(items) {
    var S = [];
    (items || []).forEach(function (it, idx) {
      var a = ((+it.ang || 0) + (it.type === 'morsa' ? 90 : it.type === 'garra' ? 180 : 0)) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), X = +it.x || 0, Y = +it.y || 0;
      function box(u, v, hu, hv, z0, z1, col) { S.push({ k: 'b', cx: X + u * ca - v * sa, cy: Y + u * sa + v * ca, ca: ca, sa: sa, hu: hu, hv: hv, z0: z0, z1: z1, col: col, id: idx }); }
      function cyl(u, v, r, z0, z1, col) { S.push({ k: 'c', cx: X + u * ca - v * sa, cy: Y + u * sa + v * ca, r: r, z0: z0, z1: z1, col: col, id: idx }); }
      if (it.type === 'morsa') {   // mesmas medidas do 3D: corpo, mordente fixo, mordente móvel, fuso e manivela
        var A = Math.max(1, +it.a || 100), W = Math.max(40, +it.w || 150), zt = +it.zt, zb = +it.zb, Lb = A + 2 * 32 + 140, cU = 35, zs = zb - 55 * 0.35;
        box(cU, 0, Lb / 2, W / 2, zb - 73, zb, 1);
        box(-(A / 2 + 31), 0, 31, W / 2, zb - 2, zt, 1);
        box(A / 2 + 36, 0, 36, W / 2, zb - 2, zt, 1);
        box(A / 2 + 72 + 74, 0, 74, 16, zs - 16, zs + 16, 1);
      } else if (it.type === 'garra') {   // barra com rasgo, bloco escalonado, prisioneiro e porca
        var L = Math.max(30, +it.L || 100), e = Math.max(6, +it.e || 16), wg = Math.max(10, +it.w || 30), zp = +it.zp, zb2 = +it.zb, us = L * 0.45;
        box(L / 2, 0, L / 2, wg / 2, zp, zp + e, 2);
        box(L - 10, 0, 17, wg / 2 + 3, zb2, zp, 2);
        cyl(us, 0, 8, zb2 - 22, zp + e + 21, 3);
        cyl(us, 0, 15, zp + e, zp + e + 15, 4);
      } else if (it.type === 'placa' || it.type === 'placa4') {   // corpo e castanhas escalonadas
        var Dp = Math.max(60, +it.D || 200), Rp = Dp / 2, zf = +it.zf, hj = Math.max(4, +it.hj || 25), rg = Math.max(2, +it.rg || 50), nj = it.type === 'placa4' ? 4 : 3;
        var lj = Math.min(Rp - rg - 2, 52), wj = Math.min(34, Rp * 0.28);
        cyl(0, 0, Rp, zf - 74, zf, 5);
        var sj = Math.max(8, lj / 3), invj = +it.inv === 1;
        for (var q = 0; q < nj; q++) {
          var aq = q / nj * 2 * Math.PI, ux = Math.cos(aq), uy = Math.sin(aq), aa = a + aq;
          // três degraus da castanha (normal: alto por fora; invertida: alto junto da peça)
          [[0, lj, 0.45], [invj ? 0 : sj, invj ? lj - sj : lj, 0.75], [invj ? 0 : 2 * sj, invj ? lj - 2 * sj : lj, 1]].forEach(function (st3) {
            var rc = rg + (st3[0] + st3[1]) / 2;
            S.push({ k: 'b', cx: X + (ux * ca - uy * sa) * rc, cy: Y + (ux * sa + uy * ca) * rc, ca: Math.cos(aa), sa: Math.sin(aa), hu: (st3[1] - st3[0]) / 2, hv: wj / 2, z0: zf, z1: zf + hj * st3[2], col: 6, id: idx });
          });
        }
      } else if (it.type === 'taco') {   // taco de apoio embaixo da peça
        var Lt = Math.max(5, +it.L || 40), et = Math.max(5, +it.e || 40), ht = Math.max(2, +it.h || 40), ztt = +it.zt;
        box(0, 0, Lt / 2, et / 2, ztt - ht, ztt, 7);
      } else if (it.type === 'calco') {   // calço / paralelo
        var Lc = Math.max(5, +it.L || 100), ec = Math.max(2, +it.e || 10), hc = Math.max(2, +it.h || 30), ztc = +it.zt;
        box(0, 0, Lc / 2, ec / 2, ztc - hc, ztc, 7);
      } else if (it.type === 'blocov') {   // bloco em V (até o fundo do V)
        var Lv = Math.max(10, +it.L || 80), wv = Math.max(20, +it.w || 70), hv = Math.max(15, +it.h || 50), ztv = +it.zt, dv = Math.min(hv * 0.55, wv * 0.4);
        box(0, 0, Lv / 2, wv / 2, ztv - hv, ztv - dv, 7);
      }
    });
    S.forEach(function (q) {
      if (q.k === 'c') { q.x0 = q.cx - q.r; q.x1 = q.cx + q.r; q.y0 = q.cy - q.r; q.y1 = q.cy + q.r; }
      else { var ex = Math.abs(q.ca) * q.hu + Math.abs(q.sa) * q.hv, ey = Math.abs(q.sa) * q.hu + Math.abs(q.ca) * q.hv; q.x0 = q.cx - ex; q.x1 = q.cx + ex; q.y0 = q.cy - ey; q.y1 = q.cy + ey; }
    });
    return S;
  }
  function inSolid(q, x, y) {
    if (q.k === 'c') return (x - q.cx) * (x - q.cx) + (y - q.cy) * (y - q.cy) <= q.r * q.r;
    var dx = x - q.cx, dy = y - q.cy, u = dx * q.ca + dy * q.sa, v = -dx * q.sa + dy * q.ca;
    return Math.abs(u) <= q.hu && Math.abs(v) <= q.hv;
  }
  function build(sim, o) {
    o = o || {};
    var D = Math.max(0.1, +o.toolDia || 10), r = D / 2;
    var top = o.top !== undefined && o.top !== '' && isFinite(+o.top) ? +o.top : 0;
    var res = o.res || 220;
    // limites: só o que corta (avanço ou furo) abaixo do topo
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, zLow = top, any = false;
    sim.segs.forEach(function (s) {
      if (s.t === 'r') return;
      if (Math.min(s.z, s.z1) >= top) return;
      any = true;
      minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
      zLow = Math.min(zLow, s.z, s.z1);
    });
    if (!any) {
      sim.segs.forEach(function (s) { if (s.t !== 'r') { minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2); minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2); } });
      if (!isFinite(minX)) { minX = -50; maxX = 50; minY = -50; maxY = 50; }
    }
    var shape = o.shape || 'rect', cx = 0, cy = 0, R = 0, layers = o.layers || null, man = o.stock || null;
    var bottomAuto = Math.min(zLow, top) - Math.max(5, (top - zLow) * 0.25);
    if (man) {
      // bruto digitado pelo usuário
      shape = man.shape || shape; layers = man.layers && man.shape === 'round' ? man.layers : null;
      cx = isFinite(man.cx) ? +man.cx : 0; cy = isFinite(man.cy) ? +man.cy : 0;
      if (shape === 'round') { R = Math.max(0.5, (+man.d || 100) / 2); minX = cx - R; maxX = cx + R; minY = cy - R; maxY = cy + R; }
      else { var lx = Math.max(1, +man.lx || 100), ly = Math.max(1, +man.ly || 100); minX = cx - lx / 2; maxX = cx + lx / 2; minY = cy - ly / 2; maxY = cy + ly / 2; }
    } else {
      // automático: o bruto termina na borda externa da fresa (contornos limpos) ou com folga (margin)
      var cellEst = (Math.max(maxX - minX, maxY - minY) + D) / res;
      var m = Math.max(0, r - 2 * cellEst);
      if (!any) m = r;
      if (o.margin) { var spanA = Math.max(maxX - minX, maxY - minY); m = r + Math.max(15, spanA * 0.08); }
      minX -= m; maxX += m; minY -= m; maxY += m;
      if (layers && shape === 'round') {
        R = 0; layers.forEach(function (l) { R = Math.max(R, l.d / 2); });
        minX = -R; maxX = R; minY = -R; maxY = R;
      } else if (shape === 'round') {
        sim.segs.forEach(function (s) { if (s.t !== 'r' && Math.min(s.z, s.z1) < top) R = Math.max(R, Math.hypot(s.x1 - cx, s.y1 - cy) + m, Math.hypot(s.x2 - cx, s.y2 - cy) + m); });
        if (!R) R = Math.max(maxX - minX, maxY - minY) / 2;
        minX = cx - R; maxX = cx + R; minY = cy - R; maxY = cy + R;
      }
    }
    var bottom = man && isFinite(man.bottom) && +man.bottom < top ? +man.bottom : bottomAuto;
    // a grade cobre o bruto e a fixação; o bruto continua com as medidas dele
    var sMinX = minX, sMaxX = maxX, sMinY = minY, sMaxY = maxY, FS = fixSolids(o.fixtures);
    var gMinX = minX, gMaxX = maxX, gMinY = minY, gMaxY = maxY;
    FS.forEach(function (q) { gMinX = Math.min(gMinX, q.x0); gMaxX = Math.max(gMaxX, q.x1); gMinY = Math.min(gMinY, q.y0); gMaxY = Math.max(gMaxY, q.y1); });
    var span = Math.max(gMaxX - gMinX, gMaxY - gMinY);
    var cell = span / res;
    cell = Math.max(cell, D / 40, 0.05);
    if (FS.length) {   // grade alinhada com a borda do bruto
      minX = sMinX - Math.ceil((sMinX - gMinX) / cell - 1e-9) * cell; minY = sMinY - Math.ceil((sMinY - gMinY) / cell - 1e-9) * cell;
      maxX = Math.max(gMaxX, minX + cell); maxY = Math.max(gMaxY, minY + cell);
    }
    var nx = Math.max(2, Math.ceil((maxX - minX) / cell - 1e-9) + 1), ny = Math.max(2, Math.ceil((maxY - minY) / cell - 1e-9) + 1);
    // ferramenta: topo reto (dz = 0) ou cônica (fresa 90°: sobe 1 a cada 1 de raio a partir da ponta plana)
    var shape3 = o.toolShape || null, tipR = shape3 && shape3.type === 'v' ? Math.max(0, (+shape3.tipD || 0) / 2) : 0;
    var cotHalf = shape3 && shape3.type === 'v' ? 1 / Math.tan(((+shape3.angle || 90) / 2) * Math.PI / 180) : 0;
    var rc = Math.ceil(r / cell), disc = [];
    for (var dj = -rc; dj <= rc; dj++) for (var di = -rc; di <= rc; di++) {
      var rho = Math.sqrt(di * di + dj * dj) * cell;
      var dz0 = cotHalf ? Math.max(0, rho - tipR) * cotHalf : 0;
      if (shape3 && shape3.type === 'r') {   // pastilha redonda: canto com raio E
        var Er = Math.min(r, Math.max(0, +shape3.cornerR || 0)), u = rho - (r - Er);
        dz0 = u > 0 ? Er - Math.sqrt(Math.max(0, Er * Er - u * u)) : 0;
      }
      if (rho * rho <= r * r + 1e-9) disc.push(di, dj, dz0);
    }
    var h = new Float32Array(nx * ny), inside = new Uint8Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var k = j * nx + i, x = minX + i * cell, y = minY + j * cell;
      var inS = shape !== 'round' ? (!FS.length || (x >= sMinX - cell * 0.5 && x <= sMaxX + cell * 0.5 && y >= sMinY - cell * 0.5 && y <= sMaxY + cell * 0.5)) : Math.hypot(x - cx, y - cy) <= R + cell * 0.5;
      inside[k] = inS ? 1 : 0; h[k] = top;
      if (layers && shape === 'round') {
        var rho = Math.hypot(x - cx, y - cy), zt = null;
        layers.forEach(function (l) { if (rho <= l.d / 2 + cell * 0.5 && (zt === null || l.top > zt)) zt = l.top; });
        if (zt === null) inside[k] = 0; else h[k] = Math.min(top, zt);
      }
      if (man && man.holeD > 0 && Math.hypot(x - cx, y - cy) <= man.holeD / 2) h[k] = Math.min(h[k], isFinite(man.holeZ) ? Math.max(+man.holeZ, bottom) : bottom);
    }
    // material "esperado": o Z mais alto em que a fresa corta em cada ponto (para não acusar colisão onde o bruto já não existe)
    var exp = new Float32Array(nx * ny); exp.fill(-1e9);
    sim.segs.forEach(function (s) {
      if (s.t === 'r') return;
      var len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1), steps = Math.max(1, Math.ceil(len / (cell * 0.7)));
      for (var b = 0; b <= steps; b++) {
        var u = b / steps, x = s.x1 + (s.x2 - s.x1) * u, y = s.y1 + (s.y2 - s.y1) * u, z = Math.min(top, Math.max(s.z1, s.z) );
        var ci = Math.round((x - minX) / cell), cj = Math.round((y - minY) / cell);
        for (var q = 0; q < disc.length; q += 3) {
          var ii = ci + disc[q], jj2 = cj + disc[q + 1];
          if (ii < 0 || jj2 < 0 || ii >= nx || jj2 >= ny) continue;
          var kk = jj2 * nx + ii, ze = Math.min(top, z + disc[q + 2]); if (exp[kk] < ze) exp[kk] = ze;
        }
      }
    });
    // fixação na grade: topo, fundo, cor e qual item
    var fT = null, fB = null, fc = null, fid = null, fMaxTop = -Infinity, fBox = null, vTop = top, vBot = bottom;
    if (FS.length) {
      fT = new Float32Array(nx * ny); fB = new Float32Array(nx * ny); fc = new Uint8Array(nx * ny); fid = new Int16Array(nx * ny).fill(-1);
      fBox = [Infinity, Infinity, -Infinity, -Infinity];
      FS.forEach(function (q) {
        var i0 = Math.max(0, Math.floor((q.x0 - minX) / cell)), i1 = Math.min(nx - 1, Math.ceil((q.x1 - minX) / cell)), j0 = Math.max(0, Math.floor((q.y0 - minY) / cell)), j1 = Math.min(ny - 1, Math.ceil((q.y1 - minY) / cell));
        for (var jj = j0; jj <= j1; jj++) for (var ii = i0; ii <= i1; ii++) {
          var xx = minX + ii * cell, yy = minY + jj * cell; if (!inSolid(q, xx, yy)) continue;
          var kk = jj * nx + ii;
          if (!fc[kk]) { fT[kk] = q.z1; fB[kk] = q.z0; fc[kk] = q.col; fid[kk] = q.id; }
          else { if (q.z1 > fT[kk]) { fT[kk] = q.z1; fc[kk] = q.col; fid[kk] = q.id; } if (q.z0 < fB[kk]) fB[kk] = q.z0; }
        }
        fMaxTop = Math.max(fMaxTop, q.z1); vTop = Math.max(vTop, q.z1); vBot = Math.min(vBot, q.z0);
        fBox[0] = Math.min(fBox[0], q.x0); fBox[1] = Math.min(fBox[1], q.y0); fBox[2] = Math.max(fBox[2], q.x1); fBox[3] = Math.max(fBox[3], q.y1);
      });
    }
    return {
      fT: fT, fB: fB, fc: fc, fid: fid, fMaxTop: fMaxTop, fBox: fBox, fixStop: null, vTop: vTop, vBot: vBot,
      exp: exp, h0: new Float32Array(h),
      sim: sim, D: D, r: r, top: top, bottom: bottom,
      stockInfo: { shape: shape, d: Math.round(R * 2 * 100) / 100, lx: Math.round((sMaxX - sMinX) * 100) / 100, ly: Math.round((sMaxY - sMinY) * 100) / 100, cx: Math.round((shape === 'round' ? cx : (sMinX + sMaxX) / 2) * 100) / 100, cy: Math.round((shape === 'round' ? cy : (sMinY + sMaxY) / 2) * 100) / 100, top: top, bottom: Math.round(bottom * 100) / 100 },
      x0: minX, y0: minY, cell: cell, nx: nx, ny: ny, h: h, inside: inside, disc: disc, toolShape: shape3, tipR: tipR,
      idx: 0, collisions: [], tool: null, shape: shape
    };
  }

  function stamp(st, x, y, z) {
    var ci = Math.round((x - st.x0) / st.cell), cj = Math.round((y - st.y0) / st.cell), d = st.disc, nx = st.nx, ny = st.ny, h = st.h;
    for (var q = 0; q < d.length; q += 3) {
      var i = ci + d[q], j = cj + d[q + 1];
      if (i < 0 || j < 0 || i >= nx || j >= ny) continue;
      var k = j * nx + i;
      var zz = z + d[q + 2]; if (zz < st.bottom) zz = st.bottom;
      if (h[k] > zz) h[k] = zz;
    }
  }
  function hits(st, x, y, z) {
    var ci = Math.round((x - st.x0) / st.cell), cj = Math.round((y - st.y0) / st.cell), d = st.disc, nx = st.nx, ny = st.ny;
    for (var q = 0; q < d.length; q += 3) {
      var i = ci + d[q], j = cj + d[q + 1];
      if (i < 0 || j < 0 || i >= nx || j >= ny) continue;
      var k = j * nx + i, zt = z + d[q + 2];
      if (st.inside[k] && st.h[k] > zt + 0.05 && st.exp[k] > zt + 0.05) return true;
    }
    return false;
  }

  // a fresa (da ponta até 200 mm acima) encosta em algum item da fixação?
  function fixHits(st, x, y, z) {
    if (!st.fc || z >= st.fMaxTop - 0.05) return false;
    var b = st.fBox, r = st.r; if (x < b[0] - r || x > b[2] + r || y < b[1] - r || y > b[3] + r) return false;
    var ci = Math.round((x - st.x0) / st.cell), cj = Math.round((y - st.y0) / st.cell), d = st.disc, nx = st.nx, ny = st.ny;
    for (var q = 0; q < d.length; q += 3) {
      var i = ci + d[q], j = cj + d[q + 1];
      if (i < 0 || j < 0 || i >= nx || j >= ny) continue;
      var k = j * nx + i; if (st.fc[k] && st.fT[k] > z + d[q + 2] + 0.05 && st.fB[k] < z + 200) return st.fid[k] + 1;
    }
    return false;
  }
  // aplica os próximos n segmentos (ou todos); para no bloco que bater na fixação
  function advance(st, n) {
    if (st.fixStop) return true;
    var segs = st.sim.segs, end = n == null ? segs.length : Math.min(segs.length, st.idx + n);
    for (; st.idx < end; st.idx++) {
      var s = segs[st.idx];
      if (st.fc) {
        var lenF = Math.hypot(s.x2 - s.x1, s.y2 - s.y1, s.z - s.z1), stF = Math.max(1, Math.ceil(lenF / (st.cell * 0.7)));
        for (var fq = 0; fq <= stF; fq++) {
          var tf = fq / stF, xf = s.x1 + (s.x2 - s.x1) * tf, yf = s.y1 + (s.y2 - s.y1) * tf, zf = s.t === 'h' ? s.z1 + (s.z - s.z1) * tf : s.z1 + (s.z - s.z1) * tf;
          if (s.t === 'h') { xf = s.x2; yf = s.y2; }
          var hitF = fixHits(st, xf, yf, zf);
          if (hitF) {
            st.fixStop = { ln: s.ln, x: xf, y: yf, z: zf, item: hitF - 1 };
            st.collisions.push({ ln: s.ln, x: xf, y: yf, z: zf, fix: true, item: hitF - 1 });
            st.tool = { x: xf, y: yf, z: zf }; st.idx++;
            return true;
          }
        }
      }
      if (s.t === 'h') { stamp(st, s.x2, s.y2, s.z); st.tool = { x: s.x2, y: s.y2, z: s.z1 }; continue; }
      var len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1), steps = Math.max(1, Math.ceil(len / (st.cell * 0.7)));
      if (s.t === 'r') {
        if (Math.min(s.z, s.z1) < st.top + 0.05) {
          for (var a = 0; a <= steps; a++) {
            var t = a / steps, x = s.x1 + (s.x2 - s.x1) * t, y = s.y1 + (s.y2 - s.y1) * t, z = s.z1 + (s.z - s.z1) * t;
            if (hits(st, x, y, z)) { if (st.collisions.length < 20) st.collisions.push({ ln: s.ln, x: x, y: y, z: z }); break; }
          }
        }
      } else {
        for (var b = 0; b <= steps; b++) {
          var u = b / steps;
          stamp(st, s.x1 + (s.x2 - s.x1) * u, s.y1 + (s.y2 - s.y1) * u, s.z1 + (s.z - s.z1) * u);
        }
      }
      st.tool = { x: s.x2, y: s.y2, z: s.z };
    }
    return st.idx >= segs.length;
  }

  /* ---------- desenho ---------- */
  function render(canvas, st, view, showTool) {
    var prn = !!view.print;   // folha para imprimir: fundo branco, peça cinza uniforme, sem legenda
    var dpr = prn ? 1 : (window.devicePixelRatio || 1);
    var W = view.W || canvas.clientWidth || 800, H = view.H || Math.round(W * 0.75);
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pal = view.pal === 'green';   // cores de simulação do comando (bloco verde, corte cinza) — usado nos vídeos
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal ? '#3b3f45' : '#1b2733'); g.addColorStop(1, pal ? '#1c1e22' : '#0b1015');
    c.fillStyle = prn ? '#ffffff' : g; c.fillRect(0, 0, W, H);

    var az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
    var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    var nx = st.nx, ny = st.ny, cell = st.cell, x0 = st.x0, y0 = st.y0, h = st.h, ins = st.inside;
    var midX = x0 + (nx - 1) * cell / 2, midY = y0 + (ny - 1) * cell / 2;
    function P(x, y, z) {
      var dx = x - midX, dy = y - midY, xr = dx * ca - dy * sa, yr = dx * sa + dy * ca;
      return [xr, -(yr * se + z * ce), yr * ce - z * se];
    }
    // enquadramento
    var corners = [[x0, y0], [x0 + (nx - 1) * cell, y0], [x0, y0 + (ny - 1) * cell], [x0 + (nx - 1) * cell, y0 + (ny - 1) * cell]];
    var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    corners.forEach(function (p) { [st.vTop != null ? st.vTop : st.top, st.vBot != null ? st.vBot : st.bottom].forEach(function (z) { var q = P(p[0], p[1], z); bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); by0 = Math.min(by0, q[1]); by1 = Math.max(by1, q[1]); }); });
    var sc = Math.min((W - 30) / (bx1 - bx0), (H - 30) / (by1 - by0)) * (view.zoom || 1);
    var ox = W / 2 - (bx0 + bx1) / 2 * sc + (view.panX || 0), oy = H / 2 - (by0 + by1) / 2 * sc + (view.panY || 0);
    var cullPad = cell * sc * 2 + 30;

    // ordem de desenho (de trás para frente)
    var key = view.az + '|' + nx + '|' + ny;
    if (st._orderKey !== key) {
      var ord = new Uint32Array((nx - 1) * (ny - 1)), dep = new Float32Array(ord.length), n = 0;
      for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
        var dx = x0 + (i + 0.5) * cell - midX, dy = y0 + (j + 0.5) * cell - midY;
        dep[n] = dx * sa + dy * ca; ord[n] = j * nx + i; n++;
      }
      var idx = new Array(n);
      for (var t = 0; t < n; t++) idx[t] = t;
      idx.sort(function (a, b) { return dep[b] - dep[a]; });
      st._order = idx.map(function (t) { return ord[t]; }); st._orderKey = key;
    }
    var L = [-0.45, -0.55, 0.7]; // luz (no sistema da vista)
    var Lw = [L[0] * ca + L[1] * sa, -L[0] * sa + L[1] * ca, L[2]];
    var ln = Math.hypot(Lw[0], Lw[1], Lw[2]); Lw = [Lw[0] / ln, Lw[1] / ln, Lw[2] / ln];
    var top = st.top, zr = Math.max(1e-6, top - (st.sim.zMin == null ? top - 1 : Math.min(st.sim.zMin, top)));
    var order = st._order, bottom = st.bottom;
    var vYm = ca > -1e-9, vYp = ca < 1e-9, vXm = sa > -1e-9, vXp = sa < 1e-9;   // paredes visíveis: normal apontando para quem olha
    // vazios ligados à borda = lado de fora; os outros vazios são furos/recortes passantes
    if (st._outKey !== nx + '|' + ny + '|' + ins.length) {
      var out = new Uint8Array(nx * ny), stack = [];
      for (var bi = 0; bi < nx; bi++) { stack.push(bi, (ny - 1) * nx + bi); }
      for (var bj = 0; bj < ny; bj++) { stack.push(bj * nx, bj * nx + nx - 1); }
      while (stack.length) {
        var q = stack.pop(); if (out[q] || ins[q]) continue; out[q] = 1;
        var qi = q % nx, qj = (q - qi) / nx;
        if (qi > 0) stack.push(q - 1); if (qi < nx - 1) stack.push(q + 1); if (qj > 0) stack.push(q - nx); if (qj < ny - 1) stack.push(q + nx);
      }
      st._out = out; st._outKey = nx + '|' + ny + '|' + ins.length;
    }
    var outM = st._out;
    function isHole(q) { return !ins[q] && !outM[q]; }
    // uma célula só é desenhada com os 4 cantos dentro; a parede vai onde a célula vizinha não é desenhada
    function cellIn(q) { return q >= 0 && q + nx + 1 < ins.length && ins[q] && ins[q + 1] && ins[q + nx] && ins[q + nx + 1]; }
    function holeCell(q) { return q >= 0 && q + nx + 1 < ins.length && !cellIn(q) && (isHole(q) || isHole(q + 1) || isHole(q + nx) || isHole(q + nx + 1)) && !(outM[q] || outM[q + 1] || outM[q + nx] || outM[q + nx + 1]); }
    // 1º: paredes dos furos (de trás para frente). O resto da peça, desenhado depois, cobre o que fica escondido;
    // só aparece a parede de dentro do furo vista pela boca dele.
    for (var o0 = 0; o0 < order.length; o0++) {
      var k0 = order[o0];
      if (!ins[k0] || !ins[k0 + 1] || !ins[k0 + nx] || !ins[k0 + nx + 1]) continue;
      var i0 = k0 % nx, j0 = (k0 - i0) / nx;
      if (i0 === 0 || j0 === 0 || i0 === nx - 2 || j0 === ny - 2) continue;
      var xa0 = x0 + i0 * cell, ya0 = y0 + j0 * cell, xb0 = xa0 + cell, yb0 = ya0 + cell;
      if (vYm && holeCell(k0 - nx)) wall(xa0, ya0, h[k0], xb0, ya0, h[k0 + 1], 1.1, k0);
      if (vYp && holeCell(k0 + nx)) wall(xa0, yb0, h[k0 + nx], xb0, yb0, h[k0 + nx + 1], 0.8, k0);
      if (vXm && holeCell(k0 - 1)) wall(xa0, ya0, h[k0], xa0, yb0, h[k0 + nx], 0.95, k0);
      if (vXp && holeCell(k0 + 1)) wall(xb0, ya0, h[k0 + 1], xb0, yb0, h[k0 + nx + 1], 0.9, k0);
    }
    function S(x, y, z) { var q = P(x, y, z); return [ox + q[0] * sc, oy + q[1] * sc]; }
    // sombra da parede pela direção real do contorno (em curvas não fica listrado como escada)
    function smoothShade(k, shade) {
      if (k == null) return shade;
      var ki = k % nx, kj = (k - ki) / nx, gx = 0, gy = 0;
      for (var dj = -4; dj <= 5; dj++) for (var di = -4; di <= 5; di++) {
        var qi = ki + di, qj = kj + dj; if (qi < 0 || qj < 0 || qi >= nx || qj >= ny) continue;
        if (ins[qj * nx + qi]) { var wgt = Math.exp(-((di - 0.5) * (di - 0.5) + (dj - 0.5) * (dj - 0.5)) / 8); gx += (di - 0.5) * wgt; gy += (dj - 0.5) * wgt; }
      }
      var gl = Math.hypot(gx, gy); if (gl < 1e-6) return shade;
      var nxx = -gx / gl, nyy = -gy / gl;   // normal para fora do material
      return 0.9375 - 0.025 * nxx - 0.15 * nyy;
    }
    function wall(xa, ya, za, xb, yb, zb, shade, k) {
      shade = smoothShade(k, shade);
      var a = S(xa, ya, za), b = S(xb, yb, zb), b2 = S(xb, yb, bottom), a2 = S(xa, ya, bottom);
      c.fillStyle = prn ? 'rgb(' + Math.round(120 * shade) + ',' + Math.round(126 * shade) + ',' + Math.round(134 * shade) + ')' : pal ? 'rgb(' + Math.round(28 * shade) + ',' + Math.round(150 * shade) + ',' + Math.round(30 * shade) + ')' : 'rgb(' + Math.round(70 * shade) + ',' + Math.round(78 * shade) + ',' + Math.round(88 * shade) + ')';
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b2[0], b2[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill();
      if (prn) { c.strokeStyle = c.fillStyle; c.lineWidth = 1.2; c.stroke(); }
    }
    // a fresa entra na ordem de desenho pela profundidade: o material na frente dela (parede do furo) a esconde
    var toolPending = !!(showTool && st.tool), toolDep = 0;
    if (toolPending) toolDep = (st.tool.x - midX) * sa + (st.tool.y - midY) * ca - st.r * 0.95;
    function drawTool() {
      toolPending = false;
      var T = st.tool, r = st.r, z0 = T.z, flute = Math.max(st.D * 2, 12), L = Math.max(st.D * 3.2, 26), N = 36;
      function ringAt(z, rr) { var out = []; for (var a = 0; a <= N; a++) { var an = a / N * Math.PI * 2; out.push(S(T.x + rr * Math.cos(an), T.y + rr * Math.sin(an), z)); } return out; }
      function ext(rg) { var lo = rg[0], hi = rg[0]; rg.forEach(function (p) { if (p[0] < lo[0]) lo = p; if (p[0] > hi[0]) hi = p; }); return [lo, hi]; }
      function poly(pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
      function body(za, zb, ra, rb, c0, c1, c2) {
        var A = ringAt(za, ra), B = ringAt(zb, rb), ea = ext(A), eb = ext(B);
        var g = c.createLinearGradient(Math.min(ea[0][0], eb[0][0]), 0, Math.max(ea[1][0], eb[1][0]), 0);
        g.addColorStop(0, c0); g.addColorStop(0.42, c1); g.addColorStop(0.6, c2); g.addColorStop(1, c0);
        c.fillStyle = g;
        // metade da frente do anel de baixo + lados
        var front = A.filter(function (p, i) { var an = i / N * Math.PI * 2; return Math.cos(an) * sa + Math.sin(an) * ca <= 0.02; });
        poly([ea[0], eb[0], eb[1], ea[1]]); c.fill();
        poly(A); c.fill();
        return B;
      }
      if (st.toolShape && st.toolShape.type === 'r') {
        // fresa de pastilha redonda: canto arredondado de raio E
        var Er2 = Math.min(r, +st.toolShape.cornerR || 0);
        body(z0, z0 + Er2 * 0.3, Math.max(r - Er2 * 0.95, 0.05), r - Er2 * 0.45, '#1d242c', '#8f9baa', '#c0cad6');
        body(z0 + Er2 * 0.3, z0 + Er2, r - Er2 * 0.45, r, '#1d242c', '#8f9baa', '#c0cad6');
        body(z0 + Er2, z0 + L, r * 0.9, r * 0.9, '#3a434e', '#c9d3dd', '#eef3f8');
        var topR = body(z0 + L, z0 + L + L * 0.5, r * 1.2, r * 2, '#2a313a', '#8b96a3', '#c3ccd6');
        c.fillStyle = '#5d6874'; poly(topR); c.fill();
        return;
      }
      if (st.toolShape && st.toolShape.type === 'v') {
        // fresa cônica 90°: ponta (plana ou viva) abrindo até o diâmetro maior
        var hc = (r - st.tipR) / Math.tan(((+st.toolShape.angle || 90) / 2) * Math.PI / 180);
        body(z0, z0 + hc, Math.max(st.tipR, 0.05), r, '#1d242c', '#8f9baa', '#c0cad6');
        body(z0 + hc, z0 + L, r * 0.9, r * 0.9, '#3a434e', '#c9d3dd', '#eef3f8');
        var topC = body(z0 + L, z0 + L + L * 0.5, r * 1.2, r * 2, '#2a313a', '#8b96a3', '#c3ccd6');
        c.fillStyle = '#5d6874'; poly(topC); c.fill();
        return;
      }
      // parte cortante (mais escura, com hélices)
      body(z0, z0 + flute, r, r, '#1d242c', '#7f8b98', '#aab6c3');
      c.strokeStyle = 'rgba(10,14,20,0.85)'; c.lineWidth = Math.max(1, r * sc * 0.08);
      var pitch = flute * 0.9;
      for (var f = 0; f < 3; f++) {
        c.beginPath(); var on = false;
        for (var q = 0; q <= 60; q++) {
          var zz = z0 + flute * q / 60, an = f * 2 * Math.PI / 3 + (zz - z0) / pitch * 2 * Math.PI;
          var facing = Math.cos(an) * sa + Math.sin(an) * ca < -0.05;
          var p = S(T.x + r * Math.cos(an), T.y + r * Math.sin(an), zz);
          if (facing) { if (on) c.lineTo(p[0], p[1]); else { c.moveTo(p[0], p[1]); on = true; } } else on = false;
        }
        c.stroke();
      }
      // haste
      body(z0 + flute, z0 + L, r * 0.92, r * 0.92, '#3a434e', '#c9d3dd', '#eef3f8');
      // pinça / porta-ferramenta
      var topB = body(z0 + L, z0 + L + L * 0.5, r * 1.25, r * 2.1, '#2a313a', '#8b96a3', '#c3ccd6');
      c.fillStyle = '#5d6874'; poly(topB); c.fill();
    }
    var fT = st.fT, fB = st.fB, fc = st.fc, fidA = st.fid;
    function fIn(q) { return fc && q >= 0 && q + nx + 1 < fc.length && fc[q] && fc[q + 1] && fc[q + nx] && fc[q + nx + 1]; }
    function fixRGB(q) {
      if (st.fixSel != null && fidA[q] === st.fixSel) return [245, 158, 11];
      if (st.fixStop && fidA[q] === st.fixStop.item) return [220, 60, 60];
      var cc = FIXCOL[fc[q]] || FIXCOL[2]; return prn ? [cc[0] * 0.7 + 60, cc[1] * 0.7 + 60, cc[2] * 0.7 + 60] : cc;
    }
    function fwall(xa, ya, za, xb, yb, zb, zba, zbb, shade, rgb) {
      if (za <= zba + 1e-6 && zb <= zbb + 1e-6) return;
      var a = S(xa, ya, za), b = S(xb, yb, zb), b2 = S(xb, yb, zbb), a2 = S(xa, ya, zba);
      c.fillStyle = 'rgb(' + Math.round(rgb[0] * shade * 0.78) + ',' + Math.round(rgb[1] * shade * 0.78) + ',' + Math.round(rgb[2] * shade * 0.78) + ')';
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b2[0], b2[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = 0.6; c.stroke();
    }
    function fixCell(k) {   // um pedaço da fixação: paredes onde ela acaba (ou desce para um vizinho mais baixo) e o topo
      var ii = k % nx, jj = (k - ii) / nx, xa = x0 + ii * cell, ya = y0 + jj * cell, xb = xa + cell, yb = ya + cell, rgb = fixRGB(k);
      var t00 = fT[k], t10 = fT[k + 1], t01 = fT[k + nx], t11 = fT[k + nx + 1], b00 = fB[k], b10 = fB[k + 1], b01 = fB[k + nx], b11 = fB[k + nx + 1];
      // vizinho também da fixação divide os mesmos cantos: sem parede entre eles
      if (vYm && !fIn(k - nx)) fwall(xa, ya, t00, xb, ya, t10, b00, b10, 1.1, rgb);
      if (vYp && !fIn(k + nx)) fwall(xa, yb, t01, xb, yb, t11, b01, b11, 0.8, rgb);
      if (vXm && !fIn(k - 1)) fwall(xa, ya, t00, xa, yb, t01, b00, b01, 0.95, rgb);
      if (vXp && !fIn(k + 1)) fwall(xb, ya, t10, xb, yb, t11, b10, b11, 0.9, rgb);
      var dzx = (t10 + t11 - t00 - t01) / (2 * cell), dzy = (t01 + t11 - t00 - t10) / (2 * cell), nl = Math.sqrt(dzx * dzx + dzy * dzy + 1);
      var f = 0.45 + 0.55 * Math.max(0, (-dzx * Lw[0] - dzy * Lw[1] + Lw[2]) / nl);
      c.fillStyle = 'rgb(' + Math.round(rgb[0] * f) + ',' + Math.round(rgb[1] * f) + ',' + Math.round(rgb[2] * f) + ')';
      var p1 = S(xa, ya, t00), p2 = S(xb, ya, t10), p3 = S(xb, yb, t11), p4 = S(xa, yb, t01);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.lineTo(p4[0], p4[1]); c.closePath(); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = 0.6; c.stroke();
    }
    for (var o = 0; o < order.length; o++) {
      var k = order[o];
      if (toolPending) {
        var kci = k % nx, kcj = (k - kci) / nx;
        var cdep = (x0 + (kci + 0.5) * cell - midX) * sa + (y0 + (kcj + 0.5) * cell - midY) * ca;
        if (cdep < toolDep) drawTool();
      }
      var fHere = fIn(k), sHere = ins[k] && ins[k + 1] && ins[k + nx] && ins[k + nx + 1];
      if (!sHere) { if (fHere) fixCell(k); continue; }
      if (fHere && (fT[k] + fT[k + 1] + fT[k + nx] + fT[k + nx + 1]) / 4 <= (h[k] + h[k + 1] + h[k + nx] + h[k + nx + 1]) / 4 + 0.01) fHere = false;   // embaixo da peça: não aparece
      var ii = k % nx, jj = (k - ii) / nx;
      var xa = x0 + ii * cell, ya = y0 + jj * cell, xb = xa + cell, yb = ya + cell;
      var h00 = h[k], h10 = h[k + 1], h01 = h[k + nx], h11 = h[k + nx + 1];
      var pc = S(xa, ya, h00);
      var edge = jj === 0 || jj === ny - 2 || ii === 0 || ii === nx - 2 || !ins[k - nx] || !ins[k + 2 * nx] || !ins[k - 1] || !ins[k + 2];
      if (pc[0] < -cullPad || pc[0] > W + cullPad || pc[1] > H + cullPad || (!edge && pc[1] < -cullPad)) continue;
      // paredes externas do bruto
      // só as paredes viradas para quem olha (as de trás ficam escondidas e, desenhadas, vazavam através da peça)
      if (vYm && (jj === 0 || (!cellIn(k - nx) && !holeCell(k - nx)))) wall(xa, ya, h00, xb, ya, h10, 1.1, k);
      if (vYp && (jj === ny - 2 || (!cellIn(k + nx) && !holeCell(k + nx)))) wall(xa, yb, h01, xb, yb, h11, 0.8, k);
      if (vXm && (ii === 0 || (!cellIn(k - 1) && !holeCell(k - 1)))) wall(xa, ya, h00, xa, yb, h01, 0.95, k);
      if (vXp && (ii === nx - 2 || (!cellIn(k + 1) && !holeCell(k + 1)))) wall(xb, ya, h10, xb, yb, h11, 0.9, k);
      var dzx = (h10 + h11 - h00 - h01) / (2 * cell), dzy = (h01 + h11 - h00 - h10) / (2 * cell);
      var nl = Math.sqrt(dzx * dzx + dzy * dzy + 1);
      var lum = Math.max(0, (-dzx * Lw[0] - dzy * Lw[1] + Lw[2]) / nl);
      var h0 = st.h0, hm = (h00 + h10 + h01 + h11) / 4, hb = (h0[k] + h0[k + 1] + h0[k + nx] + h0[k + nx + 1]) / 4, cut = hm < hb - 0.01;
      var f = 0.28 + 0.72 * lum, R, Gc, B;
      if (prn) { R = 196; Gc = 200; B = 206; }
      else if (pal) { if (cut) { R = 178; Gc = 182; B = 188; } else { R = 52; Gc = 205; B = 52; } }
      else if (cut) { var dz = Math.min(1, (top - hm) / zr); R = 120 + 80 * dz; Gc = 170 - 10 * dz; B = 215 - 120 * dz; }
      else { R = 160; Gc = 166; B = 174; }
      c.fillStyle = 'rgb(' + Math.round(R * f) + ',' + Math.round(Gc * f) + ',' + Math.round(B * f) + ')';
      var p1 = S(xa, ya, h00), p2 = S(xb, ya, h10), p3 = S(xb, yb, h11), p4 = S(xa, yb, h01);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.lineTo(p4[0], p4[1]); c.closePath(); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = prn ? 1.4 : 0.6; c.stroke();
      if (fHere) fixCell(k);   // garra em cima da peça
    }
    if (toolPending) drawTool();
    // colisões
    st.collisions.forEach(function (cl) {
      var p = S(cl.x, cl.y, cl.z); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(p[0], p[1], cl.fix ? 9 : 6, 0, 7); c.fill();
      if (cl.fix) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
    });
    c.fillStyle = '#94a3b3'; c.font = '11px system-ui';
    if (st.label !== '' && !prn) c.fillText(st.label != null ? st.label : (window.T || String)('1 dedo gira · 2 dedos zoom e move · fresa ' + (Math.round(st.D * 100) / 100) + ' mm · bruto no topo Z' + st.top), 10, H - 8);
  }

  // mesma câmera do render: devolve (x, y, z) -> [x, y] em px da tela (para tocar em linhas por cima do 3D)
  function projector(st, view, W, H) {
    var az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
    var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    var nx = st.nx, ny = st.ny, cell = st.cell, x0 = st.x0, y0 = st.y0;
    var midX = x0 + (nx - 1) * cell / 2, midY = y0 + (ny - 1) * cell / 2;
    function P(x, y, z) { var dx = x - midX, dy = y - midY, xr = dx * ca - dy * sa, yr = dx * sa + dy * ca; return [xr, -(yr * se + z * ce), yr * ce - z * se]; }
    var corners = [[x0, y0], [x0 + (nx - 1) * cell, y0], [x0, y0 + (ny - 1) * cell], [x0 + (nx - 1) * cell, y0 + (ny - 1) * cell]];
    var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    corners.forEach(function (p) { [st.vTop != null ? st.vTop : st.top, st.vBot != null ? st.vBot : st.bottom].forEach(function (z) { var q = P(p[0], p[1], z); bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); by0 = Math.min(by0, q[1]); by1 = Math.max(by1, q[1]); }); });
    var sc = Math.min((W - 30) / (bx1 - bx0), (H - 30) / (by1 - by0)) * (view.zoom || 1);
    var ox = W / 2 - (bx0 + bx1) / 2 * sc + (view.panX || 0), oy = H / 2 - (by0 + by1) / 2 * sc + (view.panY || 0);
    return function (x, y, z) { var q = P(x, y, z); return [ox + q[0] * sc, oy + q[1] * sc, q[2]]; };
  }
  // o contrário: ponto da tela -> ponto da superfície da peça (anda pelo raio até bater no material)
  function picker(st, view, W, H) {
    var az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
    var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    var nx = st.nx, ny = st.ny, cell = st.cell, x0 = st.x0, y0 = st.y0;
    var midX = x0 + (nx - 1) * cell / 2, midY = y0 + (ny - 1) * cell / 2;
    function P(x, y, z) { var dx = x - midX, dy = y - midY, xr = dx * ca - dy * sa, yr = dx * sa + dy * ca; return [xr, -(yr * se + z * ce)]; }
    var corners = [[x0, y0], [x0 + (nx - 1) * cell, y0], [x0, y0 + (ny - 1) * cell], [x0 + (nx - 1) * cell, y0 + (ny - 1) * cell]];
    var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    corners.forEach(function (p) { [st.vTop != null ? st.vTop : st.top, st.vBot != null ? st.vBot : st.bottom].forEach(function (z) { var q = P(p[0], p[1], z); bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); by0 = Math.min(by0, q[1]); by1 = Math.max(by1, q[1]); }); });
    var sc = Math.min((W - 30) / (bx1 - bx0), (H - 30) / (by1 - by0)) * (view.zoom || 1);
    var ox = W / 2 - (bx0 + bx1) / 2 * sc + (view.panX || 0), oy = H / 2 - (by0 + by1) / 2 * sc + (view.panY || 0);
    var L = Math.hypot((nx - 1) * cell, (ny - 1) * cell, st.top - st.bottom) / 2 + 5;
    function at(s, xr, Aq) { var yr = Aq * se + ce * s, z = Aq * ce - se * s; return [midX + xr * ca + yr * sa, midY - xr * sa + yr * ca, z]; }
    function inside(p) { if (p[2] < st.bottom - 1e-6) return false; var h = st.hAt ? st.hAt(p[0], p[1]) : null; return h != null && p[2] <= h; }
    return function (u, v) {
      var xr = (u - ox) / sc, Aq = -(v - oy) / sc, step = Math.max(0.3, cell * 0.5), prev = -L;
      for (var s = -L; s <= L; s += step) {
        if (inside(at(s, xr, Aq))) {   // refina entre o passo anterior e este
          var a = prev, b = s; for (var i = 0; i < 12; i++) { var m = (a + b) / 2; if (inside(at(m, xr, Aq))) b = m; else a = m; }
          return at(b, xr, Aq);
        }
        prev = s;
      }
      return null;
    };
  }
  root.Stock3D = { fixSolids: fixSolids, inSolid: inSolid, build: build, advance: advance, render: render, projector: projector, picker: picker };
})(this);
