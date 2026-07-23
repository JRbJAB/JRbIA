# Supabase — JRbIA platform backend

Supabase est le socle backend unique de DEP-23.

## Décisions

- Supabase Auth pour l'identité et les sessions.
- Postgres + RLS pour les données tenant-scoped.
- Supabase Storage pour les actifs et exports.
- FastAPI valide puis relaie le JWT Supabase utilisateur vers la Data API.
- La clé publishable est utilisée côté client ; aucune service/secret key n'est exposée.
- Firestore reste un adaptateur de rollback de persistance uniquement.

## Gate contrôlé

1. Configurer les URL de redirection Auth pour les environnements autorisés.
2. Créer deux utilisateurs de test dédiés et deux organisations synthétiques.
3. Tester les politiques RLS et Storage avec les JWT utilisateurs réels.
4. Prouver les refus inter-tenant.
5. Supprimer utilisateurs, lignes et objets de test.
6. Exécuter tests, typecheck et build avant toute sortie du statut draft.

## Storage

Le bucket `jrbia-brand-assets` reste privé et utilise :

```text
organizations/<organization_id>/brands/<asset>
organizations/<organization_id>/exports/<artifact>
```

`NO_PUBLIC_DEPLOY` et `HUMAN_REVIEW_REQUIRED` restent actifs.
