// ==UserScript==
// @name         LoginZomTest
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      0.0.0.2
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://zoom.us/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/Login.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/Login.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==
//https://smileshelp.zendesk.com/*
//https://cxagent.nicecxone.com/home*
(function () {
  const config = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    ValorMetaTMA: 725,
    logueEntreDatas: 0,
    pausalimitada: 0,
    LogueManual: 0,
    logueSalvo: 1,
    SomEstouro: 1,
    notiEstouro: 1,
    OBS_ATIVO: 1,
    TesteHora: 0,
    valorTeste: "-03:00",
    VoltarPad: 0,
    LadoBot: 0,
    LadoBotAnterior: 0,
    MetaTMA: 1,
    FaixaVerti: 0,
    TolerOff: 40,
    posicaoH: {
      top: "34px",
      right: "106px",
      left: "",
    },
    posicaoV: {
      top: "260px",
      right: "0px",
      left: "",
    },
    dBUG: 0,
    HistComp: 0,
  };

  const configPadrao = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    ValorMetaTMA: 725,
    logueEntreDatas: 0,
    pausalimitada: 0,
    LogueManual: 0,
    SomEstouro: 1,
    notiEstouro: 1,
    OBS_ATIVO: 1,
    TesteHora: 0,
    valorTeste: "-03:00",
    VoltarPad: 0,
    LadoBot: 0,
    LadoBotAnterior: 0,
    MetaTMA: 1,
  };

  const stt = {
    logueInicio: 1,
    observa: 1,
    Status: "",
    andament: 1,
    ocultarValor: 0,
    Estouro: 0,
    AbaPausas: 0,
    AbaConfig: 0,
    AbaOutros: 0,
    tempoCumprido: 0,
    temHorasExtras: 0,
    Estour1: 0,
    BeepRet: 0,
    Encontrado: 0,
    LadoBot: 0,
    LadoBotAnterior: 0,
    verificarDurac: 0,
    ContAnt: 0,
  };

  let TempoPausas = {
    Logou: 0,
    LogouA: 0,
    Logado: 0,
    Saida: 0,
    SaidaA: 0,
    Falta: 0,
    Online: 0,
    CompOnli: 0,
    Time: 0,
    Estouro: 0,
    ContAtual: 0,
    Trabalhando: 0,
    Indisponivel: 0,
    Disponivel: 0,
    Atendidas: 0,
  };

  const AntFim = {};

  const DDPausa = {
    numero: 1,
    inicioUltimaP: 0,
    inicioUltimaPa: 0,
    StatusANT: "",
  };

  const letraD = {
    Logou: "Logou:",
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
    AreaAr: "#337091",
    Config: "#96a8bb",
    Varian: "",
    TVarian: "",
  };

  /**
   * PCcor - Cores padrão (backup)
   */
  const CorPad = {
    Offline: "#3a82cf",
    Atualizando: "#c97123ff",
    Erro: "#992e2e",
    MetaTMA: "#229b8d",
    Principal: "#4c95bd",
    AreaAr: "#337091",
    Config: "#96a8bb",
    Varian: "",
    TVarian: "",
  };

  // Chaves usadas no IndexedDB/local storage
  const ChavePausas = "DadosDePausas";
  const ChaveConfig = "Configuções";
  const ChavelogueManu = "LogueManual";
  const ChavePrimLogue = "PrimeiroLogue";
  const ChavePrimLogueOntem = "PrimeiroLogueOntem";

  // Variáveis que receberão dados recuperados do banco local (indexedDB)
  let dadosdePausas;
  let dadosControlado;
  let dadosSalvosConfi;
  let dadosPrimLogue;
  let dadosPrimLogueOnt;
  let dadosLogueManu;

  // Configuração do IndexedDB
  const nomeBD = "Hefestos";
  //const nomeBD = "HefestosTeste";
  const StoreBD = "LogueZom";

  // ========= LOG UTILS =========

  const PreFixo = "HefestoLog:";

  function Hlog(...args) {
    console.log(PreFixo, ...args);
  }
  function Hwarn(...args) {
    console.warn(PreFixo, ...args);
  }
  function Herror(...args) {
    console.error(PreFixo, ...args);
  }
  function Hodeb(...args) {
    if (config.dBUG) console.debug(PreFixo, ...args);
  }
  function Hinfo(...args) {
    console.info(PreFixo, ...args);
  }

  RecuperarTVariaveis();

  /**
   * RecuperarTVariaveis - recupera as variáveis persistidas do indexedDB
   * - Tenta recuperar vários conjuntos de dados e registra erros quando ocorrerem
   */
  async function RecuperarTVariaveis() {
    try {
      dadosdePausas = await RecDadosindexdb(ChavePausas);
      Hodeb("Encontrados em dadosdePausas:", dadosdePausas);
    } catch (e) {
      Herror("Erro ao recuperar dadosdePausas:", e);
    }

    try {
      dadosSalvosConfi = await RecDadosindexdb(ChaveConfig);
      Hodeb("Encontrados em dadosSalvosConfi:", dadosSalvosConfi);
    } catch (e) {
      Herror("Erro ao recuperar dadosSalvosConfi:", e);
    }

    try {
      dadosPrimLogue = await RecDadosindexdb(ChavePrimLogue);
      Hodeb("Encontrados em dadosPrimLogue:", dadosPrimLogue);
    } catch (e) {
      Herror("Erro ao recuperar dadosPrimLogue:", e);
    }

    try {
      dadosLogueManu = await RecDadosindexdb(ChavelogueManu);
      Hodeb("Encontrados em dadosLogueManu:", dadosLogueManu);
    } catch (e) {
      Herror("Erro ao recuperar dadosLogueManu:", e);
    }

    try {
      dadosPrimLogueOnt = await RecDadosindexdb(ChavePrimLogueOntem);
      Hodeb("Encontrados em dadosPrimLogueOnt:", dadosPrimLogueOnt);
    } catch (e) {
      Herror("Erro ao recuperar dadosPrimLogueOnt:", e);
    }
    await SalvandoVariConfig(0);
    await verifLogueManual();
    CriarBotInicial();
  }

  function observarItem(aoMudar) {
    const observer = new MutationObserver(() => {
      if (stt.andament) {
        stt.andament = 0;
        aoMudar();
      }
      // Desconecta somente se já achamos o valor (stt.observa = 0)
      if (stt.observa === 0) {
        observer.disconnect();
        Hlog("observer Desconectado");
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Retorna a primeira parte do texto até o primeiro delimitador:
   * - espaço(s)
   * - pipe: |
   * - hífen: -
   *
   * Depois normaliza para: PrimeiraLetraMaiúscula + restante minúsculo.
   * Exemplos:
   *  - "Abobora|abacaxi" -> "Abobora"
   *  - "Abobora-abacaxi" -> "Abobora"
   *  - "  MARIA-joana  " -> "Maria"
   *  - "José Silva"      -> "José"
   */
  const formatPrimeiroNome = (txt) => {
    const t = (txt ?? "").trim();
    if (!t) return "";

    // Divide no primeiro espaço, pipe (|) ou hífen (-)
    // O modificador 'u' garante suporte Unicode
    const first = t.split(/[|\/\-\s]+/u)[0];

    // Normaliza: primeira letra maiúscula, restante minúsculo
    const lower = first.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  function NorTX(valor) {
    if (!valor) return "";

    return valor
      .toString()
      .normalize("NFD") // separa acentos
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .toUpperCase()
      .trim();
  }

  function encoStatus() {
    const statusName = document.querySelector(".statusName");

    const NomeDp = document.querySelector(".cus-badge__status");

    const timer = document.querySelector(".side-row-timer__text");

    if (!statusName) return false;

    let statusNameTex = statusName.textContent;
    let timerTex = "---";
    let NomeDpval = false;

    const SNT = NorTX(statusNameTex);

    if (SNT === "PRONTO") {
      statusNameTex = "Disponivel";
    } else if (SNT === "OCUPADO") {
      statusNameTex = "Trabalhando";
      if (NomeDp) {
        NomeDpval = NomeDp.textContent;
      }
    } else {
      if (NomeDp) {
        statusNameTex = NomeDp.textContent;
      }
    }

    if (timer) {
      timerTex = timer.textContent.trim();
    }

    return {
      Status: statusNameTex,
      Pausa: NomeDpval,
      Timer: timerTex,
    };
  }

  observarItem(() => {
    //const el = obterEstadoAgenteComoObjeto();

    const el = encoStatus();

    if (!el) {
      Hlog("Alteração aconteceu, mas ainda sem status");
      stt.Status = "---";
      return (stt.andament = 1);
    }

    stt.Status = formatPrimeiroNome(el.Status);

    let Otimer = el.Timer ? converterParaSegundos(el.Timer) : "---";

    // Se não mudou, não faz nada

    let oRet = stt.Status === "" || stt.Status === "---" ? 1 : 0;

    if (Otimer >= stt.ContAnt) {
      oRet = 1;
    }
    if (Otimer !== "---") stt.ContAnt = Otimer;

    if (oRet) return (stt.andament = 1);

    // ==========================================================
    // 3) Atualiza status anterior
    // ==========================================================

    Hlog(`Troca de Status: ${stt.Status} / ant: ${DDPausa.StatusANT}`);
    DDPausa.StatusANT = stt.Status;

    // Helpers
    const duracaoPrevistaPorStatus = (s) => {
      if (s.includes("Lanche")) return "00:20:00";
      if (s.includes("Descanso")) return "00:10:00";
      return null;
    };

    // Executa sem estourar "Uncaught (in promise)"
    (async () => {
      // ==========================================================
      // 1) FECHAR pausa atual (registro do DDPausa.numero atual)
      //    - Faz sentido quando:
      //      a) houve uma pausa aberta antes (existe "inicio")
      //      b) e estamos mudando de status (já garantimos que mudou)
      // ==========================================================
      // Tentamos fechar o registro atual (se tiver inicio salvo)
      // OBS: isso mantém seu comportamento de "fecha pausa atual" a cada mudança
      // (desde que exista início registrado).

      const agora = gerarDataHora(); // { data, hora }

      if (stt.logueInicio) {
        Hlog("Primeiro logue detectado");
        verifiDataLogue(0, agora);
        stt.logueInicio = 0;
      }

      const inicioObj = await getValorDadosPausa(DDPausa.numero, "inicio"); // {data,hora} ou undefined

      const duracaoObj = await getValorDadosPausa(DDPausa.numero, "duracao"); // {data,hora} ou undefined

      //Hlog(`fimObj: ${JSON.stringify(fimObj)}`);

      Hlog(`id:${DDPausa.numero}, inicioObj: ${JSON.stringify(inicioObj)}`);
      if (inicioObj && (!duracaoObj || duracaoObj === "---")) {
        // Salva fim (objeto)
        await atualizarCampos(DDPausa.numero, "fim", agora);

        config.pausalimitada = 0;
        stt.Estouro = 0;
        stt.Estour1 = 0;
        atualizarComoff(0, Ccor.Erro, "cTMA");
        SalvandoVariConfig(1);
        // Calcula duração real (string HH:MM:SS)
        const duracaoReal = calcularDuracao(inicioObj, agora);
        await atualizarCampos(DDPausa.numero, "duracao", duracaoReal);

        Hlog(`fim: ${JSON.stringify(agora)}`);

        somarDuracoesGeral();
      }

      // Seu comentário original: "Se for abrir nova pausa, incremente o id"
      DDPausa.numero += 1;

      const duracaoPrevista = duracaoPrevistaPorStatus(stt.Status);
      let fimPrevistoObj = null;

      if (duracaoPrevista) {
        config.pausalimitada = 1;
        // exibirHora soma duracaoPrevista ao "agora"
        fimPrevistoObj = exibirHora(agora, 1, duracaoPrevista); // retorna {data,hora}
        TempoPausas.Estouro = fimPrevistoObj;
      }

      DDPausa.inicioUltimaP = agora;

      SalvandoVariConfig(1);

      //Hlog(`TempoPausas: ${JSON.stringify(TempoPausas)}`);
      // Cria/atualiza pausa no array + IndexedDB
      await AddouAtualizarPausas(
        DDPausa.numero,
        stt.Status,
        agora, // inicio: {data,hora}
        fimPrevistoObj || "---", // fim previsto: {data,hora} ou null
        "---", // duracao prevista: "HH:MM:SS" ou "---"
      );
    })().catch((err) => Herror("erro no observer async:", err));
    stt.andament = 1;
  });

  async function verifLogueManual() {
    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemFormatado = ontem.toISOString().split("T")[0];
    const agora = gerarDataHora();

    if (
      !dadosLogueManu ||
      (dadosLogueManu.data !== hojeFormatado &&
        dadosLogueManu.data !== ontemFormatado)
    ) {
      dadosLogueManu = agora;
      AddOuAtuIindexdb(ChavelogueManu, dadosLogueManu);
    }
  }

  async function verifiDataLogue(x = 0, z = 0) {
    const a = gerarDataHora();
    const e = exibirHora(a, 0, "23:59:59");
    let limp = 0;

    if (
      !dadosPrimLogue ||
      (dadosPrimLogue.data !== a.data && dadosPrimLogue.data !== e.data)
    ) {
      limp = 1;
    }

    const b = exibirHora(dadosPrimLogue, 1, config.TempoEscaladoHoras);

    config.logueEntreDatas = dadosPrimLogue.data !== b.data ? 1 : 0;
    if (!config.logueEntreDatas && dadosPrimLogue.data !== a.data) {
      limp = 1;
    }

    if (limp) {
      x = 1;
      TempoPausas = {};
      dadosPrimLogue = z || a;
      dadosdePausas = [];
      DDPausa.numero = 0;
      ApagarChaveIndexDB(ChavePausas);
      SalvandoVariConfig(1);
    }
    Hlog(`
      config.logueEntreDatas = ${config.logueEntreDatas} /
      dadosPrimLogue.data = ${dadosPrimLogue.data} /
      b.data = ${b.data}
      `);
    if (x) await AddOuAtuIindexdb(ChavePrimLogue, dadosPrimLogue);
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

  function converterParaTempo(input) {
    if (input == null) return "00:00:00";

    // aceita número (segundos) ou string ("HH:MM:SS" / "MM:SS" / "SS")
    let total = Number(input);

    if (Number.isNaN(total)) {
      if (typeof input === "string" && input.includes(":")) {
        const parts = input.split(":").map((p) => Number(p.trim()));
        if (parts.length === 3) {
          total = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          total = parts[0] * 60 + parts[1];
        } else {
          total = 0;
        }
      } else {
        // caso seja string só com segundos ("15", "90") ou inválida
        const onlyNum = Number(String(input).trim());
        total = Number.isFinite(onlyNum) ? onlyNum : 0;
      }
    }

    // normaliza para inteiro e evita negativo
    total = Math.max(0, Math.floor(total));

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;

    return (
      String(horas).padStart(2, "0") +
      ":" +
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundos).padStart(2, "0")
    );
  }

  /* Soma as durações do array (campo "duracao") em UMA passada.
   * - Atualiza TempoPausas (se existir).
   * - Retorna um objeto com os valores em segundos e em texto (HH:MM:SS).
   */
  function somarDuracoesGeral() {
    // Se não é array, normaliza para array vazio
    const arr = Array.isArray(dadosdePausas) ? dadosdePausas : [];
    if (arr.length === 0) {
      const vazio = {
        trabalhandoSeg: 0,
        disponivelSeg: 0,
        indisponivelSeg: 0,
        onlineSeg: 0,
        trabalhandoTxt: converterParaTempo?.(0) ?? "00:00:00",
        disponivelTxt: converterParaTempo?.(0) ?? "00:00:00",
        indisponivelTxt: converterParaTempo?.(0) ?? "00:00:00",
        onlineTxt: converterParaTempo?.(0) ?? "00:00:00",
      };
      // Preenche TempoPausas se existir
      if (typeof TempoPausas === "object" && TempoPausas !== null) {
        TempoPausas.Trabalhando = vazio.trabalhandoTxt;
        TempoPausas.Disponivel = vazio.disponivelTxt;
        TempoPausas.Indisponivel = vazio.indisponivelTxt;
        TempoPausas.Online = vazio.onlineTxt;
      }
      return vazio;
    }

    let totalTrabalhandoSeg = 0;
    let totalDisponivelSeg = 0;
    let totalIndisponivelSeg = 0;
    TempoPausas.Atendidas = 0;

    for (const item of arr) {
      // Ignora itens inválidos
      if (item.id === 0) continue;

      // Apura segundos do item
      const s = converterParaSegundos?.(item?.duracao);
      const seg = Number.isFinite(s) ? s : 0;

      // Classificação
      if (NorTX(item?.pausa) === "TRABALHANDO") {
        totalTrabalhandoSeg += seg;
        TempoPausas.Atendidas += 1;
      } else if (NorTX(item?.pausa) === "DISPONIVEL") {
        // Side-effect (intencional)
        try {
          UltimoDisponivel?.(item);
        } catch (e) {
          /* evita quebrar soma */
        }
        totalDisponivelSeg += seg;
      } else {
        // Qualquer outra pausa cai como "Indisponível"
        totalIndisponivelSeg += seg;
      }
    }

    const onlineSeg =
      totalTrabalhandoSeg + totalDisponivelSeg + totalIndisponivelSeg;

    const result = {
      trabalhandoSeg: totalTrabalhandoSeg,
      disponivelSeg: totalDisponivelSeg,
      indisponivelSeg: totalIndisponivelSeg,
      onlineSeg,

      // Representação em texto
      trabalhandoTxt: converterParaTempo?.(totalTrabalhandoSeg) ?? "00:00:00",
      disponivelTxt: converterParaTempo?.(totalDisponivelSeg) ?? "00:00:00",
      indisponivelTxt: converterParaTempo?.(totalIndisponivelSeg) ?? "00:00:00",
      onlineTxt: converterParaTempo?.(onlineSeg) ?? "00:00:00",
    };

    // Preenche objeto global se existir
    if (typeof TempoPausas === "object" && TempoPausas !== null) {
      TempoPausas.Trabalhando = result.trabalhandoTxt;
      TempoPausas.Disponivel = result.disponivelTxt;
      TempoPausas.Indisponivel = result.indisponivelTxt;
      TempoPausas.Online = result.onlineTxt;
    }

    Hlog(`TempoPausas: 
      Trabalhando = ${TempoPausas.Trabalhando}/
      Disponivel = ${TempoPausas.Disponivel}/
      Indisponivel = ${TempoPausas.Indisponivel}/
      Online = ${TempoPausas.Online}
      
      `);

    return result;
  }

  async function UltimoDisponivel(item) {
    const inicioObj = await getValorDadosPausa(item?.id, "inicio"); // { data, hora } ou undefined
    const duracaoObj = await getValorDadosPausa(item?.id, "duracao"); // "HH:MM:SS" ou "---"
    const fimObj = await getValorDadosPausa(item?.id, "fim"); // { data, hora } ou undefined
    if (!duracaoObj) return;
    // Efeito colateral explícito (mantido, mas isolado do somatório)
    await AddouAtualizarPausas(
      0,
      "Disponivel",
      inicioObj, // início
      fimObj, // fim
      duracaoObj, // duração
    );
  }

  /**
   * exibirHora(a, op, b)
   * a: {hora:"HH:MM:SS", data:"YYYY-MM-DD" | "DD/MM/YYYY"}
   * b: {hora:"HH:MM:SS", data:"YYYY-MM-DD" | "DD/MM/YYYY"}
   * op: 1 para soma (a + b), 0 para subtração (a - b)
   * Retorna: {hora:"HH:MM:SS", data:"(mesmo formato de a)"}
   */
  function exibirAHora(a, op, b) {
    const pad2 = (n) => String(n).padStart(2, "0");

    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    const isBR = (d) => /^\d{2}\/\d{2}\/\d{4}$/.test(d);

    function parseDate(d) {
      if (isISO(d)) {
        const [Y, M, D] = d.split("-").map(Number);
        return new Date(Y, M - 1, D);
      }
      if (isBR(d)) {
        const [D, M, Y] = d.split("/").map(Number);
        return new Date(Y, M - 1, D);
      }
      throw new Error(
        `Formato de data inválido "${d}". Use YYYY-MM-DD ou DD/MM/YYYY .`,
      );
    }

    function formatDate(date, keepISO) {
      const Y = date.getFullYear();
      const M = pad2(date.getMonth() + 1);
      const D = pad2(date.getDate());
      return keepISO ? `${Y}-${M}-${D}` : `${D}/${M}/${Y}`;
    }

    function parseTime(h) {
      if (!/^\d{2}:\d{2}:\d{2}$/.test(h)) {
        throw new Error(`Formato de hora inválido "${h}". Use HH:MM:SS.`);
      }
      const [HH, MM, SS] = h.split(":").map(Number);
      if (HH < 0 || HH > 23 || MM < 0 || MM > 59 || SS < 0 || SS > 59) {
        throw new Error("Hora fora do intervalo válido.");
      }
      return { HH, MM, SS };
    }

    function toEpochMs(obj) {
      const dt = parseDate(obj.data);
      const { HH, MM, SS } = parseTime(obj.hora);
      dt.setHours(HH, MM, SS, 0); // local time
      return dt.getTime();
    }

    if (typeof op !== "number" || (op !== 0 && op !== 1)) {
      throw new Error(
        "Operação inválida. Use 1 para soma ou 0 para subtração.",
      );
    }

    const keepISO = isISO(a.data);
    const epochA = toEpochMs(a);
    const epochB = toEpochMs(b);

    let outHora, outData;

    if (op === 1) {
      // Soma: adiciona o "tempo" de b como delta a 'a'
      const midnightB = new Date(parseDate(b.data));
      midnightB.setHours(0, 0, 0, 0);
      const deltaB = toEpochMs(b) - midnightB.getTime(); // ms desde meia-noite
      const resultDate = new Date(epochA + deltaB);
      outHora = `${pad2(resultDate.getHours())}:${pad2(
        resultDate.getMinutes(),
      )}:${pad2(resultDate.getSeconds())}`;
      outData = formatDate(resultDate, keepISO);
    } else {
      // Subtração (delta de tempo): usa UTC para evitar offset do fuso
      let diffMs = epochA - epochB;
      const sign = diffMs < 0 ? -1 : 1;
      diffMs = Math.abs(diffMs);

      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);

      // Se quiser sinal, pode incorporar ao formato. Aqui retornamos só o valor absoluto.
      outHora = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

      // Para delta, manter a data de 'a' (ou escolha outra regra, se preferir)
      outData = a.data;
    }

    return { hora: outHora, data: outData };
  }

  function exibirHora(horaedataparacalculo, maisoumenos, valordeacrecimo) {
    // --- Parsers de data/hora flexíveis ---
    function parseDateFlexible(dateStr) {
      const s = String(dateStr || "").trim();

      // YYYY-MM-DD
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return { year: +m[1], month: +m[2], day: +m[3] };

      // DD/MM/YYYY
      m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return { year: +m[3], month: +m[2], day: +m[1] };

      return null;
    }

    function parseTimeFlexible(timeStr) {
      const m = String(timeStr || "")
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (!m) return { hh: 0, mm: 0, ss: 0 };
      return { hh: +m[1], mm: +m[2], ss: m[3] ? +m[3] : 0 };
    }

    // --- Constrói Date a partir de {data, hora} ---
    function buildDateTime(obj) {
      const d = parseDateFlexible(obj?.data || "");
      const t = parseTimeFlexible(obj?.hora || "00:00:00");
      if (!d) return new Date(); // fallback: agora

      let { year, month, day } = d;
      let { hh, mm, ss } = t;

      // Trate "24:00:00" como 00:00:00 do dia seguinte
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

    // --- Offset string "+HH:MM[:SS]" | "-HH:MM[:SS]" => segundos ---
    function parseOffset(offsetStr) {
      const m = String(offsetStr || "").match(
        /^([+-])(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
      );
      if (!m) return 0;
      const sign = m[1] === "-" ? -1 : 1;
      const h = +m[2],
        mi = +m[3],
        s = m[4] ? +m[4] : 0;
      return sign * (h * 3600 + mi * 60 + s);
    }

    // --- Duração em segundos a partir de string ou objeto absoluto ---
    // String "HH:MM[:SS]" => duração direta
    // Objeto {data, hora} => usa a diferença ABS entre val e base (1º parâmetro)
    function durationFromAbsoluteOrString(val, baseObj) {
      if (typeof val === "string") {
        const t = parseTimeFlexible(val);
        return t.hh * 3600 + t.mm * 60 + t.ss;
      }
      if (typeof val === "object" && val) {
        const dVal = buildDateTime(val);
        const dBase = buildDateTime(
          baseObj || { data: "1970-01-01", hora: "00:00:00" },
        );
        return Math.abs(Math.floor((dVal.getTime() - dBase.getTime()) / 1000));
      }
      return 0;
    }

    // --- Formata retorno {data:'YYYY-MM-DD', hora:'HH:MM:SS'} em fuso local ---
    function formatObj(date) {
      const data = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const hora = `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
      return { data, hora };
    }

    // --- Determina offset em segundos ---
    let offsetSec = 0;

    // Caso 1: maisoumenos é uma offset string e não há 3º parâmetro
    if (typeof maisoumenos === "string" && valordeacrecimo === undefined) {
      offsetSec = parseOffset(maisoumenos);
    } else {
      // Caso 2: sinal via maisoumenos (false/0/"0" => negativo; demais => positivo)
      const dur = durationFromAbsoluteOrString(
        valordeacrecimo || "00:00:00",
        horaedataparacalculo,
      );
      const isNegative =
        maisoumenos === false ||
        (typeof maisoumenos === "number" && Number(maisoumenos) === 0) ||
        (typeof maisoumenos === "string" && maisoumenos === "0");
      const sign = isNegative ? -1 : 1;
      offsetSec = sign * dur;
    }

    const base = buildDateTime(horaedataparacalculo);
    const adjusted = new Date(base.getTime() + offsetSec * 1000);
    return formatObj(adjusted);
  }

  function CriarBotInicial() {
    const div = document.createElement("div");
    div.id = "BotInicial";
    div.style.cssText = `
    width: auto;
    height: 20px;
    position: absolute;
    top: 12px;
    right: 80px;
    border-radius: 15px;
    border: 1px solid;
    border-color: ${Ccor.AreaAr};
    cursor: pointer;
    font-size: 14px;
    padding: 0px 4px;
    background-color: white;
    color: ${Ccor.AreaAr};
    `;
    div.addEventListener("mouseover", () => contr(1));
    div.addEventListener("mouseout", () => contr(0));

    function contr(a) {
      div.style.backgroundColor = stt.Estouro
        ? Ccor.Erro
        : a
          ? Ccor.AreaAr
          : "white";
      div.style.color = stt.Estouro || a ? "white" : Ccor.AreaAr;
      div.style.borderColor = stt.Estouro || a ? "" : Ccor.AreaAr;
    }

    div.addEventListener("click", () => {
      const FlutOB = document.getElementById("FlutOB");
      if (FlutOB) {
        PosicaoRecFaixa();

        stt.AbaPausas = 0;
        stt.AbaConfig = 0;
        FlutOB.remove();
      } else {
        criarObjetoFlutuante();
        BotoesLateral();
        PosicaoFaixa();
      }
    });
    document.body.appendChild(div);
  }

  function criarObjetoFlutuante(options = {}) {
    if (document.getElementById("FlutOB")) return;

    // usar QualLado para base "left" ou "right": 1 = left, 0 = right
    // Se quiser que seja totalmente automático, deixe como null
    let QualLado =
      typeof options.QualLado === "number" ? options.QualLado : null;

    const div = document.createElement("div");
    div.id = "FlutOB";
    const posicao = config.FaixaVerti ? "posicaoV" : "posicaoH";

    Object.assign(div.style, {
      position: "fixed",
      top: config[posicao].top,
      right: config[posicao].right,
      left: config[posicao].left,
      zIndex: "101",
      boxSizing: "border-box",
      userSelect: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      color: "white",
      fontSize: "12px",
    });

    const handle = document.createElement("div"); // Área para arrastar
    handle.id = "AreaArrast";
    Object.assign(handle.style, {
      backgroundColor: Ccor.AreaAr,
      cursor: "grab",
      borderRadius: "15px",
      touchAction: "none",
      display: "flex",
      alignItems: "center",
      transition: "all 0.5s ease",
      width: "64%",
      height: "6px",
      marginBottom: "-6px",
      zIndex: "1",
    });

    // -----
    // Estados do arrasto
    let dragging = false;
    let startX = 0; // posição do cursor ao iniciar arrasto
    let startY = 0;
    let startLeft = 0; // left/top do elemento ao iniciar arrasto
    let startTop = 0;

    // Helper: garante que o elemento tenha top/left explícitos (converte de bottom/right se necessário)
    function ensureTopLeft() {
      const rect = div.getBoundingClientRect();
      if (!div.style.top) {
        div.style.top = `${rect.top}px`;
      }
      // Converte qualquer base em right para left temporariamente (somente durante arraste)
      if (!div.style.left || div.style.right) {
        const computedLeft = rect.left; // relativo à viewport
        div.style.left = `${computedLeft}px`;
      }
      // Limpa outras âncoras que conflitem com arraste por left/top
      div.style.bottom = "";
      div.style.right = "";
      div.style.transform = "";
    }

    // Helper: limita o valor entre min e max
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // Decide e aplica qual lado será a âncora final (left ou right)
    function applySideAnchor(forceSide = null) {
      const rect = div.getBoundingClientRect();
      const vw = window.innerWidth;

      // Se forceSide for 1 = left; 0 = right; null = auto por viewport
      let useLeft;
      if (forceSide === 1) useLeft = true;
      else if (forceSide === 0) useLeft = false;
      else {
        const centerX = rect.left + rect.width / 2;
        useLeft = centerX <= vw / 2; // centro do elemento está na metade esquerda?
      }

      // Calcula valores e aplica
      if (useLeft) {
        const left = Math.round(rect.left);
        div.style.left = `${left}px`;
        div.style.right = ""; // limpa para não conflitar
        if (config.FaixaVerti) config.LadoBot = 1;
      } else {
        // right = distância da borda direita da viewport
        const right = Math.round(vw - (rect.left + rect.width));
        div.style.right = `${right}px`;
        div.style.left = ""; // limpa para não conflitar
        if (config.FaixaVerti) config.LadoBot = 0;
      }

      // Garante top (sempre por top)
      div.style.top = `${Math.round(rect.top)}px`;
      div.style.bottom = "";
    }

    function onPointerDown(e) {
      // Durante o arraste trabalhamos com left/top absolutos
      ensureTopLeft();

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;

      // Posição inicial do elemento
      startLeft = parseFloat(div.style.left) || 0;
      startTop = parseFloat(div.style.top) || 0;

      handle.style.cursor = "grabbing";
      div.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Dimensões visíveis
      const maxLeft = window.innerWidth - div.offsetWidth;
      const maxTop = window.innerHeight - div.offsetHeight;

      const newLeft = clamp(startLeft + dx, 0, Math.max(0, maxLeft));
      const newTop = clamp(startTop + dy, 0, Math.max(0, maxTop));

      // Durante o arraste: left/top (base única)
      div.style.left = `${newLeft}px`;
      div.style.top = `${newTop}px`;
      // Garante que right esteja limpo enquanto arrasta
      div.style.right = "";
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
      div.releasePointerCapture?.(e.pointerId);

      // Ao soltar: decide automaticamente o lado (ou force QualLado se definido)
      applySideAnchor(QualLado);
    }

    // Reajusta posição e âncora caso a janela seja redimensionada
    function onResize() {
      if (!div.isConnected) {
        window.removeEventListener("resize", onResize);
        return;
      }

      // Pega retângulo atual e reancora mantendo lado escolhido
      // Se já está ancorado à direita (tem right), recalcula o right
      const rect = div.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Ajuste vertical
      let top = rect.top;
      top = clamp(top, 0, Math.max(0, vh - rect.height));
      div.style.top = `${Math.round(top)}px`;

      // Decide novamente o lado (auto ou forçado)
      applySideAnchor(QualLado);
    }

    // Expor uma API simples para mudar o lado via console:
    //   window.setFlutOBSide(1) => força left
    //   window.setFlutOBSide(0) => força right
    //   window.setFlutOBSide(null) => volta para auto por viewport
    window.setFlutOBSide = function (val) {
      if (val !== 0 && val !== 1 && val !== null) {
        console.warn("Use 1 (left), 0 (right) ou null (auto).");
        return;
      }
      QualLado = val;
      applySideAnchor(QualLado);
    };

    // Eventos
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

    // Após inserir no DOM:
    // 1) Garante posição top/left válida
    ensureTopLeft();
    // 2) Ajusta para a âncora correta (auto por viewport ou forçado)
    applySideAnchor(QualLado);
  }

  function AdicionarCaixaAtualizada() {
    // Função para criar a classe dinamicamente
    function criarClasse() {
      const style = document.createElement("style");
      style.type = "text/css";
      style.id = "MeuEstiloLogin";
      style.innerHTML = `
      #FlutOB,
      #FlutOB * {
         box-sizing: border-box;
      }
            .info-caixa {
                text-align: center;
            }
            .separadorC {
                width: 100%;
                height: 1px;
                background: #ffffffff;
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
    const data = criarCaixaDCv("c", "DataX");

    // Cria um contêiner para agrupar as caixas
    const container = document.createElement("div");
    container.id = "contValores";
    container.style.cssText = `
        display: flex;
        opacity: 1;
        padding: 6px;
        align-items: center;
        justify-content: space-evenly;
        transition: all 0.5s ease;
        border-radius: 15px;
        visibility: visible;
        overflow: hidden;
        border: 1px solid white;
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
    container.appendChild(criarSeparadorCV(5));
    container.appendChild(data);

    // Cria um contêiner principal para agrupar tudo
    const minhaCaixa = document.createElement("div");
    minhaCaixa.setAttribute("id", "minhaCaixa");
    minhaCaixa.style.cssText = `
        
        display: flex;
        background-color: ${Ccor.Principal};
        padding: 3px;
        border-radius: 8px;
        transition: all 0.5s ease;
        align-items: center;
        `;

    // Adiciona o contêiner ao contêiner principal

    // Adiciona o evento de mouseover ao botão
    minhaCaixa.addEventListener("mouseover", function () {
      BotPacontrole(1, "ContPaCo");
    });

    // Adiciona o evento de mouseout ao botão
    minhaCaixa.addEventListener("mouseout", function () {
      BotPacontrole(0, "ContPaCo");
    });
    function BotPacontrole(b, z) {
      const x = stt.AbaPausas || stt.AbaConfig || stt.AbaOutros ? 1 : b;

      const a = document.getElementById(z);

      if (config.LadoBotAnterior !== config.LadoBot) {
        BotoesLateral();
        config.LadoBotAnterior = config.LadoBot;
      }

      const c = document.getElementById("AreaArrast");
      if (c)
        if (a) {
          a.style.opacity = x ? "1" : "0";
          a.style.visibility = x ? "visible" : "hidden";

          a.style.marginLeft = config.FaixaVerti
            ? config.LadoBot
              ? x
                ? "5px"
                : "-20px"
              : ""
            : config.LadoBot
              ? ""
              : "auto";
          a.style.marginRight = config.FaixaVerti
            ? config.LadoBot
              ? ""
              : x
                ? "5px"
                : "-20px"
            : config.LadoBot
              ? "auto"
              : "";

          a.style.marginTop = config.FaixaVerti ? "" : x ? "5px" : "-20px";
        }
    }
    const Divbot = document.createElement("div");
    Divbot.id = "ContPaCo";
    Divbot.style.cssText = `
      margin-left: -20px;
      opacity: 0;
      visibility: hidden;
      transition: 0.5s;
      display: flex;
      gap: 5px;
      
    `;

    Divbot.appendChild(ADDBotConfig());
    Divbot.appendChild(ADDBotPa());
    Divbot.appendChild(ADDBotOutr());

    minhaCaixa.appendChild(container);
    minhaCaixa.appendChild(Divbot);

    return minhaCaixa;
  }

  function BotoesLateral() {
    const a = document.getElementById("minhaCaixa");
    if (!a) return;
    a.style.flexDirection = config.FaixaVerti ? "" : "column";

    const ContPaCo = document.getElementById("ContPaCo");
    if (ContPaCo) {
      ContPaCo.style.marginTop = !config.FaixaVerti ? "-20px" : "";
      ContPaCo.style.flexDirection = config.FaixaVerti ? "column" : "";
      ContPaCo.style.justifyContent = config.FaixaVerti ? "center" : "";
    }

    a.style.alignItems = !config.FaixaVerti ? "center" : "";

    ["BConfig", "BPausa", "BOutr"].forEach((x) => {
      const o = document.getElementById(x);
      if (!o) return;
      if (!stt.Encontrado) o.textContent = o.textContent.trim()[0];

      o.style.height = config.FaixaVerti ? "" : "20px";
      o.style.width = config.FaixaVerti ? "20px" : "";
      o.style.writingMode = config.FaixaVerti
        ? config.LadoBot
          ? "vertical-lr"
          : "sideways-lr"
        : "";
      o.style.marginLeft = !config.LadoBot && config.FaixaVerti ? "auto" : "";
    });
    const FlutOB = document.getElementById("FlutOB");

    const contValores = document.getElementById("contValores");

    if (contValores) {
      contValores.style.flexDirection = config.FaixaVerti ? "column" : "";
      contValores.style.width = stt.Encontrado
        ? config.FaixaVerti
          ? "60px"
          : "280px"
        : "";
    }
    if (config.FaixaVerti) {
      if (contValores && ContPaCo)
        a.insertBefore(
          config.LadoBot ? contValores : ContPaCo,
          config.LadoBot ? ContPaCo : contValores,
        );
    } else {
      if (contValores && ContPaCo) a.insertBefore(contValores, ContPaCo);
    }
  }

  function PosicaoRecFaixa() {
    const FlutOB = document.getElementById("FlutOB");
    if (FlutOB) {
      const posicao = config.FaixaVerti ? "posicaoV" : "posicaoH";
      config[posicao].top = FlutOB.style.top;
      config[posicao].right = FlutOB.style.right;
      config[posicao].left = FlutOB.style.left;
    }
  }

  function PosicaoFaixa() {
    document.querySelectorAll(".separadorC").forEach((a) => {
      a.style.height = config.FaixaVerti ? "1px" : "stretch";
      a.style.width = config.FaixaVerti ? "100%" : "1px";
      a.style.margin = config.FaixaVerti ? "2px" : "5px";
    });
    const b = document.getElementById("contValores");
    if (b) b.style.flexDirection = config.FaixaVerti ? "column" : "";

    const c = document.getElementById("minhaCaixa");
    if (c) c.style.flexDirection = !config.FaixaVerti ? "column" : "";

    const FlutOB = document.getElementById("FlutOB");
    if (FlutOB) {
      const posicao = config.FaixaVerti ? "posicaoV" : "posicaoH";
      FlutOB.style.top = config[posicao].top;
      FlutOB.style.right = config[posicao].right;
      FlutOB.style.left = config[posicao].left;
    }
  }

  // Data/hora local coerente (YYYY-MM-DD + HH:MM:SS)
  function gerarDataHora() {
    const agora = new Date();
    const offsetStr = config.TesteHora ? config.valorTeste : "-03:00";

    // --- parse do offset para minutos ---
    function parseOffsetToMinutes(s) {
      if (!s) return null; // vazio -> poderia usar offset local, se quiser
      if (s === "Z" || s === "z") return 0; // UTC

      const m = s.trim().match(/^([+-])(\d{2})(?::?(\d{2}))?$/); // ±HH ou ±HH:MM (":" opcional)
      if (!m) {
        throw new Error(
          `Offset inválido "${m}". Use "Z" ou formatos ±HH ou ±HH:MM, ex.: "-03:00", "+05:30"`,
        );
      }
      const sign = m[1] === "-" ? -1 : 1;
      const hh = parseInt(m[2], 10);
      const mm = m[3] ? parseInt(m[3], 10) : 0;
      if (hh > 23 || mm > 59) {
        throw new Error(
          "Offset fora do intervalo. HH deve ser 00..23 e MM 00..59.",
        );
      }
      return sign * (hh * 60 + mm);
    }

    const offsetMin = parseOffsetToMinutes(offsetStr);

    // Converte "agora" (UTC) para horário no offset desejado:
    // localAlvo = UTC + offset
    const tsAlvo = agora.getTime() + offsetMin * 60_000;
    const alvo = new Date(tsAlvo);

    // IMPORTANTE: após aplicar o offset no timestamp, usamos getters UTC
    // para não aplicar offset novamente.
    const ano = alvo.getUTCFullYear();
    const mes = String(alvo.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(alvo.getUTCDate()).padStart(2, "0");
    const hh = String(alvo.getUTCHours()).padStart(2, "0");
    const mi = String(alvo.getUTCMinutes()).padStart(2, "0");
    const ss = String(alvo.getUTCSeconds()).padStart(2, "0");

    const data = `${ano}-${mes}-${dia}`; // YYYY-MM-DD
    const hora = `${hh}:${mi}:${ss}`; // HH:MM:SS

    return { hora, data };
  }

  function verificarMouse(ids, mostrar) {
    const exibir = !!mostrar; // garante booleano

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue; // se não existir, apenas pulaa

      el.style.display = exibir ? "block" : "none";
    }
  }

  function horarios(logou, logado) {
    const agora = gerarDataHora();

    //Hlog(`logado:${JSON.stringify(logado)}`);

    let LogouCalc = logou ? logou : exibirHora(agora, 0, logado);
    let LogadoCalc = !logou ? logado : exibirAHora(agora, 0, LogouCalc).hora;

    //Hlog(`Logou:${JSON.stringify(Logou)}`);

    const Saida = exibirHora(LogouCalc, 1, config.TempoEscaladoHoras);

    //Hlog(`Saida:${JSON.stringify(Saida)}`);
    //Hlog(`agora:${JSON.stringify(agora)}`);

    const Falta = exibirAHora(Saida, 0, agora).hora;

    //Hlog(`Falta:${JSON.stringify(Falta)}`);

    return {
      Logou: LogouCalc,
      Saida: Saida,
      Logado: LogadoCalc,
      Falta: Falta,
    };
  }

  // Atualiza o timer a cada segundo
  setInterval(() => {
    //Hodeb("Tick do timer iniciado");

    const time = document.getElementById("vTMA");
    const titulo = document.getElementById("tTMA");
    const vLogou = document.getElementById("vLogou");
    const vSaida = document.getElementById("vSaida");
    const vLogado = document.getElementById("vLogado");
    const tFalta = document.getElementById("tFalta");
    const vFalta = document.getElementById("vFalta");
    const InfoV = document.getElementById("InfoV");
    const ContPaCo = document.getElementById("ContPaCo");
    const BotInicial = document.getElementById("BotInicial");

    const el = encoStatus();
    Hodeb("Estado do agente", el);

    if (el) {
      TempoPausas.ContAtual = el.Timer;

      const ozero = document.querySelector(".phone-active__queue");

      const segunda = ozero ? ozero.textContent.trim().split(/\s+/)[1] : "";

      const terc = `${el.Status} ${segunda}`;

      if (BotInicial)
        BotInicial.textContent = stt.Encontrado
          ? el.Pausa
            ? `${terc} > ${el.Pausa}`
            : terc
          : "Nada Encontrado";
    } else {
      Hodeb("Tempo do agente não encontrado", el);
    }

    stt.Encontrado = stt.Status === "---" ? 0 : 1;
    Hodeb("Status encontrado:", stt.Encontrado, "Status:", stt.Status);

    if (!time || !titulo || !vLogou || !vSaida || !vLogado || !vFalta) {
      /*Hwarn("Elementos obrigatórios não encontrados no DOM", {
        time,
        titulo,
        vLogou,
        vSaida,
        vLogado,
        vFalta,
      });*/
      return;
    }

    const agora = gerarDataHora();
    //Hodeb("Hora atual", agora);

    if (config.TesteHora) {
      const tDataX = document.getElementById("tDataX");
      const vDataX = document.getElementById("vDataX");

      if (!tDataX || !vDataX) {
        Hwarn("TesteHora ativo mas elementos não encontrados");
      } else {
        tDataX.textContent = agora.data;
        vDataX.textContent = agora.hora;
      }
    }

    let tma =
      TempoPausas.Atendidas > 0
        ? converterParaSegundos(TempoPausas.Trabalhando) / TempoPausas.Atendidas
        : 0;

    Hodeb("Cálculo TMA", {
      Trabalhando: TempoPausas.Trabalhando,
      Atendidas: TempoPausas.Atendidas,
      TMA: tma,
    });

    atualizarComoff(
      tma > config.ValorMetaTMA && config.MetaTMA && stt.Encontrado,
      Ccor.MetaTMA,
      "cTMA",
    );

    titulo.textContent = stt.Encontrado ? "TMA" : "Não";
    time.textContent = stt.Encontrado ? Math.floor(tma) : "Encontrado";

    if (!InfoV) {
      //Hwarn("InfoV não encontrado");
    } else if (
      stt.Encontrado ||
      config.LogueManual ||
      stt.AbaPausas ||
      stt.AbaConfig
    ) {
      ContPaCo.style.minHeight = "164px";
      InfoV.style.display = "";
    } else {
      InfoV.style.display = "none";
      ContPaCo.style.minHeight = "";
    }

    verificarMouse(
      [
        "cLogou",
        "SepCVal1",
        "cSaida",
        "SepCVal3",
        "cLogado",
        "SepCVal4",
        "cFalta",
      ],
      stt.Encontrado || config.LogueManual,
    );

    verificarMouse(
      ["SepCVal2"],
      config.LogueManual && stt.Encontrado ? 1 : stt.Encontrado ? 1 : 0,
    );

    verificarMouse(["cTMA"], !config.LogueManual || stt.Encontrado);
    verificarMouse(["SepCVal5", "cDataX"], config.TesteHora);

    //const el = obterEstadoAgenteComoObjeto();

    if (TempoPausas.Online === undefined) TempoPausas.Online = "00:00:00";

    const onli2 =
      converterParaSegundos(TempoPausas.Online) +
      converterParaSegundos(TempoPausas.ContAtual);

    const onli4 = converterParaTempo(onli2);

    Hodeb(`Andamento Online ContAtual: ${TempoPausas.ContAtual}/
       onli4: ${onli4}/
       onli2: ${onli2}/
      `);

    const QLogou = config.LogueManual
      ? dadosLogueManu
      : config.logueSalvo
        ? dadosPrimLogue
        : null;

    const horafun = horarios(QLogou, onli4);

    TempoPausas.Logou = horafun.Logou.hora;
    TempoPausas.LogouA = horafun.Logou;

    TempoPausas.Saida = horafun.Saida.hora;

    vLogou.textContent = TempoPausas.Logou;

    vSaida.textContent = TempoPausas.Saida;

    const onli3 = exibirAHora(agora, 0, horafun.Logou).hora;
    //TempoPausas.Online = onli2;

    const compTole = converterParaSegundos(onli3) - onli2;
    if (compTole > config.TolerOff) {
      Hodeb(
        "Logado pelo Logue maior que pela tolerancia",
        converterParaTempo(compTole),
      );
      TempoPausas.Falta = horafun.Falta;
    } else {
      TempoPausas.Falta = converterParaTempo(
        converterParaSegundos(horafun.Falta) + compTole,
      );
    }

    TempoPausas.Logado = horafun.Logado;

    const oLogou = document.getElementById("oLogou");
    const oSaida = document.getElementById("oSaida");

    oLogou.textContent = config.TesteHora ? horafun.Logou.data : "";
    oSaida.textContent = config.TesteHora ? horafun.Saida.data : "";

    if (
      !config.LogueManual &&
      config.logueSalvo &&
      dadosPrimLogue &&
      compararDatas(dadosPrimLogue, horafun.Logou)
    ) {
      if (stt.verificarDurac) {
        Hlog("Atualizando dadosPrimLogue");
        dadosPrimLogue = horafun.Logou;
        verifiDataLogue(1, horafun.Logou);
        stt.verificarDurac = 0;
      }
      somarDuteracoesGeral();
      stt.verificarDurac = 1;
    }

    const duracaoContAtr = document.getElementById("duracaoContAtr");
    if (duracaoContAtr)
      duracaoContAtr.textContent = tempoEncurtado(
        calcularDuracao(AntFim.inicio, agora),
      );

    /*if (!config.LogueManual) {
      if (
        !DDPausa.inicioUltimaP ||
        !DDPausa.inicioUltimaP.data ||
        !stt.Encontrado
      ) {
        Hwarn("Retorno antecipado por pausa ou status inválido", {
          DDPausa,
          stt,
        });
        return;
      }
    }*/

    Hodeb("Online : ", TempoPausas.Online);
    Hodeb("ContAtual : ", converterParaSegundos(TempoPausas.ContAtual));
    Hodeb("Falta : ", TempoPausas.Falta);
    Hodeb("Logado : ", TempoPausas.Logado);

    vLogado.textContent = tempoEncurtado(TempoPausas.Logado);

    if (compararDatas(agora, exibirHora(horafun.Saida, 1, "00:10:00"))) {
      stt.temHorasExtras = 1;
      stt.tempoCumprido = 0;
    } else if (compararDatas(agora, horafun.Saida)) {
      stt.tempoCumprido = 1;
      stt.temHorasExtras = 0;
    } else {
      stt.tempoCumprido = 0;
      stt.temHorasExtras = 0;
    }

    tFalta.textContent = stt.temHorasExtras
      ? "HE"
      : stt.tempoCumprido
        ? "Tempo"
        : "Falta:";

    vFalta.textContent = stt.tempoCumprido
      ? "Cumprido"
      : tempoEncurtado(TempoPausas.Falta);

    if (config.pausalimitada && config.notiEstouro) {
      stt.Estouro = TempoPausas.Estouro
        ? compararDatas(agora, TempoPausas.Estouro)
        : 0;

      if (!stt.Estour1 && stt.Estouro && config.SomEstouro) {
        Hwarn("Estouro de pausa detectado");
        stt.Estour1 = 1;
        tocarBeep();
        setTimeout(RepetirBeep, 15000);
      }
    }

    Hodeb("Tick finalizado com sucesso");
  }, 1000);

  function atualizarComoff(ar, cor, caixa) {
    var x = document.getElementById(caixa);
    if (x) {
      x.style.background = ar ? cor : "";
      x.style.borderRadius = ar ? "6px" : "";
      x.style.padding = ar ? "0px 4px" : "";
      x.style.margin = ar ? "0px -4px" : "";
    }
  }

  function compararDatas(a, b) {
    // Validação básica
    if (!a?.data || !a?.hora || !b?.data || !b?.hora) {
      throw new Error(
        "Objetos precisam ter {data: 'YYYY-MM-DD', hora: 'HH:MM:SS'}",
      );
    }

    // Usa horário local (interpretação padrão do JS para strings ISO sem timezone)
    const da = new Date(`${a.data}T${a.hora}`);
    const db = new Date(`${b.data}T${b.hora}`);

    // Verifica se datas são válidas
    if (isNaN(da) || isNaN(db)) {
      throw new Error(
        "Data/hora inválidas. Formato esperado: 'YYYY-MM-DD' e 'HH:MM:SS'.",
      );
    }

    return da.getTime() > db.getTime();
  }

  async function AddouAtualizarPausas(id, pausa, inicio, fim, duracao) {
    const novoItem = { id, pausa, inicio, fim, duracao };

    if (!Array.isArray(dadosdePausas)) dadosdePausas = [];

    const index = dadosdePausas.findIndex(
      (item) => String(item?.id) === String(id),
    );

    if (index !== -1) {
      dadosdePausas[index] = { ...dadosdePausas[index], ...novoItem };
    } else {
      dadosdePausas.push(novoItem);
    }

    await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
  }

  function normalizarCampo(campo) {
    // remove acentos e padroniza
    const c = String(campo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .trim()
      .toLowerCase();

    // mapeia para o padrão final
    if (c === "inicio") return "inicio";
    if (c === "fim") return "fim";
    if (c === "duracao" || c === "duracao") return "duracao";
    if (c === "pausa") return "pausa";

    // se vier outro campo qualquer, usa como está (sem acento e lower)
    return c;
  }

  function buildDateTime(obj) {
    const [y, m, d] = String(obj?.data || "")
      .split("-")
      .map(Number);
    const [hh = 0, mm = 0, ss = 0] = String(obj?.hora || "00:00:00")
      .split(":")
      .map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  function formatHHMMSS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function calcularDuracao(inicioObj, fimObj) {
    const inicio = buildDateTime(inicioObj);
    const fim = buildDateTime(fimObj);
    const diffSec = Math.round((fim.getTime() - inicio.getTime()) / 1000);
    return formatHHMMSS(diffSec);
  }

  function normalizarArrayPausas(valor) {
    if (Array.isArray(valor)) return valor;
    if (valor === false || valor == null) return [];
    if (typeof valor === "object") return Object.values(valor);
    return [];
  }

  async function atualizarCampos(id, campo, valor) {
    dadosdePausas = normalizarArrayPausas(dadosdePausas);

    const c = normalizarCampo(campo); // "inicio" | "fim" | "duracao" | ...
    const idKey = String(id);

    const index = dadosdePausas.findIndex((item) => String(item?.id) === idKey);

    if (index !== -1) {
      dadosdePausas[index][c] = valor;
    } else {
      const novoItem = { id };
      novoItem[c] = valor;
      dadosdePausas.push(novoItem);
    }

    try {
      await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
    } catch (err) {
      Herror("Erro ao atualizar campos no IndexedDB:", err);
    }

    if (c === "duracao") {
      Hodeb("Tabela salva:", ChavePausas);
    }
  }

  function getValorDadosPausa(id, campo) {
    if (!dadosdePausas) return null;
    const item = dadosdePausas.find((obj) => String(obj?.id) === String(id));
    // Usa indexação dinâmica e retorna null se não existir
    return item ? (item?.[campo] ?? null) : null;
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
      Herror("Erro ao abrir o banco de dados:", event.target.errorCode);
    };
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
            divPai.style.cssText = `max-width: 200px;`;
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
                }),
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
        Herror("Erro ao listar as chaves:", event.target.errorCode);
      };
    });
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
            Hodeb(`Dados salvos com sucesso na chave "${nomechave}"`);
            resolve(true);
          };

          request.onerror = function (event) {
            Herror(
              "Erro ao salvar os dados:",
              event.target?.errorCode || event,
            );
            reject(event);
          };
        });
      } catch (err) {
        Herror("AddOuAtuIindexdb erro:", err);
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
   * ApagarChaveIndexDB - deleta uma chave do IndexedDB
   * @param {string} nomechave - chave a deletar
   */
  function ApagarChaveIndexDB(nomechave) {
    abrirDB(function (db) {
      const transacao = db.transaction([StoreBD], "readwrite");
      const store = transacao.objectStore(StoreBD);
      const request = store.delete(nomechave);

      request.onsuccess = function () {
        Hlog(`Chave "${nomechave}" apagada com sucesso.`);
      };

      request.onerror = function (event) {
        Herror("Erro ao apagar a chave:", event.target.errorCode);
      };
    });
  }

  /**
   * criarSeparadorCV - cria um separador visual entre os valores
   * @param {number} x - índice usado para id do elemento
   * @returns {HTMLElement}
   */
  function criarSeparadorCV(x) {
    const separador = document.createElement("div");
    separador.id = `SepCVal${x}`;
    separador.classList.add("separadorC");
    separador.style.display = "none";

    separador.style.height = config.FaixaVerti ? "1px" : "stretch";
    separador.style.width = config.FaixaVerti ? "100%" : "1px";
    separador.style.margin = config.FaixaVerti ? "2px" : "5px";
    return separador;
  }

  /**
   * ADDBotPa - cria botão para mostrar/ocultar painel de pausas
   * Exibe "Pausas"/"Fechar" ou "P"/"F" dependendo do espaço
   * @returns {HTMLElement} botão de pausas
   */
  function ADDBotPa() {
    const caixa = document.createElement("div");
    caixa.id = "BPausa";
    caixa.textContent = "Pausas";
    caixa.style.cssText = `
        border: 1px solid white;
        width: auto;
        border-radius: 15px;
        padding: 5px;
        display: flex;
        align-items: center;
        transition: all 0.5s ease;
        cursor: pointer;
        justify-content: center;
        
        `;

    caixa.addEventListener("click", function () {
      const a = document.getElementById("minhaCaixa");
      if (!a) {
        Hwarn("minhaCaixa não encontrada");
        return;
      }
      const b = document.getElementById("CaiDPa");
      if (b) {
        b.remove();
        stt.AbaPausas = 0;
      } else {
        const c = document.getElementById("CaixaConfig");
        if (c) {
          c.remove();
          stt.AbaConfig = 0;
        }
        const d = document.getElementById("CaiOutr");
        if (d) {
          d.remove();
          stt.AbaOutros = 0;
        }
        const novoElemento = ADDCaiPausas();
        if (!novoElemento) {
          Herror("criarC() não retornou um elemento válido");
          return;
        }
        if (a.children.length >= 2 && config.FaixaVerti) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
        stt.AbaPausas = 1;
      }
    });

    return caixa;
  }

  function ADDBotOutr() {
    const caixa = document.createElement("div");
    caixa.id = "BOutr";
    caixa.textContent = "Outros";
    caixa.style.cssText = `
        border: 1px solid white;
        width: auto;
        border-radius: 15px;
        padding: 5px;
        display: flex;
        align-items: center;
        transition: all 0.5s ease;
        cursor: pointer;
        justify-content: center;
        margin-left: ${config.LadoBot ? "" : "auto"};
        height: ${config.FaixaVerti ? "" : "20px"};
        width:  ${config.FaixaVerti ? "20px" : ""};
        writing-mode: ${
          config.FaixaVerti
            ? config.LadoBot
              ? "vertical-lr"
              : "sideways-lr"
            : ""
        };
        `;

    caixa.addEventListener("click", function () {
      const a = document.getElementById("minhaCaixa");
      if (!a) {
        Hwarn("minhaCaixa não encontrada");
        return;
      }

      const b = document.getElementById("CaiOutr");
      if (b) {
        b.remove();
        stt.AbaOutros = 0;
      } else {
        const c = document.getElementById("CaixaConfig");
        const d = document.getElementById("CaiDPa");
        if (c) {
          c.remove();
          stt.AbaConfig = 0;
        }
        if (d) {
          d.remove();
          stt.AbaPausas = 0;
        }
        const novoElemento = ADDCaiOutr();
        if (!novoElemento) {
          Herror("criarC() não retornou um elemento válido");
          return;
        }
        if (a.children.length >= 2 && config.FaixaVerti) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
        stt.AbaOutros = 1;
      }
    });

    return caixa;
  }

  function ADDBotConfig() {
    const caixa = document.createElement("div");
    caixa.id = "BConfig";
    caixa.textContent = "Config";
    caixa.style.cssText = `
    border: 1px solid white;
    width: auto;
    border-radius: 15px;
    padding: 5px;
    display: flex;
    align-items: center;
    transition: all 0.5s ease;
    cursor: pointer;
    justify-content: center;
    margin-left: ${!config.LadoBot && config.FaixaVerti ? "auto" : ""};
    height: ${config.FaixaVerti ? "" : "20px"};
        width:  ${config.FaixaVerti ? "20px" : ""};
        writing-mode: ${
          config.FaixaVerti
            ? config.LadoBot
              ? "vertical-lr"
              : "sideways-lr"
            : ""
        };
    `;

    caixa.addEventListener("click", function () {
      Hlog("BConfig clicado");
      const a = document.getElementById("minhaCaixa");
      if (!a) {
        Hwarn("minhaCaixa não encontrada");
        return;
      }

      const b = document.getElementById("CaixaConfig");
      if (b) {
        b.remove();
        stt.AbaConfig = 0;
      } else {
        const c = document.getElementById("CaiDPa");
        if (c) {
          c.remove();
          stt.AbaPausas = 0;
        }
        const d = document.getElementById("CaiOutr");
        if (d) {
          d.remove();
          stt.AbaOutros = 0;
        }
        const novoElemento = criarC();
        if (!novoElemento) {
          Herror("criarC() não retornou um elemento válido");
          return;
        }
        if (a.children.length >= 2 && config.FaixaVerti) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
        stt.AbaConfig = 1;
        //Hlog("CaixaConfig adicionada");
      }
    });

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
    if (titulo !== "TMA") {
      caixa.style.display = "none";
    }
    caixa.innerHTML = `
        <div id="t${titulo}">${titulo === "Logou" ? letraD.Logou : titulo}</div>
        <div id="o${titulo}"></div>
        <div id="v${titulo}">...</div>
        `;

    return caixa;
  }

  async function SalvandoVariConfig(modo) {
    if (config.VoltarPad) {
      for (const chave in configPadrao) {
        config[chave] = configPadrao[chave];
      }
      for (const chave in CorPad) {
        Ccor[chave] = CorPad[chave];
      }
      atualizarVisual();
      const c = document.getElementById("CaixaConfig");
      if (c) {
        c.remove();
        stt.AbaConfig = 0;
      }
    }

    const AsVari = {
      DDPausa: { ...DDPausa },
      Ccor: { ...Ccor },
      TempoPausas: { ...TempoPausas },
      config: { ...config },
    };

    /**
     * aplicarConfiguracao - aplica dados de configuração aos objetos globais
     * @param {Object} dados - objeto com config e Ccor
     */
    function aplicarConfiguracao(dados) {
      if (dados.DDPausa) {
        Object.assign(DDPausa, dados.DDPausa);
        a("dados.DDPausa", dados.DDPausa);
      }
      if (dados.Ccor) {
        Object.assign(Ccor, dados.Ccor);
        a("dados.Ccor", dados.Ccor);
      }
      if (dados.TempoPausas) {
        Object.assign(TempoPausas, dados.TempoPausas);
        a("dados.TempoPausas", dados.TempoPausas);
      }
      if (dados.config) {
        Object.assign(config, dados.config);
        a("dados.config", dados.config);
      }

      function a(b, c) {
        Hlog(`Recuperado ${b}: ${JSON.stringify(c)}`);
      }
    }

    if (modo) {
      await AddOuAtuIindexdb(ChaveConfig, AsVari);

      Hlog(`Salvo ${ChaveConfig}: ${JSON.stringify(AsVari)}`);
    } else {
      aplicarConfiguracao(dadosSalvosConfi);
    }
  }

  function criarC() {
    const style = document.createElement("style");
    style.textContent = `
        .placeholderPerso::placeholder {
        color: #242421;
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
        padding: 6px;
        overflow: auto;
        width: max-content;
        border: 1px solid white;
        margin-top: ${!config.FaixaVerti ? "5px" : ""};
        margin-${config.LadoBot ? "left" : "right"}: 5px;
        max-height: 200px;
    `;

    const CFaixaVert = criarCaixaSeg();
    const FaixaVert = criarLinhaTextoComBot2(
      "FaixaVert",
      "Faixa Vertical",
      config.FaixaVerti,
      () => {
        PosicaoRecFaixa();

        config.FaixaVerti = !config.FaixaVerti;

        ["CaiDPa", "CaixaConfig", "CaiOutr"].forEach((s) => {
          const a = document.getElementById(s);
          if (a) a.remove();
        });
        stt.AbaPausas = 0;
        stt.AbaConfig = 0;
        stt.AbaOutros = 0;
        BotoesLateral();
        atualizarVisual();
        PosicaoFaixa();
        SalvandoVariConfig(1);
      },
    );
    CFaixaVert.append(FaixaVert);

    function odebb() {
      const Codebb = criarCaixaSeg();
      const Iodebb = criarLinhaTextoComBot2(
        "Iodebb",
        "Modo Debug",
        config.dBUG,
        () => {
          config.dBUG = !config.dBUG;

          atualizarVisual();
          SalvandoVariConfig(1);
        },
      );
      Codebb.append(Iodebb);
      return Codebb;
    }

    function FHistPa() {
      const CHistPa = criarCaixaSeg();
      const HistPa = criarLinhaTextoComBot2(
        "HistoDpa",
        "Historico Pausa",
        config.HistComp,
        () => {
          config.HistComp = !config.HistComp;

          atualizarVisual();
          SalvandoVariConfig(1);
        },
      );
      CHistPa.append(HistPa);
      return CHistPa;
    }

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
            padding: 2px 4px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 12px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
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
                width: 35px;
                background: #ffffff00;
                border: solid 1px white;
                color: white;
                border-radius: 8px;
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
        SalvandoVariConfig(1);
      });
      const horaInputCaiHM = document.createElement("div");
      horaInputCaiHM.style.cssText = `display: flex; align-items: center;`;
      const [horasS, minutosS, segundosS] =
        config.TempoEscaladoHoras.split(":").map(Number);
      const horaInputTE = entradatempo(
        "HoraEsc",
        1,
        String(horasS).padStart(2, "0"),
      );
      const minuInputTE = entradatempo(
        "MinuEsc",
        0,
        String(minutosS).padStart(2, "0"),
      );

      function salvarHorario() {
        const hora = parseInt(horaInputTE.value) || horasS;
        const minuto = parseInt(minuInputTE.value) || minutosS;

        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");
        const segundos = "00";

        const horarioFormatado = `${horaFormatada}:${minutoFormatado}:${segundos}`;

        // Salva na variável
        config.TempoEscaladoHoras = horarioFormatado;

        horaInputTE.value = "";
        minuInputTE.value = "";
        horaInputTE.placeholder = horaFormatada;
        minuInputTE.placeholder = minutoFormatado;
      }
      horaInputCaiHM.append(horaInputTE, doispontos(), minuInputTE);
      horaInputCai.append(horaInputCaiHM, SalvarHora);

      const a = CaixaDeOcultar(
        criarBotSalv(28, "Tempo Escalado"),
        horaInputCai,
      );
      return a;
    }

    function ContlogueManual() {
      function salvarHorariologueManual() {
        const hora = parseInt(
          horaInputlogueManual.value || horaInputlogueManual.placeholder,
        );
        const minuto = parseInt(
          minuInputlogueManual.value || minuInputlogueManual.placeholder,
        );

        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");
        const segundos = "00";
        const horarioFormatado = `${horaFormatada}:${minutoFormatado}:${segundos}`;

        // Data do input ou atual
        const dataSelecionada =
          dataInputlogueManual.value || new Date().toISOString().split("T")[0];

        // Atualiza placeholders
        horaInputlogueManual.placeholder = horaFormatada;
        minuInputlogueManual.placeholder = minutoFormatado;

        // Objeto completo
        dadosLogueManu = {
          hora: horarioFormatado,
          data: dataSelecionada,
        };

        AddOuAtuIindexdb(ChavelogueManu, dadosLogueManu);
        Hlog("Dados salvos:", dadosLogueManu);
      }

      // Container principal
      const InputCailogueManual = document.createElement("div");
      InputCailogueManual.style.cssText = `display: flex; align-items: center; gap: 6px;`;

      // Input de data
      const dataInputlogueManual = document.createElement("input");
      dataInputlogueManual.type = "date";
      dataInputlogueManual.value = new Date().toISOString().split("T")[0];
      dataInputlogueManual.addEventListener("change", salvarHorariologueManual);

      dataInputlogueManual.style.cssText = `
      background: #fffefe00;
      border: solid 1px white;
      border-radius: 8px;
      `;

      const [hor, min] =
        !dadosLogueManu || !dadosLogueManu.hora
          ? 0
          : dadosLogueManu.hora.split(":").map(Number);
      // Inputs de hora e minuto
      const horaInputlogueManual = entradatempo(
        "HLManual",
        1,
        String(hor).padStart(2, "0"),
      );
      horaInputlogueManual.addEventListener("input", salvarHorariologueManual);

      const minuInputlogueManual = entradatempo(
        "MLManual",
        0,
        String(min).padStart(2, "0"),
      );
      minuInputlogueManual.addEventListener("input", salvarHorariologueManual);

      // Monta os inputs
      InputCailogueManual.append(
        horaInputlogueManual,
        doispontos(),
        minuInputlogueManual,
      );

      // Botão slide
      const horaInputCailogueManual = document.createElement("div");
      horaInputCailogueManual.style.cssText = `display: flex; justify-content: center; align-items: center;`;
      horaInputCailogueManual.id = "CinputLogueManual";

      const logueManualC = criarBotaoSlide2(
        "LogManu",
        config.LogueManual,
        () => {
          config.LogueManual = !config.LogueManual;
          letraD.Logou = config.LogueManual ? "Logou:M" : "Logou:";
          document.getElementById("tLogou").textContent = letraD.Logou;
          if (config.LogueManual) {
            const [horasIm, minutosIm] =
              TempoPausas.Logou.split(":").map(Number);
            if (horaInputlogueManual.value === "")
              horaInputlogueManual.value = String(horasIm).padStart(2, "0");
            if (minuInputlogueManual.value === "")
              minuInputlogueManual.value = String(minutosIm).padStart(2, "0");
            dataInputlogueManual.value = new Date().toISOString().split("T")[0];
          }
          atualizarVisual();
        },
      );

      logueManualC.style.cssText = `margin-left: 6px;`;

      const ContDataHoralogueManual = document.createElement("div");

      ContDataHoralogueManual.style.cssText = `
      display: flex;
      align-items: center;
      flex-direction: column;
      `;

      ContDataHoralogueManual.append(dataInputlogueManual, InputCailogueManual);

      horaInputCailogueManual.append(ContDataHoralogueManual, logueManualC);
      const a = CaixaDeOcultar(
        criarBotSalv(27, "Logue Manual"),
        horaInputCailogueManual,
      );
      return a;
    }

    function ContModoTeste() {
      const horaInputCai = document.createElement("div");
      horaInputCai.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        `;
      horaInputCai.id = "testefuso";
      const SalvarHora = criarBotSalv("A13", "Salvar");

      SalvarHora.style.marginLeft = "5px";
      SalvarHora.addEventListener("click", function () {
        salvarHorario();
        SalvandoVariConfig(1);
      });
      // Select de sinal (+/-)
      const selSign = document.createElement("select");
      selSign.id = "tzSign";
      selSign.style.cssText = `
       width: 30px;
       background: rgba(255, 255, 255, 0);
       border: 1px solid white;
       color: white;
       border-radius: 8px;
       margin-right: 5px;`;

      ["+", "-"].forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        selSign.appendChild(opt);
      });

      const horaInputCaiHM = document.createElement("div");
      horaInputCaiHM.style.cssText = `display: flex;`;

      const m = String(config.valorTeste)
        .trim()
        .match(/^([+-]?)(\d{2}):(\d{2})$/);
      if (!m) {
        // trate o erro, lance exceção, ou defina valores padrão
        Herror(
          `valorTeste inválido "${config.valorTeste}"/"${m}. Esperado: [+|-]HH:MM`,
        );
        config.valorTeste = "+03:00";
        return;
      }
      const [, SinalT, HoraT, MinutosT] = m;

      const horaInputTE = entradatempo(
        "HoraEsc",
        1,
        String(HoraT).padStart(2, "0"),
      );
      const minuInputTE = entradatempo(
        "MinuEsc",
        0,
        String(MinutosT).padStart(2, "0"),
      );
      selSign.value = SinalT;

      function salvarHorario() {
        const hora = parseInt(horaInputTE.value) || HoraT;
        const minuto = parseInt(minuInputTE.value) || MinutosT;

        const horaFormatada = String(hora).padStart(2, "0");
        const minutoFormatado = String(minuto).padStart(2, "0");

        const horarioFormatado = `${selSign.value}${horaFormatada}:${minutoFormatado}`;

        // Salva na variável
        config.valorTeste = horarioFormatado;

        horaInputTE.value = "";
        minuInputTE.value = "";
        horaInputTE.placeholder = horaFormatada;
        minuInputTE.placeholder = minutoFormatado;
      }
      const ModoTesteAtivo = criarBotaoSlide2("TFuso", config.TesteHora, () => {
        config.TesteHora = !config.TesteHora;

        atualizarVisual();
      });
      horaInputCaiHM.append(selSign, horaInputTE, doispontos(), minuInputTE);

      const salvEMod = document.createElement("div");
      salvEMod.style.cssText = `display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 5px;`;
      salvEMod.append(SalvarHora, ModoTesteAtivo);

      const SubPrLog = criarBotSalv("ASubPrLog", "Substituir Logue");

      SubPrLog.addEventListener("click", () => {
        caixa.appendChild(
          ADDCaixaDAviso("Substituir P. Logue", () => {
            dadosPrimLogue = { hora: "10:06:16", data: "2026-03-13" };
            verifiDataLogue(1, gerarDataHora());
          }),
        );
      });
      horaInputCai.append(horaInputCaiHM, salvEMod, SubPrLog);

      const a = CaixaDeOcultar(criarBotSalv("A28", "Teste"), horaInputCai);

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
        //LinhaSelCor(8, "Atualizando", Ccor.Atualizando),
        LinhaSelCor(9, "Meta TMA", Ccor.MetaTMA),
        //LinhaSelCor(10, "Erro", Ccor.Erro),
        //LinhaSelCor(11, "Offline", Ccor.Offline),
        LinhaSelCor(12, "Config", Ccor.Config),
      );

      const a = CaixaDeOcultar(criarBotSalv(25, "Cores"), c1aixaDeCor);
      return a;
    }

    function ContTMA() {
      const a = document.createElement("div");
      a.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        `;
      const MetaTMAC = criarLinhaTextoComBot2(
        "AtivaMeta",
        "Meta TMA",
        config.MetaTMA,
        () => {
          config.MetaTMA = !config.MetaTMA;
          atualizarVisual();
        },
      );
      const InputTMABot = document.createElement("div");
      InputTMABot.style.cssText = `display: flex; align-items: center;`;

      const inputTMA = document.createElement("input");
      inputTMA.className = "placeholderPerso";
      inputTMA.setAttribute("placeholder", config.ValorMetaTMA);
      inputTMA.type = "number";
      inputTMA.style.cssText = `
        height: 16px;
        color: white;
        background-color: transparent;
        border: solid 1px white;
        width: 50px;
        font-size: 12px;
        `;
      const SalvarTMA = criarBotSalv("SavTMA", "Salvar");
      SalvarTMA.style.marginLeft = "5px";
      SalvarTMA.addEventListener("click", function () {
        const valorinputtma = inputTMA.value || inputTMA.placeholder;
        config.ValorMetaTMA = valorinputtma;
        inputTMA.placeholder = valorinputtma;
        inputTMA.value = "";
        SalvandoVariConfig(1);
      });

      InputTMABot.append(inputTMA, SalvarTMA);
      a.append(MetaTMAC, InputTMABot);
      return a;
    }

    function modoCalculo() {
      const CaixaModos = criarCaixaSeg();

      CaixaModos.id = "idCaixaModos";
      const item1Modos = criarLinhaTextoComBot2(
        "logueSalvo",
        "Primeiro Logue",
        config.logueSalvo,
        () => {
          config.logueSalvo = !config.logueSalvo;
          atualizarVisual();
        },
      );

      const item2Modos = criarLinhaTextoComBot2(
        "Recalc",
        "Recalcular",
        !config.logueSalvo,
        () => {
          config.logueSalvo = !config.logueSalvo;
          atualizarVisual();
          somarDuracoesGeral();
        },
      );

      CaixaModos.append(item1Modos, item2Modos);

      const a = CaixaDeOcultar(
        criarBotSalv("ModCal", "Modo de Calculo"),
        CaixaModos,
      );
      return a;
    }

    const IgEst = criarLinhaTextoComBot2(
      "NotEst",
      "Notificar Estouro",
      config.notiEstouro,
      () => {
        config.notiEstouro = !config.notiEstouro;
        atualizarVisual();

        if (!config.notiEstouro) atualizarComoff(0, Ccor.Erro, "cTMA");
      },
    );
    const IgEstSom = criarLinhaTextoComBot2(
      "SomEst",
      "Som",
      config.SomEstouro,
      () => {
        config.SomEstouro = !config.SomEstouro;
        atualizarVisual();
        RepetirBeep();
      },
    );

    const CigEstDep = criarCaixaSeg();

    CigEstDep.id = "idcaixaEstouro";

    CigEstDep.append(IgEst, IgEstSom);

    const CIgEst = CaixaDeOcultar(
      criarBotSalv("CIgEst", "Estouro de Pausa"),
      CigEstDep,
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
            `;
      return c;
    }

    function Cbotavan() {
      const CBancDa = criarCaixaSeg();
      CBancDa.id = "CBancDa";

      const BBancDa = c1riarBotSalv("BBancDa", "Banco de Dados");
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

      const BotaoResetT = c1riarBotSalv("BotaoResetT", "Restaurar Config");
      BotaoResetT.addEventListener("click", function () {
        caixa.appendChild(
          ADDCaixaDAviso("Restaurar Config", () => {
            config.VoltarPad = 1;
            SalvandoVariConfig(1);
          }),
        );
      });

      const caixaDeBotres = criarCaixaSeg();
      caixaDeBotres.append(BotaoResetT);

      const Cavancado = criarCaixaSeg();
      Cavancado.id = "Cavancado";
      Cavancado.style.padding = "0px 8px";
      Cavancado.append(
        criarSeparador(),
        odebb(),
        criarSeparador(),
        FHistPa(),
        criarSeparador(),
        CBBancDa,
        criarSeparador(),
        ContModoTeste(),
        criarSeparador(),
        caixaDeBotres,
      );

      const a = CaixaDeOcultar(criarBotSalv("Avanc", "Avançado"), Cavancado);

      a.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 90%;
      background: #ff000a3d;
      border-radius: 10px;
      `;
      return a;
    }

    caixa.append(
      CFaixaVert,
      criarSeparador(),
      ContTMA(),
      criarSeparador(),
      caixaDeCor(),
      criarSeparador(),
      ContTempEsc(),
      criarSeparador(),
      ContlogueManual(),
      criarSeparador(),
      CIgEst,
      criarSeparador(),
      modoCalculo(),
      criarSeparador(),
      Cbotavan(),
    );

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

    // Função auxiliar para criar linha com texto e bolinha
    function criarLinhaTextoComBot2(idbola, texto, estaAtivo, funcao) {
      const linha = document.createElement("div");
      linha.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin: 3px 0px;
      `;

      const textoDiv = document.createElement("div");
      textoDiv.style.cssText = `
          margin-right: 5px;
      `;
      textoDiv.textContent = texto;

      const botao = criarBotaoSlide2(idbola, estaAtivo, funcao);

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
        atualizarVisual(inputCor.id);
        SalvandoVariConfig(1);
      });

      div1.append(inputCor, textoDiv, botao);
      return div1;
    }

    return caixa;
  }

  /**
   * atualizarSlidePosi - atualiza estado visual de um botão slide
   * @param {string} idBotao - id do botão (ex: "Bot14")
   * @param {boolean} estaAtivo - se botão deve estar ativo/não ativo
   */
  function atualizarSlidePosi(idBotao, estaAtivo) {
    const elemento = document.getElementById(idBotao);
    if (!elemento) {
      return;
    }
    if (estaAtivo) {
      if (!elemento.classList.contains("active")) {
        elemento.classList.add("active");
        elemento.style.backgroundColor = Ccor.Principal;
      } else if (elemento.style.backgroundColor !== Ccor.Principal) {
        elemento.style.backgroundColor = Ccor.Principal;
      }
    } else {
      if (elemento.classList.contains("active")) {
        elemento.classList.remove("active");
        elemento.style.backgroundColor = "#ccc";
      }
    }
  }

  function atualizarVisual(qq = "---") {
    const minhaCaixa = document.getElementById("minhaCaixa");
    const AreaArrast = document.getElementById("AreaArrast");
    const CaixaConfig = document.getElementById("CaixaConfig");
    const CaiDPa = document.getElementById("CaiDPa");
    const BotInicial = document.getElementById("BotInicial");

    if (qq === "cor7") {
      Ccor.Principal = Ccor.Varian;
      Ccor.AreaAr = escurecer(Ccor.Principal);
    }

    if (BotInicial && stt.Estouro) {
      BotInicial.style.backgroundColor = Ccor.Erro;
      BotInicial.style.color = "white";
    }
    if (qq === "cor9") Ccor.MetaTMA = Ccor.Varian;
    if (qq === "cor12") Ccor.Config = Ccor.Varian;
    if (minhaCaixa) minhaCaixa.style.backgroundColor = Ccor.Principal;
    if (AreaArrast) AreaArrast.style.backgroundColor = Ccor.AreaAr;
    if (CaixaConfig) CaixaConfig.style.backgroundColor = Ccor.Config;
    if (CaiDPa) CaiDPa.style.backgroundColor = Ccor.Config;

    atualizarSlidePosi("BotTimerCh", config.OBS_ATIVO);
    atualizarSlidePosi("BotLogManu", config.LogueManual);
    atualizarSlidePosi("BotTFuso", config.TesteHora);
    atualizarSlidePosi("BotNotEst", config.notiEstouro);
    atualizarSlidePosi("BotAtivaMeta", config.MetaTMA);
    atualizarSlidePosi("BotFaixaVert", config.FaixaVerti);
    atualizarSlidePosi("BotlogueSalvo", config.logueSalvo);
    atualizarSlidePosi("BotRecalc", !config.logueSalvo);
    atualizarSlidePosi("BotIodebb", config.dBUG);
    atualizarSlidePosi("BotHistoDpa", config.HistComp);
  }

  /**
   * criarBotaoSlide2 - cria um botão slider/toggle estilizado
   * @param {number} IdBot - id único do slider
   * @param {Function} funcao - callback a executar ao clicar
   * @returns {HTMLElement} container do toggle criado
   */
  function criarBotaoSlide2(IdBot, estaAtivo, funcao) {
    // Adiciona estilos apenas uma vez
    StyleSlide();

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const slider = document.createElement("div");
    slider.className = "slider-button27";
    slider.id = `Bot${IdBot}`;
    if (estaAtivo) {
      if (!slider.classList.contains("active")) {
        slider.classList.add("active");
        slider.style.backgroundColor = Ccor.Principal;
      }
    } else {
      if (slider.classList.contains("active")) {
        slider.classList.remove("active");
        slider.style.backgroundColor = "#ccc";
      }
    }

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
   * criarBotSalv - cria um botão estilizado simples
   * @param {number} idBot - id único do botão
   * @param {string} texto - texto a exibir
   * @returns {HTMLElement} botão criado
   */
  function criarBotSalv(idBot, texto) {
    const Botao = document.createElement("button");
    Botao.id = `Botao${idBot}`;
    Botao.style.cssText = `
            padding: 2px 4px;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            background-color: transparent;
            color: white;
            font-size: 10px;
            height: 22px;
            display: flex;
            align-items: center;
            `;

    Botao.textContent = `${texto}`;

    return Botao;
  }

  /**
   * copiarTexto - copia texto para clipboard
   * @param {string} texto - texto a copiar
   */
  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      Hlog("Texto copiado com sucesso!");
    } catch (err) {
      Herror("Erro ao copiar texto: ", err);
    }
  }

  function ADDCaiPausas() {
    // Reset de estado para evitar lixo entre execuções
    AntFim.inicio = "---";
    AntFim.duracao = "---";
    AntFim.pausa = "";

    const container = document.createElement("div");
    container.id = "CaiDPa";
    container.style.cssText = `
    background: ${Ccor.Config};
    margin-${config.LadoBot ? "left" : "right"}: 5px;
    margin-top: ${!config.FaixaVerti ? "5px" : ""};
    border-radius: 8px;
    padding: 5px;
    max-height: 178px;
    height: max-content;
    border: 1px solid white;
    transition: 0.5s;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(4, auto);
    grid-auto-flow: row;
    gap: 2px 6px;
    `;

    function AddTituloCp(titulo) {
      const title = document.createElement("div");
      title.textContent = titulo;
      title.style.cssText = `
      font-size: 14px;
      border-bottom: 1px dashed;
      display: flex;
      align-items: center;
      justify-content: center;
      ${titulo === "Excl" ? "height:14px;" : ""}
    `;
      return title;
    }

    function criarItemTabela(id, campo, texto = "---") {
      const cell = document.createElement("div");
      cell.id = `${campo}${id}`;
      cell.textContent = String(texto);
      cell.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
    `;

      if (campo === "id") {
        cell.style.cursor = "pointer";
        cell.style.fontSize = "8px";
        cell.style.height = "14px";

        cell.addEventListener("click", () => {
          document
            .getElementById("CaiDPa")
            ?.appendChild(
              ADDCaixaDAviso("Excluir", () => removerPausaPorId(id)),
            );
        });
      }

      return cell;
    }

    function itemdetab(id, pausa, inicio, fim, duracao) {
      container.append(
        criarItemTabela(id, "pausa", pausa),
        criarItemTabela(
          id,
          "duracao",
          duracao === "---" ? duracao : tempoEncurtado(duracao),
        ),
        criarItemTabela(id, "inicio", inicio),
        criarItemTabela(id, "fim", fim),
      );
    }

    container.append(
      AddTituloCp("Pausa"),
      AddTituloCp("Duração"),
      AddTituloCp("Início"),
      AddTituloCp("Fim"),
    );

    if (!Array.isArray(dadosdePausas) || dadosdePausas.length === 0) {
      Hwarn("ADDCaiPausas: dadosdePausas vazio ou inválido");
      return container;
    }

    const Ignorados = config.HistComp
      ? ["", ""]
      : ["TRABALHANDO", "DISPONIVEL", "OFFLINE", "FORCADO", "POS"];

    const agora = gerarDataHora();

    [...dadosdePausas]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .forEach((item) => {
        const pausa = item?.pausa ?? "";
        const pausaNorm = NorTX(pausa);

        const inicioHora = item?.inicio?.hora ?? "---";
        const fimHora = item?.fim?.hora ?? "---";
        const duracao = item?.duracao ?? "---";

        if (item.id !== 0 && Ignorados.includes(pausaNorm)) {
          Hlog(`Ignorado: ${pausa}`);
          return;
        }

        if (item.id === 0) {
          itemdetab(item.id, pausa, inicioHora, fimHora, duracao);
          AntFim.inicio = TempoPausas.LogouA;
          AntFim.duracao = duracao;
          AntFim.pausa = pausa;
          return;
        }

        if (
          AntFim.inicio !== "---" &&
          AntFim.duracao !== "---" &&
          !config.HistComp
        ) {
          const duracaoReal = calcularDuracao(AntFim.inicio, item.inicio);

          Hlog("Bloco Trabalhado", {
            inicio: AntFim.inicio,
            fim: item.inicio,
            duracaoReal,
          });

          itemdetab(
            `${item.id}T`,
            "Trabalhado",
            AntFim.inicio.hora,
            inicioHora,
            duracaoReal,
          );
        }

        itemdetab(item.id, pausa, inicioHora, fimHora, duracao);

        AntFim.inicio = item.fim;
        AntFim.duracao = duracao;
        AntFim.pausa = pausa;
      });

    if (AntFim.inicio !== "---" && AntFim.duracao !== "---") {
      const duracaoReal = calcularDuracao(AntFim.inicio, agora);
      itemdetab(
        "ContAtr",
        "Trabalhando",
        AntFim.inicio.hora,
        "---",
        duracaoReal,
      );
    }

    return container;
  }

  function ADDCaiOutr() {
    const container = document.createElement("div");
    container.id = "CaiOutr";
    container.style.cssText = `
        height: 110px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        background: ${Ccor.Config};
        transition: all 0.5s ease;
        flex-direction: column;
        padding: 6px;
        overflow: auto;
        border: 1px solid white;
        margin-top: ${!config.FaixaVerti ? "5px" : ""};
        margin-${config.LadoBot ? "left" : "right"}: 5px;
    `;

    function LinhO(texto) {
      const cell = document.createElement("div");
      //cell.id = `${campo}${id}`;

      cell.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
    `;
      cell.textContent = texto;
      return cell;
    }

    container.append(
      LinhO(`Registro Observados`),
      LinhO(`Trabalhado : ${TempoPausas.Trabalhando}`),
      LinhO(`Disponivel : ${TempoPausas.Disponivel}`),
      LinhO(`Indisponivel : ${TempoPausas.Indisponivel}`),
      LinhO(`Total Logado : ${TempoPausas.Online}`),
      LinhO(`Atendidas : ${TempoPausas.Atendidas}`),
    );

    return container;
  }

  /**
   * Encurta um tempo para o menor formato possível.
   * Entrada: "HH:MM:SS" | "MM:SS" | "SS" (string) OU número de segundos (inteiro).
   * Saída: "HH:MM:SS" | "MM:SS" | "SS"
   */
  function tempoEncurtado(input) {
    // --- Normaliza entrada para total de segundos (inteiro) ---
    let totalSeg;

    if (typeof input === "number" && Number.isFinite(input)) {
      totalSeg = Math.trunc(input);
    } else if (typeof input === "string") {
      const str = input.trim();
      // Detecta sinal
      const negativo = str.startsWith("-");
      const limpo = negativo ? str.slice(1) : str;

      const partes = limpo.split(":").map((p) => p.trim());
      if (partes.some((p) => p === "" || isNaN(Number(p)))) {
        throw new Error(`Formato inválido: "${input}"`);
      }

      let h = 0,
        m = 0,
        s = 0;
      if (partes.length === 3) {
        [h, m, s] = partes.map(Number);
      } else if (partes.length === 2) {
        [m, s] = partes.map(Number);
      } else if (partes.length === 1) {
        [s] = partes.map(Number);
      } else {
        throw new Error(`Formato inválido: "${input}"`);
      }

      if (m < 0 || s < 0 || h < 0)
        throw new Error(
          `Valores negativos não são permitidos nas partes: "${input}"`,
        );
      if (m >= 60 || s >= 60) {
        // Aceitamos mm/ss >= 60? Se preferir, pode normalizar; aqui vamos rejeitar:
        // para normalizar, comente o throw e deixe passar (iremos somar abaixo).
        // throw new Error(`Minutos/segundos devem ser < 60: "${input}"`);
      }

      totalSeg = h * 3600 + m * 60 + s;
      if (negativo) totalSeg = -totalSeg;
    } else {
      throw new Error(
        'Entrada deve ser string "HH:MM:SS" | "MM:SS" | "SS" ou número de segundos.',
      );
    }

    // --- Constrói saída no menor formato possível ---
    const negativo = totalSeg < 0;
    const abs = Math.abs(totalSeg);

    const horas = Math.floor(abs / 3600);
    const minutos = Math.floor((abs % 3600) / 60);
    const segundos = abs % 60;

    const pad2 = (n) => String(n).padStart(2, "0");

    let corpo;
    if (horas > 0) {
      corpo = `${horas}:${pad2(minutos)}:${pad2(segundos)}`;
    } else if (minutos > 0) {
      corpo = `${minutos}:${pad2(segundos)}`;
    } else {
      corpo = `${segundos}`; // sem zero-padding em SS puro
    }

    return negativo ? `-${corpo}` : corpo;
  }

  /**
   * tocarBeep - toca tom de alerta via Web Audio API
   * Frequência: 700Hz, duração: 0.5s, volume: 0.6
   */
  function tocarBeep() {
    const contextoAudio = new (
      window.AudioContext || window.webkitAudioContext
    )();
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
   */
  function RepetirBeep() {
    if (
      !stt.BeepRet &&
      stt.Estouro &&
      config.SomEstouro &&
      config.notiEstouro
    ) {
      stt.BeepRet = 1;
      setTimeout(function () {
        stt.BeepRet = 0;
        if (stt.Estouro && config.SomEstouro && config.notiEstouro) tocarBeep();
        RepetirBeep();
      }, 3 * 1000);
    }
  }

  /**
   * Escurece uma cor (hex, rgb, rgba) reduzindo cada canal por uma fração.
   * @param {string} color - Ex: "#229b8d", "#2a9", "rgb(34,155,141)", "rgba(34,155,141,0.8)"
   * @param {number} intensidade - Valor entre 0 e 1 (0.15 = 15% mais escuro)
   * @returns {string} - Cor no mesmo formato de entrada (hex volta como #rrggbb)
   */
  function escurecer(color, intensidade = 0.3) {
    if (typeof color !== "string") throw new TypeError("Cor deve ser string");
    const amt = clamp(intensidade, 0, 1);

    // Normaliza e detecta formato
    const c = color.trim();
    if (c.startsWith("#")) {
      const { r, g, b } = hexToRgb(c);
      const { r: nr, g: ng, b: nb } = darkenRgb({ r, g, b }, amt);
      return rgbToHex(nr, ng, nb);
    }

    if (c.toLowerCase().startsWith("rgb(")) {
      const { r, g, b } = parseRgb(c);
      const { r: nr, g: ng, b: nb } = darkenRgb({ r, g, b }, amt);
      return `rgb(${nr}, ${ng}, ${nb})`;
    }

    if (c.toLowerCase().startsWith("rgba(")) {
      const { r, g, b, a } = parseRgba(c);
      const { r: nr, g: ng, b: nb } = darkenRgb({ r, g, b }, amt);
      return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
    }

    throw new Error(
      "Formato de cor não suportado. Use hex (#rrggbb, #rgb), rgb() ou rgba().",
    );

    // === Helpers ===

    function clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }

    function hexToRgb(hex) {
      let h = hex.replace("#", "").trim();
      if (h.length === 3) {
        // #abc -> #aabbcc
        h = h
          .split("")
          .map((ch) => ch + ch)
          .join("");
      }
      if (!/^[0-9a-f]{6}$/i.test(h)) {
        throw new Error("Hex inválido.");
      }
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return { r, g, b };
    }

    function rgbToHex(r, g, b) {
      const toHex = (n) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function parseRgb(str) {
      // rgb(34, 155, 141)
      const m = str.match(
        /rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/i,
      );
      if (!m) throw new Error("rgb() inválido.");
      const r = clamp(parseInt(m[1], 10), 0, 255);
      const g = clamp(parseInt(m[2], 10), 0, 255);
      const b = clamp(parseInt(m[3], 10), 0, 255);
      return { r, g, b };
    }

    function parseRgba(str) {
      // rgba(34, 155, 141, 0.8)
      const m = str.match(
        /rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*(\d*\.?\d+)\s*\)/i,
      );
      if (!m) throw new Error("rgba() inválido.");
      const r = clamp(parseInt(m[1], 10), 0, 255);
      const g = clamp(parseInt(m[2], 10), 0, 255);
      const b = clamp(parseInt(m[3], 10), 0, 255);
      const a = clamp(parseFloat(m[4]), 0, 1);
      return { r, g, b, a };
    }

    function darkenRgb({ r, g, b }, frac) {
      // Estrategia simples: multiplicar cada canal por (1 - frac)
      // Mantém o tom geral e reduz brilho de forma previsível.
      const f = 1 - frac;
      const dr = Math.round(r * f);
      const dg = Math.round(g * f);
      const db = Math.round(b * f);
      return {
        r: clamp(dr, 0, 255),
        g: clamp(dg, 0, 255),
        b: clamp(db, 0, 255),
      };
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
})();
