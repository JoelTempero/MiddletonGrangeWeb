/**
 * Middleton Grange CMS - Menu Manager Module
 *
 * Handles menu section management with drag-and-drop reordering.
 */

const MenuManager = {
    // State
    sections: [],
    pages: [],
    expandedSections: new Set(),
    editingSectionId: null,
    deletingSectionId: null,
    sectionSortable: null,
    pageSortables: {},

    /**
     * Initialize menu manager
     */
    async init() {
        await this.loadData();
        this.bindEvents();
        this.render();
    },

    /**
     * Load menu sections and pages
     */
    async loadData() {
        try {
            // Load sections and pages in parallel
            const [sectionsSnapshot, pagesSnapshot] = await Promise.all([
                db.collection('menuSections').orderBy('order', 'asc').get(),
                db.collection('pages').get()
            ]);

            this.sections = [];
            sectionsSnapshot.forEach(doc => {
                this.sections.push({ id: doc.id, ...doc.data() });
            });

            this.pages = [];
            pagesSnapshot.forEach(doc => {
                this.pages.push({ id: doc.id, ...doc.data() });
            });

        } catch (error) {
            console.error('Error loading menu data:', error);
            Toast.error('Failed to load menu data');
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add section button
        const addBtn = document.getElementById('add-section-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showSectionModal());
        }

        // Section form
        const form = document.getElementById('section-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSection();
            });
        }

        // Cancel section modal
        const cancelBtn = document.getElementById('cancel-section');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideSectionModal());
        }

        // Auto-generate section ID from title
        const titleInput = document.getElementById('section-title');
        const idInput = document.getElementById('section-id');
        if (titleInput && idInput) {
            titleInput.addEventListener('input', () => {
                // Only auto-generate if creating new section
                if (!this.editingSectionId) {
                    idInput.value = Utils.slugify(titleInput.value);
                }
            });
        }

        // Delete confirmation
        const cancelDeleteBtn = document.getElementById('cancel-delete-section');
        const confirmDeleteBtn = document.getElementById('confirm-delete-section');

        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.hideDeleteModal());
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDeleteSection());
        }

        // Click outside modals to close
        document.getElementById('section-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'section-modal') this.hideSectionModal();
        });

        document.getElementById('delete-section-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'delete-section-modal') this.hideDeleteModal();
        });

        // ESC to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSectionModal();
                this.hideDeleteModal();
            }
        });
    },

    /**
     * Render all sections
     */
    render() {
        const container = document.getElementById('menu-sections');
        if (!container) return;

        if (this.sections.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow p-8 text-center">
                    <i data-feather="layers" class="w-12 h-12 mx-auto text-gray-400 mb-3"></i>
                    <h3 class="text-lg font-medium text-gray-800 mb-2">No Menu Sections</h3>
                    <p class="text-gray-500 mb-4">Create your first menu section to organize your site navigation.</p>
                    <button onclick="MenuManager.showSectionModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i data-feather="plus" class="w-4 h-4 inline-block mr-1"></i>
                        Create Section
                    </button>
                </div>
            `;
            feather.replace();
            return;
        }

        let html = '';
        this.sections.forEach((section, index) => {
            const isExpanded = this.expandedSections.has(section.id);
            const sectionPages = this.getPagesBySection(section.id);
            const visibilityClass = section.visible !== false ? 'text-green-600' : 'text-gray-400';
            const visibilityIcon = section.visible !== false ? 'eye' : 'eye-off';

            html += `
                <div class="menu-section bg-white rounded-lg shadow" data-section-id="${section.id}">
                    <!-- Section Header -->
                    <div class="section-header flex items-center px-4 py-3 border-b border-gray-100 cursor-move">
                        <div class="drag-handle mr-3 text-gray-400 hover:text-gray-600">
                            <i data-feather="grip-vertical" class="w-5 h-5"></i>
                        </div>

                        <button class="expand-toggle mr-3 text-gray-400 hover:text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}"
                                onclick="MenuManager.toggleSection('${section.id}')">
                            <i data-feather="chevron-right" class="w-5 h-5"></i>
                        </button>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-gray-800">${Utils.escapeHtml(section.title)}</h3>
                                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">${section.id}</span>
                                <span class="${visibilityClass}">
                                    <i data-feather="${visibilityIcon}" class="w-4 h-4"></i>
                                </span>
                            </div>
                            ${section.description ? `<p class="text-sm text-gray-500 truncate">${Utils.escapeHtml(section.description)}</p>` : ''}
                        </div>

                        <div class="flex items-center gap-2 ml-4">
                            <span class="text-sm text-gray-500">${sectionPages.length} pages</span>

                            <button onclick="MenuManager.editSection('${section.id}')"
                                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Section">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </button>

                            <button onclick="MenuManager.toggleVisibility('${section.id}')"
                                    class="p-2 ${visibilityClass} hover:bg-gray-100 rounded-lg transition-colors"
                                    title="${section.visible !== false ? 'Hide from navigation' : 'Show in navigation'}">
                                <i data-feather="${visibilityIcon}" class="w-4 h-4"></i>
                            </button>

                            <button onclick="MenuManager.showDeleteModal('${section.id}')"
                                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Section">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Section Pages (expandable) -->
                    <div class="section-pages ${isExpanded ? '' : 'hidden'}" data-section-id="${section.id}">
                        ${this.renderSectionPages(section.id, sectionPages)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        feather.replace();

        // Initialize drag-and-drop for sections
        this.initSectionSortable();

        // Initialize drag-and-drop for pages in expanded sections
        this.expandedSections.forEach(sectionId => {
            this.initPageSortable(sectionId);
        });
    },

    /**
     * Render pages within a section
     * @param {string} sectionId
     * @param {Array} pages
     * @returns {string}
     */
    renderSectionPages(sectionId, pages) {
        if (pages.length === 0) {
            return `
                <div class="p-4 text-center text-gray-500">
                    <p class="text-sm">No pages in this section</p>
                    <a href="page-editor.html" class="text-blue-600 hover:underline text-sm">Create a page</a>
                </div>
            `;
        }

        // Sort pages by menuOrder
        const sortedPages = [...pages].sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

        let html = '<div class="page-list divide-y divide-gray-100">';

        sortedPages.forEach(page => {
            const statusClass = page.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800';

            html += `
                <div class="page-item flex items-center px-4 py-3 hover:bg-gray-50" data-page-id="${page.id}">
                    <div class="page-drag-handle mr-3 text-gray-400 hover:text-gray-600 cursor-move">
                        <i data-feather="grip-vertical" class="w-4 h-4"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-800">${Utils.escapeHtml(page.title || 'Untitled')}</span>
                            <span class="text-xs ${statusClass} px-2 py-0.5 rounded-full capitalize">${page.status || 'draft'}</span>
                        </div>
                        <p class="text-sm text-gray-500">/${page.slug || ''}</p>
                    </div>

                    <div class="flex items-center gap-2 ml-4">
                        ${page.parentPage ? '<i data-feather="corner-down-right" class="w-4 h-4 text-gray-400" title="Sub-page"></i>' : ''}

                        <a href="page-editor.html?id=${page.id}"
                           class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                           title="Edit Page">
                            <i data-feather="edit-2" class="w-4 h-4"></i>
                        </a>

                        <button onclick="MenuManager.removePageFromSection('${page.id}')"
                                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from section">
                            <i data-feather="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Add page button
        html += `
            <div class="p-3 bg-gray-50 border-t border-gray-100">
                <button onclick="MenuManager.showAddPageModal('${sectionId}')"
                        class="w-full py-2 text-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors">
                    <i data-feather="plus" class="w-4 h-4 inline-block mr-1"></i>
                    Add Page to Section
                </button>
            </div>
        `;

        return html;
    },

    /**
     * Get pages belonging to a section
     * @param {string} sectionId
     * @returns {Array}
     */
    getPagesBySection(sectionId) {
        return this.pages.filter(page => page.menuSection === sectionId);
    },

    /**
     * Initialize SortableJS for sections
     */
    initSectionSortable() {
        const container = document.getElementById('menu-sections');
        if (!container) return;

        // Destroy existing sortable
        if (this.sectionSortable) {
            this.sectionSortable.destroy();
        }

        this.sectionSortable = new Sortable(container, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'bg-blue-50',
            dragClass: 'shadow-lg',
            onEnd: (evt) => {
                this.handleSectionReorder(evt.oldIndex, evt.newIndex);
            }
        });
    },

    /**
     * Initialize SortableJS for pages within a section
     * @param {string} sectionId
     */
    initPageSortable(sectionId) {
        const container = document.querySelector(`.section-pages[data-section-id="${sectionId}"] .page-list`);
        if (!container) return;

        // Destroy existing sortable for this section
        if (this.pageSortables[sectionId]) {
            this.pageSortables[sectionId].destroy();
        }

        this.pageSortables[sectionId] = new Sortable(container, {
            animation: 150,
            handle: '.page-drag-handle',
            ghostClass: 'bg-blue-50',
            dragClass: 'shadow-lg',
            onEnd: (evt) => {
                this.handlePageReorder(sectionId, evt.oldIndex, evt.newIndex);
            }
        });
    },

    /**
     * Handle section reordering
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    async handleSectionReorder(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;

        // Reorder array
        const [removed] = this.sections.splice(oldIndex, 1);
        this.sections.splice(newIndex, 0, removed);

        // Update order in Firestore
        try {
            const batch = db.batch();

            this.sections.forEach((section, index) => {
                const ref = db.collection('menuSections').doc(section.id);
                batch.update(ref, { order: index });
                section.order = index;
            });

            await batch.commit();
            Toast.success('Menu order updated');

            // Log activity
            await this.logActivity('update', 'reordered menu sections');

        } catch (error) {
            console.error('Error reordering sections:', error);
            Toast.error('Failed to save order');
            // Reload to restore correct state
            await this.loadData();
            this.render();
        }
    },

    /**
     * Handle page reordering within a section
     * @param {string} sectionId
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    async handlePageReorder(sectionId, oldIndex, newIndex) {
        if (oldIndex === newIndex) return;

        const sectionPages = this.getPagesBySection(sectionId)
            .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

        // Reorder array
        const [removed] = sectionPages.splice(oldIndex, 1);
        sectionPages.splice(newIndex, 0, removed);

        // Update order in Firestore
        try {
            const batch = db.batch();

            sectionPages.forEach((page, index) => {
                const ref = db.collection('pages').doc(page.id);
                batch.update(ref, { menuOrder: index });

                // Update local data
                const pageInList = this.pages.find(p => p.id === page.id);
                if (pageInList) pageInList.menuOrder = index;
            });

            await batch.commit();
            Toast.success('Page order updated');

        } catch (error) {
            console.error('Error reordering pages:', error);
            Toast.error('Failed to save order');
        }
    },

    /**
     * Toggle section expansion
     * @param {string} sectionId
     */
    toggleSection(sectionId) {
        const pagesContainer = document.querySelector(`.section-pages[data-section-id="${sectionId}"]`);
        const toggleBtn = document.querySelector(`.menu-section[data-section-id="${sectionId}"] .expand-toggle`);

        if (!pagesContainer) return;

        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
            pagesContainer.classList.add('hidden');
            toggleBtn?.classList.remove('rotate-90');

            // Destroy page sortable
            if (this.pageSortables[sectionId]) {
                this.pageSortables[sectionId].destroy();
                delete this.pageSortables[sectionId];
            }
        } else {
            this.expandedSections.add(sectionId);
            pagesContainer.classList.remove('hidden');
            toggleBtn?.classList.add('rotate-90');

            // Initialize page sortable
            this.initPageSortable(sectionId);
            feather.replace();
        }
    },

    /**
     * Toggle section visibility
     * @param {string} sectionId
     */
    async toggleVisibility(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;

        const newVisibility = section.visible === false ? true : false;

        try {
            await db.collection('menuSections').doc(sectionId).update({
                visible: newVisibility
            });

            section.visible = newVisibility;
            Toast.success(newVisibility ? 'Section is now visible' : 'Section is now hidden');

            // Re-render to update icons
            this.render();

        } catch (error) {
            console.error('Error toggling visibility:', error);
            Toast.error('Failed to update visibility');
        }
    },

    /**
     * Show section modal (add/edit)
     * @param {string} sectionId - Optional, for editing
     */
    showSectionModal(sectionId = null) {
        const modal = document.getElementById('section-modal');
        const title = document.getElementById('section-modal-title');
        const form = document.getElementById('section-form');

        if (!modal || !form) return;

        this.editingSectionId = sectionId;

        if (sectionId) {
            // Edit mode
            const section = this.sections.find(s => s.id === sectionId);
            if (!section) return;

            title.textContent = 'Edit Menu Section';
            document.getElementById('section-title').value = section.title;
            document.getElementById('section-id').value = section.id;
            document.getElementById('section-id').disabled = true; // Can't change ID
            document.getElementById('section-description').value = section.description || '';
            document.getElementById('section-visible').checked = section.visible !== false;
        } else {
            // Add mode
            title.textContent = 'Add Menu Section';
            form.reset();
            document.getElementById('section-id').disabled = false;
            document.getElementById('section-visible').checked = true;
        }

        modal.classList.remove('hidden');
        document.getElementById('section-title').focus();
    },

    /**
     * Hide section modal
     */
    hideSectionModal() {
        const modal = document.getElementById('section-modal');
        modal?.classList.add('hidden');
        this.editingSectionId = null;
        document.getElementById('section-id').disabled = false;
    },

    /**
     * Edit existing section
     * @param {string} sectionId
     */
    editSection(sectionId) {
        this.showSectionModal(sectionId);
    },

    /**
     * Save section (add or update)
     */
    async saveSection() {
        const titleInput = document.getElementById('section-title');
        const idInput = document.getElementById('section-id');
        const descInput = document.getElementById('section-description');
        const visibleInput = document.getElementById('section-visible');

        const title = titleInput?.value?.trim();
        const id = idInput?.value?.trim();
        const description = descInput?.value?.trim() || '';
        const visible = visibleInput?.checked ?? true;

        if (!title || !id) {
            Toast.error('Please fill in all required fields');
            return;
        }

        // Validate ID format
        if (!/^[a-z0-9-]+$/.test(id)) {
            Toast.error('Section ID must be lowercase letters, numbers, and hyphens only');
            return;
        }

        try {
            if (this.editingSectionId) {
                // Update existing section
                await db.collection('menuSections').doc(this.editingSectionId).update({
                    title,
                    description,
                    visible,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update local data
                const section = this.sections.find(s => s.id === this.editingSectionId);
                if (section) {
                    section.title = title;
                    section.description = description;
                    section.visible = visible;
                }

                Toast.success('Section updated');
                await this.logActivity('update', `updated menu section "${title}"`);

            } else {
                // Check if ID already exists
                const existingDoc = await db.collection('menuSections').doc(id).get();
                if (existingDoc.exists) {
                    Toast.error('A section with this ID already exists');
                    return;
                }

                // Create new section
                const newSection = {
                    title,
                    description,
                    visible,
                    order: this.sections.length,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('menuSections').doc(id).set(newSection);

                // Add to local data
                this.sections.push({ id, ...newSection });

                Toast.success('Section created');
                await this.logActivity('create', `created menu section "${title}"`);
            }

            this.hideSectionModal();
            this.render();

        } catch (error) {
            console.error('Error saving section:', error);
            Toast.error('Failed to save section');
        }
    },

    /**
     * Show delete confirmation modal
     * @param {string} sectionId
     */
    showDeleteModal(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;

        this.deletingSectionId = sectionId;

        const modal = document.getElementById('delete-section-modal');
        const nameEl = document.getElementById('delete-section-name');

        if (modal && nameEl) {
            nameEl.textContent = section.title;
            modal.classList.remove('hidden');
        }
    },

    /**
     * Hide delete modal
     */
    hideDeleteModal() {
        const modal = document.getElementById('delete-section-modal');
        modal?.classList.add('hidden');
        this.deletingSectionId = null;
    },

    /**
     * Confirm and execute section deletion
     */
    async confirmDeleteSection() {
        if (!this.deletingSectionId) return;

        const sectionId = this.deletingSectionId;
        const section = this.sections.find(s => s.id === sectionId);

        try {
            // First, unassign all pages from this section
            const batch = db.batch();

            const pagesInSection = this.getPagesBySection(sectionId);
            pagesInSection.forEach(page => {
                const ref = db.collection('pages').doc(page.id);
                batch.update(ref, { menuSection: null });

                // Update local data
                const pageInList = this.pages.find(p => p.id === page.id);
                if (pageInList) pageInList.menuSection = null;
            });

            // Delete the section
            batch.delete(db.collection('menuSections').doc(sectionId));

            await batch.commit();

            // Remove from local array
            this.sections = this.sections.filter(s => s.id !== sectionId);

            // Re-order remaining sections
            await this.reorderSectionsAfterDelete();

            Toast.success('Section deleted');
            await this.logActivity('delete', `deleted menu section "${section?.title || sectionId}"`);

            this.hideDeleteModal();
            this.render();

        } catch (error) {
            console.error('Error deleting section:', error);
            Toast.error('Failed to delete section');
        }
    },

    /**
     * Re-order sections after deletion to ensure continuous ordering
     */
    async reorderSectionsAfterDelete() {
        try {
            const batch = db.batch();

            this.sections.forEach((section, index) => {
                if (section.order !== index) {
                    const ref = db.collection('menuSections').doc(section.id);
                    batch.update(ref, { order: index });
                    section.order = index;
                }
            });

            await batch.commit();
        } catch (error) {
            console.error('Error reordering sections after delete:', error);
        }
    },

    /**
     * Remove page from section (unassign)
     * @param {string} pageId
     */
    async removePageFromSection(pageId) {
        if (!confirm('Remove this page from the section? (The page will not be deleted)')) {
            return;
        }

        try {
            await db.collection('pages').doc(pageId).update({
                menuSection: null
            });

            // Update local data
            const page = this.pages.find(p => p.id === pageId);
            if (page) page.menuSection = null;

            Toast.success('Page removed from section');
            this.render();

        } catch (error) {
            console.error('Error removing page from section:', error);
            Toast.error('Failed to remove page');
        }
    },

    /**
     * Show modal to add a page to section
     * @param {string} sectionId
     */
    showAddPageModal(sectionId) {
        // Get pages not in any section
        const unassignedPages = this.pages.filter(p => !p.menuSection);

        if (unassignedPages.length === 0) {
            Toast.warning('No unassigned pages available. Create a new page or remove one from another section first.');
            return;
        }

        // Create a simple dropdown modal
        const modalHtml = `
            <div id="add-page-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Add Page to Section</h2>

                    <div class="mb-4">
                        <label for="page-select" class="block text-sm font-medium text-gray-700 mb-1">
                            Select Page
                        </label>
                        <select id="page-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">-- Select a page --</option>
                            ${unassignedPages.map(p => `
                                <option value="${p.id}">${Utils.escapeHtml(p.title || 'Untitled')} (/${p.slug || ''})</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button onclick="MenuManager.closeAddPageModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onclick="MenuManager.addPageToSection('${sectionId}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Add Page
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Close add page modal
     */
    closeAddPageModal() {
        const modal = document.getElementById('add-page-modal');
        if (modal) modal.remove();
    },

    /**
     * Add selected page to section
     * @param {string} sectionId
     */
    async addPageToSection(sectionId) {
        const select = document.getElementById('page-select');
        const pageId = select?.value;

        if (!pageId) {
            Toast.error('Please select a page');
            return;
        }

        try {
            // Get current max order in section
            const sectionPages = this.getPagesBySection(sectionId);
            const maxOrder = sectionPages.reduce((max, p) => Math.max(max, p.menuOrder || 0), -1);

            await db.collection('pages').doc(pageId).update({
                menuSection: sectionId,
                menuOrder: maxOrder + 1
            });

            // Update local data
            const page = this.pages.find(p => p.id === pageId);
            if (page) {
                page.menuSection = sectionId;
                page.menuOrder = maxOrder + 1;
            }

            Toast.success('Page added to section');
            this.closeAddPageModal();

            // Expand section and re-render
            this.expandedSections.add(sectionId);
            this.render();

        } catch (error) {
            console.error('Error adding page to section:', error);
            Toast.error('Failed to add page');
        }
    },

    /**
     * Log activity
     * @param {string} action
     * @param {string} description
     */
    async logActivity(action, description) {
        try {
            const user = Auth?.currentUser || auth?.currentUser;
            const userData = Auth?.currentUserData || {};

            await db.collection('activityLog').add({
                action,
                description,
                userId: user?.uid || null,
                userName: userData.displayName || user?.email?.split('@')[0] || 'Unknown',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
};


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on menu manager page
    if (!document.getElementById('menu-sections')) return;

    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user) => {
            if (user) {
                MenuManager.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                MenuManager.init();
            }
        });
    }
});


// Export for global use
window.MenuManager = MenuManager;
