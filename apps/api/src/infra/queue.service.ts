import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, QueueEvents, JobsOptions, Processor } from 'bullmq';
import IORedis from 'ioredis';

type QueueMap = Map<string, Queue>;
type WorkerMap = Map<string, Worker>;

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);
    private connection: IORedis | null = null;
    private queues: QueueMap = new Map();
    private workers: WorkerMap = new Map();

    constructor() {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';

        // Skip Redis connection if URL contains 'mock' (for testing)
        if (url.includes('mock')) {
            this.logger.warn('Mock Redis URL detected; queueing disabled');
            this.connection = null;
            return;
        }
        try {
            this.connection = new IORedis(url, {
                lazyConnect: true,
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
            });

            this.connection.on('error', (e) => {
                this.logger.warn(`Redis error: ${e.message}`);
            });

            // Try to connect, but don't crash app if it fails
            this.connection.connect().then(
                () => this.logger.log('BullMQ connected to Redis'),
                () => {
                    this.logger.warn('BullMQ could not connect to Redis; queueing disabled');
                    this.connection = null;
                },
            );
        } catch (e: any) {
            this.logger.warn(`BullMQ init failed: ${e.message}`);
            this.connection = null;
        }
    }

    getQueue(name: string): Queue | null {
        if (!this.connection) return null;
        if (!this.queues.has(name)) {
            const q = new Queue(name, { connection: this.connection });
            this.queues.set(name, q);
            // optional: queue events
            new QueueEvents(name, { connection: this.connection }).on('failed', (ev) =>
                this.logger.warn(`[${name}] job ${ev.jobId} failed`),
            );
        }
        return this.queues.get(name)!;
    }

    registerWorker(name: string, processor: Processor, concurrency = 2): boolean {
        if (!this.connection) return false;
        if (this.workers.has(name)) return true;
        const w = new Worker(name, processor, {
            concurrency,
            connection: this.connection,
        });
        w.on('error', (e) => this.logger.warn(`[${name}] worker error: ${e.message}`));
        this.workers.set(name, w);
        this.logger.log(`Worker registered: ${name}`);
        return true;
    }

    async add<T = any>(queueName: string, jobName: string, payload: T, opts?: JobsOptions) {
        const q = this.getQueue(queueName);
        if (!q) {
            this.logger.debug(`Queue "${queueName}" unavailable (no Redis). Skipping enqueue of ${jobName}.`);
            return null;
        }
        return q.add(jobName, payload, opts);
    }
}