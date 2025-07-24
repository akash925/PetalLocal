import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SmartImageUploader } from "@/components/smart-image-uploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProduceItemSchema } from "@shared/schema";
import { z } from "zod";
import { X } from "lucide-react";

interface ProduceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  produceItem: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const editProduceSchema = insertProduceItemSchema.omit({ farmId: true }).extend({
  quantityAvailable: z.string().optional(),
});

export function ProduceEditModal({ 
  isOpen, 
  onClose, 
  produceItem, 
  onSubmit, 
  isLoading 
}: ProduceEditModalProps) {
  const [imageUrl, setImageUrl] = useState("");

  const form = useForm({
    resolver: zodResolver(editProduceSchema),
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
      imageUrl: "",
    },
  });

  // Update form and image state when produceItem changes
  useEffect(() => {
    if (produceItem && isOpen) {
      console.log("ProduceEditModal: Setting up form with produceItem:", produceItem);
      
      // Reset form with new data
      form.reset({
        name: produceItem.name || "",
        description: produceItem.description || "",
        category: produceItem.category || "",
        variety: produceItem.variety || "",
        unit: produceItem.unit || "",
        pricePerUnit: produceItem.pricePerUnit || "0",
        quantityAvailable: produceItem.inventory?.quantityAvailable?.toString() || "0",
        isOrganic: produceItem.isOrganic || false,
        isSeasonal: produceItem.isSeasonal || false,
        isHeirloom: produceItem.isHeirloom || false,
        imageUrl: produceItem.imageUrl || "",
      });
      
      // Set image URL state
      const currentImageUrl = produceItem.imageUrl || "";
      console.log("ProduceEditModal: Setting imageUrl to:", currentImageUrl);
      setImageUrl(currentImageUrl);
    }
  }, [produceItem, isOpen, form]);

  const handleImageSelect = (newImageUrl: string) => {
    console.log("Modal: Image selected:", newImageUrl);
    setImageUrl(newImageUrl);
    form.setValue("imageUrl", newImageUrl);
    // Force form to recognize the change
    form.trigger("imageUrl");
  };

  const handleSubmit = (data: any) => {
    console.log("Modal: Form submitted with data:", data);
    console.log("Modal: Current imageUrl state:", imageUrl);
    console.log("Modal: Original produceItem imageUrl:", produceItem?.imageUrl);
    
    // Use imageUrl state if available, otherwise use form data, otherwise keep existing
    const finalImageUrl = imageUrl || data.imageUrl || produceItem?.imageUrl || "";
    
    const submitData = {
      ...data,
      imageUrl: finalImageUrl,
    };
    
    console.log("Modal: Final submit data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Produce Item
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="roses">Roses</SelectItem>
                                <SelectItem value="tulips">Tulips</SelectItem>
                                <SelectItem value="sunflowers">Sunflowers</SelectItem>
                                <SelectItem value="lilies">Lilies</SelectItem>
                                <SelectItem value="daisies">Daisies</SelectItem>
                                <SelectItem value="carnations">Carnations</SelectItem>
                                <SelectItem value="bouquets">Bouquets</SelectItem>
                                <SelectItem value="seasonal">Seasonal Flowers</SelectItem>
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
                              <Input placeholder="e.g., Roma, Cherry" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pricePerUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Unit ($)</FormLabel>
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
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="oz">Ounce (oz)</SelectItem>
                                <SelectItem value="bunch">Bunch</SelectItem>
                                <SelectItem value="each">Each</SelectItem>
                                <SelectItem value="pint">Pint</SelectItem>
                                <SelectItem value="quart">Quart</SelectItem>
                                <SelectItem value="gallon">Gallon</SelectItem>
                                <SelectItem value="dozen">Dozen</SelectItem>
                                <SelectItem value="bag">Bag</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Image & Attributes */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SmartImageUploader
                        onImageSelect={handleImageSelect}
                        existingImage={imageUrl}
                        showAnalyzeButton={false}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attributes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isOrganic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Organic</FormLabel>
                            <p className="text-sm text-gray-500">Certified organic produce</p>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSeasonal"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Seasonal</FormLabel>
                            <p className="text-sm text-gray-500">Available seasonally</p>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isHeirloom"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Heirloom</FormLabel>
                            <p className="text-sm text-gray-500">Heirloom variety</p>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}