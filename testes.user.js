// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  // Observa adições/remoções de filhos dentro de [data-test-id="header-tablist"]
  function observarHeaderTablist(onAdd, onRemove) {
    const alvo = document.querySelector('[data-test-id="header-tablist"]');
    if (!alvo) {
      console.warn('Elemento [data-test-id="header-tablist"] não encontrado.');
      return null;
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // Processa apenas mudanças de filhos (adições/remoções)
        if (m.type !== "childList") continue;

        // Nó(s) adicionados
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            onAdd?.(n);
          }
        });

        // Nó(s) removidos
        m.removedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            onRemove?.(n);
          }
        });
      }
    });

    observer.observe(alvo, { childList: true });
    return observer; // permite desconectar depois se quiser
  }

  // Exemplo de uso:
  const obs = observarHeaderTablist(
    (el) => console.log("Adicionado:", el),
    (el) => console.log("Removido:", el),
  );

  // Para parar: obs?.disconnect();
})();
