#!/usr/bin/env tsx
/**
 * Generate Database Migrations Script
 * 
 * This script generates fresh migrations for the Neon database
 * ensuring all schema changes are properly captured.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../server/services/logger';

const execAsync = promisify(exec);

async function generateMigrations(): Promise<void> {
  logger.info('migrations', 'Generating fresh migrations for Neon database');
  
  try {
    // Generate migrations using drizzle-kit
    const { stdout, stderr } = await execAsync('npx drizzle-kit generate');
    
    if (stderr) {
      logger.warn('migrations', 'Migration generation warnings', {
        warnings: stderr,
      });
    }
    
    logger.info('migrations', 'Migrations generated successfully', {
      output: stdout,
    });
    
    console.log('✅ Migrations generated successfully!');
    console.log('📁 Check ./migrations folder for generated files');
    
  } catch (error) {
    logger.error('migrations', 'Migration generation failed', {
      error: error.message,
    });
    console.log('❌ Migration generation failed:', error.message);
    throw error;
  }
}

async function pushSchema(): Promise<void> {
  logger.info('migrations', 'Pushing schema to database');
  
  try {
    // Push schema using drizzle-kit
    const { stdout, stderr } = await execAsync('npx drizzle-kit push');
    
    if (stderr) {
      logger.warn('migrations', 'Schema push warnings', {
        warnings: stderr,
      });
    }
    
    logger.info('migrations', 'Schema pushed successfully', {
      output: stdout,
    });
    
    console.log('✅ Schema pushed successfully!');
    
  } catch (error) {
    logger.error('migrations', 'Schema push failed', {
      error: error.message,
    });
    console.log('❌ Schema push failed:', error.message);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'generate':
        await generateMigrations();
        break;
      case 'push':
        await pushSchema();
        break;
      case 'all':
        await generateMigrations();
        await pushSchema();
        break;
      default:
        console.log('Usage: npm run migrations [generate|push|all]');
        console.log('  generate - Generate migration files');
        console.log('  push     - Push schema to database');
        console.log('  all      - Generate and push');
        break;
    }
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}