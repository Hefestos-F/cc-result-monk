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

function dataHoraFormat() {
  const agora = new Date();

  const dataHora = {
    data: agora.toLocaleDateString("pt-BR"), // dd/mm/aaaa

    hora: agora.toLocaleTimeString("pt-BR"), // hh:mm:ss
  };
  return dataHora;
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

function aListaInteracoes() {
  const listaDInteracoes = [];

  const TodascaixasSpan = document.querySelectorAll("span");

  if (TodascaixasSpan.length > 0) {
    TodascaixasSpan.forEach((caixaSpan) => {
      if (!caixaSpan.textContent.includes("ID da interação")) return;

      const linhaidInteracao = caixaSpan.parentElement;
      const caixaInteracao = linhaidInteracao.parentElement;
      const listaItensInteracao = {};

      for (const linhasiIteracao of caixaInteracao.children) {
        listaItensInteracao[linhasiIteracao.children[0].textContent] =
          linhasiIteracao.children[0].textContent.includes("Hora de")
            ? converterDataHora(linhasiIteracao.children[1].textContent)
            : linhasiIteracao.children[1].textContent;
      }

      listaDInteracoes.push(listaItensInteracao);
    });

    //console.log(listaDInteracoes);
  } else {
    //console.log(`itens <= 0`);
  }
  return listaDInteracoes;
}

function listarAgentComTempoDisponivel() {
  const osAgentIgnorados = [];
  const ListaAgentComTempo = [];
  const listaDInteracoes = aListaInteracoes();
  if (listaDInteracoes.length > 0) {
    listaDInteracoes.forEach((interacao) => {
      const horaFim = "Hora de fim";

      if (osAgentIgnorados.includes(interacao.Agente) || !interacao[horaFim])
        return;

      const diferencaHoraFimParaAgora = exibirAHora(
        dataHoraFormat(),
        0,
        interacao[horaFim],
      );

      const nomeEncontradoAgente = interacao.Agente;

      const nomeDoAgenteLimpo = nomeEncontradoAgente
        .replace(/[0-9_@!.,/\\#%&*()\-+=[\]{};:<>?]/g, "")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const seNomeVazio = nomeDoAgenteLimpo
        ? nomeDoAgenteLimpo
        : `-?-${interacao[horaFim].hora}-?-`;

      const nomeETempoDisponivel = {
        nomeAgent: seNomeVazio,
        TempoDisponivel: diferencaHoraFimParaAgora,
      };

      osAgentIgnorados.push(nomeEncontradoAgente);
      ListaAgentComTempo.push(nomeETempoDisponivel);
    });
    //console.log("ListaAgentComTempo: ");
    //console.log(ListaAgentComTempo);
  } else {
    //console.log("ListaAgentComTempo: Não encontrado");
  }
  return ListaAgentComTempo;
}

function colocarListaDeDisponibilidade() {
  const abaInteracaoConcluida = document.getElementById("pane-active");

  if (abaInteracaoConcluida) {
    const opai = abaInteracaoConcluida.parentElement;

    const criarDiv = () => document.createElement("div");

    const aCaixaDaListaDisponivel = document.getElementById(
      "aCaixaDaListaDisponivel",
    );

    if (aCaixaDaListaDisponivel) aCaixaDaListaDisponivel.remove();

    const aCaixaDaLista = criarDiv();
    aCaixaDaLista.id = "aCaixaDaListaDisponivel";
    aCaixaDaLista.style.cssText = `
      color: rgba(4, 4, 19, .56);
      font-size: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 10px;
    `;

    const listaAgentComTempo = listarAgentComTempoDisponivel();

    listaAgentComTempo.forEach((linhaLista) => {
      const linhaCaixa = criarDiv();
      linhaCaixa.style.cssText = `
        display: flex;
        width: 90%;
        justify-content: space-between;
      `;

      const nome = criarDiv();
      nome.textContent = linhaLista.nomeAgent;

      const Tempo = criarDiv();
      Tempo.textContent = linhaLista.TempoDisponivel.hora;

      linhaCaixa.append(nome, Tempo);

      aCaixaDaLista.append(linhaCaixa);
    });

    opai.prepend(aCaixaDaLista);

    //console.log("Caixa Criada e Adicionada");
  } else {
    //console.log("abaInteracaoConcluida não encontrada");
  }
}

const atualizarLista = setInterval(colocarListaDeDisponibilidade, 3000);

//clearInterval(atualizarLista);

const alistaNova = [
  { id: 12, a: "a", b: "b", c: "c" },
  { id: 13, a: "a", b: "b", c: "c" },
  { id: 14, a: "a", b: "b", c: "c" },
];

const novas = [1564875, 1564877, 15648758, 1564879, 1564870];

const lista1 = { id: 12, a: "a", b: "b", c: "c" };

const lista2 = { id: 12, a: "n", b: "b", c: "h" };

Object.keys(lista2).length;

const lista3 = [
  { id: 13, a: "m" },
  { id: 14, a: "g" },
  { id: 15, a: "h" },
];
const lista4 = [];

const d = lista4.length > 0;

Object.keys(lista1).forEach((chave) => {
  if (lista1[chave] !== lista2[chave]) {
    console.log(chave);
  }
});

array.forEach((element) => {});

console.log = console.info;

(() => {
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;

  window.completeEngagementPages = [];
  window.activeEngagementResponses = [];

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._method = method;
    return open.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("load", () => {
      const url = this._url || "";

      // Ignora tudo que não interessa
      const isCompleteEngagement = url.includes(
        "/analytics/historical/completeEngagement/report",
      );

      const isActiveEngagement = url.includes("/active/engagement/omni");

      if (!isCompleteEngagement && !isActiveEngagement) {
        return;
      }

      try {
        const data = JSON.parse(this.responseText);

        if (isCompleteEngagement) {
          console.group("📋 COMPLETE ENGAGEMENT REPORT");
          console.log("URL:", url);
          console.log(data);
          console.groupEnd();

          window.completeEngagementReport = data;

          window.completeEngagementPages.push({
            url,
            timestamp: new Date().toISOString(),
            data,
          });
        }

        if (isActiveEngagement) {
          console.group("🎧 ACTIVE ENGAGEMENT OMNI");
          console.log("URL:", url);
          console.log(data);
          console.groupEnd();

          window.activeEngagementOmni = data;

          window.activeEngagementResponses.push({
            url,
            timestamp: new Date().toISOString(),
            data,
          });
        }
      } catch (err) {
        console.error("❌ Resposta não é JSON", url, this.responseText);
      }
    });

    return send.apply(this, arguments);
  };

  console.log("✅ Interceptador instalado");
})();

///

clearInterval(atualizarLista);

pararObservacao();

//Nova versao encotrar ativo e concluido

const osAtendimentosCompletos = [];

let aCadaCiclo = 0;

const posicoesTempos = {};

function dataHoraFormat() {
  const agora = new Date();

  const dataHora = {
    data: agora.toLocaleDateString("pt-BR"), // dd/mm/aaaa

    hora: agora.toLocaleTimeString("pt-BR"), // hh:mm:ss
  };
  return dataHora;
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

function tempoEncurtado(input) {
  // --- Normaliza entrada para total de segundos (inteiro) ---
  let totalSeg;

  if (typeof input === "number" && Number.isFinite(input)) {
    totalSeg = Math.trunc(input);
  } else if (typeof input === "string") {
    const str = input.trim();
    // Detecta sinal
    const negativo = str.startsWith("-");
    const limpo = negativo ? str.slice(1) : str;

    const partes = limpo.split(":").map((p) => p.trim());
    if (partes.some((p) => p === "" || isNaN(Number(p)))) {
      throw new Error(`Formato inválido: "${input}"`);
    }

    let h = 0,
      m = 0,
      s = 0;
    if (partes.length === 3) {
      [h, m, s] = partes.map(Number);
    } else if (partes.length === 2) {
      [m, s] = partes.map(Number);
    } else if (partes.length === 1) {
      [s] = partes.map(Number);
    } else {
      throw new Error(`Formato inválido: "${input}"`);
    }

    if (m < 0 || s < 0 || h < 0)
      throw new Error(
        `Valores negativos não são permitidos nas partes: "${input}"`,
      );
    if (m >= 60 || s >= 60) {
      // Aceitamos mm/ss >= 60? Se preferir, pode normalizar; aqui vamos rejeitar:
      // para normalizar, comente o throw e deixe passar (iremos somar abaixo).
      // throw new Error(`Minutos/segundos devem ser < 60: "${input}"`);
    }

    totalSeg = h * 3600 + m * 60 + s;
    if (negativo) totalSeg = -totalSeg;
  } else {
    throw new Error(
      'Entrada deve ser string "HH:MM:SS" | "MM:SS" | "SS" ou número de segundos.',
    );
  }

  // --- Constrói saída no menor formato possível ---
  const negativo = totalSeg < 0;
  const abs = Math.abs(totalSeg);

  const horas = Math.floor(abs / 3600);
  const minutos = Math.floor((abs % 3600) / 60);
  const segundos = abs % 60;

  const pad2 = (n) => String(n).padStart(2, "0");

  let corpo;
  if (horas > 0) {
    corpo = `${horas}:${pad2(minutos)}:${pad2(segundos)}`;
  } else if (minutos > 0) {
    corpo = `${minutos}:${pad2(segundos)}`;
  } else {
    corpo = `${segundos}`; // sem zero-padding em SS puro
  }

  return negativo ? `-${corpo}` : corpo;
}

function converterParaSegundos(tempo) {
  // Mais tolerante: aceita "HH:MM:SS", "MM:SS" e números; retorna segundos inteiros.
  if (tempo == null || tempo === "") return 0;
  if (typeof tempo === "number") return Math.floor(tempo);
  if (typeof tempo === "string") {
    const parts = tempo
      .trim()
      .split(":")
      .map((p) => Number(p.trim()));
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return (Number(m) || 0) * 60 + (Number(s) || 0);
    }
    if (/^\d+$/.test(tempo.trim())) {
      return Number(tempo.trim());
    }
  }
  return 0;
}

function converterParaTempo(input) {
  if (input == null) return "00:00:00";

  // aceita número (segundos) ou string ("HH:MM:SS" / "MM:SS" / "SS")
  let total = Number(input);

  if (Number.isNaN(total)) {
    if (typeof input === "string" && input.includes(":")) {
      const parts = input.split(":").map((p) => Number(p.trim()));
      if (parts.length === 3) {
        total = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        total = parts[0] * 60 + parts[1];
      } else {
        total = 0;
      }
    } else {
      // caso seja string só com segundos ("15", "90") ou inválida
      const onlyNum = Number(String(input).trim());
      total = Number.isFinite(onlyNum) ? onlyNum : 0;
    }
  }

  // normaliza para inteiro e evita negativo
  total = Math.max(0, Math.floor(total));

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  return (
    String(horas).padStart(2, "0") +
    ":" +
    String(minutos).padStart(2, "0") +
    ":" +
    String(segundos).padStart(2, "0")
  );
}

function formatPrimeiroNome(txt) {
  const t = (txt ?? "").trim();
  if (!t) return "";

  // Divide no primeiro espaço, pipe (|) ou hífen (-)
  // O modificador 'u' garante suporte Unicode
  const first = t.split(/[|\/\-\s]+/u)[0];

  // Normaliza: primeira letra maiúscula, restante minúsculo
  const lower = first.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function dosiNomes(nomeCompleto) {
  if (!nomeCompleto) return;
  const nomesSeparados = nomeCompleto.split(" ");
  const primeiroNome = nomesSeparados[0];
  const segundoNome = nomesSeparados[1];
  let proximoNome = segundoNome;
  let numeroDoNome = 2;

  if (proximoNome.split("").length <= 2) {
    proximoNome = segundoNome + " " + nomesSeparados[numeroDoNome];
  }

  return primeiroNome + " " + proximoNome + "...";
}

function converterTimestamp(timestamp) {
  // Ajusta se o timestamp estiver em segundos (10 dígitos) em vez de milissegundos (13 dígitos)
  const dataObjeto = new Date(
    timestamp.toString().length === 10 ? timestamp * 1000 : timestamp,
  );

  // Formata a data no fuso de Brasília (-3) no padrão ISO (AAAA-MM-DD)
  const [dia, mes, ano] = dataObjeto
    .toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })
    .split("/");

  // Formata a hora no fuso de Brasília (-3) no padrão 24h (HH:MM:SS)
  const hora = dataObjeto.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });

  return {
    data: `${ano}-${mes}-${dia}`,
    hora: hora,
  };
}
// Saída esperada: { data: '2026-09-07', hora: '12:49:11' }
//converterTimestamp(1788802541754);

const nomeDoAgenteLimpo = (nomeEncontrado) =>
  nomeEncontrado
    .replace(/[0-9_@!.,/\\#%&*()\-+=[\]{};:<>?]/g, "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

//iniciar observacao de atendimento ativo e concluido
function iniciarObservacao() {
  // Evita instalar duas vezes
  if (window.__observacaoAtiva) {
    console.log("⚠️ Interceptador já está ativo");
    return;
  }

  window.__observacaoAtiva = true;

  // Salva os métodos originais
  window.__originalOpen = XMLHttpRequest.prototype.open;
  window.__originalSend = XMLHttpRequest.prototype.send;

  window.completeEngagementPages = [];
  window.activeEngagementResponses = [];

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._method = method;
    return window.__originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("load", () => {
      const url = this._url || "";

      const isCompleteEngagement = url.includes(
        "/analytics/historical/completeEngagement/report",
      );

      const isActiveEngagement = url.includes("/active/engagement/omni");

      if (!isCompleteEngagement && !isActiveEngagement) {
        return;
      }

      try {
        const data = JSON.parse(this.responseText);

        if (isCompleteEngagement) {
          console.log("📋 COMPLETE ENGAGEMENT REPORT", data);
          listarTempoDisponivelDoAgente(data);
        }

        if (isActiveEngagement) {
          console.log("🎧 ACTIVE ENGAGEMENT OMNI", data);
          listarAgentesAtendendo(data);
        }
      } catch (err) {
        console.error("❌ Resposta não é JSON");
      }
    });

    return window.__originalSend.apply(this, arguments);
  };

  console.log("✅ Interceptador instalado");
}

function pararObservacao() {
  if (!window.__observacaoAtiva) {
    console.log("⚠️ Interceptador já está desativado");
    return;
  }

  // Restaura os métodos originais
  XMLHttpRequest.prototype.open = window.__originalOpen;
  XMLHttpRequest.prototype.send = window.__originalSend;

  delete window.__originalOpen;
  delete window.__originalSend;

  window.__observacaoAtiva = false;

  console.log("🛑 Interceptador removido");
}

iniciarObservacao();

function listarAgentesAtendendo(data) {
  if (!data) return;

  const listaAtendimentos = data.result.records;

  Object.keys(osAtendimentosCompletos).forEach((id) => {
    const ignorarAgentes = [];
    if (listaAtendimentos.length > 0) {
      listaAtendimentos.forEach((atendimento) => {
        const agentId = atendimento.agents[0].agentId;

        osAtendimentosCompletos[agentId] = {
          id: atendimento.engagementId,
          agente: nomeDoAgenteLimpo(atendimento.agents[0].agentName),
          status: osAtendimentosCompletos[agentId]?.status ?? null,
          tempoFim: osAtendimentosCompletos[agentId]?.tempoFim ?? null,
          tempoInicio: atendimento.startTime,
        };
        ignorarAgentes.push(agentId);
      });
    }

    if (
      !ignorarAgentes.includes(id) &&
      osAtendimentosCompletos[id].status == "-Atendendo-"
    ) {
      osAtendimentosCompletos[id].status = "---";
      osAtendimentosCompletos[id].tempoInicio = null;
    }
  });
}

function listarTempoDisponivelDoAgente(data) {
  const listaAtendimentos = data.result.list;

  if (!listaAtendimentos.length > 0 || !data) return;

  const novaLista = listaAtendimentos.sort((x, y) => y.endTime - x.endTime);

  const agenteAdicionado = [];

  novaLista.forEach((atendimento) => {
    const oAgente = nomeDoAgenteLimpo(
      atendimento.agentNames[atendimento.agentNames.length - 1],
    );
    const oIdAgente = atendimento.agentIds[atendimento.agentIds.length - 1];

    if (agenteAdicionado.includes(oIdAgente)) return;

    osAtendimentosCompletos[oIdAgente] = {
      id: atendimento.engagementId,
      agente: oAgente,
      status: osAtendimentosCompletos[oIdAgente]?.status ?? null,
      tempoFim: atendimento.endTime,
      tempoInicio: osAtendimentosCompletos[oIdAgente]?.tempoInicio ?? null,
    };

    agenteAdicionado.push(oIdAgente);
  });
}

function colocarListaDeDisponibilidade() {
  const criarDiv = () => document.createElement("div");

  function addLinhas(id, agente) {
    const linhaCaixa = criarDiv();
    linhaCaixa.id = "linha-" + id;
    linhaCaixa.style.cssText = `
      display: flex;
      width: 90%;
      justify-content: space-between;
      border-radius: 15px;
      padding: 0px 3px;
      border-bottom: 1px dotted;
      margin-bottom: 4px;
    `;

    const itemNome = criarDiv();
    itemNome.id = "nome-" + id;
    itemNome.textContent = dosiNomes(agente);

    // background: ${status == "Atendendo" ? "#b9b9b9" : status == "Ausente" ? "#fff0af" : ""};
    const itemStatus = criarDiv();
    itemStatus.id = "status-" + id;

    const tempoAtendendo = criarDiv();
    tempoAtendendo.id = "atendendo-" + id;

    const tempoDisponivel = criarDiv();
    tempoDisponivel.id = "disponivel-" + id;

    linhaCaixa.append(itemNome, itemStatus, tempoAtendendo, tempoDisponivel);
    return linhaCaixa;
  }

  const abaInteracaoConcluida = document.getElementById("pane-active");

  if (!abaInteracaoConcluida) return;

  const opai = abaInteracaoConcluida.parentElement;

  const aCaixaDaListaDisponivel = document.getElementById(
    "aCaixaDaListaDisponivel",
  );

  const aCaixaDaLista = criarDiv();
  aCaixaDaLista.id = "aCaixaDaListaDisponivel";
  aCaixaDaLista.style.cssText = `
        color: rgba(4, 4, 19, .56);
        font-size: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 10px;
      `;

  if (Object.keys(osAtendimentosCompletos).length > 0) {
    Object.keys(osAtendimentosCompletos).forEach((id) => {
      const itemlinhaExiste = document.getElementById("linha-" + id);

      if (!itemlinhaExiste) {
        const itemLinha = addLinhas(id, osAtendimentosCompletos[id].agente);

        if (aCaixaDaListaDisponivel) {
          aCaixaDaListaDisponivel.append(itemLinha);
          console.log("Linha nao existe, criada");
        } else {
          aCaixaDaLista.append(itemLinha);
          opai.prepend(aCaixaDaLista);
          console.log("lista nao existe, criada");
        }

        return;
      }

      const tempoInicio = osAtendimentosCompletos[id]?.tempoInicio ?? 0;

      const agente = osAtendimentosCompletos[id]?.agente ?? 0;

      const atendendo = tempoInicio ? 1 : 0;

      const posicao = Array.from(aCaixaDaListaDisponivel.children).indexOf(
        itemlinhaExiste,
      );

      const posicaoTwo = posicao + 1;

      const posicaoTwoStatus = posicoesTempos[posicaoTwo]?.status ?? 0;

      const oStatus = osAtendimentosCompletos[id]?.status ?? 0;

      const osStatus = ["-Atendendo-", "-Ausente-"];

      const idLinhaAcima = posicoesTempos[posicao - 1]?.id;
      const statusAnterior = idLinhaAcima
        ? osAtendimentosCompletos[idLinhaAcima]?.status
        : 0;

      if (atendendo) {
        if (oStatus != "-Atendendo-") {
          osAtendimentosCompletos[id].status = "-Atendendo-";
        }
      }

      const itemStatus = document.getElementById("status-" + id);

      itemStatus.textContent = oStatus ? oStatus : "";

      itemlinhaExiste.style.background = atendendo
        ? "#b9b9b9"
        : oStatus == "-Ausente-"
          ? "#fff0af"
          : "";

      const itemAtendendo = document.getElementById("atendendo-" + id);

      itemAtendendo.textContent =
        itemAtendendo && tempoInicio
          ? `- ${tempoEncurtado(
              exibirAHora(dataHoraFormat(), 0, converterTimestamp(tempoInicio))
                .hora,
            )} -`
          : "";

      const itemDisponivel = document.getElementById("disponivel-" + id);

      const tempoFim = osAtendimentosCompletos[id]?.tempoFim ?? 0;

      itemDisponivel.textContent =
        itemDisponivel && tempoFim
          ? tempoEncurtado(
              exibirAHora(
                tempoInicio
                  ? converterTimestamp(tempoInicio)
                  : dataHoraFormat(),
                0,
                converterTimestamp(tempoFim),
              ).hora,
            )
          : "";

      //console.log(`${agente} : ${posicao}`);

      const posicaoTwoTempoFim = posicoesTempos[posicaoTwo]?.tempoFim ?? 0;

      const posicaoTwoTempoFimMaior = posicaoTwoTempoFim > tempoFim;

      if (aCadaCiclo) {
        console.log(
          `posicaoTwoTempoFim; ${posicaoTwoTempoFim} / posicaoTwoTempoFimMaior: ${posicaoTwoTempoFimMaior}`,
        );
        console.log(
          `aCadaCiclo > ${posicoesTempos[posicaoTwo]?.agente} acima de ${agente}`,
        );
      }

      if (posicaoTwoTempoFimMaior) {
        aCaixaDaListaDisponivel.insertBefore(
          aCaixaDaListaDisponivel.children[posicaoTwo],
          aCaixaDaListaDisponivel.children[posicao],
        );

        const idPosicaoTwo = posicoesTempos[posicaoTwo]?.id ?? null;

        if (
          !atendendo &&
          idPosicaoTwo &&
          osStatus.includes(osAtendimentosCompletos[idPosicaoTwo]?.status)
        ) {
          osAtendimentosCompletos[id].status = "-Ausente-";
        }

        console.log(`${posicoesTempos[posicaoTwo]?.agente} acima de ${agente}`);
      }

      if (tempoFim && agente)
        posicoesTempos[posicao] = {
          tempoFim: tempoFim,
          id: id,
          agente: agente,
          status: oStatus,
        };

      //osAtendimentosCompletos[id].posicao = posicao;
    });
  }
}

const atualizarLista = setInterval(colocarListaDeDisponibilidade, 1000);

//
//
//

console.log = console.info;

const aCaixaDaListaDisponivel = document.getElementById(
  "aCaixaDaListaDisponivel",
);

const a = aCaixaDaListaDisponivel.children[0].textContent;
