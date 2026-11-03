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

            # Single unified preview file (Solution 1: pure static scanner)
            preview_file = out_dir / "preview.html"
            self.assertTrue(preview_file.exists())
            preview_html = preview_file.read_text(encoding="utf-8")
            self.assertIn("Information Architecture Studio", preview_html)
            self.assertIn("btn-open-folder", preview_html)
            self.assertIn("scanDirectoryHandle", preview_html)

            # Node metadata json file
            meta_json_file = out_dir / "metadata.json"
            self.assertTrue(meta_json_file.exists())
            meta_json = meta_json_file.read_text(encoding="utf-8")
            self.assertIn('"HOME"', meta_json)
            self.assertIn('"L001"', meta_json)
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

    def test_studio_info(self):
        import io
        import sys
        old_argv = sys.argv
        captured_out = io.StringIO()
        try:
            sys.argv = ["ia_tools", "studio", "info"]
            old_stdout = sys.stdout
            sys.stdout = captured_out
            exit_code = main()
            self.assertEqual(exit_code, 0)
            output = captured_out.getvalue()
            self.assertIn("https://github.com/Pi0up/ai-studio", output)
            self.assertIn("https://pi0up.github.io/ai-studio/", output)
        finally:
            sys.stdout = old_stdout
            sys.argv = old_argv

    def test_studio_sync_validation(self):
        from ia_tools.studio_sync import validate_studio_content
        self.assertFalse(validate_studio_content(""))
        self.assertFalse(validate_studio_content("short content"))
        self.assertFalse(validate_studio_content("<html>" + "a" * 1500 + "</html>"))
        self.assertTrue(validate_studio_content("<!doctype html><html><body>Information Architecture Studio render-target" + "x" * 1000 + "</body></html>"))


if __name__ == "__main__":
    unittest.main()
