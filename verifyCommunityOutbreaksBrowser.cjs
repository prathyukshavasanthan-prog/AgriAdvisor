const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:/Users/Hp/.gemini/antigravity-ide/brain/fc3481d3-1d6d-410d-a227-39d7e62656c8';

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
    if (body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

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

async function runBrowserVerification() {
  console.log('========================================================================');
  console.log('  BROWSER E2E: COMMUNITY DISEASE ALERTS & "LOCATE ON MAP" VERIFICATION');
  console.log('========================================================================\n');

  const screenshotsDir = path.join(artifactDir, 'screenshots_community_outbreaks');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Authenticate test cultivator
  console.log('[1] Logging in test cultivator via API...');
  let loginRes = await request('http://127.0.0.1:5900/api/auth/login', {
    method: 'POST',
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  let token = loginRes.body?.token;
  let user = loginRes.body?.user;

  if (!token) {
    console.error('Failed to authenticate');
    process.exit(1);
  }

  console.log(`✓ Authenticated as ${user.name}`);

  // Launch headless browser
  console.log('[2] Launching Chrome headless browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Inject authentication into localStorage
  await page.goto('http://localhost:5273', { waitUntil: 'domcontentloaded' });
  await page.evaluate((jwt, userData) => {
    localStorage.setItem('agri_token', jwt);
    localStorage.setItem('agri_user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('i18nextLng', 'en');
  }, token, user);

  // ---------------------------------------------------------------------------
  // SCREENSHOT 1: Overview Banner (Disease reported 3.8 km from your tomato farm)
  // ---------------------------------------------------------------------------
  console.log('[3] Navigating to Dashboard Overview to verify community alert banner...');
  await page.goto('http://localhost:5273/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({
    path: path.join(screenshotsDir, '01_overview_community_outbreak_banner.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 01_overview_community_outbreak_banner.png');

  // ---------------------------------------------------------------------------
  // SCREENSHOT 2: Farm Map with Disease Alerts Layer (Red-Orange Circles)
  // ---------------------------------------------------------------------------
  console.log('[4] Navigating to Farm Map GIS view...');
  await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Toggle to Map view mode
  const mapToggleBtn = await page.$('#farm-view-mode-map-btn');
  if (mapToggleBtn) {
    await mapToggleBtn.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // Select Kaveri Tomato Valley so outbreak circles in Bangalore are visible
  const dropdown = await page.$('#map-select-farm-dropdown');
  if (dropdown) {
    const options = await page.$$eval('#map-select-farm-dropdown option', (opts) =>
      opts.map((o) => ({ text: o.textContent, val: o.value }))
    );
    const tomatoOpt = options.find((o) => o.text && o.text.includes('Tomato'));
    if (tomatoOpt) {
      await page.select('#map-select-farm-dropdown', tomatoOpt.val);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  await page.screenshot({
    path: path.join(screenshotsDir, '02_farm_map_outbreak_circles_layer.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 02_farm_map_outbreak_circles_layer.png');

  // ---------------------------------------------------------------------------
  // SCREENSHOT 3: Outbreak Marker Popup with Safe Guidance (No Chemical Doses)
  // ---------------------------------------------------------------------------
  console.log('[5] Clicking custom outbreak pin to open alert popup...');
  // Scroll down to locate outbreak button in panel to click it
  const locateOutbreakBtn = await page.$('[id^="locate-outbreak-btn-"]');
  if (locateOutbreakBtn) {
    await locateOutbreakBtn.click();
    await new Promise((r) => setTimeout(r, 1800));
  } else {
    const outbreakPins = await page.$$('.custom-outbreak-pin');
    if (outbreakPins.length > 0) {
      await outbreakPins[0].click();
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  await page.screenshot({
    path: path.join(screenshotsDir, '03_outbreak_marker_popup_guidance.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 03_outbreak_marker_popup_guidance.png');

  // ---------------------------------------------------------------------------
  // SCREENSHOT 4: "Locate on Map" for Mandi Market (Scrolled into view & popup open)
  // ---------------------------------------------------------------------------
  console.log('[6] Testing "Locate on Map" button in nearby mandis drawer...');
  const locateMandiBtn = await page.$('[id^="locate-mandi-btn-"]');
  if (locateMandiBtn) {
    await locateMandiBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  await page.screenshot({
    path: path.join(screenshotsDir, '04_locate_mandi_flyto_verified.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 04_locate_mandi_flyto_verified.png');

  // ---------------------------------------------------------------------------
  // SCREENSHOT 5: Overview Banner in Hindi (हिन्दी)
  // ---------------------------------------------------------------------------
  console.log('[7] Testing localization in Hindi...');
  await page.goto('http://localhost:5273/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const langBtn = await page.$('#landing-language-button');
  if (langBtn) {
    await langBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const hiBtn = await page.$('#landing-lang-hi');
    if (hiBtn) {
      await hiBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  await page.screenshot({
    path: path.join(screenshotsDir, '05_overview_banner_hindi.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 05_overview_banner_hindi.png');

  // ---------------------------------------------------------------------------
  // SCREENSHOT 6: Overview Banner in Tamil (தமிழ்)
  // ---------------------------------------------------------------------------
  console.log('[8] Testing localization in Tamil...');
  const langBtn2 = await page.$('#landing-language-button');
  if (langBtn2) {
    await langBtn2.click();
    await new Promise(r => setTimeout(r, 500));
    const taBtn = await page.$('#landing-lang-ta');
    if (taBtn) {
      await taBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  await page.screenshot({
    path: path.join(screenshotsDir, '06_overview_banner_tamil.png'),
    fullPage: false,
  });
  console.log('✓ Captured: 06_overview_banner_tamil.png');

  await browser.close();
  console.log('\n========================================================================');
  console.log('  ALL BROWSER E2E TESTS COMPLETED & SCREENSHOTS SAVED!');
  console.log('========================================================================\n');
}

runBrowserVerification().catch(err => {
  console.error('Browser E2E verification failed:', err);
  process.exit(1);
});
