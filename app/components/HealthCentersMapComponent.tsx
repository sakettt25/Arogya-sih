"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import MapContainer and other react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.MapContainer })), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.TileLayer })), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.Marker })), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.Popup })), { ssr: false })

export default function HealthCentersMapComponent() {
  const [userLocation, setUserLocation] = useState<[number, number]>([20, 77])
  const [healthCenters, setHealthCenters] = useState<{ lat: number; lng: number; name: string }[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Fix for Leaflet marker icons on client side
    if (typeof window !== 'undefined') {      
      import('leaflet').then((L) => {
        const DefaultIcon = L.default.icon({
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
        L.default.Marker.prototype.options.icon = DefaultIcon
      })
    }
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])

        // Fetch nearby health centers (replace with actual API or data source)
        setHealthCenters([
          { lat: latitude + 0.01, lng: longitude + 0.01, name: "Health Center 1" },
          { lat: latitude - 0.02, lng: longitude - 0.01, name: "Health Center 2" },
        ])
      },
      (error) => console.error(error),
      { enableHighAccuracy: true },
    )
  }, [isClient])

  if (!isClient) {
    return <div className="w-full h-full rounded-lg shadow-lg bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }

  return (
    <MapContainer center={userLocation} zoom={14} className="w-full h-full rounded-lg shadow-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* User's location */}
      <Marker position={userLocation}>
        <Popup>You are here!</Popup>
      </Marker>

      {/* Health centers */}
      {healthCenters.map((center) => (
        <Marker key={center.name} position={[center.lat, center.lng]}>
          <Popup>{center.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

