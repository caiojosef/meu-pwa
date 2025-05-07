// Evento de instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");

  // Espera até que todos os arquivos sejam armazenados no cache "static-cache-v1.1"
  event.waitUntil(
    caches.open("static-cache-v1.1").then((cache) => {
      return cache.addAll([
        "index.html",
        "style.css",
        "app.js",
        "offline.html",
        "icons/icon-192.png",
        "icons/icon-512.png"
      ]);
    })
  );
});

// Evento de ativação para limpar caches antigos e notificar o app
self.addEventListener("activate", (event) => {
  const cacheAllowlist = ["static-cache-v1.1", "dynamic-cache-v1"];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheAllowlist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notifica a página ativa de que há uma nova versão
      const bc = new BroadcastChannel("atualizacao");
      bc.postMessage("Nova versão do app foi instalada.");
    })
  );
});

// Evento de interceptação de requisições da página
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith("http")) return;

  const acceptHeader = event.request.headers.get("accept");

  const isHtmlRequest =
    event.request.mode === "navigate" ||
    (acceptHeader && acceptHeader.includes("text/html"));

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/pwa/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(event.request)
          .then((networkRes) => {
            return caches.open("dynamic-cache-v1").then((cache) => {
              cache.put(event.request, networkRes.clone());
              return networkRes;
            });
          })
          .catch(() => {
            // Aqui você poderia retornar um fallback para imagens, etc.
          })
      );
    })
  );
});

// Evento para lidar com push notifications (via servidor)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Nova notificação!";
  const options = {
    body: data.body || "Você tem uma nova mensagem.",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
