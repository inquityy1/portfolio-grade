import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;
    private isConnected = false;
    private readonly logger = new Logger(RedisService.name);

    constructor() {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = new Redis(url, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            this.logger.log('Connected to Redis');
        });

        this.client.on('error', (err) => {
            this.isConnected = false;
            this.logger.warn(`Redis connection error: ${err.message}`);
        });

        this.client.on('close', () => {
            this.isConnected = false;
            this.logger.warn('Redis connection closed');
        });
    }

    getClient() {
        return this.client;
    }

    async get(key: string) {
        if (!this.isConnected) {
            this.logger.debug('Redis not connected, skipping get operation');
            return null;
        }
        try {
            const v = await this.client.get(key);
            return v ? JSON.parse(v) : null;
        } catch (error) {
            this.logger.warn(`Redis get error: ${error.message}`);
            return null;
        }
    }

    async set(key: string, value: unknown, ttlSeconds: number) {
        if (!this.isConnected) {
            this.logger.debug('Redis not connected, skipping set operation');
            return;
        }
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            this.logger.warn(`Redis set error: ${error.message}`);
        }
    }

    async del(key: string) {
        if (!this.isConnected) {
            this.logger.debug('Redis not connected, skipping del operation');
            return;
        }
        try {
            await this.client.del(key);
        } catch (error) {
            this.logger.warn(`Redis del error: ${error.message}`);
        }
    }

    /** Delete many keys by prefix using SCAN (non-blocking) */
    async delByPrefix(prefix: string) {
        if (!this.isConnected) {
            this.logger.debug('Redis not connected, skipping delByPrefix operation');
            return;
        }
        try {
            const stream = this.client.scanStream({ match: `${prefix}*`, count: 500 });
            const pipeline = this.client.pipeline();
            let batch = 0;

            return new Promise<void>((resolve, reject) => {
                stream.on('data', (keys: string[]) => {
                    for (const k of keys) {
                        pipeline.del(k);
                        batch++;
                    }
                });
                stream.on('end', async () => {
                    if (batch > 0) await pipeline.exec();
                    resolve();
                });
                stream.on('error', (error) => {
                    this.logger.warn(`Redis delByPrefix error: ${error.message}`);
                    resolve(); // Don't reject, just resolve to continue
                });
            });
        } catch (error) {
            this.logger.warn(`Redis delByPrefix error: ${error.message}`);
        }
    }

    async onModuleDestroy() {
        await this.client.quit();
    }
}