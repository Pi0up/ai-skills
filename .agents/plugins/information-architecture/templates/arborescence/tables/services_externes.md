# Table `services_externes` — Référentiel des Services & Systèmes Externes

> Définit les pages, portails et systèmes tiers hors-arbre intervenant dans les parcours utilisateurs.
> Conforme à spec-arborescence.md (Section 5.2 & 6.5).

| code | label | url | fournisseur | access | fonctionnalites |
| :--- | :--- | :--- | :--- | :--- | :--- |
| EXT-3DSECURE | Challenge bancaire 3D-Secure | ext://banque-partenaire/3ds | Banque Partenaire | VOYAGEUR, ADMIN | FEAT-SAISIE-CB |
| EXT-CONSEIL | Audit & échange visio labellisation | ext://visio-conseil/rdv | Organisme Éco-Label | HOTE, ADMIN | FEAT-DEMANDE-LABEL |
