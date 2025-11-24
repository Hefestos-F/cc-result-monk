// ==UserScript==
// @name         Nice_test
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://cxagent.nicecxone.com/home*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {

// Função para adicionar um item flutuante
  function addFloatingItem(text = 'Novo', x = 10, y = 10) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    position: absolute;
    `;
    el.textContent = text;

    document.body.appendChild(el);

    // Tornar arrastável
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = `${startLeft + dx}px`;
      el.style.top = `${startTop + dy}px`;
    });

    window.addEventListener('pointerup', (e) => {
      dragging = false;
      el.releasePointerCapture?.(e.pointerId);
    });

    return el; // retorna o elemento criado
  }

  // Your code here...
})();
