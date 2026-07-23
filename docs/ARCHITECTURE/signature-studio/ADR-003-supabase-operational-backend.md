# ADR-003 — Supabase comme backend opérationnel JRbIA

**Statut :** accepté pour DEP-23, application distante soumise à revue humaine.

## Contexte

Le compte Supabase JRbIA et le plugin ont été activés après le premier scaffold Firestore. La couche repository permet de changer de fournisseur sans réécrire le domaine Signature Studio.

## Décision

1. Supabase Postgres devient la base applicative préférée du MVP.
2. Supabase Storage portera les actifs de marque versionnés et les exports.
3. Firebase Auth reste le fournisseur d'identité initial pour éviter une migration utilisateur prématurée.
4. L'intégration Supabase Third-Party Auth pour Firebase est obligatoire.
5. Le backend FastAPI relaie le JWT Firebase vérifié vers la Data API avec la publishable key, afin que RLS reste appliquée.
6. Toutes les tables exposées activent RLS ; `anon` n'a aucun droit métier.
7. La service/secret key ne doit jamais être utilisée dans le navigateur ni dans le chemin utilisateur normal.
8. Firestore demeure un adaptateur de rollback temporaire, non la cible par défaut.

## Conséquences

- Le schéma relationnel, les contraintes et les migrations sont versionnés dans `supabase/`.
- L'isolation multi-tenant existe à la fois dans FastAPI et dans Postgres RLS.
- Le claim Firebase `role=authenticated` devient un prérequis de connexion à Supabase.
- Les URLs d'actifs de signature seront servies en HTTPS depuis un domaine/bucket contrôlé.
- Une migration future vers Supabase Auth reste possible, mais n'est pas requise pour le MVP.

## Garde-fous

- Aucun secret Supabase dans Git ou le frontend.
- Aucun `db push` distant sans revue.
- Aucun bucket public par défaut.
- Aucun contournement RLS par service key pour les requêtes utilisateur.
- Aucun déploiement public dans ce lot.
