# Claude Code Instructions: Middleton Grange School Custom CMS

## Project Overview

**Goal:** Build a custom content management system (CMS) for Middleton Grange School that allows staff to manage their website without WordPress. The system consists of two parts:

1. **Admin Panel** — A web-based dashboard where staff can manage pages, content, menus, and site settings
2. **Static Website** — The public-facing school website generated from the CMS content

**Client:** Middleton Grange School (Christchurch, NZ)
**Reference Site:** https://www.middleton.school.nz/

---

## Technical Stack

### Backend & Database
- **Firebase Firestore** — NoSQL database for all content
- **Firebase Authentication** — User login (email/password)
- **Firebase Storage** — Image and file uploads
- **Firebase Hosting** — Admin panel hosting (optional, can use GitHub Pages)

### Admin Panel Frontend
- **HTML/CSS/JavaScript** — Vanilla JS, no frameworks
- **Tailwind CSS** — For styling (via CDN)
- **TipTap Editor** — Rich text editing (via CDN)
- **Firebase SDK** — For database and auth operations

### Public Website
- **Static HTML/CSS/JS** — Generated from CMS content
- **Tailwind CSS** — For styling
- **GitHub Pages** — Free hosting for the public site

---

## Project Structure

```
middleton-grange-cms/
├── admin/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main dashboard
│   ├── pages.html              # Page management
│   ├── page-editor.html        # Edit individual page
│   ├── menu-manager.html       # Menu/navigation editor
│   ├── media-library.html      # Image/file uploads
│   ├── settings.html           # Site settings
│   ├── users.html              # User management (admin only)
│   ├── css/
│   │   └── admin.css           # Admin-specific styles
│   ├── js/
│   │   ├── firebase-config.js  # Firebase initialization
│   │   ├── auth.js             # Authentication logic
│   │   ├── pages.js            # Page CRUD operations
│   │   ├── editor.js           # Rich text editor setup
│   │   ├── menu.js             # Menu management
│   │   ├── media.js            # File upload handling
│   │   ├── settings.js         # Site settings
│   │   └── users.js            # User management
│   └── components/
│       ├── sidebar.html        # Reusable sidebar nav
│       └── header.html         # Reusable header
├── public/
│   ├── index.html              # Homepage
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── js/
│   │   └── main.js             # Interactions, popups, etc.
│   ├── images/                 # Downloaded/optimized images
│   └── [generated pages]       # Created by build process
├── build/
│   └── generate-site.js        # Node script to generate static site
├── firebase.json               # Firebase configuration
├── firestore.rules             # Security rules
├── storage.rules               # Storage security rules
├── package.json                # Node dependencies for build
└── README.md                   # Project documentation
```

---

## Firebase Database Schema

### Collection: `pages`
```javascript
{
  id: "about-us",                    // Auto-generated or slug-based
  title: "About Us",
  slug: "about-us",                  // URL path
  content: "<p>Rich HTML content</p>",
  headerImage: "https://storage.googleapis.com/...",
  headerImageAlt: "Students in classroom",
  pageType: "standard",              // standard | video-gallery | staff-listing | news
  parentPage: null,                  // For nested pages, reference parent slug
  menuSection: "about-mgs",          // Which menu section this belongs to
  menuOrder: 2,                      // Order within menu section
  showInMenu: true,
  metaDescription: "Learn about Middleton Grange School...",
  isPublished: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "user-id",
  updatedBy: "user-id"
}
```

### Collection: `menuSections`
```javascript
{
  id: "about-mgs",
  title: "About MGS",
  order: 1,
  description: "About Middleton Grange",  // Shown in mega menu
  isVisible: true
}
```

### Collection: `siteSettings`
```javascript
// Document ID: "general"
{
  siteName: "Middleton Grange School",
  tagline: "Character, Excellence, Service for the Glory of God",
  logoUrl: "https://storage.googleapis.com/...",
  faviconUrl: "https://storage.googleapis.com/...",
  primaryColor: "#1e3a5f",
  secondaryColor: "#c9a227",
  footerText: "© Middleton Grange School. All rights reserved.",
  
  // Contact info
  address: "30 Acacia Ave, Upper Riccarton, Christchurch 8041",
  phone: "+64 (03) 348 9826",
  email: "office@middleton.school.nz",
  
  // Social links
  facebookUrl: "https://www.facebook.com/Middletongrangeschool/",
  
  // External links (Quick Links)
  parentPortalUrl: "https://middleton.school.kiwi/",
  studentPortalUrl: "https://middletonschoolnz.sharepoint.com/teams/home",
  kindoUrl: "https://shop.tgcl.co.nz/...",
  schoolAppUrl: "http://middletongrange.apps.school.nz/share/"
}

// Document ID: "homepage"
{
  heroVideoUrl: "https://...",
  heroTitle: "Welcome to Middleton Grange School",
  heroSubtitle: "Middleton Grange School is known for...",
  
  // Back to School section
  backToSchoolEnabled: true,
  backToSchoolYear: "2026",
  backToSchoolLinks: [
    { label: "Years 1-6", url: "https://..." },
    { label: "Years 7-10", url: "https://..." },
    { label: "Years 11-13", url: "https://..." },
    { label: "International College", url: "https://..." }
  ],
  
  // Open Day Videos
  openDayVideos: [
    { title: "Primary School Open Day", videoUrl: "https://..." },
    { title: "Middle School Open Day", videoUrl: "https://..." },
    { title: "Senior College Open Day", videoUrl: "https://..." }
  ],
  
  // Values section (Character, Excellence, Service, Glory)
  valuesEnabled: true
}

// Document ID: "popup"
{
  enabled: false,
  title: "Important Notice",
  content: "<p>School is closed tomorrow due to weather.</p>",
  showOnce: true,                    // Only show once per session
  startDate: Timestamp,              // Optional: when to start showing
  endDate: Timestamp                 // Optional: when to stop showing
}
```

### Collection: `media`
```javascript
{
  id: "auto-generated",
  filename: "school-photo.jpg",
  originalName: "IMG_1234.jpg",
  url: "https://storage.googleapis.com/...",
  thumbnailUrl: "https://storage.googleapis.com/.../thumb_...",
  mimeType: "image/jpeg",
  size: 245000,                      // bytes
  width: 1920,
  height: 1080,
  alt: "Students playing sports",
  uploadedAt: Timestamp,
  uploadedBy: "user-id"
}
```

### Collection: `users`
```javascript
{
  id: "firebase-auth-uid",
  email: "admin@middleton.school.nz",
  displayName: "John Smith",
  role: "admin",                     // admin | editor
  isActive: true,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

### Collection: `videos` (for Video Gallery pages)
```javascript
{
  id: "auto-generated",
  title: "School Production 2024",
  youtubeId: "dQw4w9WgXcQ",
  description: "Highlights from our annual production",
  year: 2024,
  category: "productions",           // productions | sport | events
  order: 1,
  isPublished: true,
  createdAt: Timestamp
}
```

### Collection: `staffProfiles` (for Staff Listing pages)
```javascript
{
  id: "auto-generated",
  name: "Mr Gregg Le Roux",
  title: "Principal",
  photo: "https://storage.googleapis.com/...",
  department: "leadership",          // leadership | primary | middle | senior | international
  order: 1,
  email: "g.leroux@middleton.school.nz",  // Optional
  bio: "",                           // Optional extended bio
  isPublished: true
}
```

---

## User Roles & Permissions

### Admin
- Full access to everything
- Can create/edit/delete users
- Can modify site settings
- Can manage all pages and content

### Editor
- Can create/edit pages
- Can upload media
- Can manage videos and staff profiles
- Cannot access user management
- Cannot modify critical site settings

---

## Admin Panel Features

### 1. Authentication (auth.js)
- Email/password login via Firebase Auth
- Session persistence
- Protected routes (redirect to login if not authenticated)
- Logout functionality
- Password reset via Firebase

### 2. Dashboard (dashboard.html)
- Overview stats: total pages, published pages, draft pages
- Recent activity log
- Quick actions: New Page, View Site
- System status

### 3. Pages Management (pages.html)
**List View:**
- Table showing: Title, Slug, Status (Published/Draft), Menu Section, Last Updated
- Search/filter by title
- Filter by menu section
- Filter by status
- Sort by title, date, menu order
- Bulk actions: Publish, Unpublish, Delete

**Actions:**
- Create new page
- Edit page
- Duplicate page
- Delete page (with confirmation)
- Preview page

### 4. Page Editor (page-editor.html)
**Fields:**
- Title (text input)
- Slug (auto-generated from title, editable)
- Header Image (image picker from media library)
- Header Image Alt Text
- Content (TipTap rich text editor)
- Page Type (dropdown: Standard, Video Gallery, Staff Listing, News)
- Menu Section (dropdown)
- Menu Order (number)
- Show in Menu (checkbox)
- Meta Description (textarea)
- Published (toggle)

**Rich Text Editor Features (TipTap):**
- Headings (H2, H3, H4)
- Bold, Italic, Underline
- Bullet lists, Numbered lists
- Links (internal page picker + external URL)
- Images (insert from media library)
- Blockquotes
- Horizontal rule
- Undo/Redo

**Actions:**
- Save Draft
- Publish
- Preview
- Delete

### 5. Menu Manager (menu-manager.html)
**Features:**
- List all menu sections with drag-to-reorder
- Expand section to see pages within
- Drag pages to reorder within section
- Drag pages between sections
- Add new menu section
- Edit section title/description
- Delete section (must be empty)
- Toggle section visibility

**Visual:**
- Tree-like structure showing hierarchy
- Drag handles for reordering
- Inline edit for section names

### 6. Media Library (media-library.html)
**Features:**
- Grid view of all uploaded images/files
- Upload new files (drag & drop + file picker)
- Search by filename
- Filter by type (images, PDFs, videos)
- Sort by date, name, size
- Select and delete multiple files
- Click to view details and copy URL
- Edit alt text

**Upload:**
- Accept: images (jpg, png, gif, webp), PDFs, videos (mp4)
- Max file size: 10MB
- Auto-generate thumbnails for images
- Unique filename generation to prevent conflicts

### 7. Site Settings (settings.html)
**General Tab:**
- Site name
- Tagline
- Logo upload
- Favicon upload
- Primary color picker
- Secondary color picker

**Contact Tab:**
- Address
- Phone
- Email
- International College contact details

**Social & Links Tab:**
- Facebook URL
- Parent Portal URL
- Student Portal URL
- KINDO URL
- School App URL
- The Grange Theatre URL

**Homepage Tab:**
- Hero video URL
- Hero title
- Hero subtitle
- Back to School section toggle and links
- Open Day videos management
- Values section toggle

**Popup Tab:**
- Enable/disable popup
- Popup title
- Popup content (rich text)
- Show once per session toggle
- Start/end date (optional scheduling)

### 8. User Management (users.html) — Admin Only
**Features:**
- List all users: Email, Name, Role, Last Login, Status
- Invite new user (sends email via Firebase)
- Edit user role
- Deactivate/reactivate user
- Delete user

---

## Public Website Generation

### Build Process (generate-site.js)
A Node.js script that:

1. **Connects to Firebase** and fetches all content
2. **Generates static HTML** for each page using templates
3. **Builds navigation** from menuSections and pages
4. **Creates homepage** with dynamic content from settings
5. **Handles special page types** (video gallery, staff listing)
6. **Copies static assets** (CSS, JS, images)
7. **Outputs to `/public` directory** ready for deployment

### Templates
Create HTML template files with placeholders:

```html
<!-- templates/page.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{pageTitle}} - {{siteName}}</title>
    <meta name="description" content="{{metaDescription}}">
    <link rel="icon" href="{{faviconUrl}}">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    {{> header}}
    
    <main>
        {{#if headerImage}}
        <div class="hero-image">
            <img src="{{headerImage}}" alt="{{headerImageAlt}}">
            <h1>{{pageTitle}}</h1>
        </div>
        {{/if}}
        
        <article class="content">
            {{{content}}}
        </article>
    </main>
    
    {{> footer}}
    
    {{#if popupEnabled}}
    {{> popup}}
    {{/if}}
    
    <script src="/js/main.js"></script>
</body>
</html>
```

### Special Page Type Templates

**Video Gallery:**
```html
<!-- templates/video-gallery.html -->
<div class="video-grid">
    {{#each videos}}
    <div class="video-card">
        <div class="video-embed">
            <iframe src="https://www.youtube.com/embed/{{youtubeId}}" allowfullscreen></iframe>
        </div>
        <h3>{{title}}</h3>
        <p>{{description}}</p>
    </div>
    {{/each}}
</div>
```

**Staff Listing:**
```html
<!-- templates/staff-listing.html -->
<div class="staff-grid">
    {{#each staff}}
    <div class="staff-card">
        <img src="{{photo}}" alt="{{name}}">
        <h3>{{name}}</h3>
        <p class="title">{{title}}</p>
    </div>
    {{/each}}
</div>
```

---

## Implementation Order

### Phase 1: Firebase Setup
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Set up security rules
6. Create initial admin user manually

### Phase 2: Admin Panel - Core
1. Create project structure
2. Build login page with Firebase Auth
3. Build dashboard layout (sidebar, header)
4. Implement auth guards for protected pages

### Phase 3: Admin Panel - Pages
1. Build pages list view
2. Build page editor with TipTap
3. Implement CRUD operations
4. Add page preview functionality

### Phase 4: Admin Panel - Media
1. Build media library grid view
2. Implement file upload to Firebase Storage
3. Add image picker modal for editor
4. Implement delete functionality

### Phase 5: Admin Panel - Menu
1. Build menu manager interface
2. Implement drag-and-drop reordering
3. Add section management

### Phase 6: Admin Panel - Settings
1. Build settings forms
2. Implement save/load for each section
3. Add color pickers
4. Build homepage settings
5. Build popup manager

### Phase 7: Admin Panel - Users (Admin only)
1. Build user list
2. Implement invite flow
3. Add role management

### Phase 8: Public Site Templates
1. Design and build base HTML/CSS
2. Create page templates
3. Create component partials (header, footer, nav)
4. Build special page type templates

### Phase 9: Build System
1. Create Node.js build script
2. Implement template rendering
3. Test full site generation

### Phase 10: Content Migration
1. Import all existing pages from reference document
2. Upload all images to Firebase Storage
3. Configure all settings
4. Test entire site

---

## Design Guidelines for Public Site

### Visual Style
- **Modern and clean** — improve upon the current WordPress site
- **Mobile-first responsive** design
- **Consistent spacing** using Tailwind utilities
- **Professional typography** — clear hierarchy
- **Brand colors** — Use the school's blue and gold

### Header
- Fixed/sticky header on scroll
- Logo on left
- Horizontal mega-menu navigation
- Quick Links button on right
- Mobile: hamburger menu

### Footer
- 4-column layout on desktop
- Contact info, quick links, social, map
- Copyright and credits at bottom
- Responsive collapse on mobile

### Page Layouts
- Full-width header images with overlay text
- Contained content width (max-w-4xl or similar)
- Sidebar navigation for section pages (optional)
- Breadcrumbs for navigation context

### Special Components
- Video cards with YouTube embeds
- Staff profile cards with photos
- News/announcement cards
- Image galleries with lightbox
- Popup/modal for announcements

---

## Firebase Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isEditor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
    
    // Pages - editors can read/write, public can read published
    match /pages/{pageId} {
      allow read: if true;  // Public can read for site generation
      allow write: if isEditor();
    }
    
    // Menu sections
    match /menuSections/{sectionId} {
      allow read: if true;
      allow write: if isEditor();
    }
    
    // Site settings
    match /siteSettings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Media
    match /media/{mediaId} {
      allow read: if true;
      allow write: if isEditor();
    }
    
    // Users - only admins can manage
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Videos
    match /videos/{videoId} {
      allow read: if true;
      allow write: if isEditor();
    }
    
    // Staff profiles
    match /staffProfiles/{profileId} {
      allow read: if true;
      allow write: if isEditor();
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{allPaths=**} {
      allow read: if true;  // Public read for images
      allow write: if request.auth != null;  // Authenticated users can upload
    }
  }
}
```

---

## Key Libraries & CDN Links

```html
<!-- Tailwind CSS -->
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-storage-compat.js"></script>

<!-- TipTap Editor (via bundled version or Skypack) -->
<script type="module">
  import { Editor } from 'https://esm.sh/@tiptap/core'
  import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
  import Image from 'https://esm.sh/@tiptap/extension-image'
  import Link from 'https://esm.sh/@tiptap/extension-link'
</script>

<!-- SortableJS for drag-and-drop -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

<!-- Icons (Heroicons or similar) -->
<script src="https://unpkg.com/feather-icons"></script>
```

---

## Testing Checklist

### Admin Panel
- [ ] Login works with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout clears session
- [ ] Protected pages redirect to login
- [ ] Can create new page
- [ ] Can edit existing page
- [ ] Can delete page
- [ ] Rich text editor works (all formatting options)
- [ ] Can upload images
- [ ] Can insert images into content
- [ ] Can reorder menu items
- [ ] Can save site settings
- [ ] Popup settings work
- [ ] Can manage users (admin only)
- [ ] Editor role restrictions work

### Public Site
- [ ] All pages render correctly
- [ ] Navigation works on desktop
- [ ] Navigation works on mobile
- [ ] Images load correctly
- [ ] Videos embed correctly
- [ ] Popup displays when enabled
- [ ] Links work (internal and external)
- [ ] Footer contact info correct
- [ ] Responsive on all breakpoints

### Build Process
- [ ] Script connects to Firebase
- [ ] All pages generated
- [ ] Navigation generated correctly
- [ ] Special page types render
- [ ] Assets copied correctly
- [ ] Output is valid HTML

---

## Notes for Claude Code

1. **Start with the admin panel** — get the CRUD operations working first before worrying about the public site design.

2. **Use Firebase emulators** during development to avoid hitting production database.

3. **Keep it simple** — vanilla JS is fine, no need for complex state management. Each page can be relatively self-contained.

4. **TipTap setup** can be tricky with ES modules — if issues arise, consider using Quill.js as a simpler alternative.

5. **Reference the SITE_CONTENT.md document** for all the actual content, page structure, URLs, and assets to migrate.

6. **The public site design should be "inspired by but improved"** — cleaner, more modern than the current WordPress site, but maintaining the school's brand identity.

7. **Mobile-first** — test everything on mobile viewport first.

8. **Incremental progress** — commit frequently, test each feature before moving to the next.

---

## Questions to Resolve with Joel

1. Firebase project name / configuration details?
2. Initial admin user email?
3. Preferred domain for admin panel?
4. Any specific design preferences beyond "cleaner and modern"?
5. Priority pages to build first for demo?
