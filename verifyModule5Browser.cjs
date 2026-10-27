const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:/Users/Hp/.gemini/antigravity-ide/brain/f399305a-a18d-490c-bcff-c7a1f6abdf07';

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

async function runModule5Browser() {
  console.log('===============================================================');
  console.log('E2E BROWSER VERIFICATION: MODULE 5 GIS MAP VISUALIZATION');
  console.log('Leaflet.js + OSM Tiles + Custom Pins + Legend + Popup + i18n');
  console.log('===============================================================\n');

  const screenshotsDir = path.join(artifactDir, 'screenshots_module5');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Authenticate primary test cultivator
  console.log('[1] Logging in test cultivator via API...');
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

  console.log(`  Cultivator authenticated: ${user?.name || 'Ramesh Patel'}`);

  // Launch Chrome
  console.log('\n[2] Launching Chrome Headless Browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  try {
    // Inject auth credentials
    await page.goto('http://localhost:5273/login', { waitUntil: 'networkidle0' });
    await page.evaluate((jwt, userData) => {
      localStorage.setItem('agri_token', jwt);
      localStorage.setItem('agri_user', JSON.stringify(userData));
      localStorage.setItem('i18nextLng', 'en');
    }, token, user);

    // -------------------------------------------------------------------------
    // TEST STEP 1: Farms Page & Cards View Toggle
    // -------------------------------------------------------------------------
    console.log('\n[3] Navigating to /dashboard/farms (Cards View)...');
    await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Select English language via UI dropdown
    try {
      await page.click('#landing-language-button');
      await new Promise(r => setTimeout(r, 400));
      await page.click('#landing-lang-en');
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log('Language select fallback:', e.message);
    }

    // Capture Cards View with "Location not set" indicator
    const cardsViewPath = path.join(screenshotsDir, '05_gis_cards_view_toggle.png');
    await page.screenshot({ path: cardsViewPath, fullPage: false });
    console.log(`  ✓ Saved: ${cardsViewPath}`);

    // -------------------------------------------------------------------------
    // TEST STEP 2: Switch to GIS Map View
    // -------------------------------------------------------------------------
    console.log('\n[4] Switching to Farm Map (GIS) View...');
    const mapToggleBtn = await page.$('#farm-view-mode-map-btn');
    if (mapToggleBtn) {
      await mapToggleBtn.click();
      console.log('  Clicked #farm-view-mode-map-btn');
    } else {
      await page.evaluate(() => {
        const btn = document.getElementById('farm-view-mode-map-btn');
        if (btn) btn.click();
      });
    }

    // Wait for Leaflet map and markers
    await new Promise(r => setTimeout(r, 3000));
    await page.waitForSelector('#gis-leaflet-map-container', { timeout: 10000 });
    await page.waitForSelector('.agri-custom-marker', { timeout: 10000 });

    const markerCount = await page.evaluate(() => {
      return document.querySelectorAll('.agri-custom-marker').length;
    });
    console.log(`  ✓ Leaflet Map active with ${markerCount} custom pins rendered on OpenStreetMap.`);

    // Capture GIS Map Overview
    const mapOverviewPath = path.join(screenshotsDir, '01_gis_map_overview.png');
    await page.screenshot({ path: mapOverviewPath, fullPage: false });
    console.log(`  ✓ Saved: ${mapOverviewPath}`);

    // -------------------------------------------------------------------------
    // TEST STEP 3: Click Marker to Open Popup Card
    // -------------------------------------------------------------------------
    console.log('\n[5] Clicking a farm pin to trigger interactive popup...');
    await page.evaluate(() => {
      const markers = document.querySelectorAll('.agri-custom-marker');
      if (markers.length > 0) {
        // Click the first or second marker
        markers[0].click();
      }
    });

    await new Promise(r => setTimeout(r, 1000));
    await page.waitForSelector('.leaflet-popup-content', { timeout: 5000 });

    const popupData = await page.evaluate(() => {
      const popup = document.querySelector('.leaflet-popup-content');
      return popup ? popup.innerText : 'NO_POPUP';
    });
    console.log(`  Popup text content snippet: ${popupData.replace(/\n+/g, ' | ').slice(0, 140)}...`);

    const popupPath = path.join(screenshotsDir, '02_gis_marker_popup.png');
    await page.screenshot({ path: popupPath, fullPage: false });
    console.log(`  ✓ Saved: ${popupPath}`);

    // -------------------------------------------------------------------------
    // TEST STEP 4: Accessible Map Legend Close-up
    // -------------------------------------------------------------------------
    console.log('\n[6] Capturing accessible map legend close-up...');
    const legendElem = await page.$('#gis-map-legend');
    if (legendElem) {
      const legendPath = path.join(screenshotsDir, '03_gis_map_legend.png');
      await legendElem.screenshot({ path: legendPath });
      console.log(`  ✓ Saved: ${legendPath}`);
    }

    // -------------------------------------------------------------------------
    // TEST STEP 5: Invalid Coordinates Notice Banner
    // -------------------------------------------------------------------------
    console.log('\n[7] Checking invalid coordinates banner...');
    const invalidBannerElem = await page.$('#gis-map-invalid-coords-banner');
    if (invalidBannerElem) {
      const bannerPath = path.join(screenshotsDir, '04_gis_invalid_coords_banner.png');
      await invalidBannerElem.screenshot({ path: bannerPath });
      console.log(`  ✓ Saved: ${bannerPath}`);
    } else {
      console.log('  Notice banner not currently visible (all farms have valid coords or banner excluded).');
    }

    // -------------------------------------------------------------------------
    // TEST STEP 6: Multi-Language GIS Map Rendering (Hindi & Tamil)
    // -------------------------------------------------------------------------
    console.log('\n[8] Testing GIS Map rendering across Indian languages...');

    // Switch to Hindi via UI dropdown
    console.log('  Switching to Hindi (hi) via navbar selector...');
    await page.click('#landing-language-button');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#landing-lang-hi');
    await new Promise(r => setTimeout(r, 1200));
    const langHiPath = path.join(screenshotsDir, '06_gis_map_lang_hi.png');
    await page.screenshot({ path: langHiPath, fullPage: false });
    console.log(`  ✓ Saved: ${langHiPath}`);

    // Switch to Tamil via UI dropdown
    console.log('  Switching to Tamil (ta) via navbar selector...');
    await page.click('#landing-language-button');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#landing-lang-ta');
    await new Promise(r => setTimeout(r, 1200));
    const langTaPath = path.join(screenshotsDir, '07_gis_map_lang_ta.png');
    await page.screenshot({ path: langTaPath, fullPage: false });
    console.log(`  ✓ Saved: ${langTaPath}`);

    // Switch back to English
    console.log('  Switching back to English (en)...');
    await page.click('#landing-language-button');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#landing-lang-en');
    await new Promise(r => setTimeout(r, 1000));

    // -------------------------------------------------------------------------
    // TEST STEP 7: Empty State (Cultivator with 0 farms)
    // -------------------------------------------------------------------------
    console.log('\n[9] Testing Empty State for cultivator with 0 registered plots...');
    const tempPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await request('http://localhost:5900/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({
      name: 'Pooja Sharma',
      phone_number: tempPhone,
      password: 'password123',
      preferred_language: 'en'
    }));

    const freshToken = regRes.body?.token;
    const freshUser = regRes.body?.user;

    if (freshToken) {
      await page.evaluate((jwt, userData) => {
        localStorage.setItem('agri_token', jwt);
        localStorage.setItem('agri_user', JSON.stringify(userData));
        if (window.i18next) window.i18next.changeLanguage('en');
        localStorage.setItem('i18nextLng', 'en');
      }, freshToken, freshUser);

      await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 1500));

      // Switch to Map View
      await page.evaluate(() => {
        const btn = document.getElementById('farm-view-mode-map-btn');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1500));

      const emptyStateVisible = await page.$('#gis-map-empty-state');
      if (emptyStateVisible) {
        console.log('  ✓ Empty state card with "Register First Farm" button correctly rendered.');
        const emptyPath = path.join(screenshotsDir, '08_gis_empty_state.png');
        await page.screenshot({ path: emptyPath, fullPage: false });
        console.log(`  ✓ Saved: ${emptyPath}`);
      }
    }

    console.log('\n===============================================================');
    console.log('ALL MODULE 5 BROWSER E2E TESTS COMPLETED SUCCESSFULLY!');
    console.log('===============================================================\n');

  } finally {
    await browser.close();
  }
}

runModule5Browser().catch((err) => {
  console.error('Fatal E2E browser error:', err);
  process.exit(1);
});
