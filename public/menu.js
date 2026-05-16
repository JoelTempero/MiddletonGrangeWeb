/* ============================================================
   Middleton Grange — overlay menu  (v5)
   Vanilla JS, injects into any page with a .rail.
   Menu structure mirrors middleton.school.nz nav 1:1.
   ============================================================ */
console.log('[menu.js v12] loaded');

// Each section has { label, pages }. A page is either:
//   { label, href }
//   { label, href, external: true }     ← shows ↗
//   { type: 'subheading', label, href } ← bold sub-header within section
//   { label, href, indent: true }       ← indented under preceding subheading
const MENU = [
  {
    label: 'About MGS',
    pages: [
      { label: "Principal's Welcome",                  href: '/principals-welcome/' },
      { label: 'Special Character',                    href: '/special-character/' },
      { label: 'Vision & Mission Statement',           href: '/vision-mission-statement/' },
      { label: 'Motto, Crest, Verse, Hymn, Haka',      href: '/motto-crest-verse-hymn-prayer-haka/' },
      { label: 'Annual Theme',                         href: '/annual-theme/' },
      { label: 'Our History',                          href: '/history/' },
      { label: 'Senior Leadership Team',               href: '/main-school-leaders/' },
      { label: 'School Board',                         href: '/board/' },
      { label: 'Affiliations',                         href: '/affiliations/' },
      { label: 'Key Publications',                     href: '/key-publications/' },
      { label: 'Venue Hire',                           href: '/venue-hire/' },
      { label: 'Location & Site Map',                  href: '/location-site-map/' },
      { label: 'Contact Us',                           href: '/contact-us/' },
      { label: 'The Grange Theatre',                   href: 'https://thegrangetheatre.nz/', external: true },
    ],
  },
  {
    label: 'Life at MGS',
    pages: [
      { label: 'Four Schools in One',                  href: '/four-schools-in-one/' },
      { label: 'Primary School (Years 1–6)',           href: '/primary-school-years-1-6/' },
      { label: 'Middle School (Years 7–10)',           href: '/middle-school-years-7-10/' },
      { label: 'Senior College (Years 11–13)',         href: '/senior-college-years-11-13/' },
      { label: 'International College',                href: '/international/' },
      { label: 'Parenting Support',                    href: '/parenting-support/' },
      { label: 'Be Involved',                          href: '/be-involved/' },
      { label: 'Uniform',                              href: '/uniform-code/' },
      { label: 'Stationery',                           href: '/stationery/' },
      { label: 'Canteen',                              href: '/canteen/' },
      { label: 'House Competition',                    href: '/house-system/' },
      { label: 'Video Gallery',                        href: '/video-gallery/' },
      { label: 'Employment',                           href: '/employment/' },
    ],
  },
  {
    label: 'Enrolment',
    pages: [
      { label: 'Enrolment Information',                href: '/enrolment-information/' },
      { label: 'Enrolment Scheme',                     href: '/enrolment-scheme/' },
      { label: 'Privacy',                              href: '/privacy/' },
      { label: 'Fees & Other Costs',                   href: '/fees-other-costs/' },
      { label: "FAQ — Choosing the Right School",      href: '/choosing-the-right-school/' },
      { label: 'Starting School',                      href: '/starting-school/' },
    ],
  },
  {
    label: 'Learning',
    pages: [
      { label: 'Curriculum & Subjects',                href: '/curriculum-subjects/' },
      { label: 'Course Selection',                     href: '/course-selection/' },
      { label: 'Careers Department',                   href: '/careers-department/' },
      { label: 'Leadership',                           href: '/leadership/' },
      { label: 'Service',                              href: '/service/' },
      { label: 'Remote Learning',                      href: '/remote-learning/' },
      { label: 'NCEA Information',                     href: '/ncea-information/' },
      { label: 'Learning Support',                     href: '/learning-support/' },
      { label: 'Fostering Strengths',                  href: '/fostering-strengths/' },
      { label: 'Pastoral Care',                        href: '/pastoral-care/' },
      { label: 'BYOD',                                 href: '/byod/' },
      { label: 'Library Dashboard',                    href: 'https://aiscloud.nz/MDD00/', external: true },
      { label: 'Overseas Trips',                       href: '/overseas-trips/' },
      { label: 'Sport',                                href: 'https://www.sporty.co.nz/middleton', external: true },
      { type: 'subheading', label: 'Performing Arts',  href: '/performing-arts/' },
      { label: 'Middleton Music Academy',              href: '/musicacademy/',                 indent: true },
      { label: 'School Production',                    href: '/school-production/',            indent: true },
      { label: 'Middleton Dance Academy',              href: '/danceacademy/',                 indent: true },
      { label: 'Drama',                                href: '/drama/',                        indent: true },
      { label: 'Kapa Haka',                            href: '/kapa-haka/',                    indent: true },
      { label: 'Pasifika',                             href: '/pasifika/',                     indent: true },
      { label: 'Tech Crew',                            href: '/tech/',                         indent: true },
      { label: 'The Fridge Radio',                     href: '/the-fridge-radio/',             indent: true },
    ],
  },
  {
    label: 'Kahika Centre',
    pages: [
      { label: 'Te Ohu Kahika',                        href: '/te-ohu-kahika/' },
      { label: 'Vision',                               href: '/te-ohu-kahika-vision/' },
      { label: 'Lab Days',                             href: '/te-ohu-kahika-labs/' },
      { label: 'Sponsorship',                          href: '/te-ohu-kahika-sponsorship/' },
      { label: 'Current Workshops',                    href: '/te-ohu-kahika-workshops/' },
    ],
  },
  {
    label: 'News & Events',
    pages: [
      { label: 'School Hours & Term Dates',            href: '/school-hours-term-dates/' },
      { label: 'Calendar',                             href: '/calendar/' },
      { label: 'Latest News',                          href: '/latest-news/' },
      { label: 'Newsletters',                          href: '/newsletters/' },
      { label: 'Galleries',                            href: '/galleries/' },
      { label: 'Fundraisers',                          href: '/fundraisers/' },
    ],
  },
  {
    label: 'Alumni',
    pages: [
      { label: 'Alumni Welcome',                       href: '/alumni/' },
      { label: '60th Anniversary',                     href: '/60th-anniversary/' },
      { label: 'Alumni Profiles',                      href: '/alumni-profiles/' },
      { label: 'New Alumni',                           href: '/new-alumni/' },
      { label: 'Update Your Details',                  href: '/alumni-update-details/' },
      { label: 'Alumni Newsletters',                   href: '/alumni-newsletters/' },
      { label: 'Donations',                            href: '/donations/' },
    ],
  },
  {
    label: 'International',
    pages: [
      { label: 'Welcome',                              href: '/international/' },
      { label: 'International Contact',                href: '/international-contact/' },
      { label: 'International Enrolment',              href: '/international-enrolment/' },
      { label: 'Residential Care & Homestays',         href: '/homestays/' },
      { label: 'NCEA & Subjects',                      href: '/ncea/' },
      { label: 'ESOL Programmes',                      href: '/esol-programmes/' },
      { label: 'University Pathways',                  href: '/university-pathways/' },
      { label: 'Student Stories',                      href: '/student-stories/' },
      { label: 'Our Photos',                           href: '/international-photos/' },
      { label: 'Our Videos',                           href: '/international-videos/' },
      { label: 'Useful Links',                         href: '/useful-links/' },
      { label: 'International Board',                  href: '/international-board/' },
      { label: 'International College Staff',          href: '/international-college-staff/' },
      { label: 'ERO Review',                           href: 'https://ero.govt.nz/institution/335/middleton-grange-school', external: true },
      { label: 'Agents',                               href: '/agents/' },
    ],
  },
];

// Mirrors the original site's Quick Links slide-out panel
const QUICK_LINKS = [
  { label: 'Parent Portal',  href: 'https://middleton.school.kiwi/' },
  { label: 'Student Portal', href: 'https://middletonschoolnz.sharepoint.com/teams/home' },
  { label: 'Calendar',       href: '/calendar/' },
  { label: 'KINDO',          href: 'https://shop.tgcl.co.nz/shop/q2.shtml?session=false&shop=Middleton%20Grange%20School' },
  { label: 'School App',     href: 'https://mgs-app.sidequest.nz/' },
  { label: 'Facebook',       href: 'https://www.facebook.com/Middletongrangeschool/' },
  { label: 'Contact Us',     href: '/contact-us/' },
];

function renderPageItem(p) {
  if (p.type === 'subheading') {
    return `<li class="menu-sub-heading"><a href="${p.href}">${p.label}</a></li>`;
  }
  const cls = p.indent ? ' class="menu-indent"' : '';
  const ext = p.external ? ' target="_blank" rel="noopener"' : '';
  const arrow = p.external ? ' <span class="menu-ext" aria-hidden="true">↗</span>' : '';
  return `<li${cls}><a href="${p.href}"${ext}>${p.label}${arrow}</a></li>`;
}

// Dropdown body. Sections with a subheading (Learning → Performing Arts)
// render as a 4-column split: 2 cols of main items, 2 cols of PA items
// under a legible PA heading. Other sections stay a simple list.
function renderDropdownInner(section) {
  const subIdx = section.pages.findIndex(p => p.type === 'subheading');
  if (subIdx === -1) {
    return `<ul>${section.pages.map(renderPageItem).join('')}</ul>`;
  }
  const before = section.pages.slice(0, subIdx);
  const sub = section.pages[subIdx];
  const paItems = section.pages.slice(subIdx + 1).map(p => ({ ...p, indent: false }));
  return `
    <div class="rail-dd-split">
      <ul class="rail-dd-main">${before.map(renderPageItem).join('')}</ul>
      <div class="rail-dd-pa">
        <a class="rail-dd-pa-head" href="${sub.href}">${sub.label}</a>
        <ul class="rail-dd-pa-list">${paItems.map(renderPageItem).join('')}</ul>
      </div>
    </div>`;
}

/* ------------------------------------------------------------
   ARTICLE ASIDE — sticky sibling navigation
   On any page that includes <aside class="article-aside" data-aside>,
   find which MENU section contains the current path and render that
   section's pages there, with the current page highlighted.
   ------------------------------------------------------------ */
function normalizePath(p) {
  if (!p) return '';
  try { p = new URL(p, window.location.origin).pathname; } catch {}
  return p.replace(/\/+$/, '').toLowerCase();
}

function findCurrentSection(currentPath) {
  for (const section of MENU) {
    const hit = section.pages.find(p => {
      if (p.external) return false;
      return normalizePath(p.href) === currentPath;
    });
    if (hit) return { section, currentHref: hit.href };
  }
  return null;
}

function renderArticleAside() {
  const aside = document.querySelector('aside.article-aside[data-aside]');
  if (!aside) return;
  const frame = aside.closest('.article-frame');

  const currentPath = normalizePath(window.location.pathname);
  const found = findCurrentSection(currentPath);

  // Page isn't in any section's menu — collapse the sidebar column entirely
  if (!found) {
    aside.style.display = 'none';
    if (frame) frame.classList.add('is-bare');
    return;
  }

  const { section, currentHref } = found;
  const items = section.pages.map(p => {
    if (p.type === 'subheading') {
      const isCur = normalizePath(p.href) === currentPath ? ' is-current' : '';
      return `<li><a href="${p.href}" class="is-subheading${isCur}">${p.label}</a></li>`;
    }
    const classes = [];
    if (p.indent) classes.push('is-indent');
    if (p.external) classes.push('ext');
    if (!p.external && normalizePath(p.href) === currentPath) classes.push('is-current');
    const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
    const ext = p.external ? ' target="_blank" rel="noopener"' : '';
    return `<li><a href="${p.href}"${cls}${ext}>${p.label}</a></li>`;
  }).join('');

  aside.innerHTML = `
    <span class="article-aside-label">${section.label}</span>
    <ul class="article-aside-list">${items}</ul>
    <a class="article-aside-cta" href="/sitemap/">All pages →</a>
  `;
}

/* ------------------------------------------------------------
   SHARED LOGO + FOOTER — keep every page consistent with the
   homepage. Idempotent: skips pages already on the new markup.
   ------------------------------------------------------------ */
function swapLogo() {
  const mark = document.querySelector('.mark');
  if (!mark || mark.querySelector('img')) return;
  mark.setAttribute('href', '/');
  mark.setAttribute('aria-label', 'Middleton Grange School, home');
  mark.innerHTML = '<img src="/media/brand/menu-logo.png" alt="Middleton Grange School" />';
}

function buildFooter() {
  const footer = document.querySelector('footer.footer, footer');
  if (!footer) return;
  if (footer.querySelector('.footer-left')) return; // already the new footer
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-left">
        <div class="footer-contact">
          <div class="footer-block">
            <h4>Contact details</h4>
            <div class="footer-addr">
              <b>Middleton Grange School</b><br>
              30 Acacia Ave, Upper Riccarton<br>
              Christchurch 8041, New Zealand<br><br>
              Phone: <a href="tel:+6433489826">+64 (03) 348 9826</a><br>
              Email: <a href="mailto:office@middleton.school.nz">office@middleton.school.nz</a>
            </div>
          </div>
          <div class="footer-block">
            <h4>International College</h4>
            <div class="footer-addr">
              Phone: <a href="tel:+6433414054">+64 3 341 4054</a><br>
              Email: <a href="mailto:inted@middleton.school.nz">inted@middleton.school.nz</a>
            </div>
          </div>
        </div>
        <div class="footer-search">
          <form role="search" action="/sitemap/">
            <input type="search" name="q" placeholder="Search the school site…" aria-label="Search" autocomplete="off" />
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="9" r="6"></circle><line x1="14" y1="14" x2="19" y2="19"></line>
              </svg>
            </button>
          </form>
        </div>
        <div class="footer-verse">
          <span class="vlab">Daily verse</span>
          <p>“In thy light shall we see light.” — Psalm 36:9</p>
        </div>
        <div class="footer-actions">
          <a href="https://www.facebook.com/Middletongrangeschool/" target="_blank" rel="noopener">Follow us on Facebook</a>
          <a href="https://mgs-app.sidequest.nz/" target="_blank" rel="noopener">Download the app</a>
          <a href="/the-fridge-radio/">Listen to The Fridge</a>
        </div>
        <div class="footer-credit">
          Site crafted by <a href="https://sidequest.nz" target="_blank" rel="noopener">Sidequest Digital</a>
        </div>
      </div>
    </div>`;
}

function initMenu() {
  console.log('[menu.js v12] initMenu running');
  renderArticleAside();
  swapLogo();
  buildFooter();
  const rail = document.querySelector('.rail');
  if (!rail) { console.warn('[menu.js v12] .rail NOT FOUND'); return; }
  if (document.querySelector('.menu-overlay')) return;
  console.log('[menu.js v12] .rail found, building mega-menu');

  // -------- Replace rail-nav contents with the 8 section triggers --------
  const railNav = rail.querySelector('.rail-nav');
  if (railNav) {
    railNav.innerHTML = MENU.map((section, i) => `
      <div class="rail-section" data-i="${i}">
        <button type="button" class="rail-section-trigger" aria-expanded="false" aria-haspopup="true">
          ${section.label}<span class="rail-section-chev" aria-hidden="true">▾</span>
        </button>
        <div class="rail-dropdown" role="region" aria-label="${section.label}">
          ${renderDropdownInner(section)}
        </div>
      </div>
    `).join('');

    // Hover + focus + click handlers
    railNav.querySelectorAll('.rail-section').forEach(s => {
      const trig = s.querySelector('.rail-section-trigger');
      let hideT = null;

      const show = () => {
        clearTimeout(hideT);
        // close other open dropdowns first
        railNav.querySelectorAll('.rail-section.is-open').forEach(o => {
          if (o !== s) {
            o.classList.remove('is-open');
            o.querySelector('.rail-section-trigger').setAttribute('aria-expanded', 'false');
          }
        });
        s.classList.add('is-open');
        trig.setAttribute('aria-expanded', 'true');
      };
      const hide = () => {
        hideT = setTimeout(() => {
          s.classList.remove('is-open');
          trig.setAttribute('aria-expanded', 'false');
        }, 180);
      };

      s.addEventListener('mouseenter', show);
      s.addEventListener('mouseleave', hide);
      s.addEventListener('focusin', show);
      s.addEventListener('focusout', (e) => {
        if (!s.contains(e.relatedTarget)) hide();
      });
      trig.addEventListener('click', (e) => {
        e.preventDefault();
        if (s.classList.contains('is-open')) {
          s.classList.remove('is-open');
          trig.setAttribute('aria-expanded', 'false');
        } else {
          show();
        }
      });
    });

    // Esc closes any open dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        railNav.querySelectorAll('.rail-section.is-open').forEach(o => {
          o.classList.remove('is-open');
          o.querySelector('.rail-section-trigger').setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Click outside closes
    document.addEventListener('click', (e) => {
      if (!railNav.contains(e.target)) {
        railNav.querySelectorAll('.rail-section.is-open').forEach(o => {
          o.classList.remove('is-open');
          o.querySelector('.rail-section-trigger').setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // Desktop mega-menu is built. Build the mobile nav (≤1100px, where
  // .rail-nav is display:none) so small screens are not left navless.
  buildMobileNav(rail);
  buildHeaderSearch(rail);
  initSiteSearch();
}

/* ------------------------------------------------------------
   HEADER SEARCH — compact search in the right of the rail.
   Submits to /sitemap/?q=… ; the sitemap page filters itself.
   ------------------------------------------------------------ */
function buildHeaderSearch(rail) {
  if (rail.querySelector('.rail-search')) return;
  const form = document.createElement('form');
  form.className = 'rail-search';
  form.setAttribute('role', 'search');
  form.action = '/sitemap/';
  form.innerHTML = `
    <input type="search" name="q" placeholder="Search…" aria-label="Search the school site" autocomplete="off" />
    <button type="submit" aria-label="Search">
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" fill="none"
           stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="9" r="6"></circle><line x1="14" y1="14" x2="19" y2="19"></line>
      </svg>
    </button>`;
  const spacer = rail.querySelector('.rail-spacer');
  if (spacer) spacer.replaceWith(form);
  else rail.appendChild(form);
}

/* ------------------------------------------------------------
   SITE SEARCH — turns the generated /sitemap/ page into a live
   search-results page. Reads ?q= (or #q=) and filters the list.
   ------------------------------------------------------------ */
function initSiteSearch() {
  const sections = document.querySelectorAll('.sitemap-section');
  if (!sections.length) return;

  const params = new URLSearchParams(window.location.search);
  const hashQ = decodeURIComponent((window.location.hash.match(/q=([^&]+)/) || [])[1] || '');
  const initial = params.get('q') || hashQ || '';

  // Inject a live filter box at the top of the sitemap
  const host = document.querySelector('.sitemap-hero') || document.querySelector('.sitemap');
  let box;
  if (host) {
    box = document.createElement('input');
    box.type = 'search';
    box.className = 'sitemap-filter';
    box.placeholder = 'Filter pages…';
    box.setAttribute('aria-label', 'Filter pages');
    box.value = initial;
    host.appendChild(box);
  }

  const counter = document.createElement('div');
  counter.className = 'sitemap-count';
  if (host) host.appendChild(counter);

  function apply(q) {
    const term = q.trim().toLowerCase();
    let shown = 0;
    sections.forEach(sec => {
      let secShown = 0;
      sec.querySelectorAll('li').forEach(li => {
        const hit = !term || li.textContent.toLowerCase().includes(term);
        li.style.display = hit ? '' : 'none';
        if (hit) secShown++;
      });
      sec.style.display = secShown ? '' : 'none';
      shown += secShown;
    });
    counter.textContent = term ? `${shown} page${shown === 1 ? '' : 's'} match “${q.trim()}”` : '';
  }

  if (box) box.addEventListener('input', () => apply(box.value));
  if (initial) apply(initial);
}

/* ------------------------------------------------------------
   MOBILE NAV — hamburger + full-screen accordion overlay.
   Injected into .rail; visible only where the desktop mega-menu
   is hidden (≤1100px). Accessible: dialog semantics, ESC, scroll
   lock, focus send + restore, light focus trap.
   ------------------------------------------------------------ */
function buildMobileNav(rail) {
  if (document.querySelector('.mnav')) return;

  const burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'mnav');
  burger.innerHTML = '<span></span><span></span><span></span>';
  rail.appendChild(burger);

  const sectionsHtml = MENU.map((section, i) => `
    <section class="mnav-sec">
      <button type="button" class="mnav-sec-trig" aria-expanded="false" aria-controls="mnav-p${i}">
        ${section.label}<span class="mnav-chev" aria-hidden="true">+</span>
      </button>
      <ul class="mnav-list" id="mnav-p${i}" hidden>
        ${section.pages.map(p => {
          const ext = p.external ? ' target="_blank" rel="noopener"' : '';
          const arrow = p.external ? ' <span class="mnav-ext" aria-hidden="true">↗</span>' : '';
          const cls = [
            p.type === 'subheading' ? 'is-subheading' : '',
            p.indent ? 'is-indent' : '',
          ].filter(Boolean).join(' ');
          return `<li${cls ? ` class="${cls}"` : ''}><a href="${p.href}"${ext}>${p.label}${arrow}</a></li>`;
        }).join('')}
      </ul>
    </section>`).join('');

  const quickHtml = QUICK_LINKS.map(q => {
    const ext = /^https?:/.test(q.href) ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${q.href}"${ext}>${q.label}</a>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'mnav';
  overlay.id = 'mnav';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Site navigation');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="mnav-bar">
      <a href="/" class="mnav-mark">Middleton <span>&amp;</span> Grange</a>
      <button type="button" class="mnav-close" aria-label="Close menu">&times;</button>
    </div>
    <form class="mnav-search" role="search" action="/sitemap/">
      <input type="search" name="q" placeholder="Search the school site…" aria-label="Search" autocomplete="off" />
      <button type="submit" aria-label="Search">→</button>
    </form>
    <nav class="mnav-body" aria-label="Site sections">${sectionsHtml}</nav>
    <div class="mnav-quick">
      <span class="mnav-quick-label">Quick links</span>
      <div class="mnav-quick-row">${quickHtml}</div>
    </div>`;
  document.body.appendChild(overlay);

  let lastFocus = null;
  const focusables = () => overlay.querySelectorAll('button, a[href]');

  const open = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    // force reflow so the opacity transition runs
    void overlay.offsetWidth;
    overlay.classList.add('is-open');
    document.body.classList.add('mnav-lock');
    burger.setAttribute('aria-expanded', 'true');
    overlay.querySelector('.mnav-close').focus();
  };
  const close = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('mnav-lock');
    burger.setAttribute('aria-expanded', 'false');
    const done = () => { overlay.hidden = true; overlay.removeEventListener('transitionend', done); };
    overlay.addEventListener('transitionend', done);
    setTimeout(done, 400); // fallback if transitionend doesn't fire
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  burger.addEventListener('click', open);
  overlay.querySelector('.mnav-close').addEventListener('click', close);

  // Accordion toggles
  overlay.querySelectorAll('.mnav-sec-trig').forEach(trig => {
    trig.addEventListener('click', () => {
      const panel = document.getElementById(trig.getAttribute('aria-controls'));
      const isOpen = trig.getAttribute('aria-expanded') === 'true';
      trig.setAttribute('aria-expanded', String(!isOpen));
      trig.closest('.mnav-sec').classList.toggle('is-open', !isOpen);
      panel.hidden = isOpen;
    });
  });

  // A real navigation click closes the overlay
  overlay.querySelectorAll('.mnav-body a, .mnav-quick a, .mnav-mark').forEach(a => {
    a.addEventListener('click', () => close());
  });

  // ESC closes; Tab is trapped within the overlay
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
