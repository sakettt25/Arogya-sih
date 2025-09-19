"use client"

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

const facilities = [
  { name: "AIIMS Delhi", lat: 28.5672, lon: 77.21, type: "Hospital" },
  { name: "Tata Memorial Hospital", lat: 19.0048, lon: 72.8435, type: "Hospital" },
  { name: "CMC Vellore", lat: 12.923, lon: 79.1343, type: "Hospital" },
  { name: "NIMHANS Bangalore", lat: 12.9431, lon: 77.5432, type: "Hospital" },
  { name: "PGIMER Chandigarh", lat: 30.765, lon: 76.775, type: "Hospital" },
  { name: "Rural Health Center, Ballabgarh", lat: 28.3375, lon: 77.3217, type: "Clinic" },
  { name: "Primary Health Centre, Gadchiroli", lat: 20.1809, lon: 80.0015, type: "Clinic" },
  { name: "Community Health Centre, Palghar", lat: 19.6967, lon: 72.7699, type: "Clinic" },
]

export default function MapComponent() {
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {facilities.map((facility, index) => (
        <CircleMarker
          key={index}
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

