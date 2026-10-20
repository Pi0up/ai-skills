"""Tests unitaires pour les parsers Markdown et YAML d'Architecture de l'Information."""

import unittest
from pathlib import Path

from ia_tools.markdown_parser import (
    ArborescenceParser,
    UserflowsParser,
    parse_markdown_table,
    parse_yaml_simple,
)


class TestMarkdownParser(unittest.TestCase):
    def setUp(self):
        self.fixtures_dir = Path(__file__).parent / "fixtures" / "valid_project"

    def test_parse_markdown_table_simple(self):
        md = """
| code | label | parent |
| :--- | :--- | :--- |
| HOME | Accueil | — |
| L001 | Recherche | HOME |
"""
        rows = parse_markdown_table(md)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["code"], "HOME")
        self.assertEqual(rows[1]["parent"], "HOME")

    def test_parse_yaml_simple(self):
        yaml_text = """
uc_id: UC-TEST
nom: Cas de test
roles: [ADMIN, BUYER]
suivi_valeur: oui
# un commentaire
ctx_in: origine=ACCUEIL ; dossier=BROUILLON
"""
        data = parse_yaml_simple(yaml_text)
        self.assertEqual(data["uc_id"], "UC-TEST")
        self.assertEqual(data["roles"], ["ADMIN", "BUYER"])
        self.assertTrue(data["suivi_valeur"])
        self.assertIn("origine=ACCUEIL", data["ctx_in"])

    def test_parse_arborescence_directory(self):
        arbo = ArborescenceParser.parse_directory(self.fixtures_dir)
        self.assertIn("HOME", arbo.pages)
        self.assertIn("C001", arbo.pages)
        self.assertIn("M001", arbo.modules)
        self.assertIn("ANONYMOUS", arbo.roles)
        self.assertIn("C001@BUYER", arbo.variantes)
        self.assertEqual(len(arbo.renvois), 2)

        # Vérifier parent et ordre
        self.assertEqual(arbo.pages["L001"].parent, "HOME")
        self.assertEqual(arbo.pages["L001"].ordre, 1)

    def test_parse_userflows_directory(self):
        uf = UserflowsParser.parse_directory(self.fixtures_dir)
        self.assertIn("UC-DOSSIER", uf.cas_usages)
        self.assertIn("UC-CATALOGUE", uf.cas_usages)

        cu_dossier = uf.cas_usages["UC-DOSSIER"]
        self.assertIn("PF-DOSSIER-NOM", cu_dossier.parcours)
        self.assertIn("PF-DOSSIER-PJ-SEG", cu_dossier.parcours)
        self.assertIn("PF-DOSSIER-VAR-ASSIST", cu_dossier.parcours)

        # Vérification étapes
        nominal = cu_dossier.parcours["PF-DOSSIER-NOM"]
        self.assertEqual(len(nominal.etapes), 5)
        self.assertEqual(nominal.etapes[0].type, "ECR")
        self.assertEqual(nominal.etapes[0].reference, "C010:EDIT")
        self.assertEqual(nominal.etapes[2].type, "CALL")
        self.assertEqual(nominal.etapes[2].reference, "PF-DOSSIER-PJ-SEG")


if __name__ == "__main__":
    unittest.main()
