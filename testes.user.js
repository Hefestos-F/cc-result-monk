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
  function abrirPopup(html, largura = 400, altura = 300) {
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

  const c1aixaDeCor = criarCaixaSeg();
  const Botao = document.createElement("button");
  Botao.id = `Pausas`;
  Botao.style.cssText = `
            padding: 2px 4px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 10px;
            height: 22px;
            display: flex;
            align-items: center;
            `;

  Botao.textContent = `Pausas`;

  c1aixaDeCor.append(Botao);

  abrirPopup(
    `
  <html>
  <head>
    <title>Popup Teste</title>
  </head>
  <body>
    <h2>Olá, eu sou um popup!</h2>
    <p>Conteúdo HTML simples.</p>
  </body>
  </html>
`,
    650,
    820,
  );
})();
