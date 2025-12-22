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
  var entrada1 = "";
  var entrada2 = "";
  var entrada3 = "";

  SalvarVari(0);

  function SalvarVari(x) {
    const DS = JSON.parse(localStorage.getItem("DadosSalvosRegis"));

    const DadosAtuais = {
      entrada1: entrada1,
      entrada2: entrada2,
      entrada3: entrada3,
    };

    if (x || !DS) {
      localStorage.setItem("DadosSalvosRegis", JSON.stringify(DadosAtuais));
    } else {
      entrada1 = DS.entrada1;
      entrada2 = DS.entrada2;
      entrada3 = DS.entrada3;
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
    contentBox.style.cssText = `
        display: flex;
        background-color: rgb(255, 236, 209);
        border: 3px solid rgb(255, 112, 32);
        border-radius: 15px;
        padding: 8px 0px;
        flex-direction: column;
        align-items: center;
    justify-content: center;
        `;
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
        descricao.value = textToCopy;
      }
    }
    preencheregis();

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
