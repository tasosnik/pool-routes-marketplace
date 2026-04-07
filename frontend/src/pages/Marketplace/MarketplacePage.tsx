import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FunnelIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import CreateListingModal from '../../components/Marketplace/CreateListingModal'
import toast from 'react-hot-toast'
import { marketplaceService } from '../../services/marketplaceService'
import { useAuthStore } from '../../store/authStore'
import type { RouteListing } from '../../types'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [listings, setListings] = useState<RouteListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ location: '', maxPrice: '' })

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice)
      if (filters.location) params.location = filters.location

      const response = await marketplaceService.getListings(params)
      if (response.success && response.data) {
        setListings(response.data.data || [])
      } else {
        toast.error(response.error || 'Failed to load listings')
      }
    } catch {
      toast.error('Failed to load marketplace listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const handleApplyFilters = () => {
    fetchListings()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Route Marketplace</h1>
        {isAuthenticated ? (
          <button
            onClick={() => setShowCreateListing(true)}
            className="btn btn-primary flex items-center gap-2"
            aria-label="List a route for sale"
          >
            <PlusCircleIcon className="h-5 w-5" />
            List Route for Sale
          </button>
        ) : (
          <button
            onClick={() => navigate('/login', { state: { from: { pathname: '/marketplace' } } })}
            className="btn btn-primary flex items-center gap-2"
            aria-label="Login to list a route for sale"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Login to List a Route
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="btn btn-outline flex items-center gap-2"
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
        </button>

        {filterOpen && (
          <div className="card mt-4">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="City or ZIP"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                  </label>
                  <input
                    id="maxPrice"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="200000"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleApplyFilters}
                    className="btn btn-primary w-full"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading listings...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Listings Available
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no routes listed for sale right now. Be the first to list yours!
                </p>
                <button
                  onClick={() => setShowCreateListing(true)}
                  className="btn btn-primary"
                >
                  List Route for Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listings grid */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {listing.route?.serviceAreaName || 'Location not specified'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Accounts:</span>
                    <span className="font-medium">{listing.accountCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Revenue:</span>
                    <span className="font-medium">{formatCurrency(listing.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Retention Rate:</span>
                    <span className="font-medium">{listing.retentionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium">
                      {listing.seller ? `${listing.seller.firstName} ${listing.seller.lastName}` : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(listing.askingPrice)}
                    </span>
                    <button
                      onClick={() => navigate(`/marketplace/${listing.id}`)}
                      className="btn btn-sm btn-primary"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateListing && (
        <CreateListingModal
          isOpen={showCreateListing}
          onClose={() => {
            setShowCreateListing(false)
            fetchListings()
          }}
        />
      )}
    </div>
  )
}
