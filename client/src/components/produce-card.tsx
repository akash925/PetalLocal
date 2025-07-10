import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";

interface ProduceCardProps {
  id: number;
  name: string;
  description?: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  imageUrl?: string;
  isOrganic?: boolean;
  isSeasonal?: boolean;
  isHeirloom?: boolean;
  farmName: string;
  distance?: number;
}

export function ProduceCard({
  id,
  name,
  category,
  pricePerUnit,
  unit,
  imageUrl,
  isOrganic,
  isSeasonal,
  isHeirloom,
  farmName,
  distance,
}: ProduceCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price: pricePerUnit,
      unit,
      farmName,
      imageUrl,
    }, quantity);

    toast({
      title: "Added to cart",
      description: `${quantity} ${unit}${quantity > 1 ? 's' : ''} of ${name} added to your cart.`,
    });

    setQuantity(1);
    setShowQuantitySelector(false);
  };

  const getBadgeVariant = () => {
    if (isOrganic) return "default";
    if (isSeasonal) return "secondary";
    if (isHeirloom) return "outline";
    return "default";
  };

  const getBadgeText = () => {
    if (isOrganic) return "Organic";
    if (isSeasonal) return "Seasonal";
    if (isHeirloom) return "Heirloom";
    return category;
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="aspect-w-4 aspect-h-3 bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={getBadgeVariant()} className="text-xs">
            {getBadgeText()}
          </Badge>
          <Button variant="ghost" size="sm" className="p-1 text-gray-400 hover:text-red-500">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <Link href={`/produce/${id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 cursor-pointer">
            {name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-2">{farmName}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900">
                ${pricePerUnit.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-1">/ {unit}</span>
            </div>
            {!showQuantitySelector ? (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1"
                onClick={() => setShowQuantitySelector(true)}
              >
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="px-2 text-sm font-medium min-w-[30px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs"
                  onClick={handleAddToCart}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {distance && (
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{distance.toFixed(1)} miles away</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
