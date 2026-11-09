// Gera os números do vídeo rodando a macro de verdade no simulador do app
global.window = {};
require('../../programs.js');
const S = require('../../macrosim.js');
const id = process.argv[2], subIdx = +(process.argv[3] || 0);
const P = window.PROGRAMS.find(p => p.id === id);
const r = S.run(P.main + '\n' + P.subs[subIdx].code, {});
if (r.errors.length) { console.error(r.errors); process.exit(1); }
const g65 = P.main.split('\n').find(l => /G65/.test(l));
const args = {}; g65.replace(/\(.*?\)/g, '').replace(/;/g, '').trim().split(/\s+/).slice(2).forEach(w => { args[w[0]] = parseFloat(w.slice(1)); });
const segs = r.segs.filter(s => s.prog !== 1 && !(P.subs[subIdx].num && s.prog !== P.subs[subIdx].num));
const out = { id, g65: g65.replace(/\s*;\s*$/, ''), args, vars: r.vars.common, segs: segs.map(s => [s.t, +s.x1.toFixed(4), +s.y1.toFixed(4), +s.x2.toFixed(4), +s.y2.toFixed(4), +s.z1.toFixed(4), +s.z.toFixed(4), s.ln, s.g]) };
console.log(JSON.stringify(out));
