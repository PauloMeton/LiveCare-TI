# Supabase — LiveCare TI

Pasta dedicada ao backend Supabase (funcoes edge + configs).

- `functions/livecare-send-email/` — Edge Function que envia e-mail via SMTP
  (chamada pelo trigger Postgres `livecare_notify_status_change`)

Pras migrations SQL, veja `../migrations/`.

## Deploy de Edge Functions

```bash
supabase functions deploy livecare-send-email --no-verify-jwt --project-ref <SEU_PROJECT_REF>
```

`--no-verify-jwt` eh necessario porque o invocador eh o Postgres (via pg_net),
nao tem JWT. A autenticacao eh feita pelo header `x-livecare-secret`.
