"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { indicator: "Access to Improved Sanitation", urban: 93, rural: 64 },
  { indicator: "Institutional Births", urban: 94.7, rural: 87.2 },
  { indicator: "Full Immunization Coverage", urban: 77, rural: 73 },
  { indicator: "Stunting in Children", urban: 31, rural: 41 },
  { indicator: "Obesity in Women", urban: 31.3, rural: 15 },
]

export default function BarChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="indicator" type="category" width={150} />
        <Tooltip />
        <Legend />
        <Bar dataKey="urban" fill="#8884d8" name="Urban" />
        <Bar dataKey="rural" fill="#82ca9d" name="Rural" />
      </BarChart>
    </ResponsiveContainer>
  )
}

