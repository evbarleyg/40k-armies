# SPEC: Muster (working name), the unified hobby console

**The ask in one paragraph:** this repo has grown five separate frontends and
four markdown docs that all describe the same collection, and they already
disagree with each other whenever data changes. Build one utilitarian piece of
software that replaces them: a single local-first app over a single canonical
data file, holding every current capability (market scorecard, inventory,
lists, codex, doctrine) plus whatever you can add that makes the owner's
weekly loop better. Budget is unlimited. Quality is climbed, never assumed:
the hillclimb protocol in section 6 is a firm requirement. Sections marked
FLEXIBLE are yours to redesign; you are expected to bring your own ideas
(section 7) and to ask the owner when a decision is taste rather than fact.

**Owner's weekly loop, so you know what you're optimizing:** browse eBay lots,
decide what to buy, receive crates, catalogue what actually arrived, pick a
legal 2,000-point list from owned models, play, repeat. The app should make
each of those steps faster or safer.

---

## 1. What exists today (the surfaces you are unifying)

| Surface | What it does | Data behind it | State |
|---|---|---|---|
| `index.html` | All-faction eBay value scorecard, filter/sort | `listings.js` (from `build.py` over `data/raw_listings.psv`) | works, dated scan |
| `chaos.html` | Chaos-faction scorecard, same engine | `chaos.js` / `chaos.json` | works, July 20 scan |
| `codex-umbral-creed.html` | Styled army book: lore, unit entries, doctrines, ledger | hand-written HTML, numbers duplicated from md | current |
| Quartermaster artifact ([link](https://claude.ai/code/artifact/a56e6f5e-47b9-4b00-8ac0-791d4815ee44)) | Audited inventory, six 2,000-pt lists, buy queue, verified rules | hand-written HTML, now stale on status | superseded by `quartermaster.md` |
| Battle Doctrine artifact ([link](https://claude.ai/code/artifact/995360ab-ea16-4662-b89c-194c7a70a3c7)) | Slide-deck briefing: strategy, mechanics primer, three armies | hand-written HTML | current content, orphaned format |
| `codex-umbral-creed.md`, `quartermaster.md`, `belakor-shadow-legion-guide.md`, `shadow-legion-strategy.md` | The book, the audit, the rules explainer, the original gameplan | hand-written | current |

The failure mode to kill: the Lord of Change's points existed in five places
and was wrong in two of them until a manual merge this week. Numbers must live
in one place.

## 2. Product shape (firm on posture, FLEXIBLE on everything else)

One app, utilitarian first. The codex's liturgical skin is a feature worth
keeping, offered as a view or theme, never as the price of admission to the
data. A user landing on the app should reach "what do I own and what can I
field" in two clicks, and "should I buy this eBay lot" in three.

Firm constraints:

- **Local-first, no backend, no accounts.** It must open from the filesystem
  or as a static deploy, matching the repo's existing pattern. Flat files in
  git are the database.
- **No live LLM calls in the app.** All intelligence happens out-of-band in
  sessions like this one, writing results into the data file (same philosophy
  as the owner's roost project).
- **No purchase automation.** The app organizes public listings and never
  buys, bids, or checks out. The existing paste-into-console scraper pattern
  (`scrape.js`) stays the collection mechanism for market data.
- **Phone-usable.** The owner reads this on an iPhone. Every view must work at
  390px, light and dark.
- **IP posture:** original flavor text only, game statistics as facts with a
  verify-in-app caveat and a points-snapshot date. Nothing copied from
  Games Workshop publications.

FLEXIBLE: framework choice (vanilla, Vite + something, anything that builds to
static), single-page or multi-page, file layout, visual design beyond the
constraints above. If you keep the codex's typography for the flavor view,
its design tokens are in `codex-umbral-creed.html`.

## 3. The data layer is the real unification (firm)

Design one canonical machine-readable store (one file or a small set, your
call on schema) that captures at minimum:

- **Units owned:** identity, count, points (with the MFM snapshot tag),
  paint state, provenance (which order, which date, which cost), status
  (owned / inbound with ETA / pending catalogue), and audit notes (for
  example "found in July 27 photo audit, unlisted by seller").
- **Orders ledger:** every purchase with landed cost and delivery state. The
  current truth is the table in `codex-umbral-creed.md` Part VI.
- **Lists:** the Quartermaster's six plus room for more. Each entry references
  owned units by id, carries the enhancement assignments, and stores nothing
  derivable (totals are computed).
- **Market listings:** what `raw_listings.psv` / `raw_chaos.psv` hold today,
  with the scoring model inputs from `build.py`.
- **Rules gists:** the detachment facts the app needs for validation (the
  Thralls allowlist, Epic Hero ban, mandatory Warlord, Dreadblades cap of 3,
  boon table), each with a source link and verified date. These are data, so a
  rules change is an edit, never a code change.

Migration of the existing psv/json/md content into the store is part of the
job. The markdown docs stay in the repo as prose (they are read on GitHub) but
any number in them must either be generated from the store or carry an
explicit "snapshot, see app" disclaimer. Hand-maintained duplication ends
here. Include a validation script that fails loudly when the store is
internally inconsistent (list totals wrong, ledger sums wrong, a list using
units the collection lacks, an illegal enhancement pairing).

Schema design is FLEXIBLE, with one warning from live data: two inbound lots
have unknown contents until crates open. The schema must represent "a
purchase exists, contents pending" without lying about counts.

## 4. Feature directions (a menu, deliberately not a checklist)

Build what earns its place, cut what doesn't, and say which and why in the
decisions log. Candidates, roughly in order of expected value:

1. **Collection browser.** The inventory as a sortable, filterable table
   (tool view) and as the codex's datasheet cards (flavor view), both reading
   the same records.
2. **List builder with a legality linter.** Compose from owned units only,
   live points total, and flags for every rule in the store: non-Warlord
   Be'lakor, an Epic Hero in the detachment, a fourth War Dog, an enhancement
   on an illegal target, over 2,000. The Quartermaster's six lists ship as
   presets with their gap-to-complete computed from inventory.
3. **Buy advisor.** The scorecard views merged into one, extended with
   gap-awareness: a listing's card shows which lists it advances ("completes
   the Fadethirster"). The do-not-buy list (fake Bloodthirsters, illegal
   heroes) renders as warnings.
4. **Arrivals workflow.** Inbound orders with ETAs and a catalogue-on-arrival
   form that turns a crate into inventory records in one sitting.
5. **Hobby tracker.** Assembly and paint state per model, surfacing the
   current queue (an unassembled Bloodthirster is the whole queue today).
6. **Game log.** Date, opponent faction, list used, result, one lesson. The
   standing rule is ten games before the next purchase; show the counter.
7. **Doctrine reader.** The Battle Doctrine deck's content in a readable
   format that survives, slides or prose, your call.
8. **Exports.** A list as tournament-legible plain text; the codex as
   print/PDF.

## 5. What done looks like (firm)

- Every capability in section 1's table is either present in the app or
  retired in the decisions log with a reason.
- One canonical store; the validation script passes; no number appears in two
  hand-maintained places anywhere in the repo.
- The four questions answer in under a minute each for a reader with no
  context: what do I own, what can I field today, what should I buy next,
  what is arriving. This is tested, see section 6.
- Old surfaces stay reachable (a `legacy/` folder is fine) until the parity
  checklist for each is confirmed, then get removed in a labeled commit.
- Works at 390px and at desktop widths, in light and dark, from a local file
  open and from a static host.

## 6. The quality hillclimb (firm, and where the unlimited budget goes)

Do this in passes with exit criteria. Spend tokens on independent
verification before spending them on more features.

**Pass structure.** Build a milestone, then run the review battery, fix, and
rerun until a full battery yields zero confirmed findings twice in a row
(iterate until dry). Only then start the next milestone.

**The review battery:**

- **Screenshot-driven UI review.** Render the app in the environment's
  headless Chromium at 390px and 1280px, light and dark, and capture every
  view. Judge the screenshots against a written rubric (hierarchy, spacing,
  overflow, contrast, tap targets, dark-theme parity) by agents that did not
  build the UI. Every finding gets fixed or explicitly waived with a reason.
- **Fresh-eyes functional review.** Spawn reviewer agents that receive only
  the built app, the canonical store, and this spec, no build context. Give
  each one lens: data correctness (recompute every displayed number from the
  store independently), rules accuracy (cross-check the linter against
  `quartermaster.md` and `belakor-shadow-legion-guide.md`), mobile UX, and
  performance (cold open under a second on the data at hand).
- **Adversarial verification of findings.** Before acting on a finding, have
  an independent agent try to refute it. Fix confirmed findings, log refuted
  ones. This kills plausible-but-wrong churn.
- **The four-questions test.** A fresh agent with zero context gets the app
  and the four questions from section 5, and must answer all four correctly
  in under a minute each, navigating cold. A wrong or slow answer is a defect
  in the app, never in the reader.
- **Data-integrity gate.** The validation script runs in the battery and on
  every commit touching the store.

**The one big design decision gets a tournament.** Before committing to an
information architecture, produce two or three genuinely different concepts
for the home screen and navigation (for example: dashboard-first, table-first,
codex-first). Score them with independent judge agents against the weekly
loop in this spec's preamble, pick the winner, and graft the losers' best
ideas. Keep the concept sketches in the repo.

**Record the climb.** Maintain `DECISIONS.md`: what was proposed, adopted,
rejected, and why, including every waived finding. The owner reads this file
to trust the result without replaying the process.

## 7. Your ideas are requested, and taste questions go to the owner

Before building, write a short proposal section in `DECISIONS.md` with five to
ten ideas of your own: features, data views, flourishes, structural bets.
Include at least one nobody asked for. Mark the two or three you would fight
for. Cheap-and-good ideas can just ship; expensive or taste-heavy ones go to
the owner as questions before you invest.

Guidance on taste, so your questions land well: the owner values utilitarian
density over onboarding hand-holding, dry humor in flavor text over glee, the
Umbral Creed fiction as seasoning rather than structure, and honest data
(verify flags, snapshot dates, "pending catalogue") over confident-looking
gaps. When the fiction and the tool conflict, the tool wins.

## 8. Handoff notes

- Repo: `evbarleyg/40k-armies`, work from `main` (currently at the
  Quartermaster-merge commit). Branch per your environment's instructions.
- Read in this order: this spec, `quartermaster.md`, `codex-umbral-creed.md`,
  `belakor-shadow-legion-guide.md`, then the two HTML viewers' source.
- Points are MFM v1.1 (July 22, 2026) as audited July 27. The official app is
  the arbiter; carry the snapshot tag, do no fresh rules research beyond what
  the store needs.
- Two lots are inbound (a Khorne army lot, ETA Aug 10 to 17, and a damaged
  Bloodcrushers lot, ETA Aug 18 to Sep 1). Their catalogue-on-arrival is the
  first real exercise of your arrivals workflow, so build that early enough
  to use it.
- The environment blocks most non-registry egress including eBay and Reddit.
  Design nothing that requires the app or the build to fetch external sites.
