import crypto from 'crypto';
import QRCode from 'qrcode';

export interface DeliveryOption {
  id: string;
  name: string;
  type: 'pickup' | 'local_delivery' | 'third_party';
  estimatedTime: string;
  fee: number;
  description: string;
  isAvailable: boolean;
}

export interface DeliveryEstimate {
  providerId: string;
  providerName: string;
  estimatedFee: number;
  estimatedTime: number; // minutes
  maxDistance: number; // miles
  isAvailable: boolean;
}

export class DeliveryService {
  // Generate QR code for pickup verification
  async generatePickupQR(orderId: number, orderTotal: number): Promise<string> {
    const qrData = {
      orderId,
      orderTotal,
      timestamp: Date.now(),
      hash: this.generateSecureHash(orderId, orderTotal),
    };
    
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });
    
    return qrCodeDataURL;
  }

  // Verify QR code during pickup
  async verifyPickupQR(qrData: string, expectedOrderId: number): Promise<boolean> {
    try {
      const data = JSON.parse(qrData);
      const { orderId, orderTotal, timestamp, hash } = data;
      
      // Check if order ID matches
      if (orderId !== expectedOrderId) return false;
      
      // Check if QR code is not expired (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - timestamp > maxAge) return false;
      
      // Verify hash integrity
      const expectedHash = this.generateSecureHash(orderId, orderTotal);
      return hash === expectedHash;
    } catch {
      return false;
    }
  }

  // Get available delivery options for a location
  async getDeliveryOptions(zipCode: string, farmLocation: { lat: number; lng: number }): Promise<DeliveryOption[]> {
    const options: DeliveryOption[] = [];

    // Always available: Pickup
    options.push({
      id: 'pickup',
      name: 'Farm Pickup',
      type: 'pickup',
      estimatedTime: 'Available now',
      fee: 0,
      description: 'Pick up your flowers directly from the farm. Show your order QR code.',
      isAvailable: true,
    });

    // Local delivery (if within range)
    const localDeliveryRange = 15; // miles
    options.push({
      id: 'local_delivery',
      name: 'Local Delivery',
      type: 'local_delivery',
      estimatedTime: '1-2 hours',
      fee: 8.99,
      description: 'Same-day delivery within 15 miles of the farm.',
      isAvailable: await this.checkLocalDeliveryAvailability(zipCode, farmLocation, localDeliveryRange),
    });

    // Third-party delivery options
    const thirdPartyOptions = await this.getThirdPartyDeliveryOptions(zipCode, farmLocation);
    options.push(...thirdPartyOptions);

    return options;
  }

  // Calculate delivery estimates for third-party services
  async getDeliveryEstimates(zipCode: string, farmLocation: { lat: number; lng: number }): Promise<DeliveryEstimate[]> {
    const estimates: DeliveryEstimate[] = [];

    // DoorDash estimate (mock for now - replace with actual API)
    estimates.push({
      providerId: 'doordash',
      providerName: 'DoorDash',
      estimatedFee: 4.99,
      estimatedTime: 35,
      maxDistance: 10,
      isAvailable: await this.checkDoorDashAvailability(zipCode),
    });

    // Uber Eats estimate
    estimates.push({
      providerId: 'uber_eats',
      providerName: 'Uber Eats',
      estimatedFee: 3.99,
      estimatedTime: 30,
      maxDistance: 8,
      isAvailable: await this.checkUberEatsAvailability(zipCode),
    });

    // Grubhub estimate
    estimates.push({
      providerId: 'grubhub',
      providerName: 'Grubhub',
      estimatedFee: 5.99,
      estimatedTime: 40,
      maxDistance: 12,
      isAvailable: await this.checkGrubhubAvailability(zipCode),
    });

    return estimates.filter(estimate => estimate.isAvailable);
  }

  // Create delivery order with third-party service
  async createDeliveryOrder(
    providerId: string,
    orderData: {
      orderId: number;
      items: Array<{ name: string; quantity: number; price: number }>;
      customerInfo: { name: string; phone: string; address: string };
      farmInfo: { name: string; address: string; phone: string };
      totalAmount: number;
    }
  ): Promise<{ success: boolean; trackingId?: string; estimatedDelivery?: Date; error?: string }> {
    
    switch (providerId) {
      case 'doordash':
        return this.createDoorDashOrder(orderData);
      case 'uber_eats':
        return this.createUberEatsOrder(orderData);
      case 'grubhub':
        return this.createGrubhubOrder(orderData);
      case 'local_delivery':
        return this.createLocalDeliveryOrder(orderData);
      default:
        return { success: false, error: 'Unknown delivery provider' };
    }
  }

  // Private helper methods
  private generateSecureHash(orderId: number, orderTotal: number): string {
    const secret = process.env.QR_SECRET || 'default-secret-change-in-production';
    return crypto
      .createHmac('sha256', secret)
      .update(`${orderId}-${orderTotal}-${secret}`)
      .digest('hex');
  }

  private async checkLocalDeliveryAvailability(
    zipCode: string, 
    farmLocation: { lat: number; lng: number }, 
    maxDistance: number
  ): Promise<boolean> {
    // Implementation: Check if delivery address is within range
    // For now, assume available for California zip codes
    return zipCode.startsWith('9') && zipCode.length === 5;
  }

  private async getThirdPartyDeliveryOptions(
    zipCode: string, 
    farmLocation: { lat: number; lng: number }
  ): Promise<DeliveryOption[]> {
    const options: DeliveryOption[] = [];

    // DoorDash option
    if (await this.checkDoorDashAvailability(zipCode)) {
      options.push({
        id: 'doordash',
        name: 'DoorDash',
        type: 'third_party',
        estimatedTime: '30-45 minutes',
        fee: 4.99,
        description: 'Professional delivery through DoorDash network.',
        isAvailable: true,
      });
    }

    // Uber Eats option
    if (await this.checkUberEatsAvailability(zipCode)) {
      options.push({
        id: 'uber_eats',
        name: 'Uber Eats',
        type: 'third_party',
        estimatedTime: '25-40 minutes',
        fee: 3.99,
        description: 'Fast delivery through Uber Eats platform.',
        isAvailable: true,
      });
    }

    return options;
  }

  private async checkDoorDashAvailability(zipCode: string): Promise<boolean> {
    // Mock implementation - replace with actual DoorDash API call
    const californiaZipCodes = ['90', '91', '92', '93', '94', '95', '96'];
    return californiaZipCodes.some(prefix => zipCode.startsWith(prefix));
  }

  private async checkUberEatsAvailability(zipCode: string): Promise<boolean> {
    // Mock implementation - replace with actual Uber Eats API call
    const californiaZipCodes = ['90', '91', '92', '93', '94', '95', '96'];
    return californiaZipCodes.some(prefix => zipCode.startsWith(prefix));
  }

  private async checkGrubhubAvailability(zipCode: string): Promise<boolean> {
    // Mock implementation - replace with actual Grubhub API call
    const californiaZipCodes = ['90', '91', '92', '93', '94', '95', '96'];
    return californiaZipCodes.some(prefix => zipCode.startsWith(prefix));
  }

  private async createDoorDashOrder(orderData: any): Promise<any> {
    // Mock implementation - replace with actual DoorDash API integration
    // Documentation: https://developer.doordash.com/en-US/
    return {
      success: true,
      trackingId: `DD-${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 35 * 60 * 1000), // 35 minutes
    };
  }

  private async createUberEatsOrder(orderData: any): Promise<any> {
    // Mock implementation - replace with actual Uber Eats API integration
    // Documentation: https://developer.uber.com/docs/eats/introduction
    return {
      success: true,
      trackingId: `UE-${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  private async createGrubhubOrder(orderData: any): Promise<any> {
    // Mock implementation - replace with actual Grubhub API integration
    return {
      success: true,
      trackingId: `GH-${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 40 * 60 * 1000), // 40 minutes
    };
  }

  private async createLocalDeliveryOrder(orderData: any): Promise<any> {
    // Implementation for local delivery management
    return {
      success: true,
      trackingId: `LOCAL-${Date.now()}`,
      estimatedDelivery: new Date(Date.now() + 90 * 60 * 1000), // 1.5 hours
    };
  }
}

export const deliveryService = new DeliveryService();