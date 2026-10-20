"""Tests unitaires pour l'interface CLI et la commande init d'Architecture de l'Information."""

import shutil
import tempfile
import unittest
from pathlib import Path

from ia_tools.cli import find_templates_dir, main


class TestCLI(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="test_cli_ia_"))

    def tearDown(self):
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

    def test_find_templates_dir(self):
        tpl_dir = find_templates_dir()
        self.assertTrue(tpl_dir.exists())
        self.assertTrue((tpl_dir / "arborescence").exists())

    def test_init_minimal(self):
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["ia_tools", "init", "--dir", str(self.temp_dir), "--mode", "minimal"]
            exit_code = main()
            self.assertEqual(exit_code, 0)
            self.assertTrue((self.temp_dir / "pages.md").exists())
            self.assertTrue((self.temp_dir / "modules.md").exists())
            self.assertTrue((self.temp_dir / "registre" / "glossaire.md").exists())
            self.assertTrue((self.temp_dir / "uc" / "UC-template.md").exists())
            # Mode minimal ne doit pas déployer templates/derived
            self.assertFalse((self.temp_dir / "templates" / "derived").exists())
        finally:
            sys.argv = old_argv

    def test_init_full(self):
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["ia_tools", "init", "--dir", str(self.temp_dir), "--mode", "full"]
            exit_code = main()
            self.assertEqual(exit_code, 0)
            self.assertTrue((self.temp_dir / "pages.md").exists())
            self.assertTrue((self.temp_dir / "templates" / "derived" / "plan-tracking-template.md").exists())
            self.assertTrue((self.temp_dir / "templates" / "audit" / "rapport-audit-template.md").exists())
        finally:
            sys.argv = old_argv


if __name__ == "__main__":
    unittest.main()
