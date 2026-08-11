---
name: verify
description: Build the Shadow Legion HQ static site (store → muster.js + generated doc tables, market scoring, rendered docs) and drive the Muster console and pages in headless Chromium to verify a change end-to-end.
---

# Verify a change to this repo

The runtime surfaces are the build CLI and the static pages (opened via `file://`, no server).

## Build

```bash
pip install markdown                      # once; pages.py needs it (node is needed for the legality lint)
python3 build.py                          # muster.py build (validate data/muster.json → muster.js + <!--gen:--> tables) → rescore market → render docs + nav
python3 build.py | grep -c 'wrote'        # a second run should write nothing (idempotent)
python3 muster.py check                   # store valid AND every generated region on disk in sync (fails loudly otherwise)
NODE_PATH=$(npm root -g) ./make_guide.sh  # only if guide.html changed — GUIDE.pdf must stay 31 pages
```

An invalid store (e.g. a stored list over 2,000, an unknown unit id, an order with a bad date) must stop the build with a
readable list of errors — that is a feature worth probing when the change touches `data/muster.json`, `lint.js` or `muster.py`.

## Drive (Playwright is preinstalled; Chromium at /opt/pw-browsers)

```bash
export NODE_PATH=$(npm root -g)                 # makes require('playwright') resolve
node tools/shoot.js /tmp/shots 390:dark 1280:light   # screenshots of every Muster view + key pages; prints console errors / horizontal overflow
node tools/viewtext.js '#/lists/A' 390          # visible text of one view (also load time, console errors); SKIN=codex / THEME=light env vars
node your_driver.js                             # custom flows: chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); goto file:///…/index.html#/…
```

Flows worth driving after a change:
- `index.html` (Muster): home shows the four panels with numbers from the store; `#/collection` filters/sort/detail;
  `#/lists/A` linter + coverage; `#/build?from=B` — add a 4th War Dog model set (`#b-unit` = war_dog_karnivore) and
  Skulltaker: the linter must error on both; `#/crates/o6` — quick-add + Save marks the order delivered, grows the
  inventory, records a local change (localStorage `muster.local`), and Home/More reflect it; `#/games` form updates the
  counter and the Buy banner; a garbage route falls back to home; a stale overlay (`baseSig` mismatch) is set aside with an alert.
- `scorecard.html` / `chaos.html` (one viewer, `viewer.js` + `viewer.css`, data from `listings.js` / `chaos.js`):
  `#fFaction`, `#fVerdict`, `#sort`; paint column shows sweep tiers; lot 236942163636 reads "SOLD … to us".
- Generated regions: the ledger table in `codex-umbral-creed.html`, the inventory/lists tables on `quartermaster.html`,
  the state block on `context.html` match the store after a build.
- Every page at 390 px wide: `document.documentElement.scrollWidth` must equal the viewport.
- Rendered docs carry the nav with the right `aria-current`; pages without `<!--nav-->` markers (guide.html, index.html) are left alone.
- Screenshot light and dark (`colorScheme`) and the codex skin (`SKIN=codex`) — tokens live at the top of `ledger.css` / `app.css`.

Gotchas: `pages.py` and `muster.py` only rewrite files whose content changed; `build.py` skips rewriting `*.json/*.js` when only
the build date moved. Local app edits persist in the browser profile — use a fresh Playwright context per scenario. eBay tooling
in `tools/ebay_*.js` is read-only by house rule and needs the Chromium proxy policy from `docs/ebay-access.md` — don't drive it
as part of routine verification.
