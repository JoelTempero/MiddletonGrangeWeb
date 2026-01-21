# Firebase Setup Guide for Middleton Grange CMS

This guide walks you through setting up Firebase for the Middleton Grange School CMS.

## Prerequisites

- A Google account
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `middleton-grange-cms` (or your preferred name)
4. Disable Google Analytics (optional, not needed for CMS)
5. Click **"Create project"**

---

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

---

## Step 3: Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your region (closest to New Zealand: `australia-southeast1`)
5. Click **"Enable"**

---

## Step 4: Enable Cloud Storage

1. Go to **Build > Storage**
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Choose the same region as Firestore
5. Click **"Done"**

---

## Step 5: Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click the **Web icon** (`</>`)
4. Register app with nickname: `middleton-cms-admin`
5. Copy the `firebaseConfig` object

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 6: Update Firebase Configuration in CMS

1. Open `admin/js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## Step 7: Deploy Security Rules

### Via Firebase CLI (Recommended)

1. Open terminal in project directory
2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in the project:
   ```bash
   firebase init
   ```
   - Select: Firestore, Storage, Hosting
   - Use existing project: select your project
   - Accept default file names for rules
   - For public directory: enter `build`
   - Configure as single-page app: No

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### Via Firebase Console (Alternative)

**Firestore Rules:**
1. Go to **Firestore Database > Rules**
2. Copy contents of `firestore.rules` from this project
3. Paste and click **Publish**

**Storage Rules:**
1. Go to **Storage > Rules**
2. Copy contents of `storage.rules` from this project
3. Paste and click **Publish**

---

## Step 8: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

Or manually create indexes if prompted when running queries.

---

## Step 9: Create Your First Admin User

### Option A: Via Firebase Console

1. Go to **Authentication > Users**
2. Click **"Add user"**
3. Enter email and a temporary password
4. Note the **User UID** (click on the user row to see it)

5. Go to **Firestore Database**
6. Click **"Start collection"**
7. Collection ID: `users`
8. Document ID: paste the **User UID** from step 4
9. Add fields:
   ```
   email (string): your-email@example.com
   displayName (string): Admin Name
   role (string): admin
   active (boolean): true
   createdAt (timestamp): [click timestamp, select now]
   ```
10. Click **Save**

### Option B: Via Script (after setup)

You can also create the user document programmatically after the first login:

```javascript
// Run in browser console after logging in
const user = firebase.auth().currentUser;
firebase.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    displayName: 'Your Name',
    role: 'admin',
    active: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

---

## Step 10: Initialize Site Settings

Create the initial site settings document:

1. In Firestore, go to collection `siteSettings`
2. Create document with ID: `config`
3. Add initial fields:

```
general:
  siteName (string): "Middleton Grange School"
  tagline (string): "Character, Excellence, Service for the Glory of God"
  primaryColor (string): "#1e3a5f"
  secondaryColor (string): "#c9a227"
  footerText (string): "© Middleton Grange School. All rights reserved."

contact:
  address (string): "30 Donovans Road, Rangiora 7400"
  phone (string): "+64 3 312 8820"
  email (string): "admin@middleton.school.nz"
```

Or simply log in to the admin panel and use the Settings page to configure everything.

---

## Step 11: Configure Firebase Hosting (Optional)

If you want to host the admin panel on Firebase:

1. Update `firebase.json` with your settings
2. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

---

## Step 12: Test Your Setup

1. Open `admin/index.html` in a browser (or serve locally)
2. Log in with your admin credentials
3. Verify you can:
   - View the dashboard
   - Create a new page
   - Upload media
   - Modify settings

---

## Troubleshooting

### "Permission Denied" Errors

- Ensure your user document exists in Firestore `users` collection
- Verify `role` is set to `admin` and `active` is `true`
- Check that the document ID matches your Firebase Auth UID

### "Firebase not configured" Warning

- Verify `firebase-config.js` has real values (not placeholder strings)
- Check browser console for specific error messages

### CORS Errors with Storage

- Ensure Storage rules are deployed
- Check that the file type is allowed in `storage.rules`

### Login Works but Dashboard Shows No Data

- Check Firestore rules are deployed
- Verify you're using the correct project
- Look at browser Network tab for failed requests

---

## Security Checklist

Before going live, verify:

- [ ] Firebase Authentication is enabled (Email/Password)
- [ ] Firestore rules are deployed (not in test mode)
- [ ] Storage rules are deployed with file type restrictions
- [ ] At least one admin user exists in `users` collection
- [ ] API key restrictions are configured in Google Cloud Console
- [ ] Authorized domains are set in Firebase Authentication settings

---

## Project Structure Reference

```
Firebase Collections:
├── users/              # CMS user accounts
├── pages/              # Website pages content
├── menuSections/       # Navigation menu structure
├── media/              # Uploaded file metadata
├── siteSettings/       # Global configuration
│   └── config          # Main settings document
├── activityLog/        # User activity tracking
├── videos/             # Video gallery items
├── staffProfiles/      # Staff directory
└── alumniProfiles/     # Alumni profiles

Firebase Storage:
└── media/              # Uploaded files (images, PDFs, videos)
```

---

## Support

For issues with:
- **Firebase services**: [Firebase Documentation](https://firebase.google.com/docs)
- **CMS functionality**: Check the project README or create an issue

---

## Next Steps

After Firebase is configured:

1. **Stage 10**: Build the Static Site Generator to compile pages
2. **Stage 11**: Migrate existing content from WordPress
