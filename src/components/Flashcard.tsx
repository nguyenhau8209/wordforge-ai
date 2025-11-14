"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw, CheckCircle, XCircle } from "lucide-react"

interface FlashcardProps {
  id: string
  front: string
  back: string
  pronunciation?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  example?: string | null
  difficulty: number
  onReview: (quality: number) => void
}

export default function Flashcard({
  id,
  front,
  back,
  pronunciation,
  audioUrl,
  imageUrl,
  example,
  difficulty,
  onReview
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(console.error)
    }
  }

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true)
      setShowReview(true)
    }
  }

  const handleReview = (quality: number) => {
    onReview(quality)
    setIsFlipped(false)
    setShowReview(false)
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = [
      "bg-green-100 text-green-800", // 1 - Easy
      "bg-blue-100 text-blue-800",   // 2
      "bg-yellow-100 text-yellow-800", // 3
      "bg-orange-100 text-orange-800", // 4
      "bg-red-100 text-red-800"      // 5 - Hard
    ]
    return colors[difficulty - 1] || colors[0]
  }

  const getDifficultyText = (difficulty: number) => {
    const texts = ["Dễ", "Trung bình", "Khá khó", "Khó", "Rất khó"]
    return texts[difficulty - 1] || "Dễ"
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="relative h-96 cursor-pointer" onClick={handleFlip}>
        <CardContent className="h-full flex items-center justify-center p-8">
          {!isFlipped ? (
            // Front side
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-4xl font-bold text-gray-900">{front}</h2>
                {pronunciation && (
                  <span className="text-lg text-gray-500">/{pronunciation}/</span>
                )}
              </div>
              
              {audioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    playAudio()
                  }}
                  className="mt-4"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Phát âm
                </Button>
              )}
              
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt={front}
                    className="w-32 h-32 object-cover rounded-lg mx-auto"
                  />
                </div>
              )}
              
              <div className="mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(difficulty)}`}>
                  {getDifficultyText(difficulty)}
                </span>
              </div>
              
              <p className="text-gray-500 mt-4">Nhấn để xem định nghĩa</p>
            </div>
          ) : (
            // Back side
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Định nghĩa</h3>
              <p className="text-lg text-gray-700 mb-4">{back}</p>
              
              {example && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 italic">"{example}"</p>
                </div>
              )}
              
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-4">Bạn đã nhớ từ này chưa?</p>
                {showReview && (
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReview(1)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Chưa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReview(3)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Nhớ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReview(5)
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Rất tốt
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!isFlipped && (
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={handleFlip}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Lật thẻ
          </Button>
        </div>
      )}
    </div>
  )
}
