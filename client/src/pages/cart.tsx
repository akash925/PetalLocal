import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        totalAmount: total,
        deliveryMethod: "pickup", // Default to pickup
        items: items.map(item => ({
          produceItemId: item.id,
          quantity: item.quantity,
          pricePerUnit: item.price,
        })),
      };
      
      await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation email shortly.",
      });
      clearCart();
    },
    onError: (error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to signup with return URL to delivery
      window.location.href = '/auth/register?redirect=/delivery';
      return;
    }
    
    // Redirect to delivery page
    window.location.href = '/delivery';
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-gradient-to-r from-tiffany to-tiffany/80 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <ShoppingBag className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl luxury-heading text-luxury-black mb-4">Your Shopping Bag Awaits</h1>
          <p className="text-lg luxury-subheading mb-8 leading-relaxed">
            Discover exquisite flowers from distinguished artisan growers for life's most treasured moments
          </p>
          <Link href="/flowers/browse">
            <Button className="luxury-button px-10 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
              Explore Luxury Collection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.farmName}</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${item.price.toFixed(2)} per {item.unit}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-3 py-1 min-w-[40px] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>Free</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-800 mb-2">
                      Sign in to complete your order
                    </p>
                    <p className="text-xs text-blue-600">
                      New to FarmDirect? Create an account at checkout
                    </p>
                  </div>
                )}

                <Button
                  className="w-full luxury-button"
                  size="lg"
                  onClick={handleCheckout}
                >
                  {!isAuthenticated ? "Sign In & Checkout" : "Choose Delivery Options"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
