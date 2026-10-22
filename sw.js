// Mochila de Jogo: funciona sem internet.
// Ao publicar uma nova versão, aumente o número abaixo.
const VERSAO = "mochila-v5";
const ARQUIVOS = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSAO && k !== "mochila-fontes").map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fontes do Google: guarda na primeira vez que abrir com internet
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("mochila-fontes").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; }
      catch { return new Response("", { status: 503 }); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Página: tenta a versão nova, e sem internet usa a guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSAO).then(c => c.put("./index.html", copy)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Demais arquivos: guardados primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone(); caches.open(VERSAO).then(c => c.put(req, copy)); return res;
  })));
});
