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
    data: '2024-06-20',
    fuso: '+10:00',
  };

  let modoteste = false;

  function parseOffset(offsetStr) {
    const m = String(offsetStr).match(/^([+-])(\d{2}):?(\d{2})$/);
    if (!m) return 0;
    const sign = m[1] === '-' ? -1 : 1;
    const hours = parseInt(m[2], 10);
    const minutes = parseInt(m[3], 10);
    return sign * (hours * 60 + minutes);
  }

  function formatDateTime(date) {
    const d = date.toISOString().split('T')[0];
    const t = date.toTimeString().split(' ')[0];
    return { date: d, time: t };
  }

  function showBanner(text) {
    let el = document.getElementById('nm-time-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nm-time-banner';
      el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483647;background:#111;color:#fff;padding:6px 10px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;opacity:0.95';
      document.body.appendChild(el);
    }
    el.textContent = text;
  }

  function exibirHoraEData() {
    const agora = new Date();

    if (modoteste) {
      const [y, m, d] = String(modotestevalores.data).split('-').map(Number);
      const [hh, mm, ss] = agora.toTimeString().split(' ')[0].split(':').map(Number);
      // Create a date using the test date and current local time
      const base = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
      const offsetMin = parseOffset(modotestevalores.fuso);
      const adjusted = new Date(base.getTime() + offsetMin * 60 * 1000);
      const out = formatDateTime(adjusted);
      console.log(`Modo teste: Data: ${out.date}, Hora: ${out.time} (fuso ${modotestevalores.fuso})`);
      showBanner(`TESTE ${out.date} ${out.time} ${modotestevalores.fuso}`);
    } else {
      const out = formatDateTime(agora);
      console.log(`Data: ${out.date}, Hora: ${out.time}`);
      showBanner(`${out.date} ${out.time}`);
    }
  }

  function createToggle() {
    if (document.getElementById('nm-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'nm-toggle-btn';
    btn.textContent = 'Alternar modo teste';
    btn.title = 'Alterna entre horário real e modo de teste';
    btn.style.cssText = 'position:fixed;right:10px;bottom:50px;z-index:2147483647;background:#0069d9;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer;font-family:Arial,Helvetica,sans-serif';
    btn.addEventListener('click', () => {
      modoteste = !modoteste;
      localStorage.setItem('nm-modoteste', modoteste ? '1' : '0');
      exibirHoraEData();
    });
    document.body.appendChild(btn);
    const stored = localStorage.getItem('nm-modoteste');
    if (stored === '1') {
      modoteste = true;
    }
  }

  function init() {
    createToggle();
    exibirHoraEData();
    setInterval(exibirHoraEData, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
