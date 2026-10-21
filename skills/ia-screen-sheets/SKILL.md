---
name: ia-screen-sheets
description: >-
  Screen sheet deduction and generation skill (Section 7 of spec-userflows.md).
  Used to extract detailed synthetic sheets for each screen,
  variant, or module (inputs, outputs, observed contexts, triggered features, roles, signals).
---

# Skill: IA Deduced Screen Sheets

This skill automatically generates detailed screen sheets conforming to:
[Section 7 of spec-userflows.md](../../specs/spec-userflows.md#7-fiche-décran-déduite).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions are provided in English, **screen sheets produced for the project MUST be written in the language of the user's prompt** (e.g., French if prompting in French, English if prompting in English, etc.). Technical references (`C010:EDIT`, `FEAT-XXX`, `ND-xxx`) remain exact.

---

## Role of Screen Sheets

A screen sheet bridges the UX designer, arborescence, and userflows.
It provides an objective, exhaustive inventory of everything occurring on a given screen across all application journeys:
- **Where the user comes from** (upstream nodes, journeys, roles)
- **Which usage contexts occur** (object states, data readiness, user levels)
- **Which functional actions are triggered**
- **Where the user can go next** (outcomes, cross-references, branches)
- **Which session breaks or memory persistences apply**
- **Which observability signals must be tracked**

---

## Execution Command

To generate all screen sheets for the project:
```bash
python -m ia_tools.cli extract-screens --dir . --out generated/screen-sheets
```

---

## Structure of a Deduced Screen Sheet

Each generated sheet (`generated/screen-sheets/screen-[CODE].md`) contains:
1. **Technical Identity**: Canonical reference (`C010:EDIT`), target URL, authorized roles.
2. **Observed Contexts**: Context pairs (`key=VALUE`) encountered when reaching this screen.
3. **Contents and Features**: Actionable `FEAT-XXX` capabilities, accessible modules.
4. **Inputs**: Upstream journeys and steps entering this screen.
5. **Outputs**: Next steps, journey calls, and possible exits.
6. **Associated Breaks**: Resumption data to restore if the screen serves as a recovery anchor.
