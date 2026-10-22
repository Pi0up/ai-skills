# Fiche Écran Déduite : EXT-3DSECURE

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `EXT-3DSECURE`
- **Type de Composant** : Service Externe (`EXT`)
- **URL Externe** : `ext://banque-partenaire/3ds`
- **Fournisseur** : Banque Partenaire
- **Rôles Autorisés** : `VOYAGEUR`, `ADMIN`
- **Importance Calculée** : Haute (Validation bancaire requise)

## 1. Contexte d'Usage & États Observables
- **Déclencheur d'Entrée** : Formulaire de paiement (`F001:PAY`) via `FEAT-SAISIE-CB`
- **Rupture Déclarée ⏸** : 5m (Mémoire volatile, reprise vers attente webhook bancaire)
- **Signaux de Tracking** : `3ds_challenge_started`, `3ds_challenge_completed`
