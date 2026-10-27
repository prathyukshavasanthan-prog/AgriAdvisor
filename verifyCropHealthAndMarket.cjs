const http = require('http');

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

async function run() {
  console.log('===============================================================');
  console.log('AGRIADVISOR MODULE 3: SYSTEMATIC API & DATA VERIFICATION');
  console.log('===============================================================\n');

  // 1. Authenticate test farmer
  console.log('>>> [1] AUTHENTICATING TEST CULTIVATOR');
  let token = null;
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: '+919876543210', password: 'password123' }));

  if (loginRes.status === 200 && loginRes.body?.token) {
    token = loginRes.body.token;
    console.log('  Login successful for phone: +919876543210');
  } else {
    // Register if not exists
    console.log('  Registering new test cultivator...');
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
    console.log('  Registered successfully.');
  }

  if (!token) throw new Error('Failed to acquire JWT auth token.');

  // 2. Fetch or create a test farm with crop
  console.log('\n>>> [2] CHECKING FARMS & CROPS FOR HEALTH LOGGING');
  const farmsRes = await request('http://localhost:5900/api/farms', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  let farm = farmsRes.body?.data?.[0];
  if (!farm) {
    console.log('  Creating a test farm plot...');
    const createFarmRes = await request('http://localhost:5900/api/farms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, JSON.stringify({
      name: 'Green Valley Plot',
      latitude: 28.6139,
      longitude: 77.2090,
      area: 3.5,
      soil_type: 'alluvial',
      soil_n: 88,
      soil_p: 45,
      soil_k: 40,
      soil_ph: 6.8,
      crop: {
        crop_type: 'wheat',
        sowing_date: new Date(Date.now() - 30 * 86400000).toISOString(),
        expected_harvest_date: new Date(Date.now() + 85 * 86400000).toISOString(),
        status: 'growing',
      },
    }));
    farm = createFarmRes.body.data;
  }

  let crop = farm.crops?.[0] || farm.activeCrop;
  if (!crop) {
    console.log('  Creating a crop cycle for the farm...');
    const createCropRes = await request(`http://localhost:5900/api/farms/${farm._id}/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, JSON.stringify({
      crop_type: 'wheat',
      sowing_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      expected_harvest_date: new Date(Date.now() + 85 * 86400000).toISOString(),
      status: 'growing',
    }));
    crop = createCropRes.body.data;
  }

  console.log(`  Target Farm: ${farm.name} (ID: ${farm._id})`);
  console.log(`  Target Crop: ${crop.crop_type} (ID: ${crop._id})`);

  // 3. Test Crop Health Logging
  console.log('\n>>> [3] TESTING CROP HEALTH LOGGING ENDPOINTS');
  
  // Create Log 1: Healthy
  console.log('  Recording Check-in 1: "Healthy"...');
  const log1Res = await request(`http://localhost:5900/api/farms/${farm._id}/crops/${crop._id}/health-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }, JSON.stringify({
    health_status: 'Healthy',
    notes: 'Leaves look vibrant green, no visible pest damage.',
    photo_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600',
  }));

  console.log('  Status Code:', log1Res.status);
  console.log('  Created Log ID:', log1Res.body.data?._id);
  console.log('  Consecutive Concerning Count:', log1Res.body.consecutive_concerning_count);
  console.log('  Has Concerning Alert:', log1Res.body.has_concerning_alert);
  if (log1Res.body.consecutive_concerning_count !== 0) throw new Error('Expected 0 consecutive concerning logs');

  // Create Log 2: Concerning #1
  console.log('\n  Recording Check-in 2: "Concerning" (Streak 1)...');
  const log2Res = await request(`http://localhost:5900/api/farms/${farm._id}/crops/${crop._id}/health-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }, JSON.stringify({
    health_status: 'Concerning',
    notes: 'Observed yellowing at leaf tips and slow growth.',
  }));
  console.log('  Consecutive Concerning Count:', log2Res.body.consecutive_concerning_count);
  console.log('  Has Concerning Alert:', log2Res.body.has_concerning_alert);
  if (log2Res.body.consecutive_concerning_count !== 1 || log2Res.body.has_concerning_alert !== false) {
    throw new Error('Streak 1 should not trigger alert yet');
  }

  // Create Log 3: Concerning #2 -> should trigger alert!
  console.log('\n  Recording Check-in 3: "Concerning" (Streak 2 -> ALERT TRIGGER)...');
  const log3Res = await request(`http://localhost:5900/api/farms/${farm._id}/crops/${crop._id}/health-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }, JSON.stringify({
    health_status: 'Concerning',
    notes: 'Yellowing increased, signs of nitrogen deficiency or moisture stress.',
  }));
  console.log('  Consecutive Concerning Count:', log3Res.body.consecutive_concerning_count);
  console.log('  Has Concerning Alert:', log3Res.body.has_concerning_alert);
  if (log3Res.body.consecutive_concerning_count !== 2 || log3Res.body.has_concerning_alert !== true) {
    throw new Error('Expected alert to be active for 2 consecutive concerning logs');
  }

  // Verify GET history endpoint
  console.log('\n  Fetching Crop Health History...');
  const historyRes = await request(`http://localhost:5900/api/farms/${farm._id}/crops/${crop._id}/health-logs`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`  Fetched ${historyRes.body.count} health log records.`);
  console.log(`  Most recent status: ${historyRes.body.data[0].health_status}`);
  console.log(`  Streak in history: ${historyRes.body.consecutive_concerning_count}`);

  // 4. Verify Overview Health Alert Endpoint
  console.log('\n>>> [4] TESTING OVERVIEW HEALTH ALERT ENDPOINT (/api/health-alerts)');
  const alertsRes = await request('http://localhost:5900/api/health-alerts', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`  Active Health Alerts Count: ${alertsRes.body.count}`);
  const matchingAlert = alertsRes.body.alerts?.find((a) => a.crop_id === crop._id);
  if (!matchingAlert) throw new Error('Matching crop alert was not found in /api/health-alerts');
  console.log('  Alert Details:');
  console.log(`    Crop:     ${matchingAlert.crop_type}`);
  console.log(`    Farm:     ${matchingAlert.farm_name}`);
  console.log(`    Streak:   ${matchingAlert.consecutive_concerning_count} consecutive Concerning logs`);
  console.log(`    Message:  ${matchingAlert.message_key}`);

  // 5. Test Market Trends & Redis Caching
  console.log('\n>>> [5] TESTING REAL MARKET TREND DATA & REDIS CACHING');
  const testCrops = ['wheat', 'rice', 'cotton'];

  for (const cropType of testCrops) {
    console.log(`\n--- Crop: ${cropType.toUpperCase()} ---`);
    // First request: may be cache miss or hit
    const res1 = await request(`http://localhost:5900/api/market/${cropType}`);
    const d1 = res1.body.data;
    console.log(`  Mandi:          ${d1.market}, ${d1.state}`);
    console.log(`  Current Price:  ₹${d1.current_price}/quintal`);
    console.log(`  Trend:          ${d1.trend_direction.toUpperCase()} (${d1.change_pct > 0 ? '+' : ''}${d1.change_pct}%)`);
    console.log(`  High Rise (>10%): ${d1.high_rise ? 'YES (' + d1.selling_note + ')' : 'NO'}`);
    console.log(`  History points: ${d1.history.length} snapshots`);
    console.log(`  Data Source:    ${d1.source} - "${d1.source_label}"`);
    console.log(`  API Status:     ${d1.live_api_status}`);
    console.log(`  First Fetch Cached: ${d1.cached}`);

    // Second request: MUST be cached in Redis
    const res2 = await request(`http://localhost:5900/api/market/${cropType}`);
    const d2 = res2.body.data;
    console.log(`  Second Fetch Cached: ${d2.cached}`);
    if (d2.cached !== true) {
      throw new Error(`Expected Redis cache hit for ${cropType} on second request!`);
    }
  }

  console.log('\n===============================================================');
  console.log('SUCCESS: ALL MODULE 3 API, DATABASE, AND CACHE CHECKS PASSED!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\nFAILURE:', err.message);
  process.exit(1);
});
