import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { UserCircleIcon, BellIcon, ShieldCheckIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { useUpdateProfile, useChangePassword } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuthStore()

  // React Query hooks
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketplaceAlerts: true,
    newsletterSubscribed: false
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || ''
      })
    }
  }, [user])

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateProfileMutation.mutateAsync(formData)
      setIsEditing(false)
    } catch (error) {
      // Error handling is done in the hook
      console.error('Profile update error:', error)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      // Error handling is done in the hook
      console.error('Password change error:', error)
    }
  }

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast('Preferences saved locally. Cloud sync coming soon.')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast('Account deletion is not yet available. Please contact support.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.checked
    })
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-body">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handlePersonalInfoSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            // Reset form data
                            if (user) {
                              setFormData({
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                email: user.email || '',
                                phone: user.phone || '',
                                company: user.company || ''
                              })
                            }
                          }}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="btn btn-primary"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>

                  <form onSubmit={handlePasswordSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="btn btn-primary"
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Deleting your account will permanently remove all your data and cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>

                  <form onSubmit={handlePreferencesSubmit}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-4">Email Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="emailNotifications"
                              checked={preferences.emailNotifications}
                              onChange={handlePreferenceChange}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              Receive email notifications for important updates
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="marketplaceAlerts"
                              checked={preferences.marketplaceAlerts}
                              onChange={handlePreferenceChange}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              Get alerts for new marketplace listings
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="newsletterSubscribed"
                              checked={preferences.newsletterSubscribed}
                              onChange={handlePreferenceChange}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              Subscribe to our monthly newsletter
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-4">SMS Notifications</h3>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="smsNotifications"
                            checked={preferences.smsNotifications}
                            onChange={handlePreferenceChange}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            Receive SMS notifications for urgent alerts
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button type="submit" className="btn btn-primary">
                        Save Preferences
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-base font-medium text-blue-900 mb-2">Billing Not Yet Available</h3>
                    <p className="text-sm text-blue-800">
                      PoolRoute OS is currently in early access. Billing and subscription management
                      will be available in a future release. Your account currently has full access at no charge.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-base font-medium text-gray-900 mb-2">Current Plan</h3>
                    <p className="text-2xl font-bold text-primary-600">Early Access</p>
                    <p className="text-sm text-gray-600 mt-1">Full access • No payment required</p>
                  </div>

                  <div className="text-sm text-gray-500">
                    For questions about billing or your account, contact{' '}
                    <a href="mailto:support@poolroute.com" className="text-primary-600 hover:underline">
                      support@poolroute.com
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}