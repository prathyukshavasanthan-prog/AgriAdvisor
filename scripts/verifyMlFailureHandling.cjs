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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const phone = '+919876543210';
  const loginRes = await request('http://localhost:5900/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ phone_number: phone, password: 'password123' }));

  const token = loginRes.body.token;

  // Get first farm ID
  const listRes = await request('http://localhost:5900/api/farms', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const farmId = listRes.body.data[0]._id;

  console.log(`Testing recommendation endpoint for farm ${farmId} with ML service STOPPED...`);

  // Call recommendation endpoint while ML is stopped
  const recRes = await request(`http://localhost:5900/api/recommendations/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Response Status:', recRes.status);
  console.log('Response Body:', recRes.body);

  if (recRes.body.available === false && recRes.body.messageKey === 'ai_insights_unavailable') {
    console.log('\n[PASS] Verified neutral unavailable state when ML microservice is offline.');
    console.log('[PASS] Absolutely NO hardcoded/rule-based fallback was applied.');
  } else {
    console.error('\n[FAIL] Expected available: false with messageKey: ai_insights_unavailable');
    process.exit(1);
  }
}

run().catch(console.error);
