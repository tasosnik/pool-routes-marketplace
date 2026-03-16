export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Route Marketplace</h1>
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No listings yet
              </h3>
              <p className="text-gray-600 mb-6">
                Browse available routes or list your own for sale.
              </p>
              <div className="space-y-3">
                <button className="w-full btn btn-primary">List Route for Sale</button>
                <button className="w-full btn btn-outline">Browse Routes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}