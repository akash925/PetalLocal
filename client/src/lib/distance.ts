/**
 * Distance calculation utilities using real browser geolocation
 * and farm zip code coordinates
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Get user's current location using browser geolocation
 */
export function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Calculate distance from user location to farm
 */
export async function calculateDistanceToFarm(
  farmLatitude: number,
  farmLongitude: number
): Promise<number | null> {
  try {
    const userLocation = await getUserLocation();
    return calculateDistance(userLocation, {
      latitude: farmLatitude,
      longitude: farmLongitude,
    });
  } catch (error) {
    console.warn('Unable to calculate distance:', error);
    return null;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number | null): string {
  if (distance === null) {
    return 'Distance unavailable';
  }
  
  if (distance < 1) {
    return `${(distance * 5280).toFixed(0)} ft away`;
  }
  
  return `${distance} mile${distance === 1 ? '' : 's'} away`;
}