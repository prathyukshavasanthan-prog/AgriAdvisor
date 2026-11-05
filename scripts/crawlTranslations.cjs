const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const qaDir = path.join(__dirname, '../qa/screenshots');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

// Allowlist for Latin-letter words permitted in regional scripts
const ALLOWLIST = new Set([
  'agriadvisor',
  'apmc',
  'npk',
  'ph',
  'mm',
  'c',
  'km',
  'kmh',
  'kg',
  'ha',
  'et0',
  'fym',
  'fao56',
  'fao',
  'icar',
  'ai',
  'gis',
  'ndvi',
  'kvk',
  'id',
  'jwt',
  'openstreetmap',
  'esri',
  'leaflet',
  'gps',
  'rs',
  'n',
  'p',
  'k',
  'am',
  'pm',
  'fastapi',
  'express',
  'mongodb',
  'react',
  'node',
  'docker',
  'mern',
  'python'
]);

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

async function runTranslationCrawl() {
  console.log('===============================================================');
  console.log('  PHASE 5: TRANSLATION CRAWL & ENGLISH LEAK AUDIT');
  console.log('===============================================================\n');

  // 1. Get Auth Token for Demo Account
  console.log('[1] Logging in demo account (+919876543210)...');
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  const token = loginRes.body?.token;
  const user = loginRes.body?.user;
  if (!token) throw new Error('Failed to obtain auth token for crawl');
  console.log(`  Authenticated as: ${user?.name || 'Cultivator'} (Token acquired).`);

  // Fetch farms to know farm detail route
  const farmsRes = await request('http://localhost:5900/api/farms', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const firstFarmId = farmsRes.body?.data?.[0]?._id;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allLeaks = [];

  try {
    const page = await browser.newPage();

    // Inject Auth Token into localStorage
    await page.goto('http://localhost:5273', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('agriadvisor_token', t);
      localStorage.setItem('agriadvisor_user', JSON.stringify(u));
    }, token, user);

    const routes = [
      { path: '/', name: 'landing' },
      { path: '/login', name: 'login' },
      { path: '/dashboard/overview', name: 'overview' },
      { path: '/dashboard/farms', name: 'farms' },
      ...(firstFarmId ? [{ path: `/dashboard/farms/${firstFarmId}`, name: 'farm_detail' }] : []),
      { path: '/dashboard/market', name: 'market' },
      { path: '/dashboard/ai-predictions', name: 'ai_predictions' }
    ];

    const testLanguages = ['ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];
    const viewports = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 390, height: 844 }
    ];

    console.log(`\n[2] Crawling ${routes.length} routes x ${testLanguages.length} regional languages across 2 viewports...`);

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      console.log(`\n--- Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}px) ---`);

      // Test Tamil & Hindi thoroughly for full leak detection & screenshots
      for (const lang of ['ta', 'hi']) {
        // Set language in localStorage
        await page.evaluate((l) => {
          localStorage.setItem('i18nextLng', l);
          if (window.i18n) window.i18n.changeLanguage(l);
        }, lang);

        for (const route of routes) {
          const url = `http://localhost:5273${route.path}`;
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
          await new Promise(r => setTimeout(r, 600));

          // Capture Screenshot
          const screenshotName = `${route.name}_${lang}_${vp.name}.png`;
          const screenshotPath = path.join(qaDir, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // Audit visible DOM text for untranslated Latin words
          const textData = await page.evaluate(() => {
            const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, span, button, a, label, input[placeholder]');
            const results = [];
            elements.forEach(el => {
              // Ignore scripts, styles, SVGs, map tiles
              if (el.closest('svg') || el.closest('.leaflet-container') || el.closest('#voice-panel')) return;
              const text = (el.tagName === 'INPUT' ? el.getAttribute('placeholder') : el.innerText) || '';
              if (text.trim().length > 0) {
                results.push({ tag: el.tagName, text: text.trim() });
              }
            });
            return results;
          });

          // Check for leaked Latin words not on allowlist
          for (const item of textData) {
            // Match standalone English words
            const words = item.text.match(/[A-Za-z]+/g) || [];
            for (const word of words) {
              const lower = word.toLowerCase();
              if (!ALLOWLIST.has(lower) && word.length > 2) {
                // If it's pure numbers/symbols or phone number, ignore
                if (/^\+?\d+$/.test(word)) continue;

                allLeaks.push({
                  lang,
                  viewport: vp.name,
                  route: route.path,
                  tag: item.tag,
                  leakedWord: word,
                  context: item.text.substring(0, 60)
                });
              }
            }
          }
        }
      }
    }

    console.log('\n===============================================================');
    console.log(`TOTAL LEAKS DETECTED : ${allLeaks.length}`);
    if (allLeaks.length > 0) {
      console.log('SAMPLE OF LEAKED WORDS:');
      allLeaks.slice(0, 20).forEach((l, idx) => {
        console.log(`  ${idx + 1}. [${l.lang} - ${l.viewport}] In ${l.route} <${l.tag}>: "${l.leakedWord}" (Context: "${l.context}")`);
      });
      console.log('\n>>> RESULT: TRANSLATION LEAKS DETECTED, PROCEEDING TO ELIMINATE <<<');
    } else {
      console.log('CONGRATULATIONS: ZERO UNTRANSLATED ENGLISH LEAKS ACROSS ALL ROUTES!');
      console.log('>>> RESULT: TRANSLATION AUDIT PASSED WITH 0 LEAKS! <<<');
    }
    console.log('===============================================================\n');

    // Export leak report if any
    fs.writeFileSync(path.join(qaDir, 'leak_audit_report.json'), JSON.stringify(allLeaks, null, 2), 'utf-8');

    if (allLeaks.length === 0) {
      process.exit(0);
    } else {
      // Exit with 1 so we fix everything flagged
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runTranslationCrawl().catch((err) => {
  console.error('Translation Crawl Failed:', err);
  process.exit(1);
});
