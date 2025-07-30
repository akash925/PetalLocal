import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Share2, MapPin, Clock, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QRPickupReceiptProps {
  orderId: number;
  orderTotal: number;
  farmInfo: {
    name: string;
    address: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function QRPickupReceipt({ orderId, orderTotal, farmInfo, items }: QRPickupReceiptProps) {
  const [isShared, setIsShared] = useState(false);

  // Generate QR code for pickup
  const { data: qrCode, isLoading } = useQuery<string>({
    queryKey: ['/api/delivery/pickup-qr', orderId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/delivery/pickup-qr', {
        orderId,
        orderTotal,
      }) as { qrCodeDataURL: string };
      return response.qrCodeDataURL;
    },
  });

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `pickup-receipt-${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share && qrCode) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCode);
        const blob = await response.blob();
        const file = new File([blob], `pickup-receipt-${orderId}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `Pickup Receipt - Order #${orderId}`,
          text: `Flower pickup receipt for ${farmInfo.name}`,
          files: [file],
        });
        setIsShared(true);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 luxury-heading">
          <Package className="w-5 h-5 text-tiffany" />
          Pickup Receipt
        </CardTitle>
        <Badge className="bg-green-100 text-green-800 mx-auto">
          Order #{orderId} - Ready for Pickup
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="text-center">
          {isLoading ? (
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiffany"></div>
            </div>
          ) : qrCode ? (
            <div className="space-y-3">
              <img 
                src={qrCode} 
                alt={`Pickup QR Code for Order ${orderId}`}
                className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg"
              />
              <p className="text-sm text-gray-600">
                Show this QR code to the grower when picking up your flowers
              </p>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-red-50 rounded-lg flex items-center justify-center">
              <p className="text-red-500 text-sm">Failed to generate QR code</p>
            </div>
          )}
        </div>

        {/* Farm Information */}
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-tiffany" />
            Pickup Location
          </h3>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{farmInfo.name}</p>
            <p className="text-gray-600">{farmInfo.address}</p>
            <p className="text-gray-600">Phone: {farmInfo.phone}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900">Order Summary</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-tiffany/10 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-tiffany flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pickup Instructions
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Show this QR code to the grower</li>
            <li>• Verify your order details</li>
            <li>• Inspect flowers before leaving</li>
            <li>• QR code expires in 24 hours</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={!qrCode}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleShare}
            disabled={!qrCode || !navigator.share}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {isShared ? 'Shared!' : 'Share'}
          </Button>
        </div>

        {/* QR Scanner Tip */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 text-center">
            💡 Tip: Most smartphones can scan QR codes using the camera app
          </p>
        </div>
      </CardContent>
    </Card>
  );
}