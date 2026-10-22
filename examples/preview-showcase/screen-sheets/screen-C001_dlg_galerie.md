# Fiche Écran Déduite : C001!galerie

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001!galerie`
- **Type de Composant** : Modale Rattachée (`!`)
- **Écran Hôte** : `C001`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `gallery=FULLSCREEN`
- `active_lodge=CONFIRMED`

---

## 2. Contenus & Capacités Actionnables
- Diaporama haute définition des intérieurs et abords naturels
- Visite virtuelle 360° et vidéos d'immersion
- Navigation clavier et gestuelle tactile

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Clic sur une photo ou le lien « Voir toutes les photos » sur `C001`

---

## 4. Sorties (Où va l'utilisateur ?)
- Fermeture et retour à `C001`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `gallery_opened`, `vr_tour_started`, `photo_next`
