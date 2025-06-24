import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProduceCard } from "@/components/produce-card";
import { FarmCard } from "@/components/farm-card";
import { Search, ShoppingCart, Heart, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featuredProduce = [] } = useQuery({
    queryKey: ["/api/produce"],
    select: (data: any[]) => data.slice(0, 8), // Get first 8 items
  });

  const categories = [
    { name: "Vegetables", count: 120, image: "🥕" },
    { name: "Fruits", count: 85, image: "🍎" },
    { name: "Herbs", count: 45, image: "🌿" },
    { name: "Bakery", count: 30, image: "🍞" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center bg-gray-900 h-96 md:h-[500px]" 
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Grow Local, Eat Local
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto">
              Connect directly with local farmers and gardeners for the freshest produce in your community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for fresh produce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-0 shadow-lg"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <Link href={`/produce?search=${encodeURIComponent(searchQuery)}`}>
                  <Button className="absolute inset-y-0 right-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
                    Search
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/produce?category=${category.name.toLowerCase()}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                    <span className="text-6xl">{category.image}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center">{category.name}</h3>
                  <p className="text-sm text-gray-500 text-center">{category.count}+ items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Produce */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Fresh This Week</h2>
            <Link href="/produce">
              <Button variant="outline" className="flex items-center">
                View All
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProduce.map((item: any) => (
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
                farmName="Local Farm" // This would come from farm data
                distance={2.5} // This would be calculated
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How FarmDirect Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to get fresh, local produce from farm to your table
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Browse & Search</h3>
              <p className="text-gray-600">
                Discover fresh produce from local farmers and gardeners in your area. Filter by organic, seasonal, or specialty items.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Order & Pay</h3>
              <p className="text-gray-600">
                Add items to your cart and checkout securely. Choose between home delivery or farm pickup options.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Enjoy Fresh Food</h3>
              <p className="text-gray-600">
                Receive your fresh, locally-grown produce and enjoy the superior taste and quality of farm-direct food.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
