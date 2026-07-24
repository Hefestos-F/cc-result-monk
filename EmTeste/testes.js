// =====================================
// PREMIUM WEB AUDIO PLAYER
// =====================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let stopMusic = false;
let repetirMusic = true;
let osciladoresAtivos = [];

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
  stopMusic = false;

  await audioCtx.resume();

  const bpm = musica.config.bpm || 120;

  for (const [notaTexto, valor] of musica.notas) {
    if (stopMusic) {
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

  if (repetirMusic && !stopMusic) return tocarMusica(musica);

  console.log("Fim da música");
}

// =====================================
// NOTA PREMIUM
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

    // vibrato

    lfo.frequency.value = config.vibratoSpeed || 5;

    lfoGain.gain.value = config.vibratoDepth || 0;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // stereo

    pan.pan.value = Math.random() * 0.5 - 0.25;

    const volume = (config.volume || 0.2) * parcial.vol;

    const attack = config.attack || 0.01;

    const decay = config.decay || 0.1;

    const sustain = config.sustain || 0.4;

    const release = (config.release || 1.5) * parcial.dec;

    gain.gain.setValueAtTime(0, now);

    gain.gain.linearRampToValueAtTime(volume, now + attack);

    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

    gain.gain.setValueAtTime(volume * sustain, now + duracaoSegundos);

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duracaoSegundos + release,
    );

    osc.connect(gain);

    gain.connect(pan);

    gain.connect(reverb);

    pan.connect(audioCtx.destination);

    osc.start(now);
    lfo.start(now);

    osc.stop(now + duracaoSegundos + release);

    lfo.stop(now + duracaoSegundos + release);

    osciladoresAtivos.push(osc);

    osc.onended = () => {
      osciladoresAtivos = osciladoresAtivos.filter((o) => o !== osc);
    };
  });
}

// =====================================
// PARAR
// =====================================

function pararMusica() {
  stopMusic = true;

  osciladoresAtivos.forEach((osc) => {
    try {
      osc.stop();
    } catch {}
  });

  osciladoresAtivos = [];

  console.log("Parado");
}

// =====================================
// JINGLE BELLS PREMIUM
// =====================================

const jingleBellsPremium = {
  config: {
    bpm: 180,

    oscType: "sine",

    volume: 0.15,

    vibratoDepth: 3,

    vibratoSpeed: 5,

    attack: 0.002,

    decay: 0.15,

    sustain: 0.35,

    release: 2.2,

    parciais: [
      { mult: 0.5, vol: 0.9, dec: 3.2 },
      { mult: 1.0, vol: 1.0, dec: 2.4 },
      { mult: 2.0, vol: 0.7, dec: 1.7 },
      { mult: 2.92, vol: 0.5, dec: 1.2 },
      { mult: 4.1, vol: 0.3, dec: 0.9 },
      { mult: 5.43, vol: 0.2, dec: 0.6 },
    ],

    frequencias: {
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      F5: 698.46,
      G5: 783.99,
      A5: 880.0,
      B5: 987.77,
      C6: 1046.5,
    },
  },

  notas: [
    ["E5", 1],
    ["E5", 1],
    ["E5", 2],

    ["PAUSA", 0.4],

    ["E5", 1],
    ["E5", 1],
    ["E5", 2],

    ["PAUSA", 0.4],

    ["E5", 1],
    ["G5", 1],
    ["C5", 1],
    ["D5", 1],
    ["E5", 3],

    ["PAUSA", 0.8],

    ["F5", 1],
    ["F5", 1],
    ["F5", 1],
    ["F5", 1],

    ["F5", 1],
    ["E5", 1],
    ["E5", 1],

    ["E5", 0.5],
    ["E5", 0.5],

    ["G5", 1],
    ["G5", 1],

    ["F5", 1],
    ["D5", 1],

    ["C5", 3],
  ],
};

console.clear();

console.log("🎄 Jingle Bells Premium carregado");
console.log("▶ tocarMusica(jingleBellsPremium)");
console.log("⏹ pararMusica()");

tocarMusica(sonataAoLuar);



function gerarDataISO(dataStr) {
  if (!dataStr) return null;

  const limpa = dataStr.replace(",", "").trim();

  const match = limpa.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) return null;

  const [, dia, mes, ano, hora, min, seg] = match;

  return `${ano}-${mes}-${dia}T${hora}:${min}:${seg || "00"}`;
}

gerarDataISO(r.dataHora);
