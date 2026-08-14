# HANDOFF — pickup context for a local session

*Written 2026-08-14 by a remote Claude Code session that could not reach eBay.
The blocker is environmental, not analytical: this repo's remote sandbox blocks
all commercial egress (eBay, Etsy, Mercari, Noble Knight, TrollAndToad,
Whatnot, Reddit, Wahapedia, github.io). A local session with browser access can
finish what's below in one sitting.*

---

## 1. What this project is

`evbarleyg/40k-armies` — a value scorecard for buying painted Warhammer 40,000
armies on eBay, which has grown a second half: a personal codex for the
collection those purchases built.

The army is a **Chaos Daemons "Shadow Legion"** force led by **Be'lakor**, with
a Word Bearers-themed Chaos Space Marine half and a Khorne wing added in
August. Files worth reading, in order:

| File | What it is |
|---|---|
| `quartermaster.md` | Audited inventory, six 2,000-pt lists, verified rules, buy queue |
| `codex-umbral-creed.md` | The personal codex: lore, unit entries, doctrines, purchase ledger |
| `belakor-shadow-legion-guide.md` | Rules explainer with sources |
| `SPEC-muster.md` | Spec for unifying all frontends into one app (separate, unstarted) |
| `scrape-search.js` | **The tool for the task below** |

Detachment constraints that govern every buying decision: **no vehicles, no
Daemon Princes, no Epic Heroes except Be'lakor** (so Skarbrand, Skulltaker, and
Karanak are all illegal). Be'lakor must be Warlord.

## 2. The task

**Find the best deal on a genuine, painted Bloodthirster and report it with
landed prices.** Do not buy anything — this repo organizes listings, it never
transacts. Present a ranked shortlist and let Evan decide.

### Why this purchase is real and not redundant

Evan appears to own a Bloodthirster. He does not. The `$65` "Exalted Blood
Thirster" delivered Aug 4 turned out to be a **3D-printed ABS resin kit on a
100mm base** (a true Bloodthirster is **120mm oval**), disclosed only in the
listing's description body while the photo showed the seller's own painted GW
model "for reference only." It is fine casually and banned at GW-run events. So
he currently owns **zero official Bloodthirsters**, and this is a genuine gap.

### How to run it

1. Load an eBay search, for example:
   - `https://www.ebay.com/sch/i.html?_nkw=bloodthirster+painted&LH_PrefLoc=1&_udhi=300`
   - also try `blades of khorne bloodthirster` (Age of Sigmar box, **identical
     model**, routinely cheaper) and `wrath of khorne bloodthirster` (one of
     the three builds from the same kit)
2. Paste `scrape-search.js` into the DevTools console. It scores every tile:
   landed cost, plus `NOT-GW?` / `WRONG?` / `unpainted?` / `AUCTION` flags.
   (Chrome requires typing `allow pasting` in the console once per site.)
3. **Then do the part the script cannot: open each surviving candidate and read
   the description body.** This is the whole ballgame — the last three misfires
   were all invisible from search tiles. Search each description for: *resin,
   3D, print, proxy, recast, STL, alternative, unofficial, reference only*, and
   for a stated base size. **Demand 120mm oval.** A stated "100mm" means it is
   not a GW Bloodthirster kit.
4. Check the photos for scale — a Bloodthirster next to a Space Marine or
   Bloodletter should tower, roughly double their height on a base four times
   the footprint. This single check separates it from a Daemon Prince instantly.

### Decision rules

Landed cost = **(item + shipping) × 1.1055**. That rate is Evan's exact
effective tax for 98144, derived from the ledger and verified to the cent
against three past orders ($30 + $10.80 → $45.10; $65 + $5.58 → $78.03).

Benchmarks from the 2026-07-27 scouting pass: painted Buy-It-Now **$213
landed**, painted auction **~$191**, unpainted **~$83**, implied paint premium
**~$130**.

| Landed | Verdict |
|---|---|
| < $150 | STEAL |
| < $180 | GOOD |
| < $220 | FAIR |
| ≥ $220 | SKIP — worse than what the market offered three weeks ago |

**Auto-reject:** metal / OOP / vintage sculpts (wrong, smaller model), Forge
World (different model, four figures), anything flagged resin or 3D-printed,
and Skarbrand (Epic Hero, illegal in the detachment).

## 3. State of the collection

**Owned and painted:** Be'lakor (390) · Lord of Change (320) · Fateskimmer (95)
· Exalted Flamer (65) · Flamers ×3 (65) · Pink Horrors ×10 (150) · Blue Horrors
×10 (125) · Brimstones ×9 · Screamers ×3 (80) · Nurglings ×3 bases (45) ·
Cultists ×10 (50) · Master of Possessions (60) · Possessed ×5 (120) ·
Legionaries ×10 (170, or 90 per five) · Havocs ×5 (125) · War Dog Karnivores ×2
(310, Chaos Knights allies) · Chaos Lord "Obsidius Mallex" · Flesh Hounds ×5
(75) · **two** Bloodmasters and **two** Bloodletter bricks (~20 letters total).

**Owned, not usable as-is:** the 3D-print Bloodthirster (above) · a winged
**Daemon Prince** from the Aug 13 lot, which the detachment bans outright —
usable in any other Chaos Daemons detachment, or as a Bloodthirster proxy on a
120mm oval.

**Inbound:** a Bloodcrushers lot, "some damaged," ETA Aug 18 – Sep 1.

**Total spent to date: ≈ $1,391.**

### Remaining gaps, in priority order

1. **Genuine painted Bloodthirster** — the task above.
2. **Skullmaster** and **Rendmaster on Blood Throne** — the last pieces of the
   "Fadethirster" tournament list. Worth scoring in the same session with the
   same script; no painted Buy-It-Now existed for either as of July 27, so a
   saved search may be the right answer.
3. Five more Flesh Hounds; Warp Talons or Raptors for mobile CSM.
4. Fast Slaanesh scoring (a Seekers lot went unpurchased in July).

## 4. Also worth doing while local

- **Confirm the exact Bloodletter count** from the Aug 13 crate (photo showed
  ~9–10 including the Bloodmaster). `quartermaster.md` and the codex both carry
  a "confirm count" marker that should be resolved.
- **Repair note:** the July 28 Bloodletters arrived damaged in shipping; the
  seller (`mcke_6946`) confirmed on Aug 11 they shipped intact. No claim filed.
  If repairs happen, note it against that ledger entry.
- **Verify the codex renders.** `codex-umbral-creed.html` has never been opened
  in a normal browser — it was only ever viewed through the artifact viewer, and
  the remote session cannot reach the deployed site. Load
  `https://evbarleyg.github.io/40k-armies/codex-umbral-creed.html` and check
  layout at phone width and desktop, light and dark. Fix anything broken.

## 5. Conventions

- Points are **MFM v1.1 (22 Jul 2026)**, audited 2026-07-27. The official app is
  the arbiter; carry the snapshot date on anything new.
- Don't hand-edit numbers into two places. If a figure appears in both
  `quartermaster.md` and `codex-umbral-creed.md`, change both in one commit —
  the whole point of `SPEC-muster.md` is that this duplication is a known bug.
- `codex-umbral-creed.html` is the styled twin of the markdown codex. Edits to
  one need mirroring in the other. It is also published as a private artifact;
  ask Evan for the URL if it needs redeploying.
- **Pushing to `main` auto-deploys GitHub Pages** via
  `.github/workflows/pages.yml`. The site serves the repo root.
- Flavor writing in the codex is dry and restrained: the fiction is seasoning,
  the tool wins any conflict with it. No glee, no emoji.

## 6. Evan's own standing rule

From `shadow-legion-strategy.md`, still in force: **after the current arrivals
are catalogued, play ten games before buying another model.** Surface it when
presenting the shortlist. It's his rule and his call — state it once, don't
enforce it.
