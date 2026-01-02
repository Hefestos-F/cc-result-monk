// ==UserScript==
// @name         Nice_test3
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes3.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/testes3.user.js
// @grant        GM_openInTab
// @run-at       document-idle

// ==/UserScript==

(function () {
  function normalizarCampo(campo) {
    return String(campo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .trim()
      .toLowerCase();
  }
  function normalizarArrayPausas(valor) {
    if (Array.isArray(valor)) return valor;
    if (valor === false || valor == null) return [];
    if (typeof valor === "object") return Object.values(valor);
    return [];
  }
  async function atualizarCampos(id, campo, valor) {
    dadosdePausas = normalizarArrayPausas(dadosdePausas);

    const c = normalizarCampo(campo); // "inicio" | "fim" | "duracao" | ...
    const idKey = String(id);

    const index = dadosdePausas.findIndex((item) => String(item?.id) === idKey);

    if (index !== -1) {
      dadosdePausas[index][c] = valor;
    } else {
      const novoItem = { id };
      novoItem[c] = valor;
      dadosdePausas.push(novoItem);
    }

    try {
      await AddOuAtuIindexdb(ChavePausas, dadosdePausas);
    } catch (err) {
      console.error("HefestoLog: Erro ao atualizar campos no IndexedDB:", err);
    }

    if (c === "duracao") {
      console.debug("HefestoLog: Tabela salva:", ChavePausas);
    }
  }
  async function atualizarvaraveis(a = 0) {
    if (a || !dadosdePausas) {
      atualizarCampos(0, "NumerodPausa", DDPausa.numero);
      atualizarCampos(0, "inicioUltimaP", DDPausa.inicioUltimaP);
      atualizarCampos(0, "Status", stt.Status);
      atualizarCampos(0, "StatusANT", stt.StatusANT);
      //atualizarCampos(0, "TempoPausa", TempoPausas.Time);
    } else {
      DDPausa.numero = await Encontrarcampo(0, "NumerodPausa");
      DDPausa.inicioUltimaP = await Encontrarcampo(0, "inicioUltimaP");
      stt.Status = await Encontrarcampo(0, "Status");
      stt.StatusANT = await Encontrarcampo(0, "StatusANT");
      //TempoPausas.Time = Encontrarcampo(0, "TempoPausa");
    }

    console.log(
      `HefestoLog: DDPausa.numero: ${DDPausa.numero} /
        DDPausa.inicioUltimaP: ${DDPausa.inicioUltimaP}/
        stt.Status: ${stt.StatusANT}`
    );
  }
})();
