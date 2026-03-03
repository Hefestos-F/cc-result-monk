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
  function ladoNoViewport(el) {
    if (!el || !el.getBoundingClientRect) {
      return { side: "center", distancePx: 0 };
    }

    const rect = el.getBoundingClientRect();

    const a = window.innerWidth / 2;

    let lado = rect.left >= a ? "right" : "left";

    return { lado: lado, esquerda: rect.left, Largura: a };
  }

  const info = ladoNoViewport(document.getElementById("minhaCaixa"));
  console.log(info);
})();
