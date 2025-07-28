import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found - email service will use fallback mode');
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// PetalLocal Email Templates with Tiffany & Co. inspired branding
const PETALLOCAL_BRANDING = {
  primaryColor: '#0ABAB5', // Tiffany blue
  secondaryColor: '#B8860B', // Elegant gold
  backgroundColor: '#FEFEFE',
  textColor: '#2C2C2C',
  mutedColor: '#6B7280',
  borderColor: '#E5E7EB',
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, ${PETALLOCAL_BRANDING.primaryColor} 0%, #0EA5E9 100%); padding: 2rem 0; text-align: center;">
    <div style="background: white; display: inline-block; padding: 1rem 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <h1 style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; font-size: 2rem; font-weight: bold; color: ${PETALLOCAL_BRANDING.primaryColor}; margin: 0; letter-spacing: -0.025em;">
        🌸 PETALLOCAL
      </h1>
      <p style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0.5rem 0 0 0; font-size: 0.875rem; font-style: italic;">
        Garden to Bouquet • Fresh Local Flowers
      </p>
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; padding: 2rem; text-align: center; border-top: 1px solid ${PETALLOCAL_BRANDING.borderColor};">
    <div style="max-width: 600px; margin: 0 auto;">
      <p style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 0.875rem; margin-bottom: 1rem;">
        Thank you for choosing PetalLocal for your fresh flower needs
      </p>
      
      <div style="display: flex; justify-content: center; gap: 2rem; margin: 1rem 0;">
        <a href="#" style="color: ${PETALLOCAL_BRANDING.primaryColor}; text-decoration: none; font-size: 0.875rem;">Browse Flowers</a>
        <a href="#" style="color: ${PETALLOCAL_BRANDING.primaryColor}; text-decoration: none; font-size: 0.875rem;">Find Growers</a>
        <a href="#" style="color: ${PETALLOCAL_BRANDING.primaryColor}; text-decoration: none; font-size: 0.875rem;">Support</a>
      </div>
      
      <div style="border-top: 1px solid ${PETALLOCAL_BRANDING.borderColor}; padding-top: 1rem; margin-top: 1.5rem;">
        <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 0.75rem; margin: 0;">
          © 2025 PetalLocal. Connecting local flower growers with flower lovers.
        </p>
        <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 0.75rem; margin: 0.5rem 0 0 0;">
          This email was sent to you because you have an account with PetalLocal.
        </p>
      </div>
    </div>
  </div>
`;

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    farmName: string;
  }>;
  total: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  orderDate: string;
}

interface WelcomeEmailData {
  userName: string;
  userRole: 'buyer' | 'farmer';
}

interface PasswordResetData {
  userName: string;
  resetLink: string;
}

class PetalLocalEmailService {
  private fromEmail = 'noreply@petallocal.com';
  
  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('📧 Email would be sent (SendGrid not configured):', {
          to: params.to,
          subject: params.subject,
          preview: params.text?.substring(0, 100) || 'HTML email'
        });
        return true;
      }

      await mailService.send({
        to: params.to,
        from: params.from || this.fromEmail,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      
      console.log('📧 Email sent successfully to:', params.to);
      return true;
    } catch (error) {
      console.error('📧 SendGrid email error:', error);
      return false;
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    const itemsHtml = data.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid ${PETALLOCAL_BRANDING.borderColor};">
        <div>
          <p style="margin: 0; font-weight: 600; color: ${PETALLOCAL_BRANDING.textColor};">
            ${item.name}
          </p>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: ${PETALLOCAL_BRANDING.mutedColor};">
            From ${item.farmName} • Quantity: ${item.quantity}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: 600; color: ${PETALLOCAL_BRANDING.textColor};">
            $${item.price.toFixed(2)}
          </p>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - PetalLocal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: ${PETALLOCAL_BRANDING.fontFamily}; background: ${PETALLOCAL_BRANDING.backgroundColor};">
        ${getEmailHeader()}
        
        <div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Main Content -->
            <div style="padding: 2rem;">
              <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; color: ${PETALLOCAL_BRANDING.primaryColor}; font-size: 1.5rem; margin: 0 0 0.5rem 0;">
                  Order Confirmation
                </h2>
                <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0; font-size: 1rem;">
                  Thank you for your beautiful flower order!
                </p>
              </div>

              <!-- Order Details -->
              <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: ${PETALLOCAL_BRANDING.textColor}; margin: 0 0 1rem 0; font-size: 1.125rem;">
                  Order #${data.orderNumber}
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <p style="margin: 0; color: ${PETALLOCAL_BRANDING.mutedColor};">
                    <strong style="color: ${PETALLOCAL_BRANDING.textColor};">Customer:</strong><br>
                    ${data.customerName}
                  </p>
                  <p style="margin: 0; color: ${PETALLOCAL_BRANDING.mutedColor};">
                    <strong style="color: ${PETALLOCAL_BRANDING.textColor};">Order Date:</strong><br>
                    ${new Date(data.orderDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <!-- Items -->
              <div style="margin-bottom: 2rem;">
                <h3 style="color: ${PETALLOCAL_BRANDING.textColor}; margin: 0 0 1rem 0; font-size: 1.125rem;">
                  Your Beautiful Flowers
                </h3>
                <div style="border: 1px solid ${PETALLOCAL_BRANDING.borderColor}; border-radius: 8px; padding: 1rem;">
                  ${itemsHtml}
                  
                  <!-- Total -->
                  <div style="display: flex; justify-content: space-between; padding: 1rem 0 0 0; border-top: 2px solid ${PETALLOCAL_BRANDING.primaryColor}; margin-top: 1rem;">
                    <p style="margin: 0; font-size: 1.125rem; font-weight: 700; color: ${PETALLOCAL_BRANDING.textColor};">
                      Total
                    </p>
                    <p style="margin: 0; font-size: 1.125rem; font-weight: 700; color: ${PETALLOCAL_BRANDING.primaryColor};">
                      $${data.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Delivery Info -->
              <div style="background: linear-gradient(135deg, ${PETALLOCAL_BRANDING.primaryColor}10, ${PETALLOCAL_BRANDING.primaryColor}05); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: ${PETALLOCAL_BRANDING.textColor}; margin: 0 0 1rem 0; font-size: 1.125rem;">
                  🚚 Delivery Information
                </h3>
                <p style="color: ${PETALLOCAL_BRANDING.textColor}; margin: 0; font-size: 1rem;">
                  <strong>Method:</strong> ${data.deliveryMethod === 'pickup' ? 'Farm Pickup' : 'Delivery'}
                </p>
                ${data.deliveryAddress ? `
                  <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0.5rem 0 0 0;">
                    <strong>Address:</strong> ${data.deliveryAddress}
                  </p>
                ` : ''}
                <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 1rem 0 0 0; font-size: 0.875rem;">
                  Our growers will prepare your fresh flowers with care. You'll receive pickup/delivery details soon!
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="#" style="display: inline-block; background: ${PETALLOCAL_BRANDING.primaryColor}; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 2px 8px rgba(10, 186, 181, 0.3);">
                  Track Your Order
                </a>
              </div>
            </div>
          </div>
        </div>

        ${getEmailFooter()}
      </body>
      </html>
    `;

    const text = `
Order Confirmation - PetalLocal

Thank you for your beautiful flower order!

Order #${data.orderNumber}
Customer: ${data.customerName}
Order Date: ${new Date(data.orderDate).toLocaleDateString()}

Your Flowers:
${data.items.map(item => 
  `${item.name} (${item.quantity}x) from ${item.farmName} - $${item.price.toFixed(2)}`
).join('\n')}

Total: $${data.total.toFixed(2)}

Delivery: ${data.deliveryMethod === 'pickup' ? 'Farm Pickup' : 'Delivery'}
${data.deliveryAddress ? `Address: ${data.deliveryAddress}` : ''}

Our growers will prepare your fresh flowers with care!

- The PetalLocal Team
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `🌸 Order Confirmation #${data.orderNumber} - Your Beautiful Flowers are Being Prepared!`,
      html,
      text,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData, email: string): Promise<boolean> {
    const isGrower = data.userRole === 'farmer';
    const roleTitle = isGrower ? 'Flower Grower' : 'Flower Lover';
    const welcomeMessage = isGrower 
      ? 'Start sharing your beautiful blooms with flower lovers in your community!'
      : 'Discover fresh, local flowers from passionate growers in your area!';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to PetalLocal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: ${PETALLOCAL_BRANDING.fontFamily}; background: ${PETALLOCAL_BRANDING.backgroundColor};">
        ${getEmailHeader()}
        
        <div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            
            <div style="padding: 2rem; text-align: center;">
              <h2 style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; color: ${PETALLOCAL_BRANDING.primaryColor}; font-size: 1.75rem; margin: 0 0 1rem 0;">
                Welcome to PetalLocal, ${data.userName}! 🌸
              </h2>
              
              <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 1.125rem; margin: 0 0 2rem 0;">
                You've joined as a <strong style="color: ${PETALLOCAL_BRANDING.primaryColor};">${roleTitle}</strong>
              </p>
              
              <p style="color: ${PETALLOCAL_BRANDING.textColor}; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
                ${welcomeMessage}
              </p>

              <!-- Feature Cards -->
              <div style="display: grid; gap: 1rem; margin: 2rem 0;">
                ${isGrower ? `
                  <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; text-align: left;">
                    <h3 style="color: ${PETALLOCAL_BRANDING.primaryColor}; margin: 0 0 0.5rem 0;">🌱 List Your Flowers</h3>
                    <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0; font-size: 0.875rem;">
                      Create beautiful listings for your fresh blooms and reach local customers
                    </p>
                  </div>
                  <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; text-align: left;">
                    <h3 style="color: ${PETALLOCAL_BRANDING.primaryColor}; margin: 0 0 0.5rem 0;">📊 Manage Orders</h3>
                    <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0; font-size: 0.875rem;">
                      Track sales, manage inventory, and connect with your flower-loving customers
                    </p>
                  </div>
                ` : `
                  <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; text-align: left;">
                    <h3 style="color: ${PETALLOCAL_BRANDING.primaryColor}; margin: 0 0 0.5rem 0;">🌸 Discover Flowers</h3>
                    <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0; font-size: 0.875rem;">
                      Browse fresh, local flowers from passionate growers in your community
                    </p>
                  </div>
                  <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; text-align: left;">
                    <h3 style="color: ${PETALLOCAL_BRANDING.primaryColor}; margin: 0 0 0.5rem 0;">🚚 Easy Ordering</h3>
                    <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; margin: 0; font-size: 0.875rem;">
                      Simple pickup or delivery options for the freshest flower experience
                    </p>
                  </div>
                `}
              </div>

              <div style="margin: 2rem 0;">
                <a href="#" style="display: inline-block; background: ${PETALLOCAL_BRANDING.primaryColor}; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 2px 8px rgba(10, 186, 181, 0.3);">
                  ${isGrower ? 'Start Selling Flowers' : 'Browse Fresh Flowers'}
                </a>
              </div>
            </div>
          </div>
        </div>

        ${getEmailFooter()}
      </body>
      </html>
    `;

    const text = `
Welcome to PetalLocal, ${data.userName}!

You've joined as a ${roleTitle}.

${welcomeMessage}

${isGrower ? `
As a flower grower, you can:
- List your beautiful flowers and reach local customers
- Manage orders and inventory with ease
- Connect with flower lovers in your community

Get started by creating your first flower listing!
` : `
As a flower lover, you can:
- Discover fresh, local flowers from passionate growers
- Support your local flower growing community  
- Enjoy convenient pickup or delivery options

Start browsing beautiful flowers in your area!
`}

Welcome to the PetalLocal community!

- The PetalLocal Team
    `;

    return this.sendEmail({
      to: email,
      subject: `🌸 Welcome to PetalLocal, ${data.userName}! Your flower journey begins now`,
      html,
      text,
    });
  }

  async sendPasswordReset(data: PasswordResetData, email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - PetalLocal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: ${PETALLOCAL_BRANDING.fontFamily}; background: ${PETALLOCAL_BRANDING.backgroundColor};">
        ${getEmailHeader()}
        
        <div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            
            <div style="padding: 2rem; text-align: center;">
              <h2 style="font-family: ${PETALLOCAL_BRANDING.fontFamily}; color: ${PETALLOCAL_BRANDING.textColor}; font-size: 1.5rem; margin: 0 0 1rem 0;">
                Password Reset Request
              </h2>
              
              <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
                Hi ${data.userName}, we received a request to reset your PetalLocal password.
              </p>
              
              <div style="background: ${PETALLOCAL_BRANDING.backgroundColor}; border-radius: 8px; padding: 1.5rem; margin: 2rem 0;">
                <p style="color: ${PETALLOCAL_BRANDING.textColor}; margin: 0 0 1rem 0;">
                  Click the button below to create a new password:
                </p>
                
                <a href="${data.resetLink}" style="display: inline-block; background: ${PETALLOCAL_BRANDING.primaryColor}; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 2px 8px rgba(10, 186, 181, 0.3);">
                  Reset My Password
                </a>
              </div>
              
              <div style="background: #FEF3C7; color: #92400E; border-radius: 8px; padding: 1rem; margin: 2rem 0; text-align: left;">
                <p style="margin: 0; font-size: 0.875rem;">
                  <strong>⚠️ Security Note:</strong> This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
                </p>
              </div>
              
              <p style="color: ${PETALLOCAL_BRANDING.mutedColor}; font-size: 0.875rem; margin: 1rem 0 0 0;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${data.resetLink}" style="color: ${PETALLOCAL_BRANDING.primaryColor}; word-break: break-all;">
                  ${data.resetLink}
                </a>
              </p>
            </div>
          </div>
        </div>

        ${getEmailFooter()}
      </body>
      </html>
    `;

    const text = `
Password Reset Request - PetalLocal

Hi ${data.userName},

We received a request to reset your PetalLocal password.

Click this link to create a new password:
${data.resetLink}

This link will expire in 24 hours. If you didn't request this reset, please ignore this email.

- The PetalLocal Team
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Password Reset Request - PetalLocal',
      html,
      text,
    });
  }
}

export const emailService = new PetalLocalEmailService();
export { OrderConfirmationData, WelcomeEmailData, PasswordResetData };