#!/usr/bin/env python3
"""Muster — canonical store tooling.

    python3 muster.py validate   # integrity + legality lint (needs node for the lint); non-zero exit on failure
    python3 muster.py build      # validate, then write muster.js and refresh the generated regions in the prose docs
    python3 muster.py check      # build's checks plus: every generated region on disk matches the store (battery gate)
    python3 muster.py fmt        # rewrite data/muster.json in the house format (one record per line)

data/muster.json is the one hand-maintained store. Numbers anywhere else are generated from it here,
inside <!--gen:NAME--> … <!--/gen:NAME--> markers, or carry a "snapshot — see the app" line.
"""
import datetime, glob, json, os, re, shutil, statistics, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "data", "muster.json")
SCOUT = os.path.join(HERE, "data", "scout-2026-07-27.json")
OUT_JS = os.path.join(HERE, "muster.js")

# ---------- io ----------

def load(path=STORE):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def dumps(store):
    """House format: two-space JSON, but every record inside the big arrays sits on one line —
    diffs stay one-line-per-fact and the file stays hand-editable."""
    def enc(v, depth):
        pad, pad2 = "  " * depth, "  " * (depth + 1)
        if isinstance(v, dict):
            if not v: return "{}"
            if depth >= 2: return json.dumps(v, ensure_ascii=False)
            return "{\n" + ",\n".join(f"{pad2}{json.dumps(k)}: {enc(x, depth + 1)}" for k, x in v.items()) + f"\n{pad}}}"
        if isinstance(v, list):
            if not v: return "[]"
            if depth >= 3 or all(not isinstance(x, (dict, list)) for x in v): return json.dumps(v, ensure_ascii=False)
            return "[\n" + ",\n".join(pad2 + (json.dumps(x, ensure_ascii=False) if depth >= 1 else enc(x, depth + 1)) for x in v) + f"\n{pad}]"
        return json.dumps(v, ensure_ascii=False)
    return enc(store, 0) + "\n"

def write_if_changed(path, text):
    try:
        if open(path, encoding="utf-8").read() == text: return False
    except OSError:
        pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"[muster] wrote {os.path.relpath(path, HERE)}")
    return True

# ---------- validation ----------

DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def integrity(store):
    """Structural checks that need no rules knowledge. Returns a list of error strings."""
    errs = []
    def dup(seq, what):
        seen = set()
        for x in seq:
            if x in seen: errs.append(f"duplicate {what} id: {x}")
            seen.add(x)
    units = {u["id"]: u for u in store.get("units", [])}
    orders = {o["id"]: o for o in store.get("orders", [])}
    enh = {e["id"] for e in store["rules"].get("enhancements", [])}
    dup([u["id"] for u in store["units"]], "unit"); dup(orders, "order")
    dup([i["id"] for i in store["inventory"]], "inventory"); dup([l["id"] for l in store["lists"]], "list")
    for u in store["units"]:
        if not u.get("sizes"): errs.append(f"unit {u['id']}: no sizes")
        for lid in u.get("leads", []):
            if lid not in units: errs.append(f"unit {u['id']} leads unknown unit {lid}")
        ms = [s["models"] for s in u["sizes"]]
        if ms != sorted(ms): errs.append(f"unit {u['id']}: sizes not ascending")
    for i in store["inventory"]:
        if i["unit"] not in units: errs.append(f"inventory {i['id']}: unknown unit {i['unit']}")
        if i.get("order") and i["order"] not in orders: errs.append(f"inventory {i['id']}: unknown order {i['order']}")
        if i.get("status") not in ("owned", "inbound", "pending"): errs.append(f"inventory {i['id']}: bad status {i.get('status')}")
        if i["status"] == "owned" and not isinstance(i.get("models"), int): errs.append(f"inventory {i['id']}: owned rows need an integer model count")
        if i.get("paint") not in store["hobby"]["paint_states"]: errs.append(f"inventory {i['id']}: paint state {i.get('paint')!r} not in hobby.paint_states")
    for o in store["orders"]:
        if not DATE.match(o.get("date", "")): errs.append(f"order {o['id']}: bad date")
        if not isinstance(o.get("cost_usd"), (int, float)): errs.append(f"order {o['id']}: cost_usd must be a number")
        if o.get("status") not in ("delivered", "shipped", "inbound", "ordered"): errs.append(f"order {o['id']}: bad status")
        if o["status"] == "delivered" and not DATE.match(o.get("delivered", "")): errs.append(f"order {o['id']}: delivered orders need a delivered date")
        if o["status"] != "delivered" and o.get("contents") not in (None, "catalogued"): errs.append(f"order {o['id']}: contents must be null until catalogued")
        for d in o.get("eta", []) or []:
            if not DATE.match(d): errs.append(f"order {o['id']}: bad eta date {d}")
    for l in store["lists"]:
        dup([e["id"] for e in l["entries"]], f"list {l['id']} entry")
        ids = {e["id"] for e in l["entries"]}
        for e in l["entries"]:
            if e["unit"] not in units: errs.append(f"list {l['id']}/{e['id']}: unknown unit {e['unit']}")
            if e.get("enh") and e["enh"] not in enh: errs.append(f"list {l['id']}/{e['id']}: unknown enhancement {e['enh']}")
            if e.get("leads") and e["leads"] not in ids: errs.append(f"list {l['id']}/{e['id']}: leads unknown entry {e['leads']}")
            if not isinstance(e.get("models"), int) or e["models"] < 1: errs.append(f"list {l['id']}/{e['id']}: models must be a positive integer")
    for uid in store["rules"]["thralls"].get("allow", []):
        if uid not in units: errs.append(f"rules.thralls.allow: unknown unit {uid}")
    for q in store["hobby"].get("queue", []):
        if q.get("inventory") not in (None, "*") and q["inventory"] not in {i["id"] for i in store["inventory"]}: errs.append(f"hobby.queue: unknown inventory {q['inventory']}")
        if q.get("order") and q["order"] not in orders: errs.append(f"hobby.queue: unknown order {q['order']}")
    snap = store["rules"]["snapshot"].get("verified", "")
    if DATE.match(snap):
        age = (datetime.date.today() - datetime.date.fromisoformat(snap)).days
        if age > 45: print(f"[muster] warning: rules snapshot verified {age} days ago ({snap}) — re-verify points in the app")
    return errs

def derived(store_path=STORE):
    """Run the shared JS linter under node; returns the derived dict, or None if node is missing."""
    node = shutil.which("node")
    if not node:
        print("[muster] warning: node not found — legality lint skipped (install node to run it)")
        return None
    out = subprocess.run([node, os.path.join(HERE, "tools", "lint_cli.js"), store_path], capture_output=True, text=True)
    if out.returncode:
        raise SystemExit("[muster] lint_cli failed:\n" + out.stderr)
    return json.loads(out.stdout)

def validate(store, d):
    """Integrity errors plus every linter error on a stored list. Lists marked "draft": true are
    reported but do not fail the gate — the store may hold a work in progress, never a silent illegal list."""
    errs = integrity(store)
    drafts = {l["id"] for l in store["lists"] if l.get("draft")}
    if d:
        for lid, r in d["lists"].items():
            lint = r["lint"]
            msgs = [f"list {lid}: {f['msg']}" for f in lint["flags"] if f["level"] == "error"]
            msgs += [f"list {lid}/{e['id']}: {f['msg']}" for e in lint["entries"] for f in e["flags"] if f["level"] == "error"]
            if lid in drafts:
                for m in msgs: print("[muster] draft " + m)
            else:
                errs += msgs
    return errs

# ---------- derived extras that only python needs ----------

JUNK_NOTE = re.compile(r"bits only|not a complete|built as skull cannon|\bauction, ends|^auction\b|current bid|only \d+ models|short of target|wrong model", re.I)
LORD_KIND = [(re.compile(r"terminator", re.I), "chaos_lord_terminator"), (re.compile(r"jump\s*pack|raptor", re.I), "chaos_lord_jump_pack"), (re.compile(r"juggernaut|bike|disc|daemonic mount", re.I), None)]

def gap_prices():
    """Landed-price snapshot per unit id from the last read-only scout run (never a live price).
    Excludes auctions (a bid is not a price), the scout's own flagged listings, and rows whose notes say
    they are not a complete kit. Prices keep their cents; callers round once, after summing."""
    try:
        d = load(SCOUT)
    except (OSError, ValueError):
        return {}
    keymap = {"cultists": "cultist_mob"}      # scout search keys → unit ids where they differ
    flagged = {f.get("id") for f in d.get("flagged", []) if isinstance(f, dict)}
    buckets = {}                              # unit id -> {"prices": [...], "seen": n}
    def unit_for(key, x):
        if key == "chaos_lord":               # that search returned foot, Terminator, jump and mounted lords together
            for pat, uid in LORD_KIND:
                if pat.search(str(x.get("t") or "")): return uid
            return "chaos_lord"
        return keymap.get(key, key)
    for key, items in d.items():
        if not isinstance(items, list) or not items or not isinstance(items[0], dict) or "landed" not in items[0]:
            continue
        for x in items:
            uid = unit_for(key, x)
            if uid is None: continue
            b = buckets.setdefault(uid, {"prices": [], "seen": 0}); b["seen"] += 1
            if str(x.get("type", "")).upper().startswith("AUC"): continue          # a bid is not a price
            if x.get("id") in flagged or JUNK_NOTE.search(str(x.get("note") or "")): continue
            try: b["prices"].append(round(float(str(x.get("landed")).replace("$", "").replace(",", "")), 2))
            except (TypeError, ValueError): pass
    out = {uid: {"n": len(b["prices"]), "of": b["seen"], "min": min(b["prices"]), "med": round(statistics.median(b["prices"]), 2), "max": max(b["prices"])}
           for uid, b in buckets.items() if b["prices"]}
    return {"date": d.get("scraped", "2026-07-27"), "units": out}

def best_value(unit, models):
    """Best points value of `models` models split into datasheet sizes (10 Legionaries → 2×5 = 180) — mirrors lint.js."""
    sizes = [s for s in unit["sizes"] if s.get("pts") is not None and s["models"] > 0]
    best = [0] * (models + 1)
    for m_ in range(1, models + 1):
        for s in sizes:
            if s["models"] <= m_: best[m_] = max(best[m_], best[m_ - s["models"]] + s["pts"])
    return best[models]

def gap_estimate(missing, prices, units):
    """Quantity-aware floor for a list's missing entries: each priced unit costs ceil(models / smallest
    datasheet size) × its cheapest usable listing (min) or its median. Returns (lo, mid, n_priced)."""
    lo = mid = 0.0; priced = 0
    for m_ in missing:
        p = prices.get(m_["unit"]); u = units.get(m_["unit"])
        if not p or not u: continue
        per = min(s["models"] for s in u["sizes"]) or 1
        boxes = -(-m_["models"] // per)
        lo += boxes * p["min"]; mid += boxes * p["med"]; priced += 1
    return lo, mid, priced

# ---------- generated regions ----------

def money(x, approx=False):
    s = f"${x:,.2f}" if round(x) != x else f"${x:,.0f}"
    return ("≈" if approx else "") + s

def fmt_date(iso):
    d = datetime.date.fromisoformat(iso); return d.strftime("%b ") + str(d.day)

def order_status(o):
    if o["status"] == "delivered": return f"Delivered {fmt_date(o['delivered'])}"
    eta = o.get("eta") or []
    if len(eta) == 2:
        a, b = eta; same = a[:7] == b[:7]
        span = f"ETA {fmt_date(a)}–{int(b[8:]) if same else fmt_date(b)}"
    else:
        span = "ETA unknown"
    lead = f"Shipped {fmt_date(o['shipped'])}" + (f" ({o['carrier']})" if o.get("carrier") else "") + ", " if o.get("shipped") else ""
    tail = f" ({o['eta_note']})" if o.get("eta_note") else ""
    return lead + span + tail

def region_ledger_md(store, d):
    rows = ["| Date | Tithe | Cost (landed) | State | Status |", "|---|---|---|---|---|"]
    for o in store["orders"]:
        cost = money(o["cost_usd"], o.get("approx")) + (f" ({o['cost_note']})" if o.get("cost_note") else "")
        rows.append(f"| {fmt_date(o['date'])} | {o['item']} | {cost} | {o['state']} | {order_status(o)} |")
    total = d["spent"] if d else sum(o["cost_usd"] for o in store["orders"])
    transit = [o for o in store["orders"] if o["status"] != "delivered"]
    rows += ["", f"**Total tithed: ≈ {money(round(total))}** across {len(store['orders'])} orders"
             + (f"; {len(transit)} still in transit ({', '.join(o['item'] for o in transit)})." if transit else ".")]
    return "\n".join(rows)

def region_ledger_html(store, d):
    esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;")
    rows = ["<table>", "    <thead><tr><th>Date</th><th>Tithe</th><th>Cost (landed)</th><th>State</th><th>Status</th></tr></thead>", "    <tbody>"]
    for o in store["orders"]:
        cost = money(o["cost_usd"], o.get("approx")) + (f" ({esc(o['cost_note'])})" if o.get("cost_note") else "")
        rows.append(f"    <tr><td>{fmt_date(o['date'])}</td><td>{esc(o['item'])}</td><td class=\"num\">{cost}</td><td>{esc(o['state'])}</td><td>{esc(order_status(o))}</td></tr>")
    total = d["spent"] if d else sum(o["cost_usd"] for o in store["orders"])
    transit = [o for o in store["orders"] if o["status"] != "delivered"]
    rows += ["    </tbody>", f"    <tfoot><tr><td colspan=\"2\">Total tithed</td><td colspan=\"3\">≈ {money(round(total))} · {len(store['orders'])} orders"
             + (f" · {len(transit)} still in transit ({esc(', '.join(o['item'] for o in transit))})" if transit else "") + "</td></tr></tfoot>", "  </table>"]
    return "\n".join(rows)

def region_inventory_md(store, d):
    units = {u["id"]: u for u in store["units"]}
    orders = {o["id"]: o for o in store["orders"]}
    rows = ["| Unit | Count | Pts (MFM v1.1) | Paint | From | Notes |", "|---|---|---|---|---|---|"]
    for i in store["inventory"]:
        u = units[i["unit"]]
        v = best_value(u, i["models"] or 0)
        exact = any(s["models"] == i["models"] for s in u["sizes"])
        smallest = min(u["sizes"], key=lambda s: s["models"])
        pts = (f"{v}" + ("" if exact or len(u["sizes"]) == 1 else " (best split)")) if v else ("—" if smallest.get("pts") is None else f"— ({smallest['pts']} per {smallest['models']})")
        o = orders.get(i.get("order"))
        frm = f"{fmt_date(o['date'])} · {o['item'].split(' (')[0]}" if o else ""
        count = f"≈{i['models']}" if i.get("approx") else str(i["models"])
        rows.append(f"| {u['name']} | {count} | {pts}{' *verify*' if u.get('verify') else ''} | {i['paint']} | {frm} | {i.get('note', '')} |")
    for o in store["orders"]:
        if o["status"] != "delivered":
            rows.append(f"| **{o['item']}** | ? | — | {o['state'].lower()} | {fmt_date(o['date'])} | {order_status(o)} — {o.get('expected', 'contents pending')} |")
    if d:
        approx_models = any(i.get("approx") for i in store["inventory"] if i["status"] == "owned")
        approx_transit = any(o.get("approx") for o in store["orders"] if o["status"] != "delivered")
        not_ready = [f"{units[x['unit']]['name']} {x['paint']}" for x in d.get("notReady", [])]
        rows += ["", f"Owned at MFM v1.1: **{d['fieldablePoints']:,} pts** — {d['readyPoints']:,} table-ready"
                 + (f" ({'; '.join(not_ready)})" if not_ready else "") + f" — across {d['records']} records ({'≈' if approx_models else ''}{d['modelsOwned']} models); "
                 f"spent ≈ {money(round(d['spent']))}, of which {money(round(d['inTransit']) if approx_transit else d['inTransit'], approx_transit)} is still in transit."]
    return "\n".join(rows)

STATUS_WORD = {"ready": "**Playable today**", "hobby": "Owned — hobby work first", "buy": "Needs purchases"}

def merge_gap(text):
    """'Bloodcrushers ×6, Bloodcrushers ×3' → 'Bloodcrushers ×9 (6+3)' for readability."""
    parts = [p.strip() for p in text.split(",")] if "×" in text else []
    agg, order = {}, []
    for p in parts:
        if "×" not in p: return text
        name, n = p.rsplit("×", 1)
        try: n = int(n)
        except ValueError: return text
        name = name.strip()
        if name not in agg: agg[name] = []; order.append(name)
        agg[name].append(n)
    return ", ".join(f"{name} ×{sum(ns)}" + (f" ({'+'.join(map(str, ns))})" if len(ns) > 1 else "") for name, ns in ((k, agg[k]) for k in order)) or text

def region_lists_md(store, d):
    if not d: return "*(list status needs node — run `python3 muster.py build` where node is installed)*"
    units = {u["id"]: u for u in store["units"]}
    prices = gap_prices().get("units", {})
    rows = ["| List | Idea | Total | Legal | Status | Gap |", "|---|---|---|---|---|---|"]
    for l in store["lists"]:
        r = d["lists"][l["id"]]; lint, cov = r["lint"], r["coverage"]
        gap = ", ".join(f"{units[m['unit']]['name']} ×{m['models']}" for m in cov["missing"]) or ("; ".join(f"{units[h['unit']]['name']}: {h['paint']}" for h in cov["hobby"]) or "—")
        lo, mid, priced = gap_estimate(cov["missing"], prices, units)
        partial = " for the priced part" if priced < len(cov["missing"]) else ""
        verify = [f["msg"] for f in lint["flags"] if f["level"] == "warn"] + [f"{f['msg']}" for e in lint["entries"] for f in e["flags"] if f["level"] == "warn"]
        seen_v = []; [seen_v.append(x) for x in verify if x not in seen_v]
        short = [re.split(r"[—:(]", x)[0].strip() for x in seen_v]
        legal = ("yes" if lint["legal"] else f"**no** — {'; '.join(f['msg'] for f in lint['flags'] if f['level'] == 'error')}") + (f" ({len(seen_v)} to verify in the app: {'; '.join(short)})" if seen_v else "")
        rows.append(f"| **{l['id']} · {l['name']}** | {l['idea']} | {lint['total']:,} | {legal} | {STATUS_WORD[cov['status']]} | {merge_gap(gap)}{f' (from ≈${round(lo):,}{partial}, Jul 27 BIN prices, auctions and part-kits excluded)' if priced else ''} |")
    return "\n".join(rows)

def region_context_md(store, d):
    inbound = [o for o in store["orders"] if o["status"] != "delivered"]
    lines = [f"- **Store:** `data/muster.json` (schema {store['meta']['schema']}, updated {store['meta']['updated']}); points {store['rules']['snapshot']['points']}, rules verified {store['rules']['snapshot']['verified']}. {store['rules']['snapshot']['recheck']}",
             f"- **Owned:** {len([i for i in store['inventory'] if i['status']=='owned'])} inventory records"
             + (f", {'≈' if any(i.get('approx') for i in store['inventory']) else ''}{d['modelsOwned']} models, {d['fieldablePoints']:,} pts at MFM v1.1 ({d['readyPoints']:,} table-ready)" if d else "") + f"; spent ≈ {money(round(sum(o['cost_usd'] for o in store['orders'])))} over {len(store['orders'])} orders.",
             f"- **Inbound:** " + ("; ".join(f"{o['item']} — {order_status(o)}" for o in inbound) or "nothing") + "."]
    if d:
        by = {k: [] for k in STATUS_WORD}
        for l in store["lists"]:
            by[d["lists"][l["id"]]["coverage"]["status"]].append(f"{l['id']} ({d['lists'][l['id']]['lint']['total']:,}{'' if d['lists'][l['id']]['lint']['legal'] else ', not legal as stored'})")
        lines.append(f"- **Lists:** playable today: {', '.join(by['ready']) or '—'}; hobby work first: {', '.join(by['hobby']) or '—'}; need purchases: {', '.join(by['buy']) or '—'}.")
    lines.append(f"- **Games logged:** {len(store['games']['log'])} (rule: {store['games']['rule']['threshold']} before the next model, counting {store['games']['rule']['counts_from']}).")
    return "\n".join(lines)

REGIONS = {   # file → {region name → renderer}
    "codex-umbral-creed.md": {"ledger": region_ledger_md},
    "codex-umbral-creed.html": {"ledger": region_ledger_html},
    "quartermaster.md": {"inventory": region_inventory_md, "lists": region_lists_md},
    os.path.join("docs", "CONTEXT.md"): {"state": region_context_md},
}

def apply_regions(store, d, check_only=False):
    """Rewrite (or verify) every <!--gen:NAME--> region. Returns list of drifted 'file:region' names."""
    drift = []
    for rel, regions in REGIONS.items():
        path = os.path.join(HERE, rel)
        try:
            src = open(path, encoding="utf-8").read()
        except OSError:
            drift.append(f"{rel} (missing)"); continue
        out = src
        for name, fn in regions.items():
            pat = re.compile(r"(<!--gen:%s-->\n?)(.*?)(\n?<!--/gen:%s-->)" % (re.escape(name), re.escape(name)), re.S)
            m = pat.search(out)
            if not m:
                drift.append(f"{rel}:{name} (markers missing)"); continue
            body = fn(store, d)
            new = f"<!--gen:{name}-->\n{body}\n<!--/gen:{name}-->"
            if m.group(0) != new:
                if check_only: drift.append(f"{rel}:{name}")
                out = out[:m.start()] + new + out[m.end():]
        if not check_only:
            write_if_changed(path, out)
    return drift

# ---------- muster.js ----------

def emit_js(store, d):
    payload = {"store": store, "gapPrices": gap_prices(), "generated": datetime.date.today().isoformat()}
    text = "window.MUSTER = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    write_if_changed(OUT_JS, text)

# ---------- cli ----------

def build(check=False):
    store = load()
    d = derived()
    errs = validate(store, d)
    if errs:
        print("[muster] STORE INVALID:"); [print("  - " + e) for e in errs]
        raise SystemExit(1)
    if check:
        drift = apply_regions(store, d, check_only=True)
        try:
            js_ok = open(OUT_JS, encoding="utf-8").read().startswith("window.MUSTER = ")
        except OSError:
            js_ok = False
        if drift or not js_ok:
            print("[muster] OUT OF SYNC — run `python3 muster.py build`:"); [print("  - " + x) for x in drift + ([] if js_ok else ["muster.js missing"])]
            raise SystemExit(1)
        print(f"[muster] check ok — {len(store['units'])} units · {len(store['inventory'])} records · {len(store['orders'])} orders · {len(store['lists'])} lists")
        return store, d
    emit_js(store, d)
    apply_regions(store, d)
    print(f"[muster] ok — {len(store['units'])} units · {len(store['inventory'])} records · {len(store['orders'])} orders · {len(store['lists'])} lists"
          + (f" · fieldable {d['fieldablePoints']:,} pts · spent ${d['spent']:,.2f}" if d else ""))
    return store, d

def main(argv):
    cmd = argv[1] if len(argv) > 1 else "build"
    if cmd == "fmt":
        write_if_changed(STORE, dumps(load())); return
    if cmd == "validate":
        store = load(); errs = validate(store, derived())
        if errs:
            print("[muster] STORE INVALID:"); [print("  - " + e) for e in errs]; raise SystemExit(1)
        print("[muster] store valid"); return
    if cmd in ("build", "check"):
        build(check=(cmd == "check")); return
    raise SystemExit(__doc__)

if __name__ == "__main__":
    main(sys.argv)
