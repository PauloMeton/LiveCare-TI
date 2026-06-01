-- 1) Coluna suspenso em profiles
alter table public.profiles
  add column if not exists suspenso boolean not null default false;

-- 2) Funcao que admins usam pra listar todos os usuarios
create or replace function public.livecare_list_users()
returns table (
  id uuid,
  nome text,
  cargo text,
  role text,
  suspenso boolean,
  email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nome, p.cargo, p.role, p.suspenso, u.email, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.livecare_is_admin()
  order by p.nome nulls last;
$$;

revoke execute on function public.livecare_list_users() from anon, public;
grant  execute on function public.livecare_list_users() to authenticated;

-- 3) Toggle de suspensao (sem expor UPDATE direto)
create or replace function public.livecare_set_suspenso(target_user_id uuid, suspender boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin can suspend users' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'cannot suspend your own account' using errcode = '22023';
  end if;
  if suspender and exists (select 1 from public.profiles where id = target_user_id and role = 'admin')
     and (select count(*) from public.profiles where role = 'admin' and id <> target_user_id and not suspenso) = 0
  then
    raise exception 'cannot suspend the last active admin' using errcode = '22023';
  end if;
  update public.profiles set suspenso = suspender, updated_at = now() where id = target_user_id;
  return found;
end;
$$;

revoke execute on function public.livecare_set_suspenso(uuid, boolean) from anon, public;
grant  execute on function public.livecare_set_suspenso(uuid, boolean) to authenticated;

comment on column public.profiles.suspenso is 'Quando true, o usuario nao consegue mais acessar o sistema.';
