"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Play, Pause, RotateCcw, Mic, MicOff, Volume2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface ListeningSpeakingProps {
  passage: string
  vocabulary: Array<{
    word: string
    type: string
    vietnamese_meaning: string
  }>
  language: string
  proficiency: string
  onComplete: () => void
}

export default function ListeningSpeaking({ passage, vocabulary, language, proficiency, onComplete }: ListeningSpeakingProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setHasRecorded(true)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success("Bắt đầu ghi âm...")
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast.error("Không thể truy cập microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      toast.success("Dừng ghi âm")
    }
  }

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setHasRecorded(false)
    setRecordingTime(0)
    setIsCompleted(false)
  }

  const completeLesson = () => {
    setIsCompleted(true)
    toast.success("Chúc mừng! Bạn đã hoàn thành bài học hôm nay!")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Luyện Nghe & Nói
        </h2>
        <p className="text-gray-600">
          Luyện nghe đoạn văn và thực hành nói để cải thiện phát âm
        </p>
      </div>

      {/* Listening Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Luyện Nghe
          </CardTitle>
          <CardDescription>
            Nghe đoạn văn để làm quen với cách phát âm và ngữ điệu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{passage}</p>
            </div>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handlePlayPause}
                disabled={!('speechSynthesis' in window)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? "Tạm dừng" : "Phát âm thanh"}
              </Button>
              <Button
                onClick={handleStop}
                variant="outline"
                disabled={!isPlaying}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Dừng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speaking Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Luyện Nói
          </CardTitle>
          <CardDescription>
            Ghi âm giọng nói của bạn khi đọc đoạn văn (Shadowing)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {isRecording ? formatTime(recordingTime) : "00:00"}
              </div>
              <p className="text-gray-600">
                {isRecording ? "Đang ghi âm..." : "Nhấn nút để bắt đầu ghi âm"}
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              {!hasRecorded ? (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${
                    isRecording 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  {isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                </Button>
              ) : (
                <div className="flex space-x-4">
                  <Button
                    onClick={playRecording}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Nghe lại
                  </Button>
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Ghi âm lại
                  </Button>
                </div>
              )}
            </div>

            {hasRecorded && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Đã ghi âm thành công!</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Bạn có thể nghe lại bản ghi âm hoặc ghi âm lại nếu cần
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Review */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Từ vựng đã học</CardTitle>
          <CardDescription>
            Ôn lại các từ vựng trong bài học hôm nay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vocabulary.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
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

      {/* Completion */}
      <div className="text-center">
        {isCompleted ? (
          <div className="space-y-4">
            <div className="text-6xl text-green-500 mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900">Chúc mừng!</h3>
            <p className="text-gray-600">
              Bạn đã hoàn thành bài học từ vựng hôm nay. Hãy tiếp tục học tập để cải thiện vốn từ vựng!
            </p>
            <Button
              onClick={onComplete}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              Quay về Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={completeLesson}
            disabled={!hasRecorded}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
          >
            Hoàn thành bài học
            <CheckCircle className="h-5 w-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
