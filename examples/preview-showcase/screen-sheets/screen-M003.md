# Fiche Écran Déduite : M003

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `M003`
- **Type de Composant** : Module Transverse Hors-Arbre
- **Invocation** : `!mod-drawer`
- **Portée (Scope)** : `@ADMIN` (Accessible uniquement sur les pages autorisées au rôle ADMIN)
- **Rôles Autorisés** : `ADMIN`
- **Importance Calculée** : Standard

---

## 1. Contexte d'Usage & États Observables
- `role=ADMIN`
- `drawer=MODERATION`

---

## 2. Contenus & Capacités Actionnables
- Liste des 5 derniers hébergements soumis à validation
- Actions de modération en 1 clic : Valider label, Demander justificatif, Mettre en pause
- Historique d'audit des modérateurs connectés

---

## 3. Entrées (D'où vient l'utilisateur ?)
- Invoqué depuis `D002` (Tableau de Bord Administration)

---

## 4. Sorties (Où va l'utilisateur ?)
- Fermeture et retour à `D002`

---

## 5. Signaux d'Observabilité & Tracking
- **Événements** : `mod_drawer_opened`, `quick_approval_executed`
