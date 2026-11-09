/* Simulação em relevo (3D) com remoção de material — Macro CNC
 * Mapa de alturas do bruto: a fresa (topo reto, diâmetro D) desce sobre o bruto e corta
 * tudo o que estiver acima da ponta dela. Mostra a peça como ficaria e avisa
 * quando um movimento rápido (G0) passa por dentro do material.
 */
(function (root) {
  'use strict';

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
    var span = Math.max(maxX - minX, maxY - minY);
    var cell = span / res;
    cell = Math.max(cell, D / 40, 0.05);
    var nx = Math.max(2, Math.ceil((maxX - minX) / cell) + 1), ny = Math.max(2, Math.ceil((maxY - minY) / cell) + 1);
    // ferramenta: topo reto (dz = 0) ou cônica (fresa 90°: sobe 1 a cada 1 de raio a partir da ponta plana)
    var shape3 = o.toolShape || null, tipR = shape3 && shape3.type === 'v' ? Math.max(0, (+shape3.tipD || 0) / 2) : 0;
    var cotHalf = shape3 && shape3.type === 'v' ? 1 / Math.tan(((+shape3.angle || 90) / 2) * Math.PI / 180) : 0;
    var rc = Math.ceil(r / cell), disc = [];
    for (var dj = -rc; dj <= rc; dj++) for (var di = -rc; di <= rc; di++) {
      var rho = Math.sqrt(di * di + dj * dj) * cell;
      if (rho * rho <= r * r + 1e-9) disc.push(di, dj, cotHalf ? Math.max(0, rho - tipR) * cotHalf : 0);
    }
    var h = new Float32Array(nx * ny), inside = new Uint8Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var k = j * nx + i, x = minX + i * cell, y = minY + j * cell;
      var inS = shape !== 'round' || Math.hypot(x - cx, y - cy) <= R + cell * 0.5;
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
    return {
      exp: exp, h0: new Float32Array(h),
      sim: sim, D: D, r: r, top: top, bottom: bottom,
      stockInfo: { shape: shape, d: Math.round(R * 2 * 100) / 100, lx: Math.round((maxX - minX) * 100) / 100, ly: Math.round((maxY - minY) * 100) / 100, cx: Math.round((shape === 'round' ? cx : (minX + maxX) / 2) * 100) / 100, cy: Math.round((shape === 'round' ? cy : (minY + maxY) / 2) * 100) / 100, top: top, bottom: Math.round(bottom * 100) / 100 },
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

  // aplica os próximos n segmentos (ou todos)
  function advance(st, n) {
    var segs = st.sim.segs, end = n == null ? segs.length : Math.min(segs.length, st.idx + n);
    for (; st.idx < end; st.idx++) {
      var s = segs[st.idx];
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
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || 800, H = Math.round(W * 0.75);
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b2733'); g.addColorStop(1, '#0b1015');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

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
    corners.forEach(function (p) { [st.top, st.bottom].forEach(function (z) { var q = P(p[0], p[1], z); bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); by0 = Math.min(by0, q[1]); by1 = Math.max(by1, q[1]); }); });
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
    function S(x, y, z) { var q = P(x, y, z); return [ox + q[0] * sc, oy + q[1] * sc]; }
    function wall(xa, ya, za, xb, yb, zb, shade) {
      var a = S(xa, ya, za), b = S(xb, yb, zb), b2 = S(xb, yb, bottom), a2 = S(xa, ya, bottom);
      c.fillStyle = 'rgb(' + Math.round(70 * shade) + ',' + Math.round(78 * shade) + ',' + Math.round(88 * shade) + ')';
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b2[0], b2[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill();
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
    for (var o = 0; o < order.length; o++) {
      var k = order[o];
      if (toolPending) {
        var kci = k % nx, kcj = (k - kci) / nx;
        var cdep = (x0 + (kci + 0.5) * cell - midX) * sa + (y0 + (kcj + 0.5) * cell - midY) * ca;
        if (cdep < toolDep) drawTool();
      }
      if (!ins[k] || !ins[k + 1] || !ins[k + nx] || !ins[k + nx + 1]) {
        continue;
      }
      var ii = k % nx, jj = (k - ii) / nx;
      var xa = x0 + ii * cell, ya = y0 + jj * cell, xb = xa + cell, yb = ya + cell;
      var h00 = h[k], h10 = h[k + 1], h01 = h[k + nx], h11 = h[k + nx + 1];
      var pc = S(xa, ya, h00);
      var edge = jj === 0 || jj === ny - 2 || ii === 0 || ii === nx - 2 || !ins[k - nx] || !ins[k + 2 * nx] || !ins[k - 1] || !ins[k + 2];
      if (pc[0] < -cullPad || pc[0] > W + cullPad || pc[1] > H + cullPad || (!edge && pc[1] < -cullPad)) continue;
      // paredes externas do bruto
      if (jj === 0 || !ins[k - nx]) wall(xa, ya, h00, xb, ya, h10, 1.1);
      if (jj === ny - 2 || !ins[k + 2 * nx]) wall(xa, yb, h01, xb, yb, h11, 0.8);
      if (ii === 0 || !ins[k - 1]) wall(xa, ya, h00, xa, yb, h01, 0.95);
      if (ii === nx - 2 || !ins[k + 2]) wall(xb, ya, h10, xb, yb, h11, 0.9);
      var dzx = (h10 + h11 - h00 - h01) / (2 * cell), dzy = (h01 + h11 - h00 - h10) / (2 * cell);
      var nl = Math.sqrt(dzx * dzx + dzy * dzy + 1);
      var lum = Math.max(0, (-dzx * Lw[0] - dzy * Lw[1] + Lw[2]) / nl);
      var h0 = st.h0, hm = (h00 + h10 + h01 + h11) / 4, hb = (h0[k] + h0[k + 1] + h0[k + nx] + h0[k + nx + 1]) / 4, cut = hm < hb - 0.01;
      var f = 0.28 + 0.72 * lum, R, Gc, B;
      if (cut) { var dz = Math.min(1, (top - hm) / zr); R = 120 + 80 * dz; Gc = 170 - 10 * dz; B = 215 - 120 * dz; }
      else { R = 160; Gc = 166; B = 174; }
      c.fillStyle = 'rgb(' + Math.round(R * f) + ',' + Math.round(Gc * f) + ',' + Math.round(B * f) + ')';
      var p1 = S(xa, ya, h00), p2 = S(xb, ya, h10), p3 = S(xb, yb, h11), p4 = S(xa, yb, h01);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.lineTo(p4[0], p4[1]); c.closePath(); c.fill();
      c.strokeStyle = c.fillStyle; c.lineWidth = 0.6; c.stroke();
    }
    if (toolPending) drawTool();
    // colisões
    st.collisions.forEach(function (cl) {
      var p = S(cl.x, cl.y, cl.z); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(p[0], p[1], 6, 0, 7); c.fill();
    });
    c.fillStyle = '#94a3b3'; c.font = '11px system-ui';
    c.fillText((window.T || String)('1 dedo gira · 2 dedos zoom e move · fresa ' + (Math.round(st.D * 100) / 100) + ' mm · bruto no topo Z' + st.top), 10, H - 8);
  }

  root.Stock3D = { build: build, advance: advance, render: render };
})(this);
