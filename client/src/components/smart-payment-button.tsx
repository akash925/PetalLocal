import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Smartphone } from "lucide-react";
import { GuestCheckoutModal } from "./guest-checkout-modal";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface SmartPaymentButtonProps {
  item: {
    id: number;
    name: string;
    price: number;
    unit: string;
    farmName: string;
    imageUrl?: string;
  };
  quantity: number;
  onSuccess: () => void;
}

function ExpressCheckoutComponent({ item, quantity, onSuccess }: SmartPaymentButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExpressCheckout = async (event: any) => {
    if (!stripe || !elements) {
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please select a quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const total = item.price * quantity;
      
      // Create payment intent for immediate purchase
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: total,
        items: [{
          id: item.id,
          name: item.name,
          quantity: quantity,
          price: item.price,
        }],
      });
      
      const paymentData = await response.json();
      
      if (!paymentData.clientSecret) {
        throw new Error("Payment setup failed - no client secret");
      }
      
      const { clientSecret } = paymentData;
      
      // Confirm payment with express checkout
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful!",
          description: `Successfully purchased ${quantity} ${item.unit}${quantity > 1 ? 's' : ''} of ${item.name}`,
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <ExpressCheckoutElement
          onConfirm={handleExpressCheckout}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
            layout: {
              maxColumns: 1,
              maxRows: 1,
            },
            paymentMethods: {
              applePay: 'always',
              googlePay: 'always',
            },
          }}
        />
      </div>
    </div>
  );
}

export function SmartPaymentButton({ item, quantity, onSuccess }: SmartPaymentButtonProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [paymentCapabilities, setPaymentCapabilities] = useState({
    applePay: false,
    googlePay: false,
    canMakePayments: false,
  });
  
  // Check payment capabilities on mount
  useEffect(() => {
    const checkPaymentCapabilities = async () => {
      try {
        // Check if Payment Request API is available
        if (window.PaymentRequest) {
          const supportedMethods = [
            { supportedMethods: 'https://apple.com/apple-pay' },
            { supportedMethods: 'https://google.com/pay' },
          ];
          
          const details = {
            total: { label: 'Test', amount: { currency: 'USD', value: '0.01' } },
          };
          
          const request = new PaymentRequest(supportedMethods, details);
          const canMakePayments = await request.canMakePayment();
          
          setPaymentCapabilities({
            applePay: canMakePayments && /iPad|iPhone|iPod/.test(navigator.userAgent),
            googlePay: canMakePayments && /Android/.test(navigator.userAgent),
            canMakePayments: canMakePayments || false,
          });
        } else {
          // Fallback: detect based on user agent
          setPaymentCapabilities({
            applePay: /iPad|iPhone|iPod/.test(navigator.userAgent),
            googlePay: /Android/.test(navigator.userAgent),
            canMakePayments: false,
          });
        }
      } catch (error) {
        console.log('Payment capability check failed:', error);
        setPaymentCapabilities({
          applePay: false,
          googlePay: false,
          canMakePayments: false,
        });
      }
    };
    
    checkPaymentCapabilities();
  }, []);
  
  const initializePayment = async (guestInfo?: { email: string; firstName: string; lastName: string }) => {
    if (clientSecret) return; // Already initialized
    
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please select a quantity greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    setIsInitializing(true);
    try {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const total = price * quantity;
      const items = [{
        id: item.id,
        name: item.name,
        quantity: quantity,
        price: item.price,
      }];
      
      let response;
      
      if (isAuthenticated) {
        // Use authenticated endpoint
        response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: total,
          items,
        });
      } else {
        // Use guest checkout endpoint
        if (!guestInfo) {
          // Show guest modal to collect info
          setShowGuestModal(true);
          return;
        }
        
        response = await apiRequest("POST", "/api/guest-checkout", {
          amount: total,
          items,
          guestInfo,
        });
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Login Required",
            description: "Please log in to complete your purchase",
            variant: "destructive",
          });
          // Redirect to login
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment setup failed");
      }
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      // Show success message for new guest users
      if (data.isNewUser) {
        toast({
          title: "Account Created",
          description: "We've created a secure account for you. Welcome to FarmDirect!",
        });
      }
    } catch (error) {
      console.error("Failed to initialize payment:", error);
      toast({
        title: "Payment Setup Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleClick = () => {
    if (!clientSecret) {
      initializePayment();
    }
  };

  const handleGuestCheckout = async (guestInfo: { email: string; firstName: string; lastName: string }) => {
    setShowGuestModal(false);
    await initializePayment(guestInfo);
  };

  if (isInitializing) {
    return (
      <div className="w-full h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  // Show express checkout if supported
  if (paymentCapabilities.canMakePayments || paymentCapabilities.applePay || paymentCapabilities.googlePay) {
    return (
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="text-sm text-gray-600 mb-2 text-center">
            <Smartphone className="w-4 h-4 inline mr-1" />
            {paymentCapabilities.applePay && paymentCapabilities.googlePay ? 
              'Quick checkout with Apple Pay or Google Pay' :
              paymentCapabilities.applePay ? 'Quick checkout with Apple Pay' :
              'Quick checkout with Google Pay'
            }
          </div>
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#16a34a',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <ExpressCheckoutComponent item={item} quantity={quantity} onSuccess={onSuccess} />
            </Elements>
          ) : (
            <div
              onClick={handleClick}
              className="w-full h-10 bg-black text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                {paymentCapabilities.applePay ? 'Pay with Apple Pay' :
                 paymentCapabilities.googlePay ? 'Pay with Google Pay' :
                 'Quick Pay'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback to standard checkout button
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="text-sm text-gray-600 mb-2 text-center">
            <CreditCard className="w-4 h-4 inline mr-1" />
            Secure checkout with card
          </div>
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#16a34a',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <ExpressCheckoutComponent item={item} quantity={quantity} onSuccess={onSuccess} />
            </Elements>
          ) : (
            <Button
              onClick={handleClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Now - ${(item.price * quantity).toFixed(2)}
            </Button>
          )}
        </CardContent>
      </Card>
      
      <GuestCheckoutModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onSubmit={handleGuestCheckout}
        onSignIn={() => {
          // After successful sign in, redirect to checkout
          setShowGuestModal(false);
          window.location.href = '/checkout';
        }}
        item={item}
        quantity={quantity}
      />
    </>
  );
}