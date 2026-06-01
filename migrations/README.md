# Migrations SQL — LiveCare TI

Schema completo do banco Supabase (projeto **Avaliacao**, id `kptuzvkcwnznmygiuyhb`) versionado em SQL.
Use estes arquivos pra **reproduzir o banco do zero** ou pra revisar mudancas em PRs.

## Ordem de aplicacao

| #   | Arquivo                                     | O que faz                                                                     |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| 001 | `livecare_tickets_init.sql`                 | Tabela `livecare_tickets`, `livecare_is_admin()`, RLS, indices                |
| 002 | `livecare_harden_functions.sql`             | search_path = '' nas funcoes, revoke anon                                     |
| 003 | `livecare_status_workflow_events.sql`       | Status `cancelado`/`rejeitado`, tabela `livecare_ticket_events` (audit)       |
| 004 | `livecare_user_management.sql`              | Coluna `suspenso`, `livecare_list_users()`, `livecare_set_suspenso()`         |
| 005 | `livecare_lider_admin.sql`                  | Coluna `lider`, `livecare_is_lider()`, override das protecoes de suspensao    |
| 006 | `livecare_chat.sql`                         | Tabela `livecare_messages` + RLS + `livecare_list_conversas()` + Realtime     |
| 007 | `livecare_realtime_extras.sql`              | Adiciona `livecare_tickets`, `livecare_ticket_events`, `profiles` no Realtime |
| 008 | `livecare_chat_attachments.sql`             | Colunas de anexo em messages + bucket `livecare-chat` + Storage RLS           |
| 009 | `livecare_ticket_attachments.sql`           | Tabela `livecare_ticket_attachments` + bucket `livecare-tickets`              |
| 010 | `livecare_notify_config.sql`                | pg_net + tabela interna de config (secret + URL do app)                       |
| 011 | `livecare_notify_status_change_trigger.sql` | Trigger AFTER UPDATE OF status -> chama Edge Function via pg_net              |
| 012 | `livecare_analytics.sql`                    | Funcao `livecare_analytics(p_dias int)` pro dashboard                         |

## Pre-requisitos no banco

Antes de rodar essas migrations, o projeto Supabase precisa ter:

- Tabela `public.profiles` com colunas: `id uuid pk`, `nome text`, `cargo text`, `role text` ('user'/'admin'), `updated_at`
- Tabela `public.unidades` com colunas: `id bigint pk`, `nome text`, `ativa boolean`
- Funcao `public.is_admin()` (vem do projeto Avaliacao legacy — verifica role do user)
- Trigger `handle_new_user` em `auth.users` que cria profile automaticamente

## Como reaplicar do zero

### Via dashboard Supabase

1. Cria novo projeto no Supabase
2. Cria as tabelas pre-requisito (profiles, unidades) — pegar do projeto Avaliacao
3. SQL Editor → cole o conteudo de cada arquivo na ordem 001 -> 012
4. Cada migration eh idempotente (`if not exists`, `or replace`) — pode rodar varias vezes

### Via Supabase CLI

```bash
# Instala
npm install -g supabase

# Login + link no projeto
supabase login
supabase link --project-ref <SEU_PROJECT_REF>

# Roda cada migration (na ordem)
for f in migrations/*.sql; do
  echo "Aplicando $f..."
  supabase db query --file "$f"
done
```

## Como adicionar uma migration nova

1. Cria `migrations/0XX_nome_descritivo.sql` (proximo numero sequencial)
2. Escreve SQL idempotente (`if not exists`, `or replace`)
3. Testa localmente OU aplica direto no projeto via `apply_migration` da MCP
4. Commita + push

## Edge Functions

A funcao `livecare-send-email` (usada pelo trigger 011) esta em
`supabase/functions/livecare-send-email/`.

Deploy:

```bash
supabase functions deploy livecare-send-email --no-verify-jwt --project-ref <SEU_PROJECT_REF>
```

Secrets necessarios (dashboard Supabase → Edge Functions → livecare-send-email → Secrets):

- `LIVECARE_NOTIFY_SECRET` — mesmo valor da linha em `livecare_internal_config`
- `SMTP_HOST` (ex: smtp.gmail.com)
- `SMTP_PORT` (ex: 465)
- `SMTP_USER` (e-mail)
- `SMTP_PASS` (App Password do Gmail, 16 chars)
- `SMTP_FROM` (ex: `LiveCare TI <seu@gmail.com>`)
