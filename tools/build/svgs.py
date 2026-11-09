# Ilustrações originais do treinamento (SVG, tema escuro)
import math

C_LINE = '#8fc3ff'; C_TXT = '#e6edf3'; C_MUT = '#93a7c0'; C_PART = '#2b3d55'; C_PART2 = '#3b5272'
C_TOOL = '#f5a524'; C_OK = '#3ccf8e'; C_ERR = '#ff6b6b'; C_BOX = '#0f1d34'

def svg(w, h, body):
    return ('<svg class="tsvg" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
            'font-family="system-ui,Segoe UI,Roboto,Arial" font-size="12">'
            '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path d="M0 0L10 5L0 10z" fill="%s"/></marker></defs>%s</svg>') % (w, h, C_LINE, body)

def T(x, y, s, size=12, fill=C_TXT, anchor='start', weight='normal', mono=False):
    fam = ' font-family="ui-monospace,Menlo,Consolas,monospace"' if mono else ''
    return '<text x="%s" y="%s" font-size="%s" fill="%s" text-anchor="%s" font-weight="%s"%s>%s</text>' % (x, y, size, fill, anchor, weight, fam, s)

def box(x, y, w, h, fill=C_BOX, stroke=C_LINE, r=8):
    return '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s" stroke-width="1.4"/>' % (x, y, w, h, r, fill, stroke)

def arrow(x1, y1, x2, y2, color=C_LINE, dash=False):
    d = ' stroke-dasharray="5 4"' if dash else ''
    return '<path d="M%s %s L%s %s" stroke="%s" stroke-width="1.8" fill="none" marker-end="url(#ar)"%s/>' % (x1, y1, x2, y2, color, d)

def fluxo():
    b = box(10, 20, 160, 150) + T(90, 42, 'Programa principal', 13, anchor='middle', weight='bold') + T(90, 58, 'O0001 (operador edita)', 11, C_MUT, 'middle')
    for i, l in enumerate(['T10 ; M6 ;', 'S1200 M3 ;', 'G65 P1611 X215.', '  Y215. W0 Z-2.5 ;', 'G0 Z100. ;', 'M30 ;']):
        col = C_TOOL if 'G65' in l or 'Y215' in l else C_TXT
        b += T(22, 82 + i * 15, l, 11, col, mono=True)
    b += box(250, 20, 160, 150) + T(330, 42, 'Macro (subprograma)', 13, anchor='middle', weight='bold') + T(330, 58, 'O1611 (ninguém mexe)', 11, C_MUT, 'middle')
    for i, l in enumerate(['#100 = #20 / 2 ;', 'contas ...', 'G1 X... Y... ;', 'IF [...] GOTO 10 ;', 'M99 ;']):
        col = C_OK if 'M99' in l else C_TXT
        b += T(262, 82 + i * 15, l, 11, col, mono=True)
    b += arrow(170, 105, 248, 70) + T(209, 78, 'G65 chama', 11, C_TOOL, 'middle')
    b += arrow(250, 148, 172, 150, C_OK, True) + T(211, 165, 'M99 volta', 11, C_OK, 'middle')
    b += T(210, 195, 'As letras do G65 viram variáveis dentro da macro', 12, C_MUT, 'middle')
    return svg(420, 205, b)

def gavetas():
    rows = [('#1 a #33', 'Locais', 'recebem as letras do G65', 'zeradas no M99'),
            ('#100 a #199', 'Comuns', 'contas da macro', 'zeradas ao desligar'),
            ('#500 a #999', 'Permanentes', 'contador, vida da ferramenta', 'ficam gravadas'),
            ('#3000, #3006 ...', 'Sistema', 'alarme, mensagem, corretores', 'função especial')]
    b = ''
    for i, (r, n, u, f) in enumerate(rows):
        y = 12 + i * 48
        b += box(10, y, 400, 40, '#122440', C_LINE, 6) + '<rect x="186" y="%d" width="48" height="6" rx="3" fill="%s"/>' % (y + 30, C_MUT)
        b += T(22, y + 18, r, 13, C_TOOL, mono=True, weight='bold') + T(22, y + 33, n, 11, C_TXT, weight='bold')
        b += T(250, y + 18, u, 11, C_TXT) + T(250, y + 33, f, 11, C_MUT)
    return svg(420, 205, b)

def letras():
    b = T(210, 24, 'G65 P1611  X215.  Y215.  W0  Z-2.5  K2.5  T50.', 13, C_TOOL, 'middle', 'bold', True)
    pairs = [('X215.', '#24 = 215', 97), ('Y215.', '#25 = 215', 160), ('W0', '#23 = 0', 214), ('Z-2.5', '#26 = -2.5', 262), ('K2.5', '#6 = 2.5', 316), ('T50.', '#20 = 50', 364)]
    for i, (l, v, x) in enumerate(pairs):
        y2 = 70 + (i % 2) * 34
        b += arrow(x, 32, x, y2 - 14) + box(x - 40, y2 - 13, 80, 22, '#122440', C_LINE, 5) + T(x, y2 + 2, v, 11, C_TXT, 'middle', mono=True)
    b += T(210, 150, 'O FANUC só troca a letra pela variável.', 12, C_MUT, 'middle')
    b += T(210, 168, 'Quem diz o que cada uma significa é a macro.', 12, C_MUT, 'middle')
    return svg(420, 180, b)

def laco():
    b = box(150, 8, 120, 30) + T(210, 28, '#100 = 0', 12, anchor='middle', mono=True)
    b += arrow(210, 38, 210, 56)
    b += box(120, 58, 180, 32, '#13304f') + T(210, 79, 'N10  faz o trabalho', 12, anchor='middle', mono=True)
    b += arrow(210, 90, 210, 106)
    b += box(130, 108, 160, 30) + T(210, 128, '#100 = #100 + 1', 12, anchor='middle', mono=True)
    b += arrow(210, 138, 210, 156)
    b += '<path d="M210 158 L290 184 L210 210 L130 184 Z" fill="%s" stroke="%s" stroke-width="1.4"/>' % (C_BOX, C_TOOL)
    b += T(210, 182, 'ainda falta?', 12, anchor='middle') + T(210, 196, 'IF [#100 LT #2]', 10, C_MUT, 'middle', mono=True)
    b += '<path d="M290 184 L360 184 L360 74 L302 74" stroke="%s" stroke-width="1.8" fill="none" marker-end="url(#ar)"/>' % C_OK
    b += T(366, 130, 'sim: GOTO 10', 11, C_OK)
    b += arrow(210, 210, 210, 238, C_ERR) + T(222, 232, 'não: segue (sai do laço)', 11, C_ERR)
    return svg(470, 245, b)

def faceamento():
    b = T(110, 16, 'Vista de cima', 12, C_MUT, 'middle')
    b += '<rect x="30" y="26" width="160" height="120" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    ys = [40, 62, 84, 106, 128, 140]
    path = 'M10 %d' % ys[0]
    for i, y in enumerate(ys):
        x = 210 if i % 2 == 0 else 10
        path += ' L%d %d' % (x, y)
        if i < len(ys) - 1: path += ' L%d %d' % (x, ys[i + 1])
    b += '<path d="%s" stroke="%s" stroke-width="2" fill="none"/>' % (path, C_TOOL)
    b += '<circle cx="10" cy="40" r="9" fill="none" stroke="%s" stroke-width="1.5"/>' % C_TOOL
    b += T(110, 162, 'vai-e-volta em X, avança Q em Y', 11, C_TXT, 'middle')
    b += T(320, 16, 'Vista de lado', 12, C_MUT, 'middle')
    b += '<rect x="240" y="40" width="160" height="70" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    for i, z in enumerate([40, 55, 70]):
        b += '<line x1="235" y1="%d" x2="405" y2="%d" stroke="%s" stroke-dasharray="4 3" stroke-width="1.3"/>' % (z + 15, z + 15, C_TOOL)
        b += T(410, z + 19, 'K' if i == 0 else '', 11, C_TOOL)
    b += T(232, 44, 'W', 11, C_MUT, 'end') + T(232, 89, 'Z', 11, C_MUT, 'end')
    b += T(320, 132, 'uma camada a cada K até o Z final', 11, C_TXT, 'middle')
    return svg(420, 172, b)

def pcd():
    cx, cy, R = 120, 105, 75
    b = '<circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-dasharray="5 4"/>' % (cx, cy, R, C_MUT)
    b += '<line x1="30" y1="%d" x2="215" y2="%d" stroke="%s"/><line x1="%d" y1="15" x2="%d" y2="195" stroke="%s"/>' % (cy, cy, '#33465f', cx, cx, '#33465f')
    for k in range(8):
        a = math.radians(22.5 + k * 45)
        x, y = cx + R * math.cos(a), cy - R * math.sin(a)
        b += '<circle cx="%.1f" cy="%.1f" r="7" fill="%s" stroke="%s"/>' % (x, y, '#0a1322', C_TOOL if k == 1 else C_LINE)
    a = math.radians(67.5); x, y = cx + R * math.cos(a), cy - R * math.sin(a)
    b += '<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2"/>' % (cx, cy, x, y, C_TOOL)
    b += '<path d="M%d %d A28 28 0 0 0 %.1f %.1f" fill="none" stroke="%s"/>' % (cx + 28, cy, cx + 28 * math.cos(a), cy - 28 * math.sin(a), C_OK)
    b += T(cx + 32, cy - 12, 'θ', 13, C_OK) + T((cx + x) / 2 - 14, (cy + y) / 2, 'R', 13, C_TOOL, weight='bold')
    b += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%d" stroke="%s" stroke-dasharray="3 3"/>' % (x, y, x, cy, C_OK)
    b += T(250, 50, 'X = centro X + R × COS θ', 12, C_TXT, mono=True) + T(250, 72, 'Y = centro Y + R × SIN θ', 12, C_TXT, mono=True)
    b += T(250, 106, 'θ = A + (n - 1) × 360 / B', 12, C_TOOL, mono=True)
    b += T(250, 132, 'A = ângulo do 1º furo', 11, C_MUT) + T(250, 148, 'B = quantidade de furos', 11, C_MUT) + T(250, 164, 'R = J / 2 (J é diâmetro!)', 11, C_MUT)
    return svg(450, 205, b)

def helice():
    b = '<rect x="60" y="30" width="20" height="150" fill="%s"/><rect x="220" y="30" width="20" height="150" fill="%s"/>' % (C_PART, C_PART)
    b += '<rect x="60" y="180" width="180" height="16" fill="%s"/>' % C_PART2
    pts = []
    for i in range(0, 241):
        t = i / 60.0
        x = 150 + 55 * math.cos(t * 2 * math.pi)
        y = 40 + t * 32
        pts.append('%.1f %.1f' % (x, y))
    b += '<path d="M%s" stroke="%s" stroke-width="2" fill="none"/>' % (' L'.join(pts), C_TOOL)
    b += '<ellipse cx="150" cy="172" rx="55" ry="6" fill="none" stroke="%s" stroke-width="2"/>' % C_OK
    b += '<line x1="255" y1="72" x2="255" y2="104" stroke="%s"/>' % C_TXT + T(262, 92, 'K = descida por volta', 11, C_TXT)
    b += T(262, 172, 'volta plana no fundo', 11, C_OK)
    b += T(262, 40, 'raio = (D - T) / 2', 12, C_TOOL, mono=True)
    return svg(420, 205, b)

def aneis():
    b = '<circle cx="110" cy="100" r="85" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    for r in [12, 30, 48, 66, 78]:
        b += '<circle cx="110" cy="100" r="%d" fill="none" stroke="%s" stroke-width="2"/>' % (r, C_TOOL)
    b += '<path d="M110 100 L188 100" stroke="%s" stroke-dasharray="3 3"/>' % C_TXT
    b += T(220, 70, 'Começa no centro', 12) + T(220, 90, 'e abre em anéis até a parede.', 12)
    b += T(220, 120, 'Passo entre anéis = Q', 12, C_TOOL) + T(220, 140, '(não maior que a fresa)', 11, C_MUT)
    return svg(420, 200, b)

def bolsao():
    b = '<rect x="20" y="20" width="200" height="150" rx="14" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    for i, (w, h) in enumerate([(30, 10), (80, 50), (130, 90), (176, 128)]):
        b += '<rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="none" stroke="%s" stroke-width="2"/>' % (120 - w / 2, 95 - h / 2, w, h, 4 + i * 3, C_TOOL)
    b += T(240, 70, 'Voltas de dentro para fora,', 12) + T(240, 90, 'cantos com raio C.', 12)
    b += T(240, 122, 'I × J = tamanho do bolsão', 12, C_TOOL)
    return svg(420, 190, b)

def espiral():
    b = T(100, 16, 'Vista de cima', 12, C_MUT, 'middle')
    b += '<rect x="45" y="40" width="110" height="80" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    b += '<rect x="30" y="25" width="140" height="110" rx="15" fill="none" stroke="%s" stroke-width="2"/>' % C_TOOL
    b += T(100, 152, 'fresa por fora (G2)', 11, C_TXT, 'middle')
    b += T(310, 16, 'Vista de lado', 12, C_MUT, 'middle')
    b += '<rect x="250" y="40" width="120" height="100" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    pts = []
    for i in range(0, 13):
        y = 40 + i * 7
        pts.append('%d %d' % (235 if i % 2 == 0 else 385, y))
    b += '<path d="M%s" stroke="%s" stroke-width="1.6" fill="none"/>' % (' L'.join(pts), C_TOOL)
    b += '<line x1="235" y1="124" x2="385" y2="124" stroke="%s" stroke-width="2.2"/>' % C_OK
    b += T(310, 160, 'desce enquanto contorna;', 11, C_TXT, 'middle') + T(310, 175, 'última volta plana no fundo', 11, C_OK, 'middle')
    return svg(420, 185, b)

def raios():
    b = T(100, 16, 'Convexo (arredonda a aresta)', 12, C_MUT, 'middle')
    b += '<path d="M20 50 L120 50 A60 60 0 0 1 180 110 L180 180 L20 180 Z" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    a = math.radians(40); cx, cy, R = 120, 110, 60
    px, py = cx + R * math.sin(a), cy - R * math.cos(a)
    b += '<circle cx="%.1f" cy="%.1f" r="4" fill="%s"/>' % (px, py, C_TOOL)
    b += '<rect x="%.1f" y="%.1f" width="40" height="40" fill="none" stroke="%s" stroke-width="2"/>' % (px, py - 40, C_TOOL)
    b += '<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke="%s" stroke-dasharray="3 3"/>' % (cx, cy, px, py, C_OK) + T(cx + 6, cy - 14, 'θ', 12, C_OK)
    b += T(310, 16, 'Côncavo (cava)', 12, C_MUT, 'middle')
    b += '<path d="M230 50 L290 50 A60 60 0 0 0 350 110 L400 110 L400 180 L230 180 Z" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    a2 = math.radians(50); cx2, cy2 = 350, 50
    qx, qy = cx2 - R * math.cos(a2), cy2 + R * math.sin(a2)
    b += '<circle cx="%.1f" cy="%.1f" r="4" fill="%s"/>' % (qx, qy, C_TOOL)
    b += '<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke="%s" stroke-dasharray="3 3"/>' % (cx2, cy2, qx, qy, C_OK)
    b += T(210, 205, 'A ponta da fresa toca a curva em cada ângulo; o passo é H graus.', 11, C_TXT, 'middle')
    return svg(420, 215, b)

def chanfro():
    b = '<path d="M20 50 L200 50 L260 110 L260 190 L20 190 Z" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    b += '<path d="M200 50 L260 50" stroke="%s" stroke-dasharray="4 3"/><path d="M260 50 L260 110" stroke="%s" stroke-dasharray="4 3"/>' % (C_TXT, C_TXT)
    b += '<path d="M200 50 L260 110" stroke="%s" stroke-width="3"/>' % C_TOOL
    b += T(230, 42, 'C', 13, C_TOOL, 'middle', 'bold')
    b += T(268, 84, 'C × TAN B', 12, C_TOOL)
    b += '<path d="M222 50 A22 22 0 0 1 215.6 65.6" fill="none" stroke="%s"/>' % C_OK + T(212, 72, 'B', 12, C_OK, 'end')
    b += T(30, 30, 'C = largura do chanfro no topo; B = ângulo em relação ao topo', 11, C_MUT)
    b += T(30, 210, 'B45 → altura = C (chanfro C × C)', 11, C_TXT)
    return svg(400, 220, b)

def chanfro90():
    b = T(105, 16, 'Ponta da fresa 90° na linha', 12, C_MUT, 'middle')
    b += '<path d="M10 60 L120 60 L180 120 L180 190 L10 190 Z" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    b += '<path d="M150 90 L105 45 L105 10 L195 10 L195 45 Z" fill="%s" fill-opacity=".85" stroke="#ffd48a"/>' % C_TOOL
    b += '<circle cx="150" cy="90" r="4" fill="#fff"/>'
    b += T(320, 16, 'B60 com fresa 90°: não dá', 12, C_ERR, 'middle')
    b += '<path d="M230 60 L320 60 L355 120 L355 190 L230 190 Z" fill="%s" stroke="%s"/>' % (C_PART, C_LINE)
    b += '<path d="M337 90 L297 50 L297 15 L377 15 L377 50 Z" fill="%s" fill-opacity=".55" stroke="%s"/>' % (C_TOOL, C_ERR)
    b += '<path d="M320 60 L355 120" stroke="%s" stroke-width="3"/>' % C_OK
    b += T(395, 140, 'a lateral a 45°', 11, C_ERR, 'end') + T(395, 155, 'entra na parede', 11, C_ERR, 'end')
    b += T(210, 210, 'Fresa 90°: B até 45. Ângulo mais fechado: fresa de topo reta (O1628, O1630).', 11, C_TXT, 'middle')
    return svg(420, 220, b)

def rosca():
    b = '<rect x="40" y="20" width="30" height="170" fill="%s"/><rect x="250" y="20" width="30" height="170" fill="%s"/>' % (C_PART, C_PART)
    for i in range(9):
        y = 30 + i * 18
        b += '<path d="M70 %d L82 %d L70 %d" fill="%s"/><path d="M250 %d L238 %d L250 %d" fill="%s"/>' % (y, y + 6, y + 12, C_PART, y + 9, y + 15, y + 21, C_PART)
    pts = []
    for i in range(0, 201):
        t = i / 40.0
        pts.append('%.1f %.1f' % (160 + 70 * math.cos(t * 2 * math.pi), 30 + t * 30))
    b += '<path d="M%s" stroke="%s" stroke-width="2" fill="none"/>' % (' L'.join(pts), C_TOOL)
    b += '<line x1="300" y1="60" x2="300" y2="90" stroke="%s"/>' % C_TXT + T(306, 80, 'P = passo da rosca', 11) + T(306, 96, '(desce P por volta)', 11, C_MUT)
    b += T(306, 140, 'G2 descendo:', 11, C_TOOL) + T(306, 156, 'rosca à direita', 11, C_TOOL)
    return svg(430, 200, b)

MEDIA = {
  'blob/0d4c4a20-256d': fluxo, 'blob/13063519-e268': gavetas, 'blob/95f5bf8e-b825': letras, 'blob/e7c37f53-6e59': laco,
  'blob/2319366b-4482': faceamento, 'blob/e07dd4f8-1580': pcd, 'blob/e91aee8e-711b': helice, 'blob/c69e7c82-be07': aneis,
  'blob/f87bca0a-1699': bolsao, 'blob/0cb9692f-b737': espiral, 'blob/5ec18d5b-1a97': raios, 'blob/3b2fd952-b27a': chanfro,
  'blob/31123d3d-9833': chanfro90, 'blob/a9a1cf67-fdf0': rosca,
}
