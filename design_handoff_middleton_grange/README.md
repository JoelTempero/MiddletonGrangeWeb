# Handoff — Middleton Grange School Website Redesign

A complete design-direction package for rebuilding **middleton.school.nz** in a modern stack. Six HTML prototypes establish the aesthetic, motion system, accessibility floor and information architecture for the new site.

---

## 1. About these files

The six `.html` files in `designs/` are **design references**, not production code. They are self-contained, run in any browser, and exist to communicate look, feel, motion and content density.

Your task: **recreate these designs in the target codebase's framework** (the existing repo at `MGS Website/` uses a vanilla-JS + Firebase CMS scaffold; if you choose to migrate to a modern framework — Astro, Next.js, SvelteKit, etc. — pick the one that best fits the team's experience and the CMS direction). The HTML is intended to be read for:

- **Typography decisions** (sizes, weights, spacing, italic moments)
- **Colour tokens** (CSS custom properties at the top of each `<style>` block)
- **Motion system** (scroll-pinned heroes, sticky-scroll word reveal, horizontal-on-vertical, latitude rail)
- **Layout systems** (grid scaffolds, section rhythm, hero patterns)
- **Content hierarchy and copy voice**

It is **not** intended to be lifted as the production site.

## 2. Fidelity

**High-fidelity.** Colours, typography, spacing, copy, motion and interaction states are all final-direction. The intent is pixel-faithful recreation in the target framework.

## 3. The aesthetic, in one paragraph

Middleton Grange is **sixty-two years old, Christian, Antarctic-adjacent, and quietly confident**. The new site is editorial in a way most school websites are not — it leans on a single rare serif (*Cormorant Garamond*) at extreme scale contrasts, a warm bone background (`#F5F0E6`) against a deep ink (`#0F0B07`), one oxblood accent (`#6E1B1B`), generous whitespace, and a few moments of *real* surprise: a sticky-scroll manifesto where words illuminate as you read; the Four Schools rolling sideways; a Houses subpage that descends Antarctic latitudes as you scroll. The motion is **slow, intentional, never decorative**. The result is "viewbook in HTML" — a school that takes itself seriously enough to design like a cultural institution.

---

## 4. Design tokens

Every page declares the same tokens in `:root`. Keep them centralised in your framework's theme file.

### Colours

```css
--bone:    #F5F0E6;   /* Background — warm paper white */
--bone-2:  #EDE6D6;   /* Subtle paper variant */
--bone-3:  #E1D8C2;   /* Deeper bone for layered cards */

--ink:     #0F0B07;   /* Foreground — near-black, warm */
--ink-2:   #2B231B;   /* Body text on bone */
--ink-3:   #5A4F40;   /* Secondary text, mono labels */
--ink-4:   #9C9180;   /* Faint, decorative */

--accent:    #6E1B1B;   /* Oxblood — single brand accent on light */
--accent-2:  #E58F7B;   /* Coral — same accent for use on dark backgrounds */

--rule:    rgba(15,11,7,0.10);    /* Hairline on bone */
--rule-2:  rgba(15,11,7,0.22);    /* Stronger rule on bone */
--rule-d:  rgba(245,240,230,0.10); /* Hairline on ink */
--rule-d2: rgba(245,240,230,0.22); /* Stronger rule on ink */
```

**Rule on accent usage:** there is only one. Never introduce a third colour for emphasis. Use `--accent` on bone surfaces, `--accent-2` on ink surfaces — they are the same value perceptually, recoloured for contrast.

### Typography

```css
--serif: 'Cormorant Garamond', 'EB Garamond', 'Times New Roman', serif;
--sans:  'Inter Tight', -apple-system, system-ui, sans-serif;
--mono:  'JetBrains Mono', ui-monospace, monospace;
```

Loaded from Google Fonts as a single combined request:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600;1,700&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet" />
```

**Type ratios:**

| Use | Family | Style | Size | Notes |
|---|---|---|---|---|
| Display H1 (hero) | Cormorant Garamond | 300 italic | `clamp(72px, 14vw, 240px)` | Letter-spacing `-0.05em`, line-height `0.86` |
| Display H2 | Cormorant Garamond | 300 | `clamp(44px, 6vw, 108px)` | `-0.035em`, `0.9` |
| Section heading H3 | Cormorant Garamond | 400 | `clamp(28px, 2.6vw, 42px) – clamp(48px, 5vw, 84px)` | Varies — see individual page |
| Lede / lead | Cormorant Garamond | 300 italic | `clamp(20px, 1.7vw, 28px)` | `1.45` line-height |
| Body (long-form) | Cormorant Garamond | 400 | `clamp(17px, 1.4vw, 22px)` | `1.55–1.65` line-height |
| UI / form / buttons | Inter Tight | 400–600 | 13–17px | All sub-display interface text |
| Eyebrows, labels, captions, metadata | JetBrains Mono | 300–400 | 10–11px | All-caps, letter-spacing `0.18–0.32em` |

**Italic is a feature, not a style.** Every section heading has a deliberate italic word in `--accent` colour — this is the design language. Don't add italic moments that are decorative-only; they should carry semantic emphasis.

### Spacing

| Token | Value | Used for |
|---|---|---|
| `--pad` | `56px` desktop, `24px` mobile | Horizontal section padding |
| `--maxw` | `1440px` | Inner container max-width |
| Section vertical padding | `18vh–22vh` | Top/bottom of major sections |
| Card padding | `28–36px` | Inner padding of cards |
| Grid gaps | `0, 1px, 32px, 60px, 80px` | Rule lines (1px), tight grids (32), generous (60–80) |

### Border-radius

Rounded only on functional surfaces:
- `2px` — image placeholders, map tiles
- `3px` — small label chips, PDF tags
- `8–10px` — cards (e.g. feature card on home)
- `999px` — pill buttons (CTAs)

### Hairlines

Sections are separated by `1px` rules using `--rule` (light) or `--rule-d` (dark). This is the design's primary structural device — keep it. No shadows, no gradients on cards.

### Shadows

Used sparingly. Only on the map tooltip and on `:hover` of feature card lifts:

```css
box-shadow: 0 6px 18px rgba(0,0,0,0.1);   /* tooltip */
box-shadow: 0 24px 48px rgba(0,0,0,0.08); /* card hover */
```

---

## 5. The motion system

Motion is foundational to this design — it is what separates the site from a typical school site. Recreate carefully.

### 5.1 Scroll-pinned hero (home page)

`.hero-section` is `280vh` tall. Inside it, `.hero-stage` is `position: sticky; top: 0; height: 100vh`. A scroll listener computes progress `p` (0..1) through the section and cross-fades two states:

- **0 → 0.4:** verse "In thy light shall we see light" rises line-by-line (CSS animation only, no scroll dependency)
- **0.35 → 0.65:** verse fades out and translates up, lightly scales down
- **0.55 → 0.95:** title "Middleton Grange" fades in and scales up

The verse and title are siblings inside the stage. See `designs/Middleton Grange.html` lines beginning `/* ===== Hero title reveal (scroll-driven) ===== */` for the exact maths.

### 5.2 Sticky-scroll word reveal (manifesto)

`.manifesto-section` is `360vh`. Inside, the manifesto paragraph is **tokenised** — each word wrapped in `<span class="w">` at runtime. The same scroll-progress technique maps `p` to the number of "on" words, and each gets `color: var(--ink)` applied. Off words sit at `var(--ink-4)`.

**Implementation note:** in React, run the tokenisation in a `useEffect` after mount, or do it at build time with a small Babel plugin / build step. The current implementation does it in plain JS. Preserve `<em>` tags during tokenisation — they need to be reachable by the colour transition too.

### 5.3 Horizontal-on-vertical (Four Schools)

`.schools-section` height is computed in JS as `(panels * 100)vh`. `.schools-track` is a `display: flex` row of `100vw`-wide `.school-panel` children inside a `position: sticky; height: 100vh` stage. A scroll listener computes progress and applies `transform: translateX(-p * (panels - 1) * 100vw)` to the track. A small page indicator updates `data-i` active state.

### 5.4 Latitude descent (Houses page)

The `.lat-rail` is `position: sticky` in the gutter. Each `.station` declares `data-lat-from` and `data-lat-to` attributes (in decimal degrees). On scroll, JS finds which station the **screen midline** is currently in, interpolates between its from/to values based on its own scroll progress, and updates the rail readout. The result: as you scroll, the rail counts smoothly from 00°00′ to 88°23′ S.

### 5.5 Word/line entrance animations (loader, hero)

CSS-only, using `transform: translateY(110%)` → `0` with `overflow: hidden` on the line container, staggered with `animation-delay`. See `.hero-verse .ln span` and `.loader span` for the pattern. Reusable as a utility — recommend extracting as a `<Reveal as="span">` component.

### 5.6 Reveal-on-scroll (general)

Every section uses `data-fade` attributes. A single `IntersectionObserver` opacity/transform-translates elements into view at 8% threshold. Generic utility — port as a hook (`useInView`) or component.

### 5.7 Hover micro-interactions

- Inline links underline-from-left via a `::after` pseudo with `transform: scaleX(0 → 1)` on hover
- Pill CTAs slide a tiny amount on hover (`transform: translateY(-1px)` + background swap)
- "Walk through" links pad-right on hover (`padding-right` transitions from `0` to `14px`)
- House cards lift `4px` with a soft shadow

### 5.8 Loader

A 1.8–2.2s splash with the verse fading in line-by-line, then the page fading in behind it. **Important:** the loader should be skippable on repeat visits — recommend storing a `sessionStorage` flag so it only shows on the first page of the session.

### 5.9 Reduced motion

`a11y.css` already kills `animation` and `transition` durations to `0.001ms` under `@media (prefers-reduced-motion: reduce)`. Honour this in any new code; if you add scroll-driven motion, gate the scroll listener behind the same media query.

---

## 6. Pages

### 6.1 Home — `Middleton Grange.html`

Sections, top to bottom:

1. **Loader** (1.8s, then fades out)
2. **Top rail** — `position: fixed`, `mix-blend-mode: difference` for legibility on both light and dark backgrounds; logo (mark), 5 nav links centred, "Book a tour" pill right
3. **Hero** — scroll-pinned. State 1: school verse "In thy light shall we see light" at display scale. State 2: "Middleton Grange" wordmark. Sub-line and meta-rail at the bottom (43°32′S coordinate).
4. **Entry** — two-column intro: a sticky title left, a longer Cormorant body paragraph right, signed by the Principal
5. **Manifesto** — long sticky-scroll word-reveal paragraph
6. **Four Schools** — horizontal-scroll panels (Primary, Middle, Senior, International)
7. **Foundation** — 4-column dark section: Character / Excellence / Service / Glory, each with scripture reference
8. **Houses teaser** — short dark section with 4 explorer names and a "Descend the latitude" CTA → `houses.html`
9. **Visit** — closing "Walk the campus" CTA
10. **Footer** — large italic "Middleton Grange" wordmark, 4-column link list

### 6.2 Houses — `houses.html`

**The signature page.** Latitude descent down a sticky rail.

- Hero: a single italic "*South.*" at 200–360px, with sub-context
- Intro: two-column note about the four Houses
- Descent: four `.station` blocks, each ~130vh tall, with portrait placeholder + quote + essay + stats. The sticky rail in the left gutter counts from 00° to 88° as you scroll.
- Pole: at 90° S, a standings table
- Return: back to home

### 6.3 About — `about.html`

- Hero: "About *us.*"
- Principal letter: long-form Cormorant body, sticky portrait left
- Decade timeline: 7 cells across (1964 → 2026)
- Special Character section
- Annual theme (centred, 132px display): "Be *strong* and *courageous*" · Joshua 1:9
- Leadership: 8-person grid with monogram placeholders
- Crest + motto: 5-row spec table next to an animated SVG crest (motto runs along an outer rotating ring)
- Affiliations: 8 sub-organisations and partnerships
- Four-schools anchor list (`#primary`, `#middle`, `#senior`, `#international`)

### 6.4 Enrol — `enrol.html`

- Why us (5 reasons, numbered, ordinal-italic)
- 5-step process with a vertical timeline (oxblood dots along a centre rule)
- 2026 fees table (6 rows — attendance dues, four SCD tiers, NCEA fees)
- Enrolment zones (6 PDF links — Y1–8, Eastern, Southwest, Y9–10, Y11–13, Available Places)
- Key dates (Open Day, applications closing, offers)
- 6 FAQs (accordion — tap to expand)
- Enrolment contact

### 6.5 Learning — `learning.html`

- Sticky in-page index rail at the top (under main rail) — anchors to 7 sections
- Three curriculum strands (Primary, Middle, Senior)
- NCEA: 4-level grid linking to live PDFs
- Sport: 17 codes in a 3-column flow layout
- Performing arts: 11 strands as a 3-column grid
- Te Ohu Kahika (STEM centre): full-bleed image placeholder + body
- Support & care: 8 cells
- Handbooks: 8 PDF links

### 6.6 Visit / Contact — `contact.html`

- Hero: "Visit *us.*"
- Address card with 5 contact rows + animated SVG map placeholder
- School hours table (Mon–Fri vs Wednesday differences)
- Staff directory by department (Office, Senior Leadership, International, Sport & Arts, Pathways & Care)
- Sub-organisations: 4 cards (Grange Theatre, Fridge Radio, Music Academy, Kahika)
- Getting here: car / bus / bike

---

## 7. Accessibility

`designs/a11y.css` contains the accessibility baseline. **Preserve everything in this file** when porting:

1. **Base reading size** — body is `17px / 1.6 line-height`
2. **Focus rings** — `:focus-visible` only (not `:focus`), `2px` outline, `3px` offset; oxblood on light backgrounds, coral on dark
3. **Skip-to-content link** — `.skip-link` slides in on `:focus-visible` from `-200px` top to `16px`. Each page has `<a href="#main" class="skip-link">Skip to main content</a>` as the first body element, and the hero/first-section has `id="main"`
4. **Contrast** — body text on dark backgrounds is at **0.88 opacity** minimum (was 0.7–0.78 in the original — too low). Mono section labels on dark were grey-on-dark; now coral for AAA contrast
5. **Reduced motion** — `prefers-reduced-motion: reduce` zeros all animation and transition durations
6. **Text balancing** — `text-wrap: balance` on all display headings, `text-wrap: pretty` on body paragraphs
7. **Underlined links in body copy** — when a link appears mid-paragraph (Principal's letter, FAQ, fees note) it carries `border-bottom: 1px solid currentColor`

WCAG target: **AA across the board, AAA where possible** on body text. Verified pairs:
- `--ink` (`#0F0B07`) on `--bone` (`#F5F0E6`): **18.4 : 1** ✓ AAA
- `--ink-3` (`#5A4F40`) on `--bone`: **7.1 : 1** ✓ AAA
- `--bone` at 0.88 opacity on `--ink`: **15.2 : 1** ✓ AAA
- `--accent` (`#6E1B1B`) on `--bone`: **8.0 : 1** ✓ AAA
- `--accent-2` (`#E58F7B`) on `--ink`: **6.4 : 1** ✓ AA (large text AAA)

Recommend keeping `a11y.css` as a separate appended stylesheet in production too — it's easy to audit in one place.

---

## 8. Iconography

**There is none, deliberately.** No SVG icon library, no Feather/Lucide, no emoji. The few SVGs present are illustrative artefacts:

- A custom shield/crest with M monogram (about page)
- A compass rosette (loader, houses)
- A schematic street grid (contact map placeholder)

If product needs require icons (e.g. download arrows on PDF rows), use **typographic glyphs** (`→`, `↗`, `+`) rather than icon SVGs — this matches the prevailing language.

---

## 9. Imagery

All images are **placeholders** in the prototypes — two diagonal-stripe patterns over a warm gradient, with a small caption label. The production site needs:

- 1 hero image per page (or a video for the home, as the existing site does — see existing `See-Us-In-Action.mp4`)
- 4 school portraits (Primary, Middle, Senior, International)
- 4 House portraits or symbolic imagery
- 8 leadership team headshots
- 1 Kahika centre photo
- 1 principal portrait
- 3 news story images

**Photography direction:** warm, natural light. Real students and staff, not stock. Architectural shots favour the Christchurch sky and the campus's brick and timber. Avoid posed groups — capture work-in-progress moments (a science class, a music rehearsal, a kapa haka practice, a rugby training).

---

## 10. Content & copy voice

The copy is **deliberately literary** — Cormorant Garamond at scale earns it. Voice rules:

- Plain English; never marketing-speak. "Foundations are quiet, slow work" not "we provide world-class foundational learning"
- Use the Oxford comma. Use the em-dash freely. Use sentence fragments.
- Te reo Māori where natural — *ākonga, kapa haka, Ōtautahi, whānau*
- Numbers: spell out under ten (*four schools*), digits over (*~1,400 students*)
- Scripture is cited with a middle dot (*Psalm 36 · 9*), not a colon
- "School verse" not "school motto" — the motto is "Character, excellence, service…" and the *verse* is Psalm 36:9. Distinct.

---

## 11. Sub-pages still to build

The six prototypes set the system. The following pages need to be built next, using the same vocabulary:

- **News index + article template** — broadsheet-leaning, drop-cap on the lede, no card-grids of small thumbnails
- **Calendar + term dates** — sticky filters, ICS export, integrates with KAMAR (`https://web.kamar.middleton.school.nz/index.php/ics/school.ics`)
- **Alumni** — index with year/decade filter, individual profile template
- **Four-Schools dedicated pages** — `primary.html`, `middle.html`, `senior.html`, `international.html`
- **Sport detail pages** — 17 sport pages (one per code), each with year levels, terms, cost, requirements, external links
- **Performing arts sub-pages** — 11 strands (Music Academy, Tuition, Production, Drama, Kapa Haka, etc.)
- **Open-Day landing** — for the May campaign
- **Individual staff bio pages**
- **Forms** — Contact, New Alumni, Update Alumni, Music Lessons Registration, Sports Apparel Order, Performing Arts Sign-up

---

## 12. Architecture & data

The existing repo (`MGS Website/`) ships with a Firebase + Firestore CMS scaffold:

- `admin/` — page editor, media library, menu manager
- `firestore.rules`, `firestore.indexes.json`
- `migration/` — a WP-to-Firestore migrator (parser + content cleaner + media migrator)
- `scripts/seed-content.js` — seed data for pages, menu sections, site settings
- `SITE_CONTENT.md` — **the canonical source for navigation, page list, contact info, PDF URLs and integrations**

**Recommended stack from here** (talk to the team first):

- **Astro** or **Next.js** for the static-leaning public site (most pages don't need client state)
- **Firestore** for CMS-backed dynamic content (news, events, alumni, staff)
- **KAMAR ICS feed** for the calendar (parse server-side, cache 1h)
- **DailyVerses.net** plugin or API for the daily verse module
- **KINDO, Convera, CareerWise** as external links (existing) — don't try to embed
- A **content collection** approach: each page is either a static MDX route (Astro/Next) or a Firestore document. The hand-authored character of these pages doesn't lend itself well to a fully WYSIWYG editor — recommend MDX for the prose-heavy pages (About, Houses, Learning) and Firestore-backed for the iterative ones (News, Events, Alumni, Staff).

### Key data sources in `SITE_CONTENT.md` (already in the project root)

- Full nav structure (8 top-level sections)
- All staff names and roles
- All sport codes (17)
- All performing arts strands (11)
- Contact details for every department
- Fee schedule for 2026
- PDF URLs for all handbooks, course information, zone maps, prospectus
- External integration URLs (KAMAR Parent Portal, KINDO, Convera, Library Dashboard)
- ICS feed URLs

---

## 13. External integrations to preserve

| System | URL | Use |
|---|---|---|
| Parent Portal | `https://middleton.school.kiwi/` | KAMAR-hosted; link out, do not iframe |
| Student Portal | `https://middletonschoolnz.sharepoint.com/teams/home` | SharePoint; link out |
| KINDO Shop | `https://shop.tgcl.co.nz/shop/q2.shtml?session=false&shop=Middleton%20Grange%20School` | Uniforms, lunches |
| KAMAR Events ICS | `https://web.kamar.middleton.school.nz/index.php/ics/school.ics` | Pull events, cache 1h |
| KAMAR Days ICS | `https://web.kamar.middleton.school.nz/index.php/ics/days.ics` | Term dates |
| Library Dashboard | `https://aiscloud.nz/MDD00/#!landingPage` | AIS Cloud; link out |
| Careers Website | `https://middleton.careerwise.school/` | CareerWise; link out |
| Newsletter | `https://newsletter.middleton.school.nz/` | Custom subdomain; link out |
| Convera | `https://students.convera.com/middletongrangeschool#!/` | International fees |
| ERO Review | `https://ero.govt.nz/institution/335/middleton-grange-school` | Public record |

---

## 14. Files in this handoff

```
design_handoff_middleton_grange/
├── README.md                        ← you are here
└── designs/
    ├── Middleton Grange.html        ← Home: hero, manifesto, schools, foundation, houses teaser, visit
    ├── houses.html                  ← Houses: latitude descent (the signature page)
    ├── about.html                   ← About: principal, history, character, theme, leadership, crest
    ├── enrol.html                   ← Enrol: process, fees, zones, dates, FAQ
    ├── learning.html                ← Learning: curriculum, NCEA, sport, arts, Kahika, support
    ├── contact.html                 ← Visit: address, hours, directory, sub-orgs, getting here
    ├── a11y.css                     ← Accessibility overrides (apply globally)
    └── tweaks-panel.jsx             ← Tweaks scaffold (dev-only; can drop in production)
```

To preview: open any `.html` in a browser. They share `a11y.css` and run standalone.

---

## 15. Acceptance criteria for the rebuild

A successful port will:

1. ✓ Pixel-faithfully recreate all six pages at 1440px desktop width
2. ✓ Implement all five motion patterns (scroll-pinned hero, manifesto reveal, horizontal schools, latitude descent, sticky in-page index) — **and honour `prefers-reduced-motion`**
3. ✓ Score AA across all body copy, AAA on the headline pairs in §7
4. ✓ Pass keyboard-only navigation end-to-end (skip-link works, focus rings visible, no traps)
5. ✓ Use only the three declared font families
6. ✓ Use only the declared accent (no purples, no blues, no extra reds)
7. ✓ Load and remain fast — heroes ≤ 80kb compressed (placeholder gradients are 0kb; real images need optimising)
8. ✓ Pull dynamic content (news, events, calendar) from Firestore + KAMAR; render statically where possible

---

## 16. Questions for the school before launch

- **Photography brief** — when can shoots happen? Open Day (Sat 30 May) is the obvious moment for crowd shots
- **Daily verse module** — keep the DailyVerses.net integration, or curate manually?
- **Houses points** — is there an actual live data source for House standings, or are these manually updated?
- **News authoring** — who writes? Frequency? (informs the CMS UX requirements)
- **Alumni profiles** — how many existing profiles to migrate from WordPress? Are profile photos available?
- **Production team credit** — the AllTeams credit in the existing footer; how do we want to handle credit on the new site?

---

*Prepared from the design exploration · v2 atmospheric direction · May 2026.*
