#!/usr/bin/env tsx
/**
 * Test Neon Database Connection
 * 
 * This script tests the connection to both current and Neon databases
 * to ensure proper configuration before migration.
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

interface ConnectionTestResult {
  name: string;
  url: string;
  connected: boolean;
  error?: string;
  version?: string;
  tableCount?: number;
  userCount?: number;
}

async function testConnection(name: string, connectionString: string): Promise<ConnectionTestResult> {
  console.log(`🔍 Testing ${name} connection...`);
  
  const result: ConnectionTestResult = {
    name,
    url: connectionString.replace(/:[^:@]+@/, ':****@'), // Hide password
    connected: false,
  };
  
  try {
    const pool = new Pool({ 
      connectionString,
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    
    const db = drizzle({ client: pool, schema });
    
    // Test basic connectivity
    const versionResult = await db.execute(sql`SELECT version()`);
    result.version = versionResult.rows[0]?.version || 'Unknown';
    result.connected = true;
    
    // Count tables
    const tableResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    result.tableCount = parseInt(tableResult.rows[0]?.count || '0');
    
    // Count users if table exists
    try {
      const userResult = await db.select({ count: sql`COUNT(*)` }).from(schema.users);
      result.userCount = parseInt(userResult[0]?.count || '0');
    } catch (error) {
      // Table might not exist yet
      result.userCount = 0;
    }
    
    await pool.end();
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

async function main() {
  console.log('🚀 FarmDirect Database Connection Test');
  console.log('=====================================');
  
  const currentDb = process.env.DATABASE_URL;
  const neonDb = process.env.NEON_DATABASE_URL;
  
  if (!currentDb) {
    console.log('❌ DATABASE_URL not set');
    return;
  }
  
  if (!neonDb) {
    console.log('❌ NEON_DATABASE_URL not set');
    console.log('📝 Please set your Neon database URL in environment variables');
    return;
  }
  
  console.log('');
  
  // Test current database
  const currentResult = await testConnection('Current Database', currentDb);
  
  // Test Neon database
  const neonResult = await testConnection('Neon Database', neonDb);
  
  // Display results
  console.log('\n📊 Connection Test Results');
  console.log('==========================');
  
  const results = [currentResult, neonResult];
  
  for (const result of results) {
    console.log(`\n${result.name}:`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Connected: ${result.connected ? '✅' : '❌'}`);
    
    if (result.connected) {
      console.log(`  Version: ${result.version}`);
      console.log(`  Tables: ${result.tableCount}`);
      console.log(`  Users: ${result.userCount}`);
    } else {
      console.log(`  Error: ${result.error}`);
    }
  }
  
  console.log('\n🔧 Migration Readiness Check');
  console.log('============================');
  
  if (currentResult.connected && neonResult.connected) {
    console.log('✅ Both databases are accessible');
    console.log('✅ Ready for migration');
    
    if (currentResult.userCount > 0 && neonResult.userCount === 0) {
      console.log('📊 Data migration needed');
      console.log('🚀 Run: npm run neon:setup');
    } else if (neonResult.userCount > 0) {
      console.log('📊 Neon database already has data');
      console.log('⚠️  Consider backup before migration');
    } else {
      console.log('📊 No data found in either database');
      console.log('🌱 Consider running: npm run seed');
    }
  } else {
    console.log('❌ Connection issues detected');
    
    if (!currentResult.connected) {
      console.log('🔧 Fix current database connection first');
    }
    
    if (!neonResult.connected) {
      console.log('🔧 Fix Neon database connection');
      console.log('💡 Check your NEON_DATABASE_URL format');
    }
  }
  
  console.log('\n📚 Next Steps:');
  console.log('  1. Ensure both databases are connected');
  console.log('  2. Run: npm run neon:setup');
  console.log('  3. Update DATABASE_URL to use Neon');
  console.log('  4. Restart your application');
}

if (require.main === module) {
  main().catch(console.error);
}

export { testConnection, type ConnectionTestResult };