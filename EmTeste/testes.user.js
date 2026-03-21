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

  
const item = { pausa: 'disPonÍvel' };

if (NorTX(item?.pausa) === 'DISPONIVEL') {
  console.log('Match OK');
}


  function CriarBotInicial() {
    const div = document.createElement("div");
    div.id = "oTimer";
    div.style.cssText = `
    position: absolute;
    top: 16px;
    left: 54px;
    border-radius: 15px;
    border: 1px solid white;
    cursor: pointer;
    background: #a9cae7;
    padding: 2px 4px;
    `;

    document.body.appendChild(div);
  }

  let intervaloId = setInterval(() => {
    function encoStatus() {


      class="phone-active__item selected__collapse"

      
      const Atend = document.querySelector(".cus-submenu__icon-arrow");
      if(Atend)Atend.textContent
      const statusName = document.querySelector(".statusName");

      const NomeDp = document.querySelector(".cus-badge__status");

      const timer = document.querySelector(".side-row-timer__text");

      const dados = document.querySelector("#BotInicial");

      let statusNameTex = "---";
      let timerTex = "---";

      if (!statusName) return null;

      statusNameTex = statusName.textContent;
      if (statusNameTex === "Pronto") {
        statusNameTex = "Disponivel";
      } else if (statusNameTex === "Ocupado") {
        statusNameTex = "Trabalhando";
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
        Timer: timerTex,
      };
    }

    dados.textContent = `
  Status: ${statusNameTex} / Timer: ${timerTex}
  `;
  }, 1000);
  CriarBotInicial();
  //clearInterval(intervaloId);
})();
