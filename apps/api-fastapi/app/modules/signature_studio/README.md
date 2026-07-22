# Backend scaffold — JRbIA Signature Studio

Ce dossier réserve le bounded context FastAPI du module.

## Sous-modules prévus

```text
router.py
schemas.py
service.py
renderer.py
sanitizer.py
repository.py
authorization.py
exports.py
audit.py
```

## Responsabilités

- vérifier le Firebase ID token ;
- résoudre l'organisation et les entitlements ;
- valider les profils de marque et collaborateurs ;
- produire un rendu déterministe ;
- assainir le HTML par liste blanche ;
- versionner et approuver ;
- produire les exports et empreintes ;
- écrire les audit events.

## Interdits

- Aucun secret dans les réponses.
- Aucun HTML arbitraire fourni par le client.
- Aucun accès cross-tenant.
- Aucun déploiement public dans ce lot.
