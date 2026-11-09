import re, json, html as H, sys
sys.path.insert(0, '/home/claude/train')
from svgs import MEDIA

src = open('/home/claude/train/doc1.html').read()

def semis_block(m):
    code = H.unescape(m.group(1))
    out = []
    for l in code.split('\n'):
        l = l.rstrip()
        if not l or l == '%' or l.endswith(';'):
            out.append(l)
        else:
            out.append(l + ' ;')
    return '<pre class="code">' + H.escape('\n'.join(out), quote=False) + '</pre>'

src = re.sub(r'<pre class="code">(.*?)</pre>', semis_block, src, flags=re.S)
src = re.sub(r'</code(?=<)', '</code>', src)   # corrige tags cortadas
src = re.sub(r'</(?=</)', '</b>', src)

def fig(m):
    key = m.group(1); cap = m.group(2)
    fn = MEDIA.get(key)
    if not fn: return ''
    return '<figure class="tfig">' + fn() + '<figcaption>' + cap + '</figcaption></figure>'
src = re.sub(r'<figure data-media="([^"]+)"><figcaption>(.*?)</figcaption></figure>', fig, src, flags=re.S)

parts = re.split(r'<h2>(.*?)</h2>', src)
intro = parts[0]
intro = re.sub(r'<h1>.*?</h1>\s*<p>[0-9-]+</p>', '', intro, flags=re.S)
chs = []
for i in range(1, len(parts), 2):
    chs.append({'t': parts[i].strip(), 'html': parts[i + 1].strip()})

ANS = {
 1: '<p><b>(a)</b> #100 = 40/2 = 20; #101 = 100/2 + 20 + 5 = <b>75</b>. O centro da fresa começa em <b>X-75</b> e vai até X75.</p>'
    '<p><b>(b)</b> #102 = 60/2 - 20 = 10. Primeira linha Y-10; somando Q30 daria Y20, que passa do limite, então a última fica em <b>Y10</b>. São <b>2 linhas</b>: Y-10 e Y10.</p>'
    '<p><b>(c)</b> De W0 a Z-1 com K1: <b>1 camada</b>.</p>',
 2: '<p>R = J/2 = 50. Ângulo entre furos = 360/8 = 45°.</p>'
    '<p><b>Furo 2</b>: θ = 0 + 1×45 = 45° → X = 50×COS45 = <b>35.355</b>, Y = 50×SIN45 = <b>35.355</b>.</p>'
    '<p><b>Furo 3</b>: θ = 90° → <b>X0</b>, <b>Y50</b>.</p>',
 3: '<p>Raio da trajetória = (D - T)/2 = (30 - 16)/2 = <b>7</b>.</p>'
    '<p>De Z0 a Z-10 com K2.5: Z-2.5, -5, -7.5, -10 = <b>4 voltas com descida</b>, mais <b>1 volta plana</b> no fundo.</p>',
 4: '<p>Afastamento = C - C×SIN θ = 5 - 5×0.5 = <b>2.5</b>.</p>'
    '<p>Z = W - C + C×COS θ = 0 - 5 + 5×0.866 = <b>-0.670</b>.</p>',
 5: '<p>Altura na face = C×TAN B = 2×0.577 = <b>1.155</b>.</p>'
    '<p>Passes = C/Q = 2/0.25 = <b>8 passes</b>.</p>'
    '<p>Degrau ≈ Q×(1 - TAN²B)/2 = 0.25×(1 - 0.333)/2 ≈ <b>0.083 mm</b>.</p>',
 6: '<ul><li>(a) B60 no O1623: <b>alarme 202</b> (B maior que 45).</li>'
    '<li>(b) H90 no O1618: <b>alarme 173</b> (passo em graus maior ou igual a 90).</li>'
    '<li>(c) Z1 com W0 no O1611: <b>alarme 101</b> (Z final acima do topo).</li></ul>',
 7: '<p>No O1617 o D é o diâmetro que passa pelos <b>cantos</b>. Para sextavado: D = entre faces / COS 30° = 30 / 0.866 = <b>34.641</b>.</p>'
    '<p>Regra geral: D = entre faces / COS(180/B).</p>',
 8: '<p>1ª chamada: #500 = <b>1</b>. 2ª: <b>2</b>. 3ª: <b>3</b> → 3 não é menor que Q3, então a máquina <b>para na 3ª chamada</b> com "LOTE COMPLETO". Zere com <code>G65 P1620 Q0</code>.</p>',
 9: '<p>Atenção: <b>P não pode ser letra de argumento</b> no G65 (P é o número do programa). Use outra letra para o espaçamento, por exemplo <b>I</b>.</p>'
    '<pre class="code">O1690 (FUROS EM LINHA) ;\n(LETRAS DO G65 P1690) ;\n(X Y = PRIMEIRO FURO) ;\n(B = QUANTIDADE  I = ESPACAMENTO EM X) ;\n(W = TOPO  Z = Z FINAL  R = SEGURANCA  F = AVANCO) ;\nIF [#2 LT 1] THEN #3000 = 281 (B INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 282 (Z FINAL ACIMA DO TOPO) ;\n#100 = 1 ;\nN10 #101 = #24 + [#100 - 1] * #4 ;\nG99 G81 X#101 Y#25 Z#26 R[#23 + #18] F#9 ;\nIF [#100 GE #2] GOTO 20 ;\n#100 = #100 + 1 ;\nGOTO 10 ;\nN20 G80 ;\nG98 ;\nM99 ;</pre>'
    '<p>Chamada: <code>G65 P1690 X0 Y0 B5 I20. W0 Z-10. R3. F100. ;</code> → 5 furos em X0, 20, 40, 60, 80.</p>',
}
EX_NAMES = {1: 'Exercício 1', 2: 'Exercício 2', 3: 'Exercício 3', 4: 'Exercício 4', 5: 'Exercício 5', 6: 'Exercício 6', 7: 'Exercício 7', 8: 'Exercício 8', 9: 'Desafio'}

# exercícios com "Ver resposta"
ex = next(c for c in chs if c['t'].startswith('20.'))
h = ex['html']
marks = [(m.start(), n) for n, nm in EX_NAMES.items() for m in [re.search(r'<p><b>' + nm, h)] if m]
marks.sort()
out = h[:marks[0][0]]
for k, (pos, n) in enumerate(marks):
    end = marks[k + 1][0] if k + 1 < len(marks) else len(h)
    out += '<div class="exq">' + h[pos:end] + '<details class="ans"><summary>Ver resposta</summary>' + ANS[n] + '</details></div>'
ex['html'] = out

gab = next(c for c in chs if c['t'].startswith('21.'))
gab['html'] = ''.join('<h3>%s</h3>%s' % (EX_NAMES[n], ANS[n]) for n in sorted(ANS))

COLA = '''
<h3>Letras do G65 → variáveis</h3>
<div class="tw"><table><tr><th>Letra</th><th>#</th><th>Letra</th><th>#</th><th>Letra</th><th>#</th></tr>
<tr><td>A</td><td>#1</td><td>I</td><td>#4</td><td>R</td><td>#18</td></tr>
<tr><td>B</td><td>#2</td><td>J</td><td>#5</td><td>S</td><td>#19</td></tr>
<tr><td>C</td><td>#3</td><td>K</td><td>#6</td><td>T</td><td>#20</td></tr>
<tr><td>D</td><td>#7</td><td>M</td><td>#13</td><td>U</td><td>#21</td></tr>
<tr><td>E</td><td>#8</td><td>Q</td><td>#17</td><td>V</td><td>#22</td></tr>
<tr><td>F</td><td>#9</td><td></td><td></td><td>W</td><td>#23</td></tr>
<tr><td>H</td><td>#11</td><td></td><td></td><td>X Y Z</td><td>#24 #25 #26</td></tr></table></div>
<p>Não podem ser letras de argumento: <b>G, L, N, O, P</b>.</p>
<h3>Padrão das letras na oficina</h3>
<ul><li><b>X Y</b> centro · <b>W</b> topo (face) · <b>Z</b> Z final</li><li><b>K</b> descida · <b>T</b> diâmetro da fresa · <b>Q</b> passo lateral</li><li><b>R</b> plano de segurança · <b>F</b> avanço</li></ul>
<h3>Comparações</h3>
<div class="tw"><table><tr><th>Escreve</th><th>Significa</th></tr><tr><td>EQ</td><td>igual</td></tr><tr><td>NE</td><td>diferente</td></tr><tr><td>GT</td><td>maior</td></tr><tr><td>GE</td><td>maior ou igual</td></tr><tr><td>LT</td><td>menor</td></tr><tr><td>LE</td><td>menor ou igual</td></tr></table></div>
<h3>Funções</h3>
<p><code>SIN COS TAN ATAN SQRT ABS ROUND FIX FUP</code> — ângulos sempre em <b>graus</b>. Colchete <code>[ ]</code> no lugar de parênteses nas contas.</p>
<h3>Estruturas</h3>
<pre class="code">IF [#1 GT 10] GOTO 20 ;
IF [#1 GT 10] THEN #2 = 5 ;
WHILE [#1 LT 10] DO 1 ;
...
END 1 ;
#3000 = 101 (TEXTO DO ALARME) ;
#3006 = 1 (MENSAGEM E PARA) ;</pre>
<h3>Faixas de alarme por macro</h3>
<div class="tw"><table><tr><th>Macro</th><th>Alarmes</th></tr>
<tr><td>O1611 faceamento</td><td>101–104</td></tr><tr><td>O1612 PCD</td><td>111</td></tr><tr><td>O1613 hélice</td><td>121–123</td></tr>
<tr><td>O1616 retangular</td><td>151–154</td></tr><tr><td>O1617 polígono</td><td>161–163</td></tr><tr><td>O1618 raio</td><td>171–176</td></tr>
<tr><td>O1620–O1622 contador/vida/correção</td><td>191–195</td></tr><tr><td>O1623 chanfro 90°</td><td>201–208</td></tr><tr><td>O1624 canal</td><td>211–216</td></tr></table></div>
<h3>Antes de apertar o Cycle Start</h3>
<ul><li>Preset da ferramenta conferido (ponta, no caso da fresa de chanfrar).</li><li>Primeira rodada com Z acima da peça (W50 Z49) ou single block.</li><li>Potenciômetro de avanço baixo na primeira peça.</li><li>Simule no app antes: o bruto e a trajetória devem bater com o desenho.</li></ul>
'''

QUIZ = [
 ('No G65 P1611 X215. ..., a letra X vira qual variável dentro da macro?', ['#1', '#24', '#100', '#500'], 1),
 ('Qual faixa de variáveis guarda valores mesmo depois de desligar a máquina?', ['#1 a #33', '#100 a #199', '#500 a #999', '#3000'], 2),
 ('Qual comando volta da macro para o programa principal?', ['M30', 'M98', 'M99', 'G80'], 2),
 ('No furo em hélice, o centro da fresa anda num círculo de raio:', ['D/2', 'T/2', '(D - T)/2', 'D - T'], 2),
 ('No PCD, se J é 100, o raio do círculo é:', ['100', '50', '200', '25'], 1),
 ('Para parar a máquina com um alarme da macro, usa-se:', ['#3000 = n', '#500 = n', 'M00', 'GOTO 0'], 0),
 ('No faceamento, o passo lateral Q pode ser maior que a fresa T?', ['Sim, sempre', 'Não, dá alarme 104', 'Só em alumínio', 'Só com K maior'], 1),
 ('Qual letra NÃO pode ser usada como argumento no G65?', ['K', 'Q', 'P', 'W'], 2),
 ('Fresa de chanfrar 90° no O1623: qual o maior ângulo B aceito?', ['30', '45', '60', '90'], 1),
 ('Em que sentido o contorno externo em G2 com M3 corta?', ['Concordante', 'Discordante', 'Depende do Z', 'Tanto faz'], 0),
]

SIMS = {
 '7.': ['m-face'], '8.': ['m-pcd'], '9.': ['m-helice', 'p-helice'], '10.': ['p-3bolsas'], '12.': ['m-ret', 'm-poli', 'p-quadrado', 'p-sextavados'],
 '13.': ['m-raio-convexo', 'm-raio-concavo'], '14.': ['p-interp-chanfro'], '15.': ['p-rosca'],
 '17.': ['m-canal', 'm-raio-diam', 'm-cone', 'm-raio-furo', 'm-raio-cil', 'm-chanfro-furo'],
}
RESUMO = {
 '1.': ['O principal chama a macro com G65 P(número).', 'A macro faz as contas e os movimentos e volta com M99.', 'O operador só muda as letras do G65.'],
 '2.': ['#1–#33: locais, recebem as letras.', '#100–#199: contas, somem ao desligar.', '#500–#999: ficam gravadas (contadores).', 'Letra vazia não é zero.'],
 '3.': ['Cada letra tem uma variável fixa (X = #24, Y = #25...).', 'G, L, N, O e P não são argumentos.', 'Valores com ponto decimal: X215.'],
 '4.': ['Contas com colchetes [ ].', 'Ângulos em graus.', 'Comparações: EQ NE GT GE LT LE.'],
 '5.': ['IF ... GOTO desvia; IF ... THEN faz uma conta.', 'Laço = contador + IF que volta.', 'Sempre garanta que o laço tem saída.'],
 '6.': ['#3000 = n para com alarme.', '#3006 = n para com mensagem e deixa continuar.', 'Cada macro tem sua faixa de alarmes.'],
 '7.': ['Vai-e-volta em X, avança Q em Y.', 'Camadas de K até Z.', 'Q nunca maior que T.'],
 '8.': ['θ = A + (n-1)×360/B; X = R·COS θ, Y = R·SIN θ.', 'J é diâmetro: R = J/2.', 'H escolhe furar, fresar ou roscar.'],
 '9.': ['Raio da trajetória = (D - T)/2.', 'Desce K por volta, volta plana no fundo.', 'D maior que 2T deixa núcleo.'],
 '13.': ['Fresa reta faz degraus pelo ângulo θ.', 'H menor = curva mais lisa.', 'Nunca corta a mais, só deixa degrau.'],
 '14.': ['Ponta da fresa 90° anda na linha do chanfro.', 'Altura = C × TAN B.', 'B até 45°.'],
 '18.': ['Simule antes no app.', 'Primeira peça com Z no ar ou single block.', 'Avanço baixo e mão no feed hold.'],
}

out_chs = []
for c in chs:
    num = c['t'].split(' ')[0]
    if not num[0].isdigit(): num = ''
    out_chs.append({'t': c['t'], 'html': c['html'], 'sims': SIMS.get(num, []), 'resumo': RESUMO.get(num, [])})
out_chs.append({'t': '22. Teste rápido', 'html': '', 'quiz': [{'q': q, 'o': o, 'a': a} for q, o, a in QUIZ], 'sims': [], 'resumo': []})
out_chs.append({'t': '23. Cola rápida', 'html': COLA, 'sims': [], 'resumo': []})
out_chs.append({'t': '24. Padrão da oficina (regras)', 'html': '<p>As regras que todo programa do app segue. O assistente também escreve os programas novos assim.</p>', 'rules': True, 'sims': [], 'resumo': []})

data = {'title': 'Treinamento de Macros FANUC', 'intro': intro.strip(), 'chapters': out_chs}
js = 'window.TRAINING = ' + json.dumps(data, ensure_ascii=False) + ';\n'
open('/home/claude/macro-cnc/training.js', 'w').write(js)
print(len(js), len(out_chs))
for c in out_chs: print(c['t'], len(c['html']), c['sims'])
