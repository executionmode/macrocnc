/* Configuração de distribuição do app.
 * Depois de publicar o proxy (pasta proxy/), coloque o endereço dele em proxyUrl.
 * Assim, quem instalar o app já usa o assistente sem configurar nada.
 */
window.APP_CONFIG = {
  version: '3.6.1',
  proxyUrl: '',                 // ex.: 'https://macro-cnc-proxy.seunome.workers.dev'
  model: 'claude-sonnet-5-5',
  maxTokens: 8000,
  // Vídeos do treinamento: número do capítulo -> link do YouTube (vazio = botão escondido)
  videos: {
    '7': ''   // Faceamento O1611
  }
};
