# LiveCare TI — MVP

Sistema interno de chamados da Live Academia (Suporte TI).
**Stack**: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase.
**Variante visual**: B (Editorial) — amarelo Live `#ffcc00` como cor primária.

## O que está pronto neste MVP

**Autenticação completa**
- Login (`/login`)
- Cadastro restrito a `@liveacademia.com.br` (`/cadastro`)
- Recuperação de senha (`/recuperar-senha`)
- Logout (POST `/logout`)
- Middleware que protege todas as rotas autenticadas

**CRUD de chamados**
- Dashboard adaptativo: funcionário (mobile) vê os próprios; admin (desktop) vê todos
- Abrir chamado nas 3 classes: RH, Financeiro, Operações — cada uma com formulário dedicado
- Admin pode marcar "em andamento" e "concluído"
- Filtros do admin: data, classe, status, busca por nome/título
- 37 unidades reais da Live Academia já cadastradas no banco

**Segurança**
- RLS habilitado: funcionário só vê os próprios chamados; admin vê tudo
- Função `livecare_is_admin()` com `SECURITY DEFINER` e `search_path` fixo
- Domínio de e-mail validado no cadastro

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. As variáveis já estão em .env.local apontando para o projeto Supabase "Avaliação"
#    (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY)

# 3. Rodar
npm run dev
# abre em http://localhost:3000
```

Para promover seu usuário a admin (ou rebaixar), use a função SQL `admin_set_user_role` no Supabase. Você (`paulo`) já está como admin.

## Estrutura

```
livecare-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx                ← layout raiz (fonte Inter + globals.css)
│   │   ├── page.tsx                  ← redireciona para /login ou /dashboard
│   │   ├── login/                    ← entrar
│   │   ├── cadastro/                 ← criar conta (domínio restrito)
│   │   ├── recuperar-senha/          ← reset de senha
│   │   ├── logout/route.ts           ← POST /logout
│   │   ├── dashboard/page.tsx        ← roteia para FuncDashboard ou AdminDashboard
│   │   └── chamados/
│   │       ├── actions.ts            ← createTicket, concluirTicket, setEmAndamento
│   │       └── novo/
│   │           ├── page.tsx          ← escolha de classe
│   │           ├── rh/               ← formulário RH
│   │           ├── financeiro/       ← formulário Financeiro
│   │           └── operacoes/        ← formulário Operações
│   ├── components/
│   │   ├── ui/                       ← Button, Card, Field, Pill, ClassBadge, etc.
│   │   ├── dashboards/               ← FuncDashboard (mobile) + AdminDashboard (desktop)
│   │   ├── forms/                    ← TicketFormShell
│   │   └── nav/                      ← MobileBottomNav
│   └── lib/
│       ├── supabase/                 ← client.ts (browser), server.ts, middleware.ts
│       ├── types.ts                  ← Classe / Status / Ticket / Profile
│       └── getCurrentUser.ts         ← helper server-side
├── middleware.ts                     ← refresh de sessão + proteção de rotas
├── tailwind.config.ts                ← tokens grafite + amarelo Live
└── .env.local                        ← chaves Supabase
```

## Schema do banco (projeto "Avaliação")

Reaproveita as tabelas que já existiam (`profiles`, `unidades`) e adiciona uma nova com prefixo:

**`livecare_tickets`** — chamados internos:
- `id`, `autor_id` (FK auth.users)
- `classe` ∈ {RH, Financeiro, Operacoes}
- `titulo`, `campos` (jsonb com campos específicos da classe), `observacao`
- `status` ∈ {aberto, andamento, concluido}
- `prioridade` ∈ {baixa, media, alta}
- `unidade_id` (FK unidades)
- `created_at`, `updated_at`, `concluido_em`, `concluido_por`
- `deleted_at` (soft delete)

**RLS policies**:
- SELECT: autor ou admin (via `livecare_is_admin()`)
- INSERT: usuário autenticado, sempre como autor
- UPDATE: admin sempre; funcionário só se o chamado estiver aberto
- DELETE: apenas admin

## Próximos passos sugeridos (fora do escopo deste MVP)

1. **Tela de perfil** — editar nome/cargo/senha, foto
2. **Chat** com suporte TI (Supabase Realtime)
3. **Gerenciamento de usuários** (admin pode promover/suspender/excluir)
4. **Anexos** (Supabase Storage)
5. **Notificações** (e-mail ou push quando admin atualiza chamado)
6. **Deploy** (Vercel + variáveis de ambiente)
