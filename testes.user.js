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
  // ========= CONFIG =========
  const DEBUG = localStorage.getItem("hefesto:debug") === "1"; // ative com: localStorage.setItem('hefesto:debug','1')
  const DEBOUNCE_MS = 300;

  // ========= LOG UTILS =========
  function HefestoLog(...args) {
    if (DEBUG) console.log("HefestoLog:", ...args);
  }
  function warn(...args) {
    console.warn("HefestoLog:", ...args);
  }
  function error(...args) {
    console.error("HefestoLog:", ...args);
  }

  // ========= HELPERS =========
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  //=================================
  function nomeaa(id) {
    const a = document.querySelector(
      `[data-entity-id="${CSS.escape(id)}"][data-test-id="header-tab"][data-is-chat="true"]`,
    );

    return a.getAttribute("aria-label");
  }


  function VerificarNome(id, nome) {
    // Guardas rápidos
    if (!id || typeof nome !== "string" || !nome.trim()) return false;

    // Normaliza para comparação: remove acentos, lowercase e trim
    const normalizar = (s) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
        .toLowerCase()
        .trim();

    const nomeNorm = normalizar(nome);

    // Encontra o root dentro do ticket específico
    const root = document.querySelector(
      `[data-ticket-id="${CSS.escape(String(id))}"] [data-test-id="omni-log-container"]`,
    );
    if (!root) return false;

    // Coleta os remetentes
    const remetentes = root.querySelectorAll(
      '[data-test-id="omni-log-item-sender"]',
    );
    if (!remetentes.length) return false;

    // Verifica se algum contém o nome
    for (const el of remetentes) {
      const txtNorm = normalizar(el.textContent);
      if (txtNorm.includes(nomeNorm)) return true;
    }
    return false;
  }

  VerificarNome("23018070", nomeaa("23018070"))


  
})();
