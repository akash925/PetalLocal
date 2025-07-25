import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Flower, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Camera, 
  MapPin, 
  Clock, 
  Star,
  ArrowRight,
  CheckCircle,
  Smartphone,
  BarChart3
} from "lucide-react";

export default function GrowerPortal() {
  const features = [
    {
      icon: <Camera className="w-8 h-8 text-pink-500" />,
      title: "AI-Powered Listings",
      description: "Upload photos and let our AI identify your flowers, suggest prices, and optimize descriptions automatically."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-pink-500" />,
      title: "Smart Analytics",
      description: "Track your sales, monitor popular flowers, and get insights on the best times to list your blooms."
    },
    {
      icon: <MapPin className="w-8 h-8 text-pink-500" />,
      title: "Local Discovery",
      description: "Customers find you through location-based search and interactive maps showing your farm and available flowers."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-pink-500" />,
      title: "Mobile-First",
      description: "Manage your flower listings, respond to customers, and track orders from anywhere with our mobile-optimized platform."
    }
  ];

  const stats = [
    { label: "Average Monthly Revenue", value: "$2,400", icon: <DollarSign className="w-5 h-5" /> },
    { label: "Platform Fee", value: "Only 10%", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Active Buyers", value: "1,200+", icon: <Users className="w-5 h-5" /> },
    { label: "Average Rating", value: "4.8★", icon: <Star className="w-5 h-5" /> }
  ];

  const benefits = [
    "Reach local customers actively seeking fresh flowers",
    "AI-powered photo analysis and inventory management",
    "Integrated payment processing with instant payouts",
    "Customer review system builds your reputation",
    "Seasonal demand insights and pricing recommendations",
    "Mobile-friendly dashboard for on-the-go management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-pink-100 text-pink-800 hover:bg-pink-100">
            <Flower className="w-4 h-4 mr-2" />
            For Flower Growers
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Your Garden Into a
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 block">
              Thriving Business
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join PetalLocal's marketplace and connect with flower lovers in your community. 
            List your blooms, manage inventory with AI assistance, and grow your floral business 
            with tools designed specifically for growers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup?role=farmer">
              <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Start Selling Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-pink-500 text-pink-600 hover:bg-pink-50 px-8 py-4 rounded-xl text-lg font-semibold">
                Sign In to Portal
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center text-pink-500 mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform is built specifically for flower growers, with features that understand 
              the unique needs of your seasonal, beautiful, and delicate products.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Growers Choose PetalLocal
          </h2>
          <p className="text-xl text-pink-100 mb-12">
            Join hundreds of successful flower growers who have grown their business with our platform
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-pink-200 mt-1 flex-shrink-0" />
                <span className="text-white text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-pink-50 to-white">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <Flower className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  "PetalLocal transformed my small garden into a $50k/year business"
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  "I started with just a few rose bushes in my backyard. The AI tools helped me understand 
                  which flowers were in demand, and the local customer base grew my business beyond my wildest dreams. 
                  Now I supply weddings, events, and weekly flower subscriptions throughout my community."
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-bold">SM</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Sarah Martinez</div>
                    <div className="text-gray-600">Rose Haven Gardens, Roseville CA</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Grow Your Flower Business?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join our community of successful flower growers. Start listing your blooms today 
            and connect with customers who appreciate locally-grown, fresh flowers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=farmer">
              <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Create Grower Account
                <Flower className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-10 py-4 rounded-xl text-lg font-semibold">
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Free to start • Only 10% fee on sales • No monthly charges
          </p>
        </div>
      </section>
    </div>
  );
}