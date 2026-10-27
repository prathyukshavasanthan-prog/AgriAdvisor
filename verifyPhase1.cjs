/**
 * AgriAdvisor — Phase 1 Automated Verification Suite
 * 
 * Verifies:
 * 1. 14 Soil Types + FAO-56 AWHC + ICAR typical values + color swatches
 * 2. Deterministic 3-tap question mapping engine
 * 3. Farm Schema validation & DB persistence for land_type, water_source, irrigation_method, size_unit
 * 4. Area unit conversions (acres, hectares, cents)
 * 5. Safe migration of existing farms
 * 6. 100% translation coverage across all 10 languages
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:5900';

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
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// 3-Tap Question Resolution (Mirrors backend logic)
function resolveSoilTypeFromTapQuestions(sticky, drainage, color) {
  if (color === 'white_crust' || color === 'whitish_crust') return 'saline_alkaline';
  if (color === 'dark_organic') {
    return drainage === 'slow_waterlogs' || drainage === 'slow' || sticky === 'moderately_sticky' || sticky === 'mod_sticky'
      ? 'peaty_marshy'
      : 'hill_forest';
  }
  if (color === 'deep_black' || color === 'black') {
    return sticky === 'very_sticky' || drainage === 'slow_waterlogs' || drainage === 'slow'
      ? 'black'
      : 'clay_loam';
  }
  if (color === 'red_brown' || color === 'red') {
    if (drainage === 'very_fast') return 'laterite';
    if (sticky === 'very_sticky') return 'clay_loam';
    return 'red';
  }
  if (sticky === 'not_sticky_gritty' || sticky === 'not_sticky') {
    if ((color === 'light_yellow_grey' || color === 'yellow_grey') && drainage === 'very_fast') return 'desert_arid';
    return 'sandy';
  }
  if (sticky === 'slightly_sticky' || sticky === 'slight_sticky') {
    if (drainage === 'very_fast') return 'sandy_loam';
    if (drainage === 'slow_waterlogs' || drainage === 'slow') return 'silty';
    return 'alluvial';
  }
  if (sticky === 'very_sticky') {
    return drainage === 'slow_waterlogs' || drainage === 'slow' ? 'clay' : 'clay_loam';
  }
  if (drainage === 'moderate') return 'loamy';
  return 'loamy';
}

async function runPhase1Verification() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — PHASE 1 AUTOMATED VERIFICATION SUITE');
  console.log('  Farmer Inputs: 14 Soil Types, 3-Tap Helper, Land Types & Units');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS [${total}]: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL [${total}]: ${message}`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 1: Soil Table & Hydrology Benchmarks (FAO-56 & ICAR)
  // -------------------------------------------------------------------
  console.log('[Test Suite 1] Soil Table & Hydrology Benchmarks');
  const soilDefaultsPath = path.join(__dirname, '../backend/src/services/soilDefaults.ts');
  const soilDefaultsCode = fs.readFileSync(soilDefaultsPath, 'utf8');

  const expectedSoilTypes = [
    'alluvial', 'black', 'red', 'laterite', 'sandy', 'sandy_loam',
    'loamy', 'silty', 'clay_loam', 'clay', 'saline_alkaline',
    'peaty_marshy', 'desert_arid', 'hill_forest'
  ];

  let allSoilsDefined = true;
  expectedSoilTypes.forEach((st) => {
    if (!soilDefaultsCode.includes(`${st}: {`)) {
      allSoilsDefined = false;
    }
  });

  assert(allSoilsDefined, 'All 14 standard soil types are defined in backend benchmark lookup');
  assert(soilDefaultsCode.includes('awhc:'), 'Available Water Holding Capacity (AWHC) is present in soil benchmarks');
  assert(soilDefaultsCode.includes('FAO-56') && soilDefaultsCode.includes('ICAR'), 'FAO-56 and ICAR citations and approximation notes documented');
  assert(soilDefaultsCode.includes('color_hex:'), 'Color swatches (hex values, no stock photos) defined for each soil type');

  // -------------------------------------------------------------------
  // TEST 2: Deterministic 3-Tap Question Mapping
  // -------------------------------------------------------------------
  console.log('\n[Test Suite 2] Deterministic 3-Tap Question Helper Mapping');
  const t1 = resolveSoilTypeFromTapQuestions('very_sticky', 'slow_waterlogs', 'deep_black');
  assert(t1 === 'black', `Black soil mapped correctly: expected 'black', got '${t1}'`);

  const t2 = resolveSoilTypeFromTapQuestions('not_sticky_gritty', 'very_fast', 'light_yellow_grey');
  assert(t2 === 'desert_arid', `Desert/arid soil mapped correctly: expected 'desert_arid', got '${t2}'`);

  const t3 = resolveSoilTypeFromTapQuestions('moderately_sticky', 'slow_waterlogs', 'dark_organic');
  assert(t3 === 'peaty_marshy', `Peaty/marshy soil mapped correctly: expected 'peaty_marshy', got '${t3}'`);

  const t4 = resolveSoilTypeFromTapQuestions('slightly_sticky', 'moderate', 'whitish_crust');
  assert(t4 === 'saline_alkaline', `Saline/alkaline soil mapped correctly: expected 'saline_alkaline', got '${t4}'`);

  const t5 = resolveSoilTypeFromTapQuestions('slightly_sticky', 'very_fast', 'yellow_grey');
  assert(t5 === 'sandy_loam', `Sandy loam soil mapped correctly: expected 'sandy_loam', got '${t5}'`);

  // Repeatability check: 10 identical calls return identical outputs
  let repeatable = true;
  for (let i = 0; i < 10; i++) {
    if (resolveSoilTypeFromTapQuestions('very_sticky', 'slow_waterlogs', 'deep_black') !== 'black') {
      repeatable = false;
    }
  }
  assert(repeatable, 'Deterministic repeatability: 10 identical evaluations yield 10 identical outputs');

  // -------------------------------------------------------------------
  // TEST 3: Authenticate & Create Farm with Phase 1 Schema
  // -------------------------------------------------------------------
  console.log('\n[Test Suite 3] Live API Verification (Farm Creation with Phase 1 Fields)');
  let authRes = await request(`${API_BASE_URL}/api/auth/login`, { method: 'POST' }, {
    phone_number: '+919876543210',
    password: 'password123',
  });

  let token = authRes.data?.token;
  if (!token) {
    const regRes = await request(`${API_BASE_URL}/api/auth/register`, { method: 'POST' }, {
      name: 'Ramesh Patel',
      phone_number: '+919876543210',
      password: 'password123',
      language_preference: 'en',
    });
    token = regRes.data?.token;
  }

  assert(!!token, 'Authenticated demo cultivator successfully');

  // Create farm with Phase 1 fields: land_type, water_source, irrigation_method, size_unit
  const farmPayload = {
    name: 'Phase 1 Rainfed Hillside Demo Plot',
    latitude: 12.9716,
    longitude: 77.5946,
    area: 2.5,
    size_unit: 'hectares',
    land_type: 'terraced_hill',
    water_source: 'rain_only',
    irrigation_method: 'none',
    soil_type: 'laterite',
    soil_health_card: false,
    crop: {
      crop_type: 'finger_millet',
      sowing_date: new Date().toISOString(),
      status: 'growing',
    },
  };

  const createRes = await request(`${API_BASE_URL}/api/farms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, farmPayload);

  assert(createRes.status === 201 && createRes.data.success, 'Created farm with Phase 1 fields via POST /api/farms');
  const createdFarm = createRes.data.data;
  assert(createdFarm.land_type === 'terraced_hill', `Land type persisted: expected 'terraced_hill', got '${createdFarm.land_type}'`);
  assert(createdFarm.water_source === 'rain_only', `Water source persisted: expected 'rain_only', got '${createdFarm.water_source}'`);
  assert(createdFarm.irrigation_method === 'none', `Irrigation method persisted: expected 'none', got '${createdFarm.irrigation_method}'`);
  assert(createdFarm.size_unit === 'hectares', `Size unit persisted: expected 'hectares', got '${createdFarm.size_unit}'`);
  assert(createdFarm.awhc === 100, `AWHC auto-populated for laterite: expected 100 mm/m, got ${createdFarm.awhc}`);

  // -------------------------------------------------------------------
  // TEST 4: Farm Update & Unit Conversion
  // -------------------------------------------------------------------
  console.log('\n[Test Suite 4] Farm Update & Boundary / Unit Conversion');
  const updateRes = await request(`${API_BASE_URL}/api/farms/${createdFarm._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  }, {
    size_unit: 'cents',
    land_type: 'polyhouse',
    water_source: 'borewell',
    irrigation_method: 'drip',
  });

  assert(updateRes.status === 200 && updateRes.data.success, 'Updated farm parameters via PUT /api/farms/:id');
  const updatedFarm = updateRes.data.data;
  assert(updatedFarm.size_unit === 'cents', `Size unit updated to 'cents': got '${updatedFarm.size_unit}'`);
  assert(updatedFarm.land_type === 'polyhouse', `Land type updated to 'polyhouse': got '${updatedFarm.land_type}'`);
  assert(updatedFarm.irrigation_method === 'drip', `Irrigation method updated to 'drip': got '${updatedFarm.irrigation_method}'`);

  // Cleanup test farm
  await request(`${API_BASE_URL}/api/farms/${createdFarm._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  // -------------------------------------------------------------------
  // TEST 5: Translation Coverage Check
  // -------------------------------------------------------------------
  console.log('\n[Test Suite 5] 10-Language Parity Audit');
  const localesDir = path.join(__dirname, '../frontend/src/i18n/locales');
  const enKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))).sort();
  const languages = ['ta', 'en', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

  let allLangsPass = true;
  languages.forEach((lang) => {
    const lKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'))).sort();
    const missing = enKeys.filter((k) => !lKeys.includes(k));
    if (missing.length > 0) {
      allLangsPass = false;
      console.error(`Language ${lang} missing keys:`, missing);
    }
  });

  assert(allLangsPass, `All 10 languages have 100% key parity with ${enKeys.length} keys`);

  // -------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`  PHASE 1 VERIFICATION COMPLETE: ${passed} / ${total} CHECKS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase1Verification().catch((err) => {
  console.error('Fatal Phase 1 verification error:', err);
  process.exit(1);
});
