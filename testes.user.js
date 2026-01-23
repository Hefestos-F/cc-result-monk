// ==UserScript==
// @name         Nice_test (optimized + last datetime by ticket)
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1.2.0
// @description  Observers robustos, debounce, espera SPA e armazenamento do último datetime por ticket.
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
  "use strict";

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

  /**
   * Aguarda o aparecimento de um elemento no DOM.
   * @param {string|Function} selector - seletor CSS ou função que retorna o elemento.
   * @param {Element|Document} root - raiz da observação.
   * @param {number} timeout - ms
   * @returns {Promise<Element|null>}
   */
  function waitForElement(selector, root = document, timeout = 15000) {
    const getEl = () =>
      typeof selector === "function"
        ? selector()
        : (root || document).querySelector(selector);

    return new Promise((resolve) => {
      const el = getEl();
      if (el) return resolve(el);

      const obsRoot = root && root.nodeType ? root : document;
      const obs = new MutationObserver(() => {
        const e = getEl();
        if (e) {
          obs.disconnect();
          resolve(e);
        }
      });
      obs.observe(obsRoot, { childList: true, subtree: true });

      const to = setTimeout(() => {
        obs.disconnect();
        resolve(null);
      }, timeout);

      window.addEventListener(
        "beforeunload",
        () => {
          clearTimeout(to);
          obs.disconnect();
        },
        { once: true },
      );
    });
  }

  // ========= ESTADO =========
  // Agora ticketsSet guarda: id -> último datetime (string ISO) ou null (desconhecido)
  /** @type {Map<string, string|null>} */
  const ticketsSet = new Map();

  /** @type {Map<string, MutationObserver>} */
  const ticketObservers = new Map();
  /** @type {Map<string, Function>} */
  const ticketDebouncers = new Map();

  let tooltipObserver = null;

  // ========= COLETA DE IDS =========
  function ObterEntityId() {
    const container = document.querySelector('[data-test-id="header-tablist"]');
    const itens = container
      ? [...container.querySelectorAll("[data-entity-id]")]
      : [];
    return {
      total: itens.length,
      elementos: itens,
      ids: itens.map((el) => el.getAttribute("data-entity-id")).filter(Boolean),
    };
  }

  /*document.querySelector(
    '[data-ticket-id="${CSS.escape(id)}"][data-test-id="header-tab"][data-entity-type="ticket"]',
  );*/

  // ========= OBSERVAÇÃO DE TICKET =========
  async function observarTicket(id) {
    if (ticketObservers.has(id)) return;

    const selector = () =>
      document.querySelector(
        `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
      );

    let root = selector();
    if (!root) {
      root = await waitForElement(selector, document, 20000);
    }
    if (!root) {
      warn(
        `Não foi possível localizar o omni-log-container para o ticket ${id} (timeout).`,
      );
      return;
    }

    if (!ticketDebouncers.has(id)) {
      ticketDebouncers.set(
        id,
        debounce(() => handleTicketChange(id), DEBOUNCE_MS),
      );
    }
    const debounced = ticketDebouncers.get(id);

    const obs = new MutationObserver(() => {
      debounced();
    });

    // 👉 NOVA LINHA: pega datetime imediatamente
    handleTicketChange(id);

    obs.observe(root, { childList: true, subtree: true });
    ticketObservers.set(id, obs);
  }

  function pararObservacaoTicket(id) {
    const obs = ticketObservers.get(id);
    if (obs) {
      try {
        obs.disconnect();
      } catch {
        /* noop */
      }
      ticketObservers.delete(id);
    }
    if (ticketDebouncers.has(id)) {
      ticketDebouncers.delete(id);
    }
  }

  // ========= CALLBACK DE MUDANÇA DO TICKET =========
  function handleTicketChange(id) {
    const newDt = EncontrarOUltimoTime(id);
    const oldDt = ticketsSet.get(id) ?? null;

    // Só atualiza/loga se mudou de fato
    if (newDt && newDt !== oldDt) {
      ticketsSet.set(id, newDt);
      HefestoLog(`Último datetime do ticket ${id}: ${newDt}`);
      logTicketsSet();
      // 👉 Se quiser acionar algo aqui (toast, som, postMessage, etc.), este é o lugar.
    } else if (!newDt && oldDt !== null) {
      // Se antes tinha valor e agora não achamos nenhum, podemos registrar (opcional)
      HefestoLog(
        `datetime ausente no momento para o ticket ${id}. Mantendo valor anterior: ${oldDt}`,
      );
    } else {
      // Sem mudança real — silêncio para evitar spam
      HefestoLog(`(sem mudança) ticket ${id}`);
    }
  }

  // ========= ENCONTRAR ÚLTIMO TIMESTAMP =========
  function EncontrarOUltimoTime(id) {
    try {
      const root = document.querySelector(
        `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
      );
      if (!root) {
        return null;
      }

      const items = root.querySelectorAll(
        '[data-test-id="omni-log-comment-item"]',
      );
      if (!items.length) return null;

      const lastItem = items[items.length - 1];

      // Estrutura típica: <div data-test-id="timestamp-relative"><time datetime="..."></time></div>
      let ts = lastItem.querySelector('[data-test-id="timestamp-relative"]');
      let datetime = null;

      if (ts) {
        const timeEl = ts.matches("time") ? ts : ts.querySelector("time");
        if (timeEl) {
          datetime = timeEl.getAttribute("datetime") || null;
        } else {
          // fallback: atributo direto
          datetime = ts.getAttribute("datetime") || null;
        }
      } else {
        // fallback amplo
        const anyTime = lastItem.querySelector("time[datetime]");
        if (anyTime) datetime = anyTime.getAttribute("datetime") || null;
      }

      if (typeof datetime === "string") datetime = datetime.trim();
      return datetime || null;
    } catch (err) {
      error("Erro em EncontrarOUltimoTime:", err);
      return null;
    }
  }

  // ========= BOOTSTRAP =========
  (async function bootstrap() {
    let tooltip = document.querySelector('[data-test-id="header-tablist"]');
    if (!tooltip) {
      tooltip = await waitForElement(
        '[data-test-id="header-tablist"]',
        document,
        20000,
      );
    }

    if (!tooltip) {
      warn(
        "Tooltip container (#tooltip-container) não encontrado (timeout). Observando documento inteiro temporariamente.",
      );
      const docObs = new MutationObserver(() => {
        const t = document.querySelector('[data-test-id="header-tablist"]');
        if (t) {
          docObs.disconnect();
          iniciarObservacaoTooltip(t);
        }
      });
      docObs.observe(document, { childList: true, subtree: true });
      // Sync inicial (caso já existam IDs dispersos)
      SincronizarTicketsObservados();
      return;
    }

    iniciarObservacaoTooltip(tooltip);
    SincronizarTicketsObservados();
  })();

  function iniciarObservacaoTooltip(tooltip) {
    if (tooltipObserver) {
      try {
        tooltipObserver.disconnect();
      } catch {
        /* noop */
      }
      tooltipObserver = null;
    }

    tooltipObserver = new MutationObserver(() => {
      SincronizarTicketsObservados();
    });

    tooltipObserver.observe(tooltip, { childList: true, subtree: true });
    HefestoLog("Observando #tooltip-container.");
  }
})();
