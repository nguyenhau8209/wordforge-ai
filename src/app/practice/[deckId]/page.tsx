"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Play, CheckCircle } from "lucide-react"
import Flashcard from "@/components/Flashcard"
import { toast } from "sonner"

interface FlashcardData {
  id: string
  front: string
  back: string
  pronunciation: string | null
  audioUrl: string | null
  imageUrl: string | null
  example: string | null
  difficulty: number
  deckId: string
  reviews: Array<{
    id: string
    quality: number
    interval: number
    repetitions: number
    easeFactor: number
    nextReview: string
  }>
}

interface PracticePageProps {
  params: {
    deckId: string
  }
}

export default function PracticePage({ params }: PracticePageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    correct: 0
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchFlashcards()
    }
  }, [status, router, params.deckId])

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`/api/reviews?deckId=${params.deckId}`)
      if (response.ok) {
        const data = await response.json()
        setFlashcards(data)
        setStats(prev => ({ ...prev, total: data.length }))
      } else {
        toast.error("Không thể tải flashcard")
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error)
      toast.error("Có lỗi xảy ra khi tải flashcard")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (quality: number) => {
    const currentFlashcard = flashcards[currentIndex]
    if (!currentFlashcard) return

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcardId: currentFlashcard.id,
          quality: quality
        }),
      })

      if (response.ok) {
        setStats(prev => ({
          ...prev,
          reviewed: prev.reviewed + 1,
          correct: prev.correct + (quality >= 3 ? 1 : 0)
        }))

        // Move to next card or complete
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          setCompleted(true)
        }
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật đánh giá")
      }
    } catch (error) {
      console.error("Error updating review:", error)
      toast.error("Có lỗi xảy ra khi cập nhật đánh giá")
    }
  }

  const resetPractice = () => {
    setCurrentIndex(0)
    setCompleted(false)
    setStats(prev => ({ ...prev, reviewed: 0, correct: 0 }))
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Luyện tập</h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có flashcard nào cần ôn tập</h3>
              <p className="text-gray-500 mb-4">Tất cả flashcard đã được ôn tập hoặc chưa có flashcard nào.</p>
              <Button onClick={() => router.push("/dashboard")}>
                Quay về Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (completed) {
    const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0
    
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Hoàn thành</h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Chúc mừng!</h2>
              <p className="text-lg text-gray-600 mb-8">Bạn đã hoàn thành buổi luyện tập</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-600">Tổng flashcard</div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.reviewed}</div>
                  <div className="text-sm text-green-600">Đã ôn tập</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
                  <div className="text-sm text-purple-600">Độ chính xác</div>
                </div>
              </div>
              
              <div className="space-x-4">
                <Button onClick={resetPractice}>
                  Luyện tập lại
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Quay về Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const currentFlashcard = flashcards[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Luyện tập</h1>
            </div>
            <div className="text-sm text-gray-500">
              {currentIndex + 1} / {flashcards.length}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Flashcard
          key={currentFlashcard.id}
          id={currentFlashcard.id}
          front={currentFlashcard.front}
          back={currentFlashcard.back}
          pronunciation={currentFlashcard.pronunciation}
          audioUrl={currentFlashcard.audioUrl}
          imageUrl={currentFlashcard.imageUrl}
          example={currentFlashcard.example}
          difficulty={currentFlashcard.difficulty}
          onReview={handleReview}
        />
      </main>
    </div>
  )
}
