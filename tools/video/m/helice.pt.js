window.LANG = "pt";
window.STR = {
"and": "e", "turn": "volta",
"hdr": "O1613 · FURO EM HÉLICE",
"codeTitle": "O1613 — macro",
"mainTitle": "O0013 — programa principal",
"mainComment": "FURO FRESADO EM HELICE - O1613",
"side": "vista de lado",
"c1.t": "As contas da macro",
"c1.s": [
"Nesta aula, vamos ver por dentro a macro de furo fresado em hélice, a O1613.",
"Com uma fresa menor, ela abre um furo maior descendo em espiral, volta por volta."
],
"c1.k1": "MACRO DE",
"c1.k2": "FURO EM HÉLICE",
"c2.t": "Programa principal: as letras",
"c2.s": [
"No programa principal, a linha G65 P1613 chama a macro e passa as medidas.",
"X e Y: centro do furo. D: diâmetro do furo, {D}. T: diâmetro da fresa, {T}.",
"W: topo. Z: fundo do furo, {Z}. K: quanto desce em cada volta, {K}.",
"R: plano de segurança. F: avanço.",
"D vira #7, T vira #20 e K vira #6. Agora, a macro por dentro."
],
"c2.nX": "centro X", "c2.nY": "centro Y", "c2.nD": "Ø do furo", "c2.nT": "Ø da fresa", "c2.nW": "topo", "c2.nZ": "fundo",
"c2.nK": "desce/volta", "c2.nR": "segurança", "c2.nF": "avanço",
"c3.t": "Conta 1: o raio da trajetória",
"c3.s": [
"A primeira conta é a mais importante: por onde anda o centro da fresa.",
"A fresa tem {T} de diâmetro e precisa encostar na parede do furo, que tem {D}.",
"Então #100 é o furo menos a fresa, dividido por 2: {D} menos {T} dá {dt}, dividido por 2 dá {rp}.",
"O centro da fresa anda num círculo pequeno, de raio {rp}. E a borda da fresa corta o furo de {D}."
],
"c3.path": "o centro anda no círculo de raio {rp}",
"c4.t": "Por que D menor que 2 vezes T",
"c4.s": [
"Um cuidado: o furo tem que ser menor que duas vezes a fresa.",
"Aqui, {D} é menor que {d2}. A fresa passa por cima do centro e não sobra nada no meio.",
"Se o furo for maior que isso, fica um pino de material no centro."
],
"c4.ok": "a fresa cobre o centro",
"c4.core": "D ≥ 2 × T → sobra um pino no centro",
"c5.t": "Folga e conferências",
"c5.s": [
"#107 vale 0,5: é quanto a fresa se afasta da parede antes de subir.",
"Depois, três conferências: furo menor ou igual à fresa dá o alarme 121. K zero, alarme 122. Z acima do topo, alarme 123.",
"Com os dados certos, a macro segue."
],
"c5.off": "afasta da parede antes de subir",
"c5.q1": "furo ≤ fresa?", "c5.q2": "K zero ou negativo?", "c5.q3": "Z acima do topo?",
"c5.ok": "✓ dados OK → segue",
"c6.t": "Aproximação",
"c6.s": [
"A fresa vai em rápido para o centro do furo e desce até o plano de segurança: Z{g:safe}.",
"Depois anda em X até o raio da trajetória: X mais #100, ou seja, X{g:xp}.",
"E desce em avanço até o topo da peça, Z{g:W}. Agora começa a hélice."
],
"c7.t": "N10: uma volta da hélice",
"c7.s": [
"#104 guarda onde a volta começa: no topo, zero.",
"No N10, #103 é onde a volta termina: #104 menos K. Zero menos {K} dá {z1}.",
"O G3 dá uma volta completa no sentido anti-horário. Termina no mesmo X e Y, mas o Z desceu {K}. Isso é a hélice.",
"O I é a distância do ponto de partida até o centro: menos #100, I-{g:rp}."
],
"c8.t": "N10 de novo: volta por volta",
"c8.s": [
"Depois da volta, #104 recebe #103. Se ainda não chegou no fundo, o GOTO 10 faz outra volta.",
"Zero, {z1}, {z2}, e assim por diante: {K} milímetros por volta.",
"São {nfull} voltas cheias até Z{g:zl}.",
"A próxima seria {znext}, que passa do fundo. O IF trava em {Z}: a última volta desce só {last}."
],
"c9.t": "Volta final, afasta e sobe",
"c9.s": [
"No fundo, a macro dá mais uma volta sem descer. Ela limpa a rampa que a hélice deixou no fundo.",
"Depois, a fresa se afasta {off} da parede: X mais #100 menos #107, X{g:xr}.",
"Assim ela sobe em rápido sem riscar a parede, e o M99 volta para o programa principal."
],
"c9.floor": "volta sem descer: limpa o fundo",
"c9.up": "sobe sem encostar na parede",
"c10.t": "Resumo das contas",
"c10.s": [
"Resumindo: raio da trajetória, aproximação, cada volta desce K, o IF trava no fundo, volta final e afasta.",
"Na primeira peça, teste com W50 e Z49: a fresa faz tudo no ar.",
"E simule antes no app Macro CNC. Até a próxima macro!"
],
"c10.r1": "raio da trajetória", "c10.r2": "sem pino no centro", "c10.r3": "aproximação", "c10.r4": "cada volta desce K", "c10.r5": "uma volta da hélice", "c10.r6": "afasta antes de subir",
"c10.first": "Primeira peça",
"c10.air": "a fresa faz tudo 50 mm acima",
"c10.sim": "Simule no app",
"c10.path": "Macro CNC → Programas → Furo em hélice"
};
Object.assign(window.STR, {
"c1.v": ["Nesta aula, vamos ver por dentro a macro de furo fresado em hélice, a O dezesseis treze.", "Com uma frésa menor, ela abre um furo maior descendo em espiral, volta por volta."],
"c2.v": ["No programa principal, a linha G sessenta e cinco P dezesseis treze chama a macro e passa as medidas.", "X e Y: centro do furo. D: diâmetro do furo, trinta e cinco. T: diâmetro da frésa, vinte.", "W: topo. Z: fundo do furo, menos vinte e cinco vírgula quatro. K: quanto desce em cada volta, dois.", "R: plano de segurança. F: avanço.", "D vira a variável sete, T vira a vinte, e K vira a seis. Agora, a macro por dentro."],
"c3.v": ["A primeira conta é a mais importante: por onde anda o centro da frésa.", "A frésa tem vinte de diâmetro e precisa encostar na parede do furo, que tem trinta e cinco.", "Então a variável cem é o furo menos a frésa, dividido por dois: trinta e cinco menos vinte dá quinze, dividido por dois dá sete e meio.", "O centro da frésa anda num círculo pequeno, de raio sete e meio. E a borda da frésa corta o furo de trinta e cinco."],
"c4.v": ["Um cuidado: o furo tem que ser menor que duas vezes a frésa.", "Aqui, trinta e cinco é menor que quarenta. A frésa passa por cima do centro e não sobra nada no meio.", "Se o furo for maior que isso, fica um pino de material no centro."],
"c5.v": ["A variável cento e sete vale zero vírgula cinco: é quanto a frésa se afasta da parede antes de subir.", "Depois, três conferências: furo menor ou igual à frésa dá o alarme cento e vinte e um. K zero, alarme cento e vinte e dois. Z acima do topo, alarme cento e vinte e três.", "Com os dados certos, a macro segue."],
"c6.v": ["A frésa vai em rápido para o centro do furo e desce até o plano de segurança: Z cinco.", "Depois anda em X até o raio da trajetória: X mais a variável cem, ou seja, X sete e meio.", "E desce em avanço até o topo da peça, Z zero. Agora começa a hélice."],
"c7.v": ["A variável cento e quatro guarda onde a volta começa: no topo, zero.", "No N dez, a variável cento e três é onde a volta termina: cento e quatro menos K. Zero menos dois dá menos dois.", "O G três dá uma volta completa no sentido anti-horário. Termina no mesmo X e Y, mas o Z desceu dois. Isso é a hélice.", "O I é a distância do ponto de partida até o centro: menos a variável cem, I menos sete e meio."],
"c8.v": ["Depois da volta, a cento e quatro recebe a cento e três. Se ainda não chegou no fundo, o GOTO dez faz outra volta.", "Zero, menos dois, menos quatro, e assim por diante, dois milímetros por volta.", "São doze voltas cheias até Z menos vinte e quatro.", "A próxima seria menos vinte e seis, que passa do fundo. O IF trava em menos vinte e cinco vírgula quatro: a última volta desce só um vírgula quatro."],
"c9.v": ["No fundo, a macro dá mais uma volta sem descer. Ela limpa a rampa que a hélice deixou no fundo.", "Depois, a frésa se afasta meio milímetro da parede: X mais a cem menos a cento e sete, X sete.", "Assim ela sobe em rápido sem riscar a parede, e o M noventa e nove volta para o programa principal."],
"c10.v": ["Resumindo: raio da trajetória, aproximação, cada volta desce K, o IF trava no fundo, volta final e afasta.", "Na primeira peça, teste com W cinquenta e Z quarenta e nove: a frésa faz tudo no ar.", "E simule antes no app Macro CNC. Até a próxima macro!"]
});
