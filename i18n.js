/* Macro CNC — idiomas (pt, en, fr-CA).
 * Português é o texto original do app. Nos outros idiomas, um dicionário (lang/<idioma>.js) troca os textos da tela
 * automaticamente, inclusive os criados depois (listas, avisos, simulação). Conteúdo grande (programas, treinamento)
 * vem em pacotes próprios: programs.<idioma>.js, training.<idioma>.js.
 */
(function () {
  'use strict';
  var LANGS = { pt: 'Português', en: 'English', 'fr-CA': 'Français (Québec)' };
  // pacotes de conteúdo que já existem para cada idioma (preenchido na Fase 2)
  var PACKS = { en: ['programs', 'training'], 'fr-CA': ['programs', 'training'] };
  // idiomas já traduzidos por completo: só eles são escolhidos sozinhos pelo idioma do celular e liberados no Perfil
  var READY = { pt: true, en: true, 'fr-CA': true };

  function pick() {
    try { var s = JSON.parse(localStorage.getItem('mcnc.lang')); if (LANGS[s] && (READY[s] || /[?&]lang=/.test(location.search))) return s; } catch (e) {}
    var q = /[?&]lang=([\w-]+)/.exec(location.search); if (q && LANGS[q[1]]) return q[1];   // teste: ?lang=en
    var n = (navigator.language || 'pt').toLowerCase();
    if (n.indexOf('fr') === 0 && READY['fr-CA']) return 'fr-CA';
    if (n.indexOf('en') === 0 && READY.en) return 'en';
    return 'pt';
  }
  var lang = pick();
  var dict = {}, pats = [];
  function esc(s) { return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); }

  function add(d) {
    Object.keys(d).forEach(function (k) {
      if (/\{\w+\}/.test(k)) {
        var names = [];
        var re = new RegExp('^' + esc(k).replace(/\\?\{(\w+)\\?\}/g, function (m, n) { names.push(n); return '([\\s\\S]*?)'; }) + '$');
        pats.push({ re: re, names: names, out: d[k] });
      } else dict[k] = d[k];
    });
  }
  // traduz um texto (mantém espaços nas pontas); devolve o próprio texto se não houver tradução
  function t(s, vars) {
    if (s == null) return s;
    var str = String(s), m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str), core = m[2], out = null;
    if (lang !== 'pt' && core) {
      if (dict[core] != null) out = dict[core];
      else for (var i = 0; i < pats.length; i++) {
        var r = pats[i].re.exec(core);
        if (r) { var o = pats[i].out; pats[i].names.forEach(function (n, j) { o = o.split('{' + n + '}').join(t(r[j + 1])); }); out = o; break; }
      }
    }
    if (out == null) out = core;
    if (vars) Object.keys(vars).forEach(function (k) { out = out.split('{' + k + '}').join(vars[k]); });
    return m[1] + out + m[3];
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, PRE: 1, CODE: 1, TEXTAREA: 1, CANVAS: 1, SVG: 1 };
  function skip(el) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      if (SKIP[el.nodeName.toUpperCase()]) return true;
      if (el.classList && (el.classList.contains('code') || el.classList.contains('lst') || el.classList.contains('notr') || el.classList.contains('tr-body'))) return true;
    }
    return false;
  }
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function tNode(n) {
    if (n.nodeType === 3) {
      if (!/[A-Za-zÀ-ú]/.test(n.nodeValue) || skip(n.parentNode)) return;
      var v = t(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
    } else if (n.nodeType === 1) {
      if (skip(n)) return;
      ATTRS.forEach(function (a) { var v = n.getAttribute(a); if (v) { var w = t(v); if (w !== v) n.setAttribute(a, w); } });
      if (n.nodeName === 'OPTION' || n.nodeName === 'INPUT' && (n.type === 'button' || n.type === 'submit')) { /* textos via nós filhos ou value */ }
      var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), x;
      while ((x = w.nextNode())) {
        if (x.nodeType === 3) { if (/[A-Za-zÀ-ú]/.test(x.nodeValue) && !skip(x.parentNode)) { var v2 = t(x.nodeValue); if (v2 !== x.nodeValue) x.nodeValue = v2; } }
        else ATTRS.forEach(function (a) { var v = x.getAttribute(a); if (v && !skip(x)) { var u = t(v); if (u !== v) x.setAttribute(a, u); } });
      }
    }
  }
  function start() {
    if (lang === 'pt') return;
    document.documentElement.lang = lang === 'fr-CA' ? 'fr-CA' : lang;
    document.title = t(document.title);
    Array.prototype.forEach.call(document.querySelectorAll('img[data-src-lang]'), function (im) { im.src = im.getAttribute('data-src-lang').replace('{lang}', lang); });
    tNode(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') tNode(m.target);
        else if (m.type === 'attributes') tNode(m.target);
        else m.addedNodes.forEach(tNode);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // carrega um pacote de conteúdo (programs, training) do idioma, se existir
  function pack(name) {
    if (lang !== 'pt' && (PACKS[lang] || []).indexOf(name) >= 0) document.write('<script src="' + name + '.' + lang + '.js"><\/script>');
  }
  function setLang(l) { try { localStorage.setItem('mcnc.lang', JSON.stringify(l)); } catch (e) {} location.reload(); }

  window.I18N = { lang: lang, langs: LANGS, ready: READY, add: add, t: t, start: start, pack: pack, setLang: setLang, hasPack: function (n) { return lang !== 'pt' && (PACKS[lang] || []).indexOf(n) >= 0; } };
  window.T = t;
  if (lang !== 'pt') document.write('<script src="lang/' + lang + '.js"><\/script>');
})();
