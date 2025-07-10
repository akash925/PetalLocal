import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default;
  });
}

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

export function InteractiveMap({ farms, onFarmSelect, className = "" }: MapProps) {
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
    
    const initMap = () => {

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Default center (California center)
    let centerLat = 36.7783;
    let centerLng = -119.4179;
    let zoom = 6;

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

    // Filter farms with valid coordinates
    const farmsWithCoords = farms.filter(f => isValidCoordinate(f.latitude, f.longitude));
    
    // Only use farm coordinates for initial center if geolocation will be attempted
    // The geolocation callback will handle centering on user location or farms

    // Create map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers for farms with valid coordinates
    farmsWithCoords.forEach((farm) => {
      const lat = parseFloat(farm.latitude!);
      const lng = parseFloat(farm.longitude!);
      
      // Double-check coordinates are valid before creating marker
      if (isNaN(lat) || isNaN(lng)) return;
      
      const color = farm.isOrganic ? '#22c55e' : '#f97316'; // Green for organic, orange for conventional
      
      const marker = L.circleMarker([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 8,
        weight: 2
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-2">
          <h4 class="font-semibold text-gray-900">${farm.name}</h4>
          <p class="text-sm text-gray-600">${farm.address || 'Address not provided'}</p>
          <p class="text-sm text-gray-600">${farm.city}, ${farm.state}</p>
          <p class="text-xs mt-1 ${farm.isOrganic ? 'text-green-600' : 'text-orange-600'}">
            ${farm.isOrganic ? 'Organic Farm' : 'Conventional Farm'}
          </p>
        </div>
      `);

      marker.on('click', () => {
        onFarmSelect?.(farm);
      });
    });

    // Try to get user location and center map on it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (!map || !position?.coords) return;
        
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Validate coordinates before using them
        if (isNaN(userLat) || isNaN(userLng)) return;
        
        // Always center on user location when available
        try {
          map.setView([userLat, userLng], 12);
          
          // Add user location marker
          L.circleMarker([userLat, userLng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            radius: 8,
            weight: 3
          }).addTo(map).bindPopup('📍 Your Location');
        } catch (error) {
          console.error('Error adding user location to map:', error);
        }
      }, (error) => {
        console.log('Geolocation not available or denied, using default center');
        // If farms exist and geolocation fails, center on farms
        if (map && farmsWithCoords.length > 0) {
          try {
            const avgLat = farmsWithCoords.reduce((sum, f) => sum + parseFloat(f.latitude!), 0) / farmsWithCoords.length;
            const avgLng = farmsWithCoords.reduce((sum, f) => sum + parseFloat(f.longitude!), 0) / farmsWithCoords.length;
            if (!isNaN(avgLat) && !isNaN(avgLng)) {
              map.setView([avgLat, avgLng], 10);
            }
          } catch (error) {
            console.error('Error setting fallback map center:', error);
          }
        }
      });
    }

    mapInstanceRef.current = map;
    };

    // Add small delay to ensure proper initialization
    const timer = setTimeout(initMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [farms, onFarmSelect]);

  // Helper function to validate coordinates (same as above)
  const isValidCoordinate = (lat: any, lng: any): boolean => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    return !isNaN(numLat) && !isNaN(numLng) && 
           numLat !== 0 && numLng !== 0 &&
           numLat >= -90 && numLat <= 90 &&
           numLng >= -180 && numLng <= 180;
  };

  // Fallback for farms without valid coordinates
  const farmsWithoutCoords = farms.filter(f => !isValidCoordinate(f.latitude, f.longitude));

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

        {/* Farms without coordinates */}
        {farmsWithoutCoords.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
              Farms not shown on map (missing coordinates):
            </h4>
            <div className="space-y-2">
              {farmsWithoutCoords.map((farm) => (
                <div
                  key={farm.id}
                  className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => onFarmSelect?.(farm)}
                >
                  <span className="font-medium">{farm.name}</span>
                  <span className="text-sm text-gray-500">
                    {farm.city}, {farm.state}
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