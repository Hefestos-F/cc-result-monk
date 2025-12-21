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
    NumeroCon: 1,
  };

  const TempoPausas = {
    Online: 0,
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

  observarItem(() => {
    // Captura o texto do span interno
    const el = document.querySelector(
      '[data-test-id="toolbar-profile-menu-view-profile"] span'
    );
    if (el) {
      stt.Status = el.textContent.trim(); // <-- aqui sai "Offline"
      //stt.observa = 0; // sinaliza para desativar o observer
      console.log(`HefestoLog: Status: ${stt.Status}`);
      if (!stt.Status.includes("Offline") && stt.StatusANT !== stt.Status) {
        stt.NumeroCon += stt.NumeroCon;

        if (stt.Status.includes("Lanche")) {
        } else if (stt.Status.includes("Descanso")) {
        } else if (stt.Status.includes("Particular")) {
        } else if (stt.Status.includes("Online")) {
        }
      }
      stt.StatusANT = stt.Status;

      // Se quiser "retornar" via callback, faça aqui:
      // meuCallback(status);
    } else {
      console.log("HefestoLog: Alteração aconteceu, mas ainda sem status");
    }
  });

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
