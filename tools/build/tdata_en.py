TITLE = 'FANUC Macro Training'
EX_NAMES = {1: 'Exercise 1', 2: 'Exercise 2', 3: 'Exercise 3', 4: 'Exercise 4', 5: 'Exercise 5', 6: 'Exercise 6', 7: 'Exercise 7', 8: 'Exercise 8', 9: 'Challenge'}
ANS = {
 1: '<p><b>(a)</b> #100 = 40/2 = 20; #101 = 100/2 + 20 + 5 = <b>75</b>. The cutter center starts at <b>X-75</b> and goes to X75.</p>'
    '<p><b>(b)</b> #102 = 60/2 - 20 = 10. First row Y-10; adding Q30 would give Y20, which is past the limit, so the last one is at <b>Y10</b>. That is <b>2 rows</b>: Y-10 and Y10.</p>'
    '<p><b>(c)</b> From W0 to Z-1 with K1: <b>1 pass</b>.</p>',
 2: '<p>R = J/2 = 50. Angle between holes = 360/8 = 45°.</p>'
    '<p><b>Hole 2</b>: θ = 0 + 1×45 = 45° → X = 50×COS45 = <b>35.355</b>, Y = 50×SIN45 = <b>35.355</b>.</p>'
    '<p><b>Hole 3</b>: θ = 90° → <b>X0</b>, <b>Y50</b>.</p>',
 3: '<p>Path radius = (D - T)/2 = (30 - 16)/2 = <b>7</b>.</p>'
    '<p>From Z0 to Z-10 with K2.5: Z-2.5, -5, -7.5, -10 = <b>4 turns going down</b>, plus <b>1 flat turn</b> at the bottom.</p>',
 4: '<p>Offset = C - C×SIN θ = 5 - 5×0.5 = <b>2.5</b>.</p>'
    '<p>Z = W - C + C×COS θ = 0 - 5 + 5×0.866 = <b>-0.670</b>.</p>',
 5: '<p>Height on the face = C×TAN B = 2×0.577 = <b>1.155</b>.</p>'
    '<p>Passes = C/Q = 2/0.25 = <b>8 passes</b>.</p>'
    '<p>Step ≈ Q×(1 - TAN²B)/2 = 0.25×(1 - 0.333)/2 ≈ <b>0.083 mm</b>.</p>',
 6: '<ul><li>(a) B60 on O1623: <b>alarm 202</b> (B greater than 45).</li>'
    '<li>(b) H90 on O1618: <b>alarm 173</b> (step in degrees greater than or equal to 90).</li>'
    '<li>(c) Z1 with W0 on O1611: <b>alarm 101</b> (final Z above the top).</li></ul>',
 7: '<p>On O1617, D is the diameter through the <b>corners</b>. For a hexagon: D = across flats / COS 30° = 30 / 0.866 = <b>34.641</b>.</p>'
    '<p>General rule: D = across flats / COS(180/B).</p>',
 8: '<p>1st call: #500 = <b>1</b>. 2nd: <b>2</b>. 3rd: <b>3</b> → 3 is not less than Q3, so the machine <b>stops on the 3rd call</b> with "LOTE COMPLETO" (batch complete). Reset with <code>G65 P1620 Q0</code>.</p>',
 9: '<p>Careful: <b>P cannot be an argument letter</b> in G65 (P is the program number). Use another letter for the spacing, for example <b>I</b>.</p>'
    '<pre class="code">O1690 (HOLES IN A LINE) ;\n(G65 P1690 LETTERS) ;\n(X Y = FIRST HOLE) ;\n(B = NUMBER OF HOLES  I = SPACING IN X) ;\n(W = TOP  Z = FINAL Z  R = SAFETY  F = FEED) ;\nIF [#2 LT 1] THEN #3000 = 281 (B INVALID) ;\nIF [#26 GE #23] THEN #3000 = 282 (FINAL Z ABOVE THE TOP) ;\n#100 = 1 ;\nN10 #101 = #24 + [#100 - 1] * #4 ;\nG99 G81 X#101 Y#25 Z#26 R[#23 + #18] F#9 ;\nIF [#100 GE #2] GOTO 20 ;\n#100 = #100 + 1 ;\nGOTO 10 ;\nN20 G80 ;\nG98 ;\nM99 ;</pre>'
    '<p>Call: <code>G65 P1690 X0 Y0 B5 I20. W0 Z-10. R3. F100. ;</code> → 5 holes at X0, 20, 40, 60, 80.</p>',
}
COLA = '''
<h3>G65 letters → variables</h3>
<div class="tw"><table><tr><th>Letter</th><th>#</th><th>Letter</th><th>#</th><th>Letter</th><th>#</th></tr>
<tr><td>A</td><td>#1</td><td>I</td><td>#4</td><td>R</td><td>#18</td></tr>
<tr><td>B</td><td>#2</td><td>J</td><td>#5</td><td>S</td><td>#19</td></tr>
<tr><td>C</td><td>#3</td><td>K</td><td>#6</td><td>T</td><td>#20</td></tr>
<tr><td>D</td><td>#7</td><td>M</td><td>#13</td><td>U</td><td>#21</td></tr>
<tr><td>E</td><td>#8</td><td>Q</td><td>#17</td><td>V</td><td>#22</td></tr>
<tr><td>F</td><td>#9</td><td></td><td></td><td>W</td><td>#23</td></tr>
<tr><td>H</td><td>#11</td><td></td><td></td><td>X Y Z</td><td>#24 #25 #26</td></tr></table></div>
<p>They cannot be argument letters: <b>G, L, N, O, P</b>.</p>
<h3>Shop letter standard</h3>
<ul><li><b>X Y</b> center · <b>W</b> top (face) · <b>Z</b> final Z</li><li><b>K</b> step down · <b>T</b> cutter diameter · <b>Q</b> stepover</li><li><b>R</b> safety plane · <b>F</b> feed</li></ul>
<h3>Comparisons</h3>
<div class="tw"><table><tr><th>Write</th><th>Means</th></tr><tr><td>EQ</td><td>equal</td></tr><tr><td>NE</td><td>not equal</td></tr><tr><td>GT</td><td>greater</td></tr><tr><td>GE</td><td>greater or equal</td></tr><tr><td>LT</td><td>less</td></tr><tr><td>LE</td><td>less or equal</td></tr></table></div>
<h3>Functions</h3>
<p><code>SIN COS TAN ATAN SQRT ABS ROUND FIX FUP</code> — angles always in <b>degrees</b>. Brackets <code>[ ]</code> instead of parentheses in math.</p>
<h3>Structures</h3>
<pre class="code">IF [#1 GT 10] GOTO 20 ;
IF [#1 GT 10] THEN #2 = 5 ;
WHILE [#1 LT 10] DO 1 ;
...
END 1 ;
#3000 = 101 (ALARM TEXT) ;
#3006 = 1 (MESSAGE AND STOP) ;</pre>
<h3>Alarm ranges per macro</h3>
<div class="tw"><table><tr><th>Macro</th><th>Alarms</th></tr>
<tr><td>O1611 face milling</td><td>101–104</td></tr><tr><td>O1612 bolt circle</td><td>111</td></tr><tr><td>O1613 helix</td><td>121–123</td></tr>
<tr><td>O1616 rectangular</td><td>151–154</td></tr><tr><td>O1617 polygon</td><td>161–163</td></tr><tr><td>O1618 radius</td><td>171–176</td></tr>
<tr><td>O1620–O1622 counter/life/offset</td><td>191–195</td></tr><tr><td>O1623 90° chamfer</td><td>201–208</td></tr><tr><td>O1624 keyway</td><td>211–216</td></tr></table></div>
<h3>Before pressing Cycle Start</h3>
<ul><li>Tool length set checked (at the tip, for a chamfer mill).</li><li>First run with Z above the part (W50 Z49) or single block.</li><li>Low feed override on the first part.</li><li>Simulate in the app first: the stock and the path must match the drawing.</li></ul>
'''
QUIZ = [
 ('In G65 P1611 X215. ..., which variable does letter X become inside the macro?', ['#1', '#24', '#100', '#500'], 1),
 ('Which variable range keeps its values even after the machine is turned off?', ['#1 to #33', '#100 to #199', '#500 to #999', '#3000'], 2),
 ('Which command returns from the macro to the main program?', ['M30', 'M98', 'M99', 'G80'], 2),
 ('In the helical hole, the cutter center travels on a circle of radius:', ['D/2', 'T/2', '(D - T)/2', 'D - T'], 2),
 ('On the bolt circle, if J is 100, the circle radius is:', ['100', '50', '200', '25'], 1),
 ('To stop the machine with a macro alarm, you use:', ['#3000 = n', '#500 = n', 'M00', 'GOTO 0'], 0),
 ('In face milling, can stepover Q be larger than cutter T?', ['Yes, always', 'No, alarm 104', 'Only in aluminum', 'Only with a larger K'], 1),
 ('Which letter can NOT be used as an argument in G65?', ['K', 'Q', 'P', 'W'], 2),
 ('90° chamfer mill on O1623: what is the largest angle B accepted?', ['30', '45', '60', '90'], 1),
 ('Which way does an outside G2 profile with M3 cut?', ['Climb', 'Conventional', 'Depends on Z', 'Either way'], 0),
]
RESUMO = {
 '1.': ['The main program calls the macro with G65 P(number).', 'The macro does the math and the moves and returns with M99.', 'The operator only changes the G65 letters.'],
 '2.': ['#1–#33: local, receive the letters.', '#100–#199: math, gone at power off.', '#500–#999: stay saved (counters).', 'An empty letter is not zero.'],
 '3.': ['Each letter has a fixed variable (X = #24, Y = #25...).', 'G, L, N, O and P are not arguments.', 'Values with a decimal point: X215.'],
 '4.': ['Math with brackets [ ].', 'Angles in degrees.', 'Comparisons: EQ NE GT GE LT LE.'],
 '5.': ['IF ... GOTO jumps; IF ... THEN does one calculation.', 'Loop = counter + IF that jumps back.', 'Always make sure the loop has a way out.'],
 '6.': ['#3000 = n stops with an alarm.', '#3006 = n stops with a message and lets you continue.', 'Each macro has its own alarm range.'],
 '7.': ['Back and forth in X, step Q in Y.', 'Passes of K down to Z.', 'Q never larger than T.'],
 '8.': ['θ = A + (n-1)×360/B; X = R·COS θ, Y = R·SIN θ.', 'J is a diameter: R = J/2.', 'H chooses drill, mill or thread.'],
 '9.': ['Path radius = (D - T)/2.', 'Goes down K per turn, flat turn at the bottom.', 'D larger than 2T leaves a core.'],
 '13.': ['A flat end mill makes steps along the angle θ.', 'Smaller H = smoother curve.', 'It never overcuts, it only leaves steps.'],
 '14.': ['The tip of the 90° cutter runs on the chamfer line.', 'Height = C × TAN B.', 'B up to 45°.'],
 '18.': ['Simulate in the app first.', 'First part with Z in the air or single block.', 'Low feed and a hand on feed hold.'],
}
EXTRA = ['22. Quick quiz', '23. Cheat sheet', '24. Shop standard (rules)']
RULES_INTRO = '<p>The rules every program in the app follows. The assistant also writes new programs this way.</p>'
PRE = {'(Z FINAL MAIOR QUE W)': '(FINAL Z ABOVE W)', '(LOTE COMPLETO - ZERAR COM G65 P1620 Q0)': '(BATCH COMPLETE - RESET WITH G65 P1620 Q0)', '(VIDA DA FERRAMENTA ATINGIDA - TROCAR - ZERAR COM Q0)': '(TOOL LIFE REACHED - CHANGE TOOL - RESET WITH Q0)'}
