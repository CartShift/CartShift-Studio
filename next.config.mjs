import createNextIntlPlugin from 'next-intl/plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  assetPrefix: '',



  // Explicitly set the workspace root to avoid lockfile detection issues
  outputFileTracingRoot: __dirname,

  transpilePackages: ['next-intl', '@react-pdf/renderer'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion', '@nivo/core', '@nivo/line'],
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins || [];
      const hasMiniCssExtractPlugin = config.plugins.some(
        plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
      );

      if (!hasMiniCssExtractPlugin) {
        config.plugins.push(
          new MiniCssExtractPlugin({
            filename: 'static/css/[name].[contenthash:8].css',
            chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          })
        );
      }
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Parsing of .* for build dependencies failed at 'import\(t\)'/,
      },
      {
        message: /Build dependencies behind this expression are ignored/,
      },
      warning => {
        const message = warning.message || warning.toString();
        const module = warning.module?.resource || warning.module?.identifier || '';
        return (
          (message.includes('Parsing of') && message.includes('import(t)')) ||
          message.includes('Build dependencies behind this expression') ||
          (module.includes('next-intl') && module.includes('extractor'))
        );
      },
    ];

    // Use a single RegExp to ignore directories and Windows system files
    config.watchOptions = {
      ...config.watchOptions,
      ignored:
        /([/\\](node_modules|\.git|\.next|build_out|out|coverage|\.firebase)[/\\])|(DumpStack\.log\.tmp|hiberfil\.sys|pagefile\.sys|swapfile\.sys)$/i,
      aggregateTimeout: 300,
      poll: false,
    };

    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };

    return config;
  },
};

export default withNextIntl(nextConfig);
