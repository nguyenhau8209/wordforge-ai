import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { VocabularyPersistenceService } from "@/lib/vocabulary-persistence"
import type { SaveVocabularyRequest } from "@/types/lesson-vocabulary"

/**
 * Structured log interface for save operations
 */
interface SaveVocabularyLog {
  userId: string
  topic: string
  language: string
  vocabularyCount: number
  created: number
  skipped: number
  errors: string[]
  duration: number
  timestamp: Date
}

/**
 * Log save operation with structured data
 */
function logSaveOperation(log: SaveVocabularyLog) {
  console.log('[VocabularyPersistence]', JSON.stringify(log, null, 2))
}

/**
 * POST /api/lessons/save-vocabulary
 * Save vocabulary items from a completed lesson as flashcards
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Sub-task 3.1: Set up POST handler with NextAuth session validation
    const session = await getServerSession(authOptions)
    
    // Return 401 if no valid session
    if (!session?.user?.id) {
      console.error('[VocabularyPersistence] Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Sub-task 3.2: Implement request validation and parsing
    let requestData: SaveVocabularyRequest
    
    try {
      requestData = await request.json()
    } catch (error) {
      console.error('[VocabularyPersistence] Invalid JSON in request body:', error)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Parse request body for topic, language, proficiency, vocabulary
    const { topic, language, proficiency, vocabulary } = requestData

    // Validate required fields are present
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: "Topic is required and must be a string" },
        { status: 400 }
      )
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: "Language is required and must be a string" },
        { status: 400 }
      )
    }

    if (!proficiency || typeof proficiency !== 'string') {
      return NextResponse.json(
        { error: "Proficiency is required and must be a string" },
        { status: 400 }
      )
    }

    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      return NextResponse.json(
        { error: "Vocabulary is required and must be a non-empty array" },
        { status: 400 }
      )
    }

    // Validate vocabulary array size (max 100 items for security)
    if (vocabulary.length > 100) {
      return NextResponse.json(
        { error: "Vocabulary array cannot exceed 100 items" },
        { status: 400 }
      )
    }

    // Validate each vocabulary item has required fields
    for (let i = 0; i < vocabulary.length; i++) {
      const item = vocabulary[i]
      if (!item.word || !item.type || !item.vietnamese_meaning) {
        return NextResponse.json(
          { 
            error: `Vocabulary item at index ${i} is missing required fields (word, type, vietnamese_meaning)` 
          },
          { status: 400 }
        )
      }
    }

    // Sub-task 3.3: Integrate VocabularyPersistenceService in API handler
    // Instantiate service
    const service = new VocabularyPersistenceService()

    // Call saveVocabularyFromLesson with userId and request data
    const result = await service.saveVocabularyFromLesson(userId, requestData)

    // Sub-task 3.4: Add error logging for debugging
    const duration = Date.now() - startTime
    
    // Log all save operations with structured data
    logSaveOperation({
      userId,
      topic,
      language,
      vocabularyCount: vocabulary.length,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors || [],
      duration,
      timestamp: new Date()
    })

    // Handle errors and return appropriate status codes
    if (!result.success) {
      // Log errors with full context
      console.error('[VocabularyPersistence] Save operation failed:', {
        userId,
        topic,
        errors: result.errors
      })
      
      return NextResponse.json(
        { 
          error: "Failed to save vocabulary",
          details: result.errors 
        },
        { status: 500 }
      )
    }

    // Return success response with created/skipped counts
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    // Log errors with full context
    const duration = Date.now() - startTime
    console.error('[VocabularyPersistence] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      timestamp: new Date()
    })
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
