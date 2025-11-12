"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowRight, Volume2, Play, Pause, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { getSpeechLanguageCode, SPEECH_CONFIG } from "@/lib/speech-utils"

interface VocabularyItem {
  word: string
  type: string
  vietnamese_meaning: string
}

interface ReadingPassageProps {
  passage: string
  vocabulary: VocabularyItem[]
  topic: string
  language: string
  proficiency: string
  onNext: () => void
}

/**
 * ReadingPassage Component
 * 
 * Displays a reading passage with highlighted vocabulary words.
 * Supports text-to-speech functionality and provides vocabulary list with pronunciation.
 * 
 * @param passage - The reading passage text
 * @param vocabulary - Array of vocabulary items to highlight
 * @param topic - Lesson topic
 * @param language - Target language (e.g., "english", "german")
 * @param proficiency - Language proficiency level (e.g., "A1", "B2")
 * @param onNext - Callback when user proceeds to next step
 */
export default function ReadingPassage({ passage, vocabulary, topic, language, proficiency, onNext }: ReadingPassageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Memoize highlighted passage as React elements to avoid XSS and improve performance
  const highlightedPassageElements = useMemo(() => {
    if (!passage || vocabulary.length === 0) {
      return <span>{passage}</span>
    }

    // Normalize markdown emphasis to avoid rendering raw ** ** and improve matching
    const normalizeMarkdown = (text: string): string => {
      return text
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        // Italic: *text* or _text_
        .replace(/(^|[^*])\*(?!\s)(.*?)(?<!\s)\*(?!\*)/g, '$1$2')
        .replace(/(^|[^_])_(?!\s)(.*?)(?<!\s)_(?!_)/g, '$1$2')
        // Inline code: `text`
        .replace(/`([^`]*)`/g, '$1')
    }

    const normalizedPassage = normalizeMarkdown(passage)

    // Find all vocabulary word matches with their positions
    const matches: Array<{ word: string; meaning: string; index: number; length: number }> = []
    
    // Build a Unicode-safe word-boundary regex for each vocab item
    const buildWordRegex = (raw: string): RegExp => {
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Use Unicode letter/number boundaries to support accents/diacritics
      // (?<![\\p{L}\\p{N}]) word (?![\\p{L}\\p{N}])
      return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu')
    }

    vocabulary.forEach((item) => {
      const regex = buildWordRegex(item.word)
      let match
      regex.lastIndex = 0
      while ((match = regex.exec(normalizedPassage)) !== null) {
        matches.push({
          word: item.word,
          meaning: item.vietnamese_meaning,
          index: match.index,
          length: match[0].length,
        })
      }
    })

    // Sort matches by index to process in order
    matches.sort((a, b) => a.index - b.index)

    // Remove overlapping matches (keep the first one)
    const nonOverlappingMatches: typeof matches = []
    let lastEndIndex = 0
    
    matches.forEach((match) => {
      if (match.index >= lastEndIndex) {
        nonOverlappingMatches.push(match)
        lastEndIndex = match.index + match.length
      }
    })

    // If no matches found, return original passage
    if (nonOverlappingMatches.length === 0) {
      return <span>{normalizedPassage}</span>
    }

    // Build parts array from non-overlapping matches
    const parts: Array<{ text: string; isVocabulary: boolean; meaning?: string }> = []
    let lastIndex = 0

    nonOverlappingMatches.forEach((match) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          text: normalizedPassage.substring(lastIndex, match.index),
          isVocabulary: false,
        })
      }
      // Add vocabulary word
      parts.push({
        text: normalizedPassage.substring(match.index, match.index + match.length),
        isVocabulary: true,
        meaning: match.meaning,
      })
      lastIndex = match.index + match.length
    })

    // Add remaining text
    if (lastIndex < normalizedPassage.length) {
      parts.push({
        text: normalizedPassage.substring(lastIndex),
        isVocabulary: false,
      })
    }

    // Render parts with Tooltip for vocabulary words
    return (
      <>
        {parts.map((part, index) => {
          if (part.isVocabulary && part.meaning) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <mark className="bg-yellow-200 px-1 rounded font-semibold cursor-help">
                    {part.text}
                  </mark>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{part.meaning}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
          return <span key={index}>{part.text}</span>
        })}
      </>
    )
  }, [passage, vocabulary])

  // Cleanup SpeechSynthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
      utteranceRef.current = null
    }
  }, [])

  const handlePlayPause = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        speechSynthesis.cancel()
        setIsPlaying(false)
        utteranceRef.current = null
      } else {
        const utterance = new SpeechSynthesisUtterance(passage)
        utterance.lang = getSpeechLanguageCode(language)
        utterance.rate = SPEECH_CONFIG.DEFAULT_RATE
        utterance.pitch = SPEECH_CONFIG.DEFAULT_PITCH
        utterance.onend = () => {
          setIsPlaying(false)
          utteranceRef.current = null
        }
        utterance.onerror = () => {
          setIsPlaying(false)
          utteranceRef.current = null
        }
        
        utteranceRef.current = utterance
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
      utteranceRef.current = null
    }
  }

  const handleSpeakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = getSpeechLanguageCode(language)
      utterance.rate = SPEECH_CONFIG.WORD_RATE
      speechSynthesis.speak(utterance)
    }
  }

  const handleNext = () => {
    // Stop any ongoing speech before proceeding
    handleStop()
    onNext()
  }

  const isSpeechSupported = 'speechSynthesis' in window

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6" role="main" aria-label="Bài đọc ngữ cảnh">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bài Đọc Ngữ Cảnh: {topic}
          </h2>
          <p className="text-gray-600">
            Đọc đoạn văn dưới đây và chú ý các từ vựng được highlight
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Đoạn văn ngữ cảnh</span>
              <div className="flex space-x-2" role="group" aria-label="Điều khiển phát âm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={!isSpeechSupported}
                  aria-label={isPlaying ? "Tạm dừng phát âm" : "Phát âm đoạn văn"}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Phát</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  disabled={!isPlaying}
                  aria-label="Dừng phát âm"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Dừng</span>
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Các từ vựng đã học được highlight màu vàng. Di chuột vào từ để xem nghĩa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-lg max-w-none leading-relaxed"
              role="article"
              aria-label="Nội dung đoạn văn"
            >
              {highlightedPassageElements || <p className="text-gray-500">Không có nội dung để hiển thị.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Từ vựng trong bài đọc</CardTitle>
            <CardDescription>
              Danh sách các từ vựng xuất hiện trong đoạn văn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              role="list"
              aria-label="Danh sách từ vựng"
            >
              {vocabulary.map((item, index) => (
                <div 
                  key={`${item.word}-${index}`} 
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                  role="listitem"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpeakWord(item.word)}
                    disabled={!isSpeechSupported}
                    aria-label={`Phát âm từ ${item.word}`}
                    className="p-1"
                  >
                    <Volume2 className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Phát âm</span>
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" aria-label={`Từ: ${item.word}`}>
                      {item.word}
                    </div>
                    <div className="text-xs text-gray-500 truncate" aria-label={`Nghĩa: ${item.vietnamese_meaning}`}>
                      {item.vietnamese_meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            aria-label="Tiếp tục sang phần luyện viết"
          >
            Tiếp tục sang Luyện Viết
            <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
