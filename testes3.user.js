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
  const CConfig = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    logueEntreDatas: 0,
    pausalimitada: 0,
  };
  /**
   * Ccor - Cores usadas na interface (valores em hex)
   */
  const Ccor = {
    Offline: "#3a82cf",
    Atualizando: "#c97123ff",
    Erro: "#992e2e",
    MetaTMA: "#229b8d",
    Principal: "#4c95bd",
    Config: "#96a8bb",
    Varian: "",
    TVarian: "",
  };

  /**
   * criarBotSalv - cria um botão estilizado simples
   * @param {number} idBot - id único do botão
   * @param {string} texto - texto a exibir
   * @returns {HTMLElement} botão criado
   */
  function criarBotSalv(idBot, texto) {
    const Botao = document.createElement("button");
    Botao.id = `Botao${idBot}`;
    Botao.style.cssText = `
            padding: 1px 3px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 10px;
            height: 22px;
            `;

    Botao.textContent = `${texto}`;

    return Botao;
  }

  function criarC() {
    const style = document.createElement("style");
    style.textContent = `
        .placeholderPerso::placeholder {
        color: #6d4500;
        opacity: 1;
        font-size: 12px;
        }
        `;

    const caixa = document.createElement("div");
    caixa.id = "CaixaConfig";
    caixa.style.cssText = `
        height: 170px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        background: ${Ccor.Config};
        transition: all 0.5s ease;
        flex-direction: column;
        padding: 10px;
        overflow: auto;
        width: 210px;
        border: solid steelblue;
        margin-left: 5px;
        `;

    function criarCaixaSeg() {
      const caixa = document.createElement("div");
      caixa.style.cssText = `
            display: flex;
            flex-direction: column;
            width: 100%;
            `;
      return caixa;
    }

    function CaixaDeOcultar(titulo, objeto) {
      const Titulofeito = titulo;
      const CaixaPrincipal = criarCaixaSeg();
      Titulofeito.style.cssText = `
            padding: 2px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 12px;
            height: 22px;
            `;
      Titulofeito.addEventListener("click", function () {
        const a = document.getElementById(objeto.id);
        const b = document.getElementById(Titulofeito.id);
        if (!a) {
          CaixaPrincipal.append(objeto);
        } else {
          a.remove();
        }
        b.style.marginBottom = a ? "0px" : "6px";
        AtualizarConf();
      });
      CaixaPrincipal.append(Titulofeito);
      return CaixaPrincipal;
    }

    function entradatempo(idV, houm, placeholderV) {
      const input = document.createElement("input");
      input.className = "placeholderPerso";
      input.id = `Input${idV}`;
      input.type = "number";
      input.placeholder = placeholderV;
      input.min = 0;
      input.max = houm ? 23 : 59;
      input.style.cssText = `
                width: 42px;
                background: #ffffff00;
                border: solid 1px white;
                color: white;
                font-size: 12px;
            `;
      return input;
    }
    // Criar separador visual ":"
    function doispontos() {
      const DoisP = document.createElement("span");
      DoisP.textContent = ":";
      DoisP.style.cssText = `
                color: white;
                padding: 0 5px;
                font-size: 20px;
            `;
      return DoisP;
    }

    function ContTempEsc() {
      const horaInputCai = document.createElement("div");
      horaInputCai.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        `;
      horaInputCai.id = "inputEscala";
      const SalvarHora = criarBotSalv(13, "Salvar");
      SalvarHora.style.marginLeft = "5px";
      SalvarHora.addEventListener("click", function () {
        salvarHorario();
        ControleFront();
        SalvandoVari(1);
      });
      const horaInputCaiHM = document.createElement("div");
      horaInputCaiHM.style.cssText = `display: flex; align-items: center;`;
      const [horasS, minutosS, segundosS] =
        CConfig.TempoEscaladoHoras.split(":").map(Number);
      const horaInputTE = entradatempo(
        "HoraEsc",
        1,
        String(horasS).padStart(2, "0")
      );
      const minuInputTE = entradatempo(
        "MinuEsc",
        0,
        String(minutosS).padStart(2, "0")
      );

      function salvarHorario() {
        const hora = parseInt(horaInputTE.value) || horasS;
        const minuto = parseInt(minuInputTE.value) || minutosS;

        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");
        const segundos = "00";

        const horarioFormatado = `${horaFormatada}:${minutoFormatado}:${segundos}`;

        // Salva na variável
        CConfig.TempoEscaladoHoras = horarioFormatado;

        horaInputTE.value = "";
        minuInputTE.value = "";
        horaInputTE.placeholder = horaFormatada;
        minuInputTE.placeholder = minutoFormatado;
      }
      horaInputCaiHM.append(horaInputTE, doispontos(), minuInputTE);
      horaInputCai.append(horaInputCaiHM, SalvarHora);
      const a = CaixaDeOcultar(
        criarBotSalv(28, "Tempo Escalado"),
        horaInputCai
      );
      return a;
    }

    function ContlogueManual() {
      function salvarHorariologueManual() {
        const hora = parseInt(
          horaInputlogueManual.value || horaInputlogueManual.placeholder
        );
        const minuto = parseInt(
          minuInputlogueManual.value || minuInputlogueManual.placeholder
        );
        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");
        const segundos = "00";
        const horarioFormatado = `${horaFormatada}:${minutoFormatado}:${segundos}`;
        horaInputlogueManual.placeholder = horaFormatada;
        minuInputlogueManual.placeholder = minutoFormatado;
        CConfig.ValorLogueManual = horarioFormatado;
        SalvarLogueManual(1);
      }
      const InputCailogueManual = document.createElement("div");
      InputCailogueManual.style.cssText = `display: flex; align-items: center;`;
      const horaInputlogueManual = entradatempo(
        "HLManual",
        1,
        String("0").padStart(2, "0")
      );
      horaInputlogueManual.addEventListener("input", function () {
        salvarHorariologueManual();
      });
      const minuInputlogueManual = entradatempo(
        "MLManual",
        0,
        String("0").padStart(2, "0")
      );
      minuInputlogueManual.addEventListener("input", function () {
        salvarHorariologueManual();
      });
      InputCailogueManual.append(
        horaInputlogueManual,
        doispontos(),
        minuInputlogueManual
      );

      const horaInputCailogueManual = document.createElement("div");
      horaInputCailogueManual.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        `;
      horaInputCailogueManual.id = "CinputLogueManual";
      const logueManualC = criarBotaoSlide2(13, () => {
        CConfig.LogueManual = !CConfig.LogueManual;
        if (CConfig.LogueManual) {
          const [horasIm, minutosIm, segundosIm] = converterParaTempo(
            Segun.QualLogou
          )
            .split(":")
            .map(Number);
          horaInputlogueManual.value = String(horasIm).padStart(2, "0");
          minuInputlogueManual.value = String(minutosIm).padStart(2, "0");
        } else {
          iniciarBusca();
        }
        SalvarLogueManual(1);
        AtualizarConf();
      });
      logueManualC.style.cssText = `
        margin-left: 6px;
        `;

      horaInputCailogueManual.append(InputCailogueManual, logueManualC);
      const a = CaixaDeOcultar(
        criarBotSalv(27, "Logue Manual"),
        horaInputCailogueManual
      );
      return a;
    }

    function ContModoTeste() {
      const area = criarCaixaSeg();
      area.id = "CModoTeste";

      const linha = document.createElement("div");
      linha.style.cssText = `
        display: flex;
        align-items: center;
        width: 100%;
        margin-top: 6px;
      `;

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.id = "InputModoTesteDate";
      dateInput.style.cssText = `background: #ffffff00; border: solid 1px white; color: white; padding:2px;`;
      dateInput.value =
        VariavelmodoTeste && VariavelmodoTeste.data
          ? VariavelmodoTeste.data
          : "";

      // Criar inputs separados para hora e minuto (como em ContlogueManual)
      const existingHoraRaw =
        (VariavelmodoTeste &&
          (VariavelmodoTeste.hora || VariavelmodoTeste.fuso)) ||
        "+00:00:00";
      // preserva sinal (+/-) se houver
      const signMatch = /^[+-]/.test(existingHoraRaw) ? existingHoraRaw[0] : "";
      const existingHora = signMatch
        ? existingHoraRaw.slice(1)
        : existingHoraRaw;
      const [existH = "00", existM = "00"] = existingHora
        .split(":")
        .map((v) => String(v).padStart(2, "0"));

      const horaInputModoTeste = entradatempo(
        "HModoTeste",
        1,
        String(existH).padStart(2, "0")
      );
      const minuInputModoTeste = entradatempo(
        "MModoTeste",
        0,
        String(existM).padStart(2, "0")
      );
      horaInputModoTeste.style.marginRight = "4px";

      function salvarHorarioModoTeste() {
        const hora =
          parseInt(horaInputModoTeste.value) || parseInt(existH) || 0;
        const minuto =
          parseInt(minuInputModoTeste.value) || parseInt(existM) || 0;
        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");
        const segundos = "00";
        const horarioFormatado = `${signMatch}${horaFormatada}:${minutoFormatado}:${segundos}`;
        // salva em ambas propriedades para manter compatibilidade
        VariavelmodoTeste.hora = horarioFormatado;
        VariavelmodoTeste.fuso = horarioFormatado;
        SalvandoVari(1);
      }

      const salvarBot = criarBotSalv(35, "Salvar");
      salvarBot.addEventListener("click", function () {
        VariavelmodoTeste.data =
          dateInput.value || VariavelmodoTeste.data || "";
        salvarHorarioModoTeste();
        // garante que CConfig.modoTeste siga o toggle
        CConfig.modoTeste = CConfig.modoTeste ? 1 : 0;
        AtualizarConf();
      });

      const toggle = criarBotaoSlide2(34, () => {
        CConfig.modoTeste = !CConfig.modoTeste;
        if (CConfig.modoTeste) {
          // quando ativar, preenche inputs com valores atuais se vazio
          if (!dateInput.value && VariavelmodoTeste.data)
            dateInput.value = VariavelmodoTeste.data;
          const raw =
            VariavelmodoTeste.hora || VariavelmodoTeste.fuso || "+00:00:00";
          const sign = /^[+-]/.test(raw) ? raw[0] : "";
          const parts = sign ? raw.slice(1) : raw;
          const [hh = "00", mm = "00"] = parts.split(":");
          if (!horaInputModoTeste.value)
            horaInputModoTeste.value = String(hh).padStart(2, "0");
          if (!minuInputModoTeste.value)
            minuInputModoTeste.value = String(mm).padStart(2, "0");
        }
        SalvandoVari(1);
        AtualizarConf();
      });

      // Atualiza VariavelmodoTeste quando inputs mudam
      dateInput.addEventListener("change", () => {
        VariavelmodoTeste.data = dateInput.value;
        SalvandoVari(1);
      });
      horaInputModoTeste.addEventListener("input", () => {
        salvarHorarioModoTeste();
      });
      minuInputModoTeste.addEventListener("input", () => {
        salvarHorarioModoTeste();
      });

      // monta a linha com inputs separados e o botão salvar
      linha.append(
        horaInputModoTeste,
        doispontos(),
        minuInputModoTeste,
        salvarBot
      );
      area.appendChild(dateInput);
      area.appendChild(linha);
      area.appendChild(toggle);

      const a = CaixaDeOcultar(c1riarBotSalv(34, "Modo Teste"), area);
      return a;
    }

    function criarSeparador() {
      const separador = document.createElement("div");
      separador.style.cssText = `
            width: 100%;
            margin: 8px 0px;
            outline: 1px dashed white;
            `;
      return separador;
    }

    function caixaDeCor() {
      const c1aixaDeCor = criarCaixaSeg();
      c1aixaDeCor.id = "c1aixaDeCor";
      c1aixaDeCor.append(
        LinhaSelCor(7, "Principal", Ccor.Principal),
        LinhaSelCor(8, "Atualizando", Ccor.Atualizando),
        LinhaSelCor(9, "Meta TMA", Ccor.MetaTMA),
        LinhaSelCor(10, "Erro", Ccor.Erro),
        LinhaSelCor(11, "Offline", Ccor.Offline),
        LinhaSelCor(12, "Config", Ccor.Config)
      );

      const a = CaixaDeOcultar(criarBotSalv(25, "Cores"), c1aixaDeCor);
      return a;
    }

    const CIgOffline = criarCaixaSeg();
    const IgOffline = criarLinhaTextoComBot(16, "Ignorar Offline");
    CIgOffline.append(IgOffline);

    const CIgTMA = criarCaixaSeg();
    const IgTMA = criarLinhaTextoComBot(19, "Ignorar TMA");
    CIgTMA.append(IgTMA);

    const CIgErro = criarCaixaSeg();
    const IgErro = criarLinhaTextoComBot(20, "Ignorar Erro Nice");
    CIgErro.append(IgErro);

    const IgEst = criarLinhaTextoComBot(22, "Notificar Estouro");
    const IgEstSom = criarLinhaTextoComBot(23, "Som");

    function c1riarBotSalv(a, b) {
      const c = criarBotSalv(a, b);
      c.style.cssText = `
            padding: 2px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 12px;
            height: 22px;
            `;
      return c;
    }

    function Cbotavan() {
      const CBancDa = criarCaixaSeg();
      CBancDa.id = "CBancDa";

      const BBancDa = c1riarBotSalv(31, "Banco de Dados");
      BBancDa.addEventListener("click", function () {
        if (CBancDa.innerHTML === "") {
          listarChavesEConteudos(); // Preenche o conteúdo
        } else {
          CBancDa.innerHTML = ""; // Limpa o conteúdo
        }
      });

      const CBBancDa = criarCaixaSeg();
      CBBancDa.append(BBancDa);
      CBBancDa.append(CBancDa);

      const C2ValoresEnc = criarCaixaSeg();
      C2ValoresEnc.style.alignItems = "center";

      const tValoresEnc = c1riarBotSalv(30, "Valores Encontrados");
      tValoresEnc.addEventListener("click", function () {
        if (C2ValoresEnc.innerHTML === "") {
          C2ValoresEnc.innerHTML = `
        <div>Disponivel = ${Htime.Disponivel}</div>
        <div>Trabalhando = ${Htime.Trabalhando}</div>
        <div>Indisponivel = ${Htime.Indisponivel}</div>
        <div>Atendidas = ${stt.vAtendidas}</div>
        `;
        } else {
          C2ValoresEnc.innerHTML = ""; // Limpa o conteúdo
        }
      });

      const CValoresEnc = criarCaixaSeg();
      //CValoresEnc.append(tValoresEnc);
      CValoresEnc.append(C2ValoresEnc);

      const BotaoResetT = c1riarBotSalv(15, "Restaurar Config");
      BotaoResetT.addEventListener("click", function () {
        caixa.appendChild(
          ADDCaixaDAviso("Restaurar Config", () => {
            SalvandoVari(2);
            iniciarBusca();
          })
        );
      });

      const caixaDeBotres = criarCaixaSeg();
      caixaDeBotres.append(BotaoResetT);

      const Cavancado = criarCaixaSeg();
      Cavancado.id = "Cavancado";
      Cavancado.style.padding = "0px 8px";
      Cavancado.append(
        criarSeparador(),
        CBBancDa,
        criarSeparador(),
        ContModoTeste(),
        criarSeparador(),
        CValoresEnc,
        criarSeparador(),
        caixaDeBotres
      );

      const a = CaixaDeOcultar(criarBotSalv(21, "Avançado"), Cavancado);

      a.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 90%;
      background: #ff000a3d;
      border-radius: 10px;
      `;
      return a;
    }

    function Faixa() {
      const b = criarCaixaSeg();
      b.id = "ContFaixa";

      const fixar = criarLinhaTextoComBot(18, "Faixar Valor");

      const ocultar = document.createElement("div");
      ocultar.textContent = "Ocultar em ";

      const c = criarCaixaSeg();
      c.id = "C2ontFaixa";
      c.style.flexDirection = "";
      c.style.justifyContent = "space-between";

      const InputMin = document.createElement("input");
      InputMin.className = "placeholderPerso";
      InputMin.placeholder = CConfig.tempoPOcul;
      InputMin.type = "number";
      InputMin.min = "3";
      InputMin.max = "99";
      InputMin.style.cssText = `
        width: 40px;
        height: 16px;
        color: white;
        background: #ffffff00;
        border: solid 1px white;
        margin: 0px 3px;
        `;
      InputMin.addEventListener("input", function () {
        CConfig.tempoPOcul = InputMin.value || InputMin.min;
      });

      c.append(ocultar);
      c.append(InputMin);
      const d = criarBotaoSlide2(33, () => {
        CConfig.temOcul = !CConfig.temOcul;
        if (CConfig.temOcul) CConfig.FaixaFixa = 0;
        AtualizarConf();
      });
      const text = document.createElement("div");
      text.textContent = "seg";
      c.append(text);
      c.append(d);

      b.append(fixar);
      b.append(c);

      const a = CaixaDeOcultar(criarBotSalv(32, "Faixa"), b);

      return a;
    }

    caixa.append(
      //caixaDeCor(),
      //criarSeparador(),
      //Faixa(),
      //criarSeparador(),
      //CIgOffline,
      //CIgTMA,
      //CIgErro,

      //criarSeparador(),
      ContTempEsc()
      // criarSeparador(),
      // ContlogueManual(),

      //criarSeparador(),
      // Cbotavan()
    );

    //document.body.appendChild(caixa);

    // Função auxiliar para criar linha com texto e bolinha
    function criarLinhaTextoComBot(idbola, texto) {
      const linha = document.createElement("div");
      linha.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin: 3px 0px;
            `;

      const textoDiv = document.createElement("div");
      textoDiv.textContent = texto;

      const botao = criarBotaoSlide(idbola);

      linha.append(textoDiv, botao);
      return linha;
    }

    function LinhaSelCor(a, b, c) {
      const div1 = document.createElement("div");
      div1.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 5px;
            `;

      const inputCor = document.createElement("input");
      inputCor.id = `cor${a}`;
      inputCor.type = "color";
      inputCor.value = c; // Corrigido aqui

      inputCor.style.cssText = `
            height: 20px;
            width: 20px;
            padding: 0px;
            border: none;
            background: none;
            cursor: pointer;
             `;

      const textoDiv = document.createElement("div");
      textoDiv.textContent = b;

      const botao = criarBotSalv(a, "Aplicar");

      botao.addEventListener("click", function () {
        Ccor.Varian = inputCor.value;
        copiarTexto(Ccor.Varian);
        AtualizarConf(a);
        ControleFront();
        SalvandoVari(1);
      });

      div1.append(inputCor, textoDiv, botao);
      return div1;
    }

    return caixa;
  }

  /**
   * StyleSlide - injeta CSS para buttons sliders na página (executa uma única vez)
   * Define estilos para:
   * - .slider-button27: dimensões e transição da barra
   * - .slider-circle: círculo que se move ao clicar
   * - .slider-button27.active: cor ativa
   */
  function StyleSlide() {
    if (!document.getElementById("estilo-slide")) {
      const elementoEstilo = document.createElement("style");
      elementoEstilo.id = "estilo-slide";
      elementoEstilo.textContent = `
          .slider-button27 {
            position: relative;
            width: 26px;
            height: 14px;
            background-color: #ccc;
            border-radius: 15px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .slider-circle {
            position: absolute;
            top: 1px;
            left: 1px;
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.3s ease;
          }

          .slider-button27.active {
            background-color: ${Ccor.Principal};
          }

          .slider-button27.active .slider-circle {
            transform: translateX(12px);
          }

          .status {
            margin-left: 10px;
            font-size: 16px;
          }

          .toggle-container {
            display: flex;
            align-items: center;
          }
        `;
      const elementoHead = document.getElementsByTagName("head")[0];
      elementoHead.appendChild(elementoEstilo);
    }
  }

  /**
   * criarBotaoSlide - cria um botão slider que dispara modo de AtualizarConf
   * @param {number} IdBot - id único do slider (modo a chamar em AtualizarConf)
   * @returns {HTMLElement} container do toggle criado
   */
  function criarBotaoSlide(IdBot) {
    // Adiciona estilos apenas uma vez
    StyleSlide();

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const slider = document.createElement("div");
    slider.className = "slider-button27";
    slider.id = `Bot${IdBot}`;

    const circle = document.createElement("div");
    circle.className = "slider-circle";

    slider.appendChild(circle);
    toggleContainer.appendChild(slider);

    slider.addEventListener("click", () => {
      AtualizarConf(IdBot);
    });

    return toggleContainer;
  }

  function as() {
    const caixa = document.getElementById("BConfig");
    if (!caixa) {
      console.log("retornado");
      return;
    }

    caixa.addEventListener("click", function () {
      const a = document.getElementById("minhaCaixa");
      if (!a) return;

      const novoElemento = criarC(); // Cria apenas uma vez

      const b = document.getElementById("CaixaConfig");
      if (b) {
        b.remove();
      } else {
        if (a.children.length >= 2) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
      }
    });
  }

  as();
})();
