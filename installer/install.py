#!/usr/bin/env python3
"""Multi-target installation script for the Information Architecture suite.

Supports:
- Google Antigravity:
    * Complete Plugin mode (.agents/plugins/ or global ~/.gemini/antigravity/plugins/): recommended!
    * Individual Skills mode (.agents/skills/ or global ~/.gemini/antigravity/skills/)
- Claude Code (.claude/skills/ or global ~/.claude/skills/)
- Cursor (.cursor/skills/)
- Gemini CLI (.gemini/skills/ or global ~/.gemini/skills/)
- GitHub Copilot / VSCode (.github/skills/)
- Global Python package installation via pip (`ia-tools` CLI)
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PLUGIN_NAME = "information-architecture"

SKILLS_NAMES = [
    "ia-orchestrator",
    "ia-cadrage",
    "ia-arborescence",
    "ia-userflows",
    "ia-audit",
    "ia-fiches-ecran",
    "ia-tracking",
    "ia-qa-uat",
]

TARGET_CONFIGS = {
    "antigravity": {
        "workspace": Path(".agents") / "skills",
        "global": Path.home() / ".gemini" / "antigravity" / "skills",
        "plugin_workspace": Path(".agents") / "plugins" / PLUGIN_NAME,
        "plugin_global": Path.home() / ".gemini" / "antigravity" / "plugins" / PLUGIN_NAME,
    },
    "claude": {
        "workspace": Path(".claude") / "skills",
        "global": Path.home() / ".claude" / "skills",
    },
    "cursor": {
        "workspace": Path(".cursor") / "skills",
        "global": Path.home() / ".cursor" / "skills",
    },
    "gemini": {
        "workspace": Path(".gemini") / "skills",
        "global": Path.home() / ".gemini" / "skills",
    },
    "copilot": {
        "workspace": Path(".github") / "skills",
        "global": Path.home() / ".copilot" / "skills",
    },
}


def install_pip_package(repo_root: Path, dry_run: bool = False) -> bool:
    """Installs the ia_tools package in editable mode into the current Python environment."""
    print(f"\n📦 Python installation of package '{PLUGIN_NAME}' (pip install -e)...")
    cmd = [sys.executable, "-m", "pip", "install", "-e", str(repo_root)]
    if dry_run:
        print(f"  🔍 [dry-run] Command: {' '.join(cmd)}")
        return True

    try:
        subprocess.run(cmd, check=True)
        print("  ✅ Python package installed successfully! 'ia-tools' command available globally.")
        return True
    except subprocess.CalledProcessError as err:
        print(f"  ⚠️  pip installation failed: {err}")
        return False


def install_plugin(
    repo_root: Path,
    dest_plugin_dir: Path,
    use_symlink: bool = False,
    dry_run: bool = False,
    uninstall: bool = False,
) -> None:
    """Installs the complete suite as an Antigravity Plugin (skills + tools + templates)."""
    print(f"\n🧩 Plugin Destination: {dest_plugin_dir}")

    if uninstall:
        if dest_plugin_dir.exists() or dest_plugin_dir.is_symlink():
            print(f"  🗑️  Removing Plugin: {dest_plugin_dir}")
            if not dry_run:
                if dest_plugin_dir.is_symlink() or dest_plugin_dir.is_file():
                    dest_plugin_dir.unlink()
                else:
                    shutil.rmtree(dest_plugin_dir)
        return

    if dest_plugin_dir.exists() or dest_plugin_dir.is_symlink():
        print(f"  🔄 Replacing existing Plugin: {dest_plugin_dir}")
        if not dry_run:
            if dest_plugin_dir.is_symlink() or dest_plugin_dir.is_file():
                dest_plugin_dir.unlink()
            else:
                shutil.rmtree(dest_plugin_dir)

    if dry_run:
        return

    dest_plugin_dir.parent.mkdir(parents=True, exist_ok=True)

    if use_symlink:
        try:
            os.symlink(repo_root.resolve(), dest_plugin_dir, target_is_directory=True)
            print(f"  🔗 Symbolic link created to repository: {dest_plugin_dir} -> {repo_root}")
            return
        except (OSError, NotImplementedError):
            print("  ⚠️  Symlinks not supported on this OS, falling back to physical copy...")

    # Complete physical bundle copy
    dest_plugin_dir.mkdir(parents=True, exist_ok=True)
    items_to_copy = ["plugin.json", "README.md", "pyproject.toml", "skills", "ia_tools", "templates", "specs"]
    for item in items_to_copy:
        src = repo_root / item
        dst = dest_plugin_dir / item
        if not src.exists():
            continue
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    print(f"  ✨ Complete Plugin deployed successfully in: {dest_plugin_dir}")


def install_skills(
    source_skills_dir: Path,
    dest_dir: Path,
    use_symlink: bool = False,
    dry_run: bool = False,
    uninstall: bool = False,
) -> None:
    """Installs individual skills."""
    print(f"\n📂 Skills Destination: {dest_dir}")

    if uninstall:
        for skill in SKILLS_NAMES:
            target_skill = dest_dir / skill
            if target_skill.exists() or target_skill.is_symlink():
                print(f"  🗑️  Removing: {target_skill}")
                if not dry_run:
                    if target_skill.is_symlink() or target_skill.is_file():
                        target_skill.unlink()
                    else:
                        shutil.rmtree(target_skill)
        return

    if not dry_run:
        dest_dir.mkdir(parents=True, exist_ok=True)

    for skill in SKILLS_NAMES:
        src = source_skills_dir / skill
        dst = dest_dir / skill

        if not src.exists():
            print(f"  ⚠️  Source skill not found: {src}")
            continue

        if dst.exists() or dst.is_symlink():
            print(f"  🔄 Replacing: {skill}")
            if not dry_run:
                if dst.is_symlink() or dst.is_file():
                    dst.unlink()
                else:
                    shutil.rmtree(dst)
        else:
            print(f"  ✨ Installing: {skill}")

        if dry_run:
            continue

        if use_symlink:
            try:
                os.symlink(src.resolve(), dst, target_is_directory=True)
            except (OSError, NotImplementedError):
                print(f"  ⚠️  Symlink not supported, physical copy used for {skill}")
                shutil.copytree(src, dst)
        else:
            shutil.copytree(src, dst)


def copy_tools_to_workspace(repo_root: Path, workspace_root: Path, dry_run: bool = False) -> None:
    """Copies ia_tools and templates to workspace root for standalone usage without pip."""
    print(f"\n🛠️  Copying tools into workspace: {workspace_root}")
    for item in ["ia_tools", "templates"]:
        src = repo_root / item
        dst = workspace_root / item
        if not src.exists() or src.resolve() == dst.resolve():
            continue
        print(f"  📁 Copying {item} -> {dst}")
        if not dry_run:
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="install.py",
        description="Multi-target installer for Information Architecture suite.",
    )
    parser.add_argument(
        "--target",
        choices=["antigravity", "claude", "cursor", "gemini", "copilot", "all"],
        default="antigravity",
        help="Target assistant environment (default: antigravity)",
    )
    parser.add_argument(
        "--workspace",
        default=".",
        help="Target workspace root path (default: current directory)",
    )
    parser.add_argument(
        "--global",
        dest="is_global",
        action="store_true",
        help="Install in user's global configuration instead of workspace",
    )
    parser.add_argument(
        "--as-plugin",
        action="store_true",
        help="For Antigravity: install entire suite as a Plugin (skills + tools + templates)",
    )
    parser.add_argument(
        "--pip",
        action="store_true",
        help="Automatically install editable Python package (pip install -e .) for global CLI access",
    )
    parser.add_argument(
        "--copy-tools",
        action="store_true",
        help="Also copy ia_tools and templates directories into target workspace",
    )
    parser.add_argument(
        "--symlink",
        action="store_true",
        help="Create symbolic links instead of copying files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate installation without writing to disk",
    )
    parser.add_argument(
        "--uninstall",
        action="store_true",
        help="Uninstall skills/plugin from selected target",
    )

    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    source_skills_dir = repo_root / "skills"

    if not source_skills_dir.exists():
        print(f"❌ Source skills directory not found: {source_skills_dir}")
        return 1

    targets_to_run = (
        list(TARGET_CONFIGS.keys()) if args.target == "all" else [args.target]
    )
    mode_str = "Global" if args.is_global else f"Workspace ({args.workspace})"
    action_str = "Uninstallation" if args.uninstall else "Installation"

    print(f"🚀 {action_str} of Information Architecture [{', '.join(targets_to_run)}] in {mode_str} mode")
    if args.dry_run:
        print("🔍 (Simulation mode active --dry-run)")

    workspace_root = Path(args.workspace).resolve()

    # 1. Pip install option
    if args.pip and not args.uninstall:
        install_pip_package(repo_root=repo_root, dry_run=args.dry_run)

    # 2. Installation targets
    for target in targets_to_run:
        config = TARGET_CONFIGS[target]

        # Special case: Antigravity Plugin mode
        if target == "antigravity" and args.as_plugin:
            dest_plugin = (
                config["plugin_global"] if args.is_global else workspace_root / config["plugin_workspace"]
            )
            install_plugin(
                repo_root=repo_root,
                dest_plugin_dir=dest_plugin,
                use_symlink=args.symlink,
                dry_run=args.dry_run,
                uninstall=args.uninstall,
            )
            continue

        # Standard skills mode
        if args.is_global:
            dest_dir = config["global"]
        else:
            dest_dir = workspace_root / config["workspace"]

        install_skills(
            source_skills_dir=source_skills_dir,
            dest_dir=dest_dir,
            use_symlink=args.symlink,
            dry_run=args.dry_run,
            uninstall=args.uninstall,
        )

        # Copy tools to workspace if requested
        if args.copy_tools and not args.is_global and not args.uninstall:
            copy_tools_to_workspace(
                repo_root=repo_root,
                workspace_root=workspace_root,
                dry_run=args.dry_run,
            )

    print("\n✅ Operation completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
