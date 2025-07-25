import { OptimizedMap } from "./optimized-map";

interface ProduceMapProps {
  produce: Array<{
    id: number;
    name: string;
    category: string;
    pricePerUnit: string;
    unit: string;
    farm: {
      id: number;
      name: string;
      latitude?: string | number;
      longitude?: string | number;
      address?: string;
      city: string;
      state: string;
      isOrganic?: boolean;
    };
  }>;
  onProduceSelect?: (produce: any) => void;
  className?: string;
}

export function OptimizedProduceMap({ produce, onProduceSelect, className }: ProduceMapProps) {
  // Transform produce data to farm locations with additional info
  const farmLocations = produce.reduce((acc: any[], item) => {
    const existingFarm = acc.find(f => f.id === item.farm.id);
    
    if (existingFarm) {
      // Add this produce item to existing farm's products
      existingFarm.products = existingFarm.products || [];
      existingFarm.products.push({
        id: item.id,
        name: item.name,
        category: item.category,
        pricePerUnit: item.pricePerUnit,
        unit: item.unit
      });
    } else {
      // Add new farm location
      acc.push({
        id: item.farm.id,
        name: item.farm.name,
        latitude: item.farm.latitude,
        longitude: item.farm.longitude,
        address: item.farm.address,
        city: item.farm.city,
        state: item.farm.state,
        isOrganic: item.farm.isOrganic,
        products: [{
          id: item.id,
          name: item.name,
          category: item.category,
          pricePerUnit: item.pricePerUnit,
          unit: item.unit
        }]
      });
    }
    
    return acc;
  }, []);

  const handleLocationSelect = (location: any) => {
    // If there's only one product from this farm, select it directly
    if (location.products && location.products.length === 1) {
      const selectedProduce = produce.find(p => p.id === location.products[0].id);
      onProduceSelect?.(selectedProduce);
    } else {
      // Otherwise, could show a selection modal or default behavior
      onProduceSelect?.(location);
    }
  };

  return (
    <OptimizedMap
      locations={farmLocations}
      type="flowers"
      onLocationSelect={handleLocationSelect}
      centerOnUser={true}
      className={className}
    />
  );
}