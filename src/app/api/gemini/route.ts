import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Ưu tiên thử các model nhanh trước; chuyển model dự phòng khi quá tải (503)
const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
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
        const response = await result.response;
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
  // Map language names
  const languageMap: { [key: string]: string } = {
    "english": "tiếng Anh",
    "german": "tiếng Đức", 
    "chinese": "tiếng Trung",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;
  
  // Determine definition style based on proficiency
  const isBasicLevel = ["A1", "A2"].includes(proficiency);
  const definitionStyle = isBasicLevel 
    ? "Nghĩa tiếng Việt ngắn gọn và dễ hiểu" 
    : "Định nghĩa theo kiểu từ điển Cambridge (bằng tiếng Anh, ngắn gọn và chính xác)";

  const prompt = `Hãy tạo cho tôi một danh sách ${wordCount} từ vựng ${targetLanguage} liên quan đến chủ đề "${topic}".
Trình độ: ${proficiency}

Định dạng đầu ra phải là một JSON array gồm ${wordCount} object, mỗi object có các trường sau:
- "word": (Từ vựng ${targetLanguage})
- "type": (Loại từ vựng, ví dụ: Noun, Verb, Adjective)
- "vietnamese_meaning": (${definitionStyle})
${!isBasicLevel ? '- "english_definition": (Định nghĩa tiếng Anh theo kiểu Cambridge)' : ''}

Ví dụ về định dạng mong muốn:
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

  // Map language names
  const languageMap: { [key: string]: string } = {
    "english": "tiếng Anh",
    "german": "tiếng Đức", 
    "chinese": "tiếng Trung",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Sử dụng tất cả các từ vựng sau đây để tạo một đoạn văn bản ${targetLanguage} mạch lạc, hấp dẫn, dài khoảng 150-200 từ. 
Đoạn văn phải xoay quanh chủ đề chính là "${topic}".
Trình độ: ${proficiency}

Danh sách từ vựng cần sử dụng: ${wordList}.

Định dạng đầu ra chỉ là đoạn văn bản (text) không bao gồm bất kỳ lời dẫn hay giải thích nào khác.`;

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

  // Map language names
  const languageMap: { [key: string]: string } = {
    "english": "tiếng Anh",
    "german": "tiếng Đức", 
    "chinese": "tiếng Trung",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Dựa trên đoạn văn bản sau và danh sách từ vựng vừa được sử dụng, hãy tạo 3 dạng bài tập khác nhau để người dùng luyện tập và ghi nhớ từ vựng.

**Đoạn văn:** "${passage}"

**Từ vựng cần luyện tập:** ${wordList}.

**Ngôn ngữ:** ${targetLanguage}
**Trình độ:** ${proficiency}

Các dạng bài tập yêu cầu:
1. **5 câu hỏi Điền từ vào chỗ trống** (sử dụng 5 từ khác nhau từ danh sách).
2. **5 câu hỏi Nối từ với Định nghĩa/Nghĩa tiếng Việt** (chỉ cần đưa ra từ và định nghĩa/nghĩa tiếng Việt tương ứng).
3. **2 câu hỏi Trắc nghiệm** về cách sử dụng từ hoặc nội dung đoạn văn.

**Lưu ý quan trọng:**
- Tất cả câu hỏi và nội dung bài tập phải được viết bằng ${targetLanguage}
- Có thể thêm bản dịch tiếng Việt ở dưới mỗi câu hỏi để người mới có thể hiểu rõ hơn
- Độ khó của câu hỏi phải phù hợp với trình độ ${proficiency}

Định dạng đầu ra phải là JSON object bao gồm các trường sau:
- "fill_in_the_blanks": (Array các object câu hỏi và đáp án cho bài điền từ)
- "matching": (Array các object gồm "word" và "meaning" cho bài nối)
- "multiple_choice": (Array các object câu hỏi, lựa chọn và đáp án)`;

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

  // Map language names
  const languageMap: { [key: string]: string } = {
    "english": "tiếng Anh",
    "german": "tiếng Đức", 
    "chinese": "tiếng Trung",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Tạo một đề bài viết ${targetLanguage} để người học luyện tập sử dụng các từ vựng đã học.

**Chủ đề:** ${topic}
**Từ vựng cần sử dụng:** ${wordList}
**Trình độ:** ${proficiency}
**Ngôn ngữ:** ${targetLanguage}

Yêu cầu:
1. Tạo một đề bài viết thú vị và phù hợp với trình độ ${proficiency}
2. Yêu cầu người học sử dụng ít nhất 8-10 từ vựng từ danh sách đã cho
3. Đề bài phải liên quan đến chủ đề "${topic}"
4. Độ dài bài viết: 100-150 từ (cho trình độ A1-A2) hoặc 150-200 từ (cho trình độ B1+)
5. Cung cấp gợi ý về cấu trúc bài viết

Định dạng đầu ra phải là JSON object:
{
  "prompt": "Đề bài viết",
  "requirements": "Yêu cầu cụ thể về việc sử dụng từ vựng",
  "word_count_min": 100,
  "word_count_max": 150,
  "structure_hints": "Gợi ý cấu trúc bài viết"
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

  // Map language names
  const languageMap: { [key: string]: string } = {
    "english": "tiếng Anh",
    "german": "tiếng Đức", 
    "chinese": "tiếng Trung",
    "custom": language
  };
  
  const targetLanguage = languageMap[language] || language;

  const prompt = `Phân tích bài viết ${targetLanguage} của người học và đưa ra phản hồi chi tiết.

QUAN TRỌNG:
- Toàn bộ phản hồi, nội dung văn bản, lời giải thích và các giá trị trong JSON phải bằng tiếng Việt (vi-VN) ngoại trừ phần corrected_version: Phiên bản đã sửa của bài viết, không sử dụng tiếng Anh.
- Chỉ trả về JSON đúng cấu trúc, không thêm lời dẫn, không thêm tiền tố/hậu tố.

**Bài viết của người học:**
"${writing}"

**Từ vựng cần sử dụng:** ${wordList}
**Trình độ:** ${proficiency}
**Ngôn ngữ:** ${targetLanguage}

Yêu cầu phân tích:
1. **Sử dụng từ vựng:** Kiểm tra xem người học đã sử dụng bao nhiêu từ vựng từ danh sách, đánh dấu các từ đã sử dụng
2. **Ngữ pháp:** Tìm và sửa các lỗi ngữ pháp, giải thích ngắn gọn
3. **Từ vựng:** Đề xuất từ vựng tốt hơn cho các từ đơn giản
4. **Cấu trúc:** Đánh giá cấu trúc câu và đoạn văn
5. **Nội dung:** Đánh giá tính mạch lạc và logic của bài viết
6. **Điểm số:** Chấm điểm từ 1-10 cho từng tiêu chí

Định dạng đầu ra phải là JSON object:
{
  "vocabulary_usage": {
    "used_words": ["từ1", "từ2"],
    "unused_words": ["từ3", "từ4"],
    "usage_count": 8,
    "total_words": 20,
    "score": 8
  },
  "grammar_analysis": {
    "errors": [
      {
        "sentence": "câu có lỗi",
        "error": "mô tả lỗi",
        "correction": "câu đã sửa",
        "explanation": "giải thích"
      }
    ],
    "score": 7
  },
  "vocabulary_improvements": [
    {
      "original": "từ đơn giản",
      "suggestion": "từ tốt hơn",
      "reason": "lý do"
    }
  ],
  "structure_feedback": {
    "strengths": ["điểm mạnh"],
    "improvements": ["điểm cần cải thiện"],
    "score": 8
  },
  "content_feedback": {
    "coherence": "đánh giá tính mạch lạc",
    "completeness": "đánh giá tính đầy đủ",
    "score": 9
  },
  "overall_score": 8,
  "corrected_version": "Phiên bản đã sửa của bài viết",
  "encouragement": "Lời khích lệ và gợi ý cải thiện"
}`;

  try {
    const text = await generateTextWithRetry(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
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
