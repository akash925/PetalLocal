import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Plus, Minus, Expand } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { calculateDistanceToFarm } from "@/lib/distance";
import { ImageModal } from "./image-modal";

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
  farmLatitude?: number;
  farmLongitude?: number;
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
  farmLatitude,
  farmLongitude,
  distance: providedDistance,
}: ProduceCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [distance, setDistance] = useState<number | null>(providedDistance || null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Disable distance calculation temporarily due to accuracy issues
  // useEffect(() => {
  //   if (farmLatitude && farmLongitude && !providedDistance) {
  //     calculateDistanceToFarm(farmLatitude, farmLongitude)
  //       .then(setDistance)
  //       .catch(() => setDistance(null));
  //   }
  // }, [farmLatitude, farmLongitude, providedDistance]);

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
    <Card className="luxury-card-hover overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-500">
      <div className="relative group">
        <Link href={`/flowers/${id}`}>
          <div className="aspect-w-4 aspect-h-3 bg-gray-50 cursor-pointer relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            ) : (
            <div className="w-full h-64 bg-gradient-to-br from-tiffany/10 via-white to-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-tiffany to-tiffany/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">🌸</span>
                </div>
                <span className="text-luxury-black text-base font-medium luxury-heading">{name}</span>
              </div>
            </div>
          )}
          
          {/* Luxury overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick view badge */}
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-luxury-black shadow-lg">
              Quick View
            </div>
          </div>
          </div>
        </Link>
        
        {/* Full-screen button for images */}
        {imageUrl && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 hover:bg-white text-luxury-black border-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsImageModalOpen(true);
            }}
          >
            <Expand className="w-3 h-3" />
          </Button>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {getBadges().map((badge, index) => (
              <Badge key={index} variant={badge.variant} className={`text-xs px-3 py-1 ${badge.text === 'Organic' ? 'tiffany-badge' : ''}`}>
                {badge.text.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
        
        <Link href={`/flowers/${id}`}>
          <h3 className="text-xl luxury-heading mb-2 hover:text-tiffany cursor-pointer transition-colors">
            {name}
          </h3>
        </Link>
        
        <p className="text-sm luxury-subheading mb-4">{farmName}</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl luxury-heading text-luxury-black">
                ${pricePerUnit.toFixed(2)}
              </span>
              <span className="text-sm luxury-subheading ml-2">per {unit}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {!showQuantitySelector ? (
              <Button
                size="sm"
                className="luxury-button w-full py-3 text-sm tracking-wide"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuantitySelector(true);
                }}
              >
                ADD TO BAG
              </Button>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center border border-gray-200 rounded-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    className="h-10 w-10 p-0 hover:text-tiffany"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 text-sm font-medium min-w-[40px] text-center luxury-heading">
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
                    className="h-10 w-10 p-0 hover:text-tiffany"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="luxury-button w-full py-3 text-sm tracking-wide"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                >
                  CONFIRM
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {distance && (
          <div className="flex items-center text-xs luxury-subheading font-light">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{distance.toFixed(1)} miles away</span>
          </div>
        )}
      </CardContent>
      
      {/* Image Modal */}
      {imageUrl && (
        <ImageModal
          src={imageUrl}
          alt={name}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </Card>
  );
}
