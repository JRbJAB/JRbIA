-- Tighten table and helper-function privileges after Supabase default grants.
-- RLS remains the primary row-level boundary; grants reduce the SQL surface.

revoke all privileges on table public.organizations from anon, authenticated;
revoke all privileges on table public.organization_memberships from anon, authenticated;
revoke all privileges on table public.organization_entitlements from anon, authenticated;
revoke all privileges on table public.signatures from anon, authenticated;

grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;
grant select on table public.organization_entitlements to authenticated;
grant select, insert, update on table public.signatures to authenticated;

revoke all on function public.jwt_subject() from public, anon;
grant execute on function public.jwt_subject() to authenticated;

revoke all on function public.is_active_member(text) from public, anon;
grant execute on function public.is_active_member(text) to authenticated;
