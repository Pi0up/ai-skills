# QA & UAT Test Notebook — Information Architecture

> Conforms to spec-userflows.md (Section 6 & 8).
> Tracks confidence progression from RED to YELLOW (QA/UAT) and GREEN (Production).

## 1. Test Context
- **Use Case**: `[UC-ID] - [NAME]` (Importance: `[CRITICAL/STANDARD/OCCASIONAL]`)
- **Tested Journey**: `[PF-ID]` (Status: `[NOMINAL/VARIANT/SEGMENT]`)
- **Tester Role**: `[ROLE_CODE]`
- **Target Index**: 🟡 YELLOW (Validation: `[QA / UAT / QA+UAT]`)

---

## 2. Preconditions & Initial Context (ctx_in)
- **Test Account**: User profile with authorized roles `[ROLES]`.
- **Verified Initial Context**: `[k1=V1 ; k2=V2]`.

---

## 3. Step-by-Step Test Scenario

| Step | Tester Action | Expected Node | Target Screen / Component | Verified Produced Context | Expected Assertion | Result (PASS/FAIL) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Initial navigation to journey | ND-010 (ECR) | `C010:EDIT` | `folder=DRAFT` | Form renders in edit mode | |
| 2 | Click validation button | ND-011 (ACT) | `FEAT-VALIDER-INFOS` | `info=ACQUIRED` | Confirmation message displayed, redirects to attachments | |
| 3 | Invoke attachment sub-journey | CALL | `PF-DOSSIER-PJ-SEG` | `docs=EMPTY` | Opens interface F010 | |
| 4 | Upload valid document file | ND-041 (ACT) | `FEAT-TELEVERSER` | `docs=UPLOADED` | File displays with status 'pending inspection' | |
| 5 | Simulate async wait (Break) | ND-042 (ATT) | — | `docs=IN_REVIEW` | Session close & resume: files remain persisted | |
| 6 | Return to file (Landing screen) | ND-020 (ECR) | `C010` | `folder=READY` | Read-only view renders with active submit button | |
| 7 | Final submission click | ND-021 (ACT) | `FEAT-SOUMETTRE` | `folder=SUBMITTED` | Business goal achieved, receipt displayed | |

---

## 4. Break & Memory Non-Regression Verification
- [ ] Unexpected session termination (tab closure) at step 5 causes no data loss (`persistent` level storage).
- [ ] Resumption anchor `ND-043` faithfully reloads context `folder=DRAFT ; docs=UPLOADED`.
