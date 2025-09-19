"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ChatbotWidget from "@/components/ChatbotWidget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Bot, Heart, Shield, Globe, Zap } from "lucide-react"

export default function ChatbotPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-green-600" />,
      title: "AI-Powered Responses",
      description: "Advanced AI trained on medical knowledge to provide accurate health information"
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: "Multilingual Support",
      description: "Communicate in 10+ Indian languages including Hindi, Bengali, Tamil, and more"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: "Health Expertise",
      description: "Specialized in preventive healthcare, symptoms, and vaccination guidance"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Privacy Protected",
      description: "Your health conversations are secure and confidential"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: "Instant Responses",
      description: "Get immediate answers to your health questions 24/7"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-indigo-600" />,
      title: "Voice & Text",
      description: "Interact using voice messages or text in your preferred language"
    }
  ]

  const sampleQuestions = [
    "What are the symptoms of dengue fever?",
    "When should I get my child vaccinated?",
    "How to prevent malaria during monsoon?",
    "What foods are good for diabetes?",
    "How to boost immunity naturally?",
    "Emergency care for high fever?"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Bot className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Health Assistant
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get instant, accurate health information in your native language. 
            Our AI chatbot is trained to help rural and semi-urban communities 
            with preventive healthcare, disease symptoms, and vaccination guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsChatbotOpen(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Chat Now
            </Button>
            
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Questions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Try These Sample Questions
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start hover:bg-green-50 hover:border-green-300"
                onClick={() => {
                  setIsChatbotOpen(true)
                  // Could pre-fill the question in the chatbot
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-wrap">{question}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-6 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Your Question</h3>
              <p className="text-gray-600">
                Type or speak your health question in any supported language
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-6 rounded-full mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI processes your question using medical knowledge base
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 p-6 rounded-full mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Answer</h3>
              <p className="text-gray-600">
                Receive accurate, helpful information in your preferred language
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl text-white p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Trusted by Thousands
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-green-100">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">80%</div>
              <div className="text-green-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-green-100">Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-green-100">Daily Users</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Important Disclaimer
          </h3>
          <p className="text-yellow-700">
            This AI health assistant provides general health information and should not replace 
            professional medical advice. Always consult with qualified healthcare professionals 
            for medical diagnosis and treatment.
          </p>
        </div>
      </main>

      <Footer />
      
      <ChatbotWidget 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
      />
    </div>
  )
}