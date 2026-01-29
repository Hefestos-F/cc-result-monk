// ==UserScript==
// @name         Registro de Chamadas > Zendesk
// @namespace    franciel.registro.ticket.receiver
// @version      1.1.5
// @description  Recebe {ticket, contato} via postMessage e preenche #ticket e #contato.
// @author       Franciel
// @match        https://registrodechamadas.netlify.app/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/resgis/RegisToZendesk.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/resgis/RegisToZendesk.user.js
// ==/UserScript==

(function () {
  "use strict";

  const ZENDESK_ORIGIN = "https://smileshelp.zendesk.com";
  const LOG_PREFIX = "[Registro←ZD]";
  const log = (...a) => console.log(LOG_PREFIX, ...a);
  const warn = (...a) => console.warn(LOG_PREFIX, ...a);

  const stt = {
    observ: 1,
  };

  function setInputValue(el, value) {
    if (!el) return;
    el.focus();
    el.value = value ?? "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  window.addEventListener("message", (ev) => {
    if (ev.origin !== ZENDESK_ORIGIN) return;
    const data = ev.data || {};
    if (data.type === "preencher") {
      const { ticket, contato } = data;
      const tkEl = document.getElementById("ticket");
      const ctEl = document.getElementById("contato");

      if (!tkEl) {
        warn("Input #ticket não encontrado");
      } else {
        if (tkEl.value === "") setInputValue(tkEl, ticket);
      }

      if (!ctEl) {
        warn("Input #contato não encontrado");
      } else {
        if (ctEl.value === "") setInputValue(ctEl, contato);
      }

      log("Aplicados:", { ticket, contato });
      ev.source?.postMessage(
        { type: "status", status: "ok", fields: ["ticket", "contato"] },
        ZENDESK_ORIGIN,
      );
    }
  });

  // Handshake inicial
  if (window.parent) {
    window.parent.postMessage({ type: "ready" }, ZENDESK_ORIGIN);
  }

  // Fallback por query string (?ticket=123&contato=Fulano)
  (function applyFromQuery() {
    const p = new URLSearchParams(location.search);
    const tk = p.get("ticket");
    const ct = p.get("contato");
    const tkEl = document.getElementById("ticket");
    const ctEl = document.getElementById("contato");
    if (tk && tkEl) setInputValue(tkEl, tk);
    if (ct && ctEl) setInputValue(ctEl, ct);
  })();

  var entrada1 = "";
  var entrada2 = "";
  var entrada3 = "";
  var assinatura = "";

  SalvarVari(0);

  function SalvarVari(x) {
    const DS = JSON.parse(localStorage.getItem("DadosSalvosRegis"));

    const DadosAtuais = {
      entrada1: entrada1,
      entrada2: entrada2,
      entrada3: entrada3,
      assinatura: assinatura,
    };

    if (x || !DS) {
      localStorage.setItem("DadosSalvosRegis", JSON.stringify(DadosAtuais));
    } else {
      entrada1 = DS.entrada1;
      entrada2 = DS.entrada2;
      entrada3 = DS.entrada3;
      assinatura = DS.assinatura;
    }
  }

  function CriarInput(textarea, Aplaceholder) {
    var a = textarea ? "textarea" : "input";
    var b = document.createElement(a);
    b.style.cssText = `

        margin: 0px 5px;
        width: 80px;
        border-radius: 10px;
        padding: 1px;
        text-align: center;
        border-bottom: 2px solid rgb(209, 0, 0);
        `;
    b.placeholder = Aplaceholder;
    if (textarea) {
      b.style.maxHeight = "75px";
      b.style.width = "100%";
      b.style.height = "25px";
      b.style.overflow = "auto";
      b.style.resize = "none";
      b.addEventListener("input", () => {
        b.style.height = "auto"; // Reset height
        b.style.height = b.scrollHeight + "px"; // Set new height
      });
    }
    return b;
  }

  function CriarLinha(x) {
    var a = document.createElement("div");
    a.id = `CReglinha${x}`;
    a.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        justify-content: center;
       `;
    return a;
  }

  function criarContentBox() {
    var contentBox = document.createElement("div");
    contentBox.id = "contentBox";

    var dd1 = document.createElement("div");
    var dd2 = document.createElement("div");

    const linha1 = CriarLinha(2);

    const linha1T2 = document.createElement("p");
    linha1T2.textContent = "entrou em contato solicitando:";

    linha1.appendChild(linha1T2);
    dd1.appendChild(linha1);

    const linha2 = CriarLinha(2);

    const linha2in = CriarInput(1, "Solicitação");
    linha2in.value = entrada1;

    linha2in.addEventListener("input", () => {
      linha2in.style.height = "auto"; // Reset height
      linha2in.style.height = linha2in.scrollHeight + "px"; // Set new height
      entrada1 = linha2in.value;
      SalvarVari(1);
      preencheregis();
    });

    linha2.appendChild(linha2in);

    dd1.appendChild(linha2);

    const linha3 = CriarLinha(3);

    const linha3T1 = document.createElement("p");
    linha3T1.textContent =
      "Foi realizada a verificação no sistema e constatado que:";

    linha3.appendChild(linha3T1);
    dd1.appendChild(linha3);

    const linha4 = CriarLinha(4);
    const linha4in = CriarInput(1, "Situação");
    linha4in.value = entrada2;
    linha4in.addEventListener("input", () => {
      linha4in.style.height = "auto"; // Reset height
      linha4in.style.height = linha4in.scrollHeight + "px"; // Set new height
      entrada2 = linha4in.value;
      SalvarVari(1);
      preencheregis();
    });
    linha4.appendChild(linha4in);
    dd1.appendChild(linha4);

    const linha5 = CriarLinha(5);
    const linha5T1 = document.createElement("p");
    linha5T1.textContent = "A solicitação foi atendida da seguinte forma:";
    linha5.appendChild(linha5T1);
    dd1.appendChild(linha5);

    const linha6 = CriarLinha(6);
    const linha6in = CriarInput(1, "Resultado");
    linha6in.value = entrada3;
    linha6in.addEventListener("input", () => {
      linha6in.style.height = "auto"; // Reset height
      linha6in.style.height = linha6in.scrollHeight + "px"; // Set new height
      entrada3 = linha6in.value;
      SalvarVari(1);
      preencheregis();
    });
    linha6.appendChild(linha6in);
    dd1.appendChild(linha6);
    contentBox.appendChild(dd1);

    var dd3 = document.createElement("div");
    dd3.style.cssText = `
    width: max-content;
    `;

    dd3.appendChild(dd1);
    contentBox.appendChild(dd3);

    document.getElementById("limparBtn").addEventListener("click", () => {
      entrada1 = "";
      entrada2 = "";
      entrada3 = "";
      linha1in.value = "";
      linha2in.value = "";
      linha2in.style.height = "25px";
      linha4in.value = "";
      linha4in.style.height = "25px";
      linha6in.value = "";
      linha6in.style.height = "25px";
    });

    function preencheregis() {
      var variant1;
      if (linha4in.value !== "") {
        variant1 = linha3T1.textContent + "\n" + linha4in.value + "\n\n";
      } else {
        variant1 = "";
      }
      var variant2;
      if (linha6in.value !== "") {
        variant2 = linha5T1.textContent + "\n" + linha6in.value + ".";
      } else {
        variant2 = "";
      }

      var textToCopy =
        linha1T2.textContent +
        "\n" +
        linha2in.value +
        "\n\n" +
        variant1 +
        variant2;
      const predescricao = document.getElementById("descricao");
      if (predescricao.style.display !== "none") {
        predescricao.style.display = "none";
      }
      if (predescricao) {
        predescricao.value = textToCopy;
      }
    }
    preencheregis();

    var linhahbg = document.createElement("p");
    linhahbg.id = "ClinhaAssin";
    linhahbg.style.cssText = `
        display: none;
        align-items: center;
        justify-content: center;
            margin: auto;
        `;

    const linhahbgt1 = document.createElement("p");
    linhahbgt1.textContent = "AE¥U";

    const Input8 = CriarInput(0, "");
    Input8.placeholder = "12";
    Input8.style.width = "20px";

    const Input9 = CriarInput(0, "");
    Input9.placeholder = "11000";
    Input9.style.width = "40px";

    const linhahbgt2 = document.createElement("p");
    linhahbgt2.textContent = "/BASE-";

    const linhahbgt3 = document.createElement("p");
    linhahbgt3.textContent = "¥TTL-";

    const linhahbgt4 = document.createElement("p");
    linhahbgt4.textContent = "11000";
    Input9.addEventListener("input", function () {
      linhahbgt4.textContent = Input9.value || "0000";
    });

    const linhahbgt5 = document.createElement("p");
    linhahbgt5.textContent = "¥DEC-2";

    function CriarBot(texto) {
      var a = document.createElement("button");
      a.style.cssText = `
        background-color: rgb(51, 203, 68);
        cursor: pointer;
        border-radius: 15px;
        border: none;
        color: white;
        padding: 3px 9px;
        margin: 3px;
        `;
      a.textContent = texto;
      return a;
    }

    const botCop8 = CriarBot("Copiar");

    botCop8.addEventListener("click", function () {
      const textToCopy =
        linhahbgt1.textContent +
        Input8.value +
        linhahbgt2.textContent +
        Input9.value +
        linhahbgt3.textContent +
        linhahbgt4.textContent +
        linhahbgt5.textContent;

      navigator.clipboard.writeText(textToCopy).then(
        function () {
          console.log("Texto copiado com sucesso.");
        },
        function (err) {
          console.error("Erro ao copiar texto: ", err);
        },
      );
    });

    linhahbg.appendChild(linhahbgt1);
    linhahbg.appendChild(Input8);
    linhahbg.appendChild(linhahbgt2);
    linhahbg.appendChild(Input9);
    linhahbg.appendChild(linhahbgt3);
    linhahbg.appendChild(linhahbgt4);
    linhahbg.appendChild(linhahbgt5);
    linhahbg.appendChild(botCop8);

    const linhahbgbt = document.createElement("div");
    linhahbgbt.style.cssText = `
            
    `;

    const botFerr = CriarBot("Ferramenta");
    botFerr.addEventListener("click", function () {
      linhahbg.style.display =
        linhahbg.style.display === "flex" ? "none" : "flex";
    });

    linhahbgbt.appendChild(botFerr);
    linhahbgbt.appendChild(linhahbg);

    contentBox.appendChild(linhahbgbt);

    //outros

    const ass = document.getElementById("assinatura");

    if (ass) {
      if (assinatura) {
        ass.value = assinatura;
      } else {
        ass.value = "Vazio";
      }
      ass.addEventListener("input", () => {
        assinatura = ass.value;
        SalvarVari(1);
      });
    }

    const localizador = document.getElementById("localizador");

    if (localizador) {
      localizador.addEventListener("input", () => {
        localizador.value = localizador.value.toUpperCase();
      });
    }

    return contentBox;
  }

  function adicionarQuartoItem(novoItem) {
    // Seleciona o body
    const body = document.body;

    // Verifica se já existem pelo menos 3 elementos filhos
    if (body.children.length >= 4) {
      // Insere antes do atual 4º elemento (índice 3)
      //body.insertBefore(novoItem, body.children[4]);

      const item4 = body.children[4];
      item4.appendChild(novoItem);
    } else {
      // Se não houver 3 elementos, apenas adiciona no final
      body.appendChild(novoItem);
    }
  }

  adicionarQuartoItem(criarContentBox());
})();
