// ==UserScript==
// @name         Nice_test
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://cxagent.nicecxone.com/home*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        none

// ==/UserScript==

(function () {
  "use strict";

  const LugarJS = {
    elementoReferencia: "#cx1_agent_root > main > div > main > header > header",
    elementoReferencia2:
      "#cx1_agent_root > main > div > main > header > header > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-6.MuiGrid-grid-sm-12.MuiGrid-grid-md-12.MuiGrid-grid-lg-6.css-1govgzr > div",
    Status: "#agent-state-section > div > span > div > div",

    abaRelatorio:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-0 > nav > div > div:nth-child(8) > div > div",
    abaProdutividade:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > section > div > div > div > button:nth-child(1)",
    abaDesempenho:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > section > div > div > div > button:nth-child(2)",
    abaHoje:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > div.MuiBox-root.css-2ud311 > div.MuiBox-root.css-1hcj1s8 > div > button.MuiButtonBase-root.MuiToggleButton-root.MuiToggleButton-sizeMedium.MuiToggleButton-standard.css-w4b7gv",

    lContAtual: "#agent-state-section > div > span > div > div > span > span",
    lAtendidas:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > div.MuiBox-root.css-2ud311 > div.MuiBox-root.css-3b491n > div > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > span",
    lDisponibilidade:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > div.MuiBox-root.css-2ud311 > div.MuiBox-root.css-1soorb9 > div:nth-child(1) > div:nth-child(1) > div.MuiGrid-root.MuiGrid-grid-xs-6.MuiGrid-grid-lg-8.css-gfarnj > p",
    ltrabalhando:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > div.MuiBox-root.css-2ud311 > div.MuiBox-root.css-1soorb9 > div:nth-child(2) > div:nth-child(1) > div.MuiGrid-root.MuiGrid-grid-xs-6.MuiGrid-grid-lg-8.css-gfarnj > p",
    lIndisponivel:
      "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-13dfkjh > div > div.MuiGrid-root.MuiGrid-container.css-1hu6jpd > div > div > div > div > div.MuiBox-root.css-2ud311 > div.MuiBox-root.css-1soorb9 > div:nth-child(3) > div:nth-child(1) > div.MuiGrid-root.MuiGrid-grid-xs-6.MuiGrid-grid-lg-8.css-gfarnj > p",
  };

  const stt = { observ: 1 };

  addAoini();

  function ObservarItem(quandoEncontrar) {
    const observer = new MutationObserver(() => {
      quandoEncontrar();
      if (!stt.observ) {
        observer.disconnect();
        console.log(`Teste -- observer Desconectado`);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function addAoini() {
    console.log(`Teste -- observer Iniciado`);
    ObservarItem(() => {
      let a = document.querySelector(LugarJS.elementoReferencia);
      let b = document.querySelector(LugarJS.elementoReferencia2);
      if (
        a &&
        b &&
        !document.getElementById("minhaCaixa") &&
        !document.getElementById("circuloclickCont")
      ) {
        //AdicionarCaixaAtualizada(a);
        //addcirculo(b);
        //stt.NBT = 1;
        stt.observ = 0;
        //stt.logout = 0;
        //iniciarBusca();
        console.log(`Teste -- verificação Verdadeiro`);
      } else {
        console.log(`Teste -- verificação Falso`);
      }
    });
  }

  /******************************************************** */

  function AtualizarTMA2() {
    /*************** Utils ***************/
    function getRoot(rootId, root = document) {
      if (!rootId) return root;
      return (
        root.getElementById(rootId) ||
        root.querySelector(`#${CSS.escape(rootId)}`) ||
        root
      );
    }

    function toNumberOrText(text) {
      if (text == null) return null;
      const t = String(text).trim();
      if (/^-?\d+([.,]\d+)?$/.test(t)) return Number(t.replace(",", ".")); // 14, 1284, 1.5, etc
      return t; // "1%" ou outros textos
    }

    /*************** Pegar a TR pelo rótulo ***************/
    function getRowByLabel(label, { rootId, root = document } = {}) {
      const ctx = getRoot(rootId, root);
      const rows = ctx.querySelectorAll("tbody tr");
      const wanted = label.trim().toLowerCase();

      for (const tr of rows) {
        // Preferir [aria-label="Entrada"]
        if (tr.querySelector(`[aria-label="${label}"]`)) return tr;

        // Fallback por texto exato em algum nó da primeira célula
        const firstTd = tr.querySelector("td");
        if (!firstTd) continue;
        const texts = Array.from(firstTd.querySelectorAll("*"))
          .map((n) => (n.textContent || "").trim().toLowerCase())
          .filter(Boolean);

        if (texts.includes(wanted)) return tr;
      }
      return null;
    }

    /*************** Extrair os valores das colunas ***************/
    function getRowValues(tr, { preferAria = true } = {}) {
      if (!tr) return null;
      const tds = tr.querySelectorAll("td");
      const out = [];

      // Começa do índice 1 (colunas à direita do rótulo)
      for (let i = 1; i < tds.length; i++) {
        const td = tds[i];
        const span = td.querySelector("[aria-label]");

        let text =
          (preferAria && span?.getAttribute("aria-label")) ||
          (span?.textContent ?? td.textContent);

        text = (text || "").trim();
        out.push(text);
      }

      return out; // ex.: ["14", "1284", "1%"]
    }

    /*************** Atalho: valores da linha "Entrada" ***************/
    function getEntradaData(opts = {}) {
      const tr = getRowByLabel("Entrada", opts);
      if (!tr) return null;

      const vals = getRowValues(tr) || [];
      const col1 = vals[0] ?? null;
      const col2 = vals[1] ?? null;
      const col3 = vals[2] ?? null;

      return {
        label: "Entrada",
        // conversões úteis
        first: toNumberOrText(col1), // 14
        second: toNumberOrText(col2), // 1284
        row: tr,
        raw: vals,
      };
    }

    /*************** Atalhos para "Saída" e "Geral" (se precisar) ***************/
    function getLinhaDataPorRotulo(label, opts = {}) {
      const tr = getRowByLabel(label, opts);
      if (!tr) return null;
      const vals = getRowValues(tr) || [];
      return {
        label,
        first: toNumberOrText(vals[0] ?? null),
        second: toNumberOrText(vals[1] ?? null),
        percentText: vals[2] ?? null,
        row: tr,
        raw: vals,
      };
    }

    /*************** Exemplos de uso ***************/
    // 1) “O valor ao lado de Entrada” (primeira coluna numérica após o rótulo):
    const entrada = getEntradaData({
      /* rootId: 'cx1_agent_root' */
    });
    let valorAoLadoDeEntrada = entrada?.first ?? null; // deve ser 14 no seu HTML
    console.log("Valor ao lado de Entrada:", valorAoLadoDeEntrada);

    // 2) Outros valores se você precisar:
    console.log("Entrada (objeto completo):", entrada);
    // console.log('Saída:', getLinhaDataPorRotulo('Saída'));
    // console.log('Geral:', getLinhaDataPorRotulo('Geral'));
  }
  AtualizarTMA2();
})();
