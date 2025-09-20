"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.MapContainer })), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.TileLayer })), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.CircleMarker })), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => ({ default: mod.Popup })), { ssr: false })

const facilities = [
  { id: "aiims-delhi", name: "AIIMS Delhi", lat: 28.5672, lon: 77.21, type: "Hospital" },
  { id: "tata-memorial", name: "Tata Memorial Hospital", lat: 19.0048, lon: 72.8435, type: "Hospital" },
  { id: "cmc-vellore", name: "CMC Vellore", lat: 12.923, lon: 79.1343, type: "Hospital" },
  { id: "nimhans", name: "NIMHANS Bangalore", lat: 12.9431, lon: 77.5432, type: "Hospital" },
  { id: "pgimer", name: "PGIMER Chandigarh", lat: 30.765, lon: 76.775, type: "Hospital" },
  { id: "ballabgarh", name: "Rural Health Center, Ballabgarh", lat: 28.3375, lon: 77.3217, type: "Clinic" },
  { id: "gadchiroli", name: "Primary Health Centre, Gadchiroli", lat: 20.1809, lon: 80.0015, type: "Clinic" },
  { id: "palghar", name: "Community Health Centre, Palghar", lat: 19.6967, lon: 72.7699, type: "Clinic" },
]

export default function MapComponent() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div style={{ height: "400px", width: "100%" }} className="bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {facilities.map((facility) => (
        <CircleMarker
          key={facility.id}
          center={[facility.lat, facility.lon]}
          radius={10}
          fillColor={facility.type === "Hospital" ? "#FF0000" : "#0000FF"}
          color="#000"
          weight={1}
          opacity={1}
          fillOpacity={0.8}
        >
          <Popup>
            <strong>{facility.name}</strong>
            <br />
            Type: {facility.type}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

