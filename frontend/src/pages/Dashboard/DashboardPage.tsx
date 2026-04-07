import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import CreateRouteModal from '../../components/Routes/CreateRouteModal'
import { routeService, RouteStatsResponse } from '../../services/routeService'
import { Route, PoolAccount } from '../../types'
import toast from 'react-hot-toast'

const DashboardMap = lazy(() => import('../../components/Dashboard/DashboardMap'))

export default function DashboardPage() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState<RouteStatsResponse>({
    totalRoutes: 0,
    totalAccounts: 0,
    monthlyRevenue: 0,
    averageRate: 0
  })
  const [routes, setRoutes] = useState<Route[]>([])
  const [accountsByRoute, setAccountsByRoute] = useState<Map<string, PoolAccount[]>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRoutesWithAccounts()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await routeService.getUserStats()

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        console.error('Failed to fetch stats:', response.error)
        toast.error('Failed to load dashboard statistics')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutesWithAccounts = async () => {
    try {
      const response = await routeService.getRoutes({ limit: 100 })
      if (response.success && response.data) {
        const fetchedRoutes = response.data.routes
        setRoutes(fetchedRoutes)

        // Fetch accounts for each route
        const accountsMap = new Map<string, PoolAccount[]>()
        await Promise.all(
          fetchedRoutes.map(async (route) => {
            try {
              const routeResponse = await routeService.getRoute(route.id)
              if (routeResponse.success && routeResponse.data?.accounts) {
                accountsMap.set(route.id, routeResponse.data.accounts)
              }
            } catch {
              // Skip routes that fail to load
            }
          })
        )
        setAccountsByRoute(accountsMap)
      }
    } catch (error) {
      console.error('Error fetching routes for map:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleImportClick = () => {
    navigate('/import')
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/routes')}>
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Total Routes</h3>
            <p className="text-3xl font-bold text-primary-600">{loading ? '...' : stats.totalRoutes}</p>
            <p className="text-sm text-gray-500">Active routes in your portfolio</p>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/routes')}>
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Total Accounts</h3>
            <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.totalAccounts}</p>
            <p className="text-sm text-gray-500">Pool service accounts</p>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/routes')}>
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-blue-600">{loading ? '...' : formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-sm text-gray-500">Recurring monthly income</p>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/routes')}>
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Avg. Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{loading ? '...' : formatCurrency(stats.averageRate)}</p>
            <p className="text-sm text-gray-500">Per account monthly</p>
          </div>
        </div>
      </div>

      {routes.length > 0 && (
        <div className="mb-8">
          <Suspense
            fallback={
              <div className="card">
                <div className="card-body">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h2>
                  <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Loading map...</p>
                  </div>
                </div>
              </div>
            }
          >
            <DashboardMap routes={routes} accounts={accountsByRoute} />
          </Suspense>
        </div>
      )}

      {!loading && stats.totalRoutes === 0 && (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to PoolRoute OS!
              </h3>
              <p className="text-gray-600 mb-6">
                Start by importing your existing routes or creating new ones to see your portfolio analytics.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleImportClick}
                  className="w-full btn btn-primary"
                  aria-label="Navigate to import page"
                >
                  Import Existing Routes
                </button>
                <button
                  onClick={handleCreateClick}
                  className="w-full btn btn-outline"
                  aria-label="Open create route modal"
                >
                  Create New Route
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {showCreateModal && (
        <CreateRouteModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            fetchStats()
          }}
        />
      )}
    </div>
  )
}