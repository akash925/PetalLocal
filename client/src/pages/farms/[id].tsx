import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProduceCard } from "@/components/produce-card";
import { MessageFarmerButton } from "@/components/message-farmer-button";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
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
                  <span>{farmData.rating || 0} ({farmData.reviewCount || 0} reviews)</span>
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

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (farmData.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {farmData.rating ? `${farmData.rating}/5` : "No ratings yet"}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ReviewForm farmId={parseInt(id)} farmName={farmData.name} />
                <ReviewList farmId={parseInt(id)} />
              </div>
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
                
                {farmData.instagramHandle && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <a 
                      href={`https://instagram.com/${farmData.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      @{farmData.instagramHandle.replace('@', '')}
                    </a>
                  </div>
                )}

                <MessageFarmerButton
                  farmerId={farmData.ownerId}
                  farmerName={farmData.name}
                  triggerText="Contact Farm"
                  variant="default"
                  size="default"
                />

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
