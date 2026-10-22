# Fiche Écran Déduite : C001

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001`
- **Type de Composant** : Page Contenu (Fiche Détail Écolodge)
- **URL Canonique** : `/stays/[id]`
- **Rôles Autorisés** : `ANONYMOUS`, `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Critique (Point d'ancrage central de l'expérience)

---

## 1. Contexte d'Usage & États Observables
- `lodge=SELECTED`
- `availability=CHECKED`

---

## 2. Contenus & Capacités Actionnables
- Visuels principaux du lodge et description détaillée
- `FEAT-INITIER-RESERVATION` (Transition vers tunnel `F001`)
- `FEAT-OUVRIR-GALERIE` (Ouverture popin `C001!galerie`)
- Ancre `C001#avis` (Section avis vérifiés)
- Ancre `C001#eco-impact` (Bilan carbone & labels)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `L001` (Catalogue des Écolodges)
- Depuis `D001` (Tableau de Bord Hôte via renvoi fonctionnel)

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `F001` (Tunnel de Réservation Séjour)
- Vers `C001!galerie`
- Vers les ancres internes `#avis` et `#eco-impact`

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id`
- **Événements** : `open_gallery`, `scroll_eco_impact`, `cta_start_booking`
