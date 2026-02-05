# Store Analyzer Setup Guide

## Overview

The Store Analyzer uses Puppeteer for visual analysis and product page auditing. This requires Chrome/Chromium to be available in the environment.

## Local Development

### Windows

1. Install Puppeteer (already in package.json):

   ```bash
   pnpm install
   ```

2. Puppeteer will automatically download Chromium on first install

3. If you encounter issues, manually install Chrome or set the executable path:
   ```bash
   $env:PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
   ```

### macOS/Linux

1. Install Puppeteer:

   ```bash
   pnpm install
   ```

2. If needed, install Chrome manually:

   ```bash
   # macOS
   brew install --cask google-chrome

   # Ubuntu/Debian
   sudo apt-get install chromium-browser
   ```

## Deployment Environments

### Vercel

Puppeteer doesn't work on Vercel's serverless functions by default. Options:

1. **Use @sparticuz/chromium** (Recommended):

   ```bash
   pnpm add @sparticuz/chromium
   ```

   Update `lib/services/scraper.ts`:

   ```typescript
   import chromium from '@sparticuz/chromium';

   const browser = await puppeteer.launch({
     args: chromium.args,
     executablePath: await chromium.executablePath(),
     headless: chromium.headless,
   });
   ```

2. **Use an external service**:
   - Move visual analysis to a separate API (e.g., AWS Lambda with Chrome layer)
   - Use a service like Browserless.io

### Firebase/Google Cloud Functions

1. Use Docker with pre-installed Chrome:

   ```dockerfile
   FROM node:18
   RUN apt-get update && apt-get install -y chromium
   ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
   ```

2. Or use Cloud Run with Chrome pre-installed:
   - Use base image with Chrome
   - Set proper environment variables

### Docker/Container Deployments

Add to your Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

## Graceful Degradation

The analyzer is designed to work even if Puppeteer fails:

- Visual analysis will be skipped
- Product page audit will be skipped
- Core metrics (Performance, SEO, Accessibility) will still work via PageSpeed API
- Overall analysis will complete successfully

## Environment Variables

Optional configuration:

```env
# If Chrome is installed in a custom location
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome

# Skip Chromium download during install (if using system Chrome)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## Troubleshooting

### Error: "Failed to launch chrome"

1. Check if Chrome/Chromium is installed:

   ```bash
   # Windows (PowerShell)
   Get-Command chrome

   # macOS/Linux
   which chromium-browser
   which google-chrome
   ```

2. Install missing dependencies (Linux):

   ```bash
   sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1
   ```

3. Set executable path explicitly:
   ```bash
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
   ```

### Error: "Target closed" or timeout

- The scraper now uses shorter timeouts (15-25s)
- Falls back gracefully if analysis fails
- Check network connectivity to target stores

### Out of Memory

- Reduce concurrent analyses
- Increase Node.js memory:
  ```bash
  export NODE_OPTIONS=--max_old_space_size=4096
  ```

## Testing

Test Puppeteer availability:

```bash
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => { console.log('✓ Puppeteer works'); b.close(); }).catch(e => console.error('✗ Puppeteer failed:', e.message));"
```

## Performance Optimization

The current implementation:

- ✅ Uses `domcontentloaded` instead of `networkidle2` for faster page loads
- ✅ Caches analysis results for 24 hours
- ✅ Runs external services in parallel
- ✅ Gracefully handles failures without crashing
- ✅ Uses compression for screenshots (JPEG, 50-60% quality)
- ✅ Implements timeouts at multiple levels

## Security Considerations

- SSRF protection is implemented in the API route
- Puppeteer runs in `--no-sandbox` mode (required for many environments)
- Screenshots are base64-encoded and embedded in responses
- Consider rate limiting for production use
