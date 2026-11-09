import asyncio, base64, sys, json, subprocess, os
from playwright.async_api import async_playwright
MODE = sys.argv[1]
VARS = ('sub',) if os.environ.get('ONLY_SUB') else ('clean', 'sub')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        if os.environ.get('TIMING'): await pg.add_init_script('window.TIMING = ' + open(os.environ['TIMING']).read() + ';')
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/video/video.html?m=' + os.environ.get('M','faceamento') + '&l=' + os.environ.get('L','pt')); await pg.evaluate('window.ready')
        sc = await pg.evaluate('window.SCENES')
        json.dump(sc, open('scenes_%s_%s.json' % (os.environ.get('M','faceamento'), os.environ.get('L','pt')), 'w'), ensure_ascii=False, indent=1)
        if MODE == 'stills':
            for i, s in enumerate(sc):
                for j, tt in enumerate([s['subs'][-1]['start'] + 1.6, s['dur'] * 0.5]):
                    fr = await pg.evaluate(f'window.frames({i},{tt},1,30)')
                    open(f"still_{os.environ.get('L','pt')}_{i:02d}_{j}.jpg", 'wb').write(base64.b64decode(fr[0][1]))
            print('total', sum(s['dur'] for s in sc), errs)
        else:
            os.makedirs('parts', exist_ok=True)
            only = [int(x) for x in sys.argv[2:]] or range(len(sc))
            for i in only:
                s = sc[i]; n = round(s['dur'] * 30)
                procs = []
                for v in VARS:
                    procs.append(subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', f'parts/{v}_{i:02d}.tmp.mp4'], stdin=subprocess.PIPE))
                k = 0
                while k < n:
                    m = min(20, n - k)
                    fr = await pg.evaluate(f'window.frames({i},{k}/30,{m},30)')
                    for a, bb in fr:
                        procs[-1].stdin.write(base64.b64decode(bb))
                        if len(procs) > 1: procs[0].stdin.write(base64.b64decode(a))
                    k += m
                for pr, v in zip(procs, VARS):
                    pr.stdin.close(); rc = pr.wait()
                    if rc == 0: os.replace(f'parts/{v}_{i:02d}.tmp.mp4', f'parts/{v}_{i:02d}.mp4')
                print('scene', i, n, errs, flush=True)
        await b.close()
asyncio.run(main())
