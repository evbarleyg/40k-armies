#!/usr/bin/env node
// Screenshot driver for the review battery: node tools/shoot.js <outdir> [width:scheme ...]
// Captures every Muster view plus key prose pages, reports console errors and horizontal overflow.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..') + '/';
const VIEWS = ['#/', '#/collection', '#/collection?f=todo', '#/collection?open=i_bloodletters', '#/lists', '#/lists/A', '#/lists/E', '#/build?from=F', '#/buy', '#/buy?f=all', '#/crates', '#/crates/o6', '#/crates/o1', '#/hobby', '#/games', '#/orders', '#/library', '#/more'];
const PAGES = ['quartermaster.html', 'codex-umbral-creed.html', 'context.html', 'decisions.html'];
(async () => {
  const out = process.argv[2] || 'design/battery'; fs.mkdirSync(out, { recursive: true });
  const combos = (process.argv.slice(3).length ? process.argv.slice(3) : ['390:dark', '1280:light']).map(s => s.split(':'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const problems = [];
  for (const [w, scheme] of combos) {
    const ctx = await b.newContext({ viewport: { width: +w, height: 844 }, colorScheme: scheme, deviceScaleFactor: 1 });
    if (process.env.SKIN) await ctx.addInitScript(skin => { try { localStorage.setItem('muster.skin', JSON.stringify(skin)); } catch (e) {} }, process.env.SKIN);
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') problems.push(`[console ${w} ${scheme}] ${m.text()}`); });
    p.on('pageerror', e => problems.push(`[pageerror ${w} ${scheme}] ${e.message}`));
    for (const v of VIEWS) {
      await p.goto(ROOT + 'index.html' + v); await p.waitForTimeout(120);
      const name = 'app' + (v.replace(/[#/?=&]+/g, '_').replace(/_$/, '') || '_home');
      await p.screenshot({ path: path.join(out, `${name}-${w}-${scheme}${process.env.SKIN ? '-' + process.env.SKIN : ''}.png`), fullPage: true });
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 0) problems.push(`[overflow ${w} ${scheme}] ${v} by ${ov}px`);
    }
    for (const pg of PAGES) {
      await p.goto(ROOT + pg); await p.waitForTimeout(80);
      await p.screenshot({ path: path.join(out, `${pg.replace('.html', '')}-${w}-${scheme}.png`), fullPage: true });
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 0) problems.push(`[overflow ${w} ${scheme}] ${pg} by ${ov}px`);
    }
    await ctx.close();
  }
  await b.close();
  console.log(problems.length ? problems.join('\n') : 'no console errors, no horizontal overflow');
})();
