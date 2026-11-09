/* Configuração de distribuição do app.
 * Depois de publicar o proxy (pasta proxy/), coloque o endereço dele em proxyUrl.
 * Assim, quem instalar o app já usa o assistente sem configurar nada.
 */
window.APP_CONFIG = {
  version: '3.7.1',
  proxyUrl: '',                 // ex.: 'https://macro-cnc-proxy.seunome.workers.dev'
  model: 'claude-sonnet-5-5',
  maxTokens: 8000,
  // Vídeos do treinamento: número do capítulo -> arquivo .mp4 do app (videos/...) ou link do YouTube
  videos: {
    '7': { pt: 'videos/faceamento_O1611.mp4' }   // Faceamento O1611 (en / fr-CA entram na Fase 3)
  }
};
