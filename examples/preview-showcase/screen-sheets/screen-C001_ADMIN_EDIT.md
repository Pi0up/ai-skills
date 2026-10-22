# Fiche Écran Déduite : C001@ADMIN:EDIT

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `C001@ADMIN:EDIT`
- **Type de Composant** : Variante Combinée (`@ROLE:VARIANT`)
- **Écran de Base** : `C001`
- **URL Canonique** : `/stays/[id]/audit`
- **Rôles Autorisés** : `ADMIN`
- **Importance Calculée** : Critique (Contrôle et régulation de conformité)

---

## 1. Contexte d'Usage & États Observables
- `audit=IN_PROGRESS`
- `role=ADMIN`

---

## 2. Contenus & Capacités Actionnables
- Champs d'édition directe des descriptifs et caractéristiques
- Suspension ou attribution des badges Éco-Labels
- Saisie des motifs d'arbitrage notifiés à l'hôte
- `FEAT-VALIDER-LABEL` (Validation formelle de l'éco-certification)

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Depuis `D002` (Tableau de Bord Administration)
- Depuis la fiche `C001@ADMIN`

---

## 4. Sorties (Où va l'utilisateur ?)
- Retour sur `D002` avec statut de modération à jour

---

## 5. Signaux d'Observabilité & Tracking
- **Pageview** : `/stays/:id/audit`
- **Événements** : `override_label_status`, `save_audit_report`
