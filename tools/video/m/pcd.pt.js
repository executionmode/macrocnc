window.LANG = "pt";
window.STR = {
"and": "e", "yes": "sim", "no": "não",
"hdr": "O1612 · FUROS EM CÍRCULO",
"codeTitle": "O1612 — macro",
"mainTitle": "O0012 — programa principal",
"mainComment": "FUROS EM CIRCULO - O1612",
"side": "vista de lado",
"tri.c": "centro", "tri.r": "raio", "tri.h1": "furo 1",
"c1.t": "As contas da macro",
"c1.s": [
"Nesta aula, vamos ver por dentro a macro de furos em círculo, a O1612.",
"O foco são as contas: como a macro acha sozinha a posição de cada furo."
],
"c1.k1": "MACRO DE",
"c1.k2": "FUROS EM CÍRCULO",
"c2.t": "Programa principal: as letras",
"c2.s": [
"No programa principal, a linha G65 P1612 chama a macro e passa as medidas.",
"X e Y: centro do círculo. J: diâmetro, {J}. B: {B} furos. A: primeiro furo a {A} graus.",
"H0: furar. W e Z: topo e fundo. R: plano de segurança. Q: bicada. F: avanço.",
"Cada letra vira uma variável: J vira #5, B vira #2 e A vira #1. Agora, a macro por dentro."
],
"c2.nX": "centro X", "c2.nY": "centro Y", "c2.nJ": "diâmetro", "c2.nB": "nº de furos", "c2.nA": "1º furo (°)", "c2.nH": "operação",
"c2.nW": "topo", "c2.nZ": "fundo", "c2.nR": "segurança", "c2.nQ": "bicada", "c2.nF": "avanço",
"c3.t": "Primeiro: a conferência",
"c3.s": [
"A primeira linha da macro é uma conferência.",
"Se B for menor que 1, não existe furo para fazer, e o alarme 111 para a máquina.",
"Aqui B é {B}. 12 não é menor que 1, então a macro segue."
],
"c3.alm": "alarme 111",
"c3.no": "falso → segue",
"c4.t": "Conta 1: o raio",
"c4.s": [
"Agora a primeira conta: o raio do círculo.",
"#27 recebe #5 dividido por 2. E #5 é o J, o diâmetro do círculo: {J}.",
"{J} dividido por 2 dá {r}. Esse é o raio: a distância do centro até cada furo.",
"Atenção: J é o diâmetro. Se colocar o raio no J, os furos saem na metade da distância."
],
"c4.warn": "raio no J = furos na metade!",
"c5.t": "Conta 2: ângulo entre furos",
"c5.s": [
"Segunda conta: o ângulo entre um furo e o próximo.",
"Uma volta completa tem 360 graus. A macro divide pela quantidade de furos: 360 dividido por #2.",
"360 dividido por {B} dá {step}. Então, a cada {step} graus tem um furo.",
"E #29 começa valendo 1. Ele é o contador: diz em qual furo a macro está."
],
"c5.cnt": "contador",
"c6.t": "N10: o ângulo de cada furo",
"c6.s": [
"O N10 é onde começa cada furo. A primeira conta é o ângulo dele.",
"#30 é o ângulo do primeiro furo, mais quantos furos já passaram, vezes {step}.",
"No furo 1: {A} mais 1 menos 1, que é zero, vezes {step}. Fica {A} graus.",
"No furo 2: {A} mais 1 vez {step}. Dá {a2} graus.",
"No furo 3: {A} mais 2 vezes {step}: {a3} graus. Sempre a partir do X positivo, no sentido anti-horário."
],
"c7.t": "Conta 3: o X com o cosseno",
"c7.s": [
"Com o ângulo, a macro acha o X do furo usando o cosseno.",
"Pense no raio como uma régua inclinada a {A} graus. O cosseno diz quanto dessa régua fica deitado, na direção X.",
"O cosseno de {A} graus é {cos1}. Então {r} vezes {cos1} dá {x1}.",
"Somando o centro X, que é zero, #31 fica {x1}."
],
"c7.lay": "quanto do raio fica deitado em X?",
"c8.t": "Conta 4: o Y com o seno",
"c8.s": [
"O Y é igual, mas com o seno: quanto da régua fica em pé, na direção Y.",
"O seno de {A} graus é {sin1}. {r} vezes {sin1} dá {y1}.",
"Somando o centro Y, que é zero, #32 fica {y1}. Pronto: a posição do furo 1."
],
"c9.t": "O sinal vem sozinho",
"c9.s": [
"E quando o furo fica do outro lado do centro? Veja o furo 4, a {a4} graus.",
"O cosseno de {a4} graus é negativo: {cos4}. Então o X dá {x4}, à esquerda do centro.",
"A macro não precisa de IF para isso. O seno e o cosseno já trazem o sinal certo em cada lado."
],
"c10.t": "A linha que a máquina executa",
"c10.s": [
"Com X e Y prontos, o H escolhe a operação. H0 é furar, H1 chama a hélice e H2 chama a rosca.",
"Com H0 e Q maior que zero, a macro vai para o N15: G83, furação com bicada.",
"Na hora de executar, cada variável vira número. X#31 vira X{g:x1c}, Y#32 vira Y{g:y1c}, e o R fica 0 mais 5: R5.",
"A broca desce {Q} milímetros por vez, sobe para tirar o cavaco e volta, até Z{g:Z}."
],
"c10.o0": "furar (G81 / G83)",
"c10.o1": "hélice → G65 P1613",
"c10.o2": "rosca → G65 P1619",
"c10.peck": "bicada {a} de {b}",
"c11.t": "N40: o próximo furo",
"c11.s": [
"No N40, a macro pergunta: #29 já chegou em B? 1 é maior ou igual a {B}? Não.",
"Então #29 recebe #29 mais 1. O contador vai para 2, e o GOTO 10 volta para o começo.",
"Tudo se repete: novo ângulo, novo X e Y, nova furação. Furo por furo, até o último.",
"No furo {B}, a resposta é sim, e a macro pula para o N50."
],
"c12.t": "N50: fim da macro",
"c12.s": [
"No N50, o G80 cancela o ciclo de furação, para a máquina não furar no próximo movimento.",
"O G98 volta ao padrão, e o M99 volta para o programa principal."
],
"c12.g80": "cancela o ciclo de furação",
"c12.g98": "volta ao padrão\n(retorno ao Z inicial)",
"c12.m99": "volta ao programa\nprincipal",
"c13.t": "Resumo das contas",
"c13.s": [
"Resumindo as contas: raio, ângulo entre furos, ângulo de cada furo, e o X e o Y com cosseno e seno.",
"Na primeira peça, teste com W50 e Z49: a broca faz tudo no ar.",
"E simule antes no app Macro CNC. Até a próxima macro!"
],
"c13.r1": "raio", "c13.r2": "ângulo entre furos", "c13.r3": "ângulo do furo", "c13.r4": "X do furo", "c13.r5": "Y do furo", "c13.r6": "próximo furo",
"c13.first": "Primeira peça",
"c13.air": "a broca faz tudo 50 mm acima",
"c13.sim": "Simule no app",
"c13.path": "Macro CNC → Programas → Furos em círculo"
};
Object.assign(window.STR, {
"c1.v": ["Nesta aula, vamos ver por dentro a macro de furos em círculo, a O dezesseis doze.", "O foco são as contas: como a macro acha sozinha a posição de cada furo."],
"c2.v": ["No programa principal, a linha G sessenta e cinco P dezesseis doze chama a macro e passa as medidas.", "X e Y: centro do círculo. J: diâmetro, trezentos e setenta e cinco. B: doze furos. A: primeiro furo a quinze graus.", "H zero: furar. W e Z: topo e fundo. R: plano de segurança. Q: bicada. F: avanço.", "Cada letra vira uma variável: J vira a variável cinco, B vira a dois, e A vira a um. Agora, a macro por dentro."],
"c3.v": ["A primeira linha da macro é uma conferência.", "Se B for menor que um, não existe furo para fazer, e o alarme cento e onze para a máquina.", "Aqui B é doze. Doze não é menor que um, então a macro segue."],
"c4.v": ["Agora a primeira conta: o raio do círculo.", "A variável vinte e sete recebe a variável cinco dividida por dois. E a cinco é o J, o diâmetro do círculo: trezentos e setenta e cinco.", "Trezentos e setenta e cinco dividido por dois dá cento e oitenta e sete e meio. Esse é o raio: a distância do centro até cada furo.", "Atenção: J é o diâmetro. Se colocar o raio no J, os furos saem na metade da distância."],
"c5.v": ["Segunda conta: o ângulo entre um furo e o próximo.", "Uma volta completa tem trezentos e sessenta graus. A macro divide pela quantidade de furos: trezentos e sessenta dividido pela variável dois.", "Trezentos e sessenta dividido por doze dá trinta. Então, a cada trinta graus tem um furo.", "E a variável vinte e nove começa valendo um. Ela é o contador: diz em qual furo a macro está."],
"c6.v": ["O N dez é onde começa cada furo. A primeira conta é o ângulo dele.", "A variável trinta é o ângulo do primeiro furo, mais quantos furos já passaram, vezes trinta.", "No furo um: quinze, mais um menos um, que é zero, vezes trinta. Fica quinze graus.", "No furo dois: quinze, mais uma vez trinta. Dá quarenta e cinco graus.", "No furo três: quinze, mais duas vezes trinta: setenta e cinco graus. Sempre a partir do X positivo, no sentido anti-horário."],
"c7.v": ["Com o ângulo, a macro acha o X do furo usando o cosseno.", "Pense no raio como uma régua inclinada a quinze graus. O cosseno diz quanto dessa régua fica deitado, na direção X.", "O cosseno de quinze graus é zero vírgula nove meia meia. Então cento e oitenta e sete e meio vezes zero vírgula nove meia meia dá cento e oitenta e um vírgula onze.", "Somando o centro X, que é zero, a variável trinta e um fica cento e oitenta e um vírgula onze."],
"c8.v": ["O Y é igual, mas com o seno: quanto da régua fica em pé, na direção Y.", "O seno de quinze graus é zero vírgula dois cinco nove. Cento e oitenta e sete e meio vezes zero vírgula dois cinco nove dá quarenta e oito vírgula cinquenta e três.", "Somando o centro Y, que é zero, a variável trinta e dois fica quarenta e oito vírgula cinquenta e três. Pronto: a posição do furo um."],
"c9.v": ["E quando o furo fica do outro lado do centro? Veja o furo quatro, a cento e cinco graus.", "O cosseno de cento e cinco graus é negativo: menos zero vírgula dois cinco nove. Então o X dá menos quarenta e oito vírgula cinquenta e três, à esquerda do centro.", "A macro não precisa de IF para isso. O seno e o cosseno já trazem o sinal certo em cada lado."],
"c10.v": ["Com X e Y prontos, o H escolhe a operação. H zero é furar, H um chama a hélice e H dois chama a rosca.", "Com H zero e Q maior que zero, a macro vai para o N quinze: G oitenta e três, furação com bicada.", "Na hora de executar, cada variável vira número. X trinta e um vira X cento e oitenta e um vírgula um um um, Y trinta e dois vira Y quarenta e oito vírgula cinco dois nove, e o R fica zero mais cinco: R cinco.", "A broca desce oito milímetros por vez, sobe para tirar o cavaco e volta, até Z menos trinta."],
"c11.v": ["No N quarenta, a macro pergunta: a variável vinte e nove já chegou em B? Um é maior ou igual a doze? Não.", "Então a vinte e nove recebe ela mesma mais um. O contador vai para dois, e o GOTO dez volta para o começo.", "Tudo se repete: novo ângulo, novo X e Y, nova furação. Furo por furo, até o último.", "No furo doze, a resposta é sim, e a macro pula para o N cinquenta."],
"c12.v": ["No N cinquenta, o G oitenta cancela o ciclo de furação, para a máquina não furar no próximo movimento.", "O G noventa e oito volta ao padrão, e o M noventa e nove volta para o programa principal."],
"c13.v": ["Resumindo as contas: raio, ângulo entre furos, ângulo de cada furo, e o X e o Y com cosseno e seno.", "Na primeira peça, teste com W cinquenta e Z quarenta e nove: a broca faz tudo no ar.", "E simule antes no app Macro CNC. Até a próxima macro!"]
});
