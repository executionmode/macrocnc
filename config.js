/* Configuração de distribuição do app.
 * Depois de publicar o proxy (pasta proxy/), coloque o endereço dele em proxyUrl.
 * Assim, quem instalar o app já usa o assistente sem configurar nada.
 */
window.APP_CONFIG = {
  version: '3.9.0',
  proxyUrl: '',                 // ex.: 'https://macro-cnc-proxy.seunome.workers.dev'
  model: 'claude-sonnet-5-5',
  maxTokens: 8000,
  // Vídeos do treinamento: número do capítulo -> arquivo .mp4 do app (videos/...) ou link do YouTube
  videos: {
    '7': { pt: 'videos/faceamento_O1611.mp4', en: 'videos/faceamento_O1611.en.mp4', 'fr-CA': 'videos/faceamento_O1611.fr-CA.mp4' },   // Faceamento O1611
    '8': { pt: 'videos/furos_circulo_O1612.mp4', en: 'videos/furos_circulo_O1612.en.mp4', 'fr-CA': 'videos/furos_circulo_O1612.fr-CA.mp4' },   // Furos em círculo O1612
    '9': { pt: 'videos/furo_helice_O1613.mp4' },   // Furo em hélice O1613 (en / fr-CA em seguida)
    '12': { pt: 'videos/poligono_O1617.mp4', en: 'videos/poligono_O1617.en.mp4', 'fr-CA': 'videos/poligono_O1617.fr-CA.mp4' },   // Contorno de polígono O1617
    '13': { pt: 'videos/raio_O1618.mp4', en: 'videos/raio_O1618.en.mp4', 'fr-CA': 'videos/raio_O1618.fr-CA.mp4' },   // Raio convexo e côncavo O1618
    '16': { pt: 'videos/cone_O1630.mp4', en: 'videos/cone_O1630.en.mp4', 'fr-CA': 'videos/cone_O1630.fr-CA.mp4' }   // Cone externo O1630
  }
};
