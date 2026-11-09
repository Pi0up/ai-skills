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

## Workspace Root Convention & Studio Co-location Principle

All userflows, use cases, and registries MUST share the exact same root directory as the sitemap arborescence (`<ia_root>/`, e.g. `infoarchi_docs/` by default):

```
<ia_root>/
```

### Identification & Confirmation of the Target Directory
- The IA root directory is determined according to the target project.
- **Rule**: If the agent is not completely certain of the destination directory, it **MUST ask the user** for confirmation before generating or editing files.

### Studio Discovery & Ingestion Constraints
The official reference visualizer is the online Studio hosted at:
**https://pi0up.github.io/ai-studio/**

The Studio discovery reader scans **the single directory selected by the user** (or opened via HTTP):
- Diagram files: directly at the root of `<ia_root>/generated/` (`*.mmd`)
- Metadata registry: directly at `<ia_root>/generated/metadata.json`
- Screen sheets: in the subfolder `<ia_root>/generated/screen-sheets/`

**MANDATORY RULE**: **Never** generate sitemaps and userflows in separate output directories. Sitemaps and userflows (UF) must go into the exact same `<ia_root>/generated/` directory so Studio renders sitemap trees and linear journey tracks on the same unified canvas, with cross-navigation between sitemap nodes and journey steps.

**No Embedded Viewer Application**: The generated directory contains diagrams and their metadata, not the visualizer application. Never copy, embed, or generate a local copy of the viewer (such as `preview.html`) in `generated/`.

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
8. **Explicit Header Metadata (`%%@file`) for Studio Classification**:
   The Studio parser initializes every `.mmd` diagram with `kind=sitemap` by default. To guarantee that Studio correctly classifies userflows and use cases, **every** generated `.mmd` file MUST explicitly declare `%%@file` metadata on line 1 before `flowchart LR` / `flowchart TD`:
   - **For a Userflow (`PF-*.mmd`)**:
     At minimum:
     `%%@file id=PF-IDENTIFIANT title="Titre du parcours" kind=userflow uc=UC-IDENTIFIANT statut=nominal`
     - Adapt `statut` according to conventions: `statut=nominal` (nominal flow), `statut=variante` (variant flow), `statut=segment` (factored segment).
     - When the journey diverges or rejoins another flow, emit: `diverge=PF-PARENT@N` and `rejoint=PF-PARENT@M`.
   - **For a Use Case Overview (`UC-*-overview.mmd`)**:
     At minimum:
     `%%@file id=UC-IDENTIFIANT title="Titre du cas d'usage" kind=userflow view=uc uc=UC-IDENTIFIANT`
   - **Strict Rules**:
     - Never use `kind=sitemap` for a userflow or UC overview.
     - Verify that IDs (`PF-...`, `UC-...`) and titles strictly match source specifications in `infoarchi_docs/uc/UC-*.md`.

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
Generate all diagrams into `infoarchi_docs/generated/` (do NOT generate `preview.html`):
```bash
# Recommended: generate everything together (sitemap + userflows + metadata)
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type all --out infoarchi_docs/generated

# Or generate userflows selectively into the same output folder:
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type userflows --out infoarchi_docs/generated
```
Userflows follow a **left-to-right horizontal** layout (`flowchart LR`).
Because they are written to `infoarchi_docs/generated/`, they reside side-by-side with `sitemap-overview.mmd` and `metadata.json`.
Produced userflow diagrams in `infoarchi_docs/generated/`:
- `PF-*.mmd`: user journey diagrams (line 1: `%%@file id=PF-... kind=userflow uc=UC-... statut=...`).
- `UC-*-overview.mmd`: synthetic use case diagrams (line 1: `%%@file id=UC-... kind=userflow view=uc uc=UC-...`).
- `metadata.json`: unified metadata registry consumed by the Studio inspector.

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

### 7. Preview in Studio (Online Reference Visualizer)
Open the official online Studio visualizer in your browser:
**https://pi0up.github.io/ai-studio/**

Load the unified directory (`infoarchi_docs/generated/`) using the folder selection button or drag & drop.
The Studio will discover both sitemaps and use cases in the sidebar, displaying journeys grouped by use case folders (`uc-folder`) with interactive node inspection. Never embed or generate a local copy of the visualizer application.
