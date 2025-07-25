import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Expand } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { ImageModal } from "./image-modal";

interface FarmCardProps {
  id: number;
  name: string;
  description?: string;
  ownerName?: string;
  imageUrl?: string;
  isOrganic?: boolean;
  distance?: number;
  city?: string;
  state?: string;
}

export function FarmCard({
  id,
  name,
  description,
  ownerName,
  imageUrl,
  isOrganic,
  distance,
  city,
  state,
}: FarmCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <Card className="luxury-card-hover overflow-hidden bg-white cursor-pointer">
      <div className="relative group">
        <Link href={`/farms/${id}`}>
          <div className="h-56 bg-gray-50">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-tiffany rounded-sm flex items-center justify-center">
                  <span className="text-white text-2xl">🌺</span>
                </div>
                <span className="text-luxury-black text-sm font-medium luxury-heading">{name}</span>
              </div>
            </div>
          )}
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
      <CardContent className="p-8">
        <Link href={`/farms/${id}`}>
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-tiffany rounded-sm flex items-center justify-center">
              <span className="text-lg font-medium text-white luxury-heading">
                {name.charAt(0)}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-xl luxury-heading hover:text-tiffany transition-colors">
                {name}
              </h3>
              {ownerName && (
                <p className="text-sm luxury-subheading mt-1">{ownerName}</p>
              )}
            </div>
          </div>
        </Link>
        
        {isOrganic && (
          <Badge className="mb-4 tiffany-badge px-3 py-1">
            CERTIFIED ORGANIC
          </Badge>
        )}
        
        {description && (
          <Link href={`/farms/${id}`}>
            <p className="luxury-subheading text-sm mb-6 line-clamp-3 hover:text-luxury-black transition-colors leading-relaxed">
              {description}
            </p>
          </Link>
        )}
        
        <div className="flex items-center justify-between">
          {distance && (
            <div className="flex items-center text-sm luxury-subheading">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{distance.toFixed(1)} miles away</span>
            </div>
          )}
          <Link href={`/farms/${id}`}>
            <span className="text-tiffany hover:text-luxury-black font-medium text-sm cursor-pointer tracking-wide">
              VISIT GARDEN →
            </span>
          </Link>
        </div>
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
