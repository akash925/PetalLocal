import { storage } from '../storage';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  category: 'payment' | 'auth' | 'checkout' | 'system';
  message: string;
  data?: any;
  timestamp: Date;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatting
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category.toUpperCase()}]`;
    
    if (entry.level === 'error') {
      console.error(`${prefix} ${entry.message}`, entry.data || '');
    } else if (entry.level === 'warn') {
      console.warn(`${prefix} ${entry.message}`, entry.data || '');
    } else {
      console.log(`${prefix} ${entry.message}`, entry.data || '');
    }
  }

  info(category: LogEntry['category'], message: string, data?: any, context?: Partial<LogEntry>) {
    this.addLog({
      level: 'info',
      category,
      message,
      data,
      timestamp: new Date(),
      ...context,
    });
  }

  warn(category: LogEntry['category'], message: string, data?: any, context?: Partial<LogEntry>) {
    this.addLog({
      level: 'warn',
      category,
      message,
      data,
      timestamp: new Date(),
      ...context,
    });
  }

  error(category: LogEntry['category'], message: string, data?: any, context?: Partial<LogEntry>) {
    this.addLog({
      level: 'error',
      category,
      message,
      data,
      timestamp: new Date(),
      ...context,
    });
  }

  // Payment-specific logging methods
  paymentInitiated(orderId: number, amount: number, userId?: number, guestEmail?: string) {
    this.info('payment', `Payment initiated for order ${orderId}`, {
      orderId,
      amount,
      userId,
      guestEmail,
    });
  }

  paymentSucceeded(paymentIntentId: string, orderId: number, amount: number) {
    this.info('payment', `Payment succeeded for order ${orderId}`, {
      paymentIntentId,
      orderId,
      amount,
    });
  }

  paymentFailed(error: string, orderId?: number, amount?: number, userId?: number) {
    this.error('payment', `Payment failed: ${error}`, {
      orderId,
      amount,
      userId,
      error,
    });
  }

  checkoutStarted(userId?: number, guestEmail?: string, items?: any[]) {
    this.info('checkout', 'Checkout process started', {
      userId,
      guestEmail,
      itemCount: items?.length || 0,
    });
  }

  checkoutCompleted(orderId: number, userId?: number, amount?: number) {
    this.info('checkout', `Checkout completed for order ${orderId}`, {
      orderId,
      userId,
      amount,
    });
  }

  authAttempt(email: string, success: boolean, reason?: string) {
    if (success) {
      this.info('auth', `Authentication successful for ${email}`);
    } else {
      this.warn('auth', `Authentication failed for ${email}`, { reason });
    }
  }

  guestAccountCreated(email: string, userId: number) {
    this.info('auth', `Guest account created for ${email}`, { userId });
  }

  // Get logs for admin portal
  getLogs(limit = 100, category?: LogEntry['category'], level?: LogEntry['level']) {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get payment failure logs specifically
  getPaymentFailures(limit = 50) {
    return this.logs
      .filter(log => log.category === 'payment' && log.level === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get checkout analytics
  getCheckoutAnalytics() {
    const checkoutLogs = this.logs.filter(log => log.category === 'checkout');
    const paymentLogs = this.logs.filter(log => log.category === 'payment');
    
    const checkoutStarted = checkoutLogs.filter(log => log.message.includes('started')).length;
    const checkoutCompleted = checkoutLogs.filter(log => log.message.includes('completed')).length;
    const paymentSucceeded = paymentLogs.filter(log => log.message.includes('succeeded')).length;
    const paymentFailed = paymentLogs.filter(log => log.level === 'error').length;

    return {
      checkoutStarted,
      checkoutCompleted,
      paymentSucceeded,
      paymentFailed,
      conversionRate: checkoutStarted > 0 ? (checkoutCompleted / checkoutStarted * 100).toFixed(1) : '0',
      paymentSuccessRate: (paymentSucceeded + paymentFailed) > 0 ? (paymentSucceeded / (paymentSucceeded + paymentFailed) * 100).toFixed(1) : '0',
    };
  }
}

export const logger = new Logger();