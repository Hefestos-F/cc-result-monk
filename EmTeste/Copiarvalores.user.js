// ==UserScript==
// @name         Smiles — Copiar Voos e Valores (sem emojis)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Adiciona botões de cópia nas listas de voos e nas páginas de pagamento/cancelamento, formatando o texto sem emojis e com detecção robusta de paradas/conexões.
// @match        https://backoffice-pay.smiles.com.br/*
// @icon         https://www.smiles.com.br/favicon.ico
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ==========================================================
     UTILIDADES GERAIS
  ========================================================== */

  function normalizarTexto(str) {
    if (!str) return "";
    return String(str)
      .replace(/\u00A0|&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
  }

  // Oculta/mostra um elemento de controle para não “vazar” no textContent
  function withHidden(el, fn) {
    if (!el) return fn();
    const prev = el.style.visibility;
    el.style.visibility = "hidden";
    const res = fn();
    el.style.visibility = prev || "";
    return res;
  }

  const norm = s =>
    String(s || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const formatMilhas = n => {
    n = String(n).replace(/[^\d]/g, "");
    if (!n) n = "0";
    return Number(n).toLocaleString("pt-BR");
  };

  function toBRL(raw) {
    if (!raw) return "R$ 0,00";
    let num = String(raw).replace(/[^\d,-]/g, "").trim();
    if (!num) return "R$ 0,00";

    const neg = num.startsWith("-");
    if (neg) num = num.slice(1);

    if (num.includes(",")) {
      num = num.replace(/\./g, "");
      let [r, c = "00"] = num.split(",");
      r = r.replace(/^0+(?=\d)/, "") || "0";
      c = (c + "00").slice(0, 2);
      r = r.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return (neg ? "-" : "") + `R$ ${r},${c}`;
    }

    if (!/^\d+$/.test(num)) return "R$ 0,00";
    if (num.length === 1) num = "0" + num;

    let r = num.slice(0, -2) || "0";
    let c = num.slice(-2);
    r = r.replace(/^0+(?=\d)/, "") || "0";
    r = r.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + `R$ ${r},${c}`;
  }

  /* ==========================================================
     PARTE 1 — LISTA DE VOOS (4 COLUNAS)
  ========================================================== */

  function formatarColunaVoo(raw) {
    // 1) Normaliza, mas guarda uma cópia "crua" para analisar paradas/conexões
    const tFull = normalizarTexto(raw);
    let t = tFull;

    // 2) Remoção segura do bloco de detalhes (apenas para o visual final)
    t = t
      .replace(/UPGRADE[\s\S]*?Fechar Detalhes/gi, " ") // limpa bloco expandido
      .replace(/Fechar Detalhes/gi, " ")
      .replace(/N0\s+Parada\(s\)/gi, " "); // ruído comum (N0 com zero/letra O)

    // ==== Capturar origem → destino (Cidade (IATA) → Cidade (IATA)) ====
    let origem = null, destino = null;
    const rotaMatch = t.match(/([A-Za-zÀ-ú\s]+)\s+\(([A-Z]{3})\)\s+([A-Za-zÀ-ú\s]+)\s+\(([A-Z]{3})\)/);
    if (rotaMatch) {
      origem = `${rotaMatch[1].trim()} (${rotaMatch[2]})`;
      destino = `${rotaMatch[3].trim()} (${rotaMatch[4]})`;
      t = t.replace(rotaMatch[0], "").trim();
    }

    // Número do voo (ex.: G3-1029 ou G3-1572 / G3-1842) — pega o primeiro
    const vooMatch = t.match(/\b[A-Z]{2,3}-?\d{3,4}\b/);
    const vooCode = vooMatch ? vooMatch[0] : "";

    // Inserir labels (sem emojis)
    t = t
      .replace(/Cabine:/g, "\nCabine:")
      .replace(/Partida/g, "\nPartida:")
      .replace(/Chegada/g, "\nChegada:")
      .replace(/Duração total da viagem:/g, "\nDuração total:");

    // Corrigir traço solto no fim da linha de Partida (ex.: "01:35 -")
    t = t.replace(/(Partida:[^\n]*?)\s*-\s*$/m, "$1");

    // ======== DETECÇÃO ROBUSTA DE PARADAS / CONEXÕES / ESCALAS =========
    // Importante: analisar SEM limpar o bloco de detalhes — usar 'tFull'
    const fonteParadas = tFull
      .replace(/N0\s+Parada\(s\)/gi, "No Parada(s)")
      .replace(/\u00A0/g, " ");

    // 1) Direto
    const isDireto =
      /\bSem\s+(Paradas?|Conex(?:ões|oes|ao|ão)|Escalas?)\b/i.test(fonteParadas) ||
      /\bDireto\b/i.test(fonteParadas);

    // 2) Quantidade explícita — pega o MAIOR número que achar
    let qtdParadas = null;
    const padroesQtd = [
      /\b(\d+)\s*Parada(?:s)?\b/gi,
      /\b(\d+)\s*Conex(?:ões|oes|ao|ão)\b/gi,
      /\b(\d+)\s*Escala(?:s)?\b/gi,
      /Parada\(s\)\s*:\s*(\d+)/gi,
      /Quantidade\s+de\s+paradas\s*:\s*(\d+)/gi
    ];
    for (const rx of padroesQtd) {
      let m;
      while ((m = rx.exec(fonteParadas)) !== null) {
        const n = Number(m[1]);
        if (!Number.isNaN(n)) {
          qtdParadas = Math.max(qtdParadas ?? 0, n);
        }
      }
    }

    // Monta a informação de paradas/conexões
    let infoParadas = "";
    if (isDireto && (qtdParadas == null || qtdParadas === 0)) {
      infoParadas = "[Sem paradas]";
    } else if (qtdParadas != null && qtdParadas > 0) {
      infoParadas = (qtdParadas === 1) ? "(1 parada)" : `(${qtdParadas} paradas)`;
    } else {
      infoParadas = "";
    }

    // 3) Limpar menções remanescentes em 't' (evitar duplicação)
    const lixoParadas = [
      /\bSem\s+Paradas?\b/gi,
      /\bSem\s+Conex(?:ões|oes|ao|ão)\b/gi,
      /\bSem\s+Escalas?\b/gi,
      /\bDireto\b/gi,
      /\b\d+\s*Parada(?:s)?\b/gi,
      /\b\d+\s*Conex(?:ões|oes|ao|ão)\b/gi,
      /\b\d+\s*Escala(?:s)?\b/gi,
      /Parada\(s\)\s*:\s*\d+/gi,
      /Quantidade\s+de\s+paradas\s*:\s*\d+/gi
    ];
    lixoParadas.forEach(rx => { t = t.replace(rx, ""); });

    // ==== Extrair blocos relevantes (sem duplicatas) ====
    const cab = (t.match(/Cabine:[^\n]+/) || [null])[0];
    const partida = (t.match(/Partida:[^\n]+/) || [null])[0];
    const chegada = (t.match(/Chegada:[^\n]+/) || [null])[0];
    const duracao = (t.match(/Duração total:[^\n]+/) || [null])[0];

    const blocoInfo = [];
    if (cab) blocoInfo.push(cab);
    if (partida) blocoInfo.push(partida);
    if (chegada) blocoInfo.push(chegada);
    if (duracao) {
      let linhaDur = duracao;
      if (infoParadas) linhaDur += `  ${infoParadas}`;
      blocoInfo.push(linhaDur);
    }

    const header = (origem && destino) ? `Rota: ${origem} → ${destino}` : "";
    const codeLine = vooCode ? `Voo: ${vooCode}` : "";

    return [header, codeLine, ...blocoInfo].filter(Boolean).join("\n").trim();
  }

  function formatarColunaMilhas(raw) {
    let t = normalizarTexto(raw);

    // Extrair Tarifa Especial Diamante
    const espMatch = t.match(/TARIFA ESPECIAL DIAMANTE\s+([\d\.]+)/i);
    const tarifaEspecial = espMatch ? espMatch[1].replace(/\./g, "") : null;
    if (espMatch) t = t.replace(espMatch[0], "");

    // Extrair Diamante/Clube e Padrão
    const milhasMatch = t.match(/CLUBE SMILES E DIAMANTE\s+([\d\.]+)\s+([\d\.]+)/i);
    const milhasDiamante = milhasMatch ? milhasMatch[1].replace(/\./g, "") : null;
    const milhasPadrao = milhasMatch ? milhasMatch[2].replace(/\./g, "") : null;

    const linhas = [];
    if (tarifaEspecial) linhas.push(`Tarifa Especial Diamante: ${tarifaEspecial} milhas`);
    if (milhasDiamante || milhasPadrao) {
      if (!tarifaEspecial) linhas.push(""); // linha em branco para leitura
      linhas.push(`Diamante / Clube Smiles: ${milhasDiamante || "-"} milhas`);
      linhas.push(`Tarifa padrão: ${milhasPadrao || "-"} milhas`);
    }

    return linhas.join("\n").trim();
  }

  function formatarColunaMix(raw) {
    let t = normalizarTexto(raw);
    const linhas = [];

    // Opções milhas + dinheiro
    const itens = t.match(/(\d+)\s*\+\s*R\$\s?\d+\.\d{2}/g) || [];
    if (itens.length > 0) {
      linhas.push("Milhas + Dinheiro:");
      itens.forEach((v, idx) => {
        let [milhas, reais] = v.split("+");
        milhas = normalizarTexto(milhas);
        reais = normalizarTexto(reais);
        if (idx === 0) {
          linhas.push(`- ${milhas} milhas + ${reais} (Diamante / Clube Smiles) *`);
        } else {
          linhas.push(`- ${milhas} milhas + ${reais}`);
        }
      });
    }

    // Parcelamento (avulso)
    const parcela = /Em até 12x sem juros/i.test(t) ? "Parcelamento: até 12x sem juros" : "";

    return { bloco: linhas.join("\n").trim(), parcelamento: parcela };
  }

  function formatarColunaMoney(raw) {
    const t = normalizarTexto(raw);
    const money = t.match(/R\$\s?\d+\.\d{2}/);
    if (!money) return "";
    return `Tarifa em Dinheiro:\n- ${money[0]}`;
  }

  // Constrói o texto completo a partir das 4 colunas (quando existirem)
  function montarTudo(colVoo, colMilhas, colMix, colMoney) {
    const blocoVoo = formatarColunaVoo(colVoo || "");
    const blocoMilhas = formatarColunaMilhas(colMilhas || "");
    const mix = formatarColunaMix(colMix || "");
    const blocoMoney = formatarColunaMoney(colMoney || "") || ""; // pode não existir

    const partes = [
      blocoVoo,
      blocoMilhas ? `\n\n${blocoMilhas}` : "",
      mix.bloco ? `\n\n${mix.bloco}` : "",
      blocoMoney ? `\n\n${blocoMoney}` : "",
      mix.parcelamento ? `\n\n${mix.parcelamento}` : ""
    ];

    return partes.join("").trim();
  }

  // ============== UI (botões) ==============
  function criarBotoes(item) {
    if (item.querySelector(".copiar-controls")) return;

    const tds = item.querySelectorAll("td");
    const tdVoo = tds[0];
    if (!tdVoo) return; // sem a primeira coluna não faz sentido

    const controls = document.createElement("div");
    controls.className = "copiar-controls";
    controls.style.cssText = `
      display: flex;
      gap: 6px;
      margin: 6px 0 4px 0;
      flex-wrap: wrap;
    `;

    const btnAll = document.createElement("button");
    btnAll.textContent = "Copiar tudo";
    estilizarBotao(btnAll);

    const btnVoo = document.createElement("button");
    btnVoo.textContent = "Copiar voo";
    estilizarBotao(btnVoo);

    const btnMilhas = document.createElement("button");
    btnMilhas.textContent = "Copiar milhas";
    estilizarBotao(btnMilhas);

    const btnMix = document.createElement("button");
    btnMix.textContent = "Copiar milhas + R$";
    estilizarBotao(btnMix);

    controls.appendChild(btnAll);
    controls.appendChild(btnVoo);
    controls.appendChild(btnMilhas);
    controls.appendChild(btnMix);

    // Insere os botões no início da primeira coluna
    tdVoo.prepend(controls);

    // Habilita/Desabilita conforme disponibilidade das colunas
    const tdMilhas = tds[1];
    const tdMix = tds[2];

    if (!tdMilhas || !normalizarTexto(tdMilhas.textContent)) {
      desabilitar(btnMilhas);
    }
    if (!tdMix || !normalizarTexto(tdMix.textContent)) {
      desabilitar(btnMix);
    }

    // Handlers
    btnAll.onclick = () => {
      const colV = withHidden(controls, () => (tdVoo?.textContent || ""));
      const colM = tds[1]?.textContent || "";
      const colX = tds[2]?.textContent || "";
      const col$ = tds[3]?.textContent || ""; // pode não existir

      const texto = montarTudo(colV, colM, colX, col$);
      GM_setClipboard(texto);
      feedback(btnAll);
    };

    btnVoo.onclick = () => {
      const colV = withHidden(controls, () => (tdVoo?.textContent || ""));
      const texto = formatarColunaVoo(colV);
      GM_setClipboard(texto);
      feedback(btnVoo);
    };

    btnMilhas.onclick = () => {
      const colM = tds[1]?.textContent || "";
      const texto = formatarColunaMilhas(colM);
      GM_setClipboard(texto || "Sem tarifas em milhas disponíveis.");
      feedback(btnMilhas);
    };

    btnMix.onclick = () => {
      const colX = tds[2]?.textContent || "";
      const mix = formatarColunaMix(colX);
      const texto = [mix.bloco, mix.parcelamento].filter(Boolean).join("\n\n").trim();
      GM_setClipboard(texto || "Sem opções de milhas + dinheiro disponíveis.");
      feedback(btnMix);
    };
  }

  function estilizarBotao(btn) {
    btn.style.cssText = `
      padding: 4px 8px;
      background: #4a90e2;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
    `;
  }

  function desabilitar(btn) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  }

  function feedback(btn) {
    const old = btn.textContent;
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = old), 1200);
  }

  // ============== Observador da lista de voos ==============
  function aplicarBotoesVoos() {
    const linhas = document.querySelectorAll("tr.tr-flight-item, tr.tr-flight-item.ng-scope");
    linhas.forEach(criarBotoes);
  }

  /* ==========================================================
     PARTE 2 — RESUMO DE PAGAMENTO / OPÇÕES DE TAXA / CANCELAMENTO
  ========================================================== */

  let incluirMilhas = false;

  function parseTabelaFinal() {
    const tabela = document.querySelector(".table-pricing");
    if (!tabela) return null;

    const trs = tabela.querySelectorAll("tr");
    if (!trs.length) return null;

    const out = {
      itens: [],
      totalMilhas: 0,
      totalDinheiro: "R$ 0,00"
    };

    for (const tr of trs) {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 2) continue;

      const desc = norm(tds[0].textContent);

      // Detecta milhas totais da tabela (linha específica)
      if (desc.match(/milhas/i) && tds.length === 2) {
        out.totalMilhas = formatMilhas(tds[1].textContent);
        continue;
      }

      // TOTAL: geralmente 3 TDs (desc/milhas/dinheiro)
      if (desc.toUpperCase() === "TOTAL" && tds.length >= 3) {
        const milhas = tds[1].textContent;
        const dinheiro = tds[2].textContent;

        out.totalMilhas = formatMilhas(milhas);
        out.totalDinheiro = toBRL(dinheiro);
        continue;
      }

      // Itens normais
      const valor = toBRL(tds[tds.length - 1].textContent);
      out.itens.push({ desc, valor });
    }

    return out;
  }

  function formatarTabelaFinal(obj) {
    if (!obj) return "";

    const linhas = [];

    linhas.push("Resumo de Pagamento\n");

    if (incluirMilhas) {
      linhas.push(`Milhas: ${obj.totalMilhas}\n`);
    }

    for (const it of obj.itens) {
      linhas.push(`- ${it.desc}: ${it.valor}`);
    }

    linhas.push("\nTOTAL:");
    linhas.push(`- Milhas: ${obj.totalMilhas}`);
    linhas.push(`- Dinheiro: ${obj.totalDinheiro}`);

    return linhas.join("\n").trim();
  }

  function parseTaxas() {
    const cont = document.querySelector(".payment_ruller_container");
    if (!cont) return null;

    let txt = norm(cont.textContent);
    txt = txt.replace(/Como deseja pagar.*?dinheiro[:]?/i, "");

    const matches = txt.match(/\d[\d\.,]*(?:\s*milhas)?(?:\s*\+\s*R\$\s*[\d\.,]+)?|R\$\s*[\d\.,]+/gi);
    if (!matches) return null;

    const arr = [];

    for (let raw of matches) {
      raw = norm(raw);

      // Somente dinheiro (R$ xxx)
      if (/^R\$/i.test(raw) && !/milhas/i.test(raw)) {
        arr.push({ tipo: "money", texto: `Somente dinheiro: ${raw}` });
        continue;
      }

      // Somente milhas (número puro)
      if (/^\d+$/i.test(raw)) {
        arr.push({ tipo: "milhas", texto: `${Number(raw).toLocaleString("pt-BR")} milhas` });
        continue;
      }

      // Smiles & Money (milhas + R$)
      if (/milhas/i.test(raw) && /\+\s*R\$/i.test(raw)) {
        arr.push({ tipo: "smilesmoney", texto: `${raw}` });
      }
    }

    return arr.length ? arr : null;
  }

  function formatarTaxas(arr) {
    if (!arr) return "";

    const linhas = ["Opções de pagamento das taxas:\n"];

    for (const item of arr) {
      linhas.push(`- ${item.texto}`);
    }

    return linhas.join("\n").trim();
  }

  // ============== Botões internos (estilo Smiles) ==============
  function botaoEstiloSmiles(texto) {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block";
    btn.style.marginTop = "12px";
    btn.style.marginBottom = "20px";
    btn.textContent = texto;
    return btn;
  }

  function criarBotaoTabela() {
    const tabela = document.querySelector(".table-pricing");
    if (!tabela) return;

    if (document.getElementById("btn-copiar-valores")) return;

    const btn = botaoEstiloSmiles("Copiar valores");
    btn.id = "btn-copiar-valores";

    btn.onclick = () => {
      const parsed = parseTabelaFinal();
      GM_setClipboard(formatarTabelaFinal(parsed));
      btn.textContent = "Copiado!";
      setTimeout(() => (btn.textContent = "Copiar valores"), 1500);
    };

    tabela.insertAdjacentElement("afterend", btn);
  }

  function criarBotaoTaxas() {
    const cont = document.querySelector(".payment_ruller_container");
    if (!cont) return;

    if (document.getElementById("btn-copiar-taxas")) return;

    const btn = botaoEstiloSmiles("Copiar opções de taxa");
    btn.id = "btn-copiar-taxas";

    btn.onclick = () => {
      const arr = parseTaxas();
      GM_setClipboard(formatarTaxas(arr));
      btn.textContent = "Copiado!";
      setTimeout(() => (btn.textContent = "Copiar opções de taxa"), 1500);
    };

    cont.appendChild(btn);
  }

  function criarBotaoMilhas() {
    const cont = document.querySelector(".table-pricing-holder");
    if (!cont) return;

    if (document.getElementById("btn-milhas-toggle")) return;

    const btn = botaoEstiloSmiles(incluirMilhas ? "Milhas: ON" : "Milhas: OFF");
    btn.id = "btn-milhas-toggle";
    btn.style.display = 'none';

    btn.onclick = () => {
      incluirMilhas = !incluirMilhas;
      btn.textContent = incluirMilhas ? "Milhas: ON" : "Milhas: OFF";
    };

    cont.appendChild(btn);
  }

  /* ==========================================================
     CANCELAMENTO (/cancel-flight)
  ========================================================== */

  function paginaCancelFlight() {
    return location.href.includes("/cancel-flight");
  }

  function criarBotaoCancelamento() {
    if (!paginaCancelFlight()) return;
    if (document.getElementById("btn-copiar-reembolso")) return;

    const cont =
      document.querySelector(".cancel-summary") ||
      document.querySelector("#cancel-flight");

    if (!cont) return;

    const btn = document.createElement("button");
    btn.id = "btn-copiar-reembolso";
    btn.className = "btn btn-primary btn-block";
    btn.style.marginTop = "12px";
    btn.style.marginBottom = "20px";
    btn.textContent = "Copiar reembolso";

    btn.onclick = () => {
      GM_setClipboard(gerarResumoCancelamento());
      btn.textContent = "Copiado!";
      setTimeout(() => (btn.textContent = "Copiar reembolso"), 1500);
    };

    cont.appendChild(btn);
  }

  function gerarResumoCancelamento() {
    let milhasReembolso = 0;
    let dinheiroReembolso = "R$ 0,00";
    let taxasDetalhadas = [];
    let totalDetalhamento = 0;

    // 1) (Opcional futuramente) Capturar milhas a reembolsar se houver bloco específico
    // Ex.: milhasReembolso = ...

    // 2) Dinheiro a reembolsar (se houver texto específico em alguma área conhecida)
    // Mantém "R$ 0,00" por padrão para evitar falhas em DOMs variáveis.

    // 3) Tabela "Descrição x Valor" (cancel-summary) — excluir "Taxa gratuita"
    const tbl = document.querySelector(".cancel-summary");
    if (tbl) {
      const linhas = [...tbl.querySelectorAll("tr")];

      for (const tr of linhas) {
        const tds = tr.querySelectorAll("td");
        if (tds.length < 2) continue;

        const desc = tds[0].textContent.trim();
        const valRaw = tds[1].textContent.trim();

        if (/gratuita/i.test(desc)) continue;

        const isLinhaTotal = /\btotal\b/i.test(desc);
        const valBRL = toBRL(valRaw);

        const numeric = (() => {
          const cleaned = valRaw
            .replace(/\s/g, "")
            .replace(/[^0-9,.-]/g, "")
            .replace(/\.(?=\d{3}(,|$))/g, "")
            .replace(",", ".");
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        })();

        if (!isLinhaTotal && /taxa|conveni|cancel/i.test(desc)) {
          taxasDetalhadas.push({ desc, val: valBRL });
        }

        if (!isLinhaTotal && numeric > 0) {
          totalDetalhamento += numeric;
        }
      }
    }

    const totalFinalBRL =
      "R$ " +
      totalDetalhamento.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // 4) TEXTO FINAL (sem emojis)
    let txt = "";
    txt += "Resumo de Reembolso\n\n";
    txt += `- Milhas a reembolsar: ${milhasReembolso.toLocaleString("pt-BR")}\n`;
    txt += `- Dinheiro a reembolsar: ${dinheiroReembolso}\n\n`;

    if (taxasDetalhadas.length) {
      txt += "Detalhamento:\n\n";
      for (const t of taxasDetalhadas) {
        txt += `- ${t.desc}: ${t.val}\n`;
      }
      txt += `- Total: ${totalFinalBRL}\n\n`;
    } else {
      txt += "Nenhuma taxa adicional encontrada.\n\n";
    }

    txt += `Para continuarmos com o reembolso, será necessário realizar o pagamento de ${totalFinalBRL}`;

    return txt.trim();
  }

  /* ==========================================================
     OBSERVERS (Angular)
  ========================================================== */

  function init() {
    aplicarBotoesVoos();
    criarBotaoTabela();
    criarBotaoTaxas();
    criarBotaoMilhas();
  }

  new MutationObserver(init).observe(document.documentElement, {
    subtree: true,
    childList: true
  });

  function initCancelFlight() {
    if (!paginaCancelFlight()) return;
    criarBotaoCancelamento();
  }

  new MutationObserver(initCancelFlight).observe(document.documentElement, {
    subtree: true,
    childList: true,
  });

  // Inicial
  init();
  initCancelFlight();
})();
