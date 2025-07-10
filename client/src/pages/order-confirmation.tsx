import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Home, MessageSquare } from "lucide-react";

export default function OrderConfirmation() {
  useEffect(() => {
    // Clear any cart data from localStorage if needed
    localStorage.removeItem('cart');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">
            Thank you for supporting local farmers
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2" />
              What's Next?
            </CardTitle>
            <CardDescription>
              Here's what to expect after your purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-sm text-gray-600">
                  Your order is being prepared by the farmers
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Harvest & Packaging</h3>
                <p className="text-sm text-gray-600">
                  Fresh produce is harvested and carefully packaged
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Delivery or Pickup</h3>
                <p className="text-sm text-gray-600">
                  Your order will be delivered or ready for pickup
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Stay Connected
              </h3>
              <p className="text-sm text-green-700">
                You'll receive updates about your order via email and can message farmers directly
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="flex-1 sm:flex-none">
              <Home className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <MessageSquare className="w-4 h-4 mr-2" />
              View Messages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}