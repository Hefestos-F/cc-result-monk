// ================== CONEXÃO FIREBASE ==================
import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
  where,
  orderBy,
  startAfter,
  doc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
// firebaseConfig ocultado

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- Normalização de campos (compatibilidade com dados antigos) ----------
function normalizarRegistro(r) {
  const safe = (v, alt) =>
    v !== undefined && v !== null && String(v).trim() !== "" ? v : alt;
  return {
    ticket: safe(r.ticket, ""),
    localizador: safe(r.localizador, ""),
    contato: safe(r.contato, ""),
    waiver: safe(r.waiver, ""),
    motivo: safe(r.motivo, ""),
    isentouDU: safe(r.isentouDU, ""),
    motivoDU: safe(r.motivoDU, ""),
    // Possui Infant
    utilizouInvoice: safe(
      r.utilizouInvoice ?? r.possuiInfant ?? r.possui_infant ?? r.invoiceUsado,
      "",
    ),
    // Emissor da Reserva
    empresaInvoice: safe(
      r.empresaInvoice ?? r.emissor ?? r.emissorReserva ?? r.emissor_da_reserva,
      "",
    ),
    // Invoice
    valorInvoice: safe(r.valorInvoice ?? r.invoice ?? r.invoice_txt, ""),
    // Link de Pagamento (sim/nao)
    realizouPagamento: safe(
      r.realizouPagamento ??
        r.linkPagamento ??
        r.utilizou_link ??
        r.utilizou_link_pagamento,
      "",
    ),
    // Erro no Link (ou motivo do link)
    link: safe(r.link ?? r.motivoPagamento ?? r.motivo_link ?? r.erroLink, ""),
    // Data/Hora
    dataHora: safe(r.dataHora ?? r.data ?? r.criado_em, ""),
    // Assinatura
    assinatura: safe(r.assinatura ?? r.agent ?? r.operador, ""),
  };
}

// Campos do filtro (inclui todos pedidos)
const CAMPOS_FILTRO = [
  { id: "ticket", label: "Ticket" },
  { id: "localizador", label: "Localizador" },
  { id: "waiver", label: "Waiver" },
  { id: "motivo", label: "Motivo Waiver" },
  { id: "isentouDU", label: "Isentou DU" },
  { id: "motivoDU", label: "Motivo DU" },
  { id: "utilizouInvoice", label: "Possui Infant" },
  { id: "empresaInvoice", label: "Emissor da Reserva" },
  { id: "valorInvoice", label: "Invoice" },
  { id: "realizouPagamento", label: "Link de Pagamento" },
  { id: "link", label: "Erro no Link" },
  { id: "dataHora", label: "Data/Hora" },
  { id: "assinatura", label: "Assinatura" },
];

let registros = [];
let registrosFiltrados = [];

let paginaAtual = 1;
let limiteLinhas = 10;
const limdbai = 10000;

const vcont = {
  Filtroando: 0,
};

async function buscarTodosDados(constraints = []) {
  let todos = [];
  let ultimaDoc = null;
  const limite = 5000;

  while (true) {
    let q;

    if (ultimaDoc) {
      q = query(
        collection(db, "registros"),
        orderBy("dataHora"),
        ...constraints,
        startAfter(ultimaDoc),
        limit(limite),
      );
    } else {
      q = query(
        collection(db, "registros"),
        orderBy("dataHora"),
        ...constraints,
        limit(limite),
      );
    }

    const snapshot = await getDocs(q);

    console.log("Bloco:", snapshot.size);

    if (snapshot.empty) break;

    const dados = snapshot.docs.map((doc) => normalizarRegistro(doc.data()));

    todos = [...todos, ...dados];

    console.log("Total acumulado:", todos.length);

    ultimaDoc = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.size < limite) break;
  }

  console.log("TOTAL FINAL:", todos.length);

  return todos;
}

function atualizarTabela() {
  const dados = registrosFiltrados.length ? registrosFiltrados : registros;

  const inicio = (paginaAtual - 1) * limiteLinhas;
  const fim = inicio + limiteLinhas;

  const paginaDados = dados.slice(inicio, fim);

  gerarTabela(paginaDados);

  const totalPaginas = Math.max(1, Math.ceil(dados.length / limiteLinhas));

  // Atualiza texto
  document.getElementById("numeroDpages").textContent =
    `Página ${paginaAtual} de ${totalPaginas}`;

  // Habilitar/desabilitar botões
  document.getElementById("pageprev").disabled = paginaAtual === 1;
  document.getElementById("pagenext").disabled = paginaAtual === totalPaginas;

  document.getElementById("totalEnc").textContent =
    dados.length + " encontrdos.";
}
// ================== CARREGAR FILTROS ==================
async function carregarFiltros() {
  console.log("Carregando Filtros...");
  try {
    const snapshot = await getDocs(
      query(collection(db, "registros"), limit(1000)),
    );

    const brutos = snapshot.docs.map((doc) => doc.data());
    registros = brutos.map(normalizarRegistro);

    const filtrosDiv = document.getElementById("filtros");
    filtrosDiv.innerHTML = "";
    filtrosDiv.classList.add("toolbar");

    CAMPOS_FILTRO.forEach((campo) => {
      const valoresUnicos = [
        ...new Set(
          registros
            .map((r) => (r[campo.id] ? r[campo.id].toString().trim() : ""))
            .filter((v) => v !== ""),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR"));

      const wrap = document.createElement("div");
      wrap.className = "filter-item";

      const label = document.createElement("label");
      label.setAttribute("for", `filtro_${campo.id}`);
      label.textContent = `${campo.label}`;

      const select = document.createElement("select");
      select.id = `filtro_${campo.id}`;

      const opcaoPadrao = document.createElement("option");
      opcaoPadrao.value = "";
      opcaoPadrao.textContent = "Todos";
      select.appendChild(opcaoPadrao);

      valoresUnicos.forEach((valor) => {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent =
          campo.id === "empresaInvoice" ? formatEmpresa(valor) : valor;
        select.appendChild(option);
      });

      wrap.appendChild(label);
      wrap.appendChild(select);
      filtrosDiv.appendChild(wrap);
    });

    // Período (mantido)
    const datasWrap = document.createElement("div");
    datasWrap.className = "filter-dates";
    const labelDe = document.createElement("label");
    labelDe.textContent = "De";
    labelDe.setAttribute("for", "dataInicio");
    const dataInicio = document.createElement("input");
    dataInicio.disabled = 1;
    dataInicio.type = "date";
    dataInicio.id = "dataInicio";
    const labelAte = document.createElement("label");

    labelAte.textContent = "Até";
    labelAte.setAttribute("for", "dataFim");
    const dataFim = document.createElement("input");
    dataFim.disabled = 1;
    dataFim.type = "date";
    dataFim.id = "dataFim";
    const botao = document.createElement("button");
    botao.id = "botfilt";
    botao.textContent = "Filtrar";
    botao.className = "btn-primary";
    botao.onclick = filtrarRelatorio;

    function claDdata(x) {
      const divFde = document.createElement("div");
      divFde.className = "filter-item";
      x.forEach((a) => {
        divFde.appendChild(a);
      });
      return divFde;
    }

    datasWrap.appendChild(claDdata([labelDe, dataInicio]));
    datasWrap.appendChild(claDdata([labelAte, dataFim]));

    datasWrap.appendChild(botao);
    filtrosDiv.appendChild(datasWrap);
    console.log("Filtros Ok");
  } catch (error) {
    console.error("ERRO REAL:", error);
    alert(error.message);
  }
}

// ================== FILTRAR ==================
async function filtrarRelatorio() {
  if (vcont.Filtroando) {
    vcont.Filtroando = 0;
    return;
  }
  const totalEnc = document.getElementById("totalEnc");
  try {
    const tabela = document.getElementById("tabelaRelatorios");
    tabela.innerHTML = `<tr><td colspan="15">Carregando...</td></tr>`;
    totalEnc.textContent = "";

    let constraints = [];

    function contrbot(asb, text) {
      const botfilt = document.getElementById(`botfilt`);
      //botfilt.disabled = asb;
      botfilt.textContent = text;
    }

    CAMPOS_FILTRO.forEach((c) => {
      const el = document.getElementById(`filtro_${c.id}`);
      const valor = el ? el.value : "";

      if (valor) {
        constraints.push(where(c.id, "==", valor));
      }
    });

    let todos = [];
    let ultimoDoc = null;
    const LIMITE = 5000;
    vcont.Filtroando = 1;

    contrbot(1, "Filtrando.../ Parar");

    while (true) {
      let q;

      if (ultimoDoc) {
        q = query(
          collection(db, "registros"),
          ...constraints,
          orderBy("__name__"),
          startAfter(ultimoDoc),
          limit(LIMITE),
        );
      } else {
        q = query(
          collection(db, "registros"),
          ...constraints,
          orderBy("__name__"),
          limit(LIMITE),
        );
      }

      const snapshot = await getDocs(q);

      console.log("Bloco recebido:", todos.length);

      tabela.innerHTML = `<tr><td colspan="15">Carregando... ${todos.length}</td></tr>`;

      if (snapshot.empty) break;

      const dados = snapshot.docs.map((doc) => normalizarRegistro(doc.data()));

      todos = [...todos, ...dados];

      ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

      // ✅ condição de parada correta
      if (snapshot.size < LIMITE || !vcont.Filtroando) break;
    }

    totalEnc.textContent = todos.length + " encontrdos.";

    contrbot(0, "Filtrar");

    console.log("Total final: ", todos.length);

    registrosFiltrados = todos;
    paginaAtual = 1;
    atualizarTabela();
  } catch (error) {
    console.error("Erro ao filtrar:", error);
    alert(error.message);
  }
}

// ================== TABELA ==================
function gerarTabela(lista = []) {
  const tabela = document.getElementById("tabelaRelatorios");
  tabela.innerHTML = "";
  if (lista.length === 0) {
    tabela.innerHTML = `<tr><td colspan="15" style="text-align:center;">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  lista.forEach((r, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.ticket}</td>
      <td>${r.localizador}</td>
      <td>${r.contato}</td>
      <td>${r.waiver}</td>
      <td>${r.motivo}</td>
      <td>${r.isentouDU}</td>
      <td>${r.motivoDU}</td>
      <td>${r.utilizouInvoice}</td>
      <td>${formatEmpresa(r.empresaInvoice)}</td>
      <td>${r.valorInvoice}</td>
      <td>${r.realizouPagamento}</td>
      <td>${r.link}</td>
      <td>${r.dataHora}</td>
      <td>${r.assinatura}</td>
    `;
    tabela.appendChild(row);
  });
}

// ================== EXPORTAR EXCEL ==================
function exportarExcel() {
  const dados = registrosFiltrados.length ? registrosFiltrados : registros;

  if (dados.length === 0) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const dadosExport = dados.map((r) => ({ ...r }));

  const agora = new Date();
  const nomeArquivo = `relatorio_waivers_${agora.getFullYear()}-${(agora.getMonth() + 1).toString().padStart(2, "0")}-${agora.getDate().toString().padStart(2, "0")}_${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}.xlsx`;
  const ws = XLSX.utils.json_to_sheet(dadosExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
  XLSX.writeFile(wb, nomeArquivo);
}

// ================== UTILITÁRIOS ==================

function converterData(dataStr) {
  if (!dataStr) return null;

  const limpa = dataStr.replace(",", "").trim();

  const match = limpa.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) return null;

  const [, dia, mes, ano, hora, min, seg] = match;

  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(min),
    Number(seg || 0),
  );
}

function formatEmpresa(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();
  if (s === "gol") return "Gol";
  if (s === "smiles") return "Smiles";
  return v;
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function gerarDataISO(dataStr) {
  if (!dataStr) return null;

  const limpa = dataStr.replace(",", "").trim();

  const match = limpa.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) return null;

  const [, dia, mes, ano, hora, min, seg] = match;

  return `${ano}-${mes}-${dia}T${hora}:${min}:${seg || "00"}`;
}
// ================== MIGRAÇÃO DE DATA ==================

async function migrarDatas() {
  try {
    const snapshot = await getDocs(collection(db, "registros"));

    console.log("Total de registros:", snapshot.size);

    const batchSize = 500; // 🔥 diminui (melhor)
    let batch = writeBatch(db);
    let count = 0;
    let totalAtualizados = 0;

    for (const d of snapshot.docs) {
      const dados = d.data();

      if (dados.dataISO) continue;

      const dataISO = gerarDataISO(dados.dataHora);
      if (!dataISO) continue;

      batch.update(doc(db, "registros", d.id), {
        dataISO: dataISO,
      });

      count++;
      totalAtualizados++;

      if (count === batchSize) {
        await batch.commit();

        console.log("✅ Batch enviado:", totalAtualizados);

        // 🔥 pausa para não sobrecarregar
        await delay(1000);

        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log("✅ Migração concluída!");
    console.log("Total atualizados:", totalAtualizados);
  } catch (error) {
    console.error("Erro na migração:", error);
  }
}

window.migrarDatas = migrarDatas;

// ================== INIT ==================

async function verificar() {
  const senha = document.getElementById("senha").value;

  if (senha === "Aug$2025") {
    document.body.innerHTML = `
        <h2>Relatórios - Acesso Administrador</h2>
        <div id="filtros"></div>
        <div
          style="
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0px;
          "
        >
          <p id="resumoFiltro"></p>

          <div id="totalEnc"></div>
          <button id="exportarExcel" onclick="exportarExcel()">
            Exportar Excel
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ticket</th>
              <th>Localizador</th>
              <th>Contato</th>
              <th>Waiver</th>
              <th>Motivo</th>
              <th>Isentou DU</th>
              <th>Motivo DU</th>
              <th>Possui Infant</th>
              <th>Emissor da Reserva</th>
              <th>Invoice</th>
              <th>Link de Pagamento</th>
              <th>Erro no Link</th>
              <th>Data/Hora</th>
              <th>Assinatura</th>
            </tr>
          </thead>
          <tbody id="tabelaRelatorios"></tbody>
        </table>

        <div style="margin: 10px 0; display: flex; gap: 10px; align-items: center">
          <label>Linhas:</label>
          <select id="linhasPagina">
            <option value="10">10</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>

          <div>
            <button id="pageprev" disabled>◀</button>
            <span id="numeroDpages"></span>
            <button id="pagenext" disabled>▶</button>
          </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        <!-- Cache-busting para evitar versão antiga em cache -->
        <script type="module" src="relatorios.js?v=2026-02-11-02"></script>

    `;
    document.body.style.cssText = `
       font-family: Segoe UI, Arial, sans-serif; 
       margin: 40px; 
       background:#fff; 
       color:var(--text);
       `;

    const resumoFiltro = document.getElementById("resumoFiltro");

    if (!resumoFiltro) {
      console.log("resumoFiltro Falso");
      return;
    }

    resumoFiltro.textContent = `Selecione os filtros desejados e clique em 'Filtrar' para buscar os registros.`;

    document.getElementById("linhasPagina").addEventListener("change", (e) => {
      limiteLinhas = parseInt(e.target.value);
      paginaAtual = 1;
      atualizarTabela();
    });

    document.getElementById("pageprev").onclick = () => {
      if (paginaAtual > 1) {
        paginaAtual--;
        atualizarTabela();
      }
    };

    document.getElementById("pagenext").onclick = () => {
      const dados = registrosFiltrados.length ? registrosFiltrados : registros;

      const totalPaginas = Math.max(1, Math.ceil(dados.length / limiteLinhas));

      if (paginaAtual < totalPaginas) {
        paginaAtual++;
        atualizarTabela();
      }
    };

    await carregarFiltros();
    atualizarTabela();
  } else {
    document.getElementById("erro").innerText = "Senha incorreta!";
  }
}

document.getElementById("bEntr").addEventListener("click", () => verificar());
