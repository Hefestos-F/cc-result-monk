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

  function addContagem(id) {
    const e = `Contador${id}`;
    const c = document.getElementById(e);

    HefestoLog(`${e} ja existe`);

    if (c) return;
    const a = document.querySelector(
      `[data-entity-id="${CSS.escape(id)}"][data-test-id="header-tab"]`,
    );

    const b = document.createElement("div");
    b.id = e;
    b.style.cssText = `
      box-sizing: border-box;
      justify-self: center;
      background: darkcyan;
      border-radius: 6px;
      padding: 0px 3px;
      margin-bottom: -8px;
      font-size: 12px;
      position: relative;
      z-index: 1;
    `;
    b.textContent = "00:00";

    if (a) {
      const d = a.querySelectorAll("div")[0];
      d.prepend(b);
      HefestoLog(`Adicionado em data-entity-id="${id}"`);
    } else {
      HefestoLog(`data-entity-id="${id}" não encontrado`);
    }
  }

  addContagem("23002787");
})();
