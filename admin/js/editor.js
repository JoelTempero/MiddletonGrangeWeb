/**
 * Middleton Grange CMS - Page Editor Module
 *
 * Handles page editing with TipTap rich text editor.
 */

const PageEditor = {
    // State
    editor: null,
    pageId: null,
    pageData: null,
    isDirty: false,
    isNew: true,
    menuSections: [],
    autoSaveTimer: null,
    headerImageUrl: null,
    headerImageAlt: null,

    /**
     * Initialize the page editor
     */
    async init() {
        // Get page ID from URL
        const params = new URLSearchParams(window.location.search);
        this.pageId = params.get('id');
        this.isNew = !this.pageId;

        // Load menu sections
        await this.loadMenuSections();

        // Initialize TipTap editor
        this.initEditor();

        // Set up event listeners
        this.initEventListeners();

        // Load page data if editing existing page
        if (!this.isNew) {
            await this.loadPage();
        } else {
            this.initNewPage();
        }

        // Set up auto-save
        this.initAutoSave();

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    /**
     * Load menu sections for dropdown
     */
    async loadMenuSections() {
        try {
            const snapshot = await db.collection('menuSections')
                .orderBy('order', 'asc')
                .get();

            this.menuSections = [];
            const select = document.getElementById('page-menu-section');

            snapshot.forEach(doc => {
                const section = { id: doc.id, ...doc.data() };
                this.menuSections.push(section);

                if (select) {
                    const option = document.createElement('option');
                    option.value = section.id;
                    option.textContent = section.title;
                    select.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading menu sections:', error);
        }
    },

    /**
     * Initialize TipTap editor
     */
    initEditor() {
        const editorContainer = document.getElementById('editor');
        if (!editorContainer) return;

        // Check if TipTap is available
        if (typeof tiptap === 'undefined' || !tiptap.Editor) {
            console.warn('TipTap not loaded, using fallback textarea');
            this.useFallbackEditor();
            return;
        }

        try {
            // Create TipTap editor instance
            this.editor = new tiptap.Editor({
                element: editorContainer,
                extensions: [
                    tiptap.StarterKit,
                    tiptap.Link.configure({
                        openOnClick: false,
                        HTMLAttributes: {
                            class: 'text-blue-600 underline',
                        },
                    }),
                    tiptap.Image,
                    tiptap.Placeholder.configure({
                        placeholder: 'Start writing your page content...',
                    }),
                    tiptap.Underline,
                    tiptap.TextAlign.configure({
                        types: ['heading', 'paragraph'],
                    }),
                ],
                content: '',
                onUpdate: ({ editor }) => {
                    this.markDirty();
                },
            });

            // Initialize toolbar
            this.initToolbar();

        } catch (error) {
            console.error('Error initializing TipTap:', error);
            this.useFallbackEditor();
        }
    },

    /**
     * Use fallback textarea if TipTap fails to load
     */
    useFallbackEditor() {
        const editorContainer = document.getElementById('editor');
        const toolbar = document.getElementById('editor-toolbar');

        if (toolbar) toolbar.style.display = 'none';

        if (editorContainer) {
            editorContainer.innerHTML = `
                <textarea
                    id="content-fallback"
                    class="w-full h-96 p-4 border-0 focus:ring-0 resize-none font-mono text-sm"
                    placeholder="Enter your page content (HTML supported)..."
                ></textarea>
            `;

            const textarea = document.getElementById('content-fallback');
            if (textarea) {
                textarea.addEventListener('input', () => this.markDirty());
            }
        }
    },

    /**
     * Initialize toolbar buttons
     */
    initToolbar() {
        if (!this.editor) return;

        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        // Bold
        this.addToolbarButton('bold', 'bold', () => {
            this.editor.chain().focus().toggleBold().run();
        });

        // Italic
        this.addToolbarButton('italic', 'italic', () => {
            this.editor.chain().focus().toggleItalic().run();
        });

        // Underline
        this.addToolbarButton('underline', 'underline', () => {
            this.editor.chain().focus().toggleUnderline().run();
        });

        // Strikethrough
        this.addToolbarButton('strike', 'strikethrough', () => {
            this.editor.chain().focus().toggleStrike().run();
        });

        // Add divider
        this.addToolbarDivider();

        // Headings dropdown
        this.addHeadingDropdown();

        // Add divider
        this.addToolbarDivider();

        // Bullet list
        this.addToolbarButton('bulletList', 'list', () => {
            this.editor.chain().focus().toggleBulletList().run();
        });

        // Ordered list
        this.addToolbarButton('orderedList', 'list-ordered', () => {
            this.editor.chain().focus().toggleOrderedList().run();
        });

        // Add divider
        this.addToolbarDivider();

        // Blockquote
        this.addToolbarButton('blockquote', 'message-square', () => {
            this.editor.chain().focus().toggleBlockquote().run();
        });

        // Horizontal rule
        this.addToolbarButton('horizontalRule', 'minus', () => {
            this.editor.chain().focus().setHorizontalRule().run();
        });

        // Add divider
        this.addToolbarDivider();

        // Link
        this.addToolbarButton('link', 'link', () => {
            this.showLinkModal();
        });

        // Image
        this.addToolbarButton('image', 'image', () => {
            this.showImagePicker();
        });

        // Add divider
        this.addToolbarDivider();

        // Undo
        this.addToolbarButton('undo', 'rotate-ccw', () => {
            this.editor.chain().focus().undo().run();
        });

        // Redo
        this.addToolbarButton('redo', 'rotate-cw', () => {
            this.editor.chain().focus().redo().run();
        });

        // Re-initialize feather icons
        feather.replace();

        // Update toolbar state on selection change
        this.editor.on('selectionUpdate', () => this.updateToolbarState());
        this.editor.on('update', () => this.updateToolbarState());
    },

    /**
     * Add a toolbar button
     */
    addToolbarButton(name, icon, onClick) {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toolbar-btn';
        button.dataset.command = name;
        button.title = name.charAt(0).toUpperCase() + name.slice(1);
        button.innerHTML = `<i data-feather="${icon}" class="w-4 h-4"></i>`;
        button.addEventListener('click', onClick);

        toolbar.appendChild(button);
    },

    /**
     * Add toolbar divider
     */
    addToolbarDivider() {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        const divider = document.createElement('div');
        divider.className = 'toolbar-divider';
        toolbar.appendChild(divider);
    },

    /**
     * Add headings dropdown
     */
    addHeadingDropdown() {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'toolbar-dropdown relative';
        dropdown.innerHTML = `
            <button type="button" class="toolbar-btn flex items-center" data-command="heading">
                <span class="text-xs mr-1">H</span>
                <i data-feather="chevron-down" class="w-3 h-3"></i>
            </button>
            <div class="toolbar-dropdown-content">
                <button type="button" class="toolbar-dropdown-item" data-level="1">Heading 1</button>
                <button type="button" class="toolbar-dropdown-item" data-level="2">Heading 2</button>
                <button type="button" class="toolbar-dropdown-item" data-level="3">Heading 3</button>
                <button type="button" class="toolbar-dropdown-item" data-level="4">Heading 4</button>
                <button type="button" class="toolbar-dropdown-item" data-level="0">Paragraph</button>
            </div>
        `;

        // Toggle dropdown
        const btn = dropdown.querySelector('.toolbar-btn');
        btn.addEventListener('click', () => {
            dropdown.classList.toggle('open');
        });

        // Handle heading selection
        dropdown.querySelectorAll('.toolbar-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const level = parseInt(item.dataset.level);
                if (level === 0) {
                    this.editor.chain().focus().setParagraph().run();
                } else {
                    this.editor.chain().focus().toggleHeading({ level }).run();
                }
                dropdown.classList.remove('open');
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        toolbar.appendChild(dropdown);
    },

    /**
     * Update toolbar button states
     */
    updateToolbarState() {
        if (!this.editor) return;

        const commands = ['bold', 'italic', 'underline', 'strike', 'bulletList', 'orderedList', 'blockquote'];

        commands.forEach(cmd => {
            const btn = document.querySelector(`[data-command="${cmd}"]`);
            if (btn) {
                if (this.editor.isActive(cmd)) {
                    btn.classList.add('is-active');
                } else {
                    btn.classList.remove('is-active');
                }
            }
        });

        // Link button
        const linkBtn = document.querySelector('[data-command="link"]');
        if (linkBtn) {
            if (this.editor.isActive('link')) {
                linkBtn.classList.add('is-active');
            } else {
                linkBtn.classList.remove('is-active');
            }
        }
    },

    /**
     * Show link input modal
     */
    showLinkModal() {
        const existingUrl = this.editor.getAttributes('link').href || '';

        const url = prompt('Enter URL:', existingUrl);
        if (url === null) return; // Cancelled

        if (url === '') {
            // Remove link
            this.editor.chain().focus().unsetLink().run();
        } else {
            // Set link
            this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    },

    /**
     * Show image picker modal
     */
    showImagePicker() {
        // Use ImagePicker from media.js if available
        if (typeof ImagePicker !== 'undefined') {
            ImagePicker.open((image) => {
                if (image && image.url) {
                    this.editor.chain().focus().setImage({
                        src: image.url,
                        alt: image.alt || ''
                    }).run();
                }
            });
        } else {
            // Fallback to prompt
            const url = prompt('Enter image URL:');
            if (url) {
                this.editor.chain().focus().setImage({ src: url }).run();
            }
        }
    },

    /**
     * Initialize header image picker
     */
    initHeaderImagePicker() {
        const container = document.getElementById('header-image-container');
        if (!container) return;

        container.addEventListener('click', () => {
            if (typeof ImagePicker !== 'undefined') {
                ImagePicker.open((image) => {
                    if (image && image.url) {
                        this.setHeaderImage(image.url, image.alt);
                    }
                });
            } else {
                const url = prompt('Enter header image URL:');
                if (url) {
                    this.setHeaderImage(url, '');
                }
            }
        });
    },

    /**
     * Set header image
     * @param {string} url
     * @param {string} alt
     */
    setHeaderImage(url, alt = '') {
        const container = document.getElementById('header-image-container');
        const placeholder = document.getElementById('header-image-placeholder');

        if (container) {
            container.innerHTML = `
                <div class="relative">
                    <img src="${url}" alt="${Utils.escapeHtml(alt)}" class="w-full h-48 object-cover rounded-lg">
                    <button type="button" id="remove-header-image" class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            feather.replace();

            // Store the URL
            this.headerImageUrl = url;
            this.headerImageAlt = alt;
            this.markDirty();

            // Bind remove button
            document.getElementById('remove-header-image')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeHeaderImage();
            });
        }
    },

    /**
     * Remove header image
     */
    removeHeaderImage() {
        const container = document.getElementById('header-image-container');
        if (container) {
            container.innerHTML = `
                <div id="header-image-placeholder">
                    <i data-feather="image" class="w-12 h-12 mx-auto text-gray-400 mb-2"></i>
                    <p class="text-gray-500">Click to select a header image</p>
                </div>
            `;
            feather.replace();

            this.headerImageUrl = null;
            this.headerImageAlt = null;
            this.markDirty();
        }
    },

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Header image picker
        this.initHeaderImagePicker();

        // Title input - auto-generate slug
        const titleInput = document.getElementById('page-title');
        const slugInput = document.getElementById('page-slug');

        if (titleInput && slugInput) {
            titleInput.addEventListener('input', () => {
                this.markDirty();
                // Only auto-generate slug for new pages or if slug is empty
                if (this.isNew || !slugInput.value) {
                    slugInput.value = Utils.slugify(titleInput.value);
                }
            });

            slugInput.addEventListener('input', () => this.markDirty());
        }

        // Other form fields
        ['page-menu-section', 'page-type', 'page-meta-title', 'page-meta-description'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.markDirty());
                el.addEventListener('input', () => this.markDirty());
            }
        });

        // Page type change
        const pageTypeSelect = document.getElementById('page-type');
        if (pageTypeSelect) {
            pageTypeSelect.addEventListener('change', () => {
                this.handlePageTypeChange(pageTypeSelect.value);
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-page');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePage('draft'));
        }

        // Publish button
        const publishBtn = document.getElementById('publish-page');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.savePage('published'));
        }

        // Preview button
        const previewBtn = document.getElementById('preview-page');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewPage());
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-page');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deletePage());
        }
    },

    /**
     * Initialize new page with defaults
     */
    initNewPage() {
        // Update page title
        document.title = 'New Page - Middleton Grange CMS';
        const pageTitle = document.getElementById('editor-page-title');
        if (pageTitle) pageTitle.textContent = 'New Page';

        // Hide delete button for new pages
        const deleteBtn = document.getElementById('delete-page');
        if (deleteBtn) deleteBtn.classList.add('hidden');

        // Set default page type
        const pageTypeSelect = document.getElementById('page-type');
        if (pageTypeSelect) pageTypeSelect.value = 'standard';
    },

    /**
     * Load existing page data
     */
    async loadPage() {
        try {
            const doc = await db.collection('pages').doc(this.pageId).get();

            if (!doc.exists) {
                Toast.error('Page not found');
                window.location.href = 'pages.html';
                return;
            }

            this.pageData = { id: doc.id, ...doc.data() };

            // Populate form
            this.populateForm(this.pageData);

            // Update page title
            document.title = `${this.pageData.title || 'Edit Page'} - Middleton Grange CMS`;
            const pageTitle = document.getElementById('editor-page-title');
            if (pageTitle) pageTitle.textContent = `Edit: ${this.pageData.title || 'Untitled'}`;

            // Show delete button
            const deleteBtn = document.getElementById('delete-page');
            if (deleteBtn) deleteBtn.classList.remove('hidden');

            // Update publish button based on current status
            this.updatePublishButton();

        } catch (error) {
            console.error('Error loading page:', error);
            Toast.error('Failed to load page');
        }
    },

    /**
     * Populate form with page data
     */
    populateForm(data) {
        // Basic fields
        const fields = {
            'page-title': data.title || '',
            'page-slug': data.slug || '',
            'page-menu-section': data.menuSection || '',
            'page-type': data.pageType || 'standard',
            'page-meta-title': data.metaTitle || '',
            'page-meta-description': data.metaDescription || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        });

        // Editor content
        if (this.editor) {
            this.editor.commands.setContent(data.content || '');
        } else {
            const fallback = document.getElementById('content-fallback');
            if (fallback) fallback.value = data.content || '';
        }

        // Handle page type
        this.handlePageTypeChange(data.pageType || 'standard');

        // Load header image if exists
        if (data.headerImage) {
            this.setHeaderImage(data.headerImage, data.headerImageAlt || '');
        }

        // Reset dirty state after populating
        this.isDirty = false;
    },

    /**
     * Handle page type change
     */
    handlePageTypeChange(pageType) {
        // Show/hide type-specific fields
        const standardFields = document.getElementById('standard-fields');
        const videoFields = document.getElementById('video-gallery-fields');
        const staffFields = document.getElementById('staff-listing-fields');

        // Hide all type-specific fields first
        [standardFields, videoFields, staffFields].forEach(el => {
            if (el) el.classList.add('hidden');
        });

        // Show relevant fields
        switch (pageType) {
            case 'video-gallery':
                if (videoFields) videoFields.classList.remove('hidden');
                break;
            case 'staff-listing':
                if (staffFields) staffFields.classList.remove('hidden');
                break;
            default:
                if (standardFields) standardFields.classList.remove('hidden');
        }
    },

    /**
     * Update publish button text based on status
     */
    updatePublishButton() {
        const publishBtn = document.getElementById('publish-page');
        if (publishBtn && this.pageData) {
            if (this.pageData.status === 'published') {
                publishBtn.innerHTML = '<i data-feather="check-circle" class="w-4 h-4 mr-2"></i> Update';
            } else {
                publishBtn.innerHTML = '<i data-feather="globe" class="w-4 h-4 mr-2"></i> Publish';
            }
            feather.replace();
        }
    },

    /**
     * Mark page as dirty (unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
        const saveBtn = document.getElementById('save-page');
        if (saveBtn && !saveBtn.textContent.includes('*')) {
            const btnText = saveBtn.querySelector('.btn-text') || saveBtn;
            if (btnText.textContent) {
                btnText.textContent = btnText.textContent.replace('Save', 'Save *');
            }
        }
    },

    /**
     * Initialize auto-save
     */
    initAutoSave() {
        // Auto-save every 60 seconds if dirty
        setInterval(() => {
            if (this.isDirty && !this.isNew) {
                this.savePage('draft', true); // Silent save
            }
        }, 60000);
    },

    /**
     * Save page
     * @param {string} status - 'draft' or 'published'
     * @param {boolean} silent - If true, don't show toast
     */
    async savePage(status = 'draft', silent = false) {
        const saveBtn = document.getElementById('save-page');
        const publishBtn = document.getElementById('publish-page');

        // Get form data
        const formData = this.getFormData();
        formData.status = status;

        // Validate
        if (!formData.title) {
            Toast.error('Please enter a page title');
            document.getElementById('page-title')?.focus();
            return;
        }

        if (!formData.slug) {
            formData.slug = Utils.slugify(formData.title);
        }

        // Show loading state
        if (saveBtn) saveBtn.disabled = true;
        if (publishBtn) publishBtn.disabled = true;

        try {
            if (this.isNew) {
                // Create new page
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

                const docRef = await db.collection('pages').add(formData);
                this.pageId = docRef.id;
                this.isNew = false;

                // Update URL without reload
                window.history.replaceState({}, '', `page-editor.html?id=${this.pageId}`);

                // Log activity
                await Dashboard?.logActivity('create', `created "${formData.title}"`);

            } else {
                // Update existing page
                formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

                await db.collection('pages').doc(this.pageId).update(formData);

                // Log activity
                const action = status === 'published' ? 'publish' : 'update';
                await Dashboard?.logActivity(action, `${action === 'publish' ? 'published' : 'updated'} "${formData.title}"`);
            }

            this.isDirty = false;
            this.pageData = { id: this.pageId, ...formData };

            // Update UI
            const saveBtnText = saveBtn?.querySelector('.btn-text') || saveBtn;
            if (saveBtnText) saveBtnText.textContent = 'Save Draft';

            this.updatePublishButton();

            if (!silent) {
                Toast.success(status === 'published' ? 'Page published!' : 'Page saved');
            }

        } catch (error) {
            console.error('Error saving page:', error);
            Toast.error('Failed to save page. Please try again.');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
            if (publishBtn) publishBtn.disabled = false;
        }
    },

    /**
     * Get form data
     */
    getFormData() {
        const data = {
            title: document.getElementById('page-title')?.value?.trim() || '',
            slug: document.getElementById('page-slug')?.value?.trim() || '',
            menuSection: document.getElementById('page-menu-section')?.value || null,
            pageType: document.getElementById('page-type')?.value || 'standard',
            metaTitle: document.getElementById('page-meta-title')?.value?.trim() || '',
            metaDescription: document.getElementById('page-meta-description')?.value?.trim() || '',
            content: this.editor ? this.editor.getHTML() : (document.getElementById('content-fallback')?.value || ''),
            headerImage: this.headerImageUrl || null,
            headerImageAlt: this.headerImageAlt || ''
        };

        return data;
    },

    /**
     * Preview page
     */
    previewPage() {
        if (this.isDirty) {
            Toast.warning('Please save changes before previewing');
            return;
        }

        // Open preview in new tab
        // Note: This would need the actual site URL
        const slug = document.getElementById('page-slug')?.value || '';
        const previewUrl = `/${slug}`;

        Toast.success('Preview functionality coming soon');
        // window.open(previewUrl, '_blank');
    },

    /**
     * Delete page
     */
    async deletePage() {
        if (!this.pageId) return;

        // Check admin permission
        if (!Auth.isAdmin()) {
            Toast.error('Only administrators can delete pages.');
            return;
        }

        if (!confirm('Are you sure you want to delete this page? This cannot be undone.')) {
            return;
        }

        try {
            await db.collection('pages').doc(this.pageId).delete();

            // Log activity
            await Dashboard?.logActivity('delete', `deleted "${this.pageData?.title || 'a page'}"`);

            Toast.success('Page deleted');
            window.location.href = 'pages.html';

        } catch (error) {
            console.error('Error deleting page:', error);
            Toast.error('Failed to delete page');
        }
    }
};


// ============================================
// INITIALIZATION
// ============================================

// Initialize editor when DOM is ready and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the page editor
    if (!document.getElementById('editor')) return;

    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user) => {
            if (user) {
                PageEditor.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                PageEditor.init();
            }
        });
    }
});


// Export for global use
window.PageEditor = PageEditor;
