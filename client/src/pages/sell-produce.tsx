import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tractor, Sprout, Users, DollarSign, CheckCircle, ArrowRight } from "lucide-react";

export default function SellProduce() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect farmers to add produce
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "farmer") {
      window.location.href = "/dashboard/farmer?tab=add-produce";
    }
  }, [isLoading, isAuthenticated, user]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If farmer, redirect handled above
  if (isAuthenticated && user?.role === "farmer") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
                <Sprout className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sell Your Beautiful Flowers
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join our community of local flower growers and connect directly with customers who value fresh, beautiful blooms. 
              Set your own prices, manage your inventory, and grow your business.
            </p>
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register?role=grower">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3">
                    Start Selling Today
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="px-8 py-3">
                    Already a Farmer? Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">You're logged in as a buyer.</p>
                <Link href="/auth/register?role=grower">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3">
                    Create Grower Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Farmers Choose FarmDirect
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to sell your produce online
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Set Your Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You control pricing and keep 90% of every sale. No hidden fees or surprise deductions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Direct to Consumer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Build relationships with local customers who appreciate fresh, quality produce.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sprout className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Easy Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simple dashboard to manage your farm profile, products, orders, and customer messages.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatic payment processing with secure transactions and reliable payouts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">
                  1
                </Badge>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Account</h3>
              <p className="text-gray-600">
                Sign up as a farmer and set up your farm profile with photos and description.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">
                  2
                </Badge>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">List Your Produce</h3>
              <p className="text-gray-600">
                Add your fresh produce with photos, descriptions, and pricing. Update inventory as needed.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">
                  3
                </Badge>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Selling</h3>
              <p className="text-gray-600">
                Receive orders, communicate with customers, and get paid automatically for each sale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join hundreds of local flower growers already selling on PetalLocal
          </p>
          {!isAuthenticated ? (
            <Link href="/auth/register?role=grower">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3">
                Create Your Grower Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register?role=grower">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3">
                Create Grower Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}