import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CreateRouteModal from '../../components/Routes/CreateRouteModal'
import { routeService } from '../../services/routeService'
import { Route } from '../../types'
import toast from 'react-hot-toast'

export default function RoutesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await routeService.getRoutes()
      if (response.success && response.data) {
        setRoutes(response.data.routes)
      } else {
        toast.error('Failed to load routes')
      }
    } catch (error) {
      console.error('Error fetching routes:', error)
      toast.error('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    fetchRoutes()
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Routes</h1>
        <button
          onClick={handleCreateClick}
          className="btn btn-primary"
          aria-label="Create new route"
        >
          Create New Route
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : routes.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No routes yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first route to start managing your pool service accounts.
                </p>
                <button
                  onClick={handleCreateClick}
                  className="btn btn-primary"
                  aria-label="Create your first route"
                >
                  Create Your First Route
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map(route => (
            <Link
              key={route.id}
              to={`/routes/${route.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{route.name}</h3>
                {route.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{route.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Accounts:</span>
                    <span className="font-medium">{route.totalAccounts ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Revenue:</span>
                    <span className="font-medium text-green-600">{formatCurrency(route.monthlyRevenue ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg. Rate:</span>
                    <span className="font-medium">{formatCurrency(route.averageRate ?? 0)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {route.status ?? 'active'}
                  </span>
                  {route.isForSale && (
                    <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      For Sale
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateRouteModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
