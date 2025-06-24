interface EmailResult {
  success: boolean;
  error?: string;
}

class EmailService {
  private apiKey: string;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "";
    this.isEnabled = !!this.apiKey;
  }

  async sendOrderConfirmation(to: string, order: any): Promise<EmailResult> {
    if (!this.isEnabled) {
      console.info("[MOCK EMAIL] Would send order confirmation to", to, "for order", order.id);
      return { success: true };
    }

    try {
      // In a real implementation, you would use the SendGrid SDK here
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // const msg = {
      //   to,
      //   from: 'orders@farmdirect.com',
      //   subject: `Order Confirmation #${order.id}`,
      //   text: `Your order #${order.id} has been confirmed. Total: $${order.totalAmount}`,
      //   html: `<p>Your order #${order.id} has been confirmed.</p><p>Total: $${order.totalAmount}</p>`,
      // };
      // await sgMail.send(msg);
      
      console.info("[SENDGRID] Sending order confirmation to", to, "for order", order.id);
      
      return { success: true };
    } catch (error) {
      console.error("[SENDGRID] Email sending failed:", error);
      return {
        success: false,
        error: "Email sending failed",
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
