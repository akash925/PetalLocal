// Test script for email functionality
const { emailService } = require('./services/email/sendgrid.ts');

async function testEmails() {
  console.log('Testing PetalLocal Email System...\n');

  // Test order confirmation email
  console.log('📧 Testing Order Confirmation Email...');
  const orderData = {
    orderNumber: "TEST123",
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    items: [
      {
        name: "Beautiful Red Roses",
        quantity: 12,
        price: 24.00,
        farmName: "Sunrise Flower Farm"
      },
      {
        name: "White Lily Bouquet",
        quantity: 1,
        price: 15.50,
        farmName: "Garden Dreams"
      }
    ],
    total: 39.50,
    deliveryMethod: "delivery",
    deliveryAddress: "123 Flower Street, Bloom City, CA 90210",
    orderDate: new Date().toISOString()
  };

  try {
    const result = await emailService.sendOrderConfirmation(orderData);
    console.log('✅ Order confirmation email result:', result);
  } catch (error) {
    console.log('❌ Order confirmation email error:', error.message);
  }

  // Test welcome email
  console.log('\n📧 Testing Welcome Email (Buyer)...');
  try {
    const result = await emailService.sendWelcomeEmail(
      {
        userName: "Jane",
        userRole: "buyer"
      },
      "jane@example.com"
    );
    console.log('✅ Welcome email (buyer) result:', result);
  } catch (error) {
    console.log('❌ Welcome email (buyer) error:', error.message);
  }

  console.log('\n📧 Testing Welcome Email (Farmer)...');
  try {
    const result = await emailService.sendWelcomeEmail(
      {
        userName: "John",
        userRole: "farmer"
      },
      "john@example.com"
    );
    console.log('✅ Welcome email (farmer) result:', result);
  } catch (error) {
    console.log('❌ Welcome email (farmer) error:', error.message);
  }

  // Test password reset email
  console.log('\n📧 Testing Password Reset Email...');
  try {
    const result = await emailService.sendPasswordReset(
      {
        userName: "Test User",
        resetLink: "https://petallocal.app/reset-password?token=abc123xyz"
      },
      "test@example.com"
    );
    console.log('✅ Password reset email result:', result);
  } catch (error) {
    console.log('❌ Password reset email error:', error.message);
  }

  console.log('\n🌸 Email system testing complete!');
}

testEmails().catch(console.error);