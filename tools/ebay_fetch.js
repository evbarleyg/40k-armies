#!/usr/bin/env node
/* eBay item/search page fetcher via Playwright + agent proxy.
 * TLS: proxy CA is trusted via NSS db (~/.pki/nssdb) — cert validation stays ON.
 * Usage: node ebay_fetch.js <url> [<url> ...]   (or pipe URLs on stdin, one per line)
 * Output: one JSON line per URL on stdout.
 */
const { chromium } = require('playwright');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

async function readStdinLines() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => (buf += d));
    process.stdin.on('end', () =>
      resolve(
        buf
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  });
}

function parseItemId(url) {
  const m = url.match(/\/itm\/(?:[^/]*\/)?(\d{9,15})/);
  if (m) return m[1];
  const q = url.match(/[?&](?:item|itemId|iid)=(\d{9,15})/);
  return q ? q[1] : null;
}

async function extractItem(page) {
  return page.evaluate(() => {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => Array.from(document.querySelectorAll(sel));

    const title =
      txt(q('h1.x-item-title__mainTitle .ux-textspans')) ||
      txt(q('h1.x-item-title__mainTitle')) ||
      txt(q('[data-testid="x-item-title"]')) ||
      txt(q('h1'));

    const price =
      txt(q('[data-testid="x-price-primary"] .ux-textspans')) ||
      txt(q('.x-price-primary .ux-textspans')) ||
      txt(q('[data-testid="x-price-primary"]')) ||
      txt(q('.x-price-primary')) ||
      txt(q('.x-bin-price .ux-textspans')) ||
      txt(q('[itemprop="price"]'));

    // Shipping: find labels/values row containing "Shipping"
    let shipping = null;
    for (const row of qa('[data-testid="ux-labels-values"], .ux-labels-values')) {
      const label = txt(row.querySelector('.ux-labels-values__labels, .ux-labels-values__labels-content'));
      if (label && /shipping/i.test(label)) {
        shipping = txt(row.querySelector('.ux-labels-values__values, .ux-labels-values__values-content'));
        break;
      }
    }
    if (!shipping) {
      const s =
        q('[data-testid="d-shipping-minview"]') ||
        q('.d-shipping-minview') ||
        q('.ux-labels-values--shipping .ux-labels-values__values-content');
      shipping = txt(s);
    }

    // Condition
    let condition = null;
    for (const row of qa('[data-testid="ux-labels-values"], .ux-labels-values')) {
      const label = txt(row.querySelector('.ux-labels-values__labels, .ux-labels-values__labels-content'));
      if (label && /condition/i.test(label)) {
        condition = txt(row.querySelector('.ux-labels-values__values, .ux-labels-values__values-content'));
        break;
      }
    }
    if (!condition)
      condition =
        txt(q('[data-testid="x-item-condition"] .ux-textspans')) ||
        txt(q('.x-item-condition-value .ux-textspans')) ||
        txt(q('.x-item-condition-text .ux-textspans'));

    // Bid count
    let bidCount = null;
    const bidEl =
      q('[data-testid="x-bid-count"]') ||
      q('.x-bid-count') ||
      q('a[href*="ShowBidHistory"]') ||
      q('a[href*="/bfl/"]');
    if (bidEl) {
      const m = txt(bidEl).match(/(\d+)\s*bid/i);
      bidCount = m ? parseInt(m[1], 10) : txt(bidEl);
    }

    // End time
    const endTime =
      txt(q('[data-testid="x-end-time"]')) ||
      txt(q('.x-end-time')) ||
      txt(q('.ux-timer__text')) ||
      null;

    // Seller feedback %
    let sellerFeedback = null;
    const sellerCard =
      q('[data-testid="x-sellercard-atf"]') ||
      q('.x-sellercard-atf') ||
      q('[data-testid="x-about-this-seller"]') ||
      q('.ux-seller-section');
    if (sellerCard) {
      const m = txt(sellerCard).match(/(\d+(?:\.\d+)?%)\s*positive/i);
      sellerFeedback = m ? m[1] : txt(sellerCard).slice(0, 200);
    }

    // Visible page text with scripts/styles stripped, for banner detection
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,template').forEach((n) => n.remove());
    const visibleText = clone.textContent.replace(/\s+/g, ' ');

    const endedPatterns = [
      /This listing was ended/i,
      /This listing sold/i,
      /Bidding has ended/i,
      /Bidding ended on/i,
      /This listing has ended/i,
      /item .{0,20}?sold on/i,
    ];
    const ended = endedPatterns.some((re) => re.test(visibleText));

    let soldBanner = null;
    const bannerEl =
      q('[data-testid="d-statusmessage"]') ||
      q('.d-statusmessage') ||
      q('.ux-message--warning') ||
      q('.nodestar-item-card-details__banner') ||
      q('.vi-notify-new-bg-dBtm');
    if (bannerEl) soldBanner = txt(bannerEl).slice(0, 300);
    if (!soldBanner) {
      for (const re of endedPatterns) {
        const m = visibleText.match(re);
        if (m) {
          const i = visibleText.indexOf(m[0]);
          soldBanner = visibleText.slice(Math.max(0, i - 10), i + 120).trim();
          break;
        }
      }
    }

    // mediaList image ids from embedded JSON
    let imageIds = [];
    for (const s of qa('script')) {
      const t = s.textContent;
      if (t && t.includes('"mediaList"')) {
        // grab imageId or ids in i.ebayimg.com URLs
        const ids = new Set();
        for (const m of t.matchAll(/"imageId"\s*:\s*"([^"]+)"/g)) ids.add(m[1]);
        for (const m of t.matchAll(/i\.ebayimg\.com\/images\/g\/([A-Za-z0-9~_-]+)\/s-l/g)) ids.add(m[1]);
        if (ids.size) {
          imageIds = Array.from(ids);
          break;
        }
      }
    }
    if (!imageIds.length) {
      const ids = new Set();
      qa('.ux-image-carousel-item img, .ux-image-carousel img, [data-testid="ux-image-carousel"] img').forEach(
        (img) => {
          const src = img.src || img.getAttribute('data-src') || '';
          const m = src.match(/i\.ebayimg\.com\/images\/g\/([A-Za-z0-9~_-]+)\/s-l/);
          if (m) ids.add(m[1]);
        }
      );
      imageIds = Array.from(ids);
    }

    return { title, price, shipping, condition, bidCount, endTime, sellerFeedback, ended, soldBanner, imageIds };
  });
}

async function extractSearch(page) {
  return page.evaluate(() => {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
    const cleanTitle = (t) =>
      t ? t.replace(/^New Listing\s*/i, '').replace(/Opens in a new (window or tab|tab)$/i, '').trim() : t;
    const items = [];
    document.querySelectorAll('li.s-card, li.s-item, .s-item, li.brwrvr__item-card').forEach((card) => {
      const a =
        card.querySelector('a.s-card__link[href*="/itm/"]') ||
        card.querySelector('a.su-link[href*="/itm/"]') ||
        card.querySelector('.s-item__link, a.s-item__link') ||
        card.querySelector('a[href*="/itm/"]');
      let link = a ? a.href : null;
      if (!link || !/\/itm\//.test(link)) return;
      link = link.split('?')[0];
      const m = link.match(/\/itm\/(?:[^/]*\/)?(\d{9,15})/);
      const itemId = m ? m[1] : card.getAttribute('data-listingid');
      if (itemId === '123456' || /\/itm\/123456$/.test(link)) return;
      const title = cleanTitle(
        txt(card.querySelector('.s-card__title')) ||
          txt(card.querySelector('.s-item__title')) ||
          txt(card.querySelector('[role="heading"]')) ||
          txt(card.querySelector('h3'))
      );
      if (title && /^shop on ebay$/i.test(title)) return;
      const price =
        txt(card.querySelector('.s-card__price')) || txt(card.querySelector('.s-item__price'));
      items.push({ itemId, title, price, link });
    });
    return items;
  });
}

async function main() {
  let urls = process.argv.slice(2);
  if (!urls.length && !process.stdin.isTTY) urls = await readStdinLines();
  if (!urls.length) {
    console.error('usage: node ebay_fetch.js <url> [...]  (or pipe urls on stdin)');
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

  // Warm-up: hit homepage to acquire cookies (avoids 403 on first /itm/ request)
  try {
    await page.goto('https://www.ebay.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(500);
  } catch (_) {}

  for (const url of urls) {
    try {
      let resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
        referer: 'https://www.ebay.com/',
      });
      if (resp && resp.status() === 403) {
        await page.waitForTimeout(800);
        resp = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
          referer: 'https://www.ebay.com/',
        });
      }
      const status = resp ? resp.status() : null;
      let out;
      if (/\/itm\//.test(url)) {
        const data = await extractItem(page);
        out = { url, status, itemId: parseItemId(url), ...data };
      } else if (/\/sch\//.test(url) || /\/b\//.test(url)) {
        const results = await extractSearch(page);
        out = { url, status, resultCount: results.length, results };
      } else {
        const title = await page.title();
        out = { url, status, title };
      }
      process.stdout.write(JSON.stringify(out) + '\n');
    } catch (e) {
      process.stdout.write(JSON.stringify({ url, error: String(e && e.message ? e.message : e) }) + '\n');
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
