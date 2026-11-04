"""Modèles de données et grammaires normatives pour l'Architecture de l'Information.

Conforme à :
- spec-arborescence.md (v0.3)
- spec-userflows.md (v2.1)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple


# ==============================================================================
# Expressions Régulières Normatives
# ==============================================================================

# Grammaire Arborescence (Section 5.1)
RE_PAGE_REF = re.compile(
    r"^(?:(?P<humain>[a-z0-9]+(?:-[a-z0-9]+)*)-)?"
    r"(?P<code>HOME|[HLFCDE][0-9]{3,})"
    r"(?:@(?P<role>[A-Z][A-Z0-9_]*))?"
    r"(?::(?P<variante>[A-Z][A-Z0-9_]*))?$"
)

RE_MODULE_REF = re.compile(
    r"^(?:(?P<humain>[a-z0-9]+(?:-[a-z0-9]+)*)-)?"
    r"(?P<code>M[0-9]{3,})$"
)

RE_COMP_REF = re.compile(
    r"^(?P<page>HOME|[HLFCDE][0-9]{3,})"
    r"(?P<marqueur>[!#])"
    r"(?P<cle>[a-z0-9]+(?:-[a-z0-9]+)*)$"
)

RE_FEAT_REF = re.compile(r"^FEAT-[A-Z0-9]+(?:-[A-Z0-9]+)*$")
RE_CODE = re.compile(r"^[A-Z][A-Z0-9_]*$")
RE_CLE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
RE_NOEUD_ID = re.compile(r"^ND-[0-9]{3,}$")
RE_PARCOURS_ID = re.compile(r"^PF-[A-Z0-9_]+-(?:NOM|VAR-[A-Z0-9_]+|[A-Z0-9_]+-SEG)$")
RE_UC_ID = re.compile(r"^UC-[A-Z0-9_]+$")

# Syntaxe de contexte (Section 2.3) : cle=VALEUR (séparateur ' ; ')
RE_CTX_PAIR = re.compile(r"^[a-z][a-z0-9_]*=[A-Z][A-Z0-9_]*$")


def parse_context_pairs(ctx_str: str) -> Dict[str, str]:
    """Parse une chaîne de contexte 'k1=V1 ; k2=V2' en dictionnaire."""
    result: Dict[str, str] = {}
    if not ctx_str or not ctx_str.strip():
        return result
    for chunk in ctx_str.split(";"):
        item = chunk.strip()
        if not item:
            continue
        if "=" in item:
            k, v = item.split("=", 1)
            result[k.strip()] = v.strip()
        else:
            result[item] = ""
    return result


def format_context_pairs(pairs: Dict[str, str]) -> str:
    """Reforme une chaîne de contexte normalisée."""
    return " ; ".join(f"{k}={v}" for k, v in pairs.items())


# ==============================================================================
# Énumérations
# ==============================================================================

class Severity(Enum):
    BLOQUANT = "Bloquant"
    AVERTISSEMENT = "Avertissement"
    SUGGESTION = "Suggestion"


class TemplateCode(Enum):
    HOME = "HOME"
    H = "H"
    L = "L"
    F = "F"
    C = "C"
    D = "D"
    E = "E"
    M = "M"
    EXT = "EXT"


class NodeType(Enum):
    ECR = "ECR"
    ACT = "ACT"
    ATT = "ATT"
    EXT = "EXT"
    CALL = "CALL"


class ParcoursStatut(Enum):
    NOMINAL = "nominal"
    VARIANTE = "variante"
    SEGMENT = "segment"


# ==============================================================================
# Modèles Volet 1 : Arborescence
# ==============================================================================

@dataclass
class Role:
    code: str
    label: str = ""


@dataclass
class Page:
    code: str
    url: str
    access: List[str]
    parent: Optional[str] = None
    ordre: Optional[int] = None
    label: str = ""
    fonctionnalites: List[str] = field(default_factory=list)

    @property
    def template(self) -> str:
        if self.code == "HOME":
            return "HOME"
        return self.code[0] if self.code else ""

    @property
    def is_protected(self) -> bool:
        return "ANONYMOUS" not in self.access


@dataclass
class Variante:
    ref: str
    condition_spec: str
    access: List[str] = field(default_factory=list)
    url_distincte: Optional[str] = None

    @property
    def page_base(self) -> str:
        m = RE_PAGE_REF.match(self.ref)
        if m:
            return m.group("code")
        return self.ref.split("@")[0].split(":")[0]

    @property
    def role(self) -> Optional[str]:
        m = RE_PAGE_REF.match(self.ref)
        return m.group("role") if m else None

    @property
    def variant_code(self) -> Optional[str]:
        m = RE_PAGE_REF.match(self.ref)
        return m.group("variante") if m else None


@dataclass
class Module:
    code: str
    invocation: str
    access: List[str]
    portee: str  # ALL, PUBLIC, AUTH, @ROLE, ou PAGE:code,code
    label: str = ""
    fonctionnalites: List[str] = field(default_factory=list)

    @property
    def is_rattache(self) -> bool:
        return self.portee.startswith("PAGE:")

    @property
    def pages_rattachees(self) -> List[str]:
        if self.is_rattache:
            return [p.strip() for p in self.portee[5:].split(",") if p.strip()]
        return []


@dataclass
class ComposantPage:
    page: str
    marqueur: str  # '!' ou '#'
    cle: str
    label: str = ""
    fonctionnalites: List[str] = field(default_factory=list)

    @property
    def ref(self) -> str:
        return f"{self.page}{self.marqueur}{self.cle}"


@dataclass
class Renvoi:
    source: str
    fonctionnalite: str
    cible: str
    type: str = "page"  # page | module | composant


@dataclass
class ServiceExterne:
    code: str
    url: str
    access: List[str]
    label: str = ""
    fournisseur: str = ""
    fonctionnalites: List[str] = field(default_factory=list)


@dataclass
class ArborescenceModel:
    roles: Dict[str, Role] = field(default_factory=dict)
    pages: Dict[str, Page] = field(default_factory=dict)
    variantes: Dict[str, Variante] = field(default_factory=dict)
    modules: Dict[str, Module] = field(default_factory=dict)
    services_externes: Dict[str, ServiceExterne] = field(default_factory=dict)
    composants: Dict[str, ComposantPage] = field(default_factory=dict)
    renvois: List[Renvoi] = field(default_factory=list)


# ==============================================================================
# Modèles Volet 2 : Userflows
# ==============================================================================

@dataclass
class Rupture:
    active: bool = False
    memoire: str = ""
    niveau: str = "persistant"  # live | persistant | externe
    point_reprise: str = ""     # Référence ND-xxx ou ECR
    delai: str = ""             # minutes | heures | jours


@dataclass
class Etape:
    numero: int
    type: str  # ECR, ACT, ATT, EXT, CALL
    reference: str  # page-ref / module-ref / comp-ref / FEAT-ref / pf_id / libellé
    noeud: str = ""  # ND-xxx (optionnel pour CALL)
    evenement: str = ""
    contexte_produit: str = ""
    rupture: Optional[Rupture] = None
    non_observable: bool = False
    signal: str = ""


@dataclass
class Parcours:
    pf_id: str
    uc: str
    statut: str  # nominal | variante | segment
    roles: List[str]
    etapes: List[Etape] = field(default_factory=list)
    objectif: str = ""
    ctx_in: str = ""
    ctx_out: str = ""
    funnel: bool = False
    confiance: str = "ROUGE"  # ROUGE | JAUNE | VERT
    validation: Optional[str] = None  # QA | UAT | QA+UAT
    poids_indicatif: Optional[str] = None
    # Champs pour les variantes :
    diverge_de: Optional[str] = None  # Ex: PF-DOSSIER-NOM@1
    rejoint: Optional[str] = None     # Ex: PF-DOSSIER-NOM@4
    # Champs pour les segments :
    atterrissage: Optional[str] = None  # Ex: C010


@dataclass
class CasUsage:
    uc_id: str
    nom: str
    nature: str = "metier"  # metier | usage | confort
    importance: str = "courant"  # critique | courant | occasionnel
    objectifs: List[str] = field(default_factory=list)
    roles: List[str] = field(default_factory=list)
    suivi_valeur: bool = False
    part_valeur_indicative: Optional[str] = None
    parcours: Dict[str, Parcours] = field(default_factory=dict)


@dataclass
class UserflowsModel:
    cas_usages: Dict[str, CasUsage] = field(default_factory=dict)
    noeuds_registre: Dict[str, Etape] = field(default_factory=dict)
    glossaire: Dict[str, List[str]] = field(default_factory=dict)  # cle -> liste valeurs permises


# ==============================================================================
# Rapport d'Audit & Diagnostic
# ==============================================================================

@dataclass
class AuditViolation:
    rule_id: str
    severity: Severity
    elements: str
    constat: str
    proposition: str
