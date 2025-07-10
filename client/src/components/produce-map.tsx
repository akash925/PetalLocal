import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default;
  });
}

interface ProduceMapProps {
  produce: Array<{
    id: number;
    name: string;
    pricePerUnit: number;
    unit: string;
    isOrganic?: boolean;
    farm?: {
      id: number;
      name: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      city: string;
      state: string;
      isOrganic?: boolean;
    };
  }>;
  onProduceSelect?: (produce: any) => void;
  className?: string;
}

export function ProduceMap({ produce, onProduceSelect, className = "" }: ProduceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Add CSS for Leaflet
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Helper function to validate coordinates
    const isValidCoordinate = (lat: any, lng: any): boolean => {
      if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      return !isNaN(numLat) && !isNaN(numLng) && 
             numLat !== 0 && numLng !== 0 &&
             numLat >= -90 && numLat <= 90 &&
             numLng >= -180 && numLng <= 180;
    };

    // Group produce by farm with valid coordinates
    const produceByFarm = new Map();
    produce.forEach(item => {
      if (item.farm && isValidCoordinate(item.farm.latitude, item.farm.longitude)) {
        const farmId = item.farm.id;
        if (!produceByFarm.has(farmId)) {
          produceByFarm.set(farmId, { farm: item.farm, produce: [] });
        }
        produceByFarm.get(farmId).produce.push(item);
      }
    });

    // Default center (US center)
    let centerLat = 39.8283;
    let centerLng = -98.5795;
    let zoom = 4;

    // If we have farms with coordinates, center on them
    if (produceByFarm.size > 0) {
      const farms = Array.from(produceByFarm.values()).map(entry => entry.farm);
      const avgLat = farms.reduce((sum, f) => sum + parseFloat(f.latitude!), 0) / farms.length;
      const avgLng = farms.reduce((sum, f) => sum + parseFloat(f.longitude!), 0) / farms.length;
      if (!isNaN(avgLat) && !isNaN(avgLng)) {
        centerLat = avgLat;
        centerLng = avgLng;
        zoom = 10;
      }
    }

    // Create map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers for farms with produce
    produceByFarm.forEach((farmData) => {
      const farm = farmData.farm;
      const farmProduce = farmData.produce;
      const lat = parseFloat(farm.latitude!);
      const lng = parseFloat(farm.longitude!);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const color = farm.isOrganic ? '#22c55e' : '#f97316';
      
      const marker = L.circleMarker([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 10,
        weight: 3
      }).addTo(map);

      // Create popup content with produce list
      const produceList = farmProduce.map(item => 
        `<div class="flex justify-between items-center py-1">
          <span class="font-medium text-sm">${item.name}</span>
          <span class="text-green-600 font-bold text-sm">$${item.pricePerUnit}/${item.unit}</span>
        </div>`
      ).join('');

      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <h4 class="font-semibold text-gray-900 mb-2">${farm.name}</h4>
          <p class="text-sm text-gray-600 mb-3">${farm.city}, ${farm.state}</p>
          <div class="border-t pt-2">
            <h5 class="font-medium text-gray-800 mb-2 text-sm">Available Produce (${farmProduce.length} items):</h5>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              ${produceList}
            </div>
          </div>
          <p class="text-xs mt-2 ${farm.isOrganic ? 'text-green-600' : 'text-orange-600'}">
            ${farm.isOrganic ? '🌱 Organic Farm' : '🌾 Conventional Farm'}
          </p>
        </div>
      `);

      marker.on('click', () => {
        if (onProduceSelect && farmProduce.length > 0) {
          onProduceSelect(farmProduce[0]);
        }
      });
    });

    // Add user location and center on it if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Center map on user location if no farms
        if (produceByFarm.size === 0) {
          map.setView([userLat, userLng], 12);
        }
        
        L.circleMarker([userLat, userLng], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.7,
          radius: 6,
          weight: 2
        }).addTo(map).bindPopup('Your Location');
      }, () => {
        // Geolocation failed, ignore
      });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [produce, onProduceSelect]);

  // Get produce without farm coordinates
  const produceWithoutCoords = produce.filter(item => 
    !item.farm || 
    !item.farm.latitude || 
    !item.farm.longitude ||
    isNaN(parseFloat(item.farm.latitude)) || 
    isNaN(parseFloat(item.farm.longitude))
  );

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Interactive Map */}
        <div className="relative">
          <div ref={mapRef} className="h-96 w-full rounded-lg border border-gray-200" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md border">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Organic Farms</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span>Conventional Farms</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produce without coordinates */}
        {produceWithoutCoords.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
              Produce not shown on map (missing farm coordinates):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {produceWithoutCoords.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => onProduceSelect?.(item)}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-green-600 font-bold">
                    ${item.pricePerUnit}/{item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}