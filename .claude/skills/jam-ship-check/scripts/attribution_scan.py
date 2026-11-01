#!/usr/bin/env python3
"""Scan a repo's PUBLIC surface for AI/tool attribution text.

Public = tracked files outside the allowlist, recent commit messages, an optional
built dist/ folder, and optional extra files (e.g. itch page copy).
Allowed (not scanned): CLAUDE.md, .claude/, handoff files, node_modules, .git.

Usage: python3 -I attribution_scan.py [repo_dir] [--commits 200] [--dist dist] [--extra itch.md ...]
Exit code 1 if any hit, 0 if clean.
"""
import argparse, os, re, subprocess, sys

PATTERNS = [
    r"\bclaude(?:[ -]?code)?\b", r"\banthropic\b", r"co-authored-by:\s*claude",
    r"generated with", r"\bmade with ai\b", r"\bbuilt with ai\b", r"\bai[- ]generated\b",
    r"\bai[- ]assisted\b", r"\bcopilot\b", r"\bchatgpt\b", r"\bopenai\b", r"\bgpt-?\d",
    r"\bllm\b", r"\bopus\b(?! ?\d+ ?in)", r"\bsonnet\b", r"\bhaiku\b", r"🤖",
]
RX = re.compile("|".join(PATTERNS), re.I)
ALLOW_PATH = re.compile(
    r"(^|/)(CLAUDE\.md|\.claude/|handoffs?/|HANDOFF[^/]*\.md$|node_modules/|\.git/|spikes/)", re.I)
TEXT_EXT = {".md", ".txt", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".html", ".css",
            ".yml", ".yaml", ".toml", ".svg", ".xml", ""}


def git(repo, *a):
    try:
        return subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True, check=True).stdout
    except Exception:
        return None


def scan_text(label, text, hits, max_per_file=5):
    n = 0
    for i, line in enumerate(text.splitlines(), 1):
        m = RX.search(line)
        if m:
            hits.append((label, i, m.group(0), line.strip()[:140]))
            n += 1
            if n >= max_per_file:
                break


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo", nargs="?", default=".")
    ap.add_argument("--commits", type=int, default=200)
    ap.add_argument("--dist", default=None)
    ap.add_argument("--extra", nargs="*", default=[])
    a = ap.parse_args()
    repo = os.path.abspath(a.repo)
    hits = []

    tracked = git(repo, "ls-files")
    if tracked is None:
        print("NOT ASSESSED: not a git repo or git unavailable:", repo)
        return 2
    files = [f for f in tracked.splitlines() if f and not ALLOW_PATH.search(f)]
    for f in files:
        if os.path.splitext(f)[1].lower() not in TEXT_EXT:
            continue
        p = os.path.join(repo, f)
        try:
            with open(p, encoding="utf-8", errors="ignore") as fh:
                scan_text(f, fh.read(), hits)
        except OSError:
            pass

    log = git(repo, "log", f"-{a.commits}", "--format=%h%x00%B%x01") or ""
    for entry in log.split("\x01"):
        if "\x00" in entry:
            sha, body = entry.strip().split("\x00", 1)
            scan_text(f"commit {sha}", body, hits)

    branches = git(repo, "branch", "-a", "--format=%(refname:short)") or ""
    scan_text("branch names", branches, hits)

    if a.dist:
        d = os.path.join(repo, a.dist)
        for root, _, fs in os.walk(d):
            for f in fs:
                if os.path.splitext(f)[1].lower() in {".html", ".js", ".json", ".css"}:
                    p = os.path.join(root, f)
                    with open(p, encoding="utf-8", errors="ignore") as fh:
                        scan_text(os.path.relpath(p, repo), fh.read(), hits)
    for x in a.extra:
        with open(x, encoding="utf-8", errors="ignore") as fh:
            scan_text(x, fh.read(), hits)

    print(f"Scanned {len(files)} tracked public files, last {a.commits} commits, branch names"
          + (f", {a.dist}/" if a.dist else "") + (f", {len(a.extra)} extra" if a.extra else ""))
    if not hits:
        print("CLEAN: no attribution text found on the public surface.")
        return 0
    print(f"HITS: {len(hits)}")
    print("| where | line | match | context |\n|---|---|---|---|")
    for w, ln, m, ctx in hits:
        print(f"| {w} | {ln} | {m} | {ctx.replace('|', '/')} |")
    return 1


if __name__ == "__main__":
    sys.exit(main())
