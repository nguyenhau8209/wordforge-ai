"use client"

import { useState } from "react"
import VocabularyList from "./VocabularyList"
import ReadingPassage from "./ReadingPassage"
import WritingPractice from "./WritingPractice"
import ExerciseSection from "./ExerciseSection"
import ListeningSpeaking from "./ListeningSpeaking"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
}

interface ExerciseData {
  fill_in_the_blanks: Array<{
    question: string
    answer: string
    translation?: string
    options?: string[]
  }>
  matching: Array<{
    word: string
    meaning: string
    translation?: string
  }>
  multiple_choice: Array<{
    question: string
    options: string[]
    answer: string
    translation?: string
  }>
}

interface LessonData {
  topic: string
  wordCount: number
  language: string
  proficiency: string
  vocabulary: VocabularyItem[]
  step: number
}

export default function LessonFlow({ lessonData, onComplete }: { lessonData: LessonData, onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(lessonData.step)
  const [passage, setPassage] = useState("")
  const [correctedWriting, setCorrectedWriting] = useState("")
  const [exercises, setExercises] = useState<ExerciseData | null>(null)

  const handleVocabularyNext = (generatedPassage: string) => {
    setPassage(generatedPassage)
    setCurrentStep(2)
  }

  const handleReadingNext = () => {
    setCurrentStep(3)
  }

  const handleWritingNext = (correctedWriting: string) => {
    setCorrectedWriting(correctedWriting)
    setCurrentStep(4)
  }

  const handleExerciseNext = () => {
    setCurrentStep(5)
  }

  const handleLessonComplete = () => {
    onComplete()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Bài Học: {lessonData.topic}
            </h1>
            <span className="text-sm text-gray-500">
              Bước {currentStep}/5
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>1. Từ vựng</span>
            <span>2. Đọc hiểu</span>
            <span>3. Viết</span>
            <span>4. Luyện tập</span>
            <span>5. Nghe & Nói</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="py-8">
        {currentStep === 1 && (
          <VocabularyList
            vocabulary={lessonData.vocabulary}
            topic={lessonData.topic}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            onNext={handleVocabularyNext}
          />
        )}

        {currentStep === 2 && (
          <ReadingPassage
            passage={passage}
            vocabulary={lessonData.vocabulary}
            topic={lessonData.topic}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            onNext={handleReadingNext}
          />
        )}

        {currentStep === 3 && (
          <WritingPractice
            topic={lessonData.topic}
            vocabulary={lessonData.vocabulary}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            onNext={handleWritingNext}
          />
        )}

        {currentStep === 4 && (
          <ExerciseSection
            exercises={exercises}
            vocabulary={lessonData.vocabulary}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            passage={passage}
            topic={lessonData.topic}
            onNext={handleExerciseNext}
          />
        )}

        {currentStep === 5 && (
          <ListeningSpeaking
            passage={correctedWriting || passage}
            vocabulary={lessonData.vocabulary}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            onComplete={handleLessonComplete}
          />
        )}
      </div>
    </div>
  )
}
