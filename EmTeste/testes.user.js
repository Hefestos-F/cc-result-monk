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

function criarObjetoFlutuante() {
  if (document.getElementById("FlutOB")) return;


  const div = document.createElement("div");
  div.id = "FlutOB";

  // Estilo do container principal
  Object.assign(div.style, {
    position: "fixed",
    // Posição inicial arbitrária: usaremos top + (left ou right) conforme stt.LadoBot
    top: "110px",
    left: "350px", // será convertido/ajustado pela rotina abaixo
    borderRadius: "8px",
    zIndex: "16",
    boxSizing: "border-box",
    userSelect: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: Ccor.Principal,
    padding: "3px",
  });

  const handle = document.createElement("div"); // Área para arrastar
  handle.id = "AreaArrast";
  Object.assign(handle.style, {
    width: "100%",
    height: "5px",
    backgroundColor: Ccor.AreaAr,
    cursor: "grab",
    borderRadius: "4px",
    marginBottom: "5px",
    touchAction: "none", // evita gestos padrão em touch
  });

  // -----
  // Estados do arrasto
  let dragging = false;
  let startX = 0; // posição do cursor ao iniciar arrasto
  let startY = 0;
  // armazenam o valor da propriedade base (left OU right) e de top
  let startSideVal = 0;
  let startTop = 0;

  // Helper: limita o valor entre min e max
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Lê o valor numérico atual de top
  function getTop() {
    return parseFloat(div.style.top) || 0;
  }

  // Define top em px (clamp aplicado fora)
  function setTop(px) {
    div.style.top = `${px}px`;
  }

  // Lê o valor da propriedade base (left OU right), retornando número
  function getSide() {
    if (stt.LadoBot === 1) {
      return parseFloat(div.style.left) || 0;
    } else {
      return parseFloat(div.style.right) || 0;
    }
  }

  // Define a propriedade base com número px
  function setSide(px) {
    if (stt.LadoBot === 1) {
      div.style.left = `${px}px`;
      div.style.right = ""; // garante que não conflita
    } else {
      div.style.right = `${px}px`;
      div.style.left = ""; // garante que não conflita
    }
  }

  // Converte a posição atual (via rect) para top + (left|right) explícitos
  function ensureTopAndBaseSide() {
    const rect = div.getBoundingClientRect();

    // top sempre por top (sem bottom)
    if (!div.style.top) {
      div.style.top = `${rect.top}px`;
    }

    if (stt.LadoBot === 1) {
      // Base = LEFT
      if (!div.style.left) {
        const left = rect.left;
        div.style.left = `${left}px`;
      }
      // remove right para evitar conflito
      div.style.right = "";
    } else {
      // Base = RIGHT
      if (!div.style.right) {
        const right = window.innerWidth - rect.right;
        div.style.right = `${right}px`;
      }
      // remove left para evitar conflito
      div.style.left = "";
    }

    // Não usamos bottom/transform
    div.style.bottom = "";
    div.style.transform = "";
  }

  function onPointerDown(e) {
    ensureTopAndBaseSide();

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    // Posição inicial do elemento (base + top)
    startSideVal = getSide();
    startTop = getTop();

    handle.style.cursor = "grabbing";
    div.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Dimensões visíveis
    const maxTop = Math.max(0, window.innerHeight - div.offsetHeight);

    if (stt.LadoBot === 1) {
      // Base LEFT
      const maxLeft = Math.max(0, window.innerWidth - div.offsetWidth);
      const newLeft = clamp(startSideVal + dx, 0, maxLeft);
      setSide(newLeft);
    } else {
      // Base RIGHT
      // Quando a base é RIGHT, mover para a direita diminui o "right"
      // Explicação: desde a borda direita. Se o mouse vai +dx (para direita),
      // a caixa acompanha para direita => right diminui.
      const maxRight = Math.max(0, window.innerWidth - div.offsetWidth);
      const newRight = clamp(startSideVal - dx, 0, maxRight);
      setSide(newRight);
    }

    const newTop = clamp(startTop + dy, 0, maxTop);
    setTop(newTop);
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    handle.style.cursor = "grab";
    div.releasePointerCapture?.(e.pointerId);
  }

  // Reajusta posição caso a janela seja redimensionada
  function onResize() {
    if (!div.isConnected) {
      window.removeEventListener("resize", onResize);
      return;
    }
    ensureTopAndBaseSide();

    const top = getTop();
    const maxTop = Math.max(0, window.innerHeight - div.offsetHeight);
    setTop(clamp(top, 0, maxTop));

    if (stt.LadoBot === 1) {
      const left = getSide();
      const maxLeft = Math.max(0, window.innerWidth - div.offsetWidth);
      setSide(clamp(left, 0, maxLeft));
    } else {
      const right = getSide();
      const maxRight = Math.max(0, window.innerWidth - div.offsetWidth);
      setSide(clamp(right, 0, maxRight));
    }
  }

  // Eventos apenas na área de arrasto
  handle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("resize", onResize);

  // Evita comportamento de arrastar nativo
  div.ondragstart = () => false;

  // Monta estrutura
  div.appendChild(handle);
  div.appendChild(AdicionarCaixaAtualizada());
  document.body.appendChild(div);

  // Após inserir no DOM, define top + (left|right) e aplica clamp inicial
  ensureTopAndBaseSide();
  onResize();
}
})();
