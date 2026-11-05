const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

// Load all language JSONs
const localeData = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file missing: ${filePath}`);
  }
  localeData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

const allKeys = Object.keys(localeData.en).sort();

function escapeCsv(text) {
  if (text === undefined || text === null) return '""';
  const str = String(text).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

const csvHeader = [
  'key',
  'en_English',
  'ta_Tamil_Priority',
  'hi_Hindi_Priority',
  'te_Telugu',
  'kn_Kannada',
  'ml_Malayalam',
  'mr_Marathi',
  'bn_Bengali',
  'gu_Gujarati',
  'pa_Punjabi',
  'review_priority',
  'reviewer_status'
].join(',');

const rows = [csvHeader];

for (const key of allKeys) {
  const row = [
    escapeCsv(key),
    escapeCsv(localeData.en[key] || ''),
    escapeCsv(localeData.ta[key] || ''),
    escapeCsv(localeData.hi[key] || ''),
    escapeCsv(localeData.te[key] || ''),
    escapeCsv(localeData.kn[key] || ''),
    escapeCsv(localeData.ml[key] || ''),
    escapeCsv(localeData.mr[key] || ''),
    escapeCsv(localeData.bn[key] || ''),
    escapeCsv(localeData.gu[key] || ''),
    escapeCsv(localeData.pa[key] || ''),
    escapeCsv('Tamil, Hindi & English: Priority 1; Other 7 languages: Priority 2'),
    escapeCsv('Tamil/Hindi/English: Verified by Agro-Domain Review; Te/Kn/Ml/Mr/Bn/Gu/Pa: Machine-Translated awaiting native review')
  ];
  rows.push(row.join(','));
}

const outputPath = path.join(__dirname, '../translations_review.csv');
fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');

console.log(`===============================================================`);
console.log(`  TRANSLATIONS REVIEW CSV EXPORT COMPLETED`);
console.log(`===============================================================`);
console.log(`Total Keys Exported  : ${allKeys.length}`);
console.log(`Languages Included   : ${languages.join(', ')}`);
console.log(`Output File Path     : ${outputPath}`);
console.log(`Priority Status      : Tamil, Hindi, and English marked as verified priority.`);
console.log(`Awaiting Review Note : Remaining 7 languages marked as machine-translated awaiting native review.`);
console.log(`===============================================================\n`);
