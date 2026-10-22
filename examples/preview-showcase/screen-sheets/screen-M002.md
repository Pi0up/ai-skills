# Fiche Écran Déduite : M002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `M002`
- **Type de Composant** : Module Transverse Hors-Arbre
- **Invocation** : `!dates`
- **Portée (Scope)** : `AUTH` (Accessible sur toutes les pages authentifiées)
- **Rôles Autorisés** : `VOYAGEUR`, `HOTE`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `drawer=DATES`

---

## 2. Contenus & Capacités Actionnables
- Calendrier interactif multipériodes
- Sélection rapide d'options additionnelles en cours de tunnel
- Calcul immédiat des suppléments taxe de séjour

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Invoqué depuis `F001` (Tunnel de Réservation)

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour à l'étape active du tunnel

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `dates_drawer_opened`, `slot_selected`
