// Script to fix database schema to match Prisma schema
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL is required!');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function fixSchema() {
    const client = await pool.connect();

    try {
        console.log('🔧 Fixing database schema...');

        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, '../prisma/migrations/sync_seller_profiles_schema.sql'),
            'utf8'
        );

        // Execute the migration
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('COMMIT');

        console.log('✅ Database schema fixed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

fixSchema()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to fix schema:', error);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
