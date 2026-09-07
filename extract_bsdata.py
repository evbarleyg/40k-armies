#!/usr/bin/env python3
"""
Extract the collection's datasheets from a local clone of BSData/wh40k-11e.

    git clone --depth 1 https://github.com/BSData/wh40k-11e /path/to/wh40k-11e
    python3 extract_bsdata.py /path/to/wh40k-11e [--text-dump notes.txt]

Writes data/datasheets.json: characteristics, weapon profiles, ability names,
keywords, composition, points by size, leader pairings and the Shadow Legion
detachment's rule, enhancement and stratagem names with costs. The rules text
itself is not written into the repo (the repo's posture is game statistics as
facts, original prose otherwise); --text-dump writes it to a scratch file so a
session can paraphrase it into the "gist" fields, which this script preserves
across re-runs, as it preserves every hand-written "strategy" block.
"""
import json
import os
import re
import subprocess
import sys
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "data", "datasheets.json")
FILES = ["Chaos - Chaos Daemons.json", "Chaos - Chaos Daemons Library.json",
         "Chaos - Chaos Space Marines.json", "Chaos - Chaos Knights.json",
         "Chaos - Chaos Knights Library.json"]
# BSData name -> this repo's unit id (data/units.json)
WANT = OrderedDict([
    ("Be'lakor", "belakor"), ("Lord of Change", "lord_of_change"), ("Bloodthirster", "bloodthirster"),
    ("Great Unclean One", "great_unclean_one"), ("Fateskimmer", "fateskimmer"), ("Exalted Flamer", "exalted_flamer"),
    ("Bloodmaster", "bloodmaster"), ("Skullmaster", "skullmaster"), ("Rendmaster on Blood Throne", "rendmaster"),
    ("Chaos Lord", "chaos_lord"), ("Master of Possession", "master_of_possessions"),
    ("Pink Horrors", "pink_horrors"), ("Bloodletters", "bloodletters"), ("Legionaries", "legionaries"),
    ("Cultist Mob", "cultist_mob"), ("Blue Horrors", "blue_horrors"), ("Flamers", "flamers"),
    ("Screamers", "screamers"), ("Nurglings", "nurglings"), ("Flesh Hounds", "flesh_hounds"),
    ("Bloodcrushers", "bloodcrushers"), ("Beasts of Nurgle", "beast_of_nurgle"), ("Plague Drones", "plague_drones"),
    ("Possessed", "possessed"), ("Havocs", "havocs"), ("Chosen", "chosen"), ("Warp Talons", "warp_talons"),
    ("War Dog Karnivore", "war_dog_karnivore"), ("Daemon Prince of Chaos with wings", "daemon_prince"),
])
JUNK = re.compile(r"Crusade|Enhancement|Weapon Modification|Battle Trait|Relic|Nachmund|Battle Honour|^Show |Mark of Chaos|Unholy Patronage|Warlord", re.I)
# Codex upgrades that ride along on some Heretic Astartes entries but are not datasheet abilities
NOT_DATASHEET = {"Warp Stalker", "Unholy Speed", "Mutant Form", "Massive Fangs", "Eightfold Eyes", "Daemonic Flesh",
                 "Scorpion Tail", "Iron-hard Talons", "Dark Blessing"}
# Sizes the catalogue expresses as open ranges rather than fixed model counts: (base size, larger size or None)
SIZE_OVERRIDE = {"legionaries": (5, 10), "havocs": (5, None), "possessed": (5, 10), "chosen": (5, 10)}
COMPOSITION_OVERRIDE = {
    "legionaries": "1 Aspiring Champion and 4 or 9 Legionaries",
    "havocs": "1 Havoc Champion and 4 Havocs",
    "possessed": "5 or 10 Possessed",
    "chosen": "1 Chosen Champion and 4 or 9 Chosen",
    "cultist_mob": "1 Cultist Champion and 9 or 19 Cultists",
}
CORE_RULES = {"Deep Strike", "Stealth", "Deadly Demise", "Infiltrators", "Scouts", "Lone Operative", "Feel No Pain",
              "Leader", "Fights First", "Firing Deck", "Hover"}
WEAPON_RULES = {"Devastating Wounds", "Sustained Hits", "Psychic", "Hazardous", "Ignores Cover", "Lethal Hits",
                "Torrent", "Precision", "Pistol", "Assault", "Heavy", "Twin-linked", "Lance", "Blast", "Extra Attacks",
                "Rapid Fire", "Melta", "Anti", "One Shot", "Indirect Fire", "Conversion"}
ARMY_RULES = {"The Shadow of Chaos", "Warp Rifts", "Dark Pacts", "Code Chivalric", "Harbingers of Dread", "Dreadblades"}


def load_catalogues(root):
    cats, index = {}, {}

    def walk(o):
        if isinstance(o, dict):
            if "id" in o:
                index[o["id"]] = o
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    for f in FILES:
        with open(os.path.join(root, f), encoding="utf-8") as fh:
            c = json.load(fh)["catalogue"]
        cats[f] = c
        walk(c)
    for f in os.listdir(root):
        if f.lower().endswith(".gst"):
            with open(os.path.join(root, f), encoding="utf-8") as fh:
                g = json.load(fh)
            walk(g)
    return cats, index


def chars(p):
    return OrderedDict((c.get("name"), c.get("$text", c.get("value", ""))) for c in p.get("characteristics", []))


class Extractor:
    def __init__(self, root):
        self.root = root
        self.cats, self.index = load_catalogues(root)
        self.pts_id = None
        for o in self.index.values():
            if o.get("name") == "pts" and o.get("type") is None and "costTypes" in str(o)[:0]:
                pass
        # the pts cost type id: any cost named "pts" carries typeId
        for o in self.index.values():
            for c in o.get("costs", []) if isinstance(o, dict) else []:
                if c.get("name") == "pts" and c.get("typeId"):
                    self.pts_id = c["typeId"]
                    break
            if self.pts_id:
                break
        self.text = []

    def find_top(self, name, types=("unit", "model", "upgrade")):
        for f, c in self.cats.items():
            for k in ("sharedSelectionEntries", "selectionEntries"):
                for e in c.get(k, []):
                    if e.get("name") == name and e.get("type") in types:
                        return f, e
        return None, None

    def name_of(self, i):
        return self.index.get(i, {}).get("name", i)

    # ------------------------------------------------------------------ walk
    def walk(self, e, acc, depth=0, seen=None, junk=True, link_cons=None):
        seen = seen if seen is not None else set()
        if id(e) in seen or depth > 6:
            return
        seen.add(id(e))
        nm = e.get("name") or ""
        if depth > 0 and junk and JUNK.search(nm):
            return
        node = {"name": nm, "type": e.get("type"), "depth": depth,
                "costs": {c.get("name"): c.get("value") for c in e.get("costs", []) if c.get("value")},
                "constraints": [(c.get("type"), c.get("value"), c.get("scope")) for c in e.get("constraints", [])]
                               + (link_cons or []),
                "modifiers": e.get("modifiers", [])}
        acc["nodes"].append(node)
        for p in e.get("profiles", []):
            acc["profiles"].append((nm, depth, p.get("typeName"), p.get("name"), chars(p)))
        for l in e.get("infoLinks", []):
            t = self.index.get(l.get("targetId"))
            if t is None:
                # core rules live in the game-system file, which the catalogue clone may not carry; keep the name
                acc["rules"].append((nm, depth, l.get("name"), ""))
                continue
            if "characteristics" in t:
                acc["profiles"].append((nm, depth, t.get("typeName"), t.get("name"), chars(t)))
            else:
                acc["rules"].append((nm, depth, t.get("name"), t.get("description", "")))
        for r in e.get("rules", []):
            acc["rules"].append((nm, depth, r.get("name"), r.get("description", "")))
        if depth == 0:
            acc["categories"] = [c.get("name") for c in e.get("categoryLinks", [])]
        for k in ("selectionEntries", "selectionEntryGroups"):
            for s in e.get(k, []):
                self.walk(s, acc, depth + 1, seen, junk)
        for l in e.get("entryLinks", []):
            t = self.index.get(l.get("targetId"))
            if t is not None:
                lc = [(c.get("type"), c.get("value"), c.get("scope")) for c in l.get("constraints", [])]
                self.walk(t, acc, depth + 1, seen, junk, lc)

    # ------------------------------------------------------------- datasheet
    def datasheet(self, name, uid):
        f, e = self.find_top(name, ("unit", "model"))
        if e is None:
            return None
        acc = {"nodes": [], "profiles": [], "rules": [], "categories": []}
        self.walk(e, acc)
        cat = f.split(" - ", 1)[-1].replace(" Library", "").replace(".json", "")
        # unit profiles
        profiles = []
        for owner, depth, tn, pn, ch in acc["profiles"]:
            if tn == "Unit" and pn not in [p["name"] for p in profiles]:
                profiles.append(OrderedDict([("name", pn)] + [(k, v) for k, v in ch.items()]))
        # weapons
        ranged, melee = [], []
        seen_w = set()
        for owner, depth, tn, pn, ch in acc["profiles"]:
            if tn not in ("Ranged Weapons", "Melee Weapons"):
                continue
            key = (tn, pn)
            if key in seen_w:
                continue
            seen_w.add(key)
            w = OrderedDict([("name", pn.replace("➤ ", "").strip())])
            for k, v in ch.items():
                w[k] = v
            (ranged if tn == "Ranged Weapons" else melee).append(w)
        # abilities (names + text for the dump), wargear abilities included
        abilities = []
        seen_a = set()
        leader = []
        for owner, depth, tn, pn, ch in acc["profiles"]:
            if tn in ("Unit", "Ranged Weapons", "Melee Weapons"):
                continue
            if pn in seen_a or pn in NOT_DATASHEET:
                continue
            seen_a.add(pn)
            text = " ".join(str(v) for v in ch.values())
            if pn == "Leader":
                leader = [ln.strip("■ ").strip().title() for ln in text.splitlines() if ln.strip().startswith("■")]
                continue
            abilities.append({"name": pn, "type": tn, "owner": owner, "text": text})
        core, army = [], []
        for owner, depth, rn, desc in acc["rules"]:
            base = rn.split(" ")[0] if rn else rn
            if rn in ARMY_RULES:
                army.append(rn)
                self.text.append(("ARMY RULE", rn, desc))
            elif any(rn.startswith(c) for c in CORE_RULES):
                if rn not in core:
                    core.append(rn)
            elif any(rn.startswith(c) for c in WEAPON_RULES):
                pass
            else:
                abilities.append({"name": rn, "type": "rule", "owner": owner, "text": desc})
        # composition and points by size
        models = [n for n in acc["nodes"] if n["type"] == "model" and n["depth"] >= 1]
        comp_min, comp_max = [], []
        for n in models:
            mins = [c[1] for c in n["constraints"] if c[0] == "min" and c[2] == "parent"]
            maxs = [c[1] for c in n["constraints"] if c[0] == "max" and c[2] == "parent"]
            lo = int(mins[0]) if mins else 0
            hi = int(maxs[0]) if maxs else lo
            if hi or lo:
                comp_min.append((n["name"], lo))
                comp_max.append((n["name"], hi))
        top = acc["nodes"][0]
        base_pts = top["costs"].get("pts")
        base_size = sum(v for _, v in comp_min) or 1
        sizes = OrderedDict()
        if base_pts is not None:
            sizes[str(base_size)] = base_pts
        for m in top["modifiers"]:
            if m.get("field") == self.pts_id and m.get("type") == "set":
                conds = m.get("conditions", []) + [c for g in m.get("conditionGroups", []) for c in g.get("conditions", [])]
                th = [int(float(c.get("value"))) for c in conds if c.get("type") == "atLeast"]
                if th:
                    # the modifier fires at threshold th; the priced size is the datasheet's larger size
                    size = sum(v for _, v in comp_max) if comp_max else th[0]
                    sizes[str(size)] = int(float(m.get("value")))
        if uid in SIZE_OVERRIDE:
            base, larger = SIZE_OVERRIDE[uid]
            fixed = OrderedDict()
            fixed[str(base)] = base_pts
            bigger = [v for k, v in sizes.items() if k != str(base_size)]
            if larger and bigger:
                fixed[str(larger)] = bigger[0]
            sizes = fixed
        composition = COMPOSITION_OVERRIDE.get(uid) or ", ".join(
            f"{lo} {nm}" if lo == hi else f"{lo}-{hi} {nm}" for (nm, lo), (_, hi) in zip(comp_min, comp_max)) or "1 model"
        # wargear option groups: entries with min 0 / max 1 style choices are noisy; record upgrade names with owner for reference
        options = []
        for n in acc["nodes"]:
            if n["type"] in ("upgrade",) and n["depth"] >= 1 and n["name"] not in [w["name"] for w in ranged + melee]:
                options.append(n["name"])
        for a in abilities:
            self.text.append((name, a["name"], a["text"]))
        return OrderedDict([
            ("id", uid), ("name", name), ("catalogue", cat), ("points", sizes), ("composition", composition),
            ("keywords", [c for c in acc["categories"] if not c.startswith("Faction:")]),
            ("faction", next((c.replace("Faction: ", "") for c in acc["categories"] if c.startswith("Faction:")), cat)),
            ("profiles", profiles), ("ranged", ranged), ("melee", melee),
            ("core", core), ("army_rules", army), ("leader", leader),
            ("abilities", [OrderedDict([("name", a["name"]), ("kind", a["type"] if a["type"] != "Abilities" else "ability"), ("gist", "")]) for a in abilities]),
            ("strategy", OrderedDict([("role", ""), ("play", ""), ("pairs_with", ""), ("beware", "")])),
        ])

    # ------------------------------------------------------------ detachment
    def detachment(self, name="Shadow Legion"):
        f, det = self.find_top("Detachment", ("upgrade",))
        acc = {"nodes": [], "profiles": [], "rules": [], "categories": []}
        self.walk(det, acc, junk=False)
        # locate the named detachment node and everything under it by re-walking its entry
        target = None

        def find(e):
            nonlocal target
            if target is not None:
                return
            if e.get("name") == name and e.get("type") == "upgrade":
                target = e
                return
            for k in ("selectionEntries", "selectionEntryGroups"):
                for s in e.get(k, []):
                    find(s)
            for l in e.get("entryLinks", []):
                t = self.index.get(l.get("targetId"))
                if t is not None:
                    find(t)
        find(det)
        if target is None:
            return None
        acc = {"nodes": [], "profiles": [], "rules": [], "categories": []}
        self.walk(target, acc, junk=False)
        dp = acc["nodes"][0]["costs"].get("Detachment Points")
        rules, enh, strats = [], [], []
        for owner, depth, tn, pn, ch in acc["profiles"]:
            text = " | ".join(f"{k}: {v}" for k, v in ch.items())
            if tn == "Stratagems" or "Stratagem" in (tn or ""):
                strats.append(OrderedDict([("name", pn), ("cp", ch.get("CP") or ch.get("Cost") or ""), ("phase", ch.get("Phase") or ch.get("When") or ""), ("gist", "")]))
                self.text.append(("STRATAGEM", pn, text))
            elif tn == "Abilities" and owner != name:
                enh.append(OrderedDict([("name", pn), ("points", None), ("gist", "")]))
                self.text.append(("ENHANCEMENT", pn, text))
            else:
                rules.append(OrderedDict([("name", pn), ("gist", "")]))
                self.text.append(("DETACHMENT RULE", pn, text))
        for owner, depth, rn, desc in acc["rules"]:
            rules.append(OrderedDict([("name", rn), ("gist", "")]))
            self.text.append(("DETACHMENT RULE", rn, desc))
        # enhancement points from the nodes
        costs = {n["name"]: n["costs"].get("pts") for n in acc["nodes"] if n["costs"].get("pts")}
        for e in enh:
            for nm, p in costs.items():
                if nm == e["name"] or e["name"].startswith(nm):
                    e["points"] = p
        # enhancements live in a shared group, hidden unless the detachment is selected; find the four by name
        for nm in ("Leaping Shadows", "Mantle of Gloom (Aura)", "Fade to Darkness", "Malice Made Manifest"):
            for o in self.index.values():
                if o.get("name") == nm and o.get("type") == "upgrade":
                    pts = next((c.get("value") for c in o.get("costs", []) if c.get("name") == "pts"), None)
                    enh.append(OrderedDict([("name", nm), ("points", pts), ("gist", "")]))
                    for pr in o.get("profiles", []):
                        self.text.append(("ENHANCEMENT", nm, " ".join(str(v) for v in chars(pr).values())))
                    break
        return OrderedDict([("name", name), ("detachment_points", dp), ("rules", rules), ("enhancements", enh), ("stratagems", strats)])


def merge_hand_written(new, old):
    """Keep gists and strategy from an earlier datasheets.json."""
    if not old:
        return new
    old_ds = {d["id"]: d for d in old.get("datasheets", [])}
    for d in new["datasheets"]:
        o = old_ds.get(d["id"])
        if not o:
            continue
        og = {a["name"]: a.get("gist", "") for a in o.get("abilities", [])}
        for a in d["abilities"]:
            if og.get(a["name"]):
                a["gist"] = og[a["name"]]
        if any(o.get("strategy", {}).values()):
            d["strategy"] = o["strategy"]
        for k in ("wargear_options", "role", "owned_note"):
            if o.get(k):
                d[k] = o[k]
    for sect in ("rules", "enhancements", "stratagems"):
        og = {x["name"]: x.get("gist", "") for x in old.get("detachment", {}).get(sect, [])}
        for x in new["detachment"].get(sect, []):
            if og.get(x["name"]):
                x["gist"] = og[x["name"]]
    # stratagems and boons are hand-recorded (BattleScribe data has none); keep them when the fresh extraction is empty
    od = old.get("detachment", {})
    if not new["detachment"].get("stratagems") and od.get("stratagems"):
        new["detachment"]["stratagems"] = od["stratagems"]
    for k in ("stratagems_note", "boons"):
        if od.get(k) and not new["detachment"].get(k):
            new["detachment"][k] = od[k]
    og = {x["name"]: x.get("gist", "") for x in old.get("army_rules", [])}
    for x in new.get("army_rules", []):
        if og.get(x["name"]):
            x["gist"] = og[x["name"]]
    return new


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    root = argv[0]
    dump = None
    if "--text-dump" in argv:
        dump = argv[argv.index("--text-dump") + 1]
    ex = Extractor(root)
    try:
        commit = subprocess.check_output(["git", "-C", root, "log", "-1", "--format=%h %cs"], text=True).strip()
    except Exception:
        commit = "unknown"
    sheets = []
    for name, uid in WANT.items():
        d = ex.datasheet(name, uid)
        if d is None:
            print(f"missing: {name}")
            continue
        sheets.append(d)
    det = ex.detachment("Shadow Legion")
    army_names = []
    for d in sheets:
        for r in d["army_rules"]:
            if r not in army_names:
                army_names.append(r)
    out = OrderedDict([
        ("meta", OrderedDict([
            ("source", "BSData/wh40k-11e (community BattleScribe data), " + commit),
            ("notes", ["Characteristics, weapon profiles, points and keywords are extracted as facts. Ability, rule, enhancement and stratagem entries carry names and hand-written gists only; the official app is the arbiter for the full text.",
                       "Points by size come from the catalogue's cost modifiers; sizes not priced by a modifier are not listed."]),
        ])),
        ("army_rules", [OrderedDict([("name", n), ("gist", "")]) for n in army_names]),
        ("detachment", det),
        ("datasheets", sheets),
    ])
    old = None
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as fh:
            old = json.load(fh)
    out = merge_hand_written(out, old)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
    if dump:
        seen = set()
        with open(dump, "w", encoding="utf-8") as fh:
            for owner, nm, text in ex.text:
                key = (owner, nm)
                if key in seen:
                    continue
                seen.add(key)
                fh.write(f"### {owner} :: {nm}\n{text}\n\n")
    print(f"wrote {os.path.relpath(OUT, HERE)}: {len(sheets)} datasheets, detachment {det['name'] if det else None}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
