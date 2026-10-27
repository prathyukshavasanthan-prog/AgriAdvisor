const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const localeData = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file missing: ${filePath}`);
  }
  localeData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

const baseKeys = Object.keys(localeData.en);
console.log('===============================================================');
console.log('  AGRIADVISOR TRANSLATION AUDIT: KEY & PLACEHOLDER PARITY');
console.log('===============================================================\n');

let keyParityFailures = 0;
let placeholderFailures = 0;

// 1. Check Key Parity
console.log(`[1] Auditing Key Parity against Base 'en.json' (${baseKeys.length} keys)...`);
for (const lang of languages) {
  if (lang === 'en') continue;
  const currentKeys = Object.keys(localeData[lang]);
  const missing = baseKeys.filter(k => !currentKeys.includes(k));
  const extra = currentKeys.filter(k => !baseKeys.includes(k));

  if (missing.length > 0 || extra.length > 0) {
    console.error(`  FAIL: [${lang}] Missing: ${missing.length}, Extra: ${extra.length}`);
    keyParityFailures++;
  } else {
    console.log(`  PASS: [${lang}] 100% key parity (${currentKeys.length}/${baseKeys.length} keys)`);
  }
}

// 2. Check {{placeholder}} Parity
console.log('\n[2] Auditing {{placeholder}} Parity across all translations...');
const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/g;

for (const key of baseKeys) {
  const enVal = String(localeData.en[key] || '');
  const enPlaceholders = [...enVal.matchAll(placeholderRegex)].map(m => m[1]).sort();

  if (enPlaceholders.length > 0) {
    for (const lang of languages) {
      if (lang === 'en') continue;
      const targetVal = String(localeData[lang][key] || '');
      const targetPlaceholders = [...targetVal.matchAll(placeholderRegex)].map(m => m[1]).sort();

      const missingHolders = enPlaceholders.filter(p => !targetPlaceholders.includes(p));
      if (missingHolders.length > 0) {
        console.error(`  FAIL: [${lang}] Key "${key}" missing placeholders: ${missingHolders.join(', ')}`);
        console.error(`    EN: "${enVal}"`);
        console.error(`    ${lang.toUpperCase()}: "${targetVal}"`);
        placeholderFailures++;
      }
    }
  }
}

if (placeholderFailures === 0) {
  console.log('  PASS: All interpolation placeholders {{...}} matched with 100% parity across all 10 languages.');
}

console.log('\n===============================================================');
if (keyParityFailures === 0 && placeholderFailures === 0) {
  console.log('  AUDIT PASSED: ZERO TRANSLATION KEY OR PLACEHOLDER DEFECTS!');
  console.log('===============================================================\n');
  process.exit(0);
} else {
  console.error(`  AUDIT FAILED: ${keyParityFailures} key parity errors, ${placeholderFailures} placeholder errors.`);
  console.log('===============================================================\n');
  process.exit(1);
}
