export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Total Routes</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500">Active routes in your portfolio</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Total Accounts</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500">Pool service accounts</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-blue-600">$0</p>
            <p className="text-sm text-gray-500">Recurring monthly income</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Avg. Rate</h3>
            <p className="text-3xl font-bold text-purple-600">$0</p>
            <p className="text-sm text-gray-500">Per account monthly</p>
          </div>
        </div>
      </div>

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
                <button className="w-full btn btn-primary">
                  Import Existing Routes
                </button>
                <button className="w-full btn btn-outline">
                  Create New Route
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}