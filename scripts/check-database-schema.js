// Script to check database schema and identify missing columns
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is required!');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking database schema...\n');

    // Check if supplier_profiles table exists
    const supplierProfilesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'supplier_profiles'
      );
    `);
    console.log('✅ supplier_profiles table exists:', supplierProfilesCheck.rows[0].exists);

    // Check if profiles table exists (old name)
    const profilesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profiles'
      );
    `);
    console.log('⚠️  profiles table exists (old name):', profilesCheck.rows[0].exists);

    // Check profile_capabilities table structure
    const profileCapabilitiesColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profile_capabilities'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 profile_capabilities columns:');
    profileCapabilitiesColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check if supplier_profile_id exists
    const hasSupplierProfileId = profileCapabilitiesColumns.rows.some(
      col => col.column_name === 'supplier_profile_id'
    );
    const hasProfileId = profileCapabilitiesColumns.rows.some(
      col => col.column_name === 'profile_id'
    );

    console.log('\n🔑 Foreign Key Column Check:');
    console.log('   supplier_profile_id exists:', hasSupplierProfileId);
    console.log('   profile_id exists (old):', hasProfileId);

    if (hasProfileId && !hasSupplierProfileId) {
      console.log('\n❌ PROBLEM FOUND: profile_capabilities has "profile_id" but needs "supplier_profile_id"');
      console.log('   Run the migration script to fix this!');
    }

    // Check supplier_profiles columns
    if (supplierProfilesCheck.rows[0].exists) {
      const supplierProfilesColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'supplier_profiles'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 supplier_profiles columns:');
      const requiredColumns = [
        'first_name', 'last_name', 'email',
        'capabilities', 'verified', 'searchable',
        'onboarding_method', 'last_verified_at',
        'rfq_email', 'preferred_contact_method',
        'lead_time_min_days', 'lead_time_max_days',
      ];

      const existingColumns = supplierProfilesColumns.rows.map(col => col.column_name);
      requiredColumns.forEach(col => {
        const exists = existingColumns.includes(col);
        const status = exists ? '✅' : '❌ MISSING';
        console.log(`   ${status} ${col}`);
      });
    }

    // Check foreign key constraints
    const foreignKeys = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'profile_capabilities';
    `);

    console.log('\n🔗 Foreign Key Constraints on profile_capabilities:');
    foreignKeys.rows.forEach(fk => {
      console.log(`   ${fk.constraint_name}: ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

checkSchema()
  .then(() => {
    console.log('\n✨ Schema check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to check schema:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
