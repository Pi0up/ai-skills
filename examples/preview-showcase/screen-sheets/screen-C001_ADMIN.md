# Fiche Écran Déduite : C001@ADMIN

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001@ADMIN`
- **Type de Composant** : Variante de Page par Rôle (`@ROLE`)
- **Écran de Base** : `C001`
- **URL Canonique** : `/stays/[id]`
- **Rôles Autorisés** : `ADMIN`
- **Importance Calculée** : Standard (Modération et audit)

---

## 1. Contexte d'Usage & États Observables
- `role=ADMIN`
- `moderation_mode=ACTIVE`

---

## 2. Contenus & Capacités Actionnables
- Bandeau supérieur de supervision et indicateurs de signalement
- Historique des modifications apportées par l'hôte
- Bouton d'accès direct au formulaire d'audit `C001@ADMIN:EDIT`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `D002` (Tableau de Bord Administration)
- Consultation d'un lodge avec rôle administrateur actif

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `C001@ADMIN:EDIT` pour correction immédiate ou blocage

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id?view=admin`
- **Événements** : `admin_flag_photo`, `open_direct_edit`
