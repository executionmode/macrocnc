import re, base64
D='/home/claude/macro-cnc/'
s=open(D+'index.html').read()
s=re.sub(r'\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>','',s)
s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>\n'+open(D+m.group(1)).read()+'\n</style>',s)
s=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>\n'+open(D+m.group(1)).read().replace('</script','<\\/script')+'\n</script>',s)
s=re.sub(r'img/([a-z-]+)\.jpg',lambda m:'data:image/jpeg;base64,'+base64.b64encode(open(D+'img/'+m.group(1)+'.jpg','rb').read()).decode(),s)
open('/home/claude/macro-cnc-teste.html','w').write(s); print(len(s))
