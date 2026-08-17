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

  // Referências globais para que possamos desconectar depois
  let lifecycleObs = null; // observer que monitora sumiço/volta do tablist
  let docObs = null; // observer temporário usado até o tablist aparecer
  let tablistRef = null; // referência atual do [data-test-id="header-tablist"]

  //DDPausa
  const dadosDpausa = {
    NdeIdAtivo: 0,
  };

  // ========= CONFIG =========
  const config = {
    dBUG: 1,
    OBS_ATIVO: 1, // flag opcional para bloquear reconexões enquanto limpa
    DEBOUNCE_MS: 300,
  };

  const stt = {};

  const Ccor = {};

  const outrav = {};

  // ========= LOG UTILS =========

  const PreFixo = "zend timer Hefesto Log:";

  function Hlog(...args) {
    console.log(PreFixo, ...args);
  }
  function Hlog(...args) {
    console.log(PreFixo, ...args);
  }
  function Hwarn(...args) {
    console.warn(PreFixo, ...args);
  }
  function Herror(...args) {
    console.error(PreFixo, ...args);
  }
  function Hdebug(...args) {
    console.debug(PreFixo, ...args);
  }
  function Hinfo(...args) {
    console.info(PreFixo, ...args);
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

  let listaTicketCabecalho = [];

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

  // ========= COLETA DE IDS =========
  function ObterEntityId() {
    const container =
      tablistRef || document.querySelector('[data-test-id="header-tablist"]');

    // ✅ não existe ou já foi removido
    if (!container || !container.isConnected) {
      return { total: 0, elementos: [], ids: [] };
    }

    // ✅ DOM ainda em reconstrução (tabs não prontas)
    if (
      !container.querySelector('[data-test-id="header-tab"], [data-entity-id]')
    ) {
      return { total: 0, elementos: [], ids: [] };
    }

    const itens = [...container.querySelectorAll("[data-entity-id]")];
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
    Hlog("Sincronizando tickets observados...");

    const idsAtual = ObterEntityId().ids.map(String); // garante string

    const idsAtualLimpo = [];
    const idsNaLista = [];
    const idsRemovidos = [];
    const idsNovos = [];

    idsAtual.forEach((ids) => {
      const temLetra = /[a-zA-Z]/.test(ids);
      if (!temLetra) {
        idsAtualLimpo.push(ids);
      }
    });

    listaTicketCabecalho.forEach((linhas) => {
      if (!idsNaLista.includes(linhas.id)) {
        idsNaLista.push(linhas.id);
      }

      if (!idsAtualLimpo.includes(linhas.id)) {
        idsRemovidos.push(linhas.id);
      }
    });

    Hlog(`idsRemovidos: ${idsRemovidos}`);

    Hlog(`idsNaLista: ${idsNaLista}`);

    idsAtualLimpo.forEach((id) => {
      if (!idsNaLista.includes(id)) {
        idsNovos.push(id);
      }
    });

    Hlog(`idsNovos: ${idsNovos}`);

    //gfg
    //alistaNova.filter(item => item.id !== 13);

    // --- Verificar/reconectar os já existentes (anteriores) ---
    // Para todos os IDs que ainda estão na aba agora
    idsAtualLimpo.forEach((id) => {
      const jaTemObserver = ticketObservers.has(id);
      if (!jaTemObserver) {
        // Não há observer para um ID que está visível → adicionar
        observarTicket(id);
        Hlog(`Observer faltando para ID existente; adicionado: ${id}`);
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
        Hlog(`Observer reconectado (root foi recriado) para: ${id}`);
      }
    });

    // --- Remover os que saíram ---
    if (idsRemovidos.length) {
      idsRemovidos.forEach((id) => {
        pararObservacaoTicket(id);
        const listaLimpa = listaTicketCabecalho.filter(
          (item) => item.id !== id,
        );
        listaTicketCabecalho = listaLimpa;
        Hlog(`ID removido e observador limpo: ${id}`);
      });
    }
  }

  // ========= OBSERVAÇÃO DE TICKET =========
  async function observarTicket(id) {
    // Evita criar mais de um observer para o mesmo ticket
    if (ticketObservers.has(id)) return;

    // Função que localiza o container de logs do ticket pelo data-ticket-id
    const selector = () =>
      document.querySelector(
        `[data-ticket-id="${CSS.escape(id)}"] [data-test-id="omni-log-container"]`,
      );

    // Tenta encontrar o elemento imediatamente
    let root = selector();

    // Se não encontrar, aguarda o elemento aparecer no DOM (até 20s)
    if (!root) {
      root = await waitForElement(selector, document, 20000);
    }

    // Se mesmo após aguardar o elemento não existir, registra um aviso e sai
    if (!root) {
      Hwarn(
        `Não foi possível localizar o omni-log-container para o ticket ${id} (timeout).`,
      );
      return;
    }

    // Cria um debounce para o ticket caso ainda não exista
    if (!ticketDebouncers.has(id)) {
      ticketDebouncers.set(
        id,
        debounce(() => atualizarMudancaTicket(id), config.DEBOUNCE_MS),
      );
    }

    // Recupera a função debounced associada ao ticket
    const debounced = ticketDebouncers.get(id);

    // Cria um MutationObserver para reagir a mudanças no DOM
    const obs = new MutationObserver(() => {
      // Ao detectar alterações, chama o handler de forma debounced
      debounced();
    });

    // 👉 Executa imediatamente para capturar o estado inicial (ex.: datetime atual)
    await atualizarMudancaTicket(id);
    addContagem(id);
    //Hlog("atualizarMudancaTicket Chamado");

    // Observa adições/remoções de nós dentro do container, inclusive em subárvores
    obs.observe(root, { childList: true, subtree: true });

    // Armazena o observer para evitar duplicações e permitir controle futuro
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

  // ========= ENCONTRAR ÚLTIMO TIMESTAMP =========
  function varrerChat(id) {
    try {
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

      // =============================================================
      // 1) --- IDENTIFICAR O ÚLTIMO ITEM COM DATETIME OU NOME ---
      // =============================================================
      let ultimo = null;

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];

        // --- datetime ---
        let datatime = null;
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
            datatime = dt.trim() + suffix;
          }
        }

        // --- nome (sender) ---
        let nome = "";
        const senderEl = it.querySelector(
          '[data-test-id="omni-log-item-sender"]',
        );
        if (senderEl) {
          nome = (senderEl.textContent || "").trim();
        }

        if (!nome) {
          const userLink = it.querySelector(
            '[data-test-id="omni-log-comment-user-link"]',
          );
          if (userLink) {
            nome = (userLink.textContent || "").trim();
          }
        }

        if (!nome) {
          const article =
            it.closest('[data-test-id="omni-log-comment-item"]') || it;
          const aria = article?.getAttribute?.("aria-label") || "";
          const m = aria.match(/Mensagem de\s*(.+?)\s*,\s*por\s/i);
          if (m && m[1]) {
            nome = m[1].trim();
          }
        }

        if (datatime || nome) {
          ultimo = { index: i, datatime, nome, elemento: it };
          break;
        }
      }

      if (!ultimo) return null;

      // =============================================================
      // 2) --- NOVA AÇÃO ---
      // Encontrar sequência consecutiva do mesmo nome
      // =============================================================

      const nomeAlvo = ultimo.nome;
      let count = 1;
      let primeiroDatetimeDaSequencia = ultimo.datatime;

      // varrer para trás até quebrar a sequência
      for (let j = ultimo.index - 1; j >= 0; j--) {
        const it = items[j];

        // extrair nome novamente
        let nomeTemp = "";
        const senderEl = it.querySelector(
          '[data-test-id="omni-log-item-sender"]',
        );
        if (senderEl) {
          nomeTemp = (senderEl.textContent || "").trim();
        }

        if (!nomeTemp) {
          const userLink = it.querySelector(
            '[data-test-id="omni-log-comment-user-link"]',
          );
          if (userLink) nomeTemp = (userLink.textContent || "").trim();
        }

        if (!nomeTemp) {
          const article =
            it.closest('[data-test-id="omni-log-comment-item"]') || it;
          const aria = article?.getAttribute?.("aria-label") || "";
          const m = aria.match(/Mensagem de\s*(.+?)\s*,\s*por\s/i);
          if (m && m[1]) {
            nomeTemp = m[1].trim();
          }
        }

        // se mudou o nome → para
        if (nomeTemp !== nomeAlvo) break;

        // ler datetime
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
            primeiroDatetimeDaSequencia = dt.trim() + suffix;
          }
        }

        count++;
      }

      // =============================================================
      // 3) --- RETORNO COMPLETO ---
      // =============================================================
      return {
        ultimoDatetime: ultimo.datatime,
        ultimoNome: ultimo.nome,
        elemento: ultimo.elemento,
        quantidade: count,
        primeiroDatetime: primeiroDatetimeDaSequencia,
      };
    } catch (err) {
      console.error("Erro em varrerChat:", err);
      return null;
    }
  }

  // ========= CALLBACK DE MUDANÇA DO TICKET =========
  function atualizarMudancaTicket(id) {
    const chat = varrerChat(id);
    const status = getStatusAntesDoTicket(id).status;
    const AgenteESetor = EncontrarAgenteESetor(id);

    if (!chat) {
      Hlog(`(sem dados) ticket ${id}, mantendo anterior`);
      return;
    }

    let itemdaLista = {};

    itemdaLista.id = id;
    itemdaLista.setor = AgenteESetor.setor || null;
    itemdaLista.status = status || null;
    itemdaLista.agente = AgenteESetor.agente || null;
    itemdaLista.UltimoTime = chat.ultimoDatetime || null;
    if (chat.ultimoNome && chat.ultimoNome != AgenteESetor.agente)
      itemdaLista.nomeCliente = chat.ultimoNome;
    itemdaLista.nomeUltimaMens = chat.ultimoNome || null;
    itemdaLista.NumeroMensagensSequencia = chat.quantidade || null;
    itemdaLista.PrimeiroDateTimeSequencia = chat.primeiroDatetime || null;

    let itemdaListaAnterior = {};

    if (!listaTicketCabecalho.length) {
      listaTicketCabecalho.push(itemdaLista);
      Hlog(`Adicionado a listaTicketCabecalho ${id}`);
    } else {
      listaTicketCabecalho.forEach((itemLista) => {
        if (itemLista.id == id) {
          if (itemdaLista != itemLista) {
            Object.keys(itemLista).forEach((chave) => {
              if (itemdaLista[chave] !== itemLista[chave]) {
                itemLista[chave] = itemdaLista[chave];
                Hlog(`Atualizado ${id}: ${chave} = ${itemdaLista[chave]}`);
              }
            });
            //Hlog(`listaTicketCabecalho: `);
            // Hlog(listaTicketCabecalho);
          } else {
            Hlog(`(sem mudança) ticket ${id}`);
          }
        }
      });
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
      Hwarn(
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
            Hwarn("Erro ao sincronizar tickets (inicial):", e);
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
        Hwarn("Erro ao sincronizar tickets (fallback):", e);
      }
      return;
    }

    tablist = conectarNoTablist(tablist);
    try {
      SincronizarTicketsObservados();
    } catch (e) {
      Hwarn("Erro ao sincronizar tickets (pós-conexão inicial):", e);
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
            Hwarn("Erro ao sincronizar tickets (reconexão):", e);
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
      } catch {}
      tooltipObserver = null;
    }

    // Debounce do sync (evita tempestade de eventos)
    const syncDebounced = debounce(() => {
      if (!config.OBS_ATIVO) return;
      try {
        SincronizarTicketsObservados();
      } catch (e) {
        Hwarn("Erro ao sincronizar tickets (tablist observer):", e);
      }
    }, 120);

    // Checa se a mutation realmente envolve tabs/tickets
    function mutationTemEntity(m) {
      const nodes = [
        ...(m.addedNodes ? Array.from(m.addedNodes) : []),
        ...(m.removedNodes ? Array.from(m.removedNodes) : []),
      ];

      for (const n of nodes) {
        if (!n || n.nodeType !== 1) continue;

        // o próprio nó é uma aba?
        if (n.matches?.('[data-entity-id],[data-test-id="header-tab"]'))
          return true;

        // ou contém alguma aba dentro?
        if (n.querySelector?.('[data-entity-id],[data-test-id="header-tab"]'))
          return true;
      }
      return false;
    }

    tooltipObserver = new MutationObserver((mutations) => {
      if (!config.OBS_ATIVO) return;

      for (const m of mutations) {
        if (m.type !== "childList") continue;
        if (mutationTemEntity(m)) {
          // Debug opcional:
          Hlog("[tablist] mudança relevante detectada → syncDebounced()");
          syncDebounced();
          break;
        }
      }
    });

    // ✅ Aqui está o ponto chave: subtree: true
    tooltipObserver.observe(headerTablist, {
      childList: true,
      subtree: true,
    });

    Hlog('Observando [data-test-id="header-tablist"] (childList + subtree).');
  }

  function getStatusAntesDoTicket(numeroTicket) {
    if (!numeroTicket) return { resolvido: false, status: "DESCONHECIDO" };

    const ticketSpan = [
      ...document.querySelectorAll(
        '[data-test-id="tabs-section-nav-item-ticket"]',
      ),
    ].find((el) => el.textContent.includes(`Ticket #${numeroTicket}`));

    if (!ticketSpan) {
      return { resolvido: false, status: "NÃO ENCONTRADO" };
    }

    const statusEl = ticketSpan.querySelector(".ticket_status_label");

    const oId = document.querySelector(
      `[data-entity-id="${CSS.escape(numeroTicket)}"][data-test-id="header-tab"]`,
    );

    const Alterado = oId.querySelector(
      '[data-test-id="omnitab-dirty-notification"]',
    );

    if (!statusEl) {
      return { resolvido: false, status: "EM ANDAMENTO" };
    }

    const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();

    const statusTxt = normalize(statusEl.textContent).toUpperCase();

    return {
      resolvido: /RESOLVIDO|SOLVED|ENCERRADO/.test(statusTxt),
      status: statusTxt,
    };
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

    if (listaTicketCabecalho.length) {
      for (const linha of listaTicketCabecalho) {
        try {
          pararObservacaoTicket(linha.id);
        } catch (e) {
          Hwarn(`Erro ao pararObservacaoTicket(${linha.id}):`, e);
        }
      }
    }

    // 4) (Opcional) Limpa estruturas auxiliares se existirem
    if (ticketObservers && ticketObservers.clear) ticketObservers.clear();
    if (ticketDebouncers && ticketDebouncers.clear) ticketDebouncers.clear();

    Hlog(`Monitoramento desligado: ${motivo}`);
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
            Hwarn("Erro ao sincronizar tickets (retomada):", e);
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
      Hwarn("Erro ao sincronizar tickets (retomada):", e);
    }

    Hlog(`Observação retomada: ${motivo}`);
  }

  function addContagem(id) {
    const e = `Contador${id}`;
    const c = document.getElementById(e);

    if (c) {
      Hlog(`${e} ja existe`);
      return;
    }

    const ab = document.querySelector('[data-test-id="header-tablist"]');

    const a = ab.querySelector(`[data-entity-id="${CSS.escape(id)}"]`);

    const b = document.createElement("div");
    b.id = e;
    b.style.cssText = `
      box-sizing: border-box;
      justify-self: center;
      background: darkcyan;
      border-radius: 6px;
      padding: 0px 3px;
      margin-bottom: -2px;
      font-size: 12px;
      position: relative;
      z-index: 1;
      color: white;
    `;
    b.textContent = "...";

    if (a && ab) {
      const d = a.querySelectorAll("div")[0];
      d.style.flexDirection = "column";

      d.prepend(b);

      Hlog(`Adicionado em data-entity-id="${id}"`);
    } else {
      Hlog(`data-entity-id="${id}" não encontrado`);
    }
  }

  function EncontrarAgenteESetor(id) {
    const conteinerDoTicket = document.querySelector(
      `[data-test-id="ticket-${id}-standard-layout"]`,
    );

    if (!conteinerDoTicket) return { agente: null, setor: null };

    const linhaAtribuido = conteinerDoTicket.querySelector(
      '[data-test-id="assignee-field-selected-agent-tag"]',
    );

    if (!linhaAtribuido) return { agente: null, setor: null };

    const elementosComTitle = linhaAtribuido.querySelectorAll("[title]");
    if (elementosComTitle.length < 2) return { agente: null, setor: null };

    return {
      agente: elementosComTitle[1].getAttribute("title"),
      setor: elementosComTitle[0].getAttribute("title"),
    };
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

  function marcarFaltaPreencher(id) {
    const conteinerId = document.querySelector(
      `[data-test-id="ticket-${CSS.escape(id)}-standard-layout"]`,
    );
    if (!conteinerId) return null;

    const caixaErro = conteinerId?.querySelector(
      '[data-test-id="ticket_saving_error_notification"]',
    );
    const erroNaTela = caixaErro ? 1 : 0;

    // 🔴 CSS de erro (injetado uma vez)
    const STYLE_ID = "estilo-ErroOb";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .erro-obrigatorio {
          border: 1px solid red;
          border-radius: 15px;
          padding: 0px 2px;
        }
      `;
      document.head.appendChild(style);
    }

    const oSidebar = conteinerId.querySelector("#ticket_sidebar");
    if (!oSidebar) return null;

    // 🧹 limpa erros antigos
    oSidebar
      .querySelectorAll(".erro-obrigatorio")
      .forEach((el) => el.classList.remove("erro-obrigatorio"));

    if (!caixaErro) return erroNaTela;

    // ✅ lê corretamente os spans do erro
    const osObrig = Array.from(caixaErro.querySelectorAll("li span")).map(
      (span) =>
        span.textContent.replace(" é obrigatório", "").replace(/"/g, "").trim(),
    );

    // 🔎 normalização segura
    const normalizar = (txt = "") =>
      txt
        .replace("*", "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();

    if (osObrig.length === 0) return null;

    const obrigNorm = osObrig.map(normalizar);

    // ✅ agora buscamos os LABELS (não "*")
    const labels = oSidebar.querySelectorAll(
      'label[data-garden-id="forms.input_label"]',
    );

    labels.forEach((label) => {
      const textoLabel = normalizar(label.textContent);

      if (obrigNorm.includes(textoLabel)) {
        label.classList.add("erro-obrigatorio");
      }
    });

    return erroNaTela;
  }

  function AtualizarTimerChat() {
    if (!listaTicketCabecalho) return;

    let atendimentosAtivos = 0;

    for (const linha of listaTicketCabecalho) {
      if (!linha) continue; // precisa ter datatime

      //Hlog(`linha true`);

      const abaTicket = document.querySelector(
        `[data-entity-id="${CSS.escape(linha.id)}"][data-test-id="header-tab"]`,
      );

      const elementoContador = document.getElementById(`Contador${linha.id}`);

      const normalize = (s) =>
        (s || "").replace(/\s+/g, " ").trim().toUpperCase();

      const estaResolvido =
        ["RESOLVIDO", "FECHADO"].includes(normalize(linha.status)) &&
        !marcarFaltaPreencher(linha.id);

      //const eMeu = config.NomeAt == linha.agente;
      const eMeu = 1;

      const eWwp = normalize(linha.setor).includes(normalize("whatsapp"));

      if (!elementoContador) {
        if (eMeu && !estaResolvido && eWwp) {
          addContagem(linha.id); // cria contador se não existir
          Hdebug(`Contador Criado Em ${linha.id}`);
        }
        continue;
      }

      const agora = gerarDataHora(); // { data: "YYYY-MM-DD", hora: "HH:mm:ss" }
      const datetimeConvertido = isoParaDataHora(
        linha.PrimeiroDateTimeSequencia,
      ); // idem, vindo do ISO salvo

      //Hdebug(`datetimeConvertido: `);
      //Hdebug(datetimeConvertido);

      const diferencaUltimaMensAgora = exibirAHora(
        agora,
        0,
        datetimeConvertido,
      );
      const diferencaSegundos = converterParaSegundos(
        diferencaUltimaMensAgora.hora,
      );

      // --- COR DO FUNDO ---
      const SeisM = converterParaSegundos("00:06:00");
      const CincM = converterParaSegundos("00:05:00");
      const TresM = converterParaSegundos("00:03:00");
      //const CincS = converterParaSegundos("00:00:05");

      elementoContador.style.backgroundColor =
        diferencaSegundos > CincM
          ? Ccor.Alerta
          : diferencaSegundos > TresM
            ? Ccor.Aviso
            : Ccor.Contagem;

      if (abaTicket)
        abaTicket.style.borderBottom =
          diferencaSegundos >= SeisM ? `6px solid ${Ccor.Alerta}` : "";

      // --- TEXTO DO CONTADOR ---
      elementoContador.textContent = tempoEncurtado(
        diferencaUltimaMensAgora.hora,
      );

      if (estaResolvido || agora.data !== datetimeConvertido.data) {
        if (abaTicket && abaTicket.style.borderBottom !== "")
          abaTicket.style.borderBottom = "";
        elementoContador.remove();
      }

      if (eMeu && !estaResolvido) {
        atendimentosAtivos++;
      }
    }
    if (atendimentosAtivos !== dadosDpausa.NdeIdAtivo) {
      dadosDpausa.NdeIdAtivo = atendimentosAtivos;
      Hlog(`Mudança dadosDpausa.NdeIdAtivo: ${dadosDpausa.NdeIdAtivo}`);
    }
  }

  setInterval(AtualizarTimerChat, 1000);
})();
