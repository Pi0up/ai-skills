"""Synchroniseur du registre d'application pour les Userflows.

Alimente `registre/pages.md`, `registre/modules.md`, `registre/roles.md`
à partir des tables de référence de l'arborescence (spec-userflows.md Section 2).
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .models import ArborescenceModel


class RegistrySynchronizer:
    def __init__(self, arbo: ArborescenceModel, output_dir: Path):
        self.arbo = arbo
        self.output_dir = output_dir

    def sync_all(self) -> None:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.sync_roles()
        self.sync_pages()
        self.sync_modules()

    def sync_roles(self) -> None:
        lines = [
            "# Registre des Rôles (Synchronisé depuis l'Arborescence)",
            "",
            "| code | label |",
            "| :--- | :--- |",
        ]
        for role in self.arbo.roles.values():
            lines.append(f"| `{role.code}` | {role.label} |")
        (self.output_dir / "roles.md").write_text("\n".join(lines), encoding="utf-8")

    def sync_pages(self) -> None:
        lines = [
            "# Registre des Pages et Variantes (Synchronisé depuis l'Arborescence)",
            "",
            "## 1. Pages de base",
            "",
            "| code | url | access | fonctionnalites |",
            "| :--- | :--- | :--- | :--- |",
        ]
        for p in self.arbo.pages.values():
            access_str = ", ".join(p.access)
            feats_str = ", ".join(p.fonctionnalites) if p.fonctionnalites else "—"
            lines.append(f"| `{p.code}` | `{p.url}` | {access_str} | {feats_str} |")

        if self.arbo.variantes:
            lines.extend([
                "",
                "## 2. Variantes d'écrans déclarées",
                "",
                "| ref | condition_spec | access | url_distincte |",
                "| :--- | :--- | :--- | :--- |",
            ])
            for v in self.arbo.variantes.values():
                acc = ", ".join(v.access) if v.access else "Hérité"
                url_d = f"`{v.url_distincte}`" if v.url_distincte else "—"
                lines.append(f"| `{v.ref}` | {v.condition_spec} | {acc} | {url_d} |")

        if self.arbo.composants:
            lines.extend([
                "",
                "## 3. Composants rattachés",
                "",
                "| reference | page | type | label | fonctionnalites |",
                "| :--- | :--- | :--- | :--- | :--- |",
            ])
            for c in self.arbo.composants.values():
                ctype = "popin/prompt" if c.marqueur == "!" else "ancre interne"
                feats_str = ", ".join(c.fonctionnalites) if c.fonctionnalites else "—"
                lines.append(f"| `{c.ref}` | `{c.page}` | {ctype} | {c.label} | {feats_str} |")

        (self.output_dir / "pages.md").write_text("\n".join(lines), encoding="utf-8")

    def sync_modules(self) -> None:
        lines = [
            "# Registre des Modules (Synchronisé depuis l'Arborescence)",
            "",
            "| code | invocation | access | portee | fonctionnalites |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]
        for m in self.arbo.modules.values():
            access_str = ", ".join(m.access)
            feats_str = ", ".join(m.fonctionnalites) if m.fonctionnalites else "—"
            lines.append(f"| `{m.code}` | `!{m.invocation}` | {access_str} | `{m.portee}` | {feats_str} |")

        (self.output_dir / "modules.md").write_text("\n".join(lines), encoding="utf-8")
