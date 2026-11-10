import json, re
d = json.load(open('blocks.json'))
M, P = d['macro'], d['param']

def modernize_param(code):
    """O0002/O0003: cabeçalho e final no padrão atual (pedido nas regras)."""
    code = code.replace('G17 G21 G40 G49 G80 G90 G94', 'G21 G40 G90 G94')
    code = code.replace('M5\nG49\nG91 G28 Z0\nG90\nM30', 'G53 H0 Z0\nM30')
    code = code.replace('G0 Z100.\nM9\nG53 H0 Z0', 'G0 Z100.\nM9\nG53 H0 Z0')
    return code

def semis(code):
    out = []
    for l in code.split('\n'):
        l = l.rstrip()
        out.append(l if l == '%' or l.endswith(';') else l + ' ;')
    return '\n'.join(out)

raio_main = M[16].replace('O0033 (RAIO R49.77', 'O0032 (RAIO R49.77')

CONE_MAIN = open('/home/claude/build/src/PRINCIPAL_O0031.txt').read().strip()
CONE_SUB = open('/home/claude/build/src/SUB_O1630.txt').read().strip()

RF_MAIN = open('/mnt/user-data/uploads/756b59f9-PRINCIPAL_O0039.txt').read().strip()
RC_MAIN = open('/mnt/user-data/uploads/a1b36185-PRINCIPAL_O0040.txt').read().strip()
RF_SUB = open('/mnt/user-data/uploads/279a1435-SUB_O1627.txt').read().strip()
RC_SUB = open('/mnt/user-data/uploads/15431327-SUB_O1635.txt').read().strip()

CF_MAIN = open('/mnt/user-data/uploads/c8a1516a-PRINCIPAL_O0029.txt').read().strip()
CR_MAIN = open('/home/claude/build/src/PRINCIPAL_O0041.txt').read().strip()
CR_SUB = open('/home/claude/build/src/SUB_O1637.txt').read().strip()
CP_MAIN = open('/home/claude/build/src/PRINCIPAL_O0042.txt').read().strip()
CP_SUB = open('/home/claude/build/src/SUB_O1638.txt').read().strip()
CF_SUB = open('/mnt/user-data/uploads/ecf93b56-SUB_O1628.txt').read().strip()

SUBS = {
    '1628': {'num': 1628, 'code': CF_SUB},
    '1627': {'num': 1627, 'code': RF_SUB},
    '1635': {'num': 1635, 'code': RC_SUB},
    '1630': {'num': 1630, 'code': CONE_SUB},
    '1637': {'num': 1637, 'code': CR_SUB},
    '1638': {'num': 1638, 'code': CP_SUB},
    '1611-canto': {'num': 1611, 'label': 'Origem no canto da área', 'code': M[2]},
    '1611-centro': {'num': 1611, 'label': 'Origem no centro da área', 'code': M[3]},
    '1612': {'num': 1612, 'code': M[5]},
    '1613': {'num': 1613, 'code': M[6]},
    '1616': {'num': 1616, 'code': M[8]},
    '1617': {'num': 1617, 'code': M[10]},
    '1618': {'num': 1618, 'code': M[13]},
    '1624': {'num': 1624, 'code': M[15]},
    '1631': {'num': 1631, 'code': M[17]},
}

helice_main = """%
O0013 (FURO FRESADO EM HELICE - O1613) ;
G21 G40 G90 G94 ;
G54 ;
T10 ;
M6 ;
G0 X0 Y0 ;
S1200 M3 ;
G43 H10 Z120. ;
M8 ;
G65 P1613 X0 Y0 D35. T20. W0 Z-25.4 K2. R5. F800. ;
G0 Z100. ;
M9 ;
G53 H0 Z0 ;
M30 ;
%"""

PROGRAMS = [
  # ---------------- MACROS ----------------
  {'id': 'm-face', 'cat': 'macro', 'num': 1, 'title': 'Faceamento', 'status': 'aprovado',
   'desc': 'Faceia uma área retangular em linhas, descendo K a cada passe.',
   'main': M[1], 'subs': ['1611-canto', '1611-centro'], 'subChoice': True,
   'notes': ['Existem dois subs O1611 (origem no canto ou no centro). Use só um na máquina.',
             'Q (passo lateral) não pode ser maior que T.']},
  {'id': 'm-pcd', 'cat': 'macro', 'num': 12, 'title': 'Furos em círculo (PCD)', 'status': 'aprovado',
   'desc': 'B furos num círculo. H0 fura (G81, ou G83 com Q), H1 fresa cada furo em hélice (chama o O1613).',
   'main': M[4], 'subs': ['1612', '1613'],
   'presets': [
     {'label': 'H0 - furar 12 furos PCD 375', 'call': 'G65 P1612 X0 Y0 J375. B12 A15. H0 W0 Z-30. R5. Q8. F150.'},
     {'label': 'H1 - fresar 5 furos D20 com fresa D10', 'call': 'G65 P1612 X0 Y0 J100. B5 A90. H1 D20. T10. W0 Z-8. K2. R5. F500.'}],
   'notes': ['H2 (rosca pelo O1619) NÃO está aprovada: use o programa paramétrico da rosca.',
             'Para H1 é preciso ter o O1613 na máquina também.']},
  {'id': 'm-helice', 'cat': 'macro', 'num': 13, 'title': 'Furo fresado em hélice', 'status': 'aprovado',
   'desc': 'Desce em hélice (G3) num furo pronto e dá uma volta plana no fundo. Raio da trajetória = (D - T) / 2.',
   'main': helice_main, 'subs': ['1613'],
   'notes': ['Aprovado chamado pelo H1 do O1612. O programa principal O0013 foi montado pelo app no padrão: confira T, H e S.',
             'Serve para furo pronto ou D menor que 2 vezes T; senão sobra um núcleo no centro.']},
  {'id': 'm-ret', 'cat': 'macro', 'num': 16, 'title': 'Contorno externo retangular', 'status': 'aprovado',
   'desc': 'Contorno externo em espiral (G2), descendo um pouco em cada lado; última volta plana no Z final.',
   'main': M[7], 'subs': ['1616'],
   'notes': ['C0 deixa canto vivo; a trajetória ainda faz arco T/2 no canto (normal).']},
  {'id': 'm-poli', 'cat': 'macro', 'num': 17, 'title': 'Contorno externo de polígono', 'status': 'aprovado',
   'desc': 'Quadrado, sextavado, oitavado... em espiral. D = diâmetro entre cantos = entre faces / COS[180 / B].',
   'main': M[9], 'subs': ['1617'],
   'presets': [
     {'label': 'Sextavado 36 entre faces (cantos no X)', 'call': 'G65 P1617 X0 Y0 B6 D41.57 A0 E20. T25. W0 Z-17. K2. R5. F800.'},
     {'label': 'Sextavado com cantos no Y (A30)', 'call': 'G65 P1617 X0 Y0 B6 D41.57 A30. E20. T25. W0 Z-17. K2. R5. F800.'},
     {'label': 'Quadrado lado 100 (D = L x 1,4142, A45)', 'call': 'G65 P1617 X0 Y0 B4 D141.42 A45. E20. T25. W0 Z-17. K2. R5. F800.'}],
   'notes': ['Sextavado de 36 entre faces: D41.57. Quadrado de lado L: D = L x 1,4142 com A45.']},
  {'id': 'm-raio-concavo', 'cat': 'macro', 'num': 23, 'title': 'Raio côncavo na aresta', 'status': 'aprovado',
   'desc': 'Abre um raio côncavo (cava) na aresta, indo e voltando em X a cada passo de H graus. U1 = côncavo.',
   'main': M[11], 'subs': ['1618'],
   'notes': ['No côncavo, T não pode ser menor que C.']},
  {'id': 'm-raio-convexo', 'cat': 'macro', 'num': 18, 'title': 'Raio convexo na aresta', 'status': 'nao-testado',
   'desc': 'Arredonda a aresta (U0) com o mesmo sub O1618.',
   'main': M[12], 'subs': ['1618'],
   'notes': ['O sub O1618 foi aprovado no côncavo; o convexo ainda não foi testado na máquina.']},
  {'id': 'm-canal', 'cat': 'macro', 'num': 25, 'title': 'Canal de chaveta em rampa', 'status': 'aprovado',
   'desc': 'Canal com pontas em meio círculo, zero no centro. Desce em rampa de ponta a ponta e contorna o canal; passada plana no fundo.',
   'main': M[14], 'subs': ['1624'],
   'notes': ['Programa principal aprovado com G55, T16, H16 e S2500.', 'Se B não for informado, usa T (canal da largura da fresa).']},
  {'id': 'm-raio-diam', 'cat': 'macro', 'num': 31, 'title': 'Raio entre dois diâmetros', 'status': 'aprovado',
   'desc': 'Arco de raio C do diâmetro D (no Z de W) até o diâmetro A. Final pelo ângulo B ou pela altura I. Uma volta G2 em cada posição.',
   'main': raio_main, 'subs': ['1631'],
   'notes': ['Renumerado de O0033 para O0032 no app, porque O0033 já é a rosca e O0031 é o cone externo.', 'Desbaste já precisa estar feito.']},
  {'id': 'm-cone', 'cat': 'macro', 'num': 31, 'title': 'Cone externo (fresa de topo reto)', 'status': 'nao-testado',
   'desc': 'Cone na peça de fora (menor no topo, maior D na base) em várias passadas com fresa 90° (fresa de topo reto): a quina de baixo da fresa desce Q em cada volta G2 sobre a linha do cone. O cone é definido pelo ângulo B (1 a 89) ou pelo diâmetro do topo A.',
   'main': CONE_MAIN, 'subs': ['1630'],
   'presets': [
     {'label': 'Pelo ângulo - B60', 'call': 'G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.3 T25. R5. F800.'},
     {'label': 'Pelo diâmetro do topo - A44', 'call': 'G65 P1630 X0 Y0 D60. A44. W0 Z-8. Q0.5 T28. R5. F800.'}],
   'notes': ['Fresa 90° = fresa de topo reto. O corretor de comprimento fica na ponta da fresa.',
             'A quina de baixo da fresa segue a linha do cone e faz qualquer ângulo B de 1 a 89. Use B (ângulo em relação à face de cima) ou A (diâmetro do topo).',
             'Q é obrigatório: quanto a fresa desce em cada volta. Q pequeno = melhor acabamento.']},
  {'id': 'm-cone-redonda', 'cat': 'macro', 'num': 41, 'title': 'Cone externo com pastilha redonda', 'status': 'nao-testado',
   'desc': 'Cone na peça de fora com fresa de pastilha redonda, em várias passadas: o centro da pastilha anda paralelo à linha do cone, uma volta G2 em cada posição, descendo Q. O cone é definido pelo ângulo B (1 a 89) ou pelo diâmetro do topo A.',
   'main': CR_MAIN, 'subs': ['1637'],
   'presets': [
     {'label': 'Pastilha 12 (E6) - B60', 'call': 'G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500.'},
     {'label': 'Pelo diâmetro do topo - A30', 'call': 'G65 P1637 X0 Y0 D60. A30. W0 Z-20. Q0.3 E6. T50. R5. F1500.'}],
   'notes': ['E = raio da pastilha (pastilha de 12 = E6). T = diâmetro maior da fresa, medido na ponta externa da pastilha.',
             'O corretor de comprimento fica no ponto mais baixo da pastilha.',
             'A pastilha redonda não faz canto vivo: na base do cone fica um raio igual a E.',
             'Sem pastilha redonda, use o O1630 (cone com fresa 90°, de topo reto).']},
  {'id': 'm-cone-paletas', 'cat': 'macro', 'num': 42, 'title': 'Cone só nas paletas (pastilha redonda)', 'status': 'nao-testado',
   'desc': 'Cone externo usinado só no topo das paletas (indutor), com fresa de pastilha redonda. Em cada nível de Z a macro calcula onde as duas arestas da paleta cruzam o raio do cone e faz um arco só nessa largura, vai e volta G3 / G2. Repete para as K paletas, a 360 / K uma da outra.',
   'main': CP_MAIN, 'subs': ['1638'],
   'presets': [
     {'label': 'Exemplo O0042 - 8 paletas', 'call': 'G65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. R100. F3000.'},
     {'label': 'Sem descer abaixo da base - H1', 'call': 'G65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. H1. R100. F3000.'}],
   'notes': ['A paleta é definida no programa principal, antes do G65: #130 a #135 = aresta 1 e #136 a #141 = aresta 2 (ponta externa X Y, ponta interna X Y, raio e lado do centro). #142 = 1 normal ou -1 espelhado.',
             'J = ângulo do centro da paleta 1 na ponta externa. K = número de paletas. U = folga do arco para cada lado da paleta (sem U usa 3).',
             'A primeira volta começa sozinha no Z onde o cone encosta na ponta interna da paleta, mesmo com W no topo da peça.',
             'Sem H1, o último nível põe o ponto de contato no Z da base e a parte de baixo da pastilha passa um pouco abaixo dela (no exemplo, cerca de 2 mm). Com H1 o ponto mais baixo da pastilha para no Z da base.',
             'E = raio da pastilha (pastilha de 12 = E6). O corretor fica no ponto mais baixo da pastilha.',
             'Na simulação o bruto é um cilindro inteiro; na peça real só existem as paletas.']},
  {'id': 'm-raio-furo', 'cat': 'macro', 'num': 39, 'title': 'Raio na quina do furo', 'status': 'nao-testado',
   'desc': 'Arredonda a boca de um furo já usinado (raio convexo C). A quina de baixo da fresa de topo reta segue o raio, de cima para baixo, uma volta G3 a cada H graus.',
   'main': RF_MAIN, 'subs': ['1627'],
   'presets': [
     {'label': 'Furo D100 - raio 5', 'call': 'G65 P1627 X0 Y0 D100. W0 C5. H1. T28. R5. F800. Q300.'},
     {'label': 'Furo D35 - raio 5 (exemplo do sub)', 'call': 'G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300.'}],
   'notes': ['Fresa de topo reta ou de facear com canto vivo. O furo já precisa estar usinado.',
             'D tem que ser maior que T. Q é o avanço da descida entre voltas (sem Q usa o F).']},
  {'id': 'm-raio-cil', 'cat': 'macro', 'num': 40, 'title': 'Raio na quina do diâmetro externo', 'status': 'nao-testado',
   'desc': 'Arredonda a quina de cima de um cilindro já usinado no diâmetro D (raio convexo C). A fresa fica por fora e a quina de baixo segue o raio, uma volta G2 a cada H graus.',
   'main': RC_MAIN, 'subs': ['1635'],
   'presets': [
     {'label': 'Cilindro D200 - raio 5', 'call': 'G65 P1635 X0 Y0 D200. W0 C5. H1. T28. R5. F800. Q300.'},
     {'label': 'Cilindro D80 - raio 5 (exemplo do sub)', 'call': 'G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300.'}],
   'notes': ['Fresa de topo reta ou de facear com canto vivo. O cilindro já precisa estar usinado no diâmetro D.',
             'C não pode ser maior que o raio do cilindro. Q é o avanço da descida entre voltas (sem Q usa o F).']},
  {'id': 'm-chanfro-furo', 'cat': 'macro', 'num': 29, 'title': 'Chanfro no furo (fresa de topo)', 'status': 'nao-testado',
   'desc': 'Chanfro na boca de um furo já usinado com fresa de topo reta: a quina de baixo da fresa segue a linha do chanfro, descendo Q em cada volta G3 completa.',
   'main': CF_MAIN, 'subs': ['1628'],
   'presets': [
     {'label': 'Furo D35 - chanfro 2 x 45° (Q0.5)', 'call': 'G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800.'},
     {'label': 'Chanfro 3 a 30° (Q0.3)', 'call': 'G65 P1628 X0 Y0 D35. W0 C3. B30 Q0.3 T28. R5. F800.'}],
   'notes': ['Fresa de topo reta: o corretor de comprimento fica na ponta da fresa. O furo já precisa estar usinado.',
             'C = largura do chanfro no topo, medida no raio a partir da parede. B = ângulo em relação ao topo, de 1 a 89 (sem B usa 45).',
             'Q pequeno = acabamento melhor: entre as voltas sobra um degrau de até Q de altura.',
             'D tem que ser maior que T, e C não pode ser maior que T.']},
  # ---------------- PARAMETRIZADOS ----------------
  {'id': 'p-rosca', 'cat': 'param', 'num': 33, 'title': 'Rosca M16 em 12 furos no círculo', 'status': 'aprovado',
   'desc': 'Fresamento de rosca descendo da face (G2), passes radiais de #2 até o raio final #1, em todos os furos do PCD.',
   'main': M[18], 'edit': [1, 2, 4, 5, 6, 7, 8, 9, 13],
   'labels': {1: 'Raio final da trajetória (desbaste)', 2: 'Incremento radial por passe', 3: 'Z atual (começa na face)', 4: 'Passo da rosca (descida por volta)',
              5: 'Profundidade final', 6: 'Raio do PCD', 7: 'Ângulo do 1º furo', 8: 'Incremento do ângulo', 9: 'Ângulo limite (360)',
              10: 'X do furo (calculado)', 11: 'Y do furo (calculado)', 12: 'Raio atual (começa no inicial)', 13: 'Número da ferramenta'},
   'notes': ['Para ajustar a medida da rosca: altere #1 e rode de novo. Acabamento em 1 passe: #1 = raio exato, #2 = mesmo valor, #12 = 0.',
             'O sobremetal precisa ser múltiplo do incremento para o último passe parar exato.',
             'O F é do centro da fresa: na aresta o avanço é bem maior.']},
  {'id': 'p-helice', 'cat': 'param', 'num': 3, 'title': 'Hélice em furo central', 'status': 'revisado',
   'desc': 'Fresa desce em hélice (G3) dentro do furo, #6 por volta, e faz uma volta plana no fundo.',
   'main': modernize_param(P[0]), 'edit': [1, 2, 6, 7, 8],
   'notes': ['Cabeçalho e final atualizados para o padrão atual pelo app.', 'Profundidade 25,5 (desenho 25,4) para o incremento 0,5 fechar exato.']},
  {'id': 'p-3bolsas', 'cat': 'param', 'num': 2, 'title': '3 bolsões em círculo (hélice)', 'status': 'revisado',
   'desc': 'A mesma hélice repetida em vários bolsões num PCD, com G52 no centro de cada um.',
   'main': modernize_param(P[1]), 'edit': [1, 2, 6, 7, 8, 9, 10, 11, 14],
   'notes': ['Cabeçalho e final atualizados para o padrão atual pelo app.', 'Leitura do desenho (raio do PCD 21,939) não confirmada.']},
  {'id': 'p-quadrado', 'cat': 'param', 'num': 6, 'title': 'Quadrado externo em espiral', 'status': 'revisado',
   'desc': 'Contorno externo de quadrado descendo 1/4 do incremento em cada lado; volta plana no fundo.',
   'main': P[2], 'edit': [1, 2, 6, 8],
   'notes': ['A profundidade precisa ser múltipla do incremento.', 'Escrito antes das regras da ferramenta em variável e da aproximação Z50/X afastado.']},
  {'id': 'p-sextavados', 'cat': 'param', 'num': 7, 'title': 'Dois sextavados externos em espiral', 'status': 'revisado',
   'desc': 'Sextavado menor (cantos no X) e maior (cantos no Y) no mesmo programa; IF compara o Z do fim da volta (exato).',
   'main': P[3], 'edit': [1, 2, 3, 11, 14, 15, 16],
   'notes': ['Conferir orientação na fixação e o bruto (D41,57 e D53,12).']},
  {'id': 'p-interp-chanfro', 'cat': 'param', 'num': 8, 'title': 'Interpolação D48 e chanfro 30°', 'status': 'nao-testado',
   'desc': 'Contorno externo D48 descendo em G2 e chanfro de 30° em degraus (G1 + círculo plano).',
   'main': P[4], 'edit': [1, 2, 4, 5, 6, 7, 8, 10],
   'notes': ['Rodar depois do sextavado maior. Para acabamento melhor, #7 = 0.0625.']},
  {'id': 'p-raio-r10', 'cat': 'param', 'num': 5, 'title': 'Raio R10 na aresta (do Siemens)', 'status': 'problema',
   'desc': 'Arredonda a aresta em passos de 1°, vai e volta em X.',
   'main': P[5], 'edit': [3, 4, 5, 6],
   'notes': ['Na simulação da máquina parou com alarme PS0127 (causa em aberto).', 'Para raio na aresta, prefira a macro O1618 (aprovada no côncavo).']},
  {'id': 'p-raio-fundo', 'cat': 'param', 'num': 9, 'title': 'Raio R3 no fundo do furo', 'status': 'nao-testado',
   'desc': 'Raio no fundo de um furo com fresa de canto reto: G1 até o ponto da curva e círculo G3 plano, de 3° em 3°.',
   'main': P[6], 'edit': [1, 2, 4, 6, 7, 11],
   'notes': ['Valores de diâmetro do furo, da fresa e X-335 são de exemplo: troque pelos reais.']},
  {'id': 'p-raio-mancal', 'cat': 'param', 'num': 10, 'title': 'Raio R20 no fundo do mancal (do Fagor)', 'status': 'nao-testado',
   'desc': 'Perfil em X/Z de 1° em 1° com vai e volta em Y.',
   'main': P[7], 'edit': [4, 5, 6, 7],
   'notes': ['Atenção: Y-115 e Y130 estão sem ponto decimal. Em alguns comandos isso vira 0,115 e 0,130 mm. Confira antes de rodar.',
             'S1600 e T1 são de exemplo.']},
]

EXTRA = {'p-rosca': {'toolDia': 13.85, 'stock': 'round'}, 'p-raio-r10': {'toolDia': 50}, 'p-raio-mancal': {'toolDia': 20, 'top': -100},
         'm-pcd': {'stock': 'round'}, 'p-3bolsas': {'stock': 'round'}, 'm-poli': {'stock': 'round'}, 'p-sextavados': {'stock': 'round', 'stockLayers': [{'d': 41.57, 'top': 0}, {'d': 53.12, 'top': -17}]},
         'p-interp-chanfro': {'stock': 'round', 'top': -17}, 'm-raio-diam': {'stock': 'round', 'top': -21}, 'p-raio-fundo': {'top': -42}}
for k in ['m-pcd', 'm-helice', 'p-rosca', 'p-3bolsas', 'p-helice', 'p-raio-fundo', 'p-raio-mancal', 'm-canal']:
    EXTRA.setdefault(k, {})['stockMargin'] = True
# bruto automático calculado pelas letras do G65 (L) ou pelas variáveis # (V) do programa
# CANTO = sub de faceamento com origem no canto; G = deslocamento do G52 no texto
STOCK = {
 'm-face': "({shape:'rect', lx:L.X, ly:L.Y, cx: CANTO ? L.X/2 : 0, cy: CANTO ? L.Y/2 : 0, top:L.W||0, bottom:(L.Z||0)-15, tool:L.T})",
 'm-pcd': "({shape:'round', d:L.J + Math.max(60, 4*(L.D||L.T||10)), cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:(L.H==1 ? L.T : (L.T||10))})",
 'm-helice': "({shape:'round', d:Math.max(L.D*2.5, L.D+40), cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})",
 'm-ret': "({shape:'rect', lx:L.I+L.T, ly:L.J+L.T, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})",
 'm-poli': "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})",
 'm-raio-concavo': "({shape:'rect', lx:L.I, ly:Math.max(40,4*L.C), cx:L.X+L.I/2, cy:(L.V==1 ? L.Y-Math.max(40,4*L.C)/2 : L.Y+Math.max(40,4*L.C)/2), top:L.W||0, bottom:(L.W||0)-Math.max(30,3*L.C), tool:L.T})",
 'm-raio-convexo': "({shape:'rect', lx:L.I, ly:Math.max(40,4*L.C), cx:L.X+L.I/2, cy:(L.V==1 ? L.Y-Math.max(40,4*L.C)/2 : L.Y+Math.max(40,4*L.C)/2), top:L.W||0, bottom:(L.W||0)-Math.max(30,3*L.C), tool:L.T})",
 'm-canal': "({shape:'rect', lx:L.I+40, ly:(L.B||L.T)+40, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-15, tool:L.T})",
 'm-raio-furo': "({shape:'round', d:L.D+60, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||5)-20, tool:L.T, holeD:L.D, holeZ:(L.W||0)-(L.C||5)-20})",
 'm-raio-cil': "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||5)-20, tool:L.T})",
 'm-chanfro-furo': "({shape:'round', d:L.D+60, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||2)*Math.tan((L.B||45)*Math.PI/180)-20, tool:L.T, holeD:L.D, holeZ:(L.W||0)-(L.C||2)*Math.tan((L.B||45)*Math.PI/180)-20})",
 'm-cone': "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})",
 'm-cone-redonda': "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})",
 'm-cone-paletas': "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})",
 'm-raio-diam': "({shape:'round', d:L.A, cx:L.X||0, cy:L.Y||0, top:L.W, bottom:L.W-(L.I||40)-10, tool:L.T})",
 'p-rosca': "({shape:'round', d:2*V[6]+60, cx:0, cy:0, top:0, bottom:V[5]-10, tool:13.85})",
 'p-helice': "({shape:'round', d:V[1]+40, cx:G.x, cy:G.y, top:V[5]||0, bottom:V[7]-10, tool:V[2]})",
 'p-3bolsas': "({shape:'round', d:2*V[9]+V[1]+30, cx:0, cy:0, top:V[5]||0, bottom:V[7]-10, tool:V[2]})",
 'p-quadrado': "({shape:'rect', lx:V[1]+V[2], ly:V[1]+V[2], cx:0, cy:0, top:V[5]||0, bottom:V[8]-10, tool:V[2]})",
 'p-sextavados': "({shape:'round', d:V[2]/Math.cos(Math.PI/6), cx:0, cy:0, layers:[{d:V[1]/Math.cos(Math.PI/6), top:V[10]||0},{d:V[2]/Math.cos(Math.PI/6), top:V[14]}], top:V[10]||0, bottom:V[15]-10, tool:V[3]})",
 'p-interp-chanfro': "({shape:'round', d:V[1]+V[2]*0.9, cx:0, cy:0, top:V[4], bottom:V[8]-10, tool:V[2]})",
 'p-raio-fundo': "({shape:'round', d:V[1]+60, cx:G.x, cy:G.y, top:0, bottom:V[6]-15, tool:V[2], holeD:V[1], holeZ:V[6]})",
}
EXTRA.setdefault('m-cone-redonda', {})['toolShapeExpr'] = "({type:'r', cornerR: L.E||0})"
EXTRA.setdefault('m-cone-paletas', {})['toolShapeExpr'] = "({type:'r', cornerR: L.E||0})"
for k, v in STOCK.items():
    EXTRA.setdefault(k, {})['stockExpr'] = v
for p in PROGRAMS:
    p.update(EXTRA.get(p['id'], {}))
    p['main'] = semis(p['main'])
    if p['cat'] == 'macro':
        p['subs'] = [dict(SUBS[s], key=s) for s in p['subs']]

RULES = [
 {'t': 'Cabeçalho e final', 'items': [
   'Cabeçalho: G21 G40 G90 G94 e na linha seguinte G54. Sem G17, G49 e G80.',
   'Final: G0 Z100. / M9 / G53 H0 Z0 / M30. Sem M5, G49 e G91 G28 (o M30 já para o fuso).',
   'Se usou G52, cancelar antes do final com G52 X0 Y0.',
   'T.. e M6 sempre em linhas separadas (na Romi D1250 V6 dá alarme se ficam juntos).',
   'Todo bloco termina com ; (macros e parametrizados), e o comentário vem antes do ; : #1 = 35 (DIAMETRO DO FURO) ;']},
 {'t': 'Macros (G65)', 'items': [
   'Subprogramas numerados a partir de O1611 (O16xx). Programas principais O00xx.',
   'Cabeçalho do sub na mesma linha do número: O1625 (COMENTARIO) ; e nunca ; antes do comentário.',
   'Todo comentário entre parênteses seguido de ; (sem parênteses dentro do comentário).',
   'Programa principal limpo: só o comentário do cabeçalho. A explicação das letras e um exemplo da chamada ficam só no sub, no bloco (LETRAS DO G65 Pxxxx).',
   'Principal padrão: % / O00xx (COMENTARIO) ; / G21 G40 G90 G94 ; / G54 ; / T10 ; / M6 ; / G0 X0 Y0 ; / S1200 M3 ; / G43 H10 Z120. ; / M8 ; / G65 P16xx ... ; / G0 Z100. ; / M9 ; / G53 H0 Z0 ; / M30 ; / %.',
   'Padrão das letras: X Y = centro, W = Z inicial (face), Z = Z final, K = descida por volta, T = diâmetro da ferramenta, Q = passo lateral ou incremento radial, R = plano de segurança, F = avanço.',
   'Alarme da macro: IF [condição] THEN #3000 = n (TEXTO) ; com faixa própria por macro (101-104 faceamento, 111 PCD, 121-123 hélice, 151-154 retangular, 161-163 polígono, 171-176 raio, 211-216 canal, 291-299 raio entre diâmetros).',
   'Letra vazia não é igual a 0: para Q usar IF [#17 EQ 0] THEN #17 = #9 ; e IF [#17 EQ #0] THEN #17 = #9 ;.',
   'Cálculos em #100 a #199; em macro que chama outra, usar #27 a #33 (locais) para não ser apagado.',
   'Em chamada aninhada, evitar as letras I, E, U e V (problema visto na máquina: o I caiu no #7). Em macro nova, usar K ou V para passo de rosca em vez de I.',
   'Valores com casas decimais no G65 sempre com ponto (X215.). Um ponto decimal por número.',
   'Depois de G2/G3 sempre voltar com G1 nos movimentos lineares seguintes.',
   'Não depender de Block Delete (/): trava a Romi.']},
 {'t': 'Parametrizados simples (sem G65)', 'items': [
   'Variáveis # no início, em sequência (#1, #2, #3...), só as necessárias: medida da peça em #1, diâmetro da ferramenta em #2, trajetória em #3.',
   'Número da ferramenta numa variável própria, a última da lista, usada em T#n e G43 H#n.',
   'Sem .0 nas variáveis e nas contas (#1 = 100, [#1 - #2] / 2). Coordenadas digitadas direto no bloco continuam com ponto (Z100.).',
   'Uma variável só para (diâmetro do furo - diâmetro da fresa) / 2, com colchete.',
   'Reset com número digitado (#5 = 0), sem variável extra.',
   'Um único N e um único IF ... GOTO por laço. Sem WHILE/DO, FUP, THEN, contador de voltas e G65.',
   'Incremento de Z direto numa variável. Nunca folga (+ 0.001) no IF: escolher incremento que fecha exato (0,5 / 0,25 / 0,125 / 0,0625).',
   'Em contornos de vários lados: #5 = #5 - #7 antes de cada G1, com #7 = #6 / n. Se a divisão não é exata (sextavado), comparar o Z do fim da volta e usar outra variável para o Z de cada lado.',
   'Furos em círculo: ângulo limite sempre 360 (vale quando o ângulo inicial é menor que o incremento; senão limite = inicial + 360).',
   'Desbaste com valores redondos; o valor exato só no acabamento de 1 passe.',
   'Comentários entre parênteses, curtos e sem acentos.']},
 {'t': 'Aproximação e profundidade', 'items': [
   'Z inicial na face (Z0) e descendo, nunca começando do fundo (também na rosca).',
   'Ao terminar um contorno, subir para Z50. (não Z2).',
   'Em XY, o G0 vai primeiro 20 mm além do ponto inicial, na mesma linha de entrada (ex.: G0 X[#5 + 20] Y0), desce em Z e entra com G1. Em furo ou bolsão, o ponto afastado é o centro.']},
 {'t': 'Regras técnicas', 'items': [
   'Contorno externo concordante: G2. Dentro de furo ou bolsão: G3. Rosca interna à direita descendo: G2 (discordante, preferido pelo operador).',
   'PCD: X = R * COS[ângulo], Y = R * SIN[ângulo]; G52 leva a origem ao centro do furo e não acumula.',
   'Sextavado: entre cantos = entre faces / COS[30]. d = entre faces / 2 + raio da fresa; canto R = d / SIN[60]; metade do canto R * COS[60].',
   'O FANUC dá alarme se o raio do início e do fim de um G2/G3 forem diferentes: raios e chanfros saem em degraus (G1 até o ponto + círculo completo plano).',
   'Chanfro de 30° medido na horizontal: Δraio = Δz / TAN[30].',
   'Raio com fresa de canto reto: deslocamento = SIN[ângulo] * R e Z = [COS[ângulo] - 1] * R.',
   'Em rosca e raios em volta do furo o F é do centro da fresa; na aresta o avanço é bem maior.',
   'G68 é opção do comando (cancela com G69). PS0127 = bloco com comando NC e macro misturados.']},
 {'t': 'Arquivo e envio', 'items': [
   'Texto puro (.txt ou .nc) com % na primeira e na última linha, ; no fim de cada bloco, sem linhas em branco e sem acentos.',
   'Nome com o número O (ex.: O0033.txt). O número não pode já existir na máquina.',
   'Pendrive FAT32 na porta USB do painel. Em EDIT: PROG, (OPRT), READ, número e EXEC.',
   'Primeira peça em Single Block com avanço reduzido; primeira conferência em Machine Lock ou sem material.']},
]

js = '/* Biblioteca de programas do operador (D1250) e regras do padrão.\n * Gerado a partir dos documentos "Macros FANUC - programas aprovados e regras" e\n * "Regras e programas FANUC do operador (D1250)". */\n'
js += 'window.PROGRAMS = ' + json.dumps(PROGRAMS, ensure_ascii=False, indent=1) + ';\n'
js += 'window.RULES = ' + json.dumps(RULES, ensure_ascii=False, indent=1) + ';\n'
open('/home/claude/macro-cnc/programs.js', 'w').write(js)
print('ok', len(js))
