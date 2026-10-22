# Information Architecture — Part 1: Arborescence Specification

> **Document Role**: Child Specification — Part 1 (Hierarchical structure, page repository, canonical URLs)  
> **Parent Document**: [Information Architecture — Global Documentation](./documentation-architecture-information.md)  
> **Related Sibling Part**: [Information Architecture — Part 2: Userflows Specification (Journey Graph)](./spec-userflows.md)  
> **Version**: 0.4 — October 20, 2026  
> **Status**: Validated baseline  
> **Associated External Deliverables**: Functional Specification (owns `FEAT` capabilities), Business Object Lifecycle Specification, and Template Design Specification (outside the scope of this document).

---

> [!IMPORTANT]
> **Language Rule for Deliverables:**
> All specifications, templates, and skill guides are maintained in English. However, **all artifacts and deliverables produced for projects (tables, user journeys, screen sheets, audit reports, QA/UAT plans, tracking matrices, diagram titles, and functional summaries) MUST be authored in the language requested or used by the user in their prompt or conversation** (e.g., French if prompting in French, English if prompting in English, etc.). Formal technical tokens (e.g., `HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`) remain unlocalized.

---

## 1. Deliverable Purpose

The arborescence describes the hierarchical structure of application pages, organized according to a top-down waterfall logic across business entities. It serves as the authoritative source of reference for:
- Identifying pages, their variants, and attached in-page components (modals, prompts, anchors).
- Building canonical URLs reflecting page tree paths.
- Defining protected zones and role-based access rights.
- Mapping cross-references between pages triggered by user capabilities.
- Cataloging out-of-tree transversal or scoped modules.

It does not describe user journeys, which belong to [Part 2: Userflows Specification](./spec-userflows.md).

## 2. Principles

1. **One Page, One Reference Row**: Reading levels and role-based views are filtered projections of the same model.
2. **Stable Identifier, Explicit Type**: A page code reflects its high-level abstraction type, not visual presentation. Type changes generate a new code with tracked replacement.
3. **Strict Tree Structure (Strict Single Parent)**: The arborescence is a strict tree: **a page can never have two parents**. Multi-parenting is prohibited.
4. **Active Target Documentation**: No obsolete page statuses; deprecated pages belong to previous release archives.
5. **Tables are the Source of Truth**: Mermaid diagrams are generated visual projections.
6. **Template Abstraction**: Dynamic content is abstracted into reusable layout types.
7. **Page Variant ≠ Object State**: A variant exists only if layout structure or access permissions change. Business object states are context terms in userflows.
8. **Template Mutualization & Duty of Alert**: Two pages must not duplicate layout for logically related entities. Mutualizing under a single canonical page with variants (`@ROLE` or `:VARIANT`) is required. Unjustified divergence triggers a mandatory human alert for arbitration (Check C15).

## 3. Reading Levels

### 3.1 General Level
- All accessible pages, parent/child relationships, and sibling order.
- Protected zones and authorized roles.
- Canonical target URL and template code for each page.
- Out-of-tree modules cataloged separately.

### 3.2 Detailed Level
Adds:
- Capabilities (`FEAT-XXX`) hosted on each screen.
- Functional cross-references to other screens, modules, or anchors.
- Page variants.
- Attached components (modals `!`, internal anchors `#`).

### 3.3 Role-Based View
Filtered projection showing only pages, variants, modules, and features accessible to a specific role.

### 3.4 Hierarchical and Cross-Reference Links (Mermaid Notation)
- **Direct Hierarchical Link (`-->`)**: Solid line (`--dg-edge`). Connects parent page directly to its children in the tree (`kind=navigation`).
- **Attached Element / Functional Cross-Reference (`-.->`)**: Dashed line (`--dg-edge-cross`, `stroke-dasharray: 6 4`). Connects a page to an attached popin/modal (`attach` with `!`), internal anchor (`attach` with `#`), transverse module (`invoke` with `M###`), or functional cross-reference (`renvois.md`).

## 4. URL Construction

### 4.1 Principle
A URL represents the hierarchical location of a page in the tree. It is a property of the page and defined here. There is exactly one canonical URL per page.

### 4.2 Rules
- English by default. Localization aliases go into an appendix.
- Lowercase throughout, segments separated by `/`, multi-word terms by `-`.
- Plurals for collection entities (`products`, `search-results`).
- No arbitrary depth limit; child URL strictly extends parent URL (Check C4).
- Root homepage is `/`.
- Square brackets define dynamic variables: `/products/[id]`.

### 4.3 In-Page Markers

| Marker | Purpose | Example |
|---|---|---|
| `#` | Internal page anchor | `/products/[id]#reviews` |
| `!` | Attached modal/prompt, or module invocation | `/products/[id]!help-panel` |

- `!` is a **documentary notation**, not browser route syntax.
- Popins, prompts, and anchors are never autonomous pages; they belong to a parent page in `composants_page.md`.

### 4.4 Virtual Navigation Children
A journey can navigate directly to an entity detail view from a secondary list or filtered search. This does not alter the arborescence: the target page retains its single parent and canonical URL in the tree, while acting as a "virtual child" in user navigation via a cross-reference and variant.

## 5. Technical References & Grammar

### 5.1 Grammar

```
page-code    = "HOME" | template ID
template     = "H" | "L" | "F" | "C" | "D" | "E"
page-ref     = page-code [ "@" CODE ] [ ":" CODE ]
module-ref   = "M" ID
comp-ref     = page-code ( "!" key | "#" key )
ID           = 3*DIGIT                      ; 3 or more digits
CODE         = UPPER *( UPPER | DIGIT | "_" ) ; role or variant code
key          = lower *( lower | DIGIT ) *( "-" 1*( lower | DIGIT ) )
human-name   = key                           ; optional prefix followed by "-"
```

Regular expressions:
```
page-ref   : ^(?:[a-z0-9]+(?:-[a-z0-9]+)*-)?(HOME|[HLFCDE][0-9]{3,})(@[A-Z][A-Z0-9_]*)?(:[A-Z][A-Z0-9_]*)?$
module-ref : ^(?:[a-z0-9]+(?:-[a-z0-9]+)*-)?M[0-9]{3,}$
comp-ref   : ^(HOME|[HLFCDE][0-9]{3,})[!#][a-z0-9]+(?:-[a-z0-9]+)*$
```

Examples:
- `L001`: List page 001 without variant
- `L001:EDIT`: Editable variant of this page
- `L001@ADMIN`: Version for role `ADMIN`
- `L001@ADMIN:EDIT`: Editable version for role `ADMIN`
- `HOME`: Homepage (unique, no numerical ID)
- `M001`: Module 001
- `C001!quick-view`: Modal `quick-view` attached to `C001`
- `C001#reviews`: Internal anchor `reviews` of `C001`

### 5.2 Templates

| Code | Type | Note |
|---|---|---|
| `HOME` | Homepage | Unique root at `/` |
| `H` | Hub | Intermediary routing node navigating to its first child |
| `L` | List | Collection of items |
| `F` | Form | Input or editing view |
| `C` | Content | Detail view of an item |
| `D` | Dashboard | Overview panel |
| `E` | Technical Page | 403, 404, maintenance |
| `M` | Module | Out-of-tree reusable block |

### 5.3 Variants

- `@ROLE`: version targeted at a role (`@ADMIN`).
- `:VARIANT`: conditional structural version (`:EDIT`, `:OWNER`).
- Combined: `@ADMIN:EDIT`.
- Each variant must reference its functional rationale via `condition_spec`.

## 6. Reference Tables Schema

### 6.1 `pages` Table

| Column | Type | Req. | Description |
|---|---|---|---|
| `code` | `page-code` | yes | Unique; grammar 5.1 |
| `label` | text | no | Indicative colloquial label |
| `parent` | code | yes except HOME | Must exist; strictly single parent (no multi-parenting); no cycles |
| `ordre` / `order` | integer | yes except HOME | Sibling sequence; determines hub routing target |
| `url` | path | yes | Canonical URL extending parent URL |
| `access` | list of roles | yes | Authorized roles; `ANONYMOUS` for public |
| `fonctionnalites` / `features` | list of `FEAT` | no | Capabilities hosted on this page |

### 6.2 `variantes` Table

| Column | Type | Req. | Description |
|---|---|---|---|
| `ref` | `page-ref` | yes | Full reference containing `@ROLE` or `:VARIANT` |
| `condition_spec` | text | yes | Functional justification |
| `access` | list of roles | no | Subset of `pages.access` |
| `url_distincte` | path | no | Specific URL if distinct |
| `fonctionnalites` | list of `FEAT` | no | Variant-specific capabilities |

### 6.3 `modules` Table

| Column | Type | Req. | Description |
|---|---|---|---|
| `code` | `module-ref` | yes | Unique (`M001`) |
| `label` | text | no | Human-readable label |
| `invocation` | key | yes | Identifier used after `!` |
| `access` | list of roles | yes | Authorized roles |
| `portee` / `scope` | category | yes | `ALL`, `PUBLIC`, `AUTH`, `@ROLE`, or `PAGE:code1,code2` |
| `fonctionnalites` | list of `FEAT` | no | Hosted capabilities |

### 6.4 `composants_page` Table

In-page modals (`!`) and anchors (`#`) specific to a single page:
- `page`: host page code
- `marqueur`: `!` or `#`
- `cle`: component key
- `label`: colloquial description
- `fonctionnalites`: capabilities hosted

### 6.5 `renvois` Table

Functional cross-references between screens:
- `source`: source reference
- `fonctionnalite`: user capability triggering the transition
- `cible`: target screen or component
- `type`: `page`, `module`, or `composant`

### 6.6 `roles` Table

- `code`: uppercase role code (includes mandatory `ANONYMOUS`)
- `label`: colloquial description

### 6.7 Feature Identifiers

```
FEAT-ref = "FEAT-" CODE-KEBAB   ; e.g., FEAT-SUBMIT, FEAT-VALIDATE-INFO
regex    : ^FEAT-[A-Z0-9]+(?:-[A-Z0-9]+)*$
```

## 7. Modules

Modules are reusable functional blocks rendered within a host page without being tree children (e.g., login modal, help drawer, user preferences).
- Out-of-tree, no parent, code `M`.
- Called via `!invocation` on host page URL.
- Scope categories:
  - `ALL`: all pages in the tree
  - `PUBLIC`: pages with `ANONYMOUS` in access
  - `AUTH`: pages without `ANONYMOUS` in access
  - `@ROLE`: pages where this role is permitted
  - `PAGE:code1,code2`: explicitly enumerated host pages

## 8. Integrity Checks

| # | Check | Priority | Description |
|---|---|---|---|
| C1 | Uniqueness of page codes and module codes | Must | Unique per template family |
| C2 | Grammar conformance | Must | All references follow Section 5.1 |
| C3 | Single root and strict single parenting | Must | Exactly one `HOME`; every other page has one valid parent; no cycles |
| C4 | Cascading URLs | Must | Child URL strictly extends parent URL |
| C5 | Hubs and sibling orders | Must | Hubs have $\ge 1$ child; sibling orders are distinct |
| C6 | Role and variant existence | Must | Roles exist in `roles.md`; variants document `condition_spec` |
| C7 | Module scope and invocation | Must | Scope valid; invocation key unique |
| C8 | Userflow screen validity | Must | All screens cited in userflows exist in arborescence |
| C9 | Journey coverage | Must | All pages (except `H` and `E`) traversed by $\ge 1$ journey |
| C10 | Cross-reference integrity | Should | Source and target exist; feature declared on source |
| C11 | Module access compatibility | Should | Authenticated module not scoped to public-only pages |
| C12 | Cross-reference usage | Could | Cross-references traversed in userflows |
| C13 | Variant access subset | Must | Variant access is subset of base page access |
| C14 | Component key uniqueness | Must | In-page keys unique per page |
| C15 | Template mutualization duty | Should | Close business entities mutualized under canonical page with variants; alert human if separated without justification |
