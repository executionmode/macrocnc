# Capítulo 16 (cone O1630, com vídeo) e capítulo 17 (macros adicionais explicadas), em pt / en / fr
# Usado por build_training.py: substitui os capítulos 16 e 17 do doc1.html


def tbl(head, rows):
    return '<div class="tw"><table><tr>' + ''.join('<th>%s</th>' % h for h in head) + '</tr>' + ''.join(
        '<tr>' + ''.join('<td>%s</td>' % c for c in r) + '</tr>' for r in rows) + '</table></div>'


def code(s):
    return '<pre class="code">' + s + '</pre>'


L = {}

# ---------------------------------------------------------------- PT
L['pt'] = dict(
    t16='16. Cone externo com fresa 90° ou de topo reto (O1630)',
    h16=(
        '<p>Assista ao vídeo: ele mostra a macro passo a passo, com a fresa andando sobre a linha do cone e as contas de cada volta.</p>'
        '<h3>16.1 Resumo</h3>'
        '<p>Faz um cone na parte de fora da peça, com o diâmetro menor no topo e o maior na base. A ponta da fresa anda sobre a linha do cone, de cima para baixo, com uma volta completa G2 em cada posição. A letra <b>Q</b> diz quanto a ponta desce em cada volta.</p>'
        + code('G65 P1630 X0 Y0 D60. B30 W0 Z-8. Q0.5 E0 T28. R5. F800. ;') +
        tbl(['Letra', 'O que é'], [
            ['X Y', 'centro do cone'], ['D', 'diâmetro maior, na base (igual ao bruto)'],
            ['B', 'ângulo do cone em relação à face de cima'], ['A', 'diâmetro menor no topo (no lugar do B)'],
            ['W / Z', 'Z do topo / Z da base'], ['Q', 'quanto a ponta desce em cada volta'],
            ['E', 'diâmetro da ponta plana da fresa: 0 = fresa 90° com ponta viva; E = T = fresa de topo reta'],
            ['T', 'diâmetro maior da fresa'], ['R / F', 'plano de segurança / avanço']]) +
        '<ul><li><b>Fresa 90° cônica</b> (E0): B de 1 a 45.</li><li><b>Fresa de topo reta</b> (E igual a T): a quina de baixo segue a linha e faz qualquer B de 1 a 89.</li>'
        '<li>O corretor de comprimento fica na ponta da fresa (o ponto mais baixo).</li><li>Q pequeno = melhor acabamento: entre as voltas sobra um degrau de até Q de altura.</li>'
        '<li>Com fresa de pastilha redonda, use a O1637 (capítulo 17).</li></ul>'),
    t17='17. Macros adicionais: chaveta, raios, chanfro no furo e cone com pastilha redonda',
    intro17=(
        '<p>Estas macros seguem a mesma estrutura das anteriores: o programa principal chama o subprograma com G65, cada letra vira uma variável local e os erros param com alarme #3000. '
        'As de raio, chanfro e cone fazem <b>uma volta completa em cada posição</b>: a cada volta a macro calcula o raio da trajetória do centro da fresa e o Z, e anda um pouco sobre o perfil. '
        'Passo pequeno (H em graus nos raios, Q nos chanfros e cones) = acabamento mais liso e programa mais longo. Todas estão na biblioteca do app para simular.</p>'),
    secs=[
        dict(h='17.1 Canal de chaveta em rampa (O1624)',
             idea='Abre um canal reto com as duas pontas em meio círculo, com fresa de topo reta. Em vez de mergulhar, a fresa <b>desce em rampa</b> de uma ponta até a outra, perdendo K de altura. Nesse Z ela contorna o canal todo (sentido anti-horário G3). Na camada seguinte a rampa volta no sentido contrário. No fim faz uma passada plana no fundo para limpar a última rampa.',
             call='G65 P1624 X0 Y0 I200. T28. B32. W0 Z-1. K0.5 R50. F2000. ;',
             letters=[['X Y', 'centro do canal'], ['I', 'comprimento total, de ponta a ponta'], ['T', 'diâmetro da fresa'], ['B', 'largura do canal (sem B usa T)'],
                      ['W / Z', 'topo / fundo do canal'], ['K', 'descida em cada rampa'], ['R / F', 'plano de segurança / avanço']],
             math=['X do centro da fresa na ponta = I/2 − B/2 (com sinal + ou −, que alterna a cada camada).', 'Afastamento em Y para o contorno = (B − T)/2. Se B = T, só faz a rampa.'],
             check=['B entre T e 3×T (alarmes 215 e 216). I maior que B (212).', 'Rampa longa e K pequeno: a rampa fica suave e a fresa não mergulha.', 'Alarmes 211 a 216.']),
        dict(h='17.2 Raio na quina do furo (O1627)',
             idea='Arredonda a boca de um furo já usinado (quina de cima, raio convexo). A quina de baixo da fresa segue o raio C, de cima para baixo. A cada volta (G3, dentro do furo) o ângulo θ avança H graus.',
             call='G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'centro do furo'], ['D', 'diâmetro do furo'], ['W', 'topo da peça'], ['C', 'raio da quina'], ['H', 'passo em graus de cada volta'],
                      ['T', 'diâmetro da fresa (canto vivo)'], ['R / F', 'plano de segurança / avanço da volta'], ['Q', 'avanço da descida entre voltas (sem Q usa F)']],
             math=['Raio do centro da fresa = D/2 + C − C·SIN θ − T/2', 'Z = W − C + C·COS θ', 'θ vai de H até perto de 90°.'],
             check=['D maior que T (alarme 256).', 'Fresa com canto vivo: raio de canto na fresa muda o raio da peça.', 'Alarmes 251 a 256.']),
        dict(h='17.3 Raio na quina do diâmetro externo (O1635)',
             idea='Arredonda a quina de cima de um cilindro já usinado no diâmetro D (raio convexo por fora). A fresa fica do lado de fora e desce sobre o raio, uma volta G2 por posição. A última volta fica em θ = 90°, já na parede do cilindro.',
             call='G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'centro do cilindro'], ['D', 'diâmetro do cilindro'], ['W', 'topo do cilindro'], ['C', 'raio da quina'], ['H', 'passo em graus de cada volta'],
                      ['T', 'diâmetro da fresa (canto vivo)'], ['R / F', 'plano de segurança / avanço da volta'], ['Q', 'avanço da descida entre voltas (sem Q usa F)']],
             math=['Raio do centro da fresa = D/2 − C + C·SIN θ + T/2', 'Z = W − C + C·COS θ', 'Última volta: raio D/2 + T/2 e Z = W − C.'],
             check=['C não pode passar do raio do cilindro (alarme 266).', 'A primeira volta entra por fora do cilindro.', 'Alarmes 261 a 266.']),
        dict(h='17.4 Chanfro no furo com fresa de topo reta (O1628)',
             idea='Faz o chanfro na boca de um furo usando uma fresa de topo reta comum. A quina de baixo da fresa segue a linha do chanfro, de cima para baixo, com uma volta G3 em cada posição. O ângulo é livre (letra B, de 1 a 89).',
             call='G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800. ;',
             letters=[['X Y', 'centro do furo'], ['D', 'diâmetro do furo'], ['W', 'topo da peça'], ['C', 'largura do chanfro no topo, medida no raio'], ['B', 'ângulo em relação ao topo (sem B usa 45)'],
                      ['Q', 'quanto a fresa desce em cada volta'], ['T', 'diâmetro da fresa'], ['R / F', 'plano de segurança / avanço']],
             math=['Altura do chanfro na parede = C × TAN B', 'Passo no raio a cada volta = Q / TAN B', 'Raio do centro da fresa = D/2 + d − T/2, onde d vai de C até 0 (distância da quina até a parede).'],
             check=['O corretor fica na ponta da fresa.', 'D maior que T (266) e C não maior que T (267).', 'Entre as voltas sobra um degrau de até Q de altura.', 'Alarmes 261 a 269.']),
        dict(h='17.5 Raio entre dois diâmetros (O1631)',
             idea='Faz um raio C que começa no diâmetro D (no Z de W) e termina no diâmetro A, maior. O fim do arco é definido pelo ângulo <b>B</b> da tangente final ou pela altura <b>I</b> do arco. A quina de baixo da fresa segue o arco de cima para baixo, uma volta G2 por posição. O desbaste já precisa estar feito.',
             call='G65 P1631 X0 Y0 C49.77 D299.5 A374. I46.7 H1. T28. W-21. R50. F1500. ;',
             letters=[['X Y', 'centro'], ['C', 'raio do arco'], ['D', 'diâmetro onde o arco começa'], ['A', 'diâmetro onde o arco termina'], ['B', 'ângulo da tangente final em relação à face (não usa se tiver I)'],
                      ['I', 'altura do arco em Z (opcional)'], ['H', 'passo em graus de cada volta'], ['T', 'diâmetro da fresa (canto vivo)'], ['W', 'Z onde o arco começa'],
                      ['R / F / Q', 'segurança / avanço da volta / avanço da descida']],
             math=['A macro acha o ângulo inicial e o final do arco (pela tangente B ou pela corda até a altura I).', 'Raio do centro da fresa = D/2 + C·(COS α0 − COS α) + T/2', 'Z = W − C·(SIN α − SIN α0)'],
             check=['A maior que D (293).', 'Raio C pequeno demais para a abertura: alarme 297.', 'Alarmes 291 a 299.']),
        dict(h='17.6 Cone externo com pastilha redonda (O1637)',
             idea='O mesmo cone do capítulo 16, mas com fresa de pastilha redonda. O <b>centro da pastilha</b> anda numa linha paralela ao cone, afastada de E, com uma volta G2 em cada posição. Na base fica um raio igual a E, porque a pastilha redonda não faz canto vivo.',
             call='G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500. ;',
             letters=[['X Y', 'centro do cone'], ['D', 'diâmetro da base (bruto)'], ['B ou A', 'ângulo do cone ou diâmetro do topo'], ['W / Z', 'topo / base'], ['Q', 'quanto o ponto de contato desce em cada volta'],
                      ['E', 'raio da pastilha (pastilha de 12 = 6)'], ['T', 'diâmetro maior da fresa, na ponta externa da pastilha'], ['R / F', 'plano de segurança / avanço']],
             math=['Raio do centro da fresa = raio do cone no ponto de contato + E·SIN B + (T/2 − E)', 'Z da fresa = Z do contato − E·(1 − COS B)', 'O ponto mais baixo da pastilha nunca passa do Z da base.'],
             check=['O corretor fica no ponto mais baixo da pastilha.', 'Sem pastilha redonda, use a O1630 (alarme 295).', 'O bruto tem que estar perto do cone: a fresa limpa uma faixa do tamanho de T em cada volta.', 'Alarmes 291 a 299.']),
    ],
    lab=dict(idea='A ideia', call='Chamada e letras', math='As contas', check='Como conferir', letter='Letra', what='O que é'),
    other=(
        '<h3>17.7 Outras macros da mesma família</h3><p>Estas não estão na biblioteca do app; seguem as mesmas ideias acima.</p>' +
        tbl(['Macro', 'O que faz', 'Exemplo de chamada'], [
            ['O1625 chaveta sem rampa', 'Canal com pontas arredondadas, desce reto no início de cada camada', '<code>G65 P1625 X0 Y0 I60. V0 T20. B40. U14. W0 Z-5. K0.5 R5. F600. Q200.</code>'],
            ['O1626 raio no fundo do furo', 'Raio côncavo entre a parede e o fundo de um furo', '<code>G65 P1626 X0 Y0 D35. W0 Z-20. C3. H1. T28. R5. F800. Q300.</code>'],
            ['O1629 canal com pontas em arco', 'Canal reto com as duas pontas em arco, sem rampa', '<code>G65 P1629 X0 Y0 B9. C39.5 T6. W0 Z-5. K1. U4. R5. F600. Q200.</code>'],
            ['O1632 raio com pastilha redonda', 'O raio da O1631 com fresa de pastilha redonda (E = raio da pastilha)', '<code>G65 P1632 X0 Y0 C49.77 D299.5 A374. I46.7 E6. H1. T50. W-21. R50. F1500.</code>'],
            ['O1633 rosca em círculo (D direto)', 'Rosca interna fresada, raio final informado em D', '<code>G65 P1633 X0 Y0 J375. B12 A15. K2. D1. Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1634 rosca em círculo (D e T)', 'Rosca interna fresada, raio calculado por D e pela fresa T', '<code>G65 P1634 X0 Y0 J375. B12 A15. K2. D16. T13.85 Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1636 raio na base do cilindro', 'Raio côncavo entre o cilindro e a face de baixo', '<code>G65 P1636 X0 Y0 D80. W0 Z-20. C5. H1. T28. R5. F800. Q300.</code>']])),
    res16=['A ponta anda sobre a linha do cone, uma volta por posição.', 'Fresa 90°: B até 45. Fresa reta (E = T): B de 1 a 89.', 'Q pequeno = acabamento melhor.'],
    res17=['Uma volta completa em cada posição do perfil.', 'Raios: passo H em graus. Chanfro e cone: passo Q em Z.', 'Fresa de canto vivo; pastilha redonda só na O1637.'],
    ex8=('<p><b>Exercício 8: cone</b></p><p>No <code>G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.5 E0 T28. R5. F800.</code>, qual o diâmetro do cone no topo? E quantas voltas, mais ou menos, a macro faz?</p>'),
    ans8=('<p>Abertura = 1 / TAN 60 = 0.577 de raio por milímetro de descida.</p><p>Diâmetro do topo = 60 − 2 × 20 × 0.577 = <b>36.906</b>.</p><p>Voltas ≈ altura / Q = 20 / 0.5 = <b>40 voltas</b>.</p>'),
    grp_vid='Macros com vídeo', grp_novid='Macros sem vídeo',
)

# ---------------------------------------------------------------- EN
L['en'] = dict(
    t16='16. Outside cone with a 90° cutter or flat end mill (O1630)',
    h16=(
        '<p>Watch the video: it shows the macro step by step, with the cutter running along the cone line and the math for each turn.</p>'
        '<h3>16.1 Summary</h3>'
        '<p>Makes a cone on the outside of the part, with the small diameter at the top and the large one at the base. The cutter tip runs along the cone line, top to bottom, with one full G2 turn at each position. Letter <b>Q</b> sets how much the tip goes down each turn.</p>'
        + code('G65 P1630 X0 Y0 D60. B30 W0 Z-8. Q0.5 E0 T28. R5. F800. ;') +
        tbl(['Letter', 'What it is'], [
            ['X Y', 'cone center'], ['D', 'large diameter at the base (same as the stock)'],
            ['B', 'cone angle to the top face'], ['A', 'small diameter at the top (instead of B)'],
            ['W / Z', 'top Z / base Z'], ['Q', 'how much the tip goes down each turn'],
            ['E', 'flat tip diameter of the cutter: 0 = 90° cutter with sharp tip; E = T = flat end mill'],
            ['T', 'large cutter diameter'], ['R / F', 'safety plane / feed']]) +
        '<ul><li><b>90° conical cutter</b> (E0): B from 1 to 45.</li><li><b>Flat end mill</b> (E equal to T): the bottom corner follows the line and makes any B from 1 to 89.</li>'
        '<li>The length offset is at the cutter tip (the lowest point).</li><li>Small Q = better finish: a step up to Q high is left between turns.</li>'
        '<li>With a round insert cutter, use O1637 (chapter 17).</li></ul>'),
    t17='17. More macros: keyway, radii, hole chamfer and cone with round insert',
    intro17=(
        '<p>These macros follow the same structure as the earlier ones: the main program calls the subprogram with G65, each letter becomes a local variable and errors stop with alarm #3000. '
        'The radius, chamfer and cone macros make <b>one full turn at each position</b>: each turn, the macro computes the radius of the cutter center path and the Z, then moves a little along the profile. '
        'Small step (H in degrees for radii, Q for chamfers and cones) = smoother finish and longer program. All of them are in the app library to simulate.</p>'),
    secs=[
        dict(h='17.1 Ramped keyway slot (O1624)',
             idea='Cuts a straight slot with both ends in a half circle, using a flat end mill. Instead of plunging, the cutter <b>ramps down</b> from one end to the other, losing K in height. At that Z it contours the whole slot (counterclockwise G3). On the next layer the ramp goes back the other way. At the end it makes a flat pass on the bottom to clean the last ramp.',
             call='G65 P1624 X0 Y0 I200. T28. B32. W0 Z-1. K0.5 R50. F2000. ;',
             letters=[['X Y', 'slot center'], ['I', 'total length, end to end'], ['T', 'cutter diameter'], ['B', 'slot width (without B uses T)'],
                      ['W / Z', 'top / slot bottom'], ['K', 'step down on each ramp'], ['R / F', 'safety plane / feed']],
             math=['X of the cutter center at the end = I/2 − B/2 (with + or − sign, alternating every layer).', 'Y offset for the contour = (B − T)/2. If B = T, it only ramps.'],
             check=['B between T and 3×T (alarms 215 and 216). I larger than B (212).', 'Long ramp and small K: the ramp is gentle and the cutter does not plunge.', 'Alarms 211 to 216.']),
        dict(h='17.2 Radius on the hole edge (O1627)',
             idea='Rounds the mouth of an already machined hole (top edge, convex radius). The bottom corner of the cutter follows radius C, top to bottom. Each turn (G3, inside the hole) angle θ moves H degrees.',
             call='G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'hole center'], ['D', 'hole diameter'], ['W', 'part top'], ['C', 'edge radius'], ['H', 'step in degrees per turn'],
                      ['T', 'cutter diameter (sharp corner)'], ['R / F', 'safety plane / turn feed'], ['Q', 'step-down feed between turns (without Q uses F)']],
             math=['Cutter center radius = D/2 + C − C·SIN θ − T/2', 'Z = W − C + C·COS θ', 'θ goes from H to near 90°.'],
             check=['D larger than T (alarm 256).', 'Sharp-corner cutter: a corner radius on the cutter changes the part radius.', 'Alarms 251 to 256.']),
        dict(h='17.3 Radius on the outer diameter edge (O1635)',
             idea='Rounds the top edge of a cylinder already machined to diameter D (convex radius outside). The cutter stays outside and goes down over the radius, one G2 turn per position. The last turn is at θ = 90°, already on the cylinder wall.',
             call='G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'cylinder center'], ['D', 'cylinder diameter'], ['W', 'cylinder top'], ['C', 'edge radius'], ['H', 'step in degrees per turn'],
                      ['T', 'cutter diameter (sharp corner)'], ['R / F', 'safety plane / turn feed'], ['Q', 'step-down feed between turns (without Q uses F)']],
             math=['Cutter center radius = D/2 − C + C·SIN θ + T/2', 'Z = W − C + C·COS θ', 'Last turn: radius D/2 + T/2 and Z = W − C.'],
             check=['C cannot exceed the cylinder radius (alarm 266).', 'The first turn comes in from outside the cylinder.', 'Alarms 261 to 266.']),
        dict(h='17.4 Hole chamfer with a flat end mill (O1628)',
             idea='Chamfers the mouth of a hole with a regular flat end mill. The bottom corner of the cutter follows the chamfer line, top to bottom, with one G3 turn at each position. The angle is free (letter B, 1 to 89).',
             call='G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800. ;',
             letters=[['X Y', 'hole center'], ['D', 'hole diameter'], ['W', 'part top'], ['C', 'chamfer width at the top, measured on the radius'], ['B', 'angle to the top (without B uses 45)'],
                      ['Q', 'how much the cutter goes down each turn'], ['T', 'cutter diameter'], ['R / F', 'safety plane / feed']],
             math=['Chamfer height on the wall = C × TAN B', 'Radial step each turn = Q / TAN B', 'Cutter center radius = D/2 + d − T/2, where d goes from C to 0 (distance from the corner to the wall).'],
             check=['The offset is at the cutter tip.', 'D larger than T (266) and C not larger than T (267).', 'A step up to Q high is left between turns.', 'Alarms 261 to 269.']),
        dict(h='17.5 Radius between two diameters (O1631)',
             idea='Makes a radius C that starts at diameter D (at Z W) and ends at the larger diameter A. The arc end is set by angle <b>B</b> of the final tangent or by arc height <b>I</b>. The bottom corner of the cutter follows the arc top to bottom, one G2 turn per position. Roughing must already be done.',
             call='G65 P1631 X0 Y0 C49.77 D299.5 A374. I46.7 H1. T28. W-21. R50. F1500. ;',
             letters=[['X Y', 'center'], ['C', 'arc radius'], ['D', 'diameter where the arc starts'], ['A', 'diameter where the arc ends'], ['B', 'final tangent angle to the face (not used with I)'],
                      ['I', 'arc height in Z (optional)'], ['H', 'step in degrees per turn'], ['T', 'cutter diameter (sharp corner)'], ['W', 'Z where the arc starts'],
                      ['R / F / Q', 'safety / turn feed / step-down feed']],
             math=['The macro finds the start and end angles of the arc (from tangent B or from the chord down to height I).', 'Cutter center radius = D/2 + C·(COS α0 − COS α) + T/2', 'Z = W − C·(SIN α − SIN α0)'],
             check=['A larger than D (293).', 'Radius C too small for the opening: alarm 297.', 'Alarms 291 to 299.']),
        dict(h='17.6 Outside cone with round insert (O1637)',
             idea='The same cone as chapter 16, but with a round insert cutter. The <b>insert center</b> runs on a line parallel to the cone, offset by E, with one G2 turn at each position. A radius equal to E is left at the base, because the round insert does not make a sharp corner.',
             call='G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500. ;',
             letters=[['X Y', 'cone center'], ['D', 'base diameter (stock)'], ['B or A', 'cone angle or top diameter'], ['W / Z', 'top / base'], ['Q', 'how much the contact point goes down each turn'],
                      ['E', 'insert radius (12 mm insert = 6)'], ['T', 'large cutter diameter, at the outer edge of the insert'], ['R / F', 'safety plane / feed']],
             math=['Cutter center radius = cone radius at the contact point + E·SIN B + (T/2 − E)', 'Cutter Z = contact Z − E·(1 − COS B)', 'The lowest point of the insert never goes below the base Z.'],
             check=['The offset is at the lowest point of the insert.', 'Without a round insert, use O1630 (alarm 295).', 'The stock must be close to the cone: the cutter clears a band about T wide each turn.', 'Alarms 291 to 299.']),
    ],
    lab=dict(idea='The idea', call='Call and letters', math='The math', check='How to check', letter='Letter', what='What it is'),
    other=(
        '<h3>17.7 Other macros in the same family</h3><p>These are not in the app library; they follow the same ideas as above.</p>' +
        tbl(['Macro', 'What it does', 'Call example'], [
            ['O1625 keyway without ramp', 'Slot with rounded ends, goes straight down at the start of each layer', '<code>G65 P1625 X0 Y0 I60. V0 T20. B40. U14. W0 Z-5. K0.5 R5. F600. Q200.</code>'],
            ['O1626 radius at the hole bottom', 'Concave radius between the wall and the bottom of a hole', '<code>G65 P1626 X0 Y0 D35. W0 Z-20. C3. H1. T28. R5. F800. Q300.</code>'],
            ['O1629 slot with arc ends', 'Straight slot with both ends in an arc, no ramp', '<code>G65 P1629 X0 Y0 B9. C39.5 T6. W0 Z-5. K1. U4. R5. F600. Q200.</code>'],
            ['O1632 radius with round insert', 'The O1631 radius with a round insert cutter (E = insert radius)', '<code>G65 P1632 X0 Y0 C49.77 D299.5 A374. I46.7 E6. H1. T50. W-21. R50. F1500.</code>'],
            ['O1633 thread on a circle (direct D)', 'Thread milling inside, final radius given in D', '<code>G65 P1633 X0 Y0 J375. B12 A15. K2. D1. Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1634 thread on a circle (D and T)', 'Thread milling inside, radius computed from D and cutter T', '<code>G65 P1634 X0 Y0 J375. B12 A15. K2. D16. T13.85 Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1636 radius at the cylinder base', 'Concave radius between the cylinder and the bottom face', '<code>G65 P1636 X0 Y0 D80. W0 Z-20. C5. H1. T28. R5. F800. Q300.</code>']])),
    res16=['The tip runs along the cone line, one turn per position.', '90° cutter: B up to 45. Flat end mill (E = T): B from 1 to 89.', 'Small Q = better finish.'],
    res17=['One full turn at each position of the profile.', 'Radii: step H in degrees. Chamfer and cone: step Q in Z.', 'Sharp-corner cutter; round insert only on O1637.'],
    ex8=('<p><b>Exercise 8: cone</b></p><p>In <code>G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.5 E0 T28. R5. F800.</code>, what is the cone diameter at the top? And roughly how many turns does the macro make?</p>'),
    ans8=('<p>Opening = 1 / TAN 60 = 0.577 of radius per millimeter down.</p><p>Top diameter = 60 − 2 × 20 × 0.577 = <b>36.906</b>.</p><p>Turns ≈ height / Q = 20 / 0.5 = <b>40 turns</b>.</p>'),
    grp_vid='Macros with video', grp_novid='Macros without video',
)

# ---------------------------------------------------------------- FR (Québec)
L['fr-CA'] = dict(
    t16='16. Cône extérieur avec fraise 90° ou fraise en bout (O1630)',
    h16=(
        '<p>Regardez la vidéo : elle montre la macro étape par étape, avec la fraise qui suit la ligne du cône et les calculs de chaque tour.</p>'
        '<h3>16.1 Résumé</h3>'
        '<p>Fait un cône sur l’extérieur de la pièce, avec le petit diamètre en haut et le grand à la base. La pointe de la fraise suit la ligne du cône, du haut vers le bas, avec un tour complet G2 à chaque position. La lettre <b>Q</b> indique la descente de la pointe à chaque tour.</p>'
        + code('G65 P1630 X0 Y0 D60. B30 W0 Z-8. Q0.5 E0 T28. R5. F800. ;') +
        tbl(['Lettre', 'Ce que c’est'], [
            ['X Y', 'centre du cône'], ['D', 'grand diamètre, à la base (égal au brut)'],
            ['B', 'angle du cône par rapport à la face du dessus'], ['A', 'petit diamètre en haut (à la place de B)'],
            ['W / Z', 'Z du dessus / Z de la base'], ['Q', 'descente de la pointe à chaque tour'],
            ['E', 'diamètre de la pointe plate de la fraise : 0 = fraise 90° à pointe vive; E = T = fraise en bout'],
            ['T', 'grand diamètre de la fraise'], ['R / F', 'plan de sécurité / avance']]) +
        '<ul><li><b>Fraise conique 90°</b> (E0) : B de 1 à 45.</li><li><b>Fraise en bout</b> (E égal à T) : le coin du bas suit la ligne et fait tout angle B de 1 à 89.</li>'
        '<li>Le correcteur de longueur est à la pointe de la fraise (le point le plus bas).</li><li>Petit Q = meilleur fini : il reste une marche d’au plus Q de hauteur entre les tours.</li>'
        '<li>Avec une fraise à plaquette ronde, utilisez O1637 (chapitre 17).</li></ul>'),
    t17='17. Autres macros : rainure de clavette, rayons, chanfrein de trou et cône à plaquette ronde',
    intro17=(
        '<p>Ces macros suivent la même structure que les précédentes : le programme principal appelle le sous-programme avec G65, chaque lettre devient une variable locale et les erreurs arrêtent avec l’alarme #3000. '
        'Les macros de rayon, de chanfrein et de cône font <b>un tour complet à chaque position</b> : à chaque tour, la macro calcule le rayon de la trajectoire du centre de la fraise et le Z, puis avance un peu sur le profil. '
        'Petit pas (H en degrés pour les rayons, Q pour les chanfreins et les cônes) = fini plus lisse et programme plus long. Elles sont toutes dans la bibliothèque de l’app pour la simulation.</p>'),
    secs=[
        dict(h='17.1 Rainure de clavette en rampe (O1624)',
             idea='Usine une rainure droite avec les deux bouts en demi-cercle, avec une fraise en bout. Au lieu de plonger, la fraise <b>descend en rampe</b> d’un bout à l’autre en perdant K de hauteur. À ce Z, elle contourne toute la rainure (sens antihoraire G3). À la couche suivante, la rampe revient dans l’autre sens. À la fin, elle fait une passe à plat au fond pour nettoyer la dernière rampe.',
             call='G65 P1624 X0 Y0 I200. T28. B32. W0 Z-1. K0.5 R50. F2000. ;',
             letters=[['X Y', 'centre de la rainure'], ['I', 'longueur totale, d’un bout à l’autre'], ['T', 'diamètre de la fraise'], ['B', 'largeur de la rainure (sans B, utilise T)'],
                      ['W / Z', 'dessus / fond de la rainure'], ['K', 'descente à chaque rampe'], ['R / F', 'plan de sécurité / avance']],
             math=['X du centre de la fraise au bout = I/2 − B/2 (avec signe + ou −, qui alterne à chaque couche).', 'Décalage en Y pour le contour = (B − T)/2. Si B = T, elle fait seulement la rampe.'],
             check=['B entre T et 3×T (alarmes 215 et 216). I plus grand que B (212).', 'Rampe longue et petit K : la rampe est douce et la fraise ne plonge pas.', 'Alarmes 211 à 216.']),
        dict(h='17.2 Rayon sur l’arête du trou (O1627)',
             idea='Arrondit l’entrée d’un trou déjà usiné (arête du dessus, rayon convexe). Le coin du bas de la fraise suit le rayon C, du haut vers le bas. À chaque tour (G3, dans le trou), l’angle θ avance de H degrés.',
             call='G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'centre du trou'], ['D', 'diamètre du trou'], ['W', 'dessus de la pièce'], ['C', 'rayon de l’arête'], ['H', 'pas en degrés à chaque tour'],
                      ['T', 'diamètre de la fraise (coin vif)'], ['R / F', 'plan de sécurité / avance du tour'], ['Q', 'avance de descente entre les tours (sans Q, utilise F)']],
             math=['Rayon du centre de la fraise = D/2 + C − C·SIN θ − T/2', 'Z = W − C + C·COS θ', 'θ va de H jusqu’à près de 90°.'],
             check=['D plus grand que T (alarme 256).', 'Fraise à coin vif : un rayon de coin sur la fraise change le rayon de la pièce.', 'Alarmes 251 à 256.']),
        dict(h='17.3 Rayon sur l’arête du diamètre extérieur (O1635)',
             idea='Arrondit l’arête du dessus d’un cylindre déjà usiné au diamètre D (rayon convexe à l’extérieur). La fraise reste à l’extérieur et descend sur le rayon, un tour G2 par position. Le dernier tour est à θ = 90°, déjà sur la paroi du cylindre.',
             call='G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300. ;',
             letters=[['X Y', 'centre du cylindre'], ['D', 'diamètre du cylindre'], ['W', 'dessus du cylindre'], ['C', 'rayon de l’arête'], ['H', 'pas en degrés à chaque tour'],
                      ['T', 'diamètre de la fraise (coin vif)'], ['R / F', 'plan de sécurité / avance du tour'], ['Q', 'avance de descente entre les tours (sans Q, utilise F)']],
             math=['Rayon du centre de la fraise = D/2 − C + C·SIN θ + T/2', 'Z = W − C + C·COS θ', 'Dernier tour : rayon D/2 + T/2 et Z = W − C.'],
             check=['C ne peut pas dépasser le rayon du cylindre (alarme 266).', 'Le premier tour entre par l’extérieur du cylindre.', 'Alarmes 261 à 266.']),
        dict(h='17.4 Chanfrein de trou avec fraise en bout (O1628)',
             idea='Fait le chanfrein à l’entrée d’un trou avec une fraise en bout ordinaire. Le coin du bas de la fraise suit la ligne du chanfrein, du haut vers le bas, avec un tour G3 à chaque position. L’angle est libre (lettre B, de 1 à 89).',
             call='G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800. ;',
             letters=[['X Y', 'centre du trou'], ['D', 'diamètre du trou'], ['W', 'dessus de la pièce'], ['C', 'largeur du chanfrein en haut, mesurée sur le rayon'], ['B', 'angle par rapport au dessus (sans B, utilise 45)'],
                      ['Q', 'descente de la fraise à chaque tour'], ['T', 'diamètre de la fraise'], ['R / F', 'plan de sécurité / avance']],
             math=['Hauteur du chanfrein sur la paroi = C × TAN B', 'Pas sur le rayon à chaque tour = Q / TAN B', 'Rayon du centre de la fraise = D/2 + d − T/2, où d va de C à 0 (distance du coin à la paroi).'],
             check=['Le correcteur est à la pointe de la fraise.', 'D plus grand que T (266) et C pas plus grand que T (267).', 'Il reste une marche d’au plus Q de hauteur entre les tours.', 'Alarmes 261 à 269.']),
        dict(h='17.5 Rayon entre deux diamètres (O1631)',
             idea='Fait un rayon C qui commence au diamètre D (au Z de W) et finit au diamètre A, plus grand. La fin de l’arc est définie par l’angle <b>B</b> de la tangente finale ou par la hauteur <b>I</b> de l’arc. Le coin du bas de la fraise suit l’arc du haut vers le bas, un tour G2 par position. L’ébauche doit déjà être faite.',
             call='G65 P1631 X0 Y0 C49.77 D299.5 A374. I46.7 H1. T28. W-21. R50. F1500. ;',
             letters=[['X Y', 'centre'], ['C', 'rayon de l’arc'], ['D', 'diamètre où l’arc commence'], ['A', 'diamètre où l’arc finit'], ['B', 'angle de la tangente finale par rapport à la face (pas utilisé avec I)'],
                      ['I', 'hauteur de l’arc en Z (facultatif)'], ['H', 'pas en degrés à chaque tour'], ['T', 'diamètre de la fraise (coin vif)'], ['W', 'Z où l’arc commence'],
                      ['R / F / Q', 'sécurité / avance du tour / avance de descente']],
             math=['La macro trouve l’angle de départ et l’angle final de l’arc (par la tangente B ou par la corde jusqu’à la hauteur I).', 'Rayon du centre de la fraise = D/2 + C·(COS α0 − COS α) + T/2', 'Z = W − C·(SIN α − SIN α0)'],
             check=['A plus grand que D (293).', 'Rayon C trop petit pour l’ouverture : alarme 297.', 'Alarmes 291 à 299.']),
        dict(h='17.6 Cône extérieur avec plaquette ronde (O1637)',
             idea='Le même cône qu’au chapitre 16, mais avec une fraise à plaquette ronde. Le <b>centre de la plaquette</b> suit une ligne parallèle au cône, décalée de E, avec un tour G2 à chaque position. Il reste un rayon égal à E à la base, parce que la plaquette ronde ne fait pas de coin vif.',
             call='G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500. ;',
             letters=[['X Y', 'centre du cône'], ['D', 'diamètre de la base (brut)'], ['B ou A', 'angle du cône ou diamètre du dessus'], ['W / Z', 'dessus / base'], ['Q', 'descente du point de contact à chaque tour'],
                      ['E', 'rayon de la plaquette (plaquette de 12 = 6)'], ['T', 'grand diamètre de la fraise, au bord extérieur de la plaquette'], ['R / F', 'plan de sécurité / avance']],
             math=['Rayon du centre de la fraise = rayon du cône au point de contact + E·SIN B + (T/2 − E)', 'Z de la fraise = Z du contact − E·(1 − COS B)', 'Le point le plus bas de la plaquette ne dépasse jamais le Z de la base.'],
             check=['Le correcteur est au point le plus bas de la plaquette.', 'Sans plaquette ronde, utilisez O1630 (alarme 295).', 'Le brut doit être près du cône : la fraise nettoie une bande d’environ T de large à chaque tour.', 'Alarmes 291 à 299.']),
    ],
    lab=dict(idea='L’idée', call='Appel et lettres', math='Les calculs', check='Comment vérifier', letter='Lettre', what='Ce que c’est'),
    other=(
        '<h3>17.7 Autres macros de la même famille</h3><p>Elles ne sont pas dans la bibliothèque de l’app; elles suivent les mêmes idées que ci-dessus.</p>' +
        tbl(['Macro', 'Ce qu’elle fait', 'Exemple d’appel'], [
            ['O1625 clavette sans rampe', 'Rainure aux bouts arrondis, descend droit au début de chaque couche', '<code>G65 P1625 X0 Y0 I60. V0 T20. B40. U14. W0 Z-5. K0.5 R5. F600. Q200.</code>'],
            ['O1626 rayon au fond du trou', 'Rayon concave entre la paroi et le fond d’un trou', '<code>G65 P1626 X0 Y0 D35. W0 Z-20. C3. H1. T28. R5. F800. Q300.</code>'],
            ['O1629 rainure aux bouts en arc', 'Rainure droite avec les deux bouts en arc, sans rampe', '<code>G65 P1629 X0 Y0 B9. C39.5 T6. W0 Z-5. K1. U4. R5. F600. Q200.</code>'],
            ['O1632 rayon avec plaquette ronde', 'Le rayon de O1631 avec une fraise à plaquette ronde (E = rayon de la plaquette)', '<code>G65 P1632 X0 Y0 C49.77 D299.5 A374. I46.7 E6. H1. T50. W-21. R50. F1500.</code>'],
            ['O1633 filetage en cercle (D direct)', 'Filetage intérieur fraisé, rayon final donné en D', '<code>G65 P1633 X0 Y0 J375. B12 A15. K2. D1. Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1634 filetage en cercle (D et T)', 'Filetage intérieur fraisé, rayon calculé par D et la fraise T', '<code>G65 P1634 X0 Y0 J375. B12 A15. K2. D16. T13.85 Q0.25 W0 Z-30. R5. F30.</code>'],
            ['O1636 rayon à la base du cylindre', 'Rayon concave entre le cylindre et la face du bas', '<code>G65 P1636 X0 Y0 D80. W0 Z-20. C5. H1. T28. R5. F800. Q300.</code>']])),
    res16=['La pointe suit la ligne du cône, un tour par position.', 'Fraise 90° : B jusqu’à 45. Fraise en bout (E = T) : B de 1 à 89.', 'Petit Q = meilleur fini.'],
    res17=['Un tour complet à chaque position du profil.', 'Rayons : pas H en degrés. Chanfrein et cône : pas Q en Z.', 'Fraise à coin vif; plaquette ronde seulement sur O1637.'],
    ex8=('<p><b>Exercice 8 : cône</b></p><p>Dans <code>G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.5 E0 T28. R5. F800.</code>, quel est le diamètre du cône en haut? Et environ combien de tours la macro fait-elle?</p>'),
    ans8=('<p>Ouverture = 1 / TAN 60 = 0.577 de rayon par millimètre de descente.</p><p>Diamètre du dessus = 60 − 2 × 20 × 0.577 = <b>36.906</b>.</p><p>Tours ≈ hauteur / Q = 20 / 0.5 = <b>40 tours</b>.</p>'),
    grp_vid='Macros avec vidéo', grp_novid='Macros sans vidéo',
)


def ch17_html(d):
    lb = d['lab']
    h = d['intro17']
    for s in d['secs']:
        h += '<h3>%s</h3>' % s['h']
        h += '<p><b>%s:</b> %s</p>' % (lb['idea'], s['idea']) if False else '<p><b>%s</b></p><p>%s</p>' % (lb['idea'], s['idea'])
        h += '<p><b>%s</b></p>' % lb['call'] + code(s['call']) + tbl([lb['letter'], lb['what']], s['letters'])
        h += '<p><b>%s</b></p><ul>%s</ul>' % (lb['math'], ''.join('<li>%s</li>' % m for m in s['math']))
        h += '<p><b>%s</b></p><ul>%s</ul>' % (lb['check'], ''.join('<li>%s</li>' % m for m in s['check']))
    return h + d['other']
