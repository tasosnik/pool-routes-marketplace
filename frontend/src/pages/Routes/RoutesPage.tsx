export default function RoutesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Routes</h1>
        <button className="btn btn-primary">Create New Route</button>
      </div>

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
              <button className="btn btn-primary">Create Your First Route</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}