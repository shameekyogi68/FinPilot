import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(goals)
  } catch (error) {
    console.error("GET /api/goals error:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, targetAmount, currentAmount, deadline } = body

    if (!name || targetAmount === undefined) {
      return NextResponse.json({ error: "Name and targetAmount are required" }, { status: 400 })
    }

    const newGoal = await prisma.goal.create({
      data: {
        name,
        targetAmount: Number(targetAmount),
        currentAmount: currentAmount ? Number(currentAmount) : 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    })

    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error("POST /api/goals error:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
