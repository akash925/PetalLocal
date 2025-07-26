import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Leaflet dynamically to avoid SSR issues
let L: any = null;

interface MapLocation {
  id: number;
  name: string;
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  city: string;
  state: string;
  isOrganic?: boolean;
}

interface OptimizedMapProps {
  locations: MapLocation[];
  onLocationSelect?: (location: MapLocation) => void;
  className?: string;
  type?: 'farms' | 'flowers';
  centerOnUser?: boolean;
}

export function OptimizedMap({ 
  locations, 
  onLocationSelect, 
  className = "",
  type = 'farms',
  centerOnUser = true
}: OptimizedMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (!L && typeof window !== 'undefined') {
          console.log('Loading Leaflet library...');
          
          // Add CSS first
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
            
            // Wait for CSS to load
            await new Promise((resolve) => {
              link.onload = resolve;
              link.onerror = resolve; // Continue even if CSS fails
              setTimeout(resolve, 1000); // Fallback timeout
            });
          }
          
          const leafletModule = await import('leaflet');
          L = leafletModule.default;
          console.log('Leaflet loaded successfully');
          
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        setLoadError('Failed to load map library. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!centerOnUser) return Promise.resolve(null);
    
    return new Promise<{lat: number, lng: number} | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000); // 5 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        () => {
          clearTimeout(timeout);
          resolve(null);
        },
        { 
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }, [centerOnUser]);

  // Validate coordinates
  const isValidCoordinate = useCallback((lat: any, lng: any): boolean => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
    const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
    return !isNaN(numLat) && !isNaN(numLng) && 
           numLat !== 0 && numLng !== 0 &&
           numLat >= -90 && numLat <= 90 &&
           numLng >= -180 && numLng <= 180;
  }, []);

  // Initialize map
  useEffect(() => {
    console.log('Map useEffect triggered:', { 
      hasL: !!L, 
      hasMapRef: !!mapRef.current, 
      locationsCount: locations.length,
      isLoading 
    });
    
    if (!L || !mapRef.current || locations.length === 0) {
      console.log('Map init conditions not met - returning early');
      return;
    }

    const initMap = async () => {
      try {
        console.log('Initializing map with', locations.length, 'locations');
        setIsLoading(true);
        
        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Get user location
        const userLoc = await getUserLocation();
        
        // Filter locations with valid coordinates
        const validLocations = locations.filter(loc => isValidCoordinate(loc.latitude, loc.longitude));
        
        // Determine initial center and zoom
        let centerLat = 36.7783; // California center
        let centerLng = -119.4179;
        let zoom = 6;

        if (userLoc) {
          centerLat = userLoc.lat;
          centerLng = userLoc.lng;
          zoom = 10;
        } else if (validLocations.length > 0) {
          // Center on average of valid locations
          const avgLat = validLocations.reduce((sum, loc) => sum + parseFloat(String(loc.latitude)), 0) / validLocations.length;
          const avgLng = validLocations.reduce((sum, loc) => sum + parseFloat(String(loc.longitude)), 0) / validLocations.length;
          centerLat = avgLat;
          centerLng = avgLng;
          zoom = 8;
        }

        // Create map with optimized settings for mobile
        const map = L.map(mapRef.current, {
          scrollWheelZoom: false,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          zoomControl: true,
          attributionControl: false,
          tap: true,
          tapTolerance: 15,
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          maxZoom: 18,
          minZoom: 4,
          preferCanvas: true // Better performance on mobile
        }).setView([centerLat, centerLng], zoom);

        mapInstanceRef.current = map;

        // Add tile layer with optimized settings
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          tileSize: 256,
          detectRetina: true
        }).addTo(map);

        // Add user location marker if available
        if (userLoc) {
          L.circleMarker([userLoc.lat, userLoc.lng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            radius: 8,
            weight: 3
          }).addTo(map).bindPopup(`
            <div class="p-2 text-center">
              <h4 class="font-semibold text-blue-600">Your Location</h4>
            </div>
          `);
        }

        // Add location markers
        validLocations.forEach((location) => {
          const lat = parseFloat(String(location.latitude));
          const lng = parseFloat(String(location.longitude));
          
          const color = location.isOrganic ? '#22c55e' : '#f97316';
          
          const marker = L.circleMarker([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            radius: 10,
            weight: 2
          }).addTo(map);

          const popupContent = `
            <div class="p-3 min-w-[200px]">
              <h4 class="font-semibold text-gray-900 mb-1">${location.name}</h4>
              ${location.address ? `<p class="text-sm text-gray-600 mb-1">${location.address}</p>` : ''}
              <p class="text-sm text-gray-600 mb-2">${location.city}, ${location.state}</p>
              <p class="text-xs font-medium ${location.isOrganic ? 'text-green-600' : 'text-orange-600'}">
                ${location.isOrganic ? '🌱 Organic' : '🌾 Conventional'} ${type === 'farms' ? 'Grower' : 'Farm'}
              </p>
            </div>
          `;

          marker.bindPopup(popupContent);
          
          if (onLocationSelect) {
            marker.on('click', () => {
              onLocationSelect(location);
            });
          }
        });

        // Auto-fit bounds if we have multiple locations
        if (validLocations.length > 1) {
          const group = new L.featureGroup();
          validLocations.forEach(location => {
            const lat = parseFloat(String(location.latitude));
            const lng = parseFloat(String(location.longitude));
            group.addLayer(L.marker([lat, lng]));
          });
          
          // Only fit bounds if user location isn't available
          if (!userLoc) {
            map.fitBounds(group.getBounds().pad(0.1));
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Map initialization error:', error);
        setLoadError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initMap();
    }, 200);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, locations, getUserLocation, isValidCoordinate, onLocationSelect, type]);

  // Handle map resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loadError) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Map Loading Error</p>
          <p className="text-xs text-gray-600 mt-1">{loadError}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  // Filter locations without coordinates for display
  const locationsWithoutCoords = locations.filter(loc => !isValidCoordinate(loc.latitude, loc.longitude));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="w-full h-96 md:h-[500px] rounded-lg border border-gray-200"
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-600">Organic {type === 'farms' ? 'Growers' : 'Farms'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-gray-600">Conventional {type === 'farms' ? 'Growers' : 'Farms'}</span>
            </div>
            {userLocation && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-600">Your Location</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Locations without coordinates */}
      {locationsWithoutCoords.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
            {type === 'farms' ? 'Growers' : 'Locations'} not shown on map (missing coordinates):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {locationsWithoutCoords.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onLocationSelect?.(location)}
              >
                <span className="font-medium text-sm">{location.name}</span>
                <span className="text-xs text-gray-500">
                  {location.city}, {location.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}