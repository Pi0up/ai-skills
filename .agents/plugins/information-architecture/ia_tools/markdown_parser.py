"""Markdown parser for Information Architecture.

Extracts reference tables (Arborescence), glossaries, and use cases (Userflows).
Zero external dependencies (Python standard library only).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .models import (
    ArborescenceModel,
    CasUsage,
    ComposantPage,
    Etape,
    Module,
    Page,
    Parcours,
    Renvoi,
    Role,
    Rupture,
    UserflowsModel,
    Variante,
)


def parse_markdown_table(text: str) -> List[Dict[str, str]]:
    """Extracts the first Markdown table found in text as a list of dictionaries."""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    table_lines: List[str] = []
    in_table = False

    for line in lines:
        if line.startswith("|") and line.endswith("|"):
            in_table = True
            table_lines.append(line)
        elif in_table:
            # End of table
            break

    if len(table_lines) < 2:
        return []

    # Extract headers
    raw_headers = [c.strip() for c in table_lines[0].strip("|").split("|")]
    headers = [h.strip("`*_ ") for h in raw_headers]

    # Verify separator row
    if not re.match(r"^\|?[\s\-:|]+\|?$", table_lines[1]):
        return []

    rows: List[Dict[str, str]] = []
    for line in table_lines[2:]:
        if not (line.startswith("|") and line.endswith("|")):
            continue
        raw_cells = [c.strip() for c in line.strip("|").split("|")]
        # Clean quotes / backticks
        cells = [c.strip("`") for c in raw_cells]
        row_dict: Dict[str, str] = {}
        for i, h in enumerate(headers):
            val = cells[i].strip() if i < len(cells) else ""
            row_dict[h] = val
        rows.append(row_dict)

    return rows


def parse_yaml_simple(yaml_text: str) -> Dict[str, Any]:
    """Lightweight standard YAML parser for simple dictionaries and lists without external dependencies."""
    data: Dict[str, Any] = {}
    lines = yaml_text.strip().splitlines()
    current_key: Optional[str] = None

    for line in lines:
        raw_line = line.split("#")[0].strip()
        if not raw_line:
            continue

        if ":" in raw_line:
            parts = raw_line.split(":", 1)
            key = parts[0].strip()
            val = parts[1].strip()

            if val.startswith("[") and val.endswith("]"):
                # Inline list [a, b, c]
                items = [x.strip().strip("'\"") for x in val[1:-1].split(",") if x.strip()]
                data[key] = items
            elif val.lower() in ("true", "oui", "yes"):
                data[key] = True
            elif val.lower() in ("false", "non", "no"):
                data[key] = False
            elif val == "":
                data[key] = None
                current_key = key
            else:
                data[key] = val.strip("'\"")
                current_key = None
        elif raw_line.startswith("- ") and current_key:
            item = raw_line[2:].strip().strip("'\"")
            if not isinstance(data.get(current_key), list):
                data[current_key] = []
            data[current_key].append(item)

    return data


class ArborescenceParser:
    """Loads arborescence reference tables from Markdown files."""

    @staticmethod
    def parse_directory(dir_path: Path) -> ArborescenceModel:
        model = ArborescenceModel()

        # 1. roles.md
        roles_file = dir_path / "roles.md"
        if roles_file.exists():
            for row in parse_markdown_table(roles_file.read_text(encoding="utf-8")):
                code = row.get("code") or row.get("Code")
                if code:
                    label = row.get("label", "") or row.get("Label", "")
                    model.roles[code] = Role(code=code, label=label)

        # 2. pages.md
        pages_file = dir_path / "pages.md"
        if pages_file.exists():
            for row in parse_markdown_table(pages_file.read_text(encoding="utf-8")):
                code = row.get("code") or row.get("Code")
                if not code:
                    continue
                url = row.get("url") or row.get("URL") or "/"
                parent = row.get("parent") or row.get("Parent")
                if parent in ("—", "-", "None", "null", ""):
                    parent = None
                ordre_raw = row.get("ordre") or row.get("Ordre") or row.get("order") or row.get("Order")
                ordre = int(ordre_raw) if ordre_raw and ordre_raw.isdigit() else None
                label = row.get("label", "") or row.get("Label", "")

                access_raw = row.get("access") or row.get("Access") or ""
                access = [a.strip() for a in access_raw.split(",") if a.strip()]

                feats_raw = (
                    row.get("fonctionnalites")
                    or row.get("Fonctionnalites")
                    or row.get("features")
                    or row.get("Features")
                    or ""
                )
                feats = [f.strip() for f in feats_raw.split(",") if f.strip()]

                model.pages[code] = Page(
                    code=code,
                    url=url,
                    parent=parent,
                    ordre=ordre,
                    label=label,
                    access=access,
                    fonctionnalites=feats,
                )

        # 3. variantes.md
        variantes_file = dir_path / "variantes.md"
        if variantes_file.exists():
            for row in parse_markdown_table(variantes_file.read_text(encoding="utf-8")):
                ref = row.get("ref") or row.get("Ref")
                if not ref:
                    continue
                cond = (
                    row.get("condition_spec")
                    or row.get("Condition_spec")
                    or row.get("condition")
                    or row.get("Condition")
                    or ""
                )
                access_raw = row.get("access") or row.get("Access") or ""
                access = [a.strip() for a in access_raw.split(",") if a.strip()]
                url_dist = (
                    row.get("url_distincte")
                    or row.get("Url_distincte")
                    or row.get("distinct_url")
                    or row.get("Distinct_url")
                )
                if url_dist in ("—", "-", "None", "null", ""):
                    url_dist = None

                model.variantes[ref] = Variante(
                    ref=ref,
                    condition_spec=cond,
                    access=access,
                    url_distincte=url_dist,
                )

        # 4. modules.md
        modules_file = dir_path / "modules.md"
        if modules_file.exists():
            for row in parse_markdown_table(modules_file.read_text(encoding="utf-8")):
                code = row.get("code") or row.get("Code")
                invoc = row.get("invocation") or row.get("Invocation")
                if not code or not invoc:
                    continue
                access_raw = row.get("access") or row.get("Access") or ""
                access = [a.strip() for a in access_raw.split(",") if a.strip()]
                portee = row.get("portee") or row.get("Portee") or row.get("scope") or row.get("Scope") or "ALL"
                label = row.get("label", "") or row.get("Label", "")
                feats_raw = (
                    row.get("fonctionnalites")
                    or row.get("Fonctionnalites")
                    or row.get("features")
                    or row.get("Features")
                    or ""
                )
                feats = [f.strip() for f in feats_raw.split(",") if f.strip()]

                model.modules[code] = Module(
                    code=code,
                    invocation=invoc,
                    access=access,
                    portee=portee,
                    label=label,
                    fonctionnalites=feats,
                )

        # 5. composants_page.md
        comp_file = dir_path / "composants_page.md"
        if comp_file.exists():
            for row in parse_markdown_table(comp_file.read_text(encoding="utf-8")):
                page = row.get("page") or row.get("Page")
                marqueur = (
                    row.get("marqueur")
                    or row.get("Marqueur")
                    or row.get("marker")
                    or row.get("Marker")
                    or "!"
                )
                cle = row.get("cle") or row.get("Cle") or row.get("key") or row.get("Key")
                if not page or not cle:
                    continue
                label = row.get("label", "") or row.get("Label", "")
                feats_raw = (
                    row.get("fonctionnalites")
                    or row.get("Fonctionnalites")
                    or row.get("features")
                    or row.get("Features")
                    or ""
                )
                feats = [f.strip() for f in feats_raw.split(",") if f.strip()]

                comp = ComposantPage(
                    page=page,
                    marqueur=marqueur,
                    cle=cle,
                    label=label,
                    fonctionnalites=feats,
                )
                model.composants[comp.ref] = comp

        # 6. renvois.md
        renvois_file = dir_path / "renvois.md"
        if renvois_file.exists():
            for row in parse_markdown_table(renvois_file.read_text(encoding="utf-8")):
                source = row.get("source") or row.get("Source")
                feat = (
                    row.get("fonctionnalite")
                    or row.get("Fonctionnalite")
                    or row.get("feature")
                    or row.get("Feature")
                )
                cible = row.get("cible") or row.get("Cible") or row.get("target") or row.get("Target")
                if not (source and feat and cible):
                    continue
                rtype = row.get("type") or row.get("Type") or "page"
                model.renvois.append(Renvoi(source=source, fonctionnalite=feat, cible=cible, type=rtype))

        return model


class UserflowsParser:
    """Loads use cases and journey glossaries."""

    @staticmethod
    def parse_glossary(file_path: Path) -> Dict[str, List[str]]:
        glossary: Dict[str, List[str]] = {}
        if not file_path.exists():
            return glossary

        rows = parse_markdown_table(file_path.read_text(encoding="utf-8"))
        for row in rows:
            cle = row.get("cle") or row.get("Clé") or row.get("Cle") or row.get("key") or row.get("Key")
            vals_raw = (
                row.get("valeurs")
                or row.get("Valeurs")
                or row.get("values")
                or row.get("Values")
                or row.get("Exemples de valeurs")
                or row.get("Example values")
                or ""
            )
            if cle:
                vals = [v.strip() for v in vals_raw.split(",") if v.strip()]
                glossary[cle] = vals
        return glossary

    @staticmethod
    def parse_uc_file(file_path: Path) -> CasUsage:
        content = file_path.read_text(encoding="utf-8")

        # 1. Extract YAML blocks and tables
        uc_data: Dict[str, Any] = {}
        fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
        if fm_match:
            uc_data = parse_yaml_simple(fm_match.group(1))
        else:
            first_yaml = re.search(r"```ya?ml\s*\n(.*?)\n```", content, re.DOTALL)
            if first_yaml:
                parsed = parse_yaml_simple(first_yaml.group(1))
                if "uc_id" in parsed or "id" in parsed:
                    uc_data = parsed

        uc_id = uc_data.get("uc_id") or uc_data.get("id") or file_path.stem
        nom = uc_data.get("nom") or uc_data.get("name") or uc_data.get("title") or uc_id
        nature = uc_data.get("nature", "metier")
        importance = uc_data.get("importance", "courant")
        objectifs = uc_data.get("objectifs") or uc_data.get("objectives") or uc_data.get("goals") or []
        if isinstance(objectifs, str):
            objectifs = [objectifs]
        roles = uc_data.get("roles", [])
        if isinstance(roles, str):
            roles = [roles]
        suivi_valeur = bool(uc_data.get("suivi_valeur") or uc_data.get("value_tracking", False))
        part_valeur = uc_data.get("part_valeur_indicative") or uc_data.get("indicative_value_share")

        cas_usage = CasUsage(
            uc_id=uc_id,
            nom=nom,
            nature=nature,
            importance=importance,
            objectifs=objectifs,
            roles=roles,
            suivi_valeur=suivi_valeur,
            part_valeur_indicative=part_valeur,
        )

        # 2. Split content by journey sections
        sections = re.split(r"\n(?=#{2,4}\s+)", content)
        for sec in sections:
            yaml_match = re.search(r"```ya?ml\s*\n(.*?)\n```", sec, re.DOTALL)
            if not yaml_match:
                continue
            p_data = parse_yaml_simple(yaml_match.group(1))
            pf_id = p_data.get("pf_id") or p_data.get("uf_id") or p_data.get("id")
            if not pf_id:
                continue

            statut = p_data.get("statut") or p_data.get("status") or "nominal"
            p_roles = p_data.get("roles", roles)
            if isinstance(p_roles, str):
                p_roles = [p_roles]
            objectif = p_data.get("objectif") or p_data.get("objective") or p_data.get("goal") or ""
            ctx_in = str(p_data.get("ctx_in", "") or "")
            ctx_out = str(p_data.get("ctx_out", "") or "")
            funnel = bool(p_data.get("funnel", False))
            confiance = p_data.get("confiance") or p_data.get("confidence") or "ROUGE"
            validation = p_data.get("validation")
            poids = p_data.get("poids_indicatif") or p_data.get("indicative_weight")
            diverge_de = p_data.get("diverge_de") or p_data.get("diverges_from")
            rejoint = p_data.get("rejoint") or p_data.get("joins") or p_data.get("rejoins")
            atterrissage = p_data.get("atterrissage") or p_data.get("landing")

            parcours = Parcours(
                pf_id=pf_id,
                uc=uc_id,
                statut=statut,
                roles=p_roles,
                objectif=objectif,
                ctx_in=ctx_in,
                ctx_out=ctx_out,
                funnel=funnel,
                confiance=confiance,
                validation=validation,
                poids_indicatif=poids,
                diverge_de=diverge_de,
                rejoint=rejoint,
                atterrissage=atterrissage,
            )

            # Extract step table in this section
            table_rows = parse_markdown_table(sec)
            for row in table_rows:
                num_raw = (
                    row.get("N°")
                    or row.get("Num")
                    or row.get("n°")
                    or row.get("#")
                    or row.get("No")
                    or row.get("Step")
                    or row.get("step")
                    or "0"
                )
                num = int(num_raw) if num_raw.isdigit() else len(parcours.etapes) + 1
                etype = row.get("Type") or row.get("type") or "ECR"
                noeud = (
                    row.get("Nœud")
                    or row.get("Noeud")
                    or row.get("noeud")
                    or row.get("Node")
                    or row.get("node")
                    or ""
                )
                if noeud in ("—", "-"):
                    noeud = ""
                ref = row.get("Référence") or row.get("Reference") or row.get("ref") or row.get("Ref") or ""
                evenement = (
                    row.get("Événement")
                    or row.get("Evenement")
                    or row.get("Libellé")
                    or row.get("Event")
                    or row.get("event")
                    or row.get("Label")
                    or row.get("label")
                    or ""
                )
                ctx_prod = (
                    row.get("Contexte produit")
                    or row.get("Contexte")
                    or row.get("Context produced")
                    or row.get("Context")
                    or row.get("context")
                    or row.get("ctx_prod")
                    or ""
                )

                # Detect break marker ⏸
                has_rupture = (
                    "⏸" in evenement
                    or "rupture" in row.get("Rupture", "").lower()
                    or "break" in row.get("Break", "").lower()
                )
                rupture = Rupture(active=True) if has_rupture else None

                etape = Etape(
                    numero=num,
                    type=etype,
                    reference=ref,
                    noeud=noeud,
                    evenement=evenement,
                    contexte_produit=ctx_prod,
                    rupture=rupture,
                )
                parcours.etapes.append(etape)

            cas_usage.parcours[pf_id] = parcours

        return cas_usage

    @classmethod
    def parse_directory(cls, dir_path: Path) -> UserflowsModel:
        model = UserflowsModel()

        # 1. glossary
        glossary_path = dir_path / "registre" / "glossaire.md"
        if not glossary_path.exists():
            glossary_path = dir_path / "glossaire.md"
        model.glossaire = cls.parse_glossary(glossary_path)

        # 2. use cases in uc/ or at root
        uc_dir = dir_path / "uc"
        search_dirs = [uc_dir] if uc_dir.exists() else [dir_path]
        for sdir in search_dirs:
            for uc_file in sdir.glob("UC-*.md"):
                cu = cls.parse_uc_file(uc_file)
                model.cas_usages[cu.uc_id] = cu

        return model

