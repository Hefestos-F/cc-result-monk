

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

function ObservarItem(a,b) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Sua lógica para lidar com mudanças no DOM
      if (a) {
        b();
        observer.disconnect();
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

ObservarItem(LugarJS.abaRelatorio,() => {
  const NomeDIt = Object.keys(LugarJS).filter(
          (chave) => LugarJS[chave] === LugarJS.abaRelatorio
        );
  console.log(`Teste -- ${NomeDIt} detectado pelo MutationObserver.`);
});

