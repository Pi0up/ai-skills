# Fiche Écran Déduite : HOME

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `HOME`
- **Type de Composant** : Page Racine (Homepage)
- **URL Canonique** : `/`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `HOTE`, `ADMIN`
- **Importance Calculée** : Critique (Entrée principale de la plateforme)

---

## 1. Contexte d'Usage & États Observables
- `origin=DIRECT`
- `session=INITIALIZED`

---

## 2. Contenus & Capacités Actionnables
- `FEAT-RECHERCHER` (Recherche par massif montagneux et dates)
- `FEAT-EXPLORER-THEMES` (Navigation par éco-labels : Refuge LPO, Clef Verte)
- Module transverse `M001` (`!aide`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Accès direct via URL racine `/`
- Clic sur le logo depuis n'importe quelle page de la plateforme

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `L001` (Catalogue des Écolodges) via recherche ou sélection
- Vers `H001` (Espace Voyageur) après authentification
- Vers `H002` (Espace Hôte Partenaire) pour devenir hôte
- Vers `D002` (Supervision Admin) pour les modérateurs

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/home`
- **Événements** : `click_search`, `click_featured_lodge`, `filter_ecolabel_hero`
