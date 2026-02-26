// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  
  function obterEstadoAgenteComoObjeto() {
    const el = document.querySelector(
      '[data-testid="current-agent-state"]',
    );
    if (!el) return null;

    const raw = (el.textContent || "").trim(); // Ex.: "FSDisponível (03:08)"

    // 1) Captura o tempo (HH:MM) se existir
    const tempoMatch = raw.match(/\((\d{2}:\d{2})\)/);
    const tempo = tempoMatch ? tempoMatch[1] : null; // "03:08" ou null

    // 2) Remove prefixo de 2 chars + remove o "(HH:MM)"
    let status = raw
      .replace(/^\s*.{2}/, "") // ignora as 2 primeiras letras (ex.: "FS")
      .replace(/\s*\(\d{2}:\d{2}\)\s*/, "") // remove "(HH:MM)"
      .trim();

    

    return {
      Status: status, // Ex.: "Disponivel"
      tempo: tempo || "", // Ex.: "03:08" ou "" se não houver
    };
  }

  // Exemplo de uso:
  const info = obterEstadoAgenteComoObjeto();
  console.log(info);
  // -> { Status: "Disponivel", tempo: "03:08" }
})();
