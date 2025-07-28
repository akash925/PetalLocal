import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { RefreshCw, Package, Truck, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  deliveryMethod: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    id: number;
    flowerName: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
}

export default function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get orders for current user (farmer)
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", "farmer"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const getStatusActions = (currentStatus: string) => {
    const statusFlow: Record<string, { next: string; label: string; icon: any }[]> = {
      'pending': [
        { next: 'confirmed', label: 'Confirm Order', icon: CheckCircle },
        { next: 'cancelled', label: 'Cancel Order', icon: XCircle }
      ],
      'confirmed': [
        { next: 'processing', label: 'Start Processing', icon: Package },
        { next: 'cancelled', label: 'Cancel Order', icon: XCircle }
      ],
      'processing': [
        { next: 'shipped', label: 'Mark as Shipped', icon: Truck },
        { next: 'cancelled', label: 'Cancel Order', icon: XCircle }
      ],
      'shipped': [
        { next: 'delivered', label: 'Mark as Delivered', icon: CheckCircle }
      ]
    };

    return statusFlow[currentStatus] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Order Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Order Management
          </div>
          <Badge variant="outline">{orders.length} Total Orders</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500">Orders for your flowers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">Order #{order.id}</h4>
                    <OrderStatusBadge 
                      status={order.status} 
                      paymentStatus={order.paymentStatus}
                      size="sm" 
                    />
                    <Badge variant="outline" className="text-xs">
                      {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">${order.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Customer</p>
                    <p className="text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Items</p>
                    <p className="text-sm">{order.items.length} flower variety(s)</p>
                    <p className="text-xs text-gray-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} total items
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  <div className="flex gap-2">
                    {getStatusActions(order.status).map((action) => {
                      const Icon = action.icon;
                      return (
                        <AlertDialog key={action.next}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant={action.next === 'cancelled' ? 'destructive' : 'default'} 
                              size="sm"
                              disabled={updateOrderMutation.isPending}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {action.label}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to {action.label.toLowerCase()} for Order #{order.id}?
                                {action.next === 'cancelled' && ' This action cannot be undone.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateOrderMutation.mutate({ 
                                  orderId: order.id, 
                                  status: action.next 
                                })}
                                className={action.next === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <AlertDialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Order #{selectedOrder.id} Details</AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p><strong>Method:</strong> {selectedOrder.deliveryMethod === 'pickup' ? 'Farm Pickup' : 'Delivery'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Status</h4>
                    <div className="space-y-2">
                      <OrderStatusBadge 
                        status={selectedOrder.status} 
                        paymentStatus={selectedOrder.paymentStatus}
                      />
                      <p className="text-sm text-gray-600">
                        Ordered: {format(new Date(selectedOrder.createdAt), 'PPpp')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flower</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.flowerName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                          <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                        <TableCell className="font-semibold">
                          ${selectedOrder.totalAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}