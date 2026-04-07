import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { routeService } from '../../services/routeService'
import { marketplaceService } from '../../services/marketplaceService'
import type { Route } from '../../types'

interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
  const [userRoutes, setUserRoutes] = useState<Route[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    routeId: '',
    title: '',
    description: '',
    numberOfAccounts: '',
    monthlyRevenue: '',
    askingPrice: '',
    retentionRate: '90',
    averageAccountAge: '12',
    includesEquipment: false,
    includesVehicle: false,
    includesCustomerList: true,
  })

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await routeService.getRoutes({ limit: 100 })
        if (response.success && response.data) {
          setUserRoutes(response.data.routes)
        }
      } catch {
        // silently fail - user may not have routes
      }
    }
    if (isOpen) fetchRoutes()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.routeId || !formData.title || !formData.askingPrice || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.description.length < 10) {
      toast.error('Description must be at least 10 characters')
      return
    }

    setSubmitting(true)
    try {
      const response = await marketplaceService.createListing({
        routeId: formData.routeId,
        title: formData.title,
        description: formData.description,
        askingPrice: parseFloat(formData.askingPrice),
        accountCount: parseInt(formData.numberOfAccounts) || 1,
        monthlyRevenue: parseFloat(formData.monthlyRevenue) || 100,
        retentionRate: parseFloat(formData.retentionRate) || 90,
        averageAccountAge: parseInt(formData.averageAccountAge) || 12,
        equipmentIncluded: formData.includesEquipment,
        customerTransition: formData.includesCustomerList,
      })

      if (response.success) {
        toast.success('Listing created successfully!')
        onClose()
      } else {
        toast.error(response.error || 'Failed to create listing')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Create Marketplace Listing</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Listing Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Listing Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Premium Beverly Hills Pool Route"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe your route, its benefits, growth potential, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Route Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="routeId" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Route *
                    </label>
                    <select
                      id="routeId"
                      name="routeId"
                      value={formData.routeId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select a route to list</option>
                      {userRoutes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.name} - {typeof route.serviceArea === 'object' ? route.serviceArea?.name : route.serviceArea}
                        </option>
                      ))}
                    </select>
                    {userRoutes.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No routes found. Create a route first.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="numberOfAccounts" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Accounts
                    </label>
                    <input
                      type="number"
                      id="numberOfAccounts"
                      name="numberOfAccounts"
                      value={formData.numberOfAccounts}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Revenue ($)
                    </label>
                    <input
                      type="number"
                      id="monthlyRevenue"
                      name="monthlyRevenue"
                      value={formData.monthlyRevenue}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="askingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Asking Price ($) *
                    </label>
                    <input
                      type="number"
                      id="askingPrice"
                      name="askingPrice"
                      value={formData.askingPrice}
                      onChange={handleChange}
                      min="1000"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="retentionRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Retention Rate (%)
                    </label>
                    <input
                      type="number"
                      id="retentionRate"
                      name="retentionRate"
                      value={formData.retentionRate}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Included Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">What's Included</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="includesEquipment"
                      checked={formData.includesEquipment}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Equipment included</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="includesCustomerList"
                      checked={formData.includesCustomerList}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Customer transition support</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}