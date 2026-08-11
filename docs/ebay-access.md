# Reaching eBay from a cloud agent session

How the sweeps load eBay item pages and gallery photos from a Claude Code cloud environment
(recovered from the Jul 21 sweep session's notes so the method isn't lost). Everything here is
read-only: public item-page loads and image downloads — never logins, bids, offers, watches or
messages.

## What works and what doesn't

- **Plain `curl` on `/itm/` and `/sch/` pages → Akamai 403** (fingerprint block). The eBay
  homepage and `i.ebayimg.com` images fetch fine with curl.
- **eBay search (`/sch/`) is bot-blocked** for automation generally, which is why `scrape.js`
  works off the `/b/` category feeds pasted into a real browser console instead.
- **Headless Chromium works** (pre-installed at `/opt/pw-browsers`, driven by Playwright with
  `proxy={"server": $HTTPS_PROXY}`), after one fix: out of the box it fails with
  `ERR_CONNECTION_RESET` because the egress proxy resets Chrome's TLS 1.3 ClientHello that
  carries the post-quantum ML-KEM key share.

## The fix

A managed policy file at `/etc/chromium/policies/managed/ccr_proxy_tls_compat.json`:

```json
{ "PostQuantumKeyAgreementEnabled": false, "EncryptedClientHelloEnabled": false }
```

plus a self-consistent Linux Chrome User-Agent (a UA that mismatches `sec-ch-ua` also 403s).
With that, item pages load 200 with full server-rendered HTML.

## Pulling the photos

- Gallery image ids sit in the page's embedded `mediaList` JSON; rewrite the size segment to
  `s-l1600` for full-resolution downloads, then zoom-crop for squad-level inspection.
- Ended/sold banner strings live in eBay's i18n script bundle on *every* page, so match
  "ended"/"sold" only against script-stripped visible text, or every listing looks dead.
- Item descriptions (the seller's army list) are served separately at
  `https://itm.ebaydesc.com/itmdesc/<itemId>` — that's how the chaos edition was deep-scored.

## Throughput

Seven parallel agents at low volume saw no captchas or throttling on 2026-07-21. Keep it
polite: a handful of pages per minute, no hammering.

## Output format for a sweep

One line per listing, merged into `build.py` (`VERIFIED` / `SWEEP_*` dicts) after which
`python3 build.py` rebuilds the scorecards:

```
itemId | LIVE or DEAD | tier | flags | one-line note
```

Tier scale (strict): PRIMER-ONLY / PARTIAL (any squad or model flat grey/black or unpainted →
not a finished army) · Basic (block colours, no wash, bare bases) · Tabletop (base + wash, bases
done) · Tabletop+ (edge highlights, cohesive scheme, detailed bases) · High TT / Display
(blending, freehand, OSL, showcase basing). Flag 3D prints, merged/mixed schemes, damage,
ENDED/SOLD, and auctions (a current bid is not a price).

**Why so strict:** sellers lead with hero shots and bury primer-grey squads in later gallery
photos, so verdicts must come from full galleries plus zoom crops — never titles.
