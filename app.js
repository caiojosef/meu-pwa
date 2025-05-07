// Verifica se o navegador suporta notificações e se ainda não foi concedida permissão
// Solicita permissão para notificações com feedback e controle
function solicitarPermissaoNotificacao() {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      // Pede permissão apenas se ainda não foi dada nem negada
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("✅ Permissão para notificações concedida.");
        } else {
          console.warn("❌ Permissão para notificações negada.");
        }
      });
    } else if (Notification.permission === "granted") {
      console.log("🔔 Permissão já concedida.");
    } else {
      console.warn("⚠️ O usuário bloqueou as notificações.");
    }
  } else {
    console.error("🚫 Este navegador não suporta notificações.");
  }
}

// Chama a função assim que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  solicitarPermissaoNotificacao();
});


// Verifica se o navegador suporta Service Workers e registra o arquivo sw.js
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js") // Caminho para o Service Worker
    .then(() => console.log("Service Worker registrado!"))
    .catch((erro) => console.log("Erro no SW:", erro));
}

// Verifica se o app está em modo standalone (instalado)
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Variável para guardar o evento de instalação adiado
let deferredPrompt;

// Evento disparado antes do prompt de instalação ser exibido
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // Impede o comportamento padrão
  deferredPrompt = e; // Salva o evento para usar depois

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (!isStandalone) {
    // Cria o botão de instalação manualmente
    const installBtn = document.createElement("button");
    installBtn.textContent = "📲 Instalar Aplicativo";
    installBtn.style = "position: fixed; bottom: 20px; right: 20px; z-index: 999;";
    document.body.appendChild(installBtn);

    installBtn.addEventListener("click", () => {
      deferredPrompt.prompt(); // Mostra o prompt

      // Espera a escolha do usuário
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("Usuário aceitou instalar");
        } else {
          console.log("Usuário recusou a instalação");
        }

        deferredPrompt = null;
        installBtn.remove(); // Remove o botão após a escolha
      });
    });
  }
});

// ========== Lógica do To-Do List ========== //

// Seleciona os elementos do DOM
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");

// Carrega tarefas salvas no localStorage ou inicia com array vazio
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Salva as tarefas no localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Renderiza as tarefas na tela
function renderTasks() {
  list.innerHTML = ""; // Limpa a lista antes de renderizar

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = task.text; // Texto da tarefa

    if (task.done) li.classList.add("completed"); // Marca como concluída

    // Alterna o status de concluída ao clicar
    li.addEventListener("click", () => {
      tasks[index].done = !tasks[index].done;
      saveTasks();
      renderTasks();
    });

    // Botão de remover tarefa
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "x";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Impede de marcar como concluída ao remover
      tasks.splice(index, 1); // Remove do array
      saveTasks();
      renderTasks();
    });

    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

// Evento de envio do formulário (nova tarefa)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();

  if (text) {
    tasks.push({ text, done: false }); // Adiciona tarefa ao array
    saveTasks();
    renderTasks();
    input.value = ""; // Limpa campo de entrada

    // Envia notificação se permitido
    if (Notification.permission === "granted") {
      new Notification("✅ Tarefa adicionada com sucesso!");
    }
  }
});

// Inicializa a lista de tarefas ao carregar a página
renderTasks();
