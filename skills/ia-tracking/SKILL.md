---
name: ia-tracking
description: >-
  Information Architecture tracking plan design and generation skill.
  Used to instrument conversion funnels, define observability signals
  for each node (URLs, custom events, return keys), and audit observability coverage.
---

# Skill: IA Tracking & Observability

This skill implements tracking requirements defined in:
[Section 5 of spec-userflows.md](../../specs/spec-userflows.md#5-tracking).

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions are documented in English, **the generated tracking plan documentation (matrix headers, signal explanations, business goal descriptions) MUST be written in the language of the user's prompt** (e.g., French if prompting in French, English if prompting in English, etc.). Technical event keys, IDs, and parameters remain exact.

---

## Core Tracking Principles

1. **Stable Identifiers**: Every journey (`pf_id`) and every node (`nd_id`) carries a unique, persistent identifier.
2. **Mandatory Event Properties**:
   - `pf_id`: identifier of the active journey
   - `nd_id`: identifier of the triggered event node
   - `pf_caller` / `pf_appelant`: mandatory when a journey is invoked via `CALL` (to attribute drop-off to the correct parent funnel).
3. **Observability Signal Types**:
   - Standard pages: Dedicated canonical URL (`/files/[id]`).
   - Modules & page components (`!`, `#`): Custom event (e.g., `screen_view_virtual` with `component_id`).
   - Action nodes (`ACT`): Custom event named after the feature (`action_feat_submit`).
   - External nodes (`EXT`): Return key (deep link with token) to tie resumption to the funnel.
4. **Tracking Audit Rules**:
   - `R-40`: Funnel journeys (`funnel: yes`) must define a signal on every step.
   - `R-41`: Unobservable steps in a funnel journey trigger a warning.
   - `R-42`: Sibling nodes in the same journey must not share identical signals without a differentiating parameter.

---

## Step-by-Step Procedure

1. **Identify Funnel Journeys**:
   - Locate journeys with `funnel: yes` (or `funnel: oui`) in `uc/UC-xxx.md`.
2. **Define Tracking Matrix**:
   - For each step, document signal type (URL, Event, Server, Return Key).
   - Use the template [plan-tracking-template.md](../../templates/derived/plan-tracking-template.md).
3. **Validate Plan Integrity**:
   - Ensure events are uniquely attributed.
   - Confirm modules and modals emit a dedicated open signal.
