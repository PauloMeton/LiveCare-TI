-- Digest diario por e-mail pros admins com tickets vencidos / a vencer.
-- Roda via pg_cron todo dia 11:00 UTC (08:00 Brasilia).

create extension if not exists pg_cron with schema extensions;

create or replace function public.livecare_daily_sla_digest()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret      text;
  v_url         text;
  v_app_url     text;
  v_vencidos    int;
  v_a_vencer    int;
  v_html_rows   text;
  v_html        text;
  v_payload     jsonb;
  r_admin       record;
  r_ticket      record;
begin
  v_secret  := public.livecare_get_config('livecare_notify_secret');
  v_app_url := public.livecare_get_config('livecare_app_url');
  if v_secret is null then
    raise warning 'livecare_daily_sla_digest: secret nao configurado, pulando';
    return;
  end if;

  v_url := 'https://kptuzvkcwnznmygiuyhb.supabase.co/functions/v1/livecare-send-email';

  with t as (
    select
      lt.id, lt.titulo, lt.prioridade, lt.created_at,
      coalesce(p.nome, '-') as autor_nome,
      case lt.prioridade when 'alta' then 24 when 'media' then 72 else 168 end as prazo_horas,
      extract(epoch from (now() - lt.created_at)) / 3600.0 as idade_horas
    from public.livecare_tickets lt
    left join public.profiles p on p.id = lt.autor_id
    where lt.deleted_at is null and lt.status in ('aberto', 'andamento')
  )
  select
    count(*) filter (where idade_horas >= prazo_horas)::int,
    count(*) filter (where idade_horas < prazo_horas and idade_horas + 24 >= prazo_horas)::int
  into v_vencidos, v_a_vencer
  from t;

  if v_vencidos = 0 and v_a_vencer = 0 then
    raise notice 'livecare_daily_sla_digest: nada a notificar';
    return;
  end if;

  v_html_rows := '';
  for r_ticket in
    with t as (
      select
        lt.id, lt.titulo, lt.prioridade,
        coalesce(p.nome, '-') as autor_nome,
        case lt.prioridade when 'alta' then 24 when 'media' then 72 else 168 end as prazo_horas,
        extract(epoch from (now() - lt.created_at)) / 3600.0 as idade_horas
      from public.livecare_tickets lt
      left join public.profiles p on p.id = lt.autor_id
      where lt.deleted_at is null and lt.status in ('aberto', 'andamento')
    )
    select
      id, titulo, prioridade, autor_nome,
      case when idade_horas >= prazo_horas then 'vencido' else 'a_vencer' end as situacao,
      round((idade_horas - prazo_horas)::numeric, 1) as horas_atraso,
      round((prazo_horas - idade_horas)::numeric, 1) as horas_restantes
    from t
    where idade_horas >= prazo_horas
       or (idade_horas < prazo_horas and idade_horas + 24 >= prazo_horas)
    order by (idade_horas - prazo_horas) desc
    limit 30
  loop
    v_html_rows := v_html_rows || format(
      '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">' ||
      '<div style="font-weight:600;">%s</div>' ||
      '<div style="color:#666;font-size:11px;">%s . prioridade %s . #%s</div>' ||
      '</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-size:12px;font-weight:600;color:%s;white-space:nowrap;">%s</td></tr>',
      r_ticket.titulo, r_ticket.autor_nome, r_ticket.prioridade,
      upper(substr(r_ticket.id::text, 1, 8)),
      case when r_ticket.situacao = 'vencido' then '#b8392c' else '#a37c00' end,
      case when r_ticket.situacao = 'vencido'
           then format('Atrasado %sh', r_ticket.horas_atraso)
           else format('Vence em %sh', r_ticket.horas_restantes)
      end
    );
  end loop;

  for r_admin in
    select u.email, coalesce(p.nome, 'admin') as nome
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.role = 'admin' and not coalesce(p.suspenso, false) and u.email is not null
  loop
    v_html := format(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">' ||
      '<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;">' ||
      '<div style="background:#ffcc00;padding:20px 24px;"><strong>LiveCare TI . Resumo diario</strong></div>' ||
      '<div style="padding:24px;">' ||
      '<p>Bom dia, <strong>%s</strong>.</p>' ||
      '<p><strong style="color:#b8392c">%s vencidos</strong> . <strong style="color:#a37c00">%s a vencer em 24h</strong></p>' ||
      '<table style="width:100%%;border-collapse:collapse;margin:16px 0;">%s</table>' ||
      '<a href="%s/dashboard" style="display:inline-block;background:#1a1a1a;color:#ffcc00;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Abrir fila</a>' ||
      '</div></div></body></html>',
      r_admin.nome, v_vencidos, v_a_vencer, v_html_rows,
      coalesce(v_app_url, 'https://livecare-ti.vercel.app')
    );

    v_payload := jsonb_build_object(
      'to', r_admin.email,
      'subject', format('[LiveCare TI] %s vencidos, %s a vencer hoje', v_vencidos, v_a_vencer),
      'html', v_html
    );

    perform extensions.net.http_post(
      url := v_url, body := v_payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-livecare-secret', v_secret
      ),
      timeout_milliseconds := 10000
    );
  end loop;
exception when others then
  raise warning 'livecare_daily_sla_digest: % - %', sqlstate, sqlerrm;
end$$;

revoke all on function public.livecare_daily_sla_digest() from public, anon, authenticated;

-- Agenda diariamente as 11:00 UTC = 08:00 Brasilia
select cron.unschedule('livecare-daily-sla')
  where exists (select 1 from cron.job where jobname = 'livecare-daily-sla');

select cron.schedule(
  'livecare-daily-sla',
  '0 11 * * *',
  $cron$select public.livecare_daily_sla_digest()$cron$
);
