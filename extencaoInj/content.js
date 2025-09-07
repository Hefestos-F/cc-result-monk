chrome.storage.local.get(["scriptAtual", "injecaoAtiva"], (dados) => {
  if (dados.injecaoAtiva === false) {
    console.log("Injeção desativada.");
    return;
  }

  if (dados.scriptAtual) {
    const script = document.createElement("script");
    script.textContent = dados.scriptAtual;
    document.documentElement.appendChild(script);
    script.remove();
  } else {
    document.body.style.backgroundColor = "lightblue";
    console.log("Código padrão injetado.");
  }
});
