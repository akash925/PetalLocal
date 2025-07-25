import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { MessageFarmerButton } from "@/components/message-farmer-button";
import { SmartPaymentButton } from "@/components/smart-payment-button";
import { MapPin, Calendar, Truck, Store, Heart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ProduceDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: produceItem, isLoading, error } = useQuery({
    queryKey: [`/api/flowers/${id}`],
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!produceItem) return;
    
    addItem({
      id: produceItem.id,
      name: produceItem.name,
      price: parseFloat(produceItem.pricePerUnit),
      unit: produceItem.unit,
      farmName: produceItem.farm?.name || "Local Farm",
      imageUrl: produceItem.imageUrl,
    }, quantity);
    
    toast({
      title: "Added to cart",
      description: `${quantity} ${produceItem.unit}${quantity > 1 ? 's' : ''} of ${produceItem.name} added to your cart.`,
    });
    
    setQuantity(1); // Reset quantity after adding
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !produceItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produce item not found</h1>
          <Link href="/flowers/browse">
            <Button>Browse Flowers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/flowers/browse">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-[4/3] max-h-96 rounded-xl overflow-hidden bg-gray-100">
              {produceItem.imageUrl ? (
                <img
                  src={produceItem.imageUrl}
                  alt={produceItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-2xl">🥕</span>
                    </div>
                    <span className="text-green-600 font-medium">{produceItem.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {produceItem.isOrganic && (
                  <Badge className="bg-green-100 text-green-800">Organic</Badge>
                )}
                {produceItem.isSeasonal && (
                  <Badge variant="secondary">Seasonal</Badge>
                )}
                {produceItem.isHeirloom && (
                  <Badge variant="outline">Heirloom</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {produceItem.name}
              </h1>
              
              <p className="text-lg text-gray-600 mb-4">
                From Local Farm {/* This would come from farm data */}
              </p>

              {produceItem.description && (
                <p className="text-gray-700 mb-4">
                  {produceItem.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Pricing */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  ${parseFloat(produceItem.pricePerUnit).toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 ml-2">
                  per {produceItem.unit}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="rounded-r-none"
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))}
                    className="rounded-l-none"
                    disabled={quantity >= availableQuantity}
                  >
                    +
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {availableQuantity > 0 ? (
                    <span>
                      {availableQuantity} {produceItem.unit}{availableQuantity > 1 ? 's' : ''} available
                    </span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </div>
                
                <Button
                  size="lg"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={handleAddToCart}
                  disabled={availableQuantity === 0 || quantity > availableQuantity}
                >
                  {availableQuantity === 0 ? 'Out of Stock' : 
                   quantity > availableQuantity ? 'Quantity Not Available' :
                   `Add to Cart - $${(parseFloat(produceItem.pricePerUnit) * quantity).toFixed(2)}`}
                </Button>
              </div>

              {/* Smart Payment Express Checkout */}
              <div className="border-t pt-4">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Express Checkout</span>
                </div>
                {availableQuantity > 0 ? (
                  <SmartPaymentButton
                    item={{
                      id: produceItem.id,
                      name: produceItem.name,
                      price: parseFloat(produceItem.pricePerUnit),
                      unit: produceItem.unit,
                      farmName: produceItem.farm?.name || "Local Farm",
                      imageUrl: produceItem.imageUrl,
                    }}
                    quantity={quantity}
                    onSuccess={() => {
                      toast({
                        title: "Purchase Complete!",
                        description: `Successfully purchased ${quantity} ${produceItem.unit}${quantity > 1 ? 's' : ''} of ${produceItem.name}`,
                      });
                      setQuantity(1);
                      // Refresh the page to update inventory
                      window.location.reload();
                    }}
                  />
                ) : (
                  <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    Express Checkout Unavailable - Out of Stock
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Farm Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Farm Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>2.5 miles away</span>
                  </div>
                  
                  {produceItem.harvestDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Harvested: {new Date(produceItem.harvestDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Store className="w-4 h-4 mr-2" />
                    <span>Available for pickup</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="w-4 h-4 mr-2" />
                    <span>Local delivery available</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link href={`/farms/${produceItem.farmId}`}>
                    <Button variant="outline" className="flex-1">
                      Visit Farm Page
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
