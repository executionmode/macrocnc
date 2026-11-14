/* Simulação 3D realista (WebGL / three.js) — Macro CNC
 * Mesa com rasgos em T, bruto metálico com a remoção de material do Stock3D, fresa com hélices
 * no porta-ferramenta e a fixação montada em peças de verdade (morsa, grampos escalonados,
 * placas de 3 e 4 castanhas, calços paralelos, bloco em V).
 * Coordenadas: máquina (X, Y, Z) -> three (x = X, y = Z, z = -Y).
 */
(function (root) {
  'use strict';
  var THREE = null, loading = null;
  function load(src) {
    if (root.THREE) { THREE = root.THREE; return Promise.resolve(THREE); }
    if (loading) return loading;
    loading = new Promise(function (ok, fail) {
      var s = document.createElement('script'); s.src = src || 'vendor/three-bundle.js'; s.async = true;
      s.onload = function () { THREE = root.THREE; THREE ? ok(THREE) : fail(new Error('three')); };
      s.onerror = function () { loading = null; fail(new Error('three')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function webglOk() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

  /* ---------- materiais ---------- */
  var MAT = null;
  function mats() {
    if (MAT) return MAT;
    var S = function (o) { return new THREE.MeshStandardMaterial(o); };
    MAT = {
      steel: S({ color: 0xc9ced4, metalness: 0.92, roughness: 0.26 }),
      ground: S({ color: 0xd7dbe0, metalness: 0.95, roughness: 0.18 }),
      dark: S({ color: 0x2f343b, metalness: 0.75, roughness: 0.42 }),
      oxide: S({ color: 0x1d2126, metalness: 0.6, roughness: 0.5 }),
      blue: S({ color: 0x1f4fd6, metalness: 0.35, roughness: 0.32 }),
      brass: S({ color: 0xb08d57, metalness: 0.9, roughness: 0.3 }),
      table: S({ color: 0x8c939b, metalness: 0.85, roughness: 0.36 }),
      slot: S({ color: 0x3c4249, metalness: 0.7, roughness: 0.55 }),
      wall: S({ color: 0x59606a, metalness: 0.6, roughness: 0.5 }),
      stock: S({ vertexColors: true, metalness: 0.6, roughness: 0.42 }),
      flute: S({ color: 0xd0d5db, metalness: 0.95, roughness: 0.22 }),
      hit: S({ color: 0xe23b3b, metalness: 0.3, roughness: 0.4, emissive: 0x501010 }),
      sel: S({ color: 0xf59e0b, metalness: 0.4, roughness: 0.35, emissive: 0x3a2400 })
    };
    return MAT;
  }

  /* ---------- formas ---------- */
  // caixa com cantos chanfrados (sx em x, sy em altura, sz em profundidade), base em y = 0
  function cbox(sx, sy, sz, b) {
    b = Math.min(b == null ? 1.2 : b, sx / 4, sy / 4, sz / 4);
    if (b <= 0.05) { var g0 = new THREE.BoxGeometry(sx, sy, sz); g0.translate(0, sy / 2, 0); return g0; }
    var sh = new THREE.Shape(), w = sx / 2 - b, h = sy - b;
    sh.moveTo(-w, b); sh.lineTo(w, b); sh.lineTo(w, h); sh.lineTo(-w, h); sh.lineTo(-w, b);
    var g = new THREE.ExtrudeGeometry(sh, { depth: sz - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(sz - 2 * b) / 2);
    return g;
  }
  function cyl(r1, r2, h, seg) { var g = new THREE.CylinderGeometry(r1, r2, h, seg || 40); g.translate(0, h / 2, 0); return g; }
  function hex(r, h) { return cyl(r, r, h, 6); }
  function mesh(g, m, x, y, z, ry) {
    var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); if (ry) o.rotation.y = ry;
    o.castShadow = true; o.receiveShadow = true; return o;
  }
  function thread(r, len, pitch, m) {   // rosca aparente: anéis finos ao longo do eixo (y)
    var gs = [], n = Math.max(2, Math.floor(len / pitch));
    gs.push(cyl(r * 0.88, r * 0.88, len, 24));
    for (var i = 0; i < n; i++) { var t = new THREE.TorusGeometry(r * 0.9, r * 0.12, 6, 24); t.rotateX(Math.PI / 2); t.translate(0, pitch * (i + 0.5), 0); gs.push(t); }
    return new THREE.Mesh(THREE.mergeGeometries(gs, false), m);
  }

  /* ---------- itens de fixação (u = eixo do item, v = lateral; z = altura da máquina) ---------- */
  // cada builder devolve um THREE.Group na origem do item, girado pelo ângulo
  function tNutStud(g, u, v, zTable, zTop, M) {   // porca T no rasgo + prisioneiro + porca e arruela
    g.add(mesh(cbox(28, 12, 18, 1), M.oxide, u, zTable - 22, -v));
    var st = thread(8, zTop - zTable + 22 + 18, 2.5, M.steel); st.position.set(u, zTable - 22, -v); st.castShadow = true; g.add(st);
    g.add(mesh(cyl(15, 15, 3, 32), M.steel, u, zTop, -v));
    g.add(mesh(hex(14, 12), M.dark, u, zTop + 3, -v));
  }
  // morsa: ângulo 0 = mordentes apertando em Y, corpo e fuso ao longo de X (posição de trabalho na mesa)
  function ANG0(it) { return it.type === 'morsa' ? 90 : 0; }
  var BUILD = {
    morsa: function (it, M, zTable) {
      var g = new THREE.Group(), A = Math.max(1, +it.a || 100), W = Math.max(40, +it.w || 150), zt = +it.zt, zb = +it.zb;
      var t = 32, base = zb - 55, Lb = A + 2 * t + 140;   // corpo: vai além do mordente móvel (fuso)
      var cU = 35;   // o corpo é deslocado para o lado do fuso
      // pé / base
      g.add(mesh(cbox(Lb + 40, 18, W + 50, 2), M.steel, cU, base - 18, 0));
      // corpo com faixa azul
      g.add(mesh(cbox(Lb, zb - base - 2, W, 2), M.steel, cU, base, 0));
      g.add(mesh(cbox(Lb - 20, (zb - base) * 0.42, 1.5, 0.3), M.blue, cU, base + (zb - base) * 0.22, -(W / 2 + 0.4)));
      g.add(mesh(cbox(Lb - 20, (zb - base) * 0.42, 1.5, 0.3), M.blue, cU, base + (zb - base) * 0.22, W / 2 + 0.4));
      // mordente fixo e móvel (blocos) com mordentes retificados
      g.add(mesh(cbox(t + 30, zt - zb + 2, W, 2.5), M.steel, -(A / 2 + (t + 30) / 2), zb - 2, 0));
      g.add(mesh(cbox(t + 40, zt - zb + 2, W, 2.5), M.steel, A / 2 + (t + 40) / 2, zb - 2, 0));
      g.add(mesh(cbox(6, zt - zb, W - 6, 0.6), M.ground, -(A / 2 + 3), zb, 0));
      g.add(mesh(cbox(6, zt - zb, W - 6, 0.6), M.ground, A / 2 + 3, zb, 0));
      // fuso e manivela (saindo do mordente móvel)
      var uEnd = A / 2 + t + 40, zs = zb - (zb - base) * 0.35;
      var fs = thread(11, 120, 4, M.steel); fs.rotation.z = -Math.PI / 2; fs.position.set(uEnd - 20, zs, 0); g.add(fs);
      g.add(mesh(cyl(16, 16, 22, 32).rotateZ(-Math.PI / 2), M.dark, uEnd + 100, zs, 0));
      g.add(mesh(hex(13, 26).rotateZ(-Math.PI / 2), M.steel, uEnd + 122, zs, 0));
      // garras de fixação da morsa na mesa (como na foto): porca T, prisioneiro e porca
      [[-(Lb / 2 + 15) + cU, W / 2 + 40], [Lb / 2 + 15 + cU, -(W / 2 + 40)]].forEach(function (p) {
        g.add(mesh(cbox(46, 22, 46, 2), M.dark, p[0], base - 18, -p[1]));
        tNutStud(g, p[0], p[1], zTable, base + 4, M);
      });
      return g;
    },
    garra: function (it, M, zTable) {   // grampo escalonado: bloco de degraus, barra com rasgo, prisioneiro e porca
      var g = new THREE.Group(), L = Math.max(30, +it.L || 100), e = Math.max(6, +it.e || 16), w = Math.max(10, +it.w || 30), zp = +it.zp, zb = +it.zb;
      var hb = zp - zTable;   // altura do bloco escalonado até a garra
      // barra com rasgo (duas laterais + pontas), ponta com degrau por cima da peça
      var slotL = L * 0.5, uS = L * 0.45;
      g.add(mesh(cbox(L, e, w * 0.32, 1), M.oxide, L / 2, zp, -(w / 2 - w * 0.16)));
      g.add(mesh(cbox(L, e, w * 0.32, 1), M.oxide, L / 2, zp, (w / 2 - w * 0.16)));
      g.add(mesh(cbox(L * 0.22, e, w, 1), M.oxide, L * 0.11, zp, 0));
      g.add(mesh(cbox(L * 0.25, e, w, 1), M.oxide, L - L * 0.125, zp, 0));
      // bloco escalonado (calço de degraus) embaixo da ponta de trás
      var steps = Math.max(2, Math.min(6, Math.round(hb / 12))), sh = hb / steps;
      for (var i = 0; i < steps; i++) g.add(mesh(cbox(34 - i * 4, sh, w + 6, 0.8), M.oxide, L - 10 + i * 2, zTable + i * sh, 0));
      tNutStud(g, uS, 0, zTable, zp + e, M);
      return g;
    },
    placa: function (it, M, zTable) { return chuck(it, M, zTable, 3); },
    placa4: function (it, M, zTable) { return chuck(it, M, zTable, 4); },
    calco: function (it, M) {
      var g = new THREE.Group(), L = Math.max(5, +it.L || 100), e = Math.max(2, +it.e || 10), h = Math.max(2, +it.h || 30), zt = +it.zt;
      g.add(mesh(cbox(L, h, e, 0.5), M.ground, 0, zt - h, 0));
      return g;
    },
    blocov: function (it, M) {   // bloco em V
      var g = new THREE.Group(), L = Math.max(10, +it.L || 80), w = Math.max(20, +it.w || 70), h = Math.max(15, +it.h || 50), zt = +it.zt, dv = Math.min(h * 0.55, w * 0.4);
      var sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(dv, h); sh.lineTo(0, h - dv); sh.lineTo(-dv, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
      var ge = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 1 });
      ge.translate(0, 0, -L / 2); ge.rotateY(Math.PI / 2);
      g.add(mesh(ge, M.ground, 0, zt - h, 0));
      return g;
    }
  };
  function chuck(it, M, zTable, n) {
    var g = new THREE.Group(), D = Math.max(60, +it.D || 200), R = D / 2, zf = +it.zf, hj = Math.max(4, +it.hj || 25), rg = Math.max(2, +it.rg || 50), H = Math.max(40, Math.min(110, zf - zTable - 12));
    // corpo torneado com chanfros
    var pts = [new THREE.Vector2(0, 0), new THREE.Vector2(R - 4, 0), new THREE.Vector2(R, 4), new THREE.Vector2(R, H - 5), new THREE.Vector2(R - 5, H), new THREE.Vector2(R * 0.28 + 3, H), new THREE.Vector2(R * 0.28, H - 3), new THREE.Vector2(R * 0.28, H - 18), new THREE.Vector2(0, H - 18)];
    g.add(mesh(new THREE.LatheGeometry(pts, 72), M.steel, 0, zf - H, 0));
    // flange de montagem e garras na mesa
    g.add(mesh(cyl(R + 22, R + 22, 14, 72), M.steel, 0, zTable, 0));
    var Hm = zf - H - zTable - 14; if (Hm > 1) g.add(mesh(cyl(R * 0.9, R * 0.9, Hm, 48), M.dark, 0, zTable + 14, 0));
    // furos da chave
    for (var k = 0; k < n; k++) {
      var ak = (k + 0.5) / n * Math.PI * 2;
      var hole = mesh(cyl(7, 7, 6, 20).rotateX(Math.PI / 2), M.oxide, 0, 0, 0); hole.position.set(Math.cos(ak) * (R + 0.5), zf - H * 0.45, -Math.sin(ak) * (R + 0.5)); hole.lookAt(0, zf - H * 0.45, 0); hole.rotateX(Math.PI / 2); g.add(hole);
    }
    // castanhas escalonadas nos rasgos
    var lj = Math.min(R - rg - 2, 52), wj = Math.min(34, R * 0.28);
    for (var j = 0; j < n; j++) {
      var a = j / n * Math.PI * 2, jg = new THREE.Group();
      jg.add(mesh(cbox(Math.max(10, R - rg + 6), 6, wj + 8, 0.5), M.dark, (R + rg) / 2 - 3, -6, 0));   // rasgo
      var s = Math.max(8, lj / 3), inv = +it.inv === 1;   // normal: degraus subindo para fora; invertida: a parte alta aperta a peça
      jg.add(mesh(cbox(lj, hj * 0.45, wj, 1), M.steel, rg + lj / 2, 0, 0));
      jg.add(mesh(cbox(lj - s, hj * 0.75, wj, 1), M.steel, inv ? rg + (lj - s) / 2 : rg + s + (lj - s) / 2, 0, 0));
      jg.add(mesh(cbox(lj - 2 * s, hj, wj, 1), M.steel, inv ? rg + (lj - 2 * s) / 2 : rg + 2 * s + (lj - 2 * s) / 2, 0, 0));
      jg.position.y = zf; jg.rotation.y = a; g.add(jg);
    }
    tNutStud(g, R + 40, 0, zTable, zTable + 26, M); g.add(mesh(cbox(44, 26, 44, 2), M.dark, R + 40, zTable, 0));
    tNutStud(g, -(R + 40), 0, zTable, zTable + 26, M); g.add(mesh(cbox(44, 26, 44, 2), M.dark, -(R + 40), zTable, 0));
    return g;
  }

  /* ---------- visualizador ---------- */
  function Viewer(canvas) {
    this.cv = canvas; this.fixG = []; this.hitItem = null;
    var R = this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    R.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.92;
    R.outputColorSpace = THREE.SRGBColorSpace;
    var sc = this.scene = new THREE.Scene();
    sc.background = new THREE.Color(0x151b23);
    var pm = new THREE.PMREMGenerator(R); sc.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    this.cam = new THREE.PerspectiveCamera(32, 1, 1, 20000);
    sc.add(new THREE.HemisphereLight(0xdfe8f5, 0x2a2f36, 0.55));
    var L = this.sun = new THREE.DirectionalLight(0xffffff, 1.6); L.castShadow = true; L.shadow.mapSize.set(2048, 2048); L.shadow.bias = -0.0006; L.shadow.normalBias = 0.6;
    sc.add(L); sc.add(L.target);
    this.world = new THREE.Group(); sc.add(this.world);
    this.ray = new THREE.Raycaster();
    mats();
  }
  Viewer.prototype.setup = function (st, fixtures) {
    var M = mats(), w = this.world;
    while (w.children.length) { var c = w.children.pop(); if (c !== this.hitDot && c !== this.tool) c.traverse && c.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
    if (this.tool) { this.tool = null; this.toolKey = ''; }
    this.st = st; this.fixG = [];
    var si = st.stockInfo, sx0 = st.x0, sy0 = st.y0, sx1 = st.x0 + (st.nx - 1) * st.cell, sy1 = st.y0 + (st.ny - 1) * st.cell;
    // altura da mesa: embaixo de tudo o que está montado
    var zT = st.bottom;
    (fixtures || []).forEach(function (it) {
      if (it.type === 'morsa') zT = Math.min(zT, +it.zb - 73);
      else if (it.type === 'garra') zT = Math.min(zT, +it.zb);
      else if (it.type === 'placa' || it.type === 'placa4') zT = Math.min(zT, +it.zf - Math.max(40, Math.min(110, 60)) - 26);
      else if (it.type === 'calco' || it.type === 'blocov') zT = Math.min(zT, +it.zt - (+it.h || 30));
    });
    this.zTable = zT;
    // mesa com rasgos em T (rasgos ao longo de X, a cada 100 mm)
    var cx = (sx0 + sx1) / 2, cy = (sy0 + sy1) / 2, span = Math.max(sx1 - sx0, sy1 - sy0), TW = Math.max(600, span * 2.6), TD = Math.max(420, span * 2.0);
    var tg = new THREE.Group(), pitch = 100, sw = 18, y0 = Math.floor((cy - TD / 2) / pitch) * pitch + pitch / 2;
    tg.add(mesh(cbox(TW, 40, TD, 3), M.slot, cx, zT - 70, -cy));
    for (var yy = y0 - pitch; yy < cy + TD / 2 + pitch; yy += pitch) {
      var ya = Math.max(cy - TD / 2, yy - pitch + sw / 2), yb = Math.min(cy + TD / 2, yy - sw / 2);
      if (yb - ya > 2) tg.add(mesh(cbox(TW, 30, yb - ya, 1.5), M.table, cx, zT - 30, -(ya + yb) / 2));
    }
    w.add(tg);
    // parede do fundo e laterais da máquina
    var back = mesh(new THREE.PlaneGeometry(TW * 1.6, 900), M.wall, cx, zT + 300, -(cy + TD / 2 + 220)); back.receiveShadow = true; back.castShadow = false; w.add(back);
    // bruto
    this.buildStock(st);
    // fixação
    var self = this;
    (fixtures || []).forEach(function (it, i) {
      var b = BUILD[it.type]; if (!b) return;
      var g = b(it, M, zT);
      g.position.set(+it.x || 0, 0, -(+it.y || 0)); g.rotation.y = ((+it.ang || 0) + ANG0(it)) * Math.PI / 180;
      g.userData.fix = i; g.traverse(function (o) { o.userData.fix = i; if (o.isMesh) o.userData.mat0 = o.material; });
      w.add(g); self.fixG[i] = g;
    });
    // ferramenta
    this.tool = null; this.toolKey = '';
    // luz e enquadramento
    this.center = new THREE.Vector3(cx, (st.top + st.bottom) / 2, -cy); this.span = Math.max(span, st.top - st.bottom, 60);
    var L = this.sun, d = this.span * 2.2;
    L.position.set(cx - d * 0.6, st.top + d * 1.4, -cy + d * 0.9); L.target.position.copy(this.center);
    var cam = L.shadow.camera; cam.left = -d; cam.right = d; cam.top = d; cam.bottom = -d; cam.near = 1; cam.far = d * 6; cam.updateProjectionMatrix();
  };
  // malha do bruto a partir da grade de alturas (topo + paredes); só o Y (Z da máquina) muda durante a usinagem
  Viewer.prototype.buildStock = function (st) {
    var nx = st.nx, ny = st.ny, ins = st.inside, cell = st.cell, x0 = st.x0, y0 = st.y0, bot = st.bottom;
    var vid = new Int32Array(nx * ny).fill(-1), P = [], idx = [], topN = [], n = 0;
    function cellIn(i, j) { if (i < 0 || j < 0 || i >= nx - 1 || j >= ny - 1) return false; var k = j * nx + i; return ins[k] && ins[k + 1] && ins[k + nx] && ins[k + nx + 1]; }
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var k = j * nx + i; if (!ins[k]) continue;
      vid[k] = n++; P.push(x0 + i * cell, st.h[k], -(y0 + j * cell)); topN.push(k);
    }
    for (var j2 = 0; j2 < ny - 1; j2++) for (var i2 = 0; i2 < nx - 1; i2++) {
      if (!cellIn(i2, j2)) continue;
      var a = vid[j2 * nx + i2], b = vid[j2 * nx + i2 + 1], c = vid[(j2 + 1) * nx + i2], d = vid[(j2 + 1) * nx + i2 + 1];
      idx.push(a, b, d, a, d, c);
    }
    // paredes nas bordas (vértices próprios: canto vivo)
    var wallTop = [], wallN = [], self = this;
    // normal horizontal suave pela forma do bruto (contorno em escada fica liso, sem listras)
    function nrm(k) {
      var ki = k % nx, kj = (k - ki) / nx, gx = 0, gy = 0;
      for (var dj = -4; dj <= 4; dj++) for (var di = -4; di <= 4; di++) {
        var qi = ki + di, qj = kj + dj; if (qi < 0 || qj < 0 || qi >= nx || qj >= ny) continue;
        if (ins[qj * nx + qi]) { var wgt = Math.exp(-(di * di + dj * dj) / 8); gx += di * wgt; gy += dj * wgt; }
      }
      var gl = Math.hypot(gx, gy) || 1; return [-gx / gl, 0, gy / gl];   // para fora do material (three z = -Y)
    }
    function wall(ka, kb) {
      var i0 = n, na = nrm(ka), nb = nrm(kb); wallN.push([i0, na], [i0 + 1, nb], [i0 + 2, nb], [i0 + 3, na]); P.push(x0 + (ka % nx) * cell, st.h[ka], -(y0 + Math.floor(ka / nx) * cell)); P.push(x0 + (kb % nx) * cell, st.h[kb], -(y0 + Math.floor(kb / nx) * cell));
      P.push(x0 + (kb % nx) * cell, bot, -(y0 + Math.floor(kb / nx) * cell)); P.push(x0 + (ka % nx) * cell, bot, -(y0 + Math.floor(ka / nx) * cell));
      wallTop.push([i0, ka], [i0 + 1, kb]); n += 4;
      idx.push(i0, i0 + 2, i0 + 3, i0, i0 + 1, i0 + 2);   // virada para fora
    }
    for (var j3 = 0; j3 < ny - 1; j3++) for (var i3 = 0; i3 < nx - 1; i3++) {
      if (!cellIn(i3, j3)) continue;
      var k00 = j3 * nx + i3, k10 = k00 + 1, k01 = k00 + nx, k11 = k01 + 1;
      if (!cellIn(i3, j3 - 1)) wall(k10, k00);   // lado -Y da máquina
      if (!cellIn(i3, j3 + 1)) wall(k01, k11);
      if (!cellIn(i3 - 1, j3)) wall(k00, k01);
      if (!cellIn(i3 + 1, j3)) wall(k11, k10);
    }
    // fundo
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    g.setIndex(idx);
    var m = new THREE.Mesh(g, mats().stock); m.castShadow = true; m.receiveShadow = true;
    this.stock = m; this.topN = topN; this.wallTop = wallTop; this.wallN = wallN; this.nTop = topN.length; this.world.add(m);
    var bgeo = new THREE.PlaneGeometry((nx - 1) * cell, (ny - 1) * cell); bgeo.rotateX(Math.PI / 2);
    this.stockKey = st.h; this.updateStock(st, true);
  };
  Viewer.prototype.updateStock = function (st, force) {
    var g = this.stock.geometry, pos = g.attributes.position.array, col = g.attributes.color.array, h = st.h, h0 = st.h0, top = st.top, zr = Math.max(1, top - st.bottom);
    for (var t = 0; t < this.nTop; t++) {
      var k = this.topN[t], z = h[k]; pos[t * 3 + 1] = z;
      var cut = z < h0[k] - 0.01, c = cut ? 0.62 - 0.12 * Math.min(1, (top - z) / zr) : 0.2;
      col[t * 3] = cut ? c : 0.2; col[t * 3 + 1] = cut ? c + 0.01 : 0.2; col[t * 3 + 2] = cut ? c + 0.03 : 0.21;
    }
    var WT = this.wallTop;
    for (var w = 0; w < WT.length; w++) {
      var vi = WT[w][0], kk = WT[w][1]; pos[vi * 3 + 1] = h[kk];
      var cutW = h[kk] < h0[kk] - 0.01, cw = cutW ? 0.58 : 0.2;
      col[vi * 3] = cw; col[vi * 3 + 1] = cw; col[vi * 3 + 2] = cw - (cutW ? 0 : 0.03);
      var vb = vi % 2 === 0 ? vi + 3 : vi + 1; col[vb * 3] = 0.18; col[vb * 3 + 1] = 0.18; col[vb * 3 + 2] = 0.19;
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    g.computeVertexNormals();
    var nm = g.attributes.normal.array, WN = this.wallN;
    for (var q = 0; q < WN.length; q++) { var v3 = WN[q][0] * 3, nn = WN[q][1]; nm[v3] = nn[0]; nm[v3 + 1] = nn[1]; nm[v3 + 2] = nn[2]; }
    g.attributes.normal.needsUpdate = true; g.computeBoundingSphere();
  };
  // fresa de topo com hélices, haste, pinça e porta-ferramenta (ponta em y = 0)
  function toolGroup(D, shape) {
    var M = mats(), g = new THREE.Group(), r = D / 2, fl = Math.max(D * 2, 14), so = Math.max(D * 3.4, 32);
    var fg;
    if (shape && shape.type === 'v') {
      var hc = (r - (shape.tipD || 0) / 2) / Math.tan(((shape.angle || 90) / 2) * Math.PI / 180);
      fg = cyl(Math.max(0.2, (shape.tipD || 0) / 2), r, hc, 40); g.add(mesh(fg, M.flute)); g.add(mesh(cyl(r * 0.92, r * 0.92, so - hc, 32), M.ground, 0, hc, 0));
    } else {
      fg = new THREE.CylinderGeometry(r, r, fl, 64, Math.max(16, Math.round(fl / 1.5)), false); fg.translate(0, fl / 2, 0);
      var p = fg.attributes.position, nfl = D >= 30 ? 4 : 3, tw = Math.PI * 2 / (D * 3.2);
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i), rr = Math.hypot(x, z); if (rr < r * 0.5) continue;
        var th = Math.atan2(z, x) - y * tw, best = 9;
        for (var f = 0; f < nfl; f++) { var dd = Math.abs(((th - f * 2 * Math.PI / nfl) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); best = Math.min(best, dd); }
        var k = best < 0.55 ? 0.7 + 0.3 * Math.pow(best / 0.55, 2) : 1; p.setX(i, x * k); p.setZ(i, z * k);
      }
      fg.computeVertexNormals(); g.add(mesh(fg, M.flute));
      g.add(mesh(cyl(r * 0.94, r * 0.94, so - fl, 40), M.ground, 0, fl, 0));
    }
    var zh = so; // porca da pinça, cone, flange e nariz do fuso
    g.add(mesh(cyl(Math.max(r * 1.6, 14), Math.max(r * 1.8, 16), 18, 6), M.steel, 0, zh, 0));
    g.add(mesh(cyl(Math.max(r * 2.2, 22), Math.max(r * 2.6, 28), 46, 48), M.steel, 0, zh + 18, 0));
    g.add(mesh(cyl(Math.max(r * 3.2, 40), Math.max(r * 3.2, 40), 18, 48), M.dark, 0, zh + 64, 0));
    g.add(mesh(cyl(Math.max(r * 4.4, 58), Math.max(r * 4.4, 58), 70, 64), M.steel, 0, zh + 82, 0));
    g.add(mesh(cyl(Math.max(r * 5.2, 70), Math.max(r * 5.2, 70), 140, 64), M.dark, 0, zh + 152, 0));
    return g;
  }
  Viewer.prototype.setTool = function (T, D, shape, show) {
    var key = D + '|' + JSON.stringify(shape || null);
    if (this.toolKey !== key) { if (this.tool) this.world.remove(this.tool); this.tool = toolGroup(D, shape); this.toolKey = key; this.world.add(this.tool); }
    this.tool.visible = !!(show && T);
    if (T) this.tool.position.set(T.x, T.z, -T.y);
  };
  Viewer.prototype.setHit = function (p) {   // ponto vermelho onde a fresa bateu
    if (!this.hitDot) { this.hitDot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); this.world.add(this.hitDot); }
    if (this.hitDot.parent !== this.world) this.world.add(this.hitDot);
    this.hitDot.visible = !!p; if (p) { this.hitDot.position.set(p.x, p.z, -p.y); this.hitDot.scale.setScalar(Math.max(3, this.span * 0.025)); }
  };
  Viewer.prototype.mark = function (sel, hit) {   // contorno do item escolhido (amarelo) ou do que bateu (vermelho); a peça mantém o aço
    var w = this.world, self = this;
    (this.marks || []).forEach(function (b) { w.remove(b); b.geometry.dispose(); });
    this.marks = [];
    [[sel, 0xf59e0b], [hit, 0xff3030]].forEach(function (q) {
      var g = q[0] != null ? self.fixG[q[0]] : null; if (!g) return;
      var bh = new THREE.BoxHelper(g, q[1]); bh.material.depthTest = false; bh.material.transparent = true; bh.renderOrder = 10; w.add(bh); self.marks.push(bh);
    });
  };
  Viewer.prototype.render = function (view, W, H) {
    var R = this.renderer;
    if (this.cv.width !== Math.round(W * R.getPixelRatio()) || this.cv.height !== Math.round(H * R.getPixelRatio())) R.setSize(W, H, false);
    var cam = this.cam; cam.aspect = W / H; cam.updateProjectionMatrix();
    var az = (view.az || 0) * Math.PI / 180, el = Math.max(5, Math.min(89.5, view.el || 38)) * Math.PI / 180, dist = this.span * 2.1 / (view.zoom || 1);
    var c = this.center, dir = new THREE.Vector3(Math.sin(-az) * Math.cos(el), Math.sin(el), Math.cos(-az) * Math.cos(el));
    var right = new THREE.Vector3(Math.cos(-az), 0, -Math.sin(-az)), up = new THREE.Vector3().crossVectors(dir, right).negate();
    var k = dist * 2 * Math.tan(cam.fov * Math.PI / 360) / H, tgt = c.clone().addScaledVector(right, -(view.panX || 0) * k).addScaledVector(up, (view.panY || 0) * k);
    cam.position.copy(tgt).addScaledVector(dir, dist); cam.up.set(0, 1, 0); if (el > 1.55) cam.up.set(0, 0, -1); cam.lookAt(tgt);
    cam.near = Math.max(1, dist / 50); cam.far = dist * 20; cam.updateProjectionMatrix();
    R.render(this.scene, cam);
  };
  // item de fixação embaixo do dedo e o ponto 3D tocado
  Viewer.prototype.pick = function (u, v, W, H) {
    this.ray.setFromCamera(new THREE.Vector2(u / W * 2 - 1, -(v / H) * 2 + 1), this.cam);
    var objs = this.fixG.filter(Boolean), hit = this.ray.intersectObjects(objs, true)[0];
    if (!hit) return null;
    return { item: hit.object.userData.fix, x: hit.point.x, y: -hit.point.z, z: hit.point.y };
  };
  // ponto da tela -> X Y na altura z
  Viewer.prototype.onPlane = function (u, v, W, H, z) {
    this.ray.setFromCamera(new THREE.Vector2(u / W * 2 - 1, -(v / H) * 2 + 1), this.cam);
    var pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -z), p = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(pl, p)) return null;
    return [p.x, -p.z];
  };
  // miniatura de um item (catálogo)
  var thumbR = null;
  function thumb(type, it) {
    var cv = document.createElement('canvas'); cv.width = 240; cv.height = 170;
    if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.outputColorSpace = THREE.SRGBColorSpace; }
    thumbR.setSize(240, 170, false);
    var sc = new THREE.Scene(), pm = new THREE.PMREMGenerator(thumbR); sc.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    sc.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.6)); var dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(-200, 400, 300); sc.add(dl);
    var g = BUILD[type](it, mats(), it.zT != null ? it.zT : -80); sc.add(g);
    var box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()).length();
    var cam = new THREE.PerspectiveCamera(30, 240 / 170, 1, 10000); cam.position.set(c.x + s * 0.95, c.y + s * 0.75, c.z + s * 1.25); cam.lookAt(c);
    thumbR.render(sc, cam);
    var url = thumbR.domElement.toDataURL('image/png');
    g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    return url;
  }
  root.Sim3D = { load: load, webglOk: webglOk, Viewer: Viewer, thumb: thumb, types: function () { return Object.keys(BUILD); } };
})(this);
