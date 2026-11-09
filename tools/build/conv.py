import re, html, json
x=open('/tmp/doc1.xml').read()
# CDATA -> escaped text
x=re.sub(r'<!\[CDATA\[(.*?)\]\]>', lambda m: html.escape(m.group(1)), x, flags=re.S)
import xml.dom.minidom as md
doc=md.parseString(x)
def inline(n):
    out=''
    for c in n.childNodes:
        if c.nodeType==c.TEXT_NODE: out+=html.escape(c.data)
        elif c.tagName=='text': out+=inline(c)
        elif c.tagName=='bold': out+='<b>'+inline(c)+'</b>'
        elif c.tagName=='italic': out+='<i>'+inline(c)+'</i>'
        elif c.tagName=='code': out+='<code>'+inline(c)+'</code>'
        elif c.tagName=='date': out+=c.getAttribute('value')
        elif c.tagName=='media': out+='<figure data-media="%s"><figcaption>%s</figcaption></figure>'%(c.getAttribute('blob'),html.escape(c.getAttribute('alt')))
        else: out+=inline(c)
    return out
def block(n):
    t=n.tagName
    if t=='paragraph':
        h=n.getAttribute('heading'); inn=inline(n)
        if '<figure' in inn and not re.sub(r'<figure.*?</figure>','',inn).strip(): return inn
        if h: return '<h%d>%s</h%d>'%(int(h),inn,int(h))
        return '<p>%s</p>'%inn if inn.strip() else ''
    if t=='list':
        tag='ol' if n.getAttribute('kind')=='ordered' else 'ul'
        return '<%s>%s</%s>'%(tag,''.join('<li>'+''.join(block(c) for c in li.childNodes if c.nodeType==1).replace('<p>','').replace('</p>',' ').strip()+'</li>' for li in n.childNodes if li.nodeType==1),tag)
    if t=='table':
        rows=[r for r in n.childNodes if r.nodeType==1]
        h='<div class="tw"><table>'
        for r in rows:
            cells=[c for c in r.childNodes if c.nodeType==1]
            h+='<tr>'+''.join(('<th>' if c.getAttribute('header')=='true' else '<td>')+''.join(block(p) for p in c.childNodes if p.nodeType==1).replace('<p>','').replace('</p>','<br>').rstrip('<br>')+('</th>' if c.getAttribute('header')=='true' else '</td>') for c in cells)+'</tr>'
        return h+'</table></div>'
    if t=='codeBlock':
        return '<pre class="code">'+inline(n)+'</pre>'
    if t=='media':
        return '<figure data-media="%s"><figcaption>%s</figcaption></figure>'%(n.getAttribute('blob'),html.escape(n.getAttribute('alt')))
    return ''
root=doc.documentElement
parts=[block(c) for c in root.childNodes if c.nodeType==1]
H='\n'.join(p for p in parts if p)
open('doc1.html','w').write(H); print(len(H))
