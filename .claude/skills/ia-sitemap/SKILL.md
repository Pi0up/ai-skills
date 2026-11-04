---
name: ia-sitemap
description: >-
  Information Architecture Part 1 modeling skill (Sitemap / Page Hierarchy).
  Used to create, update, structure, and verify the hierarchical tree,
  Markdown reference tables (pages, variantes, modules, composants_page, renvois, roles),
  canonical URL conventions, and associated Mermaid diagrams.
---

# Skill: IA Sitemap (Part 1)

This skill implements the normative specification:
[Part 1: Arborescence Specification (v0.4)](../../specs/spec-arborescence.md).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions and guidelines are written in English, **all deliverables produced (table labels, descriptions, Mermaid titles, and documentation) MUST be rendered in the language of the user's prompt** (e.g., French if the user asks in French, English if in English, etc.). Formal technical codes (`HOME`, `L001`, `FEAT-xxx`, `!`, `#`, `@ROLE`, `:VARIANT`) retain their normative syntax.

---

## Workspace Root Convention: `infoarchi_docs`

All Information Architecture deliverables (Sitemap Part 1 and Userflows Part 2) belong to a single, unified project root directory named:

```
infoarchi_docs/
```

### Why a Single Shared Root?
1. **Co-location with Userflows**: Sitemap reference tables (`pages.md`, `roles.md`, etc.) and user journey specifications (`uc/UC-*.md`, `registre/glossaire.md`) live side by side in `infoarchi_docs/` so that identifiers, codes, and context variables are strictly resolved and validated together.
2. **Studio Single Ingestion Directory**: The Studio viewer (`preview.html`) does **not** perform arbitrary recursive directory searches. It loads Mermaid diagrams (`*.mmd`), the indexed metadata registry (`metadata.json`), and screen sheets (`screen-sheets/*.md`) directly from a single unified generated folder:
   ```
   infoarchi_docs/generated/
   ```
   Never split sitemap outputs and userflow outputs into separate directories. They must be generated together in `infoarchi_docs/generated/` so Studio can load them simultaneously on the same canvas.

---

## Directory Layout in `infoarchi_docs`

```
infoarchi_docs/
├── pages.md                   <-- Reference table: pages (single source of truth)
├── roles.md                   <-- Reference table: user roles & permissions
├── variantes.md               <-- Reference table: page layout/permission variants
├── modules.md                 <-- Reference table: transversal out-of-tree modules
├── composants_page.md         <-- Reference table: attached popins (!) and anchors (#)
├── services_externes.md       <-- Reference table: third-party external services (EXT-xxx)
├── renvois.md                 <-- Reference table: virtual cross-cutting navigation links
├── registre/                  <-- Synchronized registry & context glossary
│   ├── glossaire.md           <-- Closed context vocabulary (key=VALUE)
│   ├── pages.md
│   └── ...
├── uc/                        <-- Use case journey specifications (Part 2)
│   ├── UC-xxx.md
│   └── ...
└── generated/                 <-- SINGLE TARGET FOLDER LOADED BY STUDIO
    ├── preview.html           <-- Unified standalone Studio visualizer
    ├── metadata.json          <-- Unified metadata registry (pages, journeys, sheets)
    ├── sitemap-overview.mmd   <-- High-level hierarchical page overview
    ├── sitemap-detailed.mmd   <-- Detailed sitemap with variants, modules, and renvois
    ├── PF-*.mmd               <-- All user journey diagrams (co-located)
    └── screen-sheets/         <-- Deduce cross-cutting screen sheets
        ├── screen-HOME.md
        └── ...
```

---

## Golden Rules of Arborescence

1. **Source of Truth**: Markdown tables are the sole source of truth. Mermaid diagrams are derived projection views.
2. **Single Root & Strict Parent Uniqueness (C3)**: Exactly one `HOME` page with URL `/` and no parent. Every other page has exactly one direct parent. Multi-parenting is strictly forbidden.
3. **Cascading URLs (C4)**: A page's canonical URL strictly extends its parent's URL (e.g., `/products` $\rightarrow$ `/products/[id]`). Lowercase throughout, plurals for object collections.
4. **Normative Grammar (Section 5.1)**:
   - Pages: `HOME`, `L001`, `C001`
   - Variants: `C001@BUYER`, `C001@ADMIN:EDIT` (at least `@` or `:`)
   - Modules: `M001` (out of tree)
   - Components: `C001!quick-view` (popin/modal) or `C001#reviews` (internal anchor)
   - Features: `FEAT-SUBMIT`
5. **Variant vs. Object State**: A variant exists ONLY when page layout structure or access permissions change. Business object state (draft, submitted, ready) is a userflow context term, not a page variant.
6. **Layout Mutualization & Duty of Alert (C15)**: Two pages must not duplicate layout for logically related entities. Mutualizing under a canonical page with variants (`:VARIANT` or `@ROLE`) is required. Unjustified divergence triggers a mandatory human alert for arbitration.
7. **Mermaid Page Card Projections**:
   - Card title MUST strictly use the verbatim `label` from `pages.md` (no additions, no code prefix like `H001`, no translation).
   - Display URL on a separate line under title (`<br/>`): `/` for `HOME`, relative URL computed from parent for children, without leading `/` and with trailing `/` (e.g. `HOME["Accueil du portail<br/>/"]`, `H001["Sitactivity<br/>sitactivity/"]`).
   - Simplified views (`sitemap-overview.mmd`) may omit pages but must never invent or alter titles.

---

## Step-by-Step Procedure

### 1. Initialize `infoarchi_docs` Directory
Create the unified folder if it does not exist:
```bash
python -m ia_tools.cli init --dir infoarchi_docs --mode minimal
```

### 2. Draft Reference Tables in `infoarchi_docs/`
- `roles.md`: user role codes (including mandatory `ANONYMOUS`).
- `pages.md`: page codes, verbatim labels, parents, orders, cascading canonical URLs, role access, and features (`FEAT-xxx`).
- `variantes.md`: display/layout variants with documented `condition_spec`.
- `modules.md`: out-of-tree transversal modules (`M001`, `ALL`, `PUBLIC`, `AUTH`, `@ROLE`).
- `composants_page.md`: in-page popins (`!`) and anchors (`#`).
- `services_externes.md`: third-party external services (`EXT-xxx`, out-of-tree).
- `renvois.md`: cross-cutting virtual links (`source -. FEAT .-> target:VAR`).

### 3. Generate Mermaid Diagrams and Studio Preview
Run the CLI pointing `--dir infoarchi_docs` to the root and `--out infoarchi_docs/generated` to the unified Studio folder:

```bash
# Recommended: generate all diagrams (sitemap + userflows), unified metadata, and preview.html
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type all --out infoarchi_docs/generated --preview

# Or generate only arborescence views into the common Studio folder:
python -m ia_tools.cli generate-mermaid --dir infoarchi_docs --type arborescence --out infoarchi_docs/generated --preview
```

Produced sitemap diagrams in `infoarchi_docs/generated/`:
- `sitemap-overview.mmd`: high-level view (`flowchart TD`) with public/protected subgraphs and transversal modules.
- `sitemap-detailed.mmd`: detailed view (`flowchart TD`) with components, variants, invocations, and functional cross-references.
- `metadata.json`: unified metadata registry consumed by the Studio inspector.
- `preview.html`: standalone Studio visualizer.

### 4. Validate Cross-Disciplinary Consistency
Always run validation on `infoarchi_docs` to verify that sitemap rules (C1-C15) pass and references match userflows:
```bash
python -m ia_tools.cli validate --dir infoarchi_docs
```

### 5. Preview in Studio
Open the generated directory in the Studio visualizer:
```bash
python -m ia_tools.cli preview --dir infoarchi_docs/generated
```
Studio will automatically load `metadata.json`, discover all sitemaps and userflows, and provide bi-directional navigation.
