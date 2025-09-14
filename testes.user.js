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

  function encontrarItem(item1, callback) {
    let encontrado = false;

    const observer = new MutationObserver(() => {
      const item = document.querySelector(item1);
      if (item) {
        encontrado = true;
        observer.disconnect();
        callback(item);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      if (!encontrado) {
        observer.disconnect();
        console.log("NiceMonk Item não encontrado após 5 segundos.");
      }
    }, 5000);
  }

  encontrarItem(Lugar.relatorio,() => {
    console.log("NiceMonk Encontrado");
  });

  function clicarNoItem(item1) {
    encontrarItem(item1,(item) => {
      item.click();
      console.log("Item clicado com sucesso.");
    });
  }

  clicarNoItem(Lugar.relatorio);
  clicarNoItem(Lugar.produtividade);
  clicarNoItem(Lugar.hoje);


  
  /* * * * * * * * * * * * * * * * * * * * */


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
        reject(`Item ${seletor} não encontrado após 5 segundos.`);
      }
    }, 5000);
  });
}

// Função para clicar no item após encontrá-lo
async function clicarNoItem(seletor) {
  try {
    const item = await encontrarItemAsync(seletor);
    item.click();
    console.log(`✅ Clicado: ${seletor}`);
    return true;
  } catch (erro) {
    console.error(`❌ Erro ao clicar em ${seletor}:`, erro);
    return false;
  }
}

// Função principal para executar os cliques em sequência
async function executarSequencia() {
  const ordem = [
    Lugar.relatorio,
    Lugar.produtividade,
    Lugar.desempenho,
    Lugar.hoje,
  ];

  for (const seletor of ordem) {
    const sucesso = await clicarNoItem(seletor);
    if (!sucesso) break; // Para a sequência se algum item falhar
    await new Promise(resolve => setTimeout(resolve, 500)); // Espera opcional entre cliques
  }

  console.log("✅ Sequência finalizada.");
}

// Inicia a sequência
executarSequencia();


})();
