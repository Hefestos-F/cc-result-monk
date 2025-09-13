// ==UserScript==
// @name         Nice_test
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://cxagent.nicecxone.com/home*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        none

// ==/UserScript==

(function () {
  "use strict";

  // Função para encontrar o item pelo aria-label
  function findItem(label) {
    return document.querySelector(
      `button[role="button"][aria-label="${label}"]`
    );
  }

  function findItemComSinonimos(label, { root = document, synonyms = [] } = {}) {
  // tenta o label principal
  let el = findItem(label, { root });
  if (el) return el;

  // tenta sinônimos
  for (const s of synonyms) {
    el = findItem(s, { root });
    if (el) return el;
  }
  return null;
}

// Uso:
console.log(findItemComSinonimos('Relatórios', { synonyms: ['Reporting', 'Reports'] }));
console.log(findItemComSinonimos('Produtividade', { synonyms: ['Productivity'] }));
console.log(findItemComSinonimos('Desempenho', { synonyms: ['Performance'] }));
console.log(findItemComSinonimos('Hoje', { synonyms: ['Today'] }));


  // Função para clicar no item
  function clickItem(label) {
    const el = findItem(label);
    if (!el) {
      console.log(`Item "${label}" não encontrado`);
      return false;
    }
    el.scrollIntoView({ block: "center", inline: "center" });
    el.focus();
    el.click();
    return true;
  }
  // Clicar
  clickItem("Reporting");
  clickItem("Produtividade");
  clickItem("Desempenho");
  clickItem("Hoje");
  
})();
