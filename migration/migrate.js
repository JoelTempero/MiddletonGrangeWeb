#!/usr/bin/env node
/**
 * WordPress to Firebase CMS Migration Tool
 *
 * Migrates content from a WordPress XML export to Firestore.
 *
 * Usage:
 *   node migrate.js <wordpress-export.xml> [options]
 *
 * Options:
 *   --dry-run          Preview changes without writing to Firestore
 *   --download-media   Download media files locally
 *   --upload-media     Upload media to Firebase Storage
 *   --verbose          Show detailed progress
 *   --output <dir>     Output directory for reports and downloads
 */

const fs = require('fs').promises;
const path = require('path');
const admin = require('firebase-admin');

const WordPressParser = require('./lib/wp-parser');
const ContentCleaner = require('./lib/content-cleaner');
const MediaMigrator = require('./lib/media-migrator');

// Configuration
const CONFIG = {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.join(__dirname, '..', 'service-account.json'),
    outputDir: './migration/output',
    downloadDir: './migration/downloads'
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        inputFile: null,
        dryRun: false,
        downloadMedia: false,
        uploadMedia: false,
        verbose: false,
        outputDir: CONFIG.outputDir
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--download-media':
                options.downloadMedia = true;
                break;
            case '--upload-media':
                options.uploadMedia = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--output':
            case '-o':
                options.outputDir = args[++i];
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
            default:
                if (!arg.startsWith('-') && !options.inputFile) {
                    options.inputFile = arg;
                }
        }
    }

    return options;
}

function showHelp() {
    console.log(`
WordPress to Firebase CMS Migration Tool

Usage:
  node migrate.js <wordpress-export.xml> [options]

Options:
  --dry-run          Preview changes without writing to Firestore
  --download-media   Download media files locally
  --upload-media     Upload media to Firebase Storage (requires service account)
  --verbose, -v      Show detailed progress
  --output, -o       Output directory for reports and downloads
  --help, -h         Show this help message

Examples:
  # Preview migration without changes
  node migrate.js export.xml --dry-run --verbose

  # Migrate content only
  node migrate.js export.xml

  # Full migration with media
  node migrate.js export.xml --download-media --upload-media

Environment Variables:
  GOOGLE_APPLICATION_CREDENTIALS  Path to Firebase service account JSON
`);
}

// Initialize Firebase
async function initFirebase() {
    try {
        const serviceAccount = require(CONFIG.credentialsPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: serviceAccount.project_id + '.appspot.com'
        });

        return admin.firestore();
    } catch (error) {
        console.error('Failed to initialize Firebase:', error.message);
        console.log('\nMake sure you have a service-account.json file or set GOOGLE_APPLICATION_CREDENTIALS');
        return null;
    }
}

// Main migration function
async function migrate(options) {
    console.log('='.repeat(60));
    console.log('WordPress to Firebase CMS Migration');
    console.log('='.repeat(60));

    if (!options.inputFile) {
        console.error('\nError: No input file specified');
        showHelp();
        process.exit(1);
    }

    // Check input file exists
    try {
        await fs.access(options.inputFile);
    } catch {
        console.error(`\nError: Input file not found: ${options.inputFile}`);
        process.exit(1);
    }

    // Create output directory
    await fs.mkdir(options.outputDir, { recursive: true });

    // Initialize components
    const parser = new WordPressParser();
    const cleaner = new ContentCleaner({
        removeEmpty: true,
        semanticize: true
    });

    // Initialize Firebase (unless dry run)
    let db = null;
    if (!options.dryRun) {
        db = await initFirebase();
        if (!db) {
            console.log('\nContinuing in dry-run mode (no Firebase connection)');
            options.dryRun = true;
        }
    }

    // Parse WordPress export
    console.log('\n[1/5] Parsing WordPress export...');
    const wpData = await parser.parse(options.inputFile);

    // Migrate media (optional)
    let mediaMigrator = null;
    if (options.downloadMedia || options.uploadMedia) {
        console.log('\n[2/5] Processing media files...');
        mediaMigrator = new MediaMigrator({
            downloadDir: path.join(options.outputDir, 'media'),
            storageBucket: options.uploadMedia ? admin.storage().bucket().name : null,
            verbose: options.verbose
        });

        if (options.uploadMedia && !options.dryRun) {
            mediaMigrator.initStorage(admin);
        }

        await mediaMigrator.migrate(wpData.attachments);
    } else {
        console.log('\n[2/5] Skipping media migration (use --download-media or --upload-media)');
    }

    // Clean and prepare content
    console.log('\n[3/5] Cleaning content...');
    const pages = [];
    const menuSections = [];

    // Process pages
    for (const page of wpData.pages) {
        const cleanedContent = cleaner.clean(page.content);

        // Update media URLs if migrated
        const finalContent = mediaMigrator
            ? mediaMigrator.updateContentUrls(cleanedContent)
            : cleanedContent;

        pages.push({
            title: page.title,
            slug: page.slug,
            content: finalContent,
            status: page.status,
            pageType: 'standard',
            menuSection: null, // Will be assigned based on menu structure
            menuOrder: page.menuOrder,
            metaTitle: page.title,
            metaDescription: cleaner.clean(page.excerpt).substring(0, 160),
            headerImage: mediaMigrator?.getNewUrl(page.featuredImage) || '',
            createdAt: admin.firestore?.Timestamp?.fromDate?.(page.createdAt) || page.createdAt,
            updatedAt: admin.firestore?.Timestamp?.fromDate?.(page.modifiedAt) || page.modifiedAt,
            createdBy: 'migration',
            updatedBy: 'migration'
        });

        if (options.verbose) {
            console.log(`  Processed: ${page.title}`);
        }
    }

    // Process posts as news pages
    for (const post of wpData.posts) {
        const cleanedContent = cleaner.clean(post.content);
        const finalContent = mediaMigrator
            ? mediaMigrator.updateContentUrls(cleanedContent)
            : cleanedContent;

        pages.push({
            title: post.title,
            slug: post.slug,
            content: finalContent,
            status: post.status,
            pageType: 'news',
            menuSection: 'news',
            menuOrder: 0,
            metaTitle: post.title,
            metaDescription: cleaner.clean(post.excerpt).substring(0, 160),
            headerImage: mediaMigrator?.getNewUrl(post.featuredImage) || '',
            createdAt: admin.firestore?.Timestamp?.fromDate?.(post.createdAt) || post.createdAt,
            updatedAt: admin.firestore?.Timestamp?.fromDate?.(post.modifiedAt) || post.modifiedAt,
            createdBy: 'migration',
            updatedBy: 'migration'
        });

        if (options.verbose) {
            console.log(`  Processed: ${post.title} (news)`);
        }
    }

    // Create menu sections from WordPress menus
    let sectionOrder = 0;
    for (const [menuName, menu] of Object.entries(wpData.menus)) {
        if (menu.items.length > 0) {
            menuSections.push({
                id: slugify(menuName),
                title: menuName,
                description: '',
                order: sectionOrder++,
                visible: true
            });

            // Assign pages to menu sections based on menu items
            for (const item of menu.items) {
                if (item.objectType === 'page') {
                    const page = pages.find(p =>
                        p.slug === item.url?.replace(/^\/|\/$/g, '') ||
                        p.title === item.title
                    );
                    if (page) {
                        page.menuSection = slugify(menuName);
                        page.menuOrder = item.order;
                    }
                }
            }
        }
    }

    console.log(`\n  Prepared ${pages.length} pages in ${menuSections.length} menu sections`);

    // Generate migration report
    console.log('\n[4/5] Generating migration report...');
    const report = {
        timestamp: new Date().toISOString(),
        source: options.inputFile,
        stats: {
            pages: pages.length,
            posts: wpData.posts.length,
            attachments: wpData.attachments.length,
            menuSections: menuSections.length
        },
        pages: pages.map(p => ({ title: p.title, slug: p.slug, status: p.status })),
        menuSections: menuSections,
        mediaStats: mediaMigrator?.getStats() || null
    };

    const reportPath = path.join(options.outputDir, 'migration-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`  Report saved: ${reportPath}`);

    // Save cleaned content for review
    const contentPath = path.join(options.outputDir, 'cleaned-content');
    await fs.mkdir(contentPath, { recursive: true });

    for (const page of pages) {
        const pagePath = path.join(contentPath, `${page.slug}.html`);
        await fs.writeFile(pagePath, page.content || '', 'utf8');
    }
    console.log(`  Cleaned content saved to: ${contentPath}`);

    // Write to Firestore
    if (options.dryRun) {
        console.log('\n[5/5] DRY RUN - Skipping Firestore writes');
        console.log('  Review the migration report and cleaned content');
        console.log('  Run without --dry-run to perform the actual migration');
    } else {
        console.log('\n[5/5] Writing to Firestore...');

        const batch = db.batch();
        let batchCount = 0;
        const maxBatchSize = 500;

        // Write menu sections
        for (const section of menuSections) {
            const ref = db.collection('menuSections').doc(section.id);
            batch.set(ref, section);
            batchCount++;
        }

        // Commit menu sections
        if (batchCount > 0) {
            await batch.commit();
            console.log(`  Created ${menuSections.length} menu sections`);
        }

        // Write pages in batches
        let pageCount = 0;
        let currentBatch = db.batch();
        let currentBatchCount = 0;

        for (const page of pages) {
            const ref = db.collection('pages').doc();
            currentBatch.set(ref, page);
            currentBatchCount++;
            pageCount++;

            if (currentBatchCount >= maxBatchSize) {
                await currentBatch.commit();
                currentBatch = db.batch();
                currentBatchCount = 0;
                console.log(`    Committed ${pageCount} pages...`);
            }
        }

        // Commit remaining pages
        if (currentBatchCount > 0) {
            await currentBatch.commit();
        }

        console.log(`  Created ${pageCount} pages`);

        // Write media metadata if uploaded
        if (options.uploadMedia && mediaMigrator) {
            console.log('  Saving media metadata...');

            let mediaCount = 0;
            currentBatch = db.batch();
            currentBatchCount = 0;

            for (const attachment of wpData.attachments) {
                const newUrl = mediaMigrator.getNewUrl(attachment.url);
                if (newUrl) {
                    const ref = db.collection('media').doc();
                    currentBatch.set(ref, {
                        filename: attachment.filename,
                        url: newUrl,
                        originalUrl: attachment.url,
                        type: attachment.mimeType?.split('/')[0] || 'file',
                        mimeType: attachment.mimeType,
                        alt: attachment.alt || '',
                        caption: attachment.caption || '',
                        createdAt: admin.firestore.Timestamp.fromDate(attachment.createdAt),
                        uploadedBy: 'migration'
                    });
                    currentBatchCount++;
                    mediaCount++;

                    if (currentBatchCount >= maxBatchSize) {
                        await currentBatch.commit();
                        currentBatch = db.batch();
                        currentBatchCount = 0;
                    }
                }
            }

            if (currentBatchCount > 0) {
                await currentBatch.commit();
            }

            console.log(`  Created ${mediaCount} media records`);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`\nSummary:`);
    console.log(`  Pages migrated: ${pages.length}`);
    console.log(`  Menu sections: ${menuSections.length}`);
    if (mediaMigrator) {
        const stats = mediaMigrator.getStats();
        console.log(`  Media downloaded: ${stats.downloaded}`);
        console.log(`  Media uploaded: ${stats.uploaded}`);
        console.log(`  Media failed: ${stats.failed}`);
    }
    console.log(`\nOutput directory: ${options.outputDir}`);

    if (options.dryRun) {
        console.log('\n** This was a DRY RUN - no changes were made to Firestore **');
    }
}

// Helper function
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Run migration
const options = parseArgs();
migrate(options).catch(error => {
    console.error('\nMigration failed:', error);
    process.exit(1);
});
