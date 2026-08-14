# 40K context — read this first

Portable summary of Evan's Warhammer 40,000 work: what he owns, what has been decided, what is
open, and where everything lives. Written for a Claude session on **either** account (personal or
work) — sessions, artifacts and memory don't cross accounts, this repo does. If you change the state
of the army or the plan, update this file in the same commit.

## 0. Current state (generated — do not edit by hand)

<!--gen:state-->
- **Store:** `data/muster.json` (schema 1, updated 2026-08-14); points Munitorum Field Manual v1.1 (2026-07-22), rules verified 2026-07-27. Aug 10: the community data files (BSData) now carry Skullmaster at 85 pts (these pages had ~75); nothing else in the six lists moved. A points revision (MFM v1.2, Aug 5) is reported with no Daemons/CSM/Knights changes. Confirm both in the official Warhammer 40,000 app. Next balance update expected Aug 19–26.
- **Owned:** 21 inventory records, ≈92 models, 2,730 pts at MFM v1.1 (2,410 table-ready); spent ≈ $1,391 over 7 orders.
- **Inbound:** Khorne Daemons Army Lot — Shipped Aug 6 (USPS), ETA Aug 10–17; Bloodcrushers lot — ETA Aug 18–Sep 1 (reconfirmed Aug 11).
- **Lists:** playable today: A (1,940); hobby work first: F (2,000); need purchases: B (1,960), C (1,950), D (1,995), E (1,980).
- **Games logged:** 0 (rule: 10 before the next model, counting once the two inbound crates (the Khorne lot and the Bloodcrushers) are catalogued).
<!--/gen:state-->

*Generated from `data/muster.json` by `muster.py build`. The Muster app (`index.html`) reads the same store; the
sections below are the narrative and may lag it — when they disagree, the store wins.*

## 1. The one-paragraph version

Evan is a **new 40K player**. On 2026-07-21 he bought a painted ~2,000-pt **Chaos Daemons "Shadow Legion"** army on
eBay (lot 236942163636; $840 landed; Word Bearers red/black theme) built around **Be'lakor**, then in late July / early
August added a **Bloodthirster** (on the sprue), **Obsidius Mallex** as a Chaos Lord, **Flesh Hounds**, a **Bloodmaster with
nine Bloodletters**, and two lots still inbound (a Khorne daemon army lot, a Bloodcrushers lot) — ≈ $1,391 across seven
orders. A photo re-audit on 2026-07-27 corrected the seller's list (no Beasts, Plague Drones, Terminators or Bloodletters
in the original box; three Flamers and ten Cultists nobody listed). Rules were re-verified from primary sources on
2026-07-27 (11th edition, MFM v1.1): six 2,000-pt lists (A–F) exist — **A is complete and playable today, F needs only the
Bloodthirster assembled** — with a beginner's Primer for each and a personal codex (*The Umbral Creed*) for flavour.
Since 2026-08-11 everything numeric lives in one store, `data/muster.json`, read by the **Muster** console (`index.html`)
and by `muster.py`, which regenerates the tables in the prose docs. A **value scorecard** still scores every painted army
on eBay's feeds (that tooling found the lot). Everything is in the public repo `evbarleyg/40k-armies`, served at
`https://evbarleyg.github.io/40k-armies/` from `main`. Explain jargon inline when talking to Evan — he wants to learn unit
roles and nuances, not be handed conclusions.

## 2. Where things live

| Thing | Location |
|---|---|
| **The store** — units, audited inventory, orders, six lists, rules gists, hobby queue, games, buying notes | `data/muster.json` (edit this; `python3 muster.py build` validates it and regenerates everything downstream) |
| **Muster**, the console (own · field · buy · arriving; collection, lists + linter, builder, crates, hobby, games) | `index.html` + `app.js` + `app.css`; the linter `lint.js` is shared with `muster.py` (via `tools/lint_cli.js`); build log `DECISIONS.md`; spec `SPEC-muster.md` |
| Site | GitHub Pages from `main`: `https://evbarleyg.github.io/40k-armies/`; any branch via `raw.githack.com/evbarleyg/40k-armies/<branch>/index.html`; dated material behind `archive.html` |
| The army page (audited inventory, six lists, verified rules — tables generated) | `quartermaster.md` → `quartermaster.html` |
| The codex (fiction, unit entries, doctrines, **the purchase ledger** — table generated) | `codex-umbral-creed.md`, `codex-umbral-creed.html` |
| Rules explainer | `belakor-shadow-legion-guide.md` → `rules-guide.html` |
| The vision (painting rules, unit treatments, phases, what is left to buy, transport) | `docs/VISION.md` → `vision.html`; research digests in `docs/research/` |
| Full play guide | `docs/PRIMER.md` → `primer.html`; print layout `guide.html` → `GUIDE.pdf` (31 pp, `./make_guide.sh`) |
| Lists with history and corrections (archived) | `docs/lists.md` |
| Rules digest + re-verification | `docs/research.md` |
| Pre-audit box inventory (archived; superseded by the store) | `docs/collection.md` |
| Buy targets and prices for the lists — the 2026-08-14 price scan (US retail floors, bundle maths, eBay leads to open by hand) above the 2026-07-27 photo-graded scout (archived — listings ended) | `docs/SCOUT_REPORT.md` → `scout.html`; data `data/scout-2026-08-14.json` (101 rows, 35 priced) and `data/scout-2026-07-27.json` (114 listings) — Muster reads the one registered last in `buying.scan_log`; tools `tools/ebay_search.js`, `tools/ebay_fetch.js` |
| Painted-army value scorecards | `build.py` + `data/raw_*.psv` → `scorecard.html`, `chaos.html` |
| Photo paint-tier sweep (2026-07-21) | `docs/sweep-2026-07-21.md`; tiers merged via the `SWEEP` overlay in `build.py` |
| How to reach eBay from a cloud session | `docs/ebay-access.md` |
| House rules for any session | `CLAUDE.md` |
| Provenance | `docs/HANDOFF_2026-07-27.md`, `archive/` |

Accounts: the repo is on Evan's personal GitHub (`evbarleyg`, admin); his work-linked GitHub identity
`ebg-ant` has write access, so Claude sessions from either Claude account can push. The earlier
private repo `evbarleyg/daemon-quartermaster` (personal) held the army project until 2026-08-11; its
files were brought here verbatim and it can be archived. Two lines of Claude work met in this repo on 2026-08-11: one
(sessions on branch `claude/chaos-daemons-40k-guide-…`, merged to `main`) wrote the codex, the audited `quartermaster.md`,
the rules guide, the Muster spec and the Pages workflow; the other (branch `claude/40k-work-consolidation-…`) consolidated
the July material, wrote the vision and built Muster. `DECISIONS.md` §2 is the dedupe map. Artifacts: work account —
"Shadow Legion HQ" (site mirror), "Shadow Legion Quartermaster" (Jul 27), "REPORT.md" (the sweep); personal account —
the original Quartermaster, the ledger and the Battle Doctrine deck (unreadable from the work account; their content is
in `quartermaster.md`).

## 3. The collection

The table lives in the store and renders in Muster and on `quartermaster.html`; the generated block at the top of this
file carries the current counts. What a session needs to know beyond the numbers: the Jul 27 photo re-audit is the
baseline (seller misreads removed, unlisted Flamers and Cultists added); paint is a competent tabletop standard in the
gods' own colours with Word Bearers red/black marines; the Bloodthirster is the one unbuilt model; nine Bloodletters were
counted against ten listed; the Cultist count is approximate; two crates are pending catalogue and are never counted
until opened (Muster's crate mode turns a crate into inventory rows and a patch for the store).

## 4. Rules that shaped the lists (verified 2026-07-27; re-verify in the official app before an event)

- **Shadow Legion** (Chaos Daemons detachment): *Thralls of the First Prince* lets specific CSM
  datasheets in — **Chaos Lord and Master of Possession are explicitly allowed** — and bans every
  DAEMON PRINCE and every **EPIC HERO except Be'lakor**. So **Skulltaker and Karanak are illegal**
  (the original List 2 used both; fixed with Skullmaster + Bloodmaster). Skarbrand likewise.
- **Bloodthirster**: one unified datasheet at **320 pts** (an old "~165" was a scrape error), and it
  **can take Fade to Darkness** (it's a Shadow Legion Character, not an Epic Hero). Be'lakor 390 +
  Bloodthirster 320 + Lord of Change 320 = 1,030, so all three fit in 2,000.
- **War Dogs**: up to 3 in any all-CHAOS army via *Dreadblades*; they can't be Warlord or take enhancements.
- **Be'lakor must be the Warlord** whenever he is in the list.
- ~15 points values in the first notes were wrong (e.g. Pink Horrors 150 not 85, Havocs 125 not 165,
  Chosen 135 not 90, Terminators 175 not 145, Bloodcrushers 95/190) — `docs/research.md` has the audit.

## 5. The six lists (2,000 pts, Shadow Legion; rosters, legality and gaps live in the store — see Muster or `quartermaster.html`)

A · Yo-Yo Court (teleport control; **complete**) · B · Festering Court (Nurgle attrition + War Dogs; needs Beasts and
Drones) · C · Word Bearers Ascendant (marine deep-strike wave; the most buying left) · D · Crimson Cavalry (Khorne turn-one
alpha) · E · the Fadethirster (the tournament silhouette; stored at 1,980 with Screamers since Skullmaster went to 85) ·
F · Triple Monster (Be'lakor + Bloodthirster + Lord of Change; **assembly only**). The road: learn on A, assemble the
Bloodthirster for F, let the two crates decide how close E and D are, then a Skullmaster and a Rendmaster are the only
purchases the tournament shape still needs. House rule: ten games before the next model. Meta note (Aug 10): Purge the
Foe, the detachment's disposition, has dropped out of winning tournament lists since the July update — irrelevant for
learning games, one more reason not to rush the Khorne cavalry.

## 6. eBay: what exists and the house rules

- **Everything price-related is a dated snapshot** (scorecard feed 2026-07-20, sweep 07-21, shopping
  scrape 07-26, scout 07-27, price scan 08-14). Assume every specific listing has ended; the *methods* and *grades* hold.
  The Aug 14 scan was made through a web-search index (no photos, nothing confirmed live): trust its new-kit ceilings
  (Blood Throne $48 web-exclusive, Skullmaster $52 GW-direct resin, Plague Drones $65 web-exclusive, most trade kits 15%
  off at US discounters with free shipping from $75), treat its eBay item numbers as leads to open. Headline: a new Blood
  Throne kit at $45 free-shipped (eBay 167360168204) and Skullmaster at $44–45 put List E's remaining pair at ≈ $90–100;
  B ≈ $170, C ≈ $187 new. US import duty now applies to every foreign parcel (de minimis suspension made permanent
  2026-06-24) — buy US-located.
- **Read-only, always**: load public pages and photos; never log in, bid, offer, watch, message or check
  out for Evan. Present findings; he buys.
- **Paint is judged from full galleries + zoom crops, never titles.** Strict scale: PRIMER-ONLY /
  PARTIAL (any unpainted or primed squad → not a finished army) / Basic / Tabletop / Tabletop+ /
  High TT-Display. Flag auctions (a bid is not a price), split lots ("1 of 2"), 3D prints, merged
  schemes, low-feedback sellers.
- Scorecard value model: `ratio = (kit MSRP × paint premium) / (price × 1.03 + $35)`, MSRP ≈ points ×
  $0.45 unless itemized; premiums Partial/Primer 1.0 · Basic 1.3 · Tabletop 1.6 · Tabletop+ 2.0 ·
  High TT 2.5 · Display 3.5; ≥ 1.5 BUY, 0.8–1.49 FAIR, < 0.8 SKIP; AUCTION/SOLD/COMMISSION unscored.
- The 07-21 sweep of 29 shortlisted armies: 1 High TT/Display (pink Tyranids 158101528667, ~$385 —
  commission work), 6 Tabletop+, 7 Tabletop, 3 Basic, **10 Partial**, 1 primer-only, 1 sold. Lesson:
  "pro painted / tournament ready" titles routinely hide primer-grey squads in photo 12 of 20.
- Reaching eBay from a cloud agent: curl is Akamai-403'd on item/search pages; headless Chromium works
  with the post-quantum-TLS policy off and a consistent UA — `docs/ebay-access.md`, `tools/`.

## 7. Decisions log

- 2026-07-20/21 — Bought lot 236942163636 ($730 + tax and shipping = $840.18 landed; ordered on the 20th, dated the 21st in the ledger) rather than an army + a separate painted Be'lakor
  (no complete Be'lakor armies were listed; singles ran $450–600 from Eastern-EU sellers).
- 2026-07-20 — Scorecard: never score a current auction bid (two "4.9×/4.8× steals" were opening bids).
- 2026-07-21 — Paint tiers come from photos only; strict Partial rule adopted.
- 2026-07-27 — The Jul 20 shopping plan (Night Lords mega-lot $650 + Seekers lot + Bloodletters,
  ~$830) was **dropped**: Bloodletters were already in the box, Seekers are in no list, and targeted
  $20–350 buys per list beat a mega-lot. Skip Red Corsairs lots (duplicate what's owned) and anything
  whose centrepiece is an Epic Hero.
- 2026-07-27 — Lists renumbered A–F; List 2's Skulltaker/Karanak replaced (illegal); E and F added.
- 2026-07-27 — Publishing the then-private repo as a site was deliberately left undecided (it would
  have made the collection and buy plans public).
- 2026-08-11 — Evan asked to consolidate everything into this (public) repo and make the pages here;
  `daemon-quartermaster` is superseded. GitHub Pages on this repo is his one-click call (Settings → Pages).
- 2026-08-11 — Vision adopted as the working plan (`docs/VISION.md`): "everything stands inside Be'lakor's
  shadow" — pale ash ground, shadow rising up every daemon, one cold light (whatever burns on Be'lakor's blade),
  crimson and bronze only on the mortals, Colchisian script on everything; War Dogs as House Korvax outriders;
  buy bare/NoS over painted from now on; magnets on steel in Really Useful Boxes for transport.
- 2026-08-11 — The two lines of work were reconciled: `main`'s codex, audited inventory and ledger are the facts; the
  overnight branch's pages were corrected to them; nothing was deleted (dedupe map in `DECISIONS.md`). GitHub Pages is live.
- 2026-08-11 — Muster adopted per `SPEC-muster.md`: one canonical store (`data/muster.json`), one linter (`lint.js`),
  generated tables in the prose docs, a validation gate in the build, and a review-battery hillclimb logged in `DECISIONS.md`.
  List E stored at 1,980 (Screamers for Plague Drones) to stay legal after the Skullmaster re-cost.
- 2026-08-14 — Price scan of every gap unit through a web-search index (`docs/SCOUT_REPORT.md`, `data/scout-2026-08-14.json`;
  Muster prices gaps from the snapshot registered last in the store's `buying.scan_log`). Nothing bought and the ten-games rule untouched; the scan
  records that the Blood Throne kit ($45 new, free-shipped) is the one price unlikely to improve, that the pair List E still
  needs is ≈ $90–100, that List B is ≈ $170 and List C ≈ $187 new, and that no bundle beats singles unless the crates
  disappoint (then the Combat Patrol or a $98 on-sprue Khorne split does). New do-not-buy lines: overseas parcels (duty),
  Cannon-built "Rendmasters", collector-priced classic Beasts, Boarding Patrol / Khorne Daemonkin shortcuts.

## 8. Open threads

1. Catalogue the two crates in Muster when they land (Khorne lot window Aug 10–17; Bloodcrushers Aug 18–Sep 1), export the
   store, commit; the lists recompute.
2. Assemble and paint the Bloodthirster (unlocks F; the vision's set-piece project); Phase 0/1 of the vision (basing, one
   varnish, one light) whenever painting starts.
3. Play List A and log the games (ten before the next purchase); then Skullmaster + Rendmaster if the tournament shape calls
   (≈ $90–100 for the pair at Aug 14 prices — leads and ceilings in `scout.html`; open the listing and its photos first, US sellers only).
4. Re-verify points in the official app before any event — MFM will move again (~Aug 19–26 expected); edit the store, not the docs.
   When C or D gets close: the Raptors/Warp Talons kit was replaced on 2026-08-08 (old-kit stock or the new $65 box both build
   legal Warp Talons) and the January faction pack gave Warp Talons GRENADES — re-read that datasheet too.
5. Owner taste questions parked in `DECISIONS.md` §6 (warband naming, codex-skin default, list parity with the personal
   ledger artifact, Beasts of Nurgle points).
6. Scorecard refresh whenever the market matters again: `scrape.js` → `data/raw_listings.psv` → `python3 build.py` →
   photo-sweep the BUYs; targeted single-unit scouting with `tools/ebay_search.js` from a machine that can reach eBay
   (this cloud environment cannot — the Aug 14 scan went through a search index instead; a new dated
   `data/scout-YYYY-MM-DD.json` in the same shape, registered in `buying.scan_log`, reprices every gap; the build warns
   if a newer file sits in `data/` unregistered).
7. `daemon-quartermaster` (personal, private) can be archived.

## 9. Working on this repo

```bash
pip install markdown             # once (doc rendering); node is needed for the legality lint
python3 build.py                 # muster.py build (validate store → muster.js + generated tables) → rescore market data → render docs + nav
python3 muster.py check          # battery gate: store valid AND every generated region in sync
python3 muster.py fmt            # re-format data/muster.json after hand edits
NODE_PATH=$(npm root -g) ./make_guide.sh   # GUIDE.pdf from guide.html (needs node playwright + Chromium)
```

Facts go in `data/muster.json` (units, inventory, orders, lists, rules); prose goes in the docs; `python3 build.py`
keeps them consistent and refuses to build an invalid store. Add a page: drop a markdown file in `docs/`, register it in
`DOCS` (and `NAV`) in `pages.py`. Keep this file and `CLAUDE.md` truthful.
