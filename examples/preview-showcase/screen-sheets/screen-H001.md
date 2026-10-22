# Fiche Écran Déduite : H001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `H001`
- **Type de Composant** : Page Hub Intermédiaire
- **URL Canonique** : `/account`
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=VOYAGEUR`

---

## 2. Contenus & Capacités Actionnables
- Nœud de routage automatique vers la première page fille : `L002` (Mes Réservations)
- Navigation latérale de gestion de profil et préférences

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis le menu d'en-tête de `HOME` ou `L001`
- Depuis un lien d'accès direct au profil

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `L002` (Mes Réservations)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/account`
