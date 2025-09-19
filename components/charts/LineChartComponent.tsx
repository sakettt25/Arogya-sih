"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { year: 1960, lifeExpectancy: 41.17 },
  { year: 1970, lifeExpectancy: 47.72 },
  { year: 1980, lifeExpectancy: 54.21 },
  { year: 1990, lifeExpectancy: 58.37 },
  { year: 2000, lifeExpectancy: 62.34 },
  { year: 2010, lifeExpectancy: 66.69 },
  { year: 2020, lifeExpectancy: 69.66 },
]

export default function LineChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="lifeExpectancy" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

