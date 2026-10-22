# Fiche Écran Déduite : C001:PREVIEW

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001:PREVIEW`
- **Type de Composant** : Variante Structurelle de Page (`:VARIANT`)
- **Écran de Base** : `C001`
- **URL Canonique** : `/stays/[id]/preview`
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Critique (Validation avant publication par l'hôte)

---

## 1. Contexte d'Usage & États Observables
- `draft=VALIDATED`
- `status=PRE_PUBLISH`

---

## 2. Contenus & Capacités Actionnables
- Rendu fidèle de la fiche lodge tel qu'il apparaîtra aux visiteurs
- Bandeau persistant d'avertissement « Mode Prévisualisation »
- Bouton de mise en ligne définitive `FEAT-PUBLIER-ANNONCE`
- Bouton de retour en édition sur `F002`

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Sortie de validation du formulaire `F002` dans `PF-DEPOT-NOM`
- Rejonction de la variante de conseil `PF-DEPOT-VAR-ASSIST`

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `L003` (Mes Annonces) après confirmation de publication
- Vers `F002` pour corriger des informations

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id/preview`
- **Événements** : `preview_mode_toggle`, `confirm_publish_click`
