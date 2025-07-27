import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, Calendar, CreditCard, Download, Mail } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface Order {
  id: number;
  buyerId: number;
  status: string;
  totalAmount: number;
  deliveryMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OrderItem {
  id: number;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  flowerName: string;
  category: string;
  farmName: string;
}

export default function OrderTracking() {
  const [location] = useLocation();
  const orderId = new URLSearchParams(location.split('?')[1]).get('order') || location.split('/').pop();
  
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      preparing: "secondary",
      ready: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      paid: "default",
      failed: "destructive",
      refunded: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">
              We couldn't find an order with ID #{orderId}. Please check your order number.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const platformFee = order.totalAmount * 0.1;
  const farmerPayout = order.totalAmount - platformFee;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="luxury-heading text-3xl">Order #{order.id}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.status)}
          {getPaymentBadge(order.paymentStatus)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items?.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.flowerName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.farmName} • {item.category}
                    </p>
                    <p className="text-sm">
                      {item.quantity} × ${item.pricePerUnit.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Order items not found</p>
                <p className="text-sm">This may be a payment processing issue</p>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Platform Fee (10%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grower Receives</span>
                <span>${farmerPayout.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span className="text-[#0ABAB5]">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Customer</h4>
              <p className="text-muted-foreground">
                {order.buyer?.firstName} {order.buyer?.lastName}
              </p>
              <p className="text-muted-foreground">{order.buyer?.email}</p>
            </div>
            
            <div>
              <h4 className="font-medium">Delivery Method</h4>
              <p className="text-muted-foreground capitalize">{order.deliveryMethod}</p>
              {order.deliveryMethod === 'pickup' && (
                <p className="text-sm text-muted-foreground">
                  Pickup location will be provided by the grower
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium">Payment Status</h4>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                {getPaymentBadge(order.paymentStatus)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Order Actions</CardTitle>
          <CardDescription>
            Manage your order and get updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Resend Confirmation
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Contact Grower
            </Button>
          </div>
          
          {order.paymentStatus === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800">Payment Pending</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your payment is being processed. You'll receive an email confirmation once it's complete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}