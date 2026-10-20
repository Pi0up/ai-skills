"""Générateur de diagrammes Mermaid normalisés pour l'Architecture de l'Information.

Conforme aux spécifications :
- spec-arborescence.md (v0.3)
- spec-userflows.md (v2.1)

Supporte deux modes de rendu :
- 'rich' (par défaut) : Cartes d'écran complètes à 4 quadrants inspirées du design system Figma (HTML labels)
- 'standard' : Rendu minimaliste basé sur des chaînes Mermaid natives
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Set, Tuple

from .models import (
    ArborescenceModel,
    CasUsage,
    ComposantPage,
    Etape,
    Module,
    Page,
    Parcours,
    UserflowsModel,
    Variante,
)


TEMPLATE_LABELS: Dict[str, str] = {
    "HOME": "Homepage",
    "H": "Hub",
    "L": "Liste / Datagrid",
    "F": "Formulaire",
    "C": "Consultation",
    "D": "Dashboard",
    "E": "Technique",
    "M": "Module",
}

MERMAID_RICH_INIT_TD = """%%{init: {
  'theme': 'base',
  'themeVariables': {
    'lineColor': '#64748b'
  },
  'flowchart': {
    'curve': 'basis',
    'nodeSpacing': 50,
    'rankSpacing': 60,
    'htmlLabels': true
  }
}}%%"""

MERMAID_RICH_INIT_LR = """%%{init: {
  'theme': 'base',
  'themeVariables': {
    'lineColor': '#64748b'
  },
  'flowchart': {
    'curve': 'basis',
    'nodeSpacing': 60,
    'rankSpacing': 70,
    'htmlLabels': true
  }
}}%%"""


class MermaidGenerator:

    @classmethod
    def parse_frontmatter(cls, content: str) -> Tuple[Dict[str, Any], str]:
        """Extrait l'en-tête YAML frontmatter d'un diagramme Mermaid si présent.
        
        Retourne (dictionnaire_metadonnees, source_mermaid_sans_frontmatter).
        """
        metadata: Dict[str, Any] = {}
        cleaned = content.strip()
        if cleaned.startswith("---"):
            parts = cleaned.split("---", 2)
            if len(parts) >= 3:
                raw_yaml = parts[1].strip()
                cleaned = parts[2].strip()
                for line in raw_yaml.splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = v.strip()
                        if v.startswith("[") and v.endswith("]"):
                            metadata[k] = [x.strip() for x in v[1:-1].split(",") if x.strip()]
                        else:
                            metadata[k] = v
        return metadata, cleaned

    @classmethod
    def build_node_metadata_registry(
        cls,
        arbo: ArborescenceModel,
        uf: Optional[UserflowsModel] = None,
        screen_sheets: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Indexe l'ensemble des métadonnées de nœuds (pages, modules, variantes, étapes de parcours)."""
        registry: Dict[str, Any] = {}

        # 1. Pages de l'arborescence
        for code, page in arbo.pages.items():
            nature = "Absolu" if page.url == "/" or page.url.startswith("/") else "Relatif"
            tpl_label = TEMPLATE_LABELS.get(page.template, "Page")
            access_roles = list(page.access) if page.access else (["ANONYMOUS"] if not page.is_protected else ["AUTH"])

            sheet = screen_sheets.get(code) if screen_sheets else None
            inputs = list(sheet.entrees) if sheet else []
            outputs = list(sheet.sorties) if sheet else []
            contexts = list(sheet.contextes_observes) if sheet else []
            features = list(sheet.fonctionnalites_actionnees) if sheet else []

            registry[code] = {
                "code": code,
                "label": page.label or code,
                "url": page.url,
                "nature": nature,
                "is_protected": page.is_protected,
                "template": page.template,
                "template_label": tpl_label,
                "order": page.ordre,
                "parent": page.parent,
                "roles": access_roles,
                "inputs": inputs,
                "outputs": outputs,
                "contexts": contexts,
                "features": features,
                "signals": [f"URL: {page.url}"],
                "screen_sheet": f"screen-sheets/screen-{code}.md",
                "description": page.description or f"Page {code} ({page.label or page.url})",
            }

        # 2. Modules transverses
        for mcode, mod in arbo.modules.items():
            registry[mcode] = {
                "code": mcode,
                "label": mod.label or mcode,
                "url": f"!{mod.invocation}",
                "nature": "Module",
                "is_protected": mod.portee not in ("ALL", "PUBLIC"),
                "template": "M",
                "template_label": "Module Transverse",
                "order": None,
                "parent": None,
                "roles": [mod.portee],
                "inputs": [],
                "outputs": [],
                "contexts": [],
                "features": [],
                "signals": [f"MOD: !{mod.invocation}"],
                "screen_sheet": f"screen-sheets/screen-M_{mcode}.md",
                "description": mod.description or f"Module transverse {mod.code}",
            }

        # 3. Variantes d'écran
        for vref, var in arbo.variantes.items():
            clean_code = "VAR_" + re.sub(r"[^A-Za-z0-9_]", "_", vref)
            base = arbo.pages.get(var.page_base)
            url = var.url_distincte or (base.url if base else "")
            access_roles = list(var.access) if var.access else (list(base.access) if base else ["AUTH"])
            sheet = screen_sheets.get(vref) if screen_sheets else None

            var_meta = {
                "code": vref,
                "label": var.label or vref,
                "url": url,
                "nature": "Variante",
                "is_protected": True,
                "template": base.template if base else "C",
                "template_label": f"Variante ({TEMPLATE_LABELS.get(base.template, 'Page') if base else 'Page'})",
                "order": None,
                "parent": var.page_base,
                "roles": access_roles,
                "inputs": list(sheet.entrees) if sheet else [],
                "outputs": list(sheet.sorties) if sheet else [],
                "contexts": list(sheet.contextes_observes) if sheet else [],
                "features": list(sheet.fonctionnalites_actionnees) if sheet else [],
                "signals": [f"VAR: {vref}"],
                "screen_sheet": f"screen-sheets/screen-{re.sub(r'[^A-Za-z0-9_]', '_', vref)}.md",
                "description": var.description or f"Variante d'écran {vref}",
            }
            registry[clean_code] = var_meta
            registry[vref] = var_meta

        # 4. Étapes des Userflows
        if uf:
            for cu in uf.cas_usages.values():
                for pf in cu.parcours.values():
                    for etape in pf.etapes:
                        nid = etape.noeud if etape.noeud else f"STEP_{etape.numero}"
                        nid_clean = nid.replace("-", "_")
                        step_meta = {
                            "code": nid,
                            "label": etape.reference,
                            "url": f"Étape #{etape.numero:02d}",
                            "nature": "Étape de Parcours",
                            "is_protected": False,
                            "template": etape.type,
                            "template_label": f"Type {etape.type}",
                            "order": etape.numero,
                            "parent": pf.pf_id,
                            "roles": [cu.uc_id],
                            "inputs": [f"Parcours {pf.pf_id}"],
                            "outputs": [],
                            "contexts": [f"Statut: {pf.statut}"],
                            "features": [etape.reference] if etape.type == "ACT" else [],
                            "signals": [f"Signal: {etape.signal.type if etape.signal else 'None'}"],
                            "screen_sheet": f"screen-sheets/screen-{re.sub(r'[^A-Za-z0-9_]', '_', etape.reference)}.md" if etape.type == "ECR" else None,
                            "description": f"Étape {etape.numero:02d} ({etape.type}) du parcours {pf.pf_id}",
                        }
                        registry[nid_clean] = step_meta
                        registry[nid] = step_meta

        return registry

    # ==========================================================================
    # Helpers : Formatage de cartes HTML Riches (Inspiré du Design System Figma)
    # ==========================================================================

    @classmethod
    def _format_rich_page_node(
        cls,
        page: Page,
        is_primary: bool = False,
        override_label: Optional[str] = None,
        badge_pill: Optional[str] = None,
    ) -> str:
        """Produit une carte à 4 quadrants au format HTML pour un nœud de page."""
        url_nature = "Absolu" if page.url == "/" or page.url.startswith("/") else "Relatif"
        
        classes = ["ia-card"]
        if is_primary:
            classes.append("ia-card--primary")
        if page.is_protected:
            classes.append("ia-card--protected")
        if page.template == "H":
            classes.append("ia-card--hub")
        elif page.template == "E":
            classes.append("ia-card--tech")

        card_class = " ".join(classes)
        title = override_label if override_label else (page.label if page.label else page.code)

        # Badge pilule top-right
        pill_html = ""
        if badge_pill:
            pill_html = f"<span class='ia-pill ia-pill--blue'>{badge_pill}</span>"
        elif page.is_protected:
            pill_html = "<span class='ia-pill ia-pill--orange'>PROT</span>"

        # Badge d'ordre circulaire bottom-left
        order_val = f"{page.ordre:02d}" if page.ordre is not None else "01"

        # Libellé humain du template bottom-right
        tpl_type = TEMPLATE_LABELS.get(page.template, "Page")

        html = (
            f"<div class='{card_class}'>"
            f"<div class='ia-card__top'>"
            f"<div class='ia-card__url-box'>"
            f"<span class='ia-card__url'>{page.url}</span>"
            f"<span class='ia-card__url-nature'>{url_nature}</span>"
            f"</div>"
            f"{pill_html}"
            f"</div>"
            f"<div class='ia-card__body'>"
            f"<div class='ia-card__title'>{title}</div>"
            f"</div>"
            f"<div class='ia-card__bottom'>"
            f"<div class='ia-card__order-circle'>{order_val}</div>"
            f"<div class='ia-card__meta'>"
            f"<span class='ia-card__code'>{page.code}</span>"
            f"<span class='ia-card__type'>{tpl_type}</span>"
            f"</div>"
            f"</div>"
            f"</div>"
        )
        return f'    {page.code}["{html}"]'

    @classmethod
    def _format_rich_module_node(cls, mod: Module) -> str:
        """Produit une carte HTML pour un module transverse."""
        html = (
            f"<div class='ia-card ia-card--module'>"
            f"<div class='ia-card__top'>"
            f"<div class='ia-card__url-box'>"
            f"<span class='ia-card__url'>!{mod.invocation}</span>"
            f"<span class='ia-card__url-nature'>Portée: {mod.portee}</span>"
            f"</div>"
            f"<span class='ia-pill ia-pill--gray'>MODULE</span>"
            f"</div>"
            f"<div class='ia-card__body'>"
            f"<div class='ia-card__title'>{mod.label if mod.label else mod.code}</div>"
            f"</div>"
            f"<div class='ia-card__bottom'>"
            f"<div class='ia-card__order-circle' style='background:#e9d5ff;color:#581c87;'>M</div>"
            f"<div class='ia-card__meta'>"
            f"<span class='ia-card__code'>{mod.code}</span>"
            f"<span class='ia-card__type'>Module</span>"
            f"</div>"
            f"</div>"
            f"</div>"
        )
        return f'        {mod.code}["{html}"]'

    @classmethod
    def _format_rich_userflow_node(cls, etape: Etape) -> Tuple[str, str]:
        """Produit un nœud riche pour un userflow."""
        nid = etape.noeud if etape.noeud else f"STEP_{etape.numero}"
        nid_clean = nid.replace("-", "_")
        rupture_mark = " ⏸" if (etape.rupture and etape.rupture.active) else ""
        ref_text = etape.reference
        order_val = f"{etape.numero:02d}"

        if etape.type == "ECR":
            is_home = ref_text == "HOME" or ref_text.startswith("HOME")
            card_cls = "ia-card ia-card--primary" if is_home else "ia-card"
            html = (
                f"<div class='{card_cls}'>"
                f"<div class='ia-card__top'>"
                f"<div class='ia-card__url-box'>"
                f"<span class='ia-card__url'>{ref_text}{rupture_mark}</span>"
                f"<span class='ia-card__url-nature'>Écran</span>"
                f"</div>"
                f"<span class='ia-pill ia-pill--blue'>ECR</span>"
                f"</div>"
                f"<div class='ia-card__body'>"
                f"<div class='ia-card__title'>{ref_text}</div>"
                f"</div>"
                f"<div class='ia-card__bottom'>"
                f"<div class='ia-card__order-circle'>{order_val}</div>"
                f"<div class='ia-card__meta'>"
                f"<span class='ia-card__code'>{nid}</span>"
                f"<span class='ia-card__type'>Écran</span>"
                f"</div>"
                f"</div>"
                f"</div>"
            )
            return nid_clean, f'    {nid_clean}["{html}"]'

        elif etape.type == "ACT":
            html = (
                f"<div class='ia-card' style='width: 210px; min-height: 95px; border-color: #16a34a;'>"
                f"<div class='ia-card__top'>"
                f"<div class='ia-card__url-box'>"
                f"<span class='ia-card__url'>Action Utilisateur</span>"
                f"</div>"
                f"<span class='ia-pill ia-pill--green'>ACT</span>"
                f"</div>"
                f"<div class='ia-card__body'>"
                f"<div class='ia-card__title' style='font-size: 13px;'>{ref_text}{rupture_mark}</div>"
                f"</div>"
                f"<div class='ia-card__bottom'>"
                f"<div class='ia-card__order-circle' style='background:#dcfce7;color:#166534;'>{order_val}</div>"
                f"<div class='ia-card__meta'>"
                f"<span class='ia-card__code'>{nid}</span>"
                f"<span class='ia-card__type'>Action</span>"
                f"</div>"
                f"</div>"
                f"</div>"
            )
            return nid_clean, f'    {nid_clean}["{html}"]'

        elif etape.type == "ATT":
            html = (
                f"<div class='ia-card' style='width: 210px; min-height: 95px; border-color: #f59e0b;'>"
                f"<div class='ia-card__top'>"
                f"<div class='ia-card__url-box'>"
                f"<span class='ia-card__url'>Attente / Condition</span>"
                f"</div>"
                f"<span class='ia-pill ia-pill--orange'>ATT</span>"
                f"</div>"
                f"<div class='ia-card__body'>"
                f"<div class='ia-card__title' style='font-size: 13px;'>{ref_text}{rupture_mark}</div>"
                f"</div>"
                f"<div class='ia-card__bottom'>"
                f"<div class='ia-card__order-circle' style='background:#fef3c7;color:#92400e;'>{order_val}</div>"
                f"<div class='ia-card__meta'>"
                f"<span class='ia-card__code'>{nid}</span>"
                f"<span class='ia-card__type'>Attente</span>"
                f"</div>"
                f"</div>"
                f"</div>"
            )
            return nid_clean, f'    {nid_clean}["{html}"]'

        elif etape.type == "EXT":
            html = (
                f"<div class='ia-card' style='width: 210px; min-height: 95px; border-color: #6366f1;'>"
                f"<div class='ia-card__top'>"
                f"<div class='ia-card__url-box'>"
                f"<span class='ia-card__url'>Système Externe</span>"
                f"</div>"
                f"<span class='ia-pill ia-pill--blue'>EXT</span>"
                f"</div>"
                f"<div class='ia-card__body'>"
                f"<div class='ia-card__title' style='font-size: 13px;'>{ref_text}{rupture_mark}</div>"
                f"</div>"
                f"<div class='ia-card__bottom'>"
                f"<div class='ia-card__order-circle' style='background:#e0e7ff;color:#3730a3;'>{order_val}</div>"
                f"<div class='ia-card__meta'>"
                f"<span class='ia-card__code'>{nid}</span>"
                f"<span class='ia-card__type'>Externe</span>"
                f"</div>"
                f"</div>"
                f"</div>"
            )
            return nid_clean, f'    {nid_clean}["{html}"]'

        elif etape.type == "CALL":
            html = (
                f"<div class='ia-card' style='width: 210px; min-height: 95px; border: 2px dashed #ec4899;'>"
                f"<div class='ia-card__top'>"
                f"<div class='ia-card__url-box'>"
                f"<span class='ia-card__url'>Appel Sous-Parcours</span>"
                f"</div>"
                f"<span class='ia-pill ia-pill--red'>CALL</span>"
                f"</div>"
                f"<div class='ia-card__body'>"
                f"<div class='ia-card__title' style='font-size: 13px;'>{ref_text}</div>"
                f"</div>"
                f"<div class='ia-card__bottom'>"
                f"<div class='ia-card__order-circle' style='background:#fce7f3;color:#9d174d;'>{order_val}</div>"
                f"<div class='ia-card__meta'>"
                f"<span class='ia-card__code'>{nid}</span>"
                f"<span class='ia-card__type'>Segment</span>"
                f"</div>"
                f"</div>"
                f"</div>"
            )
            return nid_clean, f'    {nid_clean}["{html}"]'

        return nid_clean, f'    {nid_clean}["{nid} {ref_text}"]'

    # ==========================================================================
    # 1. Arborescence : Vue Générale (flowchart TD)
    # ==========================================================================

    @classmethod
    def generate_arborescence_generale(cls, arbo: ArborescenceModel, mode: str = "rich") -> str:
        roles_set: Set[str] = set()
        for p in arbo.pages.values():
            roles_set.update(p.access)
        roles_str = f"[{', '.join(sorted(roles_set))}]" if roles_set else "[ALL]"

        lines: List[str] = [
            "---",
            "title: Sitemap Overview",
            "type: sitemap",
            "id: sitemap-overview",
            f"roles: {roles_str}",
            "tags: [sitemap, overview, hierarchy]",
            "description: General hierarchical page and hub overview",
            "---",
            "%% ==============================================================================",
            "%% Diagramme Arborescence - Niveau Général (Généré automatiquement)",
            "%% ==============================================================================",
        ]

        if mode == "rich":
            lines.append(MERMAID_RICH_INIT_TD)

        lines.extend([
            "flowchart TD",
            "",
            "    %% Racine",
        ])

        home_page = arbo.pages.get("HOME")
        if mode == "rich" and home_page:
            lines.append(cls._format_rich_page_node(home_page, is_primary=True))
        else:
            lines.append('    HOME["HOME /"]')
        lines.append("")

        public_pages: List[str] = []
        protected_pages: List[str] = []

        for code, page in arbo.pages.items():
            if code == "HOME":
                continue
            if mode == "rich":
                node_def = cls._format_rich_page_node(page)
            else:
                prot_label = " (protégée)" if page.is_protected else ""
                node_def = f'    {code}["{code} {page.url}{prot_label}"]'

            if page.is_protected:
                protected_pages.append(node_def)
            else:
                public_pages.append(node_def)

        if public_pages:
            lines.append("    subgraph ZonePublique[\"Zone Publique\"]")
            lines.append("        direction TB")
            lines.extend(public_pages)
            lines.append("    end")
            lines.append("")

        if protected_pages:
            lines.append("    subgraph ZoneProtegee[\"Zone Protégée\"]")
            lines.append("        direction TB")
            lines.extend(protected_pages)
            lines.append("    end")
            lines.append("")

        # Hiérarchie parent -> enfant
        lines.append("    %% Hiérarchie")
        for code, page in arbo.pages.items():
            if page.parent:
                lines.append(f"    {page.parent} --> {code}")

        # Modules transverses
        if arbo.modules:
            lines.append("")
            lines.append("    subgraph ModulesTransverses[\"Modules Transverses (Hors Arbre)\"]")
            lines.append("        direction TB")
            for mcode, mod in arbo.modules.items():
                if mode == "rich":
                    lines.append(cls._format_rich_module_node(mod))
                else:
                    lines.append(f'        {mcode}["{mcode} !{mod.invocation} [Portée: {mod.portee}]"]')
            lines.append("    end")

        if mode == "rich":
            lines.extend([
                "",
                "    linkStyle default stroke:#64748b,stroke-width:2px;",
            ])
        else:
            # Classes CSS standard
            lines.extend([
                "",
                "    classDef homeNode fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,font-weight:bold;",
                "    classDef hubNode fill:#fff3e0,stroke:#f57c00,stroke-width:1.5px,stroke-dasharray: 4 2;",
                "    classDef protectedNode fill:#fbe9e7,stroke:#d84315,stroke-width:1.5px;",
                "    classDef moduleNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px,stroke-dasharray: 3 3;",
                "    classDef techNode fill:#eceff1,stroke:#607d8b,stroke-width:1px;",
                "",
                "    class HOME homeNode;",
            ])

            hubs = [c for c, p in arbo.pages.items() if p.template == "H"]
            if hubs:
                lines.append(f"    class {','.join(hubs)} hubNode;")

            techs = [c for c, p in arbo.pages.items() if p.template == "E"]
            if techs:
                lines.append(f"    class {','.join(techs)} techNode;")

            prots = [c for c, p in arbo.pages.items() if p.is_protected and c not in hubs]
            if prots:
                lines.append(f"    class {','.join(prots)} protectedNode;")

            if arbo.modules:
                lines.append(f"    class {','.join(arbo.modules.keys())} moduleNode;")

        return "\n".join(lines)

    # ==========================================================================
    # 2. Arborescence : Vue Détaillée (flowchart TD)
    # ==========================================================================

    @classmethod
    def generate_arborescence_detaillee(cls, arbo: ArborescenceModel, mode: str = "rich") -> str:
        roles_set: Set[str] = set()
        for p in arbo.pages.values():
            roles_set.update(p.access)
        roles_str = f"[{', '.join(sorted(roles_set))}]" if roles_set else "[ALL]"

        lines: List[str] = [
            "---",
            "title: Sitemap Detailed",
            "type: sitemap",
            "id: sitemap-detailed",
            f"roles: {roles_str}",
            "tags: [sitemap, detailed, components, variants]",
            "description: Detailed sitemap with components, variants, modules, and cross-functional links",
            "---",
            "%% ==============================================================================",
            "%% Diagramme Arborescence - Niveau Détaillé (Généré automatiquement)",
            "%% ==============================================================================",
        ]

        if mode == "rich":
            lines.append(MERMAID_RICH_INIT_TD)

        lines.extend([
            "flowchart TD",
            "",
            "    %% 1. Hiérarchie principale",
        ])

        home_page = arbo.pages.get("HOME")
        if mode == "rich" and home_page:
            lines.append(cls._format_rich_page_node(home_page, is_primary=True))
        else:
            lines.append('    HOME["HOME /"]')

        for code, page in arbo.pages.items():
            if code == "HOME":
                continue
            if mode == "rich":
                lines.append(cls._format_rich_page_node(page))
            else:
                prot = " (protégée)" if page.is_protected else ""
                lines.append(f'    {code}["{code} {page.url}{prot}"]')

        for code, page in arbo.pages.items():
            if page.parent:
                lines.append(f"    {page.parent} --> {code}")

        # 2. Composants rattachés
        if arbo.composants:
            lines.append("")
            lines.append("    %% 2. Composants rattachés (ancres # et popins !)")
            comps_by_page: Dict[str, List[Tuple[str, str, str]]] = {}
            for ref, comp in arbo.composants.items():
                node_id = f"COMP_{comp.page}_{comp.cle.replace('-', '_')}"
                label = f"{comp.marqueur}{comp.cle}" + (f" ({comp.label})" if comp.label else "")
                comps_by_page.setdefault(comp.page, []).append((node_id, label, comp.page))

            for page_code, comps in comps_by_page.items():
                lines.append(f'    subgraph Sub_{page_code}["Composants rattachés à {page_code}"]')
                lines.append("        direction TB")
                for nid, lbl, _ in comps:
                    lines.append(f'        {nid}["{lbl}"]')
                lines.append("    end")
                for nid, _, pcode in comps:
                    lines.append(f"    {pcode} -.-> {nid}")

        # 3. Variantes de pages
        if arbo.variantes:
            lines.append("")
            lines.append("    %% 3. Variantes déclarées")
            vars_by_base: Dict[str, List[Tuple[str, str, str]]] = {}
            for ref, var in arbo.variantes.items():
                base = var.page_base
                clean_id = "VAR_" + re.sub(r"[^A-Za-z0-9_]", "_", ref)
                vars_by_base.setdefault(base, []).append((clean_id, ref, base))

            for base_code, vars_list in vars_by_base.items():
                lines.append(f'    subgraph Sub_Var_{base_code}["Variantes de {base_code}"]')
                lines.append("        direction TB")
                for cid, ref, _ in vars_list:
                    lines.append(f'        {cid}["{ref}"]')
                lines.append("    end")
                lines.append(f"    {base_code} === Sub_Var_{base_code}")

        # 4. Modules transverses
        if arbo.modules:
            lines.append("")
            lines.append("    %% 4. Modules (Hors arbre)")
            lines.append("    subgraph ModulesTransverses[\"Modules (Hors Arbre)\"]")
            lines.append("        direction TB")
            for mcode, mod in arbo.modules.items():
                if mode == "rich":
                    lines.append(cls._format_rich_module_node(mod))
                else:
                    lines.append(f'        {mcode}["{mcode} !{mod.invocation}"]')
            lines.append("    end")

        # 5. Renvois
        if arbo.renvois:
            lines.append("")
            lines.append("    %% 5. Renvois fonctionnels")
            for r in arbo.renvois:
                lines.append(f'    {r.source} -. "{r.fonctionnalite}" .-> {r.cible}')

        if mode == "rich":
            lines.extend([
                "",
                "    linkStyle default stroke:#64748b,stroke-width:2px;",
            ])
        else:
            lines.extend([
                "",
                "    classDef homeNode fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,font-weight:bold;",
                "    classDef protectedNode fill:#fbe9e7,stroke:#d84315,stroke-width:1.5px;",
                "    classDef moduleNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px,stroke-dasharray: 3 3;",
                "    classDef subElemNode fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1px,stroke-dasharray: 2 2;",
                "    classDef variantNode fill:#fff8e1,stroke:#fbc02d,stroke-width:1.5px;",
                "",
                "    class HOME homeNode;",
            ])

        return "\n".join(lines)

    # ==========================================================================
    # 3. Userflows : Vue Repliée (flowchart LR)
    # ==========================================================================

    @classmethod
    def _format_node(cls, etape: Etape, mode: str = "rich") -> Tuple[str, str]:
        """Retourne (identifiant_noeud, syntaxe_mermaid)."""
        if mode == "rich":
            return cls._format_rich_userflow_node(etape)

        nid = etape.noeud if etape.noeud else f"STEP_{etape.numero}"
        nid_clean = nid.replace("-", "_")
        rupture_mark = " ⏸" if (etape.rupture and etape.rupture.active) else ""
        ref_text = etape.reference

        if etape.type == "ECR":
            return nid_clean, f'    {nid_clean}(["{nid} ECR {ref_text}{rupture_mark}"]):::ecrNode'
        elif etape.type == "ACT":
            return nid_clean, f'    {nid_clean}["{nid} ACT {ref_text}{rupture_mark}"]:::actNode'
        elif etape.type == "ATT":
            return nid_clean, f'    {nid_clean}{{{{"{nid} ATT {ref_text}{rupture_mark}"}}}}:::attNode'
        elif etape.type == "EXT":
            return nid_clean, f'    {nid_clean}[/"{nid} EXT {ref_text}{rupture_mark}"/]:::extNode'
        elif etape.type == "CALL":
            return nid_clean, f'    {nid_clean}[["CALL {ref_text}"]]:::callNode'
        return nid_clean, f'    {nid_clean}["{nid} {ref_text}"]'

    @classmethod
    def generate_parcours_replie(cls, parcours: Parcours, mode: str = "rich") -> str:
        lines: List[str] = [
            "---",
            f"title: {parcours.pf_id} - Collapsed",
            "type: userflow",
            f"id: {parcours.pf_id}",
            f"roles: [{parcours.uc}]",
            f"tags: [userflow, collapsed, {parcours.statut}]",
            f"description: {parcours.label or f'Parcours {parcours.pf_id}'}",
            "---",
            "%% ==============================================================================",
            f"%% Userflow - {parcours.pf_id} (Vue Repliée)",
            f"%% Cas d'usage : {parcours.uc} | Statut : {parcours.statut}",
            "%% ==============================================================================",
        ]

        if mode == "rich":
            lines.append(MERMAID_RICH_INIT_LR)

        lines.extend([
            "flowchart LR",
            "",
        ])

        node_ids: List[str] = []
        for etape in parcours.etapes:
            nid, node_str = cls._format_node(etape, mode=mode)
            lines.append(node_str)
            node_ids.append(nid)

        lines.append("")
        if len(node_ids) > 1:
            connector = " --> " if parcours.statut == "nominal" else " -.-> "
            lines.append("    " + connector.join(node_ids))

        if mode == "rich":
            lines.extend([
                "",
                "    linkStyle default stroke:#64748b,stroke-width:2px;",
            ])
        else:
            lines.extend([
                "",
                "    classDef ecrNode fill:#e3f2fd,stroke:#1976d2,stroke-width:1.5px;",
                "    classDef actNode fill:#f1f8e9,stroke:#558b2f,stroke-width:1.5px;",
                "    classDef attNode fill:#fff8e1,stroke:#f57f17,stroke-width:1.5px;",
                "    classDef extNode fill:#ede7f6,stroke:#512da8,stroke-width:1.5px;",
                "    classDef callNode fill:#fce4ec,stroke:#c2185b,stroke-width:2px;",
                "    classDef nonObsNode stroke-dasharray: 4 4;",
            ])

        return "\n".join(lines)

    # ==========================================================================
    # 4. Userflows : Vue Cas d'Usage (flowchart LR)
    # ==========================================================================

    @classmethod
    def generate_cas_usage_view(cls, cu: CasUsage, mode: str = "rich") -> str:
        lines: List[str] = [
            "---",
            f"title: {cu.uc_id} - Overview",
            "type: userflow",
            f"id: {cu.uc_id}",
            f"roles: [{cu.uc_id}]",
            "tags: [userflow, use-case, overview]",
            f"description: {cu.nom or cu.uc_id}",
            "---",
            "%% ==============================================================================",
            f"%% Vue Cas d'Usage : {cu.uc_id} - {cu.nom}",
            "%% ==============================================================================",
        ]

        if mode == "rich":
            lines.append(MERMAID_RICH_INIT_LR)

        lines.extend([
            "flowchart LR",
            "",
        ])

        # Déclarer chaque parcours
        for pf_id, p in cu.parcours.items():
            if p.statut == "segment":
                continue
            lines.append(f"    %% Parcours : {pf_id} ({p.statut})")
            node_ids: List[str] = []
            for etape in p.etapes:
                nid, node_str = cls._format_node(etape, mode=mode)
                lines.append(node_str)
                node_ids.append(nid)

            if len(node_ids) > 1:
                connector = " --> " if p.statut == "nominal" else " -.-> "
                lines.append("    " + connector.join(node_ids))
            lines.append("")

        if mode == "rich":
            lines.extend([
                "    linkStyle default stroke:#64748b,stroke-width:2px;",
            ])
        else:
            lines.extend([
                "    classDef ecrNode fill:#e3f2fd,stroke:#1976d2,stroke-width:1.5px;",
                "    classDef actNode fill:#f1f8e9,stroke:#558b2f,stroke-width:1.5px;",
                "    classDef attNode fill:#fff8e1,stroke:#f57f17,stroke-width:1.5px;",
                "    classDef extNode fill:#ede7f6,stroke:#512da8,stroke-width:1.5px;",
                "    classDef callNode fill:#fce4ec,stroke:#c2185b,stroke-width:2px;",
            ])

        return "\n".join(lines)
