
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SRC_DIRS = [
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'components'),
  path.join(process.cwd(), 'lib'),
];

// Helper: Recursively get all keys from an object
function extractKeys(obj, prefix = '', keys = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_meta') continue; // Skip metadata keys

    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.add(fullKey);
    } else if (typeof value === 'object' && value !== null) {
      extractKeys(value, fullKey, keys);
    }
  }
  return keys;
}

// Helper: Get value by dot-notation key
function getValue(obj, key) {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Helper: Extract interpolation parameters from string
function extractParams(str) {
  const params = new Set();
  const regex = /\{(\w+)\}/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    params.add(match[1]);
  }
  return params;
}

// Helper: Recursively walk directories to find .ts/.tsx files
function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

async function validateTranslations() {
  console.log('🔍 Validating translations...\n');

  let hasErrors = false;

  // 1. Load Locales
  const enPath = path.join(MESSAGES_DIR, 'en.json');
  const hePath = path.join(MESSAGES_DIR, 'he.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(hePath)) {
    console.error('❌ Missing translation files (en.json or he.json)');
    process.exit(1);
  }

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const heData = JSON.parse(fs.readFileSync(hePath, 'utf8'));

  const enKeys = extractKeys(enData);
  const heKeys = extractKeys(heData);

  // 2. Cross-Locale Validation
  const missingInHe = [...enKeys].filter(k => !heKeys.has(k));
  const missingInEn = [...heKeys].filter(k => !enKeys.has(k));

  if (missingInHe.length > 0) {
    console.error('❌ Missing Hebrew translations:');
    missingInHe.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }

  if (missingInEn.length > 0) {
    console.error('❌ Missing English translations:');
    missingInEn.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }

  if (!hasErrors) {
    console.log('✅ All keys present in both locales');
  }

  // 3. Interpolation Validation
  let interpolationErrors = 0;
  enKeys.forEach(key => {
    const enVal = getValue(enData, key);
    const heVal = getValue(heData, key);

    if (typeof enVal === 'string' && typeof heVal === 'string') {
      const enParams = extractParams(enVal);
      const heParams = extractParams(heVal);

      // Check for mismatch
      const missingInHeParams = [...enParams].filter(p => !heParams.has(p));
      const extraInHeParams = [...heParams].filter(p => !enParams.has(p));

      if (missingInHeParams.length > 0 || extraInHeParams.length > 0) {
        console.error(`❌ Interpolation mismatch for key "${key}":`);
        if (missingInHeParams.length) console.error(`   Missing in HE: ${missingInHeParams.join(', ')}`);
        if (extraInHeParams.length) console.error(`   Extra in HE: ${extraInHeParams.join(', ')}`);
        hasErrors = true;
        interpolationErrors++;
      }
    }
  });

  if (interpolationErrors === 0) {
    console.log('✅ Interpolation parameters consistent');
  }

  // 4. Unused Key Detection (Basic String matching)
  // This is a "strict" check - the key MUST appear in the code exactly as is.
  // We'll treat this as a warning for now, not an error.
  console.log('\nScanning codebase for key usage...');
  const allFiles = SRC_DIRS.flatMap(dir => walkDir(dir));
  const fileContents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

  const unusedKeys = [];
  // Use a simplified check: does the key string exist in the codebase?
  // This avoids false negatives from "useTranslations" but risks false positives (rare for long keys).
  // Optimization: Pre-check if any part of the key exists? No, just loop.
  // It's fast enough for 2000 keys.

  [...enKeys].forEach(key => {
    // Check if the key exists inside quotes
    // Regex is expensive, let's use includes first.
    // We look for the exact key string.
    if (!fileContents.includes(key)) {
        // Try looking for leaf node? e.g. 'titleLabel'
        // If we can't find the full key, it might be constructed dynamically or used via namespace.
        // Let's assume if the leaf contains dots it's a full key.
        // This is a naive check. We will just WARN.
        unusedKeys.push(key);
    }
  });

  if (unusedKeys.length > 0) {
    console.warn(`\n⚠️  Potential unused translations (${unusedKeys.length}):`);
    // Limit output
    unusedKeys.slice(0, 10).forEach(k => console.warn(`   - ${k}`));
    if (unusedKeys.length > 10) console.warn(`   ...and ${unusedKeys.length - 10} more`);
    console.warn('   (Note: These might be used dynamically or via proper namespaces)');
  } else {
    console.log('✅ No obvious unused keys found');
  }

  if (hasErrors) {
    console.log('\n❌ Validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed');
    process.exit(0);
  }
}

validateTranslations().catch(err => {
  console.error(err);
  process.exit(1);
});
