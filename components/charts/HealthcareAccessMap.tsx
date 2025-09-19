"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(() => import("./MapComponent"), { ssr: false })

export function HealthcareAccessMap() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p>Loading map...</p>
      </div>
    )
  }

  return <MapWithNoSSR />
}

