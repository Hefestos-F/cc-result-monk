
    // ===== Util =====
    const $ = (sel, el=document) => el.querySelector(sel);
    const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
    const toastWrap = $('#toasts');
    function toast(msg, type='ok', timeout=2800){
      const t = document.createElement('div');
      t.className = 'toast ' + (type==='ok'?'ok':(type==='err'?'err':'')); 
      t.textContent = msg;
      toastWrap.appendChild(t);
      setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 250); }, timeout);
    }
    async function apiGet(path){
      const r = await fetch(path, {headers:{'Accept':'application/json'}});
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    }
    async function apiPost(path, body={}){
      const r = await fetch(path, {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify(body)
      });
      if(!r.ok){
        let j; try{ j = await r.json(); }catch{}
        throw new Error(j?.msg || ('HTTP '+r.status));
      }
      return r.json();
    }
    function fmtPct(v){ return `${Math.round(v)}%`; }
    function fmtC(v){ return `${Number(v).toFixed(1)} °C`; }
    function fmtMs(ms){
      if (ms<1000) return ms+'ms';
      const s = Math.floor(ms/1000), m=Math.floor(s/60), h=Math.floor(m/60);
      if (h>0) return `${h}h ${m%60}m`;
      if (m>0) return `${m}m ${s%60}s`;
      return `${s}s`;
    }
    function setLoading(btn, on=true){
      if (!btn) return;
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.disabled = on;
      btn.textContent = on ? 'Aguarde…' : btn.dataset.label;
    }

    // ===== Tema =====
    const themeBtns = { auto: $('#themeAuto'), light: $('#themeLight'), dark: $('#themeDark') };
    function applyTheme(mode){
      document.documentElement.setAttribute('data-theme', mode);
      Object.values(themeBtns).forEach(b=>b.classList.remove('active'));
      if(mode==='auto') themeBtns.auto.classList.add('active');
      if(mode==='light') themeBtns.light.classList.add('active');
      if(mode==='dark') themeBtns.dark.classList.add('active');
      localStorage.setItem('themeMode', mode);
    }
    themeBtns.auto.addEventListener('click', async ()=>{ applyTheme('auto'); try{ await apiPost('/api/theme',{mode:'auto'});}catch(e){/* optional */} });
    themeBtns.light.addEventListener('click', async ()=>{ applyTheme('light'); try{ await apiPost('/api/theme',{mode:'light'});}catch(e){} });
    themeBtns.dark.addEventListener('click',  async ()=>{ applyTheme('dark');  try{ await apiPost('/api/theme',{mode:'dark'});}catch(e){} });

    // ===== WebSocket =====
    let ws, wsTimer, lastStatus = {};
    function wsConnect(){
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/ws`);
      ws.addEventListener('open', ()=> { /* connected */ });
      ws.addEventListener('close', ()=> { clearTimeout(wsTimer); wsTimer = setTimeout(wsConnect, 1500); });
      ws.addEventListener('message', onWSMsg);
    }
    function onWSMsg(ev){
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'status') updateStatus(msg);
        if (msg.type === 'wifi') updateWifi(msg);
        if (msg.type === 'ack') handleAck(msg);
        if (msg.type === 'error'){ toast(msg.msg || 'Erro', 'err'); }
        if (msg.type === 'log') { appendLog(msg.line || ''); }
      } catch(e){}
    }

    // ===== Status & UI =====
    const rpmVal = $('#rpmVal'), tempVal = $('#tempVal'), humVal = $('#humVal'), pwmVal = $('#pwmVal');
    const modeText = $('#modeText'), modeBadge = $('#modeBadge'), btnMode = $('#btnMode');
    const pwmRange = $('#pwmRange'), pwmRangeVal = $('#pwmRangeVal');
    const uptimeText = $('#uptimeText'), alertState = $('#alertState'), badgeSim = $('#badgeSim');

    function updateStatus(s){
      lastStatus = s;
      if (typeof s.rpm === 'number') rpmVal.textContent = Math.round(s.rpm);
      if (typeof s.temp === 'number') tempVal.textContent = fmtC(s.temp);
      if (typeof s.hum === 'number') humVal.textContent = Math.round(s.hum) + ' %';
      if (typeof s.pwm === 'number') { pwmVal.textContent = Math.round(s.pwm) + ' %'; if(pwmRange.disabled===false) pwmRange.value = Math.round(s.pwm), pwmRangeVal.textContent = Math.round(s.pwm)+'%'; }
      if (s.mode){ modeText.textContent = s.mode.toUpperCase(); btnMode.textContent = 'Modo: '+(s.mode==='auto'?'Automático':'Manual'); pwmRange.disabled = (s.mode !== 'manual'); }
      if (typeof s.alertsActive !== 'undefined'){ alertState.textContent = s.alertsActive ? 'Ativo' : 'Inativo'; }
      if (typeof s.uptime !== 'undefined'){ uptimeText.textContent = fmtMs(s.uptime); }
      if (typeof s.simulated !== 'undefined'){ badgeSim.style.display = s.simulated ? '' : 'none'; }
    }
    function handleAck(a){
      // Opcional: usar chave 'for' para feedbacks específicos
      toast('OK: ' + (a.for || 'ação concluída'), 'ok');
    }

    // ===== Cabeçalho: Wifi & Alerta Geral =====
    const wifiDot = $('#wifiDot'), wifiLabel = $('#wifiLabel'), wifiConnState = $('#wifiConnState'), wifiIP = $('#wifiIP'), wifiRSSI = $('#wifiRSSI');
    const wifiStaStatus = $('#wifiStaStatus'), wifiApStatus = $('#wifiApStatus');
    function updateWifi(w){
      if (typeof w.connected !== 'undefined'){
        wifiDot.classList.toggle('ok', !!w.connected);
        wifiLabel.textContent = w.connected ? 'Wi‑Fi ✓' : 'Wi‑Fi ✗';
        wifiConnState.value = w.connected ? 'Conectado' : 'Desconectado';
      }
      if (w.ip) wifiIP.value = w.ip;
      if (typeof w.rssi !== 'undefined') wifiRSSI.value = w.rssi + ' dBm';
      if (w.testing){ wifiStaStatus.textContent = 'Testando conexão…'; }
      if (typeof w.ap !== 'undefined'){
        wifiApStatus.textContent = w.ap.enabled ? ('AP ativo em ' + (w.ap.ip||'')) : 'AP desativado';
      }
    }

    const toggleAlertGlobal = $('#toggleAlertGlobal');
    toggleAlertGlobal.addEventListener('change', async (e)=>{
      try{
        await apiPost('/api/alerts/global', { enabled: e.target.checked });
        toast('Alerta geral ' + (e.target.checked ? 'ativado' : 'desativado'));
      }catch(err){
        e.target.checked = !e.target.checked;
        toast(err.message || 'Falha ao alterar alerta geral', 'err');
      }
    });

    // ===== Botões principais =====
    btnMode.addEventListener('click', async ()=>{
      const next = (lastStatus.mode === 'manual') ? 'auto' : 'manual';
      try {
        await apiPost('/api/control/mode', { mode: next });
        // UI será atualizada pelo WS status/ack; fallback:
        btnMode.textContent = 'Modo: ' + (next==='auto'?'Automático':'Manual');
        pwmRange.disabled = (next !== 'manual');
      } catch(err){
        toast(err.message || 'Falha ao mudar modo', 'err');
      }
    });
    pwmRange.addEventListener('input', ()=> { pwmRangeVal.textContent = pwmRange.value + '%'; });
    pwmRange.addEventListener('change', async ()=>{
      try{
        await apiPost('/api/control/pwm', { duty: Number(pwmRange.value) });
      }catch(err){
        toast(err.message || 'Falha ao ajustar PWM', 'err');
      }
    });

    // ===== Modal/Tabs =====
    const settingsModal = $('#settingsModal');
    const btnSettings = $('#btnSettings'), btnCloseSettings = $('#btnCloseSettings');
    const tabs = $$('.tabs [data-tab]');
    function openSettings(tabId){
      settingsModal.classList.add('open');
      setActiveTab(tabId || 'tabWifi');
    }
    function closeSettings(){ settingsModal.classList.remove('open'); }
    function setActiveTab(id){
      tabs.forEach(b=> b.classList.toggle('active', b.dataset.tab===id));
      $$('.tab-panel').forEach(p=> p.classList.remove('active'));
      const panel = document.getElementById(id);
      if (panel) panel.classList.add('active');
    }
    btnSettings.addEventListener('click', ()=> openSettings('tabWifi'));
    btnCloseSettings.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e)=> { if (e.target === settingsModal) closeSettings(); });
    tabs.forEach(b=> b.addEventListener('click', ()=> setActiveTab(b.dataset.tab)));
    // Ícone Wi‑Fi abre já em Wi‑Fi
    $('#btnWifiDiag').addEventListener('click', async ()=>{
      openSettings('tabWifi');
      try{ const s = await apiGet('/api/wifi/state'); updateWifi(s); }catch{}
    });

    // ===== Wi‑Fi: STA/AP/Scan =====
    const staSsid = $('#staSsid'), staPass = $('#staPass'), btnSaveSTA = $('#btnSaveSTA'), btnScan = $('#btnScan'), scanList = $('#scanList');
    btnSaveSTA.addEventListener('click', async ()=>{
      if (!staSsid.value){ toast('Informe o SSID', 'err'); return; }
      setLoading(btnSaveSTA, true);
      try{
        const r = await apiPost('/api/wifi/sta', { ssid: staSsid.value, pass: staPass.value });
        wifiStaStatus.textContent = 'Teste iniciado…';
        toast('Salvo. Testando conexão…');
      }catch(err){ toast(err.message || 'Falha ao salvar/testar STA', 'err'); }
      setLoading(btnSaveSTA, false);
    });
    btnScan.addEventListener('click', async ()=>{
      scanList.textContent = 'Escaneando…';
      try{
        const arr = await apiGet('/api/wifi/scan');
        scanList.textContent = '';
        arr.forEach(n=>{
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.textContent = `${n.ssid} (${n.rssi} dBm)`;
          chip.title = 'Clique para preencher SSID';
          chip.style.cursor = 'pointer';
          chip.addEventListener('click', ()=> { staSsid.value = n.ssid; toast('SSID preenchido: '+n.ssid); });
          scanList.appendChild(chip);
        });
        if (!arr.length){ scanList.textContent = 'Nenhuma rede encontrada'; }
      }catch(err){ scanList.textContent = ''; toast('Falha no scan', 'err'); }
    });

    const apSsid = $('#apSsid'), apPass = $('#apPass'), btnSaveAP = $('#btnSaveAP');
    btnSaveAP.addEventListener('click', async ()=>{
      if (!apSsid.value){ toast('Informe o SSID do AP', 'err'); return; }
      if ((apPass.value||'').length < 8){ toast('Senha do AP deve ter 8+ caracteres', 'err'); return; }
      setLoading(btnSaveAP, true);
      try{
        const r = await apiPost('/api/wifi/ap', { ssid: apSsid.value, pass: apPass.value });
        wifiApStatus.textContent = r?.ap?.ip ? ('AP ativo em ' + r.ap.ip) : 'AP atualizado';
        toast('AP salvo');
      }catch(err){ toast(err.message || 'Falha ao salvar AP', 'err'); }
      setLoading(btnSaveAP, false);
    });

    // ===== Alertas: Ações / Flags / Params =====
    const actRpmMsg=$('#actRpmMsg'), actRpmBip=$('#actRpmBip'), actRpmLed=$('#actRpmLed');
    const actTempMsg=$('#actTempMsg'), actTempBip=$('#actTempBip'), actTempLed=$('#actTempLed');
    const repeatMs = $('#repeatMs');
    $('#btnSaveActions').addEventListener('click', async ()=>{
      try{
        await apiPost('/api/alerts/actions', {
          rpm: { msg: actRpmMsg.checked, bip: actRpmBip.checked, led: actRpmLed.checked },
          temp:{ msg: actTempMsg.checked, bip: actTempBip.checked, led: actTempLed.checked }
        });
        toast('Ações salvas');
      }catch(err){ toast(err.message || 'Falha ao salvar ações', 'err'); }
    });

    const flagRpmErr=$('#flagRpmErr'), flagRpmRange=$('#flagRpmRange'), flagTempErr=$('#flagTempErr'), flagTempRange=$('#flagTempRange');
    $('#btnSaveFlags').addEventListener('click', async ()=>{
      try{
        await apiPost('/api/alerts/flags', {
          rpm: { sensorErr: flagRpmErr.checked, range: flagRpmRange.checked },
          temp:{ sensorErr: flagTempErr.checked, range: flagTempRange.checked }
        });
        toast('Flags salvas');
      }catch(err){ toast(err.message || 'Falha ao salvar flags', 'err'); }
    });

    const rpmMin=$('#rpmMin'), rpmMax=$('#rpmMax'), tMin=$('#tMin'), tMax=$('#tMax');
    $('#btnSaveParams').addEventListener('click', async ()=>{
      const rmin=Number(rpmMin.value), rmax=Number(rpmMax.value), Tmin=Number(tMin.value), Tmax=Number(tMax.value), rep=Number(repeatMs.value||0);
      if (!(rmin < rmax)) { toast('RPM: mínimo deve ser menor que máximo', 'err'); return; }
      if (!(Tmin < Tmax)) { toast('Temp: mínimo deve ser menor que máximo', 'err'); return; }
      try{
        await apiPost('/api/alerts/params', {
          rpm:{min:rmin,max:rmax}, temp:{min:Tmin,max:Tmax}, repeatMs:rep
        });
        toast('Parâmetros salvos');
      }catch(err){ toast(err.message || 'Falha ao salvar parâmetros', 'err'); }
    });

    // ===== Avançado: Simulação / Testes / Flags & Debug / Logs =====
    const simEnable=$('#simEnable'), simRpm=$('#simRpm'), simTemp=$('#simTemp'), simHum=$('#simHum');
    $('#btnSaveSim').addEventListener('click', async ()=>{
      try{
        await apiPost('/api/sim', {
          enabled: simEnable.checked,
          rpm: Number(simRpm.value), temp: Number(simTemp.value), hum: Number(simHum.value)
        });
        badgeSim.style.display = simEnable.checked ? '' : 'none';
        toast('Simulação atualizada');
      }catch(err){ toast(err.message || 'Falha ao salvar simulação', 'err'); }
    });

    const testBip=$('#testBip'), testLed=$('#testLed');
    testBip.addEventListener('change', async ()=>{
      try{ await apiPost('/api/alerts/test', { buzzer: testBip.checked }); toast('Bip '+(testBip.checked?'ON':'OFF')); }
      catch(e){ testBip.checked=!testBip.checked; toast('Falha ao testar buzzer', 'err'); }
    });
    testLed.addEventListener('change', async ()=>{
      try{ await apiPost('/api/alerts/test', { led: testLed.checked }); toast('LED '+(testLed.checked?'ON':'OFF')); }
      catch(e){ testLed.checked=!testLed.checked; toast('Falha ao testar LED', 'err'); }
    });

    const fMonTempHumErr=$('#fMonTempHumErr'), fMonRpmErr=$('#fMonRpmErr'), fDebug=$('#fDebug');
    $('#btnSaveFlagsAdv').addEventListener('click', async ()=>{
      try{
        await apiPost('/api/flags', {
          monTempHumErr: fMonTempHumErr.checked,
          monRpmErr: fMonRpmErr.checked,
          debug: fDebug.checked
        });
        toast('Flags/Debug salvos');
      }catch(err){ toast(err.message || 'Falha ao salvar flags/debug', 'err'); }
    });

    const logView = $('#logView');
    function appendLog(line){
      if (logView.textContent === '—') logView.textContent = '';
      logView.textContent += (line.endsWith('\n')?line:(line+'\n'));
      logView.scrollTop = logView.scrollHeight;
    }
    $('#btnViewLog').addEventListener('click', async ()=>{
      logView.textContent = 'Carregando…';
      try{
        const j = await apiGet('/api/debug/log?offset=0&limit=2048');
        logView.textContent = j?.data || '(vazio)';
      }catch(err){
        logView.textContent = 'Falha ao carregar log';
        toast('Erro ao carregar log', 'err');
      }
    });
    $('#btnSaveLog').addEventListener('click', async ()=>{
      try{
        const r = await fetch('/api/debug/log/save', { method:'POST' });
        if (!r.ok) throw new Error('HTTP '+r.status);
        const blob = await r.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'debug-log.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Log salvo');
      }catch(err){ toast('Falha ao salvar log', 'err'); }
    });

    // ===== Sistema: Senha / Pinos / Reset =====
    const sysUser=$('#sysUser'), sysOld=$('#sysOld'), sysNew=$('#sysNew'), sysNew2=$('#sysNew2');
    $('#btnChangePass').addEventListener('click', async ()=>{
      if (!sysNew.value || sysNew.value !== sysNew2.value){ toast('Nova senha e confirmação devem coincidir', 'err'); return; }
      try{
        await apiPost('/api/system/pass', { user: sysUser.value, oldPass: sysOld.value, newPass: sysNew.value });
        sysOld.value = sysNew.value = sysNew2.value = '';
        toast('Senha alterada com sucesso');
      }catch(err){ toast(err.message || 'Falha ao alterar senha', 'err'); }
    });

    const pinRpm=$('#pinRpm'), pinDht=$('#pinDht'), pinPwm=$('#pinPwm'), pinLed=$('#pinLed'), pinBuz=$('#pinBuz'), pinBtn=$('#pinBtn'), pinWifiLed=$('#pinWifiLed');
    $('#btnSavePins').addEventListener('click', async ()=>{
      const body = {
        rpm: Number(pinRpm.value), dht: Number(pinDht.value), pwm: Number(pinPwm.value),
        led: Number(pinLed.value), buzzer: Number(pinBuz.value), alert_btn: Number(pinBtn.value), wifi_led: Number(pinWifiLed.value)
      };
      try{
        await apiPost('/api/pins', body);
        toast('Pinos salvos');
      }catch(err){ toast(err.message || 'Falha ao salvar pinos', 'err'); }
    });

    const confirmReset=$('#confirmReset'), btnReset=$('#btnReset'), resetInfo=$('#resetInfo');
    btnReset.addEventListener('click', async ()=>{
      if ((confirmReset.value||'').trim() !== 'RESET'){ toast('Digite "RESET" para confirmar', 'err'); return; }
      setLoading(btnReset, true);
      try{
        const r = await apiPost('/api/reset-defaults', { confirm: 'RESET' });
        toast('Restaurando e reiniciando...');
        let s = 15;
        resetInfo.textContent = `Reiniciando em ~${s}s...`;
        const iv = setInterval(()=>{ s--; resetInfo.textContent = `Reiniciando em ~${s}s...`; if (s<=0){ clearInterval(iv); resetInfo.textContent = 'Tente reconectar ao dispositivo.'; } }, 1000);
      }catch(err){ toast(err.message || 'Falha ao restaurar', 'err'); }
      setLoading(btnReset, false);
    });

    // ===== Inicialização =====
    (async function init(){
      // Tema armazenado
      applyTheme(localStorage.getItem('themeMode') || 'auto');

      wsConnect();

      // Carregar estado inicial (opcional, antes do WS chegar)
      try {
        const st = await apiGet('/api/status'); updateStatus(st);
      } catch(e) {}

      try {
        const wf = await apiGet('/api/wifi/state'); updateWifi(wf);
      } catch(e) {}
    })();
