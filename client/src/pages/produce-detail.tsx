import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { formatDistance, calculateDistanceToFarm } from "@/lib/distance";
import { SmartPaymentButton } from "@/components/smart-payment-button";
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Minus, 
  Heart, 
  Share2,
  Truck,
  Calendar,
  Award,
  Leaf
} from "lucide-react";
import { Link } from "wouter";

interface ProduceItem {
  id: number;
  name: string;
  description: string;
  category: string;
  variety: string;
  pricePerUnit: string | number;
  unit: string;
  imageUrl?: string;
  isOrganic: boolean;
  isSeasonal: boolean;
  isHeirloom: boolean;
  farmId: number;
  farm?: {
    id: number;
    name: string;
    city: string;
    state: string;
    address: string;
    latitude: string | number;
    longitude: string | number;
    isOrganic: boolean;
  };
  inventory?: {
    quantityAvailable: number;
    lastUpdated: string;
  };
}

export default function ProduceDetail() {
  const [, params] = useRoute("/produce/:id");
  const produceId = params?.id;
  const [quantity, setQuantity] = useState(1);
  const [distance, setDistance] = useState<number | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: produce, isLoading, error } = useQuery<ProduceItem>({
    queryKey: ['/api/produce', produceId],
    enabled: !!produceId,
  });

  // Calculate distance when produce data loads
  useEffect(() => {
    if (produce?.farm?.latitude && produce?.farm?.longitude) {
      const lat = typeof produce.farm.latitude === 'string' ? parseFloat(produce.farm.latitude) : produce.farm.latitude;
      const lng = typeof produce.farm.longitude === 'string' ? parseFloat(produce.farm.longitude) : produce.farm.longitude;
      calculateDistanceToFarm(lat, lng)
        .then(setDistance)
        .catch(() => setDistance(null));
    }
  }, [produce]);

  const handleAddToCart = () => {
    if (!produce) return;
    
    addItem({
      id: produce.id,
      name: produce.name,
      price: typeof produce.pricePerUnit === 'string' ? parseFloat(produce.pricePerUnit) : (produce.pricePerUnit || 0),
      unit: produce.unit || 'unit',
      farmName: produce.farm?.name || 'Unknown Farm',
      imageUrl: produce.imageUrl,
    }, quantity);

    toast({
      title: "Added to cart",
      description: `${quantity} ${produce.unit || 'unit'}${quantity > 1 ? 's' : ''} of ${produce.name} added to your cart.`,
    });
  };

  const getBadges = () => {
    if (!produce) return [];
    
    const badges = [];
    badges.push({ text: produce.category, variant: "outline" as const });
    
    if (produce.isOrganic) {
      badges.push({ text: "Organic", variant: "default" as const });
    }
    
    if (produce.isSeasonal) {
      badges.push({ text: "Seasonal", variant: "secondary" as const });
    }
    
    if (produce.isHeirloom) {
      badges.push({ text: "Heirloom", variant: "outline" as const });
    }
    
    return badges;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading produce details...</p>
        </div>
      </div>
    );
  }

  if (error || !produce) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produce not found</h1>
          <p className="text-gray-600 mb-6">The produce item you're looking for doesn't exist.</p>
          <Link href="/browse-produce">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/browse-produce">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Browse
              </Button>
            </Link>
            <div className="flex-1"></div>
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {produce.imageUrl ? (
                <img
                  src={produce.imageUrl}
                  alt={produce.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-4xl">🥕</span>
                    </div>
                    <span className="text-green-600 text-xl font-medium">{produce.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {getBadges().map((badge, index) => (
                  <Badge key={index} variant={badge.variant}>
                    {badge.text}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{produce?.name || 'Unknown Product'}</h1>
              
              {produce?.variety && (
                <p className="text-lg text-gray-600 mb-4">{produce.variety}</p>
              )}
              
              <p className="text-gray-700 leading-relaxed">{produce?.description || 'No description available'}</p>
            </div>

            {/* Farm Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{produce.farm?.name || 'Farm Information'}</h3>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {produce.farm?.city || 'Unknown'}, {produce.farm?.state || 'Unknown'}
                    </div>
                    {distance !== null && (
                      <p className="text-sm text-green-600 mt-1">
                        {formatDistance(distance)}
                      </p>
                    )}
                  </div>
                  {produce.farm?.id && (
                    <Link href={`/farms/${produce.farm.id}`}>
                      <Button variant="outline" size="sm">
                        Visit Grower
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Purchase */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      ${typeof produce.pricePerUnit === 'string' ? produce.pricePerUnit : produce.pricePerUnit?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-lg text-gray-500 ml-2">/ {produce.unit || 'unit'}</span>
                  </div>
                  {produce.inventory && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Available:</p>
                      <p className="font-semibold text-green-600">
                        {produce.inventory.quantityAvailable} {produce.unit || 'unit'}s
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-1 bg-gray-100 rounded text-center min-w-[3rem]">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={produce.inventory ? quantity >= produce.inventory.quantityAvailable : false}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-500">{produce.unit}s</span>
                </div>

                {/* Total */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${((typeof produce.pricePerUnit === 'string' ? parseFloat(produce.pricePerUnit) : produce.pricePerUnit) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                    size="lg"
                  >
                    Add to Cart
                  </Button>

                  {/* Express Checkout */}
                  <SmartPaymentButton
                    item={{
                      id: produce.id,
                      name: produce.name,
                      price: typeof produce.pricePerUnit === 'string' ? parseFloat(produce.pricePerUnit) : (produce.pricePerUnit || 0),
                      unit: produce.unit || 'unit',
                      farmName: produce.farm?.name || 'Unknown Farm',
                      imageUrl: produce.imageUrl || '',
                    }}
                    quantity={quantity}
                    onSuccess={() => {
                      toast({
                        title: "Purchase successful!",
                        description: "Your order has been placed.",
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Truck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Pickup Available</h4>
                  <p className="text-sm text-gray-600">Farm pickup available</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Fresh Daily</h4>
                  <p className="text-sm text-gray-600">Harvested to order</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}