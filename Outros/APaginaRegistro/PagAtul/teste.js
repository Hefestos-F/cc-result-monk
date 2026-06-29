
If(
    IsBlank(InputTicket.Text)||
    IsBlank(InputContato.Text)||
    IsBlank(InputDescAtend.Text)||
    IsBlank(InputAssinat.Text)||
    If(DropdownLink.Selected.n = "b";
    IsBlank(InputMotivoLink.Text)||
    IsBlank(InputBandeira.Text)||
    IsBlank(DropdownParcela.SelectedText.v)||
    IsBlank(InputCardhold.Text)
    ;IsBlank(InputAssinat.Text));
        Notify("Compos Obrigatorios Não Foram Preenchidos."; NotificationType.Error);
Set(
    varResultado;
    "Ticket: " & InputTicket.Text & Char(10) &
     Char(10) &
     If(!IsBlank(InputPNR.Text);"Localizador: " & InputPNR.Text & Char(10) &
    Char(10);"") &
      InputContato.Text & " " & InputDescAtend.Text & Char(10) & 
      Char(10) &
    "Utilizou Waiver: " & If(ToggleWaiver.Value; "Sim >" & DropdownMotivoWaiver.Selected.waiver & Char(10) &
        "Motivo Waiver: " & DropdownMotivoWaiver.Selected.motivo ; "Não") & Char(10) &
    "Isentou DU: " & If(ToggleDU.Value; "Sim > " & DropdownINFOrg.Selected.cod; "Não") & Char(10) &
    If(ToggleINF.Value; "Infant incluido > " & DropdownINFOrg.Selected.motivo & Char(10) &
        InputOrg.Text & Char(10)
        ; "")  & "Usou link de pagamento: " & If(DropdownLink.Selected.n = "b"; "não" & Char(10) & 
        "Motivo: " & InputMotivoLink.Text & Char(10) & 
        "Bandeira: " & InputBandeira.Text & Char(10) & 
        "Parcelamento: " & DropdownParcela.SelectedText.v & Char(10) & 
        "Cardholdername-" & InputCardhold.Text ;If(DropdownLink.Selected.n = "a";"Sim" ;"Não se aplica")) & Char(10) &
     Char(10) &
     "Assinatura: " & InputAssinat.Text & Char(10)
     
);;

// CASO CONTRÁRIO (se estiver preenchido), executa todo o resto do código abaixo:
    UpdateContext({ vRegistroExistente: LookUp('Registro de Atendimento'; cr683_numerodoticket = InputTicket.Text) });;

    Patch(
        'Registro de Atendimento';
        If(IsBlank(vRegistroExistente); Defaults('Registro de Atendimento'); vRegistroExistente);
        {
            cr683_numerodoticket: InputTicket.Text;
            cr683_contatodocliente: InputContato.Text;
            cr683_codigopnr: InputPNR.Text;
            cr683_usodewaiver: ToggleWaiver.Value;
            cr683_motivodousodewaiver: If(ToggleWaiver.Value;DropdownMotivoWaiver.Selected.waiver & " > " & DropdownMotivoWaiver.Selected.motivo;vRegistroExistente.cr683_motivodousodewaiver);
            cr683_isencaodedu: ToggleDU.Value;
            cr683_motivodaisencaodedu: If(ToggleDU.Value;DropdownMotivoDU.Selected.Value;vRegistroExistente.cr683_motivodaisencaodedu);
            cr683_inclusaodeinf: ToggleINF.Value;
            cr683_organizacaodainclusaoinf: If(ToggleINF.Value;DropdownINFOrg.Selected.motivo & " > " & DropdownINFOrg.Selected.cod;vRegistroExistente.cr683_organizacaodainclusaoinf);
            cr683_usodolinkdepagamento: DropdownLink.Selected.value;
            cr683_motivoparanaousodolinkdepagamento: If(DropdownLink.Selected.n = "b";InputMotivoLink.Text;vRegistroExistente.cr683_motivoparanaousodolinkdepagamento);
            cr683_assinatura: InputAssinat.Text;
            
            // Se for novo, grava o Now(). Se já existir, mantém a data de criação original.
            cr683_dataehoradoregistro: If(IsBlank(vRegistroExistente); Now(); vRegistroExistente.cr683_dataehoradoregistro);
            
            // Grava sempre a data/hora atual da ação (seja criação ou modificação)
            cr683_dataehoradamodificacao: Now()
        }
    );;

    Notify(
        If(IsBlank(vRegistroExistente); "Novo registro gravado com sucesso!"; "Registro atualizado com sucesso!"); 
        NotificationType.Success
    )

)

