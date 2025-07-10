// Platform configuration settings
export const PLATFORM_CONFIG = {
  // Platform fee rate (as decimal, e.g., 0.10 = 10%)
  DEFAULT_FEE_RATE: 0.10,
  
  // Minimum and maximum fee rates for admin configuration
  MIN_FEE_RATE: 0.0,
  MAX_FEE_RATE: 0.5,
  
  // Payment processing settings
  PAYMENT_CURRENCY: "usd",
  MINIMUM_ORDER_AMOUNT: 5.00,
  
  // Email settings
  WELCOME_EMAIL_ENABLED: true,
  ORDER_CONFIRMATION_EMAIL_ENABLED: true,
  
  // Feature flags
  MESSAGING_ENABLED: true,
  MAP_INTEGRATION_ENABLED: true,
  INVENTORY_TRACKING_ENABLED: true,
};

/**
 * Calculate platform fee for a given amount
 * @param amount - Order total amount
 * @returns Object with platform fee details
 */
export function calculatePlatformFee(amount: number): { 
  platformFee: number; 
  farmerPayout: number; 
  platformFeeRate: number;
} {
  const platformFeeRate = process.env.PLATFORM_FEE_RATE 
    ? parseFloat(process.env.PLATFORM_FEE_RATE) 
    : PLATFORM_CONFIG.DEFAULT_FEE_RATE;
  
  const platformFee = amount * platformFeeRate;
  const farmerPayout = amount - platformFee;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
    farmerPayout: Math.round(farmerPayout * 100) / 100,
    platformFeeRate,
  };
}

/**
 * Get current platform configuration
 */
export function getPlatformConfig() {
  return {
    ...PLATFORM_CONFIG,
    currentFeeRate: process.env.PLATFORM_FEE_RATE 
      ? parseFloat(process.env.PLATFORM_FEE_RATE) 
      : PLATFORM_CONFIG.DEFAULT_FEE_RATE,
  };
}