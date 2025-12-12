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

  const horaedataparacalculo = {
    hora: "24:00:00",
    data: "2025-12-11",
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
  
  function mostrarHora() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, "0");
    const minutos = String(agora.getMinutes()).padStart(2, "0");
    const segundos = String(agora.getSeconds()).padStart(2, "0");
    return `${horas}:${minutos}:${segundos}`;
  }

  function exibirHora(horaedataparacalculo, valordeacrecimo) {
    function parseOffset(offsetStr) {
      // Suporta formatos +HH:MM, +HH:MM:SS e variantes sem separador
      const m = String(offsetStr).match(
        /^([+-])(\d{2}):?(\d{2})(?::?(\d{2}))?$/
      );
      if (!m) return 0;
      const sign = m[1] === "-" ? -1 : 1;
      const hours = parseInt(m[2], 10);
      const minutes = parseInt(m[3], 10);
      const seconds = m[4] ? parseInt(m[4], 10) : 0;
      return sign * (hours * 3600 + minutes * 60 + seconds);
    }

    function buildDateTime(obj) {
      // obj: { data: 'YYYY-MM-DD', hora: 'HH:MM:SS' }
      const dparts = String(obj.data).split("-").map(Number);
      const tparts = String(obj.valor || "00:00:00")
        .split(":")
        .map(Number);
      if (dparts.length < 3) return new Date();
      let [year, month, day] = dparts;
      let [hh = 0, mm = 0, ss = 0] = tparts;
      if (hh === 24) {
        hh = 0;
        const tmp = new Date(year, month - 1, day);
        tmp.setDate(tmp.getDate() + 1);
        year = tmp.getFullYear();
        month = tmp.getMonth() + 1;
        day = tmp.getDate();
      }
      return new Date(year, month - 1, day, hh, mm, ss);
    }

    function formatDateTime(date) {
      const d = date.toISOString().split("T")[0];
      const t = date.toTimeString().split(" ")[0];
      return { date: d, time: t };
    }

    const base = buildDateTime(horaedataparacalculo);
    const offsetSec = parseOffset(valordeacrecimo);
    const adjusted = new Date(base.getTime() + offsetSec * 1000);
    const out = formatDateTime(adjusted);
    console.log(
      `Modo teste: Data: ${out.date}, Hora: ${out.time} (fuso ${valordeacrecimo})`
    );
    showBanner(`TESTE ${out.date} ${out.time} ${valordeacrecimo}`);

    return { date: out.date, time: out.time };
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
      exibirHora(horaedataparacalculo, modotestevalores.fuso);
    });
    document.body.appendChild(btn);
    const stored = localStorage.getItem("nm-modoteste");
    if (stored === "1") {
      modoteste = true;
    }
  }

  function init() {
    createToggle();
    exibirHora(horaedataparacalculo, modotestevalores.fuso);
    setInterval(() => {
      exibirHora(horaedataparacalculo, modotestevalores.fuso);
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
