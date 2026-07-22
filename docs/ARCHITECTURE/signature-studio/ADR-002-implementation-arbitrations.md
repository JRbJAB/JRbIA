# ADR-002 — Arbitrages d’implémentation validés pour Signature Studio

**Statut :** accepté par le propriétaire produit le 22 juillet 2026  
**Périmètre :** DEP-23 — socle commun React/FastAPI  
**Garde-fous :** `NO_PUBLIC_DEPLOY`, `HUMAN_REVIEW_REQUIRED`, `AUTH_BEFORE_PUBLIC_ACCESS`

## Décisions

1. **Firestore pour le MVP**, derrière des protocoles de repository. Les services métier ne dépendent pas directement du SDK Google afin de préserver une migration future vers Cloud SQL.
2. **Images HTTPS hébergées par défaut** pour les signatures web. Les `data:` URI restent réservées au générateur autonome et aux exports hors ligne explicitement demandés.
3. **Approbation simple par défaut** : un `editor` prépare et soumet ; un `manager`, `admin` ou `owner` approuve. Toute approbation crée une version immuable.
4. **Plans initiaux** : Starter, Pro et Organisation. Les capacités et quotas sont configurables par entitlement et override tenant.
5. **Ordre d’intégration des produits** : EventPilot IA, HéberPilot IA, LocaPilot IA, QAIC, QAIT.

## Conséquences

- La base opérationnelle du MVP est Firestore, sans coupler le domaine aux chemins de collection.
- Le client React n’embarque aucun logo en dur et n’est jamais source d’autorité pour les droits.
- Les routes sont tenant-scoped et le tenant est vérifié côté FastAPI.
- Le catalogue d’outils est filtré par entitlements ; un outil non souscrit n’est ni affiché ni accessible par URL directe.
- Le prototype HTML v1.1 reste un fallback hors ligne et une fixture de non-régression, jamais un iframe du produit.
