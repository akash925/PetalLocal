import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RefreshCw, DollarSign, AlertCircle, CheckCircle, Clock, Mail, User, Store } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RefundRequest {
  id: number;
  orderId: number;
  requesterId: number;
  requesterType: 'buyer' | 'seller';
  requesterName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
  orderDetails: {
    buyerName: string;
    buyerEmail: string;
    items: Array<{
      flowerName: string;
      quantity: number;
      price: number;
    }>;
  };
}

export default function RefundRequestsTab() {
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get refund requests
  const { data: refundRequests = [], isLoading } = useQuery<RefundRequest[]>({
    queryKey: ["/api/admin/refund-requests"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async ({ requestId, action, notes }: { requestId: number; action: 'approve' | 'decline'; notes?: string }) => {
      return apiRequest(`/api/admin/refund-requests/${requestId}/process`, {
        method: 'POST',
        body: { action, adminNotes: notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "Refund Request Processed",
        description: "The refund request has been processed and notifications sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refund-requests"] });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process refund request",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequesterIcon = (type: string) => {
    return type === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />;
  };

  const pendingRequests = refundRequests.filter(r => r.status === 'pending');
  const processedRequests = refundRequests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending Requests</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{pendingRequests.length}</div>
            <p className="text-xs text-yellow-700 mt-1">
              ${pendingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total value
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Approved This Month</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {processedRequests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-green-700 mt-1">
              ${processedRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0).toFixed(2)} refunded
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Email Notifications</CardTitle>
            <Mail className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {refundRequests.length}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Auto-notifications sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests Management */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="processed">Processed Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                Pending Refund Requests
              </CardTitle>
              <CardDescription>
                Review and process refund requests from buyers and sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground">All refund requests have been processed.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">#{request.orderId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRequesterIcon(request.requesterType)}
                            <div>
                              <div className="font-medium">{request.requesterName}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {request.requesterType}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">${request.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                        <TableCell>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Refund Request Review</DialogTitle>
                                <DialogDescription>
                                  Order #{request.orderId} - Requested by {request.requesterName}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                {/* Request Details */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium mb-2">Request Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="font-medium">Amount:</span> ${request.amount.toFixed(2)}</div>
                                      <div><span className="font-medium">Requester:</span> {request.requesterName} ({request.requesterType})</div>
                                      <div><span className="font-medium">Date:</span> {format(new Date(request.createdAt), 'PPpp')}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Order Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="font-medium">Customer:</span> {request.orderDetails.buyerName}</div>
                                      <div><span className="font-medium">Email:</span> {request.orderDetails.buyerEmail}</div>
                                      <div><span className="font-medium">Items:</span> {request.orderDetails.items.length} flower(s)</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Reason */}
                                <div>
                                  <h4 className="font-medium mb-2">Refund Reason</h4>
                                  <div className="bg-gray-50 p-3 rounded text-sm">
                                    {request.reason}
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {request.orderDetails.items.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                          <div className="font-medium">{item.flowerName}</div>
                                          <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                                        </div>
                                        <div className="font-medium">${item.price.toFixed(2)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Refund
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Approve Refund Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will approve the refund of ${request.amount.toFixed(2)} for order #{request.orderId}. 
                                          The customer and seller will be notified via email.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => processRefundMutation.mutate({ 
                                            requestId: request.id, 
                                            action: 'approve' 
                                          })}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Confirm Approval
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Decline Refund
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Decline Refund Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will decline the refund request for order #{request.orderId}. 
                                          The requester will be notified via email.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => processRefundMutation.mutate({ 
                                            requestId: request.id, 
                                            action: 'decline' 
                                          })}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Confirm Decline
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
                Processed Refund Requests
              </CardTitle>
              <CardDescription>
                History of approved and declined refund requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.orderId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRequesterIcon(request.requesterType)}
                          <div>
                            <div className="font-medium">{request.requesterName}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {request.requesterType}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${request.amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.processedAt ? format(new Date(request.processedAt), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}