# Fiche Écran Déduite : L002!annulation

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `L002!annulation`
- **Type de Composant** : Modale Rattachée (`!`)
- **Écran Hôte** : `L002`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `cancel_flow=ACTIVE`
- `target_booking=PRESENT`

---

## 2. Contenus & Capacités Actionnables
- Choix du motif d'annulation (changement d'itinéraire, force majeure)
- Calcul de l'éventuel remboursement selon la politique éco-hôte
- `FEAT-CONFIRMER-ANNULATION` (Exécution de l'annulation)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Bouton « Annuler ce séjour » sur `L002`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur `L002` avec statut mis à jour

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `cancel_dialog_open`, `cancel_confirmed`
