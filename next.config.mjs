import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  // Keep serverless Chromium outside the Turbopack server bundle so its
  // package-relative binary lookup remains valid at runtime.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Chromium resolves its Brotli-packed binaries dynamically, so Next's
  // static tracer cannot reliably discover them. Explicitly include the
  // package for the CV renderer function, including pnpm's virtual-store path.
  outputFileTracingIncludes: {
    '/api/cv/render': [
      './node_modules/@sparticuz/chromium/**/*',
      './node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**/*',
    ],
  },
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
    // Content-heavy blog prerenders can otherwise oversubscribe each export worker.
    staticGenerationMaxConcurrency: 4,
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    localPatterns: [
      {
        pathname: '/images/**',
      },
    ],
  },
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withNextIntl(nextConfig);
