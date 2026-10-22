# Information Architecture — Part 2: Userflows Specification (Journey Graph)

> **Document Role**: Child Specification — Part 2 (Functional journeys, events, and journey graph)  
> **Parent Document**: [Information Architecture — Global Documentation](./documentation-architecture-information.md)  
> **Related Sibling Part**: [Information Architecture — Part 1: Arborescence Specification](./spec-arborescence.md)  
> **Version**: 2.2 — October 20, 2026  
> **Scope**: Functional design, excluding error paths, drop-off descriptions, and analytics.

---

> [!IMPORTANT]
> **Language Rule for Deliverables:**
> All specifications, templates, and skill guides are maintained in English. However, **all artifacts and deliverables produced for projects (tables, user journeys, screen sheets, audit reports, QA/UAT plans, tracking matrices, diagram titles, and functional summaries) MUST be authored in the language requested or used by the user in their prompt or conversation** (e.g., French if prompting in French, English if prompting in English, etc.). Formal technical tokens (e.g., `HOME`, `L001`, `C001:EDIT`, `FEAT-xxx`, `ND-xxx`, `!`, `#`, `⏸`, `key=VALUE`) remain unlocalized.

---

## 1. Purpose and Principles

This deliverable describes the functional coverage of an application as user journeys—paths across the application graph. Within the [Information Architecture](./documentation-architecture-information.md) framework, it serves as the dynamic, usage-oriented counterpart to [Part 1: Arborescence](./spec-arborescence.md). It is used to generate journey specifications, audit consistency at scale, deduce screen sheets, and equip QA, user testing, and tracking.

| # | Principle |
|---|---|
| P1 | A journey exists only if it fulfills a defined use case objective, directly (nominal, variant) or as a factored segment. |
| P2 | Specify as-designed: the nominal flow and known, desired variants. Not exhaustive. |
| P3 | Steps in a journey form a strictly linear sequence. Any branching forms a distinct journey (a variant) authored in its own separate file, declaring divergence and rejoin anchors. Raw journey files remain decoupled and linear, while composite overviews assemble all variations into a unified map. |
| P4 | Steps represent events (screen, action, wait, external event), not merely page views. |
| P5 | Specification describes design; tracking measures usage. Drop-offs are measured in funnels, not written in specs. |
| P6 | Any journey can be invoked as a single step inside another (`CALL`). Only segments (`statut: segment`) lack independent business objectives. |
| P7 | Mermaid diagrams are projections of text, never the source of truth. |
| P8 | Single reference language: screens, variants, modules, components, roles, and features are cited by arborescence codes, never human names. |
| P9 | Strict tree & virtual children: reaching a canonical page from a node other than its arborescence parent models a virtual navigation child without altering the tree. |

## 2. Application Registry

The registry is the single source of truth. No journey references an element absent from the registry. The registry of pages, variants, modules, components, and roles is **synchronized from arborescence tables** (`ia_tools sync-registry`).

### 2.1 Interface Elements

| Code | Element | Definition | Arborescence Grammar Reference |
|---|---|---|---|
| PG | Page | First-level route or view, optionally in a variant | `page-ref`: `HOME`, `L001`, `C001@ADMIN:EDIT` |
| MOD | Module | Reusable out-of-tree block, transversal or scoped | `module-ref`: `M001` |
| COMP | Page Component | In-page modal, prompt, or anchor | `comp-ref`: `C001!quick-view`, `C001#reviews` |
| FEAT | Feature | Atomic actionable capability | `FEAT-ref`: `FEAT-SUBMIT` |
| ROLE | Role | User profile code from `roles.md` | `ANONYMOUS`, `BUYER`, `ADMIN` |

### 2.2 Node Types

A node is a graph event. A journey is an ordered sequence of nodes.

| Type | Nature | Reference Carried | Default Observability |
|---|---|---|---|
| ECR | Screen Opening | `page-ref`, `module-ref`, or `comp-ref` | Direct (URL or Custom Event) |
| ACT | User Action on a FEAT | `FEAT-ref` | Direct (Custom Event) |
| ATT | Asynchronous Wait / Processing | Colloquial label | Indirect (Server Status / Webhook) |
| EXT | External Out-of-App Event | Colloquial label | Indirect with return key, else unobservable |

### 2.3 Context Glossary

Context is formulated strictly using closed vocabulary declared in `registre/glossaire.md`.

**Syntax**: list of `key=VALUE` pairs separated by ` ; `. Keys are lowercase (`a-z0-9_`), values uppercase (`A-Z0-9_`). The character `:` is forbidden in context strings (reserved for page variants).

```
ctx      = pair *( " ; " pair )
pair     = key "=" VALUE
regex    : ^[a-z][a-z0-9_]*=[A-Z][A-Z0-9_]*(?: ; [a-z][a-z0-9_]*=[A-Z][A-Z0-9_]*)*$
example  : origin=SEARCH ; folder=DRAFT ; data=COMPLETE
```

### 2.4 File Organization

```
registre/pages.md         (synchronized from 'pages', 'variantes', 'composants_page')
registre/modules.md       (synchronized from 'modules')
registre/roles.md         (synchronized from 'roles')
registre/noeuds.md        (node event catalog)
registre/glossaire.md     (closed context glossary)
uc/UC-xxx.md              (use case specifications and journeys)
generated/                (generated Mermaid diagrams, screen sheets, preview.html)
```

## 3. Use Cases and Journeys

### 3.1 Use Case Header

```yaml
uc_id: UC-DOSSIER
nom: Submit complete application
nature: metier           # metier (business) | usage | confort
importance: critique     # critique (critical) | courant (standard) | occasionnel (occasional)
objectifs: [OBJ-DOSSIER-01]
roles: [MANAGER]
suivi_valeur: yes
part_valeur_indicative: 30%
```

### 3.2 Journeys

```yaml
pf_id: PF-DOSSIER-NOM
uc: UC-DOSSIER
objectif: OBJ-DOSSIER-01
statut: nominal          # nominal | variante (variant) | segment
roles: [MANAGER]
ctx_in: origin=SEARCH ; folder=DRAFT ; data=COMPLETE
ctx_out: folder=SUBMITTED
funnel: yes
confiance: RED           # RED/ROUGE | YELLOW/JAUNE | GREEN/VERT
validation: QA           # QA | UAT | QA+UAT
```

#### Fields Specific to Variants

```yaml
statut: variante
diverge_de: PF-DOSSIER-NOM@1     # step in nominal flow where variant branches off
rejoint: PF-DOSSIER-NOM@4        # optional: step in nominal flow where variant rejoins
```

A variant only defines its distinct steps between `diverge_de` and `rejoint`.

**Architecture & Separation Rules for Variants**:
1. **Raw data isolation**: Every variant journey is authored in its own separate file (e.g., `PF-xxx-VAR-yyy.mmd` or `PF-xxx-VAR-yyy.md`), strictly decoupled from the nominal flow.
2. **Strict linearity**: Within its file, a variant journey forms a strictly linear sequence between `diverge_de` and `rejoint` (or terminal node). It must NOT embed nominal steps or internal branches.
3. **Contextualized origin**: The variant explicitly declares its departure point (`diverge_de: PF-...@N` / `diverge=PF-...@N`) and rejoining target (`rejoint: PF-...@M` / `rejoint=PF-...@M`).
4. **Unified composite overview**: In the Use Case overview (`UC-xxx-overview.mmd` or visualizer composite view), all consistent variations are assembled into a single unified journey graph, modeling all possible paths while preserving raw file isolation.

#### Fields Specific to Segments

```yaml
statut: segment
uc: UC-DOSSIER                   # host use case
objectif:                        # empty: segments do not have independent objectives
atterrissage: C010               # guaranteed landing screen (ECR reference)
```

### 3.3 Steps Table

| Step | Type | Node | Reference | Event | Context Produced |
|---|---|---|---|---|---|
| 1 | ECR | ND-010 | `C010:EDIT` | Opens file | `folder=DRAFT` |
| 2 | ACT | ND-011 | `FEAT-VALIDATE-INFO` | Confirms information | `info=ACQUIRED` |
| 3 | CALL | — | `PF-DOSSIER-PJ-SEG` | Uploads attachments | `docs=VALID ; folder=READY` |
| 4 | ECR | ND-020 | `C010` | Returns to file (landing) | `folder=READY` |
| 5 | ACT | ND-021 | `FEAT-SUBMIT` | Submits file | `folder=SUBMITTED` |

## 4. Breaks and Session Memory

### 3.4 Graph Edges, Transitions, and Line Styles

Journeys and journey graph overviews are represented using standard Mermaid transitions (`flowchart LR`) paired with semantic directives (`%%@edge`). Line styles carry strict functional meanings:

| Line Style | Visual Token | Transition Nature | Usage in Journey Graph | Mermaid Syntax |
|---|---|---|---|---|
| **Solid dark line** | `--dg-edge` (1.5px, solid, filled arrowhead) | Nominal transition | Direct sequential transition between nominal steps (Screen ➔ Action ➔ Screen) | `-->` |
| **Dashed gray line** | `--dg-edge-cross` (1.5px, dashed `6 4`, open arrowhead) | Variant branch | Divergence from nominal path (`diverge`), variant-internal step (`variant`), or return to nominal path (`rejoin`) | `-.->` |
| **Solid purple line** | `--dg-call` (`#8b4dff`, 1.5px, purple arrow) | Sub-journey call | Outgoing transition exiting a reusable segment or sub-journey (`CALL`) | Origin is `CALL` |
| **Solid orange line** | `--dg-ext` (`#ff9500`, 1.5px, orange arrow) | External resumption | Outgoing transition exiting an asynchronous external event (`EXT`) | Origin is `EXT` |

- **Y-Axis Alignment Rule**: In visual projections, all nominal steps of a journey and all steps of a standalone linear variant flow MUST be aligned on the exact same horizontal baseline (row 0, identical `Y` coordinate). Branching variants occupy dedicated parallel lanes below without shifting the nominal path downward.

### 3.5 Visual Projections and Selective Layer Filtering (Topological Contraction)
When visualizing journeys in the Unified Viewer (`preview.html`):
- **Full Functional Journey (Default)**: Displays all chronological steps (`ECR`, `ACT`, `ATT`, `CALL`, `EXT`).
- **Screen-Centric Journey (Selective Filtering)**: The viewer allows hiding `Actions (ACT)` or `Asynchronous Waits (ATT)`. Hiding intermediate steps performs a **transitive topological contraction** of the graph: hidden nodes are eliminated and their immediate predecessors and successors are directly bridged (`Screen A --> Screen B`), keeping the nominal path strictly on the Y baseline with continuous spacing.

## 4. Breaks and Session Memory

A break `⏸` models the possibility of an intentional or forced user interruption.
- **Mandatory on `ATT` and `EXT` nodes** (Rule R-30).
- Fields:
  - `rupture`: flag on node
  - `memory to preserve`: data that must survive interruption
  - `conservation level`: live (current session), persistent (database save), external (deep link return key)
  - `resumption point`: `ECR` node where user resumes
  - `expected delay`: minutes, hours, days

## 5. Tracking and Observability

- Every journey (`pf_id`) and node (`nd_id`) has a stable identifier.
- Every node in a funnel journey must have an observability signal: dedicated URL or custom analytics event.
- Events must include `pf_id` and `nd_id`, plus `pf_caller` / `pf_appelant` when invoked via `CALL`.

## 6. Confidence Framework

| Value | Status | Definition |
|---|---|---|
| `RED` / `ROUGE` | Designed, untested | Initial status |
| `YELLOW` / `JAUNE` | Tested, unmeasured in prod | QA or UAT validation confirmed |
| `GREEN` / `VERT` | Measured in production | Analytics funnel matches design target |

## 7. Deduced Screen Sheet

For each screen reference, the tool derives:
- **Inputs**: upstream nodes, journeys, roles
- **Contexts**: observed `key=VALUE` terms
- **Contents**: triggered capabilities, invoked modules
- **Outputs**: next steps, journey calls, exits
- **Breaks**: resumption data and memory level
- **Signals**: expected tracking URLs and events

## 8. Audit Rules

### Integrity
- **R-01 (Blocking)**: All references exist in registry and conform to grammar.
- **R-02 (Blocking)**: A feature is only triggered on screens hosting it.
- **R-03 (Blocking)**: IDs are unique and stable; template changes are tracked.
- **R-04 (Blocking)**: No colloquial human names used in references.
- **R-05 (Warning)**: Template uniqueness & virtual child: reuse canonical reference with variant rather than introducing duplicates.

### Coverage
- **R-10 (Blocking)**: Every journey is attached to a use case.
- **R-11 (Blocking)**: Every objective has exactly one nominal journey.
- **R-12 (Blocking)**: Every non-hub, non-technical page is traversed by at least one journey.
- **R-13 (Warning)**: Modules, components, and variants traversed by at least one journey.
- **R-15 (Warning)**: Orphan segments called by no journeys.

### Consistency
- **R-20 (Blocking)**: Produced context satisfies subsequent step prerequisites.
- **R-21 (Blocking)**: Step following a `CALL` matches the callee's declared landing screen (`atterrissage`).
- **R-22 (Blocking)**: No recursive call cycles.
- **R-24 (Blocking)**: Role permissions respected on all traversed screens.
- **R-25 (Blocking)**: Journeys are strictly linear sequences.
- **R-26 (Blocking)**: Variants declare valid `diverge_de` and `rejoint` anchors.

### Breaks
- **R-30 (Blocking)**: `ATT` or `EXT` node without break marker `⏸`.
- **R-31 (Blocking)**: Break declared without preserved memory or resumption point.

### Tracking
- **R-40 (Blocking)**: Funnel journeys define signals on all steps.
- **R-41 (Warning)**: Unobservable node in a funnel journey.
- **R-42 (Warning)**: Sibling nodes sharing identical tracking signal.

### Confidence
- **R-50 (Blocking)**: Confidence exceeds minimum of called journeys.
- **R-51 (Warning)**: Production journey modified without resetting status.
