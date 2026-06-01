import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, checkRateLimit, safeErrorResponse } from "@/lib/middleware"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authError = authenticateRequest(request)
  if (authError) return authError

  const rateLimitError = checkRateLimit(request, 2, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.budget.deleteMany(),
      prisma.goal.deleteMany(),
      prisma.category.deleteMany(),
      prisma.aICache.deleteMany(),
      prisma.profile.deleteMany(),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return safeErrorResponse(error, "Delete data")
  }
}
