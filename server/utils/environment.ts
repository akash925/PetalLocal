import { logger } from '../services/logger';

interface EnvironmentConfig {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  session: {
    secret: string;
    ttl: number;
  };
  stripe: {
    secretKey: string;
    publicKey: string;
  };
  openai: {
    apiKey: string;
  };
  sendgrid: {
    apiKey: string;
  };
  security: {
    nodeEnv: string;
    isProduction: boolean;
    isDevelopment: boolean;
  };
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig | null = null;

  private constructor() {}

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  validate(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required environment variables
    const requiredVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'STRIPE_SECRET_KEY',
      'VITE_STRIPE_PUBLIC_KEY',
      'OPENAI_API_KEY',
      'SENDGRID_API_KEY',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
      warnings.push('NODE_ENV should be set to development, production, or test');
    }

    // Validate SESSION_SECRET strength
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret) {
      if (sessionSecret.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters long for security');
      }
      if (sessionSecret === 'fallback-secret-key' || sessionSecret.includes('default')) {
        errors.push('SESSION_SECRET appears to be using a default value - this is insecure');
      }
    }

    // Validate Stripe keys
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripePublic = process.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (stripeSecret) {
      if (!stripeSecret.startsWith('sk_')) {
        errors.push('STRIPE_SECRET_KEY should start with "sk_"');
      }
      if (stripeSecret.includes('test') && nodeEnv === 'production') {
        warnings.push('Using test Stripe keys in production environment');
      }
    }

    if (stripePublic) {
      if (!stripePublic.startsWith('pk_')) {
        errors.push('VITE_STRIPE_PUBLIC_KEY should start with "pk_"');
      }
    }

    // Validate OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      if (!openaiKey.startsWith('sk-')) {
        errors.push('OPENAI_API_KEY should start with "sk-"');
      }
    }

    // Validate SendGrid API key
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      if (!sendgridKey.startsWith('SG.')) {
        errors.push('SENDGRID_API_KEY should start with "SG."');
      }
    }

    // Validate database URL
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
        errors.push('DATABASE_URL should start with "postgres://" or "postgresql://"');
      }
    }

    // Log validation results
    if (errors.length > 0) {
      logger.error('environment', 'Environment validation failed', {
        errors,
        warnings,
      });
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }

    if (warnings.length > 0) {
      logger.warn('environment', 'Environment validation warnings', {
        warnings,
      });
    }

    logger.info('environment', 'Environment validation passed', {
      nodeEnv,
      warnings: warnings.length,
    });

    // Create configuration object
    this.config = {
      database: {
        url: process.env.DATABASE_URL!,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      },
      session: {
        secret: process.env.SESSION_SECRET!,
        ttl: parseInt(process.env.SESSION_TTL || '604800000'), // 7 days
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        publicKey: process.env.VITE_STRIPE_PUBLIC_KEY!,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY!,
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY!,
      },
      security: {
        nodeEnv: nodeEnv || 'development',
        isProduction: nodeEnv === 'production',
        isDevelopment: nodeEnv === 'development',
      },
    };

    return this.config;
  }

  getConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Environment not validated. Call validate() first.');
    }
    return this.config;
  }

  isProduction(): boolean {
    return this.getConfig().security.isProduction;
  }

  isDevelopment(): boolean {
    return this.getConfig().security.isDevelopment;
  }

  // Security-focused environment checks
  validateSecuritySettings(): void {
    const config = this.getConfig();
    
    if (config.security.isProduction) {
      // Production-specific security checks
      if (config.session.secret.length < 64) {
        logger.warn('security', 'SESSION_SECRET should be at least 64 characters in production');
      }
      
      if (config.stripe.secretKey.includes('test')) {
        throw new Error('Cannot use test Stripe keys in production');
      }
      
      // Check for development-only configurations
      if (process.env.DEBUG === 'true') {
        logger.warn('security', 'DEBUG mode enabled in production');
      }
    }
  }
}

// Export singleton instance
export const environmentValidator = EnvironmentValidator.getInstance();