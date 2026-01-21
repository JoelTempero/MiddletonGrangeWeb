# Middleton Grange School CMS

A custom content management system for Middleton Grange School's website, built with Firebase and vanilla JavaScript.

## Overview

This CMS consists of two main parts:

1. **Admin Panel** (`/admin`) - A web-based dashboard where staff can manage pages, content, menus, and site settings
2. **Public Website** (`/public`) - The static school website generated from CMS content

## Tech Stack

### Backend & Database
- **Firebase Firestore** - NoSQL database for all content
- **Firebase Authentication** - User login (email/password)
- **Firebase Storage** - Image and file uploads
- **Firebase Hosting** - Admin panel and public site hosting

### Admin Panel Frontend
- **HTML/CSS/JavaScript** - Vanilla JS, no frameworks
- **Tailwind CSS** - Styling (via CDN)
- **TipTap Editor** - Rich text editing
- **SortableJS** - Drag-and-drop functionality
- **Feather Icons** - Icon library

### Public Website
- **Static HTML/CSS/JS** - Generated from CMS content
- **Tailwind CSS** - Styling
- **Handlebars** - Template rendering (build process)

## Project Structure

```
middleton-grange-cms/
├── admin/                      # Admin panel
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main dashboard
│   ├── pages.html              # Page management
│   ├── page-editor.html        # Edit individual page
│   ├── menu-manager.html       # Menu/navigation editor
│   ├── media-library.html      # Image/file uploads
│   ├── settings.html           # Site settings
│   ├── users.html              # User management (admin only)
│   ├── css/
│   │   ├── admin.css           # Admin-specific styles
│   │   └── editor.css          # TipTap editor styles
│   ├── js/
│   │   ├── firebase-config.js  # Firebase initialization
│   │   ├── auth.js             # Authentication logic
│   │   ├── components.js       # UI component loader
│   │   ├── pages.js            # Page CRUD operations
│   │   ├── editor.js           # Rich text editor setup
│   │   ├── menu.js             # Menu management
│   │   ├── media.js            # File upload handling
│   │   ├── settings.js         # Site settings
│   │   └── users.js            # User management
│   └── components/
│       ├── sidebar.html        # Reusable sidebar nav
│       └── header.html         # Reusable header
├── public/                     # Public website (generated)
│   ├── index.html              # Homepage
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── js/
│   │   └── main.js             # Interactions, popups, etc.
│   └── images/                 # Downloaded/optimized images
├── build/
│   └── generate-site.js        # Node script to generate static site
├── templates/                  # HTML templates for site generation
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore indexes
├── storage.rules               # Storage security rules
├── package.json                # Node dependencies
└── README.md                   # This file
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd middleton-grange-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password provider)
   - Create a Firestore database
   - Enable Storage
   - Copy your Firebase config to `admin/js/firebase-config.js`

4. **Deploy security rules**
   ```bash
   npm run deploy:rules
   ```

5. **Create initial admin user**
   - Manually create a user in Firebase Authentication
   - Add a corresponding document in the `users` collection with `role: "admin"`

### Development

**Start Firebase emulators (recommended for development):**
```bash
npm run emulators
```

**Serve the admin panel locally:**
```bash
npm run serve:admin
```

**Build the public site:**
```bash
npm run build
```

### Deployment

**Deploy everything:**
```bash
npm run deploy
```

**Deploy admin panel only:**
```bash
npm run deploy:admin
```

**Deploy public site only:**
```bash
npm run deploy:public
```

## User Roles

### Admin
- Full access to all features
- Can create, edit, and delete users
- Can modify site settings
- Can manage all content

### Editor
- Can create and edit pages
- Can upload media
- Can manage videos and staff profiles
- Cannot delete pages (only admins)
- Cannot access user management
- Cannot modify critical site settings

## Database Collections

| Collection | Description |
|------------|-------------|
| `pages` | Website pages and their content |
| `menuSections` | Navigation menu structure |
| `siteSettings` | Global site configuration |
| `media` | Uploaded files metadata |
| `users` | CMS user accounts |
| `videos` | Video gallery items |
| `staffProfiles` | Staff member profiles |
| `alumniProfiles` | Alumni profiles |
| `activityLog` | User activity tracking |

## Key Features

- **Rich Text Editor** - Full-featured content editing with TipTap
- **Media Library** - Upload, organize, and manage files
- **Menu Manager** - Drag-and-drop navigation builder
- **Multiple Page Types** - Standard, Video Gallery, Staff Listing, News
- **User Management** - Role-based access control
- **Popup Manager** - Scheduled announcement popups
- **Static Site Generation** - Fast, SEO-friendly public website

## Documentation

For detailed documentation, see:
- `CLAUDE_CODE_INSTRUCTIONS.md` - Technical specifications
- `CMS Rebuilt Blueprint.md` - Content architecture and design
- `SITE_CONTENT.md` - Site content and migration notes

## Support

For issues or questions, contact the school's IT department.

---

**Client:** Middleton Grange School, Christchurch, NZ
**Reference:** [www.middleton.school.nz](https://www.middleton.school.nz/)
