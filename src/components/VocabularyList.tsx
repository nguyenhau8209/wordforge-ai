"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, Volume2 } from "lucide-react"
import { toast } from "sonner"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
  english_definition?: string
}

interface VocabularyListProps {
  vocabulary: VocabularyItem[]
  topic: string
  language: string
  proficiency: string
  onNext: (passage: string) => void
}

export default function VocabularyList({ vocabulary, topic, language, proficiency, onNext }: VocabularyListProps) {
  const [isGeneratingPassage, setIsGeneratingPassage] = useState(false)

  const handleNext = async () => {
    setIsGeneratingPassage(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_passage",
          topic: topic,
          vocabulary: vocabulary,
          language: language,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onNext(data.passage)
      } else {
        const error = await response.json()
        toast.error(error.error || "Có lỗi xảy ra khi tạo bài đọc")
      }
    } catch (error) {
      console.error("Error generating passage:", error)
      toast.error("Có lỗi xảy ra khi tạo bài đọc")
    } finally {
      setIsGeneratingPassage(false)
    }
  }

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Từ Vựng Chủ Đề: {topic}
        </h2>
        <p className="text-gray-600">
          Hãy xem qua {vocabulary.length} từ vựng trước khi tiếp tục sang bài đọc
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {vocabulary.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{item.word}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakWord(item.word)}
                  className="p-1"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-sm text-blue-600 font-medium">
                {item.type}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 mb-2">{item.vietnamese_meaning}</p>
              {item.english_definition && (
                <p className="text-sm text-gray-500 italic">
                  {item.english_definition}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          onClick={handleNext}
          disabled={isGeneratingPassage}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
        >
          {isGeneratingPassage ? (
            <>
              <BookOpen className="h-5 w-5 mr-2 animate-pulse" />
              Đang tạo bài đọc...
            </>
          ) : (
            <>
              Tiếp tục sang Bài Đọc Ngữ Cảnh
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
