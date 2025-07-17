import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../services/logger';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('security', 'Rate limit exceeded for authentication', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks, development resources, and static assets
    return req.path.startsWith('/health') || 
           req.path.startsWith('/@') || 
           req.path.startsWith('/src/') || 
           req.path.startsWith('/node_modules/') ||
           req.path.startsWith('/@fs/') ||
           req.path.includes('.js') ||
           req.path.includes('.css') ||
           req.path.includes('.ts') ||
           req.path.includes('.tsx') ||
           req.path.includes('.jsx') ||
           req.path.includes('.map') ||
           req.path.includes('vite') ||
           req.path.includes('react-refresh') ||
           req.path.includes('chunk-') ||
           req.path.includes('.woff') ||
           req.path.includes('.woff2') ||
           req.path.includes('.ttf') ||
           req.path.includes('.svg') ||
           req.path.includes('.png') ||
           req.path.includes('.jpg') ||
           req.path.includes('.jpeg') ||
           req.path.includes('.gif') ||
           req.path.includes('.ico');
  },
  handler: (req: Request, res: Response) => {
    logger.warn('security', 'Rate limit exceeded for API', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many API requests, please try again later.',
    });
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    error: 'Too many upload attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://js.stripe.com",
        "https://checkout.stripe.com",
        "'unsafe-eval'", // Required for development environment
        "'wasm-unsafe-eval'" // Required for Stripe.js
      ],
      connectSrc: [
        "'self'", 
        "https://api.stripe.com",
        "https://checkout.stripe.com",
        "https://payments.stripe.com",
        "https://maps.stripe.com",
        "wss://ws.stripe.com",
        "ws://localhost:*", // For Vite HMR
        "wss://localhost:*", // For Vite HMR
        "https://vitejs.dev"
      ],
      frameSrc: [
        "'self'", 
        "https://js.stripe.com",
        "https://checkout.stripe.com",
        "https://payments.stripe.com"
      ],
      childSrc: [
        "'self'", 
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      formAction: ["'self'", "https://checkout.stripe.com"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input validation schemas
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().min(1).max(100).trim();
export const phoneSchema = z.string().max(20).optional();
export const addressSchema = z.string().max(500).optional();
export const urlSchema = z.string().url().max(500).optional();

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous characters
    return str
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// Request validation
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('validation', 'Request validation failed', {
          ip: req.ip,
          path: req.path,
          errors: error.errors,
        });
        return res.status(400).json({
          error: 'Invalid request data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('system', 'Unhandled error', {
    error: error.message,
    stack: error.stack,
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }

  res.status(500).json({
    error: error.message,
    stack: error.stack,
  });
};

// Session security validation
export const validateSessionSecurity = () => {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required for security');
  }
  
  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
};