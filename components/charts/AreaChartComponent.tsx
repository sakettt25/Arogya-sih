"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { year: 1960, mortalityRate: 242.1 },
  { year: 1970, mortalityRate: 202.5 },
  { year: 1980, mortalityRate: 167.5 },
  { year: 1990, mortalityRate: 126.1 },
  { year: 2000, mortalityRate: 91.8 },
  { year: 2010, mortalityRate: 57.2 },
  { year: 2020, mortalityRate: 34.3 },
]

export default function AreaChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="mortalityRate" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

