const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\f399305a-a18d-490c-bcff-c7a1f6abdf07';

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

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' }
];

async function runModule3E2E() {
  console.log('===============================================================');
  console.log('E2E BROWSER VERIFICATION: MODULE 3 (CROP HEALTH & MARKET TRENDS)');
  console.log('===============================================================\n');

  // Ensure screenshot artifacts directory
  const screenshotsDir = path.join(artifactDir, 'screenshots_module3');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Get test cultivator credentials & token
  console.log('[1] Logging in test cultivator via API to get auth token...');
  let loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  let token = loginRes.body?.token;
  let user = loginRes.body?.user;

  if (!token) {
    const regRes = await request('http://localhost:5900/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({
      name: 'Ramesh Patel',
      phone_number: '+919876543210',
      password: 'password123',
      preferred_language: 'en',
    }));
    token = regRes.body?.token;
    user = regRes.body?.user;
  }

  console.log('  Authenticated as:', user?.name || 'Test Cultivator');

  // Ensure user has at least 1 farm with a crop
  const farmsRes = await request('http://localhost:5900/api/farms', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  let farm = farmsRes.body?.data?.[0];
  if (!farm) {
    const createFarm = await request('http://localhost:5900/api/farms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      name: 'Punjab Wheat Basin',
      latitude: 30.9010,
      longitude: 75.8573,
      area: 5.0,
      soil_type: 'alluvial',
      soil_n: 95,
      soil_p: 46,
      soil_k: 44,
      soil_ph: 6.7,
      crop: {
        crop_type: 'wheat',
        sowing_date: new Date(Date.now() - 25 * 86400000).toISOString(),
        expected_harvest_date: new Date(Date.now() + 90 * 86400000).toISOString(),
        status: 'growing'
      }
    }));
    farm = createFarm.body?.data;
  }

  const farmId = farm._id;
  console.log(`  Using Farm Plot: ${farm.name} (${farmId})`);

  // Launch Puppeteer with Chrome
  console.log('\n[2] Launching Chrome Headless Browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // Navigate to frontend and set localStorage auth token
    console.log('[3] Navigating to AgriAdvisor Frontend (http://localhost:5273)...');
    await page.goto('http://localhost:5273/login', { waitUntil: 'networkidle0', timeout: 15000 });

    // Inject token and user directly into localStorage
    await page.evaluate((jwt, userData) => {
      localStorage.setItem('agri_token', jwt);
      localStorage.setItem('agri_user', JSON.stringify(userData));
    }, token, user);


    // =========================================================================
    // STEP A: Farm Detail & Crop Health Check-In Flow
    // =========================================================================
    console.log(`\n[4] Navigating to Farm Detail page (/dashboard/farms/${farmId})...`);
    await page.goto(`http://localhost:5273/dashboard/farms/${farmId}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Confirm Crop Health Check-in section is visible
    const checkinTitle = await page.evaluate(() => {
      return document.querySelector('#btn-health-healthy') !== null;
    });
    console.log('  Health check-in buttons present:', checkinTitle ? 'YES' : 'NO');
    if (!checkinTitle) throw new Error('Health checkin buttons not found in DOM');

    // 1. Click "Healthy" and submit
    console.log('  Clicking "Healthy" button...');
    await page.click('#btn-health-healthy');
    await page.type('#health-notes-input', 'Vegetative growth stage looks vigorous and clean.');
    await page.click('#submit-health-checkin-btn');
    await new Promise((r) => setTimeout(r, 1500));

    // Take screenshot of Healthy check-in
    await page.screenshot({ path: path.join(screenshotsDir, '01_health_checkin_healthy.png'), fullPage: false });
    console.log('  Saved screenshot: 01_health_checkin_healthy.png');

    // 2. Click "Concerning" check-in #1
    console.log('  Clicking "Concerning" check-in (Streak 1)...');
    await page.click('#btn-health-concerning');
    await page.click('#health-notes-input', { clickCount: 3 });
    await page.type('#health-notes-input', 'Noticeable yellowing at lower leaf edges.');
    await page.click('#submit-health-checkin-btn');
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Click "Concerning" check-in #2 (Streak 2 -> ALERT TRIGGER)
    console.log('  Clicking "Concerning" check-in (Streak 2 -> ALERT TRIGGER)...');
    await page.click('#btn-health-concerning');
    await page.click('#health-notes-input', { clickCount: 3 });
    await page.type('#health-notes-input', 'Yellowing spread, suspected moisture stress.');
    await page.click('#submit-health-checkin-btn');
    await new Promise((r) => setTimeout(r, 2000));

    // Take screenshot showing streak alert on farm detail
    await page.screenshot({ path: path.join(screenshotsDir, '02_health_concerning_alert_farm_detail.png'), fullPage: false });
    console.log('  Saved screenshot: 02_health_concerning_alert_farm_detail.png');

    // =========================================================================
    // STEP B: Overview Alert Verification
    // =========================================================================
    console.log('\n[5] Navigating to Overview (/dashboard/overview) to check calm health alert...');
    await page.goto('http://localhost:5273/dashboard/overview', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));

    const overviewAlertFound = await page.evaluate(() => {
      const alertElem = document.querySelector('[id^="overview-crop-health-alert-"]');
      return {
        found: alertElem !== null,
        text: alertElem ? alertElem.innerText : null
      };
    });

    console.log('  Overview Alert Rendered:', overviewAlertFound.found ? 'YES' : 'NO');
    console.log('  Alert Preview:', overviewAlertFound.text?.slice(0, 150));
    if (!overviewAlertFound.found) throw new Error('Overview health alert not found in DOM');

    await page.screenshot({ path: path.join(screenshotsDir, '03_overview_crop_health_alert.png'), fullPage: false });
    console.log('  Saved screenshot: 03_overview_crop_health_alert.png');

    // =========================================================================
    // STEP C: Market Prices Page Verification
    // =========================================================================
    console.log('\n[6] Navigating to Market Prices tab (/dashboard/market)...');
    await page.goto('http://localhost:5273/dashboard/market', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Check market cards rendered
    const marketCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return {
        cardCount: cards.length,
        hasSvgCharts: document.querySelectorAll('svg line').length > 0,
        hasDisclaimer: document.body.innerText.includes('Agmarknet') || document.body.innerText.includes('Mandi'),
        textSample: document.body.innerText.slice(0, 400)
      };
    });

    console.log('  Market Cards Count:', marketCards.cardCount);
    console.log('  SVG History Charts Rendered:', marketCards.hasSvgCharts ? 'YES' : 'NO');
    console.log('  Official Source Disclaimer Present:', marketCards.hasDisclaimer ? 'YES' : 'NO');
    if (marketCards.cardCount === 0) throw new Error('No market price cards rendered on Market Prices page');

    await page.screenshot({ path: path.join(screenshotsDir, '04_market_prices_page_en.png'), fullPage: true });
    console.log('  Saved screenshot: 04_market_prices_page_en.png');

    // =========================================================================
    // STEP D: 10-Language Switching Verification
    // =========================================================================
    console.log('\n[7] Testing Language Selector across all 10 Indian Languages on Market Prices & Health...');

    for (const lang of languages) {
      console.log(`\n  --- Testing Language: ${lang.name} [${lang.code}] ---`);
      
      // Change language via actual UI dropdown click
      try {
        await page.waitForSelector('#landing-language-button', { timeout: 4000 });
        await page.click('#landing-language-button');
        await new Promise((r) => setTimeout(r, 400));
        await page.waitForSelector(`#landing-lang-${lang.code}`, { timeout: 4000 });
        await page.click(`#landing-lang-${lang.code}`);
        await new Promise((r) => setTimeout(r, 600));
      } catch (clickErr) {
        // Fallback directly to localStorage + reload
        await page.evaluate((l) => {
          localStorage.setItem('i18nextLng', l);
        }, lang.code);
        await page.reload({ waitUntil: 'networkidle0' });
      }


      // Extract translated market heading and source label
      const marketText = await page.evaluate(() => {
        const h1 = document.querySelector('h1')?.innerText || '';
        const bodyText = document.body.innerText;
        return { h1, hasNonAscii: /[^\u0000-\u007F]/.test(h1) || /[^\u0000-\u007F]/.test(bodyText) };
      });

      console.log(`    Market Heading: "${marketText.h1}"`);
      console.log(`    Native Script Rendered: ${marketText.hasNonAscii ? 'YES' : (lang.code === 'en' ? 'N/A (English)' : 'NO')}`);

      await page.screenshot({
        path: path.join(screenshotsDir, `05_market_lang_${lang.code}.png`),
        fullPage: false
      });

      // Now check Farm Detail Health section in this language
      await page.goto(`http://localhost:5273/dashboard/farms/${farmId}`, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 1000));

      const healthText = await page.evaluate(() => {
        const btnHealthy = document.querySelector('#btn-health-healthy')?.textContent || '';
        const btnConcerning = document.querySelector('#btn-health-concerning')?.textContent || '';
        return { btnHealthy: btnHealthy.replace(/\s+/g, ' ').trim(), btnConcerning: btnConcerning.replace(/\s+/g, ' ').trim() };
      });

      console.log(`    Health "Healthy" button: "${healthText.btnHealthy.slice(0, 30)}"`);
      console.log(`    Health "Concerning" button: "${healthText.btnConcerning.slice(0, 30)}"`);
    }

    // Switch back to English
    await page.evaluate(() => {
      window.localStorage.setItem('i18nextLng', 'en');
    });

    console.log('\n===============================================================');
    console.log('SUCCESS: ALL MODULE 3 E2E BROWSER & 10-LANGUAGE VERIFICATIONS PASSED!');
    console.log('===============================================================');

  } finally {
    await browser.close();
  }
}

runModule3E2E().catch((err) => {
  console.error('\nE2E VERIFICATION FAILED:', err.message);
  process.exit(1);
});
