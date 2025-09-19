"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ExternalLink, Search, Newspaper, HeartPulse } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"


interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  date: string;
}

interface NewsResponse {
  news: string;
  suggestions?: string;
}

const translations = [
  {
    lang: "English",
    heading: "Get Health News",
    placeholder: "Select a language...",
    buttonText: "Get News",
    loadingText: "Fetching news...",
    responseTitle: "News Results",
    homeButtonText: "Back to Home",
    readMore: "Read More",
    suggestionsTitle: "Healthcare Suggestions",
  },
  {
    lang: "हिन्दी",
    heading: "स्वास्थ्य समाचार प्राप्त करें",
    placeholder: "भाषा चुनें...",
    buttonText: "समाचार प्राप्त करें",
    loadingText: "समाचार लोड हो रहे हैं...",
    responseTitle: "समाचार परिणाम",
    homeButtonText: "होम पेज पर वापस जाएं",
    readMore: "पूरा पढ़ें",
    suggestionsTitle: "स्वास्थ्य सुझाव",
  },
  {
    lang: "मराठी",
    heading: "आरोग्य बातम्या प्राप्त करा",
    placeholder: "भाषा निवडा...",
    buttonText: "बातम्या प्राप्त करा",
    loadingText: "बातम्या लोड होत आहेत...",
    responseTitle: "बातम्या परिणाम",
    homeButtonText: "होम पेजवर परत जा",
    readMore: "अधिक वाचा",
    suggestionsTitle: "आरोग्य सूचना",
  },
  {
    lang: "বাংলা",
    heading: "স্বাস্থ্য সংবাদ পান",
    placeholder: "একটি ভাষা নির্বাচন করুন...",
    buttonText: "সংবাদ পান",
    loadingText: "সংবাদ লোড হচ্ছে...",
    responseTitle: "সংবাদ ফলাফল",
    homeButtonText: "হোম পেজে ফিরে যান",
    readMore: "আরও পড়ুন",
    suggestionsTitle: "স্বাস্থ্য পরামর্শ",
  },
  {
    lang: "தமிழ்",
    heading: "சுகாதார செய்திகளைப் பெறுங்கள்",
    placeholder: "ஒரு மொழியைத் தேர்ந்தெடுக்கவும்...",
    buttonText: "செய்திகளைப் பெறுங்கள்",
    loadingText: "செய்திகள் ஏற்றப்படுகின்றன...",
    responseTitle: "செய்தி முடிவுகள்",
    homeButtonText: "முகப்பு பக்கத்திற்கு திரும்புக",
    readMore: "மேலும் படிக்க",
    suggestionsTitle: "சுகாதார பரிந்துரைகள்",
  },
  {
    lang: "తెలుగు",
    heading: "ఆరోగ్య వార్తలు పొందండి",
    placeholder: "భాషను ఎంచుకోండి...",
    buttonText: "వార్తలు పొందండి",
    loadingText: "వార్తలు లోడ్ అవుతున్నాయి...",
    responseTitle: "వార్తా ఫలితాలు",
    homeButtonText: "హోమ్ పేజీకి తిరిగి వెళ్ళండి",
    readMore: "మరింత చదవండి",
    suggestionsTitle: "ఆరోగ్య సూచనలు",
  },
  {
    lang: "ગુજરાતી",
    heading: "સ્વાસ્થ્ય સમાચાર મેળવો",
    placeholder: "ભાષા પસંદ કરો...",
    buttonText: "સમાચાર મેળવો",
    loadingText: "સમાચાર લોડ થાય છે...",
    responseTitle: "સમાચાર પરિણામો",
    homeButtonText: "હોમ પેજ પર પાછા જાઓ",
    readMore: "વધુ વાંચો",
    suggestionsTitle: "આરોગ્ય સૂચનો",
  },
  {
    lang: "ਪੰਜਾਬੀ",
    heading: "ਸਿਹਤ ਦੀਆਂ ਖ਼ਬਰਾਂ ਪ੍ਰਾਪਤ ਕਰੋ",
    placeholder: "ਇੱਕ ਭਾਸ਼ਾ ਚੁਣੋ...",
    buttonText: "ਖ਼ਬਰਾਂ ਪ੍ਰਾਪਤ ਕਰੋ",
    loadingText: "ਖ਼ਬਰਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...",
    responseTitle: "ਖ਼ਬਰਾਂ ਦੇ ਨਤੀਜੇ",
    homeButtonText: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    readMore: "ਹੋਰ ਪੜ੍ਹੋ",
    suggestionsTitle: "ਸਿਹਤ ਸੁਝਾਵ",
  },
  {
    lang: "മലയാളം",
    heading: "ആരോഗ്യ വാർത്തകൾ നേടുക",
    placeholder: "ഭാഷ തിരഞ്ഞെടുക്കുക...",
    buttonText: "വാർത്തകൾ നേടുക",
    loadingText: "വാർത്തകൾ ലോഡ് ചെയ്യുന്നു...",
    responseTitle: "വാർത്താ ഫലങ്ങൾ",
    homeButtonText: "ഹോം പേജിലേക്ക് മടങ്ങുക",
    readMore: "കൂടുതൽ വായിക്കുക",
    suggestionsTitle: "ആരോഗ്യ നിർദ്ദേശങ്ങൾ",
  },
  {
    lang: "ಕನ್ನಡ",
    heading: "ಆರೋಗ್ಯ ಸುದ್ದಿಗಳನ್ನು ಪಡೆಯಿರಿ",
    placeholder: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ...",
    buttonText: "ಸುದ್ದಿಗಳನ್ನು ಪಡೆಯಿರಿ",
    loadingText: "ಸುದ್ದಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    responseTitle: "ಸುದ್ದಿ ಫಲಿತಾಂಶಗಳು",
    homeButtonText: "ಹೋಮ್ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    readMore: "ಇನ್ನಷ್ಟು ಓದಿ",
    suggestionsTitle: "ಆರೋಗ್ಯ ಸಲಹೆಗಳು",
  },
  {
    lang: "ଓଡ଼ିଆ",
    heading: "ସ୍ୱାସ୍ଥ୍ୟ ସମ୍ବାଦ ପାଆନ୍ତୁ",
    placeholder: "ଭାଷା ଚୟନ କରନ୍ତୁ...",
    buttonText: "ସମ୍ବାଦ ପାଆନ୍ତୁ",
    loadingText: "ସମ୍ବାଦ ଲୋଡ଼ ହେଉଛି...",
    responseTitle: "ସମ୍ବାଦ ଫଳାଫଳ",
    homeButtonText: "ହୋମ୍ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ",
    readMore: "ଅଧିକ ପଢ଼ନ୍ତୁ",
    suggestionsTitle: "ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରସ୍ତାବ",
  },
  {
    lang: "ਪੰਜਾਬੀ",
    heading: "ਸਿਹਤ ਦੀਆਂ ਖ਼ਬਰਾਂ ਪ੍ਰਾਪਤ ਕਰੋ",
    placeholder: "ਇੱਕ ਭਾਸ਼ਾ ਚੁਣੋ...",
    buttonText: "ਖ਼ਬਰਾਂ ਪ੍ਰਾਪਤ ਕਰੋ",
    loadingText: "ਖ਼ਬਰਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...",
    responseTitle: "ਖ਼ਬਰਾਂ ਦੇ ਨਤੀਜੇ",
    homeButtonText: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    readMore: "ਹੋਰ ਪੜ੍ਹੋ",
    suggestionsTitle: "ਸਿਹਤ ਸੁਝਾਵ",
  },
  {
    lang: "മലയാളം",
    heading: "ആരോഗ്യ വാർത്തകൾ നേടുക",
    placeholder: "ഭാഷ തിരഞ്ഞെടുക്കുക...",
    buttonText: "വാർത്തകൾ നേടുക",
    loadingText: "വാർത്തകൾ ലോഡ് ചെയ്യുന്നു...",
    responseTitle: "വാർത്താ ഫലങ്ങൾ",
    homeButtonText: "ഹോം പേജിലേക്ക് മടങ്ങുക",
    readMore: "കൂടുതൽ വായിക്കുക",
    suggestionsTitle: "ആരോഗ്യ നിർദ്ദേശങ്ങൾ",
  },
  {
    lang: "ಕನ್ನಡ",
    heading: "ಆರೋಗ್ಯ ಸುದ್ದಿಗಳನ್ನು ಪಡೆಯಿರಿ",
    placeholder: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ...",
    buttonText: "ಸುದ್ದಿಗಳನ್ನು ಪಡೆಯಿರಿ",
    loadingText: "ಸುದ್ದಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    responseTitle: "ಸುದ್ದಿ ಫಲಿತಾಂಶಗಳು",
    homeButtonText: "ಹೋಮ್ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    readMore: "ಇನ್ನಷ್ಟು ಓದಿ",
    suggestionsTitle: "ಆರೋಗ್ಯ ಸಲಹೆಗಳು",
  },
  {
    lang: "ଓଡ଼ିଆ",
    heading: "ସ୍ୱାସ୍ଥ୍ୟ ସମ୍ବାଦ ପାଆନ୍ତୁ",
    placeholder: "ଭାଷା ଚୟନ କରନ୍ତୁ...",
    buttonText: "ସମ୍ବାଦ ପାଆନ୍ତୁ",
    loadingText: "ସମ୍ବାଦ ଲୋଡ଼ ହେଉଛି...",
    responseTitle: "ସମ୍ବାଦ ଫଳାଫଳ",
    homeButtonText: "ହୋମ୍ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ",
    readMore: "ଅଧିକ ପଢ଼ନ୍ତୁ",
    suggestionsTitle: "ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରସ୍ତାବ",
  },
];

function NewsHelpPage() {
  const [language, setLanguage] = useState("Hindi")
  const [apiResponse, setApiResponse] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [index, setIndex] = useState(0) // Index for translations
  const router = useRouter()

  const languages = translations.map(t => t.lang);

  // Find the corresponding translation index based on the selected language
  useEffect(() => {
    const idx = translations.findIndex(t => t.lang === language);
    setIndex(idx === -1 ? 0 : idx);
  }, [language, translations]);

  // Parse news articles from response
  const parseNewsResponse = (responseText: string) => {
    try {
      // Split the response into articles
      const articleBlocks = responseText.split("\n\nTitle: ")
      const parsedArticles: NewsArticle[] = []

      articleBlocks.forEach((block, index) => {
        if (index === 0 && !block.startsWith("Title: ")) return

        const articleText = index === 0 ? block : "Title: " + block
        const titleMatch = articleText.match(/Title: (.*?)(?:\n|$)/)
        const descriptionMatch = articleText.match(/Description: (.*?)(?:\n|$)/)
        const contentMatch = articleText.match(/Content: ([\s\S]*?)(?:\nURL:|$)/)
        const urlMatch = articleText.match(/URL: (.*?)(?:\n|$)/)
        const sourceMatch = articleText.match(/Source: (.*?)(?:\n|$)/)
        const dateMatch = articleText.match(/Date: (.*?)(?:\n|$)/)

        if (titleMatch) {
          parsedArticles.push({
            title: titleMatch[1] || "",
            description: descriptionMatch ? descriptionMatch[1] : "",
            content: contentMatch ? contentMatch[1] : "",
            url: urlMatch ? urlMatch[1] : "",
            source: sourceMatch ? sourceMatch[1] : "",
            date: dateMatch ? dateMatch[1] : "",
          })
        }
      })

  setArticles(parsedArticles)
    } catch (error) {
      console.error("Error parsing news response:", error)
      setError("समाचार डेटा पार्स करने में त्रुटि हुई। कृपया पुनः प्रयास करें।")
    }
  }

  // Fetch news and suggestions from API
  const handleGetNews = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch news from NewsAPI.org
      const apiKey = "6f60614d31e44c5dab0ab36070581a10";
      const url = `https://newsapi.org/v2/top-headlines?category=health&language=en&pageSize=12&apiKey=${apiKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      // NewsAPI returns articles in data.articles
      if (data.articles && Array.isArray(data.articles)) {
        const parsedArticles: NewsArticle[] = data.articles.map((article: any) => ({
          title: article.title || "",
          description: article.description || "",
          content: article.content || "",
          url: article.url || "",
          source: article.source?.name || "",
          date: article.publishedAt || "",
        }));
        setArticles(parsedArticles);
      } else {
        setArticles([]);
      }
      // No suggestions from NewsAPI, clear suggestions
      setSuggestions([]);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("समाचार प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }  

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("hi-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Get translation for the currently selected language
  const getTranslation = (key: string) => {
    const currentTranslation = translations[index]
    return currentTranslation[key as keyof typeof currentTranslation] || ""
  }

  return (
    <div className="min-h-screen flex flex-col bg-black dark:bg-black text-white">
      <Navbar />
      {/* Search Section - Fixed at Top */}
      <div className="bg-black dark:bg-black text-white py-8 px-4 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">{getTranslation("heading")}</h1>
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1">
              <select
                className="w-full px-4 py-3 rounded-lg bg-black dark:bg-black text-white placeholder-gray-400 border border-gray-700"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang, idx) => (
                  <option key={idx} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="flex items-center justify-center gap-2 hover:bg-[#b9b9b9]"
              onClick={handleGetNews}
              disabled={loading}
            >
              <Newspaper size={20} />
              {loading ? getTranslation("loadingText") : getTranslation("buttonText")}
            </Button>
          </div>
        </div>
      </div>
      {/* Results Section - Expanded Area Below */}
      <div className="flex-grow dark:bg-black text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-300 text-lg">{getTranslation("loadingText")}</p>
            </div>
          ) : error ? (
            <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-700">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Healthcare Suggestions Section */}
              {suggestions.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-semibold mb-4 text-pink-400 flex items-center gap-2">
                    <HeartPulse size={24} /> {getTranslation("suggestionsTitle")}
                  </h2>
                  <ul className="list-disc pl-6 text-gray-200">
                    {suggestions.map((s, idx) => (
                      <li key={idx} className="mb-2">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* News Articles Section */}
              {articles.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-semibold mb-6 text-white pb-2 border-b border-gray-700">
                    {translations[index].responseTitle}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {articles.map((article, idx) => (
                      <div 
                        key={idx} 
                        className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col border border-gray-700"
                      >
                        <h3 className="text-xl font-semibold text-blue-400 mb-2">{article.title}</h3>
                        <p className="text-gray-300 mb-3">{article.description}</p>
                        <p className="text-gray-400 mb-4 flex-grow">{article.content.substring(0, 150)}...</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                          <span>{article.source}</span>
                          <span>{formatDate(article.date)}</span>
                        </div>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm inline-flex items-center"
                        >
                          {translations[index].readMore}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="dark:bg-black text-white shadow-md p-8 text-center border border-gray-700 rounded-lg">
                  <div className="flex flex-col items-center justify-center py-12">
                    <Newspaper size={48} className="text-gray-500 mb-4" />
                    <p className="text-gray-400 text-lg">
                      {getTranslation("placeholder")}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
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
            {getTranslation("homeButtonText")}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default NewsHelpPage;
