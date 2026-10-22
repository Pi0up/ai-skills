# Fiche Écran Déduite : L003

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `L003`
- **Type de Composant** : Page Liste (Gestion des Annonces Hôte)
- **URL Canonique** : `/host/properties`
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Critique (Atterrissage après création d'annonce)

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=HOTE`
- `status=LISTING_ACTIVE`

---

## 2. Contenus & Capacités Actionnables
- Tableau de bord des lodges actifs, en cours de modération ou brouillons
- `FEAT-EDITER-LOGEMENT` (Modification des créneaux et tarifs)
- `FEAT-DESACTIVER-LOGEMENT` (Mise en pause saisonnière)
- Bouton de création renvoyant vers `F002`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis le hub `H002`
- Atterrissage final du parcours `PF-DEPOT-NOM` et `PF-DEPOT-VAR-ASSIST`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `F002` (Dépôt d'une Nouvelle Annonce)
- Vers `C001:PREVIEW` pour vérifier le rendu visiteur

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/host/properties`
- **Événements** : `click_create_listing`, `toggle_listing_availability`
