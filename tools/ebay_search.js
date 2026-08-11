#!/usr/bin/env node
/* eBay search via Playwright + agent proxy.
 * TLS: proxy CA trusted via NSS db (~/.pki/nssdb) — cert validation stays ON.
 * Usage: node ebay_search.js "<query>"
 * Output: JSON {query, url, status, resultCount, results: [{itemId,title,price,shipping,link,isAuction}...]}
 */
const { chromium } = require('playwright');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

async function extractResults(page, limit) {
  return page.evaluate((limit) => {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
    const cleanTitle = (t) =>
      t ? t.replace(/^New Listing\s*/i, '').replace(/Opens in a new (window or tab|tab)$/i, '').trim() : t;
    const items = [];
    // New /sch/ layout: li.s-card. Legacy + /b/ browse: .s-item, li.brwrvr__item-card.
    const cards = document.querySelectorAll('li.s-card, li.s-item, .s-item, li.brwrvr__item-card');
    for (const card of cards) {
      const a =
        card.querySelector('a.s-card__link[href*="/itm/"]') ||
        card.querySelector('a.su-link[href*="/itm/"]') ||
        card.querySelector('a.s-item__link') ||
        card.querySelector('a[href*="/itm/"]');
      let link = a ? a.href : null;
      if (!link || !/\/itm\//.test(link)) continue;
      // strip tracking noise
      link = link.split('?')[0];
      const listingAttr = card.getAttribute('data-listingid');
      const m = link.match(/\/itm\/(?:[^/]*\/)?(\d{9,15})/);
      let itemId = m ? m[1] : listingAttr;
      // skip placeholder/sponsored dummy card
      if (itemId === '123456' || /\/itm\/123456$/.test(link)) continue;
      let title = cleanTitle(
        txt(card.querySelector('.s-card__title')) ||
          txt(card.querySelector('.s-item__title')) ||
          txt(card.querySelector('.bsig__title')) ||
          txt(card.querySelector('[role="heading"]')) ||
          txt(card.querySelector('h3'))
      );
      if (title && /^shop on ebay$/i.test(title)) continue;
      const price =
        txt(card.querySelector('.s-card__price')) ||
        txt(card.querySelector('.s-item__price')) ||
        txt(card.querySelector('.bsig__price'));
      const cardText = txt(card) || '';
      let shipping =
        txt(card.querySelector('.s-item__shipping, .s-item__logisticsCost')) ||
        txt(card.querySelector('.s-card__shipping, .s-card__attribute-row--logistics')) ||
        txt(card.querySelector('.bsig__logistics'));
      if (!shipping) {
        const sm = cardText.match(/(Free (?:shipping|delivery)|\+?\$[\d.,]+ (?:shipping|delivery))/i);
        shipping = sm ? sm[1] : null;
      }
      const bidsEl = txt(card.querySelector('.s-item__bids, .s-item__bidCount, .s-card__bidCount'));
      const bidMatch = (bidsEl || cardText).match(/(\d+)\s*bids?\b/i);
      const bids = bidMatch ? parseInt(bidMatch[1], 10) : null;
      const isAuction = bids !== null;
      items.push({ itemId, title, price, shipping, link, isAuction, bids: bids ?? undefined });
      if (items.length >= limit) break;
    }
    return items;
  }, limit);
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('usage: node ebay_search.js "<query>"');
    process.exit(2);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium',
    proxy: { server: process.env.HTTPS_PROXY },
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Not)A;Brand";v="99", "Chromium";v="127", "Google Chrome";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
    },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // Warm-up for cookies
  try {
    await page.goto('https://www.ebay.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(500);
  } catch (_) {}

  const enc = encodeURIComponent(query);
  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${enc}&_sop=10&LH_PrefLoc=1`;
  let usedUrl = searchUrl;
  let results = [];
  let status = null;

  try {
    let resp = await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
      referer: 'https://www.ebay.com/',
    });
    status = resp ? resp.status() : null;
    if (status === 403) {
      await page.waitForTimeout(800);
      resp = await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
        referer: 'https://www.ebay.com/',
      });
      status = resp ? resp.status() : null;
    }
    if (status === 200) results = await extractResults(page, 40);

    if (status !== 200 || results.length === 0) {
      // Fallback: /b/ category browse (Warhammer 40K cat 183473) with keyword
      const browseUrl = `https://www.ebay.com/b/183473?_nkw=${enc}&_sop=10&LH_PrefLoc=1`;
      const resp2 = await page.goto(browseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
        referer: 'https://www.ebay.com/',
      });
      const status2 = resp2 ? resp2.status() : null;
      if (status2 === 200) {
        const r2 = await extractResults(page, 40);
        if (r2.length) {
          usedUrl = browseUrl;
          status = status2;
          results = r2;
        }
      }
    }

    process.stdout.write(
      JSON.stringify({ query, url: usedUrl, status, resultCount: results.length, results }) + '\n'
    );
  } catch (e) {
    process.stdout.write(
      JSON.stringify({ query, url: usedUrl, error: String(e && e.message ? e.message : e) }) + '\n'
    );
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
