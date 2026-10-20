# Journey Tracking & Observability Plan

> Breakdown of tracking signals for funnel journeys.
> Conforms to spec-userflows.md (Section 5).

## 1. Funnel Overview: [PF-ID]
- **Business Goal**: [OBJ-ID]
- **Entry Signal**: `[START_URL_OR_EVENT]`
- **Goal Completion Signal (Success)**: `[SUCCESS_EVENT]`

---

## 2. Step Observability Matrix

| Step | Node | Type | Reference | Observability | Signal Type | Signal Name / URL | Mandatory Properties |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | ND-010 | ECR | C010:EDIT | Direct | URL | `/files/[id]` | `pf_id`, `nd_id` |
| 2 | ND-011 | ACT | FEAT-VALIDER-INFOS | Direct | Event | `action_validate_info` | `pf_id`, `nd_id` |
| 3 | ND-040 | ECR | F010 | Direct | URL | `/files/[id]/documents` | `pf_id`, `nd_id`, `pf_caller` |
| 4 | ND-041 | ACT | FEAT-TELEVERSER | Direct | Event | `action_upload` | `pf_id`, `nd_id`, `pf_caller`, `file_count` |
| 5 | ND-042 | ATT | Inspection | Indirect | Server | `webhook_review_completed` | `pf_id`, `dossier_id` |
| 6 | ND-031 | EXT | Advisor call | Indirect | Deep Link | `/resume?token=[jwt]` | `pf_id`, `nd_id`, `return_key` |
| 7 | ND-021 | ACT | FEAT-SOUMETTRE | Direct | Event | `goal_application_submitted` | `pf_id`, `nd_id`, `final_status` |

---

## 3. Technical Implementation Rules
1. **Unrouted In-Page Events**: Modals (`!`) and anchors (`#`) lack standalone URLs; opening them must emit a `screen_view_virtual` analytics event.
2. **Drop-Off Attribution**: When a journey is invoked by another (CALL), the event must include `pf_caller` to attribute drop-off to the parent funnel.
3. **External Events (EXT)**: Any third-party redirect or email must supply an encrypted resumption link containing the return key.
