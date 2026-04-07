import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { PoolAccount } from '../../types'
import 'leaflet/dist/leaflet.css'

interface ListingMapProps {
  centerLat: number
  centerLng: number
  title: string
  serviceArea?: string
  accounts?: PoolAccount[]
}

export default function ListingMap({ centerLat, centerLng, title, serviceArea, accounts = [] }: ListingMapProps) {
  const accountsWithCoords = accounts.filter(
    (a) => a.address?.coordinates?.latitude && a.address?.coordinates?.longitude
  )

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '350px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Account markers */}
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
                  <p className="text-gray-600">
                    {account.address.street}, {account.address.city}
                  </p>
                  <p className="mt-1">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
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
        {accountsWithCoords.length > 0 ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-green-400 border-2 border-green-600" />
              Active ({accountsWithCoords.filter(a => a.status === 'active').length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-400" />
              Inactive ({accountsWithCoords.filter(a => a.status !== 'active').length})
            </span>
            <span className="ml-auto">{accountsWithCoords.length} accounts mapped</span>
          </>
        ) : (
          <span>Approximate service area shown</span>
        )}
      </div>
    </div>
  )
}
