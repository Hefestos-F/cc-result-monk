// ==UserScript==
// @name         Testes
// @namespace    https://github.com/Hefestos-F/cc-result-monk
// @version      1
// @description  that's all folks!
// @author       almaviva.fpsilva
// @match        https://www.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/EmTeste/testes.user.js
// @grant        GM_openInTab
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  function isVisible(el) {
    if (!el) return false;

    const style = getComputedStyle(el);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      el.getClientRects().length > 0
    );
  }

  const items = document.querySelectorAll(
    '[data-test-id="tabs-nav-item-users"]',
  );

  const visibleItem = [...items].find(isVisible);

  console.log(visibleItem ?? "Nenhum item visível encontrado");





  // ============================
// Configuração de Logging
// ============================
(function setupLoggingEnv() {
  // Prefixo padrão
  if (typeof window.PreFixo !== 'string') {
    window.PreFixo = '[APP]';
  }

  // DEBUG ligado/desligado (prioridade: localStorage -> global -> default)
  const lsDebug = (localStorage.getItem('app.debug') || '').toLowerCase();
  if (typeof window.DEBUG === 'undefined') {
    window.DEBUG = (lsDebug === 'true' || lsDebug === '1');
  }

  // Nível de log (prioridade: localStorage -> global -> default)
  const levels = ['silent', 'error', 'warn', 'info', 'debug', 'trace'];
  const lsLevel = (localStorage.getItem('app.logLevel') || '').toLowerCase();
  if (!levels.includes(lsLevel)) {
    // se não há em LS, reaproveita global ou define 'info' / 'debug' se DEBUG=true
    window.LOG_LEVEL = (typeof window.LOG_LEVEL === 'string' && levels.includes(window.LOG_LEVEL))
      ? window.LOG_LEVEL
      : (window.DEBUG ? 'debug' : 'info');
  } else {
    window.LOG_LEVEL = lsLevel;
  }

  // Helper para verificar se determinado nível deve logar
  const levelIndex = (lvl) => levels.indexOf(lvl);
  const canLog = (lvl) => levelIndex(lvl) <= levelIndex(window.LOG_LEVEL);

  // Wrappers de log com prefixo e checagem de nível
  window.Herror = function (...args) {
    if (canLog('error')) console.error(window.PreFixo, ...args);
  };
  window.Hwarn = function (...args) {
    if (canLog('warn')) console.warn(window.PreFixo, ...args);
  };
  window.Hinfo = function (...args) {
    if (canLog('info')) console.info(window.PreFixo, ...args);
  };
  window.Hdebug = function (...args) {
    if (window.DEBUG && canLog('debug')) console.debug(window.PreFixo, ...args);
  };
  // Hlog atua como 'info' por padrão, mantendo compatibilidade com seu uso anterior
  window.Hlog = function (...args) {
    if (canLog('info')) console.log(window.PreFixo, ...args);
  };
  // Htrace para rastreamento fino quando necessário
  window.Htrace = function (...args) {
    if (window.DEBUG && canLog('trace')) {
      // Inclui stack raso para depuração
      try {
        const err = new Error();
        console.debug(window.PreFixo, ...args, '\nTRACE:', err.stack?.split('\n').slice(0, 3).join('\n'));
      } catch {
        console.debug(window.PreFixo, ...args);
      }
    }
  };

  Hdebug('Logging configurado:', { DEBUG: window.DEBUG, LOG_LEVEL: window.LOG_LEVEL, PreFixo: window.PreFixo });
})();

// ============================
// Funções utilitárias seguras
// ============================

function safeConverterParaSegundos(valor) {
  try {
    const s = (typeof converterParaSegundos === 'function') ? converterParaSegundos(valor) : NaN;
    return Number.isFinite(s) ? s : 0;
  } catch (e) {
    Hwarn('converterParaSegundos falhou para', valor, e);
    return 0;
  }
}

function safeConverterParaTempo(seg) {
  try {
    if (typeof converterParaTempo === 'function') {
      return converterParaTempo(seg);
    }
  } catch (e) {
    Hwarn('converterParaTempo falhou para', seg, e);
  }
  // fallback simples HH:MM:SS
  const s = Math.max(0, seg | 0);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function safeUltimoDisponivel(item) {
  if (typeof UltimoDisponivel !== 'function') return;
  try {
    UltimoDisponivel(item);
  } catch (e) {
    Hwarn('UltimoDisponivel lançou erro', e, 'item:', item);
  }
}

function setTempoPausasCampo(campo, valor) {
  try {
    if (typeof TempoPausas === 'object' && TempoPausas !== null) {
      TempoPausas[campo] = valor;
    }
  } catch (e) {
    Hwarn('Falhou ao setar TempoPausas.' + campo, e);
  }
}

// ============================
// Soma de Durações (com debug)
// ============================
/* Soma as durações do array (campo "duracao") em UMA passada.
 * - Atualiza TempoPausas (se existir).
 * - Retorna um objeto com valores em segundos e em texto (HH:MM:SS).
 * - Emite logs detalhados quando DEBUG/logLevel permitem.
 */
function somarDuracoesGeral() {
  const t0 = performance.now?.() ?? Date.now();
  const tituloGrupo = `${PreFixo} somarDuracoesGeral()`;

  if (console.groupCollapsed && (DEBUG || LOG_LEVEL !== 'silent')) {
    console.groupCollapsed(tituloGrupo);
  }

  try {
    // Normaliza entrada
    const arr = Array.isArray(window.dadosdePausas) ? window.dadosdePausas : [];
    Hdebug('Entrada normalizada', { itens: arr.length });

    if (!Array.isArray(window.dadosdePausas)) {
      Hwarn('dadosdePausas não era Array; normalizado para []. Valor original:', window.dadosdePausas);
    }

    if (arr.length === 0) {
      Hinfo('Array de pausas vazio. Retornando todos os tempos zerados.');
      const vazio = {
        trabalhandoSeg: 0,
        disponivelSeg: 0,
        indisponivelSeg: 0,
        onlineSeg: 0,
        trabalhandoTxt: safeConverterParaTempo(0),
        disponivelTxt: safeConverterParaTempo(0),
        indisponivelTxt: safeConverterParaTempo(0),
        onlineTxt: safeConverterParaTempo(0),
      };

      // Atualiza TempoPausas, se existir
      setTempoPausasCampo('Trabalhando', vazio.trabalhandoTxt);
      setTempoPausasCampo('Disponivel', vazio.disponivelTxt);
      setTempoPausasCampo('Indisponivel', vazio.indisponivelTxt);
      setTempoPausasCampo('Online', vazio.onlineTxt);

      const t1 = performance.now?.() ?? Date.now();
      Hdebug('Finalizou (vazio) em', (t1 - t0).toFixed(2), 'ms');
      return vazio;
    }

    // Acumuladores
    let totalTrabalhandoSeg = 0;
    let totalDisponivelSeg = 0;
    let totalIndisponivelSeg = 0;

    // Zera contadores conhecidos em TempoPausas (se existir)
    try {
      if (typeof TempoPausas === 'object' && TempoPausas !== null) {
        TempoPausas.Atendidas = 0;
      }
    } catch (e) {
      Hwarn('Não foi possível resetar TempoPausas.Atendidas', e);
    }

    // Debug: tabela dos itens válidos/ignorados
    const linhasTabela = [];

    for (const item of arr) {
      if (item?.id === 0) {
        Htrace('Ignorando item com id=0', item);
        linhasTabela.push({ id: item?.id, pausa: item?.pausa, duracao: item?.duracao, status: 'IGNORADO' });
        continue;
      }

      const seg = safeConverterParaSegundos(item?.duracao);
      const pausa = item?.pausa || 'Indefinida';

      if (pausa === 'Trabalhando') {
        totalTrabalhandoSeg += seg;
        try {
          if (typeof TempoPausas === 'object' && TempoPausas !== null) {
            TempoPausas.Atendidas = (TempoPausas.Atendidas | 0) + 1;
          }
        } catch (e) {
          Hwarn('Falha ao incrementar TempoPausas.Atendidas', e);
        }
      } else if (pausa === 'Disponível') {
        safeUltimoDisponivel(item);
        totalDisponivelSeg += seg;
      } else {
        // Tudo o que não for "Trabalhando" ou "Disponível" será "Indisponível"
        totalIndisponivelSeg += seg;
      }

      if (DEBUG) {
        console.count?.('Itens processados');
      }

      linhasTabela.push({
        id: item?.id,
        pausa: pausa,
        duracao: item?.duracao,
        segProcessados: seg,
        classif: (pausa === 'Trabalhando') ? 'TRAB' : (pausa === 'Disponível') ? 'DISP' : 'INDISP'
      });
    }

    if (linhasTabela.length && console.table && DEBUG) {
      console.table(linhasTabela);
    }

    const onlineSeg = totalTrabalhandoSeg + totalDisponivelSeg + totalIndisponivelSeg;

    const result = {
      trabalhandoSeg: totalTrabalhandoSeg,
      disponivelSeg: totalDisponivelSeg,
      indisponivelSeg: totalIndisponivelSeg,
      onlineSeg,
      trabalhandoTxt: safeConverterParaTempo(totalTrabalhandoSeg),
      disponivelTxt: safeConverterParaTempo(totalDisponivelSeg),
      indisponivelTxt: safeConverterParaTempo(totalIndisponivelSeg),
      onlineTxt: safeConverterParaTempo(onlineSeg),
    };

    Hdebug('Acumulados (seg)', {
      trabalhandoSeg: totalTrabalhandoSeg,
      disponivelSeg: totalDisponivelSeg,
      indisponivelSeg: totalIndisponivelSeg,
      onlineSeg,
    });
    Hdebug('Acumulados (txt)', {
      trabalhandoTxt: result.trabalhandoTxt,
      disponivelTxt: result.disponivelTxt,
      indisponivelTxt: result.indisponivelTxt,
      onlineTxt: result.onlineTxt,
    });

    // Atualiza objeto global, se existir
    setTempoPausasCampo('Trabalhando', result.trabalhandoTxt);
    setTempoPausasCampo('Disponivel', result.disponivelTxt);
    setTempoPausasCampo('Indisponivel', result.indisponivelTxt);
    setTempoPausasCampo('Online', result.onlineTxt);

    const t1 = performance.now?.() ?? Date.now();
    Hinfo('somarDuracoesGeral concluída em', (t1 - t0).toFixed(2), 'ms');

    return result;
  } catch (err) {
    Herror('Erro em somarDuracoesGeral:', err);
    // Em erro, retornar objeto seguro
    const fallback = {
      trabalhandoSeg: 0,
      disponivelSeg: 0,
      indisponivelSeg: 0,
      onlineSeg: 0,
      trabalhandoTxt: safeConverterParaTempo(0),
      disponivelTxt: safeConverterParaTempo(0),
      indisponivelTxt: safeConverterParaTempo(0),
      onlineTxt: safeConverterParaTempo(0),
    };
    return fallback;
  } finally {
    if (console.groupEnd && (DEBUG || LOG_LEVEL !== 'silent')) {
      console.groupEnd();
    }
  }
}

})();
