import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, MapPin, Calendar, Package, Download, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OrderDetails {
  id: number;
  buyerId: number;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    pricePerUnit: string;
    totalPrice: string;
    produceItem: {
      name: string;
      category: string;
      unit: string;
      imageUrl: string;
      farm: {
        name: string;
        address: string;
        city: string;
        state: string;
        contactEmail: string;
        contactPhone: string;
      };
    };
  }>;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function OrderConfirmation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  // Extract order ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const orderId = urlParams.get('orderId');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to view your order details",
        variant: "destructive",
      });
      return;
    }

    if (isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, isLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      
      const data = await response.json();
      setOrderDetails(data);
      
      // Send confirmation email
      await sendConfirmationEmail(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendConfirmationEmail = async (order: OrderDetails) => {
    try {
      const response = await apiRequest("POST", `/api/send-order-confirmation`, {
        orderId: order.id,
        buyerEmail: order.buyer.email,
        farmEmails: order.items.map(item => item.produceItem.farm.contactEmail).filter(Boolean),
      });
      
      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Confirmation Sent",
          description: "Order confirmation has been sent to your email",
        });
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await apiRequest("GET", `/api/orders/${orderId}/receipt`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-${orderId}-receipt.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login Required</h1>
            <p className="text-gray-600 mb-6">Please log in to view your order confirmation</p>
            <Button asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The requested order could not be found</p>
            <Button asChild className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const platformFee = parseFloat(orderDetails.totalAmount) * 0.1;
  const farmerAmount = parseFloat(orderDetails.totalAmount) - platformFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          {emailSent && (
            <p className="text-sm text-green-600 mt-2">
              📧 Confirmation emails have been sent to all parties
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Number:</span>
                <span className="font-medium">#{orderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Date:</span>
                <span className="font-medium">
                  {new Date(orderDetails.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={orderDetails.status === 'confirmed' ? 'default' : 'secondary'}>
                  {orderDetails.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payment:</span>
                <Badge variant={orderDetails.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {orderDetails.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery:</span>
                <span className="font-medium capitalize">{orderDetails.deliveryMethod}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium">${orderDetails.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee (10%):</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Farmer Receives:</span>
                  <span>${farmerAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${orderDetails.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium">
                  {orderDetails.buyer.firstName} {orderDetails.buyer.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{orderDetails.buyer.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Delivery Method:</span>
                <p className="font-medium capitalize">{orderDetails.deliveryMethod}</p>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  onClick={downloadReceipt}
                  variant="outline" 
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/orders">
                    <Package className="w-4 h-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.produceItem.imageUrl && (
                    <img
                      src={item.produceItem.imageUrl}
                      alt={item.produceItem.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.produceItem.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {item.produceItem.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      From: {item.produceItem.farm.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        Quantity: {item.quantity} {item.produceItem.unit}
                      </span>
                      <span className="text-sm">
                        Price: ${item.pricePerUnit} per {item.produceItem.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${item.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Farm Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Farm Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">{item.produceItem.farm.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {item.produceItem.farm.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>
                          {item.produceItem.farm.address}, {item.produceItem.farm.city}, {item.produceItem.farm.state}
                        </span>
                      </div>
                    )}
                    {item.produceItem.farm.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a 
                          href={`mailto:${item.produceItem.farm.contactEmail}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.produceItem.farm.contactEmail}
                        </a>
                      </div>
                    )}
                    {item.produceItem.farm.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <a 
                          href={`tel:${item.produceItem.farm.contactPhone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.produceItem.farm.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 text-center">
          <div className="space-y-4">
            <p className="text-gray-600">
              Need help with your order? Contact us at support@farmdirect.com
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/">Continue Shopping</Link>
              </Button>
              <Button asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}