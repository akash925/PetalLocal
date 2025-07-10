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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertProduceItemSchema, insertFarmSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingProduce, setIsAddingProduce] = useState(false);
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);

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
      pricePerUnit: 0,
      isOrganic: false,
      isSeasonal: false,
      isHeirloom: false,
    },
  });

  const farmForm = useForm({
    resolver: zodResolver(insertFarmSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      website: "",
      isOrganic: false,
    },
  });

  const createProduceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/produce", data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Produce item created successfully and is now available for purchase",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/produce"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produce", user?.id] });
      setIsAddingProduce(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating produce",
        description: error.message || "Failed to create produce item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createFarmMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/farms", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Farm created successfully!",
        description: "Your farm profile is now live and ready for produce listings",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/farms", "owned", user?.id] });
      setIsCreatingFarm(false);
      farmForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating farm",
        description: error.message || "Failed to create farm profile. Please try again.",
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

  const onFarmSubmit = (data: any) => {
    createFarmMutation.mutate({
      ...data,
      ownerId: user?.id,
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
            {farms.length === 0 ? (
              <>
                {!isCreatingFarm ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Your Farm Profile</CardTitle>
                      <CardDescription>
                        Set up your farm profile to start listing produce
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg mb-4">You haven't created a farm profile yet</p>
                        <Button 
                          onClick={() => setIsCreatingFarm(true)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Farm Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Your Farm Profile</CardTitle>
                      <CardDescription>
                        Tell buyers about your farm and location
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...farmForm}>
                        <form onSubmit={farmForm.handleSubmit(onFarmSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={farmForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Farm Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Sunny Acres Farm" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={farmForm.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(555) 123-4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={farmForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Farm Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell buyers about your farm, your growing methods, and what makes your produce special..."
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Location</h3>
                            <FormField
                              control={farmForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Street Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Farm Road" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={farmForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Springfield" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={farmForm.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                      <Input placeholder="CA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={farmForm.control}
                                name="zipCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Zip Code</FormLabel>
                                    <FormControl>
                                      <Input placeholder="12345" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Additional Information</h3>
                            <FormField
                              control={farmForm.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Website (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://www.yourfarm.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={farmForm.control}
                              name="isOrganic"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      Certified Organic Farm
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button
                              type="submit"
                              disabled={createFarmMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {createFarmMutation.isPending ? "Creating..." : "Create Farm Profile"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsCreatingFarm(false);
                                farmForm.reset();
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
              </>
            ) : (
              <div className="space-y-6">
                {farms.map((farm) => (
                  <Card key={farm.id}>
                    <div className="relative">
                      {/* Farm Hero Image */}
                      <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                        {farm.imageUrl ? (
                          <img
                            src={farm.imageUrl}
                            alt={farm.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <Package className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                      </div>
                      
                      {/* Farm Rating */}
                      <div className="absolute top-4 left-4 flex items-center bg-white rounded-full px-3 py-1 shadow-lg">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm font-medium">4.8</span>
                        <span className="text-xs text-gray-500 ml-1">(24 reviews)</span>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Farm Details */}
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{farm.name}</h2>
                            <p className="text-gray-600 mb-4">{farm.description}</p>
                            
                            {farm.isOrganic && (
                              <Badge className="bg-green-100 text-green-800 mb-4">
                                Certified Organic
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-start text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p>{farm.address}</p>
                                <p>{farm.city}, {farm.state} {farm.zipCode}</p>
                              </div>
                            </div>
                            
                            {farm.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                <span>{farm.phoneNumber}</span>
                              </div>
                            )}
                            
                            {farm.website && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                                </svg>
                                <a 
                                  href={farm.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Visit Website
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Farm
                            </Button>
                          </div>
                        </div>

                        {/* Farm Stats */}
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Farm Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Produce Items</span>
                                <span className="font-medium">{produceItems.length} active</span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Farming Method</span>
                                <span className="font-medium">
                                  {farm.isOrganic ? "Organic" : "Conventional"}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status</span>
                                <span className="font-medium text-green-600">Active</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Services</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Pickup Available</span>
                                  <span className="font-medium text-green-600">Yes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery Available</span>
                                  <span className="font-medium text-green-600">Yes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Farm Tours</span>
                                  <span className="font-medium text-green-600">By Appointment</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
