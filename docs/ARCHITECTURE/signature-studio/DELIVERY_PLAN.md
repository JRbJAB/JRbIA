# JRbIA Signature Studio — Plan de livraison contrôlé

## Règles permanentes

```text
NO_PUBLIC_DEPLOY=true
HUMAN_REVIEW_REQUIRED=true
AUTH_BEFORE_PUBLIC_ACCESS=true
NO_IFRAME_PROTOTYPE=true
WRAP_SHARED_SERVICES_FIRST=true
```

## Lot A — Spécification et contrats

- [x] Spécification fonctionnelle.
- [x] ADR d'architecture.
- [x] Modèle de données multi-tenant.
- [x] Matrice RBAC/entitlements.
- [x] Contrat OpenAPI draft.
- [x] Schémas JSON et types partagés.
- [x] Critères d'acceptation.
- [ ] Revue humaine et décisions de correction.

## Lot B — Socle commun du Web Admin Client

- [ ] Shell React/Vite.
- [ ] Auth Firebase.
- [ ] Sélecteur d'organisation.
- [ ] Catalogue des outils.
- [ ] Service d'entitlements.
- [ ] Navigation et route guards.
- [ ] Audit de base.
- [ ] Design tokens v1.1 partagés.

## Lot C — MVP Signature Studio

- [ ] Liste des signatures.
- [ ] Formulaire de création.
- [ ] Profils JRbIA et cinq produits.
- [ ] Aperçu déterministe.
- [ ] Rendu HTML/TXT côté serveur.
- [ ] Copie riche et texte.
- [ ] Export individuel.
- [ ] Tests unitaires et snapshots.

## Lot D — Gouvernance et commercialisation

- [ ] Workflow de revue et approbation.
- [ ] Versioning immuable.
- [ ] Plans, capacités et quotas.
- [ ] Gestion des profils de marque.
- [ ] Journal d'audit administrable.
- [ ] Génération en lot et ZIP.

## Lot E — Intégration aux produits

- [ ] Deep link EventPilot IA.
- [ ] Deep link HéberPilot IA.
- [ ] Deep link LocaPilot IA.
- [ ] Deep link QAIC.
- [ ] Deep link QAIT.
- [ ] Contrat de retour vers l'outil source.
- [ ] Tests d'isolation des profils et actifs.

## Lot F — QA et pilote privé

- [ ] Gmail web/mobile.
- [ ] Outlook web/desktop/macOS.
- [ ] Apple Mail macOS/iOS.
- [ ] Mode sombre.
- [ ] Mobile et accessibilité.
- [ ] Tests inter-tenant.
- [ ] Tests quotas et rôles.
- [ ] Pilote privé sur une organisation.
- [ ] Décision humaine avant déploiement public.

## Definition of Done du MVP

- Une organisation autorisée peut utiliser l'outil de bout en bout.
- Une organisation non autorisée ne voit pas la route ni l'API.
- Les six profils de marque de référence produisent des sorties conformes.
- Le rendu est déterministe et auditable.
- Le HTML ne contient aucun script ni tracker.
- Les versions approuvées sont immuables.
- Les exports portent une empreinte et des métadonnées vérifiables.
- La QA e-mail prioritaire est documentée.
- Le prototype autonome reste disponible comme fallback mais n'est pas appelé par le runtime.

## Rollback

- Feature flag par organisation.
- Possibilité de désactiver le module sans affecter les autres outils.
- Conservation des versions et exports existants.
- Retour au générateur autonome pour les opérations urgentes.
- Aucun changement irréversible de données pendant le pilote.
