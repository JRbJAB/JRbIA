# ADR-003 — Supabase comme socle backend unique JRbIA

**Statut :** accepté pour DEP-23 ; Supabase Auth natif remplace le reliquat Firebase.

## Décision

1. Supabase Auth porte l'identité et les sessions.
2. Supabase Postgres porte les données applicatives relationnelles.
3. Supabase Storage porte les actifs de marque versionnés et les exports.
4. FastAPI valide le jeton utilisateur via Supabase Auth puis relaie ce même JWT vers la Data API.
5. Toutes les tables exposées activent RLS ; `anon` n'a aucun droit métier.
6. La clé publishable est autorisée côté client ; aucune service/secret key ne doit y être exposée.
7. Firestore demeure uniquement un adaptateur de rollback de persistance, sans Firebase Auth.

## Conséquences

- Une seule autorité d'identité, une seule console et un seul cycle JWT/RLS.
- L'isolation multi-tenant existe dans FastAPI et Postgres RLS.
- Les tests de sortie exigent deux utilisateurs Supabase et deux organisations.
- Les actifs restent dans un bucket privé tenant-scoped.
- Aucun déploiement public n'est autorisé dans ce lot.

## Garde-fous

- Aucun secret dans Git ou le frontend.
- Aucun `db push` distant sans revue.
- Aucun bucket public par défaut.
- Aucun contournement RLS par service key pour les requêtes utilisateur.
- Les utilisateurs et données de test doivent être dédiés, synthétiques et supprimés après preuve.
