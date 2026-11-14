/* Biblioteca de programas do operador (D1250) e regras do padrão.
 * Gerado a partir dos documentos "Macros FANUC - programas aprovados e regras" e
 * "Regras e programas FANUC do operador (D1250)". */
window.PROGRAMS = [
 {
  "id": "m-face",
  "cat": "macro",
  "num": 1,
  "title": "Faceamento",
  "status": "aprovado",
  "desc": "Faceia uma área retangular em linhas, descendo K a cada passe.",
  "main": "%\nO0001 (FACEAMENTO - O1611) ;\nG21 G40 G90 G94 ;\nG54 ;\nT10 ;\nM6 ;\nG0 X0 Y0 ;\nS1200 M3 ;\nG43 H10 Z120. ;\nM8 ;\nG65 P1611 X215. Y215. W0 Z-2.5 K2.5 T50. Q30. A5. R25. F1150. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1611,
    "label": "Origem no canto da área",
    "code": "%\nO1611 (MACRO FACEAMENTO - CHAMADA POR G65 P1611) ;\n(ORIGEM X0 Y0 NO CANTO DA AREA - AREA PARA +X E +Y) ;\n(LETRAS DO G65 P1611) ;\n(X = COMPRIMENTO DA AREA EM X) ;\n(Y = COMPRIMENTO DA AREA EM Y) ;\n(W = Z INICIAL - TOPO DO BRUTO) ;\n(Z = Z FINAL - COTA ACABADA) ;\n(K = PROFUNDIDADE DE CADA PASSE EM Z) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(Q = PASSO LATERAL EM Y - NAO MAIOR QUE T) ;\n(A = ULTRAPASSAGEM EM X ALEM DA BORDA) ;\n(R = PLANO DE SEGURANCA ACIMA DA SUPERFICIE) ;\n(F = AVANCO DE CORTE MM/MIN) ;\n(EXEMPLO - G65 P1611 X215. Y215. W0 Z-2.5 K2.5 T50. Q30. A5. R25. F1150.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X AREA EM X) ;\n(#25 = Y AREA EM Y) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K PASSE EM Z) ;\n(#20 = T DIAMETRO FERRAMENTA) ;\n(#17 = Q PASSO EM Y) ;\n(#1 = A ULTRAPASSAGEM EM X) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DA FERRAMENTA) ;\n(#101 = X ESQUERDO - CENTRO DA FERRAMENTA FORA DA PECA) ;\n(#107 = X DIREITO - CENTRO DA FERRAMENTA FORA DA PECA) ;\n(#102 = Y DA PRIMEIRA LINHA) ;\n(#108 = Y DA ULTIMA LINHA) ;\n(#103 = Z DO PASSE ATUAL) ;\n(#104 = Z DA SUPERFICIE ANTES DO PASSE) ;\n(#105 = Y ATUAL) ;\n(#106 = X ATUAL) ;\n(#109 = X DESTINO DA LINHA) ;\n(#110 = AUXILIAR PARA TROCAR #106 COM #109) ;\n#100 = #20 / 2 ;\n#101 = -[#100 + #1] ;\n#107 = #24 + #100 + #1 ;\n#102 = #100 ;\n#108 = #25 - #100 ;\n(SE A FERRAMENTA FOR MAIOR QUE A AREA EM Y - UMA LINHA NO MEIO) ;\nIF [#108 LT #102] THEN #102 = #25 / 2 ;\nIF [#108 LT #102] THEN #108 = #25 / 2 ;\n(ALARMES SE OS VALORES FOREM INVALIDOS) ;\nIF [#26 GE #23] THEN #3000 = 101 (Z FINAL MAIOR QUE W) ;\nIF [#6 LE 0] THEN #3000 = 102 (K INVALIDO) ;\nIF [#17 LE 0] THEN #3000 = 103 (Q INVALIDO) ;\nIF [#17 GT #20] THEN #3000 = 104 (Q MAIOR QUE T) ;\n#104 = #23 ;\n(N10 = INICIO DE CADA PASSE EM Z) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#106 = #101 ;\n#109 = #107 ;\n#105 = #102 ;\nG0 X#106 Y#105 ;\nG0 Z[#104 + #18] ;\nG1 Z#103 F#9 ;\n(N20 = INICIO DE CADA LINHA EM X) ;\nN20 G1 X#109 F#9 ;\n#110 = #106 ;\n#106 = #109 ;\n#109 = #110 ;\nIF [#105 GE #108] GOTO 30 ;\n#105 = #105 + #17 ;\nIF [#105 GT #108] THEN #105 = #108 ;\nG1 Y#105 ;\nGOTO 20 ;\n(N30 = FIM DO PASSE - SOBE E VERIFICA SE TERMINOU) ;\nN30 G0 Z[#103 + #18] ;\n#104 = #103 ;\nIF [#103 GT #26] GOTO 10 ;\nM99 ;\n%",
    "key": "1611-canto"
   },
   {
    "num": 1611,
    "label": "Origem no centro da área",
    "code": "%\nO1611 (MACRO FACEAMENTO - CHAMADA POR G65 P1611) ;\n(ORIGEM X0 Y0 NO CENTRO DA AREA) ;\n(LETRAS DO G65 P1611) ;\n(X = COMPRIMENTO DA AREA EM X) ;\n(Y = COMPRIMENTO DA AREA EM Y) ;\n(W = Z INICIAL - TOPO DO BRUTO) ;\n(Z = Z FINAL - COTA ACABADA) ;\n(K = PROFUNDIDADE DE CADA PASSE EM Z) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(Q = PASSO LATERAL EM Y - NAO MAIOR QUE T) ;\n(A = ULTRAPASSAGEM EM X ALEM DA BORDA) ;\n(R = PLANO DE SEGURANCA ACIMA DA SUPERFICIE) ;\n(F = AVANCO DE CORTE MM/MIN) ;\n(EXEMPLO - G65 P1611 X215. Y215. W0 Z-2.5 K2.5 T50. Q30. A5. R25. F1150.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X AREA EM X) ;\n(#25 = Y AREA EM Y) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K PASSE EM Z) ;\n(#20 = T DIAMETRO FERRAMENTA) ;\n(#17 = Q PASSO EM Y) ;\n(#1 = A ULTRAPASSAGEM EM X) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DA FERRAMENTA) ;\n(#101 = X DO CENTRO DA FERRAMENTA FORA DA PECA) ;\n(#102 = Y DA ULTIMA LINHA - A PRIMEIRA E NEGATIVA) ;\n(#103 = Z DO PASSE ATUAL) ;\n(#104 = Z DA SUPERFICIE ANTES DO PASSE) ;\n(#105 = Y ATUAL) ;\n(#106 = X ATUAL - TROCA DE SINAL A CADA LINHA) ;\n#100 = #20 / 2 ;\n#101 = #24 / 2 + #100 + #1 ;\n#102 = #25 / 2 - #100 ;\nIF [#102 LT 0] THEN #102 = 0 ;\n(ALARMES SE OS VALORES FOREM INVALIDOS) ;\nIF [#26 GE #23] THEN #3000 = 101 (Z FINAL MAIOR QUE W) ;\nIF [#6 LE 0] THEN #3000 = 102 (K INVALIDO) ;\nIF [#17 LE 0] THEN #3000 = 103 (Q INVALIDO) ;\nIF [#17 GT #20] THEN #3000 = 104 (Q MAIOR QUE T) ;\n#104 = #23 ;\n(N10 = INICIO DE CADA PASSE EM Z) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#106 = -#101 ;\n#105 = -#102 ;\nG0 X#106 Y#105 ;\nG0 Z[#104 + #18] ;\nG1 Z#103 F#9 ;\n(N20 = INICIO DE CADA LINHA EM X) ;\nN20 G1 X[-#106] F#9 ;\n#106 = -#106 ;\nIF [#105 GE #102] GOTO 30 ;\n#105 = #105 + #17 ;\nIF [#105 GT #102] THEN #105 = #102 ;\nG1 Y#105 ;\nGOTO 20 ;\n(N30 = FIM DO PASSE - SOBE E VERIFICA SE TERMINOU) ;\nN30 G0 Z[#103 + #18] ;\n#104 = #103 ;\nIF [#103 GT #26] GOTO 10 ;\nM99 ;\n%",
    "key": "1611-centro"
   }
  ],
  "subChoice": true,
  "notes": [
   "Existem dois subs O1611 (origem no canto ou no centro). Use só um na máquina.",
   "Q (passo lateral) não pode ser maior que T."
  ],
  "stockExpr": "({shape:'rect', lx:L.X, ly:L.Y, cx: CANTO ? L.X/2 : 0, cy: CANTO ? L.Y/2 : 0, top:L.W||0, bottom:(L.Z||0)-15, tool:L.T})"
 },
 {
  "id": "m-pcd",
  "cat": "macro",
  "num": 12,
  "title": "Furos em círculo (PCD)",
  "status": "aprovado",
  "desc": "B furos num círculo. H0 fura (G81, ou G83 com Q), H1 fresa cada furo em hélice (chama o O1613).",
  "main": "%\nO0012 (FUROS EM CIRCULO - O1612) ;\nG21 G40 G90 G94 ;\nG54 ;\nT11 ;\nM6 ;\nG0 X0 Y0 ;\nS800 M3 ;\nG43 H11 Z120. ;\nM8 ;\nG65 P1612 X0 Y0 J375. B12 A15. H0 W0 Z-30. R5. Q8. F150. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1612,
    "code": "%\nO1612 (MACRO FUROS EM CIRCULO PCD - CHAMADA POR G65 P1612) ;\n(LETRAS DO G65 P1612) ;\n(X Y = CENTRO DO CIRCULO) ;\n(J = DIAMETRO DO CIRCULO PCD) ;\n(B = NUMERO DE FUROS) ;\n(A = ANGULO DO PRIMEIRO FURO) ;\n(H = OPERACAO - 0 FURAR - 1 FRESAR FURO) ;\n(W = Z INICIAL) ;\n(Z = Z FINAL) ;\n(R = PLANO DE SEGURANCA) ;\n(Q = H0 BICADA - 0 SEM BICADA) ;\n(F = AVANCO) ;\n(D = H1 DIAMETRO DO FURO) ;\n(T = H1 DIAMETRO DA FRESA) ;\n(K = H1 DESCIDA POR VOLTA) ;\n(EXEMPLO - G65 P1612 X0 Y0 J375. B12 A15. H0 W0 Z-30. R5. Q8. F150.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X CENTRO X DO CIRCULO) ;\n(#25 = Y CENTRO Y DO CIRCULO) ;\n(#5 = J DIAMETRO DO CIRCULO PCD) ;\n(#2 = B NUMERO DE FUROS) ;\n(#1 = A ANGULO DO PRIMEIRO FURO) ;\n(#11 = H OPERACAO - 0 FURAR - 1 FRESAR FURO) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(#17 = Q BICADA - 0 = SEM BICADA) ;\n(LETRAS ENVIADAS PARA A OPERACAO H1) ;\n(#7 = D DIAMETRO DO FURO) ;\n(#20 = T DIAMETRO DA FERRAMENTA) ;\n(#6 = K DESCIDA POR VOLTA DO FURO FRESADO) ;\n(VARIAVEIS DE CALCULO - LOCAIS #27 A #33 - NAO SAO APAGADAS PELAS OUTRAS MACROS) ;\n(#27 = RAIO DO CIRCULO) ;\n(#28 = ANGULO ENTRE FUROS) ;\n(#29 = NUMERO DO FURO ATUAL) ;\n(#30 = ANGULO DO FURO ATUAL) ;\n(#31 = X DO FURO) ;\n(#32 = Y DO FURO) ;\nIF [#2 LT 1] THEN #3000 = 111 (B INVALIDO) ;\nIF [#11 GE 2] THEN #3000 = 112 (H INVALIDO) ;\n#27 = #5 / 2 ;\n#28 = 360 / #2 ;\n#29 = 1 ;\n(N10 = INICIO DE CADA FURO) ;\nN10 #30 = #1 + [#29 - 1] * #28 ;\n#31 = #24 + #27 * COS[#30] ;\n#32 = #25 + #27 * SIN[#30] ;\nIF [#11 GE 1] GOTO 20 ;\n(H0 = FURAR COM G81 OU G83) ;\nIF [#17 GT 0] GOTO 15 ;\nG99 G81 X#31 Y#32 Z#26 R[#23 + #18] F#9 ;\nGOTO 40 ;\nN15 G99 G83 X#31 Y#32 Z#26 R[#23 + #18] Q#17 F#9 ;\nGOTO 40 ;\n(H1 = FRESAR FURO - CHAMA O1613) ;\nN20 G65 P1613 X#31 Y#32 D#7 T#20 W#23 Z#26 K#6 R#18 F#9 ;\nGOTO 40 ;\n(N40 = PROXIMO FURO OU FIM) ;\nN40 IF [#29 GE #2] GOTO 50 ;\n#29 = #29 + 1 ;\nGOTO 10 ;\nN50 G80 ;\nG98 ;\nM99 ;\n%",
    "key": "1612"
   },
   {
    "num": 1613,
    "code": "%\nO1613 (MACRO FURO FRESADO EM HELICE - CHAMADA POR G65 P1613) ;\n(PARA FURO PRONTO OU D MENOR QUE 2 VEZES T - SENAO FICA UM NUCLEO NO CENTRO) ;\n(LETRAS DO G65 P1613) ;\n(X Y = CENTRO DO FURO) ;\n(D = DIAMETRO DO FURO) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(W = Z INICIAL) ;\n(Z = Z FINAL) ;\n(K = DESCIDA POR VOLTA) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO) ;\n(EXEMPLO - G65 P1613 X0 Y0 D35. T20. W0 Z-25.4 K2. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X CENTRO X DO FURO) ;\n(#25 = Y CENTRO Y DO FURO) ;\n(#7 = D DIAMETRO DO FURO) ;\n(#20 = T DIAMETRO DA FERRAMENTA) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K DESCIDA POR VOLTA) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DA TRAJETORIA DO CENTRO DA FERRAMENTA) ;\n(#103 = Z DO FIM DA VOLTA) ;\n(#104 = Z DO INICIO DA VOLTA) ;\n(#107 = QUANTO AFASTA DA PAREDE ANTES DE SUBIR) ;\n#100 = [#7 - #20] / 2 ;\n#107 = 0.5 ;\nIF [#100 LE 0] THEN #3000 = 121 (D MENOR OU IGUAL A T) ;\nIF [#6 LE 0] THEN #3000 = 122 (K INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 123 (Z FINAL MAIOR QUE W) ;\nG0 X#24 Y#25 ;\nG0 Z[#23 + #18] ;\nG0 X[#24 + #100] ;\nG1 Z#23 F#9 ;\n#104 = #23 ;\n(N10 = CADA VOLTA DA HELICE) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\nG3 X[#24 + #100] Y#25 Z#103 I[-#100] J0 F#9 ;\n#104 = #103 ;\nIF [#103 GT #26] GOTO 10 ;\n(VOLTA FINAL SEM DESCER - LIMPA O FUNDO) ;\nG3 X[#24 + #100] Y#25 I[-#100] J0 F#9 ;\nG1 X[#24 + #100 - #107] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1613"
   }
  ],
  "presets": [
   {
    "label": "H0 - furar 12 furos PCD 375",
    "call": "G65 P1612 X0 Y0 J375. B12 A15. H0 W0 Z-30. R5. Q8. F150."
   },
   {
    "label": "H1 - fresar 5 furos D20 com fresa D10",
    "call": "G65 P1612 X0 Y0 J100. B5 A90. H1 D20. T10. W0 Z-8. K2. R5. F500."
   }
  ],
  "notes": [
   "Para H1 é preciso ter o O1613 na máquina também."
  ],
  "stock": "round",
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:L.J + Math.max(60, 4*(L.D||L.T||10)), cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:(L.H==1 ? L.T : (L.T||10))})"
 },
 {
  "id": "m-helice",
  "cat": "macro",
  "num": 13,
  "title": "Furo fresado em hélice",
  "status": "aprovado",
  "desc": "Desce em hélice (G3) num furo pronto e dá uma volta plana no fundo. Raio da trajetória = (D - T) / 2.",
  "main": "%\nO0013 (FURO FRESADO EM HELICE - O1613) ;\nG21 G40 G90 G94 ;\nG54 ;\nT10 ;\nM6 ;\nG0 X0 Y0 ;\nS1200 M3 ;\nG43 H10 Z120. ;\nM8 ;\nG65 P1613 X0 Y0 D35. T20. W0 Z-25.4 K2. R5. F800. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1613,
    "code": "%\nO1613 (MACRO FURO FRESADO EM HELICE - CHAMADA POR G65 P1613) ;\n(PARA FURO PRONTO OU D MENOR QUE 2 VEZES T - SENAO FICA UM NUCLEO NO CENTRO) ;\n(LETRAS DO G65 P1613) ;\n(X Y = CENTRO DO FURO) ;\n(D = DIAMETRO DO FURO) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(W = Z INICIAL) ;\n(Z = Z FINAL) ;\n(K = DESCIDA POR VOLTA) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO) ;\n(EXEMPLO - G65 P1613 X0 Y0 D35. T20. W0 Z-25.4 K2. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X CENTRO X DO FURO) ;\n(#25 = Y CENTRO Y DO FURO) ;\n(#7 = D DIAMETRO DO FURO) ;\n(#20 = T DIAMETRO DA FERRAMENTA) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K DESCIDA POR VOLTA) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DA TRAJETORIA DO CENTRO DA FERRAMENTA) ;\n(#103 = Z DO FIM DA VOLTA) ;\n(#104 = Z DO INICIO DA VOLTA) ;\n(#107 = QUANTO AFASTA DA PAREDE ANTES DE SUBIR) ;\n#100 = [#7 - #20] / 2 ;\n#107 = 0.5 ;\nIF [#100 LE 0] THEN #3000 = 121 (D MENOR OU IGUAL A T) ;\nIF [#6 LE 0] THEN #3000 = 122 (K INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 123 (Z FINAL MAIOR QUE W) ;\nG0 X#24 Y#25 ;\nG0 Z[#23 + #18] ;\nG0 X[#24 + #100] ;\nG1 Z#23 F#9 ;\n#104 = #23 ;\n(N10 = CADA VOLTA DA HELICE) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\nG3 X[#24 + #100] Y#25 Z#103 I[-#100] J0 F#9 ;\n#104 = #103 ;\nIF [#103 GT #26] GOTO 10 ;\n(VOLTA FINAL SEM DESCER - LIMPA O FUNDO) ;\nG3 X[#24 + #100] Y#25 I[-#100] J0 F#9 ;\nG1 X[#24 + #100 - #107] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1613"
   }
  ],
  "notes": [
   "Aprovado chamado pelo H1 do O1612. O programa principal O0013 foi montado pelo app no padrão: confira T, H e S.",
   "Serve para furo pronto ou D menor que 2 vezes T; senão sobra um núcleo no centro."
  ],
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:Math.max(L.D*2.5, L.D+40), cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})"
 },
 {
  "id": "m-ret",
  "cat": "macro",
  "num": 16,
  "title": "Contorno externo retangular",
  "status": "aprovado",
  "desc": "Contorno externo em espiral (G2), descendo um pouco em cada lado; última volta plana no Z final.",
  "main": "%\nO0016 (CONTORNO EXTERNO RETANGULAR - O1616) ;\nG21 G40 G90 G94 ;\nG54 ;\nT10 ;\nM6 ;\nG0 X0 Y0 ;\nS1200 M3 ;\nG43 H10 Z120. ;\nM8 ;\nG65 P1616 X0 Y0 I100. J60. C5. T25. W0 Z-20. K2. A20. R5. F800. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1616,
    "code": "%\nO1616 (MACRO CONTORNO EXTERNO RETANGULAR EM ESPIRAL - CHAMADA POR G65 P1616) ;\n(DESCE EM Z A CADA VOLTA - SENTIDO HORARIO G2 - ULTIMA VOLTA SEM DESCER) ;\n(LETRAS DO G65 P1616) ;\n(X Y = CENTRO DA PECA) ;\n(I = COMPRIMENTO EM X) ;\n(J = LARGURA EM Y) ;\n(C = RAIO DO CANTO DA PECA - 0 = CANTO VIVO) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(W = Z INICIAL) ;\n(Z = Z FINAL) ;\n(K = DESCIDA EM Z A CADA VOLTA) ;\n(A = AFASTAMENTO DA ENTRADA - FORA DO BRUTO) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO) ;\n(EXEMPLO - G65 P1616 X0 Y0 I100. J60. C5. T25. W0 Z-20. K2. A20. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X CENTRO X DA PECA) ;\n(#25 = Y CENTRO Y DA PECA) ;\n(#4 = I COMPRIMENTO DA PECA EM X) ;\n(#5 = J LARGURA DA PECA EM Y) ;\n(#3 = C RAIO DO CANTO DA PECA - 0 = CANTO VIVO) ;\n(#20 = T DIAMETRO DA FERRAMENTA) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K DESCIDA EM Z A CADA VOLTA) ;\n(#1 = A AFASTAMENTO DA ENTRADA - FORA DO BRUTO) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = METADE X DA TRAJETORIA DO CENTRO DA FERRAMENTA) ;\n(#101 = METADE Y DA TRAJETORIA DO CENTRO DA FERRAMENTA) ;\n(#102 = RAIO DOS CANTOS DA TRAJETORIA) ;\n(#103 = Z NO FIM DA VOLTA) ;\n(#104 = Z NO INICIO DA VOLTA) ;\n(#105 = Z ATUAL DE CADA LADO) ;\n(#106 = QUANTO DESCE EM CADA LADO) ;\n#100 = #4 / 2 + #20 / 2 ;\n#101 = #5 / 2 + #20 / 2 ;\n#102 = #3 + #20 / 2 ;\nIF [#3 GT [#4 / 2]] THEN #3000 = 151 (C MAIOR QUE METADE DE I) ;\nIF [#3 GT [#5 / 2]] THEN #3000 = 152 (C MAIOR QUE METADE DE J) ;\nIF [#6 LE 0] THEN #3000 = 153 (K INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 154 (Z FINAL MAIOR QUE W) ;\n(ENTRADA PELO LADO DE CIMA - FORA DO BRUTO) ;\nG0 X[#24 - #100 + #102] Y[#25 + #101 + #1] ;\nG0 Z[#23 + #18] ;\nG1 Z#23 F#9 ;\nG1 Y[#25 + #101] F#9 ;\n#104 = #23 ;\n(N10 = INICIO DE CADA VOLTA) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#106 = [#104 - #103] / 4 ;\n#105 = #104 ;\n#105 = #105 - #106 ;\nG1 X[#24 + #100 - #102] Z#105 F#9 ;\nG2 X[#24 + #100] Y[#25 + #101 - #102] I0 J[-#102] ;\n#105 = #105 - #106 ;\nG1 Y[#25 - #101 + #102] Z#105 ;\nG2 X[#24 + #100 - #102] Y[#25 - #101] I[-#102] J0 ;\n#105 = #105 - #106 ;\nG1 X[#24 - #100 + #102] Z#105 ;\nG2 X[#24 - #100] Y[#25 - #101 + #102] I0 J#102 ;\n#105 = #105 - #106 ;\nG1 Y[#25 + #101 - #102] Z#105 ;\nG2 X[#24 - #100 + #102] Y[#25 + #101] I#102 J0 ;\n#104 = #103 ;\nIF [#106 GT 0] GOTO 10 ;\nG0 Z[#103 + #18] ;\nM99 ;\n%",
    "key": "1616"
   }
  ],
  "notes": [
   "C0 deixa canto vivo; a trajetória ainda faz arco T/2 no canto (normal)."
  ],
  "stockExpr": "({shape:'rect', lx:L.I+L.T, ly:L.J+L.T, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})"
 },
 {
  "id": "m-poli",
  "cat": "macro",
  "num": 17,
  "title": "Contorno externo de polígono",
  "status": "aprovado",
  "desc": "Quadrado, sextavado, oitavado... em espiral. D = diâmetro entre cantos = entre faces / COS[180 / B].",
  "main": "%\nO0017 (CONTORNO EXTERNO DE POLIGONO - O1617) ;\nG21 G40 G90 G94 ;\nG54 ;\nT10 ;\nM6 ;\nG0 X0 Y0 ;\nS1200 M3 ;\nG43 H10 Z120. ;\nM8 ;\nG65 P1617 X0 Y0 B6 D41.57 A0 E20. T25. W0 Z-17. K2. R5. F800. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1617,
    "code": "%\nO1617 (MACRO CONTORNO EXTERNO DE POLIGONO EM ESPIRAL - CHAMADA POR G65 P1617) ;\n(B LADOS - 4 QUADRADO - 6 SEXTAVADO - 8 OITAVADO - SENTIDO HORARIO G2) ;\n(LETRAS DO G65 P1617) ;\n(X Y = CENTRO DA PECA) ;\n(B = NUMERO DE LADOS) ;\n(D = DIAMETRO ENTRE CANTOS) ;\n(A = ANGULO DO PRIMEIRO CANTO - 0 = CANTO NO EIXO X) ;\n(E = AFASTAMENTO DA ENTRADA - FORA DO BRUTO) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(W = Z INICIAL) ;\n(Z = Z FINAL) ;\n(K = DESCIDA EM Z A CADA VOLTA) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO) ;\n(EXEMPLO - G65 P1617 X0 Y0 B6 D41.57 A0 E20. T25. W0 Z-17. K2. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X CENTRO X DA PECA) ;\n(#25 = Y CENTRO Y DA PECA) ;\n(#2 = B NUMERO DE LADOS) ;\n(#7 = D DIAMETRO ENTRE CANTOS - CIRCULO QUE PASSA PELOS CANTOS) ;\n(#1 = A ANGULO DO PRIMEIRO CANTO - 0 = CANTO NO EIXO X - 90 = CANTO NO EIXO Y) ;\n(#8 = E AFASTAMENTO DA ENTRADA - FORA DO BRUTO) ;\n(#20 = T DIAMETRO DA FERRAMENTA) ;\n(#23 = W Z INICIAL) ;\n(#26 = Z Z FINAL) ;\n(#6 = K DESCIDA EM Z A CADA VOLTA) ;\n(#18 = R PLANO DE SEGURANCA) ;\n(#9 = F AVANCO) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO ENTRE CANTOS) ;\n(#101 = RAIO DA FERRAMENTA) ;\n(#102 = ANGULO ENTRE CANTOS) ;\n(#103 = Z NO FIM DA VOLTA) ;\n(#104 = Z NO INICIO DA VOLTA) ;\n(#105 = Z ATUAL DE CADA LADO) ;\n(#106 = QUANTO DESCE EM CADA LADO) ;\n(#107 = NUMERO DO LADO ATUAL) ;\n(#108 = ANGULO DO CANTO NO INICIO DO LADO) ;\n(#109 = ANGULO DA NORMAL DO LADO - DIRECAO PARA FORA) ;\n(#110 = X DO PONTO DE ENTRADA) ;\n(#111 = Y DO PONTO DE ENTRADA) ;\n(#112 = ANGULO DO CANTO NO FIM DO LADO) ;\n(#113 = X DO CANTO NO FIM DO LADO) ;\n(#114 = Y DO CANTO NO FIM DO LADO) ;\n#100 = #7 / 2 ;\n#101 = #20 / 2 ;\n#102 = 360 / #2 ;\nIF [#2 LT 3] THEN #3000 = 161 (B MENOR QUE 3) ;\nIF [#6 LE 0] THEN #3000 = 162 (K INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 163 (Z FINAL MAIOR QUE W) ;\n#110 = #24 + #100 * COS[#1] + #101 * COS[#1 - #102 / 2] ;\n#111 = #25 + #100 * SIN[#1] + #101 * SIN[#1 - #102 / 2] ;\n(ENTRADA PERPENDICULAR AO PRIMEIRO LADO - FORA DO BRUTO) ;\nG0 X[#110 + #8 * COS[#1 - #102 / 2]] Y[#111 + #8 * SIN[#1 - #102 / 2]] ;\nG0 Z[#23 + #18] ;\nG1 Z#23 F#9 ;\nG1 X#110 Y#111 F#9 ;\n#104 = #23 ;\n(N10 = INICIO DE CADA VOLTA) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#106 = [#104 - #103] / #2 ;\n#105 = #104 ;\n#107 = 1 ;\n#108 = #1 ;\n(N20 = CADA LADO - LINHA E DEPOIS ARCO NO CANTO) ;\nN20 #109 = #108 - #102 / 2 ;\n#112 = #108 - #102 ;\n#113 = #24 + #100 * COS[#112] ;\n#114 = #25 + #100 * SIN[#112] ;\n#105 = #105 - #106 ;\nG1 X[#113 + #101 * COS[#109]] Y[#114 + #101 * SIN[#109]] Z#105 F#9 ;\nG2 X[#113 + #101 * COS[#109 - #102]] Y[#114 + #101 * SIN[#109 - #102]] I[-#101 * COS[#109]] J[-#101 * SIN[#109]] ;\n#108 = #112 ;\n#107 = #107 + 1 ;\nIF [#107 LE #2] GOTO 20 ;\n#104 = #103 ;\nIF [#106 GT 0] GOTO 10 ;\nG0 Z[#103 + #18] ;\nM99 ;\n%",
    "key": "1617"
   }
  ],
  "presets": [
   {
    "label": "Sextavado 36 entre faces (cantos no X)",
    "call": "G65 P1617 X0 Y0 B6 D41.57 A0 E20. T25. W0 Z-17. K2. R5. F800."
   },
   {
    "label": "Sextavado com cantos no Y (A30)",
    "call": "G65 P1617 X0 Y0 B6 D41.57 A30. E20. T25. W0 Z-17. K2. R5. F800."
   },
   {
    "label": "Quadrado lado 100 (D = L x 1,4142, A45)",
    "call": "G65 P1617 X0 Y0 B4 D141.42 A45. E20. T25. W0 Z-17. K2. R5. F800."
   }
  ],
  "notes": [
   "Sextavado de 36 entre faces: D41.57. Quadrado de lado L: D = L x 1,4142 com A45."
  ],
  "stock": "round",
  "stockExpr": "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-10, tool:L.T})"
 },
 {
  "id": "m-raio-concavo",
  "cat": "macro",
  "num": 23,
  "title": "Raio côncavo na aresta",
  "status": "aprovado",
  "desc": "Abre um raio côncavo (cava) na aresta, indo e voltando em X a cada passo de H graus. U1 = côncavo.",
  "main": "%\nO0023 (RAIO CONCAVO R15 - O1618) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS3000 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1618 X-165. I165. Y0 W0 C15. U1 V0 H1. T20. A15. R5. F3000. Q300. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1618,
    "code": "%\nO1618 (MACRO RAIO NA ARESTA - CONVEXO OU CONCAVO - CHAMADA POR G65 P1618) ;\n(FRESA DE TOPO RETA OU FRESA DE FACEAR COM CANTO VIVO) ;\n(A QUINA DE BAIXO DA FRESA DO LADO DA PECA TOCA A CURVA) ;\n(DESCE DE CIMA PARA BAIXO - CADA PASSADA AVANCA H GRAUS - VAI E VOLTA EM X) ;\n(CONVEXO = ARREDONDA A QUINA - CONCAVO = ABRE UMA CAVA NA QUINA) ;\n(LETRAS DO G65 P1618) ;\n(X = X ONDE COMECA A ARESTA - LADO DE MENOR X) ;\n(I = COMPRIMENTO DA ARESTA EM X) ;\n(Y = Y DA FACE ONDE FICA A ARESTA) ;\n(W = Z DO TOPO DA PECA) ;\n(C = RAIO R) ;\n(U = TIPO - 0 CONVEXO - 1 CONCAVO) ;\n(V = LADO - 0 FERRAMENTA NO LADO DE MENOR Y - 1 NO LADO DE MAIOR Y) ;\n(H = PASSO EM GRAUS A CADA PASSADA) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(A = FOLGA EM X ALEM DAS PONTAS) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO EM X) ;\n(Q = AVANCO DO MOVIMENTO Y Z - NAO INFORMADO USA O F) ;\n(EXEMPLO - G65 P1618 X-165. I165. Y0 W0 C15. U1 V0 H1. T20. A15. R5. F3000. Q300.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X X DA PONTA ESQUERDA DA ARESTA - MENOR X) ;\n(#4 = I COMPRIMENTO DA ARESTA EM X) ;\n(#25 = Y Y DA FACE ONDE FICA A ARESTA) ;\n(#23 = W Z DO TOPO DA PECA) ;\n(#3 = C RAIO DA CURVA) ;\n(#21 = U TIPO - 0 CONVEXO - 1 CONCAVO) ;\n(#22 = V LADO - 0 MATERIAL PARA +Y - 1 MATERIAL PARA -Y) ;\n(#11 = H PASSO EM GRAUS DE CADA PASSADA - EXEMPLO 1) ;\n(#20 = T DIAMETRO DA FRESA) ;\n(#1 = A FOLGA EM X ALEM DAS PONTAS DA ARESTA) ;\n(#18 = R PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F AVANCO DO CORTE EM X) ;\n(#17 = Q AVANCO DO DEGRAU EM Y E Z - 0 USA O F) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = LADO DA PECA EM Y - MAIS 1 OU MENOS 1) ;\n(#101 = X DO CENTRO DA FRESA NA PONTA ESQUERDA) ;\n(#102 = X DO CENTRO DA FRESA NA PONTA DIREITA) ;\n(#103 = ANGULO DA PASSADA ATUAL) ;\n(#104 = DISTANCIA DA FACE ATE A QUINA DA FRESA) ;\n(#105 = Y DO CENTRO DA FRESA NA PASSADA) ;\n(#106 = Z DA PASSADA) ;\n(#107 = X DE ONDE A FRESA ESTA) ;\n(#108 = X PARA ONDE A FRESA VAI) ;\n(#109 = AUXILIAR PARA TROCAR #107 COM #108) ;\nIF [#3 LE 0] THEN #3000 = 171 (C INVALIDO) ;\nIF [#11 LE 0] THEN #3000 = 172 (H INVALIDO) ;\nIF [#11 GE 90] THEN #3000 = 173 (H TEM QUE SER MENOR QUE 90) ;\nIF [#20 LE 0] THEN #3000 = 174 (T INVALIDO) ;\nIF [#4 LE 0] THEN #3000 = 175 (I INVALIDO) ;\nIF [#21 GT 1] THEN #3000 = 176 (U INVALIDO - USE 0 OU 1) ;\nIF [#21 LT 0] THEN #3000 = 176 (U INVALIDO - USE 0 OU 1) ;\nIF [#17 EQ 0] THEN #17 = #9 ;\n#100 = 1 ;\nIF [#22 GT 0] THEN #100 = -1 ;\n#101 = #24 - #20 / 2 - #1 ;\n#102 = #24 + #4 + #20 / 2 + #1 ;\n#103 = #11 ;\n#107 = #101 ;\n#108 = #102 ;\nG0 X#107 Y[#25 - #100 * #20 / 2] ;\nG0 Z[#23 + #18] ;\n(N10 = CADA PASSADA) ;\nN10 IF [#21 GT 0] GOTO 20 ;\n(CONVEXO - COMECA NO TOPO E DESCE ATE A FACE) ;\n#104 = #3 - #3 * SIN[#103] ;\n#106 = #23 - #3 + #3 * COS[#103] ;\nGOTO 30 ;\n(N20 = CONCAVO - COMECA NO TOPO E DESCE ATE O FUNDO DA CAVA) ;\nN20 #104 = #3 * COS[#103] ;\n#106 = #23 - #3 * SIN[#103] ;\n(N30 = DESCE UM DEGRAU E CORTA ATE A OUTRA PONTA) ;\nN30 #105 = #25 + #100 * [#104 - #20 / 2] ;\nG1 Y#105 Z#106 F#17 ;\nG1 X#108 F#9 ;\n#109 = #107 ;\n#107 = #108 ;\n#108 = #109 ;\n#103 = #103 + #11 ;\nIF [#103 LT 90] GOTO 10 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1618"
   }
  ],
  "notes": [
   "No côncavo, T não pode ser menor que C."
  ],
  "stockExpr": "({shape:'rect', lx:L.I, ly:Math.max(40,4*L.C), cx:L.X+L.I/2, cy:(L.V==1 ? L.Y-Math.max(40,4*L.C)/2 : L.Y+Math.max(40,4*L.C)/2), top:L.W||0, bottom:(L.W||0)-Math.max(30,3*L.C), tool:L.T})"
 },
 {
  "id": "m-raio-convexo",
  "cat": "macro",
  "num": 18,
  "title": "Raio convexo na aresta",
  "status": "nao-testado",
  "desc": "Arredonda a aresta (U0) com o mesmo sub O1618.",
  "main": "%\nO0018 (RAIO CONVEXO R10 - O1618) ;\nG21 G40 G90 G94 ;\nG54 ;\nT8 ;\nM6 ;\nG0 X0 Y0 ;\nS1600 M3 ;\nG43 H8 Z120. ;\nM8 ;\nG65 P1618 X-200. I200. Y-20. W0 C10. U0 V0 H1. T50. A5. R5. F3000. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1618,
    "code": "%\nO1618 (MACRO RAIO NA ARESTA - CONVEXO OU CONCAVO - CHAMADA POR G65 P1618) ;\n(FRESA DE TOPO RETA OU FRESA DE FACEAR COM CANTO VIVO) ;\n(A QUINA DE BAIXO DA FRESA DO LADO DA PECA TOCA A CURVA) ;\n(DESCE DE CIMA PARA BAIXO - CADA PASSADA AVANCA H GRAUS - VAI E VOLTA EM X) ;\n(CONVEXO = ARREDONDA A QUINA - CONCAVO = ABRE UMA CAVA NA QUINA) ;\n(LETRAS DO G65 P1618) ;\n(X = X ONDE COMECA A ARESTA - LADO DE MENOR X) ;\n(I = COMPRIMENTO DA ARESTA EM X) ;\n(Y = Y DA FACE ONDE FICA A ARESTA) ;\n(W = Z DO TOPO DA PECA) ;\n(C = RAIO R) ;\n(U = TIPO - 0 CONVEXO - 1 CONCAVO) ;\n(V = LADO - 0 FERRAMENTA NO LADO DE MENOR Y - 1 NO LADO DE MAIOR Y) ;\n(H = PASSO EM GRAUS A CADA PASSADA) ;\n(T = DIAMETRO DA FERRAMENTA) ;\n(A = FOLGA EM X ALEM DAS PONTAS) ;\n(R = PLANO DE SEGURANCA) ;\n(F = AVANCO EM X) ;\n(Q = AVANCO DO MOVIMENTO Y Z - NAO INFORMADO USA O F) ;\n(EXEMPLO - G65 P1618 X-165. I165. Y0 W0 C15. U1 V0 H1. T20. A15. R5. F3000. Q300.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X X DA PONTA ESQUERDA DA ARESTA - MENOR X) ;\n(#4 = I COMPRIMENTO DA ARESTA EM X) ;\n(#25 = Y Y DA FACE ONDE FICA A ARESTA) ;\n(#23 = W Z DO TOPO DA PECA) ;\n(#3 = C RAIO DA CURVA) ;\n(#21 = U TIPO - 0 CONVEXO - 1 CONCAVO) ;\n(#22 = V LADO - 0 MATERIAL PARA +Y - 1 MATERIAL PARA -Y) ;\n(#11 = H PASSO EM GRAUS DE CADA PASSADA - EXEMPLO 1) ;\n(#20 = T DIAMETRO DA FRESA) ;\n(#1 = A FOLGA EM X ALEM DAS PONTAS DA ARESTA) ;\n(#18 = R PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F AVANCO DO CORTE EM X) ;\n(#17 = Q AVANCO DO DEGRAU EM Y E Z - 0 USA O F) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = LADO DA PECA EM Y - MAIS 1 OU MENOS 1) ;\n(#101 = X DO CENTRO DA FRESA NA PONTA ESQUERDA) ;\n(#102 = X DO CENTRO DA FRESA NA PONTA DIREITA) ;\n(#103 = ANGULO DA PASSADA ATUAL) ;\n(#104 = DISTANCIA DA FACE ATE A QUINA DA FRESA) ;\n(#105 = Y DO CENTRO DA FRESA NA PASSADA) ;\n(#106 = Z DA PASSADA) ;\n(#107 = X DE ONDE A FRESA ESTA) ;\n(#108 = X PARA ONDE A FRESA VAI) ;\n(#109 = AUXILIAR PARA TROCAR #107 COM #108) ;\nIF [#3 LE 0] THEN #3000 = 171 (C INVALIDO) ;\nIF [#11 LE 0] THEN #3000 = 172 (H INVALIDO) ;\nIF [#11 GE 90] THEN #3000 = 173 (H TEM QUE SER MENOR QUE 90) ;\nIF [#20 LE 0] THEN #3000 = 174 (T INVALIDO) ;\nIF [#4 LE 0] THEN #3000 = 175 (I INVALIDO) ;\nIF [#21 GT 1] THEN #3000 = 176 (U INVALIDO - USE 0 OU 1) ;\nIF [#21 LT 0] THEN #3000 = 176 (U INVALIDO - USE 0 OU 1) ;\nIF [#17 EQ 0] THEN #17 = #9 ;\n#100 = 1 ;\nIF [#22 GT 0] THEN #100 = -1 ;\n#101 = #24 - #20 / 2 - #1 ;\n#102 = #24 + #4 + #20 / 2 + #1 ;\n#103 = #11 ;\n#107 = #101 ;\n#108 = #102 ;\nG0 X#107 Y[#25 - #100 * #20 / 2] ;\nG0 Z[#23 + #18] ;\n(N10 = CADA PASSADA) ;\nN10 IF [#21 GT 0] GOTO 20 ;\n(CONVEXO - COMECA NO TOPO E DESCE ATE A FACE) ;\n#104 = #3 - #3 * SIN[#103] ;\n#106 = #23 - #3 + #3 * COS[#103] ;\nGOTO 30 ;\n(N20 = CONCAVO - COMECA NO TOPO E DESCE ATE O FUNDO DA CAVA) ;\nN20 #104 = #3 * COS[#103] ;\n#106 = #23 - #3 * SIN[#103] ;\n(N30 = DESCE UM DEGRAU E CORTA ATE A OUTRA PONTA) ;\nN30 #105 = #25 + #100 * [#104 - #20 / 2] ;\nG1 Y#105 Z#106 F#17 ;\nG1 X#108 F#9 ;\n#109 = #107 ;\n#107 = #108 ;\n#108 = #109 ;\n#103 = #103 + #11 ;\nIF [#103 LT 90] GOTO 10 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1618"
   }
  ],
  "notes": [
   "O sub O1618 foi aprovado no côncavo; o convexo ainda não foi testado na máquina."
  ],
  "stockExpr": "({shape:'rect', lx:L.I, ly:Math.max(40,4*L.C), cx:L.X+L.I/2, cy:(L.V==1 ? L.Y-Math.max(40,4*L.C)/2 : L.Y+Math.max(40,4*L.C)/2), top:L.W||0, bottom:(L.W||0)-Math.max(30,3*L.C), tool:L.T})"
 },
 {
  "id": "m-canal",
  "cat": "macro",
  "num": 25,
  "title": "Canal de chaveta em rampa",
  "status": "aprovado",
  "desc": "Canal com pontas em meio círculo, zero no centro. Desce em rampa de ponta a ponta e contorna o canal; passada plana no fundo.",
  "main": "%\nO0025 (CANAL DE CHAVETA EM RAMPA - ZERO NO CENTRO DO CANAL - O1624) ;\nG21 G40 G90 G94 ;\nG55 ;\nT16 ;\nM6 ;\nG0 X0 Y0 ;\nS2500 M3 ;\nG43 H16 Z120. ;\nM8 ;\nG65 P1624 X0 Y0 I200. T28. B32. W0 Z-1. K0.5 R50. F2000. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1624,
    "code": "%\nO1624 (MACRO CANAL DE CHAVETA EM RAMPA - ZERO NO CENTRO DO CANAL - CHAMADA POR G65 P1624) ;\n(CANAL COM AS DUAS PONTAS EM MEIO CIRCULO - RAIO DA PONTA = B / 2 - FRESA DE TOPO RETA) ;\n(COMECA NA PONTA NEGATIVA - X DO CENTRO DA FRESA = METADE DE I MENOS O RAIO DA PONTA) ;\n(RAMPA ATE A PONTA POSITIVA - DEPOIS CONTORNA O CANAL NESSE Z - SENTIDO ANTI-HORARIO) ;\n(NA CAMADA SEGUINTE FAZ A RAMPA VOLTANDO - O SINAL DO X ALTERNA - REPETE ATE O Z FINAL) ;\n(NO FINAL FAZ UMA PASSADA PLANA NO FUNDO PARA LIMPAR A RAMPA) ;\n(LETRAS DO G65 P1624) ;\n(X = X DO CENTRO DO CANAL) ;\n(Y = Y DO CENTRO DO CANAL) ;\n(I = COMPRIMENTO TOTAL DO CANAL PONTA A PONTA) ;\n(T = DIAMETRO DA FRESA) ;\n(B = LARGURA DO CANAL - NAO INFORMADO USA O T) ;\n(W = Z DO TOPO DA PECA) ;\n(Z = Z FINAL DO FUNDO DO CANAL) ;\n(K = DESCIDA EM Z A CADA RAMPA) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DO CORTE) ;\n(EXEMPLO - G65 P1624 X0 Y0 I200. T28. B32. W0 Z-1. K0.5 R50. F2000.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X X DO CENTRO DO CANAL) ;\n(#25 = Y Y DO CENTRO DO CANAL) ;\n(#4 = I COMPRIMENTO TOTAL DO CANAL) ;\n(#20 = T DIAMETRO DA FRESA) ;\n(#2 = B LARGURA DO CANAL) ;\n(#23 = W Z DO TOPO DA PECA) ;\n(#26 = Z Z FINAL DO FUNDO DO CANAL) ;\n(#6 = K DESCIDA EM Z A CADA RAMPA) ;\n(#18 = R PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F AVANCO DO CORTE) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = X DO CENTRO DA FRESA NA PONTA = I / 2 MENOS B / 2) ;\n(#101 = Y DO CONTORNO = B / 2 MENOS T / 2) ;\n(#102 = LADO DA PONTA ONDE A FRESA ESTA - MAIS 1 OU MENOS 1) ;\n(#103 = Z DA CAMADA ATUAL) ;\n(#104 = Z DA CAMADA ANTERIOR) ;\n(#105 = LARGURA DO CANAL) ;\nIF [#20 LE 0] THEN #3000 = 211 (T INVALIDO) ;\n#105 = #20 ;\nIF [#2 NE #0] THEN #105 = #2 ;\nIF [#105 LT #20] THEN #3000 = 215 (B MENOR QUE T) ;\nIF [#105 GT #20 * 3] THEN #3000 = 216 (B MAIOR QUE 3 VEZES T) ;\nIF [#4 LE #105] THEN #3000 = 212 (I TEM QUE SER MAIOR QUE B) ;\nIF [#6 LE 0] THEN #3000 = 213 (K INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 214 (Z FINAL TEM QUE SER MENOR QUE W) ;\n#100 = #4 / 2 - #105 / 2 ;\n#101 = [#105 - #20] / 2 ;\n#102 = -1 ;\n#104 = #23 ;\nG0 X[#24 + #102 * #100] Y#25 ;\nG0 Z[#23 + #18] ;\nG1 Z#23 F#9 ;\n(N10 = CADA CAMADA - RAMPA ATE A OUTRA PONTA) ;\nN10 #103 = #104 - #6 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#102 = -#102 ;\nG1 X[#24 + #102 * #100] Y#25 Z#103 F#9 ;\nIF [#101 LE 0.0001] GOTO 20 ;\n(CONTORNO DO CANAL NESSE Z - ANTI-HORARIO) ;\nG1 Y[#25 - #102 * #101] F#9 ;\nG3 X[#24 + #102 * #100] Y[#25 + #102 * #101] I0 J[#102 * #101] ;\nG1 X[#24 - #102 * #100] ;\nG3 X[#24 - #102 * #100] Y[#25 - #102 * #101] I0 J[-#102 * #101] ;\nG1 X[#24 + #102 * #100] ;\nG1 Y#25 ;\nN20 #104 = #103 ;\nIF [#103 GT #26] GOTO 10 ;\n(PASSADA PLANA NO FUNDO) ;\n#102 = -#102 ;\nG1 X[#24 + #102 * #100] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1624"
   }
  ],
  "notes": [
   "Programa principal aprovado com G55, T16, H16 e S2500.",
   "Se B não for informado, usa T (canal da largura da fresa)."
  ],
  "stockMargin": true,
  "stockExpr": "({shape:'rect', lx:L.I+40, ly:(L.B||L.T)+40, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:L.Z-15, tool:L.T})"
 },
 {
  "id": "m-raio-diam",
  "cat": "macro",
  "num": 31,
  "title": "Raio entre dois diâmetros",
  "status": "aprovado",
  "desc": "Arco de raio C do diâmetro D (no Z de W) até o diâmetro A. Final pelo ângulo B ou pela altura I. Uma volta G2 em cada posição.",
  "main": "%\nO0032 (RAIO R49.77 - DE O299.5 A O374 - ALTURA 46.7 - O1631) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2000 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1631 X0 Y0 C49.77 D299.5 A374. I46.7 H1. T28. W-21. R50. F1500. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1631,
    "code": "%\nO1631 (MACRO RAIO ENTRE DOIS DIAMETROS - TANGENTE POR ANGULO B OU POR ALTURA I - CHAMADA POR G65 P1631) ;\n(FRESA DE TOPO RETA OU FRESA DE FACEAR COM CANTO VIVO - DESBASTE JA FEITO) ;\n(RAIO C QUE COMECA NO DIAMETRO D NO Z DE W E TERMINA NO DIAMETRO A) ;\n(O FINAL DO ARCO E DEFINIDO POR UMA DAS DUAS FORMAS - B = ANGULO DA TANGENTE FINAL EM RELACAO AO PLANO DA FACE - OU - I = ALTURA DO ARCO EM Z) ;\n(SE I FOR INFORMADO O B NAO E USADO - O Z FINAL E CALCULADO - W MENOS A ALTURA DO ARCO) ;\n(A QUINA DE BAIXO DA FRESA SEGUE O ARCO - UMA VOLTA COMPLETA EM CADA POSICAO - SENTIDO HORARIO G2 - DESCE DE CIMA PARA BAIXO) ;\n(LETRAS DO G65 P1631) ;\n(X = X DO CENTRO) ;\n(Y = Y DO CENTRO) ;\n(C = RAIO DO ARCO) ;\n(D = DIAMETRO ONDE O ARCO COMECA - NO Z DE W) ;\n(A = DIAMETRO ONDE O ARCO TERMINA) ;\n(B = ANGULO DA TANGENTE FINAL EM RELACAO AO PLANO DA FACE - EXEMPLO 5.5 - NAO USA SE INFORMAR I) ;\n(I = ALTURA DO ARCO EM Z - OPCIONAL - SE INFORMAR NAO PRECISA DO B) ;\n(H = PASSO EM GRAUS DE CADA VOLTA - EXEMPLO 1) ;\n(T = DIAMETRO DA FRESA - CANTO VIVO) ;\n(W = Z ONDE O ARCO COMECA) ;\n(R = PLANO DE SEGURANCA ACIMA DE W) ;\n(F = AVANCO DA VOLTA) ;\n(Q = AVANCO DA DESCIDA ENTRE VOLTAS - NAO INFORMADO USA O F) ;\n(EXEMPLO - G65 P1631 X0 Y0 C62. D260.5 A360. B5.5 H1. T28. W0 R50. F1500.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X X DO CENTRO) ;\n(#25 = Y Y DO CENTRO) ;\n(#3 = C RAIO DO ARCO) ;\n(#7 = D DIAMETRO INICIAL DO ARCO) ;\n(#1 = A DIAMETRO FINAL DO ARCO) ;\n(#2 = B ANGULO DA TANGENTE FINAL) ;\n(#4 = I ALTURA DO ARCO EM Z) ;\n(#11 = H PASSO EM GRAUS DE CADA VOLTA) ;\n(#20 = T DIAMETRO DA FRESA) ;\n(#23 = W Z ONDE O ARCO COMECA) ;\n(#18 = R PLANO DE SEGURANCA ACIMA DE W) ;\n(#9 = F AVANCO DA VOLTA) ;\n(#17 = Q AVANCO DA DESCIDA ENTRE VOLTAS) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO INICIAL = D / 2) ;\n(#101 = RAIO FINAL = A / 2) ;\n(#102 = ANGULO FINAL DO ARCO) ;\n(#103 = ANGULO INICIAL DO ARCO) ;\n(#104 = ANGULO DA VOLTA ATUAL) ;\n(#105 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\n(#106 = Z DA FRESA NA VOLTA ATUAL) ;\n(#112 = VALOR PARA CALCULAR O ANGULO INICIAL) ;\n(#113 = CORDA DO ARCO) ;\n(#114 = ANGULO DA CORDA EM RELACAO AO EIXO) ;\n(#115 = ANGULO TOTAL DO ARCO) ;\nIF [#3 LE 0] THEN #3000 = 291 (C INVALIDO) ;\nIF [#7 LE 0] THEN #3000 = 292 (D INVALIDO) ;\nIF [#1 LE #7] THEN #3000 = 293 (A TEM QUE SER MAIOR QUE D) ;\nIF [#11 LE 0] THEN #3000 = 295 (H INVALIDO) ;\nIF [#20 LE 0] THEN #3000 = 296 (T INVALIDO) ;\nIF [#17 EQ 0] THEN #17 = #9 ;\nIF [#17 EQ #0] THEN #17 = #9 ;\n#100 = #7 / 2 ;\n#101 = #1 / 2 ;\nIF [#4 EQ #0] GOTO 5 ;\n(ARCO DEFINIDO PELA ALTURA I) ;\nIF [#4 LE 0] THEN #3000 = 298 (I INVALIDO) ;\n#113 = SQRT[[#101 - #100] * [#101 - #100] + #4 * #4] ;\nIF [#113 GE #3 * 2] THEN #3000 = 297 (RAIO C PEQUENO PARA ESSA ABERTURA) ;\n#114 = ATAN[#101 - #100]/[#4] ;\n#115 = 2 * ASIN[#113 / 2 / #3] ;\n#103 = #114 - #115 / 2 ;\n#102 = #114 + #115 / 2 ;\nGOTO 6 ;\n(ARCO DEFINIDO PELO ANGULO B) ;\nN5 IF [#2 LE 0] THEN #3000 = 294 (B INVALIDO) ;\nIF [#2 GE 90] THEN #3000 = 294 (B INVALIDO) ;\n#102 = 90 - #2 ;\n#112 = [#101 - #100] / #3 + COS[#102] ;\nIF [#112 GE 1] THEN #3000 = 297 (RAIO C PEQUENO PARA ESSA ABERTURA) ;\n#103 = ACOS[#112] ;\nN6 IF [#103 LT 0] THEN #3000 = 299 (ANGULO DO ARCO FORA DO LIMITE) ;\nIF [#102 GE 90] THEN #3000 = 299 (ANGULO DO ARCO FORA DO LIMITE) ;\n#104 = #103 ;\nG0 X[#24 + #100 + #20 / 2 + 5] Y#25 ;\nG0 Z[#23 + #18] ;\n(N10 = CADA VOLTA - DE CIMA PARA BAIXO SOBRE O ARCO) ;\nN10 #104 = #104 + #11 ;\nIF [#104 GT #102] THEN #104 = #102 ;\n#105 = #100 + #3 * [COS[#103] - COS[#104]] + #20 / 2 ;\n#106 = #23 - #3 * [SIN[#104] - SIN[#103]] ;\nG1 X[#24 + #105] Z#106 F#17 ;\nG2 X[#24 + #105] Y#25 I[-#105] J0 F#9 ;\nIF [#104 LT #102] GOTO 10 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1631"
   }
  ],
  "notes": [
   "Renumerado de O0033 para O0032 no app, porque O0033 já é a rosca e O0031 é o cone externo.",
   "Desbaste já precisa estar feito."
  ],
  "stock": "round",
  "top": -21,
  "stockExpr": "({shape:'round', d:L.A, cx:L.X||0, cy:L.Y||0, top:L.W, bottom:L.W-(L.I||40)-10, tool:L.T})"
 },
 {
  "id": "m-cone",
  "cat": "macro",
  "num": 31,
  "title": "Cone externo (fresa de topo reto)",
  "status": "nao-testado",
  "desc": "Cone na peça de fora (menor no topo, maior D na base) em várias passadas com fresa 90° (fresa de topo reto): a quina de baixo da fresa desce Q em cada volta G2 sobre a linha do cone. O cone é definido pelo ângulo B (1 a 89) ou pelo diâmetro do topo A.",
  "main": "%\nO0031 (CONE EXTERNO COM FRESA 90 GRAUS - O1630) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2500 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.3 T25. R5. F800. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1630,
    "code": "%\nO1630 (MACRO CONE EXTERNO COM FRESA 90 GRAUS EM PASSADAS - CHAMADA POR G65 P1630) ;\n(FRESA 90 GRAUS = FRESA DE TOPO RETA - O CORRETOR DE COMPRIMENTO FICA NA PONTA DA FRESA) ;\n(CONE NA PECA DE FORA - DIAMETRO MENOR NO TOPO E MAIOR NA BASE - O BRUTO TEM O DIAMETRO D DA BASE) ;\n(A QUINA DE BAIXO DA FRESA ANDA SOBRE A LINHA DO CONE - DE CIMA PARA BAIXO - UMA VOLTA COMPLETA EM CADA POSICAO - SENTIDO HORARIO G2) ;\n(SEMPRE FAZ VARIAS PASSADAS - O Q DEFINE QUANTO A FRESA DESCE EM CADA VOLTA - Q PEQUENO = MELHOR ACABAMENTO) ;\n(O CONE E DEFINIDO PELO ANGULO B OU PELO DIAMETRO DO TOPO A) ;\n(SE INFORMAR B O DIAMETRO A E CALCULADO E NAO PRECISA INFORMAR) ;\n(LETRAS DO G65 P1630) ;\n(X = X DO CENTRO DO CONE) ;\n(Y = Y DO CENTRO DO CONE) ;\n(D = DIAMETRO MAIOR DO CONE - NA BASE - IGUAL AO DIAMETRO DO BRUTO) ;\n(B = ANGULO DO CONE EM RELACAO A FACE DE CIMA - DE 1 ATE 89) ;\n(A = DIAMETRO MENOR DO CONE NO TOPO - NAO USA SE INFORMAR B) ;\n(W = Z DO TOPO DO CONE) ;\n(Z = Z DA BASE DO CONE) ;\n(Q = PASSE EM Z - QUANTO A FRESA DESCE EM CADA VOLTA) ;\n(T = DIAMETRO DA FRESA) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DO CORTE) ;\n(EXEMPLO COM ANGULO - G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.3 T25. R5. F800.) ;\n(EXEMPLO COM DIAMETRO DO TOPO - G65 P1630 X0 Y0 D60. A44. W0 Z-8. Q0.5 T28. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  X DO CENTRO DO CONE) ;\n(#25 = Y  Y DO CENTRO DO CONE) ;\n(#7 = D  DIAMETRO MAIOR DO CONE) ;\n(#2 = B  ANGULO DO CONE EM RELACAO A FACE DE CIMA) ;\n(#1 = A  DIAMETRO MENOR DO CONE) ;\n(#23 = W  Z DO TOPO DO CONE) ;\n(#26 = Z  Z DA BASE DO CONE) ;\n(#17 = Q  PASSE EM Z A CADA VOLTA) ;\n(#20 = T  DIAMETRO DA FRESA) ;\n(#18 = R  PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F  AVANCO DO CORTE) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DO BRUTO = RAIO MAIOR DO CONE) ;\n(#101 = RAIO MENOR DO CONE NO TOPO) ;\n(#103 = Z DA FRESA NA VOLTA ATUAL) ;\n(#104 = ABERTURA DO CONE = RAIO QUE AUMENTA PARA CADA 1 DE DESCIDA) ;\n(#107 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\n(#108 = 0 ANTES DA PRIMEIRA VOLTA - 1 DEPOIS) ;\nIF [#20 LE 0] THEN #3000 = 281 (T INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 282 (Z FINAL TEM QUE SER MENOR QUE W) ;\nIF [#7 LE 0] THEN #3000 = 283 (D INVALIDO) ;\nIF [#17 LE 0] THEN #3000 = 287 (Q INVALIDO - INFORME O PASSE EM Z) ;\nIF [#2 EQ #0] GOTO 4 ;\n(CONE DEFINIDO PELO ANGULO B) ;\nIF [#2 GE 90] THEN #3000 = 289 (B INVALIDO) ;\nIF [#2 LT 1] THEN #3000 = 289 (B INVALIDO) ;\n#104 = 1 / TAN[#2] ;\n#1 = #7 - 2 * [#23 - #26] * #104 ;\nIF [#1 LT 0] THEN #3000 = 284 (B MUITO ABERTO - O TOPO PASSOU DO CENTRO - DIMINUA A ALTURA OU AUMENTE B) ;\nGOTO 5 ;\n(CONE DEFINIDO PELO DIAMETRO A) ;\nN4 IF [#1 LT 0] THEN #3000 = 284 (A INVALIDO) ;\nIF [#1 GE #7] THEN #3000 = 284 (A TEM QUE SER MENOR QUE D) ;\n#104 = [#7 - #1] / 2 / [#23 - #26] ;\nN5 IF [#104 * #17 GT #20] THEN #3000 = 290 (Q MUITO GRANDE PARA ESSE ANGULO - AVANCO RADIAL MAIOR QUE A FRESA) ;\n#100 = #7 / 2 ;\n#101 = #1 / 2 ;\n#103 = #23 + #17 ;\n#108 = 0 ;\n(N10 = CADA POSICAO DA FRESA - COMECA NO TOPO E DESCE PELA LINHA DO CONE) ;\nN10 #103 = #103 - #17 ;\nIF [#103 LT #26] THEN #103 = #26 ;\n#107 = #101 + [#23 - #103] * #104 + #20 / 2 ;\nIF [#108 NE 0] GOTO 20 ;\n(PRIMEIRA VOLTA - ENTRA POR FORA DO BRUTO E ENCOSTA NO TOPO DO CONE) ;\nG0 X[#24 + #100 + #20 / 2 + 2] Y#25 ;\nG0 Z[#23 + #18] ;\nG1 Z#103 F#9 ;\nG1 X[#24 + #107] F#9 ;\n#108 = 1 ;\nGOTO 30 ;\nN20 G1 X[#24 + #107] Z#103 F#9 ;\nN30 G2 X[#24 + #107] Y#25 I[-#107] J0 F#9 ;\nIF [#103 GT #26] GOTO 10 ;\nG1 X[#24 + #100 + #20 / 2 + 2] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1630"
   }
  ],
  "presets": [
   {
    "label": "Pelo ângulo - B60",
    "call": "G65 P1630 X0 Y0 D60. B60 W0 Z-20. Q0.3 T25. R5. F800."
   },
   {
    "label": "Pelo diâmetro do topo - A44",
    "call": "G65 P1630 X0 Y0 D60. A44. W0 Z-8. Q0.5 T28. R5. F800."
   }
  ],
  "notes": [
   "Fresa 90° = fresa de topo reto. O corretor de comprimento fica na ponta da fresa.",
   "A quina de baixo da fresa segue a linha do cone e faz qualquer ângulo B de 1 a 89. Use B (ângulo em relação à face de cima) ou A (diâmetro do topo).",
   "Q é obrigatório: quanto a fresa desce em cada volta. Q pequeno = melhor acabamento."
  ],
  "stockExpr": "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})"
 },
 {
  "id": "m-cone-redonda",
  "cat": "macro",
  "num": 41,
  "title": "Cone externo com pastilha redonda",
  "status": "nao-testado",
  "desc": "Cone na peça de fora com fresa de pastilha redonda, em várias passadas: o centro da pastilha anda paralelo à linha do cone, uma volta G2 em cada posição, descendo Q. O cone é definido pelo ângulo B (1 a 89) ou pelo diâmetro do topo A.",
  "main": "%\nO0041 (CONE EXTERNO COM PASTILHA REDONDA - O1637) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2500 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1637,
    "code": "%\nO1637 (MACRO CONE EXTERNO COM FRESA DE PASTILHA REDONDA EM PASSADAS - CHAMADA POR G65 P1637) ;\n(FRESA COM PASTILHA REDONDA - E = RAIO DA PASTILHA - T = DIAMETRO MAIOR DA FRESA - O CORRETOR FICA NO PONTO MAIS BAIXO DA PASTILHA) ;\n(CONE NA PECA DE FORA - DIAMETRO MENOR NO TOPO E MAIOR NA BASE - O BRUTO TEM O DIAMETRO D DA BASE) ;\n(O CENTRO DA PASTILHA ANDA PARALELO A LINHA DO CONE - AFASTADO DE E - UMA VOLTA COMPLETA EM CADA POSICAO - SENTIDO HORARIO G2) ;\n(DE CIMA PARA BAIXO - O Q DEFINE QUANTO O PONTO DE CONTATO DESCE EM CADA VOLTA - Q PEQUENO = MELHOR ACABAMENTO) ;\n(O CONE E DEFINIDO PELO ANGULO B OU PELO DIAMETRO DO TOPO A - B DE 1 ATE 89) ;\n(A PASTILHA REDONDA NAO FAZ CANTO VIVO - NA BASE DO CONE FICA UM RAIO IGUAL A E - O PONTO MAIS BAIXO NUNCA PASSA DO Z DA BASE) ;\n(LETRAS DO G65 P1637) ;\n(X = X DO CENTRO DO CONE) ;\n(Y = Y DO CENTRO DO CONE) ;\n(D = DIAMETRO MAIOR DO CONE - NA BASE - IGUAL AO DIAMETRO DO BRUTO) ;\n(B = ANGULO DO CONE EM RELACAO A FACE DE CIMA - DE 1 ATE 89) ;\n(A = DIAMETRO MENOR DO CONE NO TOPO - NAO USA SE INFORMAR B) ;\n(W = Z DO TOPO DO CONE) ;\n(Z = Z DA BASE DO CONE) ;\n(Q = PASSE EM Z - QUANTO O PONTO DE CONTATO DESCE EM CADA VOLTA) ;\n(E = RAIO DA PASTILHA - PASTILHA DE 12 = 6) ;\n(T = DIAMETRO MAIOR DA FRESA - MEDIDO NA PONTA EXTERNA DA PASTILHA) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DO CORTE) ;\n(EXEMPLO COM ANGULO - G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500.) ;\n(EXEMPLO COM DIAMETRO DO TOPO - G65 P1637 X0 Y0 D60. A30. W0 Z-20. Q0.3 E6. T50. R5. F1500.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  X DO CENTRO DO CONE) ;\n(#25 = Y  Y DO CENTRO DO CONE) ;\n(#7 = D  DIAMETRO MAIOR DO CONE) ;\n(#2 = B  ANGULO DO CONE EM RELACAO A FACE DE CIMA) ;\n(#1 = A  DIAMETRO MENOR DO CONE) ;\n(#23 = W  Z DO TOPO DO CONE) ;\n(#26 = Z  Z DA BASE DO CONE) ;\n(#17 = Q  PASSE EM Z A CADA VOLTA) ;\n(#8 = E  RAIO DA PASTILHA) ;\n(#20 = T  DIAMETRO MAIOR DA FRESA) ;\n(#18 = R  PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F  AVANCO DO CORTE) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DO BRUTO = RAIO MAIOR DO CONE) ;\n(#101 = RAIO MENOR DO CONE NO TOPO) ;\n(#103 = Z DO PONTO DE CONTATO NA LINHA DO CONE NA VOLTA ATUAL) ;\n(#104 = ABERTURA DO CONE = RAIO QUE AUMENTA PARA CADA 1 DE DESCIDA) ;\n(#106 = Z DO PONTO MAIS BAIXO DA PASTILHA NA VOLTA ATUAL) ;\n(#107 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\n(#108 = 0 ANTES DA PRIMEIRA VOLTA - 1 DEPOIS) ;\n(#109 = SENO DO ANGULO DO CONE) ;\n(#110 = COSSENO DO ANGULO DO CONE) ;\n(#112 = RAIO DA PARTE PLANA DA FRESA = T / 2 MENOS E) ;\n(#113 = Z MINIMO DO PONTO DE CONTATO - Z DA BASE MAIS E VEZES 1 MENOS COSSENO) ;\nIF [#20 LE 0] THEN #3000 = 291 (T INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 292 (Z FINAL TEM QUE SER MENOR QUE W) ;\nIF [#7 LE 0] THEN #3000 = 293 (D INVALIDO) ;\nIF [#8 LE 0] THEN #3000 = 295 (E INVALIDO - SEM PASTILHA REDONDA USE O1630) ;\nIF [#8 * 2 GT #20] THEN #3000 = 295 (E MAIOR QUE O RAIO DA FRESA) ;\nIF [#17 LE 0] THEN #3000 = 296 (Q INVALIDO - INFORME O PASSE EM Z) ;\nIF [#2 EQ #0] GOTO 4 ;\n(CONE DEFINIDO PELO ANGULO B) ;\nIF [#2 GE 90] THEN #3000 = 297 (B INVALIDO) ;\nIF [#2 LT 1] THEN #3000 = 297 (B INVALIDO) ;\n#104 = 1 / TAN[#2] ;\n#1 = #7 - 2 * [#23 - #26] * #104 ;\nIF [#1 LT 0] THEN #3000 = 294 (B MUITO ABERTO - O TOPO PASSOU DO CENTRO - DIMINUA A ALTURA OU AUMENTE B) ;\nGOTO 5 ;\n(CONE DEFINIDO PELO DIAMETRO A) ;\nN4 IF [#1 LT 0] THEN #3000 = 294 (A INVALIDO) ;\nIF [#1 GE #7] THEN #3000 = 294 (A TEM QUE SER MENOR QUE D) ;\n#104 = [#7 - #1] / 2 / [#23 - #26] ;\nN5 #109 = 1 / SQRT[1 + #104 * #104] ;\n#110 = #104 * #109 ;\n#112 = #20 / 2 - #8 ;\n#113 = #26 + #8 * [1 - #110] ;\nIF [#113 GE #23] THEN #3000 = 299 (CONE BAIXO DEMAIS PARA O RAIO DA PASTILHA) ;\nIF [#104 * #17 GT #20] THEN #3000 = 298 (Q MUITO GRANDE PARA ESSE ANGULO - AVANCO RADIAL MAIOR QUE A FRESA) ;\n#100 = #7 / 2 ;\n#101 = #1 / 2 ;\n#103 = #23 + #17 ;\n#108 = 0 ;\n(N10 = CADA POSICAO DO CONTATO - COMECA NO TOPO E DESCE PELA LINHA DO CONE) ;\nN10 #103 = #103 - #17 ;\nIF [#103 LT #113] THEN #103 = #113 ;\n#106 = #103 - #8 * [1 - #110] ;\n#107 = #101 + [#23 - #103] * #104 + #8 * #109 + #112 ;\nIF [#108 NE 0] GOTO 20 ;\n(PRIMEIRA VOLTA - ENTRA POR FORA DO BRUTO E DESCE ATE O TOPO DO CONE) ;\nG0 X[#24 + #100 + #20 / 2 + 2] Y#25 ;\nG0 Z[#23 + #18] ;\nG1 Z#106 F#9 ;\nG1 X[#24 + #107] F#9 ;\n#108 = 1 ;\nGOTO 30 ;\nN20 G1 X[#24 + #107] Z#106 F#9 ;\nN30 G2 X[#24 + #107] Y#25 I[-#107] J0 F#9 ;\nIF [#103 GT #113] GOTO 10 ;\nG1 X[#24 + #100 + #20 / 2 + 2] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1637"
   }
  ],
  "presets": [
   {
    "label": "Pastilha 12 (E6) - B60",
    "call": "G65 P1637 X0 Y0 D60. B60 W0 Z-20. Q0.3 E6. T50. R5. F1500."
   },
   {
    "label": "Pelo diâmetro do topo - A30",
    "call": "G65 P1637 X0 Y0 D60. A30. W0 Z-20. Q0.3 E6. T50. R5. F1500."
   }
  ],
  "notes": [
   "E = raio da pastilha (pastilha de 12 = E6). T = diâmetro maior da fresa, medido na ponta externa da pastilha.",
   "O corretor de comprimento fica no ponto mais baixo da pastilha.",
   "A pastilha redonda não faz canto vivo: na base do cone fica um raio igual a E.",
   "Sem pastilha redonda, use o O1630 (cone com fresa 90°, de topo reto)."
  ],
  "toolShapeExpr": "({type:'r', cornerR: L.E||0})",
  "stockExpr": "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})"
 },
 {
  "id": "m-cone-paletas",
  "cat": "macro",
  "num": 42,
  "title": "Cone só nas paletas (pastilha redonda)",
  "status": "nao-testado",
  "desc": "Cone externo usinado só no topo das paletas (indutor), com fresa de pastilha redonda. Em cada nível de Z a macro calcula onde as duas arestas da paleta cruzam o raio do cone e faz um arco só nessa largura, vai e volta G3 / G2. Repete para as K paletas, a 360 / K uma da outra.",
  "main": "%\nO0042 (INDUTOR PALETAS - O1638) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2500 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. R100. F3000. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1638,
    "code": "%\nO1638 (MACRO CONE EXTERNO SO NAS PALETAS COM FRESA DE PASTILHA REDONDA - CHAMADA POR G65 P1638) ;\n(FRESA COM PASTILHA REDONDA - E = RAIO DA PASTILHA - T = DIAMETRO MAIOR DA FRESA - O CORRETOR FICA NO PONTO MAIS BAIXO DA PASTILHA) ;\n(CONE NA PECA DE FORA - DIAMETRO MENOR NO TOPO E MAIOR NA BASE - O BRUTO TEM O DIAMETRO D DA BASE) ;\n(DO TOPO W ATE ONDE O CONE ENCOSTA NO CUBO FAZ VOLTAS COMPLETAS COMO NA O1637 - DAI PARA BAIXO USINA SO O TOPO DAS PALETAS) ;\n(EM CADA NIVEL DE Z A MACRO CALCULA ONDE AS DUAS ARESTAS DA PALETA CRUZAM O RAIO DO CONE E FAZ UM ARCO SO NESSA LARGURA - VAI E VOLTA G3 G2) ;\n(AS PALETAS FICAM A 360 DIVIDIDO POR K - A PRIMEIRA NO ANGULO J) ;\n(O CONE E DEFINIDO PELO ANGULO B OU PELO DIAMETRO DO TOPO A - B DE 1 ATE 89) ;\n(LETRAS DO G65 P1638) ;\n(X = X DO CENTRO DA PECA) ;\n(Y = Y DO CENTRO DA PECA) ;\n(D = DIAMETRO MAIOR DO CONE - NA BASE) ;\n(B = ANGULO DO CONE EM RELACAO A FACE DE CIMA - DE 1 ATE 89) ;\n(A = DIAMETRO MENOR DO CONE NO TOPO W - NAO USA SE INFORMAR B) ;\n(W = Z DO TOPO DO CONE COMO NA O1637) ;\n(Z = Z DA BASE DO CONE) ;\n(Q = PASSE EM Z - QUANTO O PONTO DE CONTATO DESCE EM CADA NIVEL) ;\n(E = RAIO DA PASTILHA - PASTILHA DE 12 = 6) ;\n(T = DIAMETRO MAIOR DA FRESA) ;\n(R = PLANO DE SEGURANCA ACIMA DE W) ;\n(F = AVANCO DO CORTE) ;\n(J = ANGULO DO CENTRO DA PALETA 1 NA PONTA EXTERNA - MEDIDO DO X MAIS - ANTI-HORARIO VISTO DE CIMA) ;\n(K = NUMERO DE PALETAS) ;\n(U = FOLGA DO ARCO PARA CADA LADO DA PALETA EM MM - NAO INFORMADO USA 3) ;\n(H = 1 PARA NAO DESCER ABAIXO DO Z DA BASE - OPCIONAL) ;\n(EXEMPLO - G65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. R100. F3000.) ;\n(DADOS DA PALETA - INDUTOR 20159 - DESENHADA COM O CENTRO DA PONTA EXTERNA NO ANGULO 0 - CENTRO DA PECA NO ZERO - VISTA DE CIMA) ;\n(ARESTA 1 - ARCO DE RAIO 107.89 - #130 #131 = X Y DO CENTRO DO ARCO - #132 = RAIO - #133 = LADO 1 OU -1) ;\n#130 = 101.313 ;\n#131 = -102.385 ;\n#132 = 107.89 ;\n#133 = 1 ;\n(ARESTA 2 - ARCO DE RAIO 111.32 - #134 #135 = X Y DO CENTRO DO ARCO - #136 = RAIO - #137 = LADO 1 OU -1) ;\n#134 = 98.111 ;\n#135 = -92.722 ;\n#136 = 111.32 ;\n#137 = 1 ;\n(#138 = RAIO ONDE A PALETA ENCOSTA NO CUBO) ;\n#138 = 69.46 ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  #25 = Y  #7 = D  #2 = B  #1 = A  #23 = W  #26 = Z  #17 = Q  #8 = E  #20 = T  #18 = R  #9 = F) ;\n(#5 = J  #6 = K  #21 = U  #11 = H) ;\nIF [#20 LE 0] THEN #3000 = 311 (T INVALIDO) ;\nIF [#26 GE #23] THEN #3000 = 312 (Z FINAL TEM QUE SER MENOR QUE W) ;\nIF [#7 LE 0] THEN #3000 = 313 (D INVALIDO) ;\nIF [#8 LE 0] THEN #3000 = 314 (E INVALIDO - INFORME O RAIO DA PASTILHA) ;\nIF [#8 * 2 GT #20] THEN #3000 = 314 (E MAIOR QUE O RAIO DA FRESA) ;\nIF [#17 LE 0] THEN #3000 = 315 (Q INVALIDO - INFORME O PASSE EM Z) ;\nIF [#6 LE 0] THEN #3000 = 317 (K INVALIDO - NUMERO DE PALETAS) ;\nIF [#5 EQ #0] THEN #3000 = 318 (INFORME J - ANGULO DA PALETA 1) ;\nIF [#21 EQ #0] THEN #21 = 3 ;\n#114 = #1 ;\nIF [#2 EQ #0] GOTO 4 ;\nIF [#2 GE 90] THEN #3000 = 316 (B INVALIDO) ;\nIF [#2 LT 1] THEN #3000 = 316 (B INVALIDO) ;\n#104 = 1 / TAN[#2] ;\n#1 = #7 - 2 * [#23 - #26] * #104 ;\nIF [#1 LT 0] THEN #3000 = 316 (B MUITO ABERTO - O TOPO PASSOU DO CENTRO) ;\nIF [#114 EQ #0] GOTO 3 ;\nIF [ABS[#114 - #1] GT 1] THEN #3000 = 316 (A E B NAO BATEM - INFORME SO UM) ;\nN3 GOTO 5 ;\nN4 IF [#1 LT 0] THEN #3000 = 316 (A INVALIDO) ;\nIF [#1 GE #7] THEN #3000 = 316 (A TEM QUE SER MENOR QUE D) ;\n#104 = [#7 - #1] / 2 / [#23 - #26] ;\nN5 #109 = 1 / SQRT[1 + #104 * #104] ;\n#110 = #104 * #109 ;\n#112 = #20 / 2 - #8 ;\n#113 = #26 ;\nIF [#11 EQ 1] THEN #113 = #26 + #8 * [1 - #110] ;\nIF [#104 * #17 GT #20] THEN #3000 = 321 (Q MUITO GRANDE PARA ESSE ANGULO) ;\n#100 = #7 / 2 ;\n#101 = #1 / 2 ;\n#146 = #100 + #20 / 2 + 2 ;\n#150 = SQRT[#130 * #130 + #131 * #131] ;\n#151 = ATAN[#131]/[#130] ;\n#152 = SQRT[#134 * #134 + #135 * #135] ;\n#153 = ATAN[#135]/[#134] ;\n(Z ONDE O CONE ENCOSTA NO CUBO - COMECO DAS PALETAS) ;\n#123 = #23 ;\nIF [#101 GE #138] GOTO 6 ;\n#123 = #23 - [#138 - #101] / #104 ;\nN6 IF [#123 LE #113] THEN #3000 = 324 (A PALETA NAO TEM ALTURA ENTRE W E Z - CONFIRA OS DADOS) ;\n(DO TOPO W ATE O CUBO - VOLTA COMPLETA COMO NA O1637) ;\n#145 = 0 ;\nIF [#123 GE #23 - 0.0001] GOTO 200 ;\n#103 = #23 + #17 ;\nN50 #103 = #103 - #17 ;\nIF [#103 LE #123] GOTO 60 ;\n#106 = #103 - #8 * [1 - #110] ;\n#107 = #101 + [#23 - #103] * #104 + #8 * #109 + #112 ;\nIF [#145 NE 0] GOTO 55 ;\nG0 X[#24 + #146] Y#25 ;\nG0 Z[#23 + #18] ;\nG1 Z#106 F#9 ;\nG1 X[#24 + #107] F#9 ;\n#145 = 1 ;\nGOTO 56 ;\nN55 G1 X[#24 + #107] Z#106 F#9 ;\nN56 G2 X[#24 + #107] Y#25 I[-#107] J0 F#9 ;\nGOTO 50 ;\nN60 IF [#145 EQ 0] GOTO 200 ;\nG1 X[#24 + #146] F#9 ;\nG0 Z[#23 + #18] ;\nN200 #147 = 0 ;\n(N100 = CADA PALETA) ;\nN100 #149 = #5 + #147 * 360 / #6 ;\n#103 = #123 + #17 ;\n#148 = 1 ;\n#145 = 0 ;\n(N10 = CADA NIVEL DE Z - DESCE PELA LINHA DO CONE) ;\nN10 #103 = #103 - #17 ;\nIF [#103 LT #113] THEN #103 = #113 ;\n#106 = #103 - #8 * [1 - #110] ;\n#105 = #101 + [#23 - #103] * #104 ;\n#107 = #105 + #8 * #109 + #112 ;\n#190 = [#105 * #105 + #150 * #150 - #132 * #132] / [2 * #105 * #150] ;\nIF [#190 GT 1] THEN #190 = 1 ;\nIF [#190 LT -1] THEN #190 = -1 ;\n#191 = #151 + #133 * ACOS[#190] ;\n#192 = [#105 * #105 + #152 * #152 - #136 * #136] / [2 * #105 * #152] ;\nIF [#192 GT 1] THEN #192 = 1 ;\nIF [#192 LT -1] THEN #192 = -1 ;\n#193 = #153 + #137 * ACOS[#192] ;\n#195 = #191 ;\n#196 = #193 ;\nIF [#195 LE #196] GOTO 12 ;\n#195 = #193 ;\n#196 = #191 ;\nN12 #197 = #21 / #105 * 57.29578 ;\n#195 = #195 - #197 + #149 ;\n#196 = #196 + #197 + #149 ;\n#143 = #195 ;\n#144 = #196 ;\nIF [#148 GT 0] GOTO 15 ;\n#143 = #196 ;\n#144 = #195 ;\nN15 #198 = #24 + #107 * COS[#143] ;\n#199 = #25 + #107 * SIN[#143] ;\nIF [#145 NE 0] GOTO 20 ;\nG0 X[#24 + #146 * COS[#143]] Y[#25 + #146 * SIN[#143]] ;\nG0 Z[#23 + #18] ;\nG1 Z#106 F#9 ;\nG1 X#198 Y#199 F#9 ;\n#145 = 1 ;\nGOTO 30 ;\nN20 G1 X#198 Y#199 Z#106 F#9 ;\nN30 IF [#148 LT 0] GOTO 31 ;\nG3 X[#24 + #107 * COS[#144]] Y[#25 + #107 * SIN[#144]] I[-#107 * COS[#143]] J[-#107 * SIN[#143]] F#9 ;\nGOTO 32 ;\nN31 G2 X[#24 + #107 * COS[#144]] Y[#25 + #107 * SIN[#144]] I[-#107 * COS[#143]] J[-#107 * SIN[#143]] F#9 ;\nN32 #148 = 0 - #148 ;\nIF [#103 GT #113] GOTO 10 ;\nG1 X[#24 + #146 * COS[#144]] Y[#25 + #146 * SIN[#144]] F#9 ;\nG0 Z[#23 + #18] ;\n#147 = #147 + 1 ;\nIF [#147 LT #6] GOTO 100 ;\nM99 ;\n%",
    "key": "1638"
   }
  ],
  "presets": [
   {
    "label": "Exemplo O0042 - 8 paletas",
    "call": "G65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. R100. F3000."
   },
   {
    "label": "Sem descer abaixo da base - H1",
    "call": "G65 P1638 X0 Y0 D299.5 B48 W0 Z-108. Q0.3 E6. T50. J22.5 K8 U3. H1. R100. F3000."
   }
  ],
  "notes": [
   "Os dados da paleta (indutor 20159) ficam dentro do sub O1638: #130 a #133 = aresta 1 e #134 a #137 = aresta 2 (X Y do centro do arco, raio e lado). #138 = raio onde a paleta encosta no cubo.",
   "J = ângulo do centro da paleta 1 na ponta externa. K = número de paletas. U = folga do arco para cada lado da paleta (sem U usa 3).",
   "Do topo W até o Z onde o cone encosta no cubo faz voltas completas, como na O1637. Dali para baixo usina só o topo das paletas.",
   "Sem H1, o último nível põe o ponto de contato no Z da base e a parte de baixo da pastilha passa um pouco abaixo dela (no exemplo, cerca de 2 mm). Com H1 o ponto mais baixo da pastilha para no Z da base.",
   "E = raio da pastilha (pastilha de 12 = E6). O corretor fica no ponto mais baixo da pastilha.",
   "Na simulação o bruto é um cilindro inteiro; na peça real só existem as paletas."
  ],
  "toolShapeExpr": "({type:'r', cornerR: L.E||0})",
  "stockExpr": "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.Z||0)-10, tool:L.T})"
 },
 {
  "id": "m-raio-furo",
  "cat": "macro",
  "num": 39,
  "title": "Raio na quina do furo",
  "status": "nao-testado",
  "desc": "Arredonda a boca de um furo já usinado (raio convexo C). A quina de baixo da fresa de topo reta segue o raio, de cima para baixo, uma volta G3 a cada H graus.",
  "main": "%\nO0039 (RAIO NA QUINA DO FURO D100 - O1627) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2000 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1627 X0 Y0 D100. W0 C5. H1. T28. R5. F800. Q300. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1627,
    "code": "%\nO1627 (MACRO RAIO NA QUINA DO FURO - CONVEXO - CHAMADA POR G65 P1627) ;\n(FRESA DE TOPO RETA OU FRESA DE FACEAR COM CANTO VIVO - FURO JA USINADO) ;\n(A QUINA DE BAIXO DA FRESA SEGUE O RAIO QUE ARREDONDA A BOCA DO FURO) ;\n(DESCE DE CIMA PARA BAIXO - CADA VOLTA COMPLETA AVANCA H GRAUS NO RAIO) ;\n(LETRAS DO G65 P1627) ;\n(X = X DO CENTRO DO FURO) ;\n(Y = Y DO CENTRO DO FURO) ;\n(D = DIAMETRO DO FURO) ;\n(W = Z DO TOPO DA PECA) ;\n(C = RAIO DA QUINA) ;\n(H = PASSO EM GRAUS DE CADA VOLTA - EXEMPLO 1) ;\n(T = DIAMETRO DA FRESA - CANTO VIVO) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DA VOLTA) ;\n(Q = AVANCO DA DESCIDA ENTRE VOLTAS - NAO INFORMADO USA O F) ;\n(EXEMPLO - G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  X DO CENTRO DO FURO) ;\n(#25 = Y  Y DO CENTRO DO FURO) ;\n(#7 = D  DIAMETRO DO FURO) ;\n(#23 = W  Z DO TOPO DA PECA) ;\n(#3 = C  RAIO DA QUINA) ;\n(#11 = H  PASSO EM GRAUS DE CADA VOLTA) ;\n(#20 = T  DIAMETRO DA FRESA) ;\n(#18 = R  PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F  AVANCO DA VOLTA) ;\n(#17 = Q  AVANCO DA DESCIDA ENTRE VOLTAS) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DO FURO) ;\n(#103 = ANGULO DA VOLTA ATUAL) ;\n(#106 = Z DA FRESA NA VOLTA ATUAL) ;\n(#107 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\nIF [#3 LE 0] THEN #3000 = 251 (C INVALIDO) ;\nIF [#11 LE 0] THEN #3000 = 252 (H INVALIDO) ;\nIF [#11 GE 90] THEN #3000 = 253 (H TEM QUE SER MENOR QUE 90) ;\nIF [#20 LE 0] THEN #3000 = 254 (T INVALIDO) ;\nIF [#7 LE 0] THEN #3000 = 255 (D INVALIDO) ;\nIF [#7 LE #20] THEN #3000 = 256 (D TEM QUE SER MAIOR QUE T) ;\nIF [#17 EQ 0] THEN #17 = #9 ;\nIF [#17 EQ #0] THEN #17 = #9 ;\n#100 = #7 / 2 ;\n#103 = #11 ;\nG0 X#24 Y#25 ;\nG0 Z[#23 + #18] ;\n(N10 = CADA VOLTA - DE CIMA PARA BAIXO) ;\nN10 #107 = #100 + #3 - #3 * SIN[#103] - #20 / 2 ;\n#106 = #23 - #3 + #3 * COS[#103] ;\nG1 X[#24 + #107] Z#106 F#17 ;\nG3 X[#24 + #107] Y#25 I[-#107] F#9 ;\n#103 = #103 + #11 ;\nIF [#103 LT 90] GOTO 10 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1627"
   }
  ],
  "presets": [
   {
    "label": "Furo D100 - raio 5",
    "call": "G65 P1627 X0 Y0 D100. W0 C5. H1. T28. R5. F800. Q300."
   },
   {
    "label": "Furo D35 - raio 5 (exemplo do sub)",
    "call": "G65 P1627 X0 Y0 D35. W0 C5. H1. T28. R5. F800. Q300."
   }
  ],
  "notes": [
   "Fresa de topo reta ou de facear com canto vivo. O furo já precisa estar usinado.",
   "D tem que ser maior que T. Q é o avanço da descida entre voltas (sem Q usa o F)."
  ],
  "stockExpr": "({shape:'round', d:L.D+60, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||5)-20, tool:L.T, holeD:L.D, holeZ:(L.W||0)-(L.C||5)-20})"
 },
 {
  "id": "m-raio-cil",
  "cat": "macro",
  "num": 40,
  "title": "Raio na quina do diâmetro externo",
  "status": "nao-testado",
  "desc": "Arredonda a quina de cima de um cilindro já usinado no diâmetro D (raio convexo C). A fresa fica por fora e a quina de baixo segue o raio, uma volta G2 a cada H graus.",
  "main": "%\nO0040 (RAIO NA QUINA DO DIAMETRO EXTERNO D200 - O1635) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2000 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1635 X0 Y0 D200. W0 C5. H1. T28. R5. F800. Q300. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1635,
    "code": "%\nO1635 (MACRO RAIO NA QUINA DE CIMA DE CILINDRO EXTERNO - CONVEXO - CHAMADA POR G65 P1635) ;\n(FRESA DE TOPO RETA OU FRESA DE FACEAR COM CANTO VIVO - CILINDRO JA USINADO NO DIAMETRO D) ;\n(ARREDONDA A QUINA DE CIMA DO CILINDRO - FERRAMENTA FICA POR FORA DO CILINDRO) ;\n(A QUINA DE BAIXO DA FRESA DO LADO DO CILINDRO SEGUE O RAIO) ;\n(DESCE DE CIMA PARA BAIXO - CADA VOLTA COMPLETA AVANCA H GRAUS NO RAIO - SENTIDO HORARIO G2) ;\n(LETRAS DO G65 P1635) ;\n(X = X DO CENTRO DO CILINDRO) ;\n(Y = Y DO CENTRO DO CILINDRO) ;\n(D = DIAMETRO DO CILINDRO) ;\n(W = Z DO TOPO DO CILINDRO) ;\n(C = RAIO DA QUINA) ;\n(H = PASSO EM GRAUS DE CADA VOLTA - EXEMPLO 1) ;\n(T = DIAMETRO DA FRESA - CANTO VIVO) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DA VOLTA) ;\n(Q = AVANCO DA DESCIDA ENTRE VOLTAS - NAO INFORMADO USA O F) ;\n(EXEMPLO - G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  X DO CENTRO DO CILINDRO) ;\n(#25 = Y  Y DO CENTRO DO CILINDRO) ;\n(#7 = D  DIAMETRO DO CILINDRO) ;\n(#23 = W  Z DO TOPO DO CILINDRO) ;\n(#3 = C  RAIO DA QUINA) ;\n(#11 = H  PASSO EM GRAUS DE CADA VOLTA) ;\n(#20 = T  DIAMETRO DA FRESA) ;\n(#18 = R  PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F  AVANCO DA VOLTA) ;\n(#17 = Q  AVANCO DA DESCIDA ENTRE VOLTAS) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DO CILINDRO) ;\n(#103 = ANGULO DA VOLTA ATUAL) ;\n(#106 = Z DA FRESA NA VOLTA ATUAL) ;\n(#107 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\n(#108 = 0 ANTES DA PRIMEIRA VOLTA - 1 DEPOIS) ;\nIF [#3 LE 0] THEN #3000 = 261 (C INVALIDO) ;\nIF [#11 LE 0] THEN #3000 = 262 (H INVALIDO) ;\nIF [#11 GE 90] THEN #3000 = 263 (H TEM QUE SER MENOR QUE 90) ;\nIF [#20 LE 0] THEN #3000 = 264 (T INVALIDO) ;\nIF [#7 LE 0] THEN #3000 = 265 (D INVALIDO) ;\nIF [#3 GT #7 / 2] THEN #3000 = 266 (C MAIOR QUE O RAIO DO CILINDRO) ;\nIF [#17 EQ 0] THEN #17 = #9 ;\nIF [#17 EQ #0] THEN #17 = #9 ;\n#100 = #7 / 2 ;\n#103 = #11 ;\n#108 = 0 ;\n(N10 = CADA VOLTA - DE CIMA PARA BAIXO) ;\nN10 #107 = #100 - #3 + #3 * SIN[#103] + #20 / 2 ;\n#106 = #23 - #3 + #3 * COS[#103] ;\nIF [#108 NE 0] GOTO 20 ;\n(PRIMEIRA VOLTA - ENTRA POR FORA DO CILINDRO) ;\nG0 X[#24 + #100 + #20 / 2 + 2] Y#25 ;\nG0 Z[#23 + #18] ;\nG1 Z#106 F#17 ;\n#108 = 1 ;\n(N20 = VAI PARA O RAIO E FAZ A VOLTA COMPLETA) ;\nN20 G1 X[#24 + #107] Z#106 F#17 ;\nG2 X[#24 + #107] Y#25 I[-#107] F#9 ;\n#103 = #103 + #11 ;\nIF [#103 LT 90] GOTO 10 ;\n#107 = #100 + #20 / 2 ;\n#106 = #23 - #3 ;\nG1 X[#24 + #107] Z#106 F#17 ;\nG2 X[#24 + #107] Y#25 I[-#107] F#9 ;\nG1 X[#24 + #107 + 2] F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1635"
   }
  ],
  "presets": [
   {
    "label": "Cilindro D200 - raio 5",
    "call": "G65 P1635 X0 Y0 D200. W0 C5. H1. T28. R5. F800. Q300."
   },
   {
    "label": "Cilindro D80 - raio 5 (exemplo do sub)",
    "call": "G65 P1635 X0 Y0 D80. W0 C5. H1. T28. R5. F800. Q300."
   }
  ],
  "notes": [
   "Fresa de topo reta ou de facear com canto vivo. O cilindro já precisa estar usinado no diâmetro D.",
   "C não pode ser maior que o raio do cilindro. Q é o avanço da descida entre voltas (sem Q usa o F)."
  ],
  "stockExpr": "({shape:'round', d:L.D, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||5)-20, tool:L.T})"
 },
 {
  "id": "m-chanfro-furo",
  "cat": "macro",
  "num": 29,
  "title": "Chanfro no furo (fresa de topo)",
  "status": "nao-testado",
  "desc": "Chanfro na boca de um furo já usinado com fresa de topo reta: a quina de baixo da fresa segue a linha do chanfro, descendo Q em cada volta G3 completa.",
  "main": "%\nO0029 (CHANFRO NO FURO COM FRESA DE TOPO - O1628) ;\nG21 G40 G90 G94 ;\nG54 ;\nT1 ;\nM6 ;\nG0 X0 Y0 ;\nS2000 M3 ;\nG43 H1 Z120. ;\nM8 ;\nG65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800. ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "subs": [
   {
    "num": 1628,
    "code": "%\nO1628 (MACRO CHANFRO NO FURO COM FRESA DE TOPO RETA - CHAMADA POR G65 P1628) ;\n(FRESA DE TOPO RETA - O CORRETOR DE COMPRIMENTO FICA NA PONTA DA FRESA - O PONTO MAIS BAIXO) ;\n(A QUINA DE BAIXO DA FRESA SEGUE A LINHA DO CHANFRO - DE CIMA PARA BAIXO - UMA VOLTA COMPLETA EM CADA POSICAO) ;\n(FRESA DENTRO DO FURO - SENTIDO ANTI-HORARIO G3 - O Q DEFINE QUANTO A FRESA DESCE EM CADA VOLTA) ;\n(Q PEQUENO = ACABAMENTO MELHOR - SOBRA ENTRE AS VOLTAS ATE Q DE ALTURA) ;\n(LETRAS DO G65 P1628) ;\n(X = X DO CENTRO DO FURO) ;\n(Y = Y DO CENTRO DO FURO) ;\n(D = DIAMETRO DO FURO) ;\n(W = Z DO TOPO DA PECA) ;\n(C = LARGURA DO CHANFRO NO TOPO - MEDIDA NO RAIO A PARTIR DA PAREDE DO FURO) ;\n(B = ANGULO DO CHANFRO EM RELACAO AO TOPO - NAO INFORMADO USA 45 - DE 1 ATE 89) ;\n(Q = PASSE EM Z - QUANTO A FRESA DESCE EM CADA VOLTA) ;\n(T = DIAMETRO DA FRESA) ;\n(R = PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(F = AVANCO DO CORTE) ;\n(EXEMPLO - G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800.) ;\n(VARIAVEIS RECEBIDAS DO G65) ;\n(#24 = X  X DO CENTRO DO FURO) ;\n(#25 = Y  Y DO CENTRO DO FURO) ;\n(#7 = D  DIAMETRO DO FURO) ;\n(#23 = W  Z DO TOPO DA PECA) ;\n(#3 = C  LARGURA DO CHANFRO NO TOPO) ;\n(#2 = B  ANGULO DO CHANFRO) ;\n(#17 = Q  PASSE EM Z A CADA VOLTA) ;\n(#20 = T  DIAMETRO DA FRESA) ;\n(#18 = R  PLANO DE SEGURANCA ACIMA DO TOPO) ;\n(#9 = F  AVANCO DO CORTE) ;\n(VARIAVEIS DE CALCULO DA MACRO) ;\n(#100 = RAIO DO FURO) ;\n(#102 = ANGULO DO CHANFRO) ;\n(#103 = DISTANCIA DA PAREDE ATE A QUINA DA FRESA - MEDIDA NO RAIO) ;\n(#104 = ALTURA DO CHANFRO NA PAREDE = C X TAN B) ;\n(#106 = Z DA FRESA NA VOLTA ATUAL) ;\n(#107 = RAIO DO CENTRO DA FRESA NA VOLTA ATUAL) ;\n(#108 = 0 ANTES DA PRIMEIRA VOLTA - 1 DEPOIS) ;\n(#111 = PASSO NO RAIO A CADA VOLTA = Q / TAN B) ;\nIF [#3 LE 0] THEN #3000 = 261 (C INVALIDO) ;\nIF [#20 LE 0] THEN #3000 = 262 (T INVALIDO) ;\n#102 = 45 ;\nIF [#2 NE #0] THEN #102 = #2 ;\nIF [#102 LE 0] THEN #3000 = 263 (B INVALIDO) ;\nIF [#102 GE 90] THEN #3000 = 263 (B INVALIDO) ;\nIF [#7 LE #20] THEN #3000 = 266 (D TEM QUE SER MAIOR QUE T - FRESA NAO ENTRA NO FURO) ;\nIF [#3 GT #20] THEN #3000 = 267 (C MAIOR QUE T - A FRESA NAO ALCANCA A PAREDE) ;\nIF [#17 LE 0] THEN #3000 = 269 (Q INVALIDO - INFORME O PASSE EM Z) ;\n#104 = #3 * TAN[#102] ;\n#111 = #17 / TAN[#102] ;\n#100 = #7 / 2 ;\n#103 = #3 ;\n#108 = 0 ;\nG0 X#24 Y#25 ;\nG0 Z[#23 + #18] ;\n(N10 = CADA POSICAO DA QUINA - DESCE PELA LINHA DO CHANFRO ATE A PAREDE) ;\nN10 #103 = #103 - #111 ;\nIF [#103 GT 0.001] GOTO 20 ;\n#103 = 0 ;\nN20 #107 = #100 + #103 - #20 / 2 ;\n#106 = #23 - #104 + #103 * TAN[#102] ;\nIF [#108 NE 0] GOTO 30 ;\nG1 Z#106 F#9 ;\n#108 = 1 ;\n(N30 = VAI PARA A LINHA DO CHANFRO E FAZ A VOLTA COMPLETA) ;\nN30 G1 X[#24 + #107] Z#106 F#9 ;\nG3 X[#24 + #107] Y#25 I[-#107] F#9 ;\nIF [#103 GT 0] GOTO 10 ;\nG1 X#24 F#9 ;\nG0 Z[#23 + #18] ;\nM99 ;\n%",
    "key": "1628"
   }
  ],
  "presets": [
   {
    "label": "Furo D35 - chanfro 2 x 45° (Q0.5)",
    "call": "G65 P1628 X0 Y0 D35. W0 C2. B45 Q0.5 T28. R5. F800."
   },
   {
    "label": "Chanfro 3 a 30° (Q0.3)",
    "call": "G65 P1628 X0 Y0 D35. W0 C3. B30 Q0.3 T28. R5. F800."
   }
  ],
  "notes": [
   "Fresa de topo reta: o corretor de comprimento fica na ponta da fresa. O furo já precisa estar usinado.",
   "C = largura do chanfro no topo, medida no raio a partir da parede. B = ângulo em relação ao topo, de 1 a 89 (sem B usa 45).",
   "Q pequeno = acabamento melhor: entre as voltas sobra um degrau de até Q de altura.",
   "D tem que ser maior que T, e C não pode ser maior que T."
  ],
  "stockExpr": "({shape:'round', d:L.D+60, cx:L.X||0, cy:L.Y||0, top:L.W||0, bottom:(L.W||0)-(L.C||2)*Math.tan((L.B||45)*Math.PI/180)-20, tool:L.T, holeD:L.D, holeZ:(L.W||0)-(L.C||2)*Math.tan((L.B||45)*Math.PI/180)-20})"
 },
 {
  "id": "p-rosca",
  "cat": "param",
  "num": 33,
  "title": "Rosca M16 em 12 furos no círculo",
  "status": "aprovado",
  "desc": "Fresamento de rosca descendo da face (G2), passes radiais de #2 até o raio final #1, em todos os furos do PCD.",
  "main": "%\nO0033 (ROSCA M16 X 12 FUROS EM CIRCULO) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 1 ;\n#2 = 0.25 ;\n#3 = 0 ;\n#4 = 2 ;\n#5 = -30 ;\n#6 = 187.5 ;\n#7 = 15 ;\n#8 = 30 ;\n#9 = 360 ;\n#10 = 0 ;\n#11 = 0 ;\n#12 = 0 ;\n#13 = 24 ;\nT#13 ;\nM6 ;\nS1800 M3 ;\nG0 G43 H#13 Z100. ;\nM8 ;\nN10 #10 = #6 * COS[#7] ;\n#11 = #6 * SIN[#7] ;\nG52 X#10 Y#11 ;\nG0 X0 Y0 ;\nG0 Z5. ;\nN15 #12 = #12 + #2 ;\n#3 = 0 ;\nG1 Z#3 F500 ;\nG1 X#12 Y0 F25 ;\nN20 #3 = #3 - #4 ;\nG2 X#12 Y0 Z#3 I-#12 J0 F30 ;\nIF [#3 GT #5] GOTO 20 ;\nG1 X0 Y0 F200 ;\nG0 Z5. ;\nIF [#12 LT #1] GOTO 15 ;\nG0 Z50. ;\n#7 = #7 + #8 ;\n#12 = 0 ;\nIF [#7 LT #9] GOTO 10 ;\nG0 Z100. ;\nG52 X0 Y0 ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   4,
   5,
   6,
   7,
   8,
   9,
   13
  ],
  "labels": {
   "1": "Raio final da trajetória (desbaste)",
   "2": "Incremento radial por passe",
   "3": "Z atual (começa na face)",
   "4": "Passo da rosca (descida por volta)",
   "5": "Profundidade final",
   "6": "Raio do PCD",
   "7": "Ângulo do 1º furo",
   "8": "Incremento do ângulo",
   "9": "Ângulo limite (360)",
   "10": "X do furo (calculado)",
   "11": "Y do furo (calculado)",
   "12": "Raio atual (começa no inicial)",
   "13": "Número da ferramenta"
  },
  "notes": [
   "Para ajustar a medida da rosca: altere #1 e rode de novo. Acabamento em 1 passe: #1 = raio exato, #2 = mesmo valor, #12 = 0.",
   "O sobremetal precisa ser múltiplo do incremento para o último passe parar exato.",
   "O F é do centro da fresa: na aresta o avanço é bem maior."
  ],
  "toolDia": 13.85,
  "stock": "round",
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:2*V[6]+60, cx:0, cy:0, top:0, bottom:V[5]-10, tool:13.85})"
 },
 {
  "id": "p-helice",
  "cat": "param",
  "num": 3,
  "title": "Hélice em furo central",
  "status": "revisado",
  "desc": "Fresa desce em hélice (G3) dentro do furo, #6 por volta, e faz uma volta plana no fundo.",
  "main": "%\nO0003 (HELICOIDAL FURO CENTRAL) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 35.0 (DIAMETRO DO FURO) ;\n#2 = 16.0 (DIAMETRO DA FERRAMENTA) ;\n#3 = #1 - #2 ;\n#4 = #3 / 2.0 ;\n#5 = 0.0 (Z INICIAL) ;\n#6 = 0.5 (INCREMENTO EM Z POR VOLTA) ;\n#7 = -25.5 (PROFUNDIDADE FINAL) ;\n#8 = 1 (NUMERO DA FERRAMENTA) ;\nT#8 ;\nM6 ;\nS3000 M3 ;\nG0 G43 H#8 Z100. ;\nG0 X0 Y0 ;\nM8 ;\nG0 Z2.0 ;\nG1 Z#5 F300 ;\nG1 X#4 Y0 F400 ;\nN20 ;\n#5 = #5 - #6 ;\nG3 X#4 Y0 Z#5 I-#4 J0 F400 ;\nIF [#5 GT #7] GOTO 20 ;\nG3 X#4 Y0 I-#4 J0 (VOLTA DE ACABAMENTO NO FUNDO) ;\nG1 X0 Y0 F500 ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   6,
   7,
   8
  ],
  "notes": [
   "Cabeçalho e final atualizados para o padrão atual pelo app.",
   "Profundidade 25,5 (desenho 25,4) para o incremento 0,5 fechar exato."
  ],
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:V[1]+40, cx:G.x, cy:G.y, top:V[5]||0, bottom:V[7]-10, tool:V[2]})"
 },
 {
  "id": "p-3bolsas",
  "cat": "param",
  "num": 2,
  "title": "3 bolsões em círculo (hélice)",
  "status": "revisado",
  "desc": "A mesma hélice repetida em vários bolsões num PCD, com G52 no centro de cada um.",
  "main": "%\nO0002 (HELICOIDAL 3 BOLSAS D35) ;\nG21 G40 G90 G94 ;\nG54 ;\nG52 X0 Y0 ;\n#1 = 35.0 (DIAMETRO DA BOLSA) ;\n#2 = 16.0 (DIAMETRO DA FERRAMENTA) ;\n#3 = #1 - #2 ;\n#4 = #3 / 2.0 ;\n#5 = 0.0 (Z INICIAL) ;\n#6 = 0.5 (INCREMENTO EM Z POR VOLTA) ;\n#7 = -25.5 (PROFUNDIDADE FINAL) ;\n#8 = 1 (NUMERO DA FERRAMENTA) ;\n#9 = 21.939 (RAIO DO PCD) ;\n#10 = 90.0 (ANGULO INICIAL FURO 1) ;\n#11 = 120.0 (INCREMENTO DO ANGULO) ;\n#14 = 360.0 (ANGULO LIMITE) ;\nT#8 ;\nM6 ;\nS3000 M3 ;\nG0 G43 H#8 Z100. ;\nM8 ;\nN10 (INICIO DO CICLO DO FURO) ;\n#12 = #9 * COS[#10] ;\n#13 = #9 * SIN[#10] ;\nG52 X#12 Y#13 ;\nG0 X0 Y0 ;\nG0 Z2.0 ;\nG1 Z#5 F300 ;\nG1 X#4 Y0 F400 ;\nN20 ;\n#5 = #5 - #6 ;\nG3 X#4 Y0 Z#5 I-#4 J0 F400 ;\nIF [#5 GT #7] GOTO 20 ;\nG3 X#4 Y0 I-#4 J0 (VOLTA DE ACABAMENTO NO FUNDO) ;\nG1 X0 Y0 F500 ;\nG0 Z100. ;\n#10 = #10 + #11 ;\n#5 = 0.0 (RESET DO Z PARA O PROXIMO FURO) ;\nIF [#10 LT #14] GOTO 10 ;\nM9 ;\nG52 X0 Y0 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   6,
   7,
   8,
   9,
   10,
   11,
   14
  ],
  "notes": [
   "Cabeçalho e final atualizados para o padrão atual pelo app.",
   "Leitura do desenho (raio do PCD 21,939) não confirmada."
  ],
  "stock": "round",
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:2*V[9]+V[1]+30, cx:0, cy:0, top:V[5]||0, bottom:V[7]-10, tool:V[2]})"
 },
 {
  "id": "p-quadrado",
  "cat": "param",
  "num": 6,
  "title": "Quadrado externo em espiral",
  "status": "revisado",
  "desc": "Contorno externo de quadrado descendo 1/4 do incremento em cada lado; volta plana no fundo.",
  "main": "%\nO0006 (QUADRADO EXTERNO EM ESPIRAL) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 100.0 (LADO DO QUADRADO) ;\n#2 = 25.0 (DIAMETRO DA FERRAMENTA) ;\n#3 = #1 + #2 ;\n#4 = #3 / 2.0 ;\n#5 = 0.0 (Z INICIAL NA FACE) ;\n#6 = 1.0 (INCREMENTO EM Z POR VOLTA) ;\n#7 = #6 / 4.0 (INCREMENTO EM Z POR LADO) ;\n#8 = -20.0 (PROFUNDIDADE FINAL) ;\nT1 ;\nM6 ;\nS1600 M3 ;\nG0 G43 H1 Z100. ;\nG0 X-#4 Y-#4 ;\nM8 ;\nG0 Z2.0 ;\nG1 Z#5 F500 ;\nN10 ;\n#5 = #5 - #7 ;\nG1 X-#4 Y#4 Z#5 F1000 ;\n#5 = #5 - #7 ;\nG1 X#4 Y#4 Z#5 ;\n#5 = #5 - #7 ;\nG1 X#4 Y-#4 Z#5 ;\n#5 = #5 - #7 ;\nG1 X-#4 Y-#4 Z#5 ;\nIF [#5 GT #8] GOTO 10 ;\nG1 X-#4 Y#4 ;\nG1 X#4 Y#4 ;\nG1 X#4 Y-#4 ;\nG1 X-#4 Y-#4 ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   6,
   8
  ],
  "notes": [
   "A profundidade precisa ser múltipla do incremento.",
   "Escrito antes das regras da ferramenta em variável e da aproximação Z50/X afastado."
  ],
  "stockExpr": "({shape:'rect', lx:V[1]+V[2], ly:V[1]+V[2], cx:0, cy:0, top:V[5]||0, bottom:V[8]-10, tool:V[2]})"
 },
 {
  "id": "p-sextavados",
  "cat": "param",
  "num": 7,
  "title": "Dois sextavados externos em espiral",
  "status": "revisado",
  "desc": "Sextavado menor (cantos no X) e maior (cantos no Y) no mesmo programa; IF compara o Z do fim da volta (exato).",
  "main": "%\nO0007 (DOIS SEXTAVADOS EXTERNOS EM ESPIRAL) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 36.0 (SEXTAVADO MENOR ENTRE FACES) ;\n#2 = 46.0 (SEXTAVADO MAIOR ENTRE FACES) ;\n#3 = 25.0 (DIAMETRO DA FERRAMENTA) ;\n#4 = #1 / 2.0 + #3 / 2.0 (MENOR: CENTRO ATE FACE DA TRAJETORIA) ;\n#5 = #4 / SIN[60.0] (MENOR: CENTRO ATE CANTO DA TRAJETORIA) ;\n#6 = #5 * COS[60.0] (MENOR: METADE DO CANTO) ;\n#7 = #2 / 2.0 + #3 / 2.0 (MAIOR: CENTRO ATE FACE DA TRAJETORIA) ;\n#8 = #7 / SIN[60.0] (MAIOR: CENTRO ATE CANTO DA TRAJETORIA) ;\n#9 = #8 * COS[60.0] (MAIOR: METADE DO CANTO) ;\n#10 = 0.0 (Z INICIAL NA FACE) ;\n#11 = 1.0 (INCREMENTO EM Z POR VOLTA) ;\n#12 = #11 / 6.0 (INCREMENTO EM Z POR LADO) ;\n#13 = 0.0 (Z ATUAL DO LADO) ;\n#14 = -17.0 (FIM DO MENOR E INICIO DO MAIOR) ;\n#15 = -30.0 (FIM DO MAIOR) ;\n#16 = 1 (NUMERO DA FERRAMENTA) ;\nT#16 ;\nM6 ;\nS1600 M3 ;\nG0 G43 H#16 Z100. ;\nG0 X#5 Y0 ;\nM8 ;\nG0 Z2.0 ;\nG1 Z#10 F500 ;\nN10 ;\n#13 = #10 - #12 ;\nG1 X#6 Y-#4 Z#13 F1000 ;\n#13 = #13 - #12 ;\nG1 X-#6 Y-#4 Z#13 ;\n#13 = #13 - #12 ;\nG1 X-#5 Y0 Z#13 ;\n#13 = #13 - #12 ;\nG1 X-#6 Y#4 Z#13 ;\n#13 = #13 - #12 ;\nG1 X#6 Y#4 Z#13 ;\n#10 = #10 - #11 ;\nG1 X#5 Y0 Z#10 ;\nIF [#10 GT #14] GOTO 10 ;\nG1 X#6 Y-#4 ;\nG1 X-#6 Y-#4 ;\nG1 X-#5 Y0 ;\nG1 X-#6 Y#4 ;\nG1 X#6 Y#4 ;\nG1 X#5 Y0 ;\nG0 Z2.0 ;\n#10 = #14 ;\nG0 X0 Y#8 ;\nG0 Z[#10 + 2.0] ;\nG1 Z#10 F500 ;\nN20 ;\n#13 = #10 - #12 ;\nG1 X#7 Y#9 Z#13 F1000 ;\n#13 = #13 - #12 ;\nG1 X#7 Y-#9 Z#13 ;\n#13 = #13 - #12 ;\nG1 X0 Y-#8 Z#13 ;\n#13 = #13 - #12 ;\nG1 X-#7 Y-#9 Z#13 ;\n#13 = #13 - #12 ;\nG1 X-#7 Y#9 Z#13 ;\n#10 = #10 - #11 ;\nG1 X0 Y#8 Z#10 ;\nIF [#10 GT #15] GOTO 20 ;\nG1 X#7 Y#9 ;\nG1 X#7 Y-#9 ;\nG1 X0 Y-#8 ;\nG1 X-#7 Y-#9 ;\nG1 X-#7 Y#9 ;\nG1 X0 Y#8 ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   3,
   11,
   14,
   15,
   16
  ],
  "notes": [
   "Conferir orientação na fixação e o bruto (D41,57 e D53,12)."
  ],
  "stock": "round",
  "stockLayers": [
   {
    "d": 41.57,
    "top": 0
   },
   {
    "d": 53.12,
    "top": -17
   }
  ],
  "stockExpr": "({shape:'round', d:V[2]/Math.cos(Math.PI/6), cx:0, cy:0, layers:[{d:V[1]/Math.cos(Math.PI/6), top:V[10]||0},{d:V[2]/Math.cos(Math.PI/6), top:V[14]}], top:V[10]||0, bottom:V[15]-10, tool:V[3]})"
 },
 {
  "id": "p-interp-chanfro",
  "cat": "param",
  "num": 8,
  "title": "Interpolação D48 e chanfro 30°",
  "status": "nao-testado",
  "desc": "Contorno externo D48 descendo em G2 e chanfro de 30° em degraus (G1 + círculo plano).",
  "main": "%\nO0008 (INTERPOLACAO D48 E CHANFRO 30 GRAUS) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 48.0 (DIAMETRO DA INTERPOLACAO) ;\n#2 = 28.3 (DIAMETRO DA FERRAMENTA) ;\n#3 = #1 / 2.0 + #2 / 2.0 (RAIO DA TRAJETORIA DO CENTRO DA FRESA) ;\n#4 = -17.0 (Z INICIAL) ;\n#5 = 0.5 (INCREMENTO EM Z POR VOLTA) ;\n#6 = -19.5 (FIM DA INTERPOLACAO) ;\n#7 = 0.125 (INCREMENTO EM Z NO CHANFRO) ;\n#8 = -21.0 (FIM DO CHANFRO) ;\n#9 = #7 / TAN[30.0] (AUMENTO DO RAIO POR VOLTA NO CHANFRO) ;\n#10 = 1 (NUMERO DA FERRAMENTA) ;\nT#10 ;\nM6 ;\nS1600 M3 ;\nG0 G43 H#10 Z100. ;\nG0 X#3 Y0 ;\nM8 ;\nG0 Z[#4 + 2.0] ;\nG1 Z#4 F500 ;\nN10 ;\n#4 = #4 - #5 ;\nG2 X#3 Y0 Z#4 I-#3 J0 F1000 ;\nIF [#4 GT #6] GOTO 10 ;\nG2 X#3 Y0 I-#3 J0 ;\nN20 ;\n#4 = #4 - #7 ;\n#3 = #3 + #9 ;\nG1 X#3 Z#4 F500 ;\nG2 X#3 Y0 I-#3 J0 F1000 ;\nIF [#4 GT #8] GOTO 20 ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   4,
   5,
   6,
   7,
   8,
   10
  ],
  "notes": [
   "Rodar depois do sextavado maior. Para acabamento melhor, #7 = 0.0625."
  ],
  "stock": "round",
  "top": -17,
  "stockExpr": "({shape:'round', d:V[1]+V[2]*0.9, cx:0, cy:0, top:V[4], bottom:V[8]-10, tool:V[2]})"
 },
 {
  "id": "p-raio-r10",
  "cat": "param",
  "num": 5,
  "title": "Raio R10 na aresta (do Siemens)",
  "status": "problema",
  "desc": "Arredonda a aresta em passos de 1°, vai e volta em X.",
  "main": "%\nO0005 (RAIO R10 PARAMETRIZADO) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 0 (Y ATUAL) ;\n#2 = 0 (Z ATUAL) ;\n#3 = 1 (ANGULO ATUAL) ;\n#4 = 10 (RAIO) ;\n#5 = 90 (ANGULO FINAL) ;\n#6 = 16 (NUMERO DA FERRAMENTA) ;\nT#6 ;\nM6 ;\nS1600 M3 ;\nG0 G43 H#6 Z100. ;\nG52 X0 Y-35. ;\nG0 X30. Y0 ;\nG0 Z15. ;\nN10 ;\n#1 = SIN[#3] * #4 ;\n#2 = [COS[#3] - 1] * #4 ;\nG1 Y-#1 Z#2 F3000 ;\nG1 X-230. F3000 ;\n#3 = #3 + 1 ;\n#1 = SIN[#3] * #4 ;\n#2 = [COS[#3] - 1] * #4 ;\nG1 Y-#1 Z#2 F3000 ;\nG1 X30. ;\n#3 = #3 + 1 ;\nIF [#3 LE #5] GOTO 10 ;\nG0 Z100. ;\nG52 X0 Y0 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   3,
   4,
   5,
   6
  ],
  "notes": [
   "Na simulação da máquina parou com alarme PS0127 (causa em aberto).",
   "Para raio na aresta, prefira a macro O1618 (aprovada no côncavo)."
  ],
  "toolDia": 50
 },
 {
  "id": "p-raio-fundo",
  "cat": "param",
  "num": 9,
  "title": "Raio R3 no fundo do furo",
  "status": "nao-testado",
  "desc": "Raio no fundo de um furo com fresa de canto reto: G1 até o ponto da curva e círculo G3 plano, de 3° em 3°.",
  "main": "%\nO0009 (RAIO R3 NO FUNDO DO FURO) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 100.0 (DIAMETRO DO FURO) ;\n#2 = 32.0 (DIAMETRO DA FERRAMENTA) ;\n#3 = [#1 - #2] / 2.0 (RAIO DA TRAJETORIA NA PAREDE) ;\n#4 = 3.0 (RAIO NO FUNDO) ;\n#5 = #3 - #4 (RAIO DA TRAJETORIA NO FUNDO) ;\n#6 = -42.0 (Z DO INICIO DO RAIO) ;\n#7 = 3.0 (INCREMENTO DO ANGULO EM GRAUS) ;\n#8 = 3.0 (ANGULO ATUAL) ;\n#9 = 0.0 (RAIO ATUAL DA TRAJETORIA) ;\n#10 = 0.0 (Z ATUAL) ;\n#11 = 12 (NUMERO DA FERRAMENTA) ;\nT#11 ;\nM6 ;\nS1800 M3 ;\nG0 G43 H#11 Z100. ;\nG52 X-335. Y0 ;\nG0 X0 Y0 ;\nM8 ;\nG0 Z[#6 + 2.0] ;\nG1 Z#6 F500 ;\nN10 ;\n#9 = #5 + #4 * COS[#8] ;\n#10 = #6 - #4 * SIN[#8] ;\nG1 X#9 Z#10 F500 ;\nG3 X#9 Y0 I-#9 J0 F1000 ;\n#8 = #8 + #7 ;\nIF [#8 LE 90.0] GOTO 10 ;\nG1 X0 Y0 F1000 ;\nG0 Z100. ;\nG52 X0 Y0 ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   1,
   2,
   4,
   6,
   7,
   11
  ],
  "notes": [
   "Valores de diâmetro do furo, da fresa e X-335 são de exemplo: troque pelos reais."
  ],
  "top": -42,
  "stockMargin": true,
  "stockExpr": "({shape:'round', d:V[1]+60, cx:G.x, cy:G.y, top:0, bottom:V[6]-15, tool:V[2], holeD:V[1], holeZ:V[6]})"
 },
 {
  "id": "p-raio-mancal",
  "cat": "param",
  "num": 10,
  "title": "Raio R20 no fundo do mancal (do Fagor)",
  "status": "nao-testado",
  "desc": "Perfil em X/Z de 1° em 1° com vai e volta em Y.",
  "main": "%\nO0010 (RAIO R20 NO FUNDO DO MANCAL) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 0 (X ATUAL) ;\n#2 = 0 (Z ATUAL) ;\n#3 = 1 (ANGULO ATUAL) ;\n#4 = 20 (RAIO) ;\n#5 = 90 (ANGULO FINAL) ;\n#6 = -100 (Z DO INICIO DO RAIO) ;\n#7 = 1 (NUMERO DA FERRAMENTA) ;\nT#7 ;\nM6 ;\nS1600 M3 ;\nG0 G43 H#7 Z100. ;\nG52 X-219.9 ;\nG0 X20. Y120 ;\nG0 Z[#6 + 2] ;\nG1 Z#6 F500 ;\nN10 ;\n#1 = COS[#3] * #4 ;\n#2 = #6 - SIN[#3] * #4 ;\nG1 X#1 Z#2 F500 ;\nG1 Y-115 F1800 ;\n#3 = #3 + 1 ;\n#1 = COS[#3] * #4 ;\n#2 = #6 - SIN[#3] * #4 ;\nG1 X#1 Z#2 F500 ;\nG1 Y130 F1800 ;\n#3 = #3 + 1 ;\nIF [#3 LE #5] GOTO 10 ;\nG0 Y140. ;\nG0 Z100. ;\nG52 X0 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   4,
   5,
   6,
   7
  ],
  "notes": [
   "Atenção: Y-115 e Y130 estão sem ponto decimal. Em alguns comandos isso vira 0,115 e 0,130 mm. Confira antes de rodar.",
   "S1600 e T1 são de exemplo."
  ],
  "toolDia": 20,
  "top": -100,
  "stockMargin": true
 }
,
 {
  "id": "p-contorno-aberto",
  "cat": "param",
  "num": 36,
  "title": "Contorno aberto da peça (raios R15 e R220)",
  "status": "revisado",
  "desc": "Contorno externo aberto com G41: sobe a lateral, faz os dois R15, o raio R220 e os chanfros 2x45°, descendo 2,5 por nível até a profundidade final. Entra e sai por fora a 1,5 x o raio da fresa e sobe a Z100. a cada nível.",
  "main": "%\nO0036 (CONTORNO ABERTO DA PECA) ;\nG21 G40 G90 G94 ;\nG54 ;\n#1 = 0 (Z ATUAL - COMECA NA FACE) ;\n#2 = 2.5 (INCREMENTO EM Z POR NIVEL) ;\n#3 = -52.5 (PROFUNDIDADE FINAL) ;\n#4 = 50 (DIAMETRO DA FERRAMENTA) ;\n#5 = #4 / 2 (RAIO DA FERRAMENTA) ;\n#6 = #5 * 1.5 (DISTANCIA DE ENTRADA E SAIDA - 1.5 X RAIO) ;\n#7 = 1 (NUMERO DA FERRAMENTA) ;\nT#7 ;\nM6 ;\nS1400 M3 ;\nG0 G43 H#7 Z100. ;\nG0 X-#5 Y-#6 ;\nM8 ;\nG0 Z5. ;\nN10 (INICIO DE CADA NIVEL) ;\n#1 = #1 - #2 ;\nG0 Z[#1 + 1] ;\nG1 Z#1 F500 ;\nG1 G41 D#7 X0 Y0 F2000 ;\nG1 X0 Y95. ;\nG2 X15. Y110. I15. J0 ;\nG1 X27. Y110. ;\nG2 X39. Y104. I0 J-15. ;\nG3 X215. Y16. I176. J132. ;\nG1 X248. Y16. ;\nG1 X250. Y14. ;\nG1 X250. Y2. ;\nG1 X248. Y0 ;\nG1 G40 X[248 + #5] Y-#6 ;\nG0 Z100. ;\nG0 X-#5 Y-#6 ;\nIF [#1 GT #3] GOTO 10 ;\nG0 Z100. ;\nM9 ;\nG53 H0 Z0 ;\nM30 ;\n%",
  "edit": [
   2,
   3,
   4,
   7
  ],
  "labels": {
   "1": "Z atual (começa na face)",
   "2": "Incremento em Z por nível",
   "3": "Profundidade final",
   "4": "Diâmetro da ferramenta",
   "5": "Raio da ferramenta (calculado)",
   "6": "Distância de entrada e saída (1,5 x raio)",
   "7": "Número da ferramenta"
  },
  "notes": [
   "Usa compensação G41 D#7: o raio da fresa (D50 = 25) tem que estar no corretor D da ferramenta.",
   "A profundidade precisa ser múltipla do incremento (52,5 / 2,5 = 21 níveis).",
   "A entrada e a saída ficam a 1,5 x o raio da fresa (#6), calculadas pelo diâmetro em #4."
  ],
  
  "stock": "rect",
  "top": 0,
  "stockExpr": "({shape:'rect', lx:256, ly:113, cx:125, cy:56.5, top:0, bottom:V[3]-5, tool:V[4]})"
 }
];
window.RULES = [
 {
  "t": "Cabeçalho e final",
  "items": [
   "Cabeçalho: G21 G40 G90 G94 e na linha seguinte G54. Sem G17, G49 e G80.",
   "Final: G0 Z100. / M9 / G53 H0 Z0 / M30. Sem M5, G49 e G91 G28 (o M30 já para o fuso).",
   "Se usou G52, cancelar antes do final com G52 X0 Y0.",
   "T.. e M6 sempre em linhas separadas (na Romi D1250 V6 dá alarme se ficam juntos).",
   "Todo bloco termina com ; (macros e parametrizados), e o comentário vem antes do ; : #1 = 35 (DIAMETRO DO FURO) ;"
  ]
 },
 {
  "t": "Macros (G65)",
  "items": [
   "Subprogramas numerados a partir de O1611 (O16xx). Programas principais O00xx.",
   "Cabeçalho do sub na mesma linha do número: O1625 (COMENTARIO) ; e nunca ; antes do comentário.",
   "Todo comentário entre parênteses seguido de ; (sem parênteses dentro do comentário).",
   "Programa principal limpo: só o comentário do cabeçalho. A explicação das letras e um exemplo da chamada ficam só no sub, no bloco (LETRAS DO G65 Pxxxx).",
   "Principal padrão: % / O00xx (COMENTARIO) ; / G21 G40 G90 G94 ; / G54 ; / T10 ; / M6 ; / G0 X0 Y0 ; / S1200 M3 ; / G43 H10 Z120. ; / M8 ; / G65 P16xx ... ; / G0 Z100. ; / M9 ; / G53 H0 Z0 ; / M30 ; / %.",
   "Padrão das letras: X Y = centro, W = Z inicial (face), Z = Z final, K = descida por volta, T = diâmetro da ferramenta, Q = passo lateral ou incremento radial, R = plano de segurança, F = avanço.",
   "Alarme da macro: IF [condição] THEN #3000 = n (TEXTO) ; com faixa própria por macro (101-104 faceamento, 111 PCD, 121-123 hélice, 151-154 retangular, 161-163 polígono, 171-176 raio, 211-216 canal, 291-299 raio entre diâmetros).",
   "Letra vazia não é igual a 0: para Q usar IF [#17 EQ 0] THEN #17 = #9 ; e IF [#17 EQ #0] THEN #17 = #9 ;.",
   "Cálculos em #100 a #199; em macro que chama outra, usar #27 a #33 (locais) para não ser apagado.",
   "Em chamada aninhada, evitar as letras I, E, U e V (problema visto na máquina: o I caiu no #7). Em macro nova, usar K ou V para passo de rosca em vez de I.",
   "Valores com casas decimais no G65 sempre com ponto (X215.). Um ponto decimal por número.",
   "Depois de G2/G3 sempre voltar com G1 nos movimentos lineares seguintes.",
   "Não depender de Block Delete (/): trava a Romi."
  ]
 },
 {
  "t": "Parametrizados simples (sem G65)",
  "items": [
   "Variáveis # no início, em sequência (#1, #2, #3...), só as necessárias: medida da peça em #1, diâmetro da ferramenta em #2, trajetória em #3.",
   "Número da ferramenta numa variável própria, a última da lista, usada em T#n e G43 H#n.",
   "Sem .0 nas variáveis e nas contas (#1 = 100, [#1 - #2] / 2). Coordenadas digitadas direto no bloco continuam com ponto (Z100.).",
   "Uma variável só para (diâmetro do furo - diâmetro da fresa) / 2, com colchete.",
   "Reset com número digitado (#5 = 0), sem variável extra.",
   "Um único N e um único IF ... GOTO por laço. Sem WHILE/DO, FUP, THEN, contador de voltas e G65.",
   "Incremento de Z direto numa variável. Nunca folga (+ 0.001) no IF: escolher incremento que fecha exato (0,5 / 0,25 / 0,125 / 0,0625).",
   "Em contornos de vários lados: #5 = #5 - #7 antes de cada G1, com #7 = #6 / n. Se a divisão não é exata (sextavado), comparar o Z do fim da volta e usar outra variável para o Z de cada lado.",
   "Furos em círculo: ângulo limite sempre 360 (vale quando o ângulo inicial é menor que o incremento; senão limite = inicial + 360).",
   "Desbaste com valores redondos; o valor exato só no acabamento de 1 passe.",
   "Comentários entre parênteses, curtos e sem acentos."
  ]
 },
 {
  "t": "Aproximação e profundidade",
  "items": [
   "Z inicial na face (Z0) e descendo, nunca começando do fundo (também na rosca).",
   "Ao terminar um contorno, subir para Z50. (não Z2).",
   "Em XY, o G0 vai primeiro 20 mm além do ponto inicial, na mesma linha de entrada (ex.: G0 X[#5 + 20] Y0), desce em Z e entra com G1. Em furo ou bolsão, o ponto afastado é o centro."
  ]
 },
 {
  "t": "Regras técnicas",
  "items": [
   "Contorno externo concordante: G2. Dentro de furo ou bolsão: G3. Rosca interna à direita descendo: G2 (discordante, preferido pelo operador).",
   "PCD: X = R * COS[ângulo], Y = R * SIN[ângulo]; G52 leva a origem ao centro do furo e não acumula.",
   "Sextavado: entre cantos = entre faces / COS[30]. d = entre faces / 2 + raio da fresa; canto R = d / SIN[60]; metade do canto R * COS[60].",
   "O FANUC dá alarme se o raio do início e do fim de um G2/G3 forem diferentes: raios e chanfros saem em degraus (G1 até o ponto + círculo completo plano).",
   "Chanfro de 30° medido na horizontal: Δraio = Δz / TAN[30].",
   "Raio com fresa de canto reto: deslocamento = SIN[ângulo] * R e Z = [COS[ângulo] - 1] * R.",
   "Em rosca e raios em volta do furo o F é do centro da fresa; na aresta o avanço é bem maior.",
   "G68 é opção do comando (cancela com G69). PS0127 = bloco com comando NC e macro misturados."
  ]
 },
 {
  "t": "Arquivo e envio",
  "items": [
   "Texto puro (.txt ou .nc) com % na primeira e na última linha, ; no fim de cada bloco, sem linhas em branco e sem acentos.",
   "Nome com o número O (ex.: O0033.txt). O número não pode já existir na máquina.",
   "Pendrive FAT32 na porta USB do painel. Em EDIT: PROG, (OPRT), READ, número e EXEC.",
   "Primeira peça em Single Block com avanço reduzido; primeira conferência em Machine Lock ou sem material."
  ]
 }
];
