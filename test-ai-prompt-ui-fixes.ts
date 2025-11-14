/**
 * Comprehensive Test Suite for AI Prompt and UI Fixes
 * 
 * This test file validates all fixes implemented in tasks 1-7:
 * - Task 1: Flashcard flip button functionality
 * - Task 2: AI prompt language clarity for writing analysis
 * - Task 3: AI prompt language clarity for exercise generation
 * - Task 4: AI prompt language clarity for writing prompt generation
 * - Task 5: Defensive rendering for multiple-choice questions
 * - Task 6: Enhanced normalizeOptions function with warnings
 * - Task 7: Development mode language verification
 * 
 * Requirements tested: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  requirement: string;
}

const results: TestResult[] = [];

// Helper function to add test result
function addResult(testName: string, passed: boolean, details: string, requirement: string) {
  results.push({ testName, passed, details, requirement });
  console.log(`${passed ? '✓' : '✗'} ${testName}: ${details}`);
}

// ============================================================================
// TEST 1: Flashcard Flip Button Functionality (Requirements 3.1, 3.2, 3.4)
// ============================================================================

async function testFlashcardFlipButton() {
  console.log('\n=== TEST 1: Flashcard Flip Button Functionality ===\n');
  
  try {
    const fs = await import('fs/promises');
    const flashcardContent = await fs.readFile('wordforge-ai/src/components/Flashcard.tsx', 'utf-8');
    
    // Test 1.1: Check if flip button uses handleFlip function
    const hasFlipButtonWithHandler = flashcardContent.includes('onClick={handleFlip}') && 
                                      flashcardContent.includes('<RotateCcw');
    addResult(
      'Flip button uses handleFlip function',
      hasFlipButtonWithHandler,
      hasFlipButtonWithHandler ? 'Flip button correctly calls handleFlip' : 'Flip button does not use handleFlip',
      '3.1, 3.2'
    );
    
    // Test 1.2: Check if handleFlip sets both isFlipped and showReview
    const handleFlipPattern = /const handleFlip = \(\) => \{[\s\S]*?setIsFlipped\(true\)[\s\S]*?setShowReview\(true\)[\s\S]*?\}/;
    const handleFlipCorrect = handleFlipPattern.test(flashcardContent);
    addResult(
      'handleFlip sets both isFlipped and showReview',
      handleFlipCorrect,
      handleFlipCorrect ? 'Both states are set together' : 'States are not set together',
      '3.4'
    );
    
    // Test 1.3: Check if card click also uses handleFlip
    const cardClickPattern = /onClick={handleFlip}/;
    const cardClickCorrect = cardClickPattern.test(flashcardContent);
    addResult(
      'Card click uses handleFlip',
      cardClickCorrect,
      cardClickCorrect ? 'Card click correctly calls handleFlip' : 'Card click does not use handleFlip',
      '3.3'
    );
    
    // Test 1.4: Check if review buttons are shown when showReview is true
    const reviewButtonsPattern = /{showReview && \([\s\S]*?<div className="flex justify-center space-x-2">/;
    const reviewButtonsCorrect = reviewButtonsPattern.test(flashcardContent);
    addResult(
      'Review buttons shown when showReview is true',
      reviewButtonsCorrect,
      reviewButtonsCorrect ? 'Review buttons are conditionally rendered' : 'Review buttons not properly conditional',
      '3.2, 3.5'
    );
    
  } catch (error) {
    addResult('Flashcard flip button tests', false, `Error: ${error}`, '3.1-3.5');
  }
}

// ============================================================================
// TEST 2: AI Prompt Language Clarity - Writing Analysis (Requirements 1.1, 1.2, 1.5)
// ============================================================================

async function testWritingAnalysisPrompt() {
  console.log('\n=== TEST 2: AI Prompt Language Clarity - Writing Analysis ===\n');
  
  try {
    const fs = await import('fs/promises');
    const geminiContent = await fs.readFile('wordforge-ai/src/app/api/gemini/route.ts', 'utf-8');
    
    // Test 2.1: Check for explicit language requirements section
    const hasLanguageSection = geminiContent.includes('QUAN TRỌNG VỀ NGÔN NGỮ:');
    addResult(
      'Writing analysis has explicit language requirements',
      hasLanguageSection,
      hasLanguageSection ? 'Language requirements section found' : 'Missing language requirements section',
      '1.5'
    );
    
    // Test 2.2: Check for corrected_version language specification
    const hasCorrectedVersionSpec = geminiContent.includes('corrected_version') && 
                                     geminiContent.includes('phải hoàn toàn bằng ${targetLanguage}');
    addResult(
      'Corrected version must be in target language',
      hasCorrectedVersionSpec,
      hasCorrectedVersionSpec ? 'Corrected version language specified' : 'Corrected version language not specified',
      '1.1'
    );
    
    // Test 2.3: Check for Vietnamese feedback specification
    const hasVietnameseFeedback = geminiContent.includes('Tất cả các trường phản hồi') && 
                                   geminiContent.includes('phải bằng tiếng Việt');
    addResult(
      'Feedback fields must be in Vietnamese',
      hasVietnameseFeedback,
      hasVietnameseFeedback ? 'Vietnamese feedback specified' : 'Vietnamese feedback not specified',
      '1.2'
    );
    
    // Test 2.4: Check for "thuần túy" (pure) emphasis
    const hasPureEmphasis = geminiContent.includes('thuần túy');
    addResult(
      'Emphasizes pure target language',
      hasPureEmphasis,
      hasPureEmphasis ? 'Pure language emphasis found' : 'Missing pure language emphasis',
      '1.1'
    );
    
  } catch (error) {
    addResult('Writing analysis prompt tests', false, `Error: ${error}`, '1.1, 1.2, 1.5');
  }
}

// ============================================================================
// TEST 3: AI Prompt Language Clarity - Exercise Generation (Requirements 1.4, 1.5)
// ============================================================================

async function testExerciseGenerationPrompt() {
  console.log('\n=== TEST 3: AI Prompt Language Clarity - Exercise Generation ===\n');
  
  try {
    const fs = await import('fs/promises');
    const geminiContent = await fs.readFile('wordforge-ai/src/app/api/gemini/route.ts', 'utf-8');
    
    // Test 3.1: Check for exercise language requirements
    const hasExerciseLanguageReqs = geminiContent.includes('**Lưu ý quan trọng về ngôn ngữ:**') &&
                                     geminiContent.includes('generate_exercises');
    addResult(
      'Exercise generation has language requirements',
      hasExerciseLanguageReqs,
      hasExerciseLanguageReqs ? 'Exercise language requirements found' : 'Missing exercise language requirements',
      '1.5'
    );
    
    // Test 3.2: Check for questions in target language specification
    const hasQuestionsInTargetLang = geminiContent.includes('Tất cả câu hỏi (question) phải được viết hoàn toàn bằng ${targetLanguage}');
    addResult(
      'Questions must be in target language',
      hasQuestionsInTargetLang,
      hasQuestionsInTargetLang ? 'Questions language specified' : 'Questions language not specified',
      '1.4'
    );
    
    // Test 3.3: Check for translation field clarification
    const hasTranslationClarification = geminiContent.includes('Trường "translation"') && 
                                         geminiContent.includes('chứa bản dịch tiếng Việt');
    addResult(
      'Translation field clarified',
      hasTranslationClarification,
      hasTranslationClarification ? 'Translation field clarified' : 'Translation field not clarified',
      '1.4'
    );
    
    // Test 3.4: Check for no mixing instruction
    const hasNoMixingInstruction = geminiContent.includes('Không được trộn lẫn tiếng Việt vào nội dung câu hỏi hoặc đáp án');
    addResult(
      'Explicit no mixing instruction',
      hasNoMixingInstruction,
      hasNoMixingInstruction ? 'No mixing instruction found' : 'Missing no mixing instruction',
      '1.5'
    );
    
  } catch (error) {
    addResult('Exercise generation prompt tests', false, `Error: ${error}`, '1.4, 1.5');
  }
}

// ============================================================================
// TEST 4: AI Prompt Language Clarity - Writing Prompt (Requirements 1.3, 1.5)
// ============================================================================

async function testWritingPromptGeneration() {
  console.log('\n=== TEST 4: AI Prompt Language Clarity - Writing Prompt Generation ===\n');
  
  try {
    const fs = await import('fs/promises');
    const geminiContent = await fs.readFile('wordforge-ai/src/app/api/gemini/route.ts', 'utf-8');
    
    // Test 4.1: Check for writing prompt language requirements
    const hasWritingPromptLangReqs = geminiContent.includes('**Lưu ý quan trọng về ngôn ngữ:**') &&
                                      geminiContent.includes('generate_writing_prompt');
    addResult(
      'Writing prompt has language requirements',
      hasWritingPromptLangReqs,
      hasWritingPromptLangReqs ? 'Writing prompt language requirements found' : 'Missing writing prompt language requirements',
      '1.5'
    );
    
    // Test 4.2: Check for prompt in Vietnamese but writing in target language
    const hasPromptLanguageSpec = geminiContent.includes('Đề bài viết (prompt) phải bằng tiếng Việt nhưng yêu cầu người học viết bằng ${targetLanguage}');
    addResult(
      'Prompt in Vietnamese, writing in target language',
      hasPromptLanguageSpec,
      hasPromptLanguageSpec ? 'Prompt language specification found' : 'Missing prompt language specification',
      '1.3'
    );
    
    // Test 4.3: Check for structure hints in Vietnamese
    const hasStructureHintsSpec = geminiContent.includes('structure_hints') && 
                                    geminiContent.includes('bằng tiếng Việt');
    addResult(
      'Structure hints in Vietnamese',
      hasStructureHintsSpec,
      hasStructureHintsSpec ? 'Structure hints language specified' : 'Structure hints language not specified',
      '1.3'
    );
    
  } catch (error) {
    addResult('Writing prompt generation tests', false, `Error: ${error}`, '1.3, 1.5');
  }
}

// ============================================================================
// TEST 5: Defensive Rendering for Multiple-Choice (Requirements 2.1, 2.4, 2.5)
// ============================================================================

async function testMultipleChoiceDefensiveRendering() {
  console.log('\n=== TEST 5: Defensive Rendering for Multiple-Choice Questions ===\n');
  
  try {
    const fs = await import('fs/promises');
    const exerciseContent = await fs.readFile('wordforge-ai/src/components/ExerciseSection.tsx', 'utf-8');
    
    // Test 5.1: Check for options validation before rendering
    const hasOptionsValidation = exerciseContent.includes('if (!normalizedOptions || normalizedOptions.length === 0)');
    addResult(
      'Options validation before rendering',
      hasOptionsValidation,
      hasOptionsValidation ? 'Options validation found' : 'Missing options validation',
      '2.1, 2.4'
    );
    
    // Test 5.2: Check for error message display
    const hasErrorMessage = exerciseContent.includes('Lỗi: Câu hỏi này không có đáp án');
    addResult(
      'User-friendly error message',
      hasErrorMessage,
      hasErrorMessage ? 'Error message found' : 'Missing error message',
      '2.5'
    );
    
    // Test 5.3: Check for console error logging
    const hasConsoleError = exerciseContent.includes('console.error(`Multiple choice question ${index} has no options:`, exercise)');
    addResult(
      'Console error logging for debugging',
      hasConsoleError,
      hasConsoleError ? 'Console error logging found' : 'Missing console error logging',
      '2.5'
    );
    
    // Test 5.4: Check for error UI with XCircle icon
    const hasErrorUI = exerciseContent.includes('<XCircle className="h-5 w-5 text-red-500') && 
                        exerciseContent.includes('bg-red-50 border border-red-200');
    addResult(
      'Error UI with visual indicators',
      hasErrorUI,
      hasErrorUI ? 'Error UI found' : 'Missing error UI',
      '2.5'
    );
    
  } catch (error) {
    addResult('Multiple-choice defensive rendering tests', false, `Error: ${error}`, '2.1, 2.4, 2.5');
  }
}

// ============================================================================
// TEST 6: Enhanced normalizeOptions Function (Requirements 2.2, 2.3)
// ============================================================================

async function testNormalizeOptionsEnhancements() {
  console.log('\n=== TEST 6: Enhanced normalizeOptions Function with Warnings ===\n');
  
  try {
    const fs = await import('fs/promises');
    const exerciseContent = await fs.readFile('wordforge-ai/src/components/ExerciseSection.tsx', 'utf-8');
    
    // Test 6.1: Check for array filtering warning
    const hasArrayWarning = exerciseContent.includes('console.warn("normalizeOptions: Array provided but no valid string options found');
    addResult(
      'Warning for empty array after filtering',
      hasArrayWarning,
      hasArrayWarning ? 'Array warning found' : 'Missing array warning',
      '2.2'
    );
    
    // Test 6.2: Check for object entries warning
    const hasObjectWarning = exerciseContent.includes('console.warn("normalizeOptions: Object provided but no valid entries found');
    addResult(
      'Warning for object with no valid entries',
      hasObjectWarning,
      hasObjectWarning ? 'Object warning found' : 'Missing object warning',
      '2.2'
    );
    
    // Test 6.3: Check for string split warning
    const hasStringWarning = exerciseContent.includes('console.warn("normalizeOptions: String provided but no valid options after split');
    addResult(
      'Warning for string with no options after split',
      hasStringWarning,
      hasStringWarning ? 'String warning found' : 'Missing string warning',
      '2.2'
    );
    
    // Test 6.4: Check for invalid type warning
    const hasInvalidTypeWarning = exerciseContent.includes('console.warn("normalizeOptions: Invalid option type');
    addResult(
      'Warning for invalid option types',
      hasInvalidTypeWarning,
      hasInvalidTypeWarning ? 'Invalid type warning found' : 'Missing invalid type warning',
      '2.3'
    );
    
  } catch (error) {
    addResult('normalizeOptions enhancements tests', false, `Error: ${error}`, '2.2, 2.3');
  }
}

// ============================================================================
// TEST 7: Development Mode Language Verification (Requirement 1.1)
// ============================================================================

async function testDevelopmentModeVerification() {
  console.log('\n=== TEST 7: Development Mode Language Verification ===\n');
  
  try {
    const fs = await import('fs/promises');
    const geminiContent = await fs.readFile('wordforge-ai/src/app/api/gemini/route.ts', 'utf-8');
    
    // Test 7.1: Check for development mode check
    const hasDevelopmentCheck = geminiContent.includes("process.env.NODE_ENV === 'development'") || 
                                 geminiContent.includes("process.env.DEBUG === 'true'");
    addResult(
      'Development mode check exists',
      hasDevelopmentCheck,
      hasDevelopmentCheck ? 'Development mode check found' : 'Missing development mode check',
      '1.1'
    );
    
    // Test 7.2: Check for Vietnamese character detection
    const hasVietnameseRegex = geminiContent.includes('vietnameseRegex') && 
                                geminiContent.includes('[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]');
    addResult(
      'Vietnamese character detection regex',
      hasVietnameseRegex,
      hasVietnameseRegex ? 'Vietnamese regex found' : 'Missing Vietnamese regex',
      '1.1'
    );
    
    // Test 7.3: Check for console log with preview
    const hasConsoleLog = geminiContent.includes('console.log') && 
                           geminiContent.includes('Language verification') &&
                           geminiContent.includes('corrected_version');
    addResult(
      'Console log for language verification',
      hasConsoleLog,
      hasConsoleLog ? 'Console log found' : 'Missing console log',
      '1.1'
    );
    
    // Test 7.4: Check for preview substring
    const hasPreview = geminiContent.includes('substring(0, 100)') || 
                        geminiContent.includes('.substring(0,');
    addResult(
      'Preview of corrected version',
      hasPreview,
      hasPreview ? 'Preview substring found' : 'Missing preview substring',
      '1.1'
    );
    
  } catch (error) {
    addResult('Development mode verification tests', false, `Error: ${error}`, '1.1');
  }
}

// ============================================================================
// TEST 8: Integration Tests - Verify No Regressions
// ============================================================================

async function testNoRegressions() {
  console.log('\n=== TEST 8: Integration Tests - No Regressions ===\n');
  
  try {
    const fs = await import('fs/promises');
    
    // Test 8.1: Check Flashcard component still has all original features
    const flashcardContent = await fs.readFile('wordforge-ai/src/components/Flashcard.tsx', 'utf-8');
    const hasAudioFeature = flashcardContent.includes('playAudio') && flashcardContent.includes('Volume2');
    const hasImageFeature = flashcardContent.includes('imageUrl') && flashcardContent.includes('<img');
    const hasDifficultyFeature = flashcardContent.includes('getDifficultyColor') && flashcardContent.includes('getDifficultyText');
    
    addResult(
      'Flashcard audio feature intact',
      hasAudioFeature,
      hasAudioFeature ? 'Audio feature preserved' : 'Audio feature missing',
      'Regression check'
    );
    
    addResult(
      'Flashcard image feature intact',
      hasImageFeature,
      hasImageFeature ? 'Image feature preserved' : 'Image feature missing',
      'Regression check'
    );
    
    addResult(
      'Flashcard difficulty feature intact',
      hasDifficultyFeature,
      hasDifficultyFeature ? 'Difficulty feature preserved' : 'Difficulty feature missing',
      'Regression check'
    );
    
    // Test 8.2: Check ExerciseSection still has all exercise types
    const exerciseContent = await fs.readFile('wordforge-ai/src/components/ExerciseSection.tsx', 'utf-8');
    const hasFillInBlanks = exerciseContent.includes('fill_in_the_blanks') && exerciseContent.includes('Điền từ vào chỗ trống');
    const hasMatching = exerciseContent.includes('matching') && exerciseContent.includes('Nối từ với nghĩa');
    const hasMultipleChoice = exerciseContent.includes('multiple_choice') && exerciseContent.includes('Trắc nghiệm');
    
    addResult(
      'Fill-in-the-blanks exercise intact',
      hasFillInBlanks,
      hasFillInBlanks ? 'Fill-in-the-blanks preserved' : 'Fill-in-the-blanks missing',
      'Regression check'
    );
    
    addResult(
      'Matching exercise intact',
      hasMatching,
      hasMatching ? 'Matching exercise preserved' : 'Matching exercise missing',
      'Regression check'
    );
    
    addResult(
      'Multiple-choice exercise intact',
      hasMultipleChoice,
      hasMultipleChoice ? 'Multiple-choice preserved' : 'Multiple-choice missing',
      'Regression check'
    );
    
    // Test 8.3: Check Gemini API still has all actions
    const geminiContent = await fs.readFile('wordforge-ai/src/app/api/gemini/route.ts', 'utf-8');
    const hasGenerateVocab = geminiContent.includes('case "generate_vocabulary"');
    const hasGeneratePassage = geminiContent.includes('case "generate_passage"');
    const hasGenerateExercises = geminiContent.includes('case "generate_exercises"');
    const hasGenerateWritingPrompt = geminiContent.includes('case "generate_writing_prompt"');
    const hasAnalyzeWriting = geminiContent.includes('case "analyze_writing"');
    
    addResult(
      'Generate vocabulary action intact',
      hasGenerateVocab,
      hasGenerateVocab ? 'Generate vocabulary preserved' : 'Generate vocabulary missing',
      'Regression check'
    );
    
    addResult(
      'Generate passage action intact',
      hasGeneratePassage,
      hasGeneratePassage ? 'Generate passage preserved' : 'Generate passage missing',
      'Regression check'
    );
    
    addResult(
      'Generate exercises action intact',
      hasGenerateExercises,
      hasGenerateExercises ? 'Generate exercises preserved' : 'Generate exercises missing',
      'Regression check'
    );
    
    addResult(
      'Generate writing prompt action intact',
      hasGenerateWritingPrompt,
      hasGenerateWritingPrompt ? 'Generate writing prompt preserved' : 'Generate writing prompt missing',
      'Regression check'
    );
    
    addResult(
      'Analyze writing action intact',
      hasAnalyzeWriting,
      hasAnalyzeWriting ? 'Analyze writing preserved' : 'Analyze writing missing',
      'Regression check'
    );
    
  } catch (error) {
    addResult('Regression tests', false, `Error: ${error}`, 'Regression check');
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  AI Prompt and UI Fixes - Comprehensive Test Suite            ║');
  console.log('║  Testing Tasks 1-7 Implementation                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  await testFlashcardFlipButton();
  await testWritingAnalysisPrompt();
  await testExerciseGenerationPrompt();
  await testWritingPromptGeneration();
  await testMultipleChoiceDefensiveRendering();
  await testNormalizeOptionsEnhancements();
  await testDevelopmentModeVerification();
  await testNoRegressions();
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ ${r.testName} (${r.requirement})`);
      console.log(`    ${r.details}`);
    });
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  REQUIREMENTS COVERAGE                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const requirements = ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '3.1', '3.2', '3.3', '3.4', '3.5'];
  requirements.forEach(req => {
    const reqTests = results.filter(r => r.requirement.includes(req));
    const reqPassed = reqTests.filter(r => r.passed).length;
    const reqTotal = reqTests.length;
    const status = reqPassed === reqTotal ? '✓' : '✗';
    console.log(`  ${status} Requirement ${req}: ${reqPassed}/${reqTotal} tests passed`);
  });
  
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
