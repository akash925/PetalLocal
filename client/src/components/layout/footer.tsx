import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18c-8 0-10-4.687-10-7 0-3.5 2.5-4 4-4 .474 0 1.755.053 2.5-.5.75-.553 1.5-2.5 3.5-2.5s2.75 1.947 3.5 2.5c.745.553 2.026.5 2.5.5 1.5 0 4 .5 4 4 0 2.313-2 7-10 7z"/>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold">PetalLocal</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Connecting communities with beautiful, local flowers. Supporting local growers and bringing natural beauty to every home, one bloom at a time.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">For Buyers</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/flowers" className="hover:text-pink-400 transition-colors duration-200">Browse Flowers</Link></li>
              <li><Link href="/farms" className="hover:text-pink-400 transition-colors duration-200">Find Local Growers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">For Growers</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/sell" className="hover:text-pink-400 transition-colors duration-200">Sell Your Flowers</Link></li>
              <li><Link href="/dashboard/farmer" className="hover:text-pink-400 transition-colors duration-200">Grower Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 PetalLocal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
