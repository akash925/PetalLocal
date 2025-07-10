import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProduceCard } from "@/components/produce-card";
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
    queryKey: ["/api/produce", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      
      const response = await fetch(`/api/produce?${params}`);
      if (!response.ok) throw new Error("Failed to fetch produce");
      return response.json();
    },
  });

  const categories = [
    "vegetables",
    "fruits", 
    "herbs",
    "bakery",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Fresh Produce</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for produce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {produce.map((item: any) => (
                <ProduceCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  pricePerUnit={parseFloat(item.pricePerUnit)}
                  unit={item.unit}
                  imageUrl={item.imageUrl}
                  isOrganic={item.isOrganic}
                  isSeasonal={item.isSeasonal}
                  isHeirloom={item.isHeirloom}
                  farmName="Local Farm" // This would come from joined farm data
                  distance={Math.random() * 5 + 1} // This would be calculated based on user location
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Map View for Produce */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Produce Map</h3>
                <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg relative overflow-hidden border-2 border-dashed border-gray-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Interactive Produce Map</h4>
                      <p className="text-gray-600">Showing {produce.length} produce items from local farms</p>
                    </div>
                  </div>
                  
                  {/* Produce markers */}
                  {produce.slice(0, 6).map((item: any, index: number) => {
                    const angle = (index * 60) + 30;
                    const radius = 25 + (index % 2) * 20;
                    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
                    const y = 50 + radius * Math.sin(angle * Math.PI / 180);
                    
                    return (
                      <div
                        key={item.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={`${item.name} - $${item.pricePerUnit}/${item.unit}`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${
                          item.isOrganic ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {item.name.charAt(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Produce List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {produce.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <span className="text-lg font-bold text-green-600">${item.pricePerUnit}/{item.unit}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                    <div className="flex items-center gap-2">
                      {item.isOrganic && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Organic
                        </span>
                      )}
                      {item.isSeasonal && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Seasonal
                        </span>
                      )}
                      {item.isHeirloom && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Heirloom
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No produce found matching your criteria.</p>
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
