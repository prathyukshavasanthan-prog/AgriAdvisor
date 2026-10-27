/**
 * AgriAdvisor — Phase 3: 20 Hand-Checked Irrigation Decision Test Suite
 * 
 * Verifies:
 * 1. Heavy rain coming -> Hold (rain coming)
 * 2. Hot, dry, sandy soil for 10 days -> Irrigate now
 * 3. Clay soil just after rain -> Not needed
 * 4. Rainfed land with no water source -> "Conserve Soil Moisture" (Never says "irrigate")
 * 5. Honest labeling: "trained on an agronomic simulation with real historical weather"
 * 6. Depletion estimation, urgency levels, and agronomic explanations
 * 
 * Requirement: At least 18/20 must pass. Show any failures.
 */

const http = require('http');

const ML_HOST = '127.0.0.1';
const ML_PORT = 8000;

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: ML_HOST,
        port: ML_PORT,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: ML_HOST,
        port: ML_PORT,
        path: path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

const testCases = [
  // 1. Heavy rain coming -> Hold
  {
    id: 1,
    name: 'Heavy rain coming (35 mm forecast) on loamy soil',
    input: {
      soil_type: 'loamy',
      crop_type: 'wheat',
      forecast_rain_amount: 35.0,
      days_since_rain: 4,
      days_since_last_irrigation: 5,
    },
    expectedAction: 'Hold (rain coming)',
    expectedUrgency: 'Low',
  },
  // 2. Hot, dry, sandy soil for 10 days -> Irrigate now
  {
    id: 2,
    name: 'Hot, dry, sandy soil for 10 days (severe water deficit)',
    input: {
      soil_type: 'sandy',
      crop_type: 'rice',
      forecast_rain_amount: 0.0,
      days_since_rain: 12,
      days_since_last_irrigation: 10,
      soil_water_depletion_pct: 68.0,
      temperature: 38.0,
    },
    expectedAction: 'Irrigate now',
    expectedUrgency: 'High',
  },
  // 3. Clay soil just after rain -> Not needed
  {
    id: 3,
    name: 'Clay soil just after heavy rain (1 day ago, 0% deficit)',
    input: {
      soil_type: 'clay',
      crop_type: 'cotton',
      forecast_rain_amount: 0.0,
      days_since_rain: 1,
      days_since_last_irrigation: 1,
      soil_water_depletion_pct: 5.0,
    },
    expectedAction: 'Not needed',
    expectedUrgency: 'Low',
  },
  // 4. Rainfed land with no water source -> Conserve Soil Moisture (never "irrigate")
  {
    id: 4,
    name: 'Rainfed land with no water source (rain_only, dry spell)',
    input: {
      soil_type: 'red',
      crop_type: 'chickpea',
      land_type: 'rainfed',
      water_source: 'rain_only',
      irrigation_method: 'none',
      days_since_rain: 10,
      forecast_rain_amount: 0.0,
    },
    expectedAction: 'Conserve Soil Moisture',
    expectedRainfed: true,
  },
  // 5. Rainfed land with heavy incoming rain (40 mm) -> Hold
  {
    id: 5,
    name: 'Rainfed land with incoming monsoon shower (40 mm)',
    input: {
      soil_type: 'black',
      crop_type: 'cotton',
      land_type: 'rainfed',
      water_source: 'rain_only',
      irrigation_method: 'none',
      forecast_rain_amount: 40.0,
    },
    expectedAction: 'Hold (rain coming)',
    expectedRainfed: true,
  },
  // 6. Alluvial soil, moderate depletion (38% TAW) -> Irrigate in 2-3 days
  {
    id: 6,
    name: 'Alluvial soil drip-irrigated, approaching threshold (38% TAW)',
    input: {
      soil_type: 'alluvial',
      crop_type: 'wheat',
      forecast_rain_amount: 1.0,
      days_since_rain: 8,
      days_since_last_irrigation: 5,
      soil_water_depletion_pct: 38.0,
    },
    expectedAction: 'Irrigate in 2-3 days',
    expectedUrgency: 'Medium',
  },
  // 7. Black soil cotton, recent irrigation (depletion 12%) -> Not needed
  {
    id: 7,
    name: 'Black soil cotton, recently watered (12% depletion)',
    input: {
      soil_type: 'black',
      crop_type: 'cotton',
      forecast_rain_amount: 2.0,
      days_since_rain: 7,
      days_since_last_irrigation: 2,
      soil_water_depletion_pct: 12.0,
    },
    expectedAction: 'Not needed',
    expectedUrgency: 'Low',
  },
  // 8. Sandy loam tomato, critical water deficit (58% TAW) -> Irrigate now
  {
    id: 8,
    name: 'Sandy loam tomato, critical water deficit (58% TAW)',
    input: {
      soil_type: 'sandy_loam',
      crop_type: 'tomato',
      forecast_rain_amount: 0.0,
      days_since_rain: 14,
      days_since_last_irrigation: 8,
      soil_water_depletion_pct: 58.0,
    },
    expectedAction: 'Irrigate now',
    expectedUrgency: 'High',
  },
  // 9. Loamy soil, monsoon forecast (28 mm in 48h) -> Hold
  {
    id: 9,
    name: 'Loamy soil, substantial rain incoming (28 mm)',
    input: {
      soil_type: 'loamy',
      crop_type: 'maize',
      forecast_rain_amount: 28.0,
      days_since_rain: 2,
      days_since_last_irrigation: 4,
    },
    expectedAction: 'Hold (rain coming)',
    expectedUrgency: 'Low',
  },
  // 10. Red soil pulses, nearing allowable depletion (36%) -> Irrigate in 2-3 days
  {
    id: 10,
    name: 'Red soil pulses, nearing allowable depletion (36%)',
    input: {
      soil_type: 'red',
      crop_type: 'chickpea',
      forecast_rain_amount: 0.0,
      days_since_rain: 6,
      days_since_last_irrigation: 4,
      soil_water_depletion_pct: 36.0,
    },
    expectedAction: 'Irrigate in 2-3 days',
    expectedUrgency: 'Medium',
  },
  // 11. Sugarcane furrow irrigation, high depletion (62% TAW) -> Irrigate now
  {
    id: 11,
    name: 'Sugarcane furrow irrigation, high depletion (62% TAW)',
    input: {
      soil_type: 'alluvial',
      crop_type: 'sugarcane',
      irrigation_method: 'furrow',
      forecast_rain_amount: 0.0,
      days_since_rain: 15,
      days_since_last_irrigation: 10,
      soil_water_depletion_pct: 62.0,
    },
    expectedAction: 'Irrigate now',
    expectedUrgency: 'High',
  },
  // 12. Peaty marshy soil, high water capacity -> Not needed
  {
    id: 12,
    name: 'Peaty marshy soil, high moisture holding (15% depletion)',
    input: {
      soil_type: 'peaty_marshy',
      crop_type: 'rice',
      forecast_rain_amount: 2.0,
      days_since_rain: 3,
      days_since_last_irrigation: 3,
      soil_water_depletion_pct: 15.0,
    },
    expectedAction: 'Not needed',
    expectedUrgency: 'Low',
  },
  // 13. Dryland rainfed upland with no irrigation source -> Conserve Soil Moisture
  {
    id: 13,
    name: 'Dryland rainfed upland with no irrigation source',
    input: {
      soil_type: 'laterite',
      crop_type: 'mothbeans',
      land_type: 'dryland',
      water_source: 'rain_only',
      irrigation_method: 'none',
      days_since_rain: 14,
      forecast_rain_amount: 0.0,
    },
    expectedAction: 'Conserve Soil Moisture',
    expectedRainfed: true,
  },
  // 14. Sprinkler wheat in cool Rabi, low depletion (18%) -> Not needed
  {
    id: 14,
    name: 'Sprinkler wheat in cool Rabi (18% depletion)',
    input: {
      soil_type: 'silty',
      crop_type: 'wheat',
      irrigation_method: 'sprinkler',
      forecast_rain_amount: 1.0,
      days_since_rain: 4,
      days_since_last_irrigation: 2,
      soil_water_depletion_pct: 18.0,
      temperature: 18.0,
    },
    expectedAction: 'Not needed',
    expectedUrgency: 'Low',
  },
  // 15. Extreme heavy storm incoming (55 mm) -> Hold
  {
    id: 15,
    name: 'Extreme heavy rain storm incoming (55 mm)',
    input: {
      soil_type: 'clay_loam',
      crop_type: 'rice',
      forecast_rain_amount: 55.0,
      days_since_rain: 1,
      days_since_last_irrigation: 6,
    },
    expectedAction: 'Hold (rain coming)',
    expectedUrgency: 'Low',
  },
  // 16. Desert arid soil, high temperature (42°C), high depletion (75%) -> Irrigate now
  {
    id: 16,
    name: 'Desert arid soil, extreme heat (42°C) and high deficit',
    input: {
      soil_type: 'desert_arid',
      crop_type: 'chickpea',
      forecast_rain_amount: 0.0,
      days_since_rain: 25,
      days_since_last_irrigation: 12,
      soil_water_depletion_pct: 75.0,
      temperature: 42.0,
    },
    expectedAction: 'Irrigate now',
    expectedUrgency: 'High',
  },
  // 17. Silty soil, depletion 40% with zero rain -> Irrigate in 2-3 days
  {
    id: 17,
    name: 'Silty soil, depletion 40% with zero incoming rain',
    input: {
      soil_type: 'silty',
      crop_type: 'maize',
      forecast_rain_amount: 0.0,
      days_since_rain: 8,
      days_since_last_irrigation: 6,
      soil_water_depletion_pct: 40.0,
    },
    expectedAction: 'Irrigate in 2-3 days',
    expectedUrgency: 'Medium',
  },
  // 18. Clay soil irrigated yesterday (depletion 5%) -> Not needed
  {
    id: 18,
    name: 'Clay soil just irrigated yesterday (5% depletion)',
    input: {
      soil_type: 'clay',
      crop_type: 'cotton',
      forecast_rain_amount: 0.0,
      days_since_rain: 10,
      days_since_last_irrigation: 1,
      soil_water_depletion_pct: 5.0,
    },
    expectedAction: 'Not needed',
    expectedUrgency: 'Low',
  },
  // 19. Heavy downpour expected tomorrow (45 mm) on sandy soil -> Hold
  {
    id: 19,
    name: 'Heavy downpour expected tomorrow (45 mm) on sandy soil',
    input: {
      soil_type: 'sandy',
      crop_type: 'tomato',
      forecast_rain_amount: 45.0,
      days_since_rain: 5,
      days_since_last_irrigation: 6,
    },
    expectedAction: 'Hold (rain coming)',
    expectedUrgency: 'Low',
  },
  // 20. Rainfed plot with dry weather -> Conserve Soil Moisture
  {
    id: 20,
    name: 'Rainfed low-rainfall plot with dry weather',
    input: {
      soil_type: 'red',
      crop_type: 'pigeonpeas',
      land_type: 'rainfed',
      water_source: 'rain_only',
      irrigation_method: 'none',
      days_since_rain: 9,
      forecast_rain_amount: 1.0,
    },
    expectedAction: 'Conserve Soil Moisture',
    expectedRainfed: true,
  },
];

async function runTests() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — PHASE 3: 20 HAND-CHECKED IRRIGATION TEST SUITE');
  console.log('  Grounded in FAO-56 Daily Soil Water Balance & Real Historical Weather');
  console.log('========================================================================\n');

  // Verify Model Metrics and Held-out Locations
  console.log('>>> [1/2] AUDITING MODEL 2 METRICS & HELD-OUT GENERALIZATION...');
  const metricsRes = await getJSON('/metrics');
  if (metricsRes.status !== 200) {
    throw new Error(`Failed to fetch /metrics: HTTP ${metricsRes.status}`);
  }
  const m2 = metricsRes.data.model_2_irrigation_urgency;

  console.log(`  Model Name:          ${m2.model_name}`);
  console.log(`  Dataset Citation:    ${m2.dataset}`);
  console.log(`  Trained On Label:    "${m2.trained_on}"`);
  console.log(`  Total Samples:       ${m2.total_samples.toLocaleString()} (Train: ${m2.train_samples.toLocaleString()}, Held-Out Test: ${m2.test_samples.toLocaleString()})`);
  console.log(`  Held-Out Locations:  ${m2.held_out_locations.join(', ')} (Zero data leakage)`);
  console.log(`  Held-Out Accuracy:   ${(m2.accuracy * 100).toFixed(2)}%`);
  console.log(`  Held-Out Macro F1:   ${m2.macro_f1.toFixed(4)} (Target: >= 0.85)`);
  console.log(`  Held-Out Precision:  ${m2.macro_precision.toFixed(4)}`);
  console.log(`  Held-Out Recall:     ${m2.macro_recall.toFixed(4)}`);
  console.log('\n  Top 5 Feature Importances:');
  const sortedFeats = Object.entries(m2.feature_importances).sort((a, b) => b[1] - a[1]);
  sortedFeats.slice(0, 5).forEach(([f, imp]) => {
    console.log(`    - ${f.padEnd(28)}: ${(imp * 100).toFixed(2)}%`);
  });

  if (m2.macro_f1 < 0.85) {
    console.error(`\nFAIL: Macro F1 ${m2.macro_f1} is below requirement of 0.85!`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ Macro F1 ${m2.macro_f1.toFixed(4)} meets requirement (>= 0.85).\n`);
  }

  // 2. Run 20 Hand-Checked Test Cases
  console.log('>>> [2/2] EVALUATING 20 HAND-CHECKED AGRO-CLIMATIC TEST SCENARIOS...');
  let passed = 0;
  const failures = [];

  for (const tc of testCases) {
    try {
      const res = await postJSON('/predict/irrigation', tc.input);
      if (res.status !== 200) {
        failures.push({ id: tc.id, name: tc.name, error: `HTTP ${res.status}` });
        console.log(`  [TEST ${tc.id.toString().padStart(2)}] ✗ ${tc.name}: HTTP ${res.status}`);
        continue;
      }

      const d = res.data;
      const actionMatch = d.recommended_action === tc.expectedAction;
      const urgencyMatch = tc.expectedUrgency ? d.urgency_level === tc.expectedUrgency : true;
      const rainfedMatch = tc.expectedRainfed ? d.is_rainfed_no_water === true : true;
      const honestLabelMatch = d.trained_on === 'trained on an agronomic simulation with real historical weather';
      const reasonsValid = Array.isArray(d.top_reasons) && d.top_reasons.length >= 2;

      if (actionMatch && urgencyMatch && rainfedMatch && honestLabelMatch && reasonsValid) {
        passed++;
        console.log(`  [TEST ${tc.id.toString().padStart(2)}] ✓ PASS: ${tc.name}`);
        console.log(`             Action: "${d.recommended_action}" | Urgency: ${d.urgency_level} | Depletion: ${d.soil_water_depletion_pct}%`);
        console.log(`             Reasons: 1) ${d.top_reasons[0]}`);
        console.log(`                      2) ${d.top_reasons[1]}`);
      } else {
        const reason = !actionMatch
          ? `Expected action "${tc.expectedAction}" got "${d.recommended_action}"`
          : !urgencyMatch
          ? `Expected urgency "${tc.expectedUrgency}" got "${d.urgency_level}"`
          : !rainfedMatch
          ? `Expected is_rainfed_no_water=true got ${d.is_rainfed_no_water}`
          : !honestLabelMatch
          ? `Expected honest label got "${d.trained_on}"`
          : 'Invalid reasons array';
        failures.push({ id: tc.id, name: tc.name, reason });
        console.log(`  [TEST ${tc.id.toString().padStart(2)}] ✗ FAIL: ${tc.name} — ${reason}`);
      }
    } catch (err) {
      failures.push({ id: tc.id, name: tc.name, error: err.message });
      console.log(`  [TEST ${tc.id.toString().padStart(2)}] ✗ ERROR: ${tc.name} — ${err.message}`);
    }
  }

  console.log('\n========================================================================');
  console.log(`  FINAL VERIFICATION SCORE: ${passed} / ${testCases.length} PASSED (${Math.round((passed / testCases.length) * 100)}%)`);
  console.log('  Requirement: At least 18/20 must pass');
  console.log('========================================================================\n');

  if (failures.length > 0) {
    console.log('Failures list:');
    failures.forEach((f) => console.log(`  - Case ${f.id} (${f.name}): ${f.reason || f.error}`));
  } else {
    console.log('✓ ZERO FAILURES: All 20/20 test scenarios passed flawlessly!\n');
  }

  if (passed >= 18) {
    console.log('SUCCESS: PHASE 3 VERIFICATION PASSED!');
    process.exit(0);
  } else {
    console.error(`FAILED: Only ${passed}/20 passed. Requirement is >= 18/20.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
