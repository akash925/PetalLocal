/**
 * Calculate distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's location from request headers or IP geolocation
 * For demo purposes, returns a default location in California
 */
export function getUserLocation(): { lat: number; lon: number } {
  // In a real app, this would use IP geolocation or user's saved location
  // For demo, using approximate center of California
  return {
    lat: 37.7749,  // San Francisco latitude
    lon: -122.4194 // San Francisco longitude
  };
}

/**
 * Add distance calculations to produce items based on user location
 */
export function addDistanceToProduceItems(produceItems: any[], userLocation?: { lat: number; lon: number }): any[] {
  const location = userLocation || getUserLocation();
  
  return produceItems.map(item => {
    if (item.farm?.latitude && item.farm?.longitude) {
      const distance = calculateDistance(
        location.lat,
        location.lon,
        parseFloat(item.farm.latitude),
        parseFloat(item.farm.longitude)
      );
      
      return {
        ...item,
        farm: {
          ...item.farm,
          distance
        }
      };
    }
    
    return item;
  });
}