import json, subprocess, os
T = json.load(open('timing.json')); parts = []
for i, t in enumerate(T):
    d = round(t['dur'] * 30) / 30; f = 'cena%02d.wav' % (i + 1); o = 'pad%02d.wav' % (i + 1)
    if os.path.exists(f):
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', f, '-af', 'aresample=48000,adelay=400:all=1,apad', '-ac', '2', '-ar', '48000', '-t', '%.4f' % d, o]
    else:
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '%.4f' % d, o]
    subprocess.check_call(cmd); parts.append(o)
open('alist.txt', 'w').write(''.join("file '%s'\n" % p for p in parts))
subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'alist.txt', '-c:a', 'pcm_s16le', 'narracao.wav'])
print(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'narracao.wav']).decode())
