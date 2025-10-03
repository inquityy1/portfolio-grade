import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../infra/services/prisma.service';
import { RedisService } from '../infra/services/redis.service';
import { AppModule } from '../app/app.module';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

// Use separate test database for integration tests
// You can override this by setting TEST_DATABASE_URL environment variable
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL?.replace(/\/[^\/]+$/, '/portfolio_grade_test') ||
    'postgresql://postgres@localhost:5432/portfolio_grade_test';

export interface IntegrationTestContext {
    app: INestApplication;
    prisma: PrismaService;
    redis: RedisService;
    httpServer: any;
}

export interface TestData {
    user: {
        id: string;
        email: string;
        password: string;
        name: string;
    };
    organization: {
        id: string;
        name: string;
    };
    token: string;
}

export class IntegrationTestSetup {
    static async createTestApp(): Promise<IntegrationTestContext> {
        // Set test database URL for this test run
        process.env.DATABASE_URL = TEST_DATABASE_URL;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        const app = moduleFixture.createNestApplication();

        // Configure app for testing (same as main.ts)
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        app.enableCors();

        await app.init();

        const prisma = app.get<PrismaService>(PrismaService);
        const redis = app.get<RedisService>(RedisService);
        const httpServer = app.getHttpServer();

        return {
            app,
            prisma,
            redis,
            httpServer,
        };
    }

    static async cleanupTestData(context: IntegrationTestContext): Promise<void> {
        const { prisma, redis } = context;

        try {
            // Clean up ALL data from test database (since it's separate from production)
            console.log('🧹 Cleaning up test database...');

            // Delete in reverse order of dependencies
            await prisma.submission.deleteMany();
            await prisma.comment.deleteMany();
            await prisma.field.deleteMany();
            await prisma.form.deleteMany();
            await prisma.tag.deleteMany();
            await prisma.tagAggregate.deleteMany();
            await prisma.post.deleteMany();
            await prisma.auditLog.deleteMany();
            await prisma.membership.deleteMany();
            await prisma.outbox.deleteMany();
            await prisma.user.deleteMany();
            await prisma.organization.deleteMany();

            // Clean Redis
            await redis.delByPrefix('test:');

        } catch (error) {
            console.error('Cleanup error:', error);
            // Don't fail tests due to cleanup issues
        }
    }

    static async seedTestData(context: IntegrationTestContext): Promise<TestData> {
        const { prisma, app } = context;

        // Generate unique IDs for this test run to avoid conflicts
        const timestamp = Date.now();
        const userId = `test-user-${timestamp}`;
        const orgId = `test-org-${timestamp}`;
        const userEmail = `testuser${timestamp}@example.com`;
        const hashedPassword = await bcrypt.hash('testpassword123', 10);

        // Create test organization
        const organization = await prisma.organization.create({
            data: {
                id: orgId,
                name: `Test Organization ${timestamp}`,
            },
        });

        // Create test user
        const user = await prisma.user.create({
            data: {
                id: userId,
                email: userEmail,
                password: hashedPassword,
                name: `Test User ${timestamp}`,
            },
        });

        // Create membership
        await prisma.membership.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                role: 'OrgAdmin',
            },
        });

        // Generate proper JWT token using the app's JwtService
        const jwtService = app.get<JwtService>(JwtService);
        const payload = {
            sub: user.id,
            email: user.email,
            role: 'OrgAdmin',
            orgId: organization.id
        };
        const token = jwtService.sign(payload);

        return {
            user: {
                id: user.id,
                email: user.email,
                password: 'testpassword123',
                name: user.name,
            },
            organization: {
                id: organization.id,
                name: organization.name,
            },
            token,
        };
    }
}
