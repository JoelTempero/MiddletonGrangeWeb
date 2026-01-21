/**
 * Middleton Grange CMS - Media Library Module
 *
 * Handles file uploads, media management, and image picker functionality.
 */

const MediaLibrary = {
    // State
    media: [],
    filteredMedia: [],
    selectedMedia: new Set(),
    currentMedia: null,
    lastDoc: null,
    hasMore: true,
    isLoading: false,

    // Configuration
    config: {
        pageSize: 24,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: {
            'image/jpeg': 'image',
            'image/png': 'image',
            'image/gif': 'image',
            'image/webp': 'image',
            'image/svg+xml': 'image',
            'application/pdf': 'pdf',
            'video/mp4': 'video'
        }
    },

    // Current filters
    filters: {
        search: '',
        type: '',
        sort: 'date-desc'
    },

    /**
     * Initialize media library
     */
    init() {
        this.bindEvents();
        this.loadMedia();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Upload button toggle
        const uploadBtn = document.getElementById('upload-btn');
        const dropzone = document.getElementById('upload-dropzone');

        if (uploadBtn && dropzone) {
            uploadBtn.addEventListener('click', () => {
                dropzone.classList.toggle('hidden');
                if (!dropzone.classList.contains('hidden')) {
                    feather.replace();
                }
            });
        }

        // Browse files button
        const browseBtn = document.getElementById('browse-files');
        const fileInput = document.getElementById('file-input');

        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        }

        // Drag and drop
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-blue-600', 'bg-blue-50');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-blue-600', 'bg-blue-50');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-blue-600', 'bg-blue-50');
                this.handleFileSelect(e.dataTransfer.files);
            });

            // Click anywhere on dropzone to browse
            dropzone.addEventListener('click', (e) => {
                if (e.target === dropzone || e.target.closest('.text-center')) {
                    fileInput?.click();
                }
            });
        }

        // Search
        const searchInput = document.getElementById('search-media');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Type filter
        const typeFilter = document.getElementById('filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        // Sort
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }

        // Bulk delete
        const bulkDeleteBtn = document.getElementById('bulk-delete');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDelete());
        }

        // Load more
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMedia(true));
        }

        // Modal events
        this.bindModalEvents();
    },

    /**
     * Bind modal event listeners
     */
    bindModalEvents() {
        const modal = document.getElementById('media-details-modal');
        const closeBtn = document.getElementById('close-details');
        const deleteBtn = document.getElementById('delete-media');
        const saveBtn = document.getElementById('save-media-details');
        const copyBtn = document.getElementById('copy-url');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentMedia());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveMediaDetails());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyUrl());
        }

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    },

    /**
     * Load media from Firestore
     * @param {boolean} loadMore - Whether to load more (pagination)
     */
    async loadMedia(loadMore = false) {
        if (this.isLoading || (!loadMore && !this.hasMore)) return;

        this.isLoading = true;
        const grid = document.getElementById('media-grid');
        const loadMoreContainer = document.getElementById('load-more-container');

        if (!loadMore) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i data-feather="loader" class="w-8 h-8 animate-spin mx-auto mb-2"></i>
                    <p>Loading media...</p>
                </div>
            `;
            feather.replace();
            this.media = [];
            this.lastDoc = null;
        }

        try {
            let query = db.collection('media')
                .orderBy('createdAt', 'desc')
                .limit(this.config.pageSize);

            if (this.lastDoc) {
                query = query.startAfter(this.lastDoc);
            }

            const snapshot = await query.get();

            if (snapshot.empty && !loadMore) {
                this.renderEmptyState();
                return;
            }

            snapshot.forEach(doc => {
                this.media.push({ id: doc.id, ...doc.data() });
            });

            this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            this.hasMore = snapshot.size === this.config.pageSize;

            this.applyFilters();

            // Show/hide load more button
            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', !this.hasMore);
            }

        } catch (error) {
            console.error('Error loading media:', error);
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-500">
                    <i data-feather="alert-circle" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>Error loading media. Please try again.</p>
                </div>
            `;
            feather.replace();
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Apply current filters and sort
     */
    applyFilters() {
        let filtered = [...this.media];

        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(m =>
                m.filename?.toLowerCase().includes(this.filters.search) ||
                m.alt?.toLowerCase().includes(this.filters.search)
            );
        }

        // Type filter
        if (this.filters.type) {
            filtered = filtered.filter(m => m.type === this.filters.type);
        }

        // Sort
        const [sortField, sortDir] = this.filters.sort.split('-');
        filtered.sort((a, b) => {
            let valA, valB;

            switch (sortField) {
                case 'date':
                    valA = a.createdAt?.toMillis?.() || 0;
                    valB = b.createdAt?.toMillis?.() || 0;
                    break;
                case 'name':
                    valA = a.filename?.toLowerCase() || '';
                    valB = b.filename?.toLowerCase() || '';
                    break;
                case 'size':
                    valA = a.size || 0;
                    valB = b.size || 0;
                    break;
                default:
                    return 0;
            }

            if (sortDir === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        this.filteredMedia = filtered;
        this.renderGrid();
    },

    /**
     * Render the media grid
     */
    renderGrid() {
        const grid = document.getElementById('media-grid');
        if (!grid) return;

        if (this.filteredMedia.length === 0) {
            if (this.filters.search || this.filters.type) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-gray-500">
                        <i data-feather="search" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p>No media files match your search</p>
                        <button onclick="MediaLibrary.clearFilters()" class="mt-2 text-blue-600 hover:underline">Clear filters</button>
                    </div>
                `;
            } else {
                this.renderEmptyState();
            }
            feather.replace();
            return;
        }

        let html = '';
        this.filteredMedia.forEach(media => {
            const isSelected = this.selectedMedia.has(media.id);
            const thumbnail = this.getThumbnail(media);

            html += `
                <div class="media-item group relative bg-white rounded-lg shadow overflow-hidden cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}"
                     data-id="${media.id}">
                    <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        ${thumbnail}
                    </div>
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button class="view-btn p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 mr-2" title="View Details">
                            <i data-feather="eye" class="w-4 h-4 text-gray-700"></i>
                        </button>
                        <button class="select-btn p-2 bg-white rounded-full shadow-lg hover:bg-gray-100" title="Select">
                            <i data-feather="${isSelected ? 'check-square' : 'square'}" class="w-4 h-4 text-gray-700"></i>
                        </button>
                    </div>
                    <div class="p-2">
                        <p class="text-xs text-gray-700 truncate" title="${Utils.escapeHtml(media.filename)}">${Utils.escapeHtml(media.filename)}</p>
                        <p class="text-xs text-gray-400">${Utils.formatFileSize(media.size)}</p>
                    </div>
                    ${isSelected ? '<div class="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><i data-feather="check" class="w-4 h-4 text-white"></i></div>' : ''}
                </div>
            `;
        });

        grid.innerHTML = html;
        feather.replace();

        // Bind click events
        grid.querySelectorAll('.media-item').forEach(item => {
            const id = item.dataset.id;

            item.querySelector('.view-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMediaDetails(id);
            });

            item.querySelector('.select-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSelection(id);
            });

            // Double click to open details
            item.addEventListener('dblclick', () => this.openMediaDetails(id));

            // Single click to select (if in selection mode)
            item.addEventListener('click', () => {
                if (this.selectedMedia.size > 0) {
                    this.toggleSelection(id);
                }
            });
        });
    },

    /**
     * Get thumbnail HTML for media item
     * @param {Object} media
     * @returns {string}
     */
    getThumbnail(media) {
        switch (media.type) {
            case 'image':
                return `<img src="${media.url}" alt="${Utils.escapeHtml(media.alt || media.filename)}"
                        class="w-full h-full object-cover" loading="lazy">`;
            case 'video':
                return `
                    <div class="text-center">
                        <i data-feather="film" class="w-12 h-12 text-purple-500 mx-auto"></i>
                        <p class="text-xs text-gray-500 mt-1">Video</p>
                    </div>
                `;
            case 'pdf':
                return `
                    <div class="text-center">
                        <i data-feather="file-text" class="w-12 h-12 text-red-500 mx-auto"></i>
                        <p class="text-xs text-gray-500 mt-1">PDF</p>
                    </div>
                `;
            default:
                return `
                    <div class="text-center">
                        <i data-feather="file" class="w-12 h-12 text-gray-400 mx-auto"></i>
                        <p class="text-xs text-gray-500 mt-1">File</p>
                    </div>
                `;
        }
    },

    /**
     * Render empty state
     */
    renderEmptyState() {
        const grid = document.getElementById('media-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i data-feather="image" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p class="text-lg mb-2">No media files yet</p>
                    <p class="text-sm">Upload images, documents, or videos to get started</p>
                    <button onclick="document.getElementById('upload-dropzone').classList.remove('hidden'); feather.replace();"
                            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Upload Your First File
                    </button>
                </div>
            `;
            feather.replace();
        }
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters.search = '';
        this.filters.type = '';

        document.getElementById('search-media').value = '';
        document.getElementById('filter-type').value = '';

        this.applyFilters();
    },

    /**
     * Toggle selection of a media item
     * @param {string} id
     */
    toggleSelection(id) {
        if (this.selectedMedia.has(id)) {
            this.selectedMedia.delete(id);
        } else {
            this.selectedMedia.add(id);
        }

        this.updateBulkActions();
        this.renderGrid();
    },

    /**
     * Update bulk actions bar visibility
     */
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const countEl = document.getElementById('selected-count');

        if (bulkActions && countEl) {
            if (this.selectedMedia.size > 0) {
                bulkActions.classList.remove('hidden');
                countEl.textContent = this.selectedMedia.size;
            } else {
                bulkActions.classList.add('hidden');
            }
        }
    },

    /**
     * Handle file selection for upload
     * @param {FileList} files
     */
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const validFiles = [];

        for (const file of files) {
            // Validate file type
            if (!this.config.allowedTypes[file.type]) {
                Toast.error(`Invalid file type: ${file.name}`);
                continue;
            }

            // Validate file size
            if (file.size > this.config.maxFileSize) {
                Toast.error(`File too large: ${file.name} (max 10MB)`);
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            await this.uploadFiles(validFiles);
        }
    },

    /**
     * Upload files to Firebase Storage
     * @param {File[]} files
     */
    async uploadFiles(files) {
        const progressContainer = document.getElementById('upload-progress');
        const progressBar = document.getElementById('upload-bar');
        const progressPercent = document.getElementById('upload-percent');
        const dropzone = document.getElementById('upload-dropzone');

        // Hide dropzone, show progress
        dropzone?.classList.add('hidden');
        progressContainer?.classList.remove('hidden');

        let uploaded = 0;
        const total = files.length;

        try {
            for (const file of files) {
                // Generate unique filename
                const timestamp = Date.now();
                const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const storagePath = `media/${timestamp}_${safeFilename}`;

                // Create storage reference
                const storageRef = storage.ref(storagePath);

                // Upload file with progress tracking
                const uploadTask = storageRef.put(file);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Calculate overall progress
                            const fileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
                            const overallProgress = ((uploaded + fileProgress) / total) * 100;

                            if (progressBar) progressBar.style.width = `${overallProgress}%`;
                            if (progressPercent) progressPercent.textContent = `${Math.round(overallProgress)}%`;
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        async () => {
                            // Upload complete - get download URL
                            const url = await uploadTask.snapshot.ref.getDownloadURL();

                            // Get image dimensions if applicable
                            let dimensions = null;
                            if (file.type.startsWith('image/')) {
                                dimensions = await this.getImageDimensions(file);
                            }

                            // Save to Firestore
                            const mediaDoc = {
                                filename: file.name,
                                type: this.config.allowedTypes[file.type],
                                mimeType: file.type,
                                size: file.size,
                                url,
                                storagePath,
                                alt: '',
                                dimensions,
                                uploadedBy: Auth?.currentUser?.uid || null,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            const docRef = await db.collection('media').add(mediaDoc);

                            // Add to local array
                            this.media.unshift({ id: docRef.id, ...mediaDoc, createdAt: new Date() });

                            uploaded++;
                            resolve();
                        }
                    );
                });
            }

            // Success
            Toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded successfully`);

            // Refresh grid
            this.applyFilters();

            // Log activity
            await this.logActivity('upload', `uploaded ${uploaded} file${uploaded > 1 ? 's' : ''}`);

        } catch (error) {
            console.error('Upload failed:', error);
            Toast.error('Some files failed to upload');
        } finally {
            // Reset progress UI
            progressContainer?.classList.add('hidden');
            if (progressBar) progressBar.style.width = '0%';
            if (progressPercent) progressPercent.textContent = '0%';

            // Clear file input
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';
        }
    },

    /**
     * Get image dimensions
     * @param {File} file
     * @returns {Promise<{width: number, height: number}|null>}
     */
    getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Open media details modal
     * @param {string} id
     */
    openMediaDetails(id) {
        const media = this.media.find(m => m.id === id);
        if (!media) return;

        this.currentMedia = media;
        const modal = document.getElementById('media-details-modal');

        // Populate modal
        document.getElementById('media-filename').textContent = media.filename;
        document.getElementById('media-type').textContent = media.mimeType || media.type;
        document.getElementById('media-size').textContent = Utils.formatFileSize(media.size);
        document.getElementById('media-dimensions').textContent =
            media.dimensions ? `${media.dimensions.width} x ${media.dimensions.height}px` : 'N/A';
        document.getElementById('media-uploaded').textContent = Utils.formatDate(media.createdAt);
        document.getElementById('media-alt').value = media.alt || '';
        document.getElementById('media-url').value = media.url;

        // Preview
        const previewEl = document.getElementById('media-preview');
        if (previewEl) {
            if (media.type === 'image') {
                previewEl.innerHTML = `<img src="${media.url}" alt="${Utils.escapeHtml(media.alt || media.filename)}" class="max-w-full max-h-64 object-contain">`;
            } else if (media.type === 'video') {
                previewEl.innerHTML = `<video src="${media.url}" controls class="max-w-full max-h-64"></video>`;
            } else if (media.type === 'pdf') {
                previewEl.innerHTML = `
                    <div class="text-center p-8">
                        <i data-feather="file-text" class="w-16 h-16 text-red-500 mx-auto mb-2"></i>
                        <a href="${media.url}" target="_blank" class="text-blue-600 hover:underline">Open PDF</a>
                    </div>
                `;
            }
            feather.replace();
        }

        // Show modal
        modal?.classList.remove('hidden');
    },

    /**
     * Close media details modal
     */
    closeModal() {
        const modal = document.getElementById('media-details-modal');
        modal?.classList.add('hidden');
        this.currentMedia = null;
    },

    /**
     * Save media details (alt text)
     */
    async saveMediaDetails() {
        if (!this.currentMedia) return;

        const altInput = document.getElementById('media-alt');
        const newAlt = altInput?.value || '';

        try {
            await db.collection('media').doc(this.currentMedia.id).update({
                alt: newAlt,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update local data
            const media = this.media.find(m => m.id === this.currentMedia.id);
            if (media) media.alt = newAlt;

            Toast.success('Media details saved');
            this.closeModal();

        } catch (error) {
            console.error('Error saving media details:', error);
            Toast.error('Failed to save changes');
        }
    },

    /**
     * Copy URL to clipboard
     */
    async copyUrl() {
        const urlInput = document.getElementById('media-url');
        if (!urlInput) return;

        try {
            await navigator.clipboard.writeText(urlInput.value);
            Toast.success('URL copied to clipboard');
        } catch (error) {
            // Fallback
            urlInput.select();
            document.execCommand('copy');
            Toast.success('URL copied to clipboard');
        }
    },

    /**
     * Delete current media from modal
     */
    async deleteCurrentMedia() {
        if (!this.currentMedia) return;

        if (!confirm(`Are you sure you want to delete "${this.currentMedia.filename}"?`)) {
            return;
        }

        await this.deleteMedia(this.currentMedia.id);
        this.closeModal();
    },

    /**
     * Delete a single media item
     * @param {string} id
     */
    async deleteMedia(id) {
        const media = this.media.find(m => m.id === id);
        if (!media) return;

        try {
            // Delete from Storage
            if (media.storagePath) {
                await storage.ref(media.storagePath).delete();
            }

            // Delete from Firestore
            await db.collection('media').doc(id).delete();

            // Remove from local array
            this.media = this.media.filter(m => m.id !== id);
            this.selectedMedia.delete(id);

            Toast.success('File deleted');
            this.applyFilters();
            this.updateBulkActions();

            // Log activity
            await this.logActivity('delete', `deleted ${media.filename}`);

        } catch (error) {
            console.error('Error deleting media:', error);
            Toast.error('Failed to delete file');
        }
    },

    /**
     * Bulk delete selected media
     */
    async bulkDelete() {
        if (this.selectedMedia.size === 0) return;

        const count = this.selectedMedia.size;
        if (!confirm(`Are you sure you want to delete ${count} file${count > 1 ? 's' : ''}?`)) {
            return;
        }

        const ids = Array.from(this.selectedMedia);
        let deleted = 0;

        for (const id of ids) {
            try {
                await this.deleteMedia(id);
                deleted++;
            } catch (error) {
                console.error(`Failed to delete ${id}:`, error);
            }
        }

        Toast.success(`${deleted} file${deleted > 1 ? 's' : ''} deleted`);
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
// IMAGE PICKER (for Page Editor integration)
// ============================================

const ImagePicker = {
    modal: null,
    callback: null,
    selectedMedia: null,

    /**
     * Initialize image picker
     */
    init() {
        this.createModal();
        this.bindEvents();
    },

    /**
     * Create the image picker modal HTML
     */
    createModal() {
        if (document.getElementById('image-picker-modal')) return;

        const modalHtml = `
            <div id="image-picker-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Select Image</h2>
                        <button id="close-image-picker" class="text-gray-500 hover:text-gray-700">
                            <i data-feather="x" class="w-6 h-6"></i>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="border-b border-gray-200">
                        <nav class="flex">
                            <button class="picker-tab active px-6 py-3 text-blue-600 border-b-2 border-blue-600 font-medium" data-tab="library">
                                Media Library
                            </button>
                            <button class="picker-tab px-6 py-3 text-gray-500 hover:text-gray-700 font-medium" data-tab="upload">
                                Upload New
                            </button>
                        </nav>
                    </div>

                    <!-- Tab Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <!-- Library Tab -->
                        <div id="picker-library-tab">
                            <div class="mb-4">
                                <input type="text" id="picker-search" placeholder="Search images..."
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div id="picker-grid" class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 min-h-48">
                                <!-- Images loaded here -->
                            </div>
                        </div>

                        <!-- Upload Tab -->
                        <div id="picker-upload-tab" class="hidden">
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <i data-feather="upload-cloud" class="w-12 h-12 mx-auto text-gray-400 mb-4"></i>
                                <p class="text-gray-600 mb-4">Drop an image here or click to browse</p>
                                <input type="file" id="picker-file-input" accept="image/*" class="hidden">
                                <button id="picker-browse-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Browse Files
                                </button>
                            </div>
                            <div id="picker-upload-progress" class="hidden mt-4">
                                <div class="flex justify-between text-sm mb-1">
                                    <span>Uploading...</span>
                                    <span id="picker-upload-percent">0%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div id="picker-upload-bar" class="bg-blue-600 h-2 rounded-full" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button id="picker-cancel" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button id="picker-select" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Select Image
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('image-picker-modal');
        feather.replace();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        document.getElementById('close-image-picker')?.addEventListener('click', () => this.close());
        document.getElementById('picker-cancel')?.addEventListener('click', () => this.close());

        // Click outside to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Tab switching
        document.querySelectorAll('.picker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Search
        document.getElementById('picker-search')?.addEventListener('input', Utils.debounce((e) => {
            this.loadImages(e.target.value);
        }, 300));

        // Upload
        const browseBtn = document.getElementById('picker-browse-btn');
        const fileInput = document.getElementById('picker-file-input');

        browseBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => this.uploadImage(e.target.files[0]));

        // Select button
        document.getElementById('picker-select')?.addEventListener('click', () => this.selectImage());

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal?.classList.contains('hidden')) {
                this.close();
            }
        });
    },

    /**
     * Open the image picker
     * @param {Function} callback - Called with selected image data
     */
    open(callback) {
        this.callback = callback;
        this.selectedMedia = null;
        this.modal?.classList.remove('hidden');
        this.switchTab('library');
        this.loadImages();
        document.getElementById('picker-select').disabled = true;
    },

    /**
     * Close the image picker
     */
    close() {
        this.modal?.classList.add('hidden');
        this.callback = null;
        this.selectedMedia = null;
    },

    /**
     * Switch between tabs
     * @param {string} tab
     */
    switchTab(tab) {
        document.querySelectorAll('.picker-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
            t.classList.toggle('text-blue-600', t.dataset.tab === tab);
            t.classList.toggle('border-b-2', t.dataset.tab === tab);
            t.classList.toggle('border-blue-600', t.dataset.tab === tab);
            t.classList.toggle('text-gray-500', t.dataset.tab !== tab);
        });

        document.getElementById('picker-library-tab')?.classList.toggle('hidden', tab !== 'library');
        document.getElementById('picker-upload-tab')?.classList.toggle('hidden', tab !== 'upload');
    },

    /**
     * Load images for picker
     * @param {string} search
     */
    async loadImages(search = '') {
        const grid = document.getElementById('picker-grid');
        if (!grid) return;

        grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Loading...</div>';

        try {
            let query = db.collection('media')
                .where('type', '==', 'image')
                .orderBy('createdAt', 'desc')
                .limit(50);

            const snapshot = await query.get();

            if (snapshot.empty) {
                grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No images found</div>';
                return;
            }

            let images = [];
            snapshot.forEach(doc => {
                images.push({ id: doc.id, ...doc.data() });
            });

            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                images = images.filter(img =>
                    img.filename?.toLowerCase().includes(searchLower) ||
                    img.alt?.toLowerCase().includes(searchLower)
                );
            }

            if (images.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No matching images</div>';
                return;
            }

            let html = '';
            images.forEach(img => {
                html += `
                    <div class="picker-image aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all"
                         data-id="${img.id}">
                        <img src="${img.url}" alt="${Utils.escapeHtml(img.alt || img.filename)}"
                             class="w-full h-full object-cover" loading="lazy">
                    </div>
                `;
            });

            grid.innerHTML = html;

            // Bind click events
            grid.querySelectorAll('.picker-image').forEach(el => {
                el.addEventListener('click', () => {
                    // Deselect others
                    grid.querySelectorAll('.picker-image').forEach(i => {
                        i.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500');
                    });

                    // Select this one
                    el.classList.add('border-blue-500', 'ring-2', 'ring-blue-500');

                    const id = el.dataset.id;
                    this.selectedMedia = images.find(i => i.id === id);
                    document.getElementById('picker-select').disabled = false;
                });
            });

        } catch (error) {
            console.error('Error loading images for picker:', error);
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">Error loading images</div>';
        }
    },

    /**
     * Upload image from picker
     * @param {File} file
     */
    async uploadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            Toast.error('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.error('Image must be less than 10MB');
            return;
        }

        const progressContainer = document.getElementById('picker-upload-progress');
        const progressBar = document.getElementById('picker-upload-bar');
        const progressPercent = document.getElementById('picker-upload-percent');

        progressContainer?.classList.remove('hidden');

        try {
            const timestamp = Date.now();
            const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `media/${timestamp}_${safeFilename}`;

            const storageRef = storage.ref(storagePath);
            const uploadTask = storageRef.put(file);

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (progressBar) progressBar.style.width = `${progress}%`;
                        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
                    },
                    reject,
                    async () => {
                        const url = await uploadTask.snapshot.ref.getDownloadURL();
                        const dimensions = await MediaLibrary.getImageDimensions(file);

                        const mediaDoc = {
                            filename: file.name,
                            type: 'image',
                            mimeType: file.type,
                            size: file.size,
                            url,
                            storagePath,
                            alt: '',
                            dimensions,
                            uploadedBy: Auth?.currentUser?.uid || null,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        };

                        const docRef = await db.collection('media').add(mediaDoc);

                        // Select the uploaded image
                        this.selectedMedia = { id: docRef.id, ...mediaDoc };
                        document.getElementById('picker-select').disabled = false;

                        Toast.success('Image uploaded');

                        // Switch to library and reload
                        this.switchTab('library');
                        this.loadImages();

                        resolve();
                    }
                );
            });

        } catch (error) {
            console.error('Upload error:', error);
            Toast.error('Failed to upload image');
        } finally {
            progressContainer?.classList.add('hidden');
            if (progressBar) progressBar.style.width = '0%';
            document.getElementById('picker-file-input').value = '';
        }
    },

    /**
     * Select the chosen image
     */
    selectImage() {
        if (this.selectedMedia && this.callback) {
            this.callback({
                url: this.selectedMedia.url,
                alt: this.selectedMedia.alt || this.selectedMedia.filename,
                id: this.selectedMedia.id
            });
        }
        this.close();
    }
};


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on media library page
    if (document.getElementById('media-grid')) {
        if (typeof Auth !== 'undefined') {
            Auth.onAuthStateChange((user) => {
                if (user) {
                    MediaLibrary.init();
                }
            });
        } else if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    MediaLibrary.init();
                }
            });
        }
    }

    // Initialize image picker for all pages (editor integration)
    ImagePicker.init();
});


// Export for global use
window.MediaLibrary = MediaLibrary;
window.ImagePicker = ImagePicker;
