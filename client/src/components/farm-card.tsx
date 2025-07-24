import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Link } from "wouter";

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
  return (
    <Card className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <Link href={`/farms/${id}`}>
        <div className="h-48 bg-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-pink-200 rounded-full flex items-center justify-center">
                  <span className="text-pink-600 text-xl">🌺</span>
                </div>
                <span className="text-pink-600 text-sm font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-6">
        <Link href={`/farms/${id}`}>
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {name.charAt(0)}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                {name}
              </h3>
              {ownerName && (
                <p className="text-sm text-gray-600">{ownerName}</p>
              )}
            </div>
          </div>
        </Link>
        
        {isOrganic && (
          <Badge className="mb-3 bg-green-100 text-green-800">
            Organic
          </Badge>
        )}
        
        {description && (
          <Link href={`/farms/${id}`}>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 hover:text-gray-800 transition-colors">
              {description}
            </p>
          </Link>
        )}
        
        <div className="flex items-center justify-between">
          {distance && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{distance.toFixed(1)} miles</span>
            </div>
          )}
          <Link href={`/farms/${id}`}>
            <span className="text-green-600 hover:text-green-700 font-medium text-sm cursor-pointer">
              Visit Farm →
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
