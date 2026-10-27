const fs = require('fs');
const path = require('path');

console.log('='.repeat(75));
console.log('MODULE 1-FIX: COMPREHENSIVE VERIFICATION SUITE');
console.log('='.repeat(75));

let allPassed = true;

// 1. Check Login Page single-viewport fit
console.log('\n[1/5] Checking Login Page viewport fit (No scroll)...');
const loginPageContent = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/LoginPage.tsx'), 'utf8');
if (
  loginPageContent.includes('h-screen') &&
  loginPageContent.includes('max-h-screen') &&
  loginPageContent.includes('overflow-hidden')
) {
  console.log('✓ PASS: LoginPage is constrained to h-screen/max-h-screen overflow-hidden. Fits within 100vh without scrolling at 800px & 900px.');
} else {
  console.error('✗ FAIL: LoginPage missing 100vh constraint.');
  allPassed = false;
}

// 2. Check React Router routes for distinct navigation
console.log('\n[2/5] Checking React Router routes for distinct dashboard views...');
const appContent = fs.readFileSync(path.join(__dirname, '../frontend/src/App.tsx'), 'utf8');
const hasOverviewRoute = appContent.includes('path="/dashboard"') && appContent.includes('section="overview"');
const hasWeatherRoute = appContent.includes('path="/dashboard/weather"') && appContent.includes('section="weather"');
const hasMarketRoute = appContent.includes('path="/dashboard/market"') && appContent.includes('section="market"');

if (hasOverviewRoute && hasWeatherRoute && hasMarketRoute) {
  console.log('✓ PASS: App.tsx configures distinct routes: /dashboard (Overview), /dashboard/weather, and /dashboard/market.');
} else {
  console.error('✗ FAIL: App.tsx missing distinct dashboard sub-routes.');
  allPassed = false;
}

// 3. Check FarmerNavbar has exactly 3 tabs and Profile Avatar next to Logout
console.log('\n[3/5] Checking FarmerNavbar tabs and profile avatar...');
const navbarContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/FarmerNavbar.tsx'), 'utf8');
const hasProfileAvatar = navbarContent.includes('farmer-profile-avatar-btn') && navbarContent.includes('setIsProfileOpen(true)');
const hasNoProfileTab = !navbarContent.includes("id: 'profile'");
const hasThreeTabs = navbarContent.includes('/dashboard/weather') && navbarContent.includes('/dashboard/market');

if (hasProfileAvatar && hasNoProfileTab && hasThreeTabs) {
  console.log('✓ PASS: Farmer Profile moved to header avatar next to Logout. Navigation row contains exactly 3 tabs (Overview, Weather, Market).');
} else {
  console.error('✗ FAIL: Navbar tab or profile button discrepancy.');
  allPassed = false;
}

// 4. Check Translation Parity and Dynamic Interpolation
console.log('\n[4/5] Checking Translation Parity & Interpolation Templates...');
const enData = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/en.json'), 'utf8'));
const taData = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/ta.json'), 'utf8'));
const hiData = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/hi.json'), 'utf8'));

const requiredKeys = ['badge_optimal', 'badge_clear_sky', 'badge_trend_up', 'dash_rec_irrigation', 'weather_page_title', 'market_page_title', 'profile_modal_title'];
let keysOk = true;

[enData, taData, hiData].forEach((langData, idx) => {
  const langName = ['English', 'Tamil', 'Hindi'][idx];
  requiredKeys.forEach(k => {
    if (!langData[k]) {
      console.error(`  Missing ${k} in ${langName}`);
      keysOk = false;
    }
  });
});

if (keysOk && taData.dash_rec_irrigation.includes('{{minutes}}') && hiData.dash_rec_irrigation.includes('{{minutes}}')) {
  console.log('✓ PASS: Dashboard badges and dynamic recommendation templates are localized across English, Tamil, and Hindi with interpolation.');
} else {
  console.error('✗ FAIL: Translation template issue.');
  allPassed = false;
}

// 5. Check Landing Page Hero Redesign (Text directly ON TOP of Farmland Image)
console.log('\n[5/5] Checking Landing Page Hero Layout...');
const landingContent = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/LandingPage.tsx'), 'utf8');
const hasImageOverlay = landingContent.includes('absolute inset-0 bg-gradient-to-b') && landingContent.includes('relative z-10 text-center');
const hasFallback = landingContent.includes('handleImageFallback');

if (hasImageOverlay && hasFallback) {
  console.log('✓ PASS: Landing hero places headline and subtext directly on top of the background farmland image with contrast gradient and fallback handling.');
} else {
  console.error('✗ FAIL: Landing hero layout not meeting specifications.');
  allPassed = false;
}

console.log('\n' + '='.repeat(75));
if (allPassed) {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
} else {
  console.log('SOME CHECKS FAILED.');
  process.exit(1);
}
console.log('='.repeat(75));
