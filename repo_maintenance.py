#!/usr/bin/env python3
"""
repo_maintenance.py

Walks the directory that this script lives in (recursively) and performs
two narrowly-scoped maintenance tasks across the repository:

1. Copyright year refresh
   Finds occurrences of "Copyright © YYYY" (where YYYY is 1900-2099) and,
   if YYYY is not the current year, rewrites it to the current year.
   Example: "Copyright © 2023" becomes "Copyright © 2026".
   Bare years elsewhere in a file (version numbers, dates in prose, etc.)
   are left untouched, since only text immediately following the
   "Copyright ©" marker is matched.

2. Sitemap lastmod refresh
   For any file literally named "sitemap.xml", replaces the date inside
   every <lastmod>...</lastmod> tag with today's date in ISO format
   (YYYY-MM-DD), regardless of what the previous date was.

Along the way, the script:
  - Never descends into ".git".
  - Never opens files with a known binary extension as text.
  - Never rewrites itself.
  - Only writes a file back to disk if its contents actually changed.
  - Prints a short summary of every file that was modified.

Usage:
    python3 repo_maintenance.py

No arguments are required; the script always operates on the directory
it is located in.
"""

import os
import re
from datetime import date

# File extensions that must never be opened or rewritten as text, since
# doing so would corrupt them. Anything matching one of these is skipped
# outright before any file I/O is attempted.
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
# ".git" is excluded because it contains internal Git metadata and packed
# object files that should never be treated as ordinary text.
SKIP_DIRS = {".git"}

# Matches "Copyright ©" followed by a 4-digit year in the range 1900-2099.
# Capture group 1 is the "Copyright ©" prefix (preserved as-is, including
# its original whitespace), and capture group 2 is the year itself, which
# is the only part that gets replaced.
YEAR_PATTERN = re.compile(r"(Copyright\s*©\s*)(19\d{2}|20\d{2})\b", re.IGNORECASE)

# Matches the full contents of a <lastmod>...</lastmod> tag, non-greedily,
# so that only the date between the tags is captured and replaced.
LASTMOD_PATTERN = re.compile(r"(<lastmod>)(.*?)(</lastmod>)", re.IGNORECASE)

# Computed once at import time so every file in the walk is stamped with
# the exact same year/date, even if the script runs across a day boundary.
CURRENT_YEAR = str(date.today().year)
TODAY_ISO = date.today().isoformat()


def is_binary_file(filename: str) -> bool:
    """
    Determine whether a file should be treated as binary based on its
    extension alone (no content sniffing).

    Args:
        filename: The base name of the file, e.g. "logo.png".

    Returns:
        True if the extension is in BINARY_EXTENSIONS, False otherwise.
    """
    _, ext = os.path.splitext(filename)
    return ext.lower() in BINARY_EXTENSIONS


def update_years(text: str) -> str:
    """
    Refresh the year in any "Copyright © YYYY" notice found in the text.

    Only years that immediately follow a "Copyright ©" marker are touched;
    all other 4-digit numbers in the text (version strings, unrelated
    dates, etc.) are left exactly as they are.

    Args:
        text: The full contents of a file.

    Returns:
        The text with any outdated copyright years replaced by the
        current year. If no matches are found, or all matches already
        show the current year, the text is returned unchanged.
    """

    def _replace(match: "re.Match[str]") -> str:
        prefix, year = match.groups()
        # Only rewrite if the year actually differs, to avoid needless
        # diffs when the notice is already up to date.
        if year != CURRENT_YEAR:
            return f"{prefix}{CURRENT_YEAR}"
        return match.group(0)

    return YEAR_PATTERN.sub(_replace, text)


def update_sitemap_lastmod(text: str) -> str:
    """
    Replace the date inside every <lastmod> tag with today's date.

    This is unconditional: unlike the copyright year logic, every
    <lastmod> tag found is stamped with today's date regardless of what
    it previously contained.

    Args:
        text: The full contents of a sitemap.xml file.

    Returns:
        The text with all <lastmod> dates set to today's ISO date.
    """

    def _replace(match: "re.Match[str]") -> str:
        opening_tag, _old_date, closing_tag = match.groups()
        return f"{opening_tag}{TODAY_ISO}{closing_tag}"

    return LASTMOD_PATTERN.sub(_replace, text)


def process_file(path: str) -> bool:
    """
    Apply the relevant text replacements to a single file and write the
    result back to disk if anything changed.

    Args:
        path: Absolute or relative path to the file to process.

    Returns:
        True if the file's contents were modified and rewritten to disk,
        False if the file was skipped (unreadable as UTF-8 text) or left
        unchanged because no replacements applied.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            original_text = f.read()
    except (UnicodeDecodeError, OSError):
        # Covers files that aren't valid UTF-8 text (e.g. an unexpected
        # binary file without a recognized extension) as well as general
        # I/O failures such as permission errors.
        return False

    updated_text = update_years(original_text)

    # Sitemap files get an additional, unconditional lastmod refresh.
    if os.path.basename(path).lower() == "sitemap.xml":
        updated_text = update_sitemap_lastmod(updated_text)

    if updated_text != original_text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated_text)
        return True

    return False


def main() -> None:
    """
    Entry point: walk the script's own directory, apply maintenance
    updates to every eligible file, and print a summary of what changed.
    """
    # The root of the walk is always wherever this script itself lives,
    # so the script can be dropped into any repository and just work.
    self_path = os.path.abspath(__file__)
    root_dir = os.path.dirname(self_path)

    changed_files = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune skipped directories in-place. Modifying dirnames directly
        # (rather than filtering a copy) is what tells os.walk not to
        # descend into them at all.
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            if is_binary_file(filename):
                continue

            file_path = os.path.join(dirpath, filename)

            # Guard against the script rewriting its own source file.
            if os.path.abspath(file_path) == self_path:
                continue

            if process_file(file_path):
                changed_files.append(os.path.relpath(file_path, root_dir))

    # Report what happened. Silence would make it hard to tell whether
    # the script actually did anything.
    if changed_files:
        print(f"Updated {len(changed_files)} file(s):")
        for rel_path in changed_files:
            print(f"  - {rel_path}")
    else:
        print("No files needed updating.")


if __name__ == "__main__":
    main()
