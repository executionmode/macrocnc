/* Proxy do Assistente CNC — Cloudflare Worker
 * Guarda a chave da API Anthropic em segredo (ninguém que usa o app vê a chave).
 * O "cérebro" do assistente (regras + programas aprovados) vem do próprio app,
 * montado em assistant.js a partir de programs.js.
 *
 * Variáveis no Cloudflare (Settings > Variables):
 *   ANTHROPIC_API_KEY  (Secret)  — sua chave sk-ant-...
 *   ALLOWED_ORIGINS    (texto)   — endereço do app, ex.: https://seunome.github.io  (vários: separe por vírgula)
 *   MAX_TOKENS         (texto)   — opcional, padrão 8000
 */

const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'];
const MAX_MESSAGES = 40;
const MAX_CHARS = 120000;      // conversa
const MAX_SYSTEM = 120000;     // regras + biblioteca
const MAX_IMAGE = 6000000;     // fotos da aba Desenho (base64)

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk && origin ? origin : (allowed[0] || '*'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: { message: 'Use POST.' } });
    if (!originOk) return json(403, { error: { message: 'Origem não autorizada.' } });
    if (!env.ANTHROPIC_API_KEY) return json(500, { error: { message: 'Servidor sem ANTHROPIC_API_KEY configurada.' } });

    let body;
    try { body = await request.json(); } catch { return json(400, { error: { message: 'JSON inválido.' } }); }

    const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : null;
    if (!messages || !messages.length) return json(400, { error: { message: 'Sem mensagens.' } });
    let chars = 0, imgBytes = 0;
    for (const m of messages) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant')) return json(400, { error: { message: 'Formato de mensagem inválido.' } });
      if (typeof m.content === 'string') { chars += m.content.length; continue; }
      // mensagem com foto (aba Desenho): só blocos de texto e imagem base64 JPEG/PNG
      if (!Array.isArray(m.content) || m.role !== 'user' || m.content.length > 6) return json(400, { error: { message: 'Formato de mensagem inválido.' } });
      for (const b of m.content) {
        if (b && b.type === 'text' && typeof b.text === 'string') chars += b.text.length;
        else if (b && b.type === 'image' && b.source && b.source.type === 'base64' && /^image\/(jpeg|png)$/.test(b.source.media_type) && typeof b.source.data === 'string') imgBytes += b.source.data.length;
        else return json(400, { error: { message: 'Formato de mensagem inválido.' } });
      }
    }
    if (imgBytes > MAX_IMAGE) return json(413, { error: { message: 'Foto grande demais.' } });
    if (chars > MAX_CHARS) return json(413, { error: { message: 'Conversa grande demais. Comece uma nova conversa.' } });
    while (messages.length && messages[0].role !== 'user') messages.shift();

    let system = body.system;
    const sysText = Array.isArray(system) ? system.map((b) => (b && b.text) || '').join('') : String(system || '');
    if (!sysText.startsWith('Você é o Assistente CNC')) return json(400, { error: { message: 'Pedido não reconhecido.' } });
    if (sysText.length > MAX_SYSTEM) return json(413, { error: { message: 'Biblioteca grande demais para o assistente.' } });
    if (!Array.isArray(system)) system = [{ type: 'text', text: sysText, cache_control: { type: 'ephemeral' } }];
    system = system.filter((b) => b && b.type === 'text' && typeof b.text === 'string').slice(0, 4)
      .map((b) => ({ type: 'text', text: b.text, ...(b.cache_control ? { cache_control: { type: 'ephemeral' } } : {}) }));

    const maxTokensCap = Number(env.MAX_TOKENS || 8000);
    const payload = {
      model: MODELS.includes(body.model) ? body.model : MODELS[0],
      max_tokens: Math.min(Number(body.max_tokens) || 2048, maxTokensCap),
      system,
      messages,
      stream: body.stream !== false
    };

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const headers = new Headers(cors);
    headers.set('content-type', upstream.headers.get('content-type') || 'application/json');
    headers.set('cache-control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
