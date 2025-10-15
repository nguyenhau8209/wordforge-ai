import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      topic,
      wordCount = 20,
      vocabulary,
      passage,
    } = await request.json();

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Trong file bạn có đoạn genAI.getGenerativeModel
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // SỬA TẠI ĐÂY

    switch (action) {
      case "generate_vocabulary":
        return await generateVocabulary(model, topic, wordCount);

      case "generate_passage":
        return await generatePassage(model, topic, vocabulary);

      case "generate_exercises":
        return await generateExercises(model, passage, vocabulary);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function generateVocabulary(
  model: any,
  topic: string,
  wordCount: number
) {
  const prompt = `Hãy tạo cho tôi một danh sách ${wordCount} từ vựng tiếng Anh liên quan đến chủ đề "${topic}".

Định dạng đầu ra phải là một JSON array gồm ${wordCount} object, mỗi object có các trường sau:
- "word": (Từ vựng tiếng Anh)
- "type": (Loại từ vựng, ví dụ: Noun, Verb, Adjective)
- "vietnamese_meaning": (Nghĩa tiếng Việt ngắn gọn)

Ví dụ về định dạng mong muốn:
[
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
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const vocabulary = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to generate vocabulary" },
      { status: 500 }
    );
  }
}

async function generatePassage(model: any, topic: string, vocabulary: any[]) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  const prompt = `Sử dụng tất cả các từ vựng sau đây để tạo một đoạn văn bản tiếng Anh mạch lạc, hấp dẫn, dài khoảng 150-200 từ. Đoạn văn phải xoay quanh chủ đề chính là "${topic}".

Danh sách từ vựng cần sử dụng: ${wordList}.

Định dạng đầu ra chỉ là đoạn văn bản (text) không bao gồm bất kỳ lời dẫn hay giải thích nào khác.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const passage = response.text().trim();

    return NextResponse.json({ passage });
  } catch (error) {
    console.error("Error generating passage:", error);
    return NextResponse.json(
      { error: "Failed to generate passage" },
      { status: 500 }
    );
  }
}

async function generateExercises(
  model: any,
  passage: string,
  vocabulary: any[]
) {
  const wordList = vocabulary.map((v) => v.word).join(", ");

  const prompt = `Dựa trên đoạn văn bản sau và danh sách từ vựng vừa được sử dụng, hãy tạo 3 dạng bài tập khác nhau để người dùng luyện tập và ghi nhớ từ vựng.

**Đoạn văn:** "${passage}"

**Từ vựng cần luyện tập:** ${wordList}.

Các dạng bài tập yêu cầu:
1. **5 câu hỏi Điền từ vào chỗ trống** (sử dụng 5 từ khác nhau từ danh sách).
2. **5 câu hỏi Nối từ với Định nghĩa/Nghĩa tiếng Việt** (chỉ cần đưa ra từ và định nghĩa/nghĩa tiếng Việt tương ứng).
3. **2 câu hỏi Trắc nghiệm** về cách sử dụng từ hoặc nội dung đoạn văn.

Định dạng đầu ra phải là JSON object bao gồm các trường sau:
- "fill_in_the_blanks": (Array các object câu hỏi và đáp án cho bài điền từ)
- "matching": (Array các object gồm "word" và "meaning" cho bài nối)
- "multiple_choice": (Array các object câu hỏi, lựa chọn và đáp án)`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const exercises = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("Error generating exercises:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises" },
      { status: 500 }
    );
  }
}
