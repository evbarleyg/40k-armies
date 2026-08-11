# DECISIONS — Muster build log

The owner reads this file to trust the result without replaying the process (`SPEC-muster.md` §6).
Newest entries at the bottom of each section; every waived finding is recorded with a reason.

## 0. Ground rules for this build (2026-08-11)

- **One truth.** `data/muster.json` is the canonical, hand-maintained store (units, inventory, orders,
  lists, rules gists, hobby state, games, buying gaps). Everything numeric anywhere else is either
  generated from it (`muster.py` rewrites the marked regions in `quartermaster.md`, `codex-umbral-creed.md/.html`,
  `docs/CONTEXT.md`, and emits `muster.js` for the app) or carries a "snapshot — see the app" line.
  Market listings stay in `data/raw_*.psv` → `build.py` → `listings.json` / `chaos.json` (generated);
  the hand-checked paint tiers move nowhere yet (see §3, decision D6).
- **No reverts, no replicas.** Nothing from either line of work is deleted. Where two surfaces did the
  same job, one becomes the live surface and the other is regenerated from the store or moved behind
  the archive with a banner. The dedupe map in §2 says which and why.
- **Merge hygiene.** Files that arrived from `main` (`codex-umbral-creed.*`, `quartermaster.md`,
  `belakor-shadow-legion-guide.md`, `SPEC-muster.md`, `.github/workflows/pages.yml`) are edited only
  additively (marker comments around generated tables, one disclaimer line) so a later edit on `main`
  merges cleanly; `main` is re-fetched and merged before every push.
- **The hillclimb is real.** Milestone → review battery (screenshots judged by non-builders, fresh-eyes
  functional lenses, adversarial verification of each finding, four-questions test, data-integrity gate)
  → fix → re-run until two consecutive dry batteries. Results are logged in §5.

## 1. Proposal — ideas of my own (§7 of the spec)

Marked ★ = would fight for it. Cheap ones ship; taste-heavy ones are listed as owner questions in §6.

1. ★ **Crate mode.** Arrivals is a phone-first checklist: pick the inbound order, tick what actually came
   out of the box (with the order's expected contents pre-filled as guesses and an "unlisted find" row,
   because the July audit found Flamers and Cultists nobody listed), set paint state per unit, and the app
   produces both an updated `muster.json` to download and a short paste-able instruction block for a Claude
   session to apply and commit. One sitting, no typing of unit names.
2. ★ **The linter explains itself.** Every legality rule is a data gist with source URL and verified date;
   each flag renders as one plain-English sentence plus the rule text and why it matters, because the
   owner is new to the game. A rules change is a JSON edit.
3. ★ **Gap-aware buying.** Every market listing card says which lists it advances or completes and what the
   remaining gap would cost; the do-not-buy list renders as red warnings on matching listings; auctions
   keep the "a bid is not a price" guard. The buy view opens on "gaps first", not "best ratio first".
4. **The four questions are the home screen.** Own / Field today / Buy next / Arriving are four panels on
   the landing view, each answering in one glance and linking to its full view. The spec's acceptance test
   becomes the information architecture instead of a test bolted on afterwards.
5. **Points-drift guard.** The store carries the MFM snapshot tag and per-unit `verify` flags; the app shows
   the snapshot age and the next expected balance window; `muster.py validate` warns when the snapshot is
   older than 45 days. Nobody re-researches rules inside the app.
6. **Paint queue from list goals.** The hobby view is not a flat backlog: pick the list you want fully
   painted and it shows exactly which models stand between you and that (today: assemble and paint one
   Bloodthirster for Triple Monster), with the hour estimates from the vision's phase plan.
7. **Ten-games counter with teeth** (nobody asked). The game log's counter sits on the home screen; while it
   is under ten, buy recommendations render greyed with the standing rule quoted — overridable, dryly.
8. **Codex skin.** A theme toggle that re-dresses the same records in the codex's parchment, small caps and
   unit epithets (The Source, The Anagnost…). Off by default: the tool wins, the fiction seasons.
9. **Session hand-off button** (nobody asked). "Copy briefing" produces a compact state summary (owned,
   inbound, list status, open questions, pending patches) for pasting into a Claude session from either
   account — the numbers in `docs/CONTEXT.md` stop being hand-maintained.
10. **Exports.** Any list as tournament-legible plain text; collection as CSV; the codex already prints.

## 2. Dedupe map — what existed twice, what survives as the live surface

| Capability | From `main` | From the overnight branch | Decision |
|---|---|---|---|
| Inventory | `quartermaster.md` (Jul 27 photo re-audit + August arrivals) — **correct** | `quartermaster.html`, `docs/collection.md` (pre-audit, with refuted "photo-extras") | Store seeded from `quartermaster.md`; both files' tables become generated regions; `collection.md` stays archived with its banner. |
| Purchase ledger | Codex Part VI — **correct** ($1,391, seven orders) | none (branch assumed nothing bought since Jul 27) | Store `orders`; codex tables (md + html) become generated regions. |
| Six lists | `quartermaster.md` status table; codex Part V (three lists in prose) | `quartermaster.html` full tables, `docs/lists.md`, Primer play guides | Store `lists` seeded from the full tables (the only complete compositions in the repo); status/gaps computed, never typed. Owner question Q3 covers parity with the personal ledger artifact. |
| Rules gists | guide §3–4, `quartermaster.md` "Rules verified" | `docs/research.md` (verbatim Thralls text, Epic Hero list, points table, enhancements) | Store `rules` merges both, each gist with source + date; guide and research stay as prose. |
| Fiction | Codex: the Umbral Creed / Long Shadow Host (Sor Vekh, The Source, The Anagnost…) | Vision: Host of the Eclipsed Word (names table) | The Creed is the army's book. The vision keeps its story as an alternative reading but its names table gains the codex names and the app uses codex epithets. Nothing deleted. |
| Painting / basing / transport plan | none | `docs/VISION.md` five rules, phases, transport | Kept whole; its inventory-dependent passages (unit table, List 0, buying order, phase hours) corrected to the audited collection. Hobby view links into it. |
| Rules explainer / how to play | `belakor-shadow-legion-guide.md`, codex Parts II & IV, strategy note | `docs/PRIMER.md` (+ `guide.html`/`GUIDE.pdf`), research digests | All kept; the app's Library groups them as Doctrine (codex IV, quartermaster "road", strategy), Rules (guide, research), Learn to play (Primer). No text merged by hand — they are prose with different jobs. |
| Market scorecard | `index.html` + `chaos.html` viewers (July engine) | `scorecard.html` + `chaos.html` on shared `viewer.js` (same engine + photo-sweep tiers + XSS hardening) | The shared viewer is the live one; the app's Buy view reads the same `listings.js`/`chaos.js` and adds gap-awareness. `main`'s old `index.html` viewer is superseded by the app at the same path (its content is fully contained in `scorecard.html`). |
| Front door | `index.html` = all-faction scorecard | `index.html` = hub page | `index.html` becomes the Muster app; the hub's "what's next" and cross-account notes move into the app's About panel. |
| Deploy | Pages workflow | artifact publish | Both kept: Pages serves `main`; the artifact mirrors the branch until merge. |
| Scraper | `scrape.js` (console) | `tools/ebay_search.js`, `tools/ebay_fetch.js` (headless) | Both kept; different jobs (feed refresh vs. targeted scouting). |

## 3. Architecture decisions

- **D1 — Vanilla, classic scripts, no build step for the app.** Must open from `file://` on a phone and from
  Pages; ES modules and `fetch()` both fail on `file://`, so data ships as `muster.js` / `listings.js` /
  `chaos.js` globals and the app is `index.html` + `app.css` + `app.js`. No framework earns its weight here.
- **D2 — Store shape.** One JSON document with `meta`, `units` (datasheet catalog with points brackets and
  legality facts), `inventory` (owned/inbound records → unit ids, paint state, provenance order), `orders`,
  `lists` (entries → unit ids, models, enhancement, leader links; nothing derivable stored), `rules`
  (detachment gists, allowlist, bans, caps, enhancements, leader pairs, sources), `hobby`, `games`,
  `buying` (do-not-buy, gap price snapshots). Pending crates are orders with `contents: null` and no
  inventory rows — counts never lie.
- **D3 — Local writes.** Forms write to a localStorage overlay immediately (survives reloads on the phone),
  and "Export" downloads the merged `muster.json`; "Copy patch" produces a minimal instruction block for a
  session to apply. Git stays the database; the app never pretends to save to it.
- **D4 — Generated regions in prose.** `<!--gen:NAME-->…<!--/gen:NAME-->` markers in the markdown/HTML that
  arrived from `main`; `muster.py` rewrites only inside them and `validate` fails if a region drifted from
  the store (someone hand-edited a number) so the fix is "edit the store", never a silent overwrite.
- **D5 — Validation gate.** `python3 muster.py validate` exits non-zero on: list totals over limit or
  mis-typed, ledger arithmetic, list entries referencing unknown units, owned-claims not covered by
  inventory, illegal enhancement targets, Epic Heroes, non-Be'lakor warlord, >3 War Dogs, HA points over
  the Thralls cap, duplicate ids, drifted generated regions. `build.py` runs it first and stops on failure.
- **D6 — Market overrides stay in `build.py` for now.** Moving `VERIFIED`/`SWEEP` into JSON is right but
  touches the scoring engine both lines of work share; deferred to keep this pass merge-safe. Logged, not
  forgotten.

## 4. Design tournament (home screen and navigation)

Three concepts were sketched as real pages over the theme tokens (`design/concepts/a-dashboard.html`,
`b-table.html`, `c-codex.html`; screenshots at 390 dark / 1280 light in `design/shots/`) and scored by three
independent judge agents that had not seen the build plan, each with one lens.

| Concept | Weekly-loop judge | Mobile-density judge | Owner-taste judge | Verdict |
|---|---|---|---|---|
| **A — four questions first** (Own / Field / Buy / Arriving panels, bottom tabs) | 8 | 8 | 8 | **Winner** — the only landing where a cold reader answers all four questions without a tap, and every loop step is one tap away. |
| B — the table is the app (collection table as home, top text tabs) | 6 | 6.5 | 7 | Best desktop screen and the most honest pixels (`?`, `≈10`, `9/10`, INBOUND rows); fails at 390 (tabs clip after "Hobby", key columns fall off-canvas). Becomes A's Collection tab. |
| C — the book is the app (codex cover + chapters with live status) | 4 | 5 | 4 | Fiction became structure ("two tithes in transit"), a cover eats the fold, no snapshot dates. Its chapter-row-with-live-status pattern becomes A's More screen; the parchment becomes an optional skin. |

**Grafts adopted** (all three judges converged): B's one-line masthead with the snapshot/audit/store dates
right-aligned on every view; B's row grammar everywhere (name, dim sub-line for epithet · audit note · caveat,
mono value, explicit `≈ ? — 9/10` glyphs, PAINT/INBOUND tags); B's table as the Collection tab with From and
In-lists folded into the sub-line under ~700px instead of horizontal scroll, filter chips carrying counts;
inbound crates as `?`-count rows under the owned rows so Own and Arriving reconcile; C's chapter list with live
right-hand status as the More screen and as the desktop navigation (bottom bar only under 900px, with the iOS
safe-area inset); tab badges (crate count, hobby dot); codex as a skin over the same DOM, off by default,
never renaming a tab, column or linter message; each list row shows three separate ticks — legal · owned ·
built/painted — with the blocking reason in words; "since you last looked" is computed from the store
(re-costs, ETA windows containing today, lists over, snapshot age), never hand-written; sums inherit the
weakest qualifier of their parts ("2,720 pts fieldable · 2 crates pending, not counted", "≈$1,391").

**Risks the judges named that the build treats as requirements:** all four answers within ~1.3 screens at
390 (compact masthead, panels capped at headline + three rows, alerts strip above the panels); no
container-opacity greying (the buy panel dims its headline only; rows stay full contrast); dark-mode contrast
of eyebrows/links lifted; 44px tap rows and text-only tabs (no unicode icon glyphs); `viewport-fit=cover` +
`env(safe-area-inset-bottom)`; long honest strings stack under their label below ~360px content width; no
dashboard furniture (no charts, rings, health scores), no onboarding, no jokes in numbers, headers, buttons or
linter output — humour lives in sub-lines, empty states and one footer marginalia line.

## 5. Review battery log

### Round 1 (2026-08-11, commit `27bbd60` → fixes in `c3ab23e`)

**Battery:** six reviewer agents that had not built the app — UI at 390 dark (39 findings), UI at 1280 light + codex-skin
parity (20), data correctness with independent recomputation (22), rules accuracy against the repo's own documents (26),
mobile flows + performance driven in headless Chromium (25 + timings), and a zero-context four-questions test subject.
Then four adversarial verifier agents tried to refute every finding before anything was fixed.

**Verdicts:** 128 of 132 findings confirmed, 9 of them as "partial" with a corrected cause (e.g. the Buy table overflow was
nowrap tags and prices, not the 62% column rule; token splits were hyphen breaks, not `overflow-wrap`); 1 refuted (the
crate Save button *is* disabled with no rows); the rest were suggestions logged below. Four-questions test: own / field /
arriving answered cold in under a minute; **"what should I buy next" failed** (unitless "Skullmaster 85", internal order ids,
un-merged shopping lines, prices hidden off-screen at 390, jargon) — fixed as a group. Performance passed outright (cold open
95–191 ms, route renders ≤ 21 ms throttled 4×, zero console errors on 25 routes).

**What was really wrong (and fixed):**
- *Data you would have acted on:* gap prices silently included auction bids (the scout encodes `AUC`, the filter looked for
  "auction") and part-kits, and ignored quantity — "finish E from ≈$132" was really ≈$245+; List C sat at 1,010 Heretic
  Astartes points against a 1,000 cap and every summary called it legal (enhancement points count in GW's documents — C now
  stores one Cultist Mob and the Screamers, 930 + 30); "fieldable today 2,720" counted the Bloodthirster on its sprue.
- *Silent data loss:* local edits set aside after a rebuild were overwritten by the next edit; every rebuild produced a false
  "set aside" alarm. Now changes are replayed onto the new store, already-applied ones are recognised and cleared, and only
  genuinely unreplayable ones are parked — never dropped.
- *Swallowed taps:* typing in a crate/builder field and tapping Save lost the first tap (the change handler re-rendered the
  DOM under the pointer). Text fields now save without re-rendering.
- *Phone tables:* orders, buy gaps, builder and crate rows hid their deciding column or control off-screen at 390 — now rows
  or stacked cards; generated doc tables with 5+ columns scroll instead of collapsing to a word per line.
- *Rules data:* boons carried the older wording, four of the six stratagems were missing, Beasts of Nurgle priced 150 for two
  (140), War Dogs modelled as a multi-model unit, Dreadblades and several leader pairings stamped verified without a quoted
  source, Epic Hero uniqueness and minimum unit sizes unenforced.
- Plus ~80 smaller items: joins ("leads Legionaries ×5 ·"), duplicate units in shopping lines, tags on every normal row,
  19px selects and 13px checkboxes, iOS focus-zoom (14px inputs), codex-skin brass at 3.6:1, light-theme fields invisible,
  sort with no state or way back, deep links that did not scroll, focus lost on every render, jargon with no glossary.

**Waived or deferred (with reason):** market overrides (`VERIFIED`/`SWEEP`) stay in `build.py` (D6, merge safety); the
scorecard viewer stays dark-only (separate tool, noted); provenance paragraphs on the prose pages stay where they are (they
are content, and the phone nav/h1 fix removed most of the cost); doc-internal contradictions in archived July docs (Nurglings
tagging objectives at OC 0, the Tzeentch and/or) are recorded in the store's notes rather than edited into archived files;
10–11.5px type remains for tags and eyebrows by design; "to buy / short / on sprue" keep the solid red tag as one consistent
"not fieldable as-is" signal while rule failures live in the rules-check list.

### Round 2 (reviewed at `c3ab23e`, fixes in `f801315` and `e610ef1`)

**Battery:** four reviewers on the fixed build — UI at 390/1280/codex (28 findings), data + rules recomputation (15),
mobile flows driven headless (21 + timings), a fresh zero-context four-questions subject. Verification this round was by
reproduction: every major was re-driven in a script before and after its fix (storage failure, two tabs, catalogued-crate
replay, resume, dialog counts, clamps, desktop label widths, crate name cell, tag heights) and the data findings were
re-checked against the store and the scout file directly; the reproductions are the drive scripts kept beside the round's
screenshots. Nothing was refuted; three findings were narrowed (e.g. the tie line was wrong only for the third unit).

**Verdicts:** 0 blockers anywhere. Four-questions: **all four answered cold in under a minute** (2 screens each at most).
Majors (8): commit() reported success when the browser refused the write and then deleted the crate draft; two tabs
overwrote each other's overlay; replaying a crate the repo had already catalogued under different ids double-counted it;
"Continue editing" reloaded the saved copy over unsaved edits; desktop home rows collapsed their label column; the ticked
crate row squeezed the unit name to 52px; table tags wrapped inside themselves; the buy gaps kept the phone row layout at
1280. Minors (37) and nits (19): unclamped counts (a typed 99,999,999 froze the page for 22 s and persisted), empty/future
delivery dates, invisible future-date warning, corrupt-overlay boot failure, contradictory replay wording, inverse edits
accumulating, false dirty-draft confirms, price-filter edge cases (a 4-model Warp Talons lot as the median, a real Flesh
Hounds listing dropped for mentioning auctions), Terminator Lord "unpriced" while seven listings sat in a mixed bucket, one
generated table still valuing 10 Legionaries at 170, two dead Primer anchors, three glossary facts, July rules prose in
the codex/guide contradicting the store, the Primer's pre-audit rosters without a note, and copy/contrast/tap-target
leftovers. All fixed as described in the two commits; the doc contradictions were resolved with additive "store wins"
notes rather than rewrites of files that arrived from `main`.

**Waived (with reason):** the market feed's only "worth a look" card disappeared under the stricter overkill rule (an
honest empty state beats a stale $194 army for a Terminator gap); the codex page keeps its own typography and gets a
plain way-back line rather than the site nav (it is a book); user-typed 200-character tokens can still widen a device
list card at 320px after `overflow-wrap:anywhere` (names are capped at 60 characters instead).

### Round 3 (reviewed at `79eefc3`, fixes in `a203c3c`)

**Battery:** the same four lenses, now separating *defects* from *suggestions* so a dry round can be called honestly.
UI: 23 defects (1 major — the crate paint select had zero slack at 390 and overlapped the count at 360–375; 9 minor;
13 nit). Data + rules: 3 low defects (a raw-vs-distinct verify count on one card, a wrong top-up sentence after merging,
an unmarked best-split value) and every recomputed number correct — "otherwise dry". Flows: 18 defects, of which 5 were
everyday (double-tap logged a phantom game, a pasted URL widened the phone layout, the "today" shortcut sat under the
next field at 320–384, a Back press with a field focused threw, Library overflowed 16px at 320) and 13 needed two tabs,
write-refusing storage or hand-corrupted blobs. Four-questions: **all four yes** again, with copy-level contradictions
(the seller's "~2,110 pts" against the audited 2,180, "verified Jul 27" beside "re-check Aug 10", three "wanted"
framings, three paint vocabularies) and a few undecodable phrases ("the app", "the July list book", "(1+10)").
Verification: each flows/UI major and the data items were reproduced in a drive script before fixing and re-driven
after (boot with four kinds of corrupt overlay, quarantine of wrong-shape drafts, double tap, long URL, today button at
320, cross-tab discard/adoption, malformed hash) — all held after the fix.

**Fixed:** everything listed, as described in commit `a203c3c` — including the whole class behind the storage findings
(shape-checked reads with quarantine, payload-validated patches, revision-based cross-tab adoption, honest failure on
every write path) rather than the individual repros only.

**Waived (with reason):** viewer.css (the scorecard pages) still has no `--crimson-soft`, so its nav falls back to
crimson (separate tool, dark-only by design, logged before); the codex keeps its own palette with a minimal additive
contrast override instead of adopting the site tokens (it is a book from the other line of work); suggestions from all
three reviewers (leads-picker disambiguation, hobby note duplication, order-row date prefix, etc.) are parked as polish,
not defects.

## 6. Questions for the owner (taste, not fact)

- **Q1 — Warband name.** The codex's *Umbral Creed / Long Shadow Host* is used everywhere in the app; the
  vision's *Host of the Eclipsed Word* survives as an alternative reading. Say the word to swap or retire either.
- **Q2 — Codex skin default.** Off (tool view) unless you want the parchment look as the landing experience.
- **Q3 — List parity.** The six list compositions come from the Jul 27 work-account Quartermaster; the
  personal ledger artifact (a56e6f5e…) is unreadable from this account. If its tables differ (e.g. List C
  after the audit removed the Terminators), paste them into a session and the store follows.
- **Q4 — Beasts of Nurgle points.** Resolved in round 1: every repo table says 140 for two (the "150" was two one-model
  units); stored as 75 / 140 with a verify flag on the third-model question only.
