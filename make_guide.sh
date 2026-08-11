#!/usr/bin/env bash
# Regenerate GUIDE.pdf from guide.html via headless Chromium (Playwright).
# Requires: node + playwright (`npm i playwright`), and a Chromium browser.
# Set PLAYWRIGHT_BROWSERS_PATH if browsers live in a non-default location.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML="$DIR/guide.html"
PDF="$DIR/GUIDE.pdf"

if [[ ! -f "$HTML" ]]; then
  echo "error: $HTML not found" >&2
  exit 1
fi

node - <<'JS' "$HTML" "$PDF"
const { chromium } = require('playwright');
const [,, html, pdf] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + html, { waitUntil: 'load' });
  await page.pdf({
    path: pdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center;color:#6e5f52;font-family:Georgia,serif;">' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
JS

echo "Wrote $PDF"
command -v pdfinfo >/dev/null 2>&1 && pdfinfo "$PDF" | grep -E '^(Pages|File size|Page size)' || true
