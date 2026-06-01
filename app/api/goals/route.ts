import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 100, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const goals = await prisma.goal.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(goals)
  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch goals")
  }
}

export async function POST(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 30, 60_000)
  if (rateLimitError) return rateLimitError

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
    return safeErrorResponse(error, "Failed to create goal")
  }
}
