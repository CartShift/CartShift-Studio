#!/usr/bin/env node
/**
 * Publication gate for the DE mirror of the existing website.
 * It intentionally reads source files, never the EN-filled runtime merge:
 * EN fallback is useful during development but is not a translation.
 *
 * Run: node scripts/check-german-parity.cjs
 * Only pass the release gate when every public marketing string and editorial
 * item has a verified German counterpart. The portal is a separate product.
 */
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'messages', 'src');
const enDir = path.join(source, 'en');
const deDir = path.join(source, 'de');
const errors = [];
const warnings = [];
let sourceStrings = 0;
let translatedStrings = 0;
const excluded = /^(?:portal|cv|proposal)(?:\/|\.)/i;
const isPlainObject = x => x != null && typeof x === 'object' && !Array.isArray(x);
const countStrings = value => typeof value === 'string' ? 1 :
  Array.isArray(value) ? value.reduce((total, item) => total + countStrings(item), 0) :
  isPlainObject(value) ? Object.values(value).reduce((total, item) => total + countStrings(item), 0) : 0;

function files(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(prefix, entry.name);
    return entry.isDirectory() ? files(path.join(dir, entry.name), rel) :
      entry.name.endsWith('.json') ? [rel] : [];
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function args(text) {
  return [...text.matchAll(/\{([a-zA-Z_][a-zA-Z_0-9]*)\}/g)].map(m => m[1]).sort().join(',');
}

function check(base, de, key) {
  if (typeof base === 'string') {
    sourceStrings++;
    if (typeof de !== 'string' || !de.trim()) {
      errors.push(`missing translation: ${key}`);
      return;
    }
    if (args(base) !== args(de)) errors.push(`ICU arguments changed: ${key}`);
    if (base === de && /[a-z]{3}/i.test(base) && !/^(https?:\/\/|[A-Z0-9_\-/+. ]+$)/.test(base)) {
      warnings.push(`same as English (review): ${key}`);
    }
    translatedStrings++;
    return;
  }
  if (Array.isArray(base)) {
    if (!Array.isArray(de) || base.length !== de.length) {
      errors.push(`array differs: ${key}`);
      sourceStrings += countStrings(base);
      return;
    }
    base.forEach((x,i) => check(x, de[i], `${key}[${i}]`));
    return;
  }
  if (isPlainObject(base)) {
    if (!isPlainObject(de)) {
      errors.push(`missing object: ${key}`);
      sourceStrings += countStrings(base);
      return;
    }
    for (const [k,value] of Object.entries(base)) {
      check(value, de[k], key ? `${key}.${k}` : k);
    }
  }
}

const relPaths = files(enDir).filter(rel => !excluded.test(rel.replaceAll('\\', '/')));
for (const rel of relPaths) {
  const en = readJson(path.join(enDir, rel));
  const candidate = path.join(deDir, rel);
  if (!fs.existsSync(candidate)) {
    errors.push(`missing German source file: ${rel}`);
    sourceStrings += countStrings(en);
  } else {
    check(en, readJson(candidate), rel);
  }
}

const blogDir = path.join(root, 'content', 'blog');
const posts = fs.existsSync(blogDir) ? fs.readdirSync(blogDir).filter(x => x.endsWith('.md')) : [];
for (const file of posts) {
  const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const {data,content} = matter(raw);
  if (!/^---de---\s*$/m.test(content)) errors.push(`missing German article body: ${file}`);
  for (const key of ['title_de','excerpt_de','category_de']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) errors.push(`missing ${key} in blog: ${file}`);
  }
}

const casesDir = path.join(root, 'content', 'case-studies');
const cases = fs.existsSync(casesDir) ? fs.readdirSync(casesDir).filter(x => x.endsWith('.md')) : [];
for (const file of cases) {
  const {data} = matter(fs.readFileSync(path.join(casesDir,file),'utf8'));
  const de = data.de;
  for (const key of ['title','summary','content']) {
    if (!isPlainObject(de) || typeof de[key] !== 'string' || !de[key].trim()) errors.push(`missing German case-study ${key}: ${file}`);
  }
}

console.log(`DE parity: ${translatedStrings}/${sourceStrings} inspected marketing strings; ${posts.length} blog articles; ${cases.length} case studies`);
if (warnings.length) console.log(`Review warnings (${warnings.length}):\n - ${warnings.slice(0,15).join('\n - ')}`);
if (errors.length) {
  console.error(`DE publication blocked: ${errors.length} missing/inconsistent entries\n - ${errors.slice(0,35).join('\n - ')}`);
  process.exitCode = 1;
} else {
  console.log('German content structurally complete. Human translation/legal review still required.');
}
