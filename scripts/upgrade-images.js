#!/usr/bin/env node
/**
 * upgrade-images.js — Pull higher-resolution WordPress originals for images
 * the scraper only got as thumbnails.
 *
 * Strategy:
 *   1. Walk scraped/media/* for files matching `-WxH.ext` (a WP-generated size variant)
 *   2. For each, request the no-suffix original from middleton.school.nz
 *   3. Save it alongside the variant
 *   4. Update scraped/pages/*.md to reference the no-suffix version
 *   5. Update scraped/manifest.json frontmatter accordingly
 *
 * Why: WordPress emits srcset with multiple sizes; the inline `src` is usually the
 * smallest thumbnail. The original always lives at the same URL with the size
 * suffix removed (e.g. `image-300x200.jpg` → `image.jpg`).
 */

import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import PQueue from 'p-queue';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'scraped', 'media');
const PAGES_DIR = join(ROOT, 'scraped', 'pages');
const MANIFEST_PATH = join(ROOT, 'scraped', 'manifest.json');

const ORIGIN = 'https://www.middleton.school.nz';
const USER_AGENT = 'MGS-Sitemap-Bot/0.2 (joel@tempero.nz; image upgrade)';
const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 30_000;

// ============================================================
// FIND THUMB FILES
// ============================================================
const VARIANT_RE = /^(.+?)-(\d+)x(\d+)(\.(jpg|jpeg|png|webp|gif))$/i;

async function findThumbFiles() {
  const thumbs = [];
  async function walk(dir, rel = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(path, relPath);
      } else if (entry.isFile() && VARIANT_RE.test(entry.name)) {
        thumbs.push(relPath);
      }
    }
  }
  await walk(MEDIA_DIR);
  return thumbs;
}

// Map: thumb relative path → original relative path
function deriveOriginal(thumbRel) {
  const slash = thumbRel.lastIndexOf('/');
  const dir = slash >= 0 ? thumbRel.slice(0, slash) : '';
  const fname = slash >= 0 ? thumbRel.slice(slash + 1) : thumbRel;
  const m = fname.match(VARIANT_RE);
  if (!m) return null;
  const originalFname = m[1] + m[4];
  return dir ? `${dir}/${originalFname}` : originalFname;
}

// ============================================================
// DOWNLOAD
// ============================================================
async function downloadOriginal(originalRel) {
  const localPath = join(MEDIA_DIR, originalRel);
  if (existsSync(localPath)) {
    return { skipped: true, exists: true };
  }
  const url = `${ORIGIN}/wp-content/uploads/${originalRel}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    await mkdir(dirname(localPath), { recursive: true });
    await pipeline(Readable.fromWeb(res.body), createWriteStream(localPath));
    const stats = await stat(localPath);
    return { downloaded: true, size: stats.size };
  } catch (e) {
    return { error: e.message };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// UPDATE REFERENCES IN MD FILES AND MANIFEST
// ============================================================
async function updateReferences(upgrades) {
  // upgrades: Map<thumbRel, originalRel>
  console.log(`\nRewriting references in ${upgrades.size} pages of media…`);

  // Update markdown files
  const files = await readdir(PAGES_DIR);
  let mdEdits = 0;
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const path = join(PAGES_DIR, file);
    let content = await readFile(path, 'utf8');
    let changed = false;
    for (const [thumb, original] of upgrades) {
      if (content.includes(thumb)) {
        content = content.split(thumb).join(original);
        changed = true;
      }
    }
    if (changed) {
      await writeFile(path, content, 'utf8');
      mdEdits++;
    }
  }
  console.log(`  Updated ${mdEdits} markdown files`);

  // Update manifest's media map + pages headerImage
  if (existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    let mediaUpdates = 0;
    if (manifest.media) {
      for (const [url, localRel] of Object.entries(manifest.media)) {
        if (upgrades.has(localRel)) {
          manifest.media[url] = upgrades.get(localRel);
          mediaUpdates++;
        }
      }
    }
    let pageUpdates = 0;
    if (manifest.pages) {
      for (const p of Object.values(manifest.pages)) {
        if (p.headerImage && upgrades.has(p.headerImage)) {
          p.headerImage = upgrades.get(p.headerImage);
          pageUpdates++;
        }
      }
    }
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`  Manifest: ${mediaUpdates} media refs + ${pageUpdates} page headers updated`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('Scanning for WP size-variant thumbnails…');
  const thumbs = await findThumbFiles();
  console.log(`  Found ${thumbs.length} thumb files`);

  // Group by original path so we don't fetch the same original twice
  const targets = new Map(); // originalRel → [thumbRel,...]
  for (const t of thumbs) {
    const original = deriveOriginal(t);
    if (!original) continue;
    if (!targets.has(original)) targets.set(original, []);
    targets.get(original).push(t);
  }
  console.log(`  ${targets.size} unique originals to fetch`);

  const queue = new PQueue({ concurrency: CONCURRENCY });
  const stats = { downloaded: 0, alreadyHave: 0, notFound: 0, errors: 0 };
  const upgrades = new Map(); // thumbRel → originalRel (only when original successfully exists)
  let processed = 0;

  for (const [original, thumbList] of targets) {
    queue.add(async () => {
      const result = await downloadOriginal(original);
      processed++;
      if (result.downloaded) {
        stats.downloaded++;
        for (const t of thumbList) upgrades.set(t, original);
      } else if (result.skipped) {
        stats.alreadyHave++;
        for (const t of thumbList) upgrades.set(t, original);
      } else if (result.error && result.error.startsWith('HTTP 404')) {
        stats.notFound++;
      } else {
        stats.errors++;
      }
      if (processed % 100 === 0) {
        console.log(`  [${processed}/${targets.size}] downloaded ${stats.downloaded}, have ${stats.alreadyHave}, 404 ${stats.notFound}, err ${stats.errors}`);
      }
    });
  }

  await queue.onIdle();
  console.log(`\n=== Image fetch done ===`);
  console.log(`  Downloaded:   ${stats.downloaded}`);
  console.log(`  Already had:  ${stats.alreadyHave}`);
  console.log(`  Not found:    ${stats.notFound}`);
  console.log(`  Errors:       ${stats.errors}`);
  console.log(`  Upgradeable:  ${upgrades.size} thumb references`);

  if (upgrades.size > 0) {
    await updateReferences(upgrades);
  }
  console.log('\nDone. Run `npm run build` to regenerate pages with the upgraded images.');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
