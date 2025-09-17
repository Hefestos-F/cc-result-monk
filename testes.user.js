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
  function buscarValorPorTicket(ticketNumero) {
    const container = document.querySelector(
      '[aria-label="Localização da página do ticket"]'
    );

    if (!container) {
      console.warn("Container não encontrado.");
      return false;
    }

    const spans = Array.from(container.querySelectorAll("span"));

    for (let i = 0; i < spans.length; i++) {
      const texto = spans[i].textContent.trim();

      // Verifica se o texto contém o número do ticket
      if (texto.includes(`Ticket #${ticketNumero}`)) {
        // Retorna o conteúdo do segundo <span> dentro do container
        if (spans.length >= 2) {
          const segundoValor = spans[1].textContent.trim();
          console.log(`Valor encontrado: ${segundoValor}`);
          return segundoValor;
        } else {
          console.warn("Menos de dois <span> encontrados.");
          return false;
        }
      }
    }

    console.warn(`Ticket #${ticketNumero} não encontrado.`);
    return false;
  }
  buscarValorPorTicket("20224562");
})();
