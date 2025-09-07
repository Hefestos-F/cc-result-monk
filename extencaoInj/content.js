chrome.storage.local.get(["scriptAtual", "injecaoAtiva", "Destino"], (dados) => {
  if (dados.injecaoAtiva === false) {
    console.log("Injeção desativada.");
    return;
  }

  const urlAtual = window.location.href;
  const destino = dados.Destino || "";

  if (urlAtual.match(new RegExp(destino.replace("*", ".*")))) {
    if (dados.scriptAtual) {
      const script = document.createElement("script");
      script.textContent = dados.scriptAtual;
      document.documentElement.appendChild(script);
      script.remove();
    } else {
      console.log("Nenhum script disponível para injeção.");
    }
  }
});
