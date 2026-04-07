import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { Route, PoolAccount } from '../../types'
import 'leaflet/dist/leaflet.css'

const ROUTE_COLORS = [
  { fill: '#3b82f6', border: '#2563eb' }, // blue
  { fill: '#22c55e', border: '#16a34a' }, // green
  { fill: '#f59e0b', border: '#d97706' }, // amber
  { fill: '#ef4444', border: '#dc2626' }, // red
  { fill: '#8b5cf6', border: '#7c3aed' }, // violet
  { fill: '#ec4899', border: '#db2777' }, // pink
  { fill: '#14b8a6', border: '#0d9488' }, // teal
  { fill: '#f97316', border: '#ea580c' }, // orange
]

interface DashboardMapProps {
  routes: Route[]
  accounts: Map<string, PoolAccount[]>
}

export default function DashboardMap({ routes, accounts }: DashboardMapProps) {
  const navigate = useNavigate()

  // Collect all accounts with coordinates to compute map bounds
  const allPoints: { lat: number; lng: number }[] = []
  routes.forEach((route) => {
    const routeAccounts = accounts.get(route.id) || []
    routeAccounts.forEach((a) => {
      if (a.address?.coordinates?.latitude && a.address?.coordinates?.longitude) {
        allPoints.push({ lat: a.address.coordinates.latitude, lng: a.address.coordinates.longitude })
      }
    })
    // Also include route center as a fallback point
    if (route.serviceArea?.centerPoint?.latitude && route.serviceArea?.centerPoint?.longitude) {
      allPoints.push({ lat: route.serviceArea.centerPoint.latitude, lng: route.serviceArea.centerPoint.longitude })
    }
  })

  if (allPoints.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h2>
          <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 font-medium">No location data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Import account data with coordinates to see your routes on the map.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Compute center from all points
  const avgLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length
  const avgLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Route Map</h2>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={[avgLat, avgLng]}
            zoom={11}
            style={{ height: '400px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routes.map((route, routeIndex) => {
              const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length]
              const routeAccounts = accounts.get(route.id) || []

              return routeAccounts
                .filter((a) => a.address?.coordinates?.latitude && a.address?.coordinates?.longitude)
                .map((account) => (
                  <CircleMarker
                    key={account.id}
                    center={[account.address.coordinates!.latitude, account.address.coordinates!.longitude]}
                    radius={9}
                    pathOptions={{
                      color: color.border,
                      fillColor: color.fill,
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => navigate(`/routes/${route.id}`),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{route.name}</p>
                        <p className="text-gray-600">{account.customerName}</p>
                        <p className="text-gray-500">${account.monthlyRate}/mo</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))
            })}
          </MapContainer>
          {/* Legend */}
          <div className="bg-white px-4 py-2 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {routes.map((route, i) => {
              const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
              const count = (accounts.get(route.id) || []).filter(
                (a) => a.address?.coordinates?.latitude && a.address?.coordinates?.longitude
              ).length
              return (
                <span key={route.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-full border-2"
                    style={{ backgroundColor: color.fill, borderColor: color.border }}
                  />
                  {route.name} ({count})
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
