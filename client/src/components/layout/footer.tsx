import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold">FarmDirect</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Connecting communities with fresh, local produce. Supporting sustainable farming and healthy eating, one harvest at a time.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">For Buyers</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/produce" className="hover:text-green-400 transition-colors duration-200">Browse Produce</Link></li>
              <li><Link href="/farms" className="hover:text-green-400 transition-colors duration-200">Find Local Farms</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">For Farmers</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/sell" className="hover:text-green-400 transition-colors duration-200">Sell Your Produce</Link></li>
              <li><Link href="/dashboard/farmer" className="hover:text-green-400 transition-colors duration-200">Farmer Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 FarmDirect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
