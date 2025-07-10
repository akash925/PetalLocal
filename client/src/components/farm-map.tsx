import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface Farm {
  id: number;
  name: string;
  city: string;
  state: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isOrganic?: boolean;
}

interface FarmMapProps {
  farms: Farm[];
  selectedFarm?: Farm;
  onFarmSelect?: (farm: Farm) => void;
}

// Simple coordinates for demonstration (in a real app, you'd geocode addresses)
const getFarmCoordinates = (farm: Farm): [number, number] => {
  // Default coordinates for different cities (mock data)
  const cityCoords: Record<string, [number, number]> = {
    "Greenfield": [36.3278, -120.3084],
    "Salinas": [36.6777, -121.6555],
    "Watsonville": [36.9101, -121.7569],
    "Paso Robles": [35.6269, -120.6909],
    "San Luis Obispo": [35.2827, -120.6596],
  };

  if (farm.latitude && farm.longitude) {
    return [farm.latitude, farm.longitude];
  }

  return cityCoords[farm.city] || [36.7783, -119.4179]; // Default to Central California
};

export function FarmMap({ farms, selectedFarm, onFarmSelect }: FarmMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.7783, -119.4179]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const farmsWithDistance = farms.map(farm => {
    const [farmLat, farmLng] = getFarmCoordinates(farm);
    const distance = userLocation 
      ? calculateDistance(userLocation[0], userLocation[1], farmLat, farmLng)
      : null;
    
    return {
      ...farm,
      latitude: farmLat,
      longitude: farmLng,
      distance: distance ? Math.round(distance * 10) / 10 : null,
    };
  });

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Farm Locations
          </CardTitle>
          <CardDescription>
            Interactive map showing local farms in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainerRef}
            className="w-full h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg relative overflow-hidden border-2 border-dashed border-gray-300"
          >
            {/* Map Background */}
            <div className="absolute inset-0 bg-green-100">
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Simple road patterns */}
                  <path d="M0,50 Q25,30 50,50 T100,50" stroke="#666" strokeWidth="0.5" fill="none" />
                  <path d="M50,0 Q70,25 50,50 T50,100" stroke="#666" strokeWidth="0.5" fill="none" />
                  <path d="M0,25 Q50,20 100,25" stroke="#666" strokeWidth="0.3" fill="none" />
                  <path d="M0,75 Q50,80 100,75" stroke="#666" strokeWidth="0.3" fill="none" />
                </svg>
              </div>
            </div>

            {/* User Location */}
            {userLocation && (
              <div 
                className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                title="Your Location"
              >
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              </div>
            )}

            {/* Farm Markers */}
            {farmsWithDistance.map((farm, index) => {
              const isSelected = selectedFarm?.id === farm.id;
              const angle = (index * 360) / farmsWithDistance.length;
              const radius = 35 + (index % 3) * 15;
              const x = 50 + radius * Math.cos(angle * Math.PI / 180);
              const y = 50 + radius * Math.sin(angle * Math.PI / 180);

              return (
                <div
                  key={farm.id}
                  className={`absolute w-6 h-6 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                    isSelected ? 'scale-125' : 'hover:scale-110'
                  } transition-all duration-200`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                  onClick={() => {
                    onFarmSelect?.(farm);
                    setLocation(`/farms/${farm.id}`);
                  }}
                  title={`${farm.name} - ${farm.city}, ${farm.state}`}
                >
                  <div className={`w-full h-full rounded-full border-2 border-white shadow-lg ${
                    farm.isOrganic 
                      ? isSelected ? 'bg-green-600' : 'bg-green-500' 
                      : isSelected ? 'bg-orange-600' : 'bg-orange-500'
                  }`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Distance label */}
                  {farm.distance && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white px-1 py-0.5 rounded shadow text-gray-600 whitespace-nowrap">
                      {farm.distance}mi
                    </div>
                  )}
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg">
              <div className="text-sm font-medium mb-2">Legend</div>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Organic Farms</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span>Conventional Farms</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Your Location</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm List */}
      <Card>
        <CardHeader>
          <CardTitle>Nearby Farms</CardTitle>
          <CardDescription>
            Click on a farm to view details and available produce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farmsWithDistance.map((farm) => (
              <div
                key={farm.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFarm?.id === farm.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => {
                  onFarmSelect?.(farm);
                  setLocation(`/farms/${farm.id}`);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {farm.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {farm.city}, {farm.state}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {farm.isOrganic && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Organic
                        </span>
                      )}
                      {farm.distance && (
                        <span className="text-sm text-gray-500">
                          {farm.distance} miles away
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
                    <Navigation className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}