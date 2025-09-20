"use client"

import { useEffect, useState, useRef } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const GEOAPIFY_API_KEY = "654ee2fb81ac4e598a626a3edd9a5860"

// Facility type icons mapping
const facilityIcons = {
  all: "🏥",
  public: "🏛️",
  private: "🏨",
  clinic: "👨‍⚕️",
  medical: "💊"
}

// Healthcare facility type icons based on category
const getHealthcareFacilityIcon = (place: any) => {
  const name = place.name?.toLowerCase() || ''
  const vicinity = place.vicinity?.toLowerCase() || ''
  
  if (name.includes('hospital') || vicinity.includes('hospital')) return '🏥'
  if (name.includes('clinic') || vicinity.includes('clinic')) return '🏪'
  if (name.includes('pharmacy') || name.includes('medical store')) return '💊'
  if (name.includes('eye') || name.includes('dental') || name.includes('dentist')) return '👁️'
  if (name.includes('primary health') || name.includes('phc')) return '🏛️'
  return '🏥' // default hospital icon
}

declare global {
  interface Window {
    initMap: () => void
  }
}

export default function GMap() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [places, setPlaces] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<string>("all")
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const [L, setL] = useState<any>(null)

  // Dynamically import Leaflet only on client side
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const leaflet = await import('leaflet')
        
        // Fix for Leaflet marker icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
        
        setL(leaflet.default)
      }
    }
    loadLeaflet()
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setLocation({ lat, lng })
        },
        () => setError("Location access denied"),
        { enableHighAccuracy: true },
      )
    } else {
      setError("Geolocation is not supported")
    }
  }, [])

  useEffect(() => {
    if (!location || !L) return
    fetchNearbyPlaces(location.lat, location.lng, selectedFacility)
    // Render map
    if (mapRef.current) {
      // Clean up existing map instance properly
      if (leafletMap.current) {
        try {
          leafletMap.current.remove()
        } catch (error) {
          console.warn('Error removing map:', error)
        }
        leafletMap.current = null
      }
      // Reset map container to avoid reuse error
      mapRef.current.innerHTML = ""
      leafletMap.current = L.map(mapRef.current).setView([location.lat, location.lng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current)
    }
    return () => {
      if (leafletMap.current) {
        try {
          leafletMap.current.remove()
        } catch (error) {
          console.warn('Error removing map in cleanup:', error)
        }
        leafletMap.current = null
      }
    }
  }, [location, selectedFacility, L])

  // Filtered places based on filterTerm
  const filteredPlaces = places

  const fetchNearbyPlaces = async (lat: number, lng: number, facilityType: string) => {
    try {
      // Map facilityType to Geoapify categories - different for each type
      let categories = "healthcare.doctor,healthcare.hospital,healthcare.clinic,healthcare.pharmacy,healthcare.dentist,healthcare"
      if (facilityType === "public") categories = "healthcare.hospital,healthcare.clinic,healthcare"
      if (facilityType === "private") categories = "healthcare.clinic,healthcare.doctor,healthcare.dentist,healthcare"
      if (facilityType === "clinic") categories = "healthcare.clinic,healthcare.doctor,healthcare.dentist"
      if (facilityType === "medical") categories = "healthcare.pharmacy,healthcare.hospital,healthcare.clinic,healthcare.doctor"

      const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lng},${lat},10000&bias=proximity:${lng},${lat}&limit=50&apiKey=${GEOAPIFY_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('API Response for', facilityType, ':', data) // Debug log
      
      if (!data.features || data.features.length === 0) {
        console.warn('No facilities found for', facilityType)
        // Try with broader categories if no results
        const broadUrl = `https://api.geoapify.com/v2/places?categories=healthcare&filter=circle:${lng},${lat},15000&bias=proximity:${lng},${lat}&limit=50&apiKey=${GEOAPIFY_API_KEY}`
        const broadResponse = await fetch(broadUrl)
        const broadData = await broadResponse.json()
        
        if (!broadData.features || broadData.features.length === 0) {
          setPlaces([])
          return
        }
        
        const sortedPlaces = broadData.features.map((place: any) => {
          const props = place.properties
          return {
            name: props.name || props.address_line1 || "Healthcare Facility",
            vicinity: props.address_line2 || props.formatted,
            lat: place.geometry.coordinates[1],
            lng: place.geometry.coordinates[0],
            website: props.website,
            distance: getDistance(lat, lng, place.geometry.coordinates[1], place.geometry.coordinates[0]),
            mapsLink: `https://www.openstreetmap.org/?mlat=${place.geometry.coordinates[1]}&mlon=${place.geometry.coordinates[0]}#map=18/${place.geometry.coordinates[1]}/${place.geometry.coordinates[0]}`
          }
        }).sort((a: any, b: any) => a.distance - b.distance)
        setPlaces(sortedPlaces)
        // Add markers to map
        if (leafletMap.current && L) {
          sortedPlaces.forEach((place: any) => {
            const marker = L.marker([place.lat, place.lng]).addTo(leafletMap.current)
            marker.bindPopup(`<b>${place.name}</b><br>${place.vicinity}`)
          })
        }
        return
      }
      
      const sortedPlaces = data.features.map((place: any) => {
        const props = place.properties
        return {
          name: props.name || props.address_line1 || "Healthcare Facility",
          vicinity: props.address_line2 || props.formatted,
          lat: place.geometry.coordinates[1],
          lng: place.geometry.coordinates[0],
          website: props.website,
          distance: getDistance(lat, lng, place.geometry.coordinates[1], place.geometry.coordinates[0]),
          mapsLink: `https://www.openstreetmap.org/?mlat=${place.geometry.coordinates[1]}&mlon=${place.geometry.coordinates[0]}#map=18/${place.geometry.coordinates[1]}/${place.geometry.coordinates[0]}`
        }
      }).sort((a: any, b: any) => a.distance - b.distance)
      setPlaces(sortedPlaces)
      // Add markers to map
      if (leafletMap.current && L) {
        sortedPlaces.forEach((place: any) => {
          const marker = L.marker([place.lat, place.lng]).addTo(leafletMap.current)
          marker.bindPopup(`<b>${place.name}</b><br>${place.vicinity}`)
        })
      }
    } catch (error) {
      setError("Failed to fetch nearby places. Please try again.")
      console.error("Error fetching places:", error)
    }
  }

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-gray-1000 text-white min-h-screen">
      <div className="fixed top-0 left-0 w-full bg-black shadow-md z-50">
        <Navbar />
      </div>

      <h1 className="text-3xl font-bold mb-6 pt-20 text-white text-center">Accessible Healthcare Locations</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4">
        <label htmlFor="facility-type" className="mr-2 text-white">
          Select Facility Type:
        </label>
        <select
          id="facility-type"
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          className="p-2 border border-gray-700 rounded-lg bg-black text-white"
        >
          <option value="all">{facilityIcons.all} All Medical Facilities</option>
          <option value="public">{facilityIcons.all} Public Health Center/Govt Hospitals</option>
          <option value="private">{facilityIcons.private} Private Health Centers</option>
          <option value="clinic">{facilityIcons.clinic} Doctor's Clinic</option>
          <option value="medical">{facilityIcons.medical} Medical Facilities</option>
        </select>
      </div>

      {/* Update the map and places list for better responsiveness */}
      <div className="flex flex-row w-full max-w-7xl mt-4 gap-4 sm:gap-6">
        {/* Map Section (Left) */}
        <div className="w-[55%] h-[350px] sm:h-[450px] md:h-[550px] rounded-lg overflow-hidden shadow-lg">
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Places List (Right) - Always visible */}
        <div className="w-[45%] h-[350px] sm:h-[450px] md:h-[550px] overflow-y-auto custom-scrollbar">
          <ul className="space-y-3 sm:space-y-4 p-2 sm:p-4">
            {places.map((place, index) => (
              <li
                key={`${place.name}-${place.vicinity}-${index}`}
                className="border border-gray-700 p-3 sm:p-5 rounded-lg bg-black shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getHealthcareFacilityIcon(place)}</span>
                    <strong className="text-base sm:text-lg md:text-xl font-semibold text-blue-400">{place.name}</strong>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg italic text-gray-300">{place.vicinity}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{place.distance.toFixed(2)} km away</p>

                  {/* View on Google Maps Link */}
                  <a
                    href={place.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-2 text-xs sm:text-sm"
                  >
                    View on Google Maps
                  </a>

                  {/* Visit Website Link (if available) */}
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline mt-1 text-xs sm:text-sm"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full bg-black text-gray-400 mt-10">
        <Footer />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Custom scrollbar styles */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f1f1f;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `
      }} />
    </div>
  )
}


