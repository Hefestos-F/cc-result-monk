// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  const stt = {
    andament: 1,
    observa: 1,
    idSelecionado: {},
    StatusTk: {},
  };

  const config = {
    NomeAt: "",
  };

  const outrav = ["RESOLVIDO", "FECHADO", "NOVO"];

  // ========= LOG UTILS =========

  const PreFixo = "Test HefestoLog:";

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

  function observarItem(aoMudar, target = document.body) {
    const observer = new MutationObserver(async () => {
      if (stt.andament) {
        stt.andament = 0;
        await aoMudar();
        stt.andament = 1;
      }
      if (stt.observa === 0) observer.disconnect();
    });

    observer.observe(target, { childList: true, subtree: true });
    return observer;
  }

  function obterEntityIdSelecionado() {
    const item = document.querySelector('[data-selected="true"]');
    if (!item) return null; // ou "", ou false — como preferir

    return item.getAttribute("data-entity-id");
  }

  /*
  observarItem(() => {
    const a = obterEntityIdSelecionado();

    if (!a) return 

    EstaResolvido(a);

  }, document.querySelector('[data-test-id="header-toolbar"]'));
*/

  function oloop() {
    MudarOitemProt();
  }

  // Atualiza o timer a cada segundo
  setInterval(oloop, 1000);

  function MudarOitemProt() {
    const itens = document.querySelectorAll("[data-selected]");

    if (!itens) return;

    itens.forEach((item) => {
      const itemSele = item.dataset.selected; // "true" | "false"
      const oId = item.dataset.entityId; // "24380006"

      const estado = stt.idSelecionado[oId];

      if (itemSele) EstaResolvido(oId);

      if (
        !estado ||
        estado.dataselected !== itemSele ||
        estado.borderTop !== item.style.borderTop ||
        estado.borderRadius !== item.style.borderRadius
      ) {
        item.style.borderRadius = "20px 20px 0px 0px";

        ["borderTop", "borderRight", "borderLeft"].forEach((a) => {
          item.style[a] = itemSele === "true" ? "2px solid #1b81ff" : "";
        });

        stt.idSelecionado[oId] = {
          dataselected: itemSele,
          borderRadius: item.style.borderRadius,
          borderTop: item.style.borderTop,
        };
      }
    });
  }

  function EstaResolvido(id) {
    const f = document.querySelector(
      `[data-test-id="ticket-${CSS.escape(id)}-standard-layout"]`,
    );

    const erroSalv = f?.querySelector(
      '[data-test-id="ticket_saving_error_notification"]',
    );

    aMarcacaoObrig(id);

    const os = getStatusAntesDoTicket(id)?.status;
    const enconAt = EncontrarAtribuido(id);

    // fallback seguro do cache
    if (!os || !enconAt) {
      //Hlog("Falso");
      return {
        eMeu: stt.StatusTk?.[id]?.eMeu ?? 0,
        Resol: stt.StatusTk?.[id]?.Resol ?? 0,
      };
    }

    const eMeu = config.NomeAt === enconAt ? 1 : 0;

    const Resol = !erroSalv && outrav.includes(os) ? 1 : 0;

    stt.StatusTk[id] = { eMeu, Resol };

    //Hlog(`Resolvido: ${Resol} / Emeu: ${eMeu}`);
    return { eMeu, Resol };
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

    const EnconAt = EncontrarAtribuido(numeroTicket);

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

  function EncontrarAtribuido(id) {
    // 1. Container do ticket
    const ticket = document.querySelector(
      `[data-test-id="ticket-${id}-standard-layout"]`,
    );
    if (!ticket) return null;

    // 2. Campo de agente atribuído
    const assigneeField = ticket.querySelector(
      '[data-test-id="assignee-field-selected-agent-tag"]',
    );
    if (!assigneeField) return null;

    // 3. Elementos que possuem atributo title
    const elementosComTitle = assigneeField.querySelectorAll("[title]");
    if (elementosComTitle.length < 2) return null;

    // 4. Retorna o title do segundo item
    return elementosComTitle[1].getAttribute("title");
  }

  function aMarcacaoObrig(id) {
    const f = document.querySelector(
      `[data-test-id="ticket-${CSS.escape(id)}-standard-layout"]`,
    );

    const erroSalv = f?.querySelector(
      '[data-test-id="ticket_saving_error_notification"]',
    );

    if (!f) return;

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

    const oSidebar = f.querySelector("#ticket_sidebar");
    if (!oSidebar) return;

    // 🧹 limpa erros antigos
    oSidebar
      .querySelectorAll(".erro-obrigatorio")
      .forEach((el) => el.classList.remove("erro-obrigatorio"));

    if (!erroSalv) return;

    // ✅ lê corretamente os spans do erro
    const osObrig = Array.from(erroSalv.querySelectorAll("li span")).map(
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

    if (osObrig.length === 0) return;

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
  }

  const ozero = document.querySelectorAll(".recent-closed__queue");

  if (!ozero.length) {
    console.log("Nenhum elemento .recent-closed__queue encontrado");
  } else {
    ozero.forEach((s) => {
      const segunda = s.textContent.trim().split(/\s+/)[0];

      console.log(segunda);
    });
  }

  function getAltFromToolbarProfile() {
    const container = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button"]',
    );
    if (!container) return null;

    const elComAlt = container.querySelector("[alt]");
    return elComAlt ? elComAlt.getAttribute("alt") : null;
  }

  function getTypographySpanByProfileAlt() {
    const alt = getAltFromToolbarProfile();
    if (!alt) return null;

    // Encontra elementos cujo texto seja exatamente igual ao alt
    const itens = [...document.querySelectorAll("*")].filter(
      (el) => el.textContent?.trim() === alt,
    );

    if (!itens.length) return null;

    let ocorreto = null;
    itens.forEach((s) => {
      // spans no mesmo container
      const noPai = s.parentElement?.querySelector(
        'span[data-garden-id="typography.font"]',
      );
      if (noPai) ocorreto = noPai;
    });

    return ocorreto;
  }

  function getNomeAntesDoTicket(numeroTicket) {
    if (!numeroTicket) return "-X";

    // span do ticket
    const ticketSpan = document.querySelectorAll(
      '[data-test-id="tabs-section-nav-item-ticket"]',
    );

    if (ticketSpan.length === 0) {
      return "X-X";
    }
    let onomecer = "XZX";

    ticketSpan.forEach((s) => {
      if (s.textContent.includes(`Ticket #${numeroTicket}`)) {
        const gg = s.parentElement.querySelector(
          '[data-test-id="tabs-nav-item-users"]',
        );

        if (gg) onomecer = gg.textContent;
      }
    });

    const nomeCompleto = normalizeNome(onomecer);

    return {
      primeiroNome: formatPrimeiroNomeDIF(nomeCompleto),
      nomeCompleto: nomeCompleto,
    };
  }

  function getAtendiHoje() {
    const a = document.querySelectorAll('[class="cus-submenu__title"]');

    let c = "Nada encontrado";
    if (a.length > 0) {
      a.forEach((b) => {
        if (b.textContent.includes("CONCLUÍDO (")) {
          const opai = b.parentElement;

          const ul = opai.querySelector("ul");

          if (!ul) return;
          //c = ul;

          const filhos = Array.from(ul.children);

          let count = 0;
          let adiv1 = 0;

          // percorre os filhos em ordem
          for (const el of filhos) {
            console.log(
              "[DEBUG] Analisando elemento:",
              el.tagName,
              el.textContent.trim(),
            );

            // ➜ se encontrar um DIV (divisor), para a contagem
            if (el.tagName === "DIV") {
              console.log(
                "[DEBUG] DIV encontrada, parando contagem:",
                el.textContent.trim(),
              );
              if (adiv1) break;
              adiv1 = 1;
            }

            // ➜ se for LI, conta
            if (el.tagName === "LI") {
              count++;
              console.log("[DEBUG] LI contado, total agora:", count);
            }
          }
          c = count;
        }
      });
    }

    return c;
  }

  async function getNomeDUsuario() {
    const SELECTOR_CONTAINER =
      '[data-garden-id="navigation.profile-menu-item-group-content-detail"] div';

    const BOTAO_SELECTOR = '[data-test-id="toolbar-profile-menu-button"]';

    // Função auxiliar para aguardar
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Tenta buscar o texto
    const getTexto = () => {
      const container = document.querySelector(SELECTOR_CONTAINER);
      return container?.textContent?.trim() || "";
    };

    // Primeira tentativa
    let texto = getTexto();
    if (texto) return texto;

    // Se não encontrou texto, tenta clicar no botão
    const oBotao = document.querySelector(BOTAO_SELECTOR);
    if (!oBotao) return null;

    oBotao.click();

    // Clica 3 vezes, com 1 segundo entre cada clique
    for (let i = 0; i < 3; i++) {
      await sleep(1000);
      texto = getTexto();
      if (texto) {
        oBotao.click();
        return texto;
      }
    }

    // Se depois de tudo ainda não encontrou
    return texto || null;
  }

  getNomeDUsuario();



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
exibirHora({hora:"22:00:00", data:"2026-05-10"},1,"04:00:00")

})();
