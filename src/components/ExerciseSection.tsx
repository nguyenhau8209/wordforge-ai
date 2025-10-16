"use client"

import { useState } from "react"
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
  exercises: ExerciseData
  vocabulary: Array<{
    word: string
    type: string
    vietnamese_meaning: string
  }>
  language: string
  proficiency: string
  onNext: () => void
}

export default function ExerciseSection({ exercises, vocabulary, language, proficiency, onNext }: ExerciseSectionProps) {
  const [currentExercise, setCurrentExercise] = useState(0)
  const [fillAnswers, setFillAnswers] = useState<{ [key: number]: string }>({})
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: number]: string }>({})
  const [mcAnswers, setMcAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [scores, setScores] = useState({ fill: 0, matching: 0, mc: 0 })

  const exerciseTypes = [
    { name: "Điền từ vào chỗ trống", count: exercises.fill_in_the_blanks.length },
    { name: "Nối từ với nghĩa", count: exercises.matching.length },
    { name: "Trắc nghiệm", count: exercises.multiple_choice.length }
  ]

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
    let fillScore = 0
    let matchingScore = 0
    let mcScore = 0

    // Check fill in the blanks
    exercises.fill_in_the_blanks.forEach((exercise, index) => {
      if (fillAnswers[index]?.toLowerCase().trim() === exercise.answer.toLowerCase().trim()) {
        fillScore++
      }
    })

    // Check matching
    exercises.matching.forEach((exercise, index) => {
      if (matchingAnswers[index] === exercise.meaning) {
        matchingScore++
      }
    })

    // Check multiple choice
    exercises.multiple_choice.forEach((exercise, index) => {
      if (mcAnswers[index] === exercise.answer) {
        mcScore++
      }
    })

    setScores({ fill: fillScore, matching: matchingScore, mc: mcScore })
    setShowResults(true)

    const totalScore = fillScore + matchingScore + mcScore
    const totalQuestions = exercises.fill_in_the_blanks.length + exercises.matching.length + exercises.multiple_choice.length
    
    if (totalScore === totalQuestions) {
      toast.success("Tuyệt vời! Bạn đã trả lời đúng tất cả câu hỏi!")
    } else {
      toast.info(`Bạn đã trả lời đúng ${totalScore}/${totalQuestions} câu hỏi`)
    }
  }

  const resetAnswers = () => {
    setFillAnswers({})
    setMatchingAnswers({})
    setMcAnswers({})
    setShowResults(false)
    setScores({ fill: 0, matching: 0, mc: 0 })
  }

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const renderFillInTheBlanks = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Điền từ vào chỗ trống</h3>
      {exercises.fill_in_the_blanks.map((exercise, index) => (
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

  const renderMatching = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Nối từ với nghĩa</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.matching.map((exercise, index) => (
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
                  {exercises.matching.map((item, itemIndex) => (
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

  const renderMultipleChoice = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Trắc nghiệm</h3>
      {exercises.multiple_choice.map((exercise, index) => (
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
                <div className="text-sm text-gray-600">Điền từ ({exercises.fill_in_the_blanks.length})</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{scores.matching}</div>
                <div className="text-sm text-gray-600">Nối từ ({exercises.matching.length})</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{scores.mc}</div>
                <div className="text-sm text-gray-600">Trắc nghiệm ({exercises.multiple_choice.length})</div>
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
              onClick={onNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
            >
              Tiếp tục sang Luyện Nghe & Nói
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
