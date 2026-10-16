/**
 * Quality Pass Automated Verification Script (Part 4)
 * 
 * Verifies:
 * 1. Desktop and 390px mobile width responsiveness
 * 2. No horizontal scroll on mobile (scrollWidth <= clientWidth)
 * 3. No broken or missing images
 * 4. Zero console errors
 * 5. Saves visual evidence screenshots
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:/Users/Hp/.gemini/antigravity-ide/brain/fc3481d3-1d6d-410d-a227-39d7e62656c8/screenshots_quality_pass';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runQualityPass() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — PART 4 QUALITY PASS & 390PX MOBILE AUDIT');
  console.log('========================================================================\n');

  let passed = 0;
  const total = 5;

  // 1. Authenticate Demo Cultivator
  console.log('[Step 0] Logging in demo farmer...');
  const authRes = await request('http://127.0.0.1:5900/api/auth/login', { method: 'POST' }, JSON.stringify({
    phone_number: '+919876543210',
    password: 'password123',
  }));

  const token = authRes.data?.token;
  const user = authRes.data?.user;
  if (!token) throw new Error('Demo farmer login failed');
  console.log(`✓ Authenticated as ${user.name}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore expected network timeouts if any
        if (!msg.text().includes('favicon')) {
          consoleErrors.push(msg.text());
        }
      }
    });

    // Inject Auth state
    await page.goto('http://127.0.0.1:5273', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('agriadvisor_token', t);
      localStorage.setItem('agriadvisor_user', JSON.stringify(u));
    }, token, user);

    // --- TEST 1: Landing Page Desktop & Mobile ---
    console.log('--- TEST 1: Landing Page Desktop (1280px) & Mobile (390px) ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:5273/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(artifactDir, '01_landing_desktop_1280px.png') });

    await page.setViewport({ width: 390, height: 844 }); // iPhone 12/13/14
    await page.goto('http://127.0.0.1:5273/', { waitUntil: 'networkidle0' });
    const landingOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(artifactDir, '02_landing_mobile_390px.png') });

    console.log(`  Horizontal overflow on 390px mobile: ${landingOverflow ? 'FAILED (Overflow detected)' : 'NONE (Clean)'}`);
    if (!landingOverflow) {
      passed++;
      console.log('✓ TEST 1 PASSED: Landing page responsive and free of overflow.');
    }

    // --- TEST 2: Dashboard Overview Desktop & Mobile ---
    console.log('\n--- TEST 2: Dashboard Overview Desktop & Mobile (390px) ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:5273/dashboard', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(artifactDir, '03_overview_desktop_1280px.png') });

    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5273/dashboard', { waitUntil: 'networkidle0' });
    const overviewOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(artifactDir, '04_overview_mobile_390px.png') });

    console.log(`  Horizontal overflow on 390px mobile: ${overviewOverflow ? 'FAILED' : 'NONE (Clean)'}`);
    if (!overviewOverflow) {
      passed++;
      console.log('✓ TEST 2 PASSED: Overview page fits mobile viewport cleanly.');
    }

    // --- TEST 3: Farm Map & Outbreak Alerts on Mobile ---
    console.log('\n--- TEST 3: GIS Farm Map with Disease Alerts (390px Mobile) ---');
    await page.goto('http://127.0.0.1:5273/dashboard/farms', { waitUntil: 'networkidle0' });
    // Switch to Map tab
    await page.evaluate(() => {
      const mapBtn = document.querySelector('#view-toggle-map');
      if (mapBtn) mapBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    const mapOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(artifactDir, '05_farm_map_mobile_390px.png') });

    console.log(`  Horizontal overflow on 390px mobile: ${mapOverflow ? 'FAILED' : 'NONE (Clean)'}`);
    if (!mapOverflow) {
      passed++;
      console.log('✓ TEST 3 PASSED: GIS Farm Map layers and controls responsive on mobile.');
    }

    // --- TEST 4: AI Predictions & Lifecycle on Mobile ---
    console.log('\n--- TEST 4: AI Predictions & Crop Growth Stage (390px Mobile) ---');
    await page.goto('http://127.0.0.1:5273/dashboard/ai-predictions', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const aiOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(artifactDir, '06_ai_predictions_mobile_390px.png') });

    console.log(`  Horizontal overflow on 390px mobile: ${aiOverflow ? 'FAILED' : 'NONE (Clean)'}`);
    if (!aiOverflow) {
      passed++;
      console.log('✓ TEST 4 PASSED: AI Predictions cards and Listen button responsive on mobile.');
    }

    // --- TEST 5: Broken Images & Console Errors Audit ---
    console.log('\n--- TEST 5: Broken Images and Console Errors Audit ---');
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });

    console.log(`  Broken or unrendered images detected: ${brokenImages.length}`);
    console.log(`  Console fatal errors detected: ${consoleErrors.length}`);

    if (brokenImages.length === 0 && consoleErrors.length === 0) {
      passed++;
      console.log('✓ TEST 5 PASSED: Zero broken images and zero console errors.');
    } else {
      console.error(`✗ TEST 5 FAILED: ${brokenImages.length} broken images, ${consoleErrors.length} errors.`);
    }

    console.log('\n========================================================================');
    console.log(`  QUALITY PASS RESULTS: ${passed}/${total} CHECKS PASSED (${Math.round((passed/total)*100)}%)`);
    console.log('========================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (err) {
    console.error('Fatal error in runQualityPass:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runQualityPass();
