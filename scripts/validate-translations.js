/**
 * Validate translation sources + generated locale files.
 *
 * Hard errors:
 * - Missing generated locale files
 * - Source file path parity (en vs he)
 * - Key parity across locales
 * - Interpolation param mismatches
 * - Type/structure mismatches (string vs object)
 * - Empty string values
 * - Keys referenced in code that are missing from messages
 *
 * Warnings:
 * - Potentially unused keys (static string scan)
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SRC_DIR = path.join(MESSAGES_DIR, 'src');
const LOCALES = ['en', 'he'];
const CODE_DIRS = [
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'components'),
  path.join(process.cwd(), 'lib'),
];

const HOOK_NAMES =
  'useTranslations|usePortalTranslations|useAnalyzerTranslations|useCvTranslations|useProposalTranslations|useCommonTranslations|useWebsiteTranslations|getTranslations|getPortalTranslations|getAnalyzerTranslations|getCvTranslations';

/** Captures `const t = useTranslations('ns')` including multi-line argument forms. */
const ASSIGN_HOOK_RE = new RegExp(
  String.raw`\b(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(${HOOK_NAMES})\(\s*(?:\{[\s\S]*?namespace\s*:\s*(['"\`])([^'"\`]+)\3[\s\S]*?\}|(['"\`])([^'"\`]+)\5)?\s*\)`,
  'g'
);

function extractKeys(obj, prefix = '', keys = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_meta') continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.add(fullKey);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          keys.add(`${fullKey}[${index}]`);
        } else if (item && typeof item === 'object') {
          extractKeys(item, `${fullKey}[${index}]`, keys);
        }
      });
    } else if (value && typeof value === 'object') {
      extractKeys(value, fullKey, keys);
    }
  }
  return keys;
}

function getValue(obj, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc == null) return undefined;
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const nested = acc[arrayMatch[1]];
      return Array.isArray(nested) ? nested[Number(arrayMatch[2])] : undefined;
    }
    return acc[part];
  }, obj);
}

function extractParams(str) {
  const params = new Set();
  const regex = /\{(\w+)\}/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    params.add(match[1]);
  }
  return params;
}

function walkDir(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...walkDir(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  return results;
}

function getRelativeSourceFiles(locale) {
  const localeDir = path.join(SRC_DIR, locale);
  return walkDir(localeDir, ['.json'])
    .map(f => path.relative(localeDir, f).replace(/\\/g, '/'))
    .sort();
}

function findEmptyStrings(obj, prefix = '', empties = []) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_meta') continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      if (value.trim() === '') empties.push(fullKey);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string' && item.trim() === '') {
          empties.push(`${fullKey}[${index}]`);
        } else if (item && typeof item === 'object') {
          findEmptyStrings(item, `${fullKey}[${index}]`, empties);
        }
      });
    } else if (value && typeof value === 'object') {
      findEmptyStrings(value, fullKey, empties);
    }
  }
  return empties;
}

function findStructureMismatches(a, b, prefix = '', mismatches = []) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) {
    if (key === '_meta') continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const av = a?.[key];
    const bv = b?.[key];
    if (av === undefined || bv === undefined) continue;

    const aType = Array.isArray(av) ? 'array' : typeof av;
    const bType = Array.isArray(bv) ? 'array' : typeof bv;
    if (aType !== bType) {
      mismatches.push(`${fullKey} (en=${aType}, he=${bType})`);
      continue;
    }
    if (aType === 'object' && av && bv) {
      findStructureMismatches(av, bv, fullKey, mismatches);
    }
  }
  return mismatches;
}

function resolveFullKey(namespace, key) {
  if (!namespace || namespace === '') return key;
  if (key.startsWith(`${namespace}.`)) return key;
  return `${namespace}.${key}`;
}

function defaultNamespaceForHook(hookName) {
  if (hookName === 'usePortalTranslations' || hookName === 'getPortalTranslations') return 'portal';
  if (hookName === 'useAnalyzerTranslations' || hookName === 'getAnalyzerTranslations') return 'analyzer';
  if (hookName === 'useCvTranslations' || hookName === 'getCvTranslations') return 'cv';
  if (hookName === 'useProposalTranslations') return 'proposal';
  if (hookName === 'useCommonTranslations' || hookName === 'useWebsiteTranslations') return '';
  // useTranslations / getTranslations without a static namespace cannot be resolved safely
  return null;
}

function extractUsedKeysFromSource(content) {
  const used = new Set();
  /** @type {Map<string, string>} */
  const varToNs = new Map();

  for (const match of content.matchAll(ASSIGN_HOOK_RE)) {
    const varName = match[1];
    const hookName = match[2];
    const explicitNs = match[4] || match[6];
    const ns = explicitNs ?? defaultNamespaceForHook(hookName);
    // Skip dynamic namespaces (e.g. ternary) — cannot validate reliably
    if (ns === null) continue;
    varToNs.set(varName, ns);
  }

  if (varToNs.size === 0) return used;

  const callRe = /\b(\w+)\(\s*(['"`])([^'"`]+)\2/g;
  for (const match of content.matchAll(callRe)) {
    const varName = match[1];
    const key = match[3];
    if (!varToNs.has(varName)) continue;
    if (!key || key.includes('${')) continue;

    const ns = varToNs.get(varName);
    if (
      key.startsWith('portal.') ||
      key.startsWith('analyzer.') ||
      key.startsWith('cv.') ||
      key.startsWith('proposal.')
    ) {
      used.add(key);
      continue;
    }
    used.add(resolveFullKey(ns, key));
  }

  return used;
}

function keyExists(messageKeys, fullKey) {
  if (messageKeys.has(fullKey)) return true;
  // Allow parent object keys used only as namespaces (not leaf strings)
  const prefix = `${fullKey}.`;
  for (const key of messageKeys) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

async function validateTranslations() {
  console.log('🔍 Validating translations...\n');
  let hasErrors = false;

  // 1. Source file parity
  const enFiles = getRelativeSourceFiles('en');
  const heFiles = getRelativeSourceFiles('he');
  const missingHeFiles = enFiles.filter(f => !heFiles.includes(f));
  const missingEnFiles = heFiles.filter(f => !enFiles.includes(f));

  if (missingHeFiles.length || missingEnFiles.length) {
    hasErrors = true;
    if (missingHeFiles.length) {
      console.error('❌ Source files missing in he/:');
      missingHeFiles.forEach(f => console.error(`   - ${f}`));
    }
    if (missingEnFiles.length) {
      console.error('❌ Source files missing in en/:');
      missingEnFiles.forEach(f => console.error(`   - ${f}`));
    }
  } else {
    console.log(`✅ Source file parity (${enFiles.length} files per locale)`);
  }

  // 2. Load generated locales
  const localeData = {};
  const localeKeys = {};
  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing generated file: messages/${locale}.json`);
      console.error('   Run `pnpm i18n:merge` first.');
      process.exit(1);
    }
    localeData[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!localeData[locale]._meta?._generated) {
      console.error(`❌ messages/${locale}.json is missing _meta._generated — regenerate with i18n:merge`);
      hasErrors = true;
    }
    localeKeys[locale] = extractKeys(localeData[locale]);
  }

  const enData = localeData.en;
  const heData = localeData.he;
  const enKeys = localeKeys.en;
  const heKeys = localeKeys.he;

  // 3. Key parity
  const missingInHe = [...enKeys].filter(k => !heKeys.has(k));
  const missingInEn = [...heKeys].filter(k => !enKeys.has(k));

  if (missingInHe.length > 0) {
    console.error('❌ Missing Hebrew translations:');
    missingInHe.slice(0, 50).forEach(k => console.error(`   - ${k}`));
    if (missingInHe.length > 50) console.error(`   ...and ${missingInHe.length - 50} more`);
    hasErrors = true;
  }

  if (missingInEn.length > 0) {
    console.error('❌ Missing English translations:');
    missingInEn.slice(0, 50).forEach(k => console.error(`   - ${k}`));
    if (missingInEn.length > 50) console.error(`   ...and ${missingInEn.length - 50} more`);
    hasErrors = true;
  }

  if (!missingInHe.length && !missingInEn.length) {
    console.log(`✅ Key parity (${enKeys.size} leaf keys)`);
  }

  // 4. Structure mismatches
  const structureMismatches = findStructureMismatches(enData, heData);
  if (structureMismatches.length) {
    console.error('❌ Structure mismatches between en and he:');
    structureMismatches.forEach(m => console.error(`   - ${m}`));
    hasErrors = true;
  } else {
    console.log('✅ Message structure consistent');
  }

  // 5. Empty strings
  const emptyEn = findEmptyStrings(enData);
  const emptyHe = findEmptyStrings(heData);
  if (emptyEn.length || emptyHe.length) {
    console.error('❌ Empty translation strings:');
    emptyEn.forEach(k => console.error(`   - en: ${k}`));
    emptyHe.forEach(k => console.error(`   - he: ${k}`));
    hasErrors = true;
  } else {
    console.log('✅ No empty translation strings');
  }

  // 6. Interpolation
  let interpolationErrors = 0;
  enKeys.forEach(key => {
    const enVal = getValue(enData, key);
    const heVal = getValue(heData, key);
    if (typeof enVal !== 'string' || typeof heVal !== 'string') return;

    const enParams = extractParams(enVal);
    const heParams = extractParams(heVal);
    const missingInHeParams = [...enParams].filter(p => !heParams.has(p));
    const extraInHeParams = [...heParams].filter(p => !enParams.has(p));

    if (missingInHeParams.length || extraInHeParams.length) {
      console.error(`❌ Interpolation mismatch for "${key}":`);
      if (missingInHeParams.length) console.error(`   Missing in HE: ${missingInHeParams.join(', ')}`);
      if (extraInHeParams.length) console.error(`   Extra in HE: ${extraInHeParams.join(', ')}`);
      hasErrors = true;
      interpolationErrors++;
    }
  });

  if (interpolationErrors === 0) {
    console.log('✅ Interpolation parameters consistent');
  }

  // 7. Code references → message keys
  console.log('\nScanning codebase for translation key usage...');
  const codeFiles = CODE_DIRS.flatMap(dir => walkDir(dir, ['.ts', '.tsx']));
  const usedKeys = new Set();
  const fileContents = [];

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    fileContents.push(content);
    for (const key of extractUsedKeysFromSource(content)) {
      usedKeys.add(key);
    }
  }

  const missingFromMessages = [...usedKeys]
    .filter(key => !key.includes('${'))
    .filter(key => !keyExists(enKeys, key));

  if (missingFromMessages.length) {
    console.error('❌ Translation keys used in code but missing from messages:');
    missingFromMessages.slice(0, 40).forEach(k => console.error(`   - ${k}`));
    if (missingFromMessages.length > 40) {
      console.error(`   ...and ${missingFromMessages.length - 40} more`);
    }
    hasErrors = true;
  } else {
    console.log(`✅ Referenced keys exist (${usedKeys.size} static references checked)`);
  }

  // 8. Unused keys (warning only)
  const joined = fileContents.join('\n');
  const unusedKeys = [...enKeys].filter(key => {
    if (joined.includes(key)) return false;
    const leaf = key.split('.').pop();
    // Namespaced usage often only contains the relative key
    if (leaf && (joined.includes(`'${leaf}'`) || joined.includes(`"${leaf}"`))) return false;
    const relativePortal = key.startsWith('portal.') ? key.slice('portal.'.length) : null;
    if (relativePortal && joined.includes(relativePortal)) return false;
    return true;
  });

  if (unusedKeys.length > 0) {
    console.warn(`\n⚠️  Potential unused translations (${unusedKeys.length}):`);
    unusedKeys.slice(0, 10).forEach(k => console.warn(`   - ${k}`));
    if (unusedKeys.length > 10) console.warn(`   ...and ${unusedKeys.length - 10} more`);
    console.warn('   (Dynamic keys / namespaces may cause false positives)');
  } else {
    console.log('✅ No obvious unused keys found');
  }

  if (hasErrors) {
    console.log('\n❌ Validation failed');
    process.exit(1);
  }

  console.log('\n✅ Validation passed');
  process.exit(0);
}

validateTranslations().catch(err => {
  console.error(err);
  process.exit(1);
});
