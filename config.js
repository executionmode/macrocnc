/* Configuração de distribuição do app.
 * Depois de publicar o proxy (pasta proxy/), coloque o endereço dele em proxyUrl.
 * Assim, quem instalar o app já usa o assistente sem configurar nada.
 */
window.APP_CONFIG = {
  version: '3.28.1',
  proxyUrl: '',                 // ex.: 'https://macro-cnc-proxy.seunome.workers.dev'
  model: 'claude-sonnet-5-5',
  sheetAuthor: 'Leandro Marcus',   // nome que sai em 'Desenho' e 'Aprovado' na folha A4 (cada pessoa pode trocar em Exportar)
  maxTokens: 8000,
  // Vídeos do treinamento: número do capítulo -> arquivo .mp4 do app (videos/...) ou link do YouTube
  // Programa da biblioteca -> capítulo que tem o vídeo dele
  progVideos: { 'm-face': '7', 'm-pcd': '8', 'm-helice': '9', 'm-poli': '12', 'm-raio-convexo': '13', 'm-raio-concavo': '13', 'm-cone': '14' },
  videos: {
    '7': { pt: 'videos/faceamento_O1611.mp4', en: 'videos/faceamento_O1611.en.mp4', 'fr-CA': 'videos/faceamento_O1611.fr-CA.mp4' },   // Faceamento O1611
    '8': { pt: 'videos/furos_circulo_O1612.mp4', en: 'videos/furos_circulo_O1612.en.mp4', 'fr-CA': 'videos/furos_circulo_O1612.fr-CA.mp4' },   // Furos em círculo O1612
    '9': { pt: 'videos/furo_helice_O1613.mp4' },   // Furo em hélice O1613 (en / fr-CA em seguida)
    '12': { pt: 'videos/poligono_O1617.mp4', en: 'videos/poligono_O1617.en.mp4', 'fr-CA': 'videos/poligono_O1617.fr-CA.mp4' },   // Contorno de polígono O1617
    '13': { pt: 'videos/raio_O1618.mp4', en: 'videos/raio_O1618.en.mp4', 'fr-CA': 'videos/raio_O1618.fr-CA.mp4' },   // Raio convexo e côncavo O1618
    '14': { pt: 'videos/cone_O1630.mp4', en: 'videos/cone_O1630.en.mp4', 'fr-CA': 'videos/cone_O1630.fr-CA.mp4' }   // Cone externo O1630
  },
  // Curso em vídeo (Treinamento > Vídeos): tocado em sequência, um vídeo puxa o próximo
  course: [
    { m: 'Módulo 1 · A linguagem', items: [
      { t: 'Abertura do curso', v: { pt: 'videos/curso/curso_aula0.mp4' } },
      { t: 'Aula 1 · O que é uma macro', v: { pt: 'videos/curso/curso_aula1.mp4' } },
      { t: 'Aula 2 · Variáveis', v: { pt: 'videos/curso/curso_aula2.mp4' } },
      { t: 'Aula 3 · G65 e as letras', v: { pt: 'videos/curso/curso_aula3.mp4' } },
      { t: 'Aula 4 · Contas e funções', v: { pt: 'videos/curso/curso_aula4.mp4' } },
      { t: 'Aula 5 · Decisões e laços', v: { pt: 'videos/curso/curso_aula5.mp4' } },
      { t: 'Aula 6 · Alarmes e mensagens', v: { pt: 'videos/curso/curso_aula6.mp4' } }] },
    { m: 'Módulo 2 · As macros', items: [
      { t: 'Faceamento · O1611', cap: '7' },
      { t: 'Furos em círculo · O1612', cap: '8' },
      { t: 'Furo em hélice · O1613', cap: '9' },
      { t: 'Aula 7 · Bolsão circular · O1614', v: { pt: 'videos/curso/curso_aula7.mp4' } },
      { t: 'Aula 8 · Bolsão retangular · O1615', v: { pt: 'videos/curso/curso_aula8.mp4' } },
      { t: 'Polígono · O1617', cap: '12' },
      { t: 'Raio na aresta · O1618', cap: '13' },
      { t: 'Cone externo · O1630', cap: '14' }] }
  ]
};
