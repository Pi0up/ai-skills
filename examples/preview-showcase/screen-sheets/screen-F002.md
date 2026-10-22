# Fiche Écran Déduite : F002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `F002`
- **Type de Composant** : Page Formulaire (Dépôt d'Annonce)
- **URL Canonique** : `/host/properties/new`
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Critique (Collecte des hébergements partenaires)

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=HOTE`
- `draft=IN_PROGRESS`

---

## 2. Contenus & Capacités Actionnables
- Saisie des caractéristiques de l'habitat (matériaux écologiques, capacité)
- `FEAT-SAISIE-CARACTERISTIQUES` (Saisie des descriptifs)
- `FEAT-UPLOAD-PHOTOS` (Téléversement des médias et diagnostics DPE)
- `FEAT-DEMANDE-LABEL` (Déclenchement assistance conseiller éco-label)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `D001` (Tableau de Bord Hôte)
- Depuis `L003` (Gestion de mes Annonces)
- Depuis `L001` (via renvoi fonctionnel « Devenir Hôte »)

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers attente automatique `ND_ATT_CADASTRE` puis `C001:PREVIEW` (nominal)
- Vers divergence `ND_EXT_CONSEIL` (variante assistance conseiller 48h)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/host/properties/new`
- **Événements** : `photo_batch_uploaded`, `label_assistance_requested`
