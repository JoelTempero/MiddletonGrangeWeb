#!/usr/bin/env node
/**
 * coverage.js — quick stats on header-image coverage across scraped pages.
 * Reads scraped/pages/*.md frontmatter, reports:
 *   - pages with headerImage set
 *   - pages with NO headerImage (will show placeholder in build)
 *   - breakdown by section
 *   - example pages without headers
 */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAGES_DIR = join(ROOT, 'scraped', 'pages');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    let v = match[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    fm[match[1]] = v === '' || v === 'null' ? null : v;
  }
  return fm;
}

const files = (await readdir(PAGES_DIR)).filter(f => f.endsWith('.md'));
const stats = { withHeader: 0, withoutHeader: 0, bySection: {}, missing: [] };

for (const f of files) {
  const raw = await readFile(join(PAGES_DIR, f), 'utf8');
  const fm = parseFrontmatter(raw);
  const section = fm.section || 'other';
  if (!stats.bySection[section]) stats.bySection[section] = { total: 0, with: 0 };
  stats.bySection[section].total++;
  if (fm.headerImage) {
    stats.withHeader++;
    stats.bySection[section].with++;
  } else {
    stats.withoutHeader++;
    if (stats.missing.length < 20) stats.missing.push(f.replace(/\.md$/, ''));
  }
}

const total = files.length;
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
console.log(`\n=== Header-image coverage ===`);
console.log(`Total pages:     ${total}`);
console.log(`With header:     ${stats.withHeader}  (${pct(stats.withHeader)})`);
console.log(`Without header:  ${stats.withoutHeader}  (${pct(stats.withoutHeader)})`);
console.log(`\nBy section:`);
for (const [sec, s] of Object.entries(stats.bySection).sort()) {
  console.log(`  ${sec.padEnd(18)} ${String(s.with).padStart(4)}/${String(s.total).padEnd(4)}  ${((s.with / s.total) * 100).toFixed(0)}%`);
}
console.log(`\nFirst 20 pages missing headers:`);
for (const s of stats.missing) console.log(`  - ${s}`);
