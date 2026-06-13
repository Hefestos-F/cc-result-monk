# Funções Extras para Dataverse

Este arquivo contém exemplos de funções adicionais que podem ser integradas ao `relatorios.js` para criar, atualizar ou deletar registros no Dataverse.

## 1️⃣ Criar Novo Registro

```javascript
/**
 * Criar novo registro no Dataverse
 * @param {Object} dados - Objeto com os dados do registro
 */
async function criarRegistro(dados) {
  try {
    const payload = {
      cr1e5_ticket: dados.ticket || "",
      cr1e5_localizador: dados.localizador || "",
      cr1e5_contato: dados.contato || "",
      cr1e5_waiver: dados.waiver || "",
      cr1e5_motivo: dados.motivo || "",
      cr1e5_isentoudu: dados.isentouDU || "",
      cr1e5_motivodu: dados.motivoDU || "",
      cr1e5_utilizouinvoice: dados.utilizouInvoice || "",
      cr1e5_empresainvoice: dados.empresaInvoice || "",
      cr1e5_valorinvoice: dados.valorInvoice || "",
      cr1e5_realizoupagamento: dados.realizouPagamento || "",
      cr1e5_link: dados.link || "",
      cr1e5_datahora: dados.dataHora || new Date().toLocaleString("pt-BR"),
      cr1e5_assinatura: dados.assinatura || "",
    };

    const response = await fetchDataverse(`/${ENTITY_NAME}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("Registro criado com sucesso:", response);
    alert("Registro salvo com sucesso!");
    return response;
  } catch (error) {
    console.error("Erro ao criar registro:", error);
    alert("Erro ao salvar o registro. Tente novamente.");
  }
}
```

## 2️⃣ Atualizar Registro Existente

```javascript
/**
 * Atualizar registro existente no Dataverse
 * @param {string} recordId - ID do registro (GUID)
 * @param {Object} dados - Dados a atualizar
 */
async function atualizarRegistro(recordId, dados) {
  try {
    const payload = {};

    // Adicionar apenas os campos que foram fornecidos
    if (dados.ticket !== undefined) payload.cr1e5_ticket = dados.ticket;
    if (dados.localizador !== undefined) payload.cr1e5_localizador = dados.localizador;
    if (dados.contato !== undefined) payload.cr1e5_contato = dados.contato;
    if (dados.waiver !== undefined) payload.cr1e5_waiver = dados.waiver;
    if (dados.motivo !== undefined) payload.cr1e5_motivo = dados.motivo;
    if (dados.isentouDU !== undefined) payload.cr1e5_isentoudu = dados.isentouDU;
    if (dados.motivoDU !== undefined) payload.cr1e5_motivodu = dados.motivoDU;
    if (dados.utilizouInvoice !== undefined) payload.cr1e5_utilizouinvoice = dados.utilizouInvoice;
    if (dados.empresaInvoice !== undefined) payload.cr1e5_empresainvoice = dados.empresaInvoice;
    if (dados.valorInvoice !== undefined) payload.cr1e5_valorinvoice = dados.valorInvoice;
    if (dados.realizouPagamento !== undefined) payload.cr1e5_realizoupagamento = dados.realizouPagamento;
    if (dados.link !== undefined) payload.cr1e5_link = dados.link;
    if (dados.assinatura !== undefined) payload.cr1e5_assinatura = dados.assinatura;

    await fetchDataverse(`/${ENTITY_NAME}(${recordId})`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    console.log("Registro atualizado com sucesso");
    alert("Registro atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar registro:", error);
    alert("Erro ao atualizar o registro. Tente novamente.");
  }
}
```

## 3️⃣ Deletar Registro

```javascript
/**
 * Deletar registro do Dataverse
 * @param {string} recordId - ID do registro (GUID)
 */
async function deletarRegistro(recordId) {
  if (!confirm("Tem certeza que deseja deletar este registro?")) {
    return;
  }

  try {
    await fetchDataverse(`/${ENTITY_NAME}(${recordId})`, {
      method: "DELETE",
    });

    console.log("Registro deletado com sucesso");
    alert("Registro deletado com sucesso!");
    await carregarFiltros(); // Recarregar tabela
  } catch (error) {
    console.error("Erro ao deletar registro:", error);
    alert("Erro ao deletar o registro. Tente novamente.");
  }
}
```

## 4️⃣ Buscar Registro por ID

```javascript
/**
 * Buscar um registro específico pelo ID
 * @param {string} recordId - ID do registro (GUID)
 */
async function buscarRegistroPorId(recordId) {
  try {
    const data = await fetchDataverse(`/${ENTITY_NAME}(${recordId})`);
    return normalizarRegistro(data);
  } catch (error) {
    console.error("Erro ao buscar registro:", error);
    return null;
  }
}
```

## 5️⃣ Buscar com Filtro Dinâmico

```javascript
/**
 * Buscar registros com filtro OData
 * @param {string} filtro - Query OData (ex: "cr1e5_ticket eq 'TKT123'")
 * @param {number} top - Limite de registros (padrão: 100)
 */
async function buscarComFiltro(filtro, top = 100) {
  try {
    const endpoint = `/${ENTITY_NAME}?$filter=${encodeURIComponent(filtro)}&$top=${top}`;
    const data = await fetchDataverse(endpoint);
    return data.value.map(normalizarRegistro);
  } catch (error) {
    console.error("Erro ao buscar com filtro:", error);
    return [];
  }
}

// Exemplos de uso:
// await buscarComFiltro("cr1e5_ticket eq 'TKT123'");
// await buscarComFiltro("contains(cr1e5_contato, 'João')");
// await buscarComFiltro("cr1e5_datahora gt 2024-01-01");
```

## 6️⃣ Buscar com Paginação

```javascript
/**
 * Buscar registros com paginação
 * @param {number} pagina - Número da página (1-based)
 * @param {number} itensPorPagina - Itens por página
 * @param {string} orderBy - Campo para ordenação (ex: 'cr1e5_datahora desc')
 */
async function buscarComPaginacao(pagina = 1, itensPorPagina = 100, orderBy = "cr1e5_datahora desc") {
  try {
    const skip = (pagina - 1) * itensPorPagina;
    const endpoint = `/${ENTITY_NAME}?$skip=${skip}&$top=${itensPorPagina}&$orderby=${orderBy}`;

    const data = await fetchDataverse(endpoint);
    return {
      registros: data.value.map(normalizarRegistro),
      total: data["@odata.count"] || 0,
      proximaUrl: data["@odata.nextLink"],
    };
  } catch (error) {
    console.error("Erro ao buscar com paginação:", error);
    return { registros: [], total: 0, proximaUrl: null };
  }
}
```

## 7️⃣ Estatísticas e Contagem

```javascript
/**
 * Contar registros com filtro
 * @param {string} filtro - Query OData (opcional)
 */
async function contarRegistros(filtro = "") {
  try {
    const query = filtro ? `?$filter=${encodeURIComponent(filtro)}&$count=true` : "?$count=true";
    const data = await fetchDataverse(`/${ENTITY_NAME}${query}`);
    return data["@odata.count"];
  } catch (error) {
    console.error("Erro ao contar registros:", error);
    return 0;
  }
}

// Exemplo de uso:
// const total = await contarRegistros(); // Total de registros
// const comWaiver = await contarRegistros("cr1e5_waiver eq 'Sim'");
```

## 8️⃣ Exportar com Filtro OData

```javascript
/**
 * Exportar registros filtrados para Excel
 * @param {string} filtro - Query OData (opcional)
 * @param {string} nomeArquivo - Nome do arquivo (opcional)
 */
async function exportarExcelComFiltro(filtro = "", nomeArquivo = "") {
  try {
    let registrosExport = registrosFiltrados; // Usa dados em cache

    // Se quiser buscar com filtro OData:
    if (filtro) {
      registrosExport = await buscarComFiltro(filtro, 5000);
    }

    if (registrosExport.length === 0) {
      alert("Nenhum registro para exportar.");
      return;
    }

    const agora = new Date();
    const nome = nomeArquivo || 
      `relatorio_${agora.getFullYear()}-${(agora.getMonth() + 1).toString().padStart(2, "0")}-${agora.getDate().toString().padStart(2, "0")}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(registrosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, nome);
  } catch (error) {
    console.error("Erro ao exportar:", error);
    alert("Erro ao exportar. Tente novamente.");
  }
}
```

---

## 📌 Como Integrar

1. Copie a função desejada do arquivo acima
2. Cole em `relatorios.js` (em qualquer lugar após a função `fetchDataverse()`)
3. Exponha a função globalmente (adicione ao final do arquivo):
   ```javascript
   window.criarRegistro = criarRegistro;
   window.atualizarRegistro = atualizarRegistro;
   // etc...
   ```
4. Use em eventos HTML ou console do navegador

---

## 🔍 Referência de Consultas OData

```javascript
// Operadores
"campo eq 'valor'"                    // Igual
"campo ne 'valor'"                    // Diferente
"campo gt 123"                        // Maior que
"campo lt 123"                        // Menor que
"campo ge 123"                        // Maior ou igual
"campo le 123"                        // Menor ou igual
"contains(campo, 'texto')"            // Contém
"startswith(campo, 'prefix')"         // Começa com
"endswith(campo, 'suffix')"           // Termina com

// Combinações
"cr1e5_ticket eq 'TKT123' and cr1e5_waiver eq 'Sim'"
"cr1e5_ticket eq 'TKT123' or cr1e5_ticket eq 'TKT456'"
```
