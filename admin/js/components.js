/**
 * Middleton Grange CMS - Component Loader
 *
 * Handles loading and initializing reusable UI components
 * (sidebar, header) across all admin pages.
 */

// Component loader
const Components = {
    /**
     * Load an HTML component from the components directory
     * @param {string} componentName - Name of the component file (without .html)
     * @param {string} targetId - ID of the element to load the component into
     * @returns {Promise<void>}
     */
    async load(componentName, targetId) {
        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }
            const html = await response.text();
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = html;
                // Re-initialize Feather icons in the loaded component
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    },

    /**
     * Initialize all common components and their event listeners
     */
    async init() {
        // Load sidebar and header
        await Promise.all([
            this.load('sidebar', 'sidebar'),
            this.load('header', 'header')
        ]);

        // Initialize component functionality
        this.initSidebar();
        this.initHeader();
        this.highlightCurrentPage();
    },

    /**
     * Initialize sidebar functionality
     */
    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileOverlay = document.getElementById('mobile-overlay');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                mobileOverlay?.classList.toggle('hidden');
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                mobileOverlay.classList.add('hidden');
            });
        }

        // Hide users nav item for non-admins
        this.checkAdminAccess();
    },

    /**
     * Initialize header functionality
     */
    initHeader() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');

        // Toggle user dropdown
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }

        // Update user info in header
        this.updateUserInfo();
    },

    /**
     * Update user information in the header
     */
    async updateUserInfo() {
        // Use Auth module if available for cached user data
        let user, userData;

        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            user = Auth.currentUser;
            userData = Auth.currentUserData || {};
        } else if (typeof auth !== 'undefined' && auth.currentUser) {
            user = auth.currentUser;
            // Fetch user data from Firestore
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                userData = userDoc.exists ? userDoc.data() : {};
            } catch (error) {
                console.error('Error fetching user data:', error);
                userData = {};
            }
        } else {
            return;
        }

        // Update display name
        const displayName = userData.displayName || user.email?.split('@')[0] || 'User';
        const userDisplayNameEl = document.getElementById('user-display-name');
        if (userDisplayNameEl) {
            userDisplayNameEl.textContent = displayName;
        }

        // Update initials
        const initialsEl = document.getElementById('user-initials');
        if (initialsEl) {
            const initials = displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            initialsEl.textContent = initials || 'U';
        }

        // Update email
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl && user.email) {
            userEmailEl.textContent = user.email;
        }

        // Update role badge
        const roleBadgeEl = document.getElementById('user-role-badge');
        if (roleBadgeEl && userData.role) {
            const roleClass = userData.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
            roleBadgeEl.innerHTML = `<span class="px-2 py-0.5 ${roleClass} rounded-full capitalize">${userData.role}</span>`;
        }

        // Store role for later use
        window.currentUserRole = userData.role || 'editor';
    },

    /**
     * Check if user is admin and update UI accordingly
     */
    async checkAdminAccess() {
        // Use Auth module if available
        let isAdmin = false;

        if (typeof Auth !== 'undefined') {
            isAdmin = Auth.isAdmin();
        } else {
            // Fallback: fetch from Firestore
            const user = auth?.currentUser;
            if (user) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    const userData = userDoc.exists ? userDoc.data() : {};
                    isAdmin = userData.role === 'admin';
                } catch (error) {
                    console.error('Error checking admin access:', error);
                }
            }
        }

        // Hide users nav item for non-admins
        const usersNavItem = document.getElementById('users-nav-item');
        if (usersNavItem && !isAdmin) {
            usersNavItem.style.display = 'none';
        }
    },

    /**
     * Highlight the current page in the navigation
     */
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().replace('.html', '') || 'dashboard';

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('data-page');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update breadcrumb
        const currentPageName = document.getElementById('current-page-name');
        if (currentPageName) {
            const pageTitles = {
                'dashboard': 'Dashboard',
                'pages': 'Pages',
                'page-editor': 'Page Editor',
                'media-library': 'Media Library',
                'menu-manager': 'Menu Manager',
                'settings': 'Settings',
                'users': 'Users'
            };
            currentPageName.textContent = pageTitles[currentPage] || 'Dashboard';
        }
    }
};

// Toast notification system
const Toast = {
    container: null,

    init() {
        // Create toast container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'success', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} flex items-center`;

        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'alert-triangle';
        toast.innerHTML = `
            <i data-feather="${icon}" class="w-5 h-5 mr-2"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Initialize feather icon
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // Auto-remove after duration
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
};

// Utility functions
const Utils = {
    /**
     * Format a date for display
     * @param {Date|firebase.firestore.Timestamp} date
     * @returns {string}
     */
    formatDate(date) {
        if (!date) return 'Unknown';

        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = now - d;

        // Less than a minute
        if (diff < 60000) return 'Just now';

        // Less than an hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} minute${mins > 1 ? 's' : ''} ago`;
        }

        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }

        // Default: full date
        return d.toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format file size for display
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate a URL-friendly slug from a string
     * @param {string} text
     * @returns {string}
     */
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '')    // Remove non-word chars
            .replace(/\-\-+/g, '-')      // Replace multiple - with single -
            .replace(/^-+/, '')          // Trim - from start
            .replace(/-+$/, '');         // Trim - from end
    },

    /**
     * Debounce a function
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize components when DOM is ready and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check if Auth module is available (it handles its own initialization)
    // Components will be initialized after auth state is determined
    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user, userData) => {
            if (user) {
                // User is signed in, initialize components
                Components.init();
            }
        });
    } else {
        // Fallback if Auth module isn't loaded yet
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    Components.init();
                }
            });
        }
    }
});

// Export for global use
window.Components = Components;
window.Toast = Toast;
window.Utils = Utils;
