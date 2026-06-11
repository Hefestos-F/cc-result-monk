// ================== CONEXÃO FIREBASE ==================

//esta em outro lugar


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
let linhasPorPagina = 10;

// ================== CARREGAR FILTROS ==================
async function carregarFiltros() {
  try {
    const q = query(collection(db, "registros"), limit(200));

    const snapshot = await getDocs(q);
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
    dataInicio.type = "date";
    dataInicio.id = "dataInicio";
    const labelAte = document.createElement("label");
    labelAte.textContent = "Até";
    labelAte.setAttribute("for", "dataFim");
    const dataFim = document.createElement("input");
    dataFim.type = "date";
    dataFim.id = "dataFim";
    const botao = document.createElement("button");
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
  } catch (error) {
    console.error("Erro ao carregar filtros:", error);
    alert("Erro ao carregar filtros do Firestore.");
  }
}

// ================== FILTRAR ==================
async function filtrarRelatorio() {
  try {
    const tabela = document.getElementById("tabelaRelatorios");
    tabela.innerHTML = `<tr><td colspan="15" style="text-align:center;">Carregando registros...</td></tr>`;

    let filtrados = [...registros];

    CAMPOS_FILTRO.forEach((c) => {
      const el = document.getElementById(`filtro_${c.id}`);
      const valor = el ? el.value : "";
      if (valor) {
        filtrados = filtrados.filter(
          (r) => String(r[c.id] ?? "").toLowerCase() === valor.toLowerCase(),
        );
      }
    });

    // Período
    const dataInicio = document.getElementById("dataInicio")?.value || "";
    const dataFim = document.getElementById("dataFim")?.value || "";
    if (dataInicio || dataFim) {
      const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
      const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
      filtrados = filtrados.filter((r) => {
        if (!r.dataHora) return false;
        const d = converterData(r.dataHora);
        if (!d) return false;
        if (inicio && d < inicio) return false;
        if (fim && d > fim) return false;
        return true;
      });
    }

    registrosFiltrados = [...filtrados];
    paginaAtual = 1;
    gerarTabela(filtrados);

    // Resumo
    const resumo = document.getElementById("resumoFiltro");
    const ativos = [];
    CAMPOS_FILTRO.forEach((c) => {
      const el = document.getElementById(`filtro_${c.id}`);
      const valor = el ? el.value : "";
      if (valor)
        ativos.push(
          `${c.label}: ${c.id === "empresaInvoice" ? formatEmpresa(valor) : valor}`,
        );
    });
    if (dataInicio || dataFim) {
      let periodo = "Período: ";
      if (dataInicio) periodo += `de ${formatarData(dataInicio)} `;
      if (dataFim) periodo += `até ${formatarData(dataFim)} `;
      ativos.push(periodo.trim());
    }
    resumo.textContent = ativos.length
      ? `Filtros aplicados: ${ativos.join(" \n ")} \n Total: ${filtrados.length}`
      : `Nenhum filtro aplicado \n Total: ${filtrados.length}`;
  } catch (error) {
    console.error("Erro ao filtrar registros:", error);
    alert("Erro ao filtrar registros.");
  }
}

// ================== MUDAR PAGINA ==================
function mudarPagina(acao) {
  const totalPaginas = Math.ceil(registrosFiltrados.length / linhasPorPagina);

  paginaAtual += acao;

  if (paginaAtual < 1) paginaAtual = 1;
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  gerarTabela(registrosFiltrados);
}

document.getElementById("pagenext").onclick = () => mudarPagina(1);
document.getElementById("pageprev").onclick = () => mudarPagina(-1);
document.getElementById("linhasPagina").addEventListener("change", (e) => {
  linhasPorPagina = parseInt(e.target.value);
  paginaAtual = 1; // volta pra página 1
  gerarTabela(registrosFiltrados);
});

// ================== TABELA ==================
function gerarTabela(lista = []) {
  const tabela = document.getElementById("tabelaRelatorios");

  tabela.innerHTML = "";

  if (lista.length === 0) {
    tabela.innerHTML = `<tr><td colspan="15" style="text-align:center;">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  // 🔹 cálculo paginação
  const inicio = (paginaAtual - 1) * linhasPorPagina;
  const fim = inicio + linhasPorPagina;
  const pagina = lista.slice(inicio, fim);

  // 🔹 render tabela
  pagina.forEach((r, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inicio + i + 1}</td>
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

  // 🔹 paginação
  const totalPaginas = Math.ceil(lista.length / linhasPorPagina);

  const numeroDpages = document.getElementById("numeroDpages");
  const pageprev = document.getElementById("pageprev");
  const pagenext = document.getElementById("pagenext");

  numeroDpages.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  pageprev.disabled = paginaAtual === 1;
  pagenext.disabled = paginaAtual === totalPaginas;
}

// ================== EXPORTAR EXCEL ==================
function exportarExcel() {
  if (registrosFiltrados.length === 0) {
    alert("Nenhum registro para exportar.");
    return;
  }
  const dadosExport = registrosFiltrados.map((r) => ({ ...r }));
  const agora = new Date();
  const nomeArquivo = `relatorio_waivers_${agora.getFullYear()}-${(agora.getMonth() + 1).toString().padStart(2, "0")}-${agora.getDate().toString().padStart(2, "0")}_${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}.xlsx`;
  const ws = XLSX.utils.json_to_sheet(dadosExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
  XLSX.writeFile(wb, nomeArquivo);
}

// ================== UTILITÁRIOS ==================
function formatEmpresa(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();
  if (s === "gol") return "Gol";
  if (s === "smiles") return "Smiles";
  return v;
}

function converterData(dataStr) {
  if (!dataStr) return null;
  // Aceita dd/mm/aaaa HH:MM[:SS]
  const match = dataStr.match(
    /^(\d{2})\/(\d{2})\/(\d{4})[^\d]*(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return null;
  const [, dia, mes, ano, hora, min, seg] = match;
  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(min),
    Number(seg ?? 0),
  );
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// ================== INIT ==================
window.onload = async function () {
  try {
    document.getElementById("resumoFiltro").textContent =
      "Selecione os filtros desejados e clique em 'Filtrar' para buscar os registros.";
  } catch (_) {}
  await carregarFiltros();
  gerarTabela([]);
};

// Expor
window.exportarExcel = exportarExcel;
