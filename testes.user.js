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
  function abrirPopup(html, largura = 650, altura = 820) {
    const popup = window.open(
      "",
      "minhaJanela",
      `width=${largura},height=${altura},resizable=yes,scrollbars=yes`,
    );

    if (!popup) {
      alert("O navegador bloqueou o popup.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  

  abrirPopup(
    `
    
`,
    650,
    820,
  );

 


})();
