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

  /*
   *horaedataparacalculo: { hora: 'HH:MM:SS', data: 'YYYY-MM-DD' }
   *maisoumenos: true para '+' ou false para '-'
   *valordeacrecimo: string no formato 'HH:MM', 'HH:MM:SS'
   */
  function exibirHora(horaedataparacalculo, maisoumenos, valordeacrecimo) {
    function parseOffset(offsetStr) {
      // Suporta formatos com sinal: +HH:MM, -HH:MM:SS, etc.
      const m = String(offsetStr || "").match(
        /^([+-])(\d{2}):?(\d{2})(?::?(\d{2}))?$/
      );
      if (!m) return 0;
      const sign = m[1] === "-" ? -1 : 1;
      const hours = parseInt(m[2], 10);
      const minutes = parseInt(m[3], 10);
      const seconds = m[4] ? parseInt(m[4], 10) : 0;
      return sign * (hours * 3600 + minutes * 60 + seconds);
    }

    function parseDuration(durationStr) {
      // 'HH:MM' or 'HH:MM:SS' -> seconds (always positive)
      if (!durationStr) return 0;
      const m = String(durationStr).match(/^(\d{1,2}):?(\d{2})(?::?(\d{2}))?$/);
      if (!m) return 0;
      const hours = parseInt(m[1], 10);
      const minutes = parseInt(m[2], 10);
      const seconds = m[3] ? parseInt(m[3], 10) : 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    function buildDateTime(obj) {
      // obj: { data: 'YYYY-MM-DD', hora: 'HH:MM:SS' }
      const dparts = String(obj.data || "")
        .split("-")
        .map(Number);
      const tparts = String(obj.hora || "00:00:00")
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

    // Determina offset em segundos. Suporta duas formas de chamada:
    // 1) exibirHora(base, "+HH:MM:SS") -> usa sinal embutido
    // 2) exibirHora(base, maisoumenosBool, "HH:MM:SS") -> usa boolean para sinal
    let offsetSec = 0;
    if (typeof maisoumenos === "string" && valordeacrecimo === undefined) {
      // segunda forma usada anteriormente: passou o valor com sinal
      offsetSec = parseOffset(maisoumenos);
    } else {
      const dur = parseDuration(valordeacrecimo || "00:00:00");
      // aceita booleano ou números 0/1 usados pelo código chamador
      const isNegative =
        maisoumenos === false ||
        (typeof maisoumenos === "number" && Number(maisoumenos) === 0) ||
        (typeof maisoumenos === "string" && maisoumenos === "0");
      const sign = isNegative ? -1 : 1; // default '+'
      offsetSec = sign * dur;
    }

    const base = buildDateTime(horaedataparacalculo);
    const adjusted = new Date(base.getTime() + offsetSec * 1000);
    const out = formatDateTime(adjusted);
    /*console.debug(
     * `Modo teste: Data: ${out.date}, Hora: ${out.time} (offset ${offsetSec}s)`);
     *
     */

    showBanner(`TESTE ${out.date} ${out.time} ${valordeacrecimo}`);
    return { date: out.date, hora: out.time };
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
