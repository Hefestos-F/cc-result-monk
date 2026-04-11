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
  const PreFixo = "O Teste:";

  function Hlog(...args) {
    console.log(PreFixo, ...args);
  }
  function Hwarn(...args) {
    console.warn(PreFixo, ...args);
  }
  function Herror(...args) {
    console.error(PreFixo, ...args);
  }
  function Hodeb(...args) {
    console.debug(PreFixo, ...args);
  }
  function Hinfo(...args) {
    console.info(PreFixo, ...args);
  }

  function obterEntityIdSelecionado() {
    const item = document.querySelector('[data-selected="true"]');
    if (!item) return null; // ou "", ou false — como preferir

    return item.getAttribute("data-entity-id");
  }

  const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();

  // Utilitário: formata "fulano" -> "Fulano"
  const formatPrimeiroNome = (txt) => {
    const t = (txt || "").trim();
    if (!t) return "";
    // Extrai a primeira "palavra" (até espaço)
    const first = t.split(/\s+/)[0];
    const lower = first.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

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

    if (!statusEl) {
      return { resolvido: false, status: "EM ANDAMENTO" };
    }

    const statusTxt = normalize(statusEl.textContent).toUpperCase();

    return {
      resolvido: /RESOLVIDO|SOLVED|ENCERRADO/.test(statusTxt),
      status: statusTxt,
    };
  }

  function getNomeAntesDoTicket(numeroTicket) {
    if (!numeroTicket) return "-X";

    const ticketSpan = [
      ...document.querySelectorAll(
        '[data-test-id="tabs-section-nav-item-ticket"]',
      ),
    ].find((el) => el.textContent.includes(`Ticket #${numeroTicket}`));

    if (!ticketSpan) return "X-X";

    const anterior = ticketSpan.previousElementSibling;
    if (!anterior) return "XX-";

    const NomeENcon = anterior.textContent;

    const nomeCompleto = normalize(NomeENcon);

    return {
      PrimeNome: formatPrimeiroNome(nomeCompleto),
      nomeCompleto: nomeCompleto,
    };
  }

  function nomeETicket() {
    const numero = obterEntityIdSelecionado();
    const ticket = numero || "000000";

    let contato = "X-";
    let nomeCompleto = "zz";
    try {
      const res = getNomeAntesDoTicket(ticket);
      contato = res && res.PrimeNome ? res.PrimeNome : "XX-XX";
      nomeCompleto = res.nomeCompleto;
    } catch (e) {
      Hwarn("Falha ao obter contato via encontrarNome():", e);
    }

    return {
      contato,
      nomeCompleto,
      ticket,
    };
  }

  function Preenc() {
    const oSNom = nomeETicket();

    const NomeOcAtivo = document.getElementById("NomeOcAtivo");
    const IdOcAtivo = document.getElementById("IdOcAtivo");

    if (NomeOcAtivo) NomeOcAtivo.textContent = oSNom.contato;
    if (IdOcAtivo) IdOcAtivo.textContent = oSNom.ticket;

    const nome = NomeOcAtivo ? "NomeOcAtivo true" : "NomeOcAtivo False";

    const tick = IdOcAtivo ? "IdOcAtivo true" : "IdOcAtivo False";

    return {
      nome: nome,
      tick: tick,
    };
  }

  console.log("O Encontrar", JSON.stringify(nomeETicket()));

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

  const stt = { ItemSele: 0 };

  function MudarOitemProt() {
    const itens = document.querySelectorAll("[data-selected]");

    itens.forEach((item) => {
      const itemSele = item.getAttribute("data-selected");

      if (
        stt.ItemSele !== itemSele ||
        (item.style.borderTop === "" && itemSele === "true")||
        item.style.borderRadius !== "20px 20px 0px 0px"
      ) {
        item.style.borderTop = itemSele === "true" ? "2px solid #1b81ff" : "";

        item.style.borderRadius = "20px 20px 0px 0px";

        stt.ItemSele = itemSele;
      }
    });
  }

  console.log(BusOPerfil());
})();
