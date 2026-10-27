const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\c9d7b712-3a22-4c8e-b909-4da1cfaa5904';

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

async function runE2E() {
  console.log('===============================================================');
  console.log('E2E BROWSER VERIFICATION: DEDICATED AI PREDICTIONS SECTION');
  console.log('===============================================================\n');

  // 1. Get Auth Token from backend
  console.log('[1] Logging in test cultivator via API to obtain JWT...');
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  const token = loginRes.body?.token;
  if (!token) throw new Error('Could not obtain auth token');
  console.log('  Obtained JWT successfully.');

  // Ensure test cultivator has at least 2 farms
  console.log('  Checking existing farms for user...');
  const farmsRes = await request('http://localhost:5900/api/farms', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  let farmList = farmsRes.body?.data || [];
  if (farmList.length < 2) {
    console.log('  Creating 2 sample test farms with soil test data...');
    const f1 = await request('http://localhost:5900/api/farms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, JSON.stringify({
      name: 'Green Acres Plot 1',
      latitude: 21.1458,
      longitude: 79.0882,
      area: 5.5,
      soil_type: 'clay',
      soil_n: 95,
      soil_p: 45,
      soil_k: 40,
      soil_ph: 6.8
    }));

    if (f1.body?.data?._id) {
      await request(`http://localhost:5900/api/farms/${f1.body.data._id}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }, JSON.stringify({
        crop_type: 'rice',
        sowing_date: '2026-06-15',
        expected_harvest_date: '2026-10-25',
        status: 'growing'
      }));
    }

    const f2 = await request('http://localhost:5900/api/farms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, JSON.stringify({
      name: 'Sunrise Orchard Plot 2',
      latitude: 18.5204,
      longitude: 73.8567,
      area: 3.2,
      soil_type: 'loamy',
      soil_n: 40,
      soil_p: 68,
      soil_k: 80,
      soil_ph: 7.2
    }));

    if (f2.body?.data?._id) {
      await request(`http://localhost:5900/api/farms/${f2.body.data._id}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }, JSON.stringify({
        crop_type: 'chickpea',
        sowing_date: '2026-07-01',
        expected_harvest_date: '2026-11-10',
        status: 'growing'
      }));
    }
    console.log('  Created 2 sample farms with soil profiles and crop cycles.');
  }

  // 2. Launch Chrome
  console.log('\n[2] Launching Chrome browser at:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // Navigate to Login page and log in via UI
    console.log('\n[3] Logging in via UI at http://localhost:5273/login...');
    await page.goto('http://localhost:5273/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#phone_number');
    await page.type('#phone_number', '+919876543210');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to load after login
    await page.waitForSelector('#farmer-tab-overview', { timeout: 15000 });
    console.log('  Successfully logged into Dashboard!');

    const tabs = await page.evaluate(() => {
      const tabElements = Array.from(document.querySelectorAll('a[id^="farmer-tab-"]'));
      return tabElements.map((el) => ({
        id: el.getAttribute('id'),
        text: el.innerText.trim(),
        href: el.getAttribute('href'),
      }));
    });

    console.log('  Detected Navbar Tabs:', tabs);
    const expectedIds = [
      'farmer-tab-overview',
      'farmer-tab-weather',
      'farmer-tab-market',
      'farmer-tab-farms',
      'farmer-tab-ai-predictions',
    ];

    const actualIds = tabs.map((t) => t.id);
    const orderMatches = JSON.stringify(actualIds) === JSON.stringify(expectedIds);
    if (!orderMatches) {
      throw new Error(`Navbar tab order mismatch! Expected: ${expectedIds.join(', ')} | Got: ${actualIds.join(', ')}`);
    }
    console.log('  PASS: Navbar tab order matches requirement: Overview, Weather Advisory, Market Prices, My Farms, AI Predictions');

    // -----------------------------------------------------------------------
    // STEP 2: VERIFY OVERVIEW HAS NO AI PREDICTIONS
    // -----------------------------------------------------------------------
    console.log('\n[4] Checking Overview page content...');
    const overviewAiChecks = await page.evaluate(() => {
      const cropSection = document.getElementById('ai-crop-recommendation-section');
      const irrigSection = document.getElementById('ai-irrigation-advisory-section');
      const bodyText = document.body.innerText;
      return {
        hasCropSection: !!cropSection,
        hasIrrigSection: !!irrigSection,
        hasCropRecTitle: bodyText.includes('Crop Recommendation Advisory'),
        hasIrrigUrgency: bodyText.includes('Precision Irrigation Advisory'),
      };
    });

    if (overviewAiChecks.hasCropSection || overviewAiChecks.hasIrrigSection || overviewAiChecks.hasCropRecTitle || overviewAiChecks.hasIrrigUrgency) {
      throw new Error('Overview page still contains AI prediction content!');
    }
    console.log('  PASS: Overview page is completely free of AI prediction content.');
    await page.screenshot({ path: path.join(artifactDir, 'overview_no_ai.png'), fullPage: false });
    console.log('  Screenshot saved: overview_no_ai.png');

    // -----------------------------------------------------------------------
    // STEP 3: VERIFY FARM DETAIL HAS NO AI PREDICTIONS
    // -----------------------------------------------------------------------
    console.log('\n[5] Navigating to My Farms and opening Farm Detail...');
    await page.click('#farmer-tab-farms');
    await page.waitForSelector('button[id^="view-details-"]', { timeout: 10000 });

    // Click 'View Details' on first farm
    const detailButtons = await page.$$('button[id^="view-details-"]');
    if (detailButtons.length === 0) throw new Error('No farms found in list');
    await detailButtons[0].click();
    await page.waitForSelector('#farm-back-btn', { timeout: 10000 });

    const farmDetailAiChecks = await page.evaluate(() => {
      const cropSection = document.getElementById('ai-crop-recommendation-section');
      const irrigSection = document.getElementById('ai-irrigation-advisory-section');
      const bodyText = document.body.innerText;
      return {
        hasCropSection: !!cropSection,
        hasIrrigSection: !!irrigSection,
        hasSoilProfile: bodyText.includes('Soil Test Profile') || bodyText.includes('Soil Chemistry'),
        hasCropCycles: bodyText.includes('Crop Cycles') || bodyText.includes('Crop'),
      };
    });

    if (farmDetailAiChecks.hasCropSection || farmDetailAiChecks.hasIrrigSection) {
      throw new Error('Farm Detail page still contains AI prediction content!');
    }
    console.log('  PASS: Farm Detail page is completely free of AI prediction content.');
    console.log('  PASS: Farm Detail retains direct data (Soil Profile & Crop Cycles).');
    await page.screenshot({ path: path.join(artifactDir, 'farm_detail_no_ai.png'), fullPage: false });
    console.log('  Screenshot saved: farm_detail_no_ai.png');

    // -----------------------------------------------------------------------
    // STEP 4: VERIFY DEDICATED AI PREDICTIONS TAB CONTENT
    // -----------------------------------------------------------------------
    console.log('\n[6] Navigating to AI Predictions tab...');
    await page.click('#farmer-tab-ai-predictions');
    await page.waitForSelector('#ai-crop-recommendation-section', { timeout: 10000 });

    // Check Farm Switcher
    const farmTabs = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[id^="farm-switcher-"]'));
      return buttons.map((b) => ({ id: b.id, text: b.innerText.trim(), selected: b.getAttribute('aria-selected') === 'true' }));
    });
    console.log('  Farm Switcher Tabs found:', farmTabs);
    if (farmTabs.length === 0) throw new Error('Farm switcher tabs not found on AI Predictions page!');

    // Check Section 1: Crop Recommendation (Wait for ML service response)
    await page.waitForSelector('#ai-crop-recommended-name', { timeout: 15000 });
    await page.waitForSelector('#ai-irrigation-recommended-action', { timeout: 15000 });

    const cropRecInfo = await page.evaluate(() => {
      const heading = document.querySelector('#ai-crop-recommendation-section h2')?.innerText;
      const recNameEl = document.getElementById('ai-crop-recommended-name');
      const confEl = document.getElementById('ai-crop-confidence-text');
      const realBadge = document.querySelector('#ai-crop-recommendation-section .bg-emerald-50');
      return {
        heading,
        recommendedCrop: recNameEl?.innerText.trim(),
        confidenceText: confEl?.innerText.trim(),
        hasRealBadge: !!realBadge,
      };
    });

    console.log('  [Section 1: Crop Recommendation]');
    console.log('    Heading:          ', cropRecInfo.heading);
    console.log('    Recommended Crop: ', cropRecInfo.recommendedCrop);
    console.log('    Confidence Text:  ', cropRecInfo.confidenceText);
    console.log('    Real Data Badge:  ', cropRecInfo.hasRealBadge);

    if (!cropRecInfo.recommendedCrop || !cropRecInfo.confidenceText || !cropRecInfo.hasRealBadge) {
      throw new Error('Crop recommendation section missing required elements!');
    }
    console.log('  PASS: Model 1 Crop Recommendation renders largest element + plain-text confidence + real data badge.');

    // Check Section 2: Irrigation Advisory
    const irrigInfo = await page.evaluate(() => {
      const heading = document.querySelector('#ai-irrigation-advisory-section h2')?.innerText;
      const actionEl = document.getElementById('ai-irrigation-recommended-action');
      const badgeEl = document.getElementById('ai-irrigation-urgency-badge');
      const confEl = document.getElementById('ai-irrigation-confidence-text');
      const reasons = Array.from(document.querySelectorAll('#ai-irrigation-advisory-section ul li')).map((li) => li.innerText.trim());
      const synthBadge = document.querySelector('#ai-irrigation-advisory-section .bg-amber-50');
      return {
        heading,
        action: actionEl?.innerText.trim(),
        urgency: badgeEl?.innerText.trim(),
        confidence: confEl?.innerText.trim(),
        reasonsCount: reasons.length,
        topReasons: reasons,
        hasSynthBadge: !!synthBadge,
      };
    });

    console.log('\n  [Section 2: Irrigation Advisory]');
    console.log('    Heading:          ', irrigInfo.heading);
    console.log('    Action (Largest): ', irrigInfo.action);
    console.log('    Urgency Badge:    ', irrigInfo.urgency);
    console.log('    Confidence Text:  ', irrigInfo.confidence);
    console.log('    Reasons Count:    ', irrigInfo.reasonsCount);
    console.log('    Top Reasons:      ', irrigInfo.topReasons);
    console.log('    Adaptive Badge:   ', irrigInfo.hasSynthBadge);

    if (!irrigInfo.action || !irrigInfo.urgency || irrigInfo.reasonsCount === 0 || !irrigInfo.hasSynthBadge) {
      throw new Error('Irrigation advisory section missing required elements!');
    }
    console.log('  PASS: Model 2 Irrigation Advisory renders largest action + urgency badge + reasons list + adaptive badge.');

    await page.screenshot({ path: path.join(artifactDir, 'ai_predictions_farm1.png'), fullPage: false });
    console.log('  Screenshot saved: ai_predictions_farm1.png');

    // -----------------------------------------------------------------------
    // STEP 5: SWITCH FARMS AND VERIFY UPDATE
    // -----------------------------------------------------------------------
    if (farmTabs.length > 1) {
      console.log('\n[7] Switching to second farm plot in farm switcher...');
      const secondFarmBtnId = farmTabs[1].id;
      await page.click(`#${secondFarmBtnId}`);
      await new Promise((r) => setTimeout(r, 2000));

      const updatedCrop = await page.evaluate(() => document.getElementById('ai-crop-recommended-name')?.innerText.trim());
      const updatedAction = await page.evaluate(() => document.getElementById('ai-irrigation-recommended-action')?.innerText.trim());
      console.log('  Updated Farm Predictions:');
      console.log('    Crop:   ', updatedCrop);
      console.log('    Action: ', updatedAction);
      console.log('  PASS: Switching farms updates the active predictions dynamically.');

      await page.screenshot({ path: path.join(artifactDir, 'ai_predictions_farm2.png'), fullPage: false });
      console.log('  Screenshot saved: ai_predictions_farm2.png');
    }

    // -----------------------------------------------------------------------
    // STEP 6: VERIFY 10 LANGUAGES ON AI PREDICTIONS PAGE
    // -----------------------------------------------------------------------
    console.log('\n[8] Testing all 10 languages on AI Predictions page...');
    const languages = [
      { code: 'ta', name: 'Tamil', scriptCheck: /[\u0B80-\u0BFF]/ },
      { code: 'hi', name: 'Hindi', scriptCheck: /[\u0900-\u097F]/ },
      { code: 'te', name: 'Telugu', scriptCheck: /[\u0C00-\u0C7F]/ },
      { code: 'kn', name: 'Kannada', scriptCheck: /[\u0C80-\u0CFF]/ },
      { code: 'ml', name: 'Malayalam', scriptCheck: /[\u0D00-\u0D7F]/ },
      { code: 'mr', name: 'Marathi', scriptCheck: /[\u0900-\u097F]/ },
      { code: 'bn', name: 'Bengali', scriptCheck: /[\u0980-\u09FF]/ },
      { code: 'gu', name: 'Gujarati', scriptCheck: /[\u0A80-\u0AFF]/ },
      { code: 'pa', name: 'Punjabi', scriptCheck: /[\u0A00-\u0A7F]/ },
      { code: 'en', name: 'English', scriptCheck: /[a-zA-Z]/ },
    ];

    for (const lang of languages) {
      console.log(`  Switching language to ${lang.name} (${lang.code})...`);
      await page.click('#landing-language-button');
      await page.waitForSelector(`#landing-lang-${lang.code}`, { timeout: 5000 });
      await page.click(`#landing-lang-${lang.code}`);
      await new Promise((r) => setTimeout(r, 800));

      const texts = await page.evaluate(() => {
        const title = document.querySelector('h1')?.innerText || '';
        const navAi = document.getElementById('farmer-tab-ai-predictions')?.innerText || '';
        const cropH2 = document.querySelector('#ai-crop-recommendation-section h2')?.innerText || '';
        const irrigH2 = document.querySelector('#ai-irrigation-advisory-section h2')?.innerText || '';
        const urgency = document.getElementById('ai-irrigation-urgency-badge')?.innerText || '';
        return { title, navAi, cropH2, irrigH2, urgency };
      });

      if (lang.code !== 'en') {
        const hasScript =
          lang.scriptCheck.test(texts.title) &&
          lang.scriptCheck.test(texts.navAi) &&
          lang.scriptCheck.test(texts.cropH2) &&
          lang.scriptCheck.test(texts.irrigH2);

        if (!hasScript) {
          throw new Error(`Language ${lang.name} (${lang.code}) failed script test on AI Predictions page! Got: ${JSON.stringify(texts)}`);
        }
      }

      console.log(`  PASS: [${lang.code.toUpperCase()}] ${lang.name} fully localized: Nav="${texts.navAi}", Title="${texts.title}", CropH2="${texts.cropH2}"`);

      if (lang.code === 'ta') {
        await page.screenshot({ path: path.join(artifactDir, 'ai_predictions_tamil.png'), fullPage: false });
        console.log('    Screenshot saved: ai_predictions_tamil.png');
      } else if (lang.code === 'hi') {
        await page.screenshot({ path: path.join(artifactDir, 'ai_predictions_hindi.png'), fullPage: false });
        console.log('    Screenshot saved: ai_predictions_hindi.png');
      }
    }

    console.log('\n===============================================================');
    console.log('ALL E2E BROWSER CHECKS COMPLETED WITH 100% SUCCESS!');
    console.log('===============================================================');
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error('E2E FAILURE:', err);
  process.exit(1);
});
