/**
 * Middleton Grange CMS - Pages Management Module
 *
 * Handles page listing, filtering, sorting, and CRUD operations.
 */

const Pages = {
    // State
    pages: [],
    filteredPages: [],
    selectedPages: new Set(),
    menuSections: [],

    // Pagination
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,

    // Sorting
    sortField: 'updatedAt',
    sortDirection: 'desc',

    // Filters
    filters: {
        search: '',
        status: '',
        section: '',
        type: ''
    },

    /**
     * Initialize the pages module
     */
    async init() {
        // Load menu sections for filter dropdown
        await this.loadMenuSections();

        // Set up event listeners
        this.initEventListeners();

        // Check URL params for initial filters
        this.parseUrlParams();

        // Load pages
        await this.loadPages();
    },

    /**
     * Parse URL parameters for initial filter state
     */
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('type')) {
            this.filters.type = params.get('type');
            const typeSelect = document.getElementById('filter-type');
            if (typeSelect) typeSelect.value = this.filters.type;
        }

        if (params.has('section')) {
            this.filters.section = params.get('section');
            const sectionSelect = document.getElementById('filter-section');
            if (sectionSelect) sectionSelect.value = this.filters.section;
        }

        if (params.has('status')) {
            this.filters.status = params.get('status');
            const statusSelect = document.getElementById('filter-status');
            if (statusSelect) statusSelect.value = this.filters.status;
        }
    },

    /**
     * Load menu sections for filter dropdown
     */
    async loadMenuSections() {
        try {
            const snapshot = await db.collection('menuSections')
                .orderBy('order', 'asc')
                .get();

            this.menuSections = [];
            snapshot.forEach(doc => {
                this.menuSections.push({ id: doc.id, ...doc.data() });
            });

            // Populate filter dropdown
            const sectionSelect = document.getElementById('filter-section');
            if (sectionSelect) {
                this.menuSections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.id;
                    option.textContent = section.title;
                    sectionSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading menu sections:', error);
        }
    },

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-pages');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        ['filter-status', 'filter-section', 'filter-type'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', (e) => {
                    const filterName = id.replace('filter-', '');
                    this.filters[filterName] = e.target.value;
                    this.applyFilters();
                });
            }
        });

        // Select all checkbox
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk actions
        this.initBulkActions();

        // Pagination
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }

        // Sort headers
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (this.sortField === field) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDirection = 'desc';
                }
                this.applyFilters();
            });
        });

        // Delete modal
        const cancelDelete = document.getElementById('cancel-delete');
        const confirmDelete = document.getElementById('confirm-delete');

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDeletePage());
        }
    },

    /**
     * Initialize bulk action buttons
     */
    initBulkActions() {
        const bulkPublish = document.getElementById('bulk-publish');
        const bulkUnpublish = document.getElementById('bulk-unpublish');
        const bulkDelete = document.getElementById('bulk-delete');

        if (bulkPublish) {
            bulkPublish.addEventListener('click', () => this.bulkAction('publish'));
        }
        if (bulkUnpublish) {
            bulkUnpublish.addEventListener('click', () => this.bulkAction('unpublish'));
        }
        if (bulkDelete) {
            bulkDelete.addEventListener('click', () => this.bulkAction('delete'));
        }
    },

    /**
     * Load pages from Firestore
     */
    async loadPages() {
        const tableBody = document.getElementById('pages-table-body');
        if (!tableBody) return;

        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i data-feather="loader" class="w-8 h-8 animate-spin mx-auto mb-2"></i>
                    <p>Loading pages...</p>
                </td>
            </tr>
        `;
        feather.replace();

        try {
            // Build query
            let query = db.collection('pages');

            // Apply Firestore filters where possible
            if (this.filters.status) {
                query = query.where('status', '==', this.filters.status);
            }
            if (this.filters.section) {
                query = query.where('menuSection', '==', this.filters.section);
            }
            if (this.filters.type) {
                query = query.where('pageType', '==', this.filters.type);
            }

            // Get all matching documents
            const snapshot = await query.get();

            this.pages = [];
            snapshot.forEach(doc => {
                this.pages.push({ id: doc.id, ...doc.data() });
            });

            // Apply client-side filtering and sorting
            this.applyFilters();

        } catch (error) {
            console.error('Error loading pages:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-red-500">
                        <i data-feather="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
                        <p>Error loading pages. Please refresh the page.</p>
                    </td>
                </tr>
            `;
            feather.replace();
        }
    },

    /**
     * Apply filters and sorting to pages
     */
    applyFilters() {
        // Start with all pages
        this.filteredPages = [...this.pages];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            this.filteredPages = this.filteredPages.filter(page =>
                (page.title || '').toLowerCase().includes(searchTerm) ||
                (page.slug || '').toLowerCase().includes(searchTerm)
            );
        }

        // Sort pages
        this.filteredPages.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];

            // Handle Firestore timestamps
            if (aVal?.toDate) aVal = aVal.toDate();
            if (bVal?.toDate) bVal = bVal.toDate();

            // Handle null/undefined
            if (!aVal) aVal = '';
            if (!bVal) bVal = '';

            // Compare
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Calculate pagination
        this.totalPages = Math.ceil(this.filteredPages.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }

        // Render pages
        this.renderPages();
        this.updatePagination();
    },

    /**
     * Render pages table
     */
    renderPages() {
        const tableBody = document.getElementById('pages-table-body');
        if (!tableBody) return;

        // Get current page slice
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageSlice = this.filteredPages.slice(start, end);

        if (pageSlice.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <i data-feather="file-text" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p>No pages found</p>
                        <a href="page-editor.html" class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                            Create your first page
                        </a>
                    </td>
                </tr>
            `;
            feather.replace();
            return;
        }

        let html = '';
        pageSlice.forEach(page => {
            const isSelected = this.selectedPages.has(page.id);
            const statusClass = page.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800';

            const section = this.menuSections.find(s => s.id === page.menuSection);
            const sectionName = section ? section.title : '-';

            html += `
                <tr class="hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}">
                    <td class="px-4 py-3">
                        <input
                            type="checkbox"
                            class="page-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            data-id="${page.id}"
                            ${isSelected ? 'checked' : ''}
                        >
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center">
                            <i data-feather="${this.getPageTypeIcon(page.pageType)}" class="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"></i>
                            <div class="min-w-0">
                                <a href="page-editor.html?id=${page.id}" class="font-medium text-gray-900 hover:text-blue-600 truncate block">
                                    ${Utils.escapeHtml(page.title || 'Untitled')}
                                </a>
                                ${page.pageType && page.pageType !== 'standard' ? `<span class="text-xs text-gray-500 capitalize">${page.pageType.replace('-', ' ')}</span>` : ''}
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                        /${Utils.escapeHtml(page.slug || '')}
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass} capitalize">
                            ${page.status || 'draft'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                        ${Utils.escapeHtml(sectionName)}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                        ${Utils.formatDate(page.updatedAt)}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2">
                            <a href="page-editor.html?id=${page.id}" class="text-blue-600 hover:text-blue-800" title="Edit">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </a>
                            <button class="text-gray-400 hover:text-gray-600" title="Duplicate" onclick="Pages.duplicatePage('${page.id}')">
                                <i data-feather="copy" class="w-4 h-4"></i>
                            </button>
                            <button class="text-red-400 hover:text-red-600" title="Delete" onclick="Pages.showDeleteModal('${page.id}', '${Utils.escapeHtml(page.title || 'Untitled')}')">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        feather.replace();

        // Add checkbox listeners
        tableBody.querySelectorAll('.page-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.togglePageSelection(e.target.dataset.id, e.target.checked);
            });
        });
    },

    /**
     * Get icon for page type
     * @param {string} pageType
     * @returns {string}
     */
    getPageTypeIcon(pageType) {
        const icons = {
            'standard': 'file-text',
            'video-gallery': 'video',
            'staff-listing': 'users',
            'news': 'rss',
            'alumni-profiles': 'award'
        };
        return icons[pageType] || 'file-text';
    },

    /**
     * Update pagination UI
     */
    updatePagination() {
        const start = this.filteredPages.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.filteredPages.length);

        document.getElementById('showing-start').textContent = start;
        document.getElementById('showing-end').textContent = end;
        document.getElementById('total-pages').textContent = this.filteredPages.length;

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    },

    /**
     * Go to specific page
     * @param {number} page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderPages();
        this.updatePagination();
    },

    /**
     * Toggle page selection
     * @param {string} pageId
     * @param {boolean} selected
     */
    togglePageSelection(pageId, selected) {
        if (selected) {
            this.selectedPages.add(pageId);
        } else {
            this.selectedPages.delete(pageId);
        }
        this.updateBulkActions();
    },

    /**
     * Toggle select all
     * @param {boolean} selected
     */
    toggleSelectAll(selected) {
        const checkboxes = document.querySelectorAll('.page-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            if (selected) {
                this.selectedPages.add(checkbox.dataset.id);
            } else {
                this.selectedPages.delete(checkbox.dataset.id);
            }
        });
        this.updateBulkActions();
    },

    /**
     * Update bulk actions visibility
     */
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');

        if (bulkActions && selectedCount) {
            if (this.selectedPages.size > 0) {
                bulkActions.classList.remove('hidden');
                selectedCount.textContent = this.selectedPages.size;
            } else {
                bulkActions.classList.add('hidden');
            }
        }
    },

    /**
     * Perform bulk action on selected pages
     * @param {string} action - 'publish', 'unpublish', or 'delete'
     */
    async bulkAction(action) {
        if (this.selectedPages.size === 0) return;

        const pageIds = Array.from(this.selectedPages);

        // Check admin permission for delete
        if (action === 'delete' && !Auth.isAdmin()) {
            Toast.error('Only administrators can delete pages.');
            return;
        }

        // Confirm delete action
        if (action === 'delete') {
            if (!confirm(`Are you sure you want to delete ${pageIds.length} page(s)? This cannot be undone.`)) {
                return;
            }
        }

        try {
            const batch = db.batch();

            for (const pageId of pageIds) {
                const pageRef = db.collection('pages').doc(pageId);

                if (action === 'delete') {
                    batch.delete(pageRef);
                } else {
                    batch.update(pageRef, {
                        status: action === 'publish' ? 'published' : 'draft',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            await batch.commit();

            // Log activity
            const actionVerb = action === 'delete' ? 'deleted' : action === 'publish' ? 'published' : 'unpublished';
            await Dashboard?.logActivity(action, `${actionVerb} ${pageIds.length} page(s)`);

            Toast.success(`Successfully ${actionVerb} ${pageIds.length} page(s)`);

            // Clear selection and reload
            this.selectedPages.clear();
            this.updateBulkActions();
            document.getElementById('select-all').checked = false;

            await this.loadPages();

        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            Toast.error(`Failed to ${action} pages. Please try again.`);
        }
    },

    /**
     * Show delete confirmation modal
     * @param {string} pageId
     * @param {string} pageTitle
     */
    showDeleteModal(pageId, pageTitle) {
        // Check admin permission
        if (!Auth.isAdmin()) {
            Toast.error('Only administrators can delete pages.');
            return;
        }

        const modal = document.getElementById('delete-modal');
        const titleSpan = document.getElementById('delete-page-title');

        if (modal && titleSpan) {
            titleSpan.textContent = pageTitle;
            modal.dataset.pageId = pageId;
            modal.classList.remove('hidden');
        }
    },

    /**
     * Hide delete modal
     */
    hideDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.add('hidden');
            delete modal.dataset.pageId;
        }
    },

    /**
     * Confirm and execute page deletion
     */
    async confirmDeletePage() {
        const modal = document.getElementById('delete-modal');
        const pageId = modal?.dataset.pageId;

        if (!pageId) return;

        try {
            await db.collection('pages').doc(pageId).delete();

            // Log activity
            await Dashboard?.logActivity('delete', 'deleted a page');

            Toast.success('Page deleted successfully');
            this.hideDeleteModal();
            await this.loadPages();

        } catch (error) {
            console.error('Error deleting page:', error);
            Toast.error('Failed to delete page. Please try again.');
        }
    },

    /**
     * Duplicate a page
     * @param {string} pageId
     */
    async duplicatePage(pageId) {
        try {
            // Get original page
            const pageDoc = await db.collection('pages').doc(pageId).get();
            if (!pageDoc.exists) {
                Toast.error('Page not found');
                return;
            }

            const originalPage = pageDoc.data();

            // Create duplicate
            const duplicate = {
                ...originalPage,
                title: `${originalPage.title || 'Untitled'} (Copy)`,
                slug: `${originalPage.slug || 'untitled'}-copy-${Date.now()}`,
                status: 'draft',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('pages').add(duplicate);

            // Log activity
            await Dashboard?.logActivity('create', `duplicated "${originalPage.title}"`);

            Toast.success('Page duplicated successfully');
            await this.loadPages();

        } catch (error) {
            console.error('Error duplicating page:', error);
            Toast.error('Failed to duplicate page. Please try again.');
        }
    }
};


// ============================================
// INITIALIZATION
// ============================================

// Initialize pages when DOM is ready and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the pages listing page
    if (!document.getElementById('pages-table-body')) return;

    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user) => {
            if (user) {
                Pages.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                Pages.init();
            }
        });
    }
});


// Export for global use
window.Pages = Pages;
