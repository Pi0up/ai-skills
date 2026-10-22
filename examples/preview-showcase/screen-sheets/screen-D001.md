# Fiche Écran Déduite : D001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `D001`
- **Type de Composant** : Page Dashboard (Tableau de Bord Hôte)
- **URL Canonique** : `/host/dashboard`
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Critique (Pilotage des opérations hébergeur)

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=HOTE`

---

## 2. Contenus & Capacités Actionnables
- Statistiques de réservations, taux d'occupation et impact carbone évité
- `FEAT-GERER-CALENDRIER` (Mise à jour des disponibilités)
- `FEAT-REPONDRE-DEMANDES` (Validation/refus des demandes manuelles de séjour)
- `FEAT-NOUVELLE-ANNONCE` (Accès direct vers `F002`)
- Renvoi fonctionnel vers `C001` pour consulter son annonce publiée

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis le hub `H002` (Espace Hôte)
- Point de départ du parcours de création `PF-DEPOT-NOM`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `F002` (Dépôt d'une Nouvelle Annonce)
- Vers `L003` (Gestion de mes Annonces)
- Vers `C001` (Fiche Détail Écolodge)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/host/dashboard`
- **Événements** : `calendar_synced`, `booking_request_approved`
