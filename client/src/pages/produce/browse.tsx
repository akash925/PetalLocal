import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProduceCard } from "@/components/produce-card";
import { OptimizedProduceMap } from "@/components/optimized-produce-map";
import { Search, Filter, Grid, Map } from "lucide-react";

export default function BrowseProduce() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Get URL search params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    const categoryParam = urlParams.get("category");
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  const { data: produce = [], isLoading } = useQuery({
    queryKey: ["/api/flowers", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      
      const response = await fetch(`/api/flowers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch flowers");
      return response.json();
    },
    select: (data: any[]) => {
      // Deduplicate by ID in case backend still returns duplicates
      const uniqueItems = data.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );
      return uniqueItems;
    },
  });

  const categories = [
    "roses",
    "tulips", 
    "sunflowers",
    "lilies",
    "daisies",
    "carnations",
    "bouquets",
    "seasonal",
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl luxury-heading text-luxury-black mb-6">Exceptional Flowers</h1>
          <p className="text-xl luxury-subheading max-w-2xl mx-auto mb-8">
            Discover our carefully curated collection of premium flowers from local artisan growers
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-luxury-gray w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for exceptional flowers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 py-4 text-lg border-2 border-gray-200 focus:border-tiffany focus:ring-tiffany rounded-sm"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64 py-4 border-2 border-gray-200 focus:border-tiffany rounded-sm">
                <Filter className="w-5 h-5 mr-3 text-luxury-gray" />
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-l-none"
              >
                <Map className="w-4 h-4 mr-2" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : produce.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {produce.map((item: any) => (
                <ProduceCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  pricePerUnit={parseFloat(item.pricePerUnit)}
                  unit={item.unit}
                  imageUrl={item.imageUrl?.startsWith('blob:') ? null : item.imageUrl}
                  isOrganic={item.isOrganic}
                  isSeasonal={item.isSeasonal}
                  isHeirloom={item.isHeirloom}
                  farmName={item.farm?.name || "Local Farm"}
                  farmLatitude={item.farm?.latitude}
                  farmLongitude={item.farm?.longitude}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Map className="w-5 h-5 mr-2 text-green-600" />
                  Flower Locations
                </h2>
                <p className="text-gray-600 text-sm mt-1">Interactive map showing flowers from local growers</p>
              </div>
              <div className="p-4">
                <OptimizedProduceMap 
                  produce={produce}
                  onProduceSelect={(item) => {
                    console.log('Selected produce:', item);
                  }}
                />
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No flowers found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
