"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Volume2, Play, Pause, RotateCcw, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
}

interface ReadingPassageProps {
  passage: string
  vocabulary: VocabularyItem[]
  topic: string
  language: string
  proficiency: string
  onNext: (exercises: any) => void
}

export default function ReadingPassage({ passage, vocabulary, topic, language, proficiency, onNext }: ReadingPassageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false)
  const [highlightedPassage, setHighlightedPassage] = useState("")

  useEffect(() => {
    // Highlight vocabulary words in the passage
    let highlighted = passage
    vocabulary.forEach((item) => {
      const regex = new RegExp(`\\b${item.word}\\b`, 'gi')
      highlighted = highlighted.replace(regex, `<mark class="bg-yellow-200 px-1 rounded font-semibold" title="${item.vietnamese_meaning}">${item.word}</mark>`)
    })
    setHighlightedPassage(highlighted)
  }, [passage, vocabulary])

  const handlePlayPause = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        speechSynthesis.cancel()
        setIsPlaying(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(passage)
        utterance.lang = 'en-US'
        utterance.rate = 0.7
        utterance.pitch = 1
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        
        speechSynthesis.speak(utterance)
        setIsPlaying(true)
      }
    } else {
      toast.error("Trình duyệt không hỗ trợ Text-to-Speech")
    }
  }

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }

  const handleNext = async () => {
    setIsGeneratingExercises(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_exercises",
          passage: passage,
          vocabulary: vocabulary,
          language: language,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onNext(data.exercises)
      } else {
        const error = await response.json()
        toast.error(error.error || "Có lỗi xảy ra khi tạo bài luyện tập")
      }
    } catch (error) {
      console.error("Error generating exercises:", error)
      toast.error("Có lỗi xảy ra khi tạo bài luyện tập")
    } finally {
      setIsGeneratingExercises(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Bài Đọc Ngữ Cảnh: {topic}
        </h2>
        <p className="text-gray-600">
          Đọc đoạn văn dưới đây và chú ý các từ vựng được highlight
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Đoạn văn ngữ cảnh</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                disabled={!('speechSynthesis' in window)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={!isPlaying}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Các từ vựng đã học được highlight màu vàng. Di chuột vào từ để xem nghĩa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-lg max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightedPassage }}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Từ vựng trong bài đọc</CardTitle>
          <CardDescription>
            Danh sách các từ vựng xuất hiện trong đoạn văn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vocabulary.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(item.word)
                      utterance.lang = 'en-US'
                      utterance.rate = 0.8
                      speechSynthesis.speak(utterance)
                    }
                  }}
                  className="p-1"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.word}</div>
                  <div className="text-xs text-gray-500 truncate">{item.vietnamese_meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleNext}
          disabled={isGeneratingExercises}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
        >
          {isGeneratingExercises ? (
            <>
              <BookOpen className="h-5 w-5 mr-2 animate-pulse" />
              Đang tạo bài luyện tập...
            </>
          ) : (
            <>
              Tiếp tục sang Bài Luyện Tập
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
