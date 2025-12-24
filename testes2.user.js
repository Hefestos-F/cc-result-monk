// ==UserScript==
// @name         Nice_test2
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes2.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes2.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  const stt = {
    observa: 1,
    Status: "",
    StatusANT: "",
  };

  const TempoPausas = {
    Online: 0,
  };

  const DDPausa = {
    numero: 1,
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

  function observarItem(aoMudar) {
    /*const alvo = document.querySelector(
      '[data-test-id="toolbar-profile-menu"]'
    );*/
    const alvo = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button-tooltip"]'
    );
    if (!alvo) {
      console.warn("HefestoLog: alvo toolbar-profile-menu não encontrado.");
      return;
    }

    const observer = new MutationObserver(() => {
      aoMudar();
      // Desconecta somente se já achamos o valor (stt.observa = 0)
      if (stt.observa === 0) {
        observer.disconnect();
        console.log("HefestoLog: observer Desconectado");
      }
    });

    observer.observe(alvo, { childList: true, subtree: true });
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

  observarItem(() => {
    //const el = document.querySelector('[data-garden-id="typography.font"]');
    const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-button-tooltip"] div'
    );
    /*const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-view-profile"] span'
    );*/

    if (!el) {
      console.log("HefestoLog: Alteração aconteceu, mas ainda sem status");
      return;
    }

    const statusAtual = formatPrimeiroNome(el.textContent.trim());

    if (!statusAtual) return;

    // Se não mudou, não faz nada
    if (stt.StatusANT === statusAtual) return;

    stt.Status = statusAtual;
    console.log(`HefestoLog: Status: ${stt.Status}`);

    // Helpers

    const duracaoPrevistaPorStatus = (s) => {
      if (s.includes("Lanche")) return "00:20:00";
      if (s.includes("Descanso")) return "00:10:00";
      return null;
    };

    // Executa sem estourar "Uncaught (in promise)"
    (async () => {
      const agora = gerarDataHora(); // { data, hora }

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

      if (inicioObj) {
        // Salva fim (objeto)
        await atualizarCampos(DDPausa.numero, "fim", agora);

        // Calcula duração real (string HH:MM:SS)
        const duracaoReal = calcularDuracao(inicioObj, agora);
        await atualizarCampos(DDPausa.numero, "duracao", duracaoReal);
      }

      // Só executa lógica se NÃO estiver Offline e se houve mudança
      if (stt.Status.includes("Offline")) {
        stt.StatusANT = stt.Status;
        return;
      }

      // Seu comentário original: "Se for abrir nova pausa, incremente o id"
      DDPausa.numero += 1;
      if (DDPausa.numero > 15) DDPausa.numero = 0;

      const duracaoPrevista = duracaoPrevistaPorStatus(stt.Status);
      let fimPrevistoObj = null;

      if (duracaoPrevista) {
        // exibirHora soma duracaoPrevista ao "agora"
        fimPrevistoObj = exibirHora(agora, 1, duracaoPrevista); // retorna {data,hora}
      }

      // Cria/atualiza pausa no array + IndexedDB
      await AddouAtualizarPausas(
        DDPausa.numero,
        stt.Status,
        agora, // inicio: {data,hora}
        fimPrevistoObj, // fim previsto: {data,hora} ou null
        duracaoPrevista || "---" // duracao prevista: "HH:MM:SS" ou "---"
      );

      // ==========================================================
      // 3) Atualiza status anterior
      // ==========================================================
      stt.StatusANT = stt.Status;
    })().catch((err) =>
      console.error("HefestoLog: erro no observer async:", err)
    );
  });

  function exibirHora(horaedataparacalculo, maisoumenos, valordeacrecimo) {
    function parseOffset(offsetStr) {
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
      if (!durationStr) return 0;
      const m = String(durationStr).match(/^(\d{1,2}):?(\d{2})(?::?(\d{2}))?$/);
      if (!m) return 0;
      const hours = parseInt(m[1], 10);
      const minutes = parseInt(m[2], 10);
      const seconds = m[3] ? parseInt(m[3], 10) : 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    function buildDateTime(obj) {
      const dparts = String(obj?.data || "")
        .split("-")
        .map(Number);
      const tparts = String(obj?.hora || "00:00:00")
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

    function formatObj(date) {
      const data = date.toISOString().split("T")[0];
      const hora = date.toTimeString().split(" ")[0];
      return { data, hora };
    }

    let offsetSec = 0;

    if (typeof maisoumenos === "string" && valordeacrecimo === undefined) {
      offsetSec = parseOffset(maisoumenos);
    } else {
      const dur = parseDuration(valordeacrecimo || "00:00:00");
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

  function gerarDataHora() {
    const agora = new Date();

    const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
    const data = agora.toISOString().split("T")[0];

    return {
      hora: hora,
      data: data,
    };
  }

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
