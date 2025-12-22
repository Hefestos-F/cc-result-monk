// ==UserScript==
// @name         Zendesk: Painel 580px + enviar ticket e contato (CONFIG + helpers revisados)
// @namespace    franciel.zendesk.ticket.bridge
// @version      1.5.1
// @description  Extrai ticket e nome do solicitante (via encontrarNome + helpers), aplica localmente (se existirem inputs) e envia ao Registro via postMessage.
// @author       Franciel
// @match        https://smileshelp.zendesk.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/resgis2/zendesk.floatbutton.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/resgis2/zendesk.floatbutton.user.js
// ==/UserScript==

(function () {
  "use strict";

  /** ===========================
   *  CONFIGURAÇÕES (corrigidas)
   *  =========================== */
  const CONFIG = {
    // Onde escrever o NOME encontrado (se existir no DOM atual)
    input1Selector: "#input1",
    // "placeholder" | "value" | "valueIfEmpty"
    input1Mode: "valueIfEmpty",

    // Onde escrever o NÚMERO DO TICKET encontrado na URL (se existir no DOM atual)
    input5Selector: "#input5",
    // "placeholder" | "value" | "valueIfEmpty"
    input5Mode: "value",

    // Destaque visual
    highlight: true,

    // Debounce de observação (não usado aqui, mantido por compatibilidade)
    debounceMs: 300,

    // Tempo máximo para aguardar o ticket no DOM
    waitTimeoutMs: 15000,

    // Gerador de regex do texto do ticket ("Ticket #<n>")
    ticketRegexText: (n) =>
      new RegExp(
        `Ticket\\s*#\\s*${String(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      ),

    // Logs de depuração
    debug: false,
  };

  const LOG_PREFIX = "[TM encontrarNome]";
  const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
  const log = (...args) => CONFIG.debug && console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  /** ===========================
   *  EXTRAIR TICKET DA URL
   *  =========================== */
  function extrairTicketDaURL(href) {
    const setStr = (v) => (v == null ? null : String(v));
    let numero = null;
    try {
      const url = new URL(href);

      // 1) Segmentos do path (pega o último que contenha dígitos)
      const pathSegs = url.pathname.split("/").filter(Boolean);
      for (let i = pathSegs.length - 1; i >= 0 && !numero; i--) {
        const m = pathSegs[i].match(/\d+/);
        if (m) numero = m[0];
      }

      // 2) /ticket(s)/<n>
      if (!numero) {
        const m = href.match(/\/tickets?\/(\d+)/i);
        if (m) numero = m[1];
      }

      // 3) Hash
      if (!numero && url.hash) {
        const m = url.hash.match(/\d+/);
        if (m) numero = m[0];
      }

      // 4) Query (?ticket_id=<n> ou ?id=<n>)
      if (!numero) {
        const qp =
          url.searchParams.get("ticket_id") || url.searchParams.get("id");
        if (qp && /^\d+$/.test(qp)) numero = qp;
      }
    } catch {
      // Fallback: último grupo de dígitos na URL
      const m = (href || "").match(/(\d+)(?!.*\d)/);
      if (m) numero = m[1];
    }
    return setStr(numero);
  }

  /** ===========================
   *  ACHAR "Ticket #<n>" E NOME ANTERIOR NO DOC ATUAL
   *  =========================== */
  function findTicketAndPrevNameInDoc(doc, ticketNumber) {
    if (!ticketNumber) return null;
    const needle = CONFIG.ticketRegexText(ticketNumber);

    // Preferir navs com aria-label sugestivo; senão, todos os <nav>
    const preferred = Array.from(
      doc.querySelectorAll(
        'nav[aria-label*="Localiza" i], nav[aria-label*="ticket" i]'
      )
    );
    const navs = preferred.length
      ? preferred
      : Array.from(doc.querySelectorAll("nav"));

    for (const nav of navs) {
      const nodes = Array.from(
        nav.querySelectorAll("span, [role='link'], [role='button']")
      );
      for (const el of nodes) {
        const text = normalize(el.textContent);
        if (!text || !needle.test(text)) continue;

        // Sobe ao <span> contêiner mais externo que contém o texto
        let container = el;
        while (
          container.parentElement &&
          container.parentElement.tagName === "SPAN" &&
          needle.test(normalize(container.parentElement.textContent))
        ) {
          container = container.parentElement;
        }

        // Irmão anterior com texto = nome
        let nameEl = container.previousElementSibling;
        while (nameEl && !normalize(nameEl.textContent)) {
          nameEl = nameEl.previousElementSibling;
        }

        return { nav, container, nameEl };
      }
    }
    return null;
  }

  /** Espera o ticket aparecer no DOM deste contexto */
  function waitForTicketInThisDoc(
    doc,
    ticketNumber,
    timeout = CONFIG.waitTimeoutMs
  ) {
    return new Promise((resolve) => {
      const start = performance.now();
      let done = false;

      const tryFind = () => {
        if (done) return true;
        const found = findTicketAndPrevNameInDoc(doc, ticketNumber);
        if (found) {
          cleanup();
          done = true;
          resolve(found);
          return true;
        }
        if (performance.now() - start >= timeout) {
          cleanup();
          done = true;
          resolve(null);
          return true;
        }
        return false;
      };

      const mo = new MutationObserver(() => {
        tryFind();
      });
      try {
        mo.observe(doc, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      } catch {}

      const interval = setInterval(() => {
        tryFind();
      }, 300);
      tryFind();

      function cleanup() {
        try {
          mo.disconnect();
        } catch {}
        clearInterval(interval);
      }
    });
  }

  /**
   * Aplica texto ao input alvo.
   * mode:
   *  - "placeholder": sempre escreve placeholder
   *  - "value": sempre escreve value
   *  - "valueIfEmpty": escreve em value apenas se estiver vazio; caso contrário, preserva o value e opcionalmente define placeholder
   */
  function applyToInput(
    doc,
    selector,
    mode,
    text,
    { setPlaceholderWhenHasValue = true } = {}
  ) {
    const elHere = doc.querySelector(selector);
    const elTop = document.querySelector(selector);
    const input = elHere || elTop;
    if (!input) {
      warn(`Input não encontrado: ${selector}`);
      return { input: null, applied: null, used: null };
    }

    const words = normalize(text || "").split(" ");
    const first = words[0] || "";
    const value =
      !first || !isNaN(first)
        ? "Anônimo"
        : first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();

    try {
      if (mode === "value") {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return { input, applied: value, used: "value" };
      }
      if (mode === "placeholder") {
        input.placeholder = value;
        return { input, applied: value, used: "placeholder" };
      }
      // valueIfEmpty
      const current = (input.value ?? "").trim();
      if (!current) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return { input, applied: value, used: "valueIfEmpty(value)" };
      } else {
        if (setPlaceholderWhenHasValue && !input.placeholder) {
          input.placeholder = value;
        }
        return { input, applied: null, used: "valueIfEmpty(skip)" };
      }
    } catch (e) {
      warn("Falha ao aplicar no input:", e);
      return { input, applied: null, used: "error" };
    }
  }

  /** Destaque visual opcional */
  function highlightEls(ticketEl, nameEl) {
    if (!CONFIG.highlight) return;
    try {
      if (ticketEl) ticketEl.style.borderBottom = "1px solid #0ea5e9";
      if (nameEl) nameEl.style.borderBottom = "1px solid #f97316";
      setTimeout(() => {
        if (ticketEl) ticketEl.style.borderBottom = "";
        if (nameEl) nameEl.style.borderBottom = "";
      }, 1200);
    } catch {}
  }

  /**
   * ===========================
   *  encontrarNome(ticketNumber)
   *  ===========================
   * Retorna { ticket, nomeCompleto, primeiroNomeFmt, ... }
   * Aplica no input1 conforme CONFIG.input1Mode, usando primeiroNomeFmt.
   */
  async function encontrarNome(ticketNumber) {
    // Utilitário: formata "fulano" -> "Fulano"
    const formatPrimeiroNome = (txt) => {
      const t = (txt || "").trim();
      if (!t) return "";
      // Extrai a primeira "palavra" (até espaço)
      const first = t.split(/\s+/)[0];
      const lower = first.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    const ticketStr = ticketNumber == null ? "" : String(ticketNumber).trim();
    if (!ticketStr) {
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn("Nenhum número de ticket fornecido a encontrarNome().");
      return null;
    }

    const found = await waitForTicketInThisDoc(
      document,
      ticketStr,
      CONFIG.waitTimeoutMs
    );
    if (!found) {
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn(
        `Ticket #${ticketStr} não apareceu neste contexto em ${CONFIG.waitTimeoutMs}ms.`
      );
      return null;
    }

    const { container, nameEl } = found;
    if (!nameEl) {
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn(`Nome anterior ao Ticket #${ticketStr} não encontrado.`);
      return null;
    }

    const nomeCompleto = normalize(nameEl.textContent);
    const primeiroNomeFmt = formatPrimeiroNome(nomeCompleto);

    const res = applyToInput(
      document,
      CONFIG.input1Selector,
      CONFIG.input1Mode,
      primeiroNomeFmt
    );
    highlightEls(container, nameEl);

    log(
      `Ticket #${ticketStr} | Nome completo: "${nomeCompleto}" | Primeiro nome: "${primeiroNomeFmt}" | Aplicado:`,
      res.applied,
      "| modo:",
      res.used
    );

    return {
      ticket: ticketStr,
      nomeCompleto,
      primeiroNomeFmt,
      aplicado: res.applied,
      modeUsed: res.used,
      elements: { ticket: container, nome: nameEl },
    };
  }

  /** ===========================
   *  UI: botão flutuante e painel com iframe (580px)
   *  =========================== */
  const RC_ORIGIN = "https://registrodechamadas.netlify.app";
  const RC_URL = `${RC_ORIGIN}/?embed=zendesk`;
  const PANEL_WIDTH = 580;
  const PANEL_HEIGHT = 520;

  // CSS do botão/painel
  const cssUI = `
    #rc-float-btn {
      position: fixed; right: 16px; bottom: 16px; width: 44px; height: 44px;
      border-radius: 50%; background: #2b6cb0; color: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 32px rgba(0,0,0,0.35); cursor: grab; z-index: 999999; user-select: none;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    }
    #rc-float-btn .rc-icon {
      width: 22px; height: 22px; background: white;
      mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%23000" viewBox="0 0 24 24"><path d="M4 4h16v2H4V4zm0 6h16v2H4v-2zm0 6h16v2H4v-2z"/></svg>') no-repeat center / contain;
    }
    #rc-panel {
      position: fixed; left: 70px; top: 70px; width: ${PANEL_WIDTH}px; height: ${PANEL_HEIGHT}px;
      z-index: 999998; background: #0f1115; color: #e6e8ea; border-radius: 12px;
      border: 1px solid #2a2f3a; box-shadow: 0 10px 32px rgba(0,0,0,0.35); display: none; overflow: hidden;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    }
    #rc-panel-header {
      height: 40px; display: flex; align-items: center; justify-content: space-between;
      background: #181b21; border-bottom: 1px solid #2a2f3a; padding: 0 8px; cursor: move;
    }
    #rc-panel-actions { display: flex; gap: 6px; }
    .rc-btn {
      background: #3a3f4b; color: #fff; border: none; border-radius: 8px; height: 28px; padding: 0 10px; cursor: pointer; font-size: 12px;
    }
    .rc-btn.primary { background: #2b6cb0; }
    #rc-iframe { width: 100%; height: calc(100% - 40px); border: 0; }
  `;
  if (typeof GM_addStyle === "function") GM_addStyle(cssUI);
  else {
    const s = document.createElement("style");
    s.textContent = cssUI;
    document.head.appendChild(s);
  }

  // Botão flutuante
  const btn = document.createElement("div");
  btn.id = "rc-float-btn";
  btn.title = "Abrir Registro de Chamadas";
  btn.innerHTML = '<span class="rc-icon" aria-hidden="true"></span>';
  document.body.appendChild(btn);

  // Painel
  const panel = document.createElement("div");
  panel.id = "rc-panel";
  panel.innerHTML = `
    <div id="rc-panel-header">
      <div style="font-size:13px;font-weight:600;">Registro de Chamadas</div>
      <div id="rc-panel-actions">
        
        <button id="rc-close" class="rc-btn primary">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Iframe criado corretamente (evita markup quebrado)
  const iframe = document.createElement("iframe");
  iframe.id = "rc-iframe";
  iframe.src = RC_URL;
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("referrerpolicy", "no-referrer");
  panel.appendChild(iframe);

  // Mostrar/ocultar painel
  btn.addEventListener("click", () => {
    const show = panel.style.display === "none" || panel.style.display === "";
    panel.style.display = show ? "block" : "none";
    if (show) setTimeout(() => enviarDadosParaRegistro().catch(warn), 400);
  });
  panel
    .querySelector("#rc-close")
    .addEventListener("click", () => (panel.style.display = "none"));
  

  // Drag do botão flutuante
  (function dragFloatButton() {
    let dragging = false,
      startX = 0,
      startY = 0,
      origLeft = 0,
      origTop = 0;
    btn.addEventListener("mousedown", (e) => {
      dragging = true;
      btn.style.cursor = "grabbing";
      startX = e.clientX;
      startY = e.clientY;
      const rect = btn.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX,
        dy = e.clientY - startY;
      const vw = innerWidth,
        vh = innerHeight,
        size = 44;
      const left = Math.max(8, Math.min(vw - size - 8, origLeft + dx));
      const top = Math.max(8, Math.min(vh - size - 8, origTop + dy));
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
      btn.style.position = "fixed";
    }
    function onUp() {
      dragging = false;
      btn.style.cursor = "grab";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
  })();

  // Drag do painel pela barra
  (function dragPanel() {
    const header = panel.querySelector("#rc-panel-header");
    let dragging = false,
      sx = 0,
      sy = 0,
      ol = 0,
      ot = 0;
    header.addEventListener("mousedown", (e) => {
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      const r = panel.getBoundingClientRect();
      ol = r.left;
      ot = r.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      const vw = innerWidth,
        vh = innerHeight,
        r = panel.getBoundingClientRect();
      const left = Math.max(8, Math.min(vw - r.width - 8, ol + dx));
      const top = Math.max(8, Math.min(vh - r.height - 8, ot + dy));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.position = "fixed";
    }
    function onUp() {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
  })();

  /** ===========================
   *  Enviar dados ao Registro (postMessage)
   *  =========================== */
  async function enviarDadosParaRegistro() {
    const href = window.location.href || "";
    const numero = extrairTicketDaURL(href);
    const ticket = numero || "000000";

    let contato = "";
    try {
      const res = await encontrarNome(ticket);
      contato = res && res.primeiroNomeFmt ? res.primeiroNomeFmt : "";
    } catch (e) {
      warn("Falha ao obter contato via encontrarNome():", e);
    }

    const payload = { type: "preencher", ticket, contato };
    try {
      iframe.contentWindow?.postMessage(payload, RC_ORIGIN);
      log("Payload enviado ao Registro:", payload);
    } catch (e) {
      warn("Falha ao enviar payload:", e);
    }
    return payload;
  }

  // Handshake: quando o Registro avisar que está pronto, enviamos
  window.addEventListener("message", (ev) => {
    if (ev.origin !== RC_ORIGIN) return;
    const data = ev.data || {};
    if (data.type === "ready") {
      log("Registro READY → enviando dados...");
      enviarDadosParaRegistro().catch(warn);
    }
  });

  // Reenvio quando a rota mudar (SPA)
  (function watchRoute() {
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        setTimeout(() => enviarDadosParaRegistro().catch(warn), 500);
      }
    }, 1000);
  })();

  // Envio inicial ao carregar o iframe
  iframe.addEventListener("load", () => {
    setTimeout(() => enviarDadosParaRegistro().catch(warn), 400);
  });
})();
