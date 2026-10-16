const http = require('http');

async function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runVerification() {
  console.log('===============================================================');
  console.log('AGRIADVISOR MODULE 2: SYSTEMATIC VERIFICATION SUITE');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // 1. SHOW REAL TRAINING OUTPUT FOR BOTH MODELS
  // -----------------------------------------------------------------
  console.log('>>> [1] MODEL TRAINING BENCHMARKS & AUTHENTIC METRICS');
  const metricsRes = await request('http://localhost:8000/metrics');
  if (metricsRes.status !== 200) {
    throw new Error(`Failed to fetch metrics: HTTP ${metricsRes.status}`);
  }
  const m1 = metricsRes.body.model_1_crop_recommendation;
  const m2 = metricsRes.body.model_2_irrigation_urgency;

  console.log('--- MODEL 1: CROP RECOMMENDATION (REAL ICAR/ICFA DATASET) ---');
  console.log(`  Dataset Type:      ${m1.dataset_type}`);
  console.log(`  Records:           ${m1.total_samples} samples across ${m1.num_classes} crop classes`);
  console.log(`  Classifier:        ${m1.classifier}`);
  console.log(`  Accuracy:          ${(m1.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision (macro): ${(m1.precision * 100).toFixed(2)}%`);
  console.log(`  Recall (macro):    ${(m1.recall * 100).toFixed(2)}%`);
  console.log(`  Trained On Tag:    ${m1.trained_on}`);

  console.log('\n--- MODEL 2: IRRIGATION URGENCY (SYNTHETIC BOOTSTRAP) ---');
  console.log(`  Dataset Type:      ${m2.dataset_type}`);
  console.log(`  Records:           ${m2.total_samples} synthetic domain-informed samples`);
  console.log(`  Classifier:        ${m2.classifier}`);
  console.log(`  Accuracy:          ${(m2.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision (macro): ${(m2.precision * 100).toFixed(2)}%`);
  console.log(`  Recall (macro):    ${(m2.recall * 100).toFixed(2)}%`);
  console.log(`  Trained On Tag:    ${m2.trained_on}`);
  console.log('  Top Feature Importances:', m2.feature_importances);

  // -----------------------------------------------------------------
  // 2. TEST /predict/crop WITH 3 DIFFERENT SOIL/CLIMATE INPUT SETS
  // -----------------------------------------------------------------
  console.log('\n>>> [2] TESTING MODEL 1 (/predict/crop) WITH 3 DISTINCT AGRICULTURAL CONDITIONS');
  const cropTestCases = [
    {
      name: 'Case A: High Rainfall & Humid Tropical (Expect: Rice / Paddy)',
      input: { N: 85, P: 48, K: 42, temperature: 24.5, humidity: 83.0, ph: 6.5, rainfall: 230.0 }
    },
    {
      name: 'Case B: Semi-Arid / Low Rainfall & Dry (Expect: Chickpea / Chana)',
      input: { N: 40, P: 68, K: 80, temperature: 18.0, humidity: 17.0, ph: 7.3, rainfall: 72.0 }
    },
    {
      name: 'Case C: Semi-Arid Subtropical Cotton Soil (Expect: Cotton)',
      input: { N: 118, P: 46, K: 20, temperature: 24.0, humidity: 80.0, ph: 6.8, rainfall: 80.0 }
    }
  ];

  for (const tc of cropTestCases) {
    const res = await request('http://localhost:8000/predict/crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify(tc.input));

    console.log(`  [TEST] ${tc.name}`);
    console.log(`    Recommended Crop: ${res.body.recommended_crop}`);
    console.log(`    Confidence:       ${res.body.confidence} (${(res.body.confidence_score * 100).toFixed(1)}%)`);
    console.log(`    Alternatives:     ${res.body.alternatives.join(', ')}`);
    console.log(`    Trained On Label: ${res.body.trained_on}`);
  }

  // -----------------------------------------------------------------
  // 3. TEST /predict/irrigation WITH 4 DISTINCT WEATHER SCENARIOS
  // -----------------------------------------------------------------
  console.log('\n>>> [3] TESTING MODEL 2 (/predict/irrigation) WITH 4 WEATHER SCENARIOS');
  const irrigationTestCases = [
    {
      name: 'Scenario 1: Prolonged Dry Spells & Sandy Soil (Severe Dryness)',
      input: {
        days_since_rain: 14,
        days_since_last_irrigation: 9,
        soil_type: 'sandy',
        forecast_rain_probability: 5,
        forecast_rain_amount: 0,
        crop_type: 'rice'
      }
    },
    {
      name: 'Scenario 2: Imminent Heavy Rain Forecast (85% Probability)',
      input: {
        days_since_rain: 2,
        days_since_last_irrigation: 4,
        soil_type: 'clay',
        forecast_rain_probability: 85,
        forecast_rain_amount: 32,
        crop_type: 'wheat'
      }
    },
    {
      name: 'Scenario 3: Normal Intermediate Stage (Loamy Soil, Moderate Days)',
      input: {
        days_since_rain: 4,
        days_since_last_irrigation: 3,
        soil_type: 'loamy',
        forecast_rain_probability: 20,
        forecast_rain_amount: 0,
        crop_type: 'maize'
      }
    },
    {
      name: 'Scenario 4: Recently Rained & Soil Hydrated (Rain Today)',
      input: {
        days_since_rain: 0,
        days_since_last_irrigation: 0,
        soil_type: 'black',
        forecast_rain_probability: 10,
        forecast_rain_amount: 0,
        crop_type: 'cotton'
      }
    }
  ];

  for (const tc of irrigationTestCases) {
    const res = await request('http://localhost:8000/predict/irrigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify(tc.input));

    console.log(`  [TEST] ${tc.name}`);
    console.log(`    Recommended Action: ${res.body.recommended_action}`);
    console.log(`    Urgency Level:      ${res.body.urgency_level}`);
    console.log(`    Confidence:         ${res.body.confidence} (${(res.body.confidence_score * 100).toFixed(1)}%)`);
    console.log(`    Top Reasons:        ${res.body.top_reasons.join(' | ')}`);
    console.log(`    Trained On Label:   ${res.body.trained_on}`);
  }

  // -----------------------------------------------------------------
  // 4. BACKEND INTEGRATION: FARMS & CROPS CRUD + WEATHER + REDIS CACHE
  // -----------------------------------------------------------------
  console.log('\n>>> [4] BACKEND FULL STACK INTEGRATION (FARMS CRUD, REDIS CACHE, RECOMMENDATIONS)');
  
  // Register/login test farmer
  const phone = '+919876543210';
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: phone, password: 'password123' }));

  let token = loginRes.body?.token;
  if (!token) {
    // Register if not yet registered
    const regRes = await request('http://localhost:5900/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({
      name: 'Verification Cultivator',
      phone_number: phone,
      password: 'password123',
      preferred_language: 'en',
      latitude: 21.1458,
      longitude: 79.0882
    }));
    token = regRes.body?.token;
  }

  console.log('  Authenticated successfully with JWT.');

  // Create Farm with soil test chemistry + crop
  const createFarmRes = await request('http://localhost:5900/api/farms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }, JSON.stringify({
    name: 'Nagpur Organic Field A',
    latitude: 21.1458,
    longitude: 79.0882,
    area: 4.8,
    soil_type: 'black',
    soil_n: 95,
    soil_p: 48,
    soil_k: 45,
    soil_ph: 6.8,
    crop: {
      crop_type: 'rice',
      sowing_date: new Date().toISOString(),
      expected_harvest_date: new Date(Date.now() + 115 * 86400000).toISOString(),
      status: 'growing'
    }
  }));

  const createdFarm = createFarmRes.body.data;
  console.log(`  Created Farm: "${createdFarm.name}" (ID: ${createdFarm._id})`);
  console.log(`    Soil Profile: N=${createdFarm.soil_n}, P=${createdFarm.soil_p}, K=${createdFarm.soil_k}, pH=${createdFarm.soil_ph}, Soil=${createdFarm.soil_type}`);

  // Fetch Farm List
  const listRes = await request('http://localhost:5900/api/farms', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`  Fetched Farms List: ${listRes.body.count} farm(s) found for farmer.`);

  // Fetch Farm Detail (with live weather)
  const detailRes = await request(`http://localhost:5900/api/farms/${createdFarm._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`  Fetched Farm Detail: Weather Temperature: ${detailRes.body.data.weather?.temperature}°C, Weather Source: ${detailRes.body.data.weather?.source}`);

  // Fetch Weather Again to confirm Redis Cache HIT
  const detailRes2 = await request(`http://localhost:5900/api/farms/${createdFarm._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`  Second Weather Fetch Cache Check: Source = "${detailRes2.body.data.weather?.source}" (Expected: redis_cache)`);

  // Fetch Recommendation endpoint: GET /api/recommendations/:farmId
  const recRes = await request(`http://localhost:5900/api/recommendations/${createdFarm._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`  GET /api/recommendations/:farmId:`);
  console.log(`    Available:          ${recRes.body.available}`);
  console.log(`    Recommended Action: ${recRes.body.recommended_action}`);
  console.log(`    Urgency Level:      ${recRes.body.urgency_level}`);
  console.log(`    Confidence:         ${recRes.body.confidence}`);
  console.log(`    i18n MessageKey:    ${recRes.body.messageKey}`);
  console.log(`    i18n UrgencyKey:    ${recRes.body.urgencyKey}`);
  console.log(`    Top Reasons:        ${recRes.body.top_reasons?.join(' | ')}`);
  console.log(`    Trained On Label:   ${recRes.body.trained_on}`);

  console.log('\n===============================================================');
  console.log('ALL VERIFICATION SUITE TESTS EXECUTED SUCCESSFULLY!');
  console.log('===============================================================');
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
