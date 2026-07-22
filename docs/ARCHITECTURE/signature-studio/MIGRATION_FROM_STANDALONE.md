# Migration du générateur autonome vers Signature Studio

## Inventaire du prototype v1.1

Le prototype contient :

- six profils de marque embarqués ;
- champs `fullName`, `role`, `email`, `phone`, `site` ;
- aperçu HTML ;
- version texte ;
- copie riche via Clipboard API ;
- fallback `execCommand` ;
- téléchargement HTML ;
- téléchargement TXT ;
- logos en `data:` URI ;
- fonctionnement sans réseau.

## Mapping cible

| Prototype | Module natif |
|---|---|
| Tableau `BRANDS` en JavaScript | `brand_profiles` + registre d'actifs |
| Champs locaux | `person_profiles` + formulaire React |
| `richInner()` | moteur de rendu serveur versionné |
| `textVersion()` | renderer texte serveur |
| `fullHtml()` | export service |
| `navigator.clipboard` | action frontend sur rendu assaini |
| téléchargement Blob | export artifact avec empreinte |
| logo `data:` | stratégie hosted/data_uri configurable |
| absence d'historique | signatures + versions immuables |
| absence d'auth | Firebase Auth + RBAC + entitlements |
| absence d'audit | audit append-only |

## Étapes

1. Geler le prototype comme fixture de référence.
2. Extraire les six profils de marque dans des fixtures versionnées.
3. Reproduire les fonctions de rendu côté serveur.
4. Créer des tests golden HTML/TXT comparant les sorties approuvées.
5. Construire le formulaire React et la preview.
6. Ajouter persistance, workflow et audit.
7. Ajouter catalogue, plans et quotas.
8. Ajouter deep links depuis les cinq produits.
9. Exécuter la matrice e-mail.
10. Pilote privé puis décision humaine de déploiement.

## Non-régression

Pour les six profils de référence, les tests doivent comparer :

- contenu textuel ;
- couleurs ;
- logo associé ;
- liens `mailto`, `tel` et HTTPS ;
- absence de scripts ;
- rendu texte ;
- hash canonique.

Les différences visuelles intentionnelles doivent être documentées et approuvées.
