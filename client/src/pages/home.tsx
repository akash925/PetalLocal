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
    select: (data: any[]) => {
      // Deduplicate by ID and get first 8 items
      const uniqueItems = data.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );
      return uniqueItems.slice(0, 8);
    },
  });

  const categories = [
    { name: "Roses", count: 120, image: "🌹" },
    { name: "Tulips", count: 85, image: "🌷" },
    { name: "Sunflowers", count: 45, image: "🌻" },
    { name: "Lilies", count: 60, image: "🌺" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center bg-gray-900 h-96 md:h-[500px]" 
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Bloom Local, Love Local
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto">
              Connect directly with local flower growers and florists for the most beautiful blooms in your community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for beautiful flowers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/flowers/browse?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="w-full pl-12 pr-2 py-4 text-lg rounded-xl border-0 shadow-lg"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <Link href={`/flowers/browse?search=${encodeURIComponent(searchQuery)}`}>
                  <Button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium h-10">
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Browse by Flower Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/flowers/browse?category=${category.name.toLowerCase()}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-shadow duration-200 flex items-center justify-center">
                    <span className="text-6xl">{category.image}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center">{category.name}</h3>
                  <p className="text-sm text-gray-500 text-center">{category.count}+ varieties</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Fresh Blooms This Week</h2>
            <Link href="/flowers/browse">
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
                key={`featured-${item.id}`}
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
                distance={item.farm?.distance || 2.5}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How PetalLocal Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to get beautiful, fresh flowers from local growers to your home
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Browse & Search</h3>
              <p className="text-gray-600">
                Discover beautiful flowers from local growers and florists in your area. Filter by seasonal, organic, or specialty varieties.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Order & Pay</h3>
              <p className="text-gray-600">
                Add flowers to your cart and checkout securely. Choose between home delivery or grower pickup options.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Enjoy Beautiful Flowers</h3>
              <p className="text-gray-600">
                Receive your fresh, locally-grown flowers and enjoy the natural beauty and fragrance of garden-fresh blooms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Growers */}
      <section className="py-16 bg-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Are You a Local Flower Grower?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join our community and start selling your beautiful flowers directly to local customers. 
            Build lasting relationships with your community.
          </p>
          <Link href="/sell">
            <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3 text-lg">
              Start Selling Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
