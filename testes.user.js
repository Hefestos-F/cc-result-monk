// ==UserScript==
// @name         Nice_test
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  const modotestevalores = {
    fuso: "+12:00:00",
  };

  let modoteste = false;

  function showBanner(text) {
    let el = document.getElementById("nm-time-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "nm-time-banner";
      el.style.cssText =
        "position:fixed;right:10px;bottom:10px;z-index:2147483647;background:#111;color:#fff;padding:6px 10px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;opacity:0.95";
      document.body.appendChild(el);
    }
    el.textContent = text;
  }

  function exibirHora() {
    const agora = new Date();

    function parseOffset(offsetStr) {
      // Suporta formatos +HH:MM, +HH:MM:SS e variantes sem separador
      const m = String(offsetStr).match(/^([+-])(\d{2}):?(\d{2})(?::?(\d{2}))?$/);
      if (!m) return 0;
      const sign = m[1] === "-" ? -1 : 1;
      const hours = parseInt(m[2], 10);
      const minutes = parseInt(m[3], 10);
      const seconds = m[4] ? parseInt(m[4], 10) : 0;
      return sign * (hours * 3600 + minutes * 60 + seconds);
    }

    function formatDateTime(date) {
      const d = date.toISOString().split("T")[0];
      const t = date.toTimeString().split(" ")[0];
      return { date: d, time: t };
    }

    if (modoteste) {
      const offsetSec = parseOffset(modotestevalores.fuso);
      const adjusted = new Date(agora.getTime() + offsetSec * 1000);
      const out = formatDateTime(adjusted);
      console.log(
        `Modo teste: Data: ${out.date}, Hora: ${out.time} (fuso ${modotestevalores.fuso})`
      );
      showBanner(`TESTE ${out.date} ${out.time} ${modotestevalores.fuso}`);
    } else {
      const out = formatDateTime(agora);
      console.log(`Data: ${out.date}, Hora: ${out.time}`);
      showBanner(`${out.date} ${out.time}`);
    }
  }

  function createToggle() {
    if (document.getElementById("nm-toggle-btn")) return;
    const btn = document.createElement("button");
    btn.id = "nm-toggle-btn";
    btn.textContent = "Alternar modo teste";
    btn.title = "Alterna entre horário real e modo de teste";
    btn.style.cssText =
      "position:fixed;right:10px;bottom:50px;z-index:2147483647;background:#0069d9;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer;font-family:Arial,Helvetica,sans-serif";
    btn.addEventListener("click", () => {
      modoteste = !modoteste;
      localStorage.setItem("nm-modoteste", modoteste ? "1" : "0");
      exibirHora();
    });
    document.body.appendChild(btn);
    const stored = localStorage.getItem("nm-modoteste");
    if (stored === "1") {
      modoteste = true;
    }
  }

  function init() {
    createToggle();
    exibirHora();
    setInterval(exibirHora, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
