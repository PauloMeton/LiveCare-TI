-- Subscriptions Web Push (PWA) por usuario. Pode haver multiplas (varios devices).

create table if not exists public.livecare_push_subscriptions (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists livecare_push_subscriptions_user_idx
  on public.livecare_push_subscriptions(user_id);

alter table public.livecare_push_subscriptions enable row level security;

drop policy if exists livecare_push_subs_select on public.livecare_push_subscriptions;
create policy livecare_push_subs_select on public.livecare_push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists livecare_push_subs_insert on public.livecare_push_subscriptions;
create policy livecare_push_subs_insert on public.livecare_push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists livecare_push_subs_delete on public.livecare_push_subscriptions;
create policy livecare_push_subs_delete on public.livecare_push_subscriptions
  for delete using (user_id = auth.uid());

drop policy if exists livecare_push_subs_update on public.livecare_push_subscriptions;
create policy livecare_push_subs_update on public.livecare_push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.livecare_get_user_push_subs(p_user_id uuid)
returns table (endpoint text, p256dh text, auth text)
language sql security definer set search_path = public
as $$
  select endpoint, p256dh, auth from public.livecare_push_subscriptions where user_id = p_user_id;
$$;

revoke all on function public.livecare_get_user_push_subs(uuid) from public, anon, authenticated;
