-- ============================================================
-- 018: Fix do path do pg_net.http_post
-- ============================================================
-- BUG: 3 funcoes chamavam `extensions.net.http_post(...)` que o
-- Postgres interpretava como db.schema.fn (3 partes), causando erro
-- "0A000: cross-database references are not implemented".
--
-- pg_net cria schema proprio `net`. O caminho correto eh `net.http_post`
-- (qualificacao schema.function de 2 partes, sempre funciona).
--
-- Funcoes afetadas (todas com EXCEPTION WHEN OTHERS que engolia o erro):
--   - livecare_send_push          → push notifications nunca saiam
--   - livecare_notify_status_change → emails nunca saiam
--   - livecare_daily_sla_digest   → digest diario nunca saia
--
-- Sintoma: tickets eram criados, status mudava, mas nenhuma
-- notificacao chegava. Logs do postgres mostravam warnings 0A000.
--
-- Aplicado: 2026-06-11
-- ============================================================

-- 018a: livecare_send_push

CREATE OR REPLACE FUNCTION public.livecare_send_push(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_url text DEFAULT '/dashboard'::text,
  p_tag text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
declare
  v_url    text;
  v_secret text;
begin
  v_secret := public.livecare_get_config('livecare_notify_secret');
  if v_secret is null then
    raise warning 'livecare_send_push: secret nao configurado, pulando';
    return;
  end if;

  v_url := 'https://kptuzvkcwnznmygiuyhb.supabase.co/functions/v1/livecare-send-push';

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'userId', p_user_id,
      'title', p_title,
      'body', p_body,
      'url', p_url,
      'tag', p_tag
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-livecare-secret', v_secret
    ),
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'livecare_send_push: % - %', sqlstate, sqlerrm;
end;
$$;

-- Definicao completa das outras duas funcoes (livecare_notify_status_change
-- e livecare_daily_sla_digest) tambem foi atualizada via apply_migration
-- direto no Supabase nas migrations 018b e 018c. Vide historico.
