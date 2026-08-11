#!/usr/bin/env bash
# build_site.sh — render the repo's markdown + HTML into docs/ for local
# browsing or (optionally) GitHub Pages. Safe to re-run; never publishes
# on its own.
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p docs

# ---------------------------------------------------------------------------
# 1. Shared stylesheet (Word Bearers palette from artifact.html)
# ---------------------------------------------------------------------------
cat > docs/site.css <<'CSS'
:root {
  --crimson: #8e1c26;
  --crimson-dark: #5b1a19;
  --brass: #8a6a38;
  --brass-light: #b8995e;
  --ink: #261b17;
  --parchment: #f6efe4;
  --parchment-edge: #e8dcc6;
  --slate: #4a4540;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  padding: 2.5rem 1.25rem 4rem;
  max-width: 52rem;
  margin-inline: auto;
  font: 17px/1.6 "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  color: var(--ink);
  background: var(--parchment);
}
h1, h2, h3, h4 {
  font-family: "Iowan Old Style", Palatino, Georgia, serif;
  line-height: 1.2;
  color: var(--crimson-dark);
  letter-spacing: .01em;
}
h1 { font-size: 2rem; border-bottom: 3px double var(--brass); padding-bottom: .4rem; margin-top: 0; }
h2 { font-size: 1.45rem; border-bottom: 1px solid var(--parchment-edge); padding-bottom: .25rem; margin-top: 2.2rem; }
h3 { font-size: 1.15rem; color: var(--crimson); margin-top: 1.6rem; }
a { color: var(--crimson); text-underline-offset: 2px; }
a:hover { color: var(--brass); }
hr { border: 0; border-top: 1px solid var(--parchment-edge); margin: 2rem 0; }
code, pre {
  font: 0.92em/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: #efe6d5;
  border: 1px solid var(--parchment-edge);
  border-radius: 4px;
}
code { padding: .1em .35em; }
pre { padding: .9rem 1rem; overflow-x: auto; }
pre code { border: 0; background: none; padding: 0; }
blockquote {
  margin: 1rem 0; padding: .6rem 1rem;
  border-left: 4px solid var(--brass);
  background: #efe6d5; color: var(--slate);
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0 1.5rem;
  font-size: .96em;
  background: #fbf7ee;
}
th, td {
  border: 1px solid var(--parchment-edge);
  padding: .45rem .7rem;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--crimson);
  color: var(--parchment);
  font-weight: 600;
  border-color: var(--crimson-dark);
}
tr:nth-child(even) td { background: #f3ecdd; }
img { max-width: 100%; height: auto; }
nav.site-nav {
  font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  margin-bottom: 2rem; padding-bottom: 1rem;
  border-bottom: 1px solid var(--parchment-edge);
}
nav.site-nav a { margin-right: 1rem; color: var(--slate); text-decoration: none; }
nav.site-nav a:hover { color: var(--crimson); text-decoration: underline; }

@media print {
  body { background: #fff; color: #000; max-width: none; padding: 0; font-size: 11pt; }
  nav.site-nav { display: none; }
  a { color: #000; text-decoration: none; }
  h1, h2, h3 { page-break-after: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
  th { background: #ddd !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
CSS

# ---------------------------------------------------------------------------
# 2. Copy pre-rendered HTML/PDF assets
# ---------------------------------------------------------------------------
[ -f artifact.html ] && cp artifact.html docs/dashboard.html
[ -f guide.html ]    && cp guide.html    docs/guide.html
[ -f GUIDE.pdf ]     && cp GUIDE.pdf     docs/GUIDE.pdf

# ---------------------------------------------------------------------------
# 3. Markdown → HTML (pandoc → python3 markdown → sed wrapper fallback)
# ---------------------------------------------------------------------------
NAV='<nav class="site-nav"><a href="index.html">Home</a><a href="dashboard.html">Dashboard</a><a href="guide.html">Guide</a><a href="GUIDE.pdf">PDF</a><a href="primer.html">Primer</a><a href="lists.html">Lists</a><a href="collection.html">Collection</a><a href="research.html">Research</a><a href="scout_report.html">Scout</a><a href="handoff_2026-07-27.html">Handoff</a></nav>'

if command -v pandoc >/dev/null 2>&1; then
  RENDERER=pandoc
elif python3 -c 'import markdown' >/dev/null 2>&1; then
  RENDERER=pymd
else
  RENDERER=sed
fi
echo "renderer: $RENDERER"

render_md () {
  local src="$1" title="$2" out="$3"
  [ -f "$src" ] || { echo "skip: $src (missing)"; return; }
  case "$RENDERER" in
    pandoc)
      pandoc -f gfm -t html5 -s --css=site.css \
             --metadata title="$title" \
             -V "include-before=$NAV" \
             "$src" -o "docs/$out"
      ;;
    pymd)
      local body
      body=$(python3 -m markdown -x tables -x fenced_code "$src")
      cat > "docs/$out" <<HTML
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>$title</title><link rel="stylesheet" href="site.css">
</head><body>$NAV
$body
</body></html>
HTML
      ;;
    sed)
      # crude fallback: headings + paragraphs only, tables/code left as-is in <pre>
      local body
      body=$(sed -E \
        -e 's/^###### (.*)$/<h6>\1<\/h6>/' \
        -e 's/^##### (.*)$/<h5>\1<\/h5>/' \
        -e 's/^#### (.*)$/<h4>\1<\/h4>/' \
        -e 's/^### (.*)$/<h3>\1<\/h3>/' \
        -e 's/^## (.*)$/<h2>\1<\/h2>/' \
        -e 's/^# (.*)$/<h1>\1<\/h1>/' \
        -e 's/^---$/<hr>/' \
        "$src")
      cat > "docs/$out" <<HTML
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>$title</title><link rel="stylesheet" href="site.css">
</head><body>$NAV
<pre style="white-space:pre-wrap;font-family:inherit;background:none;border:0;padding:0">$body</pre>
</body></html>
HTML
      ;;
  esac
  echo "wrote docs/$out"
}

render_md PRIMER.md              "Primer"            primer.html
render_md lists.md               "Army Lists"        lists.html
render_md collection.md          "Collection"        collection.html
render_md research.md            "Rules Research"    research.html
render_md SCOUT_REPORT.md        "eBay Scout Report" scout_report.html
render_md HANDOFF_2026-07-27.md  "Handoff 2026-07-27" handoff_2026-07-27.html

# ---------------------------------------------------------------------------
# 4. Landing page
# ---------------------------------------------------------------------------
cat > docs/index.html <<HTML
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daemon Quartermaster</title><link rel="stylesheet" href="site.css">
</head><body>
<h1>Daemon Quartermaster</h1>
<p style="color:var(--slate)">Evan's Warhammer 40k Chaos Daemons project — lists, rules digest, buy plan.</p>
<h2>Start here</h2>
<ul>
  <li><a href="dashboard.html"><strong>Dashboard</strong></a> — six lists, verified points, shopping, key rules (interactive)</li>
  <li><a href="guide.html"><strong>Guide</strong></a> — print-layout strategy guide · <a href="GUIDE.pdf">download PDF</a> (31pp, A4)</li>
  <li><a href="primer.html"><strong>Primer</strong></a> — full 7.8k-word beginner strategy guide</li>
</ul>
<h2>Reference</h2>
<ul>
  <li><a href="lists.html">Army Lists</a> — six builds A–F with corrections</li>
  <li><a href="collection.html">Collection</a> — what's owned + priority gaps</li>
  <li><a href="research.html">Rules Research</a> — 11th-ed Shadow Legion digest, re-verified 2026-07-27</li>
  <li><a href="scout_report.html">eBay Scout Report</a> — graded listings + cost-to-complete tables</li>
  <li><a href="handoff_2026-07-27.html">Handoff (2026-07-27)</a> — current state + open decisions</li>
</ul>
<hr>
<p style="font-size:.85em;color:var(--slate)">Rendered by <code>build_site.sh</code>. Source of truth is the git repo.</p>
</body></html>
HTML
echo "wrote docs/index.html"

echo
echo "Done. Open docs/index.html in a browser."

# ---------------------------------------------------------------------------
# To publish (makes docs/ PUBLIC even on a private repo — decide first):
# gh api -X POST repos/evbarleyg/daemon-quartermaster/pages -f source[branch]=main -f source[path]=/docs
# Then: https://evbarleyg.github.io/daemon-quartermaster/
# ---------------------------------------------------------------------------
