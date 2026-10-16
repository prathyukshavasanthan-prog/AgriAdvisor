/**
 * AgriAdvisor Demo Scenario Reset Script (npm run reset:demo)
 * 
 * Cleans existing farms, crops, health logs, and outbreaks for the demo farmer,
 * and re-seeds the pristine 3-farm demo state in under 1 minute.
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

async function resetDemo() {
  console.log('========================================================================');
  console.log('  AGRIADVISOR — RESETTING LIVE DEMO SCENARIO TO CLEAN STATE');
  console.log('========================================================================\n');

  const startTime = Date.now();

  // 1. Authenticate Demo Farmer
  let authRes = await request(`${API_BASE_URL}/api/auth/login`, { method: 'POST' }, JSON.stringify({
    phone_number: '+919876543210',
    password: 'password123',
  }));

  const token = authRes.data?.token;
  if (!token) {
    console.log('Demo user does not exist yet. Proceeding directly to seed...');
  } else {
    // 2. Fetch all current farms for the demo farmer and delete them
    const farmsRes = await request(`${API_BASE_URL}/api/farms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const farms = farmsRes.data?.data || [];
    console.log(`[Reset] Found ${farms.length} existing plots for demo cultivator. Purging...`);

    for (const f of farms) {
      await request(`${API_BASE_URL}/api/farms/${f._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`  - Purged farm: "${f.name}" (${f._id})`);
    }
    console.log('✓ All existing demo plots purged cleanly.\n');
  }

  // 3. Re-seed clean state by requiring seedDemoScenario
  console.log('[Reset] Re-seeding pristine 3-farm demo scenario...');
  require('./seedDemoScenario.cjs');
}

resetDemo().catch(err => {
  console.error('Fatal error in resetDemo:', err);
  process.exit(1);
});
