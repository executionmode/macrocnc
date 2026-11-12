/* Service worker — deixa o app funcionando offline.
 * Ao publicar uma versão nova, mude CACHE (ex.: macro-cnc-v22) para os aparelhos baixarem tudo de novo.
 */
const CACHE = 'macro-cnc-v71';
const ASSETS = [
  './', './index.html', './styles.css', './theme.css', './art.js', './img/splash.jpg', './img/home.jpg', './img/exemplos.jpg', './img/param.jpg', './img/avatar.jpg', './img/pfoot.jpg', './img/logo.jpg', './i18n.js', './lang/en.js', './lang/fr-CA.js', './programs.en.js', './programs.fr-CA.js', './training.en.js', './training.fr-CA.js', './img/pfoot.en.jpg', './img/pfoot.fr-CA.jpg', './config.js', './programs.js', './training.js', './gcode.js', './macrosim.js', './stock3d.js', './assistant.js', './cad.js', './plan.js', './app.js', './manifest.json',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' = baixa do servidor, sem pegar cópia velha do navegador
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) =>
    fetch(new Request(a, { cache: 'reload' })).then((r) => { if (r.ok) return c.put(a, r); }).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // chamadas do assistente (POST) vão direto para a rede
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/videos/') >= 0) return;   // vídeos vêm direto da rede (arquivos grandes)
  // imagens: cache primeiro. Páginas, código e textos: rede primeiro (sempre a versão nova), cache só se estiver sem internet
  const isImg = /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname);
  if (isImg) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
  );
});
