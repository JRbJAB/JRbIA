# ADR-002 — Arbitrages d’implémentation validés pour Signature Studio

**Statut :** accepté le 22 juillet 2026, puis révisé pour la persistance par ADR-003 le 23 juillet 2026  
**Périmètre :** DEP-23 — socle commun React/FastAPI  
**Garde-fous :** `NO_PUBLIC_DEPLOY`, `HUMAN_REVIEW_REQUIRED`, `AUTH_BEFORE_PUBLIC_ACCESS`

## Décisions

1. **Persistance du MVP : Supabase Postgres**, derrière des protocoles de repository. Le premier scaffold Firestore est conservé temporairement comme adaptateur de rollback, mais n’est plus la cible opérationnelle. Voir ADR-003.
2. **Images HTTPS hébergées par défaut** pour les signatures web. Les `data:` URI restent réservées au générateur autonome et aux exports hors ligne explicitement demandés.
3. **Approbation simple par défaut** : un `editor` prépare et soumet ; un `manager`, `admin` ou `owner` approuve. Toute approbation crée une version immuable.
4. **Plans initiaux** : Starter, Pro et Organisation. Les capacités et quotas sont configurables par entitlement et override tenant.
5. **Ordre d’intégration des produits** : EventPilot IA, HéberPilot IA, LocaPilot IA, QAIC, QAIT.

## Conséquences

- Le domaine reste indépendant du SDK de persistance grâce aux repositories.
- Supabase RLS constitue une seconde barrière d’isolation tenant en plus des contrôles FastAPI.
- Firebase Auth reste le fournisseur d’identité initial et ses JWT sont reconnus par Supabase Third-Party Auth.
- Le client React n’embarque aucun logo en dur et n’est jamais source d’autorité pour les droits.
- Les routes sont tenant-scoped et le tenant est vérifié côté FastAPI et côté base.
- Le catalogue d’outils est filtré par entitlements ; un outil non souscrit n’est ni affiché ni accessible par URL directe.
- Le prototype HTML v1.1 reste un fallback hors ligne et une fixture de non-régression, jamais un iframe du produit.
