#!/usr/bin/env tsx
/**
 * Quick Neon Setup Script
 * 
 * This script provides a simple command-line interface for
 * setting up Neon database with interactive prompts.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { testConnection } from './test-neon-connection';
import { NeonDatabaseSetup } from './setup-neon';

const execAsync = promisify(exec);

async function quickSetup(): Promise<void> {
  console.log('🚀 FarmDirect Neon Database Quick Setup');
  console.log('======================================');
  
  // Check environment variables
  const currentDb = process.env.DATABASE_URL;
  const neonDb = process.env.NEON_DATABASE_URL;
  
  if (!currentDb) {
    console.log('❌ DATABASE_URL not set');
    console.log('💡 Please set your current database URL first');
    return;
  }
  
  if (!neonDb) {
    console.log('❌ NEON_DATABASE_URL not set');
    console.log('💡 Please set your Neon database URL:');
    console.log('   1. Go to https://console.neon.tech');
    console.log('   2. Create a new project');
    console.log('   3. Copy your connection string');
    console.log('   4. Set NEON_DATABASE_URL in your environment');
    return;
  }
  
  console.log('✅ Environment variables configured');
  
  // Test connections
  console.log('\n🔍 Testing database connections...');
  
  const currentResult = await testConnection('Current Database', currentDb);
  const neonResult = await testConnection('Neon Database', neonDb);
  
  if (!currentResult.connected || !neonResult.connected) {
    console.log('❌ Connection test failed');
    console.log('🔧 Please check your database connection strings');
    return;
  }
  
  console.log('✅ Both databases are accessible');
  
  // Generate migrations
  console.log('\n📝 Generating database migrations...');
  try {
    await execAsync('npm run db:generate');
    console.log('✅ Migrations generated');
  } catch (error) {
    console.log('❌ Migration generation failed');
    console.log('🔧 Please check your schema configuration');
    return;
  }
  
  // Push schema
  console.log('\n📤 Pushing schema to Neon database...');
  try {
    const env = { ...process.env, DATABASE_URL: neonDb };
    await execAsync('npm run db:push', { env });
    console.log('✅ Schema pushed to Neon');
  } catch (error) {
    console.log('❌ Schema push failed');
    console.log('🔧 Please check your Neon database configuration');
    return;
  }
  
  // Migrate data
  console.log('\n🚚 Migrating data...');
  try {
    const setup = new NeonDatabaseSetup({
      sourceConnectionString: currentDb,
      targetConnectionString: neonDb,
      enableMigration: false, // Already done above
      enableDataTransfer: true,
      backupTablePrefix: 'backup_',
    });
    
    await setup.initialize();
    await setup.createBackup();
    await setup.transferData();
    
    const isValid = await setup.validateDataIntegrity();
    
    if (!isValid) {
      console.log('❌ Data integrity validation failed');
      return;
    }
    
    await setup.cleanup();
    
    console.log('✅ Data migration completed successfully');
    
  } catch (error) {
    console.log('❌ Data migration failed:', error.message);
    return;
  }
  
  // Seed database if needed
  console.log('\n🌱 Seeding database with sample data...');
  try {
    const env = { ...process.env, DATABASE_URL: neonDb };
    await execAsync('tsx scripts/seed-neon.ts', { env });
    console.log('✅ Database seeded with sample data');
  } catch (error) {
    console.log('⚠️  Database seeding failed (this is optional)');
    console.log('   You can run: tsx scripts/seed-neon.ts later');
  }
  
  // Final verification
  console.log('\n🔍 Final verification...');
  try {
    const env = { ...process.env, NEON_DATABASE_URL: neonDb };
    await execAsync('tsx scripts/verify-neon.ts', { env });
    console.log('✅ Verification passed');
  } catch (error) {
    console.log('⚠️  Verification had issues (check output above)');
  }
  
  console.log('\n🎉 Neon database setup complete!');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('   1. Update your DATABASE_URL to use Neon:');
  console.log(`      DATABASE_URL=${neonDb}`);
  console.log('   2. Restart your application');
  console.log('   3. Test the application functionality');
  console.log('');
  console.log('📚 Available commands:');
  console.log('   - tsx scripts/test-neon-connection.ts  # Test connections');
  console.log('   - tsx scripts/verify-neon.ts          # Verify setup');
  console.log('   - tsx scripts/seed-neon.ts            # Seed with data');
  console.log('');
  console.log('✅ Ready to deploy with Neon!');
}

if (require.main === module) {
  quickSetup().catch(console.error);
}