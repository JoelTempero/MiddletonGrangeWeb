/**
 * Middleton Grange CMS - User Management Module
 *
 * Handles user listing, role management, and account administration.
 * Note: Requires admin privileges to access.
 */

const UserManager = {
    // State
    users: [],
    currentUserId: null,
    editingUserId: null,
    deletingUserId: null,

    /**
     * Initialize user management
     */
    async init() {
        // Check admin access
        if (!this.checkAdminAccess()) {
            return;
        }

        await this.loadUsers();
        this.bindEvents();
        this.render();
    },

    /**
     * Check if current user has admin access
     * @returns {boolean}
     */
    checkAdminAccess() {
        const isAdmin = Auth?.isAdmin?.() || false;

        if (!isAdmin) {
            // Show access denied message
            const notice = document.getElementById('admin-only-notice');
            const tableBody = document.getElementById('users-table-body');
            const inviteBtn = document.getElementById('invite-user-btn');

            if (notice) notice.classList.remove('hidden');
            if (inviteBtn) inviteBtn.classList.add('hidden');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                            <i data-feather="lock" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
                            <p class="text-lg">Access Denied</p>
                            <p class="text-sm">You need administrator privileges to view this page.</p>
                        </td>
                    </tr>
                `;
                feather.replace();
            }

            return false;
        }

        this.currentUserId = Auth?.currentUser?.uid;
        return true;
    },

    /**
     * Load users from Firestore
     */
    async loadUsers() {
        try {
            const snapshot = await db.collection('users')
                .orderBy('createdAt', 'desc')
                .get();

            this.users = [];
            snapshot.forEach(doc => {
                this.users.push({ id: doc.id, ...doc.data() });
            });

        } catch (error) {
            console.error('Error loading users:', error);
            Toast.error('Failed to load users');
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Invite user button
        const inviteBtn = document.getElementById('invite-user-btn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => this.showInviteModal());
        }

        // Invite form
        const inviteForm = document.getElementById('invite-form');
        if (inviteForm) {
            inviteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.inviteUser();
            });
        }

        // Cancel invite
        const cancelInvite = document.getElementById('cancel-invite');
        if (cancelInvite) {
            cancelInvite.addEventListener('click', () => this.hideInviteModal());
        }

        // Edit user form
        const editForm = document.getElementById('edit-user-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUserEdit();
            });
        }

        // Cancel edit
        const cancelEdit = document.getElementById('cancel-edit-user');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.hideEditModal());
        }

        // Delete confirmation
        const cancelDelete = document.getElementById('cancel-delete-user');
        const confirmDelete = document.getElementById('confirm-delete-user');

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }

        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDeleteUser());
        }

        // Modal close on outside click
        ['invite-modal', 'edit-user-modal', 'delete-user-modal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });

        // ESC to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideInviteModal();
                this.hideEditModal();
                this.hideDeleteModal();
            }
        });
    },

    /**
     * Render users table
     */
    render() {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;

        if (this.users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <i data-feather="users" class="w-12 h-12 mx-auto mb-3 text-gray-400"></i>
                        <p class="text-lg">No users found</p>
                        <p class="text-sm">Invite your first user to get started.</p>
                    </td>
                </tr>
            `;
            feather.replace();
            return;
        }

        let html = '';
        this.users.forEach(user => {
            const isCurrentUser = user.id === this.currentUserId;
            const roleClass = user.role === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800';
            const statusClass = user.active !== false
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800';
            const statusText = user.active !== false ? 'Active' : 'Disabled';

            // Get initials
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            const initials = displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

            // Format last login
            const lastLogin = user.lastLogin
                ? Utils.formatDate(user.lastLogin)
                : 'Never';

            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3">
                                ${initials}
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">${Utils.escapeHtml(displayName)}</div>
                                ${isCurrentUser ? '<span class="text-xs text-blue-600">(You)</span>' : ''}
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-500">${Utils.escapeHtml(user.email || 'No email')}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${roleClass} capitalize">${user.role || 'editor'}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">${lastLogin}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <button onclick="UserManager.showEditModal('${user.id}')"
                                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit User">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="UserManager.sendPasswordReset('${user.id}')"
                                    class="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Send Password Reset">
                                <i data-feather="key" class="w-4 h-4"></i>
                            </button>
                            ${!isCurrentUser ? `
                                <button onclick="UserManager.showDeleteModal('${user.id}')"
                                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete User">
                                    <i data-feather="trash-2" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        feather.replace();
    },

    /**
     * Show invite user modal
     */
    showInviteModal() {
        const modal = document.getElementById('invite-modal');
        const form = document.getElementById('invite-form');

        if (form) form.reset();
        if (modal) modal.classList.remove('hidden');

        document.getElementById('invite-email')?.focus();
    },

    /**
     * Hide invite modal
     */
    hideInviteModal() {
        const modal = document.getElementById('invite-modal');
        if (modal) modal.classList.add('hidden');
    },

    /**
     * Invite a new user
     */
    async inviteUser() {
        const email = document.getElementById('invite-email')?.value?.trim();
        const displayName = document.getElementById('invite-name')?.value?.trim();
        const role = document.getElementById('invite-role')?.value || 'editor';

        if (!email || !displayName) {
            Toast.error('Please fill in all required fields');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
            Toast.error('Please enter a valid email address');
            return;
        }

        try {
            // Check if user already exists
            const existingUser = await db.collection('users')
                .where('email', '==', email)
                .get();

            if (!existingUser.empty) {
                Toast.error('A user with this email already exists');
                return;
            }

            // Create user profile in Firestore
            // The actual Firebase Auth account needs to be created via:
            // 1. Firebase Console, or
            // 2. Cloud Functions, or
            // 3. The user signing up themselves

            const newUser = {
                email,
                displayName,
                role,
                active: true,
                pending: true, // Indicates awaiting account creation
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.currentUserId
            };

            const docRef = await db.collection('users').add(newUser);

            // Try to send password reset email (will work if user exists in Auth)
            try {
                await auth.sendPasswordResetEmail(email);
                Toast.success(`Invitation sent to ${email}. They will receive a password setup email.`);
            } catch (authError) {
                // User doesn't exist in Firebase Auth yet
                Toast.success(`User profile created for ${email}. Please create their account in Firebase Console or they can use the sign-up form.`);
            }

            // Add to local list
            this.users.unshift({ id: docRef.id, ...newUser, createdAt: new Date() });

            // Log activity
            await this.logActivity('create', `invited user ${displayName} (${email})`);

            this.hideInviteModal();
            this.render();

        } catch (error) {
            console.error('Error inviting user:', error);
            Toast.error('Failed to invite user. Please try again.');
        }
    },

    /**
     * Show edit user modal
     * @param {string} userId
     */
    showEditModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.editingUserId = userId;

        const modal = document.getElementById('edit-user-modal');
        document.getElementById('edit-user-id').value = userId;
        document.getElementById('edit-name').value = user.displayName || '';
        document.getElementById('edit-role').value = user.role || 'editor';
        document.getElementById('edit-active').checked = user.active !== false;

        if (modal) modal.classList.remove('hidden');
    },

    /**
     * Hide edit modal
     */
    hideEditModal() {
        const modal = document.getElementById('edit-user-modal');
        if (modal) modal.classList.add('hidden');
        this.editingUserId = null;
    },

    /**
     * Save user edit
     */
    async saveUserEdit() {
        if (!this.editingUserId) return;

        const displayName = document.getElementById('edit-name')?.value?.trim();
        const role = document.getElementById('edit-role')?.value || 'editor';
        const active = document.getElementById('edit-active')?.checked ?? true;

        // Prevent demoting yourself
        if (this.editingUserId === this.currentUserId && role !== 'admin') {
            Toast.error('You cannot change your own role');
            return;
        }

        try {
            await db.collection('users').doc(this.editingUserId).update({
                displayName,
                role,
                active,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update local data
            const user = this.users.find(u => u.id === this.editingUserId);
            if (user) {
                user.displayName = displayName;
                user.role = role;
                user.active = active;
            }

            Toast.success('User updated successfully');
            await this.logActivity('update', `updated user ${displayName}`);

            this.hideEditModal();
            this.render();

        } catch (error) {
            console.error('Error updating user:', error);
            Toast.error('Failed to update user');
        }
    },

    /**
     * Send password reset email
     * @param {string} userId
     */
    async sendPasswordReset(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user || !user.email) {
            Toast.error('User email not found');
            return;
        }

        if (!confirm(`Send password reset email to ${user.email}?`)) {
            return;
        }

        try {
            await auth.sendPasswordResetEmail(user.email);
            Toast.success(`Password reset email sent to ${user.email}`);
            await this.logActivity('update', `sent password reset to ${user.displayName || user.email}`);

        } catch (error) {
            console.error('Error sending password reset:', error);

            if (error.code === 'auth/user-not-found') {
                Toast.error('User account not found in authentication system');
            } else {
                Toast.error('Failed to send password reset email');
            }
        }
    },

    /**
     * Show delete user modal
     * @param {string} userId
     */
    showDeleteModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Prevent self-deletion
        if (userId === this.currentUserId) {
            Toast.error('You cannot delete your own account');
            return;
        }

        this.deletingUserId = userId;

        const modal = document.getElementById('delete-user-modal');
        const nameEl = document.getElementById('delete-user-name');

        if (nameEl) {
            nameEl.textContent = user.displayName || user.email || 'this user';
        }

        if (modal) modal.classList.remove('hidden');
    },

    /**
     * Hide delete modal
     */
    hideDeleteModal() {
        const modal = document.getElementById('delete-user-modal');
        if (modal) modal.classList.add('hidden');
        this.deletingUserId = null;
    },

    /**
     * Confirm and delete user
     */
    async confirmDeleteUser() {
        if (!this.deletingUserId) return;

        const user = this.users.find(u => u.id === this.deletingUserId);

        try {
            // Delete from Firestore
            // Note: This doesn't delete from Firebase Auth - that requires Admin SDK
            await db.collection('users').doc(this.deletingUserId).delete();

            // Remove from local array
            this.users = this.users.filter(u => u.id !== this.deletingUserId);

            Toast.success('User deleted from CMS');
            Toast.warning('Note: Firebase Auth account may still exist. Delete it from Firebase Console if needed.');

            await this.logActivity('delete', `deleted user ${user?.displayName || user?.email || this.deletingUserId}`);

            this.hideDeleteModal();
            this.render();

        } catch (error) {
            console.error('Error deleting user:', error);
            Toast.error('Failed to delete user');
        }
    },

    /**
     * Validate email format
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    // Check if we're on users page
    if (!document.getElementById('users-table-body')) return;

    if (typeof Auth !== 'undefined') {
        Auth.onAuthStateChange((user, userData) => {
            if (user) {
                UserManager.init();
            }
        });
    } else if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                UserManager.init();
            }
        });
    }
});


// Export for global use
window.UserManager = UserManager;
