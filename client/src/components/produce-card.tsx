import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import { SmartPaymentButton } from "./smart-payment-button";

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

  const getBadges = () => {
    const badges = [];
    
    // Always show category badge
    badges.push({ text: category, variant: "outline" as const });
    
    // Add organic badge if organic
    if (isOrganic) {
      badges.push({ text: "Organic", variant: "default" as const });
    }
    
    // Add seasonal badge if seasonal
    if (isSeasonal) {
      badges.push({ text: "Seasonal", variant: "secondary" as const });
    }
    
    // Add heirloom badge if heirloom
    if (isHeirloom) {
      badges.push({ text: "Heirloom", variant: "outline" as const });
    }
    
    return badges;
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link href={`/produce/${id}`}>
        <div className="aspect-w-4 aspect-h-3 bg-gray-100 cursor-pointer">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">🥕</span>
                </div>
                <span className="text-green-600 text-sm font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap gap-1">
            {getBadges().map((badge, index) => (
              <Badge key={index} variant={badge.variant} className="text-xs">
                {badge.text}
              </Badge>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <Link href={`/produce/${id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 cursor-pointer">
            {name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-2">{farmName}</p>
        
        <div className="space-y-3">
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuantitySelector(true);
                }}
              >
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuantity(quantity + 1);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
          
          {/* Smart Payment Button */}
          <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <SmartPaymentButton
              item={{
                id,
                name,
                price: pricePerUnit,
                unit,
                farmName,
                imageUrl,
              }}
              quantity={showQuantitySelector ? quantity : 1}
              onSuccess={() => {
                toast({
                  title: "Purchase Complete!",
                  description: `Successfully purchased ${quantity} ${unit}${quantity > 1 ? 's' : ''} of ${name}`,
                });
                setQuantity(1);
                setShowQuantitySelector(false);
              }}
            />
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
