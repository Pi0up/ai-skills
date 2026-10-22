# Fiche Écran Déduite : L001!filtres

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `L001!filtres`
- **Type de Composant** : Modale Rattachée (`!`)
- **Écran Hôte** : `L001`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `modal=OPEN`
- `target=L001`

---

## 2. Contenus & Capacités Actionnables
- Sélection des labels écologiques (Clef Verte, Panda LPO, Écolabel Européen)
- Critères énergétiques : Panneaux solaires, toilettes sèches, phyto-épuration
- `FEAT-APPLIQUER-FILTRES` (Validation et actualisation de la grille)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur le bouton « Filtres Avancés » sur `L001`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur `L001` avec grille rechargée

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `filter_modal_opened`, `label_clef_verte_toggled`, `filter_submitted`
