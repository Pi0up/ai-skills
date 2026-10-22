# Fiche Écran Déduite : F001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `F001`
- **Type de Composant** : Page Formulaire (Tunnel de Réservation Stepper)
- **URL Canonique** : `/stays/[id]/book`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Entrée dans l'entonnoir de conversion)

---

## 1. Contexte d'Usage & États Observables
- `lodge=SELECTED`
- `dates=SPECIFIED`
- `step=CONFIG_OPTIONS`

---

## 2. Contenus & Capacités Actionnables
- Formulaire d'options : Paniers bio locaux, prêt de vélos électriques, compensation carbone volontaire
- `FEAT-CHOISIR-DATES` (Ajustement du calendrier)
- `FEAT-CONFIG-OPTIONS` (Validation des options de séjour)
- `FEAT-DEMANDE-ACCORD` (Déclenchement variante demande manuelle à l'hôte)
- Module transverse `M002` (`!dates`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `C001` (Fiche Détail Écolodge) via CTA « Réserver ce séjour »

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers attente `ND_ATT1` puis `F001:RECAP` (flux nominal)
- Vers `ND_EXT_APPROVAL` dans la variante d'approbation hôte `PF-RESERVATION-VAR-HOST-APPROVAL`

---

## 5. Ruptures & Mémoire de Session
- Point de départ de la divergence vers `ND_EXT_APPROVAL`
- Conservation de l'état du panier et des options sélectionnées

---

## 6. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id/book`
- **Événements** : `option_local_basket_added`, `submit_booking_step`
