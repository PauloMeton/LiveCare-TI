-- ============================================================
-- 019: GRANT EXECUTE em livecare_is_admin pro Realtime conseguir
-- avaliar RLS quando ha clients subscritos via WebSocket
-- ============================================================
--
-- BUG: Subscriptions em livecare_tickets retornavam SUBSCRIBED mas
-- os eventos INSERT/UPDATE nunca chegavam no callback do client.
--
-- Causa raiz: o Realtime do Supabase chama livecare_is_admin() no
-- contexto do role `authenticated` pra avaliar a RLS de SELECT
-- (`(autor_id = auth.uid()) OR livecare_is_admin()`). Sem GRANT
-- EXECUTE pra esse role, falhava com:
--
--   permission denied for function livecare_is_admin
--   PL/pgSQL function realtime.apply_rls(jsonb,integer) line 219
--   pg_code: 42501 (insufficient_privilege)
--
-- O erro era silencioso pro client (nao volta no SUBSCRIBED
-- callback nem como CHANNEL_ERROR — vai pros logs internos do
-- Realtime). Resultado: usuario via canal "conectado" mas eventos
-- nunca chegavam.
--
-- Aplicado: 2026-06-11
-- ============================================================

GRANT EXECUTE ON FUNCTION public.livecare_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.livecare_is_admin() TO service_role;
