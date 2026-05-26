# Store Analyzer - Quick Reference

## What Was Fixed?

The store analyzer was failing due to Puppeteer/Chrome not being available or timing out. We implemented:

1. ✅ **Graceful degradation** - Analyzer works even if Puppeteer fails
2. ✅ **Availability check** - Pre-flight test before launching browser
3. ✅ **Better error handling** - Individual service failures don't crash entire analysis
4. ✅ **Faster page loads** - Changed from `networkidle2` to `domcontentloaded`
5. ✅ **Improved timeouts** - Added timeouts at multiple levels
6. ✅ **Enhanced browser config** - Added more stability flags
7. ✅ **SSRF-safe fetch** - Redirect validation + DNS re-check (`lib/utils/safe-store-fetch.ts`)
8. ✅ **Vercel browser** - `@sparticuz/chromium` + `puppeteer-core` on serverless
9. ✅ **Honest loading UX** - Time-based progress (no fake 88% stall)
10. ✅ **Coverage strip** - Per-feature included/estimated/skipped badges in results
11. ✅ **API `maxDuration: 120`** - Reduces serverless timeouts on long runs
12. ✅ **Overlapped pipeline** - Scraper/competitor/AI run during PageSpeed wait (not after)
13. ✅ **Async PDF delivery** - Results return immediately; email sends via `after()` in background

## Quick Commands

```bash
# Check if Puppeteer works
pnpm diagnose:puppeteer

# Test the analyzer (requires dev server running)
pnpm test:analyzer

# Start dev server
pnpm dev
```

## How It Works Now

### Analysis pipeline (order)

1. Cache lookup (24h TTL)
2. SSRF-safe HTML fetch (~15s max)
3. **In parallel:** PageSpeed Lighthouse + competitor/scraper/AI tasks (overlap saves ~15–25s)
4. Section scoring + benchmark + cache write
5. **Immediate** JSON response to browser
6. **Background:** PDF email via Firebase Function (`after()` — does not block step 5)

### If Puppeteer IS available:

- ✅ Full analysis with screenshots
- ✅ Visual analysis (mobile/desktop)
- ✅ Product page audit
- ✅ All core metrics

### If Puppeteer IS NOT available:

- ✅ Core metrics still work (Performance, SEO, Accessibility)
- ✅ Cart and trust analysis
- ✅ Competitor analysis
- ✅ AI readiness analysis
- ❌ No screenshots
- ❌ No product page details

## Files Changed

1. **lib/services/scraper.ts** - Added availability check and graceful fallback
2. **lib/services/analyzer.ts** - Added individual error handlers for all services
3. **scripts/diagnose-puppeteer.js** - New diagnostic tool
4. **scripts/test-analyzer.js** - New integration test
5. **docs/STORE_ANALYZER_SETUP.md** - Setup guide
6. **docs/STORE_ANALYZER_FIX.md** - Detailed fix summary
7. **package.json** - Added new scripts
8. **README.md** - Added Store Analyzer section

## For Developers

### Local Development

- Just run `pnpm install` and Puppeteer should work automatically
- If issues occur, run `pnpm diagnose:puppeteer` for help

### Deployment

- **Vercel**: `@sparticuz/chromium` is wired automatically when `VERCEL=1` (see `lib/services/puppeteer-launch.ts`)
- **Docker**: Add Chrome to image (see setup guide)
- **Firebase**: Use Cloud Run with Chrome (see setup guide)

### Testing

```bash
# Unit + integration tests (Vitest)
pnpm test:analyzer:unit

# Live API smoke test (requires dev server running)
pnpm dev
pnpm test:analyzer
```

Coverage map:

- **Validation** — `tests/validation/analyze-store.test.ts`
- **URL + SSRF fetch** — `tests/utils/store-url.test.ts`, `tests/utils/safe-store-fetch.test.ts`
- **Core service** — `tests/services/analyzer.test.ts` (cache, Lighthouse, HTML fallback, errors, graceful degradation)
- **API route** — `tests/api/analyze-store.route.test.ts` (rate limit, captcha, serialization, error mapping)
- **Client progress UX** — `tests/lib/analyzer-progress.test.ts`, `tests/hooks/use-analyzer-progress.test.tsx`
- **Response shaping** — `tests/services/analyzer-response.test.ts`
- **AI readiness slice** — `tests/services/ai-readiness.test.ts`

## Common Issues

### "Failed to launch chrome"

→ Run `pnpm diagnose:puppeteer` for detailed diagnostics

### Analysis completes but no screenshots

→ This is normal if Puppeteer isn't available. Core metrics still work.

### Timeout errors

→ Fixed! Now uses faster page load strategy with proper timeouts.

### Analysis crashes completely

→ Fixed! Individual service failures no longer crash the entire analysis.

### Hebrew PDF report renders incorrectly

→ PDFs are rendered from the RTL HTML template (`functions/emails/store_analysis_report.html`) via **Chromium** (`functions/lib/store-analysis-pdf.js` + `lib/store-analysis-report-html.js`), not PDFKit. This preserves correct Hebrew word order and layout. Requires `@sparticuz/chromium` + `puppeteer-core`; `sendStoreAnalysisReport` uses **1GiB** memory and **120s** timeout. Redeploy Cloud Functions after pulling this fix.

## Environment Variables (Optional)

```env
# If Chrome is in a custom location
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome

# PageSpeed API key (optional but recommended)
PAGESPEED_API_KEY=your_key_here

# reCAPTCHA (required for production)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

## Performance

- Typical analysis time: 15-30 seconds (often faster when PageSpeed and scraper overlap)
- With cache: Instant (24-hour cache)
- Without Puppeteer: 5-15 seconds (faster)
- PDF email: arrives 30-90s after on-screen results (background delivery)

## Support

For detailed information:

- Setup: `docs/STORE_ANALYZER_SETUP.md`
- Bug fixes: `docs/STORE_ANALYZER_FIX.md`
- Issues: Run `pnpm diagnose:puppeteer` first

---

**Status**: ✅ Working with graceful degradation
**Last Updated**: May 25, 2026
**Version**: 1.0.1
