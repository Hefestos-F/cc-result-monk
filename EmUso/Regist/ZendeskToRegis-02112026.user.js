// ==UserScript==
// @name         Zendesk > Registro de Chamadas
// @namespace    franciel.zendesk.ticket.bridge
// @version      1.5.5
// @description  Extrai ticket e nome do solicitante (via encontrarNome + helpers), aplica localmente (se existirem inputs) e envia ao Registro via postMessage.
// @author       Franciel
// @match        https://smileshelp.zendesk.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmUso/Regist/ZendeskToRegis.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmUso/Regist/ZendeskToRegis.user.js
// ==/UserScript==

(function () {
  "use strict";

  const stt = {
    andament: 1,
    observa: 1,
    idSelecionado: {},
    StatusTk: {},
  };

  const config = {
    NomeAt: "",
  };

  const outrav = ["RESOLVIDO", "FECHADO", "NOVO"];

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
        "i",
      ),

    // Logs de depuração
    debug: false,
  };

  const LOG_PREFIX = "[TM encontrarNome]";
  const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
  const log = (...args) => CONFIG.debug && console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  function obterEntityIdSelecionado() {
    //const item = document.querySelector('[data-selected="true"]');
    const item = document.querySelector('[data-entity-is-selected="true"]');
    if (!item) return null; // ou "", ou false — como preferir

    return item.getAttribute("data-entity-id");
  }

  function oloop() {
    const oid = obterEntityIdSelecionado();
    if (oid) aMarcacaoObrig(oid);
  }

  // Atualiza o timer a cada segundo
  setInterval(oloop, 1000);

  function aMarcacaoObrig(id) {
    const f = document.querySelector(
      `[data-test-id="ticket-${CSS.escape(id)}-standard-layout"]`,
    );

    const erroSalv = f?.querySelector(
      '[data-test-id="ticket_saving_error_notification"]',
    );

    if (!f) return;

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

    const oSidebar = f.querySelector("#ticket_sidebar");
    if (!oSidebar) return;

    // 🧹 limpa erros antigos
    oSidebar
      .querySelectorAll(".erro-obrigatorio")
      .forEach((el) => el.classList.remove("erro-obrigatorio"));

    if (!erroSalv) return;

    // ✅ lê corretamente os spans do erro
    const osObrig = Array.from(erroSalv.querySelectorAll("li span")).map(
      (span) =>
        span.textContent.replace(" é obrigatório", "").replace(/"/g, "").trim(),
    );

    // 🔎 normalização segura
    const normalizar = (txt = "") =>
      txt
        .replace("*", "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

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



 

  

  function getNomeAntesDoTicket(numeroTicket) {
    if (!numeroTicket) return "-X";

    // span do ticket
    const ticketSpan = document.querySelectorAll(
      '[data-test-id="tabs-section-nav-item-ticket"]',
    );

    if (ticketSpan.length === 0) {
      return "X-X";
    }
    let onomecer = "XZX";

    ticketSpan.forEach((s) => {
      if (s.textContent.includes(`Ticket #${numeroTicket}`)) {
        const gg = s.parentElement.querySelector(
          '[data-test-id="tabs-nav-item-users"]',
        );

        if (gg) onomecer = gg.textContent;
      }
    });

    const normalizeNome = (s) => (s || "").replace(/\s+/g, " ").trim();

    const formatPrimeiroNomeDIF = (txt) => {
      const t = (txt || "").trim();
      if (!t) return "";
      // Extrai a primeira "palavra" (até espaço)
      const first = t.split(/\s+/)[0];
      const lower = first.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    const nomeCompleto = normalizeNome(onomecer);

    return {
      primeiroNome: formatPrimeiroNomeDIF(nomeCompleto),
      nomeCompleto: nomeCompleto,
    };
  }

  /** ===========================
   *  UI: botão flutuante e painel com iframe (580px)
   *  =========================== */

  const PANEL_WIDTH = 580;
  const PANEL_HEIGHT = 520;
  const REGISTRO_HTML = `
  
  <!doctype html>
<html lang="pt-BR">...
</html>
  `;

  // CSS do botão/painel
  const cssUI = `
    #rc-float-btn {
      position: fixed; left: 8px; top: 6px; width: 44px; height: 44px;
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

  iframe.srcdoc = REGISTRO_HTML;

  iframe.setAttribute("loading", "lazy");

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
    const numero = obterEntityIdSelecionado();
    const ticket = numero || "000000";

    let contato = "";
    try {
      const res = await getNomeAntesDoTicket(ticket);
      contato = res && res.primeiroNome ? res.primeiroNome : "";
    } catch (e) {
      warn("Falha ao obter contato via encontrarNome():", e);
    }

    const payload = { type: "preencher", ticket, contato };
    try {
      iframe.contentWindow?.postMessage(payload, "*");
      log("Payload enviado ao Registro:", payload);
    } catch (e) {
      warn("Falha ao enviar payload:", e);
    }
    return payload;
  }

  // Handshake: quando o Registro avisar que está pronto, enviamos
  window.addEventListener("message", (ev) => {
    if (ev.source !== iframe.contentWindow) return;
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
  setTimeout(() => {
    enviarDadosParaRegistro().catch(warn);
  }, 1000);


})();
