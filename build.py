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

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw_listings.psv")
OUT = os.path.join(HERE, "listings.json")

MSRP_PER_PT = 0.45          # USD GW retail per point
PREMIUM = {"Basic":1.30,"Tabletop":1.60,"Tabletop+":2.00,"High TT":2.50,"Display":3.50}
DEFAULT_TIER = "Tabletop+"  # assumption when unverified

# Listings individually opened & confirmed live at build time.
# We set live/loc/note (+pts when the title omits them) but NOT tier — paint quality
# wasn't assessed from photos, so every listing keeps the assumed Tabletop+ premium
# (matches the original board's calibration). Verify photos before buying.
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
 # Chaos-edition picks confirmed live (Be'lakor rerun)
 "236942163636": {"live":True,"loc":"California, USA","note":"Daemons 'Shadow Legion' lot, Word Bearers theme — natural Be'lakor host army."},
 "188656011886": {"live":True,"loc":"South Carolina, USA","note":"2k points CSM — Be'lakor can lead CSM detachments."},
 "206417990509": {"live":True,"loc":"Texas, USA","note":"Kairos Fateweaver + Helldrake + Mutalith — daemon-heavy Thousand Sons."},
 "188666300998": {"live":True,"loc":"Texas, USA","note":"World Eaters lot, pro painted."},
 "297286491088": {"live":True,"loc":"California, USA","note":"Small Daemons force — cheap Be'lakor escort."},
 "297172534500": {"live":True,"loc":"Poland","note":"BE'LAKOR himself, painted — centerpiece single model. EU shipping."},
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
]

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
    msrp = round(pts*MSRP_PER_PT, 2) if pts else None
    ratio = None
    auction_start = bool(price_usd is not None and price_usd < 60 and pts)
    if pts and landed and not comm and not auction_start:
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
        "verdict": ("COMMISSION" if comm else (verdict(ratio) if ratio is not None else "UNSCORED")),
        "type": ("commission" if comm else "ready-to-ship"),
        "verifiedLive": v.get("live", False),
        "location": v.get("loc"),
        "notes": v.get("note"),
    }
    if auction_start:
        row["notes"] = ((row["notes"] + " ") if row["notes"] else "") + \
            "Price looks like an auction starting bid — final price will be far higher."
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
    with open(os.path.join(HERE, out_stem + ".json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1, ensure_ascii=False)
    # inlined copy so the HTML viewers open standalone via file:// (no fetch/CORS needed)
    with open(os.path.join(HERE, out_stem + ".js"), "w", encoding="utf-8") as f:
        f.write("window.SCORECARD_DATA = " + json.dumps(payload, ensure_ascii=False) + ";")

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

def main():
    build_edition(RAW, "listings", "40K Painted Army Value Scorecard — All Factions", EXTRA)
    chaos_raw = os.path.join(HERE, "data", "raw_chaos.psv")
    if os.path.exists(chaos_raw):
        build_edition(chaos_raw, "chaos",
                      "40K Painted Army Value Scorecard — Chaos / Be'lakor Edition", EXTRA_CHAOS)

if __name__ == "__main__":
    main()
