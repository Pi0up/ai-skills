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
            self.assertTrue((self.temp_dir / "templates" / "derived" / "tracking-plan-template.md").exists())
            self.assertTrue((self.temp_dir / "templates" / "audit" / "audit-report-template.md").exists())
        finally:
            sys.argv = old_argv

    def test_generate_mermaid_and_unified_preview(self):
        import sys
        old_argv = sys.argv
        fixtures_dir = Path(__file__).parent / "fixtures" / "valid_project"
        out_dir = self.temp_dir / "generated"
        try:
            sys.argv = [
                "ia_tools",
                "generate-mermaid",
                "--dir",
                str(fixtures_dir),
                "--out",
                str(out_dir),
                "--type",
                "all",
                "--preview",
            ]
            exit_code = main()
            self.assertEqual(exit_code, 0)

            # English naming for generated diagrams
            self.assertTrue((out_dir / "sitemap-overview.mmd").exists())
            self.assertTrue((out_dir / "sitemap-detailed.mmd").exists())
            self.assertTrue((out_dir / "UC-DOSSIER-overview.mmd").exists())
            self.assertTrue((out_dir / "PF-DOSSIER-NOM-collapsed.mmd").exists())

            # Frontmatter check
            overview_content = (out_dir / "sitemap-overview.mmd").read_text(encoding="utf-8")
            self.assertTrue(overview_content.startswith("---"))
            self.assertIn("title: Sitemap Overview", overview_content)
            self.assertIn("type: sitemap", overview_content)

            # Single unified preview file
            preview_file = out_dir / "preview.html"
            self.assertTrue(preview_file.exists())
            preview_html = preview_file.read_text(encoding="utf-8")
            self.assertIn("Information Architecture Studio", preview_html)
            self.assertIn("sitemap-overview", preview_html)
            self.assertIn("sitemap-detailed", preview_html)
            self.assertIn("UC-DOSSIER", preview_html)
            self.assertIn("PF-DOSSIER-NOM", preview_html)
            self.assertIn('"HOME"', preview_html)
            self.assertIn('"L001"', preview_html)
        finally:
            sys.argv = old_argv

    def test_extract_screens_english_naming(self):
        import sys
        old_argv = sys.argv
        fixtures_dir = Path(__file__).parent / "fixtures" / "valid_project"
        out_dir = self.temp_dir / "generated" / "screen-sheets"
        try:
            sys.argv = [
                "ia_tools",
                "extract-screens",
                "--dir",
                str(fixtures_dir),
                "--out",
                str(out_dir),
            ]
            exit_code = main()
            self.assertEqual(exit_code, 0)

            # Verify screen sheets are created with screen-[CODE].md pattern
            generated_screens = list(out_dir.glob("screen-*.md"))
            self.assertTrue(len(generated_screens) > 0)
            self.assertTrue(any("screen-C001" in s.name or "screen-L001" in s.name for s in generated_screens))
        finally:
            sys.argv = old_argv


if __name__ == "__main__":
    unittest.main()
