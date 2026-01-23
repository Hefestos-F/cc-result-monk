// ==UserScript==
// @name         Nice_test
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  const stt = {
    andament: 1,
    observa: 1,
  };

  let ticketsObs = []; // exemplo: ["22949120", "22945515"]

  function HefestoLog(q) {
    console.log(`HefestoLog: ${q}`);
  }

  function observarItem(aoMudar, qual = document.body) {
    if (!qual) {
      HefestoLog(`Nao encontrado: ${qual}`);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Se o item observado sumiu do DOM → desconecta
      if (!document.contains(qual)) {
        HefestoLog(`observer Desconectado (item removido do DOM): ${qual}`);
        observer.disconnect();
        return;
      }

      // Sua lógica original
      if (stt.andament) {
        stt.andament = 0;
        aoMudar();
      }

      // Desconectar se stt.observa for 0
      if (stt.observa === 0) {
        observer.disconnect();
        HefestoLog("observer Desconectado (stt.observa = 0)");
      }
    });

    observer.observe(qual, { childList: true, subtree: true });
  }

  function ObterEntityId() {
    const itens = [
      ...document.querySelectorAll('[id="tooltip-container"] [data-entity-id]'),
    ];
    return {
      total: itens.length,
      elementos: itens,
      ids: itens.map((el) => el.getAttribute("data-entity-id")),
    };
  }

  function SincronizarTicketsObservados() {
    const atual = ObterEntityId().ids; // ids atuais no DOM

    // ==============================================================
    // ⭐ REGRA NOVA → Se ticketsObs está vazio, preencher e chamar função
    // ==============================================================
    if (ticketsObs.length === 0 && atual.length > 0) {
      ticketsObs = [...atual];

      atual.forEach((id) => {
        observarItem2(id);
        HefestoLog(`(Inicial) Observando ID: ${id}`);
      });

      HefestoLog(`ticketsObs inicializado: [${ticketsObs.join(", ")}]`);
      return; // encerra aqui para não executar o restante
    }

    // ==============================================================
    // ENCONTRAR NOVOS IDs
    // ==============================================================
    const novos = atual.filter((id) => !ticketsObs.includes(id));

    // ==============================================================
    // ENCONTRAR REMOVIDOS
    // ==============================================================
    const removidos = ticketsObs.filter((id) => !atual.includes(id));

    // ==============================================================
    // PROCESSAR NOVOS IDs
    // ==============================================================
    if (novos.length > 0) {
      novos.forEach((id) => {
        ticketsObs.push(id);
        observarItem2(id);
        HefestoLog(`Novo ID observado: ${id}`);
      });
    }

    // ==============================================================
    // REMOVER IDS QUE SUMIRAM DO DOM
    // ==============================================================
    if (removidos.length > 0) {
      removidos.forEach((id) => {
        ticketsObs = ticketsObs.filter((item) => item !== id);
        HefestoLog(`ID removido: ${id}`);
      });
    }

    HefestoLog(`ticketsObs atualizado: [${ticketsObs.join(", ")}]`);
  }

  observarItem(() => {
    SincronizarTicketsObservados();
  }, document.querySelector('[id="tooltip-container"]'));

  function observarItem2(id) {
    observarItem(
      () => {
        HefestoLog(`Mudança aconteceu em ${id}`);
        const a = EncontrarOUltimoTime(`${id}`);
        if (a) {
          HefestoLog(`${a}`);
        }
        stt.andament = 1;
      },
      document.querySelector(
        `[data-ticket-id="${id}"] [data-test-id="omni-log-container"]`,
      ),
    );
  }

  function EncontrarOUltimoTime(id) {
    try {
      // Raiz do ticket específico
      const root = document.querySelector(
        `[data-ticket-id="${id}"] [data-test-id="omni-log-container"]`,
      );
      if (!root) {
        console.warn(`Não encontrei o container do ticket ${id}.`);
        return null;
      }

      // Todos os itens de comentário
      const items = root.querySelectorAll(
        '[data-test-id="omni-log-comment-item"]',
      );
      if (!items.length) {
        console.warn(
          `Nenhum omni-log-comment-item encontrado no ticket ${id}.`,
        );
        return null;
      }

      // Último comentário
      const lastItem = items[items.length - 1];

      // O elemento com o timestamp relativo
      let ts = lastItem.querySelector('[data-test-id="timestamp-relative"]');
      if (!ts) {
        console.warn(
          `timestamp-relative não encontrado dentro do último comentário (ticket ${id}).`,
        );
        return null;
      }

      // Tenta obter o datetime diretamente no elemento
      let datetime = ts.getAttribute("datetime");

      // Caso o data-test-id esteja em um contêiner e o <time> esteja dentro
      if (!datetime) {
        const timeEl = ts.matches("time") ? ts : ts.querySelector("time");
        if (timeEl) {
          datetime = timeEl.getAttribute("datetime");
        }
      }

      // Limpa string
      if (datetime && typeof datetime === "string") {
        datetime = datetime.trim();
      }

      return datetime || null;
    } catch (err) {
      console.error("Erro em EncontrarOUltimoTime:", err);
      return null;
    }
  }
})();
