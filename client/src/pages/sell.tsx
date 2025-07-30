import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ComprehensiveFlowerId } from "@/components/comprehensive-flower-id";
import { 
  Flower, 
  DollarSign, 
  Users, 
  Globe, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  Heart, 
  Target,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Sell() {
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleCreateGrowerAccount = () => {
    if (isAuthenticated && user?.role === 'farmer') {
      setLocation('/dashboard/grower');
    } else {
      setLocation('/auth/signup?role=farmer');
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated && user?.role === 'farmer') {
      setLocation('/dashboard/grower');
    } else {
      setLocation('/auth/login');
    }
  };

  const features = [
    {
      icon: <Camera className="w-8 h-8 text-pink-500" />,
      title: "AI-Powered Listings",
      description: "Upload photos and let our AI identify your flowers automatically."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-green-500" />,
      title: "Smart Pricing",
      description: "Get market-based pricing suggestions to maximize your profits."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Local Customer Base",
      description: "Connect directly with customers in your community who value fresh, local flowers."
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-500" />,
      title: "Easy Delivery Options",
      description: "Offer pickup, local delivery, or third-party delivery through our platform."
    }
  ];

  const benefits = [
    "Keep 95% of your sales revenue",
    "No monthly fees or hidden charges",  
    "AI tools to optimize your listings",
    "Direct communication with customers",
    "Flexible delivery and pickup options",
    "Marketing support and customer reviews",
    "Real-time inventory management",
    "Professional seller dashboard"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-600/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-pink-500 text-white px-4 py-2 text-sm font-medium">
            ✨ AI-Powered Flower Marketplace
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Your Garden Into a 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600"> Thriving Business</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of flower growers using PetalLocal's AI-powered platform to sell directly to customers, 
            manage inventory, and grow their business with smart tools and local marketing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleCreateGrowerAccount}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Go to Dashboard' : 'Start Selling Flowers'}
              <Flower className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSignIn}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl text-lg font-semibold"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Grower Dashboard' : 'Sign In'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">2,500+</div>
              <div className="text-gray-600">Active Growers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">$2.3M+</div>
              <div className="text-gray-600">Grower Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">15,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Try Our AI Flower Identification
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload a photo of any flower and see how our AI instantly identifies it, 
              provides growth insights, and suggests optimal pricing for your listings.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* AI Demo Interface */}
            <div className="lg:sticky lg:top-20">
              <ComprehensiveFlowerId
                onAnalysisComplete={(analysis) => {
                  setAnalysisResult(analysis);
                  if (analysis.success) {
                    toast({
                      title: "Analysis Complete!",
                      description: `Identified: ${analysis.plantType || 'Unknown flower'}`,
                    });
                  }
                }}
                onImageSelect={(imageUrl) => setDemoImage(imageUrl)}
                showFormFilling={false}
                className="max-w-lg mx-auto"
              />
            </div>
            
            {/* Analysis Results Display */}
            <div className="space-y-8">
              {analysisResult && analysisResult.success && (
                <div className="space-y-6">
                  {/* Main Analysis Card */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-green-800 text-lg">AI Analysis Complete!</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Identified:</span>
                        <div className="font-medium text-green-600">{analysisResult.plantType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <div className="font-medium text-green-600">{Math.round((analysisResult.confidence || 0) * 100)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <div className="font-medium text-green-600">{analysisResult.category || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Variety:</span>
                        <div className="font-medium text-green-600">{analysisResult.variety || 'Unknown'}</div>
                      </div>
                      {analysisResult.estimatedYield && (
                        <>
                          <div>
                            <span className="text-gray-600">Estimated Quantity:</span>
                            <div className="font-medium text-green-600">{analysisResult.estimatedYield.quantity} {analysisResult.estimatedYield.unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Suggested Price:</span>
                            <div className="font-medium text-green-600">{analysisResult.suggestions?.priceRange || '$3.50/stem'}</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {analysisResult.source && (
                      <div className="mt-4 text-xs text-green-600">
                        Source: {analysisResult.source === 'openai' ? 'OpenAI GPT-4o' : 'Intelligent Fallback'}
                      </div>
                    )}
                  </div>

                  {/* Sample Flower Listing Preview */}
                  {demoImage && (
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generated Flower Listing Preview
                      </h4>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex gap-4">
                          <img
                            src={demoImage}
                            alt="Identified flower"
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold text-lg text-gray-900 mb-1">
                              {analysisResult.plantType}
                            </h5>
                            <p className="text-gray-600 text-sm mb-2">
                              Fresh {analysisResult.plantType?.toLowerCase() || 'flower'} in {analysisResult.growthStage?.toLowerCase() || 'bloom'} stage. 
                              Perfect for bouquets, arrangements, or garden decoration.
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-pink-600 font-semibold">
                                {analysisResult.suggestions?.priceRange || '$3.50/stem'}
                              </div>
                              <div className="text-gray-500">
                                {analysisResult.estimatedYield?.quantity || 12} available
                              </div>
                              <div className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">
                                {analysisResult.maturitySeason?.season || 'Spring/Summer'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-pink-600 mt-2">
                        This is how your flower would appear as a marketplace listing with AI-generated details
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Features List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Powered by Advanced AI Technology
                </h3>
                
                {features.map((feature, index) => (
                  <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 group-hover:scale-110 transition-transform duration-200">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                          <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
            <Button 
              size="lg" 
              onClick={handleCreateGrowerAccount}
              className="bg-pink-500 hover:bg-pink-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Go to Dashboard' : 'Create Grower Account'}
              <Flower className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSignIn}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-10 py-4 rounded-xl text-lg font-semibold"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Grower Dashboard' : 'Sign In to Existing Account'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}