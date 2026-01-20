/**
 * Split existing translation files into source chunks and create merge script
 * Run once to initialize the source file structure
 */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(process.cwd(), 'messages');
const srcDir = path.join(messagesDir, 'src');

// Define which top-level keys go into which category
const categories = {
  common: [
    'nav',
    'floatingActions',
    'errorBoundary',
    'breadcrumbs',
    'toast',
    'errorState',
    'emptyState',
    'common',
    'navigation',
    'faq',
    'seo',
    'notFound',
    'stickyCta',
  ],
  website: [
    'hero',
    'heroForm',
    'about',
    'shopify',
    'wordpress',
    'blog',
    'blogTeaser',
    'blogPost',
    'contact',
    'pricing',
    'maintenance',
    'work',
    'testimonials',
    'whyChoose',
    'servicesOverview',
    'ctaBanner',
    'footer',
    'process',
    'stats',
    'industries',
    'industriesContent',
  ],
  portal: [
    'portal',
    'agency',
    'requests',
    'team',
    'consultations',
    'dashboard',
    'activity',
    'onboarding',
  ],
  legal: ['privacy', 'terms'],
};

function splitTranslations(locale) {
  const inputPath = path.join(messagesDir, `${locale}.json`);
  const outputDir = path.join(srcDir, locale);

  console.log(`\nProcessing ${locale}...`);

  // Read the full translation file
  const content = fs.readFileSync(inputPath, 'utf8');
  const translations = JSON.parse(content);

  // Track which keys were categorized
  const categorizedKeys = new Set();

  // Create each category file
  for (const [category, keys] of Object.entries(categories)) {
    const categoryContent = {};

    for (const key of keys) {
      if (translations[key]) {
        categoryContent[key] = translations[key];
        categorizedKeys.add(key);
      }
    }

    if (Object.keys(categoryContent).length > 0) {
      const outputPath = path.join(outputDir, `${category}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(categoryContent, null, 2));
      console.log(`  Created ${category}.json (${Object.keys(categoryContent).length} keys)`);
    }
  }

  // Check for uncategorized keys
  const allKeys = Object.keys(translations);
  const uncategorized = allKeys.filter(key => !categorizedKeys.has(key));

  if (uncategorized.length > 0) {
    console.log(`  ⚠️  Uncategorized keys: ${uncategorized.join(', ')}`);
    // Add uncategorized to common.json
    const commonPath = path.join(outputDir, 'common.json');
    const commonContent = JSON.parse(fs.readFileSync(commonPath, 'utf8'));

    for (const key of uncategorized) {
      commonContent[key] = translations[key];
    }

    fs.writeFileSync(commonPath, JSON.stringify(commonContent, null, 2));
    console.log(`  Added ${uncategorized.length} uncategorized keys to common.json`);
  }
}

// Create source directories if they don't exist
fs.mkdirSync(path.join(srcDir, 'en'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'he'), { recursive: true });

// Split both locales
splitTranslations('en');
splitTranslations('he');

console.log('\n✅ Split complete! Source files created in messages/src/');
console.log('\nRun `node scripts/merge-translations.js` to merge back.');
