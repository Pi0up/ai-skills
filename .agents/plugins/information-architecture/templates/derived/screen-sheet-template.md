# Deduced Screen Sheet: [SCREEN_CODE]

> Synthetic screen sheet crossing arborescence and userflows (spec-userflows.md Section 7).

- **Canonical Reference**: `[CODE_OR_VARIANT]` (e.g., `C010:EDIT`)
- **Component Type**: Page / Variant / Module / Modal
- **Target URL / Signal**: `/files/[id]` (or custom event if component/module)
- **Authorized Roles**: `[ROLES]`
- **Calculated Importance**: Critical / Standard / Occasional

---

## 1. Usage Context & Observable States
Context terms (`key=VALUE`) documented when reaching this screen:
- `folder=DRAFT`
- `data=COMPLETE`

---

## 2. Content & Actionable Capabilities
Features (`FEAT`), transversal modules, or triggered components:
- `FEAT-VALIDER-INFOS` (Form validation action)
- `FEAT-DEMANDER-AIDE` (Open support channel)
- Transversal module `!help-panel`

---

## 3. Inputs (Where does the user come from?)
- From `ND-001` (Home) in journey `PF-DOSSIER-NOM`
- From external notification `ND-EXT-01` in journey `PF-DOSSIER-VAR-NOTIF`

---

## 4. Outputs (Where does the user go?)
- To `PF-DOSSIER-PJ-SEG` (Upload attachments) via action `ND-011`
- To direct exit (Abandon / Save draft)

---

## 5. Breaks & Session Memory
- **Resumption Point**: This screen acts as the resumption anchor for wait `ND-042`.
- **Data to Restore**: Uploaded documents and validated form state.
