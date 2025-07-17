#!/usr/bin/env tsx
/**
 * Neon Database Setup Script
 * 
 * This script sets up the Neon database with proper schema migration
 * and data transfer from the existing PostgreSQL database.
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { logger } from '../server/services/logger';

interface NeonSetupConfig {
  sourceConnectionString: string;
  targetConnectionString: string;
  enableMigration: boolean;
  enableDataTransfer: boolean;
  backupTablePrefix?: string;
}

class NeonDatabaseSetup {
  private sourcePool: Pool;
  private targetPool: Pool;
  private sourceDb: any;
  private targetDb: any;
  private config: NeonSetupConfig;

  constructor(config: NeonSetupConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    logger.info('neon-setup', 'Initializing Neon database setup');

    // Initialize source database connection (current Replit DB)
    this.sourcePool = new Pool({ 
      connectionString: this.config.sourceConnectionString,
      max: 5,
      connectionTimeoutMillis: 10000,
    });
    this.sourceDb = drizzle({ client: this.sourcePool, schema });

    // Initialize target database connection (Neon)
    this.targetPool = new Pool({ 
      connectionString: this.config.targetConnectionString,
      max: 5,
      connectionTimeoutMillis: 10000,
    });
    this.targetDb = drizzle({ client: this.targetPool, schema });

    // Test both connections
    await this.testConnections();
  }

  private async testConnections(): Promise<void> {
    try {
      // Test source connection
      await this.sourceDb.execute(sql`SELECT 1`);
      logger.info('neon-setup', 'Source database connection successful');

      // Test target connection
      await this.targetDb.execute(sql`SELECT 1`);
      logger.info('neon-setup', 'Target database connection successful');
    } catch (error) {
      logger.error('neon-setup', 'Database connection test failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    if (!this.config.enableMigration) {
      logger.info('neon-setup', 'Migrations disabled in config');
      return;
    }

    logger.info('neon-setup', 'Running migrations on Neon database');

    try {
      // Run migrations on the target database
      await migrate(this.targetDb, { migrationsFolder: './migrations' });
      logger.info('neon-setup', 'Migrations completed successfully');
    } catch (error) {
      logger.error('neon-setup', 'Migration failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async transferData(): Promise<void> {
    if (!this.config.enableDataTransfer) {
      logger.info('neon-setup', 'Data transfer disabled in config');
      return;
    }

    logger.info('neon-setup', 'Starting data transfer from source to target');

    try {
      // Transfer data table by table in dependency order
      await this.transferUsers();
      await this.transferFarms();
      await this.transferProduceItems();
      await this.transferInventories();
      await this.transferOrders();
      await this.transferOrderItems();
      await this.transferMessages();
      await this.transferReviews();

      logger.info('neon-setup', 'Data transfer completed successfully');
    } catch (error) {
      logger.error('neon-setup', 'Data transfer failed', {
        error: error.message,
      });
      throw error;
    }
  }

  private async transferUsers(): Promise<void> {
    logger.info('neon-setup', 'Transferring users table');
    
    const users = await this.sourceDb.select().from(schema.users);
    
    if (users.length > 0) {
      await this.targetDb.insert(schema.users).values(users).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${users.length} users`);
    }
  }

  private async transferFarms(): Promise<void> {
    logger.info('neon-setup', 'Transferring farms table');
    
    const farms = await this.sourceDb.select().from(schema.farms);
    
    if (farms.length > 0) {
      await this.targetDb.insert(schema.farms).values(farms).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${farms.length} farms`);
    }
  }

  private async transferProduceItems(): Promise<void> {
    logger.info('neon-setup', 'Transferring produce items table');
    
    const produceItems = await this.sourceDb.select().from(schema.produceItems);
    
    if (produceItems.length > 0) {
      await this.targetDb.insert(schema.produceItems).values(produceItems).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${produceItems.length} produce items`);
    }
  }

  private async transferInventories(): Promise<void> {
    logger.info('neon-setup', 'Transferring inventories table');
    
    const inventories = await this.sourceDb.select().from(schema.inventories);
    
    if (inventories.length > 0) {
      await this.targetDb.insert(schema.inventories).values(inventories).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${inventories.length} inventory records`);
    }
  }

  private async transferOrders(): Promise<void> {
    logger.info('neon-setup', 'Transferring orders table');
    
    const orders = await this.sourceDb.select().from(schema.orders);
    
    if (orders.length > 0) {
      await this.targetDb.insert(schema.orders).values(orders).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${orders.length} orders`);
    }
  }

  private async transferOrderItems(): Promise<void> {
    logger.info('neon-setup', 'Transferring order items table');
    
    const orderItems = await this.sourceDb.select().from(schema.orderItems);
    
    if (orderItems.length > 0) {
      await this.targetDb.insert(schema.orderItems).values(orderItems).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${orderItems.length} order items`);
    }
  }

  private async transferMessages(): Promise<void> {
    logger.info('neon-setup', 'Transferring messages table');
    
    const messages = await this.sourceDb.select().from(schema.messages);
    
    if (messages.length > 0) {
      await this.targetDb.insert(schema.messages).values(messages).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${messages.length} messages`);
    }
  }

  private async transferReviews(): Promise<void> {
    logger.info('neon-setup', 'Transferring reviews table');
    
    const reviews = await this.sourceDb.select().from(schema.reviews);
    
    if (reviews.length > 0) {
      await this.targetDb.insert(schema.reviews).values(reviews).onConflictDoNothing();
      logger.info('neon-setup', `Transferred ${reviews.length} reviews`);
    }
  }

  async createBackup(): Promise<void> {
    logger.info('neon-setup', 'Creating backup of source database');

    try {
      const backupPrefix = this.config.backupTablePrefix || 'backup_';
      
      // Create backup tables with current timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupSuffix = `_${timestamp}`;

      await this.sourceDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(backupPrefix + 'users' + backupSuffix)} 
        AS SELECT * FROM users;
      `);

      await this.sourceDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(backupPrefix + 'farms' + backupSuffix)} 
        AS SELECT * FROM farms;
      `);

      await this.sourceDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ${sql.identifier(backupPrefix + 'produce_items' + backupSuffix)} 
        AS SELECT * FROM produce_items;
      `);

      logger.info('neon-setup', 'Backup created successfully');
    } catch (error) {
      logger.error('neon-setup', 'Backup creation failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async validateDataIntegrity(): Promise<boolean> {
    logger.info('neon-setup', 'Validating data integrity');

    try {
      // Count records in both databases
      const sourceUserCount = await this.sourceDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.users);
      
      const targetUserCount = await this.targetDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.users);

      const sourceFarmCount = await this.sourceDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.farms);
      
      const targetFarmCount = await this.targetDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.farms);

      const sourceProduceCount = await this.sourceDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.produceItems);
      
      const targetProduceCount = await this.targetDb
        .select({ count: sql`COUNT(*)` })
        .from(schema.produceItems);

      const isValid = 
        sourceUserCount[0].count === targetUserCount[0].count &&
        sourceFarmCount[0].count === targetFarmCount[0].count &&
        sourceProduceCount[0].count === targetProduceCount[0].count;

      logger.info('neon-setup', 'Data integrity validation', {
        sourceUsers: sourceUserCount[0].count,
        targetUsers: targetUserCount[0].count,
        sourceFarms: sourceFarmCount[0].count,
        targetFarms: targetFarmCount[0].count,
        sourceProduce: sourceProduceCount[0].count,
        targetProduce: targetProduceCount[0].count,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('neon-setup', 'Data integrity validation failed', {
        error: error.message,
      });
      return false;
    }
  }

  async cleanup(): Promise<void> {
    logger.info('neon-setup', 'Cleaning up connections');

    try {
      if (this.sourcePool) {
        await this.sourcePool.end();
      }
      if (this.targetPool) {
        await this.targetPool.end();
      }
    } catch (error) {
      logger.error('neon-setup', 'Cleanup failed', {
        error: error.message,
      });
    }
  }
}

// Main execution function
async function main() {
  const config: NeonSetupConfig = {
    sourceConnectionString: process.env.REPLIT_DATABASE_URL || process.env.DATABASE_URL!,
    targetConnectionString: process.env.NEON_DATABASE_URL!,
    enableMigration: process.env.ENABLE_MIGRATION !== 'false',
    enableDataTransfer: process.env.ENABLE_DATA_TRANSFER !== 'false',
    backupTablePrefix: process.env.BACKUP_PREFIX || 'backup_',
  };

  const setup = new NeonDatabaseSetup(config);

  try {
    await setup.initialize();
    
    // Create backup first
    await setup.createBackup();
    
    // Run migrations
    await setup.runMigrations();
    
    // Transfer data
    await setup.transferData();
    
    // Validate integrity
    const isValid = await setup.validateDataIntegrity();
    
    if (isValid) {
      logger.info('neon-setup', 'Neon database setup completed successfully');
      console.log('✅ Neon database setup completed successfully!');
      console.log('📊 Data integrity validated');
      console.log('🚀 Ready to switch to Neon database');
    } else {
      logger.error('neon-setup', 'Data integrity validation failed');
      console.log('❌ Data integrity validation failed');
      console.log('🔄 Please check the logs and try again');
    }
    
  } catch (error) {
    logger.error('neon-setup', 'Setup failed', {
      error: error.message,
    });
    console.log('❌ Setup failed:', error.message);
  } finally {
    await setup.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { NeonDatabaseSetup, type NeonSetupConfig };