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

async function captureScreenshots() {
  console.log('Capturing localized 10-language screenshots via UI Language Selector...');
  const screenshotsDir = path.join(artifactDir, 'screenshots_module4');

  // Authenticate
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  const token = loginRes.body?.token;
  const user = loginRes.body?.user;

  const farmsRes = await request('http://localhost:5900/api/farms', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const farm = farmsRes.body?.data?.[0];
  const farmId = farm._id;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  try {
    await page.goto('http://localhost:5273/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((jwt, userData) => {
      localStorage.setItem('agri_token', jwt);
      localStorage.setItem('agri_user', JSON.stringify(userData));
      localStorage.setItem('i18nextLng', 'en');
    }, token, user);

    // 1. First, go to farms and capture clean English Modal screenshots
    await page.goto('http://localhost:5273/dashboard/farms', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Ensure English
    await page.evaluate(() => {
      document.querySelector('#landing-language-button')?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      document.querySelector('#landing-lang-en')?.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Open Add Farm modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Add Farm') || b.querySelector('svg.lucide-plus'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll modal to soil section
    await page.evaluate(() => {
      const modal = document.querySelector('.overflow-y-auto');
      if (modal) modal.scrollTop = 380;
    });
    await new Promise(r => setTimeout(r, 600));

    // 01: English Soil Type Picker
    await page.screenshot({ path: path.join(screenshotsDir, '01_soil_type_picker.png') });
    console.log('✓ Captured 01_soil_type_picker.png (EN)');

    // Click "I have a Soil Health Card"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const shcBtn = btns.find(b => b.innerText.includes('Soil Health Card') && !b.innerText.includes("don't"));
      if (shcBtn) shcBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 02: English Soil Health Card manual inputs
    await page.screenshot({ path: path.join(screenshotsDir, '02_soil_health_card_manual.png') });
    console.log('✓ Captured 02_soil_health_card_manual.png (EN)');

    // Close modal
    await page.evaluate(() => {
      document.querySelector('#close-farm-modal-btn')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Open Farm Detail View
    await page.evaluate((id) => {
      const btn = document.querySelector(`#view-details-${id}`) || Array.from(document.querySelectorAll('button')).find(b => b.id.includes('view-details'));
      if (btn) btn.click();
    }, farmId);
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to Health Section
    await page.evaluate(() => {
      const healthSection = document.querySelector('#btn-tab-quick-checkin');
      if (healthSection) healthSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 800));

    // 03: Health tabs overview in EN
    await page.screenshot({ path: path.join(screenshotsDir, '03_health_tabs_overview.png') });
    console.log('✓ Captured 03_health_tabs_overview.png (EN)');

    // Click AI Tab
    await page.evaluate(() => {
      document.querySelector('#btn-tab-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Select sample leaf
    await page.evaluate(() => {
      document.querySelector('#sample-leaf-tomato-blight')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Run AI Diagnosis
    await page.evaluate(() => {
      document.querySelector('#btn-run-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to result card
    await page.evaluate(() => {
      document.querySelector('#btn-save-ai-diagnosis')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 800));

    // 04: AI Diagnosis result in EN
    await page.screenshot({ path: path.join(screenshotsDir, '04_ai_diagnosis_result.png') });
    console.log('✓ Captured 04_ai_diagnosis_result.png (EN)');

    // Save to history
    await page.evaluate(() => {
      document.querySelector('#btn-save-ai-diagnosis')?.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll down to timeline
    await page.evaluate(() => {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    });
    await new Promise(r => setTimeout(r, 800));

    // 05: Unified health timeline
    await page.screenshot({ path: path.join(screenshotsDir, '05_unified_health_timeline.png') });
    console.log('✓ Captured 05_unified_health_timeline.png (EN)');

    // 3. Loop through all 10 languages
    console.log('\nLooping through all 10 languages via UI dropdown:');
    for (const lang of languages) {
      // Click dropdown
      await page.evaluate(() => {
        document.querySelector('#landing-language-button')?.click();
      });
      await new Promise(r => setTimeout(r, 300));

      // Click language option
      await page.evaluate((code) => {
        document.querySelector(`#landing-lang-${code}`)?.click();
      }, lang.code);
      await new Promise(r => setTimeout(r, 700));

      const langPath = path.join(screenshotsDir, `06_lang_${lang.code}.png`);
      await page.screenshot({ path: langPath });
      console.log(`  ✓ ${lang.name} [${lang.code}] -> Captured`);
    }

    console.log('All 10 languages and English flows captured successfully!');
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(err => {
  console.error('Screenshot runner error:', err);
  process.exit(1);
});
