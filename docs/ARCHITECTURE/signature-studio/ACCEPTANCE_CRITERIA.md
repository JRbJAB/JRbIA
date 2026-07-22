# JRbIA Signature Studio — Critères d'acceptation

## Catalogue et accès

1. Étant donné une organisation sans entitlement, le module n'est pas visible et l'API retourne `403`.
2. Étant donné une organisation autorisée, le module apparaît dans le catalogue avec son plan et ses quotas.
3. Un deep link provenant d'un autre outil ne contourne jamais l'autorisation.

## Profils de marque

4. Les six profils initiaux utilisent exactement leurs slugs, accents et descriptors approuvés.
5. Chaque outil conserve son pictogramme gelé.
6. Un actif superseded n'est plus proposé pour de nouveaux rendus mais reste lié aux versions historiques.

## Création et rendu

7. Les champs nom, fonction et e-mail sont validés.
8. Le téléphone est normalisé en E.164 lorsqu'il est fourni.
9. Le site n'accepte que HTTPS en production.
10. Une même entrée, un même template et une même version de moteur produisent le même `render_hash`.
11. Le HTML exporté ne contient ni script, iframe, formulaire, tracker ni handler `on*`.
12. La version texte contient les mêmes informations fonctionnelles que la version riche.

## Workflow

13. Un editor peut créer et soumettre, mais pas approuver.
14. Une approbation crée une version immuable.
15. Une modification d'une signature approuvée crée un nouveau brouillon.
16. Chaque transition produit un audit event.

## Export

17. HTML, TXT et ZIP possèdent MIME, taille et SHA-256 enregistrés.
18. Les URLs d'export expirent selon la politique du tenant.
19. Le ZIP de lot contient un manifeste et un rapport d'erreurs.
20. Aucun export n'inclut de données d'un autre tenant.

## Compatibilité

21. Le rendu prioritaire est vérifié dans Gmail, Outlook et Apple Mail.
22. Les images bloquées n'empêchent pas la lecture des coordonnées.
23. Le mode sombre conserve un contraste suffisant.
24. La signature reste utilisable sur écran étroit.

## Résilience

25. Le module est sous feature flag.
26. Sa désactivation ne dégrade aucun autre outil.
27. Le générateur autonome reste accessible comme procédure de secours documentée.
28. Aucun déploiement public n'est effectué sans validation humaine explicite.
