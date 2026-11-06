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

  /** ===========================
   *  ACHAR "Ticket #<n>" E NOME ANTERIOR NO DOC ATUAL
   *  =========================== */
  function findTicketAndPrevNameInDoc(doc, ticketNumber) {
    if (!ticketNumber) return null;
    const needle = CONFIG.ticketRegexText(ticketNumber);

    // Preferir navs com aria-label sugestivo; senão, todos os <nav>
    const preferred = Array.from(
      doc.querySelectorAll(
        'nav[aria-label*="Localiza" i], nav[aria-label*="ticket" i]',
      ),
    );
    const navs = preferred.length
      ? preferred
      : Array.from(doc.querySelectorAll("nav"));

    for (const nav of navs) {
      const nodes = Array.from(
        nav.querySelectorAll("span, [role='link'], [role='button']"),
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
    timeout = CONFIG.waitTimeoutMs,
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
    { setPlaceholderWhenHasValue = true } = {},
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
  const REGISTRO_HTML = String.raw`

  <!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Registro de Atendimento</title>
    <style>
      :root {
        --orange: #ff6a00;
        --orange-dark: #e35a00;

        --gray-900: #1e2a36;
        --gray-700: #5b6875;
        --gray-500: #95a1ad;

        --gray-300: #e1e6ea;
        --gray-200: #eef1f4;

        --surface: #ffffff;
        --background: #ffffff;

        --input-bg: #ffffff;
        --input-text: #1e2a36;
      }

      /* Tema escuro */
      body.dark {
        --gray-900: #f3f4f6;
        --gray-700: #d1d5db;
        --gray-500: #9ca3af;

        --gray-300: #374151;
        --gray-200: #1f2937;

        --surface: #111827;
        --background: #030712;

        --input-bg: #1f2937;
        --input-text: #f3f4f6;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        height: 100%;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", Roboto, Arial, Helvetica, sans-serif;
        background: var(--background);
        color: var(--gray-900);
        transition: all 0.3s ease;
      }

      /* Container */
      .app {
        max-width: clamp(360px, 90vw, 840px);
        margin: 24px auto 40px;
        padding: 0 16px;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--gray-300);
        border-radius: 12px;
        padding: 16px 14px 18px;
        transition: all 0.3s ease;
      }

      body.dark .card {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      }

      .header {
        padding: 6px 10px 0;
        display: flex;
        justify-content: space-between;
      }

      .titulo-sistema {
        margin: 6px 0;
        font-size: clamp(22px, 3.2vw, 28px);
        font-weight: 800;
        color: var(--gray-900);
      }

      .accent {
        width: auto;
        height: 4px;
        background: var(--orange);
        border-radius: 3px;
        margin: 8px 0 14px;
      }

      .field,
      .select-group,
      .input-container,
      .text-area-container {
        width: 100%;
        margin-bottom: 12px;
      }

      .input-container,
      .text-area-container {
        display: flex;
        align-items: stretch;
        overflow: hidden;
        background: var(--input-bg);
        border: 1px solid var(--gray-300);
        border-radius: 10px;
      }

      .input-prefix {
        background: var(--gray-200);
        color: var(--gray-700);
        font-size: 14px;
        padding: 10px 12px;
        border-right: 1px solid var(--gray-300);
        display: flex;
        align-items: center;
        white-space: nowrap;
      }

      .input-field,
      .text-area-field {
        border: 0;
        flex: 1;
        padding: 10px 12px;
        font-size: clamp(13px, 1.6vw, 14px);
        background: var(--input-bg);
        color: var(--input-text);
      }

      .text-area-field {
        min-height: 120px;
        resize: vertical;
      }

      .input-field:focus,
      .text-area-field:focus {
        outline: none;
      }

      .label {
        display: block;
        font-size: clamp(12px, 1.5vw, 13px);
        font-weight: 700;
        color: var(--gray-900);
        margin: 2px 0 6px;
      }

      select {
        display: block;
        width: 100%;
        padding: 10px 12px;
        font-size: clamp(13px, 1.6vw, 14px);
        border: 1px solid var(--gray-300);
        border-radius: 10px;
        background: var(--input-bg);
        color: var(--input-text);
      }

      .hidden {
        display: none;
      }

      .action-container {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .signature-box {
        flex: 1 1 100%;
      }

      .btn {
        appearance: none;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
        padding: 10px 16px;
        font-weight: 800;
        transition: 0.2s;
      }

      .btn-primary {
        background: var(--orange);
        color: #fff;
      }

      .btn-primary:hover {
        background: var(--orange-dark);
      }

      .btn-secondary {
        color: var(--gray-900);
        background: var(--gray-200);
        border: 1px solid var(--gray-300);
      }

      .btn-modoDark {
        width: fit-content;
        height: fit-content;
        appearance: none;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
        padding: 10px 16px;
        font-weight: 800;
        transition: 0.2s;
      }

      .btn-secondary:hover {
        filter: brightness(0.95);
      }

      .resultado-container {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }

      #resultado {
        width: 100%;
        min-height: 140px;
      }

      #copiarBtn {
        background: var(--orange);
        padding: 10px 16px;
        border: 0;
        color: #fff;
        border-radius: 10px;
      }

      #copiarBtn:hover {
        background: var(--orange-dark);
      }

      .creditos {
        margin-top: 8px;
        font-size: 12px;
        color: var(--gray-500);
      }

      .creditos strong {
        color: var(--gray-900);
      }

      .field--stacked .label {
        margin: 0 0 6px;
      }

      .field--stacked .input-plain,
      .field--stacked .textarea-plain {
        width: 100%;
        display: block;
        background: var(--input-bg);
        color: var(--input-text);
        border: 1px solid var(--gray-300);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: clamp(13px, 1.6vw, 14px);
      }

      .field--stacked .textarea-2plain {
        width: 100%;
        display: block;
        background: var(--input-bg);
        color: var(--input-text);
        border: 1px solid var(--gray-300);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: clamp(13px, 1.6vw, 14px);
      }

      .field--stacked .input-plain:focus,
      .field--stacked .textarea-plain:focus,
      select:focus {
        outline: none;
        border-color: var(--orange);
        box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.2);
      }

      .field--stacked .textarea-plain {
        min-height: 120px;
        resize: vertical;
      }

      .signature-block .input-plain {
        width: 100%;
      }

      .result-block .textarea-plain {
        min-height: 160px;
      }

      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: var(--background);
      }

      ::-webkit-scrollbar-thumb {
        background: var(--gray-500);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--gray-700);
      }

      /* Mobile */
      @media (max-width: 480px) {
        .card {
          padding: 14px 12px 16px;
        }

        .action-container {
          flex-direction: column;
          align-items: stretch;
        }

        .btn {
          width: 100%;
        }

        #copiarBtn {
          width: 100%;
        }
      }

      @media (min-width: 900px) {
        .result-block .textarea-plain {
          min-height: 180px;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <div class="card">
        <header class="header">
          <h1 class="titulo-sistema">Registro de Atendimento</h1>
          <button
            id="themeToggle"
            class="btn-modoDark btn-secondary"
            type="button"
            onclick="alternarTema()"
          >
            🌙
          </button>
        </header>

        <div class="accent" aria-hidden="true"></div>

        <div class="field field--stacked">
          <label class="label" for="ticket">Ticket*</label>
          <input type="text" id="ticket" class="input-plain" />
        </div>

        <div class="field field--stacked">
          <label class="label" for="contato">Nome do Cliente*</label>
          <input type="text" id="contato" class="input-plain" />
        </div>

        <div class="field field--stacked">
          <label class="label" for="localizador">Localizador</label>
          <input type="text" id="localizador" class="input-plain" />
        </div>

        <div class="field field--stacked">
          <div class="label">
            <label for="descricao">Relato*</label>
            <button
              class="btn-secondary"
              type="button"
              id="botaoDescricaoNova"
              onclick="novaDescricao()"
              style="cursor: pointer"
            >
              Dividido
            </button>
          </div>

          <textarea id="descricao" class="textarea-plain"></textarea>
          <div id="descricaoNova" style="display: none; flex-direction: column">
            <div class="field field--stacked">
              <label class="label" for="textoSolicitacao"
                >Entrou em contato solicitando:*</label
              >

              <textarea
                placeholder="Solicitação"
                class="textarea-2plain"
                id="textoSolicitacao"
              ></textarea>
            </div>
            <div class="field field--stacked">
              <label class="label" for="textoSituacao"
                >Foi realizada a verificação no sistema e constatado que:</label
              >
              <textarea
                placeholder="Situação"
                class="textarea-2plain"
                id="textoSituacao"
              ></textarea>
            </div>
            <div class="field field--stacked">
              <label class="label" for="textoResultado"
                >A solicitação foi atendida da seguinte forma:*</label
              >
              <textarea
                placeholder="Resultado"
                class="textarea-2plain"
                id="textoResultado"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="select-group">
          <label class="label" for="usouWaiver">Utilizou Waiver?</label>
          <select id="usouWaiver" onchange="toggleWaiverInput()">
            <option value="nao" selected>Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>

        <div id="waiverInfo" class="hidden">
          <div id="motivoContainer" class="field field--stacked hidden">
            <label class="label">Motivo</label>
            <select id="motivoSelect"></select>
          </div>
          <div id="waiverFieldContainer" class="field field--stacked hidden">
            <label class="label">Tipo de Waiver</label>
            <input id="tipoWaiver" class="input-plain" readonly />
          </div>
        </div>

        <div class="select-group">
          <label class="label" for="isentouDU">Isentou taxa DU?</label>
          <select id="isentouDU" onchange="toggleIsencaoDU()">
            <option value="nao" selected>Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>

        <div id="isencaoDUInfo" class="hidden">
          <div id="motivoIsencaoContainer" class="field field--stacked hidden">
            <label class="label">Motivo da isenção</label>
            <select id="motivoIsencaoSelect"></select>
          </div>
        </div>

        <div class="select-group">
          <label class="label" for="utilizouInvoice"
            >Possui Infant na reserva?</label
          >
          <select id="utilizouInvoice" onchange="toggleInvoice()">
            <option value="nao" selected>Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>

        <div id="invoiceInfo" class="hidden">
          <div class="field field--stacked">
            <label class="label">Emissor da Reserva</label>
            <select id="empresaInvoice" onchange="preencherValorInvoice()">
              <option value="">Selecione</option>
              <option value="gol">Gol</option>
              <option value="smiles">Smiles</option>
            </select>
          </div>
          <div class="field field--stacked">
            <label class="label">Invoice</label>
            <input id="valorInvoice" class="input-plain" readonly />
          </div>
        </div>

        <div class="select-group">
          <label class="label" for="realizouPagamento"
            >Utilizou link de pagamento?</label
          >
          <select id="realizouPagamento" onchange="togglePagamentoInput()">
            <option value="nao se aplica" selected>Não se aplica</option>
            <option value="nao">Nao</option>
            <option value="sim">Sim</option>
          </select>
        </div>

        <div id="pagamentoInfo" class="hidden">
          <div class="field field--stacked">
            <label class="label">Motivo</label
            ><input id="link" class="input-plain" />
          </div>
          <div class="field field--stacked">
            <label class="label">Bandeira</label
            ><input id="bandeira" class="input-plain" />
          </div>
          <div class="field field--stacked">
            <label class="label">Parcelas</label
            ><select id="parcelas"></select>
          </div>
          <div class="field field--stacked">
            <label class="label">CardholderName</label
            ><input id="cardName" class="input-plain" />
          </div>
        </div>

        <div class="action-container">
          <div class="field field--stacked">
            <label class="label">Assinatura*</label>
            <input id="assinatura" class="input-plain" />
          </div>
          <button class="btn btn-primary" onclick="gerarResumo()">Gerar</button>
          <button class="btn btn-secondary" onclick="limparTela()">
            Limpar Tela
          </button>
          <button class="btn btn-primary" onclick="copiarResultado()">
            Copiar
          </button>
        </div>

        <div class="field field--stacked">
          <label class="label">Resultado</label>
          <textarea id="resultado" class="textarea-plain" readonly></textarea>
        </div>

        <footer class="creditos">
          Desenvolvido por <strong>Leandro Salvador de Oliveira</strong>
        </footer>
      </div>
    </div>

    <script>
      function novaDescricao() {
        const descricaoNova = document.getElementById("descricaoNova");
        const descricao = document.getElementById("descricao");

        const botaoDescricaoNova =
          document.getElementById("botaoDescricaoNova");

        const descricaoNovaTrue = descricaoNova.style.display != "none";

        descricaoNova.style.display = descricaoNovaTrue ? "none" : "flex";
        descricao.style.display = !descricaoNovaTrue ? "none" : "flex";

        botaoDescricaoNova.textContent = descricaoNovaTrue
          ? "Dividido"
          : "Completo";
      }

      function alternarTema() {
        document.body.classList.toggle("dark");

        localStorage.setItem(
          "tema",
          document.body.classList.contains("dark") ? "dark" : "light",
        );

        const botao = document.getElementById("themeToggle");

        if (!botao) return;
        botao.textContent = document.body.classList.contains("dark")
          ? "☀️"
          : "🌙";
      }

      // ====== Lógica da Waiver ======
      function toggleWaiverInput() {
        const select = document.getElementById("usouWaiver");
        const waiverDiv = document.getElementById("waiverInfo");
        const motivoContainer = document.getElementById("motivoContainer");
        const motivoSelect = document.getElementById("motivoSelect");
        const tipoWaiverElem = document.getElementById("tipoWaiver");
        const waiverFieldContainer = document.getElementById(
          "waiverFieldContainer",
        );
        if (!select || !motivoSelect || !motivoContainer) return;

        motivoSelect.innerHTML = "";
        if (tipoWaiverElem) tipoWaiverElem.value = "";
        if (waiverFieldContainer) waiverFieldContainer.classList.add("hidden");
        motivoContainer.classList.add("hidden");

        if (select.value !== "sim") {
          if (waiverDiv) waiverDiv.classList.add("hidden");
          return;
        }

        if (waiverDiv) waiverDiv.classList.remove("hidden");

        const motivos = [
          { motivo: "Erro sistemico", waiver: "Waiver 01- SYSTEM ERROR" },
          {
            motivo: "Cliente Smiles Diamante categorizado cobrando assento",
            waiver: "Waiver 01- SYSTEM ERROR",
          },
          {
            motivo: "Regra tarifaria possui bagagem mas no VCR nao consta",
            waiver: "Waiver 01- SYSTEM ERROR",
          },
          {
            motivo:
              "Regra tarifária não deveria cobrar taxa, tela 30 não apresenta N/A",
            waiver: "Waiver 01- SYSTEM ERROR",
          },
          {
            motivo:
              "Serviços incluídos via site/app Smiles pagos não refletidos no Sabre",
            waiver: "Waiver 01- SYSTEM ERROR",
          },
          {
            motivo:
              "Concessão Upgrade Smiles Troca de tarifa Light Para Classic",
            waiver: "Waiver 05-SPECIAL REQUEST",
          },
          {
            motivo: "Cancelamento dentro das 24 horas",
            waiver: "Waiver 08-AE FEE NOT APPLICABLE",
          },
          {
            motivo: "Cancelamento de servicos antes do voo",
            waiver: "Waiver 08-AE FEE NOT APPLICABLE",
          },
          {
            motivo: "Marcacao de assento obrigatoria ao lado do responsavel",
            waiver: "Waiver 08-AE FEE NOT APPLICABLE",
          },
          {
            motivo: "Erro operacional comprovado",
            waiver: "Waiver 06- OPERATIONAL ERROR",
          },
          { motivo: "Remarcacao laudo medico", waiver: "Waiver 13- CONCESSAO" },
          {
            motivo: "Cancelamento laudo medico",
            waiver: "Waiver 13- CONCESSAO",
          },
          {
            motivo: "Remarcacao concurso publico",
            waiver: "Waiver 13- CONCESSAO",
          },
          {
            motivo: "Cancelamento concurso publico",
            waiver: "Waiver 13- CONCESSAO",
          },
          { motivo: "Duplicidade de compra", waiver: "Waiver 13- CONCESSAO" },
          {
            motivo: "Remarcacao erro do cliente dentro das 24 Horas",
            waiver: "Waiver 08-AE FEE NOT APPLICABLE",
          },
          {
            motivo: "Cancelamento por acomodacao",
            waiver: "Waiver 14- INVOL REACOMODACAO",
          },
          {
            motivo: "Cancelamento de servicos por acomodacao",
            waiver: "Waiver 14- INVOL REACOMODACAO",
          },
          {
            motivo: "Isencao de assento por acomodacao voo direto para conexao",
            waiver: "Waiver 14- INVOL REACOMODACAO",
          },
          {
            motivo: "Isencao da taxa de Remarcação com Cota Smiles disponivel",
            waiver: "Waiver 20-FFCOTASSMILES",
          },
          {
            motivo:
              "Isencao da taxa de Cancelamento com Cota Smiles disponivel",
            waiver: "Waiver 20-FFCOTASSMILES",
          },
          {
            motivo:
              "Isencao da taxa de Upgrade de cabine com Cota Smiles disponivel",
            waiver: "Waiver 20-FFCOTASSMILES",
          },
          {
            motivo:
              "Voa Brasil Cancelamento Parcial ida voada cancelar a volta",
            waiver: "Waiver 19- ART19RA400",
          },
          {
            motivo:
              "Voa Brasil Cancelamento Parcial cancelar ida e manter volta",
            waiver: "Waiver 19- ART19RA400",
          },
        ];

        motivoSelect.innerHTML =
          '<option value="">-- Selecione o motivo --</option>';
        motivos.forEach((item) => {
          const opt = document.createElement("option");
          opt.value = item.motivo;
          opt.textContent = item.motivo;
          motivoSelect.appendChild(opt);
        });
        motivoContainer.classList.remove("hidden");

        motivoSelect.onchange = function () {
          const escolhido = motivos.find(
            (m) => m.motivo === motivoSelect.value,
          );
          if (!escolhido) {
            if (waiverFieldContainer)
              waiverFieldContainer.classList.add("hidden");
            if (tipoWaiverElem) tipoWaiverElem.value = "";
            return;
          }
          if (tipoWaiverElem) tipoWaiverElem.value = escolhido.waiver;
          if (waiverFieldContainer)
            waiverFieldContainer.classList.remove("hidden");
        };
      }

      // ====== Lógica da Isenção de Taxa DU ======
      function toggleIsencaoDU() {
        const select = document.getElementById("isentouDU");
        const infoDiv = document.getElementById("isencaoDUInfo");
        const motivoContainer = document.getElementById(
          "motivoIsencaoContainer",
        );
        const motivoSelect = document.getElementById("motivoIsencaoSelect");
        if (!select || !infoDiv || !motivoContainer || !motivoSelect) return;

        motivoSelect.innerHTML = "";
        motivoContainer.classList.add("hidden");

        if (select.value !== "sim") {
          infoDiv.classList.add("hidden");
          return;
        }

        infoDiv.classList.remove("hidden");

        const motivosDU = [
          "Todas as vendas de receitas auxiliares",
          "Parcelamento com duas formas de pagamento",
          "Duas formas de pagamento que não sejam 2 cartões ou Travel Bank + Cartão de crédito",
          "Reserva de criança nos casos onde o adulto já possua a reserva",
          "Inclusao de infant na reserva",
          "Erro no site",
          "Isencao devido erro no cadastro",
          "Erro emissao menor desacompanhado",
          "Isencao devido SPEQ",
          "Isencao devido assitencia emergencial",
          "Isencao devido emissao MEDIF-FREMEC",
          "Para residentes no Amapá",
          "Remarcacao dentro das 24 horas",
          "Remarcacao de reserva Multitrechos",
          "Remarcacao apos no-show",
          "Cancelamentos",
        ];

        motivoSelect.innerHTML =
          '<option value="">-- Selecione o motivo --</option>';
        motivosDU.forEach((m) => {
          const opt = document.createElement("option");
          opt.value = m;
          opt.textContent = m;
          motivoSelect.appendChild(opt);
        });
        motivoContainer.classList.remove("hidden");
      }

      // ====== Lógica do Link de Pagamento ======
      function togglePagamentoInput() {
        const select = document.getElementById("realizouPagamento");
        const pagamentoDiv = document.getElementById("pagamentoInfo");
        const parcelasSelect = document.getElementById("parcelas");
        if (!select || !pagamentoDiv || !parcelasSelect) return;

        parcelasSelect.innerHTML = "";
        if (select.value == "nao") {
          for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            parcelasSelect.appendChild(option);
          }
          pagamentoDiv.classList.remove("hidden");
        } else {
          pagamentoDiv.classList.add("hidden");
        }
      }

      // ====== Lógica do Invoice (para o campo 'Possui Infant') ======
      function toggleInvoice() {
        const select = document.getElementById("utilizouInvoice");
        const invoiceDiv = document.getElementById("invoiceInfo");
        const empresaSelect = document.getElementById("empresaInvoice");
        const valorInvoice = document.getElementById("valorInvoice");
        if (!select || !invoiceDiv) return;

        if (empresaSelect) empresaSelect.value = "";
        if (valorInvoice) valorInvoice.value = "";

        if (select.value !== "sim") {
          invoiceDiv.classList.add("hidden");
          return;
        }
        invoiceDiv.classList.remove("hidden");
      }

      function preencherValorInvoice() {
        const empresaSelect = document.getElementById("empresaInvoice");
        const valorInvoice = document.getElementById("valorInvoice");
        if (!empresaSelect || !valorInvoice) return;

        const valoresTexto = {
          gol: "RS4900 - PAGTO INVOICE DUE INF VOO GOL",
          smiles: "RS6920 - PAGTO INVOICE DUE INF VOO SMILES",
        };
        const empresa = empresaSelect.value;
        valorInvoice.value = valoresTexto[empresa] || "";
      }

      // ====== Gerar Resumo ======
      async function gerarResumo() {
        const ticket = document
          .getElementById("ticket")
          .value.trim()
          .toUpperCase();

        const contato = document.getElementById("contato").value.trim();
        const localizador = document.getElementById("localizador")
          ? document.getElementById("localizador").value.trim()
          : "";
        const descricao = document.getElementById("descricao").value.trim();

        const usouWaiver = document.getElementById("usouWaiver").value;
        const tipoWaiver = document.getElementById("tipoWaiver")?.value || "";
        const motivo = document.getElementById("motivoSelect")?.value || "";

        const isentouDU = document.getElementById("isentouDU").value;
        const motivoDU =
          document.getElementById("motivoIsencaoSelect")?.value || "";

        // Possui Infant (usa fluxo de invoice)
        const utilizouInvoice =
          document.getElementById("utilizouInvoice")?.value || "nao";
        const empresaInvoice =
          document.getElementById("empresaInvoice")?.value || "";
        const valorInvoice =
          document.getElementById("valorInvoice")?.value || "";

        const realizouPagamento =
          document.getElementById("realizouPagamento").value;
        const link = document.getElementById("link")?.value.trim() || "";
        const bandeira =
          document.getElementById("bandeira")?.value.trim() || "";
        const parcelas = document.getElementById("parcelas")?.value || "";
        const cardName =
          document.getElementById("cardName")?.value.trim() || "";
        const assinatura = document.getElementById("assinatura").value.trim();

        const textoSolicitacao =
          document.getElementById("textoSolicitacao")?.value || "";
        const textoSituacao =
          document.getElementById("textoSituacao")?.value || "";
        const textoResultado =
          document.getElementById("textoResultado")?.value || "";

        const descricaoNova = document.getElementById("descricaoNova");

        const descricaoNovaTrue = descricaoNova.style.display != "none";

        let newTexto =
          "entrou em contato solicitando:\n" + textoSolicitacao + "\n\n";
        if (textoSituacao)
          newTexto +=
            "Foi realizada a verificação no sistema e constatado que:\n" +
            textoSituacao +
            "\n\n";

        newTexto +=
          "A solicitação foi atendida da seguinte forma:\n" + textoResultado;

        if (
          !ticket ||
          !contato ||
          (!descricao && !descricaoNovaTrue) ||
          ((!textoSolicitacao || !textoResultado) && descricaoNovaTrue) ||
          !assinatura
        ) {
          alert("Preencha todos os campos obrigatórios.");
          return;
        }

        let texto = "Ticket - " + ticket + "\n\n";
        if (localizador) texto += "Localizador - " + localizador + "\n\n";
        texto +=
          contato + " " + (descricaoNovaTrue ? newTexto : descricao) + "\n\n";

        if (usouWaiver === "sim") {
          texto += "Utilizado - " + tipoWaiver + "\n";
          texto += "Motivo - " + motivo + "\n";
        }

        texto += "Isentou taxa DU - " + isentouDU + "\n";
        if (isentouDU === "sim") {
          texto += "Motivo da isencao - " + motivoDU + "\n";
        }

        // Bloco Invoice (associado a Possui Infant)
        texto += "Possui Infant na reserva - " + utilizouInvoice + "\n";
        if (utilizouInvoice === "sim") {
          const empresaLabel =
            empresaInvoice === "gol"
              ? "Gol"
              : empresaInvoice === "smiles"
                ? "Smiles"
                : "";
          if (empresaLabel)
            texto += "Emissor da Reserva - " + empresaLabel + "\n";
          if (valorInvoice) texto += "Invoice - " + valorInvoice + "\n";
        }

        texto += "Utilizou link de pagamento - " + realizouPagamento + "\n";
        if (realizouPagamento === "nao") {
          texto += "Motivo - " + link + "\n";
          texto += "Bandeira - " + bandeira + "\n";
          texto += "Parcelas - " + parcelas + "\n";
          texto += "CardholderName-" + cardName;
        }

        texto += "\n" + assinatura + "\n";
        document.getElementById("resultado").value = texto;

        // Salvar no Firestore (se disponível); caso contrário, apenas loga
        const agora = new Date();
        //agora.toISOString()
        //agora.toLocaleString("pt-BR")

        const novoRegistro = {
          ticket,
          contato,
          localizador,
          waiver: tipoWaiver,
          motivo,
          isentouDU,
          motivoDU,
          utilizouInvoice,
          empresaInvoice,
          valorInvoice,
          realizouPagamento,
          link,
          bandeira,
          parcelas,
          cardName,
          assinatura,
          dataHora: agora.toLocaleString("pt-BR"),
          dataISO: agora.toISOString(),
        };

        // await AddouAtualizarPausas(ticket, novoRegistro);
      }

      // Configuração do IndexedDB
      const nomeBD = "RegistAtt";
      //const nomeBD = "HefestosTeste";
      const StoreBD = "OsRegistAtt";

      const Chave0 = "RegistreDeAtt";

      let Salvar0;

      const PreFixo = "regatt:";

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

      async function RecuperarTVariaveis() {
        try {
          Salvar0 = await RecDadosindexdb(Chave0);

          const hoje = new Date().toLocaleDateString("pt-BR");

          // ✅ garante array válido
          if (!Array.isArray(Salvar0) || Salvar0.length === 0) {
            Salvar0 = [{ data: hoje }];
            await AddOuAtuIindexdb(Chave0, Salvar0);
            return;
          }

          // ✅ valida acesso seguro
          if (Salvar0[0]?.data !== hoje) {
            Salvar0 = [{ data: hoje }];

            await AddOuAtuIindexdb(Chave0, Salvar0);
          }

          Hdebug("Encontrados em Salvar0:", Salvar0);
        } catch (e) {
          Herror("Erro ao recuperar Salvar0:", e);
        }
      }

      RecuperarTVariaveis();

      /**
       * abrirDB - abre ou cria IndexedDB para persistência de dados
       * @param {Function} callback - função a executar com banco de dados aberto
       */
      function abrirDB(callback) {
        const requisicao_bd = indexedDB.open(nomeBD, 1);

        requisicao_bd.onupgradeneeded = function (event) {
          const banco_dados = event.target.result;
          if (!banco_dados.objectStoreNames.contains(StoreBD)) {
            banco_dados.createObjectStore(StoreBD);
          }
        };

        requisicao_bd.onsuccess = function (event) {
          const banco_dados = event.target.result;
          callback(banco_dados);
        };

        requisicao_bd.onerror = function (event) {
          Herror("Erro ao abrir o banco de dados:", event.target.errorCode);
        };
      }

      /**
       * AddOuAtuIindexdb - salva ou atualiza dados no IndexedDB
       * @param {string} nomechave - chave de armazenamento
       * @param {*} dados - dados a salvar (qualquer tipo)
       * @returns {Promise<boolean>} true se salvo com sucesso
       */
      function AddOuAtuIindexdb(nomechave, dados) {
        return new Promise((resolve, reject) => {
          try {
            abrirDB(function (db) {
              const transacao = db.transaction([StoreBD], "readwrite");
              const store = transacao.objectStore(StoreBD);
              const request = store.put(dados, nomechave);

              request.onsuccess = function () {
                Hdebug("Dados salvos com sucesso na chave ", nomechave);
                resolve(true);
              };

              request.onerror = function (event) {
                Herror(
                  "Erro ao salvar os dados:",
                  event.target?.errorCode || event,
                );
                reject(event);
              };
            });
          } catch (err) {
            Herror("AddOuAtuIindexdb erro:", err);
            reject(err);
          }
        });
      }

      /**
       * RecDadosindexdb - recupera dados do IndexedDB por chave
       * @param {string} nomechave - chave de armazenamento
       * @returns {Promise<*>} dados armazenados ou false se não encontrado
       */
      function RecDadosindexdb(nomechave) {
        return new Promise((resolve, reject) => {
          abrirDB(function (db) {
            const transacao = db.transaction([StoreBD], "readonly");
            const store = transacao.objectStore(StoreBD);
            const request = store.get(nomechave);

            request.onsuccess = function (event) {
              const resultado = event.target.result;
              resolve(resultado !== undefined ? resultado : false);
            };

            request.onerror = function (event) {
              reject(event.target.errorCode);
            };
          });
        });
      }

      /**
       * ApagarChaveIndexDB - deleta uma chave do IndexedDB
       * @param {string} nomechave - chave a deletar
       */
      function ApagarChaveIndexDB(nomechave) {
        abrirDB(function (db) {
          const transacao = db.transaction([StoreBD], "readwrite");
          const store = transacao.objectStore(StoreBD);
          const request = store.delete(nomechave);

          request.onsuccess = function () {
            Hlog("Chave apagada com sucesso.", nomechave);
          };

          request.onerror = function (event) {
            Herror("Erro ao apagar a chave:", event.target.errorCode);
          };
        });
      }

      async function AddouAtualizarPausas(id, novoItem) {
        if (!Array.isArray(Salvar0)) Salvar0 = [];

        const index = Salvar0.findIndex(
          (item) => String(item?.ticket) === String(id),
        );

        let mudou = true;

        if (index !== -1) {
          const antigo = Salvar0[index];

          mudou = registroMudou(antigo, novoItem);

          if (mudou) {
            Salvar0[index] = { ...antigo, ...novoItem };
          }
        } else {
          Salvar0.push(novoItem);
        }

        if (mudou) await AddOuAtuIindexdb(Chave0, Salvar0);

        return mudou;
      }

      function registroMudou(antigo, novo) {
        if (!antigo) return true;

        const limpar = (obj) => {
          const copia = { ...obj };

          delete copia.dataHora;
          delete copia.dataISO;
          delete copia.atualizadoEm;

          return copia;
        };

        return JSON.stringify(limpar(antigo)) !== JSON.stringify(limpar(novo));
      }

      function formatarNome(nome) {
        const minusculas = ["da", "de", "do", "das", "dos", "e"];

        return nome
          .toLowerCase()
          .trim()
          .split(" ")
          .map((palavra, index) => {
            if (index > 0 && minusculas.includes(palavra)) {
              return palavra; // mantém minúsculo
            }
            return palavra.charAt(0).toUpperCase() + palavra.slice(1);
          })
          .join(" ");
      }

      // ====== Limpar Tela ======
      function limparTela() {
        document.querySelectorAll("input, textarea, select").forEach((el) => {
          if (el.id === "assinatura" || el.name === "assinatura") return;
          if (el.tagName === "SELECT") el.selectedIndex = 0;
          else el.value = "";
        });

        const resultado = document.getElementById("resultado");
        if (resultado) {
          resultado.value = "";
          resultado.style.height = "auto"; // Reset height
        }

        const textoSolicitacao = document.getElementById("textoSolicitacao");
        if (textoSolicitacao) {
          textoSolicitacao.value = "";
          textoSolicitacao.style.height = "auto"; // Reset height
        }

        const textoSituacao = document.getElementById("textoSituacao");
        if (textoSituacao) {
          textoSituacao.value = "";
          textoSituacao.style.height = "auto"; // Reset height
        }

        const textoResultado = document.getElementById("textoResultado");
        if (textoResultado) {
          textoResultado.value = "";
          textoResultado.style.height = "auto"; // Reset height
        }

        document
          .querySelectorAll(
            "#waiverInfo, #motivoContainer, #pagamentoInfo, #isencaoDUInfo, #invoiceInfo",
          )
          .forEach((div) => div.classList.add("hidden"));
      }

      function copiarResultado() {
        const resultado = document.getElementById("resultado");
        if (!resultado.value.trim()) return;
        navigator.clipboard
          .writeText(resultado.value)
          .then(() => {})
          .catch(() => {});
      }

      /* ==========================================================
                     EXPORTAÇÕES
                  ========================================================== */

      window.toggleWaiverInput = toggleWaiverInput;

      window.toggleIsencaoDU = toggleIsencaoDU;

      window.togglePagamentoInput = togglePagamentoInput;

      window.toggleInvoice = toggleInvoice;

      window.preencherValorInvoice = preencherValorInvoice;

      window.gerarResumo = gerarResumo;

      window.limparTela = limparTela;

      window.copiarResultado = copiarResultado;

      window.alternarTema = alternarTema;

      // ============= INICIALIZAÇÃO======================

      const stt = {
        observ: 1,
        ticket: "",
        contato: "",
        textHonr: "",
      };

      function setInputValue(el, value) {
        if (!el) return;
        el.focus();
        el.value = value ?? "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }

      function NorTX(valor) {
        if (!valor) return "";

        return valor
          .toString()
          .normalize("NFD") // separa acentos
          .replace(/[\u0300-\u036f]/g, "") // remove acentos
          .toUpperCase()
          .trim();
      }

      function contemNumero(valor) {
        return /\d/.test(String(valor));
      }

      window.addEventListener("message", (ev) => {
        const data = ev.data || {};

        if (data.type !== "preencher") return;

        const { ticket, contato } = data;
        const tkEl = document.getElementById("ticket");
        const ctEl = document.getElementById("contato");

        if (!tkEl) {
          warn("Input #ticket não encontrado");
        } else {
          stt.ticket = ticket;
          if (tkEl.value === "") setInputValue(tkEl, ticket);
        }

        if (!ctEl) {
          warn("Input #contato não encontrado");
        } else {
          let ocont = NorTX(contato);
          let onome =
            ocont === NorTX("Anonymous") ||
            ocont === NorTX("Anônimo") ||
            contemNumero(contato)
              ? "Pax"
              : contato;
          stt.contato = onome;
          if (ctEl.value === "") setInputValue(ctEl, onome);
        }

        Hlog("Aplicados:", { ticket, contato });
        ev.source?.postMessage(
          {
            type: "status",
            status: "ok",
            fields: ["ticket", "contato"],
          },
          "*",
        );
      });

      window.addEventListener("DOMContentLoaded", () => {
        if (localStorage.getItem("tema") === "dark") {
          document.body.classList.add("dark");
        }

        const btn = document.getElementById("themeToggle");

        if (btn) {
          btn.textContent = document.body.classList.contains("dark")
            ? "☀️"
            : "🌙";

          /* REMOVER se existir onclick no HTML */

          //btn.addEventListener("click", alternarTema());

          const textoSolicitacao = document.getElementById("textoSolicitacao");
          textoSolicitacao.addEventListener("input", () => {
            textoSolicitacao.style.height = "auto"; // Reset height
            textoSolicitacao.style.height =
              textoSolicitacao.scrollHeight + "px"; // Set new height
          });

          const textoSituacao = document.getElementById("textoSituacao");
          textoSituacao.addEventListener("input", () => {
            textoSituacao.style.height = "auto"; // Reset height
            textoSituacao.style.height = textoSituacao.scrollHeight + "px"; // Set new height
          });

          const textoResultado = document.getElementById("textoResultado");
          textoResultado.addEventListener("input", () => {
            textoResultado.style.height = "auto"; // Reset height
            textoResultado.style.height = textoResultado.scrollHeight + "px"; // Set new height
          });

          const descricao = document.getElementById("descricao");
          descricao.addEventListener("input", () => {
            descricao.style.height = "auto"; // Reset height
            descricao.style.height = descricao.scrollHeight + "px"; // Set new height
          });
        }

        toggleWaiverInput();
        toggleIsencaoDU();
        toggleInvoice();
        togglePagamentoInput();

        const ticket = document.getElementById("ticket");

        if (ticket) {
          ticket.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "");
          });
        }

        const localizador = document.getElementById("localizador");

        if (localizador) {
          localizador.addEventListener("input", function () {
            const pos = this.selectionStart;

            this.value = this.value.toUpperCase();

            this.setSelectionRange(pos, pos);
          });
        }

        const contato = document.getElementById("contato");

        if (contato) {
          contato.addEventListener("input", function (e) {
            let valor = e.target.value;

            valor = valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

            if (valor.endsWith(" ")) {
              e.target.value = valor;

              return;
            }

            e.target.value = formatarNome(valor);
          });
        }

        /*
         * NÃO criar novamente
         * adicionarQuartoItem(
         *     criarContentBox()
         * );
         *
         * porque o Regis já faz isso.
         */

        /*
         * NÃO chamar
         * preencherDadosZendesk()
         * aqui dentro.
         *
         * A chamada deve ficar
         * no script principal
         * ZendeskComRegist.
         */
      });
    </script>
  </body>
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
  iframe.src =
    "data:text/html;charset=utf-8," + encodeURIComponent(REGISTRO_HTML);
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
  iframe.addEventListener("load", () => {
    setTimeout(() => enviarDadosParaRegistro().catch(warn), 400);
  });
})();
