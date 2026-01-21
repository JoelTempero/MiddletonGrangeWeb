/**
 * Middleton Grange CMS - Firebase Configuration
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDp7BvTWBxH9JT3ueQs4HytaEPUbR2LJC8",
  authDomain: "middleton-grange-a699d.firebaseapp.com",
  projectId: "middleton-grange-a699d",
  storageBucket: "middleton-grange-a699d.firebasestorage.app",
  messagingSenderId: "742516889418",
  appId: "1:742516889418:web:a7c8b4eb76d53be13893b3"
};

// Validate configuration
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" &&
                     firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Development mode detection
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

// Initialize Firebase
let app, auth, db, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    // Connect to emulators FIRST (before any other Firestore operations)
    if (isDevelopment && isConfigured) {
        auth.useEmulator('http://localhost:9099');
        db.useEmulator('localhost', 8080);
        storage.useEmulator('localhost', 9199);
        console.log('%c🔧 Connected to Firebase emulators', 'color: #fcc419;');
    } else {
        // Only enable persistence in production (conflicts with emulators)
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore persistence failed: Multiple tabs open');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore persistence not supported in this browser');
                }
            });
    }

    // Set auth persistence to LOCAL (survives browser restart)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.warn('Auth persistence setting failed:', error);
        });

    console.log('%c✓ Firebase initialized successfully', 'color: #51cf66; font-weight: bold;');

} catch (error) {
    console.error('Firebase initialization failed:', error);

    // Show error on page
    document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-red-50 flex items-center justify-center z-50';
        errorDiv.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
                <div class="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Firebase Configuration Error</h2>
                <p class="text-gray-600 mb-4">
                    The CMS could not connect to Firebase. Please check the configuration in
                    <code class="bg-gray-100 px-2 py-1 rounded">firebase-config.js</code>
                </p>
                <p class="text-sm text-red-600">${error.message}</p>
            </div>
        `;
        body.appendChild(errorDiv);
    });
}

// Export for use in other modules
window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;
window.isFirebaseConfigured = isConfigured;
