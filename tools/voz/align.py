import json, subprocess, re, itertools, functools
sc = json.load(open('/home/claude/video/scenes.json'))
spk = [b.split('\n') for b in open('/home/claude/video/faceamento_O1611_texto_para_voz.txt').read().strip().split('\n\n')]
OFF = 0.4; T = []
def sil_of(f, dur):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=noise=-35dB:d=0.15', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]; se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    return [(a, b) for a, b in zip(ss, se) if b < dur - 0.05 and a > 0.3]
for i in range(12):
    f = 'cena%02d.wav' % (i + 1)
    try:
        dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], stderr=subprocess.DEVNULL)); sil = sil_of(f, dur)
    except Exception: dur = 18.8; sil = None
    L = [len(s) for s in spk[i]]; tot = sum(L); n = len(L)
    exps = [sum(L[:k + 1]) / tot * dur for k in range(n - 1)]
    if sil and n > 1:
        best = None
        for comb in itertools.combinations(range(len(sil)), n - 1):
            c = sum(((sil[j][0] + sil[j][1]) / 2 - e) ** 2 for j, e in zip(comb, exps)) / dur ** 2 * 40 - sum(sil[j][1] - sil[j][0] for j in comb) * 3
            if best is None or c < best[0]: best = (c, comb)
        b = [sil[j][1] for j in best[1]]
    else: b = exps
    st = [0.0] + b
    T.append({'st': [round(OFF + x, 3) for x in st], 'dur': round(OFF + dur + 0.9, 2), 'audio': dur})
    print(i + 1, round(dur, 2), [round(x, 2) for x in st], [ (round(a,2), round(bb-a,2)) for a, bb in (sil or [])])
json.dump(T, open('timing.json', 'w'))
