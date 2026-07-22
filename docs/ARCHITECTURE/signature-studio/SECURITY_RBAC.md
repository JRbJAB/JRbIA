# JRbIA Signature Studio — Sécurité, RBAC et entitlements

## Authentification

- Firebase Auth avant tout accès public.
- Jeton ID transmis en `Authorization: Bearer <token>`.
- Vérification serveur : signature, audience, issuer, expiration et révocation selon politique.
- Le frontend ne décide jamais de l'autorisation finale.

## Contexte d'organisation

Les routes utilisent `organization_id` dans le chemin. L'API vérifie que l'utilisateur possède une adhésion active à cette organisation.

Le changement d'organisation dans l'UI provoque un nouveau chargement des droits ; aucun cache d'un autre tenant ne doit être réutilisé.

## Matrice RBAC minimale

| Capacité | owner | admin | manager | editor | viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Lire les signatures | ✓ | ✓ | ✓ | ✓ | ✓ |
| Créer un brouillon | ✓ | ✓ | ✓ | ✓ | — |
| Modifier un brouillon | ✓ | ✓ | ✓ | ✓* | — |
| Soumettre en revue | ✓ | ✓ | ✓ | ✓ | — |
| Approuver/rejeter | ✓ | ✓ | ✓ | — | — |
| Exporter HTML/TXT | ✓ | ✓ | ✓ | selon plan | selon plan |
| Génération en lot | ✓ | ✓ | selon plan | — | — |
| Gérer les templates | ✓ | ✓ | — | — | — |
| Gérer les profils de marque | ✓ | ✓ | — | — | — |
| Lire l'audit | ✓ | ✓ | selon politique | — | — |
| Gérer plans et droits | ✓ | — | — | — | — |

`*` : limité aux brouillons créés ou attribués selon politique du tenant.

## Entitlements commerciaux

L'accès exige :

1. adhésion active à l'organisation ;
2. outil `signature-studio` actif pour l'organisation ;
3. capacité incluse dans le plan ou un override ;
4. quota non dépassé ;
5. ressource appartenant au même tenant.

Exemple de décision :

```json
{
  "tool_id": "signature-studio",
  "plan_code": "pro",
  "capabilities": [
    "signature.read",
    "signature.create",
    "signature.update",
    "signature.approve",
    "signature.export.html",
    "signature.export.text",
    "signature.bulk"
  ],
  "quotas": {
    "active_signatures": 250,
    "bulk_rows_per_job": 500,
    "exports_per_month": 5000
  }
}
```

## Sécurité du rendu HTML

- Pas de `<script>`, iframe, formulaire, objet, SVG arbitraire ou événement `on*`.
- Liste blanche de balises e-mail : `table`, `tbody`, `tr`, `td`, `div`, `span`, `a`, `img`, `br`.
- Styles inline générés uniquement par le moteur ; aucune feuille de style utilisateur.
- URLs autorisées selon contexte : `https:`, `mailto:`, `tel:`.
- Les valeurs sont échappées avant interpolation.
- Attributs d'image contrôlés ; dimensions plafonnées.
- Aucun pixel de tracking ni paramètre de télémétrie caché.
- Le rendu est produit côté serveur à partir d'un template versionné.

## Actifs de marque

- MIME, taille, dimensions et SHA-256 vérifiés à l'import.
- Les SVG ne sont acceptés que si sanitizés et rasterisés pour les exports e-mail.
- Les URLs publiques sont servies depuis un domaine contrôlé.
- Les actifs peuvent être révoqués ou superseded sans altérer les versions historiques approuvées.

## Audit

Tout événement sensible comprend :

- organisation ;
- acteur ;
- action ;
- type et ID de ressource ;
- request ID ;
- horodatage ;
- métadonnées minimisées.

Les logs ne contiennent pas de jetons, secrets, HTML complet ou données personnelles inutiles.

## Protection inter-tenant

Tests obligatoires :

- ID d'une autre organisation dans l'URL ;
- ressource d'un autre tenant dans le payload ;
- cache frontend après changement de tenant ;
- export partagé avec URL expirée ;
- élévation de rôle via paramètres client ;
- deep link produit falsifié.

Toutes ces tentatives doivent produire `403` ou `404` selon la politique anti-énumération et un événement de sécurité approprié.
