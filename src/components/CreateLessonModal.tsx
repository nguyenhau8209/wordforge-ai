"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateLessonModalProps {
  onLessonCreated: (lessonData: any) => void
}

export default function CreateLessonModal({ onLessonCreated }: CreateLessonModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [wordCount, setWordCount] = useState(20)
  const [language, setLanguage] = useState("english")
  const [customLanguage, setCustomLanguage] = useState("")
  const [proficiency, setProficiency] = useState("A2")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateLesson = async () => {
    if (!topic.trim()) {
      toast.error("Vui lòng nhập chủ đề học từ vựng")
      return
    }

    if (language === "custom" && !customLanguage.trim()) {
      toast.error("Vui lòng nhập tên ngôn ngữ tùy chỉnh")
      return
    }

    setIsLoading(true)
    try {
      const selectedLanguage = language === "custom" ? customLanguage.trim() : language
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_vocabulary",
          topic: topic.trim(),
          wordCount: wordCount,
          language: selectedLanguage,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const lessonData = {
          topic: topic.trim(),
          wordCount,
          language: selectedLanguage,
          proficiency: proficiency,
          vocabulary: data.vocabulary,
          step: 1, // Bước 1: Hiển thị từ vựng
        }
        
        onLessonCreated(lessonData)
        setIsOpen(false)
        setTopic("")
        setWordCount(20)
        setLanguage("english")
        setCustomLanguage("")
        setProficiency("A2")
        toast.success("Tạo bài học thành công!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Có lỗi xảy ra khi tạo bài học")
      }
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast.error("Có lỗi xảy ra khi tạo bài học")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
          <BookOpen className="h-4 w-4 mr-2" />
          Tạo Bài Học Hôm Nay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            Tạo Bài Học Từ Vựng Hôm Nay
          </DialogTitle>
          <DialogDescription>
            Hôm nay bạn muốn học về từ vựng về chủ đề gì?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Chủ đề học từ vựng</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Công nghệ xanh, Du lịch khám phá, Thuyết trình hiệu quả..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wordCount">Số lượng từ vựng</Label>
            <select
              id="wordCount"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
            >
              <option value={10}>10 từ</option>
              <option value={15}>15 từ</option>
              <option value={20}>20 từ</option>
              <option value={25}>25 từ</option>
              <option value={30}>30 từ</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="language">Ngôn ngữ học</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
            >
              <option value="english">Tiếng Anh</option>
              <option value="german">Tiếng Đức</option>
              <option value="chinese">Tiếng Trung</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            {language === "custom" && (
              <Input
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="Nhập tên ngôn ngữ (ví dụ: Tiếng Pháp, Tiếng Nhật...)"
                className="mt-2"
              />
            )}
          </div>

          <div>
            <Label htmlFor="proficiency">Trình độ</Label>
            <select
              id="proficiency"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
            >
              <option value="A1">A1 - Cơ bản</option>
              <option value="A2">A2 - Sơ cấp</option>
              <option value="B1">B1 - Trung cấp</option>
              <option value="B2">B2 - Trung cấp cao</option>
              <option value="C1">C1 - Cao cấp</option>
              <option value="C2">C2 - Thành thạo</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateLesson}
              disabled={isLoading || !topic.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Bài Học"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
