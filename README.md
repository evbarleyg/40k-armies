# Shadow Legion HQ — Evan's 40K repo

One home for all the Warhammer 40,000 hobby work: the **Shadow Legion** army (Chaos Daemons under
Be'lakor, bought as one painted eBay lot), the six lists built from it, the **painted-army value
scorecards** that found it, and the photo-verified paint sweep. Open `index.html` — it is the hub
and links everything.

> Not affiliated with Games Workshop. The scorecards only **organize public listings** — nothing
> here buys, bids, or checks out on anyone's behalf.

**New Claude session, either account?** Read `CLAUDE.md`, then `docs/CONTEXT.md`.

## Pages

| Page | What it is | Source |
|------|------------|--------|
| `index.html` | Hub: what's current — vision, army, primer, market tool, what's next, cross-account how-to | hand-written |
| `vision.html` | The vision: narrative, five painting rules, unit-by-unit treatments, phases, buying order, transport | `docs/VISION.md` (+ `docs/research/`) |
| `archive.html` | Every dated snapshot (strategy note, sweep, scout, research, lists history, handoff) with its status | hand-written |
| `quartermaster.html` | The Shadow Legion ledger — collection at MFM v1.1 points, lists A–F, shopping, verified rules | hand-written (from the Jul 27 artifact) |
| `primer.html` | Beginner's strategy primer — the detachment, each list's play guide, cited appendices | `docs/PRIMER.md` |
| `guide.html` · `GUIDE.pdf` | The Primer in print layout; 31-page A4 PDF (`./make_guide.sh`) | hand-written (Jul 27) |
| `lists.html` · `collection.html` · `research.html` | Lists with corrections, box inventory, rules digest + re-verification | `docs/lists.md` · `docs/collection.md` · `docs/research.md` |
| `scout.html` | eBay scout (Jul 27): graded buy targets, cost to complete each list | `docs/SCOUT_REPORT.md` (+ `data/scout-*.json`) |
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
python3 build.py            # scores data/raw_*.psv → listings.json/.js + chaos.json/.js, then runs pages.py
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
| `data/scout-2026-07-26.json` · `data/scout-2026-07-27.json` | Shopping scrapes for the six lists (14 → 114 listings) |
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
