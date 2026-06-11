# 🛠️ Exemplos Práticos - Implementação Profissional

## 1. Como Adicionar um Novo Campo

### Passo 1: Identifique o tipo de campo
- Texto simples → `ClassicTextualEdit`
- Número → `ClassicNumberEdit`
- Data → `ClassicDatePicker`
- Sim/Não → `ClassicCheckbox`

### Passo 2: Crie o Card com padrão nomeado

**Exemplo: Adicionar campo "Data do Relatório"**

```yaml
- CardDataDoRelatório:
    Control: TypedDataCard@1.0.7
    Variant: ClassicDatePicker
    IsLocked: true
    Description: "Campo para seleção da data do relatório"
    Properties:
      BorderColor: =$Color_LightGray
      DataField: ="DataRelatorio"
      Default: =Today()
      DisplayName: ="Data do Relatório"
      Required: =true
      Update: =CardDataDoRelatório_Input.Value
      Width: =266
      X: =0
      Y: =4
    Children:
      - CardDataDoRelatório_Label:
          Control: Label@2.5.1
          MetadataKey: FieldName
          Properties:
            AutoHeight: =true
            BorderColor: =$Color_Border
            Color: =$Color_DarkGray
            Font: =$Font_Family
            FontWeight: =$FontWeight_Semibold
            Height: =34
            Text: =Parent.DisplayName
            Width: =Parent.Width - 60
            X: =30
            Y: =$Spacing_Default

      - CardDataDoRelatório_Input:
          Control: Classic/DatePicker@2.0.0
          MetadataKey: FieldValue
          Properties:
            Default: =Parent.Default
            DisplayMode: =Parent.DisplayMode
            Format: ="dd/mm/yyyy"
            Tooltip: =Parent.DisplayName
            Width: =Parent.Width - 60
            X: =30
            Y: =CardDataDoRelatório_Label.Y + CardDataDoRelatório_Label.Height + $Spacing_Small

      - CardDataDoRelatório_ErrorMsg:
          Control: Label@2.5.1
          MetadataKey: ErrorMessage
          Properties:
            Color: =$Color_Error
            Font: =$Font_Family
            Text: =Parent.Error
            Visible: =Parent.DisplayMode=DisplayMode.Edit
            Width: =Parent.Width - 60
            X: =30
            Y: =CardDataDoRelatório_Input.Y + CardDataDoRelatório_Input.Height

      - CardDataDoRelatório_RequiredIndicator:
          Control: Label@2.5.1
          MetadataKey: FieldRequired
          Properties:
            Color: =$Color_Error
            Font: =$Font_Family
            Text: ="*"
            Visible: =And(Parent.Required, Parent.DisplayMode=DisplayMode.Edit)
            Width: =30
            Y: =CardDataDoRelatório_Label.Y
```

---

## 2. Como Modificar Cores da Aplicação

### Antes (Código Original - ❌ Ruim)
```yaml
Properties:
  Fill: =RGBA(0, 120, 212, 1)  # Azul primário
  HoverFill: =RGBA(16, 110, 190, 1)  # Azul hover
  PressedFill: =RGBA(0, 100, 192, 1)  # Azul pressionado
  # ... repetido em 50 lugares diferentes
```

**Problema:** Se você quiser mudar a cor primária, precisa alterar em 50 lugares! 😱

### Depois (Design Tokens - ✅ Bom)
```yaml
# No topo do arquivo, defina uma vez:
$Color_Primary: =RGBA(0, 120, 212, 1)

# Use em todos os componentes:
Properties:
  Fill: =$Color_Primary
  HoverBorderColor: =$Color_PrimaryHover
  PressedBorderColor: =$Color_Primary
```

**Benefício:** Alterar cor = mudar uma linha! 🎉

---

## 3. Como Mudar o Tema da Aplicação (Exemplo: Verde)

**Passo 1:** Localize a seção Design Tokens no topo do arquivo

**Passo 2:** Modifique apenas estas linhas:

```yaml
# ========== DESIGN TOKENS ==========
# Color Palette (TEMA: VERDE)
$Color_White: =RGBA(255, 255, 255, 1)
$Color_LightGray: =RGBA(245, 245, 245, 1)
$Color_DarkGray: =RGBA(50, 49, 48, 1)
$Color_MediumGray: =RGBA(161, 159, 157, 1)
$Color_BackgroundGray: =RGBA(242, 242, 241, 0)

# ALTERADAS PARA VERDE:
$Color_Primary: =RGBA(34, 139, 34, 1)          # Verde floresta
$Color_PrimaryHover: =RGBA(46, 181, 46, 1)    # Verde mais claro
$Color_Error: =RGBA(168, 0, 0, 1)              # Mantém vermelho

# Typography (sem mudanças)
$Font_Family: =Font.'Segoe UI'
$FontWeight_Semibold: =FontWeight.Semibold

# Spacing (sem mudanças)
$Padding_Standard: =8
```

**Resultado:** Toda a aplicação fica com tema verde! 🟢

---

## 4. Como Reutilizar um Componente

### Exemplo: Criar uma galeria de cartões

```yaml
- RelatóriosList:
    Control: Gallery@2.0.0
    Description: "Galeria de relatórios cadastrados"
    Properties:
      DataSource: =Relatorios
      Layout: =Layout.Vertical
      Height: =600
      Width: =600
    Children:
      - CardContainer:
          Control: GroupContainer@1.5.0
          Properties:
            Fill: =$Color_White
            BorderColor: =$Color_LightGray
            PaddingLeft: =$Padding_Standard
            PaddingRight: =$Padding_Standard
            PaddingTop: =$Padding_Standard
            PaddingBottom: =$Padding_Standard
            RadiusBottomLeft: =$BorderRadius_Default
            RadiusBottomRight: =$BorderRadius_Default
            RadiusTopLeft: =$BorderRadius_Default
            RadiusTopRight: =$BorderRadius_Default
          Children:
            - RelatórioTítulo:
                Control: Label@2.5.1
                Properties:
                  Text: =ThisItem.Title
                  Font: =$Font_Family
                  FontWeight: =$FontWeight_Semibold
                  Color: =$Color_DarkGray
                  Size: =18

            - RelatórioSubtítulo:
                Control: Label@2.5.1
                Properties:
                  Text: =ThisItem.localizador
                  Font: =$Font_Family
                  Color: =$Color_MediumGray
                  Size: =14
```

---

## 5. Validação de Campos

### Adicionar validação de email

```yaml
CardEmail:
  Properties:
    Update: =CardEmail_Input.Text
    # Adicione esta linha:
    # Validator: =If(IsBlank(CardEmail_Input.Value), "Campo obrigatório", If(IsMatch(CardEmail_Input.Value, "\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "", "Email inválido"))

- CardEmail_ErrorMsg:
    Control: Label@2.5.1
    Properties:
      Color: =$Color_Error
      Text: =Parent.Error
      Visible: =Parent.DisplayMode=DisplayMode.Edit And Not(IsBlank(Parent.Error))
```

### Adicionar validação de número

```yaml
CardValor:
  Properties:
    Update: =Value(CardValor_Input.Text)
    # Validator: =If(Value(CardValor_Input.Text) < 0, "Valor deve ser positivo", "")
```

---

## 6. Como Melhorar a Responsividade

### Adaptar para mobile (reduzir de 3 colunas para 1)

```yaml
# Crie variables baseadas em screen width:
$Is_Mobile: =Screen.Size < 768
$Grid_Columns: =If($Is_Mobile, 1, 3)
$Card_Width: =If($Is_Mobile, Screen.Width - 40, 266)

# Use na posição dos cards:
- CardTítulo:
    Properties:
      Width: =$Card_Width
      X: =If($Grid_Columns = 1, 0, 0)
      Y: =If($Grid_Columns = 1, 0, 0)
```

---

## 7. Como Adicionar Hover Effects

### Efeito de sombra ao passar mouse

```yaml
CardTítulo:
  Properties:
    Shadow: =If(CardTítulo_Input.HoverFill <> Blank, 
                ShadowProperties(12, RGBA(0, 0, 0, 0.15)),
                ShadowProperties(0, RGBA(0, 0, 0, 0)))
    
    # Ou para GroupContainer:
    FillPortions: =If(IsHover(CardTítulo), 0.98, 1)  # Ligeira mudança de opacidade
```

---

## 8. Padrão de Boas Práticas - Checklist

Sempre que adicionar um novo componente:

- [ ] Nomeação segue o padrão `Card[NomeDoCampo]`
- [ ] Usa tokens de design (`$Color_Primary`, etc.)
- [ ] Tem descrição (`Description: "..."`)
- [ ] Tem tooltip para usuários
- [ ] Validação de dados apropriada
- [ ] Mensagem de erro clara
- [ ] Indicador visual para campos obrigatórios
- [ ] Comentário de seção (para novos grupos)
- [ ] Testado em diferentes tamanhos de tela

---

## 9. Exemplo Completo: Adicionar Campo Obrigatório com Validação

```yaml
- CardCPF:
    Control: TypedDataCard@1.0.7
    Variant: ClassicTextualEdit
    IsLocked: true
    Description: "Campo para entrada de CPF (somente números)"
    Properties:
      BorderColor: =$Color_LightGray
      DataField: ="CPF"
      Default: =ThisItem.CPF
      DisplayName: ="CPF"
      MaxLength: =11
      Required: =true  # ← CAMPO OBRIGATÓRIO
      Update: =CardCPF_Input.Text
      Width: =266
      X: =0
      Y: =0
    Children:
      - CardCPF_Label:
          Control: Label@2.5.1
          Properties:
            Text: =Parent.DisplayName & If(Parent.Required, " *", "")
            Color: =$Color_DarkGray
            Font: =$Font_Family
            FontWeight: =$FontWeight_Semibold

      - CardCPF_Input:
          Control: Classic/TextInput@2.3.2
          Properties:
            Default: =Parent.Default
            MaxLength: =11
            # Validação: apenas números
            OnChange: =Set(varCPFErro, If(IsMatch(Self.Value, "^\d{11}$"), "", "CPF deve ter 11 dígitos"))
            BorderColor: =If(varCPFErro <> "", Color.Red, =$Color_LightGray)

      - CardCPF_ErrorMsg:
          Control: Label@2.5.1
          Properties:
            Text: =varCPFErro
            Color: =$Color_Error
            Visible: =varCPFErro <> ""
```

---

## 10. Template para Novo Campo

```yaml
# Copie e adapte este template:

- Card[SeuNomeAqui]:
    Control: TypedDataCard@1.0.7
    Variant: ClassicTextualEdit  # ← Altere conforme tipo
    IsLocked: true
    Description: "[Descrição clara do campo]"
    Properties:
      BorderColor: =$Color_LightGray
      DataField: ="[NomeDoCampoNoBancoDados]"
      Default: =ThisItem.[NomeDoCampo]
      DisplayName: ="[Rótulo visível ao usuário]"
      MaxLength: =DataSourceInfo([@Relatorios], DataSourceInfo.MaxLength, [NomeDoCampo])
      Required: =false  # ← Altere para true se obrigatório
      Update: =Card[SeuNomeAqui]_Input.Text
      Width: =266
      X: =0  # ← Altere X conforme posição (0, 1, ou 2 para 3 colunas)
      Y: =0  # ← Altere Y conforme linha
    Children:
      - Card[SeuNomeAqui]_Label:
          Control: Label@2.5.1
          MetadataKey: FieldName
          Properties:
            Text: =Parent.DisplayName
            Color: =$Color_DarkGray
            Font: =$Font_Family
            FontWeight: =$FontWeight_Semibold

      - Card[SeuNomeAqui]_Input:
          Control: Classic/TextInput@2.3.2
          MetadataKey: FieldValue
          Properties:
            Default: =Parent.Default
            DisplayMode: =Parent.DisplayMode

      - Card[SeuNomeAqui]_ErrorMsg:
          Control: Label@2.5.1
          MetadataKey: ErrorMessage
          Properties:
            Color: =$Color_Error
            Text: =Parent.Error
            Visible: =Parent.DisplayMode=DisplayMode.Edit

      - Card[SeuNomeAqui]_RequiredIndicator:
          Control: Label@2.5.1
          MetadataKey: FieldRequired
          Properties:
            Text: ="*"
            Visible: =And(Parent.Required, Parent.DisplayMode=DisplayMode.Edit)
```

---

**Dica Final:** 💡  
Sempre que quiser fazer uma alteração em toda a aplicação (cores, espaçamento, etc.), procure pelos Design Tokens no topo do arquivo. A manutenção fica muito mais rápida!
