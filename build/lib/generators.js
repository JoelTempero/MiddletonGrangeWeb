/**
 * Page Generator for Static Site
 *
 * Generates HTML pages from templates and Firestore data.
 */

const fs = require('fs').promises;
const path = require('path');

class PageGenerator {
    /**
     * Create a new PageGenerator
     * @param {Object} templateEngine - The template engine instance
     * @param {Object} config - Build configuration
     * @param {Object} siteSettings - Site settings from Firestore
     */
    constructor(templateEngine, config, siteSettings) {
        this.templates = templateEngine;
        this.config = config;
        this.settings = siteSettings;
    }

    /**
     * Get common data for all pages
     * @param {Object} data - Full data object
     * @param {Object} page - Current page (optional)
     * @returns {Object}
     */
    getCommonData(data, page = null) {
        return {
            // Site settings
            site_name: this.settings.siteName,
            tagline: this.settings.tagline,
            logo_url: this.settings.logoUrl || '/images/logo.png',
            favicon_url: this.settings.faviconUrl || '/images/favicon.png',
            primary_color: this.settings.primaryColor,
            secondary_color: this.settings.secondaryColor,
            footer_text: this.settings.footerText,

            // Contact info
            address: this.settings.contact?.address || '',
            phone: this.settings.contact?.phone || '',
            email: this.settings.contact?.email || '',
            int_phone: this.settings.contact?.intPhone || '',
            int_email: this.settings.contact?.intEmail || '',
            int_urgent: this.settings.contact?.intUrgent || '',

            // Social/Links
            facebook_url: this.settings.links?.facebookUrl || '',
            parent_portal_url: this.settings.links?.parentPortalUrl || '',
            student_portal_url: this.settings.links?.studentPortalUrl || '',
            kindo_url: this.settings.links?.kindoUrl || '',
            school_app_url: this.settings.links?.schoolAppUrl || '',
            theatre_url: this.settings.links?.theatreUrl || '',

            // Navigation
            menu_sections: this.buildNavigation(data),

            // Popup (if enabled and within date range)
            popup_enabled: this.isPopupActive(),
            popup_title: this.settings.popup?.title || '',
            popup_content: this.settings.popup?.content || '',
            popup_show_once: this.settings.popup?.showOnce ?? true,

            // Current page info
            current_slug: page?.slug || '',
            page_url: page ? `${this.settings.siteUrl || ''}/${page.slug}` : this.settings.siteUrl || ''
        };
    }

    /**
     * Check if popup should be active
     * @returns {boolean}
     */
    isPopupActive() {
        const popup = this.settings.popup;
        if (!popup?.enabled) return false;

        const now = new Date();

        if (popup.startDate) {
            const startDate = new Date(popup.startDate);
            if (now < startDate) return false;
        }

        if (popup.endDate) {
            const endDate = new Date(popup.endDate);
            if (now > endDate) return false;
        }

        return true;
    }

    /**
     * Build navigation structure for templates
     * @param {Object} data
     * @returns {Array}
     */
    buildNavigation(data) {
        return data.menuSections
            .filter(section => section.visible !== false)
            .map(section => ({
                id: section.id,
                title: section.title,
                description: section.description || '',
                pages: (data.pagesBySection[section.id] || [])
                    .filter(page => page.status === 'published' || this.config.isDev)
                    .map(page => ({
                        title: page.title,
                        slug: page.slug
                    }))
            }));
    }

    /**
     * Generate breadcrumbs for a page
     * @param {Object} page
     * @param {Object} data
     * @returns {Array}
     */
    generateBreadcrumbs(page, data) {
        const breadcrumbs = [];

        // Find the menu section
        if (page.menuSection) {
            const section = data.menuSections.find(s => s.id === page.menuSection);
            if (section) {
                // Get first page in section as section landing page
                const sectionPages = data.pagesBySection[section.id] || [];
                const landingPage = sectionPages[0];

                if (landingPage && landingPage.id !== page.id) {
                    breadcrumbs.push({
                        title: section.title,
                        url: `/${landingPage.slug}`
                    });
                }
            }
        }

        // Current page (no URL)
        breadcrumbs.push({
            title: page.title,
            url: null
        });

        return breadcrumbs;
    }

    /**
     * Generate the homepage
     * @param {Object} data
     */
    async generateHomepage(data) {
        const homepageSettings = this.settings.homepage || {};

        const pageData = {
            ...this.getCommonData(data),

            // Meta
            meta_title: this.settings.siteName,
            meta_description: this.settings.tagline,
            og_image: this.settings.logoUrl || '',

            // Hero
            hero_video_url: homepageSettings.heroVideoUrl || '',
            hero_image: homepageSettings.heroImage || '',
            hero_title: homepageSettings.heroTitle || this.settings.siteName,
            hero_subtitle: homepageSettings.heroSubtitle || this.settings.tagline,

            // Homepage sections
            intro_text: homepageSettings.introText || '',
            intro_image: homepageSettings.introImage || '',

            // Values section
            values_enabled: homepageSettings.valuesEnabled !== false,

            // Back to school
            back_to_school_enabled: homepageSettings.backToSchoolEnabled || false,
            back_to_school_year: homepageSettings.backToSchoolYear || new Date().getFullYear(),
            back_to_school_links: homepageSettings.backToSchoolLinks || [],

            // Recent news (first 3 published pages from a "news" section if exists)
            recent_news: this.getRecentNews(data, 3)
        };

        const html = this.templates.renderPage('homepage', pageData);
        await this.writeFile('index.html', html);
    }

    /**
     * Get recent news/blog posts
     * @param {Object} data
     * @param {number} limit
     * @returns {Array}
     */
    getRecentNews(data, limit = 3) {
        // Find pages that are news/blog type
        const newsPages = data.pages
            .filter(p => p.pageType === 'news' && p.status === 'published')
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            })
            .slice(0, limit);

        return newsPages.map(page => ({
            title: page.title,
            slug: page.slug,
            excerpt: this.generateExcerpt(page.content),
            image: page.headerImage || '',
            date: this.formatDate(page.createdAt)
        }));
    }

    /**
     * Generate excerpt from HTML content
     * @param {string} html
     * @param {number} length
     * @returns {string}
     */
    generateExcerpt(html, length = 150) {
        if (!html) return '';
        const text = html.replace(/<[^>]*>/g, '').trim();
        if (text.length <= length) return text;
        return text.substring(0, length).trim() + '...';
    }

    /**
     * Format a date
     * @param {Object} date - Firestore timestamp or Date
     * @returns {string}
     */
    formatDate(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Generate all content pages
     * @param {Object} data
     * @returns {number} - Count of pages generated
     */
    async generatePages(data) {
        let count = 0;

        for (const page of data.pages) {
            // Skip pages without slugs
            if (!page.slug) continue;

            // Skip unpublished in production
            if (!this.config.isDev && page.status !== 'published') continue;

            await this.generatePage(page, data);
            count++;
        }

        return count;
    }

    /**
     * Generate a single content page
     * @param {Object} page
     * @param {Object} data
     */
    async generatePage(page, data) {
        // Determine template based on page type
        const templateName = this.getTemplateForPage(page);

        const pageData = {
            ...this.getCommonData(data, page),

            // Meta
            meta_title: page.metaTitle || page.title,
            meta_description: page.metaDescription || this.generateExcerpt(page.content, 160),
            og_image: page.headerImage || this.settings.logoUrl || '',

            // Page content
            title: page.title,
            slug: page.slug,
            content: page.content || '',
            header_image: page.headerImage || '',
            header_image_alt: page.headerImageAlt || page.title,

            // Breadcrumbs
            breadcrumbs: this.generateBreadcrumbs(page, data),

            // Sidebar
            sidebar: this.shouldShowSidebar(page),
            sidebar_menu: this.getSidebarMenu(page, data),
            contact_widget: true,

            // Page type specific data
            ...this.getPageTypeData(page, data)
        };

        const html = this.templates.renderPage(templateName, pageData);

        // Create directory structure for slug
        const outputPath = page.slug.includes('/')
            ? `${page.slug}/index.html`
            : `${page.slug}.html`;

        await this.writeFile(outputPath, html);
    }

    /**
     * Get appropriate template for page type
     * @param {Object} page
     * @returns {string}
     */
    getTemplateForPage(page) {
        const pageType = page.pageType || 'standard';

        // Check if we have a specific template
        if (this.templates.hasTemplate(pageType)) {
            return pageType;
        }

        // Map page types to templates
        const templateMap = {
            'standard': 'page',
            'video-gallery': 'video-gallery',
            'staff-listing': 'staff-listing',
            'news': 'page'
        };

        return templateMap[pageType] || 'page';
    }

    /**
     * Check if page should show sidebar
     * @param {Object} page
     * @returns {boolean}
     */
    shouldShowSidebar(page) {
        // Video galleries and staff listings typically don't have sidebars
        const noSidebarTypes = ['video-gallery', 'staff-listing'];
        return !noSidebarTypes.includes(page.pageType);
    }

    /**
     * Get sidebar menu items
     * @param {Object} page
     * @param {Object} data
     * @returns {Array}
     */
    getSidebarMenu(page, data) {
        if (!page.menuSection) return [];

        const sectionPages = data.pagesBySection[page.menuSection] || [];

        return sectionPages
            .filter(p => p.status === 'published' || this.config.isDev)
            .map(p => ({
                title: p.title,
                slug: p.slug,
                active: p.id === page.id
            }));
    }

    /**
     * Get page type specific data
     * @param {Object} page
     * @param {Object} data
     * @returns {Object}
     */
    getPageTypeData(page, data) {
        switch (page.pageType) {
            case 'video-gallery':
                return {
                    videos: data.videos || [],
                    video_categories: this.getVideoCategories(data.videos || [])
                };

            case 'staff-listing':
                return {
                    staff: data.staffProfiles || [],
                    departments: this.getDepartments(data.staffProfiles || []),
                    staff_data_json: JSON.stringify(data.staffProfiles || [])
                };

            default:
                return {};
        }
    }

    /**
     * Get unique video categories
     * @param {Array} videos
     * @returns {Array}
     */
    getVideoCategories(videos) {
        const categories = new Map();

        videos.forEach(video => {
            if (video.category && !categories.has(video.category)) {
                categories.set(video.category, {
                    slug: video.category.toLowerCase().replace(/\s+/g, '-'),
                    name: video.category
                });
            }
        });

        return Array.from(categories.values());
    }

    /**
     * Get unique staff departments
     * @param {Array} staff
     * @returns {Array}
     */
    getDepartments(staff) {
        const departments = new Map();

        staff.forEach(person => {
            if (person.department && !departments.has(person.department)) {
                departments.set(person.department, {
                    slug: person.department.toLowerCase().replace(/\s+/g, '-'),
                    name: person.department
                });
            }
        });

        return Array.from(departments.values());
    }

    /**
     * Generate special pages (404, etc.)
     * @param {Object} data
     */
    async generateSpecialPages(data) {
        // 404 page
        const notFoundData = {
            ...this.getCommonData(data),
            meta_title: 'Page Not Found',
            meta_description: 'The page you are looking for could not be found.',
            title: 'Page Not Found',
            content: `
                <div class="text-center py-12">
                    <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p class="text-xl text-gray-600 mb-8">Sorry, the page you're looking for doesn't exist.</p>
                    <a href="/" class="btn btn-primary">Return Home</a>
                </div>
            `
        };

        const html404 = this.templates.renderPage('page', notFoundData);
        await this.writeFile('404.html', html404);
    }

    /**
     * Write a file to the output directory
     * @param {string} relativePath
     * @param {string} content
     */
    async writeFile(relativePath, content) {
        const fullPath = path.join(this.config.outputDir, relativePath);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, content, 'utf8');

        if (this.config.verbose) {
            console.log(`   → ${relativePath}`);
        }
    }
}

module.exports = PageGenerator;
