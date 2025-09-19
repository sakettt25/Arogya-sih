"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import the chart component with no SSR
const LineChartWithNoSSR = dynamic(() => import("./LineChartComponent"), { ssr: false })

export function LifeExpectancyTrend() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p>Loading chart...</p>
      </div>
    )
  }

  return <LineChartWithNoSSR />
}

