/**
 * Middleton Grange CMS - Site Settings Module
 *
 * Handles site configuration, branding, and popup management.
 */

const SiteSettings = {
    // State
    settings: {},
    isDirty: false,
    currentTab: 'general',

    // Settings structure with defaults
    defaults: {
        general: {
            siteName: 'Middleton Grange School',
            tagline: 'Character, Excellence, Service for the Glory of God',
            logoUrl: '',
            faviconUrl: '',
            primaryColor: '#1e3a5f',
            secondaryColor: '#c9a227',
            footerText: '© Middleton Grange School. All rights reserved.'
        },
        contact: {
            address: '30 Donovans Road, Rangiora 7400',
            phone: '+64 3 312 8820',
            email: 'admin@middleton.school.nz',
            intPhone: '+64 3 312 8827',
            intEmail: 'international@middleton.school.nz',
            intUrgent: '+64 27 672 6077'
        },
        links: {
            facebookUrl: 'https://www.facebook.com/middletongrangeschool',
            parentPortalUrl: '',
            studentPortalUrl: '',
            kindoUrl: '',
            schoolAppUrl: '',
            theatreUrl: ''
        },
        homepage: {
            heroVideoUrl: '',
            heroTitle: 'Middleton Grange School',
            heroSubtitle: '',
            backToSchoolEnabled: false,
            backToSchoolYear: new Date().getFullYear().toString(),
            backToSchoolLinks: [],
            valuesEnabled: true
        },
        popup: {
            enabled: false,
            title: '',
            content: '',
            showOnce: true,
            startDate: null,
            endDate: null
        }
    },

    /**
     * Initialize settings module
     */
    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.populateForm();
    },

    /**
     * Load settings from Firestore
     */
    async loadSettings() {
        try {
            const doc = await db.collection('siteSettings').doc('config').get();

            if (doc.exists) {
                this.settings = this.mergeWithDefaults(doc.data());
            } else {
                // Initialize with defaults
                this.settings = JSON.parse(JSON.stringify(this.defaults));
            }

        } catch (error) {
            console.error('Error loading settings:', error);
            Toast.error('Failed to load settings');
            // Use defaults on error
            this.settings = JSON.parse(JSON.stringify(this.defaults));
        }
    },

    /**
     * Merge loaded data with defaults to ensure all fields exist
     * @param {Object} data
     * @returns {Object}
     */
    mergeWithDefaults(data) {
        const merged = JSON.parse(JSON.stringify(this.defaults));

        Object.keys(merged).forEach(category => {
            if (data[category]) {
                Object.keys(merged[category]).forEach(key => {
                    if (data[category][key] !== undefined) {
                        merged[category][key] = data[category][key];
                    }
                });
            }
        });

        return merged;
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Save button
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Color picker synchronization
        this.bindColorPickers();

        // Logo/favicon upload buttons
        this.bindImageUploads();

        // Track changes
        this.bindFormChanges();

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    /**
     * Bind color picker inputs
     */
    bindColorPickers() {
        // Primary color
        const primaryPicker = document.getElementById('primary-color');
        const primaryHex = document.getElementById('primary-color-hex');

        if (primaryPicker && primaryHex) {
            primaryPicker.addEventListener('input', () => {
                primaryHex.value = primaryPicker.value;
                this.markDirty();
            });

            primaryHex.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(primaryHex.value)) {
                    primaryPicker.value = primaryHex.value;
                }
                this.markDirty();
            });
        }

        // Secondary color
        const secondaryPicker = document.getElementById('secondary-color');
        const secondaryHex = document.getElementById('secondary-color-hex');

        if (secondaryPicker && secondaryHex) {
            secondaryPicker.addEventListener('input', () => {
                secondaryHex.value = secondaryPicker.value;
                this.markDirty();
            });

            secondaryHex.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(secondaryHex.value)) {
                    secondaryPicker.value = secondaryHex.value;
                }
                this.markDirty();
            });
        }
    },

    /**
     * Bind image upload buttons
     */
    bindImageUploads() {
        // Logo upload
        const logoBtn = document.getElementById('upload-logo');
        if (logoBtn) {
            logoBtn.addEventListener('click', () => {
                if (typeof ImagePicker !== 'undefined') {
                    ImagePicker.open((image) => {
                        if (image && image.url) {
                            this.setLogo(image.url);
                        }
                    });
                } else {
                    const url = prompt('Enter logo image URL:');
                    if (url) {
                        this.setLogo(url);
                    }
                }
            });
        }

        // Favicon upload
        const faviconBtn = document.getElementById('upload-favicon');
        if (faviconBtn) {
            faviconBtn.addEventListener('click', () => {
                if (typeof ImagePicker !== 'undefined') {
                    ImagePicker.open((image) => {
                        if (image && image.url) {
                            this.setFavicon(image.url);
                        }
                    });
                } else {
                    const url = prompt('Enter favicon image URL:');
                    if (url) {
                        this.setFavicon(url);
                    }
                }
            });
        }
    },

    /**
     * Set logo image
     * @param {string} url
     */
    setLogo(url) {
        const img = document.getElementById('logo-img');
        const placeholder = document.getElementById('logo-placeholder');
        const urlInput = document.getElementById('logo-url');

        if (img && placeholder && urlInput) {
            img.src = url;
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
            urlInput.value = url;
            this.markDirty();
        }
    },

    /**
     * Set favicon image
     * @param {string} url
     */
    setFavicon(url) {
        const img = document.getElementById('favicon-img');
        const placeholder = document.getElementById('favicon-placeholder');
        const urlInput = document.getElementById('favicon-url');

        if (img && placeholder && urlInput) {
            img.src = url;
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
            urlInput.value = url;
            this.markDirty();
        }
    },

    /**
     * Bind form change events
     */
    bindFormChanges() {
        // All text inputs, textareas, and selects
        document.querySelectorAll('.settings-content input, .settings-content textarea, .settings-content select').forEach(el => {
            el.addEventListener('input', () => this.markDirty());
            el.addEventListener('change', () => this.markDirty());
        });
    },

    /**
     * Mark settings as dirty (unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
        const status = document.getElementById('settings-status');
        if (status) {
            status.textContent = 'Unsaved changes';
            status.classList.remove('text-green-600');
            status.classList.add('text-yellow-600');
        }
    },

    /**
     * Switch between tabs
     * @param {string} tabId
     */
    switchTab(tabId) {
        this.currentTab = tabId;

        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('border-blue-600', 'text-blue-600');
                tab.classList.remove('border-transparent', 'text-gray-500');
            } else {
                tab.classList.remove('border-blue-600', 'text-blue-600');
                tab.classList.add('border-transparent', 'text-gray-500');
            }
        });

        // Show/hide tab content
        document.querySelectorAll('.settings-content').forEach(content => {
            content.classList.add('hidden');
        });

        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    },

    /**
     * Populate form with loaded settings
     */
    populateForm() {
        const s = this.settings;

        // General tab
        this.setInputValue('site-name', s.general.siteName);
        this.setInputValue('tagline', s.general.tagline);
        this.setInputValue('primary-color', s.general.primaryColor);
        this.setInputValue('primary-color-hex', s.general.primaryColor);
        this.setInputValue('secondary-color', s.general.secondaryColor);
        this.setInputValue('secondary-color-hex', s.general.secondaryColor);
        this.setInputValue('footer-text', s.general.footerText);

        // Logo preview
        if (s.general.logoUrl) {
            this.setLogo(s.general.logoUrl);
        }

        // Favicon preview
        if (s.general.faviconUrl) {
            this.setFavicon(s.general.faviconUrl);
        }

        // Contact tab
        this.setInputValue('address', s.contact.address);
        this.setInputValue('phone', s.contact.phone);
        this.setInputValue('email', s.contact.email);
        this.setInputValue('int-phone', s.contact.intPhone);
        this.setInputValue('int-email', s.contact.intEmail);
        this.setInputValue('int-urgent', s.contact.intUrgent);

        // Social & Links tab
        this.setInputValue('facebook-url', s.links.facebookUrl);
        this.setInputValue('parent-portal-url', s.links.parentPortalUrl);
        this.setInputValue('student-portal-url', s.links.studentPortalUrl);
        this.setInputValue('kindo-url', s.links.kindoUrl);
        this.setInputValue('school-app-url', s.links.schoolAppUrl);
        this.setInputValue('theatre-url', s.links.theatreUrl);

        // Homepage tab
        this.setInputValue('hero-video-url', s.homepage.heroVideoUrl);
        this.setInputValue('hero-title', s.homepage.heroTitle);
        this.setInputValue('hero-subtitle', s.homepage.heroSubtitle);
        this.setCheckboxValue('back-to-school-enabled', s.homepage.backToSchoolEnabled);
        this.setInputValue('back-to-school-year', s.homepage.backToSchoolYear);
        this.setCheckboxValue('values-enabled', s.homepage.valuesEnabled);
        this.renderBackToSchoolLinks(s.homepage.backToSchoolLinks);

        // Popup tab
        this.setCheckboxValue('popup-enabled', s.popup.enabled);
        this.setInputValue('popup-title', s.popup.title);
        this.setInputValue('popup-content', s.popup.content);
        this.setCheckboxValue('popup-show-once', s.popup.showOnce);
        this.setInputValue('popup-start', s.popup.startDate);
        this.setInputValue('popup-end', s.popup.endDate);

        // Reset dirty state after populating
        this.isDirty = false;
        const status = document.getElementById('settings-status');
        if (status) {
            status.textContent = '';
        }
    },

    /**
     * Helper to set input value
     * @param {string} id
     * @param {string} value
     */
    setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    },

    /**
     * Helper to set checkbox value
     * @param {string} id
     * @param {boolean} checked
     */
    setCheckboxValue(id, checked) {
        const el = document.getElementById(id);
        if (el) {
            el.checked = checked;
        }
    },

    /**
     * Render back-to-school download links
     * @param {Array} links
     */
    renderBackToSchoolLinks(links) {
        const container = document.getElementById('back-to-school-links');
        if (!container) return;

        let html = '<div class="space-y-3">';

        if (links && links.length > 0) {
            links.forEach((link, index) => {
                html += `
                    <div class="flex items-center gap-2 bts-link" data-index="${index}">
                        <input type="text" class="bts-link-title flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Link Title" value="${Utils.escapeHtml(link.title || '')}">
                        <input type="url" class="bts-link-url flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="URL" value="${Utils.escapeHtml(link.url || '')}">
                        <button onclick="SiteSettings.removeBackToSchoolLink(${index})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            });
        }

        html += `
            </div>
            <button onclick="SiteSettings.addBackToSchoolLink()" class="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
                <i data-feather="plus" class="w-4 h-4 inline-block mr-1"></i>
                Add Download Link
            </button>
        `;

        container.innerHTML = html;
        feather.replace();

        // Bind change events for new inputs
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.markDirty());
        });
    },

    /**
     * Add a back-to-school download link
     */
    addBackToSchoolLink() {
        const links = this.getBackToSchoolLinks();
        links.push({ title: '', url: '' });
        this.renderBackToSchoolLinks(links);
        this.markDirty();
    },

    /**
     * Remove a back-to-school download link
     * @param {number} index
     */
    removeBackToSchoolLink(index) {
        const links = this.getBackToSchoolLinks();
        links.splice(index, 1);
        this.renderBackToSchoolLinks(links);
        this.markDirty();
    },

    /**
     * Get current back-to-school links from form
     * @returns {Array}
     */
    getBackToSchoolLinks() {
        const links = [];
        document.querySelectorAll('.bts-link').forEach(row => {
            const title = row.querySelector('.bts-link-title')?.value || '';
            const url = row.querySelector('.bts-link-url')?.value || '';
            if (title || url) {
                links.push({ title, url });
            }
        });
        return links;
    },

    /**
     * Collect all form data
     * @returns {Object}
     */
    collectFormData() {
        return {
            general: {
                siteName: document.getElementById('site-name')?.value?.trim() || '',
                tagline: document.getElementById('tagline')?.value?.trim() || '',
                logoUrl: document.getElementById('logo-url')?.value || '',
                faviconUrl: document.getElementById('favicon-url')?.value || '',
                primaryColor: document.getElementById('primary-color-hex')?.value || '#1e3a5f',
                secondaryColor: document.getElementById('secondary-color-hex')?.value || '#c9a227',
                footerText: document.getElementById('footer-text')?.value?.trim() || ''
            },
            contact: {
                address: document.getElementById('address')?.value?.trim() || '',
                phone: document.getElementById('phone')?.value?.trim() || '',
                email: document.getElementById('email')?.value?.trim() || '',
                intPhone: document.getElementById('int-phone')?.value?.trim() || '',
                intEmail: document.getElementById('int-email')?.value?.trim() || '',
                intUrgent: document.getElementById('int-urgent')?.value?.trim() || ''
            },
            links: {
                facebookUrl: document.getElementById('facebook-url')?.value?.trim() || '',
                parentPortalUrl: document.getElementById('parent-portal-url')?.value?.trim() || '',
                studentPortalUrl: document.getElementById('student-portal-url')?.value?.trim() || '',
                kindoUrl: document.getElementById('kindo-url')?.value?.trim() || '',
                schoolAppUrl: document.getElementById('school-app-url')?.value?.trim() || '',
                theatreUrl: document.getElementById('theatre-url')?.value?.trim() || ''
            },
            homepage: {
                heroVideoUrl: document.getElementById('hero-video-url')?.value?.trim() || '',
                heroTitle: document.getElementById('hero-title')?.value?.trim() || '',
                heroSubtitle: document.getElementById('hero-subtitle')?.value?.trim() || '',
                backToSchoolEnabled: document.getElementById('back-to-school-enabled')?.checked || false,
                backToSchoolYear: document.getElementById('back-to-school-year')?.value?.trim() || '',
                backToSchoolLinks: this.getBackToSchoolLinks(),
                valuesEnabled: document.getElementById('values-enabled')?.checked ?? true
            },
            popup: {
                enabled: document.getElementById('popup-enabled')?.checked || false,
                title: document.getElementById('popup-title')?.value?.trim() || '',
                content: document.getElementById('popup-content')?.value?.trim() || '',
                showOnce: document.getElementById('popup-show-once')?.checked ?? true,
                startDate: document.getElementById('popup-start')?.value || null,
                endDate: document.getElementById('popup-end')?.value || null
            }
        };
    },

    /**
     * Save settings to Firestore
     */
    async saveSettings() {
        const saveBtn = document.getElementById('save-settings');
        const status = document.getElementById('settings-status');

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        try {
            const data = this.collectFormData();
            data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            await db.collection('siteSettings').doc('config').set(data, { merge: true });

            this.settings = data;
            this.isDirty = false;

            if (status) {
                status.textContent = 'Settings saved!';
                status.classList.remove('text-yellow-600');
                status.classList.add('text-green-600');

                setTimeout(() => {
                    status.textContent = '';
                }, 3000);
            }

            Toast.success('Settings saved successfully');

            // Log activity
            await this.logActivity('update', 'updated site settings');

        } catch (error) {
            console.error('Error saving settings:', error);
            Toast.error('Failed to save settings');

            if (status) {
                status.textContent = 'Error saving';
                status.classList.add('text-red-600');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Settings';
            }
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
    // Check if we're on settings page
    if (!document.querySelector('.settings-tab')) return;

    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user) => {
            if (user) {
                SiteSettings.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                SiteSettings.init();
            }
        });
    }
});


// Export for global use
window.SiteSettings = SiteSettings;
