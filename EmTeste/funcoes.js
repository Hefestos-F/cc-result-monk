// Configuração do IndexedDB
const nomeBD = "RegistAtt";
//const nomeBD = "HefestosTeste";
const StoreBD = "OsRegistAtt";

const Chave0 = "Pausas";

let Salvar0;

const PreFixo = "regatt:";

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

async function RecuperarVariaveis() {
  try {
    Salvar0 = await RecDadosindexdb(Chave0);
    Hdebug("Encontrados em Salvar0:", Salvar0);
  } catch (e) {
    Herror("Erro ao recuperar Salvar0:", e);
  }
}

RecuperarTVariaveis();

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
          Herror("Erro ao salvar os dados:", event.target?.errorCode || event);
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

async function AddouAtualizarPausas(id, novoItem) {
  //const novoItem = { id, pausa, inicio, fim, duracao };

  if (!Array.isArray(Salvar0)) Salvar0 = [];

  const index = Salvar0.findIndex((item) => String(item?.id) === String(id));

  if (index !== -1) {
    Salvar0[index] = { ...Salvar0[index], ...novoItem };
  } else {
    Salvar0.push(novoItem);
  }

  await AddOuAtuIindexdb(Chave0, Salvar0);
}
