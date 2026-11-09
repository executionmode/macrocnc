window.LANG = "fr-CA";
window.STR = {
"and": "et",
"hdr": "O1611 · SURFAÇAGE",
"codeTitle": "O1611 — macro",
"mainTitle": "O0001 — programme principal",
"mainComment": "SURFACAGE",
"dro": "ABSOLUE",
"side": "vue de côté",
"layer": "passe",
"of": "{a} de {b}",
"c1.t": "La macro, étape par étape",
"c1.s": [
"Aujourd’hui, on décortique bloc par bloc la macro de surfaçage O1611.",
"C’est la macro la plus simple de la bibliothèque, et la base pour comprendre toutes les autres."
],
"c1.k1": "MACRO DE",
"c1.k2": "SURFAÇAGE",
"c2.t": "Le principal appelle, la macro travaille",
"c2.s": [
"Le programme principal appelle la macro avec G65 P1611.",
"La macro fait les calculs et les déplacements, puis revient avec M99.",
"À la machine, on change seulement les lettres du G65. On ne touche pas à la macro."
],
"c2.main": "PRINCIPAL",
"c2.m1": "l’opérateur modifie",
"c2.m2": "les lettres du G65",
"c2.s1": "calculs, alarmes",
"c2.s2": "et déplacements",
"c2.you": "Vous changez :",
"c2.not": "Ne touchez pas :",
"c2.code": "le code de la O1611",
"c3.t": "Les lettres deviennent des variables",
"c3.s": [
"Chaque lettre du G65 devient une variable dans la macro.",
"X et Y sont les dimensions de la surface : {X} par {Y}.",
"W est le dessus de la pièce. Z est le Z final.",
"K est la profondeur de passe. T est le diamètre de la fraise.",
"Q est le pas latéral. A est le dégagement hors de la pièce.",
"R est le plan de sécurité et F est l’avance."
],
"c3.names": [
"Longueur en X",
"Longueur en Y",
"Dessus de pièce",
"Z final",
"Prof. de passe",
"Diamètre fraise",
"Pas latéral",
"Dégagement en X",
"Plan de sécurité",
"Avance"
],
"c4.t": "Bloc 1 : rayon de la fraise",
"c4.s": [
"Premier bloc : le rayon de la fraise.",
"T vaut {T}, donc #100 vaut {T} divisé par 2 : {r}."
],
"c5.t": "Bloc 2 : jusqu’où aller en X",
"c5.s": [
"Maintenant, jusqu’où va le centre de la fraise en X.",
"La moitié de la surface, {hx}, plus le rayon, {r}, plus le dégagement, {A}.",
"Ça donne {xo}. La fraise sort complètement de la pièce."
],
"c6.t": "Bloc 3 : dernière ligne en Y",
"c6.s": [
"En Y, la dernière ligne est à {hy} moins {r}.",
"Ça donne {ylast}. Le bord de la fraise arrête pile à la limite de la surface.",
"Si la fraise est plus grande que la surface, le IF fait une seule ligne, au centre."
],
"c7.t": "Alarmes de protection",
"c7.s": [
"Avant de bouger, la macro vérifie les données.",
"Z plus haut que le dessus, K à zéro, Q à zéro ou Q plus grand que la fraise : alarmes 101 à 104.",
"Mieux vaut arrêter avec une alarme que de mal couper."
],
"c7.q": [
"Z plus haut que le dessus?",
"K à zéro ou négatif?",
"Q à zéro ou négatif?",
"Q plus grand que la fraise?"
],
"c7.ok": "✓ données OK → on continue",
"c8.t": "N10 : chaque passe descend de K",
"c8.s": [
"La surface actuelle part du dessus : #104 reçoit W, qui vaut zéro.",
"N10 : chaque passe descend de K. Zéro moins {K} donne Z{g:z1}.",
"Le IF garantit que la fraise ne dépasse jamais le Z final."
],
"c8.lim": "Z final = {g:Z} (limite)",
"c9.t": "Approche hors de la pièce",
"c9.s": [
"La fraise va en rapide à X-{g:xo}, Y-{g:ylast}, hors de la pièce.",
"Elle descend en rapide jusqu’au plan de sécurité : Z{g:safe}.",
"Puis elle descend en avance jusqu’à Z{g:z1}, encore dans le vide, hors de la pièce."
],
"c9.leg": "G0 = rapide (pointillé)",
"c9.feed": "avance F{g:F}",
"c9.rapid": "rapide",
"c10.t": "N20 : l’aller-retour",
"c10.s": [
"N20 : on coupe en X jusqu’au côté opposé, X{g:xo}.",
"Ensuite, le signe de #106 s’inverse : la prochaine coupe revient.",
"Si on n’est pas encore à la dernière ligne, on ajoute Q{g:Q} en Y.",
"Y passe par {ylist}.",
"La suivante serait {next}. Ça dépasse la limite, donc le IF la bloque à {ylast}.",
"GOTO 20 répète la coupe. {n} lignes au total."
],
"c10.line": "ligne {a} de {b}",
"c11.t": "N30 : remonter et vérifier le fond",
"c11.s": [
"N30 : la passe est finie, la fraise remonte au plan de sécurité.",
"Si le Z final n’est pas atteint, elle retourne au N10 pour la passe suivante.",
"Par exemple, avec Z{g:zEx} et K{g:K}, il y aurait deux passes.",
"Arrivé au fond? M99 retourne au programme principal."
],
"c12.t": "Résumé et conseil de sécurité",
"c12.s": [
"En résumé : rayon, limites, alarmes, passe, aller-retour et M99.",
"La première fois, testez avec W50 et Z49 : la machine dessine dans le vide.",
"Et simulez d’abord dans l’app Macro CNC. À la prochaine macro!"
],
"c12.res": [
"Rayon de la fraise",
"Jusqu’où aller en X et en Y",
"Alarmes de protection",
"Passe : descendre de K",
"Aller-retour en X, avancer de Q",
"Remonter, vérifier, M99"
],
"c12.first": "Première pièce",
"c12.air": "la fraise fait tout 50 mm plus haut",
"c12.sim": "Simulez dans l’app",
"c12.path": "Macro CNC → Programmes → Surfaçage"
};
