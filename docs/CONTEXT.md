# 40K context — read this first (state as of 2026-08-11)

Portable summary of Evan's Warhammer 40,000 work: what he owns, what has been decided, what is
open, and where everything lives. Written for a Claude session on **either** account (personal or
work) — sessions, artifacts and memory don't cross accounts, this repo does. If you change the state
of the army or the plan, update this file in the same commit.

## 0. Current state (generated — do not edit by hand)

<!--gen:state-->
- **Store:** `data/muster.json` (schema 1, updated 2026-08-11); points Munitorum Field Manual v1.1 (2026-07-22), rules verified 2026-07-27. 2026-08-10: Skullmaster 85 (was ~75); nothing else in these lists moved. Next balance window expected ~2026-08-19/26.
- **Owned:** 21 inventory records, 92 models, 2,720 fieldable pts; spent ≈ $1,391 over 7 orders.
- **Inbound:** Khorne Daemons Army Lot — Shipped Aug 6 (USPS), ETA Aug 10–17; Bloodcrushers lot — ETA Aug 18–Sep 1 (reconfirmed 2026-08-11).
- **Lists:** playable today: A (1,940); hobby work first: F (2,000); need purchases: B (1,960), C (1,920), D (1,995), E (1,980).
- **Games logged:** 0 (rule: 10 before the next model, counting after the current arrivals (o6, o7) are catalogued).
<!--/gen:state-->

*Generated from `data/muster.json` by `muster.py build`. The Muster app (`index.html`) reads the same store; the
sections below are the narrative and may lag it — when they disagree, the store wins.*

## 1. The one-paragraph version

Evan is a **new 40K player**. On 2026-07-20/21 he bought a painted ~2,000-pt **Chaos Daemons
"Shadow Legion"** army on eBay (lot 236942163636, $730, Word Bearers red/black theme) built around
**Be'lakor**. The rules were re-verified from primary sources on 2026-07-27 (11th edition, Munitorum
Field Manual v1.1): six legal 2,000-pt lists (A–F) exist with a beginner's Primer explaining how to
play each, plus a priced shopping list per list. Separately, a **value scorecard** scores every
fully-painted army for sale on eBay (that tooling found the lot), and a photo sweep graded 29 of those
listings' paint honestly. Everything is in the public repo `evbarleyg/40k-armies`; `index.html` is the hub.
Explain jargon inline when talking to Evan — he wants to learn unit roles and nuances, not be handed conclusions.

## 2. Where things live

| Thing | Location |
|---|---|
| Hub / site | `index.html` → Army (`quartermaster.html`) · Primer · Market (`scorecard.html`) · Archive (`archive.html`, all dated material) · Context. GitHub Pages URL once enabled: `https://evbarleyg.github.io/40k-armies/`; any branch via `raw.githack.com/evbarleyg/40k-armies/<branch>/index.html` |
| The vision (narrative, five painting rules, unit treatments, phases, buying order, transport) | `docs/VISION.md` → `vision.html`; its research digests in `docs/research/` |
| Collection, six lists, verified rules | `quartermaster.html` (the "Shadow Legion Quartermaster" ledger) |
| Full play guide | `docs/PRIMER.md` → `primer.html`; print layout `guide.html` → `GUIDE.pdf` (31 pp, `./make_guide.sh`) |
| Lists with history and corrections | `docs/lists.md` |
| Rules digest + re-verification | `docs/research.md` |
| What came in the box | `docs/collection.md` |
| eBay buy targets for the lists (2026-07-27, archived — prices expired) | `docs/SCOUT_REPORT.md`, data `data/scout-2026-07-27.json` (114 listings), tools `tools/ebay_search.js`, `tools/ebay_fetch.js` |
| Painted-army value scorecards | `build.py` + `data/raw_*.psv` → `scorecard.html`, `chaos.html` |
| Photo paint-tier sweep (2026-07-21) | `docs/sweep-2026-07-21.md`; tiers merged via the `SWEEP` overlay in `build.py` |
| How to reach eBay from a cloud session | `docs/ebay-access.md` |
| House rules for any session | `CLAUDE.md` |
| Provenance | `docs/HANDOFF_2026-07-27.md`, `archive/` |

Accounts: the repo is on Evan's personal GitHub (`evbarleyg`, admin); his work-linked GitHub identity
`ebg-ant` has write access, so Claude sessions from either Claude account can push. The earlier
private repo `evbarleyg/daemon-quartermaster` (personal) held the army project until 2026-08-11; its
files were brought here verbatim and it can be archived. Claude artifacts that exist in the work
account: "Shadow Legion Quartermaster" (= `quartermaster.html`) and "REPORT.md" (= the sweep). The
personal account has the original Quartermaster artifact (= `archive/quartermaster-2026-07-25.html`).

## 3. The collection (eBay lot 236942163636, $730, acquired 2026-07-21)

Points are MFM v1.1 (2026-07-22) as verified on 2026-07-27, not the seller's numbers.

| Unit | Count | Pts | Notes |
|---|---|---:|---|
| Be'lakor | 1 | 390 | Must be Warlord (Supreme Commander). The only Epic Hero the detachment allows |
| Lord of Change | 1 | 320 | seller had 300 |
| Fateskimmer | 1 | 95 | |
| Exalted Flamer | 1 | 65 | |
| Nurglings | 3 bases | 45 | Infiltrators, OC 0 |
| Pink Horrors | 10 | 150 | |
| Blue Horrors | 10 | 125 | alt unit / split tokens |
| Brimstone Horrors | 9 | — | split tokens only |
| Flamers | 3 | 65 | |
| Screamers | 3 | 80 | |
| Havocs (2 lascannon, 2 autocannon) | 5 | 125 | CSM ally |
| Legionaries | 10 | 170 (or 2×5 at 90) | CSM ally |
| Master of Possession | 1 | 60 | legal in Shadow Legion |
| Possessed | 5 | 120 | CSM ally |
| War Dog Karnivore | 2 | 310 | legal via Chaos Knights *Dreadblades* (≤3, no Warlord, no enhancements) |
| *Photo-extras, not on the seller's list — confirm against the box:* | | | |
| Beasts of Nurgle | ~3 | ~225 | |
| Plague Drones | ~3 | ~110 | |
| Bloodletters | ~10 | ~110 | |
| Chaos Terminators | ? | ~175 | |

Playable total with Pinks ≈ **1,985 pts** (the seller's "2,110" double-counted the Pink/Blue either-or).

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

## 5. The six lists (all 2,000 pts, Shadow Legion; full rosters in `quartermaster.html`, play guides in the Primer)

| | List | Idea | Buy cost (Jul 27 scout, landed) | Start here? |
|---|---|---|---:|---|
| A | The Yo-Yo Court | Tzeentch shooting core holds; Chaos Lord + Legionaries deep-strike, kill, *Fade*, return free | ~$91–117 | after B/F |
| B | Festering Court | Nurgle Beasts/Drones squat objectives and refuse to die; War Dogs + Havocs shoot | ~$39 | **yes — cheapest** (uses the photo-extras) |
| C | Word Bearers Ascendant | the marine half deep-strikes with Dark Pacts; daemons garnish | ~$159–213 | theme pick |
| D | Crimson Cavalry (fixed) | Khorne turn-1 alpha: Skullmaster + 6 Bloodcrushers scout-advance-charge | ~$480–545 | later, highest variance |
| E | The Fadethirster | tournament shape: Crushers T1, Bloodthirster drops T2, kills, Fades, re-enters | ~$388–490 | once comfortable |
| F | Triple Monster | Be'lakor + Bloodthirster + Lord of Change, three 6" Shadow auras | ~$109–188 | **yes — most forgiving** |

Shared buys across A/C/D: a Chaos Lord (~$20–30), Cultists ×10 (~$28), Flesh Hounds ×5. E and F both
need one Bloodthirster (~$110–170 painted; NIB BIN was ~$143). Daemon kits are shared with Age of
Sigmar — "Blades of Khorne" listings are the same models, often cheaper.

**List 0 — the box as it came is already legal at 1,995**: Be'lakor, Lord of Change, Fateskimmer, Exalted
Flamer, Pink Horrors ×10, Flamers, Screamers, Nurglings, Havocs, Legionaries ×10, MoP → Possessed, 2 War Dogs
(HA 475/1,000). Play it before buying anything (`docs/VISION.md`, "Playing it while it grows").
**Aug 10 re-check:** Skullmaster is 85 pts (not ~75) → D = 1,995, E as printed = 2,010 (swap Plague Drones for
the owned Screamers → 1,980). No other points moved since MFM v1.1; GW's next update is due ~Aug 19–26, and
Purge the Foe (Shadow Legion's disposition) has dropped out of winning tournament lists since the July update —
irrelevant for learning games, a reason not to rush the ~$250 Khorne-cavalry buy for List E.

## 6. eBay: what exists and the house rules

- **Everything price-related is a July snapshot** (scorecard feed 2026-07-20, sweep 07-21, shopping
  scrape 07-26, scout 07-27). Assume every specific listing has ended; the *methods* and *grades* hold.
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

- 2026-07-20 — Bought lot 236942163636 ($730) rather than an army + a separate painted Be'lakor
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

## 8. Open threads

1. Confirm the vision's "as it came" assumptions against the box, then Phase 0 (inventory, measure the monsters,
   magnetise, four test models, a game with List 0). Choose B or F (or A) and buy for it — Bloodthirster first per the
   vision; re-run the scout before buying (from a machine that can reach eBay).
2. Inventory the box against `docs/collection.md`; settle the photo-extra counts (Beasts, Drones, Bloodletters, Terminators?).
3. Re-check `~` points and Dreadblades in the official app before any event; MFM will move again.
4. Transport: asked, never sized — N52 magnets + a steel-lined box/rack for the three big models, foam for infantry, magnetised wings.
5. Scorecard refresh whenever the market matters again: `scrape.js` → `data/raw_listings.psv` → `python3 build.py` → photo-sweep the BUYs.
6. Enable GitHub Pages (admin-only setting) and archive `daemon-quartermaster`, or add `ebg-ant` to it.
7. Note: the work account's default cloud environment (Aug 2026) cannot reach ebay.com (egress policy); eBay passes
   have to run from the personal machine or the July cloud environment.

## 9. Working on this repo

```bash
pip install markdown             # once
python3 build.py                 # rescore data → listings/chaos .json/.js, then render docs + sync nav (pages.py)
python3 pages.py                 # docs only
NODE_PATH=$(npm root -g) ./make_guide.sh   # GUIDE.pdf from guide.html (needs node playwright + Chromium)
```

Add a page: drop a markdown file in `docs/`, register it in `DOCS` (and `NAV` if it deserves the top
strip) in `pages.py`, run it. Keep this file and `CLAUDE.md` truthful.
