import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Tractor, ShoppingBag, DollarSign, Settings, TrendingUp, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistance } from "date-fns";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [platformFeeRate, setPlatformFeeRate] = useState("10");
  const { toast } = useToast();

  // Redirect non-admin users immediately
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = "/";
      return;
    }
  }, [isLoading, isAuthenticated, user]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Protect route - don't render content for non-admins
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  // Fetch all data for admin overview
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: farms = [] } = useQuery({
    queryKey: ["/api/admin/farms"],
  });

  const { data: produce = [] } = useQuery({
    queryKey: ["/api/admin/produce"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const { data: analytics = {} } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: platformConfig = {} } = useQuery({
    queryKey: ["/api/admin/config"],
  });

  // Update platform fee mutation
  const updatePlatformFeeMutation = useMutation({
    mutationFn: async (newRate: string) => {
      const decimalRate = parseFloat(newRate) / 100; // Convert percentage to decimal
      await apiRequest("PUT", "/api/admin/config", { 
        platformFeeRate: decimalRate 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({
        title: "Platform fee updated",
        description: `Platform fee rate set to ${platformFeeRate}%`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update platform fee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // User status update mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User status updated",
        description: "User account status has been changed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      description: `${users.filter((u: any) => u.role === 'farmer').length} farmers, ${users.filter((u: any) => u.role === 'buyer').length} buyers`,
    },
    {
      title: "Active Farms",
      value: farms.filter((f: any) => f.isActive).length,
      icon: Tractor,
      description: `${farms.filter((f: any) => f.isOrganic).length} organic certified`,
    },
    {
      title: "Total Products",
      value: produce.length,
      icon: Package,
      description: `${produce.filter((p: any) => p.isActive).length} active listings`,
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingBag,
      description: `$${orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0).toFixed(2)} total revenue`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, farms, products, and platform settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="farms">Farms</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'farmer' ? 'secondary' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistance(new Date(user.createdAt), new Date(), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatusMutation.mutate({
                              userId: user.id,
                              isActive: !user.isActive
                            })}
                            disabled={user.role === 'admin'}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farms Tab */}
          <TabsContent value="farms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Farm Management</CardTitle>
                <CardDescription>
                  View and manage all registered farms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farm Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Organic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farms.map((farm: any) => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">{farm.name}</TableCell>
                        <TableCell>{farm.owner?.firstName} {farm.owner?.lastName}</TableCell>
                        <TableCell>{farm.city}, {farm.state}</TableCell>
                        <TableCell>
                          <Badge variant={farm.isOrganic ? 'default' : 'outline'}>
                            {farm.isOrganic ? 'Organic' : 'Conventional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={farm.isActive ? 'default' : 'destructive'}>
                            {farm.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {farm.produceItems?.length || 0} items
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  View and manage all produce listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Farm</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attributes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produce.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.farm?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>${product.pricePerUnit}/{product.unit}</TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'default' : 'destructive'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {product.isOrganic && <Badge variant="secondary" className="text-xs">Organic</Badge>}
                            {product.isHeirloom && <Badge variant="secondary" className="text-xs">Heirloom</Badge>}
                            {product.isSeasonal && <Badge variant="secondary" className="text-xs">Seasonal</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  View and track all platform orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.buyer?.firstName} {order.buyer?.lastName}</TableCell>
                        <TableCell>${order.totalAmount}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.paymentStatus === 'paid' ? 'default' :
                            order.paymentStatus === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Fee Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Platform Fee Configuration
                  </CardTitle>
                  <CardDescription>
                    Adjust the platform's revenue share percentage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="platformFee">Platform Fee Rate (%)</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        id="platformFee"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={platformFeeRate}
                        onChange={(e) => setPlatformFeeRate(e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current rate: {((platformConfig.platformFeeRate || 0.10) * 100).toFixed(1)}%
                  </div>
                  <Button 
                    onClick={() => updatePlatformFeeMutation.mutate(platformFeeRate)}
                    disabled={updatePlatformFeeMutation.isPending}
                  >
                    {updatePlatformFeeMutation.isPending ? 'Updating...' : 'Update Platform Fee'}
                  </Button>
                </CardContent>
              </Card>

              {/* Analytics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                  <CardDescription>
                    Platform revenue and fee breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Total Order Value</div>
                      <div className="text-2xl font-bold">
                        ${orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Platform Revenue ({((platformConfig.platformFeeRate || 0.10) * 100).toFixed(1)}%)</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${(orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0) * (platformConfig.platformFeeRate || 0.10)).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Farmer Payouts ({(100 - ((platformConfig.platformFeeRate || 0.10) * 100)).toFixed(1)}%)</div>
                      <div className="text-2xl font-bold">
                        ${(orders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0) * (1 - (platformConfig.platformFeeRate || 0.10))).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}