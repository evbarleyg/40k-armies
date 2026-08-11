/* Muster — list linter, coverage and store derivations.
   One implementation of the legality rules, shared by the app (browser global `MusterLint`)
   and by muster.py (through tools/lint_cli.js under node). Every rule reads its facts from
   store.rules / store.units, so a rules change is a data edit. */
(function (root) {
  'use strict';

  const NOT_READY_PAINT = new Set(['unassembled', 'assembled', 'primed', 'damaged']);
  const CAP_BY_LIMIT = { 1000: 'incursion', 2000: 'strike_force', 3000: 'onslaught' };

  function index(store) {
    const units = new Map(store.units.map(u => [u.id, u]));
    const enh = new Map((store.rules.enhancements || []).map(e => [e.id, e]));
    return { units, enh };
  }

  // Points for `models` of `unit`: exact datasheet size, or the smallest size that holds them.
  function sizeFor(unit, models) {
    const sizes = (unit.sizes || []).slice().sort((a, b) => a.models - b.models);
    return sizes.find(s => s.models === models) || sizes.find(s => s.models >= models) || null;
  }

  function flag(level, code, msg, extra) { return Object.assign({ level, code, msg }, extra || {}); }

  function lintList(store, list, ix) {
    ix = ix || index(store);
    const R = store.rules, flags = [], entries = [];
    const byId = new Map();
    const perUnit = new Map();           // unit id -> count of entries (rule of three, third-copy surcharge)
    let total = 0, ha = 0, haEnh = 0, warDogs = 0;
    const usedEnh = new Map();

    for (const e of list.entries) {
      const u = ix.units.get(e.unit);
      const out = { entry: e, unit: u, pts: 0, flags: [] };
      entries.push(out); byId.set(e.id, out);
      if (!u) { out.flags.push(flag('error', 'unknown-unit', `"${e.unit}" is not in the unit catalog.`)); continue; }
      const n = (perUnit.get(u.id) || 0) + 1; perUnit.set(u.id, n);
      const s = sizeFor(u, e.models);
      if (!s) out.flags.push(flag('error', 'size', `${u.name}: ${e.models} models is more than any datasheet size.`));
      else {
        if (s.models !== e.models) out.flags.push(flag('warn', 'size-bracket', `${u.name}: ${e.models} models pays for the ${s.models}-model bracket.`));
        if (s.pts == null) out.flags.push(flag('error', 'no-points', `${u.name}: no points recorded for ${s.models} models — check the app and edit the store.`));
        let pts = s.pts || 0;
        if (n >= 3 && s.pts_third != null) { pts = s.pts_third; out.flags.push(flag('info', 'third-copy', `${u.name}: third copy costs ${s.pts_third} (MFM surcharge).`)); }
        out.pts = pts;
      }
      if (e.enh) {
        const en = ix.enh.get(e.enh);
        if (!en) out.flags.push(flag('error', 'unknown-enh', `Enhancement "${e.enh}" is not in the store.`));
        else {
          out.pts += en.pts || 0; out.enh = en;
          usedEnh.set(en.id, (usedEnh.get(en.id) || 0) + 1);
          const kw = new Set(u.keywords || []);
          if (!kw.has('CHARACTER')) out.flags.push(flag('error', 'enh-target', `${en.name} needs a CHARACTER; ${u.name} is not one.`, { rule: R.enhancement_rules }));
          if (kw.has('EPIC HERO') || u.role === 'epic_hero') out.flags.push(flag('error', 'enh-epic', `${u.name} is an Epic Hero and can never take an enhancement.`, { rule: R.enhancement_rules }));
          if (u.legality === 'ally') out.flags.push(flag('error', 'enh-ally', `${u.name} rides along under Dreadblades: no enhancements, never the Warlord.`, { rule: R.allies && R.allies.dreadblades }));
          if (en.verify) out.flags.push(flag('warn', 'enh-verify', `${en.name}: text not on file — read it in the app before relying on it.`));
        }
      }
      if (u.verify) out.flags.push(flag('warn', 'verify', `${u.name}: ${u.note || 'points or pairing unverified — check the app.'}`));
      if (u.legality === 'banned') out.flags.push(flag('error', 'banned', `${u.name} is illegal in ${R.detachment.name}: ${u.note || 'Epic Hero'}`, { rule: R.bans }));
      else if (u.role === 'epic_hero' && !(R.bans.epic_heroes_except || []).includes(u.id)) out.flags.push(flag('error', 'epic-hero', `${u.name} is an Epic Hero; only Be'lakor is exempt in ${R.detachment.name}.`, { rule: R.bans }));
      if (u.faction === 'HA') {
        if (!(R.thralls.allow || []).includes(u.id)) out.flags.push(flag('error', 'not-thrall', `${u.name} is not on the ${R.thralls.name} allowlist.`, { rule: R.thralls }));
        ha += out.pts; haEnh += out.enh ? (out.enh.pts || 0) : 0;
      }
      if (u.faction === 'CK') {
        if (u.legality !== 'ally') out.flags.push(flag('error', 'ck', `${u.name}: only War Dogs may join, under Dreadblades.`));
        warDogs += e.models;
        if (e.warlord) out.flags.push(flag('error', 'ally-warlord', `A Dreadblade can never be the Warlord.`, { rule: R.allies.dreadblades }));
      }
      if (/daemon_prince/.test(u.id)) out.flags.push(flag('error', 'daemon-prince', `Daemon Princes are excluded by ${R.thralls.name}.`, { rule: R.thralls }));
      total += out.pts;
    }

    // leaders
    for (const out of entries) {
      const e = out.entry, u = out.unit;
      if (!e.leads || !u) continue;
      const tgt = byId.get(e.leads);
      if (!tgt || !tgt.unit) { out.flags.push(flag('error', 'leads-missing', `${u.name} is set to lead entry "${e.leads}", which is not in this list.`)); continue; }
      if (!(u.leads || []).includes(tgt.unit.id)) out.flags.push(flag('error', 'leader-pair', `${u.name} cannot lead ${tgt.unit.name} (allowed: ${(u.leads || []).map(id => (ix.units.get(id) || {}).name || id).join(', ') || 'nothing'}).`));
      if (e.models !== 1) out.flags.push(flag('error', 'leader-models', `${u.name} leads as a single model.`));
      tgt.leaders = (tgt.leaders || 0) + 1;
      if (tgt.leaders > 1) tgt.flags.push(flag('warn', 'two-leaders', `${tgt.unit.name} has more than one leader attached — only some datasheets allow that; check.`));
    }

    // list-level rules
    const limit = list.limit || R.battle_size.points;
    if (total > limit) flags.push(flag('error', 'over', `${total} pts is ${total - limit} over the ${limit} limit.`));
    const capKey = CAP_BY_LIMIT[limit] || 'strike_force', cap = (R.thralls.cap || {})[capKey];
    if (cap != null && ha - haEnh > cap) flags.push(flag('error', 'thrall-cap', `Heretic Astartes units total ${ha - haEnh} pts — over the ${R.thralls.name} cap of ${cap}.`, { rule: R.thralls }));
    else if (cap != null && ha > cap) flags.push(flag('warn', 'thrall-cap-enh', `Heretic Astartes total is ${ha} with enhancements (${ha - haEnh} without) against a ${cap} cap — legal only if enhancement points do not count toward "${R.thralls.name}"; verify before an event.`, { rule: R.thralls }));
    const maxDogs = R.allies && R.allies.dreadblades ? R.allies.dreadblades.max_war_dog_models : 3;
    if (warDogs > maxDogs) flags.push(flag('error', 'war-dogs', `${warDogs} War Dog models — Dreadblades allows at most ${maxDogs}.`, { rule: R.allies.dreadblades }));
    for (const [id, n] of usedEnh) if (n > 1) flags.push(flag('error', 'enh-twice', `${ix.enh.get(id).name} is taken ${n} times; each enhancement once per army.`, { rule: R.enhancement_rules }));
    const hasBelakor = entries.some(o => o.unit && o.unit.id === (R.warlord.unit || 'belakor'));
    const warlords = entries.filter(o => o.entry.warlord);
    if (hasBelakor) {
      if (!warlords.length || warlords.some(o => o.unit && o.unit.id !== R.warlord.unit)) flags.push(flag('error', 'warlord', R.warlord.rule, { rule: R.warlord }));
    } else if (!warlords.length) flags.push(flag('warn', 'no-warlord', `No Warlord marked.`));
    if (warlords.length > 1) flags.push(flag('error', 'warlords', `Only one Warlord.`));
    const r3 = R.battle_size.rule_of_three || { max_per_datasheet: 3, battleline_or_transport: 6 };
    for (const [id, n] of perUnit) {
      const u = ix.units.get(id); if (!u) continue;
      const max = u.role === 'battleline' ? r3.battleline_or_transport : r3.max_per_datasheet;
      if (n > max) flags.push(flag('error', 'rule-of-three', `${u.name} appears ${n} times; the limit is ${max}.`));
    }

    const all = flags.concat(...entries.map(o => o.flags));
    return {
      id: list.id, total, limit, ha, haCap: cap, warDogs, entries, flags,
      errors: all.filter(f => f.level === 'error').length,
      warnings: all.filter(f => f.level === 'warn').length,
      legal: !all.some(f => f.level === 'error')
    };
  }

  // Which owned models cover a list, greedily per unit; what is missing; what is owned but not table-ready.
  function coverage(store, list, ix) {
    ix = ix || index(store);
    const pool = new Map();            // unit id -> [{inv, left}]
    for (const inv of store.inventory) {
      if (inv.status !== 'owned') continue;
      if (!pool.has(inv.unit)) pool.set(inv.unit, []);
      pool.get(inv.unit).push({ inv, left: inv.models || 0 });
    }
    const rows = [], missing = [], hobby = [];
    for (const e of list.entries) {
      let need = e.models; const from = [];
      for (const p of pool.get(e.unit) || []) {
        if (!need) break;
        const take = Math.min(p.left, need);
        if (take > 0) { p.left -= take; need -= take; from.push({ id: p.inv.id, models: take, paint: p.inv.paint }); if (NOT_READY_PAINT.has(p.inv.paint)) hobby.push({ entry: e.id, inv: p.inv.id, paint: p.inv.paint, unit: e.unit }); }
      }
      rows.push({ entry: e.id, unit: e.unit, need: e.models, short: need, from });
      if (need > 0) missing.push({ unit: e.unit, models: need, entry: e.id });
    }
    const status = missing.length ? 'buy' : hobby.length ? 'hobby' : 'ready';
    return { rows, missing, hobby, status };
  }

  function money(orders, pred) { return Math.round(orders.filter(pred).reduce((s, o) => s + (Number(o.cost_usd) || 0), 0) * 100) / 100; }

  // Store-wide numbers every view shares (never typed anywhere by hand).
  function derive(store) {
    const ix = index(store);
    let fieldable = 0; const unfieldable = [];
    for (const inv of store.inventory) {
      if (inv.status !== 'owned') continue;
      const u = ix.units.get(inv.unit); if (!u) continue;
      // value a record at the largest combination of datasheet sizes it can fill
      let left = inv.models || 0, pts = 0;
      const sizes = (u.sizes || []).filter(s => s.pts != null).sort((a, b) => b.models - a.models);
      for (const s of sizes) while (left >= s.models && s.models > 0) { pts += s.pts; left -= s.models; }
      if (!pts) unfieldable.push({ inv: inv.id, unit: u.id, models: inv.models, why: sizes.length ? `fewer than ${sizes[sizes.length - 1].models}` : 'no points on file' });
      fieldable += pts;
    }
    const lists = {};
    for (const l of store.lists) lists[l.id] = { lint: lintList(store, l, ix), coverage: coverage(store, l, ix) };
    const orders = store.orders || [];
    return {
      fieldablePoints: fieldable, unfieldable,
      spent: money(orders, () => true),
      inTransit: money(orders, o => o.status !== 'delivered'),
      inbound: orders.filter(o => o.status !== 'delivered'),
      records: store.inventory.length,
      modelsOwned: store.inventory.filter(i => i.status === 'owned').reduce((s, i) => s + (i.models || 0), 0),
      games: (store.games.log || []).length,
      lists
    };
  }

  root.MusterLint = { index, sizeFor, lintList, coverage, derive, NOT_READY_PAINT };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MusterLint;
})(typeof window !== 'undefined' ? window : globalThis);
