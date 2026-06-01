# Deploy do LiveCare TI na Vercel

Guia passo-a-passo do zero ao app no ar.

---

## 0. Pré-checks (5 minutos)

Antes de começar, garanta que:

- [ ] Está no diretório `livecare-app/` no terminal
- [ ] `npm run build` roda sem erros (se der erro, conserta primeiro)
- [ ] `.env.local` está no `.gitignore` (não vai pro repo). Confirme com:
  ```bash
  git check-ignore .env.local
  ```
  Deve imprimir `.env.local` (significa que está ignorado).
- [ ] Não há `console.log` com dados sensíveis no código

---

## 1. Subir o código pro GitHub

### Se ainda não tem repo

```bash
cd C:\Users\LIVE\OneDrive\Área de Trabalho\formes\livecare-app
git init
git add .
git commit -m "feat: MVP do LiveCare TI"
```

Depois crie o repositório no GitHub (https://github.com/new):

- Nome: `livecare-ti` (ou o que preferir)
- **Privado** (recomendado — é sistema interno da Live Academia)
- **Sem** README/.gitignore/license (já temos)

E conecte:

```bash
git remote add origin https://github.com/SEU-USUARIO/livecare-ti.git
git branch -M main
git push -u origin main
```

### Se já tem repo

```bash
git add .
git commit -m "feat: prepara deploy"
git push
```

---

## 2. Conectar repositório na Vercel

1. Entre em https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Se a Vercel ainda não tem acesso ao GitHub, vai pedir pra autorizar. Aceite.
4. Localize `livecare-ti` na lista e clique em **"Import"**

### Configurações do projeto

A Vercel detecta Next.js automaticamente. Os defaults estão certos:

| Campo            | Valor                           |
| ---------------- | ------------------------------- |
| Framework Preset | Next.js                         |
| Build Command    | `next build` (deixa o default)  |
| Output Directory | `.next` (deixa o default)       |
| Install Command  | `npm install` (deixa o default) |
| Root Directory   | `./` (deixa o default)          |

### ⚠ Variáveis de ambiente — **NÃO DEIXE EM BRANCO**

Antes de clicar em **Deploy**, expanda **"Environment Variables"** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL
https://kptuzvkcwnznmygiuyhb.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
sb_publishable_Sf6wziqdoHphZY8UTsl5UQ_0KT3_EGZ
```

Marque **Production + Preview + Development** pras duas. Depois clique em **Deploy**.

O primeiro deploy demora ~2-3 minutos. Você verá os logs em tempo real.

---

## 3. Quando ficar verde — anotar a URL

A Vercel vai te dar uma URL tipo:

```
https://livecare-ti-abc123.vercel.app
```

(o slug `abc123` é gerado automaticamente)

**Salva essa URL.** Você vai precisar dela no próximo passo.

---

## 4. Configurar a URL no Supabase Auth

Esse passo é **obrigatório** — sem isso, login/cadastro/reset de senha quebram em produção.

1. Abra https://supabase.com/dashboard/project/kptuzvkcwnznmygiuyhb/auth/url-configuration
2. **Site URL**: cole a URL da Vercel (ex: `https://livecare-ti-abc123.vercel.app`)
3. **Redirect URLs**: clique em **"Add URL"** e adicione:
   ```
   https://livecare-ti-abc123.vercel.app/**
   ```
   O `/**` no fim é importante — cobre `/auth/callback`, `/redefinir-senha`, etc.
4. Clique em **Save**

### Bonus — manter o localhost também funcionando

Adicione também `http://localhost:3000/**` como Redirect URL pra continuar testando local.

---

## 5. Testar tudo no ar

Abra a URL da Vercel no navegador:

- [ ] Página de login carrega
- [ ] Consegue logar com seu usuário (paulo)
- [ ] Dashboard admin aparece
- [ ] Abrir um chamado funciona
- [ ] Marcar como concluído funciona
- [ ] /admin/usuarios lista usuários
- [ ] /admin/chat abre
- [ ] Logout funciona

Se algum desses falhar, verifique:

- Console do navegador (F12 → Console) — erros JS
- Aba **Logs** no painel da Vercel — erros server-side

---

## 6. Próximos deploys

Daqui em diante, **toda vez que você der `git push origin main`**, a Vercel:

1. Detecta o commit
2. Roda `npm install` + `next build`
3. Se passou: publica automaticamente
4. Se falhou: te avisa por e-mail e mantém o último build verde

Pull requests também ganham preview deploys automáticos numa URL temporária.

---

## 7. Quando for trocar pra domínio próprio (futuro)

Quando estiver pronto pra ter um `livecare.liveacademia.com.br` ou similar:

1. Vercel: **Project → Settings → Domains → Add**
2. Cole o domínio que quer
3. A Vercel te dá registros DNS pra adicionar (geralmente um CNAME)
4. Adicione no provedor de DNS da Live Academia (Cloudflare, Route 53, etc)
5. Aguarde alguns minutos a algumas horas pra propagar
6. **Volte no passo 4** e atualize a Site URL e Redirect URLs do Supabase pra o novo domínio

---

## Problemas comuns

### `npm install` falha no build da Vercel

- Vê os logs (clica no build vermelho)
- Geralmente é versão de Node — adiciona `engines.node` no `package.json`:
  ```json
  "engines": { "node": ">=20" }
  ```

### Login funciona mas dá erro depois (sessão não persiste)

- Verifica se as duas env vars estão preenchidas
- Verifica se o **Site URL** no Supabase está correto

### E-mail de cadastro não chega

- Por padrão a Supabase manda do domínio dela (`@supabase.co`) — pode cair em spam
- Solução real: configurar SMTP corporativo da Live Academia (próximo item do kanban)

### Mensagens de chat não aparecem em tempo real

- Verifica no Console do navegador se aparece erro de WebSocket
- O Realtime do Supabase precisa estar habilitado no projeto (já está)

---

## Custos esperados

- **Vercel Hobby (grátis)**: 100 GB bandwidth, builds ilimitados. Funciona pra MVP interno.
- **Supabase Free**: 500 MB de DB, 50.000 MAU. Suficiente pra Live Academia testar.

Quando crescer e precisar mais, dá pra escalar pra Vercel Pro ($20/mês/membro) e Supabase Pro ($25/mês).

---

## Anexo: Sentry (monitoring de erros em producao)

O app vem com Sentry pre-configurado, mas so liga se a env var `NEXT_PUBLIC_SENTRY_DSN` estiver setada. Sem ela, o build segue normal e nenhum dado eh enviado.

**Como ativar (5 minutos):**

1. Cria conta gratis em https://sentry.io (free tier: 5k erros/mes — sobra)
2. Cria um projeto **Next.js**
3. Copia o DSN (formato: `https://abc123@o12345.ingest.us.sentry.io/123456`)
4. Na Vercel → Project Settings → Environment Variables, adiciona:

   | Nome                     | Valor                             | Ambientes            |
   | ------------------------ | --------------------------------- | -------------------- |
   | `NEXT_PUBLIC_SENTRY_DSN` | (o DSN copiado)                   | Production + Preview |
   | `SENTRY_ORG`             | (slug da org no Sentry, opcional) | Production           |
   | `SENTRY_PROJECT`         | (slug do projeto, opcional)       | Production           |

5. Re-deploy (push qualquer commit ou clique em "Redeploy").

A partir daí, todo erro JavaScript em produção aparece no dashboard do Sentry com stack trace, breadcrumbs, e contexto do usuário.

**Filtros já configurados (em `sentry.client.config.ts`):**

- Não envia erros em `NODE_ENV !== "production"` (dev local não conta)
- Ignora `NotAllowedError` (autoplay de som bloqueado — esperado)
- Ignora `ResizeObserver loop limit exceeded` (ruído de browser)
- Sample rate de performance em 10% (free tier nao quebra)

**Pra debugar logs do `[livecare-notif]` em producao:**

Adiciona a env var `NEXT_PUBLIC_LIVECARE_DEBUG=1` na Vercel temporariamente. Os logs voltam a aparecer no Console do browser. Depois remove pra silenciar.
