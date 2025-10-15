import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decks = await prisma.deck.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            flashcards: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(decks)
  } catch (error) {
    console.error("Error fetching decks:", error)
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const deck = await prisma.deck.create({
      data: {
        name,
        description: description || null,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            flashcards: true
          }
        }
      }
    })

    return NextResponse.json(deck)
  } catch (error) {
    console.error("Error creating deck:", error)
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    )
  }
}
