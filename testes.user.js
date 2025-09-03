

const LugarJS = {
  abaRelatorio:
    "#cx1_agent_root > div.MuiBox-root.css-ermjec > div.MuiBox-root.css-0 > nav > div > div:nth-child(8) > div > div"
};

function ObservarItem(a, b) {
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

ObservarItem(LugarJS.abaRelatorio, () => {
  const NomeDIt = Object.keys(LugarJS).filter(
    (chave) => LugarJS[chave] === LugarJS.abaRelatorio
  );
  console.log(`Teste -- ${NomeDIt} detectado pelo MutationObserver.`);
});

