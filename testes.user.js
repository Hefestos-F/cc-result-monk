// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  
  function compararDatas(a, b) {
    // Validação básica
    if (!a?.data || !a?.hora || !b?.data || !b?.hora) {
      throw new Error(
        "Objetos precisam ter {data: 'YYYY-MM-DD', hora: 'HH:MM:SS'}",
      );
    }

    // Usa horário local (interpretação padrão do JS para strings ISO sem timezone)
    const da = new Date(`${a.data}T${a.hora}`);
    const db = new Date(`${b.data}T${b.hora}`);

    // Verifica se datas são válidas
    if (isNaN(da) || isNaN(db)) {
      throw new Error(
        "Data/hora inválidas. Formato esperado: 'YYYY-MM-DD' e 'HH:MM:SS'.",
      );
    }

    return da.getTime() > db.getTime();
  }
  const plog = { "hora": "10:42:53", "data": "2026-01-30" }
  const plan = {"data":"2026-01-30","hora":"09:33:14"}

  compararDatas(plog,plan)

})();
