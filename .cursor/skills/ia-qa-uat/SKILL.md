---
name: ia-qa-uat
description: >-
  Functional QA and business UAT test plan generation skill.
  Used to derive step-by-step test suites, validate confidence index progression
  (from RED to YELLOW and GREEN), verify context assertions (ctx_in/ctx_out), and test flow breaks.
---

# Skill: IA QA & UAT Testing

This skill derives functional and business test plans from Information Architecture specifications:
[Section 6 of spec-userflows.md](../../specs/spec-userflows.md#6-confiance).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions are documented in English, **the generated test cases, assertions, preconditions, and test notebooks MUST be written in the language of the user's prompt** (e.g., French if prompting in French, English if prompting in English, etc.). Formal technical tokens (`RED`, `YELLOW`, `GREEN`, `ND-xxx`, `k=V`) retain their syntax.

---

## Journey Confidence Framework

| Index | Status | Condition |
| :--- | :--- | :--- |
| 🔴 `RED` / `ROUGE` | Designed, untested | Initial status when the journey is created. |
| 🟡 `YELLOW` / `JAUNE` | Tested, unmeasured in prod | Requires validation from `QA` (flow integrity), `UAT` (business fitness), or both. |
| 🟢 `GREEN` / `VERT` | Measured in production | Real production funnel analytics confirm design intent (expected conversion rate). |

> **Rule R-50**: A journey's confidence index can never exceed the lowest confidence among journeys it invokes (`CALL`).
> **Rule R-51**: Any modification to a step or call reverts the journey's status to "to be revalidated".

---

## Step-by-Step Procedure

### 1. Select Test Scope
- Choose use case (`UC-xxx`) and target journey (`PF-xxx`).
- Review importance (`critical`, `standard`, `occasional`) to prioritize test efforts.

### 2. Formulate Step-by-Step Test Notebook
Using the template [plan-test-qa-uat-template.md](../../templates/derived/plan-test-qa-uat-template.md):
1. **Preconditions**: Tester role, initial context assertions (`ctx_in`).
2. **Step Table**:
   - Concrete tester action
   - Expected node (`ND-xxx`) and rendered screen
   - Verified produced context in application state
   - Success assertion
3. **Break & Resilience Verification (R-30 / R-31)**:
   - Test resumption after deliberate interruption (tab closure, session timeout).
   - Ensure declared memory (live, persistent, external) is fully restored at the resumption anchor.

### 3. Update Confidence Status
Once scenarios pass:
- Update `confiance: YELLOW` (or `confiance: JAUNE`) and `validation: QA+UAT` in `uc/UC-xxx.md`.
