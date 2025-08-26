// ==UserScript==
// @name         RegisMonkey
// @namespace    http://tampermonkey.net/
// @version      4
// @description  try to take over the world!
// @author       You
// @match        https://smileshelp.zendesk.com/agent/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zendesk.com
// @updateURL    https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/RegisMonkey.user.js
// @downloadURL  https://raw.githubusercontent.com/Hefestos-F/cc-result-monk/main/RegisMonkey.user.js
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    var nome = '';
    var entrada1 = '';
    var entrada2 = ''
    var entrada3 = '';
    var Cardhold = '';
    var Assinatura = '';
    var notas = '';

    SalvarVari(0);

    criarNovoItem();

    function SalvarVari(x) {
        const DS = JSON.parse(localStorage.getItem('DadosSalvosRegis'));

        const DadosAtuais = {
            nome: nome,
            entrada1: entrada1,
            entrada2: entrada2,
            entrada3: entrada3,
            Cardhold: Cardhold,
            Assinatura: Assinatura,
            notas: notas
        };

        if (x || !DS) {
            localStorage.setItem('DadosSalvosRegis', JSON.stringify(DadosAtuais));
        } else {
            nome = DS.nome;
            entrada1 = DS.entrada1;
            entrada2 = DS.entrada2;
            entrada3 = DS.entrada3;
            Cardhold = DS.Cardhold;
            Assinatura = DS.Assinatura;
            notas = DS.notas;
        }
    }

    function adicionarEventos(innerDiv, additionalContent) {
        innerDiv.addEventListener('click', function() {
            if (additionalContent.style.display === 'none') {
                additionalContent.style.display = 'flex';
            } else {
                additionalContent.style.display = 'none';
            }
        });
    }

    function criarNovoItem() {
        var novoItem = document.createElement('div');
        novoItem.id = 'novoItem';
        novoItem.className = 'StyledNavListItem-sc-18cj2v7-0 bbgdDD';
        novoItem.style.width = 'auto';
        novoItem.style.height = '40px';
        novoItem.style.background = 'rgba(195, 0, 0, 0)';
        novoItem.style.display = 'flex';
        novoItem.style.justifyContent = 'center';
        novoItem.style.alignItems = 'center';

        var innerDiv = criarInnerDiv();
        novoItem.appendChild(innerDiv);

        var additionalContent = criarAdditionalContent();
        novoItem.appendChild(additionalContent);

        adicionarEventos(innerDiv, additionalContent);

        var xpath = "/html/body/div[1]/div[8]/div[3]/div/div/nav/ul[1]";
        var tempoInicio = Date.now();
        var tempoLimite = 10000; // 10 segundos

        var intervalo = setInterval(function() {
            var resultado = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var alvo = resultado.singleNodeValue;
            if (alvo) {
                alvo.appendChild(novoItem);
                console.log("Seletor encontrado.");
                clearInterval(intervalo);
            } else if (Date.now() - tempoInicio > tempoLimite) {
                console.log("Tempo limite atingido. Seletor não encontrado.");
                clearInterval(intervalo);
            } else {
                console.log("Tentando novamente...");
            }
        }, 500); // Tenta a cada 500 milissegundos

        document.addEventListener('click', function(event) {
            if (!novoItem.contains(event.target) && !innerDiv.contains(event.target)) {
                additionalContent.style.display = 'none';
            }
            encontrarTk();
        });
    }

    function criarInnerDiv() {
        var innerDiv = document.createElement('div');
        innerDiv.id = 'innerDiv';
        innerDiv.style.color = 'rgb(111, 49, 14)';
        innerDiv.style.display = 'flex';
        innerDiv.style.alignItems = 'center';
        innerDiv.style.borderRadius = '50%';
        innerDiv.style.justifyContent = 'center';
        innerDiv.style.fontSize = '25px';
        innerDiv.style.cursor = 'pointer';
        innerDiv.innerHTML = '⚜';
        return innerDiv;
    }

    function criarAdditionalContent() {
        var additionalContent = document.createElement('div');
        additionalContent.id = 'additionalContent';
        additionalContent.style.position = 'absolute';
        additionalContent.style.left = '110%';
        additionalContent.style.top = '14%';
        additionalContent.style.display = 'none';
        additionalContent.style.alignItems = 'center';
        additionalContent.style.flexDirection = 'column';

        var contentBox = criarContentBox();
        additionalContent.appendChild(contentBox);

        var contentBox2 = criarContentBox2();
        additionalContent.appendChild(contentBox2);

        return additionalContent;
    }

    function CriarLinha(x) {
        var a = document.createElement('div');
        a.id = `CReglinha${x}`;
        a.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        justify-content: center;
       `;
        return a;
    }

    function criarContentBox() {

        var contentBox = document.createElement('div');
        contentBox.id = 'contentBox';
        contentBox.style.cssText = `
        display: flex;
        background-color: rgb(255, 236, 209);
        border: 3px solid rgb(255, 112, 32);
        border-radius: 15px;
        padding: 8px;
        flex-direction: column;
        `;

        const linha1 = CriarLinha(1);
        const linha1T1 = document.createElement('p');
        linha1T1.textContent = 'O(A) ';

        const linha1in = CriarInput(0);
        linha1in.id = 'input1';
        linha1in.value = nome;
        linha1in.addEventListener('input', () => {
            nome = linha1in.value;
            SalvarVari(1);
        });

        const linha1T2 = document.createElement('p');
        linha1T2.textContent = ' entrou em contato solicitando:';

        linha1.appendChild(linha1T1);
        linha1.appendChild(linha1in);
        linha1.appendChild(linha1T2);

        contentBox.appendChild(linha1);

        const linha2 = CriarLinha(2);

        const linha2in = CriarInput(1,'Solicitação');
        linha2in.value = entrada1;

        linha2in.addEventListener('input', () => {
            linha2in.style.height = 'auto'; // Reset height
            linha2in.style.height = linha2in.scrollHeight + 'px'; // Set new height
            entrada1 = linha2in.value;
            SalvarVari(1);
        });

        linha2.appendChild(linha2in);

        contentBox.appendChild(linha2);

        const linha3 = CriarLinha(3);

        const linha3T1 = document.createElement('p');
        linha3T1.textContent = 'Foi realizada a verificação no sistema e constatado que:';

        linha3.appendChild(linha3T1);
        contentBox.appendChild(linha3);

        const linha4 = CriarLinha(4);
        const linha4in = CriarInput(1,'Situação');
        linha4in.value = entrada2;
        linha4in.addEventListener('input', () => {
            linha4in.style.height = 'auto'; // Reset height
            linha4in.style.height = linha4in.scrollHeight + 'px'; // Set new height
            entrada2 = linha4in.value;
            SalvarVari(1);
        });
        linha4.appendChild(linha4in);
        contentBox.appendChild(linha4);

        const linha5 = CriarLinha(5);
        const linha5T1 = document.createElement('p');
        linha5T1.textContent = 'A solicitação foi atendida da seguinte forma:';
        linha5.appendChild(linha5T1);
        contentBox.appendChild(linha5);

        const linha6 = CriarLinha(6);
        const linha6in = CriarInput(1,'Resultado');
        linha6in.value = entrada3;
        linha6in.addEventListener('input', () => {
            linha6in.style.height = 'auto'; // Reset height
            linha6in.style.height = linha6in.scrollHeight + 'px'; // Set new height
            entrada3 = linha6in.value;
            SalvarVari(1);
        });
        linha6.appendChild(linha6in);
        contentBox.appendChild(linha6);

        var buttonContainer = document.createElement('div');
        buttonContainer.id = 'buttonContainer';
        buttonContainer.style.cssText = `
        display: flex;
        justify-content: space-evenly;
        `;

        const botlimpar = CriarBotLimpar();
        botlimpar.addEventListener('click', function() {
            linha1in.value = '';
            linha2in.value = '';
            linha2in.style.height = '25px';
            linha4in.value = '';
            linha4in.style.height = '25px';
            linha6in.value = '';
            linha6in.style.height = '25px';
        });
        buttonContainer.appendChild(botlimpar);

        const copyButton = CriarBotCopiar();

        copyButton.addEventListener('click', function() {
            var textnome = linha1in.value || linha1in.placeholder;
            var variant1;
            if(linha4in.value !== ''){
                variant1 = linha3T1.textContent + "\n" +
                    linha4in.value + "\n\n";
            }else{
                variant1 = '';
            }
            var variant2;
            if(linha6in.value !== ''){
                variant2 = linha5T1.textContent + "\n" +
                    linha6in.value + '.';
            }else{
                variant2 = '';
            }
            var textToCopy = linha1T1.textContent + textnome + linha1T2.textContent + "\n" +
                linha2in.value + "\n\n" +
                variant1 +
                variant2
            ;

            navigator.clipboard.writeText(textToCopy).then(function() {
                console.log('Texto copiado com sucesso.');
            }, function(err) {
                console.error('Erro ao copiar texto: ', err);
            });

        });

        buttonContainer.appendChild(copyButton);

        contentBox.appendChild(buttonContainer);

        return contentBox;
    }

    function CriarBotCopiar(){
        var a = document.createElement('button');
        a.style.cssText = `
        background-color: rgb(51, 203, 68);
        cursor: pointer;
        border-radius: 15px;
        border: none;
        color: white;
        padding: 3px 9px;
        margin: 3px;
        `;
        a.textContent = 'Copiar';
        return a;
    }

    function CriarBotLimpar(){
        var a = document.createElement('button');
        a.style.cssText = `
        cursor: pointer;
        border-radius: 15px;
        border: none;
        color: white;
        padding: 3px 9px;
        margin: 3px;
        background-color: rgb(147, 176, 205);
        `;
        a.textContent = 'Limpar';
        return a;
    }

    function CriarInput(textarea,placeholder){
        var a = textarea ? 'textarea' : 'input' ;
        var b = document.createElement(a);
        b.style.cssText = `
        margin: 0px 5px;
        width: 80px;
        border-radius: 10px;
        padding: 1px;
        text-align: center;
        border-bottom: 2px solid rgb(209, 0, 0);
        `;
        if(textarea){
            b.placeholder = placeholder;
            b.style.width = '100%';
            b.style.height = '25px';
            b.style.overflow = 'hidden';
            b.style.resize = 'none';
            b.addEventListener('input', () => {
                b.style.height = 'auto'; // Reset height
                b.style.height = b.scrollHeight + 'px'; // Set new height
            });

        }
        return b;
    }

    function criarContentBox2() {
        var contentBox2 = document.createElement('div');
        contentBox2.id = 'contentBox2';
        contentBox2.style.cssText = `
        display: flex;
        background-color: rgb(255, 236, 209);
        border: 3px solid rgb(255, 112, 32);
        border-radius: 15px;
        padding: 8px;
        margin-top: 10px;
        flex-direction: column;
        `;

        var paragraph21 = document.createElement('p');
        paragraph21.id = 'paragraph21';
        paragraph21.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

        const botCop5 = CriarBotCopiar();

        const botlim5 = CriarBotLimpar();

        const Input5 = CriarInput(0);
        Input5.placeholder = 'XXXXXXX';
        Input5.id = 'input5';

        var TextoTick = document.createElement('p');
        TextoTick.textContent = 'Ticket ';

        botCop5.addEventListener('click', function() {
            var a = Input5.value || Input5.placeholder;
            var b = TextoTick.textContent + a;

            navigator.clipboard.writeText(b).then(function() {
                console.log('Texto copiado com sucesso.');
            }, function(err) {
                console.error('Erro ao copiar texto: ', err);
            });
        });
        botlim5.addEventListener('click', function() {
            Input5.value = '';
        });

        paragraph21.appendChild(botlim5);
        paragraph21.appendChild(TextoTick);
        paragraph21.appendChild(Input5);
        paragraph21.appendChild(botCop5);

        contentBox2.appendChild(paragraph21);

        var Cardholder = document.createElement('div');
        Cardholder.id = 'paragraph22';
        Cardholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

        var TextoLAss = document.createElement('p');
        TextoLAss.textContent = 'cardholdername-';

        const botCop6 = CriarBotCopiar();

        const botlim6 = CriarBotLimpar();

        const Input6 = CriarInput(0);
        Input6.placeholder = 'XXXXXXX';
        Input6.value = Cardhold;

        // Criar o elemento sizer invisível
        const sizer = document.createElement('span');
        sizer.style.position = 'absolute';
        sizer.style.top = '-9999px';
        sizer.style.left = '-9999px';
        sizer.style.visibility = 'hidden';
        sizer.style.whiteSpace = 'pre';
        sizer.style.fontSize = getComputedStyle(Input6).fontSize;
        sizer.style.fontFamily = getComputedStyle(Input6).fontFamily;
        document.body.appendChild(sizer);

        // Atualizar largura conforme o texto
        Input6.addEventListener('input', function() {
            sizer.textContent = Input6.value || Input6.placeholder;
            Input6.style.width = sizer.offsetWidth + 'px';
            Cardhold = Input6.value;
            SalvarVari(1);
        });

        // Inicializar com o placeholder
        sizer.textContent = Input6.placeholder;
        Input6.style.width = sizer.offsetWidth + 'px';

        botCop6.addEventListener('click', function() {
            var textToCopy = TextoLAss.textContent + Input6.value ;

            navigator.clipboard.writeText(textToCopy).then(function() {
                console.log('Texto copiado com sucesso.');
            }, function(err) {
                console.error('Erro ao copiar texto: ', err);
            });
        });

        botlim6.addEventListener('click', function() {
            Input6.value = '';
            sizer.textContent = Input6.placeholder;
            Input6.style.width = sizer.offsetWidth + 'px';
        });

        Cardholder.appendChild(botlim6);
        Cardholder.appendChild(TextoLAss);
        Cardholder.appendChild(Input6);
        Cardholder.appendChild(botCop6);

        contentBox2.appendChild(Cardholder);

        var ClinhaAssin = document.createElement('p');
        ClinhaAssin.id = 'ClinhaAssin';
        ClinhaAssin.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        `;

        const botCop7 = CriarBotCopiar();

        const botlim7 = CriarBotLimpar();

        const Input7 = CriarInput(0);
        Input7.placeholder = 'ALMAVIVA.XXXXXXX-0300-MCZ';
        Input7.value = Assinatura;

        Input7.addEventListener('input', function() {
            sizer.textContent = Input7.value || Input7.placeholder;
            Input7.style.width = sizer.offsetWidth + 'px';
            Assinatura = Input7.value;
            SalvarVari(1);
        });

        // Inicializar com o placeholder
        sizer.textContent = Input7.placeholder;
        Input7.style.width = sizer.offsetWidth + 'px';


        botCop7.addEventListener('click', function() {
            var textToCopy = Input7.value ;

            navigator.clipboard.writeText(textToCopy).then(function() {
                console.log('Texto copiado com sucesso.');
            }, function(err) {
                console.error('Erro ao copiar texto: ', err);
            });
        });

        botlim7.addEventListener('click', function() {
            Input7.value = '';
            sizer.textContent = Input7.placeholder;
            Input7.style.width = sizer.offsetWidth + 'px';
        });


        ClinhaAssin.appendChild(botlim7);
        ClinhaAssin.appendChild(Input7);
        ClinhaAssin.appendChild(botCop7);

        contentBox2.appendChild(ClinhaAssin);

        const CaixadBDnotas = document.createElement('div');
        CaixadBDnotas.style.cssText = `
        margin-top: 5%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
       `;

        const BDnotas = document.createElement('textarea');
        BDnotas.id = 'notepad'; // Aqui estava o erro
        BDnotas.placeholder = "Escreva suas notas aqui...";
        BDnotas.style.cssText = `
        width: 320px;
        height: 80px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        `;
        BDnotas.addEventListener('blur', saveNotes);


        const exibirSalvo = document.createElement('div');
        exibirSalvo.textContent = 'Salvo!';
        exibirSalvo.id = 'message';
        exibirSalvo.style.cssText = `
                border-radius: 15px;
    border: none;
    color: white;
    padding: 3px 9px;
    background-color: #33cb44;
    display: none;
    justify-content: center;
    align-items: center;
    position: absolute;
            `;
        BDnotas.value = notas;

        CaixadBDnotas.append(BDnotas, exibirSalvo);
        contentBox2.appendChild(CaixadBDnotas);


        // Função para salvar notas
        function saveNotes() {
            notas = document.getElementById('notepad').value;
            SalvarVari(1);
            showMessage();
        }
        // Função para mostrar a mensagem de salvo
        function showMessage() {
            const message = document.getElementById('message');
            message.style.display = 'flex';
            setTimeout(() => {
                message.style.display = 'none';
            }, 500);
        }

        return contentBox2;
    }

    function encontrarNome() {
        var elemento = document.querySelector('span.ember-view.btn[data-test-id="tabs-nav-item-users"]');
        var input1 = document.getElementById('input1');

        if (elemento) {
            var conteudo = elemento.innerHTML.trim();
            var palavras = conteudo.split(' ');
            if (palavras.length > 0) {
                var primeiraPalavra = palavras[0];
                if (input1) {
                    if (!isNaN(primeiraPalavra)) {
                        input1.placeholder = 'Anônimo';
                    } else {
                        var primeiraPalavraFormatada = primeiraPalavra.charAt(0).toUpperCase() + primeiraPalavra.slice(1).toLowerCase();
                        input1.placeholder = primeiraPalavraFormatada;
                    }
                } else {
                    console.error('Elemento com id="input1" não encontrado.');
                }
            } else {
                console.log('Nenhuma palavra encontrada.');
            }
        } else {
            if (input1) {
                input1.placeholder = 'Anônimo';
            }
            console.error('Elemento não encontrado.');
        }
    }

    function encontrarTk() {
        const input5 = document.getElementById('input5');

        var urlAtual = window.location.href;
        var partes = urlAtual.split('/');
        var ultimaParte = partes[partes.length - 1];
        var valorNumerico = ultimaParte.match(/\d+/);

        if (valorNumerico) {
            input5.placeholder = valorNumerico;
            console.log('Valor numérico após a última "/":', valorNumerico[0]);
        } else {
            input5.placeholder = '000000';
            console.log('Nenhum valor numérico encontrado após a última "/"');
        }
        encontrarNome();
    }

    // Your code here...
})();
