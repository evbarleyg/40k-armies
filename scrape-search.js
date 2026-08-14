/* scrape-search.js — paste into the browser console on any eBay search results page.
 *
 * Scores every result on the page for value and flags the traps this collection has
 * actually fallen into (3D-print recasts, wrong models, auctions masquerading as BINs).
 * Prints a sorted table and copies a pipe-delimited version to the clipboard.
 *
 * Tax rate below is Evan's exact effective rate for 98144, derived from the ledger:
 *   Bloodletters  $30.00 + $10.80 ship -> $45.10   (x1.1055)
 *   Bloodthirster $65.00 +  $5.58 ship -> $78.03   (x1.1055)
 * eBay applies it to (item + shipping), so landed = (price + ship) * 1.1055.
 *
 * Benchmarks come from the 2026-07-27 scouting pass: painted BIN $213 landed,
 * painted auction ~$191, unpainted ~$83, paint premium ~$130.
 */
(() => {
  const TAX = 1.1055;
  const UNKNOWN_SHIP = 12;           // assumed when eBay hides it

  // Things that mean "this is not a current Games Workshop plastic kit"
  const NOT_GW = /\b(resin|3-?d|print(ed|s)?|proxy|recast|stl|alternat(e|ive)|unofficial|not\s*gw|reference only|custom sculpt)\b/i;
  // Things that mean "this is the wrong model entirely"
  const WRONG = /\b(metal|oop|out of production|vintage|classic|forge ?world|cygor|deathbringer|daemon prince|skarbrand|bit[sz]|sprue|spares?|poster|card|token|decal|transfer)\b/i;
  const PAINTED = /\b(painted|pro.?paint|commission|tabletop|battle.?ready|display)\b/i;

  const money = t => { const m = (t || '').replace(/,/g, '').match(/\$\s?([\d.]+)/); return m ? parseFloat(m[1]) : null; };
  const pick = (el, sels) => { for (const s of sels) { const n = el.querySelector(s); if (n && n.textContent.trim()) return n.textContent.trim(); } return ''; };

  const cards = [...document.querySelectorAll('li.s-item, li.s-card, ul.srp-results > li')];

  const rows = cards.map(el => {
    const title = pick(el, ['.s-item__title', '.s-card__title', '[role=heading]']);
    if (!title || /shop on ebay/i.test(title)) return null;

    const price = money(pick(el, ['.s-item__price', '.s-card__price']));
    if (!price) return null;

    const shipTxt = pick(el, ['.s-item__shipping', '.s-item__logisticsCost', '.s-card__logisticsCost']);
    const ship = /free/i.test(shipTxt) ? 0 : money(shipTxt);
    const bidTxt = pick(el, ['.s-item__bids', '.s-item__bidCount']);
    const bids = /\d/.test(bidTxt) ? parseInt(bidTxt, 10) : null;

    const href = (el.querySelector('a.s-item__link, a[href*="/itm/"]') || {}).href || '';
    const id = (href.match(/\/itm\/(\d+)/) || [])[1] || '';

    const landed = +((price + (ship ?? UNKNOWN_SHIP)) * TAX).toFixed(2);

    const flags = [];
    if (NOT_GW.test(title))  flags.push('NOT-GW?');
    if (WRONG.test(title))   flags.push('WRONG-MODEL?');
    if (!PAINTED.test(title)) flags.push('unpainted?');
    if (ship === null)       flags.push('ship-est');
    if (bids !== null)       flags.push(`AUCTION:${bids}bid`);

    const disqualified = flags.some(f => f.startsWith('NOT-GW') || f.startsWith('WRONG'));
    const verdict = disqualified ? 'SKIP'
      : landed < 150 ? 'STEAL'
      : landed < 180 ? 'GOOD'
      : landed < 220 ? 'FAIR'
      : 'SKIP';

    return { verdict, landed, price, ship: ship ?? '?', flags: flags.join(' '), id, title: title.slice(0, 72), href };
  }).filter(Boolean).sort((a, b) => a.landed - b.landed);

  console.table(rows.map(({ href, ...r }) => r));
  const tsv = rows.map(r => [r.verdict, r.landed, r.price, r.ship, r.flags, r.id, r.title].join('|')).join('\n');
  try { copy(tsv); } catch (e) { console.log(tsv); }
  console.log(`%c${rows.length} results scored and copied to clipboard.`, 'color:#b3242f;font-weight:bold');
  console.log('%cSTEAL <$150 · GOOD <$180 · FAIR <$220 · anything flagged NOT-GW or WRONG-MODEL needs eyes on the description before you bid.', 'color:#8a6a3b');
})();
