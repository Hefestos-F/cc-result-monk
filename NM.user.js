// ==UserScript==
// @name         Nice_Monkey_NM
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      4.3.7.6
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://cxagent.nicecxone.com/home*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/NM.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/NM.user.js
// @grant        none

// ==/UserScript==

(function () {
  "use strict";

  /**
   * CConfig - Configurações em tempo de execução
   * - Valores podem ser alterados e salvos no indexedDB.
   * - Descrever cada propriedade ajuda na manutenção do código.
   */
  const CConfig = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    ValorLogueManual: "12:00:00", // Valor utilizado quando LogueManual ativo
    LogueManual: 0, // Flag para usar logue manual (0|1)
    // Controle de logs: 'error'|'warn'|'info'|'debug' (mais verboso)
    LogLevel: "info",
    ValorMetaTMA: 725, // Meta de TMA (em segundos)
    ModoSalvo: 1, // Modo de cálculos salvo (0|1)
    Vigia: 1, // Monitoramento ativo
    MetaTMA: 1, // Ativa verificação de meta de TMA
    ValorAuto: 10, // Intervalo automático em minutos
    AutoAtivo: 0, // Auto atualização ativa
    TolerOff: 40, // Tolerância de offline (em segundos)
    MostraOff: 0, // Mostrar indicador de offline
    IgnorarOff: 0, // Ignorar offline nas verificações
    MostraValorOff: 0, // Mostrar valores incluindo offline
    FaixaFixa: 0, // Fixar faixa de exibição
    IgnorarTMA: 0, // Ignorar cálculo de TMA
    IgnorarErroNice: 0, // Ignorar erros da Nice
    Estouro: 1, // Notificar estouro de pausa
    SomEstouro: 1, // Tocar som em estouro
    temOcul: 0, // Flag de ocultação temporária
    tempoPOcul: 8, // Tempo (s) antes da ocultação
    modoTeste: 0, // Modo de teste (0|1)
    logueEntreDatas: 0, // Se o inicio do logue foi ontem (0|1)
  };

  const VariavelmodoTeste = {
    fuso: "00:00:00", // Offset (deslocamento) em relação à hora atual (ex: +02:30:00, -01:15:00)
    data: "2024-01-15", // Data fixa para modo de teste (YYYY-MM-DD) ou vazio para hoje
  };

  /**
   * PCConfig - Configuração padrão (backup para restaurar)
   */
  const PCConfig = {
    TempoEscaladoHoras: "06:20:00",
    ValorLogueManual: "12:00:00",
    ValorMetaTMA: 725,
    ModoSalvo: 1,
    Vigia: 1,
    MetaTMA: 1,
    ValorAuto: 10,
    AutoAtivo: 0,
    TolerOff: 40,
    MostraOff: 0,
    IgnorarOff: 0,
    MostraValorOff: 0,
    FaixaFixa: 0,
    IgnorarTMA: 0,
    IgnorarErroNice: 0,
    Estouro: 1,
    SomEstouro: 1,
    temOcul: 0,
    tempoPOcul: 8,
    LogLevel: "info",
  };

  // Logger runtime que respeita CConfig.LogLevel (checa dinamicamente e permite atualização em runtime)
  (function setupLogger() {
    try {
      const levels = { error: 0, warn: 1, info: 2, debug: 3 };
      // garante que exista uma configuração padrão
      if (!CConfig.LogLevel) CConfig.LogLevel = "info";

      function allowed(method) {
        // lê o nível atual dinamicamente (permite mudar em runtime via CConfig.LogLevel)
        const currentLevel =
          CConfig && CConfig.LogLevel && CConfig.LogLevel in levels
            ? CConfig.LogLevel
            : "info";
        const methodLevel =
          method === "log" || method === "info" ? "info" : method;
        return levels[methodLevel] <= levels[currentLevel];
      }

      ["error", "warn", "info", "log", "debug"].forEach((m) => {
        const orig = console[m] ? console[m].bind(console) : () => {};
        console[m] = function (...args) {
          if (allowed(m)) {
            orig(...args);
          }
        };
      });

      // função global para atualizar o nível de logs em runtime
      /**
       * AtualizarLogLevel - atualiza o nível de log em runtime
       * @param {string} novoNivel - 'error'|'warn'|'info'|'debug'
       * @returns {boolean} true se atualizado
       */
      window.AtualizarLogLevel = function (novoNivel) {
        if (!novoNivel) return false;
        if (novoNivel in levels) {
          CConfig.LogLevel = novoNivel;
          console.info("NiceMonk LogLevel atualizado para:", novoNivel);
          return true;
        }
        console.warn("NiceMonk AtualizarLogLevel: nível inválido", novoNivel);
        return false;
      };
    } catch (e) {
      // se algo falhar ao definir logger, não bloqueia o script
      console.error("NiceMonk falha ao inicializar logger:", e);
    }
  })();

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
   * PCcor - Cores padrão (backup)
   */
  const PCcor = {
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
   * Segun - Estatísticas/contadores em segundos e tempos
   * - Mantém os valores calculados de disponibilidade, trabalhando, etc.
   */
  const Segun = {
    Disponivel: 0,
    Trabalhando: 0,
    TrabalhandoA: 0,
    Indisponivel: 0,
    ContAtual: 0,
    Hora: "",
    Logou: "",
    UltimaSomaDTI: 0,
    LogouSalvo: 0,
    NewLogado: 0,
    Offline: 0,
    QualLogou: 0,
  };

  /**
   * stt - Estado interno do script (flags e contadores de controle)
   * - Usado para controlar comportamento visual e loops de atualização.
   */
  const stt = {
    vAtendidas: "",
    vAtendidasA: 0,
    Atualizando: 0,
    LoopAA: 0, // Atualizar auto Ativo
    AbaConfig: 0,
    AbaPausas: 0,
    NBT: 0,
    DentrodCC2: "",
    DentrodCC1: "",
    DentrodcCC: "",
    DentrodMC: "",
    offForaDToler: 0,
    ErroVerif: 0,
    ErroTMA: 0,
    ErroDTI: 0,
    ErroAtu: 0,
    ErroAten: 0,
    CVAtivo: "",
    StatusANT: "",
    Ndpausas: 2,
    IPausaS: "",
    FPausaS: "",
    DPausaS: "",
    Busc5s: 0,
    Busc5sTem: 5,
    Estouro: 0,
    Estour1: 0,
    intervaloBeep: 1,
    BeepRet: 0,
    logout: 1,
    observ: 1,
    temOcul: 0,
    contarSalvar: 0,
  };

  /**
   * BGround - Agrupa cores/estilos dinâmicos usados na UI
   */
  const BGround = {
    ContValores: Ccor.Principal,
    ContIcon: "",
    circuloclick: "",
    circuloclick2: "",
  };

  /**
   * Htime - Armazena strings de tempo mostradas na tela (formatadas)
   */
  const Htime = {
    Disponivel: 0,
    Trabalhando: 0,
    Indisponivel: 0,
  };

  // Chaves usadas no IndexedDB/local storage
  const ChavePausas = "DadosDePausas";
  const ChaveConfig = "Configuções";
  const ChavelogueManu = "LogueManual";
  const ChavePrimLogue = "PrimeiroLogue";
  const ChavePrimLogueOntem = "PrimeiroLogueOntem";

  // Variáveis que receberão dados recuperados do banco local (indexedDB)
  let dadosdePausas;
  let dadosSalvosConfi;
  let dadosPrimLogue;
  let dadosPrimLogueOnt;
  let dadosLogueManu;

  // Configuração do IndexedDB
  const nomeBD = "MeuBDNiceMonk";
  const StoreBD = "NiceMonk";

  /**
   * LugarJS - Seletores CSS usados para localizar elementos da UI da NiceCX
   * - Centralizar seletores facilita manutenção quando a UI mudar.
   */
  const LugarJS = {
    elementoReferencia: '[data-testid="bg-color"].MuiAppBar-root',
    Status: "#agent-state-section > div > span > div > div",

    abaRelatorio: '[role="button"][aria-label="Reporting"]',
    abaProdutividade: '[type="button"][aria-label="Produtividade"]',
    abaDesempenho: '[type="button"][aria-label="Desempenho"]',
    abaHoje: '[type="button"][aria-label="Hoje"]',

    lContAtual: "#agent-state-section > div > span > div > div > span > span",
  };

  addAoini();

  RecuperarTVariaveis();

  /**
   * ObservarItem - observa alterações no DOM e executa callback quando houver mudanças
   * @param {Function} aoMudar - função chamada sempre que ocorrer uma mutação
   */
  function ObservarItem(aoMudar) {
    const observer = new MutationObserver(() => {
      aoMudar();
      // Desconecta observer caso flag global seja desativada
      if (!stt.observ) {
        observer.disconnect();
        console.log(`NiceMonk observer Desconectado`);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * addAoini - adiciona observador inicial e dispara setup da UI quando o elemento de referência existir
   */
  function addAoini() {
    console.debug(`NiceMonk observer Iniciado`);
    ObservarItem(() => {
      const elementoReferencia = document.querySelector(
        LugarJS.elementoReferencia
      );
      // Verifica se o elemento de referência existe e se os componentes já não foram criados
      if (
        elementoReferencia &&
        !document.getElementById("minhaCaixa") &&
        !document.getElementById("circuloclickCont")
      ) {
        AdicionarCaixaAtualizada();
        addcirculo();
        stt.NBT = 1;
        stt.observ = 0;
        stt.logout = 0;
        iniciarBusca();
        console.log(`NiceMonk verificação Inicial Verdadeiro`);
      } else {
        console.log(`NiceMonk verificação Inicial Falso`);
      }
    });
  }

  /**
   * RecuperarTVariaveis - recupera as variáveis persistidas do indexedDB
   * - Tenta recuperar vários conjuntos de dados e registra erros quando ocorrerem
   */
  async function RecuperarTVariaveis() {
    try {
      dadosdePausas = await RecDadosindexdb(ChavePausas);
      console.debug("NiceMonk Encontrados em dadosdePausas:", dadosdePausas);
    } catch (e) {
      console.error("NiceMonk Erro ao recuperar dadosdePausas:", e);
    }

    try {
      dadosSalvosConfi = await RecDadosindexdb(ChaveConfig);
      console.debug(
        "NiceMonk Encontrados em dadosSalvosConfi:",
        dadosSalvosConfi
      );
    } catch (e) {
      console.error("NiceMonk Erro ao recuperar dadosSalvosConfi:", e);
    }

    try {
      dadosPrimLogue = await RecDadosindexdb(ChavePrimLogue);
      console.debug("NiceMonk Encontrados em dadosPrimLogue:", dadosPrimLogue);
    } catch (e) {
      console.error("NiceMonk Erro ao recuperar dadosPrimLogue:", e);
    }

    try {
      dadosLogueManu = await RecDadosindexdb(ChavelogueManu);
      console.debug("NiceMonk Encontrados em dadosLogueManu:", dadosLogueManu);
    } catch (e) {
      console.error("NiceMonk Erro ao recuperar dadosLogueManu:", e);
    }

    try {
      dadosPrimLogueOnt = await RecDadosindexdb(ChavePrimLogueOntem);
      console.debug(
        "NiceMonk Encontrados em dadosPrimLogueOnt:",
        dadosPrimLogueOnt
      );
    } catch (e) {
      console.error("NiceMonk Erro ao recuperar dadosPrimLogueOnt:", e);
    }

    // Aplica configurações recuperadas e inicializa estruturas
    await SalvandoVari(3);
    await SalvarLogueManual(0);
    await salvarDPausas();
  }

  function atualizarAuto() {
    if (!stt.LoopAA && CConfig.AutoAtivo) {
      stt.LoopAA = 1;
      setTimeout(function () {
        iniciarBusca();
        stt.LoopAA = 0;
        atualizarAuto();
      }, CConfig.ValorAuto * 60000);
    }
  }

  /**
   * criarCaixaDCv - cria um elemento de exibição de valor com título
   * @param {string} n - prefixo/id do elemento
   * @param {string} titulo - texto do título exibido
   * @returns {HTMLElement} div formatada
   */
  function criarCaixaDCv(n, titulo) {
    const caixa = document.createElement("div");
    caixa.classList.add("info-caixa");
    caixa.style.transition = "all 0.5s ease";
    caixa.id = `${n}${titulo}`;
    caixa.innerHTML = `
        <div id="t${titulo}">${titulo}:</div>
        <div id="v${titulo}">...</div>
        `;

    return caixa;
  }

  /**
   * criarSeparadorCV - cria um separador visual entre os valores
   * @param {number} x - índice usado para id do elemento
   * @returns {HTMLElement}
   */
  function criarSeparadorCV(x) {
    const separador = document.createElement("div");
    separador.setAttribute("id", `SepCVal${x}`);
    separador.classList.add("separadorC");
    return separador;
  }

  /**
   * AdicionarCaixaAtualizada - cria e injeta o painel principal na página
   * - Cria o layout principal com indicadores (Logou, Logado, TMA, Falta, Saida)
   */
  function AdicionarCaixaAtualizada() {
    function criarLinhaFixa(x, titulo) {
      const caixa = document.createElement("div");
      caixa.id = `c${titulo}`;
      caixa.style.cssText = `
            transition: all 0.5s ease;
            border-radius: 6px;
            padding: 0px 3px;
            display: flex;
            `;

      const caixa2 = document.createElement("div");
      caixa2.id = `t${titulo}`;
      caixa2.style.marginRight = "6px";
      caixa2.textContent = `${titulo}:`;

      const caixa3 = document.createElement("div");
      caixa3.id = `v${titulo}`;
      caixa3.textContent = "...";

      if (x) {
        const botao = criarBotaoSlide(14);
        botao.style.marginRight = "6px";
        caixa.appendChild(botao);
      }

      // Adiciona os elementos corretamente
      caixa.appendChild(caixa2);
      caixa.appendChild(caixa3);

      return caixa;
    }

    // Função para criar a classe dinamicamente
    function criarClasse() {
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerHTML = `
            .info-caixa {
                text-align: center;
            }
            .separadorC {
                width: 1px;
                height: 25px;
                background: #ffffff;
                margin: 2px;
                transition: all 0.5s ease;
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .iconec {
                background: white;
            }
        `;
      document.getElementsByTagName("head")[0].appendChild(style);
    }

    // Cria a classe
    criarClasse();

    // Cria as caixas com as informações
    const logou = criarCaixaDCv("c", "Logou");
    const logado = criarCaixaDCv("c", "Logado");
    const tma = criarCaixaDCv("c", "TMA");
    const falta = criarCaixaDCv("c", "Falta");
    const saida = criarCaixaDCv("c", "Saida");
    const Offline = criarLinhaFixa(1, "Offline");
    Offline.style.background = Ccor.Offline;
    const Estouro = criarLinhaFixa(0, "Estouro");
    Estouro.style.background = Ccor.Erro;

    // Cria um contêiner para agrupar as caixas
    const container = document.createElement("div");
    container.setAttribute("id", "contValores");
    container.style.cssText = `
        display: flex;
        opacity: 1;
        background: ${Ccor.Principal};
        padding: 2px 5px;
        align-items: center;
        justify-content: space-evenly;
        transition: all 0.5s ease;
        border-radius: 15px;
        width: 100%;
        visibility: visible;
        `;

    // Adiciona as caixas e separadores ao contêiner
    container.appendChild(logou);
    container.appendChild(criarSeparadorCV(1));
    container.appendChild(saida);
    container.appendChild(criarSeparadorCV(2));
    container.appendChild(tma);
    container.appendChild(criarSeparadorCV(3));
    container.appendChild(logado);
    container.appendChild(criarSeparadorCV(4));
    container.appendChild(falta);

    // Cria um contêiner principal para agrupar tudo
    const minhaCaixa = document.createElement("div");
    minhaCaixa.setAttribute("id", "minhaCaixa");
    minhaCaixa.style.cssText = `
        display: flex;
        color: white;
        flex-direction: column;
        position: absolute;
        top: 20%;
        width: 100%;
        z-index: 3;
        font-size: 12px;
        transition: all 0.5s ease;
        align-items: center;
        `;

    function linha(a) {
      const x = document.createElement("div");
      x.id = a;
      x.style.cssText = `
        display: flex;
        justify-content: center;
        visibility: hidden;
        opacity: 0;
        margin-bottom: -18px;
        visibility: hidden;
        transition: opacity 0.5s ease, margin-top 0.5s ease, margin-bottom 0.5s ease;
        `;
      return x;
    }
    // Adiciona o contêiner ao contêiner principal

    const Alinha1 = linha("Alinha1");
    const Alinha2 = linha("Alinha2");
    Alinha1.appendChild(Offline);
    Alinha2.appendChild(Estouro);
    minhaCaixa.appendChild(Alinha1);
    minhaCaixa.appendChild(Alinha2);
    minhaCaixa.appendChild(container);
    minhaCaixa.appendChild(ADDBotPa());

    // Adiciona o contêiner principal ao elemento LDCaixa
    document.body.appendChild(minhaCaixa);

    minhaCaixa.addEventListener("mouseover", function () {
      stt.DentrodMC = 1;
      ControleFront(8);
    });

    minhaCaixa.addEventListener("mouseout", function () {
      stt.DentrodMC = 0;
      ControleFront(8);
    });
  }

  function addcirculo() {
    // Verifica se o elemento existe
    let a = 1;
    if (a) {
      //${ContIcon};
      var ContIcon = document.createElement("div");
      ContIcon.setAttribute("id", "ContIcon");
      ContIcon.style.cssText = `
            height: 16px;
            width: 16px;
            border: 2px solid white;
            display: flex;
            margin: 6px;
            align-items: center;
            transform: rotate(45deg);
            justify-content: center;
            `;
      ContIcon.innerHTML = `
        <div style="display: flex; align-items: center; flex-direction: column; transform: rotate(-45deg);">
        <div class="iconec" style="
        height: 7px;
        width: 1px;
        "></div>
        <div class="iconec" style="
        height: 1px;
        width: 12px;
        margin-left: 4px;
        "></div>
        <div class="iconec" style="
        height: 4px;
        width: 1px;
        "></div>
        <div class="iconec" style="
        height: 1px;
        width: 12px;
        margin-right: 4px;
        "></div>
        <div class="iconec" style="
        height: 7px;
        width: 1px;
        "></div>
        </div>
       </div>
        `;

      // Define o estilo do circuloclick
      var circuloclick = document.createElement("div");
      circuloclick.setAttribute("id", "circuloclick");
      circuloclick.style.cssText = `
            display: flex;
            border-radius: 25px;
            height: 26px;
            width: auto;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-width: 1px;
            border-color: white;
            `;
      circuloclick.appendChild(ContIcon);

      var textCC1 = document.createElement("div");
      textCC1.setAttribute("id", "textCC1");
      textCC1.style.cssText = `
            margin-right: 5px;
            opacity: 0;
            display: none;
            transition: 0.5s;
            color: white;
            `;
      circuloclick.appendChild(textCC1);

      // Define o estilo do circuloclick2
      var circuloclick2 = document.createElement("div");
      circuloclick2.setAttribute("id", "circuloclick2");
      circuloclick2.style.cssText = `
            text-align: center;
            padding: 4px;
            display: flex;
            opacity: 0;
            align-items: center;
            width: 24px;
            height: 24px;
            justify-content: center;
            cursor: pointer;
            border: 1px solid white;
            transition: margin-right 0.5s, margin-left 0.5s, opacity 0.5s;
            margin-left: -25px;
            margin-right: 30px;
            visibility: hidden;
            transform: rotate(45deg);
            color: white;
            `;

      var textCC2 = document.createElement("div");
      textCC2.setAttribute("id", "textCC2");
      textCC2.style.transform = "rotate(-45deg)";
      circuloclick2.appendChild(textCC2);

      // Define o estilo do circuloclickCont
      var circuloclickCont = document.createElement("div");
      circuloclickCont.setAttribute("id", "circuloclickCont");
      circuloclickCont.style.cssText = `
            position: absolute;
            font-size: 12px;
            z-index: 1;
            display: flex;
            align-items: center;
            left: 10px;
            top: 3px;
            background: rgb(0, 124, 190);
            border-radius: 10%;
            min-height: 50px;
            min-width: 65px;
            padding: 0px 8px;
            color: #ffffff;
            `;

      circuloclickCont.appendChild(circuloclick2);
      circuloclickCont.appendChild(circuloclick);

      //const pai = elementoReferencia2.parentNode;
      //pai.insertBefore(circuloclickCont, pai.firstChild);

      document.body.appendChild(circuloclickCont);

      // Adiciona o evento de mouseover ao circuloclick
      circuloclick.addEventListener("mouseover", function () {
        stt.DentrodCC1 = 1;
        ControleFront(4);
      });

      // Adiciona o evento de mouseout ao circuloclick
      circuloclick.addEventListener("mouseout", function () {
        stt.DentrodCC1 = 0;
        ControleFront(4);
      });

      // Adiciona o evento de mouseover ao circuloclick2
      circuloclick2.addEventListener("mouseover", function () {
        stt.DentrodCC2 = 1;
        ControleFront(5);
      });

      // Adiciona o evento de mouseout ao circuloclick2
      circuloclick2.addEventListener("mouseout", function () {
        stt.DentrodCC2 = 0;
        ControleFront(5);
      });

      // Adiciona o evento de mouseover ao circuloclickCont
      circuloclickCont.addEventListener("mouseover", function () {
        stt.DentrodcCC = 1;
        ControleFront(3);
      });

      // Adiciona o evento de mouseout ao circuloclickCont
      circuloclickCont.addEventListener("mouseout", function () {
        stt.DentrodcCC = 0;
        ControleFront(3);
      });

      circuloclick.addEventListener("click", function () {
        iniciarBusca();
      });

      circuloclick2.addEventListener("click", function () {
        AtualizarConf(15);
      });
    } else {
      console.error("NiceMonk Elemento não encontrado. Verifique o seletor.");
    }
  }

  // Converte segundos (number) ou string ("HH:MM:SS"/"MM:SS"/"SS") para uma string formatada "MM:SS" ou "HH:MM:SS"

  function converterParaTempo(input) {
    if (input == null) return "00:00";
    // aceita número (segundos) ou string ("HH:MM:SS" / "MM:SS" / "SS")
    let total = Number(input);
    if (Number.isNaN(total)) {
      if (typeof input === "string" && input.includes(":")) {
        const parts = input.split(":").map((p) => Number(p.trim()));
        if (parts.length === 3)
          total = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) total = parts[0] * 60 + parts[1];
        else total = 0;
      } else {
        total = 0;
      }
    }
    total = Math.max(0, Math.floor(total));
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;
    if (horas > 0) {
      return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
        2,
        "0"
      )}:${String(segundos).padStart(2, "0")}`;
    }
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(
      2,
      "0"
    )}`;
  }

  /**
   * clicarElementoQuerySelector - tenta clicar em um elemento usando seletor CSS
   * @param {string} selector - seletor CSS do elemento
   * @returns {Promise<boolean>} true se elemento foi encontrado e clicado
   */
  async function clicarElementoQuerySelector(selector) {
    try {
      const elemento = document.querySelector(selector);
      if (elemento) {
        elemento.click();
        return true;
      }
      return false;
    } catch (err) {
      console.error("NiceMonk Erro ao clicar elemento:", err);
      return false;
    }
  }

  /**
   * caminhoInfo - navega pelas abas para acessar informações
   * @param {number} abaTipo - tipo de aba (0=Produtividade, 1=Desempenho)
   * @returns {Promise<boolean>} true se navegação bem-sucedida
   */
  async function caminhoInfo(abaTipo) {
    if (await seExiste(LugarJS.abaRelatorio)) {
      await clicarElementoQuerySelector(LugarJS.abaRelatorio);
      if (!abaTipo) {
        if (await seExiste(LugarJS.abaProdutividade)) {
          await clicarElementoQuerySelector(LugarJS.abaProdutividade);
        } else {
          console.error(
            "NiceMonk Erro ao clicar no último elemento: abaProdutividade"
          );
          return false;
        }
      } else {
        if (await seExiste(LugarJS.abaDesempenho)) {
          await clicarElementoQuerySelector(LugarJS.abaDesempenho);
        } else {
          console.error(
            "NiceMonk Erro ao clicar no último elemento: abaDesempenho"
          );
          return false;
        }
      }
      if (await seExiste(LugarJS.abaHoje)) {
        if (await clicarElementoQuerySelector(LugarJS.abaHoje)) {
          return true;
        }
      } else {
        console.error("NiceMonk Erro ao clicar no último elemento: abaHoje");
        return false;
      }
    } else {
      console.error(
        "NiceMonk Erro ao clicar no primeiro elemento: abaRelatorio"
      );
      return false;
    }
  }

  /**
   * seExiste - verifica se elemento existe com polling (até 5 segundos)
   * @param {string} seletor - seletor CSS do elemento
   * @returns {Promise<boolean>} true se elemento encontrado
   */
  function seExiste(seletor) {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50; // Tentativas máximas (5 segundos / 100ms por tentativa)
      let tentativas = 0;
      const intervalo = setInterval(function () {
        const elemento = document.querySelector(seletor);
        const nomeElemento = Object.keys(LugarJS).filter(
          (chave) => LugarJS[chave] === seletor
        );

        if (elemento) {
          clearInterval(intervalo);
          resolve(true);
        } else {
          tentativas++;
          if (tentativas >= maxAttempts) {
            clearInterval(intervalo);
            console.error(
              `NiceMonk Elemento de referência não encontrado: ${nomeElemento}`
            );
            resolve(false);
          }
        }
      }, 50); // Tenta a cada 50ms
    });
  }

  /**
   * seExiste3 - aguarda atualização de atendidas ou tempos com observer de mutações
   * @param {number} objeto - 1 para atendidas, 0 para tempos
   * @returns {Promise<boolean>} true se dados foram encontrados/atualizados
   */
  function seExiste3(objeto) {
    console.log("NiceMonk seExiste3 iniciado.");
    return new Promise((resolve) => {
      let resultado = false;

      const observer = new MutationObserver(() => {
        const retorno = objeto ? AtuAtendidas() : AtualizarDTI2();

        let nomeObjeto = objeto ? "Atendidas" : "Tempos";

        if (retorno === true) {
          observer.disconnect();
          console.log(`NiceMonk seExiste3 ${nomeObjeto} encontrado.`);
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
          console.log("NiceMonk seExiste3 nada encontrado.");
          resolve(resultado);
        }
      }, 6000);
    });
  }

  function formatTime(time) {
    // Normaliza diferentes formatos de tempo para "HH:MM:SS" (ou retorna null)
    if (!time || typeof time !== "string") {
      console.error("NiceMonk Tempo inválido.");
      return "00:00:00";
    }
    const parts = time
      .trim()
      .split(":")
      .map((p) => p.trim());
    if (parts.length === 3) {
      return parts.map((p) => p.padStart(2, "0")).join(":");
    }
    if (parts.length === 2) {
      // mm:ss -> 00:mm:ss
      const [mm, ss] = parts;
      return `00:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    }
    if (parts.length === 1 && /^\d+$/.test(parts[0])) {
      // segundos como número
      const total = Number(parts[0]);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}:${String(s).padStart(2, "0")}`;
    }
    return "00:00:00";
  }

  function converterParaSegundos(tempo) {
    // Mais tolerante: aceita "HH:MM:SS", "MM:SS" e números; retorna segundos inteiros.
    if (tempo == null || tempo === "") return 0;
    if (typeof tempo === "number") return Math.floor(tempo);
    if (typeof tempo === "string") {
      const parts = tempo
        .trim()
        .split(":")
        .map((p) => Number(p.trim()));
      if (parts.length === 3) {
        const [h, m, s] = parts;
        return (
          (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
        );
      }
      if (parts.length === 2) {
        const [m, s] = parts;
        return (Number(m) || 0) * 60 + (Number(s) || 0);
      }
      if (/^\d+$/.test(tempo.trim())) {
        return Number(tempo.trim());
      }
    }
    return 0;
  }

  async function esperar(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * AtualizarContAtual - atualiza o tempo de contagem atual
   * @returns {Promise<boolean>} true se conseguiu atualizar
   */
  async function AtualizarContAtual() {
    if (await seExiste(LugarJS.lContAtual)) {
      const tempoFormatado = formatTime(
        document.querySelector(LugarJS.lContAtual).textContent
      );
      Segun.ContAtual = converterParaSegundos(tempoFormatado);
      return true;
    } else {
      return false;
    }
  }

  /**
   * TentAtend - tenta atualizar dados de atendimentos
   * @returns {Promise<boolean>} true se houve mudança relevante
   */
  async function TentAtend() {
    stt.ErroAten = !(await AtualizarAtendidas());
    // Verifica se há novos atendimentos ou mudança no tempo trabalhando
    if (
      stt.vAtendidas <= stt.vAtendidasA &&
      Segun.Trabalhando > Segun.TrabalhandoA
    ) {
      return true;
    } else {
      stt.vAtendidasA = stt.vAtendidas;
      Segun.TrabalhandoA = Segun.Trabalhando;
      return false;
    }
  }

  /**
   * AtualizarAtendidas - navega e busca dados de atendimentos
   * @returns {Promise<boolean>} true se dados foram encontrados
   */
  async function AtualizarAtendidas() {
    const caminhoOk = await caminhoInfo(1);
    const dadosAtualizados = await seExiste3(1);
    return caminhoOk && dadosAtualizados;
  }

  /**
   * AtualizarDTI - navega e busca dados de tempos (DTI - Disponível/Trabalhando/Indisponível)
   * @returns {Promise<boolean>} true se dados foram encontrados
   */
  async function AtualizarDTI() {
    const caminhoOk = await caminhoInfo(0);
    const dadosAtualizados = await seExiste3(0);
    return caminhoOk && dadosAtualizados;
  }

  /**
   * AtuAtendidas - busca valor de atendimentos na tabela (próximo a "Geral")
   * @returns {boolean} true se conseguiu atualizar stt.vAtendidas
   */
  function AtuAtendidas() {
    let encontrou = false;

    // Seleciona todas as linhas da tabela
    const linhas = document.querySelectorAll("tbody tr");

    let jaEncontrado = 0;
    linhas.forEach((linha) => {
      const celulas = linha.querySelectorAll("td");
      celulas.forEach((celula) => {
        const geralEl = celula.querySelector('[aria-label="Geral"]');
        if (geralEl) {
          // Encontrou a célula com "Geral"
          const valores = linha.querySelectorAll("[aria-label]");
          valores.forEach((valorEl) => {
            const texto = valorEl.getAttribute("aria-label");

            if (!jaEncontrado && texto && texto !== "Geral") {
              jaEncontrado = 1;
              stt.vAtendidas = texto;
              console.log(`NiceMonk Valor ao lado de "Geral": ${texto}`);
              encontrou = true;
            }
          });
        }
      });
    });

    if (!encontrou) {
      console.warn('NiceMonk Valor ao lado de "Geral" não encontrado.');
    }

    return encontrou;
  }

  /**
   * AtualizarDTI2 - extrai tempos dos ícones de status (Disponível/Trabalhando/Indisponível)
   * @returns {boolean} true se conseguiu encontrar pelo menos um tempo
   */
  function AtualizarDTI2() {
    const iconesStatus = {
      availableStatusIconId: "Disponível",
      workingDefaultIconId: "Trabalhando",
      unavailableStatusIconId: "Indisponível",
    };

    const resultados = {};

    Object.entries(iconesStatus).forEach(([idIcone, nomeStatus]) => {
      const icon = document.getElementById(idIcone);
      if (!icon) return;

      // Sobe até o bloco principal do status
      const blocoStatus = icon.closest('div[class*="MuiBox-root"]');
      if (!blocoStatus) return;

      // Procura o tempo dentro do mesmo bloco
      let tempoEncontrado = null;

      // Verifica se há algum tempo no formato HH:MM:SS ou HHH:MM:SS
      blocoStatus.querySelectorAll("p").forEach((pElemento) => {
        const texto = pElemento.textContent.trim();
        if (/^\d{2,3}:\d{2}:\d{2}$/.test(texto)) {
          tempoEncontrado = texto;
        }
      });

      if (tempoEncontrado) {
        resultados[nomeStatus] = tempoEncontrado;
        console.log(
          `NiceMonk Status: ${nomeStatus} → Tempo: ${tempoEncontrado}`
        );
        if (nomeStatus === "Disponível") {
          Htime.Disponivel = tempoEncontrado;
          Segun.Disponivel = converterParaSegundos(Htime.Disponivel);
        } else if (nomeStatus === "Trabalhando") {
          Htime.Trabalhando = tempoEncontrado;
          Segun.Trabalhando = converterParaSegundos(Htime.Trabalhando);
        } else if (nomeStatus === "Indisponível") {
          Htime.Indisponivel = tempoEncontrado;
          Segun.Indisponivel = converterParaSegundos(Htime.Indisponivel);
        }
      }
    });

    const encontrou = Object.keys(resultados).length > 0;
    if (!encontrou) {
      console.warn(
        "NiceMonk Nenhum tempo encontrado usando os IDs dos ícones."
      );
    }

    return encontrou;
  }

  /**
   * AtualizarTMA - atualiza o display de TMA (Tempo Médio de Atendimento)
   * @param {number} temErro - flag de erro (0|1)
   */
  function AtualizarTMA(temErro) {
    const elementoCaixaTMA = document.getElementById("cTMA");
    const elementoSeparador = document.getElementById("SepCVal2");
    const contValores = document.getElementById("contValores");

    // Remove TMA se deve ser ignorado
    if (CConfig.IgnorarTMA && !stt.Busc5s) {
      if (elementoCaixaTMA) {
        elementoCaixaTMA.remove();
      }
      if (elementoSeparador) {
        elementoSeparador.remove();
      }
      return;
    } else {
      const divs = contValores.querySelectorAll(":scope > div");

      if (!elementoSeparador && divs.length >= 3) {
        // adicionar após a quarta div
        const tma = criarCaixaDCv("c", "TMA");
        divs[2].insertAdjacentElement("afterend", tma);
      }

      if (!elementoCaixaTMA && divs.length >= 3) {
        // adicionar após a terceira div
        const sep = criarSeparadorCV(2);
        divs[2].insertAdjacentElement("afterend", sep);
      }
    }

    const caixaTMAAtualizada = document.getElementById("cTMA");
    if (caixaTMAAtualizada) {
      const tituloTMA = document.getElementById("tTMA");
      const valorTMA = document.getElementById("vTMA");
      let tmaCalculado =
        stt.vAtendidas === "0" ? 0 : Segun.Trabalhando / stt.vAtendidas;
      tmaCalculado = Math.floor(tmaCalculado);
      tituloTMA.innerHTML = stt.Busc5s ? "Busca" : "TMA:";
      valorTMA.innerHTML = stt.Busc5s
        ? stt.Busc5sTem
        : stt.ErroAtu || temErro
        ? "Atualize !!"
        : tmaCalculado;
      caixaTMAAtualizada.style.background =
        (tmaCalculado > CConfig.ValorMetaTMA &&
          !stt.ErroAtu &&
          CConfig.MetaTMA) ||
        stt.Busc5s
          ? Ccor.MetaTMA
          : "";
      caixaTMAAtualizada.style.borderRadius = "5px";
      caixaTMAAtualizada.style.padding = " 0px 4px";
      caixaTMAAtualizada.style.margin = "0px -4px";
    }
  }

  function mostrarHora() {
    const agora = new Date();
    const [horas1, minutos1, segundos1] = VariavelmodoTeste.fuso
      .split(":")
      .map(Number);

    let horas2, minutos2, segundos2;

    if (CConfig.modoTeste) {
      horas2 = agora.getHours() + horas1;
      minutos2 = agora.getMinutes() + minutos1;
      segundos2 = agora.getSeconds() + segundos1;

      if (horas2 > 23) horas2 = horas2 - 23;
      if (minutos2 > 59) minutos2 = minutos2 - 59;
      if (segundos2 > 59) segundos2 = segundos2 - 59;
    } else {
      horas2 = agora.getHours();
      minutos2 = agora.getMinutes();
      segundos2 = agora.getSeconds();
    }

    const horas = String(horas2).padStart(2, "0");
    const minutos = String(minutos2).padStart(2, "0");
    const segundos = String(segundos2).padStart(2, "0");

    return `${horas}:${minutos}:${segundos}`;
  }

  function gerarDataHora() {
    const agora = new Date();

    const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
    const data = agora.toISOString().split("T")[0];

    return {
      hora: hora,
      data: data,
    };
  }

  /**
   * iniciarBusca - coordena a atualização principal de todos os dados
   * - Tenta atualizar DTI (tempos), depois atendimentos e TMA
   * - Controla loops e calls ao ControleFront para UI
   */
  async function iniciarBusca() {
    ControleFront(1);

    stt.ErroDTI = 1;
    for (let a = 0; stt.ErroDTI && a < 4; a++) {
      stt.ErroDTI = !(await AtualizarDTI());
    }

    await VerificacoesN1();

    for (let b = 0; stt.ErroVerif && b < 4; b++) {
      stt.ErroDTI = !(await AtualizarDTI());
      await VerificacoesN1();
      if (stt.ErroVerif) {
        await esperar(1500);
      }
    }

    stt.ErroAtu = CConfig.IgnorarErroNice ? 0 : stt.ErroDTI || stt.ErroVerif;

    stt.ErroAten = 1;
    if (!stt.ErroDTI && !stt.ErroAtu && !CConfig.IgnorarTMA) {
      for (let c = 0; stt.ErroAten && c < 3; c++) {
        stt.ErroTMA = await TentAtend();
        for (let c = 0; stt.ErroTMA && c < 3; c++) {
          stt.ErroTMA = await TentAtend();
          await esperar(1000);
        }
      }
      if (!stt.ErroAten) {
        stt.vAtendidasA = stt.vAtendidas;
        Segun.TrabalhandoA = Segun.Trabalhando;
      }
    }
    AtualizarTMA(stt.ErroAten);

    await VerificacoesN1();

    ControleFront(2);

    if (stt.NBT) {
      stt.NBT = 0;
      verificarESalvar(0);
      setInterval(() => {
        if (!stt.Atualizando) {
          VerificacoesN1();
        }
      }, 1000);
    }
  }

  /**
   * VerificacoesN1 - verifica estado atual e atualiza display de informações
   * - Calcula tempos de logado, saída, falta, offline
   * - Controla visibilidade de offline
   */
  async function VerificacoesN1() {
    await AtualizarContAtual();

    Segun.NewLogado =
      Segun.Disponivel +
      Segun.Trabalhando +
      Segun.Indisponivel +
      Segun.ContAtual;

    if (Segun.NewLogado >= Segun.UltimaSomaDTI) {
      Segun.UltimaSomaDTI = Segun.NewLogado;
      stt.ErroVerif = 0;
    } else if (CConfig.Vigia && !stt.Atualizando && !stt.ErroVerif) {
      stt.ErroVerif = 1;
      stt.Busc5s = 1;
      ControleFront(7);
      setTimeout(function () {
        iniciarBusca();
      }, 5000);
    } else {
      stt.ErroVerif = 1;
    }

    const novo = exibirHora(
      gerarDataHora(),
      0,
      converterParaTempo(Segun.NewLogado)
    );

    Segun.Logou = converterParaSegundos(novo.valor);

    if (Segun.Logou < Segun.LogouSalvo) {
      verificarESalvar(1);
    }

    Segun.QualLogou = CConfig.LogueManual
      ? converterParaSegundos(CConfig.ValorLogueManual)
      : CConfig.ModoSalvo
      ? Segun.LogouSalvo
      : Segun.Logou;
    Segun.Offline = Segun.Logou - Segun.QualLogou;

    stt.offForaDToler =
      Segun.Offline > CConfig.TolerOff &&
      (CConfig.ModoSalvo || CConfig.LogueManual) &&
      (CConfig.Vigia || stt.Atualizando) &&
      !stt.ErroAtu &&
      !stt.ErroVerif &&
      !CConfig.IgnorarOff
        ? 1
        : 0;

    CConfig.MostraOff = stt.offForaDToler;

    if (!CConfig.MostraOff && !stt.Atualizando) {
      CConfig.MostraValorOff = 0;
    }

    AtualizarInfo();
    observarDisponibilidade();
  }

  /**
   * AtualizarInfo - calcula e atualiza os valores de exibição na UI
   * - Calcula saída, falta, logado, horas extras
   * - Atualiza display dos valores no painel principal
   */
  function AtualizarInfo() {
    const tempoEscalado = converterParaSegundos(CConfig.TempoEscaladoHoras);
    let tempoHorasExtras;
    let tempoCumprido = false;
    let temHorasExtras = false;

    let logadoSegundos = Segun.Hora - Segun.QualLogou;

    if (logadoSegundos < 0) {
      logadoSegundos += 86400;
    }

    let saidaSegundos = Segun.QualLogou + tempoEscalado;
    if (saidaSegundos > 86400) {
      saidaSegundos -= 86400;
    }
    saidaSegundos =
      !stt.offForaDToler &&
      !stt.ErroAtu &&
      !CConfig.LogueManual &&
      !CConfig.IgnorarOff &&
      !stt.ErroVerif
        ? saidaSegundos + Segun.Offline
        : saidaSegundos;
    let faltaSegundos;
    if (Segun.Hora < saidaSegundos) {
      faltaSegundos = saidaSegundos - Segun.Hora;
    } else {
      faltaSegundos = 86400 - Segun.Hora + saidaSegundos;
    }

    const saidaComOfflineSegundos = saidaSegundos + Segun.Offline;
    const faltaComOfflineSegundos = faltaSegundos + Segun.Offline;
    const dezMinutosSegundos = converterParaSegundos("00:10:00");

    const saidaAExibir = CConfig.MostraValorOff
      ? saidaComOfflineSegundos
      : saidaSegundos;
    const faltaAExibir = CConfig.MostraValorOff
      ? faltaComOfflineSegundos
      : faltaSegundos;

    if (Segun.Hora > saidaAExibir + dezMinutosSegundos) {
      temHorasExtras = true;
      tempoHorasExtras = Segun.Hora - saidaAExibir;
    } else if (Segun.Hora > saidaAExibir) {
      tempoCumprido = true;
    }

    const logouFormatado = converterParaTempo(Segun.QualLogou);
    const vLogou = document.getElementById("vLogou");
    vLogou.textContent = logouFormatado;

    const logadoExibido = CConfig.MostraValorOff
      ? Segun.NewLogado
      : logadoSegundos;
    const logadoFormatado = converterParaTempo(logadoExibido);
    const vLogado = document.getElementById("vLogado");
    vLogado.textContent = logadoFormatado;

    const saidaFormatada = converterParaTempo(saidaAExibir);
    const vSaida = document.getElementById("vSaida");
    vSaida.textContent = saidaFormatada;

    const faltaOuHE = temHorasExtras ? tempoHorasExtras : faltaAExibir;
    const faltaOuHEFormatada = converterParaTempo(faltaOuHE);
    const vFalta = document.getElementById("vFalta");
    const tFalta = document.getElementById("tFalta");
    tFalta.textContent = temHorasExtras
      ? "HE:"
      : tempoCumprido
      ? "Tempo"
      : "Falta:";
    vFalta.textContent = temHorasExtras
      ? faltaOuHEFormatada
      : tempoCumprido
      ? "Cumprido"
      : faltaOuHEFormatada;

    if (stt.Busc5s) {
      AtualizarTMA(0);
      stt.Busc5sTem = stt.Busc5sTem - 1;
      if (stt.Busc5sTem < 1) stt.Busc5s = 0;
    } else {
      stt.Busc5sTem = 5;
    }

    const offlineFormatado = converterParaTempo(Segun.Offline);
    const vOffline = document.getElementById("vOffline");
    const tOffline = document.getElementById("tOffline");
    vOffline.textContent = offlineFormatado;
    tOffline.textContent = CConfig.MostraValorOff
      ? "Com Offline :"
      : "Sem Offline :";
  }

  /**
   * temOculfun - executa função após tempo de ocultação se nenhuma aba estiver aberta
   * @param {Function} callback - função a executar
   */
  function temOculfun(callback) {
    if (stt.temOcul) return;
    stt.temOcul = 1;
    setTimeout(function () {
      if (!stt.AbaConfig && !stt.AbaPausas && !stt.DentrodMC) {
        callback();
      }
      stt.temOcul = 0;
    }, CConfig.tempoPOcul * 1000);
  }

  /**
   * ControleFront - controla a atualização visual da interface
   * Modos (a):
   *   1: iniciar atualização (animação, cores)
   *   2: atualização concluída
   *   3: circuloclickCont hover
   *   4: circuloclick hover
   *   5: circuloclick2 hover
   *   6: mostrar contValores
   *   7: ocultar contValores
   *   8: atualizar visibilidade do botão pausas
   * @param {number} a - modo de controle
   */
  function ControleFront(a) {
    const circuloclick = document.getElementById("circuloclick");
    const circuloclick2 = document.getElementById("circuloclick2");
    const contValores = document.getElementById("contValores");
    const ContIcon = document.getElementById("ContIcon");
    const textCC1 = document.getElementById("textCC1");
    const textCC2 = document.getElementById("textCC2");
    const cOffline = document.getElementById("cOffline");
    const Alinha1 = document.getElementById("Alinha1");
    const BotPa = document.getElementById("BotPa");

    function TodasCores(d) {
      var b = stt.ErroAtu ? Ccor.Erro : d;
      document.querySelectorAll(".iconec").forEach((element) => {
        element.style.backgroundColor = b;
      });
      ContIcon.style.borderColor = b;
      textCC1.style.color = b;
      circuloclick.style.borderColor = b;
      circuloclick2.style.borderColor = b;
      circuloclick2.style.color = b;
    }

    textCC1.innerHTML = stt.ErroAtu
      ? "Atualizar!!"
      : stt.Atualizando
      ? "Atualizando..."
      : a === 2
      ? "Atualizado"
      : "Atualizar";

    if (a === 1) {
      stt.Atualizando = 1;
      ContIcon.style.animation = "rotate 1s ease-in-out infinite";
      Ccor.TVarian = Ccor.Atualizando;
      BGround.circuloclick2 = "white";
      BGround.circuloclick = stt.DentrodCC1 ? "white" : "";
      BGround.ContIcon = "white";
      ControleFront(5);
      MostarcontValores(0);
    }
    if (a === 2) {
      ContIcon.style.animation = "";
      Ccor.TVarian = Ccor.Principal;
      BGround.ContValores = Ccor.Principal;
      stt.DentrodcCC = 1;
      ControleFront(4);
      AtualizarConf();
      if (!stt.ErroAtu) {
        setTimeout(function () {
          Ccor.TVarian = "white";
          BGround.circuloclick = "";
          BGround.circuloclick2 = "";
          BGround.ContIcon = "";
          circuloclick2.style.borderColor = "";
          circuloclick2.style.color = "";
          ControleFront();
        }, 1000);
      }
      if (CConfig.temOcul) {
        temOculfun(() => {
          ControleFront(7);
        });
      }
      stt.Atualizando = 0;
      MostarcontValores(1);
      stt.DentrodcCC = 0;
    }
    if (a === 3) {
      //Chamado do circuloclick cont
      Mostarcirculoclick2(stt.DentrodcCC);
      if (stt.DentrodcCC) {
        MostarcontValores(1);
      } else {
        if (CConfig.temOcul) {
          temOculfun(() => {
            MostarcontValores(0);
          });
        } else {
          if (!stt.AbaConfig && !stt.AbaPausas) MostarcontValores(0);
        }
      }
    }

    if (a === 4) {
      //Chamado do circuloclick
      textCC1.style.display = stt.DentrodCC1 ? "flex" : "none";
      textCC1.style.opacity = stt.DentrodCC1 ? "1" : "0";
      circuloclick.style.borderStyle = stt.DentrodCC1 ? "solid" : "";
      BGround.circuloclick = stt.DentrodCC1
        ? stt.ErroAtu || stt.Atualizando
          ? "white"
          : ""
        : "";
    }
    if (a === 5) {
      //Chamado do circuloclick2
      circuloclick2.style.width = stt.DentrodCC2
        ? "auto"
        : stt.AbaConfig
        ? "24px"
        : "17px";
      circuloclick2.style.height =
        stt.DentrodCC2 || stt.AbaConfig ? "24px" : "17px";
      circuloclick2.style.borderRadius =
        stt.DentrodCC2 || stt.AbaConfig ? "25px" : "";
      circuloclick2.style.transform =
        stt.DentrodCC2 || stt.AbaConfig ? "" : "rotate(45deg)";
      textCC2.style.transform =
        stt.DentrodCC2 || stt.AbaConfig ? "" : "rotate(-45deg)";
      textCC2.innerHTML = stt.DentrodCC2 ? "Config" : "C";
    }
    function Mostarcirculoclick2(x) {
      x = stt.AbaConfig ? 1 : x;
      circuloclick2.style.visibility = x ? "visible" : "hidden";
      circuloclick2.style.opacity = x ? "1" : "0";
      circuloclick2.style.marginRight = x ? "10px" : "30px";
      circuloclick2.style.marginLeft = x ? "-5px" : "-25px";
    }

    if (a === 6) {
      //Mostar contValores
      MostarcontValores(stt.DentrodcCC);
    }
    if (a === 7) {
      //Mostar contValores
      MostarcontValores(0);
    }
    if (a === 8) {
      BotPa.style.visibility =
        (stt.DentrodMC && stt.CVAtivo) || stt.AbaPausas ? "visible" : "hidden";
      BotPa.style.opacity =
        (stt.DentrodMC && stt.CVAtivo) || stt.AbaPausas ? "1" : "0";

      BotPa.style.marginTop =
        (stt.DentrodMC && stt.CVAtivo) || stt.AbaPausas ? "5px" : "-20px";
      BotPa.style.marginBottom =
        (stt.DentrodMC && stt.CVAtivo) || stt.AbaPausas
          ? "-5px"
          : !stt.AbaPausas && !stt.AbaConfig
          ? ""
          : "20px";
    }

    function MostarcontValores(x) {
      x = stt.Atualizando ? 0 : CConfig.FaixaFixa ? 1 : x;
      contValores.style.visibility = x ? "visible" : "hidden";
      contValores.style.opacity = x ? "1" : "0";
      contValores.style.marginTop = x ? "" : "-30px";
      contValores.style.marginBottom = x ? "" : "30px";
      stt.CVAtivo = x;
    }

    cOffline.style.background = Ccor.Offline;

    var vari4 =
      contValores.style.opacity === "1" && Segun.Offline > CConfig.TolerOff
        ? 1
        : 0;
    Alinha1.style.visibility =
      vari4 && CConfig.MostraOff ? "visible" : "hidden";
    Alinha1.style.opacity = vari4 && CConfig.MostraOff ? "1" : "0";
    Alinha1.style.marginBottom = vari4 && CConfig.MostraOff ? "" : "-18px";

    atualizarComoff("cSaida");
    atualizarComoff("cLogado");
    atualizarComoff("cFalta");

    function atualizarComoff(caixa) {
      var x = document.getElementById(caixa);
      if (x) {
        x.style.background = CConfig.MostraValorOff ? Ccor.Offline : "";
        x.style.borderRadius = CConfig.MostraValorOff ? "6px" : "";
        x.style.padding = CConfig.MostraValorOff ? "0px 4px" : "";
        x.style.margin = CConfig.MostraValorOff ? "0px -4px" : "";
      }
    }

    TodasCores(Ccor.TVarian);
    contValores.style.background = stt.ErroAtu
      ? Ccor.Erro
      : BGround.ContValores;
    ContIcon.style.background = BGround.ContIcon;
    circuloclick2.style.background = BGround.circuloclick2;
    circuloclick.style.background = BGround.circuloclick;

    document.querySelectorAll(".separadorC").forEach((element) => {
      element.style.width = stt.ErroAtu ? "30px" : "1px";
      element.style.height = stt.ErroAtu ? "12px" : "25px";
      element.style.margin = stt.ErroAtu ? "0px -4px" : "";
      element.style.background = CConfig.MostraOff ? Ccor.Offline : "#ffffff";
      element.style.borderRadius = stt.ErroAtu ? "5px" : "";
      element.style.fontSize = stt.ErroAtu ? "8px" : "";
      element.style.transform = stt.ErroAtu ? "rotate(-90deg)" : "";
      element.style.display = stt.ErroAtu ? "flex" : "";
      element.style.justifyContent = stt.ErroAtu ? "center" : "";
      element.style.color = CConfig.MostraOff ? "white" : Ccor.Erro;
      element.innerHTML = stt.ErroAtu ? "Erro" : "";
    });
  }

  /**
   * copiarTexto - copia texto para clipboard
   * @param {string} texto - texto a copiar
   */
  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      console.log("Texto copiado com sucesso!");
    } catch (err) {
      console.error("Erro ao copiar texto: ", err);
    }
  }

  /**
   * criarC - cria o painel de configuração da UI
   * - Inclui cores, modo de busca, modo de cálculo, TMA, tempo escalado, logue manual
   * @returns {HTMLElement} div com painel de configurações
   */
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
            margin-top: -15px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        background: ${Ccor.Config};
        transition: all 0.5s ease;
        opacity: 1;
        flex-direction: column;
        padding: 10px;
        overflow: auto;
        width: 210px;
        border: solid steelblue;
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

    function modoCalculo() {
      const recalculando = criarLinhaTextoComBot(1, "Recalculando");
      const primeiroLogue = criarLinhaTextoComBot(2, "Primeiro Logue");
      const CmodoCalculo = criarCaixaSeg();
      CmodoCalculo.id = "CmodoCalculo";
      CmodoCalculo.append(recalculando, primeiroLogue);
      const a = CaixaDeOcultar(
        c1riarBotSalv(29, "Modo de Calculo"),
        CmodoCalculo
      );
      return a;
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

    function ContTMA() {
      const a = document.createElement("div");
      a.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        `;
      const MetaTMAC = criarLinhaTextoComBot(6, "Meta TMA");
      const InputTMABot = document.createElement("div");
      InputTMABot.style.cssText = `display: flex; align-items: center;`;

      const inputTMA = document.createElement("input");
      inputTMA.className = "placeholderPerso";
      inputTMA.setAttribute("placeholder", CConfig.ValorMetaTMA);
      inputTMA.type = "number";
      inputTMA.style.cssText = `
        height: 16px;
        color: white;
        background-color: transparent;
        border: solid 1px white;
        width: 50px;
        font-size: 12px;
        `;
      const SalvarTMA = criarBotSalv(14, "Salvar");
      SalvarTMA.style.marginLeft = "5px";
      SalvarTMA.addEventListener("click", function () {
        const valorinputtma = inputTMA.value || inputTMA.placeholder;
        CConfig.ValorMetaTMA = valorinputtma;
        inputTMA.placeholder = valorinputtma;
        inputTMA.value = "";
        AtualizarTMA();
        ControleFront();
        SalvandoVari(1);
      });

      InputTMABot.append(inputTMA, SalvarTMA);
      a.append(MetaTMAC, InputTMABot);
      return a;
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

    function ContlogueManual() {
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

    function modoBusca() {
      const CmodoBusca = criarCaixaSeg();
      CmodoBusca.id = "CmodoBusca";

      const quanContZero = criarLinhaTextoComBot(3, "Automático");

      const aCada = document.createElement("div");
      aCada.style.cssText = `
        display: flex;
        align-items: center;
        margin: 3px 0px;
        justify-content: space-between;
        width: 100%;
        `;
      const aCada1 = document.createElement("div");
      aCada1.style.cssText = `
        display: flex;
        `;
      const textoACada = document.createElement("div");
      textoACada.textContent = "A Cada";
      const InputMin = document.createElement("input");
      InputMin.className = "placeholderPerso";
      InputMin.id = "InputMin";
      InputMin.placeholder = CConfig.ValorAuto;
      InputMin.type = "number";
      InputMin.min = "1";
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
        CConfig.ValorAuto = InputMin.value || 1;
        InputMin.placeholder = InputMin.value || 1;
      });
      const MostX = document.createElement("div");
      MostX.id = "InputMinX";
      MostX.textContent = "X";
      MostX.style.cssText = `margin: 0px 3px;`;

      const textoMinu = document.createElement("div");
      textoMinu.textContent = "Minutos";

      aCada1.append(textoACada, InputMin, MostX, textoMinu);
      const bolaMinu = criarBotaoSlide(4);
      aCada.append(aCada1, bolaMinu);

      const manual = criarLinhaTextoComBot(5, "Manual");

      CmodoBusca.append(quanContZero, aCada, manual);

      const a = CaixaDeOcultar(c1riarBotSalv(26, "Modo de Busca"), CmodoBusca);
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

    const CigEstDep = criarCaixaSeg();

    CigEstDep.id = "idcaixaEstouro";

    CigEstDep.append(IgEst, IgEstSom);

    const CIgEst = CaixaDeOcultar(
      criarBotSalv(24, "Estouro de Pausa"),
      CigEstDep
    );

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
      CValoresEnc.append(tValoresEnc);
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
      caixaDeCor(),
      criarSeparador(),
      Faixa(),
      criarSeparador(),
      CIgOffline,
      CIgTMA,
      CIgErro,
      criarSeparador(),
      ContTMA(),
      criarSeparador(),
      ContTempEsc(),
      criarSeparador(),
      ContlogueManual(),
      criarSeparador(),
      CIgEst,
      criarSeparador(),
      modoBusca(),
      criarSeparador(),
      modoCalculo(),
      criarSeparador(),
      Cbotavan()
    );

    document.body.appendChild(caixa);

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

  /**
   * AtualizarConf - aplica alterações de configuração e atualiza UI
   * - Controla 33+ modos diferentes de atualização de configurações e UI
   * @param {number} zz - modo de atualização (0-33+)
   */
  function AtualizarConf(zz = 0) {
    const CaixaConfig = document.getElementById("CaixaConfig");
    const InputMin = document.getElementById("InputMin");
    const InputMinX = document.getElementById("InputMinX");
    const CaiDPa = document.getElementById("CaiDPa");
    const BotPa = document.getElementById("BotPa");
    const minhaCaixa = document.getElementById("minhaCaixa");

    if (zz === 1) {
      CConfig.ModoSalvo = 0;
    }
    if (zz === 2) {
      CConfig.ModoSalvo = 1;
    }
    if (zz === 3) {
      CConfig.Vigia = 1;
      CConfig.AutoAtivo = 0;
    }
    if (zz === 4) {
      InputMin.value = CConfig.ValorAuto;
      CConfig.Vigia = 0;
      CConfig.AutoAtivo = 1;
      atualizarAuto();
      console.log("NiceMonk Valor Auto : ", CConfig.ValorAuto);
    }
    if (zz === 5) {
      CConfig.Vigia = 0;
      CConfig.AutoAtivo = 0;
    }
    if (zz === 6) {
      CConfig.MetaTMA = !CConfig.MetaTMA;
      AtualizarTMA();
    }
    if (zz === 7) {
      Ccor.Principal = Ccor.Varian;
      BGround.ContValores = Ccor.Principal;
      BotPa.style.backgroundColor = Ccor.Principal;
      document
        .querySelectorAll(".slider-button27.active")
        .forEach((element) => {
          element.style.backgroundColor = Ccor.Principal;
        });
    }
    if (zz === 8) {
      Ccor.Atualizando = Ccor.Varian;
    }
    if (zz === 9) {
      Ccor.MetaTMA = Ccor.Varian;
      AtualizarTMA();
    }
    if (zz === 10) {
      Ccor.Erro = Ccor.Varian;
    }
    if (zz === 11) {
      Ccor.Offline = Ccor.Varian;
      ControleFront();
    }
    if (zz === 12) {
      Ccor.Config = Ccor.Varian;
      CaixaConfig.style.backgroundColor = Ccor.Config;
      if (CaiDPa) CaiDPa.style.backgroundColor = Ccor.Config;
    }
    if (zz === 14) {
      CConfig.MostraValorOff = CConfig.MostraOff
        ? !CConfig.MostraValorOff
        : CConfig.MostraValorOff;
    }
    if (zz === 15) {
      stt.AbaConfig = !stt.AbaConfig;

      if (stt.AbaConfig) {
        if (stt.AbaPausas) {
          stt.AbaPausas = 0;
          if (CaiDPa) CaiDPa.remove();
        }
        minhaCaixa.appendChild(criarC());
        AtualizarConf();
      } else {
        if (CaixaConfig) CaixaConfig.remove();
      }
    }
    if (zz === 16) {
      CConfig.IgnorarOff = !CConfig.IgnorarOff;
      if (CConfig.IgnorarOff) {
        CConfig.MostraValorOff = 0;
      }
    }
    if (zz === 17) {
      stt.AbaPausas = !stt.AbaPausas;
      if (stt.AbaPausas) {
        if (stt.AbaConfig) {
          stt.AbaConfig = 0;
          CaixaConfig.remove();
        }
        minhaCaixa.appendChild(ADDCaiPausas());
        AtualizarConf();
      } else {
        CaiDPa.remove();
      }
    }
    if (zz === 18) {
      CConfig.FaixaFixa = !CConfig.FaixaFixa;

      if (CConfig.FaixaFixa) CConfig.temOcul = 0;
    }
    if (zz === 19) {
      CConfig.IgnorarTMA = !CConfig.IgnorarTMA;
      AtualizarTMA(0);
    }
    if (zz === 20) {
      CConfig.IgnorarErroNice = !CConfig.IgnorarErroNice;

      CConfig.IgnorarTMA = CConfig.IgnorarErroNice;
      CConfig.IgnorarOff = CConfig.IgnorarErroNice;
      AtualizarTMA(0);
      if (CConfig.IgnorarErroNice) {
        AtualizarConf(5);
      } else {
        AtualizarConf(3);
      }
    }
    if (zz === 22) {
      CConfig.Estouro = !CConfig.Estouro;
      if (!CConfig.Estouro) CConfig.SomEstouro = 0;
    }
    if (zz === 23) {
      if (CConfig.Estouro) {
        CConfig.SomEstouro = !CConfig.SomEstouro;
        RepetirBeep();
      } else {
        CConfig.SomEstouro = 0;
      }
    }

    ControleFront(8);
    if (InputMin) InputMin.style.display = CConfig.AutoAtivo ? "flex" : "none";
    if (InputMinX)
      InputMinX.style.display = !CConfig.AutoAtivo ? "flex" : "none";

    atualizarVisual("Bot14", CConfig.MostraValorOff);

    if (stt.AbaConfig) {
      atualizarVisual("Bot1", !CConfig.ModoSalvo);
      atualizarVisual("Bot2", CConfig.ModoSalvo);
      atualizarVisual("Bot6", CConfig.MetaTMA);
      atualizarVisual("Bot3", CConfig.Vigia);
      atualizarVisual("Bot4", CConfig.AutoAtivo);
      var vari1 = CConfig.Vigia || CConfig.AutoAtivo ? 0 : 1;
      atualizarVisual("Bot5", vari1);
      atualizarVisual("Bot13", CConfig.LogueManual);
      atualizarVisual("Bot16", CConfig.IgnorarOff);
      atualizarVisual("Bot18", CConfig.FaixaFixa);
      atualizarVisual("Bot19", CConfig.IgnorarTMA);
      atualizarVisual("Bot20", CConfig.IgnorarErroNice);
      atualizarVisual("Bot22", CConfig.Estouro);
      atualizarVisual("Bot23", CConfig.SomEstouro);
      atualizarVisual("Bot33", CConfig.temOcul);
      atualizarVisual("Bot34", CConfig.modoTeste);
    }

    if (zz > 0 && zz !== 14) {
      SalvandoVari(1);
    }
    VerificacoesN1();
    ControleFront();
  }

  /**
   * atualizarVisual - atualiza estado visual de um botão slide
   * @param {string} idBotao - id do botão (ex: "Bot14")
   * @param {boolean} estaAtivo - se botão deve estar ativo/não ativo
   */
  function atualizarVisual(idBotao, estaAtivo) {
    const elemento = document.getElementById(idBotao);
    if (!elemento) {
      return;
    }
    if (estaAtivo) {
      if (!elemento.classList.contains("active")) {
        elemento.classList.add("active");
        elemento.style.backgroundColor = Ccor.Principal;
      }
    } else {
      if (elemento.classList.contains("active")) {
        elemento.classList.remove("active");
        elemento.style.backgroundColor = "#ccc";
      }
    }
  }

  /**
   * criarBotaoSlide2 - cria um botão slider/toggle estilizado
   * @param {number} IdBot - id único do slider
   * @param {Function} funcao - callback a executar ao clicar
   * @returns {HTMLElement} container do toggle criado
   */
  function criarBotaoSlide2(IdBot, funcao) {
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
      funcao();
    });

    return toggleContainer;
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

  /**
   * observarDisponibilidade - monitora mudanças de status (Disponível, Pausa, etc)
   * Detecta pausas, calcula durações, dispara notificações de estouro
   * Gerencia estado de pausas no painel de pausas
   */
  function observarDisponibilidade() {
    const alvo = document.querySelector(LugarJS.Status);
    const CaiDPa = document.getElementById("CaiDPa");

    if (!alvo) {
      return;
    }

    const text = alvo?.textContent || "";
    const StatusNOV = text.trim().split(" ")[0];

    const tiposStatus = [
      "Lanche",
      "Descanso",
      "Particular",
      "Falha",
      "Feedback",
      "Treinamento",
      "PRE",
      "Dispon",
    ];

    // Executa verificações de status de forma assíncrona e aguarda atualizações no DB quando necessário
    (async function () {
      for (const tipo of tiposStatus) {
        await verificacaoStatus(tipo);
      }

      if (StatusNOV !== stt.StatusANT) {
        stt.StatusANT = StatusNOV;
        await atualizarID1();
      }

      VeriEstDPausa();
    })();

    /**
     * VeriEstDPausa - verifica se pausa ultrapassou limite de tempo (estouro)
     * Dispara som e exibe notificação se limite foi ultrapassado
     */
    function VeriEstDPausa() {
      let tempoLimiteFormatado = "00:00:00";
      let estaEmPausaComLimite = 0;
      let nomePausaAtual = "";

      if (StatusNOV.includes("Descanso")) {
        tempoLimiteFormatado = "00:10:00";
        nomePausaAtual = "Descanso";
        estaEmPausaComLimite = 1;
      } else if (StatusNOV.includes("Lanche")) {
        tempoLimiteFormatado = "00:20:00";
        nomePausaAtual = "Lanche";
        estaEmPausaComLimite = 1;
      }
      const tempoLimiteSegundos = converterParaSegundos(tempoLimiteFormatado);

      if (Segun.ContAtual > tempoLimiteSegundos && estaEmPausaComLimite) {
        stt.Estouro = 1;
        const tempoEstourado = Segun.ContAtual - tempoLimiteSegundos;

        if (!stt.Estour1 && CConfig.SomEstouro) {
          stt.Estour1 = 1;
          tocarBeep();
          setTimeout(function () {
            stt.intervaloBeep = 3;
            RepetirBeep();
          }, 15000);
        }

        const vEstouro = document.getElementById("vEstouro");
        const tEstouro = document.getElementById("tEstouro");
        tEstouro.textContent = `Estourou a pausa ${nomePausaAtual}:`;
        vEstouro.textContent = converterParaTempo(tempoEstourado);
        //console.log(`Estouro de Pausa ${tipo}:`, tempoEstourado);
      } else {
        stt.Estouro = 0;
        stt.Estour1 = 0;
        stt.intervaloBeep = 3;
      }

      const estaVisivel = stt.Estouro && CConfig.Estouro ? 1 : 0;
      const Alinha2 = document.getElementById("Alinha2");
      Alinha2.style.visibility = estaVisivel ? "visible" : "hidden";
      Alinha2.style.opacity = estaVisivel ? "1" : "0";
      Alinha2.style.marginBottom = estaVisivel ? "" : "-18px";
    }

    /**
     * FimdePausa - registra fim de uma pausa no banco de dados
     * @param {string} tipo - tipo de pausa (Descanso, Lanche, Dispon, etc)
     */
    async function FimdePausa(tipo) {
      stt.FPausaS = converterParaSegundos(mostrarHora());
      stt.DPausaS = stt.FPausaS - stt.IPausaS;
      const duracaoPausaFormatada = converterParaTempo(stt.DPausaS);
      const idRegistroPausa = tipo.includes("Dispon") ? 2 : stt.Ndpausas;

      if (idRegistroPausa === 2)
        console.log(
          `NiceMonk Valor de Tempo em Disponivel : Inicial ${stt.IPausaS} / Fim ${stt.FPausaS} / Duração ${stt.DPausaS}`
        );

      await atualizarCampos(idRegistroPausa, "Fim", mostrarHora());
      await atualizarCampos(idRegistroPausa, "Duracao", duracaoPausaFormatada);

      if (CaiDPa) AtuaPausas();
    }

    /**
     * verificacaoStatus - verifica se status mudou e registra nova pausa
     * @param {string} tipo - tipo de status a verificar
     */
    async function verificacaoStatus(tipo) {
      if (StatusNOV.includes(tipo)) {
        if (!stt.StatusANT.includes(tipo)) {
          stt.IPausaS = converterParaSegundos(mostrarHora());
          stt.Ndpausas = stt.Ndpausas + 1;

          const idRegistroPausa = tipo.includes("Dispon") ? 2 : stt.Ndpausas;
          const nomePausa = tipo.includes("PRE") ? "Logout" : tipo;
          let tempoLimiteFormatado = "00:00:00";
          let temPausaComLimite = 0;

          if (tipo.includes("Descanso")) {
            tempoLimiteFormatado = "00:10:00";
            temPausaComLimite = 1;
          } else if (tipo.includes("Lanche")) {
            tempoLimiteFormatado = "00:20:00";
            temPausaComLimite = 1;
          }

          const tempoLimiteSegundos =
            converterParaSegundos(tempoLimiteFormatado);
          const tempoPrevistoFim = temPausaComLimite
            ? converterParaTempo(stt.IPausaS + tempoLimiteSegundos)
            : 0;

          if (temPausaComLimite) {
            console.log(`NiceMonk o D Esta : ${tempoLimiteSegundos}`);
          }

          const notaRetorno = temPausaComLimite ? "<-Volta" : 0;
          if (stt.Ndpausas >= 100) {
            stt.Ndpausas = 2;
          }

          if (idRegistroPausa === 2) {
            await atualizarCampos(idRegistroPausa, "pausa", "Disponivel");
            await atualizarCampos(idRegistroPausa, "Inicio", mostrarHora());
            await atualizarCampos(idRegistroPausa, "Fim", 0);
          } else {
            await AddouAtualizarPausas(
              idRegistroPausa,
              nomePausa,
              mostrarHora(),
              tempoPrevistoFim,
              notaRetorno
            );
          }

          if (CaiDPa) AtuaPausas();
        }
      } else if (stt.StatusANT.includes(tipo)) {
        FimdePausa(tipo);
      }
    }
  }

  /**
   * AddTituloCp - cria um elemento título para seção na configuração
   * @param {string} titulo - texto do título
   * @returns {HTMLElement} div formatada com título
   */
  function AddTituloCp(titulo) {
    const caixa = document.createElement("div");
    caixa.innerHTML = `${titulo}`;
    caixa.style.cssText = `
        font-size: 14px;
            border-bottom-style: dashed;
            border-width: 1px;
            margin-bottom: 6px;
        `;
    return caixa;
  }

  /**
   * ADDCaiPausas - cria container para exibir tabela de pausas
   * Define 5 colunas: Excluir, Pausa, Início, Fim, Duração
   * @returns {HTMLElement} caixa container das pausas
   */
  function ADDCaiPausas() {
    const caixa = document.createElement("div");
    caixa.id = "CaiDPa";
    caixa.style.cssText = `
        background: ${Ccor.Config};
        max-height: 170px;
        margin-top: -15px;
        border-radius: 8px;
        display: flex;
        padding: 5px;
        width: auto;
        border: solid steelblue;
        transition: 0.5s;
        flex-direction: row;
        overflow: auto;
        align-items: center;
        justify-content: center;
       `;

    /**
     * ADDCaixa1 - cria coluna interna para tabela de pausas
     * @param {string} idColuna - id da coluna
     * @returns {HTMLElement} div coluna
     */
    function ADDCaixa1(idColuna) {
      const caixa = document.createElement("div");
      caixa.id = idColuna;
      caixa.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0px 6px;
        `;
      return caixa;
    }

    // Criar colunas
    const CPausa = ADDCaixa1("CPausa");
    const CExcl = ADDCaixa1("CExcl");
    const CInicio = ADDCaixa1("CInicio");
    const CFim = ADDCaixa1("CFim");
    const CDuracao = ADDCaixa1("CDuracao");

    // Montar estrutura final
    caixa.append(CExcl, CPausa, CInicio, CFim, CDuracao);

    return caixa;
  }

  /**
   * ADDBotPa - cria botão para mostrar/ocultar painel de pausas
   * Exibe "Pausas"/"Fechar" ou "P"/"F" dependendo do espaço
   * @returns {HTMLElement} botão de pausas
   */
  function ADDBotPa() {
    const caixa = document.createElement("div");
    caixa.id = "BotPa";
    caixa.innerHTML = "P";
    caixa.style.cssText = `
        background: ${Ccor.Principal};
        height: 20px;
        width: 20px;
        border-radius: 15px;
        padding: 5px;
        display: flex;
        align-items: center;
        transition: all 0.5s ease;
        visibility: hidden;
        opacity: 0;
        cursor: pointer;
        justify-content: center;
        margin-left: auto;
       margin-right: 5px;
        margin-top: -20px;
        margin-bottom: 20px;
        `;

    caixa.addEventListener("click", function () {
      AtualizarConf(17);
      ControleFront(3);
      const CaiDPa = document.getElementById("CaiDPa");
      if (CaiDPa) AtuaPausas();
      Controle(1);
    });

    // Adiciona o evento de mouseover ao botão
    caixa.addEventListener("mouseover", function () {
      Controle(1);
    });

    // Adiciona o evento de mouseout ao botão
    caixa.addEventListener("mouseout", function () {
      Controle(0);
    });

    /**
     * Controle - alterna entre modo compacto/expandido do botão
     * @param {number} mostrarTextoCompleto - 1 para expandido, 0 para compacto
     */
    function Controle(mostrarTextoCompleto) {
      caixa.style.width = mostrarTextoCompleto ? "auto" : "20px";
      caixa.innerHTML = mostrarTextoCompleto
        ? stt.AbaPausas
          ? "Fechar"
          : "Pausas"
        : stt.AbaPausas
        ? "F"
        : "P";
    }

    return caixa;
  }

  /**
   * abrirDB - abre ou cria IndexedDB para persistência de dados
   * @param {Function} callback - função a executar com banco de dados aberto
   */
  function abrirDB(callback) {
    const requisicao_bd = indexedDB.open(nomeBD, 1);

    requisicao_bd.onupgradeneeded = function (event) {
      const banco_dados = event.target.result;
      if (!banco_dados.objectStoreNames.contains(StoreBD)) {
        banco_dados.createObjectStore(StoreBD);
      }
    };

    requisicao_bd.onsuccess = function (event) {
      const banco_dados = event.target.result;
      callback(banco_dados);
    };

    requisicao_bd.onerror = function (event) {
      console.error(
        "NiceMonk Erro ao abrir o banco de dados:",
        event.target.errorCode
      );
    };
  }

  /**
   * AddOuAtuIindexdb - salva ou atualiza dados no IndexedDB
   * @param {string} nomechave - chave de armazenamento
   * @param {*} dados - dados a salvar (qualquer tipo)
   * @returns {Promise<boolean>} true se salvo com sucesso
   */
  function AddOuAtuIindexdb(nomechave, dados) {
    return new Promise((resolve, reject) => {
      try {
        abrirDB(function (db) {
          const transacao = db.transaction([StoreBD], "readwrite");
          const store = transacao.objectStore(StoreBD);
          const request = store.put(dados, nomechave);

          request.onsuccess = function () {
            console.debug(
              `NiceMonk Dados salvos com sucesso na chave "${nomechave}"`
            );
            resolve(true);
          };

          request.onerror = function (event) {
            console.error(
              "NiceMonk Erro ao salvar os dados:",
              event.target?.errorCode || event
            );
            reject(event);
          };
        });
      } catch (err) {
        console.error("NiceMonk AddOuAtuIindexdb erro:", err);
        reject(err);
      }
    });
  }

  /**
   * RecDadosindexdb - recupera dados do IndexedDB por chave
   * @param {string} nomechave - chave de armazenamento
   * @returns {Promise<*>} dados armazenados ou false se não encontrado
   */
  function RecDadosindexdb(nomechave) {
    return new Promise((resolve, reject) => {
      abrirDB(function (db) {
        const transacao = db.transaction([StoreBD], "readonly");
        const store = transacao.objectStore(StoreBD);
        const request = store.get(nomechave);

        request.onsuccess = function (event) {
          const resultado = event.target.result;
          resolve(resultado !== undefined ? resultado : false);
        };

        request.onerror = function (event) {
          reject(event.target.errorCode);
        };
      });
    });
  }

  /**
   * listarChavesEConteudos - lista todas as chaves e conteúdos do IndexedDB
   * Exibe painel interativo com visualização e exclusão de registros
   */
  function listarChavesEConteudos() {
    abrirDB(function (db) {
      const transacao = db.transaction([StoreBD], "readonly");
      const store = transacao.objectStore(StoreBD);
      const request = store.getAllKeys();

      request.onsuccess = function (event) {
        const chaves = event.target.result;

        let contador = 0;
        chaves.forEach((nomeChave) => {
          const requisicaoConteudo = store.get(nomeChave);

          requisicaoConteudo.onsuccess = function (e) {
            const conteudoChave = e.target.result;

            const CaixaConfig = document.getElementById("CaixaConfig");
            const CBancDa = document.getElementById("CBancDa");

            // Criar estrutura HTML
            const divPai = document.createElement("div");
            divPai.style.cssText = `width: 100%;`;
            const TituloEBot = document.createElement("div");
            TituloEBot.style.cssText = `
                        display: flex;
                        width: 100%;
                        justify-content: space-between;
                        margin: 6px 0px;
                        `;

            const divChave = document.createElement("div");
            divChave.textContent = nomeChave;
            divChave.style.cssText = `
                        cursor: pointer;
                        text-decoration: underline;
                        font-size: 13px;
                        `;

            const divConteudo = document.createElement("div");
            divConteudo.style.cssText = `
                        display: none;
                        justify-content: center;
                        `;

            divConteudo.textContent = JSON.stringify(conteudoChave, null, 2);

            divChave.addEventListener("click", function () {
              if (
                divConteudo.style.display === "none" ||
                divConteudo.style.display === ""
              ) {
                divConteudo.style.display = "flex";
              } else {
                divConteudo.style.display = "none";
              }
            });

            contador = contador + 1;
            const botaoExcluir = document.createElement("div");
            botaoExcluir.id = `Chave${contador}`;
            botaoExcluir.style.cssText = `
                        cursor: pointer;
                        `;
            botaoExcluir.textContent = "❌";
            botaoExcluir.addEventListener("click", function () {
              CaixaConfig.appendChild(
                ADDCaixaDAviso("Excluir", () => {
                  ApagarChaveIndexDB(nomeChave);
                  CBancDa.innerHTML = "";
                  listarChavesEConteudos();
                })
              );
            });

            TituloEBot.appendChild(divChave);
            TituloEBot.appendChild(botaoExcluir);
            divPai.appendChild(TituloEBot);
            divPai.appendChild(divConteudo);

            CBancDa.appendChild(divPai);
          };
        });
      };

      request.onerror = function (event) {
        console.error("Erro ao listar as chaves:", event.target.errorCode);
      };
    });
  }

  /**
   * ApagarChaveIndexDB - deleta uma chave do IndexedDB
   * @param {string} nomechave - chave a deletar
   */
  function ApagarChaveIndexDB(nomechave) {
    abrirDB(function (db) {
      const transacao = db.transaction([StoreBD], "readwrite");
      const store = transacao.objectStore(StoreBD);
      const request = store.delete(nomechave);

      request.onsuccess = function () {
        console.log(`NiceMonk Chave "${nomechave}" apagada com sucesso.`);
      };

      request.onerror = function (event) {
        console.error(
          "NiceMonk Erro ao apagar a chave:",
          event.target.errorCode
        );
      };
    });
  }

  /**
   * SalvarLogueManual - salva dados de login manual no IndexedDB
   * Se data mudou (dia anterior), move registro anterior para "Ontem"
   * @param {number} x - 1 para forçar salvamento, 0 para verificar primeiro
   */
  async function SalvarLogueManual(x) {
    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemFormatado = ontem.toISOString().split("T")[0];

    const valorEdata = {
      ValorLogueManual: CConfig.ValorLogueManual,
      LogueManual: CConfig.LogueManual,
      data: hojeFormatado,
    };

    if (!dadosLogueManu || dadosLogueManu.data !== hojeFormatado) {
      x = 1;
      //console.log("NiceMonk Data Diferente de Hoje");
    }
    if (dadosLogueManu && dadosLogueManu.data === ontemFormatado) {
      await AddOuAtuIindexdb(ChavePrimLogueOntem, dadosLogueManu);
    }

    if (x) {
      await AddOuAtuIindexdb(ChavelogueManu, valorEdata);
      //console.log("NiceMonk Informação salva para a data de hoje  LogueManual: ",valorEdata);
    } else {
      CConfig.ValorLogueManual = dadosLogueManu.ValorLogueManual;
      CConfig.LogueManual = dadosLogueManu.LogueManual;
      //console.log("NiceMonk x False");
    }
  }

  /*
   *horaedataparacalculo: { hora: 'HH:MM:SS', data: 'YYYY-MM-DD' }
   *maisoumenos: true para '+' ou false para '-'
   *valordeacrecimo: string no formato 'HH:MM', 'HH:MM:SS'
   */
  function exibirHora(horaedataparacalculo, maisoumenos, valordeacrecimo) {
    function parseOffset(offsetStr) {
      // Suporta formatos com sinal: +HH:MM, -HH:MM:SS, etc.
      const m = String(offsetStr || "").match(
        /^([+-])(\d{2}):?(\d{2})(?::?(\d{2}))?$/
      );
      if (!m) return 0;
      const sign = m[1] === "-" ? -1 : 1;
      const hours = parseInt(m[2], 10);
      const minutes = parseInt(m[3], 10);
      const seconds = m[4] ? parseInt(m[4], 10) : 0;
      return sign * (hours * 3600 + minutes * 60 + seconds);
    }

    function parseDuration(durationStr) {
      // 'HH:MM' or 'HH:MM:SS' -> seconds (always positive)
      if (!durationStr) return 0;
      const m = String(durationStr).match(/^(\d{1,2}):?(\d{2})(?::?(\d{2}))?$/);
      if (!m) return 0;
      const hours = parseInt(m[1], 10);
      const minutes = parseInt(m[2], 10);
      const seconds = m[3] ? parseInt(m[3], 10) : 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    function buildDateTime(obj) {
      // obj: { data: 'YYYY-MM-DD', hora: 'HH:MM:SS' }
      const dparts = String(obj.data || "")
        .split("-")
        .map(Number);
      const tparts = String(obj.hora || "00:00:00")
        .split(":")
        .map(Number);
      if (dparts.length < 3) return new Date();
      let [year, month, day] = dparts;
      let [hh = 0, mm = 0, ss = 0] = tparts;
      if (hh === 24) {
        hh = 0;
        const tmp = new Date(year, month - 1, day);
        tmp.setDate(tmp.getDate() + 1);
        year = tmp.getFullYear();
        month = tmp.getMonth() + 1;
        day = tmp.getDate();
      }
      return new Date(year, month - 1, day, hh, mm, ss);
    }

    function formatDateTime(date) {
      const d = date.toISOString().split("T")[0];
      const t = date.toTimeString().split(" ")[0];
      return { date: d, time: t };
    }

    // Determina offset em segundos. Suporta duas formas de chamada:
    // 1) exibirHora(base, "+HH:MM:SS") -> usa sinal embutido
    // 2) exibirHora(base, maisoumenosBool, "HH:MM:SS") -> usa boolean para sinal
    let offsetSec = 0;
    if (typeof maisoumenos === "string" && valordeacrecimo === undefined) {
      // segunda forma usada anteriormente: passou o valor com sinal
      offsetSec = parseOffset(maisoumenos);
    } else {
      const dur = parseDuration(valordeacrecimo || "00:00:00");
      const sign = maisoumenos === false ? -1 : 1; // default '+'
      offsetSec = sign * dur;
    }

    const base = buildDateTime(horaedataparacalculo);
    const adjusted = new Date(base.getTime() + offsetSec * 1000);
    const out = formatDateTime(adjusted);
    console.log(
      `Modo teste: Data: ${out.date}, Hora: ${out.time} (offset ${offsetSec}s)`
    );
    showBanner(`TESTE ${out.date} ${out.time} (offset ${offsetSec}s)`);

    return { date: out.date, time: out.time };
  }

  /**
   * verificarESalvar - verifica e salva primeiro login do dia no IndexedDB
   * Se data mudou, movimenta registro anterior para "Ontem"
   * @param {number} x - 1 para forçar salvamento, 0 para verificar primeiro
   */
  async function verificarESalvar2(x) {
    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemFormatado = ontem.toISOString().split("T")[0];

    const valorFormatado = converterParaTempo(Segun.Logou);
    const valorEdata = { valor: valorFormatado, data: hojeFormatado }; // Usa a data de hoje e o valor passado

    if (
      !dadosPrimLogue ||
      (dadosPrimLogue.data !== hojeFormatado &&
        dadosPrimLogue.data !== ontemFormatado)
    ) {
      valorEdata.valor = mostrarHora();
      await AddOuAtuIindexdb(ChavePrimLogue, valorEdata);
      dadosPrimLogue = valorEdata;
    }

    if (dadosPrimLogue && dadosPrimLogue.data === ontemFormatado) {
      await AddOuAtuIindexdb(ChavePrimLogueOntem, dadosPrimLogue);
      const nova = exibirHora(dadosPrimLogue, 1, CConfig.TempoEscaladoHoras);

      CConfig.logueEntreDatas = nova.date === hojeFormatado ? 1 : 0;
    }

    Segun.LogouSalvo = converterParaSegundos(dadosPrimLogue.valor);
  }

  async function verificarESalvar(x) {
    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemFormatado = ontem.toISOString().split("T")[0];

    const valorFormatado = converterParaTempo(Segun.Logou);
    const valorEdata = { valor: valorFormatado, data: hojeFormatado }; // Usa a data de hoje e o valor passado

    let PrimeiroLogueRes;
    if (
      !dadosPrimLogue ||
      (dadosPrimLogue.data !== hojeFormatado &&
        dadosPrimLogue.data !== ontemFormatado)
    ) {
      valorEdata.valor = "24:00:00";
      x = 1;
    }
    if (dadosPrimLogue && dadosPrimLogue.data === ontemFormatado) {
      await AddOuAtuIindexdb(ChavePrimLogueOntem, dadosPrimLogue);
    }

    // garantir valores seguros caso não existam registros anteriores
    const dadosPrimLoguesegun = converterParaSegundos(
      dadosPrimLogue && dadosPrimLogue.valor ? dadosPrimLogue.valor : "00:00:00"
    );
    const dadosPrimLogueOntSeg = converterParaSegundos(
      dadosPrimLogueOnt && dadosPrimLogueOnt.valor
        ? dadosPrimLogueOnt.valor
        : "00:00:00"
    );
    const VinteEQuatro = converterParaSegundos("23:59:59");
    const TempoEscaladoSeg = converterParaSegundos(CConfig.TempoEscaladoHoras);

    // determina se o primeiro logue pertence ao dia anterior
    const entreDatas =
      VinteEQuatro - dadosPrimLoguesegun < TempoEscaladoSeg ||
      Segun.Hora < TempoEscaladoSeg;

    // atualiza flag de configuração (0|1) e escolhe o registro correto
    CConfig.logueEntreDatas = entreDatas ? 1 : 0;
    PrimeiroLogueRes = entreDatas ? dadosPrimLogueOnt : dadosPrimLogue;

    if (x) {
      console.log(
        "NiceMonk Anteriormente salvo em primeiroLogue: ",
        PrimeiroLogueRes
      );

      if (entreDatas) {
        valorEdata.data = ontemFormatado;
        dadosPrimLogueOnt = valorEdata;
      } else {
        dadosPrimLogue = valorEdata;
      }

      let chavelogue = entreDatas ? ChavePrimLogueOntem : ChavePrimLogue;

      await AddOuAtuIindexdb(chavelogue, valorEdata);

      console.log(
        "NiceMonk Informação salva para a data de hoje primeiroLogue: ",
        valorEdata
      );
      Segun.LogouSalvo = converterParaSegundos(valorEdata.valor);
    } else {
      Segun.LogouSalvo = converterParaSegundos(PrimeiroLogueRes.valor);
      console.log(
        "NiceMonk Informação salva em primeiroLogue: ",
        PrimeiroLogueRes
      );
    }
  }

  /**
   * SalvandoVari - salva/restaura/valida configurações (CConfig, Ccor)
   * Modo 1: Salva atual no IndexedDB
   * Modo 2: Restaura de backup (PCConfig, PCcor)
   * Modo 3: Recupera do IndexedDB ou padrão
   * @param {number} modo - 1=salvar, 2=backup, 3=recuperar
   */
  async function SalvandoVari(modo) {
    const AsVari = {
      CConfig: { ...CConfig },
      Ccor: { ...Ccor },
      VariavelmodoTeste: { ...(VariavelmodoTeste || {}) },
    };

    /**
     * aplicarConfiguracao - aplica dados de configuração aos objetos globais
     * @param {Object} dados - objeto com CConfig e Ccor
     */
    function aplicarConfiguracao(dados) {
      if (dados.CConfig) Object.assign(CConfig, dados.CConfig);
      if (dados.Ccor) Object.assign(Ccor, dados.Ccor);
      if (dados.VariavelmodoTeste)
        Object.assign(VariavelmodoTeste, dados.VariavelmodoTeste);
    }

    switch (modo) {
      case 1:
        await AddOuAtuIindexdb(ChaveConfig, AsVari);
        aplicarConfiguracao(AsVari);
        break;

      case 2:
        if (typeof PCConfig !== "undefined" && typeof PCcor !== "undefined") {
          AsVari.CConfig = { ...PCConfig };
          AsVari.Ccor = { ...PCcor };
          await AddOuAtuIindexdb(ChaveConfig, AsVari);
          aplicarConfiguracao(AsVari);
        } else {
          console.warn("PCConfig ou PCcor não estão definidos.");
        }
        break;

      case 3:
        if (typeof dadosSalvosConfi !== "undefined") {
          aplicarConfiguracao(dadosSalvosConfi);
          console.log(`NiceMonk Dados em ${ChaveConfig}:`, dadosSalvosConfi);
        } else {
          console.log(
            `NiceMonk Não foram encontrados dados em ${ChaveConfig}, restaurado ao padrão:`,
            dadosSalvosConfi
          );
          await SalvandoVari(2);
        }
        break;

      default:
        console.warn("Parâmetro inválido para SalvandoVari:", modo);
    }
  }

  /**
   * salvarDPausas - inicializa ou recupera estrutura de pausas do dia
   * Se a data mudou, reinicializa com estrutura padrão
   * Caso contrário, recupera contador de pausas e status anterior
   */
  async function salvarDPausas() {
    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemFormatado = ontem.toISOString().split("T")[0];

    const estruturaPadrao = [
      { id: 1, data: hojeFormatado, Ndpausas: 2, StatusANT: "", IPausaS: "" },
    ];

    // Garante que dadosdePausas seja um array
    if (!Array.isArray(dadosdePausas)) {
      dadosdePausas = [];
    }

    const itemComData = dadosdePausas.find((item) => item.id === 1);

    if (!itemComData || itemComData.data !== hojeFormatado) {
      dadosdePausas = [...estruturaPadrao]; // reinicia com os dados padrão
      await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
    } else {
      stt.Ndpausas = itemComData.Ndpausas;
      stt.StatusANT = itemComData.StatusANT;
      stt.IPausaS = itemComData.IPausaS;
    }
  }

  /**
   * AddouAtualizarPausas - adiciona ou atualiza registro de pausa
   * @param {number} id - id único da pausa
   * @param {string} pausa - nome da pausa (Descanso, Lanche, etc)
   * @param {string} Inicio - hora de início (HH:MM:SS)
   * @param {string} Fim - hora de fim (HH:MM:SS) ou tempo previsto
   * @param {string} Duracao - duração prevista ou real
   */
  async function AddouAtualizarPausas(id, pausa, Inicio, Fim, Duracao) {
    const novoItem = { id, pausa, Inicio, Fim, Duracao };

    // Garante que dadosdePausas seja um array
    if (!Array.isArray(dadosdePausas)) {
      dadosdePausas = [];
    }

    const index = dadosdePausas.findIndex((item) => item.id === id);

    if (index !== -1) {
      dadosdePausas[index] = { ...dadosdePausas[index], ...novoItem };
    } else {
      dadosdePausas.push(novoItem);
    }

    await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
  }

  /**
   * atualizarCampos - atualiza um campo de uma pausa pelo id
   * Se id não existe, cria novo item com o campo
   * @param {number} id - id da pausa
   * @param {string} campo - nome do campo a atualizar
   * @param {*} valor - novo valor
   */
  async function atualizarCampos(id, campo, valor) {
    const index = dadosdePausas.findIndex((item) => item.id === id);

    if (index !== -1) {
      dadosdePausas[index][campo] = valor; // Atualiza o campo dinamicamente
    } else {
      // Cria novo item com o campo e valor fornecidos
      const novoItem = { id };
      novoItem[campo] = valor;
      dadosdePausas.push(novoItem);
    }

    try {
      await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
    } catch (err) {
      console.error("NiceMonk Erro ao atualizar campos no IndexedDB:", err);
    }

    if (campo === "Duracao") {
      console.debug(`NiceMonk Tabela salva : `, ChavePausas);
    }
  }

  /**
   * removerPausaPorId - remove um registro de pausa pelo id
   * Atualiza IndexedDB e refaz a exibição da tabela
   * @param {number} id - id da pausa a remover
   */
  async function removerPausaPorId(id) {
    const index = dadosdePausas.findIndex((item) => item.id === id);

    if (index !== -1) {
      dadosdePausas.splice(index, 1); // Remove o item do array
      try {
        await AddOuAtuIindexdb(ChavePausas, dadosdePausas); // Atualiza o IndexedDB
      } catch (err) {
        console.error("NiceMonk Erro ao remover pausa:", err);
      }
      AtuaPausas();
      console.debug(`NiceMonk item com id ${id} removido.`);
    } else {
      console.debug(`NiceMonk item com id ${id} não encontrado.`);
    }
  }

  /**
   * atualizarID1 - atualiza registro raiz (id=1) com estado atual de pausas
   * Sincroniza contador de pausas, status anterior e tempo de início
   */
  async function atualizarID1() {
    if (!dadosdePausas) {
      await salvarDPausas();
    }
    const index = dadosdePausas.findIndex((item) => item.id === 1);
    if (index !== -1) {
      dadosdePausas[index].Ndpausas = stt.Ndpausas;
      dadosdePausas[index].StatusANT = stt.StatusANT;
      dadosdePausas[index].IPausaS = stt.IPausaS;
    }
    try {
      await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
    } catch (err) {
      console.error("NiceMonk Erro ao atualizar ID1 no IndexedDB:", err);
    }
  }

  /**
   * AtuaPausas - renderiza tabela de pausas do dia
   * Ordena por id e preenche 5 colunas (Excl, Pausa, Início, Fim, Duração)
   */
  function AtuaPausas() {
    const CPausa = document.getElementById("CPausa");
    const CInicio = document.getElementById("CInicio");
    const CFim = document.getElementById("CFim");
    const CDuracao = document.getElementById("CDuracao");
    const CExcl = document.getElementById("CExcl");

    if (CExcl) {
      CExcl.innerHTML = "";
      CExcl.appendChild(AddTituloCp("Excl"));
    }
    if (CPausa) {
      CPausa.innerHTML = "";
      CPausa.appendChild(AddTituloCp("Pausa"));
    }
    if (CInicio) {
      CInicio.innerHTML = "";
      CInicio.appendChild(AddTituloCp("Início"));
    }
    if (CFim) {
      CFim.innerHTML = "";
      CFim.appendChild(AddTituloCp("Fim"));
    }
    if (CDuracao) {
      CDuracao.innerHTML = "";
      CDuracao.appendChild(AddTituloCp("Duração"));
    }

    /**
     * criarItemTabela - cria célula de tabela com ícone ou texto
     * @param {number} id - id da pausa
     * @param {string} campo - tipo de campo (id, pausa, etc)
     * @param {string} textoExibicao - texto a exibir
     * @returns {HTMLElement} célula formatada
     */
    function criarItemTabela(id, campo, textoExibicao) {
      const caixa = document.createElement("div");
      caixa.id = `${campo}${id}`;
      caixa.innerHTML = textoExibicao;

      if (campo === "id") {
        if (id === 2) {
          caixa.style.cssText = `
                visibility: hidden;
                opacity: 0;
                `;
        } else {
          caixa.style.cssText = `
                cursor: pointer;
                `;
        }
        caixa.addEventListener("click", () => {
          const CaiDPa = document.getElementById("CaiDPa");
          CaiDPa.appendChild(
            ADDCaixaDAviso("Excluir", () => {
              removerPausaPorId(id);
            })
          );
        });
      }

      return caixa;
    }

    if (dadosdePausas && Array.isArray(dadosdePausas)) {
      const ordenado = [...dadosdePausas].sort((a, b) => a.id - b.id);

      ordenado.forEach((item) => {
        if (item.id === 1) return;

        CExcl.appendChild(criarItemTabela(item.id, "id", "❌"));
        CPausa.appendChild(criarItemTabela(item.id, "pausa", item.pausa || ""));
        CInicio.appendChild(
          criarItemTabela(item.id, "inicio", item.Inicio || "<---->")
        );
        CFim.appendChild(criarItemTabela(item.id, "fim", item.Fim || "<---->"));
        CDuracao.appendChild(
          criarItemTabela(item.id, "duracao", item.Duracao || "<---->")
        );
      });
    }
  }

  /**
   * ADDCaixaDAviso - cria caixa de diálogo confirmação (Sim/Não)
   * @param {string} titulo - título do diálogo
   * @param {Function} funcao - callback ao clicar em "Sim"
   * @returns {HTMLElement} caixa de aviso posicionada
   */
  function ADDCaixaDAviso(titulo, funcao) {
    const caixa = document.createElement("div");
    caixa.id = "CaiDeAvi";
    caixa.style.cssText = `
        background: ${Ccor.Principal};
        position: absolute;
        padding: 6px 10px;
        border-radius: 12px;
       display: flex;
        flex-direction: column;
        align-items: center;
        `;

    const elementoTitulo = document.createElement("div");
    elementoTitulo.innerHTML = titulo;
    elementoTitulo.style.cssText = `
            font-size: 14px;
            border-bottom-style: dashed;
            border-width: 1px;
            margin-bottom: 6px;
        `;

    const elementoPergunta = document.createElement("div");
    elementoPergunta.style.cssText = `
        margin-bottom: 8px;
        `;
    elementoPergunta.innerHTML = "Tem Certeza ?";

    const caixaBotoes = document.createElement("div");
    caixaBotoes.style.cssText = `
        display: flex;
        justify-content: space-between;
        width: 100%;
        `;

    /**
     * criarBotaoOpcao - cria botão de opção (Sim/Não)
     * @param {string} texto - texto do botão (Sim ou Não)
     * @returns {HTMLElement} botão formatado
     */
    function criarBotaoOpcao(texto) {
      const botao = document.createElement("div");
      botao.innerHTML = texto;
      botao.style.cssText = `
            cursor: pointer;
            border: white 1px solid;
            border-radius: 15px;
            padding: 2px 4px;
           `;
      botao.addEventListener("mouseover", function () {
        botao.style.background = "white";
        botao.style.color = Ccor.Principal;
      });

      botao.addEventListener("mouseout", function () {
        botao.style.background = "";
        botao.style.color = "";
      });
      botao.addEventListener("click", function () {
        if (texto === "Sim") {
          funcao();
          caixa.remove();
        } else {
          caixa.remove();
        }
      });
      return botao;
    }

    caixaBotoes.appendChild(criarBotaoOpcao("Sim"));
    caixaBotoes.appendChild(criarBotaoOpcao("Não"));

    caixa.appendChild(elementoTitulo);
    caixa.appendChild(elementoPergunta);
    caixa.appendChild(caixaBotoes);

    return caixa;
  }

  /**
   * tocarBeep - toca tom de alerta via Web Audio API
   * Frequência: 700Hz, duração: 0.5s, volume: 0.6
   */
  function tocarBeep() {
    const contextoAudio = new (window.AudioContext ||
      window.webkitAudioContext)();
    const nodoOscilador = contextoAudio.createOscillator();
    const nodoGanho = contextoAudio.createGain();

    nodoOscilador.type = "sine"; // Tipo de onda
    nodoOscilador.frequency.setValueAtTime(700, contextoAudio.currentTime); // Frequência em Hz
    nodoGanho.gain.setValueAtTime(0.6, contextoAudio.currentTime); // Volume entre 0.0 e 1.0

    nodoOscilador.connect(nodoGanho);
    nodoGanho.connect(contextoAudio.destination);

    nodoOscilador.start();
    nodoOscilador.stop(contextoAudio.currentTime + 0.5); // Duração de 0.5 segundos
  }

  /**
   * RepetirBeep - toca beep repetidamente enquanto pausa estiver em estouro
   * Intervalo configurável via stt.intervaloBeep (em segundos)
   */
  function RepetirBeep() {
    if (stt.Estouro && CConfig.SomEstouro && !stt.BeepRet) {
      stt.BeepRet = 1;
      setTimeout(function () {
        stt.BeepRet = 0;
        tocarBeep();
        RepetirBeep();
      }, stt.intervaloBeep * 1000);
    }
  }

  // Your code here...
})();
