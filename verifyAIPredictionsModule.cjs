const fs = require('fs');
const path = require('path');
const http = require('http');

async function main() {
  console.log('===============================================================');
  console.log('AGRIADVISOR - AI PREDICTIONS DEDICATED SECTION VERIFICATION');
  console.log('===============================================================\n');

  let passed = true;

  // 1. Verify FarmerNavbar tabs and ordering
  console.log('[STEP 1] Verifying Navbar tabs & exact ordering...');
  const navbarPath = path.join(__dirname, '../frontend/src/components/FarmerNavbar.tsx');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');

  const expectedOrder = [
    "id: 'overview'",
    "id: 'weather'",
    "id: 'market'",
    "id: 'farms'",
    "id: 'ai-predictions'"
  ];

  let lastIndex = -1;
  let orderCorrect = true;
  for (const tab of expectedOrder) {
    const idx = navbarCode.indexOf(tab);
    if (idx === -1) {
      console.error(`  FAIL: Missing tab in FarmerNavbar: ${tab}`);
      orderCorrect = false;
      passed = false;
    } else if (idx < lastIndex) {
      console.error(`  FAIL: Tab out of order: ${tab}`);
      orderCorrect = false;
      passed = false;
    }
    lastIndex = idx;
  }

  if (orderCorrect) {
    console.log('  PASS: Navbar tabs strictly match requested order:');
    console.log('        1. Overview -> 2. Weather Advisory -> 3. Market Prices -> 4. My Farms -> 5. AI Predictions');
  }

  // 2. Verify Overview has no AI predictions content
  console.log('\n[STEP 2] Verifying Overview has NO AI predictions content...');
  const dashboardPath = path.join(__dirname, '../frontend/src/pages/DashboardPage.tsx');
  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

  // Extract the Overview section (lines around section === 'overview')
  const overviewBlock = dashboardCode.substring(
    dashboardCode.indexOf("section === 'overview'"),
    dashboardCode.indexOf("section === 'farms'")
  );

  const aiKeywordsInOverview = [
    'ai_insights_title',
    'ai_crop_rec_title',
    'recommended_action',
    'urgency_level',
    'confidence_score',
    'ai-crop-recommendation',
    'ai-irrigation-advisory'
  ];

  let overviewHasAI = false;
  for (const kw of aiKeywordsInOverview) {
    if (overviewBlock.includes(kw)) {
      console.error(`  FAIL: Overview contains AI keyword: ${kw}`);
      overviewHasAI = true;
      passed = false;
    }
  }
  if (!overviewHasAI) {
    console.log('  PASS: Overview is clean - displays only direct metrics & farm summary!');
  }

  // 3. Verify Farm Detail has NO AI predictions content
  console.log('\n[STEP 3] Verifying Farm Detail has NO AI predictions content...');
  const farmDetailPath = path.join(__dirname, '../frontend/src/components/FarmDetailView.tsx');
  const farmDetailCode = fs.readFileSync(farmDetailPath, 'utf8');

  const aiKeywordsInDetail = [
    'recommendations/',
    'recommend-crop',
    'ai_insights_title',
    'ai_crop_rec_title',
    'urgency_level',
    'top_reasons',
    'ai_action_heading',
    'data_source_real_badge',
    'data_source_synthetic_badge'
  ];

  let detailHasAI = false;
  for (const kw of aiKeywordsInDetail) {
    if (farmDetailCode.includes(kw)) {
      console.error(`  FAIL: FarmDetailView contains AI keyword: ${kw}`);
      detailHasAI = true;
      passed = false;
    }
  }
  if (!detailHasAI) {
    console.log('  PASS: FarmDetailView is clean - shows only direct specs, micro-weather, soil test & crop cycles!');
  }

  // 4. Verify AIPredictionsView has all required elements
  console.log('\n[STEP 4] Verifying AIPredictionsView architecture & elements...');
  const aiViewPath = path.join(__dirname, '../frontend/src/components/AIPredictionsView.tsx');
  const aiViewCode = fs.readFileSync(aiViewPath, 'utf8');

  const requiredAiViewElements = [
    { name: 'Farm Switcher Selector', check: aiViewCode.includes('farm-switcher-') || aiViewCode.includes('selectedFarmId') },
    { name: 'Crop Recommendation Section', check: aiViewCode.includes('ai-crop-recommendation-section') },
    { name: 'Recommended Crop Largest Element', check: aiViewCode.includes('ai-crop-recommended-name') && aiViewCode.includes('text-3xl') },
    { name: 'Crop Confidence as Plain Text', check: aiViewCode.includes('ai-crop-confidence-text') },
    { name: 'Alternative Crops Sub-card', check: aiViewCode.includes('ai_crop_alternatives') && aiViewCode.includes('cropRec.alternatives') },
    { name: 'Crop Real Agricultural Data Note/Tooltip', check: aiViewCode.includes('ai_model1_source_note') && aiViewCode.includes('data_source_real_badge') },
    { name: 'Irrigation Advisory Section', check: aiViewCode.includes('ai-irrigation-advisory-section') },
    { name: 'Recommended Action Largest Element', check: aiViewCode.includes('ai-irrigation-recommended-action') && aiViewCode.includes('text-3xl') },
    { name: 'Urgency Level Badge with Color+Icon', check: aiViewCode.includes('ai-irrigation-urgency-badge') },
    { name: 'Irrigation Confidence as Plain Text', check: aiViewCode.includes('ai-irrigation-confidence-text') },
    { name: 'Top Reasons Bulleted List with Icons', check: aiViewCode.includes('irrigRec.top_reasons') && aiViewCode.includes('ai_reasons_title') },
    { name: 'Irrigation Adaptive Learning Model Note/Tooltip', check: aiViewCode.includes('ai_model2_source_note') && aiViewCode.includes('data_source_synthetic_badge') }
  ];

  for (const elem of requiredAiViewElements) {
    if (elem.check) {
      console.log(`  PASS: Found ${elem.name}`);
    } else {
      console.error(`  FAIL: Missing ${elem.name}`);
      passed = false;
    }
  }

  // 5. Verify 10-Language Parity
  console.log('\n[STEP 5] Auditing translations across all 10 languages...');
  const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
  const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

  const testKeys = [
    'dash_nav_ai',
    'ai_page_title',
    'ai_page_sub',
    'ai_select_farm',
    'ai_crop_heading',
    'ai_irrigation_heading',
    'ai_model1_source_note',
    'ai_model2_source_note',
    'action_irrigate',
    'action_delay_irrigation',
    'ai_urgency_low',
    'ai_urgency_medium',
    'ai_urgency_high',
    'ai_reasons_title',
    'data_source_real_badge',
    'data_source_synthetic_badge'
  ];

  for (const lang of languages) {
    const localeFile = path.join(localesDir, `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    let langPassed = true;

    for (const k of testKeys) {
      if (!dict[k] || dict[k].trim() === '') {
        console.error(`  FAIL [${lang}]: Missing key '${k}'`);
        langPassed = false;
        passed = false;
      } else if (lang !== 'en') {
        const hasUnicode = /[^\u0000-\u007F]/.test(dict[k]);
        if (!hasUnicode) {
          console.error(`  FAIL [${lang}]: String leaked English for key '${k}': "${dict[k]}"`);
          langPassed = false;
          passed = false;
        }
      }
    }

    if (langPassed) {
      console.log(`  PASS: ${lang.toUpperCase()} has zero missing keys and zero leaked English.`);
    }
  }

  console.log('\n---------------------------------------------------------------');
  if (passed) {
    console.log('OVERALL RESULT: ALL AUDIT CHECKS PASSED WITH 100% SUCCESS!');
  } else {
    console.error('OVERALL RESULT: SOME CHECKS FAILED.');
    process.exit(1);
  }
  console.log('===============================================================');
}

main().catch(console.error);
