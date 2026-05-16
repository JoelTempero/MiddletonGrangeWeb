#!/usr/bin/env node
/**
 * scrape.js — middleton.school.nz → local Markdown + media archive.
 *
 * Phases:
 *   1. Discover: BFS crawl every same-origin link from the seed URL
 *   2. Process: fetch HTML, extract main content, rewrite media URLs,
 *      convert to Markdown, download media files
 *   3. Manifest: write URL→slug map, stats, errors
 *
 * CLI:
 *   node scripts/scrape.js                  — full scrape (skips already-done URLs)
 *   node scripts/scrape.js --resume         — resume from existing manifest
 *   node scripts/scrape.js --fresh          — wipe manifest, start over
 *   node scripts/scrape.js --limit=N        — stop after N pages (testing)
 *   node scripts/scrape.js --no-media       — skip media downloads (testing)
 */

import { writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL as NodeURL } from 'node:url';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import PQueue from 'p-queue';
import slugify from 'slugify';

// ============================================================
// CONFIG
// ============================================================
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SEED_URL = 'https://www.middleton.school.nz/';
const ORIGIN = 'https://www.middleton.school.nz';
const USER_AGENT = 'MGS-Sitemap-Bot/0.1 (joel@tempero.nz; site rebuild for school)';

// Yoast SEO sub-sitemaps to seed from (skip envira/album/category/tag — noise)
const SITEMAPS = [
  `${ORIGIN}/page-sitemap.xml`,
  `${ORIGIN}/post-sitemap.xml`,
  `${ORIGIN}/event-sitemap.xml`,
  `${ORIGIN}/site-notice-sitemap.xml`,
];

const OUT_DIR = join(ROOT, 'scraped');
const PAGES_DIR = join(OUT_DIR, 'pages');
const MEDIA_DIR = join(OUT_DIR, 'media');
const LOG_DIR = join(OUT_DIR, '_log');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');

const CONCURRENCY = 3;            // polite concurrent fetches
const REQUEST_DELAY_MS = 250;      // gentle stagger between requests
const FETCH_TIMEOUT_MS = 30_000;

// Skip these URL patterns (admin areas, search, feeds, attachments, archives, noise)
const SKIP_PATTERNS = [
  /\/wp-admin/,
  /\/wp-json/,
  /\/wp-login/,
  /\/feed\/?$/,
  /\/page\/\d+/,                                                       // WP pagination
  /\?.*replytocom=/,                                                    // comment replies
  /#/,                                                                  // hash fragments
  /\/(19|20)\d{2}(\/\d{1,2})?(\/\d{1,2})?\/?$/,                         // date archives
  /\/alumni-profiles\/\d+\/?$/,                                         // listing pagination
  /\/envira\//,                                                         // gallery lightbox
  /\/events\/event\//,                                                  // KAMAR per-day timetable stubs (Mon-A-34 etc)
  /\/category\//,                                                       // WP taxonomy listings
  /\/tag\//,                                                            // WP taxonomy listings
  /\/author\//,                                                         // WP author archives
  /\/event-venue\//,                                                    // event taxonomy
  /\/event-category\//,                                                 // event taxonomy
];

const MEDIA_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf',
  '.mp4', '.webm', '.mov',
  '.mp3', '.wav',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

// Content selectors in priority order
const CONTENT_SELECTORS = [
  'article .entry-content',
  '.entry-content',
  'article',
  'main',
  '#content',
  '#main',
];

// Strip these from extracted content
const STRIP_SELECTORS = [
  'script', 'style', 'noscript', 'iframe.wp-embedded-content',
  '.elementor-button-wrapper.sc_logo', // dev artifacts
  'nav', 'header.site-header', 'footer.site-footer',
  '.share-buttons', '.social-share', '.comments-area', '#comments',
  '.sidebar', '#secondary',
  'form.search-form',
  '.elementor-shortcode',           // often empty wrappers
  '.sub-menu', '.menu-item-has-children > ul',  // nested menus
  '.elementor-nav-menu', '.elementor-widget-nav-menu',
  '.entry-meta', '.post-meta',
  '.breadcrumbs', '.breadcrumb',
  '.elementor-icon-list--layout-traditional ul',  // common menu widget
  '[aria-label="breadcrumb"]', '[aria-label="Breadcrumb"]',
];

// Map URL path segments to canonical menu section ids (from SITE_CONTENT.md)
const SECTION_MAP = {
  'principals-welcome': 'about-mgs',
  'special-character': 'about-mgs',
  'vision-mission-statement': 'about-mgs',
  'history': 'about-mgs',
  'main-school-leaders': 'about-mgs',
  'board': 'about-mgs',
  'four-schools-in-one': 'life-at-mgs',
  'primary-school-years-1-6': 'life-at-mgs',
  'middle-school-years-7-10': 'life-at-mgs',
  'senior-college-years-11-13': 'life-at-mgs',
  'international': 'international',
  'enrolment-information': 'enrolment',
  'enrolment-scheme': 'enrolment',
  'fees-other-costs': 'enrolment',
  'curriculum-subjects': 'learning',
  'ncea-information': 'learning',
  'pastoral-care': 'learning',
  'sport': 'learning',
  'performing-arts': 'learning',
  'te-ohu-kahika': 'kahika-centre',
  'school-hours-term-dates': 'news-events',
  'calendar': 'news-events',
  'latest-news': 'news-events',
  'newsletters': 'news-events',
  'alumni': 'alumni',
  'alumni-profiles': 'alumni',
};

// CLI args
const args = new Set(process.argv.slice(2));
const LIMIT = parseInt(getArgValue('--limit') || '0', 10);
const SKIP_MEDIA = args.has('--no-media');
const FRESH = args.has('--fresh');
const FORCE = args.has('--force'); // re-process pages already in manifest (rediscover images)

function getArgValue(name) {
  const arg = [...args].find(a => a.startsWith(name + '='));
  return arg ? arg.split('=')[1] : null;
}

// ============================================================
// STATE — manifest is single source of truth
// ============================================================
let manifest = {
  startedAt: new Date().toISOString(),
  completedAt: null,
  pages: {},      // slug → { url, title, parent, section, headerImage, mediaCount, scrapedAt }
  urlToSlug: {},  // original URL → slug
  media: {},      // original URL → local relative path
  errors: [],     // { url, phase, message }
  pending: [],    // URLs queued but not yet processed (for resume)
  visited: new Set(),
};

// ============================================================
// UTILITIES
// ============================================================
function log(level, msg) {
  const time = new Date().toLocaleTimeString('en-NZ', { hour12: false });
  const line = `[${time}] [${level}] ${msg}`;
  console.log(line);
  return line;
}

function normalizeUrl(href, base) {
  try {
    const u = new NodeURL(href, base);
    u.hash = '';
    // Trailing slash normalize (except root)
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }
    return u.toString();
  } catch {
    return null;
  }
}

function isSameOrigin(url) {
  try {
    return new NodeURL(url).origin === ORIGIN;
  } catch { return false; }
}

function shouldSkip(url) {
  return SKIP_PATTERNS.some(p => p.test(url));
}

function urlToSlug(url) {
  try {
    const u = new NodeURL(url);
    let path = u.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return 'home';
    // Last segment, or full path with dashes
    const parts = path.split('/').filter(Boolean);
    const lastSeg = parts[parts.length - 1];
    return slugify(lastSeg, { lower: true, strict: true });
  } catch { return 'unknown'; }
}

function urlToParent(url) {
  try {
    const u = new NodeURL(url);
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return slugify(parts[parts.length - 2], { lower: true, strict: true });
  } catch { return null; }
}

function urlToSection(url) {
  try {
    const u = new NodeURL(url);
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    for (const p of parts) {
      if (SECTION_MAP[p]) return SECTION_MAP[p];
    }
    return null;
  } catch { return null; }
}

function isMediaUrl(url) {
  try {
    const ext = extname(new NodeURL(url).pathname).toLowerCase();
    return MEDIA_EXT.has(ext);
  } catch { return false; }
}

function mediaLocalPath(url) {
  try {
    const u = new NodeURL(url);
    // Preserve WP upload structure: /wp-content/uploads/2021/05/file.jpg → media/2021/05/file.jpg
    let path = u.pathname.replace(/^\/wp-content\/uploads\//, '');
    if (path === u.pathname) {
      // Not in uploads — flatten under media/external/
      path = 'external/' + path.replace(/^\/+/, '');
    }
    return path;
  } catch { return null; }
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// FETCH
// ============================================================
async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Not HTML (${contentType})`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSitemapUrls() {
  const urls = new Set();
  for (const sm of SITEMAPS) {
    try {
      const res = await fetch(sm, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) {
        log('WARN', `Sitemap ${sm} returned ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
      let added = 0;
      for (const m of matches) {
        const url = m.replace(/<\/?loc>/g, '').trim();
        const normalized = normalizeUrl(url, ORIGIN);
        if (normalized && isSameOrigin(normalized) && !shouldSkip(normalized) && !isMediaUrl(normalized)) {
          urls.add(normalized);
          added++;
        }
      }
      log('INFO', `Sitemap ${sm.split('/').pop()}: ${added} usable URLs`);
    } catch (e) {
      log('WARN', `Sitemap fetch failed: ${sm} — ${e.message}`);
    }
  }
  return [...urls];
}

async function downloadMedia(url) {
  const localRel = mediaLocalPath(url);
  if (!localRel) return null;
  const localAbs = join(MEDIA_DIR, localRel);
  if (existsSync(localAbs)) {
    return localRel; // already downloaded
  }
  await ensureDir(dirname(localAbs));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(localAbs));
    return localRel;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// PARSE
// ============================================================
function extractContent($) {
  let $content = null;
  for (const sel of CONTENT_SELECTORS) {
    const found = $(sel).first();
    if (found.length && found.text().trim().length > 50) {
      $content = found;
      break;
    }
  }
  if (!$content) $content = $('body');

  // Strip junk
  STRIP_SELECTORS.forEach(sel => $content.find(sel).remove());

  return $content;
}

function extractTitle($) {
  const h1 = $('article h1, .entry-title, h1').first().text().trim();
  if (h1) return h1.replace(/\s+/g, ' ');
  const title = $('title').text().trim();
  return title.replace(/\s*[\|\-–]\s*Middleton Grange School.*$/i, '').replace(/\s+/g, ' ').trim();
}

// Parse JSON-ish url out of an Elementor data-settings string.
// Looks for `"<key>":{ ..."url":"<url>"... }` and returns the first match.
function findKeyedUrl(jsonish, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*\\{[^}]*?"url"\\s*:\\s*"([^"]+)"`);
  const m = jsonish.match(re);
  if (!m) return null;
  return m[1].replace(/\\\//g, '/');
}

function parseStyleBgUrl(style) {
  if (!style) return null;
  const m = style.match(/background-image:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : null;
}

// Smarter header detection. Priority:
//   1. Yoast og:image meta (page-author set featured image) — best signal
//   2. JSON-LD primaryImageOfPage / thumbnailUrl from Yoast schema
//   3. First Elementor top section with background_image or inline bg url
//   4. First video widget's image_overlay
//   5. Fallback: first body image (current behaviour)
function extractHeaderImage($, $content) {
  // 1. og:image meta
  const og = $('meta[property="og:image"]').attr('content');
  if (og && /\.(jpe?g|png|webp|gif)$/i.test(og)) return og;

  // 2. JSON-LD schema thumbnailUrl
  const ldNode = $('script[type="application/ld+json"]').first();
  if (ldNode.length) {
    const raw = ldNode.text();
    if (raw) {
      const tm = raw.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/) ||
                 raw.match(/"primaryImageOfPage"[^{]*\{[^}]*"url"\s*:\s*"([^"]+)"/);
      if (tm) return tm[1].replace(/\\\//g, '/');
    }
  }

  // 3. First Elementor top section
  const firstSection = $('.elementor-top-section').first();
  if (firstSection.length) {
    const settings = firstSection.attr('data-settings');
    if (settings) {
      const decoded = settings; // cheerio auto-decodes &quot;
      const bgUrl = findKeyedUrl(decoded, 'background_image');
      if (bgUrl) return bgUrl;
    }
    // Inline style background-image inside the first section
    const styled = firstSection.find('[style*="background-image"]').first();
    if (styled.length) {
      const url = parseStyleBgUrl(styled.attr('style'));
      if (url) return url;
    }
  }

  // 4. First video widget's image_overlay
  const firstVideo = $('.elementor-widget-video[data-settings]').first();
  if (firstVideo.length) {
    const url = findKeyedUrl(firstVideo.attr('data-settings') || '', 'image_overlay');
    if (url) return url;
  }

  // 5. Conventional WP hero locations + first body img (last resort)
  const candidates = [
    $('article header img, .entry-header img, .hero img, .wp-post-image').first(),
    $content.find('img').first(),
  ];
  for (const c of candidates) {
    if (c.length) {
      const src = c.attr('src') || c.attr('data-src');
      if (src) return src;
    }
  }
  return null;
}

function extractInternalLinks($) {
  const links = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const url = normalizeUrl(href, ORIGIN);
    if (url && isSameOrigin(url) && !shouldSkip(url) && !isMediaUrl(url)) {
      links.add(url);
    }
  });
  return [...links];
}

function findMediaUrls($content, $page) {
  const urls = new Set();
  const add = (u) => {
    if (!u) return;
    const abs = normalizeUrl(u, ORIGIN);
    if (abs && isSameOrigin(abs)) urls.add(abs);
  };
  // <img> tags — src, data-src, data-lazy-src
  $content.find('img').each((_, el) => {
    const $el = $content.find(el);
    add($el.attr('src'));
    add($el.attr('data-src'));
    add($el.attr('data-lazy-src'));
    // srcset: pick the largest by width descriptor
    const srcset = $el.attr('srcset') || $el.attr('data-srcset') || $el.attr('data-lazy-srcset');
    if (srcset) {
      const candidates = srcset.split(',').map(s => {
        const m = s.trim().match(/^(\S+)\s+(\d+)w/);
        return m ? { url: m[1], w: parseInt(m[2], 10) } : null;
      }).filter(Boolean);
      if (candidates.length) {
        candidates.sort((a, b) => b.w - a.w);
        add(candidates[0].url);
      }
    }
  });
  // <video> poster + <source> tags
  $content.find('video, source').each((_, el) => {
    const $el = $content.find(el);
    add($el.attr('src'));
    add($el.attr('data-src'));
    add($el.attr('poster'));
  });
  // Inline CSS background-image: url(...) on any element
  $content.find('[style*="background-image"]').each((_, el) => {
    add(parseStyleBgUrl($content.find(el).attr('style')));
  });
  // Elementor data-settings JSON — pull every absolute URL ending in a media ext
  $content.find('[data-settings]').each((_, el) => {
    const settings = $content.find(el).attr('data-settings');
    if (!settings) return;
    const matches = settings.match(/https?:\\?\/\\?\/[^"',\s]+\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mp3|wav|pdf|docx?|xlsx?|pptx?)/gi);
    if (matches) {
      matches.forEach(m => add(m.replace(/\\\//g, '/')));
    }
  });
  // Linked media (PDFs, etc.)
  $content.find('a[href]').each((_, el) => {
    const href = $content.find(el).attr('href');
    if (href && isMediaUrl(normalizeUrl(href, ORIGIN) || '')) add(href);
  });
  // Page-level: og:image (Yoast featured image) — even if outside $content
  if ($page) {
    const og = $page('meta[property="og:image"]').attr('content');
    if (og) add(og);
  }
  return [...urls];
}

// ============================================================
// CONVERT
// ============================================================
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  hr: '---',
});

// Drop empty paragraphs and divs that carry no info
turndown.addRule('strip-empty-elementor', {
  filter: (node) => {
    if (!node.classList) return false;
    const classes = node.className?.toString?.() || '';
    return /elementor-(spacer|divider)/.test(classes);
  },
  replacement: () => '',
});

function htmlToMarkdown($content) {
  const html = $content.html() || '';
  return turndown.turndown(html).trim();
}

// ============================================================
// PROCESS ONE PAGE
// ============================================================
async function processPage(url) {
  log('FETCH', url);
  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    manifest.errors.push({ url, phase: 'fetch', message: e.message });
    log('ERR', `Fetch failed: ${url} — ${e.message}`);
    return [];
  }

  // Extract links first — needed for BFS even on already-processed pages
  const $linkOnly = cheerio.load(html);
  const links = extractInternalLinks($linkOnly);

  // If page already done, return links and skip the rest (unless --force)
  if (manifest.urlToSlug[url] && !FORCE) {
    log('SKIP', `Already done: ${url} (${links.length} links)`);
    return links;
  }

  const $ = cheerio.load(html);
  const title = extractTitle($);
  const $content = extractContent($);
  const headerImage = extractHeaderImage($, $content);

  let slug = urlToSlug(url);
  // Disambiguate if collision
  if (manifest.pages[slug] && manifest.pages[slug].url !== url) {
    const parent = urlToParent(url);
    slug = parent ? `${parent}-${slug}` : slug;
  }

  // Find and rewrite media URLs in content BEFORE converting to MD
  const mediaUrls = findMediaUrls($content, $);
  let mediaCount = 0;

  if (!SKIP_MEDIA) {
    for (const mUrl of mediaUrls) {
      if (manifest.media[mUrl]) {
        // already downloaded, just rewrite
        rewriteMediaInContent($content, mUrl, manifest.media[mUrl]);
        mediaCount++;
        continue;
      }
      try {
        const localRel = await downloadMedia(mUrl);
        if (localRel) {
          manifest.media[mUrl] = localRel;
          rewriteMediaInContent($content, mUrl, localRel);
          mediaCount++;
        }
        await delay(REQUEST_DELAY_MS / 2);
      } catch (e) {
        manifest.errors.push({ url: mUrl, phase: 'media', message: e.message });
        log('WARN', `Media fail: ${mUrl} — ${e.message}`);
      }
    }
  }

  const body = htmlToMarkdown($content);
  const frontmatter = buildFrontmatter({
    title,
    slug,
    parent: urlToParent(url),
    section: urlToSection(url),
    headerImage: headerImage ? (manifest.media[normalizeUrl(headerImage, ORIGIN)] || headerImage) : null,
    sourceUrl: url,
    scrapedAt: new Date().toISOString().slice(0, 10),
    mediaCount,
  });

  const mdPath = join(PAGES_DIR, `${slug}.md`);
  await writeFile(mdPath, `${frontmatter}\n\n${body}\n`, 'utf8');
  log('WROTE', `${slug}.md (${mediaCount} media)`);

  manifest.pages[slug] = {
    url,
    title,
    parent: urlToParent(url),
    section: urlToSection(url),
    headerImage,
    mediaCount,
    scrapedAt: new Date().toISOString(),
  };
  manifest.urlToSlug[url] = slug;

  await saveManifest();
  await delay(REQUEST_DELAY_MS);

  return links;
}

function rewriteMediaInContent($content, oldUrl, localRel) {
  const oldUrlNoProto = oldUrl.replace(/^https?:/, '');
  const newPath = `../media/${localRel}`;
  $content.find('img').each((_, el) => {
    const $el = $content.find(el);
    if (($el.attr('src') || '').includes(oldUrlNoProto.replace(/^\/\//, ''))) {
      $el.attr('src', newPath);
    }
    if (($el.attr('data-src') || '').includes(oldUrlNoProto.replace(/^\/\//, ''))) {
      $el.attr('data-src', newPath);
    }
  });
  $content.find('a[href]').each((_, el) => {
    const $el = $content.find(el);
    if (($el.attr('href') || '').includes(oldUrlNoProto.replace(/^\/\//, ''))) {
      $el.attr('href', newPath);
    }
  });
}

function buildFrontmatter(fields) {
  const yaml = Object.entries(fields)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      if (typeof v === 'string') return `${k}: ${JSON.stringify(v)}`;
      return `${k}: ${v}`;
    })
    .join('\n');
  return `---\n${yaml}\n---`;
}

// ============================================================
// MANIFEST PERSISTENCE
// ============================================================
async function loadManifest() {
  if (FRESH) {
    log('INFO', 'Fresh scrape — ignoring existing manifest');
    return;
  }
  try {
    const data = await readFile(MANIFEST_PATH, 'utf8');
    const loaded = JSON.parse(data);
    // Note: visited is intentionally NOT restored. urlToSlug handles "already processed"
    // skip; we want the BFS to re-walk so it can discover links from completed pages.
    manifest = { ...manifest, ...loaded, visited: new Set() };
    const pageCount = Object.keys(manifest.pages).length;
    const mediaCount = Object.keys(manifest.media).length;
    log('INFO', `Resumed manifest: ${pageCount} pages, ${mediaCount} media (will re-walk to find new links)`);
  } catch {
    log('INFO', 'No existing manifest — starting fresh');
  }
}

async function saveManifest() {
  const serializable = {
    ...manifest,
    visited: [...manifest.visited],
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(serializable, null, 2));
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(PAGES_DIR);
  await ensureDir(MEDIA_DIR);
  await ensureDir(LOG_DIR);
  await loadManifest();

  const queue = new PQueue({ concurrency: CONCURRENCY });

  let processed = 0;

  async function visit(url) {
    if (manifest.visited.has(url)) return;
    manifest.visited.add(url);
    if (LIMIT && processed >= LIMIT) return;
    processed++;

    const newLinks = await processPage(url);
    for (const link of newLinks) {
      if (!manifest.visited.has(link)) {
        queue.add(() => visit(link));
      }
    }
  }

  // Seed from sitemap (guarantees coverage of pages not linked from homepage)
  const sitemapUrls = await fetchSitemapUrls();
  log('INFO', `Sitemap total: ${sitemapUrls.length} URLs to crawl`);

  // Seed: homepage + every sitemap URL
  queue.add(() => visit(SEED_URL));
  sitemapUrls.forEach(url => queue.add(() => visit(url)));

  // Process until queue empty
  while (queue.size > 0 || queue.pending > 0) {
    await queue.onIdle();
    // Drain any newly added items
    if (queue.size > 0) continue;
    break;
  }

  manifest.completedAt = new Date().toISOString();
  await saveManifest();

  log('DONE', `Pages: ${Object.keys(manifest.pages).length}`);
  log('DONE', `Media: ${Object.keys(manifest.media).length}`);
  log('DONE', `Errors: ${manifest.errors.length}`);
  log('DONE', `Manifest written to ${MANIFEST_PATH}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
