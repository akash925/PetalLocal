import { Request, Response, NextFunction } from 'express';
import { connectionManager } from '../database/connection';
import { logger } from '../services/logger';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckStatus;
    memory: HealthCheckStatus;
    disk: HealthCheckStatus;
    environment: HealthCheckStatus;
  };
}

interface HealthCheckStatus {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  responseTime?: number;
  details?: any;
}

export class HealthCheckManager {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkEnvironment(),
    ]);

    const [database, memory, disk, environment] = checks;
    
    const allHealthy = checks.every(check => check.status === 'pass');
    const anyFailed = checks.some(check => check.status === 'fail');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (anyFailed) {
      overallStatus = 'unhealthy';
    } else if (checks.some(check => check.status === 'warn')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database,
        memory,
        disk,
        environment,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await connectionManager.healthCheck();
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        return {
          status: 'pass',
          message: 'Database connection is healthy',
          responseTime,
        };
      } else {
        return {
          status: 'fail',
          message: 'Database connection failed',
          responseTime,
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Database health check failed',
        responseTime: Date.now() - startTime,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckStatus> {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryUtilization = (usedMemory / totalMemory) * 100;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Memory usage is normal';
      
      if (memoryUtilization > 90) {
        status = 'fail';
        message = 'Critical memory usage detected';
      } else if (memoryUtilization > 75) {
        status = 'warn';
        message = 'High memory usage detected';
      }
      
      return {
        status,
        message,
        details: {
          heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          utilization: `${memoryUtilization.toFixed(2)}%`,
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Memory check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkDisk(): Promise<HealthCheckStatus> {
    try {
      // Simple disk space check - in production, you might use a library like 'statvfs'
      const stats = await import('fs').then(fs => fs.promises.stat('.'));
      
      return {
        status: 'pass',
        message: 'Disk access is working',
        details: {
          accessible: true,
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Disk check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkEnvironment(): Promise<HealthCheckStatus> {
    try {
      const requiredEnvVars = [
        'DATABASE_URL',
        'SESSION_SECRET',
        'STRIPE_SECRET_KEY',
        'OPENAI_API_KEY',
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        return {
          status: 'fail',
          message: 'Missing required environment variables',
          details: {
            missing: missingVars,
          },
        };
      }
      
      // Check environment configuration
      const warnings = [];
      
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'development') {
        warnings.push('NODE_ENV not set to production or development');
      }
      
      if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        warnings.push('SESSION_SECRET is too short');
      }
      
      return {
        status: warnings.length > 0 ? 'warn' : 'pass',
        message: warnings.length > 0 ? 'Environment configuration warnings' : 'Environment is properly configured',
        details: {
          nodeEnv: process.env.NODE_ENV,
          warnings,
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Environment check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Create singleton instance
const healthCheckManager = new HealthCheckManager();

// Health check endpoint middleware
export const healthCheckEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await healthCheckManager.performHealthCheck();
    
    // Log health check results
    logger.info('system', 'Health check performed', {
      status: result.status,
      uptime: result.uptime,
      checks: Object.entries(result.checks).map(([name, check]) => ({
        name,
        status: check.status,
        message: check.message,
      })),
    });
    
    // Set appropriate HTTP status code
    let statusCode = 200;
    if (result.status === 'degraded') {
      statusCode = 207; // Multi-Status
    } else if (result.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }
    
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('system', 'Health check endpoint failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    res.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

// Liveness probe (simple check)
export const livenessProbe = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Readiness probe (more comprehensive)
export const readinessProbe = async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    const dbHealthy = await connectionManager.healthCheck();
    
    if (dbHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: 'Database not ready',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

export { healthCheckManager };