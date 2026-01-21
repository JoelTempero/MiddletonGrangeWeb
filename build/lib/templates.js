/**
 * Handlebars Template Engine for Static Site Generation
 *
 * Loads and compiles Handlebars templates with custom helpers.
 */

const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

class TemplateEngine {
    constructor() {
        this.templates = {};
        this.partials = {};
        this.initialized = false;
    }

    /**
     * Initialize the template engine
     * @param {string} templatesDir - Path to templates directory
     */
    async init(templatesDir) {
        if (this.initialized) return;

        // Register custom helpers
        this.registerHelpers();

        // Load all templates
        await this.loadTemplates(templatesDir);

        this.initialized = true;
    }

    /**
     * Register custom Handlebars helpers
     */
    registerHelpers() {
        // Date formatting
        Handlebars.registerHelper('formatDate', (date, format) => {
            if (!date) return '';

            // Handle Firestore Timestamp
            const d = date.toDate ? date.toDate() : new Date(date);

            if (isNaN(d.getTime())) return '';

            const options = {
                short: { year: 'numeric', month: 'short', day: 'numeric' },
                long: { year: 'numeric', month: 'long', day: 'numeric' },
                iso: null // Will use toISOString()
            };

            if (format === 'iso') {
                return d.toISOString();
            }

            return d.toLocaleDateString('en-NZ', options[format] || options.short);
        });

        // Year helper
        Handlebars.registerHelper('year', () => new Date().getFullYear());

        // Markdown to HTML
        Handlebars.registerHelper('markdown', (text) => {
            if (!text) return '';
            return new Handlebars.SafeString(marked(text));
        });

        // JSON stringify
        Handlebars.registerHelper('json', (obj) => {
            return new Handlebars.SafeString(JSON.stringify(obj));
        });

        // Conditional equality
        Handlebars.registerHelper('eq', (a, b) => a === b);
        Handlebars.registerHelper('neq', (a, b) => a !== b);
        Handlebars.registerHelper('gt', (a, b) => a > b);
        Handlebars.registerHelper('lt', (a, b) => a < b);
        Handlebars.registerHelper('gte', (a, b) => a >= b);
        Handlebars.registerHelper('lte', (a, b) => a <= b);

        // Logical operators
        Handlebars.registerHelper('and', (...args) => {
            args.pop(); // Remove Handlebars options
            return args.every(Boolean);
        });

        Handlebars.registerHelper('or', (...args) => {
            args.pop(); // Remove Handlebars options
            return args.some(Boolean);
        });

        Handlebars.registerHelper('not', (value) => !value);

        // Array helpers
        Handlebars.registerHelper('first', (array, count = 1) => {
            if (!Array.isArray(array)) return [];
            return array.slice(0, count);
        });

        Handlebars.registerHelper('last', (array, count = 1) => {
            if (!Array.isArray(array)) return [];
            return array.slice(-count);
        });

        Handlebars.registerHelper('limit', (array, limit) => {
            if (!Array.isArray(array)) return [];
            return array.slice(0, limit);
        });

        Handlebars.registerHelper('length', (array) => {
            if (!Array.isArray(array)) return 0;
            return array.length;
        });

        // String helpers
        Handlebars.registerHelper('truncate', (str, length) => {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + '...';
        });

        Handlebars.registerHelper('lowercase', (str) => {
            return str ? str.toLowerCase() : '';
        });

        Handlebars.registerHelper('uppercase', (str) => {
            return str ? str.toUpperCase() : '';
        });

        Handlebars.registerHelper('capitalize', (str) => {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        });

        // URL helpers
        Handlebars.registerHelper('urlEncode', (str) => {
            return encodeURIComponent(str || '');
        });

        // Default value
        Handlebars.registerHelper('default', (value, defaultValue) => {
            return value || defaultValue;
        });

        // Iteration with index
        Handlebars.registerHelper('times', (n, block) => {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += block.fn({ index: i, first: i === 0, last: i === n - 1 });
            }
            return result;
        });

        // Safe HTML output (for content from CMS)
        Handlebars.registerHelper('safe', (html) => {
            return new Handlebars.SafeString(html || '');
        });

        // Excerpt generator
        Handlebars.registerHelper('excerpt', (html, length = 150) => {
            if (!html) return '';
            // Strip HTML tags
            const text = html.replace(/<[^>]*>/g, '').trim();
            if (text.length <= length) return text;
            return text.substring(0, length).trim() + '...';
        });

        // YouTube thumbnail helper
        Handlebars.registerHelper('youtubeThumbnail', (videoId, quality = 'hqdefault') => {
            if (!videoId) return '';
            return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
        });

        // Current page check for navigation
        Handlebars.registerHelper('isCurrentPage', (pageSlug, currentSlug) => {
            return pageSlug === currentSlug;
        });

        // Menu section pages helper
        Handlebars.registerHelper('sectionPages', (sectionId, pagesBySection) => {
            return pagesBySection[sectionId] || [];
        });
    }

    /**
     * Load all templates from directory
     * @param {string} templatesDir
     */
    async loadTemplates(templatesDir) {
        try {
            const files = await fs.readdir(templatesDir);

            for (const file of files) {
                if (file.endsWith('.html')) {
                    const name = file.replace('.html', '');
                    const content = await fs.readFile(path.join(templatesDir, file), 'utf8');

                    // Check if it's a partial (starts with _)
                    if (name.startsWith('_')) {
                        const partialName = name.substring(1);
                        Handlebars.registerPartial(partialName, content);
                        this.partials[partialName] = content;
                    } else {
                        this.templates[name] = Handlebars.compile(content);
                    }
                }
            }

            // Register base template as a partial for extension
            if (this.templates.base) {
                Handlebars.registerPartial('base', await fs.readFile(
                    path.join(templatesDir, 'base.html'), 'utf8'
                ));
            }

        } catch (error) {
            throw new Error(`Failed to load templates: ${error.message}`);
        }
    }

    /**
     * Render a template with data
     * @param {string} templateName - Name of the template
     * @param {Object} data - Data to pass to template
     * @returns {string} - Rendered HTML
     */
    render(templateName, data) {
        const template = this.templates[templateName];

        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }

        return template(data);
    }

    /**
     * Render the base template with content injected
     * @param {string} contentTemplateName - Name of the content template
     * @param {Object} data - Data to pass to templates
     * @returns {string} - Rendered HTML
     */
    renderPage(contentTemplateName, data) {
        // First render the content template
        const content = this.render(contentTemplateName, data);

        // Inject content into data
        const pageData = {
            ...data,
            content
        };

        // Render the base template with content
        return this.render('base', pageData);
    }

    /**
     * Check if a template exists
     * @param {string} templateName
     * @returns {boolean}
     */
    hasTemplate(templateName) {
        return templateName in this.templates;
    }

    /**
     * Get count of loaded templates
     * @returns {number}
     */
    getTemplateCount() {
        return Object.keys(this.templates).length;
    }
}

// Export singleton instance
module.exports = new TemplateEngine();
