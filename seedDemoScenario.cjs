/**
 * AgriAdvisor Demo Scenario Seed Script (npm run seed:demo)
 * 
 * Creates a standard demo farmer account with 3 farms in different states:
 * 1. Kaveri Green Valley (Bangalore, Karnataka) — Healthy state (Optimal on map)
 * 2. Malwa Golden Fields (Indore, Madhya Pradesh) — Needing attention (Warning on map)
 * 3. Punjab Agro Farms (Jalandhar, Punjab) — Critical state (Critical on map, 2+ concerning streak)
 * 
 * Sets crops at different growth stages, realistic health logs, and honest demo outbreak reports (isDemo: true).
 */

const http = require('http');

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
    if (body) req.write(body);
    req.end();
  });
}

async function seedDemo() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — SEEDING LIVE DEMO SCENARIO (3 FARMS + HEALTH + OUTBREAKS)');
  console.log('========================================================================\n');

  const startTime = Date.now();

  // 1. Authenticate or Register Demo Farmer Account
  console.log('[1/5] Authenticating Demo Cultivator (Ramesh Patel / +919876543210)...');
  let authRes = await request(`${API_BASE_URL}/api/auth/login`, { method: 'POST' }, JSON.stringify({
    phone_number: '+919876543210',
    password: 'password123',
  }));

  let token = authRes.data?.token;
  if (!token) {
    const regRes = await request(`${API_BASE_URL}/api/auth/register`, { method: 'POST' }, JSON.stringify({
      name: 'Ramesh Patel',
      phone_number: '+919876543210',
      password: 'password123',
      language_preference: 'en',
    }));
    token = regRes.data?.token;
  }

  if (!token) {
    throw new Error('Failed to obtain auth token for demo farmer account.');
  }
  console.log('✓ Cultivator authenticated successfully.\n');

  // 2. Fetch existing farms to avoid duplicates
  const existingRes = await request(`${API_BASE_URL}/api/farms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existingFarms = existingRes.data?.data || [];

  // Helper to find or create farm
  async function ensureFarm(spec) {
    let farm = existingFarms.find(f => f.name === spec.name);
    if (farm) {
      console.log(`  • Found existing farm: "${farm.name}" (${farm._id})`);
      return farm;
    }

    const createRes = await request(`${API_BASE_URL}/api/farms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      name: spec.name,
      latitude: spec.latitude,
      longitude: spec.longitude,
      area: spec.area,
      size_unit: spec.size_unit || 'acres',
      land_type: spec.land_type || 'irrigated',
      water_source: spec.water_source || 'borewell',
      irrigation_method: spec.irrigation_method || 'drip',
      soil_type: spec.soil_type,
      soil_n: spec.soil_n,
      soil_p: spec.soil_p,
      soil_k: spec.soil_k,
      soil_ph: spec.soil_ph,
      boundary: spec.boundary_polygon,
    }));

    farm = createRes.data?.data;
    console.log(`  ✓ Created farm: "${farm.name}" (${farm._id}) in ${spec.state}`);
    return farm;
  }

  // 3. Create 3 Farms in Distinct States
  console.log('[2/5] Setting up 3 Demo Farms in Different Agro-Climatic States...');

  // FARM 1: Bangalore, Karnataka (Healthy / Optimal state)
  const farm1 = await ensureFarm({
    name: 'Kaveri Green Valley (Bangalore)',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    area: 4.5,
    size_unit: 'acres',
    land_type: 'irrigated',
    water_source: 'borewell',
    irrigation_method: 'drip',
    soil_type: 'red',
    soil_n: 95,
    soil_p: 45,
    soil_k: 48,
    soil_ph: 6.8,
    boundary_polygon: {
      type: 'Polygon',
      coordinates: [[
        [77.592, 12.970],
        [77.596, 12.970],
        [77.597, 12.973],
        [77.593, 12.973],
        [77.592, 12.970]
      ]]
    }
  });

  // FARM 2: Indore, Madhya Pradesh (Attention Needed / Warning state)
  const farm2 = await ensureFarm({
    name: 'Malwa Golden Fields (Indore)',
    state: 'Madhya Pradesh',
    latitude: 22.7196,
    longitude: 75.8577,
    area: 6.0,
    size_unit: 'acres',
    land_type: 'rainfed',
    water_source: 'open_well',
    irrigation_method: 'furrow',
    soil_type: 'black',
    soil_n: 55,
    soil_p: 28,
    soil_k: 60,
    soil_ph: 7.4,
    boundary_polygon: {
      type: 'Polygon',
      coordinates: [[
        [75.855, 22.718],
        [75.860, 22.718],
        [75.861, 22.721],
        [75.856, 22.721],
        [75.855, 22.718]
      ]]
    }
  });

  // FARM 3: Jalandhar, Punjab (Critical state - 2+ concerning streak)
  const farm3 = await ensureFarm({
    name: 'Punjab Agro Farms (Jalandhar)',
    state: 'Punjab',
    latitude: 31.3260,
    longitude: 75.5762,
    area: 8.5,
    size_unit: 'acres',
    land_type: 'lowland_paddy',
    water_source: 'canal',
    irrigation_method: 'flood',
    soil_type: 'alluvial',
    soil_n: 78,
    soil_p: 35,
    soil_k: 40,
    soil_ph: 7.1,
    boundary_polygon: {
      type: 'Polygon',
      coordinates: [[
        [75.574, 31.324],
        [75.579, 31.324],
        [75.580, 31.328],
        [75.575, 31.328],
        [75.574, 31.324]
      ]]
    }
  });

  // 4. Register Active Crops & Growth Stages
  console.log('\n[3/5] Setting up Active Crops at Different Growth Stages...');

  async function ensureCrop(farmId, cropType, daysAgo) {
    const cropsRes = await request(`${API_BASE_URL}/api/farms/${farmId}/crops`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let crop = (cropsRes.data?.data || []).find(c => c.crop_type === cropType);
    if (!crop) {
      const sowingDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const addRes = await request(`${API_BASE_URL}/api/farms/${farmId}/crops`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }, JSON.stringify({
        crop_type: cropType,
        sowing_date: sowingDate.toISOString(),
        status: 'growing',
      }));
      crop = addRes.data?.data;
      console.log(`  ✓ Registered crop: ${cropType} for farm (${farmId}) sown ${daysAgo} days ago`);
    } else {
      console.log(`  • Found existing crop: ${cropType} for farm (${farmId})`);
    }
    return crop;
  }

  // Farm 1: Tomato (sown 25 days ago -> Vegetative Stage)
  const crop1 = await ensureCrop(farm1._id, 'tomato', 25);
  // Farm 2: Wheat (sown 55 days ago -> Tillering/Jointing Stage)
  const crop2 = await ensureCrop(farm2._id, 'wheat', 55);
  // Farm 3: Cotton (sown 80 days ago -> Flowering & Boll Setting)
  const crop3 = await ensureCrop(farm3._id, 'cotton', 80);

  // 5. Seed Health Logs (One Healthy, One Okay, One Critical 2-streak)
  console.log('\n[4/5] Recording Field Health Logs (Optimal, Warning, Critical Streak)...');

  async function addHealthLog(farmId, cropId, healthStatus, notes, daysAgo = 0) {
    const logDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const logRes = await request(`${API_BASE_URL}/api/farms/${farmId}/crops/${cropId}/health-logs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      health_status: healthStatus,
      check_in_type: 'manual',
      notes,
      date: logDate.toISOString(),
    }));
    return logRes.data;
  }

  if (crop1?._id) {
    await addHealthLog(farm1._id, crop1._id, 'Healthy', 'Vigorous vegetative growth, dark green canopy, zero pests observed.', 1);
    console.log('  ✓ Farm 1 Health Log: Healthy (Optimal status)');
  }

  if (crop2?._id) {
    await addHealthLog(farm2._id, crop2._id, 'Okay', 'Mild tip chlorosis and slight moisture deficit observed.', 2);
    console.log('  ✓ Farm 2 Health Log: Okay (Moderate warning status)');
  }

  if (crop3?._id) {
    await addHealthLog(farm3._id, crop3._id, 'Concerning', 'Early foliar spots and necrotic patches noted on lower leaves.', 3);
    await addHealthLog(farm3._id, crop3._id, 'Concerning', 'Foliar lesions spreading to mid-canopy with visible leaf curling.', 0);
    console.log('  ✓ Farm 3 Health Logs: 2 Consecutive Concerning logs (CRITICAL STREAK ALERT TRIGGERED)');
  }

  // 6. Seed Honest Demo Outbreak Reports
  console.log('\n[5/5] Seeding 6 Honest Demo Disease Outbreak Reports (isDemo: true)...');
  const seedRes = await request(`${API_BASE_URL}/api/outbreaks/seed-demo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, JSON.stringify({ farmId: farm1._id }));

  console.log(`✓ Seeded ${seedRes.data?.count || 6} demo outbreak reports marked isDemo: true.`);

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================================================');
  console.log(`  DEMO SCENARIO SEED COMPLETE IN ${elapsedSec}s!`);
  console.log('  Login credentials:');
  console.log('    Phone Number: +919876543210');
  console.log('    Password:     password123');
  console.log('========================================================================\n');
}

seedDemo().catch(err => {
  console.error('Fatal error in seedDemo:', err);
  process.exit(1);
});
