import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

interface MapProps {
  farms: Array<{
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    address: string;
    city: string;
    state: string;
    isOrganic?: boolean;
  }>;
  onFarmSelect?: (farm: any) => void;
  className?: string;
}

export function SimpleMap({ farms, onFarmSelect, className = "" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple fallback map implementation
    if (mapRef.current && !mapLoaded) {
      setMapLoaded(true);
    }
  }, [mapLoaded]);

  const handleFarmClick = (farm: any) => {
    if (onFarmSelect) {
      onFarmSelect(farm);
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Map temporarily unavailable</p>
        <p className="text-sm text-gray-500">Showing farm locations below</p>
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border-2 border-green-200 rounded-lg overflow-hidden ${className}`}>
      {/* Map Header */}
      <div className="bg-green-500 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Farm Locations
          </h3>
          <span className="text-sm bg-green-400 px-2 py-1 rounded">
            {farms.length} farms
          </span>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div ref={mapRef} className="relative bg-gradient-to-br from-green-100 to-green-200 h-64">
        {/* Map Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-green-300" />
            ))}
          </div>
        </div>

        {/* Farm Markers */}
        {farms.map((farm, index) => {
          const x = 10 + (index % 6) * 15; // Distribute horizontally
          const y = 15 + Math.floor(index / 6) * 20; // Distribute vertically
          
          return (
            <div
              key={farm.id}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => handleFarmClick(farm)}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-200 group-hover:scale-110 ${
                farm.isOrganic ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {index + 1}
              </div>
              
              {/* Farm info popup on hover */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div className="font-medium text-sm">{farm.name}</div>
                <div className="text-xs text-gray-600">{farm.city}, {farm.state}</div>
                {farm.isOrganic && (
                  <div className="text-xs text-green-600 font-medium">Organic</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Navigation className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Map Legend */}
      <div className="bg-white p-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Organic Farms</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Conventional Farms</span>
            </div>
            <div className="flex items-center">
              <Navigation className="w-3 h-3 text-blue-500 mr-2" />
              <span>Your Location</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Click on a farm to view details
          </div>
        </div>
      </div>
    </div>
  );
}