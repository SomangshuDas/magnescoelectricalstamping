# Magnesco Electrical Stamping — Corporate Website & Production Dashboard

This repository contains the source for the corporate website of **Magnesco
Electrical Stamping Pvt. Ltd.**, along with the **MAGNESCO Production
Management System Dashboard** (`dashboard/`) used internally for production
tracking and Android app distribution.

## ⚠️ Important — Public Repository Notice

This repository is public **only because GitHub Pages requires public
repositories for free static hosting**. It is **not published for reuse,
contribution, or distribution**. The content, code, and assets here are
proprietary and intended solely for the operation of this specific website
and dashboard.

**Do not** copy, fork for reuse, redistribute, or repurpose any part of this
repository. See [LICENSE](./LICENSE) for full terms — in short: all rights
reserved, viewing the source is permitted incidentally as a result of static
hosting, nothing more.

## Project Structure

```
magnescoelectricalstamping/
├── index.html                          # Home page
├── products.html                       # Product catalog
├── product-*.html                      # Individual product application pages
├── facilities.html                     # Infrastructure & facilities
├── customers.html                      # Major customers
├── media.html                          # Quality & compliance media
├── contact.html                        # Contact directory & locations
├── css/style.css                       # Shared stylesheet for the public site
├── js/main.js                          # Shared site behaviour (nav, carousel, filters, reveal)
├── assets/                             # Site images and files
├── robots.txt / sitemap.xml            # SEO
└── dashboard/                          # MAGNESCO Production Management System Dashboard
    ├── index.html                      # Dashboard entry point
    ├── app/                            # Android app download/install redirect pages
    ├── css/, js/, assets/              # Dashboard-specific stylesheet, scripts, icons, images
    └── assets/files/                   # Distributable Android APKs
```

## Hosting

The site is a static site intended for hosting on **GitHub Pages** (or any
static host). No build step is required — all pages are plain HTML, CSS, and
vanilla JavaScript.

## Dashboard

The `dashboard/` directory hosts the MAGNESCO Production Management System
Dashboard, an internal tool for production monitoring, plus install
redirect pages that serve the companion Android APKs
(`MAGNESCO_Production_Management_System.apk` and
`MAGNESCO_Production_Management_System_Dashboard.apk`). This area is
maintained independently and is out of scope for changes made to the public
marketing site.

## Copyright

Copyright © 2026 Magnesco Electrical Stamping Pvt. Ltd. All Rights Reserved.

Brand names, logos, and company information for Magnesco Electrical
Stamping Pvt. Ltd. displayed on this site belong to their respective owner
and are used with permission for this website.
