# CLAUDE.md — read this first, in any session, from either account

This repo is Evan's single home for Warhammer 40K hobby work. It is **public**, on his personal
GitHub (`evbarleyg/40k-armies`); his work-linked GitHub identity (`ebg-ant`) has write access, so
Claude sessions started from either the personal or the work Claude account can clone and push.
Claude artifacts, memory and session history do **not** cross accounts — the repo does. Anything
worth keeping goes in the repo, not only in an artifact or a chat.

**Before building anything, `git fetch` and read what `main` and the other `claude/…` branches
already hold** — two lines of work have met here before (`DECISIONS.md` §2 is the dedupe map).
Then read `docs/CONTEXT.md` (the portable summary; its top block is generated from the store) and
`data/muster.json` (the facts). `docs/VISION.md` is the painting/transport plan; the codex is the flavour.
(The older `evbarleyg/daemon-quartermaster` private repo is superseded; its files live here now.)

## What's here

- **The store** — `data/muster.json`: unit catalog with MFM v1.1 points, the audited inventory,
  the orders ledger (seven orders, ≈ $1,391; two crates inbound as of 2026-08-11), the six 2,000-pt
  Shadow Legion lists A–F, rules gists with sources, hobby queue, game log, buying notes. Edit facts
  here and run `python3 build.py`: `muster.py` validates the store (integrity + the shared legality
  linter `lint.js` under node), emits `muster.js`, and regenerates the marked tables in
  `quartermaster.md`, `codex-umbral-creed.md/.html` and `docs/CONTEXT.md`. It refuses to build an invalid store.
- **Muster** — `index.html` (+ `app.js`, `app.css`): the console over that store — what he owns, what he
  can field today (linter + ownership + paint state per list), what to buy next (gap-aware, over the
  scorecard feed and the last read-only scout's prices), what is arriving (crate mode turns a delivery
  into inventory rows and a patch). Local edits live in the browser until exported. Build log and the
  quality hillclimb: `DECISIONS.md`; the brief: `SPEC-muster.md`.
- **The army in prose** — `quartermaster.md` → `quartermaster.html` (audited inventory, six lists, verified
  rules), `codex-umbral-creed.md/.html` (Codex: The Umbral Creed — fiction, unit entries, doctrines, the
  ledger), `belakor-shadow-legion-guide.md` → `rules-guide.html`, `docs/PRIMER.md` → `primer.html`
  (beginner's play guide; print layout `guide.html` → `GUIDE.pdf` via `./make_guide.sh`), `docs/VISION.md`
  → `vision.html` (five painting rules, unit treatments, phases, what is left to buy, transport).
- **Buying** — `docs/SCOUT_REPORT.md` → `scout.html` (price scan 2026-08-14 above the photo-graded targets of
  2026-07-27), `data/scout-*.json` (Muster prices gaps from the file registered last in the store's `buying.scan_log`), and the read-only scripts
  `tools/ebay_search.js` / `tools/ebay_fetch.js` (headless Chromium; see `docs/ebay-access.md`; this cloud
  environment cannot reach eBay or any retailer — the August scan went through a web-search index, so its
  listings are leads to open by hand, never photo-checked verdicts).
- **The market** — `build.py` scores painted-army eBay listings (`data/raw_*.psv` → `listings.json`
  / `chaos.json` → `scorecard.html` / `chaos.html`, and Muster's Buy view). Photo-verified paint tiers
  from the 2026-07-21 sweep are in the `SWEEP` overlay in `build.py`; the write-up is `docs/sweep-2026-07-21.md`.
- **The site** — GitHub Pages serves `main` at `https://evbarleyg.github.io/40k-armies/`. Dated snapshots
  live behind `archive.html`. `ledger.css` is the theme, `pages.py` renders the markdown and keeps the nav
  in sync. `pip install markdown`, then `python3 build.py`.

## House rules

- **Evan is new to 40K.** Explain jargon inline, spell out unit roles and why a rule matters; never
  assume rules knowledge. He wants to learn the nuances, not just receive a verdict.
- **Verify edition-current rules before asserting them** and cite the source (Wahapedia 11e page,
  faction pack, MFM version) with a "re-verify in the official app" caveat. Points moved on
  2026-07-22 (MFM v1.1) and will move again; values flagged `verify` in the store are unconfirmed.
  Shadow Legion bans every Epic Hero except Be'lakor, and Be'lakor must be Warlord. A rules change is
  an edit to `data/muster.json` → `rules`, never a code change.
- eBay work is strictly **read-only**: load public pages and photos; never log in, bid, offer,
  watch, message, or check out on Evan's behalf. Present findings; he buys.
- Judge paint from **full galleries + zoom crops, never titles**. Strict tier scale: any unpainted
  or primed squad makes a lot `Partial`. A current auction bid is not a price. Flag auctions, split
  lots, 3D prints, merged schemes, low-feedback sellers.
- Treat every stored price/listing as a dated snapshot (July 2026). Re-check before recommending a buy.
- **One place per fact.** Numbers live in `data/muster.json`; the docs either generate from it or say
  "snapshot". Keep `docs/CONTEXT.md`'s narrative current when something material changes (a purchase, a
  list decision, a new sweep) — it is what the *other* account's next session will read. Commit here;
  don't strand work in an artifact. Merge `main` before pushing; edit files that arrived from the other
  line of work additively.
