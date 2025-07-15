import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from '../services/logger';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

class DatabaseConnection {
  private pool: Pool | null = null;
  private db: any = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    // Don't initialize synchronously, let it be called explicitly
  }

  private async initialize() {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      // Create connection pool with optimal settings
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // Maximum number of connections
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
      });

      // Initialize Drizzle with schema
      this.db = drizzle({ 
        client: this.pool, 
        schema,
        logger: process.env.NODE_ENV === 'development'
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('database', 'Database connection established successfully');
    } catch (error) {
      logger.error('database', 'Failed to initialize database connection', {
        error: error.message,
        attempt: this.connectionAttempts + 1,
      });
      
      await this.handleConnectionError(error);
    }
  }

  private async testConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  private async handleConnectionError(error: any) {
    this.connectionAttempts++;
    
    if (this.connectionAttempts < this.maxRetries) {
      logger.warn('database', 'Retrying database connection', {
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
      });
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      this.retryDelay *= 2; // Exponential backoff
      return this.initialize();
    }

    logger.error('database', 'Max connection retries exceeded', {
      attempts: this.connectionAttempts,
      error: error.message,
    });
    
    throw new Error('Unable to establish database connection after multiple attempts');
  }

  public getDatabase() {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Please initialize connection first.');
    }
    return this.db;
  }

  public getPool() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return this.pool;
  }

  public async reconnect() {
    logger.info('database', 'Attempting to reconnect to database');
    
    if (this.pool) {
      await this.pool.end();
    }
    
    this.pool = null;
    this.db = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.retryDelay = 1000;

    await this.initialize();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch (error) {
      logger.error('database', 'Database health check failed', {
        error: error.message,
      });
      return false;
    }
  }

  public async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
      this.isConnected = false;
      logger.info('database', 'Database connection closed');
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

// Initialize connection
await dbConnection.initialize();

// Export database instance
export const db = dbConnection.getDatabase();
export const pool = dbConnection.getPool();

// Export connection manager for health checks
export const connectionManager = dbConnection;

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('database', 'Received SIGINT, closing database connection');
  await dbConnection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('database', 'Received SIGTERM, closing database connection');
  await dbConnection.close();
  process.exit(0);
});