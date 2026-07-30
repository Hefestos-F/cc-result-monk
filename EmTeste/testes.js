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
