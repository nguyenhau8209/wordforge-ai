/**
 * End-to-End Test Script for Lesson Vocabulary Persistence
 * 
 * This script tests the complete flow of:
 * 1. Creating and completing a lesson with vocabulary
 * 2. Verifying flashcards are created in database
 * 3. Testing duplicate prevention
 * 4. Testing multi-language support
 * 
 * Run with: npx tsx test-lesson-vocabulary-e2e.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test data
const TEST_USER_EMAIL = 'test-e2e@wordforge.ai'
const TEST_USER_NAME = 'E2E Test User'

// Sample vocabulary for English lesson
const ENGLISH_VOCABULARY = [
  { word: 'sustainability', type: 'Noun', vietnamese_meaning: 'Tính bền vững' },
  { word: 'renewable', type: 'Adjective', vietnamese_meaning: 'Có thể tái tạo' },
  { word: 'ecosystem', type: 'Noun', vietnamese_meaning: 'Hệ sinh thái' },
  { word: 'biodiversity', type: 'Noun', vietnamese_meaning: 'Đa dạng sinh học' },
  { word: 'conservation', type: 'Noun', vietnamese_meaning: 'Bảo tồn' },
  { word: 'pollution', type: 'Noun', vietnamese_meaning: 'Ô nhiễm' },
  { word: 'recycle', type: 'Verb', vietnamese_meaning: 'Tái chế' },
  { word: 'carbon', type: 'Noun', vietnamese_meaning: 'Cacbon' },
  { word: 'emission', type: 'Noun', vietnamese_meaning: 'Khí thải' },
  { word: 'climate', type: 'Noun', vietnamese_meaning: 'Khí hậu' },
  { word: 'environment', type: 'Noun', vietnamese_meaning: 'Môi trường' },
  { word: 'organic', type: 'Adjective', vietnamese_meaning: 'Hữu cơ' },
  { word: 'fossil', type: 'Noun', vietnamese_meaning: 'Hóa thạch' },
  { word: 'deforestation', type: 'Noun', vietnamese_meaning: 'Phá rừng' },
  { word: 'greenhouse', type: 'Noun', vietnamese_meaning: 'Nhà kính' }
]

// Sample vocabulary for German lesson
const GERMAN_VOCABULARY = [
  { word: 'Nachhaltigkeit', type: 'Noun', vietnamese_meaning: 'Tính bền vững' },
  { word: 'erneuerbar', type: 'Adjective', vietnamese_meaning: 'Có thể tái tạo' },
  { word: 'Ökosystem', type: 'Noun', vietnamese_meaning: 'Hệ sinh thái' },
  { word: 'Biodiversität', type: 'Noun', vietnamese_meaning: 'Đa dạng sinh học' },
  { word: 'Naturschutz', type: 'Noun', vietnamese_meaning: 'Bảo tồn thiên nhiên' },
  { word: 'Verschmutzung', type: 'Noun', vietnamese_meaning: 'Ô nhiễm' },
  { word: 'recyceln', type: 'Verb', vietnamese_meaning: 'Tái chế' },
  { word: 'Kohlenstoff', type: 'Noun', vietnamese_meaning: 'Cacbon' },
  { word: 'Emission', type: 'Noun', vietnamese_meaning: 'Khí thải' },
  { word: 'Klima', type: 'Noun', vietnamese_meaning: 'Khí hậu' }
]

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green')
}

function logError(message: string) {
  log(`✗ ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue')
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow')
}

async function setupTestUser() {
  log('\n=== Setting up test user ===', 'cyan')
  
  // Check if test user exists
  let user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL }
  })

  if (user) {
    logInfo(`Test user already exists: ${user.email}`)
  } else {
    // Create test user
    user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME
      }
    })
    logSuccess(`Created test user: ${user.email}`)
  }

  return user
}

async function cleanupTestData(userId: string) {
  log('\n=== Cleaning up test data ===', 'cyan')
  
  // Delete all decks (cascades to flashcards and reviews)
  const deletedDecks = await prisma.deck.deleteMany({
    where: { userId }
  })
  
  logSuccess(`Deleted ${deletedDecks.count} test decks`)
}

async function testCreateLesson(userId: string) {
  log('\n=== Test 7.1: Creating and completing a lesson with vocabulary ===', 'cyan')
  
  const topic = 'Green Technology'
  const language = 'english'
  const proficiency = 'B1'
  
  logInfo(`Creating lesson: ${topic} (${language}, ${proficiency})`)
  logInfo(`Vocabulary items: ${ENGLISH_VOCABULARY.length}`)
  
  // Simulate API call to save vocabulary
  const { VocabularyPersistenceService } = await import('./src/lib/vocabulary-persistence')
  const service = new VocabularyPersistenceService()
  
  const result = await service.saveVocabularyFromLesson(userId, {
    topic,
    language,
    proficiency,
    vocabulary: ENGLISH_VOCABULARY
  })
  
  if (!result.success) {
    logError('Failed to save vocabulary')
    console.error(result.errors)
    return null
  }
  
  logSuccess(`Created ${result.created} flashcards`)
  logInfo(`Skipped ${result.skipped} duplicates`)
  logInfo(`Deck: ${result.deckName} (${result.deckId})`)
  
  // Verify flashcards in database
  const deck = await prisma.deck.findUnique({
    where: { id: result.deckId },
    include: {
      flashcards: true
    }
  })
  
  if (!deck) {
    logError('Deck not found in database')
    return null
  }
  
  logSuccess(`Verified deck exists: ${deck.name}`)
  logSuccess(`Verified ${deck.flashcards.length} flashcards in database`)
  
  // Verify deck has correct language
  if (deck.language !== 'en') {
    logError(`Expected language 'en', got '${deck.language}'`)
    return null
  }
  logSuccess(`Verified deck language: ${deck.language}`)
  
  // Verify deck has correct proficiency
  if (deck.proficiency !== proficiency) {
    logError(`Expected proficiency '${proficiency}', got '${deck.proficiency}'`)
    return null
  }
  logSuccess(`Verified deck proficiency: ${deck.proficiency}`)
  
  // Verify flashcards have correct language
  const wrongLanguage = deck.flashcards.filter(f => f.language !== 'en')
  if (wrongLanguage.length > 0) {
    logError(`Found ${wrongLanguage.length} flashcards with wrong language`)
    return null
  }
  logSuccess('Verified all flashcards have correct language')
  
  // Verify reviews were created
  const reviews = await prisma.review.findMany({
    where: {
      userId,
      flashcardId: { in: deck.flashcards.map(f => f.id) }
    }
  })
  
  if (reviews.length !== deck.flashcards.length) {
    logError(`Expected ${deck.flashcards.length} reviews, found ${reviews.length}`)
    return null
  }
  logSuccess(`Verified ${reviews.length} review records created`)
  
  // Verify review defaults
  const wrongDefaults = reviews.filter(r => 
    r.interval !== 0 || 
    r.repetitions !== 0 || 
    r.easeFactor !== 2.5 ||
    r.quality !== 0
  )
  if (wrongDefaults.length > 0) {
    logError(`Found ${wrongDefaults.length} reviews with wrong default values`)
    return null
  }
  logSuccess('Verified all reviews have correct default SRS values')
  
  log('\n✓ Test 7.1 PASSED', 'green')
  return deck
}

async function testDuplicatePrevention(userId: string) {
  log('\n=== Test 7.2: Testing duplicate prevention ===', 'cyan')
  
  const topic = 'Green Technology'
  const language = 'english'
  const proficiency = 'B1'
  
  logInfo('Completing the same lesson again with same vocabulary')
  
  // Get initial flashcard count
  const initialDecks = await prisma.deck.findMany({
    where: { userId },
    include: { flashcards: true }
  })
  const initialFlashcardCount = initialDecks.reduce((sum, d) => sum + d.flashcards.length, 0)
  
  logInfo(`Initial flashcard count: ${initialFlashcardCount}`)
  
  // Simulate completing the same lesson again
  const { VocabularyPersistenceService } = await import('./src/lib/vocabulary-persistence')
  const service = new VocabularyPersistenceService()
  
  const result = await service.saveVocabularyFromLesson(userId, {
    topic,
    language,
    proficiency,
    vocabulary: ENGLISH_VOCABULARY
  })
  
  if (!result.success) {
    logError('Failed to save vocabulary')
    console.error(result.errors)
    return false
  }
  
  logInfo(`Created ${result.created} new flashcards`)
  logInfo(`Skipped ${result.skipped} duplicates`)
  
  // Verify no new flashcards were created
  if (result.created !== 0) {
    logError(`Expected 0 new flashcards, got ${result.created}`)
    return false
  }
  logSuccess('Verified no new flashcards were created')
  
  // Verify all vocabulary items were skipped
  if (result.skipped !== ENGLISH_VOCABULARY.length) {
    logError(`Expected ${ENGLISH_VOCABULARY.length} skipped, got ${result.skipped}`)
    return false
  }
  logSuccess(`Verified all ${result.skipped} vocabulary items were skipped as duplicates`)
  
  // Verify flashcard count in database hasn't changed
  const finalDecks = await prisma.deck.findMany({
    where: { userId },
    include: { flashcards: true }
  })
  const finalFlashcardCount = finalDecks.reduce((sum, d) => sum + d.flashcards.length, 0)
  
  if (finalFlashcardCount !== initialFlashcardCount) {
    logError(`Flashcard count changed from ${initialFlashcardCount} to ${finalFlashcardCount}`)
    return false
  }
  logSuccess(`Verified flashcard count unchanged: ${finalFlashcardCount}`)
  
  log('\n✓ Test 7.2 PASSED', 'green')
  return true
}

async function testMultiLanguageSupport(userId: string) {
  log('\n=== Test 7.3: Testing multi-language support ===', 'cyan')
  
  // Create German lesson
  const germanTopic = 'Grüne Technologie'
  const germanLanguage = 'german'
  const germanProficiency = 'A2'
  
  logInfo(`Creating German lesson: ${germanTopic}`)
  
  const { VocabularyPersistenceService } = await import('./src/lib/vocabulary-persistence')
  const service = new VocabularyPersistenceService()
  
  const germanResult = await service.saveVocabularyFromLesson(userId, {
    topic: germanTopic,
    language: germanLanguage,
    proficiency: germanProficiency,
    vocabulary: GERMAN_VOCABULARY
  })
  
  if (!germanResult.success) {
    logError('Failed to save German vocabulary')
    console.error(germanResult.errors)
    return false
  }
  
  logSuccess(`Created ${germanResult.created} German flashcards`)
  
  // Verify German deck
  const germanDeck = await prisma.deck.findUnique({
    where: { id: germanResult.deckId },
    include: { flashcards: true }
  })
  
  if (!germanDeck) {
    logError('German deck not found')
    return false
  }
  
  if (germanDeck.language !== 'de') {
    logError(`Expected German deck language 'de', got '${germanDeck.language}'`)
    return false
  }
  logSuccess(`Verified German deck language: ${germanDeck.language}`)
  
  // Verify German flashcards have correct language
  const wrongLanguage = germanDeck.flashcards.filter(f => f.language !== 'de')
  if (wrongLanguage.length > 0) {
    logError(`Found ${wrongLanguage.length} German flashcards with wrong language`)
    return false
  }
  logSuccess('Verified all German flashcards have correct language code')
  
  // Verify separate decks exist for each language
  const allDecks = await prisma.deck.findMany({
    where: { userId },
    include: { flashcards: true }
  })
  
  const englishDecks = allDecks.filter(d => d.language === 'en')
  const germanDecks = allDecks.filter(d => d.language === 'de')
  
  if (englishDecks.length === 0) {
    logError('No English decks found')
    return false
  }
  if (germanDecks.length === 0) {
    logError('No German decks found')
    return false
  }
  
  logSuccess(`Verified separate decks: ${englishDecks.length} English, ${germanDecks.length} German`)
  
  // Verify flashcards are in correct decks
  const englishFlashcards = englishDecks.reduce((sum, d) => sum + d.flashcards.length, 0)
  const germanFlashcards = germanDecks.reduce((sum, d) => sum + d.flashcards.length, 0)
  
  logInfo(`English flashcards: ${englishFlashcards}`)
  logInfo(`German flashcards: ${germanFlashcards}`)
  
  if (englishFlashcards !== ENGLISH_VOCABULARY.length) {
    logError(`Expected ${ENGLISH_VOCABULARY.length} English flashcards, got ${englishFlashcards}`)
    return false
  }
  if (germanFlashcards !== GERMAN_VOCABULARY.length) {
    logError(`Expected ${GERMAN_VOCABULARY.length} German flashcards, got ${germanFlashcards}`)
    return false
  }
  
  logSuccess('Verified correct number of flashcards in each language')
  
  log('\n✓ Test 7.3 PASSED', 'green')
  return true
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan')
  log('║  Lesson Vocabulary Persistence - End-to-End Test Suite   ║', 'cyan')
  log('╚════════════════════════════════════════════════════════════╝', 'cyan')
  
  try {
    // Setup
    const user = await setupTestUser()
    await cleanupTestData(user.id)
    
    // Run tests
    const test1Result = await testCreateLesson(user.id)
    if (!test1Result) {
      logError('Test 7.1 failed - stopping test suite')
      process.exit(1)
    }
    
    const test2Result = await testDuplicatePrevention(user.id)
    if (!test2Result) {
      logError('Test 7.2 failed - stopping test suite')
      process.exit(1)
    }
    
    const test3Result = await testMultiLanguageSupport(user.id)
    if (!test3Result) {
      logError('Test 7.3 failed - stopping test suite')
      process.exit(1)
    }
    
    // Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'green')
    log('║              ALL TESTS PASSED SUCCESSFULLY!               ║', 'green')
    log('╚════════════════════════════════════════════════════════════╝', 'green')
    
    log('\nTest Summary:', 'cyan')
    logSuccess('7.1 - Create and complete lesson with vocabulary')
    logSuccess('7.2 - Duplicate prevention')
    logSuccess('7.3 - Multi-language support')
    
  } catch (error) {
    logError('\nTest suite failed with error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test suite
runTests()
