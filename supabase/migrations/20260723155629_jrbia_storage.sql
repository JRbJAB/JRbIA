-- JRbIA Storage bootstrap — private source assets and exports.
-- Paths must follow: organizations/<organization_id>/<kind>/<filename>

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'jrbia-brand-assets',
  'jrbia-brand-assets',
  false,
  20971520,
  array['image/png','image/jpeg','image/webp','image/svg+xml','text/html','text/plain','application/zip']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Active members may read objects belonging to their organization.
create policy jrbia_storage_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and public.is_active_member((storage.foldername(name))[2])
);

-- Uploads are restricted to owners/admins. The caller identity is resolved
-- from the native Supabase Auth JWT.
create policy jrbia_storage_insert_admin
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = public.jwt_subject()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);

create policy jrbia_storage_update_admin
on storage.objects for update to authenticated
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = public.jwt_subject()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
)
with check (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = public.jwt_subject()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);

create policy jrbia_storage_delete_owner
on storage.objects for delete to authenticated
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = public.jwt_subject()
      and m.status = 'active'
      and m.role = 'owner'
  )
);
