
// ==UserScript==
// @name         Zendesk: Botão + Painel (580px) + enviar ticket e contato ao Registro
// @namespace    franciel.zendesk.ticket.bridge
// @version      1.2.1
// @description  Extrai número do ticket e nome do contato; envia ao Registro de Chamadas via postMessage.
// @author       Franciel
// @match        https://smileshelp.zendesk.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // ===== Config =====
  const LOG_PREFIX = '[ZD→Registro]';
  const RC_ORIGIN = 'https://registrodechamadas.netlify.app';
  const RC_URL    = `${RC_ORIGIN}/?embed=zendesk`;
  const PANEL_WIDTH  = 580;
  const PANEL_HEIGHT = 520;

  // ===== Logs =====
  const log  = (...a) => console.log(LOG_PREFIX, ...a);
  const warn = (...a) => console.warn(LOG_PREFIX, ...a);
  const onCatch = (e) => console.error(LOG_PREFIX, e);

  // ===== CSS =====
  const css = `
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
      position: fixed; right: 70px; bottom: 70px; width: ${PANEL_WIDTH}px; height: ${PANEL_HEIGHT}px;
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
  if (typeof GM_addStyle === 'function') GM_addStyle(css);
  else { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }

  // ===== Botão flutuante =====
  const btn = document.createElement('div');
  btn.id = 'rc-float-btn';
  btn.title = 'Abrir Registro de Chamadas';
  btn.innerHTML = '<span class="rc-icon" aria-hidden="true"></span>';
  document.body.appendChild(btn);

  // Drag do botão
  (function dragFloatButton() {
    let dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
    btn.addEventListener('mousedown', (e) => {
      dragging = true; btn.style.cursor = 'grabbing';
      startX = e.clientX; startY = e.clientY;
      const rect = btn.getBoundingClientRect(); origLeft = rect.left; origTop = rect.top;
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    });
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const vw = innerWidth, vh = innerHeight, size = 44;
      const left = Math.max(8, Math.min(vw - size - 8, origLeft + dx));
      const top  = Math.max(8, Math.min(vh - size - 8, origTop + dy));
      btn.style.left = `${left}px`; btn.style.top = `${top}px`; btn.style.right = 'auto'; btn.style.bottom = 'auto'; btn.style.position = 'fixed';
    }
    function onUp() {
      dragging = false; btn.style.cursor = 'grab';
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
    }
  })();

  // ===== Painel com iframe (ATENÇÃO: iframe bem formado) =====
  const panel = document.createElement('div');
  panel.id = 'rc-panel';
  panel.innerHTML = `
    <div id="rc-panel-header">
      <div style="font-size:13px;font-weight:600;">Registro de Chamadas</div>
      <div id="rc-panel-actions">
        <button id="rc-refresh" class="rc-btn">Atualizar</button>
        <button id="rc-close" class="rc-btn primary">Fechar</button>
      </div>
    </div>
    <iframe id="rc-iframe" src="${RC_URL}" allow="clipboard-read; clipboard-write"></iframe>
  `;
  document.body.appendChild(panel);
  const iframe = panel.querySelector('#rc-iframe');

  // Mostrar/ocultar painel
  btn.addEventListener('click', () => {
    const show = panel.style.display === 'none' || panel.style.display === '';
    panel.style.display = show ? 'block' : 'none';
    if (show) {
      // pequeno atraso para garantir iframe pronto
      setTimeout(() => enviarDadosParaRegistro().catch(onCatch), 400);
    }
  });
  panel.querySelector('#rc-close').addEventListener('click', () => panel.style.display = 'none');
  panel.querySelector('#rc-refresh').addEventListener('click', () => iframe.contentWindow?.location.reload());

  // Drag do painel (pelo header)
  (function dragPanel() {
    const header = panel.querySelector('#rc-panel-header');
    let dragging = false, sx=0, sy=0, ol=0, ot=0;
    header.addEventListener('mousedown', (e) => {
      dragging = true; sx = e.clientX; sy = e.clientY;
      const r = panel.getBoundingClientRect(); ol = r.left; ot = r.top;
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    });
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const vw = innerWidth, vh = innerHeight, r = panel.getBoundingClientRect();
      const left = Math.max(8, Math.min(vw - r.width - 8, ol + dx));
      const top  = Math.max(8, Math.min(vh - r.height - 8, ot + dy));
      panel.style.left = `${left}px`; panel.style.top = `${top}px`; panel.style.right = 'auto'; panel.style.bottom = 'auto'; panel.style.position = 'fixed';
    }
    function onUp() { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
  })();

  // ===== Extração do ticket =====
  function extrairTicketDaURL(href) {
    // /agent/tickets/123456  ou /agent/workspace/tickets/123456
    const m = href.match(/\/tickets\/(\d+)/) || href.match(/\/workspace\/tickets\/(\d+)/);
    return m ? m[1] : null;
  }

  // ===== Obter contato usando encontrarNome() ou fallback =====
  async function obterContato(ticketNumber) {
    const numero = ticketNumber ? String(ticketNumber).trim() : '';
    if (!numero) return '';

    if (typeof window.encontrarNome === 'function') {
      try {
        const res = await Promise.resolve(window.encontrarNome(numero));
        const nome = (res && res.nomeCompleto) ? String(res.nomeCompleto).trim() : '';
        if (nome) return nome;
        warn('encontrarNome() não retornou nomeCompleto; usando fallback.');
      } catch (e) {
        warn('Falha ao chamar encontrarNome():', e);
      }
    }

    // Fallback: tenta requester no DOM
    const candidates = [
      '[data-test-id="requester"]',
      '[class*="requester"]',
      '[aria-label*="Solicitante"]',
      '[aria-label*="Requester"]',
      'header [data-test-id*="requester"]',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      const txt = el?.textContent?.trim();
      if (txt && !txt.includes('@')) return txt;
    }

    // Último recurso: extrair do e-mail
    const mailto = document.querySelector('a[href^="mailto:"]');
    const email = mailto?.getAttribute('href')?.replace(/^mailto:/, '') || '';
    if (email) return (email.split('@')[0] || '').replace('.', ' ').trim();

    return '';
  }

  // ===== Enviar dados ao Registro =====
  async function enviarDadosParaRegistro() {
    const href = window.location.href || '';
    const ticket = extrairTicketDaURL(href) || '000000';
    const contato = await obterContato(ticket) || '';
    const payload = { type: 'preencher', ticket, contato };

    try {
      iframe.contentWindow?.postMessage(payload, RC_ORIGIN);
      log('Payload enviado ao Registro:', payload);
    } catch (e) {
      warn('Falha ao enviar payload:', e);
    }
    return payload;
  }

  // Handshake: quando o Registro avisar que está pronto, enviamos
  window.addEventListener('message', (ev) => {
    if (ev.origin !== RC_ORIGIN) return;
    const data = ev.data || {};
    if (data.type === 'ready') {
      log('Registro READY → enviando dados...');
      enviarDadosParaRegistro().catch(onCatch);
    }
  });

  // Reenvio quando a rota mudar (SPA)
  (function watchRoute() {
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        setTimeout(() => enviarDadosParaRegistro().catch(onCatch), 500);
      }
    }, 1000);
  })();

  // Envio inicial ao carregar o iframe
  iframe.addEventListener('load', () => {
    setTimeout(() => enviarDadosParaRegistro().catch(onCatch), 400);
  });
})();
