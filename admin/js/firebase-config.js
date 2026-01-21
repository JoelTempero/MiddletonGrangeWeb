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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

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

// Development mode detection
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

// Use Firebase emulators in development (uncomment when using emulators)
if (isDevelopment) {
    // Uncomment the following lines to use Firebase emulators
    // auth.useEmulator('http://localhost:9099');
    // db.useEmulator('localhost', 8080);
    // storage.useEmulator('localhost', 9199);
    console.log('Running in development mode');
}

// Export for use in other modules
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.storage = storage;

console.log('Firebase initialized successfully');
