import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// SuperMemo algorithm implementation
function calculateNextReview(quality: number, interval: number, repetitions: number, easeFactor: number) {
  if (quality < 3) {
    // If quality is less than 3, reset the card
    return {
      interval: 1,
      repetitions: 0,
      easeFactor: Math.max(1.3, easeFactor - 0.2)
    }
  }

  let newInterval: number
  let newRepetitions: number
  let newEaseFactor: number

  if (repetitions === 0) {
    newInterval = 1
  } else if (repetitions === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * easeFactor)
  }

  newRepetitions = repetitions + 1

  // Calculate new ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor)

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { flashcardId, quality } = await request.json()

    if (!flashcardId || quality === undefined) {
      return NextResponse.json({ error: "FlashcardId and quality are required" }, { status: 400 })
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json({ error: "Quality must be between 0 and 5" }, { status: 400 })
    }

    // Get existing review or create new one
    let review = await prisma.review.findUnique({
      where: {
        flashcardId_userId: {
          flashcardId: flashcardId,
          userId: session.user.id
        }
      }
    })

    const now = new Date()
    const nextReview = new Date(now.getTime() + (review?.interval || 1) * 24 * 60 * 60 * 1000)

    if (review) {
      // Update existing review
      const newData = calculateNextReview(quality, review.interval, review.repetitions, review.easeFactor)
      
      review = await prisma.review.update({
        where: { id: review.id },
        data: {
          quality,
          interval: newData.interval,
          repetitions: newData.repetitions,
          easeFactor: newData.easeFactor,
          nextReview: new Date(now.getTime() + newData.interval * 24 * 60 * 60 * 1000),
          updatedAt: now
        }
      })
    } else {
      // Create new review
      const newData = calculateNextReview(quality, 1, 0, 2.5)
      
      review = await prisma.review.create({
        data: {
          flashcardId,
          userId: session.user.id,
          quality,
          interval: newData.interval,
          repetitions: newData.repetitions,
          easeFactor: newData.easeFactor,
          nextReview: new Date(now.getTime() + newData.interval * 24 * 60 * 60 * 1000)
        }
      })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get('deckId')

    // Get flashcards due for review
    const dueFlashcards = await prisma.flashcard.findMany({
      where: {
        deckId: deckId || undefined,
        deck: {
          userId: session.user.id
        },
        OR: [
          {
            reviews: {
              none: {}
            }
          },
          {
            reviews: {
              some: {
                nextReview: {
                  lte: new Date()
                }
              }
            }
          }
        ]
      },
      include: {
        reviews: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    return NextResponse.json(dueFlashcards)
  } catch (error) {
    console.error("Error fetching due flashcards:", error)
    return NextResponse.json(
      { error: "Failed to fetch due flashcards" },
      { status: 500 }
    )
  }
}
