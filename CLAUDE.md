# CLAUDE.md — read this first, in any session, from either account

This repo is Evan's single home for Warhammer 40K hobby work. It is **public**, on his personal
GitHub (`evbarleyg/40k-armies`); his work-linked GitHub identity (`ebg-ant`) has write access, so
Claude sessions started from either the personal or the work Claude account can clone and push.
Claude artifacts, memory and session history do **not** cross accounts — the repo does. Anything
worth keeping goes in the repo, not only in an artifact or a chat.

Then read `docs/CONTEXT.md` — the portable summary: what he owns, what's decided, what's open.
(The older `evbarleyg/daemon-quartermaster` private repo is superseded; its files live here now.)

## What's here

- **The army** — `quartermaster.html` (collection ledger at MFM v1.1 points, six 2,000-pt Shadow
  Legion lists A–F, shopping, verified rules), `docs/PRIMER.md` → `primer.html` (beginner's play
  guide; print layout `guide.html` → `GUIDE.pdf` via `./make_guide.sh`), `docs/lists.md`,
  `docs/research.md`, `docs/collection.md`. Evan bought eBay lot 236942163636 (Chaos Daemons
  "Shadow Legion" with Be'lakor, Lord of Change, a CSM half, two War Dogs; Word Bearers red/black)
  for $730 on 2026-07-20/21.
- **Buying for the lists** — `docs/SCOUT_REPORT.md` → `scout.html` (graded targets + cost to finish
  each list, 2026-07-27), `data/scout-*.json`, and the working scripts `tools/ebay_search.js` /
  `tools/ebay_fetch.js` (headless Chromium; see `docs/ebay-access.md`).
- **The market** — `build.py` scores painted-army eBay listings (`data/raw_*.psv` → `listings.json`
  / `chaos.json` → `scorecard.html` / `chaos.html`). Photo-verified paint tiers from the 2026-07-21
  sweep are in the `SWEEP` overlay in `build.py`; the write-up is `docs/sweep-2026-07-21.md`.
- **The site** — `index.html` is the hub; `ledger.css` the shared theme; `pages.py` renders
  `docs/*.md` and keeps the nav in sync. `pip install markdown`, then `python3 build.py` runs it all.

## House rules

- **Evan is new to 40K.** Explain jargon inline, spell out unit roles and why a rule matters; never
  assume rules knowledge. He wants to learn the nuances, not just receive a verdict.
- **Verify edition-current rules before asserting them** and cite the source (Wahapedia 11e page,
  faction pack, MFM version) with a "re-verify in the official app" caveat. Points moved on
  2026-07-22 (MFM v1.1) and will move again; values marked `~` are unverified. Shadow Legion bans
  every Epic Hero except Be'lakor, and Be'lakor must be Warlord.
- eBay work is strictly **read-only**: load public pages and photos; never log in, bid, offer,
  watch, message, or check out on Evan's behalf. Present findings; he buys.
- Judge paint from **full galleries + zoom crops, never titles**. Strict tier scale: any unpainted
  or primed squad makes a lot `Partial`. A current auction bid is not a price. Flag auctions, split
  lots, 3D prints, merged schemes, low-feedback sellers.
- Treat every stored price/listing as a dated snapshot (July 2026). Re-check before recommending a buy.
- Keep `docs/CONTEXT.md` current when something material changes (a purchase, a list decision, a
  new sweep) — it is what the *other* account's next session will read. Commit here; don't strand
  work in an artifact.
