# Instructions du projet

Ce fichier consigne les règles et instructions spécifiques au comportement de l'assistant sur ce projet.

## 1. Mémorisation des consignes comportementales (Méta-règle)
- **Persistance automatique** : Dès que l'utilisateur précise ou ajuste une consigne sur la façon de se comporter (règles de code, style de réponse, méthodologie, conventions, contraintes), cette consigne doit être immédiatement consignée ou mise à jour dans ce fichier (`GEMINI.md`).
- **Confirmation** : Informer brièvement l'utilisateur de l'enregistrement de la nouvelle consigne dans les instructions du projet.

## 2. Règles générales du projet
- **Langue des livrables** : Les livrables générés par les skills d'Architecture de l'Information (tables de référence, user journeys, fiches écrans, rapports d'audit, plans de test QA/UAT, plans de tracking, libellés de diagrammes) doivent être produits dans la langue utilisée par l'utilisateur dans son prompt ou sa conversation (ex. français si la demande est en français), tout en préservant les identifiants techniques non traduits (`HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`).
- **Nomenclature des fichiers et dossiers générés** : Tous les noms de dossiers et de fichiers créés ou générés doivent être en anglais (`generated/`, `screen-sheets/`, `sitemap-*.mmd`, `preview.html`, etc.).
- **Pureté logique des diagrammes Mermaid (.mmd)** : Les templates et fichiers `.mmd` ne portent aucun style inline (`classDef`, `style`, `linkStyle`, `:::`) ni injection HTML arbitraire ; ils représentent exclusivement la logique structurelle et relationnelle. Les métadonnées sont portées exclusivement par des directives en commentaires `%%@` (`%%@file`, `%%@node`, `%%@edge`, sans frontmatter YAML). Les userflows restent épurés sans marqueurs géométriques (réservés à l'arborescence) et les attentes `ATT` sont modélisées en pastilles (chips) posées sur les liens comme les `ACT`.
- **Visualiseur unifié (preview.html)** : La prévisualisation de l'ensemble du dossier `generated/` s'effectue au travers d'un unique fichier HTML autonome (moteur de rendu SVG dédié piloté par le design system avec repli Mermaid brut, pan/zoom, aperçu au survol, navigation croisée arborescence ↔ parcours, filtres, inspection des métadonnées, export image et impression, thème initial détecté selon l'OS avec bascule manuelle).
- **Moteur de visualisation neutre (sans données en dur)** : `preview.html` est strictement un moteur de visualisation indépendant et générique. Aucun contenu de diagramme `.mmd` ou de données métier ne doit y être intégré ou inliné en dur dans le livrable HTML final. Les fichiers `.mmd`, `metadata.json` et fiches écrans doivent obligatoirement être chargés dynamiquement depuis le système de fichiers (File System Access API / sélection de dossier / drag & drop) ou via requêtes HTTP (`fetch`) si servi par un serveur web local. L'outillage peut ainsi modifier ou regénérer les `.mmd` sans jamais avoir à reconstruire `preview.html`.
- **Validation préalable des changements architecturaux majeurs** : Ne jamais apporter de changements structurels ou architecturaux majeurs non explicitement demandés (comme l'inlining de données externes, l'altération du protocole de chargement ou la refonte de formats) sans en demander l'autorisation préalable à l'utilisateur.
- **Fichier de distribution unique dans dist** : Le build de production du dossier `studio/` doit générer uniquement le fichier `dist/preview.html` sans laisser de `index.html` résiduel.

## 3. Gestion des commits et exécution des tests
- **Commits fréquents et granulaires** : Commiter les modifications par petits groupes logiques d'actions avec un message de commit explicite.
- **Déclenchement des tests** : Ne pas lancer la suite de tests systématiquement après chaque petite modification. Les tests ne doivent être exécutés que dans les cas suivants :
  1. À la demande explicite de l'utilisateur.
  2. À l'achèvement complet d'une nouvelle feature.
  3. Avant de pousser (`git push`) du code en ligne.
