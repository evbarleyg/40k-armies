#!/usr/bin/env python3
"""
Static-site step: renders docs/*.md into themed HTML pages (ledger.css) and keeps the
site nav identical across every page. Any page that carries <!--nav-->…<!--/nav--> markers
gets the nav; rendered docs get the markers from the template, hand-written pages carry them.

    pip install markdown        # one-time
    python3 pages.py             # after editing any doc or adding a page

build.py runs this after rescoring and passes the market numbers for the hub.
"""
import os, re, html, glob

HERE = os.path.dirname(os.path.abspath(__file__))

# (href, label) — order is the nav order.
NAV = [("index.html", "Muster"), ("quartermaster.html", "Army"), ("codex-umbral-creed.html", "Codex"), ("vision.html", "Vision"), ("primer.html", "Primer"), ("scorecard.html", "Market"), ("archive.html", "Archive"), ("context.html", "Context")]

# source markdown -> (output page, eyebrow line)
ARCHIVED = "Archived snapshot · "      # eyebrow prefix for dated material kept for the record
DOCS = {
    "docs/VISION.md":            ("vision.html", "The vision · one legion of shadow · written 2026-08-11 against the Jul 27 inventory"),
    "docs/PRIMER.md":            ("primer.html", "Shadow Legion · beginner's strategy primer · verified 2026-07-27 (MFM v1.1)"),
    "docs/CONTEXT.md":           ("context.html", "Portable context · read this first in any new session, either account"),
    "quartermaster.md":          ("quartermaster.html", "The army · audited inventory, six lists, verified rules · tables generated from data/muster.json"),
    "belakor-shadow-legion-guide.md": ("rules-guide.html", "Rules explainer · Be'lakor, Shadow of Chaos, the Shadow Legion detachment · 2026-07-24"),
    "DECISIONS.md":              ("decisions.html", "Muster build log · proposal, dedupe map, design tournament, review batteries"),
    "SPEC-muster.md":            ("spec.html", "The Muster spec · hand-off brief for the unified console"),
    "docs/ebay-access.md":       ("ebay-access.html", "Method note · reaching eBay from a cloud session"),
    "docs/lists.md":             ("lists.html", ARCHIVED + "how the six lists came to be: the original four (Jul 26), the corrections, lists 5–6 (Jul 27)"),
    "docs/collection.md":        ("collection.html", ARCHIVED + "the box as inventoried on 2026-07-25 (the Army page carries the current table)"),
    "docs/research.md":          ("research.html", ARCHIVED + "rules digest 2026-07-26 + primary-source re-verification 2026-07-27"),
    "docs/SCOUT_REPORT.md":      ("scout.html", ARCHIVED + "eBay scout 2026-07-27 · every listing long ended; grades and method still hold"),
    "docs/HANDOFF_2026-07-27.md": ("handoff-2026-07-27.html", ARCHIVED + "handoff note when work moved machines, 2026-07-27"),
    "docs/sweep-2026-07-21.md":  ("sweep-2026-07-21.html", ARCHIVED + "photo paint-tier sweep of 29 listings, 2026-07-21"),
    "docs/strategy-2026-07-20.md": ("strategy.html", ARCHIVED + "day-one strategy note, 2026-07-20 · superseded by the Primer"),
    "docs/memory-export.md":     ("memory-export.html", ARCHIVED + "the personal account's memory note, 2026-07-25"),
}
DOC_PAGES = {os.path.basename(src): out for src, (out, _) in DOCS.items()}

def write_if_changed(path, text):
    if os.path.exists(path) and open(path, encoding="utf-8").read() == text:
        return False
    open(path, "w", encoding="utf-8").write(text)
    print(f"[pages] wrote {os.path.relpath(path, HERE)}")
    return True

def nav_html(current):
    links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        links.append(f'<a href="{href}"{cur}>{html.escape(label)}</a>')
    return ('<!--nav--><nav class="sitenav" aria-label="Site"><a class="mark" href="index.html">Shadow <b>Legion</b> HQ</a>'
            + '<span class="sep">·</span>'.join(links) + '</nav><!--/nav-->')

def stamp(src, marker, block):
    """Replace <!--marker-->…<!--/marker--> in src with block (which carries its own markers)."""
    return re.sub(rf"<!--{marker}-->.*?<!--/{marker}-->", lambda m: block, src, count=1, flags=re.S)

def sync_pages(market=None):
    """Re-stamp the nav (and, on the hub, the market numbers) in every page that opts in with markers."""
    for path in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        page = os.path.basename(path)
        src = open(path, encoding="utf-8").read()
        if "<!--nav-->" not in src:
            continue                                   # guide.html: print layout, keeps its own bar
        out = stamp(src, "nav", nav_html(page))
        if market and "<!--market-->" in out:
            out = stamp(out, "market", f"<!--market-->{market}<!--/market-->")
        write_if_changed(path, out)

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="ledger.css">
<link rel="stylesheet" href="nav.css">
</head>
<body>
<div class="wrap">
{nav}
<p class="{metacls}">{eyebrow}</p>
<article class="doc">
{body}
</article>
<footer><p>Rendered from <code>{src}</code> · edit the markdown, then <code>python3 pages.py</code>.</p></footer>
</div>
</body>
</html>
"""

MD_LINK = re.compile(r'href="(?:\./|docs/)?([\w.-]+\.md)(#[^"]*)?"')

def render_docs():
    try:
        import markdown
    except ImportError:
        print("[pages] python package 'markdown' not installed — skipping doc pages (pip install markdown)")
        return
    for src, (out, eyebrow) in DOCS.items():
        spath = os.path.join(HERE, src)
        if not os.path.exists(spath):
            print(f"[pages] skip {src} (missing)")
            continue
        text = open(spath, encoding="utf-8").read()
        if text.startswith("---\n"):                      # drop YAML front-matter (memory exports)
            text = text.split("\n---\n", 1)[-1]
        body = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists"])
        # tables scroll inside their own box instead of pushing the page sideways
        body = body.replace("<table>", '<div class="scroll"><table>').replace("</table>", "</table></div>")
        # docs link to each other as .md; the site serves the rendered .html
        def relink(m):
            target = DOC_PAGES.get(m.group(1))
            if not target:
                print(f"[pages] WARNING: {src} links to {m.group(1)}, which has no rendered page")
                return m.group(0)
            return f'href="{target}{m.group(2) or ""}"'
        body = MD_LINK.sub(relink, body)
        m = re.search(r"^#\s+(.+)$", text, re.M)
        title = m.group(1).strip() if m else out
        page = TEMPLATE.format(title=html.escape(title), nav=nav_html(out), eyebrow=html.escape(eyebrow),
                               metacls="docmeta archived" if eyebrow.startswith(ARCHIVED) else "docmeta",
                               body=body, src=src)
        write_if_changed(os.path.join(HERE, out), page)

def build(market=None):
    render_docs()
    sync_pages(market)

if __name__ == "__main__":
    build()
