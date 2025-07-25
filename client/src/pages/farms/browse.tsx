import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FarmCard } from "@/components/farm-card";
import { OptimizedMap } from "@/components/optimized-map";
import { Search, Filter, Grid, Map } from "lucide-react";

export default function BrowseFarms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"
  const [selectedFarm, setSelectedFarm] = useState(null);

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ["/api/farms", searchQuery, selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedFilter && selectedFilter !== "all") params.append("filter", selectedFilter);
      
      const response = await fetch(`/api/farms?${params}`);
      if (!response.ok) throw new Error("Failed to fetch farms");
      return response.json();
    },
  });

  const filters = [
    "organic",
    "family-owned",
    "small-scale",
    "sustainable",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Local Growers</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for flower growers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Farms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
                {filters.map((filter) => (
                  <SelectItem key={filter} value={filter}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
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
        {farms.length > 0 ? (
          <div className="space-y-6">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {farms.map((farm: any) => (
                  <FarmCard
                    key={farm.id}
                    id={farm.id}
                    name={farm.name}
                    description={farm.description}
                    ownerName={`${farm.owner?.firstName || ''} ${farm.owner?.lastName || ''}`.trim()}
                    imageUrl={farm.imageUrl}
                    isOrganic={farm.isOrganic}
                    city={farm.city}
                    state={farm.state}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Map className="w-5 h-5 mr-2 text-pink-600" />
                    Grower Locations
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Interactive map showing local flower growers in your area</p>
                </div>
                <div className="p-4">
                  <OptimizedMap 
                    locations={farms}
                    type="farms"
                    onLocationSelect={setSelectedFarm}
                    centerOnUser={true}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No farms found</h3>
            <p className="text-gray-500 text-lg">No farms found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedFilter("all");
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