window.LANG = "en";
window.STR = {
"and": "and", "yes": "yes", "no": "no",
"hdr": "O1612 · BOLT CIRCLE",
"codeTitle": "O1612 — macro",
"mainTitle": "O0012 — main program",
"mainComment": "BOLT CIRCLE - O1612",
"side": "side view",
"tri.c": "center", "tri.r": "radius", "tri.h1": "hole 1",
"c1.t": "The math inside the macro",
"c1.s": [
"In this lesson, we look inside the bolt circle macro, O1612.",
"The focus is the math: how the macro finds the position of every hole by itself."
],
"c1.k1": "MACRO FOR",
"c1.k2": "BOLT CIRCLE",
"c2.t": "Main program: the letters",
"c2.s": [
"In the main program, the line G65 P1612 calls the macro and passes the sizes.",
"X and Y: circle center. J: diameter, {J}. B: {B} holes. A: first hole at {A} degrees.",
"H0: drill. W and Z: top and bottom. R: clearance plane. Q: peck. F: feed rate.",
"Each letter becomes a variable: J becomes #5, B becomes #2 and A becomes #1. Now, inside the macro."
],
"c2.nX": "center X", "c2.nY": "center Y", "c2.nJ": "diameter", "c2.nB": "no. of holes", "c2.nA": "1st hole (°)", "c2.nH": "operation",
"c2.nW": "top", "c2.nZ": "bottom", "c2.nR": "clearance", "c2.nQ": "peck", "c2.nF": "feed rate",
"c3.t": "First: the check",
"c3.s": [
"The first line of the macro is a check.",
"If B is less than 1, there is no hole to make, and alarm 111 stops the machine.",
"Here B is {B}. 12 is not less than 1, so the macro goes on."
],
"c3.alm": "alarm 111",
"c3.no": "false → go on",
"c4.t": "Math 1: the radius",
"c4.s": [
"Now the first calculation: the circle radius.",
"#27 gets #5 divided by 2. And #5 is J, the circle diameter: {J}.",
"{J} divided by 2 is {r}. That is the radius: the distance from the center to each hole.",
"Careful: J is the diameter. If you put the radius in J, the holes end up at half the distance."
],
"c4.warn": "radius in J = holes at half!",
"c5.t": "Math 2: angle between holes",
"c5.s": [
"Second calculation: the angle from one hole to the next.",
"A full turn is 360 degrees. The macro divides it by the number of holes: 360 divided by #2.",
"360 divided by {B} is {step}. So there is a hole every {step} degrees.",
"And #29 starts at 1. It is the counter: it tells which hole the macro is on."
],
"c5.cnt": "counter",
"c6.t": "N10: the angle of each hole",
"c6.s": [
"N10 is where each hole starts. The first calculation is its angle.",
"#30 is the angle of the first hole, plus how many holes have passed, times {step}.",
"Hole 1: {A} plus 1 minus 1, which is zero, times {step}. That stays {A} degrees.",
"Hole 2: {A} plus 1 times {step}. That gives {a2} degrees.",
"Hole 3: {A} plus 2 times {step}: {a3} degrees. Always from X positive, counterclockwise."
],
"c7.t": "Math 3: X with the cosine",
"c7.s": [
"With the angle, the macro finds the hole X using the cosine.",
"Think of the radius as a ruler tilted at {A} degrees. The cosine tells how much of that ruler lies flat, along X.",
"The cosine of {A} degrees is {cos1}. So {r} times {cos1} is {x1}.",
"Adding center X, which is zero, #31 is {x1}."
],
"c7.lay": "how much of the radius lies along X?",
"c8.t": "Math 4: Y with the sine",
"c8.s": [
"Y works the same way, with the sine: how much of the ruler stands up, along Y.",
"The sine of {A} degrees is {sin1}. {r} times {sin1} is {y1}.",
"Adding center Y, which is zero, #32 is {y1}. Done: the position of hole 1."
],
"c9.t": "The sign comes by itself",
"c9.s": [
"What if the hole is on the other side of the center? Look at hole 4, at {a4} degrees.",
"The cosine of {a4} degrees is negative: {cos4}. So X is {x4}, left of the center.",
"The macro needs no IF for this. Sine and cosine already bring the right sign on each side."
],
"c10.t": "The line the machine runs",
"c10.s": [
"With X and Y ready, H picks the operation. H0 drills, H1 calls the helix and H2 calls the thread.",
"With H0 and Q greater than zero, the macro jumps to N15: G83, peck drilling.",
"When it runs, every variable becomes a number. X#31 becomes X{g:x1c}, Y#32 becomes Y{g:y1c}, and R is 0 plus 5: R5.",
"The drill goes down {Q} millimeters at a time, backs out to clear the chips, and goes back in, down to Z{g:Z}."
],
"c10.o0": "drill (G81 / G83)",
"c10.o1": "helix → G65 P1613",
"c10.o2": "thread → G65 P1619",
"c10.peck": "peck {a} of {b}",
"c11.t": "N40: the next hole",
"c11.s": [
"At N40, the macro asks: has #29 reached B? Is 1 greater than or equal to {B}? No.",
"So #29 gets #29 plus 1. The counter goes to 2, and GOTO 10 goes back to the start.",
"Everything repeats: new angle, new X and Y, new drilling. Hole by hole, up to the last one.",
"At hole {B}, the answer is yes, and the macro jumps to N50."
],
"c12.t": "N50: end of the macro",
"c12.s": [
"At N50, G80 cancels the drilling cycle, so the machine does not drill on the next move.",
"G98 goes back to the default, and M99 returns to the main program."
],
"c12.g80": "cancels the drilling cycle",
"c12.g98": "back to default\n(return to initial Z)",
"c12.m99": "returns to the\nmain program",
"c13.t": "Summary of the math",
"c13.s": [
"To sum up the math: radius, angle between holes, angle of each hole, and X and Y with cosine and sine.",
"On the first part, test with W50 and Z49: the drill does everything in the air.",
"And simulate first in the Macro CNC app. See you in the next macro!"
],
"c13.r1": "radius", "c13.r2": "angle between holes", "c13.r3": "hole angle", "c13.r4": "hole X", "c13.r5": "hole Y", "c13.r6": "next hole",
"c13.first": "First part",
"c13.air": "the drill does everything 50 mm up",
"c13.sim": "Simulate in the app",
"c13.path": "Macro CNC → Programs → Bolt circle"
};
Object.assign(window.STR, {
"c1.v": ["In this lesson, we look inside the bolt circle macro, O sixteen twelve.", "The focus is the math: how the macro finds the position of every hole by itself."],
"c2.v": ["In the main program, the line G sixty-five P sixteen twelve calls the macro and passes the sizes.", "X and Y: circle center. J: diameter, three hundred seventy-five. B: twelve holes. A: first hole at fifteen degrees.", "H zero: drill. W and Z: top and bottom. R: clearance plane. Q: peck. F: feed rate.", "Each letter becomes a variable: J becomes variable five, B becomes variable two, and A becomes variable one. Now, inside the macro."],
"c3.v": ["The first line of the macro is a check.", "If B is less than one, there is no hole to make, and alarm one eleven stops the machine.", "Here B is twelve. Twelve is not less than one, so the macro goes on."],
"c4.v": ["Now the first calculation: the circle radius.", "Variable twenty-seven gets variable five divided by two. And variable five is J, the circle diameter: three hundred seventy-five.", "Three hundred seventy-five divided by two is one hundred eighty-seven point five. That is the radius: the distance from the center to each hole.", "Careful: J is the diameter. If you put the radius in J, the holes end up at half the distance."],
"c5.v": ["Second calculation: the angle from one hole to the next.", "A full turn is three hundred sixty degrees. The macro divides it by the number of holes: three sixty divided by variable two.", "Three sixty divided by twelve is thirty. So there is a hole every thirty degrees.", "And variable twenty-nine starts at one. It is the counter: it tells which hole the macro is on."],
"c6.v": ["N ten is where each hole starts. The first calculation is its angle.", "Variable thirty is the angle of the first hole, plus how many holes have passed, times thirty.", "Hole one: fifteen, plus one minus one, which is zero, times thirty. That stays fifteen degrees.", "Hole two: fifteen, plus one times thirty. That gives forty-five degrees.", "Hole three: fifteen, plus two times thirty: seventy-five degrees. Always from X positive, counterclockwise."],
"c7.v": ["With the angle, the macro finds the hole X using the cosine.", "Think of the radius as a ruler tilted at fifteen degrees. The cosine tells how much of that ruler lies flat, along X.", "The cosine of fifteen degrees is zero point nine six six. So one eighty-seven point five times zero point nine six six is one eighty-one point one one.", "Adding center X, which is zero, variable thirty-one is one eighty-one point one one."],
"c8.v": ["Y works the same way, with the sine: how much of the ruler stands up, along Y.", "The sine of fifteen degrees is zero point two five nine. One eighty-seven point five times zero point two five nine is forty-eight point five three.", "Adding center Y, which is zero, variable thirty-two is forty-eight point five three. Done: the position of hole one."],
"c9.v": ["What if the hole is on the other side of the center? Look at hole four, at one hundred five degrees.", "The cosine of one hundred five degrees is negative: minus zero point two five nine. So X is minus forty-eight point five three, left of the center.", "The macro needs no IF for this. Sine and cosine already bring the right sign on each side."],
"c10.v": ["With X and Y ready, H picks the operation. H zero drills, H one calls the helix and H two calls the thread.", "With H zero and Q greater than zero, the macro jumps to N fifteen: G eighty-three, peck drilling.", "When it runs, every variable becomes a number. X thirty-one becomes X one eighty-one point one one one, Y thirty-two becomes Y forty-eight point five two nine, and R is zero plus five: R five.", "The drill goes down eight millimeters at a time, backs out to clear the chips, and goes back in, down to Z minus thirty."],
"c11.v": ["At N forty, the macro asks: has variable twenty-nine reached B? Is one greater than or equal to twelve? No.", "So variable twenty-nine gets itself plus one. The counter goes to two, and GO TO ten goes back to the start.", "Everything repeats: new angle, new X and Y, new drilling. Hole by hole, up to the last one.", "At hole twelve, the answer is yes, and the macro jumps to N fifty."],
"c12.v": ["At N fifty, G eighty cancels the drilling cycle, so the machine does not drill on the next move.", "G ninety-eight goes back to the default, and M ninety-nine returns to the main program."],
"c13.v": ["To sum up the math: radius, angle between holes, angle of each hole, and X and Y with cosine and sine.", "On the first part, test with W fifty and Z forty-nine: the drill does everything in the air.", "And simulate first in the Macro CNC app. See you in the next macro!"]
});
