window.LANG = "pt";
window.STR = {
"and": "e",
"hdr": "O1612 · FUROS EM CÍRCULO",
"codeTitle": "O1612 — macro",
"dro": "ABSOLUTA",
"side": "vista de lado",
"c1.t": "Passo a passo da macro",
"c1.s": [
"Hoje vamos entender, bloco a bloco, a macro de furos em círculo, a O1612.",
"Ela distribui os furos por igual no círculo e fura cada um, sem você calcular nenhuma coordenada."
],
"c1.k1": "MACRO DE",
"c1.k2": "FUROS EM CÍRCULO",
"c2.t": "As letras do G65",
"c2.s": [
"O programa principal chama a macro com G65 P1612 e as letras.",
"X e Y são o centro do círculo. J é o diâmetro do círculo: {J}.",
"B é a quantidade de furos: {B}. A é o ângulo do primeiro furo: {A} graus.",
"H escolhe a operação. H0 é furar.",
"W é o topo, Z é o fundo do furo e R é o plano de segurança.",
"Q é a bicada e F é o avanço."
],
"c2.names": [
"Centro do círculo",
"Diâmetro do círculo",
"Quantidade de furos",
"Ângulo do 1º furo",
"Operação (0 = furar)",
"Topo da peça",
"Fundo do furo",
"Plano segurança",
"Bicada",
"Avanço"
],
"c3.t": "Bloco 1: alarme e raio",
"c3.s": [
"Primeiro, a macro confere o B. Menos de um furo dá o alarme 111.",
"Depois, o raio: J dividido por 2. {J} dividido por 2 dá {r}.",
"Cuidado: J é o diâmetro do círculo, não o raio."
],
"c3.alm": "alarme 111",
"c3.warn": "J = diâmetro, não raio!",
"c4.t": "Bloco 2: ângulo entre furos",
"c4.s": [
"Agora, o ângulo entre um furo e o próximo.",
"É 360 dividido por B. Com {B} furos, dá {step} graus.",
"E #29 é o contador: começa no furo 1."
],
"c5.t": "N10: o ângulo de cada furo",
"c5.s": [
"N10 é o começo de cada furo. Primeiro, o ângulo deste furo.",
"É o ângulo do primeiro, mais o número do furo menos um, vezes {step}.",
"Furo 1: {A} graus. Furo 2: {a2} graus. Furo 3: {a3} graus.",
"O ângulo conta a partir do X positivo, no sentido anti-horário."
],
"c5.ccw": "a partir do X+, anti-horário",
"c6.t": "X e Y com seno e cosseno",
"c6.s": [
"Com o ângulo, a macro acha o X e o Y do furo.",
"X é o centro mais o raio vezes o cosseno do ângulo.",
"Y é o centro mais o raio vezes o seno.",
"No furo 1, dá X{g:x1} e Y{g:y1}. A máquina faz a conta sozinha."
],
"c7.t": "H escolhe a operação",
"c7.s": [
"Agora o H decide o que fazer em cada furo.",
"H0 fura com ciclo fixo. H1 chama a macro de hélice, a O1613.",
"H2 chama a macro de rosca, a O1619. É macro dentro de macro."
],
"c7.o0": "furar (ciclo fixo)",
"c7.o1": "fresar o furo em hélice",
"c7.o2": "rosca fresada",
"c7.nest": "macro dentro de macro",
"c8.t": "H0: G81 ou G83 com bicada",
"c8.s": [
"Com H0, a macro olha o Q.",
"Q zero fura direto com G81. Q maior que zero usa G83, com bicada.",
"Aqui Q é {Q}: a broca desce {Q} milímetros, sobe para tirar o cavaco e volta, até Z{g:Z}.",
"O G99 faz a broca voltar para o plano R entre os furos, {safe} milímetros acima do topo."
],
"c8.back": "volta ao R",
"c9.t": "N40: próximo furo",
"c9.s": [
"N40: era o último furo? Se #29 já chegou em B, pula para o fim.",
"Se não, soma 1 no contador, e o GOTO 10 volta para o próximo furo.",
"Os ângulos ficam {A}, {a2}, {a3} graus, e assim por diante, até {alast}.",
"O último fica {step} graus antes do primeiro: nenhum furo se repete."
],
"c10.t": "N50: fim da macro",
"c10.s": [
"N50: o G80 cancela o ciclo fixo, para ele não furar nos próximos movimentos.",
"O G98 volta ao padrão, e o M99 volta para o programa principal."
],
"c10.g80": "cancela o ciclo fixo\n(não fura mais)",
"c10.g98": "volta ao padrão\n(retorno ao Z inicial)",
"c10.m99": "volta ao programa\nprincipal",
"c11.t": "Resumo e dica de segurança",
"c11.s": [
"Resumindo: raio, ângulo entre furos, ângulo de cada furo, X e Y, operação e o laço.",
"Na primeira vez, teste com W50 e Z49: a broca faz tudo no ar.",
"E simule antes no app Macro CNC. Até a próxima macro!"
],
"c11.res": [
"Raio = J / 2",
"Ângulo entre furos = 360 / B",
"Ângulo de cada furo",
"X = R·COS, Y = R·SIN",
"H escolhe: furar, hélice, rosca",
"N40: próximo furo, M99"
],
"c11.first": "Primeira peça",
"c11.air": "a broca faz tudo 50 mm acima",
"c11.sim": "Simule no app",
"c11.path": "Macro CNC → Programas → Furos em círculo"
};
Object.assign(window.STR, {
"c1.v": ["Hoje vamos entender, bloco a bloco, a macro de furos em círculo, a O dezesseis doze.", "Ela distribui os furos por igual no círculo e fura cada um, sem você calcular nenhuma coordenada."],
"c2.v": ["O programa principal chama a macro com G sessenta e cinco P dezesseis doze e as letras.", "X e Y são o centro do círculo. J é o diâmetro do círculo: trezentos e setenta e cinco.", "B é a quantidade de furos: doze. A é o ângulo do primeiro furo: quinze graus.", "H escolhe a operação. H zero é furar.", "W é o topo, Z é o fundo do furo e R é o plano de segurança.", "Q é a bicada e F é o avanço."],
"c3.v": ["Primeiro, a macro confere o B. Menos de um furo dá o alarme cento e onze.", "Depois, o raio: J dividido por dois. Trezentos e setenta e cinco dividido por dois dá cento e oitenta e sete e meio.", "Cuidado: J é o diâmetro do círculo, não o raio."],
"c4.v": ["Agora, o ângulo entre um furo e o próximo.", "É trezentos e sessenta dividido por B. Com doze furos, dá trinta graus.", "E a variável vinte e nove é o contador: começa no furo um."],
"c5.v": ["N dez é o começo de cada furo. Primeiro, o ângulo deste furo.", "É o ângulo do primeiro, mais o número do furo menos um, vezes trinta.", "Furo um: quinze graus. Furo dois: quarenta e cinco graus. Furo três: setenta e cinco graus.", "O ângulo conta a partir do X positivo, no sentido anti-horário."],
"c6.v": ["Com o ângulo, a macro acha o X e o Y do furo.", "X é o centro mais o raio vezes o cosseno do ângulo.", "Y é o centro mais o raio vezes o seno.", "No furo um, dá X cento e oitenta e um vírgula onze, e Y quarenta e oito vírgula cinquenta e três. A máquina faz a conta sozinha."],
"c7.v": ["Agora o H decide o que fazer em cada furo.", "H zero fura com ciclo fixo. H um chama a macro de hélice, a O dezesseis treze.", "H dois chama a macro de rosca, a O dezesseis dezenove. É macro dentro de macro."],
"c8.v": ["Com H zero, a macro olha o Q.", "Q zero fura direto com G oitenta e um. Q maior que zero usa G oitenta e três, com bicada.", "Aqui Q é oito: a broca desce oito milímetros, sobe para tirar o cavaco e volta, até Z menos trinta.", "O G noventa e nove faz a broca voltar para o plano R entre os furos, cinco milímetros acima do topo."],
"c9.v": ["N quarenta: era o último furo? Se a variável vinte e nove já chegou em B, pula para o fim.", "Se não, soma um no contador, e o GOTO dez volta para o próximo furo.", "Os ângulos ficam quinze, quarenta e cinco, setenta e cinco graus, e assim por diante, até trezentos e quarenta e cinco.", "O último fica trinta graus antes do primeiro: nenhum furo se repete."],
"c10.v": ["N cinquenta: o G oitenta cancela o ciclo fixo, para ele não furar nos próximos movimentos.", "O G noventa e oito volta ao padrão, e o M noventa e nove volta para o programa principal."],
"c11.v": ["Resumindo: raio, ângulo entre furos, ângulo de cada furo, X e Y, operação e o laço.", "Na primeira vez, teste com W cinquenta e Z quarenta e nove: a broca faz tudo no ar.", "E simule antes no app Macro CNC. Até a próxima macro!"]
});
