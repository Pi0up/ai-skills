# Instructions du projet

Ce fichier consigne les règles et instructions spécifiques au comportement de l'assistant sur ce projet.

## 1. Mémorisation des consignes comportementales (Méta-règle)
- **Persistance automatique** : Dès que l'utilisateur précise ou ajuste une consigne sur la façon de se comporter (règles de code, style de réponse, méthodologie, conventions, contraintes), cette consigne doit être immédiatement consignée ou mise à jour dans ce fichier (`GEMINI.md`).
- **Confirmation** : Informer brièvement l'utilisateur de l'enregistrement de la nouvelle consigne dans les instructions du projet.

## 2. Règles générales du projet
- **Langue des livrables** : Les livrables générés par les skills d'Architecture de l'Information (tables de référence, user journeys, fiches écrans, rapports d'audit, plans de test QA/UAT, plans de tracking, libellés de diagrammes) doivent être produits dans la langue utilisée par l'utilisateur dans son prompt ou sa conversation (ex. français si la demande est en français), tout en préservant les identifiants techniques non traduits (`HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`).
- **Nomenclature des fichiers et dossiers générés** : Tous les noms de dossiers et de fichiers créés ou générés doivent être en anglais (`generated/`, `screen-sheets/`, `sitemap-*.mmd`, `preview.html`, etc.).
- **Pureté logique des diagrammes Mermaid (.mmd)** : Les templates et fichiers `.mmd` ne portent aucun style inline ni injection HTML arbitraire ; ils représentent exclusivement la logique structurelle et relationnelle. Les métadonnées du fichier sont portées en en-tête YAML frontmatter.
- **Visualiseur unifié (preview.html)** : La prévisualisation de l'ensemble du dossier `generated/` s'effectue au travers d'un unique fichier HTML autonome intégrant le style, le pan/zoom, les filtres, l'affichage contextuel des métadonnées de nœuds, l'export image et l'impression.

## 3. Gestion des commits et exécution des tests
- **Commits fréquents et granulaires** : Commiter les modifications par petits groupes logiques d'actions avec un message de commit explicite.
- **Déclenchement des tests** : Ne pas lancer la suite de tests systématiquement après chaque petite modification. Les tests ne doivent être exécutés que dans les cas suivants :
  1. À la demande explicite de l'utilisateur.
  2. À l'achèvement complet d'une nouvelle feature.
  3. Avant de pousser (`git push`) du code en ligne.
