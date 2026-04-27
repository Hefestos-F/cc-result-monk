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
  // ========= LOG UTILS =========

  const PreFixo = "Test HefestoLog:";

  function Hlog(...args) {
    console.log(PreFixo, ...args);
  }
  function Hwarn(...args) {
    console.warn(PreFixo, ...args);
  }
  function Herror(...args) {
    console.error(PreFixo, ...args);
  }
  function Hdebug(...args) {
    console.debug(PreFixo, ...args);
  }
  function Hinfo(...args) {
    console.info(PreFixo, ...args);
  }

  function aMarcacaoObrig(f, erroSalv) {
    if (!f || !erroSalv) return;

    // 🔴 CSS de erro (injetado uma vez)
    const STYLE_ID = "estilo-ErroOb";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .erro-obrigatorio {
          border: 1px solid red;
          border-radius: 15px;
          padding: 0px 2px;
        }
      `;
      document.head.appendChild(style);
    }

    // ✅ lê corretamente os spans do erro
    const osObrig = Array.from(erroSalv.querySelectorAll("li span")).map(
      (span) =>
        span.textContent.replace(" é obrigatório", "").replace(/"/g, "").trim(),
    );

    const oSidebar = f.querySelector("#ticket_sidebar");
    if (!oSidebar) return;

    // 🔎 normalização segura
    const normalizar = (txt = "") =>
      txt
        .replace("*", "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

    // 🧹 limpa erros antigos
    oSidebar
      .querySelectorAll(".erro-obrigatorio")
      .forEach((el) => el.classList.remove("erro-obrigatorio"));

    if (osObrig.length === 0) return;

    const obrigNorm = osObrig.map(normalizar);

    // ✅ agora buscamos os LABELS (não "*")
    const labels = oSidebar.querySelectorAll(
      'label[data-garden-id="forms.input_label"]',
    );

    labels.forEach((label) => {
      const textoLabel = normalizar(label.textContent);

      if (obrigNorm.includes(textoLabel)) {
        label.classList.add("erro-obrigatorio");
      }
    });
  }

  const f = document.querySelector(
    `[data-test-id="ticket-${CSS.escape(24646586)}-standard-layout"]`,
  );

  const erroSalv = f?.querySelector(
    '[data-test-id="ticket_saving_error_notification"]',
  );

  aMarcacaoObrig(f, erroSalv);
})();
