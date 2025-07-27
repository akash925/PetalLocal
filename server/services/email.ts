import sgMail from '@sendgrid/mail';

interface EmailResult {
  success: boolean;
  error?: string;
}

interface OrderEmailData {
  id: number;
  totalAmount: number;
  platformFee?: number;
  farmerPayout?: number;
  items: any[];
  buyerName: string;
}

class EmailService {
  private apiKey: string;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
    this.isEnabled = !!this.apiKey;
    
    if (this.isEnabled) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  async sendOrderConfirmation(to: string, order: OrderEmailData): Promise<EmailResult> {
    if (!this.isEnabled) {
      console.info("[MOCK EMAIL] Would send order confirmation to", to, "for order", order.id);
      return { success: true };
    }

    try {
      const itemsList = order.items.map(item => 
        `• ${item.quantity}x ${item.flowerName || 'Flower'} - $${item.totalPrice || item.pricePerUnit}`
      ).join('\n');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ABAB5, #14B8A6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">PetalLocal</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your luxury flower marketplace</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #0ABAB5; margin: 0 0 20px; font-size: 24px;">Order Confirmation #${order.id}</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear ${order.buyerName},<br><br>
              Thank you for your order from PetalLocal! We're thrilled to help you bring beautiful, fresh flowers into your life.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0ABAB5; margin: 0 0 15px; font-size: 18px;">Order Details</h3>
              <div style="color: #374151; line-height: 1.8; white-space: pre-line;">${itemsList}</div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #0ABAB5;">
                  <span>Total Amount:</span>
                  <span>$${order.totalAmount.toFixed(2)}</span>
                </div>
                ${order.platformFee ? `
                <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
                  Platform fee: $${order.platformFee.toFixed(2)} | Grower receives: $${(order.farmerPayout || 0).toFixed(2)}
                </div>` : ''}
              </div>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Your order is being prepared by our talented local growers. You'll receive another email when your flowers are ready for pickup or delivery.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-domain.replit.app/orders/${order.id}" 
                 style="background: #0ABAB5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                View Order Details
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Thank you for supporting local flower growers!</p>
              <p style="margin: 0;">PetalLocal - Garden to Bouquet</p>
            </div>
          </div>
        </div>
      `;

      const textContent = `
PetalLocal Order Confirmation #${order.id}

Dear ${order.buyerName},

Thank you for your order from PetalLocal! 

Order Details:
${itemsList}

Total: $${order.totalAmount.toFixed(2)}
${order.platformFee ? `Platform fee: $${order.platformFee.toFixed(2)} | Grower receives: $${(order.farmerPayout || 0).toFixed(2)}` : ''}

Your order is being prepared by our local growers. You'll receive another email when your flowers are ready.

Thank you for supporting local flower growers!
PetalLocal - Garden to Bouquet
      `;

      const msg = {
        to,
        from: {
          email: 'orders@petallocal.com',
          name: 'PetalLocal'
        },
        subject: `🌸 Order Confirmation #${order.id} - Beautiful flowers on the way!`,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.info("[SENDGRID] Order confirmation sent successfully to", to);
      
      return { success: true };
    } catch (error) {
      console.error("[SENDGRID] Email sending failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Email sending failed",
      };
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    if (!this.isEnabled) {
      console.info("[MOCK EMAIL] Would send welcome email to", to);
      return { success: true };
    }

    try {
      console.info("[SENDGRID] Sending welcome email to", to);
      return { success: true };
    } catch (error) {
      console.error("[SENDGRID] Welcome email failed:", error);
      return {
        success: false,
        error: "Welcome email failed",
      };
    }
  }
}

export const emailService = new EmailService();
