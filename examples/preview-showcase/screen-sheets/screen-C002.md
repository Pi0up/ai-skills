# Fiche Écran Déduite : C002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C002`
- **Type de Composant** : Page Contenu (Détail Réservation & Facture)
- **URL Canonique** : `/account/bookings/[id]`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `booking=CONFIRMED`
- `invoice=GENERATED`

---

## 2. Contenus & Capacités Actionnables
- Récapitulatif comptable, TVA écologique et reçu de paiement
- Instructions d'arrivée (coordonnées GPS du lodge, code boîte à clés)
- `FEAT-TELECHARGER-FACTURE` (Export PDF conforme)
- `FEAT-NOTER-SEJOUR` (Formulaire de dépôt d'avis post-séjour)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `L002` (Mes Réservations)
- Depuis un lien d'e-mail de confirmation

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur `L002`
- Émission du téléchargement de facture

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/account/bookings/:id`
- **Événements** : `download_invoice`, `submit_stay_review`
