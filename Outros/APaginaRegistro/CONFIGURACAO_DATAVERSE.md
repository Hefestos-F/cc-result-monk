# Guia de Configuração - Dataverse com MSAL

## 📋 Visão Geral
Este site foi migrado de Firebase para **Microsoft Dataverse** com autenticação **MSAL (Microsoft Authentication Library)**.

---

## 🔧 Passo 1: Configurar Aplicação no Azure AD

### 1.1 - Registrar Aplicação
1. Acesse [Portal do Azure](https://portal.azure.com/)
2. Vá para **Azure Active Directory** → **Registros de aplicativo**
3. Clique em **+ Novo registro**
4. Preencha:
   - **Nome**: "Relatórios Dataverse"
   - **Tipos de conta suportados**: "Contas em qualquer diretório organizacional"
   - **URI de redirecionamento**: `http://localhost:3000` (para testes) ou sua URL de produção
5. Clique em **Registrar**

### 1.2 - Copiar Credenciais
Após registrar, copie:
- **Client ID** (Application ID)
- **Tenant ID** (Código do Diretório)

---

## 🔐 Passo 2: Configurar Permissões

1. No registro criado, vá para **Permissões de API**
2. Clique em **+ Adicionar uma permissão**
3. Selecione **APIs que minha organização usa** e procure por **Dynamics CRM**
4. Marque **user_impersonation** e clique em **Adicionar permissões**
5. Clique em **Fornecer consentimento do administrador**

---

## 📝 Passo 3: Atualizar Configurações no Código

Edite `relatorios.js` e substitua:

```javascript
const msalConfig = {
  auth: {
    clientId: "SEU_CLIENT_ID",  // ← Substitua com seu Client ID
    authority: "https://login.microsoftonline.com/SEU_TENANT_ID", // ← Substitua com seu Tenant ID
    redirectUri: window.location.origin
  }
};

const DATAVERSE_ORG = "orgaf426786"; // ← Substitua com sua organização Dataverse
const DATAVERSE_SCOPE = `https://${DATAVERSE_ORG}.crm.dynamics.com/.default`;
```

### Onde encontrar estas informações:
- **Client ID**: Portal Azure → Registros de aplicativo → Visão geral
- **Tenant ID**: Portal Azure → Azure AD → Informações da organização
- **Dataverse ORG**: No seu ambiente Dynamics 365 → Configurações → URL da organização

---

## 🗂️ Passo 4: Mapeamento de Campos Dataverse

O código mapeia automaticamente os campos do Dataverse. Certifique-se que sua tabela possui:

| Campo Dataverse | Descrição |
|---|---|
| `cr1e5_ticket` | Ticket |
| `cr1e5_localizador` | Localizador |
| `cr1e5_contato` | Contato |
| `cr1e5_waiver` | Waiver |
| `cr1e5_motivo` | Motivo Waiver |
| `cr1e5_isentoudu` | Isentou DU |
| `cr1e5_motivodu` | Motivo DU |
| `cr1e5_utilizouinvoice` | Possui Infant |
| `cr1e5_empresainvoice` | Emissor da Reserva |
| `cr1e5_valorinvoice` | Invoice |
| `cr1e5_realizoupagamento` | Link de Pagamento |
| `cr1e5_link` | Erro no Link |
| `cr1e5_datahora` | Data/Hora |
| `cr1e5_assinatura` | Assinatura |

**Se seus campos têm nomes diferentes**, atualize a função `normalizarRegistro()` em `relatorios.js`.

---

## ✅ Passo 5: Testar a Integração

1. Abra `relatorios.html` no navegador
2. Clique no botão **"Entrar com Microsoft"**
3. Faça login com sua conta Microsoft
4. Verifique se os filtros carregam corretamente
5. Teste a filtragem e exportação

---

## 🚨 Resolução de Problemas

### "Erro: clientId não definido"
- Verifique se substituiu `SEU_CLIENT_ID` no código

### "Erro 401 Unauthorized"
- Verifique se o token está sendo obtido corretamente
- Confirme as permissões no Azure AD
- Verifique se a URL da organização Dataverse está correta

### "Nenhum registro encontrado"
- Verifique se há dados na tabela `cr1e5_registrodeatendimentos`
- Ajuste o `$top=5000` em `buscarRegistrosDataverse()` se necessário
- Verifique os nomes dos campos em seu Dataverse

### Registros não aparecem após login
- Abra o console (F12) e verifique os erros
- Confirme que a autenticação foi bem-sucedida
- Verifique se `mainContent` está sendo exibido

---

## 📦 Dependências

O arquivo HTML carrega automaticamente:
- **MSAL.js** 2.38.1 - Autenticação Microsoft
- **XLSX** 0.18.5 - Exportação para Excel

---

## 🔄 Fluxo de Funcionamento

1. **Página carrega** → Verifica se há conta autenticada
2. **Usuário clica "Entrar"** → MSAL abre popup de login
3. **Após login** → Token é obtido automaticamente
4. **Carrega registros** → Faz chamada GET à API Dataverse
5. **Exibe filtros** → Popula os selects com valores únicos
6. **Filtra dados** → Usa lógica cliente (sem chamadas adicionais)
7. **Exporta Excel** → Usa dados em cache

---

## 💡 Próximas Melhorias (Opcional)

- Adicionar função de **criar novo registro** (POST)
- Adicionar função de **atualizar registro** (PATCH)
- Adicionar função de **deletar registro** (DELETE)
- Implementar **paginação na API** para datasets maiores
- Adicionar **filtros de data** mais avançados

---

## 📞 Suporte

Para mais informações sobre:
- **MSAL.js**: https://github.com/AzureAD/microsoft-authentication-library-for-js
- **Dataverse API**: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview
- **Azure AD**: https://learn.microsoft.com/en-us/azure/active-directory/
