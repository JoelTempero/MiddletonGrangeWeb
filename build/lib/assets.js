/**
 * Asset Handler for Static Site Generation
 *
 * Copies and optionally optimizes static assets (CSS, JS, images).
 */

const fs = require('fs').promises;
const path = require('path');

class AssetHandler {
    /**
     * Create a new AssetHandler
     * @param {Object} config - Build configuration
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Copy all static assets to output directory
     * @returns {Object} - Stats about copied files
     */
    async copyAssets() {
        const stats = {
            css: 0,
            js: 0,
            images: 0,
            fonts: 0,
            other: 0
        };

        const publicDir = this.config.publicDir;
        const outputDir = this.config.outputDir;

        // Copy directories from public folder
        const assetDirs = ['css', 'js', 'images', 'fonts'];

        for (const dir of assetDirs) {
            const sourceDir = path.join(publicDir, dir);
            const destDir = path.join(outputDir, dir);

            if (await this.exists(sourceDir)) {
                const count = await this.copyDirectory(sourceDir, destDir);
                stats[dir] = count;
            }
        }

        // Copy any other files in public root (favicon, robots.txt, etc.)
        const rootFiles = await this.getRootFiles(publicDir);
        for (const file of rootFiles) {
            await this.copyFile(
                path.join(publicDir, file),
                path.join(outputDir, file)
            );
            stats.other++;
        }

        return stats;
    }

    /**
     * Check if a path exists
     * @param {string} filePath
     * @returns {boolean}
     */
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy a directory recursively
     * @param {string} source
     * @param {string} dest
     * @returns {number} - Count of files copied
     */
    async copyDirectory(source, dest) {
        let count = 0;

        // Create destination directory
        await fs.mkdir(dest, { recursive: true });

        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                count += await this.copyDirectory(sourcePath, destPath);
            } else {
                await this.copyFile(sourcePath, destPath);
                count++;

                if (this.config.verbose) {
                    console.log(`   → ${path.relative(this.config.outputDir, destPath)}`);
                }
            }
        }

        return count;
    }

    /**
     * Copy a single file with optional processing
     * @param {string} source
     * @param {string} dest
     */
    async copyFile(source, dest) {
        const ext = path.extname(source).toLowerCase();

        // Ensure destination directory exists
        await fs.mkdir(path.dirname(dest), { recursive: true });

        // Process based on file type
        if (this.config.minify && ext === '.css') {
            await this.processCss(source, dest);
        } else if (this.config.minify && ext === '.js') {
            await this.processJs(source, dest);
        } else {
            // Simple copy
            await fs.copyFile(source, dest);
        }
    }

    /**
     * Process CSS file (basic minification)
     * @param {string} source
     * @param {string} dest
     */
    async processCss(source, dest) {
        let content = await fs.readFile(source, 'utf8');

        if (this.config.minify) {
            // Basic CSS minification
            content = content
                // Remove comments
                .replace(/\/\*[\s\S]*?\*\//g, '')
                // Remove newlines and extra spaces
                .replace(/\s+/g, ' ')
                // Remove spaces around special characters
                .replace(/\s*([{}:;,>+~])\s*/g, '$1')
                // Remove trailing semicolons before closing braces
                .replace(/;}/g, '}')
                .trim();
        }

        await fs.writeFile(dest, content, 'utf8');
    }

    /**
     * Process JavaScript file (basic minification)
     * @param {string} source
     * @param {string} dest
     */
    async processJs(source, dest) {
        let content = await fs.readFile(source, 'utf8');

        if (this.config.minify) {
            // Basic JS minification (preserves functionality)
            content = content
                // Remove single-line comments (but not URLs)
                .replace(/(?<!:)\/\/[^\n]*/g, '')
                // Remove multi-line comments
                .replace(/\/\*[\s\S]*?\*\//g, '')
                // Remove multiple newlines
                .replace(/\n\s*\n/g, '\n')
                // Remove leading whitespace on lines
                .replace(/^\s+/gm, '')
                .trim();
        }

        await fs.writeFile(dest, content, 'utf8');
    }

    /**
     * Get files in the root of public directory (not subdirectories)
     * @param {string} dir
     * @returns {Array}
     */
    async getRootFiles(dir) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isFile()) {
                    files.push(entry.name);
                }
            }
        } catch (error) {
            // Directory might not exist
        }

        return files;
    }

    /**
     * Generate a sitemap.xml
     * @param {Array} pages - Array of page objects with slug property
     * @param {string} baseUrl - Base URL of the site
     */
    async generateSitemap(pages, baseUrl) {
        const urls = pages
            .filter(page => page.status === 'published')
            .map(page => {
                const loc = page.slug === 'index'
                    ? baseUrl
                    : `${baseUrl}/${page.slug}`;
                const lastmod = page.updatedAt?.toDate?.()
                    ? page.updatedAt.toDate().toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];

                return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.slug === 'index' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page.slug === 'index' ? '1.0' : '0.8'}</priority>
  </url>`;
            });

        // Add homepage
        urls.unshift(`  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

        const outputPath = path.join(this.config.outputDir, 'sitemap.xml');
        await fs.writeFile(outputPath, sitemap, 'utf8');

        if (this.config.verbose) {
            console.log('   → sitemap.xml');
        }
    }

    /**
     * Generate robots.txt
     * @param {string} baseUrl - Base URL of the site
     */
    async generateRobotsTxt(baseUrl) {
        const robots = `# Middleton Grange School
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

        const outputPath = path.join(this.config.outputDir, 'robots.txt');
        await fs.writeFile(outputPath, robots, 'utf8');

        if (this.config.verbose) {
            console.log('   → robots.txt');
        }
    }

    /**
     * Clean output directory
     */
    async cleanOutput() {
        const outputDir = this.config.outputDir;

        try {
            // Remove existing output directory
            await fs.rm(outputDir, { recursive: true, force: true });
        } catch (error) {
            // Directory might not exist
        }

        // Create fresh output directory
        await fs.mkdir(outputDir, { recursive: true });
    }

    /**
     * Get file size stats
     * @param {string} dir
     * @returns {Object}
     */
    async getDirectorySize(dir) {
        let totalSize = 0;
        let fileCount = 0;

        const calculateSize = async (dirPath) => {
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(dirPath, entry.name);

                    if (entry.isDirectory()) {
                        await calculateSize(entryPath);
                    } else {
                        const stat = await fs.stat(entryPath);
                        totalSize += stat.size;
                        fileCount++;
                    }
                }
            } catch (error) {
                // Ignore errors
            }
        };

        await calculateSize(dir);

        return {
            totalSize,
            fileCount,
            formattedSize: this.formatBytes(totalSize)
        };
    }

    /**
     * Format bytes to human readable string
     * @param {number} bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = AssetHandler;
