# SEO Indexing Issue Fix - "Crawled - not indexed" Resolution

**Date:** February 5, 2026  
**Status:** ✅ RESOLVED  
**Affected Pages:** 67 URLs (both /en and /he locales)

## Problem Summary

Google Search Console reported 67 pages with status "Crawled - not indexed" starting January 15, 2026.

### Root Cause

**URL Inconsistency caused by `trailingSlash: true` in Next.js config:**

1. **Next.js Config:** `trailingSlash: true` + `skipTrailingSlashRedirect: true`
2. **Sitemap URLs:** Generated **WITHOUT** trailing slashes
   - Example: `https://cart-shift.com/en` (sitemap)
   - Browser/Next.js served: `https://cart-shift.com/en/` (with slash)

This created **duplicate URL signals** confusing Google:

- Sitemap says: `/en`
- Server responds with: `/en/`
- Google sees two versions of every page
- Result: Google crawls but doesn't index (duplicate content signal)

## Solution Implemented

### 1. Remove Trailing Slash Configuration

**File:** `next.config.mjs`

```javascript
// ❌ BEFORE (Problematic)
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // ...
};

// ✅ AFTER (Fixed)
const nextConfig = {
  output: 'standalone',
  trailingSlash: false, // Changed to false
  // removed: skipTrailingSlashRedirect
  // ...
};
```

**Why this fixes it:**

- URLs now consistent across sitemap and actual pages
- No more duplicate signals to Google
- Clean canonical URLs: `https://cart-shift.com/en` (no trailing slash)

### 2. Verify Sitemap Consistency

**File:** `app/sitemap.ts`

✅ Sitemap already generates clean URLs without trailing slashes (no changes needed)

**Output example:**

```xml
<url>
  <loc>https://cart-shift.com/en</loc>
  <lastmod>2026-02-05</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1</priority>
</url>
```

### 3. Additional Checks Performed

✅ **robots.txt:** Allows crawling of all main pages  
✅ **Metadata:** No `noindex` tags found on affected pages  
✅ **Canonical URLs:** Proper canonical tags in layout.tsx  
✅ **Hreflang:** Correct alternate language tags

## Impact Assessment

### Affected URLs by Category:

| Category       | Count  | Examples                               |
| -------------- | ------ | -------------------------------------- |
| Main Pages     | 12     | `/en`, `/en/about`, `/en/contact`      |
| Blog Posts     | 34     | `/en/blog/*`, `/he/blog/*`             |
| Industry Pages | 12     | `/en/industries/*`, `/he/industries/*` |
| Case Studies   | 4      | `/en/work/*`, `/he/work/*`             |
| Other          | 5      | `/en/cv`, `/en/tools/store-analyzer`   |
| **Total**      | **67** |                                        |

## Deployment Steps

### 1. Build & Deploy

```bash
# Build the project
npm run build

# Deploy to production
# (Your deployment command - Firebase/Vercel)
```

### 2. Verify URLs

After deployment, check a sample URL:

```bash
# Should respond with 200, no redirect
curl -I https://cart-shift.com/en
```

**Expected:** Direct 200 response (not 301/302)

### 3. Resubmit to Google

#### Option A: Request Re-Indexing (Recommended)

1. Open [Google Search Console](https://search.google.com/search-console)
2. For each high-priority URL:
   - Enter URL in inspection tool
   - Click "Request Indexing"
3. Priority URLs to resubmit first:
   - `https://cart-shift.com/en`
   - `https://cart-shift.com/he`
   - `https://cart-shift.com/en/about`
   - `https://cart-shift.com/en/blog`
   - Top 5-10 blog posts

#### Option B: Sitemap Resubmission

```bash
# Ping Google
curl "https://www.google.com/ping?sitemap=https://cart-shift.com/sitemap.xml"
```

Or in Search Console:

1. Go to Sitemaps
2. Remove old sitemap (if exists)
3. Add: `https://cart-shift.com/sitemap.xml`

## Timeline & Expectations

| Action           | When      | Expected Result                |
| ---------------- | --------- | ------------------------------ |
| Deploy fix       | Immediate | URLs now consistent            |
| Google re-crawls | 1-3 days  | Discovers corrected URLs       |
| Index recovery   | 1-2 weeks | Pages start appearing in index |
| Full recovery    | 2-4 weeks | All 67 pages indexed           |

## Monitoring

### Week 1-2: Check Search Console

- **Crawled - not indexed:** Should start **decreasing**
- **Indexed pages:** Should start **increasing**
- **Coverage issues:** Should resolve

### Week 3-4: Verify Full Recovery

- All 67 URLs should show as "Indexed" in Search Console
- Check a few URLs manually:
  ```
  site:cart-shift.com/en/about
  site:cart-shift.com/en/blog/shopify-seo-complete-guide
  ```

## Related: Legacy `/blog/*` Cannibalization (Jul 2026)

**Cause:** Unlocalized `/blog/*` URLs redirected with **307** to `/en/blog/*`, while next-intl also emitted HTTP `Link` headers with `hreflang="x-default"` pointing at the legacy `/blog/*` path. Google indexed the legacy URL as canonical for some posts.

**Fixes applied:**

1. **308 permanent redirect** in `proxy.ts` for `/blog` and `/blog/*` before next-intl routing, with locale from cookie, `Accept-Language`, or `x-vercel-ip-country: IL`
2. **`alternateLinks: false`** on next-intl middleware — hreflang is owned by `lib/seo.ts` metadata only
3. **`npm run seo:reindex-hebrew`** — resubmits sitemap via GSC API and inspects priority Hebrew URLs

**Expected:** Legacy `/blog/*` URLs drop from the index over 2–4 weeks; Hebrew pages consolidate under `/he/*`.

---

When Google Search Console shows "הדף מפנה לכתובת אתר אחרת" (The page redirects to another website) for main-domain `/portal/` URLs:

**Cause:** Main domain `cart-shift.com/en/portal/*` redirects to `portal.cart-shift.com`. Google treats subdomains as different sites.

**Fixes applied:**

1. **308 permanent redirect** in middleware (was 307 temporary) — signals consolidation to subdomain
2. **Main-site portal links** use `getPortalSubdomainUrl()` for absolute URLs — avoids crawlable links to redirecting URLs
3. **Agency portal links** use `getPortalPath()` instead of hardcoded `/portal/`

**Expected:** Existing redirecting URLs will drop from "not indexed" over 1–2 weeks as Google re-crawls.

## Prevention

### ✅ Best Practices Going Forward:

1. **Never mix trailing slash policies**
   - If Next.js uses slashes, sitemap must too
   - If Next.js doesn't, sitemap shouldn't either

2. **Test before deploying SEO changes:**

   ```bash
   npm run build
   # Check sitemap output
   cat build_out/sitemap.xml | head -30
   ```

3. **Monitor Search Console weekly** for coverage issues

4. **Use consistent canonical URLs** everywhere (meta tags, hreflang, sitemap)

## Technical Notes

### Why `trailingSlash: true` Was Problematic

- Next.js **always redirects** to add/remove slashes based on this setting
- With `skipTrailingSlashRedirect: true`, it **skips** the redirect but still **serves** with the slash
- This creates **soft 404s** or duplicate content for Google
- **Best practice:** Choose one format and be consistent

### Alternative Solution (Not Recommended)

If you _must_ use `trailingSlash: true`:

1. Update sitemap to add slashes: `url: ${baseUrl}/${locale}${path}/`
2. Update all internal links to include trailing slashes
3. Much more complex - **not recommended**

## References

- [Next.js Trailing Slash Documentation](https://nextjs.org/docs/api-reference/next.config.js/trailing-slash)
- [Google: Duplicate URLs in Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Search Console Help](https://support.google.com/webmasters/answer/9012289)

## Conclusion

✅ **Root cause identified:** URL inconsistency from `trailingSlash: true`  
✅ **Fix applied:** Changed to `trailingSlash: false`  
✅ **Next steps:** Deploy, verify, and resubmit URLs to Google  
✅ **Expected recovery:** 2-4 weeks for full index recovery

---

**Need help?** Contact the dev team or check Google Search Console for updates.
