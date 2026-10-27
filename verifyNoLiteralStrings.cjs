const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');
let violations = [];

function checkFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Detect raw text inside JSX elements like <span>Text</span>, <p>Text</p>, <div>Text</div>
    // Skip imports, comments, console, or already localized lines with t(
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('import ') || trimmed.includes('console.')) return;

    // Check if line contains raw text between > and <
    const matches = trimmed.match(/>([^<>{}\n]+)</g);
    if (matches) {
      for (const m of matches) {
        const text = m.substring(1, m.length - 1).trim();
        // Ignore numbers, symbols, spaces, single characters
        if (text.length > 2 && /[a-zA-Z]{3,}/.test(text)) {
          // Check if it's an allowed technical keyword or unit
          const allowed = ['AgriAdvisor', 'NPK', 'APMC', 'GPS', 'FAO', 'ICAR', 'AI'];
          if (!allowed.includes(text)) {
            violations.push({
              file: path.relative(srcDir, filePath),
              line: idx + 1,
              text
            });
          }
        }
      }
    }
  });
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') walk(full);
    } else {
      checkFile(full);
    }
  }
}

walk(srcDir);

console.log('===============================================================');
console.log('  JSX LITERAL STRINGS LINT AUDIT');
console.log('===============================================================');
console.log(`Audited: ${srcDir}`);
console.log(`Violations Found: ${violations.length}`);

if (violations.length > 0) {
  console.log('\nFlagged literal strings in JSX:');
  violations.slice(0, 15).forEach(v => {
    console.log(`  ${v.file}:${v.line} -> "${v.text}"`);
  });
} else {
  console.log('PASS: Zero forbidden JSX literal text strings found across all components!');
}
console.log('===============================================================\n');

if (violations.length > 0) {
  // Return list for review
}
