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
    queryKey: ["/api/flowers"],
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-white via-gray-50 to-white h-96 md:h-[600px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h1 className="text-5xl md:text-7xl luxury-heading text-luxury-black mb-6">
              Beautiful Flowers,<br />Beautiful Moments
            </h1>
            <p className="text-xl md:text-2xl luxury-subheading mb-12 max-w-3xl mx-auto">
              Discover exceptional flowers from local growers curated for life's most precious occasions
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for exceptional flowers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/flowers/browse?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="w-full pl-16 pr-32 py-6 text-lg border-2 border-gray-200 focus:border-tiffany focus:ring-tiffany rounded-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center">
                  <Search className="w-6 h-6 text-luxury-gray" />
                </div>
                <Link href={`/flowers/browse?search=${encodeURIComponent(searchQuery)}`}>
                  <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 luxury-button px-8 py-4 h-auto rounded-sm">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The PetalLocal Experience */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl luxury-heading text-luxury-black mb-6">The PetalLocal Experience</h2>
            <p className="text-xl luxury-subheading max-w-3xl mx-auto">
              Exceptional service and extraordinary flowers, curated with passion and delivered with care
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: "🌹",
                title: "Premium Roses",
                description: "Handpicked romantic roses for life's special moments",
                link: "roses"
              },
              {
                icon: "🌷",
                title: "Elegant Tulips", 
                description: "Graceful tulips in stunning seasonal varieties",
                link: "tulips"
              },
              {
                icon: "🌻",
                title: "Radiant Sunflowers",
                description: "Bright sunflowers bringing joy to any occasion",
                link: "sunflowers"
              },
              {
                icon: "🌺",
                title: "Exotic Lilies",
                description: "Sophisticated lilies with captivating fragrance",
                link: "lilies"
              }
            ].map((category) => (
              <Link key={category.title} href={`/flowers/browse?category=${category.link}`}>
                <div className="premium-service-card p-8 text-center h-full">
                  <div className="text-6xl mb-6">{category.icon}</div>
                  <h3 className="text-xl luxury-heading mb-4">{category.title}</h3>
                  <p className="luxury-subheading text-sm leading-relaxed">{category.description}</p>
                  <div className="mt-6">
                    <span className="text-tiffany text-sm font-medium tracking-wide">DISCOVER MORE</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flowers */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl luxury-heading text-luxury-black mb-6">Exceptional Flowers</h2>
            <p className="text-xl luxury-subheading max-w-2xl mx-auto mb-8">
              Discover our carefully curated selection of premium flowers from local artisan growers
            </p>
            <Link href="/flowers/browse">
              <Button className="luxury-button px-8 py-4 text-sm tracking-wide">
                VIEW ALL FLOWERS
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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

      {/* Our Promise */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl luxury-heading text-luxury-black mb-6">Our Promise to You</h2>
            <p className="text-xl luxury-subheading max-w-3xl mx-auto">
              Every flower tells a story. We ensure yours is one of beauty, quality, and unforgettable moments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-tiffany rounded-sm flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl luxury-heading mb-4">Curated Selection</h3>
              <p className="luxury-subheading leading-relaxed">
                Each flower is handpicked by our expert growers, ensuring only the finest blooms reach your hands.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-tiffany rounded-sm flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl luxury-heading mb-4">Personalized Service</h3>
              <p className="luxury-subheading leading-relaxed">
                Our dedicated team provides white-glove service, from selection to delivery, ensuring your complete satisfaction.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-tiffany rounded-sm flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl luxury-heading mb-4">Local Artisans</h3>
              <p className="luxury-subheading leading-relaxed">
                Supporting local flower growers who share our commitment to excellence and sustainable growing practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Growers */}
      <section className="py-16 bg-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl luxury-heading text-white mb-4 font-light">
            Are You a Local Flower Grower?
          </h2>
          <p className="text-xl text-pink-100 mb-8 font-light leading-relaxed">
            Join our community and start selling your beautiful flowers directly to local customers. 
            Build lasting relationships with your community.
          </p>
          <Link href="/sell">
            <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3 text-lg font-light tracking-wide">
              Start Selling Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
