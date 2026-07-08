
/*

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
    UpdateContext({ vRegistroExistente: LookUp('Registro de Atendimento'; Ticket = InputTicket.Text) });;

    Patch(
        'Registro de Atendimento';
        If(IsBlank(vRegistroExistente); Defaults('Registro de Atendimento'); vRegistroExistente);
        {
            Ticket: InputTicket.Text;
            Contato: InputContato.Text;
            PNR: InputPNR.Text;
            'Usou Waiver': ToggleWaiver.Value;
            'Motivo do uso de waiver': If(ToggleWaiver.Value;DropdownMotivoWaiver.Selected.waiver & " > " & DropdownMotivoWaiver.Selected.motivo;vRegistroExistente.'Motivo do uso de waiver');
            'Isentou DU': ToggleDU.Value;
            'Motivo da isenção de DU': If(ToggleDU.Value;DropdownMotivoDU.Selected.Value;vRegistroExistente.'Motivo da isenção de DU');
            'Incluiu INF': ToggleINF.Value;
            'Empresa emissora do PNR com INF': If(ToggleINF.Value;DropdownINFOrg.Selected.motivo & " > " & DropdownINFOrg.Selected.cod;vRegistroExistente.'Empresa emissora do PNR com INF');
            'Usou link pag': DropdownLink.Selected.value;
            'Motivo não usar link de pag.': If(DropdownLink.Selected.n = "b";InputMotivoLink.Text;vRegistroExistente.'Motivo não usar link de pag.');
            Assinatura: InputAssinat.Text;
            Usuario: If(IsBlank(vRegistroExistente);First(Split( User().Email;"@")).Value;vRegistroExistente.Usuario);
            'Modificado Por': First(Split( User().Email;"@")).Value;
        
            
            // Se for novo, grava o Now(). Se já existir, mantém a data de criação original.
            'Data e Hora': If(IsBlank(vRegistroExistente); Now(); vRegistroExistente.'Data e Hora');
            
            // Grava sempre a data/hora atual da ação (seja criação ou modificação)
            'Data e Hora da Modificação': Now()
        }
    );;

    Notify(
        If(IsBlank(vRegistroExistente); "Novo registro gravado com sucesso!"; "Registro atualizado com sucesso!"); 
        NotificationType.Success
    )

)

*/
