import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InstagramConnectProps {
  currentHandle?: string;
  onSuccess?: (handle: string) => void;
  className?: string;
}

export function InstagramConnect({
  currentHandle,
  onSuccess,
  className = "",
}: InstagramConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const response = await apiRequest("GET", "/api/auth/instagram");
      const data = await response.json();
      
      if (data.authUrl) {
        // Open Instagram OAuth in a popup
        const popup = window.open(
          data.authUrl,
          'instagram-oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the popup to close or send a message
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            
            // Check if connection was successful
            // In a real implementation, you'd handle the OAuth callback
            toast({
              title: "Instagram connection",
              description: "Please try connecting again if the process was interrupted",
              variant: "default",
            });
          }
        }, 1000);

        // Handle message from popup (OAuth callback)
        window.addEventListener('message', (event) => {
          if (event.data.type === 'INSTAGRAM_OAUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup?.close();
            
            toast({
              title: "Instagram connected!",
              description: `Successfully connected to @${event.data.username}`,
            });
            
            onSuccess?.(event.data.username);
            setIsConnecting(false);
          } else if (event.data.type === 'INSTAGRAM_OAUTH_ERROR') {
            clearInterval(checkClosed);
            popup?.close();
            
            toast({
              title: "Connection failed",
              description: event.data.error || "Failed to connect Instagram account",
              variant: "destructive",
            });
            
            setIsConnecting(false);
          }
        });

      } else {
        throw new Error("Failed to get Instagram authorization URL");
      }
    } catch (error) {
      console.error("Instagram connect error:", error);
      toast({
        title: "Connection unavailable",
        description: "Instagram OAuth is not configured. You can still add your handle manually.",
        variant: "default",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Instagram className="w-5 h-5 mr-2" />
          Instagram Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentHandle ? (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="font-medium text-green-800">Connected to Instagram</p>
                <p className="text-sm text-green-600">@{currentHandle}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-gray-500 mr-2" />
              <div>
                <p className="font-medium text-gray-800">Instagram not connected</p>
                <p className="text-sm text-gray-600">Connect to showcase your farm</p>
              </div>
            </div>
            <Badge variant="outline">
              Not connected
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Benefits of connecting Instagram:</p>
            <ul className="space-y-1 text-xs">
              <li>• Automatically sync your Instagram handle</li>
              <li>• Show your farm's social media presence</li>
              <li>• Build trust with potential customers</li>
              <li>• Display your Instagram link on your farm profile</li>
            </ul>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                {currentHandle ? "Reconnect" : "Connect"} Instagram
              </>
            )}
          </Button>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Manual Alternative:</p>
              <p className="text-xs mt-1">
                You can also manually enter your Instagram handle in the form above if OAuth is not available.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}