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
      <section className="relative bg-white min-h-[600px] md:h-[700px] py-16 md:py-0 overflow-hidden">
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
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 sm:px-8 lg:px-8 max-w-5xl w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-luxury-black mb-6 md:mb-4 leading-tight fade-in-up">
              Exquisite Flowers,<br />
              <span className="font-serif italic text-tiffany">Unforgettable Moments</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-luxury-gray mb-6 md:mb-6 max-w-2xl mx-auto leading-relaxed fade-in-up font-light" style={{animationDelay: '0.3s'}}>
              Curated luxury collections from distinguished artisan growers<br className="hidden sm:block" />
              for life's most treasured celebrations
            </p>
            
            {/* Luxury Hero Image - Single Premium Rose */}
            <div className="mb-8 md:mb-12 fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="relative max-w-md mx-auto group">
                <div className="relative overflow-hidden rounded-none shadow-2xl">
                  <img 
                    src="/attached_assets/20250726_1526_Rose Bouquet Close-Up_simple_compose_01k14df58qf7krcmstbq2qedpm_1753568825049.png"
                    alt="Exquisite Rose Collection"
                    className="w-full h-48 sm:h-56 md:h-64 object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-tiffany/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {/* Luxury Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-sm shadow-lg">
                    <p className="text-xs font-semibold tracking-wider text-luxury-black">EXCLUSIVE COLLECTION</p>
                  </div>
                </div>
                
                {/* Bottom Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="space-y-1">
                    <p className="text-sm font-light tracking-widest opacity-90">PETALLOCAL</p>
                    <h3 className="text-lg font-serif">Artisan Rose Collection</h3>
                    <p className="text-xs opacity-80">Handcrafted • Luxury • Timeless</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Luxury Call to Action */}
            <div className="max-w-lg mx-auto fade-in-up space-y-4" style={{animationDelay: '0.8s'}}>
              <Link href="/flowers/browse">
                <Button className="w-full bg-luxury-black hover:bg-tiffany text-white py-4 px-8 text-sm tracking-widest font-light transition-all duration-300 hover:shadow-xl rounded-none">
                  DISCOVER COLLECTION
                </Button>
              </Link>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search luxury flowers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/flowers/browse?search=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="w-full pl-4 pr-12 py-3 text-sm border border-gray-300 focus:border-luxury-black focus:ring-luxury-black rounded-none bg-white/80 backdrop-blur-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Search className="w-4 h-4 text-luxury-gray" />
                </div>
              </div>
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
