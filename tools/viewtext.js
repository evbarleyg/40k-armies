#!/usr/bin/env node
// Prints the visible text of a Muster view (or any page) so reviewers can read the app without a browser.
//   node tools/viewtext.js '#/lists/A'            → text of that view at 390px
//   node tools/viewtext.js '#/buy?f=all' 1280      → at 1280px
//   node tools/viewtext.js quartermaster.html       → a prose page
// Also prints load time and any console errors. Optional env: SKIN=codex THEME=light|dark
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const target = process.argv[2] || '#/', width = +(process.argv[3] || 390);
  const url = 'file://' + path.resolve(__dirname, '..') + '/' + (target.startsWith('#') ? 'index.html' + target : target);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await b.newContext({ viewport: { width, height: 844 }, colorScheme: process.env.THEME === 'light' ? 'light' : 'dark' });
  await ctx.addInitScript(([skin, theme]) => { try { if (skin) localStorage.setItem('muster.skin', JSON.stringify(skin)); if (theme) localStorage.setItem('muster.theme', JSON.stringify(theme)); } catch (e) {} }, [process.env.SKIN || '', process.env.THEME || '']);
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now(); await p.goto(url); await p.waitForTimeout(100); const ms = Date.now() - t0;
  const text = await p.evaluate(() => { const el = document.getElementById('view') || document.body; const mast = document.querySelector('header.mast'); return (mast ? mast.innerText + '\n—\n' : '') + el.innerText; });
  console.log(`[${target} @${width}px · loaded in ${ms} ms${errs.length ? ' · ERRORS: ' + errs.join(' | ') : ''}]\n` + text);
  await b.close();
})();
