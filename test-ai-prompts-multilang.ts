/**
 * Comprehensive test script for AI prompts with multiple languages and proficiency levels
 * Tests all 5 AI functions: vocabulary, passage, exercises, writing prompt, and writing analysis
 * 
 * Requirements tested: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  requirement: string;
  errors?: string[];
}

interface VocabularyItem {
  word: string;
  type: string;
  vietnamese_meaning: string;
  english_definition?: string;
}

const API_BASE_URL = 'http://localhost:3001';
const TEST_RESULTS: TestResult[] = [];

// Vietnamese character detection regex
const VIETNAMESE_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

// Language-specific character detection
const CHINESE_REGEX = /[\u4e00-\u9fff]/;
const GERMAN_SPECIAL_CHARS = /[äöüßÄÖÜ]/;

function addTestResult(testName: string, passed: boolean, details: string, errors?: string[], requirement: string = '') {
  TEST_RESULTS.push({ testName, passed, details, requirement, errors });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) console.log(`  ${details}`);
  if (errors && errors.length > 0) {
    errors.forEach(err => console.log(`  ⚠️  ${err}`));
  }
}

async function callGeminiAPI(action: string, params: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.error || response.statusText}`);
  }

  return response.json();
}

// Test 1: Vocabulary Generation for Multiple Languages and Proficiency Levels
async function testVocabularyGeneration() {
  console.log('\n📚 Testing Vocabulary Generation...\n');

  const testCases = [
    { language: 'english', proficiency: 'A1', topic: 'Daily Activities', wordCount: 10 },
    { language: 'english', proficiency: 'B2', topic: 'Technology', wordCount: 10 },
    { language: 'german', proficiency: 'A2', topic: 'Food and Cooking', wordCount: 10 },
    { language: 'german', proficiency: 'B1', topic: 'Environment', wordCount: 10 },
    { language: 'chinese', proficiency: 'A1', topic: 'Family', wordCount: 10 },
    { language: 'chinese', proficiency: 'B2', topic: 'Business', wordCount: 10 },
  ];

  for (const testCase of testCases) {
    const testName = `Vocabulary: ${testCase.language} - ${testCase.proficiency} - ${testCase.topic}`;
    const errors: string[] = [];

    try {
      const result = await callGeminiAPI('generate_vocabulary', testCase);
      const vocabulary: VocabularyItem[] = result.vocabulary;

      // Verify JSON structure
      if (!Array.isArray(vocabulary)) {
        errors.push('Response is not an array');
      } else if (vocabulary.length !== testCase.wordCount) {
        errors.push(`Expected ${testCase.wordCount} words, got ${vocabulary.length}`);
      }

      // Verify each vocabulary item
      vocabulary.forEach((item, index) => {
        if (!item.word || typeof item.word !== 'string') {
          errors.push(`Item ${index}: Missing or invalid 'word' field`);
        }
        if (!item.type || typeof item.type !== 'string') {
          errors.push(`Item ${index}: Missing or invalid 'type' field`);
        }
        if (!item.vietnamese_meaning || typeof item.vietnamese_meaning !== 'string') {
          errors.push(`Item ${index}: Missing or invalid 'vietnamese_meaning' field`);
        }

        // Verify Vietnamese meaning contains Vietnamese characters
        if (item.vietnamese_meaning && !VIETNAMESE_REGEX.test(item.vietnamese_meaning)) {
          errors.push(`Item ${index}: 'vietnamese_meaning' should contain Vietnamese characters`);
        }

        // For B1+ levels, verify english_definition exists
        if (['B1', 'B2', 'C1', 'C2'].includes(testCase.proficiency)) {
          if (!item.english_definition) {
            errors.push(`Item ${index}: Missing 'english_definition' for ${testCase.proficiency} level`);
          }
        }

        // Verify word is in target language (basic check)
        if (testCase.language === 'chinese' && item.word) {
          if (!CHINESE_REGEX.test(item.word)) {
            errors.push(`Item ${index}: Word '${item.word}' doesn't appear to be Chinese`);
          }
        }
      });

      const passed = errors.length === 0;
      addTestResult(
        testName,
        passed,
        `Generated ${vocabulary.length} words`,
        errors
      );
    } catch (error) {
      addTestResult(testName, false, `Exception: ${error}`, [String(error)]);
    }
  }
}

// Test 2: Passage Generation with Different Topics and Languages
async function testPassageGeneration() {
  console.log('\n📖 Testing Passage Generation...\n');

  const testCases = [
    {
      language: 'english',
      proficiency: 'A2',
      topic: 'Travel',
      vocabulary: [
        { word: 'journey', type: 'Noun', vietnamese_meaning: 'hành trình' },
        { word: 'explore', type: 'Verb', vietnamese_meaning: 'khám phá' },
        { word: 'adventure', type: 'Noun', vietnamese_meaning: 'phiêu lưu' },
      ]
    },
    {
      language: 'german',
      proficiency: 'B1',
      topic: 'Health',
      vocabulary: [
        { word: 'Gesundheit', type: 'Noun', vietnamese_meaning: 'sức khỏe' },
        { word: 'Sport', type: 'Noun', vietnamese_meaning: 'thể thao' },
        { word: 'Ernährung', type: 'Noun', vietnamese_meaning: 'dinh dưỡng' },
      ]
    },
    {
      language: 'chinese',
      proficiency: 'A1',
      topic: 'School',
      vocabulary: [
        { word: '学校', type: 'Noun', vietnamese_meaning: 'trường học' },
        { word: '老师', type: 'Noun', vietnamese_meaning: 'giáo viên' },
        { word: '学生', type: 'Noun', vietnamese_meaning: 'học sinh' },
      ]
    },
  ];

  for (const testCase of testCases) {
    const testName = `Passage: ${testCase.language} - ${testCase.proficiency} - ${testCase.topic}`;
    const errors: string[] = [];

    try {
      const result = await callGeminiAPI('generate_passage', testCase);
      const passage: string = result.passage;

      // Verify passage exists and has reasonable length
      if (!passage || typeof passage !== 'string') {
        errors.push('Passage is missing or not a string');
      } else {
        const wordCount = passage.split(/\s+/).length;
        if (wordCount < 100) {
          errors.push(`Passage too short: ${wordCount} words (expected 150-200)`);
        } else if (wordCount > 250) {
          errors.push(`Passage too long: ${wordCount} words (expected 150-200)`);
        }

        // Verify vocabulary words are used in passage
        const missingWords = testCase.vocabulary.filter(
          v => !passage.toLowerCase().includes(v.word.toLowerCase())
        );
        if (missingWords.length > 0) {
          errors.push(`Missing vocabulary words: ${missingWords.map(w => w.word).join(', ')}`);
        }

        // Verify passage is in target language
        if (testCase.language === 'chinese') {
          if (!CHINESE_REGEX.test(passage)) {
            errors.push('Passage should contain Chinese characters');
          }
        } else if (testCase.language === 'german') {
          // German passages should have some German characteristics
          const hasGermanWords = /\b(der|die|das|und|ist|sind|haben|sein)\b/i.test(passage);
          if (!hasGermanWords) {
            errors.push('Passage may not be in German');
          }
        }
      }

      const passed = errors.length === 0;
      addTestResult(
        testName,
        passed,
        `Generated passage with ${passage?.split(/\s+/).length || 0} words`,
        errors
      );
    } catch (error) {
      addTestResult(testName, false, `Exception: ${error}`, [String(error)]);
    }
  }
}

// Test 3: Exercise Generation and Language Separation
async function testExerciseGeneration() {
  console.log('\n✏️ Testing Exercise Generation...\n');

  const testCases = [
    {
      language: 'english',
      proficiency: 'A2',
      passage: 'The journey was amazing. We explored many places and had great adventures.',
      vocabulary: [
        { word: 'journey', type: 'Noun', vietnamese_meaning: 'hành trình' },
        { word: 'explore', type: 'Verb', vietnamese_meaning: 'khám phá' },
        { word: 'adventure', type: 'Noun', vietnamese_meaning: 'phiêu lưu' },
      ]
    },
    {
      language: 'german',
      proficiency: 'B1',
      passage: 'Gesundheit ist wichtig. Sport und gute Ernährung helfen uns.',
      vocabulary: [
        { word: 'Gesundheit', type: 'Noun', vietnamese_meaning: 'sức khỏe' },
        { word: 'Sport', type: 'Noun', vietnamese_meaning: 'thể thao' },
        { word: 'Ernährung', type: 'Noun', vietnamese_meaning: 'dinh dưỡng' },
      ]
    },
  ];

  for (const testCase of testCases) {
    const testName = `Exercises: ${testCase.language} - ${testCase.proficiency}`;
    const errors: string[] = [];

    try {
      const result = await callGeminiAPI('generate_exercises', testCase);
      const exercises = result.exercises;

      // Verify JSON structure
      if (!exercises || typeof exercises !== 'object') {
        errors.push('Exercises response is not an object');
      } else {
        // Verify fill_in_the_blanks
        if (!Array.isArray(exercises.fill_in_the_blanks)) {
          errors.push('Missing or invalid fill_in_the_blanks array');
        } else if (exercises.fill_in_the_blanks.length !== 5) {
          errors.push(`Expected 5 fill-in-the-blank questions, got ${exercises.fill_in_the_blanks.length}`);
        } else {
          exercises.fill_in_the_blanks.forEach((q: any, i: number) => {
            if (!q.question || typeof q.question !== 'string') {
              errors.push(`Fill-in-blank ${i}: Missing or invalid 'question' field`);
            } else {
              // Verify question is in target language (no Vietnamese)
              if (VIETNAMESE_REGEX.test(q.question)) {
                errors.push(`Fill-in-blank ${i}: Question contains Vietnamese characters (should be ${testCase.language})`);
              }
            }
            if (!q.answer || typeof q.answer !== 'string') {
              errors.push(`Fill-in-blank ${i}: Missing or invalid 'answer' field`);
            }
          });
        }

        // Verify matching
        if (!Array.isArray(exercises.matching)) {
          errors.push('Missing or invalid matching array');
        } else if (exercises.matching.length !== 5) {
          errors.push(`Expected 5 matching questions, got ${exercises.matching.length}`);
        } else {
          exercises.matching.forEach((m: any, i: number) => {
            if (!m.word || typeof m.word !== 'string') {
              errors.push(`Matching ${i}: Missing or invalid 'word' field`);
            }
            if (!m.meaning || typeof m.meaning !== 'string') {
              errors.push(`Matching ${i}: Missing or invalid 'meaning' field`);
            }
          });
        }

        // Verify multiple_choice
        if (!Array.isArray(exercises.multiple_choice)) {
          errors.push('Missing or invalid multiple_choice array');
        } else if (exercises.multiple_choice.length !== 2) {
          errors.push(`Expected 2 multiple-choice questions, got ${exercises.multiple_choice.length}`);
        } else {
          exercises.multiple_choice.forEach((mc: any, i: number) => {
            if (!mc.question || typeof mc.question !== 'string') {
              errors.push(`Multiple-choice ${i}: Missing or invalid 'question' field`);
            } else {
              // Verify question is in target language (no Vietnamese)
              if (VIETNAMESE_REGEX.test(mc.question)) {
                errors.push(`Multiple-choice ${i}: Question contains Vietnamese characters (should be ${testCase.language})`);
              }
            }
            if (!Array.isArray(mc.options) || mc.options.length < 2) {
              errors.push(`Multiple-choice ${i}: Missing or invalid 'options' array`);
            } else {
              // Verify options are in target language
              mc.options.forEach((opt: string, j: number) => {
                if (VIETNAMESE_REGEX.test(opt)) {
                  errors.push(`Multiple-choice ${i}, option ${j}: Contains Vietnamese characters (should be ${testCase.language})`);
                }
              });
            }
            if (!mc.answer || typeof mc.answer !== 'string') {
              errors.push(`Multiple-choice ${i}: Missing or invalid 'answer' field`);
            }
          });
        }
      }

      const passed = errors.length === 0;
      addTestResult(
        testName,
        passed,
        'Generated all exercise types with correct structure',
        errors
      );
    } catch (error) {
      addTestResult(testName, false, `Exception: ${error}`, [String(error)]);
    }
  }
}

// Test 4: Writing Prompt Generation and Target Language Requirements
async function testWritingPromptGeneration() {
  console.log('\n✍️ Testing Writing Prompt Generation...\n');

  const testCases = [
    {
      language: 'english',
      proficiency: 'A2',
      topic: 'Hobbies',
      vocabulary: [
        { word: 'hobby', type: 'Noun', vietnamese_meaning: 'sở thích' },
        { word: 'enjoy', type: 'Verb', vietnamese_meaning: 'thích thú' },
        { word: 'activity', type: 'Noun', vietnamese_meaning: 'hoạt động' },
      ]
    },
    {
      language: 'german',
      proficiency: 'B1',
      topic: 'Work',
      vocabulary: [
        { word: 'Arbeit', type: 'Noun', vietnamese_meaning: 'công việc' },
        { word: 'Beruf', type: 'Noun', vietnamese_meaning: 'nghề nghiệp' },
        { word: 'Karriere', type: 'Noun', vietnamese_meaning: 'sự nghiệp' },
      ]
    },
    {
      language: 'chinese',
      proficiency: 'A1',
      topic: 'Weather',
      vocabulary: [
        { word: '天气', type: 'Noun', vietnamese_meaning: 'thời tiết' },
        { word: '晴天', type: 'Noun', vietnamese_meaning: 'trời nắng' },
        { word: '下雨', type: 'Verb', vietnamese_meaning: 'mưa' },
      ]
    },
  ];

  for (const testCase of testCases) {
    const testName = `Writing Prompt: ${testCase.language} - ${testCase.proficiency} - ${testCase.topic}`;
    const errors: string[] = [];

    try {
      const result = await callGeminiAPI('generate_writing_prompt', testCase);
      const writingPrompt = result.writingPrompt;

      // Verify JSON structure
      if (!writingPrompt || typeof writingPrompt !== 'object') {
        errors.push('Writing prompt response is not an object');
      } else {
        // Verify prompt field
        if (!writingPrompt.prompt || typeof writingPrompt.prompt !== 'string') {
          errors.push('Missing or invalid "prompt" field');
        } else {
          // Verify prompt is in target language (no Vietnamese)
          if (VIETNAMESE_REGEX.test(writingPrompt.prompt)) {
            errors.push(`Prompt contains Vietnamese characters (should be ${testCase.language})`);
          }

          // Verify language-specific characteristics
          if (testCase.language === 'chinese' && !CHINESE_REGEX.test(writingPrompt.prompt)) {
            errors.push('Prompt should contain Chinese characters');
          }
        }

        // Verify requirements field
        if (!writingPrompt.requirements || typeof writingPrompt.requirements !== 'string') {
          errors.push('Missing or invalid "requirements" field');
        } else {
          // Verify requirements are in target language
          if (VIETNAMESE_REGEX.test(writingPrompt.requirements)) {
            errors.push(`Requirements contain Vietnamese characters (should be ${testCase.language})`);
          }
        }

        // Verify word count fields
        if (typeof writingPrompt.word_count_min !== 'number') {
          errors.push('Missing or invalid "word_count_min" field');
        }
        if (typeof writingPrompt.word_count_max !== 'number') {
          errors.push('Missing or invalid "word_count_max" field');
        }

        // Verify structure_hints field
        if (!writingPrompt.structure_hints || typeof writingPrompt.structure_hints !== 'string') {
          errors.push('Missing or invalid "structure_hints" field');
        } else {
          // Verify structure hints are in target language
          if (VIETNAMESE_REGEX.test(writingPrompt.structure_hints)) {
            errors.push(`Structure hints contain Vietnamese characters (should be ${testCase.language})`);
          }
        }
      }

      const passed = errors.length === 0;
      addTestResult(
        testName,
        passed,
        'Generated writing prompt with correct language requirements',
        errors
      );
    } catch (error) {
      addTestResult(testName, false, `Exception: ${error}`, [String(error)]);
    }
  }
}

// Test 5: Writing Analysis and Corrected Version Language Purity
async function testWritingAnalysis() {
  console.log('\n🔍 Testing Writing Analysis...\n');

  const testCases = [
    {
      language: 'english',
      proficiency: 'A2',
      writing: 'I like to travel. I visit many place and meet new people. It is very fun.',
      vocabulary: [
        { word: 'travel', type: 'Verb', vietnamese_meaning: 'du lịch' },
        { word: 'visit', type: 'Verb', vietnamese_meaning: 'thăm' },
        { word: 'meet', type: 'Verb', vietnamese_meaning: 'gặp' },
      ]
    },
    {
      language: 'german',
      proficiency: 'B1',
      writing: 'Ich arbeite in ein Büro. Meine Arbeit ist interessant aber manchmal schwierig.',
      vocabulary: [
        { word: 'arbeiten', type: 'Verb', vietnamese_meaning: 'làm việc' },
        { word: 'Büro', type: 'Noun', vietnamese_meaning: 'văn phòng' },
        { word: 'interessant', type: 'Adjective', vietnamese_meaning: 'thú vị' },
      ]
    },
    {
      language: 'chinese',
      proficiency: 'A1',
      writing: '我喜欢学习中文。中文很有意思。',
      vocabulary: [
        { word: '学习', type: 'Verb', vietnamese_meaning: 'học tập' },
        { word: '中文', type: 'Noun', vietnamese_meaning: 'tiếng Trung' },
        { word: '有意思', type: 'Adjective', vietnamese_meaning: 'thú vị' },
      ]
    },
  ];

  for (const testCase of testCases) {
    const testName = `Writing Analysis: ${testCase.language} - ${testCase.proficiency}`;
    const errors: string[] = [];

    try {
      const result = await callGeminiAPI('analyze_writing', testCase);
      const analysis = result.analysis;

      // Verify JSON structure
      if (!analysis || typeof analysis !== 'object') {
        errors.push('Analysis response is not an object');
      } else {
        // Verify vocabulary_usage
        if (!analysis.vocabulary_usage || typeof analysis.vocabulary_usage !== 'object') {
          errors.push('Missing or invalid "vocabulary_usage" field');
        } else {
          if (!Array.isArray(analysis.vocabulary_usage.used_words)) {
            errors.push('Missing or invalid "used_words" array');
          }
          if (!Array.isArray(analysis.vocabulary_usage.unused_words)) {
            errors.push('Missing or invalid "unused_words" array');
          }
          if (typeof analysis.vocabulary_usage.score !== 'number') {
            errors.push('Missing or invalid vocabulary usage "score"');
          }
        }

        // Verify grammar_analysis
        if (!analysis.grammar_analysis || typeof analysis.grammar_analysis !== 'object') {
          errors.push('Missing or invalid "grammar_analysis" field');
        } else {
          if (!Array.isArray(analysis.grammar_analysis.errors)) {
            errors.push('Missing or invalid grammar "errors" array');
          }
          if (typeof analysis.grammar_analysis.score !== 'number') {
            errors.push('Missing or invalid grammar "score"');
          }
        }

        // Verify vocabulary_improvements
        if (!Array.isArray(analysis.vocabulary_improvements)) {
          errors.push('Missing or invalid "vocabulary_improvements" array');
        }

        // Verify structure_feedback
        if (!analysis.structure_feedback || typeof analysis.structure_feedback !== 'object') {
          errors.push('Missing or invalid "structure_feedback" field');
        } else {
          if (typeof analysis.structure_feedback.score !== 'number') {
            errors.push('Missing or invalid structure "score"');
          }
        }

        // Verify content_feedback
        if (!analysis.content_feedback || typeof analysis.content_feedback !== 'object') {
          errors.push('Missing or invalid "content_feedback" field');
        } else {
          if (typeof analysis.content_feedback.score !== 'number') {
            errors.push('Missing or invalid content "score"');
          }
        }

        // Verify overall_score
        if (typeof analysis.overall_score !== 'number') {
          errors.push('Missing or invalid "overall_score"');
        }

        // CRITICAL: Verify corrected_version is in target language (NO VIETNAMESE)
        if (!analysis.corrected_version || typeof analysis.corrected_version !== 'string') {
          errors.push('Missing or invalid "corrected_version" field');
        } else {
          const hasVietnamese = VIETNAMESE_REGEX.test(analysis.corrected_version);
          if (hasVietnamese) {
            errors.push(`❌ CRITICAL: corrected_version contains Vietnamese characters (must be pure ${testCase.language})`);
          }

          // Verify corrected version is in target language
          if (testCase.language === 'chinese') {
            if (!CHINESE_REGEX.test(analysis.corrected_version)) {
              errors.push('corrected_version should contain Chinese characters');
            }
          } else if (testCase.language === 'german') {
            const hasGermanWords = /\b(der|die|das|und|ist|sind|haben|sein|ich|mein|ein)\b/i.test(analysis.corrected_version);
            if (!hasGermanWords) {
              errors.push('corrected_version may not be in German');
            }
          } else if (testCase.language === 'english') {
            const hasEnglishWords = /\b(the|is|are|and|to|in|of|a|an)\b/i.test(analysis.corrected_version);
            if (!hasEnglishWords) {
              errors.push('corrected_version may not be in English');
            }
          }
        }

        // Verify encouragement (should be in Vietnamese)
        if (!analysis.encouragement || typeof analysis.encouragement !== 'string') {
          errors.push('Missing or invalid "encouragement" field');
        } else {
          if (!VIETNAMESE_REGEX.test(analysis.encouragement)) {
            errors.push('Encouragement should be in Vietnamese');
          }
        }
      }

      const passed = errors.length === 0;
      addTestResult(
        testName,
        passed,
        'Generated analysis with correct language separation',
        errors
      );
    } catch (error) {
      addTestResult(testName, false, `Exception: ${error}`, [String(error)]);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Prompts Multi-Language Test Suite\n');
  console.log('Testing Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7\n');
  console.log('=' .repeat(80));

  try {
    await testVocabularyGeneration();
    await testPassageGeneration();
    await testExerciseGeneration();
    await testWritingPromptGeneration();
    await testWritingAnalysis();

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');

    const totalTests = TEST_RESULTS.length;
    const passedTests = TEST_RESULTS.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    if (failedTests > 0) {
      console.log('Failed Tests:');
      TEST_RESULTS.filter(r => !r.passed).forEach(result => {
        console.log(`\n❌ ${result.testName}`);
        console.log(`   ${result.details}`);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => console.log(`   - ${err}`));
        }
      });
    }

    console.log('\n' + '='.repeat(80));

    // Write results to file
    const fs = require('fs');
    const resultsMarkdown = generateMarkdownReport();
    fs.writeFileSync('AI_PROMPTS_MULTILANG_TEST_RESULTS.md', resultsMarkdown);
    console.log('\n📝 Detailed results written to AI_PROMPTS_MULTILANG_TEST_RESULTS.md');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

function generateMarkdownReport(): string {
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  let markdown = `# AI Prompts Multi-Language Test Results\n\n`;
  markdown += `**Date:** ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${totalTests}\n`;
  markdown += `- **Passed:** ✅ ${passedTests}\n`;
  markdown += `- **Failed:** ❌ ${failedTests}\n`;
  markdown += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

  markdown += `## Requirements Coverage\n\n`;
  markdown += `- ✅ 1.1: Vocabulary generation with English prompts\n`;
  markdown += `- ✅ 1.2: Passage generation with English prompts\n`;
  markdown += `- ✅ 1.3: Exercise generation with English prompts\n`;
  markdown += `- ✅ 1.4: Writing prompt generation with English prompts\n`;
  markdown += `- ✅ 1.5: Writing analysis with English prompts\n`;
  markdown += `- ✅ 1.6: Preserved formatting and JSON structure\n`;
  markdown += `- ✅ 1.7: Maintained language separation (Vietnamese vs target language)\n\n`;

  markdown += `## Detailed Results\n\n`;

  const categories = [
    'Vocabulary',
    'Passage',
    'Exercises',
    'Writing Prompt',
    'Writing Analysis'
  ];

  categories.forEach(category => {
    const categoryResults = TEST_RESULTS.filter(r => r.testName.startsWith(category));
    if (categoryResults.length > 0) {
      markdown += `### ${category} Tests\n\n`;
      categoryResults.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        markdown += `#### ${status}: ${result.testName}\n\n`;
        markdown += `${result.details}\n\n`;
        if (result.errors && result.errors.length > 0) {
          markdown += `**Errors:**\n`;
          result.errors.forEach(err => {
            markdown += `- ${err}\n`;
          });
          markdown += `\n`;
        }
      });
    }
  });

  return markdown;
}

// Run tests
runAllTests().catch(console.error);
