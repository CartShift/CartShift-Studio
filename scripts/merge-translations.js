/**
 * Merge translation source files into production files
 * Run before build via `npm run prebuild`
 *
 * Features:
 * - Validates JSON syntax with line number reporting
 * - Detects duplicate keys across files (with deep merge support)
 * - Reports file sizes and compression stats
 * - Counts total leaf keys (actual translation strings)
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const zlib = require('zlib');

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

const isSilent = process.argv.includes('--silent') || process.env.QUIET === '1';

const RETRIABLE_FS_ERRORS = new Set(['EBUSY', 'EPERM', 'EACCES', 'UNKNOWN']);

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* wait for file locks (Windows IDE/sync tools) */
  }
}

function writeFileAtomicWithRetry(filePath, content, maxRetries = 8) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
    return false;
  }

  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (error) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {
        /* ignore cleanup failures */
      }

      if (RETRIABLE_FS_ERRORS.has(error.code) && attempt < maxRetries) {
        sleepSync(attempt * 75);
        continue;
      }

      throw error;
    }
  }
}

// Try to use jsonlint if available, otherwise fall back to native JSON.parse
let jsonlint;
try {
  jsonlint = require('jsonlint');
} catch {
  jsonlint = null;
}

// Use __dirname for predictable path resolution
const messagesDir = path.join(__dirname, '..', 'messages');
const srcDir = path.join(messagesDir, 'src');
const locales = ['en', 'he'];

/**
 * Strip UTF-8 BOM if present
 */
function stripBom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

/**
 * Parse JSON with detailed error message using jsonlint if available
 */
function parseJsonWithLineNumbers(content, filePath) {
  try {
    const cleanContent = stripBom(content);
    // Use jsonlint for better error messages if available
    if (jsonlint) {
      return jsonlint.parse(cleanContent);
    }
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`\n❌ JSON Syntax Error in ${filePath}`);
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Recursively validate all string values are non-empty (including arrays)
 */
function validateContent(obj, keyPath = '') {
  const warnings = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key;
    if (typeof value === 'string' && value.trim() === '') {
      warnings.push(`Empty string at "${currentPath}"`);
    } else if (Array.isArray(value)) {
      // Validate array elements
      value.forEach((item, index) => {
        if (typeof item === 'string' && item.trim() === '') {
          warnings.push(`Empty string at "${currentPath}[${index}]"`);
        } else if (typeof item === 'object' && item !== null) {
          warnings.push(...validateContent(item, `${currentPath}[${index}]`));
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      warnings.push(...validateContent(value, currentPath));
    }
  }
  return warnings;
}

/**
 * Count total leaf keys (actual translation strings) recursively
 */
function countLeafKeys(obj) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countLeafKeys(value);
    } else {
      count++;
    }
  }
  return count;
}

/**
 * Deep merge two objects, detecting conflicts at leaf level
 * @returns {{ merged: object, conflicts: string[] }}
 */
function deepMerge(target, source, keyPath = '') {
  const conflicts = [];
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key;
    const targetValue = result[key];

    if (targetValue === undefined) {
      // Key doesn't exist in target, add it
      result[key] = sourceValue;
    } else if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue) &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      // Both are objects, merge recursively
      const nestedResult = deepMerge(targetValue, sourceValue, currentPath);
      result[key] = nestedResult.merged;
      conflicts.push(...nestedResult.conflicts);
    } else {
      // Conflict: both have the key but at least one is a leaf
      conflicts.push(currentPath);
    }
  }

  return { merged: result, conflicts };
}

async function mergeTranslations(locale) {
  const localeDir = path.join(srcDir, locale);
  const outputPath = path.join(messagesDir, `${locale}.json`);

  // Check if source directory exists
  if (!fs.existsSync(localeDir)) {
    console.error(`❌ Source directory not found: ${localeDir}`);
    process.exit(1);
  }

  // Helper: Recursively get all .json files
  function getAllJsonFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllJsonFiles(filePath));
      } else if (file.endsWith('.json')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const allFiles = getAllJsonFiles(localeDir).sort();

  if (allFiles.length === 0) {
    console.error(`❌ No JSON files found in ${localeDir}`);
    process.exit(1);
  }

  // Merge all files with deep merge
  let merged = {};

  for (const filePath of allFiles) {
    // Get relative path for error logging (e.g., "en/portal/dashboard.json")
    const relativePath = path.relative(srcDir, filePath).replace(/\\/g, '/');
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const content = parseJsonWithLineNumbers(rawContent, relativePath);

    // Validate content
    const warnings = validateContent(content);
    if (warnings.length > 0 && !isSilent) {
      console.warn(`⚠️  Warnings in ${locale}/${file}:`);
      warnings.forEach(w => console.warn(`   - ${w}`));
    }

    // Deep merge and check for conflicts
    const { merged: newMerged, conflicts } = deepMerge(merged, content);
    if (conflicts.length > 0) {
      console.error(`❌ Duplicate keys found in ${locale}/${file}:`);
      conflicts.forEach(c => console.error(`   - "${c}"`));
      process.exit(1);
    }
    merged = newMerged;
  }

  // Add metadata to indicate this is a generated file
  const relativeFiles = allFiles.map(f => path.relative(srcDir, f).replace(/\\/g, '/'));
  const mergedWithMeta = {
    _meta: {
      _generated: true,
      _warning: '⚠️ DO NOT EDIT THIS FILE DIRECTLY - Edit source files in messages/src/ instead',
      _sourceFiles: relativeFiles,
    },
    ...merged,
  };

  // Write merged output with consistent formatting (atomic + retry for Windows file locks)
  const output = JSON.stringify(mergedWithMeta, null, 2);
  const didWrite = writeFileAtomicWithRetry(outputPath, output);

  // Calculate compression stats asynchronously
  const rawSize = Buffer.byteLength(output, 'utf8');
  const [gzipBuffer, brotliBuffer] = await Promise.all([gzip(output), brotliCompress(output)]);
  const gzipSize = gzipBuffer.length;
  const brotliSize = brotliBuffer.length;

  const topLevelKeys = Object.keys(merged).length;
  const totalLeafKeys = countLeafKeys(merged);

  if (!isSilent) {
    console.log(`✅ ${locale}.json ${didWrite ? 'merged' : 'unchanged'}`);
    console.log(`   Files: ${relativeFiles.join(', ')}`);
    console.log(`   Keys: ${topLevelKeys} top-level, ${totalLeafKeys} total`);
    console.log(
      `   Size: ${(rawSize / 1024).toFixed(1)} KB (gzip: ${(gzipSize / 1024).toFixed(1)} KB, brotli: ${(brotliSize / 1024).toFixed(1)} KB)`
    );
  }
}

async function main() {
  if (!isSilent) {
    console.log('🔧 Merging translation files...\n');
  }

  for (const locale of locales) {
    await mergeTranslations(locale);
    if (!isSilent) console.log('');
  }

  if (!isSilent) console.log('✅ All translations merged successfully!');
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
