#!/usr/bin/env python3
"""
Linux Commands Cheat Sheet – CLI Tool
======================================
Loads commands from commands.json and lets the user search by keyword
or browse by category interactively.

Usage
-----
  python cli_tool.py                    # interactive menu
  python cli_tool.py search <keyword>  # search directly
  python cli_tool.py category          # list categories then pick one
  python cli_tool.py list              # dump all commands
"""

import json
import os
import sys
import textwrap

# ── Resolve paths ─────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
COMMANDS_FILE = os.path.join(_SCRIPT_DIR, "commands.json")

# ── ANSI colour helpers ───────────────────────────────────────────────────────
_ANSI_SUPPORTED = sys.stdout.isatty() and os.name != "nt"


def _c(code: str, text: str) -> str:
    """Wrap *text* in an ANSI escape sequence if the terminal supports it."""
    if not _ANSI_SUPPORTED:
        return text
    return f"\033[{code}m{text}\033[0m"


def green(t):  return _c("32", t)
def yellow(t): return _c("33", t)
def cyan(t):   return _c("36", t)
def bold(t):   return _c("1",  t)
def dim(t):    return _c("2",  t)


# ── Data loading ──────────────────────────────────────────────────────────────

def load_commands(path: str = COMMANDS_FILE) -> list:
    """Return the list of category dicts from commands.json."""
    if not os.path.isfile(path):
        sys.exit(
            f"Error: '{path}' not found.\n"
            "Run this script from the project root or specify a path."
        )
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    categories = data.get("categories")
    if not isinstance(categories, list):
        sys.exit("Error: commands.json has an unexpected format.")
    return categories


# ── Rendering ─────────────────────────────────────────────────────────────────

_COL_WIDTHS = {"command": 18, "syntax": 32, "description": 45, "example": 40}


def _divider(char: str = "─") -> str:
    total = sum(_COL_WIDTHS.values()) + len(_COL_WIDTHS) * 3 + 1
    return dim(char * total)


def _header_row() -> str:
    cols = ["command", "syntax", "description", "example"]
    cells = [bold(c.upper().ljust(_COL_WIDTHS[c])) for c in cols]
    return "│ " + " │ ".join(cells) + " │"


def _data_row(cmd: dict) -> str:
    def fit(key, colour_fn=None):
        val = cmd.get(key, "")
        w = _COL_WIDTHS[key]
        val = val if len(val) <= w else val[: w - 1] + "…"
        val = val.ljust(w)
        return colour_fn(val) if colour_fn else val

    cols = [
        fit("command", green),
        fit("syntax", yellow),
        fit("description"),
        fit("example", cyan),
    ]
    return "│ " + " │ ".join(cols) + " │"


def print_commands(commands: list, category_name: str = "") -> None:
    if not commands:
        print(dim("  (no results)"))
        return
    if category_name:
        print(f"\n{bold(category_name)}")
    print(_divider())
    print(_header_row())
    print(_divider())
    for cmd in commands:
        print(_data_row(cmd))
    print(_divider())
    print(dim(f"  {len(commands)} command(s)"))


# ── Search ────────────────────────────────────────────────────────────────────

def search_commands(categories: list, keyword: str) -> None:
    """Print all commands whose fields contain *keyword* (case-insensitive)."""
    kw = keyword.lower()
    found = []  # type: list
    for cat in categories:
        for cmd in cat.get("commands", []):
            haystack = " ".join(
                [
                    cmd.get("command", ""),
                    cmd.get("syntax", ""),
                    cmd.get("description", ""),
                    cmd.get("example", ""),
                    cat.get("name", ""),
                ]
            ).lower()
            if kw in haystack:
                found.append({**cmd, "_category": cat["name"]})

    if not found:
        print(f'\n{yellow("No results")} for "{keyword}". Try a different keyword.')
        return

    print(f'\n{bold(f"Search results for: {keyword}")} ({len(found)} match(es))\n')
    # Group by category for readability
    from itertools import groupby

    found.sort(key=lambda c: c["_category"])
    for cat_name, group in groupby(found, key=lambda c: c["_category"]):
        cmds = [{k: v for k, v in c.items() if k != "_category"} for c in group]
        print_commands(cmds, cat_name)


# ── Browse by category ────────────────────────────────────────────────────────

def list_categories(categories: list) -> None:
    print(f"\n{bold('Available categories:')}\n")
    for i, cat in enumerate(categories, 1):
        count = len(cat.get("commands", []))
        print(f"  {green(str(i).rjust(2))}.  {cat['name']}  {dim(f'({count} commands)')}")


def browse_category(categories: list) -> None:
    list_categories(categories)
    print()
    try:
        choice = input("Enter category number (or press Enter to cancel): ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        return
    if not choice:
        return
    try:
        idx = int(choice) - 1
        if not 0 <= idx < len(categories):
            raise ValueError
    except ValueError:
        print(yellow("Invalid selection."))
        return
    cat = categories[idx]
    print_commands(cat.get("commands", []), cat["name"])


# ── List all ──────────────────────────────────────────────────────────────────

def list_all(categories: list) -> None:
    for cat in categories:
        print_commands(cat.get("commands", []), cat["name"])


# ── Interactive menu ──────────────────────────────────────────────────────────

_MENU = """
{title}

  {s}  Search commands by keyword
  {c}  Browse by category
  {l}  List all commands
  {q}  Quit
"""


def interactive_menu(categories: list) -> None:
    title = bold("🐧  Linux Commands Cheat Sheet  CLI")
    while True:
        print(
            _MENU.format(
                title=title,
                s=green("[s]"),
                c=green("[c]"),
                l=green("[l]"),
                q=green("[q]"),
            )
        )
        try:
            choice = input("Choice: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if choice in ("s", "search"):
            try:
                kw = input("  Enter keyword: ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                continue
            if kw:
                search_commands(categories, kw)
        elif choice in ("c", "category"):
            browse_category(categories)
        elif choice in ("l", "list"):
            list_all(categories)
        elif choice in ("q", "quit", "exit"):
            print("Goodbye!")
            break
        else:
            print(yellow("  Unknown option. Please choose s, c, l, or q."))


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    categories = load_commands()

    if len(sys.argv) < 2:
        interactive_menu(categories)
        return

    sub = sys.argv[1].lower()

    if sub == "search":
        if len(sys.argv) < 3:
            sys.exit("Usage: python cli_tool.py search <keyword>")
        search_commands(categories, " ".join(sys.argv[2:]))

    elif sub == "category":
        browse_category(categories)

    elif sub == "list":
        list_all(categories)

    elif sub in ("help", "--help", "-h"):
        print(textwrap.dedent(__doc__ or ""))

    else:
        sys.exit(
            f"Unknown subcommand: '{sub}'\n"
            "Use: search <keyword> | category | list | help"
        )


if __name__ == "__main__":
    main()
