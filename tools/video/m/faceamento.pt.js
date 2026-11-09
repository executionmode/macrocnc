window.LANG = "pt";
window.STR = {
"and": "e",
"hdr": "O1611 · FACEAMENTO",
"codeTitle": "O1611 — macro",
"mainTitle": "O0001 — programa principal",
"mainComment": "FACEAMENTO",
"dro": "ABSOLUTA",
"side": "vista de lado",
"layer": "camada",
"of": "{a} de {b}",
"c1.t": "Passo a passo da macro",
"c1.s": [
"Hoje vamos entender, bloco a bloco, a macro de faceamento O1611.",
"É a macro mais simples da biblioteca e a base para entender todas as outras."
],
"c1.k1": "MACRO DE",
"c1.k2": "FACEAMENTO",
"c2.t": "Principal chama, macro trabalha",
"c2.s": [
"O programa principal chama a macro com G65 P1611.",
"A macro faz as contas e os movimentos, e volta com M99.",
"Na máquina, você só muda as letras do G65. A macro ninguém mexe."
],
"c2.main": "PRINCIPAL",
"c2.m1": "o operador edita",
"c2.m2": "as letras do G65",
"c2.s1": "contas, alarmes",
"c2.s2": "e movimentos",
"c2.you": "Você muda:",
"c2.not": "Não mexe:",
"c2.code": "o código da O1611",
"c3.t": "As letras viram variáveis",
"c3.s": [
"Cada letra do G65 vira uma variável dentro da macro.",
"X e Y são o tamanho da área: {X} por {Y}.",
"W é o topo da peça. Z é o Z final.",
"K é o passe em Z. T é o diâmetro da fresa.",
"Q é o passo lateral. A é a folga fora da peça.",
"R é o plano de segurança e F é o avanço."
],
"c3.names": [
"Tamanho em X",
"Tamanho em Y",
"Topo da peça",
"Z final",
"Passe em Z",
"Diâmetro fresa",
"Passo lateral",
"Folga em X",
"Plano segurança",
"Avanço"
],
"c4.t": "Bloco 1: raio da fresa",
"c4.s": [
"Primeiro bloco: o raio da fresa.",
"T é {T}, então #100 vale {T} dividido por 2: {r}."
],
"c5.t": "Bloco 2: até onde vai em X",
"c5.s": [
"Agora, até onde o centro da fresa vai em X.",
"Metade da área, {hx}, mais o raio, {r}, mais a folga, {A}.",
"Dá {xo}. Assim a fresa sai inteira para fora da peça."
],
"c6.t": "Bloco 3: última linha em Y",
"c6.s": [
"Em Y, a última linha fica em {hy} menos {r}.",
"Dá {ylast}. A borda da fresa para exatamente no limite da área.",
"Se a fresa for maior que a área, o IF faz uma linha só, no meio."
],
"c7.t": "Alarmes de proteção",
"c7.s": [
"Antes de mexer, a macro confere os dados.",
"Z acima do topo, K zero, Q zero ou Q maior que a fresa: alarmes 101 a 104.",
"Melhor parar com alarme do que cortar errado."
],
"c7.q": [
"Z acima do topo?",
"K zero ou negativo?",
"Q zero ou negativo?",
"Q maior que a fresa?"
],
"c7.ok": "✓ dados OK → segue",
"c8.t": "N10: cada camada desce K",
"c8.s": [
"A superfície atual começa no topo: #104 recebe W, que é zero.",
"N10: cada camada desce K. Zero menos {K} dá Z{g:z1}.",
"O IF garante que a fresa nunca passa do Z final."
],
"c8.lim": "Z final = {g:Z} (limite)",
"c9.t": "Aproximação fora da peça",
"c9.s": [
"A fresa vai em rápido para X-{g:xo}, Y-{g:ylast}, fora da peça.",
"Desce em rápido até o plano de segurança: Z{g:safe}.",
"E entra em avanço até Z{g:z1}, ainda no ar, fora da peça."
],
"c9.leg": "G0 = rápido (tracejado)",
"c9.feed": "avanço F{g:F}",
"c9.rapid": "rápido",
"c10.t": "N20: o vai-e-volta",
"c10.s": [
"N20: corta em X até o lado oposto, X{g:xo}.",
"Depois inverte o sinal de #106: o próximo corte volta.",
"Se ainda não chegou na última linha, soma Q{g:Q} em Y.",
"Y passa por {ylist}.",
"A próxima seria {next}. Passa do limite, então o IF trava em {ylast}.",
"GOTO 20 repete o corte. No total são {n} linhas."
],
"c10.line": "linha {a} de {b}",
"c11.t": "N30: sobe e confere o fundo",
"c11.s": [
"N30: terminou a camada, a fresa sobe para o plano de segurança.",
"Se ainda falta chegar no Z final, volta ao N10 para a próxima camada.",
"Por exemplo, com Z{g:zEx} e K{g:K}, seriam duas camadas.",
"Chegou no fundo? M99 volta para o programa principal."
],
"c12.t": "Resumo e dica de segurança",
"c12.s": [
"Resumindo: raio, limites, alarmes, camada, vai-e-volta e M99.",
"Na primeira vez, teste com W50 e Z49: a máquina desenha no ar.",
"E simule antes no app Macro CNC. Até a próxima macro!"
],
"c12.res": [
"Raio da fresa",
"Até onde ir em X e em Y",
"Alarmes de proteção",
"Camada: desce K",
"Vai-e-volta em X, avança Q",
"Sobe, confere, M99"
],
"c12.first": "Primeira peça",
"c12.air": "a fresa faz tudo 50 mm acima",
"c12.sim": "Simule no app",
"c12.path": "Macro CNC → Programas → Faceamento"
};
Object.assign(window.STR, {"c1.v": ["Hoje vamos entender, bloco a bloco, a macro de faceamento O dezesseis onze.", "É a macro mais simples da biblioteca e a base para entender todas as outras."], "c2.v": ["O programa principal chama a macro com G sessenta e cinco P dezesseis onze.", "A macro faz as contas e os movimentos, e volta com M noventa e nove.", "Na máquina, você só muda as letras do G sessenta e cinco. A macro ninguém mexe."], "c3.v": ["Cada letra do G sessenta e cinco vira uma variável dentro da macro.", "X e Y são o tamanho da área: duzentos e quinze por duzentos e quinze.", "W é o topo da peça. Z é o Z final.", "K é o passe em Z. T é o diâmetro da frésa.", "Q é o passo lateral. A é a folga fora da peça.", "R é o plano de segurança e F é o avanço."], "c4.v": ["Primeiro bloco: o raio da frésa.", "T é cinquenta, então a variável cem vale cinquenta dividido por dois: vinte e cinco."], "c5.v": ["Agora, até onde o centro da frésa vai em X.", "Metade da área, cento e sete e meio, mais o raio, vinte e cinco, mais a folga, cinco.", "Dá cento e trinta e sete e meio. Assim a frésa sai inteira para fora da peça."], "c6.v": ["Em Y, a última linha fica em cento e sete e meio menos vinte e cinco.", "Dá oitenta e dois e meio. A borda da frésa para exatamente no limite da área.", "Se a frésa for maior que a área, o IF faz uma linha só, no meio."], "c7.v": ["Antes de mexer, a macro confere os dados.", "Z acima do topo, K zero, Q zero ou Q maior que a frésa: alarmes cento e um a cento e quatro.", "Melhor parar com alarme do que cortar errado."], "c8.v": ["A superfície atual começa no topo: a variável cento e quatro recebe W, que é zero.", "N dez: cada camada desce K. Zero menos dois e meio dá Z menos dois e meio.", "O IF garante que a frésa nunca passa do Z final."], "c9.v": ["A frésa vai em rápido para X menos cento e trinta e sete e meio, Y menos oitenta e dois e meio, fora da peça.", "Desce em rápido até o plano de segurança: Z vinte e cinco.", "E entra em avanço até Z menos dois e meio, ainda no ar, fora da peça."], "c10.v": ["N vinte: corta em X até o lado oposto, X cento e trinta e sete e meio.", "Depois inverte o sinal da variável cento e seis: o próximo corte volta.", "Se ainda não chegou na última linha, soma Q trinta em Y.", "Y passa por menos oitenta e dois e meio, menos cinquenta e dois e meio, menos vinte e dois e meio, sete e meio, trinta e sete e meio e sessenta e sete e meio.", "A próxima seria noventa e sete e meio. Passa do limite, então o IF trava em oitenta e dois e meio.", "GOTO vinte repete o corte. No total são 7 linhas."], "c11.v": ["N trinta: terminou a camada, a frésa sobe para o plano de segurança.", "Se ainda falta chegar no Z final, volta ao N dez para a próxima camada.", "Por exemplo, com Z menos cinco e K dois e meio, seriam duas camadas.", "Chegou no fundo? M noventa e nove volta para o programa principal."], "c12.v": ["Resumindo: raio, limites, alarmes, camada, vai-e-volta e M noventa e nove.", "Na primeira vez, teste com W cinquenta e Z quarenta e nove: a máquina desenha no ar.", "E simule antes no app Macro CNC. Até a próxima macro!"]});
