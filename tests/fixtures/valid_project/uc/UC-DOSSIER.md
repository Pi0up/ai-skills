---
uc_id: UC-DOSSIER
nom: Soumettre un dossier complet
nature: metier
importance: critique
objectifs: [OBJ-DOSSIER-01]
roles: [GESTIONNAIRE]
---

# Cas d'Usage : UC-DOSSIER

## Parcours Nominal : PF-DOSSIER-NOM

```yaml
pf_id: PF-DOSSIER-NOM
uc: UC-DOSSIER
objectif: OBJ-DOSSIER-01
statut: nominal
roles: [GESTIONNAIRE]
ctx_in: origine=RECHERCHE ; dossier=BROUILLON ; donnees=COMPLETES
ctx_out: dossier=SOUMIS
funnel: oui
confiance: ROUGE
```

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ECR | ND-010 | C010:EDIT | Ouvre le dossier | dossier=BROUILLON |
| 2 | ACT | ND-011 | FEAT-VALIDER-INFOS | Valide les informations | infos=ACQUISES |
| 3 | CALL | — | PF-DOSSIER-PJ-SEG | Joint les justificatifs | justificatifs=VALIDES ; dossier=PRET |
| 4 | ECR | ND-020 | C010 | Revient sur le dossier | dossier=PRET |
| 5 | ACT | ND-021 | FEAT-SOUMETTRE | Soumet le dossier | dossier=SOUMIS |

## Segment : PF-DOSSIER-PJ-SEG

```yaml
pf_id: PF-DOSSIER-PJ-SEG
uc: UC-DOSSIER
objectif:
statut: segment
roles: [GESTIONNAIRE]
ctx_in: dossier=BROUILLON ; infos=ACQUISES
ctx_out: justificatifs=VALIDES ; dossier=PRET
atterrissage: C010
```

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ECR | ND-040 | F010 | Ouvre l'ajout de pièces | justificatifs=VIDES |
| 2 | ACT | ND-041 | FEAT-TELEVERSER | Dépose les fichiers | justificatifs=ENVOYES |
| 3 | ATT | ND-042 | Contrôle des pièces | Attend le résultat ⏸ | justificatifs=EN_CONTROLE |
| 4 | ECR | ND-043 | F010:CONTROLE | Voit le résultat | justificatifs=VALIDES ; dossier=PRET |

## Parcours Variante : PF-DOSSIER-VAR-ASSIST

```yaml
pf_id: PF-DOSSIER-VAR-ASSIST
uc: UC-DOSSIER
objectif: OBJ-DOSSIER-01
statut: variante
diverge_de: PF-DOSSIER-NOM@1
rejoint: PF-DOSSIER-NOM@4
roles: [GESTIONNAIRE]
ctx_in: origine=RECHERCHE ; dossier=BROUILLON ; donnees=JUSTIFICATIF_MANQUANT
ctx_out: justificatifs=VALIDES ; dossier=PRET
```

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ACT | ND-030 | FEAT-DEMANDER-AIDE | Demande l'aide d'un conseiller | assistance=DEMANDEE |
| 2 | EXT | ND-031 | Échange téléphonique | Le conseiller complète le dossier ⏸ | justificatifs=VALIDES ; dossier=PRET |
