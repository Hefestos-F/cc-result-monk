// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://smileshelp.zendesk.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  /**
   * Encontra todos os localizadores no texto.
   * @param {HTMLElement|string} fonte - Elemento DOM (com textContent) ou string.
   * @returns {string[]} Array com todos os valores encontrados (pode ser vazio).
   */
  function extrairTodosLocalizadores(fonte) {
    const texto =
      typeof fonte === "string" ? fonte : (fonte?.textContent ?? "");
    if (!texto) return [];

    const re = /Localizador\s*-\s*(.+?)(?:\r?\n|$)/gi;
    const out = [];
    for (const m of texto.matchAll(re)) {
      out.push(m[1].trim().toUpperCase());
    }
    return out;
  }

  /**
   * Retorna o <textarea> cujo pai contém um <label> com o texto
   * "Resumo / Relato do Cliente*" e que esteja visível.
   * - Procura por label e textarea no MESMO pai.
   * - Garante que o textarea esteja visível (display, visibility, opacity, dimensões).
   * @returns {HTMLTextAreaElement|null}
   */
  function obterTextareaResumoRelatoVisivel() {
    const textoAlvoNormalizado = "resumo / relato do cliente*";

    // Helper: normaliza string (trim, espaços internos e case-insensitive)
    const norm = (s) => s?.toLowerCase().replace(/\s+/g, " ").trim() || "";

    // Helper: checa visibilidade do elemento
    const isVisible = (el) => {
      if (!el || !(el instanceof Element)) return false;
      const style = getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      )
        return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      // Opcional: verificar se está no DOM
      if (!document.body.contains(el)) return false;
      return true;
    };

    // 1) Tenta via relação direta: label e textarea como filhos do mesmo pai
    const labels = Array.from(document.querySelectorAll("label"));
    for (const label of labels) {
      if (norm(label.textContent) === textoAlvoNormalizado) {
        const pai = label.parentElement;
        if (!pai) continue;

        // Procura textarea no mesmo pai (irmão)
        const textarea = pai.querySelector("textarea");
        if (textarea && isVisible(textarea)) {
          return textarea;
        }

        // Caso a estrutura seja um pouco mais aninhada, tenta um nível a mais dentro do pai
        const textareaProfundo = Array.from(
          pai.querySelectorAll("textarea"),
        ).find(isVisible);
        if (textareaProfundo) return textareaProfundo;
      }
    }

    // 2) Plano B: se o <label> tiver atributo for="idDoTextarea"
    for (const label of labels) {
      if (norm(label.textContent) === textoAlvoNormalizado) {
        const forId = label.getAttribute("for");
        if (forId) {
          const tex = document.getElementById(forId);
          if (tex instanceof HTMLTextAreaElement && isVisible(tex)) {
            // Ainda assim, garantimos que compartilham o mesmo pai (se isso for requisito estrito)
            if (
              tex.parentElement &&
              label.parentElement &&
              tex.parentElement === label.parentElement
            ) {
              return tex;
            }
            // Se aceitar pequena variação estrutural, pode retornar mesmo sem o mesmo pai:
            // return tex;
          }
        }
      }
    }

    // 3) Plano C (XPath): label pelo texto normalizado e textarea no mesmo ancestral imediato
    // Útil quando existem wrappers leves ao redor do texto do label.
    try {
      const xpath = `
      //label[
        normalize-space(translate(string(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ','abcdefghijklmnopqrstuvwxyzáàâãéèêíìîóòôõúùûç')) =
        '${"Resumo / Relato do Cliente*".toLowerCase()}'
      ]
    `;
      const iter = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null,
      );
      let lbl;
      while ((lbl = iter.iterateNext())) {
        const pai = lbl.parentElement;
        if (!pai) continue;
        const tx = pai.querySelector("textarea");
        if (tx && isVisible(tx)) return tx;
      }
    } catch (_) {
      // silencioso
    }

    return null;
  }

  function getInputLocalizadorPNR() {
    const textoAlvo = "localizador pnr";

    // Normaliza texto (remove espaços extras, deixa minúsculo)
    const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

    // Checa se o elemento está visível
    const isVisible = (el) => {
      if (!el) return false;
      const st = getComputedStyle(el);
      if (
        st.display === "none" ||
        st.visibility === "hidden" ||
        st.opacity === "0"
      )
        return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // Procura todas as labels da página
    const labels = document.querySelectorAll("label");

    for (const label of labels) {
      if (norm(label.textContent) === textoAlvo) {
        const pai = label.parentElement;
        if (!pai) continue;

        // Procura input dentro do mesmo pai
        const input = pai.querySelector("input");
        if (input && isVisible(input)) {
          return input;
        }
      }
    }

    return null;
  }

  const textarea = obterTextareaResumoRelatoVisivel();
  if (textarea) {
    textarea.addEventListener("input", () => {
      const a = extrairTodosLocalizadores(textarea);
      console.log("Textarea encontrado:", a);
      const b = getInputLocalizadorPNR();
      b.value = a;
    });
    // exemplo: textarea.value = "Texto de teste";
  } else {
    console.warn("Textarea não encontrado ou não está visível.");
  }

})();
