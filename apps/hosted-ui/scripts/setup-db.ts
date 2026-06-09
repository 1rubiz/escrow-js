/**
 * Database Setup Script
 * 
 * Initializes the PostgreSQL database with the required schema.
 * Run with: npx tsx scripts/setup-db.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, healthCheck, closePool } from '../lib/db/client';

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  // Check database connection
  console.log('1. Checking database connection...');
  const isHealthy = await healthCheck();
  
  if (!isHealthy) {
    console.error('❌ Database connection failed. Please check your DATABASE_URL.');
    process.exit(1);
  }
  console.log('✅ Database connection successful\n');

  // Read and execute schema
  console.log('2. Creating database schema...');
  try {
    const schemaPath = join(__dirname, '../lib/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      await query(statement);
    }
    
    console.log('✅ Schema created successfully\n');
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    await closePool();
    process.exit(1);
  }

  // Verify tables were created
  console.log('3. Verifying tables...');
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('✅ Tables created:', tables.join(', '));
    console.log();
  } catch (error) {
    console.error('❌ Table verification failed:', error);
  }

  // Close connection
  await closePool();
  console.log('✅ Database setup complete!\n');
}

// Run setup
setupDatabase().catch((error) => {
  console.error('Fatal error during setup:', error);
  process.exit(1);
});

// Made with Bob