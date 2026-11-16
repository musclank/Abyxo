#!/usr/bin/env python3
"""Check local href/src references in ABYXO's static website."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1] / "website"
ATTRIBUTES = {"href", "src", "poster"}


class ReferenceParser(HTMLParser):
    def __init__(self, source: Path):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.references = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ATTRIBUTES and value:
                self.references.append((tag, key, value.strip()))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def resolve_reference(source: Path, raw: str):
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None

    path = unquote(parsed.path)
    if path.startswith("/"):
        target = ROOT / path.lstrip("/")
    else:
        target = source.parent / path

    try:
        target = target.resolve()
        target.relative_to(ROOT.resolve())
    except (OSError, ValueError):
        return ("outside", target)

    if target.is_dir():
        target = target / "index.html"
    return ("missing", target) if not target.is_file() else None


def main() -> int:
    if not ROOT.is_dir():
        print(f"ERROR: website directory not found: {ROOT}")
        return 2

    html_files = sorted(ROOT.rglob("*.html"))
    if not html_files:
        print("ERROR: no HTML pages found.")
        return 2

    failures = []
    checked = 0

    for source in html_files:
        parser = ReferenceParser(source)
        try:
            parser.feed(source.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as error:
            failures.append(f"{source.relative_to(ROOT)}: cannot read HTML ({error})")
            continue

        for tag, attribute, raw in parser.references:
            result = resolve_reference(source, raw)
            if result is None:
                continue
            kind, target = result
            checked += 1
            relative_target = target.relative_to(ROOT).as_posix() if target.is_relative_to(ROOT) else str(target)
            failures.append(
                f"{source.relative_to(ROOT)}: <{tag} {attribute}=\"{raw}\"> "
                f"-> {kind} target: {relative_target}"
            )

    print(f"Scanned {len(html_files)} HTML pages and checked local references.")
    if failures:
        print(f"Found {len(failures)} issue(s):")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("PASS: all local href/src/poster references point to existing files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
