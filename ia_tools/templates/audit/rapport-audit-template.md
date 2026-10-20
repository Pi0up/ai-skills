# Audit & Consistency Report — Information Architecture

> Global integrity diagnostic and broken link detection report.
> Conforms to spec-userflows.md (Section 8) and spec-arborescence.md (Section 10).

**Audit Date**: [YYYY-MM-DD]  
**Audited Scope**: [Global / Scope: UC-XXX]  
**Global Status**: 🔴 Blocking / 🟡 Warnings / 🟢 Compliant  

---

## 1. Summary of Detected Issues

| Category | Blocking (Must) | Warnings (Should) | Suggestions (Could) |
| :--- | :--- | :--- | :--- |
| **Arborescence (C1-C15)** | 0 | 0 | 0 |
| **Userflows (R-01-R-51)** | 0 | 0 | 0 |
| **Optimizations (R-70-R-72)** | — | — | 0 |
| **Total** | **0** | **0** | **0** |

---

## 2. Detailed Findings and Correction Proposals

| Rule | Severity | Affected Elements | Finding | Proposal |
| :--- | :--- | :--- | :--- | :--- |
| `R-01` | **Blocking** | `ND-010 (ECR C099)` | Screen code 'C099' does not exist in pages.md (Broken link). | Replace with 'C010' or declare 'C099' in pages.md. |
| `R-21` | **Blocking** | `PF-DOSSIER-NOM step 4` | Step following CALL PF-DOSSIER-PJ-SEG does not land on 'C010'. | Insert ECR C010 node immediately following CALL. |
| `R-30` | **Blocking** | `ND-042 (ATT)` | Asynchronous wait without declared break ⏸. | Add ⏸ marker and document memory and resumption point. |
| `C9 / R-12` | **Blocking** | `L003` | Page L003 is not traversed by any user journey. | Define a use case or integrate L003 into an existing journey. |
| `R-15` | **Warning** | `PF-RECHERCHE-SEG` | Segment PF-RECHERCHE-SEG is never called (Orphan segment). | Invoke this segment from a journey or archive it. |

---

## 3. Corrective Action Plan
1. **Priority 1**: Resolve blocking issues (broken links, invalid template codes, undeclared screens).
2. **Priority 2**: Complete missing tracking signals on funnel steps.
3. **Priority 3**: Re-validate model with `ia-tools validate`.
