# E-mails Setup (Fase 3)

## ✅ Implementado

- ✅ `/api/emails` endpoint (GET emails from Gmail)
- ✅ `useEmails` hook com retry logic
- ✅ Gmail OAuth connect/callback routes
- ✅ Componentes EmailItem, EmailPanel
- ✅ Página /emails com UI completa

---

## 🔧 O QUE VOCÊ PRECISA FAZER

### 1. Criar Tabela no Supabase

**Ir em:** https://supabase.com/dashboard → Seu projeto → SQL Editor

**Executar este SQL:**

```sql
CREATE TABLE email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, email)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE email_tokens ENABLE ROW LEVEL SECURITY;
```

---

### 2. Configurar Google Cloud Console

**Ir em:** https://console.cloud.google.com

#### 2.1 Criar novo projeto
- Clique em "Select a project" (topo)
- Clique em "NEW PROJECT"
- Nome: `lifeos-gmail`
- Clique em "CREATE"

#### 2.2 Ativar Gmail API
- Menu lateral → APIs & Services → Library
- Procure por **"Gmail API"**
- Clique no resultado
- Clique em **"ENABLE"**

#### 2.3 Criar credenciais OAuth
- Menu lateral → APIs & Services → Credentials
- Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- Se pedir para configurar OAuth consent screen primeiro:
  - Clique em **"Configure Consent Screen"**
  - Selecione **"External"**
  - Preencha:
    - **App name:** LifeOS
    - **User support email:** seu email
    - **Developer contact:** seu email
  - Clique em **"SAVE AND CONTINUE"**
  - Skip "Scopes" (próximas telas)
  - Clique em **"BACK TO DASHBOARD"**

- Agora volte para criar credenciais:
- Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- **Application type:** Web application
- **Name:** lifeos-gmail-web
- **Authorized JavaScript origins:**
  - Adicione: `http://localhost:3000`
  - Adicione: `https://seu-dominio.vercel.app` (depois)
- **Authorized redirect URIs:**
  - Adicione: `http://localhost:3000/api/auth/gmail/callback`
  - Adicione: `https://seu-dominio.vercel.app/api/auth/gmail/callback` (depois)
- Clique em **"CREATE"**

---

## 🔑 CHAVES NECESSÁRIAS

Você vai receber uma janela com:

```
Client ID: xxxxxxx.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxx
```

**Copie essas duas chaves e atualize o `.env.local`:**

```env
GMAIL_CLIENT_ID=xxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxx
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

---

## 📋 Checklist Final

- [ ] Tabela `email_tokens` criada no Supabase
- [ ] Gmail API habilitada no Google Cloud
- [ ] OAuth client criado
- [ ] `GMAIL_CLIENT_ID` adicionado ao `.env.local`
- [ ] `GMAIL_CLIENT_SECRET` adicionado ao `.env.local`
- [ ] `npm run dev` rodando
- [ ] Abrir http://localhost:3000/emails
- [ ] Clique em "+ Gmail"
- [ ] Autorizar a conta Google
- [ ] E-mails devem aparecer na lista

---

## 🚀 Próximos Passos

1. Depois que funcionar em localhost:
   - Deploy na Vercel
   - Adicionar URLs de produção no Google Cloud Console
   - Testar em produção

2. Melhorias futuras:
   - Outlook OAuth2
   - Ações (arquivar, marcar como lido)
   - Busca e filtros
   - Notificações de e-mails novos

---

## ❓ Dúvidas?

Se der erro:
1. Verifique se a tabela foi criada: Supabase → SQL Editor → verifique `email_tokens`
2. Verifique se `.env.local` tem as chaves corretas
3. Verifique os logs em: `localhost:3000/emails` → Console do navegador (F12)

Quando terminar, faça commit e deploy! 🚀
