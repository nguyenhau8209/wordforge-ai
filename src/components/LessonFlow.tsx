"use client"

import { useState } from "react"
import VocabularyList from "./VocabularyList"
import ReadingPassage from "./ReadingPassage"
import ExerciseSection from "./ExerciseSection"
import ListeningSpeaking from "./ListeningSpeaking"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
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
  const [exercises, setExercises] = useState<any>(null)

  const handleVocabularyNext = (generatedPassage: string) => {
    setPassage(generatedPassage)
    setCurrentStep(2)
  }

  const handleReadingNext = (generatedExercises: any) => {
    setExercises(generatedExercises)
    setCurrentStep(3)
  }

  const handleExerciseNext = () => {
    setCurrentStep(4)
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
              Bước {currentStep}/4
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>1. Từ vựng</span>
            <span>2. Đọc hiểu</span>
            <span>3. Luyện tập</span>
            <span>4. Nghe & Nói</span>
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

        {currentStep === 3 && exercises && (
          <ExerciseSection
            exercises={exercises}
            vocabulary={lessonData.vocabulary}
            language={lessonData.language}
            proficiency={lessonData.proficiency}
            onNext={handleExerciseNext}
          />
        )}

        {currentStep === 4 && (
          <ListeningSpeaking
            passage={passage}
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
