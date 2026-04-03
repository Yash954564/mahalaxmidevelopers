# Social Media Preview (Open Graph & Twitter Cards) Implementation Guide

This document outlines the standard structure for meta tags to ensure proper social media previews (preview images, titles, and descriptions) when URLs from `sz.mahalaxmidevelopers.com` are shared on platforms like Facebook, Twitter (X), LinkedIn, WhatsApp, and Telegram.

## 1. Core Meta Tags Template

Every page should include the following tags within the `<head>` section:

```html
<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Mahalaxmi Developers" />
<meta property="og:url" content="https://sz.mahalaxmidevelopers.com/[PATH_TO_PAGE]" />
<meta property="og:title" content="[PAGE_TITLE]" />
<meta property="og:description" content="[PAGE_DESCRIPTION]" />
<meta property="og:image" content="https://sz.mahalaxmidevelopers.com/[PATH_TO_IMAGE]" />
<meta property="og:image:type" content="image/[TYPE]" /> <!-- e.g., image/jpeg or image/png -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="[IMAGE_ALT_TEXT]" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://sz.mahalaxmidevelopers.com/[PATH_TO_PAGE]" />
<meta name="twitter:title" content="[PAGE_TITLE]" />
<meta name="twitter:description" content="[PAGE_DESCRIPTION]" />
<meta name="twitter:image" content="https://sz.mahalaxmidevelopers.com/[PATH_TO_IMAGE]" />
```

## 2. Page-Specific Specifications

### A. Homepage
- **Image**: Use the company logo.
- **Image URL**: `https://sz.mahalaxmidevelopers.com/assets/images/mahalaxmi-infra-logo.png`
- **Recommended Size**: 1200x630 pixels.

### B. Project Pages (`/projects/`)
- **Image**: Use the specific project banner or high-res thumbnail.
- **Image URL**: Use absolute URLs (e.g., `https://sz.mahalaxmidevelopers.com/assets/images/1772781588_thumb_M-10.jpg`).
- **Description**: Briefly highlight the project status (Ongoing/Upcoming/Completed) and location.

### C. Blog Pages (`/blogs/`)
- **Image**: Use the blog's featured image.
- **Image URL**: Absolute URL.
- **Type**: `og:type` should be `article`.

### D. Plot Pages (`/plots/`)
- **Image**: Use a representative image of the location or the specific plot layout.
- **Fallback**: Use the company logo if no specific image is available.

## 3. Fallback Mechanism
If a specific preview image is not available for a page, always use the default company logo:
`https://sz.mahalaxmidevelopers.com/assets/images/mahalaxmi-infra-logo.png`

## 4. Image Requirements
- **Format**: PNG, JPG, or WebP (PNG/JPG preferred for maximum compatibility).
- **Dimensions**: 
  - Minimum: 200x200 pixels.
  - Recommended: 1200x630 pixels (1.91:1 aspect ratio).
- **Size**: Keep image file size under 1MB for faster crawling.

## 5. Validation Tools
After adding or updating tags, always validate using:
1. **Facebook Sharing Debugger**: [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)
2. **Twitter Card Validator**: [https://cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)
3. **LinkedIn Post Inspector**: [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)
