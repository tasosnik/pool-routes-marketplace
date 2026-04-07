import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { PoolAccount, Coordinates } from '../../types'
import 'leaflet/dist/leaflet.css'

interface RouteMapProps {
  accounts: PoolAccount[]
  centerPoint: Coordinates
}

export default function RouteMap({ accounts, centerPoint }: RouteMapProps) {
  const accountsWithCoords = accounts.filter(
    (a) => a.address?.coordinates?.latitude && a.address?.coordinates?.longitude
  )

  if (accountsWithCoords.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No location data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Accounts need coordinates to appear on the map. Import account data with latitude/longitude to enable this view.
          </p>
        </div>
      </div>
    )
  }

  const center: [number, number] = [centerPoint.latitude, centerPoint.longitude]

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {accountsWithCoords.map((account) => {
          const { latitude, longitude } = account.address.coordinates!
          const isActive = account.status === 'active'

          return (
            <CircleMarker
              key={account.id}
              center={[latitude, longitude]}
              radius={8}
              pathOptions={{
                color: isActive ? '#16a34a' : '#9ca3af',
                fillColor: isActive ? '#22c55e' : '#d1d5db',
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{account.customerName}</p>
                  <p className="text-gray-600 mt-1">
                    {account.address.street}, {account.address.city}, {account.address.state} {account.address.zipCode}
                  </p>
                  <p className="mt-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {account.status}
                    </span>
                    <span className="ml-2 text-gray-600">${account.monthlyRate}/mo</span>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="bg-white px-4 py-2 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-400 border-2 border-green-600"></span>
          Active ({accountsWithCoords.filter((a) => a.status === 'active').length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-400"></span>
          Inactive ({accountsWithCoords.filter((a) => a.status !== 'active').length})
        </span>
        <span className="ml-auto">{accountsWithCoords.length} of {accounts.length} accounts mapped</span>
      </div>
    </div>
  )
}
