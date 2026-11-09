TITLE = 'Formation sur les macros FANUC'
EX_NAMES = {1: 'Exercice 1', 2: 'Exercice 2', 3: 'Exercice 3', 4: 'Exercice 4', 5: 'Exercice 5', 6: 'Exercice 6', 7: 'Exercice 7', 8: 'Exercice 8', 9: 'Défi'}
ANS = {
 1: '<p><b>(a)</b> #100 = 40/2 = 20; #101 = 100/2 + 20 + 5 = <b>75</b>. Le centre de la fraise commence à <b>X-75</b> et va jusqu’à X75.</p>'
    '<p><b>(b)</b> #102 = 60/2 - 20 = 10. Première ligne Y-10; en ajoutant Q30, on aurait Y20, qui dépasse la limite, donc la dernière est à <b>Y10</b>. Ça fait <b>2 lignes</b> : Y-10 et Y10.</p>'
    '<p><b>(c)</b> De W0 à Z-1 avec K1 : <b>1 passe</b>.</p>',
 2: '<p>R = J/2 = 50. Angle entre les trous = 360/8 = 45°.</p>'
    '<p><b>Trou 2</b> : θ = 0 + 1×45 = 45° → X = 50×COS45 = <b>35,355</b>, Y = 50×SIN45 = <b>35,355</b>.</p>'
    '<p><b>Trou 3</b> : θ = 90° → <b>X0</b>, <b>Y50</b>.</p>',
 3: '<p>Rayon de la trajectoire = (D - T)/2 = (30 - 16)/2 = <b>7</b>.</p>'
    '<p>De Z0 à Z-10 avec K2.5 : Z-2.5, -5, -7.5, -10 = <b>4 tours en descendant</b>, plus <b>1 tour à plat</b> au fond.</p>',
 4: '<p>Décalage = C - C×SIN θ = 5 - 5×0,5 = <b>2,5</b>.</p>'
    '<p>Z = W - C + C×COS θ = 0 - 5 + 5×0,866 = <b>-0,670</b>.</p>',
 5: '<p>Hauteur sur la face = C×TAN B = 2×0,577 = <b>1,155</b>.</p>'
    '<p>Passes = C/Q = 2/0,25 = <b>8 passes</b>.</p>'
    '<p>Marche ≈ Q×(1 - TAN²B)/2 = 0,25×(1 - 0,333)/2 ≈ <b>0,083 mm</b>.</p>',
 6: '<ul><li>(a) B60 sur O1623 : <b>alarme 202</b> (B plus grand que 45).</li>'
    '<li>(b) H90 sur O1618 : <b>alarme 173</b> (pas en degrés plus grand ou égal à 90).</li>'
    '<li>(c) Z1 avec W0 sur O1611 : <b>alarme 101</b> (Z final plus haut que le dessus).</li></ul>',
 7: '<p>Sur O1617, D est le diamètre qui passe par les <b>coins</b>. Pour un hexagone : D = sur plats / COS 30° = 30 / 0,866 = <b>34,641</b>.</p>'
    '<p>Règle générale : D = sur plats / COS(180/B).</p>',
 8: '<p>1er appel : #500 = <b>1</b>. 2e : <b>2</b>. 3e : <b>3</b> → 3 n’est pas plus petit que Q3, donc la machine <b>arrête au 3e appel</b> avec « LOTE COMPLETO » (lot complet). Remettez à zéro avec <code>G65 P1620 Q0</code>.</p>',
 9: '<p>Attention : <b>P ne peut pas être une lettre d’argument</b> dans le G65 (P est le numéro du programme). Utilisez une autre lettre pour l’espacement, par exemple <b>I</b>.</p>'
    '<pre class="code">O1690 (TROUS EN LIGNE) ;\n(LETTRES DU G65 P1690) ;\n(X Y = PREMIER TROU) ;\n(B = NOMBRE DE TROUS  I = ESPACEMENT EN X) ;\n(W = DESSUS  Z = Z FINAL  R = DEGAGEMENT  F = AVANCE) ;\nIF [#2 LT 1] THEN #3000 = 281 (B INVALIDE) ;\nIF [#26 GE #23] THEN #3000 = 282 (Z FINAL PLUS HAUT QUE LE DESSUS) ;\n#100 = 1 ;\nN10 #101 = #24 + [#100 - 1] * #4 ;\nG99 G81 X#101 Y#25 Z#26 R[#23 + #18] F#9 ;\nIF [#100 GE #2] GOTO 20 ;\n#100 = #100 + 1 ;\nGOTO 10 ;\nN20 G80 ;\nG98 ;\nM99 ;</pre>'
    '<p>Appel : <code>G65 P1690 X0 Y0 B5 I20. W0 Z-10. R3. F100. ;</code> → 5 trous à X0, 20, 40, 60, 80.</p>',
}
COLA = '''
<h3>Lettres du G65 → variables</h3>
<div class="tw"><table><tr><th>Lettre</th><th>#</th><th>Lettre</th><th>#</th><th>Lettre</th><th>#</th></tr>
<tr><td>A</td><td>#1</td><td>I</td><td>#4</td><td>R</td><td>#18</td></tr>
<tr><td>B</td><td>#2</td><td>J</td><td>#5</td><td>S</td><td>#19</td></tr>
<tr><td>C</td><td>#3</td><td>K</td><td>#6</td><td>T</td><td>#20</td></tr>
<tr><td>D</td><td>#7</td><td>M</td><td>#13</td><td>U</td><td>#21</td></tr>
<tr><td>E</td><td>#8</td><td>Q</td><td>#17</td><td>V</td><td>#22</td></tr>
<tr><td>F</td><td>#9</td><td></td><td></td><td>W</td><td>#23</td></tr>
<tr><td>H</td><td>#11</td><td></td><td></td><td>X Y Z</td><td>#24 #25 #26</td></tr></table></div>
<p>Elles ne peuvent pas être des lettres d’argument : <b>G, L, N, O, P</b>.</p>
<h3>Standard des lettres de l’atelier</h3>
<ul><li><b>X Y</b> centre · <b>W</b> dessus (face) · <b>Z</b> Z final</li><li><b>K</b> descente · <b>T</b> diamètre de la fraise · <b>Q</b> pas latéral</li><li><b>R</b> plan de dégagement · <b>F</b> avance</li></ul>
<h3>Comparaisons</h3>
<div class="tw"><table><tr><th>On écrit</th><th>Veut dire</th></tr><tr><td>EQ</td><td>égal</td></tr><tr><td>NE</td><td>différent</td></tr><tr><td>GT</td><td>plus grand</td></tr><tr><td>GE</td><td>plus grand ou égal</td></tr><tr><td>LT</td><td>plus petit</td></tr><tr><td>LE</td><td>plus petit ou égal</td></tr></table></div>
<h3>Fonctions</h3>
<p><code>SIN COS TAN ATAN SQRT ABS ROUND FIX FUP</code> — angles toujours en <b>degrés</b>. Crochets <code>[ ]</code> au lieu des parenthèses dans les calculs.</p>
<h3>Structures</h3>
<pre class="code">IF [#1 GT 10] GOTO 20 ;
IF [#1 GT 10] THEN #2 = 5 ;
WHILE [#1 LT 10] DO 1 ;
...
END 1 ;
#3000 = 101 (TEXTE DE L ALARME) ;
#3006 = 1 (MESSAGE ET ARRET) ;</pre>
<h3>Plages d’alarmes par macro</h3>
<div class="tw"><table><tr><th>Macro</th><th>Alarmes</th></tr>
<tr><td>O1611 surfaçage</td><td>101–104</td></tr><tr><td>O1612 cercle de perçage</td><td>111</td></tr><tr><td>O1613 hélice</td><td>121–123</td></tr>
<tr><td>O1616 rectangulaire</td><td>151–154</td></tr><tr><td>O1617 polygone</td><td>161–163</td></tr><tr><td>O1618 rayon</td><td>171–176</td></tr>
<tr><td>O1620–O1622 compteur/durée de vie/correction</td><td>191–195</td></tr><tr><td>O1623 chanfrein 90°</td><td>201–208</td></tr><tr><td>O1624 rainure</td><td>211–216</td></tr></table></div>
<h3>Avant d’appuyer sur Cycle Start</h3>
<ul><li>Prise de longueur de l’outil vérifiée (à la pointe, pour une fraise à chanfreiner).</li><li>Premier essai avec Z au-dessus de la pièce (W50 Z49) ou en bloc à bloc.</li><li>Potentiomètre d’avance bas pour la première pièce.</li><li>Simulez d’abord dans l’app : le brut et la trajectoire doivent correspondre au dessin.</li></ul>
'''
QUIZ = [
 ('Dans G65 P1611 X215. ..., la lettre X devient quelle variable dans la macro?', ['#1', '#24', '#100', '#500'], 1),
 ('Quelle plage de variables garde ses valeurs même après l’arrêt de la machine?', ['#1 à #33', '#100 à #199', '#500 à #999', '#3000'], 2),
 ('Quelle commande revient de la macro au programme principal?', ['M30', 'M98', 'M99', 'G80'], 2),
 ('Dans le trou en hélice, le centre de la fraise suit un cercle de rayon :', ['D/2', 'T/2', '(D - T)/2', 'D - T'], 2),
 ('Sur le cercle de perçage, si J vaut 100, le rayon du cercle est :', ['100', '50', '200', '25'], 1),
 ('Pour arrêter la machine avec une alarme de macro, on utilise :', ['#3000 = n', '#500 = n', 'M00', 'GOTO 0'], 0),
 ('Au surfaçage, le pas latéral Q peut-il être plus grand que la fraise T?', ['Oui, toujours', 'Non, alarme 104', 'Seulement dans l’aluminium', 'Seulement avec un plus grand K'], 1),
 ('Quelle lettre NE PEUT PAS être utilisée comme argument dans le G65?', ['K', 'Q', 'P', 'W'], 2),
 ('Fraise à chanfreiner 90° sur O1623 : quel est le plus grand angle B accepté?', ['30', '45', '60', '90'], 1),
 ('Dans quel sens coupe un contour extérieur en G2 avec M3?', ['En avalant', 'En opposition', 'Ça dépend du Z', 'Peu importe'], 0),
]
RESUMO = {
 '1.': ['Le programme principal appelle la macro avec G65 P(numéro).', 'La macro fait les calculs et les déplacements et revient avec M99.', 'L’opérateur change seulement les lettres du G65.'],
 '2.': ['#1–#33 : locales, reçoivent les lettres.', '#100–#199 : calculs, perdues à l’arrêt.', '#500–#999 : restent enregistrées (compteurs).', 'Une lettre vide n’est pas zéro.'],
 '3.': ['Chaque lettre a une variable fixe (X = #24, Y = #25...).', 'G, L, N, O et P ne sont pas des arguments.', 'Valeurs avec point décimal : X215.'],
 '4.': ['Calculs avec crochets [ ].', 'Angles en degrés.', 'Comparaisons : EQ NE GT GE LT LE.'],
 '5.': ['IF ... GOTO saute; IF ... THEN fait un calcul.', 'Boucle = compteur + IF qui revient.', 'Assurez-vous toujours que la boucle a une sortie.'],
 '6.': ['#3000 = n arrête avec une alarme.', '#3006 = n arrête avec un message et permet de continuer.', 'Chaque macro a sa plage d’alarmes.'],
 '7.': ['Aller-retour en X, avance de Q en Y.', 'Passes de K jusqu’à Z.', 'Q jamais plus grand que T.'],
 '8.': ['θ = A + (n-1)×360/B; X = R·COS θ, Y = R·SIN θ.', 'J est un diamètre : R = J/2.', 'H choisit percer, fraiser ou fileter.'],
 '9.': ['Rayon de trajectoire = (D - T)/2.', 'Descend de K par tour, tour à plat au fond.', 'D plus grand que 2T laisse un noyau.'],
 '13.': ['La fraise en bout fait des marches selon l’angle θ.', 'Plus petit H = courbe plus lisse.', 'Elle ne coupe jamais trop, elle laisse seulement des marches.'],
 '14.': ['La pointe de la fraise 90° suit la ligne du chanfrein.', 'Hauteur = C × TAN B.', 'B jusqu’à 45°.'],
 '18.': ['Simulez d’abord dans l’app.', 'Première pièce avec Z dans le vide ou en bloc à bloc.', 'Avance basse et main sur le feed hold.'],
}
EXTRA = ['22. Quiz rapide', '23. Aide-mémoire', '24. Standard de l’atelier (règles)']
RULES_INTRO = '<p>Les règles que suit chaque programme de l’app. L’assistant écrit aussi les nouveaux programmes de cette façon.</p>'
PRE = {'(Z FINAL MAIOR QUE W)': '(Z FINAL PLUS HAUT QUE W)', '(LOTE COMPLETO - ZERAR COM G65 P1620 Q0)': '(LOT COMPLET - REMETTRE A ZERO AVEC G65 P1620 Q0)', '(VIDA DA FERRAMENTA ATINGIDA - TROCAR - ZERAR COM Q0)': '(DUREE DE VIE ATTEINTE - CHANGER L OUTIL - REMETTRE A ZERO AVEC Q0)'}
