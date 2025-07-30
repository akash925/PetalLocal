import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeliveryOptions } from "@/components/delivery/DeliveryOptions";
import { QRPickupReceipt } from "@/components/delivery/QRPickupReceipt";
import { MapPin, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Link } from "wouter";

interface DeliveryOption {
  id: string;
  name: string;
  type: 'pickup' | 'local_delivery' | 'third_party';
  estimatedTime: string;
  fee: number;
  description: string;
  isAvailable: boolean;
}

export default function DeliveryPage() {
  const { items, total } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    address: '',
    city: '',
    state: 'CA',
    zipCode: '',
  });
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderId] = useState(123); // This would come from actual order creation

  // Get farm location from first item (simplified - in reality you'd handle multiple farms)
  const farmLocation = items.length > 0 ? {
    lat: 37.7749, // Default to SF coordinates
    lng: -122.4194
  } : null;

  const farmInfo = {
    name: "Sunset Valley Flowers",
    address: "123 Farm Road, Sonoma, CA 95476",
    phone: "(707) 555-0123"
  };

  const handleDeliverySelection = (option: DeliveryOption) => {
    setSelectedDelivery(option);
  };

  const handleConfirmOrder = () => {
    if (selectedDelivery?.id === 'pickup') {
      setShowReceipt(true);
    } else {
      // Handle delivery order creation
      console.log('Creating delivery order:', selectedDelivery);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some beautiful flowers to continue with delivery options.</p>
              <Link href="/flowers">
                <Button>Browse Flowers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showReceipt && selectedDelivery?.id === 'pickup') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowReceipt(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Delivery Options
            </Button>
          </div>
          
          <QRPickupReceipt
            orderId={orderId}
            orderTotal={total}
            farmInfo={farmInfo}
            items={items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            }))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold luxury-heading mb-2">Delivery & Pickup</h1>
          <p className="text-gray-600">Choose how you'd like to receive your flowers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-tiffany" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                      placeholder="San Francisco"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={customerInfo.state}
                      onChange={(e) => setCustomerInfo({...customerInfo, state: e.target.value})}
                      placeholder="CA"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={customerInfo.zipCode}
                      onChange={(e) => setCustomerInfo({...customerInfo, zipCode: e.target.value})}
                      placeholder="94102"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            {farmLocation && customerInfo.zipCode && (
              <DeliveryOptions
                farmLocation={farmLocation}
                customerZipCode={customerInfo.zipCode}
                onSelectionChange={handleDeliverySelection}
                selectedOption={selectedDelivery?.id}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.quantity} × ${item.price}</p>
                      <p className="text-xs text-gray-500">{item.farmName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <hr />
                
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                {selectedDelivery && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>
                      {selectedDelivery.fee === 0 ? 'Free' : `$${selectedDelivery.fee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                
                <hr />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>
                    ${(total + (selectedDelivery?.fee || 0)).toFixed(2)}
                  </span>
                </div>
                
                {selectedDelivery && (
                  <Button 
                    onClick={handleConfirmOrder}
                    className="w-full luxury-button"
                    size="lg"
                  >
                    {selectedDelivery.id === 'pickup' ? 'Generate Pickup Receipt' : 'Confirm Delivery Order'}
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {selectedDelivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Option</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedDelivery.name}</p>
                    <p className="text-sm text-gray-600">{selectedDelivery.description}</p>
                    <p className="text-sm">
                      <span className="font-medium">Estimated Time:</span> {selectedDelivery.estimatedTime}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fee:</span> {selectedDelivery.fee === 0 ? 'Free' : `$${selectedDelivery.fee.toFixed(2)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}