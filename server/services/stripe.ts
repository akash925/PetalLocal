import Stripe from 'stripe';

interface PaymentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
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
      console.log('[STRIPE] Service disabled - no API key');
      return { success: false, error: 'Payment processing unavailable' };
    }

    try {
      console.log(`[STRIPE] Creating payment intent for order ${orderId} amount: ${amount}`);
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: orderId.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('[STRIPE] Payment intent creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    if (!this.isEnabled || !this.stripe) {
      return { success: false, error: 'Payment processing unavailable' };
    }

    try {
      console.log(`[STRIPE] Confirming payment: ${paymentIntentId}`);
      
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('[STRIPE] Payment confirmation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }
}

export const stripeService = new StripeService();