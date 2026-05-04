// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
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

  function observarItem(aoMudar, target = document.body) {
    const observer = new MutationObserver(async () => {
      if (stt.andament) {
        stt.andament = 0;
        await aoMudar();
        stt.andament = 1;
      }
      if (stt.observa === 0) observer.disconnect();
    });

    observer.observe(target, { childList: true, subtree: true });
    return observer;
  }

  function obterEntityIdSelecionado() {
    const item = document.querySelector('[data-selected="true"]');
    if (!item) return null; // ou "", ou false — como preferir

    return item.getAttribute("data-entity-id");
  }

  /*
  observarItem(() => {
    const a = obterEntityIdSelecionado();

    if (!a) return 

    EstaResolvido(a);

  }, document.querySelector('[data-test-id="header-toolbar"]'));
*/

  function oloop() {
    MudarOitemProt();
  }

  // Atualiza o timer a cada segundo
  setInterval(oloop, 1000);

  function MudarOitemProt() {
    const itens = document.querySelectorAll("[data-selected]");

    if (!itens) return;

    itens.forEach((item) => {
      const itemSele = item.dataset.selected; // "true" | "false"
      const oId = item.dataset.entityId; // "24380006"

      const estado = stt.idSelecionado[oId];

      if (itemSele) EstaResolvido(oId);

      if (
        !estado ||
        estado.dataselected !== itemSele ||
        estado.borderTop !== item.style.borderTop ||
        estado.borderRadius !== item.style.borderRadius
      ) {
        item.style.borderRadius = "20px 20px 0px 0px";

        ["borderTop", "borderRight", "borderLeft"].forEach((a) => {
          item.style[a] = itemSele === "true" ? "2px solid #1b81ff" : "";
        });

        stt.idSelecionado[oId] = {
          dataselected: itemSele,
          borderRadius: item.style.borderRadius,
          borderTop: item.style.borderTop,
        };
      }
    });
  }

  function EstaResolvido(id) {
    const f = document.querySelector(
      `[data-test-id="ticket-${CSS.escape(id)}-standard-layout"]`,
    );

    const erroSalv = f?.querySelector(
      '[data-test-id="ticket_saving_error_notification"]',
    );

    aMarcacaoObrig(id);

    const os = getStatusAntesDoTicket(id)?.status;
    const enconAt = EncontrarAtribuido(id);

    // fallback seguro do cache
    if (!os || !enconAt) {
      //Hlog("Falso");
      return {
        eMeu: stt.StatusTk?.[id]?.eMeu ?? 0,
        Resol: stt.StatusTk?.[id]?.Resol ?? 0,
      };
    }

    const eMeu = config.NomeAt === enconAt ? 1 : 0;

    const Resol = !erroSalv && outrav.includes(os) ? 1 : 0;

    stt.StatusTk[id] = { eMeu, Resol };

    //Hlog(`Resolvido: ${Resol} / Emeu: ${eMeu}`);
    return { eMeu, Resol };
  }

  function getStatusAntesDoTicket(numeroTicket) {
    if (!numeroTicket) return { resolvido: false, status: "DESCONHECIDO" };

    const ticketSpan = [
      ...document.querySelectorAll(
        '[data-test-id="tabs-section-nav-item-ticket"]',
      ),
    ].find((el) => el.textContent.includes(`Ticket #${numeroTicket}`));

    if (!ticketSpan) {
      return { resolvido: false, status: "NÃO ENCONTRADO" };
    }

    const statusEl = ticketSpan.querySelector(".ticket_status_label");

    const oId = document.querySelector(
      `[data-entity-id="${CSS.escape(numeroTicket)}"][data-test-id="header-tab"]`,
    );

    const Alterado = oId.querySelector(
      '[data-test-id="omnitab-dirty-notification"]',
    );

    const EnconAt = EncontrarAtribuido(numeroTicket);

    if (!statusEl) {
      return { resolvido: false, status: "EM ANDAMENTO" };
    }

    const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();

    const statusTxt = normalize(statusEl.textContent).toUpperCase();

    return {
      resolvido: /RESOLVIDO|SOLVED|ENCERRADO/.test(statusTxt),
      status: statusTxt,
    };
  }

  function EncontrarAtribuido(id) {
    // 1. Container do ticket
    const ticket = document.querySelector(
      `[data-test-id="ticket-${id}-standard-layout"]`,
    );
    if (!ticket) return null;

    // 2. Campo de agente atribuído
    const assigneeField = ticket.querySelector(
      '[data-test-id="assignee-field-selected-agent-tag"]',
    );
    if (!assigneeField) return null;

    // 3. Elementos que possuem atributo title
    const elementosComTitle = assigneeField.querySelectorAll("[title]");
    if (elementosComTitle.length < 2) return null;

    // 4. Retorna o title do segundo item
    return elementosComTitle[1].getAttribute("title");
  }

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

  const ozero = document.querySelectorAll(".recent-closed__queue");

  if (!ozero.length) {
    console.log("Nenhum elemento .recent-closed__queue encontrado");
  } else {
    ozero.forEach((s) => {
      const segunda = s.textContent.trim().split(/\s+/)[0];

      console.log(segunda);
    });
  }

  function getAltFromToolbarProfile() {
    const container = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button"]',
    );
    if (!container) return null;

    const elComAlt = container.querySelector("[alt]");
    return elComAlt ? elComAlt.getAttribute("alt") : null;
  }

  function getTypographySpanByProfileAlt() {
    const alt = getAltFromToolbarProfile();
    if (!alt) return null;

    // Encontra elementos cujo texto seja exatamente igual ao alt
    const itens = [...document.querySelectorAll("*")].filter(
      (el) => el.textContent?.trim() === alt,
    );

    if (!itens.length) return null;

    let ocorreto = null;
    itens.forEach((s) => {
        // spans no mesmo container
        const noPai = s.parentElement?.querySelector(
          'span[data-garden-id="typography.font"]',
        );
        if(noPai)ocorreto = noPai;

      });

    return ocorreto;
  }

  getTypographySpanByProfileAlt();
})();
