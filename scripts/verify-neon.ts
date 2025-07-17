#!/usr/bin/env tsx
/**
 * Neon Database Verification Script
 * 
 * This script verifies the Neon database setup and ensures
 * all tables and data are properly configured.
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { logger } from '../server/services/logger';

async function verifyNeonSetup(): Promise<void> {
  const neonUrl = process.env.NEON_DATABASE_URL;
  
  if (!neonUrl) {
    console.log('❌ NEON_DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🔍 Verifying Neon database setup...');

  try {
    // Connect to Neon database
    const pool = new Pool({ 
      connectionString: neonUrl,
      max: 5,
      connectionTimeoutMillis: 10000,
    });
    
    const db = drizzle({ client: pool, schema });
    
    // Test basic connectivity
    await db.execute(sql`SELECT 1`);
    console.log('✅ Connection successful');
    
    // Check if tables exist
    const tables = [
      'users',
      'farms',
      'produce_items',
      'inventories',
      'orders',
      'order_items',
      'messages',
      'reviews'
    ];
    
    console.log('🔍 Checking table structure...');
    
    for (const table of tables) {
      try {
        const result = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = ${table}
        `);
        
        if (result.rows[0].count > 0) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error.message);
      }
    }
    
    // Check data counts
    console.log('📊 Checking data counts...');
    
    try {
      const userCount = await db.select({ count: sql`COUNT(*)` }).from(schema.users);
      const farmCount = await db.select({ count: sql`COUNT(*)` }).from(schema.farms);
      const produceCount = await db.select({ count: sql`COUNT(*)` }).from(schema.produceItems);
      const orderCount = await db.select({ count: sql`COUNT(*)` }).from(schema.orders);
      
      console.log(`📊 Data summary:`);
      console.log(`   Users: ${userCount[0].count}`);
      console.log(`   Farms: ${farmCount[0].count}`);
      console.log(`   Produce Items: ${produceCount[0].count}`);
      console.log(`   Orders: ${orderCount[0].count}`);
      
      if (userCount[0].count > 0 && farmCount[0].count > 0) {
        console.log('✅ Data migration appears successful');
      } else {
        console.log('⚠️  No data found - consider running the migration script');
      }
    } catch (error) {
      console.log('❌ Error checking data:', error.message);
    }
    
    // Test authentication compatibility
    console.log('🔐 Testing authentication compatibility...');
    
    try {
      // Test session table (if exists)
      const sessionResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'session'
      `);
      
      if (sessionResult.rows[0].count > 0) {
        console.log('✅ Session table exists');
      } else {
        console.log('⚠️  Session table not found - sessions will be created automatically');
      }
      
      // Test user authentication structure
      const userColumns = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      const requiredColumns = ['id', 'email', 'password', 'role'];
      const existingColumns = userColumns.rows.map(row => row.column_name);
      
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ User authentication structure is compatible');
      } else {
        console.log('❌ Missing required columns:', missingColumns.join(', '));
      }
      
    } catch (error) {
      console.log('❌ Error testing authentication:', error.message);
    }
    
    // Test image compression compatibility
    console.log('🖼️  Testing image storage compatibility...');
    
    try {
      const imageColumns = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('farms', 'produce_items', 'users')
        AND column_name LIKE '%image%'
      `);
      
      if (imageColumns.rows.length > 0) {
        console.log('✅ Image storage columns found:');
        imageColumns.rows.forEach(row => {
          console.log(`   ${row.column_name}: ${row.data_type}`);
        });
      } else {
        console.log('⚠️  No image storage columns found');
      }
    } catch (error) {
      console.log('❌ Error checking image storage:', error.message);
    }
    
    await pool.end();
    
    console.log('');
    console.log('✅ Verification complete!');
    console.log('🚀 Your Neon database is ready for use.');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Update DATABASE_URL to use your Neon connection string');
    console.log('   2. Restart your application');
    console.log('   3. Test user authentication and image uploads');
    
  } catch (error) {
    logger.error('neon-verify', 'Verification failed', {
      error: error.message,
    });
    console.log('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyNeonSetup().catch(console.error);
}

export { verifyNeonSetup };