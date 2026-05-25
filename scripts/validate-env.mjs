/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are present before build
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const isSilent = process.argv.includes('--silent') || process.env.QUIET === '1';

// Load .env.local if it exists
const envLocalPath = join(projectRoot, '.env.local');
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value && !process.env[key]) {
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key] = cleanValue;
      }
    }
  });
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_FUNCTION_URL',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'GOOGLE_SITE_VERIFICATION',
];

let hasError = false;

function checkEnvVar(name, required = true) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    if (required) {
      console.error(`❌ MISSING REQUIRED: ${name}`);
      hasError = true;
    } else if (!isSilent) {
      console.warn(`⚠️  MISSING OPTIONAL: ${name}`);
    }
  } else if (!isSilent) {
    const maskedValue = name.includes('KEY') || name.includes('SECRET') || name.includes('TOKEN')
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${name}: ${maskedValue}`);
  }
}

if (!isSilent) {
  console.log('🔍 Validating Environment Variables...\n');
}

REQUIRED_ENV_VARS.forEach(name => checkEnvVar(name, true));
if (!isSilent) console.log('');

OPTIONAL_ENV_VARS.forEach(name => checkEnvVar(name, false));
if (!isSilent) console.log('');

const isProductionBuild =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production');
if (isProductionBuild && !process.env.PAGESPEED_API_KEY?.trim()) {
  console.warn(
    '⚠️  PAGESPEED_API_KEY is not set — Store Analyzer will rely on HTML fallback scores in production.'
  );
}

if (hasError) {
  console.error('\n❌ Build failed: Missing required environment variables');
  console.error('Please set the missing variables in your .env.local file');
  process.exit(1);
}

if (!isSilent) console.log('✅ All required environment variables are present');
process.exit(0);
