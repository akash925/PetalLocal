import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ComprehensiveFlowerId } from "@/components/comprehensive-flower-id";
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
  BarChart3,
  Upload,
  Sparkles,
  Loader2
} from "lucide-react";

export default function Sell() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Smart routing function for Create Grower Account button
  const handleCreateGrowerAccount = () => {
    if (isAuthenticated && user?.role === 'farmer') {
      // User is already a farmer, redirect to dashboard
      setLocation('/dashboard/grower');
    } else if (isAuthenticated && user?.role === 'buyer') {
      // User is authenticated as buyer, redirect to signup with role change
      setLocation('/auth/signup?role=grower&upgrade=true');
    } else {
      // User is not authenticated, redirect to signup
      setLocation('/auth/signup?role=grower');
    }
  };

  // Smart routing function for Sign In button
  const handleSignIn = () => {
    if (isAuthenticated && user?.role === 'farmer') {
      // User is already a farmer, redirect to dashboard
      setLocation('/dashboard/grower');
    } else {
      // User needs to sign in
      setLocation('/auth/login');
    }
  };

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
            <Button 
              size="lg" 
              onClick={handleCreateGrowerAccount}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Go to Dashboard' : 'Start Selling Today'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSignIn}
              className="border-2 border-pink-500 text-pink-600 hover:bg-pink-50 px-8 py-4 rounded-xl text-lg font-semibold"
            >
              {isAuthenticated && user?.role === 'farmer' ? 'Grower Dashboard' : 'Sign In to Portal'}
            </Button>
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
            
            {/* Benefits & Features */}
            <div className="space-y-8">
              <Card className="shadow-xl border-none">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">AI Plant Identification</h3>
                    </div>
                    
                    {/* Functional Upload Interface */}
                    {!demoImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Upload or drag flower photo here</p>
                        <Button 
                          variant="outline" 
                          className="mb-4"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Select Photo
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Simple image preview
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setDemoImage(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                              
                              // Start real AI analysis
                              setIsAnalyzing(true);
                              
                              // Set up async AI analysis after image loads
                              reader.onload = async (loadEvent) => {
                                try {
                                  const base64Image = (loadEvent.target?.result as string).split(',')[1];
                                  
                                  // Call real API
                                  const response = await fetch('/api/analyze-plant', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ image: base64Image }),
                                  });
                                  
                                  const analysisData = await response.json();
                                  
                                  if (analysisData.success) {
                                    setAnalysisResult(analysisData);
                                    toast({
                                      title: "AI Analysis Complete!",
                                      description: `Identified: ${analysisData.plantType || 'Unknown plant'}`,
                                    });
                                  } else {
                                    // Handle graceful fallback
                                    setAnalysisResult({
                                      success: true,
                                      plantType: "Beautiful Flower",
                                      confidence: 0.85,
                                      bloomStage: "Full bloom",
                                      season: "Spring/Summer",
                                      estimatedQuantity: 12,
                                      suggestedPrice: "$3.50",
                                      source: "demo"
                                    });
                                  }
                                } catch (error) {
                                  console.error('AI analysis error:', error);
                                  // Provide demo results on error
                                  setAnalysisResult({
                                    success: true,
                                    plantType: "Beautiful Flower",
                                    confidence: 0.85,
                                    bloomStage: "Full bloom",
                                    season: "Spring/Summer",
                                    estimatedQuantity: 12,
                                    suggestedPrice: "$3.50",
                                    source: "demo"
                                  });
                                } finally {
                                  setIsAnalyzing(false);
                                }
                              };
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supports JPG, PNG files up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Image Preview */}
                        <div className="relative">
                          <img
                            src={demoImage}
                            alt="Uploaded flower"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-white"
                            onClick={() => {
                              setDemoImage(null);
                              setAnalysisResult(null);
                              setIsAnalyzing(false);
                            }}
                          >
                            Change Photo
                          </Button>
                        </div>

                        {/* Analysis Loading */}
                        {isAnalyzing && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
                            <span className="text-gray-600">Analyzing with AI...</span>
                          </div>
                        )}

                        {/* Analysis Results */}
                        {analysisResult && !isAnalyzing && (
                          <div className="space-y-4">
                            <div className="bg-green-50 rounded-lg p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="font-semibold text-green-800">Analysis Complete!</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Plant Type:</span>
                                  <div className="font-medium">{analysisResult.plantType}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Confidence:</span>
                                  <div className="font-medium">{Math.round((analysisResult.confidence || 0.85) * 100)}%</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Bloom Stage:</span>
                                  <div className="font-medium">{analysisResult.bloomStage || 'Full bloom'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Season:</span>
                                  <div className="font-medium">{analysisResult.season || 'Spring/Summer'}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Est. Quantity:</span>
                                  <div className="font-medium">{analysisResult.estimatedQuantity || 12} stems</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Suggested Price:</span>
                                  <div className="font-medium text-green-600">{analysisResult.suggestedPrice || '$3.50'}/stem</div>
                                </div>
                              </div>
                              
                              {analysisResult.source === "demo" && (
                                <p className="text-xs text-gray-500 mt-2">
                                  * Demo results shown - actual AI analysis provides detailed insights
                                </p>
                              )}
                            </div>

                            {/* Sample Flower Listing Preview */}
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
                                      Fresh {analysisResult.plantType?.toLowerCase() || 'flower'} in {analysisResult.bloomStage?.toLowerCase() || 'bloom'} stage. 
                                      Perfect for bouquets, arrangements, or garden decoration.
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="text-pink-600 font-semibold">
                                        {analysisResult.suggestedPrice || '$3.50'}/stem
                                      </div>
                                      <div className="text-gray-500">
                                        {analysisResult.estimatedQuantity || 12} available
                                      </div>
                                      <div className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">
                                        {analysisResult.season || 'Spring/Summer'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-xs text-pink-600 mt-2">
                                This is how your flower would appear as a marketplace listing with AI-generated details
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

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
          
          <p className="text-sm text-gray-500 mt-6">
            Free to start • Only 10% fee on sales • No monthly charges
          </p>
        </div>
      </section>
    </div>
  );
}