import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { routeService } from '../../services/routeService'
import type { Route } from '../../types'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ManualEntryModal({ isOpen, onClose }: ManualEntryModalProps) {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [formData, setFormData] = useState({
    routeId: '',
    customerName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    serviceRate: '',
    serviceFrequency: 'weekly',
    email: '',
    phone: '',
    notes: ''
  })

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoadingRoutes(true)
    routeService.getRoutes({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setRoutes(res.data.routes)
          if (res.data.routes.length > 0 && !formData.routeId) {
            setFormData(f => ({ ...f, routeId: res.data!.routes[0].id }))
          }
        }
      })
      .catch(() => toast.error('Failed to load routes'))
      .finally(() => setLoadingRoutes(false))
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.routeId) {
      toast.error('Please select a route')
      return
    }

    if (!formData.customerName || !formData.address) {
      toast.error('Please fill in required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await routeService.addAccount(formData.routeId, {
        customerName: formData.customerName,
        customerEmail: formData.email || undefined,
        customerPhone: formData.phone || undefined,
        street: formData.address,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zip || undefined,
        monthlyRate: formData.serviceRate ? parseFloat(formData.serviceRate) : undefined,
        serviceType: formData.serviceFrequency,
        frequency: formData.serviceFrequency,
        notes: formData.notes || undefined,
      })

      if (response.success) {
        toast.success('Pool account added successfully!')
        setFormData({
          routeId: formData.routeId,
          customerName: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          serviceRate: '',
          serviceFrequency: 'weekly',
          email: '',
          phone: '',
          notes: ''
        })
        onClose()
      } else {
        toast.error((response as any).error || 'Failed to add account')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Add Pool Account Manually</h2>
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
              {/* Route Selection */}
              <div>
                <label htmlFor="routeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Route *
                </label>
                {loadingRoutes ? (
                  <p className="text-sm text-gray-500">Loading routes...</p>
                ) : routes.length === 0 ? (
                  <p className="text-sm text-red-600">No routes found. Please create a route first.</p>
                ) : (
                  <select
                    id="routeId"
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="serviceRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Rate ($)
                    </label>
                    <input
                      type="number"
                      id="serviceRate"
                      name="serviceRate"
                      value={formData.serviceRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="serviceFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Service Frequency
                    </label>
                    <select
                      id="serviceFrequency"
                      name="serviceFrequency"
                      value={formData.serviceFrequency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        maxLength={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Additional information about this account..."
                />
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
                disabled={submitting || loadingRoutes || routes.length === 0}
                className="btn btn-primary"
              >
                {submitting ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
