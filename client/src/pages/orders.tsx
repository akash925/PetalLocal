import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import RefundRequestButton from "@/components/RefundRequestButton";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, Package, Truck, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  createdAt: string;
  items: Array<{
    id: number;
    flowerName: string;
    farmName?: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
}

export default function OrderHistory() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/customer"],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tiffany border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl luxury-heading text-luxury-black mb-4">Sign In Required</h1>
          <p className="text-lg luxury-subheading mb-8">
            Please sign in to view your order history
          </p>
          <Link href="/auth/login">
            <Button className="luxury-button">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl luxury-heading text-luxury-black mb-2">Your Orders</h1>
            <p className="text-lg luxury-subheading">
              Track your beautiful flower purchases and deliveries
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-tiffany to-tiffany/80 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Package className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl luxury-heading text-luxury-black mb-4">No Orders Yet</h2>
            <p className="text-lg luxury-subheading mb-8 max-w-md mx-auto">
              Start your flower journey by exploring our curated collection from local artisan growers
            </p>
            <Link href="/flowers/browse">
              <Button className="luxury-button px-10 py-4 text-lg">
                Discover Beautiful Flowers
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-tiffany/5 to-tiffany/10 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="luxury-heading">Order #{order.id}</CardTitle>
                      <OrderStatusBadge 
                        status={order.status} 
                        paymentStatus={order.paymentStatus}
                      />
                      <Badge variant="outline" className="capitalize">
                        {order.deliveryMethod === 'pickup' ? 'Farm Pickup' : 'Delivery'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-luxury-black">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy • h:mm a')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="luxury-subheading mb-4">Order Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Flower</TableHead>
                          <TableHead>Farm</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.flowerName}</TableCell>
                            <TableCell className="text-gray-600">{item.farmName || 'Local Farm'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">${item.totalPrice.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Delivery Information */}
                  {order.deliveryAddress && (
                    <div className="mb-6">
                      <h4 className="luxury-subheading mb-2">Delivery Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Truck className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="font-medium">Delivery Address</span>
                        </div>
                        <p className="text-gray-700">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  )}

                  {/* Order Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Ordered {format(new Date(order.createdAt), 'PPPP')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {(order.status !== 'cancelled' && order.status !== 'refunded') && (
                        <RefundRequestButton 
                          orderId={order.id}
                          orderAmount={order.totalAmount}
                          variant="outline"
                          size="sm"
                        />
                      )}
                      
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Reorder Items
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}