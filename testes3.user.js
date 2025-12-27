// ==UserScript==
// @name         Nice_test3
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes3.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes3.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  // Data/hora local coerente (YYYY-MM-DD + HH:MM:SS)
  function gerarDataHora() {
    const agora = new Date();

    const hora = agora.toLocaleTimeString("pt-BR", { hour12: false }); // HH:MM:SS

    // Gera YYYY-MM-DD em fuso local:
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    const data = `${ano}-${mes}-${dia}`;

    return { hora, data };
  }
  // Atualiza o timer a cada segundo
  setInterval(() => {
    const time = document.getElementById("timerFlutuante");
    if (!time) {
      console.log(`HefestoLog:time falso`);
    }else{

      console.log(`HefestoLog:time true ${time.textContent}`);
    };

    const agora = gerarDataHora();

    // exibirHora precisa ser a versão que calcula a diferença quando o 3º parâmetro é objeto absoluto
    // Pegamos apenas a 'hora' do retorno (formato HH:MM:SS) para servir como cronômetro
    //time.value = exibirHora(agora, 0, TempoPausas.inicioUltimaP).hora;
    time.textContent = agora.hora;
  }, 1000);

  function criarObjetoFlutuante(id = "timerFlutuante") {
    // Evita duplicar
    if (document.getElementById(id)) return;

    const div = document.createElement("div");
    div.id = id;
    div.textContent = "00:00:00";

    // Estilo inicial
    Object.assign(div.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#222",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "18px",
      zIndex: "9999",
      cursor: "move",
      boxSizing: "border-box", // evita crescer por padding/borda
      userSelect: "none",
      // Preparar para transform
      transform: "translate(0px, 0px)",
      willChange: "transform",
    });

    // Estado interno do deslocamento
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    function onPointerDown(e) {
      dragging = true;
      // Posição do ponteiro no início
      startX = e.clientX;
      startY = e.clientY;
      div.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      div.style.transform = `translate(${offsetX + dx}px, ${offsetY + dy}px)`;
    }

    function onPointerUp(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // acumula deslocamento
      offsetX += dx;
      offsetY += dy;
      dragging = false;
      div.releasePointerCapture?.(e.pointerId);
    }

    // Pointer Events (funciona para mouse e touch)
    div.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Desativa arrastar nativo
    div.ondragstart = () => false;

    document.body.appendChild(div);
  }

  criarObjetoFlutuante();
})();
