const CConfig = {
    TempoEscaladoHoras: '06:20:00',
    ValorMetaTMA: 725,
    ModoSalvo: 1,
    Vigia: 1,
    MetaTMA: 1,
    ValorAuto: 10,
    AutoAtivo: 1,
    TolerOff: 40,
    MostraOff: 0,
    IgnorarOff: 0,
    MostraValorOff: 0,
    FaixaFixa: 0,
    IgnorarTMA: 0,
    IgnorarErroNice: 0
};

const Ccor = {
    Offline: '#c97123',
    Atualizando: '#c97123',
    Erro: '#992e2e',
    MetaTMA: '#c97123',
    Principal: '#4a9985',
    Config: '#96a8bb'
};

 function SalvandoVari(a) {

    let AsVari = {
        CConfig: { ...CConfig },
        Ccor: { ...Ccor }
    };

    function ondemudar(x) {
    Object.assign(CConfig, x.CConfig);
    Object.assign(Ccor, x.Ccor);
}


    switch (a) {
        case 1:
            AddOuAtuIindexdb(ChaveConfig, AsVari);
            ondemudar(AsVari);
            break;

        case 2:
            if (typeof PCConfig !== 'undefined' && typeof PCcor !== 'undefined') {
                AsVari.CConfig = { ...PCConfig };
                AsVari.Ccor = { ...PCcor };
                AddOuAtuIindexdb(ChaveConfig, AsVari);
                ondemudar(AsVari);
            } else {
                console.warn('PCConfig ou PCcor não estão definidos.');
            }
            break;

        case 3:
            if (typeof dadosSalvosConfi !== 'undefined') {
                ondemudar(dadosSalvosConfi);
                console.log(`NiceMonk Dados em ${ChaveConfig}:`, dadosSalvosConfi);
            } else {
                console.log(`NiceMonk Não foram encontrados dados em ${ChaveConfig}, restaurado ao padrão:`, dadosSalvosConfi);
                SalvandoVari(2);
            }
            break;

        default:
            console.warn('Parâmetro inválido para SalvandoVari:', a);
    }
}