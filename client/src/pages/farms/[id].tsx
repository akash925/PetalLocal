import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProduceCard } from "@/components/produce-card";
import { MapPin, Phone, Globe, Mail, ArrowLeft, Star } from "lucide-react";
import { Link } from "wouter";

export default function FarmDetail() {
  const { id } = useParams();

  const { data: farmData, isLoading, error } = useQuery({
    queryKey: [`/api/farms/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !farmData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Farm not found</h1>
          <Link href="/produce">
            <Button>Browse Produce</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { produce = [] } = farmData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {farmData.imageUrl ? (
          <img
            src={farmData.imageUrl}
            alt={farmData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">{farmData.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link href="/produce">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Farm Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {farmData.isOrganic && (
                  <Badge className="bg-green-100 text-green-800">
                    Certified Organic
                  </Badge>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span>4.8 (24 reviews)</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {farmData.name}
              </h1>
              
              {farmData.description && (
                <p className="text-lg text-gray-700 leading-relaxed">
                  {farmData.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Farm Produce */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Fresh Produce from {farmData.name}
              </h2>
              
              {produce.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {produce.map((item: any) => (
                    <ProduceCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      category={item.category}
                      pricePerUnit={parseFloat(item.pricePerUnit)}
                      unit={item.unit}
                      imageUrl={item.imageUrl}
                      isOrganic={item.isOrganic}
                      isSeasonal={item.isSeasonal}
                      isHeirloom={item.isHeirloom}
                      farmName={farmData.name}
                      distance={2.5} // This would be calculated based on user location
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">🌱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No produce available
                  </h3>
                  <p className="text-gray-600">
                    This farm hasn't listed any produce items yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{farmData.address}</p>
                    <p>{farmData.city}, {farmData.state} {farmData.zipCode}</p>
                  </div>
                </div>
                
                {farmData.phoneNumber && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-3" />
                    <span>{farmData.phoneNumber}</span>
                  </div>
                )}
                
                {farmData.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-3" />
                    <a 
                      href={farmData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                <Button className="w-full bg-green-500 hover:bg-green-600 mt-4">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Farm
                </Button>
              </CardContent>
            </Card>

            {/* Farm Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Farm Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-medium">2.5 miles away</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produce Items</span>
                  <span className="font-medium">{produce.length} available</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Farming Method</span>
                  <span className="font-medium">
                    {farmData.isOrganic ? "Organic" : "Conventional"}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pickup Available</span>
                  <span className="font-medium text-green-600">Yes</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Available</span>
                  <span className="font-medium text-green-600">Yes</span>
                </div>
              </CardContent>
            </Card>

            {/* Visit Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Visit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Pickup Hours:</strong><br />
                    Monday - Friday: 8:00 AM - 6:00 PM<br />
                    Saturday: 8:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                  
                  <p>
                    <strong>Special Instructions:</strong><br />
                    Please call ahead for large orders. Farm tours available by appointment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
