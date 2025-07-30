import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, Clock, DollarSign, Package, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DeliveryOption {
  id: string;
  name: string;
  type: 'pickup' | 'local_delivery' | 'third_party';
  estimatedTime: string;
  fee: number;
  description: string;
  isAvailable: boolean;
}

interface DeliveryOptionsProps {
  farmLocation: { lat: number; lng: number };
  customerZipCode: string;
  onSelectionChange: (option: DeliveryOption) => void;
  selectedOption?: string;
}

export function DeliveryOptions({ 
  farmLocation, 
  customerZipCode, 
  onSelectionChange, 
  selectedOption 
}: DeliveryOptionsProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string>(selectedOption || 'pickup');

  // Fetch available delivery options
  const { data: deliveryOptions = [], isLoading } = useQuery<DeliveryOption[]>({
    queryKey: ['/api/delivery/options', customerZipCode, farmLocation],
    queryFn: async () => {
      return await apiRequest('POST', '/api/delivery/options', {
        zipCode: customerZipCode,
        farmLocation,
      }) as DeliveryOption[];
    },
    enabled: !!customerZipCode && !!farmLocation,
  });

  const handleSelectionChange = (optionId: string) => {
    setSelectedDelivery(optionId);
    const option = deliveryOptions.find(opt => opt.id === optionId);
    if (option) {
      onSelectionChange(option);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Package className="w-5 h-5 text-tiffany" />;
      case 'local_delivery':
        return <Truck className="w-5 h-5 text-green-600" />;
      case 'third_party':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pickup':
        return 'bg-tiffany/10 text-tiffany border-tiffany/20';
      case 'local_delivery':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'third_party':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Loading Delivery Options...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 luxury-heading">
          <Truck className="w-5 h-5 text-tiffany" />
          Delivery & Pickup Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedDelivery} onValueChange={handleSelectionChange}>
          <div className="space-y-4">
            {deliveryOptions.map((option) => (
              <div key={option.id} className="relative">
                <Label
                  htmlFor={option.id}
                  className={`block cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    selectedDelivery === option.id
                      ? 'border-tiffany bg-tiffany/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!option.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      disabled={!option.isAvailable}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getIcon(option.type)}
                          <span className="font-semibold text-gray-900">
                            {option.name}
                          </span>
                          <Badge className={getTypeColor(option.type)}>
                            {option.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {option.fee === 0 ? 'Free' : `$${option.fee.toFixed(2)}`}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {option.estimatedTime}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                      
                      {option.id === 'pickup' && (
                        <div className="bg-tiffany/10 border border-tiffany/20 rounded-md p-3 mt-2">
                          <div className="flex items-center gap-2 text-sm text-tiffany font-medium">
                            <Package className="w-4 h-4" />
                            QR Code Pickup Instructions
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            After placing your order, you'll receive a QR code receipt. 
                            Show this code to the grower when picking up your flowers.
                          </p>
                        </div>
                      )}
                      
                      {!option.isAvailable && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                          <p className="text-xs text-red-600">
                            Not available in your area at this time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        
        {deliveryOptions.length === 0 && (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No delivery options available for your location.</p>
            <p className="text-sm text-gray-400">Please contact the grower directly.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}