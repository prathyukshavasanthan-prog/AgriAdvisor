const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
const languages = ['ta', 'en', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const enKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))).sort();
console.log(`Base reference 'en.json' has ${enKeys.length} keys.`);

let allValid = true;

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File missing: ${filePath}`);
    allValid = false;
    return;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const currentKeys = Object.keys(content).sort();

  const missing = enKeys.filter(k => !currentKeys.includes(k));
  const extra = currentKeys.filter(k => !enKeys.includes(k));

  if (missing.length > 0) {
    console.error(`ERROR: Language '${lang}' is missing keys:`, missing);
    allValid = false;
  }
  if (extra.length > 0) {
    console.warn(`WARNING: Language '${lang}' has extra keys:`, extra);
    allValid = false;
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✓ Language '${lang}' has 100% key parity (${currentKeys.length}/${enKeys.length} keys).`);
  }
});

if (allValid) {
  console.log('SUCCESS: All 10 language JSON files have identical, complete key coverage!');
} else {
  console.error('FAILURE: Discrepancies found in translation keys.');
  process.exit(1);
}
