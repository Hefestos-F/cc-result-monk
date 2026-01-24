// ==UserScript==
// @name         TimerChat
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1.1.1
// @description  Observers robustos, debounce, espera SPA e armazenamento do último datetime por ticket.
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/TimerChat.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/TimerChat.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  // ========= CONFIG =========
  const DEBUG = localStorage.getItem("hefesto:debug") === "1"; // ative com: localStorage.setItem('hefesto:debug','1')
  const DEBOUNCE_MS = 300;

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
  // Agora ticketsSet guarda: id -> último datetime (string ISO) ou null (desconhecido)
  /** @type {Map<string, string|null>} */
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

  // ========= SYNC DE IDS =========
  function SincronizarTicketsObservados() {
    const atual = ObterEntityId().ids;

    // Conjuntos auxiliares
    const setAtual = new Set(atual);
    const existentes = new Set(ticketsSet.keys());

    // Novos: estão em 'atual' mas não no Map
    const novos = atual.filter((id) => !existentes.has(id));
    // Removidos: estão no Map mas não em 'atual'
    const removidos = [...existentes].filter((id) => !setAtual.has(id));

    if (novos.length) {
      novos.forEach((id) => {
        // inicia com "desconhecido"
        ticketsSet.set(id, null);
        observarTicket(id);
        HefestoLog(`Novo ID observado: ${id}`);
      });
    }

    if (removidos.length) {
      removidos.forEach((id) => {
        pararObservacaoTicket(id);
        ticketsSet.delete(id);
        HefestoLog(`ID removido e observador limpo: ${id}`);
      });
    }

    logTicketsSet();
  }

  // ========= LOG DO MAP (formato objeto como você pediu) =========
  function logTicketsSet() {
    // Converte Map -> objeto simples { id: datetime }
    const obj = {};
    for (const [id, dt] of ticketsSet.entries()) {
      obj[id] = dt || null;
    }
    // Exibe em uma linha parecida com: ticketsSet = {22948737: 2026-01-23T17:22:30.000Z}
    const pretty =
      "{" +
      Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
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

    // 👉 NOVA LINHA: pega datetime imediatamente
    addContagem(id);
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
  }

  // ========= CALLBACK DE MUDANÇA DO TICKET =========
  function handleTicketChange(id) {
    const newDt = EncontrarOUltimoTime(id);
    const oldDt = ticketsSet.get(id) ?? null;

    // Só atualiza/loga se mudou de fato
    if (newDt && newDt !== oldDt) {
      ticketsSet.set(id, newDt);
      HefestoLog(`Último datetime do ticket ${id}: ${newDt}`);
      logTicketsSet();
      // 👉 Se quiser acionar algo aqui (toast, som, postMessage, etc.), este é o lugar.
    } else if (!newDt && oldDt !== null) {
      // Se antes tinha valor e agora não achamos nenhum, podemos registrar (opcional)
      HefestoLog(
        `datetime ausente no momento para o ticket ${id}. Mantendo valor anterior: ${oldDt}`,
      );
    } else {
      // Sem mudança real — silêncio para evitar spam
      HefestoLog(`(sem mudança) ticket ${id}`);
    }
  }

  function addContagem(id) {
    const e = `Contador${id}`;
    const c = document.querySelector(e);
    if (c) return;
    const a = document.querySelector(
      `[data-entity-id="${CSS.escape(id)}"][data-test-id="header-tab"][data-entity-type="ticket"]`,
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
    `;
    b.textContent = "00:00";

    if (a) {
      const d = a.querySelectorAll("div")[0];
      d.prepend(b);
    }
  }

  // ========= ENCONTRAR ÚLTIMO TIMESTAMP =========
  function EncontrarOUltimoTime(id) {
    try {
      const root = document.querySelector(
        `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
      );
      if (!root) {
        return null;
      }

      const items = root.querySelectorAll(
        '[data-test-id="omni-log-comment-item"]',
      );
      if (!items.length) return null;

      const lastItem = items[items.length - 1];

      // Estrutura típica: <div data-test-id="timestamp-relative"><time datetime="..."></time></div>
      let ts = lastItem.querySelector('[data-test-id="timestamp-relative"]');
      let datetime = null;

      if (ts) {
        const timeEl = ts.matches("time") ? ts : ts.querySelector("time");
        if (timeEl) {
          datetime = timeEl.getAttribute("datetime") || null;
        } else {
          // fallback: atributo direto
          datetime = ts.getAttribute("datetime") || null;
        }
      } else {
        // fallback amplo
        const anyTime = lastItem.querySelector("time[datetime]");
        if (anyTime) datetime = anyTime.getAttribute("datetime") || null;
      }

      if (typeof datetime === "string") {
        datetime = datetime.trim();
      }

      return datetime || null;
    } catch (err) {
      error("Erro em EncontrarOUltimoTime:", err);
      return null;
    }
  }

  // ========= BOOTSTRAP =========
  (async function bootstrap() {
    let tooltip = document.querySelector('[id="tooltip-container"]');
    if (!tooltip) {
      tooltip = await waitForElement(
        '[id="tooltip-container"]',
        document,
        20000,
      );
    }

    if (!tooltip) {
      warn(
        "Tooltip container (#tooltip-container) não encontrado (timeout). Observando documento inteiro temporariamente.",
      );
      const docObs = new MutationObserver(() => {
        const t = document.querySelector('[id="tooltip-container"]');
        if (t) {
          docObs.disconnect();
          iniciarObservacaoTooltip(t);
        }
      });
      docObs.observe(document, { childList: true, subtree: true });
      // Sync inicial (caso já existam IDs dispersos)
      SincronizarTicketsObservados();
      return;
    }

    iniciarObservacaoTooltip(tooltip);
    SincronizarTicketsObservados();
  })();

  function iniciarObservacaoTooltip(tooltip) {
    if (tooltipObserver) {
      try {
        tooltipObserver.disconnect();
      } catch {
        /* noop */
      }
      tooltipObserver = null;
    }

    tooltipObserver = new MutationObserver(() => {
      SincronizarTicketsObservados();
    });

    tooltipObserver.observe(tooltip, { childList: true, subtree: true });
    HefestoLog("Observando #tooltip-container.");
  }

  function isoParaDataHora(iso) {
    const d = new Date(iso);

    const dois = (n) => String(n).padStart(2, "0");

    return {
      data: `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`,
      hora: `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`,
    };
  }

  function atualizarTimer() {
    if (!(ticketsSet instanceof Map)) return; // checagem correta para Map

    // Itera diretamente sobre o Map
    for (const [id, iso] of ticketsSet) {
      if (!iso) continue; // só atualiza se tiver valor

      const el = document.getElementById(`Contador${id}`);
      if (!el) continue;

      const agora = gerarDataHora(); // { data: "YYYY-MM-DD", hora: "HH:mm:ss" }
      const a = isoParaDataHora(String(iso)); // idem acima, partindo do ISO

      if (agora.data !== a.data) continue;

      const c = exibirAHora(agora, 0, a);
      const d = converterParaSegundos(c.hora);

      el.style.background =
        d > converterParaSegundos("00:03:00")
          ? "#d31414"
          : d > converterParaSegundos("00:02:00")
            ? "#d2791e"
            : "darkcyan";

      el.textContent =
        d > converterParaSegundos("00:59:00") ? "+1h" : tempoEncurtado(c.hora);
    }
  }

  setInterval(() => {
    atualizarTimer();
  }, 1000);

  function gerarDataHora() {
    const agora = new Date();

    const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
    const data = agora.toISOString().split("T")[0];

    return {
      hora: hora,
      data: data,
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
})();
