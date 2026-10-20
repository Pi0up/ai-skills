# Templates Catalog — Information Architecture

This directory provides standardized **Markdown data templates** and **Mermaid diagram templates** for scoping, modeling, and testing information architecture deliverables:
1. **Arborescence (Part 1)** — conforming to [`spec-arborescence.md`](../specs/spec-arborescence.md) (v0.4).
2. **Userflows / Journey Graph (Part 2)** — conforming to [`spec-userflows.md`](../specs/spec-userflows.md) (v2.2).
3. **Derived Deliverables** — Screen sheets, tracking plans, QA/UAT test notebooks.
4. **Audit** — Diagnostic audit report.

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While templates and guides are authored in English, **deliverables created from these templates MUST adopt the language of the user's prompt** (e.g. French if prompted in French, English if in English, etc.). Formal codes (`HOME`, `L001`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`) remain unlocalized.

---

## 1. Arborescence Reference Tables (`templates/arborescence/tables/`)

Reference tables serve as the single source of truth for application structure:
* [`pages.md`](./arborescence/tables/pages.md): Table `pages` (code, label, parent, order, canonical url, access, features).
* [`variantes.md`](./arborescence/tables/variantes.md): Table `variantes` (ref `@ROLE:VARIANT`, condition_spec, access, distinct_url).
* [`modules.md`](./arborescence/tables/modules.md): Table `modules` (code `M`, invocation `!key`, access, scope).
* [`composants_page.md`](./arborescence/tables/composants_page.md): Table `composants_page` (`page!key` for modals/prompts, `page#key` for internal anchors).
* [`renvois.md`](./arborescence/tables/renvois.md): Table `renvois` (source, feature `FEAT-XXX`, target, type).
* [`roles.md`](./arborescence/tables/roles.md): Table `roles` (unique code, label, with mandatory `ANONYMOUS`).

---

## 2. Mermaid Diagram Templates — Arborescence (`templates/arborescence/`)

* [`arborescence-generale.mmd`](./arborescence/arborescence-generale.mmd): General level (global tree, public/protected zones, out-of-tree transversal modules).
* [`arborescence-detaillee.mmd`](./arborescence/arborescence-detaillee.mmd): Detailed level (variants `@ROLE:VARIANT`, attached components `!modal` and `#anchor`, functional cross-references).
* [`arborescence-vue-role.mmd`](./arborescence/arborescence-vue-role.mmd): Filtered projection for a single role (e.g., `@BUYER`).

---

## 3. Registry & Use Case Templates — Userflows (`templates/userflows/`)

* [`uc/UC-template.md`](./userflows/uc/UC-template.md): Complete use case template with nominal journey, variants (`diverge_de`/`rejoint`), factored segments, and breaks `⏸`.
* [`registre/glossaire.md`](./userflows/registre/glossaire.md): Closed context vocabulary (`key=VALUE`).
* [`registre/noeuds.md`](./userflows/registre/noeuds.md): Event node and observability signal catalog.

---

## 4. Mermaid Diagram Templates — Userflows (`templates/userflows/`)

* [`composants-palette.mmd`](./userflows/composants-palette.mmd): Full palette and cheat sheet of all nodes, edges, and annotations.
* [`parcours-nominal-replie.mmd`](./userflows/parcours-nominal-replie.mmd): Nominal journey in collapsed view with CALL node.
* [`parcours-deplie.mmd`](./userflows/parcours-deplie.mmd): Journey with sub-journey expanded in a `subgraph`.
* [`parcours-variante.mmd`](./userflows/parcours-variante.mmd): Nominal flow with dotted variant flow, external event (EXT), return key, and declared break `⏸`.

---

## 5. Derived Deliverables & Audit

* [`derived/fiche-ecran-template.md`](./derived/fiche-ecran-template.md): Deduced screen sheet template (inputs, outputs, contexts, features, roles, breaks).
* [`derived/plan-tracking-template.md`](./derived/plan-tracking-template.md): Funnel tracking and observability plan template.
* [`derived/plan-test-qa-uat-template.md`](./derived/plan-test-qa-uat-template.md): Step-by-step QA & UAT test notebook template.
* [`audit/rapport-audit-template.md`](./audit/rapport-audit-template.md): Normative audit report template.
