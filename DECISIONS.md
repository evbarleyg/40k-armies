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

*Pending — one entry per battery run: findings, verification verdicts, fixes, waivers.*

## 6. Questions for the owner (taste, not fact)

- **Q1 — Warband name.** The codex's *Umbral Creed / Long Shadow Host* is used everywhere in the app; the
  vision's *Host of the Eclipsed Word* survives as an alternative reading. Say the word to swap or retire either.
- **Q2 — Codex skin default.** Off (tool view) unless you want the parchment look as the landing experience.
- **Q3 — List parity.** The six list compositions come from the Jul 27 work-account Quartermaster; the
  personal ledger artifact (a56e6f5e…) is unreadable from this account. If its tables differ (e.g. List C
  after the audit removed the Terminators), paste them into a session and the store follows.
- **Q4 — Beasts of Nurgle points.** Sources in the repo disagree (140 vs 150 for two); stored as 150 with a
  verify flag until the app is checked.
