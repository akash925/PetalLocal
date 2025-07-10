// Platform configuration
export const PLATFORM_CONFIG = {
  // Platform take rate (configurable)
  PLATFORM_FEE_RATE: parseFloat(process.env.PLATFORM_FEE_RATE || "0.10"), // 10% default
  
  // Other platform settings
  CURRENCY: "USD",
  PAYMENT_METHODS: ["card"],
  
  // Admin settings
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@farmdirect.com",
} as const;

// Helper function to calculate platform fee
export function calculatePlatformFee(amount: number): { 
  platformFee: number; 
  farmerAmount: number; 
  total: number; 
} {
  const platformFee = amount * PLATFORM_CONFIG.PLATFORM_FEE_RATE;
  const farmerAmount = amount - platformFee;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
    farmerAmount: Math.round(farmerAmount * 100) / 100,
    total: Math.round(amount * 100) / 100,
  };
}