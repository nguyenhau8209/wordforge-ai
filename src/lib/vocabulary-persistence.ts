import { prisma } from '@/lib/prisma'
import type {
  VocabularyItem,
  SaveVocabularyRequest,
  SaveVocabularyResponse
} from '@/types/lesson-vocabulary'

/**
 * Language code mapping for converting language names to ISO 639-1 codes
 */
export const LANGUAGE_CODE_MAP: Record<string, string> = {
  'english': 'en',
  'german': 'de',
  'chinese': 'zh',
  'custom': 'custom'
}

/**
 * Convert language name to ISO 639-1 language code
 * @param language - Language name (e.g., "english", "german")
 * @returns ISO 639-1 language code (e.g., "en", "de")
 */
export function getLanguageCode(language: string): string {
  const normalized = language.toLowerCase()
  return LANGUAGE_CODE_MAP[normalized] || language
}

/**
 * Service class for persisting lesson vocabulary as flashcards
 */
export class VocabularyPersistenceService {
  /**
   * Find or create a deck for the lesson vocabulary
   */
  async findOrCreateDeck(
    userId: string,
    topic: string,
    language: string,
    proficiency: string
  ) {
    const languageCode = getLanguageCode(language)
    
    // Query for existing deck by userId, topic name (case-insensitive), and language
    const existingDeck = await prisma.deck.findFirst({
      where: {
        userId,
        name: {
          equals: topic,
          mode: 'insensitive'
        },
        language: languageCode
      }
    })

    if (existingDeck) {
      return existingDeck
    }

    // Create new deck with topic as name and language/proficiency in description
    const newDeck = await prisma.deck.create({
      data: {
        name: topic,
        description: `${language} - ${proficiency}`,
        language: languageCode,
        proficiency,
        userId
      }
    })

    return newDeck
  }

  /**
   * Check if a flashcard already exists for the user
   */
  async isDuplicate(
    userId: string,
    word: string,
    languageCode: string
  ): Promise<boolean> {
    // Query flashcards by userId, word (case-insensitive), and language code
    const existingFlashcard = await prisma.flashcard.findFirst({
      where: {
        deck: {
          userId
        },
        front: {
          equals: word,
          mode: 'insensitive'
        },
        language: languageCode
      }
    })

    return existingFlashcard !== null
  }

  /**
   * Create a flashcard from a vocabulary item
   */
  async createFlashcard(
    vocabularyItem: VocabularyItem,
    deckId: string,
    languageCode: string,
    proficiency: string
  ) {
    // Use vietnamese_meaning for A1-A2 levels, english_definition for B1+ levels
    const isBasicLevel = ['A1', 'A2'].includes(proficiency)
    const definition = isBasicLevel 
      ? vocabularyItem.vietnamese_meaning 
      : vocabularyItem.english_definition || vocabularyItem.vietnamese_meaning

    // Create flashcard record in database
    const flashcard = await prisma.flashcard.create({
      data: {
        front: vocabularyItem.word,
        back: definition,
        wordType: vocabularyItem.type,
        language: languageCode,
        difficulty: 3, // Default difficulty
        deckId,
        pronunciation: null,
        audioUrl: null,
        imageUrl: null,
        example: null
      }
    })

    return flashcard
  }

  /**
   * Initialize SRS review record for a new flashcard
   */
  async initializeReview(
    flashcardId: string,
    userId: string
  ) {
    // Create Review record with default SRS values
    const review = await prisma.review.create({
      data: {
        flashcardId,
        userId,
        quality: 0,
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        nextReview: new Date()
      }
    })

    return review
  }

  /**
   * Process all vocabulary items from a lesson
   */
  async saveVocabularyFromLesson(
    userId: string,
    lessonData: SaveVocabularyRequest
  ): Promise<SaveVocabularyResponse> {
    const { topic, language, proficiency, vocabulary } = lessonData
    const errors: string[] = []
    let created = 0
    let skipped = 0

    try {
      // Call findOrCreateDeck to get target deck
      const deck = await this.findOrCreateDeck(userId, topic, language, proficiency)
      const languageCode = getLanguageCode(language)

      // Loop through vocabulary items
      for (const item of vocabulary) {
        try {
          // Check isDuplicate
          const duplicate = await this.isDuplicate(userId, item.word, languageCode)

          if (duplicate) {
            // If duplicate, increment skipped counter
            skipped++
          } else {
            // If not duplicate, call createFlashcard and initializeReview
            const flashcard = await this.createFlashcard(
              item,
              deck.id,
              languageCode,
              proficiency
            )
            
            await this.initializeReview(flashcard.id, userId)
            created++
          }
        } catch (error) {
          // Track individual item errors but continue processing
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Failed to process "${item.word}": ${errorMessage}`)
        }
      }

      // Return summary response
      return {
        success: true,
        deckId: deck.id,
        deckName: deck.name,
        created,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      // Fatal error - return failure response
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        deckId: '',
        deckName: '',
        created,
        skipped,
        errors: [errorMessage, ...errors]
      }
    }
  }
}
