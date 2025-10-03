#!/usr/bin/env ts-node

import { execSync } from 'child_process';

const TEST_DATABASE_URL = 'postgresql://postgres:qqwwee11@localhost:5432/portfolio_grade_test';
const MAIN_DATABASE_URL = 'postgresql://postgres:qqwwee11@localhost:5432/portfolio_grade';

console.log('🔧 Migrating test database schema...');

try {
    // Set DATABASE_URL to test database
    process.env.DATABASE_URL = TEST_DATABASE_URL;

    console.log('📊 Running migrations on test database...');
    execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
    });

    console.log('✅ Test database migration completed!');
    console.log('🧪 You can now run: npm run test:integration');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
} finally {
    // Reset DATABASE_URL to main database
    process.env.DATABASE_URL = MAIN_DATABASE_URL;
}
