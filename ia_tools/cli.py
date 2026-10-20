"""Unified CLI entry point for Information Architecture tools.

Available commands:
- init: initialize arborescence and starter templates
- validate: verify compliance (C1-C15, R-01-R-72, broken links)
- sync-registry: generate/update registry from tables
- generate-mermaid: render Mermaid diagrams
- extract-screens: deduce screen sheets
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .markdown_parser import ArborescenceParser, UserflowsParser
from .mermaid_gen import MermaidGenerator
from .screen_sheet_gen import ScreenSheetGenerator
from .sync_registry import RegistrySynchronizer
from .validator import IAValidator


def find_templates_dir() -> Path:
    """Locates the templates directory either within package or parent repo."""
    pkg_tpl = Path(__file__).resolve().parent / "templates"
    if pkg_tpl.exists() and (pkg_tpl / "arborescence").exists():
        return pkg_tpl
    repo_tpl = Path(__file__).resolve().parent.parent / "templates"
    if repo_tpl.exists() and (repo_tpl / "arborescence").exists():
        return repo_tpl
    raise FileNotFoundError("Templates directory not found in package or repository.")


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="ia_tools",
        description="Tool suite and validation engine for Information Architecture.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 0. init
    init_parser = subparsers.add_parser("init", help="Scaffold initial normative templates in a project.")
    init_parser.add_argument("--dir", default=".", help="Target directory (default: .)")
    init_parser.add_argument("--mode", choices=["minimal", "full"], default="minimal", help="Initialization mode (default: minimal)")
    init_parser.add_argument("--force", action="store_true", help="Overwrite existing files")

    # 1. validate
    val_parser = subparsers.add_parser("validate", help="Audit and validate integrity and consistency.")
    val_parser.add_argument("--dir", default=".", help="Root workspace directory (default: .)")
    val_parser.add_argument("--scope", default=None, help="Specific use case scope (e.g. UC-DOSSIER)")
    val_parser.add_argument("--output", default=None, help="Markdown report output file path")

    # 2. sync-registry
    sync_parser = subparsers.add_parser("sync-registry", help="Synchronize registry from arborescence tables.")
    sync_parser.add_argument("--dir", default=".", help="Root directory")
    sync_parser.add_argument("--out", default="registre", help="Target registry directory (default: registre)")

    # 3. generate-mermaid
    m_parser = subparsers.add_parser("generate-mermaid", help="Render Mermaid diagrams.")
    m_parser.add_argument("--dir", default=".", help="Root directory")
    m_parser.add_argument("--type", choices=["arborescence", "userflows", "all"], default="all")
    m_parser.add_argument("--out", default="generated", help="Output directory (default: generated)")
    m_parser.add_argument(
        "--style",
        choices=["standard", "rich"],
        default="standard",
        help="Mermaid visual style (standard: pure logic, rich: Figma cards)",
    )
    m_parser.add_argument(
        "--preview",
        action="store_true",
        help="Also generate unified HTML preview file (preview.html)",
    )

    # 4. extract-screens
    scr_parser = subparsers.add_parser("extract-screens", help="Deduce cross-cutting screen sheets.")
    scr_parser.add_argument("--dir", default=".", help="Root directory")
    scr_parser.add_argument("--out", default="generated/screen-sheets", help="Output directory (default: generated/screen-sheets)")

    args = parser.parse_args()
    root_dir = Path(args.dir).resolve()

    if args.command == "init":
        templates_dir = find_templates_dir()
        root_dir.mkdir(parents=True, exist_ok=True)
        created_files = []

        # 1. Arborescence tables (pages, variantes, modules, composants_page, renvois, roles)
        tables_src = templates_dir / "arborescence" / "tables"
        if tables_src.exists():
            for tpl in tables_src.glob("*.md"):
                dest_file = root_dir / tpl.name
                if not dest_file.exists() or args.force:
                    shutil.copy2(tpl, dest_file)
                    created_files.append(dest_file)

        # 2. Registry (glossaire, noeuds)
        reg_src = templates_dir / "userflows" / "registre"
        if reg_src.exists():
            reg_dst = root_dir / "registre"
            reg_dst.mkdir(parents=True, exist_ok=True)
            for tpl in reg_src.glob("*.md"):
                dest_file = reg_dst / tpl.name
                if not dest_file.exists() or args.force:
                    shutil.copy2(tpl, dest_file)
                    created_files.append(dest_file)

        # 3. Use case template
        uc_src = templates_dir / "userflows" / "uc" / "UC-template.md"
        if uc_src.exists():
            uc_dst_dir = root_dir / "uc"
            uc_dst_dir.mkdir(parents=True, exist_ok=True)
            uc_dst = uc_dst_dir / "UC-template.md"
            if not uc_dst.exists() or args.force:
                shutil.copy2(uc_src, uc_dst)
                created_files.append(uc_dst)

        # 4. Full mode: derived and audit templates
        if args.mode == "full":
            derived_src = templates_dir / "derived"
            if derived_src.exists():
                derived_dst = root_dir / "templates" / "derived"
                derived_dst.mkdir(parents=True, exist_ok=True)
                for tpl in derived_src.glob("*.md"):
                    dest_file = derived_dst / tpl.name
                    if not dest_file.exists() or args.force:
                        shutil.copy2(tpl, dest_file)
                        created_files.append(dest_file)

            audit_src = templates_dir / "audit"
            if audit_src.exists():
                audit_dst = root_dir / "templates" / "audit"
                audit_dst.mkdir(parents=True, exist_ok=True)
                for tpl in audit_src.glob("*.md"):
                    dest_file = audit_dst / tpl.name
                    if not dest_file.exists() or args.force:
                        shutil.copy2(tpl, dest_file)
                        created_files.append(dest_file)

        print(f"✨ Project successfully initialized in {root_dir} ({len(created_files)} file(s) deployed).")
        return 0

    elif args.command == "validate":
        arbo = ArborescenceParser.parse_directory(root_dir)
        # Also check common subfolders if not found at root
        if not arbo.pages and (root_dir / "arborescence").exists():
            arbo = ArborescenceParser.parse_directory(root_dir / "arborescence")

        uf = UserflowsParser.parse_directory(root_dir)
        validator = IAValidator(arbo=arbo, userflows=uf)
        violations = validator.validate_all(scope_uc=args.scope)
        report = validator.format_report_markdown()

        if args.output:
            Path(args.output).write_text(report, encoding="utf-8")
            print(f"Report written to {args.output}")
        else:
            print(report)

        has_blocking = any(v.severity.value in ("Bloquant", "Blocking") for v in violations)
        return 1 if has_blocking else 0

    elif args.command == "sync-registry":
        arbo = ArborescenceParser.parse_directory(root_dir)
        if not arbo.pages and (root_dir / "arborescence").exists():
            arbo = ArborescenceParser.parse_directory(root_dir / "arborescence")
        out_dir = Path(args.out).resolve()
        sync = RegistrySynchronizer(arbo, out_dir)
        sync.sync_all()
        print(f"✅ Registry successfully synchronized in {out_dir}")
        return 0

    elif args.command == "generate-mermaid":
        arbo = ArborescenceParser.parse_directory(root_dir)
        uf = UserflowsParser.parse_directory(root_dir)
        out_dir = Path(args.out).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        style = getattr(args, "style", "standard")
        preview = getattr(args, "preview", False)

        diagrams_data = []

        if args.type in ("arborescence", "all"):
            gen_mmd = MermaidGenerator.generate_arborescence_generale(arbo, mode=style)
            (out_dir / "sitemap-overview.mmd").write_text(gen_mmd, encoding="utf-8")
            meta, _ = MermaidGenerator.parse_frontmatter(gen_mmd)
            diagrams_data.append({
                "id": meta.get("id", "sitemap-overview"),
                "filename": "sitemap-overview.mmd",
                "title": meta.get("title", "Sitemap Overview"),
                "type": meta.get("type", "sitemap"),
                "roles": meta.get("roles", ["ALL"]),
                "tags": meta.get("tags", ["sitemap", "overview"]),
                "description": meta.get("description", "General hierarchical page overview"),
                "source": gen_mmd,
            })

            det_mmd = MermaidGenerator.generate_arborescence_detaillee(arbo, mode=style)
            (out_dir / "sitemap-detailed.mmd").write_text(det_mmd, encoding="utf-8")
            meta_det, _ = MermaidGenerator.parse_frontmatter(det_mmd)
            diagrams_data.append({
                "id": meta_det.get("id", "sitemap-detailed"),
                "filename": "sitemap-detailed.mmd",
                "title": meta_det.get("title", "Sitemap Detailed"),
                "type": meta_det.get("type", "sitemap"),
                "roles": meta_det.get("roles", ["ALL"]),
                "tags": meta_det.get("tags", ["sitemap", "detailed"]),
                "description": meta_det.get("description", "Detailed sitemap with variants and modules"),
                "source": det_mmd,
            })

        if args.type in ("userflows", "all"):
            for cu in uf.cas_usages.values():
                cu_mmd = MermaidGenerator.generate_cas_usage_view(cu, mode=style)
                fname_cu = f"{cu.uc_id}-overview.mmd"
                (out_dir / fname_cu).write_text(cu_mmd, encoding="utf-8")
                meta_cu, _ = MermaidGenerator.parse_frontmatter(cu_mmd)
                diagrams_data.append({
                    "id": meta_cu.get("id", cu.uc_id),
                    "filename": fname_cu,
                    "title": meta_cu.get("title", f"{cu.uc_id} - Overview"),
                    "type": meta_cu.get("type", "userflow"),
                    "roles": meta_cu.get("roles", [cu.uc_id]),
                    "tags": meta_cu.get("tags", ["userflow", "use-case"]),
                    "description": meta_cu.get("description", cu.nom or cu.uc_id),
                    "source": cu_mmd,
                })

                for pf in cu.parcours.values():
                    p_mmd = MermaidGenerator.generate_parcours_replie(pf, mode=style)
                    fname_pf = f"{pf.pf_id}-collapsed.mmd"
                    (out_dir / fname_pf).write_text(p_mmd, encoding="utf-8")
                    meta_pf, _ = MermaidGenerator.parse_frontmatter(p_mmd)
                    diagrams_data.append({
                        "id": meta_pf.get("id", pf.pf_id),
                        "filename": fname_pf,
                        "title": meta_pf.get("title", f"{pf.pf_id} - Collapsed"),
                        "type": meta_pf.get("type", "userflow"),
                        "roles": meta_pf.get("roles", [cu.uc_id]),
                        "tags": meta_pf.get("tags", ["userflow", "collapsed"]),
                        "description": meta_pf.get("description", pf.objectif or pf.pf_id),
                        "source": p_mmd,
                    })

        if preview:
            tpl_dir = find_templates_dir()
            unified_tpl_file = tpl_dir / "themes" / "unified-preview-template.html"

            # Déduction des fiches écran pour alimenter les métadonnées de nœuds
            scr_gen = ScreenSheetGenerator(arbo, uf)
            sheets = scr_gen.extract_screen_sheets()
            sheets_payload = {}
            for ref, sheet in sheets.items():
                sheets_payload[ref] = {
                    "ref": ref,
                    "content": scr_gen.format_sheet_markdown(sheet),
                }

            nodes_registry = MermaidGenerator.build_node_metadata_registry(arbo, uf, sheets)

            payload = {
                "diagrams": diagrams_data,
                "nodes": nodes_registry,
                "screen_sheets": sheets_payload,
            }
            payload_json = json.dumps(payload, ensure_ascii=False, indent=2)

            if unified_tpl_file.exists():
                html = unified_tpl_file.read_text(encoding="utf-8")
                html = html.replace("{{EMBEDDED_JSON_DATA}}", payload_json)
                (out_dir / "preview.html").write_text(html, encoding="utf-8")

        print(f"✅ Mermaid diagrams generated in {out_dir} (style: {style}{', unified preview: preview.html' if preview else ''})")
        return 0

    elif args.command == "extract-screens":
        arbo = ArborescenceParser.parse_directory(root_dir)
        uf = UserflowsParser.parse_directory(root_dir)
        out_dir = Path(args.out).resolve()
        out_dir.mkdir(parents=True, exist_ok=True)

        gen = ScreenSheetGenerator(arbo, uf)
        sheets = gen.extract_screen_sheets()
        for ref, sheet in sheets.items():
            safe_name = ref.replace(":", "_").replace("@", "_").replace("!", "_").replace("#", "_")
            md_content = gen.format_sheet_markdown(sheet)
            (out_dir / f"screen-{safe_name}.md").write_text(md_content, encoding="utf-8")

        print(f"✅ {len(sheets)} screen sheets generated in {out_dir}")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
