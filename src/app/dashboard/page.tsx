"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus, Play, BarChart3, Clock } from "lucide-react"
import { toast } from "sonner"
import CreateLessonModal from "@/components/CreateLessonModal"
import LessonFlow from "@/components/LessonFlow"
import type { SaveVocabularyRequest, SaveVocabularyResponse } from "@/types/lesson-vocabulary"

interface Deck {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    flashcards: number
  }
}

interface Flashcard {
  id: string
  front: string
  back: string
  pronunciation: string | null
  audioUrl: string | null
  imageUrl: string | null
  example: string | null
  difficulty: number
  deckId: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [newDeckName, setNewDeckName] = useState("")
  const [newDeckDescription, setNewDeckDescription] = useState("")
  const [isCreatingDeck, setIsCreatingDeck] = useState(false)
  const [newWord, setNewWord] = useState("")
  const [selectedDeckId, setSelectedDeckId] = useState("")
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false)
  const [currentLesson, setCurrentLesson] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchDecks()
    }
  }, [status, router])

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/decks")
      if (response.ok) {
        const data = await response.json()
        setDecks(data)
      }
    } catch (error) {
      console.error("Error fetching decks:", error)
    } finally {
      setLoading(false)
    }
  }

  const createDeck = async () => {
    if (!newDeckName.trim()) return

    setIsCreatingDeck(true)
    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDeckName,
          description: newDeckDescription,
        }),
      })

      if (response.ok) {
        const newDeck = await response.json()
        setDecks([...decks, newDeck])
        setNewDeckName("")
        setNewDeckDescription("")
        toast.success("Tạo bộ từ vựng thành công!")
      } else {
        toast.error("Có lỗi xảy ra khi tạo bộ từ vựng")
      }
    } catch (error) {
      console.error("Error creating deck:", error)
      toast.error("Có lỗi xảy ra khi tạo bộ từ vựng")
    } finally {
      setIsCreatingDeck(false)
    }
  }

  const createFlashcard = async () => {
    if (!newWord.trim() || !selectedDeckId) return

    setIsCreatingFlashcard(true)
    try {
      const response = await fetch("/api/flashcards/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: newWord,
          deckId: selectedDeckId,
        }),
      })

      if (response.ok) {
        const newFlashcard = await response.json()
        setNewWord("")
        setSelectedDeckId("")
        toast.success("Tạo flashcard thành công!")
        fetchDecks() // Refresh to update counts
      } else {
        toast.error("Có lỗi xảy ra khi tạo flashcard")
      }
    } catch (error) {
      console.error("Error creating flashcard:", error)
      toast.error("Có lỗi xảy ra khi tạo flashcard")
    } finally {
      setIsCreatingFlashcard(false)
    }
  }

  const handleLessonCreated = (lessonData: any) => {
    setCurrentLesson(lessonData)
  }

  const handleLessonComplete = async (lessonData: SaveVocabularyRequest) => {
    try {
      // Call API endpoint to save vocabulary
      const response = await fetch('/api/lessons/save-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: lessonData.topic,
          language: lessonData.language,
          proficiency: lessonData.proficiency,
          vocabulary: lessonData.vocabulary
        })
      })

      if (response.ok) {
        const result: SaveVocabularyResponse = await response.json()
        
        // Display success notification with flashcard counts
        const message = result.skipped > 0
          ? `Đã lưu ${result.created} flashcard mới! (Bỏ qua ${result.skipped} từ trùng lặp)`
          : `Đã lưu ${result.created} flashcard mới!`
        
        toast.success(message)
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({}))
        console.error('Error saving vocabulary:', errorData)
        toast.error('Không thể lưu flashcard. Vui lòng thử lại.')
      }
    } catch (error) {
      // Catch network or other errors
      console.error('Error saving vocabulary:', error)
      toast.error('Có lỗi xảy ra khi lưu flashcard.')
    } finally {
      // Always clear current lesson and refresh deck list
      setCurrentLesson(null)
      fetchDecks() // Refresh deck list to show new flashcards
    }
  }

  if (currentLesson) {
    return <LessonFlow lessonData={currentLesson} onComplete={handleLessonComplete} />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">WordForge AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Xin chào, {session?.user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Quản lý bộ từ vựng và tạo flashcard mới</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng bộ từ vựng</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{decks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng flashcard</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {decks.reduce((sum, deck) => sum + deck._count.flashcards, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cần ôn tập</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã học hôm nay</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <CreateLessonModal onLessonCreated={handleLessonCreated} />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo bộ từ vựng mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo bộ từ vựng mới</DialogTitle>
                <DialogDescription>
                  Tạo một bộ từ vựng mới để tổ chức các flashcard của bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deck-name">Tên bộ từ vựng</Label>
                  <Input
                    id="deck-name"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Ví dụ: Từ vựng TOEIC"
                  />
                </div>
                <div>
                  <Label htmlFor="deck-description">Mô tả (tùy chọn)</Label>
                  <Input
                    id="deck-description"
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    placeholder="Mô tả ngắn về bộ từ vựng"
                  />
                </div>
                <Button onClick={createDeck} disabled={isCreatingDeck || !newDeckName.trim()}>
                  {isCreatingDeck ? "Đang tạo..." : "Tạo bộ từ vựng"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Tạo flashcard mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo flashcard mới</DialogTitle>
                <DialogDescription>
                  Nhập từ vựng và chọn bộ từ vựng để tạo flashcard tự động với AI.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="word">Từ vựng</Label>
                  <Input
                    id="word"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Nhập từ vựng tiếng Anh"
                  />
                </div>
                <div>
                  <Label htmlFor="deck-select">Chọn bộ từ vựng</Label>
                  <select
                    id="deck-select"
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Chọn bộ từ vựng</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={createFlashcard} 
                  disabled={isCreatingFlashcard || !newWord.trim() || !selectedDeckId}
                >
                  {isCreatingFlashcard ? "Đang tạo..." : "Tạo flashcard"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {deck.name}
                  <Link href={`/practice/${deck.id}`}>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>{deck.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{deck._count.flashcards} flashcard</span>
                  <span>{new Date(deck.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {decks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bộ từ vựng nào</h3>
            <p className="text-gray-500 mb-4">Tạo bộ từ vựng đầu tiên để bắt đầu học!</p>
          </div>
        )}
      </main>
    </div>
  )
}
