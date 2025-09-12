import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OutboxService } from './outbox.service';

@Injectable()
export class DispatcherService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DispatcherService.name);
    private timer?: NodeJS.Timeout;
    private readonly intervalMs = Number(process.env.OUTBOX_POLL_MS ?? 1500);

    constructor(private readonly outbox: OutboxService) { }

    onModuleInit() {
        // start lightweight poller
        this.timer = setInterval(() => this.tick().catch(() => { }), this.intervalMs);
        this.logger.log(`Outbox dispatcher started (poll ${this.intervalMs} ms)`);
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    private async tick() {
        const claims = await this.outbox.claim(25);
        for (const c of claims) {
            const row = await this.outbox.load(c.id);
            if (!row) continue;
            try {
                await this.handle(row.topic, row.payload);
                await this.outbox.markDone(row.id);
            } catch (e: any) {
                this.logger.warn(`handler error for ${row.topic}: ${e.message}`);
                await this.outbox.markError(row.id);
            }
        }
    }

    /** Add topic handlers here (simulate events / future BullMQ jobs) */
    private async handle(topic: string, payload: any) {
        switch (topic) {
            case 'post.created':
                // e.g., queue preview image generation (simulate)
                this.logger.log(`generate preview image for post ${payload.id}`);
                return;
            case 'post.updated':
                this.logger.log(`post updated: ${payload.id}`);
                return;
            case 'post.deleted':
                this.logger.log(`post deleted: ${payload.id}`);
                return;
            case 'tag.created':
                this.logger.log(`tag created: ${payload.name} (${payload.id})`);
                return;
            case 'tag.updated':
                this.logger.log(`tag updated: ${payload.name} (${payload.id})`);
                return;
            case 'tag.deleted':
                this.logger.log(`tag deleted: ${payload.id}`);
                return;
            case 'user.created':
                this.logger.log(`user created: ${payload.name} (${payload.id})`);
                return;
            case 'user.updated':
                this.logger.log(`user updated: ${payload.name} (${payload.id})`);
                return;
            case 'user.deleted':
                this.logger.log(`user deleted: ${payload.id}`);
                return;
            case 'tags.nightly.stats':
                this.logger.log(`compute nightly tag stats for org ${payload.orgId}`);
                return;
            case 'form.submitted':
                this.logger.log(`process submission ${payload.submissionId}`);
                return;
            case 'form.updated':
                this.logger.log(`form updated: ${payload.id}`);
                return;
            case 'form.deleted':
                this.logger.log(`form deleted: ${payload.id}`);
                return;
            case 'form.created':
                this.logger.log(`form created: ${payload.id}`);
                return;
            case 'field.created':
                this.logger.log(`field created: ${payload.id} for org ${payload.orgId}`);
                return;
            case 'field.updated':
                this.logger.log(`field updated: ${payload.id} for org ${payload.orgId}`);
                return;
            case 'field.deleted':
                this.logger.log(`field deleted: ${payload.id} for org ${payload.orgId}`);
                return;
            case 'submission.created':
                this.logger.log(`submission created: ${payload.id} for form ${payload.formId}`);
                return;
            case 'comment.created':
                this.logger.log(`comment created: ${payload.id} for post ${payload.postId}`);
                return;
            case 'comment.updated':
                this.logger.log(`comment updated: ${payload.id}`);
                return;
            case 'comment.deleted':
                this.logger.log(`comment deleted: ${payload.id}`);
                return;
            case 'comment.restored':
                this.logger.log(`comment restored: ${payload.id}`);
                return;

            default:
                this.logger.debug(`no handler for ${topic}`);
        }
    }
}