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
      }
      //await new Promise(resolve => setTimeout(resolve, 500)); // Espera opcional entre cliques
    }

    console.log("NiceMonk Sequência finalizada.");
  }

  // Inicia a sequência
  executarSequencia(0);
})();
