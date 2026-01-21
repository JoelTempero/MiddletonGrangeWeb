/**
 * Middleton Grange CMS - Dashboard Module
 *
 * Handles loading and displaying dashboard statistics,
 * recent activity, and quick actions.
 */

const Dashboard = {
    /**
     * Initialize the dashboard
     */
    init() {
        // Check if Firebase is configured
        this.checkFirebaseConfig();

        // Load all dashboard data
        this.loadStats();
        this.loadRecentPages();
        this.loadRecentActivity();
        this.updateWelcomeName();
        this.initBuildButton();

        // Show users card for admins
        this.checkAdminFeatures();
    },

    /**
     * Check if Firebase is properly configured
     */
    checkFirebaseConfig() {
        const warningEl = document.getElementById('firebase-warning');
        if (warningEl && typeof isFirebaseConfigured !== 'undefined' && !isFirebaseConfigured) {
            warningEl.classList.remove('hidden');
            // Re-initialize feather icons for the warning
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    },

    /**
     * Update welcome message with user's name
     */
    updateWelcomeName() {
        const welcomeEl = document.getElementById('welcome-name');
        if (welcomeEl) {
            if (typeof Auth !== 'undefined' && Auth.currentUserData) {
                const firstName = Auth.getDisplayName().split(' ')[0];
                welcomeEl.textContent = firstName;
            } else {
                // Fallback: wait for auth and try again
                Auth?.onAuthStateChange((user, userData) => {
                    if (userData) {
                        const firstName = (userData.displayName || user.email.split('@')[0]).split(' ')[0];
                        welcomeEl.textContent = firstName;
                    }
                });
            }
        }
    },

    /**
     * Check and enable admin-only features
     */
    checkAdminFeatures() {
        const usersCard = document.getElementById('stat-users-card');

        if (typeof Auth !== 'undefined') {
            Auth.onAuthStateChange((user, userData) => {
                if (userData?.role === 'admin' && usersCard) {
                    usersCard.classList.remove('hidden');
                    this.loadUserCount();
                }
            });
        }
    },

    /**
     * Load all dashboard statistics
     */
    async loadStats() {
        try {
            // Load page stats in parallel
            const [totalPages, publishedPages, draftPages, mediaCount, menuSections] = await Promise.all([
                this.getCollectionCount('pages'),
                this.getCollectionCount('pages', [['status', '==', 'published']]),
                this.getCollectionCount('pages', [['status', '==', 'draft']]),
                this.getCollectionCount('media'),
                this.getCollectionCount('menuSections')
            ]);

            // Update UI
            this.updateStat('stat-total-pages', totalPages);
            this.updateStat('stat-published', publishedPages);
            this.updateStat('stat-drafts', draftPages);
            this.updateStat('stat-media', mediaCount);
            this.updateStat('stat-menu-sections', menuSections);

            // Load last build time
            this.loadLastBuildTime();

        } catch (error) {
            console.error('Error loading stats:', error);
            // Show zeros on error
            ['stat-total-pages', 'stat-published', 'stat-drafts', 'stat-media', 'stat-menu-sections'].forEach(id => {
                this.updateStat(id, 0);
            });
        }
    },

    /**
     * Load user count (admin only)
     */
    async loadUserCount() {
        try {
            const count = await this.getCollectionCount('users');
            this.updateStat('stat-users', count);
        } catch (error) {
            console.error('Error loading user count:', error);
            this.updateStat('stat-users', 0);
        }
    },

    /**
     * Load last build time from site settings
     */
    async loadLastBuildTime() {
        try {
            const settingsDoc = await db.collection('siteSettings').doc('config').get();
            const lastBuildEl = document.getElementById('stat-last-build');

            if (settingsDoc.exists && settingsDoc.data().lastBuild && lastBuildEl) {
                const lastBuild = settingsDoc.data().lastBuild;
                lastBuildEl.textContent = `Built ${Utils.formatDate(lastBuild)}`;
            }
        } catch (error) {
            console.error('Error loading last build time:', error);
        }
    },

    /**
     * Get count of documents in a collection
     * @param {string} collectionName
     * @param {Array} filters - Optional array of [field, operator, value] filters
     * @returns {Promise<number>}
     */
    async getCollectionCount(collectionName, filters = []) {
        let query = db.collection(collectionName);

        // Apply filters
        filters.forEach(([field, operator, value]) => {
            query = query.where(field, operator, value);
        });

        const snapshot = await query.get();
        return snapshot.size;
    },

    /**
     * Update a stat element with animation
     * @param {string} elementId
     * @param {number} value
     */
    updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate the number
            this.animateNumber(element, 0, value, 500);
        }
    },

    /**
     * Animate a number from start to end
     * @param {HTMLElement} element
     * @param {number} start
     * @param {number} end
     * @param {number} duration
     */
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * Load recently modified pages
     */
    async loadRecentPages() {
        const tableBody = document.getElementById('recent-pages');
        if (!tableBody) return;

        try {
            const snapshot = await db.collection('pages')
                .orderBy('updatedAt', 'desc')
                .limit(5)
                .get();

            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                            <i data-feather="file-text" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                            <p>No pages yet. <a href="page-editor.html" class="text-blue-600 hover:underline">Create your first page</a></p>
                        </td>
                    </tr>
                `;
                feather.replace();
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const page = { id: doc.id, ...doc.data() };
                const statusClass = page.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800';

                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <i data-feather="file-text" class="w-4 h-4 text-gray-400 mr-3"></i>
                                <div>
                                    <div class="font-medium text-gray-900">${Utils.escapeHtml(page.title || 'Untitled')}</div>
                                    <div class="text-sm text-gray-500">/${page.slug || ''}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass} capitalize">
                                ${page.status || 'draft'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                            ${Utils.formatDate(page.updatedAt)}
                        </td>
                        <td class="px-6 py-4">
                            <a href="page-editor.html?id=${page.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Edit
                            </a>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html;
            feather.replace();

        } catch (error) {
            console.error('Error loading recent pages:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-red-500">
                        Error loading pages. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Load recent activity from activity log
     */
    async loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        try {
            // Try to load from activityLog collection
            const snapshot = await db.collection('activityLog')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            if (snapshot.empty) {
                // No activity log yet - show helpful message
                activityList.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        <i data-feather="activity" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-sm">Activity will appear here as you make changes</p>
                    </div>
                `;
                feather.replace();
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const activity = doc.data();
                const icon = this.getActivityIcon(activity.action);
                const iconColor = this.getActivityColor(activity.action);

                html += `
                    <div class="flex items-start space-x-3">
                        <div class="p-2 ${iconColor} rounded-full flex-shrink-0">
                            <i data-feather="${icon}" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                <span class="font-medium">${Utils.escapeHtml(activity.userName || 'Someone')}</span>
                                ${Utils.escapeHtml(activity.description || activity.action)}
                            </p>
                            <p class="text-xs text-gray-500">${Utils.formatDate(activity.timestamp)}</p>
                        </div>
                    </div>
                `;
            });

            activityList.innerHTML = html;
            feather.replace();

        } catch (error) {
            console.error('Error loading activity:', error);
            // Show fallback based on recent pages
            this.loadActivityFromPages();
        }
    },

    /**
     * Fallback: Generate activity from recent page changes
     */
    async loadActivityFromPages() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        try {
            const snapshot = await db.collection('pages')
                .orderBy('updatedAt', 'desc')
                .limit(5)
                .get();

            if (snapshot.empty) {
                activityList.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        <i data-feather="activity" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-sm">No recent activity</p>
                    </div>
                `;
                feather.replace();
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const page = doc.data();
                html += `
                    <div class="flex items-start space-x-3">
                        <div class="p-2 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
                            <i data-feather="edit-2" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                Page updated: <span class="font-medium">${Utils.escapeHtml(page.title || 'Untitled')}</span>
                            </p>
                            <p class="text-xs text-gray-500">${Utils.formatDate(page.updatedAt)}</p>
                        </div>
                    </div>
                `;
            });

            activityList.innerHTML = html;
            feather.replace();

        } catch (error) {
            console.error('Error loading activity fallback:', error);
            activityList.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <p class="text-sm">Unable to load activity</p>
                </div>
            `;
        }
    },

    /**
     * Get icon for activity type
     * @param {string} action
     * @returns {string}
     */
    getActivityIcon(action) {
        const icons = {
            'create': 'plus-circle',
            'update': 'edit-2',
            'delete': 'trash-2',
            'publish': 'check-circle',
            'unpublish': 'eye-off',
            'upload': 'upload',
            'login': 'log-in',
            'logout': 'log-out',
            'build': 'globe'
        };
        return icons[action] || 'activity';
    },

    /**
     * Get color class for activity type
     * @param {string} action
     * @returns {string}
     */
    getActivityColor(action) {
        const colors = {
            'create': 'bg-green-100 text-green-600',
            'update': 'bg-blue-100 text-blue-600',
            'delete': 'bg-red-100 text-red-600',
            'publish': 'bg-green-100 text-green-600',
            'unpublish': 'bg-yellow-100 text-yellow-600',
            'upload': 'bg-purple-100 text-purple-600',
            'login': 'bg-indigo-100 text-indigo-600',
            'logout': 'bg-gray-100 text-gray-600',
            'build': 'bg-teal-100 text-teal-600'
        };
        return colors[action] || 'bg-gray-100 text-gray-600';
    },

    /**
     * Initialize build site button
     */
    initBuildButton() {
        const buildBtn = document.getElementById('build-site-btn');
        if (buildBtn) {
            buildBtn.addEventListener('click', () => this.triggerBuild());
        }
    },

    /**
     * Trigger site build (placeholder - actual build would be server-side)
     */
    async triggerBuild() {
        const buildBtn = document.getElementById('build-site-btn');
        const lastBuildEl = document.getElementById('stat-last-build');

        if (!buildBtn) return;

        // Show loading state
        buildBtn.disabled = true;
        buildBtn.innerHTML = '<i data-feather="loader" class="w-4 h-4 animate-spin"></i>';
        feather.replace();

        try {
            // Update last build timestamp in Firestore
            await db.collection('siteSettings').doc('config').set({
                lastBuild: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Log activity
            await this.logActivity('build', 'triggered a site build');

            // Show success
            if (lastBuildEl) {
                lastBuildEl.textContent = 'Built just now';
            }

            Toast.success('Site build triggered successfully!');

        } catch (error) {
            console.error('Build error:', error);
            Toast.error('Failed to trigger build. Please try again.');
        } finally {
            // Reset button
            buildBtn.disabled = false;
            buildBtn.innerHTML = 'Build';
        }
    },

    /**
     * Log an activity to the activity log
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

// Initialize dashboard when DOM is ready and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user) => {
            if (user) {
                Dashboard.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                Dashboard.init();
            }
        });
    }
});


// Export for global use
window.Dashboard = Dashboard;
