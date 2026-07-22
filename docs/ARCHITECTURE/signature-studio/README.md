# JRbIA Signature Studio — Spécification produit et technique v1.2

**Statut :** draft de conception soumis à revue humaine  
**Périmètre :** Web Admin Client JRbIA commun aux outils commercialisables  
**Origine fonctionnelle :** `OUVRIR_MOI_Generateur_Signatures_JRbIA_v1.1.html`  
**Garde-fous :** `NO_RUNTIME`, `NO_PUBLIC_DEPLOY`, `HUMAN_REVIEW_REQUIRED`

## 1. Décision

Le générateur HTML autonome devient le prototype fonctionnel de référence d'un module commercialisable nommé **JRbIA Signature Studio**.

Il ne sera pas embarqué en iframe et ne deviendra pas une seconde application parallèle. Ses comportements utiles sont réimplémentés dans le shell React commun, servis par une API FastAPI et gouvernés par les services transverses JRbIA : authentification, organisations, rôles, catalogue d'outils, droits commerciaux, audit, versioning et actifs de marque.

Le fichier autonome reste :

- un mode secours hors ligne ;
- une référence visuelle et fonctionnelle ;
- un artefact de tests de non-régression ;
- un démonstrateur exportable ;
- une preuve de compatibilité minimale.

## 2. Proposition de valeur

Signature Studio permet à une organisation de produire, valider, versionner et exporter des signatures e-mail cohérentes avec ses marques et ses produits, sans manipulation de code.

### Résultats utilisateurs

- Créer une signature individuelle en moins de deux minutes.
- Appliquer automatiquement le bon logo, la bonne couleur et le bon descriptor produit.
- Exporter une version HTML riche et une version texte.
- Copier une signature vers Gmail ou Outlook.
- Produire un lot de signatures pour plusieurs collaborateurs.
- Conserver un historique des versions et des validations.
- Administrer plusieurs marques dans un même tenant.

## 3. Position dans le Web Admin Client

```text
Web Admin Client JRbIA
├── Accueil
├── Catalogue des outils
│   ├── Signature Studio
│   ├── EventPilot IA
│   ├── HéberPilot IA
│   ├── LocaPilot IA
│   ├── QAIC
│   ├── QAIT
│   └── futurs outils JRbIA
├── Organisations
├── Utilisateurs et rôles
├── Identités de marque
├── Abonnements et droits
├── Audit
└── Paramètres
```

### Routes frontend proposées

```text
/admin/tools/signature-studio
/admin/tools/signature-studio/signatures
/admin/tools/signature-studio/signatures/new
/admin/tools/signature-studio/signatures/:signatureId
/admin/tools/signature-studio/templates
/admin/tools/signature-studio/brand-profiles
/admin/tools/signature-studio/bulk
/admin/tools/signature-studio/audit
```

### Deep links depuis les produits

Un outil JRbIA peut ouvrir Signature Studio avec un contexte préchargé :

```text
/admin/tools/signature-studio/signatures/new
  ?product=eventpilot-ia
  &brand_profile=<uuid>
  &person_profile=<uuid>
  &return_to=/admin/tools/eventpilot-ia/team
```

Le contexte est validé côté serveur ; les paramètres de l'URL ne confèrent jamais de droits.

## 4. Utilisateurs et rôles

| Rôle | Capacités principales |
|---|---|
| `owner` | Gérer l'organisation, les plans, les droits, les marques et toutes les signatures. |
| `admin` | Gérer les utilisateurs, modèles, marques et exports. |
| `manager` | Créer, réviser, approuver et exporter pour son périmètre. |
| `editor` | Créer et modifier des brouillons ; demander une validation. |
| `viewer` | Consulter les signatures et versions autorisées. |

Les permissions sont évaluées par capacité, pas uniquement par rôle. Exemples :

```text
signature.read
signature.create
signature.update
signature.approve
signature.export.html
signature.export.text
signature.bulk
signature.template.manage
signature.brand.manage
signature.audit.read
```

## 5. Fonctionnalités

### 5.1 Catalogue et droits commerciaux

- Outil identifié par `signature-studio`.
- Activation par organisation et par plan.
- Capacités et quotas configurables.
- Possibilité d'inclusion dans un bundle produit.
- Support du mode marque blanche dans une phase ultérieure.

### 5.2 Profils de marque

Le système fournit les profils initiaux :

| Identité | Slug | Accent | Descriptor |
|---|---|---:|---|
| JRbIA | `jrbia` | `#2563EB` | L'IA utile aux métiers. |
| EventPilot IA | `eventpilot-ia` | `#2563EB` | Intelligence événementielle |
| HéberPilot IA | `heberpilot-ia` | `#14B8A6` | Intelligence hébergement |
| LocaPilot IA | `locapilot-ia` | `#F97316` | Intelligence locative |
| QAIC | `qaic` | `#7C3AED` | Qualité & Conformité IA |
| QAIT | `qait` | `#0EA5E9` | Tests & Évaluation IA |

Chaque profil référence des actifs versionnés. Le frontend n'embarque pas les logos en dur.

### 5.3 Profils collaborateurs

Champs de base :

- nom complet ;
- fonction ;
- e-mail ;
- téléphone ;
- site ;
- liens sociaux facultatifs ;
- langue ;
- fuseau ;
- établissement ou équipe ;
- statut actif/inactif.

### 5.4 Création et aperçu

- Choix du profil de marque et du modèle.
- Chargement éventuel d'un profil collaborateur.
- Prévisualisation en temps réel.
- Validation des champs et normalisation des URLs.
- Comparaison desktop/mobile.
- Avertissements de compatibilité e-mail.
- Calcul d'un `render_hash` déterministe.

### 5.5 Rendu et export

Formats v1 :

- `text/html` ;
- `text/plain` ;
- copie riche via Clipboard API ;
- copie texte ;
- téléchargement individuel ;
- archive ZIP pour les exports en lot.

Le HTML de signature utilise des tables de présentation, des styles inline et un sous-ensemble strictement autorisé de balises et attributs.

### 5.6 Workflow de validation

```text
DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED
             |             |
             +-> REJECTED  +-> SUPERSEDED
```

- Un `editor` soumet en revue.
- Un `manager`, `admin` ou `owner` approuve selon la politique du tenant.
- Chaque approbation crée une version immuable.
- Une modification après approbation crée un nouveau brouillon.

### 5.7 Génération en lot

- Import CSV validé ou sélection d'utilisateurs existants.
- Prévisualisation des erreurs avant génération.
- Quotas et limite de taille par lot.
- Génération asynchrone seulement lorsque le volume le justifie.
- ZIP avec manifeste, HTML, TXT et rapport d'erreurs.

### 5.8 Audit

Événements minimum :

- création ;
- modification ;
- soumission ;
- approbation ou rejet ;
- export ;
- téléchargement ;
- changement de modèle ;
- changement d'actif de marque ;
- génération en lot ;
- modification des droits.

## 6. Architecture cible

```text
React/Vite Web Admin Client
  -> Firebase Auth ID token
  -> FastAPI gateway
     -> authorization / tenant scope
     -> Signature Studio service
     -> catalog & entitlement service
     -> brand asset registry
     -> audit service
     -> object storage for exports
     -> Firestore or Cloud SQL for metadata
```

### Frontend

- React + TypeScript.
- Composants réutilisables du shell commun.
- React Query ou abstraction équivalente pour les appels API.
- Formulaire typé et validation côté client.
- Prévisualisation sandboxée sans exécuter de script utilisateur.
- Aucun secret, aucune clé fournisseur et aucune décision d'autorisation côté client.

### Backend

- FastAPI.
- Pydantic pour les contrats.
- Vérification du Firebase ID token.
- Résolution du tenant et des droits côté serveur.
- Moteur de rendu déterministe.
- Assainissement HTML par liste blanche.
- Journal d'audit append-only.
- Stockage des exports avec expiration configurable.

### Données

La base applicative devient la source opérationnelle. Sheets reste une surface d'export, de contrôle humain ou de preuve, jamais l'interface client finale.

## 7. Stratégie des images dans les signatures

Les `data:` URI du prototype sont utiles hors ligne, mais ne doivent pas être l'unique stratégie en production.

Ordre recommandé :

1. URL HTTPS publique ou signée vers un actif de marque versionné et contrôlé ;
2. mode embarqué `data:` pour export hors ligne lorsque le client cible le supporte ;
3. package ZIP contenant l'image et les instructions lorsqu'un client impose une installation manuelle.

Le système doit exposer le mode d'image dans les métadonnées du rendu et afficher un avertissement de compatibilité.

## 8. Multi-tenant et sécurité

- Toutes les entités métier portent un `organization_id`.
- Le tenant est dérivé de l'identité et de l'adhésion vérifiées côté serveur.
- Aucune requête ne peut lire ou modifier un autre tenant.
- Les requêtes d'écriture acceptent une clé d'idempotence.
- Les actifs sont contrôlés par type MIME, taille, dimensions et empreinte.
- Les entrées utilisateur sont échappées avant insertion dans le HTML.
- Les URLs sont limitées à `https`, `mailto` et `tel` selon le champ.
- Les exports ne contiennent aucun script.
- Les journaux ne stockent pas les secrets et minimisent les données personnelles.
- Les politiques de rétention sont configurables.

## 9. Compatibilité e-mail et QA

Matrice minimale :

- Gmail web et mobile ;
- Outlook web ;
- Outlook desktop Windows ;
- Outlook macOS ;
- Apple Mail macOS et iOS ;
- Android mail courant.

Contrôles :

- rendu visuel ;
- liens `mailto`, `tel`, HTTPS ;
- images autorisées ou bloquées ;
- mode sombre ;
- petit écran ;
- copier-coller ;
- caractères accentués ;
- version texte ;
- absence de scripts et trackers ;
- conformité des couleurs et pictogrammes.

## 10. Hors périmètre v1

- Installation automatique dans les comptes Gmail ou Microsoft 365.
- Écriture dans les boîtes mail sans consentement OAuth spécifique.
- Campagnes d'e-mailing.
- Tracking d'ouverture ou pixels invisibles.
- Éditeur HTML arbitraire.
- Génération autonome par IA sans validation humaine.
- Déploiement public dans ce lot de spécification.

## 11. Indicateurs produit

- temps médian jusqu'au premier export ;
- taux de validation sans correction ;
- taux d'échec par client e-mail ;
- nombre de signatures actives par organisation ;
- taux d'utilisation par outil source ;
- exports individuels et en lot ;
- anomalies de conformité de marque ;
- consommation de quota.

## 12. Critères de sortie du MVP

- Un utilisateur authentifié ne voit que son organisation.
- Le catalogue affiche Signature Studio uniquement si l'organisation y a droit.
- Les six profils JRbIA initiaux sont disponibles avec les actifs gelés.
- Une signature peut être créée, prévisualisée, soumise, approuvée et exportée.
- Les sorties HTML/TXT sont déterministes pour une même version d'entrée.
- Toute action sensible produit un événement d'audit.
- Les tests de sécurité inter-tenant échouent fermement.
- Les tests de compatibilité e-mail prioritaires sont documentés.
- Aucun iframe ni code autonome parallèle n'est utilisé dans le produit.
- Aucun déploiement public n'est effectué sans validation humaine explicite.

## 13. Livrables de ce lot

- ADR d'architecture ;
- contrat OpenAPI ;
- modèle de données ;
- matrice RBAC et entitlements ;
- schémas JSON partagés ;
- types TypeScript partagés ;
- plan de livraison et critères d'acceptation ;
- scaffolds documentaires frontend et backend ;
- draft PR pour revue.
