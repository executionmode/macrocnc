window.LANG = "fr-CA";
window.STR = {
"and": "et", "yes": "oui", "no": "non",
"hdr": "O1612 · CERCLE DE PERÇAGE",
"codeTitle": "O1612 — macro",
"mainTitle": "O0012 — programme principal",
"mainComment": "CERCLE DE PERCAGE - O1612",
"side": "vue de côté",
"tri.c": "centre", "tri.r": "rayon", "tri.h1": "trou 1",
"c1.t": "Les calculs de la macro",
"c1.s": [
"Dans cette leçon, on regarde l’intérieur de la macro de cercle de perçage, la O1612.",
"On se concentre sur les calculs : comment la macro trouve toute seule la position de chaque trou."
],
"c1.k1": "MACRO DE",
"c1.k2": "CERCLE DE PERÇAGE",
"c2.t": "Programme principal : les lettres",
"c2.s": [
"Dans le programme principal, la ligne G65 P1612 appelle la macro et lui passe les dimensions.",
"X et Y : centre du cercle. J : diamètre, {J}. B : {B} trous. A : premier trou à {A} degrés.",
"H0 : percer. W et Z : dessus et fond. R : plan de dégagement. Q : débourrage. F : avance.",
"Chaque lettre devient une variable : J devient #5, B devient #2 et A devient #1. Maintenant, l’intérieur de la macro."
],
"c2.nX": "centre X", "c2.nY": "centre Y", "c2.nJ": "diamètre", "c2.nB": "nb de trous", "c2.nA": "1er trou (°)", "c2.nH": "opération",
"c2.nW": "dessus", "c2.nZ": "fond", "c2.nR": "dégagement", "c2.nQ": "débourrage", "c2.nF": "avance",
"c3.t": "D’abord : la vérification",
"c3.s": [
"La première ligne de la macro est une vérification.",
"Si B est plus petit que 1, il n’y a aucun trou à faire, et l’alarme 111 arrête la machine.",
"Ici B vaut {B}. 12 n’est pas plus petit que 1, donc la macro continue."
],
"c3.alm": "alarme 111",
"c3.no": "faux → continue",
"c4.t": "Calcul 1 : le rayon",
"c4.s": [
"Maintenant, le premier calcul : le rayon du cercle.",
"#27 reçoit #5 divisé par 2. Et #5, c’est le J, le diamètre du cercle : {J}.",
"{J} divisé par 2 donne {r}. C’est le rayon : la distance entre le centre et chaque trou.",
"Attention : J est le diamètre. Si on met le rayon dans J, les trous sortent à la moitié de la distance."
],
"c4.warn": "rayon dans J = trous à la moitié!",
"c5.t": "Calcul 2 : angle entre les trous",
"c5.s": [
"Deuxième calcul : l’angle entre un trou et le suivant.",
"Un tour complet fait 360 degrés. La macro le divise par le nombre de trous : 360 divisé par #2.",
"360 divisé par {B} donne {step}. Donc, il y a un trou à tous les {step} degrés.",
"Et #29 commence à 1. C’est le compteur : il dit à quel trou la macro est rendue."
],
"c5.cnt": "compteur",
"c6.t": "N10 : l’angle de chaque trou",
"c6.s": [
"Le N10, c’est là que commence chaque trou. Le premier calcul, c’est son angle.",
"#30, c’est l’angle du premier trou, plus le nombre de trous déjà faits, fois {step}.",
"Trou 1 : {A}, plus 1 moins 1, qui donne zéro, fois {step}. Ça reste {A} degrés.",
"Trou 2 : {A}, plus 1 fois {step}. Ça donne {a2} degrés.",
"Trou 3 : {A}, plus 2 fois {step} : {a3} degrés. Toujours à partir du X positif, dans le sens antihoraire."
],
"c7.t": "Calcul 3 : le X avec le cosinus",
"c7.s": [
"Avec l’angle, la macro trouve le X du trou avec le cosinus.",
"Imaginez le rayon comme une règle inclinée à {A} degrés. Le cosinus dit combien de cette règle est couchée, dans la direction X.",
"Le cosinus de {A} degrés vaut {cos1}. Donc {r} fois {cos1} donne {x1}.",
"En ajoutant le centre X, qui vaut zéro, #31 vaut {x1}."
],
"c7.lay": "quelle partie du rayon est couchée en X?",
"c8.t": "Calcul 4 : le Y avec le sinus",
"c8.s": [
"Le Y, c’est pareil, mais avec le sinus : combien de la règle est debout, dans la direction Y.",
"Le sinus de {A} degrés vaut {sin1}. {r} fois {sin1} donne {y1}.",
"En ajoutant le centre Y, qui vaut zéro, #32 vaut {y1}. Voilà : la position du trou 1."
],
"c9.t": "Le signe vient tout seul",
"c9.s": [
"Et quand le trou est de l’autre côté du centre? Regardez le trou 4, à {a4} degrés.",
"Le cosinus de {a4} degrés est négatif : {cos4}. Donc le X donne {x4}, à gauche du centre.",
"La macro n’a pas besoin de IF pour ça. Le sinus et le cosinus donnent déjà le bon signe de chaque côté."
],
"c10.t": "La ligne que la machine exécute",
"c10.s": [
"Avec X et Y prêts, le H choisit l’opération. H0 perce, H1 appelle l’hélice et H2 appelle le filetage.",
"Avec H0 et Q plus grand que zéro, la macro saute au N15 : G83, perçage par débourrage.",
"À l’exécution, chaque variable devient un nombre. X#31 devient X{g:x1c}, Y#32 devient Y{g:y1c}, et le R vaut 0 plus 5 : R5.",
"Le foret descend de {Q} millimètres à la fois, remonte pour dégager les copeaux et redescend, jusqu’à Z{g:Z}."
],
"c10.o0": "percer (G81 / G83)",
"c10.o1": "hélice → G65 P1613",
"c10.o2": "filetage → G65 P1619",
"c10.peck": "débourrage {a} de {b}",
"c11.t": "N40 : le trou suivant",
"c11.s": [
"Au N40, la macro demande : est-ce que #29 a atteint B? Est-ce que 1 est plus grand ou égal à {B}? Non.",
"Alors #29 reçoit #29 plus 1. Le compteur passe à 2, et le GOTO 10 retourne au début.",
"Tout se répète : nouvel angle, nouveaux X et Y, nouveau perçage. Trou par trou, jusqu’au dernier.",
"Au trou {B}, la réponse est oui, et la macro saute au N50."
],
"c12.t": "N50 : fin de la macro",
"c12.s": [
"Au N50, le G80 annule le cycle de perçage, pour que la machine ne perce pas au prochain déplacement.",
"Le G98 revient au mode par défaut, et le M99 retourne au programme principal."
],
"c12.g80": "annule le cycle de perçage",
"c12.g98": "mode par défaut\n(retour au Z initial)",
"c12.m99": "retourne au\nprogramme principal",
"c13.t": "Résumé des calculs",
"c13.s": [
"En résumé : le rayon, l’angle entre les trous, l’angle de chaque trou, et le X et le Y avec le cosinus et le sinus.",
"Sur la première pièce, testez avec W50 et Z49 : le foret fait tout dans le vide.",
"Et simulez d’abord dans l’app Macro CNC. À la prochaine macro!"
],
"c13.r1": "rayon", "c13.r2": "angle entre trous", "c13.r3": "angle du trou", "c13.r4": "X du trou", "c13.r5": "Y du trou", "c13.r6": "trou suivant",
"c13.first": "Première pièce",
"c13.air": "le foret fait tout 50 mm plus haut",
"c13.sim": "Simulez dans l’app",
"c13.path": "Macro CNC → Programmes → Cercle de perçage"
};
Object.assign(window.STR, {
"c1.v": ["Dans cette leçon, on regarde l'intérieur de la macro de cercle de perçage, la O seize douze.", "On se concentre sur les calculs : comment la macro trouve toute seule la position de chaque trou."],
"c2.v": ["Dans le programme principal, la ligne G soixante-cinq P seize douze appelle la macro et lui passe les dimensions.", "X et Y : centre du cercle. J : diamètre, trois cent soixante-quinze. B : douze trous. A : premier trou à quinze degrés.", "H zéro : percer. W et Z : dessus et fond. R : plan de dégagement. Q : débourrage. F : avance.", "Chaque lettre devient une variable : J devient la variable cinq, B la variable deux, et A la variable un. Maintenant, l'intérieur de la macro."],
"c3.v": ["La première ligne de la macro est une vérification.", "Si B est plus petit que un, il n'y a aucun trou à faire, et l'alarme cent onze arrête la machine.", "Ici B vaut douze. Douze n'est pas plus petit que un, donc la macro continue."],
"c4.v": ["Maintenant, le premier calcul : le rayon du cercle.", "La variable vingt-sept reçoit la variable cinq divisée par deux. Et la variable cinq, c'est le J, le diamètre du cercle : trois cent soixante-quinze.", "Trois cent soixante-quinze divisé par deux donne cent quatre-vingt-sept virgule cinq. C'est le rayon : la distance entre le centre et chaque trou.", "Attention : J est le diamètre. Si on met le rayon dans J, les trous sortent à la moitié de la distance."],
"c5.v": ["Deuxième calcul : l'angle entre un trou et le suivant.", "Un tour complet fait trois cent soixante degrés. La macro le divise par le nombre de trous : trois cent soixante divisé par la variable deux.", "Trois cent soixante divisé par douze donne trente. Donc, il y a un trou à tous les trente degrés.", "Et la variable vingt-neuf commence à un. C'est le compteur : il dit à quel trou la macro est rendue."],
"c6.v": ["Le N dix, c'est là que commence chaque trou. Le premier calcul, c'est son angle.", "La variable trente, c'est l'angle du premier trou, plus le nombre de trous déjà faits, fois trente.", "Trou un : quinze, plus un moins un, qui donne zéro, fois trente. Ça reste quinze degrés.", "Trou deux : quinze, plus une fois trente. Ça donne quarante-cinq degrés.", "Trou trois : quinze, plus deux fois trente : soixante-quinze degrés. Toujours à partir du X positif, dans le sens antihoraire."],
"c7.v": ["Avec l'angle, la macro trouve le X du trou avec le cosinus.", "Imaginez le rayon comme une règle inclinée à quinze degrés. Le cosinus dit combien de cette règle est couchée, dans la direction X.", "Le cosinus de quinze degrés vaut zéro virgule neuf six six. Donc cent quatre-vingt-sept virgule cinq fois zéro virgule neuf six six donne cent quatre-vingt-un virgule onze.", "En ajoutant le centre X, qui vaut zéro, la variable trente et un vaut cent quatre-vingt-un virgule onze."],
"c8.v": ["Le Y, c'est pareil, mais avec le sinus : combien de la règle est debout, dans la direction Y.", "Le sinus de quinze degrés vaut zéro virgule deux cinq neuf. Cent quatre-vingt-sept virgule cinq fois zéro virgule deux cinq neuf donne quarante-huit virgule cinquante-trois.", "En ajoutant le centre Y, qui vaut zéro, la variable trente-deux vaut quarante-huit virgule cinquante-trois. Voilà : la position du trou un."],
"c9.v": ["Et quand le trou est de l'autre côté du centre? Regardez le trou quatre, à cent cinq degrés.", "Le cosinus de cent cinq degrés est négatif : moins zéro virgule deux cinq neuf. Donc le X donne moins quarante-huit virgule cinquante-trois, à gauche du centre.", "La macro n'a pas besoin de IF pour ça. Le sinus et le cosinus donnent déjà le bon signe de chaque côté."],
"c10.v": ["Avec X et Y prêts, le H choisit l'opération. H zéro perce, H un appelle l'hélice et H deux appelle le filetage.", "Avec H zéro et Q plus grand que zéro, la macro saute au N quinze : G quatre-vingt-trois, perçage par débourrage.", "À l'exécution, chaque variable devient un nombre. X trente et un devient X cent quatre-vingt-un virgule un un un, Y trente-deux devient Y quarante-huit virgule cinq deux neuf, et le R vaut zéro plus cinq : R cinq.", "Le foret descend de huit millimètres à la fois, remonte pour dégager les copeaux et redescend, jusqu'à Z moins trente."],
"c11.v": ["Au N quarante, la macro demande : est-ce que la variable vingt-neuf a atteint B? Est-ce que un est plus grand ou égal à douze? Non.", "Alors la variable vingt-neuf reçoit elle-même plus un. Le compteur passe à deux, et le GO TO dix retourne au début.", "Tout se répète : nouvel angle, nouveaux X et Y, nouveau perçage. Trou par trou, jusqu'au dernier.", "Au trou douze, la réponse est oui, et la macro saute au N cinquante."],
"c12.v": ["Au N cinquante, le G quatre-vingts annule le cycle de perçage, pour que la machine ne perce pas au prochain déplacement.", "Le G quatre-vingt-dix-huit revient au mode par défaut, et le M quatre-vingt-dix-neuf retourne au programme principal."],
"c13.v": ["En résumé : le rayon, l'angle entre les trous, l'angle de chaque trou, et le X et le Y avec le cosinus et le sinus.", "Sur la première pièce, testez avec W cinquante et Z quarante-neuf : le foret fait tout dans le vide.", "Et simulez d'abord dans l'app Macro CNC. À la prochaine macro!"]
});
