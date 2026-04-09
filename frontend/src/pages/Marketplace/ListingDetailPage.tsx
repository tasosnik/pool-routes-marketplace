import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { marketplaceService } from '../../services/marketplaceService'
import { routeService } from '../../services/routeService'
import { useAuthStore } from '../../store/authStore'
import type { RouteListing, PoolAccount } from '../../types'

const ListingMap = lazy(() => import('../../components/Marketplace/ListingMap'))

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [listing, setListing] = useState<RouteListing | null>(null)
  const [accounts, setAccounts] = useState<PoolAccount[]>([])
  const [myAccounts, setMyAccounts] = useState<PoolAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await marketplaceService.getListing(id)
        if (response.success && response.data) {
          setListing(response.data)
          // Use accounts included in the listing response
          if (response.data.accounts) {
            setAccounts(response.data.accounts)
          }
          // Fetch user's own routes to show on map for comparison
          if (isAuthenticated) {
            try {
              const myRoutesResponse = await routeService.getRoutes({ limit: 100 })
              if (myRoutesResponse.success && myRoutesResponse.data?.routes) {
                const allMyAccounts: PoolAccount[] = []
                for (const r of myRoutesResponse.data.routes) {
                  try {
                    const rDetail = await routeService.getRoute(r.id)
                    if (rDetail.success && rDetail.data?.accounts) {
                      allMyAccounts.push(...rDetail.data.accounts)
                    }
                  } catch {
                    // skip
                  }
                }
                setMyAccounts(allMyAccounts)
              }
            } catch {
              // User may not have any routes
            }
          }
        } else {
          toast.error('Failed to load listing')
        }
      } catch {
        toast.error('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [id])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Listing not found</h2>
        <p className="text-gray-600 mt-2">This listing may have been removed.</p>
        <Link to="/marketplace" className="btn btn-primary mt-4 inline-block">Back to Marketplace</Link>
      </div>
    )
  }

  // Use route center if available, otherwise compute from account coordinates
  let centerLat = listing.route?.centerLat
  let centerLng = listing.route?.centerLng
  if (!centerLat || !centerLng) {
    const accsWithCoords = accounts.filter(a => a.address?.coordinates?.latitude && a.address?.coordinates?.longitude)
    if (accsWithCoords.length > 0) {
      centerLat = accsWithCoords.reduce((sum, a) => sum + a.address.coordinates!.latitude, 0) / accsWithCoords.length
      centerLng = accsWithCoords.reduce((sum, a) => sum + a.address.coordinates!.longitude, 0) / accsWithCoords.length
    }
  }
  const hasLocation = centerLat && centerLng

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to="/marketplace" className="mr-4 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-500 mt-1">{listing.route?.serviceAreaName || 'Location not specified'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          {hasLocation && (
            <Suspense fallback={
              <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-lg border">
                <p className="text-gray-500">Loading map...</p>
              </div>
            }>
              <ListingMap
                centerLat={centerLat}
                centerLng={centerLng}
                title={listing.title}
                serviceArea={listing.route?.serviceAreaName}
                accounts={accounts}
                myAccounts={myAccounts}
              />
            </Suspense>
          )}

          {/* Description */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Accounts</p>
                  <p className="text-2xl font-bold">{listing.accountCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(listing.monthlyRevenue)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Revenue Multiple</p>
                  <p className="text-2xl font-bold">{listing.revenueMultiple}x</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Retention Rate</p>
                  <p className="text-2xl font-bold">{listing.retentionRate}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Avg Account Age</p>
                  <p className="text-2xl font-bold">{listing.averageAccountAge} mo</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Escrow Period</p>
                  <p className="text-2xl font-bold">{listing.escrowPeriod} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h2>
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${listing.equipmentIncluded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  Equipment {listing.equipmentIncluded ? 'Included' : 'Not Included'}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${listing.customerTransition ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  Customer Transition {listing.customerTransition ? 'Included' : 'Not Included'}
                </span>
              </div>
            </div>
          </div>

          {/* Retention Guarantee */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Retention Guarantee</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Guarantee</p>
                  <p className="text-lg font-semibold">{listing.retentionGuaranteePercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="text-lg font-semibold">{listing.retentionGuaranteePeriod} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Penalty Rate</p>
                  <p className="text-lg font-semibold">{listing.retentionPenaltyRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — price & seller */}
        <div className="space-y-6">
          {/* Price card */}
          <div className="card sticky top-8">
            <div className="card-body">
              <p className="text-sm text-gray-500 mb-1">Asking Price</p>
              <p className="text-4xl font-bold text-primary-600 mb-4">{formatCurrency(listing.askingPrice)}</p>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly Revenue</span>
                  <span className="font-medium text-green-600">{formatCurrency(listing.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue Multiple</span>
                  <span className="font-medium">{listing.revenueMultiple}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ROI (monthly)</span>
                  <span className="font-medium">{((listing.monthlyRevenue / listing.askingPrice) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {isAuthenticated ? (
                listing.seller?.email ? (
                  <div className="space-y-2">
                    <a
                      href={`mailto:${listing.seller.email}?subject=${encodeURIComponent(`Inquiry about ${listing.title}`)}`}
                      className="btn btn-primary w-full text-center block"
                    >
                      Contact Seller
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(listing.seller!.email!)
                        toast.success('Email copied to clipboard')
                      }}
                      className="btn btn-outline w-full text-sm"
                    >
                      Copy Email
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toast.error('Seller contact information is not available')}
                    className="btn btn-primary w-full"
                  >
                    Contact Seller
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate('/login', { state: { from: { pathname: `/marketplace/${id}` } } })}
                  className="btn btn-primary w-full"
                >
                  Login to Contact Seller
                </button>
              )}
            </div>
          </div>

          {/* Seller card */}
          {listing.seller && (
            <div className="card">
              <div className="card-body">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Info</h3>
                <p className="text-gray-900 font-medium">{listing.seller.firstName} {listing.seller.lastName}</p>
                {listing.seller.company && <p className="text-gray-500 text-sm">{listing.seller.company}</p>}
                {listing.seller.email ? (
                  <p className="text-sm text-primary-600 mt-1">{listing.seller.email}</p>
                ) : !isAuthenticated && (
                  <p className="text-sm text-gray-400 italic mt-1">Login to see contact details</p>
                )}
              </div>
            </div>
          )}

          {/* Listed date */}
          <div className="text-sm text-gray-400 text-center">
            Listed {listing.listedAt ? new Date(listing.listedAt).toLocaleDateString() : 'recently'}
          </div>
        </div>
      </div>
    </div>
  )
}
