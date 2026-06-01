-- Trigger que dispara e-mail (via Edge Function) quando o status muda

create or replace function public.livecare_notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url          text;
  v_secret       text;
  v_app_url      text;
  v_to_email     text;
  v_nome         text;
  v_status_label text;
  v_short_id     text;
  v_subject      text;
  v_html         text;
  v_payload      jsonb;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  v_app_url := public.livecare_get_config('livecare_app_url');
  v_secret  := public.livecare_get_config('livecare_notify_secret');

  if v_secret is null then
    raise warning 'livecare_notify_status_change: secret nao configurado, pulando';
    return new;
  end if;

  -- IMPORTANTE: troca pelo URL real do seu projeto Supabase
  v_url := 'https://kptuzvkcwnznmygiuyhb.supabase.co/functions/v1/livecare-send-email';

  select u.email, coalesce(p.nome, split_part(u.email, '@', 1))
  into v_to_email, v_nome
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = new.autor_id;

  if v_to_email is null then
    raise warning 'livecare_notify_status_change: autor sem e-mail (ticket %)', new.id;
    return new;
  end if;

  v_status_label := case new.status
    when 'aberto'    then 'Aberto'
    when 'andamento' then 'Em andamento'
    when 'concluido' then 'Concluido'
    when 'cancelado' then 'Cancelado'
    when 'rejeitado' then 'Rejeitado'
    else new.status
  end;

  v_short_id := upper(substr(new.id::text, 1, 8));
  v_subject := format('[LiveCare TI] Chamado #%s - %s', v_short_id, v_status_label);

  v_html := format(
    '<!DOCTYPE html><html lang="pt-br"><body style="font-family:sans-serif;background:#f5f5f5;margin:0;padding:24px;">'
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;">'
    '<div style="background:#ffcc00;padding:20px 24px;"><div style="font-size:18px;font-weight:700;">LiveCare TI</div></div>'
    '<div style="padding:24px;"><p>Ola, <strong>%s</strong>,</p>'
    '<p>Seu chamado <strong>#%s</strong> teve uma atualizacao.</p>'
    '<p><strong>Titulo:</strong> %s<br><strong>Novo status:</strong> %s</p>'
    '<a href="%s/chamados/%s" style="display:inline-block;background:#1a1a1a;color:#ffcc00;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Abrir chamado</a>'
    '</div></div></body></html>',
    v_nome, v_short_id, new.titulo, v_status_label,
    coalesce(v_app_url, 'https://livecare-ti.vercel.app'), new.id::text
  );

  v_payload := jsonb_build_object('to', v_to_email, 'subject', v_subject, 'html', v_html);

  perform extensions.net.http_post(
    url := v_url,
    body := v_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-livecare-secret', v_secret
    ),
    timeout_milliseconds := 10000
  );

  return new;
exception when others then
  raise warning 'livecare_notify_status_change: % - %', sqlstate, sqlerrm;
  return new;
end$$;

revoke all on function public.livecare_notify_status_change() from public, anon, authenticated;

drop trigger if exists livecare_tickets_notify_status on public.livecare_tickets;
create trigger livecare_tickets_notify_status
  after update of status on public.livecare_tickets
  for each row
  execute function public.livecare_notify_status_change();
