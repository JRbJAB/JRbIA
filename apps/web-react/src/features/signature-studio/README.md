# Frontend scaffold — JRbIA Signature Studio

Ce dossier réserve le module frontend dans le Web Admin Client commun.

## Composants prévus

```text
SignatureStudioRoutes
SignatureListPage
SignatureEditorPage
SignaturePreview
BrandProfilePicker
PersonProfileForm
TemplatePicker
ApprovalPanel
ExportPanel
BulkGenerationPage
AuditTimeline
```

## Contraintes

- Aucun iframe vers le générateur autonome.
- Aucun secret ou décision d'autorisation dans le frontend.
- Le HTML de preview est rendu dans une surface isolée et provient du backend assaini.
- Les routes sont protégées par l'entitlement `signature-studio` et les capacités.
- Les deep links sont validés et n'accordent aucun droit.

## Source fonctionnelle

Le fichier autonome v1.1 sert uniquement de référence de comportement et de fallback hors ligne.
