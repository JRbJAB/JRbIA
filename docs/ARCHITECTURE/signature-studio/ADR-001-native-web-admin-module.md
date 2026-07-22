# ADR-001 — Intégrer Signature Studio comme module natif du Web Admin Client

- **Statut :** proposé
- **Date :** 2026-07-22
- **Décideur :** Julien / JRbIA
- **Portée :** JRbIA Signature Studio v1.2

## Contexte

Le prototype `OUVRIR_MOI_Generateur_Signatures_JRbIA_v1.1.html` fournit un workflow local fonctionnel : sélection de six identités, saisie des coordonnées, aperçu, copie riche, copie texte et téléchargements HTML/TXT.

JRbIA vise une console web commerciale commune à ses outils. Le prototype ne possède ni authentification, ni multi-tenant, ni droits commerciaux, ni audit, ni versioning centralisé.

## Décision

Réimplémenter les comportements du prototype comme module natif :

- frontend React/TypeScript dans le shell Web Admin Client ;
- API FastAPI ;
- Firebase Auth avant accès ;
- données et autorisations multi-tenant ;
- catalogue et entitlements communs ;
- actifs de marque versionnés ;
- audit append-only ;
- exports HTML/TXT et ZIP ;
- validation humaine.

Le prototype autonome reste un fallback hors ligne et une référence de non-régression.

## Options rejetées

### Iframe du fichier autonome

Rejetée : duplication de navigation, absence d'intégration RBAC, surface de sécurité supplémentaire, maintenance parallèle et incapacité à gouverner les versions.

### Application séparée par produit

Rejetée : duplication de logique, divergence des modèles, coût de maintenance, impossibilité d'administrer les droits de manière cohérente.

### Conservation de Sheets comme interface client

Rejetée pour le parcours commercial : UX insuffisante, permissions et audit limités, mauvaise expérience mobile et difficulté à monétiser des capacités par plan.

## Conséquences positives

- une seule base de code ;
- profils de marque partagés ;
- connexion native aux cinq produits ;
- droits et quotas centralisés ;
- audit et versioning ;
- déploiement progressif ;
- réutilisation future du moteur de rendu dans d'autres outils.

## Coûts et risques

- construction du socle auth/tenant/catalogue ;
- matrice de compatibilité e-mail exigeante ;
- gestion des actifs hébergés ;
- nécessité de tests inter-tenant et de sanitization ;
- migration du prototype vers des composants testables.

## Garde-fous

```text
NO_RUNTIME_IN_THIS_SPEC=true
NO_PUBLIC_DEPLOY=true
AUTH_BEFORE_PUBLIC_ACCESS=true
IA_BACKEND_ONLY=true
HUMAN_REVIEW_REQUIRED=true
NO_IFRAME_PROTOTYPE=true
```
