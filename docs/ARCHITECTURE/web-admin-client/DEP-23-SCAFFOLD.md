# DEP-23 — Socle commun React/FastAPI

## Statut

Scaffold d’implémentation initial. Aucun runtime hébergé et aucun déploiement public.

## Frontend

- shell React/Vite ;
- Firebase Auth verrouillé par défaut si la configuration manque ;
- sélection d’organisation ;
- catalogue des outils filtré par l’API ;
- route guards organisation + outil ;
- première page native Signature Studio et formulaire d’aperçu ;
- TanStack Query ;
- tokens JRbIA v1.1 ;
- aucune clé sensible et aucun mode dev implicite.

## Backend

- FastAPI ;
- vérification Firebase ID token ;
- résolutions membership, tenant et entitlement côté serveur ;
- plans Starter, Pro, Organisation ;
- repositories Supabase Postgres/Data API derrière protocoles ;
- Firestore conservé uniquement comme adaptateur de rollback temporaire ;
- migrations SQL, RLS et configuration Storage versionnées dans `supabase/` ;
- endpoints catalogue, bootstrap, aperçu, liste et création ;
- rendu déterministe, HTML assaini, images HTTPS par défaut ;
- idempotence de création ;
- tests d’isolation inter-tenant et de capacités.

## Limites volontaires de cette étape

- pas de déploiement ;
- pas de credentials ;
- pas de workflow complet d’approbation ;
- pas de génération en lot ;
- pas de migration de données ;
- pas d’installation automatique Gmail/Microsoft 365 ;
- pas de modification des Apps Script historiques.

## Prochaine tranche

Après revue du scaffold : implémenter le workflow `DRAFT -> IN_REVIEW -> APPROVED`, les versions immuables, l’audit append-only, les brand assets contrôlés et la génération d’exports.


## Révision Supabase

- Supabase Postgres remplace Firestore comme backend par défaut.
- Firebase Auth est conservé et relié par Supabase Third-Party Auth.
- Les repositories Supabase utilisent la Data API avec le JWT utilisateur et la publishable key, afin de conserver RLS.
- Les migrations et politiques RLS sont versionnées dans `supabase/`.
- Le bucket `jrbia-brand-assets` reste privé jusqu'à validation de ses politiques.
