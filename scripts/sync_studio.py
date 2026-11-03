#!/usr/bin/env python3
"""
Synchronisation du visualiseur unifié (preview.html) depuis le dépôt externe ai-studio :
- Releases GitHub : https://github.com/Pi0up/ai-studio/releases
- Application web : https://pi0up.github.io/ai-studio/
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ia_tools.studio_sync import DEFAULT_REPO, sync_studio

# Fix Windows console encoding for UTF-8 emojis
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description="Synchroniser le Studio depuis https://github.com/Pi0up/ai-studio")
    parser.add_argument("--tag", default=None, help="Tag de la release GitHub (ex: v1.0.0, défaut: latest)")
    parser.add_argument("--repo", default=DEFAULT_REPO, help=f"Dépôt GitHub source (défaut: {DEFAULT_REPO})")
    args = parser.parse_args()

    try:
        return sync_studio(tag=args.tag, repo=args.repo, verbose=True)
    except Exception as e:
        print(f"❌ Erreur : {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
