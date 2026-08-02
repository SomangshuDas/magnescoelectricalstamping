#!/usr/bin/env python3
"""
repo_maintenance.py

Walks the directory that this script lives in (recursively) and:

1. Skips the ".git" directory entirely.
2. Skips files whose extension is in BINARY_EXTENSIONS (treated as binary,
   never opened as text).
3. In every remaining text file, finds 4-digit years in the range 1900-2099
   that do NOT match the current year and rewrites them to the current year
   (e.g. a copyright notice "Copyright © 2023" becomes "Copyright © 2026").
4. For any file named "sitemap.xml", additionally replaces the date found
   between <lastmod> and </lastmod> tags with today's date in ISO format
   (YYYY-MM-DD), regardless of what the old date was.

The script only rewrites a file if something actually changed, and prints a
short summary of what was touched.
"""

import os
import re
from datetime import date

# Extensions that must never be opened/rewritten as text.
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".ico", ".svg",
    ".pdf",
    ".zip", ".7z", ".rar", ".tar", ".gz",
    ".exe", ".dll", ".so", ".dylib",
    ".apk", ".bin",
    ".mp3", ".wav", ".ogg",
    ".mp4", ".avi", ".mov", ".mkv",
    ".ttf", ".otf", ".woff", ".woff2",
    ".db",
}

# Directory names that should be skipped entirely (not descended into).
SKIP_DIRS = {".git"}

# Matches any standalone 4-digit year between 1900 and 2099.
YEAR_PATTERN = re.compile(r"\b(19\d{2}|20\d{2})\b")

# Matches the contents of a <lastmod>...</lastmod> tag in sitemap.xml.
LASTMOD_PATTERN = re.compile(r"(<lastmod>)(.*?)(</lastmod>)", re.IGNORECASE)

CURRENT_YEAR = str(date.today().year)
TODAY_ISO = date.today().isoformat()


def is_binary_file(filename: str) -> bool:
    """Return True if the file's extension marks it as binary/non-text."""
    _, ext = os.path.splitext(filename)
    return ext.lower() in BINARY_EXTENSIONS


def update_years(text: str) -> str:
    """Replace any 4-digit year that isn't the current year with the current year."""

    def _replace(match: "re.Match[str]") -> str:
        year = match.group(1)
        return CURRENT_YEAR if year != CURRENT_YEAR else year

    return YEAR_PATTERN.sub(_replace, text)


def update_sitemap_lastmod(text: str) -> str:
    """Replace the date inside every <lastmod> tag with today's date."""

    def _replace(match: "re.Match[str]") -> str:
        opening_tag, _old_date, closing_tag = match.groups()
        return f"{opening_tag}{TODAY_ISO}{closing_tag}"

    return LASTMOD_PATTERN.sub(_replace, text)


def process_file(path: str) -> bool:
    """
    Read a single file, apply the relevant replacements, and write it back
    if anything changed. Returns True if the file was modified.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            original_text = f.read()
    except (UnicodeDecodeError, OSError):
        # Not a readable UTF-8 text file (or some other IO issue); skip it.
        return False

    updated_text = update_years(original_text)

    if os.path.basename(path).lower() == "sitemap.xml":
        updated_text = update_sitemap_lastmod(updated_text)

    if updated_text != original_text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated_text)
        return True

    return False


def main() -> None:
    # Root directory is wherever this script itself resides.
    self_path = os.path.abspath(__file__)
    root_dir = os.path.dirname(self_path)

    changed_files = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune skipped directories in-place so os.walk does not descend into them.
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            if is_binary_file(filename):
                continue

            file_path = os.path.join(dirpath, filename)

            # Never modify this script itself.
            if os.path.abspath(file_path) == self_path:
                continue
            if process_file(file_path):
                changed_files.append(os.path.relpath(file_path, root_dir))

    if changed_files:
        print(f"Updated {len(changed_files)} file(s):")
        for rel_path in changed_files:
            print(f"  - {rel_path}")
    else:
        print("No files needed updating.")


if __name__ == "__main__":
    main()
