# DEP-25 — preuve RLS et Storage

**Date :** 2026-07-23
**Projet :** `uqyiribzemwnjyekptkj`
**Statut :** réussi pour la couche PostgreSQL/RLS/Storage
**Déploiement public :** aucun

## Résultat

La matrice transactionnelle `supabase/tests/dep25_rls_storage.sql` a exécuté
12 contrôles avec deux identités JWT synthétiques et deux organisations.

Résultat retourné :

```json
{
  "status": "PASS",
  "tests": 12,
  "mode": "transactional synthetic JWT claims",
  "cleanup": "ROLLBACK"
}
```

## Contrôles couverts

1. visibilité limitée à l’organisation de l’identité A ;
2. visibilité limitée à sa propre adhésion ;
3. visibilité limitée à ses droits produit ;
4. absence de visibilité sur les signatures de l’autre organisation ;
5. isolation des objets Storage ;
6. création et modification d’un brouillon dans sa propre organisation ;
7. refus de modification inter-tenant ;
8. refus de création de signature inter-tenant ;
9. refus d’upload Storage inter-tenant ;
10. isolation de l’organisation B ;
11. isolation des signatures de B ;
12. accès en lecture de B et refus d’upload pour son rôle `viewer`.

## Nettoyage certifié

Le test se termine par `ROLLBACK`. Une requête de contrôle indépendante a
confirmé zéro résidu :

```json
{
  "organizations": 0,
  "memberships": 0,
  "entitlements": 0,
  "signatures": 0,
  "storage_objects": 0
}
```

## Limite de la preuve

Cette preuve valide les politiques PostgreSQL et Storage à partir des claims
JWT vus par Postgres. Elle ne remplace pas encore un parcours bout en bout
Supabase Auth avec création de session réelle, rafraîchissement de jeton et
appel HTTP via le client React/FastAPI.

La PR doit rester en brouillon jusqu’à cette dernière preuve et à la revue
humaine.
