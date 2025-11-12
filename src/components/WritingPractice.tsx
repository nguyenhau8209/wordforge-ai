"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowRight, CheckCircle, RotateCcw, PenTool, BookOpen, AlertCircle } from "lucide-react"
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

  // Local storage keys
  const draftStorageKey = `wfai:writing:draft:${topic}:${language}:${proficiency}`
  const historyStorageKey = `wfai:writing:history:${topic}:${language}:${proficiency}`

  // Undo/Redo history
  const historyStackRef = useRef<string[]>([])
  const historyIndexRef = useRef<number>(-1)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(draftStorageKey) : null
      if (saved) {
        setWriting(saved)
        historyStackRef.current = [saved]
        historyIndexRef.current = 0
      } else {
        historyStackRef.current = [""]
        historyIndexRef.current = 0
      }
    } catch {
      // ignore storage errors
    }
  }, [draftStorageKey])

  // Debounced auto-save on change
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(draftStorageKey, writing)
        }
      } catch {
        // ignore storage errors
      }
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [writing, draftStorageKey])

  // Track writing history for undo/redo (throttled push)
  const lastPushedRef = useRef<number>(0)
  useEffect(() => {
    const now = Date.now()
    const THROTTLE_MS = 700
    const stack = historyStackRef.current
    const idx = historyIndexRef.current
    if (stack[idx] === writing) return
    if (now - lastPushedRef.current < THROTTLE_MS) return
    // If we've undone, discard redo branch
    if (idx < stack.length - 1) {
      stack.splice(idx + 1)
    }
    stack.push(writing)
    // Cap history
    if (stack.length > 100) stack.shift()
    historyIndexRef.current = stack.length - 1
    lastPushedRef.current = now
  }, [writing])

  const handleUndo = () => {
    const idx = historyIndexRef.current
    const stack = historyStackRef.current
    if (idx > 0) {
      historyIndexRef.current = idx - 1
      setWriting(stack[historyIndexRef.current] ?? "")
    }
  }

  const handleRedo = () => {
    const idx = historyIndexRef.current
    const stack = historyStackRef.current
    if (idx < stack.length - 1) {
      historyIndexRef.current = idx + 1
      setWriting(stack[historyIndexRef.current] ?? "")
    }
  }

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

    // Validate word count if prompt exists
    if (writingPrompt) {
      const min = writingPrompt.word_count_min ?? 0
      const max = writingPrompt.word_count_max ?? Number.MAX_SAFE_INTEGER
      if (wordCount < min) {
        toast.error(`Bài viết quá ngắn. Yêu cầu tối thiểu ${min} từ.`)
        return
      }
      if (wordCount > max) {
        toast.error(`Bài viết quá dài. Tối đa cho phép ${max} từ.`)
        return
      }
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

         // Save to history (cap 5 entries)
         try {
           const existing = typeof window !== "undefined" ? window.localStorage.getItem(historyStorageKey) : null
           const list: Array<{ ts: number; writing: string; corrected: string; overall: number }> = existing ? JSON.parse(existing) : []
           const entry = {
             ts: Date.now(),
             writing,
             corrected: data.analysis.corrected_version,
             overall: data.analysis.overall_score ?? 0,
           }
           const next = [entry, ...list].slice(0, 5)
           if (typeof window !== "undefined") {
             window.localStorage.setItem(historyStorageKey, JSON.stringify(next))
           }
         } catch {
           // ignore storage errors
         }
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

  const wordCount = useMemo(() => {
    return writing.trim().split(/\s+/).filter(word => word.length > 0).length
  }, [writing])

  // History list and compare
  const [historyList, setHistoryList] = useState<Array<{ ts: number; writing: string; corrected: string; overall: number }>>([])
  const [selectedHistoryTs, setSelectedHistoryTs] = useState<number | "">("")
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    try {
      const existing = typeof window !== "undefined" ? window.localStorage.getItem(historyStorageKey) : null
      const list = existing ? JSON.parse(existing) : []
      setHistoryList(Array.isArray(list) ? list : [])
    } catch {
      setHistoryList([])
    }
  }, [historyStorageKey, showAnalysis])

  const loadHistory = () => {
    if (!selectedHistoryTs) return
    const item = historyList.find(h => h.ts === selectedHistoryTs)
    if (!item) {
      toast.error("Không tìm thấy mục lịch sử đã chọn")
      return
    }
    setWriting(item.writing)
    setCorrectedWriting(item.corrected)
    setShowAnalysis(true)
    toast.success("Đã tải bài viết từ lịch sử")
  }

  // Download helpers
  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadJson = (filename: string, obj: unknown) => {
    downloadText(filename, JSON.stringify(obj, null, 2))
  }

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
                      onClick={handleUndo}
                      variant="outline"
                      size="sm"
                      aria-label="Hoàn tác"
                    >
                      ⎌
                    </Button>
                    <Button
                      onClick={handleRedo}
                      variant="outline"
                      size="sm"
                      aria-label="Làm lại thao tác"
                    >
                      ↻
                    </Button>
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

                {/* History controls */}
                <div className="flex items-center gap-2 mt-3">
                  <Label htmlFor="history" className="text-sm text-gray-600">Lịch sử:</Label>
                  <select
                    id="history"
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedHistoryTs}
                    onChange={(e) => setSelectedHistoryTs(e.target.value ? Number(e.target.value) : "")}
                    aria-label="Chọn một mục lịch sử bài viết"
                  >
                    <option value="">Chọn mục lịch sử...</option>
                    {historyList.map(h => (
                      <option key={h.ts} value={h.ts}>
                        {new Date(h.ts).toLocaleString()} - Điểm: {h.overall}/10
                      </option>
                    ))}
                  </select>
                  <Button onClick={loadHistory} variant="outline" size="sm" disabled={!selectedHistoryTs}>
                    Tải lịch sử
                  </Button>
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

              {/* Export and Compare */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => downloadText(`writing_${topic}_${Date.now()}.txt`, writing)}
                  aria-label="Tải bài viết gốc"
                >
                  Tải bài gốc (.txt)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadText(`corrected_${topic}_${Date.now()}.txt`, correctedWriting)}
                  aria-label="Tải bài viết đã sửa"
                >
                  Tải bài đã sửa (.txt)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => analysis && downloadJson(`analysis_${topic}_${Date.now()}.json`, analysis)}
                  aria-label="Tải phân tích"
                >
                  Tải phân tích (.json)
                </Button>
                <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showCompare}
                    onChange={(e) => setShowCompare(e.target.checked)}
                    aria-label="Bật so sánh phiên bản"
                  />
                  So sánh phiên bản
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Compare original vs corrected */}
          {showCompare && (
            <Card>
              <CardHeader>
                <CardTitle>So sánh phiên bản</CardTitle>
                <CardDescription>Xem song song bài gốc và bài đã sửa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Bài gốc</h4>
                    <div className="bg-white border rounded p-3 min-h-32">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{writing}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Bài đã sửa</h4>
                    <div className="bg-white border rounded p-3 min-h-32">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{correctedWriting}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
