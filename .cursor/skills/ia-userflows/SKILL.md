---
name: ia-userflows
description: >-
  Information Architecture Part 2 modeling skill (User Journey Graph / Userflows).
  Used to formalize use cases (UC-xxx.md), nominal flows, variants and segments,
  manage closed context (key=VALUE), model flow breaks (⏸), and generate Mermaid diagrams.
---

# Skill: IA Userflows (Part 2)

This skill implements the normative specification:
[Part 2: Userflows Specification (v2.2)](../../specs/spec-userflows.md).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions and technical rules are documented in English, **deliverables created by this skill (journey descriptions, step event labels, context vocabulary terms, use case summaries, and notes) MUST match the language of the user's prompt** (e.g., French if prompting in French, English if prompting in English, etc.). Technical references (`C010:EDIT`, `FEAT-SUBMIT`, `ND-xxx`, `key=VALUE`, `⏸`) preserve their syntax.

---

## Golden Rules of Userflows

1. **No Human Names in References (R-04)**: Screens are ALWAYS referenced by arborescence codes (`C010:EDIT`, `L001`, `M001`, `C001!quick-view`), actions by their capability (`FEAT-SUBMIT`).
2. **Linear Sequence (P3 / R-25)**: A journey's steps are strictly linear. Any branching is modeled as a distinct journey (a variant).
3. **Declarative Variants (R-26)**: A variant journey must declare `diverge_de: NOMINAL@N` and optionally `rejoint: NOMINAL@M`. It only writes its own specific steps.
4. **Calls and Landings (R-21)**: The step immediately following a `CALL` in the caller journey must be an `ECR` node on the landing screen declared by the callee (`atterrissage`).
5. **Mandatory Breaks (R-30)**: Any `ATT` node (asynchronous wait) or `EXT` node (out-of-app exchange) must declare a break `⏸` along with memory level and resumption point.
6. **Coverage (R-12 / C9)**: All arborescence pages (except hubs `H` and technical pages `E`) must be traversed by at least one journey.
7. **Virtual Children & Canonical Reuse (P9 / R-05)**: When a journey reaches an entity from a secondary list or filtered view, reuse its canonical reference with its variant (`:VARIANT` or `@ROLE`).

---

## Step-by-Step Procedure

### 1. Synchronize the Registry
Ensure the registry is up to date with arborescence tables:
```bash
python -m ia_tools.cli sync-registry
```

### 2. Define the Closed Vocabulary (`registre/glossaire.md`)
All context terms must conform to the syntax `key=VALUE` (e.g., `dossier=BROUILLON ; data=COMPLETE`).

### 3. Write Use Cases (`uc/UC-xxx.md`)
In each use case file:
- YAML Header: `uc_id`, `nom`/`name`, `nature`, `importance`, `objectifs`/`goals`, `roles`.
- Section **Nominal Journey** (`PF-xxx-NOM`):
  - Exactly one nominal flow per objective `OBJ-xxx`.
  - Step table (Step, Type, Node, Reference, Event, Context produced).
- Section **Variants** (`PF-xxx-VAR-yyy`):
  - Declare `diverge_de` and `rejoint`.
- Section **Factored Segments** (`PF-xxx-yyy-SEG`):
  - No independent objective; must declare `atterrissage` (landing screen).

### 4. Verify Nodes and Breaks
- `ECR`: exact technical code from arborescence.
- `ACT`: `FEAT-XXX` capability attached to the current screen.
- `ATT` / `EXT`: include `⏸` in event label and document memory to preserve (live, persistent, external).
- `CALL`: target `PF-xxx` journey identifier.

### 5. Generate Mermaid Diagrams
```bash
# Rich style (default, Figma-style cards with pills + HTML preview)
python -m ia_tools.cli generate-mermaid --type userflows --out generes --style rich --preview

# Standard style (pure GitHub-compatible text)
python -m ia_tools.cli generate-mermaid --type userflows --out generes --style standard
```
Userflows follow a **left-to-right horizontal** layout (`flowchart LR`):
- Collapsed view (`PF-xxx-replie.mmd`)
- Use case overview (`UC-xxx-vue-ensemble.mmd`)
- Interactive preview HTML files with canvas theme.
