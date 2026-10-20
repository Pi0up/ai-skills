"""Moteur de validation d'intégrité et d'audit pour l'Architecture de l'Information.

Vérifie :
- Contrôles d'intégrité de l'arborescence (C1 à C14)
- Règles d'audit des userflows (R-01 à R-72)
- Détection des liens brisés suite à des modifications externes
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Set, Tuple

from .models import (
    RE_CODE,
    RE_COMP_REF,
    RE_CTX_PAIR,
    RE_FEAT_REF,
    RE_MODULE_REF,
    RE_NOEUD_ID,
    RE_PAGE_REF,
    RE_PARCOURS_ID,
    RE_UC_ID,
    ArborescenceModel,
    AuditViolation,
    Etape,
    Page,
    Parcours,
    Severity,
    UserflowsModel,
    parse_context_pairs,
)


class IAValidator:
    def __init__(self, arbo: ArborescenceModel, userflows: Optional[UserflowsModel] = None):
        self.arbo = arbo
        self.userflows = userflows or UserflowsModel()
        self.violations: List[AuditViolation] = []

    def validate_all(self, scope_uc: Optional[str] = None) -> List[AuditViolation]:
        self.violations.clear()

        # Contrôles Volet 1 : Arborescence
        self._check_c1_uniqueness()
        self._check_c2_grammar()
        self._check_c3_hierarchy_and_cycles()
        self._check_c4_urls()
        self._check_c5_hubs_and_orders()
        self._check_c6_roles_and_variants()
        self._check_c7_modules_scopes_and_invocations()
        self._check_c10_renvois()
        self._check_c11_module_access_scope()
        self._check_c13_variant_access()
        self._check_c14_comp_uniqueness()
        self._check_c15_template_mutualization()

        # Contrôles Volet 2 : Userflows (si présents)
        if self.userflows.cas_usages:
            self._check_userflows_rules(scope_uc)

        return self.violations

    # ==========================================================================
    # Contrôles Volet 1 : Arborescence (C1 - C14)
    # ==========================================================================

    def _check_c1_uniqueness(self) -> None:
        """C1 : Unicité des codes de pages (par template) et de modules."""
        seen_pages: Set[str] = set()
        for code in self.arbo.pages:
            if code in seen_pages:
                self.violations.append(
                    AuditViolation(
                        rule_id="C1",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"Le code de page '{code}' est dupliqué dans la table 'pages'.",
                        proposition="Assigner un code unique par template (ex: L001, L002).",
                    )
                )
            seen_pages.add(code)

        seen_modules: Set[str] = set()
        for code in self.arbo.modules:
            if code in seen_modules:
                self.violations.append(
                    AuditViolation(
                        rule_id="C1",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"Le code de module '{code}' est dupliqué dans la table 'modules'.",
                        proposition="Assigner un code unique (ex: M001, M002).",
                    )
                )
            seen_modules.add(code)

    def _check_c2_grammar(self) -> None:
        """C2 : Respect de la grammaire normative 5.1."""
        # Pages
        for code, page in self.arbo.pages.items():
            if not RE_PAGE_REF.match(code):
                self.violations.append(
                    AuditViolation(
                        rule_id="C2",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"Le code de page '{code}' ne respecte pas la grammaire normative (HOME ou [HLFCDE][0-9]{{3,}}).",
                        proposition="Corriger le code selon la grammaire (ex: L001, C010).",
                    )
                )
            for feat in page.fonctionnalites:
                if not RE_FEAT_REF.match(feat):
                    self.violations.append(
                        AuditViolation(
                            rule_id="C2",
                            severity=Severity.BLOQUANT,
                            elements=f"{code} -> {feat}",
                            constat=f"L'identifiant de fonctionnalité '{feat}' ne respecte pas la grammaire (^FEAT-[A-Z0-9]+(-[A-Z0-9]+)*$).",
                            proposition="Mettre le nom en majuscules avec tirets (ex: FEAT-VALIDER-INFOS).",
                        )
                    )

        # Variantes
        for ref, var in self.arbo.variantes.items():
            m = RE_PAGE_REF.match(ref)
            if not m or (not m.group("role") and not m.group("variante")):
                self.violations.append(
                    AuditViolation(
                        rule_id="C2",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"La référence de variante '{ref}' doit comporter au moins un rôle (@ROLE) ou un code de variante (:VARIANT).",
                        proposition="Exemple: C001@ADMIN:EDIT ou C001:EDIT.",
                    )
                )

        # Modules
        for code, mod in self.arbo.modules.items():
            if not RE_MODULE_REF.match(code):
                self.violations.append(
                    AuditViolation(
                        rule_id="C2",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"Le code de module '{code}' ne respecte pas la grammaire (M[0-9]{{3,}}).",
                        proposition="Exemple: M001.",
                    )
                )

        # Composants
        for ref, comp in self.arbo.composants.items():
            if comp.marqueur not in ("!", "#"):
                self.violations.append(
                    AuditViolation(
                        rule_id="C2",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"Marqueur '{comp.marqueur}' invalide pour le composant '{ref}' (attendu '!' ou '#').",
                        proposition="Utiliser '!' pour une popin/prompt ou '#' pour une ancre interne.",
                    )
                )

    def _check_c3_hierarchy_and_cycles(self) -> None:
        """C3 : Une seule racine HOME sans parent, parent existant, pas de cycle."""
        home_pages = [p for p in self.arbo.pages.values() if p.code == "HOME"]
        if not home_pages:
            self.violations.append(
                AuditViolation(
                    rule_id="C3",
                    severity=Severity.BLOQUANT,
                    elements="HOME",
                    constat="Aucune page d'accueil 'HOME' définie dans l'arborescence.",
                    proposition="Définir une unique racine HOME avec url '/'.",
                )
            )
        elif len(home_pages) > 1:
            self.violations.append(
                AuditViolation(
                    rule_id="C3",
                    severity=Severity.BLOQUANT,
                    elements="HOME",
                    constat="Plusieurs pages 'HOME' déclarées.",
                    proposition="Conserver une unique racine HOME.",
                )
            )

        for code, page in self.arbo.pages.items():
            if code == "HOME":
                if page.parent:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C3",
                            severity=Severity.BLOQUANT,
                            elements="HOME",
                            constat=f"La racine HOME a un parent déclaré : '{page.parent}'.",
                            proposition="La racine HOME ne doit avoir aucun parent.",
                        )
                    )
                continue

            if not page.parent:
                self.violations.append(
                    AuditViolation(
                        rule_id="C3",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"La page '{code}' n'a pas de parent déclaré.",
                        proposition="Rattacher la page à son parent direct ou à HOME.",
                    )
                )
            elif any(sep in page.parent for sep in (",", ";", "|", " / ")):
                self.violations.append(
                    AuditViolation(
                        rule_id="C3",
                        severity=Severity.BLOQUANT,
                        elements=f"{code} -> parents '{page.parent}'",
                        constat=f"La page '{code}' a plusieurs parents déclarés ('{page.parent}'). Une page ne peut avoir qu'un seul parent dans l'arborescence (multi-parenting interdit).",
                        proposition="Assigner un parent unique exclusif et modéliser les accès secondaires via des renvois (enfants virtuels de navigation).",
                    )
                )
            elif page.parent not in self.arbo.pages:
                self.violations.append(
                    AuditViolation(
                        rule_id="C3",
                        severity=Severity.BLOQUANT,
                        elements=f"{code} -> parent '{page.parent}'",
                        constat=f"Le parent '{page.parent}' de la page '{code}' n'existe pas (lien brisé).",
                        proposition="Vérifier le code du parent ou déclarer la page parente.",
                    )
                )

        # Détection de cycles
        for code in self.arbo.pages:
            visited = set()
            curr = code
            while curr:
                if curr in visited:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C3",
                            severity=Severity.BLOQUANT,
                            elements=code,
                            constat=f"Cycle hiérarchique détecté passant par '{curr}'.",
                            proposition="Corriger les liens parent-enfant pour maintenir une structure arborescente stricte.",
                        )
                    )
                    break
                visited.add(curr)
                p_obj = self.arbo.pages.get(curr)
                curr = p_obj.parent if p_obj else None

    def _check_c4_urls(self) -> None:
        """C4 : URL unique et prolonge l'URL du parent."""
        seen_urls: Dict[str, str] = {}
        for code, page in self.arbo.pages.items():
            url = page.url.strip()
            if not url.startswith("/"):
                self.violations.append(
                    AuditViolation(
                        rule_id="C4",
                        severity=Severity.BLOQUANT,
                        elements=f"{code} ({url})",
                        constat=f"L'URL '{url}' ne commence pas par un slash.",
                        proposition=f"Préfixer par un slash : '/{url}'.",
                    )
                )
            if url in seen_urls:
                self.violations.append(
                    AuditViolation(
                        rule_id="C4",
                        severity=Severity.BLOQUANT,
                        elements=f"{code} et {seen_urls[url]} ({url})",
                        constat=f"L'URL canonique '{url}' est partagée par plusieurs pages.",
                        proposition="Chaque page doit posséder une URL canonique unique.",
                    )
                )
            seen_urls[url] = code

            if code == "HOME":
                if url != "/":
                    self.violations.append(
                        AuditViolation(
                            rule_id="C4",
                            severity=Severity.BLOQUANT,
                            elements="HOME",
                            constat=f"L'URL de HOME doit être '/', trouvée : '{url}'.",
                            proposition="Définir l'URL '/' pour HOME.",
                        )
                    )
                continue

            # Prolongement de l'URL du parent
            if page.parent and page.parent in self.arbo.pages:
                parent_url = self.arbo.pages[page.parent].url
                if parent_url == "/":
                    expected_prefix = "/"
                else:
                    expected_prefix = parent_url.rstrip("/") + "/"
                if not url.startswith(expected_prefix):
                    self.violations.append(
                        AuditViolation(
                            rule_id="C4",
                            severity=Severity.BLOQUANT,
                            elements=f"{code} ({url})",
                            constat=f"L'URL de '{code}' ne prolonge pas celle de son parent '{page.parent}' ({parent_url}).",
                            proposition=f"L'URL devrait commencer par '{expected_prefix}'.",
                        )
                    )

    def _check_c5_hubs_and_orders(self) -> None:
        """C5 : Tout hub (H) a au moins un enfant ; ordre distinct parmi enfants."""
        children_map: Dict[str, List[Page]] = {}
        for page in self.arbo.pages.values():
            if page.parent:
                children_map.setdefault(page.parent, []).append(page)

        for code, page in self.arbo.pages.items():
            if page.template == "H":
                children = children_map.get(code, [])
                if not children:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C5",
                            severity=Severity.BLOQUANT,
                            elements=code,
                            constat=f"Le Hub '{code}' n'a aucun enfant.",
                            proposition="Un Hub est un intercalaire qui doit mener à au moins un enfant.",
                        )
                    )

        for parent_code, children in children_map.items():
            orders_seen: Set[int] = set()
            for ch in children:
                if ch.ordre is not None:
                    if ch.ordre in orders_seen:
                        self.violations.append(
                            AuditViolation(
                                rule_id="C5",
                                severity=Severity.BLOQUANT,
                                elements=f"Enfants de {parent_code}",
                                constat=f"Le rang d'ordre '{ch.ordre}' est dupliqué parmi les enfants de '{parent_code}'.",
                                proposition="Attribuer des rangs distincts (1, 2, 3...).",
                            )
                        )
                    orders_seen.add(ch.ordre)

    def _check_c6_roles_and_variants(self) -> None:
        """C6 : Rôles et codes de variantes existent dans leurs tables."""
        for code, page in self.arbo.pages.items():
            for role in page.access:
                if role not in self.arbo.roles:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C6",
                            severity=Severity.BLOQUANT,
                            elements=f"{code} access: {role}",
                            constat=f"Le rôle '{role}' n'est pas déclaré dans la table 'roles'.",
                            proposition=f"Déclarer le rôle '{role}' dans roles.md.",
                        )
                    )

        for ref, var in self.arbo.variantes.items():
            if not var.condition_spec:
                self.violations.append(
                    AuditViolation(
                        rule_id="C6",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"La variante '{ref}' n'a pas de 'condition_spec' renseignée.",
                        proposition="Préciser la section de la spécification fonctionnelle justifiant cette variante.",
                    )
                )
            base = var.page_base
            if base not in self.arbo.pages:
                self.violations.append(
                    AuditViolation(
                        rule_id="C6",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"La variante '{ref}' référence une page de base inexistante '{base}'.",
                        proposition=f"Créer la page '{base}' ou corriger la référence.",
                    )
                )

    def _check_c7_modules_scopes_and_invocations(self) -> None:
        """C7 : Portée d'un module valide ; invocation unique et distincte des clés de composants."""
        invocations: Dict[str, str] = {}
        comp_keys = {comp.cle for comp in self.arbo.composants.values()}

        for code, mod in self.arbo.modules.items():
            if mod.invocation in invocations:
                self.violations.append(
                    AuditViolation(
                        rule_id="C7",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"L'invocation '!{mod.invocation}' est dupliquée avec le module '{invocations[mod.invocation]}'.",
                        proposition="Utiliser une clé d'invocation unique par module.",
                    )
                )
            invocations[mod.invocation] = code

            if mod.invocation in comp_keys:
                self.violations.append(
                    AuditViolation(
                        rule_id="C7",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"L'invocation de module '!{mod.invocation}' entre en collision avec une clé de composant de page.",
                        proposition="Les clés d'invocation de modules et les composants doivent être disjoints.",
                    )
                )

            # Valider portée
            portee = mod.portee.strip()
            if portee in ("ALL", "PUBLIC", "AUTH"):
                pass
            elif portee.startswith("@"):
                role = portee[1:]
                if role not in self.arbo.roles:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C7",
                            severity=Severity.BLOQUANT,
                            elements=code,
                            constat=f"La portée '@{role}' du module '{code}' référence un rôle inconnu.",
                            proposition=f"Déclarer le rôle '{role}' dans roles.md.",
                        )
                    )
            elif portee.startswith("PAGE:"):
                pages = mod.pages_rattachees
                for p in pages:
                    if p not in self.arbo.pages:
                        self.violations.append(
                            AuditViolation(
                                rule_id="C7",
                                severity=Severity.BLOQUANT,
                                elements=f"{code} -> {p}",
                                constat=f"Le module rattaché '{code}' cite la page hôte inexistante '{p}'.",
                                proposition=f"Vérifier le code de page hôte '{p}'.",
                            )
                        )
            else:
                self.violations.append(
                    AuditViolation(
                        rule_id="C7",
                        severity=Severity.BLOQUANT,
                        elements=code,
                        constat=f"Portée invalide '{portee}' pour le module '{code}'.",
                        proposition="Valeurs admises : ALL, PUBLIC, AUTH, @ROLE, ou PAGE:code1,code2...",
                    )
                )

    def _check_c10_renvois(self) -> None:
        """C10 : Source et cible d'un renvoi existent ; fonctionnalité portée par la source."""
        for renvoi in self.arbo.renvois:
            src = renvoi.source
            tgt = renvoi.cible
            feat = renvoi.fonctionnalite

            # Valider cible
            tgt_exists = (
                tgt in self.arbo.pages
                or tgt in self.arbo.variantes
                or tgt in self.arbo.modules
                or tgt in self.arbo.composants
            )
            if not tgt_exists:
                self.violations.append(
                    AuditViolation(
                        rule_id="C10",
                        severity=Severity.AVERTISSEMENT,
                        elements=f"Renvoi {src} -. {feat} .-> {tgt}",
                        constat=f"La cible '{tgt}' du renvoi n'existe pas.",
                        proposition="Vérifier la déclaration de la cible.",
                    )
                )

            # Valider source et portage de fonctionnalité
            feats_on_src: List[str] = []
            if src in self.arbo.pages:
                feats_on_src = self.arbo.pages[src].fonctionnalites
            elif src in self.arbo.variantes:
                base = self.arbo.variantes[src].page_base
                feats_on_src = self.arbo.pages.get(base, Page(code="", url="", access=[])).fonctionnalites
            elif src in self.arbo.modules:
                feats_on_src = self.arbo.modules[src].fonctionnalites
            elif src in self.arbo.composants:
                feats_on_src = self.arbo.composants[src].fonctionnalites
            else:
                self.violations.append(
                    AuditViolation(
                        rule_id="C10",
                        severity=Severity.AVERTISSEMENT,
                        elements=f"Renvoi {src} -. {feat} .-> {tgt}",
                        constat=f"La source '{src}' du renvoi n'existe pas.",
                        proposition="Déclarer la source dans l'arborescence.",
                    )
                )
                continue

            if feats_on_src and feat not in feats_on_src:
                self.violations.append(
                    AuditViolation(
                        rule_id="C10",
                        severity=Severity.AVERTISSEMENT,
                        elements=f"{src} ({feat})",
                        constat=f"La fonctionnalité '{feat}' déclenchant le renvoi n'est pas listée parmi les fonctionnalités de la source '{src}'.",
                        proposition=f"Ajouter '{feat}' dans la colonne fonctionnalités de '{src}'.",
                    )
                )

    def _check_c11_module_access_scope(self) -> None:
        """C11 : Un module avec access privé ne peut pas avoir une portée incluant une page publique."""
        for code, mod in self.arbo.modules.items():
            is_public_mod = "ANONYMOUS" in mod.access
            if not is_public_mod:
                if mod.portee in ("ALL", "PUBLIC"):
                    self.violations.append(
                        AuditViolation(
                            rule_id="C11",
                            severity=Severity.AVERTISSEMENT,
                            elements=code,
                            constat=f"Le module '{code}' exige une authentification mais a une portée '{mod.portee}' incluant des pages publiques.",
                            proposition="Régler la portée sur 'AUTH' ou ajouter ANONYMOUS aux accès du module.",
                        )
                    )
                elif mod.portee.startswith("PAGE:"):
                    for p in mod.pages_rattachees:
                        page_obj = self.arbo.pages.get(p)
                        if page_obj and "ANONYMOUS" in page_obj.access:
                            self.violations.append(
                                AuditViolation(
                                    rule_id="C11",
                                    severity=Severity.AVERTISSEMENT,
                                    elements=f"{code} -> {p}",
                                    constat=f"Le module protégé '{code}' est rattaché à la page publique '{p}'.",
                                    proposition="Restreindre le rattachement aux pages protégées.",
                                )
                            )

    def _check_c13_variant_access(self) -> None:
        """C13 : L'access d'une variante est un sous-ensemble de celui de sa page ; @ROLE figure dans pages.access."""
        for ref, var in self.arbo.variantes.items():
            base = self.arbo.pages.get(var.page_base)
            if not base:
                continue
            if var.role and var.role not in base.access:
                self.violations.append(
                    AuditViolation(
                        rule_id="C13",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"Le rôle '@{var.role}' de la variante ne figure pas dans 'access' de sa page de base '{base.code}'.",
                        proposition=f"Ajouter '{var.role}' dans l'accès de la page de base '{base.code}'.",
                    )
                )
            if var.access:
                for r in var.access:
                    if r not in base.access:
                        self.violations.append(
                            AuditViolation(
                                rule_id="C13",
                                severity=Severity.BLOQUANT,
                                elements=f"{ref} ({r})",
                                constat=f"Le rôle '{r}' autorisé sur la variante '{ref}' n'a pas accès à la page de base '{base.code}'.",
                                proposition="L'accès d'une variante doit être un sous-ensemble de celui de la page de base.",
                            )
                        )

    def _check_c14_comp_uniqueness(self) -> None:
        """C14 : Clés de composants uniques par page."""
        seen: Dict[Tuple[str, str], str] = {}
        for ref, comp in self.arbo.composants.items():
            key = (comp.page, comp.cle)
            if key in seen:
                self.violations.append(
                    AuditViolation(
                        rule_id="C14",
                        severity=Severity.BLOQUANT,
                        elements=ref,
                        constat=f"La clé '{comp.cle}' est déjà utilisée pour un composant de la page '{comp.page}'.",
                        proposition="Utiliser des clés de composants distinctes par page.",
                    )
                )
            seen[key] = ref

    def _check_c15_template_mutualization(self) -> None:
        """C15 : Mutualisation des gabarits proches et alerte humaine (Avertissement).
        
        Détecte les doublons potentiels d'écrans qui partagent le même template et
        une entité métier similaire sous des parents distincts, sans justification documentée.
        """
        def _extract_entity_tokens(page: Page) -> Set[str]:
            tokens: Set[str] = set()
            clean_url = re.sub(r"\[.*?\]", "", page.url.lower())
            for seg in clean_url.strip("/").split("/"):
                seg = seg.strip()
                if not seg:
                    continue
                seg = re.sub(r"^(my-|user-|mes-|mon-)", "", seg)
                for part in re.split(r"[-_]", seg):
                    if len(part) >= 4 and part not in ("detail", "view", "edit", "list", "show", "page"):
                        stem = part[:-1] if part.endswith("s") and len(part) > 4 else part
                        tokens.add(stem)

            if page.label:
                for word in re.split(r"[-_\s]+", page.label.lower()):
                    word = re.sub(r"^(my|user|mes|mon)", "", word)
                    if len(word) >= 4 and word not in ("detail", "view", "edit", "list", "show", "page"):
                        stem = word[:-1] if word.endswith("s") and len(word) > 4 else word
                        tokens.add(stem)
            return tokens

        pages_list = list(self.arbo.pages.values())
        seen_pairs: Set[Tuple[str, str]] = set()

        for i in range(len(pages_list)):
            for j in range(i + 1, len(pages_list)):
                p1 = pages_list[i]
                p2 = pages_list[j]

                if p1.template not in ("C", "L", "F", "D") or p1.template != p2.template:
                    continue

                if p1.parent == p2.parent:
                    continue

                tokens1 = _extract_entity_tokens(p1)
                tokens2 = _extract_entity_tokens(p2)
                common_tokens = tokens1.intersection(tokens2)

                if common_tokens:
                    pair_key = (min(p1.code, p2.code), max(p1.code, p2.code))
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        entity_desc = ", ".join(sorted(common_tokens))
                        self.violations.append(
                            AuditViolation(
                                rule_id="C15",
                                severity=Severity.AVERTISSEMENT,
                                elements=f"{p1.code} & {p2.code}",
                                constat=(
                                    f"Les pages '{p1.code}' ({p1.url}) et '{p2.code}' ({p2.url}) partagent le même gabarit "
                                    f"'{p1.template}' et l'entité métier '{entity_desc}' sous des parents distincts "
                                    f"('{p1.parent}' et '{p2.parent}')."
                                ),
                                proposition=(
                                    "Vérifier avec un humain si ces écrans peuvent être mutualisés sous une page canonique "
                                    "unique avec des variantes (@ROLE ou :VARIANT) via un renvoi (enfant virtuel), "
                                    "ou documenter la justification fonctionnelle de cet écart."
                                ),
                            )
                        )

    # ==========================================================================
    # Règles Volet 2 : Userflows (R-01 à R-72)
    # ==========================================================================

    def _check_userflows_rules(self, scope_uc: Optional[str] = None) -> None:
        target_ucs = self.userflows.cas_usages
        if scope_uc and scope_uc in target_ucs:
            target_ucs = {scope_uc: target_ucs[scope_uc]}

        all_parcours: Dict[str, Parcours] = {}
        for cu in self.userflows.cas_usages.values():
            all_parcours.update(cu.parcours)

        traversed_pages: Set[str] = set()
        traversed_modules: Set[str] = set()
        traversed_composants: Set[str] = set()
        traversed_feats: Set[str] = set()
        called_parcours: Set[str] = set()

        # Contrôles par cas d'usage
        for uc_id, cu in target_ucs.items():
            # R-10 : Tout parcours rattaché à un cas d'usage
            for pf_id, p in cu.parcours.items():
                if p.uc != uc_id:
                    self.violations.append(
                        AuditViolation(
                            rule_id="R-10",
                            severity=Severity.BLOQUANT,
                            elements=pf_id,
                            constat=f"Le parcours '{pf_id}' déclare uc='{p.uc}' dans le fichier de '{uc_id}'.",
                            proposition=f"Aligner uc='{uc_id}'.",
                        )
                    )

            # R-11 : Tout objectif a exactement un nominal
            objectifs_nom_count: Dict[str, int] = {obj: 0 for obj in cu.objectifs}
            for p in cu.parcours.values():
                if p.statut in ("nominal", "Nominal") and p.objectif:
                    objectifs_nom_count[p.objectif] = objectifs_nom_count.get(p.objectif, 0) + 1

            for obj, count in objectifs_nom_count.items():
                if count == 0:
                    self.violations.append(
                        AuditViolation(
                            rule_id="R-11",
                            severity=Severity.BLOQUANT,
                            elements=f"{uc_id} / {obj}",
                            constat=f"L'objectif '{obj}' n'a aucun parcours nominal déclaré.",
                            proposition=f"Définir exactement un parcours nominal pour '{obj}'.",
                        )
                    )
                elif count > 1:
                    self.violations.append(
                        AuditViolation(
                            rule_id="R-11",
                            severity=Severity.BLOQUANT,
                            elements=f"{uc_id} / {obj}",
                            constat=f"L'objectif '{obj}' a {count} parcours nominaux déclarés (attendu : 1).",
                            proposition="Conserver un seul nominal ; typer les autres en variantes.",
                        )
                    )

            # Parcourir chaque parcours
            for pf_id, p in cu.parcours.items():
                # R-01 & R-24 : Rôles
                for r in p.roles:
                    if r not in self.arbo.roles:
                        self.violations.append(
                            AuditViolation(
                                rule_id="R-01",
                                severity=Severity.BLOQUANT,
                                elements=f"{pf_id} -> rôle {r}",
                                constat=f"Le rôle '{r}' n'existe pas dans le référentiel roles.md.",
                                proposition=f"Ajouter '{r}' dans roles.md.",
                            )
                        )

                # R-26 : Variantes (diverge_de / rejoint)
                if p.statut in ("variante", "variant", "Variante", "Variant"):
                    if not p.diverge_de:
                        self.violations.append(
                            AuditViolation(
                                rule_id="R-26",
                                severity=Severity.BLOQUANT,
                                elements=pf_id,
                                constat=f"La variante '{pf_id}' ne déclare pas de point de bifurcation 'diverge_de'.",
                                proposition="Exemple : diverge_de: PF-DOSSIER-NOM@1.",
                            )
                        )
                    else:
                        div_pf, _, div_step = p.diverge_de.partition("@")
                        if div_pf not in all_parcours:
                            self.violations.append(
                                AuditViolation(
                                    rule_id="R-26",
                                    severity=Severity.BLOQUANT,
                                    elements=f"{pf_id} -> {p.diverge_de}",
                                    constat=f"Le parcours nominal cible '{div_pf}' n'existe pas (lien brisé).",
                                    proposition="Vérifier l'identifiant du parcours de divergence.",
                                )
                            )

                # Vérification des étapes
                current_ctx = parse_context_pairs(p.ctx_in)
                current_screen = ""

                for idx, etape in enumerate(p.etapes):
                    step_num = etape.numero

                    # Accumuler contexte
                    if etape.contexte_produit:
                        step_ctx = parse_context_pairs(etape.contexte_produit)
                        current_ctx.update(step_ctx)

                    # R-30 / R-31 : Ruptures sur ATT et EXT
                    if etape.type in ("ATT", "EXT"):
                        if not etape.rupture or not etape.rupture.active:
                            self.violations.append(
                                AuditViolation(
                                    rule_id="R-30",
                                    severity=Severity.BLOQUANT,
                                    elements=f"{pf_id} étape {step_num} ({etape.type})",
                                    constat=f"L'étape {step_num} de type {etape.type} n'a pas de rupture déclarée (symbole ⏸ attendu).",
                                    proposition="Ajouter une rupture ⏸ sur cette étape asynchrone / externe.",
                                )
                            )

                    # ECR : écran
                    if etape.type == "ECR":
                        ref = etape.reference.strip()
                        current_screen = ref
                        # Extraire page de base
                        m_page = RE_PAGE_REF.match(ref)
                        m_mod = RE_MODULE_REF.match(ref)
                        m_comp = RE_COMP_REF.match(ref)

                        if m_page:
                            code_p = m_page.group("code")
                            if code_p not in self.arbo.pages:
                                self.violations.append(
                                    AuditViolation(
                                        rule_id="R-01",
                                        severity=Severity.BLOQUANT,
                                        elements=f"{pf_id} étape {step_num} ({ref})",
                                        constat=f"L'écran de page '{code_p}' n'existe pas dans l'arborescence (lien brisé).",
                                        proposition=f"Déclarer la page '{code_p}' dans pages.md.",
                                    )
                                )
                            else:
                                traversed_pages.add(code_p)
                                # Vérifier droits d'accès R-24
                                page_access = self.arbo.pages[code_p].access
                                for r in p.roles:
                                    if r != "ANONYMOUS" and r not in page_access and "ANONYMOUS" not in page_access:
                                        self.violations.append(
                                            AuditViolation(
                                                rule_id="R-24",
                                                severity=Severity.BLOQUANT,
                                                elements=f"{pf_id} étape {step_num} ({ref}) pour rôle {r}",
                                                constat=f"Le rôle '{r}' n'a pas accès à la page '{code_p}'.",
                                                proposition=f"Ouvrir l'accès à '{r}' dans pages.md ou restreindre le parcours.",
                                            )
                                        )
                            # Si variante
                            if m_page.group("role") or m_page.group("variante"):
                                if ref not in self.arbo.variantes:
                                    self.violations.append(
                                        AuditViolation(
                                            rule_id="R-01",
                                            severity=Severity.BLOQUANT,
                                            elements=f"{pf_id} étape {step_num} ({ref})",
                                            constat=f"La variante d'écran '{ref}' n'est pas déclarée dans la table 'variantes'.",
                                            proposition=f"Déclarer '{ref}' dans variantes.md.",
                                        )
                                    )
                        elif m_mod:
                            code_m = m_mod.group("code")
                            if code_m not in self.arbo.modules:
                                self.violations.append(
                                    AuditViolation(
                                        rule_id="R-01",
                                        severity=Severity.BLOQUANT,
                                        elements=f"{pf_id} étape {step_num} ({ref})",
                                        constat=f"Le module '{code_m}' n'existe pas dans modules.md.",
                                        proposition=f"Déclarer le module '{code_m}'.",
                                    )
                                )
                            else:
                                traversed_modules.add(code_m)
                        elif m_comp:
                            if ref not in self.arbo.composants:
                                self.violations.append(
                                    AuditViolation(
                                        rule_id="R-01",
                                        severity=Severity.BLOQUANT,
                                        elements=f"{pf_id} étape {step_num} ({ref})",
                                        constat=f"Le composant de page '{ref}' n'existe pas dans composants_page.md.",
                                        proposition=f"Déclarer le composant '{ref}'.",
                                    )
                                )
                            else:
                                traversed_composants.add(ref)
                        else:
                            self.violations.append(
                                AuditViolation(
                                    rule_id="R-04",
                                    severity=Severity.BLOQUANT,
                                    elements=f"{pf_id} étape {step_num} ({ref})",
                                    constat=f"Référence d'écran '{ref}' invalide ou nom humain utilisé à la place d'une référence.",
                                    proposition="Employer un code technique (ex: C010:EDIT, M001, C001!quick-view).",
                                )
                            )

                    # ACT : action sur fonctionnalité
                    elif etape.type == "ACT":
                        feat = etape.reference.strip()
                        if not RE_FEAT_REF.match(feat):
                            self.violations.append(
                                AuditViolation(
                                    rule_id="R-01",
                                    severity=Severity.BLOQUANT,
                                    elements=f"{pf_id} étape {step_num} ({feat})",
                                    constat=f"L'identifiant de fonctionnalité '{feat}' ne respecte pas la grammaire normative.",
                                    proposition="Exemple: FEAT-SOUMETTRE.",
                                )
                            )
                        else:
                            traversed_feats.add(feat)

                        # R-02 : FEAT portée par l'écran courant
                        if current_screen:
                            m_p = RE_PAGE_REF.match(current_screen)
                            if m_p:
                                p_code = m_p.group("code")
                                p_obj = self.arbo.pages.get(p_code)
                                if p_obj and p_obj.fonctionnalites and feat not in p_obj.fonctionnalites:
                                    self.violations.append(
                                        AuditViolation(
                                            rule_id="R-02",
                                            severity=Severity.BLOQUANT,
                                            elements=f"{pf_id} étape {step_num} ({feat} sur {current_screen})",
                                            constat=f"La fonctionnalité '{feat}' n'est pas déclarée sur l'écran porteur '{p_code}'.",
                                            proposition=f"Ajouter '{feat}' dans la liste des fonctionnalités de '{p_code}'.",
                                        )
                                    )

                    # CALL : appel sous-parcours
                    elif etape.type == "CALL":
                        called_id = etape.reference.strip()
                        called_parcours.add(called_id)
                        if called_id not in all_parcours:
                            self.violations.append(
                                AuditViolation(
                                    rule_id="R-21",
                                    severity=Severity.BLOQUANT,
                                    elements=f"{pf_id} étape {step_num} (CALL {called_id})",
                                    constat=f"Le parcours appelé '{called_id}' n'existe pas.",
                                    proposition="Vérifier l'identifiant du sous-parcours appelé.",
                                )
                            )
                        else:
                            called_obj = all_parcours[called_id]
                            # R-21 : Écran d'atterrissage
                            if called_obj.atterrissage:
                                next_idx = idx + 1
                                if next_idx < len(p.etapes):
                                    next_step = p.etapes[next_idx]
                                    if next_step.type != "ECR" or next_step.reference.strip() != called_obj.atterrissage.strip():
                                        self.violations.append(
                                            AuditViolation(
                                                rule_id="R-21",
                                                severity=Severity.BLOQUANT,
                                                elements=f"{pf_id} étape {next_step.numero} après CALL {called_id}",
                                                constat=(
                                                    f"L'étape suivant le CALL doit être un ECR sur l'écran d'atterrissage garanti "
                                                    f"'{called_obj.atterrissage}' (reçu: {next_step.type} {next_step.reference})."
                                                ),
                                                proposition=f"Positionner un ECR sur '{called_obj.atterrissage}' immédiatement après le CALL.",
                                            )
                                        )
                                else:
                                    self.violations.append(
                                        AuditViolation(
                                            rule_id="R-21",
                                            severity=Severity.BLOQUANT,
                                            elements=f"{pf_id} étape {step_num} (CALL {called_id})",
                                            constat=f"L'appel CALL termine le parcours sans écran d'atterrissage '{called_obj.atterrissage}'.",
                                            proposition=f"Ajouter l'étape ECR atterrissant sur '{called_obj.atterrissage}'.",
                                        )
                                    )

        # C9 / R-12 : Couverture des pages par les parcours (hors H et E)
        if not scope_uc:
            for code, page in self.arbo.pages.items():
                if page.template in ("H", "E"):
                    continue
                if code not in traversed_pages:
                    self.violations.append(
                        AuditViolation(
                            rule_id="C9 / R-12",
                            severity=Severity.BLOQUANT,
                            elements=code,
                            constat=f"La page '{code}' n'est traversée par aucun parcours (hors hubs H et pages techniques E).",
                            proposition="Rattacher la page à au moins un parcours utilisateur pour assurer la couverture.",
                        )
                    )

            # R-15 : Segment jamais appelé
            for p in all_parcours.values():
                if p.statut in ("segment", "Segment") and p.pf_id not in called_parcours:
                    self.violations.append(
                        AuditViolation(
                            rule_id="R-15",
                            severity=Severity.AVERTISSEMENT,
                            elements=p.pf_id,
                            constat=f"Le segment '{p.pf_id}' n'est appelé par aucun parcours (CALL).",
                            proposition="Intégrer ce segment dans un parcours ou le supprimer s'il est devenu obsolète.",
                        )
                    )

    def format_report_markdown(self) -> str:
        """Génère le rapport d'audit formaté en tableau Markdown conforme à la section 8."""
        if not self.violations:
            return "✅ **Audit d'Architecture de l'Information** : Aucune violation détectée. Modèle 100% cohérent !"

        lines = [
            "# Rapport d'Audit & Cohérence — Architecture de l'Information",
            "",
            f"**Total des anomalies** : {len(self.violations)} "
            f"({sum(1 for v in self.violations if v.severity == Severity.BLOQUANT)} bloquantes, "
            f"{sum(1 for v in self.violations if v.severity == Severity.AVERTISSEMENT)} avertissements, "
            f"{sum(1 for v in self.violations if v.severity == Severity.SUGGESTION)} suggestions)",
            "",
            "| Règle | Sévérité | Éléments concernés | Constat | Proposition |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]

        for v in self.violations:
            lines.append(
                f"| `{v.rule_id}` | **{v.severity.value}** | `{v.elements}` | {v.constat} | {v.proposition} |"
            )

        return "\n".join(lines)
