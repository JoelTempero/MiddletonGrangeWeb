/**
 * Firebase Admin SDK Client for Static Site Generation
 *
 * Provides read-only access to Firestore for building static pages.
 *
 * Setup:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate new private key"
 * 3. Save the JSON file
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to the file path
 *    OR place the file as 'service-account.json' in the project root
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirebaseClient {
    constructor() {
        this.db = null;
        this.app = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase Admin SDK
     */
    async init() {
        if (this.initialized) return;

        try {
            // Try different ways to get credentials
            let credential = null;

            // Option 1: GOOGLE_APPLICATION_CREDENTIALS environment variable
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                credential = admin.credential.applicationDefault();
            }
            // Option 2: Service account file in project root
            else {
                const serviceAccountPath = path.join(__dirname, '..', '..', 'service-account.json');

                if (fs.existsSync(serviceAccountPath)) {
                    const serviceAccount = require(serviceAccountPath);
                    credential = admin.credential.cert(serviceAccount);
                }
            }

            if (!credential) {
                throw new Error(
                    'Firebase credentials not found.\n' +
                    'Please either:\n' +
                    '  1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable, or\n' +
                    '  2. Place service-account.json in the project root\n\n' +
                    'To get service account credentials:\n' +
                    '  1. Go to Firebase Console > Project Settings > Service Accounts\n' +
                    '  2. Click "Generate new private key"\n' +
                    '  3. Save the JSON file'
                );
            }

            // Initialize the app
            this.app = admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID || undefined
            });

            this.db = admin.firestore();
            this.initialized = true;

        } catch (error) {
            if (error.code === 'app/duplicate-app') {
                // App already initialized
                this.app = admin.app();
                this.db = admin.firestore();
                this.initialized = true;
            } else {
                throw error;
            }
        }
    }

    /**
     * Get a single document by ID
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Object|null}
     */
    async getDocument(collection, docId) {
        this.ensureInitialized();

        const doc = await this.db.collection(collection).doc(docId).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    }

    /**
     * Get all documents from a collection
     * @param {string} collection - Collection name
     * @param {Array} orderBy - Optional array of [field, direction] pairs
     * @param {Array} where - Optional array of [field, operator, value] filters
     * @returns {Array}
     */
    async getCollection(collection, orderBy = [], where = []) {
        this.ensureInitialized();

        let query = this.db.collection(collection);

        // Apply where filters
        where.forEach(([field, operator, value]) => {
            query = query.where(field, operator, value);
        });

        // Apply ordering
        orderBy.forEach(([field, direction]) => {
            query = query.orderBy(field, direction);
        });

        const snapshot = await query.get();
        const documents = [];

        snapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return documents;
    }

    /**
     * Get documents with pagination
     * @param {string} collection - Collection name
     * @param {number} limit - Number of documents to fetch
     * @param {Object} startAfter - Document to start after (for pagination)
     * @returns {Array}
     */
    async getCollectionPaginated(collection, limit = 100, startAfter = null) {
        this.ensureInitialized();

        let query = this.db.collection(collection).limit(limit);

        if (startAfter) {
            query = query.startAfter(startAfter);
        }

        const snapshot = await query.get();
        const documents = [];

        snapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return documents;
    }

    /**
     * Ensure Firebase is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized. Call init() first.');
        }
    }

    /**
     * Cleanup Firebase connection
     */
    async cleanup() {
        if (this.app) {
            await this.app.delete();
            this.initialized = false;
            this.db = null;
            this.app = null;
        }
    }
}

// Export singleton instance
module.exports = new FirebaseClient();
