// =====================================
// PREMIUM WEB AUDIO PLAYER
// =====================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const asCofMus = {
  stopMusic: false,
  repetirMusic: true,
  osciladoresAtivos: [],
};

// =====================================
// REVERB
// =====================================
function criarReverb(segundos = 2.5) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * segundos;
  const impulse = audioCtx.createBuffer(2, length, sampleRate);

  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  return impulse;
}

const reverb = audioCtx.createConvolver();
reverb.buffer = criarReverb(2.8);
reverb.connect(audioCtx.destination);

// =====================================
// BPM
// =====================================
function notaParaMs(valor, bpm) {
  return (60000 / bpm) * valor;
}

// =====================================
// TOCAR MÚSICA
// =====================================
async function tocarMusica(musica) {
  asCofMus.stopMusic = false;
  await audioCtx.resume();

  const bpm = musica.config.bpm || 120;

  for (const [notaTexto, valor] of musica.notas) {
    if (asCofMus.stopMusic) {
      console.log("Música interrompida");
      return;
    }

    const duracao = notaParaMs(valor, bpm);

    if (notaTexto === "PAUSA") {
      await new Promise((r) => setTimeout(r, duracao));
      continue;
    }

    const notas = notaTexto.split("+");
    notas.forEach((nota) => {
      const freq = musica.config.frequencias[nota];
      if (!freq) return;
      tocarNotaPremium(freq, duracao, musica.config);
    });

    await new Promise((r) => setTimeout(r, duracao));
  }

  if (asCofMus.repetirMusic && !asCofMus.stopMusic) {
    return tocarMusica(musica);
  }
  console.log("Fim da música");
}

// =====================================
// NOTA PREMIUM (CORRIGIDA)
// =====================================
function tocarNotaPremium(freqFundamental, duracao, config) {
  const now = audioCtx.currentTime;
  const duracaoSegundos = duracao / 1000;
  const parciais = config.parciais || [{ mult: 1, vol: 1, dec: 1 }];

  parciais.forEach((parcial) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();

    osc.type = config.oscType || "sine";
    osc.frequency.setValueAtTime(freqFundamental * parcial.mult, now);

    // Vibrato
    lfo.frequency.setValueAtTime(config.vibratoSpeed || 5, now);
    lfoGain.gain.setValueAtTime(config.vibratoDepth || 0, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Stereo Pan
    pan.pan.setValueAtTime(Math.random() * 0.5 - 0.25, now);

    // Configurações do Envelope ADSR
    const volumeMaximo = (config.volume || 0.2) * parcial.vol;
    const attack = config.attack || 0.01;
    const decay = config.decay || 0.1;
    const sustain = config.sustain || 0.4;
    const release = (config.release || 1.5) * parcial.dec;

    // Cálculo correto dos tempos de transição
    const tempoAttack = now + attack;
    const tempoDecay = tempoAttack + decay;
    const tempoSustain = now + duracaoSegundos;
    const tempoRelease = tempoSustain + release;

    // Execução do Envelope de Volume (Garante curvas limpas sem estalos)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volumeMaximo, tempoAttack);
    gain.gain.linearRampToValueAtTime(volumeMaximo * sustain, tempoDecay);

    // Mantém o sustain estável e prepara a rampa exponencial sem conflito de tempo
    gain.gain.setValueAtTime(volumeMaximo * sustain, tempoSustain);
    gain.gain.exponentialRampToValueAtTime(0.0001, tempoRelease);

    // Conexões de Áudio
    osc.connect(gain);
    gain.connect(pan);
    gain.connect(reverb); // Reverb em paralelo
    pan.connect(audioCtx.destination); // Som direto em estéreo

    // Início e parada programada dos osciladores
    osc.start(now);
    lfo.start(now);
    osc.stop(tempoRelease);
    lfo.stop(tempoRelease);

    // Registro para controle externo de parada
    asCofMus.osciladoresAtivos.push(osc);

    // FAXINA DE MEMÓRIA (Essencial para não travar o navegador)
    osc.onended = () => {
      asCofMus.osciladoresAtivos = asCofMus.osciladoresAtivos.filter(
        (o) => o !== osc,
      );

      // Desconecta absolutamente tudo para liberar o Garbage Collector
      osc.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
  });
}

// =====================================
// PARAR
// =====================================
function pararMusica() {
  asCofMus.stopMusic = true;

  asCofMus.osciladoresAtivos.forEach((osc) => {
    try {
      osc.stop();
    } catch {}
  });

  asCofMus.osciladoresAtivos = [];

  console.log("Parado");
}

// =====================================
// MUSIC
// =====================================

const jingleBellsPremium = {
  config: {
    bpm: 180,
    oscType: "sine",
    volume: 0.25, // Volume levemente aumentado pois frequências graves são menos audíveis
    vibratoDepth: 2,
    vibratoSpeed: 4,
    attack: 0.01, // Ataque ligeiramente mais lento para evitar estalos no grave
    decay: 0.3,
    sustain: 0.4,
    release: 2.5,
    parciais: [
      { mult: 0.5, vol: 1.0, dec: 4.0 }, // Sub-grave reforçado
      { mult: 1.0, vol: 0.9, dec: 3.0 }, // Frequência fundamental
      { mult: 1.5, vol: 0.6, dec: 2.0 }, // Quinta harmônica para dar corpo
      { mult: 2.0, vol: 0.4, dec: 1.5 }, // Oitava superior harmônica
      { mult: 3.0, vol: 0.2, dec: 1.0 }, // Brilho discreto
    ],
    frequencias: {
      C3: 130.81,
      D3: 146.83,
      E3: 164.81,
      F3: 174.61,
      G3: 196.0,
      A3: 220.0,
      B3: 246.94,
      C4: 261.63,
    },
  },
  notas: [
    ["E3", 1],
    ["E3", 1],
    ["E3", 2],
    ["PAUSA", 0.4],
    ["E3", 1],
    ["E3", 1],
    ["E3", 2],
    ["PAUSA", 0.4],
    ["E3", 1],
    ["G3", 1],
    ["C3", 1],
    ["D3", 1],
    ["E3", 3],
    ["PAUSA", 0.8],
    ["F3", 1],
    ["F3", 1],
    ["F3", 1],
    ["F3", 1],
    ["F3", 1],
    ["E3", 1],
    ["E3", 1],
    ["E3", 0.5],
    ["E3", 0.5],
    ["G3", 1],
    ["G3", 1],
    ["F3", 1],
    ["D3", 1],
    ["C3", 3],
  ],
};

const alarmeBipsIntercalados = {
  config: {
    bpm: 120, // Ritmo compassado de 2 bipes por segundo
    oscType: "square", // Onda senoidal pura para som de bipe eletrônico limpo
    volume: 0.16, // Volume ligeiramente maior por ser uma frequência pura
    vibratoDepth: 0,
    vibratoSpeed: 0,
    attack: 0.001, // Ataque instantâneo para estalar o início do bipe
    decay: 0.05,
    sustain: 0.8, // Mantém o bipe firme até o corte
    release: 0.01, // Corte abrupto sem eco
    parciais: [
      { mult: 1.0, vol: 1.0, dec: 1.0 }, // Apenas a frequência fundamental para pureza
    ],
    frequencias: {
      BipeAlto: 500.0, // Tom agudo clássico de despertador de pulso
      BipeBaixo: 500.0, // Tom secundário para o efeito intercalado
    },
  },
  notas: [
    // Primeiro par de bipes rápidos
    ["BipeAlto", 0.25],
    ["PAUSA", 0.25],
    ["BipeAlto", 0.25],
    ["PAUSA", 0.25],

    // Pausa longa de respiro entre os blocos
    ["PAUSA", 1.0],

    // Segundo par de bipes com tom intercalado (mais grave)
    ["BipeBaixo", 0.25],
    ["PAUSA", 0.25],
    ["BipeBaixo", 0.25],
    ["PAUSA", 0.25],

    // Pausa longa para reiniciar o ciclo do alarme
    ["PAUSA", 1.0],
  ],
};

const aroundTheWorldOriginal = {
  config: {
    bpm: 121,
    oscType: "sawtooth", // Onda dente de serra para o timbre brilhante e rasgado do Daft Punk
    volume: 0.12, // Reduzido drasticamente para não distorcer, por ser uma onda rica e forte
    vibratoDepth: 1.5,
    vibratoSpeed: 6.5, // Simula o efeito de modulação do filtro (wah-wah) do sintetizador
    attack: 0.005,
    decay: 0.25,
    sustain: 0.6, // Sustain mais alto para as notas se conectarem como um contrabaixo real
    release: 0.5,
    parciais: [
      { mult: 1.0, vol: 1.0, dec: 1.5 },
      { mult: 2.0, vol: 0.5, dec: 1.0 }, // Harmônicos pares e ímpares cheios
      { mult: 3.0, vol: 0.3, dec: 0.7 },
      { mult: 4.0, vol: 0.15, dec: 0.4 },
    ],
    frequencias: {
      E2: 82.41,
      F3: 174.61,
      G3: 196.0,
      A3: 220.0,
      B3: 246.94,
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
    },
  },
  notas: [
    ["A3", 0.5],
    ["C4", 0.5],
    ["E4", 0.5],
    ["D4", 1.0],
    ["C4", 0.5],
    ["B3", 0.5],
    ["G3", 0.5],
    ["A3", 1.0],
    ["PAUSA", 0.5],
    ["A3", 0.5],
    ["C4", 0.5],
    ["E4", 0.5],
    ["D4", 1.0],
    ["C4", 0.5],
    ["E2", 1.0],
    ["F3", 0.5],
    ["G3", 0.5],
    ["A3", 0.5],
  ],
};

const blueEiffel65Extended = {
  config: {
    bpm: 128,
    oscType: "square",
    volume: 0.12,
    vibratoDepth: 1,
    vibratoSpeed: 5,
    attack: 0.001,
    decay: 0.12, // Ligeiramente mais rápido para dar clareza aos arpejos
    sustain: 0.35,
    release: 0.35,
    parciais: [
      { mult: 1.0, vol: 1.0, dec: 1.0 },
      { mult: 2.0, vol: 0.4, dec: 0.5 },
      { mult: 3.0, vol: 0.2, dec: 0.3 },
    ],
    frequencias: {
      G2: 98.0, // Notas graves adicionadas para a complexidade
      Bb2: 116.54, // do contra-tempo (arpejo)
      C3: 130.81,
      D3: 146.83,
      G3: 196.0,
      A3: 220.0,
      Bb3: 233.08,
      C4: 261.63,
      D4: 293.66,
      Eb4: 311.13,
      F4: 349.23,
      G4: 392.0,
    },
  },
  notas: [
    // --- PARTE 1: O Início clássico com resposta grave ---
    ["G3", 0.5],
    ["G2", 0.25],
    ["Bb3", 0.5],
    ["Bb2", 0.25],
    ["C4", 0.5],
    ["D4", 0.5],
    ["C4", 0.5],
    ["D4", 0.5],
    ["G3", 1.0],
    ["G2", 0.5],

    // --- PARTE 2: Subida para o Eb4 ---
    ["Bb3", 0.5],
    ["C4", 0.5],
    ["D4", 0.5],
    ["Eb4", 0.5],
    ["D4", 0.5],
    ["Eb4", 0.5],
    ["C4", 1.0],
    ["C3", 0.5],

    // --- PARTE 3: Caminho agudo pelo F4 ---
    ["G3", 0.5],
    ["Bb3", 0.5],
    ["C4", 0.5],
    ["D4", 0.5],
    ["C4", 0.5],
    ["D4", 0.5],
    ["F4", 1.0],
    ["D3", 0.5],

    // --- PARTE 4: Extensão inédita (Segunda metade do refrão original) ---
    ["Eb4", 0.5],
    ["D4", 0.5],
    ["C4", 0.5],
    ["Bb3", 0.5],
    ["C4", 0.5],
    ["D4", 0.5],
    ["Bb3", 1.0],
    ["G2", 0.5],
    ["A3", 0.5],
    ["Bb3", 0.5],
    ["C4", 0.5],
    ["A3", 0.5],
    ["G3", 2.0], // Nota final longa sustentada
  ],
};

const animalsGarrix = {
  config: {
    bpm: 128,
    oscType: "sawtooth", // Onda dente de serra para o som cortante de festival
    volume: 0.14,
    vibratoDepth: 0, // Sem vibrato para manter o som focado e seco
    vibratoSpeed: 0,
    attack: 0.002,
    decay: 0.1, // Decaimento super rápido
    sustain: 0.1, // Sustain baixo para a nota morrer rápido
    release: 0.2, // Som cortado abruptamente (estilo staccato agressivo)
    parciais: [
      { mult: 1.0, vol: 1.0, dec: 0.5 },
      { mult: 2.0, vol: 0.6, dec: 0.3 },
      { mult: 3.0, vol: 0.4, dec: 0.2 },
      { mult: 4.0, vol: 0.2, dec: 0.1 },
    ],
    frequencias: {
      F2: 87.31, // Nota grave para a virada
      F3: 174.61,
      G3: 196.0,
      Ab3: 207.65,
      Bb3: 233.08,
      C4: 261.63,
    },
  },
  notas: [
    ["F3", 0.5],
    ["F3", 0.5],
    ["F3", 0.5],
    ["PAUSA", 0.5],
    ["F3", 0.5],
    ["F3", 0.5],
    ["F3", 0.5],
    ["PAUSA", 0.5],
    ["F3", 0.5],
    ["G3", 0.5],
    ["Ab3", 0.5],
    ["Bb3", 0.5],
    ["C4", 0.5],
    ["Bb3", 0.5],
    ["Ab3", 0.5],
    ["G3", 0.5],
    ["F2", 1.0], // Drop impactante no grave
  ],
};

const alarmeAvicii = {
  config: {
    bpm: 124,
    oscType: "square", // Onda quadrada para o timbre clássico de synth do Avicii
    volume: 0.15,
    vibratoDepth: 0.05, // Leve vibrato para dar vivacidade ao sintetizador
    vibratoSpeed: 6,
    attack: 0.01, // Ataque rápido, mas sem o estalo agressivo do Garrix
    decay: 0.15,
    sustain: 0.4, // Sustain moderado para a melodia soar mais fluida e cantada
    release: 0.15,
    parciais: [
      { mult: 1.0, vol: 1.0, dec: 0.6 },
      { mult: 2.0, vol: 0.4, dec: 0.4 },
      { mult: 1.5, vol: 0.3, dec: 0.3 }, // Quinta justa adicionada para brilho harmônico
    ],
    frequencias: {
      D3: 146.83,
      A3: 220.0,
      B3: 246.94,
      D4: 293.66,
      E4: 329.63,
      Fsh4: 369.99, // Fá sustenido para a escala de Ré Maior
    },
  },
  notas: [
    // Melodia principal ascendente e enérgica
    ["D4", 0.5],
    ["Fsh4", 0.5],
    ["A3", 0.5],
    ["D4", 0.5],
    ["Fsh4", 0.5],
    ["A3", 0.5],
    ["D4", 0.5],
    ["E4", 0.5],

    // Segunda parte com variação e repouso na tônica
    ["Fsh4", 0.5],
    ["E4", 0.5],
    ["D4", 0.5],
    ["B3", 0.5],
    ["A3", 1.0],
    ["PAUSA", 0.5],
    ["D3", 1.5], // Nota de baixo preenchendo o final do ciclo
  ],
};

console.clear();

console.log("🎄 Jingle Bells Premium carregado");
console.log("▶ tocarMusica(jingleBellsPremium)");
console.log("⏹ pararMusica()");

//teste itens

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

function converterDataHora(texto) {
  const match = texto.match(
    /(\d{1,2}):(\d{2})\s(AM|PM)\s+(\d{2})\/(\d{2})\/(\d{4})/i,
  );

  if (!match) {
    return null;
  }

  let [, hora, minuto, periodo, mes, dia, ano] = match;

  hora = parseInt(hora, 10);

  if (periodo.toUpperCase() === "PM" && hora !== 12) {
    hora += 12;
  }

  if (periodo.toUpperCase() === "AM" && hora === 12) {
    hora = 0;
  }

  return {
    data: `${dia}/${mes}/${ano}`,
    hora: `${String(hora).padStart(2, "0")}:${minuto}:00`,
  };
}

const lista = [];
const itens = document.querySelectorAll("span");

if (itens.length > 0) {
  itens.forEach((a) => {
    if (!a.textContent.includes("ID da interação")) return;

    const acima1 = a.parentElement;
    const acima2 = acima1.parentElement;
    const alinha = {};

    for (const f of acima2.children) {
      alinha[f.children[0].textContent] = f.children[0].textContent.includes(
        "Hora de",
      )
        ? converterDataHora(f.children[1].textContent)
        : f.children[1].textContent;
    }

    lista.push(alinha);
  });

  console.log(lista);
} else {
  console.log(`itens <= 0`);
}
let oag = 0;
const oig = [];

if (lista.length > 0) {
  lista.forEach((a) => {
    if (oig.includes(a.Agente)) return;
    
    a["Hora de fim"]

    exibirAHora(a, op, b)


    oig.push(a.Agente);
  });
}

function exibirAHora(a, op, b) {
  const pad2 = (n) => String(n).padStart(2, "0");

  const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  const isBR = (d) => /^\d{2}\/\d{2}\/\d{4}$/.test(d);

  function parseDate(d) {
    if (isISO(d)) {
      const [Y, M, D] = d.split("-").map(Number);
      return new Date(Y, M - 1, D);
    }
    if (isBR(d)) {
      const [D, M, Y] = d.split("/").map(Number);
      return new Date(Y, M - 1, D);
    }
    throw new Error(
      `Formato de data inválido "${d}". Use YYYY-MM-DD ou DD/MM/YYYY .`,
    );
  }

  function formatDate(date, keepISO) {
    const Y = date.getFullYear();
    const M = pad2(date.getMonth() + 1);
    const D = pad2(date.getDate());
    return keepISO ? `${Y}-${M}-${D}` : `${D}/${M}/${Y}`;
  }

  function parseTime(h) {
    if (!/^\d{2}:\d{2}:\d{2}$/.test(h)) {
      throw new Error(`Formato de hora inválido "${h}". Use HH:MM:SS.`);
    }
    const [HH, MM, SS] = h.split(":").map(Number);
    if (HH < 0 || HH > 23 || MM < 0 || MM > 59 || SS < 0 || SS > 59) {
      throw new Error("Hora fora do intervalo válido.");
    }
    return { HH, MM, SS };
  }

  function toEpochMs(obj) {
    const dt = parseDate(obj.data);
    const { HH, MM, SS } = parseTime(obj.hora);
    dt.setHours(HH, MM, SS, 0); // local time
    return dt.getTime();
  }

  if (typeof op !== "number" || (op !== 0 && op !== 1)) {
    throw new Error("Operação inválida. Use 1 para soma ou 0 para subtração.");
  }

  const keepISO = isISO(a.data);
  const epochA = toEpochMs(a);
  const epochB = toEpochMs(b);

  let outHora, outData;

  if (op === 1) {
    // Soma: adiciona o "tempo" de b como delta a 'a'
    const midnightB = new Date(parseDate(b.data));
    midnightB.setHours(0, 0, 0, 0);
    const deltaB = toEpochMs(b) - midnightB.getTime(); // ms desde meia-noite
    const resultDate = new Date(epochA + deltaB);
    outHora = `${pad2(resultDate.getHours())}:${pad2(
      resultDate.getMinutes(),
    )}:${pad2(resultDate.getSeconds())}`;
    outData = formatDate(resultDate, keepISO);
  } else {
    // Subtração (delta de tempo): usa UTC para evitar offset do fuso
    let diffMs = epochA - epochB;
    const sign = diffMs < 0 ? -1 : 1;
    diffMs = Math.abs(diffMs);

    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);

    // Se quiser sinal, pode incorporar ao formato. Aqui retornamos só o valor absoluto.
    outHora = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

    // Para delta, manter a data de 'a' (ou escolha outra regra, se preferir)
    outData = a.data;
  }

  return { hora: outHora, data: outData };
}

function exibirHora(horaedataparacalculo, maisoumenos, valordeacrecimo) {
  // --- Parsers de data/hora flexíveis ---
  function parseDateFlexible(dateStr) {
    const s = String(dateStr || "").trim();

    // YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return { year: +m[1], month: +m[2], day: +m[3] };

    // DD/MM/YYYY
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return { year: +m[3], month: +m[2], day: +m[1] };

    return null;
  }

  function parseTimeFlexible(timeStr) {
    const m = String(timeStr || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return { hh: 0, mm: 0, ss: 0 };
    return { hh: +m[1], mm: +m[2], ss: m[3] ? +m[3] : 0 };
  }

  // --- Constrói Date a partir de {data, hora} ---
  function buildDateTime(obj) {
    const d = parseDateFlexible(obj?.data || "");
    const t = parseTimeFlexible(obj?.hora || "00:00:00");
    if (!d) return new Date(); // fallback: agora

    let { year, month, day } = d;
    let { hh, mm, ss } = t;

    // Trate "24:00:00" como 00:00:00 do dia seguinte
    if (hh === 24) {
      hh = 0;
      const tmp = new Date(year, month - 1, day);
      tmp.setDate(tmp.getDate() + 1);
      year = tmp.getFullYear();
      month = tmp.getMonth() + 1;
      day = tmp.getDate();
    }

    return new Date(year, month - 1, day, hh, mm, ss);
  }

  // --- Offset string "+HH:MM[:SS]" | "-HH:MM[:SS]" => segundos ---
  function parseOffset(offsetStr) {
    const m = String(offsetStr || "").match(
      /^([+-])(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
    );
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    const h = +m[2],
      mi = +m[3],
      s = m[4] ? +m[4] : 0;
    return sign * (h * 3600 + mi * 60 + s);
  }

  // --- Duração em segundos a partir de string ou objeto absoluto ---
  // String "HH:MM[:SS]" => duração direta
  // Objeto {data, hora} => usa a diferença ABS entre val e base (1º parâmetro)
  function durationFromAbsoluteOrString(val, baseObj) {
    if (typeof val === "string") {
      const t = parseTimeFlexible(val);
      return t.hh * 3600 + t.mm * 60 + t.ss;
    }
    if (typeof val === "object" && val) {
      const dVal = buildDateTime(val);
      const dBase = buildDateTime(
        baseObj || { data: "1970-01-01", hora: "00:00:00" },
      );
      return Math.abs(Math.floor((dVal.getTime() - dBase.getTime()) / 1000));
    }
    return 0;
  }

  // --- Formata retorno {data:'YYYY-MM-DD', hora:'HH:MM:SS'} em fuso local ---
  function formatObj(date) {
    const data = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
    const hora = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    return { data, hora };
  }

  // --- Determina offset em segundos ---
  let offsetSec = 0;

  // Caso 1: maisoumenos é uma offset string e não há 3º parâmetro
  if (typeof maisoumenos === "string" && valordeacrecimo === undefined) {
    offsetSec = parseOffset(maisoumenos);
  } else {
    // Caso 2: sinal via maisoumenos (false/0/"0" => negativo; demais => positivo)
    const dur = durationFromAbsoluteOrString(
      valordeacrecimo || "00:00:00",
      horaedataparacalculo,
    );
    const isNegative =
      maisoumenos === false ||
      (typeof maisoumenos === "number" && Number(maisoumenos) === 0) ||
      (typeof maisoumenos === "string" && maisoumenos === "0");
    const sign = isNegative ? -1 : 1;
    offsetSec = sign * dur;
  }

  const base = buildDateTime(horaedataparacalculo);
  const adjusted = new Date(base.getTime() + offsetSec * 1000);
  return formatObj(adjusted);
}
