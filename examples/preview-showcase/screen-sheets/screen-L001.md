# Fiche Écran Déduite : L001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `L001`
- **Type de Composant** : Page Liste (Catalogue Datagrid)
- **URL Canonique** : `/stays`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Point de passage obligatoire vers la réservation)

---

## 1. Contexte d'Usage & États Observables
- `search=ACTIVE`
- `region=ALPES`
- `ecolabel=FILTERED`

---

## 2. Contenus & Capacités Actionnables
- `FEAT-FILTRER` (Déclenchement popin `!filtres`)
- `FEAT-CHOISIR-DATES` (Sélection des créneaux de disponibilité)
- `FEAT-DEVENIR-HOTE` (Renvoi fonctionnel vers `F002`)
- Module transverse `M001` (`!aide`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `HOME` via le moteur de recherche
- Accès direct via `/stays`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `C001` (Fiche Détail Écolodge) lors du clic sur une carte
- Vers `L001!filtres` pour affiner les critères environnementaux
- Vers `F002` pour proposer son propre logement éco-responsable

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays`
- **Événements** : `filter_ecolabel_applied`, `sort_price_changed`, `lodge_card_click`
