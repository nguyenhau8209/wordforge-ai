import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Sử dụng các model Gemini mới nhất (tháng 11/2025)
const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",      // Model mới nhất, nhanh và mạnh (experimental)
  "gemini-1.5-flash-latest",   // Flash model ổn định nhất
];

function isTransientGeminiError(error: unknown): boolean {
  const message = String(error);
  // Nhận diện 503/overloaded/timeouts từ SDK/Gateway
  return (
    message.includes("503") ||
    message.toLowerCase().includes("service unavailable") ||
    message.toLowerCase().includes("overloaded") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("temporarily")
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gọi Gemini với retry + exponential backoff + model fallback
async function generateTextWithRetry(
  prompt: string,
  models: string[] = PREFERRED_MODELS,
  maxRetriesPerModel = 3
): Promise<string> {
  let lastError: unknown;

  for (const modelName of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        const transient = isTransientGeminiError(error);
        const delayMs = Math.min(
          2000 + Math.floor(Math.random() * 300), // jitter
          5000
        ) * Math.pow(2, attempt); // exponential backoff

        if (transient && attempt < maxRetriesPerModel - 1) {
          await sleep(delayMs);
          continue;
        }

        // Nếu lỗi không phải transient, chuyển ngay sang model kế tiếp
        if (!transient) break;
      }
    }
    // Thử model tiếp theo
  }

  throw lastError ?? new Error("Gemini generation failed");
}

interface VocabularyItem {
  word: string;
  type: string;
  vietnamese_meaning: string;
  english_definition?: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      topic,
      wordCount = 20,
      language = "english",
      proficiency = "A2",
      vocabulary,
      passage,
      writing,
    } = await request.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured" },
        { status: 500 }
      );
    }

    switch (action) {
      case "generate_vocabulary":
        return await generateVocabulary(topic, wordCount, language, proficiency);

      case "generate_passage":
        return await generatePassage(topic, vocabulary, language, proficiency);

      case "generate_exercises":
        return await generateExercises(passage, vocabulary, language, proficiency);

      case "generate_writing_prompt":
        return await generateWritingPrompt(topic, vocabulary, language, proficiency);

      case "analyze_writing":
        return await analyzeWriting(writing, vocabulary, language, proficiency);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to process request",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau ít phút."
            : undefined,
      },
      { status }
    );
  }
}

async function generateVocabulary(
  topic: string,
  wordCount: number,
  language: string,
  proficiency: string
) {
  // Map language names to English for the prompt
  const languageMap: { [key: string]: string } = {
    "english": "English",
    "german": "German", 
    "chinese": "Chinese",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;
  
  // Determine definition style based on proficiency
  const isBasicLevel = ["A1", "A2"].includes(proficiency);
  const definitionStyle = isBasicLevel 
    ? "Brief and easy-to-understand Vietnamese meaning" 
    : "Cambridge dictionary style definition (in English, concise and accurate)";

  const prompt = `Generate a list of ${wordCount} ${targetLanguage} vocabulary words related to the topic "${topic}".
Proficiency level: ${proficiency}

The output format must be a JSON array of ${wordCount} objects, each with the following fields:
- "word": (The ${targetLanguage} vocabulary word)
- "type": (Part of speech, e.g., Noun, Verb, Adjective)
- "vietnamese_meaning": (${definitionStyle})
${!isBasicLevel ? '- "english_definition": (English definition in Cambridge dictionary style)' : ''}

Example of expected format:
${isBasicLevel ? `[
  {
    "word": "sustainability",
    "type": "Noun",
    "vietnamese_meaning": "tính bền vững"
  },
  {
    "word": "innovative",
    "type": "Adjective", 
    "vietnamese_meaning": "sáng tạo"
  }
]` : `[
  {
    "word": "sustainability",
    "type": "Noun",
    "vietnamese_meaning": "tính bền vững",
    "english_definition": "the ability to continue at a particular level for a period of time"
  },
  {
    "word": "innovative",
    "type": "Adjective", 
    "vietnamese_meaning": "sáng tạo",
    "english_definition": "introducing or using new ideas or methods"
  }
]`}`;

  try {
    const text = await generateTextWithRetry(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const vocabulary = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to generate vocabulary",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau."
            : undefined,
      },
      { status }
    );
  }
}

async function generatePassage(topic: string, vocabulary: VocabularyItem[], language: string, proficiency: string) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  // Map language names to English for the prompt
  const languageMap: { [key: string]: string } = {
    "english": "English",
    "german": "German", 
    "chinese": "Chinese",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Use all of the following vocabulary words to create a coherent, engaging ${targetLanguage} passage approximately 150-200 words long.
The passage should revolve around the main topic: "${topic}".
Proficiency level: ${proficiency}

Vocabulary words to use: ${wordList}.

The output format should be only the passage text, without any introductory phrases or additional explanations.`;

  try {
    const passage = (await generateTextWithRetry(prompt)).trim();

    return NextResponse.json({ passage });
  } catch (error) {
    console.error("Error generating passage:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to generate passage",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau."
            : undefined,
      },
      { status }
    );
  }
}

async function generateExercises(
  passage: string,
  vocabulary: VocabularyItem[],
  language: string,
  proficiency: string
) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  // Map language names to English for the prompt
  const languageMap: { [key: string]: string } = {
    "english": "English",
    "german": "German", 
    "chinese": "Chinese",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Based on the following passage and the vocabulary words just used, create 3 different types of exercises for users to practice and memorize the vocabulary.

**Passage:** "${passage}"

**Vocabulary to practice:** ${wordList}.

**Language:** ${targetLanguage}
**Proficiency level:** ${proficiency}

Required exercise types:
1. **5 Fill-in-the-blank questions** (using 5 different words from the list).
2. **5 Matching questions** (match words with definitions/Vietnamese meanings).
3. **2 Multiple-choice questions** about word usage or passage content.

**IMPORTANT LANGUAGE REQUIREMENTS:**
- All questions (question field) must be written entirely in ${targetLanguage}
- The "translation" field (if present) contains the Vietnamese translation of the question
- All answers and options must be in ${targetLanguage}
- Do not mix Vietnamese into question content or answer options
- Question difficulty must match the ${proficiency} proficiency level

The output format must be a JSON object with the following fields:
- "fill_in_the_blanks": (Array of question and answer objects for fill-in-the-blank exercises)
- "matching": (Array of objects with "word" and "meaning" for matching exercises)
- "multiple_choice": (Array of objects with question, options, and answer)`;

  try {
    const text = await generateTextWithRetry(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const exercises = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("Error generating exercises:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to generate exercises",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau."
            : undefined,
      },
      { status }
    );
  }
}

async function generateWritingPrompt(
  topic: string,
  vocabulary: VocabularyItem[],
  language: string,
  proficiency: string
) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  // Map language names to English for the prompt
  const languageMap: { [key: string]: string } = {
    "english": "English",
    "german": "German", 
    "chinese": "Chinese",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Create a writing prompt for learners to practice using the vocabulary they have learned.

**Topic:** ${topic}
**Vocabulary to use:** ${wordList}
**Proficiency level:** ${proficiency}
**Target language:** ${targetLanguage}

**IMPORTANT LANGUAGE REQUIREMENTS:**
- The writing prompt must be in ${targetLanguage} and require learners to write in ${targetLanguage}
- Requirements must be in ${targetLanguage}
- Structure hints must be in ${targetLanguage}
- Make it clear in the prompt that learners must write in ${targetLanguage}

Requirements:
1. The writing prompt must be in ${targetLanguage} and require learners to write in ${targetLanguage}
2. Require learners to use at least 8-10 vocabulary words from the provided list
3. The prompt must relate to the topic "${topic}"
4. Word count: 100-150 words (for A1-A2 levels) or 150-200 words (for B1+ levels)
5. Provide structure hints in ${targetLanguage}

The output format must be a JSON object:
{
  "prompt": "Writing prompt in ${targetLanguage}, requiring writing in ${targetLanguage}",
  "requirements": "Specific requirements about vocabulary usage (in ${targetLanguage})",
  "word_count_min": 100,
  "word_count_max": 150,
  "structure_hints": "Writing structure hints (in ${targetLanguage})"
}`;

  try {
    const text = await generateTextWithRetry(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const writingPrompt = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ writingPrompt });
  } catch (error) {
    console.error("Error generating writing prompt:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to generate writing prompt",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau."
            : undefined,
      },
      { status }
    );
  }
}

async function analyzeWriting(
  writing: string,
  vocabulary: VocabularyItem[],
  language: string,
  proficiency: string
) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  // Map language names to English for the prompt
  const languageMap: { [key: string]: string } = {
    "english": "English",
    "german": "German", 
    "chinese": "Chinese",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Analyze the learner's ${targetLanguage} writing and provide detailed feedback.

**IMPORTANT LANGUAGE REQUIREMENTS:**
- All feedback, explanation, and analysis fields must be in Vietnamese
- The "corrected_version" field must be entirely in ${targetLanguage} (no Vietnamese)
- This is a ${targetLanguage} writing assignment, so the corrected version must be pure ${targetLanguage}
- Return only the JSON structure, no additional prefixes or suffixes

**Learner's writing:**
"${writing}"

**Vocabulary to use:** ${wordList}
**Proficiency level:** ${proficiency}
**Language:** ${targetLanguage}

Analysis requirements:
1. **Vocabulary usage:** Check how many vocabulary words from the list the learner used, mark the words used
2. **Grammar:** Find and correct grammar errors, provide brief explanations
3. **Vocabulary:** Suggest better vocabulary for simple words
4. **Structure:** Evaluate sentence and paragraph structure
5. **Content:** Evaluate coherence and logic of the writing
6. **Scoring:** Score from 1-10 for each criterion

The output format must be a JSON object:
{
  "vocabulary_usage": {
    "used_words": ["word1", "word2"],
    "unused_words": ["word3", "word4"],
    "usage_count": 8,
    "total_words": 20,
    "score": 8
  },
  "grammar_analysis": {
    "errors": [
      {
        "sentence": "sentence with error",
        "error": "error description",
        "correction": "corrected sentence",
        "explanation": "explanation"
      }
    ],
    "score": 7
  },
  "vocabulary_improvements": [
    {
      "original": "simple word",
      "suggestion": "better word",
      "reason": "reason"
    }
  ],
  "structure_feedback": {
    "strengths": ["strength"],
    "improvements": ["area to improve"],
    "score": 8
  },
  "content_feedback": {
    "coherence": "coherence assessment",
    "completeness": "completeness assessment",
    "score": 9
  },
  "overall_score": 8,
  "corrected_version": "Corrected version of the writing",
  "encouragement": "Encouragement and improvement suggestions"
}`;

  try {
    const text = await generateTextWithRetry(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Development mode language verification
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const correctedVersion = analysis.corrected_version || '';
      const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const hasVietnamese = vietnameseRegex.test(correctedVersion);
      
      console.log('[DEBUG] Language verification for corrected_version:', {
        hasVietnamese,
        targetLanguage,
        preview: correctedVersion.substring(0, 100)
      });
    }
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing writing:", error);
    const status = isTransientGeminiError(error) ? 503 : 500;
    return NextResponse.json(
      {
        error: "Failed to analyze writing",
        suggestion:
          status === 503
            ? "Dịch vụ AI đang quá tải. Vui lòng thử lại sau."
            : undefined,
      },
      { status }
    );
  }
}
