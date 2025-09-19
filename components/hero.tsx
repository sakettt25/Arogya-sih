"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const translations = [
  { lang: "English", text: "AI-Powered Healthcare Support" },
  { lang: "हिन्दी", text: "एआई-पावर्ड स्वास्थ्य समर्थन" },
  { lang: "ગુજરાતી", text: "એઆઈ-સંપન્ન આરોગ્ય સહાય" },
  { lang: "বাংলা", text: "এআই-চালিত স্বাস্থ্য সহায়তা" },
  { lang: "मराठी", text: "एआय-सक्षम आरोग्य मदत" },
  { lang: "தமிழ்", text: "ஏஐ இயக்கப்படும் ஆரோக்கிய ஆதரவு" },
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % translations.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="container relative flex min-h-[calc(100vh-3.5rem)] max-w-screen-2xl flex-col items-center justify-center space-y-8 py-20 px-4 text-center sm:py-28 md:py-36">
      {/* Floating AI Animation (Hidden on Mobile) */}
      <motion.div
        className="absolute top-10 right-10 hidden md:block"
        initial={{ y: -20 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      {/* Animated Heading */}
      <motion.div
        className="space-y-2 sm:space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          key={index}
          className="pt-4 sm:pt-6 bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight transition-all duration-1000"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.8 }}
        >
          {translations[index].text}
        </motion.h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground text-sm sm:text-base md:text-lg sm:leading-7 md:leading-8 px-4 sm:px-0">
          Get instant AI-driven health advice and find the nearest doctors and healthcare professionals tailored to your
          condition.
        </p>
      </motion.div>

      {/* Buttons (Stack on Mobile) */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none justify-center px-4 sm:px-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <Button
          size="lg"
          className="w-full sm:w-auto text-sm sm:text-base"
          onClick={() => router.push("/health-check")}
        >
          Check Your Health
          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full sm:w-auto text-sm sm:text-base"
          onClick={() => router.push("/find-doctor")}
        >
          Find Nearby Doctors
        </Button>
      </motion.div>
    </section>
  )
}

