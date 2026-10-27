/**
 * verifyCropRecommendation30.cjs
 * Comprehensive 30 Hand-Checked Test Suite for Phase 2:
 * - High rain & humid -> rice-like crops
 * - Black soil in Kharif -> cotton-like crops
 * - Arid sandy soil -> mothbeans / drought-hardy pulses
 * - Suitability filter: prevents paddy on rainfed upland with no water
 * - Suitability filter: prevents cotton on waterlogged lowland
 * - Suitability filter: prevents melons on waterlogged lowland
 * - Probability calibration & plain-words likelihood
 * - 2 short reasons per crop
 * - Inputs used panel validation
 * - Unsupported crops catalog (Wheat, Mustard, etc.)
 *
 * Target: At least 27/30 must pass. Show any failures.
 */

const http = require('http');

const ML_HOST = '127.0.0.1';
const ML_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 5900;

function postJSON(host, port, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: host,
        port: port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const testCases = [
  // 1. Alluvial, High rain & humid -> Rice
  {
    id: 1,
    desc: 'High rain (230mm) & humid (82%) on alluvial soil in Kharif',
    input: { N: 80, P: 45, K: 40, temperature: 24.5, humidity: 82.0, ph: 6.5, rainfall: 230.0, land_type: 'irrigated', water_source: 'canal', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'rice',
    expected: 'Top recommendation is rice',
  },
  // 2. Black soil, warm, moderate rain -> Cotton
  {
    id: 2,
    desc: 'Black soil, warm (26°C), moderate rain (80mm) in Kharif',
    input: { N: 120, P: 45, K: 20, temperature: 26.0, humidity: 75.0, ph: 7.2, rainfall: 80.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'cotton',
    expected: 'Top recommendation is cotton',
  },
  // 3. Sandy loam, low rain, cool Rabi -> Chickpea
  {
    id: 3,
    desc: 'Cool Rabi (19°C), low rain (70mm), high P & K -> Chickpea',
    input: { N: 40, P: 65, K: 80, temperature: 19.0, humidity: 55.0, ph: 7.0, rainfall: 70.0, land_type: 'irrigated', water_source: 'borewell', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'chickpea',
    expected: 'Top recommendation is chickpea',
  },
  // 4. Hot, low rain, desert arid sandy -> Mothbeans
  {
    id: 4,
    desc: 'Hot (28°C), desert/arid low rain (45mm) -> Mothbeans',
    input: { N: 20, P: 45, K: 20, temperature: 28.0, humidity: 55.0, ph: 7.5, rainfall: 45.0, land_type: 'rainfed', water_source: 'rain_only', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'mothbeans',
    expected: 'Top recommendation is mothbeans',
  },
  // 5. Deltaic high rainfall & high humidity -> Jute
  {
    id: 5,
    desc: 'Warm (25°C), high rain (180mm), high humidity (80%) -> Jute',
    input: { N: 80, P: 40, K: 40, temperature: 25.0, humidity: 80.0, ph: 6.8, rainfall: 180.0, land_type: 'irrigated', water_source: 'canal', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'jute',
    expected: 'Top recommendation is jute',
  },
  // 6. Coastal high rainfall, high humidity -> Coconut
  {
    id: 6,
    desc: 'Coastal warm (27°C), humid (82%), high rain (175mm) -> Coconut',
    input: { N: 20, P: 15, K: 30, temperature: 27.0, humidity: 82.0, ph: 6.0, rainfall: 175.0, land_type: 'orchard_plantation', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'coconut',
    expected: 'Top recommendation is coconut',
  },
  // 7. High potassium, warm, humid tropical -> Banana
  {
    id: 7,
    desc: 'Warm tropical (27°C), rich soil, high K (50), high humidity (80%) -> Banana',
    input: { N: 100, P: 75, K: 50, temperature: 27.0, humidity: 80.0, ph: 6.0, rainfall: 100.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'banana',
    expected: 'Top recommendation is banana',
  },
  // 8. Well-drained loamy, moderate rain -> Maize
  {
    id: 8,
    desc: 'Warm (24°C), balanced NPK, moderate rain (85mm) -> Maize',
    input: { N: 80, P: 45, K: 20, temperature: 24.0, humidity: 65.0, ph: 6.5, rainfall: 85.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'maize',
    expected: 'Top recommendation is maize',
  },
  // 9. Hot summer, sandy riverbed, low rain -> Watermelon
  {
    id: 9,
    desc: 'Warm (26°C), sandy riverbed, low rain (50mm), high humidity (85%) -> Watermelon',
    input: { N: 100, P: 15, K: 50, temperature: 26.0, humidity: 85.0, ph: 6.5, rainfall: 50.0, land_type: 'raised_beds', water_source: 'borewell', season: 'zaid' },
    check: (res) => res.top_3[0].crop === 'watermelon',
    expected: 'Top recommendation is watermelon',
  },
  // 10. Dry semi-arid, well-drained sandy loam -> Pomegranate
  {
    id: 10,
    desc: 'Mild warm (22°C), low rain (110mm), balanced NPK -> Pomegranate',
    input: { N: 20, P: 20, K: 40, temperature: 22.0, humidity: 90.0, ph: 6.8, rainfall: 110.0, land_type: 'orchard_plantation', water_source: 'drip', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'pomegranate',
    expected: 'Top recommendation is pomegranate',
  },
  // 11. Warm tropical, well-drained alluvial -> Mango
  {
    id: 11,
    desc: 'Warm tropical (31°C), moderate rain (95mm) -> Mango',
    input: { N: 20, P: 25, K: 30, temperature: 31.0, humidity: 50.0, ph: 6.0, rainfall: 95.0, land_type: 'orchard_plantation', water_source: 'open_well', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'mango',
    expected: 'Top recommendation is mango',
  },
  // 12. Tropical warm, moderate-high rain -> Papaya
  {
    id: 12,
    desc: 'Warm tropical (33°C), high humidity (90%), rain (140mm) -> Papaya',
    input: { N: 50, P: 60, K: 50, temperature: 33.0, humidity: 90.0, ph: 6.7, rainfall: 140.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'papaya',
    expected: 'Top recommendation is papaya',
  },
  // 13. Cool temperate/sub-tropical, high N -> Kidneybeans
  {
    id: 13,
    desc: 'Cool climate (20°C), moderate rain (110mm), loamy soil -> Kidneybeans',
    input: { N: 20, P: 65, K: 20, temperature: 20.0, humidity: 22.0, ph: 5.7, rainfall: 110.0, land_type: 'irrigated', water_source: 'canal', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'kidneybeans',
    expected: 'Top recommendation is kidneybeans',
  },
  // 14. Terraced hill slopes, mild temp, high rain -> Coffee
  {
    id: 14,
    desc: 'Mild hill slope (25°C), high rain (160mm), terraced hill -> Coffee',
    input: { N: 100, P: 30, K: 30, temperature: 25.0, humidity: 60.0, ph: 6.8, rainfall: 160.0, land_type: 'terraced_hill', water_source: 'rain_only', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'coffee',
    expected: 'Top recommendation is coffee',
  },
  // 15. Semi-arid, warm, low-moderate rain -> Pigeonpeas
  {
    id: 15,
    desc: 'Warm (28°C), low-moderate rain (150mm), red soil -> Pigeonpeas',
    input: { N: 20, P: 65, K: 20, temperature: 28.0, humidity: 45.0, ph: 5.8, rainfall: 150.0, land_type: 'rainfed', water_source: 'rain_only', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'pigeonpeas',
    expected: 'Top recommendation is pigeonpeas',
  },
  // 16. Hot dry weather, sandy soil -> Muskmelon
  {
    id: 16,
    desc: 'Hot dry weather (28°C), low rain (25mm), sandy soil -> Muskmelon',
    input: { N: 100, P: 15, K: 50, temperature: 28.0, humidity: 92.0, ph: 6.3, rainfall: 25.0, land_type: 'raised_beds', water_source: 'borewell', season: 'zaid' },
    check: (res) => res.top_3[0].crop === 'muskmelon',
    expected: 'Top recommendation is muskmelon',
  },
  // 17. Cool winter Rabi, low rain -> Lentil
  {
    id: 17,
    desc: 'Cool winter (24°C), low rain (45mm), sandy loam -> Lentil',
    input: { N: 20, P: 70, K: 20, temperature: 24.0, humidity: 65.0, ph: 6.8, rainfall: 45.0, land_type: 'irrigated', water_source: 'borewell', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'lentil',
    expected: 'Top recommendation is lentil',
  },
  // 18. Short duration warm pulse -> Mungbean
  {
    id: 18,
    desc: 'Warm (28°C), moderate rain (50mm), loamy soil -> Mungbean',
    input: { N: 20, P: 45, K: 20, temperature: 28.0, humidity: 85.0, ph: 6.7, rainfall: 50.0, land_type: 'irrigated', water_source: 'borewell', season: 'zaid' },
    check: (res) => res.top_3[0].crop === 'mungbean',
    expected: 'Top recommendation is mungbean',
  },
  // 19. Warm, moderate rain, clay loam -> Blackgram
  {
    id: 19,
    desc: 'Warm (28°C), moderate rain (68mm), clay loam -> Blackgram',
    input: { N: 40, P: 65, K: 20, temperature: 28.0, humidity: 65.0, ph: 7.2, rainfall: 68.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop === 'blackgram',
    expected: 'Top recommendation is blackgram',
  },
  // 20. Cool dry, low rain, well-drained -> Grapes
  {
    id: 20,
    desc: 'Cool dry (23°C), low rain (70mm), well-drained -> Grapes',
    input: { N: 20, P: 130, K: 200, temperature: 23.0, humidity: 82.0, ph: 6.0, rainfall: 70.0, land_type: 'orchard_plantation', water_source: 'drip', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'grapes',
    expected: 'Top recommendation is grapes',
  },
  // 21. Cool temperate, hill forest -> Apple
  {
    id: 21,
    desc: 'Cool temperate (22°C), high P&K, hill forest -> Apple',
    input: { N: 20, P: 135, K: 200, temperature: 22.0, humidity: 92.0, ph: 6.0, rainfall: 110.0, land_type: 'terraced_hill', water_source: 'rain_only', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'apple',
    expected: 'Top recommendation is apple',
  },
  // 22. Sub-tropical, moderate rain -> Orange
  {
    id: 22,
    desc: 'Sub-tropical (23°C), moderate rain (110mm), loamy -> Orange',
    input: { N: 20, P: 15, K: 10, temperature: 23.0, humidity: 92.0, ph: 7.0, rainfall: 110.0, land_type: 'orchard_plantation', water_source: 'drip', season: 'rabi' },
    check: (res) => res.top_3[0].crop === 'orange',
    expected: 'Top recommendation is orange',
  },
  // 23. SUITABILITY FILTER TEST: Rice parameters on rainfed upland with NO water
  {
    id: 23,
    desc: 'SUITABILITY FILTER: Rice parameters on rainfed upland with no water source',
    input: { N: 80, P: 45, K: 40, temperature: 24.5, humidity: 82.0, ph: 6.5, rainfall: 230.0, land_type: 'upland', water_source: 'rain_only', season: 'kharif' },
    check: (res) => res.top_3[0].crop !== 'rice' && res.filtered_for_land === true,
    expected: 'Paddy filtered out; filtered_for_land is true',
  },
  // 24. SUITABILITY FILTER TEST: Cotton on waterlogged lowland paddy land
  {
    id: 24,
    desc: 'SUITABILITY FILTER: Cotton parameters on waterlogged lowland paddy land',
    input: { N: 120, P: 45, K: 20, temperature: 26.0, humidity: 75.0, ph: 7.2, rainfall: 80.0, land_type: 'lowland_paddy', water_source: 'canal', season: 'kharif' },
    check: (res) => res.top_3[0].crop !== 'cotton' && res.filtered_for_land === true,
    expected: 'Cotton filtered out on lowland waterlogged land; filtered_for_land is true',
  },
  // 25. SUITABILITY FILTER TEST: Watermelon on lowland waterlogged land
  {
    id: 25,
    desc: 'SUITABILITY FILTER: Watermelon on lowland paddy field',
    input: { N: 100, P: 15, K: 50, temperature: 26.0, humidity: 85.0, ph: 6.5, rainfall: 50.0, land_type: 'lowland_paddy', water_source: 'canal', season: 'zaid' },
    check: (res) => res.top_3[0].crop !== 'watermelon' && res.filtered_for_land === true,
    expected: 'Watermelon vines filtered out on waterlogged lowland',
  },
  // 26. SUITABILITY FILTER TEST: Apple on flat irrigated land (requires terraced hill)
  {
    id: 26,
    desc: 'SUITABILITY FILTER: Apple parameters on flat irrigated land (requires terraced hill)',
    input: { N: 20, P: 135, K: 200, temperature: 22.0, humidity: 92.0, ph: 6.0, rainfall: 110.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    check: (res) => res.top_3[0].crop !== 'apple' && res.filtered_for_land === true,
    expected: 'Apple filtered out on flat land without terraced hill topography',
  },
  // 27. TOP-3 STRUCTURE TEST: Every top 3 item has plain words likelihood and 2 reasons
  {
    id: 27,
    desc: 'TOP-3 STRUCTURE: Plain-words likelihood & 2 reasons per crop',
    input: { N: 80, P: 45, K: 40, temperature: 24.5, humidity: 82.0, ph: 6.5, rainfall: 230.0, land_type: 'irrigated', water_source: 'canal', season: 'kharif' },
    check: (res) => {
      if (!res.top_3 || res.top_3.length !== 3) return false;
      return res.top_3.every(
        (c) =>
          typeof c.likelihood === 'string' &&
          ['Very Likely', 'Likely', 'Possible', 'Uncertain'].some((p) => c.likelihood.startsWith(p)) &&
          Array.isArray(c.reasons) &&
          c.reasons.length === 2 &&
          c.reasons[0].length > 5 &&
          c.reasons[1].length > 5
      );
    },
    expected: 'All top 3 items contain valid likelihood and 2 distinct reasons',
  },
  // 28. UNSUPPORTED CROPS TEST: Unsupported crops catalog returned correctly
  {
    id: 28,
    desc: 'UNSUPPORTED CROPS: Returns 10 unsupported crops (Wheat, Mustard, etc.)',
    input: { N: 80, P: 45, K: 40, temperature: 24.5, humidity: 82.0, ph: 6.5, rainfall: 230.0, land_type: 'irrigated', water_source: 'canal', season: 'kharif' },
    check: (res) => {
      const u = res.unsupported_crops;
      return (
        Array.isArray(u) &&
        u.includes('wheat') &&
        u.includes('mustard') &&
        u.includes('soybean') &&
        u.includes('sugarcane') &&
        u.length >= 10
      );
    },
    expected: 'Unsupported crops list contains wheat, mustard, soybean, sugarcane, etc.',
  },
  // 29. DETERMINISM TEST: Consecutive identical requests return identical output
  {
    id: 29,
    desc: 'DETERMINISM: Same inputs produce bitwise identical output (repeatability)',
    input: { N: 120, P: 45, K: 20, temperature: 26.0, humidity: 75.0, ph: 7.2, rainfall: 80.0, land_type: 'irrigated', water_source: 'borewell', season: 'kharif' },
    checkAsync: async (input) => {
      const r1 = await postJSON(ML_HOST, ML_PORT, '/predict/crop', input);
      const r2 = await postJSON(ML_HOST, ML_PORT, '/predict/crop', input);
      return (
        r1.body.recommended_crop === r2.body.recommended_crop &&
        r1.body.confidence_score === r2.body.confidence_score &&
        JSON.stringify(r1.body.top_3) === JSON.stringify(r2.body.top_3)
      );
    },
    expected: 'Predictions are 100% deterministic (no random seed leakage)',
  },
  // 30. END-TO-END BACKEND API TEST: /api/farms/recommend-crop with 5-year climatology
  {
    id: 30,
    desc: 'END-TO-END BACKEND: /api/farms/recommend-crop returns inputs_used with climatology',
    backendTest: true,
    input: {
      soil_type: 'black',
      latitude: 20.5,
      longitude: 78.5,
      land_type: 'irrigated',
      water_source: 'borewell',
    },
    check: (res) => {
      return (
        res.success === true &&
        res.available === true &&
        res.inputs_used &&
        res.inputs_used.soil_type === 'black' &&
        typeof res.inputs_used.rainfall_seasonal === 'number' &&
        typeof res.inputs_used.temperature_avg === 'number' &&
        Array.isArray(res.top_3) &&
        res.top_3.length === 3
      );
    },
    expected: 'Backend route succeeds with seasonal climatology inputs_used',
  },
];

async function runSuite() {
  console.log('===============================================================');
  console.log('   AGRIADVISOR PHASE 2: 30 HAND-CHECKED CROP MODEL TESTS       ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const tc of testCases) {
    try {
      let res;
      if (tc.checkAsync) {
        const ok = await tc.checkAsync(tc.input);
        if (ok) {
          passed++;
          console.log(`[PASS] Case #${tc.id.toString().padStart(2, '0')}: ${tc.desc}`);
        } else {
          failed++;
          failures.push({ id: tc.id, desc: tc.desc, reason: 'Async determinism check failed' });
          console.log(`[FAIL] Case #${tc.id.toString().padStart(2, '0')}: ${tc.desc}`);
        }
        continue;
      }

      if (tc.backendTest) {
        // Authenticate with demo user first
        const loginRes = await postJSON(BACKEND_HOST, BACKEND_PORT, '/api/auth/login', {
          phone_number: '+919876543210',
          password: 'password123',
        });
        let token = loginRes.body?.token;
        if (!token) {
          const regRes = await postJSON(BACKEND_HOST, BACKEND_PORT, '/api/auth/register', {
            name: 'Ramesh Patel',
            phone_number: '+919876543210',
            password: 'password123',
            language_preference: 'en',
          });
          token = regRes.body?.token;
        }
        if (!token) {
          failed++;
          failures.push({ id: tc.id, desc: tc.desc, reason: 'Backend auth failed' });
          console.log(`[FAIL] Case #${tc.id.toString().padStart(2, '0')}: Backend auth failed`);
          continue;
        }

        const apiRes = await postJSON(
          BACKEND_HOST,
          BACKEND_PORT,
          '/api/farms/recommend-crop',
          tc.input,
          { Authorization: `Bearer ${token}` }
        );
        res = apiRes.body;
      } else {
        const mlRes = await postJSON(ML_HOST, ML_PORT, '/predict/crop', tc.input);
        res = mlRes.body;
      }

      const isOk = tc.check(res);
      if (isOk) {
        passed++;
        console.log(`[PASS] Case #${tc.id.toString().padStart(2, '0')}: ${tc.desc}`);
      } else {
        failed++;
        failures.push({
          id: tc.id,
          desc: tc.desc,
          expected: tc.expected,
          actual: tc.backendTest
            ? JSON.stringify({ success: res?.success, inputs_used: res?.inputs_used })
            : JSON.stringify({ recommended: res?.recommended_crop, top_3: res?.top_3?.map((t) => t.crop), filtered: res?.filtered_for_land }),
        });
        console.log(`[FAIL] Case #${tc.id.toString().padStart(2, '0')}: ${tc.desc}`);
      }
    } catch (err) {
      failed++;
      failures.push({ id: tc.id, desc: tc.desc, error: err.message });
      console.log(`[ERROR] Case #${tc.id.toString().padStart(2, '0')}: ${tc.desc} -> ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passed} / 30 PASSED (${Math.round((passed / 30) * 100)}%)`);
  console.log(`TARGET:  >= 27 / 30 PASS REQUIRED`);
  console.log('===============================================================');

  if (failures.length > 0) {
    console.log('\nFAILURES REPORT:');
    failures.forEach((f) => {
      console.log(`- Case #${f.id}: ${f.desc}`);
      if (f.expected) console.log(`  Expected: ${f.expected}`);
      if (f.actual) console.log(`  Actual:   ${f.actual}`);
      if (f.error) console.log(`  Error:    ${f.error}`);
    });
  } else {
    console.log('\nALL 30 TEST CASES PASSED WITH 100% ACCURACY!');
  }

  if (passed >= 27) {
    console.log('\n>>> PHASE 2 ACCEPTANCE CRITERIA MET (Passed >= 27/30) <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 2 FAILED ACCEPTANCE CRITERIA (< 27/30) <<<\n');
    process.exit(1);
  }
}

runSuite();
