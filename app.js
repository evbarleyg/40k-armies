/* Muster — the console. Vanilla, classic script, opens from file:// or any static host.
   Reads window.MUSTER (store + price snapshot, from muster.py), window.SCORECARDS (market feed, from build.py)
   and window.MusterLint (the shared linter). Local edits live in a localStorage overlay until exported. */
(function () {
  'use strict';
  const L = window.MusterLint, SHIPPED = window.MUSTER;
  if (!L || !SHIPPED) { document.getElementById('view').innerHTML = '<p>muster.js or lint.js failed to load — run <code>python3 build.py</code>.</p>'; return; }

  // ---------- small utilities ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ebay = u => /^https:\/\/www\.ebay\.com\//.test(String(u)) ? esc(u) : '#';
  const clone = o => JSON.parse(JSON.stringify(o));
  const pts = n => Number(n || 0).toLocaleString('en-US');
  const money = (n, approx) => (approx ? '≈' : '') + '$' + (Math.round(n) === n ? Number(n).toLocaleString('en-US') : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const mrange = (a, b, partial) => `≈$${Math.round(a).toLocaleString('en-US')}${Math.round(b) !== Math.round(a) ? '–' + Math.round(b).toLocaleString('en-US') : ''}${partial ? '+' : ''}`;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dshort = iso => iso ? `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}` : '';
  const drange = eta => !eta || eta.length !== 2 ? 'no window' : (eta[0].slice(0, 7) === eta[1].slice(0, 7) ? `${dshort(eta[0])}–${+eta[1].slice(8)}` : `${dshort(eta[0])}–${dshort(eta[1])}`);
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const TODAY = todayISO();
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('Could not save on this device (storage blocked)'); } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* nothing to remove */ } }
  };
  function toast(msg) {
    let t = $('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  async function copyText(text, what) {
    try { await navigator.clipboard.writeText(text); toast(`${what || 'Text'} copied`); }
    catch (e) { const w = $('#copyfallback'); w.hidden = false; $('textarea', w).value = text; $('textarea', w).select(); toast('Select-all and copy'); }
  }
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- store + local overlay ----------
  function sig(store) { const s = JSON.stringify(store); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return `${store.meta.updated}:${s.length}:${h}`; }
  const BASE_SIG = sig(SHIPPED.store);
  let local = LS.get('muster.local', null), STALE_LOCAL = null, STORE;
  if (local && local.baseSig === BASE_SIG && local.store) STORE = local.store;
  else { if (local && local.changes && local.changes.length) STALE_LOCAL = local; local = null; STORE = clone(SHIPPED.store); }
  let D = L.derive(STORE);
  const PRICES = (SHIPPED.gapPrices && SHIPPED.gapPrices.units) || {}, PRICE_DATE = (SHIPPED.gapPrices && SHIPPED.gapPrices.date) || '';

  function commit(text, patch, mutate) {
    mutate(STORE);
    if (!local) local = { baseSig: BASE_SIG, store: STORE, changes: [] };
    local.store = STORE; local.changes.push({ at: new Date().toISOString(), text, patch });
    LS.set('muster.local', local);
    D = L.derive(STORE);
    toast(`Saved on this device · ${local.changes.length} unsynced change${local.changes.length === 1 ? '' : 's'}`);
    render(true);
  }
  const unitById = id => STORE.units.find(u => u.id === id);
  const orderById = id => STORE.orders.find(o => o.id === id);
  const listById = id => STORE.lists.find(l => l.id === id) || deviceLists().find(l => l.id === id);
  const deviceLists = () => LS.get('muster.lists', []);
  const uname = id => (unitById(id) || { name: id }).name;
  // "Shadow Legion Army Lot (Word Bearer theme, ~2,110 pts)" → "Shadow Legion Army Lot"; long names lose the tail on phones via CSS
  const shortItem = o => o.item.split(' (')[0].replace(/\s+×\d+.*$/, '');

  // ---------- derived helpers ----------
  function etaState(o) {
    if (o.status === 'delivered') return { cls: 'y', text: `delivered ${dshort(o.delivered)}` };
    const e = o.eta;
    if (!e || e.length !== 2) return { cls: 'h', text: 'no delivery window on file' };
    if (TODAY < e[0]) return { cls: '', text: `window ${drange(e)} · opens in ${daysBetween(TODAY, e[0])} day${daysBetween(TODAY, e[0]) === 1 ? '' : 's'}` };
    if (TODAY <= e[1]) return { cls: 'h', text: `window ${drange(e)} · today is inside it — may already be here` };
    return { cls: 'n', text: `window ${drange(e)} closed ${daysBetween(e[1], TODAY)} days ago — check tracking` };
  }
  function listStatus(l) {
    const r = D.lists[l.id] || { lint: L.lintList(STORE, l), coverage: L.coverage(STORE, l) };
    const owned = !r.coverage.missing.length, ready = owned && !r.coverage.hobby.length;
    return { lint: r.lint, cov: r.coverage, legal: r.lint.legal, owned, ready, status: r.coverage.status };
  }
  function gapCost(missing) {
    let min = 0, med = 0, priced = 0;
    for (const m of missing) { const p = PRICES[m.unit]; if (p) { min += p.min; med += p.med; priced++; } }
    return { min, med, priced, partial: priced < missing.length, none: !priced };
  }
  const gapWords = missing => missing.map(m => `${uname(m.unit)} ×${m.models}`).join(', ');
  function ticks(s) {
    const t = (ok, half) => ok ? '<span class="y">✓</span>' : half ? '<span class="h">◐</span>' : '<span class="n">✗</span>';
    return `<span class="ticks" title="legal · owned · built and painted">${t(s.legal)} legal ${t(s.owned)} owned ${t(s.ready, s.owned)} ready</span>`;
  }
  function unitUse() {
    const m = {};
    for (const l of STORE.lists) for (const e of l.entries) (m[e.unit] = m[e.unit] || new Set()).add(l.id);
    return m;
  }
  function alerts() {
    const out = [], R = STORE.rules.snapshot;
    const age = daysBetween(R.verified, TODAY);
    if (age > 45) out.push({ lvl: 'err', text: `<b>Points snapshot is ${age} days old</b> (verified ${dshort(R.verified)}). Re-verify in the official app before trusting any total.` });
    if (R.recheck) out.push({ text: `<b>Re-check:</b> ${esc(R.recheck)}` });
    for (const o of D.inbound) { const s = etaState(o); if (s.cls === 'h' || s.cls === 'n') out.push({ lvl: s.cls === 'n' ? 'err' : '', text: `<b>${esc(o.item)}</b> — ${esc(s.text)}. <a href="#/crates/${esc(o.id)}">Catalogue it when it lands →</a>` }); }
    for (const l of STORE.lists) { const s = listStatus(l); if (!s.legal) out.push({ lvl: 'err', text: `<b>List ${esc(l.id)} is not legal as stored:</b> ${esc(s.lint.flags.filter(f => f.level === 'error').map(f => f.msg).join('; ') || 'see its linter')} <a href="#/lists/${esc(l.id)}">open →</a>` }); }
    for (const c of (STORE.buying.closed_paths || [])) if (daysBetween(c.date, TODAY) <= 14) out.push({ text: `<b>${dshort(c.date)}:</b> ${esc(c.what)}` });
    if (STALE_LOCAL) out.push({ lvl: 'err', text: `<b>${STALE_LOCAL.changes.length} local change${STALE_LOCAL.changes.length === 1 ? ' from an older store version was' : 's from an older store version were'} set aside</b> — the repo store changed underneath them. <a href="#/more">Review, copy or discard them in More →</a>` });
    return out;
  }

  // ---------- market feed ----------
  const FEED = (() => {
    const S = window.SCORECARDS || {}, byId = new Map();
    for (const stem of ['listings', 'chaos']) for (const x of ((S[stem] || {}).listings || [])) { const prev = byId.get(x.itemId); byId.set(x.itemId, Object.assign({}, prev || {}, x, { editions: ((prev && prev.editions) || []).concat(stem) })); }
    return { rows: [...byId.values()], meta: (S.listings || S.chaos || {}).meta || null };
  })();
  const UNIT_WORDS = { skullmaster: /skullmaster/i, rendmaster: /rendmaster|blood\s*throne/i, bloodcrushers: /bloodcrusher|juggernaut/i, bloodletters: /bloodletter/i, flesh_hounds: /flesh\s*hound/i, warp_talons: /warp\s*talon/i, chosen: /\bchosen\b/i, chaos_terminators: /chaos\s+terminator|terminator\s+squad/i, chaos_lord_terminator: /lord\s+in\s+terminator|terminator\s+lord/i, beasts_of_nurgle: /beasts?\s+of\s+nurgle/i, plague_drones: /plague\s*drone/i, cultist_mob: /cultist/i, nurglings: /nurgling/i, seekers: /\bseekers?\b/i, raptors: /\braptors?\b/i, bloodthirster: /bloodthirster/i, chaos_lord: /chaos\s+lord/i };
  const DNB = [{ re: /skulltaker/i, why: "Skulltaker is an Epic Hero — illegal in Shadow Legion." }, { re: /karanak/i, why: "Karanak is an Epic Hero — illegal in Shadow Legion." }, { re: /skarbrand|kairos|rotigus|shalaxi|the masque|epidemius|changeling|blue scribes|syll'?esske/i, why: "Named daemon (Epic Hero) — dead points in this detachment; only Be'lakor is exempt." }];
  function allGaps() {
    const g = {};
    for (const l of STORE.lists) { const s = listStatus(l); for (const m of s.cov.missing) { (g[m.unit] = g[m.unit] || { unit: m.unit, models: 0, lists: new Set() }); g[m.unit].models = Math.max(g[m.unit].models, m.models); g[m.unit].lists.add(l.id); } }
    const expected = new Set(D.inbound.flatMap(o => o.expected_units || []));
    for (const x of Object.values(g)) x.inbound = expected.has(x.unit);
    return Object.values(g).sort((a, b) => (a.inbound - b.inbound) || b.lists.size - a.lists.size || uname(a.unit).localeCompare(uname(b.unit)));
  }
  function annotate(x, gaps) {
    const hits = gaps.filter(g => UNIT_WORDS[g.unit] && UNIT_WORDS[g.unit].test(x.name));
    const dnb = DNB.filter(d => d.re.test(x.name));
    return { hits, dnb, auction: /auction/i.test(x.type || '') || x.verdict === 'AUCTION', printed: /3d print|printed|proxy/i.test(`${x.name} ${x.notes || ''}`) };
  }

  // ---------- rendering ----------
  const NAV = [['home', 'Home', '#/'], ['collection', 'Collection', '#/collection'], ['lists', 'Lists', '#/lists'], ['buy', 'Buy', '#/buy'], ['crates', 'Crates', '#/crates'], ['more', 'More', '#/more']];
  const MORE_VIEWS = new Set(['more', 'hobby', 'games', 'orders', 'library', 'build']);
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  let lastPath = null;
  function render(keepScroll) {
    const { parts, q } = route(); const v = VIEWS[parts[0]] ? parts[0] : 'home';
    const navKey = MORE_VIEWS.has(v) ? 'more' : v === 'lists' || v === 'build' ? (v === 'build' ? 'lists' : 'lists') : v;
    const badges = { crates: D.inbound.length || '', more: (D.lists && Object.values(D.lists).some(r => r.coverage.hobby.length)) || (local && local.changes.length) ? '•' : '' };
    for (const nav of [$('.topnav'), $('.tabbar')]) nav.innerHTML = NAV.map(([k, label, href]) => `<a href="${href}"${k === navKey ? ' aria-current="page"' : ''}>${label}${badges[k] ? `<span class="badge">${badges[k]}</span>` : ''}</a>`).join('');
    const R = STORE.rules.snapshot, age = daysBetween(R.verified, TODAY);
    $('.mast .meta').innerHTML = `<b>${esc(STORE.meta.points_snapshot.replace(/\s*\(.*?\)/, ''))}</b> points · <span class="${age > 45 ? 'stale' : ''}">rules verified ${dshort(R.verified)} (${age}d ago)</span> · audited ${dshort(STORE.meta.audited)} · store ${dshort(STORE.meta.updated)}${local ? ` · <span class="stale">${local.changes.length} local edit${local.changes.length === 1 ? '' : 's'}</span>` : ''}`;
    let html;
    try { html = VIEWS[v](parts, q); } catch (err) { html = `<p>Something in this view broke: <code>${esc(err.message)}</code>. The data is fine; <a href="#/">go home</a>.</p>`; console.error(err); }
    $('#view').innerHTML = html;
    document.title = `Muster · ${v === 'home' ? 'the Long Shadow Host' : v}`;
    const path = parts.join('/');
    if (!keepScroll && path !== lastPath) window.scrollTo(0, 0);
    lastPath = path;
    const ep = STORE.meta.epigraphs || []; $('.marg').textContent = ep.length ? ep[(new Date().getDate()) % ep.length] : '';
  }
  const tag = (cls, text) => `<span class="tag ${cls}">${esc(text)}</span>`;
  const paintTag = p => L.NOT_READY_PAINT.has(p) ? tag('todo', p === 'unassembled' ? 'on sprue' : p) : tag('paint', p);
  const listLine = (l, s) => `${esc(l.id)} · ${esc(l.name)}`;

  const VIEWS = {};

  // ----- HOME -----
  VIEWS.home = () => {
    const al = alerts();
    const inv = STORE.inventory.filter(i => i.status === 'owned');
    const notReady = inv.filter(i => L.NOT_READY_PAINT.has(i.paint));
    const approx = inv.filter(i => i.approx).concat(D.unfieldable.map(x => STORE.inventory.find(i => i.id === x.inv)).filter(i => i && !i.approx));
    const statuses = STORE.lists.map(l => ({ l, s: listStatus(l) }));
    const order = { ready: 0, hobby: 1, buy: 2 };
    statuses.sort((a, b) => order[a.s.status] - order[b.s.status] || a.l.id.localeCompare(b.l.id));
    const ready = statuses.filter(x => x.s.status === 'ready');
    const games = D.games, thr = STORE.games.rule.threshold, paused = games < thr && !LS.get('muster.buyOverride', false);
    const buyable = statuses.filter(x => x.s.status === 'buy' && x.s.legal).map(x => ({ x, c: gapCost(x.s.cov.missing) })).filter(y => !y.c.none).sort((a, b) => (a.c.partial - b.c.partial) || a.c.min - b.c.min);
    const gaps = allGaps(), top = gaps[0];
    const feedHits = FEED.rows.filter(r => annotate(r, gaps).hits.length).length, feedDnb = FEED.rows.filter(r => annotate(r, gaps).dnb.length).length;
    const row = (href, l, r, sub) => `<li><a href="${href}"><span class="l">${l}${sub ? `<span class="sub">${sub}</span>` : ''}</span><span class="r">${r}</span></a></li>`;
    return `
${al.length ? `<ul class="alerts" aria-label="Since you last looked">${al.map(a => `<li class="${a.lvl || ''}">${a.text}</li>`).join('')}</ul>` : ''}
<div class="qs">
 <section class="q" aria-labelledby="q1"><a class="head" href="#/collection"><p class="k" id="q1">What do I own</p>
  <p class="big">${pts(D.fieldablePoints)} pts <span class="small">fieldable at ${esc(STORE.meta.points_snapshot)} · ${D.records} records · ${D.modelsOwned} models · ${money(Math.round(D.spent), true)} spent${D.inbound.length ? ` · ${D.inbound.length} crate${D.inbound.length > 1 ? 's' : ''} pending, not counted` : ''}</span></p></a>
  <ul class="rows">
   ${row('#/collection?f=ready', 'Painted and based', `${inv.length - notReady.length} of ${inv.length} records`)}
   ${row('#/collection?f=todo', 'Not table-ready', notReady.length ? notReady.map(i => `${esc(uname(i.unit))} ${paintTag(i.paint)}`).join(' ') : 'nothing — all built and painted')}
   ${row('#/collection?f=verify', 'Counts to confirm', approx.length ? approx.map(i => `${esc(uname(i.unit))} <span class="glyph">${i.approx ? '≈' : ''}${i.models}${unitById(i.unit).sizes[0].models > i.models ? '/' + unitById(i.unit).sizes[0].models : ''}</span>`).join(' · ') : 'none')}
  </ul></section>

 <section class="q" aria-labelledby="q2"><a class="head" href="#/lists"><p class="k" id="q2">What can I field today</p>
  <p class="big">${ready.length ? `${esc(ready[0].l.id)} · ${esc(ready[0].l.name)}` : '<span class="dim">Nothing complete yet</span>'} <span class="small">${ready.length ? `${pts(ready[0].s.lint.total)} / ${pts(ready[0].l.limit)} · legal, every model owned, built and painted${ready.length > 1 ? ` · also ready: ${ready.slice(1).map(x => esc(x.l.id)).join(', ')}` : ''}` : 'see what each list is waiting on'}</span></p></a>
  <ul class="rows">
   ${statuses.filter(x => !ready.length || x !== ready[0]).slice(0, 3).map(({ l, s }) => row(`#/lists/${esc(l.id)}`, `${listLine(l, s)}`, ticks(s), s.status === 'ready' ? 'ready — pick it up and play' : s.status === 'hobby' ? `owned; first build and paint: ${s.cov.hobby.map(h => esc(uname(h.unit))).join(', ')}` : `${s.cov.missing.length} to buy: ${esc(gapWords(s.cov.missing.slice(0, 2)))}${s.cov.missing.length > 2 ? '…' : ''}`)).join('')}
   ${statuses.length - (ready.length ? 1 : 0) > 3 ? row('#/lists', `${statuses.length - (ready.length ? 1 : 0) - 3} more lists`, 'all six →') : ''}
  </ul></section>

 <section class="q" aria-labelledby="q3"><a class="head" href="#/buy"><p class="k" id="q3">What should I buy next</p>
  <p class="big ${paused ? 'dim' : ''}">${paused ? 'Nothing yet' : buyable.length ? `${esc(gapWords(buyable[0].x.s.cov.missing.slice(0, 2)))}${buyable[0].x.s.cov.missing.length > 2 ? '…' : ''}` : 'No priced gaps'} <span class="small">${paused ? `house rule: ${thr} games before the next model — ${games} played (rule counts ${esc(STORE.games.rule.counts_from)}); overridable in Buy` : buyable.length ? `cheapest legal list to finish: ${esc(buyable[0].x.l.id)} · from ${mrange(buyable[0].c.min, buyable[0].c.min, buyable[0].c.partial)} at ${dshort(PRICE_DATE)} scout prices` : 'run the scout for current prices'}</span></p></a>
  <ul class="rows">
   ${buyable.slice(0, 2).map(({ x, c }) => row(`#/lists/${esc(x.l.id)}`, `Finish ${esc(x.l.id)} · ${esc(x.l.name)}`, mrange(c.min, c.med, c.partial), esc(gapWords(x.s.cov.missing)))).join('')}
   ${top ? row('#/buy', `Most-wanted unit: ${esc(uname(top.unit))}`, PRICES[top.unit] ? `${mrange(PRICES[top.unit].min, PRICES[top.unit].med)} · ${dshort(PRICE_DATE)}` : 'unpriced', `missing from ${[...top.lists].join(', ')}${top.inbound ? ' · an inbound crate may cover it' : ''}`) : ''}
   ${row('#/buy?f=flagged', 'In the market feed', `${feedHits} match a gap · ${feedDnb} do-not-buy`, `${FEED.rows.length} listings, scanned ${esc((FEED.meta && FEED.meta.scanned) || '?')} — a dated snapshot`)}
  </ul></section>

 <section class="q" aria-labelledby="q4"><a class="head" href="#/crates"><p class="k" id="q4">What is arriving</p>
  <p class="big">${D.inbound.length ? `${D.inbound.length} crate${D.inbound.length > 1 ? 's' : ''}` : '<span class="dim">Nothing inbound</span>'} <span class="small">${D.inbound.length ? `${money(D.inTransit, D.inbound.some(o => o.approx))} in transit · contents pending catalogue` : 'every order delivered and catalogued'}</span></p></a>
  <ul class="rows">
   ${D.inbound.map(o => { const s = etaState(o); return row(`#/crates/${esc(o.id)}`, `${esc(o.item)} ${tag('inb', 'inbound')}`, `<span class="ticks"><span class="${s.cls}">●</span></span> ${esc(s.text)}`, `${o.shipped ? `shipped ${dshort(o.shipped)}${o.carrier ? ' · ' + esc(o.carrier) : ''} · ` : ''}${esc(o.expected || 'contents pending')}`); }).join('')}
   ${row('#/crates', 'Catalogue a crate', 'crate mode →', 'tick what actually came out of the box; the store gets a patch')}
  </ul></section>
</div>`;
  };

  // ----- COLLECTION -----
  const FILTERS = [['all', 'All', i => true], ['LD', 'Daemons', (i, u) => u.faction === 'LD'], ['HA', 'Heretic Astartes', (i, u) => u.faction === 'HA'], ['CK', 'Knights', (i, u) => u.faction === 'CK'],
    ['khorne', 'Khorne', (i, u) => u.god === 'khorne'], ['tzeentch', 'Tzeentch', (i, u) => u.god === 'tzeentch'], ['nurgle', 'Nurgle', (i, u) => u.god === 'nurgle'],
    ['ready', 'Table-ready', i => !L.NOT_READY_PAINT.has(i.paint)], ['todo', 'Not ready', i => L.NOT_READY_PAINT.has(i.paint)], ['verify', 'To confirm', (i, u) => i.approx || u.verify || D.unfieldable.some(x => x.inv === i.id)], ['inbound', 'Inbound', i => false]];
  let sortKey = LS.get('muster.sort', 'store'), sortDir = 1;
  VIEWS.collection = (parts, q) => {
    const f = FILTERS.find(x => x[0] === q.f) || FILTERS[0], use = unitUse();
    const rows = STORE.inventory.map(i => ({ i, u: unitById(i.unit), o: orderById(i.order) })).filter(r => r.u);
    const counts = Object.fromEntries(FILTERS.map(([k, , fn]) => [k, k === 'inbound' ? D.inbound.length : rows.filter(r => fn(r.i, r.u)).length]));
    let shown = f[0] === 'inbound' ? [] : rows.filter(r => f[2](r.i, r.u));
    const val = { name: r => r.u.name, models: r => r.i.models || 0, pts: r => rowPts(r).v, store: (r) => 0 };
    if (sortKey !== 'store') shown = shown.slice().sort((a, b) => { const x = val[sortKey](a), y = val[sortKey](b); return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
    const open = q.open;
    return `
<div class="vh"><h2>Collection</h2><div class="tools"><button class="btn ghost" data-act="csv">Export CSV</button></div></div>
<p class="lead">Every record is one line of the store. Points at ${esc(STORE.meta.points_snapshot)}; <span class="glyph">≈</span> and <span class="glyph">?</span> mean exactly that. Tap a row for its facts, provenance and the lists that use it.</p>
<div class="chipbar" role="toolbar" aria-label="Filter">${FILTERS.map(([k, label]) => `<button data-act="filter" data-f="${k}" aria-pressed="${k === f[0]}">${label}<b>${counts[k]}</b></button>`).join('')}</div>
<div class="scroll"><table class="tbl">
<thead><tr><th data-sort="name">Unit</th><th class="n" data-sort="models">#</th><th class="n" data-sort="pts">Pts</th></tr></thead>
<tbody>
${shown.map(r => { const p = rowPts(r), lists = use[r.u.id] ? [...use[r.u.id]].join(' ') : 'none'; const isOpen = open === r.i.id; return `
<tr data-id="${esc(r.i.id)}" data-act="open" class="${isOpen ? 'open' : ''}" tabindex="0"><td><span class="name">${esc(r.u.name)}</span> ${paintTag(r.i.paint)}<span class="sub">${r.u.epithet ? `<span class="epi-inline">${esc(r.u.epithet)}</span> · ` : ''}${r.o ? `${dshort(r.o.date)} ${esc(shortItem(r.o))} · ` : ''}lists ${esc(lists)}${r.i.note ? ` · ${esc(r.i.note.length > 70 ? r.i.note.slice(0, 68) + '…' : r.i.note)}` : ''}</span></td>
<td class="n">${r.i.approx ? '<span class="glyph">≈</span>' : ''}${r.i.models}${p.short ? `<span class="glyph">/${p.min}</span>` : ''}</td><td class="n">${p.text}${r.u.verify ? ' <span class="glyph" title="unverified">~</span>' : ''}</td></tr>
${isOpen ? `<tr class="detail"><td colspan="3">${unitDetail(r.u, r.i, r.o, lists)}</td></tr>` : ''}`; }).join('')}
${(f[0] === 'all' || f[0] === 'inbound') ? D.inbound.map(o => `<tr class="inbound" data-act="go" data-href="#/crates/${esc(o.id)}" tabindex="0"><td><span class="name">${esc(o.item)}</span> ${tag('inb', 'inbound')}<span class="sub">${esc(o.expected || 'contents pending')} · ${esc(etaState(o).text)}</span></td><td class="n"><span class="glyph">?</span></td><td class="n">—</td></tr>`).join('') : ''}
</tbody></table></div>
<p class="hint">${shown.length} record${shown.length === 1 ? '' : 's'} shown${f[0] !== 'all' ? ` (filter: ${esc(f[1])})` : ''} · fieldable total ${pts(D.fieldablePoints)} pts excludes ${D.unfieldable.map(x => `${esc(uname(x.unit))} (${esc(x.why)})`).join(', ') || 'nothing'}.</p>`;
  };
  function rowPts(r) {
    const sizes = (r.u.sizes || []).filter(s => s.pts != null).sort((a, b) => b.models - a.models);
    let left = r.i.models || 0, v = 0; for (const s of sizes) while (left >= s.models && s.models > 0) { v += s.pts; left -= s.models; }
    const min = r.u.sizes[0] ? r.u.sizes[0].models : 1;
    if (v) return { v, text: pts(v), min, short: false };
    const s0 = r.u.sizes[0];
    return { v: 0, text: s0 && s0.pts != null ? `<span class="glyph">${s0.pts}/${s0.models}</span>` : '—', min, short: (r.i.models || 0) < min };
  }
  function unitDetail(u, i, o, lists) {
    const R = STORE.rules;
    const legal = { native: `${R.detachment.name} unit (${u.god})`, thrall: `Heretic Astartes — legal via ${R.thralls.name} (counts toward the ${R.thralls.cap.strike_force}-pt cap at 2,000)`, ally: 'Chaos Knights ally under Dreadblades — max 3 War Dog models, never Warlord, no enhancements, no detachment boon', banned: 'ILLEGAL in this detachment' }[u.legality] || u.legality;
    return `<dl class="kvl">
<dt>Datasheet</dt><dd>${esc(u.name)} · ${esc((u.keywords || []).join(', '))}</dd>
<dt>Points</dt><dd>${u.sizes.map(s => `${s.models} model${s.models > 1 ? 's' : ''}: ${s.pts == null ? '?' : s.pts}${s.pts_third != null ? ` (3rd copy ${s.pts_third})` : ''}`).join(' · ')} — ${esc(STORE.meta.points_snapshot)}${u.verify ? ' · <b>verify in the app</b>' : ''}</dd>
<dt>Legality</dt><dd>${esc(legal)}</dd>
${u.leads ? `<dt>Leads</dt><dd>${u.leads.map(id => esc(uname(id))).join(', ')}</dd>` : ''}
${u.note ? `<dt>Note</dt><dd>${esc(u.note)}</dd>` : ''}
${i ? `<dt>Record</dt><dd>${i.approx ? '≈' : ''}${i.models} model${i.models === 1 ? '' : 's'} · ${esc(i.paint)}${i.note ? ' · ' + esc(i.note) : ''}</dd>` : ''}
${o ? `<dt>Provenance</dt><dd>${esc(o.item)} · ordered ${dshort(o.date)} · ${money(o.cost_usd, o.approx)}${o.cost_note ? ` (${esc(o.cost_note)})` : ''} · ${esc(etaState(o).text)}</dd>` : ''}
<dt>In lists</dt><dd>${esc(lists)}</dd>
<dt>Source</dt><dd><a href="${esc(u.source)}" rel="noopener">${esc(u.source.replace(/^https?:\/\//, ''))}</a></dd>
${i ? `<dt>Paint state</dt><dd><select data-field="paint" data-inv="${esc(i.id)}">${STORE.hobby.paint_states.map(p => `<option${p === i.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select> <span class="hint">saved on this device until exported</span></dd>` : ''}
</dl>`;
  }

  // ----- LISTS -----
  VIEWS.lists = (parts, q) => {
    if (parts[1]) return listDetail(parts[1]);
    const dl = deviceLists();
    return `
<div class="vh"><h2>Lists</h2><div class="tools"><a class="btn" href="#/build">Build a list</a></div></div>
<p class="lead">${esc(STORE.rules.detachment.name)} · ${STORE.rules.detachment.dp} DP · ${esc(STORE.rules.battle_size.name)} ${pts(STORE.rules.battle_size.points)}. Three ticks per list: the linter passed · every model owned · everything built and painted. Totals are computed from the store, never typed.</p>
<div class="cards">${STORE.lists.map(l => listCard(l)).join('')}</div>
${dl.length ? `<h3 class="sh">On this device</h3><div class="cards">${dl.map(l => listCard(l, true)).join('')}</div>` : ''}`;
  };
  function listCard(l, device) {
    const s = listStatus(l), c = gapCost(s.cov.missing);
    const why = s.status === 'ready' ? 'Playable today.' : s.status === 'hobby' ? `Owned — first: ${s.cov.hobby.map(h => `${esc(uname(h.unit))} (${esc(h.paint)})`).join(', ')}.` : `Missing: ${esc(gapWords(s.cov.missing))}${c.none ? '' : ` — from ${mrange(c.min, c.min, c.partial)} (${dshort(PRICE_DATE)} prices)`}.`;
    return `<article class="cardx"><h3><a href="#/lists/${esc(l.id)}">${esc(l.id)} · ${esc(l.name)}</a></h3>
<p class="meta">${pts(s.lint.total)} / ${pts(l.limit || 2000)} · ${ticks(s)}${device ? ' · on this device' : ''}</p>
<p>${esc(l.idea || '')}</p><p class="muted">${why}${!s.legal ? ` <b>Not legal:</b> ${esc(s.lint.flags.filter(f => f.level === 'error').map(f => f.msg).join('; '))}` : ''}</p>
<div class="acts"><a class="btn" href="#/lists/${esc(l.id)}">Open</a><button class="btn ghost" data-act="copylist" data-list="${esc(l.id)}">Copy as text</button><a class="btn ghost" href="#/build?from=${esc(l.id)}">Edit a copy</a></div></article>`;
  }
  function listDetail(id) {
    const l = listById(id); if (!l) return `<p>No list "${esc(id)}". <a href="#/lists">Back to lists</a>.</p>`;
    const s = listStatus(l), lint = s.lint, byEntry = new Map(lint.entries.map(o => [o.entry.id, o])), cov = new Map(s.cov.rows.map(r => [r.entry, r]));
    const c = gapCost(s.cov.missing);
    return `
<div class="vh"><h2>${esc(l.id)} · ${esc(l.name)}</h2><div class="tools"><button class="btn" data-act="copylist" data-list="${esc(l.id)}">Copy as text</button><a class="btn ghost" href="#/build?from=${esc(l.id)}">Edit a copy</a><a class="btn ghost" href="#/lists">All lists</a></div></div>
<p class="lead">${esc(l.idea || '')} ${l.doctrine ? `<br>${esc(l.doctrine)}` : ''}${l.primer ? ` <a href="${esc(l.primer)}">How to play it (Primer) →</a>` : ''}</p>
<p class="mono">${pts(lint.total)} / ${pts(lint.limit)} · ${ticks(s)} · Heretic Astartes ${pts(lint.ha)} / ${lint.haCap} · War Dogs ${lint.warDogs} / ${STORE.rules.allies.dreadblades.max_war_dog_models}</p>
<div class="two"><div>
<div class="scroll"><table class="tbl"><thead><tr><th>Unit</th><th class="n">#</th><th class="n">Pts</th><th>Owned</th></tr></thead><tbody>
${l.entries.map(e => { const o = byEntry.get(e.id) || { pts: 0, flags: [] }, cv = cov.get(e.id) || { short: e.models, from: [] }; const u = unitById(e.unit) || { name: e.unit }; const led = e.leads ? l.entries.find(x => x.id === e.leads) : null;
      return `<tr><td><span class="name">${esc(u.name)}</span>${e.warlord ? ' ' + tag('warn', 'warlord') : ''}${e.enh ? ` ${tag('inb', (o.enh && o.enh.name) || e.enh)}` : ''}<span class="sub">${led ? `leads ${esc(uname(led.unit))} ×${led.models} · ` : ''}${o.flags.filter(f => f.level !== 'info').map(f => `<span class="glyph">${f.level === 'error' ? '✗' : '~'}</span> ${esc(f.msg)}`).join(' · ')}</span></td>
<td class="n">${e.models}</td><td class="n">${pts(o.pts)}</td><td>${cv.short ? tag('todo', `short ${cv.short}`) : cv.from.some(f => L.NOT_READY_PAINT.has(f.paint)) ? tag('warn', cv.from.find(f => L.NOT_READY_PAINT.has(f.paint)).paint) : tag('paint', 'owned')}</td></tr>`; }).join('')}
</tbody></table></div>
<div class="total-line ${lint.total > lint.limit ? 'over' : ''}"><span>Total</span><span>${pts(lint.total)} / ${pts(lint.limit)}</span></div>
</div><div>
<h3 class="sh">The linter</h3>
${flagList(lint)}
<h3 class="sh">To field it</h3>
<ul class="flags">${s.cov.missing.length ? s.cov.missing.map(m => `<li>${tag('todo', 'buy')} ${esc(uname(m.unit))} ×${m.models}${PRICES[m.unit] ? ` <span class="src">${mrange(PRICES[m.unit].min, PRICES[m.unit].med)} landed, ${PRICES[m.unit].n} listings on ${dshort(PRICE_DATE)} (a dated read-only scout, not a live price)</span>` : ' <span class="src">no price snapshot on file</span>'}</li>`).join('') : ''}
${s.cov.hobby.map(h => `<li>${tag('warn', h.paint)} ${esc(uname(h.unit))} — build and paint before it counts as ready. <a href="#/hobby">Hobby queue →</a></li>`).join('')}
${!s.cov.missing.length && !s.cov.hobby.length ? '<li class="ok">✓ Every entry is covered by owned, painted models.</li>' : ''}
${s.cov.missing.length && !c.none ? `<li><span class="src">Gap from ${mrange(c.min, c.med, c.partial)}${c.partial ? ' (some units unpriced)' : ''} at ${dshort(PRICE_DATE)} prices · house rule: ${STORE.games.rule.threshold} games before the next model (${D.games} played).</span></li>` : ''}
</ul></div></div>`;
  }
  function flagList(lint) {
    const all = lint.flags.concat(...lint.entries.map(o => o.flags.map(f => Object.assign({ unitName: o.unit && o.unit.name }, f))));
    const lv = { error: 0, warn: 1, info: 2 }; all.sort((a, b) => lv[a.level] - lv[b.level]);
    if (!all.length) return `<ul class="flags"><li class="ok">✓ No flags. Legal at ${esc(STORE.meta.points_snapshot)} as far as the store knows — verify in the official app before an event.</li></ul>`;
    return `<ul class="flags">${!all.some(f => f.level === 'error') ? `<li class="ok">✓ Legal as far as the store knows (${esc(STORE.meta.points_snapshot)}); the notes below are things to verify, not violations.</li>` : ''}${all.map(f => `<li><span class="lv ${f.level}">${f.level === 'warn' ? 'verify' : f.level}</span>${esc(f.msg)}${f.rule && (f.rule.why || f.rule.source) ? `<span class="src">${f.rule.why ? esc(f.rule.why) + ' ' : ''}${f.rule.source ? `Source: ${/^https?:/.test(f.rule.source) ? `<a href="${esc(f.rule.source)}" rel="noopener">${esc(f.rule.source.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a>` : esc(f.rule.source)}` : ''}${f.rule.verified ? ` · verified ${esc(f.rule.verified)}` : ''}</span>` : ''}</li>`).join('')}</ul>`;
  }
  function listText(l) {
    const s = listStatus(l), lint = s.lint, by = new Map(lint.entries.map(o => [o.entry.id, o]));
    const lines = [`++ ${l.name} — Chaos Daemons — ${STORE.rules.detachment.name} (${STORE.rules.battle_size.name}, ${pts(l.limit || 2000)} pts) ++`, ''];
    for (const e of l.entries) {
      const o = by.get(e.id) || { pts: 0 }, u = unitById(e.unit) || { name: e.unit }, led = e.leads ? l.entries.find(x => x.id === e.leads) : null;
      lines.push(`${u.name}${e.models > 1 ? ` ×${e.models}` : ''} (${o.pts})${e.warlord ? ' — WARLORD' : ''}${e.enh ? ` — Enhancement: ${(o.enh && o.enh.name) || e.enh}` : ''}${led ? ` — leads ${uname(led.unit)} ×${led.models}` : ''}`);
    }
    lines.push('', `Total: ${pts(lint.total)} / ${pts(lint.limit)}${lint.warDogs ? ` · War Dogs via Chaos Knights Dreadblades (${lint.warDogs})` : ''}`, `Points: ${STORE.meta.points_snapshot}, rules verified ${STORE.rules.snapshot.verified} — re-verify in the official app before an event.`);
    if (!lint.legal) lines.push('NOT LEGAL as written: ' + lint.flags.filter(f => f.level === 'error').map(f => f.msg).join('; '));
    return lines.join('\n');
  }

  // ----- BUILDER -----
  function builderState(q) {
    let b = LS.get('muster.builder', null);
    if (q && q.from) { const src = listById(q.from); if (src) { b = { id: 'L' + Date.now().toString(36), name: src.name + ' (copy)', limit: src.limit || 2000, detachment: 'shadow_legion', entries: clone(src.entries) }; LS.set('muster.builder', b); history.replaceState(null, '', '#/build'); } }
    if (!b) { b = { id: 'L' + Date.now().toString(36), name: 'New list', limit: 2000, detachment: 'shadow_legion', entries: [{ id: 'n1', unit: 'belakor', models: 1, warlord: true }] }; LS.set('muster.builder', b); }
    return b;
  }
  VIEWS.build = (parts, q) => {
    const b = builderState(q), lint = L.lintList(STORE, b), cov = L.coverage(STORE, b), by = new Map(lint.entries.map(o => [o.entry.id, o])), cv = new Map(cov.rows.map(r => [r.entry, r]));
    const s = { lint, cov, legal: lint.legal, owned: !cov.missing.length, ready: !cov.missing.length && !cov.hobby.length };
    const owned = {}; for (const i of STORE.inventory) if (i.status === 'owned') owned[i.unit] = (owned[i.unit] || 0) + (i.models || 0);
    const groups = [['Daemons — undivided', u => u.faction === 'LD' && u.god === 'undivided'], ['Khorne', u => u.god === 'khorne'], ['Tzeentch', u => u.god === 'tzeentch'], ['Nurgle', u => u.god === 'nurgle'], ['Slaanesh', u => u.god === 'slaanesh'], ['Heretic Astartes (Thralls)', u => u.faction === 'HA'], ['Chaos Knights (Dreadblades)', u => u.faction === 'CK']];
    const enhs = STORE.rules.enhancements;
    return `
<div class="vh"><h2>Builder</h2><div class="tools"><button class="btn pri" data-act="b-save">Save on this device</button><button class="btn ghost" data-act="b-copy">Copy as text</button><button class="btn ghost" data-act="b-json">Copy store JSON</button><button class="btn ghost" data-act="b-new">Start over</button></div></div>
<p class="lead">Compose from the catalog; the linter and the ownership check run as you go. Work is kept on this device. To make a list canonical, copy its store JSON into <code>data/muster.json</code> → <code>lists</code> (or paste it to a session and ask).</p>
<div class="f"><div class="row3"><label>Name<input data-bfield="name" value="${esc(b.name)}"></label><label>Limit<select data-bfield="limit">${[1000, 2000, 3000].map(n => `<option${n === b.limit ? ' selected' : ''}>${n}</option>`).join('')}</select></label><label>Id<input data-bfield="id" value="${esc(b.id)}"></label></div></div>
<div class="two"><div>
<div class="scroll"><table class="tbl"><thead><tr><th>Unit</th><th class="n">#</th><th class="n">Pts</th><th>Options</th><th></th></tr></thead><tbody>
${b.entries.map(e => { const u = unitById(e.unit); if (!u) return `<tr><td colspan="5">${esc(e.unit)}? <button class="btn ghost" data-act="b-del" data-e="${esc(e.id)}">remove</button></td></tr>`; const o = by.get(e.id) || { pts: 0, flags: [] }, c = cv.get(e.id) || { short: 0, from: [] };
      const isChar = (u.keywords || []).includes('CHARACTER') && u.role !== 'epic_hero' && u.legality !== 'ally';
      const targets = b.entries.filter(x => x.id !== e.id && (u.leads || []).includes(x.unit));
      return `<tr><td><span class="name">${esc(u.name)}</span><span class="sub">${o.flags.filter(f => f.level !== 'info').map(f => `<span class="glyph">${f.level === 'error' ? '✗' : '~'}</span> ${esc(f.msg)}`).join(' · ') || (c.short ? `short ${c.short} model${c.short > 1 ? 's' : ''}` : c.from.some(f => L.NOT_READY_PAINT.has(f.paint)) ? 'owned, not yet built/painted' : 'owned')}</span></td>
<td class="n"><select data-bentry="${esc(e.id)}" data-bkey="models" aria-label="models">${u.sizes.map(sz => `<option${sz.models === e.models ? ' selected' : ''}>${sz.models}</option>`).join('')}${u.sizes.some(sz => sz.models === e.models) ? '' : `<option selected>${e.models}</option>`}</select></td>
<td class="n">${pts(o.pts)}</td>
<td>${isChar ? `<select data-bentry="${esc(e.id)}" data-bkey="enh" aria-label="enhancement"><option value="">no enhancement</option>${enhs.map(x => `<option value="${esc(x.id)}"${x.id === e.enh ? ' selected' : ''}>${esc(x.name)} (+${x.pts})</option>`).join('')}</select>` : ''}
${(u.leads || []).length ? `<select data-bentry="${esc(e.id)}" data-bkey="leads" aria-label="leads"><option value="">leads nobody</option>${targets.map(t => `<option value="${esc(t.id)}"${t.id === e.leads ? ' selected' : ''}>→ ${esc(uname(t.unit))} ×${t.models} (${esc(t.id)})</option>`).join('')}</select>` : ''}
${(u.keywords || []).includes('CHARACTER') || u.role === 'epic_hero' ? `<label class="hint"><input type="checkbox" data-bentry="${esc(e.id)}" data-bkey="warlord"${e.warlord ? ' checked' : ''}> warlord</label>` : ''}</td>
<td><button class="btn ghost" data-act="b-del" data-e="${esc(e.id)}" aria-label="remove ${esc(u.name)}">✕</button></td></tr>`; }).join('')}
</tbody></table></div>
<div class="total-line ${lint.total > lint.limit ? 'over' : ''}"><span>${ticks(s)}</span><span>${pts(lint.total)} / ${pts(lint.limit)}</span></div>
<div class="f"><div class="row3"><label>Add a unit<select id="b-unit">${groups.map(([g, fn]) => `<optgroup label="${esc(g)}">${STORE.units.filter(fn).map(u => `<option value="${esc(u.id)}">${esc(u.name)}${owned[u.id] ? ` — own ${owned[u.id]}` : ''}${u.legality === 'banned' ? ' — ILLEGAL here' : ''}</option>`).join('')}</optgroup>`).join('')}</select></label><label>Models<select id="b-models"></select></label><label>&nbsp;<button class="btn pri" data-act="b-add">Add</button></label></div></div>
</div><div><h3 class="sh">The linter</h3>${flagList(lint)}
<h3 class="sh">Ownership</h3><ul class="flags">${cov.missing.length ? cov.missing.map(m => `<li>${tag('todo', 'short')} ${esc(uname(m.unit))} ×${m.models}${PRICES[m.unit] ? ` <span class="src">${mrange(PRICES[m.unit].min, PRICES[m.unit].med)} at ${dshort(PRICE_DATE)}</span>` : ''}</li>`).join('') : '<li class="ok">✓ Every entry is covered by owned models.</li>'}${cov.hobby.map(h => `<li>${tag('warn', h.paint)} ${esc(uname(h.unit))}</li>`).join('')}</ul>
<p class="hint">Heretic Astartes ${pts(lint.ha)} / ${lint.haCap} · War Dogs ${lint.warDogs} / ${STORE.rules.allies.dreadblades.max_war_dog_models}</p></div></div>`;
  };
  function builderMut(fn) { const b = LS.get('muster.builder', null) || builderState({}); fn(b); LS.set('muster.builder', b); render(true); }

  // ----- BUY -----
  VIEWS.buy = (parts, q) => {
    const gaps = allGaps(), games = D.games, thr = STORE.games.rule.threshold, override = LS.get('muster.buyOverride', false), paused = games < thr && !override;
    const f = q.f || 'flagged';
    const ann = FEED.rows.map(x => ({ x, a: annotate(x, gaps) }));
    const sets = { flagged: ann.filter(r => r.a.hits.length || r.a.dnb.length), buy: ann.filter(r => r.x.verdict === 'BUY'), chaos: ann.filter(r => /chaos|daemon|death guard|thousand sons|world eaters|emperor's children/i.test(r.x.faction || '')), all: ann };
    const shown = (sets[f] || sets.flagged).slice().sort((a, b) => (b.a.dnb.length ? -1 : 0) - (a.a.dnb.length ? -1 : 0) || (b.a.hits.length - a.a.hits.length) || ((b.x.valueRatio || 0) - (a.x.valueRatio || 0)));
    return `
<div class="vh"><h2>Buy</h2><div class="tools"><a class="btn ghost" href="scorecard.html">Full scorecard</a><a class="btn ghost" href="chaos.html">Chaos edition</a></div></div>
<div class="banner"><span>${paused ? `<b>Buying paused by house rule:</b> ${thr} games before the next model — ${games} logged. The rule counts ${esc(STORE.games.rule.counts_from)}.` : override ? `House rule overridden on this device (${games}/${thr} games).` : `${games} games logged — the ten-games rule is satisfied.`}</span><button class="btn ghost" data-act="override">${override ? 'Respect the rule' : 'Override'}</button></div>
<h3 class="sh">Gaps first</h3>
<p class="lead">Units the six lists still need, priced from the last read-only scout (${dshort(PRICE_DATE)} landed prices, US-shippable, auctions excluded — a bid is not a price). Re-run the scout before buying; every stored price is a dated snapshot.</p>
<div class="scroll"><table class="tbl"><thead><tr><th>Unit</th><th class="n">Need</th><th>For lists</th><th class="n">Landed (min–median)</th></tr></thead><tbody>
${gaps.map(g => `<tr><td><span class="name">${esc(uname(g.unit))}</span>${g.inbound ? ' ' + tag('inb', 'inbound crate may cover') : ''}${(unitById(g.unit) || {}).note ? `<span class="sub">${esc(unitById(g.unit).note)}</span>` : ''}</td><td class="n">×${g.models}</td><td class="mono">${[...g.lists].join(' ')}</td><td class="n">${PRICES[g.unit] ? `${mrange(PRICES[g.unit].min, PRICES[g.unit].med)} <span class="muted">(${PRICES[g.unit].n})</span>` : '<span class="muted">unpriced</span>'}</td></tr>`).join('')}
</tbody></table></div>
<h3 class="sh">Do not buy</h3>
<ul class="flags">${STORE.buying.do_not_buy.map(d => `<li><span class="lv error">skip</span><b>${esc(d.match)}</b> — ${esc(d.why)}</li>`).join('')}${(STORE.buying.closed_paths || []).map(c => `<li><span class="lv info">closed</span>${dshort(c.date)}: ${esc(c.what)}</li>`).join('')}</ul>
<h3 class="sh">The market feed</h3>
<p class="lead">${FEED.rows.length} painted-army listings from the ${esc((FEED.meta && FEED.meta.scanned) || '?')} category scan (photo tiers swept ${esc((FEED.meta && FEED.meta.photoSweep) || '?')}); most have long since ended — the method is the point. Cards say which of your gaps a lot advances and warn when a title matches the do-not-buy writ. Judge paint from the gallery, never the title.</p>
<div class="chipbar" role="toolbar" aria-label="Feed filter">${[['flagged', 'Matches a gap or a warning', sets.flagged.length], ['buy', 'BUY-grade', sets.buy.length], ['chaos', 'Chaos factions', sets.chaos.length], ['all', 'Everything', sets.all.length]].map(([k, l, n]) => `<button data-act="buyfilter" data-f="${k}" aria-pressed="${k === f}">${l}<b>${n}</b></button>`).join('')}</div>
${shown.length ? `<div class="cards">${shown.slice(0, 120).map(({ x, a }) => `<article class="cardx ${a.dnb.length ? 'dnb' : a.hits.length ? 'gap' : ''}">
<h3><a href="${ebay(x.url)}" rel="noopener">${esc(x.name)}</a></h3>
<p class="meta">${esc(x.faction || '?')} · ${esc(x.priceDisplay || money(x.priceUSD || 0))} → landed ${money(Math.round(x.landedUSD || 0))} · ${x.points ? pts(x.points) + ' pts' : 'points not in title'} · ${esc(x.verdict)}${x.valueRatio ? ` ${Number(x.valueRatio).toFixed(2)}×` : ''} · ${esc(x.paintTier || '?')}${x.paintTierAssumed ? ' (assumed)' : ' (photo-checked)'}</p>
${a.dnb.map(d => `<p>${tag('dnb', 'do not buy')} ${esc(d.why)}</p>`).join('')}
${a.hits.length ? `<p>${tag('paint', 'advances')} ${a.hits.map(h => `${esc(uname(h.unit))} → ${[...h.lists].join(', ')}`).join(' · ')}</p>` : ''}
${a.auction ? `<p>${tag('warn', 'auction')} a current bid is not a price.</p>` : ''}${a.printed ? `<p>${tag('warn', 'proxy / print?')} title or notes mention printing or proxies.</p>` : ''}
${x.notes ? `<p class="muted">${esc(x.notes)}</p>` : ''}
${paused && a.hits.length ? `<p class="hint">Buying paused: ${games}/${thr} games.</p>` : ''}</article>`).join('')}</div>` : `<p class="muted">Nothing in this snapshot matches. That is an honest answer for a ${esc((FEED.meta && FEED.meta.scanned) || '')} feed of whole armies — targeted scouting (tools/ebay_search.js, read-only, from a machine that can reach eBay) is how single units get found.</p>`}`;
  };

  // ----- CRATES / ORDERS -----
  VIEWS.crates = (parts, q) => {
    if (parts[1]) return crateMode(parts[1]);
    const delivered = STORE.orders.filter(o => o.status === 'delivered');
    return `
<div class="vh"><h2>Crates</h2><div class="tools"><a class="btn ghost" href="#/orders">Full ledger</a></div></div>
<p class="lead">${D.inbound.length} inbound · ${money(D.inTransit, D.inbound.some(o => o.approx))} in transit · contents stay “pending” until you tick them off in crate mode — the store never guesses a count.</p>
<div class="cards">${D.inbound.map(o => { const s = etaState(o); return `<article class="cardx"><h3><a href="#/crates/${esc(o.id)}">${esc(o.item)}</a></h3>
<p class="meta">ordered ${dshort(o.date)} · ${money(o.cost_usd, o.approx)}${o.cost_note ? ` (${esc(o.cost_note)})` : ''} · ${esc(o.state)}</p>
<p><span class="ticks"><span class="${s.cls}">●</span></span> ${esc(s.text)}${o.eta_note ? ` · ${esc(o.eta_note)}` : ''}${o.shipped ? ` · shipped ${dshort(o.shipped)}${o.carrier ? ' via ' + esc(o.carrier) : ''}` : ''}</p>
<p class="muted">${esc(o.expected || 'Contents pending.')}</p>
<div class="acts"><a class="btn pri" href="#/crates/${esc(o.id)}">Open the crate</a></div></article>`; }).join('') || '<p class="muted">Nothing inbound. The rule stands: ten games.</p>'}</div>
<h3 class="sh">Delivered</h3>
<ul class="rows">${delivered.map(o => `<li><a href="#/crates/${esc(o.id)}"><span class="l">${esc(o.item)}<span class="sub">${money(o.cost_usd, o.approx)}${o.cost_note ? ` (${esc(o.cost_note)})` : ''} · ${esc(o.state)}${o.note ? ' · ' + esc(o.note) : ''}</span></span><span class="r">ordered ${dshort(o.date)} · delivered ${dshort(o.delivered)}</span></a></li>`).join('')}</ul>`;
  };
  VIEWS.orders = () => `
<div class="vh"><h2>Ledger of orders</h2><div class="tools"><a class="btn ghost" href="codex-umbral-creed.html">In the codex</a></div></div>
<p class="lead">${STORE.orders.length} orders · ${money(Math.round(D.spent), true)} landed in total (≈ because two costs are recorded as approximate) · ${money(D.inTransit, true)} of it still in transit.</p>
<div class="scroll"><table class="tbl"><thead><tr><th>Date</th><th>Order</th><th class="n">Cost</th><th>State</th><th>Status</th></tr></thead><tbody>
${STORE.orders.map(o => `<tr data-act="go" data-href="#/crates/${esc(o.id)}" tabindex="0"><td class="mono">${dshort(o.date)}</td><td><span class="name">${esc(o.item)}</span><span class="sub">${esc(o.note || o.expected || '')}${o.seller_ref ? ' · ' + esc(o.seller_ref) : ''}</span></td><td class="n">${money(o.cost_usd, o.approx)}${o.cost_note ? `<span class="sub">${esc(o.cost_note)}</span>` : ''}</td><td>${esc(o.state)}</td><td>${esc(etaState(o).text)}${o.eta_note ? `<span class="sub">${esc(o.eta_note)}</span>` : ''}</td></tr>`).join('')}
</tbody></table></div>
<h3 class="sh">Roads closed</h3><ul class="flags">${(STORE.buying.closed_paths || []).map(c => `<li><span class="lv info">${dshort(c.date)}</span>${esc(c.what)}</li>`).join('') || '<li>None recorded.</li>'}</ul>
<p class="hint">${esc(STORE.buying.remaining_gaps_note || '')}</p>`;

  const QUICK = { o6: [['bloodletters', 10], ['bloodmaster', 1], ['flesh_hounds', 5], ['bloodcrushers', 3], ['skullmaster', 1]], o7: [['bloodcrushers', 3], ['bloodcrushers', 6], ['skullmaster', 1]] };
  function crateDraft(oid) { const all = LS.get('muster.crates', {}); if (!all[oid]) { all[oid] = { rows: [], delivered: TODAY, note: '' }; LS.set('muster.crates', all); } return all[oid]; }
  function crateMut(oid, fn) { const all = LS.get('muster.crates', {}); all[oid] = all[oid] || { rows: [], delivered: TODAY, note: '' }; fn(all[oid]); LS.set('muster.crates', all); render(true); }
  function crateMode(oid) {
    const o = orderById(oid); if (!o) return `<p>No order "${esc(oid)}". <a href="#/crates">Back</a>.</p>`;
    const inv = STORE.inventory.filter(i => i.order === oid);
    if (o.status === 'delivered') return `
<div class="vh"><h2>${esc(o.item)}</h2><div class="tools"><a class="btn ghost" href="#/crates">All crates</a></div></div>
<p class="lead">Ordered ${dshort(o.date)} · ${money(o.cost_usd, o.approx)}${o.cost_note ? ` (${esc(o.cost_note)})` : ''} · delivered ${dshort(o.delivered)} · ${esc(o.state)}${o.seller_ref ? ' · ' + esc(o.seller_ref) : ''}</p>${o.note ? `<p>${esc(o.note)}</p>` : ''}
<h3 class="sh">What it became</h3><ul class="rows">${inv.map(i => `<li><a href="#/collection?open=${esc(i.id)}"><span class="l">${esc(uname(i.unit))} ${paintTag(i.paint)}<span class="sub">${esc(i.note || '')}</span></span><span class="r">${i.approx ? '≈' : ''}${i.models} model${i.models === 1 ? '' : 's'}</span></a></li>`).join('') || '<li><span class="row"><span class="l muted">No inventory rows point at this order.</span></span></li>'}</ul>`;
    const d = crateDraft(oid), quick = QUICK[oid] || [['bloodletters', 10], ['flesh_hounds', 5], ['nurglings', 3]];
    return `
<div class="vh"><h2>Crate: ${esc(o.item)}</h2><div class="tools"><a class="btn ghost" href="#/crates">All crates</a></div></div>
<p class="lead">Ordered ${dshort(o.date)} · ${money(o.cost_usd, o.approx)}${o.cost_note ? ` (${esc(o.cost_note)})` : ''} · ${esc(etaState(o).text)}. Expected: ${esc(o.expected || 'unknown')}. Tick what actually came out of the box — count models, judge paint honestly (any unpainted squad is not “painted”), add anything unlisted. Nothing touches the store until you save; then export or copy the patch.</p>
<h3 class="sh">In the box</h3>
<div class="scroll"><table class="tbl"><thead><tr><th>Unit</th><th class="n">Models</th><th>Paint</th><th>Note</th><th></th></tr></thead><tbody>
${d.rows.map((r, n) => `<tr><td>${esc(uname(r.unit))}</td><td class="n"><input type="number" min="1" value="${r.models}" data-crow="${n}" data-ckey="models" style="width:5em" aria-label="models"></td><td><select data-crow="${n}" data-ckey="paint" aria-label="paint">${STORE.hobby.paint_states.map(p => `<option${p === r.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></td><td><input data-crow="${n}" data-ckey="note" value="${esc(r.note || '')}" aria-label="note" placeholder="e.g. unlisted find, one arm missing"></td><td><button class="btn ghost" data-act="c-del" data-n="${n}" aria-label="remove">✕</button></td></tr>`).join('') || `<tr><td colspan="5" class="muted">Nothing ticked yet. Use the quick buttons or the picker below.</td></tr>`}
</tbody></table></div>
<div class="chipbar" aria-label="Quick add">${quick.map(([u, m]) => `<button data-act="c-quick" data-unit="${u}" data-models="${m}">+ ${esc(uname(u))} ×${m}</button>`).join('')}</div>
<div class="f"><div class="row3"><label>Add any unit<select id="c-unit">${STORE.units.filter(u => u.legality !== 'banned' || true).map(u => `<option value="${esc(u.id)}">${esc(u.name)}${u.legality === 'banned' ? ' (illegal in Shadow Legion — still worth recording)' : ''}</option>`).join('')}</select></label><label>Models<input id="c-models" type="number" min="1" value="1"></label><label>&nbsp;<button class="btn" data-act="c-add">Add row</button></label></div>
<div class="row2"><label>Delivered on<input type="date" data-cmeta="delivered" value="${esc(d.delivered)}"></label><label>Order note<input data-cmeta="note" value="${esc(d.note)}" placeholder="e.g. box crushed, seller refunded $10"></label></div></div>
<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button class="btn pri" data-act="c-save" ${d.rows.length ? '' : 'disabled'}>Save: mark delivered + add ${d.rows.length} record${d.rows.length === 1 ? '' : 's'}</button><span class="hint">Saved on this device; then export the store or copy the patch from More.</span></div>`;
  }

  // ----- HOBBY -----
  VIEWS.hobby = (parts, q) => {
    const target = q.list || 'F', l = listById(target) || STORE.lists[0], s = listStatus(l);
    const rows = STORE.inventory.filter(i => i.status === 'owned');
    return `
<div class="vh"><h2>Hobby</h2><div class="tools"><a class="btn ghost" href="vision.html#doing-it-four-phases">The painting plan</a></div></div>
<p class="lead">Not a backlog — a queue driven by the list you want to field fully painted. Paint states edit the store on this device; export when done.</p>
<div class="chipbar" role="toolbar" aria-label="Target list">${STORE.lists.map(x => `<button data-act="hobbylist" data-list="${esc(x.id)}" aria-pressed="${x.id === l.id}">${esc(x.id)}<b>${listStatus(x).cov.hobby.length}</b></button>`).join('')}</div>
<h3 class="sh">Between you and a painted ${esc(l.id)} · ${esc(l.name)}</h3>
<ul class="flags">${s.cov.hobby.length ? s.cov.hobby.map(h => { const qi = (STORE.hobby.queue || []).find(x => x.inventory === h.inv); return `<li>${tag('warn', h.paint)} <b>${esc(uname(h.unit))}</b>${qi ? ` — ${esc(qi.task)}${qi.est_hours ? ` · ≈${qi.est_hours[0]}–${qi.est_hours[1]} h` : ''}${qi.note ? `<span class="src">${esc(qi.note)}</span>` : ''}` : ''}</li>`; }).join('') : s.cov.missing.length ? `<li>${esc(l.id)} is short of models first: ${esc(gapWords(s.cov.missing))}.</li>` : `<li class="ok">✓ Everything in ${esc(l.id)} is built and painted.</li>`}</ul>
<h3 class="sh">Standing queue</h3>
<ul class="flags">${(STORE.hobby.queue || []).map(x => `<li>${esc(x.task)}${x.est_hours ? ` · ≈${x.est_hours[0]}–${x.est_hours[1]} h` : ''}${x.unlocks ? ` · unlocks ${x.unlocks.join(', ')}` : ''}${x.note ? `<span class="src">${esc(x.note)}</span>` : ''}</li>`).join('')}</ul>
<h3 class="sh">Paint state per record</h3>
<div class="scroll"><table class="tbl"><thead><tr><th>Unit</th><th class="n">#</th><th>Paint</th></tr></thead><tbody>
${rows.map(i => `<tr><td>${esc(uname(i.unit))}<span class="sub">${esc(i.note || '')}</span></td><td class="n">${i.approx ? '≈' : ''}${i.models}</td><td><select data-field="paint" data-inv="${esc(i.id)}" aria-label="paint state">${STORE.hobby.paint_states.map(p => `<option${p === i.paint ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></td></tr>`).join('')}
</tbody></table></div>`;
  };

  // ----- GAMES -----
  VIEWS.games = () => {
    const g = STORE.games, log = g.log || [];
    return `
<div class="vh"><h2>Games</h2></div>
<p class="lead"><b class="mono">${log.length} / ${g.rule.threshold}</b> — ${esc(g.rule.name)}, counting ${esc(g.rule.counts_from)}. ${esc(g.rule.override_note || '')}</p>
<form class="f" data-form="game"><div class="row3"><label>Date<input type="date" name="date" value="${TODAY}" required></label><label>List<select name="list">${STORE.lists.concat(deviceLists()).map(l => `<option value="${esc(l.id)}">${esc(l.id)} · ${esc(l.name)}</option>`).join('')}</select></label><label>Result<select name="result"><option>W</option><option>L</option><option>D</option></select></label></div>
<div class="row2"><label>Opponent (faction / player)<input name="opponent" placeholder="e.g. Necrons, canoptek spam"></label><label>Score<input name="score" placeholder="e.g. 62–48"></label></div>
<label>One lesson<textarea name="lesson" placeholder="e.g. Battle-shock the contesters, not the champions."></textarea></label>
<div><button class="btn pri" type="submit">Log the game</button> <span class="hint">saved on this device until exported</span></div></form>
<h3 class="sh">The record</h3>
<ul class="rows">${log.slice().reverse().map((x, n) => `<li><span class="row"><span class="l"><b>${esc(x.result)}</b> vs ${esc(x.opponent || '?')} · list ${esc(x.list)}${x.score ? ' · ' + esc(x.score) : ''}<span class="sub">${esc(x.lesson || '')}</span></span><span class="r">${dshort(x.date)} <button class="btn ghost" data-act="g-del" data-n="${log.length - 1 - n}" aria-label="remove">✕</button></span></span></li>`).join('') || '<li><span class="row"><span class="l muted">No games logged. The rule stands.</span></span></li>'}</ul>`;
  };

  // ----- LIBRARY -----
  const LIB = [['Doctrine — how this army fights', [['codex-umbral-creed.html', 'Codex: The Umbral Creed', 'the army book — lore, unit entries, three doctrines, the ledger'], ['quartermaster.html', 'The army page', 'audited inventory, the six lists, verified rules, the road'], ['strategy.html', 'Day-one strategy note (Jul 20)', 'archived; superseded by the Primer']]],
    ['Learn to play', [['primer.html', "The Primer", "a first-time player's guide to the army rule, the detachment and each list"], ['guide.html', 'Print layout', 'the same guide as 31 printable pages'], ['GUIDE.pdf', 'GUIDE.pdf', 'for the table']]],
    ['Rules', [['rules-guide.html', "Be'lakor & the Shadow Legion explained", 'who he is, how the rules work, why lists look the way they do'], ['research.html', 'Rules research + re-verification (Jul 27)', 'verbatim Thralls text, the Epic Hero list, the points table']]],
    ['Painting, basing, transport', [['vision.html', 'One Legion of Shadow — the vision', 'five painting rules, unit-by-unit treatments, four phases, magnets and boxes']]],
    ['The market, and how to read it', [['scorecard.html', 'Painted-army scorecard', 'all factions, value-scored'], ['chaos.html', 'Chaos edition', 'deep-scored'], ['scout.html', 'Scout report (Jul 27)', 'graded single-unit targets; method still holds'], ['sweep-2026-07-21.html', 'Photo paint-tier sweep', 'why titles lie'], ['ebay-access.html', 'Reaching eBay from a cloud session', 'method note']]],
    ['This build', [['decisions.html', 'DECISIONS', 'proposal, dedupe map, design tournament, review batteries'], ['spec.html', 'The Muster spec', 'the brief this app answers'], ['archive.html', 'Archive', 'every dated snapshot with its status'], ['context.html', 'Context', 'the cross-account hand-off note']]]];
  VIEWS.library = () => `<div class="vh"><h2>Library</h2></div><p class="lead">Prose stays prose. These are the documents both lines of work produced, grouped by the job they do.</p>${LIB.map(([h, items]) => `<h3 class="sh">${esc(h)}</h3><ul class="rows index-rows">${items.map(([href, t, sub]) => `<li><a href="${href}"><span class="l">${esc(t)}<span class="sub">${esc(sub)}</span></span><span class="r">${esc(href)}</span></a></li>`).join('')}</ul>`).join('')}`;

  // ----- MORE -----
  VIEWS.more = () => {
    const hobbyN = Object.values(D.lists).reduce((s, r) => s + r.coverage.hobby.length, 0) ? STORE.inventory.filter(i => i.status === 'owned' && L.NOT_READY_PAINT.has(i.paint)).length : 0;
    const theme = LS.get('muster.theme', 'system'), skin = LS.get('muster.skin', '');
    const idx = [['#/hobby', 'Hobby', `${hobbyN} model record${hobbyN === 1 ? '' : 's'} not table-ready`, 'the queue between you and a painted list'], ['#/games', 'Games', `${D.games} / ${STORE.games.rule.threshold}`, 'the log, and the rule that gates buying'], ['#/orders', 'Orders', `${money(Math.round(D.spent), true)} · ${STORE.orders.length} · ${D.inbound.length} inbound`, 'the full ledger and the roads closed'], ['#/build', 'Builder', deviceLists().length ? `${deviceLists().length} on this device` : 'compose', 'the linter reads the fine print aloud'], ['#/library', 'Library', 'read', 'codex, primer, rules, vision, market method'], ['codex-umbral-creed.html', 'The codex as a book', 'open', 'parchment, printable']];
    return `
<div class="vh"><h2>More</h2></div>
<ul class="rows index-rows">${idx.map(([href, t, r, sub]) => `<li><a href="${href}"><span class="l">${esc(t)}<span class="sub">${esc(sub)}</span></span><span class="r">${esc(r)}</span></a></li>`).join('')}</ul>
<h3 class="sh">This device</h3>
${local ? `<div class="banner local"><span><b>${local.changes.length} unsynced change${local.changes.length === 1 ? '' : 's'}</b> saved here since store ${esc(dshort(STORE.meta.updated))}. Git is the database: export the store or copy the patch into a session, commit, and this banner clears itself on the next build.</span></div>
<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="export">Export muster.json</button><button class="btn" data-act="patch">Copy patch for a session</button><button class="btn ghost" data-act="discard">Discard local changes</button></div>
<pre class="out">${esc(local.changes.map((c, n) => `${n + 1}. ${c.text}`).join('\n'))}</pre>` : '<p class="muted">No local changes. What you see is the repo store.</p>'}
${STALE_LOCAL ? `<div class="banner"><span><b>Set aside:</b> ${STALE_LOCAL.changes.length} change${STALE_LOCAL.changes.length === 1 ? '' : 's'} made against an older store.</span><span><button class="btn" data-act="stalecopy">Copy them</button> <button class="btn ghost" data-act="stalediscard">Discard</button></span></div>` : ''}
<h3 class="sh">Hand-off</h3>
<p class="lead">Sessions, artifacts and memory stay inside the account that made them; the repo does not care. Paste the briefing into a Claude session from either account and it starts on the same page.</p>
<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="briefing">Copy briefing</button><button class="btn ghost" data-act="prompt">Copy the new-session prompt</button></div>
<h3 class="sh">Display</h3>
<div class="f"><div class="row2"><label>Theme<select data-setting="theme">${['system', 'light', 'dark'].map(t => `<option${t === theme ? ' selected' : ''}>${t}</option>`).join('')}</select></label><label>Skin<select data-setting="skin"><option value=""${!skin ? ' selected' : ''}>tool (default)</option><option value="codex"${skin === 'codex' ? ' selected' : ''}>codex — parchment and serif</option></select></label></div></div>
<h3 class="sh">About</h3>
<p class="lead">Muster reads one canonical file, <code>data/muster.json</code>, plus the market feed. Numbers on the prose pages are generated from the same file by <code>muster.py</code>; the linter is one implementation (<code>lint.js</code>) shared by this page and the validation script. Nothing here bids, buys or logs in anywhere. Repo: <code>evbarleyg/40k-armies</code> — collaborators <code>evbarleyg</code> (personal, admin) and <code>ebg-ant</code> (work-linked). Not affiliated with Games Workshop; rules gists are paraphrase with sources, verify in the official app.</p>`;
  };
  function briefing() {
    const st = STORE.lists.map(l => { const s = listStatus(l); return `${l.id} ${l.name}: ${pts(s.lint.total)} · ${s.legal ? 'legal' : 'NOT legal'} · ${s.status}${s.cov.missing.length ? ' — needs ' + gapWords(s.cov.missing) : s.cov.hobby.length ? ' — hobby: ' + s.cov.hobby.map(h => `${uname(h.unit)} ${h.paint}`).join(', ') : ''}`; });
    return [`Muster briefing — ${STORE.meta.warband} — ${TODAY}`,
      `Store: data/muster.json (updated ${STORE.meta.updated}); points ${STORE.meta.points_snapshot}; rules verified ${STORE.rules.snapshot.verified}. ${STORE.rules.snapshot.recheck || ''}`,
      `Owned: ${D.records} records, ${D.modelsOwned} models, ${pts(D.fieldablePoints)} fieldable pts; spent ≈$${Math.round(D.spent)} over ${STORE.orders.length} orders.`,
      `Inbound: ${D.inbound.map(o => `${o.item} (${etaState(o).text})`).join('; ') || 'nothing'}.`,
      'Lists:', ...st.map(s => '  - ' + s),
      `Games: ${D.games}/${STORE.games.rule.threshold} (${STORE.games.rule.name}).`,
      alerts().length ? 'Flags: ' + alerts().map(a => a.text.replace(/<[^>]+>/g, '')).join(' | ') : '',
      local ? `Unsynced local changes on this device (${local.changes.length}):\n` + local.changes.map((c, n) => `  ${n + 1}. ${c.text}`).join('\n') : 'No unsynced local changes.',
      'House rules: eBay is read-only (never log in, bid, offer, watch, message or check out); judge paint from full galleries, never titles; verify edition-current rules and cite them; explain jargon — the owner is new to 40K.'].filter(Boolean).join('\n');
  }
  const NEW_SESSION_PROMPT = 'Clone https://github.com/evbarleyg/40k-armies and read CLAUDE.md, docs/CONTEXT.md and data/muster.json before anything else — they hold my 40K army (Shadow Legion under Be\'lakor), the audited inventory and orders, the six lists, the eBay tooling and the house rules (eBay is read-only; judge paint from photos, never titles). Then: [what I want today]. Put facts in data/muster.json, run python3 build.py, commit and push; update docs/CONTEXT.md if the plan changed.';
  function patchText(changes) {
    return [`Apply these changes to data/muster.json in evbarleyg/40k-armies (recorded in Muster on ${TODAY}; base store ${STORE.meta.updated}):`, '',
      ...changes.map((c, n) => `${n + 1}. ${c.text}\n   patch: ${JSON.stringify(c.patch)}`), '',
      'Then bump meta.updated, run `python3 build.py` (it validates the store and regenerates muster.js and the doc tables), commit and push.'].join('\n');
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    const { parts, q } = route();
    if (act === 'filter') { location.hash = `#/collection?f=${el.dataset.f}`; }
    else if (act === 'open') { if (e.target.closest('select,a,button,input')) return; const id = el.dataset.id; const nq = new URLSearchParams(Object.assign({}, q, { open: q.open === id ? '' : id })); location.hash = `#/collection?${nq}`; }
    else if (act === 'go') { location.hash = el.dataset.href; }
    else if (act === 'csv') { download('collection.csv', ['unit,models,approx,paint,status,order,note'].concat(STORE.inventory.map(i => [uname(i.unit), i.models, i.approx ? 'approx' : '', i.paint, i.status, i.order || '', (i.note || '').replace(/"/g, "'")].map(v => `"${v}"`).join(','))).join('\n'), 'text/csv'); }
    else if (act === 'copylist') { const l = listById(el.dataset.list); if (l) copyText(listText(l), 'List'); }
    else if (act === 'buyfilter') { location.hash = `#/buy?f=${el.dataset.f}`; }
    else if (act === 'override') { LS.set('muster.buyOverride', !LS.get('muster.buyOverride', false)); render(true); }
    else if (act === 'hobbylist') { location.hash = `#/hobby?list=${el.dataset.list}`; }
    else if (act === 'b-add') { const uid = $('#b-unit').value, m = +$('#b-models').value || 1; builderMut(b => b.entries.push({ id: 'n' + (Date.now() % 1e6).toString(36) + b.entries.length, unit: uid, models: m })); }
    else if (act === 'b-del') { builderMut(b => { b.entries = b.entries.filter(x => x.id !== el.dataset.e); for (const x of b.entries) if (x.leads === el.dataset.e) delete x.leads; }); }
    else if (act === 'b-new') { LS.del('muster.builder'); render(true); }
    else if (act === 'b-save') { const b = LS.get('muster.builder'); const all = deviceLists().filter(x => x.id !== b.id); all.push(clone(b)); LS.set('muster.lists', all); toast(`Saved “${b.name}” on this device`); render(true); }
    else if (act === 'b-copy') { copyText(listText(LS.get('muster.builder')), 'List'); }
    else if (act === 'b-json') { const b = clone(LS.get('muster.builder')); copyText(JSON.stringify(b), 'Store JSON for this list'); }
    else if (act === 'c-quick') { crateMut(parts[1], d => d.rows.push({ unit: el.dataset.unit, models: +el.dataset.models, paint: 'painted', note: '' })); }
    else if (act === 'c-add') { const u = $('#c-unit').value, m = Math.max(1, +$('#c-models').value || 1); crateMut(parts[1], d => d.rows.push({ unit: u, models: m, paint: 'painted', note: '' })); }
    else if (act === 'c-del') { crateMut(parts[1], d => d.rows.splice(+el.dataset.n, 1)); }
    else if (act === 'c-save') { crateSave(parts[1]); }
    else if (act === 'g-del') { const n = +el.dataset.n; const x = STORE.games.log[n]; commit(`games.log: remove entry ${x.date} vs ${x.opponent || '?'}`, { op: 'games.remove', index: n }, s => s.games.log.splice(n, 1)); }
    else if (act === 'export') { const s = clone(STORE); s.meta.updated = TODAY; download('muster.json', JSON.stringify(s, null, 2)); toast('muster.json downloaded — replace data/muster.json, run python3 build.py, commit'); }
    else if (act === 'patch') { copyText(patchText(local ? local.changes : []), 'Patch'); }
    else if (act === 'discard') { if (confirm('Discard every local change on this device and go back to the repo store?')) { LS.del('muster.local'); LS.del('muster.crates'); location.reload(); } }
    else if (act === 'stalecopy') { copyText(patchText(STALE_LOCAL.changes), 'Old changes'); }
    else if (act === 'stalediscard') { LS.del('muster.local'); STALE_LOCAL = null; render(true); }
    else if (act === 'briefing') { copyText(briefing(), 'Briefing'); }
    else if (act === 'prompt') { copyText(NEW_SESSION_PROMPT, 'Prompt'); }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-act]')) { e.preventDefault(); e.target.click(); } });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-field="paint"]')) { const id = t.dataset.inv, v = t.value; commit(`inventory[${id}].paint → ${v}`, { op: 'inventory.update', id, set: { paint: v } }, s => { s.inventory.find(i => i.id === id).paint = v; }); }
    else if (t.matches('[data-bfield]')) builderMut(b => { b[t.dataset.bfield] = t.dataset.bfield === 'limit' ? +t.value : t.value; });
    else if (t.matches('[data-bentry]')) builderMut(b => { const e = b.entries.find(x => x.id === t.dataset.bentry); const k = t.dataset.bkey; if (k === 'models') e.models = +t.value; else if (k === 'warlord') { for (const x of b.entries) delete x.warlord; if (t.checked) e.warlord = true; } else if (t.value) e[k] = t.value; else delete e[k]; });
    else if (t.matches('#b-unit')) fillModels();
    else if (t.matches('[data-crow]')) crateMut(route().parts[1], d => { const r = d.rows[+t.dataset.crow]; r[t.dataset.ckey] = t.dataset.ckey === 'models' ? Math.max(1, +t.value || 1) : t.value; });
    else if (t.matches('[data-cmeta]')) crateMut(route().parts[1], d => { d[t.dataset.cmeta] = t.value; });
    else if (t.matches('[data-setting="theme"]')) { LS.set('muster.theme', t.value); applyDisplay(); }
    else if (t.matches('[data-setting="skin"]')) { LS.set('muster.skin', t.value); applyDisplay(); }
    else if (t.matches('th[data-sort]')) { /* handled by click */ }
  });
  document.addEventListener('click', e => { const th = e.target.closest('th[data-sort]'); if (!th) return; if (sortKey === th.dataset.sort) sortDir = -sortDir; else { sortKey = th.dataset.sort; sortDir = 1; } LS.set('muster.sort', sortKey); render(true); });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form="game"]'); if (!f) return; e.preventDefault();
    const fd = Object.fromEntries(new FormData(f)); const g = { date: fd.date, list: fd.list, result: fd.result, opponent: fd.opponent.trim(), score: fd.score.trim(), lesson: fd.lesson.trim() };
    commit(`games.log: add ${g.date} ${g.result} vs ${g.opponent || '?'} (list ${g.list})`, { op: 'games.add', value: g }, s => { s.games.log = s.games.log || []; s.games.log.push(g); });
  });
  function fillModels() { const sel = $('#b-models'), u = unitById($('#b-unit') && $('#b-unit').value); if (!sel || !u) return; sel.innerHTML = u.sizes.map(s => `<option>${s.models}</option>`).join(''); }
  function crateSave(oid) {
    const d = crateDraft(oid), o = orderById(oid); if (!d.rows.length || !o) return;
    const rows = d.rows.map((r, n) => ({ id: `i_${r.unit}_${oid}_${n + 1}`, unit: r.unit, models: r.models, paint: r.paint, status: 'owned', order: oid, note: r.note || undefined }));
    const text = `orders[${oid}] delivered ${d.delivered}${d.note ? ` (${d.note})` : ''}; inventory += ${rows.map(r => `${uname(r.unit)} ×${r.models} (${r.paint})`).join(', ')}`;
    commit(text, { op: 'crate.catalogue', order: oid, delivered: d.delivered, note: d.note || undefined, inventory: rows }, s => {
      const so = s.orders.find(x => x.id === oid); so.status = 'delivered'; so.delivered = d.delivered; so.contents = 'catalogued'; if (d.note) so.note = (so.note ? so.note + ' · ' : '') + d.note;
      for (const r of rows) { const clean = clone(r); if (!clean.note) delete clean.note; s.inventory.push(clean); }
    });
    const all = LS.get('muster.crates', {}); delete all[oid]; LS.set('muster.crates', all);
    location.hash = `#/crates/${oid}`;
  }
  function applyDisplay() {
    const theme = LS.get('muster.theme', 'system'), skin = LS.get('muster.skin', '');
    if (theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
    if (skin) document.documentElement.dataset.skin = skin; else delete document.documentElement.dataset.skin;
  }

  // ---------- boot ----------
  window.addEventListener('hashchange', () => render());
  applyDisplay(); render();
  // the builder's models picker depends on the selected unit
  new MutationObserver(() => { if ($('#b-models') && !$('#b-models').options.length) fillModels(); }).observe(document.getElementById('view'), { childList: true });
  fillModels();
})();
