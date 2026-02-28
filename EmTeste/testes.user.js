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
  /**
   * Informa se o elemento está mais à esquerda, à direita ou centralizado no viewport.
   * @param {Element} el - elemento alvo
   * @param {object} [opts]
   * @param {number} [opts.centerTolerance=12] - tolerância (px) para considerar "center"
   * @returns {{ side: 'left'|'right'|'center', distancePx: number, ratio: number, visiblePctX: number }}
   */
  function ladoNoViewport(el, opts = {}) {
    const { centerTolerance = 12 } = opts;
    if (!el || !el.getBoundingClientRect) {
      return { side: "center", distancePx: 0 };
    }

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;

    // Centro do elemento e do viewport
    const elCenterX = rect.left + rect.width / 2;
    const viewCenterX = vw / 2;

    const distancePx = elCenterX - viewCenterX; // >0 -> direita; <0 -> esquerda

    let side = "center";
    if (Math.abs(distancePx) > centerTolerance) {
      side = distancePx > 0 ? "right" : "left";
    }

    return { side, distancePx };
  }
  const info = ladoNoViewport(document.getElementById("FlutOB"), {
    centerTolerance: 16,
  });
  console.log(info); // { side: 'left'|'right'|'center', distancePx, ratio, visiblePctX }
})();
