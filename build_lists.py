#!/usr/bin/env python3
"""
The Shadow Legion list book — build step.

Reads data/units.json (datasheet reference + inventory) and data/lists.json
(the lists, as references to those datasheets), validates every list and every
listed swap against the detachment rules this repo has verified, computes each
list's gap from the inventory, and writes army-lists.md.

    python3 build_lists.py            # validate, then write army-lists.md
    python3 build_lists.py --check    # validate only; exit 1 on any error

Numbers live in the two JSON files. Do not hand-edit army-lists.md.
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS_PATH = os.path.join(HERE, "data", "units.json")
LISTS_PATH = os.path.join(HERE, "data", "lists.json")
OUT = os.path.join(HERE, "army-lists.md")

SECTION_ORDER = ["Characters", "Battleline", "Other Datasheets", "Allied Units"]
LOADOUT_WIDTH = 76


# ----------------------------------------------------------------------------
# loading and resolution
# ----------------------------------------------------------------------------

def load():
    with open(UNITS_PATH, encoding="utf-8") as f:
        udata = json.load(f)
    with open(LISTS_PATH, encoding="utf-8") as f:
        ldata = json.load(f)
    units = {u["id"]: u for u in udata["units"]}
    enh = {e["id"]: e for e in udata["enhancements"]}
    return udata, ldata, units, enh


def resolve(specs, units, enh, errors):
    """Turn the list's unit specs into entry dicts with points attached."""
    entries = []
    seen = set()
    for i, spec in enumerate(specs):
        uid = spec.get("unit")
        u = units.get(uid)
        if u is None:
            errors.append(f"unknown unit id '{uid}'")
            continue
        if u.get("detachment_legal") is False:
            errors.append(f"{u['name']} is illegal here: {u.get('illegal_reason', 'not allowed')}")
            continue
        if u.get("fieldable") is False:
            errors.append(f"{u['name']} is not a fieldable unit")
            continue
        sizes = u.get("sizes", {})
        size = spec.get("size")
        if size is None:
            if len(sizes) == 1:
                size = int(next(iter(sizes)))
            else:
                errors.append(f"{u['name']}: size not given and the datasheet lists {len(sizes)} sizes")
                continue
        pts = sizes.get(str(size))
        if pts is None:
            errors.append(f"{u['name']}: no recorded price for a unit of {size} (recorded: {', '.join(sizes) or 'none'})")
            continue
        e_id = spec.get("enhancement")
        e = None
        if e_id:
            e = enh.get(e_id)
            if e is None:
                errors.append(f"{u['name']}: unknown enhancement '{e_id}'")
        ref = spec.get("ref") or f"{uid}#{i}"
        if ref in seen:
            errors.append(f"duplicate ref '{ref}'")
        seen.add(ref)
        entries.append({
            "ref": ref,
            "unit": u,
            "size": size,
            "pts": pts,
            "enh": e,
            "enh_pts": e["points"] if e else 0,
            "label": spec.get("label"),
            "leads": spec.get("leads"),
            "loadout": spec.get("loadout") or u.get("loadout", []),
            "led_by": None,
            "tag": "",
        })
    return entries


def assign_tags(entries):
    """Allocate owned models to entries in roster order; tag what is left over."""
    remaining = {}
    for e in entries:
        u = e["unit"]
        o = u.get("owned", {})
        st = o.get("status", "none")
        remaining.setdefault(u["id"], o.get("count", 0))
        have = remaining[u["id"]]
        if st == "none":
            tag = "buy"
        elif st == "inbound":
            tag = "inbound"
        elif st == "uncatalogued":
            tag = "delivered, uncatalogued"
        elif st == "assemble":
            tag = "assemble"
        elif have >= e["size"]:
            tag = "own"
        elif have <= 0:
            tag = "buy"
        else:
            tag = f"own, {e['size'] - have} short"
        remaining[u["id"]] = have - e["size"]
        e["tag"] = tag


# ----------------------------------------------------------------------------
# validation
# ----------------------------------------------------------------------------

def validate(lst, entries, units, limits):
    errors, warnings = [], []
    refs = {e["ref"]: e for e in entries}
    total = sum(e["pts"] + e["enh_pts"] for e in entries)
    if total > limits["points"]:
        errors.append(f"{total} points exceeds the {limits['points']}-point limit")
    if total < limits["points"] - 100:
        warnings.append(f"{limits['points'] - total} points unspent")

    # Warlord
    wl = lst.get("warlord")
    wl_entry = refs.get(wl) or next((e for e in entries if e["unit"]["id"] == wl), None)
    if wl_entry is None:
        errors.append(f"warlord '{wl}' is not in the list")
    else:
        wl_entry["warlord"] = True
        if "Character" not in wl_entry["unit"]["keywords"]:
            errors.append(f"warlord {wl_entry['unit']['name']} is not a Character")
        if wl_entry["unit"].get("dreadblade"):
            errors.append("a Dreadblade cannot be the Warlord")
    has_belakor = any(e["unit"]["id"] == "belakor" for e in entries)
    if has_belakor and (wl_entry is None or wl_entry["unit"]["id"] != "belakor"):
        errors.append("Be'lakor is present but is not the Warlord (Supreme Commander is mandatory)")

    # unit legality
    for e in entries:
        u = e["unit"]
        kw = set(u.get("keywords", []))
        if u.get("fieldable") is False:
            errors.append(f"{u['name']} is not a fieldable unit")
        if u.get("detachment_legal") is False:
            errors.append(f"{u['name']} is illegal here: {u.get('illegal_reason', 'not allowed')}")
        if "Epic Hero" in kw and u["id"] != "belakor":
            errors.append(f"{u['name']} is an Epic Hero; only Be'lakor is allowed")
        if "Daemon Prince" in kw:
            errors.append(f"{u['name']}: the Shadow Legion admits no Daemon Princes")
        if "Vehicle" in kw and not u.get("dreadblade"):
            errors.append(f"{u['name']} is a Vehicle; the Shadow Legion admits none")

    # Heretic Astartes share (07-27 ledger convention: points, enhancements excluded)
    ha = sum(e["pts"] for e in entries if e["unit"].get("faction") == "Heretic Astartes")
    if ha > limits["heretic_astartes_points"]:
        errors.append(f"Heretic Astartes share {ha} exceeds {limits['heretic_astartes_points']}")

    # Dreadblades
    dbs = [e for e in entries if e["unit"].get("dreadblade")]
    if len(dbs) > limits["dreadblades"]:
        errors.append(f"{len(dbs)} Dreadblades; at most {limits['dreadblades']} allowed")
    for e in dbs:
        if e["enh"]:
            errors.append(f"{e['unit']['name']}: a Dreadblade cannot take an enhancement")

    # enhancements
    enhs = [e for e in entries if e["enh"]]
    if len(enhs) > limits["enhancements"]:
        errors.append(f"{len(enhs)} enhancements; at most {limits['enhancements']} allowed")
    for eid, n in Counter(e["enh"]["id"] for e in enhs).items():
        if n > 1:
            errors.append(f"enhancement '{eid}' taken {n} times; each enhancement once per army")
    for e in enhs:
        kw = set(e["unit"]["keywords"])
        if e["enh"].get("detachment") != "Shadow Legion":
            errors.append(f"{e['enh']['name']} belongs to {e['enh'].get('detachment')}, not the Shadow Legion")
        if "Character" not in kw or "Epic Hero" in kw:
            errors.append(f"{e['unit']['name']} cannot carry {e['enh']['name']} (not a Character, or an Epic Hero)")

    # leader attachments
    led = {}
    for e in entries:
        tgt_ref = e.get("leads")
        if not tgt_ref:
            continue
        tgt = refs.get(tgt_ref)
        if tgt is None:
            errors.append(f"{e['unit']['name']} leads '{tgt_ref}', which is not in the list")
            continue
        if "Character" not in e["unit"]["keywords"]:
            errors.append(f"{e['unit']['name']} is not a Character and cannot lead")
        if tgt["unit"]["id"] not in e["unit"].get("leads", []):
            errors.append(f"{e['unit']['name']} cannot lead {tgt['unit']['name']} (recorded pairings: {', '.join(e['unit'].get('leads') or ['none'])})")
        if tgt["ref"] in led:
            errors.append(f"{tgt['unit']['name']} ({tgt_ref}) is led by two characters")
        led[tgt["ref"]] = e
        tgt["led_by"] = e

    # datasheet limits
    for uid, n in Counter(e["unit"]["id"] for e in entries).items():
        u = units[uid]
        cap = limits["per_battleline_datasheet"] if "Battleline" in u["keywords"] else limits["per_datasheet"]
        if n > cap:
            errors.append(f"{u['name']} appears {n} times; at most {cap} of that datasheet")

    flagged = sorted({e["unit"]["name"] for e in entries if e["unit"].get("verify")}
                     | {e["enh"]["name"] for e in entries if e["enh"] and e["enh"].get("verify")})
    return {"total": total, "ha": ha, "dreadblades": len(dbs), "enhancements": len(enhs),
            "battleline": sum(1 for e in entries if "Battleline" in e["unit"]["keywords"]),
            "characters": sum(1 for e in entries if "Character" in e["unit"]["keywords"]),
            "errors": errors, "warnings": warnings, "flagged": flagged}


# ----------------------------------------------------------------------------
# gaps
# ----------------------------------------------------------------------------

def unit_count_word(u, n):
    return u["name"] if n == 1 else f"{u['name']} ×{n}"


def compute_gap(entries, units):
    need = Counter()
    for e in entries:
        need[e["unit"]["id"]] += e["size"]
    buy, assemble = [], []
    for uid, n in need.items():
        u = units[uid]
        o = u.get("owned", {})
        have = o.get("count", 0)
        st = o.get("status", "none")
        if st == "assemble":
            note = "owned, unassembled"
            if o.get("proxy"):
                note += "; a 3D-print proxy, so casual-legal only: a genuine kit is still the buy for GW-run events"
            if o.get("note") and not o.get("proxy"):
                note += f"; {o['note'].rstrip('.')}"
            assemble.append({"kind": "build", "proxy": bool(o.get("proxy")),
                             "short": f"{u['name']} (assemble)", "long": f"{u['name']}: {note}"})
        if n > have:
            short = n - have
            if st == "inbound":
                buy.append({"kind": "await", "short": f"{unit_count_word(u, short)} (lot inbound)",
                            "long": f"{unit_count_word(u, short)}: an inbound lot of unknown count may cover some or all"})
            elif st == "uncatalogued":
                buy.append({"kind": "catalogue", "short": f"{unit_count_word(u, short)} (lot delivered, uncatalogued)",
                            "long": f"{unit_count_word(u, short)}: a lot has been delivered but not yet catalogued; count it before buying"})
            elif st == "none":
                item = {"kind": "buy", "short": unit_count_word(u, n), "long": f"{unit_count_word(u, n)}: not owned"}
                if o.get("pending"):
                    item["short"] += " (lot pending catalogue)"
                    item["long"] += f"; {o['pending'].rstrip('.')}"
                buy.append(item)
            else:
                rng = o.get("count_range")
                detail = f"{have} owned of {n} needed"
                if rng:
                    detail += f"; the count is unconfirmed, {rng[0]} to {rng[1]} in all"
                item = {"kind": "buy", "short": f"{u['name']}: {short} models",
                        "long": f"{u['name']}: {short} more models ({detail})"}
                if o.get("pending"):
                    item["short"] += " (lot pending catalogue)"
                    item["long"] += f"; {o['pending'].rstrip('.')}"
                buy.append(item)
    return buy, assemble


def status_line(buy, assemble):
    if buy:
        return "needs " + ", ".join(b["short"] for b in buy)
    if assemble:
        line = "complete once assembled: " + ", ".join(a["short"].replace(" (assemble)", "") for a in assemble)
        if any(a["proxy"] for a in assemble):
            line += " (proxy, casual only)"
        return line
    return "complete, every model owned"


# ----------------------------------------------------------------------------
# swaps
# ----------------------------------------------------------------------------

def apply_swap(lst, swap):
    specs = [dict(s) for s in lst["units"]]
    remove = set(swap.get("remove", []))
    specs = [s for s in specs if s.get("ref") not in remove]
    for s in swap.get("add", []):
        specs.append(dict(s))
    by_ref = {s.get("ref"): s for s in specs}
    for ae in swap.get("add_enhancement", []):
        by_ref[ae["ref"]]["enhancement"] = ae["enhancement"]
    for r in swap.get("remove_enhancement", []):
        by_ref[r].pop("enhancement", None)
    for leader, tgt in swap.get("relead", {}).items():
        by_ref[leader]["leads"] = tgt
    new = dict(lst)
    new["units"] = specs
    new["swaps"] = []
    return new


# ----------------------------------------------------------------------------
# rendering
# ----------------------------------------------------------------------------

def fmt(n):
    return f"{n:,}"


def disp_name(e):
    u = e["unit"]
    name = u["name"]
    if u.get("alias") and e["tag"].startswith("own"):
        name += f' "{u["alias"]}"'
    if e.get("label"):
        name += f" {e['label']}"
    if e["size"] > 1:
        name += f" ×{e['size']}"
    return name


def wrap_loadout(items):
    joined = " · ".join(items)
    if len(joined) <= LOADOUT_WIDTH:
        return ["  " + joined] if items else []
    return ["  " + it for it in items]


def roster_text(lst, entries, v, limits):
    refs = {e["ref"]: e for e in entries}
    lines = [f"{lst['id']} · {lst['name']} ({v['total']} points)",
             f"Chaos Daemons · Strike Force ({limits['points']} points) · Shadow Legion (2 DP)", ""]
    for sec in SECTION_ORDER:
        group = [e for e in entries if e["unit"]["section"] == sec]
        if not group:
            continue
        lines.append(sec.upper())
        for e in group:
            if e["enh"]:
                pts = f"{e['pts']} + {e['enh']['name']} {e['enh_pts']} = {e['pts'] + e['enh_pts']}"
            else:
                pts = str(e["pts"])
            head = f"{disp_name(e)} ({pts}) [{e['tag']}]"
            if e.get("warlord"):
                head += " WARLORD"
            if e.get("led_by"):
                head += f" led by {disp_name(e['led_by'])}"
            lines.append(head)
            lines.extend(wrap_loadout(e["loadout"]))
            extras = []
            if e["enh"]:
                extras.append(f"Enhancement: {e['enh']['name']}")
            if e.get("leads"):
                extras.append(f"Leads: {disp_name(refs[e['leads']])}")
            if extras:
                lines.append("  " + " · ".join(extras))
        lines.append("")
    lines.append(f"TOTAL {v['total']} / {limits['points']} · Heretic Astartes {v['ha']} / {limits['heretic_astartes_points']}"
                 f" · Dreadblades {v['dreadblades']} / {limits['dreadblades']} · Enhancements {v['enhancements']} / {limits['enhancements']}")
    return "\n".join(lines)


def render_list(lst, entries, v, buy, assemble, swaps_out, limits):
    o = []
    o.append(f"### {lst['id']} · {lst['name']}")
    o.append("")
    o.append(f"**{fmt(v['total'])} / {fmt(limits['points'])} pts · {status_line(buy, assemble)}**")
    o.append("")
    o.append(f"*{lst['shape']}.* {lst['plan']}")
    o.append("")
    enh_bits = [f"{e['enh']['name']} on the {e['unit']['name']} ({e['enh_pts']})" for e in entries if e["enh"]]
    legal = [f"Warlord {next(e['unit']['name'] for e in entries if e.get('warlord'))}",
             ("enhancements: " + "; ".join(enh_bits)) if enh_bits else "no enhancements",
             f"Heretic Astartes {fmt(v['ha'])} / {fmt(limits['heretic_astartes_points'])}",
             f"Dreadblades {v['dreadblades']} / {limits['dreadblades']}",
             f"{v['battleline']} Battleline, {v['characters']} Characters"]
    o.append("Checked: " + " · ".join(legal) + ".")
    if v["flagged"]:
        o.append("")
        o.append("Points in this list flagged verify (derived, not read): " + ", ".join(v["flagged"]) + ".")
    o.append("")
    o.append("```text")
    o.append(roster_text(lst, entries, v, limits))
    o.append("```")
    o.append("")
    o.append("**Gap to complete.**")
    if not buy and not assemble:
        o.append("")
        o.append("None. Every unit is owned and painted.")
    else:
        o.append("")
        verbs = {"buy": "Buy", "await": "Await", "catalogue": "Catalogue"}
        for b in buy:
            o.append(f"- {verbs.get(b.get('kind', 'buy'), 'Buy')}: {b['long']}.")
        for a in assemble:
            o.append(f"- Build: {a['long']}.")
    o.append("")
    if swaps_out:
        o.append("**Options within the list.** Each swap has been re-totalled and re-checked by the validator.")
        o.append("")
        for s in swaps_out:
            o.append(f"- {s}")
        o.append("")
    o.append(f"**Deployment sketch.** {lst['deployment']}")
    o.append("")
    o.append(f"**History.** {lst['history']}")
    o.append("")
    return "\n".join(o)


def render_reference(udata, units):
    o = ["## Datasheet reference: full options", ""]
    o.append("*One entry per datasheet the lists use. Points are per unit at the recorded sizes; "
             "sizes the audit never priced are omitted, not absent. Loadout is the default build the rosters "
             "assume unless a roster line says otherwise; Options is every swap recorded for the datasheet. "
             "Where the painted models' weapons were never logged, Owned says so: log them here before a "
             "tournament, since WYSIWYG will be enforced there and nowhere else.*")
    o.append("")
    fieldable = [u for u in udata["units"] if u.get("fieldable", True) and u.get("detachment_legal", True)]
    for sec in SECTION_ORDER:
        group = [u for u in fieldable if u["section"] == sec]
        if not group:
            continue
        o.append(f"### {sec}")
        o.append("")
        for u in group:
            sizes = sorted(((int(n), p) for n, p in u["sizes"].items()), key=lambda x: x[0])
            size_str = " · ".join(f"{p} pts ({n} model{'s' if n > 1 else ''})" for n, p in sizes) or "no price recorded"
            title = u.get("long_name") or u["name"]
            if u.get("alias"):
                title += f' (the collection\'s is "{u["alias"]}")'
            o.append(f"#### {title} — {size_str}")
            o.append("")
            src = u.get("points_source", "")
            if u.get("verify"):
                src += " — **verify**"
            o.append(f"{u['faction']} · {u['god']} · keywords that matter: {', '.join(u['keywords'])}.")
            o.append("")
            o.append(f"- **Points source:** {src}")
            o.append(f"- **Loadout:** {'; '.join(u['loadout']) if u['loadout'] else 'none recorded'}"
                     + (f". Champion: {u['champion']}" if u.get("champion") else ""))
            opts = u.get("options") or []
            o.append("- **Options:** " + ("; ".join(opts) if opts else "none"))
            if u.get("verify_options"):
                o.append(f"  - verify: {u['verify_options']}")
            leads = u.get("leads") or []
            o.append("- **Leads:** " + (", ".join(units[x]["name"] for x in leads) if leads else "does not lead"))
            if u.get("verify_leads"):
                o.append(f"  - verify: {u['verify_leads']}")
            ow = u.get("owned", {})
            own_bits = [f"{ow.get('count', 0)}"]
            if ow.get("count_range"):
                own_bits[0] += f" (unconfirmed: {ow['count_range'][0]} to {ow['count_range'][1]})"
            st_word = {"own": "", "assemble": "unassembled", "inbound": "inbound",
                       "uncatalogued": "delivered, not yet catalogued", "none": "not owned"}[ow.get("status", "none")]
            if st_word:
                own_bits.append(st_word)
            if ow.get("paint"):
                own_bits.append(ow["paint"])
            if ow.get("proxy"):
                own_bits.append("3D-print proxy")
            line = f"- **Owned:** {', '.join(own_bits)}."
            if ow.get("note"):
                note = ow["note"].rstrip(".")
                line += f" {note[0].upper() + note[1:]}."
            if ow.get("built"):
                line += f" As built: {ow['built'].rstrip('.')}."
            if ow.get("pending"):
                line += f" Pending: {ow['pending'].rstrip('.')}."
            o.append(line)
            if u.get("notes"):
                o.append(f"- **Notes:** {u['notes']}")
            o.append("")
    others = [u for u in udata["units"] if u not in fieldable]
    if others:
        o.append("### In the inventory, not fieldable here")
        o.append("")
        for u in others:
            ow = u.get("owned", {})
            why = u.get("illegal_reason") or "split tokens, not a unit"
            o.append(f"- **{u['name']}** — {why}. Owned: {ow.get('count', 0)}, {ow.get('paint', '')}. {u.get('notes', '')}")
        o.append("")
    return "\n".join(o)


def render_enhancements(udata):
    o = ["## Enhancements recorded", "",
         "| Enhancement | Detachment | Pts | Source | What it does |", "|---|---|---|---|---|"]
    for e in udata["enhancements"]:
        src = e.get("source", "") + (" — verify" if e.get("verify") else "")
        o.append(f"| {e['name']} | {e['detachment']} | {e['points']} | {src} | {e['gist']} |")
    o.append("")
    return "\n".join(o)


def render_rules(limits):
    o = ["## What the validator checks", "",
         "Every list and every swap above passed these, which are the rules `quartermaster.md` and "
         "`belakor-shadow-legion-guide.md` record as verified on 2026-07-27. A rules change is an edit "
         "to `data/units.json` (keywords, limits), not to this file.", ""]
    o += [
        f"- Total at most {fmt(limits['points'])} points; a list more than 100 under is flagged as a warning.",
        "- Be'lakor, when present, is the Warlord (Supreme Commander is mandatory).",
        "- No Epic Hero other than Be'lakor (so no Skulltaker, Karanak, Skarbrand or Kairos), no Daemon Prince, no Vehicle.",
        f"- Heretic Astartes units total at most {fmt(limits['heretic_astartes_points'])} points, counted without enhancement costs, as the 07-27 ledger counted them (verify whether the current wording counts points or units).",
        f"- At most {limits['dreadblades']} Chaos Knights Dreadblades; none is the Warlord and none carries an enhancement.",
        f"- At most {limits['enhancements']} enhancements, each taken once, each on a Character that is not an Epic Hero, each belonging to the Shadow Legion (Soul-shattering Charge is Cavalcade of Chaos and is rejected).",
        "- Every leader attachment uses a pairing the datasheet reference records; no unit is led twice.",
        f"- At most {limits['per_datasheet']} units of one datasheet, {limits['per_battleline_datasheet']} if Battleline; every unit size has a recorded price.",
        "- Only fieldable, detachment-legal datasheets (the Daemon Prince and the Brimstone tokens are in the data so that a list using them fails).",
        "",
        "Not checked, because the repo has no verified text for them: the reserves cap, the wargear swap rules themselves, and any per-model option limits. Read those from the app.",
        "",
    ]
    return "\n".join(o)


def render_inventory(udata):
    o = ["## Inventory snapshot used by this book", "",
         f"*Copied from {udata['meta']['inventory_as_of']}. "
         "`quartermaster.md` stays the ledger of record; when it changes, change `data/units.json` in the "
         "same commit and rerun the build.*", "",
         "| Unit | Owned | Status | Note |", "|---|---|---|---|"]
    for u in udata["units"]:
        ow = u.get("owned", {})
        count = str(ow.get("count", 0))
        if ow.get("count_range"):
            count += f" ({ow['count_range'][0]}–{ow['count_range'][1]})"
        st = ow.get("status", "none")
        if ow.get("proxy"):
            st += ", 3D-print proxy"
        note = ow.get("note", "")
        if ow.get("pending"):
            note = (note + ". " if note else "") + "Pending: " + ow["pending"].rstrip(".")
        o.append(f"| {u['name']} | {count} | {st} | {note} |")
    o.append("")
    return "\n".join(o)


def cross_check(udata, units, enh):
    """Refuse to drift from data/datasheets.json (extracted from BSData) where both carry a price."""
    path = os.path.join(HERE, "data", "datasheets.json")
    if not os.path.exists(path):
        return [], ["data/datasheets.json not present; points not cross-checked"]
    with open(path, encoding="utf-8") as f:
        ds = json.load(f)
    errors, warnings = [], []
    sheets = {d["id"]: d for d in ds.get("datasheets", [])}
    for uid, u in units.items():
        d = sheets.get(uid)
        if d is None:
            if u.get("fieldable", True) and u.get("detachment_legal", True):
                warnings.append(f"{u['name']}: no datasheet extracted")
            continue
        for size, pts in u.get("sizes", {}).items():
            dp = d.get("points", {}).get(size)
            if dp is not None and int(dp) != int(pts):
                errors.append(f"{u['name']} at {size} models: units.json says {pts}, datasheets.json says {dp}")
        if d.get("leader") is not None and u.get("leads"):
            want = {x.lower() for x in d["leader"]}
            have = {units[x]["name"].lower() for x in u["leads"] if x in units}
            if have - want:
                errors.append(f"{u['name']}: leads {sorted(have - want)} but the datasheet allows {sorted(want) or 'none'}")
    denh = {e["name"]: e.get("points") for e in ds.get("detachment", {}).get("enhancements", [])}
    for e in enh.values():
        if e["name"] in denh and denh[e["name"]] is not None and int(denh[e["name"]]) != int(e["points"]):
            errors.append(f"enhancement {e['name']}: units.json says {e['points']}, datasheets.json says {denh[e['name']]}")
    return errors, warnings


def build():
    udata, ldata, units, enh = load()
    limits = udata["meta"]["limits"]
    all_errors, all_warnings = cross_check(udata, units, enh)
    rendered = []
    summary = []
    matrix = {}  # unit id -> {list id: models}
    list_ids = [l["id"] for l in ldata["lists"]]

    for lst in ldata["lists"]:
        errors = []
        entries = resolve(lst["units"], units, enh, errors)
        assign_tags(entries)
        v = validate(lst, entries, units, limits)
        errors += v["errors"]
        buy, assemble = compute_gap(entries, units)
        for e in entries:
            matrix.setdefault(e["unit"]["id"], {})
            matrix[e["unit"]["id"]][lst["id"]] = matrix[e["unit"]["id"]].get(lst["id"], 0) + e["size"]

        swaps_out = []
        for swap in lst.get("swaps", []):
            s_err = []
            new = apply_swap(lst, swap)
            s_entries = resolve(new["units"], units, enh, s_err)
            assign_tags(s_entries)
            sv = validate(new, s_entries, units, limits)
            s_err += sv["errors"]
            s_buy, s_assemble = compute_gap(s_entries, units)
            if s_err:
                all_errors += [f"list {lst['id']} swap '{swap['note'][:40]}…': {x}" for x in s_err]
            gap_txt = ", ".join(b["short"] for b in s_buy) if s_buy else "none"
            swaps_out.append(f"{swap['note']} **Result: {fmt(sv['total'])} pts; gap: {gap_txt}.**")

        if errors:
            all_errors += [f"list {lst['id']}: {x}" for x in errors]
        all_warnings += [f"list {lst['id']}: {x}" for x in v["warnings"]]
        rendered.append(render_list(lst, entries, v, buy, assemble, swaps_out, limits))
        summary.append((lst, v, buy, assemble))

    if all_errors:
        return all_errors, all_warnings, None

    meta = ldata["meta"]
    o = []
    o.append(f"# {meta['title']}")
    o.append("")
    o.append(f"### {meta['subtitle']}")
    o.append("")
    o.append(f"*Generated by `build_lists.py` from `data/units.json` and `data/lists.json`; data snapshot "
             f"{meta['snapshot_date']}. Do not hand-edit this file: edit the data and rerun "
             f"`python3 build_lists.py`. Points are {udata['meta']['points_snapshot']}; the inventory is "
             f"{udata['meta']['inventory_as_of']}. The official app is the arbiter for every number here. "
             f"{meta['sources']}*")
    o.append("")
    o.append("## How to read a list")
    o.append("")
    o += [
        "- Each roster is printed the way the official app exports one: CHARACTERS, BATTLELINE, OTHER DATASHEETS, then ALLIED UNITS, with the unit's wargear on the lines below its name. `Leads:` and `led by` show attachments. An enhancement is priced on its bearer.",
        "- Tags: `[own]` painted and table-ready · `[assemble]` owned, not yet built · `[inbound]` a lot in transit · `[buy]` not owned · `[own, N short]` owned, but fewer models than the unit needs.",
        "- A roster line shows the chosen build. Every option recorded for the datasheet is in the reference at the end of this file; where the painted models' weapons were never logged, the reference says so.",
        "- \"Checked\" under each list is the validator's summary. The rules it applies are listed near the end; every list and every swap passed all of them.",
        "- \"Options within the list\" are swaps that keep the list legal. Each shows its new total and what it leaves to buy.",
        "- Points flagged verify were derived from combined lines in the July ledger rather than read from the app. The reference gives the arithmetic.",
    ]
    o.append("")
    o.append("## The seven lists at a glance")
    o.append("")
    o.append("| List | Shape | Pts | HA share | Status |")
    o.append("|---|---|---|---|---|")
    for lst, v, buy, assemble in summary:
        o.append(f"| {lst['id']} · {lst['name']} | {lst['shape']} | {fmt(v['total'])} | {v['ha']} | {status_line(buy, assemble)} |")
    o.append("")
    o.append("HA share is the Heretic Astartes half, capped at 1,000. Status is computed from the inventory snapshot at the end of this file.")
    o.append("")
    o.append("## Which units each list uses")
    o.append("")
    o.append("Model counts per list. The last column is what the collection holds.")
    o.append("")
    o.append("| Unit | " + " | ".join(list_ids) + " | Owned |")
    o.append("|---|" + "---|" * len(list_ids) + "---|")
    for u in udata["units"]:
        if u["id"] not in matrix:
            continue
        row = matrix[u["id"]]
        ow = u.get("owned", {})
        own = str(ow.get("count", 0))
        st = ow.get("status", "none")
        if st == "inbound":
            own += " (lot inbound)"
        elif st == "uncatalogued":
            own += " (lot delivered, uncatalogued)"
        elif st == "assemble":
            own += " (assemble)"
        elif ow.get("count_range"):
            own += f" ({ow['count_range'][0]}–{ow['count_range'][1]})"
        if ow.get("pending"):
            own += " + lot pending catalogue"
        o.append(f"| {u['name']} | " + " | ".join(str(row[i]) if i in row else "" for i in list_ids) + f" | {own} |")
    o.append("")
    o.append("## The lists")
    o.append("")
    o.append("\n".join(rendered))
    o.append(render_reference(udata, units))
    o.append(render_enhancements(udata))
    o.append(render_rules(limits))
    o.append(render_inventory(udata))
    o.append("---")
    o.append("")
    o.append("*The Umbral Creed is original fan fiction for a personal collection. Game statistics here are facts about "
             "datasheets as this repo recorded them, with a verify-in-app caveat and a points-snapshot date; nothing is "
             "copied from Games Workshop publications.*")
    o.append("")
    return all_errors, all_warnings, "\n".join(o)


def main(argv):
    check_only = "--check" in argv
    errors, warnings, text = build()
    for w in warnings:
        print(f"warning: {w}")
    if errors:
        for e in errors:
            print(f"error: {e}")
        print(f"{len(errors)} error(s); army-lists.md not written")
        return 1
    if check_only:
        print("all lists valid")
        return 0
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {os.path.relpath(OUT, HERE)} ({len(text.splitlines())} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
