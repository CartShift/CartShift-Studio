/**
 * Verify all portal.onboarding translation keys are present and valid
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '..', 'messages');
const locales = ['en', 'he'];

const requiredKeys = [
  'portal.onboarding.skip',
  'portal.onboarding.step',
  'portal.onboarding.prev',
  'portal.onboarding.next',
  'portal.onboarding.start',
  'portal.onboarding.goToStep',
  'portal.onboarding.keyboardHint',
  'portal.onboarding.steps.welcome.title',
  'portal.onboarding.steps.welcome.description',
  'portal.onboarding.steps.dashboard.title',
  'portal.onboarding.steps.dashboard.description',
  'portal.onboarding.steps.requests.title',
  'portal.onboarding.steps.requests.description',
  'portal.onboarding.steps.pricing.title',
  'portal.onboarding.steps.pricing.description',
  'portal.onboarding.steps.team.title',
  'portal.onboarding.steps.team.description',
  'portal.onboarding.steps.notifications.title',
  'portal.onboarding.steps.notifications.description',
  'portal.onboarding.steps.complete.title',
  'portal.onboarding.steps.complete.description',
  // Welcome Step
  'portal.onboarding.welcome.title',
  'portal.onboarding.welcome.subtitle',
  'portal.onboarding.welcome.description',
  'portal.onboarding.welcome.cta',
  // Info Step
  'portal.onboarding.info.title',
  'portal.onboarding.info.subtitle',
  // Form
  'portal.onboarding.form.orgNameLabel',
  'portal.onboarding.form.orgNamePlaceholder',
  'portal.onboarding.form.orgNameHint',
  'portal.onboarding.form.industryLabel',
  'portal.onboarding.form.industrySelectPlaceholder',
  'portal.onboarding.form.sizeLabel',
  'portal.onboarding.form.sizeSelectPlaceholder',
  'portal.onboarding.form.employeesLabel',
  'portal.onboarding.form.createButton',
  // Completion Step
  'portal.onboarding.completion.title',
  'portal.onboarding.completion.subtitle',
  'portal.onboarding.completion.description',
  'portal.onboarding.completion.cta',
  // General
  'portal.onboarding.back',
  'portal.onboarding.error',
  // Settings
  'portal.settings.general.onboarding.title',
  'portal.settings.general.onboarding.description',
  'portal.settings.general.onboarding.button',
  'portal.settings.general.onboarding.success',
  'portal.settings.general.onboarding.error',
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function verifyTranslations() {
  console.log('🔍 Verifying portal.onboarding translations...\n');

  let allValid = true;
  const errors = [];

  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      allValid = false;
      continue;
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingKeys = [];
    const emptyValues = [];

    console.log(`\n📋 Checking ${locale}.json:`);

    for (const key of requiredKeys) {
      const value = getNestedValue(content, key);

      if (value === undefined) {
        missingKeys.push(key);
        errors.push(`  ❌ Missing: ${key} in ${locale}.json`);
      } else if (typeof value === 'string' && value.trim() === '') {
        emptyValues.push(key);
        errors.push(`  ⚠️  Empty: ${key} in ${locale}.json`);
      }
    }

    if (missingKeys.length === 0 && emptyValues.length === 0) {
      console.log(`  ✅ All ${requiredKeys.length} keys present and valid`);
    } else {
      allValid = false;
      if (missingKeys.length > 0) {
        console.log(`  ❌ Missing ${missingKeys.length} keys:`);
        missingKeys.forEach(k => console.log(`     - ${k}`));
      }
      if (emptyValues.length > 0) {
        console.log(`  ⚠️  ${emptyValues.length} empty values:`);
        emptyValues.forEach(k => console.log(`     - ${k}`));
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allValid) {
    console.log('✅ All portal.onboarding translations are valid!');
    return 0;
  } else {
    console.log('❌ Translation verification failed!\n');
    errors.forEach(e => console.log(e));
    return 1;
  }
}

const exitCode = verifyTranslations();
process.exit(exitCode);
