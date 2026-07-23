-- JRbIA platform core — Supabase/Postgres MVP
-- Firebase Auth is trusted through Supabase Third-Party Auth.
-- Every exposed table uses RLS; anon receives no application access.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  default_locale text not null default 'fr-FR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id text not null references public.organizations(id) on delete cascade,
  organization_name text not null,
  user_id text not null,
  role text not null check (role in ('owner','admin','manager','editor','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.organization_entitlements (
  organization_id text not null references public.organizations(id) on delete cascade,
  tool_id text not null,
  plan_code text not null check (plan_code in ('starter','pro','organization')),
  status text not null default 'active' check (status in ('trial','active','suspended','expired')),
  capabilities_add jsonb not null default '[]'::jsonb,
  capabilities_remove jsonb not null default '[]'::jsonb,
  quota_overrides jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  primary key (organization_id, tool_id)
);

create table if not exists public.signatures (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  created_by text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','rejected','published','archived')),
  request jsonb not null,
  render_hash text not null,
  idempotency_key_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key_hash)
);

create index if not exists idx_memberships_user_active
  on public.organization_memberships(user_id, status);
create index if not exists idx_entitlements_org_status
  on public.organization_entitlements(organization_id, status);
create index if not exists idx_signatures_org_created
  on public.signatures(organization_id, created_at desc);

create or replace function public.jwt_subject()
returns text
language sql
stable
as $$ select coalesce(auth.jwt()->>'sub', '') $$;

create or replace function public.is_active_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = public.jwt_subject()
      and m.status = 'active'
  );
$$;

revoke all on function public.is_active_member(text) from public;
grant execute on function public.is_active_member(text) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_entitlements enable row level security;
alter table public.signatures enable row level security;

revoke all on public.organizations from anon;
revoke all on public.organization_memberships from anon;
revoke all on public.organization_entitlements from anon;
revoke all on public.signatures from anon;

grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;
grant select on public.organization_entitlements to authenticated;
grant select, insert, update on public.signatures to authenticated;

create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_active_member(id));

create policy memberships_select_self
on public.organization_memberships for select to authenticated
using (user_id = public.jwt_subject());

create policy entitlements_select_member
on public.organization_entitlements for select to authenticated
using (public.is_active_member(organization_id));

create policy signatures_select_member
on public.signatures for select to authenticated
using (public.is_active_member(organization_id));

create policy signatures_insert_member
on public.signatures for insert to authenticated
with check (
  public.is_active_member(organization_id)
  and created_by = public.jwt_subject()
  and status = 'draft'
);

create policy signatures_update_draft_member
on public.signatures for update to authenticated
using (
  public.is_active_member(organization_id)
  and created_by = public.jwt_subject()
  and status = 'draft'
)
with check (
  public.is_active_member(organization_id)
  and created_by = public.jwt_subject()
  and status = 'draft'
);

comment on table public.signatures is 'JRbIA Signature Studio drafts. Approved immutable versions arrive in the next DEP-23 slice.';
