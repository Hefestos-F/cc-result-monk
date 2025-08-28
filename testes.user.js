

let a = 880;

function tocarBeep(a) {
      const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
      const oscilador = contextoAudio.createOscillator();
      const ganho = contextoAudio.createGain();

      
      oscilador.type = 'sine'; // Tipo de onda: sine, square, triangle, sawtooth
      oscilador.frequency.setValueAtTime(a, contextoAudio.currentTime); // Frequência em Hz (440Hz = nota A)
      console.log('Frequencia :',a);
      oscilador.connect(ganho);
      ganho.connect(contextoAudio.destination);

      oscilador.start();
      oscilador.stop(contextoAudio.currentTime + 0.5); // Duração de 0.5 segundos
    }
    tocarBeep(700);



    
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function beep(frequency, duration, volume = 100) {
      return new Promise((resolve) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume / 100;

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration / 1000);

        oscillator.onended = resolve;
      });
    }

    async function tocarDingDong() {
      await beep(880, 300); // Ding (nota aguda)
      await beep(660, 300); // Dong (nota grave)
    }




        const listaTemposDescanso = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
        const listaTemposLanche = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00', '24:30', '25:00'];
 
        function tocarSom() {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var oscilador = audioContext.createOscillator();
        oscilador.type = 'sine'; // Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
        oscilador.frequency.setValueAtTime(440, audioContext.currentTime); // Frequência em Hz (440 Hz = nota Lá)
        var gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // Define o volume (0.05 = 10% do volume máximo)
        oscilador.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscilador.start();
        setTimeout(function() {
            oscilador.stop();
        }, 3000);
    }