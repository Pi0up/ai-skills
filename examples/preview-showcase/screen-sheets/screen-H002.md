# Fiche Écran Déduite : H002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `H002`
- **Type de Composant** : Page Hub Intermédiaire
- **URL Canonique** : `/host`
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=HOTE`

---

## 2. Contenus & Capacités Actionnables
- Nœud de routage vers `D001` (Tableau de Bord Hôte)
- Accès direct au catalogue de gestion `L003`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis l'action `FEAT-DEVENIR-HOTE` sur `L001` ou `HOME`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `D001` (Tableau de Bord Hôte)
- Vers `L003` (Gestion de mes Annonces)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/host`
