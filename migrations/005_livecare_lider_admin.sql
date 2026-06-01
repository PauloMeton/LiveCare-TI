-- 1) Coluna lider em profiles
alter table public.profiles
  add column if not exists lider boolean not null default false;

-- 2) Helper
create or replace function public.livecare_is_lider()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select lider from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.livecare_is_lider() from anon, public;
grant  execute on function public.livecare_is_lider() to authenticated;

-- 3) Lideres ignoram as protecoes de auto-suspensao e ultimo-admin
create or replace function public.livecare_set_suspenso(target_user_id uuid, suspender boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_lider boolean := public.livecare_is_lider();
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin can suspend users' using errcode = '42501';
  end if;

  if not v_is_lider then
    if target_user_id = auth.uid() then
      raise exception 'cannot suspend your own account' using errcode = '22023';
    end if;
    if suspender and exists (select 1 from public.profiles where id = target_user_id and role = 'admin')
       and (select count(*) from public.profiles where role = 'admin' and id <> target_user_id and not suspenso) = 0
    then
      raise exception 'cannot suspend the last active admin' using errcode = '22023';
    end if;
  end if;

  update public.profiles set suspenso = suspender, updated_at = now() where id = target_user_id;
  return found;
end;
$$;

-- 4) Recria livecare_list_users incluindo o campo lider
drop function if exists public.livecare_list_users();
create function public.livecare_list_users()
returns table (
  id uuid, nome text, cargo text, role text,
  suspenso boolean, lider boolean, email text, created_at timestamptz
)
language sql security definer set search_path = public
as $$
  select p.id, p.nome, p.cargo, p.role, p.suspenso, p.lider, u.email, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.livecare_is_admin()
  order by p.lider desc, p.nome nulls last;
$$;

revoke execute on function public.livecare_list_users() from anon, public;
grant  execute on function public.livecare_list_users() to authenticated;

comment on column public.profiles.lider is 'Lider admin - burla as protecoes de auto-suspensao e ultimo-admin.';
