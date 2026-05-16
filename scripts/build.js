#!/usr/bin/env node
/**
 * build.js — Generate static HTML pages from scraped Markdown.
 *
 * Inputs:
 *   scraped/pages/*.md       — Markdown + YAML frontmatter (from scrape.js)
 *   scraped/media/...        — downloaded media
 *   scraped/manifest.json    — URL→slug map and metadata
 *   templates/article.html   — content-page template
 *   public/style.css         — shared design system CSS
 *
 * Outputs:
 *   public/[slug]/index.html — one folder-URL per scraped page
 *   public/media/...         — media copied/linked from scraped/media
 *   public/sitemap/index.html — listing of all generated pages
 *
 * The 6 hand-crafted design pages (about, houses, enrol, learning, contact, index)
 * are preserved as-is and NOT regenerated.
 */

import { readFile, writeFile, readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PAGES_DIR = join(ROOT, 'scraped', 'pages');
const MEDIA_SRC = join(ROOT, 'scraped', 'media');
const MEDIA_DST = join(ROOT, 'public', 'media');
const TEMPLATE_PATH = join(ROOT, 'templates', 'article.html');
const PUBLIC_DIR = join(ROOT, 'public');
const MANIFEST_PATH = join(ROOT, 'scraped', 'manifest.json');

// Slugs that already have hand-crafted design pages — skip regeneration
const RESERVED_SLUGS = new Set(['home', 'about', 'houses', 'enrol', 'learning', 'contact', 'sitemap']);

// Section labels (human-readable)
const SECTION_LABELS = {
  'about-mgs': 'About Middleton',
  'life-at-mgs': 'Life at Middleton',
  'enrolment': 'Enrolment',
  'learning': 'Learning',
  'kahika-centre': 'Te Ohu Kahika',
  'news-events': 'News & Events',
  'alumni': 'Alumni',
  'international': 'International',
};

marked.setOptions({
  breaks: false,
  gfm: true,
  pedantic: false,
});

// ============================================================
// FRONTMATTER PARSER (tiny — avoids gray-matter dep)
// ============================================================
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: raw };
  const yamlStr = m[1];
  const body = m[2];
  const frontmatter = {};
  for (const line of yamlStr.split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let val = match[2].trim();
    // Unquote strings
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\"/g, '"');
    }
    // Numbers
    if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
    if (val === 'null') val = null;
    if (val === '' ) val = null;
    frontmatter[key] = val;
  }
  return { frontmatter, body };
}

// ============================================================
// CONTENT CLEANUP — strip recurring WP/Elementor artifacts
// ============================================================
// A markdown list item that is purely a link, e.g. "-   [Label](url)"
const LIST_LINK_RE = /^-\s+\[[^\]]+\]\((https?:\/\/[^)]+)\)\s*$/;
// A bare paragraph that is only a date-archive link, e.g.
// "[August 17, 2021](https://www.middleton.school.nz/2021/08/17/)"
const DATE_ARCHIVE_RE = /https:\/\/www\.middleton\.school\.nz\/\d{4}\/\d{2}(?:\/\d{2})?\/?$/;
const BARE_DATE_LINK_RE = /^\[[^\]]+\]\(https:\/\/www\.middleton\.school\.nz\/\d{4}\/\d{2}(?:\/\d{2})?\/?\)$/;
// Leaked WP-sidebar widget headings (Archives / Categories / etc.)
const WIDGET_HEADING_RE = /^#{1,6}\s*(Archives|Categories|Recent Posts|Recent Comments|Meta|Search)\s*$/i;
// The runaway "Archives Select Month Feb 2026 Apr 2024 …" / "Categories Select Category …" line
const WIDGET_DUMP_RE = /^(Archives\s+Select\s+Month|Categories\s+Select\s+Category)\b/i;
// Leaked category label as a leading H2 before the real title (## News, ## Events …)
const LEAD_CATEGORY_H2_RE = /^##\s+(News|Events|Notices|Newsletter|Newsletters|Gallery|Galleries|Uncategou?rised|Blog)\s*$/i;

function cleanBody(body) {
  let lines = body.split('\n');

  // ---- 1. Strip a leaked category H2 that sits above the real H1 title ----
  // (news/event posts come through as "## News\n\n# Real Title").
  {
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i < lines.length && LEAD_CATEGORY_H2_RE.test(lines[i].trim())) {
      // only strip if a real H1 follows shortly after
      let j = i + 1;
      while (j < lines.length && j < i + 4 && lines[j].trim() === '') j++;
      if (j < lines.length && /^#\s+\S/.test(lines[j])) {
        lines.splice(i, j - i);
      }
    }
  }

  // ---- 2. Strip the leading nav-leak / date-byline list ----
  // After any leading blanks + heading lines, the first block is a list.
  // Remove it when it is the WP section-nav leak (>=5 internal links) or a
  // date-archive byline (any number of /YYYY/MM[/DD]/ links — these are the
  // single-bullet date stamps on ~160 news posts that slipped the old rule).
  {
    let i = 0;
    while (i < lines.length && (lines[i].trim() === '' || /^#{1,6}\s/.test(lines[i]))) i++;
    const start = i;
    const items = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === '') { i++; continue; }
      const m = t.match(LIST_LINK_RE);
      if (!m) break;
      items.push(m[1]);
      i++;
    }
    if (items.length > 0) {
      const internal = items.filter(u =>
        u.startsWith('https://www.middleton.school.nz/') ||
        u.startsWith('https://thegrangetheatre.nz')
      );
      const allDate = items.every(u => DATE_ARCHIVE_RE.test(u));
      const allInternal = internal.length === items.length;
      if ((allInternal && items.length >= 5) || allDate) {
        lines.splice(start, i - start);
      }
    }
  }

  // ---- 3. Line-level strip: bare date-link paragraphs, "Posted in",
  //         widget headings, and the runaway Archives/Categories dump ----
  lines = lines.filter(line => {
    const t = line.trim();
    if (BARE_DATE_LINK_RE.test(t)) return false;
    if (/^posted in\b/i.test(t)) return false;
    if (WIDGET_HEADING_RE.test(t)) return false;
    if (WIDGET_DUMP_RE.test(t)) return false;
    return true;
  });

  let cleaned = lines.join('\n');

  // ---- 4. Strip Elementor anchor links (JS triggers, dead on a static site) ----
  cleaned = cleaned.replace(/\[([^\]]+)\]\(#elementor-action[^)]+\)/g, '$1');

  // ---- 5. Remove duplicate headings ----
  // Consecutive (blank-separated) duplicates are the Elementor mobile/desktop
  // variant artifact. Also drop a heading that exactly repeats a recent one
  // with only a short stub (<=2 short lines / a lone link) in between — the
  // flattened two-column "### X / Sign up / ### X / [link]" pattern.
  {
    const src = cleaned.split('\n');
    const result = [];
    let lastHeading = null;       // immediately-preceding heading (blank-sep ok)
    let recentHeading = null;     // heading seen within the stub window
    let stubLines = 0;
    let stubChars = 0;
    for (const line of src) {
      const h = line.match(/^#{1,6}\s+(.*)$/);
      if (h) {
        const text = h[1].trim();
        if (text === lastHeading) continue;                       // consecutive dup
        if (text === recentHeading && stubLines <= 2 && stubChars <= 60) continue; // near dup
        lastHeading = text;
        recentHeading = text;
        stubLines = 0;
        stubChars = 0;
      } else if (line.trim() !== '') {
        lastHeading = null;
        stubLines++;
        stubChars += line.trim().length;
        if (stubLines > 2 || stubChars > 60) { recentHeading = null; }
      }
      result.push(line);
    }
    cleaned = result.join('\n');
  }

  // ---- 6. Collapse 3+ blank lines left by the strips ----
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// Strip the first <h1> from rendered HTML (we show title in hero)
function stripFirstH1(html) {
  return html.replace(/^<h1[^>]*>.*?<\/h1>\s*/i, '');
}

// Parse "image-300x200.jpg" → { w: 300, h: 200 }
function sizeFromFilename(path) {
  const m = path && path.match(/-(\d+)x(\d+)\.(jpg|jpeg|png|webp|gif)$/i);
  return m ? { w: parseInt(m[1]), h: parseInt(m[2]) } : null;
}

// Find the first image in a Markdown body
function firstBodyImage(body) {
  // Matches `../media/path/to/file.jpg` from Markdown image syntax or HTML
  const m = body.match(/\.\.\/media\/([^\s"')]+\.(?:jpg|jpeg|png|webp|gif))/i);
  return m ? m[1] : null;
}

// Pick the best hero image: prefer the header from frontmatter unless it's a tiny
// thumbnail, in which case fall back to the first body image. Return null if
// nothing usable — the template will render the placeholder instead.
function bestHeaderImage(frontmatter, body) {
  const fmHeader = frontmatter.headerImage || null;
  const fmSize = sizeFromFilename(fmHeader);
  const isTinyFm = fmSize && fmSize.w < 600;

  // If the frontmatter header is decent (>= 600 wide or no size suffix), use it.
  if (fmHeader && !isTinyFm) return fmHeader;

  // Otherwise look at body images.
  const bodyImg = firstBodyImage(body);
  const bodySize = sizeFromFilename(bodyImg);
  const isTinyBody = bodySize && bodySize.w < 600;

  if (bodyImg && !isTinyBody) return bodyImg;

  // Both options are tiny or missing — return null so we render the placeholder.
  return null;
}

// ============================================================
// TEMPLATE RENDERER — minimal {{var}} and {{#if var}}...{{/if}}
// ============================================================
function renderTemplate(tpl, data) {
  // Handle {{#if key}}...{{/if}} blocks. Process inside-out so nested
  // conditionals work — the regex only matches an `if` block with no
  // `{{#if` inside it, which is always the innermost one.
  const innerIfRe = /{{#if\s+(\w+)}}((?:(?!{{#if)[\s\S])*?){{\/if}}/;
  let guard = 0;
  while (innerIfRe.test(tpl) && guard++ < 50) {
    tpl = tpl.replace(innerIfRe, (_, key, content) => (data[key] ? content : ''));
  }
  // Handle {{key}} substitution
  tpl = tpl.replace(/{{(\w+)}}/g, (_, key) => {
    const val = data[key];
    return val == null ? '' : String(val);
  });
  return tpl;
}

// ============================================================
// COPY MEDIA — preserve structure
// ============================================================
async function copyMedia() {
  if (!existsSync(MEDIA_SRC)) {
    console.warn('No scraped media to copy.');
    return;
  }
  let copied = 0;
  let skipped = 0;

  async function walk(srcDir, dstDir) {
    await mkdir(dstDir, { recursive: true });
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name);
      const dstPath = join(dstDir, entry.name);
      if (entry.isDirectory()) {
        await walk(srcPath, dstPath);
      } else if (entry.isFile()) {
        if (existsSync(dstPath)) {
          const [s, d] = await Promise.all([stat(srcPath), stat(dstPath)]);
          if (s.size === d.size && s.mtimeMs <= d.mtimeMs) {
            skipped++;
            continue;
          }
        }
        await copyFile(srcPath, dstPath);
        copied++;
      }
    }
  }

  console.log('Copying media…');
  await walk(MEDIA_SRC, MEDIA_DST);
  console.log(`  Media: copied ${copied}, skipped ${skipped} (already current)`);
}

// ============================================================
// REWRITE MEDIA PATHS in body HTML
// ============================================================
function rewriteMediaPaths(html) {
  // The scraper wrote `../media/YYYY/MM/file.jpg` (relative from pages/foo.md).
  // For our /slug/index.html output, we want absolute /media/YYYY/MM/file.jpg.
  return html
    .replace(/src=["']\.\.\/media\//g, 'src="/media/')
    .replace(/href=["']\.\.\/media\//g, 'href="/media/');
}

// ============================================================
// BUILD ONE PAGE
// ============================================================
async function buildPage(slug, template) {
  const mdPath = join(PAGES_DIR, `${slug}.md`);
  const raw = await readFile(mdPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);

  if (RESERVED_SLUGS.has(slug)) {
    return { skipped: true, reason: 'reserved' };
  }

  const cleaned = cleanBody(body);
  let html = marked(cleaned);
  html = stripFirstH1(html);
  html = rewriteMediaPaths(html);

  const headerImg = bestHeaderImage(frontmatter, body);

  const data = {
    title: frontmatter.title || slug,
    description: `${frontmatter.title || slug} — Middleton Grange School`,
    slug,
    sectionId: frontmatter.section || '',
    section: SECTION_LABELS[frontmatter.section] || '',
    headerImage: headerImg || '',
    showPlaceholder: !headerImg,
    lede: '',
    body: html,
  };

  const out = renderTemplate(template, data);
  const outDir = join(PUBLIC_DIR, slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), out, 'utf8');

  return {
    skipped: false,
    slug,
    title: data.title,
    section: frontmatter.section || null,
  };
}

// ============================================================
// BUILD SITEMAP PAGE
// ============================================================
async function buildSitemap(pages, template) {
  // Group pages by section
  const bySection = {};
  for (const p of pages) {
    const sec = p.section || 'other';
    if (!bySection[sec]) bySection[sec] = [];
    bySection[sec].push(p);
  }
  // Sort sections and pages
  const sortedSections = Object.keys(bySection).sort((a, b) => {
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return a.localeCompare(b);
  });

  let sectionsHtml = '';
  for (const sec of sortedSections) {
    const label = SECTION_LABELS[sec] || (sec === 'other' ? 'Other pages' : sec);
    const items = bySection[sec].sort((a, b) => a.title.localeCompare(b.title));
    sectionsHtml += `
    <div class="sitemap-section">
      <h2>${label} <span style="opacity:0.5;font-weight:300;">— ${items.length}</span></h2>
      <ul class="sitemap-list">
        ${items.map(p => `<li><a href="/${p.slug}/">${p.title}</a></li>`).join('\n        ')}
      </ul>
    </div>`;
  }

  const sitemapBody = `
  <header class="sitemap-hero">
    <div class="article-eyebrow"><span class="rule"></span><a href="/">Home</a></div>
    <h1 class="sitemap-title">All <em>pages</em></h1>
    <p class="sitemap-lede">${pages.length} pages from middleton.school.nz, re-presented in the new design. Use this index to find what you need.</p>
  </header>
  ${sectionsHtml}`;

  // Reuse the article template chrome (head, rail, footer) but swap the main block.
  // The template's <main id="main" class="article">…</main> is replaced wholesale
  // with our sitemap-specific markup.
  const data = {
    title: 'Sitemap',
    description: 'All pages on middleton.school.nz',
    slug: 'sitemap',
    sectionId: '',
    section: '',
    headerImage: '',
    showPlaceholder: false,
    lede: '',
    body: '',
  };
  let out = renderTemplate(template, data);
  out = out.replace(
    /<main id="main" class="article">[\s\S]*?<\/main>/m,
    `<main id="main" class="sitemap">${sitemapBody}</main>`
  );

  const outDir = join(PUBLIC_DIR, 'sitemap');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), out, 'utf8');
  console.log(`  Sitemap written: ${pages.length} pages indexed`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const argv = new Set(process.argv.slice(2));
  const LIMIT = (() => {
    const arg = [...argv].find(a => a.startsWith('--limit='));
    return arg ? parseInt(arg.split('=')[1], 10) : 0;
  })();
  const SKIP_MEDIA = argv.has('--no-media');

  console.log('Reading template…');
  const template = await readFile(TEMPLATE_PATH, 'utf8');

  console.log('Reading scraped pages…');
  const files = await readdir(PAGES_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  console.log(`  Found ${mdFiles.length} pages`);

  if (!SKIP_MEDIA) {
    await copyMedia();
  } else {
    console.log('Skipping media copy (--no-media)');
  }

  console.log('Building pages…');
  const built = [];
  const skipped = [];
  const errors = [];
  let i = 0;
  for (const file of mdFiles) {
    if (LIMIT && i >= LIMIT) break;
    const slug = basename(file, '.md');
    try {
      const result = await buildPage(slug, template);
      if (result.skipped) skipped.push({ slug, reason: result.reason });
      else built.push(result);
    } catch (e) {
      errors.push({ slug, message: e.message });
      console.error(`  ✗ ${slug}: ${e.message}`);
    }
    i++;
  }

  console.log(`\nBuilding sitemap…`);
  await buildSitemap(built, template);

  console.log(`\n=== DONE ===`);
  console.log(`  Built:   ${built.length}`);
  console.log(`  Skipped: ${skipped.length} (reserved slugs)`);
  console.log(`  Errors:  ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.slug}: ${e.message}`));
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
