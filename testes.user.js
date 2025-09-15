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

  const Lugar = {
    relatorio: '[role="button"][aria-label="Reporting"]',
    produtividade: '[type="button"][aria-label="Produtividade"]',
    desempenho: '[type="button"][aria-label="Desempenho"]',
    hoje: '[type="button"][aria-label="Hoje"]',
  };

  function AtuAtendidas() {
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

    let valorAoLadoDeEntrada = entrada?.first; // deve ser 14 no seu HTML

    if (valorAoLadoDeEntrada === null || valorAoLadoDeEntrada === undefined) {
      console.log(
        "NiceMonk false valorAoLadoDeEntrada :",
        valorAoLadoDeEntrada
      );
      return false;
    } else {
      stt.vAtendidas = valorAoLadoDeEntrada;
      console.log("NiceMonk true valorAoLadoDeEntrada :", valorAoLadoDeEntrada);
      return true;
    }
  }

  function AtualizarDTI() {
    function pickLabelFromText(text) {
      // Pega o texto antes do parênteses: "Disponível (21%)" -> "Disponível"
      return (text || "").split("(")[0].trim() || null;
    }

    /*************** Núcleo: por ID do ícone ***************/
    function getStatusByIconId(iconId, { root = document } = {}) {
      const svg =
        (root.getElementById && root.getElementById(iconId)) ||
        root.querySelector("#" + CSS.escape(iconId));
      if (!svg) return null;

      // O <p> com "Disponível (21%)" é imediatamente após o <svg>
      const labelP =
        (svg.nextElementSibling &&
          svg.nextElementSibling.tagName === "P" &&
          svg.nextElementSibling) ||
        svg.parentElement?.querySelector("p") ||
        null;

      const labelText = labelP?.textContent?.trim() || null;
      const label = pickLabelFromText(labelText);

      // O tempo HH:MM:SS fica no "grid" irmão (o próximo <div>) e dentro dele o primeiro <p>
      const labelGrid =
        svg.closest(".MuiGrid-root") ||
        labelP?.closest(".MuiGrid-root") ||
        svg.parentElement;
      const timeGrid = labelGrid?.nextElementSibling || null;
      const timeP = timeGrid?.querySelector("p") || null;
      const timeText = timeP?.textContent?.trim() || null;

      return { iconId, label, time: timeText, nodes: { svg, labelP, timeP } };
    }

    /*************** Atalhos ***************/
    function getDisponivel(root = document) {
      return getStatusByIconId("availableStatusIconId", { root });
    }
    function getTrabalhando(root = document) {
      return getStatusByIconId("workingDefaultIconId", { root });
    }
    function getIndisponivel(root = document) {
      return getStatusByIconId("unavailableStatusIconId", { root });
    }

    // Primeiro, pega o objeto completo
    const DisponivelData = getDisponivel(); // { label, percent, time, seconds, ... }
    const TrabalhandoData = getTrabalhando();
    const IndisponivelData = getIndisponivel();

    if (
      DisponivelData?.time === null ||
      TrabalhandoData?.time === null ||
      IndisponivelData?.time === null
    ) {
      return false;
    } else {
      time.Disponivel = DisponivelData?.time;
      time.Trabalhando = TrabalhandoData?.time;
      time.Indisponivel = IndisponivelData?.time;
      // Agora define a variável com o valor em segundos
      Segun.Disponivel = converterParaSegundos(time.Disponivel || 0);
      Segun.Trabalhando = converterParaSegundos(time.Trabalhando || 0);
      Segun.Indisponivel = converterParaSegundos(time.Indisponivel || 0);

      return true;
    }
    //console.log('Disponível em segundos:');
  }

  // Função que retorna uma Promise para aguardar o item aparecer
  function encontrarItemAsync(seletor) {
    return new Promise((resolve, reject) => {
      let encontrado = false;

      const observer = new MutationObserver(() => {
        const item = document.querySelector(seletor);
        if (item) {
          encontrado = true;
          observer.disconnect();
          resolve(item);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        if (!encontrado) {
          observer.disconnect();
          reject(`NiceMonk Item ${seletor} não encontrado após 5 segundos.`);
        }
      }, 5000);
    });
  }

  // Função para clicar no item após encontrá-lo
  async function clicarNoItem(seletor) {
    try {
      const item = await encontrarItemAsync(seletor);
      item.click();
      console.log(`NiceMonk Clicado: ${seletor}`);
      return true;
    } catch (erro) {
      console.error(`NiceMonk Erro ao clicar em ${seletor}:`, erro);
      return false;
    }
  }

  // Função principal para executar os cliques em sequência
  async function executarSequencia(ordem) {
    const ordem1 = [Lugar.relatorio, Lugar.produtividade, Lugar.hoje];

    const ordem2 = [Lugar.relatorio, Lugar.desempenho, Lugar.hoje];
    let as = ordem ? ordem2 : ordem1;

    for (const seletor of as) {
      const sucesso = await clicarNoItem(seletor);
      if (!sucesso) {
        console.log(`NiceMonk Sequência Falhou em ${seletor}.`);
        break; // Para a sequência se algum item falhar
      } else {
        let umt = 0;
        for (let a = 0; !umt && a < 3; a++) {
          if (ordem) {
            umt = await AtualizarDTI();
          } else {
            umt = await AtuAtendidas();
          }
        }
      }
      //await new Promise(resolve => setTimeout(resolve, 500)); // Espera opcional entre cliques
    }

    console.log("NiceMonk Sequência finalizada.");
  }

  // Inicia a sequência
  executarSequencia(0);
})();
