const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const qaDir = path.join(__dirname, '../qa/screenshots');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    if (body) reqOptions.headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function auditWordCount() {
  console.log('===============================================================');
  console.log('  PHASE 6: ABOVE-THE-FOLD VISIBLE WORD COUNT AUDIT');
  console.log('  Target: <= 60 words above the fold (390x844px Mobile Viewport)');
  console.log('===============================================================\n');

  // 1. Get Auth Token
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  const token = loginRes.body?.token;
  const user = loginRes.body?.user;
  if (!token) throw new Error('Failed to obtain token for word count audit');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];

  try {
    const page = await browser.newPage();
    // 390px mobile viewport (iPhone 12/13/14 baseline)
    await page.setViewport({ width: 390, height: 844 });

    // Set auth & English language
    await page.goto('http://localhost:5273', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('agri_token', t);
      localStorage.setItem('agri_user', JSON.stringify(u));
      localStorage.setItem('agriadvisor_token', t);
      localStorage.setItem('agriadvisor_user', JSON.stringify(u));
      localStorage.setItem('i18nextLng', 'en');
      if (window.i18n) window.i18n.changeLanguage('en');
    }, token, user);

    const screens = [
      { name: 'Today (Home)', path: '/dashboard/overview' },
      { name: 'My Farms', path: '/dashboard/farms' },
      { name: 'AI Predictions', path: '/dashboard/ai-predictions' },
      { name: 'Market Rates', path: '/dashboard/market' }
    ];

    for (const screen of screens) {
      await page.goto(`http://localhost:5273${screen.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 800));

      // Capture screenshot
      const screenShotPath = path.join(qaDir, `phase6_word_count_${screen.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenShotPath });

      // Calculate visible words strictly above the 844px fold
      const audit = await page.evaluate(() => {
        const foldY = 844;
        const visibleTextPieces = [];

        // Select all text-bearing elements
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, span, button, a, label, strong');
        elements.forEach(el => {
          // Exclude invisible, voice assistant panel floating, scripts, SVGs
          if (el.closest('#voice-panel') || el.closest('svg')) return;
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < foldY && rect.width > 0 && rect.height > 0) {
            // Only direct or leaf text to avoid double counting parent and child
            const hasElementChild = Array.from(el.children).some(c => ['H1','H2','H3','P','SPAN','DIV','BUTTON','A'].includes(c.tagName));
            if (!hasElementChild && el.innerText && el.innerText.trim()) {
              visibleTextPieces.push(el.innerText.trim());
            }
          }
        });

        // Combine text, tokenize into words
        const allText = visibleTextPieces.join(' ');
        const words = allText.match(/[a-zA-Z0-9'’\-]+/g) || [];
        return {
          wordCount: words.length,
          sampleWords: words.slice(0, 25).join(' ') + '...',
          totalPieces: visibleTextPieces.length
        };
      });

      results.push({
        screen: screen.name,
        path: screen.path,
        wordCount: audit.wordCount,
        targetPassed: audit.wordCount <= 60,
        sample: audit.sampleWords
      });

      console.log(`Screen: ${screen.name}`);
      console.log(`  Visible words above 844px fold: ${audit.wordCount} words`);
      console.log(`  Target (<= 60 words): ${audit.wordCount <= 60 ? 'PASS' : 'FLAGGED'}`);
      console.log(`  Sample: "${audit.sampleWords}"\n`);
    }

    console.log('===============================================================');
    console.log('  PHASE 6 WORD COUNT AUDIT SUMMARY');
    console.log('===============================================================');
    results.forEach(r => {
      console.log(`  ${r.screen.padEnd(20)}: ${r.wordCount} words (Target <= 60: ${r.targetPassed ? 'PASS' : 'EXCEEDED'})`);
    });
    console.log('===============================================================\n');

    fs.writeFileSync(path.join(qaDir, 'phase6_word_count_report.json'), JSON.stringify(results, null, 2), 'utf-8');

  } finally {
    await browser.close();
  }
}

auditWordCount().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
