const http = require('http');

const API_BASE_URL = 'http://127.0.0.1:5900';

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
    if (body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function seedDemoOutbreaks() {
  console.log('--- SEEDING HONEST DEMO OUTBREAK REPORTS (PART 5) ---');

  // Authenticate user
  let loginRes = await request(`${API_BASE_URL}/api/auth/login`, { method: 'POST' }, JSON.stringify({
    phone_number: '+919876543210',
    password: 'password123',
  }));

  let token = loginRes.data?.token;
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
    console.error('Failed to obtain auth token');
    process.exit(1);
  }

  // Get user's farms
  const farmsRes = await request(`${API_BASE_URL}/api/farms`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const farms = farmsRes.data?.data || [];
  if (farms.length === 0) {
    console.log('No farms found. Creating a sample farm first...');
    const farmCreate = await request(`${API_BASE_URL}/api/farms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      name: 'Kaveri Green Valley (Bangalore)',
      latitude: 12.9716,
      longitude: 77.5946,
      area: 4.5,
      soil_type: 'red'
    }));

    const farmId = farmCreate.data?.data?._id;
    // Add tomato crop
    await request(`${API_BASE_URL}/api/farms/${farmId}/crops`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, JSON.stringify({
      crop_type: 'tomato',
      sowing_date: new Date().toISOString(),
      status: 'growing'
    }));

    farms.push({ _id: farmId, name: 'Kaveri Green Valley (Bangalore)' });
  }

  const targetFarm = farms[0];
  console.log(`Seeding demo outbreaks around farm: "${targetFarm.name}" (ID: ${targetFarm._id})`);

  const seedRes = await request(`${API_BASE_URL}/api/outbreaks/seed-demo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, JSON.stringify({
    farmId: targetFarm._id
  }));

  if (seedRes.ok) {
    console.log(`✓ Successfully seeded ${seedRes.data?.count} demo outbreak reports!`);
    seedRes.data?.data?.forEach((d, idx) => {
      console.log(`  [Demo ${idx + 1}] Crop: ${d.cropType} | Concern: ${d.concern} | Coords: [${d.location.coordinates.join(', ')}] | isDemo: ${d.isDemo}`);
    });
  } else {
    console.error('Failed to seed outbreaks:', seedRes.data);
  }
}

seedDemoOutbreaks().catch(console.error);
