---
name: verify
description: Build the Shadow Legion HQ static site and drive it in headless Chromium to verify a change end-to-end (build output, viewer filters, deep links, phone widths).
---

# Verify a change to this repo

The runtime surfaces are the build CLI and the static pages (opened via `file://`, no server).

## Build

```bash
pip install markdown                      # once; pages.py needs it
python3 build.py                          # rescore data → listings/chaos .json/.js, render docs/*.md, re-stamp nav + hub numbers
python3 build.py | grep -c 'wrote'        # a second run should write nothing (idempotent)
NODE_PATH=$(npm root -g) ./make_guide.sh  # only if guide.html changed — GUIDE.pdf must stay 31 pages
```

## Drive (Playwright is preinstalled; Chromium at /opt/pw-browsers)

```bash
export NODE_PATH=$(npm root -g)   # makes require('playwright') resolve
node your_driver.js               # chromium.launch(); page.goto('file:///…/index.html')
```

Flows worth driving after a change:
- `index.html`: the `<!--market-->` chips carry real numbers; no `<script src>`; Copy button works.
- `scorecard.html` / `chaos.html` (one viewer, `viewer.js` + `viewer.css`, data from `listings.js` / `chaos.js`):
  title comes from `meta.title`; `#fFaction`, `#fVerdict` (BUY / scored / ready-to-ship / verified), `#sort`;
  paint column shows sweep tiers (Partial, Primer, High TT …); lot 236942163636 reads "SOLD … to us".
- `quartermaster.html` "→ full play guide" links land on `primer.html#list-x-…` headings (ids come from python-markdown's toc slugs).
- Every page at 390 px wide: `document.documentElement.scrollWidth` must equal the viewport (tables live in `.scroll`, long inline code wraps).
- Rendered docs carry the nav with the right `aria-current`; pages without `<!--nav-->` markers (guide.html) are left alone.
- Screenshot light and dark (`colorScheme` in `browser.newContext`) — ledger.css is dark-first with a light media query.

Gotchas: `pages.py` only rewrites files whose content changed; `build.py` skips rewriting `*.json/*.js` when only the build date moved. eBay tooling in `tools/` is read-only by house rule and needs the Chromium proxy policy from `docs/ebay-access.md` — don't drive it as part of routine verification.
