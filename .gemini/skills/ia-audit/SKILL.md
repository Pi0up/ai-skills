---
name: ia-audit
description: >-
  Information Architecture integrity, continuous consistency, and repair audit skill.
  Used to audit full projects or scoped use cases, detect broken links
  (following external changes, page or URL renaming), and generate normative audit reports.
---

# Skill: IA Audit & Continuous Repair

This skill audits the entire set of IA deliverables against normative checks and rules:
- **Arborescence Integrity Checks**: C1 to C15 (Section 10 of `spec-arborescence.md`)
- **Userflows Audit Rules**: R-01 to R-72 (Section 8 of `spec-userflows.md`)

---

> [!IMPORTANT]
> **Deliverable Language Rule:**
> While instructions and rules are written in English, **the audit report and proposed corrective actions MUST be generated in the language of the user's prompt** (e.g., French if prompting in French, English if prompting in English, etc.). Technical rule IDs (`C1`, `R-01`, etc.) and code references remain unchanged.

---

## Broken Link Detection (External Changes)

When a page is renamed, removed, or an external URL is changed:
1. **Arborescence**:
   - Broken parent links in `pages.parent`
   - Orphan variants in `variantes.ref`
   - Orphan components in `composants_page.page`
   - Orphan scoped modules in `modules.portee (PAGE:...)`
   - Broken cross-references in `renvois.source` or `renvois.cible`
2. **Userflows**:
   - `ECR` nodes targeting non-existent screen codes
   - `ACT` nodes triggering features not declared on the target screen
   - Landing screen mismatches following a `CALL`
   - Invalid `diverge_de` or `rejoint` anchors

---

## Execution Commands

### 1. Global Audit
```bash
python -m ia_tools.cli validate --dir .
```

### 2. Scoped Audit on a Single Use Case
```bash
python -m ia_tools.cli validate --dir . --scope UC-DOSSIER
```

### 3. Export Markdown Audit Report
```bash
python -m ia_tools.cli validate --dir . --output rapport-audit.md
```

---

## Diagnostic & Remediation Procedure

1. **Resolve Blocking Anomalies (Must)**:
   - C1 / C2: Correct codes not matching grammar.
   - C3 / C4: Restore strict hierarchical tree (single parent per page, absolute ban on multi-parenting) and cascading URLs.
   - R-01: Update screen references in userflow steps to valid codes.
   - R-11: Ensure each objective has exactly one nominal journey.
   - R-12 / C9: If a page is not covered by a journey, integrate it into a relevant use case.
   - R-21: Adjust post-CALL screen to match the callee's guaranteed landing screen.
   - R-30: Insert `⏸` and session memory specifications on `ATT` waits and `EXT` external exchanges.
2. **Address Warnings (Should)**:
   - C15 / R-05: Identify unjustified duplicate screens for the same entity; request human arbitration to mutualize with variants or document functional divergence.
   - R-15: Connect or archive orphan segments.
   - C10 / C11: Adjust module scopes and cross-references.
3. **Re-synchronize Registry and Re-validate**:
   ```bash
   python -m ia_tools.cli sync-registry
   python -m ia_tools.cli validate
   ```
