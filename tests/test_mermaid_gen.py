"""Tests unitaires pour les générateurs Mermaid d'Architecture de l'Information."""

import unittest
from pathlib import Path

from ia_tools.markdown_parser import ArborescenceParser, UserflowsParser
from ia_tools.mermaid_gen import MermaidGenerator


class TestMermaidGenerator(unittest.TestCase):
    def setUp(self):
        self.fixtures_dir = Path(__file__).parent / "fixtures" / "valid_project"
        self.arbo = ArborescenceParser.parse_directory(self.fixtures_dir)
        self.uf = UserflowsParser.parse_directory(self.fixtures_dir)

    def test_generate_arborescence_generale_standard(self):
        mmd = MermaidGenerator.generate_arborescence_generale(self.arbo, mode="standard")
        self.assertIn("flowchart TD", mmd)
        self.assertIn('HOME["HOME /"]', mmd)
        self.assertIn("subgraph ZonePublique", mmd)
        self.assertIn("subgraph ZoneProtegee", mmd)
        self.assertIn("HOME --> L001", mmd)
        self.assertIn("M001", mmd)

    def test_generate_arborescence_generale_rich(self):
        mmd = MermaidGenerator.generate_arborescence_generale(self.arbo, mode="rich")
        self.assertIn("flowchart TD", mmd)
        # Nœud racine HOME avec classe primaire
        self.assertIn("ia-card ia-card--primary", mmd)
        self.assertIn("ia-card__url", mmd)
        self.assertIn("Absolu", mmd)
        self.assertIn("Homepage", mmd)
        # Nœud enfant avec badge d'ordre et métadonnées
        self.assertIn("ia-card__order-circle", mmd)
        self.assertIn("subgraph ZonePublique", mmd)
        self.assertIn("subgraph ZoneProtegee", mmd)
        self.assertIn("HOME --> L001", mmd)
        self.assertIn("linkStyle default stroke:#64748b", mmd)

    def test_generate_arborescence_detaillee_standard(self):
        mmd = MermaidGenerator.generate_arborescence_detaillee(self.arbo, mode="standard")
        self.assertIn("flowchart TD", mmd)
        self.assertIn("Sub_C001", mmd)
        self.assertIn("#reviews", mmd)
        self.assertIn("!quick-view", mmd)
        self.assertIn("C001@BUYER", mmd)
        self.assertIn('C001@BUYER -. "FEAT-COMMANDER" .-> F002', mmd)

    def test_generate_arborescence_detaillee_rich(self):
        mmd = MermaidGenerator.generate_arborescence_detaillee(self.arbo, mode="rich")
        self.assertIn("flowchart TD", mmd)
        self.assertIn("ia-card ia-card--primary", mmd)
        self.assertIn("Sub_C001", mmd)
        self.assertIn("linkStyle default stroke:#64748b", mmd)

    def test_generate_parcours_replie_standard(self):
        cu = self.uf.cas_usages["UC-DOSSIER"]
        pf = cu.parcours["PF-DOSSIER-NOM"]
        mmd = MermaidGenerator.generate_parcours_replie(pf, mode="standard")
        self.assertIn("flowchart LR", mmd)
        self.assertIn('ND_010(["ND-010 ECR C010:EDIT"])', mmd)
        self.assertIn('ND_011["ND-011 ACT FEAT-VALIDER-INFOS"]', mmd)
        self.assertIn('[["CALL PF-DOSSIER-PJ-SEG"]]:::callNode', mmd)
        self.assertIn('ND_020(["ND-020 ECR C010"])', mmd)
        self.assertIn('ND_021["ND-021 ACT FEAT-SOUMETTRE"]', mmd)

    def test_generate_parcours_replie_rich(self):
        cu = self.uf.cas_usages["UC-DOSSIER"]
        pf = cu.parcours["PF-DOSSIER-NOM"]
        mmd = MermaidGenerator.generate_parcours_replie(pf, mode="rich")
        self.assertIn("flowchart LR", mmd)
        self.assertIn("ia-card", mmd)
        self.assertIn("ia-pill--blue", mmd)
        self.assertIn("ia-pill--green", mmd)
        self.assertIn("linkStyle default stroke:#64748b", mmd)

    def test_frontmatter_and_metadata_registry(self):
        # 1. Frontmatter parsing
        mmd = MermaidGenerator.generate_arborescence_generale(self.arbo, mode="standard")
        self.assertTrue(mmd.startswith("---"))
        meta, clean_src = MermaidGenerator.parse_frontmatter(mmd)
        self.assertEqual(meta.get("type"), "sitemap")
        self.assertEqual(meta.get("id"), "sitemap-overview")
        self.assertIn("flowchart TD", clean_src)

        # 2. Node Metadata registry
        registry = MermaidGenerator.build_node_metadata_registry(self.arbo, self.uf)
        self.assertIn("HOME", registry)
        self.assertIn("L001", registry)
        self.assertIn("M001", registry)
        self.assertEqual(registry["HOME"]["url"], "/")
        self.assertEqual(registry["HOME"]["template"], "HOME")
        self.assertEqual(registry["L001"]["nature"], "Absolu")
        self.assertEqual(registry["M001"]["nature"], "Module")


if __name__ == "__main__":
    unittest.main()
