import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ArrowRight, MapPin, TrendingUp, Shield, Users } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              The Future of{' '}
              <span className="text-primary-600">Pool Route</span>{' '}
              Management
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Buy, sell, and manage pool service routes with unprecedented transparency.
              Visualize portfolios, analyze acquisitions, and streamline operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary btn-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/marketplace"
                    className="btn btn-outline btn-lg"
                  >
                    Browse Routes
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Pool Service Operators Choose PoolRoute OS
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your route management with data-driven insights and a trusted marketplace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Portfolio Visualization
              </h3>
              <p className="text-gray-600">
                See all your routes on an interactive map. Analyze coverage, optimize drive times,
                and identify expansion opportunities.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Acquisition Analysis
              </h3>
              <p className="text-gray-600">
                Evaluate route purchases with confidence. Model overlap, calculate ROI,
                and make data-driven acquisition decisions.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Trusted Marketplace
              </h3>
              <p className="text-gray-600">
                Buy and sell routes with transparency. Access payment history, retention data,
                and escrow protection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Built for Modern Pool Service Operations
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Import Your Existing Routes
                    </h3>
                    <p className="text-gray-600">
                      Upload CSV files, scan documents, or manually enter your current accounts.
                      Get up and running in minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Smart Route Analysis
                    </h3>
                    <p className="text-gray-600">
                      Evaluate potential acquisitions with geographic overlap analysis,
                      drive time optimization, and financial impact modeling.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Mobile-First Design
                    </h3>
                    <p className="text-gray-600">
                      Access your routes and manage accounts from anywhere.
                      Optimized for phone and tablet use in the field.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="btn btn-primary"
                  >
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-gray-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Interactive Route Map
                    <br />
                    <span className="text-sm">Coming in MVP</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Route Management?
              </h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                Join the growing community of pool service operators using PoolRoute OS
                to scale their businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-md font-medium transition-colors inline-flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Link
                  to="/marketplace"
                  className="border border-primary-300 text-white hover:bg-primary-700 px-8 py-3 rounded-md font-medium transition-colors inline-flex items-center justify-center"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}