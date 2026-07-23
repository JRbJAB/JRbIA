-- Move RLS helper functions out of the exposed public API schema.
-- This keeps SECURITY DEFINER logic unavailable as a PostgREST RPC.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.jwt_subject()
returns text
language sql
stable
set search_path = ''
as $$ select coalesce(auth.jwt()->>'sub', '') $$;

create or replace function private.is_active_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = private.jwt_subject()
      and m.status = 'active'
  );
$$;

revoke all on function private.jwt_subject() from public, anon;
revoke all on function private.is_active_member(text) from public, anon;
grant execute on function private.jwt_subject() to authenticated;
grant execute on function private.is_active_member(text) to authenticated;

alter policy organizations_select_member
on public.organizations
using (private.is_active_member(id));

alter policy memberships_select_self
on public.organization_memberships
using (user_id = private.jwt_subject());

alter policy entitlements_select_member
on public.organization_entitlements
using (private.is_active_member(organization_id));

alter policy signatures_select_member
on public.signatures
using (private.is_active_member(organization_id));

alter policy signatures_insert_member
on public.signatures
with check (
  private.is_active_member(organization_id)
  and created_by = private.jwt_subject()
  and status = 'draft'
);

alter policy signatures_update_draft_member
on public.signatures
using (
  private.is_active_member(organization_id)
  and created_by = private.jwt_subject()
  and status = 'draft'
)
with check (
  private.is_active_member(organization_id)
  and created_by = private.jwt_subject()
  and status = 'draft'
);

alter policy jrbia_storage_select_member
on storage.objects
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and private.is_active_member((storage.foldername(name))[2])
);

alter policy jrbia_storage_insert_admin
on storage.objects
with check (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = private.jwt_subject()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);

alter policy jrbia_storage_update_admin
on storage.objects
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = private.jwt_subject()
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
      and m.user_id = private.jwt_subject()
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);

alter policy jrbia_storage_delete_owner
on storage.objects
using (
  bucket_id = 'jrbia-brand-assets'
  and (storage.foldername(name))[1] = 'organizations'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = (storage.foldername(name))[2]
      and m.user_id = private.jwt_subject()
      and m.status = 'active'
      and m.role = 'owner'
  )
);

drop function if exists public.is_active_member(text);
drop function if exists public.jwt_subject();
