"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Mic, MicOff, Globe, MessageCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  language: string
  type?: 'text' | 'quick_reply' | 'image' | 'audio'
  quickReplies?: Array<{ id: string; text: string }>
}

interface ChatbotWidgetProps {
  isOpen?: boolean
  onToggle?: () => void
  className?: string
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' }
]

const HEALTH_QUICK_REPLIES = [
  { id: 'symptoms', text: 'Check Symptoms' },
  { id: 'vaccination', text: 'Vaccination Info' },
  { id: 'emergency', text: 'Emergency Help' },
  { id: 'prevention', text: 'Prevention Tips' }
]

export default function ChatbotWidget({ isOpen = false, onToggle, className }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
      language: 'en',
      type: 'quick_reply',
      quickReplies: HEALTH_QUICK_REPLIES
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    setIsSpeechSupported('speechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (messageText: string, isQuickReply: boolean = false) => {
    if (!messageText.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      language: selectedLanguage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send message to backend
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          user_id: 'web_user_' + Date.now(),
          channel: 'web',
          language: selectedLanguage,
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I couldn\'t process your request. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        language: data.language || selectedLanguage
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again.',
        sender: 'bot',
        timestamp: new Date(),
        language: selectedLanguage
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleQuickReply = (reply: { id: string; text: string }) => {
    sendMessage(reply.text, true)
  }

  const startVoiceRecording = () => {
    if (!isSpeechSupported) return

    setIsRecording(true)
    
    const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = selectedLanguage === 'en' ? 'en-IN' : `${selectedLanguage}-IN`
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedLanguage === 'en' ? 'en-IN' : `${selectedLanguage}-IN`
      speechSynthesis.speak(utterance)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={`fixed bottom-4 right-4 w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg z-50 ${className}`}
      >
        <MessageCircle className="w-8 h-8" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-[600px] flex flex-col shadow-2xl z-50 ${className}`}>
      <CardHeader className="bg-green-600 text-white rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-700 text-white">AI</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">GramAarogya Health Bot</CardTitle>
              <p className="text-xs text-green-100">AI Health Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-green-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32 h-8 bg-green-700 border-green-500 text-white">
              <Globe className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="text-sm">{lang.native}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Online
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.sender === 'bot' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => speakMessage(message.text)}
                      >
                        <span className="text-xs opacity-70">🔊</span>
                      </Button>
                    )}
                  </div>
                  
                  {message.quickReplies && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.quickReplies.map((reply) => (
                        <Button
                          key={reply.id}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs"
                          onClick={() => handleQuickReply(reply)}
                        >
                          {reply.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-sm text-gray-600">AI is typing...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your health question..."
              className="flex-1"
              disabled={isTyping}
            />
            
            {isSpeechSupported && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startVoiceRecording}
                disabled={isRecording || isTyping}
                className={isRecording ? 'bg-red-100 border-red-300' : ''}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            
            <Button type="submit" size="sm" disabled={isTyping || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="flex justify-center mt-2">
            <p className="text-xs text-gray-500">
              AI responses may not always be accurate. Consult a doctor for medical advice.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add speech recognition type declarations
declare global {
  interface Window {
    speechRecognition: any
    webkitSpeechRecognition: any
  }
}