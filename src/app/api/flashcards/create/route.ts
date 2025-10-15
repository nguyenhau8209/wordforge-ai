import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { word, deckId } = await request.json()

    if (!word || !deckId) {
      return NextResponse.json({ error: "Word and deckId are required" }, { status: 400 })
    }

    // Verify deck belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: session.user.id
      }
    })

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 })
    }

    // Call OpenAI API to generate flashcard content
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a language learning assistant. Create a comprehensive flashcard for the word "${word}". 
            Return a JSON object with the following structure:
            {
              "definition": "Clear, concise definition in English",
              "pronunciation": "IPA pronunciation",
              "example": "Example sentence using the word",
              "difficulty": 1-5 (1=easy, 5=hard)
            }`
          },
          {
            role: "user",
            content: `Create a flashcard for the word: ${word}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error("OpenAI API error")
    }

    const openaiData = await openaiResponse.json()
    const content = JSON.parse(openaiData.choices[0].message.content)

    // Generate audio URL using Google TTS (placeholder for now)
    const audioUrl = `https://api.voicerss.org/?key=${process.env.GOOGLE_TTS_API_KEY}&hl=en-us&src=${encodeURIComponent(word)}`

    // Generate image URL using DALL-E (placeholder for now)
    const imageUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(word)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`

    // Create flashcard in database
    const flashcard = await prisma.flashcard.create({
      data: {
        front: word,
        back: content.definition,
        pronunciation: content.pronunciation,
        audioUrl: audioUrl,
        imageUrl: imageUrl,
        example: content.example,
        difficulty: content.difficulty,
        deckId: deckId,
      },
    })

    return NextResponse.json(flashcard)
  } catch (error) {
    console.error("Error creating flashcard:", error)
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    )
  }
}
