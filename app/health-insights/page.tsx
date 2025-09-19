"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UrbanRuralDisparity } from "@/components/charts/UrbanRuralDisparity"
import { HealthConditionsChart } from "@/components/charts/HealthConditionsChart"
import { HealthcareAccessMap } from "@/components/charts/HealthcareAccessMap"
import { LifeExpectancyTrend } from "@/components/charts/LifeExpectancyTrend"
import { ChildMortalityRate } from "@/components/charts/ChildMortalityRate"

export default function HealthInsights() {
  const [activeTab, setActiveTab] = useState("disparity")

  return (
    <div className="min-h-screen bg-black dark:bg-black text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Health Insights: India's Urban-Rural Disparities
        </motion.h1>

        <Tabs defaultValue="disparity" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
            <TabsTrigger value="disparity" className="text-xs sm:text-sm">
              Urban-Rural
            </TabsTrigger>
            <TabsTrigger value="conditions" className="text-xs sm:text-sm">
              Health Conditions
            </TabsTrigger>
            <TabsTrigger value="life-expectancy" className="text-xs sm:text-sm">
              Life Expectancy
            </TabsTrigger>
            <TabsTrigger value="child-mortality" className="text-xs sm:text-sm">
              Child Mortality
            </TabsTrigger>
          </TabsList>
          <TabsContent value="disparity">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-xl md:text-2xl">
                  Urban-Rural Health Disparity in India
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Comparing health indicators between urban and rural areas
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 md:pt-6 px-2 sm:px-6 pb-4 sm:pb-6">
                <div className="h-[300px] sm:h-[350px] md:h-[400px]">
                  <UrbanRuralDisparity />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="conditions">
            <Card>
              <CardHeader>
                <CardTitle>Prevalence of Health Conditions in India</CardTitle>
                <CardDescription>Distribution of common health conditions in urban and rural areas</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <HealthConditionsChart />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="life-expectancy">
            <Card>
              <CardHeader>
                <CardTitle>Life Expectancy Trend in India</CardTitle>
                <CardDescription>Historical trend of life expectancy in India</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <LifeExpectancyTrend />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="child-mortality">
            <Card>
              <CardHeader>
                <CardTitle>Child Mortality Rate in India</CardTitle>
                <CardDescription>Trend of under-5 mortality rate in India</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ChildMortalityRate />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-semibold mb-4">Key Takeaways</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Significant disparities exist in health outcomes between urban and rural areas in India.</li>
            <li>Certain health conditions show higher prevalence in rural regions compared to urban centers.</li>
            <li>Access to healthcare facilities varies greatly across different regions of India.</li>
            <li>Life expectancy in India has been steadily increasing over the past decades.</li>
            <li>Child mortality rates have significantly decreased, but there's still room for improvement.</li>
            <li>
              Targeted interventions are needed to address these disparities and improve overall health outcomes in
              India.
            </li>
          </ul>
        </motion.section>
      </main>
      <Footer />
    </div>
  )
}

