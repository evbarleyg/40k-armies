/* Muster — the console. Vanilla, classic script, opens from file:// or any static host.
   Reads window.MUSTER (store + price snapshot, from muster.py), window.SCORECARDS (market feed, from build.py)
   and window.MusterLint (the shared linter). Local edits live in a localStorage overlay until exported;
   when the repo store changes underneath them they are replayed onto it, never dropped. */
(function () {
  'use strict';
  const L = window.MusterLint, SHIPPED = window.MUSTER;
  if (!L || !SHIPPED) { document.getElementById('view').innerHTML = '<p>muster.js or lint.js failed to load — run <code>python3 build.py</code>.</p>'; return; }

  // ---------- small utilities ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ebay = u => /^https:\/\/www\.ebay\.com\//.test(String(u)) ? esc(u) : '#';
  const clone = o => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pts = n => Number(n || 0).toLocaleString('en-US');
  const dot = (...parts) => parts.flat().filter(p => p != null && String(p).trim() !== '').join(' · ');
  const sentence = s => String(s || '').trim().replace(/[.\s]+$/, '');
  // money: exact amounts keep cents; approximate ones never show cents; ranges say ≈ once
  const usd = (n, approx) => { n = Number(n) || 0; const whole = approx || Math.round(n) === n; return (approx ? '≈' : '') + '$' + (whole ? Math.round(n).toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
  const range = (a, b, plus) => `≈$${Math.round(a).toLocaleString('en-US')}${Math.round(b) > Math.round(a) ? '–' + Math.round(b).toLocaleString('en-US') : ''}${plus ? '+' : ''}`;
  const nb = s => String(s).replace(/ /g, ' ');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dshort = iso => iso ? nb(`${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`) : '';
  const drange = eta => !eta || eta.length !== 2 ? 'no window' : (eta[0].slice(0, 7) === eta[1].slice(0, 7) ? `${dshort(eta[0])}–${+eta[1].slice(8)}` : `${dshort(eta[0])}–${dshort(eta[1])}`);
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const TODAY = todayISO();
  const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + 's')}`;
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('Could not save on this device (storage blocked)'); return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* nothing stored */ } }
  };
  function toast(msg) {
    let t = $('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  async function copyText(text, what) {
    try { if (!navigator.clipboard) throw new Error('no clipboard'); await navigator.clipboard.writeText(text); toast(`${what || 'Text'} copied`); }
    catch (e) { const w = $('#copyfallback'); w.hidden = false; const ta = $('textarea', w); ta.value = text; ta.focus(); ta.select(); $('.what', w).textContent = `${what || 'Text'} — the clipboard is blocked here, so select all and copy:`; }
  }
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- patches: the one mutation path (used by commit and by replay after a rebuild) ----------
  function applyPatch(s, p) {
    if (p.op === 'inventory.update') { const i = s.inventory.find(x => x.id === p.id); if (!i) return false; Object.assign(i, p.set); return true; }
    if (p.op === 'games.add') { s.games.log = s.games.log || []; s.games.log.push(clone(p.value)); return true; }
    if (p.op === 'games.remove') { const log = s.games.log || []; const n = log.findIndex(g => same(g, p.value)); if (n < 0) return false; log.splice(n, 1); return true; }
    if (p.op === 'crate.catalogue') {
      const o = s.orders.find(x => x.id === p.order); if (!o) return false;
      o.status = 'delivered'; o.delivered = p.delivered; o.contents = 'catalogued'; if (p.note) o.note = o.note ? `${o.note} · ${p.note}` : p.note;
      for (const r of p.inventory) if (!s.inventory.some(x => x.id === r.id)) s.inventory.push(clone(r));
      return true;
    }
    return false;
  }
  function isApplied(s, p) {
    if (p.op === 'inventory.update') { const i = s.inventory.find(x => x.id === p.id); return !!i && Object.keys(p.set).every(k => same(i[k], p.set[k])); }
    if (p.op === 'games.add') return (s.games.log || []).some(g => same(g, p.value));
    if (p.op === 'games.remove') return !(s.games.log || []).some(g => same(g, p.value));
    if (p.op === 'crate.catalogue') { const o = s.orders.find(x => x.id === p.order); return !!o && o.status === 'delivered' && p.inventory.every(r => s.inventory.some(x => x.id === r.id)); }
    return false;
  }

  // ---------- store + local overlay ----------
  function sig(store) { const s = JSON.stringify(store); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return `${store.meta.updated}:${s.length}:${h}`; }
  const BASE_SIG = sig(SHIPPED.store);
  let local = LS.get('muster.local', null), STORE, BOOT_NOTE = null;
  if (local && local.baseSig === BASE_SIG && local.store) STORE = local.store;
  else if (local && (local.changes || []).length) {
    // the repo store changed underneath local edits: keep what it already contains, replay the rest, park what cannot replay
    STORE = clone(SHIPPED.store);
    const done = [], replayed = [], parked = [];
    for (const c of local.changes) { if (isApplied(STORE, c.patch)) done.push(c); else if (applyPatch(STORE, c.patch)) replayed.push(c); else parked.push(c); }
    if (parked.length) { const prev = LS.get('muster.stale', { changes: [] }); LS.set('muster.stale', { at: new Date().toISOString(), changes: prev.changes.concat(parked) }); }
    local = replayed.length ? { baseSig: BASE_SIG, store: STORE, changes: replayed } : null;
    if (local) LS.set('muster.local', local); else LS.del('muster.local');
    BOOT_NOTE = { done: done.length, replayed: replayed.length, parked: parked.length };
  } else { local = null; LS.del('muster.local'); STORE = clone(SHIPPED.store); }
  let STALE = LS.get('muster.stale', null); if (STALE && !(STALE.changes || []).length) STALE = null;
  let D = L.derive(STORE);
  const PRICES = (SHIPPED.gapPrices && SHIPPED.gapPrices.units) || {}, PRICE_DATE = (SHIPPED.gapPrices && SHIPPED.gapPrices.date) || '';

  function commit(text, patch, then) {
    if (!applyPatch(STORE, patch)) { toast('That change no longer applies to the current data'); return; }
    if (!local) local = { baseSig: BASE_SIG, store: STORE, changes: [] };
    local.store = STORE; local.changes.push({ at: new Date().toISOString(), text, patch });
    LS.set('muster.local', local);
    D = L.derive(STORE);
    toast(`Saved on this device · ${plural(local.changes.length, 'change')} to export`);
    if (then) then(); else render(true);
  }
  const unitById = id => STORE.units.find(u => u.id === id);
  const orderById = id => STORE.orders.find(o => o.id === id);
  const deviceLists = () => LS.get('muster.lists', []);
  const listById = id => STORE.lists.find(l => l.id === id) || deviceLists().find(l => l.id === id);
  const uname = id => (unitById(id) || { name: id }).name;
  const shortItem = o => o.item.split(' (')[0];
  const PSHORT = STORE.meta.points_snapshot.replace(/\s*\(.*?\)/, '');

  // ---------- derived helpers ----------
  function etaState(o) {
    if (o.status === 'delivered') return { cls: 'y', text: `delivered ${dshort(o.delivered)}` };
    const e = o.eta;
    if (!e || e.length !== 2) return { cls: 'h', text: 'no delivery window on file' };
    if (TODAY < e[0]) return { cls: '', text: `window ${drange(e)} · opens in ${plural(daysBetween(TODAY, e[0]), 'day')}` };
    if (TODAY <= e[1]) return { cls: 'h', text: `window ${drange(e)} · today is inside it — may already be here` };
    return { cls: 'n', text: `window ${drange(e)} closed ${plural(daysBetween(e[1], TODAY), 'day')} ago — check tracking` };
  }
  function listStatus(l) {
    const r = D.lists[l.id] || { lint: L.lintList(STORE, l), coverage: L.coverage(STORE, l) };
    const owned = !r.coverage.missing.length, ready = owned && !r.coverage.hobby.length;
    return { lint: r.lint, cov: r.coverage, legal: r.lint.legal, owned, ready, status: r.coverage.status, verify: r.lint.warnings };
  }
  // quantity-aware price floor: ceil(models / smallest datasheet size) boxes × cheapest usable listing (or median)
  function unitCost(unitId, models) {
    const p = PRICES[unitId], u = unitById(unitId); if (!p || !u) return null;
    const per = Math.min(...u.sizes.map(s => s.models)) || 1, boxes = Math.ceil(models / per);
    return { lo: boxes * p.min, mid: boxes * p.med, boxes, n: p.n, of: p.of };
  }
  function gapCost(missing) {
    let lo = 0, mid = 0, priced = 0;
    for (const m of missing) { const c = unitCost(m.unit, m.models); if (c) { lo += c.lo; mid += c.mid; priced++; } }
    return { lo, mid, priced, partial: priced < missing.length, none: !priced };
  }
  // "Bloodcrushers ×9 (6+3)" · "1 more Bloodletter (9 of 10 owned)"
  function gapWords(missing, max) {
    const g = new Map();
    for (const m of missing) { const x = g.get(m.unit) || { unit: m.unit, parts: [], have: 0 }; x.parts.push(m.models); if (m.have) x.have += m.have; g.set(m.unit, x); }
    let items = [...g.values()].map(x => { const n = x.parts.reduce((a, b) => a + b, 0); const u = unitById(x.unit); const smallest = u ? Math.min(...u.sizes.map(s => s.models)) : 0;
      if (x.have && n < smallest) return `${uname(x.unit)}: ${plural(n, 'more model')} (${x.have} of ${x.have + n} owned)`;
      return `${uname(x.unit)} ×${n}${x.parts.length > 1 ? ` (${x.parts.join('+')})` : ''}`; });
    const more = max && items.length > max ? items.length - max : 0;
    if (more) items = items.slice(0, max);
    return items.join(', ') + (more ? ` + ${more} more` : '');
  }
  function ticks(s) {
    const t = (ok, half) => ok ? '<span class="y">✓</span>' : half ? '<span class="h">◐</span>' : '<span class="n">✗</span>';
    return `<span class="ticks" title="rules check passed · every model owned · everything built and painted">${t(s.legal)} legal ${t(s.owned)} owned ${t(s.ready, s.owned)} painted</span>`;
  }
  function unitUse() { const m = {}; for (const l of STORE.lists) for (const e of l.entries) (m[e.unit] = m[e.unit] || new Set()).add(l.id); return m; }
  function alerts() {
    const out = [], R = STORE.rules.snapshot;
    const age = daysBetween(R.verified, TODAY);
    if (age > 45) out.push({ lvl: 'err', text: `<b>Points snapshot is ${age} days old</b> (verified ${dshort(R.verified)}). Re-verify in the official app before trusting any total.` });
    if (BOOT_NOTE) out.push({ lvl: BOOT_NOTE.parked ? 'err' : 'ok', text: `<b>The repo data changed since your last visit.</b> ${BOOT_NOTE.done ? (BOOT_NOTE.done === 1 ? 'Your local change is in it now — nothing left to export. ' : `${BOOT_NOTE.done} of your local changes are in it now. `) : ''}${BOOT_NOTE.replayed ? `${plural(BOOT_NOTE.replayed, 'change')} not yet in it ${BOOT_NOTE.replayed === 1 ? 'was' : 'were'} re-applied on top and still ${BOOT_NOTE.replayed === 1 ? 'needs' : 'need'} exporting. ` : ''}${BOOT_NOTE.parked ? `${plural(BOOT_NOTE.parked, 'change')} could not be re-applied and ${BOOT_NOTE.parked === 1 ? 'is' : 'are'} parked in <a href="#/more">More</a> to copy or discard.` : ''}` });
    else if (STALE) out.push({ lvl: 'err', text: `<b>${plural(STALE.changes.length, 'parked change')}</b> from an older data version could not be re-applied. <a href="#/more">Copy or discard them in More →</a>` });
    for (const l of STORE.lists) { const s = listStatus(l); if (!s.legal) out.push({ lvl: 'err', text: `<b>List ${esc(l.id)} does not pass the rules check as stored:</b> ${esc(s.lint.flags.filter(f => f.level === 'error').map(f => f.msg).join('; ') || 'see its rules check')} <a href="#/lists/${esc(l.id)}">open →</a>` }); }
    for (const o of D.inbound) { const s = etaState(o); if (s.cls === 'n') out.push({ lvl: 'err', text: `<b>${esc(o.item)}</b> — ${esc(s.text)}. <a href="#/crates/${esc(o.id)}">Open the crate →</a>` }); }
    if (R.recheck) out.push({ text: `<b>Points re-check:</b> ${esc(R.recheck)}` });
    for (const c of (STORE.buying.closed_paths || [])) if (daysBetween(c.date, TODAY) <= 14) out.push({ text: `<b>${dshort(c.date)}:</b> ${esc(c.what)}` });
    return out;
  }

  // ---------- market feed ----------
  const FEED = (() => {
    const S = window.SCORECARDS || {}, byId = new Map();
    for (const stem of ['listings', 'chaos']) for (const x of ((S[stem] || {}).listings || [])) { const prev = byId.get(x.itemId); byId.set(x.itemId, Object.assign({}, prev || {}, x)); }
    return { rows: [...byId.values()], meta: (S.listings || S.chaos || {}).meta || null };
  })();
  const UNIT_WORDS = { skullmaster: /skullmaster/i, rendmaster: /rendmaster|blood\s*throne/i, bloodcrushers: /bloodcrusher|juggernaut/i, bloodletters: /bloodletter/i, flesh_hounds: /flesh\s*hound/i, warp_talons: /warp\s*talon/i, chosen: /\bchosen\b/i, chaos_terminators: /chaos\s+terminator|terminator\s+squad|\bterminators\b/i, chaos_lord_terminator: /lord\s+in\s+terminator|terminator\s+lord/i, beasts_of_nurgle: /beasts?\s+of\s+nurgle/i, plague_drones: /plague\s*drone/i, cultist_mob: /\bcultists?\b(?!\))/i, nurglings: /nurgling/i, seekers: /\bseekers?\b/i, raptors: /\braptors?\b/i, bloodthirster: /bloodthirster/i, chaos_lord: /chaos\s+lord/i };
  const NEG = /\b(no|without|minus)\s+(cultists?|terminators?|bloodletters?)/i;
  const DNB = [{ re: /skulltaker/i, why: "Skulltaker is an Epic Hero — illegal in Shadow Legion." }, { re: /karanak/i, why: "Karanak is an Epic Hero — illegal in Shadow Legion." }, { re: /skarbrand|kairos|rotigus|shalaxi|the masque|epidemius|changeling|blue scribes|syll'?esske/i, why: "Named daemon (Epic Hero) — dead points in this detachment; only Be'lakor is exempt." }];
  function allGaps() {
    const g = {};
    for (const l of STORE.lists) { const s = listStatus(l); const per = {}; for (const m of s.cov.missing) per[m.unit] = (per[m.unit] || 0) + m.models;
      for (const [u, n] of Object.entries(per)) { (g[u] = g[u] || { unit: u, models: 0, lists: {} }); g[u].lists[l.id] = n; g[u].models = Math.max(g[u].models, n); } }
    const expected = new Set(D.inbound.flatMap(o => o.expected_units || []));
    for (const x of Object.values(g)) x.inbound = expected.has(x.unit);
    return Object.values(g).sort((a, b) => (a.inbound - b.inbound) || Object.keys(b.lists).length - Object.keys(a.lists).length || uname(a.unit).localeCompare(uname(b.unit)));
  }
  function annotate(x, gaps) {
    const neg = NEG.test(x.name);
    const hits = gaps.filter(g => UNIT_WORDS[g.unit] && UNIT_WORDS[g.unit].test(x.name) && !(neg && /cultist|terminator|bloodletter/.test(g.unit)));
    // a whole army for a fifty-dollar gap is a mention, not a recommendation
    const worth = hits.filter(h => { const c = unitCost(h.unit, h.models); return !c || (x.landedUSD || 0) <= 3 * c.mid; });
    const dnb = DNB.filter(d => d.re.test(x.name));
    return { hits, worth, overkill: hits.filter(h => !worth.includes(h)), dnb, auction: /auc/i.test(x.type || '') || x.verdict === 'AUCTION', printed: /3d print|printed|proxy|recast/i.test(`${x.name} ${x.notes || ''}`) };
  }

  // ---------- rendering ----------
  const NAV_PHONE = [['home', 'Home', '#/'], ['collection', 'Collection', '#/collection'], ['lists', 'Lists', '#/lists'], ['buy', 'Buy', '#/buy'], ['crates', 'Crates', '#/crates'], ['more', 'More', '#/more']];
  const NAV_WIDE = [['home', 'Home', '#/'], ['collection', 'Collection', '#/collection'], ['lists', 'Lists', '#/lists'], ['build', 'Build', '#/build'], ['buy', 'Buy', '#/buy'], ['crates', 'Crates', '#/crates'], ['orders', 'Orders', '#/orders'], ['hobby', 'Hobby', '#/hobby'], ['games', 'Games', '#/games'], ['library', 'Library', '#/library'], ['more', 'More', '#/more']];
  const PHONE_KEY = { build: 'lists', orders: 'more', hobby: 'more', games: 'more', library: 'more', glossary: 'more' };
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  let lastPath = null, lastOpen = null;
  function focusKey() { const a = document.activeElement; if (!a || a === document.body) return null; if (a.dataset && a.dataset.fkey) return a.dataset.fkey; if (a.matches('tr[data-id]')) return 'row:' + a.dataset.id; return null; }
  function render(keepScroll) {
    const fk = focusKey();
    const { parts, q } = route(); const known = !!VIEWS[parts[0]] || !parts[0]; const v = known ? (parts[0] || 'home') : 'home';
    if (!known) toast(`No view called “${parts[0]}” — showing Home`);
    const hobbyDot = Object.values(D.lists).some(r => r.coverage.hobby.length);
    const badge = k => k === 'crates' ? (D.inbound.length ? { text: D.inbound.length, title: `${plural(D.inbound.length, 'crate')} inbound` } : null)
      : k === 'more' ? (local && local.changes.length ? { text: local.changes.length, title: `${plural(local.changes.length, 'local change')} to export` } : STALE ? { text: '!', title: 'parked changes need attention' } : hobbyDot ? { text: '', title: 'a list has hobby work before it is table-ready', dotOnly: true } : null) : null;
    for (const nav of [$('.topnav'), $('.tabbar')]) {
      const wide = nav.classList.contains('topnav'), items = wide ? NAV_WIDE : NAV_PHONE, key = wide ? (v === 'glossary' ? 'more' : v) : (PHONE_KEY[v] || v);
      nav.innerHTML = items.map(([k, label, href]) => { const b = badge(k); return `<a href="${href}"${k === key ? ' aria-current="page"' : ''}>${label}${b ? `<span class="badge${b.dotOnly ? ' dot' : ''}" title="${esc(b.title)}" aria-label="${esc(b.title)}">${b.text}</span>` : ''}</a>`; }).join('');
    }
    const R = STORE.rules.snapshot, age = daysBetween(R.verified, TODAY);
    $('.mast .meta').innerHTML = `<abbr title="Munitorum Field Manual — Games Workshop's points document; every total here uses this dated version">${esc(PSHORT)}</abbr> points · <span class="${age > 45 ? 'stale' : ''}">rules verified ${dshort(R.verified)} (${age}d ago)</span> · data ${dshort(STORE.meta.updated)}${local ? ` · <span class="stale">${plural(local.changes.length, 'local edit')}</span>` : ''}`;
    let html;
    try { html = VIEWS[v](parts, q); } catch (err) { html = `<p>Something in this view broke: <code>${esc(err.message)}</code>. The data is fine; <a href="#/">go home</a>.</p>`; console.error(err); }
    $('#view').innerHTML = html;
    document.title = `Muster · ${v === 'home' ? 'the Long Shadow Host' : v}`;
    const path = parts.join('/') + (q.f || '') ;
    if (!keepScroll && path !== lastPath) window.scrollTo(0, 0);
    const opened = q.open && $(`tr.open`); if (opened && q.open !== lastOpen) opened.scrollIntoView({ block: 'center' });
    lastPath = path; lastOpen = q.open || null;
    if (fk) { const el = fk.startsWith('row:') ? $(`tr[data-id="${CSS.escape(fk.slice(4))}"]`) : $(`[data-fkey="${CSS.escape(fk)}"]`); if (el) el.focus({ preventScroll: true }); }
    const ep = STORE.meta.epigraphs || []; $('.marg').textContent = ep.length ? ep[(new Date().getDate()) % ep.length] : '';
    fillModels();
  }
  const tag = (cls, text, title) => `<span class="tag ${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
  const paintTag = p => L.NOT_READY_PAINT.has(p) ? tag('todo', p === 'unassembled' ? 'on sprue' : p, p === 'unassembled' ? 'still on the plastic frame — needs assembly and paint' : 'not table-ready yet') : '';
  const row = (href, l, r, sub) => `<li>${href ? `<a href="${href}">` : '<span class="row">'}<span class="l">${l}</span><span class="r">${r == null ? '' : r}</span>${sub ? `<span class="sub">${sub}</span>` : ''}${href ? '</a>' : '</span>'}</li>`;
  const epi = u => u.epithet ? `<span class="epi-inline" title="the codex's name for it">“${esc(u.epithet)}”</span>` : '';

  const VIEWS = {};

  // ----- HOME -----
  VIEWS.home = () => {
    const al = alerts();
    const inv = STORE.inventory.filter(i => i.status === 'owned');
    const notReady = D.notReady;
    const toConfirm = confirmList();
    const statuses = STORE.lists.map(l => ({ l, s: listStatus(l) }));
    const order = { ready: 0, hobby: 1, buy: 2 };
    statuses.sort((a, b) => order[a.s.status] - order[b.s.status] || a.l.id.localeCompare(b.l.id));
    const ready = statuses.filter(x => x.s.status === 'ready');
    const rest = statuses.filter(x => !ready.length || x !== ready[0]);
    const games = D.games, thr = STORE.games.rule.threshold, override = LS.get('muster.buyOverride', false), paused = games < thr && !override;
    const buyable = statuses.filter(x => x.s.status === 'buy' && x.s.legal).map(x => ({ x, c: gapCost(x.s.cov.missing) })).filter(y => !y.c.none).sort((a, b) => (a.c.partial - b.c.partial) || a.c.lo - b.c.lo);
    const gaps = allGaps(), wanted = gaps.filter(g => !g.inbound), topN = wanted.filter(g => Object.keys(g.lists).length === Object.keys((wanted[0] || { lists: {} }).lists).length);
    const feedHits = FEED.rows.filter(r => annotate(r, gaps).worth.length).length, feedDnb = FEED.rows.filter(r => annotate(r, gaps).dnb.length).length;
    const next = buyable[0];
    const transitApprox = D.inbound.some(o => o.approx);
    return `
${al.length ? `<ul class="alerts" aria-label="Notices">${al.map(a => `<li class="${a.lvl || ''}">${a.text}</li>`).join('')}</ul>` : ''}
<div class="qs">
 <section class="q" aria-labelledby="q1"><a class="head" href="#/collection"><p class="k" id="q1">What do I own <span aria-hidden="true">›</span></p>
  <p class="big">${pts(D.fieldablePoints)} pts <span class="small">${D.readyPoints !== D.fieldablePoints ? `${pts(D.readyPoints)} of it table-ready · ` : ''}at ${esc(PSHORT)} · ${plural(D.records, 'entry', 'entries')} · ${D.approxModels ? '≈' : ''}${D.modelsOwned} models · ${usd(D.spent, true)} spent${D.inbound.length ? `, incl. ${usd(D.inTransit, true)} for ${plural(D.inbound.length, 'crate')} whose contents are not counted until opened` : ''}</span></p></a>
  <ul class="rows">
   ${row('#/collection?f=ready', 'Painted and based', `${inv.length - notReady.length} of ${inv.length} entries`)}
   ${row('#/collection?f=todo', 'Not table-ready', notReady.length ? notReady.map(i => `${esc(uname(i.unit))} ${paintTag(i.paint)}`).join(' ') : 'nothing — all built and painted')}
   ${row('#/collection?f=verify', 'Counts to confirm', toConfirm.length ? toConfirm.map(c => `${esc(uname(c.unit))} <span class="glyph">${esc(c.text)}</span>`).join(' · ') : 'none')}
  </ul></section>

 <section class="q" aria-labelledby="q2"><a class="head" href="#/lists"><p class="k" id="q2">What can I field today <span aria-hidden="true">›</span></p>
  <p class="big">${ready.length ? `${esc(ready[0].l.id)} · ${esc(ready[0].l.name)}` : '<span class="dim">Nothing complete yet</span>'} <span class="small">${ready.length ? `${pts(ready[0].s.lint.total)} of ${pts(ready[0].l.limit)} pts · passes the rules check, every model owned, built and painted${ready.length > 1 ? ` · also ready: ${ready.slice(1).map(x => esc(x.l.id)).join(', ')}` : ''}` : 'see what each list is waiting on'}</span></p></a>
  <ul class="rows">
   ${rest.slice(0, 3).map(({ l, s }) => row(`#/lists/${esc(l.id)}`, `${esc(l.id)} · ${esc(l.name)}`, ticks(s), s.status === 'ready' ? 'ready — pick it up and play' : s.status === 'hobby' ? `owned; build and paint first: ${s.cov.hobby.map(h => esc(uname(h.unit))).join(', ')}` : `${plural(s.cov.missing.length, 'unit')} to buy: ${esc(gapWords(s.cov.missing, 2))}`)).join('')}
   ${rest.length > 3 ? row('#/lists', `Also waiting: ${rest.slice(3).map(x => `${esc(x.l.id)} · ${esc(x.l.name)}`).join(', ')}`, 'all lists ›') : ''}
  </ul></section>

 <section class="q" aria-labelledby="q3"><a class="head" href="#/buy"><p class="k" id="q3">What should I buy next <span aria-hidden="true">›</span></p>
  <p class="big ${paused ? 'dim' : ''}">${paused ? `Paused · ${games} of ${thr} games` : next ? esc(gapWords(next.x.s.cov.missing, 2)) : 'No priced gaps'} <span class="small">${paused ? `house rule: ${thr} games before the next model, counting ${esc(STORE.games.rule.counts_from)}.${next ? ` When it lifts: finish ${esc(next.x.l.id)} — ${esc(gapWords(next.x.s.cov.missing))}, from ${range(next.c.lo, next.c.mid, next.c.partial)}.` : ''}` : next ? `cheapest list to finish: ${esc(next.x.l.id)} · ${esc(next.x.l.name)} · from ${range(next.c.lo, next.c.mid, next.c.partial)} at ${dshort(PRICE_DATE)} scout prices` : 'run the scout for current prices'}</span></p></a>
  <ul class="rows">
   ${buyable.slice(0, 2).map(({ x, c }) => row(`#/lists/${esc(x.l.id)}`, `Finish ${esc(x.l.id)} · ${esc(x.l.name)}`, `${range(c.lo, c.mid, c.partial)}`, `${esc(gapWords(x.s.cov.missing))}${x.s.cov.missing.some(m => gaps.find(g => g.unit === m.unit && g.inbound)) ? ' — an inbound crate may cover part of it' : ''}`)).join('')}
   ${topN.length ? row('#/buy', `Most-wanted: ${topN.map(g => esc(uname(g.unit))).join(', ')}`, topN.length === 1 && PRICES[topN[0].unit] ? `${range(PRICES[topN[0].unit].min, PRICES[topN[0].unit].med)}` : `${topN.length > 1 ? 'tied' : 'unpriced'}`, `${topN.length > 1 ? 'each ' : ''}missing from ${Object.keys(topN[0].lists).join(', ')} · prices are the ${dshort(PRICE_DATE)} scout's, not live`) : ''}
   ${row('#/buy?f=flagged', 'In the market feed', `${feedHits} worth a look · ${feedDnb} do-not-buy`, `${FEED.rows.length} painted-army listings scanned ${esc(dshort((FEED.meta && FEED.meta.scanned) || ''))} — a dated snapshot, most long ended`)}
  </ul></section>

 <section class="q" aria-labelledby="q4"><a class="head" href="#/crates"><p class="k" id="q4">What is arriving <span aria-hidden="true">›</span></p>
  <p class="big">${D.inbound.length ? plural(D.inbound.length, 'crate') : '<span class="dim">Nothing inbound</span>'} <span class="small">${D.inbound.length ? `${usd(D.inTransit, transitApprox)} in transit · contents pending until you open them in crate mode` : 'every order delivered and catalogued'}</span></p></a>
  <ul class="rows">
   ${D.inbound.map(o => { const s = etaState(o); const draft = (LS.get('muster.crates', {})[o.id] || { rows: [] }).rows.length; return row(`#/crates/${esc(o.id)}`, `${esc(o.item)} ${tag('inb', 'inbound')}${draft ? ' ' + tag('warn', `draft: ${draft} rows`) : ''}`, `<span class="ticks"><span class="${s.cls}">●</span></span> ${esc(s.text)}`, esc(dot(o.shipped ? `shipped ${dshort(o.shipped)}${o.carrier ? ' via ' + o.carrier : ''}` : null, sentence(o.expected) || 'contents pending'))); }).join('')}
   ${row('#/crates', 'Open a crate', 'crate mode ›', 'tick what actually came out of the box; the collection updates and you get a change to export')}
  </ul></section>
</div>`;
  };
  function confirmList() {
    const out = [];
    for (const i of STORE.inventory) { if (i.status !== 'owned') continue; const u = unitById(i.unit); if (!u) continue; const min = Math.min(...u.sizes.map(s => s.models));
      if (i.approx) out.push({ unit: i.unit, inv: i.id, text: `≈${i.models}` });
      else if (D.unfieldable.some(x => x.unit === i.unit)) out.push({ unit: i.unit, inv: i.id, text: u.sizes.every(s => s.pts == null) ? `${i.models}, no points on file` : `${i.models} of ${min}` }); }
    return out;
  }

  // ----- COLLECTION -----
  const FILTERS = [['all', 'All', i => true], ['LD', 'Daemons', (i, u) => u.faction === 'LD'], ['HA', 'Chaos Space Marines', (i, u) => u.faction === 'HA'], ['CK', 'Knights', (i, u) => u.faction === 'CK'],
    ['khorne', 'Khorne', (i, u) => u.god === 'khorne'], ['tzeentch', 'Tzeentch', (i, u) => u.god === 'tzeentch'], ['nurgle', 'Nurgle', (i, u) => u.god === 'nurgle'],
    ['ready', 'Table-ready', i => !L.NOT_READY_PAINT.has(i.paint)], ['todo', 'Not ready', i => L.NOT_READY_PAINT.has(i.paint)], ['verify', 'Counts to confirm', i => confirmList().some(c => c.inv === i.id)], ['inbound', 'Inbound crates', i => false]];
  let sortState = LS.get('muster.sort2', { key: 'store', dir: 1 });
  VIEWS.collection = (parts, q) => {
    const f = FILTERS.find(x => x[0] === q.f) || FILTERS[0], use = unitUse();
    const rows = STORE.inventory.map(i => ({ i, u: unitById(i.unit), o: orderById(i.order) })).filter(r => r.u);
    const counts = Object.fromEntries(FILTERS.map(([k, , fn]) => [k, k === 'inbound' ? D.inbound.length : rows.filter(r => fn(r.i, r.u)).length]));
    let shown = f[0] === 'inbound' ? [] : rows.filter(r => f[2](r.i, r.u));
    const val = { name: r => r.u.name, models: r => r.i.models || 0, pts: r => rowPts(r).v };
    if (sortState.key !== 'store' && val[sortState.key]) shown = shown.slice().sort((a, b) => { const x = val[sortState.key](a), y = val[sortState.key](b); return (x > y ? 1 : x < y ? -1 : 0) * sortState.dir; });
    const th = (key, label, cls) => `<th class="${cls || ''}" data-sort="${key}" tabindex="0" role="columnheader" aria-sort="${sortState.key === key ? (sortState.dir > 0 ? 'ascending' : 'descending') : 'none'}" data-fkey="sort-${key}">${label}<span class="sortmark">${sortState.key === key ? (sortState.dir > 0 ? ' ▲' : ' ▼') : ' ↕'}</span></th>`;
    const open = q.open, showInbound = f[0] === 'all' || f[0] === 'inbound';
    return `
<div class="vh"><h2>Collection</h2><div class="tools"><button class="btn ghost" data-act="csv">Export CSV</button></div></div>
<p class="lead">Every entry is one line of the collection file. Points at ${esc(STORE.meta.points_snapshot)} (<abbr title="Munitorum Field Manual — GW's points document">MFM</abbr>). Legend: <span class="glyph">≈</span> approximate count · <span class="glyph">?</span> unknown until the crate is opened · <span class="glyph">~</span> points not verified in the app · quoted names are the codex's. Tap a row for its facts, provenance and the lists that use it${sortState.key !== 'store' ? ` · sorted by ${esc(sortState.key)} — <button class="linkbtn" data-act="sortreset">back to file order</button>` : ''}.</p>
<div class="chipbar" role="toolbar" aria-label="Filter">${FILTERS.map(([k, label]) => `<button data-act="filter" data-f="${k}" data-fkey="chip-${k}" aria-pressed="${k === f[0]}">${label}<b>${counts[k]}</b></button>`).join('')}</div>
<div class="scroll"><table class="tbl units">
<thead><tr>${th('name', 'Unit')}<th class="wide">Paint</th><th class="wide">In lists</th><th class="wide">From</th>${th('models', '#', 'n')}${th('pts', 'Pts', 'n')}</tr></thead>
<tbody>
${shown.map(r => { const p = rowPts(r), lists = use[r.u.id] ? [...use[r.u.id]].join(' ') : 'none'; const isOpen = open === r.i.id; const from = r.o ? `${dshort(r.o.date)} · ${esc(shortItem(r.o))}` : '';
      return `
<tr data-id="${esc(r.i.id)}" data-act="open" class="${isOpen ? 'open' : ''}" tabindex="0"><td><span class="name">${esc(r.u.name)}</span> ${paintTag(r.i.paint)}${r.u.verify ? ' ' + tag('warn', 'verify', r.u.note || 'points unverified') : ''}<span class="sub clamp narrow">${dot(epi(r.u), from, `lists ${esc(lists)}`, r.i.note ? esc(r.i.note) : null)}</span><span class="sub clamp wide">${dot(epi(r.u), r.i.note ? esc(r.i.note) : null)}</span></td>
<td class="wide">${esc(r.i.paint)}</td><td class="wide mono nowrap">${esc(lists)}</td><td class="wide">${from}</td>
<td class="n">${r.i.approx ? '<span class="glyph">≈</span>' : ''}${r.i.models}${p.short ? `<span class="glyph"> of ${p.min}</span>` : ''}</td><td class="n">${p.text}${r.u.verify && p.v ? '<span class="glyph" title="points not verified in the app">~</span>' : ''}</td></tr>
${isOpen ? `<tr class="detail"><td colspan="6">${unitDetail(r.u, r.i, r.o, lists)}</td></tr>` : ''}`; }).join('')}
${showInbound ? D.inbound.map(o => `<tr class="inbound" data-act="go" data-href="#/crates/${esc(o.id)}" tabindex="0"><td><span class="name">${esc(o.item)}</span> ${tag('inb', 'inbound')}<span class="sub">${esc(dot(sentence(o.expected) || 'contents pending', etaState(o).text))}</span></td><td class="wide">${esc(o.state.toLowerCase())}</td><td class="wide"></td><td class="wide">${dshort(o.date)}</td><td class="n"><span class="glyph">?</span></td><td class="n">—</td></tr>`).join('') : ''}
</tbody></table></div>
<p class="hint">${plural(shown.length, 'entry', 'entries')}${f[0] !== 'all' ? ` (filter: ${esc(f[1])})` : ''}${showInbound && D.inbound.length ? ` + ${plural(D.inbound.length, 'inbound crate')}` : ''} · ${pts(D.fieldablePoints)} pts owned${D.readyPoints !== D.fieldablePoints ? `, ${pts(D.readyPoints)} table-ready` : ''}${D.unfieldable.length ? ` · not counted: ${D.unfieldable.map(x => `${esc(uname(x.unit))} (${esc(x.why)})`).join(', ')}` : ''}.</p>`;
  };
  function rowPts(r) {
    const v = L.bestValue(r.u, r.i.models || 0), min = Math.min(...r.u.sizes.map(s => s.models));
    if (v) return { v, text: pts(v), min, short: false };
    const s0 = r.u.sizes.slice().sort((a, b) => a.models - b.models)[0];
    return { v: 0, text: s0 && s0.pts != null ? `<span class="glyph" title="points for a full unit of ${s0.models}">${s0.pts} per ${s0.models}</span>` : '—', min, short: (r.i.models || 0) < min };
  }
  function unitDetail(u, i, o, lists) {
    const R = STORE.rules;
    const legal = { native: `${R.detachment.name} unit (${u.god})`, thrall: `Chaos Space Marines — legal via ${R.thralls.name} (counts toward the ${pts(R.thralls.cap.strike_force)}-pt allowance at 2,000)`, ally: 'Chaos Knights ally under Dreadblades — up to 3 War Dog models, never the Warlord, no enhancements, no detachment boon (verify the rule in the app before an event)', banned: 'ILLEGAL in this detachment' }[u.legality] || u.legality;
    return `<dl class="kvl">
<dt>Datasheet</dt><dd>${esc(u.name)} · ${esc((u.keywords || []).join(', ').toLowerCase())}${u.abilities ? ` · abilities: ${esc(u.abilities.join(', '))}` : ''}</dd>
<dt>Points</dt><dd>${u.sizes.map(s => `${plural(s.models, 'model')}: ${s.pts == null ? '?' : s.pts}${s.pts_third != null ? ` (third copy ${s.pts_third})` : ''}`).join(' · ')} — ${esc(STORE.meta.points_snapshot)}${u.verify ? ' · <b>verify in the app</b>' : ''}</dd>
<dt>Legality</dt><dd>${esc(legal)}</dd>
${u.leads ? `<dt>Leads</dt><dd>${u.leads.map(id => `${esc(uname(id))}${(u.leads_verify || []).includes(id) ? ' (pairing unconfirmed)' : ''}`).join(', ')}</dd>` : ''}
${u.note ? `<dt>Note</dt><dd>${esc(u.note)}</dd>` : ''}
${i ? `<dt>Entry</dt><dd>${i.approx ? '≈' : ''}${plural(i.models, 'model')} · ${esc(i.paint)}${i.note ? ' · ' + esc(i.note) : ''}</dd>` : ''}
${o ? `<dt>Provenance</dt><dd>${esc(dot(o.item, `ordered ${dshort(o.date)}`, usd(o.cost_usd, o.approx) + (o.cost_note ? ` (${o.cost_note})` : ''), etaState(o).text))}</dd>` : ''}
<dt>In lists</dt><dd>${esc(lists)}</dd>
<dt>Source</dt><dd><a href="${esc(u.source)}" target="_blank" rel="noopener">${esc(u.source.replace(/^https?:\/\//, ''))}</a></dd>
${i ? `<dt>Paint state</dt><dd><select data-field="paint" data-inv="${esc(i.id)}" data-fkey="paint-${esc(i.id)}" aria-label="paint state of ${esc(u.name)}">${STORE.hobby.paint_states.map(p => `<option${p === i.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select> <span class="hint">kept on this device until you export</span></dd>` : ''}
</dl>`;
  }

  // ----- LISTS -----
  VIEWS.lists = (parts, q) => {
    if (parts[1]) return listDetail(parts[1]);
    const dl = deviceLists(), R = STORE.rules;
    return `
<div class="vh"><h2>Lists</h2><div class="tools"><a class="btn" href="#/build">Build a list</a></div></div>
<p class="lead">${esc(R.detachment.name)} (${R.detachment.dp} of the ${R.battle_size.detachment_points || 3} <abbr title="detachment points — the budget for rules packages at this game size">detachment points</abbr> at ${pts(R.battle_size.points)}) · ${esc(R.battle_size.name)}. Each list shows three checks — <b>legal</b> (the rules check passed at ${esc(PSHORT)}), <b>owned</b> (the collection covers every model), <b>painted</b> (all of it built and painted). Totals are computed from the collection file, never typed.</p>
<div class="cards">${STORE.lists.map(l => listCard(l)).join('')}</div>
${dl.length ? `<h3 class="sh">On this device</h3><p class="lead">Lists you built here. They live in this browser until you copy their data into <code>data/muster.json</code>.</p><div class="cards">${dl.map(l => listCard(l, true)).join('')}</div>` : ''}`;
  };
  function listCard(l, device) {
    const s = listStatus(l), c = gapCost(s.cov.missing);
    const why = s.status === 'ready' ? 'Playable today.' : s.status === 'hobby' ? `Owned — build and paint first: ${s.cov.hobby.map(h => `${esc(uname(h.unit))} (${esc(h.paint)})`).join(', ')}.` : `Missing ${esc(gapWords(s.cov.missing))}${c.none ? '' : ` — from ${range(c.lo, c.mid, c.partial)} at ${dshort(PRICE_DATE)} prices`}.`;
    return `<article class="cardx clickable"><h3><a class="cover" href="#/lists/${esc(l.id)}">${esc(l.id)} · ${esc(l.name)}</a></h3>
<p class="meta">${pts(s.lint.total)} of ${pts(l.limit || 2000)} · ${ticks(s)}${s.verify ? ` · ${plural(s.verify, 'thing')} to verify` : ''}${device ? ' · on this device' : ''}</p>
<p>${esc(l.idea || '')}</p><p class="muted">${why}${!s.legal ? ` <b>Fails the rules check:</b> ${esc(s.lint.flags.filter(f => f.level === 'error').map(f => f.msg).join('; '))}` : ''}</p>
<p class="acts"><button class="linkbtn" data-act="copylist" data-list="${esc(l.id)}">Copy as text</button>${device ? `<a class="linkbtn" href="#/build?resume=${esc(l.id)}">Continue editing</a><button class="linkbtn" data-act="devdel" data-list="${esc(l.id)}">Delete</button>` : `<a class="linkbtn" href="#/build?from=${esc(l.id)}">Edit a copy</a>`}</p></article>`;
  }
  function capsLine(lint) {
    const R = STORE.rules;
    return dot(lint.ha || lint.haEnh ? `Chaos Space Marines ${pts(lint.ha)}${lint.haEnh ? ` + ${lint.haEnh} enh` : ''} of the ${pts(lint.haCap)} allowed` : null, lint.warDogs ? `War Dogs ${lint.warDogs} of ${R.allies.dreadblades.max_war_dog_models} allowed` : null);
  }
  function listDetail(id) {
    const l = listById(id); if (!l) return `<p>No list “${esc(id)}”. <a href="#/lists">Back to lists</a>.</p>`;
    const s = listStatus(l), lint = s.lint, byEntry = new Map(lint.entries.map(o => [o.entry.id, o])), cov = new Map(s.cov.rows.map(r => [r.entry, r]));
    const c = gapCost(s.cov.missing), R = STORE.rules;
    const sd = l.secondary && (R.secondary_detachments || []).find(x => x.id === l.secondary);
    return `
<div class="vh"><h2>${esc(l.id)} · ${esc(l.name)}</h2><div class="tools"><button class="btn" data-act="copylist" data-list="${esc(l.id)}">Copy as text</button><a class="btn ghost" href="#/build?from=${esc(l.id)}">Edit a copy</a><a class="btn ghost" href="#/lists">All lists</a></div></div>
<p class="lead">${esc(l.idea || '')}${l.doctrine ? `<br>${esc(l.doctrine)}` : ''}${l.primer ? ` <a href="${esc(l.primer)}">How to play it (Primer) →</a>` : ''}</p>
<p class="statline"><b class="mono">${pts(lint.total)} of ${pts(lint.limit)} pts</b> ${ticks(s)}</p>
<p class="hint">${esc(capsLine(lint))}${sd ? ` · secondary detachment: ${esc(sd.name)} (${sd.dp} DP)` : ''}</p>
<div class="two"><div>
<div class="scroll"><table class="tbl units"><thead><tr><th>Unit</th><th class="n">#</th><th class="n">Pts</th><th>Owned</th></tr></thead><tbody>
${l.entries.map(e => { const o = byEntry.get(e.id) || { pts: 0, unitPts: 0, flags: [] }, cv = cov.get(e.id) || { short: e.models, from: [] }; const u = unitById(e.unit) || { name: e.unit, sizes: [] }; const led = e.leads ? l.entries.find(x => x.id === e.leads) : null;
      const notReadyFrom = cv.from.find(f => L.NOT_READY_PAINT.has(f.paint));
      return `<tr><td><span class="name">${esc(u.name)}</span>${e.warlord ? ' ' + tag('warn', 'warlord') : ''}${e.enh ? ` ${tag('inb', (o.enh && o.enh.name) || e.enh, o.enh ? o.enh.gist : '')}` : ''}<span class="sub">${dot(led ? `leads ${esc(uname(led.unit))} ×${led.models}` : null, o.enh ? `${o.unitPts} + ${o.enh.pts} for ${esc(o.enh.name)}` : null, ...o.flags.filter(f => f.level !== 'info').map(f => `<span class="glyph">${f.level === 'error' ? '✗' : '~'}</span> ${esc(f.msg)}`))}</span></td>
<td class="n">${e.models}</td><td class="n">${pts(o.pts)}</td><td>${cv.short ? tag('todo', cv.short === e.models ? 'to buy' : `short ${cv.short}`) : notReadyFrom ? tag('warn', notReadyFrom.paint === 'unassembled' ? 'on sprue' : notReadyFrom.paint) : '<span class="ok">✓</span>'}</td></tr>`; }).join('')}
</tbody></table></div>
<div class="total-line ${lint.total > lint.limit ? 'over' : ''}"><span>Total</span><span>${pts(lint.total)} of ${pts(lint.limit)}</span></div>
</div><aside>
<h3 class="sh">Rules check</h3>
${flagList(lint)}
<h3 class="sh">To field it</h3>
<ul class="flags">${s.cov.missing.length ? s.cov.missing.map(m => { const uc = unitCost(m.unit, m.models); return `<li>${tag('todo', 'to buy')} ${esc(uname(m.unit))} ×${m.models}${m.have ? ` <span class="src">${m.have} owned; ${m.models} more makes a legal unit</span>` : ''}${uc ? ` <span class="src">${range(uc.lo, uc.mid)}${uc.boxes > 1 ? ` for ${uc.boxes} lots` : ''} · ${uc.n} usable of ${uc.of} listings</span>` : ' <span class="src">no price on file</span>'}</li>`; }).join('') : ''}
${s.cov.hobby.map(h => `<li>${tag('warn', h.paint === 'unassembled' ? 'on sprue' : h.paint)} ${esc(uname(h.unit))} — build and paint it before the list counts as painted. <a href="#/hobby?list=${esc(l.id)}">Hobby queue →</a></li>`).join('')}
${!s.cov.missing.length && !s.cov.hobby.length ? '<li class="ok">✓ Every entry is covered by owned, painted models.</li>' : ''}
${s.cov.missing.length && !c.none ? `<li><span class="src">Whole gap from ${range(c.lo, c.mid, c.partial)}${c.partial ? ' (some units unpriced)' : ''}. Prices are landed Buy-It-Now figures from the ${dshort(PRICE_DATE)} read-only scout, auctions and part-kits excluded — a dated floor, not a live offer. House rule: ${STORE.games.rule.threshold} games before the next model (${D.games} played).</span></li>` : ''}
</ul></aside></div>`;
  }
  function srcLine(rule) {
    if (!rule || !(rule.why || rule.source)) return '';
    const src = rule.source ? (/^https?:/.test(rule.source) ? `<a href="${esc(rule.source)}" target="_blank" rel="noopener">${esc(rule.source.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a>` : esc(rule.source)) : '';
    return `<span class="src">${rule.why ? esc(rule.why) + ' ' : ''}${src ? `Source: ${src}` : ''}${rule.verified ? ` · verified ${esc(rule.verified)}` : ''}</span>`;
  }
  function flagList(lint) {
    const all = lint.flags.concat(...lint.entries.map(o => o.flags));
    const lv = { error: 0, warn: 1, info: 2 }; all.sort((a, b) => lv[a.level] - lv[b.level]);
    if (!all.length) return `<ul class="flags"><li class="ok">✓ Passes every check the store knows, at ${esc(PSHORT)} — verify in the official app before an event.</li></ul>`;
    return `<ul class="flags">${!all.some(f => f.level === 'error') ? `<li class="ok">✓ Passes the rules check at ${esc(PSHORT)}; the notes below are things to verify in the app, not violations.</li>` : ''}${all.map(f => `<li><span class="lv ${f.level}">${f.level === 'warn' ? 'verify' : f.level === 'error' ? 'fails' : 'note'}</span>${esc(f.msg)}${srcLine(f.rule)}</li>`).join('')}</ul>`;
  }
  function listText(l) {
    const s = listStatus(l), lint = s.lint, by = new Map(lint.entries.map(o => [o.entry.id, o])), R = STORE.rules;
    const sd = l.secondary && (R.secondary_detachments || []).find(x => x.id === l.secondary);
    const lines = [`++ ${l.name} — Chaos Daemons — ${R.detachment.name}${sd ? ` + ${sd.name}` : ''} (${R.battle_size.name}, ${pts(l.limit || 2000)} pts) ++`, ''];
    for (const e of l.entries) {
      const o = by.get(e.id) || { pts: 0 }, u = unitById(e.unit) || { name: e.unit }, led = e.leads ? l.entries.find(x => x.id === e.leads) : null;
      lines.push(`${u.name}${e.models > 1 ? ` ×${e.models}` : ''} (${o.pts})${e.warlord ? ' — WARLORD' : ''}${e.enh ? ` — Enhancement: ${(o.enh && o.enh.name) || e.enh} (+${o.enh ? o.enh.pts : '?'})` : ''}${led ? ` — leads ${uname(led.unit)} ×${led.models}` : ''}`);
    }
    lines.push('', `Total: ${pts(lint.total)} / ${pts(lint.limit)}${lint.ha ? ` · Heretic Astartes ${lint.ha}${lint.haEnh ? `+${lint.haEnh} enh` : ''}/${lint.haCap}` : ''}${lint.warDogs ? ` · War Dogs via Chaos Knights Dreadblades (${lint.warDogs})` : ''}${sd ? ` · Detachments: ${R.detachment.name} ${R.detachment.dp} DP + ${sd.name} ${sd.dp} DP` : ''}`,
      `Points: ${STORE.meta.points_snapshot}, rules verified ${R.snapshot.verified} — re-verify in the official app before an event.`);
    if (!lint.legal) lines.push('FAILS THE RULES CHECK as written: ' + lint.flags.concat(...lint.entries.map(o => o.flags)).filter(f => f.level === 'error').map(f => f.msg).join('; '));
    return lines.join('\n');
  }

  // ----- BUILDER -----
  const newId = () => 'dev-' + Date.now().toString(36).slice(-5);
  function builderState(q) {
    let b = LS.get('muster.builder', null);
    const dirty = b && !same(b, (deviceLists().find(x => x.id === b.id) || {})) && b.entries && b.entries.length > 1;
    if (q && (q.from || q.resume)) {
      const src = listById(q.from || q.resume);
      if (src && (!dirty || b.id === src.id || confirm(`Replace the unsaved draft “${b.name}” in the builder?`))) {
        b = q.resume ? clone(src) : { id: newId(), name: src.name + ' (copy)', limit: src.limit || 2000, detachment: 'shadow_legion', secondary: src.secondary, entries: clone(src.entries) };
        LS.set('muster.builder', b);
      }
      history.replaceState(null, '', '#/build');
    }
    if (!b) { b = { id: newId(), name: 'New list', limit: 2000, detachment: 'shadow_legion', entries: [{ id: 'n1', unit: 'belakor', models: 1, warlord: true }] }; LS.set('muster.builder', b); }
    return b;
  }
  VIEWS.build = (parts, q) => {
    const b = builderState(q), lint = L.lintList(STORE, b), cov = L.coverage(STORE, b), by = new Map(lint.entries.map(o => [o.entry.id, o])), cv = new Map(cov.rows.map(r => [r.entry, r]));
    const s = { lint, cov, legal: lint.legal, owned: !cov.missing.length, ready: !cov.missing.length && !cov.hobby.length };
    const owned = {}; for (const i of STORE.inventory) if (i.status === 'owned') owned[i.unit] = (owned[i.unit] || 0) + (i.models || 0);
    const groups = [['Daemons — undivided', u => u.faction === 'LD' && u.god === 'undivided'], ['Khorne', u => u.god === 'khorne'], ['Tzeentch', u => u.god === 'tzeentch'], ['Nurgle', u => u.god === 'nurgle'], ['Slaanesh', u => u.god === 'slaanesh'], ['Chaos Space Marines (Thralls)', u => u.faction === 'HA'], ['Chaos Knights (Dreadblades)', u => u.faction === 'CK']];
    const enhs = STORE.rules.enhancements, R = STORE.rules, last = LS.get('muster.lastUnit', 'bloodletters');
    return `
<div class="vh"><h2>Builder</h2><div class="tools"><button class="btn pri" data-act="b-save">Save on this device</button><button class="btn ghost" data-act="b-copy">Copy as text</button><button class="btn ghost" data-act="b-new">Start over</button></div></div>
<p class="lead">Compose from the catalog; the rules check and the ownership check run as you go, and the draft is kept on this device. A saved list appears under Lists → On this device; to make it canonical, copy its data (below) into <code>data/muster.json</code> → <code>lists</code>, or paste it to a session and ask.</p>
<div class="f narrowf"><div class="row2"><label>Name<input data-bfield="name" data-fkey="b-name" value="${esc(b.name)}"></label><label>Game size<select data-bfield="limit" data-fkey="b-limit">${[1000, 2000, 3000].map(n => `<option value="${n}"${n === b.limit ? ' selected' : ''}>${pts(n)} pts</option>`).join('')}</select></label></div></div>
<div class="two"><div>
<div class="scroll"><table class="tbl units stack"><thead><tr><th>Unit</th><th class="n">#</th><th class="n">Pts</th><th>Options</th><th><span class="sr">Remove</span></th></tr></thead><tbody>
${b.entries.map(e => { const u = unitById(e.unit); if (!u) return `<tr><td colspan="5">${esc(e.unit)}? <button class="btn ghost" data-act="b-del" data-e="${esc(e.id)}">remove</button></td></tr>`; const o = by.get(e.id) || { pts: 0, flags: [] }, c = cv.get(e.id) || { short: 0, from: [] };
      const canEnh = L.isChar(u) && !L.isEpic(u) && u.legality !== 'ally';
      const targets = b.entries.filter(x => x.id !== e.id && (u.leads || []).includes(x.unit));
      return `<tr><td class="namecell"><span class="name">${esc(u.name)}</span><span class="sub">${o.flags.filter(f => f.level !== 'info').map(f => `<span class="glyph">${f.level === 'error' ? '✗' : '~'}</span> ${esc(f.msg)}`).join(' · ') || (c.short ? `${c.short === e.models ? 'not owned' : `short ${plural(c.short, 'model')}`}` : c.from.some(f => L.NOT_READY_PAINT.has(f.paint)) ? 'owned, not yet built and painted' : 'owned')}</span></td>
<td class="n"><select data-bentry="${esc(e.id)}" data-bkey="models" data-fkey="bm-${esc(e.id)}" aria-label="models">${u.sizes.map(sz => `<option${sz.models === e.models ? ' selected' : ''}>${sz.models}</option>`).join('')}${u.sizes.some(sz => sz.models === e.models) ? '' : `<option selected>${e.models}</option>`}</select></td>
<td class="n">${pts(o.pts)}</td>
<td class="opts">${canEnh ? `<select data-bentry="${esc(e.id)}" data-bkey="enh" data-fkey="be-${esc(e.id)}" aria-label="enhancement"><option value="">no enhancement</option>${enhs.map(x => `<option value="${esc(x.id)}"${x.id === e.enh ? ' selected' : ''}>${esc(x.name)} +${x.pts}</option>`).join('')}</select>` : ''}
${(u.leads || []).length ? `<select data-bentry="${esc(e.id)}" data-bkey="leads" data-fkey="bl-${esc(e.id)}" aria-label="leads"><option value="">leads nobody</option>${targets.map(t => `<option value="${esc(t.id)}"${t.id === e.leads ? ' selected' : ''}>→ ${esc(uname(t.unit))} ×${t.models}</option>`).join('')}</select>` : ''}
${L.isChar(u) || L.isEpic(u) ? `<label class="pill"><input type="checkbox" data-bentry="${esc(e.id)}" data-bkey="warlord" data-fkey="bw-${esc(e.id)}"${e.warlord ? ' checked' : ''}> Warlord</label>` : ''}</td>
<td class="rm"><button class="btn ghost icon" data-act="b-del" data-e="${esc(e.id)}" aria-label="remove ${esc(u.name)}">✕</button></td></tr>`; }).join('')}
</tbody></table></div>
<div class="total-line ${lint.total > lint.limit ? 'over' : ''}"><span>${ticks(s)}</span><span>${pts(lint.total)} of ${pts(lint.limit)}</span></div>
<div class="f"><div class="row3"><label>Add a unit<select id="b-unit" data-fkey="b-unit">${groups.map(([g, fn]) => `<optgroup label="${esc(g)}">${STORE.units.filter(fn).map(u => `<option value="${esc(u.id)}"${u.id === last ? ' selected' : ''}>${esc(u.name)}${owned[u.id] ? ` — own ${owned[u.id]}` : ''}${u.legality === 'banned' ? ' — ILLEGAL here' : ''}</option>`).join('')}</optgroup>`).join('')}</select></label><label>Models<select id="b-models" data-fkey="b-models"></select></label><div class="endcell"><button class="btn pri" data-act="b-add">Add</button></div></div></div>
<details class="adv"><summary>List data for the collection file</summary><p class="hint">Id <code>${esc(b.id)}</code>${b.secondary ? ` · secondary detachment ${esc(b.secondary)}` : ''}. <button class="linkbtn" data-act="b-json">Copy this list's data</button> to paste into <code>data/muster.json</code> → <code>lists</code>.</p></details>
</div><aside><h3 class="sh">Rules check</h3>${flagList(lint)}
<h3 class="sh">Ownership</h3><ul class="flags">${cov.missing.length ? cov.missing.map(m => { const uc = unitCost(m.unit, m.models); return `<li>${tag('todo', 'short')} ${esc(uname(m.unit))} ×${m.models}${uc ? ` <span class="src">${range(uc.lo, uc.mid)} at ${dshort(PRICE_DATE)}</span>` : ''}</li>`; }).join('') : '<li class="ok">✓ Every entry is covered by owned models.</li>'}${cov.hobby.map(h => `<li>${tag('warn', h.paint === 'unassembled' ? 'on sprue' : h.paint)} ${esc(uname(h.unit))}</li>`).join('')}</ul>
<p class="hint">${esc(capsLine(lint))}</p></aside></div>`;
  };
  function builderMut(fn, silent) { const b = LS.get('muster.builder', null) || builderState({}); fn(b); LS.set('muster.builder', b); if (!silent) render(true); }

  // ----- BUY -----
  const FEED_PAGE = 40;
  VIEWS.buy = (parts, q) => {
    const gaps = allGaps(), games = D.games, thr = STORE.games.rule.threshold, override = LS.get('muster.buyOverride', false), paused = games < thr && !override;
    const f = q.f || 'flagged', all = q.all === '1';
    const ann = FEED.rows.map(x => ({ x, a: annotate(x, gaps) }));
    const sets = { flagged: ann.filter(r => r.a.worth.length || r.a.dnb.length), buy: ann.filter(r => r.x.verdict === 'BUY'), chaos: ann.filter(r => /chaos|daemon|death guard|thousand sons|world eaters|emperor's children/i.test(r.x.faction || '')), all: ann };
    const set = (sets[f] || sets.flagged).slice().sort((a, b) => (b.a.dnb.length ? 1 : 0) - (a.a.dnb.length ? 1 : 0) || (b.a.worth.length - a.a.worth.length) || ((b.x.valueRatio || 0) - (a.x.valueRatio || 0)));
    const shown = all ? set : set.slice(0, FEED_PAGE);
    const listCells = g => Object.entries(g.lists).map(([id, n]) => `${id} ×${n}`).join(' · ');
    return `
<div class="vh"><h2>Buy</h2></div>
<div class="banner ${paused ? 'paused' : ''}"><span>${paused ? `<b>Buying is paused by a house rule:</b> ${thr} games before the next model — ${games} logged, counting ${esc(STORE.games.rule.counts_from)}. Nothing below is hidden; it just waits.` : override ? `House rule overridden on this device (${games} of ${thr} games).` : `${games} games logged — the ${thr}-games rule is satisfied.`} <button class="linkbtn" data-act="override">${override ? 'Respect the rule again' : paused ? 'Override on this device' : ''}</button></span></div>
<h3 class="sh">What the lists still need</h3>
<p class="lead">Priced from the last read-only scout (${dshort(PRICE_DATE)}, landed = price + shipping, US-shippable, Buy-It-Now only — auctions, the scout's flagged listings and part-kits are excluded because a bid is not a price and bits are not a unit). Every stored price is a dated floor: re-run the scout before buying.</p>
<ul class="rows gaprows">${gaps.map(g => { const uc = unitCost(g.unit, g.models); const u = unitById(g.unit) || {}; return row(null, `<span class="name">${esc(uname(g.unit))}</span> ${g.inbound ? tag('inb', 'inbound crate may cover') : ''}${u.verify ? ' ' + tag('warn', 'verify pts') : ''}`, uc ? `${range(uc.lo, uc.mid)}${uc.boxes > 1 ? ` · ${uc.boxes} lots` : ''}<br><span class="muted">${uc.n} of ${uc.of} listings usable</span>` : '<span class="muted">no price on file</span>', esc(dot(`need up to ×${g.models}`, `for ${listCells(g)}`, u.legality === 'thrall' ? 'Chaos Space Marines' : null))); }).join('')}</ul>
<h3 class="sh">Do not buy</h3>
<ul class="flags">${STORE.buying.do_not_buy.map(d => `<li><span class="lv error">skip</span><b>${esc(d.match)}</b> — ${esc(d.why)}</li>`).join('')}${(STORE.buying.closed_paths || []).map(c => `<li><span class="lv info">closed</span>${dshort(c.date)}: ${esc(c.what)}</li>`).join('')}</ul>
<div class="vh"><h3 class="sh">The market feed</h3><div class="tools"><a class="linkbtn" href="scorecard.html">Full scorecard</a><a class="linkbtn" href="chaos.html">Chaos-only scorecard</a></div></div>
<p class="lead">${FEED.rows.length} painted-army listings from the ${esc(dshort((FEED.meta && FEED.meta.scanned) || ''))} category scan (photo tiers checked ${esc(dshort((FEED.meta && FEED.meta.photoSweep) || ''))}); most have long since ended — the method is the point. <b>How to read a card:</b> landed = price + estimated shipping; the value score is kit retail × paint premium ÷ landed price (BUY at 1.5× or better, FAIR from 0.8, else SKIP; auctions and unpointed titles stay unscored); the paint tier is judged from the gallery where “checked”, otherwise assumed Tabletop+; OBO = or best offer. Judge paint from the gallery, never the title.</p>
<div class="chipbar" role="toolbar" aria-label="Feed filter">${[['flagged', 'Worth a look or a warning', sets.flagged.length], ['buy', 'BUY-grade value', sets.buy.length], ['chaos', 'Chaos factions', sets.chaos.length], ['all', 'Everything', sets.all.length]].map(([k, l2, n]) => `<button data-act="buyfilter" data-f="${k}" data-fkey="bf-${k}" aria-pressed="${k === f}">${l2}<b>${n}</b></button>`).join('')}</div>
${shown.length ? `<div class="cards">${shown.map(({ x, a }) => `<article class="cardx feed ${a.dnb.length ? 'dnb' : a.worth.length ? 'gap' : ''}">
<p class="price"><b>landed ${usd(Math.round(x.landedUSD || 0))}</b> · ${esc(x.verdict)}${x.valueRatio ? ` ${Number(x.valueRatio).toFixed(2)}×` : ''} · ${esc(x.paintTier || '?')} ${x.paintTierAssumed ? '(assumed)' : '(checked)'}${x.points ? ` · ${pts(x.points)} pts` : ''}</p>
${a.dnb.map(d => `<p>${tag('dnb', 'do not buy')} ${esc(d.why)}</p>`).join('')}
${a.worth.length ? `<p>${tag('gapt', 'fills a gap')} ${a.worth.map(h => `${esc(uname(h.unit))} for ${Object.keys(h.lists).join(', ')}`).join(' · ')}</p>` : ''}
${a.overkill.length ? `<p>${tag('inb', 'mentions')} ${a.overkill.map(h => esc(uname(h.unit))).join(', ')} — a whole army for a small gap; not a way to buy it</p>` : ''}
${a.auction ? `<p>${tag('warn', 'auction')} a current bid is not a price.</p>` : ''}${a.printed ? `<p>${tag('warn', 'proxy / print?')} title or notes mention printing, proxies or recasts.</p>` : ''}
<h3><a href="${ebay(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a></h3>
<p class="meta">${esc(x.faction || '?')} · listed ${esc(x.priceDisplay || usd(x.priceUSD || 0))} · snapshot ${esc(dshort((FEED.meta && FEED.meta.scanned) || ''))}${x.notes ? ` · ${esc(x.notes)}` : ''}</p></article>`).join('')}</div>
${set.length > shown.length ? `<p class="hint">Showing ${shown.length} of ${set.length}. <a href="#/buy?f=${esc(f)}&all=1">Show all ${set.length}</a></p>` : ''}` : `<p class="muted">Nothing in this snapshot matches. That is an honest answer for a feed of whole painted armies — single units are found by targeted scouting (tools/ebay_search.js, read-only, from a machine that can reach eBay).</p>`}`;
  };

  // ----- CRATES / ORDERS -----
  VIEWS.crates = (parts, q) => {
    if (parts[1]) return crateMode(parts[1]);
    const delivered = STORE.orders.filter(o => o.status === 'delivered'), drafts = LS.get('muster.crates', {});
    return `
<div class="vh"><h2>Crates</h2><div class="tools"><a class="btn ghost" href="#/orders">All orders</a></div></div>
<p class="lead">${D.inbound.length} inbound · ${usd(D.inTransit, D.inbound.some(o => o.approx))} in transit · a crate's contents stay “pending” until you tick them off in crate mode — the collection never guesses a count.</p>
<div class="cards fit">${D.inbound.map(o => { const s = etaState(o), dr = (drafts[o.id] || { rows: [] }).rows.length; return `<article class="cardx clickable"><h3><a class="cover" href="#/crates/${esc(o.id)}">${esc(o.item)}</a></h3>
<p class="meta">${esc(dot(`ordered ${dshort(o.date)}`, usd(o.cost_usd, o.approx) + (o.cost_note ? ` (${o.cost_note})` : ''), o.state))}</p>
<p><span class="ticks"><span class="${s.cls}">●</span></span> ${esc(dot(s.text, o.eta_note, o.shipped ? `shipped ${dshort(o.shipped)}${o.carrier ? ' via ' + o.carrier : ''}` : null))}</p>
<p class="muted">${esc(o.expected || 'Contents pending.')}</p>
<p class="acts">${dr ? tag('warn', `draft in progress: ${plural(dr, 'row')}`) + ' ' : ''}<span class="linkbtn">Open the crate ›</span></p></article>`; }).join('') || '<p class="muted">Nothing inbound. The rule stands: ten games.</p>'}</div>
<h3 class="sh">Delivered</h3>
<ul class="rows">${delivered.map(o => row(`#/crates/${esc(o.id)}`, esc(o.item), `${usd(o.cost_usd, o.approx)} · delivered ${dshort(o.delivered)}`, esc(dot(o.cost_note, o.state, o.note)))).join('')}</ul>`;
  };
  VIEWS.orders = () => {
    const approxN = STORE.orders.filter(o => o.approx).length;
    return `
<div class="vh"><h2>Orders</h2><div class="tools"><a class="btn ghost" href="codex-umbral-creed.html#ledger">The ledger in the codex</a></div></div>
<p class="lead">${plural(STORE.orders.length, 'order')} · ${usd(D.spent, true)} landed in total (≈ because ${plural(approxN, 'cost is', 'costs are')} recorded as approximate) · ${usd(D.inTransit, D.inbound.some(o => o.approx))} of it still in transit.</p>
<div class="scroll wideonly"><table class="tbl orders"><thead><tr><th>Date</th><th>Order</th><th class="n">Cost</th><th>State</th><th>Status</th></tr></thead><tbody>
${STORE.orders.map(o => `<tr data-act="go" data-href="#/crates/${esc(o.id)}" tabindex="0"><td class="mono nowrap">${dshort(o.date)}</td><td><span class="name">${esc(o.item)}</span><span class="sub">${esc(o.note || o.expected || '')}</span></td><td class="n">${usd(o.cost_usd, o.approx)}<span class="sub">${esc(o.cost_note || '')}</span></td><td>${esc(o.state)}</td><td>${esc(etaState(o).text)}<span class="sub">${esc(o.eta_note || '')}</span></td></tr>`).join('')}
</tbody></table></div>
<ul class="rows narrowonly">${STORE.orders.map(o => row(`#/crates/${esc(o.id)}`, `${esc(o.item)}`, `${usd(o.cost_usd, o.approx)}<br>${dshort(o.date)}`, esc(dot(o.cost_note, o.state, etaState(o).text, o.eta_note, o.note || o.expected)))).join('')}</ul>
<h3 class="sh">Options that closed</h3><ul class="flags">${(STORE.buying.closed_paths || []).map(c => `<li><span class="lv info">${dshort(c.date)}</span>${esc(c.what)}</li>`).join('') || '<li>None recorded.</li>'}</ul>
<p class="lead">${esc(STORE.buying.remaining_gaps_note || '')}</p>`;
  };

  function crateDraft(oid) { const all = LS.get('muster.crates', {}); if (!all[oid]) { all[oid] = { rows: [], delivered: TODAY, note: '' }; LS.set('muster.crates', all); } return all[oid]; }
  function crateMut(oid, fn, silent) { const all = LS.get('muster.crates', {}); all[oid] = all[oid] || { rows: [], delivered: TODAY, note: '' }; fn(all[oid]); LS.set('muster.crates', all); if (!silent) render(true); }
  function quickUnits(o) {
    const exp = o.expected_units || [];
    const q = exp.map(u => { const un = unitById(u); return un ? [u, Math.min(...un.sizes.map(s => s.models))] : null; }).filter(Boolean);
    for (const [u, m] of [['bloodletters', 10], ['flesh_hounds', 5], ['bloodcrushers', 3], ['skullmaster', 1], ['nurglings', 3]]) if (!q.some(x => x[0] === u)) q.push([u, m]);
    return q.slice(0, 6);
  }
  function crateMode(oid) {
    const o = orderById(oid); if (!o) return `<p>No order “${esc(oid)}”. <a href="#/crates">Back</a>.</p>`;
    const inv = STORE.inventory.filter(i => i.order === oid);
    if (o.status === 'delivered') return `
<div class="vh"><h2>${esc(o.item)}</h2><div class="tools"><a class="btn ghost" href="#/crates">All crates</a></div></div>
<p class="lead">${esc(dot(`Ordered ${dshort(o.date)}`, usd(o.cost_usd, o.approx) + (o.cost_note ? ` (${o.cost_note})` : ''), `delivered ${dshort(o.delivered)}`, o.state))}</p>${o.note ? `<p>${esc(o.note)}</p>` : ''}
<h3 class="sh">What it became</h3><ul class="rows became">${inv.map(i => row(`#/collection?open=${esc(i.id)}`, `${esc(uname(i.unit))} ${paintTag(i.paint)}`, `${i.approx ? '≈' : ''}${plural(i.models, 'model')}`, esc(i.note || ''))).join('') || row(null, '<span class="muted">No collection entries point at this order.</span>', '')}</ul>`;
    const d = crateDraft(oid), quick = quickUnits(o), last = LS.get('muster.lastUnit', 'bloodletters');
    return `
<div class="vh"><h2>Crate: ${esc(o.item)}</h2><div class="tools"><a class="btn ghost" href="#/crates">All crates</a></div></div>
<p class="lead">${esc(dot(`Ordered ${dshort(o.date)}`, usd(o.cost_usd, o.approx) + (o.cost_note ? ` (${o.cost_note})` : ''), etaState(o).text))}. Expected: ${esc(sentence(o.expected) || 'unknown')}. Tick what actually came out of the box — count models, judge paint honestly (a squad with any bare or primed models is not “painted”), add anything unlisted. Nothing changes until you save; then export the file or copy the change for a session.</p>
<h3 class="sh">In the box</h3>
<div class="scroll"><table class="tbl stack"><thead><tr><th>Unit</th><th class="n">Models</th><th>Paint</th><th>Note</th><th><span class="sr">Remove</span></th></tr></thead><tbody>
${d.rows.map((r, n) => `<tr><td class="namecell"><span class="name">${esc(uname(r.unit))}</span></td><td class="n"><input type="number" inputmode="numeric" step="1" min="1" value="${r.models}" data-crow="${n}" data-ckey="models" data-fkey="cm-${n}" aria-label="models"></td><td><select data-crow="${n}" data-ckey="paint" data-fkey="cp-${n}" aria-label="paint">${STORE.hobby.paint_states.map(p => `<option${p === r.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></td><td class="opts"><input data-crow="${n}" data-ckey="note" data-fkey="cn-${n}" value="${esc(r.note || '')}" aria-label="note" placeholder="e.g. unlisted find, one arm missing"></td><td class="rm"><button class="btn ghost icon" data-act="c-del" data-n="${n}" aria-label="remove ${esc(uname(r.unit))}">✕</button></td></tr>`).join('') || `<tr><td colspan="5" class="muted">Nothing ticked yet. Use the quick buttons or the picker below.</td></tr>`}
</tbody></table></div>
<div class="chipbar" aria-label="Quick add">${quick.map(([u, m]) => `<button data-act="c-quick" data-unit="${u}" data-models="${m}" data-fkey="cq-${u}">+ ${esc(uname(u))} ×${m}</button>`).join('')}</div>
<div class="f"><div class="row3"><label>Add any unit<select id="c-unit" data-fkey="c-unit">${STORE.units.map(u => `<option value="${esc(u.id)}"${u.id === last ? ' selected' : ''}>${esc(u.name)}${u.legality === 'banned' ? ' (illegal in Shadow Legion — still worth recording)' : ''}</option>`).join('')}</select></label><label>Models<input id="c-models" data-fkey="c-models" type="number" inputmode="numeric" step="1" min="1" value="1"></label><div class="endcell"><button class="btn" data-act="c-add">Add row</button></div></div>
<div class="row2"><label>Delivered on<span class="withbtn"><input type="date" data-cmeta="delivered" data-fkey="c-date" value="${esc(d.delivered)}">${d.delivered !== TODAY ? `<button class="linkbtn" data-act="c-today">today</button>` : ''}</span></label><label>Order note<input data-cmeta="note" data-fkey="c-onote" value="${esc(d.note)}" placeholder="e.g. box crushed, seller refunded $10"></label></div></div>
<p class="acts"><button class="btn pri" data-act="c-save" id="c-save"${d.rows.length ? '' : ' disabled'}>${saveLabel(d)}</button> <span class="hint">Kept on this device; then export the file or copy the change from More.</span></p>`;
  }
  const saveLabel = d => d.rows.length ? `Save: mark delivered + add ${plural(d.rows.length, 'entry', 'entries')}` : 'Tick at least one unit to save';

  // ----- HOBBY -----
  VIEWS.hobby = (parts, q) => {
    const l = listById(q.list || 'F') || STORE.lists[0], s = listStatus(l);
    const rows = STORE.inventory.filter(i => i.status === 'owned');
    return `
<div class="vh"><h2>Hobby</h2><div class="tools"><a class="btn ghost" href="vision.html#doing-it-four-phases">The painting plan</a></div></div>
<p class="lead">Not a backlog — a queue driven by the list you want to field fully painted. Paint states change the collection on this device; export when done.</p>
<div class="chipbar" role="toolbar" aria-label="Target list">${STORE.lists.map(x => `<button data-act="hobbylist" data-list="${esc(x.id)}" data-fkey="hl-${esc(x.id)}" aria-pressed="${x.id === l.id}">${esc(x.id)}<b>${listStatus(x).cov.hobby.length}</b></button>`).join('')}</div>
<h3 class="sh">Between you and a painted ${esc(l.id)} · ${esc(l.name)}</h3>
<ul class="flags">${s.cov.hobby.length ? s.cov.hobby.map(h => { const qi = (STORE.hobby.queue || []).find(x => x.inventory === h.inv); return `<li>${tag('warn', h.paint === 'unassembled' ? 'on sprue' : h.paint)} <b>${esc(uname(h.unit))}</b>${qi ? ` — ${esc(qi.task.replace(/^[^:]+:\s*/, ''))}${qi.est_hours ? ` · ≈${qi.est_hours[0]}–${qi.est_hours[1]} h` : ''}${qi.note ? `<span class="src">${esc(qi.note)}</span>` : ''}` : ''}</li>`; }).join('') : s.cov.missing.length ? `<li>${esc(l.id)} is short of models first: ${esc(gapWords(s.cov.missing))}.</li>` : `<li class="ok">✓ Everything in ${esc(l.id)} is built and painted.</li>`}</ul>
<h3 class="sh">Standing queue</h3>
<ul class="flags">${(STORE.hobby.queue || []).map(x => `<li>${esc(x.task)}${x.est_hours ? ` · ≈${x.est_hours[0]}–${x.est_hours[1]} h` : ''}${x.unlocks ? ` · unlocks ${x.unlocks.join(', ')}` : ''}${x.note ? `<span class="src">${esc(x.note)}</span>` : ''}</li>`).join('')}</ul>
<h3 class="sh">Paint state per entry</h3>
<div class="scroll"><table class="tbl units"><thead><tr><th>Unit</th><th class="n">#</th><th>Paint</th></tr></thead><tbody>
${rows.map(i => `<tr><td><span class="name">${esc(uname(i.unit))}</span>${i.note ? `<span class="sub clamp">${esc(i.note)}</span>` : ''}</td><td class="n">${i.approx ? '≈' : ''}${i.models}</td><td><select data-field="paint" data-inv="${esc(i.id)}" data-fkey="hp-${esc(i.id)}" aria-label="paint state of ${esc(uname(i.unit))}">${STORE.hobby.paint_states.map(p => `<option${p === i.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></td></tr>`).join('')}
</tbody></table></div>`;
  };

  // ----- GAMES -----
  VIEWS.games = () => {
    const g = STORE.games, log = g.log || [], lastList = LS.get('muster.lastList', 'A');
    return `
<div class="vh"><h2>Games</h2></div>
<p class="lead"><b class="mono">${log.length} of ${g.rule.threshold}</b> — ${esc(g.rule.name)}, counting ${esc(g.rule.counts_from)}. ${esc(g.rule.override_note || '')}</p>
<form class="f narrowf" data-form="game"><div class="row3"><label>Date<input type="date" name="date" value="${TODAY}" required data-fkey="g-date"></label><label>List<select name="list" data-fkey="g-list">${STORE.lists.concat(deviceLists()).map(l => `<option value="${esc(l.id)}"${l.id === lastList ? ' selected' : ''}>${esc(l.id)} · ${esc(l.name)}</option>`).join('')}</select></label><label>Result<select name="result" data-fkey="g-result"><option value="W">Win</option><option value="L">Loss</option><option value="D">Draw</option></select></label></div>
<div class="row2"><label>Opponent<input name="opponent" data-fkey="g-opp" placeholder="faction or player, e.g. Necrons"></label><label>Score<input name="score" data-fkey="g-score" placeholder="e.g. 62–48"></label></div>
<label>One lesson<textarea name="lesson" data-fkey="g-lesson" placeholder="e.g. Battle-shock the contesters, not the champions."></textarea></label>
<div><button class="btn pri" type="submit">Log the game</button> <span class="hint">kept on this device until you export</span></div></form>
<h3 class="sh">The record</h3>
<ul class="rows">${log.slice().reverse().map((x, n) => row(null, `<b>${esc({ W: 'Win', L: 'Loss', D: 'Draw' }[x.result] || x.result)}</b> vs ${esc(x.opponent || '?')} · list ${esc(x.list)}${x.score ? ' · ' + esc(x.score) : ''}`, `${dshort(x.date)} <button class="btn ghost icon" data-act="g-del" data-n="${log.length - 1 - n}" aria-label="remove this game">✕</button>`, esc(x.lesson || ''))).join('') || row(null, '<span class="muted">No games logged. The rule stands.</span>', '')}</ul>`;
  };

  // ----- LIBRARY + GLOSSARY -----
  const LIB = [['Doctrine — how this army fights', [['codex-umbral-creed.html', 'Codex: The Umbral Creed', 'the army book — lore, unit entries, three doctrines, the ledger'], ['quartermaster.html', 'The army page', 'audited inventory, the six lists, verified rules, the road'], ['strategy.html', 'Day-one strategy note (Jul 20)', 'archived; superseded by the Primer']]],
    ['Learn to play', [['primer.html', 'The Primer', "a first-time player's guide to the army rule, the detachment and each list"], ['guide.html', 'The Primer as 31 printable pages', 'print layout; also as GUIDE.pdf'], ['#/glossary', 'Glossary', 'the jargon on these pages, one line each']]],
    ['Rules', [['rules-guide.html', "Be'lakor & the Shadow Legion explained", 'who he is, how the rules work, why lists look the way they do'], ['research.html', 'Rules research + re-verification (Jul 27)', 'verbatim Thralls text, the Epic Hero list, the points table']]],
    ['Painting, basing, transport', [['vision.html', 'One Legion of Shadow — the vision', 'five painting rules, unit-by-unit treatments, four phases, magnets and boxes']]],
    ['The market, and how to read it', [['scorecard.html', 'Painted-army scorecard', 'all factions, value-scored'], ['chaos.html', 'Chaos-only scorecard', 'deep-scored'], ['scout.html', 'Scout report (Jul 27)', 'graded single-unit targets; the method still holds'], ['sweep-2026-07-21.html', 'Photo paint-tier sweep', 'why titles lie'], ['ebay-access.html', 'Reaching eBay from a cloud session', 'method note']]],
    ['This build', [['decisions.html', 'Decisions log', 'proposal, dedupe map, design tournament, review batteries'], ['spec.html', 'The Muster spec', 'the brief this app answers'], ['archive.html', 'Archive', 'every dated snapshot with its status'], ['context.html', 'Context', 'the cross-account hand-off note']]]];
  VIEWS.library = () => `<div class="vh"><h2>Library</h2></div><p class="lead">Prose stays prose. The documents both lines of work produced, grouped by the job they do.</p><div class="libgrid">${LIB.map(([h, items]) => `<section><h3 class="sh">${esc(h)}</h3><ul class="rows index-rows">${items.map(([href, t, sub]) => row(href, esc(t), '›', esc(sub))).join('')}</ul></section>`).join('')}</div>`;
  VIEWS.glossary = () => `<div class="vh"><h2>Glossary</h2><div class="tools"><a class="btn ghost" href="#/library">Library</a></div></div><p class="lead">The words these pages use, in one line each. Rules gists are paraphrases with sources — the official app has the text.</p><dl class="gloss">${(STORE.glossary || []).map(g => `<dt>${esc(g.term)}</dt><dd>${esc(g.means)}</dd>`).join('')}</dl>`;

  // ----- MORE -----
  VIEWS.more = () => {
    const hobbyN = D.notReady.length, theme = LS.get('muster.theme', 'system'), skin = LS.get('muster.skin', '');
    const idx = [['#/hobby', 'Hobby', hobbyN ? `${plural(hobbyN, 'entry', 'entries')} not table-ready` : 'all table-ready', 'the queue between you and a painted list'], ['#/games', 'Games', `${D.games} of ${STORE.games.rule.threshold} played`, 'the log, and the rule that gates buying'], ['#/orders', 'Orders', `${plural(STORE.orders.length, 'order')} · ${D.inbound.length} inbound · ${usd(D.spent, true)}`, 'the full ledger and the options that closed'], ['#/build', 'Builder', deviceLists().length ? `${plural(deviceLists().length, 'list')} on this device` : 'draft a list', 'the rules check runs as you compose'], ['#/library', 'Library', `${LIB.reduce((s, x) => s + x[1].length, 0)} documents`, 'codex, primer, rules, vision, market method'], ['#/glossary', 'Glossary', `${(STORE.glossary || []).length} terms`, 'MFM, Thralls, Dreadblades, on sprue, landed…'], ['codex-umbral-creed.html', 'The codex as a book', 'parchment, printable', 'the fiction and the ledger, linear']];
    return `
<div class="vh"><h2>More</h2></div>
<ul class="rows index-rows">${idx.map(([href, t, r, sub]) => row(href, esc(t), esc(r), esc(sub))).join('')}</ul>
<h3 class="sh">This device</h3>
${local ? `<div class="banner local"><span><b>${plural(local.changes.length, 'change')} kept in this browser</b> since data ${esc(dshort(STORE.meta.updated))}. Git is the database: export the file (replace <code>data/muster.json</code>, run <code>python3 build.py</code>, commit) or copy the change into a Claude session. After the rebuild this page recognises what landed and clears it; anything that did not land is re-applied on top, never dropped.</span></div>
<p class="acts"><button class="btn pri" data-act="export">Export muster.json</button> <button class="btn" data-act="patch">Copy the change for a session</button> <button class="btn ghost" data-act="discard">Discard local changes</button></p>
<pre class="out">${esc(local.changes.map((c, n) => `${n + 1}. ${c.text}`).join('\n'))}</pre>` : '<p class="muted">No local changes. What you see is the repo data.</p>'}
${STALE ? `<div class="banner"><span><b>Parked:</b> ${plural(STALE.changes.length, 'change')} recorded against older data could not be re-applied automatically (the entries they touch no longer exist). They stay here until you copy or discard them.</span><span><button class="btn" data-act="stalecopy">Copy them</button> <button class="btn ghost" data-act="stalediscard">Discard</button></span></div><pre class="out">${esc(STALE.changes.map((c, n) => `${n + 1}. ${c.text}`).join('\n'))}</pre>` : ''}
<h3 class="sh">Hand-off</h3>
<p class="lead">Sessions, artifacts and memory stay inside the Claude account that made them; the repo does not care. Paste the briefing into a session from either account and it starts on the same page.</p>
<p class="acts"><button class="btn" data-act="briefing">Copy briefing</button> <button class="btn ghost" data-act="prompt">Copy the new-session prompt</button></p>
<h3 class="sh">Display</h3>
<div class="f narrowf"><div class="row2"><label>Theme<select data-setting="theme" data-fkey="s-theme">${['system', 'light', 'dark'].map(t => `<option${t === theme ? ' selected' : ''}>${t}</option>`).join('')}</select></label><label>Skin<select data-setting="skin" data-fkey="s-skin"><option value=""${!skin ? ' selected' : ''}>tool (default)</option><option value="codex"${skin === 'codex' ? ' selected' : ''}>codex — parchment and serif</option></select></label></div></div>
<h3 class="sh">About</h3>
<p class="lead">Muster reads one file, <code>data/muster.json</code>, plus the market feed; the tables on the prose pages are generated from the same file by <code>muster.py</code>, and the rules check is one implementation (<code>lint.js</code>) shared with the validation script. Repo <code>evbarleyg/40k-armies</code> — collaborators <code>evbarleyg</code> (personal, admin) and <code>ebg-ant</code> (work-linked). Rules gists are paraphrases with sources; the official app has the text.</p>`;
  };
  function briefing() {
    const st = STORE.lists.map(l => { const s = listStatus(l); return `${l.id} ${l.name}: ${pts(s.lint.total)} · ${s.legal ? 'passes rules check' : 'FAILS rules check'} · ${s.status}${s.cov.missing.length ? ' — needs ' + gapWords(s.cov.missing) : s.cov.hobby.length ? ' — hobby: ' + s.cov.hobby.map(h => `${uname(h.unit)} ${h.paint}`).join(', ') : ''}`; });
    return [`Muster briefing — ${STORE.meta.warband} — ${TODAY}`,
      `Data: data/muster.json (updated ${STORE.meta.updated}); points ${STORE.meta.points_snapshot}; rules verified ${STORE.rules.snapshot.verified}. ${STORE.rules.snapshot.recheck || ''}`,
      `Owned: ${D.records} entries, ${D.approxModels ? '≈' : ''}${D.modelsOwned} models, ${pts(D.fieldablePoints)} pts (${pts(D.readyPoints)} table-ready); spent ≈$${Math.round(D.spent)} over ${STORE.orders.length} orders.`,
      `Inbound: ${D.inbound.map(o => `${o.item} (${etaState(o).text})`).join('; ') || 'nothing'}.`,
      'Lists:', ...st.map(s => '  - ' + s),
      `Games: ${D.games}/${STORE.games.rule.threshold} (${STORE.games.rule.name}).`,
      alerts().length ? 'Notices: ' + alerts().map(a => a.text.replace(/<[^>]+>/g, '')).join(' | ') : '',
      local ? `Local changes in this browser, not yet in the repo (${local.changes.length}):\n` + local.changes.map((c, n) => `  ${n + 1}. ${c.text}`).join('\n') : 'No local changes pending.',
      'House rules: eBay is read-only (never log in, bid, offer, watch, message or check out); judge paint from full galleries, never titles; verify edition-current rules and cite them; explain jargon — the owner is new to 40K.'].filter(Boolean).join('\n');
  }
  const NEW_SESSION_PROMPT = 'Clone https://github.com/evbarleyg/40k-armies and read CLAUDE.md, docs/CONTEXT.md and data/muster.json before anything else — they hold my 40K army (Shadow Legion under Be\'lakor), the audited inventory and orders, the six lists, the eBay tooling and the house rules (eBay is read-only; judge paint from photos, never titles). Then: [what I want today]. Put facts in data/muster.json, run python3 build.py, commit and push; update docs/CONTEXT.md if the plan changed.';
  function patchText(changes) {
    return [`Apply these changes to data/muster.json in evbarleyg/40k-armies (recorded in Muster on ${TODAY}; base data ${STORE.meta.updated}):`, '',
      ...changes.map((c, n) => `${n + 1}. ${c.text}\n   patch: ${JSON.stringify(c.patch)}`), '',
      'Then bump meta.updated, run `python3 build.py` (it validates the store and regenerates muster.js and the doc tables), commit and push.'].join('\n');
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]'); if (th) { sortCycle(th.dataset.sort); return; }
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, { parts, q } = route();
    if (act === 'filter') location.hash = `#/collection?f=${el.dataset.f}`;
    else if (act === 'sortreset') { sortState = { key: 'store', dir: 1 }; LS.set('muster.sort2', sortState); render(true); }
    else if (act === 'open') { if (e.target.closest('select,a,button,input')) return; const id = el.dataset.id; const nq = new URLSearchParams(Object.assign({}, q, { open: q.open === id ? '' : id })); history.replaceState(null, '', `#/collection?${nq}`); render(true); }
    else if (act === 'go') location.hash = el.dataset.href;
    else if (act === 'csv') download('collection.csv', ['unit,models,approx,paint,status,order,note'].concat(STORE.inventory.map(i => [uname(i.unit), i.models, i.approx ? 'approx' : '', i.paint, i.status, i.order || '', (i.note || '').replace(/"/g, "'")].map(v => `"${v}"`).join(','))).join('\n'), 'text/csv');
    else if (act === 'copylist') { const l = listById(el.dataset.list) || (LS.get('muster.builder') || {}); if (l) copyText(listText(l), 'List'); }
    else if (act === 'devdel') { if (confirm('Delete this list from this device?')) { LS.set('muster.lists', deviceLists().filter(x => x.id !== el.dataset.list)); render(true); } }
    else if (act === 'buyfilter') location.hash = `#/buy?f=${el.dataset.f}`;
    else if (act === 'override') { LS.set('muster.buyOverride', !LS.get('muster.buyOverride', false)); render(true); }
    else if (act === 'hobbylist') location.hash = `#/hobby?list=${el.dataset.list}`;
    else if (act === 'b-add') { const uid = $('#b-unit').value, m = +$('#b-models').value || 1; LS.set('muster.lastUnit', uid); builderMut(b => b.entries.push({ id: 'n' + (Date.now() % 1e6).toString(36) + b.entries.length, unit: uid, models: m })); }
    else if (act === 'b-del') builderMut(b => { b.entries = b.entries.filter(x => x.id !== el.dataset.e); for (const x of b.entries) if (x.leads === el.dataset.e) delete x.leads; });
    else if (act === 'b-new') { if (confirm('Clear the builder and start a new list?')) { LS.del('muster.builder'); render(true); } }
    else if (act === 'b-save') { const b = LS.get('muster.builder'); if (STORE.lists.some(x => x.id === b.id)) b.id = newId(); const all = deviceLists().filter(x => x.id !== b.id); all.push(clone(b)); LS.set('muster.lists', all); LS.set('muster.builder', b); toast(`Saved “${b.name}” on this device`); render(true); }
    else if (act === 'b-copy') copyText(listText(LS.get('muster.builder')), 'List');
    else if (act === 'b-json') copyText(JSON.stringify(LS.get('muster.builder')), "This list's data");
    else if (act === 'c-quick') crateMut(parts[1], d => d.rows.push({ unit: el.dataset.unit, models: +el.dataset.models, paint: 'painted', note: '' }));
    else if (act === 'c-add') { const u = $('#c-unit').value, m = Math.max(1, Math.round(+$('#c-models').value || 1)); LS.set('muster.lastUnit', u); crateMut(parts[1], d => d.rows.push({ unit: u, models: m, paint: 'painted', note: '' })); }
    else if (act === 'c-del') crateMut(parts[1], d => d.rows.splice(+el.dataset.n, 1));
    else if (act === 'c-today') crateMut(parts[1], d => { d.delivered = TODAY; });
    else if (act === 'c-save') crateSave(parts[1]);
    else if (act === 'g-del') { const n = +el.dataset.n; const x = STORE.games.log[n]; if (x && confirm(`Remove the ${x.date} game vs ${x.opponent || '?'}?`)) commit(`games.log: remove ${x.date} vs ${x.opponent || '?'}`, { op: 'games.remove', value: clone(x) }); }
    else if (act === 'export') { const s = clone(STORE); s.meta.updated = TODAY; download('muster.json', JSON.stringify(s, null, 2)); toast('muster.json downloaded — replace data/muster.json, run python3 build.py, commit'); }
    else if (act === 'patch') copyText(patchText(local ? local.changes : []), 'The change');
    else if (act === 'discard') { if (confirm('Discard every local change on this device and go back to the repo data?')) { LS.del('muster.local'); LS.del('muster.crates'); location.reload(); } }
    else if (act === 'stalecopy') copyText(patchText(STALE.changes), 'Parked changes');
    else if (act === 'stalediscard') { if (confirm('Discard the parked changes for good?')) { LS.del('muster.stale'); STALE = null; render(true); } }
    else if (act === 'briefing') copyText(briefing(), 'Briefing');
    else if (act === 'prompt') copyText(NEW_SESSION_PROMPT, 'Prompt');
    else if (act === 'copyclose') { $('#copyfallback').hidden = true; }
  });
  function sortCycle(key) { sortState = sortState.key !== key ? { key, dir: 1 } : sortState.dir === 1 ? { key, dir: -1 } : { key: 'store', dir: 1 }; LS.set('muster.sort2', sortState); render(true); }
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-act]')) { e.preventDefault(); e.target.click(); }
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('th[data-sort]')) { e.preventDefault(); sortCycle(e.target.dataset.sort); }
    else if (e.key === 'Escape' && !$('#copyfallback').hidden) $('#copyfallback').hidden = true;
  });
  // text fields save silently (no re-render), so a tap on Save right after typing is never swallowed
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-bfield="name"]')) builderMut(b => { b.name = t.value; }, true);
    else if (t.matches('[data-crow][data-ckey="note"]')) crateMut(route().parts[1], d => { d.rows[+t.dataset.crow].note = t.value; }, true);
    else if (t.matches('[data-crow][data-ckey="models"]')) crateMut(route().parts[1], d => { d.rows[+t.dataset.crow].models = Math.max(1, Math.round(+t.value || 1)); }, true);
    else if (t.matches('[data-cmeta="note"]')) crateMut(route().parts[1], d => { d.note = t.value; }, true);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-field="paint"]')) { const id = t.dataset.inv, v = t.value; commit(`inventory[${id}].paint → ${v}`, { op: 'inventory.update', id, set: { paint: v } }); }
    else if (t.matches('[data-bfield="limit"]')) builderMut(b => { b.limit = +t.value; });
    else if (t.matches('[data-bentry]')) builderMut(b => { const en = b.entries.find(x => x.id === t.dataset.bentry); const k = t.dataset.bkey; if (k === 'models') en.models = +t.value; else if (k === 'warlord') { for (const x of b.entries) delete x.warlord; if (t.checked) en.warlord = true; } else if (t.value) en[k] = t.value; else delete en[k]; });
    else if (t.matches('#b-unit')) { LS.set('muster.lastUnit', t.value); fillModels(); }
    else if (t.matches('#c-unit')) LS.set('muster.lastUnit', t.value);
    else if (t.matches('[data-crow][data-ckey="paint"]')) crateMut(route().parts[1], d => { d.rows[+t.dataset.crow].paint = t.value; }, true);
    else if (t.matches('[data-crow][data-ckey="models"]')) { crateMut(route().parts[1], d => { d.rows[+t.dataset.crow].models = Math.max(1, Math.round(+t.value || 1)); }, true); t.value = Math.max(1, Math.round(+t.value || 1)); }
    else if (t.matches('[data-cmeta="delivered"]')) crateMut(route().parts[1], d => { d.delivered = t.value; }, true);
    else if (t.matches('[data-setting="theme"]')) { LS.set('muster.theme', t.value); applyDisplay(); }
    else if (t.matches('[data-setting="skin"]')) { LS.set('muster.skin', t.value); applyDisplay(); }
    else if (t.matches('[name="list"]')) LS.set('muster.lastList', t.value);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form="game"]'); if (!f) return; e.preventDefault();
    const fd = Object.fromEntries(new FormData(f)); const g = { date: fd.date, list: fd.list, result: fd.result, opponent: fd.opponent.trim(), score: fd.score.trim(), lesson: fd.lesson.trim() };
    if (g.date > TODAY) toast('That date is in the future — logged anyway');
    LS.set('muster.lastList', g.list);
    commit(`games.log: add ${g.date} ${g.result} vs ${g.opponent || '?'} (list ${g.list})`, { op: 'games.add', value: g });
  });
  window.addEventListener('hashchange', () => { const w = $('#copyfallback'); if (w) w.hidden = true; render(); });
  function fillModels() { const sel = $('#b-models'), u = unitById($('#b-unit') && $('#b-unit').value); if (!sel || !u) return; const cur = sel.value; sel.innerHTML = u.sizes.map(s => `<option>${s.models}</option>`).join(''); if ([...sel.options].some(o => o.value === cur)) sel.value = cur; }
  function crateSave(oid) {
    const d = crateDraft(oid), o = orderById(oid); if (!d.rows.length || !o) return;
    const stamp = Date.now().toString(36).slice(-4);
    const rows = d.rows.map((r, n) => { const x = { id: `i_${r.unit}_${oid}_${n + 1}_${stamp}`, unit: r.unit, models: Math.max(1, Math.round(+r.models || 1)), paint: r.paint, status: 'owned', order: oid }; if (r.note) x.note = r.note; return x; });
    const text = `orders[${oid}] (${o.item}) delivered ${d.delivered}${d.note ? ` (${d.note})` : ''}; inventory += ${rows.map(r => `${uname(r.unit)} ×${r.models} (${r.paint})`).join(', ')}`;
    commit(text, { op: 'crate.catalogue', order: oid, delivered: d.delivered, note: d.note || undefined, inventory: rows }, () => {
      const all = LS.get('muster.crates', {}); delete all[oid]; LS.set('muster.crates', all);
      location.hash = `#/crates/${oid}`; render();
    });
  }
  function applyDisplay() {
    const theme = LS.get('muster.theme', 'system'), skin = LS.get('muster.skin', '');
    if (theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
    if (skin) document.documentElement.dataset.skin = skin; else delete document.documentElement.dataset.skin;
  }

  // ---------- boot ----------
  applyDisplay(); render();
})();
