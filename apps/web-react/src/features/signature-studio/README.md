# Frontend — JRbIA Signature Studio

La première implémentation native est regroupée temporairement dans `src/signature-studio.tsx` afin de valider le shell, les routes protégées et le contrat API avant découpage fin.

## Déjà câblé dans DEP-23

- route catalogue ;
- gate organisation ;
- gate entitlement `signature-studio` ;
- bootstrap du plan, des quotas et des six profils de marque ;
- formulaire d’aperçu ;
- rendu dans un iframe **sandboxé uniquement pour la prévisualisation HTML générée** ;
- aucune iframe du prototype autonome.

Le découpage par pages, hooks, composants et tests viendra après validation du scaffold.
