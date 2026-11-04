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

## Workspace Root Convention: `infoarchi_docs`

All userflows, use cases, and registries MUST share the exact same root directory as the sitemap arborescence:

```
infoarchi_docs/
```

### Studio Discovery & Ingestion Constraints
The Studio viewer (`preview.html`) does **not** recursively search subdirectories. Its discovery reader scans **the single directory selected by the user** (or opened via HTTP):
- Diagram files: directly at the root of `infoarchi_docs/generated/` (`*.mmd`)
- Metadata registry: directly at `infoarchi_docs/generated/metadata.json`
- Screen sheets: in the subfolder `infoarchi_docs/generated/screen-sheets/`

Therefore, **never** generate sitemaps and userflows in separate output directories. Generating all diagrams together into `infoarchi_docs/generated/` ensures Studio renders sitemap trees and linear journey tracks on the same unified canvas, with cross-navigation between sitemap nodes and journey steps.

---

## Directory Layout in `infoarchi_docs`

```
infoarchi_docs/
├── pages.md                   <-- Reference table: pages (sitemap Part 1)
├── roles.md                   <-- Reference table: roles & permissions
├── variantes.md               <-- Reference table: screen variants
├── modules.md                 <-- Reference table: transversal modules
├── composants_page.md         <-- Reference table: popins (!) and anchors (#)
├── services_externes.md       <-- Reference table: external third parties
├── renvois.md                 <-- Reference table: virtual cross-references
├── registre/                  <-- SYNCHRONIZED REGISTRY & CONTEXT GLOSSARY
│   ├── glossaire.md           <-- Closed context vocabulary (key=VALUE)
│   ├── pages.md               <-- Synchronized page cache
│   ├── modules.md             <-- Synchronized module cache
│   ├── roles.md               <-- Synchronized role cache
│   ├── noeuds.md              <-- Node event registry
│   └── services_externes.md   <-- Synchronized external service cache
├── uc/                        <-- USE CASES & JOURNEYS
│   ├── UC-xxx.md              <-- Journey specs: nominals, variants, segments
│   └── ...
└── generated/                 <-- UNIFIED OUTPUT LOADED BY STUDIO
    ├── preview.html           <-- Unified standalone Studio visualizer
    ├── metadata.json          <-- Unified metadata registry (pages + journeys)
    ├── sitemap-overview.mmd   <-- Arborescence diagram
    ├── sitemap-detailed.mmd   <-- Detailed sitemap diagram
    ├── PF-*.mmd               <-- All user journey diagrams
    ├── UC-*-overview.mmd      <-- Use case synthetic diagrams
    └── screen-sheets/         <-- Deduce cross-cutting screen sheets
        ├── screen-HOME.md
        └── ...
```

---

## Golden Rules of Userflows

1. **No Human Names in References (R-04)**: Screens are ALWAYS referenced by their verbatim arborescence codes (`C010:EDIT`, `L001`, `M001`, `C001!quick-view`, `EXT-3DSECURE`). Actions are referenced by their `FEAT-SUBMIT` capability declared on the screen.
2. **Linear Sequence (P3 / R-25)**: A journey's steps are strictly linear. Any branching or alternative path MUST be modeled as a distinct journey file (a variant).
3. **Declarative Variants (R-26)**: A variant journey must declare `diverge_de: NOMINAL@N` and optionally `rejoint: NOMINAL@M`. It only defines its own differing steps.
4. **Calls and Landings (R-21)**: The step immediately following a `CALL` in the caller journey must be an `ECR` node on the landing screen declared by the callee (`atterrissage`).
5. **Mandatory Breaks (R-30)**: Any `ATT` node (asynchronous wait) or `EXT` node (out-of-app exchange) must declare a break marker `⏸` along with memory level (volatile, persistent, external) and resumption point.
6. **Sitemap Coverage (R-12 / C9)**: All arborescence pages (except hubs `H` and technical error pages `E`) must be traversed by at least one journey.
7. **Virtual Children & Canonical Reuse (P9 / R-05)**: When a journey reaches an entity from a secondary list or filtered view, reuse its canonical reference with its variant (`:VARIANT` or `@ROLE`).

---

## Step-by-Step Procedure

### 1. Synchronize the Registry
Ensure the registry in `infoarchi_docs/registre` reflects the latest arborescence tables:
```bash
python -m ia_tools.cli sync-registry --dir infoarchi_docs --out infoarchi_docs/registre
```
The registry files (`registre/pages.md`, `registre/modules.md`, `registre/roles.md`) serve as the single source of truth for journey references.

### 2. Define Closed Vocabulary (`infoarchi_docs/registre/glossaire.md`)
All context terms must conform to the strict syntax `key=VALUE` (e.g., `dossier=BROUILLON ; data=COMPLETE`).
Ensure every key and value used in use cases is declared in this glossary.

### 3. Write Use Cases (`infoarchi_docs/uc/UC-xxx.md`)
In each use case file:
- YAML Header: `uc_id`, `nom`/`name`, `nature`, `importance`, `objectifs`/`goals`, `roles`.
- Section **Nominal Journey** (`PF-xxx-NOM`):
  - Exactly one nominal flow per objective `OBJ-xxx`.
  - Step table: `| N° | Type | Nœud | Référence | Événement | Contexte produit |`.
- Section **Variants** (`PF-xxx-VAR-yyy`):
  - Declare `diverge_de` and `rejoint`.
- Section **Factored Segments** (`PF-xxx-yyy-SEG`):
  - No independent objective; must declare `atterrissage` (landing screen).

### 4. Verify Nodes and Breaks
- `ECR`: must strictly match an existing canonical code from `infoarchi_docs/pages.md`.
- `ACT`: `FEAT-XXX` capability attached to the current screen in `pages.md`.
- `ATT` / `EXT`: include `⏸` in event label and specify context and persistence.
- `CALL`: target `PF-xxx` journey identifier.

### 5. Generate Mermaid Diagrams and Unified Metadata
Generate all diagrams into `infoarchi_docs/generated/`:
```bash
# Recommended: generate everything together (sitemap + userflows + preview + metadata)
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type all --out infoarchi_docs/generated --preview

# Or generate userflows selectively into the same output folder:
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type userflows --out infoarchi_docs/generated --preview
```
Userflows follow a **left-to-right horizontal** layout (`flowchart LR`).
Because they are written to `infoarchi_docs/generated/`, they reside side-by-side with `sitemap-overview.mmd` and `metadata.json`.

### 6. Validate Conjointly
Run the validation engine to confirm that Studio and tools can resolve all cross-references between sitemap pages and user case steps:
```bash
python -m ia_tools.cli validate --dir infoarchi_docs
```
This check verifies:
- All `ECR` nodes resolve to existing pages in `pages.md`
- All `ACT` nodes correspond to capabilities declared on the page
- Break markers `⏸` are present on all `ATT` and `EXT` steps
- Glossary keys and values adhere to `key=VALUE`
- Page coverage (C9 / R-12) is satisfied.

### 7. Preview in Studio
Open the unified directory in the browser:
```bash
python -m ia_tools.cli preview --dir infoarchi_docs/generated
```
The Studio will discover both sitemaps and use cases in the sidebar, displaying journeys grouped by use case folders (`uc-folder`) with interactive node inspection.
