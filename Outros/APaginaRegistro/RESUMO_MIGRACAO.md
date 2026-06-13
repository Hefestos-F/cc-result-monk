# Migração Concluída: Firebase → Dataverse + MSAL

## 📊 Resumo das Alterações

Esta pasta foi **completamente migrada** de Firebase/Firestore para **Microsoft Dataverse** com autenticação **MSAL**.

---

## ✅ O que foi feito

### 1. **Removido completamente:**
- ❌ Todas as importações Firebase (`firebase-app.js`, `firebase-firestore.js`)
- ❌ Todas as funções Firebase (`initializeApp`, `getFirestore`, `getDocs`, `query`, `limit`)
- ❌ Configuração do `firebaseConfig` inteira
- ❌ Referências ao banco de dados `db`

### 2. **Adicionado:**
- ✅ Configuração MSAL (autenticação Microsoft)
- ✅ Configuração Dataverse (URL da organização, escopo)
- ✅ Funções de autenticação (`loginUser`, `logoutUser`, `updateLoginStatus`)
- ✅ Funções de token (`getAccessToken`)
- ✅ Wrapper para chamadas à API Dataverse (`fetchDataverse`)
- ✅ Busca de registros do Dataverse (`buscarRegistrosDataverse`)
- ✅ Normalização de campos Dataverse

### 3. **Interface HTML atualizada:**
- ✅ Barra de autenticação com botões de login/logout
- ✅ Exibição do usuário autenticado
- ✅ Conteúdo principal oculto até login
- ✅ Script MSAL adicionado (CDN)

---

## 📁 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `relatorios.html` | Adicionado barra de login, script MSAL, wrapper mainContent |
| `relatorios.js` | **Totalmente reescrito** com Dataverse + MSAL |
| `style.css` | Sem mudanças (compatível) |

---

## 📚 Arquivos de Documentação (Novos)

| Arquivo | Descrição |
|---------|-----------|
| `CONFIGURACAO_DATAVERSE.md` | **Guia completo de configuração** - Como registrar app no Azure AD e integrar |
| `FUNCOES_EXTRAS_DATAVERSE.md` | **Exemplos de funções adicionais** - Criar, atualizar, deletar, paginação, etc |
| `RESUMO_MIGRACAO.md` | Este arquivo |

---

## 🚀 Como Usar

### Pré-requisitos
1. Conta Microsoft / Azure AD
2. Acesso ao Dataverse (Dynamics 365)

### Início Rápido
1. **Leia** `CONFIGURACAO_DATAVERSE.md` completamente
2. **Configure** seu aplicativo no Azure AD
3. **Atualize** os valores em `relatorios.js`:
   ```javascript
   clientId: "SEU_CLIENT_ID"
   authority: "https://login.microsoftonline.com/SEU_TENANT_ID"
   DATAVERSE_ORG: "orgaf426786"
   ```
4. **Abra** `relatorios.html` e teste o login

---

## 🔐 Fluxo de Segurança

```
1. Usuário acessa página
   ↓
2. Verifica se já está autenticado
   ↓
3. Se não → Exibe botão de login
   ↓
4. Usuário clica "Entrar com Microsoft"
   ↓
5. MSAL abre popup de login Microsoft
   ↓
6. Após login → Obtém token de acesso
   ↓
7. Token enviado em cada requisição à API Dataverse
   ↓
8. Dataverse valida e retorna dados
   ↓
9. Página renderiza tabela com filtros
```

---

## 📋 Funcionalidades Principais

✅ **Login com Microsoft** - Autenticação segura via Azure AD  
✅ **Busca de Registros** - GET da API Dataverse  
✅ **Filtros Dinâmicos** - Popula selects com valores únicos  
✅ **Paginação** - Navegação entre páginas de resultados  
✅ **Exportação Excel** - Baixa dados em formato XLSX  
✅ **Filtro por Data** - Range de datas personalizável  
✅ **Logout** - Encerra sessão Microsoft  

---

## 🔄 Funcionalidades Disponíveis para Adicionar

Se precisar de mais recursos, consulte `FUNCOES_EXTRAS_DATAVERSE.md`:

- 🆕 Criar novo registro (POST)
- ✏️ Atualizar registro existente (PATCH)
- 🗑️ Deletar registro (DELETE)
- 🔍 Buscar por ID específico (GET)
- 🎯 Filtros OData avançados
- 📄 Paginação na API
- 📊 Contagem e estatísticas

---

## ⚙️ Mapeamento de Campos

Os campos são automaticamente mapeados entre Dataverse e a interface:

| Dataverse | Interface |
|-----------|-----------|
| `cr1e5_ticket` | Ticket |
| `cr1e5_localizador` | Localizador |
| `cr1e5_contato` | Contato |
| `cr1e5_waiver` | Waiver |
| `cr1e5_motivo` | Motivo |
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

## 🐛 Resolução de Problemas Comuns

### ❌ "clientId not configured"
→ Verifique `CONFIGURACAO_DATAVERSE.md` Passo 3

### ❌ "AADSTS650053: The application ... is not registered"
→ Confirme Client ID e Tenant ID estão corretos

### ❌ "401 Unauthorized"
→ Token expirou ou permissões insuficientes no Azure AD

### ❌ "Nenhum registro aparece"
→ Verifique se há dados na tabela Dataverse  
→ Confirme nomes dos campos  
→ Abra console (F12) para ver erros

### ❌ "Página fica branca após login"
→ Verifique se `mainContent` div existe no HTML  
→ Abra console para diagnosticar erro

---

## 📞 Dependências Externas

- **MSAL.js 2.38.1** (autenticação) - via CDN
- **XLSX 0.18.5** (exportação Excel) - via CDN

Ambas carregam automaticamente do HTML. Sem dependências de backend!

---

## 🎯 Próximos Passos Recomendados

1. ✅ Configurar Azure AD (ver `CONFIGURACAO_DATAVERSE.md`)
2. ✅ Testar login e carregamento de registros
3. ✅ Ajustar mapeamento de campos se necessário
4. ✅ Adicionar funções extras conforme necessário (ver `FUNCOES_EXTRAS_DATAVERSE.md`)
5. ✅ Fazer deploy em produção

---

## 📞 Referências Oficiais

- [Microsoft MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Dataverse Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OData Query Syntax](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query-data-web-api)

---

## ✨ Benefícios da Migração

| Aspecto | Antes (Firebase) | Agora (Dataverse) |
|--------|-----------------|-------------------|
| Autenticação | Anônima/Chave API | Microsoft Entra ID |
| Backend | Não | Não (API Call Direto) |
| Segurança | Baixa | Alta (OAuth 2.0) |
| Compliance | Limitado | Total (Enterprise) |
| Auditoria | Limitada | Completa (Dataverse) |
| Permissões | Básicas | Granulares (AAD) |
| Integração | Mínima | Total com M365 |

---

**Última atualização**: 2026-02-11  
**Status**: ✅ Pronto para Configuração e Testes
