// ===== UI + (Opcional) Firebase =====
// Mantém tudo funcionando mesmo que Firebase não carregue (ambiente local/sem internet)
let db = null; // será atribuído se Firebase carregar
const TOKEN = "Aug$2025";

(async () => {
  try {
    const { initializeApp, getApps, getApp } =
      await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js");

    const { getFirestore, doc, setDoc } =
      await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");

    let app;

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    db = getFirestore(app);

    // ✅ EXPOR AQUI
    window.__doc = doc;
    window.__setDoc = setDoc;
  } catch (e) {
    console.warn("[Aviso] Firebase não carregou:", e);
  }
})();

// ====== Lógica da Waiver ======
function toggleWaiverInput() {
  const select = document.getElementById("usouWaiver");
  const waiverDiv = document.getElementById("waiverInfo");
  const motivoContainer = document.getElementById("motivoContainer");
  const motivoSelect = document.getElementById("motivoSelect");
  const tipoWaiverElem = document.getElementById("tipoWaiver");
  const waiverFieldContainer = document.getElementById("waiverFieldContainer");
  if (!select || !motivoSelect || !motivoContainer) return;

  motivoSelect.innerHTML = "";
  if (tipoWaiverElem) tipoWaiverElem.value = "";
  if (waiverFieldContainer) waiverFieldContainer.classList.add("hidden");
  motivoContainer.classList.add("hidden");

  if (select.value !== "sim") {
    if (waiverDiv) waiverDiv.classList.add("hidden");
    return;
  }

  if (waiverDiv) waiverDiv.classList.remove("hidden");

  const motivos = [
    { motivo: "Erro sistemico", waiver: "Waiver 01- SYSTEM ERROR" },
    {
      motivo: "Cliente Smiles Diamante categorizado cobrando assento",
      waiver: "Waiver 01- SYSTEM ERROR",
    },
    {
      motivo: "Regra tarifaria possui bagagem mas no VCR nao consta",
      waiver: "Waiver 01- SYSTEM ERROR",
    },
    {
      motivo:
        "Regra tarifária não deveria cobrar taxa, tela 30 não apresenta N/A",
      waiver: "Waiver 01- SYSTEM ERROR",
    },
    {
      motivo:
        "Serviços incluídos via site/app Smiles pagos não refletidos no Sabre",
      waiver: "Waiver 01- SYSTEM ERROR",
    },
    {
      motivo: "Concessão Upgrade Smiles Troca de tarifa Light Para Classic",
      waiver: "Waiver 05-SPECIAL REQUEST",
    },
    {
      motivo: "Cancelamento dentro das 24 horas",
      waiver: "Waiver 08-AE FEE NOT APPLICABLE",
    },
    {
      motivo: "Cancelamento de servicos antes do voo",
      waiver: "Waiver 08-AE FEE NOT APPLICABLE",
    },
    {
      motivo: "Marcacao de assento obrigatoria ao lado do responsavel",
      waiver: "Waiver 08-AE FEE NOT APPLICABLE",
    },
    {
      motivo: "Erro operacional comprovado",
      waiver: "Waiver 06- OPERATIONAL ERROR",
    },
    { motivo: "Remarcacao laudo medico", waiver: "Waiver 13- CONCESSAO" },
    { motivo: "Cancelamento laudo medico", waiver: "Waiver 13- CONCESSAO" },
    { motivo: "Remarcacao concurso publico", waiver: "Waiver 13- CONCESSAO" },
    { motivo: "Cancelamento concurso publico", waiver: "Waiver 13- CONCESSAO" },
    { motivo: "Duplicidade de compra", waiver: "Waiver 13- CONCESSAO" },
    {
      motivo: "Remarcacao erro do cliente dentro das 24 Horas",
      waiver: "Waiver 08-AE FEE NOT APPLICABLE",
    },
    {
      motivo: "Cancelamento por acomodacao",
      waiver: "Waiver 14- INVOL REACOMODACAO",
    },
    {
      motivo: "Cancelamento de servicos por acomodacao",
      waiver: "Waiver 14- INVOL REACOMODACAO",
    },
    {
      motivo: "Isencao de assento por acomodacao voo direto para conexao",
      waiver: "Waiver 14- INVOL REACOMODACAO",
    },
    {
      motivo: "Isencao da taxa de Remarcação com Cota Smiles disponivel",
      waiver: "Waiver 20-FFCOTASSMILES",
    },
    {
      motivo: "Isencao da taxa de Cancelamento com Cota Smiles disponivel",
      waiver: "Waiver 20-FFCOTASSMILES",
    },
    {
      motivo: "Isencao da taxa de Upgrade de cabine com Cota Smiles disponivel",
      waiver: "Waiver 20-FFCOTASSMILES",
    },
    {
      motivo: "Voa Brasil Cancelamento Parcial ida voada cancelar a volta",
      waiver: "Waiver 19- ART19RA400",
    },
    {
      motivo: "Voa Brasil Cancelamento Parcial cancelar ida e manter volta",
      waiver: "Waiver 19- ART19RA400",
    },
  ];

  motivoSelect.innerHTML = '<option value="">-- Selecione o motivo --</option>';
  motivos.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.motivo;
    opt.textContent = item.motivo;
    motivoSelect.appendChild(opt);
  });
  motivoContainer.classList.remove("hidden");

  motivoSelect.onchange = function () {
    const escolhido = motivos.find((m) => m.motivo === motivoSelect.value);
    if (!escolhido) {
      if (waiverFieldContainer) waiverFieldContainer.classList.add("hidden");
      if (tipoWaiverElem) tipoWaiverElem.value = "";
      return;
    }
    if (tipoWaiverElem) tipoWaiverElem.value = escolhido.waiver;
    if (waiverFieldContainer) waiverFieldContainer.classList.remove("hidden");
  };
}

// ====== Lógica da Isenção de Taxa DU ======
function toggleIsencaoDU() {
  const select = document.getElementById("isentouDU");
  const infoDiv = document.getElementById("isencaoDUInfo");
  const motivoContainer = document.getElementById("motivoIsencaoContainer");
  const motivoSelect = document.getElementById("motivoIsencaoSelect");
  if (!select || !infoDiv || !motivoContainer || !motivoSelect) return;

  motivoSelect.innerHTML = "";
  motivoContainer.classList.add("hidden");

  if (select.value !== "sim") {
    infoDiv.classList.add("hidden");
    return;
  }

  infoDiv.classList.remove("hidden");

  const motivosDU = [
    "Todas as vendas de receitas auxiliares",
    "Parcelamento com duas formas de pagamento",
    "Duas formas de pagamento que não sejam 2 cartões ou Travel Bank + Cartão de crédito",
    "Reserva de criança nos casos onde o adulto já possua a reserva",
    "Inclusao de infant na reserva",
    "Erro no site",
    "Isencao devido erro no cadastro",
    "Erro emissao menor desacompanhado",
    "Isencao devido SPEQ",
    "Isencao devido assitencia emergencial",
    "Isencao devido emissao MEDIF-FREMEC",
    "Para residentes no Amapá",
    "Remarcacao dentro das 24 horas",
    "Remarcacao de reserva Multitrechos",
    "Remarcacao apos no-show",
    "Cancelamentos",
  ];

  motivoSelect.innerHTML = '<option value="">-- Selecione o motivo --</option>';
  motivosDU.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    motivoSelect.appendChild(opt);
  });
  motivoContainer.classList.remove("hidden");
}

// ====== Lógica do Link de Pagamento ======
function togglePagamentoInput() {
  const select = document.getElementById("realizouPagamento");
  const pagamentoDiv = document.getElementById("pagamentoInfo");
  const parcelasSelect = document.getElementById("parcelas");
  if (!select || !pagamentoDiv || !parcelasSelect) return;

  parcelasSelect.innerHTML = "";
  if (select.value == "nao") {
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      parcelasSelect.appendChild(option);
    }
    pagamentoDiv.classList.remove("hidden");
  } else {
    pagamentoDiv.classList.add("hidden");
  }
}

// ====== Lógica do Invoice (para o campo 'Possui Infant') ======
function toggleInvoice() {
  const select = document.getElementById("utilizouInvoice");
  const invoiceDiv = document.getElementById("invoiceInfo");
  const empresaSelect = document.getElementById("empresaInvoice");
  const valorInvoice = document.getElementById("valorInvoice");
  if (!select || !invoiceDiv) return;

  if (empresaSelect) empresaSelect.value = "";
  if (valorInvoice) valorInvoice.value = "";

  if (select.value !== "sim") {
    invoiceDiv.classList.add("hidden");
    return;
  }
  invoiceDiv.classList.remove("hidden");
}

function preencherValorInvoice() {
  const empresaSelect = document.getElementById("empresaInvoice");
  const valorInvoice = document.getElementById("valorInvoice");
  if (!empresaSelect || !valorInvoice) return;

  const valoresTexto = {
    gol: "RS4900 - PAGTO INVOICE DUE INF VOO GOL",
    smiles: "RS6920 - PAGTO INVOICE DUE INF VOO SMILES",
  };
  const empresa = empresaSelect.value;
  valorInvoice.value = valoresTexto[empresa] || "";
}

// ====== Gerar Resumo ======
async function gerarResumo() {
  const ticket = document.getElementById("ticket").value.trim().toUpperCase();

  const contato = document.getElementById("contato").value.trim();
  const localizador = document.getElementById("localizador")
    ? document.getElementById("localizador").value.trim()
    : "";
  const descricao = document.getElementById("descricao").value.trim();

  const usouWaiver = document.getElementById("usouWaiver").value;
  const tipoWaiver = document.getElementById("tipoWaiver")?.value || "";
  const motivo = document.getElementById("motivoSelect")?.value || "";

  const isentouDU = document.getElementById("isentouDU").value;
  const motivoDU = document.getElementById("motivoIsencaoSelect")?.value || "";

  // Possui Infant (usa fluxo de invoice)
  const utilizouInvoice =
    document.getElementById("utilizouInvoice")?.value || "nao";
  const empresaInvoice = document.getElementById("empresaInvoice")?.value || "";
  const valorInvoice = document.getElementById("valorInvoice")?.value || "";

  const realizouPagamento = document.getElementById("realizouPagamento").value;
  const link = document.getElementById("link")?.value.trim() || "";
  const bandeira = document.getElementById("bandeira")?.value.trim() || "";
  const parcelas = document.getElementById("parcelas")?.value || "";
  const cardName = document.getElementById("cardName")?.value.trim() || "";
  const assinatura = document.getElementById("assinatura").value.trim();

  if (!ticket || !contato || !descricao || !assinatura) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  let texto = `Ticket - ${ticket}\n\n`;
  if (localizador) texto += `Localizador - ${localizador}\n\n`;
  texto += `${contato} ${descricao}\n\n`;

  if (usouWaiver === "sim") {
    texto += `Utilizado - ${tipoWaiver}\n`;
    texto += `Motivo - ${motivo}\n`;
  }

  texto += `Isentou taxa DU - ${isentouDU}\n`;
  if (isentouDU === "sim") {
    texto += `Motivo da isencao - ${motivoDU}\n`;
  }

  // Bloco Invoice (associado a Possui Infant)
  texto += `Possui Infant na reserva - ${utilizouInvoice}\n`;
  if (utilizouInvoice === "sim") {
    const empresaLabel =
      empresaInvoice === "gol"
        ? "Gol"
        : empresaInvoice === "smiles"
          ? "Smiles"
          : "";
    if (empresaLabel) texto += `Emissor da Reserva - ${empresaLabel}\n`;
    if (valorInvoice) texto += `Invoice - ${valorInvoice}\n`;
  }

  texto += `Utilizou link de pagamento - ${realizouPagamento}\n\n`;
  if (realizouPagamento === "nao") {
    texto += `Motivo - ${link}\n`;
    texto += `Bandeira - ${bandeira}\n`;
    texto += `Parcelas - ${parcelas}\n`;
    texto += `CardholderName - ${cardName}\n`;
  }

  texto += `${assinatura}\n`;
  document.getElementById("resultado").value = texto;

  // Salvar no Firestore (se disponível); caso contrário, apenas loga
  const agora = new Date();
  //agora.toISOString()

  const novoRegistro = {
    ticket,
    contato,
    localizador,
    waiver: tipoWaiver,
    motivo,
    isentouDU,
    motivoDU,
    utilizouInvoice,
    empresaInvoice,
    valorInvoice,
    realizouPagamento,
    link,
    bandeira,
    parcelas,
    cardName,
    assinatura,
    dataHora: agora.toLocaleString("pt-BR"),
    dataISO: agora.toISOString(),
    token: TOKEN,
  };

  const mudou = await AddouAtualizarPausas(ticket, novoRegistro);

  try {
    if (!db) {
      console.warn("Firestore ainda não carregou");
      return;
    }

    if (!mudou) {
      console.log("Nada mudou, não salvou:", ticket);
      return;
    }

    const ref = window.__doc(db, "registros", ticket);

    await window.__setDoc(
      ref,
      {
        ...novoRegistro,
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log("Upsert direto:", ticket);
  } catch (err) {
    console.error("Erro Firestore:", err);
  }
}

// Configuração do IndexedDB
const nomeBD = "RegistAtt";
//const nomeBD = "HefestosTeste";
const StoreBD = "OsRegistAtt";

const Chave0 = "RegistreDeAtt";

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

async function RecuperarTVariaveis() {
  try {
    Salvar0 = await RecDadosindexdb(Chave0);

    const hoje = new Date().toLocaleDateString("pt-BR");

    // ✅ garante array válido
    if (!Array.isArray(Salvar0) || Salvar0.length === 0) {
      Salvar0 = [{ data: hoje }];
      await AddOuAtuIindexdb(Chave0, Salvar0);
      return;
    }

    // ✅ valida acesso seguro
    if (Salvar0[0]?.data !== hoje) {
      Salvar0 = [{ data: hoje }];

      await AddOuAtuIindexdb(Chave0, Salvar0);
    }

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
  if (!Array.isArray(Salvar0)) Salvar0 = [];

  const index = Salvar0.findIndex(
    (item) => String(item?.ticket) === String(id),
  );

  let mudou = true;

  if (index !== -1) {
    const antigo = Salvar0[index];

    mudou = registroMudou(antigo, novoItem);

    if (mudou) {
      Salvar0[index] = { ...antigo, ...novoItem };
    }
  } else {
    Salvar0.push(novoItem);
  }

  if (mudou) await AddOuAtuIindexdb(Chave0, Salvar0);

  return mudou;
}

function registroMudou(antigo, novo) {
  if (!antigo) return true;

  const limpar = (obj) => {
    const copia = { ...obj };

    delete copia.dataHora;
    delete copia.dataISO;
    delete copia.atualizadoEm;

    return copia;
  };

  return JSON.stringify(limpar(antigo)) !== JSON.stringify(limpar(novo));
}

function formatarNome(nome) {
  const minusculas = ["da", "de", "do", "das", "dos", "e"];

  return nome
    .toLowerCase()
    .trim()
    .split(" ")
    .map((palavra, index) => {
      if (index > 0 && minusculas.includes(palavra)) {
        return palavra; // mantém minúsculo
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

// ====== Limpar Tela ======
function limparTela() {
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el.id === "assinatura" || el.name === "assinatura") return;
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else el.value = "";
  });

  const resultado = document.getElementById("resultado");
  if (resultado) resultado.value = "";

  document
    .querySelectorAll(
      "#waiverInfo, #motivoContainer, #pagamentoInfo, #isencaoDUInfo, #invoiceInfo",
    )
    .forEach((div) => div.classList.add("hidden"));
}

function copiarResultado() {
  const resultado = document.getElementById("resultado");
  if (!resultado.value.trim()) return;
  navigator.clipboard
    .writeText(resultado.value)
    .then(() => {})
    .catch(() => {});
}

// ===== Inicialização + Expor no window para inline handlers =====
window.toggleWaiverInput = toggleWaiverInput;
window.toggleIsencaoDU = toggleIsencaoDU;
window.togglePagamentoInput = togglePagamentoInput;
window.toggleInvoice = toggleInvoice;
window.preencherValorInvoice = preencherValorInvoice;
window.gerarResumo = gerarResumo;
window.limparTela = limparTela;
window.copiarResultado = copiarResultado;

window.addEventListener("DOMContentLoaded", () => {
  // Ajusta estado inicial conforme valores atuais dos selects
  const w = document.getElementById("usouWaiver");
  if (w) toggleWaiverInput();
  const d = document.getElementById("isentouDU");
  if (d) toggleIsencaoDU();
  const inv = document.getElementById("utilizouInvoice");
  if (inv) toggleInvoice();
  const pg = document.getElementById("realizouPagamento");
  if (pg) togglePagamentoInput();

  document.getElementById("ticket").addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });

  document.getElementById("localizador").addEventListener("input", function () {
    // 1. Salva a posição atual do cursor
    const posicaoCursor = this.selectionStart;

    // 2. Transforma o texto em maiúsculo
    this.value = this.value.toUpperCase();

    // 3. Restaura o cursor para o lugar correto
    this.setSelectionRange(posicaoCursor, posicaoCursor);
  });

  document.getElementById("contato").addEventListener("input", function (e) {
    let valor = e.target.value;

    // ✅ mantém letras + espaço + acentos
    valor = valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

    // ✅ NÃO FORMATA se terminar com espaço (isso resolve o bug)
    if (valor.endsWith(" ")) {
      e.target.value = valor;
      return;
    }

    // ✅ formata nome corretamente
    e.target.value = formatarNome(valor);
  });
});
