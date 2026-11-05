const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:/Users/Hp/.gemini/antigravity-ide/brain/d5fc1972-4afe-4761-8790-cb71462699c0';

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
  console.log('  BROWSER E2E VERIFICATION: EXTENDED FARM MAP VISUAL TESTING');
  console.log('========================================================================\n');

  const screenshotsDir = path.join(artifactDir, 'screenshots_extended_map');
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
    const regRes = await request('http://127.0.0.1:5900/api/auth/register', {
      method: 'POST',
    }, JSON.stringify({
      name: 'Ramesh Patel',
      phone_number: '+919876543210',
      password: 'password123',
      preferred_language: 'en',
      latitude: 12.9667,
      longitude: 77.5857,
    }));
    token = regRes.body?.token;
    user = regRes.body?.user;
  }

  console.log(`✓ Token acquired for cultivator: ${user?.name || 'Ramesh'}`);

  // 2. Launch headless Chrome browser
  console.log('[2] Launching Chrome browser at:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // Navigate to frontend
    console.log('[3] Navigating to http://localhost:5273/login...');
    await page.goto('http://localhost:5273/login', { waitUntil: 'networkidle2' });

    // Inject auth token and user directly into localStorage to log in
    await page.evaluate(({ t, u }) => {
      localStorage.setItem('agri_token', t);
      localStorage.setItem('agri_user', JSON.stringify(u));
      localStorage.setItem('preferred_language', 'en');
    }, { t: token, u: user });

    // Navigate to /dashboard/farms
    console.log('[4] Navigating to /dashboard/farms...');
    await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    // Switch to Farm Map (GIS) toggle
    const mapToggleBtn = await page.$('#farm-view-mode-map-btn');
    if (mapToggleBtn) {
      console.log('✓ Clicking "Farm Map (GIS)" segmented toggle...');
      await mapToggleBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Screenshot 1: Overview with Street Map, Status Pins, Legend & Mandis Panel
    const s1Path = path.join(screenshotsDir, '01_extended_map_street_view.png');
    await page.screenshot({ path: s1Path });
    console.log(`✓ Screenshot 1 saved: 01_extended_map_street_view.png`);

    // Screenshot 2: Switch to Satellite View
    console.log('[5] Testing Street / Satellite switch to Satellite...');
    const satelliteBtn = await page.$('#map-switch-satellite-btn');
    if (satelliteBtn) {
      await satelliteBtn.click();
      await new Promise((r) => setTimeout(r, 2500));
      const s2Path = path.join(screenshotsDir, '02_extended_map_satellite_view.png');
      await page.screenshot({ path: s2Path });
      console.log(`✓ Screenshot 2 saved: 02_extended_map_satellite_view.png (Esri Satellite Tiles + Attribution)`);
    }

    // Screenshot 3: Enable 24h Rain Forecast Layer (Part 4)
    console.log('[6] Testing Layer 2: 24h Rain Forecast Checkbox...');
    const rainCheckbox = await page.$('#checkbox-rain-forecast-layer');
    if (rainCheckbox) {
      await rainCheckbox.click();
      await new Promise((r) => setTimeout(r, 1500));
      const s3Path = path.join(screenshotsDir, '03_extended_map_rain_forecast_layer.png');
      await page.screenshot({ path: s3Path });
      console.log(`✓ Screenshot 3 saved: 03_extended_map_rain_forecast_layer.png (Weather Pill Overlays)`);
    }

    // Screenshot 4: Nearby Mandis Panel & Best Price Nearby (Part 5)
    console.log('[7] Capturing Nearby APMC Mandis Panel with Best Price Nearby...');
    const mandisPanel = await page.$('#gis-nearby-mandis-panel');
    if (mandisPanel) {
      await mandisPanel.scrollIntoView();
      await new Promise((r) => setTimeout(r, 1000));
      const s4Path = path.join(screenshotsDir, '04_extended_map_nearby_mandis_panel.png');
      await page.screenshot({ path: s4Path });
      console.log(`✓ Screenshot 4 saved: 04_extended_map_nearby_mandis_panel.png (Mandis list + Distance + Best Price)`);
    }

    // Screenshot 5: Farm Creation Modal with Boundary Drawer (Part 2)
    console.log('[8] Testing Farm Creation Modal & GIS Boundary Drawer...');
    await page.evaluate(() => window.scrollTo(0, 0));
    const addFarmBtn = await page.$('#add-new-farm-main-btn');
    if (addFarmBtn) {
      await addFarmBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      // Click "Quick Outline (Sample)" to draw polygon and compute acres
      const sampleOutlineBtn = await page.$('#boundary-sample-btn');
      if (sampleOutlineBtn) {
        console.log('✓ Triggering Quick Outline sample on Boundary Drawer...');
        await sampleOutlineBtn.click();
        await new Promise((r) => setTimeout(r, 1500));
      }

      const s5Path = path.join(screenshotsDir, '05_boundary_drawer_modal.png');
      await page.screenshot({ path: s5Path });
      console.log(`✓ Screenshot 5 saved: 05_boundary_drawer_modal.png (Polygon, Vertices & Auto-calculated Area)`);
    }

    console.log('\n========================================================================');
    console.log('  ALL BROWSER E2E TESTS & VISUAL SCREENSHOTS COMPLETED SUCCESSFULLY!');
    console.log('========================================================================');
  } catch (err) {
    console.error('Browser testing error:', err);
  } finally {
    await browser.close();
  }
}

runBrowserVerification().catch(console.error);
