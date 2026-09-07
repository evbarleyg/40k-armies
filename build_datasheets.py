#!/usr/bin/env python3
"""
The Shadow Legion datasheets — build step.

Reads data/datasheets.json (extracted from BSData, with hand-written gists and
strategy), data/units.json (inventory, loadouts, options) and data/lists.json
(which list uses what), and writes:

    datasheets.md         the long-form book: one stat sheet per datasheet
    datasheets-deck.html  the same content as a slide deck (phone-usable, no
                          external resources; publishable as-is)

    python3 build_datasheets.py

Do not hand-edit the outputs; edit the data and rerun.
"""
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_lists  # noqa: E402  (list summary for the closing slide)

DS = os.path.join(HERE, "data", "datasheets.json")
UNITS = os.path.join(HERE, "data", "units.json")
LISTS = os.path.join(HERE, "data", "lists.json")
OUT_MD = os.path.join(HERE, "datasheets.md")
OUT_HTML = os.path.join(HERE, "datasheets-deck.html")

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
STAT_KEYS = [("M", "M"), ("T", "T"), ("Sv", "Sv"), ("W", "W"), ("LD", "Ld"), ("OC", "OC"), ("InSv", "Inv")]


def load():
    with open(DS, encoding="utf-8") as f:
        ds = json.load(f)
    with open(UNITS, encoding="utf-8") as f:
        udata = json.load(f)
    with open(LISTS, encoding="utf-8") as f:
        ldata = json.load(f)
    units = {u["id"]: u for u in udata["units"]}
    used = {}
    for lst in ldata["lists"]:
        for spec in lst["units"]:
            used.setdefault(spec["unit"], [])
            if lst["id"] not in used[spec["unit"]]:
                used[spec["unit"]].append(lst["id"])
    return ds, udata, units, used


def owned_line(u):
    ow = u.get("owned", {})
    st = ow.get("status", "none")
    count = ow.get("count", 0)
    rng = ow.get("count_range")
    n = f"{rng[0]} to {rng[1]}" if rng else str(count)
    if st == "own":
        s = f"{n} owned, {ow.get('paint', 'painted')}"
    elif st == "assemble":
        s = f"{n} owned, unassembled"
    elif st == "uncatalogued":
        s = "delivered, not yet catalogued"
    else:
        s = "not owned"
    return s


def status_class(u):
    return {"own": "own", "assemble": "build", "uncatalogued": "pending", "none": "buy"}[u.get("owned", {}).get("status", "none")]


def points_str(d):
    return " · ".join(f"{p} pts ({n})" for n, p in d["points"].items()) or "no price recorded"


def dash(v):
    return v if v not in (None, "", "N/A") else "–"


# ---------------------------------------------------------------- markdown

def md_unit(d, u, used):
    o = []
    ep = EPITHETS.get(d["id"])
    o.append(f"### {d['name']}" + (f" — {ep}" if ep else ""))
    o.append("")
    kws = [k for k in d["keywords"] if k not in (d["name"], "Chaos")]
    o.append(f"*{points_str(d)} · {d['composition']} · {d['faction']} · {', '.join(kws)}.*")
    o.append("")
    o.append(f"**In the collection:** {owned_line(u)}." + (f" {u['owned']['note'][0].upper() + u['owned']['note'][1:].rstrip('.')}." if u.get("owned", {}).get("note") else "")
             + (f" As built: {u['owned']['built'].rstrip('.')}." if u.get("owned", {}).get("built") else "")
             + (f" In lists {', '.join(used[d['id']])}." if used.get(d["id"]) else " In no list yet."))
    o.append("")
    # stats
    multi = len(d["profiles"]) > 1
    head = (["Profile"] if multi else []) + [lbl for _, lbl in STAT_KEYS]
    o.append("| " + " | ".join(head) + " |")
    o.append("|" + "---|" * len(head))
    for p in d["profiles"]:
        row = ([p["name"]] if multi else []) + [dash(p.get(k)) for k, _ in STAT_KEYS]
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


def render_md(ds, udata, units, used):
    meta = ds["meta"]
    det = ds["detachment"]
    o = []
    o.append("# The Shadow Legion datasheets")
    o.append("")
    o.append("### Every datasheet in the collection, with the numbers and what to do with them")
    o.append("")
    o.append(f"*Generated by `build_datasheets.py` from `data/datasheets.json`, `data/units.json` and `data/lists.json`. "
             f"Source of the statistics: {meta['source']}. Characteristics, weapon profiles, points and keywords are facts "
             "extracted from that data; every ability, rule, enhancement and stratagem is given as a name and a paraphrase, "
             "never the printed text, and the official app is the arbiter for all of it. The strategy paragraphs are this "
             "repo's own advice for this collection in the Shadow Legion detachment. The slide-deck edition is `datasheets-deck.html`.*")
    o.append("")
    o.append("## How to read a sheet")
    o.append("")
    o += [
        "- The statistics row is Move, Toughness, Save, Wounds, Leadership, Objective Control and the invulnerable save. Weapons list Range, Attacks, skill (BS or WS), Strength, Armour Penetration and Damage; a weapon with two profiles appears twice.",
        "- Abilities marked *detachment boon* are the Shadow Legion's per-god boons, which the current data attaches to each unit as an ability. Abilities marked *wargear* come with an optional item.",
        "- \"In the collection\" comes from the inventory in `data/units.json`, and \"in lists\" from `army-lists.md`. Points are the current data's; where they differ from the July 27 audit, `army-lists.md` says so.",
        "- Everything here is a snapshot. Before a tournament, open the app.",
    ]
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
    boon_gist = {}
    for d in ds["datasheets"]:
        for a in d["abilities"]:
            if a["name"] in BOONS:
                boon_gist[a["name"]] = a["gist"]
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

E = html.escape

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
  .serif{ font-family:Palatino,"Palatino Linotype","Book Antiqua",Georgia,serif; }
  h1,h2,h3{ font-family:Palatino,"Palatino Linotype","Book Antiqua",Georgia,serif; text-wrap:balance; margin:0; }
  #deck{ position:fixed; inset:0; }
  .slide{ position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch;
    padding:56px clamp(16px,5vw,64px) 96px; box-sizing:border-box; display:none; }
  .slide.active{ display:block; }
  .slide.center{ display:none; }
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
  .chapter p.lead{ margin-top:10px; }
  .meta{ color:var(--dim); font-size:13px; margin:8px 0 0; }
  .kw{ font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--dim); margin:6px 0 0; }
  .badge{ display:inline-block; font-size:10.5px; text-transform:uppercase; letter-spacing:.12em; border-radius:2px;
    padding:2px 8px; font-weight:600; border:1px solid currentColor; vertical-align:middle; margin-left:8px; }
  .badge.own{ color:var(--own); } .badge.build{ color:var(--pending); } .badge.pending{ color:var(--pending); }
  .badge.buy{ color:var(--buy); }
  .pts{ font-family:ui-monospace,Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; color:var(--crimson); font-weight:600; }
  .cols{ display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:28px; margin-top:22px; align-items:start; }
  @media (max-width:860px){ .cols{ grid-template-columns:minmax(0,1fr); gap:20px; } }
  .sheet, aside.strategy{ min-width:0; }
  table{ border-collapse:collapse; width:100%; font-size:13px; }
  th{ text-align:left; text-transform:uppercase; letter-spacing:.1em; font-size:10px; color:var(--brass);
    padding:6px 8px; border-bottom:1px solid var(--line); font-weight:600; white-space:nowrap; }
  td{ padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  tr:last-child td{ border-bottom:0; }
  .num, td.n{ font-family:ui-monospace,Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .stats{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin:0 0 14px; }
  .stat{ background:var(--panel); border:1px solid var(--line); padding:8px 4px; text-align:center; min-width:0; }
  .stat b{ display:block; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--brass); }
  .stat span{ display:block; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:clamp(15px,1.6vw,20px); font-variant-numeric:tabular-nums; margin-top:2px; }
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
  .rules dt{ font-family:Palatino,Georgia,serif; font-size:19px; margin:18px 0 4px; }
  .rules dd{ margin:0; max-width:78ch; color:var(--ink); }
  .kbd{ font-family:ui-monospace,Menlo,monospace; border:1px solid var(--line); border-bottom-width:2px; border-radius:4px;
    padding:1px 7px; font-size:12px; background:var(--panel); }
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


def stat_block(d):
    out = []
    for p in d["profiles"]:
        if len(d["profiles"]) > 1:
            out.append(f'<p class="stat-name">{E(p["name"])}</p>')
        cells = "".join(f'<div class="stat"><b>{lbl}</b><span>{E(dash(p.get(k)))}</span></div>' for k, lbl in STAT_KEYS)
        out.append(f'<div class="stats">{cells}</div>')
    return "".join(out)


def weapons_table(rows, ranged):
    if not rows:
        return ""
    if ranged:
        head = "<tr><th>Ranged</th><th>Range</th><th>A</th><th>BS</th><th>S</th><th>AP</th><th>D</th><th>Keywords</th></tr>"
        body = "".join(f"<tr><td>{E(w['name'])}</td><td class='n'>{E(w.get('Range',''))}</td><td class='n'>{E(str(w.get('A','')))}</td><td class='n'>{E(dash(w.get('BS')))}</td><td class='n'>{E(str(w.get('S','')))}</td><td class='n'>{E(str(w.get('AP','')))}</td><td class='n'>{E(str(w.get('D','')))}</td><td>{E(dash(w.get('Keywords')))}</td></tr>" for w in rows)
    else:
        head = "<tr><th>Melee</th><th>A</th><th>WS</th><th>S</th><th>AP</th><th>D</th><th>Keywords</th></tr>"
        body = "".join(f"<tr><td>{E(w['name'])}</td><td class='n'>{E(str(w.get('A','')))}</td><td class='n'>{E(str(w.get('WS','')))}</td><td class='n'>{E(str(w.get('S','')))}</td><td class='n'>{E(str(w.get('AP','')))}</td><td class='n'>{E(str(w.get('D','')))}</td><td>{E(dash(w.get('Keywords')))}</td></tr>" for w in rows)
    return f'<div class="tbl wide"><table>{head}{body}</table></div>'


def deck_unit(d, u, used, section):
    ep = EPITHETS.get(d["id"])
    kws = [k for k in d["keywords"] if k not in (d["name"], "Chaos")]
    st = d["strategy"]
    abilities = "".join(
        f"<li><b>{E(a['name'])}</b>"
        + ('<span class="tag">boon</span>' if a["name"] in BOONS else ('<span class="tag">wargear</span>' if a["name"] in WARGEAR else ""))
        + f" {E(a['gist'])}</li>" for a in d["abilities"])
    extras = []
    if d["core"]:
        extras.append("Core: " + ", ".join(d["core"]))
    if d["leader"]:
        extras.append("Leads: " + ", ".join(d["leader"]))
    opts = u.get("options") or []
    owned = owned_line(u)
    built = u.get("owned", {}).get("built")
    in_lists = ", ".join(used.get(d["id"], [])) or "none yet"
    body = f"""
<div class="wrap">
  <p class="eyebrow">{E(section)} · <span class="pts">{E(points_str(d))}</span> · {E(d['composition'])}</p>
  <h2>{E(d['name'])}<span class="badge {status_class(u)}">{E(owned)}</span>{f'<span class="epithet">{E(ep)}</span>' if ep else ''}</h2>
  <p class="kw">{E(' · '.join(kws))}</p>
  <div class="cols">
    <div class="sheet">
      {stat_block(d)}
      {weapons_table(d['ranged'], True)}
      {weapons_table(d['melee'], False)}
      <ul class="abilities">{abilities}</ul>
      {f'<p class="core">{E(" · ".join(extras))}</p>' if extras else ''}
      {f'<p class="note"><b>Options.</b> {E(" ".join(x.rstrip(".") + "." for x in opts))}</p>' if opts else ''}
    </div>
    <aside class="strategy">
      <h3>Role</h3><p class="role">{E(st['role'])}</p>
      <h3>How to play it</h3><p>{E(st['play'])}</p>
      <h3>Pairs with</h3><p>{E(st['pairs_with'])}</p>
      <h3>Beware</h3><p>{E(st['beware'])}</p>
      <p class="note">In lists {E(in_lists)}.{f' As built: {E(built.rstrip("."))}.' if built else ''}</p>
    </aside>
  </div>
</div>"""
    return body


def render_deck(ds, udata, units, used):
    det = ds["detachment"]
    sheets = {d["id"]: d for d in ds["datasheets"]}
    slides = []  # (section, title, html, classes)
    slides.append(("", "Title", f"""
<div class="wrap">
  <p class="eyebrow">The Long Shadow Host · every datasheet in the collection</p>
  <h1>Shadow <span class="red">Legion</span> Datasheets</h1>
  <p class="lead">Statistics, weapons and abilities for every model you own, with a strategy for each in Be'lakor's detachment. Numbers from {E(ds['meta']['source'].split(',')[0])}; abilities paraphrased; the app is the arbiter.</p>
  <p class="lead">Move with <span class="kbd">→</span> and <span class="kbd">←</span>, swipe on a phone, or press <span class="kbd">C</span> for the contents. <span class="kbd">Home</span> returns here.</p>
</div>""", "center"))
    rules = "".join(f"<dt>{E(a['name'])}</dt><dd>{E(a['gist'])}</dd>" for a in ds["army_rules"] if a["name"] != "Harbingers of Dread")
    slides.append(("I · The Army", "How the army works", f"""
<div class="wrap">
  <p class="eyebrow">I · The Army</p>
  <h2>How the <span class="red">army</span> works</h2>
  <dl class="rules">{rules}</dl>
</div>""", ""))
    boon_gist = {a["name"]: a["gist"] for d in ds["datasheets"] for a in d["abilities"] if a["name"] in BOONS}
    boons = "".join(f"<tr><td>{E(b['allegiance'])}</td><td><b>{E(b['ability'])}</b> {E(boon_gist.get(b['ability'], ''))}</td></tr>" for b in det.get("boons", []))
    boons += "<tr><td>Slaanesh</td><td>As recorded in July: cannot be targeted by Fire Overwatch. Nothing Slaanesh is owned.</td></tr>"
    enh = "".join(f"<tr><td>{E(e['name'])}</td><td class='n'>{E(str(e['points']))}</td><td>{E(e['gist'])}</td></tr>" for e in det["enhancements"])
    strats = "".join(f"<tr><td>{E(s['name'])}</td><td class='n'>{E(s['cp'] or '?')}</td><td>{E(s['gist'])}</td></tr>" for s in det["stratagems"])
    rule_gist = det["rules"][0]["gist"] if det["rules"] else ""
    slides.append(("I · The Army", "The detachment", f"""
<div class="wrap">
  <p class="eyebrow">I · The Army · {E(det['name'])} · {det['detachment_points']} DP</p>
  <h2>The <span class="red">detachment</span></h2>
  <p class="lead">{E(rule_gist)}</p>
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
    numerals = ["II", "III", "IV", "V", "VI", "VII", "VIII"]
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
            slides.append((sec, sheets[uid]["name"], deck_unit(sheets[uid], units[uid], used, sec), "unit"))
    # closing: the lists
    errors, warnings, _ = build_lists.build()
    with open(LISTS, encoding="utf-8") as f:
        ldata = json.load(f)
    u2, e2 = build_lists.load()[2], build_lists.load()[3]
    limits = udata["meta"]["limits"]
    rows = []
    for lst in ldata["lists"]:
        errs = []
        entries = build_lists.resolve(lst["units"], u2, e2, errs)
        build_lists.assign_tags(entries)
        v = build_lists.validate(lst, entries, u2, limits)
        buy, assemble = build_lists.compute_gap(entries, u2)
        rows.append(f"<tr><td><b>{E(lst['id'])} · {E(lst['name'])}</b><br><span class='meta'>{E(lst['shape'])}</span></td><td class='n'>{v['total']:,}</td><td>{E(build_lists.status_line(buy, assemble))}</td></tr>")
    slides.append(("IX · The Lists", "The seven lists", f"""
<div class="wrap">
  <p class="eyebrow">IX · The Lists</p>
  <h2>The seven <span class="red">lists</span></h2>
  <p class="lead">Full rosters, options and gaps live in army-lists.md, generated from the same data as this deck.</p>
  <div class="tbl" style="margin-top:18px"><table><tr><th>List</th><th>Pts</th><th>Status</th></tr>{''.join(rows)}</table></div>
  <p class="note">Standing rule from the strategy doc, still in force: after the current arrivals are catalogued, play ten games before buying another model.</p>
</div>""", ""))

    sections_js = json.dumps([{"s": s, "t": t} for s, t, _, _ in slides], ensure_ascii=False)
    body = "".join(f'<section class="slide {cls}" aria-hidden="true">{h}</section>' for s, t, h, cls in slides)
    toc_html = []
    cur = None
    for i, (s, t, _, _) in enumerate(slides):
        if s != cur:
            toc_html.append(f"<h3>{E(s) or 'Start'}</h3>")
            cur = s
        toc_html.append(f'<a href="#{i + 1}" data-i="{i}"><small>{i + 1:02d}</small>{E(t)}</a>')
    page = f"""<title>Shadow Legion Datasheets</title>
<style>{CSS}</style>
<div id="bar"></div>
<div id="sect"><span id="sectlabel"></span><button class="navbtn" id="tocbtn" aria-label="Contents">Contents</button></div>
<div id="deck">{body}</div>
<div id="toc" hidden><div class="toc"><p class="eyebrow">Contents</p>{''.join(toc_html)}</div></div>
<div id="hud">
  <button class="navbtn" id="prev" aria-label="Previous slide">‹ Back</button>
  <span id="counter"></span>
  <button class="navbtn" id="next" aria-label="Next slide">Next ›</button>
</div>
<script>
const S = {sections_js};
const slides = [...document.querySelectorAll('.slide')];
const toc = document.getElementById('toc');
let cur = 0;
function go(n){{
  n = Math.max(0, Math.min(slides.length - 1, n));
  slides[cur].classList.remove('active'); slides[cur].setAttribute('aria-hidden', 'true');
  cur = n;
  slides[cur].classList.add('active'); slides[cur].setAttribute('aria-hidden', 'false');
  slides[cur].scrollTop = 0;
  document.getElementById('counter').textContent = (cur + 1) + ' / ' + slides.length;
  document.getElementById('bar').style.width = ((cur + 1) / slides.length * 100) + '%';
  document.getElementById('sectlabel').textContent = S[cur].s;
  toc.hidden = true;
  history.replaceState(null, '', cur ? '#' + (cur + 1) : location.pathname);
}}
document.getElementById('next').onclick = () => go(cur + 1);
document.getElementById('prev').onclick = () => go(cur - 1);
document.getElementById('tocbtn').onclick = () => {{ toc.hidden = !toc.hidden; }};
toc.addEventListener('click', e => {{ const a = e.target.closest('a[data-i]'); if (a) {{ e.preventDefault(); go(+a.dataset.i); }} }});
addEventListener('keydown', e => {{
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {{ e.preventDefault(); go(cur + 1); }}
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{ e.preventDefault(); go(cur - 1); }}
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(slides.length - 1);
  else if (e.key === 'c' || e.key === 'C') toc.hidden = !toc.hidden;
  else if (e.key === 'Escape') toc.hidden = true;
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
</script>
"""
    return page, len(slides)


def main():
    ds, udata, units, used = load()
    md = render_md(ds, udata, units, used)
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write(md)
    page, n = render_deck(ds, udata, units, used)
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"wrote datasheets.md ({len(md.splitlines())} lines) and datasheets-deck.html ({n} slides, {len(page) // 1024} KB)")


if __name__ == "__main__":
    main()
