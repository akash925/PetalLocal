import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, Banknote } from "lucide-react";
import { format } from "date-fns";

interface PaymentDetails {
  orderId: number;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentId?: string;
  platformFee: number;
  growerPayout: number;
  createdAt: string;
  buyerName: string;
  items: string[];
}

interface BankBalance {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalPlatformFees: number;
  totalGrowerPayouts: number;
}

export default function FinancialTab() {
  // Get financial overview
  const { data: bankBalance, isLoading: balanceLoading } = useQuery<BankBalance>({
    queryKey: ["/api/admin/bank-balance"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get detailed payment information
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDetails[]>({
    queryKey: ["/api/admin/payments"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (balanceLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bank Balance Overview */}
      <div>
        <h2 className="text-2xl luxury-heading text-luxury-black mb-6">PetalLocal Bank Dashboard</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Balance</CardTitle>
              <Banknote className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                ${bankBalance?.totalBalance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-green-700 mt-1">
                Available: ${bankBalance?.availableBalance?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Platform Fees Earned</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                ${bankBalance?.totalPlatformFees?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                10% commission on sales
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Grower Payouts</CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                ${bankBalance?.totalGrowerPayouts?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                90% paid to growers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Pending Balance</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                ${bankBalance?.pendingBalance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-orange-700 mt-1">
                {bankBalance?.pendingPayments || 0} pending payments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Status Breakdown */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Payment Details</TabsTrigger>
          <TabsTrigger value="analytics">Payment Analytics</TabsTrigger>
          <TabsTrigger value="reconciliation">Bank Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-tiffany" />
                Payment Transaction Details
              </CardTitle>
              <CardDescription>
                Real-time payment status and money flow tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Grower Payout</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <TableRow key={payment.orderId}>
                        <TableCell className="font-medium">#{payment.orderId}</TableCell>
                        <TableCell>{payment.buyerName}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${payment.platformFee.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          ${payment.growerPayout.toFixed(2)}
                        </TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No payment transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Completed Payments</span>
                    <span className="text-green-600 font-semibold">
                      {bankBalance?.completedPayments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Payments</span>
                    <span className="text-yellow-600 font-semibold">
                      {bankBalance?.pendingPayments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Payments</span>
                    <span className="text-red-600 font-semibold">
                      {bankBalance?.failedPayments || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-bold text-lg">${bankBalance?.totalBalance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Platform Commission (10%)</span>
                    <span className="text-green-600 font-semibold">
                      ${bankBalance?.totalPlatformFees?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Grower Earnings (90%)</span>
                    <span className="text-blue-600 font-semibold">
                      ${bankBalance?.totalGrowerPayouts?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Bank Reconciliation</CardTitle>
              <CardDescription>
                Verify payment processing and account balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Verified Transactions</h3>
                  <p className="text-green-700">
                    {bankBalance?.completedPayments || 0} payments successfully processed and verified
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Pending Verification</h3>
                  <p className="text-yellow-700">
                    {bankBalance?.pendingPayments || 0} payments awaiting confirmation
                  </p>
                </div>

                <Button className="luxury-button">
                  Refresh Bank Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}