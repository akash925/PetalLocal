import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Menu, User } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">FarmDirect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/produce" className={`px-3 py-2 text-sm font-medium ${location === '/produce' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
              Browse Produce
            </Link>
            <Link href="/farms" className={`px-3 py-2 text-sm font-medium ${location === '/farms' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
              Local Farms
            </Link>
            {isAuthenticated && user?.role === 'farmer' && (
              <Link href="/dashboard/farmer" className={`px-3 py-2 text-sm font-medium ${location === '/dashboard/farmer' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/dashboard/admin" className={`px-3 py-2 text-sm font-medium ${location === '/dashboard/admin' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-green-500">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user?.firstName || user?.email}
                  </span>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Get Started
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link href="/produce" className="px-3 py-2 text-sm font-medium text-gray-700">
                Browse Produce
              </Link>
              <Link href="/farms" className="px-3 py-2 text-sm font-medium text-gray-700">
                Local Farms
              </Link>
              {!isAuthenticated && (
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
