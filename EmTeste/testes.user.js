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
    try {
      const res = getNomeAntesDoTicket(ticket);
      contato = res && res.PrimeNome ? res.PrimeNome : "XX-XX";
    } catch (e) {
      Hwarn("Falha ao obter contato via encontrarNome():", e);
    }

    return {
      contato,
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
})();
