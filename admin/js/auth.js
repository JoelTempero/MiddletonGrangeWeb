/**
 * Middleton Grange CMS - Authentication Module
 *
 * Handles user authentication, session management, and protected routes.
 */

// ============================================
// AUTH STATE MANAGEMENT
// ============================================

const Auth = {
    currentUser: null,
    currentUserData: null,
    initialized: false,
    listeners: [],

    /**
     * Initialize authentication and set up auth state listener
     */
    init() {
        return new Promise((resolve) => {
            // Set up auth state change listener
            auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;

                if (user) {
                    // User is signed in - fetch their data from Firestore
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            this.currentUserData = { id: user.uid, ...userDoc.data() };

                            // Update last login time
                            await db.collection('users').doc(user.uid).update({
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            // Check if user is active
                            if (this.currentUserData.active === false) {
                                await this.logout();
                                this.showError('Your account has been deactivated. Please contact an administrator.');
                                return;
                            }
                        } else {
                            // User exists in Auth but not in Firestore - sign them out
                            console.warn('User not found in Firestore database');
                            await this.logout();
                            this.showError('Account not found. Please contact an administrator.');
                            return;
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    }
                } else {
                    // User is signed out
                    this.currentUserData = null;
                }

                this.initialized = true;

                // Notify all listeners
                this.listeners.forEach(callback => callback(user, this.currentUserData));

                resolve(user);
            });
        });
    },

    /**
     * Add a listener for auth state changes
     * @param {Function} callback - Function to call when auth state changes
     */
    onAuthStateChange(callback) {
        this.listeners.push(callback);

        // If already initialized, call immediately with current state
        if (this.initialized) {
            callback(this.currentUser, this.currentUserData);
        }
    },

    /**
     * Sign in with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<firebase.User>}
     */
    async login(email, password) {
        try {
            const credential = await auth.signInWithEmailAndPassword(email, password);
            return credential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw this.parseAuthError(error);
        }
    },

    /**
     * Sign out the current user
     */
    async logout() {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    /**
     * Send password reset email
     * @param {string} email
     */
    async sendPasswordReset(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return true;
        } catch (error) {
            console.error('Password reset error:', error);
            throw this.parseAuthError(error);
        }
    },

    /**
     * Update current user's password
     * @param {string} currentPassword - Current password for re-authentication
     * @param {string} newPassword - New password to set
     */
    async updatePassword(currentPassword, newPassword) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        try {
            // Re-authenticate user first
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPassword);
            return true;
        } catch (error) {
            console.error('Update password error:', error);
            throw this.parseAuthError(error);
        }
    },

    /**
     * Check if current user has admin role
     * @returns {boolean}
     */
    isAdmin() {
        return this.currentUserData?.role === 'admin';
    },

    /**
     * Check if current user has at least editor role
     * @returns {boolean}
     */
    isEditor() {
        return ['admin', 'editor'].includes(this.currentUserData?.role);
    },

    /**
     * Get current user's display name
     * @returns {string}
     */
    getDisplayName() {
        if (this.currentUserData?.displayName) {
            return this.currentUserData.displayName;
        }
        if (this.currentUser?.email) {
            return this.currentUser.email.split('@')[0];
        }
        return 'User';
    },

    /**
     * Get current user's initials
     * @returns {string}
     */
    getInitials() {
        const name = this.getDisplayName();
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Parse Firebase auth errors into user-friendly messages
     * @param {Error} error
     * @returns {Error}
     */
    parseAuthError(error) {
        const errorMessages = {
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please try again.',
            'auth/requires-recent-login': 'Please log out and log back in to perform this action.'
        };

        const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
        const newError = new Error(message);
        newError.code = error.code;
        return newError;
    },

    /**
     * Show error message on login page
     * @param {string} message
     */
    showError(message) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            // Update the error message span inside the container
            const errorSpan = errorEl.querySelector('span');
            if (errorSpan) {
                errorSpan.textContent = message;
            } else {
                // Fallback: update innerHTML if no span found
                errorEl.innerHTML = `
                    <div class="flex items-center">
                        <i data-feather="alert-circle" class="w-5 h-5 mr-2"></i>
                        <span>${this.escapeHtml(message)}</span>
                    </div>
                `;
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
            errorEl.classList.remove('hidden');
        }
    },

    /**
     * Hide error message
     */
    hideError() {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
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


// ============================================
// ROUTE PROTECTION
// ============================================

const RouteGuard = {
    /**
     * Protected pages that require authentication
     */
    protectedPages: [
        'dashboard.html',
        'pages.html',
        'page-editor.html',
        'menu-manager.html',
        'media-library.html',
        'settings.html',
        'users.html'
    ],

    /**
     * Admin-only pages
     */
    adminOnlyPages: [
        'users.html'
    ],

    /**
     * Check if current page requires authentication
     * @returns {boolean}
     */
    isProtectedPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return this.protectedPages.includes(currentPage);
    },

    /**
     * Check if current page requires admin role
     * @returns {boolean}
     */
    isAdminOnlyPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return this.adminOnlyPages.includes(currentPage);
    },

    /**
     * Initialize route protection
     */
    init() {
        Auth.onAuthStateChange((user, userData) => {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const isLoginPage = currentPage === 'index.html';

            if (!user) {
                // Not logged in
                if (this.isProtectedPage()) {
                    // Redirect to login
                    window.location.href = 'index.html';
                }
            } else {
                // Logged in
                if (isLoginPage) {
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else if (this.isAdminOnlyPage() && !Auth.isAdmin()) {
                    // Non-admin trying to access admin page
                    window.location.href = 'dashboard.html';
                }
            }
        });
    }
};


// ============================================
// LOGIN PAGE HANDLER
// ============================================

const LoginPage = {
    /**
     * Initialize login page functionality
     */
    init() {
        const loginForm = document.getElementById('login-form');
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        const forgotPasswordModal = document.getElementById('forgot-password-modal');
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        const cancelResetBtn = document.getElementById('cancel-reset');

        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Forgot password link
        if (forgotPasswordLink && forgotPasswordModal) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                forgotPasswordModal.classList.remove('hidden');
            });
        }

        // Cancel reset button
        if (cancelResetBtn && forgotPasswordModal) {
            cancelResetBtn.addEventListener('click', () => {
                forgotPasswordModal.classList.add('hidden');
                this.clearResetForm();
            });
        }

        // Close modal on overlay click
        if (forgotPasswordModal) {
            forgotPasswordModal.addEventListener('click', (e) => {
                if (e.target === forgotPasswordModal) {
                    forgotPasswordModal.classList.add('hidden');
                    this.clearResetForm();
                }
            });
        }

        // Forgot password form submission
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordReset();
            });
        }

        // Toggle password visibility
        const togglePasswordBtn = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        if (togglePasswordBtn && passwordInput) {
            togglePasswordBtn.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                togglePasswordBtn.querySelector('i').setAttribute('data-feather', type === 'password' ? 'eye' : 'eye-off');
                feather.replace();
            });
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitBtn = document.getElementById('login-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation
        if (!email || !password) {
            Auth.showError('Please enter both email and password.');
            return;
        }

        // Show loading state
        Auth.hideError();
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        try {
            await Auth.login(email, password);
            // Redirect will happen automatically via onAuthStateChanged
        } catch (error) {
            Auth.showError(error.message);
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    },

    /**
     * Handle password reset form submission
     */
    async handlePasswordReset() {
        const emailInput = document.getElementById('reset-email');
        const submitBtn = document.getElementById('reset-submit');
        const successMessage = document.getElementById('reset-success');
        const errorMessage = document.getElementById('reset-error');

        const email = emailInput.value.trim();

        // Validation
        if (!email) {
            errorMessage.textContent = 'Please enter your email address.';
            errorMessage.classList.remove('hidden');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        try {
            await Auth.sendPasswordReset(email);
            successMessage.classList.remove('hidden');
            emailInput.value = '';

            // Close modal after 3 seconds
            setTimeout(() => {
                const modal = document.getElementById('forgot-password-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    this.clearResetForm();
                }
            }, 3000);
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    },

    /**
     * Clear the reset password form
     */
    clearResetForm() {
        const emailInput = document.getElementById('reset-email');
        const successMessage = document.getElementById('reset-success');
        const errorMessage = document.getElementById('reset-error');

        if (emailInput) emailInput.value = '';
        if (successMessage) successMessage.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');
    }
};


// ============================================
// INITIALIZATION
// ============================================

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Auth
    await Auth.init();

    // Initialize route protection
    RouteGuard.init();

    // Initialize login page if on login page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') {
        LoginPage.init();
    }
});


// ============================================
// EXPORTS
// ============================================

// Export for global use
window.Auth = Auth;
window.RouteGuard = RouteGuard;
window.LoginPage = LoginPage;
