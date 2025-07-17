import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';
import { storage } from '../storage';

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

interface AuthenticatedRequest extends Request {
  session: {
    userId: number;
    userRole: string;
  } & Request['session'];
}

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.sessionID;
  const userId = req.session.userId;
  const userRole = req.session.userRole;

  logger.info('auth', 'Auth check initiated', {
    sessionId,
    userId,
    userRole,
  });

  if (!userId) {
    logger.warn('auth', 'Authentication failed - No userId in session', {
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user still exists and is active
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      logger.warn('auth', 'Authentication failed - User not found', {
        userId,
        sessionId,
      });
      
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) {
          logger.error('auth', 'Failed to destroy invalid session', {
            error: err.message,
            sessionId,
          });
        }
      });
      
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!user.isActive) {
      logger.warn('auth', 'Authentication failed - User inactive', {
        userId,
        sessionId,
      });
      
      return res.status(401).json({ message: "Account disabled" });
    }

    // Update session with current user role (in case it changed)
    if (req.session.userRole !== user.role) {
      req.session.userRole = user.role;
      logger.info('auth', 'Updated session role', {
        userId,
        newRole: user.role,
        sessionId,
      });
    }

    logger.info('auth', 'Authentication passed', {
      userId,
      userRole: user.role,
    });

    // Attach user to request for convenience
    (req as any).user = user;
    
    next();
  } catch (error) {
    logger.error('auth', 'Authentication error', {
      error: error.message,
      userId,
      sessionId,
    });
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    logger.info('auth', 'Role check initiated', {
      userId,
      userRole,
      requiredRole,
    });

    if (!userId) {
      logger.warn('auth', 'Role check failed - No authentication', {
        requiredRole,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userRole !== requiredRole) {
      logger.warn('auth', 'Role check failed - Insufficient permissions', {
        userId,
        userRole,
        requiredRole,
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    logger.info('auth', 'Role check passed', {
      userId,
      userRole,
      requiredRole,
    });

    next();
  };
};

// Multiple role authorization
export const requireAnyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    logger.info('auth', 'Multi-role check initiated', {
      userId,
      userRole,
      allowedRoles,
    });

    if (!userId) {
      logger.warn('auth', 'Multi-role check failed - No authentication', {
        allowedRoles,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(userRole)) {
      logger.warn('auth', 'Multi-role check failed - Insufficient permissions', {
        userId,
        userRole,
        allowedRoles,
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    logger.info('auth', 'Multi-role check passed', {
      userId,
      userRole,
      allowedRoles,
    });

    next();
  };
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  
  if (!userId) {
    // No authentication, continue without user
    next();
    return;
  }

  try {
    const user = await storage.getUser(userId);
    
    if (user && user.isActive) {
      (req as any).user = user;
      
      logger.info('auth', 'Optional authentication successful', {
        userId,
        userRole: user.role,
      });
    } else {
      logger.warn('auth', 'Optional authentication failed - Invalid user', {
        userId,
      });
    }
  } catch (error) {
    logger.error('auth', 'Optional authentication error', {
      error: error.message,
      userId,
    });
  }
  
  next();
};

export type { AuthenticatedRequest };