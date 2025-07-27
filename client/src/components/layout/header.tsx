import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Menu, User, LogOut, MessageCircle, ChevronDown, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { toast } = useToast();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unread message count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Immediately clear the user cache for instant state update
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Clear cart on logout
      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('user-logout'));
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-tiffany rounded-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18c-8 0-10-4.687-10-7 0-3.5 2.5-4 4-4 .474 0 1.755.053 2.5-.5.75-.553 1.5-2.5 3.5-2.5s2.75 1.947 3.5 2.5c.745.553 2.026.5 2.5.5 1.5 0 4 .5 4 4 0 2.313-2 7-10 7z"/>
                </svg>
              </div>
              <span className="ml-3 text-2xl luxury-heading">PETALLOCAL</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-12">
            <Link href="/flowers" className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors ${location === '/flowers' || location === '/produce' ? 'text-tiffany border-b-2 border-tiffany' : 'text-luxury-black hover:text-tiffany'}`}>
              FLOWERS
            </Link>
            <Link href="/farms" className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors ${location === '/farms' ? 'text-tiffany border-b-2 border-tiffany' : 'text-luxury-black hover:text-tiffany'}`}>
              GROWERS
            </Link>
            {!isAuthenticated && (
              <Link href="/sell" className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors ${location === '/sell' ? 'text-tiffany border-b-2 border-tiffany' : 'text-luxury-black hover:text-tiffany'}`}>
                SELL FLOWERS
              </Link>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin" className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors ${location === '/admin' || location === '/dashboard/admin' ? 'text-tiffany border-b-2 border-tiffany' : 'text-luxury-black hover:text-tiffany'}`}>
                ADMIN
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Messages */}
            {isAuthenticated && (
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                      {unreadCount.count}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative hover:text-tiffany">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-tiffany">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <div className="flex items-center">
                    <div className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 bg-pink-50 rounded-lg cursor-pointer hover:bg-pink-100"
                         onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                      <User className="w-4 h-4 text-pink-600" />
                      <span className="hidden sm:block text-sm text-pink-700 font-medium">
                        {user?.firstName || user?.email}
                      </span>
                      <span className="text-xs text-pink-600 bg-pink-100 px-1 md:px-2 py-1 rounded">
                        {user?.role || 'buyer'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-pink-600" />
                    </div>
                  </div>
                  
                  {/* User dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">

                      
                      {user?.role === 'farmer' && (
                        <Link href="/dashboard/grower" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Settings className="w-4 h-4 inline mr-2" />
                          Grower Dashboard
                        </Link>
                      )}
                      
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Settings className="w-4 h-4 inline mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsUserMenuOpen(false);
                        }}
                        disabled={logoutMutation.isPending}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/sell">
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                      Sell Flowers
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu for small screens */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-200 bg-white" ref={mobileMenuRef}>
            <div className="flex flex-col space-y-4 px-4">
              <Link href="/flowers" className="px-4 py-3 text-base font-medium text-gray-700 hover:text-tiffany hover:bg-gray-50 rounded-lg transition-colors">
                Browse Flowers
              </Link>
              <Link href="/farms" className="px-4 py-3 text-base font-medium text-gray-700 hover:text-tiffany hover:bg-gray-50 rounded-lg transition-colors">
                Local Growers
              </Link>
              {!isAuthenticated && (
                <Link href="/sell" className="px-4 py-3 text-base font-medium text-pink-600 font-semibold hover:bg-pink-50 rounded-lg transition-colors">
                  Sell Flowers
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  {user?.role === 'farmer' && (
                    <Link href="/dashboard/grower" className="px-3 py-2 text-sm font-medium text-gray-700">
                      Grower Dashboard
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link href="/dashboard/admin" className="px-3 py-2 text-sm font-medium text-gray-700">
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="px-3 py-2 text-sm font-medium text-gray-700">
                    Hello, {user?.firstName || user?.email}
                  </div>
                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="px-3 py-2 text-sm font-medium text-red-600 text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-gray-700">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="px-3 py-2 text-sm font-medium text-green-600">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
