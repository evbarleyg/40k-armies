#!/usr/bin/env python3
"""
The Shadow Legion datasheets — build step.

Reads data/datasheets.json (extracted from BSData, with hand-written gists and
strategy), data/units.json (inventory, loadouts, options), data/lists.json
(which list uses what) and data/glossary.json (terms and definitions), and
writes:

    datasheets.md         the long-form book: primer, one stat sheet per
                          datasheet, glossary
    datasheets-deck.html  the same content as a slide deck (phone-usable, no
                          external resources, hover or tap any term for its
                          definition; publishable as-is)

    python3 build_datasheets.py                      # both editions
    python3 build_datasheets.py --artifact OUT.html  # also write the edition
                                                     # for publishing, with
                                                     # photos embedded
    python3 build_datasheets.py --import-photos SAVED.html
                                                     # pull photos added on the
                                                     # published deck back into
                                                     # images/units/

Model photos: drop a file named after the unit id into images/units/
(belakor.jpg, pink_horrors.png ...) and rebuild. The published deck also lets
its owner add or replace photos from a phone; they are stored inside the page
and come back to the repo through --import-photos.

Do not hand-edit the outputs; edit the data and rerun.
"""
import base64
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_lists  # noqa: E402  (list summary for the closing slide)

DS = os.path.join(HERE, "data", "datasheets.json")
UNITS = os.path.join(HERE, "data", "units.json")
LISTS = os.path.join(HERE, "data", "lists.json")
GLOSS = os.path.join(HERE, "data", "glossary.json")
OUT_MD = os.path.join(HERE, "datasheets.md")
OUT_HTML = os.path.join(HERE, "datasheets-deck.html")
IMG_DIR = os.path.join(HERE, "images", "units")
IMG_EXT = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def find_image(uid):
    for ext in IMG_EXT:
        path = os.path.join(IMG_DIR, uid + ext)
        if os.path.exists(path):
            return path
    return None


def photo_map(ids, inline):
    """unit id -> relative path (repo edition) or data URI (artifact edition)."""
    out = {}
    for uid in ids:
        path = find_image(uid)
        if not path:
            continue
        if inline:
            mime = IMG_EXT[os.path.splitext(path)[1].lower()]
            with open(path, "rb") as f:
                out[uid] = f"data:{mime};base64," + base64.b64encode(f.read()).decode("ascii")
        else:
            out[uid] = os.path.relpath(path, HERE).replace(os.sep, "/")
    return out


def import_photos(saved_html):
    """Write photos embedded in a saved copy of the published deck into images/units/."""
    with open(saved_html, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r'<script type="application/json" id="photos">(.*?)</script>', text, re.S)
    if not m:
        print("no photo block found")
        return 1
    photos = json.loads(m.group(1))
    os.makedirs(IMG_DIR, exist_ok=True)
    n = 0
    for uid, src in photos.items():
        mm = re.match(r"data:(image/(jpeg|png|webp));base64,(.*)", src, re.S)
        if not mm:
            continue
        ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[mm.group(1)]
        for old in IMG_EXT:
            oldp = os.path.join(IMG_DIR, uid + old)
            if os.path.exists(oldp) and old != ext:
                os.remove(oldp)
        with open(os.path.join(IMG_DIR, uid + ext), "wb") as f:
            f.write(base64.b64decode(mm.group(3)))
        n += 1
    print(f"imported {n} photo(s) into images/units/")
    return 0

GROUPS = [
    ("The Dark Master", "Undivided", "First of the Daemon Princes, author of the silence the Creed reads.", ["belakor"]),
    ("The First Choir", "Tzeentch", "The second Greater Daemon, the shooting, and the objective that will not die.",
     ["lord_of_change", "fateskimmer", "exalted_flamer", "flamers", "pink_horrors", "blue_horrors", "screamers"]),
    ("The Blood Tithe", "Khorne", "The wing bought in August: the hammer, the cavalry, the Fade loop.",
     ["bloodthirster", "bloodmaster", "bloodletters", "flesh_hounds", "bloodcrushers", "skullmaster", "rendmaster"]),
    ("The Margins", "Nurgle", "The screens, and a crate not yet opened.",
     ["great_unclean_one", "nurglings", "beast_of_nurgle", "plague_drones"]),
    ("The Bearers of the Word", "Heretic Astartes", "The mortal half: the yo-yo, the bomb, the home objective.",
     ["chaos_lord", "master_of_possessions", "possessed", "legionaries", "havocs", "cultist_mob", "chosen", "warp_talons"]),
    ("Oath-Bound Engines", "Chaos Knights allies", "Mercenaries kept outside the main text, doing the real work.",
     ["war_dog_karnivore"]),
    ("The Unseated", "not fieldable here", "Owned, painted, and turned away at the door.", ["daemon_prince"]),
]
EPITHETS = {
    "belakor": "The Source", "lord_of_change": "The Anagnost", "bloodthirster": "The Unbound Word",
    "bloodmaster": "The Tithe-Takers", "bloodletters": "The Tithe-Takers", "flesh_hounds": "The Nine-Inch Truth",
    "nurglings": "The Annotators", "chaos_lord": "Obsidius Mallex, the Creed's Castellan",
    "master_of_possessions": "Sor Vekh, First Footnotist", "possessed": "The Later Chapters",
    "legionaries": "The Preaching Company", "havocs": "The Rearguard Chorus", "cultist_mob": "The Unlisted",
    "war_dog_karnivore": "The Iron Cantors", "daemon_prince": "The Rival", "great_unclean_one": "The Margin's Margin",
}
BOONS = {"Murderer's Cowl", "Penumbral Puppetry", "Gloam Rot", "Disciples of Be'lakor"}
WARGEAR = {"Daemonic Icon", "Instrument of Chaos", "Chaos icon", "Collar of Khorne", "*Invulnerable Save"}
STAT_KEYS = [("M", "M", "Move"), ("T", "T", "Toughness"), ("Sv", "Sv", "Save"), ("W", "W", "Wounds"),
             ("LD", "Ld", "Leadership"), ("OC", "OC", "Objective Control"), ("InSv", "Inv", "invulnerable save")]
WEAPON_HEAD = {"Range": "Range", "A": "Attacks", "BS": "Ballistic Skill", "WS": "Weapon Skill", "S": "Strength",
               "AP": "Armour Penetration", "D": "Damage"}
# glossary terms that double as ordinary English: mark only when written exactly as an alias (capitalised, usually)
EXACT = {"Move", "Toughness", "Save", "Wounds", "Range", "Attacks", "Strength", "Damage", "Assault", "Heavy", "Pistol",
         "Blast", "Lance", "Melta", "Precision", "Torrent", "Stealth", "Leader", "Aura", "Infantry", "Mounted", "Beast",
         "Swarm", "Monster", "Vehicle", "Fly", "Character", "Grenades", "Warlord", "Advance", "Fall Back", "Charge",
         "Consolidate", "Reserves", "Overwatch", "Daemonic Terror", "Daemonic Manifestation", "Damaged", "Daemon",
         "Psyker", "Battleline", "Epic Hero", "Leadership", "Objective Control", "Normal move", "Fight phase",
         "Command phase", "action", "primary mission", "trade", "bomb", "cover", "points"}

E = html.escape


# ---------------------------------------------------------------- data

def load():
    with open(DS, encoding="utf-8") as f:
        ds = json.load(f)
    with open(UNITS, encoding="utf-8") as f:
        udata = json.load(f)
    with open(LISTS, encoding="utf-8") as f:
        ldata = json.load(f)
    with open(GLOSS, encoding="utf-8") as f:
        gloss = json.load(f)
    units = {u["id"]: u for u in udata["units"]}
    used = {}
    for lst in ldata["lists"]:
        for spec in lst["units"]:
            used.setdefault(spec["unit"], [])
            if lst["id"] not in used[spec["unit"]]:
                used[spec["unit"]].append(lst["id"])
    return ds, udata, units, used, gloss


class Glossary:
    """Wraps glossary terms in tooltip spans; one mark per term per slide unless told otherwise."""

    def __init__(self, gloss):
        self.terms = gloss["terms"]
        self.groups = gloss["groups"]
        self.by_alias = {}
        for t in self.terms:
            for a in [t["term"]] + t.get("aliases", []):
                self.by_alias[E(a).lower()] = t
        aliases = sorted(self.by_alias.keys(), key=len, reverse=True)
        self.pattern = re.compile(r"(?<![\w-])(" + "|".join(re.escape(a) for a in aliases) + r")(?![\w-])", re.I)
        self.exact_aliases = {}
        for t in self.terms:
            if t["term"] in EXACT:
                self.exact_aliases[t["term"]] = {E(a) for a in [t["term"]] + t.get("aliases", [])}

    def span(self, t, text):
        return f'<span class="term" tabindex="0" data-t="{E(t["term"], quote=True)}">{text}</span>'

    def dictionary_js(self):
        return json.dumps({t["term"]: t["def"] for t in self.terms}, ensure_ascii=False)

    def mark(self, text, seen, every=False):
        esc = E(text)

        def sub(m):
            raw = m.group(0)
            t = self.by_alias.get(raw.lower())
            if t is None:
                return raw
            if t["term"] in self.exact_aliases and raw not in self.exact_aliases[t["term"]]:
                return raw
            if esc[m.end():m.end() + 7].lower() == " legion":
                return raw
            if not every and t["term"] in seen:
                return raw
            seen.add(t["term"])
            return self.span(t, raw)
        return self.pattern.sub(sub, esc)

    def label(self, term_name, text):
        t = next((t for t in self.terms if t["term"] == term_name), None)
        return self.span(t, E(text)) if t else E(text)


def owned_line(u):
    ow = u.get("owned", {})
    st = ow.get("status", "none")
    count = ow.get("count", 0)
    rng = ow.get("count_range")
    n = f"{rng[0]} to {rng[1]}" if rng else str(count)
    if st == "own":
        return f"{n} owned, {ow.get('paint', 'painted')}"
    if st == "assemble":
        return f"{n} owned, unassembled"
    if st == "uncatalogued":
        return "delivered, not yet catalogued"
    return "not owned"


def status_class(u):
    return {"own": "own", "assemble": "build", "uncatalogued": "pending", "none": "buy"}[u.get("owned", {}).get("status", "none")]


def points_str(d):
    return " · ".join(f"{p} pts ({n})" for n, p in d["points"].items()) or "no price recorded"


def dash(v):
    return v if v not in (None, "", "N/A") else "–"


WOUND_TABLE = [("Strength at least twice Toughness", "2+"), ("Strength greater than Toughness", "3+"),
               ("Strength equal to Toughness", "4+"), ("Strength less than Toughness", "5+"),
               ("Strength half of Toughness or less", "6+")]
PHASES = [
    ("Command", "Gain 1 CP. Units below half strength take Battle-shock tests. From round two, score the primary here."),
    ("Movement", "Each unit makes a Normal move, Advances, Falls Back or stays put. Reinforcements arrive at the end of the phase."),
    ("Shooting", "Each unit shoots; only Pistols fire from inside engagement range. Overwatch is the opponent's reply, in your turn."),
    ("Charge", "Declare targets and roll 2D6. Reach engagement range with every target or stay put. Heroic Intervention is the reply."),
    ("Fight", "Units that charged fight first, then the players alternate. Pile in 3 inches, attack, consolidate 3."),
]
ATTACK_STEPS = [
    ("Hit", "Roll Attacks dice against BS or WS. An unmodified 6 is a critical hit: Lethal Hits and Sustained Hits key off it."),
    ("Wound", "Strength against Toughness, per the table. An unmodified 6 is a critical wound: Devastating Wounds keys off it."),
    ("Save", "The defender rolls its armour save minus the AP, or its invulnerable save, whichever is better."),
    ("Damage", "Each failed save removes the weapon's Damage from one model. Excess is lost. Mortal wounds skip steps one to three."),
]
ARMY_MODIFIERS = [
    "+1 to hit in melee for Khorne daemons within 6 inches of a Bloodthirster.",
    "Re-roll hit rolls of 1 for everything within 6 inches of Be'lakor under Shadow Lord.",
    "+1 to wound for a brick led by a Bloodmaster.",
    "Lethal Hits or Sustained Hits 1 for Be'lakor and every marine unit through Dark Pacts.",
    "-1 to be hit in melee and Stealth for every Tzeentch daemon; -1 to be wounded by big guns for every Nurgle daemon.",
    "+1 Strength, AP and Damage for every Khorne daemon into the Rendmaster's chosen target.",
]
WIN_POINTS = [
    "The primary: at the start of your Command phase from round two, score for each objective marker you control, meaning more Objective Control within 3 inches than the opponent has. OC 0 never counts.",
    "The secondaries: the extra goals drawn or chosen each game. Actions score them, and a unit doing an action does not shoot or charge. The Legionaries and Cultists are the action units.",
    "Purge the Foe: this detachment's missions also reward destroying more units than you lose in a round. A screen that dies for nothing hands the opponent that point.",
    "This army's engine: push the shadow forward by holding half of No Man's Land, keep Battleline daemons on markers where they regrow, and force Battle-shock tests on whoever contests, so they drop to OC 0 and bleed mortal wounds. Battle-shock the contester, never the champion.",
    "The rhythm: turn one, screen and spread. Turns two and three, commit the killers where they both kill and claim. Turns four and five, a live monster on a marker beats any kill.",
    "Mission packs change with the season. Read the current one before a game; these are the parts that have held.",
]


# ---------------------------------------------------------------- markdown

def md_unit(d, u, used):
    o = []
    ep = EPITHETS.get(d["id"])
    o.append(f"### {d['name']}" + (f" — {ep}" if ep else ""))
    o.append("")
    kws = [k for k in d["keywords"] if k not in (d["name"], "Chaos")]
    o.append(f"*{points_str(d)} · {d['composition']} · {d['faction']} · {', '.join(kws)}.*")
    o.append("")
    img = find_image(d["id"])
    if img:
        o.append(f"![{d['name']}]({os.path.relpath(img, HERE).replace(os.sep, '/')})")
        o.append("")
    o.append(f"**In the collection:** {owned_line(u)}." + (f" {u['owned']['note'][0].upper() + u['owned']['note'][1:].rstrip('.')}." if u.get("owned", {}).get("note") else "")
             + (f" As built: {u['owned']['built'].rstrip('.')}." if u.get("owned", {}).get("built") else "")
             + (f" In lists {', '.join(used[d['id']])}." if used.get(d["id"]) else " In no list yet."))
    o.append("")
    multi = len(d["profiles"]) > 1
    head = (["Profile"] if multi else []) + [lbl for _, lbl, _ in STAT_KEYS]
    o.append("| " + " | ".join(head) + " |")
    o.append("|" + "---|" * len(head))
    for p in d["profiles"]:
        row = ([p["name"]] if multi else []) + [dash(p.get(k)) for k, _, _ in STAT_KEYS]
        o.append("| " + " | ".join(row) + " |")
    o.append("")
    if d["ranged"]:
        o.append("| Ranged weapon | Range | A | BS | S | AP | D | Keywords |")
        o.append("|---|---|---|---|---|---|---|---|")
        for w in d["ranged"]:
            o.append(f"| {w['name']} | {w.get('Range','')} | {w.get('A','')} | {dash(w.get('BS'))} | {w.get('S','')} | {w.get('AP','')} | {w.get('D','')} | {dash(w.get('Keywords'))} |")
        o.append("")
    if d["melee"]:
        o.append("| Melee weapon | A | WS | S | AP | D | Keywords |")
        o.append("|---|---|---|---|---|---|---|")
        for w in d["melee"]:
            o.append(f"| {w['name']} | {w.get('A','')} | {w.get('WS','')} | {w.get('S','')} | {w.get('AP','')} | {w.get('D','')} | {dash(w.get('Keywords'))} |")
        o.append("")
    o.append("**Abilities.**")
    o.append("")
    for a in d["abilities"]:
        tag = " *(detachment boon)*" if a["name"] in BOONS else (" *(wargear)*" if a["name"] in WARGEAR else "")
        o.append(f"- **{a['name']}**{tag}: {a['gist']}")
    extras = []
    if d["core"]:
        extras.append("Core: " + ", ".join(d["core"]))
    if d["leader"]:
        extras.append("Leads: " + ", ".join(d["leader"]))
    if extras:
        o.append(f"- {' · '.join(extras)}")
    o.append("")
    opts = u.get("options") or []
    if opts:
        o.append("**Wargear options.** " + " ".join(x.rstrip(".") + "." for x in opts))
        o.append("")
    st = d["strategy"]
    o.append(f"**Role.** {st['role']}.")
    o.append("")
    o.append(f"**How to play it.** {st['play']}")
    o.append("")
    o.append(f"**Pairs with.** {st['pairs_with']}")
    o.append("")
    o.append(f"**Beware.** {st['beware']}")
    o.append("")
    return "\n".join(o)


def render_md(ds, udata, units, used, gl):
    meta = ds["meta"]
    det = ds["detachment"]
    o = []
    o.append("# The Shadow Legion datasheets")
    o.append("")
    o.append("### Every datasheet in the collection, with the numbers, what they mean, and what to do with them")
    o.append("")
    o.append(f"*Generated by `build_datasheets.py` from `data/datasheets.json`, `data/units.json`, `data/lists.json` and "
             f"`data/glossary.json`. Source of the statistics: {meta['source']}. Characteristics, weapon profiles, points and "
             "keywords are facts extracted from that data; every ability, rule, enhancement and stratagem is given as a name "
             "and a paraphrase, never the printed text, and the official app is the arbiter for all of it. The strategy "
             "paragraphs are this repo's own advice for this collection in the Shadow Legion detachment. The slide-deck "
             "edition is `datasheets-deck.html`, where every term in the [glossary](#glossary) shows its definition on hover.*")
    o.append("")
    o.append("## Primer: reading a sheet")
    o.append("")
    o.append("*For a returning player. Every rules word below is defined in the [glossary](#glossary) at the end.*")
    o.append("")
    o.append("**The statistics row.** Every unit has seven numbers.")
    o.append("")
    o.append("| Label | Means | In plain terms |")
    o.append("|---|---|---|")
    for _, lbl, term in STAT_KEYS:
        t = next(t for t in gl.terms if t["term"] == term)
        o.append(f"| {lbl} | {t['term']} | {t['def']} |")
    o.append("")
    o.append("**A weapon row.** Read it left to right as the attack sequence. Be'lakor's Betraying Shades: 9 attacks, each hitting on 2+; Strength 5 against a marine's Toughness 4 wounds on 3+; AP-2 turns his 3+ armour into a 5+, unless his invulnerable save is better; each failed save costs 1 wound. The keywords change the sequence: Devastating Wounds turns 6s to wound into mortal wounds that no save stops.")
    o.append("")
    o.append("| Column | Means |")
    o.append("|---|---|")
    for k, term in WEAPON_HEAD.items():
        t = next(t for t in gl.terms if t["term"] == term)
        o.append(f"| {k} | {t['def']} |")
    o.append("| Keywords | The weapon abilities; each is in the glossary. |")
    o.append("")
    o.append("**The wound roll.**")
    o.append("")
    o.append("| Strength against Toughness | Wound on |")
    o.append("|---|---|")
    for a, b in WOUND_TABLE:
        o.append(f"| {a} | {b} |")
    o.append("")
    o.append("**One attack, four rolls.**")
    o.append("")
    for i, (name, text) in enumerate(ATTACK_STEPS, 1):
        o.append(f"{i}. **{name}.** {text}")
    o.append("")
    o.append("**What this army does to the dice.**")
    o.append("")
    for m in ARMY_MODIFIERS:
        o.append(f"- {m}")
    o.append("")
    o.append("**The five phases of a turn.**")
    o.append("")
    for i, (name, text) in enumerate(PHASES, 1):
        o.append(f"{i}. **{name}.** {text}")
    o.append("")
    o.append("**Abilities and tags.** What a card does beyond its numbers. Abilities marked *detachment boon* are the Shadow Legion's per-god gifts, which the current data attaches to each unit as an ability. Abilities marked *wargear* come with an optional item. \"Core\" abilities are the shared ones every army uses (Deep Strike, Stealth, Deadly Demise) and are in the glossary.")
    o.append("")
    o.append("**How you win.**")
    o.append("")
    for w in WIN_POINTS:
        o.append(f"- {w}")
    o.append("")
    o.append("**Reading the rest of a sheet.** \"In the collection\" comes from the inventory in `data/units.json`, and \"in lists\" from `army-lists.md`. Points are the current data's; where they differ from the July 27 audit, `army-lists.md` says so. Everything here is a snapshot: before a tournament, open the app.")
    o.append("")
    o.append("## The army rules")
    o.append("")
    for a in ds["army_rules"]:
        o.append(f"- **{a['name']}.** {a['gist']}")
    o.append("")
    o.append(f"## The detachment: {det['name']} ({det['detachment_points']} DP)")
    o.append("")
    for r in det["rules"]:
        o.append(f"**{r['name']}.** {r['gist']}")
        o.append("")
    o.append("| Allegiance | Boon (as an ability on each unit) |")
    o.append("|---|---|")
    boon_gist = {a["name"]: a["gist"] for d in ds["datasheets"] for a in d["abilities"] if a["name"] in BOONS}
    for b in det.get("boons", []):
        o.append(f"| {b['allegiance']} | **{b['ability']}**: {boon_gist.get(b['ability'], '')} |")
    o.append("| Slaanesh | As recorded in July: cannot be targeted by Fire Overwatch. No Slaanesh unit is owned. |")
    o.append("")
    o.append("| Enhancement | Pts | What it does |")
    o.append("|---|---|---|")
    for e in det["enhancements"]:
        o.append(f"| {e['name']} | {e['points']} | {e['gist']} |")
    o.append("")
    o.append("| Stratagem | CP | When | What it does |")
    o.append("|---|---|---|---|")
    for s in det["stratagems"]:
        o.append(f"| {s['name']} | {s['cp'] or '?'} | {s['phase'] or '?'} | {s['gist']} |")
    o.append("")
    if det.get("stratagems_note"):
        o.append(f"*{det['stratagems_note']}*")
        o.append("")
    o.append("## The datasheets")
    o.append("")
    sheets = {d["id"]: d for d in ds["datasheets"]}
    for name, god, blurb, ids in GROUPS:
        o.append(f"## {name} ({god})")
        o.append("")
        o.append(f"*{blurb}*")
        o.append("")
        for uid in ids:
            if uid in sheets and uid in units:
                o.append(md_unit(sheets[uid], units[uid], used))
    o.append("## Glossary")
    o.append("")
    o.append(f"*{gl_meta_note}*")
    o.append("")
    for g in gl.groups:
        rows = [t for t in gl.terms if t["group"] == g]
        if not rows:
            continue
        o.append(f"### {g}")
        o.append("")
        o.append("| Term | Meaning |")
        o.append("|---|---|")
        for t in rows:
            o.append(f"| **{t['term']}** | {t['def']} |")
        o.append("")
    o.append("## Data notes")
    o.append("")
    for n in meta.get("notes", []):
        o.append(f"- {n}")
    for n in udata["meta"].get("notes", []):
        o.append(f"- {n}")
    o.append("")
    o.append("---")
    o.append("")
    o.append("*The Umbral Creed is original fan fiction for a personal collection. Game statistics here are facts about datasheets as the cited data recorded them, with a verify-in-app caveat and a snapshot date; nothing is copied from Games Workshop publications.*")
    o.append("")
    return "\n".join(o)


# ---------------------------------------------------------------- deck

CSS = r"""
  :root{
    --ground:#171114; --panel:#201519; --panel2:#281a1e; --ink:#eaddcc; --dim:#a2917f;
    --crimson:#b3242f; --crimson-soft:#c9505a; --brass:#b08a52; --line:#3d2b2e;
    --own:#7a9a76; --buy:#d4626c; --pending:#c9a25a; --shadow:rgba(0,0,0,.45);
    color-scheme:dark;
  }
  @media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]){
      --ground:#f0e8d8; --panel:#faf4e8; --panel2:#f3ead9; --ink:#261b17; --dim:#6e5f52;
      --crimson:#8e1c26; --crimson-soft:#a63b42; --brass:#8a6a38; --line:#d9cab2;
      --own:#47663f; --buy:#8e1c26; --pending:#8a6a38; --shadow:rgba(60,30,20,.18);
      color-scheme:light;
    }
  }
  :root[data-theme="light"]{
    --ground:#f0e8d8; --panel:#faf4e8; --panel2:#f3ead9; --ink:#261b17; --dim:#6e5f52;
    --crimson:#8e1c26; --crimson-soft:#a63b42; --brass:#8a6a38; --line:#d9cab2;
    --own:#47663f; --buy:#8e1c26; --pending:#8a6a38; --shadow:rgba(60,30,20,.18);
    color-scheme:light;
  }
  :root[data-theme="dark"]{
    --ground:#171114; --panel:#201519; --panel2:#281a1e; --ink:#eaddcc; --dim:#a2917f;
    --crimson:#b3242f; --crimson-soft:#c9505a; --brass:#b08a52; --line:#3d2b2e;
    --own:#7a9a76; --buy:#d4626c; --pending:#c9a25a; --shadow:rgba(0,0,0,.45);
    color-scheme:dark;
  }
  html,body{ height:100%; }
  body{ margin:0; background:var(--ground); color:var(--ink); overflow:hidden;
    font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  h1,h2,h3{ font-family:Palatino,"Palatino Linotype","Book Antiqua",Georgia,serif; text-wrap:balance; margin:0; }
  #deck{ position:fixed; inset:0; }
  .slide{ position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch;
    padding:56px clamp(16px,5vw,64px) 96px; box-sizing:border-box; display:none; }
  .slide.active{ display:block; }
  .slide.center.active{ display:flex; flex-direction:column; justify-content:center; }
  .wrap{ max-width:1120px; margin:0 auto; }
  .eyebrow{ text-transform:uppercase; letter-spacing:.22em; font-size:11px; color:var(--brass); margin:0 0 10px; }
  h1{ font-size:clamp(34px,5vw,60px); line-height:1.06; }
  h1 .red, h2 .red{ color:var(--crimson); }
  h2{ font-size:clamp(26px,3.6vw,42px); line-height:1.1; }
  h2 .epithet{ display:block; font-size:.5em; font-style:italic; font-weight:normal; color:var(--dim); margin-top:4px; }
  h3{ font-size:13px; text-transform:uppercase; letter-spacing:.16em; color:var(--brass); font-family:inherit; margin:0 0 6px; }
  p.lead{ font-size:clamp(16px,1.5vw,19px); color:var(--dim); max-width:64ch; margin:14px 0 0; }
  .numeral{ font-family:Palatino,Georgia,serif; font-size:clamp(80px,14vw,170px); color:var(--crimson); line-height:.9; opacity:.9; }
  .meta{ color:var(--dim); font-size:13px; margin:8px 0 0; }
  .kw{ font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--dim); margin:6px 0 0; }
  .badge{ display:inline-block; font-size:10.5px; text-transform:uppercase; letter-spacing:.12em; border-radius:2px;
    padding:2px 8px; font-weight:600; border:1px solid currentColor; vertical-align:middle; margin-left:8px; }
  .badge.own{ color:var(--own); } .badge.build{ color:var(--pending); } .badge.pending{ color:var(--pending); }
  .badge.buy{ color:var(--buy); }
  .pts{ font-family:ui-monospace,Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; color:var(--crimson); font-weight:600; }
  .head{ display:grid; grid-template-columns:minmax(0,1fr) 250px; gap:24px; align-items:end; }
  @media (max-width:860px){ .head{ grid-template-columns:minmax(0,1fr); gap:14px; } }
  figure.model{ margin:0; min-width:0; }
  figure.model .frame{ position:relative; aspect-ratio:4/3; background:var(--panel); border:1px solid var(--line);
    overflow:hidden; display:flex; align-items:center; justify-content:center; }
  @media (max-width:860px){ figure.model .frame{ max-height:240px; } }
  figure.model img{ width:100%; height:100%; object-fit:cover; display:block; }
  figure.model .empty{ text-align:center; color:var(--dim); font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
  figure.model .empty .mono{ display:block; font-family:Palatino,Georgia,serif; font-size:56px; line-height:1; color:var(--line);
    text-transform:none; letter-spacing:0; margin-bottom:6px; }
  figure.model figcaption{ display:flex; gap:8px; align-items:center; justify-content:space-between; margin-top:6px; min-height:22px; }
  figure.model .cap{ font-size:11.5px; color:var(--dim); }
  .navbtn.small{ font-size:12px; padding:4px 10px; }
  body:not(.can-edit) .editonly{ display:none; }
  #save{ display:none; background:var(--crimson); color:#fff; border-color:var(--crimson); }
  body.dirty #save{ display:inline-block; }
  #msg{ position:fixed; left:50%; bottom:70px; transform:translateX(-50%); background:var(--panel2); color:var(--ink);
    border:1px solid var(--brass); padding:8px 14px; font-size:13px; z-index:6; max-width:90vw; }
  #msg[hidden]{ display:none; }
  .cols{ display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:28px; margin-top:22px; align-items:start; }
  .cols.even{ grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
  @media (max-width:860px){ .cols, .cols.even{ grid-template-columns:minmax(0,1fr); gap:20px; } }
  .sheet, aside.strategy, .cols > div{ min-width:0; }
  table{ border-collapse:collapse; width:100%; font-size:13px; }
  th{ text-align:left; text-transform:uppercase; letter-spacing:.1em; font-size:10px; color:var(--brass);
    padding:6px 8px; border-bottom:1px solid var(--line); font-weight:600; white-space:nowrap; }
  td{ padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  tr:last-child td{ border-bottom:0; }
  .num, td.n{ font-family:ui-monospace,Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .stats{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin:0 0 14px; }
  .stat{ background:var(--panel); border:1px solid var(--line); padding:8px 4px; text-align:center; min-width:0; }
  .stat b{ display:block; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--brass); }
  .stat span.v{ display:block; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:clamp(15px,1.6vw,20px); font-variant-numeric:tabular-nums; margin-top:2px; }
  .stat-name{ font-size:12px; color:var(--dim); margin:0 0 4px; }
  .tbl{ background:var(--panel); border:1px solid var(--line); overflow-x:auto; margin:0 0 12px; }
  .tbl.wide table{ min-width:520px; }
  ul.abilities{ list-style:none; padding:0; margin:0 0 10px; }
  ul.abilities li{ padding:7px 0; border-top:1px solid var(--line); font-size:13.5px; }
  ul.abilities li:first-child{ border-top:0; }
  ul.abilities b{ color:var(--ink); }
  .tag{ display:inline-block; font-size:9.5px; text-transform:uppercase; letter-spacing:.12em; color:var(--brass);
    border:1px solid var(--brass); border-radius:2px; padding:0 5px; margin-left:6px; vertical-align:1px; }
  .core{ font-size:12.5px; color:var(--dim); margin:0; }
  aside.strategy{ background:var(--panel); border:1px solid var(--line); border-top:3px solid var(--crimson); padding:16px 18px 18px; font-size:14px; }
  aside.strategy p{ margin:0 0 14px; }
  aside.strategy p:last-child{ margin-bottom:0; }
  aside.strategy .role{ font-family:Palatino,Georgia,serif; font-size:17px; color:var(--ink); }
  .note{ color:var(--dim); font-size:12.5px; margin:14px 0 0; }
  dl.rules{ margin:0; }
  dl.rules dt{ font-family:Palatino,Georgia,serif; font-size:19px; margin:18px 0 4px; }
  dl.rules dd{ margin:0; max-width:78ch; }
  dl.compact dt{ font-size:15px; font-family:inherit; font-weight:600; margin:10px 0 2px; }
  dl.compact dd{ font-size:13.5px; color:var(--ink); }
  ol.steps{ padding-left:1.2em; margin:6px 0 0; }
  ol.steps li{ margin:0 0 10px; }
  ol.steps b{ font-family:Palatino,Georgia,serif; font-size:16px; }
  ul.bullets{ margin:6px 0 0; padding-left:1.1em; max-width:70ch; }
  ul.bullets li{ margin:0 0 10px; }
  .gloss{ columns:2; column-gap:40px; margin-top:16px; }
  @media (max-width:860px){ .gloss{ columns:1; } }
  .gloss h3{ column-span:all; margin:18px 0 6px; }
  .gloss .entry{ break-inside:avoid; padding:6px 0; border-top:1px solid var(--line); font-size:13.5px; }
  .gloss .entry b{ font-family:Palatino,Georgia,serif; font-size:15px; }
  .kbd{ font-family:ui-monospace,Menlo,monospace; border:1px solid var(--line); border-bottom-width:2px; border-radius:4px;
    padding:1px 7px; font-size:12px; background:var(--panel); }
  /* glossary tooltips */
  .term{ border-bottom:1px dotted var(--brass); cursor:help; }
  .term:focus-visible{ outline:2px solid var(--brass); outline-offset:1px; }
  #tip{ position:fixed; z-index:6; max-width:340px; background:var(--panel2); color:var(--ink); border:1px solid var(--brass);
    box-shadow:0 8px 24px var(--shadow); padding:10px 12px 12px; font-size:13px; line-height:1.45; }
  #tip[hidden]{ display:none; }
  #tip b{ display:block; font-family:Palatino,Georgia,serif; font-size:15px; color:var(--brass); margin-bottom:3px; }
  @media (max-width:700px){ #tip{ left:12px !important; right:12px; bottom:76px; top:auto !important; max-width:none; } }
  /* chrome */
  #bar{ position:fixed; top:0; left:0; height:3px; background:var(--crimson); transition:width .3s; z-index:3; }
  #sect{ position:fixed; top:14px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:center;
    text-transform:uppercase; letter-spacing:.2em; font-size:10.5px; color:var(--dim); z-index:3; pointer-events:none; }
  #sect button{ pointer-events:auto; }
  #hud{ position:fixed; left:0; right:0; bottom:0; display:flex; align-items:center; gap:14px; padding:12px 20px;
    box-sizing:border-box; background:linear-gradient(transparent, var(--ground) 45%); z-index:3; }
  #counter{ flex:1; text-align:center; font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--dim); }
  .navbtn{ background:var(--panel); color:var(--ink); border:1px solid var(--line); border-radius:4px; font:inherit;
    font-size:14px; padding:8px 16px; cursor:pointer; letter-spacing:0; text-transform:none; }
  .navbtn:hover{ border-color:var(--brass); }
  .navbtn:focus-visible, .toc a:focus-visible{ outline:2px solid var(--brass); outline-offset:2px; }
  #toc{ position:fixed; inset:0; background:var(--ground); overflow-y:auto; padding:56px clamp(16px,5vw,64px) 96px; z-index:4; box-sizing:border-box; }
  #toc[hidden]{ display:none; }
  .toc{ max-width:900px; margin:0 auto; columns:2; column-gap:40px; }
  @media (max-width:700px){ .toc{ columns:1; } }
  .toc h3{ break-after:avoid; margin-top:18px; }
  .toc a{ display:block; color:var(--ink); text-decoration:none; padding:5px 0; border-bottom:1px solid var(--line); font-size:14px; }
  .toc a:hover{ color:var(--crimson-soft); }
  .toc a small{ color:var(--dim); font-family:ui-monospace,Menlo,monospace; margin-right:8px; }
  @media (prefers-reduced-motion: reduce){ #bar{ transition:none; } }
"""


def stat_block(d, gl):
    out = []
    for p in d["profiles"]:
        if len(d["profiles"]) > 1:
            out.append(f'<p class="stat-name">{E(p["name"])}</p>')
        cells = "".join(f'<div class="stat"><b>{gl.label(term, lbl)}</b><span class="v">{E(dash(p.get(k)))}</span></div>'
                        for k, lbl, term in STAT_KEYS)
        out.append(f'<div class="stats">{cells}</div>')
    return "".join(out)


def weapons_table(rows, ranged, gl, seen):
    if not rows:
        return ""
    def th(k):
        return f"<th>{gl.label(WEAPON_HEAD[k], k)}</th>"
    if ranged:
        head = "<tr><th>Ranged</th>" + "".join(th(k) for k in ("Range", "A", "BS", "S", "AP", "D")) + "<th>Keywords</th></tr>"
        body = "".join(f"<tr><td>{E(w['name'])}</td><td class='n'>{E(w.get('Range',''))}</td><td class='n'>{E(str(w.get('A','')))}</td><td class='n'>{E(dash(w.get('BS')))}</td><td class='n'>{E(str(w.get('S','')))}</td><td class='n'>{E(str(w.get('AP','')))}</td><td class='n'>{E(str(w.get('D','')))}</td><td>{gl.mark(dash(w.get('Keywords')), seen, every=True)}</td></tr>" for w in rows)
    else:
        head = "<tr><th>Melee</th>" + "".join(th(k) for k in ("A", "WS", "S", "AP", "D")) + "<th>Keywords</th></tr>"
        body = "".join(f"<tr><td>{E(w['name'])}</td><td class='n'>{E(str(w.get('A','')))}</td><td class='n'>{E(str(w.get('WS','')))}</td><td class='n'>{E(str(w.get('S','')))}</td><td class='n'>{E(str(w.get('AP','')))}</td><td class='n'>{E(str(w.get('D','')))}</td><td>{gl.mark(dash(w.get('Keywords')), seen, every=True)}</td></tr>" for w in rows)
    return f'<div class="tbl wide"><table>{head}{body}</table></div>'


def deck_unit(d, u, used, section, gl):
    seen = set()
    ep = EPITHETS.get(d["id"])
    kws = [k for k in d["keywords"] if k not in (d["name"], "Chaos")]
    st = d["strategy"]
    abilities = "".join(
        f"<li><b>{E(a['name'])}</b>"
        + ('<span class="tag">boon</span>' if a["name"] in BOONS else ('<span class="tag">wargear</span>' if a["name"] in WARGEAR else ""))
        + f" {gl.mark(a['gist'], seen)}</li>" for a in d["abilities"])
    extras = []
    if d["core"]:
        extras.append("Core: " + ", ".join(d["core"]))
    if d["leader"]:
        extras.append("Leads: " + ", ".join(d["leader"]))
    opts = u.get("options") or []
    owned = owned_line(u)
    built = u.get("owned", {}).get("built")
    in_lists = ", ".join(used.get(d["id"], [])) or "none yet"
    initial = E(d["name"][0])
    return f"""
<div class="wrap">
  <div class="head">
    <div class="head-text">
      <p class="eyebrow">{E(section)} · <span class="pts">{E(points_str(d))}</span> · {E(d['composition'])}</p>
      <h2>{E(d['name'])}<span class="badge {status_class(u)}">{E(owned)}</span>{f'<span class="epithet">{E(ep)}</span>' if ep else ''}</h2>
      <p class="kw">{gl.mark(' · '.join(kws), seen, every=True)}</p>
    </div>
    <figure class="model" data-unit="{E(d['id'])}">
      <div class="frame"><img alt="{E(d['name'])}" hidden><div class="empty"><span class="mono">{initial}</span><span>No photo yet</span></div></div>
      <figcaption><span class="cap"></span><span class="editonly"><button class="navbtn small addphoto" type="button">Add photo</button> <button class="navbtn small rmphoto" type="button" hidden>Remove</button></span></figcaption>
    </figure>
  </div>
  <div class="cols">
    <div class="sheet">
      {stat_block(d, gl)}
      {weapons_table(d['ranged'], True, gl, seen)}
      {weapons_table(d['melee'], False, gl, seen)}
      <ul class="abilities">{abilities}</ul>
      {f'<p class="core">{gl.mark(" · ".join(extras), seen)}</p>' if extras else ''}
      {f'<p class="note"><b>Options.</b> {gl.mark(" ".join(x.rstrip(".") + "." for x in opts), seen)}</p>' if opts else ''}
    </div>
    <aside class="strategy">
      <h3>Role</h3><p class="role">{E(st['role'])}</p>
      <h3>How to play it</h3><p>{gl.mark(st['play'], seen)}</p>
      <h3>Pairs with</h3><p>{gl.mark(st['pairs_with'], seen)}</p>
      <h3>Beware</h3><p>{gl.mark(st['beware'], seen)}</p>
      <p class="note">In lists {E(in_lists)}.{f' As built: {E(built.rstrip("."))}.' if built else ''}</p>
    </aside>
  </div>
</div>"""


def primer_slides(ds, gl):
    sheets = {d["id"]: d for d in ds["datasheets"]}
    b = sheets["belakor"]
    slides = []
    seen = set()
    stat_defs = "".join(f"<dt>{E(lbl)} · {E(term)}</dt><dd>{gl.mark(next(t for t in gl.terms if t['term'] == term)['def'], seen)}</dd>"
                        for _, lbl, term in STAT_KEYS)
    example = {"ranged": [b["ranged"][0]], "melee": [b["melee"][1]]}
    slides.append(("I · Primer", "Reading a datasheet", f"""
<div class="wrap">
  <p class="eyebrow">I · Primer</p>
  <h2>Reading a <span class="red">datasheet</span></h2>
  <p class="lead">Every unit slide has the same four parts. Here is Be'lakor's, annotated. Anywhere in this deck, hover or tap a dotted term for its meaning.</p>
  <div class="cols even">
    <div>
      <h3 style="margin-top:18px">1 · The statistics row</h3>
      {stat_block(b, gl)}
      <dl class="rules compact">{stat_defs}</dl>
    </div>
    <div>
      <h3 style="margin-top:18px">2 · A weapon row</h3>
      {weapons_table(example['ranged'], True, gl, seen)}
      {weapons_table(example['melee'], False, gl, seen)}
      <p>{gl.mark("Read a row left to right as the attack sequence. Betraying Shades: 9 attacks, each hitting on 2+; Strength 5 against a marine's Toughness 4 wounds on 3+; AP-2 turns his 3+ armour into a 5+, unless his invulnerable save is better; each failed save costs 1 wound. The keywords change the sequence: Devastating Wounds turns 6s to wound into mortal wounds that no save stops.", seen)}</p>
      <h3>3 · Abilities</h3>
      <p>{gl.mark("What the card does beyond the numbers. A boon tag marks the Shadow Legion's per-god gift, which the current data attaches to each unit as an ability; a wargear tag marks an optional item. Core abilities are the shared ones every army uses, such as Deep Strike and Stealth.", seen)}</p>
      <h3>4 · Strategy</h3>
      <p>The right-hand panel is this repo's advice for this model in this army: its role, how to play it, what it pairs with, and what to beware.</p>
    </div>
  </div>
</div>""", ""))
    seen = set()
    phases = "".join(f"<li><b>{E(n)}.</b> {gl.mark(t, seen)}</li>" for n, t in PHASES)
    steps = "".join(f"<li><b>{E(n)}.</b> {gl.mark(t, seen)}</li>" for n, t in ATTACK_STEPS)
    wt = "".join(f"<tr><td>{E(a)}</td><td class='n'>{E(w)}</td></tr>" for a, w in WOUND_TABLE)
    mods = "".join(f"<li>{gl.mark(m, seen)}</li>" for m in ARMY_MODIFIERS)
    slides.append(("I · Primer", "A turn, and an attack", f"""
<div class="wrap">
  <p class="eyebrow">I · Primer</p>
  <h2>A <span class="red">turn</span>, and an <span class="red">attack</span></h2>
  <div class="cols even">
    <div>
      <h3 style="margin-top:18px">The five phases</h3>
      <ol class="steps">{phases}</ol>
      <h3>What this army does to the dice</h3>
      <ul class="bullets">{mods}</ul>
    </div>
    <div>
      <h3 style="margin-top:18px">One attack, four rolls</h3>
      <ol class="steps">{steps}</ol>
      <h3>The wound roll</h3>
      <div class="tbl"><table><tr><th>Strength against Toughness</th><th>Wound on</th></tr>{wt}</table></div>
    </div>
  </div>
</div>""", ""))
    seen = set()
    wins = "".join(f"<li>{gl.mark(w, seen)}</li>" for w in WIN_POINTS)
    slides.append(("I · Primer", "How you win", f"""
<div class="wrap">
  <p class="eyebrow">I · Primer</p>
  <h2>How you <span class="red">win</span></h2>
  <p class="lead">On points, not kills. A massacre that forgot the markers is a loss.</p>
  <ul class="bullets" style="margin-top:18px">{wins}</ul>
</div>""", ""))
    # glossary slides, three of them
    parts = [("I · the numbers and the weapons", ["Characteristics", "Weapon profile", "Weapon abilities"]),
             ("II · abilities and keywords", ["Core abilities", "Unit keywords"]),
             ("III · the game, and this army's words", ["Phases and dice", "Missions and scoring", "This army's words"])]
    for sub, groups in parts:
        body = []
        for g in groups:
            rows = [t for t in gl.terms if t["group"] == g]
            if not rows:
                continue
            body.append(f"<h3>{E(g)}</h3>")
            body += [f'<div class="entry"><b>{E(t["term"])}</b> {E(t["def"])}</div>' for t in rows]
        slides.append(("I · Primer", f"Glossary {sub.split(' · ')[0]}", f"""
<div class="wrap">
  <p class="eyebrow">I · Primer</p>
  <h2>Glossary <span class="epithet">{E(sub)}</span></h2>
  <div class="gloss">{''.join(body)}</div>
</div>""", ""))
    return slides


def render_deck(ds, udata, units, used, gl, inline=False):
    det = ds["detachment"]
    sheets = {d["id"]: d for d in ds["datasheets"]}
    photos_json = json.dumps(photo_map([d["id"] for d in ds["datasheets"]], inline), ensure_ascii=False)
    slides = []
    slides.append(("", "Title", f"""
<div class="wrap">
  <p class="eyebrow">The Long Shadow Host · every datasheet in the collection</p>
  <h1>Shadow <span class="red">Legion</span> Datasheets</h1>
  <p class="lead">Statistics, weapons and abilities for every model you own, with a strategy for each in Be'lakor's detachment. Numbers from {E(ds['meta']['source'].split(',')[0])}; abilities paraphrased; the app is the arbiter.</p>
  <p class="lead">Coming back to the game? Start with the primer on the next three slides, and hover or tap any dotted term anywhere for its definition. Move with <span class="kbd">→</span> and <span class="kbd">←</span>, swipe on a phone, or press <span class="kbd">C</span> for the contents.</p>
</div>""", "center"))
    slides += primer_slides(ds, gl)
    seen = set()
    rules = "".join(f"<dt>{E(a['name'])}</dt><dd>{gl.mark(a['gist'], seen)}</dd>" for a in ds["army_rules"] if a["name"] != "Harbingers of Dread")
    slides.append(("II · The Army", "How the army works", f"""
<div class="wrap">
  <p class="eyebrow">II · The Army</p>
  <h2>How the <span class="red">army</span> works</h2>
  <dl class="rules">{rules}</dl>
</div>""", ""))
    seen = set()
    boon_gist = {a["name"]: a["gist"] for d in ds["datasheets"] for a in d["abilities"] if a["name"] in BOONS}
    boons = "".join(f"<tr><td>{E(b['allegiance'])}</td><td><b>{E(b['ability'])}</b> {gl.mark(boon_gist.get(b['ability'], ''), seen)}</td></tr>" for b in det.get("boons", []))
    boons += "<tr><td>Slaanesh</td><td>As recorded in July: cannot be targeted by Fire Overwatch. Nothing Slaanesh is owned.</td></tr>"
    enh = "".join(f"<tr><td>{E(e['name'])}</td><td class='n'>{E(str(e['points']))}</td><td>{gl.mark(e['gist'], seen)}</td></tr>" for e in det["enhancements"])
    strats = "".join(f"<tr><td>{E(s['name'])}</td><td class='n'>{E(s['cp'] or '?')}</td><td>{gl.mark(s['gist'], seen)}</td></tr>" for s in det["stratagems"])
    rule_gist = det["rules"][0]["gist"] if det["rules"] else ""
    slides.append(("II · The Army", "The detachment", f"""
<div class="wrap">
  <p class="eyebrow">II · The Army · {E(det['name'])} · {det['detachment_points']} DP</p>
  <h2>The <span class="red">detachment</span></h2>
  <p class="lead">{gl.mark(rule_gist, seen)}</p>
  <div class="cols">
    <div>
      <h3 style="margin-top:18px">Boons</h3>
      <div class="tbl"><table><tr><th>Allegiance</th><th>Boon</th></tr>{boons}</table></div>
      <h3>Enhancements</h3>
      <div class="tbl"><table><tr><th>Enhancement</th><th>Pts</th><th>What it does</th></tr>{enh}</table></div>
    </div>
    <div>
      <h3 style="margin-top:18px">Stratagems</h3>
      <div class="tbl"><table><tr><th>Stratagem</th><th>CP</th><th>What it does</th></tr>{strats}</table></div>
      <p class="note">{E(det.get('stratagems_note', ''))}</p>
    </div>
  </div>
</div>""", ""))
    numerals = ["III", "IV", "V", "VI", "VII", "VIII", "IX"]
    for i, (name, god, blurb, ids) in enumerate(GROUPS):
        sec = f"{numerals[i]} · {name}"
        listed = [uid for uid in ids if uid in sheets and uid in units]
        roster = " · ".join(sheets[uid]["name"] for uid in listed)
        slides.append((sec, name, f"""
<div class="wrap chapter">
  <div class="numeral">{numerals[i]}</div>
  <h2>{E(name)} <span class="epithet">{E(god)}</span></h2>
  <p class="lead">{E(blurb)}</p>
  <p class="meta">{E(roster)}</p>
</div>""", "center"))
        for uid in listed:
            slides.append((sec, sheets[uid]["name"], deck_unit(sheets[uid], units[uid], used, sec, gl), "unit"))
    with open(LISTS, encoding="utf-8") as f:
        ldata = json.load(f)
    _, _, u2, e2 = build_lists.load()
    limits = udata["meta"]["limits"]
    rows = []
    for lst in ldata["lists"]:
        errs = []
        entries = build_lists.resolve(lst["units"], u2, e2, errs)
        build_lists.assign_tags(entries)
        v = build_lists.validate(lst, entries, u2, limits)
        buy, assemble = build_lists.compute_gap(entries, u2)
        rows.append(f"<tr><td><b>{E(lst['id'])} · {E(lst['name'])}</b><br><span class='meta'>{E(lst['shape'])}</span></td><td class='n'>{v['total']:,}</td><td>{E(build_lists.status_line(buy, assemble))}</td></tr>")
    slides.append(("X · The Lists", "The seven lists", f"""
<div class="wrap">
  <p class="eyebrow">X · The Lists</p>
  <h2>The seven <span class="red">lists</span></h2>
  <p class="lead">Full rosters, options and gaps live in army-lists.md, generated from the same data as this deck.</p>
  <div class="tbl" style="margin-top:18px"><table><tr><th>List</th><th>Pts</th><th>Status</th></tr>{''.join(rows)}</table></div>
  <p class="note">Standing rule from the strategy doc, still in force: after the current arrivals are catalogued, play ten games before buying another model.</p>
</div>""", ""))

    sections_js = json.dumps([{"s": s, "t": t} for s, t, _, _ in slides], ensure_ascii=False)
    gloss_js = gl.dictionary_js()
    body = "".join(f'<section class="slide {cls}" aria-hidden="true">{h}</section>' for s, t, h, cls in slides)
    toc_html = []
    cur = None
    for i, (s, t, _, _) in enumerate(slides):
        if s != cur:
            toc_html.append(f"<h3>{E(s) or 'Start'}</h3>")
            cur = s
        toc_html.append(f'<a href="#{i + 1}" data-i="{i}"><small>{i + 1:02d}</small>{E(t)}</a>')
    page = f"""<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shadow Legion Datasheets</title>
<style>{CSS}</style>
<div id="bar"></div>
<div id="sect"><span id="sectlabel"></span><button class="navbtn" id="tocbtn" aria-label="Contents">Contents</button></div>
<div id="deck">{body}</div>
<div id="toc" hidden><div class="toc"><p class="eyebrow">Contents</p>{''.join(toc_html)}</div></div>
<div id="tip" role="tooltip" hidden><b></b><span></span></div>
<div id="msg" hidden></div>
<script type="application/json" id="photos">{photos_json}</script>
<input type="file" id="photofile" accept="image/*" hidden>
<div id="hud">
  <button class="navbtn" id="prev" aria-label="Previous slide">‹ Back</button>
  <span id="counter"></span>
  <button class="navbtn" id="save" type="button">Save photos</button>
  <button class="navbtn" id="next" aria-label="Next slide">Next ›</button>
</div>
<script>
const S = {sections_js};
const G = {gloss_js};
const slides = [...document.querySelectorAll('.slide')];
const toc = document.getElementById('toc');
const tip = document.getElementById('tip');
let cur = 0, pinned = null;
function hideTip(){{ tip.hidden = true; pinned = null; }}
function showTip(el){{
  tip.querySelector('b').textContent = el.dataset.t;
  tip.querySelector('span').textContent = G[el.dataset.t] || '';
  tip.hidden = false;
  if (innerWidth > 700) {{
    const r = el.getBoundingClientRect();
    const w = Math.min(340, innerWidth - 24);
    let left = Math.max(12, Math.min(r.left, innerWidth - w - 12));
    let top = r.bottom + 8;
    const h = tip.offsetHeight;
    if (top + h > innerHeight - 70) top = Math.max(12, r.top - h - 8);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }}
}}
function go(n){{
  n = Math.max(0, Math.min(slides.length - 1, n));
  slides[cur].classList.remove('active'); slides[cur].setAttribute('aria-hidden', 'true');
  cur = n;
  slides[cur].classList.add('active'); slides[cur].setAttribute('aria-hidden', 'false');
  slides[cur].scrollTop = 0;
  document.getElementById('counter').textContent = (cur + 1) + ' / ' + slides.length;
  document.getElementById('bar').style.width = ((cur + 1) / slides.length * 100) + '%';
  document.getElementById('sectlabel').textContent = S[cur].s;
  toc.hidden = true; hideTip();
  history.replaceState(null, '', cur ? '#' + (cur + 1) : location.pathname);
}}
document.getElementById('next').onclick = () => go(cur + 1);
document.getElementById('prev').onclick = () => go(cur - 1);
document.getElementById('tocbtn').onclick = () => {{ toc.hidden = !toc.hidden; }};
toc.addEventListener('click', e => {{ const a = e.target.closest('a[data-i]'); if (a) {{ e.preventDefault(); go(+a.dataset.i); }} }});
document.addEventListener('mouseover', e => {{ const t = e.target.closest('.term'); if (t && !pinned) showTip(t); }});
document.addEventListener('mouseout', e => {{ if (!pinned && e.target.closest && e.target.closest('.term')) hideTip(); }});
document.addEventListener('focusin', e => {{ const t = e.target.closest && e.target.closest('.term'); if (t) showTip(t); }});
document.addEventListener('focusout', e => {{ if (!pinned) hideTip(); }});
document.addEventListener('click', e => {{
  const t = e.target.closest('.term');
  if (t) {{ if (pinned === t) {{ hideTip(); }} else {{ pinned = t; showTip(t); }} e.stopPropagation(); return; }}
  if (!e.target.closest('#tip')) hideTip();
}});
addEventListener('keydown', e => {{
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') {{ hideTip(); toc.hidden = true; return; }}
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {{ e.preventDefault(); go(cur + 1); }}
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{ e.preventDefault(); go(cur - 1); }}
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(slides.length - 1);
  else if (e.key === 'c' || e.key === 'C') toc.hidden = !toc.hidden;
}});
let tx = null, ty = null;
addEventListener('touchstart', e => {{ tx = e.touches[0].clientX; ty = e.touches[0].clientY; }}, {{passive: true}});
addEventListener('touchend', e => {{
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
  tx = ty = null;
}}, {{passive: true}});
addEventListener('hashchange', () => {{ const h = parseInt(location.hash.slice(1), 10); if (!isNaN(h)) go(h - 1); }});
const h0 = parseInt(location.hash.slice(1), 10);
go(!isNaN(h0) && h0 >= 1 ? h0 - 1 : 0);

/* ---- model photos: rendered from the JSON block; editable on the published deck ---- */
const PHOTOS = JSON.parse(document.getElementById('photos').textContent || '{{}}');
const msg = document.getElementById('msg');
let msgTimer = null;
function say(text, sticky){{ msg.textContent = text; msg.hidden = false; clearTimeout(msgTimer); if (!sticky) msgTimer = setTimeout(() => {{ msg.hidden = true; }}, 4000); }}
function renderPhotos(){{
  document.querySelectorAll('figure.model').forEach(fig => {{
    const uid = fig.dataset.unit, src = PHOTOS[uid];
    const img = fig.querySelector('img'), empty = fig.querySelector('.empty');
    const add = fig.querySelector('.addphoto'), rm = fig.querySelector('.rmphoto');
    if (src) {{ img.src = src; img.hidden = false; empty.hidden = true; add.textContent = 'Replace photo'; rm.hidden = false; }}
    else {{ img.removeAttribute('src'); img.hidden = true; empty.hidden = false; add.textContent = 'Add photo'; rm.hidden = true; }}
  }});
}}
renderPhotos();
let artifactNs = null, pendingUnit = null;
function setDirty(){{ document.body.classList.add('dirty'); }}
async function shrink(file){{
  const MAX = 1000;
  let bmp;
  try {{ bmp = await createImageBitmap(file, {{ imageOrientation: 'from-image' }}); }}
  catch (e) {{
    bmp = await new Promise((res, rej) => {{ const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }});
  }}
  const w = bmp.width, h = bmp.height, k = Math.min(1, MAX / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}}
function addPhotoFromDataUrl(uid, dataUrl){{ PHOTOS[uid] = dataUrl; renderPhotos(); setDirty(); }}
function removePhoto(uid){{ delete PHOTOS[uid]; renderPhotos(); setDirty(); }}
const fileInput = document.getElementById('photofile');
document.addEventListener('click', e => {{
  const add = e.target.closest('.addphoto'), rm = e.target.closest('.rmphoto');
  if (add) {{ pendingUnit = add.closest('figure.model').dataset.unit; fileInput.value = ''; fileInput.click(); }}
  else if (rm) {{ removePhoto(rm.closest('figure.model').dataset.unit); }}
}});
fileInput.addEventListener('change', async () => {{
  const f = fileInput.files && fileInput.files[0];
  if (!f || !pendingUnit) return;
  try {{ addPhotoFromDataUrl(pendingUnit, await shrink(f)); say('Photo staged. Press Save photos to publish.'); }}
  catch (err) {{ say('Could not read that image.'); }}
}});
function buildPublishHtml(){{
  const doc = document.documentElement.cloneNode(true);
  doc.querySelectorAll('.slide').forEach(s => {{ s.classList.remove('active'); s.setAttribute('aria-hidden', 'true'); }});
  ['tip', 'toc', 'msg'].forEach(id => {{ const el = doc.querySelector('#' + id); if (el) {{ el.hidden = true; el.removeAttribute('style'); }} }});
  const bar = doc.querySelector('#bar'); if (bar) bar.removeAttribute('style');
  ['counter', 'sectlabel'].forEach(id => {{ const el = doc.querySelector('#' + id); if (el) el.textContent = ''; }});
  doc.querySelector('body').classList.remove('can-edit', 'dirty');
  doc.querySelectorAll('figure.model img').forEach(img => {{ img.removeAttribute('src'); img.hidden = true; }});
  doc.querySelectorAll('figure.model .empty').forEach(el => {{ el.hidden = false; }});
  doc.querySelectorAll('figure.model .rmphoto').forEach(el => {{ el.hidden = true; }});
  doc.querySelectorAll('figure.model .addphoto').forEach(el => {{ el.textContent = 'Add photo'; }});
  const fi = doc.querySelector('#photofile'); if (fi) fi.value = '';
  doc.querySelector('#photos').textContent = JSON.stringify(PHOTOS);
  return '<!doctype html>\\n' + doc.outerHTML;
}}
document.getElementById('save').onclick = async () => {{
  if (!artifactNs) {{ say('Saving is only available on the published deck.'); return; }}
  say('Saving…', true);
  try {{ await artifactNs.publish(buildPublishHtml()); say('Saved. Reloading.', true); }}
  catch (err) {{
    const code = err && err.code;
    if (code === 'too_large') say('Too many photos for one page. Remove one and save again.', true);
    else if (code === 'conflict') say('A newer version was published elsewhere; this page will reload.', true);
    else if (code === 'not_writer' || code === 'not_granted') {{ document.body.classList.remove('can-edit', 'dirty'); say('This copy is read-only.', true); }}
    else if (code === 'rate_limited') say('Saving too often. Wait a moment and try again.', true);
    else say('Could not save: ' + (err && err.message || code || 'unknown error'), true);
  }}
}};
if (window.claude && typeof window.claude.use === 'function') {{
  window.claude.use('artifact').then(ns => {{ if (ns) {{ artifactNs = ns; document.body.classList.add('can-edit'); }} }});
}} else if (location.search.indexOf('edit') !== -1) {{
  document.body.classList.add('can-edit');  /* local testing of the photo flow; Save stays unavailable */
}}
window.__deck = {{ addPhotoFromDataUrl, removePhoto, buildPublishHtml, PHOTOS }};
</script>
"""
    return page, len(slides)


gl_meta_note = ""


def main(argv):
    global gl_meta_note
    if "--import-photos" in argv:
        return import_photos(argv[argv.index("--import-photos") + 1])
    ds, udata, units, used, gloss = load()
    gl = Glossary(gloss)
    gl_meta_note = gloss["meta"]["note"]
    md = render_md(ds, udata, units, used, gl)
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write(md)
    page, n = render_deck(ds, udata, units, used, gl)
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(page)
    marks = page.count('class="term"')
    photos = len(photo_map([d["id"] for d in ds["datasheets"]], False))
    print(f"wrote datasheets.md ({len(md.splitlines())} lines) and datasheets-deck.html ({n} slides, {len(page) // 1024} KB, {marks} term tooltips, {photos} photos)")
    if "--artifact" in argv:
        out = argv[argv.index("--artifact") + 1]
        page2, _ = render_deck(ds, udata, units, used, gl, inline=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(page2)
        print(f"wrote {out} ({len(page2) // 1024} KB, photos embedded)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
