import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CreditCard, User, ShoppingCart } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  farmName: string;
  imageUrl?: string;
}

interface EnhancedCheckoutProps {
  items: CheckoutItem[];
  onSuccess: (orderId: number) => void;
  onCancel?: () => void;
}

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
}

function CheckoutForm({ items, onSuccess, onCancel }: EnhancedCheckoutProps) {
  const { user, isAuthenticated } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    email: '',
    firstName: '',
    lastName: '',
  });

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate guest info if not authenticated
    if (!isAuthenticated) {
      if (!guestInfo.email || !guestInfo.firstName || !guestInfo.lastName) {
        toast({
          title: "Information Required",
          description: "Please fill in all required fields to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Choose appropriate endpoint based on authentication status
      const endpoint = isAuthenticated ? "/api/create-payment-intent" : "/api/guest-checkout";
      const payload = {
        amount: total,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        ...(isAuthenticated ? {} : { guestInfo }),
      };

      const response = await apiRequest("POST", endpoint, payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      const { clientSecret, orderId } = await response.json();

      // Confirm payment with Stripe
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message || "Payment failed");
      }

      // Payment successful
      toast({
        title: "Payment Successful!",
        description: `Your order #${orderId} has been confirmed.`,
      });

      onSuccess(orderId);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">From {item.farmName}</p>
                  <p className="text-sm">
                    {item.quantity} {item.unit} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform Fee (10%):</span>
                <span>${(total * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information Form */}
        {!isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  We'll create an account for you and send order updates to this email
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Authenticated User Info */}
        {isAuthenticated && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <Badge variant="secondary">Logged in</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentElement />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Complete Purchase - $${total.toFixed(2)}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EnhancedCheckout({ items, onSuccess, onCancel }: EnhancedCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (items.length === 0) return;

    // For authenticated users, we can pre-initialize the payment intent
    if (isAuthenticated) {
      initializePayment();
    }
  }, [items, isAuthenticated]);

  const initializePayment = async () => {
    setIsInitializing(true);
    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: total,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
      }
    } catch (error) {
      console.error("Failed to initialize payment:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Setting up your checkout...</p>
        </div>
      </div>
    );
  }

  // For guests, we don't need a pre-initialized client secret
  // For authenticated users, we can optionally pre-initialize
  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        borderRadius: '8px',
      },
    },
  } : {
    mode: 'payment' as const,
    amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100,
    currency: 'usd',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#16a34a',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm items={items} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}