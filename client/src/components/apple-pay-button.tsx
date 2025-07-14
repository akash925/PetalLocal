import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface ApplePayButtonProps {
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

function ApplePayComponent({ item, quantity, onSuccess }: ApplePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExpressCheckout = async (event: any) => {
    if (!stripe || !elements) {
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
      
      const data = await response.json();
      
      // Confirm payment with Apple Pay
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
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
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
  );
}

export function ApplePayButton({ item, quantity, onSuccess }: ApplePayButtonProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  
  const initializePayment = async () => {
    if (clientSecret) return; // Already initialized
    
    setIsInitializing(true);
    try {
      const total = item.price * quantity;
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: total,
        items: [{
          id: item.id,
          name: item.name,
          quantity: quantity,
          price: item.price,
        }],
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Failed to initialize payment:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleClick = () => {
    if (!clientSecret) {
      initializePayment();
    }
  };

  if (isInitializing) {
    return (
      <div className="w-full h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="text-sm text-gray-600 mb-2 text-center">
          Quick checkout with Apple Pay or Google Pay
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
            <ApplePayComponent item={item} quantity={quantity} onSuccess={onSuccess} />
          </Elements>
        ) : (
          <div
            onClick={handleClick}
            className="w-full h-10 bg-black text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium">📱 Pay with Apple Pay</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}