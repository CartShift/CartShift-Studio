# SEO Quick Start Guide - CartShift Studio

**Last Updated:** January 18, 2026
**Status:** 🚀 Ready to implement

---

## Immediate Actions (Do Today)

### 1. Create Missing Images ⚠️ CRITICAL
- **Files needed:** 11 images in `/public/images/`
- **Time:** 1-2 hours
- **Tool:** [RealFaviconGenerator](https://realfavicongenerator.net/) + [Canva](https://www.canva.com/)
- **See:** `docs/SEO_IMAGE_ASSETS_REQUIRED.md`

### 2. Set Up Google Search Console ⚠️ CRITICAL
```bash
# Add to .env file
GOOGLE_SITE_VERIFICATION=your_verification_code_here
```

Get your code at: https://search.google.com/search-console

### 3. Update Social Media Links ⚠️ CRITICAL
Update these URLs in `lib/seo.ts` line 130:
```typescript
sameAs: [
  "https://twitter.com/YOUR_HANDLE",
  "https://linkedin.com/company/YOUR_COMPANY",
  "https://github.com/YOUR_ORG",
  "https://www.facebook.com/YOUR_PAGE",
  "https://www.instagram.com/YOUR_HANDLE",
]
```

---

## What We've Already Fixed ✅

### Today's Changes

1. **PWA Manifest** - Created `/public/manifest.json`
2. **Social Links** - Added to organization schema in `lib/seo.ts`
3. **Robots.txt** - Made less restrictive in `app/robots.ts`
4. **Hreflang Tags** - Added to `app/[locale]/layout.tsx`
5. **Canonical Tags** - Added to `app/[locale]/layout.tsx`
6. **Meta Tags** - Added PWA links to `app/layout.tsx`
7. **Homepage Title/Description** - Optimized for CTR
8. **Shopify Page Title/Description** - Optimized for CTR

---

## Next Week's Tasks

### High Priority
- [ ] Create all missing OG and favicon images
- [ ] Add noindex to private/portal pages
- [ ] Add FAQ schema to service pages
- [ ] Implement image sitemap

### Medium Priority
- [ ] Optimize all page meta descriptions
- [ ] Add breadcrumb schema to all pages
- [ ] Test Core Web Vitals and fix CLS
- [ ] Submit sitemap to Google Search Console

---

## Verify Your SEO

### Run These Tests

```bash
# Start dev server
npm run dev

# Test locally
http://localhost:3000
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
http://localhost:3000/manifest.json
```

### Online Tools

1. **Rich Results Test:** https://search.google.com/test/rich-results
   - Test: `https://cart-shift.com`
   - Check: Organization schema, Article schema, BreadcrumbList

2. **PageSpeed Insights:** https://pagespeed.web.dev/
   - Test both mobile and desktop
   - Target: 90+ score

3. **Social Share Preview:** https://www.opengraph.xyz/
   - Test: `https://cart-shift.com`
   - Verify images show correctly (after you create them!)

4. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
   - Test: Your homepage URL
   - Verify card display

---

## Key SEO Files

### Configuration Files
```
app/
├── layout.tsx              # Root layout with PWA links
├── [locale]/
│   ├── layout.tsx         # Locale layout with hreflang/canonical
│   └── page.tsx           # Homepage (title/desc optimized)
├── robots.ts              # Robots.txt (updated - less restrictive)
└── sitemap.ts             # Sitemap generation

public/
└── manifest.json          # PWA manifest (NEW)

lib/
└── seo.ts                 # All SEO functions (social links updated)
```

### Documentation Files
```
docs/
├── SEO_TECHNICAL_ANALYSIS.md     # Full 18-point analysis
├── SEO_IMAGE_ASSETS_REQUIRED.md   # Image creation guide
└── SEO_QUICK_START.md            # This file
```

---

## Common SEO Tasks

### Add New Page with SEO
```typescript
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata = genMeta({
  title: 'Page Title | CartShift Studio',
  description: 'Compelling description under 160 chars with keywords',
  url: '/your-page',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
});

// Add breadcrumb schema
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Section', url: '/section' },
  { name: 'Page Name', url: '/your-page' },
]);
```

### Add Noindex to Private Page
```typescript
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

### Add FAQ Schema
```typescript
import { generateFAQPageSchema } from '@/lib/seo';

const faqSchema = generateFAQPageSchema([
  {
    question: 'Your question?',
    answer: 'Your answer...',
  },
]);
```

---

## Monitoring Checklist

### Weekly
- [ ] Check Google Search Console for errors
- [ ] Monitor organic traffic in Analytics
- [ ] Check for broken images (404s)

### Monthly
- [ ] Run PageSpeed Insights test
- [ ] Review keyword rankings
- [ ] Check Core Web Vitals in GSC
- [ ] Update sitemap if new content added

### Quarterly
- [ ] Full SEO audit
- [ ] Update meta descriptions for underperforming pages
- [ ] Review and update keywords
- [ ] Check competitor SEO

---

## Expected Results

### After 30 Days
- ✅ All social previews working (with images)
- ✅ PWA installable on mobile
- ✅ No 404s for image assets
- ✅ Google Search Console fully set up
- ✅ Improved mobile rankings

### After 90 Days
- 📈 +25-50% organic traffic
- 📈 Better search rankings for key terms
- 📈 Higher click-through rates
- 📈 Improved Core Web Vitals scores
- 📈 More social media engagement

---

## Quick Commands

```bash
# Validate environment variables
npm run prebuild

# Check for broken images
npm run build

# Test sitemap
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt

# Test manifest
curl http://localhost:3000/manifest.json
```

---

## Need Help?

### Documentation
- Full analysis: `docs/SEO_TECHNICAL_ANALYSIS.md`
- Image guide: `docs/SEO_IMAGE_ASSETS_REQUIRED.md`

### Tools
- Google Search Console: https://search.google.com/search-console
- Rich Results Test: https://search.google.com/test/rich-results
- PageSpeed Insights: https://pagespeed.web.dev/

### Next Steps
1. Create the missing images (see image guide)
2. Set up Google Search Console
3. Update social media links in schema
4. Test all pages with Rich Results Test

---

**Good luck! Your SEO foundation is solid. Just need to finish the image assets and you're set. 🚀**
