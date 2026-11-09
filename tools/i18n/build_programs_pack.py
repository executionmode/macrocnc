import json, sys
sys.path.insert(0, '/home/claude/i18n')
from pstr import T
import rules
src = json.load(open('/tmp/comments.json'))
def lines(f): return [l.rstrip('\n').split('|', 1)[1] for l in open(f)]
C = {'en': lines('/home/claude/i18n/c_en.txt'), 'fr-CA': lines('/home/claude/i18n/c_fr.txt')}
for lang, idx in (('en', 1), ('fr-CA', 2)):
    com = {src[i]: '(' + C[lang][i] + ')' for i in range(len(src))}
    strs = {t[0]: t[idx] for t in T}
    R = rules.EN if lang == 'en' else rules.FR
    js = '''/* Pacote de conteúdo (%s): textos e comentários dos programas, regras da oficina. Gerado por tools/i18n. */
(function () {
  var S = %s, C = %s;
  function tc(code) { return code.replace(/\\([^()]*\\)/g, function (m) { return C[m] || m; }); }
  function ts(s) { return s && S[s] != null ? S[s] : s; }
  (window.PROGRAMS || []).forEach(function (p) {
    p.title = ts(p.title); p.desc = ts(p.desc); p.notes = (p.notes || []).map(ts);
    (p.presets || []).forEach(function (x) { x.label = ts(x.label); });
    if (p.labels) Object.keys(p.labels).forEach(function (k) { p.labels[k] = ts(p.labels[k]); });
    p.main = tc(p.main); (p.subs || []).forEach(function (s) { s.code = tc(s.code); if (s.label) s.label = ts(s.label); });
  });
  window.RULES = %s;
})();
''' % (lang, json.dumps(strs, ensure_ascii=False), json.dumps(com, ensure_ascii=False), json.dumps(R, ensure_ascii=False, indent=1))
    open('/home/claude/macro-cnc/programs.%s.js' % lang, 'w').write(js)
    print(lang, len(js))
