// ==UserScript==
// @name         Nice_test2
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1.1.2
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes2.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes2.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  const stt = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    observa: 1,
    Status: "",
    StatusANT: "",
    andament: 1,
  };

  const TempoPausas = {
    Logou: 0,
    Logado: 0,
    Falta: 0,
    Online: 0,
    Time: 0,
  };

  const DDPausa = {
    numero: 1,
    Data: 1,
    inicioUltimaP: 0,
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
  }

  atualizarvaraveis();

  function observarItem(aoMudar) {
    /*const alvo = document.querySelector(
      '[data-test-id="toolbar-profile-menu"]'
    );
    const alvo1 = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button-tooltip"]'
    );

    if (!alvo) {
      console.warn("HefestoLog: alvo toolbar-profile-menu não encontrado.");
      return;
    }*/

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

  function getValorinicio(id) {
    const item = dadosdePausas.find((obj) => obj.id === id);
    // Retorna undefined se não existir ou se o campo não estiver no objeto
    return item?.["inicio"];
  }

  const formatPrimeiroNome = (txt) => {
    const t = (txt || "").trim();
    if (!t) return "";
    // Extrai a primeira "palavra" (até espaço)
    const first = t.split(/\s+/)[0];
    const lower = first.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  async function atualizarvaraveis(a = 0) {
    if (a) {
      atualizarCampos(0, "NumerodPausa", DDPausa.numero);
      atualizarCampos(0, "inicioUltimaP", DDPausa.inicioUltimaP);
      atualizarCampos(0, "Status", stt.Status);
      atualizarCampos(0, "StatusANT", stt.StatusANT);
    } else {
      DDPausa.numero = Encontrarcampo(0, "NumerodPausa");
      DDPausa.inicioUltimaP = Encontrarcampo(0, "inicioUltimaP");
      stt.Status = Encontrarcampo(0, "Status");
      stt.StatusANT = Encontrarcampo(0, "StatusANT");
    }
  }

  observarItem(() => {
    //const el = document.querySelector('[data-garden-id="typography.font"]');
    const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button-tooltip"] div'
    );

    if (!el) {
      console.log("HefestoLog: Alteração aconteceu, mas ainda sem status");
      return (stt.andament = 1);
    }

    //const statusAtual = formatPrimeiroNome(el.textContent.trim());
    const statusAtual = formatPrimeiroNome(el.textContent.trim());
    //console.log(`HefestoLog: Status: ${statusAtual}`);

    // Se não mudou, não faz nada

    stt.Status = statusAtual;

    if (stt.StatusANT === stt.Status) {
      return (stt.andament = 1);
    }

    // ==========================================================
    // 3) Atualiza status anterior
    // ==========================================================
    stt.StatusANT = stt.Status;

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
      const inicioObj = getValorinicio(DDPausa.numero); // {data,hora} ou undefined

      const agora = gerarDataHora(); // { data, hora }

      if (inicioObj) {
        // Salva fim (objeto)
        await atualizarCampos(DDPausa.numero, "fim", agora);

        // Calcula duração real (string HH:MM:SS)
        const duracaoReal = calcularDuracao(inicioObj, agora);
        await atualizarCampos(DDPausa.numero, "duracao", duracaoReal);
      }

      const tempo = somarDuracoes();

      TempoPausas.Logado = tempo.totalFormatado;

      const Logou = exibirHora(agora, 0, TempoPausas.Logado);
      TempoPausas.Logou = Logou.hora;

      const agora1 = gerarDataHora();

      agora1.hora = TempoPausas.Logou;

      const Saida = exibirHora(agora1, 1, stt.TempoEscaladoHoras);
      TempoPausas.Saida = Saida.hora;

      const Falta = exibirHora(Saida, 0, agora.hora);
      TempoPausas.Falta = Falta.hora;

      console.log(`HefestoLog: 
      Logou: ${TempoPausas.Logou}, 
      Logado: ${TempoPausas.Logado}, 
      Falta: ${TempoPausas.Falta}, 
      Saida: ${TempoPausas.Saida}
      `);

      // Só executa lógica se NÃO estiver Offline e se houve mudança
      if (stt.Status.includes("Offline")) {
        console.log(`HefestoLog: Inclui Off ${stt.Status}`);
        await atualizarvaraveis(1);
        return (stt.andament = 1);
      }

      // Seu comentário original: "Se for abrir nova pausa, incremente o id"
      DDPausa.numero += 1;
      if (DDPausa.numero > 15) DDPausa.numero = 1;

      const duracaoPrevista = duracaoPrevistaPorStatus(stt.Status);
      let fimPrevistoObj = null;

      if (duracaoPrevista) {
        // exibirHora soma duracaoPrevista ao "agora"
        fimPrevistoObj = exibirHora(agora, 1, duracaoPrevista); // retorna {data,hora}
      }

      DDPausa.inicioUltimaP = agora;

      await atualizarvaraveis(1);

      //console.log(`HefestoLog: TempoPausas: ${JSON.stringify(TempoPausas)}`);
      // Cria/atualiza pausa no array + IndexedDB
      await AddouAtualizarPausas(
        DDPausa.numero,
        stt.Status,
        agora, // inicio: {data,hora}
        fimPrevistoObj || "---", // fim previsto: {data,hora} ou null
        duracaoPrevista || "---" // duracao prevista: "HH:MM:SS" ou "---"
      );
    })().catch((err) =>
      console.error("HefestoLog: erro no observer async:", err)
    );
    stt.andament = 1;
  });

  // Converte "HH:MM:SS" -> segundos
  function hhmmssParaSegundosSegura(valor) {
    if (typeof valor !== "string") return 0;
    const parts = valor.split(":");
    if (parts.length !== 3) return 0;
    const [hh, mm, ss] = parts.map((n) => Number(n));
    // Verifica se são números válidos
    if ([hh, mm, ss].some((n) => Number.isNaN(n) || n < 0)) return 0;
    return hh * 3600 + mm * 60 + ss;
  }

  // Formata segundos para "HH:MM:SS" (aceita 0)
  function segundosParaHhmmss(segundos) {
    const s = Math.max(0, Number(segundos) || 0);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
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
      const s = hhmmssParaSegundosSegura(item?.duracao);
      return acc + (Number.isFinite(s) ? s : 0);
    }, 0);

    return {
      totalSegundos,
      totalFormatado: segundosParaHhmmss(totalSegundos),
    };
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
        /^([+-])(\d{1,2}):(\d{2})(?::(\d{2}))?$/
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
          baseObj || { data: "1970-01-01", hora: "00:00:00" }
        );
        return Math.abs(Math.floor((dVal.getTime() - dBase.getTime()) / 1000));
      }
      return 0;
    }

    // --- Formata retorno {data:'YYYY-MM-DD', hora:'HH:MM:SS'} em fuso local ---
    function formatObj(date) {
      const data = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const hora = `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
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
        horaedataparacalculo
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

  function criarObjetoFlutuante(id = "timerFlutuante") {
    // Evita duplicar
    if (document.getElementById(id)) return;

    const div = document.createElement("div");

    const div2 = document.createElement("div");
    div2.id = `T${id}`;
    div2.textContent = "";
    const div3 = document.createElement("div");
    div3.id = id;
    div3.textContent = "00:00:00";

    // Estilo inicial
    Object.assign(div.style, {
      position: "fixed",
      bottom: "4px",
      left: "4px",
      background: "#222",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "16px",
      zIndex: "9999",
      cursor: "move",
      boxSizing: "border-box", // evita crescer por padding/borda
      userSelect: "none",
      // Preparar para transform
      transform: "translate(0px, 0px)",
      willChange: "transform",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
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

    div.appendChild(div2);
    div.appendChild(div3);
    document.body.appendChild(div);
  }

  criarObjetoFlutuante();

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
        "Formato de data inválido. Use YYYY-MM-DD ou DD/MM/YYYY."
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
        throw new Error("Formato de hora inválido. Use HH:MM:SS.");
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
        "Operação inválida. Use 1 para soma ou 0 para subtração."
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
        resultDate.getMinutes()
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

  // Atualiza o timer a cada segundo
  setInterval(() => {
    const time = document.getElementById("timerFlutuante");
    const titulo = document.getElementById("TtimerFlutuante");
    if (!time || !titulo) return;

    // Se ainda não há início de pausa definido, mostra zero
    if (
      !DDPausa.inicioUltimaP ||
      !DDPausa.inicioUltimaP.data ||
      stt.Status.includes("Offline")
    ) {
      time.textContent = "00:00:00";
      titulo.textContent = stt.Status;
      return;
    }

    const agora = gerarDataHora();

    // exibirHora precisa ser a versão que calcula a diferença quando o 3º parâmetro é objeto absoluto
    // Pegamos apenas a 'hora' do retorno (formato HH:MM:SS) para servir como cronômetro
    /*console.log(`HefestoLog: agora: ${JSON.stringify(agora)}`);
    console.log(
      `HefestoLog: TempoPausas.inicioUltimaP: ${JSON.stringify(
        TempoPausas.inicioUltimaP
      )}`
          );*/
    titulo.textContent = stt.Status;
    time.textContent = exibirAHora(agora, 0, DDPausa.inicioUltimaP).hora;
    //time.textContent = agora.hora;
  }, 1000);

  async function AddouAtualizarPausas(id, pausa, inicio, fim, duracao) {
    const novoItem = { id, pausa, inicio, fim, duracao };

    if (!Array.isArray(dadosdePausas)) dadosdePausas = [];

    const index = dadosdePausas.findIndex(
      (item) => String(item?.id) === String(id)
    );

    if (index !== -1) {
      dadosdePausas[index] = { ...dadosdePausas[index], ...novoItem };
    } else {
      dadosdePausas.push(novoItem);
    }

    await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
  }

  function Encontrarcampo(id, campo) {
    const item = dadosdePausas.find((obj) => obj.id === id);
    if (!item) return null;
    return campo in item ? item[campo] : null;
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
      console.error("NiceMonk Erro ao atualizar campos no IndexedDB:", err);
    }

    if (c === "duracao") {
      console.debug("NiceMonk Tabela salva:", ChavePausas);
    }
  }

  function getValorinicio(id) {
    dadosdePausas = normalizarArrayPausas(dadosdePausas);
    const item = dadosdePausas.find((obj) => String(obj?.id) === String(id));
    return item?.inicio; // objeto {data,hora}
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
})();
