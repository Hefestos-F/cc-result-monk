// popup/popup.js
document.addEventListener('DOMContentLoaded', init);

const AUTOSAVE_DEBOUNCE_MS = 400;

async function init() {
  const editor = document.getElementById('scriptEditor');
  const toggle = document.getElementById('autoInject');
  const status = document.getElementById('status');

  // Carregar estado salvo (não limpar nada automaticamente)
  const { userScript, autoInjectEnabled } = await chrome.storage.local.get([
    'userScript',
    'autoInjectEnabled'
  ]);

  // Se existe script salvo, mantém; senão, carrega o modelo só na primeira vez
  editor.value = (typeof userScript === 'string') ? userScript : defaultTemplate();
  toggle.checked = (autoInjectEnabled !== undefined) ? !!autoInjectEnabled : true;
  renderStatus();

  // ---- Autosave enquanto digita (sem precisar clicar em Salvar) ----
  let saveTimer;
  editor.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await chrome.storage.local.set({ userScript: editor.value });
      setStatus('Salvo automaticamente');
    }, AUTOSAVE_DEBOUNCE_MS);
  });

  // ---- Botão Salvar (salva imediato, sem limpar) ----
  document.getElementById('save').addEventListener('click', async () => {
    try {
      await chrome.storage.local.set({ userScript: editor.value });
      setStatus('Script salvo com sucesso!');
    } catch (e) {
      console.error(e);
      setStatus('Falha ao salvar o script.');
    }
  });

  // ---- Botão Modelo Padrão (não limpa sem confirmação) ----
  document.getElementById('loadDefault').addEventListener('click', async () => {
    if (editor.value.trim()) {
      const ok = confirm('Substituir o conteúdo atual pelo modelo padrão?');
      if (!ok) return; // mantém o conteúdo atual
    }
    editor.value = defaultTemplate();
    await chrome.storage.local.set({ userScript: editor.value });
    setStatus('Modelo padrão carregado e salvo.');
  });

  // ---- Toggle de injeção automática (persistente) ----
  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ autoInjectEnabled: toggle.checked });
    renderStatus();
  });

  // ---- Executar agora (não altera editor nem toggle) ----
  document.getElementById('runNow').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return setStatus('Nenhuma aba ativa encontrada.');
      const res = await sendMessageAsync({ type: 'injectNow', tabId: tab.id });
      if (res?.ok) {
        setStatus('Script injetado na aba atual!');
      } else {
        const reason = res?.reason || 'desconhecido';
        let msg = 'Não foi possível injetar agora.';
        if (reason === 'no-destino') msg = 'Seu script não possui @destino.';
        else if (reason === 'no-match') msg = 'A URL da aba não combina com @destino.';
        else if (reason === 'empty-script') msg = 'O script está vazio.';
        else if (reason === 'execute-failed') msg = 'Falha ao executar o script.';
        else if (reason === 'no-tab' || reason === 'no-url') msg = 'Aba/URL inválida.';
        setStatus(`${msg} (Motivo: ${reason})`);
      }
    } catch (e) {
      console.error(e);
      setStatus('Erro ao tentar executar agora.');
    }
  });

  function renderStatus() {
    const enabled = toggle.checked;
    status.textContent = `Injeção automática: ${enabled ? 'Ligada' : 'Desligada'}.`;
  }

  function setStatus(text) {
    status.textContent = text;
    // Limpa a mensagem temporária após 2,5s, mantendo o estado principal
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(renderStatus, 2500);
  }
}

function defaultTemplate() {
  return `// ==UserScript==
// @Nome         Teste
// @Versao       1
// @Descricao    Teste
// @Autor        Hefestos
// @destino      https://google.com/*
// @destino      https://www.google.com/*
// ==/UserScript==

(function () {
  console.log("Código injetado com sucesso!");
})();`;
}

function sendMessageAsync(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => resolve(response));
    } catch {
      resolve(undefined);
    }
  });
}
