window.LANG = "en";
window.STR = {
"and": "and",
"hdr": "O1611 · FACE MILLING",
"codeTitle": "O1611 — macro",
"mainTitle": "O0001 — main program",
"mainComment": "FACE MILLING",
"dro": "ABSOLUTE",
"side": "side view",
"layer": "pass",
"of": "{a} of {b}",
"c1.t": "The macro, step by step",
"c1.s": [
"Today we will go through the face milling macro O1611, block by block.",
"It is the simplest macro in the library, and the basis for understanding all the others."
],
"c1.k1": "MACRO FOR",
"c1.k2": "FACE MILLING",
"c2.t": "Main calls, macro works",
"c2.s": [
"The main program calls the macro with G65 P1611.",
"The macro does the math and the moves, then returns with M99.",
"At the machine, you only change the G65 letters. Nobody touches the macro."
],
"c2.main": "MAIN",
"c2.m1": "the operator edits",
"c2.m2": "the G65 letters",
"c2.s1": "math, alarms",
"c2.s2": "and moves",
"c2.you": "You change:",
"c2.not": "Do not touch:",
"c2.code": "the O1611 code",
"c3.t": "Letters become variables",
"c3.s": [
"Each G65 letter becomes a variable inside the macro.",
"X and Y are the size of the area: {X} by {Y}.",
"W is the top of the part. Z is the final Z.",
"K is the depth per pass. T is the cutter diameter.",
"Q is the stepover. A is the clearance outside the part.",
"R is the safety plane and F is the feed rate."
],
"c3.names": [
"Size in X",
"Size in Y",
"Top of part",
"Final Z",
"Depth per pass",
"Cutter diameter",
"Stepover",
"Clearance in X",
"Safety plane",
"Feed rate"
],
"c4.t": "Block 1: cutter radius",
"c4.s": [
"First block: the cutter radius.",
"T is {T}, so #100 is {T} divided by 2: {r}."
],
"c5.t": "Block 2: how far in X",
"c5.s": [
"Now, how far the cutter center goes in X.",
"Half the area, {hx}, plus the radius, {r}, plus the clearance, {A}.",
"That gives {xo}. So the cutter leaves the part completely."
],
"c6.t": "Block 3: last row in Y",
"c6.s": [
"In Y, the last row is at {hy} minus {r}.",
"That gives {ylast}. The cutter edge stops exactly at the edge of the area.",
"If the cutter is bigger than the area, the IF makes a single row in the middle."
],
"c7.t": "Safety alarms",
"c7.s": [
"Before moving, the macro checks the data.",
"Z above the top, K zero, Q zero, or Q bigger than the cutter: alarms 101 to 104.",
"Better to stop with an alarm than to cut wrong."
],
"c7.q": [
"Z above the top?",
"K zero or negative?",
"Q zero or negative?",
"Q bigger than the cutter?"
],
"c7.ok": "✓ data OK → go on",
"c8.t": "N10: each pass goes down K",
"c8.s": [
"The current surface starts at the top: #104 gets W, which is zero.",
"N10: each pass goes down K. Zero minus {K} gives Z{g:z1}.",
"The IF makes sure the cutter never goes below the final Z."
],
"c8.lim": "Final Z = {g:Z} (limit)",
"c9.t": "Approach outside the part",
"c9.s": [
"The cutter rapids to X-{g:xo}, Y-{g:ylast}, outside the part.",
"It rapids down to the safety plane: Z{g:safe}.",
"Then it feeds down to Z{g:z1}, still in the air, outside the part."
],
"c9.leg": "G0 = rapid (dashed)",
"c9.feed": "feed F{g:F}",
"c9.rapid": "rapid",
"c10.t": "N20: back and forth",
"c10.s": [
"N20: cut in X to the opposite side, X{g:xo}.",
"Then the sign of #106 flips: the next cut comes back.",
"If it is not on the last row yet, add Q{g:Q} in Y.",
"Y goes through {ylist}.",
"The next one would be {next}. That is past the limit, so the IF clamps it to {ylast}.",
"GOTO 20 repeats the cut. {n} rows in total."
],
"c10.line": "row {a} of {b}",
"c11.t": "N30: retract and check depth",
"c11.s": [
"N30: the pass is done, the cutter goes up to the safety plane.",
"If the final Z is not reached yet, it goes back to N10 for the next pass.",
"For example, with Z{g:zEx} and K{g:K}, there would be two passes.",
"At the bottom? M99 returns to the main program."
],
"c12.t": "Summary and safety tip",
"c12.s": [
"To sum up: radius, limits, alarms, pass, back and forth, and M99.",
"The first time, test with W50 and Z49: the machine draws in the air.",
"And simulate first in the Macro CNC app. See you in the next macro!"
],
"c12.res": [
"Cutter radius",
"How far in X and Y",
"Safety alarms",
"Pass: go down K",
"Back and forth in X, step Q",
"Retract, check, M99"
],
"c12.first": "First part",
"c12.air": "the cutter does everything 50 mm above",
"c12.sim": "Simulate in the app",
"c12.path": "Macro CNC → Programs → Face milling"
};
