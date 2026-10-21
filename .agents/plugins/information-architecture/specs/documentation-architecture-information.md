# Information Architecture — Global Documentation

> **Document Role**: Parent Document (Framework overview and artifact relationships)  
> **Version**: 1.2 — October 20, 2026 (aligned with Part 1 v0.4 and Part 2 v2.2)  
> **Detailed Child Parts**:
> - [Information Architecture — Part 1: Arborescence Specification](./spec-arborescence.md)
> - [Information Architecture — Part 2: Userflows Specification (Journey Graph)](./spec-userflows.md)
> - [Information Architecture — Unified Visualizer Specification (preview.html)](./spec-preview.md)

---

> [!IMPORTANT]
> **Language Rule for Deliverables:**
> All specifications, templates, and skill guides are maintained in English. However, **all artifacts and deliverables produced for projects (tables, user journeys, screen sheets, audit reports, QA/UAT plans, tracking matrices, diagram titles, and functional summaries) MUST be authored in the language requested or used by the user in their prompt or conversation** (e.g., French if prompting in French, English if prompting in English, etc.). Formal technical tokens (e.g., `HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`) remain unlocalized.

---

This document outlines the two core deliverables produced in the "Information Architecture" project and describes how they articulate with each other. It serves as an entry point and reference framework. Operational rules and comprehensive criteria are specified in each child document, which takes precedence in case of discrepancy:
- **Part 1**: [Arborescence Specification](./spec-arborescence.md)
- **Part 2**: [Userflows Specification (Journey Graph)](./spec-userflows.md)

## 1. Project Purpose

The project defines the structure of an application from both the user's and the designer's perspective. It produces two complementary deliverables that describe the same primary objects—screens and pages—with two distinct objectives:

- **Arborescence** is a strict tree: it specifies where pages reside, how they are hierarchically organized, and how they are addressed (canonical URLs, codes, variants). **A page can never have two parents** (the tree is strict and multi-parenting is formally prohibited).
- **Userflows** form a graph: they describe how users navigate between screens to accomplish defined goals. A journey can connect any screen to another via functional cross-references, creating "virtual navigation children" as needed without corrupting tree hierarchy.

Both deliverables share a unified reference language. Each page in the arborescence carries a template code and optional variant; every journey references these exact codes, never human-readable colloquial names. A code is defined once in the arborescence and reused verbatim across specs and journeys.

The scope is functional and conceptual. It does not cover technical web development or global shell navigation (menus, footer, breadcrumbs), and error flows are currently scoped out.

## 2. Part 1: Arborescence

> **Detailed Specification**: see [Information Architecture — Part 1: Arborescence Specification](./spec-arborescence.md).

### 2.1 Role

The arborescence represents the hierarchical structure of pages, organized through top-down waterfall logic across business entities. Canonical URL construction is defined here: an address directly reflects its path within the tree.

### 2.2 Reading Levels

- **General Level**: all accessible pages, protected zones (authentication or permission barriers), parent nodes, and hierarchical links.
- **Detailed Level**: functional capabilities on each page, cross-references to other screens (modeled as actions rather than passive navigations), variants, and attached in-page components (modals, prompts, internal anchors).
- **Role-based View**: filtered projection of the complete tree showing only what is accessible to a given role, including role-specific variants and capabilities.

In most applications, few users see the entire set of pages and variants, which is typically reserved for super administrators.

### 2.3 Template Codes

Template codes represent the high-level functional type of a page—an abstraction independent of layout presentation:

| Code | Type | Description |
|---|---|---|
| HOME | Homepage | Single root homepage at URL `/`. |
| H | Hub | Intermediary routing node with an address but no direct content; redirects to its first child. |
| L | List | Collection of items (cards, table, grid). |
| F | Form | Data input or editing view. |
| C | Content | Detail or consultation view for an individual entity. |
| D | Dashboard | Synthesis panel / analytical overview. |
| E | Technical Page | 403, 404, maintenance, or technical error views, when user-facing. |
| M | Module | Reusable out-of-tree block, transversal or scoped to specific pages. |

An ID is unique within a template family (`L001` and `C001` coexist). If a page changes template type, it receives a new code and the migration is tracked.

### 2.4 References

A page's technical reference combines its template code, numerical ID, optional role prefixed with `@`, and optional variant prefixed with `:`: `L001`, `L001:EDIT`, `L001@ADMIN`, `L001@ADMIN:EDIT`. An optional human name prefix may precede it (`search-results-L001@ADMIN:EDIT`) for reading convenience, but never serves as a formal reference. Modals and internal anchors are referenced as `C001!quick-view` and `C001#reviews`. Normative grammar is detailed in [spec-arborescence.md (Section 5.1)](./spec-arborescence.md#51-grammar).

### 2.5 Variants

- A variant is an alternative version of a page that **modifies its structural layout or access permissions**: `:EDIT` for editable forms, `@ROLE` for role-targeted layouts, or combinations thereof.
- Variant codes are explicit and documented in the reference table.
- **Business object states** (e.g., draft, submitted) are userflow context terms, not page variants per se. They only warrant a variant if layout or permissions change.
- Modeling operates at template abstraction level; displayed content remains dynamic.

### 2.6 Canonical URL Conventions

- Single language: English by default. Localization aliases go into an appendix.
- Lowercase throughout, segments separated by `/`, multi-word terms by `-`.
- Plurals for collection entities (`products`, `search-results`).
- No arbitrary depth limit; a child URL strictly extends its parent's URL.
- Exactly one canonical URL per page.
- Square brackets denote dynamic route parameters: `/products/[id]`.
- Modals (`!`) and anchors (`#`) are documented references, not browser URL routes.

### 2.7 Technical Pages

Technical pages (403, 404, maintenance) appear under code `E` when user-facing. Like hubs, they are exempt from mandatory journey coverage.

### 2.8 Modules

A module is a reusable functional block that renders within a page context without being a child node in the tree (e.g., global login modal, help drawer, user preferences panel):
- Modules have no parent and reside outside the tree.
- They declare **who** can invoke them (roles) and **where** they can open (scope).
- Transversal modules use fixed scopes (`ALL`, `PUBLIC`, `AUTH`, `@ROLE`); scoped modules list explicit pages (`PAGE:C001,L002`).

### 2.9 Representation Rules

- **Reference Tables** are the sole source of truth; Mermaid diagrams are generated visual projections.
- Capabilities (`FEAT-XXX`) are owned by functional specs and attached here to pages, modules, and components.
- Unauthenticated visitors carry the role `ANONYMOUS`.
- Life cycle states are modeled in userflows as context terms, not tree structures.

### 2.10 Template Mutualization & Virtual Children

- **Strict Parent Uniqueness**: In the tree, every page has exactly one direct parent (except `HOME`). Multi-parenting is prohibited.
- **Consolidation of Logically Related Entities**: When two potential views handle the same business entity with identical or closely related templates (e.g., public vs. personal view of an item), the methodology mandates **mutualizing** them under a single canonical tree page with variants (`@ROLE` or `:VARIANT`).
- **Virtual Navigation Children**: Accessing this mutualized screen from secondary lists or search filters is modeled as a functional cross-reference in userflows. For navigation, it acts virtually as a child of the caller, while maintaining its canonical single parent in the tree.
- **Human Alert Duty (C15)**: Any divergence from mutualization (creating multiple pages for the same entity) requires explicit functional justification. Without documentation, IA tools and agents MUST alert the human user and request arbitration.

## 3. Part 2: Userflows

> **Detailed Specification**: see [Information Architecture — Part 2: Userflows Specification (Journey Graph)](./spec-userflows.md).

### 3.1 Role

The userflows deliverable provides an IA specification usable by AI agents to generate journeys, audit consistency, derive screen sheets, and equip QA, user testing, and tracking. It is formatted in Markdown with Mermaid diagrams.

### 3.2 Model Structure

1. **Use Case (`UC-xxx`)**: User objective with qualitative importance.
2. **Journey (`PF-xxx`)**: Concrete path to achieve the objective:
   - Nominal flow (standard path)
   - Variant flows (declaring divergence and rejoin anchors)
   - Factored segments (reusable sequences without independent objectives)
3. **Taxonomy**: Page (variant) > Module or component > Feature.
4. **Attributes**: Roles, context pairs, indicative variant weights, QA/UAT confidence index.
5. **Priorities**: Must, Should, Could.

### 3.3 Construction Principles

- Journeys are paths in a graph coded as ordered step tables. Context is expressed using closed vocabulary `key=VALUE`.
- Nodes represent events: opening a screen (`ECR`), triggering a capability (`ACT`), asynchronous wait (`ATT`), out-of-application exchange (`EXT`).
- Breaks `⏸` model intentional or system task interruptions where session memory must be preserved.

### 3.4 Callable Journeys and Segments

- Any journey can be called as a single step inside another (`CALL`).
- A **segment** has no independent business objective and exists only to be invoked by other journeys.

### 3.5 Tracking & Observability

Every journey carries a unique ID. Actionable nodes define URLs or custom analytics events.

## 4. Articulation Between the Two Parts

| Element | [Part 1: Arborescence](./spec-arborescence.md) | [Part 2: Userflows](./spec-userflows.md) |
|---|---|---|
| **Structure** | Strict hierarchical tree | User journey graph |
| **Base Unit** | Page and template code (`HOME`, `L`, `C`...) | Node (event `ECR`, `ACT`, `ATT`, `EXT`) |
| **Identifier** | Canonical reference: `template+ID[@ROLE][:VARIANT]`, `M001`, `C001!quick-view` | Journey (`PF-xxx`), node (`ND-xxx`), use case (`UC-xxx`) |
| **Variant / State** | Page variant (layout or permissions) | Object state and context pairs (`dossier=BROUILLON`) |
| **Source of Truth** | Reference tables (`pages`, `variantes`, `modules`, `composants_page`, `renvois`, `roles`) | Synchronized registry, Markdown use case files |
| **URL Scope** | Canonical route and in-page anchor definitions | Observability signal associated with the node |
| **Linkage** | Attachment of capabilities to screens; cross-references table | Execution sequence of capabilities in journeys |

### Common Integrity and Consistency Rules

1. **Unified Reference Language**: Page, variant, module, and component codes are defined once in arborescence tables and reused verbatim in userflow `ECR` nodes without human names.
2. **Mutual Coverage**: Every non-hub, non-technical page must be traversed by at least one journey (checks C9 and R-12).
3. **Access Control**: Roles declared in userflows must exist in `roles.md` and comply with page access columns.
4. **Features**: A feature triggered in a journey must be declared on the corresponding screen in `pages.md`.

## 5. Glossary

- **Arborescence**: Hierarchical page tree specifying URLs, template codes, and variants.
- **Template Code**: Functional abstraction code for a page (HOME, H, L, F, C, D, E) or module (M).
- **Variant**: Alternative version of a page modifying layout or rights, coded with `@` or `:`.
- **Object State**: Lifecycle condition of a business entity expressed in closed context (`status=DRAFT`).
- **Hub**: Template `H` page; routing intermediary leading to its first child.
- **Module**: Reusable functional block living outside the page tree.
- **Page Component**: In-page modal (`!`), prompt, or anchor (`#`).
- **Use Case**: User objective addressed by one or more journeys.
- **Journey**: Linear path through screens and events fulfilling a use case objective.
- **Segment**: Reusable factored journey sequence invoked by other journeys.
- **Funnel**: Step-by-step conversion tracking to monitor drop-off rates.
