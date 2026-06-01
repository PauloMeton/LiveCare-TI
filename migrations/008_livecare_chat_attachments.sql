-- 1) Colunas de anexo na tabela de mensagens
alter table public.livecare_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_type text check (attachment_type in ('image','video')),
  add column if not exists attachment_size bigint check (attachment_size is null or attachment_size > 0);

-- 2) Relaxa check: pode ter conteudo vazio se tem anexo
alter table public.livecare_messages drop constraint if exists livecare_messages_conteudo_check;
alter table public.livecare_messages
  add constraint livecare_messages_has_payload
  check (
    (length(coalesce(conteudo, '')) > 0 and length(conteudo) <= 4000)
    or attachment_path is not null
  );

-- 3) Bucket privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'livecare-chat', 'livecare-chat', false, 26214400,
  array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/quicktime']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4) Storage RLS — path = "{conversa_id}/{algo}"
drop policy if exists livecare_chat_attach_select on storage.objects;
create policy livecare_chat_attach_select on storage.objects
  for select to authenticated using (
    bucket_id = 'livecare-chat'
    and ((split_part(name, '/', 1))::uuid = auth.uid() or public.livecare_is_admin())
  );

drop policy if exists livecare_chat_attach_insert on storage.objects;
create policy livecare_chat_attach_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'livecare-chat'
    and ((split_part(name, '/', 1))::uuid = auth.uid() or public.livecare_is_admin())
  );

drop policy if exists livecare_chat_attach_delete on storage.objects;
create policy livecare_chat_attach_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'livecare-chat' and owner = auth.uid()
  );
