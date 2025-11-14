/**
 * Shared types for lesson vocabulary persistence
 * Used by API endpoints and frontend components
 */

/**
 * A vocabulary item from an AI-generated lesson
 */
export interface VocabularyItem {
  word: string
  type: string // Noun, Verb, Adjective, etc.
  vietnamese_meaning: string
  english_definition?: string
}

/**
 * Request payload for saving vocabulary from a completed lesson
 */
export interface SaveVocabularyRequest {
  topic: string
  language: string // "english", "german", "chinese", or custom
  proficiency: string // "A1", "A2", "B1", "B2", "C1", "C2"
  vocabulary: VocabularyItem[]
}

/**
 * Response from saving vocabulary to flashcards
 */
export interface SaveVocabularyResponse {
  success: boolean
  deckId: string
  deckName: string
  created: number // Count of new flashcards created
  skipped: number // Count of duplicates skipped
  errors?: string[] // Any non-fatal errors encountered
}
