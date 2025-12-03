// ==UserScript==
// @name         RegisMonkey2
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      6.1.6.3
// @description  that's all folks!
// @author       You
// @match        https://smileshelp.zendesk.com/agent/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zendesk.com
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/RegisMonkey2.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/RegisMonkey2.user.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  var nome = "";
  var entrada1 = "";
  var entrada2 = "";
  var entrada3 = "";
  var Cardhold = "";
  var Assinatura = "";
  var notas = "";

  const alvo = '[data-garden-id="chrome.nav_list"]';

  SalvarVari(0);

  Veriinicial();

  async function Veriinicial() {
    const a = await seExiste3(alvo);
    if (a) {
      criarNovoItem(alvo);
    }
  }

  function SalvarVari(x) {
    const DS = JSON.parse(localStorage.getItem("DadosSalvosRegis"));

    const DadosAtuais = {
      nome: nome,
      entrada1: entrada1,
      entrada2: entrada2,
      entrada3: entrada3,
      Cardhold: Cardhold,
      Assinatura: Assinatura,
      notas: notas,
    };

    if (x || !DS) {
      localStorage.setItem("DadosSalvosRegis", JSON.stringify(DadosAtuais));
    } else {
      nome = DS.nome;
      entrada1 = DS.entrada1;
      entrada2 = DS.entrada2;
      entrada3 = DS.entrada3;
      Cardhold = DS.Cardhold;
      Assinatura = DS.Assinatura;
      notas = DS.notas;
    }
  }

  function adicionarEventos(innerDiv, additionalContent) {
    innerDiv.addEventListener("click", function () {
      if (additionalContent.style.display === "none") {
        additionalContent.style.display = "block";
      } else {
        additionalContent.style.display = "none";
      }
    });
  }

  function criarNovoItem(alvo) {
    const a = document.querySelector(alvo);
    var novoItem = document.createElement("div");
    novoItem.id = "novoItem";
    novoItem.className = "StyledNavListItem-sc-18cj2v7-0 bbgdDD";
    novoItem.style.width = "auto";
    novoItem.style.height = "40px";
    novoItem.style.background = "rgba(195, 0, 0, 0)";
    novoItem.style.display = "flex";
    novoItem.style.justifyContent = "center";
    novoItem.style.alignItems = "center";

    var innerDiv = criarInnerDiv();
    novoItem.appendChild(innerDiv);

    var additionalContent = criarAdditionalContent();
    novoItem.appendChild(additionalContent);

    adicionarEventos(innerDiv, additionalContent);

    document.addEventListener("click", function (event) {
      if (
        !novoItem.contains(event.target) &&
        !innerDiv.contains(event.target)
      ) {
        additionalContent.style.display = "none";
      }
      encontrarTk();
    });
    a.appendChild(novoItem);
  }

  function seExiste3(w) {
    console.log("RegisMonk seExiste3 iniciado.");
    return new Promise((resolve) => {
      let resultado = false;

      const observer = new MutationObserver(() => {
        const a = document.querySelector(w);
        if (a) {
          observer.disconnect();
          console.log(`RegisMonk seExiste3 encontrado item inicial.`);
          resultado = true;
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        if (!resultado) {
          observer.disconnect();
          console.log("RegisMonk seExiste3 não encontrou item inicial.");
          resolve(resultado); // Retorna true se encontrou, false se não
        }
      }, 900000);
    });
  }

  function criarInnerDiv() {
    var innerDiv = document.createElement("div");
    innerDiv.id = "innerDiv";
    innerDiv.style.color = "rgb(111, 49, 14)";
    innerDiv.style.display = "flex";
    innerDiv.style.alignItems = "center";
    innerDiv.style.borderRadius = "50%";
    innerDiv.style.justifyContent = "center";
    innerDiv.style.fontSize = "25px";
    innerDiv.style.cursor = "pointer";
    innerDiv.innerHTML = "⚜";
    return innerDiv;
  }

  function criarAdditionalContent() {
    var additionalContent = document.createElement("div");
    additionalContent.id = "additionalContent";
    additionalContent.style.cssText = `
    position: absolute;
    left: 110%;
    top: 14%;
    align-items: center;
    max-height: 85%;
    overflow: auto;
    display: none;
    `;

    var contentBox = criarContentBox();
    additionalContent.appendChild(contentBox);

    var contentBox2 = criarContentBox2();
    additionalContent.appendChild(contentBox2);

    return additionalContent;
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

    const linha1 = CriarLinha(1);
    const linha1T1 = document.createElement("p");
    linha1T1.textContent = "O(A) ";

    const linha1in = CriarInput(0, "");
    linha1in.id = "input1";
    linha1in.value = nome;
    linha1in.addEventListener("input", () => {
      nome = linha1in.value;
      SalvarVari(1);
    });

    const linha1T2 = document.createElement("p");
    linha1T2.textContent = " entrou em contato solicitando:";

    linha1.appendChild(linha1T1);
    linha1.appendChild(linha1in);
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
    });
    linha6.appendChild(linha6in);
    dd1.appendChild(linha6);
    contentBox.appendChild(dd1);

    const linha7 = CriarLinha(7);
    const linha7in = CriarInput(0, "Localizador");
    // Mostrar/forçar em MAIÚSCULAS
    linha7in.style.textTransform = "uppercase";
    // Converter valor para maiúsculas enquanto digita
    linha7in.addEventListener("input", function () {
      const start = linha7in.selectionStart;
      const end = linha7in.selectionEnd;
      linha7in.value = (linha7in.value || "").toUpperCase();
      // restaurar posição do cursor
      try {
        linha7in.setSelectionRange(start, end);
      } catch (e) {}
    });
    const linha7T1 = document.createElement("p");
    linha7T1.textContent = "Localizador - ";
    linha7.appendChild(linha7T1);
    linha7.appendChild(linha7in);

    linha7.addEventListener("input", () => {
      if (!linha7in.value) {
        linha7.style.background = "rgb(255 108 0)";
      } else {
        linha7.style.background = "transparent";
      }
    });

    dd2.appendChild(linha7);

    const motivos = [
      { motivo: "Erro sistemico", waiver: "Waiver 01- SYSTEM ERROR" },
      {
        motivo: "Cliente Smiles Diamante categorizado cobrando assento",
        waiver: "Waiver 01- SYSTEM ERROR",
      },
      {
        motivo: "Regra tarifaria possui bagagem mas no VCR nao consta",
        waiver: "Waiver 01- SYSTEM ERROR",
      },
      {
        motivo: "Cancelamento dentro das 24 horas",
        waiver: "Waiver 08-AE FEE NOT APPLICABLE",
      },
      {
        motivo: "Cancelamento de servicos antes do voo",
        waiver: "Waiver 08-AE FEE NOT APPLICABLE",
      },
      {
        motivo: "CNN ao Lado do Responsável",
        waiver: "Waiver 08-AE FEE NOT APPLICABLE",
      },
      { motivo: "Remarcacao laudo medico", waiver: "Waiver 13- CONCESSAO" },
      { motivo: "Cancelamento laudo medico", waiver: "Waiver 13- CONCESSAO" },
      { motivo: "Remarcacao concurso publico", waiver: "Waiver 13- CONCESSAO" },
      {
        motivo: "Cancelamento concurso publico",
        waiver: "Waiver 13- CONCESSAO",
      },
      { motivo: "Duplicidade de compra", waiver: "Waiver 13- CONCESSAO" },
      {
        motivo: "Remarcacao erro do cliente dentro das 24 Horas",
        waiver: "Waiver 13- CONCESSAO",
      },
      {
        motivo: "Cancelamento por acomodacao",
        waiver: "Waiver 14- INVOL REACOMODACAO",
      },
      {
        motivo: "Isencao de assento por acomodacao voo direto para conexao",
        waiver: "Waiver 14- INVOL REACOMODACAO",
      },
      {
        motivo: "Voa Brasil Cancelamento Parcial ida voada cancelar a volta",
        waiver: "Waiver 19- ART19RA400",
      },
      {
        motivo: "Voa Brasil Cancelamento Parcial cancelar ida e manter volta",
        waiver: "Waiver 19- ART19RA400",
      },
    ];

    const linha8 = CriarLinha(8);
    const linha8in = Criarselect("Sim", "Não");
    linha8in.value = "Não";
    const linha8T1 = document.createElement("p");
    linha8T1.textContent = "Utilizou Waiver ? ";
    const linha8T2 = document.createElement("p");
    linha8T2.textContent = "";
    linha8.appendChild(linha8T1);
    linha8.appendChild(linha8in);
    linha8.appendChild(linha8T2);
    dd2.appendChild(linha8);

    const linha9 = CriarLinha(9);
    const motivosTexto = motivos.map((m) => m.motivo);
    const linha9in = Criarselect(...motivosTexto);
    linha9in.value = "Escolha o motivo";
    const linha9T1 = document.createElement("p");
    linha9T1.textContent = "Motivo da Waiver: ";
    linha9.appendChild(linha9T1);
    linha9.appendChild(linha9in);

    linha9in.addEventListener("change", () => {
      linha8T2.textContent = ` - ${
        motivos.find((m) => m.motivo === linha9in.value).waiver
      }`;
    });

    // Controlar visibilidade baseado na seleção de waiver
    linha8in.addEventListener("change", () => {
      if (linha8in.value === "Sim") {
        linha8T2.style.display = "flex";
        linha9.style.display = "flex";
      } else {
        linha8T2.style.display = "none";
        linha9.style.display = "none";
        linha9in.value = "Escolha o motivo";
        linha8T2.textContent = "";
      }
    });

    linha9.addEventListener("change", () => {
      if (linha8in.value === "Sim" && !linha9in.value) {
        linha9.style.background = "rgb(255 108 0)";
      } else {
        linha9.style.background = "transparent";
      }
    });

    // Inicializar com display none
    linha9.style.display = "none";

    dd2.appendChild(linha9);

    const linha10 = CriarLinha(10);
    const linha10in = Criarselect("Sim", "Não");
    linha10in.value = "Não";
    const linha10T1 = document.createElement("p");
    linha10T1.textContent = "Isentou taxa DU ? ";
    linha10.appendChild(linha10T1);
    linha10.appendChild(linha10in);
    dd2.appendChild(linha10);

    const motivosDU = [
      "Todas as vendas de receitas auxiliares",
      "Parcelamento com duas formas de pagamento",
      "Duas formas de pagamento que não sejam 2 cartões ou Travel Bank + Cartão de crédito",
      "Reserva de criança nos casos onde o adulto já possua a reserva",
      "Inclusao de infant na reserva",
      "Erro no site",
      "Isencao devido erro no cadastro",
      "Erro emissao menor desacompanhado",
      "Isencao devido SPEQ",
      "Isencao devido assitencia emergencial",
      "Isencao devido emissao MEDIF-FREMEC",
      "Para residentes no Amapá",
      "Remarcacao parcial",
      "Remarcacao dentro das 24 horas",
      "Remarcacao apos no-show",
      "Cancelamentos",
    ];

    const linha11 = CriarLinha(11);
    // usar a lista correta de motivosDU (array de strings)
    const motivosDUTexto = motivosDU.slice();
    const linha11in = Criarselect(...motivosDUTexto);
    linha11in.value = "Escolha o motivo";
    const linha11T1 = document.createElement("p");
    linha11T1.textContent = "Motivo da isenção: ";
    linha11.appendChild(linha11T1);
    linha11.appendChild(linha11in);

    // Controlar visibilidade baseado na seleção do select de isenção (linha10in)
    linha10in.addEventListener("change", () => {
      if (linha10in.value === "Sim") {
        linha11.style.display = "flex";
      } else {
        linha11.style.display = "none";
        linha11in.value = "Escolha o motivo";
      }
    });

    linha11.addEventListener("change", () => {
      if (linha10in.value === "Sim" && !linha11in.value) {
        linha11.style.background = "rgb(255 108 0)";
      } else {
        linha11.style.background = "transparent";
      }
    });

    // Inicializar com display none
    linha11.style.display = "none";

    dd2.appendChild(linha11);

    const linha12 = CriarLinha(12);
    const linha12in = Criarselect("Não se aplica", "Sim", "Não");
    linha12in.value = "Não se aplica";
    const linha12T1 = document.createElement("p");
    linha12T1.textContent = "Utilizou link de pagamento ? ";
    linha12.appendChild(linha12T1);
    linha12.appendChild(linha12in);
    dd2.appendChild(linha12);


    const linha14 = CriarLinha(14);
    const linha14T1 = document.createElement("p");
    linha14T1.textContent = "Motivo ? ";
    const linha14in = CriarInput(0, "Motivo");

    linha14.appendChild(linha14T1);
    linha14.appendChild(linha14in);
    linha14.style.display = "none";
    dd2.appendChild(linha14);

    linha12in.addEventListener("change", () => {
      if(linha12in.value === "Não"){
        linha14.style.display = "flex";
      }else{
        linha14.style.display = "none";
      }
    });


    const linha13 = CriarLinha(13);
    const linha13in = Criarselect(
      "Sim, Sucesso",
      "Sim, Porem Muda",
      "Sim, Falhou, Caixa Postal",
      "Sim, Falhou, Erro Nice",
      "Sim, Falhou, Não Atendeu",
      "Não"
    );
    linha13in.value = "Não";
    const linha13T1 = document.createElement("p");
    linha13T1.textContent = "Fez Callback ? ";
    linha13.appendChild(linha13T1);
    linha13.appendChild(linha13in);
    dd2.appendChild(linha13);

    var dd3 = document.createElement("div");
    dd3.style.cssText = `
    width: max-content;
    `;

    dd3.appendChild(dd1);
    dd3.appendChild(dd2);
    contentBox.appendChild(dd3);

    var buttonContainer = document.createElement("div");
    buttonContainer.id = "buttonContainer";
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: space-evenly;
        width: 100%;
        `;

    const contentBoxlimpar = ADDCaixaDAviso("Registro", () => {
      nome = "";
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
      linha7in.value = "";
      linha8in.value = "Não";
      linha8T2.textContent = "";
      linha9in.value = "";
      linha9.style.display = "none";
      linha10in.value = "Não";
      linha11in.value = "";
      linha11.style.display = "none";
      linha12in.value = "Não se aplica";
      linha14in.value = "";
      linha13in.value = "Não";

    });

    contentBoxlimpar.style.visibility = "hidden";

    contentBox.appendChild(contentBoxlimpar);

    const botlimpar = CriarBotLimpar();
    botlimpar.addEventListener("click", function () {
      contentBoxlimpar.style.visibility = "visible";
    });

    buttonContainer.appendChild(botlimpar);

    const copyButton = CriarBotCopiar();

    copyButton.addEventListener("click", function () {
      if (linha8in.value === "Sim" && !linha9in.value) {
        linha9.style.background = "rgb(255 108 0)";
      } else {
        linha9.style.background = "transparent";
      }
      if (linha10in.value === "Sim" && !linha11in.value) {
        linha11.style.background = "rgb(255 108 0)";
      } else {
        linha11.style.background = "transparent";
      }

      // Buscar Localizador PNR na página
      const pnrNaPagina = buscarLocalizadorPNR();
      // Se o widget estiver vazio e a página tiver valor, preenche o campo do widget
      if (!linha7in.value && pnrNaPagina && pnrNaPagina.valor !== "0-0") {
        linha7in.value = pnrNaPagina.valor;
      }

      if (pnrNaPagina && pnrNaPagina.valor === "0-0") {
        // Se o widget tiver valor, tenta atualizar o campo da página
        // (usar a função que já escreve e dispara eventos)
        if (linha7in.value) {
          try {
            const updated = buscarLocalizadorPNR(linha7in.value);
            if (!updated) {
              log("PNR na página não encontrado para atualização");
            }
          } catch (e) {
            log("Erro ao atualizar PNR na página:", e);
          }
        }
      }

      if (!linha7in.value) {
        linha7.style.background = "rgb(255 108 0)";
      } else {
        linha7.style.background = "transparent";
      }

      var textnome = linha1in.value || linha1in.placeholder;
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
      var variant3;
      if (linha7in.value !== "") {
        variant3 = "\n\n" + linha7T1.textContent + linha7in.value + ".";
      } else {
        variant3 = "\n\n" + linha7T1.textContent + "Não se aplica.";
      }
      var variant4;
      if (linha8in.value !== "") {
        variant4 =
          "\n\n" +
          linha8T1.textContent +
          linha8in.value +
          linha8T2.textContent +
          ".";
      } else {
        variant4 = "";
      }
      var variant5;
      if (linha9in.value !== "") {
        variant5 = "\n\n" + linha9T1.textContent + linha9in.value + ".";
      } else {
        variant5 = "";
      }
      var variant6;
      if (linha10in.value !== "") {
        variant6 = "\n\n" + linha10T1.textContent + linha10in.value + ".";
      } else {
        variant6 = "";
      }
      var variant7;
      if (linha11in.value !== "") {
        variant7 = "\n\n" + linha11T1.textContent + linha11in.value + ".";
      } else {
        variant7 = "";
      }
      var variant8;
      if (linha12in.value !== "") {
        variant8 = "\n\n" + linha12T1.textContent + linha12in.value + ".";
      } else {
        variant8 = "";
      }
      var variant10;
      if (linha14in.value !== "") {
        variant10 = "\n\n" + linha14T1.textContent + linha14in.value + ".";
      } else {
        variant10 = "";
      }
      var variant9;
      if (linha13in.value !== "") {
        variant9 = "\n\n" + linha13T1.textContent + linha13in.value + ".";
      } else {
        variant9 = "";
      }

      //const TextoLAss = element.

      TextoLAss.textContent + Input6.value;

      var textToCopy =
        linha1T1.textContent +
        textnome +
        linha1T2.textContent +
        "\n" +
        linha2in.value +
        "\n\n" +
        variant1 +
        variant2 +
        variant3 +
        variant4 +
        variant5 +
        variant6 +
        variant7 +
        variant8 +
        variant10 +
        variant9;
      navigator.clipboard.writeText(textToCopy).then(
        function () {
          console.log("Texto copiado com sucesso.");
        },
        function (err) {
          console.error("Erro ao copiar texto: ", err);
        }
      );
    });

    buttonContainer.appendChild(copyButton);

    contentBox.appendChild(buttonContainer);

    return contentBox;
  }

  function CriarBotCopiar() {
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
    a.textContent = "Copiar";
    return a;
  }

  function CriarBotLimpar() {
    var a = document.createElement("button");
    a.style.cssText = `
        cursor: pointer;
        border-radius: 15px;
        border: none;
        color: white;
        padding: 3px 9px;
        margin: 3px;
        background-color: rgb(147, 176, 205);
        `;
    a.textContent = "Limpar";
    return a;
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

  function Criarselect(...opcoes) {
    var select = document.createElement("select");
    select.style.cssText = `
        margin: 0px 5px;
        width: 80px;
        border-radius: 10px;
        padding: 1px;
        text-align: center;
        border-bottom: 2px solid rgb(209, 0, 0);
        `;
    opcoes.forEach(function (opcao) {
      var option = document.createElement("option");
      option.value = opcao;
      option.textContent = opcao;
      select.appendChild(option);
    });
    return select;
  }

  function criarContentBox2() {
    var contentBox2 = document.createElement("div");
    contentBox2.id = "contentBox2";
    contentBox2.style.cssText = `
        display: flex;
        background-color: rgb(255, 236, 209);
        border: 3px solid rgb(255, 112, 32);
        border-radius: 15px;
        padding: 8px;
        margin-top: 10px;
        flex-direction: column;
        `;

    var paragraph21 = document.createElement("p");
    paragraph21.id = "paragraph21";
    paragraph21.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

    const botCop5 = CriarBotCopiar();

    const Input5 = CriarInput(0, "");
    Input5.placeholder = "XXXXXXX";
    Input5.id = "input5";

    var TextoTick = document.createElement("p");
    TextoTick.textContent = "Ticket ";

    botCop5.addEventListener("click", function () {
      var a = Input5.value || Input5.placeholder;
      var b = TextoTick.textContent + a;

      navigator.clipboard.writeText(b).then(
        function () {
          console.log("Texto copiado com sucesso.");
        },
        function (err) {
          console.error("Erro ao copiar texto: ", err);
        }
      );
    });

    paragraph21.appendChild(TextoTick);
    paragraph21.appendChild(Input5);
    paragraph21.appendChild(botCop5);

    contentBox2.appendChild(paragraph21);

    var Cardholder = document.createElement("div");
    Cardholder.id = "paragraph22";
    Cardholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

    var TextoLAss = document.createElement("p");
    TextoLAss.textContent = "cardholdername-";
    TextoLAss.id = 'TextoLAss';

    const botCop6 = CriarBotCopiar();

    const Input6 = CriarInput(0, "");
    Input6.placeholder = "XXXXXXX";
    Input6.value = Cardhold;
    Input6.id = 'Input6';

    // Criar o elemento sizer invisível
    const sizer = document.createElement("span");
    sizer.style.position = "absolute";
    sizer.style.top = "-9999px";
    sizer.style.left = "-9999px";
    sizer.style.visibility = "hidden";
    sizer.style.whiteSpace = "pre";
    sizer.style.fontSize = getComputedStyle(Input6).fontSize;
    sizer.style.fontFamily = getComputedStyle(Input6).fontFamily;
    document.body.appendChild(sizer);

    // Atualizar largura conforme o texto
    Input6.addEventListener("input", function () {
      sizer.textContent = Input6.value || Input6.placeholder;
      Input6.style.width = sizer.offsetWidth + "px";
      Cardhold = Input6.value;
      SalvarVari(1);
    });

    // Inicializar com o placeholder
    sizer.textContent = Input6.value || Input6.placeholder;
    Input6.style.width = sizer.offsetWidth + "px";

    botCop6.addEventListener("click", function () {
      var textToCopy = TextoLAss.textContent + Input6.value;

      navigator.clipboard.writeText(textToCopy).then(
        function () {
          console.log("Texto copiado com sucesso.");
        },
        function (err) {
          console.error("Erro ao copiar texto: ", err);
        }
      );
    });

    Cardholder.appendChild(TextoLAss);
    Cardholder.appendChild(Input6);
    Cardholder.appendChild(botCop6);

    var ClinhaAssin = document.createElement("p");
    ClinhaAssin.id = "ClinhaAssin";
    ClinhaAssin.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

    const botCop7 = CriarBotCopiar();

    const Input7 = CriarInput(0, "");
    Input7.placeholder = "ALMAVIVA.XXXXXXX-0300-MCZ";
    Input7.value = Assinatura;
    

    Input7.addEventListener("input", function () {
      sizer.textContent = Input7.value || Input7.placeholder;
      Input7.style.width = sizer.offsetWidth + "px";
      Assinatura = Input7.value;
      SalvarVari(1);
    });

    // Inicializar com o placeholder
    sizer.textContent = Input7.placeholder;
    Input7.style.width = sizer.offsetWidth + "px";

    botCop7.addEventListener("click", function () {
      var textToCopy = Input7.value;

      navigator.clipboard.writeText(textToCopy).then(
        function () {
          console.log("Texto copiado com sucesso.");
        },
        function (err) {
          console.error("Erro ao copiar texto: ", err);
        }
      );
    });

    ClinhaAssin.appendChild(Input7);
    ClinhaAssin.appendChild(botCop7);

    contentBox2.appendChild(ClinhaAssin);
    contentBox2.appendChild(Cardholder);

    var linhahbg = document.createElement("p");
    linhahbg.id = "ClinhaAssin";
    linhahbg.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
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

    const botCop8 = CriarBotCopiar();
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
        }
      );
    });

    linhahbg.appendChild(linhahbgt1);
    linhahbg.appendChild(Input8);
    linhahbg.appendChild(linhahbgt2);
    linhahbg.appendChild(Input9);
    linhahbg.appendChild(linhahbgt3);
    linhahbg.appendChild(linhahbgt4);
    linhahbg.appendChild(linhahbgt5);

    contentBox2.appendChild(linhahbg);

    const linhahbgbt = document.createElement("div");
    linhahbgbt.style.cssText = `
        display: flex;
        justify-content: space-around;
    `;

    linhahbgbt.appendChild(botCop8);

    contentBox2.appendChild(linhahbgbt);

    const CaixadBDnotas = document.createElement("div");
    CaixadBDnotas.style.cssText = `
        margin-top: 5%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
       `;

    const BDnotas = document.createElement("textarea");
    BDnotas.id = "notepad"; // Aqui estava o erro
    BDnotas.placeholder = "Escreva suas notas aqui...";
    BDnotas.style.cssText = `
        width: 290px;
        height: 70px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        `;
    BDnotas.addEventListener("blur", saveNotes);

    const exibirSalvo = document.createElement("div");
    exibirSalvo.textContent = "Salvo!";
    exibirSalvo.id = "message";
    exibirSalvo.style.cssText = `
                border-radius: 15px;
        border: none;
        color: white;
        padding: 3px 9px;
        background-color: #33cb44;
        display: none;
        justify-content: center;
        align-items: center;
        position: absolute;
            `;
    BDnotas.value = notas;

    CaixadBDnotas.append(BDnotas, exibirSalvo);
    contentBox2.appendChild(CaixadBDnotas);

    // Função para salvar notas
    function saveNotes() {
      notas = document.getElementById("notepad").value;
      SalvarVari(1);
      showMessage();
    }
    // Função para mostrar a mensagem de salvo
    function showMessage() {
      const message = document.getElementById("message");
      message.style.display = "flex";
      setTimeout(() => {
        message.style.display = "none";
      }, 500);
    }

    return contentBox2;
  }

  /** ===========================
   *  CONFIGURAÇÕES
   *  =========================== */
  const CONFIG = {
    // Onde escrever o NOME encontrado
    input1Selector: "#input1",
    // "placeholder" | "value" | "valueIfEmpty"
    input1Mode: "valueIfEmpty",

    // Onde escrever o NÚMERO DO TICKET encontrado na URL
    input5Selector: "#input5",
    // "placeholder" | "value" | "valueIfEmpty"
    input5Mode: "value",

    // Destaque visual
    highlight: true,

    // Debounce de observação
    debounceMs: 300,

    // Tempo máximo para aguardar o ticket no DOM
    waitTimeoutMs: 15000,

    // Gerador de regex do texto do ticket ("Ticket #<n>")
    ticketRegexText: (n) =>
      new RegExp(
        `Ticket\\s*#\\s*${String(n).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`,
        "i"
      ),

    // Logs de depuração
    debug: false,
  };

  const LOG_PREFIX = "[TM encontrarNome]";
  const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
  const log = (...args) => CONFIG.debug && console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  /** ===========================
   *  EXTRAIR TICKET DA URL
   *  =========================== */
  function extrairTicketDaURL(href) {
    const setStr = (v) => (v == null ? null : String(v));
    let numero = null;
    try {
      const url = new URL(href);

      // 1) Segmentos do path (pega o último que contenha dígitos)
      const pathSegs = url.pathname.split("/").filter(Boolean);
      for (let i = pathSegs.length - 1; i >= 0 && !numero; i--) {
        const m = pathSegs[i].match(/\d+/);
        if (m) numero = m[0];
      }

      // 2) /ticket(s)/<n>
      if (!numero) {
        const m = href.match(/\/tickets?\/(\d+)/i);
        if (m) numero = m[1];
      }

      // 3) Hash
      if (!numero && url.hash) {
        const m = url.hash.match(/\d+/);
        if (m) numero = m[0];
      }

      // 4) Query (?ticket_id=<n> ou ?id=<n>)
      if (!numero) {
        const qp =
          url.searchParams.get("ticket_id") || url.searchParams.get("id");
        if (qp && /^\d+$/.test(qp)) numero = qp;
      }
    } catch {
      // Fallback: último grupo de dígitos na URL
      const m = (href || "").match(/(\d+)(?!.*\d)/);
      if (m) numero = m[1];
    }
    return setStr(numero);
  }

  /** ===========================
   *  ACHAR "Ticket #<n>" E NOME ANTERIOR NO DOC ATUAL
   *  =========================== */
  function findTicketAndPrevNameInDoc(doc, ticketNumber) {
    if (!ticketNumber) return null;
    const needle = CONFIG.ticketRegexText(ticketNumber);

    // Preferir navs com aria-label sugestivo; senão, todos os <nav>
    const preferred = Array.from(
      doc.querySelectorAll(
        'nav[aria-label*="Localiza" i], nav[aria-label*="ticket" i]'
      )
    );
    const navs = preferred.length
      ? preferred
      : Array.from(doc.querySelectorAll("nav"));

    for (const nav of navs) {
      const nodes = Array.from(
        nav.querySelectorAll("span, [role='link'], [role='button']")
      );
      for (const el of nodes) {
        const text = normalize(el.textContent);
        if (!text || !needle.test(text)) continue;

        // Sobe ao <span> contêiner mais externo que contém o texto
        let container = el;
        while (
          container.parentElement &&
          container.parentElement.tagName === "SPAN" &&
          needle.test(normalize(container.parentElement.textContent))
        ) {
          container = container.parentElement;
        }

        // Irmão anterior com texto = nome
        let nameEl = container.previousElementSibling;
        while (nameEl && !normalize(nameEl.textContent)) {
          nameEl = nameEl.previousElementSibling;
        }

        return { nav, container, nameEl };
      }
    }
    return null;
  }

  /** Espera o ticket aparecer no DOM deste contexto */
  function waitForTicketInThisDoc(
    doc,
    ticketNumber,
    timeout = CONFIG.waitTimeoutMs
  ) {
    return new Promise((resolve) => {
      const start = performance.now();
      let done = false;

      const tryFind = () => {
        if (done) return true;
        const found = findTicketAndPrevNameInDoc(doc, ticketNumber);
        if (found) {
          cleanup();
          done = true;
          resolve(found);
          return true;
        }
        if (performance.now() - start >= timeout) {
          cleanup();
          done = true;
          resolve(null);
          return true;
        }
        return false;
      };

      const mo = new MutationObserver(() => {
        tryFind();
      });
      try {
        mo.observe(doc, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      } catch {}

      const interval = setInterval(() => {
        tryFind();
      }, 300);
      tryFind();

      function cleanup() {
        try {
          mo.disconnect();
        } catch {}
        clearInterval(interval);
      }
    });
  }

  /**
   * Aplica texto ao input alvo.
   * mode:
   *  - "placeholder": sempre escreve placeholder
   *  - "value": sempre escreve value
   *  - "valueIfEmpty": escreve em value apenas se estiver vazio; caso contrário, preserva o value e opcionalmente define placeholder
   */
  function applyToInput(
    doc,
    selector,
    mode,
    text,
    { setPlaceholderWhenHasValue = true } = {}
  ) {
    const elHere = doc.querySelector(selector);
    const elTop = document.querySelector(selector);
    const input = elHere || elTop;
    if (!input) {
      warn(`Input não encontrado: ${selector}`);
      return { input: null, applied: null, used: null };
    }

    const words = normalize(text || "").split(" ");
    const first = words[0] || "";
    const value =
      !first || !isNaN(first)
        ? "Anônimo"
        : first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();

    try {
      if (mode === "value") {
        input.value = value;
        return { input, applied: value, used: "value" };
      }
      if (mode === "placeholder") {
        input.placeholder = value;
        return { input, applied: value, used: "placeholder" };
      }
      // valueIfEmpty
      const current = (input.value ?? "").trim();
      if (!current) {
        input.value = value;
        return { input, applied: value, used: "valueIfEmpty(value)" };
      } else {
        if (setPlaceholderWhenHasValue && !input.placeholder) {
          input.placeholder = value;
        }
        return { input, applied: null, used: "valueIfEmpty(skip)" };
      }
    } catch (e) {
      warn("Falha ao aplicar no input:", e);
      return { input, applied: null, used: "error" };
    }
  }

  /** Destaque visual opcional */
  function highlightEls(ticketEl, nameEl) {
    if (!CONFIG.highlight) return;
    try {
      if (ticketEl) ticketEl.style.borderBottom = "1px solid #0ea5e9";
      if (nameEl) nameEl.style.borderBottom = "1px solid #f97316";
    } catch {}
  }

  /** ===========================
   *  API: encontrarNome(ticketNumber)
   *  =========================== */
  async function encontrarNome(ticketNumber) {
    const ticketStr = ticketNumber == null ? "" : String(ticketNumber).trim();
    if (!ticketStr) {
      // Sem número => aplica "Anônimo" conforme regra do input1
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn("Nenhum número de ticket fornecido a encontrarNome().");
      return null;
    }

    const found = await waitForTicketInThisDoc(
      document,
      ticketStr,
      CONFIG.waitTimeoutMs
    );
    if (!found) {
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn(
        `Ticket #${ticketStr} não apareceu neste contexto em ${CONFIG.waitTimeoutMs}ms.`
      );
      return null;
    }

    const { container, nameEl } = found;

    if (!nameEl) {
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      warn(`Nome anterior ao Ticket #${ticketStr} não encontrado.`);
      return null;
    }

    const nameText = normalize(nameEl.textContent);
    const res = applyToInput(
      document,
      CONFIG.input1Selector,
      CONFIG.input1Mode,
      nameText
    );
    highlightEls(container, nameEl);

    log(
      `Ticket #${ticketStr} | Nome: "${nameText}" | Aplicado:`,
      res.applied,
      "| modo:",
      res.used
    );
    return {
      ticket: ticketStr,
      nomeCompleto: nameText,
      aplicado: res.applied,
      modeUsed: res.used,
      elements: { ticket: container, nome: nameEl },
    };
  }

  /** ===========================
   *  Buscar Localizador PNR na página
   *  =========================== */
  function buscarLocalizadorPNR(novoValor) {
    try {
      const labels = document.querySelectorAll("label");
      for (const label of labels) {
        const text = (label.textContent || "").toUpperCase();
        if (text.includes("LOCALIZADOR") && text.includes("PNR")) {
          const inputId = label.getAttribute("for");
          if (inputId) {
            const input = document.getElementById(inputId);
            if (input && isElementVisible(input)) {
              // Verifica visibilidade real
              if (novoValor !== undefined) {
                // Usa setter nativo para frameworks como React
                const setter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value"
                ).set;
                setter.call(input, novoValor);

                // Também define atributo para reforçar
                input.setAttribute("value", novoValor);

                // Dispara eventos para atualizar estado interno
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));

                return true; // Encontrou e atualizou
              } else {
                // Apenas retorna informações
                return {
                  label: label.textContent.trim(),
                  valor: input.value || "0-0",
                  inputId,
                  input,
                };
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro na função buscarLocalizadorPNR:", e);
    }
    return novoValor !== undefined ? false : null;
  }

  // Função auxiliar para verificar visibilidade real
  function isElementVisible(el) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function ADDCaixaDAviso(titulo, funcao) {
    const caixa = document.createElement("div");
    caixa.id = "CaiDeAvi";
    caixa.style.cssText = `
    border: 3px solid rgb(255, 112, 32);
        background: rgb(255, 236, 209);
        position: absolute;
        padding: 6px 10px;
        border-radius: 12px;
       display: flex;
        flex-direction: column;
        align-items: center;
        `;
    const Ctitulo = document.createElement("div");
    Ctitulo.innerHTML = titulo;
    Ctitulo.style.cssText = `
            font-size: 14px;
            border-bottom-style: dashed;
            border-width: 1px;
            margin-bottom: 6px;
        `;

    const TC = document.createElement("div");
    TC.style.cssText = `
        margin-bottom: 8px;
        `;

    TC.innerHTML = "Tem Certeza ?";
    const CaixaSouN = document.createElement("div");
    CaixaSouN.style.cssText = `
        display: flex;
        justify-content: space-between;
        width: 100%;
        `;

    function SimouNao(texto) {
      const a = document.createElement("div");
      a.innerHTML = texto;
      a.style.cssText = `
            cursor: pointer;
            border: rgb(255, 112, 32) 2px solid;
            border-radius: 15px;
            padding: 2px 4px;
           `;
      a.addEventListener("mouseover", function () {
        a.style.background = "white";
        a.style.color = "rgb(255, 236, 209)";
      });

      a.addEventListener("mouseout", function () {
        a.style.background = "";
        a.style.color = "";
      });
      a.addEventListener("click", function () {
        if (texto === "Sim") {
          funcao();
        }
        caixa.style.visibility = "hidden";
        //caixa.remove();
      });
      return a;
    }

    CaixaSouN.appendChild(SimouNao("Sim"));
    CaixaSouN.appendChild(SimouNao("Não"));

    caixa.appendChild(Ctitulo);
    caixa.appendChild(TC);
    caixa.appendChild(CaixaSouN);

    return caixa;
  }

  /** ===========================
   *  API: encontrarTk()
   *  - Extrai número do ticket da URL do contexto atual
   *  - Preenche #input5 conforme CONFIG.input5Mode (inclui valueIfEmpty)
   *  - Busca e preenche linha7in com Localizador PNR se vazio
   *  - Chama encontrarNome(numero)
   *  =========================== */
  async function encontrarTk() {
    const href = window.location.href || "";
    const numero = extrairTicketDaURL(href);
    const nToApply = numero || "000000";

    // Preencher input5 respeitando o modo (inclui valueIfEmpty)
    (function applyTicketToInput5() {
      const elHere = document.querySelector(CONFIG.input5Selector);
      const elTop = document.querySelector(CONFIG.input5Selector);
      const input5 = elHere || elTop;

      if (!input5) {
        warn(`Input do ticket não encontrado: ${CONFIG.input5Selector}`);
        return;
      }

      try {
        const mode = CONFIG.input5Mode;
        if (mode === "value") {
          input5.value = nToApply;
        } else if (mode === "placeholder") {
          input5.placeholder = nToApply;
        } else if (mode === "valueIfEmpty") {
          const current = (input5.value ?? "").trim();
          if (!current) {
            input5.value = nToApply;
          } else if (!input5.placeholder) {
            // opcional: deixa um placeholder de apoio
            input5.placeholder = nToApply;
          }
        }
      } catch (e) {
        warn("Falha ao aplicar no input5:", e);
      }
    })();

    if (!numero) {
      log("Nenhum número de ticket encontrado na URL.");
      // Ainda aplica "Anônimo" no input1 conforme regra definida
      applyToInput(document, CONFIG.input1Selector, CONFIG.input1Mode, "");
      return null;
    }

    // Chama encontrarNome com o número encontrado
    try {
      await Promise.resolve(encontrarNome(numero));
    } catch (e) {
      console.error(LOG_PREFIX, "Erro ao executar encontrarNome:", e);
    }

    return numero;
  }

  /** ===========================
   *  Auto-execução: observa SPA e DOM
   *  =========================== */
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function setupAutoRun() {
    const run = () => {
      try {
        encontrarTk();
      } catch (e) {
        console.error(LOG_PREFIX, e);
      }
    };
    const runDebounced = debounce(run, CONFIG.debounceMs);

    // Rodar já
    runDebounced();

    // Observar DOM
    const mo = new MutationObserver(runDebounced);
    try {
      mo.observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    } catch {}

    // Observar mudanças de URL (SPA)
    try {
      if (!window.__tm_loc_hooked__) {
        const fire = () => window.dispatchEvent(new Event("locationchange"));
        const _push = history.pushState;
        history.pushState = function () {
          const r = _push.apply(this, arguments);
          fire();
          return r;
        };
        const _replace = history.replaceState;
        history.replaceState = function () {
          const r = _replace.apply(this, arguments);
          fire();
          return r;
        };
        window.addEventListener("popstate", fire);
        window.__tm_loc_hooked__ = true;
      }
      window.addEventListener("locationchange", runDebounced);
    } catch (e) {
      log("Hook de history indisponível:", e);
    }

    // Expor helpers para o console (opcional)
    try {
      window.encontrarTk = encontrarTk;
      window.encontrarNome = encontrarNome;
    } catch {}
  }

  // Início
  setupAutoRun();

  // Your code here...
})();
