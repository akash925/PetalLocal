import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertProduceItemSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingProduce, setIsAddingProduce] = useState(false);

  // Get farmer's farms
  const { data: farms = [] } = useQuery({
    queryKey: ["/api/farms", "owned", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/farms/owned/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch farms");
      return response.json();
    },
    enabled: !!user,
  });

  // Get farmer's produce items
  const { data: produceItems = [] } = useQuery({
    queryKey: ["/api/produce", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/produce");
      if (!response.ok) throw new Error("Failed to fetch produce");
      const allProduce = await response.json();
      // Filter to only show produce from farmer's farms
      const farmIds = farms.map(f => f.id);
      return allProduce.filter(item => farmIds.includes(item.farmId));
    },
    enabled: !!user && farms.length > 0,
  });

  const form = useForm({
    resolver: zodResolver(insertProduceItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      variety: "",
      unit: "",
      pricePerUnit: "",
      isOrganic: false,
      isSeasonal: false,
      isHeirloom: false,
    },
  });

  const createProduceMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/produce", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Produce item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/produce"] });
      setIsAddingProduce(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const farmId = farms.length > 0 ? farms[0].id : null;
    if (!farmId) {
      toast({
        title: "Error",
        description: "You need to create a farm first before adding produce.",
        variant: "destructive",
      });
      return;
    }
    
    createProduceMutation.mutate({
      ...data,
      pricePerUnit: parseFloat(data.pricePerUnit),
      farmId: farmId,
    });
  };

  if (user?.role !== "farmer") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be a farmer to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmer Dashboard</h1>
          <p className="text-gray-600">Manage your farm and produce listings</p>
        </div>

        <Tabs defaultValue="produce" className="space-y-6">
          <TabsList>
            <TabsTrigger value="produce">My Produce</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="farm">Farm Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="produce" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Produce Items</h2>
              <Button
                onClick={() => setIsAddingProduce(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Produce
              </Button>
            </div>

            {isAddingProduce && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Produce Item</CardTitle>
                  <CardDescription>
                    Create a new listing for your farm produce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Fresh Tomatoes" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="vegetables">Vegetables</SelectItem>
                                  <SelectItem value="fruits">Fruits</SelectItem>
                                  <SelectItem value="herbs">Herbs</SelectItem>
                                  <SelectItem value="bakery">Bakery</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your produce..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="pricePerUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price per Unit</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="lb">Pound (lb)</SelectItem>
                                  <SelectItem value="pint">Pint</SelectItem>
                                  <SelectItem value="bunch">Bunch</SelectItem>
                                  <SelectItem value="each">Each</SelectItem>
                                  <SelectItem value="bag">Bag</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="variety"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Variety (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Cherry, Roma" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={createProduceMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {createProduceMutation.isPending ? "Creating..." : "Create Produce Item"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingProduce(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Produce Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produceItems.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline">{item.category}</Badge>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">
                          ${parseFloat(item.pricePerUnit).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          per {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Package className="w-4 h-4" />
                        <span>In Stock</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {produceItems.length === 0 && !isAddingProduce && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No produce items yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your first produce item to your farm.
                </p>
                <Button
                  onClick={() => setIsAddingProduce(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Orders for your produce items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="farm">
            <Card>
              <CardHeader>
                <CardTitle>Farm Profile</CardTitle>
                <CardDescription>
                  Manage your farm information and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Farm profile management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
