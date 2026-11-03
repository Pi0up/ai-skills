"""Module de synchronisation du Studio unifié depuis les releases GitHub distantes."""

import sys
import urllib.error
import urllib.request
from pathlib import Path

# Fix Windows console encoding for UTF-8 emojis
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_REPO = "Pi0up/ai-studio"
WEBAPP_URL = "https://pi0up.github.io/ai-studio/"


def get_release_url(repo: str = DEFAULT_REPO, tag: str = None) -> str:
    if tag:
        return f"https://github.com/{repo}/releases/download/{tag}/index.html"
    return f"https://github.com/{repo}/releases/latest/download/index.html"


def download_studio_bundle(tag: str = None, repo: str = DEFAULT_REPO) -> tuple[str, str]:
    """Télécharge le bundle HTML depuis les releases GitHub ou GitHub Pages."""
    urls_to_try = [get_release_url(repo, tag)]
    if not tag:
        urls_to_try.append(WEBAPP_URL)

    last_error = None
    headers = {"User-Agent": "information-architecture-sync/1.0"}

    for url in urls_to_try:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode("utf-8")
                return content, url
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
            last_error = e
            continue

    raise RuntimeError(f"Échec du téléchargement du Studio depuis {urls_to_try} : {last_error}")


def validate_studio_content(content: str) -> bool:
    """Valide sommairement que le contenu correspond bien au Studio unifié."""
    if not content or len(content) < 1000:
        return False
    lower = content.lower()
    return "<html" in lower and ("information architecture studio" in lower or "render-target" in lower)


def sync_studio(tag: str = None, repo: str = DEFAULT_REPO, verbose: bool = True) -> int:
    """Synchronise le template local unified-preview-template.html avec la version distante."""
    module_dir = Path(__file__).resolve().parent
    root_dir = module_dir.parent

    target_files = [
        module_dir / "templates" / "themes" / "unified-preview-template.html",
        root_dir / "templates" / "themes" / "unified-preview-template.html",
        root_dir / ".agents" / "plugins" / "information-architecture" / "templates" / "themes" / "unified-preview-template.html",
        root_dir / ".agents" / "plugins" / "information-architecture" / "ia_tools" / "templates" / "themes" / "unified-preview-template.html",
        root_dir / "examples" / "preview-showcase" / "preview.html",
    ]

    if verbose:
        print(f"📥 Téléchargement du Studio depuis {repo} (tag: {tag or 'latest'})...", flush=True)

    content, source_url = download_studio_bundle(tag=tag, repo=repo)

    if not validate_studio_content(content):
        raise ValueError(f"Le contenu téléchargé depuis {source_url} ne semble pas être un visualiseur valide.")

    updated_count = 0
    for target in target_files:
        if target.parent.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            updated_count += 1
            if verbose:
                try:
                    rel_path = target.relative_to(root_dir)
                except ValueError:
                    rel_path = target
                print(f"  ✓ Mis à jour : {rel_path}", flush=True)

    if verbose:
        print(f"✅ Synchronisation terminée avec succès depuis {source_url} ({len(content.encode('utf-8'))} octets, {updated_count} fichier(s) mis à jour).", flush=True)

    return 0
