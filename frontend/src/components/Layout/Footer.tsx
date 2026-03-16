import { MapPin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center mr-2">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">PoolRoute OS</span>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-sm text-gray-500">
              © {currentYear} PoolRoute OS. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-gray-700 transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-gray-700 transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="hover:text-gray-700 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}