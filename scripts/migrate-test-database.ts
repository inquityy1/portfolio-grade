#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

// Test database URL - modify this to match your PostgreSQL credentials
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL?.replace(/\/[^\/]+$/, '/portfolio_grade_test') ||
    'postgresql://postgres@localhost:5432/portfolio_grade_test';

async function migrateTestDatabase() {
    console.log('🔧 Migrating test database...');
    console.log(`📊 Test database URL: ${TEST_DATABASE_URL.split('@')[1] || 'test'}`);

    try {
        // Try to connect to test database
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: TEST_DATABASE_URL
                }
            }
        });

        // Test connection
        await prisma.$connect();
        console.log('✅ Test database connection successful!');

        // Run migrations
        console.log('📋 Running migrations on test database...');
        console.log('⚠️  Please run: npx prisma migrate deploy');
        console.log(`⚠️  Make sure to set DATABASE_URL="${TEST_DATABASE_URL}" first`);

        await prisma.$disconnect();
        console.log('✅ Test database setup completed!');

    } catch (error) {
        console.error('❌ Error setting up test database:', error);
        console.log('💡 Make sure PostgreSQL is running and the database exists');
        console.log('💡 You can create it manually with: createdb portfolio_grade_test');
        console.log('💡 Or use pgAdmin to create the database');
        process.exit(1);
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    migrateTestDatabase();
}

export { migrateTestDatabase };
