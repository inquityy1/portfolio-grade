import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import IORedisMock from 'ioredis-mock';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | typeof IORedisMock;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const url = process.env.REDIS_URL || 'mock'; // default to mock for your setup

    if (url === 'mock') {
      this.logger.warn('Using in-memory Redis mock (ioredis-mock). Data resets on restart.');
      this.client = new (IORedisMock as any)();
    } else {
      this.client = new Redis(url, {
        lazyConnect: true,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => this.logger.log('Connected to Redis'));
      this.client.on('error', err => this.logger.warn(`Redis connection error: ${err.message}`));
      this.client.on('close', () => this.logger.warn('Redis connection closed'));

      // Try to connect (non-fatal if it fails; you can keep your fail-open try/catch in get/set/del)
      this.client.connect().catch(e => {
        this.logger.warn(`Redis connect() failed (${e.message}); falling back to mock`);
        this.client = new (IORedisMock as any)();
      });
    }
  }

  getClient() {
    return this.client as any;
  }

  async get(key: string) {
    try {
      const v = await (this.client as any).get(key);
      return v ? JSON.parse(v) : null;
    } catch (e: any) {
      this.logger.debug(`Redis GET ${key} failed: ${e.message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number) {
    try {
      await (this.client as any).set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e: any) {
      this.logger.debug(`Redis SET ${key} failed: ${e.message}`);
    }
  }

  async del(key: string) {
    try {
      await (this.client as any).del(key);
    } catch (e: any) {
      this.logger.debug(`Redis DEL ${key} failed: ${e.message}`);
    }
  }

  async delByPrefix(prefix: string) {
    try {
      const scanStream = (this.client as any).scanStream?.bind(this.client);
      if (!scanStream) {
        // ioredis-mock doesn’t implement SCAN fully; do a simple KEYS
        const keys = await (this.client as any).keys(`${prefix}*`);
        if (keys.length) await (this.client as any).del(keys);
        return;
      }
      const stream = scanStream({ match: `${prefix}*`, count: 500 });
      const pipeline = (this.client as any).pipeline?.() ?? (this.client as any).multi?.();
      await new Promise<void>(resolve => {
        stream.on('data', (keys: string[]) => keys.forEach(k => pipeline.del(k)));
        stream.on('end', async () => {
          await pipeline.exec?.();
          resolve();
        });
        stream.on('error', () => resolve());
      });
    } catch (e: any) {
      this.logger.debug(`Redis delByPrefix ${prefix} failed: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await (this.client as any).quit?.();
    } catch {}
  }
}
