#!/usr/bin/env node

/**
 * Middleton Grange CMS - Static Site Generator
 *
 * Compiles Handlebars templates with Firestore data into static HTML files.
 *
 * Usage:
 *   npm run build          - Production build
 *   npm run build:dev      - Development build (includes drafts)
 *
 * Environment Variables:
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to Firebase service account JSON
 *   FIREBASE_PROJECT_ID - Firebase project ID (optional if in service account)
 */

const path = require('path');
const fs = require('fs').promises;

// Import our modules
const FirebaseClient = require('./lib/firebase');
const TemplateEngine = require('./lib/templates');
const PageGenerator = require('./lib/generators');
const AssetManager = require('./lib/assets');

// Configuration
const CONFIG = {
    // Directories
    templatesDir: path.join(__dirname, '..', 'templates'),
    publicDir: path.join(__dirname, '..', 'public'),
    outputDir: path.join(__dirname, '..', 'dist'),

    // Build options
    isDev: process.argv.includes('--dev'),
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),

    // Site defaults
    siteDefaults: {
        siteName: 'Middleton Grange School',
        tagline: 'Character, Excellence, Service for the Glory of God',
        siteUrl: 'https://www.middleton.school.nz',
        primaryColor: '#1e3a5f',
        secondaryColor: '#c9a227'
    }
};

/**
 * Main build function
 */
async function build() {
    const startTime = Date.now();

    console.log('\n🏫 Middleton Grange CMS - Static Site Generator');
    console.log('================================================\n');

    if (CONFIG.isDev) {
        console.log('📝 Development mode: Including draft pages\n');
    }

    try {
        // Step 1: Initialize Firebase
        console.log('🔥 Connecting to Firebase...');
        await FirebaseClient.init();
        console.log('   ✓ Firebase connected\n');

        // Step 2: Load site settings
        console.log('⚙️  Loading site settings...');
        const siteSettings = await loadSiteSettings();
        console.log('   ✓ Settings loaded\n');

        // Step 3: Initialize template engine
        console.log('📄 Initializing template engine...');
        await TemplateEngine.init(CONFIG.templatesDir);
        console.log(`   ✓ ${TemplateEngine.getTemplateCount()} templates loaded\n`);

        // Step 4: Clean output directory
        console.log('🧹 Cleaning output directory...');
        await cleanOutputDir();
        console.log('   ✓ Output directory ready\n');

        // Step 5: Copy static assets
        console.log('📦 Copying static assets...');
        const assetCount = await AssetManager.copyAssets(CONFIG.publicDir, CONFIG.outputDir);
        console.log(`   ✓ ${assetCount} assets copied\n`);

        // Step 6: Load data from Firestore
        console.log('📊 Loading content from Firestore...');
        const data = await loadAllData();
        console.log(`   ✓ ${data.pages.length} pages, ${data.menuSections.length} menu sections loaded\n`);

        // Step 7: Generate pages
        console.log('🔨 Generating pages...');
        const generator = new PageGenerator(TemplateEngine, CONFIG, siteSettings);

        // Generate homepage
        await generator.generateHomepage(data);
        console.log('   ✓ Homepage generated');

        // Generate content pages
        const pageCount = await generator.generatePages(data);
        console.log(`   ✓ ${pageCount} content pages generated`);

        // Generate special pages (404, etc.)
        await generator.generateSpecialPages(data);
        console.log('   ✓ Special pages generated\n');

        // Step 8: Generate sitemap
        console.log('🗺️  Generating sitemap...');
        await generateSitemap(data, siteSettings);
        console.log('   ✓ Sitemap generated\n');

        // Done!
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('================================================');
        console.log(`✅ Build complete in ${duration}s`);
        console.log(`   Output: ${CONFIG.outputDir}\n`);

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        if (CONFIG.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        // Cleanup Firebase connection
        await FirebaseClient.cleanup();
    }
}

/**
 * Load site settings from Firestore
 * @returns {Object}
 */
async function loadSiteSettings() {
    try {
        const settings = await FirebaseClient.getDocument('siteSettings', 'config');

        if (!settings) {
            console.log('   ⚠ No settings found, using defaults');
            return CONFIG.siteDefaults;
        }

        // Merge with defaults
        return {
            ...CONFIG.siteDefaults,
            ...settings.general,
            contact: settings.contact || {},
            links: settings.links || {},
            homepage: settings.homepage || {},
            popup: settings.popup || {}
        };
    } catch (error) {
        console.log('   ⚠ Error loading settings, using defaults');
        return CONFIG.siteDefaults;
    }
}

/**
 * Load all data from Firestore
 * @returns {Object}
 */
async function loadAllData() {
    const [pages, menuSections, videos, staffProfiles] = await Promise.all([
        loadPages(),
        FirebaseClient.getCollection('menuSections', [['order', 'asc']]),
        FirebaseClient.getCollection('videos', [['createdAt', 'desc']]),
        FirebaseClient.getCollection('staffProfiles', [['order', 'asc']])
    ]);

    // Organize pages by menu section
    const pagesBySection = {};
    menuSections.forEach(section => {
        pagesBySection[section.id] = pages
            .filter(p => p.menuSection === section.id)
            .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));
    });

    return {
        pages,
        menuSections,
        pagesBySection,
        videos,
        staffProfiles
    };
}

/**
 * Load pages based on build mode
 * @returns {Array}
 */
async function loadPages() {
    let pages = await FirebaseClient.getCollection('pages');

    // Filter to published only in production mode
    if (!CONFIG.isDev) {
        pages = pages.filter(page => page.status === 'published');
    }

    return pages;
}

/**
 * Clean the output directory
 */
async function cleanOutputDir() {
    try {
        await fs.rm(CONFIG.outputDir, { recursive: true, force: true });
    } catch (error) {
        // Directory might not exist
    }
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
}

/**
 * Generate XML sitemap
 * @param {Object} data
 * @param {Object} settings
 */
async function generateSitemap(data, settings) {
    const siteUrl = settings.siteUrl || CONFIG.siteDefaults.siteUrl;
    const now = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += `  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Content pages
    data.pages.forEach(page => {
        if (page.status === 'published' && page.slug) {
            const lastmod = page.updatedAt?.toDate?.()?.toISOString() || now;
            xml += `  <url>
    <loc>${siteUrl}/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        }
    });

    xml += '</urlset>';

    await fs.writeFile(path.join(CONFIG.outputDir, 'sitemap.xml'), xml);
}

// Run the build
build();
