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
    const alvo = document.querySelector(
      '[data-test-id="toolbar-profile-menu"]'
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

  observarItem(() => {
    const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-view-profile"] span'
    );
    if (!el) {
      console.log("HefestoLog: Alteração aconteceu, mas ainda sem status");
      return;
    }

    stt.Status = el.textContent.trim();
    console.log(`HefestoLog: Status: ${stt.Status}`);

    if (!stt.Status.includes("Offline") && stt.StatusANT !== stt.Status) {
      const deh = gerarDataHora();

      // Fecha pausa atual
      atualizarCampos(DDPausa.numero, "Fim", deh);

      const ini = getValorinicio(DDPausa.numero);
      const durac = ini ? exibirHora(deh, 0, ini) : "00:00:00";
      atualizarCampos(DDPausa.numero, "Duração", durac);

      // Se for abrir nova pausa, incremente o id corretamente:
      DDPausa.numero += 1; // <-- ajuste aqui conforme sua regra

      let fim = "---";
      let duracao = "---";
      let time = 0;

      if (stt.Status.includes("Lanche")) {
        duracao = "00:20:00";
        time = exibirHora(deh, 1, duracao);
        fim = time.hora;
      } else if (stt.Status.includes("Descanso")) {
        duracao = "00:10:00";
        time = exibirHora(deh, 1, duracao);
        fim = time.hora;
      }

      AddouAtualizarPausas(DDPausa.numero, stt.Status, deh, fim, duracao);
    }

    stt.StatusANT = stt.Status;
  });

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
      // aceita booleano ou números 0/1 usados pelo código chamador
      const isNegative =
        maisoumenos === false ||
        (typeof maisoumenos === "number" && Number(maisoumenos) === 0) ||
        (typeof maisoumenos === "string" && maisoumenos === "0");
      const sign = isNegative ? -1 : 1; // default '+'
      offsetSec = sign * dur;
    }

    const base = buildDateTime(horaedataparacalculo);
    const adjusted = new Date(base.getTime() + offsetSec * 1000);
    const out = formatDateTime(adjusted);
    /*console.debug(
     * `Modo teste: Data: ${out.date}, Hora: ${out.time} (offset ${offsetSec}s)`
    );*/

    return { date: out.date, hora: out.time };
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

  function getValorinicio(id) {
    const item = dadosdePausas.find((obj) => obj.id === id);
    // Retorna undefined se não existir ou se o campo não estiver no objeto
    return item?.["inicio"];
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
