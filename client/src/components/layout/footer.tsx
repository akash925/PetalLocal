import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const { isAuthenticated, user } = useAuth();
  return (
    <footer className="bg-white text-black border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-tiffany rounded-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18c-8 0-10-4.687-10-7 0-3.5 2.5-4 4-4 .474 0 1.755.053 2.5-.5.75-.553 1.5-2.5 3.5-2.5s2.75 1.947 3.5 2.5c.745.553 2.026.5 2.5.5 1.5 0 4 .5 4 4 0 2.313-2 7-10 7z"/>
                </svg>
              </div>
              <span className="ml-2 text-xl text-black luxury-heading font-light">PetalLocal</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md font-light leading-relaxed">
              Connecting communities with beautiful, local flowers. Supporting local growers and bringing natural beauty to every home, one bloom at a time.
            </p>
          </div>

          <div>
            <h3 className="text-lg text-black luxury-heading font-light mb-4">For Buyers</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/flowers" className="hover:text-tiffany transition-colors duration-200 font-light">Browse Flowers</Link></li>
              <li><Link href="/farms" className="hover:text-tiffany transition-colors duration-200 font-light">Find Local Growers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg text-black luxury-heading font-light mb-4">For Growers</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/sell" className="hover:text-tiffany transition-colors duration-200 font-light">Sell Your Flowers</Link></li>
              <li>
                {isAuthenticated && user?.role === 'farmer' ? (
                  <Link href="/dashboard/grower" className="hover:text-tiffany transition-colors duration-200 font-light">Grower Dashboard</Link>
                ) : (
                  <Link href="/auth/signup?role=grower" className="hover:text-tiffany transition-colors duration-200 font-light">Grower Dashboard</Link>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm font-light">
            © 2025 PetalLocal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
