# Fiche Écran Déduite : EXT-CONSEIL

> Fiche synthétique croisant arborescence et parcours utilisateurs (spec-userflows.md Section 7).

- **Référence Canonique** : `EXT-CONSEIL`
- **Type de Composant** : Service Externe (`EXT`)
- **URL Externe** : `ext://visio-conseil/rdv`
- **Fournisseur** : Organisme Éco-Label
- **Rôles Autorisés** : `HOTE`, `ADMIN`
- **Importance Calculée** : Moyenne (Accompagnement labellisation éco-habitat)

## 1. Contexte d'Usage & États Observables
- **Déclencheur d'Entrée** : Dépôt d'annonce (`F002`) via `FEAT-DEMANDE-LABEL`
- **Rupture Déclarée ⏸** : 48h (Mémoire externe, reprise vers prévisualisation annonce)
- **Signaux de Tracking** : `advisory_session_scheduled`, `advisory_session_completed`
