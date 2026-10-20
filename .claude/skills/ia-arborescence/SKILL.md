---
name: ia-arborescence
description: >-
  Information Architecture Part 1 modeling skill (Arborescence / Page Hierarchy).
  Used to create, update, structure, and verify the hierarchical tree,
  Markdown reference tables (pages, variantes, modules, composants_page, renvois, roles),
  canonical URL conventions, and associated Mermaid diagrams.
---

# Skill: IA Arborescence (Part 1)

This skill implements the normative specification:
[Part 1: Arborescence Specification (v0.4)](../../specs/spec-arborescence.md).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions and guidelines are written in English, **all deliverables produced (table labels, descriptions, Mermaid titles, and documentation) MUST be rendered in the language of the user's prompt** (e.g., French if the user asks in French, English if in English, etc.). Formal technical codes (`HOME`, `L001`, `FEAT-xxx`, `!`, `#`, `@ROLE`, `:VARIANT`) retain their normative syntax.

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

---

## Step-by-Step Procedure

### 1. Draft `roles.md` Table
Create the file containing at least `ANONYMOUS` and identified user roles.

### 2. Draft `pages.md` Table
Provide fields for each page:
- `code`: unique per template (`L001`, `C001`, `D001`, etc.)
- `label`: indicative human-readable label
- `parent`: single exclusive parent (empty for `HOME`; multi-parenting forbidden)
- `ordre` / `order`: display sequence among sibling pages (mandatory except for `HOME`)
- `url`: canonical URL extending parent URL
- `access`: authorized role codes (`ANONYMOUS` for public access)
- `fonctionnalites` / `features`: list of supported `FEAT-XXX` codes

> **Mutualization Alert (C15)**: If two screens share the same template and entity, do not create duplicate nodes in the tree: mutualize under a single page and document variants. Maintaining separate nodes requires explicit human validation.

### 3. Declare `variantes.md`
- Each variant must specify a documented `condition_spec`.
- Variant `access` must be a subset of its base page's access list.
- Use variants (`:OWNER`, `@ADMIN`, etc.) to convey permission and layout adaptations.

### 4. Declare `modules.md` and `composants_page.md`
- Modules live outside the tree (no parent).
- Set scope: `ALL`, `PUBLIC`, `AUTH`, `@ROLE`, or `PAGE:code1,code2...`.
- In-page popins (`!`) and anchors (`#`) are cataloged in `composants_page.md`.

### 5. Declare `renvois.md` (Virtual Navigation Children)
- Cross-cutting links to a mutualized page from secondary views are declared here (`source -. FEAT .-> target:VAR`).
- This models navigation flexibility without corrupting tree hierarchy.

### 6. Generate Mermaid Diagrams
Run:
```bash
# Rich style (default, Figma 4-quadrant cards + HTML preview)
python -m ia_tools.cli generate-mermaid --type arborescence --out generes --style rich --preview

# Standard style (pure GitHub-compatible text)
python -m ia_tools.cli generate-mermaid --type arborescence --out generes --style standard
```
Produced diagrams follow a **top-to-bottom** layout (`flowchart TD`):
- `arborescence-generale.mmd` (high-level view with public/protected subgraphs and transversal modules)
- `arborescence-detaillee.mmd` (detailed view with components, variants, invocations, and functional cross-references)
- `arborescence-generale.html` & `arborescence-detaillee.html` (interactive preview with Figma theme and dot-grid canvas)
