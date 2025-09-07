chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["interval"], (data) => {
    const interval = data.interval || 1440;
    chrome.alarms.create("verificarAtualizacao", { periodInMinutes: interval });
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "verificarAtualizacao") {
    fetch("https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js")
      .then(res => res.text())
      .then(script => {
        const novaVersao = script.match(/@Versao\s+(\d+)/)?.[1];
        chrome.storage.local.get(["versaoAtual"], (dados) => {
          if (novaVersao && novaVersao !== dados.versaoAtual) {
            chrome.storage.local.set({ versaoAtual: novaVersao, scriptAtual: script });
            console.log("Nova versão detectada e armazenada.");
          }
        });
      });
  }
});
