-- Anexos nos chamados (imagem e video)

-- 1) Tabela de anexos (multiplos por ticket)
create table if not exists public.livecare_ticket_attachments (
  id          bigserial primary key,
  ticket_id   uuid not null references public.livecare_tickets(id) on delete cascade,
  autor_id    uuid not null references auth.users(id) on delete cascade,
  path        text not null,
  type        text not null check (type in ('image', 'video')),
  size        bigint not null check (size > 0 and size <= 26214400),
  created_at  timestamptz not null default now()
);

create index if not exists livecare_ticket_attachments_ticket_idx
  on public.livecare_ticket_attachments(ticket_id, created_at desc);

alter table public.livecare_ticket_attachments enable row level security;

drop policy if exists livecare_ticket_attachments_select on public.livecare_ticket_attachments;
create policy livecare_ticket_attachments_select
  on public.livecare_ticket_attachments for select
  using (
    public.livecare_is_admin()
    or exists (
      select 1 from public.livecare_tickets t
      where t.id = livecare_ticket_attachments.ticket_id and t.autor_id = auth.uid()
    )
  );

drop policy if exists livecare_ticket_attachments_insert on public.livecare_ticket_attachments;
create policy livecare_ticket_attachments_insert
  on public.livecare_ticket_attachments for insert
  with check (
    autor_id = auth.uid()
    and (
      public.livecare_is_admin()
      or exists (
        select 1 from public.livecare_tickets t
        where t.id = livecare_ticket_attachments.ticket_id and t.autor_id = auth.uid()
      )
    )
  );

drop policy if exists livecare_ticket_attachments_delete on public.livecare_ticket_attachments;
create policy livecare_ticket_attachments_delete
  on public.livecare_ticket_attachments for delete
  using (autor_id = auth.uid() or public.livecare_is_admin());

-- 2) Bucket Storage privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'livecare-tickets', 'livecare-tickets', false, 26214400,
  array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Storage RLS - path = "<ticket_id>/<uuid>.<ext>"
drop policy if exists livecare_tickets_storage_select on storage.objects;
create policy livecare_tickets_storage_select on storage.objects for select
  using (
    bucket_id = 'livecare-tickets'
    and (
      public.livecare_is_admin()
      or exists (
        select 1 from public.livecare_tickets t
        where t.id = (split_part(storage.objects.name, '/', 1))::uuid and t.autor_id = auth.uid()
      )
    )
  );

drop policy if exists livecare_tickets_storage_insert on storage.objects;
create policy livecare_tickets_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'livecare-tickets'
    and (
      public.livecare_is_admin()
      or exists (
        select 1 from public.livecare_tickets t
        where t.id = (split_part(storage.objects.name, '/', 1))::uuid and t.autor_id = auth.uid()
      )
    )
  );

drop policy if exists livecare_tickets_storage_delete on storage.objects;
create policy livecare_tickets_storage_delete on storage.objects for delete
  using (
    bucket_id = 'livecare-tickets'
    and (
      public.livecare_is_admin()
      or exists (
        select 1 from public.livecare_tickets t
        where t.id = (split_part(storage.objects.name, '/', 1))::uuid and t.autor_id = auth.uid()
      )
    )
  );

-- 4) Realtime publica novos anexos
alter publication supabase_realtime add table public.livecare_ticket_attachments;
