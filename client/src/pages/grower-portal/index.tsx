import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryOptions } from "@/components/delivery/DeliveryOptions";
import { Truck, Package, MapPin, Clock, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function GrowerPortalPage() {
  // Mock delivery options for demonstration
  const mockFarmLocation = { lat: 37.7749, lng: -122.4194 };
  const mockZipCode = "94102";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold luxury-heading mb-4">
            Delivery & Pickup Solutions for Flower Growers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expand your reach with integrated delivery options and QR code pickup verification. 
            Connect with customers through multiple delivery channels.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Package className="w-12 h-12 text-tiffany mx-auto mb-4" />
              <CardTitle>QR Code Pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate secure QR codes for customer pickup verification. 
                No more confusion about order completion.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Local Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Offer same-day local delivery within your service area. 
                Set your own delivery fees and zones.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Third-Party Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Connect with DoorDash, Uber Eats, and other delivery platforms. 
                Expand your customer base instantly.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Demo */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Live Delivery Options Demo
              </CardTitle>
              <p className="text-center text-gray-600">
                See how customers will choose delivery options for your flowers
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto">
                <DeliveryOptions
                  farmLocation={mockFarmLocation}
                  customerZipCode={mockZipCode}
                  onSelectionChange={(option) => console.log('Selected:', option)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">For Pickup Orders</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Package className="w-6 h-6 text-tiffany mt-1" />
                <div>
                  <h4 className="font-semibold">Secure QR Verification</h4>
                  <p className="text-gray-600">Customers receive a unique QR code with their order receipt</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-tiffany mt-1" />
                <div>
                  <h4 className="font-semibold">24-Hour Validity</h4>
                  <p className="text-gray-600">QR codes expire automatically for security</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-tiffany mt-1" />
                <div>
                  <h4 className="font-semibold">Clear Instructions</h4>
                  <p className="text-gray-600">Customers get your farm address and pickup instructions</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6">For Delivery Orders</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Truck className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Multiple Options</h4>
                  <p className="text-gray-600">Local delivery, DoorDash, Uber Eats, and more</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <DollarSign className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Flexible Pricing</h4>
                  <p className="text-gray-600">Set your own delivery fees or use platform rates</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Real-Time Tracking</h4>
                  <p className="text-gray-600">Customers track their orders from farm to door</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Integration */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Delivery Platform Integration
            </CardTitle>
            <p className="text-center text-gray-600">
              Connect with major delivery services through our unified API
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <h4 className="font-bold text-red-700 text-xl mb-2">DoorDash</h4>
                <p className="text-red-600">30-45 minute delivery</p>
                <p className="text-red-600">$4.99 average fee</p>
                <p className="text-sm text-red-500 mt-2">10 mile radius</p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h4 className="font-bold text-green-700 text-xl mb-2">Uber Eats</h4>
                <p className="text-green-600">25-40 minute delivery</p>
                <p className="text-green-600">$3.99 average fee</p>
                <p className="text-sm text-green-500 mt-2">8 mile radius</p>
              </div>
              
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <h4 className="font-bold text-orange-700 text-xl mb-2">Grubhub</h4>
                <p className="text-orange-600">35-50 minute delivery</p>
                <p className="text-orange-600">$5.99 average fee</p>
                <p className="text-sm text-orange-500 mt-2">12 mile radius</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">
                Integration powered by KitchenHub unified API
              </p>
              <p className="text-sm text-gray-500">
                Single integration connects to all major delivery platforms
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold luxury-heading mb-4">
                Ready to Expand Your Delivery Options?
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                Join PetalLocal and start offering pickup and delivery to more customers today.
              </p>
              <div className="space-y-4">
                <Link href="/auth/register">
                  <Button size="lg" className="luxury-button text-lg px-8 py-4">
                    Start Selling Flowers
                  </Button>
                </Link>
                <div className="text-sm text-gray-500">
                  Free to join • No setup fees • Start earning immediately
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}