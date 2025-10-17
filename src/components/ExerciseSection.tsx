"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle, XCircle, RotateCcw, Volume2 } from "lucide-react"
import { toast } from "sonner"

interface ExerciseData {
  fill_in_the_blanks: Array<{
    question: string
    answer: string
    options?: string[]
  }>
  matching: Array<{
    word: string
    meaning: string
  }>
  multiple_choice: Array<{
    question: string
    options: string[]
    answer: string
  }>
}

interface ExerciseSectionProps {
  exercises: ExerciseData | null
  vocabulary: Array<{
    word: string
    type: string
    vietnamese_meaning: string
  }>
  language: string
  proficiency: string
  passage: string
  topic?: string
  onNext: () => void
}

export default function ExerciseSection({ exercises, vocabulary, language, proficiency, passage, topic, onNext }: ExerciseSectionProps) {
  const [currentExercise, setCurrentExercise] = useState(0)
  const [fillAnswers, setFillAnswers] = useState<{ [key: number]: string }>({})
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: number]: string }>({})
  const [mcAnswers, setMcAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [scores, setScores] = useState({ fill: 0, matching: 0, mc: 0 })
  const [generatedExercises, setGeneratedExercises] = useState<ExerciseData | null>(exercises)
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [completedTabs, setCompletedTabs] = useState<Set<number>>(new Set())

  // Generate exercises when component mounts if not provided
  useEffect(() => {
    if (!generatedExercises) {
      console.log("Generating exercises with passage:", passage)
      generateExercises()
    }
  }, [])

  const generateExercises = async () => {
    console.log("Starting exercise generation with:", { passage, vocabulary, language, proficiency })
    
    let passageToUse = passage

    // If no passage is available, generate one first
    if (!passage || passage.trim() === "") {
      console.log("No passage available, generating one first...")
      try {
        const passageResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate_passage",
            topic: topic || "general topic",
            vocabulary: vocabulary,
            language: language,
            proficiency: proficiency,
          }),
        })

        if (passageResponse.ok) {
          const passageData = await passageResponse.json()
          passageToUse = passageData.passage
          console.log("Generated passage for exercises:", passageToUse)
        } else {
          console.error("Failed to generate passage for exercises")
          toast.error("Không thể tạo đoạn văn cho bài luyện tập. Vui lòng quay lại bước trước.")
          return
        }
      } catch (error) {
        console.error("Error generating passage for exercises:", error)
        toast.error("Không thể tạo đoạn văn cho bài luyện tập. Vui lòng quay lại bước trước.")
        return
      }
    }

    setIsGeneratingExercises(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_exercises",
          passage: passageToUse,
          vocabulary: vocabulary,
          language: language,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Generated exercises:", data.exercises)
        setGeneratedExercises(data.exercises)
      } else {
        const error = await response.json()
        console.error("API error:", error)
        toast.error(error.error || "Có lỗi xảy ra khi tạo bài luyện tập")
      }
    } catch (error) {
      console.error("Error generating exercises:", error)
      toast.error("Có lỗi xảy ra khi tạo bài luyện tập")
    } finally {
      setIsGeneratingExercises(false)
    }
  }

  const exerciseTypes = generatedExercises ? [
    { name: "Điền từ vào chỗ trống", count: generatedExercises.fill_in_the_blanks.length },
    { name: "Nối từ với nghĩa", count: generatedExercises.matching.length },
    { name: "Trắc nghiệm", count: generatedExercises.multiple_choice.length }
  ] : []

  const handleFillAnswer = (index: number, answer: string) => {
    setFillAnswers(prev => ({ ...prev, [index]: answer }))
  }

  const handleMatchingAnswer = (index: number, answer: string) => {
    setMatchingAnswers(prev => ({ ...prev, [index]: answer }))
  }

  const handleMcAnswer = (index: number, answer: string) => {
    setMcAnswers(prev => ({ ...prev, [index]: answer }))
  }

  const checkAnswers = () => {
    if (!generatedExercises) return

    let fillScore = 0
    let matchingScore = 0
    let mcScore = 0

    // Check fill in the blanks
    generatedExercises.fill_in_the_blanks.forEach((exercise, index) => {
      if (fillAnswers[index]?.toLowerCase().trim() === exercise.answer.toLowerCase().trim()) {
        fillScore++
      }
    })

    // Check matching
    generatedExercises.matching.forEach((exercise, index) => {
      if (matchingAnswers[index] === exercise.meaning) {
        matchingScore++
      }
    })

    // Check multiple choice
    generatedExercises.multiple_choice.forEach((exercise, index) => {
      if (mcAnswers[index] === exercise.answer) {
        mcScore++
      }
    })

    setScores({ fill: fillScore, matching: matchingScore, mc: mcScore })
    setShowResults(true)

    // Mark current tab as completed
    setCompletedTabs(prev => new Set([...prev, currentExercise]))

    const totalScore = fillScore + matchingScore + mcScore
    const totalQuestions = generatedExercises.fill_in_the_blanks.length + generatedExercises.matching.length + generatedExercises.multiple_choice.length
    
    if (totalScore === totalQuestions) {
      toast.success("Tuyệt vời! Bạn đã trả lời đúng tất cả câu hỏi!")
    } else {
      toast.info(`Bạn đã trả lời đúng ${totalScore}/${totalQuestions} câu hỏi`)
    }

    // Auto-navigate to next tab if not the last one
    if (currentExercise < exerciseTypes.length - 1) {
      setTimeout(() => {
        setCurrentExercise(currentExercise + 1)
        setShowResults(false)
      }, 2000)
    }
  }

  const resetAnswers = () => {
    setFillAnswers({})
    setMatchingAnswers({})
    setMcAnswers({})
    setShowResults(false)
    setScores({ fill: 0, matching: 0, mc: 0 })
    setCompletedTabs(new Set())
  }

  const handleNext = () => {
    // Check if all tabs are completed
    const allTabsCompleted = completedTabs.size === exerciseTypes.length
    if (allTabsCompleted) {
      setShowConfirmation(true)
    } else {
      toast.warning("Vui lòng hoàn thành tất cả các bài tập trước khi tiếp tục")
    }
  }

  const confirmNext = () => {
    setShowConfirmation(false)
    onNext()
  }

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const renderFillInTheBlanks = () => {
    if (!generatedExercises) return null
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Điền từ vào chỗ trống</h3>
        {generatedExercises.fill_in_the_blanks.map((exercise, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                {exercise.question.split('___').map((part, partIndex) => (
                  <span key={partIndex}>
                    {part}
                    {partIndex < exercise.question.split('___').length - 1 && (
                      <Input
                        value={fillAnswers[index] || ''}
                        onChange={(e) => handleFillAnswer(index, e.target.value)}
                        className="inline-block w-32 mx-2"
                        placeholder="Điền từ"
                        disabled={showResults}
                      />
                    )}
                  </span>
                ))}
              </p>
              {showResults && (
                <div className="flex items-center space-x-2">
                  {fillAnswers[index]?.toLowerCase().trim() === exercise.answer.toLowerCase().trim() ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    Đáp án đúng: <strong>{exercise.answer}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderMatching = () => {
    if (!generatedExercises) return null
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Nối từ với nghĩa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generatedExercises.matching.map((exercise, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exercise.word}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakWord(exercise.word)}
                      className="p-1"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    value={matchingAnswers[index] || ''}
                    onChange={(e) => handleMatchingAnswer(index, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={showResults}
                  >
                    <option value="">Chọn nghĩa</option>
                    {generatedExercises.matching.map((item, itemIndex) => (
                      <option key={itemIndex} value={item.meaning}>
                        {item.meaning}
                      </option>
                    ))}
                  </select>
                  {showResults && (
                    <div className="flex items-center space-x-2">
                      {matchingAnswers[index] === exercise.meaning ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        Đáp án đúng: <strong>{exercise.meaning}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderMultipleChoice = () => {
    if (!generatedExercises) return null
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Trắc nghiệm</h3>
        {generatedExercises.multiple_choice.map((exercise, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700 font-medium">{exercise.question}</p>
              <div className="space-y-2">
                {exercise.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`mc-${index}`}
                      value={option}
                      checked={mcAnswers[index] === option}
                      onChange={(e) => handleMcAnswer(index, e.target.value)}
                      disabled={showResults}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              {showResults && (
                <div className="flex items-center space-x-2">
                  {mcAnswers[index] === exercise.answer ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    Đáp án đúng: <strong>{exercise.answer}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
  }

  if (isGeneratingExercises) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang tạo bài luyện tập...</h2>
          <p className="text-gray-600 mb-4">Vui lòng chờ trong giây lát</p>
          {(!passage || passage.trim() === "") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Đang tạo đoạn văn mới cho bài luyện tập...
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!generatedExercises && !isGeneratingExercises) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải bài luyện tập</h2>
          <p className="text-gray-600 mb-4">
            {!passage || passage.trim() === "" 
              ? "Không có đoạn văn để tạo bài luyện tập. Vui lòng quay lại bước đọc hiểu trước."
              : "Có lỗi xảy ra khi tạo bài luyện tập. Vui lòng thử lại."
            }
          </p>
          {(!passage || passage.trim() === "") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Gợi ý:</strong> Hãy hoàn thành bước "Đọc hiểu" trước để có đoạn văn cho bài luyện tập.
              </p>
            </div>
          )}
          <div className="space-x-4">
            <Button
              onClick={generateExercises}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Thử lại
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Tải lại trang
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Bài Luyện Tập
        </h2>
        <p className="text-gray-600">
          Hoàn thành các bài tập để củng cố kiến thức từ vựng
        </p>
      </div>

      {/* Exercise Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {exerciseTypes.map((type, index) => (
            <Button
              key={index}
              variant={currentExercise === index ? "default" : "outline"}
              onClick={() => setCurrentExercise(index)}
              className="px-4 py-2"
            >
              {type.name} ({type.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise Content */}
      <div className="mb-8">
        {currentExercise === 0 && renderFillInTheBlanks()}
        {currentExercise === 1 && renderMatching()}
        {currentExercise === 2 && renderMultipleChoice()}
      </div>

      {/* Results Summary */}
      {showResults && (
        <Card className="mb-8 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-center">Kết Quả Bài Luyện Tập</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{scores.fill}</div>
                <div className="text-sm text-gray-600">Điền từ ({generatedExercises.fill_in_the_blanks.length})</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{scores.matching}</div>
                <div className="text-sm text-gray-600">Nối từ ({generatedExercises.matching.length})</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{scores.mc}</div>
                <div className="text-sm text-gray-600">Trắc nghiệm ({generatedExercises.multiple_choice.length})</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!showResults ? (
          <Button
            onClick={checkAnswers}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            Kiểm Tra Kết Quả
          </Button>
        ) : (
          <>
            <Button
              onClick={resetAnswers}
              variant="outline"
              className="px-6 py-3"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm Lại
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
            >
              Tiếp tục sang Luyện Nghe & Nói
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận hoàn thành
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn đã hoàn thành tất cả các bài tập. Bạn có chắc chắn muốn tiếp tục sang phần Luyện Nghe & Nói không?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmNext}
                className="bg-green-600 hover:bg-green-700"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
