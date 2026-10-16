import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => {
    if (times > 5) {
      console.warn('[Redis] Max retries reached, pausing reconnect.');
      return null; // Stop retrying after 5 attempts
    }
    return Math.min(times * 500, 2000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('[Redis] Connected to Redis cache service.');
});

redis.on('error', (err) => {
  console.warn('[Redis Warning] Cache connection issue:', err.message);
});

// Attempt initial connect asynchronously without crashing server if redis is starting up
(async () => {
  try {
    await redis.connect();
  } catch (err: any) {
    console.warn('[Redis] Initial connect deferred:', err.message);
  }
})();
