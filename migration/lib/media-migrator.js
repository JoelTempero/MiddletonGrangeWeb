/**
 * Media Migrator for WordPress Content
 *
 * Downloads media files from WordPress and uploads them to
 * Firebase Storage, updating content references.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class MediaMigrator {
    /**
     * Create a new MediaMigrator
     * @param {Object} options
     */
    constructor(options = {}) {
        this.options = {
            // Directory for downloaded files
            downloadDir: options.downloadDir || './migration/downloads',
            // Firebase Storage bucket (optional)
            storageBucket: options.storageBucket || null,
            // Concurrent downloads
            concurrency: options.concurrency || 5,
            // Timeout for downloads (ms)
            timeout: options.timeout || 30000,
            // Skip existing files
            skipExisting: options.skipExisting !== false,
            // Verbose logging
            verbose: options.verbose || false
        };

        this.storage = null;
        this.stats = {
            total: 0,
            downloaded: 0,
            uploaded: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };

        // URL mapping for content updates
        this.urlMap = new Map();
    }

    /**
     * Initialize Firebase Storage (optional)
     * @param {Object} admin - Firebase Admin SDK instance
     */
    initStorage(admin) {
        if (this.options.storageBucket) {
            this.storage = admin.storage().bucket(this.options.storageBucket);
        }
    }

    /**
     * Migrate media files from WordPress attachments
     * @param {Array} attachments - Array of attachment objects from parser
     * @returns {Object} - Migration stats and URL map
     */
    async migrate(attachments) {
        console.log(`\nMigrating ${attachments.length} media files...`);

        // Ensure download directory exists
        await fs.mkdir(this.options.downloadDir, { recursive: true });

        this.stats.total = attachments.length;

        // Process in batches for concurrency control
        const batches = this.chunk(attachments, this.options.concurrency);

        for (const batch of batches) {
            await Promise.all(batch.map(attachment => this.processAttachment(attachment)));
        }

        console.log(`\nMedia migration complete:`);
        console.log(`  Downloaded: ${this.stats.downloaded}`);
        console.log(`  Uploaded: ${this.stats.uploaded}`);
        console.log(`  Skipped: ${this.stats.skipped}`);
        console.log(`  Failed: ${this.stats.failed}`);

        return {
            stats: this.stats,
            urlMap: this.urlMap
        };
    }

    /**
     * Process a single attachment
     * @param {Object} attachment
     */
    async processAttachment(attachment) {
        try {
            const { url, filename, id } = attachment;

            if (!url) {
                this.stats.skipped++;
                return;
            }

            // Determine local path
            const localPath = path.join(this.options.downloadDir, this.sanitizeFilename(filename || this.extractFilename(url)));

            // Check if already exists
            if (this.options.skipExisting && await this.fileExists(localPath)) {
                this.stats.skipped++;
                if (this.options.verbose) {
                    console.log(`  Skipped (exists): ${filename}`);
                }

                // Still add to URL map
                const newUrl = this.storage
                    ? await this.getStorageUrl(localPath)
                    : `/images/${path.basename(localPath)}`;
                this.urlMap.set(url, newUrl);
                this.urlMap.set(id, newUrl);

                return;
            }

            // Download file
            await this.downloadFile(url, localPath);
            this.stats.downloaded++;

            if (this.options.verbose) {
                console.log(`  Downloaded: ${filename}`);
            }

            // Upload to Firebase Storage if configured
            let newUrl = `/images/${path.basename(localPath)}`;

            if (this.storage) {
                newUrl = await this.uploadToStorage(localPath, attachment);
                this.stats.uploaded++;

                if (this.options.verbose) {
                    console.log(`  Uploaded: ${filename}`);
                }
            }

            // Update URL map
            this.urlMap.set(url, newUrl);
            this.urlMap.set(id, newUrl);

        } catch (error) {
            this.stats.failed++;
            this.stats.errors.push({
                url: attachment.url,
                error: error.message
            });

            if (this.options.verbose) {
                console.error(`  Failed: ${attachment.filename || attachment.url} - ${error.message}`);
            }
        }
    }

    /**
     * Download a file from URL
     * @param {string} url
     * @param {string} localPath
     * @returns {Promise}
     */
    downloadFile(url, localPath) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            const request = protocol.get(url, { timeout: this.options.timeout }, (response) => {
                // Handle redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    this.downloadFile(response.headers.location, localPath)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', async () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        await fs.writeFile(localPath, buffer);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                response.on('error', reject);
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Upload file to Firebase Storage
     * @param {string} localPath
     * @param {Object} attachment
     * @returns {string} - Public URL
     */
    async uploadToStorage(localPath, attachment) {
        const filename = path.basename(localPath);
        const destination = `media/${this.getYearMonth()}/${filename}`;

        await this.storage.upload(localPath, {
            destination,
            metadata: {
                contentType: attachment.mimeType || 'application/octet-stream',
                metadata: {
                    originalUrl: attachment.url,
                    alt: attachment.alt || '',
                    caption: attachment.caption || ''
                }
            }
        });

        // Make file publicly accessible
        const file = this.storage.file(destination);
        await file.makePublic();

        return `https://storage.googleapis.com/${this.options.storageBucket}/${destination}`;
    }

    /**
     * Get public URL for a file in storage
     * @param {string} localPath
     * @returns {string}
     */
    async getStorageUrl(localPath) {
        const filename = path.basename(localPath);
        return `https://storage.googleapis.com/${this.options.storageBucket}/media/${filename}`;
    }

    /**
     * Check if file exists
     * @param {string} filePath
     * @returns {boolean}
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize filename for local storage
     * @param {string} filename
     * @returns {string}
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
    }

    /**
     * Extract filename from URL
     * @param {string} url
     * @returns {string}
     */
    extractFilename(url) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('?')[0];
        return filename || `file-${Date.now()}`;
    }

    /**
     * Get current year-month for storage path
     * @returns {string}
     */
    getYearMonth() {
        const now = new Date();
        return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Split array into chunks
     * @param {Array} array
     * @param {number} size
     * @returns {Array}
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Update content with new media URLs
     * @param {string} content - HTML content
     * @returns {string} - Content with updated URLs
     */
    updateContentUrls(content) {
        let updated = content;

        for (const [oldUrl, newUrl] of this.urlMap) {
            // Only replace string URLs, not numeric IDs
            if (typeof oldUrl === 'string' && oldUrl.startsWith('http')) {
                updated = updated.split(oldUrl).join(newUrl);
            }
        }

        return updated;
    }

    /**
     * Get new URL for an attachment ID or URL
     * @param {string|number} idOrUrl
     * @returns {string|null}
     */
    getNewUrl(idOrUrl) {
        return this.urlMap.get(idOrUrl) || this.urlMap.get(String(idOrUrl)) || null;
    }

    /**
     * Export URL mapping to JSON file
     * @param {string} outputPath
     */
    async exportUrlMap(outputPath) {
        const mapData = {};
        for (const [key, value] of this.urlMap) {
            mapData[key] = value;
        }

        await fs.writeFile(outputPath, JSON.stringify(mapData, null, 2), 'utf8');
        console.log(`URL mapping exported to: ${outputPath}`);
    }

    /**
     * Import URL mapping from JSON file
     * @param {string} inputPath
     */
    async importUrlMap(inputPath) {
        try {
            const data = await fs.readFile(inputPath, 'utf8');
            const mapData = JSON.parse(data);

            for (const [key, value] of Object.entries(mapData)) {
                this.urlMap.set(key, value);
            }

            console.log(`URL mapping imported: ${Object.keys(mapData).length} entries`);
        } catch (error) {
            console.warn(`Could not import URL map: ${error.message}`);
        }
    }

    /**
     * Get migration statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
}

module.exports = MediaMigrator;
