# Shadow Legion HQ — Evan's 40K repo

One home for all the Warhammer 40,000 hobby work: the **Shadow Legion** army (Chaos Daemons under
Be'lakor with a Word Bearers half and two War Dogs), the audited inventory and the orders that built it,
the six lists, the personal codex, the painting vision, the **painted-army value scorecards** that found
the original lot — and **Muster**, one local-first console over all of it. Open `index.html`.

> Not affiliated with Games Workshop. The scorecards only **organize public listings** — nothing
> here buys, bids, or checks out on anyone's behalf.

**New Claude session, either account?** Read `CLAUDE.md`, then `docs/CONTEXT.md`, then `data/muster.json`.
Live site (from `main`): https://evbarleyg.github.io/40k-armies/

## Muster and the store

- `data/muster.json` — the one hand-maintained store: unit catalog (points brackets, keywords, leader pairs,
  legality), inventory (audited counts, paint state, provenance), orders (the ledger), lists (entries reference
  unit ids; totals are computed), rules gists with sources and verified dates, hobby queue, games, buying notes.
- `muster.py` — `build` (validate → `muster.js` + regenerate the `<!--gen:…-->` tables in `quartermaster.md`,
  `codex-umbral-creed.md/.html`, `docs/CONTEXT.md`), `check` (battery gate: valid and in sync), `validate`, `fmt`.
  Needs `node` for the legality lint; `build.py` runs it first and stops on an invalid store.
- `lint.js` — the single implementation of the legality rules (Thralls allowlist and cap, Epic Hero ban, mandatory
  Warlord, Dreadblades, enhancements, leaders, rule of three), ownership coverage and store derivations; used by the
  app in the browser and by `muster.py` through `tools/lint_cli.js`.
- `index.html` + `app.js` + `app.css` — the console (vanilla JS, classic scripts, opens from `file://`): home = the four
  questions (own / field today / buy next / arriving), collection, lists + linter, builder, gap-aware buy view over
  `listings.js`/`chaos.js`, crates + crate mode, hobby, games, orders, library, hand-off tools; local edits are a
  `localStorage` overlay until exported (download `muster.json` or copy a patch for a session).
- `DECISIONS.md` — proposal, dedupe map between the two lines of work, architecture decisions, the design tournament
  (`design/`), the review-battery log, owner questions. `SPEC-muster.md` — the brief. `tools/shoot.js`,
  `tools/viewtext.js` — battery helpers (screenshots of every view; text dump of a view).

## Pages

| Page | What it is | Source |
|------|------------|--------|
| `index.html` | Muster — the console (see above) | `app.js` over `muster.js` ← `data/muster.json` |
| `vision.html` | The vision: narrative, five painting rules, unit-by-unit treatments, phases, buying order, transport | `docs/VISION.md` (+ `docs/research/`) |
| `archive.html` | Every dated snapshot (strategy note, sweep, scout, research, lists history, handoff) with its status | hand-written |
| `quartermaster.html` | The army page — audited inventory, six lists with status and gaps, verified rules (tables generated) | `quartermaster.md` ← `data/muster.json` |
| `codex-umbral-creed.html` | Codex: The Umbral Creed — the army book; its ledger table is generated | hand-written + `muster.py` region |
| `rules-guide.html` · `decisions.html` · `spec.html` | Rules explainer; the Muster build log; the Muster brief | `belakor-shadow-legion-guide.md` · `DECISIONS.md` · `SPEC-muster.md` |
| `primer.html` | Beginner's strategy primer — the detachment, each list's play guide, cited appendices | `docs/PRIMER.md` |
| `guide.html` · `GUIDE.pdf` | The Primer in print layout; 31-page A4 PDF (`./make_guide.sh`) | hand-written (Jul 27) |
| `lists.html` · `collection.html` · `research.html` | Lists with corrections, box inventory, rules digest + re-verification | `docs/lists.md` · `docs/collection.md` · `docs/research.md` |
| `scout.html` | Price scan (Aug 14: retail floors, bundle maths, leads to open by hand) above the eBay scout (Jul 27: photo-graded targets); cost to complete each list | `docs/SCOUT_REPORT.md` (+ `data/scout-*.json`; Muster reads the one registered last in `buying.scan_log`) |
| `scorecard.html` | All-faction painted-army value scorecard (filter/sort) | `listings.js` ← `build.py` |
| `chaos.html` | Chaos / Be'lakor edition scorecard | `chaos.js` ← `build.py` |
| `sweep-2026-07-21.html` | Visual paint-tier sweep of 29 listings (photos, not titles) | `docs/sweep-2026-07-21.md` |
| `handoff-2026-07-27.html` · `strategy.html` | Provenance: the Jul 27 handoff and the Jul 20 day-one note | `docs/HANDOFF_2026-07-27.md` · `docs/strategy-2026-07-20.md` |
| `context.html` · `memory-export.html` | Portable context for new sessions; the personal account's memory note | `docs/CONTEXT.md` · `docs/memory-export.md` |
| `ebay-access.html` | Method note: reaching eBay from a cloud agent session (`tools/ebay_search.js`, `tools/ebay_fetch.js`) | `docs/ebay-access.md` |

`ledger.css` is the shared theme (dark-first, follows the OS into light), `nav.css` the shared nav strip,
`viewer.css`/`viewer.js` the scorecard viewer behind both scorecard pages. `pages.py` renders the markdown
docs and re-stamps the nav (and the hub's market numbers) into every page carrying `<!--nav-->` markers.

## Build

```bash
pip install markdown        # once, for the doc pages
python3 build.py            # muster.py build (store → muster.js + doc tables), scores data/raw_*.psv → listings/chaos .json/.js, then pages.py
NODE_PATH=$(npm root -g) ./make_guide.sh   # optional: GUIDE.pdf from guide.html (node playwright + Chromium)
open index.html             # no server needed; everything is static and relative
```

## Viewing it from anywhere (and from the other account)

- **GitHub Pages** (one-time, needs the repo admin `evbarleyg`): Settings → Pages → Deploy from
  branch → `main` / root. The site is then at `https://evbarleyg.github.io/40k-armies/`.
- **Any branch, instantly, no settings**: `https://raw.githack.com/evbarleyg/40k-armies/<branch>/index.html`.
- Collaborators: `evbarleyg` (personal, admin) and `ebg-ant` (work-linked, write). Claude sessions
  from either account can clone and push; artifacts and chat history don't cross accounts, so the
  repo — `docs/CONTEXT.md` in particular — is the hand-off.

## The value model (scorecards)

```
Value Ratio = (Kit MSRP × Paint Premium) / Landed Price
  Kit MSRP  ≈ points × $0.45      # GW USD retail; a 2000pt army ≈ $900 (itemized MSRP beats this when known)
  Paint Premium (× MSRP): Partial/Primer 1.0 · Basic 1.3 · Tabletop 1.6 · Tabletop+ 2.0 · High TT 2.5 · Display 3.5
  Landed     = price × 1.03 + $35  # generic ship/handling uplift
Verdict:  ≥1.5× BUY · 0.8–1.49× FAIR · <0.8× SKIP · AUCTION / SOLD / COMMISSION are never scored
```

Paint tier defaults to **Tabletop+ (assumed)** unless the listing was photo-checked; the Jul 21
sweep (the `SWEEP` overlay in `build.py`) supplies real tiers for the 29 shortlisted lots, and ten
of them turned out `Partial`.

### Files

| File | What it is |
|------|------------|
| `data/raw_listings.psv` · `data/raw_chaos.psv` | Raw scrapes: `faction\|itemId\|price\|title` (feed scanned 2026-07-20) |
| `build.py` | Parser + scoring engine + the `VERIFIED` / `SWEEP` hand-checked entries; `FEED_SCANNED` / `PHOTO_SWEEP` date them |
| `listings.json` / `chaos.json` | Scored records (schema below); `.js` twins inline the same payload for `file://` use |
| `scrape.js` | Paste-into-console scraper for the eBay category feeds (captures bid counts) |
| `pages.py` | Doc renderer + nav sync |
| `docs/` | Markdown sources (Primer, lists, collection, research, scout report, handoff, context, sweep, strategy, eBay method) |
| `data/scout-2026-07-26.json` · `data/scout-2026-07-27.json` · `data/scout-2026-08-14.json` | Shopping snapshots for the six lists (25 → 114 photo-graded listings in July; the August file is a search-index scan: US retail floors plus unverified leads). `muster.py` prices gaps from whichever file the store's `buying.scan_log` registers last |
| `tools/ebay_search.js` · `tools/ebay_fetch.js` | The scout's headless-Chromium search + item/gallery fetchers |
| `guide.html` · `make_guide.sh` · `GUIDE.pdf` | Print-layout guide and its PDF build |
| `archive/` | Provenance from the superseded `daemon-quartermaster` repo (first Quartermaster page, BOOTSTRAP, build_site.sh, paste prompt) |
| `codex-umbral-creed.md` · `codex-umbral-creed.html` | Codex: The Umbral Creed — the personal army book (fiction, unit entries, doctrines, **purchase ledger**); the styled HTML edition is standalone |
| `quartermaster.md` | Audited inventory (Jul 27 photo re-audit + August arrivals), six 2,000-pt lists, verified rules — the current truth for what is owned |
| `belakor-shadow-legion-guide.md` | Rules explainer: Be'lakor, Shadow of Chaos, the Shadow Legion detachment |
| `SPEC-muster.md` | Handoff spec: unify every frontend here into one local-first console over a single canonical data store |
| `.github/workflows/pages.yml` | Deploys the repo root to GitHub Pages on every push to `main` |

### `listings.json` schema

```jsonc
{
  "meta": { "generated", "scanned", "photoSweep", "source", "count", "factions", "scoredCount", "buyCount", "model", "disclaimer" },
  "listings": [{
    "faction", "name", "itemId", "url",
    "priceDisplay", "priceUSD", "landedUSD",
    "points", "kitMsrpUSD", "msrpSource?", "paintTier", "paintTierAssumed",
    "valueRatio", "verdict",          // BUY | FAIR | SKIP | AUCTION | SOLD | COMMISSION | UNSCORED
    "type",                           // ready-to-ship | commission
    "verifiedLive", "location", "notes"
  }]
}
```

### Known limitations (read before trusting a number)

- **The data is a snapshot** (feed scanned 2026-07-20, photos swept 2026-07-21). Most of those
  listings have ended. Refresh before acting.
- **Few titles state points**, so most listings are `UNSCORED`. True scoring needs the listing body
  (`itm.ebaydesc.com/itmdesc/<id>` — how the chaos edition was deep-scored).
- **Paint tier is assumed** `Tabletop+` unless photo-checked — "pro painted" is a seller claim.
- **MSRP is heuristic** (points × $0.45) unless itemized from the listing contents.
- **eBay search is bot-blocked**, so the scraper works off the `/b/` category feeds, which omit
  per-listing location/shipping; `landedUSD` is an estimate. See `docs/ebay-access.md`.

### Refreshing the data

1. Open the eBay category feed (`bn_96974265`, add `?_pgn=2`, `3`, …; `bn_119783045` for Necrons).
2. Paste `scrape.js` into the console, run `SCAN()` on each page, then `EXPORT()`.
3. Paste the printed lines into `data/raw_listings.psv` (or `raw_chaos.psv`) and bump `FEED_SCANNED` in `build.py`.
4. `python3 build.py`, then photo-check anything BUY-grade before believing it (`docs/ebay-access.md`).
