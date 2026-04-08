import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { routeService } from '../../services/routeService'
import { Route, PoolAccount } from '../../types'

const RouteMap = lazy(() => import('../../components/Routes/RouteMap'))

interface AddAccountForm {
  customerName: string
  street: string
  city: string
  state: string
  zipCode: string
  monthlyRate: string
  frequency: string
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [route, setRoute] = useState<Route | null>(null)
  const [accounts, setAccounts] = useState<PoolAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'accounts' | 'analytics' | 'map'>('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [showAddAccountForm, setShowAddAccountForm] = useState(false)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [addAccountForm, setAddAccountForm] = useState<AddAccountForm>({
    customerName: '',
    street: '',
    city: '',
    state: 'CA',
    zipCode: '',
    monthlyRate: '',
    frequency: 'weekly'
  })
  const [editName, setEditName] = useState('')
  const [editServiceArea, setEditServiceArea] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (!id) return
    const fetchRoute = async () => {
      try {
        setIsLoading(true)
        const response = await routeService.getRoute(id)
        if (response.success && response.data) {
          setRoute(response.data.route)
          setAccounts(response.data.accounts || [])
          setEditName(response.data.route.name)
          setEditDescription(response.data.route.description || '')
          const area = response.data.route.serviceArea
          const areaName = typeof area === 'object' && area !== null ? (area as any).name || '' : String(area || '')
          setEditServiceArea(areaName)
        } else {
          toast.error('Failed to load route')
        }
      } catch (error) {
        console.error('Error fetching route:', error)
        toast.error('Failed to load route')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoute()
  }, [id])

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleSave = async () => {
    if (!id) return
    try {
      setIsSaving(true)
      const response = await routeService.updateRoute(id, {
        name: editName,
        description: editDescription,
        location: editServiceArea,
      })
      if (response.success && response.data) {
        setRoute(response.data.route)
        setIsEditMode(false)
        toast.success('Route details saved successfully')
      } else {
        toast.error(response.error || 'Failed to save route')
      }
    } catch (error) {
      console.error('Error saving route:', error)
      toast.error('Failed to save route')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (route) {
      setEditName(route.name)
      setEditDescription(route.description || '')
      const area = route.serviceArea
      setEditServiceArea(typeof area === 'object' && area !== null ? (area as any).name || '' : String(area || ''))
    }
    setIsEditMode(false)
    setEditingAccount(null)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!id) return
    try {
      const response = await routeService.deleteRoute(id)
      if (response.success) {
        toast.success('Route deleted successfully')
        navigate('/routes')
      } else {
        toast.error(response.error || 'Failed to delete route')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Error deleting route:', error)
      toast.error('Failed to delete route')
      setShowDeleteModal(false)
    }
  }

  const handleAccountEdit = (accountId: string) => {
    setEditingAccount(accountId)
  }

  const handleAccountSave = (_accountId: string) => {
    setEditingAccount(null)
    toast('Account editing coming soon. Use the Import page to update account data in bulk.')
  }

  const handleAccountDelete = async (accountId: string) => {
    if (!id) return
    if (!window.confirm('Are you sure you want to remove this account?')) return

    try {
      const response = await routeService.deleteAccount(id, accountId)
      if (response.success) {
        setAccounts(prev => prev.filter(a => a.id !== accountId))
        toast.success('Account removed successfully')
        // Refresh route to get updated stats
        const routeResponse = await routeService.getRoute(id)
        if (routeResponse.success && routeResponse.data) {
          setRoute(routeResponse.data.route)
        }
      } else {
        toast.error((response as any).error || 'Failed to remove account')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove account')
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!addAccountForm.customerName || !addAccountForm.street) {
      toast.error('Customer name and street address are required')
      return
    }

    setIsAddingAccount(true)
    try {
      const response = await routeService.addAccount(id, {
        customerName: addAccountForm.customerName,
        street: addAccountForm.street,
        city: addAccountForm.city,
        state: addAccountForm.state,
        zipCode: addAccountForm.zipCode,
        monthlyRate: addAccountForm.monthlyRate ? parseFloat(addAccountForm.monthlyRate) : undefined,
        frequency: addAccountForm.frequency,
      })

      if (response.success && response.data) {
        setAccounts(prev => [...prev, response.data!.account])
        setShowAddAccountForm(false)
        setAddAccountForm({ customerName: '', street: '', city: '', state: 'CA', zipCode: '', monthlyRate: '', frequency: 'weekly' })
        toast.success('Account added successfully')
        // Refresh route to get updated stats
        const routeResponse = await routeService.getRoute(id)
        if (routeResponse.success && routeResponse.data) {
          setRoute(routeResponse.data.route)
        }
      } else {
        toast.error((response as any).error || 'Failed to add account')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account')
    } finally {
      setIsAddingAccount(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'paused':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="card">
            <div className="card-body">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Route not found</h2>
          <p className="text-gray-600 mt-2">The route you're looking for doesn't exist.</p>
          <Link to="/routes" className="btn btn-primary mt-4">
            Back to Routes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link
              to="/routes"
              className="mr-4 text-gray-600 hover:text-gray-900"
              aria-label="Back to routes"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{route.name}</h1>
          </div>
          <div className="flex gap-2">
            {!isEditMode ? (
              <>
                <button
                  onClick={handleEdit}
                  className="btn btn-outline flex items-center gap-2"
                  aria-label="Edit route"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  aria-label="Delete route"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
        {route.description && (
          <p className="text-gray-600">{route.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{route.totalAccounts}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${route.monthlyRevenue.toLocaleString()}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Service Rate</p>
                <p className="text-2xl font-bold text-blue-600">${(route.averageRate ?? 0).toFixed(2)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Accounts</p>
                <p className="text-2xl font-bold text-purple-600">{route.activeAccounts}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'overview'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('accounts')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'accounts'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Accounts ({accounts.length})
            </button>
            <button
              onClick={() => setSelectedTab('analytics')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'analytics'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setSelectedTab('map')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-1 ${
                selectedTab === 'map'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPinIcon className="h-4 w-4" />
              Map
            </button>
          </nav>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Service Area</dt>
                    <dd className="text-base text-gray-900 flex items-center mt-1">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editServiceArea}
                          onChange={e => setEditServiceArea(e.target.value)}
                          className="px-2 py-1 border rounded"
                        />
                      ) : (
                        editServiceArea
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                    <dd className="text-base text-gray-900 flex items-center mt-1">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(route.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-gray-600">{route.activeAccounts} active account{route.activeAccounts !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Route created {new Date(route.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toast('Export functionality coming soon')}
                  className="btn btn-outline"
                >
                  Export Route Data
                </button>
                <button
                  onClick={() => toast('Print functionality coming soon')}
                  className="btn btn-outline"
                >
                  Print Route Sheet
                </button>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {selectedTab === 'accounts' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Customer Accounts</h3>
                <button
                  onClick={() => setShowAddAccountForm(true)}
                  className="btn btn-primary btn-sm flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Account
                </button>
              </div>

              {showAddAccountForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">New Account</h4>
                  <form onSubmit={handleAddAccount}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                        <input
                          type="text"
                          value={addAccountForm.customerName}
                          onChange={e => setAddAccountForm(f => ({ ...f, customerName: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="e.g., Jane Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={addAccountForm.street}
                          onChange={e => setAddAccountForm(f => ({ ...f, street: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="e.g., 123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={addAccountForm.city}
                          onChange={e => setAddAccountForm(f => ({ ...f, city: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          value={addAccountForm.state}
                          onChange={e => setAddAccountForm(f => ({ ...f, state: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={addAccountForm.zipCode}
                          onChange={e => setAddAccountForm(f => ({ ...f, zipCode: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="e.g., 90210"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rate ($)</label>
                        <input
                          type="number"
                          value={addAccountForm.monthlyRate}
                          onChange={e => setAddAccountForm(f => ({ ...f, monthlyRate: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 150"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={addAccountForm.frequency}
                          onChange={e => setAddAccountForm(f => ({ ...f, frequency: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowAddAccountForm(false); setAddAccountForm({ customerName: '', street: '', city: '', state: 'CA', zipCode: '', monthlyRate: '', frequency: 'weekly' }) }}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingAccount}
                        className="btn btn-primary btn-sm"
                      >
                        {isAddingAccount ? 'Adding...' : 'Add Account'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Address</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Rate</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Frequency</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Next Service</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="px-4 py-3">
                          {editingAccount === account.id ? (
                            <input
                              type="text"
                              defaultValue={account.customerName}
                              className="px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{account.customerName}</p>
                              {account.equipmentNotes && (
                                <p className="text-xs text-gray-500">{account.equipmentNotes}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {typeof account.address === 'object' ? `${account.address.street}, ${account.address.city}, ${account.address.state} ${account.address.zipCode}` : String(account.address)}
                        </td>
                        <td className="px-4 py-3">
                          {editingAccount === account.id ? (
                            <input
                              type="number"
                              defaultValue={account.monthlyRate}
                              className="px-2 py-1 border rounded text-sm w-20"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${account.monthlyRate}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                          {account.frequency}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(account.status)}`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {account.nextServiceDate ? new Date(account.nextServiceDate).toLocaleDateString() : 'Not scheduled'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingAccount === account.id ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleAccountSave(account.id)}
                                className="text-green-600 hover:text-green-700 text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingAccount(null)}
                                className="text-gray-600 hover:text-gray-700 text-sm ml-2"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleAccountEdit(account.id)}
                                className="text-primary-600 hover:text-primary-700"
                                aria-label="Edit account"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAccountDelete(account.id)}
                                className="text-red-600 hover:text-red-700 ml-2"
                                aria-label="Delete account"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {selectedTab === 'map' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Service Area Map</h3>
                <span className="text-sm text-gray-500">{accounts.length} accounts</span>
              </div>
              {isLoading ? (
                <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Loading map...</p>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  }
                >
                  <RouteMap
                    accounts={accounts}
                    centerPoint={
                      route.serviceArea?.centerPoint ?? { latitude: 34.0736, longitude: -118.4004 }
                    }
                  />
                </Suspense>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {selectedTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Total Accounts</p>
                    <p className="text-2xl font-bold text-green-600">{route?.totalAccounts || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">{route?.activeAccounts || 0} active</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">${(route?.monthlyRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">From all accounts</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Average Rate</p>
                    <p className="text-2xl font-bold text-purple-600">${(route?.averageRate || 0).toFixed(0)}/mo</p>
                    <p className="text-xs text-gray-500 mt-1">Per account</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Analytics</h3>
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Charts and detailed analytics are coming soon.</p>
                  <p className="text-sm text-gray-400 mt-2">Revenue trends, collection rates, and growth metrics will appear here.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Route?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{route.name}"? This action cannot be undone and will remove all associated data.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}