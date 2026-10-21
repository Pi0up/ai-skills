---
name: ia-scoping
description: >-
  Scoping and initial extraction skill for Information Architecture.
  Used when a specification is partial, incomplete, or unstructured (brief, user stories, existing codebase)
  to extract user roles, business entities, candidate screen templates, and core use cases.
---

# Skill: IA Scoping & Initial Extraction

This skill acts as the entry point when dealing with **raw, fuzzy, or incomplete specifications**.
It extracts and scopes foundational elements before formalizing the arborescence and user journeys.

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions and prompts are in English, **deliverables created for the project (tables, notes, extracted summaries, questions) MUST be produced in the language used by the user** (e.g. French if the user asks in French, English if in English, etc.).

---

## Scoping Objectives
1. Extract the closed list of **user profiles (Roles)**.
2. Identify **business entities manipulated** (lifecycle, key states).
3. Determine candidate **screen trees** and their canonical template types (`HOME`, `L`, `C`, `F`, `D`, `E`, `H`, `M`) adhering strictly to the **single parent rule**.
4. Identify opportunities to **mutualize closely related layouts** to avoid redundant pages.
5. Slice **core use cases (`UC-xxx`)** and their measurable objectives (`OBJ-xxx`).
6. **Proactively alert the human and prompt for arbitration** whenever logical consolidation is feasible but not documented.

---

## Step-by-Step Procedure

### 1. Extract Roles
- Identify who interacts with the system:
  - Always include `ANONYMOUS` for unauthenticated public access.
  - Define authenticated profiles in uppercase (e.g., `BUYER`, `ADMIN`, `MANAGER`).
- Record roles in `roles.md`.

### 2. Categorize Screens into Normative Templates
Classify each candidate screen under an official template code:
- `HOME`: Single root homepage (`/`).
- `H`: Hub (routing intermediary with URL but no direct content, navigating to its first child).
- `L`: Object list (cards, table, grid).
- `F`: Form (data input or edit).
- `C`: Content / object detail view.
- `D`: Dashboard / synthesis panel.
- `E`: Technical page (404, maintenance, 403) when user-facing.
- `M`: Transversal out-of-tree module (login popin, help drawer).

### 3. Mutualize Related Templates & Duty of Alert (Rule C15)
- **Strict Parent Uniqueness**: In the arborescence, a page must never have multiple parents. Multi-parenting is prohibited.
- **Logical Consolidation Principle**: When two views manipulate the same logical entity with similar layouts (e.g., two lists in the same domain accessing the same detail view with conditional permissions), systematically prioritize a **single canonical page attached to a single parent**, completed with variants (`:VARIANT` or `@ROLE`). Accessing it from another list is modeled as a functional cross-reference ("virtual navigation child").
- **Mandatory Human Alert**: If creating two separate pages is considered for related entities without explicit functional justification, you MUST alert the user and prompt them for arbitration.

### 4. Delimit Use Cases (`UC-xxx`)
For each key user intent:
- Name the use case: `UC-<NAME>` (e.g., `UC-CATALOG`, `UC-DOSSIER`).
- Qualify its nature: `metier` (business), `usage`, or `confort`.
- Define importance: `critique` (critical), `courant` (standard), or `occasionnel` (occasional).
- Define measurable objectives: `OBJ-<NAME>-01`.

### 5. User Clarification Checklist
Prompt the user when requirements are ambiguous:
- Do two screens handle the same business entity? Can they be consolidated into a single canonical page with variants rather than creating redundant tree nodes?
- Are unauthenticated visitors allowed on this screen?
- Does a variant modify page layout/permissions, or is it merely an internal object state?
- Do specific steps involve asynchronous waits (upload processing, third-party validation) requiring a flow break `⏸` and session state persistence?
