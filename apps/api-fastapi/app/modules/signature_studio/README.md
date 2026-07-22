# Backend — JRbIA Signature Studio

Le bounded context exécutable initial est dans `app/signature_studio.py` pour garder le scaffold DEP-23 compact et contrôlable.

Il fournit :

- profils de marque seedés ;
- contrats Pydantic ;
- moteur de rendu déterministe ;
- sanitization par liste blanche ;
- repository protocol ;
- repository mémoire pour tests ;
- service de bootstrap, aperçu, création et liste.

Le fichier sera découpé en `domain`, `renderer`, `repository`, `service`, `authorization`, `exports` et `audit` lorsque les contrats du scaffold auront été validés. Le repository Firestore concret est isolé dans `app/firestore.py`.
