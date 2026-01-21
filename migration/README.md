# WordPress to Firebase CMS Migration

This tool migrates content from a WordPress XML export to the Firebase CMS.

## Prerequisites

1. **WordPress Export File**: Export your WordPress content via `Tools > Export > All content`
2. **Firebase Service Account**: Download from Firebase Console > Project Settings > Service Accounts
3. **Node.js**: Version 18 or higher

## Installation

Install the required dependencies:

```bash
npm install
```

## Quick Start

### 1. Preview Migration (Dry Run)

Always start with a dry run to review what will be migrated:

```bash
node migration/migrate.js your-export.xml --dry-run --verbose
```

This creates a report in `migration/output/` without making any changes.

### 2. Review Cleaned Content

Check the cleaned HTML files in `migration/output/cleaned-content/` to ensure the content looks correct.

### 3. Run Full Migration

Once satisfied with the preview:

```bash
# Content only (recommended first step)
node migration/migrate.js your-export.xml

# With media download
node migration/migrate.js your-export.xml --download-media

# Full migration with Firebase Storage upload
node migration/migrate.js your-export.xml --download-media --upload-media
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without writing to Firestore |
| `--download-media` | Download media files to local directory |
| `--upload-media` | Upload media to Firebase Storage |
| `--verbose`, `-v` | Show detailed progress |
| `--output`, `-o` | Output directory (default: `migration/output`) |
| `--help`, `-h` | Show help message |

## What Gets Migrated

### Pages
- Title, slug, and content
- Status (published/draft)
- Meta title and description
- Featured images
- Creation and modification dates

### Posts
- Converted to "news" page type
- Categories preserved as metadata
- Same fields as pages

### Media
- Downloaded from WordPress
- Optionally uploaded to Firebase Storage
- URL references updated in content

### Menus
- Converted to menu sections
- Page assignments preserved
- Menu order maintained

## Content Cleaning

The migration tool automatically:

1. **Removes WordPress/Elementor markup** - Strips plugin-specific classes and wrappers
2. **Converts widgets** - Transforms Elementor widgets to semantic HTML
3. **Cleans attributes** - Removes inline styles and data attributes
4. **Fixes structure** - Unwraps unnecessary divs and empty elements
5. **Updates URLs** - Maps old media URLs to new locations

### Supported Elementor Widgets

- Headings → `<h1>`-`<h6>`
- Text Editor → `<div>`
- Images → `<figure>` with `<img>`
- Videos → `<div class="video-embed">`
- Buttons → `<a class="btn">`
- Icon Lists → `<ul>`
- Accordions → `<details>`
- Tabs → Sectioned content
- Galleries → `<div class="image-gallery">`
- Image Boxes → `<article>`

## Migration Output

After running the migration, you'll find:

```
migration/output/
├── migration-report.json    # Full migration statistics
├── cleaned-content/         # Preview of cleaned HTML
│   ├── page-slug.html
│   └── ...
└── media/                   # Downloaded media (if --download-media)
    ├── image1.jpg
    └── ...
```

## Troubleshooting

### "Failed to initialize Firebase"

Ensure you have:
1. Created `service-account.json` in the project root, OR
2. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Media download failures

- Check your internet connection
- Some URLs may no longer be valid
- Review `migration-report.json` for specific errors

### Content formatting issues

1. Run with `--dry-run --verbose` to see processed content
2. Review files in `cleaned-content/` directory
3. Adjust `ContentCleaner` options if needed

## Post-Migration Steps

After migration:

1. **Review content** in the CMS admin panel
2. **Check images** are displaying correctly
3. **Test navigation** and menu structure
4. **Verify links** point to correct pages
5. **Update any hardcoded URLs** in content

## Manual Adjustments

Some content may need manual cleanup:

- Complex Elementor layouts
- Custom shortcodes
- Embedded forms
- Third-party widget content

Review the migration report for pages that may need attention.
