/**
 * Middleton Grange CMS - Firebase Configuration
 *
 * IMPORTANT: Replace the placeholder values below with your actual
 * Firebase project configuration from the Firebase Console.
 *
 * To get your config:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project (or create a new one)
 * 3. Click the gear icon → Project settings
 * 4. Scroll down to "Your apps" → Web app
 * 5. Copy the firebaseConfig object
 */

// Firebase configuration
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Validate configuration
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" &&
                     firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (!isConfigured) {
    console.warn(
        '%c⚠️ Firebase not configured!',
        'color: #ff6b6b; font-size: 14px; font-weight: bold;'
    );
    console.warn(
        'Please update admin/js/firebase-config.js with your Firebase project credentials.\n' +
        'See: https://console.firebase.google.com/'
    );
}

// Initialize Firebase
let app, auth, db, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    // Set auth persistence to LOCAL (survives browser restart)
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.warn('Auth persistence setting failed:', error);
        });

    // Enable Firestore offline persistence (optional but recommended)
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time
                console.warn('Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // The current browser doesn't support persistence
                console.warn('Firestore persistence not supported in this browser');
            }
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

// Development mode detection
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

// Use Firebase emulators in development (uncomment when using emulators)
if (isDevelopment && isConfigured) {
    // Uncomment the following lines to use Firebase emulators
    // auth.useEmulator('http://localhost:9099');
    // db.useEmulator('localhost', 8080);
    // storage.useEmulator('localhost', 9199);
    console.log('%c🔧 Running in development mode', 'color: #fcc419;');
}

// Firestore settings for better performance
if (db) {
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
}

// Export for use in other modules
window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;
window.isFirebaseConfigured = isConfigured;
