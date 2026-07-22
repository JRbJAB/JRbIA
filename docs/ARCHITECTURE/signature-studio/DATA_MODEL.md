# JRbIA Signature Studio — Modèle de données multi-tenant

## Principes

- Tous les identifiants sont des UUID ou identifiants opaques.
- Toutes les entités tenant-scoped portent `organization_id`.
- Les versions approuvées sont immuables.
- Les suppressions métier sont logiques lorsque l'audit l'exige.
- Les champs de données personnelles sont minimisés et soumis à rétention.

## Entités

### `organizations`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `slug` | string | Unique global |
| `display_name` | string | Nom public |
| `status` | enum | `active`, `suspended`, `closed` |
| `default_locale` | string | ex. `fr-FR` |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### `organization_memberships`

| Champ | Type | Notes |
|---|---|---|
| `organization_id` | UUID | Tenant |
| `user_id` | string | UID fournisseur d'identité |
| `role` | enum | owner/admin/manager/editor/viewer |
| `status` | enum | invited/active/suspended |
| `scopes` | json array | restrictions facultatives |
| `created_at` | datetime | UTC |

### `tool_catalog_entries`

| Champ | Type | Notes |
|---|---|---|
| `tool_id` | string | `signature-studio` |
| `display_name` | string | Nom du module |
| `version` | string | Version produit |
| `status` | enum | draft/active/retired |
| `capabilities` | json array | Capacités exposées |
| `metadata` | json | Icône, routes, documentation |

### `organization_entitlements`

| Champ | Type | Notes |
|---|---|---|
| `organization_id` | UUID | Tenant |
| `tool_id` | string | Outil |
| `plan_code` | string | Plan commercial |
| `status` | enum | trial/active/suspended/expired |
| `capabilities` | json array | Overrides |
| `quotas` | json | Limites configurables |
| `starts_at` | datetime | UTC |
| `ends_at` | datetime nullable | UTC |

### `brand_profiles`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `product_id` | string nullable | ex. `eventpilot-ia` |
| `slug` | string | Unique dans le tenant |
| `display_name` | string | Nom affiché |
| `descriptor` | string | Signature éditoriale |
| `accent_color` | string | Couleur hex validée |
| `logo_asset_id` | UUID | Actif principal |
| `inverse_logo_asset_id` | UUID nullable | Variante inverse |
| `status` | enum | draft/active/archived |
| `version` | integer | Version métier |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### `brand_assets`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `brand_profile_id` | UUID | Profil |
| `kind` | enum | logo, icon, wordmark |
| `storage_uri` | string | URI contrôlée |
| `public_https_url` | string nullable | Pour signatures hébergées |
| `mime_type` | string | PNG/SVG selon politique |
| `byte_size` | integer | Limite contrôlée |
| `width` | integer nullable | Pixels |
| `height` | integer nullable | Pixels |
| `sha256` | string | Intégrité |
| `version` | integer | Immuable par version |
| `status` | enum | active/superseded/quarantined |

### `person_profiles`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `external_user_id` | string nullable | Lien annuaire |
| `full_name` | string | Requis |
| `job_title` | string | Requis |
| `email` | string | Validé |
| `phone_e164` | string nullable | Normalisé |
| `website_url` | string nullable | HTTPS |
| `social_links` | json | Liste contrôlée |
| `locale` | string | ex. `fr-FR` |
| `status` | enum | active/inactive |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### `signature_templates`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID nullable | null = template système |
| `code` | string | Stable |
| `display_name` | string | Nom UI |
| `template_version` | integer | Immuable |
| `html_template` | text | Source serveur contrôlée |
| `text_template` | text | Source texte |
| `allowed_fields` | json | Contrat |
| `compatibility_profile` | json | Clients supportés |
| `status` | enum | draft/active/retired |

### `signatures`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `person_profile_id` | UUID | Collaborateur |
| `brand_profile_id` | UUID | Marque |
| `template_id` | UUID | Template |
| `status` | enum | draft/in_review/approved/published/archived |
| `current_version_id` | UUID nullable | Version courante |
| `created_by` | string | UID |
| `created_at` | datetime | UTC |
| `updated_at` | datetime | UTC |

### `signature_versions`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `signature_id` | UUID | Parent |
| `version_number` | integer | Monotone |
| `input_snapshot` | json | Données immuables |
| `brand_snapshot` | json | Marque immuable |
| `template_snapshot` | json | Template/version |
| `rendered_html` | text | Sans script |
| `rendered_text` | text | Texte |
| `render_hash` | string | SHA-256 canonique |
| `created_by` | string | UID |
| `created_at` | datetime | UTC |
| `approved_by` | string nullable | UID |
| `approved_at` | datetime nullable | UTC |

### `export_artifacts`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `signature_version_id` | UUID nullable | Individuel |
| `bulk_job_id` | UUID nullable | Lot |
| `format` | enum | html/txt/zip |
| `storage_uri` | string | Stockage objet |
| `mime_type` | string | Vérifié |
| `byte_size` | integer | Vérifié |
| `sha256` | string | Intégrité |
| `expires_at` | datetime nullable | Rétention |
| `created_by` | string | UID |
| `created_at` | datetime | UTC |

### `bulk_generation_jobs`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `status` | enum | queued/running/completed/failed/cancelled |
| `requested_count` | integer | Total |
| `success_count` | integer | Réussis |
| `failure_count` | integer | Échecs |
| `input_manifest` | json | Références validées |
| `result_manifest` | json nullable | Résultats |
| `created_by` | string | UID |
| `created_at` | datetime | UTC |
| `completed_at` | datetime nullable | UTC |

### `audit_events`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID | Clé primaire |
| `organization_id` | UUID | Tenant |
| `actor_user_id` | string | UID ou service |
| `action` | string | Verbe canonique |
| `resource_type` | string | signature/template/etc. |
| `resource_id` | string | ID opaque |
| `request_id` | string | Corrélation |
| `metadata` | json | Sans secrets |
| `occurred_at` | datetime | UTC |

## Contraintes clés

- Index unique `(organization_id, brand_profiles.slug)`.
- Index unique `(signature_id, version_number)`.
- `signature_versions` n'est jamais mis à jour après création, sauf champs d'approbation atomiques.
- Toute requête doit filtrer par `organization_id` dérivé du contexte autorisé.
- Les actifs quarantined ne peuvent pas être rendus.
- Le `render_hash` est calculé sur un JSON canonique + version du moteur.
