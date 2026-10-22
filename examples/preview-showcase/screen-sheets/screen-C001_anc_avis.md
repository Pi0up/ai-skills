# Fiche Écran Déduite : C001#avis

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001#avis`
- **Type de Composant** : Ancre Interne (`#`)
- **Écran Hôte** : `C001`
- **URL Canonique** : `/stays/[id]#avis`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `section=REVIEWS`
- `lodge=SELECTED`

---

## 2. Contenus & Capacités Actionnables
- Liste des avis certifiés de voyageurs ayant séjourné dans le lodge
- Détail des notes par critères (propreté, respect nature, accueil hôte)
- Filtrage des avis par saison ou note

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Défilement ou clic sur le badge de note en haut de `C001`

---

## 4. Sorties (Où va l'utilisateur ?)
- Navigation dans la fiche `C001`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `scroll_to_reviews`, `filter_reviews_by_rating`
