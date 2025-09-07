function extrairMetadados(script) {
  const padrao = /@([\\w]+)\\s+(.*)/g;
  const metadados = {};
  let match;
  while ((match = padrao.exec(script)) !== null) {
    metadados[match[1]] = match[2];
  }
  return metadados;
}

document.addEventListener("DOMContentLoaded", () => {
  const intervalInput = document.getElementById("interval");
  const injecaoCheckbox = document.getElementById("injecao");
  const codigoArea = document.getElementById("codigo");

  chrome.storage.local.get(["interval", "injecaoAtiva", "scriptAtual"], (dados) => {
    intervalInput.value = dados.interval || 1440;
    injecaoCheckbox.checked = dados.injecaoAtiva !== false;
    codigoArea.value = dados.scriptAtual || "";
  });

  document.getElementById("salvar").addEventListener("click", () => {
    const novoIntervalo = parseInt(intervalInput.value);
    const injecaoAtiva = injecaoCheckbox.checked;
    const novoCodigo = codigoArea.value;
    const metadados = extrairMetadados(novoCodigo);

    chrome.storage.local.set({
      interval: novoIntervalo,
      injecaoAtiva: injecaoAtiva,
      scriptAtual: novoCodigo,
      versaoAtual: metadados.Versao || "",
      atualizarURL: metadados.atualizarURL || "",
      Destino: metadados.Destino || ""
    }, () => {
      chrome.alarms.clear("verificarAtualizacao", () => {
        chrome.alarms.create("verificarAtualizacao", { periodInMinutes: novoIntervalo });
        alert("Configurações salvas!");
      });
    });
  });
});
