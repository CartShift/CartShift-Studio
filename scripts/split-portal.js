/**
 * Split portal.json into granular feature files
 * Run once to reorganize messages/src/{locale}/portal.json -> messages/src/{locale}/portal/*.json
 */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(process.cwd(), 'messages');
const srcDir = path.join(messagesDir, 'src');
const locales = ['en', 'he'];

function splitPortal(locale) {
  const portalFilePath = path.join(srcDir, locale, 'portal.json');
  const outputDir = path.join(srcDir, locale, 'portal');

  if (!fs.existsSync(portalFilePath)) {
    console.warn(`⚠️  ${portalFilePath} not found. Skipping.`);
    return;
  }

  console.log(`\nProcessing ${locale} portal.json...`);

  const content = JSON.parse(fs.readFileSync(portalFilePath, 'utf8'));

  if (!content.portal) {
    console.error(`❌ 'portal' key not found in ${locale}/portal.json. Is it already split?`);
    return;
  }

  // Create subfolder
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const portalData = content.portal;
  let splitCount = 0;

  for (const [key, value] of Object.entries(portalData)) {
    // We wrap each file in { "portal": { "key": ... } } to maintain structure on merge
    const fileContent = {
      portal: {
        [key]: value
      }
    };

    // Sort keys just in case, though usually not needed if object is simple
    const outputPath = path.join(outputDir, `${key}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(fileContent, null, 2));
    splitCount++;
  }

  console.log(`✅ Created ${splitCount} files in messages/src/${locale}/portal/`);

  // Remove the original file to prevent duplicates
  fs.unlinkSync(portalFilePath);
  console.log(`🗑️  Removed ${locale}/portal.json`);
}

// Execute
locales.forEach(splitPortal);
console.log('\n✨ Split complete. Run `npm run i18n:merge` to regenerate main translation files.');
