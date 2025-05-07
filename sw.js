// Evento de instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");

  // Espera até que todos os arquivos sejam armazenados no cache "static-cache-v1"
  event.waitUntil(
    caches.open("static-cache-v1.1").then((cache) => {
      // Lista de arquivos que serão armazenados para funcionar offline
      return cache.addAll([
         // redireciona para index.html
        "index.html",
        "style.css",
        "app.js",
        "offline.html", // página de fallback offline
        "icons/icon-192.png",
        "icons/icon-512.png"
      ]);
    })
  );
});

// Evento de interceptação de requisições da página
self.addEventListener("fetch", (event) => {
  // Garante que a requisição é HTTP (ignora chrome-extension, data:, etc.)
  if (!event.request.url.startsWith("http")) return;

  const acceptHeader = event.request.headers.get("accept");

  // Verifica se a requisição é uma navegação de página HTML
  const isHtmlRequest =
    event.request.mode === "navigate" ||
    (acceptHeader && acceptHeader.includes("text/html"));

  if (isHtmlRequest) {
    // Se for uma página, tenta buscar na rede e, se falhar, exibe offline.html
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/pwa/offline.html"))
    );
    return;
  }

  // Para outros tipos de arquivos (CSS, JS, imagens, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return (
        cachedRes ||
        fetch(event.request)
          .then((networkRes) => {
            // Salva dinamicamente no cache "dynamic-cache-v1"
            return caches.open("dynamic-cache-v1").then((cache) => {
              cache.put(event.request, networkRes.clone());
              return networkRes; // retorna o conteúdo da rede
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
  // Extrai os dados enviados pelo servidor (em JSON)
  const data = event.data ? event.data.json() : {};

  // Define o título e corpo da notificação
  const title = data.title || "Nova notificação!";
  const options = {
    body: data.body || "Você tem uma nova mensagem.",
    icon: "icons/icon-192.png", // ícone que aparece na notificação
    badge: "icons/icon-192.png", // ícone pequeno na barra do sistema
  };

  // Exibe a notificação para o usuário
  event.waitUntil(self.registration.showNotification(title, options));
});
