import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from '../db';
import { logger } from '../services/logger';

const PgSession = connectPgSimple(session);

export function createSessionStore(): connectPgSimple.PGStore {
  logger.info('session', 'Creating PostgreSQL session store');
  
  // Use existing session table from schema
  return new PgSession({
    pool: pool,
    tableName: 'sessions', // Use the table name from our schema
    createTableIfMissing: false, // Don't create table - use existing schema
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    schemaName: 'public',
    errorLog: (error: Error) => {
      // Only log serious errors, ignore table/index creation conflicts
      if (!error.message.includes('already exists') && 
          !error.message.includes('relation') && 
          !error.message.includes('IDX_session_expire')) {
        logger.error('session', 'Session store error', {
          error: error.message,
          stack: error.stack,
        });
      }
    },
  });
}

export function getSessionConfig(sessionStore: connectPgSimple.PGStore): session.SessionOptions {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  return {
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "strict",
    },
    name: 'farmdirect.session', // Custom session name
  };
}

// Session cleanup helper
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await pool.query(`
      DELETE FROM session 
      WHERE expire < NOW()
    `);
    
    logger.info('session', 'Cleaned up expired sessions', {
      deletedCount: result.rowCount,
    });
  } catch (error) {
    logger.error('session', 'Session cleanup failed', {
      error: error.message,
    });
  }
}

// Schedule periodic cleanup (every 6 hours)
setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);