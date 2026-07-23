-- DEP-25 — transactional RLS and Storage proof
-- Run through a privileged SQL connection on a non-production environment.
-- Every synthetic row is removed by the final ROLLBACK.

begin;

insert into public.organizations (id, slug, display_name)
values
  ('dep25-org-a', 'dep25-org-a', 'DEP-25 Organisation A'),
  ('dep25-org-b', 'dep25-org-b', 'DEP-25 Organisation B');

insert into public.organization_memberships (
  organization_id,
  organization_name,
  user_id,
  role,
  status
)
values
  (
    'dep25-org-a',
    'DEP-25 Organisation A',
    '11111111-1111-4111-8111-111111111111',
    'owner',
    'active'
  ),
  (
    'dep25-org-b',
    'DEP-25 Organisation B',
    '22222222-2222-4222-8222-222222222222',
    'viewer',
    'active'
  );

insert into public.organization_entitlements (
  organization_id,
  tool_id,
  plan_code,
  status
)
values
  ('dep25-org-a', 'signature-studio', 'pro', 'active'),
  ('dep25-org-b', 'signature-studio', 'starter', 'active');

insert into public.signatures (
  id,
  organization_id,
  created_by,
  status,
  request,
  render_hash
)
values (
  'dep25-sig-b',
  'dep25-org-b',
  '22222222-2222-4222-8222-222222222222',
  'draft',
  '{}'::jsonb,
  'hash-b'
);

insert into storage.objects (bucket_id, name, owner_id, metadata)
values
  (
    'jrbia-brand-assets',
    'organizations/dep25-org-a/logos/a.png',
    '11111111-1111-4111-8111-111111111111',
    '{"mimetype":"image/png"}'::jsonb
  ),
  (
    'jrbia-brand-assets',
    'organizations/dep25-org-b/logos/b.png',
    '22222222-2222-4222-8222-222222222222',
    '{"mimetype":"image/png"}'::jsonb
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $test_a$
declare
  affected integer;
begin
  if (select count(*) from public.organizations) <> 1 then
    raise exception 'T01 failed: organization isolation A';
  end if;
  if (select count(*) from public.organization_memberships) <> 1 then
    raise exception 'T02 failed: membership isolation A';
  end if;
  if (select count(*) from public.organization_entitlements) <> 1 then
    raise exception 'T03 failed: entitlement isolation A';
  end if;
  if (select count(*) from public.signatures) <> 0 then
    raise exception 'T04 failed: cross-tenant signature visible to A';
  end if;
  if (
    select count(*)
    from storage.objects
    where bucket_id = 'jrbia-brand-assets'
  ) <> 1 then
    raise exception 'T05 failed: Storage isolation A';
  end if;

  insert into public.signatures (
    id,
    organization_id,
    created_by,
    status,
    request,
    render_hash
  )
  values (
    'dep25-sig-a',
    'dep25-org-a',
    '11111111-1111-4111-8111-111111111111',
    'draft',
    '{}'::jsonb,
    'hash-a'
  );

  update public.signatures
  set render_hash = 'hash-a-updated'
  where id = 'dep25-sig-a';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'T06 failed: own draft update A';
  end if;

  update public.signatures
  set render_hash = 'cross-tenant'
  where id = 'dep25-sig-b';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'T07 failed: cross-tenant update A';
  end if;

  begin
    insert into public.signatures (
      id,
      organization_id,
      created_by,
      status,
      request,
      render_hash
    )
    values (
      'dep25-forbidden-a-b',
      'dep25-org-b',
      '11111111-1111-4111-8111-111111111111',
      'draft',
      '{}'::jsonb,
      'forbidden'
    );
    raise exception 'T08 failed: cross-tenant insert A succeeded';
  exception when insufficient_privilege then
    null;
  end;

  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values (
    'jrbia-brand-assets',
    'organizations/dep25-org-a/exports/a.txt',
    '11111111-1111-4111-8111-111111111111',
    '{"mimetype":"text/plain"}'::jsonb
  );

  begin
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'jrbia-brand-assets',
      'organizations/dep25-org-b/exports/forbidden.txt',
      '11111111-1111-4111-8111-111111111111',
      '{"mimetype":"text/plain"}'::jsonb
    );
    raise exception 'T09 failed: cross-tenant Storage insert A succeeded';
  exception when insufficient_privilege then
    null;
  end;
end
$test_a$;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

do $test_b$
begin
  if (select count(*) from public.organizations) <> 1 then
    raise exception 'T10 failed: organization isolation B';
  end if;
  if (select count(*) from public.signatures) <> 1 then
    raise exception 'T11 failed: signature isolation B';
  end if;
  if (
    select count(*)
    from storage.objects
    where bucket_id = 'jrbia-brand-assets'
  ) <> 1 then
    raise exception 'T12 failed: Storage isolation B';
  end if;

  begin
    insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'jrbia-brand-assets',
      'organizations/dep25-org-b/exports/viewer-forbidden.txt',
      '22222222-2222-4222-8222-222222222222',
      '{"mimetype":"text/plain"}'::jsonb
    );
    raise exception 'T12 failed: viewer Storage insert succeeded';
  exception when insufficient_privilege then
    null;
  end;
end
$test_b$;

reset role;
select json_build_object(
  'status', 'PASS',
  'tests', 12,
  'mode', 'transactional synthetic JWT claims',
  'cleanup', 'ROLLBACK'
) as dep25_rls_storage_result;

rollback;
