const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');
const languages = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const requiredKeys = [
  'dash_nav_farms',
  'farms_page_title',
  'farms_page_sub',
  'btn_add_farm',
  'btn_edit_farm',
  'btn_delete_farm',
  'btn_view_details',
  'farm_field_name',
  'farm_field_soil_type',
  'farm_field_soil_n',
  'farm_field_soil_p',
  'farm_field_soil_k',
  'farm_field_soil_ph',
  'farm_soil_helper_note',
  'farm_soil_test_badge',
  'ai_crop_rec_title',
  'ai_crop_rec_sub',
  'ai_crop_confidence',
  'ai_crop_alternatives',
  'ai_crop_btn_apply',
  'ai_crop_unavailable',
  'data_source_real_badge',
  'data_source_real_tooltip',
  'ai_insights_title',
  'ai_insights_sub',
  'ai_action_heading',
  'ai_urgency_label',
  'ai_urgency_low',
  'ai_urgency_medium',
  'ai_urgency_high',
  'action_irrigate',
  'action_delay_irrigation',
  'action_monitor',
  'action_no_action_needed',
  'ai_reasons_title',
  'ai_insights_unavailable',
  'data_source_synthetic_badge',
  'data_source_synthetic_tooltip',
  'crop_heading',
  'crop_type_label',
  'crop_rice',
  'crop_wheat',
  'crop_cotton',
  'crop_chickpea',
  'reason_crop_water',
  'reason_rain_prob',
  'reason_irrigation_elapsed',
  'reason_soil_profile',
  'dash_nav_ai',
  'ai_page_title',
  'ai_page_sub',
  'ai_select_farm',
  'ai_crop_heading',
  'ai_irrigation_heading',
  'ai_model1_source_note',
  'ai_model2_source_note',
  'ai_no_farms_title',
  'ai_no_farms_sub',
  'health_section_title',
  'health_section_sub',
  'health_checkin_title',
  'health_status_healthy',
  'health_status_okay',
  'health_status_concerning',
  'crop_health_alert_banner_title',
  'crop_health_alert_banner_desc',
  'market_prices_title',
  'market_prices_sub',
  'market_current_price_label',
  'market_high_rise_title',
  'market_high_rise_note',
  'market_source_disclaimer',
  'market_history_chart_title'
];


let allPassed = true;

console.log('===============================================================');
console.log('10-LANGUAGE AI SECTIONS TRANSLATION AUDIT');
console.log('===============================================================\n');

for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] Missing locale file: ${lang}.json`);
    allPassed = false;
    continue;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let missing = [];
  let leakedEnglish = [];

  for (const key of requiredKeys) {
    if (!data[key] || typeof data[key] !== 'string' || data[key].trim() === '') {
      missing.push(key);
      continue;
    }

    // For non-English languages, check that the text has native script characters (Unicode > 127)
    if (lang !== 'en') {
      const hasNonAscii = /[^\u0000-\u007F]/.test(data[key]);
      if (!hasNonAscii) {
        leakedEnglish.push(`${key}: "${data[key]}"`);
      }
    }
  }

  if (missing.length > 0) {
    console.error(`[FAIL] ${lang.toUpperCase()}: Missing keys (${missing.length}):`, missing);
    allPassed = false;
  } else if (leakedEnglish.length > 0) {
    console.warn(`[WARN] ${lang.toUpperCase()}: English leaking detected (${leakedEnglish.length}):`, leakedEnglish);
    allPassed = false;
  } else {
    console.log(`[PASS] ${lang.toUpperCase()}: All ${requiredKeys.length} required AI & Farm keys fully localized into native script!`);
    console.log(`       Sample AI Action: "${data.action_irrigate}"`);
    console.log(`       Sample AI Insight: "${data.ai_insights_title}"`);
    console.log(`       Sample Crop Rec:  "${data.ai_crop_rec_title}"`);
  }
}

console.log('\n---------------------------------------------------------------');
if (allPassed) {
  console.log('RESULT: 10/10 LANGUAGES FULLY VERIFIED WITH ZERO LEAKED ENGLISH!');
} else {
  console.log('RESULT: Some translation issues detected.');
  process.exit(1);
}
console.log('===============================================================');
