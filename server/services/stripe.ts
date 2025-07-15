import Stripe from 'stripe';
import { logger } from './logger';

interface PaymentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  platformFee?: string;
  farmerAmount?: string;
  error?: string;
}

class StripeService {
  private stripe: Stripe | null = null;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.isEnabled = !!apiKey;
    
    if (this.isEnabled && apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async createPaymentIntent(amount: number, orderId: number): Promise<PaymentResult> {
    if (!this.isEnabled || !this.stripe) {
      logger.error('payment', 'Stripe service disabled - no API key provided');
      return { success: false, error: 'Payment processing unavailable' };
    }

    try {
      logger.paymentInitiated(orderId, amount);
      
      const PLATFORM_FEE_RATE = 0.10; // 10%
      const platformFee = amount * PLATFORM_FEE_RATE;
      const farmerAmount = amount - platformFee;
      
      logger.info('payment', `Creating Stripe payment intent for order ${orderId}`, {
        amount,
        platformFee,
        farmerAmount,
        amountInCents: Math.round(amount * 100),
      });
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: orderId.toString(),
          platformFee: platformFee.toFixed(2),
          farmerAmount: farmerAmount.toFixed(2),
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Optimized for Apple Pay and immediate payments
        },
        // Don't specify payment_method_types when using automatic_payment_methods
      });
      
      logger.info('payment', `Payment intent created successfully: ${paymentIntent.id}`, {
        paymentIntentId: paymentIntent.id,
        orderId,
        amount,
        status: paymentIntent.status,
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        platformFee: platformFee.toFixed(2),
        farmerAmount: farmerAmount.toFixed(2),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      logger.paymentFailed(errorMessage, orderId, amount);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.isEnabled || !this.stripe) {
      logger.error('payment', 'Stripe service disabled during payment confirmation');
      return { success: false, error: 'Payment processing unavailable' };
    }

    try {
      logger.info('payment', `Confirming payment: ${paymentIntentId}`);
      
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const orderId = paymentIntent.metadata.orderId;
        logger.paymentSucceeded(paymentIntentId, parseInt(orderId), paymentIntent.amount / 100);
      } else {
        logger.warn('payment', `Payment confirmation incomplete: ${paymentIntentId}`, {
          status: paymentIntent.status,
        });
      }
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment confirmation failed';
      logger.paymentFailed(errorMessage, undefined, undefined, undefined);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const stripeService = new StripeService();