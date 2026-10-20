"""Générateur de Fiches d'Écran Déduites (Section 7 de spec-userflows.md).

Croise l'Arborescence et les Userflows pour extraire les entrées, sorties, contextes,
fonctionnalités actionnées, rôles et signaux d'observabilité pour chaque écran.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from .models import (
    ArborescenceModel,
    CasUsage,
    Etape,
    Parcours,
    UserflowsModel,
    parse_context_pairs,
)


@dataclass
class ScreenSheet:
    screen_ref: str
    label: str = ""
    url_or_signal: str = ""
    roles_access: List[str] = field(default_factory=list)
    entrees: List[str] = field(default_factory=list)  # Ex: "PF-DOSSIER-NOM (étape 3) via ND-011"
    sorties: List[str] = field(default_factory=list)  # Ex: "PF-DOSSIER-NOM (étape 5) vers ND-021"
    contextes_observes: Set[str] = field(default_factory=set)  # Ex: "dossier=BROUILLON", "dossier=PRET"
    fonctionnalites_actionnees: Set[str] = field(default_factory=set)  # Ex: "FEAT-VALIDER-INFOS"
    modules_et_composants: Set[str] = field(default_factory=set)
    ruptures_associees: List[str] = field(default_factory=list)
    importance_max: str = "courant"  # critique, courant, occasionnel


class ScreenSheetGenerator:
    def __init__(self, arbo: ArborescenceModel, userflows: UserflowsModel):
        self.arbo = arbo
        self.userflows = userflows

    def extract_screen_sheets(self) -> Dict[str, ScreenSheet]:
        sheets: Dict[str, ScreenSheet] = {}

        # 1. Initialiser avec toutes les pages et variantes connues de l'arborescence
        for code, page in self.arbo.pages.items():
            sheets[code] = ScreenSheet(
                screen_ref=code,
                label=page.label or code,
                url_or_signal=page.url,
                roles_access=list(page.access),
                modules_et_composants=set(page.fonctionnalites),
            )

        for ref, var in self.arbo.variantes.items():
            base = self.arbo.pages.get(var.page_base)
            url = var.url_distincte or (base.url if base else "")
            access = var.access if var.access else (base.access if base else [])
            sheets[ref] = ScreenSheet(
                screen_ref=ref,
                label=f"Variante {ref}",
                url_or_signal=url,
                roles_access=list(access),
            )

        # 2. Scanner les parcours pour peupler dynamiquement les fiches
        for cu in self.userflows.cas_usages.values():
            for pf_id, p in cu.parcours.items():
                current_ctx = parse_context_pairs(p.ctx_in)

                for idx, etape in enumerate(p.etapes):
                    if etape.contexte_produit:
                        current_ctx.update(parse_context_pairs(etape.contexte_produit))

                    if etape.type == "ECR":
                        ref = etape.reference.strip()
                        if ref not in sheets:
                            sheets[ref] = ScreenSheet(screen_ref=ref, label=ref)

                        sheet = sheets[ref]

                        # Importance
                        if cu.importance == "critique":
                            sheet.importance_max = "critique"
                        elif cu.importance == "courant" and sheet.importance_max != "critique":
                            sheet.importance_max = "courant"

                        # Contextes observés à cette étape
                        for k, v in current_ctx.items():
                            sheet.contextes_observes.add(f"{k}={v}")

                        # Entrée (étape précédente)
                        if idx > 0:
                            prev_etape = p.etapes[idx - 1]
                            sheet.entrees.append(
                                f"{pf_id} (étape {idx}) venant de {prev_etape.noeud or prev_etape.reference} [{prev_etape.type}]"
                            )
                        else:
                            sheet.entrees.append(f"{pf_id} (étape 1 - Entrée de parcours)")

                        # Sortie (étape suivante)
                        if idx + 1 < len(p.etapes):
                            next_etape = p.etapes[idx + 1]
                            sheet.sorties.append(
                                f"{pf_id} (étape {idx + 2}) vers {next_etape.noeud or next_etape.reference} [{next_etape.type}]"
                            )

                    elif etape.type == "ACT":
                        # Associer la FEAT à l'écran actif précédent
                        prev_screen = self._find_preceding_screen(p, idx)
                        if prev_screen and prev_screen in sheets:
                            sheets[prev_screen].fonctionnalites_actionnees.add(etape.reference.strip())

        return sheets

    @staticmethod
    def _find_preceding_screen(parcours: Parcours, current_idx: int) -> Optional[str]:
        for i in range(current_idx - 1, -1, -1):
            if parcours.etapes[i].type == "ECR":
                return parcours.etapes[i].reference.strip()
        return None

    @classmethod
    def format_sheet_markdown(cls, sheet: ScreenSheet) -> str:
        ctx_list = sorted(list(sheet.contextes_observes)) or ["Aucun terme de contexte spécifique"]
        feats_list = sorted(list(sheet.fonctionnalites_actionnees)) or ["Aucune action directe recensée"]
        entrees_list = list(dict.fromkeys(sheet.entrees)) or ["Point d'entrée racine"]
        sorties_list = list(dict.fromkeys(sheet.sorties)) or ["Écran terminal"]

        lines = [
            f"# Fiche d'Écran Déduite : {sheet.screen_ref}",
            "",
            f"- **Référence canonique** : `{sheet.screen_ref}`",
            f"- **Label / Titre** : {sheet.label}",
            f"- **URL / Signal** : `{sheet.url_or_signal or 'Événement personnalisable'}`",
            f"- **Rôles habilités** : {', '.join(f'`{r}`' for r in sheet.roles_access) or 'Non restreint'}",
            f"- **Importance maximale** : `{sheet.importance_max}`",
            "",
            "## 1. Contextes d'usage observés",
            "",
        ]
        for c in ctx_list:
            lines.append(f"- `{c}`")

        lines.extend([
            "",
            "## 2. Fonctionnalités et Contenus actionnés",
            "",
        ])
        for f in feats_list:
            lines.append(f"- `{f}`")

        lines.extend([
            "",
            "## 3. Entrées (provenance des flux)",
            "",
        ])
        for e in entrees_list:
            lines.append(f"- {e}")

        lines.extend([
            "",
            "## 4. Sorties (prochaines transitions)",
            "",
        ])
        for s in sorties_list:
            lines.append(f"- {s}")

        return "\n".join(lines)
