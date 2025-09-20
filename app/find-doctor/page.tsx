"use client"

import { useState, useRef, useEffect } from "react"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

const GEOAPIFY_API_KEY = "654ee2fb81ac4e598a626a3edd9a5860"

interface DoctorMarker {
  name: string
  lat: number
  lng: number
  address: string
  distance: number
  website?: string
  mapsLink: string
}

function LeafletMap({ condition, location, setDoctorMarkers, setIsLoading }: { condition: string; location: string; setDoctorMarkers: (doctors: DoctorMarker[]) => void; setIsLoading: (loading: boolean) => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

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

  const fetchNearbyDoctors = async (lat: number, lng: number, searchTerm: string) => {
    try {
      setIsLoading(true)
      
      // Primary search with specific categories
      let categories = "healthcare.doctor,healthcare.hospital,healthcare.clinic"
      if (searchTerm.toLowerCase().includes('cardio')) categories = "healthcare.doctor,healthcare.hospital"
      if (searchTerm.toLowerCase().includes('dent')) categories = "healthcare.dentist,healthcare.clinic"
      if (searchTerm.toLowerCase().includes('pediatric')) categories = "healthcare.doctor,healthcare.clinic"
      if (searchTerm.toLowerCase().includes('dermat')) categories = "healthcare.doctor,healthcare.clinic"
      
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Specific categories with specialty term
        {
          url: `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lng},${lat},25000&bias=proximity:${lng},${lat}&limit=50&text=${encodeURIComponent(searchTerm)}&apiKey=${GEOAPIFY_API_KEY}`,
          name: 'Specific search'
        },
        // Strategy 2: Broader healthcare search
        {
          url: `https://api.geoapify.com/v2/places?categories=healthcare&filter=circle:${lng},${lat},30000&bias=proximity:${lng},${lat}&limit=50&apiKey=${GEOAPIFY_API_KEY}`,
          name: 'Broad healthcare search'
        },
        // Strategy 3: Medical facilities search
        {
          url: `https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.clinic,healthcare.doctor&filter=circle:${lng},${lat},50000&bias=proximity:${lng},${lat}&limit=100&apiKey=${GEOAPIFY_API_KEY}`,
          name: 'Extended radius search'
        }
      ]
      
      let allDoctors: DoctorMarker[] = []
      
      for (const strategy of searchStrategies) {
        try {
          console.log(`Trying ${strategy.name}...`)
          const response = await fetch(strategy.url)
          const data = await response.json()
          
          if (data.features && data.features.length > 0) {
            const doctors: DoctorMarker[] = data.features.map((place: any) => {
              const props = place.properties
              return {
                name: props.name || props.address_line1 || "Healthcare Facility",
                address: props.address_line2 || props.formatted,
                lat: place.geometry.coordinates[1],
                lng: place.geometry.coordinates[0],
                website: props.website,
                distance: getDistance(lat, lng, place.geometry.coordinates[1], place.geometry.coordinates[0]),
                mapsLink: `https://www.openstreetmap.org/?mlat=${place.geometry.coordinates[1]}&mlon=${place.geometry.coordinates[0]}#map=18/${place.geometry.coordinates[1]}/${place.geometry.coordinates[0]}`
              }
            })
            
            // Filter results based on search term
            const filteredDoctors = doctors.filter(doctor => {
              const name = doctor.name.toLowerCase()
              const address = doctor.address.toLowerCase()
              const term = searchTerm.toLowerCase()
              
              // Check if the doctor/facility matches the search term
              return name.includes(term) || 
                     name.includes('hospital') || 
                     name.includes('clinic') || 
                     name.includes('medical') || 
                     name.includes('health') || 
                     address.includes('medical') || 
                     address.includes('hospital')
            })
            
            allDoctors = [...allDoctors, ...filteredDoctors]
            
            if (allDoctors.length >= 10) break // Stop if we have enough results
          }
        } catch (error) {
          console.warn(`${strategy.name} failed:`, error)
          continue
        }
      }
      
      // Remove duplicates based on name and location
      const uniqueDoctors = allDoctors.filter((doctor, index, self) => 
        index === self.findIndex(d => 
          d.name === doctor.name && 
          Math.abs(d.lat - doctor.lat) < 0.001 && 
          Math.abs(d.lng - doctor.lng) < 0.001
        )
      )
      
      // Sort by distance
      const sortedDoctors = uniqueDoctors.sort((a, b) => a.distance - b.distance)
      
      setDoctorMarkers(sortedDoctors)
      setIsLoading(false)
      
      console.log(`Found ${sortedDoctors.length} unique healthcare facilities`)
      
      // Add markers to map
      if (leafletMap.current && sortedDoctors.length > 0) {
        sortedDoctors.forEach((doctor: any) => {
          const marker = L.marker([doctor.lat, doctor.lng]).addTo(leafletMap.current)
          marker.bindPopup(`<b>${doctor.name}</b><br>${doctor.address}<br>${doctor.distance.toFixed(2)} km away`)
        })
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctorMarkers([])
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!location) return
    
    // Parse location - if it's coordinates, use directly
    if (location.includes(',')) {
      const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()))
      if (!isNaN(lat) && !isNaN(lng)) {
        initializeMap(lat, lng)
        fetchNearbyDoctors(lat, lng, condition)
        return
      }
    }
    
    // If it's an address, geocode it first
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${GEOAPIFY_API_KEY}`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].geometry.coordinates
          const lat = coords[1]
          const lng = coords[0]
          initializeMap(lat, lng)
          fetchNearbyDoctors(lat, lng, condition)
        }
      })
      .catch(error => {
        console.error('Geocoding error:', error)
        setIsLoading(false)
      })
  }, [condition, location])

  const initializeMap = (lat: number, lng: number) => {
    if (mapRef.current) {
      if (leafletMap.current) {
        try {
          leafletMap.current.remove()
        } catch (error) {
          console.warn('Error removing map:', error)
        }
        leafletMap.current = null
      }
      mapRef.current.innerHTML = ""
      leafletMap.current = L.map(mapRef.current).setView([lat, lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current)
      
      // Add user location marker
      L.marker([lat, lng], {
        icon: L.divIcon({
          html: '📍',
          iconSize: [30, 30],
          className: 'custom-div-icon'
        })
      }).addTo(leafletMap.current).bindPopup('Your Location')
    }
  }

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "12px", marginBottom: "2rem" }} />
      <style jsx>{`
        .custom-div-icon {
          background: transparent;
          border: none;
          font-size: 24px;
        }
      `}</style>
    </div>
  )
}

export default function FindDoctor() {
  const [condition, setCondition] = useState("doctor");
  const [location, setLocation] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [doctorMarkers, setDoctorMarkers] = useState<DoctorMarker[]>([]);
  const [searchClicked, setSearchClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocation(`${lat},${lng}`);
          setSearchClicked(true); // Auto-search with current location
        },
        (error) => {
          console.warn('Location access denied, using default location');
          setLocation('Bhubaneswar, Odisha, India');
          setSearchClicked(true); // Auto-search with default location
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocation('Bhubaneswar, Odisha, India');
      setSearchClicked(true);
    }
  }, []);

  // Live search when condition or location changes
  useEffect(() => {
    if (condition && location && searchClicked) {
      const timeoutId = setTimeout(() => {
        // Trigger search after 500ms delay to avoid too many API calls
        setIsLoading(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [condition, location, searchClicked]);

  const handleSearch = () => {
    setSearchClicked(true);
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black dark:bg-black text-white">
      <Navbar />

      {/* Search Section - Fixed at Top */}
      <div className="bg-black dark:bg-black text-white py-6 sm:py-8 px-3 sm:px-4 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">Find Nearby Doctors</h1>
          
          {/* Quick suggestions */}
          <div className="mb-4 text-center">
            <p className="text-gray-400 text-sm mb-2">Popular searches:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['cardiologist', 'dentist', 'dermatologist', 'pediatrician', 'general physician'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setCondition(suggestion);
                    if (location) setSearchClicked(true);
                  }}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch">
            <div className="flex-1">
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-black dark:bg-black text-white placeholder-gray-400 border border-gray-700 text-sm sm:text-base"
                placeholder="Enter your health condition (e.g., cardiologist, dentist)..."
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  if (e.target.value && location) setSearchClicked(true);
                }}
              />
            </div>

            <div className="flex-1">
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-black dark:bg-black text-white placeholder-gray-400 border border-gray-700 text-sm sm:text-base"
                placeholder="Enter your location or use current location..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (condition && e.target.value) setSearchClicked(true);
                }}
              />
            </div>

            <Button
              className="flex items-center justify-center gap-2 hover:bg-[#b9b9b9] text-sm sm:text-base py-2 sm:py-3"
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Search size={16} className="sm:size-20" />
              {isLoading ? 'Searching...' : 'Find Doctors'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section - Expanded Area Below */}
      <div className="flex-grow dark:bg-black text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {searchClicked && (
            <LeafletMap condition={condition} location={location} setDoctorMarkers={setDoctorMarkers} setIsLoading={setIsLoading} />
          )}
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="text-gray-400 mt-4">Searching for doctors near you...</p>
            </div>
          )}
          
          {!isLoading && doctorMarkers.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-white pb-2 border-b border-gray-700">
                {doctorMarkers.length} Doctors/Clinics Found
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {doctorMarkers.map((doc, index) => (
                  <div
                    key={`${doc.name}-${doc.address}-${index}`}
                    className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 flex flex-col border border-gray-700"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-2">{doc.name}</h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="inline-block bg-blue-900 text-blue-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        Clinic/Hospital
                      </span>
                    </div>
                  <div className="space-y-2 sm:space-y-3 text-gray-300 flex-grow text-sm sm:text-base">
                    <p className="flex items-start">
                      <span className="font-medium min-w-16 sm:min-w-24 inline-block">Address:</span>
                      <span>{doc.address}</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-medium min-w-16 sm:min-w-24 inline-block">Distance:</span>
                      <span>{doc.distance.toFixed(2)} km away</span>
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                    <a
                      href={doc.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-medium text-xs sm:text-sm inline-flex items-center mr-4"
                    >
                      View on Maps
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                    {doc.website && (
                      <a
                        href={doc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-medium text-xs sm:text-sm inline-flex items-center"
                      >
                        Visit Website
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !isLoading && searchClicked ? (
            <div className="dark:bg-black text-white shadow-md p-8 text-center border border-gray-700 rounded-lg">
              <div className="flex flex-col items-center justify-center py-12">
                <Search size={48} className="text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  No specific doctors found for "{condition}" in "{location}"
                </p>
                <div className="text-gray-500 text-sm space-y-2">
                  <p>Try these suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Search for "doctor" or "hospital" instead of specific specialties</li>
                    <li>Try a nearby major city (e.g., "Patna" instead of "Bihar")</li>
                    <li>Use broader terms like "clinic" or "medical center"</li>
                    <li>Check if your location spelling is correct</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setCondition('hospital')
                      setSearchClicked(true)
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                  >
                    Search for Hospitals Instead
                  </button>
                </div>
              </div>
            </div>
          ) : !searchClicked && !isLoading ? (
            <div className="dark:bg-black text-white shadow-md p-8 text-center border border-gray-700 rounded-lg">
              <div className="flex flex-col items-center justify-center py-12">
                <Search size={48} className="text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">
                  Detecting your location and searching for doctors...
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Back to Home Button */}
      <div className="dark:bg-black text-white pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 hover:bg-[#b9b9b9]"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

