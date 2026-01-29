// ==UserScript==
// @name         LoginZendesk
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1.3.7.2
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/LoginZendesk.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/LoginZendesk.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  const config = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    logueEntreDatas: 0,
    pausalimitada: 0,
    LogueManual: 0,
    SomEstouro: 1,
    notiEstouro: 1,
    OBS_ATIVO: 1,
  };

  const configPadrao = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    logueEntreDatas: 0,
    pausalimitada: 0,
    LogueManual: 0,
    SomEstouro: 1,
    notiEstouro: 1,
    OBS_ATIVO: true,
  };

  const stt = {
    observa: 1,
    Status: "",
    andament: 1,
    ocultarValor: 0,
    Estouro: 0,
    AbaPausas: 0,
    AbaConfig: 0,
    tempoCumprido: 0,
    temHorasExtras: 0,
    Estour1: 0,
    BeepRet: 0,
    Encontrado: 0,
  };

  let TempoPausas = {
    Logou: 0,
    LogouA: 0,
    Logado: 0,
    Saida: 0,
    SaidaA: 0,
    Falta: 0,
    Online: 0,
    Time: 0,
    Estouro: 0,
  };

  const DDPausa = {
    numero: 1,
    inicioUltimaP: 0,
    inicioUltimaPa: 0,
    StatusANT: "",
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
  const PCcor = {
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
  let dadosSalvosConfi;
  let dadosPrimLogue;
  let dadosPrimLogueOnt;
  let dadosLogueManu;

  // Configuração do IndexedDB
  const nomeBD = "MeuBDZen";
  const StoreBD = "LogueMonk";

  RecuperarTVariaveis();

  /**
   * RecuperarTVariaveis - recupera as variáveis persistidas do indexedDB
   * - Tenta recuperar vários conjuntos de dados e registra erros quando ocorrerem
   */
  async function RecuperarTVariaveis() {
    try {
      dadosdePausas = await RecDadosindexdb(ChavePausas);
      console.debug("HefestoLog: Encontrados em dadosdePausas:", dadosdePausas);
    } catch (e) {
      console.error("HefestoLog: Erro ao recuperar dadosdePausas:", e);
    }

    try {
      dadosSalvosConfi = await RecDadosindexdb(ChaveConfig);
      console.debug(
        "HefestoLog: Encontrados em dadosSalvosConfi:",
        dadosSalvosConfi,
      );
    } catch (e) {
      console.error("HefestoLog: Erro ao recuperar dadosSalvosConfi:", e);
    }

    try {
      dadosPrimLogue = await RecDadosindexdb(ChavePrimLogue);
      console.debug(
        "HefestoLog: Encontrados em dadosPrimLogue:",
        dadosPrimLogue,
      );
    } catch (e) {
      console.error("HefestoLog: Erro ao recuperar dadosPrimLogue:", e);
    }

    try {
      dadosLogueManu = await RecDadosindexdb(ChavelogueManu);
      console.debug(
        "HefestoLog: Encontrados em dadosLogueManu:",
        dadosLogueManu,
      );
    } catch (e) {
      console.error("HefestoLog: Erro ao recuperar dadosLogueManu:", e);
    }

    try {
      dadosPrimLogueOnt = await RecDadosindexdb(ChavePrimLogueOntem);
      console.debug(
        "HefestoLog: Encontrados em dadosPrimLogueOnt:",
        dadosPrimLogueOnt,
      );
    } catch (e) {
      console.error("HefestoLog: Erro ao recuperar dadosPrimLogueOnt:", e);
    }
    await verifiDataLogue();
    await SalvandoVariConfig(0);
    await verifLogueManual();
    criarObjetoFlutuante();
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
        console.log("HefestoLog: observer Desconectado");
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
    const first = t.split(/[|\-\s]+/u)[0];

    // Normaliza: primeira letra maiúscula, restante minúsculo
    const lower = first.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  observarItem(() => {
    //const el = document.querySelector('[data-garden-id="typography.font"]');
    const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button-tooltip"] div',
    );

    if (!el) {
      console.log("HefestoLog: Alteração aconteceu, mas ainda sem status");
      stt.Status = "---";
      return (stt.andament = 1);
    }

    let statusAtual = formatPrimeiroNome(el.textContent.trim());
    if (statusAtual === "Pausa") statusAtual = "Particular";
    //console.log(`HefestoLog: Status: ${statusAtual}`);

    // Se não mudou, não faz nada

    stt.Status = statusAtual;

    if (DDPausa.StatusANT === stt.Status) {
      return (stt.andament = 1);
    }

    // ==========================================================
    // 3) Atualiza status anterior
    // ==========================================================

    console.log(
      `HefestoLog: Troca de Status: ${stt.Status} / ant: ${DDPausa.StatusANT}`,
    );
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
      const inicioObj = await getValorDadosPausa(DDPausa.numero, "inicio"); // {data,hora} ou undefined

      const duracaoObj = await getValorDadosPausa(DDPausa.numero, "duracao"); // {data,hora} ou undefined

      //console.log(`HefestoLog: fimObj: ${JSON.stringify(fimObj)}`);
      const agora = gerarDataHora(); // { data, hora }

      console.log(
        `HefestoLog: id:${DDPausa.numero}, inicioObj: ${JSON.stringify(
          inicioObj,
        )}`,
      );
      if (inicioObj && duracaoObj === "---") {
        // Salva fim (objeto)
        await atualizarCampos(DDPausa.numero, "fim", agora);

        config.pausalimitada = 0;
        stt.Estouro = 0;
        stt.Estour1 = 0;
        atualizarComoff(0, "cTMA");
        SalvandoVariConfig(1);
        // Calcula duração real (string HH:MM:SS)
        const duracaoReal = calcularDuracao(inicioObj, agora);
        await atualizarCampos(DDPausa.numero, "duracao", duracaoReal);

        console.log(`HefestoLog: fim: ${JSON.stringify(agora)}`);
        TempoPausas.Online = somarDuracoes().totalSegundos;
      }

      /*if (dadosPrimLogue) {
        const c = converterParaSegundos(dadosPrimLogue.hora);
        const d = converterParaSegundos(TempoPausas.Logou);

        if (d < c) {
          dadosPrimLogue.hora = TempoPausas.Logou;
          verifiDataLogue(1);
        }
      }*/

      // Só executa lógica se NÃO estiver Offline e se houve mudança
      if (stt.Status.includes("Offline")) {
        console.log(`HefestoLog: Inclui Off ${stt.Status}`);
        return (stt.andament = 1);
      }

      // Seu comentário original: "Se for abrir nova pausa, incremente o id"
      DDPausa.numero = DDPausa.numero + 1;
      if (DDPausa.numero > 30) DDPausa.numero = 1;

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

      //console.log(`HefestoLog: TempoPausas: ${JSON.stringify(TempoPausas)}`);
      // Cria/atualiza pausa no array + IndexedDB
      await AddouAtualizarPausas(
        DDPausa.numero,
        stt.Status,
        agora, // inicio: {data,hora}
        fimPrevistoObj || "---", // fim previsto: {data,hora} ou null
        "---", // duracao prevista: "HH:MM:SS" ou "---"
      );
    })().catch((err) =>
      console.error("HefestoLog: erro no observer async:", err),
    );
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

  async function verifiDataLogue(x = 0) {
    const a = gerarDataHora();
    const e = exibirHora(a, 0, "23:59:59");

    if (
      !dadosPrimLogue ||
      (dadosPrimLogue.data !== a.data && dadosPrimLogue.data !== e.data)
    ) {
      dadosPrimLogue = a;
      x = 1;
      ApagarChaveIndexDB(ChavePausas);
      dadosdePausas = [];
      TempoPausas = {};
      SalvandoVariConfig(1);
    }

    const b = exibirHora(dadosPrimLogue, 1, config.TempoEscaladoHoras);

    config.logueEntreDatas = dadosPrimLogue.data !== b.data ? 1 : 0;
    if (!config.logueEntreDatas && dadosPrimLogue.data !== a.data) {
      ApagarChaveIndexDB(ChavePausas);
      dadosPrimLogue = a;
      dadosdePausas = [];
      TempoPausas = {};
      SalvandoVariConfig(1);
      x = 1;
    }
    console.log(`HefestoLog: 
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

  // Soma as durações do array (campo "duracao")
  function somarDuracoes() {
    // Se não é array ou está vazio, retorna zero direto
    if (!Array.isArray(dadosdePausas) || dadosdePausas.length === 0) {
      return {
        totalSegundos: 0,
        totalFormatado: "00:00:00",
      };
    }

    const totalSegundos = dadosdePausas.reduce((acc, item) => {
      // tenta pegar o campo; qualquer coisa inválida vira 0
      const s = converterParaSegundos(item?.duracao);
      return acc + (Number.isFinite(s) ? s : 0);
    }, 0);

    return {
      totalSegundos,
      totalFormatado: converterParaTempo(totalSegundos),
    };
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

  function criarObjetoFlutuante() {
    if (document.getElementById("FlutOB")) return;

    const div = document.createElement("div");
    div.id = "FlutOB";
    // Estilo do container principal
    div.style.cssText = `
     position: fixed;
     bottom: 1px;
     left: 1px;
     border-radius: 8px;
     z-index: 16;
     box-sizing: border-box;
     user-select: none;
     transform: translate(0px, 0px);
     will-change: transform;
     display: flex;
     flex-direction: column;
     align-items: center;
     background-color: ${Ccor.Principal};
     padding: 3px;
     box-sizing: border-box;
    `;
    const handle = document.createElement("div"); // Área para arrastar
    handle.id = "AreaArrast";
    // Estilo da área de arrasto
    handle.style.cssText = `
    width: 100%;
    height: 5px;
    background-color: ${Ccor.AreaAr};
    cursor: grab;
    border-radius: 4px;
    margin-bottom: 5px;
    `;

    let offsetX = 0,
      offsetY = 0,
      dragging = false,
      startX = 0,
      startY = 0;

    function onPointerDown(e) {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      handle.style.cursor = "grabbing";
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
      offsetX += dx;
      offsetY += dy;
      dragging = false;
      handle.style.cursor = "grab";
      div.releasePointerCapture?.(e.pointerId);
    }

    // Eventos apenas na área de arrasto
    handle.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    div.ondragstart = () => false;

    // Monta estrutura
    div.appendChild(handle);
    div.appendChild(AdicionarCaixaAtualizada());
    document.body.appendChild(div);
  }

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

  function verificarMouse(ids, mostrar) {
    const exibir = !!mostrar; // garante booleano

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue; // se não existir, apenas pulaa

      el.style.display = exibir ? "block" : "none";
    }
  }

  // Atualiza o timer a cada segundo
  setInterval(() => {
    if (config.OBS_ATIVO) AtualizarTimerChat();
    const time = document.getElementById("vTMA");
    const titulo = document.getElementById("tTMA");
    const vLogou = document.getElementById("vLogou");
    const vSaida = document.getElementById("vSaida");
    const vLogado = document.getElementById("vLogado");
    const tFalta = document.getElementById("tFalta");
    const vFalta = document.getElementById("vFalta");
    const InfoV = document.getElementById("InfoV");
    const ContPaCo = document.getElementById("ContPaCo");

    if (!time || !titulo || !vLogou || !vSaida || !vLogado || !vFalta) return;

    const agora = gerarDataHora();
    stt.Encontrado = stt.Status === "---" ? 0 : 1;
    let ContAtual = stt.Encontrado ? "0" : "Encontrado";

    titulo.textContent = stt.Encontrado ? stt.Status : "Não";
    time.textContent = ContAtual;

    if (!InfoV) {
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
      stt.Encontrado ? 1 : config.LogueManual ? 1 : 0,
    );
    verificarMouse(["cTMA"], !config.LogueManual || stt.Encontrado);

    const Logou = config.LogueManual
      ? dadosLogueManu
      : exibirHora(agora, 0, TempoPausas.Logado);
    TempoPausas.Logou = Logou.hora;

    const agora1 = gerarDataHora();

    agora1.hora = TempoPausas.Logou;

    const Saida = exibirHora(agora1, 1, config.TempoEscaladoHoras);

    TempoPausas.Saida = Saida.hora;
    if (!config.LogueManual && compararDatas(dadosPrimLogue, Logou)) {
      dadosPrimLogue = Logou;
      verifiDataLogue(1);
    }

    vLogou.textContent = TempoPausas.Logou || "00:00:00";
    vSaida.textContent = TempoPausas.Saida || "00:00:00";

    if (!config.LogueManual) {
      if (
        !DDPausa.inicioUltimaP ||
        !DDPausa.inicioUltimaP.data ||
        stt.Status.includes("Offline") ||
        !stt.Encontrado
      ) {
        return;
      }
    }

    ContAtual = !stt.Encontrado
      ? "---"
      : !DDPausa.inicioUltimaP || !DDPausa.inicioUltimaP.data
        ? "-?-"
        : exibirAHora(agora, 0, DDPausa.inicioUltimaP).hora;

    TempoPausas.Logado = config.LogueManual
      ? exibirAHora(agora, 0, Logou).hora
      : converterParaTempo(
          TempoPausas.Online + converterParaSegundos(ContAtual),
        );

    time.textContent =
      ContAtual === "---" || ContAtual === "-?-"
        ? ContAtual
        : tempoEncurtado(ContAtual);

    TempoPausas.Falta = exibirAHora(Saida, 0, agora).hora;

    vLogado.textContent = tempoEncurtado(TempoPausas.Logado);

    if (compararDatas(agora, exibirHora(Saida, 1, "00:10:00"))) {
      stt.temHorasExtras = 1;
      stt.tempoCumprido = 0;
    } else if (compararDatas(agora, Saida)) {
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
      stt.Estouro = compararDatas(agora, TempoPausas.Estouro);
      atualizarComoff(stt.Estouro, "cTMA");

      if (!stt.Estour1 && stt.Estouro && config.SomEstouro) {
        stt.Estour1 = 1;
        tocarBeep();
        setTimeout(function () {
          RepetirBeep();
        }, 15000);
      }
    }
  }, 1000);

  function atualizarComoff(ar, caixa) {
    var x = document.getElementById(caixa);
    if (x) {
      x.style.background = ar ? Ccor.Erro : "";
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

  function normalizarCampo(campo) {
    return String(campo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .trim()
      .toLowerCase();
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
      console.error("HefestoLog: Erro ao atualizar campos no IndexedDB:", err);
    }

    if (c === "duracao") {
      console.debug("HefestoLog: Tabela salva:", ChavePausas);
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
      console.error(
        "HefestoLog: Erro ao abrir o banco de dados:",
        event.target.errorCode,
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
              `HefestoLog: Dados salvos com sucesso na chave "${nomechave}"`,
            );
            resolve(true);
          };

          request.onerror = function (event) {
            console.error(
              "HefestoLog: Erro ao salvar os dados:",
              event.target?.errorCode || event,
            );
            reject(event);
          };
        });
      } catch (err) {
        console.error("HefestoLog: AddOuAtuIindexdb erro:", err);
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
        console.log(`HefestoLog: Chave "${nomechave}" apagada com sucesso.`);
      };

      request.onerror = function (event) {
        console.error(
          "HefestoLog: Erro ao apagar a chave:",
          event.target.errorCode,
        );
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
    caixa.textContent = "P";
    caixa.style.cssText = `
        border: 1px solid white;
        height: 20px;
        width: 20px;
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
        console.warn("minhaCaixa não encontrada");
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
        const novoElemento = ADDCaiPausas();
        if (!novoElemento) {
          console.error("criarC() não retornou um elemento válido");
          return;
        }
        if (a.children.length >= 2) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
        stt.AbaPausas = 1;
      }
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
      caixa.textContent = mostrarTextoCompleto
        ? stt.AbaPausas
          ? "Fechar"
          : "Pausas"
        : stt.AbaPausas
          ? "F"
          : "P";
    }

    return caixa;
  }

  function ADDBotConfig() {
    const caixa = document.createElement("div");
    caixa.id = "BConfig";
    caixa.textContent = "C";
    caixa.style.cssText = `
    border: 1px solid white;
    height: 20px;
    width: 20px;
    border-radius: 15px;
    padding: 5px;
    display: flex;
    align-items: center;
    transition: all 0.5s ease;
    cursor: pointer;
    justify-content: center;

    `;

    caixa.addEventListener("click", function () {
      console.log("BConfig clicado");
      const a = document.getElementById("minhaCaixa");
      if (!a) {
        console.warn("minhaCaixa não encontrada");
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
        const novoElemento = criarC();
        if (!novoElemento) {
          console.error("criarC() não retornou um elemento válido");
          return;
        }
        if (a.children.length >= 2) {
          a.insertBefore(novoElemento, a.children[1]);
        } else {
          a.appendChild(novoElemento);
        }
        stt.AbaConfig = 1;
        //console.log("CaixaConfig adicionada");
      }
    });

    caixa.addEventListener("mouseover", () => Controle(1));
    caixa.addEventListener("mouseout", () => Controle(0));

    function Controle(mostrarTextoCompleto) {
      caixa.style.width = mostrarTextoCompleto ? "auto" : "20px";
      caixa.textContent = mostrarTextoCompleto
        ? stt.AbaConfig
          ? "Fechar"
          : "Config"
        : stt.AbaConfig
          ? "F"
          : "C";
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
        <div id="t${titulo}">${titulo}:</div>
        <div id="v${titulo}">...</div>
        `;

    return caixa;
  }

  function AdicionarCaixaAtualizada() {
    // Função para criar a classe dinamicamente
    function criarClasse() {
      const style = document.createElement("style");
      style.type = "text/css";
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

    // Cria um contêiner para agrupar as caixas
    const container = document.createElement("div");
    container.setAttribute("id", "contValores");
    container.style.cssText = `
        display: flex;
        opacity: 1;
        padding: 6px;
        align-items: center;
        justify-content: space-evenly;
        transition: all 0.5s ease;
        border-radius: 15px;
        visibility: visible;
        flex-direction: column;
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

    // Cria um contêiner principal para agrupar tudo
    const minhaCaixa = document.createElement("div");
    minhaCaixa.setAttribute("id", "minhaCaixa");
    minhaCaixa.style.cssText = `
        display: flex;
        color: white;
        flex-direction: row;
        z-index: 16;
        font-size: 12px;
        transition: all 0.5s ease;
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
      let x = stt.AbaPausas || stt.AbaConfig ? 1 : b;

      const a = document.getElementById(z);
      if (a) {
        a.style.opacity = x ? "1" : "0";
        a.style.visibility = x ? "visible" : "hidden";
        a.style.marginLeft = x ? "5px" : "-20px";
      }
    }

    minhaCaixa.appendChild(container);

    const Divbot = document.createElement("div");
    Divbot.id = "ContPaCo";
    Divbot.style.cssText = `
    margin-left: -20px;
    opacity: 0;
    visibility: hidden;
    transition: 0.5s;
    display: flex;
    gap: 5px;
    flex-direction: column;
    `;

    const InfoV = document.createElement("div");
    InfoV.id = "InfoV";
    InfoV.textContent = `Versão P Chat ${GM_info.script.version || "?-?"}`;
    InfoV.style.cssText = `
    transform: rotate(-90deg);
    transform-origin: right bottom;
    white-space: nowrap;
    color: #ffffff;
    width: 16px;
    position: relative;
    bottom: 22px;
    `;

    const Space = document.createElement("div");
    Space.style.cssText = `
    flex: 1;
    `;

    Divbot.appendChild(ADDBotConfig());
    Divbot.appendChild(ADDBotPa());
    Divbot.appendChild(Space);
    Divbot.appendChild(InfoV);
    minhaCaixa.appendChild(Divbot);

    return minhaCaixa;
  }

  async function SalvandoVariConfig(modo) {
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
        console.log(`HefestoLog: Recuperado ${b}: ${JSON.stringify(c)}`);
      }
    }

    if (modo) {
      await AddOuAtuIindexdb(ChaveConfig, AsVari);
      console.log(
        `HefestoLog: Salvo ${ChaveConfig}: ${JSON.stringify(AsVari)}`,
      );
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
                width: 42px;
                background: #ffffff00;
                border: solid 1px white;
                color: white;
                font-size: 12px;
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
        console.log("Dados salvos:", dadosLogueManu);
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

      const logueManualC = criarBotaoSlide2(13, config.LogueManual, () => {
        config.LogueManual = !config.LogueManual;
        if (config.LogueManual) {
          const [horasIm, minutosIm] = TempoPausas.Logou.split(":").map(Number);
          if (horaInputlogueManual.value === "")
            horaInputlogueManual.value = String(horasIm).padStart(2, "0");
          if (minuInputlogueManual.value === "")
            minuInputlogueManual.value = String(minutosIm).padStart(2, "0");
          dataInputlogueManual.value = new Date().toISOString().split("T")[0];
        }
        atualizarSlidePosi("Bot13", config.LogueManual);
      });

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
        String(existH).padStart(2, "0"),
      );
      const minuInputModoTeste = entradatempo(
        "MModoTeste",
        0,
        String(existM).padStart(2, "0"),
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
        SalvandoVariConfig(1);
      }

      const salvarBot = criarBotSalv(35, "Salvar");
      salvarBot.addEventListener("click", function () {
        VariavelmodoTeste.data =
          dateInput.value || VariavelmodoTeste.data || "";
        salvarHorarioModoTeste();
        // garante que config.modoTeste siga o toggle
        config.modoTeste = config.modoTeste ? 1 : 0;
        AtualizarConf();
      });

      const toggle = criarBotaoSlide2(34, config.modoTeste, () => {
        config.modoTeste = !config.modoTeste;
        if (config.modoTeste) {
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
        SalvandoVariConfig(1);
        AtualizarConf();
      });

      // Atualiza VariavelmodoTeste quando inputs mudam
      dateInput.addEventListener("change", () => {
        VariavelmodoTeste.data = dateInput.value;
        SalvandoVariConfig(1);
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
        salvarBot,
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
        //LinhaSelCor(8, "Atualizando", Ccor.Atualizando),
        //LinhaSelCor(9, "Meta TMA", Ccor.MetaTMA),
        //LinhaSelCor(10, "Erro", Ccor.Erro),
        //LinhaSelCor(11, "Offline", Ccor.Offline),
        LinhaSelCor(12, "Config", Ccor.Config),
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

    const CTimerCh = criarCaixaSeg();
    const TimerCh = criarLinhaTextoComBot2(
      29,
      "Timer No Chat",
      config.OBS_ATIVO,
      () => {
        if (config.OBS_ATIVO) {
          desligarBootstrapEMonitoramento();
        } else {
          retomarObservacao();
        }
        SalvandoVariConfig(1);
        atualizarSlidePosi("Bot29", config.OBS_ATIVO);
      },
    );
    CTimerCh.append(TimerCh);

    const IgEst = criarLinhaTextoComBot2(
      22,
      "Notificar Estouro",
      config.notiEstouro,
      () => {
        config.notiEstouro = !config.notiEstouro;
        atualizarSlidePosi("Bot22", config.notiEstouro);
        if (!config.notiEstouro) atualizarComoff(0, "cTMA");
      },
    );
    const IgEstSom = criarLinhaTextoComBot2(
      23,
      "Som",
      config.SomEstouro,
      () => {
        config.SomEstouro = !config.SomEstouro;
        atualizarSlidePosi("Bot23", config.SomEstouro);
        RepetirBeep();
      },
    );

    const CigEstDep = criarCaixaSeg();

    CigEstDep.id = "idcaixaEstouro";

    CigEstDep.append(IgEst, IgEstSom);

    const CIgEst = CaixaDeOcultar(
      criarBotSalv(24, "Estouro de Pausa"),
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
        CBBancDa,
        criarSeparador(),
        ContModoTeste(),
        criarSeparador(),
        CValoresEnc,
        criarSeparador(),
        caixaDeBotres,
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
      InputMin.placeholder = config.tempoPOcul;
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
        config.tempoPOcul = InputMin.value || InputMin.min;
      });

      c.append(ocultar);
      c.append(InputMin);
      const d = criarBotaoSlide2(33, () => {
        config.temOcul = !config.temOcul;
        if (config.temOcul) config.FaixaFixa = 0;
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
      //Faixa(),
      //criarSeparador(),
      //CIgOffline,
      //CIgTMA,
      //CIgErro,
      //criarSeparador(),
      CTimerCh,
      criarSeparador(),
      caixaDeCor(),
      criarSeparador(),
      ContTempEsc(),
      criarSeparador(),
      ContlogueManual(),
      criarSeparador(),
      CIgEst,

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
      }
    } else {
      if (elemento.classList.contains("active")) {
        elemento.classList.remove("active");
        elemento.style.backgroundColor = "#ccc";
      }
    }
  }

  function atualizarVisual(qq = "---") {
    const FlutOB = document.getElementById("FlutOB");
    const AreaArrast = document.getElementById("AreaArrast");
    const CaixaConfig = document.getElementById("CaixaConfig");
    const CaiDPa = document.getElementById("CaiDPa");

    if (qq === "cor7") {
      Ccor.Principal = Ccor.Varian;
      Ccor.AreaAr = escurecer(Ccor.Principal);
    }
    if (qq === "cor12") Ccor.Config = Ccor.Varian;
    //console.log(`O valor de qq2:${qq}`);
    if (FlutOB) FlutOB.style.backgroundColor = Ccor.Principal;
    if (AreaArrast) AreaArrast.style.backgroundColor = Ccor.AreaAr;
    if (CaixaConfig) CaixaConfig.style.backgroundColor = Ccor.Config;
    if (CaiDPa) CaiDPa.style.backgroundColor = Ccor.Config;
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
      console.log("Texto copiado com sucesso!");
    } catch (err) {
      console.error("Erro ao copiar texto: ", err);
    }
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
        margin-left: 5px;
        border-radius: 8px;
        padding: 5px;
        max-width: 400px;
        height: max-content;
        border: 1px solid white;
        transition: 0.5s;
        overflow: auto;
        display: grid;
        grid-template-rows: repeat(4, auto); /* 4 linhas */
        grid-auto-flow: column; /* Preenche colunas automaticamente */
        gap: 2px 6px; /* Espaçamento entre itens */
       `;

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
            display: flex;
        align-items: center;
        justify-content: center;
        `;
      if (titulo === "Excl") {
        caixa.style.height = "14px";
      }

      return caixa;
    }

    caixa.append(
      AddTituloCp("Pausa"),
      AddTituloCp("Duração"),
      AddTituloCp("Início"),
      AddTituloCp("Fim"),
      //AddTituloCp("Excl")
    );

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
      caixa.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

      if (campo === "id") {
        caixa.style.cursor = `pointer`;
        caixa.style.fontSize = "8px";
        caixa.style.height = "14px";

        caixa.addEventListener("click", () => {
          const CaiDPa = document.getElementById("CaiDPa");
          CaiDPa.appendChild(
            ADDCaixaDAviso("Excluir", () => {
              removerPausaPorId(id);
            }),
          );
        });
      }

      return caixa;
    }

    if (Array.isArray(dadosdePausas) && dadosdePausas.length > 0) {
      const ordenado = [...dadosdePausas].sort(
        (a, b) => Number(a.id) - Number(b.id),
      );

      ordenado.forEach((item) => {
        // Usa as chaves em minúsculas conforme seu objeto atual
        const inicioHora = item?.inicio?.hora ?? "<--->";
        const fimHora = item?.fim?.hora ?? "<--->";
        const duracao = item?.duracao ?? "<--->";
        const pausa = item?.pausa ?? "";

        caixa.append(
          criarItemTabela(item.id, "pausa", pausa),
          criarItemTabela(item.id, "duracao", duracao),
          criarItemTabela(item.id, "inicio", inicioHora),
          criarItemTabela(item.id, "fim", fimHora),
          //criarItemTabela(item.id, "id", "❌")
        );
      });
    }

    //console.log(`Pausas ${JSON.stringify(dadosdePausas)}`);

    return caixa;
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

  // ========= CONFIG =========
  const DEBUG = localStorage.getItem("hefesto:debug") === "1"; // ative com: localStorage.setItem('hefesto:debug','1')
  const DEBOUNCE_MS = 300;

  // Referências globais para que possamos desconectar depois
  //let OBS_ATIVO = true; // flag opcional para bloquear reconexões enquanto limpa
  let lifecycleObs = null; // observer que monitora sumiço/volta do tablist
  let docObs = null; // observer temporário usado até o tablist aparecer
  let tablistRef = null; // referência atual do [data-test-id="header-tablist"]

  // ========= LOG UTILS =========
  function HefestoLog(...args) {
    if (DEBUG) console.log("HefestoLog:", ...args);
  }
  function warn(...args) {
    console.warn("HefestoLog:", ...args);
  }
  function error(...args) {
    console.error("HefestoLog:", ...args);
  }

  // ========= HELPERS =========
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Aguarda o aparecimento de um elemento no DOM.
   * @param {string|Function} selector - seletor CSS ou função que retorna o elemento.
   * @param {Element|Document} root - raiz da observação.
   * @param {number} timeout - ms
   * @returns {Promise<Element|null>}
   */
  function waitForElement(selector, root = document, timeout = 15000) {
    const getEl = () =>
      typeof selector === "function"
        ? selector()
        : (root || document).querySelector(selector);

    return new Promise((resolve) => {
      const el = getEl();
      if (el) return resolve(el);

      const obsRoot = root && root.nodeType ? root : document;
      const obs = new MutationObserver(() => {
        const e = getEl();
        if (e) {
          obs.disconnect();
          resolve(e);
        }
      });
      obs.observe(obsRoot, { childList: true, subtree: true });

      const to = setTimeout(() => {
        obs.disconnect();
        resolve(null);
      }, timeout);

      window.addEventListener(
        "beforeunload",
        () => {
          clearTimeout(to);
          obs.disconnect();
        },
        { once: true },
      );
    });
  }

  // ========= ESTADO =========

  /** @typedef {{ id: string, datatime: string|null, nome: string|null }} TicketInfo */

  /** @type {Map<string, TicketInfo>} */
  const ticketsSet = new Map();

  /** @type {Map<string, MutationObserver>} */
  const ticketObservers = new Map();
  /** @type {Map<string, Function>} */
  const ticketDebouncers = new Map();

  let tooltipObserver = null;

  // ========= COLETA DE IDS =========
  function ObterEntityId() {
    const container = document.querySelector('[data-test-id="header-tablist"]');
    const itens = container
      ? [...container.querySelectorAll("[data-entity-id]")]
      : [];
    return {
      total: itens.length,
      elementos: itens,
      ids: itens.map((el) => el.getAttribute("data-entity-id")).filter(Boolean),
    };
  }

  // Helper: root do ticket (mesmo seletor usado em observarTicket)
  function getTicketRoot(id) {
    return document.querySelector(
      `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
    );
  }

  // ========= SYNC DE IDS =========
  function SincronizarTicketsObservados() {
    HefestoLog("Sincronizando tickets observados...");

    const atual = ObterEntityId().ids.map(String); // garante string
    const setAtual = new Set(atual);
    const existentes = new Set(ticketsSet.keys());

    // IDs novos (apareceram na aba)
    const novos = atual.filter((id) => !existentes.has(id));

    // IDs removidos (sumiram da aba)
    const removidos = [...existentes].filter((id) => !setAtual.has(id));

    // --- Adicionar novos ---
    if (novos.length) {
      novos.forEach((id) => {
        ticketsSet.set(id, {
          id,
          datatime: null,
          nome: null,
        });

        observarTicket(id);
        HefestoLog(`Novo ID observado: ${id}`);
      });
    }

    // --- Verificar/reconectar os já existentes (anteriores) ---
    // Para todos os IDs que ainda estão na aba agora
    atual.forEach((id) => {
      const jaTemObserver = ticketObservers.has(id);
      if (!jaTemObserver) {
        // Não há observer para um ID que está visível → adicionar
        observarTicket(id);
        HefestoLog(`Observer faltando para ID existente; adicionado: ${id}`);
        return;
      }

      // Há observer, mas o root pode ter sido recriado/desconectado
      // Se não houver root ou não estiver conectado, reconecta
      const root = getTicketRoot(id);
      if (!root || !root.isConnected) {
        try {
          pararObservacaoTicket(id); // desconecta o antigo com segurança
        } catch {
          /* noop */
        }
        observarTicket(id);
        HefestoLog(`Observer reconectado (root foi recriado) para: ${id}`);
      }
    });

    // --- Remover os que saíram ---
    if (removidos.length) {
      removidos.forEach((id) => {
        pararObservacaoTicket(id);
        ticketsSet.delete(id);
        HefestoLog(`ID removido e observador limpo: ${id}`);
      });
    }

    // Exibe tudo (debug)
    logTicketsSet();
  }

  // ========= LOG DO MAP (formato objeto como você pediu) =========
  function logTicketsSet() {
    const pretty =
      "{" +
      Array.from(ticketsSet.values())
        .map(
          (v) =>
            `${v.id}: { id: ${v.id}, datatime: ${v.datatime}, nome: ${JSON.stringify(v.nome)} }`,
        )
        .join(", ") +
      "}";

    HefestoLog(`ticketsSet = ${pretty}`);
  }

  // ========= OBSERVAÇÃO DE TICKET =========
  async function observarTicket(id) {
    if (ticketObservers.has(id)) return;

    const selector = () =>
      document.querySelector(
        `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
      );

    let root = selector();
    if (!root) {
      root = await waitForElement(selector, document, 20000);
    }
    if (!root) {
      warn(
        `Não foi possível localizar o omni-log-container para o ticket ${id} (timeout).`,
      );
      return;
    }

    if (!ticketDebouncers.has(id)) {
      ticketDebouncers.set(
        id,
        debounce(() => handleTicketChange(id), DEBOUNCE_MS),
      );
    }
    const debounced = ticketDebouncers.get(id);

    const obs = new MutationObserver(() => {
      debounced();
    });

    // 👉 Pega datetime imediatamente
    handleTicketChange(id);

    obs.observe(root, { childList: true, subtree: true });
    ticketObservers.set(id, obs);
  }

  function pararObservacaoTicket(id) {
    const obs = ticketObservers.get(id);
    if (obs) {
      try {
        obs.disconnect();
      } catch {
        /* noop */
      }

      ticketObservers.delete(id);
    }
    if (ticketDebouncers.has(id)) {
      ticketDebouncers.delete(id);
    }
    const ContadorId = `Contador${id}`;
    const Contador = document.getElementById(ContadorId);
    if (Contador) Contador.remove();
  }

  // ========= CALLBACK DE MUDANÇA DO TICKET =========
  function handleTicketChange(id) {
    const info = EncontrarOUltimoTime(id); // { datatime, nome } ou null
    const prev = ticketsSet.get(id) ?? { id, datatime: null, nome: null };

    if (!info) {
      HefestoLog(`(sem dados) ticket ${id}, mantendo anterior`);
      return;
    }

    const changedDate = info.datatime !== prev.datatime;
    const changedName = info.nome !== prev.nome;

    if (changedDate || changedName) {
      ticketsSet.set(id, {
        id,
        datatime: info.datatime ?? null,
        nome: info.nome ?? null,
      });

      if (changedDate) {
        HefestoLog(`Atualizado datatime do ticket ${id}: ${info.datatime}`);
      }
      if (changedName) {
        HefestoLog(`Atualizado nome do ticket ${id}: ${info.nome}`);
      }

      logTicketsSet();
      addContagem(id);
    } else {
      HefestoLog(`(sem mudança) ticket ${id}`);
    }
  }

  function addContagem(id) {
    const e = `Contador${id}`;
    const c = document.getElementById(e);

    if (c) {
      HefestoLog(`${e} ja existe`);
      return;
    }
    const a = document.querySelector(
      `[data-entity-id="${CSS.escape(id)}"][data-test-id="header-tab"][data-is-chat="true"]`,
    );

    const b = document.createElement("div");
    b.id = e;
    b.style.cssText = `
      box-sizing: border-box;
      justify-self: center;
      background: darkcyan;
      border-radius: 6px;
      padding: 0px 3px;
      margin-bottom: -8px;
      font-size: 12px;
      position: relative;
      z-index: 1;
      color: white;
    `;
    b.textContent = "00:00";

    if (a) {
      const d = a.querySelectorAll("div")[0];
      d.prepend(b);

      HefestoLog(`Adicionado em data-entity-id="${id}"`);
    } else {
      HefestoLog(`data-entity-id="${id}" não encontrado`);
    }
  }

  // ========= ENCONTRAR ÚLTIMO TIMESTAMP =========
  function EncontrarOUltimoTime(id) {
    try {
      // Fallback simples para CSS.escape se não existir
      const cssEscape =
        window.CSS && typeof CSS.escape === "function"
          ? CSS.escape
          : (s) => String(s).replace(/["\\]/g, "\\$&");

      const root = document.querySelector(
        `[data-ticket-id="${cssEscape(String(id))}"] [data-test-id="omni-log-container"]`,
      );
      if (!root) return null;

      const items = root.querySelectorAll(
        '[data-test-id="omni-log-comment-item"]',
      );
      if (!items.length) return null;

      // Varre do último para o primeiro: pega o mais recente "válido"
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];

        // 1) --- datetime ---
        let datatime = null;

        // Preferência: relativo -> absoluto -> qualquer time[datetime]
        const rel = it.querySelector(
          'time[data-test-id="timestamp-relative"][datetime]',
        );
        const abs = it.querySelector(
          'time[data-test-id="timestamp-absolute"][datetime]',
        );
        const any = it.querySelector("time[datetime]");

        const timeEl = rel || abs || any;
        const suffix = rel ? "R" : abs ? "A" : "";

        if (timeEl) {
          const dt = timeEl.getAttribute("datetime");
          if (dt && dt.trim()) {
            datatime = dt.trim() + suffix; // acrescenta R/A quando aplicável
          }
        }

        // 2) --- nome (sender) ---
        let nome = "";
        // Cabeçalho (mensagens "first" costumam ter)
        const senderEl = it.querySelector(
          '[data-test-id="omni-log-item-sender"]',
        );
        if (senderEl) {
          nome = (senderEl.textContent || "").trim();
        }

        // Fallback 1: link direto do usuário, quando existe
        if (!nome) {
          const userLink = it.querySelector(
            '[data-test-id="omni-log-comment-user-link"]',
          );
          if (userLink) {
            nome = (userLink.textContent || "").trim();
          }
        }

        // Fallback 2: extrair do aria-label do <article>
        if (!nome) {
          // Sobe para o <article data-test-id="omni-log-comment-item">
          const article =
            it.closest('[data-test-id="omni-log-comment-item"]') || it;
          const aria = article?.getAttribute?.("aria-label") || "";
          // Ex.: "Mensagem de RENATA VIEIRA..., por WhatsApp, Hoje 12:02"
          // Tenta puxar o trecho entre "Mensagem de " e ", por "
          const m = aria.match(/Mensagem de\s*(.+?)\s*,\s*por\s/i);
          if (m && m[1]) {
            nome = m[1].trim();
          }
        }

        // 3) Retorna quando houver ao menos um dos dois dados
        if (datatime || nome) {
          return { datatime, nome, elemento: it };
        }
      }

      return null;
    } catch (err) {
      console.error("Erro em EncontrarOUltimoTime:", err);
      return null;
    }
  }

  // ========= BOOTSTRAP =========
  (async function bootstrap() {
    const SELECTOR = '[data-test-id="header-tablist"]';
    let tablist = document.querySelector(SELECTOR);

    function conectarNoTablist(el) {
      if (!el) return null;
      iniciarObservacaoTooltip(el); // sua função existente
      tablistRef = el; // <<< guarde referência global
      return el;
    }

    if (!tablist) {
      tablist = await waitForElement(SELECTOR, document, 20000);
    }

    if (!tablist) {
      warn(
        'Elemento [data-test-id="header-tablist"] não encontrado (timeout). Observando o documento até aparecer.',
      );

      // <<< GUARDE no docObs
      docObs = new MutationObserver(() => {
        const t = document.querySelector(SELECTOR);
        if (t) {
          try {
            docObs.disconnect();
          } catch {}
          docObs = null;
          tablist = conectarNoTablist(t);
          try {
            SincronizarTicketsObservados();
          } catch (e) {
            console.warn("Erro ao sincronizar tickets (inicial):", e);
          }
        }
      });

      docObs.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
      });

      try {
        SincronizarTicketsObservados();
      } catch (e) {
        console.warn("Erro ao sincronizar tickets (fallback):", e);
      }
      return;
    }

    tablist = conectarNoTablist(tablist);
    try {
      SincronizarTicketsObservados();
    } catch (e) {
      console.warn("Erro ao sincronizar tickets (pós-conexão inicial):", e);
    }

    // <<< GUARDE no lifecycleObs
    lifecycleObs = new MutationObserver(() => {
      if (tablist && !document.contains(tablist)) {
        tablist = null;
        tablistRef = null;
      }
      if (!tablist) {
        const t = document.querySelector(SELECTOR);
        if (t && config.OBS_ATIVO) {
          // respeite a flag
          tablist = conectarNoTablist(t);
          try {
            SincronizarTicketsObservados();
          } catch (e) {
            console.warn("Erro ao sincronizar tickets (reconexão):", e);
          }
        }
      }
    });

    lifecycleObs.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  })();

  function iniciarObservacaoTooltip(headerTablist) {
    if (tooltipObserver) {
      try {
        tooltipObserver.disconnect();
      } catch {
        /* noop */
      }
      tooltipObserver = null;
    }

    // Observa somente quando elementos forem ADICIONADOS ou REMOVIDOS
    // dentro do header-tablist (sem subtree)
    tooltipObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== "childList") continue;

        if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
          SincronizarTicketsObservados();
        }
      }
    });

    tooltipObserver.observe(headerTablist, {
      childList: true, // Adições/remoções de filhos
      subtree: false, // NÃO observa netos, bisnetos etc.
    });

    HefestoLog('Observando [data-test-id="header-tablist"] (childList only).');
  }

  function isoParaDataHora(iso) {
    if (!iso) return { data: "", hora: "" };

    // Detecta R ou A no final
    let sufixo = "";
    if (/[RA]$/.test(iso)) {
      sufixo = iso.slice(-1); // "R" ou "A"
      iso = iso.slice(0, -1); // remove a letra
    }

    const dois = (n) => String(n).padStart(2, "0");

    let d;

    if (sufixo === "A") {
      // ⇨ ABSOLUTE = usar o horário exatamente como está
      // criar Date, mas depois ignorar a conversão
      const raw = iso.split("T");
      const [ano, mes, dia] = raw[0].split("-");
      const [h, m, s] = raw[1].split(":");

      const data = `${ano}-${mes}-${dia}`;
      const hora = `${h}:${m}:${s.slice(0, 2)}`;

      return { data, hora };
    } else {
      // ⇨ RELATIVE ou genérico = converter para local
      d = new Date(iso);

      const data = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
      const hora = `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;

      return { data, hora };
    }
  }

  function AtualizarTimerChat() {
    if (!(ticketsSet instanceof Map)) return;

    for (const [id, info] of ticketsSet) {
      if (!info || !info.datatime || !info.nome) continue; // precisa ter datatime

      const el = document.getElementById(`Contador${id}`);
      if (!el) {
        addContagem(id); // cria contador se não existir
        continue;
      }

      const agora = gerarDataHora(); // { data: "YYYY-MM-DD", hora: "HH:mm:ss" }
      const a = isoParaDataHora(info.datatime); // idem, vindo do ISO salvo

      // Só calcula se a data for a mesma
      if (agora.data !== a.data) continue;

      const c = exibirAHora(agora, 0, a);
      const d = converterParaSegundos(c.hora);

      const e = document.querySelector(
        `[data-entity-id="${CSS.escape(id)}"][data-test-id="header-tab"][data-is-chat="true"]`,
      );

      //if (!document.getElementById(`Contador${id}`)) return;

      // --- COR DO FUNDO ---
      el.style.background =
        info.nome !== e.getAttribute("aria-label")
          ? "#146dd3"
          : d > converterParaSegundos("00:03:00")
            ? "#d31414"
            : d > converterParaSegundos("00:02:00")
              ? "#d2791e"
              : "darkcyan";

      // --- TEXTO DO CONTADOR ---
      el.textContent = tempoEncurtado(c.hora);
    }
  }

  //desligamento e pausa
  function __safeDisconnect(obs) {
    if (!obs) return;
    try {
      obs.disconnect();
    } catch {}
  }

  function desligarBootstrapEMonitoramento(motivo = "desligado manualmente") {
    // 1) Bloqueia novas conexões durante a limpeza
    config.OBS_ATIVO = false;

    // 2) Desconecta observers "globais"
    __safeDisconnect(tooltipObserver); // criado em iniciarObservacaoTooltip
    tooltipObserver = null;

    __safeDisconnect(lifecycleObs); // criado no bootstrap
    lifecycleObs = null;

    __safeDisconnect(docObs); // criado no bootstrap quando tablist não existe
    docObs = null;

    tablistRef = null; // solta referência

    // 3) Para observação de cada ticket atualmente observado
    if (ticketsSet && typeof ticketsSet.keys === "function") {
      // se for Map<string, {...}>
      for (const id of ticketsSet.keys()) {
        try {
          pararObservacaoTicket(id); // sua função já desconecta o MutationObserver e limpa debouncer do ticket
        } catch (e) {
          console.warn(`Erro ao pararObservacaoTicket(${id}):`, e);
        }
      }
    }

    // 4) (Opcional) Limpa estruturas auxiliares se existirem
    if (ticketObservers && ticketObservers.clear) ticketObservers.clear();
    if (ticketDebouncers && ticketDebouncers.clear) ticketDebouncers.clear();

    HefestoLog(`Monitoramento desligado: ${motivo}`);
  }

  function retomarObservacao(motivo = "retomado") {
    config.OBS_ATIVO = true;

    // Recria o observer do tablist se o elemento existir
    const t = document.querySelector('[data-test-id="header-tablist"]');
    if (t) {
      iniciarObservacaoTooltip(t);
      tablistRef = t;
    } else {
      // sem tablist agora, recrie o docObs para aguardar
      docObs = new MutationObserver(() => {
        const tt = document.querySelector('[data-test-id="header-tablist"]');
        if (tt) {
          try {
            docObs.disconnect();
          } catch {}
          docObs = null;
          iniciarObservacaoTooltip(tt);
          tablistRef = tt;
          try {
            SincronizarTicketsObservados();
          } catch (e) {
            console.warn("Erro ao sincronizar tickets (retomada):", e);
          }
        }
      });
      docObs.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
      });
    }

    // Sincroniza os IDs atuais das abas e recria observers por ticket
    try {
      SincronizarTicketsObservados();
    } catch (e) {
      console.warn("Erro ao sincronizar tickets (retomada):", e);
    }

    HefestoLog(`Observação retomada: ${motivo}`);
  }
})();
