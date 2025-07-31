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
      <section className="relative bg-white min-h-screen py-0 overflow-hidden">
        {/* Minimal luxury background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 to-white"></div>
        
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-3">
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
            <defs>
              <pattern id="luxury-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0M-10 10L10 -10M30 50L50 30" stroke="currentColor" className="text-tiffany" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#luxury-grid)"/>
          </svg>
        </div>
        
        {/* Full-Screen Hero Image - Louis Vuitton Style */}
        <div className="relative w-full h-screen">
          <img 
            src="/attached_assets/20250730_2324_Californian Floral Elegance_simple_compose_01k1fjc7pse4tt0k9rgcd69cgg_1753943300715.png"
            alt="Californian Floral Elegance - Mediterranean Villa Rose Gardens"
            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-tiffany/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Top Left Badge */}
          <div className="absolute top-8 left-8">
            <div className="bg-white/95 backdrop-blur-sm px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold tracking-wider text-luxury-black">CALIFORNIA ESTATE ROSES</p>
            </div>
          </div>
          
          {/* Top Right Price Badge */}
          <div className="absolute top-8 right-8">
            <div className="bg-tiffany/90 backdrop-blur-sm px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold tracking-wider text-white">FROM $85</p>
            </div>
          </div>
          
          {/* Center Content - Louis Vuitton Style */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 leading-tight fade-in-up">
                Exquisite Flowers,<br />
                <span className="font-serif italic">Unforgettable Moments</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mb-12 leading-relaxed fade-in-up font-light opacity-90" style={{animationDelay: '0.3s'}}>
                Curated luxury collections from distinguished artisan growers
              </p>
              
              {/* Luxury Call to Action */}
              <div className="max-w-md mx-auto fade-in-up space-y-6" style={{animationDelay: '0.5s'}}>
                <Link href="/flowers/browse">
                  <Button className="w-full bg-white hover:bg-tiffany text-luxury-black hover:text-white py-4 px-12 text-base tracking-widest font-light transition-all duration-300 hover:shadow-xl rounded-none">
                    DISCOVER COLLECTION
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Bottom Overlay - Villa Information */}
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <div className="max-w-3xl space-y-3">
              <p className="text-base font-light tracking-widest opacity-90">PETALLOCAL PREMIUM</p>
              <h3 className="text-3xl md:text-4xl font-serif leading-tight">Californian Floral Elegance</h3>
              <p className="text-lg opacity-80 leading-relaxed">Villa estate gardens overlooking San Francisco Bay • Luxury bouquets • Mediterranean heritage</p>
            </div>
          </div>
        </div>
      </section>

      {/* The PetalLocal Experience */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl luxury-heading text-luxury-black mb-6 md:mb-6">The PetalLocal Experience</h2>
            <p className="text-lg md:text-xl luxury-subheading max-w-3xl mx-auto leading-relaxed">
              Exceptional service and extraordinary flowers, curated with passion and delivered with care
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
            ].map((category, index) => (
              <Link key={category.title} href={`/flowers/browse?category=${category.link}`}>
                <div className="premium-service-card p-6 md:p-8 text-center h-full transition-all duration-500 hover:scale-105 hover:shadow-xl fade-in-up group" 
                     style={{animationDelay: `${0.2 * (index + 1)}s`}}>
                  <div className="text-5xl md:text-6xl mb-4 md:mb-6 flower-bloom group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                  <h3 className="text-lg md:text-xl luxury-heading mb-3 md:mb-4 group-hover:text-tiffany transition-colors duration-300">{category.title}</h3>
                  <p className="luxury-subheading text-sm leading-relaxed">{category.description}</p>
                  <div className="mt-4 md:mt-6">
                    <span className="text-tiffany text-xs md:text-sm font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">DISCOVER MORE</span>
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
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-4xl luxury-heading text-luxury-black mb-6">Exceptional Flowers</h2>
            <p className="text-xl luxury-subheading max-w-2xl mx-auto mb-8">
              Discover our carefully curated selection of premium flowers from local artisan growers
            </p>
            <Link href="/flowers/browse">
              <Button className="luxury-button px-8 py-4 text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl">
                VIEW ALL FLOWERS
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {featuredProduce.map((item: any, index: number) => (
              <div key={`featured-${item.id}`} className="fade-in-up hover:scale-105 transition-transform duration-300" 
                   style={{animationDelay: `${0.1 * index}s`}}>
                <ProduceCard
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
              </div>
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
