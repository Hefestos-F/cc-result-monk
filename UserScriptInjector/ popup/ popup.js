document.addEventListener('DOMContentLoaded', init);

async function init() {
  const editor = document.getElementById('scriptEditor');
  const toggle = document.getElementById('autoInject');
  const status = document.getElementById('status');

  const { userScript, autoInjectEnabled } = await chrome.storage.local.get([
    'userScript',
    'autoInjectEnabled'
  ]);

  editor.value = userScript || defaultTemplate();
  toggle.checked = (autoInjectEnabled !== undefined) ? !!autoInjectEnabled : true;
  renderStatus();

  // Salvar script
  document.getElementById('save').addEventListener('click', async () => {
    try {
      const script = editor.value;
      await chrome.storage.local.set({ userScript: script });
      alert('Script salvo com sucesso!');
      renderStatus();
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar o script.');
    }
  });

  // Modelo padrão
  document.getElementById('loadDefault').addEventListener('click', () => {
    editor.value = defaultTemplate();
    renderStatus();
  });

  // Alternar injeção automática
  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ autoInjectEnabled: toggle.checked });
    renderStatus();
  });

  // Executar agora (opcional)
  document.getElementById('runNow').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return alert('Nenhuma aba ativa encontrada.');

      const res = await sendMessageAsync({ type: 'injectNow', tabId: tab.id });
      if (res?.ok) {
        alert('Script injetado na aba atual!');
      } else {
        const reason = res?.reason || 'desconhecido';
        let msg = 'Não foi possível injetar agora.';
        if (reason === 'no-destino') msg = 'Seu script não possui @destino.';
        else if (reason === 'no-match') msg = 'A URL da aba não combina com @destino.';
        else if (reason === 'empty-script') msg = 'O script está vazio.';
        else if (reason === 'execute-failed') msg = 'Falha ao executar o script.';
        else if (reason === 'no-tab' || reason === 'no-url') msg = 'Aba/URL inválida.';
        alert(`${msg}\nMotivo: ${reason}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao tentar executar agora.');
    }
  });

  function renderStatus() {
    const enabled = toggle.checked;
    status.textContent = `Injeção automática: ${enabled ? 'Ligada' : 'Desligada'}.`;
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
