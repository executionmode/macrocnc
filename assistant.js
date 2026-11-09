/* Assistente CNC: conversa com o Claude (API Anthropic) com resposta em tempo real.
 * O "cérebro" do assistente (regras do padrão + programas aprovados) é montado aqui,
 * a partir de programs.js e dos programas que o usuário marcou como testados.
 *  - proxy: o app chama o seu servidor (proxy/worker.js), que guarda a chave. Use para distribuir.
 *  - key:   o próprio usuário informa a chave dele.
 */
(function (root) {
  'use strict';
  var CFG_KEY = 'mcnc.cfg';
  var STATUS = { aprovado: 'APROVADO NA MAQUINA', revisado: 'REVISADO, SEM TESTE NA MAQUINA', 'nao-testado': 'NAO TESTADO', problema: 'COM PROBLEMA CONHECIDO' };

  function buildSystem(userPrograms) {
    var R = root.RULES || [], P = root.PROGRAMS || [];
    var out = [];
    out.push('Você é o Assistente CNC do app Macro CNC. Trabalha para operadores de fresadoras com comando FANUC (máquina de referência: Romi D1250 V6) e escreve programas parametrizados simples e macros G65 exatamente no padrão do operador que criou o app.');
    out.push('');
    out.push('# Como trabalhar');
    out.push('- Responda sempre em português do Brasil, curto e direto, como um colega de chão de fábrica.');
    out.push('- Antes de escrever código novo, veja se um programa aprovado da biblioteca já resolve. Se resolver, entregue o programa principal com a chamada G65 desse sub (ou o parametrizado com as variáveis trocadas), dizendo qual é.');
    out.push('- Se faltar um dado essencial (medidas da peça, diâmetro da ferramenta, profundidade, número da ferramenta, posição do zero), pergunte numa lista curta antes de escrever. Se o usuário pedir para seguir mesmo assim, use valores de exemplo e marque cada um com (CONFERIR) no comentário.');
    out.push('- Se o usuário escolheu o tipo: "parametrizado" = programa único com variáveis # no início, IF GOTO, sem G65; "macro" = programa principal O00xx + sub O16xx chamado por G65. Sem escolha, use parametrizado para peça única e macro quando o mesmo tipo de operação se repete com medidas diferentes.');
    out.push('- Copie a estrutura, o estilo dos comentários, os nomes e a ordem das variáveis dos programas aprovados abaixo. O programa novo tem que parecer escrito pela mesma pessoa.');
    out.push('- Entregue cada programa completo num bloco ```gcode separado, com % na primeira e na última linha. Macro: um bloco para o principal e outro para o sub.');
    out.push('- Depois do código: (1) o que cada variável ou letra faz, em lista curta; (2) "Conferir antes de rodar": G54, corretor H, valores de exemplo, Single Block e avanço reduzido na primeira peça.');
    out.push('- Todo programa novo é "novo, não testado" até o operador aprovar na máquina. Nunca diga que um programa novo está aprovado.');
    out.push('- Confira as contas: incrementos que fecham exato, raios de G2/G3 iguais no início e no fim, sentido de corte, Z começando na face.');
    out.push('- Se a pergunta for sobre outra coisa (alarme, ciclo, parâmetro), responda com o que você sabe e diga quando não tem certeza; número de parâmetro do comando sempre "confirmar no manual da máquina".');
    out.push('');
    out.push('# Regras do padrão do operador (obrigatórias)');
    R.forEach(function (sec) {
      out.push('## ' + sec.t);
      sec.items.forEach(function (it) { out.push('- ' + it); });
    });
    out.push('');
    out.push('# Biblioteca de programas (referência de estilo)');
    out.push('Os aprovados rodaram na máquina. Os outros servem de exemplo de estilo, mas não estão aprovados.');
    P.forEach(function (p) {
      out.push('');
      out.push('## ' + p.title + ' [' + (STATUS[p.status] || p.status) + ']');
      out.push(p.desc);
      (p.notes || []).forEach(function (n) { out.push('Obs.: ' + n); });
      out.push('```gcode\n' + p.main + '\n```');
      if (p.subs) {
        var seen = {};
        p.subs.forEach(function (s) {
          if (seen[s.key]) return; seen[s.key] = 1;
          if (P.some(function (q) { return q !== p && q.subs && q.subs.some(function (x) { return x.key === s.key; }) && P.indexOf(q) < P.indexOf(p); })) {
            out.push('(Sub O' + s.num + ' já mostrado acima.)'); return;
          }
          out.push((s.label ? 'Sub O' + s.num + ' - ' + s.label : 'Sub O' + s.num) + ':');
          out.push('```gcode\n' + s.code + '\n```');
        });
      }
    });
    if (userPrograms && userPrograms.length) {
      out.push('');
      out.push('# Programas que o operador testou e aprovou depois (também são padrão)');
      var budget = 30000;
      userPrograms.forEach(function (u) {
        if (budget <= 0) return;
        var t = u.text.slice(0, budget); budget -= t.length;
        out.push('## ' + u.name + ' [APROVADO NA MAQUINA]');
        out.push('```gcode\n' + t + '\n```');
      });
    }
    return out.join('\n');
  }

  function loadCfg() {
    var d = root.APP_CONFIG || {};
    var c = { mode: 'proxy', proxyUrl: d.proxyUrl || '', apiKey: '', model: d.model || 'claude-sonnet-5-5' };
    try { var s = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); for (var k in s) if (s[k] !== undefined && s[k] !== '') c[k] = s[k]; } catch (e) {}
    if (!c.proxyUrl && d.proxyUrl) c.proxyUrl = d.proxyUrl;
    return c;
  }
  function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
  var sampleFn = null;   // assistente do próprio Claude quando a página roda dentro do Claude
  function cfgReady(c) { c = c || loadCfg(); return c.mode === 'key' ? !!c.apiKey : !!c.proxyUrl; }
  function isReady(c) { return cfgReady(c) || !!sampleFn; }
  function setSample(fn) { sampleFn = fn; }

  async function sendViaSample(messages, onText, signal, userPrograms) {
    var msgs = messages.map(function (m) { return { role: m.role, content: m.content }; });
    msgs[0] = { role: 'user', content: 'INSTRUCOES DO APP (siga sempre, em todas as respostas):\n' + buildSystem(userPrograms || []) + '\n\n---\nPEDIDO DO OPERADOR:\n' + msgs[0].content };
    try {
      var r = await sampleFn(msgs, { onText: function (o) { if (o && typeof o.text === 'string') onText(o.text); }, signal: signal, cache: false, modelTier: 'complex' });
      return (r.text || '') + (r.truncated ? '\n\n_(Resposta cortada por tamanho. Peça "continue".)_' : '');
    } catch (e) {
      if (signal && signal.aborted) { var ab = new Error('abort'); ab.name = 'AbortError'; throw ab; }
      if (e && e.code === 'not_granted') throw new Error('O Claude não liberou o assistente nesta página. Toque em Enviar de novo e aceite o pedido de permissão.');
      if (e && e.code === 'rate_limited') throw new Error('Muitas mensagens em pouco tempo. Espere um pouco e tente de novo.');
      throw new Error((e && e.message) || 'Erro no assistente.');
    }
  }

  function friendlyError(status, text) {
    var msg = text;
    try { var j = JSON.parse(text); msg = (j.error && (j.error.message || j.error.type)) || text; } catch (e) {}
    if (status === 401) return 'Chave da API inválida (401). Confira a chave nas configurações.';
    if (status === 403) return 'Acesso negado (403). ' + msg;
    if (status === 404) return 'Endereço ou modelo não encontrado (404). ' + msg;
    if (status === 413) return msg;
    if (status === 429) return 'Muitas mensagens em pouco tempo (429). Espere um pouco e tente de novo.';
    if (status === 529 || status === 503) return 'O serviço está sobrecarregado agora. Tente de novo em instantes.';
    return 'Erro ' + status + ': ' + msg;
  }

  /* messages: [{role, content}] · userPrograms: [{name, text}] aprovados pelo usuário */
  async function send(messages, onText, signal, userPrograms) {
    var c = loadCfg();
    if (!cfgReady(c)) {
      if (sampleFn) return sendViaSample(messages, onText, signal, userPrograms);
      throw new Error('Assistente não configurado.');
    }
    var maxTokens = (root.APP_CONFIG && root.APP_CONFIG.maxTokens) || 8000;
    var system = [{ type: 'text', text: buildSystem(userPrograms || []), cache_control: { type: 'ephemeral' } }];
    var body = { model: c.model, max_tokens: maxTokens, system: system, messages: messages, stream: true };
    var url, headers = { 'content-type': 'application/json' };
    if (c.mode === 'key') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = c.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    } else {
      url = c.proxyUrl.replace(/\/+$/, '');
    }
    var res;
    try {
      res = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new Error('Sem conexão com o assistente. Verifique a internet' + (c.mode === 'proxy' ? ' e o endereço do proxy.' : '.'));
    }
    if (!res.ok) throw new Error(friendlyError(res.status, await res.text()));

    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '', full = '', stop = null;
    while (true) {
      var r = await reader.read();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true }).replace(/\r\n/g, '\n');
      var idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        var chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
        chunk.split('\n').forEach(function (line) {
          if (line.indexOf('data:') !== 0) return;
          var data = line.slice(5).trim();
          if (!data) return;
          var ev; try { ev = JSON.parse(data); } catch (e) { return; }
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
            full += ev.delta.text; onText(full);
          } else if (ev.type === 'message_delta' && ev.delta) {
            stop = ev.delta.stop_reason || stop;
          } else if (ev.type === 'error') {
            throw new Error((ev.error && ev.error.message) || 'Erro no streaming.');
          }
        });
      }
    }
    if (stop === 'max_tokens') full += '\n\n_(Resposta cortada por tamanho. Peça "continue".)_';
    return full;
  }

  root.Assistant = { send: send, loadCfg: loadCfg, saveCfg: saveCfg, isReady: isReady, setSample: setSample, buildSystem: buildSystem };
})(this);
