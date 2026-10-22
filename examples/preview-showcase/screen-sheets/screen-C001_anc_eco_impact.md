# Fiche Écran Déduite : C001#eco-impact

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001#eco-impact`
- **Type de Composant** : Ancre Interne (`#`)
- **Écran Hôte** : `C001`
- **URL Canonique** : `/stays/[id]#eco-impact`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `section=CARBON_IMPACT`
- `ecolabel=CERTIFIED`

---

## 2. Contenus & Capacités Actionnables
- Calculateur d'empreinte carbone comparée (vs séjour hôtel traditionnel)
- Justificatifs des labels environnementaux (Clef Verte, Refuge LPO, etc.)
- Charte de préservation de la biodiversité locale

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur la puce Éco-Score en tête de `C001`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour au bouton de réservation sur `C001`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `scroll_eco_impact`, `view_carbon_calculator`
