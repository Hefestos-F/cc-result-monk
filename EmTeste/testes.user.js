// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
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
    TesteHora: 0,
    valorTeste: "-03:00",
    VoltarPad: 0,
    LadoBot: 0,
    LadoBotAnterior: 0,
  };

  const configPadrao = {
    TempoEscaladoHoras: "06:20:00", // Horário alvo do escalonado (HH:MM:SS)
    logueEntreDatas: 0,
    pausalimitada: 0,
    LogueManual: 0,
    SomEstouro: 1,
    notiEstouro: 1,
    OBS_ATIVO: 1,
    TesteHora: 0,
    valorTeste: "-03:00",
    VoltarPad: 0,
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
    LadoBot: 0,
    LadoBotAnterior: 0,
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
    ContAtual: 0,
    Trabalhando: 0,
    TrabAntSeg: 0,
    Atendidas: 0,
  };

  const DDPausa = {
    numero: 1,
    inicioUltimaP: 0,
    inicioUltimaPa: 0,
    StatusANT: "",
    Disponivel: {},
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
  const CorPad = {
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
  const nomeBD = "Hefestos";
  const StoreBD = "LogueNice";

  // ========= LOG UTILS =========

  const PreFixo = "HefestoLog:";

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

  function getValorDadosPausa(id, campo) {
    if (!dadosdePausas) return null;
    const item = dadosdePausas.find((obj) => String(obj?.id) === String(id));
    // Usa indexação dinâmica e retorna null se não existir
    return item ? (item?.[campo] ?? null) : null;
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
      Herror("Erro ao abrir o banco de dados:", event.target.errorCode);
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
            Hdebug(`Dados salvos com sucesso na chave "${nomechave}"`);
            resolve(true);
          };

          request.onerror = function (event) {
            Herror(
              "Erro ao salvar os dados:",
              event.target?.errorCode || event,
            );
            reject(event);
          };
        });
      } catch (err) {
        Herror("AddOuAtuIindexdb erro:", err);
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
        Hlog(`Chave "${nomechave}" apagada com sucesso.`);
      };

      request.onerror = function (event) {
        Herror("Erro ao apagar a chave:", event.target.errorCode);
      };
    });
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

  /**
   * Soma as durações de itens com pausa === "Trabalhando".
   * Para itens com pausa === "Disponível", apenas registra via AddouAtualizarPausas.
   * @returns {Promise<{ totalSegundos: number, totalFormatado: string }>}
   */
  async function somarDuracoesTrabalho() {
    // Se não é array ou está vazio, retorna zero direto
    if (!Array.isArray(dadosdePausas) || dadosdePausas.length === 0) {
      return {
        totalSegundos: 0,
        totalFormatado: "00:00:00",
      };
    }

    // Zera contador (se essa for a regra pretendida)
    TempoPausas.Atendidas = 0;

    let totalSegundos = 0;

    for (const item of dadosdePausas) {
      // Itens "Disponível": registra/atualiza e não soma
      if (item?.pausa === "Disponível") {
        const inicioObj = await getValorDadosPausa(item?.id, "inicio"); // { data, hora } ou undefined
        const duracaoObj = await getValorDadosPausa(item?.id, "duracao"); // "HH:MM:SS" ou "---"
        const fimObj = await getValorDadosPausa(item?.id, "fim"); // { data, hora } ou undefined

        // Efeito colateral explícito (mantido, mas isolado do somatório)
        await AddouAtualizarPausas(
          0,
          "Disponível",
          inicioObj, // início
          fimObj, // fim
          duracaoObj, // duração
        );

        // Não acumula nada para "Disponível"
        continue;
      }

      // Só soma quando pausa === "Trabalhando"
      if (item?.pausa !== "Trabalhando") {
        continue;
      }

      TempoPausas.Atendidas += 1;

      const s = converterParaSegundos(item?.duracao);
      if (Number.isFinite(s) && s > 0) {
        totalSegundos += s;
      }
    }

    Hlog(`totalSegundos : ${totalSegundos}`);

    return {
      totalSegundos,
      totalFormatado: converterParaTempo(totalSegundos),
    };
  }

  /**
   * RecuperarTVariaveis - recupera as variáveis persistidas do indexedDB
   * - Tenta recuperar vários conjuntos de dados e registra erros quando ocorrerem
   */
  async function RecuperarTVariaveis() {
    try {
      dadosdePausas = await RecDadosindexdb(ChavePausas);
      Hdebug("Encontrados em dadosdePausas:", dadosdePausas);
    } catch (e) {
      Herror("Erro ao recuperar dadosdePausas:", e);
    }

    try {
      dadosSalvosConfi = await RecDadosindexdb(ChaveConfig);
      Hdebug("Encontrados em dadosSalvosConfi:", dadosSalvosConfi);
    } catch (e) {
      Herror("Erro ao recuperar dadosSalvosConfi:", e);
    }

    try {
      dadosPrimLogue = await RecDadosindexdb(ChavePrimLogue);
      Hdebug("Encontrados em dadosPrimLogue:", dadosPrimLogue);
    } catch (e) {
      Herror("Erro ao recuperar dadosPrimLogue:", e);
    }

    try {
      dadosLogueManu = await RecDadosindexdb(ChavelogueManu);
      Hdebug("Encontrados em dadosLogueManu:", dadosLogueManu);
    } catch (e) {
      Herror("Erro ao recuperar dadosLogueManu:", e);
    }

    try {
      dadosPrimLogueOnt = await RecDadosindexdb(ChavePrimLogueOntem);
      Hdebug("Encontrados em dadosPrimLogueOnt:", dadosPrimLogueOnt);
    } catch (e) {
      Herror("Erro ao recuperar dadosPrimLogueOnt:", e);
    }
    //await verifiDataLogue();
    //await SalvandoVariConfig(0);
    //await verifLogueManual();
    //criarObjetoFlutuante();

    Hlog(
      `totalSegundos :${somarDuracoesTrabalho().totalSegundos} / totalFormatado : ${somarDuracoesTrabalho().totalFormatado}`,
    );
  }

  RecuperarTVariaveis();
})();
