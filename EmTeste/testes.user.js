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
  function NorTX(valor) {
    if (!valor) return "";

    return valor
      .toString()
      .normalize("NFD") // separa acentos
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .toUpperCase()
      .trim();
  }


   function encoStatus() {
      const statusName = document.querySelector(".statusName");

      const NomeDp = document.querySelector(".cus-badge__status");

      const timer = document.querySelector(".side-row-timer__text");

      if (!statusName) return false;

      let statusNameTex = statusName.textContent;
      let timerTex = "---";
      let NomeDpval = false;

      const SNT = NorTX(statusNameTex);

      if (SNT === "PRONTO") {
        statusNameTex = "Disponivel";
      } else if (SNT === "OCUPADO") {
        statusNameTex = "Trabalhando";
        if (NomeDp) {
          NomeDpval = NomeDp.textContent;
        }
      } else {
        if (NomeDp) {
          statusNameTex = NomeDp.textContent;
        }
      }

      if (timer) {
        timerTex = timer.textContent;
      }

      return {
        Status: statusNameTex,
        Pausa: NomeDpval,
        Timer: timerTex,
      };
    }
    encoStatus();

  
  let intervaloId = setInterval(() => {
   

    dados.textContent = `
  Status: ${statusNameTex} / Timer: ${timerTex}
  `;
  }, 1000);
  CriarBotInicial();
  //clearInterval(intervaloId);
})();
