import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, User, CreditCard, Lock, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guestInfo: GuestInfo) => void;
  onSignIn?: () => void; // Callback for successful sign in
  item: {
    id: number;
    name: string;
    price: number;
    unit: string;
    farmName: string;
    imageUrl?: string;
  };
  quantity: number;
}

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export function GuestCheckoutModal({ isOpen, onClose, onSubmit, onSignIn, item, quantity }: GuestCheckoutModalProps) {
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [signInInfo, setSignInInfo] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();

  const total = (item.price || 0) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestInfo.email || !guestInfo.firstName || !guestInfo.lastName) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(guestInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof GuestInfo, value: string) => {
    setGuestInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSignInInputChange = (field: 'email' | 'password', value: string) => {
    setSignInInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInInfo.email || !signInInfo.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: signInInfo.email,
        password: signInInfo.password,
      });

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in. Continuing with your purchase...",
        });
        
        // Close modal and proceed with authenticated checkout
        onClose();
        if (onSignIn) {
          onSignIn();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Quick Checkout
          </DialogTitle>
          <DialogDescription>
            Complete your purchase quickly - sign in to your account or checkout as a guest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">From {item.farmName}</p>
                  <p className="text-sm">
                    {quantity} {item.unit} × ${(item.price || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Interface */}
          <Tabs defaultValue="guest" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guest" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Guest Checkout
              </TabsTrigger>
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guest">
              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={guestInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={guestInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Secure Account Creation</span>
              </div>
              <p className="text-sm text-green-600">
                We'll create a secure account for you and send order updates to your email.
                No password required - you can set one later.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !guestInfo.email || !guestInfo.firstName || !guestInfo.lastName}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInInfo.email}
                      onChange={(e) => handleSignInInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInInfo.password}
                      onChange={(e) => handleSignInInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Sign in to your existing account to complete your purchase with saved information.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSigningIn}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSigningIn || !signInInfo.email || !signInInfo.password}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSigningIn ? "Signing In..." : "Sign In & Continue"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}