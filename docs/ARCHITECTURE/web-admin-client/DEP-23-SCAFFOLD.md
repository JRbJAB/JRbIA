# DEP-23 — Socle commun React/FastAPI

## Statut

Scaffold d’implémentation initial. Aucun runtime hébergé et aucun déploiement public.

## Frontend

- shell React/Vite ;
- Supabase Auth verrouillé par défaut si la configuration manque ;
- sélection d’organisation ;
- catalogue des outils filtré par l’API ;
- route guards organisation + outil ;
- première page native Signature Studio et formulaire d’aperçu ;
- TanStack Query ;
- tokens JRbIA v1.1 ;
- aucune clé sensible et aucun mode dev implicite.

## Backend

- FastAPI ;
- validation du jeton natif Supabase via Auth ;
- résolutions membership, tenant et entitlement côté serveur ;
- repositories Supabase Postgres/Data API derrière protocoles ;
- Firestore conservé uniquement comme adaptateur de rollback de persistance ;
- migrations SQL, RLS et Storage versionnées ;
- endpoints catalogue, bootstrap, aperçu, liste et création ;
- rendu déterministe, HTML assaini et idempotence de création.

## Gate avant sortie du brouillon

- créer deux utilisateurs Supabase de test dédiés ;
- créer deux organisations synthétiques et leurs memberships ;
- prouver les autorisations intra-tenant et les refus inter-tenant ;
- tester lecture, insertion, mise à jour et refus Storage ;
- supprimer toutes les données de test ;
- exécuter les tests Python, le typecheck et le build frontend ;
- conserver les preuves, sans déploiement public.
