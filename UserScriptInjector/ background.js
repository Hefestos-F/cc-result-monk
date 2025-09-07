// background.js

// Cache simples por aba/URL para evitar reinjeções repetidas
const injectedByTab = new Map();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status !== 'complete' || !tab?.url) return;
    await tryInject(tabId, tab.url, { force: false });
  } catch (err) {
    console.error('[UserScript Injector] Falha no onUpdated:', err);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => injectedByTab.delete(tabId));

// Permite "Executar agora" via popup (opcional)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'injectNow') {
    (async () => {
      try {
        const tabId = msg.tabId || sender?.tab?.id;
        if (!tabId) return sendResponse({ ok: false, reason: 'no-tab' });
        const tab = await chrome.tabs.get(tabId);
        const url = tab?.url;
        if (!url) return sendResponse({ ok: false, reason: 'no-url' });

        const result = await tryInject(tabId, url, { force: true }); // ignora toggle e cache
        sendResponse(result);
      } catch (e) {
        console.error('[UserScript Injector] injectNow erro:', e);
        sendResponse({ ok: false, reason: 'exception' });
      }
    })();
    return true; // resposta assíncrona
  }
});

/**
 * Tenta injetar o user script na aba/URL.
 * @param {number} tabId
 * @param {string} url
 * @param {{force?: boolean}} options - force ignora autoInjectEnabled e cache.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function tryInject(tabId, url, { force = false } = {}) {
  const { autoInjectEnabled = true, userScript = '' } = await chrome.storage.local.get([
    'autoInjectEnabled',
    'userScript'
  ]);

  if (!force && !autoInjectEnabled) return { ok: false, reason: 'disabled' };

  const code = (userScript || '').trim();
  if (!code) return { ok: false, reason: 'empty-script' };

  const destinations = parseDestinations(code);
  if (destinations.length === 0) return { ok: false, reason: 'no-destino' };

  if (!urlMatchesAny(url, destinations)) return { ok: false, reason: 'no-match' };

  if (!force && injectedByTab.get(tabId) === url) return { ok: false, reason: 'already-injected' };

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      // Executa no page world anexando <script> (compatível e seguro em MV3)
      func: injectUserScriptViaScriptTag,
      args: [code]
      // Em Chrome recente, você também pode usar:
      // world: 'MAIN'
    });
    injectedByTab.set(tabId, url);
    return { ok: true };
  } catch (e) {
    console.error('[UserScript Injector] Erro ao injetar:', e);
    return { ok: false, reason: 'execute-failed' };
  }
}

/* ====== Utilidades: parsing e matching de @destino ====== */

/**
 * Lê todas as linhas @destino do cabeçalho do user script.
 * Suporta múltiplas linhas e separação por espaço/vírgula.
 */
function parseDestinations(script) {
  const patterns = [];
  const re = /@destino\s+([^\r\n]+)/gi; // case-insensitive
  let m;
  while ((m = re.exec(script)) !== null) {
    const line = (m[1] || '').trim();
    if (!line) continue;
    line.split(/[\s,]+/).forEach((raw) => {
      const p = normalizePattern(raw);
      if (p) patterns.push(p);
    });
  }
  return patterns;
}

function normalizePattern(raw) {
  let s = (raw || '').trim().replace(/^["']|["']$/g, '');
  if (!s) return '';

  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-z*]+:\/\//i.test(s)) s = '*://' + s;

  if (!/\/.*$/.test(s)) s = s + '/*';
  else if (/\/$/.test(s)) s = s + '*';

  return s;
}

function urlMatchesAny(url, patterns) {
  try {
    const u = new URL(url);
    return patterns.some((p) => matchUrl(u, p));
  } catch {
    return false;
  }
}

function matchUrl(u, pattern) {
  const m = pattern.match(/^([a-z*]+):\/\/([^/]*)(\/.*)$/i);
  if (!m) return false;

  const schemePat = m[1].toLowerCase();
  const hostPat = m[2];
  const pathPat = m[3];

  // Esquema
  if (schemePat === 'http' || schemePat === 'https') {
    if (u.protocol !== schemePat + ':') return false;
  } else if (schemePat === '*') {
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  } else if (schemePat === 'file') {
    if (u.protocol !== 'file:') return false;
  } else {
    return false;
  }

  // Host
  if (!hostMatches(u.hostname, hostPat)) return false;

  // Path (pathname+query+hash)
  if (!pathMatches(u.pathname + u.search + u.hash, pathPat)) return false;

  return true;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hostMatches(host, hostPat) {
  if ((hostPat === '' || hostPat === undefined) && host === '') return true;
  if (hostPat === '*' || hostPat === '*:*') return true;

  // "*.dominio.com" => inclui base sem subdomínio
  let regexStr;
  if (hostPat.startsWith('*.')) {
    const base = hostPat.slice(2);
    regexStr = `^(?:.*\\.)?${escapeRegex(base).replace(/\\\*/g, '.*')}$`;
  } else {
    regexStr = `^${escapeRegex(hostPat).replace(/\\\*/g, '.*')}$`;
  }

  return new RegExp(regexStr, 'i').test(host);
}

function pathMatches(pathQH, pathPat) {
  return new RegExp('^' + escapeRegex(pathPat).replace(/\\\*/g, '.*') + '$').test(pathQH);
}

/**
 * Executa o código no contexto da PÁGINA via <script>.
 */
function injectUserScriptViaScriptTag(code) {
  try {
    const s = document.createElement('script');
    s.textContent = code + '\n//# sourceURL=userscript.injected.js';
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  } catch (e) {
    console.error('[UserScript Injector] Erro ao anexar <script>:', e);
  }
}
