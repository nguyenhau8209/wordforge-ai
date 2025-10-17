"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle, XCircle, RotateCcw, PenTool, BookOpen, Star, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
  english_definition?: string
}

interface WritingPrompt {
  prompt: string
  requirements: string
  word_count_min: number
  word_count_max: number
  structure_hints: string
}

interface WritingAnalysis {
  vocabulary_usage: {
    used_words: string[]
    unused_words: string[]
    usage_count: number
    total_words: number
    score: number
  }
  grammar_analysis: {
    errors: Array<{
      sentence: string
      error: string
      correction: string
      explanation: string
    }>
    score: number
  }
  vocabulary_improvements: Array<{
    original: string
    suggestion: string
    reason: string
  }>
  structure_feedback: {
    strengths: string[]
    improvements: string[]
    score: number
  }
  content_feedback: {
    coherence: string
    completeness: string
    score: number
  }
  overall_score: number
  corrected_version: string
  encouragement: string
}

interface WritingPracticeProps {
  topic: string
  vocabulary: VocabularyItem[]
  language: string
  proficiency: string
  onNext: (correctedWriting: string) => void
}

export default function WritingPractice({ topic, vocabulary, language, proficiency, onNext }: WritingPracticeProps) {
  const [writingPrompt, setWritingPrompt] = useState<WritingPrompt | null>(null)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [writing, setWriting] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [correctedWriting, setCorrectedWriting] = useState("")

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_writing_prompt",
          topic: topic,
          vocabulary: vocabulary,
          language: language,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWritingPrompt(data.writingPrompt)
      } else {
        const error = await response.json()
        toast.error(error.error || "Có lỗi xảy ra khi tạo đề bài viết")
      }
    } catch (error) {
      console.error("Error generating writing prompt:", error)
      toast.error("Có lỗi xảy ra khi tạo đề bài viết")
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const analyzeWriting = async () => {
    if (!writing.trim()) {
      toast.error("Vui lòng viết bài trước khi phân tích")
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "analyze_writing",
          writing: writing,
          vocabulary: vocabulary,
          language: language,
          proficiency: proficiency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        setCorrectedWriting(data.analysis.corrected_version)
        setShowAnalysis(true)
        toast.success("Phân tích hoàn thành!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Có lỗi xảy ra khi phân tích bài viết")
      }
    } catch (error) {
      console.error("Error analyzing writing:", error)
      toast.error("Có lỗi xảy ra khi phân tích bài viết")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetWriting = () => {
    setWriting("")
    setAnalysis(null)
    setShowAnalysis(false)
    setCorrectedWriting("")
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-100"
    if (score >= 6) return "bg-yellow-100"
    return "bg-red-100"
  }

  const wordCount = writing.trim().split(/\s+/).filter(word => word.length > 0).length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Luyện Viết
        </h2>
        <p className="text-gray-600">
          Viết bài để luyện tập sử dụng từ vựng đã học
        </p>
      </div>

      {/* Generate Writing Prompt */}
      {!writingPrompt && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="h-5 w-5 mr-2" />
              Tạo đề bài viết
            </CardTitle>
            <CardDescription>
              AI sẽ tạo một đề bài viết phù hợp với trình độ của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button
                onClick={generatePrompt}
                disabled={isGeneratingPrompt}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                {isGeneratingPrompt ? (
                  <>
                    <BookOpen className="h-5 w-5 mr-2 animate-pulse" />
                    Đang tạo đề bài...
                  </>
                ) : (
                  <>
                    <PenTool className="h-5 w-5 mr-2" />
                    Tạo đề bài viết
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Writing Prompt */}
      {writingPrompt && !showAnalysis && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Đề bài viết</CardTitle>
            <CardDescription>
              Hãy viết bài theo yêu cầu dưới đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800 font-medium mb-2">{writingPrompt.prompt}</p>
                <p className="text-sm text-gray-600 mb-2">{writingPrompt.requirements}</p>
                <p className="text-sm text-gray-500">
                  <strong>Gợi ý cấu trúc:</strong> {writingPrompt.structure_hints}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Độ dài:</strong> {writingPrompt.word_count_min}-{writingPrompt.word_count_max} từ
                </p>
              </div>

              <div>
                <Label htmlFor="writing">Bài viết của bạn</Label>
                <Textarea
                  id="writing"
                  value={writing}
                  onChange={(e) => setWriting(e.target.value)}
                  placeholder="Viết bài của bạn ở đây..."
                  className="mt-2 min-h-48"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Số từ: {wordCount} / {writingPrompt.word_count_min}-{writingPrompt.word_count_max}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={resetWriting}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Làm lại
                    </Button>
                    <Button
                      onClick={analyzeWriting}
                      disabled={!writing.trim() || isAnalyzing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-1 animate-pulse" />
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Phân tích bài viết
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {showAnalysis && analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Kết quả phân tích</span>
                <div className={`px-4 py-2 rounded-full text-2xl font-bold ${getScoreBgColor(analysis.overall_score)} ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}/10
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg">{analysis.encouragement}</p>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vocabulary Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sử dụng từ vựng</span>
                  <div className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreBgColor(analysis.vocabulary_usage.score)} ${getScoreColor(analysis.vocabulary_usage.score)}`}>
                    {analysis.vocabulary_usage.score}/10
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Đã sử dụng {analysis.vocabulary_usage.usage_count}/{analysis.vocabulary_usage.total_words} từ vựng
                  </p>
                  
                  {analysis.vocabulary_usage.used_words.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Từ đã sử dụng:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.vocabulary_usage.used_words.map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.vocabulary_usage.unused_words.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Từ chưa sử dụng:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.vocabulary_usage.unused_words.map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grammar Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ngữ pháp</span>
                  <div className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreBgColor(analysis.grammar_analysis.score)} ${getScoreColor(analysis.grammar_analysis.score)}`}>
                    {analysis.grammar_analysis.score}/10
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.grammar_analysis.errors.length > 0 ? (
                    analysis.grammar_analysis.errors.map((error, index) => (
                      <div key={index} className="border-l-4 border-red-200 pl-3">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Lỗi:</strong> {error.error}
                        </p>
                        <p className="text-sm text-gray-800 mb-1">
                          <strong>Sửa:</strong> {error.correction}
                        </p>
                        <p className="text-xs text-gray-500">{error.explanation}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Không có lỗi ngữ pháp!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Structure Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cấu trúc bài viết</span>
                  <div className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreBgColor(analysis.structure_feedback.score)} ${getScoreColor(analysis.structure_feedback.score)}`}>
                    {analysis.structure_feedback.score}/10
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.structure_feedback.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Điểm mạnh:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.structure_feedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.structure_feedback.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">Cần cải thiện:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.structure_feedback.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="h-3 w-3 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Nội dung</span>
                  <div className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreBgColor(analysis.content_feedback.score)} ${getScoreColor(analysis.content_feedback.score)}`}>
                    {analysis.content_feedback.score}/10
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Tính mạch lạc:</p>
                    <p className="text-sm text-gray-600">{analysis.content_feedback.coherence}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Tính đầy đủ:</p>
                    <p className="text-sm text-gray-600">{analysis.content_feedback.completeness}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Corrected Version */}
          <Card>
            <CardHeader>
              <CardTitle>Phiên bản đã sửa</CardTitle>
              <CardDescription>
                Đây là phiên bản đã được AI sửa lỗi và cải thiện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed">{correctedWriting}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={resetWriting}
              variant="outline"
              className="px-6 py-3"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Viết lại
            </Button>
            <Button
              onClick={() => onNext(correctedWriting)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
            >
              Tiếp tục sang Bài Luyện Tập
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
