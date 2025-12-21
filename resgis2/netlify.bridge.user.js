
// ==UserScript==
// @name         Registro de Chamadas: receber ticket e contato do Zendesk
// @namespace    franciel.registro.ticket.receiver
// @version      1.1.1
// @description  Recebe {ticket, contato} via postMessage e preenche #ticket e #contato.
// @author       Franciel
// @match        https://registrodechamadas.netlify.app/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const ZENDESK_ORIGIN = 'https://smileshelp.zendesk.com';
  const LOG_PREFIX = '[Registro←ZD]';
  const log = (...a) => console.log(LOG_PREFIX, ...a);
  const warn = (...a) => console.warn(LOG_PREFIX, ...a);

  function setInputValue(el, value) {
    if (!el) return;
    el.focus();
    el.value = value ?? '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.addEventListener('message', (ev) => {
    if (ev.origin !== ZENDESK_ORIGIN) return;
    const data = ev.data || {};
    if (data.type === 'preencher') {
      const { ticket, contato } = data;
      const tkEl = document.getElementById('ticket');
      const ctEl = document.getElementById('contato');

      if (!tkEl) warn('Input #ticket não encontrado');
      else setInputValue(tkEl, ticket);

      if (!ctEl) warn('Input #contato não encontrado');
      else setInputValue(ctEl, contato);

      log('Aplicados:', { ticket, contato });
      ev.source?.postMessage({ type: 'status', status: 'ok', fields: ['ticket','contato'] }, ZENDESK_ORIGIN);
    }
  });

  // Handshake inicial
  if (window.parent) {
    window.parent.postMessage({ type: 'ready' }, ZENDESK_ORIGIN);
  }

  // Fallback por query string (?ticket=123&contato=Fulano)
  (function applyFromQuery() {
    const p = new URLSearchParams(location.search);
    const tk = p.get('ticket');
    const ct = p.get('contato');
    const tkEl = document.getElementById('ticket');
    const ctEl = document.getElementById('contato');
    if (tk && tkEl) setInputValue(tkEl, tk);
    if (ct && ctEl) setInputValue(ctEl, ct);
  })();
})();
