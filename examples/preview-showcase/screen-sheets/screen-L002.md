# Fiche Écran Déduite : L002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `L002`
- **Type de Composant** : Page Liste (Mes Réservations)
- **URL Canonique** : `/account/bookings`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Atterrissage des réservations confirmées)

---

## 1. Contexte d'Usage & États Observables
- `booking=CONFIRMED`
- `payment=AUTHORIZED`

---

## 2. Contenus & Capacités Actionnables
- `FEAT-CONSULTER-RESA` (Accès au récapitulatif complet sur `C002`)
- `FEAT-ANNULER-RESA` (Déclenchement popin d'annulation `L002!annulation`)
- Téléchargement du carnet de séjour et des instructions d'éco-gestes

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Sortie du module de paiement `PF-PAIEMENT-SEG` (atterrissage garanti)
- Depuis le hub `H001`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `C002` (Détail Réservation & Facture)
- Vers `L002!annulation`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/account/bookings`
- **Événements** : `view_booking_details`, `open_cancel_dialog`
