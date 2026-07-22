# Shared contracts — Signature Studio

Ce dossier contient les contrats partagés entre le Web Admin Client React et l'API FastAPI.

## Fichiers

- `tool-catalog-entry.schema.json` : contrat du catalogue commercial.
- `signature-profile.schema.json` : entrée de rendu.
- `types.ts` : types frontend et entrée de catalogue draft.

## Règles

- Ces fichiers ne contiennent aucun secret.
- Les autorisations ne sont jamais décidées uniquement à partir de ces types frontend.
- Les schémas doivent être versionnés avant toute rupture de contrat.
- Le backend reste l'autorité pour la validation et l'isolation tenant.
