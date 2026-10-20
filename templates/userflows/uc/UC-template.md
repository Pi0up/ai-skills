---
uc_id: UC-DOSSIER
nom: Submit complete application
nature: metier
importance: critique
objectifs: [OBJ-DOSSIER-01]
roles: [MANAGER]
suivi_valeur: yes
part_valeur_indicative: 30%
---

# Use Case: UC-DOSSIER — Submit complete application

## 1. General Description
Allows a manager to review, complement with supporting documents, and submit an application for final processing.

---

## 2. Nominal Journey: PF-DOSSIER-NOM

```yaml
pf_id: PF-DOSSIER-NOM
uc: UC-DOSSIER
objectif: OBJ-DOSSIER-01
statut: nominal
roles: [MANAGER]
ctx_in: origin=SEARCH ; folder=DRAFT ; data=COMPLETE
ctx_out: folder=SUBMITTED
funnel: yes
confiance: RED
validation: QA
```

### Journey Steps

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ECR | ND-010 | C010:EDIT | Opens file | folder=DRAFT |
| 2 | ACT | ND-011 | FEAT-VALIDER-INFOS | Validates information | info=ACQUIRED |
| 3 | CALL | — | PF-DOSSIER-PJ-SEG | Attaches and verifies supporting documents | docs=VALID ; folder=READY |
| 4 | ECR | ND-020 | C010 | Returns to file (landing screen) | folder=READY |
| 5 | ACT | ND-021 | FEAT-SOUMETTRE | Submits file | folder=SUBMITTED |

---

## 3. Factored Segment: PF-DOSSIER-PJ-SEG

```yaml
pf_id: PF-DOSSIER-PJ-SEG
uc: UC-DOSSIER
objectif:
statut: segment
roles: [MANAGER]
ctx_in: folder=DRAFT ; info=ACQUIRED
ctx_out: docs=VALID ; folder=READY
atterrissage: C010
confiance: RED
```

### Segment Steps

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ECR | ND-040 | F010 | Opens attachment upload | docs=EMPTY |
| 2 | ACT | ND-041 | FEAT-TELEVERSER | Uploads files | docs=UPLOADED |
| 3 | ATT | ND-042 | Document inspection | Awaits verification ⏸ | docs=IN_REVIEW |
| 4 | ECR | ND-043 | F010:CONTROLE | Views review result | docs=VALID ; folder=READY |

> **Declared Break on ND-042**:
> - Memory to preserve: Uploaded files
> - Persistence level: persistent
> - Resumption point: ND-043
> - Expected delay: hours

---

## 4. Variant Journey: PF-DOSSIER-VAR-ASSIST

```yaml
pf_id: PF-DOSSIER-VAR-ASSIST
uc: UC-DOSSIER
objectif: OBJ-DOSSIER-01
statut: variante
diverge_de: PF-DOSSIER-NOM@1
rejoint: PF-DOSSIER-NOM@4
roles: [MANAGER]
ctx_in: origin=SEARCH ; folder=DRAFT ; data=MISSING_ATTACHMENT
ctx_out: docs=VALID ; folder=READY
confiance: RED
```

### Variant Steps

| N° | Type | Nœud | Référence | Événement | Contexte produit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ACT | ND-030 | FEAT-DEMANDER-AIDE | Requests advisor support | assistance=REQUESTED |
| 2 | EXT | ND-031 | Advisor phone session | Advisor assists and verifies documents ⏸ | docs=VALID ; folder=READY |

> **Declared Break on ND-031**:
> - Memory to preserve: Application draft and support ticket
> - Persistence level: external
> - Resumption point: ND-020
> - Expected delay: days
