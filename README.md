# 40K Painted Army Value Scorecard — All Factions + Chaos/Be'lakor Edition

Scrapes **live, fully-painted Warhammer 40,000 armies for sale on eBay**, scores each on
value (kit MSRP + a paint premium, divided by landed price), and renders a filterable
scorecard. Expanded from the original Necrons/Grey Knights board to **all 26 faction
buckets** (~157 live listings as of the last run).

> Not affiliated with Games Workshop. This tool only **organizes public listings** — it
> never buys, bids, or checks out on anyone's behalf.

## Files

| File | What it is |
|------|------------|
| `data/raw_listings.psv` | Raw scrape: `faction\|itemId\|price\|title` (one row per listing) |
| `build.py` | Parser + scoring engine → writes `listings.json` and `listings.js` |
| `listings.json` | **The data source.** Scored records in a clean schema — drop into the app |
| `listings.js` | Same payload as `window.SCORECARD_DATA` so `index.html` opens standalone |
| `index.html` | Self-contained scorecard viewer (filters by faction/verdict, sortable) |
| `scrape.js` | Paste-into-console scraper to refresh `raw_listings.psv` |
| `data/raw_chaos.psv` | **Chaos edition** raw scrape (fresh sweep, feed pages 1–5, Chaos factions only) |
| `chaos.json` / `chaos.js` / `chaos.html` | Chaos/Be'lakor edition data + standalone viewer |
| `shadow-legion-strategy.md` | Gameplan + shopping list for the purchased Shadow Legion army |
| `belakor-shadow-legion-guide.md` | Rules explainer: Be'lakor, Shadow of Chaos, and the Shadow Legion detachment |

### Chaos / Be'lakor edition

Be'lakor leads **Chaos Daemons** and can front CSM-flavoured lists, so the chaos build
covers: Chaos Daemons, Chaos Space Marines, Death Guard, Thousand Sons, World Eaters,
Emperor's Children, Chaos Knights. Zero complete armies listed with Be'lakor included —
he sells as a painted **centerpiece single** (two live ones are in the dataset, ~$450–600,
both Eastern-EU sellers). Strategy: buy a Daemons/CSM army lot + a painted Be'lakor.
Note the chaos raw data is from a **fresh scan** (see `meta.generated` in `chaos.json`);
the all-faction raw file is from the previous sweep and its `verifiedLive` flags date to
that run.

## Quick start

```bash
python3 build.py            # regenerates listings.json + listings.js
open index.html            # view the scorecard (no server needed)
```

## The value model

```
Value Ratio = (Kit MSRP + Paint Premium) / Landed Price
  Kit MSRP  ≈ points × $0.45      # GW USD retail; a 2000pt army ≈ $900
  Paint Premium tiers (% of MSRP): Basic +30 · Tabletop +60 · Tabletop+ +100 ·
                                   High TT +150 · Display/Pro +250
  Landed     = price × 1.03 + $35  # generic ship/handling uplift
Verdict:  ≥1.5× BUY   ·   0.8–1.49× FAIR   ·   <0.8× SKIP
```

Calibrated against the original board (its 3500pt/$1,550 top pick scored ~2.0× — this
model reproduces that). Paint premium defaults to **Tabletop+** unless a listing was
individually verified.

### `listings.json` schema

```jsonc
{
  "meta": { "generated", "source", "count", "factions", "scoredCount", "buyCount", "model", "disclaimer" },
  "listings": [{
    "faction", "name", "itemId", "url",
    "priceDisplay", "priceUSD", "landedUSD",
    "points", "kitMsrpUSD", "paintTier", "paintTierAssumed",
    "valueRatio", "verdict",          // BUY | FAIR | SKIP | COMMISSION | UNSCORED
    "type",                           // ready-to-ship | commission
    "verifiedLive", "location", "notes"
  }]
}
```

## Known limitations (read before trusting a number)

- **Only ~9 of 157 titles state points**, so most listings are `UNSCORED` (price shown,
  no ratio). Titles rarely include points; true scoring needs the listing body.
- **Paint tier is assumed** `Tabletop+` unless `verifiedLive` — "pro painted" is a seller
  claim, not a standard. Always open the photos.
- **MSRP is heuristic** (points × $0.45). A real MSRP means summing the actual kit
  contents; do that for any listing before a big-ticket purchase.
- **eBay search is bot-blocked** for automation, so we scrape the `/b/` category feeds.
  They omit per-listing location/shipping, so `landedUSD` is an estimate.
- Prices/availability change fast. `verifiedLive` reflects a manual check at build time only.

## Refreshing the data

1. Open the eBay category feed (`bn_96974265`, add `?_pgn=2`, `3`, …; `bn_119783045` for Necrons).
2. Paste `scrape.js` into the console, run `SCAN()` on each page, then `EXPORT()`.
3. Paste the printed lines into `data/raw_listings.psv`.
4. `python3 build.py` → refreshes `listings.json` + `listings.js`.

## Current top picks (last run)

Best verified/scored value across all factions:

- **Tyranids** — 1060pt lot, $275 → **3.0×** (cheapest points-per-dollar on the board)
- **Adeptus Custodes** — 2000pt, $700 → **2.38×**
- **Space Marines** — 3000pt, $1,173 → **2.17×**
- **Necrons** — 4300pt, $1,500 → **1.96×** ✓ *verified live* (title says "READ DESCRIPTION")
- **Astra Militarum** — 6000pt Death Korps, $3,000 → **1.73×**

_The previous board's top 3 Necron picks had all ended/sold by this run — hence the refresh._
