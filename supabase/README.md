# Supabase — JRbIA platform backend

Supabase replaces Firestore as the preferred operational persistence layer for DEP-23.

## Decisions

- Postgres + RLS for tenant data.
- Supabase Storage for versioned brand assets and exports.
- Firebase Auth remains the initial identity provider.
- Supabase Third-Party Auth trusts Firebase JWTs.
- The Firebase JWT must contain `role=authenticated`.
- FastAPI forwards the verified caller token to the Supabase Data API; the publishable key is used, never a service/secret key.
- The legacy Firestore adapter remains temporarily behind `DATA_BACKEND=firestore` for rollback only.

## Hosted project setup

1. Link the JRbIA Supabase project with the CLI/plugin.
2. Enable Authentication > Third-Party Auth > Firebase with the JRbIA Firebase project ID.
3. Ensure Firebase users receive the custom claim `role=authenticated`.
4. Review and apply migrations; do not run a remote push without human approval.
5. Create the private bucket `jrbia-brand-assets` through the Storage API/dashboard.
6. Add tenant-scoped Storage RLS policies before upload.
7. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the backend secret/config layer.

## Local commands

```bash
supabase init                 # only if the folder does not exist
supabase start                # local Docker stack
supabase db reset             # apply migrations + seed locally
supabase db diff -f <name>    # capture reviewed schema changes
```

`NO_PUBLIC_DEPLOY` and `HUMAN_REVIEW_REQUIRED` remain active.

## Storage convention

The source bucket `jrbia-brand-assets` is private and uses tenant-scoped paths:

```text
organizations/<organization_id>/brands/<asset>
organizations/<organization_id>/exports/<artifact>
```

Permanent images embedded in e-mail signatures must ultimately be published as reviewed derivatives on a controlled HTTPS delivery domain. Private source objects or expiring signed URLs must not be inserted as durable signature image URLs.
