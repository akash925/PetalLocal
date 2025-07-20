import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { insertProduceItemSchema, insertFarmSchema, insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, Upload, Download, Image } from "lucide-react";
import { SmartPhotoUploader } from "@/components/smart-photo-uploader";
import { ProduceEditModal } from "@/components/produce-edit-modal";
import { InstagramConnect } from "@/components/instagram-connect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isAddingProduce, setIsAddingProduce] = useState(false);
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);
  const [isEditingFarm, setIsEditingFarm] = useState(false);
  const [activeTab, setActiveTab] = useState("produce");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingInventory, setEditingInventory] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduceItem, setSelectedProduceItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters for tab routing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'add-produce') {
      setActiveTab("produce");
      setIsAddingProduce(true);
    }
  }, [location]);

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
      const filteredProduce = allProduce.filter(item => farmIds.includes(item.farmId));
      // Remove duplicates by ID
      const uniqueProduce = filteredProduce.filter((item, index, self) => 
        index === self.findIndex(p => p.id === item.id)
      );
      return uniqueProduce;
    },
    enabled: !!user && farms.length > 0,
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });

  const form = useForm({
    resolver: zodResolver(insertProduceItemSchema.omit({ farmId: true }).extend({
      quantityAvailable: z.string().optional(),
      imageFile: z.any().optional(),
    })),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      variety: "",
      unit: "",
      pricePerUnit: "0",
      quantityAvailable: "0",
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
      instagramHandle: "",
      imageUrl: "",
      isOrganic: false,
      pickupAvailable: true,
      deliveryAvailable: false,
      farmToursAvailable: "no",
      ownerId: user?.id,
    },
  });

  const createProduceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating produce with data:", data);
      console.log("User data:", user);
      const response = await apiRequest("POST", "/api/produce", data);
      return response;
    },
    onSuccess: (data) => {
      console.log("Produce created successfully:", data);
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
      console.error("Error creating produce:", error);
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

  const updateFarmMutation = useMutation({
    mutationFn: async (data: any) => {
      const farmId = farms[0]?.id;
      const response = await apiRequest("PUT", `/api/farms/${farmId}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Farm updated successfully!",
        description: "Your farm profile changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/farms", "owned", user?.id] });
      setIsEditingFarm(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating farm",
        description: error.message || "Failed to update farm profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editProduceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/produce/${id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Produce item updated successfully!",
        description: "Your produce item changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/produce"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produce", user?.id] });
      setEditingItem(null);
      setEditModalOpen(false);
      setSelectedProduceItem(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating produce item",
        description: error.message || "Failed to update produce item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleModalEdit = (data: any) => {
    console.log("Modal edit submission:", data);
    const farmId = farms.length > 0 ? farms[0].id : null;
    if (!farmId) {
      toast({
        title: "Error",
        description: "Farm not found",
        variant: "destructive",
      });
      return;
    }
    
    const editData = {
      ...data,
      farmId: farmId,
      quantityAvailable: data.quantityAvailable || "0",
    };
    
    editProduceMutation.mutate({
      id: selectedProduceItem.id,
      data: editData
    });
  };

  const onSubmit = (data: any) => {
    console.log("Form submitted with data:", data);
    const farmId = farms.length > 0 ? farms[0].id : null;
    if (!farmId) {
      toast({
        title: "Error",
        description: "You need to create a farm first before adding produce.",
        variant: "destructive",
      });
      return;
    }
    
    const submitData = {
      ...data,
      pricePerUnit: data.pricePerUnit, // Keep as string since database expects string
      farmId: farmId,
      quantityAvailable: data.quantityAvailable || "0",
    };
    
    console.log("Submitting data:", submitData);
    createProduceMutation.mutate(submitData);
  };

  const onFarmSubmit = (data: any) => {
    console.log("Farm form submitted with data:", data);
    console.log("Form validation state:", farmForm.formState);
    console.log("Form errors:", farmForm.formState.errors);
    
    const submitData = {
      ...data,
      ownerId: user?.id,
    };
    
    console.log("Submitting farm data:", submitData);
    if (isEditingFarm) {
      updateFarmMutation.mutate(submitData);
    } else {
      createFarmMutation.mutate(submitData);
    }
  };

  const handleEditFarm = () => {
    if (farms.length > 0) {
      const farm = farms[0];
      farmForm.reset({
        name: farm.name || "",
        description: farm.description || "",
        address: farm.address || "",
        city: farm.city || "",
        state: farm.state || "",
        zipCode: farm.zipCode || "",
        phoneNumber: farm.phoneNumber || "",
        website: farm.website || "",
        instagramHandle: farm.instagramHandle || "",
        imageUrl: farm.imageUrl || "",
        isOrganic: farm.isOrganic || false,
        pickupAvailable: farm.pickupAvailable || true,
        deliveryAvailable: farm.deliveryAvailable || false,
        farmToursAvailable: farm.farmToursAvailable || "no",
        ownerId: farm.ownerId,
      });
      setIsEditingFarm(true);
    }
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="produce">My Produce</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="farm">Farm Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="produce" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Produce Items</h2>
              <div className="flex gap-2">
                <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Produce Items</DialogTitle>
                      <DialogDescription>
                        Upload multiple produce items at once using our CSV template
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Step 1: Download Template</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Download our CSV template with all the required columns and sample data
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            const csvContent = `name,description,category,variety,unit,pricePerUnit,quantityAvailable,isOrganic,isSeasonal,isHeirloom
Fresh Tomatoes,Vine-ripened organic tomatoes,vegetables,Roma,lb,4.50,25,true,true,false
Sweet Corn,Fresh picked sweet corn,vegetables,Silver Queen,each,1.25,50,false,true,false
Basil,Fresh organic basil,herbs,,bunch,3.00,10,true,false,false`;
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'produce-template.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV Template
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Step 2: Upload Your CSV</h4>
                        <p className="text-sm text-green-700 mb-3">
                          Upload your completed CSV file to create multiple produce items
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const text = await file.text();
                                const lines = text.split('\n').filter(line => line.trim());
                                const headers = lines[0].split(',').map(h => h.trim());
                                
                                const csvData = lines.slice(1).map(line => {
                                  const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                                  const row: any = {};
                                  headers.forEach((header, index) => {
                                    row[header] = values[index];
                                  });
                                  return row;
                                });

                                // Upload to backend
                                const response = await apiRequest("POST", "/api/produce/bulk-upload", {
                                  csvData
                                });

                                toast({
                                  title: "CSV Upload Complete",
                                  description: `Created ${response.created} items${response.errors > 0 ? `, ${response.errors} errors` : ''}`,
                                });

                                // Refresh the produce list
                                queryClient.invalidateQueries({ queryKey: ["/api/produce", user?.id] });
                                setShowBulkUpload(false);

                              } catch (error: any) {
                                toast({
                                  title: "Upload Error",
                                  description: error.message || "Failed to process CSV file",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                        <Button 
                          className="w-full bg-green-500 hover:bg-green-600" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV File
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={() => setIsAddingProduce(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Produce
                </Button>
              </div>
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
                    <form onSubmit={(e) => {
                      console.log("Form onSubmit triggered");
                      console.log("Form validation state:", form.formState);
                      console.log("Form errors:", form.formState.errors);
                      form.handleSubmit(onSubmit)(e);
                    }} className="space-y-4">
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

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SmartPhotoUploader
                                onImageSelect={field.onChange}
                                onAnalysisComplete={(analysis) => {
                                  if (analysis.success) {
                                    // Auto-fill form with AI analysis results
                                    if (analysis.plantType) {
                                      form.setValue("name", analysis.suggestions?.name || analysis.plantType);
                                    }
                                    if (analysis.category) {
                                      form.setValue("category", analysis.category);
                                    }
                                    if (analysis.suggestions?.description) {
                                      form.setValue("description", analysis.suggestions.description);
                                    }
                                    if (analysis.estimatedYield?.quantity) {
                                      form.setValue("quantityAvailable", analysis.estimatedYield.quantity.toString());
                                    }
                                    if (analysis.estimatedYield?.unit) {
                                      form.setValue("unit", analysis.estimatedYield.unit);
                                    }
                                    if (analysis.variety) {
                                      form.setValue("variety", analysis.variety);
                                    }
                                    
                                    toast({
                                      title: "Smart Analysis Complete!",
                                      description: `Identified ${analysis.plantType} with ${analysis.estimatedYield?.quantity || 'estimated'} ${analysis.estimatedYield?.unit || 'units'} predicted yield`,
                                    });
                                  }
                                }}
                                className="col-span-full"
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
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quantityAvailable"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity Available</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <SmartPhotoUploader
                                  onImageSelect={(imageData) => {
                                    console.log("Farmer Dashboard: Image selected:", imageData);
                                    field.onChange(imageData);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="isOrganic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Organic</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isSeasonal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Seasonal</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isHeirloom"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Heirloom</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={createProduceMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                          onClick={(e) => {
                            console.log("Create Produce Item button clicked");
                            console.log("Form values:", form.getValues());
                            console.log("Form errors:", form.formState.errors);
                            console.log("Form is valid:", form.formState.isValid);
                            console.log("Farms available:", farms);
                          }}
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Edit button clicked for item:", item.id);
                            setSelectedProduceItem(item);
                            setEditModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:bg-red-50"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this produce item?')) {
                              try {
                                await apiRequest("DELETE", `/api/produce/${item.id}`);
                                toast({
                                  title: "Item deleted",
                                  description: "The produce item has been deleted successfully",
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/produce", user?.id] });
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to delete produce item",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Section */}
                    <div className="mb-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 mx-auto mb-1 bg-green-200 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-sm">🥕</span>
                            </div>
                            <span className="text-green-600 text-xs font-medium">No image</span>
                          </div>
                        </div>
                      )}
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4" />
                          <span className={
                            item.inventory?.quantityAvailable > 0 
                              ? "text-green-600" 
                              : "text-red-500"
                          }>
                            {item.inventory?.quantityAvailable > 0 
                              ? `${item.inventory.quantityAvailable} in stock` 
                              : "Out of stock"
                            }
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingInventory(editingInventory === item.id ? null : item.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Update Stock
                        </Button>
                      </div>
                      
                      {editingInventory === item.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex gap-2 mb-3">
                            <Input
                              type="number"
                              placeholder="Quantity"
                              defaultValue={item.inventory?.quantityAvailable || 0}
                              className="flex-1"
                              id={`inventory-${item.id}`}
                            />
                            <Button 
                              size="sm"
                              onClick={async () => {
                                const input = document.getElementById(`inventory-${item.id}`) as HTMLInputElement;
                                const quantity = input.value;
                                try {
                                  await apiRequest("PUT", `/api/inventory/${item.id}`, {
                                    quantityAvailable: parseInt(quantity)
                                  });
                                  toast({
                                    title: "Stock updated",
                                    description: "Inventory has been updated successfully",
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/produce", user?.id] });
                                  setEditingInventory(null);
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to update inventory",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingInventory(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                          
                          {/* AI-Powered Inventory Estimation */}
                          <div className="border-t pt-3">
                            <SmartImageUploader
                              onImageSelect={() => {}}
                              onAnalysisComplete={(analysis) => {
                                const input = document.getElementById(`inventory-${item.id}`) as HTMLInputElement;
                                if (input && analysis.estimatedQuantity) {
                                  input.value = analysis.estimatedQuantity.toString();
                                }
                                toast({
                                  title: "Inventory estimated!",
                                  description: `AI estimated ${analysis.estimatedQuantity} ${analysis.unit}`,
                                });
                              }}
                              showAnalyzeButton={true}
                              className="max-w-md"
                            />
                          </div>
                        </div>
                      )}
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
                        <form onSubmit={(e) => {
                          console.log("Form onSubmit event triggered");
                          console.log("Form data before submit:", farmForm.getValues());
                          console.log("Form valid:", farmForm.formState.isValid);
                          console.log("Form errors:", farmForm.formState.errors);
                          farmForm.handleSubmit(onFarmSubmit)(e);
                        }} className="space-y-6">
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

                          <FormField
                            control={farmForm.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <SmartImageUploader
                                    onImageSelect={field.onChange}
                                    existingImage={field.value}
                                    showAnalyzeButton={false}
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
                              name="instagramHandle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instagram Handle (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="@yourfarm" {...field} />
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

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Services</h3>
                            
                            <FormField
                              control={farmForm.control}
                              name="pickupAvailable"
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
                                      Pickup Available
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={farmForm.control}
                              name="deliveryAvailable"
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
                                      Delivery Available
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={farmForm.control}
                              name="farmToursAvailable"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Farm Tours</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select tour availability" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="no">No</SelectItem>
                                      <SelectItem value="by_appointment">By Appointment</SelectItem>
                                      <SelectItem value="yes">Yes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button
                              type="submit"
                              disabled={createFarmMutation.isPending}
                              onClick={(e) => {
                                console.log("Create Farm Profile button clicked");
                                console.log("Form values:", farmForm.getValues());
                                console.log("Form state:", farmForm.formState);
                                console.log("Event:", e);
                              }}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {createFarmMutation.isPending ? "Creating..." : "Create Farm Profile"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsCreatingFarm(false);
                                farmForm.reset({
                                  name: "",
                                  description: "",
                                  address: "",
                                  city: "",
                                  state: "",
                                  zipCode: "",
                                  phoneNumber: "",
                                  website: "",
                                  instagramHandle: "",
                                  imageUrl: "",
                                  isOrganic: false,
                                  pickupAvailable: true,
                                  deliveryAvailable: false,
                                  farmToursAvailable: "no",
                                  ownerId: user?.id,
                                });
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
                      
                      {/* Farm Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-100 text-green-800">
                          Active Farm
                        </Badge>
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
                            
                            {farm.instagramHandle && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                                <a 
                                  href={`https://instagram.com/${farm.instagramHandle.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  @{farm.instagramHandle.replace('@', '')}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => {
                                handleEditFarm();
                                // Scroll to edit form
                                setTimeout(() => {
                                  const editSection = document.getElementById('edit-farm-form');
                                  if (editSection) {
                                    editSection.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }}
                            >
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
                                  <span className={`font-medium ${farm.pickupAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                                    {farm.pickupAvailable ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery Available</span>
                                  <span className={`font-medium ${farm.deliveryAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                                    {farm.deliveryAvailable ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Farm Tours</span>
                                  <span className={`font-medium ${farm.farmToursAvailable !== 'no' ? 'text-green-600' : 'text-gray-500'}`}>
                                    {farm.farmToursAvailable === 'yes' ? 'Yes' : 
                                     farm.farmToursAvailable === 'by_appointment' ? 'By Appointment' : 'No'}
                                  </span>
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

            {isEditingFarm && (
              <Card id="edit-farm-form" className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="bg-blue-100 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-800 flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        Editing Farm Profile
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Update your farm information and services
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-200 text-blue-800 border-blue-300">
                      Edit Mode
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...farmForm}>
                    <form onSubmit={farmForm.handleSubmit(onFarmSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={farmForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Farm Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Green Valley Farm" {...field} />
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
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your farm..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={farmForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <SmartPhotoUploader
                                  onImageSelect={(imageData) => {
                                    console.log("Farm image selected:", imageData);
                                    field.onChange(imageData);
                                    farmForm.trigger("imageUrl");
                                  }}
                                  existingImage={field.value}
                                  showAnalyzeButton={false}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location</h3>
                        <FormField
                          control={farmForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
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

                      {/* Instagram Integration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Social Media</h3>
                        
                        <FormField
                          control={farmForm.control}
                          name="instagramHandle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram Handle</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="@yourfarm" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <InstagramConnect 
                          currentHandle={farmForm.getValues('instagramHandle')}
                          onSuccess={(handle) => {
                            farmForm.setValue('instagramHandle', handle);
                            toast({
                              title: "Instagram connected!",
                              description: `Successfully connected to @${handle}`,
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Services</h3>
                        
                        <FormField
                          control={farmForm.control}
                          name="pickupAvailable"
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
                                  Pickup Available
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={farmForm.control}
                          name="deliveryAvailable"
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
                                  Delivery Available
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={farmForm.control}
                          name="farmToursAvailable"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Farm Tours</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tour availability" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="no">No</SelectItem>
                                  <SelectItem value="by_appointment">By Appointment</SelectItem>
                                  <SelectItem value="yes">Yes</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          type="submit"
                          disabled={updateFarmMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {updateFarmMutation.isPending ? "Updating..." : "Update Farm Profile"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingFarm(false);
                            farmForm.reset({
                              name: "",
                              description: "",
                              address: "",
                              city: "",
                              state: "",
                              zipCode: "",
                              phoneNumber: "",
                              website: "",
                              instagramHandle: "",
                              imageUrl: "",
                              isOrganic: false,
                              pickupAvailable: true,
                              deliveryAvailable: false,
                              farmToursAvailable: "no",
                              ownerId: user?.id,
                            });
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
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Modal */}
      {selectedProduceItem && (
        <ProduceEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduceItem(null);
          }}
          produceItem={selectedProduceItem}
          onSubmit={handleModalEdit}
          isLoading={editProduceMutation.isPending}
        />
      )}
    </div>
  );
}
