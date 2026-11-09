# Instructions du projet

Ce fichier consigne les règles et instructions spécifiques au comportement de l'assistant sur ce projet.

## 1. Mémorisation des consignes comportementales (Méta-règle)
- **Persistance automatique** : Dès que l'utilisateur précise ou ajuste une consigne sur la façon de se comporter (règles de code, style de réponse, méthodologie, conventions, contraintes), cette consigne doit être immédiatement consignée ou mise à jour dans ce fichier (`GEMINI.md`).
- **Confirmation** : Informer brièvement l'utilisateur de l'enregistrement de la nouvelle consigne dans les instructions du projet.

## 2. Règles générales du projet
- **Langue des livrables** : Les livrables générés par les skills d'Architecture de l'Information (tables de référence, user journeys, fiches écrans, rapports d'audit, plans de test QA/UAT, plans de tracking, libellés de diagrammes) doivent être produits dans la langue utilisée par l'utilisateur dans son prompt ou sa conversation (ex. français si la demande est en français), tout en préservant les identifiants techniques non traduits (`HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`).
- **Nomenclature des fichiers et dossiers générés** : Tous les noms de dossiers et de fichiers créés ou générés doivent être en anglais (`generated/`, `screen-sheets/`, `sitemap-*.mmd`, `preview.html`, etc.).
- **Pureté logique des diagrammes Mermaid (.mmd)** : Les templates et fichiers `.mmd` ne portent aucun style inline (`classDef`, `style`, `linkStyle`, `:::`) ni injection HTML arbitraire ; ils représentent exclusivement la logique structurelle et relationnelle. Les métadonnées sont portées exclusivement par des directives en commentaires `%%@` (`%%@file`, `%%@node`, `%%@edge`, sans frontmatter YAML). Les userflows restent épurés sans marqueurs géométriques (réservés à l'arborescence) ; les actions `ACT` et les attentes `ATT` sont modélisées sous forme de cartes dédiées (respectivement sans bordure et à bordure tiretée avec icône d'horloge) masquables avec contraction topologique de graphe.
- **Visualiseur de référence en ligne (ai-studio)** : Le visualiseur officiel de référence est disponible et maintenu en ligne à l'adresse [https://pi0up.github.io/ai-studio/](https://pi0up.github.io/ai-studio/).
- **Absence de copie locale du visualiseur dans les dossiers générés** : Ne jamais copier, embarquer ni générer de copie locale du visualiseur (notamment `preview.html`) dans les répertoires de fichiers générés (`generated/`). Les répertoires générés contiennent exclusivement les diagrammes et leurs métadonnées (`*.mmd`, `metadata.json`, `screen-sheets/`), jamais l'application du visualiseur. Dans toutes les instructions, guider l'utilisateur pour ouvrir le visualiseur en ligne et y charger le dossier des diagrammes.
- **En-têtes de métadonnées explicites `%%@file` sur les diagrammes Mermaid** : Le parseur du Studio initialisant chaque fichier `.mmd` avec `kind=sitemap` par défaut, il faut inscrire explicitement les métadonnées `%%@file` au début de chaque fichier, avant `flowchart/graph` :
  - Userflow (`PF-*.mmd`) : au minimum `%%@file id=PF-IDENTIFIANT title="Titre du parcours" kind=userflow uc=UC-IDENTIFIANT statut=nominal` (adapter le statut pour les variantes `statut=variante` et segments `statut=segment`, et ajouter `diverge=...` / `rejoint=...` pour les parcours en comportant).
  - Synthèse de cas d'usage (`UC-*-overview.mmd`) : au minimum `%%@file id=UC-IDENTIFIANT title="Titre du cas d'usage" kind=userflow view=uc uc=UC-IDENTIFIANT`.
  - Ne jamais utiliser `kind=sitemap` pour un userflow ou une synthèse UC. Vérifier la correspondance stricte des identifiants avec les documents sources (`UC-*.md`).
  - Sitemap (`sitemap-*.mmd`) : inscrire explicitement `%%@file ... kind=sitemap`.
- **Validation préalable des changements architecturaux majeurs** : Ne jamais apporter de changements structurels ou architecturaux majeurs non explicitement demandés (comme l'inlining de données externes, l'altération du protocole de chargement ou la refonte de formats) sans en demander l'autorisation préalable à l'utilisateur.
- **Studio externe (ai-studio)** : Le code source, le build et les tests du Studio vivent exclusivement dans le dépôt autonome [https://github.com/Pi0up/ai-studio](https://github.com/Pi0up/ai-studio) (publié sur [https://pi0up.github.io/ai-studio/](https://pi0up.github.io/ai-studio/)). Ce projet consomme les releases officielles via `scripts/sync_studio.py` ou la commande CLI `ia-tools studio update` pour mettre à jour le template autonome `unified-preview-template.html`.
- **Synchronisation systématique des spécifications et templates** : Tous les changements demandés doivent obligatoirement être intégrés et répercutés dans les spécifications relatives à ces changements (`specs/`), ainsi que dans les templates de diagrammes `.mmd` correspondants.
- **Distinction stricte Cas d'Usage (UC) vs Parcours (PF) et séparation des fichiers** : Un Cas d'Usage (`UC-xxx`) et un parcours (`PF-xxx`) ne sont pas la même chose. Chaque parcours utilisateur (`PF-*.mmd`) est consigné dans un fichier distinct, strictement linéaire (aucun embranchement interne), et rattaché à son UC via la directive `uc=UC-xxx` (avec `diverge=PF-xxx@N` / `rejoint=PF-xxx@M` pour les variantes). Un Cas d'Usage (`UC-xxx`) est un conteneur logique (représenté comme un dossier de parcours dans le panneau latéral gauche de Studio) qui regroupe tous les parcours permettant d'exécuter l'UC et d'en respecter les objectifs. L'ouverture d'un UC dans Studio affiche sur un même canevas l'ensemble des parcours de cet UC empilés verticalement les uns au-dessus des autres, avec les parcours nominaux (`statut=nominal`) en haut, suivis des variantes et des segments.
- **Non-redondance des intitulés avec les métadonnées** : Dans les fichiers `.mmd`, `metadata.json` et données d'exemple, les titres et libellés ne doivent jamais mentionner les types structurels ou statuts déjà présents en métadonnées (ne pas écrire « Cas d'usage », « Segment », « Variante », « Nominal », « Vue repliée », « Déplié », « (Hub) », « (Popin) », « (Modale) », « (Ancre) », etc.).
- **Format des chemins d'URL relatifs (trailing slash)** : Les chemins d'URL relatifs (segments de cartes ou chemins relatifs résolus hiérarchiquement) doivent impérativement se terminer par un slash `/` final (ex. `stays/`, `[id]/`, `book/`), sauf pour ceux situés en bout de chaîne tels que les ancres (`#...`) et les popins/modales (`!...`), qui ne doivent jamais porter de slash final.
- **Slugs d'URL sémantiques en anglais et reflet du fil d'Ariane** : Les segments d'URL relatifs des pages ne doivent JAMAIS être des codes techniques de page ou de template (ex. proscrire formellement `/c001`, `/l002`, `/h001`, `/f003`, etc.). Chaque segment relatif d'URL doit être un slug sémantique en anglais (minuscules, kebab-case, pluriel pour les collections `projects/`, paramètre dynamique `[id]/` pour les fiches objets, verbe ou qualificatif pour les actions/états `new/`, `edit/`, `settings/`, etc.) dérivé du titre/label de la page, de manière à ce que l'URL canonique complète reflète fidèlement la progression du fil d'Ariane (breadcrumb) de l'application.
- **Règles de rendu des cartes de pages Mermaid (arborescence)** : `pages.md` est la source de vérité. Les diagrammes Mermaid en sont des projections et doivent respecter les règles suivantes pour chaque nœud de page :
  1. Utiliser le champ `label` de `pages.md` comme titre de carte, exactement tel quel (ne pas reformuler, traduire, compléter ou remplacer le libellé ; ne pas inventer de titres différents même dans une vue simplifiée comme `sitemap-overview.mmd` qui peut omettre des pages mais pas altérer leurs libellés ; ne pas préfixer le titre avec le code de page `H001`, `L001`, etc. ; les codes servent d’identifiants Mermaid et peuvent figurer dans une légende séparée, jamais à la place du titre).
  2. Afficher l’URL sur une ligne distincte sous le titre (séparée par `<br/>`). Pour la page racine `HOME`, afficher l’URL canonique absolue `/`. Pour toute page enfant, calculer le chemin relatif en retirant l’URL canonique du parent de celle de l’enfant (le chemin relatif ne commence jamais par `/` ; ajouter `/` final aux segments statiques affichés dans les cartes ; conserver les paramètres dynamiques, par exemple `projets/:projetId/` ou `[id]/` ; ne pas remplacer ni modifier l’URL canonique absolue enregistrée dans `pages.md`).
  3. Exemple conforme : `HOME["Accueil du portail<br/>/"]`, `H001["Sitactivity<br/>sitactivity/"]`, `H002["Administration<br/>administration/"]`.
- **Convention racine du dossier de documentation et sous-dossier generated/ unique** : Tous les artefacts d'Architecture de l'Information d'un même projet (tables d'arborescence `pages.md`, `roles.md`, etc., cas d'usage `UC-*.md`, glossaire de contexte, plans dérivés) résident dans un unique dossier racine pour le projet (par exemple `infoarchi_docs/` par défaut, ou un dossier déterminé en fonction du projet cible tel que `docs/ia/`).
  - **Détermination du dossier et confirmation utilisateur** : Le dossier racine est déterminé selon le projet cible. Si l'agent ou le skill n'est pas sûr du chemin cible approprié (projet vierge, structure arborescente ambiguë, multiples dossiers candidats), le skill DOIT impérativement demander le chemin à l'utilisateur avant d'écrire ou de générer des fichiers.
  - **Co-localisation insécable Sitemap & Userflows dans `generated/`** : L'ensemble des diagrammes Mermaid d'arborescence (`sitemap-*.mmd`) ET de parcours (`PF-*.mmd`, `UC-*-overview.mmd`), ainsi que le registre de métadonnées (`metadata.json`) et les fiches écrans (`screen-sheets/`), doivent obligatoirement être générés ensemble au sein du même sous-dossier `<dossier_ia>/generated/` chargé par le Studio. Il est formellement interdit de séparer les sorties sitemap et userflows dans des dossiers distincts.

## 3. Gestion Git, Commits, Tests et Releases
- **Commits fréquents et granulaires** : Commiter les modifications par petits groupes logiques d'actions avec un message de commit explicite respectant la syntaxe Conventional Commits.
- **Déclenchement des tests** : Ne pas lancer la suite de tests systématiquement après chaque petite modification. Les tests ne doivent être exécutés que dans les cas suivants :
  1. À la demande explicite de l'utilisateur.
  2. À l'achèvement complet d'une nouvelle feature.
  3. Avant de pousser (`git push`) du code en ligne.

### Stratégie de Branches et Flux Git
- **Branche principale (`main`) protégée** : Tout merge sur `main` se fait exclusivement par Pull Request (PR) validée. Les commits directs sur `main` sont formellement proscrits, sauf hotfix critique immédiat.
- **Branches de travail dédiées** : Toute tâche démarre sur une branche nommée en `kebab-case` préfixée selon sa nature :
  - `feat/<nom-fonctionnalite>`
  - `fix/<nom-correctif>`
  - `hotfix/<nom-urgence>`
  - `perf/<optimisation>`
  - `refactor/<nom-refactoring>`
  - `chore/<sujet>`

### Norme de Commits (Conventional Commits)
Chaque commit doit respecter strictement la syntaxe Conventional Commits afin de piloter le moteur de versioning automatique :
`<type>(<périmètre optionnel>): <description courte à l'impératif>`

Types et impacts sur le numéro de version (SemVer) :
- `feat(...)` : Déclenche un incrément **MINEUR** (`1.1.0` ➔ `1.2.0`). Utilisé pour toute nouvelle fonctionnalité.
- `fix(...)` : Déclenche un incrément **PATCH** (`1.1.0` ➔ `1.1.1`). Utilisé pour les corrections de bugs.
- `hotfix(...)` : Déclenche un incrément **PATCH** (`1.1.0` ➔ `1.1.1`).
- `perf(...)` : Déclenche un incrément **PATCH** (`1.1.0` ➔ `1.1.1`). Utilisé pour les gains de performance.
- `BREAKING CHANGE:` (en corps de message) ou `feat(...!):` / `fix(...!):` : Déclenche un incrément **MAJEUR** (`1.1.0` ➔ `2.0.0`).
- `docs(...)`, `chore(...)`, `refactor(...)`, `test(...)`, `style(...)`, `ci(...)`, `build(...)` : **Aucun changement de version** (pas de release déclenchée).

### Automatisation du Numéro de Version (Semantic-Release)
Le numéro de version n'est **JAMAIS** modifié manuellement dans `package.json`, `plugin.json` ou `pyproject.toml` par un développeur ou un agent. Il est calculé et publié automatiquement :
1. **Déclencheur CI/CD** :
   - À chaque merge de PR sur `main`, GitHub Actions exécute la suite de tests Python (`python -m unittest discover -s tests`).
   - Si les tests passent, l'étape `semantic-release` s'exécute automatiquement sur Ubuntu.
2. **Actions automatisées par Semantic-Release** :
   - **Analyse des commits** depuis le dernier tag Git pour déterminer la prochaine version selon les règles ci-dessus.
   - **Mise à jour synchronisée des fichiers de version** : `package.json`, `package-lock.json`, `plugin.json` et `pyproject.toml` avec le nouveau numéro de version.
   - **Génération / mise à jour de `CHANGELOG.md`** avec catégorisation des commits (`Features`, `Bug Fixes`, `Hotfixes`, `Performance Improvements`).
   - **Packaging de distribution** : Création de l'archive ZIP `information-architecture-v<version>.zip` (contenant skills, plugins, CLI, templates et specs).
   - **Commit Git & Tag automatique** : Création du commit `chore(release): <version> [skip ci]` et du tag Git `v<version>`.
   - **GitHub Release** : Publication de la release avec le changelog et l'archive ZIP téléchargeable.

### Vérification Locale (Dry-Run)
Pour tester et prévisualiser le calcul de version et le changelog en local sans publier :
```bash
npx semantic-release --dry-run
```
