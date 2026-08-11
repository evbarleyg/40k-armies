#!/usr/bin/env node
// Runs the shared linter over the canonical store for muster.py: prints derived numbers,
// per-list lint + coverage as JSON. Usage: node tools/lint_cli.js [data/muster.json]
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', 'lint.js'));
const store = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'data', 'muster.json'), 'utf8'));
const d = L.derive(store);
// drop object back-references so the JSON stays small
for (const id in d.lists) d.lists[id].lint.entries = d.lists[id].lint.entries.map(o => ({ id: o.entry.id, unit: o.entry.unit, pts: o.pts, unitPts: o.unitPts, flags: o.flags, enh: o.enh && o.enh.id }));
process.stdout.write(JSON.stringify(d));
