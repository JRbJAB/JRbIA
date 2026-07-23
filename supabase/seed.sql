-- Local-only sample data. Never push real users or secrets.
insert into public.organizations (id, slug, display_name)
values ('org-jrbia-local', 'jrbia-local', 'JRbIA Local')
on conflict (id) do nothing;

-- Replace <firebase-uid> locally after obtaining a Firebase test user.
-- insert into public.organization_memberships
--   (organization_id, organization_name, user_id, role, status)
-- values
--   ('org-jrbia-local', 'JRbIA Local', '<firebase-uid>', 'owner', 'active');
--
-- insert into public.organization_entitlements
--   (organization_id, tool_id, plan_code, status)
-- values
--   ('org-jrbia-local', 'signature-studio', 'organization', 'active');
