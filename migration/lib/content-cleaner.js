/**
 * Content Cleaner for WordPress/Elementor HTML
 *
 * Cleans up WordPress and Elementor markup, converting it to
 * clean, semantic HTML suitable for our CMS.
 */

const { JSDOM } = require('jsdom');

class ContentCleaner {
    constructor(options = {}) {
        this.options = {
            // Base URL for resolving relative links
            baseUrl: options.baseUrl || '',
            // New base URL for migrated content
            newBaseUrl: options.newBaseUrl || '',
            // Keep specific classes (regex patterns)
            keepClasses: options.keepClasses || [],
            // Remove empty elements
            removeEmpty: options.removeEmpty !== false,
            // Convert to semantic HTML
            semanticize: options.semanticize !== false
        };

        // WordPress/Elementor classes to remove
        this.classesToRemove = [
            /^wp-/,
            /^elementor-/,
            /^e-/,
            /^attachment-/,
            /^size-/,
            /^align(left|right|center|none)/,
            /^gallery-/,
            /^widget-/,
            /^menu-/,
            /^post-/,
            /^page-/,
            /^entry-/,
            /^hentry/,
            /^clearfix/,
            /^has-/,
            /^is-/,
            /^block-/
        ];

        // Elements to completely remove
        this.elementsToRemove = [
            'script',
            'style',
            'noscript',
            'iframe[src*="facebook"]',
            'iframe[src*="twitter"]',
            '.elementor-screen-only',
            '.screen-reader-text',
            '[aria-hidden="true"]:empty'
        ];

        // Elementor widgets to convert
        this.widgetConverters = {
            'heading': this.convertHeadingWidget.bind(this),
            'text-editor': this.convertTextWidget.bind(this),
            'image': this.convertImageWidget.bind(this),
            'video': this.convertVideoWidget.bind(this),
            'button': this.convertButtonWidget.bind(this),
            'icon-list': this.convertIconListWidget.bind(this),
            'accordion': this.convertAccordionWidget.bind(this),
            'tabs': this.convertTabsWidget.bind(this),
            'image-gallery': this.convertGalleryWidget.bind(this),
            'image-box': this.convertImageBoxWidget.bind(this)
        };
    }

    /**
     * Clean HTML content
     * @param {string} html - Raw HTML content
     * @returns {string} - Cleaned HTML
     */
    clean(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Create DOM from HTML
        const dom = new JSDOM(`<div id="content">${html}</div>`);
        const doc = dom.window.document;
        const content = doc.getElementById('content');

        // Step 1: Remove unwanted elements
        this.removeUnwantedElements(content);

        // Step 2: Convert Elementor widgets
        this.convertElementorWidgets(content);

        // Step 3: Unwrap unnecessary wrapper divs
        this.unwrapDivs(content);

        // Step 4: Clean up classes and attributes
        this.cleanAttributes(content);

        // Step 5: Fix URLs
        this.fixUrls(content);

        // Step 6: Convert to semantic HTML
        if (this.options.semanticize) {
            this.semanticize(content);
        }

        // Step 7: Remove empty elements
        if (this.options.removeEmpty) {
            this.removeEmptyElements(content);
        }

        // Step 8: Clean up whitespace
        let result = content.innerHTML;
        result = this.cleanWhitespace(result);

        return result.trim();
    }

    /**
     * Remove unwanted elements from the DOM
     * @param {Element} container
     */
    removeUnwantedElements(container) {
        for (const selector of this.elementsToRemove) {
            const elements = container.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        }

        // Remove comments
        const walker = container.ownerDocument.createTreeWalker(
            container,
            8, // NodeFilter.SHOW_COMMENT
            null,
            false
        );

        const comments = [];
        while (walker.nextNode()) {
            comments.push(walker.currentNode);
        }
        comments.forEach(comment => comment.remove());
    }

    /**
     * Convert Elementor widget elements to clean HTML
     * @param {Element} container
     */
    convertElementorWidgets(container) {
        // Find all Elementor widgets
        const widgets = container.querySelectorAll('[data-widget_type]');

        for (const widget of widgets) {
            const widgetType = widget.getAttribute('data-widget_type');
            const type = widgetType ? widgetType.split('.')[0] : null;

            if (type && this.widgetConverters[type]) {
                const converted = this.widgetConverters[type](widget);
                if (converted) {
                    widget.replaceWith(converted);
                }
            }
        }

        // Also look for Elementor sections/columns and unwrap them
        const sections = container.querySelectorAll('.elementor-section, .elementor-column, .elementor-widget-wrap');
        sections.forEach(section => {
            this.unwrapElement(section);
        });
    }

    /**
     * Convert Elementor heading widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertHeadingWidget(widget) {
        const heading = widget.querySelector('.elementor-heading-title');
        if (heading) {
            const tag = heading.tagName.toLowerCase();
            const newHeading = widget.ownerDocument.createElement(tag);
            newHeading.textContent = heading.textContent;
            return newHeading;
        }
        return null;
    }

    /**
     * Convert Elementor text editor widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertTextWidget(widget) {
        const textContent = widget.querySelector('.elementor-text-editor');
        if (textContent) {
            const div = widget.ownerDocument.createElement('div');
            div.innerHTML = textContent.innerHTML;
            return div;
        }
        return null;
    }

    /**
     * Convert Elementor image widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertImageWidget(widget) {
        const img = widget.querySelector('img');
        if (img) {
            const figure = widget.ownerDocument.createElement('figure');
            const newImg = widget.ownerDocument.createElement('img');

            // Copy essential attributes
            newImg.src = img.getAttribute('data-src') || img.src;
            newImg.alt = img.alt || '';

            figure.appendChild(newImg);

            // Check for caption
            const caption = widget.querySelector('.widget-image-caption, figcaption');
            if (caption && caption.textContent.trim()) {
                const figcaption = widget.ownerDocument.createElement('figcaption');
                figcaption.textContent = caption.textContent.trim();
                figure.appendChild(figcaption);
            }

            return figure;
        }
        return null;
    }

    /**
     * Convert Elementor video widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertVideoWidget(widget) {
        const iframe = widget.querySelector('iframe');
        if (iframe) {
            const div = widget.ownerDocument.createElement('div');
            div.className = 'video-embed';

            const newIframe = widget.ownerDocument.createElement('iframe');
            newIframe.src = iframe.src;
            newIframe.setAttribute('allowfullscreen', '');
            newIframe.setAttribute('loading', 'lazy');

            div.appendChild(newIframe);
            return div;
        }
        return null;
    }

    /**
     * Convert Elementor button widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertButtonWidget(widget) {
        const link = widget.querySelector('a');
        if (link) {
            const newLink = widget.ownerDocument.createElement('a');
            newLink.href = link.href;
            newLink.className = 'btn btn-primary';

            const text = widget.querySelector('.elementor-button-text');
            newLink.textContent = text ? text.textContent : link.textContent;

            if (link.target) {
                newLink.target = link.target;
            }

            return newLink;
        }
        return null;
    }

    /**
     * Convert Elementor icon list widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertIconListWidget(widget) {
        const items = widget.querySelectorAll('.elementor-icon-list-item');
        if (items.length) {
            const ul = widget.ownerDocument.createElement('ul');

            items.forEach(item => {
                const li = widget.ownerDocument.createElement('li');
                const text = item.querySelector('.elementor-icon-list-text');
                const link = item.querySelector('a');

                if (link) {
                    const a = widget.ownerDocument.createElement('a');
                    a.href = link.href;
                    a.textContent = text ? text.textContent : link.textContent;
                    li.appendChild(a);
                } else if (text) {
                    li.textContent = text.textContent;
                }

                ul.appendChild(li);
            });

            return ul;
        }
        return null;
    }

    /**
     * Convert Elementor accordion widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertAccordionWidget(widget) {
        const items = widget.querySelectorAll('.elementor-accordion-item');
        if (items.length) {
            const details = widget.ownerDocument.createDocumentFragment();

            items.forEach(item => {
                const detailEl = widget.ownerDocument.createElement('details');
                const summary = widget.ownerDocument.createElement('summary');
                const content = widget.ownerDocument.createElement('div');

                const title = item.querySelector('.elementor-accordion-title');
                const contentEl = item.querySelector('.elementor-accordion-content');

                summary.textContent = title ? title.textContent : '';
                content.innerHTML = contentEl ? contentEl.innerHTML : '';

                detailEl.appendChild(summary);
                detailEl.appendChild(content);
                details.appendChild(detailEl);
            });

            return details;
        }
        return null;
    }

    /**
     * Convert Elementor tabs widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertTabsWidget(widget) {
        const tabs = widget.querySelectorAll('.elementor-tab-title');
        const contents = widget.querySelectorAll('.elementor-tab-content');

        if (tabs.length) {
            const container = widget.ownerDocument.createElement('div');
            container.className = 'tabs-content';

            tabs.forEach((tab, index) => {
                const section = widget.ownerDocument.createElement('section');
                const heading = widget.ownerDocument.createElement('h3');
                heading.textContent = tab.textContent;
                section.appendChild(heading);

                if (contents[index]) {
                    const content = widget.ownerDocument.createElement('div');
                    content.innerHTML = contents[index].innerHTML;
                    section.appendChild(content);
                }

                container.appendChild(section);
            });

            return container;
        }
        return null;
    }

    /**
     * Convert Elementor gallery widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertGalleryWidget(widget) {
        const images = widget.querySelectorAll('img');
        if (images.length) {
            const gallery = widget.ownerDocument.createElement('div');
            gallery.className = 'image-gallery';

            images.forEach(img => {
                const figure = widget.ownerDocument.createElement('figure');
                const newImg = widget.ownerDocument.createElement('img');

                newImg.src = img.getAttribute('data-src') || img.src;
                newImg.alt = img.alt || '';
                newImg.loading = 'lazy';

                figure.appendChild(newImg);
                gallery.appendChild(figure);
            });

            return gallery;
        }
        return null;
    }

    /**
     * Convert Elementor image box widget
     * @param {Element} widget
     * @returns {Element}
     */
    convertImageBoxWidget(widget) {
        const article = widget.ownerDocument.createElement('article');
        article.className = 'image-box';

        const img = widget.querySelector('img');
        if (img) {
            const figure = widget.ownerDocument.createElement('figure');
            const newImg = widget.ownerDocument.createElement('img');
            newImg.src = img.getAttribute('data-src') || img.src;
            newImg.alt = img.alt || '';
            figure.appendChild(newImg);
            article.appendChild(figure);
        }

        const title = widget.querySelector('.elementor-image-box-title');
        if (title) {
            const h3 = widget.ownerDocument.createElement('h3');
            h3.textContent = title.textContent;
            article.appendChild(h3);
        }

        const description = widget.querySelector('.elementor-image-box-description');
        if (description) {
            const p = widget.ownerDocument.createElement('p');
            p.textContent = description.textContent;
            article.appendChild(p);
        }

        return article;
    }

    /**
     * Unwrap unnecessary wrapper divs
     * @param {Element} container
     */
    unwrapDivs(container) {
        // Divs that only contain a single block element
        const divs = container.querySelectorAll('div');

        for (const div of divs) {
            // Skip if div has meaningful classes we want to keep
            if (this.hasKeeperClass(div)) continue;

            // If div has only one child that's a block element, unwrap
            if (div.children.length === 1) {
                const child = div.children[0];
                const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'figure', 'article', 'section'];

                if (blockElements.includes(child.tagName.toLowerCase())) {
                    this.unwrapElement(div);
                }
            }
        }
    }

    /**
     * Unwrap an element (replace with its children)
     * @param {Element} element
     */
    unwrapElement(element) {
        const parent = element.parentNode;
        if (!parent) return;

        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        element.remove();
    }

    /**
     * Check if element has a class we want to keep
     * @param {Element} element
     * @returns {boolean}
     */
    hasKeeperClass(element) {
        const classes = Array.from(element.classList);
        return classes.some(cls =>
            this.options.keepClasses.some(pattern =>
                pattern instanceof RegExp ? pattern.test(cls) : cls === pattern
            )
        );
    }

    /**
     * Clean up classes and attributes
     * @param {Element} container
     */
    cleanAttributes(container) {
        const allElements = container.querySelectorAll('*');

        for (const element of allElements) {
            // Clean classes
            if (element.classList.length) {
                const classesToKeep = [];

                for (const cls of element.classList) {
                    const shouldRemove = this.classesToRemove.some(pattern =>
                        pattern instanceof RegExp ? pattern.test(cls) : cls === pattern
                    );

                    const shouldKeep = this.options.keepClasses.some(pattern =>
                        pattern instanceof RegExp ? pattern.test(cls) : cls === pattern
                    );

                    if (!shouldRemove || shouldKeep) {
                        classesToKeep.push(cls);
                    }
                }

                element.className = classesToKeep.join(' ');
                if (!element.className) {
                    element.removeAttribute('class');
                }
            }

            // Remove data attributes (except data-src for lazy loading)
            const attrs = Array.from(element.attributes);
            for (const attr of attrs) {
                if (attr.name.startsWith('data-') && attr.name !== 'data-src') {
                    element.removeAttribute(attr.name);
                }
            }

            // Remove inline styles (unless explicitly kept)
            element.removeAttribute('style');

            // Remove IDs that look auto-generated
            const id = element.id;
            if (id && /^(elementor-|wp-|post-|page-|widget-|menu-)/.test(id)) {
                element.removeAttribute('id');
            }
        }
    }

    /**
     * Fix URLs to use new base URL
     * @param {Element} container
     */
    fixUrls(container) {
        if (!this.options.baseUrl || !this.options.newBaseUrl) return;

        // Fix links
        const links = container.querySelectorAll('a[href]');
        for (const link of links) {
            link.href = this.convertUrl(link.href);
        }

        // Fix images
        const images = container.querySelectorAll('img[src]');
        for (const img of images) {
            img.src = this.convertUrl(img.src);
            if (img.getAttribute('data-src')) {
                img.setAttribute('data-src', this.convertUrl(img.getAttribute('data-src')));
            }
        }
    }

    /**
     * Convert URL from old to new base
     * @param {string} url
     * @returns {string}
     */
    convertUrl(url) {
        if (!url) return url;

        // Only convert URLs that match the old base
        if (url.startsWith(this.options.baseUrl)) {
            return url.replace(this.options.baseUrl, this.options.newBaseUrl);
        }

        // Convert relative URLs
        if (url.startsWith('/') && !url.startsWith('//')) {
            return this.options.newBaseUrl + url;
        }

        return url;
    }

    /**
     * Convert to semantic HTML elements
     * @param {Element} container
     */
    semanticize(container) {
        // Convert <div class="btn..."> to <button> or <a>
        // (Already handled by widget converters)

        // Ensure images have alt text
        const images = container.querySelectorAll('img');
        for (const img of images) {
            if (!img.alt) {
                img.alt = '';
            }
        }

        // Add loading="lazy" to images
        for (const img of images) {
            img.loading = 'lazy';
        }
    }

    /**
     * Remove empty elements
     * @param {Element} container
     */
    removeEmptyElements(container) {
        const emptyTags = ['p', 'div', 'span', 'li', 'ul', 'ol', 'section', 'article'];

        let removed;
        do {
            removed = false;
            for (const tag of emptyTags) {
                const elements = container.querySelectorAll(tag);
                for (const el of elements) {
                    if (!el.textContent.trim() && !el.querySelector('img, iframe, video, audio, canvas, svg')) {
                        el.remove();
                        removed = true;
                    }
                }
            }
        } while (removed);
    }

    /**
     * Clean up excessive whitespace
     * @param {string} html
     * @returns {string}
     */
    cleanWhitespace(html) {
        return html
            // Remove excessive newlines
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Remove spaces between tags
            .replace(/>\s+</g, '>\n<')
            // Remove leading/trailing whitespace on lines
            .replace(/^\s+|\s+$/gm, '')
            // Remove empty lines at start/end
            .replace(/^\n+|\n+$/g, '');
    }
}

module.exports = ContentCleaner;
