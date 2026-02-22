// ==UserScript==
// @name         TimerChat
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1.1.6
// @description  Observers robustos, debounce, espera SPA e armazenamento do último datetime por ticket.
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/TimerChat.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/TimerChat.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  // ========= CONFIG =========
  const DEBUG = localStorage.getItem("hefesto:debug") === "1"; // ative com: localStorage.setItem('hefesto:debug','1')
  const DEBOUNCE_MS = 300;

  // Referências globais para que possamos desconectar depois
  let OBS_ATIVO = true; // flag opcional para bloquear reconexões enquanto limpa
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

      HefestoLog(`Adicionado Contagem em data-entity-id="${id}"`);
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
        if (t && OBS_ATIVO) {
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

  function desligarBootstrapEMonitoramento(motivo = "desligado manualmente") {
    // 1) Bloqueia novas conexões durante a limpeza
    OBS_ATIVO = false;

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
    OBS_ATIVO = true;

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

  setInterval(() => {
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

  //desligamento e pausa
  function __safeDisconnect(obs) {
    if (!obs) return;
    try {
      obs.disconnect();
    } catch {}
  }
})();
