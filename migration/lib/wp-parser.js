/**
 * WordPress XML Export Parser
 *
 * Parses WordPress WXR (WordPress eXtended RSS) export files
 * and extracts pages, posts, media, and menu structure.
 */

const fs = require('fs').promises;
const { XMLParser } = require('fast-xml-parser');

class WordPressParser {
    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            isArray: (name) => {
                // Force these to always be arrays
                return ['item', 'wp:category', 'wp:tag', 'wp:term', 'wp:postmeta'].includes(name);
            }
        });
    }

    /**
     * Parse a WordPress XML export file
     * @param {string} filePath - Path to the WXR XML file
     * @returns {Object} - Parsed content
     */
    async parse(filePath) {
        console.log(`\nParsing WordPress export: ${filePath}`);

        const xml = await fs.readFile(filePath, 'utf8');
        const result = this.parser.parse(xml);

        const channel = result.rss?.channel;
        if (!channel) {
            throw new Error('Invalid WordPress export file - no channel found');
        }

        // Extract site info
        const siteInfo = {
            title: channel.title || '',
            link: channel.link || '',
            description: channel.description || '',
            language: channel.language || 'en-NZ',
            pubDate: channel.pubDate || ''
        };

        // Extract items (pages, posts, attachments)
        const items = channel.item || [];

        const pages = [];
        const posts = [];
        const attachments = [];
        const menuItems = [];

        for (const item of items) {
            const postType = this.getValue(item, 'wp:post_type');

            switch (postType) {
                case 'page':
                    pages.push(this.parsePage(item));
                    break;
                case 'post':
                    posts.push(this.parsePost(item));
                    break;
                case 'attachment':
                    attachments.push(this.parseAttachment(item));
                    break;
                case 'nav_menu_item':
                    menuItems.push(this.parseMenuItem(item));
                    break;
            }
        }

        // Extract categories and tags
        const categories = this.parseTerms(channel['wp:category'] || [], 'category');
        const tags = this.parseTerms(channel['wp:tag'] || [], 'tag');

        // Build menu structure from menu items
        const menus = this.buildMenuStructure(menuItems);

        console.log(`  Found: ${pages.length} pages, ${posts.length} posts, ${attachments.length} attachments`);
        console.log(`  Menus: ${Object.keys(menus).length} navigation menus`);

        return {
            siteInfo,
            pages,
            posts,
            attachments,
            categories,
            tags,
            menus
        };
    }

    /**
     * Parse a page item
     * @param {Object} item
     * @returns {Object}
     */
    parsePage(item) {
        const meta = this.parsePostMeta(item['wp:postmeta'] || []);

        return {
            id: this.getValue(item, 'wp:post_id'),
            title: item.title || '',
            slug: this.getValue(item, 'wp:post_name') || this.slugify(item.title || ''),
            content: item['content:encoded'] || '',
            excerpt: item['excerpt:encoded'] || '',
            status: this.mapStatus(this.getValue(item, 'wp:status')),
            parentId: this.getValue(item, 'wp:post_parent') || null,
            menuOrder: parseInt(this.getValue(item, 'wp:menu_order') || '0'),
            createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            modifiedAt: this.getValue(item, 'wp:post_modified')
                ? new Date(this.getValue(item, 'wp:post_modified'))
                : new Date(),
            author: item['dc:creator'] || '',
            meta: meta,
            // Elementor specific
            isElementor: meta._elementor_edit_mode === 'builder',
            elementorData: meta._elementor_data || null,
            featuredImage: meta._thumbnail_id || null
        };
    }

    /**
     * Parse a post item
     * @param {Object} item
     * @returns {Object}
     */
    parsePost(item) {
        const page = this.parsePage(item);
        const categories = [];
        const tags = [];

        // Extract categories and tags
        const itemCategories = item.category || [];
        const catArray = Array.isArray(itemCategories) ? itemCategories : [itemCategories];

        for (const cat of catArray) {
            if (typeof cat === 'object') {
                const domain = cat['@_domain'];
                const nicename = cat['@_nicename'];
                const name = cat['#text'] || '';

                if (domain === 'category') {
                    categories.push({ slug: nicename, name });
                } else if (domain === 'post_tag') {
                    tags.push({ slug: nicename, name });
                }
            }
        }

        return {
            ...page,
            pageType: 'news',
            categories,
            tags
        };
    }

    /**
     * Parse an attachment item
     * @param {Object} item
     * @returns {Object}
     */
    parseAttachment(item) {
        const meta = this.parsePostMeta(item['wp:postmeta'] || []);

        return {
            id: this.getValue(item, 'wp:post_id'),
            title: item.title || '',
            url: this.getValue(item, 'wp:attachment_url') || '',
            filename: this.extractFilename(this.getValue(item, 'wp:attachment_url') || ''),
            mimeType: meta._wp_attached_file
                ? this.guessMimeType(meta._wp_attached_file)
                : 'application/octet-stream',
            alt: meta._wp_attachment_image_alt || '',
            caption: item['excerpt:encoded'] || '',
            description: item['content:encoded'] || '',
            createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            meta: {
                width: meta._wp_attachment_metadata?.width,
                height: meta._wp_attachment_metadata?.height,
                sizes: meta._wp_attachment_metadata?.sizes
            }
        };
    }

    /**
     * Parse a menu item
     * @param {Object} item
     * @returns {Object}
     */
    parseMenuItem(item) {
        const meta = this.parsePostMeta(item['wp:postmeta'] || []);

        return {
            id: this.getValue(item, 'wp:post_id'),
            title: item.title || '',
            menuName: meta._menu_item_menu_item_parent ? null : item.title,
            parentId: meta._menu_item_menu_item_parent || '0',
            objectType: meta._menu_item_object || 'custom',
            objectId: meta._menu_item_object_id || null,
            url: meta._menu_item_url || '',
            order: parseInt(this.getValue(item, 'wp:menu_order') || '0'),
            target: meta._menu_item_target || '',
            classes: meta._menu_item_classes || []
        };
    }

    /**
     * Parse post meta into key-value object
     * @param {Array} metaArray
     * @returns {Object}
     */
    parsePostMeta(metaArray) {
        const meta = {};

        for (const item of metaArray) {
            const key = this.getValue(item, 'wp:meta_key');
            let value = this.getValue(item, 'wp:meta_value');

            // Try to parse JSON or serialized PHP
            if (value && typeof value === 'string') {
                // Check for serialized PHP array
                if (value.startsWith('a:') || value.startsWith('s:')) {
                    value = this.parseSerializedPHP(value);
                }
                // Check for JSON
                else if (value.startsWith('[') || value.startsWith('{')) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string
                    }
                }
            }

            if (key) {
                meta[key] = value;
            }
        }

        return meta;
    }

    /**
     * Parse terms (categories/tags)
     * @param {Array} terms
     * @param {string} type
     * @returns {Array}
     */
    parseTerms(terms, type) {
        return terms.map(term => ({
            type,
            slug: this.getValue(term, 'wp:term_slug') || this.getValue(term, 'wp:category_nicename') || '',
            name: this.getValue(term, 'wp:term_name') || this.getValue(term, 'wp:cat_name') || '',
            description: this.getValue(term, 'wp:term_description') || this.getValue(term, 'wp:category_description') || '',
            parentSlug: this.getValue(term, 'wp:term_parent') || this.getValue(term, 'wp:category_parent') || ''
        }));
    }

    /**
     * Build menu structure from menu items
     * @param {Array} menuItems
     * @returns {Object}
     */
    buildMenuStructure(menuItems) {
        const menus = {};

        // Group by menu (items with parentId '0' are top-level)
        for (const item of menuItems) {
            if (item.parentId === '0') {
                const menuName = item.title || 'Main Menu';
                if (!menus[menuName]) {
                    menus[menuName] = {
                        name: menuName,
                        items: []
                    };
                }
            }
        }

        // If no root menus found, create a default
        if (Object.keys(menus).length === 0) {
            menus['Main Menu'] = { name: 'Main Menu', items: [] };
        }

        // Build tree structure
        const itemsById = {};
        for (const item of menuItems) {
            itemsById[item.id] = { ...item, children: [] };
        }

        for (const item of menuItems) {
            if (item.parentId !== '0' && itemsById[item.parentId]) {
                itemsById[item.parentId].children.push(itemsById[item.id]);
            }
        }

        // Add top-level items to menus
        const firstMenu = Object.keys(menus)[0];
        for (const item of menuItems) {
            if (item.parentId === '0') {
                menus[firstMenu].items.push(itemsById[item.id]);
            }
        }

        // Sort by order
        for (const menu of Object.values(menus)) {
            menu.items.sort((a, b) => a.order - b.order);
            for (const item of menu.items) {
                if (item.children) {
                    item.children.sort((a, b) => a.order - b.order);
                }
            }
        }

        return menus;
    }

    /**
     * Get value from WordPress namespaced element
     * @param {Object} obj
     * @param {string} key
     * @returns {string|null}
     */
    getValue(obj, key) {
        if (!obj) return null;

        // Try with namespace
        if (obj[key] !== undefined) {
            const val = obj[key];
            return typeof val === 'object' ? val['#text'] : val;
        }

        // Try without namespace
        const shortKey = key.includes(':') ? key.split(':')[1] : key;
        if (obj[shortKey] !== undefined) {
            const val = obj[shortKey];
            return typeof val === 'object' ? val['#text'] : val;
        }

        return null;
    }

    /**
     * Map WordPress status to our status
     * @param {string} wpStatus
     * @returns {string}
     */
    mapStatus(wpStatus) {
        const statusMap = {
            'publish': 'published',
            'draft': 'draft',
            'pending': 'draft',
            'private': 'draft',
            'future': 'draft',
            'trash': 'archived'
        };
        return statusMap[wpStatus] || 'draft';
    }

    /**
     * Create a URL-friendly slug from a string
     * @param {string} text
     * @returns {string}
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    /**
     * Extract filename from URL
     * @param {string} url
     * @returns {string}
     */
    extractFilename(url) {
        if (!url) return '';
        const parts = url.split('/');
        return parts[parts.length - 1] || '';
    }

    /**
     * Guess MIME type from filename
     * @param {string} filename
     * @returns {string}
     */
    guessMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'mp3': 'audio/mpeg'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Basic PHP serialized string parser
     * @param {string} str
     * @returns {*}
     */
    parseSerializedPHP(str) {
        // This is a simplified parser - for complex data, consider using a proper library
        try {
            // Handle simple arrays
            if (str.startsWith('a:')) {
                const match = str.match(/a:(\d+):\{(.+)\}/s);
                if (match) {
                    // Return as string for now - full parsing is complex
                    return str;
                }
            }
            // Handle simple strings
            if (str.startsWith('s:')) {
                const match = str.match(/s:\d+:"(.+)";/);
                if (match) {
                    return match[1];
                }
            }
        } catch (e) {
            // Return original
        }
        return str;
    }
}

module.exports = WordPressParser;
