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
      <section className="relative bg-gradient-to-b from-white via-pink-50/30 to-white min-h-[500px] md:h-[600px] py-12 md:py-0 overflow-hidden">
        {/* Subtle petal pattern background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <pattern id="petals" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 20 Q60 10 70 20 Q60 30 50 20" fill="currentColor" className="text-tiffany"/>
              <path d="M30 60 Q40 50 50 60 Q40 70 30 60" fill="currentColor" className="text-pink-300"/>
              <path d="M70 80 Q80 70 90 80 Q80 90 70 80" fill="currentColor" className="text-tiffany"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#petals)"/>
          </svg>
        </div>
        
        {/* Floating flower decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] text-2xl opacity-20 flower-float" style={{animationDelay: '0s'}}>🌹</div>
          <div className="absolute top-32 right-[15%] text-xl opacity-15 flower-float" style={{animationDelay: '2s'}}>🌷</div>
          <div className="absolute bottom-40 left-[20%] text-lg opacity-10 flower-float" style={{animationDelay: '4s'}}>🌺</div>
          <div className="absolute bottom-60 right-[25%] text-2xl opacity-20 flower-float" style={{animationDelay: '1s'}}>🌻</div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 sm:px-8 lg:px-8 max-w-5xl w-full">
            <h1 className="text-4xl sm:text-5xl md:text-7xl luxury-heading mb-8 md:mb-6 leading-tight fade-in-up shimmer-text">
              Exquisite Flowers,<br />Unforgettable Moments
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl luxury-subheading mb-8 md:mb-8 max-w-3xl mx-auto leading-relaxed fade-in-up" style={{animationDelay: '0.3s'}}>
              Curated luxury flower collections from distinguished local artisan growers for life's most treasured celebrations
            </p>
            
            {/* Hero Rose Gallery - 4 Beautiful Roses */}
            <div className="mb-8 md:mb-12 fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xs sm:max-w-sm mx-auto">
                <div className="relative group">
                  <img 
                    src="/attached_assets/20250726_1521_Beautiful Roses_simple_compose_01k14d7hk2f1rv3pycv1fy6pvy_1753568667953.png"
                    alt="Beautiful Red Rose"
                    className="w-full h-28 sm:h-32 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl flower-bloom pulse-glow"
                    style={{animationDelay: '0.5s'}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-tiffany/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-gray-800 font-medium">Premium Roses</p>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <img 
                    src="/attached_assets/20250726_1521_Beautiful Roses_simple_compose_01k14d7hk3ekj9qcrqn2sdkxga_1753568667956.png"
                    alt="Elegant Pink Rose"
                    className="w-full h-28 sm:h-32 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl flower-bloom pulse-glow"
                    style={{animationDelay: '0.7s'}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-300/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-gray-800 font-medium">Garden Roses</p>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <img 
                    src="/attached_assets/20250726_1526_Rose Bouquet Close-Up_simple_compose_01k14df58qf7krcmstbq2qedpm_1753568825049.png"
                    alt="Rose Bouquet"
                    className="w-full h-28 sm:h-32 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl flower-bloom pulse-glow"
                    style={{animationDelay: '0.9s'}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-tiffany/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-gray-800 font-medium">Luxury Bouquets</p>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <img 
                    src="/attached_assets/20250726_1526_Rose Bouquet Close-Up_simple_compose_01k14df58rfbwbe8mtwd3twqyv_1753568825050.png"
                    alt="Premium Rose Arrangement"
                    className="w-full h-28 sm:h-32 object-cover rounded-xl shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl flower-bloom pulse-glow"
                    style={{animationDelay: '1.1s'}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-300/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-gray-800 font-medium">Arrangements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                <div className="relative flex-1">
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
                    className="w-full pl-12 sm:pl-16 pr-4 sm:pr-32 py-4 sm:py-6 text-base sm:text-lg border-2 border-gray-200 focus:border-tiffany focus:ring-tiffany rounded-sm sm:rounded-r-none transition-all duration-300 hover:shadow-lg"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-luxury-gray gentle-sway" />
                  </div>
                </div>
                <Link href={`/flowers/browse?search=${encodeURIComponent(searchQuery)}`}>
                  <Button className="w-full sm:w-auto sm:absolute sm:right-2 sm:top-1/2 sm:transform sm:-translate-y-1/2 luxury-button px-6 sm:px-8 py-4 h-auto rounded-sm sm:rounded-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    Shop Now
                  </Button>
                </Link>
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
