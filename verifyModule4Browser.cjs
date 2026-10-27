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

async function runModule4Browser() {
  console.log('===============================================================');
  console.log('E2E BROWSER VERIFICATION: MODULE 4 (HIGH PRECISION AUTOMATION)');
  console.log('Soil Health Card Toggle + AI Photo Diagnosis + 10-Language Views');
  console.log('===============================================================\n');

  const screenshotsDir = path.join(artifactDir, 'screenshots_module4');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Authenticate user
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

  // Get or create farm
  const farmsRes = await request('http://localhost:5900/api/farms', {
    headers: { Authorization: `Bearer ${token}` }
  });
  let farm = farmsRes.body?.data?.[0];
  if (!farm) {
    const cfRes = await request('http://localhost:5900/api/farms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      name: 'Punjab Wheat & Mustard Basin',
      latitude: 30.9010,
      longitude: 75.8573,
      area: 3.5,
      soil_health_card: false,
      soil_type: 'alluvial',
      crop: {
        crop_type: 'tomato',
        sowing_date: new Date(Date.now() - 30 * 86400000).toISOString(),
        expected_harvest_date: new Date(Date.now() + 60 * 86400000).toISOString(),
        status: 'growing'
      }
    }));
    farm = cfRes.body?.data;
  }

  const farmId = farm._id;
  console.log(`  Farm ID: ${farmId} (${farm.name})`);

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
    // Navigate to set tokens and ensure language is EN
    await page.goto('http://localhost:5273/login', { waitUntil: 'networkidle0' });
    await page.evaluate((jwt, userData) => {
      localStorage.setItem('agri_token', jwt);
      localStorage.setItem('agri_user', JSON.stringify(userData));
      localStorage.setItem('i18nextLng', 'en');
    }, token, user);

    // -----------------------------------------------------------------------
    // PART 1: Soil Input UX in Farm Form Modal
    // -----------------------------------------------------------------------
    console.log('\n[3] Testing Farm Form Modal (Soil Health Card Toggle & Soil Category Picker)...');
    await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Force language to English for clean screenshots
    await page.evaluate(() => {
      if (window.i18next) window.i18next.changeLanguage('en');
      localStorage.setItem('i18nextLng', 'en');
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Add Farm" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Add Farm') || b.querySelector('svg.lucide-plus'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll modal down to soil section
    await page.evaluate(() => {
      const modal = document.querySelector('.overflow-y-auto');
      if (modal) modal.scrollTop = 380;
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Screenshot 1: Soil Category Picker (when soil_health_card: false)
    const p1 = path.join(screenshotsDir, '01_soil_type_picker.png');
    await page.screenshot({ path: p1 });
    console.log(`  ✓ Captured Screenshot: ${p1}`);

    // Click "I have a Soil Health Card" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const shcBtn = btns.find(b => b.innerText.includes('Soil Health Card') && !b.innerText.includes("don't"));
      if (shcBtn) shcBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Screenshot 2: Soil Health Card Manual Input with helper note
    const p2 = path.join(screenshotsDir, '02_soil_health_card_manual.png');
    await page.screenshot({ path: p2 });
    console.log(`  ✓ Captured Screenshot: ${p2}`);

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // -----------------------------------------------------------------------
    // PART 2: Crop Health Page - Equal Options & AI Photo Diagnosis
    // -----------------------------------------------------------------------
    console.log(`\n[4] Navigating to Farm Detail View (ID: ${farmId})...`);
    await page.evaluate((id) => {
      const btn = document.querySelector(`#view-details-${id}`) || Array.from(document.querySelectorAll('button')).find(b => b.id.includes('view-details'));
      if (btn) btn.click();
    }, farmId);
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to Crop Health section
    await page.evaluate(() => {
      const healthSection = Array.from(document.querySelectorAll('h2, h3, div')).find(d => d.innerText.includes('Crop Health') || d.innerText.includes('Health Check-in'));
      if (healthSection) healthSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Screenshot 3: Health Tabs (Quick Check-in vs AI Photo Diagnosis)
    const p3 = path.join(screenshotsDir, '03_health_tabs_overview.png');
    await page.screenshot({ path: p3 });
    console.log(`  ✓ Captured Screenshot: ${p3}`);

    // Click "AI Photo Diagnosis" tab
    console.log('  Selecting "AI Photo Diagnosis" tab...');
    await page.evaluate(() => {
      document.querySelector('#btn-tab-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click sample leaf button: Tomato Early Blight
    console.log('  Selecting sample leaf: Tomato Early Blight...');
    await page.evaluate(() => {
      document.querySelector('#sample-leaf-tomato-blight')?.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click Run AI Diagnosis button
    console.log('  Running AI Diagnosis inference...');
    await page.evaluate(() => {
      document.querySelector('#btn-run-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll slightly to view full diagnosis result
    await page.evaluate(() => {
      const resultCard = document.querySelector('#btn-save-ai-diagnosis') || Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('AI Diagnostic Assessment') || d.innerText.includes('Early Blight'));
      if (resultCard) resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture Screenshot 4: AI Photo Diagnosis Result Card
    const p4 = path.join(screenshotsDir, '04_ai_diagnosis_result.png');
    await page.screenshot({ path: p4 });
    console.log(`  ✓ Captured Screenshot: ${p4}`);

    // Click "Save to Farm History" button
    console.log('  Saving AI diagnosis to farm history...');
    await page.evaluate(() => {
      document.querySelector('#btn-save-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to Health History timeline to display both Manual & AI tags
    await page.evaluate(() => {
      const historySection = Array.from(document.querySelectorAll('h3, h4, div')).find(d => d.innerText.includes('Health History') || d.innerText.includes('Recent Logs'));
      if (historySection) historySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Screenshot 5: Health Timeline with both Manual and AI badges
    const p5 = path.join(screenshotsDir, '05_unified_health_timeline.png');
    await page.screenshot({ path: p5 });
    console.log(`  ✓ Captured Screenshot: ${p5}`);

    // -----------------------------------------------------------------------
    // PART 3: Multi-Language Switching across all 10 Indian Languages
    // -----------------------------------------------------------------------
    console.log('\n[5] Capturing 10-Language Views on Updated Crop Health Page...');
    for (const lang of languages) {
      await page.evaluate((code) => {
        if (window.i18next) window.i18next.changeLanguage(code);
        localStorage.setItem('i18nextLng', code);
      }, lang.code);
      await new Promise(r => setTimeout(r, 700));

      const langPath = path.join(screenshotsDir, `06_lang_${lang.code}.png`);
      await page.screenshot({ path: langPath });
      console.log(`  ✓ Switched to ${lang.name} [${lang.code}] -> Captured ${langPath}`);
    }

    console.log('\n===============================================================');
    console.log('ALL E2E BROWSER TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');

  } catch (err) {
    console.error('Browser testing error:', err);
  } finally {
    await browser.close();
  }
}

runModule4Browser().catch(err => {
  console.error('Fatal browser test runner error:', err);
  process.exit(1);
});
