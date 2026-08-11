#!/usr/bin/env python3
"""
40K Painted Army Value Scorecard — build step.

Reads data/raw_listings.psv (pipe-delimited: faction|itemId|price|title),
applies the value-ratio model, and writes listings.json for the scorecard UI.

Value model (calibrated against the original Necrons/Grey Knights board):
    Value Ratio = (Kit MSRP + Paint Premium) / Landed Price
    - Kit MSRP  ~= points * $0.45   (GW USD retail; 2000pts ~= $900)
    - Paint premium default = +100% (Tabletop+ tier)  => numerator = MSRP * 2.0 = points * 0.90
    - Landed     = listed price * 1.03 + $35  (generic ship/handling uplift)
    Verdicts: >=1.5 BUY | 0.8-1.49 FAIR | <0.8 SKIP
Listings whose points can't be read from the title are UNSCORED (price shown, no ratio).
Commission / "army builder" / made-to-order listings are typed COMMISSION (price is a range).

NOTE: paint tier is assumed Tabletop+ unless a listing was individually verified
(see VERIFIED). True tier + true MSRP require reading each listing's photos/contents;
this script is a first-pass triage, not a substitute for eyeballing the listing.
"""
import csv, json, re, datetime, os
import pages, muster

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw_listings.psv")
OUT = os.path.join(HERE, "listings.json")

FEED_SCANNED = "2026-07-20"   # date data/raw_*.psv were scraped — listings were live that day
PHOTO_SWEEP  = "2026-07-21"   # date of the visual paint-tier sweep merged below (SWEEP)

MSRP_PER_PT = 0.45          # USD GW retail per point
PREMIUM = {"Basic":1.30,"Tabletop":1.60,"Tabletop+":2.00,"High TT":2.50,"Display":3.50,
           # photo sweep found unpainted/primed squads: a project, not a finished army —
           # value the plastic only (no paint premium)
           "Partial":1.00,"Primer":1.00}
DEFAULT_TIER = "Tabletop+"  # assumption when unverified

# Listings individually opened at build time: live/dead, location, notes (+pts when the
# title omits them). Tier is set only where paint was actually judged — from the seller's
# own description in the chaos deep-score, or from photos in the SWEEP overlay below;
# everything else keeps the assumed Tabletop+ premium. Verify photos before buying.
VERIFIED = {
 "127956050629": {"live":True,"loc":"Missouri, USA","pts":4300,
                  "note":"~4300pts. Title says READ DESCRIPTION — confirm every unit is painted."},
 "178288744938": {"live":True,"loc":"Florida, USA",
                  "note":"Doomsday Ark + Destroyers. 'Well painted, battle ready.' Cleanest mid buy."},
 "267666144763": {"live":True,"loc":"Illinois, USA",
                  "note":"Ghost Arks, Wraiths, Warriors. Some Tomb Blades are NIB (unpainted)."},
 "198388850348": {"live":True,"loc":"Georgia, USA","note":"Over 3k points."},
 "800269301682": {"live":True,"loc":"Florida, USA","note":"Painted for 11th edition."},
 "356103443472": {"live":True,"loc":"California, USA"},
 "168516568188": {"live":True,"loc":"Maryland, USA"},
 "147259563854": {"live":True,"loc":"California, USA"},
 "188174994197": {"live":True,"loc":"Texas, USA"},
 "376706975741": {"live":True,"loc":"United Kingdom","note":"Winter/snow theme (UK — add ship/customs)."},
 "157950000776": {"live":True,"loc":"USA","pts":5000,"note":"Fully magnetized ~5000pt est. Over budget."},
 # cross-faction BUY-grade picks confirmed live in the full scan
 "358732050273": {"live":True,"loc":"USA","note":"1060pts, mostly painted — confirm the few unpainted."},
 "307039083053": {"live":True,"loc":"USA","note":"2000pts Custodes — elite, low model count."},
 "157987173489": {"live":True,"loc":"United Kingdom","note":"UK seller (~£876 + ship/customs); 3000+pts, freehand."},
 "335933902656": {"live":True,"loc":"USA","note":"6000pts Death Korps of Krieg — huge army."},
 "206149396177": {"live":True,"loc":"USA","note":"2500pts Tyranids."},
 # Chaos-edition: deep-scored from listing descriptions (army lists read in-browser
 # via itm.ebaydesc.com/itmdesc/<id>). "msrp" = itemized estimate from the stated
 # contents at current GW retail; tier from seller's own description where stated.
 "236942163636": {"dead":True,"loc":"California, USA","pts":2000,"tier":"Tabletop",
   "note":"SOLD Jul 20 — to us. This is the Shadow Legion collection (Be'lakor + Lord of Change + CSM half + 2 War Dogs, 2,110pts listed) — see quartermaster.html."},
 "188656011886": {"live":True,"loc":"South Carolina, USA","pts":2330,"msrp":1000,"tier":"Tabletop",
   "note":"PARTIAL PAINT — photos 4-6 show Legionaries + Warp Talons in bare primer. Painted units are solid Tabletop (Night Lords). ~2330pts, $1k of GW plastic. Rival offer pending."},
 "206417990509": {"live":True,"loc":"Texas, USA","msrp":820,"tier":"Tabletop",
   "note":"Kairos, Heldrake, Mutalith, Ahriman, Rubrics, Scarab Occult, horrors + a Knight Despoiler."},
 "188666300998": {"live":True,"loc":"Texas, USA","pts":1000,"msrp":420,"tier":"Tabletop+",
   "note":"1000pts stated: Daemon Prince, Saturnine dread, Rhino, MoE, 5 Termis, 10 Berzerkers, 10 Jakhals."},
 "297286491088": {"live":True,"loc":"California, USA","msrp":140,"tier":"Tabletop",
   "note":"Small lot, partly proxies (Necropolis Stalkers as Spawn) + 10 Seekers."},
 "327269142947": {"loc":"USA","msrp":540,"tier":"Basic",
   "note":"66 minis: 34 Plague Marines, 30 Poxwalkers, Typhus, LoV. Seller admits low paint standard + states $540 MSRP himself."},
 "298462766396": {"loc":"UK","msrp":216,"tier":"Tabletop+",
   "note":"Unit joblot (26 Berzerkers + 5 Termis), 30-yr painting shop. Not a full army."},
 "287471144335": {"loc":"USA","msrp":810,"tier":"Tabletop",
   "note":"15 PM, Typhus, Defiler, Heldrake, 3 Oblits, 5 Warp Talons, 4 tanks, prince + codex."},
 "206429111873": {"loc":"USA","msrp":1400,"tier":"Tabletop",
   "note":"Mortarion + 10 characters, 21 PM, 13 Blightlords, 9 Deathshroud, vehicles + daemon engines."},
 "800372311561": {"live":True,"loc":"Idaho, USA","msrp":820,"tier":"Tabletop","auction":True,
   "note":"AUCTION (ends Sun): Combat Patrol + 2 Rhinos, Predator, 10 Warp Talons, Chosen, bikers + more. Seller wants ~$400. Painted per item specifics."},
 "157956455674": {"loc":"USA","msrp":650,"tier":"Tabletop+",
   "note":"Red Corsairs ~72 models incl Huron; minor 3D-printed shoulder pads/bits."},
 "178316282893": {"loc":"USA","msrp":750,"tier":"Tabletop",
   "note":"Multiple NON-GW PROXIES (Mortarion, Rhino, DP, Defiler) — hurts value and event legality."},
 "168502725654": {"loc":"USA","msrp":290,"tier":"Display",
   "note":"Only Abominant + 2 Wardogs; price is for the display-grade conversions, not plastic."},
 "327240152869": {"loc":"USA","msrp":950,"tier":"Tabletop+",
   "note":"LOYALIST marines in Alpha Legion colors; several squads unfinished per description."},
 "127757404736": {"loc":"UK","pts":3780,"tier":"Tabletop+",
   "note":"3780pts stated, Abaddon + Fabius + Lord Discordant, cohesive Black Legion scheme."},
 "318610375778": {"loc":"USA","msrp":300,"tier":"Tabletop",
   "note":"Key models 3D PRINTED (Kairos, DP, 10 termis mixed, 10 horrors) — GW plastic is only part of the lot."},
 "137243260624": {"loc":"UK","msrp":250,"tier":"Tabletop",
   "note":"~40% 3D printed parts per seller."},
 "377206046468": {"loc":"UK","note":"'Various stages of painting' — NOT a finished army. No list given."},
 "377039163773": {"loc":"UK","note":"Assembled; painted state unstated, no list — judge from photos."},
 "377173133221": {"loc":"UK","note":"No itemized list; 'bulk lot, OOP + newer models'."},
 "298391383055": {"loc":"USA","note":"Only ~60% painted; seller claims $5,160 retail incl sprues/bits. A project buy, not a finished army."},
 "327270119216": {"loc":"UK","note":"Auction; 'some fully painted, rest part painted'."},
 "147081736336": {"loc":"USA","note":"EPIC scale (6mm) — different game system, not a 40K tabletop army."},
 "178232211622": {"loc":"USA","note":"Description is Black Legion lore only — no army list. Message seller for contents."},
 "297172534500": {"live":True,"loc":"Poland","note":"BE'LAKOR himself, painted — centerpiece single model (GW retail ~$115). EU shipping."},
 "174808047120": {"live":True,"loc":"Ukraine","note":"BE'LAKOR commission-painted (pick your scheme). War-zone shipping delays possible."},
}

# Verified-live listings not present in the general-category sweep (added manually)
EXTRA = [
 {"faction":"Necrons","itemId":"186965989121","price":"$929.99 OBO",
  "title":"Necrons Complete Army Painted & Ready for Battle"},
]

# Be'lakor centerpiece singles (found via web search; eBay search itself is bot-blocked)
EXTRA_CHAOS = [
 {"faction":"Chaos Daemons","itemId":"297172534500","price":"$450.00 OBO",
  "title":"Be'Lakor the Dark Master — painted (centerpiece single model)"},
 {"faction":"Chaos Daemons","itemId":"174808047120","price":"$600.00 OBO",
  "title":"Be'lakor the Dark Master — commission painted, choose your scheme (single model)"},
 {"faction":"Chaos Space Marines","itemId":"407044410129","price":"$725.00 OBO",
  "title":"Red Corsairs — 3 Chosen/Legionary squads, 2 Chaos Lords, MoP, Lord Discordant, Venomcrawler (pro painted)"},
]
VERIFIED["407044410129"] = {"live":True,"loc":"USA","msrp":470,"tier":"Tabletop+",
  "note":"Pro painted. Shadow Legion-usable: 3 Chosen/Legionary squads + 2 Lords + MoP (~$300 MSRP); Discordant + Venomcrawler off-menu (resellable)."}
VERIFIED["127980047325"] = {"live":True,"loc":"United Kingdom","auction":True,
  "note":"PURE AUCTION: GBP 363 with 2 bids, ends Fri, no BIN. UK seller (add ship/customs). Final price unknowable — earlier 3.35x score was on a moving bid."}

# Visual paint-tier sweep of PHOTO_SWEEP (docs/sweep-2026-07-21.md): all 29 shortlisted listings
# opened live, every gallery photo viewed at full res + zoom crops. Strict scale — any unpainted or
# primed squad makes the lot Partial. Overlaid on VERIFIED, so it wins where both have an opinion.
SWEEP = {
 "398179688245": {"live":True,"loc":"Australia","tier":"Partial",
   "note":"Photo sweep Jul 21: a GSC + Guard force (not 'Genestealers'); Neophyte squads unpainted grey, 2 Russ hulls flat black; block colours, no washes. AU$425 OBO."},
 "178323247479": {"live":True,"tier":"Partial","auction":True,
   "note":"AUCTION ($299.99, 0 bids Jul 21). Photo sweep: ~1/3 unpainted (black-primed squad + Dunecrawler, bare Kastelans, snapped Dragoon lance, loose sprues); the painted half is genuine Tabletop+ on Mars bases."},
 "398182325496": {"live":True,"loc":"USA","tier":"Basic",
   "note":"Photo sweep Jul 21: thick single-tone silver/red, no highlights, flat untextured bases; both Dreadknights appear to lack pilots. Playable, not display."},
 "366546401110": {"live":True,"loc":"Brighton, United Kingdom","tier":"Tabletop","auction":True,
   "note":"PURE AUCTION (GBP 258, 4 bids Jul 21). Title says '1 of 2' — the 2100pt army is SPLIT across two listings, so pts/$ is fictional. Paint: honest Tabletop (copper base+wash+drybrush), plain flat bases."},
 "158101528667": {"live":True,"loc":"United Kingdom","tier":"High TT",
   "note":"Photo sweep Jul 21: BEST-PAINTED LOT OF THE SWEEP — commission studio work (Wardaddy Miniatures proof card), smooth pink/magenta blends, textured tufted bases on every model. GBP 286 OBO."},
 "327208669797": {"live":True,"loc":"USA","tier":"Partial",
   "note":"Photo sweep Jul 21: Doomstalker + Plasmancer parts bare grey/white, every base plain black plastic; infantry Basic. Only 4 photos. Includes 10th-ed codex."},
 "398197118214": {"live":True,"loc":"USA","tier":"Tabletop","auction":True,
   "note":"AUCTION ($400 start, 0 bids Jul 21, BIN $1,499). Photo sweep: everything painted but 3+ different greens (merged collection), inconsistent basing; characters Tabletop+, some vehicles Basic."},
 "318568479622": {"live":True,"loc":"United Kingdom","tier":"Tabletop+",
   "note":"Photo sweep Jul 21: fully painted, flocked/tufted bases, characters + command Venom near display quality; two vehicle schemes. GBP 300 OBO."},
 "236893740758": {"live":True,"loc":"USA","tier":"Partial",
   "note":"Photo sweep Jul 21: every gold unit unfinished (bare grey blades, Sanguinor wings bare plastic), Redemptor flat black spray; red infantry clean but unshaded. Not a finished army."},
 "376533559353": {"live":True,"loc":"United Kingdom","tier":"Partial",
   "note":"Photo sweep Jul 21: bare grey Lychguard/Stalker/Spyder, black-primed Overlord, models snapped off bases, three mixed schemes (merged lot), Monolith missing parts. Nowhere near finished."},
 "327257545250": {"live":True,"loc":"United Kingdom","tier":"Tabletop",
   "note":"Photo sweep Jul 21: cohesive black/gunmetal grimdark scheme, textured bases done, nothing unpainted; Destroyers loose without stands; OOP metal minis. Honest listing. GBP 334."},
 "307071460902": {"dead":True,"loc":"USA",
   "note":"SOLD Jul 20 for $450. Real title read 'built and semi-painted': 2 big Knights painted, 6 Armigers silver primer — would have been Partial."},
 "227337729652": {"live":True,"loc":"United Kingdom","tier":"Partial",
   "note":"Photo sweep Jul 21: not 'fully painted' — unpainted model in the tray, Inceptors with bare weapons, Stormhawk pilot bare plastic; merged red/blue/black lot. Core infantry solid Tabletop. GBP 350 OBO."},
 "398197107865": {"live":True,"loc":"USA","tier":"Partial","auction":True,
   "note":"AUCTION ($500 opening, 0 bids Jul 21, BIN $1,699) — the '4.9x steal' was an opening bid. Photo sweep: heroes Tabletop+ but basecoat-only vehicles with grey plates, Inceptors on unpainted 3D-printed stands, flat-red captain, mixed basing — an unfinished force."},
 "257604616911": {"live":True,"loc":"United Kingdom","tier":"Basic",
   "note":"Photo sweep Jul 21: thick chalky block-colour green with chips/dust, crude flame freehand, off-scheme grey Eliminators; every base textured+tufted. Listed 'New' but a used repaint. GBP 400 OBO."},
 "257585016061": {"live":True,"loc":"USA","tier":"Partial",
   "note":"Photo sweep Jul 21: near army-wide bare black bases, raw-pewter metal characters, flat unshaded silver + spot colour; merged lot. Not the 'battle-ready' army titled."},
 "188325223279": {"live":True,"loc":"USA","tier":"Tabletop+",
   "note":"Photo sweep Jul 21: cohesive white/blue heraldic Ultramarines (~30 Primaris + Redemptor + characters) — edge highlights, checker freehand, weathering, plasma glow, every base done. One of the sweep's best buys."},
 "358741312462": {"live":True,"loc":"USA","tier":"Tabletop",
   "note":"Photo sweep Jul 21: monsters bone with washes on scenic bases (Tabletop+), gaunt hordes flatter white/orange; two sub-schemes; no bare plastic. Was 'in 1 cart'."},
 "398162672602": {"live":True,"loc":"USA","tier":"Partial",
   "note":"Photo sweep Jul 21: the Custodes read Tabletop+ (Shadowkeeper black/gold) but ~10 Sisters of Silence are flat black/unpainted and NOTHING is based; low-res photos, 2-feedback seller."},
 "800340524235": {"live":True,"loc":"USA","tier":"Tabletop",
   "note":"Photo sweep Jul 21: ~15 Noise Marines + Maulerfiend + characters painted (custom black/pink/green); 3 Rhinos Basic; AoS Sigvald proxy character. No primer."},
 "398185912944": {"live":True,"loc":"USA","tier":"Tabletop+",
   "note":"Photo sweep Jul 21: big kits High-TT (airbrushed gradients, panel lining, freehand), extremely cohesive; infantry bases plain black. Fixed $650, 16 watchers."},
 "157943077842": {"live":True,"loc":"USA","tier":"Tabletop",
   "note":"Photo sweep Jul 21: only 3 photos — cohesive bone/blue-black scheme with washes, monsters nicely shaded, mixed base styles; 3-feedback seller. Lower confidence."},
 "298498210036": {"live":True,"loc":"USA","tier":"Tabletop+","auction":True,
   "note":"AUCTION — 8 bids at $660, ended Jul 21 (23 watchers). Every model painted: recess lining, edge highlights, banners, weathered vehicles; merged silver-blue + bronze schemes; Land Raider, dread, Dreadknight, codex."},
 "317914780462": {"live":True,"loc":"United Kingdom","tier":"Tabletop",
   "note":"Photo sweep Jul 21: paint is Tabletop+ (pink-flesh/navy/white, washes + highlights) but the ENTIRE force sits on plain black undecorated bases. GBP 582."},
 "318600164171": {"live":True,"loc":"USA","tier":"Tabletop+",
   "note":"Photo sweep Jul 21: borderline High TT — blended blue armour, freehand checks, plasma/flame glow, weathering, fully flocked bases; Land Raider, tank, dread, characters. Cohesive and complete."},
 "168501751335": {"live":True,"loc":"USA","tier":"Basic",
   "note":"Photo sweep Jul 21: every model painted (drybrushed dark metallics + green energy) but bare black bases with unpainted rock scatter; an unbuilt sprue included. Borderline Tabletop but for the bases."},
 "206417990509": {"live":True,"tier":"Partial",
   "note":"Photo sweep Jul 21: HIGH RISK — single overhead photo, 0-feedback seller, ~20 bare grey Tzaangors + unpainted marine bodies; Kairos/Mutalith/Heldrake/Knight Despoiler at basic block-colour level on bare black bases."},
 "188666300998": {"live":True,"auction":True,
   "note":"Flipped to AUCTION Jul 21 ($800 opening, 0 bids, BIN $1,100). 22 photos: cohesive red/brass World Eaters scheme, blood effects, scenic snow bases (DP, Saturnine dread, Rhino, MoE, Termis, Berzerkers, Jakhals); thick paint up close — solid at arm's length, not 'pro'."},
 "800372311561": {"live":True,"tier":"Primer",
   "note":"AUCTION ($137, 1 bid Jul 21). PRIMER-ONLY: tray of ~30 bare grey models, infantry red/black rattle-can only, tanks mottled spray — a primed kit-value lot, not a painted army (explains the bid)."},
 # eyeballed Jul 20 (handoff), not re-checked in the sweep
 "188656011886": {"tier":"Partial"},
 "358732050273": {"tier":"Tabletop"},
 "206149396177": {"tier":"Tabletop+","note":"2500pts Tyranids — eyeballed Jul 20: Tabletop+/High TT, showcase basing; was 'in 1 cart'."},
}
for _id, _v in SWEEP.items():
    VERIFIED.setdefault(_id, {}).update(_v)

def parse_points(t):
    tl = t.lower()
    m = re.search(r'(\d+)\s*k\+?\s*(?:pt|pts|point|points)\b', tl)   # "3k+ pts"
    if m: return int(m.group(1))*1000
    m = re.search(r'(\d[\d,]*)\s*\+?\s*(?:pt|pts|point|points)\b', tl) # "2000 point", "4300+pt", "2500 points"
    if m:
        v = int(m.group(1).replace(",",""))
        return v if 200 <= v <= 20000 else None
    return None

def parse_price(p):
    """Return (min_usd, is_range, display)."""
    disp = p.strip()
    nums = [float(x.replace(",","")) for x in re.findall(r'[0-9][0-9,]*\.?[0-9]*', p)]
    if not nums: return (None, False, disp)
    is_range = " to " in p
    return (min(nums), is_range, disp)

def verdict(r):
    if r is None: return None
    if r >= 1.5: return "BUY"
    if r >= 0.8: return "FAIR"
    return "SKIP"

def is_commission(title, is_range):
    t = title.lower()
    return is_range or any(k in t for k in
        ["commission","army builder","made-to-order","made to order","paint service"])

def build_row(faction, item_id, price, title):
    price_usd, is_range, disp = parse_price(price)
    url = f"https://www.ebay.com/itm/{item_id}"
    v = VERIFIED.get(item_id, {})
    comm = is_commission(title, is_range)
    pts = v.get("pts") or parse_points(title)
    tier = v.get("tier", DEFAULT_TIER)
    tier_assumed = "tier" not in v
    landed = round(price_usd*1.03 + 35, 2) if price_usd else None
    # itemized MSRP from the listing's actual army list (deep scan) beats the points heuristic
    msrp = v.get("msrp") or (round(pts*MSRP_PER_PT, 2) if pts else None)
    ratio = None
    auction = bool(v.get("auction")) or bool(price_usd is not None and price_usd < 60 and (pts or msrp))
    dead = bool(v.get("dead"))
    if msrp and landed and not comm and not auction and not dead:
        ratio = round((msrp*PREMIUM[tier]) / landed, 2)
    row = {
        "faction": faction,
        "name": title,
        "itemId": item_id,
        "url": url,
        "priceDisplay": disp,
        "priceUSD": price_usd,
        "landedUSD": landed,
        "points": pts,
        "kitMsrpUSD": msrp,
        "paintTier": tier,
        "paintTierAssumed": tier_assumed,
        "valueRatio": ratio,
        "verdict": ("SOLD" if dead else "AUCTION" if auction else "COMMISSION" if comm else (verdict(ratio) if ratio is not None else "UNSCORED")),
        "type": ("commission" if comm else "ready-to-ship"),
        "verifiedLive": v.get("live", False),
        "location": v.get("loc"),
        "notes": v.get("note"),
    }
    if auction and not v.get("auction"):
        row["notes"] = ((row["notes"] + " ") if row["notes"] else "") + \
            "Price looks like an auction starting bid — final price will be far higher."
    if v.get("msrp"):
        row["msrpSource"] = "itemized from listing contents"
    return row

def build_edition(raw_path, out_stem, edition_title, extra):
    rows = []
    with open(raw_path, newline="", encoding="utf-8") as f:
        r = csv.reader(f, delimiter="|")
        header = next(r)
        for line in r:
            if len(line) < 4: continue
            rows.append(build_row(line[0].strip(), line[1].strip(), line[2].strip(), "|".join(line[3:]).strip()))
    for e in extra:
        if not any(x["itemId"]==e["itemId"] for x in rows):
            rows.append(build_row(e["faction"], e["itemId"], e["price"], e["title"]))

    # sort: faction, then best ratio first (scored), then commissions, then unscored
    def sort_key(x):
        r = x["valueRatio"]
        band = 0 if r is not None else (1 if x["verdict"]=="COMMISSION" else 2)
        return (x["faction"], band, -(r or 0))
    rows.sort(key=sort_key)

    scored = [x for x in rows if x["valueRatio"] is not None]
    buys = [x for x in scored if x["verdict"]=="BUY"]
    meta = {
        "title": edition_title,
        "generated": datetime.date.today().isoformat(),
        "scanned": FEED_SCANNED,
        "photoSweep": PHOTO_SWEEP,
        "source": "eBay category feeds: bn_96974265 (all-faction painted complete armies, p1-5) + bn_119783045 (Necrons) + web-searched Be'lakor singles. Search API was bot-blocked; category pages used instead.",
        "currency": "USD (eBay converted display prices)",
        "count": len(rows),
        "factions": sorted(set(x["faction"] for x in rows)),
        "scoredCount": len(scored),
        "buyCount": len(buys),
        "model": "ValueRatio = (points*0.45*premium)/(price*1.03+35); premium Tabletop+ =2.0x unless verified. >=1.5 BUY, 0.8-1.49 FAIR, <0.8 SKIP.",
        "disclaimer": "Paint tier is ASSUMED Tabletop+ unless verifiedLive=true. 'Pro painted' is a seller claim. Points parsed from titles; many titles omit points (UNSCORED). Verify photos/contents/shipping before buying. Prices/availability change fast.",
    }
    payload = {"meta": meta, "listings": rows}
    out_json = os.path.join(HERE, out_stem + ".json")
    # only rewrite when something other than the build date moved (keeps git quiet)
    try:
        prev = json.load(open(out_json, encoding="utf-8"))
        prev["meta"]["generated"] = meta["generated"]
    except (OSError, ValueError, KeyError):
        prev = None
    out_js = os.path.join(HERE, out_stem + ".js")
    if prev != payload or not os.path.exists(out_js):
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=1, ensure_ascii=False)
        # inlined copy so the viewers open via file:// (no fetch/CORS); keyed by edition so one page
        # could load several — the viewer itself just reads SCORECARD_DATA
        with open(out_js, "w", encoding="utf-8") as f:
            f.write(f'window.SCORECARD_DATA = (window.SCORECARDS = window.SCORECARDS || {{}})["{out_stem}"] = '
                    + json.dumps(payload, ensure_ascii=False) + ";")

    # console summary
    print(f"[{out_stem}] listings: {len(rows)} | scored: {len(scored)} | BUY: {len(buys)}")
    from collections import Counter
    c = Counter(x["faction"] for x in rows)
    print("  factions:", ", ".join(f"{k}:{v}" for k,v in c.most_common()))
    print("  Top BUY-grade (ratio desc):")
    for x in sorted(buys, key=lambda x:-x["valueRatio"])[:8]:
        live = " [LIVE]" if x["verifiedLive"] else ""
        print(f'   {x["valueRatio"]}x  {x["faction"]:<18} {x["priceDisplay"]:<14} {x["points"]}pt  {x["name"][:40]}{live}')
    print()
    return payload

EDITIONS = [
    (RAW, "listings", "40K Painted Army Value Scorecard — All Factions", EXTRA),
    (os.path.join(HERE, "data", "raw_chaos.psv"), "chaos",
     "40K Painted Army Value Scorecard — Chaos / Be'lakor Edition", EXTRA_CHAOS),
]

def main():
    seen = {}                                   # itemId -> verdict, across editions (they overlap)
    for raw, stem, title, extra in EDITIONS:
        for x in build_edition(raw, stem, title, extra)["listings"]:
            if seen.get(x["itemId"]) != "BUY":
                seen[x["itemId"]] = x["verdict"]
    buys = sum(1 for v in seen.values() if v == "BUY")
    market = (f'<span class="chip">Scorecard <b>{len(seen)}</b> listings · <b>{buys}</b> BUY-grade</span>'
              f'<span class="chip">Feed scanned <b>{FEED_SCANNED}</b> · photos swept <b>{PHOTO_SWEEP}</b></span>')
    muster.build()          # canonical store → muster.js + generated regions (fails loudly if the store is invalid)
    pages.build(market)     # doc pages + shared nav (+ these numbers on the hub)

if __name__ == "__main__":
    main()
