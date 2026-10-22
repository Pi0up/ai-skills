# Fiche Écran Déduite : D002

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `D002`
- **Type de Composant** : Page Dashboard (Tableau de Bord Administration & Modération)
- **URL Canonique** : `/admin/dashboard`
- **Rôles Autorisés** : `ADMIN`
- **Importance Calculée** : Critique (Supervision globale de la plateforme)

---

## 1. Contexte d'Usage & États Observables
- `auth=AUTHENTICATED`
- `role=ADMIN`

---

## 2. Contenus & Capacités Actionnables
- File d'attente des logements en attente de validation ou signalés
- `FEAT-MODERER-ANNONCE` (Renvoi fonctionnel vers `C001@ADMIN:EDIT`)
- `FEAT-VALIDER-LABEL` (Attribution administrative d'éco-certification)
- `FEAT-STATISTIQUES-PLATEFORME` (Métriques d'impact environnemental global)
- Module transverse `M003` (`!mod-drawer`)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `HOME` ou lien d'administration directe

---

## 4. Sorties (Où va l'utilisateur ?)
- Vers `C001@ADMIN:EDIT` (Audit et Modération d'un lodge)
- Vers `M003` (Tiroir Modération Express)

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/admin/dashboard`
- **Événements** : `filter_audit_queue`, `approve_eco_certification`
