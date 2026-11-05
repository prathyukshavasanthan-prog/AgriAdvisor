import process from 'process';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<'OK' | null>;
  on(event: string, listener: (...args: any[]) => void): this;
  status: string;
  [key: string]: any;
}

class SafeRedisClient implements CacheClient {
  private client: Redis | null = null;
  private isConnected = false;
  public status = 'disconnected';

  constructor(url?: string) {
    if (!url || !url.trim()) {
      console.log('[Redis] REDIS_URL not configured. Running without Redis cache (safe fallback mode).');
      return;
    }

    try {
      this.client = new Redis(url.trim(), {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[Redis] Max reconnect attempts reached, pausing retries.');
            return null;
          }
          return Math.min(times * 500, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.status = 'connected';
        console.log('[Redis] Connected to Redis cache service.');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.status = 'ready';
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.status = 'closed';
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.status = 'error';
        console.warn('[Redis Warning] Cache connection issue:', err.message);
      });

      // Attempt initial connect asynchronously without crashing server if Redis is unreachable
      (async () => {
        try {
          await this.client?.connect();
        } catch (err: any) {
          console.warn('[Redis] Initial connect deferred or failed:', err.message);
        }
      })();
    } catch (err: any) {
      console.warn('[Redis] Failed to initialize Redis client:', err.message);
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK' | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    try {
      return await (this.client as any).set(key, value, ...args);
    } catch {
      return null;
    }
  }

  on(event: string, listener: (...args: any[]) => void): this {
    if (this.client) {
      this.client.on(event as any, listener);
    }
    return this;
  }
}

export const redis = new SafeRedisClient(redisUrl) as unknown as Redis;
