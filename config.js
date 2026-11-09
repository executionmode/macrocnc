/* Configuração de distribuição do app.
 * Depois de publicar o proxy (pasta proxy/), coloque o endereço dele em proxyUrl.
 * Assim, quem instalar o app já usa o assistente sem configurar nada.
 */
window.APP_CONFIG = {
  version: '3.6.0',
  proxyUrl: '',                 // ex.: 'https://macro-cnc-proxy.seunome.workers.dev'
  model: 'claude-sonnet-5-5',
  maxTokens: 8000
};
